"use client";

import { CheckIcon, SearchIcon } from "@/components/icons";
import { AddKidModal } from "@/components/kids/add-kid-modal";
import { KidCard } from "@/components/kids/kid-card";
import { KidsHeader } from "@/components/kids/kids-header";
import type { Kid, KidsData } from "@/types/kids";
import { useEffect, useRef, useState } from "react";

const diacriticMarks = /[\u0300-\u036f]/g;

type KidsDirectoryProps = {
  roomName: KidsData["roomName"];
  kids: readonly Kid[];
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(diacriticMarks, "")
    .toLocaleLowerCase("es");
}

export function KidsDirectory({ roomName, kids }: KidsDirectoryProps) {
  const [query, setQuery] = useState("");
  const [isAddKidOpen, setIsAddKidOpen] = useState(false);
  const [showAddKidSuccess, setShowAddKidSuccess] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const normalizedQuery = normalizeText(query.trim());
  const filteredKids = normalizedQuery
    ? kids.filter((kid) => normalizeText(kid.name).includes(normalizedQuery))
    : kids;
  const resultCountLabel = `${filteredKids.length} ${filteredKids.length === 1 ? "niño" : "niños"}`;

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
    setShowAddKidSuccess(false);
    setIsAddKidOpen(true);
  }

  function handleAddKidSubmit() {
    setIsAddKidOpen(false);
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
        onClose={() => setIsAddKidOpen(false)}
        onSubmit={handleAddKidSubmit}
      />

      {showAddKidSuccess ? (
        <div
          className="fixed top-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-[14px] border border-achievement-strong/20 bg-surface px-4 py-3 text-[14px] font-bold text-foreground shadow-[0_12px_30px_-14px_rgba(63,54,46,0.45)]"
          role="status"
          aria-live="polite"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-achievement-soft text-achievement-strong">
            <CheckIcon size={14} />
          </span>
          Niño agregado correctamente
        </div>
      ) : null}

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

      <div className="mb-3.5 flex items-center gap-3">
        <h2 className="text-[12.5px] font-extrabold tracking-[0.8px] text-foreground">
          {roomName.toLocaleUpperCase("es")}
        </h2>
        <span className="text-[13px] text-muted" aria-live="polite">
          {resultCountLabel}
        </span>
        <span className="h-px flex-1 bg-divider" />
      </div>

      {filteredKids.length > 0 ? (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {filteredKids.map((kid) => (
            <KidCard key={kid.id} kid={kid} />
          ))}
        </div>
      ) : (
        <div
          className="rounded-[18px] border border-border bg-surface px-6 py-12 text-center"
          role="status"
        >
          <p className="font-display text-lg font-semibold text-foreground">
            No encontramos niños
          </p>
          <p className="mt-1 text-sm text-muted">
            Probá con otro nombre.
          </p>
        </div>
      )}
    </>
  );
}
