import "server-only";

import type { Tables } from "@/types/database";
import type { Kid, KidMedicalNotes, KidRoom, KidsDirectoryData } from "@/types/kids";
import { createClient } from "@/utils/supabase/server";

const MONTH_LABELS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

const AVATAR_PALETTE = [
  { background: "#A9D9E8", foreground: "#1F7A93" },
  { background: "#F4B8CC", foreground: "#C44A7A" },
  { background: "#B9DEC4", foreground: "#3E8B62" },
  { background: "#F4DC8E", foreground: "#9A7B1E" },
  { background: "#C9B6E8", foreground: "#7B5FC0" },
] as const;

const ALLERGY_LABELS = {
  peanut: "Maní",
  lactose: "Lactosa",
  gluten: "Gluten",
} as const;

type ChildRow = Pick<
  Tables<"children">,
  | "id"
  | "slug"
  | "full_name"
  | "birth_date"
  | "enrolled_at"
  | "room_id"
  | "allergy_tags"
  | "medical_notes"
>;

type RoomRow = Pick<Tables<"rooms">, "id" | "name" | "position">;

type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

function mapChildSource(child: ChildRow) {
  return {
    id: child.id,
    slug: child.slug,
    name: child.full_name,
    birthDate: child.birth_date,
    enrollmentDate: child.enrolled_at,
    allergyTags: child.allergy_tags,
    medicalNotes: child.medical_notes,
  };
}

function mapRoomSource(room: RoomRow, children: readonly ChildRow[]) {
  return {
    id: room.id,
    name: room.name,
    position: room.position,
    children: children
      .filter((child) => child.room_id === room.id)
      .map(mapChildSource),
  };
}

function parseCalendarDate(value: string): CalendarDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error("Invalid calendar date received for a child.");
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function formatBirthDate(date: CalendarDate) {
  return `${date.day} ${MONTH_LABELS[date.month - 1]} ${date.year}`;
}

function formatEnrollmentDate(date: CalendarDate) {
  return `${MONTH_LABELS[date.month - 1]} ${date.year}`;
}

function calculateAgeYears(birthDate: CalendarDate, today: Date) {
  let age = today.getFullYear() - birthDate.year;
  const currentMonth = today.getMonth() + 1;

  if (
    currentMonth < birthDate.month ||
    (currentMonth === birthDate.month && today.getDate() < birthDate.day)
  ) {
    age -= 1;
  }

  return Math.max(0, age);
}

function getAvatarPaletteIndex(id: string) {
  let hash = 0;

  for (const character of id) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  }

  return hash % AVATAR_PALETTE.length;
}

function getTranslatedAllergies(allergyTags: readonly string[]) {
  return allergyTags.flatMap((tag) => {
    const label = ALLERGY_LABELS[tag as keyof typeof ALLERGY_LABELS];
    return label ? [label] : [];
  });
}

function getMedicalNotes(
  allergies: readonly string[],
  medicalNotes: string | null,
): KidMedicalNotes {
  const allergyText = allergies.length
    ? `Alergias: ${allergies.join(", ")}.`
    : "";
  const notes = medicalNotes?.trim() ?? "";
  const text = [allergyText, notes].filter(Boolean).join(" ");

  return text
    ? { kind: "alert", text }
    : { kind: "clear", text: "Sin alergias ni notas registradas" };
}

function mapKid(
  child: ReturnType<typeof mapChildSource>,
  roomName: string,
  today: Date,
): Kid {
  const birthDate = parseCalendarDate(child.birthDate);
  const enrollmentDate = parseCalendarDate(child.enrollmentDate);
  const allergies = getTranslatedAllergies(child.allergyTags);
  const palette = AVATAR_PALETTE[getAvatarPaletteIndex(child.id)];

  return {
    id: child.id,
    slug: child.slug,
    name: child.name,
    ageYears: calculateAgeYears(birthDate, today),
    birthDateLabel: formatBirthDate(birthDate),
    roomName,
    enrollmentLabel: formatEnrollmentDate(enrollmentDate),
    avatar: {
      kind: "initials",
      initials: Array.from(child.name.trim())[0]?.toLocaleUpperCase("es") ?? "N",
      ...palette,
    },
    listBadge: allergies[0]
      ? { kind: "medical", label: allergies[0].toLocaleUpperCase("es") }
      : { kind: "link", label: "VINCULAR" },
    medicalNotes: getMedicalNotes(allergies, child.medicalNotes),
    parents: [],
  };
}

function mapRoom(
  room: ReturnType<typeof mapRoomSource>,
  today: Date,
): KidRoom {
  const nameCollator = new Intl.Collator("es", { sensitivity: "base" });

  return {
    id: room.id,
    name: room.name,
    label: `Sala ${room.name}`,
    position: room.position,
    children: room.children
      .map((child) => mapKid(child, room.name, today))
      .sort((first, second) => nameCollator.compare(first.name, second.name)),
  };
}

async function getKidsDirectorySource(daycareId: string) {
  const supabase = await createClient();
  const [roomsResult, childrenResult] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, name, position")
      .eq("daycare_id", daycareId)
      .order("position", { ascending: true }),
    supabase
      .from("children")
      .select(
        "id, slug, full_name, birth_date, enrolled_at, room_id, allergy_tags, medical_notes",
      )
      .eq("daycare_id", daycareId)
      .eq("status", "active")
      .order("full_name", { ascending: true }),
  ]);

  if (roomsResult.error) {
    throw new Error("Unable to load daycare rooms.", {
      cause: roomsResult.error,
    });
  }

  if (childrenResult.error) {
    throw new Error("Unable to load active children.", {
      cause: childrenResult.error,
    });
  }

  return {
    rooms: roomsResult.data.map((room) =>
      mapRoomSource(room, childrenResult.data),
    ),
  };
}

async function getActiveKidSourceBySlug(
  daycareId: string,
  slug: string,
) {
  const supabase = await createClient();
  const { data: child, error: childError } = await supabase
    .from("children")
    .select(
      "id, slug, full_name, birth_date, enrolled_at, room_id, allergy_tags, medical_notes",
    )
    .eq("daycare_id", daycareId)
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (childError) {
    throw new Error("Unable to load the child profile.", {
      cause: childError,
    });
  }

  if (!child) {
    return null;
  }

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("name")
    .eq("id", child.room_id)
    .eq("daycare_id", daycareId)
    .maybeSingle();

  if (roomError) {
    throw new Error("Unable to load the child's room.", {
      cause: roomError,
    });
  }

  if (!room) {
    throw new Error("The child's room is unavailable.");
  }

  return {
    ...mapChildSource(child),
    roomName: room.name,
  };
}

export async function getKidsDirectoryData(
  daycareId: string,
): Promise<KidsDirectoryData> {
  const source = await getKidsDirectorySource(daycareId);
  const today = new Date();

  return {
    rooms: source.rooms.map((room) => mapRoom(room, today)),
  };
}

export async function getActiveKidBySlug(
  daycareId: string,
  slug: string,
): Promise<Kid | null> {
  const child = await getActiveKidSourceBySlug(daycareId, slug);

  return child ? mapKid(child, child.roomName, new Date()) : null;
}
