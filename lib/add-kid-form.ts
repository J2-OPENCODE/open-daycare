import type {
  AddKidField,
  AddKidFormValues,
} from "@/types/kids";

export type { AddKidFormValues, AddKidRoomOption } from "@/types/kids";

export const MAX_KID_FULL_NAME_LENGTH = 120;
export const MAX_KID_MEDICAL_NOTES_LENGTH = 2000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const diacriticMarks = /[\u0300-\u036f]/g;

const ALLERGY_CODES = {
  mani: "peanut",
  lactosa: "lactose",
  gluten: "gluten",
} as const;

export type AllergyCode = (typeof ALLERGY_CODES)[keyof typeof ALLERGY_CODES];
export type RequiredAddKidField = Extract<
  AddKidField,
  "fullName" | "birthDate" | "roomId"
>;
export type AddKidFormErrors = Partial<Record<AddKidField, string>>;

type ParseResult<T> =
  | { valid: true; value: T }
  | { valid: false; error: string };

export type ValidatedAddKidFormValues = {
  fullName: string;
  birthDate: string;
  roomId: string;
  allergyTags: AllergyCode[];
  medicalNotes: string | null;
};

export type AddKidFormValidationResult =
  | { status: "valid"; data: ValidatedAddKidFormValues }
  | { status: "invalid"; errors: AddKidFormErrors };

export const INITIAL_ADD_KID_FORM_VALUES: AddKidFormValues = {
  fullName: "",
  birthDate: "",
  roomId: "",
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
  const fullName = value.trim();

  if (!fullName) {
    return "Ingresá el nombre completo.";
  }

  return fullName.length > MAX_KID_FULL_NAME_LENGTH
    ? `El nombre completo no puede superar los ${MAX_KID_FULL_NAME_LENGTH} caracteres.`
    : undefined;
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function getDaysInMonth(year: number, month: number) {
  const days = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return days[month - 1];
}

export function parseBirthDate(value: string, today: Date): ParseResult<string> {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);

  if (!match) {
    return {
      valid: false,
      error: "Ingresá la fecha con el formato dd/mm/aaaa.",
    };
  }

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const daysInMonth = getDaysInMonth(year, month);

  if (year === 0 || !daysInMonth || day < 1 || day > daysInMonth) {
    return { valid: false, error: "Ingresá una fecha válida." };
  }

  const dateNumber = year * 10_000 + month * 100 + day;
  const todayNumber =
    today.getFullYear() * 10_000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();

  if (dateNumber > todayNumber) {
    return {
      valid: false,
      error: "La fecha de nacimiento no puede ser futura.",
    };
  }

  return { valid: true, value: `${yearText}-${monthText}-${dayText}` };
}

export function validateBirthDate(value: string, today: Date) {
  const result = parseBirthDate(value, today);
  return result.valid ? undefined : result.error;
}

export function validateRoomId(value: string) {
  if (!value.trim()) {
    return "Seleccioná una sala.";
  }

  return UUID_PATTERN.test(value)
    ? undefined
    : "Seleccioná una sala válida.";
}

function normalizeAllergy(value: string) {
  return value
    .normalize("NFD")
    .replace(diacriticMarks, "")
    .toLocaleLowerCase("es");
}

export function parseAllergies(value: string): ParseResult<AllergyCode[]> {
  const allergyTags: AllergyCode[] = [];
  const seen = new Set<AllergyCode>();

  for (const allergy of value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)) {
    const code =
      ALLERGY_CODES[
        normalizeAllergy(allergy) as keyof typeof ALLERGY_CODES
      ];

    if (!code) {
      return {
        valid: false,
        error: "Solo se permiten Maní, Lactosa y Gluten.",
      };
    }

    if (!seen.has(code)) {
      seen.add(code);
      allergyTags.push(code);
    }
  }

  return { valid: true, value: allergyTags };
}

export function validateAllergies(value: string) {
  const result = parseAllergies(value);
  return result.valid ? undefined : result.error;
}

export function validateMedicalNotes(value: string) {
  return value.trim().length > MAX_KID_MEDICAL_NOTES_LENGTH
    ? `Las notas médicas no pueden superar los ${MAX_KID_MEDICAL_NOTES_LENGTH} caracteres.`
    : undefined;
}

export function validateAddKidFormValues(
  values: AddKidFormValues,
  today: Date,
): AddKidFormValidationResult {
  const errors: AddKidFormErrors = {};
  const fullNameError = validateFullName(values.fullName);
  const birthDate = parseBirthDate(values.birthDate, today);
  const roomIdError = validateRoomId(values.roomId);
  const allergies = parseAllergies(values.allergies);
  const medicalNotesError = validateMedicalNotes(values.medicalNotes);

  if (fullNameError) {
    errors.fullName = fullNameError;
  }

  if (!birthDate.valid) {
    errors.birthDate = birthDate.error;
  }

  if (roomIdError) {
    errors.roomId = roomIdError;
  }

  if (!allergies.valid) {
    errors.allergies = allergies.error;
  }

  if (medicalNotesError) {
    errors.medicalNotes = medicalNotesError;
  }

  if (
    fullNameError ||
    !birthDate.valid ||
    roomIdError ||
    !allergies.valid ||
    medicalNotesError
  ) {
    return { status: "invalid", errors };
  }

  const medicalNotes = values.medicalNotes.trim();

  return {
    status: "valid",
    data: {
      fullName: values.fullName.trim(),
      birthDate: birthDate.value,
      roomId: values.roomId,
      allergyTags: allergies.value,
      medicalNotes: medicalNotes || null,
    },
  };
}
