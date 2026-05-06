"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  getAdminVideos,
  getAdminVideoById,
  createAdminVideo,
  updateAdminVideo,
  deleteAdminVideo,
} from "@/services/news";
import { getCategories } from "@/services/category";
import {
  deleteContentCover,
  getContentCovers,
  uploadContentCover,
} from "@/services/contentCover";
import {
  deleteContentImage,
  getContentImages,
  uploadContentImage,
} from "@/services/contentImage";
import {
  deleteContentVideo,
  getContentVideos,
  uploadContentVideo,
} from "@/services/contentVideo";
import {
  convertArticleToSpeech,
  deleteArticleTtsAudio,
} from "@/services/textToSpeech";
import NewsAudioPlayer from "@/components/NewsAudioPlayer";
import type { News, ContentBlock, EndImage } from "@/types/news";
import type { Category } from "@/types/category";
import CoverSelectorModal from "@/components/admin/CoverSelectorModal";
import ImageSelectorModal from "@/components/admin/ImageSelectorModal";
import VideoSelectorModal from "@/components/admin/VideoSelectorModal";
import type { ContentCover } from "@/types/contentCover";
import type { ContentImage } from "@/types/contentImage";
import type { ContentVideo } from "@/types/contentVideo";
import { useAuth } from "@/contexts/AuthContext";

const PER_PAGE_OPTIONS = [30, 50, 100] as const;

const decodeHtmlEntities = (input: string) => {
  if (typeof window === "undefined") {
    return input
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");
  }
  const textarea = document.createElement("textarea");
  textarea.innerHTML = input;
  return textarea.value;
};

const toPlainPreviewText = (value: string) => {
  // Some payloads are double-encoded (&amp;lt;div...), decode twice.
  const decoded = decodeHtmlEntities(decodeHtmlEntities(value || ""));
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(`<div>${decoded}</div>`, "text/html");
    const text = doc.body.textContent || "";
    return text.replace(/\s+/g, " ").trim();
  }
  return decoded.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

/** Preview conversions live under .../audio-text-to-speech/pending/ until Save promotes them. */
const isPendingTtsUrl = (url: string | null | undefined): boolean =>
  !!url && url.includes("/audio-text-to-speech/pending/");

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  news?: News | null;
  categories: Category[];
  currentUsername: string;
  asPage?: boolean;
}

