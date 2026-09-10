import { AuthBrand } from "@/components/auth/auth-brand";
import Link from "next/link";

/**
 * One generic state for every rejected token, so the page never confirms
 * whether an invitation existed, expired, was cancelled or belongs to someone
 * else.
 */
export function InvalidActivation() {
  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-[22px]">
        <AuthBrand variant="activation" />
      </div>

      <h1
        id="account-activation-heading"
        className="mb-2 font-display text-[32px] leading-[1.15] font-semibold text-foreground"
      >
        Enlace no disponible
      </h1>
      <p className="mb-[26px] text-[15.5px] leading-[1.55] text-muted-strong">
        Este enlace de activación no es válido o ya venció. Pedí una invitación
        nueva a la guardería.
      </p>

      <p className="text-center text-[14.5px] text-muted-strong">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-extrabold text-coral-dark">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
