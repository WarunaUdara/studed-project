import { ArrowUpRight } from "lucide-react";
import React, { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export type CardNavLink = {
  label: string;
  href: string;
  ariaLabel?: string;
  icon?: React.ReactNode;
};

export type CardNavItem = {
  label: string;
  bgColor?: string;
  textColor?: string;
  links: CardNavLink[];
};

export interface CardNavProps {
  logoNode?: React.ReactNode;
  centerNode?: React.ReactNode;
  rightNode?: React.ReactNode;
  items: CardNavItem[];
  className?: string;
  ease?: string;
  baseColor?: string;
  menuColor?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export const CardNav: React.FC<CardNavProps> = ({
  logoNode,
  centerNode,
  rightNode,
  items,
  className = "",
  ease = "power3.out",
  baseColor,
  menuColor,
  ctaLabel,
  onCtaClick,
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 240;

    const isMobile =
      typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      const contentEl = navEl.querySelector(".card-nav-content") as HTMLElement;
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = "visible";
        contentEl.style.pointerEvents = "auto";
        contentEl.style.position = "static";
        contentEl.style.height = "auto";

        const topBar = 64;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 240;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 64, overflow: "hidden" });
    gsap.set(cardsRef.current, { y: 30, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.35,
      ease,
    });

    tl.to(
      cardsRef.current,
      { y: 0, opacity: 1, duration: 0.3, ease, stagger: 0.05 },
      "-=0.1",
    );

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback("onReverseComplete", () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div className={`card-nav-container relative w-full ${className}`.trim()}>
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? "open" : ""} block h-[64px] p-0 border-b border-border/40 bg-background/95 backdrop-blur-md relative overflow-hidden will-change-[height]`}
        style={baseColor ? { backgroundColor: baseColor } : undefined}
      >
        {/* Top Header Bar */}
        <div className="card-nav-top mx-auto flex h-[64px] max-w-7xl items-center justify-between px-4 sm:px-6 z-[2] relative">
          {/* Left: Logo & Direct Tab Pills */}
          <div className="flex items-center gap-6">
            <div className="logo-container flex items-center">
              {logoNode ? (
                logoNode
              ) : (
                <span className="font-serif font-bold text-2xl text-foreground tracking-tight">
                  Stud<span className="text-primary italic">Ed</span>
                </span>
              )}
            </div>

            {centerNode && <div className="hidden md:flex items-center">{centerNode}</div>}
          </div>

          {/* Right Action Icons & Hamburger Drawer Trigger */}
          <div className="flex items-center gap-3">
            {rightNode}

            {ctaLabel && (
              <button
                type="button"
                onClick={onCtaClick}
                className="hidden sm:inline-flex rounded-full px-4 py-1.5 items-center font-bold text-xs cursor-pointer transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm active:scale-95"
              >
                {ctaLabel}
              </button>
            )}

            {/* Hamburger Button */}
            <div
              className={`hamburger-menu ${isHamburgerOpen ? "open" : ""} group size-9 flex flex-col items-center justify-center cursor-pointer gap-[5px] rounded-full hover:bg-muted transition-colors`}
              onClick={toggleMenu}
              onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleMenu();
                }
              }}
              role="button"
              aria-label={isExpanded ? "Close menu" : "Open menu"}
              aria-expanded={isExpanded}
              tabIndex={0}
              style={{ color: menuColor || "currentColor" }}
            >
              <div
                className={`hamburger-line w-[20px] h-[2px] bg-current rounded-full transition-transform duration-300 ease-out [transform-origin:50%_50%] ${
                  isHamburgerOpen ? "translate-y-[3.5px] rotate-45" : ""
                }`}
              />
              <div
                className={`hamburger-line w-[20px] h-[2px] bg-current rounded-full transition-transform duration-300 ease-out [transform-origin:50%_50%] ${
                  isHamburgerOpen ? "-translate-y-[3.5px] -rotate-45" : ""
                }`}
              />
            </div>
          </div>
        </div>

        {/* Expandable Navigation Cards */}
        <div
          className={`card-nav-content mx-auto max-w-7xl p-4 flex flex-col items-stretch gap-3 justify-start z-[1] ${
            isExpanded ? "visible pointer-events-auto" : "invisible pointer-events-none"
          } md:flex-row md:items-stretch md:gap-4`}
          aria-hidden={!isExpanded}
        >
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card select-none relative flex flex-col gap-2.5 p-4 rounded-2xl border border-border/60 bg-card/90 shadow-sm min-w-0 flex-[1_1_auto] md:flex-[1_1_0%] transition-all hover:border-primary/40 hover:shadow-md"
              ref={setCardRef(idx)}
              style={
                item.bgColor || item.textColor
                  ? { backgroundColor: item.bgColor, color: item.textColor }
                  : undefined
              }
            >
              <div className="nav-card-label font-bold text-sm sm:text-base text-foreground flex items-center justify-between border-b border-border/40 pb-2">
                <span>{item.label}</span>
              </div>
              <div className="nav-card-links flex flex-col gap-2 pt-1">
                {item.links?.map((lnk, i) => (
                  <a
                    key={`${lnk.label}-${i}`}
                    className="nav-card-link inline-flex items-center gap-2 no-underline cursor-pointer text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    href={lnk.href}
                    aria-label={lnk.ariaLabel || lnk.label}
                  >
                    {lnk.icon || (
                      <ArrowUpRight className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                    )}
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
