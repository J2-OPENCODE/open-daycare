import type { ComponentProps } from "react";

type AuthFieldVariant = "default" | "code" | "password-accent";

type AuthFieldProps = Omit<ComponentProps<"input">, "className"> & {
  id: string;
  label: string;
  variant?: AuthFieldVariant;
  className?: string;
};

const inputVariantClasses: Record<AuthFieldVariant, string> = {
  default: "border-auth-input-border",
  code: "border-auth-input-border font-display text-lg font-bold tracking-[3px]",
  "password-accent": "border-auth-password-border",
};

export function AuthField({
  id,
  label,
  variant = "default",
  className = "",
  ...inputProps
}: AuthFieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-bold tracking-[0.7px] text-muted-strong"
      >
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        className={`block w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[14px] text-[15px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-auth-placeholder focus:border-coral focus:ring-[3px] focus:ring-coral/15 ${inputVariantClasses[variant]}`}
      />
    </div>
  );
}
