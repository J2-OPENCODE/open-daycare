"use client";

import { createParentInvitation } from "@/app/kids/actions";
import { CloseIcon, InfoIcon, SendIcon } from "@/components/icons";
import { ModalDialog } from "@/components/ui/modal-dialog";
import {
  INITIAL_LINK_PARENT_FORM_VALUES,
  LINK_PARENT_RELATIONSHIPS,
  validateParentEmail,
  validateParentName,
  type LinkParentField,
  type LinkParentFormErrors,
  type RequiredLinkParentField,
} from "@/lib/link-parent-form";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";

/** Focus moves to the first invalid field in the order they are rendered. */
const FIELD_FOCUS_ORDER = [
  "parentName",
  "email",
  "relationship",
] as const satisfies readonly LinkParentField[];

const labelClassName =
  "mb-2 block text-xs font-extrabold tracking-[0.7px] text-muted-strong";
const fieldClassName =
  "block w-full rounded-[14px] border-[1.5px] border-modal-field-border bg-modal-field px-4 py-[13px] text-[15px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-auth-placeholder focus:border-coral focus:ring-[3px] focus:ring-[var(--modal-focus-ring)]";

type LinkParentModalProps = {
  isOpen: boolean;
  childId: string;
  kidName: string;
  onClose: () => void;
  onAfterClose: () => void;
  onSuccess: () => void;
};

