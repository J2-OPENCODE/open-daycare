import type { InitialsAvatar } from "@/types/avatar";

export type ParentStatus = "active" | "pending";

export type KidParent = {
  id: string;
  name: string;
  relationship: "Mamá" | "Papá";
  status: ParentStatus;
  avatar: InitialsAvatar;
};

export type KidListBadge =
  | { kind: "medical"; label: string }
  | { kind: "link"; label: "VINCULAR" }
  | null;

export type KidMedicalNotes =
  | { kind: "alert"; text: string }
  | { kind: "clear"; text: "Sin alergias ni notas registradas" };

export type Kid = {
  id: string;
  name: string;
  ageYears: 2 | 3;
  birthDateLabel: string;
  roomName: "Soles";
  enrollmentLabel: string;
  avatar: InitialsAvatar;
  listBadge: KidListBadge;
  medicalNotes: KidMedicalNotes;
  parents: readonly KidParent[];
};

export type KidsData = {
  roomName: "Sala Soles";
  children: readonly Kid[];
};
