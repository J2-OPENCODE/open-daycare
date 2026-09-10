import "server-only";

import { requireActiveUser } from "@/lib/auth";
import type { IconAvatar, InitialsAvatar } from "@/types/avatar";
import type { Database } from "@/types/database";
import { createClient } from "@/utils/supabase/server";
import type { QueryData } from "@supabase/supabase-js";
import { connection } from "next/server";

const POST_PHOTOS_BUCKET = "post-photos";
const POST_FEED_LIMIT = 50;
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60;
const postTimeFormatter = new Intl.DateTimeFormat("es-EC", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const childNameCollator = new Intl.Collator("es", {
  sensitivity: "base",
});
const avatarPalette = [
  { background: "#A9D9E8", foreground: "#1F7A93" },
  { background: "#F4B8CC", foreground: "#C44A7A" },
  { background: "#B9DEC4", foreground: "#3E8B62" },
  { background: "#F4DC8E", foreground: "#9A7B1E" },
  { background: "#C9B6E8", foreground: "#7B5FC0" },
] as const;
const announcementAvatar: IconAvatar = {
  kind: "icon",
  icon: "megaphone",
  background: "#CCD8F4",
  foreground: "#4E72C8",
};

type PostType = Database["public"]["Enums"]["post_type"];

export type FeedPostDto = {
  id: string;
  category: PostType;
  title: string;
  publishedAt: string;
  publishedBy: string;
  audience: string;
  body: string;
  reactions: 0;
  comments: 0;
  editable: boolean;
  avatar: InitialsAvatar | IconAvatar;
  media: {
    kind: "photo";
    url: string;
    additionalPhotoCount: number;
  } | null;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

function createFeedPostsQuery(
  supabase: ServerSupabaseClient,
  daycareId: string,
) {
  return supabase
    .from("posts")
    .select(
      `
        id,
        author_id,
        body,
        published_at,
        type,
        room:rooms!posts_room_daycare_fkey(name),
        author:users!posts_author_daycare_fkey(full_name),
        post_children(
          child:children!post_children_child_daycare_fkey(id, full_name)
        ),
        post_photos(storage_path, position)
      `,
    )
    .eq("daycare_id", daycareId)
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .order("position", {
      referencedTable: "post_photos",
      ascending: true,
    })
    .limit(POST_FEED_LIMIT);
}

type FeedPostRow = QueryData<
  ReturnType<typeof createFeedPostsQuery>
>[number];

function getAvatarPaletteIndex(id: string) {
  let hash = 0;

  for (const character of id) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  }

  return hash % avatarPalette.length;
}

function createChildAvatar(id: string, name: string): InitialsAvatar {
  return {
    kind: "initials",
    initials: Array.from(name.trim())[0]?.toLocaleUpperCase("es") ?? "N",
    ...avatarPalette[getAvatarPaletteIndex(id)],
  };
}

function formatNameList(names: readonly string[]) {
  if (names.length < 2) {
    return names[0] ?? "";
  }

  return `${names.slice(0, -1).join(", ")} y ${names.at(-1)}`;
}

function formatPublishedAt(value: string) {
  const publishedAt = new Date(value);

  if (Number.isNaN(publishedAt.getTime())) {
    throw new Error("Invalid publication time received for a post.");
  }

  return postTimeFormatter.format(publishedAt);
}

function getOrderedPhotos(post: FeedPostRow) {
  return [...post.post_photos].sort(
    (firstPhoto, secondPhoto) =>
      firstPhoto.position - secondPhoto.position,
  );
}

function getOrderedChildren(post: FeedPostRow) {
  const children = post.post_children.flatMap(({ child }) =>
    child ? [child] : [],
  );

  if (children.length !== post.post_children.length) {
    throw new Error("Unable to resolve every child tagged in a post.");
  }

  return children.sort((firstChild, secondChild) =>
    childNameCollator.compare(firstChild.full_name, secondChild.full_name),
  );
}

async function signFirstPostPhotos(
  supabase: ServerSupabaseClient,
  posts: readonly FeedPostRow[],
) {
  const firstPhotoPaths = posts.flatMap((post) => {
    const firstPhoto = getOrderedPhotos(post)[0];
    return firstPhoto ? [firstPhoto.storage_path] : [];
  });

  if (firstPhotoPaths.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase.storage
    .from(POST_PHOTOS_BUCKET)
    .createSignedUrls(
      firstPhotoPaths,
      SIGNED_URL_EXPIRES_IN_SECONDS,
    );

  if (error || !data) {
    throw new Error("Unable to sign post photos.", { cause: error });
  }

  const signedUrlByPath = new Map<string, string>();

  for (const signedPhoto of data) {
    if (
      signedPhoto.error ||
      !signedPhoto.path ||
      !signedPhoto.signedUrl
    ) {
      throw new Error("Unable to sign every post photo.");
    }

    signedUrlByPath.set(signedPhoto.path, signedPhoto.signedUrl);
  }

  if (signedUrlByPath.size !== firstPhotoPaths.length) {
    throw new Error("A signed post photo is missing.");
  }

  return signedUrlByPath;
}

function mapFeedPost(
  post: FeedPostRow,
  currentUserId: string,
  signedUrlByPath: ReadonlyMap<string, string>,
): FeedPostDto {
  if (!post.author) {
    throw new Error("Unable to resolve the author of a post.");
  }

  const children = getOrderedChildren(post);
  const photos = getOrderedPhotos(post);
  const firstPhoto = photos[0];
  let title: string;
  let audience: string;
  let avatar: FeedPostDto["avatar"];

  if (post.room) {
    if (children.length > 0) {
      throw new Error("A post has more than one audience kind.");
    }

    title = "Anuncio general";
    audience = `toda la sala ${post.room.name}`;
    avatar = announcementAvatar;
  } else {
    if (children.length === 0) {
      throw new Error("A post has no audience.");
    }

    const childNames = children.map((child) => child.full_name);
    const formattedNames = formatNameList(childNames);
    title = formattedNames;
    audience =
      children.length === 1
        ? `familia de ${formattedNames}`
        : `familias de ${formattedNames}`;
    avatar =
      post.type === "announcement"
        ? announcementAvatar
        : createChildAvatar(children[0].id, children[0].full_name);
  }

  let media: FeedPostDto["media"] = null;

  if (firstPhoto) {
    const signedUrl = signedUrlByPath.get(firstPhoto.storage_path);

    if (!signedUrl) {
      throw new Error("The first post photo has no signed URL.");
    }

    media = {
      kind: "photo",
      url: signedUrl,
      additionalPhotoCount: photos.length - 1,
    };
  }

  return {
    id: post.id,
    category: post.type,
    title,
    publishedAt: formatPublishedAt(post.published_at),
    publishedBy:
      post.author_id === currentUserId ? "vos" : post.author.full_name,
    audience,
    body: post.body,
    reactions: 0,
    comments: 0,
    editable: post.author_id === currentUserId,
    avatar,
    media,
  };
}

export async function getFeedPosts(): Promise<readonly FeedPostDto[]> {
  await connection();

  const access = await requireActiveUser();

  if (access.role !== "staff" && access.role !== "admin") {
    throw new Error("Only staff and admins can load the daycare feed.");
  }

  const supabase = await createClient();
  const { data: posts, error } = await createFeedPostsQuery(
    supabase,
    access.daycareId,
  );

  if (error) {
    throw new Error("Unable to load daycare posts.", { cause: error });
  }

  const signedUrlByPath = await signFirstPostPhotos(supabase, posts);

  return posts.map((post) =>
    mapFeedPost(post, access.userId, signedUrlByPath),
  );
}
