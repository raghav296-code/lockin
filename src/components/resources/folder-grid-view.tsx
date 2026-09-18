"use client";

import * as React from "react";
import {
  Plus,
  Search,
  FolderPlus,
  FilePlus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MacFolderIcon, type FolderColorVariant } from "./mac-folder-icon";
import type { CategoryNode } from "@/actions/categories";
import type { ResourceItem } from "@/actions/resources";

interface FolderGridViewProps {
  categories: CategoryNode[];
  resources: ResourceItem[];
  onSelectFolder: (folder: CategoryNode) => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: CategoryNode) => void;
  onDeleteFolder: (id: string, name: string) => void;
  onAddResource: () => void;
}

const COLOR_VARIANTS: FolderColorVariant[] = [
  "blue",
  "indigo",
  "purple",
  "emerald",
  "amber",
  "rose",
  "cyan",
];

export function FolderGridView({
  categories,
  resources,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onAddResource,
}: FolderGridViewProps) {
  const [search, setSearch] = React.useState("");
  const [isNewMenuOpen, setIsNewMenuOpen] = React.useState(false);
  const [activeFolderMenuId, setActiveFolderMenuId] = React.useState<string | null>(null);

  const menuRef = React.useRef<HTMLDivElement>(null);
  const folderMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsNewMenuOpen(false);
      }
      if (folderMenuRef.current && !folderMenuRef.current.contains(e.target as Node)) {
        setActiveFolderMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate item count per folder
  const folderCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of resources) {
      if (r.category?.id) {
        counts.set(r.category.id, (counts.get(r.category.id) || 0) + 1);
      }
    }
    return counts;
  }, [resources]);

  // Count unfiled items
  const unfiledCount = React.useMemo(() => {
    return resources.filter((r) => !r.category).length;
  }, [resources]);

  // Filter folders by search query
  const filteredFolders = React.useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header Bar (Apple Minimalist Glass Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Resources
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted/60 text-muted-foreground border border-border/60">
              {categories.length} {categories.length === 1 ? "collection" : "collections"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-normal">
            Organized study materials, Instagram reels, videos, books, and articles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar with macOS Styling */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              type="text"
              placeholder="Search collections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 h-9 text-xs rounded-xl w-48 sm:w-60 bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-blue-500/50 backdrop-blur-sm"
            />
          </div>

          {/* Apple Style "+ New" Menu */}
          <div className="relative" ref={menuRef}>
            <Button
              onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
              className="rounded-xl text-xs font-semibold h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 border border-blue-400/30 gap-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New</span>
            </Button>

            {isNewMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-white/10 bg-popover/95 backdrop-blur-2xl shadow-2xl p-1.5 z-40 text-xs animate-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewMenuOpen(false);
                    onCreateFolder();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-foreground hover:bg-muted/70 transition-colors font-medium"
                >
                  <FolderPlus className="w-4 h-4 text-blue-500" />
                  <span>New Folder</span>
                </button>

                <div className="my-1 border-t border-border/40" />

                <button
                  type="button"
                  onClick={() => {
                    setIsNewMenuOpen(false);
                    onAddResource();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-foreground hover:bg-muted/70 transition-colors font-medium"
                >
                  <FilePlus className="w-4 h-4 text-emerald-500" />
                  <span>Add Resource</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {categories.length === 0 && unfiledCount === 0 ? (
        /* Apple-Grade Empty State */
        <div className="relative overflow-hidden p-12 sm:p-16 text-center rounded-3xl bg-gradient-to-b from-muted/30 via-muted/10 to-transparent border border-border/60 shadow-xl max-w-lg mx-auto space-y-5">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative flex justify-center">
            <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-md shadow-inner inline-flex">
              <MacFolderIcon size="xl" variant="blue" className="scale-110" />
            </div>
          </div>

          <div className="relative space-y-2">
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              No Collections Created Yet
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Create your first study folder to curate saved Instagram reels, YouTube videos, books, PDFs, and website articles.
            </p>
          </div>

          <div className="relative pt-2">
            <Button
              onClick={onCreateFolder}
              className="rounded-xl text-xs font-semibold h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30 gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create First Folder</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Apple Finder-Style Folder Collection Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {/* Folder Cards */}
            {filteredFolders.map((folder, index) => {
              const count = folderCounts.get(folder.id) || 0;
              const variant = COLOR_VARIANTS[index % COLOR_VARIANTS.length];
              const isMenuOpen = activeFolderMenuId === folder.id;

              return (
                <div
                  key={folder.id}
                  onClick={() => onSelectFolder(folder)}
                  className="group relative flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl bg-card/60 hover:bg-card border border-border/50 hover:border-border hover:shadow-xl hover:shadow-black/10 transition-all duration-300 cursor-pointer hover:scale-[1.03] active:scale-[0.98] backdrop-blur-sm"
                >
                  {/* Overflow Menu (Top Right on hover) */}
                  <div
                    className="absolute top-2.5 right-2.5 z-20"
                    ref={isMenuOpen ? folderMenuRef : null}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFolderMenuId(isMenuOpen ? null : folder.id);
                      }}
                      className="p-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/70 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Folder options"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-white/10 bg-popover/95 backdrop-blur-2xl shadow-xl p-1 z-30 text-xs text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveFolderMenuId(null);
                            onEditFolder(folder);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-muted/80 transition-colors font-medium"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Rename
                        </button>

                        <div className="my-1 border-t border-border/40" />

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveFolderMenuId(null);
                            onDeleteFolder(folder.id, folder.name);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* macOS 3D Folder Icon */}
                  <div className="my-2 transition-transform duration-300 group-hover:scale-105">
                    <MacFolderIcon size="lg" variant={variant} />
                  </div>

                  {/* Folder Title & Count */}
                  <div className="w-full mt-2 space-y-1">
                    <h3
                      className="font-semibold text-xs sm:text-sm text-foreground truncate px-1 group-hover:text-blue-500 transition-colors"
                      title={folder.name}
                    >
                      {folder.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {count} {count === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Unfiled Resources Card */}
            {unfiledCount > 0 && !search && (
              <div
                onClick={() =>
                  onSelectFolder({
                    id: "unfiled",
                    name: "Unfiled Resources",
                    slug: "unfiled",
                    level: 1,
                    parentId: null,
                    createdAt: new Date(),
                    children: [],
                  })
                }
                className="group relative flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl bg-muted/20 hover:bg-muted/40 border border-dashed border-border/70 hover:border-border hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.03] active:scale-[0.98] backdrop-blur-sm"
              >
                <div className="my-2 transition-transform duration-300 group-hover:scale-105">
                  <MacFolderIcon size="lg" variant="graphite" />
                </div>

                <div className="w-full mt-2 space-y-1">
                  <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate px-1 group-hover:text-foreground">
                    Unfiled
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {unfiledCount} {unfiledCount === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
