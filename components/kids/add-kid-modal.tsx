"use client";

import { ChevronDownIcon } from "@/components/icons";
import {
  INITIAL_ADD_KID_FORM_VALUES,
  MAX_KID_FULL_NAME_LENGTH,
  MAX_KID_MEDICAL_NOTES_LENGTH,
  maskBirthDate,
  validateAddKidFormValues,
  validateAllergies,
  validateBirthDate,
  validateFullName,
  validateMedicalNotes,
  validateRoomId,
  type AddKidFormErrors,
  type AddKidFormValues,
  type AddKidRoomOption,
} from "@/lib/add-kid-form";
import { ModalDialog } from "@/components/ui/modal-dialog";
import type { AddKidActionResult, AddKidField } from "@/types/kids";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

const labelClassName =
  "mb-2 block text-xs font-extrabold tracking-[0.7px] text-muted-strong";
const fieldClassName =
  "block w-full rounded-[14px] border-[1.5px] border-modal-field-border bg-modal-field px-4 py-[13px] text-[15px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-auth-placeholder focus:border-coral focus:ring-[3px] focus:ring-[var(--modal-focus-ring)]";
const fieldOrder = [
  "fullName",
  "birthDate",
  "roomId",
  "allergies",
  "medicalNotes",
] as const satisfies readonly AddKidField[];

type AddKidModalProps = {
  isOpen: boolean;
  isPending: boolean;
  result: AddKidActionResult | null;
  rooms: readonly AddKidRoomOption[];
  onClose: () => void;
  onAfterClose: () => void;
  onSubmit: (values: AddKidFormValues) => void;
};

