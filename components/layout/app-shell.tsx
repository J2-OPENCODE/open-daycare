import { MobileNavigation } from "@/components/layout/mobile-navigation";
import {
  type AppDestination,
  Sidebar,
} from "@/components/layout/sidebar";
import type { FeedData } from "@/types/feed";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  roomName: string;
  currentUser: FeedData["currentUser"];
  currentDestination: AppDestination;
  canPublish?: boolean;
  canManageKids?: boolean;
  onCreatePost?: () => void;
};

export function AppShell({
  children,
  roomName,
  currentUser,
  currentDestination,
  canPublish = true,
  canManageKids = true,
  onCreatePost,
}: AppShellProps) {
  return (
    <div className="flex min-h-dvh bg-background md:h-dvh md:overflow-hidden">
      <Sidebar
        roomName={roomName}
        currentUser={currentUser}
        currentDestination={currentDestination}
        canPublish={canPublish}
        canManageKids={canManageKids}
        onCreatePost={onCreatePost}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNavigation
          roomName={roomName}
          currentDestination={currentDestination}
          canPublish={canPublish}
          canManageKids={canManageKids}
          onCreatePost={onCreatePost}
        />

        <main className="min-w-0 flex-1 md:h-full md:overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
