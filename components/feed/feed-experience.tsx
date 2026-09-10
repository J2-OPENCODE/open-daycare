"use client";

import {
  CreatePostModal,
  type CreatePostAction,
} from "@/components/feed/create-post-modal";
import { FeedComposer } from "@/components/feed/feed-composer";
import {
  FeedHeader,
  FeedSectionHeading,
} from "@/components/feed/feed-header";
import { FeedList } from "@/components/feed/feed-list";
import type { PostAudienceKid } from "@/components/feed/post-audience-selector";
import type { PostRoomOption } from "@/components/feed/post-room-selector";
import { AppShell } from "@/components/layout/app-shell";
import { SuccessNotice } from "@/components/ui/success-notice";
import type { FeedData, FeedPost } from "@/types/feed";
import { useEffect, useRef, useState } from "react";

type FeedExperienceProps = {
  feed: FeedData;
  posts: readonly FeedPost[];
  kids: readonly PostAudienceKid[];
  rooms: readonly PostRoomOption[];
  childCount: number;
  dateLabel: string;
  submitAction: CreatePostAction;
};

const SUCCESS_NOTICE_DURATION_MS = 3000;

export function FeedExperience({
  feed,
  posts,
  kids,
  rooms,
  childCount,
  dateLabel,
  submitAction,
}: FeedExperienceProps) {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [showCreatePostSuccess, setShowCreatePostSuccess] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

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

  function handleOpenCreatePost() {
    clearSuccessTimer();
    setShowCreatePostSuccess(false);
    setIsCreatePostOpen(true);
  }

  /** Reached only after the action confirmed the write. */
  function handleCreatePostSuccess() {
    setIsCreatePostOpen(false);
    clearSuccessTimer();
    setShowCreatePostSuccess(true);
    successTimerRef.current = setTimeout(() => {
      setShowCreatePostSuccess(false);
      successTimerRef.current = null;
    }, SUCCESS_NOTICE_DURATION_MS);
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
            childCount={childCount}
            dateLabel={dateLabel}
          />
          <FeedComposer
            initials={feed.currentUser.initials}
            prompt={feed.composerPrompt}
            onCreatePost={handleOpenCreatePost}
          />
          <FeedSectionHeading>{feed.sectionLabel}</FeedSectionHeading>
          <FeedList posts={posts} />
        </div>
      </AppShell>

      <CreatePostModal
        isOpen={isCreatePostOpen}
        kids={kids}
        rooms={rooms}
        submitAction={submitAction}
        onClose={() => setIsCreatePostOpen(false)}
        onSubmit={handleCreatePostSuccess}
      />

      <SuccessNotice>
        {showCreatePostSuccess ? "Publicación creada" : null}
      </SuccessNotice>
    </>
  );
}
