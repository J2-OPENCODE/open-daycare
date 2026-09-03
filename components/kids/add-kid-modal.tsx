"use client";

import { ChevronDownIcon } from "@/components/icons";
import {
  ADD_KID_ROOM_OPTIONS,
  INITIAL_ADD_KID_FORM_VALUES,
  maskBirthDate,
  validateBirthDate,
  validateFullName,
  validateRoom,
  type AddKidFormErrors,
  type AddKidFormValues,
  type AddKidRoom,
  type RequiredAddKidField,
} from "@/lib/add-kid-form";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type SyntheticEvent,
} from "react";

const labelClassName =
  "mb-2 block text-xs font-extrabold tracking-[0.7px] text-muted-strong";
const fieldClassName =
  "block w-full rounded-[14px] border-[1.5px] border-modal-field-border bg-modal-field px-4 py-[13px] text-[15px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-auth-placeholder focus:border-coral focus:ring-[3px] focus:ring-[var(--modal-focus-ring)]";

type AddKidModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AddKidFormValues) => void;
};

export function AddKidModal({ isOpen, onClose, onSubmit }: AddKidModalProps) {
  const [values, setValues] = useState(INITIAL_ADD_KID_FORM_VALUES);
  const [errors, setErrors] = useState<AddKidFormErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const birthDateRef = useRef<HTMLInputElement>(null);
  const roomRef = useRef<HTMLSelectElement>(null);
  const returnFocusRef = useRef<HTMLElement>(null);
  const pendingFocusRef = useRef<RequiredAddKidField>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      const activeElement = document.activeElement;
      returnFocusRef.current =
        activeElement instanceof HTMLElement ? activeElement : null;
      dialog.showModal();
      fullNameRef.current?.focus();
      return;
    }

    if (!isOpen && dialog.open) {
      dialog.close();
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    const field = pendingFocusRef.current;

    if (!field || !errors[field]) {
      return;
    }

    if (field === "fullName") {
      fullNameRef.current?.focus();
    } else if (field === "birthDate") {
      birthDateRef.current?.focus();
    } else {
      roomRef.current?.focus();
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
    resetForm();
    onClose();
  }

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    requestClose();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      requestClose();
    }
  }

  function revalidateField(
    field: RequiredAddKidField,
    error: string | undefined,
  ) {
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
    setHasAttemptedSubmit(true);

    const nextErrors: AddKidFormErrors = {};
    const fullNameError = validateFullName(values.fullName);
    const birthDateError = validateBirthDate(values.birthDate, new Date());
    const roomError = validateRoom(values.room);

    if (fullNameError) {
      nextErrors.fullName = fullNameError;
    }

    if (birthDateError) {
      nextErrors.birthDate = birthDateError;
    }

    if (roomError) {
      nextErrors.room = roomError;
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      onSubmit(values);
      resetForm();
      return;
    }

    pendingFocusRef.current = nextErrors.fullName
      ? "fullName"
      : nextErrors.birthDate
        ? "birthDate"
        : "room";
  }

  return (
    <dialog
      ref={dialogRef}
      className="add-kid-dialog fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-[520px] overflow-visible border-0 bg-transparent p-0 text-foreground"
      aria-labelledby="add-kid-modal-title"
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <form
        className="add-kid-dialog-panel flex max-h-[calc(100dvh_-_2rem)] flex-col overflow-hidden rounded-[24px] border border-border bg-modal-card shadow-[var(--modal-shadow)]"
        noValidate
        onSubmit={handleSubmit}
      >
        <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-border px-5 py-5 md:px-[26px]">
          <button
            type="button"
            className="w-fit rounded-md text-[15px] font-bold text-muted-strong outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2 focus-visible:ring-offset-modal-card"
            onClick={requestClose}
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
            className="justify-self-end rounded-md text-[15px] font-extrabold text-coral-heading outline-none transition-colors hover:text-coral-dark focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2 focus-visible:ring-offset-modal-card"
          >
            Guardar
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto px-5 py-6 md:px-[26px]">
          <div className="mb-[18px]">
            <label htmlFor="add-kid-full-name" className={labelClassName}>
              NOMBRE COMPLETO <span aria-hidden="true">*</span>
            </label>
            <input
              ref={fullNameRef}
              id="add-kid-full-name"
              name="fullName"
              type="text"
              placeholder="Ej. Martina López"
              className={`${fieldClassName} ${errors.fullName ? "border-modal-error focus:border-modal-error focus:ring-modal-error/15" : ""}`}
              value={values.fullName}
              onChange={(event) => {
                const fullName = event.currentTarget.value;
                setValues((currentValues) => ({
                  ...currentValues,
                  fullName,
                }));
                revalidateField("fullName", validateFullName(fullName));
              }}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={
                errors.fullName ? "add-kid-full-name-error" : undefined
              }
              required
            />
            {errors.fullName ? (
              <p
                id="add-kid-full-name-error"
                className="mt-1.5 text-[13px] font-semibold text-modal-error"
              >
                {errors.fullName}
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
                className={`${fieldClassName} ${errors.birthDate ? "border-modal-error focus:border-modal-error focus:ring-modal-error/15" : ""}`}
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
                aria-invalid={Boolean(errors.birthDate)}
                aria-describedby={
                  errors.birthDate ? "add-kid-birth-date-error" : undefined
                }
                required
              />
              {errors.birthDate ? (
                <p
                  id="add-kid-birth-date-error"
                  className="mt-1.5 text-[13px] font-semibold text-modal-error"
                >
                  {errors.birthDate}
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
                  name="room"
                  className={`${fieldClassName} appearance-none pr-11 font-bold ${errors.room ? "border-modal-error focus:border-modal-error focus:ring-modal-error/15" : ""}`}
                  value={values.room}
                  onChange={(event) => {
                    const room = event.currentTarget.value as AddKidRoom;
                    setValues((currentValues) => ({
                      ...currentValues,
                      room,
                    }));
                    revalidateField("room", validateRoom(room));
                  }}
                  aria-invalid={Boolean(errors.room)}
                  aria-describedby={
                    errors.room ? "add-kid-room-error" : undefined
                  }
                  required
                >
                  <option value="" disabled>
                    Seleccioná una sala
                  </option>
                  {ADD_KID_ROOM_OPTIONS.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon
                  className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-photo-foreground"
                  size={16}
                />
              </div>
              {errors.room ? (
                <p
                  id="add-kid-room-error"
                  className="mt-1.5 text-[13px] font-semibold text-modal-error"
                >
                  {errors.room}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mb-[18px]">
            <label htmlFor="add-kid-allergies" className={labelClassName}>
              ALERGIAS <span className="font-bold normal-case">(opcional)</span>
            </label>
            <input
              id="add-kid-allergies"
              name="allergies"
              type="text"
              placeholder="Ej. Maní, Lactosa"
              className={fieldClassName}
              value={values.allergies}
              onChange={(event) => {
                const allergies = event.currentTarget.value;
                setValues((currentValues) => ({
                  ...currentValues,
                  allergies,
                }));
              }}
            />
          </div>

          <div>
            <label htmlFor="add-kid-medical-notes" className={labelClassName}>
              NOTAS MÉDICAS{" "}
              <span className="font-bold normal-case">(opcional)</span>
            </label>
            <textarea
              id="add-kid-medical-notes"
              name="medicalNotes"
              placeholder="Indicaciones, medicación, contactos…"
              className={`${fieldClassName} min-h-[90px] resize-y leading-normal`}
              value={values.medicalNotes}
              onChange={(event) => {
                const medicalNotes = event.currentTarget.value;
                setValues((currentValues) => ({
                  ...currentValues,
                  medicalNotes,
                }));
              }}
            />
          </div>
        </div>
      </form>
    </dialog>
  );
}
