"use client";

import {
  PostAudienceSelector,
  type PostAudienceKid,
} from "@/components/feed/post-audience-selector";
import { PostPhotoPicker } from "@/components/feed/post-photo-picker";
import type { PostRoomOption } from "@/components/feed/post-room-selector";
import { PostTypeSelector } from "@/components/feed/post-type-selector";
import { ModalDialog } from "@/components/ui/modal-dialog";
import {
  INITIAL_CREATE_POST_FORM_VALUES,
  validateCreatePostAudience,
  validateCreatePostDescription,
  validateCreatePostPhotoConsent,
  validateCreatePostPhotos,
  validateCreatePostRoom,
  validateCreatePostType,
  type CreatePostAudience,
  type CreatePostFormErrors,
  type CreatePostFormValues,
  type RequiredCreatePostField,
} from "@/lib/create-post-form";
import { useEffect, useRef, useState, type FormEvent } from "react";

export type CreatePostActionResult =
  | { status: "success" }
  | { status: "invalid"; errors: CreatePostFormErrors }
  | { status: "error"; message: string };

export type CreatePostAction = (
  formData: FormData,
) => Promise<CreatePostActionResult>;

type CreatePostModalProps = {
  isOpen: boolean;
  kids: readonly PostAudienceKid[];
  rooms?: readonly PostRoomOption[];
  submitAction?: CreatePostAction;
  onClose: () => void;
  onSubmit: (values: CreatePostFormValues) => void;
};

const sectionLabelClassName =
  "mb-2.5 block text-xs font-extrabold tracking-[0.7px] text-muted-strong";
const fieldOrder = [
  "audience",
  "room",
  "description",
  "photos",
] as const satisfies readonly RequiredCreatePostField[];
const createPostErrorMessage =
  "No se pudo crear la publicación. Intentá de nuevo.";

function buildCreatePostFormData(values: CreatePostFormValues) {
  const formData = new FormData();

  formData.set("type", values.type);
  formData.set("description", values.description);
  formData.set("audienceKind", values.audience.kind);
  formData.set(
    "roomId",
    values.audience.kind === "room" ? (values.audience.roomId ?? "") : "",
  );

  if (values.audience.kind === "kids") {
    for (const kidId of values.audience.kidIds) {
      formData.append("kidIds", kidId);
    }
  }

  for (const photo of values.photos) {
    formData.append("photos", photo.file);
  }

  return formData;
}

