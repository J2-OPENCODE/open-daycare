import { LoginForm } from "@/components/auth/login-form";
import { LoginPanel } from "@/components/auth/login-panel";
import { getAuthAccessState } from "@/lib/auth";
import { resolveActivationReturnTo } from "@/lib/invitations";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Any `returnTo`, valid or not, means the URL may carry an activation token,
 * so the page is never indexed and never propagates a referrer.
 */
export async function generateMetadata({
  searchParams,
}: LoginPageProps): Promise<Metadata> {
  const query = await searchParams;
  const metadata: Metadata = {
    title: "Iniciar sesión | OpenDayCare",
    description: "Acceso a OpenDayCare.",
  };

  if (query.returnTo === undefined) {
    return metadata;
  }

  return {
    ...metadata,
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [access, query] = await Promise.all([
    getAuthAccessState(),
    searchParams,
  ]);
  // Only a canonical internal destination survives; anything else is dropped.
  const returnTo = resolveActivationReturnTo(query.returnTo);

  if (access.status === "active") {
    redirect(returnTo ?? "/");
  }

  const notice =
    query.reason === "inactive"
      ? "Tu cuenta no está activa. Contactá a la guardería."
      : undefined;

  return (
    <main className="grid min-h-dvh bg-auth-background md:grid-cols-[1.05fr_1fr]">
      <LoginPanel />

      <section
        className="flex min-w-0 items-center justify-center px-5 py-8 md:p-10"
        aria-labelledby="login-heading"
      >
        <LoginForm notice={notice} returnTo={returnTo} />
      </section>
    </main>
  );
}
