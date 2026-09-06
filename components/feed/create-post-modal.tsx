"use client";

import { PostAudienceSelector } from "@/components/feed/post-audience-selector";
import { PostTypeSelector } from "@/components/feed/post-type-selector";
import { ImageIcon, PlusIcon } from "@/components/icons";
import { ModalDialog } from "@/components/ui/modal-dialog";
import {
  INITIAL_CREATE_POST_FORM_VALUES,
  validateCreatePostAudience,
  validateCreatePostDescription,
  type CreatePostAudience,
  type CreatePostFormErrors,
  type CreatePostFormValues,
  type RequiredCreatePostField,
} from "@/lib/create-post-form";
import type { Kid } from "@/types/kids";
import { useEffect, useRef, useState, type FormEvent } from "react";

type CreatePostModalProps = {
  isOpen: boolean;
  kids: readonly Kid[];
  onClose: () => void;
  onSubmit: (values: CreatePostFormValues) => void;
};

const sectionLabelClassName =
  "mb-2.5 block text-xs font-extrabold tracking-[0.7px] text-muted-strong";

export function CreatePostModal({
  isOpen,
  kids,
  onClose,
  onSubmit,
}: CreatePostModalProps) {
  const [values, setValues] = useState(INITIAL_CREATE_POST_FORM_VALUES);
  const [errors, setErrors] = useState<CreatePostFormErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const firstAudienceButtonRef = useRef<HTMLButtonElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const pendingFocusRef = useRef<RequiredCreatePostField>(null);

  useEffect(() => {
    const field = pendingFocusRef.current;

    if (!field || !errors[field]) {
      return;
    }

    if (field === "audience") {
      firstAudienceButtonRef.current?.focus();
    } else {
      descriptionRef.current?.focus();
    }

    pendingFocusRef.current = null;
  }, [errors]);

  function clearValidation() {
    setErrors({});
    setHasAttemptedSubmit(false);
    pendingFocusRef.current = null;
  }

  function resetForm() {
    setValues(INITIAL_CREATE_POST_FORM_VALUES);
    clearValidation();
  }

  function requestClose() {
    clearValidation();
    onClose();
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
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasAttemptedSubmit(true);

    const nextErrors: CreatePostFormErrors = {};
    const audienceError = validateCreatePostAudience(values.audience);
    const descriptionError = validateCreatePostDescription(
      values.description,
    );

    if (audienceError) {
      nextErrors.audience = audienceError;
    }

    if (descriptionError) {
      nextErrors.description = descriptionError;
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      onSubmit(values);
      resetForm();
      return;
    }

    pendingFocusRef.current = nextErrors.audience
      ? "audience"
      : "description";
  }

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={requestClose}
      ariaLabelledBy="create-post-modal-title"
      initialFocusRef={firstAudienceButtonRef}
      className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-[580px] overflow-visible border-0 bg-transparent p-0 text-foreground"
      dismissible={false}
    >
      <form
        className="modal-dialog-panel flex max-h-[calc(100dvh_-_2rem)] flex-col overflow-hidden rounded-[24px] border border-border bg-modal-card shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
        noValidate
        onSubmit={handleSubmit}
      >
        <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-border px-5 py-5 md:px-[26px]">
          <button
            type="button"
            className="w-fit rounded-md text-[15px] font-bold text-muted-strong outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2 focus-visible:ring-offset-modal-card"
            onClick={requestClose}
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
            className="justify-self-end rounded-md text-[15px] font-extrabold text-coral-heading outline-none transition-colors hover:text-coral-dark focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2 focus-visible:ring-offset-modal-card"
          >
            Publicar
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto px-5 py-6 md:px-[26px]">
          <div className="mb-[22px]">
            <PostAudienceSelector
              kids={kids}
              value={values.audience}
              onChange={handleAudienceChange}
              error={errors.audience}
              firstButtonRef={firstAudienceButtonRef}
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
              placeholder="Contá cómo le fue hoy…"
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

          <section aria-labelledby="create-post-photos-label">
            <h3
              id="create-post-photos-label"
              className={sectionLabelClassName}
            >
              FOTOS
            </h3>
            <div className="flex gap-3">
              <div
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[14px] border border-border bg-photo-background text-chevron"
                aria-hidden="true"
              >
                <ImageIcon size={26} />
              </div>
              <button
                type="button"
                className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-photo-border bg-photo-background text-photo-foreground disabled:opacity-100"
                disabled
                aria-label="Agregar foto (no disponible)"
              >
                <PlusIcon className="text-coral-dark" size={22} />
                <span className="text-xs">Agregar</span>
              </button>
            </div>
          </section>
        </div>
      </form>
    </ModalDialog>
  );
}
