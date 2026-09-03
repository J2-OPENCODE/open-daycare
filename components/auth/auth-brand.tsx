import { SunIcon } from "@/components/icons";

type AuthBrandProps = {
  variant: "panel" | "compact" | "activation";
};

export function AuthBrand({ variant }: AuthBrandProps) {
  if (variant === "activation") {
    return (
      <span
        className="flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-linear-to-br from-[#F8C3A8] to-coral text-white shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]"
        aria-hidden="true"
      >
        <SunIcon size={30} />
      </span>
    );
  }

  const isPanel = variant === "panel";

  return (
    <div
      className={`flex items-center ${isPanel ? "gap-[13px] text-white" : "gap-[11px] text-foreground"}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center text-white ${
          isPanel
            ? "h-[46px] w-[46px] rounded-[14px] bg-white/20"
            : "h-[42px] w-[42px] rounded-[13px] bg-linear-to-br from-[#F8C3A8] to-coral shadow-[0_10px_22px_-10px_rgba(238,129,100,0.65)]"
        }`}
      >
        <SunIcon size={isPanel ? 26 : 23} />
      </span>
      <span
        className={`font-display font-semibold tracking-[0.5px] ${isPanel ? "text-[21px]" : "text-[19px]"}`}
      >
        OpenDayCare
      </span>
    </div>
  );
}
