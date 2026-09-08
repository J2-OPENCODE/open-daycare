import { KidsDirectory } from "@/components/kids/kids-directory";
import { AppShell } from "@/components/layout/app-shell";
import { feedData } from "@/data/feed";
import { requireKidsAdminUser } from "@/lib/auth";
import { getKidsDirectoryData } from "@/lib/kids-data";

export default async function KidsPage() {
  const user = await requireKidsAdminUser();
  const directory = await getKidsDirectoryData(user.daycareId);
  const roomName = directory.rooms[0]?.label ?? "Salas";

  return (
    <AppShell
      roomName={roomName}
      currentUser={{ ...feedData.currentUser, name: user.fullName }}
      currentDestination="kids"
    >
      <div className="mx-auto w-full max-w-[880px] px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-10 md:pt-[34px] md:pb-20">
        <KidsDirectory rooms={directory.rooms} />
      </div>
    </AppShell>
  );
}
