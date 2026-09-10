import "server-only";

import { createHmac, randomBytes, randomUUID } from "node:crypto";

import { Resend } from "resend";

import type { ParentInvitationEmail } from "@/lib/email/parent-invitation-email";
import type { Tables } from "@/types/database";
import type { ActivationInvitation } from "@/types/invitations";
import type { AdminClient } from "@/utils/supabase/admin";
import { requireServerEnv } from "@/utils/supabase/admin";

/** `0`, `O`, `1` and `I` are excluded to reduce transcription errors. */
export const INVITATION_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const INVITATION_CODE_LENGTH = 6;
export const INVITATION_TOKEN_BYTES = 32;
export const INVITATION_LIFETIME_MS = 604_800_000;
export const INVITATION_RATE_LIMIT = 3;
export const INVITATION_RATE_WINDOW_MS = 3_600_000;

const INVITATION_CODE_PATTERN = new RegExp(
  `^[${INVITATION_CODE_ALPHABET}]{${INVITATION_CODE_LENGTH}}$`,
);
/** 32 random bytes encoded as unpadded base64url are always 43 characters. */
const INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const HASH_SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const MONTH_LABELS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

export const INVITATION_RATE_LIMIT_MESSAGE =
  "Alcanzaste el límite de invitaciones. Intentá de nuevo más tarde.";
export const INVITATION_CONFLICT_MESSAGE =
  "Ese email ya está vinculado con este niño.";
export const INVITATION_ERROR_MESSAGE =
  "No pudimos enviar la invitación. Intentá de nuevo.";
export const CHILD_UNAVAILABLE_MESSAGE =
  "Ese niño no está disponible para invitaciones.";

export type ActivationInvitationRow = Pick<
  Tables<"invitations">,
  | "id"
  | "daycare_id"
  | "child_id"
  | "full_name"
  | "email"
  | "relationship"
  | "expires_at"
  | "status"
  | "accepted_by"
>;

const ACTIVATION_INVITATION_COLUMNS =
  "id, daycare_id, child_id, full_name, email, relationship, expires_at, status, accepted_by";

/**
 * The signing key is 32 random bytes stored as unpadded base64url. Any other
 * length or encoding is a configuration error and must not silently produce a
 * weaker digest.
 */
function readHashSecret() {
  const raw = requireServerEnv("INVITATION_HASH_SECRET");

  if (!HASH_SECRET_PATTERN.test(raw)) {
    throw new Error(
      "INVITATION_HASH_SECRET must be 32 bytes encoded as base64url without padding.",
    );
  }

  const decoded = Buffer.from(raw, "base64url");

  if (decoded.length !== INVITATION_TOKEN_BYTES) {
    throw new Error(
      "INVITATION_HASH_SECRET must decode to exactly 32 bytes.",
    );
  }

  return decoded;
}

/** Only the digest is ever persisted; the secret itself lives in the email. */
export function hashInvitationSecret(secret: string) {
  return createHmac("sha256", readHashSecret())
    .update(secret, "utf8")
    .digest("hex");
}

/** Unbiased rejection sampling, correct for any alphabet length. */
export function generateInvitationCode() {
  const alphabet = INVITATION_CODE_ALPHABET;
  const limit = Math.floor(256 / alphabet.length) * alphabet.length;
  let code = "";

  while (code.length < INVITATION_CODE_LENGTH) {
    for (const byte of randomBytes(INVITATION_CODE_LENGTH)) {
      if (byte < limit) {
        code += alphabet[byte % alphabet.length];

        if (code.length === INVITATION_CODE_LENGTH) {
          break;
        }
      }
    }
  }

  return code;
}

export function generateInvitationToken() {
  return randomBytes(INVITATION_TOKEN_BYTES).toString("base64url");
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

/** Codes are accepted case-insensitively and normalized before hashing. */
export function normalizeInvitationCode(value: string) {
  return value.trim().toUpperCase();
}

export function isValidInvitationCode(value: string) {
  return INVITATION_CODE_PATTERN.test(value);
}

/** The token is never transformed, only shape-checked. */
export function isValidInvitationToken(value: string) {
  return INVITATION_TOKEN_PATTERN.test(value);
}

export function computeInvitationExpiry(issuedAt: Date) {
  return new Date(issuedAt.getTime() + INVITATION_LIFETIME_MS);
}

export function buildInvitationIdempotencyKey(invitationId: string) {
  return `parent-invitation/${invitationId}`;
}

export function generateAuthUserId() {
  return randomUUID();
}

/**
 * `APP_URL` must be a bare origin so the activation link cannot inherit a
 * path, query, fragment or embedded credentials from configuration.
 */
function readAppOrigin() {
  const raw = requireServerEnv("APP_URL");
  let parsed: URL;

  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("APP_URL must be an absolute http or https URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("APP_URL must use the http or https protocol.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("APP_URL must not contain credentials.");
  }

  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("APP_URL must not contain a path, query or fragment.");
  }

  return parsed;
}