export function CreatePostModal({
  isOpen,
  kids,
  rooms = [],
  submitAction,
  onClose,
  onSubmit,
}: CreatePostModalProps) {
  const [values, setValues] = useState(INITIAL_CREATE_POST_FORM_VALUES);
  const [errors, setErrors] = useState<CreatePostFormErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [generalError, setGeneralError] = useState<string>();
  const isSubmittingRef = useRef(false);
  const firstAudienceButtonRef = useRef<HTMLButtonElement>(null);
  const roomSelectRef = useRef<HTMLSelectElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const pendingFocusRef = useRef<RequiredCreatePostField>(null);

  useEffect(() => {
    const field = pendingFocusRef.current;

    if (!field || !errors[field]) {
      return;
    }

    if (field === "audience") {
      firstAudienceButtonRef.current?.focus();
    } else if (field === "room") {
      roomSelectRef.current?.focus();
    } else if (field === "description") {
      descriptionRef.current?.focus();
    } else {
      photoInputRef.current?.focus();
    }

    pendingFocusRef.current = null;
  }, [errors]);

  function clearValidation() {
    setErrors({});
    setHasAttemptedSubmit(false);
    setGeneralError(undefined);
    pendingFocusRef.current = null;
  }

  function resetForm() {
    setValues(INITIAL_CREATE_POST_FORM_VALUES);
    clearValidation();
  }

  function requestClose() {
    if (isSubmittingRef.current) {
      return;
    }

    setValues((currentValues) => ({ ...currentValues, photos: [] }));
    clearValidation();
    onClose();
  }

  function handleAfterClose() {
    setValues((currentValues) =>
      currentValues.photos.length > 0
        ? { ...currentValues, photos: [] }
        : currentValues,
    );
  }

  function revalidateField(
    field: RequiredCreatePostField,
    error: string | undefined,
  ) {
    if (!hasAttemptedSubmit) {
      return;
    }

    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };

      if (error) {
        nextErrors[field] = error;
      } else {
        delete nextErrors[field];
      }

      return nextErrors;
    });
  }

  function handleAudienceChange(audience: CreatePostAudience) {
    setValues((currentValues) => ({ ...currentValues, audience }));
    revalidateField("audience", validateCreatePostAudience(audience));
    revalidateField("room", validateCreatePostRoom(audience));
    revalidateField(
      "photos",
      validatePhotos(audience, values.photos),
    );

    if (audience.kind === "kids") {
      setErrors((currentErrors) => {
        if (!currentErrors.room) {
          return currentErrors;
        }

        const nextErrors = { ...currentErrors };
        delete nextErrors.room;
        return nextErrors;
      });
    }
  }

  function validatePhotos(
    audience: CreatePostAudience,
    photos: CreatePostFormValues["photos"],
  ) {
    const filesError = validateCreatePostPhotos(
      photos.map((photo) => photo.file),
    );

    if (filesError) {
      return filesError;
    }

    return validateCreatePostPhotoConsent(
      audience,
      photos,
      kids.map((kid) => ({
        id: kid.id,
        name: kid.name,
        photoConsent: kid.photoConsent === true,
      })),
    );
  }

  function handlePhotosChange(photos: CreatePostFormValues["photos"]) {
    setValues((currentValues) => ({ ...currentValues, photos }));

    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      const error = hasAttemptedSubmit
        ? validatePhotos(values.audience, photos)
        : validateCreatePostPhotos(photos.map((photo) => photo.file));

      if (error) {
        nextErrors.photos = error;
      } else {
        delete nextErrors.photos;
      }

      return nextErrors;
    });
  }

  function handlePhotoErrorChange(error: string | undefined) {
    if (!error) {
      return;
    }

    setErrors((currentErrors) => ({ ...currentErrors, photos: error }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmittingRef.current) {
      return;
    }

    setHasAttemptedSubmit(true);
    setGeneralError(undefined);

    const nextErrors: CreatePostFormErrors = {};
    const audienceError = validateCreatePostAudience(values.audience);
    const roomError = validateCreatePostRoom(values.audience);
    const descriptionError = validateCreatePostDescription(
      values.description,
    );
    const photosError = validatePhotos(values.audience, values.photos);
    const typeError = validateCreatePostType(values.type);

    if (audienceError) {
      nextErrors.audience = audienceError;
    }

    if (roomError) {
      nextErrors.room = roomError;
    }

    if (descriptionError) {
      nextErrors.description = descriptionError;
    }

    if (photosError) {
      nextErrors.photos = photosError;
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      pendingFocusRef.current =
        fieldOrder.find((field) => nextErrors[field]) ?? null;
      return;
    }

    if (typeError) {
      setGeneralError(typeError);
      return;
    }

    if (!submitAction) {
      setGeneralError(createPostErrorMessage);
      return;
    }

    isSubmittingRef.current = true;
    setIsPending(true);

    try {
      const result = await submitAction(buildCreatePostFormData(values));

      if (result.status === "success") {
        resetForm();
        onSubmit(values);
        return;
      }

      if (result.status === "invalid") {
        pendingFocusRef.current =
          fieldOrder.find((field) => result.errors[field]) ?? null;
        setErrors(result.errors);
        return;
      }

      setGeneralError(result.message || createPostErrorMessage);
    } catch {
      setGeneralError(createPostErrorMessage);
    } finally {
      isSubmittingRef.current = false;
      setIsPending(false);
    }
  }

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={requestClose}
      onAfterClose={handleAfterClose}
      ariaLabelledBy="create-post-modal-title"
      initialFocusRef={firstAudienceButtonRef}
      className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-[580px] overflow-visible border-0 bg-transparent p-0 text-foreground"
      dismissible={false}
    >
      <form
        className="modal-dialog-panel flex max-h-[calc(100dvh_-_2rem)] flex-col overflow-hidden rounded-[24px] border border-border bg-modal-card shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
        noValidate
        onSubmit={handleSubmit}
        aria-busy={isPending}
        aria-describedby={
          generalError ? "create-post-general-error" : undefined
        }
      >
        <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-border px-5 py-5 md:px-[26px]">
          <button
            type="button"
            className="w-fit rounded-md text-[15px] font-bold text-muted-strong outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2 focus-visible:ring-offset-modal-card disabled:cursor-not-allowed disabled:opacity-50"
            onClick={requestClose}
            disabled={isPending}
          >
            Cancelar
          </button>
          <h2
            id="create-post-modal-title"
            className="whitespace-nowrap font-display text-[18px] font-semibold text-foreground"
          >
            Nueva publicación
          </h2>
          <button
            type="submit"
            className="justify-self-end rounded-md text-[15px] font-extrabold text-coral-heading outline-none transition-colors hover:text-coral-dark focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2 focus-visible:ring-offset-modal-card disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
          >
            {isPending ? "Publicando…" : "Publicar"}
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto px-5 py-6 md:px-[26px]">
          {generalError ? (
            <p
              id="create-post-general-error"
              className="mb-[18px] rounded-xl bg-[#FFF0EB] px-4 py-3 text-sm font-semibold text-[#9B3F30]"
              role="alert"
            >
              {generalError}
            </p>
          ) : null}

          <div className="mb-[22px]">
            <PostAudienceSelector
              kids={kids}
              rooms={rooms}
              value={values.audience}
              onChange={handleAudienceChange}
              error={errors.audience}
              roomError={errors.room}
              firstButtonRef={firstAudienceButtonRef}
              roomSelectRef={roomSelectRef}
            />
          </div>

          <div className="mb-[22px]">
            <PostTypeSelector
              value={values.type}
              onChange={(type) => {
                setValues((currentValues) => ({ ...currentValues, type }));
              }}
            />
          </div>

          <div className="mb-[22px]">
            <label
              htmlFor="create-post-description"
              className={sectionLabelClassName}
            >
              DESCRIPCIÓN
            </label>
            <textarea
              ref={descriptionRef}
              id="create-post-description"
              name="description"
              className={`block min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] border-modal-field-border bg-modal-field px-4 py-3.5 text-[15px] leading-normal text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-auth-placeholder focus:border-coral focus:ring-[3px] focus:ring-[var(--modal-focus-ring)] ${
                errors.description
                  ? "border-modal-error focus:border-modal-error focus:ring-modal-error/15"
                  : ""
              }`}
              placeholder="Compartí un momento…"
              value={values.description}
              onChange={(event) => {
                const description = event.currentTarget.value;
                setValues((currentValues) => ({
                  ...currentValues,
                  description,
                }));
                revalidateField(
                  "description",
                  validateCreatePostDescription(description),
                );
              }}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description
                  ? "create-post-description-error"
                  : undefined
              }
              required
            />
            {errors.description ? (
              <p
                id="create-post-description-error"
                className="mt-1.5 text-[13px] font-semibold text-modal-error"
              >
                {errors.description}
              </p>
            ) : null}
          </div>

          {isOpen ? (
            <PostPhotoPicker
              photos={values.photos}
              onChange={handlePhotosChange}
              error={errors.photos}
              onErrorChange={handlePhotoErrorChange}
              inputRef={photoInputRef}
            />
          ) : null}
        </div>
      </form>
    </ModalDialog>
  );
}
