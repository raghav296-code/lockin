"use client";

import * as React from "react";
import { Folder, ChevronRight, ChevronDown, Check, Search, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CategoryNode } from "@/actions/categories";

interface TreePickerProps {
  categories: CategoryNode[];
  selectedId?: string | null;
  onSelect: (categoryId: string | null) => void;
  className?: string;
  allowClear?: boolean;
  placeholder?: string;
}

export function TreePicker({
  categories,
  selectedId,
  onSelect,
  className,
  allowClear = true,
  placeholder = "Search categories...",
}: TreePickerProps) {
  const [search, setSearch] = React.useState("");
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getLevelBadge = (level: number) => {
    switch (level) {
      case 1:
        return <Badge variant="default" className="text-[10px] px-1.5 py-0">Field</Badge>;
      case 2:
        return <Badge variant="purple" className="text-[10px] px-1.5 py-0">Subject</Badge>;
      case 3:
        return <Badge variant="teal" className="text-[10px] px-1.5 py-0">Topic</Badge>;
      default:
        return null;
    }
  };

  const renderNodes = (nodes: CategoryNode[], depth = 0) => {
    return nodes.map((node) => {
      const isSelected = selectedId === node.id;
      const isExpanded = expanded[node.id] ?? true;
      const hasChildren = node.children && node.children.length > 0;

      // Filter by search query if any
      const matchesSearch =
        !search ||
        node.name.toLowerCase().includes(search.toLowerCase()) ||
        node.children.some((c) =>
          c.name.toLowerCase().includes(search.toLowerCase())
        );

      if (!matchesSearch) return null;

      return (
        <div key={node.id} className="select-none">
          <div
            onClick={() => onSelect(node.id)}
            className={cn(
              "flex items-center justify-between py-2 px-3 rounded-xl text-[14px] transition-colors cursor-pointer group",
              isSelected
                ? "bg-accent/10 text-accent font-semibold"
                : "text-foreground hover:bg-muted-bg"
            )}
            style={{ paddingLeft: `${Math.max(12, depth * 20 + 12)}px` }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => toggleExpand(node.id, e)}
                  className="w-5 h-5 flex items-center justify-center text-secondary hover:text-foreground rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : (
                <span className="w-5 h-5 flex items-center justify-center text-muted">
                  <Hash className="w-3 h-3" />
                </span>
              )}

              <Folder className={cn("w-4 h-4 shrink-0", isSelected ? "text-accent" : "text-secondary")} />
              <span className="truncate">{node.name}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {getLevelBadge(node.level)}
              {isSelected && <Check className="w-4 h-4 text-accent stroke-[2.2]" />}
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div className="space-y-0.5">
              {renderNodes(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className={cn("space-y-2 border border-border rounded-2xl bg-surface p-3", className)}>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <Input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-[13px] bg-background"
        />
      </div>

      <div className="max-h-60 overflow-y-auto space-y-0.5 pt-1">
        {allowClear && (
          <div
            onClick={() => onSelect(null)}
            className={cn(
              "flex items-center justify-between py-1.5 px-3 rounded-xl text-[13px] transition-colors cursor-pointer",
              !selectedId
                ? "bg-accent/10 text-accent font-semibold"
                : "text-secondary hover:bg-muted-bg"
            )}
          >
            <span>None (Uncategorized)</span>
            {!selectedId && <Check className="w-4 h-4 text-accent stroke-[2.2]" />}
          </div>
        )}

        {categories.length === 0 ? (
          <div className="text-center py-6 text-[13px] text-muted">
            No categories created yet.
          </div>
        ) : (
          renderNodes(categories)
        )}
      </div>
    </div>
  );
}
