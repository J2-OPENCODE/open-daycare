import { PlusIcon } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import type { KidParent } from "@/types/kids";

type LinkedParentsCardProps = {
  parents: readonly KidParent[];
};

export function LinkedParentsCard({ parents }: LinkedParentsCardProps) {
  return (
    <section
      className="rounded-2xl border border-border bg-surface px-[18px] py-4"
      aria-labelledby="linked-parents-title"
    >
      <h2
        id="linked-parents-title"
        className="mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-section-label"
      >
        PADRES VINCULADOS
      </h2>

      <div className="flex flex-col gap-3.5">
        {parents.length === 0 ? (
          <p className="py-1 text-[14px] text-muted-strong">
            Sin padres vinculados
          </p>
        ) : (
          parents.map((parent) => {
            const isActive = parent.status === "active";

            return (
              <div key={parent.id} className="flex min-w-0 items-center gap-3">
                <Avatar avatar={parent.avatar} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-extrabold text-foreground">
                    {parent.name}
                  </p>
                  <p className="text-[12.5px] text-muted">
                    {parent.relationship} · {isActive ? "activa" : "invitación enviada"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-[9px] py-1 text-[10.5px] font-extrabold ${isActive ? "bg-parent-active-soft text-parent-active-strong" : "bg-parent-pending-soft text-parent-pending-strong"}`}
                >
                  {isActive ? "ACTIVA" : "PENDIENTE"}
                </span>
              </div>
            );
          })
        )}

        <button
          type="button"
          className="flex items-center gap-3 pt-2 text-left disabled:opacity-100"
          disabled
          aria-label="Vincular otro padre (no disponible)"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-parent-link-border text-photo-foreground">
            <PlusIcon size={18} />
          </span>
          <span className="text-[14.5px] font-extrabold text-coral-dark">
            Vincular otro padre
          </span>
        </button>
      </div>
    </section>
  );
}
