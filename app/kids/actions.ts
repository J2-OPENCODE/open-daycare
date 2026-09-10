"use server";

import "server-only";

import { validateAddKidFormValues } from "@/lib/add-kid-form";
import { getAuthAccessState } from "@/lib/auth";
import { renderParentInvitationEmail } from "@/lib/email/parent-invitation-email";
import {
  buildActivationUrl,
  buildInvitationIdempotencyKey,
  cancelPendingInvitation,
  CHILD_UNAVAILABLE_MESSAGE,
  computeInvitationExpiry,
  confirmInvitationSent,
  countInvitationsByActor,
  countInvitationsForTarget,
  findActiveChildForInvitation,
  findRoomName,
  generateInvitationCode,
  generateInvitationToken,
  hashInvitationSecret,
  hasLinkedParentWithEmail,
  INVITATION_CONFLICT_MESSAGE,
  INVITATION_ERROR_MESSAGE,
  INVITATION_RATE_LIMIT,
  INVITATION_RATE_LIMIT_MESSAGE,
  normalizeEmail,
  replaceParentInvitation,
  sendInvitationEmail,
} from "@/lib/invitations";
import {
  isLinkParentRelationship,
  toPersistedRelationship,
  validateParentEmail,
  validateParentName,
  validateRelationship,
} from "@/lib/link-parent-form";
import type { TablesInsert } from "@/types/database";
import type {
  CreateParentInvitationField,
  CreateParentInvitationInput,
  CreateParentInvitationResult,
} from "@/types/invitations";
import type {
  AddKidActionResult,
  AddKidField,
  AddKidFormValues,
} from "@/types/kids";
import { createAdminClient } from "@/utils/supabase/admin";
import type { AdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import type { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const MAX_KID_SLUG_LENGTH = 120;
const SLUG_CONSTRAINT_NAME = "children_daycare_slug_key";
const slugDiacriticMarks = /[\u0300-\u036f]/g;
const FORM_FIELDS = [
  "fullName",
  "birthDate",
  "roomId",
  "allergies",
  "medicalNotes",
] as const satisfies readonly AddKidField[];

function createSlugBase(fullName: string) {
  const normalized = fullName
    .trim()
    .normalize("NFD")
    .replace(slugDiacriticMarks, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const base = normalized || "nino";

  return base.slice(0, MAX_KID_SLUG_LENGTH).replace(/-+$/g, "") || "nino";
}

function createSlugCandidate(base: string, sequence: number) {
  if (sequence === 1) {
    return base;
  }

  const suffix = `-${sequence}`;
  const prefix = base
    .slice(0, MAX_KID_SLUG_LENGTH - suffix.length)
    .replace(/-+$/g, "");

  return `${prefix}${suffix}`;
}

function isSlugCollision(error: PostgrestError) {
  return (
    error.code === "23505" &&
    [error.message, error.details, error.hint].some((value) =>
      value?.includes(SLUG_CONSTRAINT_NAME),
    )
  );
}

function getDaysInMonth(year: number, month: number) {
  const isLeapYear =
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return days[month - 1];
}

function isIsoCalendarDate(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const daysInMonth = getDaysInMonth(year, month);

  return year > 0 && Boolean(daysInMonth) && day >= 1 && day <= daysInMonth;
}

function parseFormInput(input: unknown) {
  const errors: Partial<Record<AddKidField, string>> = {};

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    for (const field of FORM_FIELDS) {
      errors[field] = "El valor enviado no es válido.";
    }

    return { status: "invalid" as const, errors };
  }

  const record = input as Record<string, unknown>;

  for (const field of FORM_FIELDS) {
    if (typeof record[field] !== "string") {
      errors[field] = "El valor enviado no es válido.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { status: "invalid" as const, errors };
  }

  return {
    status: "valid" as const,
    data: {
      fullName: record.fullName as string,
      birthDate: record.birthDate as string,
      roomId: record.roomId as string,
      allergies: record.allergies as string,
      medicalNotes: record.medicalNotes as string,
    } satisfies AddKidFormValues,
  };
}

export async function addKid(
  input: AddKidFormValues,
  enrolledAt: string,
): Promise<AddKidActionResult> {
  const parsedInput = parseFormInput(input);

  if (parsedInput.status === "invalid") {
    return parsedInput;
  }

  const validation = validateAddKidFormValues(parsedInput.data, new Date());

  if (validation.status === "invalid") {
    return validation;
  }

  if (!isIsoCalendarDate(enrolledAt)) {
    return {
      status: "error",
      message: "No pudimos validar la fecha de ingreso.",
    };
  }

  if (validation.data.birthDate > enrolledAt) {
    return {
      status: "invalid",
      errors: {
        birthDate: "La fecha de nacimiento no puede ser posterior al ingreso.",
      },
    };
  }

  let access: Awaited<ReturnType<typeof getAuthAccessState>>;

  try {
    access = await getAuthAccessState();
  } catch {
    return {
      status: "error",
      message: "No pudimos verificar tu cuenta. Intentá nuevamente.",
    };
  }

  if (access.status === "anonymous") {
    return {
      status: "error",
      message: "Iniciá sesión para agregar niños.",
    };
  }

  if (access.status !== "active" || access.role === "parent") {
    return {
      status: "error",
      message: "No tenés permisos para agregar niños.",
    };
  }

  const supabase = await createClient();
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", validation.data.roomId)
    .eq("daycare_id", access.daycareId)
    .maybeSingle();

  if (roomError) {
    return {
      status: "error",
      message: "No pudimos verificar la sala. Intentá nuevamente.",
    };
  }

  if (!room) {
    return {
      status: "invalid",
      errors: { roomId: "Seleccioná una sala válida." },
    };
  }

  const slugBase = createSlugBase(validation.data.fullName);
  let sequence = 1;

  while (true) {
    const slug = createSlugCandidate(slugBase, sequence);
    const child = {
      daycare_id: access.daycareId,
      room_id: room.id,
      slug,
      full_name: validation.data.fullName,
      birth_date: validation.data.birthDate,
      enrolled_at: enrolledAt,
      medical_notes: validation.data.medicalNotes,
      allergy_tags: validation.data.allergyTags,
    } satisfies TablesInsert<"children">;
    const { error: insertError } = await supabase.from("children").insert(child);

    if (!insertError) {
      revalidatePath("/kids");
      return { status: "success", slug };
    }

    if (!isSlugCollision(insertError)) {
      return {
        status: "error",
        message: "No pudimos agregar al niño. Intentá nuevamente.",
      };
    }

    sequence += 1;
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type UntrustedInvitationInput = {
  childId: string;
  parentName: string;
  email: string;
  relationship: unknown;
};

/** Every argument arrives from the browser, so nothing is assumed about it. */
function parseInvitationInput(input: unknown): UntrustedInvitationInput | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const record = input as Record<string, unknown>;

  if (
    typeof record.childId !== "string" ||
    typeof record.parentName !== "string" ||
    typeof record.email !== "string"
  ) {
    return null;
  }

  return {
    childId: record.childId,
    parentName: record.parentName,
    email: record.email,
    relationship: record.relationship,
  };
}

export async function createParentInvitation(
  input: CreateParentInvitationInput,
): Promise<CreateParentInvitationResult> {
  const parsedInput = parseInvitationInput(input);

  if (!parsedInput) {
    return { status: "error", message: INVITATION_ERROR_MESSAGE };
  }

  // Re-authorize inside the action even though the page is already protected.
  let access: Awaited<ReturnType<typeof getAuthAccessState>>;

  try {
    access = await getAuthAccessState();
  } catch {
    return {
      status: "error",
      message: "No pudimos verificar tu cuenta. Intentá nuevamente.",
    };
  }

  if (access.status === "anonymous") {
    return { status: "error", message: "Iniciá sesión para invitar padres." };
  }

  if (access.status !== "active" || access.role === "parent") {
    return { status: "error", message: "No tenés permisos para invitar padres." };
  }

  const errors: Partial<Record<CreateParentInvitationField, string>> = {};
  const parentNameError = validateParentName(parsedInput.parentName);
  const emailError = validateParentEmail(parsedInput.email);
  const relationshipError = validateRelationship(parsedInput.relationship);

  if (parentNameError) {
    errors.parentName = parentNameError;
  }

  if (emailError) {
    errors.email = emailError;
  }

  if (relationshipError) {
    errors.relationship = relationshipError;
  }

  // Neither Supabase nor Resend is called while a visible field is invalid.
  if (Object.keys(errors).length > 0) {
    return { status: "invalid", errors };
  }

  if (!isLinkParentRelationship(parsedInput.relationship)) {
    return {
      status: "invalid",
      errors: { relationship: "Elegí un parentesco válido." },
    };
  }

  if (!UUID_PATTERN.test(parsedInput.childId)) {
    return { status: "error", message: CHILD_UNAVAILABLE_MESSAGE };
  }

  const parentName = parsedInput.parentName.trim();
  const normalizedEmail = normalizeEmail(parsedInput.email);
  const relationship = toPersistedRelationship(parsedInput.relationship);
  const now = new Date();
  let admin: AdminClient;

  // Absent or malformed private configuration fails before any external call.
  try {
    admin = createAdminClient();
  } catch {
    return { status: "error", message: INVITATION_ERROR_MESSAGE };
  }

  let child: Awaited<ReturnType<typeof findActiveChildForInvitation>>;
  let roomName: string | null;

  try {
    child = await findActiveChildForInvitation(
      admin,
      parsedInput.childId,
      access.daycareId,
    );

    // A missing, archived or foreign-tenant child yields the same message.
    if (!child) {
      return { status: "error", message: CHILD_UNAVAILABLE_MESSAGE };
    }

    roomName = await findRoomName(admin, child.room_id, access.daycareId);

    if (!roomName) {
      return { status: "error", message: CHILD_UNAVAILABLE_MESSAGE };
    }

    const [actorCount, targetCount] = await Promise.all([
      countInvitationsByActor(admin, access.userId, now),
      countInvitationsForTarget(admin, child.id, normalizedEmail, now),
    ]);

    if (
      actorCount >= INVITATION_RATE_LIMIT ||
      targetCount >= INVITATION_RATE_LIMIT
    ) {
      return { status: "rate_limited", message: INVITATION_RATE_LIMIT_MESSAGE };
    }

    if (await hasLinkedParentWithEmail(admin, child.id, normalizedEmail)) {
      return { status: "conflict", message: INVITATION_CONFLICT_MESSAGE };
    }
  } catch {
    return { status: "error", message: INVITATION_ERROR_MESSAGE };
  }

  const issuedAt = new Date();
  const code = generateInvitationCode();
  const token = generateInvitationToken();
  let invitationId: string;

  try {
    invitationId = await replaceParentInvitation(admin, {
      childId: child.id,
      invitedBy: access.userId,
      fullName: parentName,
      normalizedEmail,
      relationship,
      codeDigest: hashInvitationSecret(code),
      tokenDigest: hashInvitationSecret(token),
      expiresAt: computeInvitationExpiry(issuedAt),
    });
  } catch {
    return { status: "error", message: INVITATION_ERROR_MESSAGE };
  }

  let email: ReturnType<typeof renderParentInvitationEmail>;

  try {
    email = renderParentInvitationEmail({
      parentName,
      kidName: child.full_name,
      roomLabel: `Sala ${roomName}`,
      code,
      activationUrl: buildActivationUrl(token),
    });
  } catch {
    // A configuration error must not leave a usable invitation behind.
    await cancelPendingInvitation(admin, invitationId);
    return { status: "error", message: INVITATION_ERROR_MESSAGE };
  }

  const send = await sendInvitationEmail(
    email,
    normalizedEmail,
    buildInvitationIdempotencyKey(invitationId),
  );

  if (send.status === "failed") {
    await cancelPendingInvitation(admin, invitationId);
    return { status: "error", message: INVITATION_ERROR_MESSAGE };
  }

  const confirmed = await confirmInvitationSent(
    admin,
    invitationId,
    send.resendEmailId,
    new Date(),
  );

  // The mail may already be on its way, so the row is cancelled rather than
  // left pending without a traceable identifier.
  if (!confirmed) {
    await cancelPendingInvitation(admin, invitationId);
    return { status: "error", message: INVITATION_ERROR_MESSAGE };
  }

  revalidatePath("/kids");
  revalidatePath(`/kids/${child.slug}`);

  return { status: "success" };
}
