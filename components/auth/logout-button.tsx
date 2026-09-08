"use client";

import { logout } from "@/app/actions/auth";
import { LogOutIcon } from "@/components/icons";
import { useFormStatus } from "react-dom";

type LogoutButtonProps = {
  variant: "sidebar" | "mobile";
};

function LogoutSubmit({ variant }: LogoutButtonProps) {
  const { pending } = useFormStatus();
  const className =
    variant === "sidebar"
      ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-background text-muted-strong transition-colors hover:text-coral-dark disabled:cursor-wait disabled:opacity-60"
      : "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-background text-muted-strong transition-colors hover:text-coral-dark disabled:cursor-wait disabled:opacity-60";

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-label={pending ? "Cerrando sesión" : "Cerrar sesión"}
    >
      <LogOutIcon size={variant === "sidebar" ? 16 : 18} />
    </button>
  );
}

export function LogoutButton({ variant }: LogoutButtonProps) {
  return (
    <form action={logout}>
      <LogoutSubmit variant={variant} />
    </form>
  );
}
