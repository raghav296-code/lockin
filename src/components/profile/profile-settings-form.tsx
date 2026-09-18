"use client";

import { useState } from "react";
import { User, Globe, Lock, ExternalLink, Check, Loader2, AlertCircle } from "lucide-react";
import { updateProfileSettingsAction } from "@/actions/profile";
import Link from "next/link";

interface ProfileSettingsFormProps {
  initialData: {
    name: string | null;
    username: string | null;
    bio: string | null;
    isProfilePublic: boolean;
    email: string;
  };
}

export function ProfileSettingsForm({ initialData }: ProfileSettingsFormProps) {
  const [name, setName] = useState(initialData.name || "");
  const [username, setUsername] = useState(initialData.username || "");
  const [bio, setBio] = useState(initialData.bio || "");
  const [isProfilePublic, setIsProfilePublic] = useState(initialData.isProfilePublic);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedSuccess(false);
    setIsSaving(true);

    try {
      const res = await updateProfileSettingsAction({
        name,
        username,
        bio,
        isProfilePublic,
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        setError(res.error || "Failed to update profile settings.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>Profile preferences saved successfully!</span>
        </div>
      )}

      <div className="p-6 rounded-3xl bg-card/70 backdrop-blur-md border border-border/60 shadow-sm space-y-5">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          Public Profile & Identity
        </h3>

        {/* Display Name */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Rivera"
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Username (Used for your public URL)
          </label>
          <div className="flex items-center rounded-xl bg-background border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/20">
            <span className="px-3 text-xs text-muted-foreground font-mono bg-muted/40 border-r border-border py-2.5">
              lockin.study/u/
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              placeholder="alex"
              className="w-full px-3 py-2.5 bg-transparent text-sm focus:outline-none font-mono"
              required
            />
          </div>
          {username && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Your shareable profile:</span>
              <Link
                href={`/u/${username}`}
                target="_blank"
                className="text-primary hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
              >
                /u/{username} <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={initialData.email}
            disabled
            className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border/50 text-sm text-muted-foreground cursor-not-allowed"
          />
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Email address is strictly private and never displayed publicly.
          </span>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Bio / Headline
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Passionate systems engineer studying distributed systems, ML architectures, and compilers..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>
      </div>

      {/* Privacy & Visibility Control */}
      <div className="p-6 rounded-3xl bg-card/70 backdrop-blur-md border border-border/60 shadow-sm space-y-4">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          Profile Visibility
        </h3>

        <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-muted/30 border border-border/40">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              {isProfilePublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {isProfilePublic ? "Public Profile is Active" : "Private Profile"}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-md">
                {isProfilePublic
                  ? "Anyone with your link can view your learned skills tree, portfolio projects, and study milestones."
                  : "Only you can see your profile. Visitors to your public URL will see a private profile message."}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={isProfilePublic}
              onChange={(e) => setIsProfilePublic(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-semibold shadow-md hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              Save Profile Preferences
            </>
          )}
        </button>
      </div>
    </form>
  );
}
