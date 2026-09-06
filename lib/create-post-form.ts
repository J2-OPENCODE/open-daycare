export const CREATE_POST_TYPE_OPTIONS = [
  { value: "meal", label: "Comida" },
  { value: "nap", label: "Siesta" },
  { value: "activity", label: "Actividad" },
  { value: "achievement", label: "Logro" },
  { value: "mood", label: "Ánimo" },
  { value: "photo", label: "Foto" },
  { value: "announcement", label: "Anuncio" },
] as const;

export type CreatePostType =
  (typeof CREATE_POST_TYPE_OPTIONS)[number]["value"];

export type CreatePostAudience =
  | { kind: "kids"; kidIds: readonly string[] }
  | { kind: "room" };

export type CreatePostFormValues = {
  audience: CreatePostAudience;
  type: CreatePostType;
  description: string;
};

export type RequiredCreatePostField = "audience" | "description";

export type CreatePostFormErrors = Partial<
  Record<RequiredCreatePostField, string>
>;

export const INITIAL_CREATE_POST_FORM_VALUES: CreatePostFormValues = {
  audience: { kind: "kids", kidIds: [] },
  type: "activity",
  description:
    "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón.",
};

export function validateCreatePostAudience(audience: CreatePostAudience) {
  return audience.kind === "room" || audience.kidIds.length > 0
    ? undefined
    : "Seleccioná al menos un destinatario.";
}

export function validateCreatePostDescription(description: string) {
  return description.trim() ? undefined : "Ingresá una descripción.";
}
