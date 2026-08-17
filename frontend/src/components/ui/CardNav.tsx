import { ArrowUpRight } from "lucide-react";
import React, { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export type CardNavLink = {
  label: string;
  href: string;
  ariaLabel?: string;
};

export type CardNavItem = {
  label: string;
  bgColor?: string;
  textColor?: string;
  links: CardNavLink[];
};

export interface CardNavProps {
  logo?: string;
  logoAlt?: string;
  logoNode?: React.ReactNode;
  items: CardNavItem[];
  className?: string;
  ease?: string;
  baseColor?: string;
  menuColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export const CardNav: React.FC<CardNavProps> = ({
  logo,
  logoAlt = "Logo",
  logoNode,
  items,
  className = "",
  ease = "power3.out",
  baseColor,
  menuColor,
  buttonBgColor,
  buttonTextColor,
  ctaLabel = "Get Started",
  onCtaClick,
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
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

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 60, overflow: "hidden" });
    gsap.set(cardsRef.current, { y: 40, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.38,
      ease,
    });

    tl.to(
      cardsRef.current,
      { y: 0, opacity: 1, duration: 0.35, ease, stagger: 0.06 },
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
    <div
      className={`card-nav-container relative w-full max-w-[800px] z-[99] ${className}`.trim()}
    >
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? "open" : ""} block h-[60px] p-0 rounded-2xl border border-border/60 bg-card shadow-lg relative overflow-hidden will-change-[height]`}
        style={baseColor ? { backgroundColor: baseColor } : undefined}
      >
        {/* Top Header Bar */}
        <div className="card-nav-top absolute inset-x-0 top-0 h-[60px] flex items-center justify-between px-4 z-[2]">
          {/* Left: Hamburger Icon */}
          <div
            className={`hamburger-menu ${isHamburgerOpen ? "open" : ""} group size-9 flex flex-col items-center justify-center cursor-pointer gap-[5px] rounded-full hover:bg-muted transition-colors order-2 md:order-none`}
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
              className={`hamburger-line w-[22px] h-[2px] bg-current rounded-full transition-transform duration-300 ease-out [transform-origin:50%_50%] ${
                isHamburgerOpen ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <div
              className={`hamburger-line w-[22px] h-[2px] bg-current rounded-full transition-transform duration-300 ease-out [transform-origin:50%_50%] ${
                isHamburgerOpen ? "-translate-y-[3.5px] -rotate-45" : ""
              }`}
            />
          </div>

          {/* Logo Center (or left on mobile) */}
          <div className="logo-container flex items-center md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 order-1 md:order-none">
            {logoNode ? (
              logoNode
            ) : logo ? (
              <img src={logo} alt={logoAlt} className="h-7 w-auto object-contain" />
            ) : (
              <span className="font-serif font-bold text-lg text-primary tracking-tight">StudEd</span>
            )}
          </div>

          {/* Right Action CTA */}
          <button
            type="button"
            onClick={onCtaClick}
            className="card-nav-cta-button hidden md:inline-flex rounded-full px-5 py-2 items-center font-bold text-xs cursor-pointer transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm active:scale-95"
            style={
              buttonBgColor || buttonTextColor
                ? { backgroundColor: buttonBgColor, color: buttonTextColor }
                : undefined
            }
          >
            {ctaLabel}
          </button>
        </div>

        {/* Expandable Navigation Cards */}
        <div
          className={`card-nav-content absolute left-0 right-0 top-[60px] bottom-0 p-3 flex flex-col items-stretch gap-2.5 justify-start z-[1] ${
            isExpanded ? "visible pointer-events-auto" : "invisible pointer-events-none"
          } md:flex-row md:items-end md:gap-3`}
          aria-hidden={!isExpanded}
        >
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card select-none relative flex flex-col gap-2 p-4 rounded-xl border border-border/40 bg-muted/40 min-w-0 flex-[1_1_auto] h-auto min-h-[60px] md:h-full md:min-h-0 md:flex-[1_1_0%] transition-colors hover:bg-muted/70"
              ref={setCardRef(idx)}
              style={
                item.bgColor || item.textColor
                  ? { backgroundColor: item.bgColor, color: item.textColor }
                  : undefined
              }
            >
              <div className="nav-card-label font-bold text-base md:text-lg text-foreground">
                {item.label}
              </div>
              <div className="nav-card-links mt-auto flex flex-col gap-1.5">
                {item.links?.map((lnk, i) => (
                  <a
                    key={`${lnk.label}-${i}`}
                    className="nav-card-link inline-flex items-center gap-1.5 no-underline cursor-pointer text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    href={lnk.href}
                    aria-label={lnk.ariaLabel || lnk.label}
                  >
                    <ArrowUpRight className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
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
