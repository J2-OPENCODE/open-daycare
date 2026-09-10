import "server-only";

import { toRelationshipLabel } from "@/lib/link-parent-form";
import type { InitialsAvatar } from "@/types/avatar";
import type { Tables } from "@/types/database";
import type {
  Kid,
  KidListBadge,
  KidMedicalNotes,
  KidParent,
  KidRoom,
  KidsDirectoryData,
} from "@/types/kids";
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

type ParentLinkRow = Pick<
  Tables<"parent_children">,
  "child_id" | "parent_id" | "relationship"
>;

type ParentUserRow = Pick<Tables<"users">, "id" | "full_name">;

type PendingInvitationRow = Pick<
  Tables<"invitations">,
  "id" | "child_id" | "full_name" | "relationship"
>;

/** Presentation-only view of a child's parents. */
type ChildParents = {
  parents: readonly KidParent[];
  activeParentCount: number;
  hasPendingInvitation: boolean;
};

const NO_PARENTS: ChildParents = {
  parents: [],
  activeParentCount: 0,
  hasPendingInvitation: false,
};

/** Only rows with a confirmed send are visible, so an indeterminate delivery never appears. */
const PENDING_INVITATION_COLUMNS = "id, child_id, full_name, relationship";
const PARENT_LINK_COLUMNS = "child_id, parent_id, relationship";
const PARENT_USER_COLUMNS = "id, full_name";

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

function createInitialsAvatar(id: string, name: string): InitialsAvatar {
  return {
    kind: "initials",
    initials: Array.from(name.trim())[0]?.toLocaleUpperCase("es") ?? "N",
    ...AVATAR_PALETTE[getAvatarPaletteIndex(id)],
  };
}

/**
 * Groups links and pending invitations by child in memory, so the directory
 * never issues a query per child.
 */
function mapParentsByChild(
  links: readonly ParentLinkRow[],
  parentUsers: readonly ParentUserRow[],
  invitations: readonly PendingInvitationRow[],
) {
  const nameByParentId = new Map(
    parentUsers.map((parent) => [parent.id, parent.full_name]),
  );
  const parentsByChild = new Map<string, KidParent[]>();
  const activeCountByChild = new Map<string, number>();
  const pendingByChild = new Set<string>();

  function append(childId: string, parent: KidParent) {
    const current = parentsByChild.get(childId);

    if (current) {
      current.push(parent);
      return;
    }

    parentsByChild.set(childId, [parent]);
  }

  for (const link of links) {
    // An active parent always uses the canonical name from `public.users`.
    const name = nameByParentId.get(link.parent_id);

    if (!name) {
      continue;
    }

    append(link.child_id, {
      id: link.parent_id,
      name,
      relationship: toRelationshipLabel(link.relationship),
      status: "active",
      avatar: createInitialsAvatar(link.parent_id, name),
    });
    activeCountByChild.set(
      link.child_id,
      (activeCountByChild.get(link.child_id) ?? 0) + 1,
    );
  }

  for (const invitation of invitations) {
    // A pending parent uses the name captured by the invitation.
    append(invitation.child_id, {
      id: invitation.id,
      name: invitation.full_name,
      relationship: toRelationshipLabel(invitation.relationship),
      status: "pending",
      avatar: createInitialsAvatar(invitation.id, invitation.full_name),
    });
    pendingByChild.add(invitation.child_id);
  }

  const byChild = new Map<string, ChildParents>();

  for (const [childId, parents] of parentsByChild) {
    byChild.set(childId, {
      parents,
      activeParentCount: activeCountByChild.get(childId) ?? 0,
      hasPendingInvitation: pendingByChild.has(childId),
    });
  }

  return byChild;
}

/** A medical badge always wins; otherwise a pending invitation outranks the link prompt. */
function getListBadge(
  allergies: readonly string[],
  childParents: ChildParents,
): KidListBadge {
  if (allergies[0]) {
    return { kind: "medical", label: allergies[0].toLocaleUpperCase("es") };
  }

  if (childParents.hasPendingInvitation) {
    return { kind: "pending", label: "PENDIENTE" };
  }

  return childParents.activeParentCount === 0
    ? { kind: "link", label: "VINCULAR" }
    : null;
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
  childParents: ChildParents,
): Kid {
  const birthDate = parseCalendarDate(child.birthDate);
  const enrollmentDate = parseCalendarDate(child.enrollmentDate);
  const allergies = getTranslatedAllergies(child.allergyTags);

  return {
    id: child.id,
    slug: child.slug,
    name: child.name,
    ageYears: calculateAgeYears(birthDate, today),
    birthDateLabel: formatBirthDate(birthDate),
    roomName,
    enrollmentLabel: formatEnrollmentDate(enrollmentDate),
    avatar: createInitialsAvatar(child.id, child.name),
    listBadge: getListBadge(allergies, childParents),
    medicalNotes: getMedicalNotes(allergies, child.medicalNotes),
    parents: childParents.parents,
    activeParentCount: childParents.activeParentCount,
    hasPendingInvitation: childParents.hasPendingInvitation,
  };
}

