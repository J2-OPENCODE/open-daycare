export const LINK_PARENT_RELATIONSHIPS = [
  "Mamá",
  "Papá",
  "Tutor/a",
] as const;

export type LinkParentRelationship =
  (typeof LINK_PARENT_RELATIONSHIPS)[number];

export type LinkParentFormValues = {
  parentName: string;
  email: string;
  relationship: LinkParentRelationship;
};

export type RequiredLinkParentField = "parentName" | "email";

export type LinkParentFormErrors = Partial<
  Record<RequiredLinkParentField, string>
>;

export const INITIAL_LINK_PARENT_FORM_VALUES: LinkParentFormValues = {
  parentName: "",
  email: "",
  relationship: "Mamá",
};

export const LINK_PARENT_INVITATION_CODE = "7K4P9";
export const LINK_PARENT_INVITATION_EXPIRY = "Vence en 7 días";

const practicalEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateParentName(value: string) {
  return value.trim()
    ? undefined
    : "Ingresá el nombre del padre o madre.";
}

export function validateParentEmail(value: string) {
  const email = value.trim();

  if (!email) {
    return "Ingresá el email.";
  }

  return practicalEmailPattern.test(email)
    ? undefined
    : "Ingresá un email válido.";
}
