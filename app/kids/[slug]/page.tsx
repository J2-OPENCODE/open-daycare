import { KidProfile } from "@/components/kids/kid-profile";
import { AppShell } from "@/components/layout/app-shell";
import { feedData } from "@/data/feed";
import { requireKidsAdminUser } from "@/lib/auth";
import { getActiveKidBySlug } from "@/lib/kids-data";
import { notFound } from "next/navigation";

type KidProfilePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function KidProfilePage({
  params,
}: KidProfilePageProps) {
  const [user, { slug }] = await Promise.all([
    requireKidsAdminUser(),
    params,
  ]);
  const kid = await getActiveKidBySlug(user.daycareId, slug);

  if (!kid) {
    notFound();
  }

  return (
    <AppShell
      roomName={kid.roomName}
      currentUser={{ ...feedData.currentUser, name: user.fullName }}
      currentDestination="kids"
    >
      <KidProfile kid={kid} />
    </AppShell>
  );
}
