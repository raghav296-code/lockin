"use client";

import * as React from "react";
import {
  ArrowLeft,
  Plus,
  Search,
  BookOpen,
  Video,
  Globe,
  FileText,
  Code2,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResourceCard } from "./resource-card";
import { MacFolderIcon } from "./mac-folder-icon";
import type { ResourceItem } from "@/actions/resources";
import type { CategoryNode } from "@/actions/categories";
import type { ResourceStatus, ResourceType } from "@/lib/validations/resource";

interface FolderDetailViewProps {
  folder: CategoryNode;
  resources: ResourceItem[];
  onBack: () => void;
  onAddResource: (defaultType?: ResourceType) => void;
  onEditFolder: (folder: CategoryNode) => void;
  onDeleteFolder: (id: string, name: string) => void;
  onViewResource: (resource: ResourceItem) => void;
  onEditResource: (resource: ResourceItem) => void;
  onDeleteResource: (id: string) => void;
  onStatusChange: (id: string, status: ResourceStatus) => void;
  onToggleFavorite: (id: string) => void;
}

interface CategorySectionConfig {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  defaultType: ResourceType;
  items: ResourceItem[];
}

export function FolderDetailView({
  folder,
  resources,
  onBack,
  onAddResource,
  onEditFolder,
  onDeleteFolder,
  onViewResource,
  onEditResource,
  onDeleteResource,
  onStatusChange,
  onToggleFavorite,
}: FolderDetailViewProps) {
  const [search, setSearch] = React.useState("");
  const [showEmptyCategories, setShowEmptyCategories] = React.useState(false);
  const [folderMenuOpen, setFolderMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setFolderMenuOpen(false);
      }
    }
    if (folderMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [folderMenuOpen]);

  // Filter resources inside this folder matching search
  const folderResources = React.useMemo(() => {
    return resources.filter((r) => {
      if (folder.id === "unfiled") {
        if (r.category !== null) return false;
      } else {
        if (r.category?.id !== folder.id) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchAuthor = r.author?.toLowerCase().includes(q) || false;
        const matchNotes = r.notes?.toLowerCase().includes(q) || false;
        return matchTitle || matchAuthor || matchNotes;
      }

      return true;
    });
  }, [resources, folder.id, search]);

  // Group into clean Apple collection sections
  const sections: CategorySectionConfig[] = React.useMemo(() => {
    return [
      {
        key: "videos",
        title: "Videos & Reels",
        subtitle: "Instagram reels, YouTube lectures & video summaries",
        icon: Video,
        iconBg: "bg-rose-500/15 text-rose-500 border border-rose-500/20",
        iconColor: "text-rose-500",
        defaultType: "VIDEO",
        items: folderResources.filter((r) => r.type === "VIDEO" || r.type === "COURSE"),
      },
      {
        key: "books",
        title: "Books & Textbooks",
        subtitle: "Key books, manuals and textbook chapters",
        icon: BookOpen,
        iconBg: "bg-amber-500/15 text-amber-500 border border-amber-500/20",
        iconColor: "text-amber-500",
        defaultType: "BOOK",
        items: folderResources.filter((r) => r.type === "BOOK"),
      },
      {
        key: "websites",
        title: "Websites & Links",
        subtitle: "Curated web pages, blogs, and bookmark links",
        icon: Globe,
        iconBg: "bg-cyan-500/15 text-cyan-500 border border-cyan-500/20",
        iconColor: "text-cyan-500",
        defaultType: "OTHER",
        items: folderResources.filter((r) => r.type === "OTHER"),
      },
      {
        key: "papers",
        title: "Research Papers & Articles",
        subtitle: "Academic papers, PDFs, arXiv preprints and essays",
        icon: FileText,
        iconBg: "bg-purple-500/15 text-purple border border-purple/20",
        iconColor: "text-purple",
        defaultType: "PAPER",
        items: folderResources.filter((r) => r.type === "PAPER" || r.type === "ARTICLE"),
      },
      {
        key: "docs",
        title: "Documentation & Guides",
        subtitle: "Developer docs, API references, cheat sheets",
        icon: Code2,
        iconBg: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20",
        iconColor: "text-emerald-500",
        defaultType: "DOCUMENTATION",
        items: folderResources.filter((r) => r.type === "DOCUMENTATION"),
      },
    ];
  }, [folderResources]);

  const totalCount = folderResources.length;

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Apple-Style Navigation & Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-card/80 hover:bg-card border border-border/60 hover:border-border text-muted-foreground hover:text-foreground transition-all duration-200 shadow-sm hover:scale-105 active:scale-95"
            title="Back to all collections"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-3">
            <MacFolderIcon size="sm" variant={folder.id === "unfiled" ? "graphite" : "blue"} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Resources /</span>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {folder.name}
                </h1>

                {/* Folder Options Menu */}
                {folder.id !== "unfiled" && (
                  <div className="relative" ref={menuRef}>
                    <button
                      type="button"
                      onClick={() => setFolderMenuOpen(!folderMenuOpen)}
                      className="p-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/70 transition-colors"
                      title="Collection options"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {folderMenuOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-36 rounded-2xl border border-white/10 bg-popover/95 backdrop-blur-2xl shadow-xl p-1 z-30 text-xs animate-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setFolderMenuOpen(false);
                            onEditFolder(folder);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-foreground hover:bg-muted/80 transition-colors font-medium"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Rename
                        </button>

                        <div className="my-1 border-t border-border/40" />

                        <button
                          type="button"
                          onClick={() => {
                            setFolderMenuOpen(false);
                            onDeleteFolder(folder.id, folder.name);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-rose-500 hover:bg-rose-500/10 transition-colors font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Folder
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                {totalCount} {totalCount === 1 ? "resource" : "resources"} in this collection
              </p>
            </div>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              type="text"
              placeholder="Search in folder..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 h-9 text-xs rounded-xl w-36 sm:w-48 bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-blue-500/50 backdrop-blur-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowEmptyCategories(!showEmptyCategories)}
            className="p-2.5 rounded-xl border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title={showEmptyCategories ? "Hide empty sections" : "Show all sections"}
          >
            {showEmptyCategories ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <Button
            onClick={() => onAddResource()}
            className="rounded-xl text-xs font-semibold h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 border border-blue-400/30 gap-1.5 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Resource</span>
          </Button>
        </div>
      </div>

      {/* Main Content: Sectionized Collection Shelves in Grid Type */}
      {totalCount === 0 && !showEmptyCategories ? (
        /* Empty Folder State */
        <div className="relative overflow-hidden p-12 text-center rounded-3xl bg-gradient-to-b from-muted/30 via-muted/10 to-transparent border border-dashed border-border/70 space-y-4 max-w-md mx-auto">
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 inline-flex mx-auto">
            <MacFolderIcon size="md" variant="blue" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm sm:text-base font-semibold text-foreground">
              This collection is empty
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Save Instagram reels, YouTube lectures, books, research PDFs, or website bookmarks here.
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={() => onAddResource()}
              className="rounded-xl text-xs font-semibold h-9 px-5 bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 border border-blue-400/30 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add First Resource
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {sections.map((sec) => {
            const hasItems = sec.items.length > 0;
            if (!hasItems && !showEmptyCategories) return null;
            const Icon = sec.icon;

            return (
              <section key={sec.key} className="space-y-4">
                {/* Apple Category Collection Shelf Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${sec.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold tracking-tight text-foreground">
                          {sec.title}
                        </h2>
                        {hasItems && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted/60 text-muted-foreground border border-border/40 font-mono">
                            {sec.items.length}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground hidden sm:block">
                        {sec.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Quick Add to this Section */}
                  <button
                    type="button"
                    onClick={() => onAddResource(sec.defaultType)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors border border-border/40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add to {sec.title.split(" ")[0]}</span>
                  </button>
                </div>

                {/* Grid Type Shelf */}
                {hasItems ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {sec.items.map((r) => (
                      <ResourceCard
                        key={r.id}
                        resource={r}
                        onView={onViewResource}
                        onEdit={onEditResource}
                        onDelete={onDeleteResource}
                        onStatusChange={onStatusChange}
                        onToggleFavorite={onToggleFavorite}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-muted/20 border border-dashed border-border/40 text-center">
                    <p className="text-xs text-muted-foreground">
                      No {sec.title.toLowerCase()} added yet.
                    </p>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
