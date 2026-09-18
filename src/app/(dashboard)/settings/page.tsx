import Link from "next/link";
import { redirect } from "next/navigation";
import { Layers, ArrowRight, User, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { getProfileSettingsAction } from "@/actions/profile";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Settings — Lock In",
  description: "Account and learning hub settings",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const profileRes = await getProfileSettingsAction();
  const profileData =
    profileRes.ok && profileRes.data
      ? profileRes.data
      : {
          name: session.user.name || "",
          username: session.user.username || "",
          bio: "",
          isProfilePublic: false,
          email: session.user.email || "",
        };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure your personal identity, public showcase, and learning hub taxonomy.
        </p>
      </div>

      {/* Profile Form */}
      <ProfileSettingsForm initialData={profileData} />

      {/* Additional Settings Sections */}
      <div className="space-y-4 pt-2">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          Knowledge Organization
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Categories link */}
          <Link href="/settings/categories" className="group">
            <Card className="hover:border-accent/40 hover:shadow-md transition-all h-full bg-card/70 backdrop-blur-md rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="w-10 h-10 rounded-2xl bg-accent-tint text-accent flex items-center justify-center">
                  <Layers className="w-5 h-5 stroke-[1.75]" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </CardHeader>
              <CardContent className="space-y-1">
                <CardTitle className="text-base font-semibold">Categories Hierarchy</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Organize your knowledge tree into Fields, Subjects, and Topics.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
