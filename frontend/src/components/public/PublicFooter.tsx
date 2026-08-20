import { Link } from "@tanstack/react-router";
import { Code, Send } from "lucide-react";
import { LanguageToggle } from "@/components/public/LanguageToggle";
import { RuixenGradientFooter } from "@/components/ui/ruixen-gradient-footer";
import { usePublicI18n } from "@/lib/i18n";

interface FooterColumn {
  heading: string;
  links: { label: string; to: string }[];
}

/**
 * PublicFooter — multi-column site footer on public pages.
 * Features RuixenGradientFooter rainbow glow pinned to the bottom of the viewport.
 */
export function PublicFooter() {
  const { t } = usePublicI18n();

  const columns: FooterColumn[] = [
    {
      heading: t("footerProduct"),
      links: [
        { label: "Courses", to: "/courses" },
        { label: "Pricing", to: "/pricing" },
        { label: "Leaderboards", to: "/leaderboard" },
      ],
    },
    {
      heading: t("footerLearn"),
      links: [
        { label: "Grade 1–11", to: "/courses" },
        { label: "O/L", to: "/courses" },
        { label: "A/L", to: "/courses" },
      ],
    },
    {
      heading: t("footerCompany"),
      links: [
        { label: "About", to: "/" },
        { label: "Log in", to: "/login" },
        { label: "Sign up", to: "/register" },
      ],
    },
  ];

  return (
    <RuixenGradientFooter gradientHeight="55vh" className="border-t border-border/40 bg-transparent">
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link to="/" className="text-2xl font-serif font-bold tracking-tight hover:opacity-90">
              Stud<span className="italic text-primary">Ed</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">{t("footerTagline")}</p>
            <div className="flex items-center gap-2 pt-2">
              <LanguageToggle />
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Send className="h-4 w-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Code className="h-4 w-4" />
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.heading} className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                {col.heading}
              </h3>
              <ul className="space-y-2 text-sm">
                {col.links.map((link) => (
                  <li key={`${col.heading}-${link.label}`}>
                    <Link
                      to={link.to}
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} StudEd. {t("footerRights")}
          </span>
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </span>
          <span>Grade 1–11 · O/L · A/L · Cambridge</span>
        </div>
      </div>
    </RuixenGradientFooter>
  );
}
