import { Avatar } from "@/components/feed/avatar";
import { CameraIcon } from "@/components/icons";

type FeedComposerProps = {
  initials: string;
  prompt: string;
};

export function FeedComposer({ initials, prompt }: FeedComposerProps) {
  return (
    <button
      type="button"
      className="mb-6 flex w-full items-center gap-3 rounded-[18px] border border-border bg-surface px-3.5 py-3.5 text-left shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)] disabled:opacity-100 md:gap-3.5 md:px-[18px]"
      disabled
      aria-label="Nueva publicación (no disponible)"
    >
      <Avatar
        avatar={{
          kind: "initials",
          initials,
          background: "#F2937A",
          foreground: "#FFFFFF",
        }}
        size="md"
      />
      <span className="min-w-0 flex-1 text-[15px] text-muted">{prompt}</span>
      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-coral-soft text-coral-strong">
        <CameraIcon size={19} />
      </span>
    </button>
  );
}
