import { KidProfile } from "@/components/kids/kid-profile";
import { AppShell } from "@/components/layout/app-shell";
import { feedData } from "@/data/feed";
import { findKidById, kidsData } from "@/data/kids";
import { requireActiveUser } from "@/lib/auth";
import { notFound } from "next/navigation";

type KidProfilePageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return kidsData.children.map((kid) => ({ id: kid.id }));
}

export default async function KidProfilePage({
  params,
}: KidProfilePageProps) {
  const [user, { id }] = await Promise.all([requireActiveUser(), params]);
  const kid = findKidById(id);

  if (!kid) {
    notFound();
  }

  return (
    <AppShell
      roomName={kidsData.roomName}
      currentUser={{ ...feedData.currentUser, name: user.fullName }}
      currentDestination="kids"
    >
      <KidProfile kid={kid} />
    </AppShell>
  );
}
