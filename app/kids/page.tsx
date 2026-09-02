import { KidsDirectory } from "@/components/kids/kids-directory";
import { AppShell } from "@/components/layout/app-shell";
import { feedData } from "@/data/feed";
import { kidsData } from "@/data/kids";

export default function KidsPage() {
  return (
    <AppShell
      roomName={kidsData.roomName}
      currentUser={feedData.currentUser}
      currentDestination="kids"
    >
      <div className="mx-auto w-full max-w-[880px] px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-10 md:pt-[34px] md:pb-20">
        <KidsDirectory
          roomName={kidsData.roomName}
          kids={kidsData.children}
        />
      </div>
    </AppShell>
  );
}
