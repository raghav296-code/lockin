import { getCategoriesAction } from "@/actions/categories";
import { getResourcesAction } from "@/actions/resources";
import { ResourcesContainer } from "@/components/resources/resources-container";

export const metadata = {
  title: "Resources & Notes — Lock In",
  description:
    "Manage articles, books, papers, courses, documentation and structured notes organized into your knowledge tree.",
};

export default async function ResourcesPage() {
  const [categoriesRes, resourcesRes] = await Promise.all([
    getCategoriesAction(),
    getResourcesAction(),
  ]);

  const categories = categoriesRes.ok && categoriesRes.data ? categoriesRes.data : [];
  const resources = resourcesRes.ok && resourcesRes.data ? resourcesRes.data : [];

  return (
    <ResourcesContainer
      initialResources={resources}
      categories={categories}
    />
  );
}
