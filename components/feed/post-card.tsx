import { CategoryBadge } from "@/components/feed/category-badge";
import { HeartIcon, ImageIcon, MessageIcon } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import type { FeedPost } from "@/types/feed";

type PostCardProps = {
  post: FeedPost;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="rounded-[18px] border border-border bg-surface px-4 py-[18px] shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)] md:rounded-[20px] md:px-[22px] md:py-5">
      <header className="mb-3.5 flex items-start gap-3 md:items-center">
        <Avatar avatar={post.avatar} />

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[16.5px] font-semibold text-foreground">
            {post.title}
          </h3>
          <p className="text-[12.5px] text-muted">
            {post.publishedAt} · publicado por {post.publishedBy}
          </p>
        </div>

        <CategoryBadge category={post.category} />
      </header>

      <p className="mb-2.5 text-[12.5px] text-muted">
        Para: {post.audience}
      </p>
      <p className="m-0 text-[15.5px] leading-[1.55] text-copy">{post.body}</p>

      {post.media ? (
        <button
          type="button"
          className="mt-3.5 flex h-[200px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-photo-border bg-photo-background text-photo-foreground disabled:opacity-100"
          disabled
          aria-label={`${post.media.label} (no disponible)`}
        >
          <ImageIcon size={30} />
          <span className="text-[13.5px]">{post.media.label}</span>
        </button>
      ) : null}

      <footer className="mt-4 flex items-center gap-[18px] border-t border-card-divider pt-3.5">
        <button
          type="button"
          className="flex items-center gap-[7px] text-[14px] font-bold text-coral-strong disabled:opacity-100"
          disabled
          aria-label={`${post.reactions} reacciones (no disponible)`}
        >
          <HeartIcon size={19} />
          {post.reactions}
        </button>
        <button
          type="button"
          className="flex items-center gap-[7px] text-[14px] font-bold text-muted-strong disabled:opacity-100"
          disabled
          aria-label={`${post.comments} comentarios (no disponible)`}
        >
          <MessageIcon size={18} />
          {post.comments}
        </button>

        <span className="flex-1" />

        {post.editable ? (
          <button
            type="button"
            className="text-[14px] font-extrabold text-coral-dark disabled:opacity-100"
            disabled
            aria-label={`Editar publicación de ${post.title} (no disponible)`}
          >
            Editar
          </button>
        ) : null}
      </footer>
    </article>
  );
}
