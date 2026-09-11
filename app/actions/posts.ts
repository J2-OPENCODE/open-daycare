"use server";

import "server-only";

import type { CreatePostActionResult } from "@/components/feed/create-post-modal";
import { getAuthAccessState } from "@/lib/auth";
import {
  isCreatePostType,
  validateCreatePostDescription,
  validateCreatePostPhotos,
  type CreatePostFormErrors,
  type CreatePostType,
} from "@/lib/create-post-form";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const POST_PHOTOS_BUCKET = "post-photos";
const CREATE_POST_ERROR_MESSAGE =
  "No se pudo crear la publicación. Intentá de nuevo.";
const SESSION_ERROR_MESSAGE =
  "No pudimos verificar tu cuenta. Intentá nuevamente.";
const ANONYMOUS_ERROR_MESSAGE = "Iniciá sesión para publicar.";
const FORBIDDEN_ERROR_MESSAGE = "No tenés permisos para publicar.";
const AUDIENCE_ERROR_MESSAGE = "Seleccioná al menos un destinatario.";
const UNAVAILABLE_KIDS_ERROR_MESSAGE =
  "Seleccioná destinatarios disponibles en tu guardería.";
const ROOM_ERROR_MESSAGE = "Seleccioná una sala.";
const UNAVAILABLE_ROOM_ERROR_MESSAGE = "Seleccioná una sala válida.";
const PHOTO_TYPE_ERROR_MESSAGE =
  "Solo se permiten fotos JPEG, PNG o WebP.";
const photoExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ParsedCreatePostInput = {
  type: CreatePostType;
  description: string;
  audienceKind: "kids" | "room";
  kidIds: readonly string[];
  roomId: string | null;
  photos: readonly File[];
};

type CreatePostAudienceArgs =
  | { p_room_id: string }
  | { p_child_ids: string[] };

type PostPhotoPayload = {
  storage_path: string;
  content_type: string;
  size_bytes: number;
  position: number;
};

/** Every entry arrives from the browser, so nothing is assumed about it. */
function parseCreatePostInput(
  formData: FormData,
): ParsedCreatePostInput | null {
  const type = formData.get("type");
  const description = formData.get("description");
  const audienceKind = formData.get("audienceKind");
  const roomId = formData.get("roomId");

  if (
    !isCreatePostType(type) ||
    typeof description !== "string" ||
    typeof roomId !== "string" ||
    (audienceKind !== "kids" && audienceKind !== "room")
  ) {
    return null;
  }

  const kidIds = formData
    .getAll("kidIds")
    .filter((value): value is string => typeof value === "string");
  const photos = formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);

  return {
    type,
    description,
    audienceKind,
    kidIds: [...new Set(kidIds)],
    roomId: roomId.trim() || null,
    photos,
  };
}

/** Repeats in the server every validation the modal already runs. */
function validateCreatePostInput(input: ParsedCreatePostInput) {
  const errors: CreatePostFormErrors = {};
  const descriptionError = validateCreatePostDescription(input.description);
  const photosError = validateCreatePostPhotos(input.photos);

  if (input.audienceKind === "kids" && input.kidIds.length === 0) {
    errors.audience = AUDIENCE_ERROR_MESSAGE;
  }

  if (
    input.audienceKind === "kids" &&
    input.kidIds.some((kidId) => !UUID_PATTERN.test(kidId))
  ) {
    errors.audience = UNAVAILABLE_KIDS_ERROR_MESSAGE;
  }

  if (input.audienceKind === "room" && !input.roomId) {
    errors.room = ROOM_ERROR_MESSAGE;
  }

  if (
    input.audienceKind === "room" &&
    input.roomId &&
    !UUID_PATTERN.test(input.roomId)
  ) {
    errors.room = UNAVAILABLE_ROOM_ERROR_MESSAGE;
  }

  if (descriptionError) {
    errors.description = descriptionError;
  }

  if (photosError) {
    errors.photos = photosError;
  }

  if (input.photos.some((photo) => !photoExtensions[photo.type])) {
    errors.photos = PHOTO_TYPE_ERROR_MESSAGE;
  }

  return errors;
}

