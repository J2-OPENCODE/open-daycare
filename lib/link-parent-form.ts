import type { PersistedRelationship } from "@/types/invitations";
import type { ParentRelationshipLabel } from "@/types/kids";

export const LINK_PARENT_RELATIONSHIPS = [
  "Mamá",
  "Papá",
  "Tutor/a",
] as const satisfies readonly ParentRelationshipLabel[];

export type LinkParentRelationship = ParentRelationshipLabel;

export type LinkParentFormValues = {
  parentName: string;
  email: string;
  relationship: LinkParentRelationship;
};

/** The two free-text inputs that can receive focus when invalid. */
export type RequiredLinkParentField = "parentName" | "email";

export type LinkParentField = RequiredLinkParentField | "relationship";

export type LinkParentFormErrors = Partial<Record<LinkParentField, string>>;

export const INITIAL_LINK_PARENT_FORM_VALUES: LinkParentFormValues = {
  parentName: "",
  email: "",
  relationship: "Mamá",
};

export const PARENT_NAME_MAX_LENGTH = 120;
export const PARENT_EMAIL_MAX_LENGTH = 254;

/** Labels are shown to staff; PostgreSQL always stores the English value. */
const PERSISTED_RELATIONSHIP_BY_LABEL: Record<
  LinkParentRelationship,
  PersistedRelationship
> = {
  "Mamá": "mother",
  "Papá": "father",
  "Tutor/a": "guardian",
};

const LABEL_BY_PERSISTED_RELATIONSHIP: Record<
  PersistedRelationship,
  LinkParentRelationship
> = {
  mother: "Mamá",
  father: "Papá",
  guardian: "Tutor/a",
};

const practicalEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Narrows untrusted input to the closed set of relationship labels. */
export function isLinkParentRelationship(
  value: unknown,
): value is LinkParentRelationship {
  return (
    typeof value === "string" &&
    LINK_PARENT_RELATIONSHIPS.includes(value as LinkParentRelationship)
  );
}

export function toPersistedRelationship(
  relationship: LinkParentRelationship,
): PersistedRelationship {
  return PERSISTED_RELATIONSHIP_BY_LABEL[relationship];
}

export function toRelationshipLabel(
  relationship: PersistedRelationship,
): LinkParentRelationship {
  return LABEL_BY_PERSISTED_RELATIONSHIP[relationship];
}

export function validateParentName(value: string) {
  const name = value.trim();

  if (!name) {
    return "Ingresá el nombre del padre o madre.";
  }

  return name.length > PARENT_NAME_MAX_LENGTH
    ? `El nombre no puede superar los ${PARENT_NAME_MAX_LENGTH} caracteres.`
    : undefined;
}

export function validateParentEmail(value: string) {
  const email = value.trim();

  if (!email) {
    return "Ingresá el email.";
  }

  if (email.length > PARENT_EMAIL_MAX_LENGTH) {
    return `El email no puede superar los ${PARENT_EMAIL_MAX_LENGTH} caracteres.`;
  }

  return practicalEmailPattern.test(email)
    ? undefined
    : "Ingresá un email válido.";
}

export function validateRelationship(value: unknown) {
  return isLinkParentRelationship(value)
    ? undefined
    : "Elegí un parentesco válido.";
}
