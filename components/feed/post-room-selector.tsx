import { ChevronDownIcon } from "@/components/icons";
import type { RefObject } from "react";

export type PostRoomOption = {
  id: string;
  name: string;
  position: number;
};

type PostRoomSelectorProps = {
  rooms: readonly PostRoomOption[];
  value: string | null;
  onChange: (roomId: string | null) => void;
  error?: string;
  selectRef?: RefObject<HTMLSelectElement | null>;
};

const labelClassName =
  "mb-2.5 block text-xs font-extrabold tracking-[0.7px] text-muted-strong";
const selectClassName =
  "block w-full min-w-0 appearance-none rounded-[14px] border-[1.5px] border-modal-field-border bg-modal-field px-4 py-[13px] pr-11 text-[15px] font-bold text-foreground outline-none transition-[border-color,box-shadow] focus:border-coral focus:ring-[3px] focus:ring-[var(--modal-focus-ring)]";

export function PostRoomSelector({
  rooms,
  value,
  onChange,
  error,
  selectRef,
}: PostRoomSelectorProps) {
  const orderedRooms = [...rooms].sort(
    (firstRoom, secondRoom) => firstRoom.position - secondRoom.position,
  );

  return (
    <div>
      <label htmlFor="create-post-room" className={labelClassName}>
        SALA
      </label>
      <div className="relative">
        <select
          ref={selectRef}
          id="create-post-room"
          name="roomId"
          className={`${selectClassName} ${error ? "border-modal-error focus:border-modal-error focus:ring-modal-error/15" : ""}`}
          value={value ?? ""}
          onChange={(event) => {
            onChange(event.currentTarget.value || null);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "create-post-room-error" : undefined}
          required
        >
          <option value="" disabled>
            Seleccioná una sala
          </option>
          {orderedRooms.map((room) => (
            <option key={room.id} value={room.id}>
              Sala {room.name}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-photo-foreground"
          size={16}
        />
      </div>
      {error ? (
        <p
          id="create-post-room-error"
          className="mt-1.5 text-[13px] font-semibold text-modal-error"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
