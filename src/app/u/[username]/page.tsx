import { Metadata } from "next";
import Link from "next/link";
import { Lock, UserX, ArrowLeft } from "lucide-react";
import { getPublicProfileAction } from "@/actions/profile";
import { PublicProfileView } from "@/components/profile/public-profile-view";

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const res = await getPublicProfileAction(username);

  if (!res.ok || !res.data) {
    return {
      title: `@${username} | Lock In`,
      description: "Learning portfolio and knowledge graph on Lock In.",
    };
  }

  const user = res.data.user;
  const name = user.name || user.username;

  return {
    title: `${name} (@${user.username}) — Lock In`,
    description:
      user.bio ||
      `Explore ${name}'s verified skills, projects, and learning knowledge graph on Lock In.`,
    openGraph: {
      title: `${name} | Lock In Learning Portfolio`,
      description: user.bio || `Verified competencies and portfolio projects.`,
      type: "profile",
      username: user.username || undefined,
    },
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params;
  const res = await getPublicProfileAction(username);

  if (!res.ok || !res.data) {
    const isPrivate = res.error?.includes("private");

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center selection:bg-primary/20">
        <div className="w-full max-w-md p-8 rounded-3xl bg-card/80 backdrop-blur-xl border border-border/70 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
            {isPrivate ? <Lock className="w-8 h-8" /> : <UserX className="w-8 h-8" />}
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {isPrivate ? "Profile is Private" : "User Not Found"}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isPrivate
                ? `@${username} has set their learning profile to private.`
                : `We couldn't find a scholar with the username @${username}.`}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:opacity-95 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Lock In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <PublicProfileView data={res.data} />;
}
