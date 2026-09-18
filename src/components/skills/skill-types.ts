import type { SkillItem } from "@/actions/skills";
import type { ProjectItem } from "@/actions/projects";

export type { SkillItem, ProjectItem };

export interface SkillCategoryOption {
  id: string;
  name: string;
  level: number;
}

export interface ParentSkillOption {
  id: string;
  name: string;
  iconUrl: string | null;
}
