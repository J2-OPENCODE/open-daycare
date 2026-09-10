import { AuthBrand } from "@/components/auth/auth-brand";
import { getAuthAccessState } from "@/lib/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Cuenta activada | OpenDayCare",
  description: "Confirmación de activación de cuenta en OpenDayCare.",
};

/**
 * The confirmation carries no token, email, child or identifier: it is proven
 * by the session alone, so it cannot be reached with a crafted URL.
 */
export default async function ActivationSuccessPage() {
  const access = await getAuthAccessState();

  if (access.status === "anonymous") {
    redirect("/login");
  }

  if (access.status !== "active") {
    redirect("/login?reason=inactive");
  }

  if (access.role !== "parent") {
    redirect("/");
  }

  return (
    <main
      className="flex min-h-dvh items-center justify-center bg-auth-background px-5 py-8 md:p-10"
      aria-labelledby="activation-success-heading"
    >
      <div className="w-full max-w-[440px]">
        <div className="mb-[22px]">
          <AuthBrand variant="activation" />
        </div>

        <h1
          id="activation-success-heading"
          className="mb-2 font-display text-[32px] leading-[1.15] font-semibold text-foreground"
        >
          Cuenta activada
        </h1>
        <p className="mb-[26px] text-[15.5px] leading-[1.55] text-muted-strong">
          El vínculo con la guardería está listo. Ya podés seguir el día de tu
          hijo desde OpenDayCare.
        </p>

        <Link
          href="/"
          className="block w-full rounded-[15px] bg-linear-to-b from-coral-start to-coral-end p-[15px] text-center text-base font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] outline-none transition-[filter] hover:brightness-[0.98] focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
