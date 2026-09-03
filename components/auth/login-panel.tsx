import { AuthBrand } from "@/components/auth/auth-brand";

export function LoginPanel() {
  return (
    <aside className="relative hidden min-h-dvh overflow-hidden bg-linear-155 from-auth-panel-start from-0% via-coral via-45% to-auth-panel-end to-100% px-[60px] py-14 text-white md:flex md:flex-col md:justify-between">
      <span
        className="absolute -top-[140px] -right-[120px] h-[420px] w-[420px] rounded-full bg-white/12"
        aria-hidden="true"
      />
      <span
        className="absolute -bottom-[110px] -left-20 h-[300px] w-[300px] rounded-full bg-white/10"
        aria-hidden="true"
      />

      <div className="relative">
        <AuthBrand variant="panel" />
      </div>

      <div className="relative">
        <h1 className="mb-[18px] font-display text-[42px] leading-[1.12] font-semibold">
          El día de cada niño,
          <br />
          compartido con su familia.
        </h1>
        <p className="max-w-[430px] text-[17px] leading-[1.6] text-white/92">
          Publicá momentos, gestioná las salas y mantené a las familias cerca,
          desde un solo lugar.
        </p>
      </div>

      <p className="relative text-sm text-white/90">
        <span aria-hidden="true">🌿</span> Guardería Sala Soles
      </p>
    </aside>
  );
}
