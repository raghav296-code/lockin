import { getCategoriesAction } from "@/actions/categories";
import { TreeManager } from "@/components/categories/tree-manager";
import { TreePicker } from "@/components/categories/tree-picker";
import { Eye } from "lucide-react";

export const metadata = {
  title: "Categories — Lock In",
  description: "Manage your 3-level learning categories hierarchy (Field > Subject > Topic)",
};

export default async function CategoriesPage() {
  const result = await getCategoriesAction();
  const categories = result.ok && result.data ? result.data : [];

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-300">
      {/* Interactive Category Tree Manager */}
      <section className="space-y-6">
        <TreeManager initialCategories={categories} />
      </section>

      {/* Standalone TreePicker Isolation Preview */}
      <section className="pt-6 border-t border-border space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-secondary" />
            <h3 className="text-[17px] font-semibold text-foreground">
              TreePicker Component Isolation Test
            </h3>
          </div>
          <p className="text-[13px] text-secondary">
            This demonstrates how the reusable TreePicker will appear inside resource and concept creation forms in upcoming steps.
          </p>
        </div>

        <div className="max-w-md">
          <TreePicker
            categories={categories}
            selectedId={null}
            onSelect={() => {}}
          />
        </div>
      </section>
    </div>
  );
}
