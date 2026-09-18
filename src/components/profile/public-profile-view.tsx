"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Share2,
  Check,
  Award,
  BookOpen,
  Brain,
  Clock,
  ExternalLink,
  Code2,
  Monitor,
  Sparkles,
  Layers,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";
import type { PublicProfileData } from "@/actions/profile";
import { ProjectPreviewModal } from "@/components/projects/project-preview-modal";
import type { ProjectItem } from "@/components/skills/skill-types";

interface PublicProfileViewProps {
  data: PublicProfileData;
}

export function PublicProfileView({ data }: PublicProfileViewProps) {
  const { user, stats, skills, projects, concepts } = data;
  const [copied, setCopied] = useState(false);
  const [activePreviewProject, setActivePreviewProject] = useState<ProjectItem | null>(null);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 selection:bg-primary/20">
      {/* Top Minimal Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-surface/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
              LI
            </div>
            <span className="font-semibold text-base tracking-tight text-foreground">
              Lock In
            </span>
          </Link>

          <button
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold border border-border/60 transition-all flex items-center gap-2 shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Profile</span>
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 space-y-10">
        {/* Apple Hero Showcase Card */}
        <section className="relative overflow-hidden p-8 sm:p-10 rounded-3xl bg-card/80 backdrop-blur-2xl border border-border/70 shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar Squircle */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-accent/20 to-primary/10 border border-border/80 flex items-center justify-center text-accent font-bold text-2xl sm:text-3xl shadow-sm shrink-0">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.name || "User"}
                    className="w-full h-full object-cover rounded-3xl"
                  />
                ) : (
                  <span>{(user.name || user.username || "U")[0].toUpperCase()}</span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {user.name || "Learning Scholar"}
                  </h1>
                  {user.username && (
                    <span className="px-2.5 py-0.5 rounded-full bg-accent-tint text-accent text-xs font-mono font-medium border border-accent/20">
                      @{user.username}
                    </span>
                  )}
                </div>

                {user.bio ? (
                  <p className="text-sm text-secondary max-w-xl leading-relaxed mt-1.5">
                    {user.bio}
                  </p>
                ) : (
                  <p className="text-xs text-muted">
                    Building a verified knowledge graph and portfolio on Lock In.
                  </p>
                )}

                <div className="text-[11px] text-muted font-mono pt-1">
                  Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Apple Activity Metric Rings */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-card/60 backdrop-blur-md border border-border/60 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-secondary">Study Time</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {stats.totalStudyHours} <span className="text-xs font-normal text-secondary">hrs</span>
              </div>
              <div className="text-xs text-muted mt-0.5">Deep focus sessions</div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-card/60 backdrop-blur-md border border-border/60 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-secondary">Skills & Tech</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {stats.skillsCount}
              </div>
              <div className="text-xs text-muted mt-0.5">Competency trees</div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-card/60 backdrop-blur-md border border-border/60 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-secondary">Mastered Concepts</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {stats.masteredConcepts}
              </div>
              <div className="text-xs text-muted mt-0.5">Knowledge nodes</div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-card/60 backdrop-blur-md border border-border/60 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-secondary">Completed Works</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {stats.completedResources}
              </div>
              <div className="text-xs text-muted mt-0.5">Papers, books & courses</div>
            </div>
          </div>
        </section>

        {/* Skills & Hierarchy Section */}
        {skills.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Skills & Tech Stack
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="p-5 rounded-3xl bg-card/70 backdrop-blur-md border border-border/60 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-muted/60 border border-border/50 flex items-center justify-center p-2 shrink-0">
                        {skill.iconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={skill.iconUrl}
                            alt={skill.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Award className="w-5 h-5 text-accent" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {skill.name}
                        </h3>
                        <span className="text-[11px] font-mono text-muted">
                          {skill.progress}% Proficiency
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-semibold font-mono text-accent">
                      {skill.progress}%
                    </span>
                  </div>

                  {/* 6px Apple Progress Meter */}
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${skill.progress}%` }}
                    />
                  </div>

                  {/* Sub-skills */}
                  {skill.children.length > 0 && (
                    <div className="pt-2 border-t border-border/40 space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">
                        Sub-competencies & Frameworks
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {skill.children.map((child) => (
                          <div
                            key={child.id}
                            className="p-2 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              {child.iconUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={child.iconUrl}
                                  alt={child.name}
                                  className="w-3.5 h-3.5 object-contain shrink-0"
                                />
                              )}
                              <span className="truncate font-medium text-foreground">
                                {child.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-muted shrink-0 ml-1">
                              {child.progress}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Portfolio Projects Section */}
        {projects.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Monitor className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Portfolio Projects & Demos
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-6 rounded-3xl bg-card/70 backdrop-blur-md border border-border/60 shadow-xs flex flex-col justify-between group hover:border-border transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold tracking-tight text-foreground group-hover:text-accent transition-colors">
                        {project.name}
                      </h3>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border/40">
                        {project.status.replace("_", " ")}
                      </span>
                    </div>

                    {project.description && (
                      <p className="text-xs text-secondary leading-relaxed line-clamp-3">
                        {project.description}
                      </p>
                    )}

                    {project.skills.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {project.skills.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted/40 border border-border/40 text-[11px] text-foreground font-medium"
                          >
                            {s.iconUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={s.iconUrl}
                                alt={s.name}
                                className="w-3 h-3 object-contain"
                              />
                            )}
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold border border-border/50 flex items-center gap-1.5 transition-colors"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Code</span>
                        </a>
                      )}

                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold border border-border/50 flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Visit</span>
                        </a>
                      )}
                    </div>

                    {project.url && (
                      <button
                        onClick={() =>
                          setActivePreviewProject(project as unknown as ProjectItem)
                        }
                        className="px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:opacity-90 transition-opacity"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Live Preview</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Core Concepts Snapshot */}
        {concepts.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Knowledge Graph Concepts
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {concepts.map((concept) => (
                <div
                  key={concept.id}
                  className="p-3.5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/50 shadow-xs space-y-1.5"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block truncate">
                    {concept.categoryName || "General"}
                  </span>
                  <h4 className="text-xs font-semibold text-foreground truncate">
                    {concept.title}
                  </h4>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground">
                    {concept.masteryLevel}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* In-App Live Device Preview Modal */}
      <ProjectPreviewModal
        isOpen={!!activePreviewProject}
        project={activePreviewProject}
        onClose={() => setActivePreviewProject(null)}
      />
    </div>
  );
}
