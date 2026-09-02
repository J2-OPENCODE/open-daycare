import type { Kid } from "@/types/kids";

type KidFactsProps = {
  kid: Kid;
};

const labels = {
  birthDateLabel: "Fecha de nacimiento",
  roomName: "Sala",
  enrollmentLabel: "Ingreso",
} as const;

export function KidFacts({ kid }: KidFactsProps) {
  return (
    <dl className="overflow-hidden rounded-2xl border border-border bg-surface">
      {(Object.keys(labels) as Array<keyof typeof labels>).map(
        (property, index) => (
          <div
            key={property}
            className={`flex items-center justify-between gap-6 px-[18px] py-[15px] ${index < 2 ? "border-b border-card-divider" : ""}`}
          >
            <dt className="text-[14px] text-muted-strong md:text-[14.5px]">
              {labels[property]}
            </dt>
            <dd className="text-right text-[14px] font-extrabold text-foreground md:text-[14.5px]">
              {kid[property]}
            </dd>
          </div>
        ),
      )}
    </dl>
  );
}
