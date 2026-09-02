import { ArrowLeftIcon, SunIcon } from "@/components/icons";
import { KidFacts } from "@/components/kids/kid-facts";
import { KidProfileHeader } from "@/components/kids/kid-profile-header";
import { LinkedParentsCard } from "@/components/kids/linked-parents-card";
import { MedicalNotesCard } from "@/components/kids/medical-notes-card";
import type { Kid } from "@/types/kids";
import Link from "next/link";

type KidProfileProps = {
  kid: Kid;
};

export function KidProfile({ kid }: KidProfileProps) {
  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-10 md:pt-[34px] md:pb-20">
      <Link
        href="/kids"
        className="mb-5 flex w-fit items-center gap-[7px] text-[14px] font-bold text-muted-strong transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-strong"
      >
        <ArrowLeftIcon size={18} />
        Volver a Niños
      </Link>

      <div className="flex flex-col items-stretch gap-[26px] lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-[18px]">
          <KidProfileHeader kid={kid} />
          <MedicalNotesCard medicalNotes={kid.medicalNotes} />
          <KidFacts kid={kid} />
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-3.5 lg:w-[300px]">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-foreground p-[13px] text-[15px] font-extrabold text-white disabled:opacity-100"
            disabled
            aria-label={`Ver resumen del día de ${kid.name} (no disponible)`}
          >
            <SunIcon size={18} />
            Resumen del día
          </button>
          <LinkedParentsCard parents={kid.parents} />
        </aside>
      </div>
    </div>
  );
}
