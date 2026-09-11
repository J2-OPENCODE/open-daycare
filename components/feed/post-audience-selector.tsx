import {
  PostRoomSelector,
  type PostRoomOption,
} from "@/components/feed/post-room-selector";
import { Avatar } from "@/components/ui/avatar";
import type {
  CreatePostAudience,
  CreatePostChildPhotoConsent,
} from "@/lib/create-post-form";
import type { InitialsAvatar } from "@/types/avatar";
import type { RefObject } from "react";

export type PostAudienceKid = Pick<
  CreatePostChildPhotoConsent,
  "id" | "name"
> & {
  roomName?: string | null;
  avatar: InitialsAvatar;
  photoConsent?: CreatePostChildPhotoConsent["photoConsent"];
};

type PostAudienceSelectorProps = {
  kids: readonly PostAudienceKid[];
  rooms: readonly PostRoomOption[];
  value: CreatePostAudience;
  onChange: (audience: CreatePostAudience) => void;
  error?: string;
  roomError?: string;
  firstButtonRef?: RefObject<HTMLButtonElement | null>;
  roomSelectRef?: RefObject<HTMLSelectElement | null>;
};

const baseButtonClassName =
  "flex items-center rounded-full border-[1.5px] text-sm font-bold outline-none transition-[background-color,border-color,color,box-shadow] focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2 focus-visible:ring-offset-modal-card";
const kidNameCollator = new Intl.Collator("es", { sensitivity: "base" });

function getFirstName(name: string) {
  return name.split(" ", 1)[0] ?? name;
}

/**
 * The chip shows the shortest name that still points at one child: the first
 * name, then the full name, then the room, and finally the enrolment order.
 * Picking the wrong homonym sends a post to the wrong family.
 */
function createKidLabels(kids: readonly PostAudienceKid[]) {
  function countBy(getKey: (kid: PostAudienceKid) => string) {
    const counts = new Map<string, number>();

    for (const kid of kids) {
      const key = getKey(kid);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return counts;
  }

  const withRoom = (kid: PostAudienceKid) =>
    kid.roomName ? `${kid.name} · ${kid.roomName}` : kid.name;
  const firstNameCounts = countBy((kid) => getFirstName(kid.name));
  const fullNameCounts = countBy((kid) => kid.name);
  const roomCounts = countBy(withRoom);
  const ordinals = new Map<string, number>();
  const labels = new Map<string, string>();

  for (const kid of kids) {
    if (firstNameCounts.get(getFirstName(kid.name)) === 1) {
      labels.set(kid.id, getFirstName(kid.name));
      continue;
    }

    if (fullNameCounts.get(kid.name) === 1) {
      labels.set(kid.id, kid.name);
      continue;
    }

    const roomLabel = withRoom(kid);

    if (roomCounts.get(roomLabel) === 1) {
      labels.set(kid.id, roomLabel);
      continue;
    }

    const ordinal = (ordinals.get(roomLabel) ?? 0) + 1;
    ordinals.set(roomLabel, ordinal);
    labels.set(kid.id, `${roomLabel} (${ordinal})`);
  }

  return labels;
}

export function PostAudienceSelector({
  kids,
  rooms,
  value,
  onChange,
  error,
  roomError,
  firstButtonRef,
  roomSelectRef,
}: PostAudienceSelectorProps) {
  const selectedKidIds = value.kind === "kids" ? value.kidIds : [];
  const isWholeRoomSelected = value.kind === "room";
  // Homonyms need a stable order so their ordinal never moves between renders.
  const orderedKids = [...kids].sort(
    (firstKid, secondKid) =>
      kidNameCollator.compare(firstKid.name, secondKid.name) ||
      firstKid.id.localeCompare(secondKid.id),
  );
  const kidLabels = createKidLabels(orderedKids);

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
        : { kind: "room", roomId: null },
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
        {orderedKids.map((kid, index) => {
          const isSelected = selectedKidIds.includes(kid.id);
          const label = kidLabels.get(kid.id) ?? kid.name;

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
              aria-label={
                kid.roomName ? `${kid.name}, sala ${kid.roomName}` : kid.name
              }
              aria-pressed={isSelected}
              onClick={() => toggleKid(kid.id)}
            >
              <Avatar avatar={kid.avatar} size="chip" />
              <span>{label}</span>
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

      {value.kind === "room" ? (
        <div className="mt-4">
          <PostRoomSelector
            rooms={rooms}
            value={value.roomId}
            onChange={(roomId) => {
              onChange({ kind: "room", roomId });
            }}
            error={roomError}
            selectRef={roomSelectRef}
          />
        </div>
      ) : null}

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
