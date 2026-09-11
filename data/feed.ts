import type { FeedData } from "@/types/feed";

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
