import { Avatar } from "@/components/ui/avatar";
import type { CreatePostAudience } from "@/lib/create-post-form";
import type { Kid } from "@/types/kids";
import type { RefObject } from "react";

type AudienceKid = Pick<Kid, "id" | "name" | "avatar">;

type PostAudienceSelectorProps = {
  kids: readonly AudienceKid[];
  value: CreatePostAudience;
  onChange: (audience: CreatePostAudience) => void;
  error?: string;
  firstButtonRef?: RefObject<HTMLButtonElement | null>;
};

const baseButtonClassName =
  "flex items-center rounded-full border-[1.5px] text-sm font-bold outline-none transition-[background-color,border-color,color,box-shadow] focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2 focus-visible:ring-offset-modal-card";

export function PostAudienceSelector({
  kids,
  value,
  onChange,
  error,
  firstButtonRef,
}: PostAudienceSelectorProps) {
  const selectedKidIds = value.kind === "kids" ? value.kidIds : [];
  const isWholeRoomSelected = value.kind === "room";

  function toggleKid(kidId: string) {
    if (value.kind === "room") {
      onChange({ kind: "kids", kidIds: [kidId] });
      return;
    }

    const kidIds = value.kidIds.includes(kidId)
      ? value.kidIds.filter((selectedKidId) => selectedKidId !== kidId)
      : [...value.kidIds, kidId];

    onChange({ kind: "kids", kidIds });
  }

  function toggleWholeRoom() {
    onChange(
      isWholeRoomSelected
        ? { kind: "kids", kidIds: [] }
        : { kind: "room" },
    );
  }

  return (
    <section
      role="group"
      aria-labelledby="create-post-audience-label"
      aria-describedby={error ? "create-post-audience-error" : undefined}
    >
      <h3
        id="create-post-audience-label"
        className="mb-2.5 text-xs font-extrabold tracking-[0.7px] text-muted-strong"
      >
        PARA
      </h3>

      <div className="flex flex-wrap gap-[9px]">
        {kids.map((kid, index) => {
          const isSelected = selectedKidIds.includes(kid.id);
          const firstName = kid.name.split(" ", 1)[0];

          return (
            <button
              key={kid.id}
              ref={index === 0 ? firstButtonRef : undefined}
              type="button"
              className={`${baseButtonClassName} gap-2 py-1.5 pr-3.5 pl-1.5 ${
                isSelected
                  ? "border-foreground bg-foreground text-white"
                  : "border-border bg-surface text-[#6E6359] hover:border-muted"
              }`}
              aria-label={kid.name}
              aria-pressed={isSelected}
              onClick={() => toggleKid(kid.id)}
            >
              <Avatar avatar={kid.avatar} size="chip" />
              <span>{firstName}</span>
            </button>
          );
        })}

        <button
          type="button"
          className={`${baseButtonClassName} px-4 py-1.5 ${
            isWholeRoomSelected
              ? "border-foreground bg-foreground text-white"
              : "border-border bg-surface text-[#6E6359] hover:border-muted"
          }`}
          aria-pressed={isWholeRoomSelected}
          onClick={toggleWholeRoom}
        >
          Toda la sala
        </button>
      </div>

      {error ? (
        <p
          id="create-post-audience-error"
          className="mt-1.5 text-[13px] font-semibold text-modal-error"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
