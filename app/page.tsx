import { createPost } from "@/app/actions/posts";
import { FeedExperience } from "@/components/feed/feed-experience";
import { feedData, userRoleLabels } from "@/data/feed";
import { requireActiveUser } from "@/lib/auth";
import {
  formatFeedDateLabel,
  getFeedAudience,
  getFeedPosts,
} from "@/lib/posts";

export default async function Home() {
  const user = await requireActiveUser();
  // Parents read the feed of their own children; only staff and admin publish.
  const canPublish = user.role !== "parent";
  const [posts, audience] = await Promise.all([
    getFeedPosts(),
    getFeedAudience(user.daycareId),
  ]);
  const feed = {
    ...feedData,
    currentUser: {
      ...feedData.currentUser,
      name: user.fullName,
      role: userRoleLabels[user.role],
      initials:
        Array.from(user.fullName.trim())[0]?.toLocaleUpperCase("es") ?? "?",
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
      canPublish={canPublish}
    />
  );
}
