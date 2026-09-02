import { Avatar } from "@/components/ui/avatar";
import type { Kid } from "@/types/kids";

type KidProfileHeaderProps = {
  kid: Kid;
};

export function KidProfileHeader({ kid }: KidProfileHeaderProps) {
  return (
    <header className="flex flex-wrap items-center gap-4 md:gap-[18px]">
      <Avatar avatar={kid.avatar} size="profile" />

      <div className="min-w-0 flex-1 max-sm:min-w-[calc(100%-88px)]">
        <h1 className="font-display text-[25px] leading-tight font-semibold text-foreground md:text-[28px]">
          {kid.name}
        </h1>
        <p className="mt-1 text-[14px] text-muted-strong md:text-[15px]">
          {kid.ageYears} años · Sala {kid.roomName}
        </p>
      </div>

      <button
        type="button"
        className="rounded-xl border-[1.5px] border-border bg-surface px-4 py-[9px] text-[14px] font-bold text-[#6E6359] disabled:opacity-100 max-sm:ml-[88px]"
        disabled
        aria-label={`Editar perfil de ${kid.name} (no disponible)`}
      >
        Editar
      </button>
    </header>
  );
}