/** A post that cannot be written must not leave objects in the bucket. */
async function removeUploadedPhotos(
  supabase: ServerSupabaseClient,
  storagePaths: readonly string[],
) {
  if (storagePaths.length === 0) {
    return;
  }

  await supabase.storage.from(POST_PHOTOS_BUCKET).remove([...storagePaths]);
}

export async function createPost(
  formData: FormData,
): Promise<CreatePostActionResult> {
  const input = parseCreatePostInput(formData);

  if (!input) {
    return { status: "error", message: CREATE_POST_ERROR_MESSAGE };
  }

  const errors = validateCreatePostInput(input);

  if (Object.keys(errors).length > 0) {
    return { status: "invalid", errors };
  }

  // The page is already protected, but the action re-authorizes on its own.
  let access: Awaited<ReturnType<typeof getAuthAccessState>>;

  try {
    access = await getAuthAccessState();
  } catch {
    return { status: "error", message: SESSION_ERROR_MESSAGE };
  }

  if (access.status === "anonymous") {
    return { status: "error", message: ANONYMOUS_ERROR_MESSAGE };
  }

  if (access.status !== "active" || access.role === "parent") {
    return { status: "error", message: FORBIDDEN_ERROR_MESSAGE };
  }

  const supabase = await createClient();
  let audienceArgs: CreatePostAudienceArgs;

  if (input.audienceKind === "room") {
    if (!input.roomId) {
      return { status: "invalid", errors: { room: ROOM_ERROR_MESSAGE } };
    }

    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id")
      .eq("id", input.roomId)
      .eq("daycare_id", access.daycareId)
      .maybeSingle();

    if (roomError) {
      return { status: "error", message: CREATE_POST_ERROR_MESSAGE };
    }

    if (!room) {
      return {
        status: "invalid",
        errors: { room: UNAVAILABLE_ROOM_ERROR_MESSAGE },
      };
    }

    audienceArgs = { p_room_id: room.id };
  } else {
    const { data: children, error: childrenError } = await supabase
      .from("children")
      .select("id, full_name, photo_consent")
      .eq("daycare_id", access.daycareId)
      .eq("status", "active")
      .in("id", [...input.kidIds]);

    if (childrenError) {
      return { status: "error", message: CREATE_POST_ERROR_MESSAGE };
    }

    // A foreign, archived or unknown child yields the same message.
    if (children.length !== input.kidIds.length) {
      return {
        status: "invalid",
        errors: { audience: UNAVAILABLE_KIDS_ERROR_MESSAGE },
      };
    }

    const childWithoutPhotoConsent = children.find(
      (child) => child.photo_consent !== true,
    );

    if (input.photos.length > 0 && childWithoutPhotoConsent) {
      return {
        status: "invalid",
        errors: {
          photos: `${childWithoutPhotoConsent.full_name} no tiene consentimiento para fotografías.`,
        },
      };
    }

    audienceArgs = { p_child_ids: children.map((child) => child.id) };
  }

  // The post identifier is reserved here so the bucket paths can be built.
  const postId = crypto.randomUUID();
  const uploadedPaths: string[] = [];
  const photoPayloads: PostPhotoPayload[] = [];
  let position = 0;

  for (const photo of input.photos) {
    position += 1;

    const storagePath = `${access.daycareId}/${postId}/${crypto.randomUUID()}.${photoExtensions[photo.type]}`;
    const { error: uploadError } = await supabase.storage
      .from(POST_PHOTOS_BUCKET)
      .upload(storagePath, photo, {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) {
      await removeUploadedPhotos(supabase, uploadedPaths);
      return { status: "error", message: CREATE_POST_ERROR_MESSAGE };
    }

    uploadedPaths.push(storagePath);
    photoPayloads.push({
      storage_path: storagePath,
      content_type: photo.type,
      size_bytes: photo.size,
      position,
    });
  }

  // One transaction writes posts, post_children and post_photos together.
  const { error: writeError } = await supabase.rpc("create_post", {
    p_post_id: postId,
    p_type: input.type,
    p_body: input.description.trim(),
    ...audienceArgs,
    p_photos: photoPayloads,
  });

  if (writeError) {
    await removeUploadedPhotos(supabase, uploadedPaths);
    return { status: "error", message: CREATE_POST_ERROR_MESSAGE };
  }

  revalidatePath("/");

  return { status: "success" };
}