function NewsModal({
  isOpen,
  onClose,
  onSuccess,
  news,
  categories,
  currentUsername,
  asPage = false,
}: NewsModalProps) {
  const MAX_THUMBNAIL_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
  const MAX_CONTENT_IMAGE_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB per file
  const MAX_MIDDLE_VIDEO_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [coverName, setCoverName] = useState<string | null>(null);
  const [coverUrlInput, setCoverUrlInput] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { subtitle: null, paragraph: "" },
  ]);
  const [middleVideoUrl, setMiddleVideoUrl] = useState<string | null>(null);
  const [middleVideoName, setMiddleVideoName] = useState<string | null>(null);
  const [middleVideoUrlInput, setMiddleVideoUrlInput] = useState("");
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [ttsAudioName, setTtsAudioName] = useState<string | null>(null);
  const [ttsPlainInput, setTtsPlainInput] = useState("");
  const [ttsConverting, setTtsConverting] = useState(false);
  const [ttsRemoving, setTtsRemoving] = useState(false);
  const [endImages, setEndImages] = useState<EndImage[]>([]);
  const [endImageUrlInputs, setEndImageUrlInputs] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [inlineImageUploading, setInlineImageUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [middleVideoUploading, setMiddleVideoUploading] = useState(false);
  const [endImageUploadingIndex, setEndImageUploadingIndex] = useState<
    number | null
>(null);
  const [activeSelection, setActiveSelection] = useState<{
    blockIndex: number;
  } | null>(null);
  const [activeEditorBlockIndex, setActiveEditorBlockIndex] = useState<number | null>(
    null,
  );
  const [activeTextFormat, setActiveTextFormat] = useState<{
    bold: boolean;
    subtitle: boolean;
    link: boolean;
    quote: boolean;
  }>({
    bold: false,
    subtitle: false,
    link: false,
    quote: false,
  });
  const [coverPendingFile, setCoverPendingFile] = useState<File | null>(null);
  const [middleVideoPendingFile, setMiddleVideoPendingFile] =
    useState<File | null>(null);
  const [endImagePendingFiles, setEndImagePendingFiles] = useState<
    Array<File | null>
>([null, null, null]);
  const previewObjectUrlsRef = useRef<string[]>([]);
  const originalCoverUrlRef = useRef<string | null>(null);
  const originalMiddleVideoUrlRef = useRef<string | null>(null);
  const middleVideoRemovedFromParagraphRef = useRef(false);
  const originalEndImageUrlsRef = useRef<Array<string | null>>([null, null, null]);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const middleVideoFileInputRef = useRef<HTMLInputElement | null>(null);
  const endImageFileInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const titleTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const contentTextareaRefs = useRef<Array<HTMLDivElement | null>>([]);
  const inlineImageInputRef = useRef<HTMLInputElement | null>(null);
  const savedInlineImageRangeRef = useRef<Range | null>(null);
  const savedInlineImageBlockIndexRef = useRef<number | null>(null);
  const inlinePendingImagesRef = useRef<
    Record<string, { file: File; type: "middle" | "end" }>
  >({});
  const inlinePendingVideosRef = useRef<Record<string, { file: File }>>({});
  const inlinePendingImageCounterRef = useRef(0);
  const inlineImageInsertTypeRef = useRef<"middle" | "end">("end");
  const removedInlineImageUrlsRef = useRef<Set<string>>(new Set());
  const removedInlineVideoUrlsRef = useRef<Set<string>>(new Set());
  const draftBaselineRef = useRef("");

  const buildDraftSignature = (payload: {
    categoryId: number | null;
    author: string;
    title: string;
    cover: string | null;
    coverName: string | null;
    subtitle: string;
    contentBlocks: ContentBlock[];
    middleVideoUrl: string | null;
    middleVideoName: string | null;
    ttsAudioUrl: string | null;
    ttsAudioName: string | null;
    ttsSourceText: string;
    endImages: EndImage[];
  }) =>
    JSON.stringify({
      categoryId: payload.categoryId,
      author: payload.author,
      title: payload.title,
      cover: payload.cover,
      coverName: payload.coverName,
      subtitle: payload.subtitle,
      contentBlocks: payload.contentBlocks,
      middleVideoUrl: payload.middleVideoUrl,
      middleVideoName: payload.middleVideoName,
      ttsAudioUrl: payload.ttsAudioUrl,
      ttsAudioName: payload.ttsAudioName,
      ttsSourceText: payload.ttsSourceText,
      endImages: payload.endImages,
    });

  const syncActiveTextFormat = (editor?: HTMLDivElement | null) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setActiveTextFormat({ bold: false, subtitle: false, link: false, quote: false });
      return;
    }

    const rootEditor =
      editor ??
      contentTextareaRefs.current.find((el) => {
        if (!el) return false;
        const anchorNode = selection.anchorNode;
        const focusNode = selection.focusNode;
        return (
          (!!anchorNode && el.contains(anchorNode)) ||
          (!!focusNode && el.contains(focusNode))
        );
      }) ??
      null;

    if (!rootEditor) {
      setActiveTextFormat({ bold: false, subtitle: false, link: false, quote: false });
      return;
    }

    const isNodeInsideTag = (node: Node | null, tagNames: string[]) => {
      if (!node) return false;
      let current: Element | null =
        node.nodeType === Node.ELEMENT_NODE
          ? (node as Element)
          : node.parentElement;

      while (current && rootEditor.contains(current)) {
        if (tagNames.includes(current.tagName.toLowerCase())) {
          return true;
        }
        current = current.parentElement;
      }
      return false;
    };

    const subtitle =
      isNodeInsideTag(selection.anchorNode, ["h2"]) ||
      isNodeInsideTag(selection.focusNode, ["h2"]);
    const quote =
      isNodeInsideTag(selection.anchorNode, ["blockquote"]) ||
      isNodeInsideTag(selection.focusNode, ["blockquote"]);
    const link =
      isNodeInsideTag(selection.anchorNode, ["a"]) ||
      isNodeInsideTag(selection.focusNode, ["a"]);
    const bold =
      isNodeInsideTag(selection.anchorNode, ["b", "strong"]) ||
      isNodeInsideTag(selection.focusNode, ["b", "strong"]) ||
      document.queryCommandState("bold");

    setActiveTextFormat({ bold, subtitle, link, quote });
  };

  // Modal states
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isMiddleVideoModalOpen, setIsMiddleVideoModalOpen] = useState(false);
  const [isEndImageModalOpen, setIsEndImageModalOpen] = useState(false);

  useEffect(() => {
    // Clear any pending local previews/files when switching item or opening.
    previewObjectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    previewObjectUrlsRef.current = [];
    setCoverPendingFile(null);
    setMiddleVideoPendingFile(null);
    setEndImagePendingFiles([null, null, null]);

    if (news) {
      const initialContentBlocks =
        news.content_blocks && news.content_blocks.length > 0
          ? news.content_blocks
          : [{ subtitle: null, paragraph: "" }];
      const initialEndImages =
        news.end_images && news.end_images.length > 0 ? news.end_images : [];
      setCategoryId(news.category_id);
      setAuthor(news.author);
      setTitle(news.title);
      setCover(news.cover);
      setCoverName(news.cover_name);
      setSubtitle(news.subtitle || "");
      setContentBlocks(initialContentBlocks);
      setMiddleVideoUrl(news.middle_video_url);
      setMiddleVideoName(news.middle_video_name);
      setTtsAudioUrl(news.tts_audio_url);
      setTtsAudioName(news.tts_audio_name);
      setTtsPlainInput(news.tts_source_text ?? "");
      setEndImages(initialEndImages);
      originalCoverUrlRef.current = news.cover ?? null;
      originalMiddleVideoUrlRef.current = news.middle_video_url ?? null;
      middleVideoRemovedFromParagraphRef.current = false;
      originalEndImageUrlsRef.current = [
        news.end_images?.[0]?.url ?? null,
        news.end_images?.[1]?.url ?? null,
        news.end_images?.[2]?.url ?? null,
      ];
      draftBaselineRef.current = buildDraftSignature({
        categoryId: news.category_id,
        author: news.author,
        title: news.title,
        cover: news.cover,
        coverName: news.cover_name,
        subtitle: news.subtitle || "",
        contentBlocks: initialContentBlocks,
        middleVideoUrl: news.middle_video_url,
        middleVideoName: news.middle_video_name,
        ttsAudioUrl: news.tts_audio_url,
        ttsAudioName: news.tts_audio_name,
        ttsSourceText: news.tts_source_text ?? "",
        endImages: initialEndImages,
      });
    } else {
      setCategoryId(null);
      setAuthor(currentUsername);
      setTitle("");
      setCover(null);
      setCoverName(null);
      setCoverUrlInput("");
      setSubtitle("");
      setContentBlocks([{ subtitle: null, paragraph: "" }]);
      setMiddleVideoUrl(null);
      setMiddleVideoName(null);
      setMiddleVideoUrlInput("");
      setTtsAudioUrl(null);
      setTtsAudioName(null);
      setTtsPlainInput("");
      setEndImages([]);
      setEndImageUrlInputs([""]);
      originalCoverUrlRef.current = null;
      originalMiddleVideoUrlRef.current = null;
      middleVideoRemovedFromParagraphRef.current = false;
      originalEndImageUrlsRef.current = [null, null, null];
      draftBaselineRef.current = buildDraftSignature({
        categoryId: null,
        author: currentUsername,
        title: "",
        cover: null,
        coverName: null,
        subtitle: "",
        contentBlocks: [{ subtitle: null, paragraph: "" }],
        middleVideoUrl: null,
        middleVideoName: null,
        ttsAudioUrl: null,
        ttsAudioName: null,
        ttsSourceText: "",
        endImages: [],
      });
    }
    setError(null);
    setShowCategorySelector(false);
    inlinePendingImagesRef.current = {};
    inlinePendingVideosRef.current = {};
    removedInlineImageUrlsRef.current = new Set();
    removedInlineVideoUrlsRef.current = new Set();
  }, [news, isOpen, currentUsername]);

  const currentDraftSignature = useMemo(
    () =>
      buildDraftSignature({
        categoryId,
        author,
        title,
        cover,
        coverName,
        subtitle,
        contentBlocks,
        middleVideoUrl,
        middleVideoName,
        ttsAudioUrl,
        ttsAudioName,
        ttsSourceText: ttsPlainInput,
        endImages,
      }),
    [
      categoryId,
      author,
      title,
      cover,
      coverName,
      subtitle,
      contentBlocks,
      middleVideoUrl,
      middleVideoName,
      ttsAudioUrl,
      ttsAudioName,
      ttsPlainInput,
      endImages,
    ],
  );

  useEffect(() => {
    if (!asPage) return;

    const hasUnsavedChanges = () =>
      !!draftBaselineRef.current && currentDraftSignature !== draftBaselineRef.current;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!loading && hasUnsavedChanges()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    const handlePopState = () => {
      if (loading || !hasUnsavedChanges()) return;
      const shouldLeave = window.confirm("Changes you made may not be saved.");
      if (!shouldLeave) {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [asPage, loading, currentDraftSignature]);

  const requestCloseEditor = () => {
    void (async () => {
      if (loading || ttsRemoving) return;
      if (draftBaselineRef.current && currentDraftSignature !== draftBaselineRef.current) {
        const shouldLeave = window.confirm("Changes you made may not be saved.");
        if (!shouldLeave) return;
      }
      if (ttsAudioUrl && isPendingTtsUrl(ttsAudioUrl)) {
        try {
          await deleteArticleTtsAudio(ttsAudioUrl);
        } catch (e) {
          console.error("Failed to delete preview TTS from storage on close:", e);
        }
      }
      onClose();
    })();
  };

  useEffect(() => {
    return () => {
      previewObjectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      previewObjectUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!asPage) return;
    const el = titleTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [title, asPage, isOpen]);

  useEffect(() => {
    if (!activeSelection) return;

    const syncSelectionState = () => {
      const editor = contentTextareaRefs.current[activeSelection.blockIndex];
      if (!editor) {
        setActiveSelection(null);
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setActiveSelection(null);
        setActiveTextFormat({ bold: false, subtitle: false, link: false, quote: false });
        return;
      }
      const range = selection.getRangeAt(0);
      const commonNode = range.commonAncestorContainer;
      const isInsideEditor = editor.contains(commonNode);
      if (!isInsideEditor) {
        setActiveSelection(null);
        setActiveTextFormat({ bold: false, subtitle: false, link: false, quote: false });
        return;
      }
      syncActiveTextFormat(editor);
    };

    document.addEventListener("selectionchange", syncSelectionState);
    return () => {
      document.removeEventListener("selectionchange", syncSelectionState);
    };
  }, [activeSelection]);

  const queuePreviewUrl = (file: File): string => {
    const url = URL.createObjectURL(file);
    previewObjectUrlsRef.current.push(url);
    return url;
  };

  const handleRemoveContentBlock = (index: number) => {
    if (contentBlocks.length > 1) {
      setContentBlocks(contentBlocks.filter((_, i) => i !== index));
    }
  };

  const handleUpdateContentBlock = (
    index: number,
    field: "subtitle" | "paragraph",
    value: string | null,
  ) => {
    const updated = [...contentBlocks];
    updated[index] = { ...updated[index], [field]: value };
    setContentBlocks(updated);
  };

  const handleContentSelection = (
    index: number,
    e: React.SyntheticEvent<HTMLDivElement>,
  ) => {
    const target = e.currentTarget;
    setActiveEditorBlockIndex(index);
    requestAnimationFrame(() => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const commonNode = range.commonAncestorContainer;
        if (!target.contains(commonNode)) {
          setActiveSelection(null);
          setActiveTextFormat({
            bold: false,
            subtitle: false,
            link: false,
            quote: false,
          });
          return;
        }
        setActiveSelection({ blockIndex: index });
        syncActiveTextFormat(target);
        return;
      }
      setActiveSelection(null);
      setActiveTextFormat({ bold: false, subtitle: false, link: false, quote: false });
    });
  };

  const handleContentKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      const editor = contentTextareaRefs.current[index];
      if (!editor) return;
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      const isProtectedWrapper = (node: Node | null) => {
        if (!node) return false;
        const el =
          node.nodeType === Node.ELEMENT_NODE
            ? (node as Element)
            : node.parentElement;
        if (!el) return false;
        return !!el.closest(
          "[data-inline-image-wrapper='true'][data-inline-image-kind='middle'],[data-inline-video-wrapper='true']",
        );
      };

      if (!range.collapsed) {
        const protectedWrappers = Array.from(
          editor.querySelectorAll(
            "[data-inline-image-wrapper='true'][data-inline-image-kind='middle'],[data-inline-video-wrapper='true']",
          ),
        );
        for (const wrapper of protectedWrappers) {
          if (range.intersectsNode(wrapper)) {
            e.preventDefault();
            return;
          }
        }
      } else {
        const { startContainer, startOffset } = range;
        if (startContainer.nodeType === Node.TEXT_NODE) {
          const textLength = startContainer.textContent?.length ?? 0;
          const parent = startContainer.parentNode;
          if (e.key === "Backspace" && startOffset === 0 && parent) {
            if (isProtectedWrapper(startContainer.previousSibling || parent.previousSibling)) {
              e.preventDefault();
              return;
            }
          }
          if (e.key === "Delete" && startOffset === textLength && parent) {
            if (isProtectedWrapper(startContainer.nextSibling || parent.nextSibling)) {
              e.preventDefault();
              return;
            }
          }
        } else if (startContainer.nodeType === Node.ELEMENT_NODE) {
          const container = startContainer as Element;
          const prevNode = startOffset > 0 ? container.childNodes[startOffset - 1] : null;
          const nextNode =
            startOffset < container.childNodes.length
              ? container.childNodes[startOffset]
              : null;
          if (e.key === "Backspace" && isProtectedWrapper(prevNode)) {
            e.preventDefault();
            return;
          }
          if (e.key === "Delete" && isProtectedWrapper(nextNode)) {
            e.preventDefault();
            return;
          }
        }
      }
    }

    if (e.key !== "Enter" || e.shiftKey) return;
    const editor = contentTextareaRefs.current[index];
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const node = selection.anchorNode;
    let current: Element | null =
      node?.nodeType === Node.ELEMENT_NODE
        ? (node as Element)
        : node?.parentElement || null;

    let quoteElement: Element | null = null;
    while (current && editor.contains(current)) {
      if (current.tagName.toLowerCase() === "blockquote") {
        quoteElement = current;
        break;
      }
      current = current.parentElement;
    }

    if (!quoteElement) return;

    // Keep existing quote unchanged; move caret to a new normal line after quote.
    e.preventDefault();
    const paragraph = document.createElement("p");
    paragraph.appendChild(document.createElement("br"));

    if (quoteElement.parentNode) {
      const nextSibling = quoteElement.nextSibling;
      if (nextSibling) {
        quoteElement.parentNode.insertBefore(paragraph, nextSibling);
      } else {
        quoteElement.parentNode.appendChild(paragraph);
      }
    } else {
      editor.appendChild(paragraph);
    }

    const selectionAfter = window.getSelection();
    if (selectionAfter) {
      const newRange = document.createRange();
      newRange.setStart(paragraph, 0);
      newRange.collapse(true);
      selectionAfter.removeAllRanges();
      selectionAfter.addRange(newRange);
    }

    requestAnimationFrame(() => {
      handleUpdateContentBlock(index, "paragraph", editor.innerHTML);
      syncActiveTextFormat(editor);
    });
  };

  const handleContentEditorClick = (
    index: number,
    e: React.SyntheticEvent<HTMLDivElement>,
  ) => {
    const target = e.target as HTMLElement;
    const removeBtn = target.closest("button[data-inline-remove-id]");
    if (removeBtn) {
      e.preventDefault();
      e.stopPropagation();
      const removeId = removeBtn.getAttribute("data-inline-remove-id");
      const wrapper = removeBtn.closest("[data-inline-image-wrapper='true']");
      if (wrapper) {
        removeInlineImageFromEditor(index, wrapper, removeId);
      }
      return;
    }
    const nameBtn = target.closest("button[data-inline-name-id]");
    if (nameBtn) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const removeVideoBtn = target.closest("button[data-inline-video-remove-id]");
    if (removeVideoBtn) {
      e.preventDefault();
      e.stopPropagation();
      const removeId = removeVideoBtn.getAttribute("data-inline-video-remove-id");
      const wrapper = removeVideoBtn.closest("[data-inline-video-wrapper='true']");
      if (wrapper) {
        removeInlineVideoFromEditor(index, wrapper, removeId);
      }
      return;
    }
    handleContentSelection(index, e);
  };

  const removeInlineImageFromEditor = (
    editorIndex: number,
    wrapper: Element,
    pendingId: string | null,
  ) => {
    const imageKind =
      wrapper.getAttribute("data-inline-image-kind") ||
      wrapper.querySelector("img")?.getAttribute("data-inline-image-kind") ||
      "middle";
    if (pendingId && inlinePendingImagesRef.current[pendingId]) {
      delete inlinePendingImagesRef.current[pendingId];
    } else {
      const img = wrapper.querySelector("img");
      const src = img?.getAttribute("src") || "";
      if (
        src &&
        !src.startsWith("blob:") &&
        !src.startsWith("data:") &&
        !src.startsWith("about:")
      ) {
        removedInlineImageUrlsRef.current.add(src);
      }
      if (imageKind === "end" && src) {
        setEndImages((prev) => {
          const idx = prev.findIndex((image) => image.url === src);
          if (idx === -1) return prev;
          const next = [...prev];
          next.splice(idx, 1);
          return next;
        });
      }
    }
    wrapper.remove();
    const editor = contentTextareaRefs.current[editorIndex];
    if (editor) {
      handleUpdateContentBlock(editorIndex, "paragraph", editor.innerHTML);
      requestAnimationFrame(() => {
        const refreshedEditor = contentTextareaRefs.current[editorIndex];
        if (!refreshedEditor) return;
        decorateInlineImagesInEditor(refreshedEditor, editorIndex);
      });
    }
  };

  const removeInlineVideoFromEditor = (
    editorIndex: number,
    wrapper: Element,
    pendingId: string | null,
  ) => {
    const video = wrapper.querySelector("video");
    const src = (video?.getAttribute("src") || "").trim();
    if (pendingId && inlinePendingVideosRef.current[pendingId]) {
      delete inlinePendingVideosRef.current[pendingId];
      setMiddleVideoPendingFile(null);
    } else if (
      src &&
      !src.startsWith("blob:") &&
      !src.startsWith("data:") &&
      !src.startsWith("about:")
    ) {
      removedInlineVideoUrlsRef.current.add(src);
    }
    // Inline video remove represents removing the middle video for this article.
    // Clear state unconditionally to avoid URL-variant mismatch issues.
    middleVideoRemovedFromParagraphRef.current = true;
    setMiddleVideoUrl(null);
    setMiddleVideoName(null);
    setMiddleVideoPendingFile(null);
    setMiddleVideoUrlInput("");
    wrapper.remove();
    const editor = contentTextareaRefs.current[editorIndex];
    if (editor) {
      handleUpdateContentBlock(editorIndex, "paragraph", editor.innerHTML);
      requestAnimationFrame(() => {
        const refreshedEditor = contentTextareaRefs.current[editorIndex];
        if (!refreshedEditor) return;
        decorateInlineImagesInEditor(refreshedEditor, editorIndex);
      });
    }
  };

  const sanitizePastedHtml = (html: string) => {
    if (!html.trim()) return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const root = doc.body.firstElementChild;
    if (!root) return html;

    const allowedTags = new Set([
      "b",
      "strong",
      "i",
      "em",
      "a",
      "h2",
      "blockquote",
      "p",
      "br",
    ]);

    const isSafeHref = (value: string) => {
      const href = value.trim().toLowerCase();
      return (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("/")
      );
    };

    const nodes = Array.from(root.querySelectorAll("*")).reverse();
    nodes.forEach((el) => {
      const tag = el.tagName.toLowerCase();

      if (!allowedTags.has(tag)) {
        if (tag === "img") {
          el.remove();
          return;
        }
        const parent = el.parentNode;
        if (!parent) return;
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
        return;
      }

      Array.from(el.attributes).forEach((attr) => {
        const attrName = attr.name.toLowerCase();
        if (tag === "a" && attrName === "href") return;
        el.removeAttribute(attr.name);
      });

      if (tag === "a") {
        const href = (el.getAttribute("href") || "").trim();
        if (!href || !isSafeHref(href)) {
          const parent = el.parentNode;
          if (!parent) return;
          while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
          }
          parent.removeChild(el);
          return;
        }
        el.setAttribute("href", href);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
    });

    return root.innerHTML;
  };

  const handleContentPaste = (
    index: number,
    e: React.ClipboardEvent<HTMLDivElement>,
  ) => {
    const clipboard = e.clipboardData;
    const html = clipboard.getData("text/html");
    const text = clipboard.getData("text/plain");
    if (!html && !text) return;

    e.preventDefault();
    if (html) {
      const cleanedHtml = sanitizePastedHtml(html);
      document.execCommand("insertHTML", false, cleanedHtml);
    } else {
      document.execCommand("insertText", false, text);
    }

    requestAnimationFrame(() => {
      const editor = contentTextareaRefs.current[index];
      if (!editor) return;
      decorateInlineImagesInEditor(editor, index);
      handleUpdateContentBlock(index, "paragraph", editor.innerHTML);
      handleContentSelection(index, {
        currentTarget: editor,
      } as React.SyntheticEvent<HTMLDivElement>);
    });
  };

  const attachInlineRemoveButtonHover = (
    wrapper: HTMLDivElement,
    actionsBar: HTMLDivElement,
  ) => {
    actionsBar.style.opacity = "0";
    actionsBar.style.transition = "opacity 150ms ease";
    wrapper.onmouseenter = () => {
      actionsBar.style.opacity = "1";
    };
    wrapper.onmouseleave = () => {
      actionsBar.style.opacity = "0";
    };
  };

  const createInlineImageActionsBar = (
    imageId: string,
    imageKind: "middle" | "end",
  ) => {
    const actionsBar = document.createElement("div");
    actionsBar.style.position = "absolute";
    actionsBar.style.top = "8px";
    actionsBar.style.right = "8px";
    actionsBar.style.display = "flex";
    actionsBar.style.gap = "6px";
    actionsBar.style.zIndex = "2";

    const nameBtn = document.createElement("button");
    nameBtn.type = "button";
    nameBtn.setAttribute("data-inline-name-id", imageId);
    nameBtn.textContent = "Image Name";
    nameBtn.style.border = "1px solid #e5e7eb";
    nameBtn.style.borderRadius = "6px";
    nameBtn.style.background = "#ffffff";
    nameBtn.style.color = "#374151";
    nameBtn.style.fontSize = "11px";
    nameBtn.style.fontWeight = "600";
    nameBtn.style.padding = "4px 8px";
    nameBtn.style.cursor = "pointer";
    actionsBar.appendChild(nameBtn);

    if (imageKind === "end") {
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.setAttribute("data-inline-remove-id", imageId);
      removeBtn.textContent = "Remove";
      removeBtn.style.border = "1px solid #e5e7eb";
      removeBtn.style.borderRadius = "6px";
      removeBtn.style.background = "#ffffff";
      removeBtn.style.color = "#ef4444";
      removeBtn.style.fontSize = "11px";
      removeBtn.style.fontWeight = "600";
      removeBtn.style.padding = "4px 8px";
      removeBtn.style.cursor = "pointer";
      actionsBar.appendChild(removeBtn);
    }
    return actionsBar;
  };

  const createInlineVideoActionsBar = (videoId: string) => {
    const actionsBar = document.createElement("div");
    actionsBar.style.position = "absolute";
    actionsBar.style.top = "8px";
    actionsBar.style.right = "8px";
    actionsBar.style.display = "flex";
    actionsBar.style.gap = "6px";
    actionsBar.style.zIndex = "2";

    const nameBtn = document.createElement("button");
    nameBtn.type = "button";
    nameBtn.setAttribute("data-inline-video-name-id", videoId);
    nameBtn.textContent = "Video Name";
    nameBtn.style.border = "1px solid #e5e7eb";
    nameBtn.style.borderRadius = "6px";
    nameBtn.style.background = "#ffffff";
    nameBtn.style.color = "#374151";
    nameBtn.style.fontSize = "11px";
    nameBtn.style.fontWeight = "600";
    nameBtn.style.padding = "4px 8px";
    nameBtn.style.cursor = "pointer";
    actionsBar.appendChild(nameBtn);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.setAttribute("data-inline-video-remove-id", videoId);
    removeBtn.textContent = "Remove";
    removeBtn.style.border = "1px solid #e5e7eb";
    removeBtn.style.borderRadius = "6px";
    removeBtn.style.background = "#ffffff";
    removeBtn.style.color = "#ef4444";
    removeBtn.style.fontSize = "11px";
    removeBtn.style.fontWeight = "600";
    removeBtn.style.padding = "4px 8px";
    removeBtn.style.cursor = "pointer";
    actionsBar.appendChild(removeBtn);

    return actionsBar;
  };

  const applyInlineImageWrapperStyle = (
    wrapper: HTMLDivElement,
    imageKind: "middle" | "end",
  ) => {
    wrapper.contentEditable = "false";
    wrapper.style.position = "relative";
    if (imageKind === "end") {
      // End images: responsive 3-up layout in editor preview.
      wrapper.style.display = "inline-block";
      wrapper.style.width = "calc((100% - 24px) / 3)";
      wrapper.style.maxWidth = "100%";
      wrapper.style.margin = "16px 8px 16px 0";
      wrapper.style.verticalAlign = "top";
    } else {
      wrapper.style.display = "block";
      wrapper.style.margin = "16px 0";
      wrapper.style.width = "100%";
      wrapper.style.maxWidth = "100%";
      wrapper.style.verticalAlign = "";
    }
  };

  const applyInlineImageElementStyle = (
    img: HTMLImageElement,
    imageKind: "middle" | "end",
  ) => {
    img.style.width = "100%";
    img.style.maxWidth = "100%";
    img.style.aspectRatio = "100 / 53";
    img.style.height = "auto";
    img.style.objectFit = "cover";
    img.style.borderRadius = "8px";
    img.style.display = "block";
  };

  const attachInlineImageActions = (
    wrapper: HTMLDivElement,
    editorIndex: number,
    imageId: string,
    imageKind: "middle" | "end",
  ) => {
    wrapper.querySelectorAll("[data-inline-actions='true']").forEach((node) => {
      node.remove();
    });
    const actionsBar = createInlineImageActionsBar(imageId, imageKind);
    const nameBtn = actionsBar.querySelector(
      "button[data-inline-name-id]",
    ) as HTMLButtonElement | null;
    if (nameBtn) {
      const runSetName = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        const img = wrapper.querySelector("img");
        if (!img) return;
        const src = img.getAttribute("src") || "";
        const currentName =
          img.getAttribute("data-inline-image-name") ||
          img.getAttribute("alt") ||
          "";
        const nextName = window.prompt("Image Name", currentName);
        if (nextName === null) return;
        const normalized = nextName.trim();
        if (normalized) {
          img.setAttribute("data-inline-image-name", normalized);
          img.setAttribute("alt", normalized);
          img.setAttribute("title", normalized);
        } else {
          img.removeAttribute("data-inline-image-name");
          img.setAttribute("alt", "Inline image");
          img.removeAttribute("title");
        }

        // Keep explicit React state in sync so PUT payload always carries latest names.
        if (imageKind === "middle") {
          setMiddleVideoName(normalized || null);
        } else if (imageKind === "end" && src) {
          setEndImages((prev) =>
            prev.map((item) =>
              item.url === src ? { ...item, name: normalized || null } : item,
            ),
          );
        }
        const editor = contentTextareaRefs.current[editorIndex];
        if (editor) {
          handleUpdateContentBlock(editorIndex, "paragraph", editor.innerHTML);
        }
      };
      nameBtn.addEventListener("mousedown", runSetName);
      nameBtn.addEventListener("click", runSetName);
    }
    const removeBtn = actionsBar.querySelector(
      "button[data-inline-remove-id]",
    ) as HTMLButtonElement | null;
    if (removeBtn) {
      const runRemove = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        removeInlineImageFromEditor(editorIndex, wrapper, imageId);
      };
      removeBtn.addEventListener("mousedown", runRemove);
      removeBtn.addEventListener("click", runRemove);
    }
    actionsBar.setAttribute("data-inline-actions", "true");
    attachInlineRemoveButtonHover(wrapper, actionsBar);
    wrapper.appendChild(actionsBar);
  };

  const attachInlineVideoActions = (
    wrapper: HTMLDivElement,
    editorIndex: number,
    videoId: string,
  ) => {
    wrapper.querySelectorAll("[data-inline-video-actions='true']").forEach((node) => {
      node.remove();
    });
    const actionsBar = createInlineVideoActionsBar(videoId);
    const nameBtn = actionsBar.querySelector(
      "button[data-inline-video-name-id]",
    ) as HTMLButtonElement | null;
    if (nameBtn) {
      const runSetName = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        const nextName = window.prompt("Video Name", middleVideoName || "");
        if (nextName === null) return;
        const normalized = nextName.trim();
        setMiddleVideoName(normalized || null);
        const editor = contentTextareaRefs.current[editorIndex];
        if (editor) {
          handleUpdateContentBlock(editorIndex, "paragraph", editor.innerHTML);
        }
      };
      nameBtn.addEventListener("mousedown", runSetName);
      nameBtn.addEventListener("click", runSetName);
    }
    const removeBtn = actionsBar.querySelector(
      "button[data-inline-video-remove-id]",
    ) as HTMLButtonElement | null;
    if (removeBtn) {
      const runRemove = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        removeInlineVideoFromEditor(editorIndex, wrapper, videoId);
      };
      removeBtn.addEventListener("mousedown", runRemove);
      removeBtn.addEventListener("click", runRemove);
    }
    actionsBar.setAttribute("data-inline-video-actions", "true");
    attachInlineRemoveButtonHover(wrapper, actionsBar);
    wrapper.appendChild(actionsBar);
  };

  const decorateInlineImagesInEditor = (
    editor: HTMLDivElement,
    editorIndex: number,
  ) => {
    const existingWrappers = Array.from(
      editor.querySelectorAll<HTMLDivElement>("[data-inline-image-wrapper='true']"),
    );
    for (const wrapper of existingWrappers) {
      const img = wrapper.querySelector("img");
      if (!img) continue;
      const imageId =
        wrapper.getAttribute("data-inline-image-id") ||
        img.getAttribute("data-inline-pending-id") ||
        `inline-existing-${Date.now()}-${inlinePendingImageCounterRef.current++}`;
      const src = img.getAttribute("src") || "";
      const pendingType = inlinePendingImagesRef.current[imageId]?.type;
      const knownEndImage = !!src && endImages.some((endImg) => endImg.url === src);
      const imageKind =
        (wrapper.getAttribute("data-inline-image-kind") as "middle" | "end" | null) ||
        (img.getAttribute("data-inline-image-kind") as "middle" | "end" | null) ||
        pendingType ||
        (knownEndImage ? "end" : "middle");

      wrapper.setAttribute("data-inline-image-id", imageId);
      wrapper.setAttribute("data-inline-image-kind", imageKind);
      img.setAttribute("data-inline-pending-id", imageId);
      img.setAttribute("data-inline-image-kind", imageKind);
      applyInlineImageWrapperStyle(wrapper, imageKind);
      applyInlineImageElementStyle(img, imageKind);

      attachInlineImageActions(wrapper, editorIndex, imageId, imageKind);
    }

    const images = Array.from(editor.querySelectorAll("img"));
    for (const img of images) {
      if (img.closest("[data-inline-image-wrapper='true']")) continue;

      const wrapper = document.createElement("div");
      const existingPendingId =
        img.getAttribute("data-inline-pending-id") ||
        `inline-existing-${Date.now()}-${inlinePendingImageCounterRef.current++}`;
      const src = img.getAttribute("src") || "";
      const pendingType = inlinePendingImagesRef.current[existingPendingId]?.type;
      const knownEndImage = !!src && endImages.some((endImg) => endImg.url === src);
      const imageKind = pendingType || (knownEndImage ? "end" : "middle");

      wrapper.setAttribute("data-inline-image", "true");
      wrapper.setAttribute("data-inline-image-wrapper", "true");
      wrapper.setAttribute("data-inline-image-id", existingPendingId);
      wrapper.setAttribute("data-inline-image-kind", imageKind);
      applyInlineImageWrapperStyle(wrapper, imageKind);
      img.setAttribute("data-inline-pending-id", existingPendingId);
      img.setAttribute("data-inline-image-kind", imageKind);
      applyInlineImageElementStyle(img, imageKind);

      const parent = img.parentNode;
      if (!parent) continue;
      parent.insertBefore(wrapper, img);
      wrapper.appendChild(img);

      attachInlineImageActions(
        wrapper,
        editorIndex,
        existingPendingId,
        imageKind,
      );
    }

    const existingVideoWrappers = Array.from(
      editor.querySelectorAll<HTMLDivElement>("[data-inline-video-wrapper='true']"),
    );
    for (const wrapper of existingVideoWrappers) {
      const video = wrapper.querySelector("video");
      if (!video) continue;
      const videoId =
        wrapper.getAttribute("data-inline-video-id") ||
        video.getAttribute("data-inline-pending-video-id") ||
        `inline-video-existing-${Date.now()}-${inlinePendingImageCounterRef.current++}`;
      wrapper.setAttribute("data-inline-video-wrapper", "true");
      wrapper.setAttribute("data-inline-video-id", videoId);
      video.setAttribute("data-inline-pending-video-id", videoId);
      wrapper.style.display = "block";
      wrapper.style.width = "100%";
      wrapper.style.maxWidth = "100%";
      wrapper.style.margin = "16px 0";
      wrapper.style.position = "relative";
      attachInlineVideoActions(wrapper, editorIndex, videoId);
    }

    const videos = Array.from(editor.querySelectorAll("video"));
    for (const video of videos) {
      if (video.closest("[data-inline-video-wrapper='true']")) continue;
      const wrapper = document.createElement("div");
      const videoId =
        video.getAttribute("data-inline-pending-video-id") ||
        `inline-video-existing-${Date.now()}-${inlinePendingImageCounterRef.current++}`;
      wrapper.setAttribute("data-inline-video-wrapper", "true");
      wrapper.setAttribute("data-inline-video-id", videoId);
      wrapper.style.display = "block";
      wrapper.style.width = "100%";
      wrapper.style.maxWidth = "100%";
      wrapper.style.margin = "16px 0";
      wrapper.style.position = "relative";
      video.setAttribute("data-inline-pending-video-id", videoId);
      const parent = video.parentNode;
      if (!parent) continue;
      parent.insertBefore(wrapper, video);
      wrapper.appendChild(video);
      attachInlineVideoActions(wrapper, editorIndex, videoId);
    }
  };

  const handleInlineImageButtonClick = (type: "middle" | "end") => {
    if (loading || inlineImageUploading || activeEditorBlockIndex === null) return;
    inlineImageInsertTypeRef.current = type;
    savedInlineImageBlockIndexRef.current =
      activeSelection?.blockIndex ?? activeEditorBlockIndex;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      savedInlineImageRangeRef.current = range.cloneRange();
    } else {
      savedInlineImageRangeRef.current = null;
    }
    if (inlineImageInputRef.current) {
      inlineImageInputRef.current.value = "";
      inlineImageInputRef.current.click();
    }
  };

  const handleInlineImageFileChange = async (file?: File) => {
    const blockIndex =
      savedInlineImageBlockIndexRef.current ??
      activeSelection?.blockIndex ??
      activeEditorBlockIndex;
    if (!file || blockIndex === null) return;
    try {
      setInlineImageUploading(true);
      setError(null);
      const pendingId = `inline-pending-${Date.now()}-${inlinePendingImageCounterRef.current++}`;
      inlinePendingImagesRef.current[pendingId] = {
        file,
        type: inlineImageInsertTypeRef.current,
      };
      const imageKind = inlineImageInsertTypeRef.current;
      const previewUrl = queuePreviewUrl(file);

      const editor = contentTextareaRefs.current[blockIndex];
      if (!editor) return;
      editor.focus();

      const selection = window.getSelection();
      const range = savedInlineImageRangeRef.current;
      const canInsertAtSavedRange =
        !!selection &&
        !!range &&
        editor.contains(range.commonAncestorContainer);

      if (selection && canInsertAtSavedRange && range) {
        const workingRange = range.cloneRange();
        workingRange.deleteContents();

        const wrapper = document.createElement("div");
        wrapper.setAttribute("data-inline-image", "true");
        wrapper.setAttribute("data-inline-image-wrapper", "true");
        wrapper.setAttribute("data-inline-image-id", pendingId);
        wrapper.setAttribute("data-inline-image-kind", imageKind);
        applyInlineImageWrapperStyle(wrapper, imageKind);

        const img = document.createElement("img");
        img.src = previewUrl;
        img.alt = file.name || "Inline image";
        img.setAttribute("data-inline-pending-id", pendingId);
        img.setAttribute("data-inline-image-kind", imageKind);
        applyInlineImageElementStyle(img, imageKind);
        wrapper.appendChild(img);
        attachInlineImageActions(wrapper, blockIndex, pendingId, imageKind);


        workingRange.insertNode(wrapper);
        const caretRange = document.createRange();
        if (imageKind === "end") {
          caretRange.setStartAfter(wrapper);
        } else {
          const spacer = document.createElement("br");
          workingRange.insertNode(spacer);
          caretRange.setStartAfter(spacer);
        }
        caretRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(caretRange);
      } else {
        // Fallback: append image at end if selection cannot be restored.
        const wrapper = document.createElement("div");
        wrapper.setAttribute("data-inline-image", "true");
        wrapper.setAttribute("data-inline-image-wrapper", "true");
        wrapper.setAttribute("data-inline-image-id", pendingId);
        wrapper.setAttribute("data-inline-image-kind", imageKind);
        applyInlineImageWrapperStyle(wrapper, imageKind);

        const img = document.createElement("img");
        img.src = previewUrl;
        img.alt = file.name || "Inline image";
        img.setAttribute("data-inline-pending-id", pendingId);
        img.setAttribute("data-inline-image-kind", imageKind);
        applyInlineImageElementStyle(img, imageKind);
        wrapper.appendChild(img);
        attachInlineImageActions(wrapper, blockIndex, pendingId, imageKind);


        editor.appendChild(wrapper);
        if (imageKind !== "end") {
          editor.appendChild(document.createElement("br"));
        }
      }

      handleUpdateContentBlock(blockIndex, "paragraph", editor.innerHTML);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to upload inline image";
      setError(errorMessage);
    } finally {
      setInlineImageUploading(false);
      savedInlineImageRangeRef.current = null;
      savedInlineImageBlockIndexRef.current = null;
      if (inlineImageInputRef.current) {
        inlineImageInputRef.current.value = "";
      }
    }
  };

  const applySelectionFormat = (
    type: "bold" | "italic" | "link" | "subtitle" | "quote",
  ) => {
    const blockIndex = activeSelection?.blockIndex ?? activeEditorBlockIndex;
    if (blockIndex === null) return;
    const selection = window.getSelection();

    const hasSelectionText =
      !!selection && selection.rangeCount > 0 && !selection.isCollapsed;

    const normalizeLinkUrl = (rawUrl: string) => {
      const trimmed = rawUrl.trim();
      if (!trimmed) return null;
      if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("mailto:") ||
        trimmed.startsWith("tel:") ||
        trimmed.startsWith("/")
      ) {
        return trimmed;
      }
      return `https://${trimmed}`;
    };

    switch (type) {
      case "bold":
        document.execCommand("bold");
        break;
      case "italic":
        document.execCommand("italic");
        break;
      case "link": {
        if (activeTextFormat.link) {
          document.execCommand("unlink");
          break;
        }
        if (!hasSelectionText) return;
        const inputUrl = window.prompt("Enter link URL", "https://example.com");
        if (!inputUrl) return;
        const url = normalizeLinkUrl(inputUrl);
        if (!url) return;
        document.execCommand("createLink", false, url);
        break;
      }
      case "subtitle":
        if (activeTextFormat.subtitle) {
          document.execCommand("formatBlock", false, "p");
        } else {
          document.execCommand("formatBlock", false, "h2");
        }
        break;
      case "quote":
        if (activeTextFormat.quote) {
          document.execCommand("formatBlock", false, "p");
          break;
        }
        if (!hasSelectionText) return;
        document.execCommand("formatBlock", false, "blockquote");
        break;
      default:
        break;
    }
    const editor = contentTextareaRefs.current[blockIndex];
    if (!editor) return;
    handleUpdateContentBlock(blockIndex, "paragraph", editor.innerHTML);
    requestAnimationFrame(() => {
      syncActiveTextFormat();
    });
  };

  const handleSelectCover = (cover: ContentCover) => {
    setCover(cover.image_url);
    setCoverName(null); // Don't auto-fill name, let user input it
    setCoverUrlInput(""); // Clear URL input when selecting from library
    setCoverPendingFile(null);
  };

  const handleSelectMiddleVideo = (video: ContentVideo) => {
    middleVideoRemovedFromParagraphRef.current = false;
    setMiddleVideoUrl(video.video_url);
    setMiddleVideoName(null); // Don't auto-fill name, let user input it
    setMiddleVideoUrlInput(""); // Clear URL input when selecting from library
    setMiddleVideoPendingFile(null);
  };

  const handleSelectEndImage = (image: ContentImage) => {
    if (endImages.length < 3) {
      setEndImages([...endImages, { url: image.image_url, name: null }]); // Don't auto-fill name, let user input it
      // Clear URL inputs when selecting from library
      setEndImageUrlInputs([""]);
      setEndImagePendingFiles([null, null, null]);
    }
  };

  const handleRemoveEndImage = (index: number) => {
    setEndImages(endImages.filter((_, i) => i !== index));
  };

  const handleCoverUrlChange = (url: string) => {
    setCoverUrlInput(url);
    if (url.trim()) {
      setCover(url.trim());
      setCoverPendingFile(null);
    }
  };

  const handleMiddleVideoUrlChange = (url: string) => {
    setMiddleVideoUrlInput(url);
    if (url.trim()) {
      middleVideoRemovedFromParagraphRef.current = false;
      setMiddleVideoUrl(url.trim());
      setMiddleVideoPendingFile(null);
    }
  };

  const handleAddEndImageUrl = () => {
    if (endImageUrlInputs.length < 3) {
      setEndImageUrlInputs([...endImageUrlInputs, ""]);
    }
  };

  const handleEndImageUrlChange = (index: number, url: string) => {
    const updated = [...endImageUrlInputs];
    updated[index] = url;
    setEndImageUrlInputs(updated);

    // Update endImages array based on URL inputs
    const validUrls = updated
      .filter((u) => u.trim() !== "")
      .map((u) => u.trim());
    setEndImages(validUrls.map((url) => ({ url, name: null })));
  };

  const handleRemoveEndImageUrl = (index: number) => {
    const updated = endImageUrlInputs.filter((_, i) => i !== index);
    setEndImageUrlInputs(updated);

    // Update endImages array based on remaining URL inputs
    const validUrls = updated
      .filter((u) => u.trim() !== "")
      .map((u) => u.trim());
    setEndImages(validUrls.map((url) => ({ url, name: null })));
  };

  const getUploadedImageUrl = (data: unknown): string | null => {
    if (!data) return null;
    if (Array.isArray(data)) {
      const first = data[0] as { image_url?: string } | undefined;
      return first?.image_url ?? null;
    }
    const single = data as { image_url?: string };
    return single.image_url ?? null;
  };

  const getUploadedVideoUrl = (data: unknown): string | null => {
    if (!data) return null;
    if (Array.isArray(data)) {
      const first = data[0] as { video_url?: string } | undefined;
      return first?.video_url ?? null;
    }
    const single = data as { video_url?: string };
    return single.video_url ?? null;
  };

  const collectInlineImageNames = (blocks: ContentBlock[]) => {
    const pendingNameById = new Map<string, string>();
    const nameByUrl = new Map<string, string>();
    for (const block of blocks) {
      if (!block?.paragraph) continue;
      const container = document.createElement("div");
      container.innerHTML = block.paragraph;
      const images = Array.from(container.querySelectorAll("img"));
      for (const image of images) {
        const rawName =
          image.getAttribute("data-inline-image-name") ||
          image.getAttribute("title") ||
          image.getAttribute("alt") ||
          "";
        const imageName = rawName.trim();
        if (!imageName || imageName.toLowerCase() === "inline image") continue;
        const pendingId = image.getAttribute("data-inline-pending-id");
        if (pendingId) {
          pendingNameById.set(pendingId, imageName);
        }
        const src = (image.getAttribute("src") || "").trim();
        if (
          src &&
          !src.startsWith("blob:") &&
          !src.startsWith("data:") &&
          !src.startsWith("about:")
        ) {
          nameByUrl.set(src, imageName);
        }
      }
    }
    return { pendingNameById, nameByUrl };
  };

  const extractImageUrlsFromBlocks = (blocks: ContentBlock[]): Set<string> => {
    const urls = new Set<string>();
    for (const block of blocks) {
      if (!block?.paragraph) continue;
      const matches = block.paragraph.matchAll(/<img[^>]*src="([^"]+)"/g);
      for (const match of matches) {
        const src = match[1]?.trim();
        if (!src) continue;
        if (
          src.startsWith("blob:") ||
          src.startsWith("data:") ||
          src.startsWith("about:")
        ) {
          continue;
        }
        urls.add(src);
      }
    }
    return urls;
  };

  const handleSelectCoverFile = (file?: File) => {
    if (!file) return;
    if (file.size > MAX_THUMBNAIL_FILE_SIZE_BYTES) {
      setError("Thumbnail image must be less than or equal to 5MB.");
      return;
    }
    setCoverPendingFile(file);
    setCover(queuePreviewUrl(file));
    setCoverUrlInput("");
  };

  const handleSelectMiddleVideoFile = (file?: File) => {
    if (!file) return;
    if (file.size > MAX_MIDDLE_VIDEO_FILE_SIZE_BYTES) {
      setError("Middle video must be less than or equal to 100MB.");
      return;
    }
    const blockIndex =
      savedInlineImageBlockIndexRef.current ??
      activeSelection?.blockIndex ??
      activeEditorBlockIndex;
    if (blockIndex === null) {
      setError("Select a content position before adding Mid Video.");
      return;
    }

    const previewUrl = queuePreviewUrl(file);
    const pendingId = `inline-video-pending-${Date.now()}-${inlinePendingImageCounterRef.current++}`;
    inlinePendingVideosRef.current[pendingId] = { file };
    middleVideoRemovedFromParagraphRef.current = false;
    setMiddleVideoPendingFile(file);
    setMiddleVideoUrl(previewUrl);
    setMiddleVideoName(file.name || null);
    setMiddleVideoUrlInput("");

    const editor = contentTextareaRefs.current[blockIndex];
    if (!editor) return;
    editor.focus();

    const selection = window.getSelection();
    const range = savedInlineImageRangeRef.current;
    const canInsertAtSavedRange =
      !!selection &&
      !!range &&
      editor.contains(range.commonAncestorContainer);

    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-inline-video-wrapper", "true");
    wrapper.setAttribute("data-inline-video-id", pendingId);
    wrapper.style.display = "block";
    wrapper.style.width = "100%";
    wrapper.style.maxWidth = "100%";
    wrapper.style.margin = "16px 0";
    wrapper.style.position = "relative";

    const video = document.createElement("video");
    video.setAttribute("src", previewUrl);
    video.setAttribute("controls", "true");
    video.setAttribute("playsinline", "true");
    video.setAttribute("preload", "metadata");
    video.setAttribute("data-inline-pending-video-id", pendingId);
    video.style.width = "100%";
    video.style.maxWidth = "100%";
    video.style.aspectRatio = "100 / 53";
    video.style.height = "auto";
    video.style.objectFit = "cover";
    video.style.borderRadius = "8px";
    video.style.display = "block";
    wrapper.appendChild(video);
    attachInlineVideoActions(wrapper, blockIndex, pendingId);

    if (selection && canInsertAtSavedRange && range) {
      const workingRange = range.cloneRange();
      workingRange.deleteContents();
      workingRange.insertNode(wrapper);
      const spacer = document.createElement("br");
      workingRange.insertNode(spacer);
      const caretRange = document.createRange();
      caretRange.setStartAfter(spacer);
      caretRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(caretRange);
    } else {
      editor.appendChild(wrapper);
      editor.appendChild(document.createElement("br"));
    }

    handleUpdateContentBlock(blockIndex, "paragraph", editor.innerHTML);
    savedInlineImageRangeRef.current = null;
    savedInlineImageBlockIndexRef.current = null;
    if (middleVideoFileInputRef.current) {
      middleVideoFileInputRef.current.value = "";
    }
  };

  const handleSelectEndImageFile = (slot: number, file?: File) => {
    if (!file) return;
    if (file.size > MAX_CONTENT_IMAGE_FILE_SIZE_BYTES) {
      setError("Each end image must be less than or equal to 20MB.");
      return;
    }
    setEndImagePendingFiles((prev) => {
      const next = [...prev];
      next[slot] = file;
      return next;
    });
    setEndImages((prev) => {
      const next = [...prev];
      next[slot] = { url: queuePreviewUrl(file), name: next[slot]?.name ?? null };
      return next;
    });
  };

  const deleteCoverByUrlIfPresent = async (url: string) => {
    const res = await getContentCovers();
    const found = res.data.find((c) => c.image_url === url);
    if (found) {
      await deleteContentCover(found.id);
    }
  };

  const normalizeMediaUrlKey = (rawUrl: string) => {
    const value = (rawUrl || "").trim();
    if (!value) return "";
    try {
      const parsed = new URL(value);
      const path = decodeURIComponent(parsed.pathname || "");
      const filename = path.split("/").filter(Boolean).pop() || path;
      return filename.toLowerCase();
    } catch {
      const noQuery = decodeURIComponent(value.split("?")[0].split("#")[0] || "");
      const filename = noQuery.split("/").filter(Boolean).pop() || noQuery;
      return filename.toLowerCase();
    }
  };

  const deleteImageByUrlIfPresent = async (url: string): Promise<boolean> => {
    const res = await getContentImages();
    const targetKey = normalizeMediaUrlKey(url);
    const targetOriginalName = decodeURIComponent(
      (url || "").split("?")[0].split("#")[0] || "",
    )
      .split("/")
      .filter(Boolean)
      .pop()
      ?.toLowerCase();
    const found = res.data.find((c) => {
      if (c.image_url === url) return true;
      if (normalizeMediaUrlKey(c.image_url) === targetKey) return true;
      return (
        !!targetOriginalName &&
        (c.original_name || "").toLowerCase() === targetOriginalName
      );
    });
    if (found) {
      await deleteContentImage(found.id);
      return true;
    }
    return false;
  };

  const deleteVideoByUrlIfPresent = async (url: string): Promise<boolean> => {
    const res = await getContentVideos();
    const targetKey = normalizeMediaUrlKey(url);
    const targetOriginalName = decodeURIComponent(
      (url || "").split("?")[0].split("#")[0] || "",
    )
      .split("/")
      .filter(Boolean)
      .pop()
      ?.toLowerCase();
    const found = res.data.find((c) => {
      if (c.video_url === url) return true;
      if (normalizeMediaUrlKey(c.video_url) === targetKey) return true;
      return (
        !!targetOriginalName &&
        (c.original_name || "").toLowerCase() === targetOriginalName
      );
    });
    if (found) {
      await deleteContentVideo(found.id);
      return true;
    }
    return false;
  };

  const handleRemoveTtsAudio = async () => {
    if (!ttsAudioUrl) return;
    try {
      setTtsRemoving(true);
      setError(null);
      await deleteArticleTtsAudio(ttsAudioUrl);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove audio from storage";
      setError(message);
      return;
    } finally {
      setTtsRemoving(false);
    }
    setTtsAudioUrl(null);
    setTtsAudioName(null);
  };

  const handleConvertTextToSpeech = async () => {
    const text = ttsPlainInput.trim();
    if (text.length < 10) {
      setError("Enter at least 10 characters of plain text to convert (API limit).");
      return;
    }
    if (text.length > 5000) {
      setError("Text must be 5000 characters or fewer.");
      return;
    }
    try {
      setTtsConverting(true);
      setError(null);
      if (ttsAudioUrl && isPendingTtsUrl(ttsAudioUrl)) {
        try {
          await deleteArticleTtsAudio(ttsAudioUrl);
        } catch (e) {
          console.error("Failed to remove previous preview TTS:", e);
        }
      }
      const response = await convertArticleToSpeech({
        text,
        articleId: news?.id,
        title: title.trim() || undefined,
      });
      const audioUrl =
        response.data?.tts_audio_url ||
        response.data?.audio_url ||
        response.tts_audio_url ||
        response.audio_url ||
        null;
      const audioName =
        response.data?.tts_audio_name ||
        response.data?.audio_name ||
        response.tts_audio_name ||
        response.audio_name ||
        null;
      if (!audioUrl) {
        throw new Error("TTS conversion succeeded but no audio URL was returned");
      }
      setTtsAudioUrl(audioUrl);
      setTtsAudioName(audioName);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to convert article to speech";
      setError(message);
    } finally {
      setTtsConverting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!author.trim()) {
      setError("Author is required");
      return;
    }

    // Validate content blocks
    const validBlocks = contentBlocks.filter((block) => block.paragraph.trim());
    if (validBlocks.length === 0) {
      setError("At least one content block with paragraph is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Upload pending files ONLY when saving.
      let finalCover = cover;
      const finalCoverName = (coverName || "").trim() || null;
      let finalMiddleVideoUrl = middleVideoUrl;
      let finalMiddleVideoName = middleVideoName;
      let finalEndImages: Array<EndImage | null> = [
        endImages[0] ?? null,
        endImages[1] ?? null,
        endImages[2] ?? null,
      ];
      const inlineImageNames = collectInlineImageNames(validBlocks);
      const hasInlinePendingVideo = validBlocks.some((block) =>
        /data-inline-pending-video-id="([^"]+)"/.test(block.paragraph || ""),
      );

      if (coverPendingFile) {
        setCoverUploading(true);
        const res = await uploadContentCover({ image: coverPendingFile });
        const imageUrl = getUploadedImageUrl(res.data);
        if (!imageUrl) throw new Error("Cover upload succeeded but URL missing");
        finalCover = imageUrl;
      }

      if (middleVideoPendingFile && !hasInlinePendingVideo) {
        setMiddleVideoUploading(true);
        const res = await uploadContentVideo({ video: middleVideoPendingFile });
        const videoUrl = getUploadedVideoUrl(res.data);
        if (!videoUrl) {
          throw new Error("Middle video upload succeeded but URL missing");
        }
        finalMiddleVideoUrl = videoUrl;
      }

      for (let i = 0; i < 3; i++) {
        const file = endImagePendingFiles[i];
        if (!file) continue;
        setEndImageUploadingIndex(i);
        const res = await uploadContentImage({ image: file });
        const imageUrl = getUploadedImageUrl(res.data);
        if (!imageUrl) throw new Error("End image upload succeeded but URL missing");
        finalEndImages[i] = { url: imageUrl, name: finalEndImages[i]?.name ?? null };
      }

      if (middleVideoRemovedFromParagraphRef.current) {
        finalMiddleVideoUrl = null;
        finalMiddleVideoName = null;
      }

      // Do not clear middle/end image slots by checking paragraph HTML.
      // End images are managed in the dedicated Image section and may not appear inline.

      // Upload inline pending images only on save, then replace temporary preview URLs.
      const pendingInlineIds: string[] = [];
      const seenInlineIds = new Set<string>();
      const pendingInlineVideoIds: string[] = [];
      const seenInlineVideoIds = new Set<string>();
      for (const block of validBlocks) {
        const matches = block.paragraph.matchAll(/data-inline-pending-id="([^"]+)"/g);
        for (const match of matches) {
          const id = match[1];
          if (!id || seenInlineIds.has(id)) continue;
          seenInlineIds.add(id);
          pendingInlineIds.push(id);
        }
        const videoMatches = block.paragraph.matchAll(
          /data-inline-pending-video-id="([^"]+)"/g,
        );
        for (const match of videoMatches) {
          const id = match[1];
          if (!id || seenInlineVideoIds.has(id)) continue;
          seenInlineVideoIds.add(id);
          pendingInlineVideoIds.push(id);
        }
      }

      const inlineUploadMap: Record<string, { url: string; name: string | null }> = {};
      for (const pendingId of pendingInlineIds) {
        const pending = inlinePendingImagesRef.current[pendingId];
        if (!pending?.file) continue;
        setInlineImageUploading(true);
        const res = await uploadContentImage({ image: pending.file });
        const uploaded = Array.isArray(res.data) ? res.data[0] : res.data;
        const uploadedUrl = uploaded?.image_url;
        if (!uploadedUrl) {
          throw new Error("Inline image upload succeeded but URL missing");
        }
        const uploadedName =
          (typeof uploaded?.title === "string" && uploaded.title.trim()) || null;
        const customName = inlineImageNames.pendingNameById.get(pendingId) || null;
        const finalInlineName = customName || uploadedName;
        inlineUploadMap[pendingId] = { url: uploadedUrl, name: finalInlineName };

        // Keep backend compatibility: map first image to middle, next up to 3 to end_images.
        if (pending.type === "middle") {
          finalMiddleVideoUrl = uploadedUrl;
          finalMiddleVideoName = finalInlineName;
        } else {
          const emptySlot = finalEndImages.findIndex((img) => !img?.url);
          if (emptySlot === -1) {
            throw new Error(
              "Maximum 5 images reached total (Thumbnail + 1 Middle Video + 3 End Images).",
            );
          }
          finalEndImages[emptySlot] = { url: uploadedUrl, name: finalInlineName };
        }

      }
      const inlineVideoUploadMap: Record<
        string,
        { url: string; name: string | null }
      > = {};
      for (const pendingId of pendingInlineVideoIds) {
        const pending = inlinePendingVideosRef.current[pendingId];
        if (!pending?.file) continue;
        setMiddleVideoUploading(true);
        const res = await uploadContentVideo({ video: pending.file });
        const uploaded = Array.isArray(res.data) ? res.data[0] : res.data;
        const uploadedUrl = uploaded?.video_url;
        if (!uploadedUrl) {
          throw new Error("Inline video upload succeeded but URL missing");
        }
        const uploadedName =
          (typeof uploaded?.title === "string" && uploaded.title.trim()) || null;
        inlineVideoUploadMap[pendingId] = { url: uploadedUrl, name: uploadedName };
        finalMiddleVideoUrl = uploadedUrl;
        finalMiddleVideoName = uploadedName || finalMiddleVideoName;
      }

      if (
        finalMiddleVideoUrl &&
        inlineImageNames.nameByUrl.has(finalMiddleVideoUrl)
      ) {
        finalMiddleVideoName =
          inlineImageNames.nameByUrl.get(finalMiddleVideoUrl) || null;
      }
      finalEndImages = finalEndImages.map((img) => {
        if (!img?.url) return img;
        const overrideName = inlineImageNames.nameByUrl.get(img.url);
        if (!overrideName) return img;
        return { ...img, name: overrideName };
      });

      const processedBlocks = validBlocks.map((block) => {
        const container = document.createElement("div");
        container.innerHTML = block.paragraph;

        container
          .querySelectorAll("button[data-inline-remove-id],button[data-inline-name-id]")
          .forEach((btn) => btn.remove());

        container
          .querySelectorAll("img[data-inline-pending-id]")
          .forEach((imgNode) => {
            const id = imgNode.getAttribute("data-inline-pending-id");
            if (id && inlineUploadMap[id]) {
              imgNode.setAttribute("src", inlineUploadMap[id].url);
              const currentAlt = (imgNode.getAttribute("alt") || "").trim().toLowerCase();
              const shouldReplaceAlt =
                !currentAlt ||
                currentAlt === "inline image" ||
                currentAlt === "article image";
              if (shouldReplaceAlt) {
                imgNode.setAttribute(
                  "alt",
                  inlineUploadMap[id].name || "Inline image",
                );
              }
              if (inlineUploadMap[id].name) {
                imgNode.setAttribute("title", inlineUploadMap[id].name);
              }
            }
            imgNode.removeAttribute("data-inline-pending-id");
          });
        container
          .querySelectorAll("video[data-inline-pending-video-id]")
          .forEach((videoNode) => {
            const id = videoNode.getAttribute("data-inline-pending-video-id");
            if (id && inlineVideoUploadMap[id]) {
              videoNode.setAttribute("src", inlineVideoUploadMap[id].url);
              videoNode.setAttribute("controls", "true");
              videoNode.setAttribute("playsinline", "true");
              videoNode.setAttribute("preload", "metadata");
            }
            videoNode.removeAttribute("data-inline-pending-video-id");
          });

        container
          .querySelectorAll("[data-inline-image-wrapper='true']")
          .forEach((wrapper) => {
            const imgNode = wrapper.querySelector("img");
            if (imgNode) {
              wrapper.replaceWith(imgNode);
            } else {
              wrapper.remove();
            }
          });
        container
          .querySelectorAll("[data-inline-video-wrapper='true']")
          .forEach((wrapper) => {
            const videoNode = wrapper.querySelector("video");
            if (videoNode) {
              wrapper.replaceWith(videoNode);
            } else {
              wrapper.remove();
            }
          });

        container
          .querySelectorAll(
            "[data-inline-image],[data-inline-image-id],[data-inline-image-kind],[data-inline-image-name],[data-inline-video-wrapper],[data-inline-video-id]",
          )
          .forEach((el) => {
            el.removeAttribute("data-inline-image");
            el.removeAttribute("data-inline-image-id");
            el.removeAttribute("data-inline-image-kind");
            el.removeAttribute("data-inline-image-name");
            el.removeAttribute("data-inline-video-wrapper");
            el.removeAttribute("data-inline-video-id");
          });

        return {
          ...block,
          paragraph: container.innerHTML,
        };
      });

      const endImageUrlsToStrip = new Set(
        finalEndImages
          .filter((img): img is EndImage => !!img?.url)
          .map((img) => img.url),
      );
      const contentBlocksWithoutEndImages = processedBlocks.map((block) => {
        const container = document.createElement("div");
        container.innerHTML = block.paragraph;
        container.querySelectorAll("img").forEach((imgNode) => {
          const src = (imgNode.getAttribute("src") || "").trim();
          if (src && endImageUrlsToStrip.has(src)) {
            imgNode.remove();
          }
        });
        return {
          ...block,
          paragraph: container.innerHTML,
        };
      });

      // Compute removed media URLs by set-diff to avoid accidental bulk deletes.
      const removedMediaUrls = new Set<string>();
      if (news) {
        const oldMiddle = originalMiddleVideoUrlRef.current;
        const nextMiddle = finalMiddleVideoUrl ?? null;
        if (oldMiddle && oldMiddle !== nextMiddle) {
          removedMediaUrls.add(oldMiddle);
        }

        const oldEndUrls = new Set(
          originalEndImageUrlsRef.current.filter(
            (u): u is string => typeof u === "string" && u.length > 0,
          ),
        );
        const nextEndUrls = new Set(
          finalEndImages
            .filter((img): img is EndImage => !!img?.url)
            .map((img) => img.url),
        );
        for (const oldUrl of oldEndUrls) {
          if (!nextEndUrls.has(oldUrl)) {
            removedMediaUrls.add(oldUrl);
          }
        }
      }

      const params: any = {
        category_id: categoryId || null,
        author: author.trim(),
        title: title.trim(),
        cover: finalCover,
        cover_name: finalCoverName,
        subtitle: null,
        // date_time_post will be auto-set by backend
        content_blocks: contentBlocksWithoutEndImages,
        // Always send end_images explicitly so backend can clear removed slots.
        end_images: finalEndImages.filter((img): img is EndImage => !!img?.url),
      };

      // For articles: only send middle_video_url, don't send middle_video_url at all
      // Backend will automatically clear middle_video_url when middle_video_url is present
      if (finalMiddleVideoUrl) {
        params.middle_video_url = finalMiddleVideoUrl;
        params.middle_video_name = finalMiddleVideoName;
      } else {
        // If no image, set to null to clear it
        params.middle_video_url = null;
        params.middle_video_name = null;
      }
      params.tts_audio_url = ttsAudioUrl;
      params.tts_audio_name = ttsAudioName;
      {
        const trimmedTtsText = ttsPlainInput.trim();
        params.tts_source_text = ttsAudioUrl
          ? trimmedTtsText.length > 0
            ? trimmedTtsText
            : null
          : null;
      }
      // Do NOT include middle_video_url or middle_video_name in the request

      if (news) {
        await updateAdminVideo(news.id, params);
      } else {
        await createAdminVideo(params);
      }

      // Delete removed inline images from storage only after successful save.
      const removedInlineUrls = new Set<string>(removedInlineImageUrlsRef.current);
      if (news?.content_blocks) {
        const oldInlineUrls = extractImageUrlsFromBlocks(news.content_blocks);
        const newInlineUrls = extractImageUrlsFromBlocks(contentBlocksWithoutEndImages);
        for (const oldUrl of oldInlineUrls) {
          if (!newInlineUrls.has(oldUrl)) {
            removedInlineUrls.add(oldUrl);
          }
        }
      }
      // Protect media that are still referenced by article fields.
      const retainedMediaUrls = new Set<string>();
      if (finalCover) retainedMediaUrls.add(finalCover);
      if (finalMiddleVideoUrl) retainedMediaUrls.add(finalMiddleVideoUrl);
      finalEndImages
        .filter((img): img is EndImage => !!img?.url)
        .forEach((img) => retainedMediaUrls.add(img.url));
      for (const keptUrl of retainedMediaUrls) {
        removedInlineUrls.delete(keptUrl);
      }
      const failedStorageDeletes: string[] = [];
      for (const removedUrl of removedInlineUrls) {
        try {
          const deleted = await deleteImageByUrlIfPresent(removedUrl);
          if (!deleted) failedStorageDeletes.push(removedUrl);
        } catch (deleteErr) {
          console.error("Failed to delete removed inline image:", removedUrl, deleteErr);
          failedStorageDeletes.push(removedUrl);
        }
      }

      // Delete removed inline videos from storage only after successful save.
      const removedInlineVideoUrls = new Set<string>(removedInlineVideoUrlsRef.current);
      if (news?.content_blocks) {
        const oldInlineVideoUrls = new Set<string>();
        for (const block of news.content_blocks) {
          for (const match of (block.paragraph || "").matchAll(
            /<video[^>]*src="([^"]+)"/g,
          )) {
            const src = (match[1] || "").trim();
            if (!src) continue;
            oldInlineVideoUrls.add(src);
          }
        }
        const newInlineVideoUrls = new Set<string>();
        for (const block of contentBlocksWithoutEndImages) {
          for (const match of (block.paragraph || "").matchAll(
            /<video[^>]*src="([^"]+)"/g,
          )) {
            const src = (match[1] || "").trim();
            if (!src) continue;
            newInlineVideoUrls.add(src);
          }
        }
        for (const oldUrl of oldInlineVideoUrls) {
          if (!newInlineVideoUrls.has(oldUrl)) {
            removedInlineVideoUrls.add(oldUrl);
          }
        }
      }
      for (const keptUrl of retainedMediaUrls) {
        removedInlineVideoUrls.delete(keptUrl);
      }
      for (const removedUrl of removedInlineVideoUrls) {
        try {
          const deleted = await deleteVideoByUrlIfPresent(removedUrl);
          if (!deleted) failedStorageDeletes.push(removedUrl);
        } catch (deleteErr) {
          console.error("Failed to delete removed inline video:", removedUrl, deleteErr);
          failedStorageDeletes.push(removedUrl);
        }
      }

      // Delete removed middle/end images from storage only after successful save.
      for (const removedUrl of removedMediaUrls) {
        try {
          const deletedVideo = await deleteVideoByUrlIfPresent(removedUrl);
          if (deletedVideo) continue;
          try {
            const deletedImage = await deleteImageByUrlIfPresent(removedUrl);
            if (!deletedImage) failedStorageDeletes.push(removedUrl);
          } catch (imageDeleteErr) {
            console.error("Failed to delete removed middle/end image:", removedUrl, imageDeleteErr);
            failedStorageDeletes.push(removedUrl);
          }
        } catch (videoDeleteErr) {
          console.error("Failed to delete removed middle/end video:", removedUrl, videoDeleteErr);
          failedStorageDeletes.push(removedUrl);
        }
      }

      if (failedStorageDeletes.length > 0) {
        const uniqueFailed = Array.from(new Set(failedStorageDeletes));
        setError(
          `Saved successfully, but failed to remove ${uniqueFailed.length} media file(s) from storage/library.`,
        );
      }

      await Promise.resolve(onSuccess());
      inlinePendingImagesRef.current = {};
      inlinePendingVideosRef.current = {};
      removedInlineImageUrlsRef.current = new Set();
      removedInlineVideoUrlsRef.current = new Set();
      middleVideoRemovedFromParagraphRef.current = false;
      draftBaselineRef.current = buildDraftSignature({
        categoryId: categoryId || null,
        author: author.trim(),
        title: title.trim(),
        cover: finalCover,
        coverName: finalCoverName,
        subtitle: "",
        contentBlocks: contentBlocksWithoutEndImages,
        middleVideoUrl: finalMiddleVideoUrl,
        middleVideoName: finalMiddleVideoName,
        ttsAudioUrl,
        ttsAudioName,
        ttsSourceText: ttsPlainInput,
        endImages: finalEndImages.filter((img): img is EndImage => !!img?.url),
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save article";
      setError(errorMessage);
    } finally {
      setCoverUploading(false);
      setMiddleVideoUploading(false);
      setEndImageUploadingIndex(null);
      setInlineImageUploading(false);
      setLoading(false);
    }
  };

  // Flatten categories for dropdown (main categories and subcategories)
  const allCategories: Array<{ id: number; name: string; isSub: boolean }> = [];
  categories.forEach((cat) => {
    allCategories.push({ id: cat.id, name: cat.name, isSub: false });
    cat.subcategories.forEach((sub) => {
      allCategories.push({ id: sub.id, name: `  ${sub.name}`, isSub: true });
    });
  });
  const selectedCategoryName =
    allCategories.find((cat) => cat.id === categoryId)?.name ?? "Select category";

  if (!isOpen) return null;

  return (
    <>
      {!asPage && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          onClick={requestCloseEditor}
        />
      )}
      <div
        className={
          asPage
            ? "relative"
            : "fixed inset-0 z-50 flex items-center justify-center p-4"
        }
    >
        <div
          className={
            asPage
              ? "bg-[#f7f7f7] w-full min-h-screen"
              : "bg-[#f7f7f7] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          }
          onClick={(e) => e.stopPropagation()}
      >
          <div className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-gray-200 bg-[#f7f7f7]/98">
            <h2 className="text-xl font-semibold text-gray-900">
              {news ? "Edit" : "Create"} Video Article
            </h2>
            {asPage && (
              <div className="flex items-center gap-2">
                <input
                  ref={inlineImageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => handleInlineImageFileChange(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (
                      loading ||
                      middleVideoUploading ||
                      activeEditorBlockIndex === null
                    )
                      return;
                    savedInlineImageBlockIndexRef.current =
                      activeSelection?.blockIndex ?? activeEditorBlockIndex;
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                      const range = selection.getRangeAt(0);
                      savedInlineImageRangeRef.current = range.cloneRange();
                    } else {
                      savedInlineImageRangeRef.current = null;
                    }
                    const input = middleVideoFileInputRef.current;
                    if (!input) return;
                    input.value = "";
                    input.click();
                  }}
                  disabled={
                    loading || middleVideoUploading || activeEditorBlockIndex === null
                  }
                  className="cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {middleVideoUploading ? "Adding..." : "Mid Video"}
                </button>
                <input
                  ref={middleVideoFileInputRef}
                  type="file"
                  accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm"
                  className="hidden"
                  onChange={(e) => handleSelectMiddleVideoFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleInlineImageButtonClick("end")}
                  disabled={loading || inlineImageUploading || activeEditorBlockIndex === null}
                  className="cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {inlineImageUploading ? "Adding..." : "End Image"}
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySelectionFormat("quote")}
                  disabled={loading || activeEditorBlockIndex === null}
                  className={`cursor-pointer rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    activeTextFormat.quote
                      ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Quote
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySelectionFormat("subtitle")}
                  disabled={loading || activeEditorBlockIndex === null}
                  className={`cursor-pointer rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    activeTextFormat.subtitle
                      ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Subtitle
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySelectionFormat("link")}
                  disabled={loading || activeEditorBlockIndex === null}
                  className={`cursor-pointer rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    activeTextFormat.link
                      ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Link
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySelectionFormat("italic")}
                  disabled={loading || activeEditorBlockIndex === null}
                  className="cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium italic text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  i
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySelectionFormat("bold")}
                  disabled={loading || activeEditorBlockIndex === null}
                  className={`cursor-pointer rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    activeTextFormat.bold
                      ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={handleConvertTextToSpeech}
                  disabled={
                    loading ||
                    ttsConverting ||
                    ttsRemoving ||
                    ttsPlainInput.trim().length < 10 ||
                    ttsPlainInput.trim().length > 5000
                  }
                  className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {ttsConverting ? "Converting..." : "Convert"}
                </button>
                <button
                  type="button"
                  onClick={requestCloseEditor}
                  disabled={loading || ttsConverting || ttsRemoving}
                  className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="article-editor-form"
                  disabled={
                    loading ||
                    ttsConverting ||
                    ttsRemoving ||
                    !author.trim() ||
                    !categoryId
                  }
                  className="cursor-pointer rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            )}
            {!asPage && (
              <button
                onClick={requestCloseEditor}
                disabled={loading || ttsConverting || ttsRemoving}
                className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
                <X size={20} />
              </button>
            )}
          </div>

          <form
            id="article-editor-form"
            onSubmit={handleSubmit}
            className={
              asPage
                ? "mx-auto w-full max-w-[980px] px-6 md:px-10 py-8 grid grid-cols-1 gap-8"
                : "p-6 grid grid-cols-1 gap-6"
            }
        >
            {/* Left column: keep Details + Content Blocks together */}
            <div className="min-w-0 space-y-6">
              {/* Basic Information Section */}
              <div className="order-2 space-y-4 min-w-0">
              {!asPage && (
                <div className="flex items-center gap-2 pb-2 border-b-2 border-gray-200">
                  <div className="w-1 h-6 bg-blue-600 rounded"></div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Details
                  </h3>
                </div>
              )}

              {asPage && (
                <div className="relative flex items-center gap-2 text-gray-500">
                  {!cover && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (loading || coverUploading) return;
                          const input = coverFileInputRef.current;
                          if (!input) return;
                          input.value = "";
                          input.click();
                        }}
                        className="cursor-pointer h-8 w-[140px] rounded-md border-0 bg-[#f7f7f7] px-0 text-[14px] font-medium text-gray-500 outline-none ring-0 transition-colors hover:bg-[#ececec] hover:text-gray-700 focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                        disabled={loading || coverUploading}
                        aria-label="Add thumbnail"
                      >
                        <span className="inline-flex h-full w-full items-center justify-center gap-1.5 leading-none">
                          <ImageIcon className="h-[13px] w-[13px] shrink-0" />
                          <span className="leading-none pt-1">Add thumbnail</span>
                        </span>
                      </button>
                      <input
                        ref={coverFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="sr-only"
                        onChange={(e) => handleSelectCoverFile(e.target.files?.[0])}
                      />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCategorySelector((prev) => !prev)}
                    className="pt-1 cursor-pointer h-8 rounded-md border-0 bg-[#f7f7f7] px-3 text-[14px] font-medium text-gray-500 outline-none ring-0 transition-colors hover:bg-[#ececec] hover:text-gray-700"
                    disabled={loading}
                  >
                    Category: {selectedCategoryName.trim()}
                  </button>
                  {showCategorySelector && (
                    <div className="absolute top-10 left-0 z-20 max-h-64 w-[260px] overflow-y-auto rounded-md border border-gray-200 bg-white p-1 shadow-sm">
                      {allCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategoryId(cat.id);
                            setShowCategorySelector(false);
                          }}
                          className={`w-full cursor-pointer rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100 ${
                            categoryId === cat.id
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700"
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Title - Full Width */}
              {asPage && (
                <div className="w-full max-w-[860px] border-b border-gray-200 pb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Title</h3>
                </div>
              )}
              <div>
                {!asPage && (
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Article Title
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      ({title.length}/500 characters)
                    </span>
                  </label>
                )}
                {asPage ? (
                  <div className="relative w-full max-w-[860px]">
                    <div className="pointer-events-none absolute -left-15 top-2">
                      <span className="block text-sm text-gray-500">Title</span>
                      <span className="mt-1 block text-[11px] text-gray-400">
                        {title.length}/500
                      </span>
                    </div>
                    <div className="absolute -left-3 top-0 h-full w-px bg-gray-300" />
                    <textarea
                      ref={titleTextareaRef}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="New post"
                      rows={1}
                      className="w-full resize-none overflow-hidden bg-transparent text-[24px] leading-[1.3] font-normal text-black placeholder:text-gray-500 outline-none border-0 pt-[16px] px-0 pb-0"
                      disabled={loading}
                      maxLength={500}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a compelling article title..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                    disabled={loading}
                    maxLength={500}
                  />
                )}
              </div>

              {asPage && cover && (
                <div className="pt-2">
                  <div className="group relative w-full max-w-[860px]">
                    <button
                      type="button"
                      className="cursor-pointer block w-full text-left"
                      aria-label="Toggle thumbnail actions"
                    >
                      <img
                        src={cover}
                        alt="Cover"
                        className="w-full h-auto object-cover rounded-sm"
                      />
                    </button>

                    <div className="absolute top-3 right-3 z-10 flex items-center gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextName = window.prompt(
                            "Image Name",
                            coverName || "",
                          );
                          if (nextName === null) return;
                          const normalized = nextName.trim();
                          setCoverName(normalized || null);
                        }}
                        className="cursor-pointer rounded-md border border-gray-300 bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:bg-white"
                        disabled={loading || coverUploading}
                      >
                        Image Name
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          coverFileInputRef.current?.click();
                        }}
                        className="cursor-pointer rounded-md border border-gray-300 bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:bg-white"
                        disabled={loading || coverUploading}
                      >
                        {coverUploading ? "Uploading..." : "Change"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCover(null);
                          setCoverName(null);
                          setCoverUrlInput("");
                        }}
                        className="cursor-pointer rounded-md border border-red-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        disabled={loading || coverUploading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Category and Author - Side by Side */}
              {!asPage && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category
                  </label>
                  <select
                    value={categoryId || ""}
                    onChange={(e) =>
                      setCategoryId(
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                    disabled={loading}
                >
                    <option value="">Select category</option>
                    {allCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              )}
            </div>

              {/* Content Blocks Section */}
              <div className="space-y-4 min-w-0">
                {asPage && (
                  <div className="w-full max-w-[860px] border-b border-gray-200 pb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Content</h3>
                  </div>
                )}
                <div className="">
                  {!asPage && (
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 bg-blue-600 rounded"></div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Content Blocks <span className="text-red-500">*</span>
                      </h3>
                    </div>
                  )}
                </div>
                <div className={asPage ? "space-y-6" : "space-y-3"}>
                  {contentBlocks.map((block, index) => (
                    <div
                      key={index}
                      className={
                        asPage
                          ? "relative w-full max-w-[860px]"
                          : "p-4 border border-gray-300 rounded-lg bg-white hover:border-blue-400 hover:shadow-sm transition-all"
                      }
                  >
                      {!asPage && (
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                              <span className="text-xs font-semibold text-blue-600">
                                {index + 1}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              Block {index + 1}
                            </span>
                          </div>
                          {contentBlocks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveContentBlock(index)}
                              className="cursor-pointer px-2 py-1 text-xs text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors font-medium"
                              disabled={loading}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      )}
                      {asPage && contentBlocks.length > 1 && (
                        <div className="absolute right-0 top-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveContentBlock(index)}
                            className="cursor-pointer px-2 py-1 text-xs text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors font-medium"
                            disabled={loading}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      <div className="space-y-2.5">
                        {asPage ? (
                          <div className="relative w-full">
                            <div className="pointer-events-none mb-2 block text-sm text-gray-500 md:hidden">
                              {index === 0 ? "Content" : `Content ${index + 1}`}
                            </div>
                            <div className="pointer-events-none absolute -left-20 top-2 hidden md:block">
                              <span className="block text-sm text-gray-500">
                                {index === 0 ? "Content" : `Content ${index + 1}`}
                              </span>
                            </div>
                            <div className="absolute -left-3 top-0 hidden h-full w-px bg-gray-300 md:block" />
                            <div
                              ref={(el) => {
                                contentTextareaRefs.current[index] = el;
                                if (!el) return;
                                const nextHtml = block.paragraph || "";
                                const isFocused = document.activeElement === el;
                                if (!isFocused && el.innerHTML !== nextHtml) {
                                  el.innerHTML = nextHtml;
                                }
                                decorateInlineImagesInEditor(el, index);
                              }}
                              contentEditable={!loading}
                              suppressContentEditableWarning
                              onFocus={(e) =>
                                decorateInlineImagesInEditor(e.currentTarget, index)
                              }
                              onInput={(e) =>
                                handleUpdateContentBlock(
                                  index,
                                  "paragraph",
                                  e.currentTarget.innerHTML,
                                )
                              }
                              onPaste={(e) => handleContentPaste(index, e)}
                              onSelect={(e) => handleContentSelection(index, e)}
                              onMouseUp={(e) => handleContentSelection(index, e)}
                              onKeyDown={(e) => handleContentKeyDown(index, e)}
                              onKeyUp={(e) => handleContentSelection(index, e)}
                              onClick={(e) => handleContentEditorClick(index, e)}
                              onBlur={() => {
                                setActiveSelection(null);
                                setActiveEditorBlockIndex(null);
                                setActiveTextFormat({
                                  bold: false,
                                  subtitle: false,
                                  link: false,
                                  quote: false,
                                });
                              }}
                              className="min-h-[56px] w-full overflow-hidden whitespace-pre-wrap bg-transparent px-0 pb-0 pt-[8px] text-[16px] leading-[1.25] text-black outline-none border-0 [&_a]:text-current [&_a]:underline [&_img]:my-4 [&_img]:!w-full [&_img]:!aspect-[100/53] [&_img]:!h-auto [&_img]:rounded-lg [&_img]:!object-cover [&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:my-2 [&_blockquote]:relative [&_blockquote]:my-2 [&_blockquote]:py-1 [&_blockquote]:pl-8 [&_blockquote]:pr-2 [&_blockquote]:text-[20px] [&_blockquote]:font-bold [&_blockquote]:italic [&_blockquote]:text-current [&_blockquote]:before:absolute [&_blockquote]:before:left-1 [&_blockquote]:before:top-[14px] [&_blockquote]:before:font-serif [&_blockquote]:before:font-bold [&_blockquote]:before:not-italic [&_blockquote]:before:text-[45px] [&_blockquote]:before:leading-none [&_blockquote]:before:text-current [&_blockquote]:before:content-['“'] [&_blockquote]:after:relative [&_blockquote]:after:top-[14px] [&_blockquote]:after:ml-1 [&_blockquote]:after:font-serif [&_blockquote]:after:font-bold [&_blockquote]:after:not-italic [&_blockquote]:after:text-[45px] [&_blockquote]:after:leading-none [&_blockquote]:after:text-current [&_blockquote]:after:content-['”']"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Content <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={block.paragraph}
                              onChange={(e) =>
                                handleUpdateContentBlock(
                                  index,
                                  "paragraph",
                                  e.target.value,
                                )
                              }
                              placeholder="Enter the main content for this block..."
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-sm text-gray-900 placeholder:text-gray-400 bg-white"
                              disabled={loading}
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* End Images Section */}
              <div className="space-y-4 min-w-0">
                {asPage && (
                  <div className="w-full max-w-[860px] border-b border-gray-200 pb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Image</h3>
                  </div>
                )}
                <div className="w-full max-w-[860px] grid grid-cols-1 gap-4 md:grid-cols-3">
                  {[0, 1, 2].map((slot) => {
                    const slotImage = endImages[slot];
                    return (
                      <div
                        key={slot}
                        className="rounded-md border border-gray-200 bg-white p-2"
                      >
                        {slotImage?.url ? (
                          <>
                            <img
                              src={slotImage.url}
                              alt={slotImage.name || `End image ${slot + 1}`}
                              className="w-full rounded-md object-cover aspect-[100/53]"
                            />
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => endImageFileInputRefs.current[slot]?.click()}
                                className="cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                disabled={loading}
                              >
                                Change
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextName = window.prompt(
                                    "Image Name",
                                    slotImage.name || "",
                                  );
                                  if (nextName === null) return;
                                  const normalized = nextName.trim();
                                  setEndImages((prev) => {
                                    const next = [...prev];
                                    if (!next[slot]) return prev;
                                    next[slot] = {
                                      ...next[slot],
                                      name: normalized || null,
                                    };
                                    return next;
                                  });
                                }}
                                className="cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                disabled={loading}
                              >
                                Image Name
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveEndImage(slot)}
                                className="cursor-pointer rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                                disabled={loading}
                              >
                                Remove
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => endImageFileInputRefs.current[slot]?.click()}
                            className="flex h-[110px] w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 text-xs text-gray-500 hover:bg-gray-50"
                            disabled={loading}
                          >
                            Add End Image
                          </button>
                        )}
                        <input
                          ref={(el) => {
                            endImageFileInputRefs.current[slot] = el;
                          }}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          className="sr-only"
                          onChange={(e) => handleSelectEndImageFile(slot, e.target.files?.[0])}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

              {/* Text To Speech Section */}
              <div className="space-y-3 min-w-0">
                {asPage && (
                  <div className="w-full max-w-[860px] border-b border-gray-200 pb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Text To Speech</h3>
                  </div>
                )}
                <div className="w-full max-w-[860px] rounded-md border border-gray-200 bg-white p-3 space-y-3">
                  <div>
                    <label
                      htmlFor="tts-plain-input"
                      className="block text-xs font-medium text-gray-600 mb-1.5"
                    >
                      Plain text for audio (no formatting)
                    </label>
                    <textarea
                      id="tts-plain-input"
                      value={ttsPlainInput}
                      onChange={(e) => setTtsPlainInput(e.target.value)}
                      maxLength={5000}
                      rows={5}
                      placeholder="Type or paste plain text here (10–5000 characters), then click Convert to hear a preview."
                      disabled={loading || ttsConverting || ttsRemoving}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-400 bg-white resize-y min-h-[100px] disabled:opacity-50"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {ttsPlainInput.length} / 5000 — Convert needs at least 10 characters.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConvertTextToSpeech}
                      disabled={
                        loading ||
                        ttsConverting ||
                        ttsRemoving ||
                        ttsPlainInput.trim().length < 10 ||
                        ttsPlainInput.trim().length > 5000
                      }
                      className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ttsConverting ? "Converting..." : "Convert"}
                    </button>
                    {ttsAudioUrl && (
                      <button
                        type="button"
                        onClick={() => void handleRemoveTtsAudio()}
                        disabled={loading || ttsConverting || ttsRemoving}
                        className="cursor-pointer rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {ttsRemoving ? "Removing..." : "Remove Audio"}
                      </button>
                    )}
                  </div>
                  {ttsAudioUrl ? (
                    <div>
                      <NewsAudioPlayer src={ttsAudioUrl} />
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Preview files stay in a temporary folder until you save; cancel or remove deletes them
                      from storage. Save moves the audio to the permanent location for this article.
                    </p>
                  )}
                </div>
              </div>

            {error && (
              <div className="order-3 lg:col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Footer Actions */}
            {!asPage && (
            <div className="order-4 lg:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={requestCloseEditor}
                disabled={loading || ttsConverting || ttsRemoving}
                className="cursor-pointer px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
            >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  ttsConverting ||
                  ttsRemoving ||
                  !author.trim() ||
                  !categoryId
                }
                className="cursor-pointer px-6 py-2.5 bg-blue-600 text-[#f7f7f7] rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
                {loading
                  ? "Saving..."
                  : news
                    ? "Update Video Article"
                    : "Create Video Article"}
              </button>
            </div>
            )}
          </form>
        </div>
      </div>

      {/* Modals */}
      <CoverSelectorModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        onSelect={handleSelectCover}
      />

      <VideoSelectorModal
        isOpen={isMiddleVideoModalOpen}
        onClose={() => setIsMiddleVideoModalOpen(false)}
        onSelect={handleSelectMiddleVideo}
        allowUpload={false}
      />

      <ImageSelectorModal
        isOpen={isEndImageModalOpen}
        onClose={() => setIsEndImageModalOpen(false)}
        onSelect={handleSelectEndImage}
      />
    </>
  );
}

export default function VideoManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<News[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] =
    useState<(typeof PER_PAGE_OPTIONS)[number]>(30);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState<News | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const hasFetchedInitialArticlesRef = useRef(false);
  const hasFetchedCategoriesRef = useRef(false);
  const hasPassedFirstPaginationEffectRef = useRef(false);
  const mode = searchParams.get("mode");
  const editId = Number(searchParams.get("id"));
  const isCreatePage = mode === "create";
  const isEditPage = mode === "edit" && Number.isFinite(editId);

  const fetchArticles = async (
    page: number = currentPage,
    perPage: number = itemsPerPage,
  ) => {
    try {
      setLoading(true);
      setError(null);
      const newsResponse = await getAdminVideos(undefined, page, perPage);

      // Sort articles by date (latest first) - so numbering goes from highest to lowest
      const sortedArticles = newsResponse.data.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; // Descending order (latest first)
      });

      const pagination = newsResponse.pagination;
      setArticles(sortedArticles);
      setTotalItems(pagination?.total ?? sortedArticles.length);
      setTotalPages(
        pagination?.last_page ??
          Math.max(1, Math.ceil(sortedArticles.length / perPage)),
      );
      setCurrentPage(pagination?.current_page ?? page);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedCategoriesRef.current) return;
    hasFetchedCategoriesRef.current = true;

    const fetchCategoriesData = async () => {
      try {
        const categoriesResponse = await getCategories();
        setCategories(categoriesResponse.categories);
      } catch {
        setCategories([]);
      }
    };

    fetchCategoriesData();
  }, []);

  useEffect(() => {
    if (hasFetchedInitialArticlesRef.current) return;
    if (isCreatePage || isEditPage) {
      setLoading(false);
      return;
    }
    hasFetchedInitialArticlesRef.current = true;
    fetchArticles(currentPage, itemsPerPage);
  }, [isCreatePage, isEditPage]);

  useEffect(() => {
    if (isCreatePage || isEditPage) return;
    if (!hasPassedFirstPaginationEffectRef.current) {
      hasPassedFirstPaginationEffectRef.current = true;
      return;
    }
    fetchArticles(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage, isCreatePage, isEditPage]);

  useEffect(() => {
    if (!isEditPage) {
      setSelectedArticle(null);
      return;
    }

    let isMounted = true;
    const fetchSelectedArticle = async () => {
      try {
        setEditLoading(true);
        const response = await getAdminVideoById(editId);
        if (isMounted) {
          setSelectedArticle(response.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch selected article",
          );
        }
      } finally {
        if (isMounted) {
          setEditLoading(false);
        }
      }
    };

    fetchSelectedArticle();
    return () => {
      isMounted = false;
    };
  }, [isEditPage, editId]);

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex =
    totalItems === 0 ? 0 : Math.min((currentPage - 1) * itemsPerPage + articles.length, totalItems);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of content area
      const contentArea = document.querySelector(".flex-1.overflow-y-auto");
      if (contentArea) {
        contentArea.scrollTop = 0;
      }
    }
  };

  const handleCreateArticle = () => {
    router.push(`${pathname}?mode=create`);
  };

  const handleEditArticle = (article: News) => {
    router.push(`${pathname}?mode=edit&id=${article.id}`);
  };

  const closeEditorPage = () => {
    router.push("/videoManagement");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this article?")) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteAdminVideo(id, user?.id);
      const nextPage = articles.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
      } else {
        await fetchArticles(nextPage, itemsPerPage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete article";
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDateAndTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const shouldShowLoading = isEditPage ? editLoading : loading;

  if (shouldShowLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading video articles...</p>
      </div>
    );
  }

  if (error && articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button
          onClick={() => fetchArticles()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
          Retry
        </button>
      </div>
    );
  }
  

  if (isCreatePage || isEditPage) {
    return (
      <div className="h-screen overflow-y-auto bg-[#f7f7f7]">
        <NewsModal
          isOpen
          asPage
          onClose={closeEditorPage}
          onSuccess={async () => {
            await fetchArticles();
            router.replace("/videoManagement");
          }}
          news={isEditPage ? selectedArticle : null}
          categories={categories}
          currentUsername={user?.username?.trim() || ""}
        />
      </div>
    );
  }

  return (
    <div className="relative h-screen flex flex-col bg-[#f7f7f7]">
      {/* Sticky Header */}

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#f7f7f7]">
        {error && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}

        {articles.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-4">No video articles found.</p>
              <button
                onClick={handleCreateArticle}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
                Create Your First Video Article
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="sticky top-0 z-20 h-16 bg-[#f7f7f7] border-b border-gray-200 px-6 flex items-center shadow-[0_2px_3px_rgba(15,23,42,0.06)]">
              <div className="grid h-full w-full grid-cols-[50px_130px_minmax(280px,3fr)_90px_1fr_1fr_120px_88px] gap-[5px] text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <div className="flex h-full items-center justify-left">No.</div>
                <div className="flex h-full items-center justify-left">Cover Image</div>
                <div className="flex h-full items-center justify-left">Title</div>
                <div className="flex h-full items-center justify-left">Visibility</div>
                <div className="flex h-full items-center justify-left">Category</div>
                <div className="flex h-full items-center justify-left">Author</div>
                <div className="flex h-full items-center justify-left">Upload Date</div>
                <div className="flex h-full items-center justify-center">View</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {articles.map((article, index) => (
                <div
                  key={article.id}
                  className="group px-6 h-[85px] hover:bg-[#ececec] transition-colors"
              >
                  <div className="grid h-full grid-cols-[50px_130px_minmax(280px,3fr)_90px_1fr_1fr_120px_88px] gap-[5px] items-center">
                    {/* Number */}
                    <div
                      className="text-left pl-1 cursor-pointer"
                      onClick={() => handleEditArticle(article)}
                    >
                      <span className="text-xs font-medium text-gray-900">
                        {totalItems - (currentPage - 1) * itemsPerPage - index}
                      </span>
                    </div>

                    {/* Cover Image */}
                    <div
                      className="cursor-pointer"
                      onClick={() => handleEditArticle(article)}
                    >
                      {article.cover ? (
                        <div className="relative w-[120px] h-[68px] rounded-md overflow-hidden border border-gray-200 bg-gray-100">
                          <img
                            src={article.cover}
                            alt="Cover"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-[120px] h-[68px] rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center">
                          <span className="text-xs text-gray-400">
                            No Cover
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div
                      className="cursor-pointer"
                      onClick={() => handleEditArticle(article)}
                    >
                      <h3 className="text-[13px] font-semibold text-gray-900 leading-5 line-clamp-1">
                        {article.title}
                      </h3>
                      <div className="relative h-10 mt-0.5">
                        <p className="absolute inset-0 text-[13px] text-gray-500 leading-5 line-clamp-2 group-hover:opacity-0 transition-opacity">
                          {toPlainPreviewText(
                            article.content_blocks?.find((block) => block.paragraph?.trim())
                              ?.paragraph ||
                              article.subtitle ||
                              "",
                          )}
                        </p>
                        <div className="absolute inset-0 flex items-start gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditArticle(article);
                            }}
                            className="cursor-pointer inline-flex h-9 w-9 items-center justify-center text-black hover:bg-gray-100 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={18} strokeWidth={2.6} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(article.id);
                            }}
                            disabled={deletingId === article.id}
                            className="cursor-pointer inline-flex h-9 w-9 items-center justify-center text-black hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            <Trash2 size={18} strokeWidth={2.6} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Visibility */}
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        Visible
                      </span>
                    </div>

                    {/* Category */}
                    <div>
                      {article.category ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {article.category.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">
                          No category
                        </span>
                      )}
                    </div>

                    {/* Author */}
                    <div>
                      <p className="text-sm text-gray-900">{article.author}</p>
                    </div>

                    {/* Upload Date */}
                    <div>
                      {(() => {
                        const dateTime = formatDateAndTime(article.created_at);
                        return (
                          <div className="text-xs text-gray-600 leading-4 text-left">
                            <p>{dateTime.date}</p>
                            <p>{dateTime.time}</p>
                          </div>
                        );
                      })()}
                    </div>

                    {/* View */}
                    <div className="pr-1 text-center">
                      <button
                        type="button"
                        className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700"
                        title="View"
                      >
                        ##
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination - Table Style */}
        {totalItems > 0 && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left side: Rows per page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const value = Number(e.target.value) as (typeof PER_PAGE_OPTIONS)[number];
                    setItemsPerPage(value);
                    setCurrentPage(1);
                  }}
                  className="cursor-pointer px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700"
              >
                  {PER_PAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Center: Page info */}
              <div className="text-sm text-gray-700">
                {startIndex}-{endIndex} of {totalItems}
              </div>

              {/* Right side: Navigation buttons */}
              <div className="flex items-center gap-1">
                {/* First Page Button */}
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="cursor-pointer flex items-center justify-center w-8 h-8 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="First page"
              >
                  <ChevronsLeft size={16} />
                </button>

                {/* Previous Button */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="cursor-pointer flex items-center justify-center w-8 h-8 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
              >
                  <ChevronLeft size={16} />
                </button>

                {/* Next Button */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="cursor-pointer flex items-center justify-center w-8 h-8 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
              >
                  <ChevronRight size={16} />
                </button>

                {/* Last Page Button */}
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="cursor-pointer flex items-center justify-center w-8 h-8 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Last page"
              >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <button
        onClick={handleCreateArticle}
        className="cursor-pointer fixed bottom-15 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 bg-[#f7f7f7] text-black shadow-md transition-colors hover:bg-[#f2f2f2] active:bg-[#e9e9e9]"
        aria-label="Create video article"
        title="Create video article"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

    </div>
  );
}