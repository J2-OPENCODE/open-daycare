type AuthPrimaryActionProps = {
  children: string;
};

export function AuthPrimaryAction({ children }: AuthPrimaryActionProps) {
  return (
    <button
      type="button"
      className="block w-full rounded-[15px] bg-linear-to-b from-coral-start to-coral-end p-[15px] text-center text-base font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:cursor-default disabled:opacity-100"
      disabled
      aria-label={`${children} (no disponible)`}
    >
      {children}
    </button>
  );
}
