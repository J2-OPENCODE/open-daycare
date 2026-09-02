import { WarningIcon } from "@/components/icons";
import type { KidMedicalNotes } from "@/types/kids";

type MedicalNotesCardProps = {
  medicalNotes: KidMedicalNotes;
};

export function MedicalNotesCard({ medicalNotes }: MedicalNotesCardProps) {
  const hasAlert = medicalNotes.kind === "alert";

  return (
    <section
      className={
        hasAlert
          ? "flex gap-3.5 rounded-2xl bg-medical-alert-background p-4 md:px-[18px]"
          : "rounded-2xl border border-border bg-surface px-[18px] py-4"
      }
      aria-labelledby="medical-notes-title"
    >
      {hasAlert ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-medical-alert-icon text-white">
          <WarningIcon size={22} />
        </span>
      ) : null}

      <div>
        <h2
          id="medical-notes-title"
          className={`mb-0.5 text-[15px] font-extrabold ${hasAlert ? "text-medical-alert-heading" : "text-foreground"}`}
        >
          Alergias y notas
        </h2>
        <p
          className={`text-[14px] leading-normal md:text-[14.5px] ${hasAlert ? "text-medical-alert-copy" : "text-muted-strong"}`}
        >
          {medicalNotes.text}
        </p>
      </div>
    </section>
  );
}
