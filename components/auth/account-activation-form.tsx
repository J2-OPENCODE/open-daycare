import { AuthBrand } from "@/components/auth/auth-brand";
import { AuthField } from "@/components/auth/auth-field";
import { AuthPrimaryAction } from "@/components/auth/auth-primary-action";
import { CheckIcon } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { authData } from "@/data/auth";
import { findKidById } from "@/data/kids";
import Link from "next/link";

export function AccountActivationForm() {
  const invitedKid = findKidById(authData.activation.kidId);

  if (!invitedKid) {
    throw new Error("The account activation fixture references an unknown kid.");
  }

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
        Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar
        la cuenta.
      </p>

      <div className="mb-[22px] flex items-center gap-3.5 rounded-2xl border-[1.5px] border-auth-input-border bg-white px-4 py-3.5">
        <Avatar avatar={invitedKid.avatar} size="activation" />
        <div>
          <p className="text-[13px] text-muted-strong">
            Te invitaron a seguir a
          </p>
          <p className="font-display text-[17px] font-semibold text-foreground">
            {authData.activation.childLabel} · {authData.activation.roomLabel}
          </p>
        </div>
      </div>

      <form autoComplete="on">
        <AuthField
          id="invitation-code"
          label="CÓDIGO DE INVITACIÓN"
          name="invitationCode"
          defaultValue={authData.activation.invitationCode}
          autoComplete="one-time-code"
          variant="code"
          className="mb-[18px]"
        />
        <AuthField
          id="activation-email"
          label="EMAIL"
          type="email"
          name="email"
          defaultValue={authData.activation.email}
          autoComplete="email"
          className="mb-[18px]"
        />
        <AuthField
          id="activation-password"
          label="CREAR CONTRASEÑA"
          type="password"
          name="password"
          defaultValue={authData.activation.password}
          autoComplete="new-password"
          variant="password-accent"
          className="mb-[18px]"
        />

        <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-auth-consent-background px-4 py-3.5">
          <input
            type="checkbox"
            name="photoConsent"
            defaultChecked
            className="peer sr-only"
          />
          <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-auth-consent-check/30 bg-white text-transparent transition-colors peer-checked:border-auth-consent-check peer-checked:bg-auth-consent-check peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-auth-consent-check/35">
            <CheckIcon size={15} />
          </span>
          <span className="text-sm leading-[1.45] text-auth-consent-copy">
            {authData.activation.consentText}
          </span>
        </label>

        <AuthPrimaryAction>Activar mi cuenta</AuthPrimaryAction>
      </form>

      <p className="mt-[22px] text-center text-[14.5px] text-muted-strong">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-extrabold text-coral-dark">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
