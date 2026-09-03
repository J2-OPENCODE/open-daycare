export const ADD_KID_ROOM_OPTIONS = ["Sala 1", "Sala 2", "Sala 3"] as const;

export type AddKidRoom = "" | (typeof ADD_KID_ROOM_OPTIONS)[number];

export type AddKidFormValues = {
  fullName: string;
  birthDate: string;
  room: AddKidRoom;
  allergies: string;
  medicalNotes: string;
};

export type RequiredAddKidField = "fullName" | "birthDate" | "room";

export type AddKidFormErrors = Partial<Record<RequiredAddKidField, string>>;

export const INITIAL_ADD_KID_FORM_VALUES: AddKidFormValues = {
  fullName: "",
  birthDate: "",
  room: "",
  allergies: "",
  medicalNotes: "",
};

export function maskBirthDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter(Boolean)
    .join("/");
}

export function validateFullName(value: string) {
  return value.trim() ? undefined : "Ingresá el nombre completo.";
}

export function validateBirthDate(value: string, today: Date) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);

  if (!match) {
    return "Ingresá la fecha con el formato dd/mm/aaaa.";
  }

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(year, month - 1, day);

  if (
    year === 0 ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "Ingresá una fecha válida.";
  }

  const currentDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return date > currentDate
    ? "La fecha de nacimiento no puede ser futura."
    : undefined;
}

export function validateRoom(value: AddKidRoom) {
  return value ? undefined : "Seleccioná una sala.";
}
