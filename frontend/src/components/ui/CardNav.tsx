import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";

export interface MegaMenuSubLink {
  label: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
}

export interface MegaMenuPreviewCard {
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  gradient?: string;
  icon?: React.ReactNode;
}

export interface MegaMenuItem {
  id: string;
  label: string;
  href?: string;
  links: MegaMenuSubLink[];
  previewCards?: MegaMenuPreviewCard[];
}

export interface FloatingCardNavProps {
  logoNode?: React.ReactNode;
  rightNode?: React.ReactNode;
  items: MegaMenuItem[];
  activePath?: string;
  className?: string;
}

export function FloatingCardNav({
  logoNode,
  rightNode,
  items,
  activePath = "/",
  className = "",
}: FloatingCardNavProps) {
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const activeItem = items.find((item) => item.id === activeTabId);

  // Close the mega menu whenever the route changes. Without this the menu that
  // was opened on hover stays draped over the page the user just navigated to,
  // and because the panel sits inside the nav's own hover region, moving the
  // pointer towards the covered content keeps it open rather than dismissing
  // it, so anything underneath is unreachable. Adjusting during render rather
  // than in an effect closes it before paint, with no flash of an open menu.
  const [menuPath, setMenuPath] = useState(activePath);
  const [suppressHover, setSuppressHover] = useState(false);
  if (menuPath !== activePath) {
    setMenuPath(activePath);
    setActiveTabId(null);
    setIsMobileMenuOpen(false);
    // The pointer is still resting on the item that was just clicked, so
    // without this the menu reopens on the very next hover event and covers
    // the page again. Hovering only reopens it once the pointer has left.
    setSuppressHover(true);
  }

  const handleMouseEnterTab = (id: string) => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (suppressHover) return;
    setActiveTabId(id);
  };

  const handleMouseLeaveNav = () => {
    setSuppressHover(false);
    const timeout = setTimeout(() => {
      setActiveTabId(null);
    }, 150);
    setHoverTimeout(timeout);
  };

  const handleMouseEnterDropdown = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
  };

  return (
    <div
      className={`relative w-full select-none ${className}`.trim()}
      onMouseLeave={handleMouseLeaveNav}
    >
      {/* Fixed-Height Top Header (Zero Layout Shift) */}
      <header className="relative z-50 h-16 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-colors">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Left: Brand Logo & Navigation Links */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex items-center">
              {logoNode ? (
                logoNode
              ) : (
                <Link
                  to="/"
                  className="flex items-center gap-1 font-serif text-2xl font-bold tracking-tight text-foreground"
                >
                  Stud<span className="italic text-primary">Ed</span>
                </Link>
              )}
            </div>

            {/* Desktop Navigation Tabs with Hover Triggers */}
            <nav className="hidden md:flex items-center gap-1">
              {items.map((item) => {
                const isActive = activeTabId === item.id;
                const isCurrentRoute = item.href && activePath.startsWith(item.href);

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => handleMouseEnterTab(item.id)}
                    className="relative"
                  >
                    {item.href ? (
                      <Link
                        to={item.href as any}
                        className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                          isActive || isCurrentRoute
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`}
                      >
                        <span>{item.label}</span>
                        {item.links.length > 0 && (
                          <ChevronDown
                            className={`size-3 transition-transform duration-200 ${
                              isActive ? "rotate-180 text-primary" : "text-muted-foreground"
                            }`}
                          />
                        )}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`}
                      >
                        <span>{item.label}</span>
                        {item.links.length > 0 && (
                          <ChevronDown
                            className={`size-3 transition-transform duration-200 ${
                              isActive ? "rotate-180 text-primary" : "text-muted-foreground"
                            }`}
                          />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Right Action Icons & User Menu */}
          <div className="flex items-center gap-3">
            {rightNode}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex md:hidden size-9 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-muted"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Mega-Menu Dropdown Card (Absolute Overlay - Zero Layout Shift) */}
      <AnimatePresence>
        {activeItem && activeItem.links.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onMouseEnter={handleMouseEnterDropdown}
            className="absolute left-0 right-0 top-16 z-40 mx-auto w-full max-w-5xl px-4 pt-2 pointer-events-auto"
          >
            <div className="relative rounded-3xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-2xl">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left Column: Categorized Navigation Links */}
                <div className="lg:col-span-5 space-y-1.5">
                  <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {activeItem.label}
                  </div>
                  {activeItem.links.map((subLink, idx) => (
                    <Link
                      key={idx}
                      to={subLink.href as any}
                      onClick={() => setActiveTabId(null)}
                      className="group flex items-center justify-between rounded-2xl p-3 transition-colors hover:bg-muted/80"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/15 transition-colors">
                          {subLink.icon}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {subLink.label}
                          </div>
                          {subLink.description && (
                            <div className="text-[11px] text-muted-foreground font-normal">
                              {subLink.description}
                            </div>
                          )}
                        </div>
                      </div>

                      {subLink.badge ? (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {subLink.badge}
                        </span>
                      ) : (
                        <ArrowRight className="size-3.5 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      )}
                    </Link>
                  ))}
                </div>

                {/* Right Column: Visual Preview Cards (Sarvam AI style) */}
                {activeItem.previewCards && activeItem.previewCards.length > 0 && (
                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t lg:border-t-0 lg:border-l border-border/60 pt-4 lg:pt-0 lg:pl-6">
                    {activeItem.previewCards.map((card, idx) => (
                      <Link
                        key={idx}
                        to={card.href as any}
                        onClick={() => setActiveTabId(null)}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-muted/50 to-muted/20 p-4 transition-all hover:border-primary/50 hover:shadow-lg"
                      >
                        {/* Thumbnail / Gradient Header */}
                        <div
                          className={`relative mb-3 flex h-28 w-full items-center justify-center rounded-xl overflow-hidden shadow-inner ${
                            card.gradient || "bg-gradient-to-tr from-amber-500/20 via-primary/20 to-purple-500/20"
                          }`}
                        >
                          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
                          <div className="relative z-10 flex size-12 items-center justify-center rounded-2xl bg-card/80 backdrop-blur-md shadow-md border border-white/20 group-hover:scale-110 transition-transform">
                            {card.icon || <Sparkles className="size-6 text-primary" />}
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                              {card.title}
                            </span>
                            <ArrowRight className="size-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {card.subtitle}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Slide-down Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-border bg-card/95 backdrop-blur-xl px-4 py-6 shadow-2xl"
          >
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="space-y-1">
                    {item.links.map((subLink, idx) => (
                      <Link
                        key={idx}
                        to={subLink.href as any}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl p-2.5 text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        {subLink.icon}
                        <span>{subLink.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const CardNav = FloatingCardNav;