export function AddKidModal({
  isOpen,
  isPending,
  result,
  rooms,
  onClose,
  onAfterClose,
  onSubmit,
}: AddKidModalProps) {
  const [values, setValues] = useState(INITIAL_ADD_KID_FORM_VALUES);
  const [errors, setErrors] = useState<AddKidFormErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const birthDateRef = useRef<HTMLInputElement>(null);
  const roomRef = useRef<HTMLSelectElement>(null);
  const allergiesRef = useRef<HTMLInputElement>(null);
  const medicalNotesRef = useRef<HTMLTextAreaElement>(null);
  const pendingFocusRef = useRef<AddKidField>(null);
  const displayedErrors = result?.status === "invalid" ? result.errors : errors;

  useEffect(() => {
    if (!isOpen || result?.status !== "invalid") {
      return;
    }

    const field = fieldOrder.find((candidate) => result.errors[candidate]);

    if (field === "fullName") {
      fullNameRef.current?.focus();
    } else if (field === "birthDate") {
      birthDateRef.current?.focus();
    } else if (field === "roomId") {
      roomRef.current?.focus();
    } else if (field === "allergies") {
      allergiesRef.current?.focus();
    } else if (field === "medicalNotes") {
      medicalNotesRef.current?.focus();
    }
  }, [isOpen, result]);

  useEffect(() => {
    const field = pendingFocusRef.current;

    if (!field || !errors[field]) {
      return;
    }

    if (field === "fullName") {
      fullNameRef.current?.focus();
    } else if (field === "birthDate") {
      birthDateRef.current?.focus();
    } else if (field === "roomId") {
      roomRef.current?.focus();
    } else if (field === "allergies") {
      allergiesRef.current?.focus();
    } else {
      medicalNotesRef.current?.focus();
    }

    pendingFocusRef.current = null;
  }, [errors]);

  function resetForm() {
    setValues(INITIAL_ADD_KID_FORM_VALUES);
    setErrors({});
    setHasAttemptedSubmit(false);
    pendingFocusRef.current = null;
  }

  function requestClose() {
    if (isPending) {
      return;
    }

    resetForm();
    onClose();
  }

  function handleAfterClose() {
    resetForm();
    onAfterClose();
  }

  function revalidateField(field: AddKidField, error: string | undefined) {
    if (!hasAttemptedSubmit) {
      return;
    }

    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };

      if (error) {
        nextErrors[field] = error;
      } else {
        delete nextErrors[field];
      }

      return nextErrors;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    setHasAttemptedSubmit(true);
    const validation = validateAddKidFormValues(values, new Date());

    if (validation.status === "valid") {
      setErrors({});
      onSubmit(values);
      return;
    }

    pendingFocusRef.current =
      fieldOrder.find((field) => validation.errors[field]) ?? null;
    setErrors(validation.errors);
  }

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={requestClose}
      onAfterClose={handleAfterClose}
      ariaLabelledBy="add-kid-modal-title"
      initialFocusRef={fullNameRef}
      dismissible={!isPending}
      className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-[520px] overflow-visible border-0 bg-transparent p-0 text-foreground"
    >
      <form
        className="modal-dialog-panel flex max-h-[calc(100dvh_-_2rem)] flex-col overflow-hidden rounded-[24px] border border-border bg-modal-card shadow-[var(--modal-shadow)]"
        noValidate
        onSubmit={handleSubmit}
        aria-busy={isPending}
      >
        <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-border px-5 py-5 md:px-[26px]">
          <button
            type="button"
            className="w-fit rounded-md text-[15px] font-bold text-muted-strong outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2 focus-visible:ring-offset-modal-card disabled:cursor-not-allowed disabled:opacity-50"
            onClick={requestClose}
            disabled={isPending}
          >
            Cancelar
          </button>
          <h2
            id="add-kid-modal-title"
            className="font-display text-[18px] font-semibold text-foreground"
          >
            Agregar niño
          </h2>
          <button
            type="submit"
            className="justify-self-end rounded-md text-[15px] font-extrabold text-coral-heading outline-none transition-colors hover:text-coral-dark focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2 focus-visible:ring-offset-modal-card disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
          >
            {isPending ? "Guardando…" : "Guardar"}
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto px-5 py-6 md:px-[26px]">
          {result?.status === "error" ? (
            <p
              className="mb-[18px] rounded-xl bg-[#FFF0EB] px-4 py-3 text-sm font-semibold text-[#9B3F30]"
              role="alert"
            >
              {result.message}
            </p>
          ) : null}

          <div className="mb-[18px]">
            <label htmlFor="add-kid-full-name" className={labelClassName}>
              NOMBRE COMPLETO <span aria-hidden="true">*</span>{" "}
              <span className="font-bold normal-case">
                (máx. {MAX_KID_FULL_NAME_LENGTH})
              </span>
            </label>
            <input
              ref={fullNameRef}
              id="add-kid-full-name"
              name="fullName"
              type="text"
              maxLength={MAX_KID_FULL_NAME_LENGTH}
              placeholder="Ej. Martina López"
              className={`${fieldClassName} ${displayedErrors.fullName ? "border-modal-error focus:border-modal-error focus:ring-modal-error/15" : ""}`}
              value={values.fullName}
              onChange={(event) => {
                const fullName = event.currentTarget.value;
                setValues((currentValues) => ({
                  ...currentValues,
                  fullName,
                }));
                revalidateField("fullName", validateFullName(fullName));
              }}
              aria-invalid={Boolean(displayedErrors.fullName)}
              aria-describedby={
                displayedErrors.fullName
                  ? "add-kid-full-name-error"
                  : undefined
              }
              required
            />
            {displayedErrors.fullName ? (
              <p
                id="add-kid-full-name-error"
                className="mt-1.5 text-[13px] font-semibold text-modal-error"
              >
                {displayedErrors.fullName}
              </p>
            ) : null}
          </div>

          <div className="mb-[18px] grid grid-cols-1 gap-[18px] md:grid-cols-2 md:gap-3.5">
            <div>
              <label htmlFor="add-kid-birth-date" className={labelClassName}>
                FECHA DE NACIMIENTO <span aria-hidden="true">*</span>
              </label>
              <input
                ref={birthDateRef}
                id="add-kid-birth-date"
                name="birthDate"
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="dd/mm/aaaa"
                className={`${fieldClassName} ${displayedErrors.birthDate ? "border-modal-error focus:border-modal-error focus:ring-modal-error/15" : ""}`}
                value={values.birthDate}
                onChange={(event) => {
                  const birthDate = maskBirthDate(event.currentTarget.value);
                  setValues((currentValues) => ({
                    ...currentValues,
                    birthDate,
                  }));
                  revalidateField(
                    "birthDate",
                    validateBirthDate(birthDate, new Date()),
                  );
                }}
                aria-invalid={Boolean(displayedErrors.birthDate)}
                aria-describedby={
                  displayedErrors.birthDate
                    ? "add-kid-birth-date-error"
                    : undefined
                }
                required
              />
              {displayedErrors.birthDate ? (
                <p
                  id="add-kid-birth-date-error"
                  className="mt-1.5 text-[13px] font-semibold text-modal-error"
                >
                  {displayedErrors.birthDate}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="add-kid-room" className={labelClassName}>
                SALA <span aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <select
                  ref={roomRef}
                  id="add-kid-room"
                  name="roomId"
                  className={`${fieldClassName} appearance-none pr-11 font-bold ${displayedErrors.roomId ? "border-modal-error focus:border-modal-error focus:ring-modal-error/15" : ""}`}
                  value={values.roomId}
                  onChange={(event) => {
                    const roomId = event.currentTarget.value;
                    setValues((currentValues) => ({
                      ...currentValues,
                      roomId,
                    }));
                    revalidateField("roomId", validateRoomId(roomId));
                  }}
                  aria-invalid={Boolean(displayedErrors.roomId)}
                  aria-describedby={
                    displayedErrors.roomId
                      ? "add-kid-room-error"
                      : undefined
                  }
                  required
                >
                  <option value="" disabled>
                    Seleccioná una sala
                  </option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon
                  className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-photo-foreground"
                  size={16}
                />
              </div>
              {displayedErrors.roomId ? (
                <p
                  id="add-kid-room-error"
                  className="mt-1.5 text-[13px] font-semibold text-modal-error"
                >
                  {displayedErrors.roomId}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mb-[18px]">
            <label htmlFor="add-kid-allergies" className={labelClassName}>
              ALERGIAS <span className="font-bold normal-case">(opcional)</span>
            </label>
            <input
              ref={allergiesRef}
              id="add-kid-allergies"
              name="allergies"
              type="text"
              placeholder="Ej. Maní, Lactosa"
              className={`${fieldClassName} ${displayedErrors.allergies ? "border-modal-error focus:border-modal-error focus:ring-modal-error/15" : ""}`}
              value={values.allergies}
              onChange={(event) => {
                const allergies = event.currentTarget.value;
                setValues((currentValues) => ({
                  ...currentValues,
                  allergies,
                }));
                revalidateField("allergies", validateAllergies(allergies));
              }}
              aria-invalid={Boolean(displayedErrors.allergies)}
              aria-describedby={
                displayedErrors.allergies
                  ? "add-kid-allergies-error"
                  : undefined
              }
            />
            {displayedErrors.allergies ? (
              <p
                id="add-kid-allergies-error"
                className="mt-1.5 text-[13px] font-semibold text-modal-error"
              >
                {displayedErrors.allergies}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="add-kid-medical-notes" className={labelClassName}>
              NOTAS MÉDICAS{" "}
              <span className="font-bold normal-case">
                (opcional · máx. {MAX_KID_MEDICAL_NOTES_LENGTH})
              </span>
            </label>
            <textarea
              ref={medicalNotesRef}
              id="add-kid-medical-notes"
              name="medicalNotes"
              maxLength={MAX_KID_MEDICAL_NOTES_LENGTH}
              placeholder="Indicaciones, medicación, contactos…"
              className={`${fieldClassName} min-h-[90px] resize-y leading-normal ${displayedErrors.medicalNotes ? "border-modal-error focus:border-modal-error focus:ring-modal-error/15" : ""}`}
              value={values.medicalNotes}
              onChange={(event) => {
                const medicalNotes = event.currentTarget.value;
                setValues((currentValues) => ({
                  ...currentValues,
                  medicalNotes,
                }));
                revalidateField(
                  "medicalNotes",
                  validateMedicalNotes(medicalNotes),
                );
              }}
              aria-invalid={Boolean(displayedErrors.medicalNotes)}
              aria-describedby={
                displayedErrors.medicalNotes
                  ? "add-kid-medical-notes-error"
                  : undefined
              }
            />
            {displayedErrors.medicalNotes ? (
              <p
                id="add-kid-medical-notes-error"
                className="mt-1.5 text-[13px] font-semibold text-modal-error"
              >
                {displayedErrors.medicalNotes}
              </p>
            ) : null}
          </div>
        </div>
      </form>
    </ModalDialog>
  );
}
