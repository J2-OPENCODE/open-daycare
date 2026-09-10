import { PostCard } from "@/components/feed/post-card";
import type { FeedPost } from "@/types/feed";

type FeedListProps = {
  posts: readonly FeedPost[];
};

export function FeedList({ posts }: FeedListProps) {
  if (posts.length === 0) {
    return (
      <p className="m-0 rounded-[18px] border-[1.5px] border-dashed border-photo-border bg-photo-background px-4 py-9 text-center text-[14.5px] font-bold text-muted-strong">
        Todavía no hay publicaciones
      </p>
    );
  }

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
