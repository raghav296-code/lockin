"use client";

import * as React from "react";
import {
  FolderPlus,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  Hash,
  Loader2,
  AlertCircle,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  createCategoryAction,
  renameCategoryAction,
  deleteCategoryAction,
  type CategoryNode,
} from "@/actions/categories";

interface TreeManagerProps {
  initialCategories: CategoryNode[];
}

export function TreeManager({ initialCategories }: TreeManagerProps) {
  const [categories, setCategories] = React.useState<CategoryNode[]>(initialCategories);
  const [prevInitial, setPrevInitial] = React.useState(initialCategories);

  if (prevInitial !== initialCategories) {
    setPrevInitial(initialCategories);
    setCategories(initialCategories);
  }

  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [newFieldName, setNewFieldName] = React.useState("");
  const [isCreatingField, setIsCreatingField] = React.useState(false);
  const [activeChildInput, setActiveChildInput] = React.useState<{
    parentId: string;
    level: 2 | 3;
  } | null>(null);
  const [childName, setChildName] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Create Level 1 Field
  async function handleCreateField(e: React.FormEvent) {
    e.preventDefault();
    if (!newFieldName.trim()) return;

    setLoading(true);
    setError(null);

    const result = await createCategoryAction({
      name: newFieldName.trim(),
      level: 1,
    });

    if (!result.ok) {
      setError(result.error || "Failed to create field");
      setLoading(false);
      return;
    }

    setNewFieldName("");
    setIsCreatingField(false);
    setLoading(false);
    window.location.reload();
  }

  // Create Child (Subject or Topic)
  async function handleCreateChild(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChildInput || !childName.trim()) return;

    setLoading(true);
    setError(null);

    const result = await createCategoryAction({
      name: childName.trim(),
      parentId: activeChildInput.parentId,
      level: activeChildInput.level,
    });

    if (!result.ok) {
      setError(result.error || "Failed to create category");
      setLoading(false);
      return;
    }

    setChildName("");
    setActiveChildInput(null);
    setLoading(false);
    window.location.reload();
  }

  // Rename category
  async function handleRename(id: string) {
    if (!editingName.trim()) return;

    setLoading(true);
    setError(null);

    const result = await renameCategoryAction({
      id,
      name: editingName.trim(),
    });

    if (!result.ok) {
      setError(result.error || "Failed to rename category");
      setLoading(false);
      return;
    }

    setEditingId(null);
    setEditingName("");
    setLoading(false);
    window.location.reload();
  }

  // Delete category
  async function handleDelete(id: string, name: string) {
    const confirm = window.confirm(
      `Are you sure you want to delete "${name}" and all subcategories inside it?`
    );
    if (!confirm) return;

    setLoading(true);
    setError(null);

    const result = await deleteCategoryAction({ id });

    if (!result.ok) {
      setError(result.error || "Failed to delete category");
      setLoading(false);
      return;
    }

    setLoading(false);
    window.location.reload();
  }

  const getLevelBadge = (level: number) => {
    switch (level) {
      case 1:
        return <Badge variant="default" className="text-[11px]">Field</Badge>;
      case 2:
        return <Badge variant="purple" className="text-[11px]">Subject</Badge>;
      case 3:
        return <Badge variant="teal" className="text-[11px]">Topic</Badge>;
      default:
        return null;
    }
  };

  const renderNodes = (nodes: CategoryNode[], depth = 0) => {
    return nodes.map((node) => {
      const isExpanded = expanded[node.id] ?? true;
      const hasChildren = node.children && node.children.length > 0;
      const isEditing = editingId === node.id;
      const canAddChild = node.level < 3;

      return (
        <div key={node.id} className="space-y-1 select-none">
          <div
            className={cn(
              "flex items-center justify-between p-3 rounded-2xl border border-border bg-surface hover:border-border-hover transition-all group",
              depth === 0 && "font-medium"
            )}
            style={{ marginLeft: `${depth * 24}px` }}
          >
            {/* Left Name & Controls */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleExpand(node.id)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-secondary hover:text-foreground hover:bg-muted-bg"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <span className="w-6 h-6 flex items-center justify-center text-muted">
                  <Hash className="w-3.5 h-3.5" />
                </span>
              )}

              <Folder
                className={cn(
                  "w-4 h-4 shrink-0",
                  node.level === 1
                    ? "text-accent"
                    : node.level === 2
                    ? "text-purple"
                    : "text-teal"
                )}
              />

              {isEditing ? (
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <Input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-8 text-[14px]"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => handleRename(node.id)}
                    disabled={loading}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="truncate text-[15px]">{node.name}</span>
                  {getLevelBadge(node.level)}
                </div>
              )}
            </div>

            {/* Right Action Buttons */}
            {!isEditing && (
              <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                {canAddChild && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-[12px] gap-1"
                    onClick={() => {
                      setActiveChildInput({
                        parentId: node.id,
                        level: (node.level + 1) as 2 | 3,
                      });
                      setExpanded((prev) => ({ ...prev, [node.id]: true }));
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add {node.level === 1 ? "Subject" : "Topic"}</span>
                  </Button>
                )}

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-secondary hover:text-foreground"
                  onClick={() => {
                    setEditingId(node.id);
                    setEditingName(node.name);
                  }}
                  aria-label="Rename category"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-secondary hover:text-danger hover:bg-danger-tint"
                  onClick={() => handleDelete(node.id, node.name)}
                  aria-label="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Inline Add Child Input Form */}
          {activeChildInput?.parentId === node.id && (
            <form
              onSubmit={handleCreateChild}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-accent/30 bg-accent-tint/30"
              style={{ marginLeft: `${(depth + 1) * 24}px` }}
            >
              <Input
                type="text"
                placeholder={`Name of new ${
                  activeChildInput.level === 2 ? "Subject" : "Topic"
                }...`}
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="h-8 text-[13px] bg-surface"
                autoFocus
              />
              <Button size="sm" type="submit" disabled={loading || !childName.trim()}>
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => {
                  setActiveChildInput(null);
                  setChildName("");
                }}
              >
                Cancel
              </Button>
            </form>
          )}

          {/* Children nodes */}
          {hasChildren && isExpanded && (
            <div className="space-y-1 pt-1">
              {renderNodes(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Categories Hierarchy
            </h2>
          </div>
          <p className="text-[14px] text-secondary">
            Structured 3-level tree: <span className="font-medium text-foreground">Field</span> (e.g. Computer Science) → <span className="font-medium text-foreground">Subject</span> (e.g. Algorithms) → <span className="font-medium text-foreground">Topic</span> (e.g. Sorting).
          </p>
        </div>

        {!isCreatingField && (
          <Button
            onClick={() => setIsCreatingField(true)}
            className="h-10 px-4 rounded-xl gap-2 font-semibold shadow-sm"
          >
            <FolderPlus className="w-4 h-4 stroke-[2]" />
            <span>Add Field</span>
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-xl bg-danger-tint border border-danger/20 text-danger text-[13px] flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Field Form */}
      {isCreatingField && (
        <form
          onSubmit={handleCreateField}
          className="p-4 rounded-2xl border border-accent/40 bg-surface shadow-sm space-y-3"
        >
          <div className="flex items-center gap-2">
            <Badge variant="default">New Level 1 Field</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="text"
              placeholder="Field name (e.g., Mathematics, Artificial Intelligence)"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              className="h-10"
              autoFocus
            />
            <Button type="submit" disabled={loading || !newFieldName.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Field"}
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setIsCreatingField(false);
                setNewFieldName("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Tree Structure */}
      {categories.length === 0 && !isCreatingField ? (
        <Card className="border border-dashed border-border p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-accent-tint text-accent flex items-center justify-center mx-auto">
            <FolderPlus className="w-6 h-6 stroke-[1.75]" />
          </div>
          <h3 className="text-[17px] font-semibold text-foreground">
            No categories yet
          </h3>
          <p className="text-[14px] text-secondary max-w-sm mx-auto">
            Create your first Field to start organizing resources and concepts.
          </p>
          <Button
            onClick={() => setIsCreatingField(true)}
            variant="outline"
            className="mt-2"
          >
            Create first Field
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">{renderNodes(categories)}</div>
      )}
    </div>
  );
}
