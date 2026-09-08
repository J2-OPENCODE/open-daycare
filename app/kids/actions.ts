"use server";

import "server-only";

import { validateAddKidFormValues } from "@/lib/add-kid-form";
import { getAuthAccessState } from "@/lib/auth";
import type { TablesInsert } from "@/types/database";
import type {
  AddKidActionResult,
  AddKidField,
  AddKidFormValues,
} from "@/types/kids";
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