export function LinkParentModal({
  isOpen,
  childId,
  kidName,
  onClose,
  onAfterClose,
  onSuccess,
}: LinkParentModalProps) {
  const [values, setValues] = useState(INITIAL_LINK_PARENT_FORM_VALUES);
  const [errors, setErrors] = useState<LinkParentFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isSending, startSending] = useTransition();
  const parentNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const relationshipRef = useRef<HTMLButtonElement>(null);
  const pendingFocusRef = useRef<LinkParentField>(null);

  useEffect(() => {
    const field = pendingFocusRef.current;

    if (!field || !errors[field]) {
      return;
    }

    if (field === "parentName") {
      parentNameRef.current?.focus();
    } else if (field === "email") {
      emailRef.current?.focus();
    } else {
      relationshipRef.current?.focus();
    }

    pendingFocusRef.current = null;
  }, [errors]);

  function resetForm() {
    setValues(INITIAL_LINK_PARENT_FORM_VALUES);
    setErrors({});
    setFormError(null);
    setHasAttemptedSubmit(false);
    pendingFocusRef.current = null;
  }

  function requestClose() {
    // Closing mid-flight would hide an outcome the staff member must see.
    if (isSending) {
      return;
    }

    resetForm();
    onClose();
  }

  function focusFirstInvalidField(nextErrors: LinkParentFormErrors) {
    pendingFocusRef.current =
      FIELD_FOCUS_ORDER.find((field) => nextErrors[field]) ?? null;
  }

  function revalidateField(
    field: RequiredLinkParentField,
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // A second submit while the first is in flight would create a second row.
    if (isSending) {
      return;
    }

    setHasAttemptedSubmit(true);
    setFormError(null);

    const nextErrors: LinkParentFormErrors = {};
    const parentNameError = validateParentName(values.parentName);
    const emailError = validateParentEmail(values.email);

    if (parentNameError) {
      nextErrors.parentName = parentNameError;
    }

    if (emailError) {
      nextErrors.email = emailError;
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalidField(nextErrors);
      return;
    }

    startSending(async () => {
      const result = await createParentInvitation({
        childId,
        parentName: values.parentName,
        email: values.email,
        relationship: values.relationship,
      });

      // Only a confirmed send clears the form and closes the modal.
      if (result.status === "success") {
        resetForm();
        onSuccess();
        return;
      }

      if (result.status === "invalid") {
        setErrors(result.errors);
        focusFirstInvalidField(result.errors);
        return;
      }

      setFormError(result.message);
    });
  }

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={requestClose}
      onAfterClose={onAfterClose}
      ariaLabelledBy="link-parent-modal-title"
      dismissible={!isSending}
      initialFocusRef={parentNameRef}
      className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-[480px] overflow-visible border-0 bg-transparent p-0 text-foreground"
    >
      <form
        className="modal-dialog-panel flex max-h-[calc(100dvh_-_2rem)] flex-col overflow-hidden rounded-[24px] border border-border bg-modal-card shadow-[var(--modal-shadow)]"
        noValidate
        aria-busy={isSending}
        onSubmit={handleSubmit}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-5 md:px-[26px]">
          <div className="min-w-0 pr-3">
            <h2
              id="link-parent-modal-title"
              className="font-display text-[18px] font-semibold text-foreground"
            >
              Vincular padre
            </h2>
            <p className="mt-0.5 break-words text-[13px] text-muted">
              a {kidName}
            </p>
          </div>
          <button
            type="button"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-card-divider text-muted-strong outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2 focus-visible:ring-offset-modal-card"
            onClick={requestClose}
            disabled={isSending}
            aria-label="Cerrar Vincular padre"
          >
            <CloseIcon size={18} />
          </button>
        </header>

        <div className="min-h-0 overscroll-contain overflow-y-auto px-5 py-[22px] md:px-[26px]">
          <div className="mb-5 flex gap-[11px] rounded-[14px] bg-[#E3ECFB] px-4 py-[13px] text-[#3F5694]">
            <InfoIcon className="mt-px shrink-0 text-announcement-strong" size={20} />
            <p className="min-w-0 break-words text-[13.5px] leading-[1.45]">
              Le enviaremos un correo con un código para que active su cuenta.
              Solo verá el feed de {kidName}.
            </p>
          </div>

          <div className="mb-[18px]">
            <label htmlFor="link-parent-name" className={labelClassName}>
              NOMBRE DEL PADRE/MADRE
            </label>
            <input
              ref={parentNameRef}
              id="link-parent-name"
              name="parentName"
              type="text"
              autoComplete="name"
              disabled={isSending}
              placeholder="Ej. Diego Fernández"
              className={`${fieldClassName} ${errors.parentName ? "border-modal-error focus:border-modal-error focus:ring-modal-error/15" : ""}`}
              value={values.parentName}
              onChange={(event) => {
                const parentName = event.currentTarget.value;
                setValues((currentValues) => ({
                  ...currentValues,
                  parentName,
                }));
                revalidateField(
                  "parentName",
                  validateParentName(parentName),
                );
              }}
              aria-invalid={Boolean(errors.parentName)}
              aria-describedby={
                errors.parentName ? "link-parent-name-error" : undefined
              }
              required
            />
            {errors.parentName ? (
              <p
                id="link-parent-name-error"
                className="mt-1.5 text-[13px] font-semibold text-modal-error"
              >
                {errors.parentName}
              </p>
            ) : null}
          </div>

          <div className="mb-[18px]">
            <label htmlFor="link-parent-email" className={labelClassName}>
              EMAIL
            </label>
            <input
              ref={emailRef}
              id="link-parent-email"
              name="email"
              type="email"
              autoComplete="email"
              disabled={isSending}
              placeholder="correo@ejemplo.com"
              className={`${fieldClassName} ${errors.email ? "border-modal-error focus:border-modal-error focus:ring-modal-error/15" : ""}`}
              value={values.email}
              onChange={(event) => {
                const email = event.currentTarget.value;
                setValues((currentValues) => ({
                  ...currentValues,
                  email,
                }));
                revalidateField("email", validateParentEmail(email));
              }}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "link-parent-email-error" : undefined
              }
              required
            />
            {errors.email ? (
              <p
                id="link-parent-email-error"
                className="mt-1.5 text-[13px] font-semibold text-modal-error"
              >
                {errors.email}
              </p>
            ) : null}
          </div>

          <fieldset
            className="mb-5"
            aria-describedby={
              errors.relationship ? "link-parent-relationship-error" : undefined
            }
          >
            <legend className={`${labelClassName} w-full`}>PARENTESCO</legend>
            <div className="flex gap-[9px]">
              {LINK_PARENT_RELATIONSHIPS.map((relationship, index) => {
                const isSelected = relationship === values.relationship;

                return (
                  <button
                    key={relationship}
                    ref={index === 0 ? relationshipRef : undefined}
                    type="button"
                    disabled={isSending}
                    className={`flex-1 rounded-full border-[1.5px] px-2 py-[11px] text-[14px] font-extrabold outline-none transition-[border-color,background-color,color] focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2 focus-visible:ring-offset-modal-card ${isSelected ? "border-[#9FB8EC] bg-announcement-soft text-announcement-strong" : "border-border bg-surface text-[#6E6359]"}`}
                    aria-pressed={isSelected}
                    onClick={() =>
                      setValues((currentValues) => ({
                        ...currentValues,
                        relationship,
                      }))
                    }
                  >
                    {relationship}
                  </button>
                );
              })}
            </div>
            {errors.relationship ? (
              <p
                id="link-parent-relationship-error"
                className="mt-1.5 text-[13px] font-semibold text-modal-error"
              >
                {errors.relationship}
              </p>
            ) : null}
          </fieldset>

          {formError ? (
            <p
              role="alert"
              className="mb-4 rounded-[14px] bg-medical-alert-background px-4 py-3 text-[13.5px] font-semibold text-modal-error"
            >
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSending}
            className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-linear-to-b from-coral-start to-coral-end p-3.5 text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] outline-none transition-[filter,transform] hover:brightness-[0.98] active:translate-y-px focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2 focus-visible:ring-offset-modal-card disabled:cursor-not-allowed disabled:opacity-70"
          >
            <SendIcon size={19} />
            {isSending ? "Enviando…" : "Enviar invitación"}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
}
