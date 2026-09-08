"use client";

import { addKid } from "@/app/kids/actions";
import { SearchIcon } from "@/components/icons";
import { AddKidModal } from "@/components/kids/add-kid-modal";
import { KidCard } from "@/components/kids/kid-card";
import { KidsHeader } from "@/components/kids/kids-header";
import { SuccessNotice } from "@/components/ui/success-notice";
import type {
  AddKidActionResult,
  AddKidFormValues,
  KidsDirectoryData,
} from "@/types/kids";
import { useEffect, useRef, useState, useTransition } from "react";

const diacriticMarks = /[\u0300-\u036f]/g;

type KidsDirectoryProps = {
  rooms: KidsDirectoryData["rooms"];
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(diacriticMarks, "")
    .toLocaleLowerCase("es");
}

function getLocalIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function KidsDirectory({ rooms }: KidsDirectoryProps) {
  const [query, setQuery] = useState("");
  const [isAddKidOpen, setIsAddKidOpen] = useState(false);
  const [showAddKidSuccess, setShowAddKidSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] =
    useState<AddKidActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const pendingSuccessRef = useRef(false);
  const normalizedQuery = normalizeText(query.trim());
  const visibleRooms = rooms.flatMap((room) => {
    const children = normalizedQuery
      ? room.children.filter((kid) =>
          normalizeText(kid.name).includes(normalizedQuery),
        )
      : room.children;

    return children.length > 0 ? [{ room, children }] : [];
  });

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  function clearSuccessTimer() {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  }

  function handleOpenAddKid() {
    clearSuccessTimer();
    pendingSuccessRef.current = false;
    setShowAddKidSuccess(false);
    setSubmissionResult(null);
    setIsAddKidOpen(true);
  }

  function handleAddKidSubmit(values: AddKidFormValues) {
    setSubmissionResult(null);
    const enrolledAt = getLocalIsoDate(new Date());

    startTransition(async () => {
      let result: AddKidActionResult;

      try {
        result = await addKid(values, enrolledAt);
      } catch {
        result = {
          status: "error",
          message: "No pudimos agregar al niño. Intentá nuevamente.",
        };
      }

      startTransition(() => {
        if (result.status !== "success") {
          setSubmissionResult(result);
          return;
        }

        pendingSuccessRef.current = true;
        setQuery("");
        setIsAddKidOpen(false);
      });
    });
  }

  function handleAddKidAfterClose() {
    if (!pendingSuccessRef.current) {
      return;
    }

    pendingSuccessRef.current = false;
    setShowAddKidSuccess(true);
    clearSuccessTimer();
    successTimerRef.current = setTimeout(() => {
      setShowAddKidSuccess(false);
      successTimerRef.current = null;
    }, 3000);
  }

  return (
    <>
      <KidsHeader onAddKid={handleOpenAddKid} />

      <AddKidModal
        isOpen={isAddKidOpen}
        isPending={isPending}
        result={submissionResult}
        rooms={rooms}
        onClose={() => setIsAddKidOpen(false)}
        onAfterClose={handleAddKidAfterClose}
        onSubmit={handleAddKidSubmit}
      />

      <SuccessNotice>
        {showAddKidSuccess ? "Niño agregado correctamente" : null}
      </SuccessNotice>

      <label className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-border bg-surface px-4 py-3">
        <span className="sr-only">Buscar niño por nombre</span>
        <SearchIcon className="shrink-0 text-photo-foreground" size={18} />
        <input
          type="search"
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-foreground outline-none placeholder:text-[#B6A99B]"
          placeholder="Buscar niño…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {visibleRooms.length > 0 ? (
        <div className="space-y-7">
          {visibleRooms.map(({ room, children }) => {
            const resultCountLabel = `${children.length} ${children.length === 1 ? "niño" : "niños"}`;
            const headingId = `room-${room.id}-heading`;

            return (
              <section key={room.id} aria-labelledby={headingId}>
                <div className="mb-3.5 flex items-center gap-3">
                  <h2
                    id={headingId}
                    className="text-[12.5px] font-extrabold tracking-[0.8px] text-foreground"
                  >
                    {room.label.toLocaleUpperCase("es")}
                  </h2>
                  <span className="text-[13px] text-muted">
                    {resultCountLabel}
                  </span>
                  <span className="h-px flex-1 bg-divider" />
                </div>

                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                  {children.map((kid) => (
                    <KidCard key={kid.id} kid={kid} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div
          className="rounded-[18px] border border-border bg-surface px-6 py-12 text-center"
          role="status"
        >
          <p className="font-display text-lg font-semibold text-foreground">
            {normalizedQuery
              ? "No encontramos niños"
              : "No hay niños registrados"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {normalizedQuery
              ? "Probá con otro nombre."
              : "Agregá el primer niño para comenzar."}
          </p>
        </div>
      )}
    </>
  );
}
