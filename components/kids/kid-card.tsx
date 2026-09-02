import { ChevronRightIcon } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import type { Kid } from "@/types/kids";
import Link from "next/link";

type KidCardProps = {
  kid: Kid;
};

function getParentsLabel(parentCount: number) {
  if (parentCount === 0) {
    return "sin padres vinculados";
  }

  return `${parentCount} ${parentCount === 1 ? "padre vinculado" : "padres vinculados"}`;
}

export function KidCard({ kid }: KidCardProps) {
  return (
    <Link
      href={`/kids/${kid.id}`}
      className="flex min-w-0 items-center gap-3.5 rounded-[18px] border border-border bg-surface p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[#F2A78E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
    >
      <Avatar avatar={kid.avatar} size="xl" />

      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-base font-semibold text-foreground">
          {kid.name}
        </span>
        <span className="block text-[13px] leading-[1.35] text-muted">
          {kid.ageYears} años · {getParentsLabel(kid.parents.length)}
        </span>
      </span>

      {kid.listBadge?.kind === "medical" ? (
        <span className="shrink-0 rounded-full bg-medical-badge-soft px-[9px] py-[5px] text-[11px] font-extrabold text-medical-badge-strong">
          {kid.listBadge.label}
        </span>
      ) : kid.listBadge?.kind === "link" ? (
        <span className="shrink-0 rounded-full bg-link-badge-soft px-[9px] py-[5px] text-[11px] font-extrabold text-link-badge-strong">
          {kid.listBadge.label}
        </span>
      ) : (
        <ChevronRightIcon className="shrink-0 text-chevron" size={18} />
      )}
    </Link>
  );
}
