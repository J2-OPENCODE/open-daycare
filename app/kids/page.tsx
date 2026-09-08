import { KidsDirectory } from "@/components/kids/kids-directory";
import { AppShell } from "@/components/layout/app-shell";
import { feedData } from "@/data/feed";
import { kidsData } from "@/data/kids";
import { requireActiveUser } from "@/lib/auth";

export default async function KidsPage() {
  const user = await requireActiveUser();

  return (
    <AppShell
      roomName={kidsData.roomName}
      currentUser={{ ...feedData.currentUser, name: user.fullName }}
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
