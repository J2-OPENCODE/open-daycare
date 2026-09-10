import { ChevronRightIcon } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import type { Kid } from "@/types/kids";
import Link from "next/link";

type KidCardProps = {
  kid: Kid;
};

/** Only active links count; a pending invitation is not a link yet. */
function getParentsLabel(activeParentCount: number) {
  if (activeParentCount === 0) {
    return "sin padres vinculados";
  }

  return `${activeParentCount} ${activeParentCount === 1 ? "padre vinculado" : "padres vinculados"}`;
}

const BADGE_CLASSNAME = {
  medical: "bg-medical-badge-soft text-medical-badge-strong",
  pending: "bg-parent-pending-soft text-parent-pending-strong",
  link: "bg-link-badge-soft text-link-badge-strong",
} as const;

export function KidCard({ kid }: KidCardProps) {
  return (
    <Link
      href={`/kids/${kid.slug}`}
      className="flex min-w-0 items-center gap-3.5 rounded-[18px] border border-border bg-surface p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[#F2A78E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
    >
      <Avatar avatar={kid.avatar} size="xl" />

      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-base font-semibold text-foreground">
          {kid.name}
        </span>
        <span className="block text-[13px] leading-[1.35] text-muted">
          {kid.ageYears} {kid.ageYears === 1 ? "año" : "años"} ·{" "}
          {getParentsLabel(kid.activeParentCount)}
        </span>
      </span>

      {kid.listBadge ? (
        <span
          className={`shrink-0 rounded-full px-[9px] py-[5px] text-[11px] font-extrabold ${BADGE_CLASSNAME[kid.listBadge.kind]}`}
        >
          {kid.listBadge.label}
        </span>
      ) : (
        <ChevronRightIcon className="shrink-0 text-chevron" size={18} />
      )}
    </Link>
  );
}
