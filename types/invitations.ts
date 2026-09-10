import type { Enums } from "@/types/database";
import type { ParentRelationshipLabel } from "@/types/kids";

/** Relationship as persisted by PostgreSQL: `father`, `mother` or `guardian`. */
export type PersistedRelationship = Enums<"relationship_type">;

export type CreateParentInvitationField =
  | "parentName"
  | "email"
  | "relationship";

export type CreateParentInvitationInput = {
  childId: string;
  parentName: string;
  email: string;
  relationship: ParentRelationshipLabel;
};

/**
 * Result returned to the staff modal. It never carries the code, the token,
 * their digests, the full email, internal identifiers or raw Supabase and
 * Resend responses.
 */
export type CreateParentInvitationResult =
  | { status: "success" }
  | {
      status: "invalid";
      errors: Partial<Record<CreateParentInvitationField, string>>;
    }
  | { status: "conflict"; message: string }
  | { status: "rate_limited"; message: string }
  | { status: "error"; message: string };

/**
 * Minimal activation payload resolved on the server from the token. The page
 * never receives the email, the digests, `invited_by` or the full row.
 */
export type ActivationInvitation = {
  status: "valid";
  kidName: string;
  roomLabel: string;
  maskedEmail: string;
  expiresAtLabel: string;
};

/**
 * A missing, malformed, unknown, expired, cancelled or already accepted token
 * all resolve to the same generic state, so the page cannot confirm whether an
 * invitation ever existed.
 */
export type ActivationLookupResult =
  | ActivationInvitation
  | { status: "invalid" };

export type ActivateNewParentField =
  | "code"
  | "password"
  | "passwordConfirmation";

/**
 * Shared by both activation paths; the signed-in path only ever fills `code`.
 * `attempt` lets the client form react to a new server response even when the
 * message repeats. Passwords never travel back inside this state.
 */
export type ActivateNewParentState = {
  attempt: number;
  fieldErrors: Partial<Record<ActivateNewParentField, string>>;
  formError?: string;
};
