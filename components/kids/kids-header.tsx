import { PlusIcon } from "@/components/icons";

type KidsHeaderProps = {
  onAddKid: () => void;
};

export function KidsHeader({ onAddKid }: KidsHeaderProps) {
  return (
    <header className="mb-[22px] flex items-end justify-between gap-4">
      <div>
        <p className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-coral-heading">
          GESTIÓN
        </p>
        <h1 className="font-display text-[30px] font-semibold text-foreground">
          Niños
        </h1>
      </div>

      <button
        type="button"
        className="flex items-center gap-2 rounded-[14px] bg-linear-to-b from-coral-start to-coral-end px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
        onClick={(event) => {
          event.currentTarget.focus();
          onAddKid();
        }}
      >
        <PlusIcon size={17} />
        Agregar niño
      </button>
    </header>
  );
}
