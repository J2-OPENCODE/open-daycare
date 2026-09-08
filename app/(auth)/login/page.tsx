import { LoginForm } from "@/components/auth/login-form";
import { LoginPanel } from "@/components/auth/login-panel";
import { getAuthAccessState } from "@/lib/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Iniciar sesión | OpenDayCare",
  description: "Acceso de demostración a OpenDayCare.",
};

type LoginPageProps = {
  searchParams: Promise<{ reason?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [access, query] = await Promise.all([
    getAuthAccessState(),
    searchParams,
  ]);

  if (access.status === "active") {
    redirect("/");
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
        <LoginForm notice={notice} />
      </section>
    </main>
  );
}
