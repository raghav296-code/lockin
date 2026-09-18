"use client";

import * as React from "react";
import {
  Star,
  ExternalLink,
  Clock,
  MoreHorizontal,
  Edit2,
  Trash2,
  BookOpen,
  Video,
  Globe,
  FileText,
  Code2,
  Play,
  File,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResourceItem } from "@/actions/resources";
import type { ResourceStatus } from "@/lib/validations/resource";
import { formatMinutes } from "./resource-types";

interface ResourceCardProps {
  resource: ResourceItem;
  onView: (resource: ResourceItem) => void;
  onEdit: (resource: ResourceItem) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ResourceStatus) => void;
  onToggleFavorite: (id: string) => void;
}

// Extract YouTube video ID
function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/shorts/")[1]?.split("/")[0] || null;
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/embed/")[1]?.split("/")[0] || null;
      }
    }
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1).split("?")[0] || null;
    }
  } catch {
    return null;
  }
  return null;
}

// Check if URL is an image file
function isDirectImageUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url) || url.includes("images.unsplash.com");
}

export function ResourceCard({
  resource,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleFavorite,
}: ResourceCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const [ogData, setOgData] = React.useState<{ image: string | null; favicon: string | null; siteName: string | null } | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Parse domain
  const domain = React.useMemo(() => {
    if (!resource.url) return null;
    try {
      const url = new URL(resource.url);
      return url.hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  }, [resource.url]);

  const ytVideoId = resource.url ? getYouTubeVideoId(resource.url) : null;
  const isInstagram = domain?.includes("instagram.com");
  const isTikTok = domain?.includes("tiktok.com");
  const isPdf = resource.url?.endsWith(".pdf") || domain?.includes("arxiv.org") || resource.type === "PAPER";
  const isImage = isDirectImageUrl(resource.url);

  // Determine thumbnail source
  const youtubeThumb = ytVideoId ? `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg` : null;

  // Fetch OG image on demand for website links if no YouTube thumbnail or direct image
  React.useEffect(() => {
    if (resource.url && !ytVideoId && !isImage && resource.type !== "BOOK") {
      let isMounted = true;
      fetch(`/api/og-preview?url=${encodeURIComponent(resource.url)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (isMounted && data) {
            setOgData(data);
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [resource.url, ytVideoId, isImage, resource.type]);

  const previewImage = isImage
    ? resource.url
    : youtubeThumb || ogData?.image || null;

  const faviconUrl = ogData?.favicon || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null);

  const statusMap: Record<ResourceStatus, { label: string; bg: string; dot: string }> = {
    BACKLOG: {
      label: "Backlog",
      bg: "bg-muted/70 text-muted-foreground border-border/50",
      dot: "bg-muted-foreground/60",
    },
    IN_PROGRESS: {
      label: "Reading",
      bg: "bg-blue-500/10 text-blue-500 border-blue-500/25 font-semibold",
      dot: "bg-blue-500 animate-pulse",
    },
    COMPLETED: {
      label: "Done",
      bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25 font-semibold",
      dot: "bg-emerald-500",
    },
    ARCHIVED: {
      label: "Archived",
      bg: "bg-muted/40 text-muted-foreground/60 border-border/40",
      dot: "bg-muted-foreground/40",
    },
  };

  const currentStatus = statusMap[resource.status] || statusMap.BACKLOG;

  return (
    <div
      onClick={() => onView(resource)}
      className="group relative flex flex-col justify-between rounded-2xl bg-card border border-border/70 hover:border-border hover:shadow-xl hover:shadow-black/10 transition-all duration-200 cursor-pointer overflow-hidden hover:-translate-y-0.5"
    >
      {/* 1. Type-Aware 16:9 Preview Block on Top */}
      <div className="relative w-full aspect-[16/9] bg-muted/30 border-b border-border/50 overflow-hidden flex items-center justify-center select-none">
        {previewImage && !imgError ? (
          <>
            {/* Thumbnail Image */}
            <img
              src={previewImage}
              alt={resource.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />

            {/* Video Centered Play Icon Overlay */}
            {(resource.type === "VIDEO" || ytVideoId || isInstagram || isTikTok) && (
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-black/60 text-white backdrop-blur-md flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                </div>
              </div>
            )}
          </>
        ) : isPdf ? (
          /* PDF Type Preview Block */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-purple-500/10 via-muted/20 to-muted/40 p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple border border-purple/30 flex items-center justify-center mb-1.5 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-purple font-mono">
              PDF Document
            </span>
          </div>
        ) : resource.type === "BOOK" ? (
          /* Book Type Preview Block */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-amber-500/10 via-muted/20 to-muted/40 p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center mb-1.5 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-amber-500 font-mono">
              Book / Textbook
            </span>
          </div>
        ) : resource.type === "DOCUMENTATION" ? (
          /* Documentation Type Preview Block */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-emerald-500/10 via-muted/20 to-muted/40 p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mb-1.5 shadow-sm">
              <Code2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-500 font-mono">
              Developer Docs
            </span>
          </div>
        ) : (
          /* Default Website / Link Favicon Fallback */
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20 p-4 text-center">
            {faviconUrl ? (
              <img
                src={faviconUrl}
                alt=""
                className="w-8 h-8 rounded-lg mb-1.5 drop-shadow-sm"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <Globe className="w-8 h-8 text-muted-foreground/60 mb-1.5" />
            )}
            <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[85%]">
              {domain || "Website Link"}
            </span>
          </div>
        )}

        {/* Duration Badge Overlay (Bottom Right) */}
        {resource.estimatedMinutes && resource.estimatedMinutes > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white font-mono text-[10px] font-medium flex items-center gap-1 shadow-sm">
            <Clock className="w-2.5 h-2.5" />
            <span>{formatMinutes(resource.estimatedMinutes)}</span>
          </div>
        )}

        {/* Favorite Star (Top Right of Preview) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(resource.id);
          }}
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition-all shadow-xs",
            resource.isFavorite
              ? "bg-black/60 text-amber-400"
              : "bg-black/40 text-white/70 opacity-0 group-hover:opacity-100 hover:text-amber-400"
          )}
          title="Star resource"
        >
          <Star
            className={cn(
              "w-3.5 h-3.5",
              resource.isFavorite && "fill-amber-400 stroke-amber-400"
            )}
          />
        </button>
      </div>

      {/* 2. Card Body */}
      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {/* Source Label (Icon + Domain / Platform Name) */}
          <div className="flex items-center justify-between gap-1 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5 min-w-0">
              {faviconUrl ? (
                <img
                  src={faviconUrl}
                  alt=""
                  className="w-3.5 h-3.5 rounded-xs shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : resource.type === "VIDEO" ? (
                <Video className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              ) : resource.type === "BOOK" ? (
                <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : resource.type === "PAPER" ? (
                <FileText className="w-3.5 h-3.5 text-purple shrink-0" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              )}

              <span className="truncate font-medium">
                {isInstagram
                  ? "instagram.com"
                  : ytVideoId
                  ? "youtube.com"
                  : isTikTok
                  ? "tiktok.com"
                  : domain || (resource.author ? `By ${resource.author}` : "Link")}
              </span>
            </div>

            {/* 3-Dot Overflow Menu */}
            <div
              className="relative shrink-0"
              ref={menuRef}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/70 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Options"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-white/10 bg-popover/95 backdrop-blur-2xl shadow-xl p-1 z-30 text-xs animate-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(resource);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-muted/80 transition-colors font-medium"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>

                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-muted/80 transition-colors font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Link
                    </a>
                  )}

                  <div className="my-1 border-t border-border/40" />

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(resource.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Title (1 line, truncate with ellipsis) */}
          <h4
            className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-blue-500 transition-colors"
            title={resource.title}
          >
            {resource.title}
          </h4>
        </div>

        {/* 3. Bottom Row: Status Pill on Left + Open Affordance on Right */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] mt-2">
          {/* Status Pill */}
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] border font-medium",
              currentStatus.bg
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", currentStatus.dot)} />
            <span>{currentStatus.label}</span>
          </div>

          {/* Open ↗ Affordance */}
          {resource.url ? (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-blue-500 transition-colors group/link"
            >
              <span>open</span>
              <span className="text-xs transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5">
                ↗
              </span>
            </a>
          ) : (
            <span className="text-[10px] text-muted-foreground/60 font-mono">
              Note
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
