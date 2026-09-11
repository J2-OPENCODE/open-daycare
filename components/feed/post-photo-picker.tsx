"use client";

import { CloseIcon, PlusIcon } from "@/components/icons";
import {
  ALLOWED_POST_PHOTO_TYPES,
  MAX_POST_PHOTOS,
  validateCreatePostPhotos,
  type CreatePostPhoto,
} from "@/lib/create-post-form";
import Image from "next/image";
import {
  useEffect,
  useRef,
  type ChangeEvent,
  type RefObject,
} from "react";

type PostPhotoPickerProps = {
  photos: readonly CreatePostPhoto[];
  onChange: (photos: readonly CreatePostPhoto[]) => void;
  error?: string;
  onErrorChange: (error: string | undefined) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
};

const labelClassName =
  "mb-2.5 block text-xs font-extrabold tracking-[0.7px] text-muted-strong";

export function PostPhotoPicker({
  photos,
  onChange,
  error,
  onErrorChange,
  inputRef,
}: PostPhotoPickerProps) {
  const createdPreviewUrlsRef = useRef(new Set<string>());

  useEffect(() => {
    const activePreviewUrls = new Set(
      photos.map((photo) => photo.previewUrl),
    );

    for (const previewUrl of createdPreviewUrlsRef.current) {
      if (!activePreviewUrls.has(previewUrl)) {
        URL.revokeObjectURL(previewUrl);
        createdPreviewUrlsRef.current.delete(previewUrl);
      }
    }
  }, [photos]);

  useEffect(() => {
    const createdPreviewUrls = createdPreviewUrlsRef.current;

    return () => {
      for (const previewUrl of createdPreviewUrls) {
        URL.revokeObjectURL(previewUrl);
      }

      createdPreviewUrls.clear();
    };
  }, []);

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const validationError = validateCreatePostPhotos([
      ...photos.map((photo) => photo.file),
      ...selectedFiles,
    ]);

    if (validationError) {
      onErrorChange(validationError);
      return;
    }

    const selectedPhotos = selectedFiles.map((file) => {
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      createdPreviewUrlsRef.current.add(previewUrl);

      return {
        id,
        file,
        previewUrl,
      } satisfies CreatePostPhoto;
    });

    onChange([...photos, ...selectedPhotos]);
    onErrorChange(undefined);
  }

  function removePhoto(photoId: string) {
    const photo = photos.find((candidate) => candidate.id === photoId);

    if (photo && createdPreviewUrlsRef.current.delete(photo.previewUrl)) {
      URL.revokeObjectURL(photo.previewUrl);
    }

    const nextPhotos = photos.filter((candidate) => candidate.id !== photoId);
    onChange(nextPhotos);
    onErrorChange(
      validateCreatePostPhotos(nextPhotos.map((candidate) => candidate.file)),
    );
  }

  return (
    <section aria-labelledby="create-post-photos-label">
      <h3 id="create-post-photos-label" className={labelClassName}>
        FOTOS
      </h3>
      <div className="flex min-w-0 flex-wrap items-start gap-3">
        {photos.map((photo) => (
          <figure key={photo.id} className="w-24 min-w-0">
            <div className="relative h-24 overflow-hidden rounded-[14px] border border-border bg-photo-background">
              <Image
                src={photo.previewUrl}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full border border-border bg-modal-card/95 text-foreground shadow-sm outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2 focus-visible:ring-offset-modal-card"
                onClick={() => removePhoto(photo.id)}
                aria-label={`Quitar ${photo.file.name}`}
              >
                <CloseIcon size={15} />
              </button>
            </div>
            <figcaption
              className="mt-1.5 truncate text-xs font-semibold text-muted-strong"
              title={photo.file.name}
            >
              {photo.file.name}
            </figcaption>
          </figure>
        ))}

        <div className="relative h-24 w-24 shrink-0">
          <input
            ref={inputRef}
            id="create-post-photos"
            name="photos"
            type="file"
            className="peer sr-only"
            accept={ALLOWED_POST_PHOTO_TYPES.join(",")}
            multiple
            onChange={handleFilesChange}
            aria-label={`Agregar fotos, máximo ${MAX_POST_PHOTOS}`}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? "create-post-photos-error" : undefined
            }
          />
          <label
            htmlFor="create-post-photos"
            className={`flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-photo-border bg-photo-background text-photo-foreground outline-none transition-[background-color,border-color,box-shadow] hover:border-coral hover:bg-surface peer-focus-visible:ring-2 peer-focus-visible:ring-coral-strong peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-modal-card ${error ? "border-modal-error" : ""}`}
          >
            <PlusIcon className="text-coral-dark" size={22} />
            <span className="text-xs">Agregar</span>
          </label>
        </div>
      </div>
      {error ? (
        <p
          id="create-post-photos-error"
          className="mt-1.5 text-[13px] font-semibold text-modal-error"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
