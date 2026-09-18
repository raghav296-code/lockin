import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getConceptsAction,
  getConceptGraphAction,
} from "@/actions/concepts";
import { getCategoriesAction } from "@/actions/categories";
import { ConceptsContainer } from "@/components/concepts/concepts-container";
import { Brain } from "lucide-react";

export const metadata: Metadata = {
  title: "Concept Mastery & Knowledge Graph — Lock In",
  description:
    "Interactive mental model visualizer, prerequisite dependency graph, and concept mastery tracking.",
};

export default async function ConceptsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  // Parallel data fetching for concepts, graph data, categories, and resources
  const [conceptsRes, graphRes, categoriesRes, resources] = await Promise.all([
    getConceptsAction(),
    getConceptGraphAction(),
    getCategoriesAction(),
    db.resource.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        type: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const concepts = conceptsRes.ok && conceptsRes.data ? conceptsRes.data : [];
  const graphData =
    graphRes.ok && graphRes.data ? graphRes.data : { nodes: [], links: [] };
  const categories =
    categoriesRes.ok && categoriesRes.data ? categoriesRes.data : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Brain className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Knowledge Graph & Concept Mastery
          </h1>
        </div>
        <p className="text-[13.5px] text-secondary max-w-2xl">
          Visualize prerequisites, connect mental models across subjects, and track your progression from Novice to Mastered.
        </p>
      </div>

      {/* Main Container */}
      <ConceptsContainer
        initialConcepts={concepts}
        graphData={graphData}
        categories={categories}
        availableResources={resources}
      />
    </div>
  );
}
