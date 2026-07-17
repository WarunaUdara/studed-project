import { Link } from "@tanstack/react-router";
import { Code, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { LanguageToggle } from "@/components/public/LanguageToggle";
import { usePublicI18n } from "@/lib/i18n";

interface FooterColumn {
  heading: string;
  links: { label: string; to: string }[];
}

/**
 * PublicFooter — multi-column site footer on public pages.
 * Has an atmospheric bottom glow that intensifies when scrolled to the very bottom.
 * The CTA section above sits on top of the footer and "peels away" as you scroll down.
 */
export function PublicFooter() {
  const { t } = usePublicI18n();
  const [bottomGlow, setBottomGlow] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollTop = window.scrollY;
      const maxScroll = docHeight - winHeight;
      if (maxScroll <= 0) return;
      const diff = maxScroll - scrollTop;
      const intensity = diff < 180 ? Math.max(0, Math.min(1, (180 - diff) / 180)) : 0;
      setBottomGlow(intensity);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <footer className="relative overflow-hidden border-t bg-background">
      {/* Scroll-reactive bottom glow — intensifies when reader reaches rock bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-200"
        style={{
          opacity: bottomGlow,
          background:
            "radial-gradient(ellipse 120% 80% at 50% 120%, rgba(249,115,22,0.35) 0%, rgba(147,197,253,0.3) 45%, transparent 75%)",
        }}
      />
      {/* Ambient footer glow — always visible, subtle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 100% 60% at 50% 130%, rgba(249,115,22,0.15) 0%, rgba(147,197,253,0.12) 55%, transparent 85%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link to="/" className="text-2xl font-extrabold tracking-tight hover:text-primary">
              Stud<span className="text-primary">Ed</span>
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

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} StudEd. {t("footerRights")}
          </span>
          <span>Grade 1–11 · O/L · A/L</span>
        </div>
      </div>
    </footer>
  );
}
