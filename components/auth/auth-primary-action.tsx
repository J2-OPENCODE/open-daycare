"use client";

import { useFormStatus } from "react-dom";

type AuthPrimaryActionProps = {
  children: string;
  enabled?: boolean;
  pendingLabel?: string;
};

export function AuthPrimaryAction({
  children,
  enabled = false,
  pendingLabel = children,
}: AuthPrimaryActionProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type={enabled ? "submit" : "button"}
      className="block w-full rounded-[15px] bg-linear-to-b from-coral-start to-coral-end p-[15px] text-center text-base font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:cursor-default disabled:opacity-100 enabled:hover:brightness-[0.98]"
      disabled={!enabled || pending}
      aria-label={enabled ? undefined : `${children} (no disponible)`}
    >
      {enabled && pending ? pendingLabel : children}
    </button>
  );
}
