export type SearchEntityType =
  | "resource"
  | "concept"
  | "skill"
  | "project"
  | "task"
  | "category";

export interface SearchResultItem {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle: string | null;
  href: string;
  badge?: string | null;
  iconUrl?: string | null;
  extra?: string | null;
}

export interface GroupedSearchResults {
  resources: SearchResultItem[];
  concepts: SearchResultItem[];
  skills: SearchResultItem[];
  projects: SearchResultItem[];
  tasks: SearchResultItem[];
  categories: SearchResultItem[];
  total: number;
}
