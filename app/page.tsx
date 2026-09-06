import { FeedExperience } from "@/components/feed/feed-experience";
import { feedData } from "@/data/feed";
import { kidsData } from "@/data/kids";

export default function Home() {
  return <FeedExperience feed={feedData} kids={kidsData.children} />;
}
