import type { Database } from "@/types/database";
import type { FeedData } from "@/types/feed";

type UserRole = Database["public"]["Enums"]["user_role"];

/** Only the visual labels that do not come from the database live here. */
export const feedData = {
  nurseryLabel: "GUARDERÍA",
  roomName: "Sala Soles",
  greeting: "Buenas, Caro",
  sectionLabel: "PUBLICADO HOY",
  composerPrompt: "Compartí un momento…",
  currentUser: {
    name: "Caro Giménez",
    role: "Maestra",
    roomName: "Soles",
    initials: "C",
  },
} satisfies FeedData;

/** The persisted role is English, so the sidebar translates it here. */
export const userRoleLabels: Record<UserRole, string> = {
  staff: "Maestra",
  admin: "Administración",
  parent: "Familia",
};