function mapRoom(
  room: ReturnType<typeof mapRoomSource>,
  today: Date,
  parentsByChild: ReadonlyMap<string, ChildParents>,
): KidRoom {
  const nameCollator = new Intl.Collator("es", { sensitivity: "base" });

  return {
    id: room.id,
    name: room.name,
    label: `Sala ${room.name}`,
    position: room.position,
    children: room.children
      .map((child) =>
        mapKid(
          child,
          room.name,
          today,
          parentsByChild.get(child.id) ?? NO_PARENTS,
        ),
      )
      .sort((first, second) => nameCollator.compare(first.name, second.name)),
  };
}

async function getKidsDirectorySource(daycareId: string, now: Date) {
  const supabase = await createClient();
  const [roomsResult, childrenResult, linksResult, parentsResult, invitationsResult] =
    await Promise.all([
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
      supabase
        .from("parent_children")
        .select(PARENT_LINK_COLUMNS)
        .eq("daycare_id", daycareId),
      supabase
        .from("users")
        .select(PARENT_USER_COLUMNS)
        .eq("daycare_id", daycareId)
        .eq("role", "parent")
        .eq("status", "active"),
      supabase
        .from("invitations")
        .select(PENDING_INVITATION_COLUMNS)
        .eq("daycare_id", daycareId)
        .eq("status", "pending")
        .not("resend_email_id", "is", null)
        .not("sent_at", "is", null)
        .gt("expires_at", now.toISOString()),
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

  if (linksResult.error || parentsResult.error || invitationsResult.error) {
    throw new Error("Unable to load parents and pending invitations.", {
      cause: linksResult.error ?? parentsResult.error ?? invitationsResult.error,
    });
  }

  return {
    rooms: roomsResult.data.map((room) =>
      mapRoomSource(room, childrenResult.data),
    ),
    parentsByChild: mapParentsByChild(
      linksResult.data,
      parentsResult.data,
      invitationsResult.data,
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

async function getKidParents(
  daycareId: string,
  childId: string,
  now: Date,
): Promise<ChildParents> {
  const supabase = await createClient();
  const [linksResult, invitationsResult] = await Promise.all([
    supabase
      .from("parent_children")
      .select(PARENT_LINK_COLUMNS)
      .eq("daycare_id", daycareId)
      .eq("child_id", childId),
    supabase
      .from("invitations")
      .select(PENDING_INVITATION_COLUMNS)
      .eq("daycare_id", daycareId)
      .eq("child_id", childId)
      .eq("status", "pending")
      .not("resend_email_id", "is", null)
      .not("sent_at", "is", null)
      .gt("expires_at", now.toISOString()),
  ]);

  if (linksResult.error || invitationsResult.error) {
    throw new Error("Unable to load the child's parents.", {
      cause: linksResult.error ?? invitationsResult.error,
    });
  }

  const parentIds = linksResult.data.map((link) => link.parent_id);
  let parentUsers: ParentUserRow[] = [];

  if (parentIds.length > 0) {
    const { data, error } = await supabase
      .from("users")
      .select(PARENT_USER_COLUMNS)
      .eq("daycare_id", daycareId)
      .in("id", parentIds);

    if (error) {
      throw new Error("Unable to load the child's linked accounts.", {
        cause: error,
      });
    }

    parentUsers = data;
  }

  return (
    mapParentsByChild(
      linksResult.data,
      parentUsers,
      invitationsResult.data,
    ).get(childId) ?? NO_PARENTS
  );
}

export async function getKidsDirectoryData(
  daycareId: string,
): Promise<KidsDirectoryData> {
  const today = new Date();
  const source = await getKidsDirectorySource(daycareId, today);

  return {
    rooms: source.rooms.map((room) =>
      mapRoom(room, today, source.parentsByChild),
    ),
  };
}

export async function getActiveKidBySlug(
  daycareId: string,
  slug: string,
): Promise<Kid | null> {
  const today = new Date();
  const child = await getActiveKidSourceBySlug(daycareId, slug);

  if (!child) {
    return null;
  }

  const childParents = await getKidParents(daycareId, child.id, today);

  return mapKid(child, child.roomName, today, childParents);
}
