import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSkillsAction } from "@/actions/skills";
import { getProjectsAction } from "@/actions/projects";
import { SkillsContainer } from "@/components/skills/skills-container";
import { Award } from "lucide-react";

export const metadata: Metadata = {
  title: "Skills & Portfolio Projects — Lock In",
  description:
    "Track practical competencies, hierarchical tech stacks, and live portfolio project demos with in-app previews.",
};

export default async function SkillsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  const [skillsRes, projectsRes, categories] = await Promise.all([
    getSkillsAction(),
    getProjectsAction(),
    db.category.findMany({
      where: { userId },
      select: { id: true, name: true, level: true },
      orderBy: [{ level: "asc" }, { name: "asc" }],
    }),
  ]);

  const initialSkills = skillsRes.ok && skillsRes.data ? skillsRes.data : [];
  const initialProjects = projectsRes.ok && projectsRes.data ? projectsRes.data : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-accent-tint text-accent">
            <Award className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Skills & Competencies
          </h1>
        </div>
        <p className="text-[13.5px] text-secondary max-w-2xl">
          Track technical abilities, domain proficiencies, and academic capabilities with live progress tracking.
        </p>
      </div>

      {/* Main Container */}
      <SkillsContainer
        initialSkills={initialSkills}
        initialProjects={initialProjects}
        categories={categories}
      />
    </div>
  );
}
