import type { ComponentProps } from "react";

type AuthFieldVariant = "default" | "code" | "password-accent";

type AuthFieldProps = Omit<ComponentProps<"input">, "className"> & {
  id: string;
  label: string;
  variant?: AuthFieldVariant;
  className?: string;
  error?: string;
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
  error,
  ...inputProps
}: AuthFieldProps) {
  const errorId = `${id}-error`;
  const describedBy = [inputProps["aria-describedby"], error ? errorId : null]
    .filter(Boolean)
    .join(" ");

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
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(error)}
        className={`block w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[14px] text-[15px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-auth-placeholder focus:border-coral focus:ring-[3px] focus:ring-coral/15 ${inputVariantClasses[variant]}`}
      />
      {error ? (
        <p id={errorId} className="mt-1.5 text-[13px] font-semibold text-[#B44735]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
