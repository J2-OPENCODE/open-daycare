import { LoginForm } from "@/components/auth/login-form";
import { LoginPanel } from "@/components/auth/login-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión | OpenDayCare",
  description: "Acceso de demostración a OpenDayCare.",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh bg-auth-background md:grid-cols-[1.05fr_1fr]">
      <LoginPanel />

      <section
        className="flex min-w-0 items-center justify-center px-5 py-8 md:p-10"
        aria-labelledby="login-heading"
      >
        <LoginForm />
      </section>
    </main>
  );
}
