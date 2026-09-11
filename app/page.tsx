import { createPost } from "@/app/actions/posts";
import { FeedExperience } from "@/components/feed/feed-experience";
import { feedData } from "@/data/feed";
import { requireActiveUser } from "@/lib/auth";
import {
  formatFeedDateLabel,
  getFeedAudience,
  getFeedPosts,
} from "@/lib/posts";
import { notFound } from "next/navigation";

export default async function Home() {
  const user = await requireActiveUser();

  // The parent feed belongs to a future spec, so only staff and admin see `/`.
  if (user.role === "parent") {
    notFound();
  }

  const [posts, audience] = await Promise.all([
    getFeedPosts(),
    getFeedAudience(user.daycareId),
  ]);
  const feed = {
    ...feedData,
    currentUser: {
      ...feedData.currentUser,
      name: user.fullName,
    },
  };

  return (
    <FeedExperience
      feed={feed}
      posts={posts}
      kids={audience.kids}
      rooms={audience.rooms}
      childCount={audience.activeChildCount}
      dateLabel={formatFeedDateLabel(new Date())}
      submitAction={createPost}
    />
  );
}
