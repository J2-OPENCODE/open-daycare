import type { FeedPost } from "@/types/feed";

type CategoryBadgeProps = {
  category: FeedPost["category"];
};

const categoryStyles: Record<
  FeedPost["category"],
  { label: string; container: string; dot: string }
> = {
  achievement: {
    label: "LOGRO",
    container: "bg-achievement-soft text-achievement-strong",
    dot: "bg-achievement-strong",
  },
  activity: {
    label: "ACTIVIDAD",
    container: "bg-activity-soft text-activity-strong",
    dot: "bg-activity-strong",
  },
  announcement: {
    label: "ANUNCIO",
    container: "bg-announcement-soft text-announcement-strong",
    dot: "bg-announcement-strong",
  },
};

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const styles = categoryStyles[category];

  return (
    <span
      className={`inline-flex items-center gap-[7px] rounded-full px-3 py-1.5 ${styles.container}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${styles.dot}`}
        aria-hidden="true"
      />
      <span className="text-xs font-extrabold tracking-[0.5px]">
        {styles.label}
      </span>
    </span>
  );
}
