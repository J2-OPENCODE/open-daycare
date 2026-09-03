import { AccountActivationForm } from "@/components/auth/account-activation-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activar cuenta | OpenDayCare",
  description: "Activación de cuenta de demostración en OpenDayCare.",
};

export default function ActivateAccountPage() {
  return (
    <main
      className="flex min-h-dvh items-center justify-center bg-auth-background px-5 py-8 md:p-10"
      aria-labelledby="account-activation-heading"
    >
      <AccountActivationForm />
    </main>
  );
}
