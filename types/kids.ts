import type { InitialsAvatar } from "@/types/avatar";

export type ParentStatus = "active" | "pending";

/** User-facing relationship label. Persisted values stay in English. */
export type ParentRelationshipLabel = "Mamá" | "Papá" | "Tutor/a";

export type KidParent = {
  id: string;
  name: string;
  relationship: ParentRelationshipLabel;
  status: ParentStatus;
  avatar: InitialsAvatar;
};

export type KidListBadge =
  | { kind: "medical"; label: string }
  | { kind: "pending"; label: "PENDIENTE" }
  | { kind: "link"; label: "VINCULAR" }
  | null;

export type KidMedicalNotes =
  | { kind: "alert"; text: string }
  | { kind: "clear"; text: "Sin alergias ni notas registradas" };

export type Kid = {
  id: string;
  slug: string;
  name: string;
  ageYears: number;
  birthDateLabel: string;
  roomName: string;
  enrollmentLabel: string;
  avatar: InitialsAvatar;
  listBadge: KidListBadge;
  medicalNotes: KidMedicalNotes;
  parents: readonly KidParent[];
  /** Counted from `parent_children`, never inferred from `parents.length`. */
  activeParentCount: number;
  hasPendingInvitation: boolean;
};

export type KidsData = {
  roomName: string;
  children: readonly Kid[];
};

export type KidRoom = {
  id: string;
  name: string;
  label: string;
  position: number;
  children: readonly Kid[];
};

export type KidsDirectoryData = {
  rooms: readonly KidRoom[];
};

export type AddKidRoomOption = {
  id: string;
  label: string;
};

export type AddKidFormValues = {
  fullName: string;
  birthDate: string;
  roomId: string;
  allergies: string;
  medicalNotes: string;
};

export type AddKidField =
  | "fullName"
  | "birthDate"
  | "roomId"
  | "allergies"
  | "medicalNotes";

export type AddKidActionResult =
  | { status: "success"; slug: string }
  | { status: "invalid"; errors: Partial<Record<AddKidField, string>> }
  | { status: "error"; message: string };
