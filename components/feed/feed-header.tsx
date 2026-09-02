type FeedHeaderProps = {
  nurseryLabel: string;
  roomName: string;
  greeting: string;
  childCount: number;
  dateLabel: string;
};

type FeedSectionHeadingProps = {
  children: string;
};

export function FeedHeader({
  nurseryLabel,
  roomName,
  greeting,
  childCount,
  dateLabel,
}: FeedHeaderProps) {
  return (
    <header className="mb-6">
      <p className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-coral-heading">
        {nurseryLabel} · {roomName.toUpperCase()}
      </p>
      <h1 className="m-0 font-display text-[27px] font-semibold text-foreground md:text-[30px]">
        {greeting}
      </h1>
      <p className="mt-[5px] mb-0 text-[14.5px] text-muted-strong">
        {childCount} niños · {dateLabel}
      </p>
    </header>
  );
}

export function FeedSectionHeading({ children }: FeedSectionHeadingProps) {
  return (
    <div className="mb-3.5 flex items-center gap-3.5">
      <h2 className="text-[12.5px] font-extrabold tracking-[0.8px] text-section-label">
        {children}
      </h2>
      <span className="h-px flex-1 bg-divider" aria-hidden="true" />
    </div>
  );
}
