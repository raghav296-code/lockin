"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CategoryNode } from "@/actions/categories";
import type {
  ConceptItem,
  ConceptGraphData,
} from "@/actions/concepts";
import {
  createConceptAction,
  updateConceptAction,
  updateMasteryLevelAction,
  toggleConceptFavoriteAction,
  deleteConceptAction,
} from "@/actions/concepts";
import type {
  CreateConceptInput,
  UpdateConceptInput,
  MasteryLevel,
  ConceptImportance,
} from "@/lib/validations/concept";
import { ConceptFilters, type ViewMode } from "./concept-filters";
import { ConceptCard } from "./concept-card";
import { ConceptTable } from "./concept-table";
import { KnowledgeGraphVisualizer } from "./knowledge-graph-visualizer";
import { ConceptDialog, type SimpleResourceOption } from "./concept-dialog";
import { ConceptDetailDrawer } from "./concept-detail-drawer";

interface ConceptsContainerProps {
  initialConcepts: ConceptItem[];
  graphData: ConceptGraphData;
  categories: CategoryNode[];
  availableResources: SimpleResourceOption[];
}

export function ConceptsContainer({
  initialConcepts,
  graphData: initialGraphData,
  categories,
  availableResources,
}: ConceptsContainerProps) {
  const router = useRouter();

  // Local state for concepts and graph to enable optimistic updates
  const [concepts, setConcepts] = React.useState<ConceptItem[]>(initialConcepts);
  const [graphData, setGraphData] = React.useState<ConceptGraphData>(initialGraphData);

  // Filter and view state
  const [viewMode, setViewMode] = React.useState<ViewMode>("graph");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedMastery, setSelectedMastery] = React.useState<MasteryLevel | "ALL">("ALL");
  const [selectedImportance, setSelectedImportance] = React.useState<ConceptImportance | "ALL">("ALL");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [isFavoriteOnly, setIsFavoriteOnly] = React.useState(false);

  // Modal / Drawer state
  const [selectedConceptId, setSelectedConceptId] = React.useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingConcept, setEditingConcept] = React.useState<ConceptItem | null>(null);

  // Filtered concepts calculation
  const filteredConcepts = React.useMemo(() => {
    return concepts.filter((c) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesSummary = c.summary?.toLowerCase().includes(q);
        const matchesNotes = c.notes?.toLowerCase().includes(q);
        const matchesTag = c.tags.some((t) => t.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSummary && !matchesNotes && !matchesTag) {
          return false;
        }
      }

      // Mastery filter
      if (selectedMastery !== "ALL" && c.masteryLevel !== selectedMastery) {
        return false;
      }

      // Importance filter
      if (selectedImportance !== "ALL" && c.importance !== selectedImportance) {
        return false;
      }

      // Category filter
      if (selectedCategoryId) {
        if (!c.category) return false;
        // Match direct category or parent
        const isMatch =
          c.category.id === selectedCategoryId ||
          c.category.parent?.id === selectedCategoryId ||
          c.category.parent?.parent?.id === selectedCategoryId;
        if (!isMatch) return false;
      }

      // Favorite filter
      if (isFavoriteOnly && !c.isFavorite) {
        return false;
      }

      return true;
    });
  }, [
    concepts,
    searchQuery,
    selectedMastery,
    selectedImportance,
    selectedCategoryId,
    isFavoriteOnly,
  ]);

  // Filtered graph data calculation
  const filteredGraphData = React.useMemo(() => {
    const validIds = new Set(filteredConcepts.map((c) => c.id));
    const nodes = graphData.nodes.filter((n) => validIds.has(n.id));
    const links = graphData.links.filter(
      (l) => validIds.has(l.source) && validIds.has(l.target)
    );
    return { nodes, links };
  }, [graphData, filteredConcepts]);

  // Counts for filters
  const counts = React.useMemo(() => {
    const res = {
      total: concepts.length,
      NOVICE: 0,
      FAMILIAR: 0,
      PROFICIENT: 0,
      MASTERED: 0,
      favorites: 0,
    };
    for (const c of concepts) {
      res[c.masteryLevel] = (res[c.masteryLevel] || 0) + 1;
      if (c.isFavorite) res.favorites += 1;
    }
    return res;
  }, [concepts]);

  // Selected concept for drawer
  const selectedConcept = React.useMemo(() => {
    if (!selectedConceptId) return null;
    return concepts.find((c) => c.id === selectedConceptId) || null;
  }, [concepts, selectedConceptId]);

  // Action Handlers
  const handleMasteryChange = async (id: string, newLevel: MasteryLevel) => {
    // Optimistic update
    setConcepts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, masteryLevel: newLevel } : c))
    );
    setGraphData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === id ? { ...n, masteryLevel: newLevel } : n
      ),
    }));

    const res = await updateMasteryLevelAction({ id, masteryLevel: newLevel });
    if (!res.ok) {
      // Revert if error
      router.refresh();
    }
  };

  const handleToggleFavorite = async (id: string) => {
    // Optimistic update
    setConcepts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
    setGraphData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === id ? { ...n, isFavorite: !n.isFavorite } : n
      ),
    }));

    const res = await toggleConceptFavoriteAction(id);
    if (!res.ok) {
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this concept and its graph relations?")) {
      return;
    }

    // Optimistic remove
    setConcepts((prev) => prev.filter((c) => c.id !== id));
    setGraphData((prev) => ({
      nodes: prev.nodes.filter((n) => n.id !== id),
      links: prev.links.filter((l) => l.source !== id && l.target !== id),
    }));
    if (selectedConceptId === id) {
      setSelectedConceptId(null);
    }

    const res = await deleteConceptAction(id);
    if (!res.ok) {
      router.refresh();
    }
  };

  const handleOpenCreate = () => {
    setEditingConcept(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (concept: ConceptItem) => {
    setEditingConcept(concept);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (
    data: CreateConceptInput | UpdateConceptInput
  ): Promise<boolean> => {
    if ("id" in data && data.id) {
      const res = await updateConceptAction(data as UpdateConceptInput);
      if (res.ok && res.data) {
        router.refresh();
        return true;
      }
      return false;
    } else {
      const res = await createConceptAction(data as CreateConceptInput);
      if (res.ok && res.data) {
        router.refresh();
        return true;
      }
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Segmented View Bar */}
      <ConceptFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedMastery={selectedMastery}
        onMasteryChange={setSelectedMastery}
        selectedImportance={selectedImportance}
        onImportanceChange={setSelectedImportance}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={setSelectedCategoryId}
        isFavoriteOnly={isFavoriteOnly}
        onToggleFavoriteOnly={() => setIsFavoriteOnly((prev) => !prev)}
        categories={categories}
        counts={counts}
        onNewConcept={handleOpenCreate}
      />

      {/* Main Content Area Based on View Mode */}
      {viewMode === "graph" && (
        <div className="space-y-3">
          <KnowledgeGraphVisualizer
            nodes={filteredGraphData.nodes}
            links={filteredGraphData.links}
            selectedNodeId={selectedConceptId}
            onSelectNode={(id) => setSelectedConceptId(id)}
            searchQuery={searchQuery}
          />
        </div>
      )}

      {viewMode === "grid" && (
        <div>
          {filteredConcepts.length === 0 ? (
            <div className="rounded-[22px] border border-border bg-surface p-12 text-center space-y-3">
              <Brain className="w-10 h-10 text-muted mx-auto" />
              <h3 className="text-[15px] font-semibold text-foreground">
                No concepts found
              </h3>
              <p className="text-[13px] text-secondary max-w-sm mx-auto">
                No concepts match your filter criteria. Create your first concept to start building your knowledge graph.
              </p>
              <Button
                onClick={handleOpenCreate}
                className="mt-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-[13px]"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create Concept
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConcepts.map((concept) => (
                <ConceptCard
                  key={concept.id}
                  concept={concept}
                  onView={(c) => setSelectedConceptId(c.id)}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  onMasteryChange={handleMasteryChange}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === "table" && (
        <ConceptTable
          concepts={filteredConcepts}
          onView={(c) => setSelectedConceptId(c.id)}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onMasteryChange={handleMasteryChange}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* Concept Slide-over Inspector Drawer */}
      <ConceptDetailDrawer
        isOpen={Boolean(selectedConceptId)}
        onClose={() => setSelectedConceptId(null)}
        concept={selectedConcept}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onMasteryChange={handleMasteryChange}
        onToggleFavorite={handleToggleFavorite}
        onSelectConceptById={(id) => setSelectedConceptId(id)}
      />

      {/* Concept Create / Edit Modal Dialog */}
      <ConceptDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingConcept(null);
        }}
        onSubmit={handleFormSubmit}
        concept={editingConcept}
        categories={categories}
        allConcepts={concepts}
        availableResources={availableResources}
      />
    </div>
  );
}
