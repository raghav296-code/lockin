import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 selection:bg-accent/20 selection:text-accent">
      {/* Top Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <Link
          href="/"
          className="flex items-center gap-2 group transition-opacity hover:opacity-90"
        >
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            LI
          </div>
          <span className="font-semibold text-[17px] tracking-tight text-foreground">
            Lock In
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Centered Auth Card Area */}
      <main className="flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center py-4 text-[13px] text-secondary">
        <span>Lock In — Personal Learning Hub</span>
      </footer>
    </div>
  );
}
