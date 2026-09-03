import { AuthBrand } from "@/components/auth/auth-brand";
import { AuthField } from "@/components/auth/auth-field";
import { AuthPrimaryAction } from "@/components/auth/auth-primary-action";
import { authData } from "@/data/auth";
import Link from "next/link";

export function LoginForm() {
  return (
    <div className="w-full max-w-[392px]">
      <div className="mb-8 md:hidden">
        <AuthBrand variant="compact" />
      </div>

      <h2
        id="login-heading"
        className="mb-1.5 font-display text-[30px] font-semibold text-foreground"
      >
        Iniciar sesión
      </h2>
      <p className="mb-7 text-[15px] text-muted-strong">
        Ingresá para ver el día de hoy.
      </p>

      <form autoComplete="on">
        <AuthField
          id="login-email"
          label="EMAIL"
          type="email"
          name="email"
          defaultValue={authData.login.email}
          autoComplete="email"
          className="mb-[18px]"
        />
        <AuthField
          id="login-password"
          label="CONTRASEÑA"
          type="password"
          name="password"
          placeholder={authData.login.passwordPlaceholder}
          autoComplete="current-password"
          className="mb-2.5"
        />

        <div className="mb-5 text-right">
          <span
            className="text-[13.5px] font-bold text-coral-dark"
            role="link"
            aria-disabled="true"
            aria-label="¿Olvidaste tu contraseña? (no disponible)"
          >
            ¿Olvidaste tu contraseña?
          </span>
        </div>

        <AuthPrimaryAction>Iniciar sesión</AuthPrimaryAction>
      </form>

      <p className="mt-6 text-center text-[14.5px] text-muted-strong">
        ¿Te invitó la guardería?{" "}
        <Link href="/activate-account" className="font-extrabold text-coral-dark">
          Activá tu cuenta
        </Link>
      </p>
    </div>
  );
}
