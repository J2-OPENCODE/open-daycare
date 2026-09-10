"use server";

import "server-only";

import { getAuthAccessState } from "@/lib/auth";
import {
  acceptParentInvitation,
  cancelPendingInvitation,
  findAuthUserEmail,
  findSentPendingInvitationByTokenDigest,
  generateAuthUserId,
  hashInvitationSecret,
  isValidInvitationCode,
  normalizeInvitationCode,
  prepareParentSignup,
  verifyParentInvitation,
} from "@/lib/invitations";
import type { ActivateNewParentState } from "@/types/invitations";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const PASSWORD_MIN_LENGTH = 8;
const ACTIVATION_SUCCESS_PATH = "/activate-account/success";

/** One message for a wrong code, a wrong state and a missing invitation. */
const GENERIC_ACTIVATION_ERROR =
  "No pudimos activar la cuenta. Revisá el código e intentá de nuevo.";
const EXISTING_ACCOUNT_MESSAGE =
  "No pudimos crear la cuenta. Si ya tenés una, iniciá sesión.";

function failed(
  previousState: ActivateNewParentState,
  next: Omit<ActivateNewParentState, "attempt">,
): ActivateNewParentState {
  return { attempt: previousState.attempt + 1, ...next };
}

function readField(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
}

const CODE_SHAPE_ERROR = "Ingresá el código de seis caracteres.";

/** Normalizes the code so it can be entered in lower case. */
function readCode(formData: FormData) {
  return normalizeInvitationCode(readField(formData, "code"));
}

export async function activateNewParent(
  token: string,
  previousState: ActivateNewParentState,
  formData: FormData,
): Promise<ActivateNewParentState> {
  const fieldErrors: ActivateNewParentState["fieldErrors"] = {};
  const code = readCode(formData);
  const password = readField(formData, "password");
  const passwordConfirmation = readField(formData, "passwordConfirmation");

  // Shape is checked before any digest, so a malformed code never consumes
  // one of the ten attempts.
  if (!isValidInvitationCode(code)) {
    fieldErrors.code = CODE_SHAPE_ERROR;
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    fieldErrors.password = `La contraseña necesita al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  } else if (password !== passwordConfirmation) {
    fieldErrors.passwordConfirmation = "Las contraseñas no coinciden.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return failed(previousState, { fieldErrors });
  }

  let outcome: NewParentOutcome;

  try {
    outcome = await createParentAccount(token, code, password);
  } catch {
    return failed(previousState, {
      fieldErrors: {},
      formError: GENERIC_ACTIVATION_ERROR,
    });
  }

  if (outcome.status === "rejected") {
    return failed(previousState, {
      fieldErrors: {},
      formError: outcome.message,
    });
  }

  revalidatePath("/", "layout");

  // `redirect` throws, so it must run outside the block that catches errors.
  redirect(
    outcome.status === "signed-in"
      ? ACTIVATION_SUCCESS_PATH
      : `/login?returnTo=${encodeURIComponent(ACTIVATION_SUCCESS_PATH)}`,
  );
}

type NewParentOutcome =
  | { status: "signed-in" }
  | { status: "needs-login" }
  | { status: "rejected"; message: string };

async function createParentAccount(
  token: string,
  code: string,
  password: string,
): Promise<NewParentOutcome> {
  const admin = createAdminClient();
  const tokenDigest = hashInvitationSecret(token);

  // A row without a confirmed send must not activate anything, and checking it
  // first means such a token never consumes an attempt.
  const sent = await findSentPendingInvitationByTokenDigest(
    admin,
    tokenDigest,
    new Date(),
  );

  if (!sent) {
    return { status: "rejected", message: GENERIC_ACTIVATION_ERROR };
  }

  const invitation = await verifyParentInvitation(
    admin,
    tokenDigest,
    hashInvitationSecret(code),
  );

  if (!invitation) {
    return { status: "rejected", message: GENERIC_ACTIVATION_ERROR };
  }

  // The browser never chooses any of these values.
  const authUserId = generateAuthUserId();

  await prepareParentSignup(
    admin,
    invitation.invitationId,
    authUserId,
    invitation.invitedEmail,
  );

  const { error: createError } = await admin.auth.admin.createUser({
    id: authUserId,
    email: invitation.invitedEmail,
    password,
    // Access to the invitation already proves control of the mailbox.
    email_confirm: true,
    app_metadata: {
      daycare_id: invitation.daycareId,
      role: "parent",
      invitation_id: invitation.invitationId,
    },
    user_metadata: { full_name: invitation.invitedFullName },
  });

  if (createError) {
    // Never confirms whether the address is already registered.
    return { status: "rejected", message: EXISTING_ACCOUNT_MESSAGE };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invitation.invitedEmail,
    password,
  });

  // The identity is confirmed and linked; only the local session failed.
  return signInError ? { status: "needs-login" } : { status: "signed-in" };
}

export async function activateExistingParent(
  token: string,
  previousState: ActivateNewParentState,
  formData: FormData,
): Promise<ActivateNewParentState> {
  const code = readCode(formData);

  if (!isValidInvitationCode(code)) {
    return failed(previousState, { fieldErrors: { code: CODE_SHAPE_ERROR } });
  }

  let accepted: boolean;

  try {
    accepted = await linkExistingParent(token, code);
  } catch {
    return failed(previousState, {
      fieldErrors: {},
      formError: GENERIC_ACTIVATION_ERROR,
    });
  }

  if (!accepted) {
    return failed(previousState, {
      fieldErrors: {},
      formError: GENERIC_ACTIVATION_ERROR,
    });
  }

  revalidatePath("/", "layout");
  redirect(ACTIVATION_SUCCESS_PATH);
}

/**
 * Re-checks session, token, code, email, role, status and tenant. The session
 * checks run before the code is verified, so a wrong session never consumes
 * one of the ten attempts.
 */
async function linkExistingParent(token: string, code: string) {
  const access = await getAuthAccessState();

  if (access.status !== "active" || access.role !== "parent") {
    return false;
  }

  const admin = createAdminClient();
  const tokenDigest = hashInvitationSecret(token);
  const sent = await findSentPendingInvitationByTokenDigest(
    admin,
    tokenDigest,
    new Date(),
  );

  if (!sent || sent.daycare_id !== access.daycareId) {
    return false;
  }

  const sessionEmail = await findAuthUserEmail(admin, access.userId);

  if (sessionEmail !== sent.email) {
    return false;
  }

  const invitation = await verifyParentInvitation(
    admin,
    tokenDigest,
    hashInvitationSecret(code),
  );

  if (!invitation) {
    return false;
  }

  const outcome = await acceptParentInvitation(
    admin,
    invitation.invitationId,
    access.userId,
    sessionEmail,
  );

  // An existing link is an idempotent success, but the invitation must not
  // stay pending behind it.
  if (outcome === "already_linked") {
    await cancelPendingInvitation(admin, invitation.invitationId);
    return true;
  }

  return outcome === "accepted" || outcome === "already_accepted";
}
