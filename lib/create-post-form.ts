export const CREATE_POST_TYPE_OPTIONS = [
  { value: "meal", label: "Comida" },
  { value: "nap", label: "Siesta" },
  { value: "activity", label: "Actividad" },
  { value: "achievement", label: "Logro" },
  { value: "mood", label: "Ánimo" },
  { value: "photo", label: "Foto" },
  { value: "announcement", label: "Anuncio" },
] as const;

export const MAX_POST_PHOTOS = 4;
export const MAX_POST_PHOTO_BYTES = 5_242_880;
export const ALLOWED_POST_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type CreatePostType =
  (typeof CREATE_POST_TYPE_OPTIONS)[number]["value"];

export type CreatePostAudience =
  | { kind: "kids"; kidIds: readonly string[] }
  | { kind: "room"; roomId: string | null };

export type CreatePostPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

export type CreatePostFormValues = {
  audience: CreatePostAudience;
  type: CreatePostType;
  description: string;
  photos: readonly CreatePostPhoto[];
};

export type RequiredCreatePostField =
  | "audience"
  | "room"
  | "description"
  | "photos";

export type CreatePostFormErrors = Partial<
  Record<RequiredCreatePostField, string>
>;

export type CreatePostChildPhotoConsent = {
  id: string;
  name: string;
  photoConsent: boolean;
};

export const INITIAL_CREATE_POST_FORM_VALUES: CreatePostFormValues = {
  audience: { kind: "kids", kidIds: [] },
  type: "activity",
  description: "",
  photos: [],
};

export function validateCreatePostAudience(audience: CreatePostAudience) {
  return audience.kind === "room" || audience.kidIds.length > 0
    ? undefined
    : "Seleccioná al menos un destinatario.";
}

export function validateCreatePostRoom(audience: CreatePostAudience) {
  return audience.kind !== "room" || audience.roomId?.trim()
    ? undefined
    : "Seleccioná una sala.";
}

export function validateCreatePostDescription(description: string) {
  return description.trim() ? undefined : "Ingresá una descripción.";
}

export function isCreatePostType(value: unknown): value is CreatePostType {
  return CREATE_POST_TYPE_OPTIONS.some((option) => option.value === value);
}

export function validateCreatePostType(value: unknown) {
  return isCreatePostType(value)
    ? undefined
    : "Seleccioná un tipo de publicación válido.";
}

export function validateCreatePostPhoto(
  file: Pick<File, "size" | "type">,
) {
  if (file.size > MAX_POST_PHOTO_BYTES) {
    return "Cada foto puede pesar hasta 5 MB.";
  }

  return ALLOWED_POST_PHOTO_TYPES.some(
    (contentType) => contentType === file.type,
  )
    ? undefined
    : "Solo se permiten fotos JPEG, PNG o WebP.";
}

export function validateCreatePostPhotos(
  files: readonly Pick<File, "size" | "type">[],
) {
  if (files.length > MAX_POST_PHOTOS) {
    return `Podés agregar hasta ${MAX_POST_PHOTOS} fotos.`;
  }

  for (const file of files) {
    const error = validateCreatePostPhoto(file);

    if (error) {
      return error;
    }
  }

  return undefined;
}

export function validateCreatePostPhotoConsent(
  audience: CreatePostAudience,
  photos: readonly unknown[],
  children: readonly CreatePostChildPhotoConsent[],
) {
  if (photos.length === 0 || audience.kind !== "kids") {
    return undefined;
  }

  const childWithoutPhotoConsent = children.find(
    (child) =>
      audience.kidIds.includes(child.id) && !child.photoConsent,
  );

  return childWithoutPhotoConsent
    ? `${childWithoutPhotoConsent.name} no tiene consentimiento para fotografías.`
    : undefined;
}
