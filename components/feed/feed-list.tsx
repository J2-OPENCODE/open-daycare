import { PostCard } from "@/components/feed/post-card";
import type { FeedPost } from "@/types/feed";

type FeedListProps = {
  posts: readonly FeedPost[];
};

export function FeedList({ posts }: FeedListProps) {
  return (
    <ol className="m-0 flex list-none flex-col gap-4 p-0" aria-label="Publicaciones">
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard post={post} />
        </li>
      ))}
    </ol>
  );
}
