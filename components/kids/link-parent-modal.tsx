"use client";

import { CloseIcon, InfoIcon, SendIcon } from "@/components/icons";
import { ModalDialog } from "@/components/ui/modal-dialog";
import {
  INITIAL_LINK_PARENT_FORM_VALUES,
  LINK_PARENT_INVITATION_CODE,
  LINK_PARENT_INVITATION_EXPIRY,
  LINK_PARENT_RELATIONSHIPS,
  validateParentEmail,
  validateParentName,
  type LinkParentFormErrors,
  type LinkParentFormValues,
  type RequiredLinkParentField,
} from "@/lib/link-parent-form";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

const labelClassName =
  "mb-2 block text-xs font-extrabold tracking-[0.7px] text-muted-strong";
const fieldClassName =
  "block w-full rounded-[14px] border-[1.5px] border-modal-field-border bg-modal-field px-4 py-[13px] text-[15px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-auth-placeholder focus:border-coral focus:ring-[3px] focus:ring-[var(--modal-focus-ring)]";

type LinkParentModalProps = {
  isOpen: boolean;
  kidName: string;
  onClose: () => void;
  onAfterClose: () => void;
  onSubmit: (values: LinkParentFormValues) => void;
};

export function LinkParentModal({
  isOpen,
  kidName,
  onClose,
  onAfterClose,
  onSubmit,
}: LinkParentModalProps) {
  const [values, setValues] = useState(INITIAL_LINK_PARENT_FORM_VALUES);
  const [errors, setErrors] = useState<LinkParentFormErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const parentNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const pendingFocusRef = useRef<RequiredLinkParentField>(null);

  useEffect(() => {
    const field = pendingFocusRef.current;

    if (!field || !errors[field]) {
      return;
    }

    if (field === "parentName") {
      parentNameRef.current?.focus();
    } else {
      emailRef.current?.focus();
    }

    pendingFocusRef.current = null;
  }, [errors]);

  function resetForm() {
    setValues(INITIAL_LINK_PARENT_FORM_VALUES);
    setErrors({});
    setHasAttemptedSubmit(false);
    pendingFocusRef.current = null;
  }

  function requestClose() {
    resetForm();
    onClose();
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
    setHasAttemptedSubmit(true);

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

    if (Object.keys(nextErrors).length === 0) {
      onSubmit(values);
      resetForm();
      return;
    }

    pendingFocusRef.current = nextErrors.parentName ? "parentName" : "email";
  }

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={requestClose}
      onAfterClose={onAfterClose}
      ariaLabelledBy="link-parent-modal-title"
      initialFocusRef={parentNameRef}
      className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-[480px] overflow-visible border-0 bg-transparent p-0 text-foreground"
    >
      <form
        className="modal-dialog-panel flex max-h-[calc(100dvh_-_2rem)] flex-col overflow-hidden rounded-[24px] border border-border bg-modal-card shadow-[var(--modal-shadow)]"
        noValidate
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

          <fieldset className="mb-5">
            <legend className={`${labelClassName} w-full`}>PARENTESCO</legend>
            <div className="flex gap-[9px]">
              {LINK_PARENT_RELATIONSHIPS.map((relationship) => {
                const isSelected = relationship === values.relationship;

                return (
                  <button
                    key={relationship}
                    type="button"
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
          </fieldset>

          <div className="mb-5 rounded-2xl border-[1.5px] border-dashed border-[#E6D08A] bg-auth-consent-background p-[18px] text-center text-auth-consent-copy">
            <p className="mb-2 text-xs font-extrabold tracking-[0.7px] text-[#A88526]">
              CÓDIGO DE INVITACIÓN
            </p>
            <p className="font-display text-[30px] font-semibold tracking-[5px] text-auth-consent-copy sm:text-[34px] sm:tracking-[7px]">
              {LINK_PARENT_INVITATION_CODE}
            </p>
            <p className="mt-1.5 text-[13px] text-[#A88526]">
              {LINK_PARENT_INVITATION_EXPIRY}
            </p>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-linear-to-b from-coral-start to-coral-end p-3.5 text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] outline-none transition-[filter,transform] hover:brightness-[0.98] active:translate-y-px focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2 focus-visible:ring-offset-modal-card"
          >
            <SendIcon size={19} />
            Enviar invitación
          </button>
        </div>
      </form>
    </ModalDialog>
  );
}
