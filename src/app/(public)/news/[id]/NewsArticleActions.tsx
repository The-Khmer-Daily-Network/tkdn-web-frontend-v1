"use client";

import NewsAudioPlayer from "@/components/NewsAudioPlayer";
import type { News } from "@/types/news";

export default function NewsArticleActions({ news }: { news: News }) {
  const audioSrc =
    (news.tts_audio_url ||
      (news as News & { ttsAudioUrl?: string }).ttsAudioUrl ||
      "") as string;
  const hasAudio = Boolean(
    news.tts_audio_url || (news as News & { ttsAudioUrl?: string }).ttsAudioUrl,
  );

  return (
    <div className="w-full mt-6">
      <NewsAudioPlayer src={audioSrc} showListenButton={hasAudio} />
    </div>
  );
}
