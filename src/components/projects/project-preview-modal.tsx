"use client";

import * as React from "react";
import {
  X,
  ExternalLink,
  RotateCw,
  Monitor,
  Tablet,
  Smartphone,
  Globe,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectItem } from "@/components/skills/skill-types";

interface ProjectPreviewModalProps {
  project: ProjectItem | null;
  isOpen: boolean;
  onClose: () => void;
}

type DeviceMode = "desktop" | "tablet" | "mobile";

export function ProjectPreviewModal({
  project,
  isOpen,
  onClose,
}: ProjectPreviewModalProps) {
  const [device, setDevice] = React.useState<DeviceMode>("desktop");
  const [iframeKey, setIframeKey] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setIframeKey((prev) => prev + 1);
    }
  }, [isOpen, project?.url]);

  if (!isOpen || !project) return null;

  const targetUrl = project.url || project.repoUrl || "";

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleCopyUrl = () => {
    if (targetUrl) {
      navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Frame Container */}
      <div className="relative w-full h-[94vh] max-w-7xl rounded-[22px] border border-border/80 bg-background/95 backdrop-blur-2xl shadow-2xl flex flex-col z-10 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Glassmorphic Apple Control Bar */}
        <header className="h-14 px-4 sm:px-6 border-b border-border/60 bg-surface/80 flex items-center justify-between shrink-0 gap-3">
          {/* Left: Project Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent-tint text-accent flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-semibold text-foreground truncate">
                  {project.name}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-success-tint text-success shrink-0">
                  Live Preview
                </span>
              </div>
            </div>
          </div>

          {/* Center: Device Switcher (Apple Segmented Control) */}
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-surface-secondary border border-border/60 shadow-xs">
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-medium transition-all ${
                device === "desktop"
                  ? "bg-surface shadow-xs text-foreground font-semibold"
                  : "text-secondary hover:text-foreground"
              }`}
              onClick={() => setDevice("desktop")}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-medium transition-all ${
                device === "tablet"
                  ? "bg-surface shadow-xs text-foreground font-semibold"
                  : "text-secondary hover:text-foreground"
              }`}
              onClick={() => setDevice("tablet")}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Tablet</span>
            </button>
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-medium transition-all ${
                device === "mobile"
                  ? "bg-surface shadow-xs text-foreground font-semibold"
                  : "text-secondary hover:text-foreground"
              }`}
              onClick={() => setDevice("mobile")}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {targetUrl && (
              <button
                type="button"
                className="h-8 px-2.5 rounded-lg border border-border bg-surface text-secondary hover:text-foreground text-[12px] font-medium hidden md:flex items-center gap-1.5 transition-colors"
                onClick={handleCopyUrl}
              >
                {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy URL"}</span>
              </button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-lg text-secondary hover:text-foreground"
              onClick={handleRefresh}
              title="Reload preview"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </Button>

            {targetUrl && (
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg border border-border bg-surface text-secondary hover:text-foreground flex items-center justify-center transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-lg text-secondary hover:text-foreground ml-1"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Viewport Canvas */}
        <div className="flex-1 bg-muted-bg/50 p-3 sm:p-6 flex items-center justify-center overflow-auto">
          {targetUrl ? (
            <div
              className={`transition-all duration-300 h-full flex flex-col items-center justify-center ${
                device === "desktop"
                  ? "w-full"
                  : device === "tablet"
                  ? "w-[768px] max-w-full shadow-2xl rounded-[24px] border-[8px] border-border/80 bg-surface overflow-hidden"
                  : "w-[390px] max-w-full shadow-2xl rounded-[36px] border-[10px] border-border/90 bg-surface overflow-hidden"
              }`}
            >
              {/* Mobile Notch Indicator */}
              {device === "mobile" && (
                <div className="w-24 h-4 rounded-full bg-border/80 mb-2 mt-1 shrink-0" />
              )}

              {/* Iframe Viewport */}
              <div className="relative w-full h-full rounded-[14px] bg-white overflow-hidden shadow-inner flex-1">
                {isLoading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface/90 backdrop-blur-xs space-y-3">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-[13px] text-secondary">
                      Loading {project.name}...
                    </p>
                  </div>
                )}

                <iframe
                  key={iframeKey}
                  src={targetUrl}
                  title={project.name}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  onLoad={() => setIsLoading(false)}
                />
              </div>

              {/* Fallback Notice Bar */}
              <div className="w-full py-1.5 px-3 bg-surface border-t border-border/60 text-center flex items-center justify-center gap-2">
                <span className="text-[11px] text-muted truncate">
                  Target: {targetUrl}
                </span>
                <span className="text-muted text-[10px]">•</span>
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-accent font-medium hover:underline flex items-center gap-1 shrink-0"
                >
                  Open directly if frame blocked
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 rounded-[18px] border border-border bg-surface max-w-md space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="text-[16px] font-semibold text-foreground">
                No preview URL configured
              </h4>
              <p className="text-[13px] text-secondary">
                Add a live deployment URL or repository URL to enable interactive in-app live previews.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