export function buildActivationUrl(token: string) {
  const url = new URL("/activate-account", readAppOrigin());
  url.searchParams.set("token", token);

  return url.toString();
}

/** `lucia@example.com` becomes `l***@example.com`. */
export function maskEmail(email: string) {
  const separatorIndex = email.lastIndexOf("@");

  if (separatorIndex <= 0) {
    return "***";
  }

  const [firstCharacter] = Array.from(email.slice(0, separatorIndex));

  return `${firstCharacter}***@${email.slice(separatorIndex + 1)}`;
}

export function formatExpiresAtLabel(expiresAt: string) {
  const date = new Date(expiresAt);

  return `Vence el ${date.getDate()} ${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

export function toActivationInvitation(
  invitation: Pick<ActivationInvitationRow, "email" | "expires_at">,
  kidName: string,
  roomName: string,
): ActivationInvitation {
  return {
    status: "valid",
    kidName,
    roomLabel: `Sala ${roomName}`,
    maskedEmail: maskEmail(invitation.email),
    expiresAtLabel: formatExpiresAtLabel(invitation.expires_at),
  };
}

function rateWindowStart(now: Date) {
  return new Date(now.getTime() - INVITATION_RATE_WINDOW_MS).toISOString();
}

/**
 * Counts every invitation the actor created in the rolling window, including
 * accepted, expired and cancelled rows, so replacing rows cannot evade the
 * limit. A query error fails closed.
 */
export async function countInvitationsByActor(
  admin: AdminClient,
  invitedBy: string,
  now: Date,
) {
  const { count, error } = await admin
    .from("invitations")
    .select("id", { count: "exact", head: true })
    .eq("invited_by", invitedBy)
    .gte("created_at", rateWindowStart(now));

  if (error || count === null) {
    throw new Error("Unable to count recent invitations for the actor.", {
      cause: error,
    });
  }

  return count;
}

export async function countInvitationsForTarget(
  admin: AdminClient,
  childId: string,
  normalizedEmail: string,
  now: Date,
) {
  const { count, error } = await admin
    .from("invitations")
    .select("id", { count: "exact", head: true })
    .eq("child_id", childId)
    .eq("email", normalizedEmail)
    .gte("created_at", rateWindowStart(now));

  if (error || count === null) {
    throw new Error("Unable to count recent invitations for the target.", {
      cause: error,
    });
  }

  return count;
}

/**
 * Resolves the few parents already linked to the child and compares their Auth
 * emails. This never runs in the browser and never copies an email into
 * `public.users`. Any resolution error fails closed.
 */
export async function hasLinkedParentWithEmail(
  admin: AdminClient,
  childId: string,
  normalizedEmail: string,
) {
  const { data, error } = await admin
    .from("parent_children")
    .select("parent_id")
    .eq("child_id", childId);

  if (error) {
    throw new Error("Unable to load the child's linked parents.", {
      cause: error,
    });
  }

  if (data.length === 0) {
    return false;
  }

  const accounts = await Promise.all(
    data.map(({ parent_id }) => admin.auth.admin.getUserById(parent_id)),
  );

  return accounts.some((account) => {
    if (account.error || !account.data.user) {
      throw new Error("Unable to resolve a linked parent account.", {
        cause: account.error,
      });
    }

    const email = account.data.user.email;

    return Boolean(email) && normalizeEmail(email!) === normalizedEmail;
  });
}

export async function replaceParentInvitation(
  admin: AdminClient,
  input: {
    childId: string;
    invitedBy: string;
    fullName: string;
    normalizedEmail: string;
    relationship: Tables<"invitations">["relationship"];
    codeDigest: string;
    tokenDigest: string;
    expiresAt: Date;
  },
) {
  const { data, error } = await admin.rpc("replace_parent_invitation", {
    p_child_id: input.childId,
    p_invited_by: input.invitedBy,
    p_full_name: input.fullName,
    p_email: input.normalizedEmail,
    p_relationship: input.relationship,
    p_code_digest: input.codeDigest,
    p_token_digest: input.tokenDigest,
    p_expires_at: input.expiresAt.toISOString(),
  });

  if (error || !data) {
    throw new Error("Unable to replace the parent invitation.", {
      cause: error,
    });
  }

  return data;
}

/**
 * Records the Resend identifier only while the invitation is still pending, so
 * a row replaced by a concurrent operator is never marked as sent.
 * Returns false when the expected row was not updated.
 */
export async function confirmInvitationSent(
  admin: AdminClient,
  invitationId: string,
  resendEmailId: string,
  sentAt: Date,
) {
  const { data, error } = await admin
    .from("invitations")
    .update({ resend_email_id: resendEmailId, sent_at: sentAt.toISOString() })
    .eq("id", invitationId)
    .eq("status", "pending")
    .select("id");

  return !error && data?.length === 1;
}

/** Best-effort compensation. It never throws, so callers can always report the original failure. */
export async function cancelPendingInvitation(
  admin: AdminClient,
  invitationId: string,
) {
  try {
    const { error } = await admin
      .from("invitations")
      .update({ status: "cancelled" })
      .eq("id", invitationId)
      .eq("status", "pending");

    return !error;
  } catch {
    return false;
  }
}

/**
 * Presentation and activation both require a confirmed send, so a row whose
 * delivery outcome is unknown is neither shown nor activatable.
 */
export async function findSentPendingInvitationByTokenDigest(
  admin: AdminClient,
  tokenDigest: string,
  now: Date,
) {
  const { data, error } = await admin
    .from("invitations")
    .select(ACTIVATION_INVITATION_COLUMNS)
    .eq("token_digest", tokenDigest)
    .eq("status", "pending")
    .not("resend_email_id", "is", null)
    .not("sent_at", "is", null)
    .gt("expires_at", now.toISOString())
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load the invitation.", { cause: error });
  }

  return data;
}

/**
 * Used only to recover a response lost after the commit: the accepted row is
 * revealed exclusively to the parent session that accepted it.
 */
export async function findAcceptedInvitationByTokenDigest(
  admin: AdminClient,
  tokenDigest: string,
) {
  const { data, error } = await admin
    .from("invitations")
    .select(ACTIVATION_INVITATION_COLUMNS)
    .eq("token_digest", tokenDigest)
    .eq("status", "accepted")
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load the invitation.", { cause: error });
  }

  return data;
}

export async function findActiveChildForInvitation(
  admin: AdminClient,
  childId: string,
  daycareId: string,
) {
  const { data, error } = await admin
    .from("children")
    .select("id, slug, full_name, room_id")
    .eq("id", childId)
    .eq("daycare_id", daycareId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load the invited child.", { cause: error });
  }

  return data;
}

export async function findRoomName(
  admin: AdminClient,
  roomId: string,
  daycareId: string,
) {
  const { data, error } = await admin
    .from("rooms")
    .select("name")
    .eq("id", roomId)
    .eq("daycare_id", daycareId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load the child's room.", { cause: error });
  }

  return data?.name ?? null;
}

export type InvitationEmailSendResult =
  | { status: "sent"; resendEmailId: string }
  | { status: "failed" };

/**
 * Sends through Resend with an idempotency key derived from the invitation, so
 * a retried request cannot deliver a second copy of the same row. Transport
 * exceptions and API-level errors are both treated as failures, and neither the
 * payload nor the secrets are ever logged.
 */
export async function sendInvitationEmail(
  email: ParentInvitationEmail,
  recipient: string,
  idempotencyKey: string,
): Promise<InvitationEmailSendResult> {
  const resend = new Resend(requireServerEnv("RESEND_API_KEY"));
  const from = requireServerEnv("RESEND_FROM_EMAIL");

  try {
    const { data, error } = await resend.emails.send(
      {
        from,
        to: recipient,
        subject: email.subject,
        html: email.html,
        text: email.text,
      },
      { idempotencyKey },
    );

    if (error || !data?.id) {
      return { status: "failed" };
    }

    return { status: "sent", resendEmailId: data.id };
  } catch {
    return { status: "failed" };
  }
}

export type ActivationContext =
  | {
      status: "valid";
      invitation: ActivationInvitationRow;
      kidName: string;
      roomName: string;
    }
  | { status: "accepted"; acceptedBy: string }
  | { status: "invalid" };

/**
 * Resolves a token to the minimum the activation route needs. Read-only: it
 * never calls `verify_parent_invitation(...)`, so simply opening the page does
 * not consume an attempt. Every failure collapses to the same generic state.
 */
export async function resolveActivationContext(
  admin: AdminClient,
  token: string,
  now: Date,
): Promise<ActivationContext> {
  if (!isValidInvitationToken(token)) {
    return { status: "invalid" };
  }

  try {
    const tokenDigest = hashInvitationSecret(token);
    const invitation = await findSentPendingInvitationByTokenDigest(
      admin,
      tokenDigest,
      now,
    );

    if (!invitation) {
      const accepted = await findAcceptedInvitationByTokenDigest(
        admin,
        tokenDigest,
      );

      return accepted?.accepted_by
        ? { status: "accepted", acceptedBy: accepted.accepted_by }
        : { status: "invalid" };
    }

    const child = await findActiveChildForInvitation(
      admin,
      invitation.child_id,
      invitation.daycare_id,
    );

    if (!child) {
      return { status: "invalid" };
    }

    const roomName = await findRoomName(
      admin,
      child.room_id,
      invitation.daycare_id,
    );

    return roomName
      ? { status: "valid", invitation, kidName: child.full_name, roomName }
      : { status: "invalid" };
  } catch {
    return { status: "invalid" };
  }
}

const ACTIVATION_SUCCESS_PATH = "/activate-account/success";
const ACTIVATION_RETURN_PATTERN =
  /^\/activate-account\?token=([A-Za-z0-9_-]{43})$/;

/**
 * Accepts only the two canonical internal destinations and rebuilds them from
 * the matched parts, so an absolute URL, a host, a backslash, an alternate
 * encoding or an extra parameter can never control a redirect.
 */
export function resolveActivationReturnTo(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  if (value === ACTIVATION_SUCCESS_PATH) {
    return ACTIVATION_SUCCESS_PATH;
  }

  const match = ACTIVATION_RETURN_PATTERN.exec(value);

  return match ? `/activate-account?token=${match[1]}` : null;
}

export function buildActivationReturnTo(token: string) {
  return isValidInvitationToken(token)
    ? `/activate-account?token=${token}`
    : null;
}

export async function findAuthUserEmail(admin: AdminClient, userId: string) {
  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error || !data.user?.email) {
    throw new Error("Unable to resolve the signed-in account.", {
      cause: error,
    });
  }

  return normalizeEmail(data.user.email);
}

export type VerifiedInvitation = {
  invitationId: string;
  daycareId: string;
  childId: string;
  invitedFullName: string;
  invitedEmail: string;
  relationship: PersistedRelationshipValue;
};

type PersistedRelationshipValue = Tables<"invitations">["relationship"];

/**
 * Consumes one attempt for a well-formed but wrong code, so callers must
 * validate shape and the confirmed-send barrier first. Returns null for every
 * rejection, which keeps the caller from distinguishing the reason.
 */
export async function verifyParentInvitation(
  admin: AdminClient,
  tokenDigest: string,
  codeDigest: string,
): Promise<VerifiedInvitation | null> {
  const { data, error } = await admin.rpc("verify_parent_invitation", {
    p_token_digest: tokenDigest,
    p_code_digest: codeDigest,
  });

  if (error) {
    throw new Error("Unable to verify the invitation.", { cause: error });
  }

  const [row] = data ?? [];

  if (
    !row ||
    row.outcome !== "valid" ||
    !row.invitation_id ||
    !row.invitation_daycare_id ||
    !row.invitation_child_id ||
    !row.invited_email ||
    !row.invited_full_name ||
    !row.invited_relationship
  ) {
    return null;
  }

  return {
    invitationId: row.invitation_id,
    daycareId: row.invitation_daycare_id,
    childId: row.invitation_child_id,
    invitedFullName: row.invited_full_name,
    invitedEmail: row.invited_email,
    relationship: row.invited_relationship,
  };
}

/**
 * Reserves the private claim the Auth trigger consumes, because the hosted
 * service applies `app_metadata` after the insert that fires the trigger.
 */
export async function prepareParentSignup(
  admin: AdminClient,
  invitationId: string,
  authUserId: string,
  authenticatedEmail: string,
) {
  const { error } = await admin.rpc("prepare_parent_signup", {
    p_invitation_id: invitationId,
    p_auth_user_id: authUserId,
    p_authenticated_email: authenticatedEmail,
  });

  if (error) {
    throw new Error("Unable to prepare the parent signup claim.", {
      cause: error,
    });
  }
}

export async function acceptParentInvitation(
  admin: AdminClient,
  invitationId: string,
  parentId: string,
  authenticatedEmail: string,
) {
  const { data, error } = await admin.rpc("accept_parent_invitation", {
    p_invitation_id: invitationId,
    p_parent_id: parentId,
    p_authenticated_email: authenticatedEmail,
  });

  if (error || !data) {
    throw new Error("Unable to accept the invitation.", { cause: error });
  }

  return data;
}
