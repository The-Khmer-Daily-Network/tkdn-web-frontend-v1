const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.warn("NEXT_PUBLIC_API_BASE_URL is not defined in environment variables");
}

function getApiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined in environment variables");
  }
  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  const apiPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${apiPath}`;
}

export interface ConvertArticleToSpeechParams {
  text: string;
  articleId?: number;
  title?: string;
}

export interface ConvertArticleToSpeechResponse {
  success: boolean;
  message?: string;
  data?: {
    audio_url?: string;
    tts_audio_url?: string;
    audio_name?: string | null;
    tts_audio_name?: string | null;
  };
  audio_url?: string;
  tts_audio_url?: string;
  audio_name?: string | null;
  tts_audio_name?: string | null;
}

export async function convertArticleToSpeech({
  text,
  articleId,
  title,
}: ConvertArticleToSpeechParams): Promise<ConvertArticleToSpeechResponse> {
  const url = getApiUrl("/admin/articles/tts/convert");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      text,
      article_id: articleId,
      title: title?.trim() || null,
    }),
    credentials: "omit",
    mode: "cors",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to convert text to speech: ${response.status} ${response.statusText}. ${errorText}`,
    );
  }

  return response.json();
}

/** Deletes TTS audio from object storage (pending preview or permanent file under audio-text-to-speech/). */
export async function deleteArticleTtsAudio(url: string): Promise<void> {
  const apiUrl = getApiUrl("/admin/articles/tts/delete");
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ url }),
    credentials: "omit",
    mode: "cors",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to delete TTS audio: ${response.status} ${response.statusText}. ${errorText}`,
    );
  }
}
