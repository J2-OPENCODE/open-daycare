import type { KidsData } from "@/types/kids";

export const kidsData = {
  roomName: "Sala Soles",
  children: [
    {
      id: "mateo-fernandez",
      name: "Mateo Fernández",
      ageYears: 3,
      birthDateLabel: "12 mar 2022",
      roomName: "Soles",
      enrollmentLabel: "feb 2025",
      avatar: {
        kind: "initials",
        initials: "M",
        background: "#A9D9E8",
        foreground: "#1F7A93",
      },
      listBadge: { kind: "medical", label: "MANÍ" },
      medicalNotes: {
        kind: "alert",
        text: "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
      },
      parents: [
        {
          id: "lucia-fernandez",
          name: "Lucía Fernández",
          relationship: "Mamá",
          status: "active",
          avatar: {
            kind: "initials",
            initials: "L",
            background: "#C9B6E8",
            foreground: "#FFFFFF",
          },
        },
        {
          id: "diego-fernandez",
          name: "Diego Fernández",
          relationship: "Papá",
          status: "pending",
          avatar: {
            kind: "initials",
            initials: "D",
            background: "#A9C7E8",
            foreground: "#FFFFFF",
          },
        },
      ],
    },
    {
      id: "sofia-mendez",
      name: "Sofía Méndez",
      ageYears: 2,
      birthDateLabel: "8 nov 2022",
      roomName: "Soles",
      enrollmentLabel: "mar 2025",
      avatar: {
        kind: "initials",
        initials: "S",
        background: "#F4B8CC",
        foreground: "#C44A7A",
      },
      listBadge: null,
      medicalNotes: {
        kind: "clear",
        text: "Sin alergias ni notas registradas",
      },
      parents: [
        {
          id: "laura-mendez",
          name: "Laura Méndez",
          relationship: "Mamá",
          status: "active",
          avatar: {
            kind: "initials",
            initials: "L",
            background: "#C9B6E8",
            foreground: "#FFFFFF",
          },
        },
      ],
    },
    {
      id: "benjamin-ruiz",
      name: "Benjamín Ruiz",
      ageYears: 3,
      birthDateLabel: "21 ene 2022",
      roomName: "Soles",
      enrollmentLabel: "ago 2024",
      avatar: {
        kind: "initials",
        initials: "B",
        background: "#B9DEC4",
        foreground: "#3E8B62",
      },
      listBadge: null,
      medicalNotes: {
        kind: "clear",
        text: "Sin alergias ni notas registradas",
      },
      parents: [
        {
          id: "ana-ruiz",
          name: "Ana Ruiz",
          relationship: "Mamá",
          status: "active",
          avatar: {
            kind: "initials",
            initials: "A",
            background: "#C9B6E8",
            foreground: "#FFFFFF",
          },
        },
        {
          id: "martin-ruiz",
          name: "Martín Ruiz",
          relationship: "Papá",
          status: "active",
          avatar: {
            kind: "initials",
            initials: "M",
            background: "#A9C7E8",
            foreground: "#FFFFFF",
          },
        },
      ],
    },
    {
      id: "valentina-soto",
      name: "Valentina Soto",
      ageYears: 2,
      birthDateLabel: "30 sep 2022",
      roomName: "Soles",
      enrollmentLabel: "abr 2025",
      avatar: {
        kind: "initials",
        initials: "V",
        background: "#F4DC8E",
        foreground: "#9A7B1E",
      },
      listBadge: { kind: "link", label: "VINCULAR" },
      medicalNotes: {
        kind: "clear",
        text: "Sin alergias ni notas registradas",
      },
      parents: [],
    },
    {
      id: "tomas-diaz",
      name: "Tomás Díaz",
      ageYears: 3,
      birthDateLabel: "5 may 2022",
      roomName: "Soles",
      enrollmentLabel: "ene 2025",
      avatar: {
        kind: "initials",
        initials: "T",
        background: "#C9B6E8",
        foreground: "#7B5FC0",
      },
      listBadge: { kind: "medical", label: "LACTOSA" },
      medicalNotes: {
        kind: "alert",
        text: "Intolerancia a la lactosa. Consumir únicamente alimentos sin lactosa.",
      },
      parents: [
        {
          id: "paula-diaz",
          name: "Paula Díaz",
          relationship: "Mamá",
          status: "active",
          avatar: {
            kind: "initials",
            initials: "P",
            background: "#C9B6E8",
            foreground: "#FFFFFF",
          },
        },
      ],
    },
    {
      id: "emma-castro",
      name: "Emma Castro",
      ageYears: 2,
      birthDateLabel: "14 dic 2022",
      roomName: "Soles",
      enrollmentLabel: "mar 2025",
      avatar: {
        kind: "initials",
        initials: "E",
        background: "#F4B8CC",
        foreground: "#C44A7A",
      },
      listBadge: null,
      medicalNotes: {
        kind: "clear",
        text: "Sin alergias ni notas registradas",
      },
      parents: [
        {
          id: "natalia-castro",
          name: "Natalia Castro",
          relationship: "Mamá",
          status: "active",
          avatar: {
            kind: "initials",
            initials: "N",
            background: "#C9B6E8",
            foreground: "#FFFFFF",
          },
        },
      ],
    },
    {
      id: "lucas-romero",
      name: "Lucas Romero",
      ageYears: 3,
      birthDateLabel: "27 feb 2022",
      roomName: "Soles",
      enrollmentLabel: "sep 2024",
      avatar: {
        kind: "initials",
        initials: "L",
        background: "#A9D9E8",
        foreground: "#1F7A93",
      },
      listBadge: null,
      medicalNotes: {
        kind: "clear",
        text: "Sin alergias ni notas registradas",
      },
      parents: [
        {
          id: "andres-romero",
          name: "Andrés Romero",
          relationship: "Papá",
          status: "active",
          avatar: {
            kind: "initials",
            initials: "A",
            background: "#A9C7E8",
            foreground: "#FFFFFF",
          },
        },
      ],
    },
    {
      id: "olivia-vega",
      name: "Olivia Vega",
      ageYears: 2,
      birthDateLabel: "6 ago 2022",
      roomName: "Soles",
      enrollmentLabel: "feb 2025",
      avatar: {
        kind: "initials",
        initials: "O",
        background: "#B9DEC4",
        foreground: "#3E8B62",
      },
      listBadge: null,
      medicalNotes: {
        kind: "clear",
        text: "Sin alergias ni notas registradas",
      },
      parents: [
        {
          id: "camila-vega",
          name: "Camila Vega",
          relationship: "Mamá",
          status: "active",
          avatar: {
            kind: "initials",
            initials: "C",
            background: "#C9B6E8",
            foreground: "#FFFFFF",
          },
        },
      ],
    },
  ],
} satisfies KidsData;

export function findKidById(id: string) {
  return kidsData.children.find((kid) => kid.id === id);
}
