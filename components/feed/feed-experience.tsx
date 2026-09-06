"use client";

import { CreatePostModal } from "@/components/feed/create-post-modal";
import { FeedComposer } from "@/components/feed/feed-composer";
import {
  FeedHeader,
  FeedSectionHeading,
} from "@/components/feed/feed-header";
import { FeedList } from "@/components/feed/feed-list";
import { AppShell } from "@/components/layout/app-shell";
import type { FeedData } from "@/types/feed";
import type { Kid } from "@/types/kids";
import { useState } from "react";

type FeedExperienceProps = {
  feed: FeedData;
  kids: readonly Kid[];
};

export function FeedExperience({ feed, kids }: FeedExperienceProps) {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  function handleOpenCreatePost() {
    setIsCreatePostOpen(true);
  }

  return (
    <>
      <AppShell
        roomName={feed.roomName}
        currentUser={feed.currentUser}
        currentDestination="feed"
        onCreatePost={handleOpenCreatePost}
      >
        <div className="mx-auto w-full max-w-[760px] px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-10 md:pt-[34px] md:pb-20">
          <FeedHeader
            nurseryLabel={feed.nurseryLabel}
            roomName={feed.roomName}
            greeting={feed.greeting}
            childCount={feed.childCount}
            dateLabel={feed.dateLabel}
          />
          <FeedComposer
            initials={feed.currentUser.initials}
            prompt={feed.composerPrompt}
            onCreatePost={handleOpenCreatePost}
          />
          <FeedSectionHeading>{feed.sectionLabel}</FeedSectionHeading>
          <FeedList posts={feed.posts} />
        </div>
      </AppShell>

      <CreatePostModal
        isOpen={isCreatePostOpen}
        kids={kids}
        onClose={() => setIsCreatePostOpen(false)}
        onSubmit={() => setIsCreatePostOpen(false)}
      />
    </>
  );
}
