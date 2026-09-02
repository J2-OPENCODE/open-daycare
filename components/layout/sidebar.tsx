import { Avatar } from "@/components/feed/avatar";
import {
  BellIcon,
  ChildrenIcon,
  HomeIcon,
  LogOutIcon,
  PlusIcon,
  SunIcon,
  UserIcon,
} from "@/components/icons";
import type { FeedData } from "@/types/feed";
import Link from "next/link";

type BrandProps = {
  roomName: string;
  variant?: "sidebar" | "mobile";
};

type SidebarProps = {
  roomName: string;
  currentUser: FeedData["currentUser"];
};

const navigationItems = [
  { label: "Feed", icon: HomeIcon, current: true },
  { label: "Niños", icon: ChildrenIcon, current: false },
  { label: "Avisos", icon: BellIcon, current: false },
  { label: "Mi cuenta", icon: UserIcon, current: false },
];

export function Brand({ roomName, variant = "sidebar" }: BrandProps) {
  const isMobile = variant === "mobile";

  return (
    <Link
      href="/"
      className={`flex items-center gap-[11px] ${isMobile ? "min-w-0" : "px-2 pt-1 pb-[22px]"}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#F8C3A8] to-coral text-white ${isMobile ? "h-9 w-9" : "h-[38px] w-[38px]"}`}
      >
        <SunIcon size={isMobile ? 19 : 21} />
      </span>
      <span className="min-w-0">
        <span
          className={`block truncate font-display leading-none font-semibold text-foreground ${isMobile ? "text-base" : "text-[17px]"}`}
        >
          OpenDayCare
        </span>
        <span
          className={`mt-0.5 block truncate text-muted ${isMobile ? "text-[11px]" : "text-[11.5px]"}`}
        >
          {roomName}
        </span>
      </span>
    </Link>
  );
}

export function Sidebar({ roomName, currentUser }: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
      <Brand roomName={roomName} />

      <button
        type="button"
        className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-linear-to-b from-coral-start to-coral-end p-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)] disabled:opacity-100"
        disabled
        aria-label="Nueva publicación (no disponible)"
      >
        <PlusIcon size={17} />
        Nueva publicación
      </button>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Navegación principal">
        {navigationItems.map(({ label, icon: NavigationIcon, current }) => {
          const className = `flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] ${
            current
              ? "bg-coral-soft font-extrabold text-coral-heading"
              : "font-semibold text-[#6E6359]"
          }`;
          const content = (
            <>
              <NavigationIcon size={19} />
              <span>{label}</span>
            </>
          );

          return current ? (
            <Link key={label} href="/" className={className} aria-current="page">
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
        })}
      </nav>

      <div className="mt-2.5 border-t border-border pt-3.5">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <Avatar
            avatar={{
              kind: "initials",
              initials: currentUser.initials,
              background: "#F2937A",
              foreground: "#FFFFFF",
            }}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-foreground">
              {currentUser.name}
            </p>
            <p className="truncate text-xs text-muted">
              {currentUser.role} · {currentUser.roomName}
            </p>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-background text-muted-strong disabled:opacity-100"
            disabled
            aria-label="Cerrar sesión (no disponible)"
          >
            <LogOutIcon size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
