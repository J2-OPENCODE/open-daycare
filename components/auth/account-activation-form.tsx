"use client";

import { AuthBrand } from "@/components/auth/auth-brand";
import { AuthField } from "@/components/auth/auth-field";
import { AuthPrimaryAction } from "@/components/auth/auth-primary-action";
import { Avatar } from "@/components/ui/avatar";
import type {
  ActivateNewParentField,
  ActivateNewParentState,
  ActivationInvitation,
} from "@/types/invitations";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

type ActivationAction = (
  state: ActivateNewParentState,
  formData: FormData,
) => Promise<ActivateNewParentState>;

type AccountActivationFormProps = {
  invitation: ActivationInvitation;
  /** `existing` runs under a verified parent session, so no password is asked. */
  variant: "new" | "existing";
  action: ActivationAction;
};

const INITIAL_STATE: ActivateNewParentState = {
  attempt: 0,
  fieldErrors: {},
};

/** Focus moves to the first invalid field in the order they are rendered. */
const FIELD_FOCUS_ORDER = [
  "code",
  "password",
  "passwordConfirmation",
] as const satisfies readonly ActivateNewParentField[];

export function AccountActivationForm({
  invitation,
  variant,
  action,
}: AccountActivationFormProps) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const isExistingAccount = variant === "existing";
  const codeRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const passwordConfirmationRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.attempt === 0) {
      return;
    }

    const field = FIELD_FOCUS_ORDER.find(
      (candidate) => state.fieldErrors[candidate],
    );

    if (field === "code") {
      codeRef.current?.focus();
    } else if (field === "password") {
      passwordRef.current?.focus();
    } else if (field === "passwordConfirmation") {
      passwordConfirmationRef.current?.focus();
    }
  }, [state]);

  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-[22px]">
        <AuthBrand variant="activation" />
      </div>

      <h1
        id="account-activation-heading"
        className="mb-2 font-display text-[32px] leading-[1.15] font-semibold text-foreground"
      >
        Bienvenida a OpenDayCare
      </h1>
      <p className="mb-[26px] text-[15.5px] leading-[1.55] text-muted-strong">
        {isExistingAccount
          ? "Te invitaron a seguir el día de tu hijo. Ingresá el código para vincular la cuenta."
          : "Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar la cuenta."}
      </p>

      <div className="mb-[22px] flex items-center gap-3.5 rounded-2xl border-[1.5px] border-auth-input-border bg-white px-4 py-3.5">
        <Avatar
          avatar={{
            kind: "initials",
            initials:
              Array.from(invitation.kidName.trim())[0]?.toLocaleUpperCase(
                "es",
              ) ?? "N",
            background: "#A9D9E8",
            foreground: "#1F7A93",
          }}
          size="activation"
        />
        <div className="min-w-0">
          <p className="text-[13px] text-muted-strong">
            Te invitaron a seguir a
          </p>
          <p className="truncate font-display text-[17px] font-semibold text-foreground">
            {invitation.kidName} · {invitation.roomLabel}
          </p>
        </div>
      </div>

      <form action={formAction} aria-busy={isPending} autoComplete="on">
        <AuthField
          ref={codeRef}
          id="invitation-code"
          label="CÓDIGO DE INVITACIÓN"
          name="code"
          autoComplete="one-time-code"
          inputMode="text"
          maxLength={6}
          variant="code"
          className="mb-[18px]"
          error={state.fieldErrors.code}
          disabled={isPending}
        />

        {isExistingAccount ? null : (
          <>
            <AuthField
              ref={passwordRef}
              id="activation-password"
              label="CREAR CONTRASEÑA"
              type="password"
              name="password"
              autoComplete="new-password"
              variant="password-accent"
              className="mb-[18px]"
              error={state.fieldErrors.password}
              disabled={isPending}
            />
            <AuthField
              ref={passwordConfirmationRef}
              id="activation-password-confirmation"
              label="REPETIR CONTRASEÑA"
              type="password"
              name="passwordConfirmation"
              autoComplete="new-password"
              variant="password-accent"
              className="mb-[18px]"
              error={state.fieldErrors.passwordConfirmation}
              disabled={isPending}
            />
          </>
        )}

        {/* The email is resolved on the server and shown masked; it is never editable. */}
        <p className="mb-5 rounded-[14px] bg-auth-consent-background px-4 py-3.5 text-sm leading-[1.45] text-auth-consent-copy">
          Activás la cuenta de <strong>{invitation.maskedEmail}</strong>.{" "}
          {invitation.expiresAtLabel}.
        </p>

        {state.formError ? (
          <p
            role="alert"
            className="mb-5 rounded-[14px] bg-medical-alert-background px-4 py-3 text-[13.5px] font-semibold text-modal-error"
          >
            {state.formError}
          </p>
        ) : null}

        <AuthPrimaryAction enabled pendingLabel="Activando…">
          Activar mi cuenta
        </AuthPrimaryAction>
      </form>

      {isExistingAccount ? null : (
        <p className="mt-[22px] text-center text-[14.5px] text-muted-strong">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-extrabold text-coral-dark">
            Iniciar sesión
          </Link>
        </p>
      )}
    </div>
  );
}
