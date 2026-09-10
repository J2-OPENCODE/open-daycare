import { logout } from "@/app/actions/auth";
import { AuthBrand } from "@/components/auth/auth-brand";

type WrongSessionNoticeProps = {
  returnTo: string;
};

/**
 * A session that cannot accept the invitation gets one generic message. The
 * sign-out form carries only the canonical return to this activation.
 */
export function WrongSessionNotice({ returnTo }: WrongSessionNoticeProps) {
  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-[22px]">
        <AuthBrand variant="activation" />
      </div>

      <h1
        id="account-activation-heading"
        className="mb-2 font-display text-[32px] leading-[1.15] font-semibold text-foreground"
      >
        Sesión no compatible
      </h1>
      <p className="mb-[26px] text-[15.5px] leading-[1.55] text-muted-strong">
        La sesión abierta no puede activar esta invitación. Cerrá la sesión e
        ingresá con la cuenta invitada.
      </p>

      <form action={logout}>
        <input type="hidden" name="returnTo" value={returnTo} />
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-[14px] bg-linear-to-b from-coral-start to-coral-end p-3.5 text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] outline-none transition-[filter,transform] hover:brightness-[0.98] active:translate-y-px focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
