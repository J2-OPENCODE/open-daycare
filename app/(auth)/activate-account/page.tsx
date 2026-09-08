import { AccountActivationForm } from "@/components/auth/account-activation-form";
import { getAuthAccessState } from "@/lib/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Activar cuenta | OpenDayCare",
  description: "Activación de cuenta de demostración en OpenDayCare.",
};

export default async function ActivateAccountPage() {
  const access = await getAuthAccessState();

  if (access.status === "active") {
    redirect("/");
  }

  return (
    <main
      className="flex min-h-dvh items-center justify-center bg-auth-background px-5 py-8 md:p-10"
      aria-labelledby="account-activation-heading"
    >
      <AccountActivationForm />
    </main>
  );
}
