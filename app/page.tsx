import { FeedExperience } from "@/components/feed/feed-experience";
import { feedData } from "@/data/feed";
import { kidsData } from "@/data/kids";
import { requireActiveUser } from "@/lib/auth";

export default async function Home() {
  const user = await requireActiveUser();
  const feed = {
    ...feedData,
    currentUser: {
      ...feedData.currentUser,
      name: user.fullName,
    },
  };

  return <FeedExperience feed={feed} kids={kidsData.children} />;
}
