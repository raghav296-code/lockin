"use client";

import * as React from "react";
import type { ResourceItem } from "@/actions/resources";
import type { CategoryNode } from "@/actions/categories";
import type { ResourceStatus, ResourceType } from "@/lib/validations/resource";
import { FolderGridView } from "./folder-grid-view";
import { FolderDetailView } from "./folder-detail-view";
import { FolderDialog } from "./folder-dialog";
import { ResourceDialog, type ResourceFormData } from "./resource-dialog";
import { ResourceViewModal } from "./resource-view-modal";
import {
  createResourceAction,
  updateResourceAction,
  deleteResourceAction,
  updateResourceStatusAction,
  toggleFavoriteAction,
} from "@/actions/resources";
import {
  deleteCategoryAction,
} from "@/actions/categories";
import { useRouter } from "next/navigation";

interface ResourcesContainerProps {
  initialResources: ResourceItem[];
  categories: CategoryNode[];
}

export function ResourcesContainer({
  initialResources,
  categories: initialCategories,
}: ResourcesContainerProps) {
  const router = useRouter();

  // Local state synced from server props
  const [resources, setResources] = React.useState<ResourceItem[]>(initialResources);
  const [categories, setCategories] = React.useState<CategoryNode[]>(initialCategories);

  // Sync state when props change
  React.useEffect(() => {
    setResources(initialResources);
  }, [initialResources]);

  React.useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  // Current open folder (null = Home screen)
  const [selectedFolder, setSelectedFolder] = React.useState<CategoryNode | null>(null);

  // Modals state
  const [isFolderDialogOpen, setIsFolderDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<CategoryNode | null>(null);

  const [isResourceDialogOpen, setIsResourceDialogOpen] = React.useState(false);
  const [editingResource, setEditingResource] = React.useState<ResourceItem | null>(null);
  const [targetFolderForResource, setTargetFolderForResource] = React.useState<string | null>(null);
  const [targetTypeForResource, setTargetTypeForResource] = React.useState<ResourceType | undefined>(undefined);

  const [viewingResource, setViewingResource] = React.useState<ResourceItem | null>(null);

  // Keep selectedFolder in sync if categories change or get renamed
  React.useEffect(() => {
    if (selectedFolder && selectedFolder.id !== "unfiled") {
      const updated = categories.find((c) => c.id === selectedFolder.id);
      if (updated) {
        setSelectedFolder(updated);
      } else {
        // Folder was deleted
        setSelectedFolder(null);
      }
    }
  }, [categories, selectedFolder]);

  // Handle Folder Actions
  const handleOpenCreateFolder = () => {
    setEditingCategory(null);
    setIsFolderDialogOpen(true);
  };

  const handleOpenEditFolder = (folder: CategoryNode) => {
    setEditingCategory(folder);
    setIsFolderDialogOpen(true);
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete folder "${name}"? Any items in it will become unfiled.`)) {
      // Optimistic delete
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (selectedFolder?.id === id) {
        setSelectedFolder(null);
      }
      // Re-assign local resources to unfiled
      setResources((prev) =>
        prev.map((r) => (r.category?.id === id ? { ...r, category: null } : r))
      );

      const res = await deleteCategoryAction({ id });
      if (!res.ok) {
        router.refresh();
      } else {
        router.refresh();
      }
    }
  };

  // Handle Resource Actions
  const handleOpenAddResource = (
    defaultFolderId?: string | null,
    defaultType?: ResourceType
  ) => {
    setEditingResource(null);
    setTargetFolderForResource(
      defaultFolderId !== undefined
        ? defaultFolderId
        : selectedFolder?.id === "unfiled"
        ? null
        : selectedFolder?.id || null
    );
    setTargetTypeForResource(defaultType);
    setIsResourceDialogOpen(true);
  };

  const handleOpenEditResource = (resource: ResourceItem) => {
    setEditingResource(resource);
    setIsResourceDialogOpen(true);
  };

  const handleSaveResource = async (formData: ResourceFormData) => {
    if (formData.id) {
      // Update
      const res = await updateResourceAction({
        id: formData.id,
        title: formData.title,
        url: formData.url,
        type: formData.type,
        status: formData.status,
        categoryId: formData.categoryId,
        author: formData.author,
        estimatedMinutes: formData.estimatedMinutes,
        actualMinutes: formData.actualMinutes,
        isFavorite: formData.isFavorite,
        notes: formData.notes,
        summary: formData.summary,
      });

      if (res.ok) {
        // Update local state
        setResources((prev) =>
          prev.map((r) => {
            if (r.id === formData.id) {
              const matchedCat = categories.find((c) => c.id === formData.categoryId);
              return {
                ...r,
                title: formData.title,
                url: formData.url || null,
                type: formData.type,
                status: formData.status,
                author: formData.author || null,
                estimatedMinutes: formData.estimatedMinutes || null,
                isFavorite: formData.isFavorite || false,
                notes: formData.notes || null,
                category: matchedCat
                  ? { id: matchedCat.id, name: matchedCat.name, level: matchedCat.level, parent: null }
                  : null,
                updatedAt: new Date(),
              };
            }
            return r;
          })
        );
        router.refresh();
        return { ok: true };
      }
      return { ok: false, error: res.error };
    } else {
      // Create
      const res = await createResourceAction({
        title: formData.title,
        url: formData.url,
        type: formData.type,
        status: formData.status,
        categoryId: formData.categoryId,
        author: formData.author,
        estimatedMinutes: formData.estimatedMinutes,
        actualMinutes: formData.actualMinutes || 0,
        isFavorite: formData.isFavorite || false,
        notes: formData.notes,
        summary: formData.summary,
      });

      if (res.ok && res.data) {
        const newId = res.data.id;
        const matchedCat = categories.find((c) => c.id === formData.categoryId);
        const newItem: ResourceItem = {
          id: newId,
          title: formData.title,
          url: formData.url || null,
          type: formData.type,
          status: formData.status,
          author: formData.author || null,
          estimatedMinutes: formData.estimatedMinutes || null,
          actualMinutes: formData.actualMinutes || 0,
          isFavorite: formData.isFavorite || false,
          notes: formData.notes || null,
          summary: formData.summary || null,
          rating: null,
          completedAt: formData.status === "COMPLETED" ? new Date() : null,
          createdAt: new Date(),
          updatedAt: new Date(),
          category: matchedCat
            ? { id: matchedCat.id, name: matchedCat.name, level: matchedCat.level, parent: null }
            : null,
          tags: [],
        };

        setResources((prev) => [newItem, ...prev]);
        router.refresh();
        return { ok: true };
      }
      return { ok: false, error: res.error };
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      setResources((prev) => prev.filter((r) => r.id !== id));
      if (viewingResource?.id === id) {
        setViewingResource(null);
      }
      await deleteResourceAction({ id });
      router.refresh();
    }
  };

  const handleStatusChange = async (id: string, status: ResourceStatus) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    if (viewingResource?.id === id) {
      setViewingResource((prev) => (prev ? { ...prev, status } : null));
    }
    await updateResourceStatusAction({ id, status });
    router.refresh();
  };

  const handleToggleFavorite = async (id: string) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
    );
    if (viewingResource?.id === id) {
      setViewingResource((prev) =>
        prev ? { ...prev, isFavorite: !prev.isFavorite } : null
      );
    }
    await toggleFavoriteAction({ id });
    router.refresh();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {selectedFolder ? (
        <FolderDetailView
          folder={selectedFolder}
          resources={resources}
          onBack={() => setSelectedFolder(null)}
          onAddResource={(type) =>
            handleOpenAddResource(
              selectedFolder.id === "unfiled" ? null : selectedFolder.id,
              type
            )
          }
          onEditFolder={handleOpenEditFolder}
          onDeleteFolder={handleDeleteFolder}
          onViewResource={(r) => setViewingResource(r)}
          onEditResource={handleOpenEditResource}
          onDeleteResource={handleDeleteResource}
          onStatusChange={handleStatusChange}
          onToggleFavorite={handleToggleFavorite}
        />
      ) : (
        <FolderGridView
          categories={categories}
          resources={resources}
          onSelectFolder={(folder) => setSelectedFolder(folder)}
          onCreateFolder={handleOpenCreateFolder}
          onEditFolder={handleOpenEditFolder}
          onDeleteFolder={handleDeleteFolder}
          onAddResource={() => handleOpenAddResource(null)}
        />
      )}

      {/* Folder Create / Rename Modal */}
      <FolderDialog
        isOpen={isFolderDialogOpen}
        onClose={() => setIsFolderDialogOpen(false)}
        editingCategory={editingCategory}
        onSuccess={() => router.refresh()}
      />

      {/* Unified Add / Edit Resource Modal */}
      <ResourceDialog
        isOpen={isResourceDialogOpen}
        onClose={() => setIsResourceDialogOpen(false)}
        categories={categories}
        initialResource={editingResource}
        defaultCategoryId={targetFolderForResource}
        defaultType={targetTypeForResource}
        onSubmit={handleSaveResource}
      />

      {/* Resource Quick View Modal */}
      <ResourceViewModal
        isOpen={!!viewingResource}
        onClose={() => setViewingResource(null)}
        resource={viewingResource}
        onEdit={handleOpenEditResource}
        onDelete={handleDeleteResource}
        onStatusChange={handleStatusChange}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}
