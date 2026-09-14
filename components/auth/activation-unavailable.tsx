import { AuthBrand } from "@/components/auth/auth-brand";

/**
 * Shown when the invitation is valid but the routing decision could not be
 * resolved. The signup form must never appear under that doubt, and the copy
 * never reveals the cause.
 */
export function ActivationUnavailable() {
  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-[22px]">
        <AuthBrand variant="activation" />
      </div>

      <h1
        id="account-activation-heading"
        className="mb-2 font-display text-[32px] leading-[1.15] font-semibold text-foreground"
      >
        No pudimos continuar
      </h1>
      <p className="text-[15.5px] leading-[1.55] text-muted-strong">
        No pudimos abrir la activación en este momento. Volvé a entrar al enlace
        del correo en unos minutos.
      </p>
    </div>
  );
}
