import {
  BellIcon,
  ChildrenIcon,
  HomeIcon,
  PlusIcon,
  UserIcon,
} from "@/components/icons";
import {
  type AppDestination,
  Brand,
} from "@/components/layout/sidebar";
import Link from "next/link";

type MobileNavigationProps = {
  roomName: string;
  currentDestination: AppDestination;
};

const navigationItems = [
  { destination: "feed", label: "Feed", icon: HomeIcon, href: "/" },
  { destination: "kids", label: "Niños", icon: ChildrenIcon, href: "/kids" },
  { destination: null, label: "Avisos", icon: BellIcon, href: null },
  { destination: null, label: "Mi cuenta", icon: UserIcon, href: null },
] as const;

export function MobileNavigation({
  roomName,
  currentDestination,
}: MobileNavigationProps) {
  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
        <Brand roomName={roomName} variant="mobile" />
        <button
          type="button"
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-linear-to-b from-coral-start to-coral-end text-white shadow-[0_6px_14px_-7px_rgba(238,129,100,0.75)] disabled:opacity-100"
          disabled
          aria-label="Nueva publicación (no disponible)"
        >
          <PlusIcon size={18} />
        </button>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navegación principal"
      >
        {navigationItems.map(
          ({ destination, label, icon: NavigationIcon, href }) => {
            const current = destination === currentDestination;
            const className = `flex min-h-16 flex-col items-center justify-center gap-1 text-[11.5px] ${
              current
                ? "font-extrabold text-coral-heading"
                : "font-semibold text-[#6E6359]"
            }`;
            const content = (
              <>
                <NavigationIcon size={20} />
                <span>{label}</span>
              </>
            );

            return href ? (
              <Link
                key={label}
                href={href}
                className={className}
                aria-current={current ? "page" : undefined}
              >
                {content}
              </Link>
            ) : (
              <span
                key={label}
                className={className}
                role="link"
                aria-disabled="true"
                aria-label={`${label} (no disponible)`}
              >
                {content}
              </span>
            );
          },
        )}
      </nav>
    </>
  );
}
