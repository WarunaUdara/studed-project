// Streak scene, sliced from FeralUI Scenes (https://feralui.dev/#/scenes).
// Generated file: regenerate with scripts/gen-scene-packs.cjs, do not hand-edit.

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const SOFT_EASE = [0.22, 1, 0.3, 1] as const;

// ---- Liquid glass, per aave.com/design/building-glass-for-the-web: every
// .glass surface gets a displacement map GENERATED FROM ITS OWN SHAPE — the
// red/green channels encode how far to push each backdrop pixel horizontally/
// vertically, neutral grey (#808000: R=G=128) means "don't touch", and the
// ramps only live in a thin bezel inside the rim. feDisplacementMap then
// refracts the live backdrop through that map, so the background bends at the
// edge exactly like light through the thick rim of a lens. ----

// Chromium supports SVG filter references inside backdrop-filter; Safari does
// not, so it falls back to plain blur via the --lg custom-property default.
const LG_SUPPORTED =
  typeof CSS !== "undefined" && CSS.supports("backdrop-filter", "url(#lg)");

// The map, computed per-pixel from the shape's signed distance field (the
// "small PNG built on the fly from the glass's shape and size"):
//   direction = the SDF's outward normal, so corners refract radially around
//   the corner arc instead of smearing diagonally;
//   magnitude = a circular lens profile 1-sqrt(1-t²) — zero across the flat
//   interior, rising steeply only in the last few px before the rim, exactly
//   like the sagitta of a convex lens edge;
//   sign = samples pull TOWARD the centre (Chromium clamps the backdrop at the
//   border box, so outward sampling just smears the clamped edge row).
function lgMap(w: number, h: number, r: number, bezel: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const data = img.data;
  const cx = w / 2;
  const cy = h / 2;
  const ax = cx - r; // half-extents of the straight core between the corner arcs
  const ay = cy - r;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const mx = x + 0.5 - cx;
      const my = y + 0.5 - cy;
      const qx = Math.abs(mx) - ax;
      const qy = Math.abs(my) - ay;
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      // signed distance to the rounded-rect edge (negative inside)
      const d = Math.min(Math.max(qx, qy), 0) + Math.hypot(ox, oy) - r;
      const t = Math.min(1, Math.max(0, 1 + d / bezel));
      const p = 1 - Math.sqrt(1 - t * t);
      // outward normal of the SDF, un-mirrored from the abs() fold
      let nx = 0;
      let ny = 0;
      if (p > 0) {
        if (ox > 0 || oy > 0) {
          const l = Math.hypot(ox, oy) || 1;
          nx = ox / l;
          ny = oy / l;
        } else if (qx > qy) nx = 1;
        else ny = 1;
        if (mx < 0) nx = -nx;
        if (my < 0) ny = -ny;
      }
      const i = (y * w + x) * 4;
      data[i] = Math.round(128 - nx * 127 * p);
      data[i + 1] = Math.round(128 - ny * 127 * p);
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

// Watches every .glass element under `hostRef`, builds one filter per surface
// (sized to its real box + border-radius, rebuilt on resize), and points the
// element's backdrop-filter at it via the --lg custom property.
export function useLiquidGlass(hostRef: { current: HTMLElement | null }) {
  useEffect(() => {
    const host = hostRef.current;
    if (!LG_SUPPORTED || !host) return;
    const NS = "http://www.w3.org/2000/svg";
    const defs = document.createElementNS(NS, "svg");
    defs.setAttribute("class", "lg-defs");
    defs.setAttribute("aria-hidden", "true");
    host.appendChild(defs);

    let seq = 0;
    type Rec = {
      img: SVGElement;
      disp: SVGElement;
      f: SVGElement;
      w: number;
      h: number;
    };
    const filters = new Map<HTMLElement, Rec>();

    const update = (el: HTMLElement) => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!w || !h) return;
      let rec = filters.get(el);
      if (!rec) {
        const id = `lg-${++seq}`;
        const f = document.createElementNS(NS, "filter");
        f.setAttribute("id", id);
        // sRGB: channel maths must see 128 as the exact midpoint, or the whole
        // backdrop shears sideways
        f.setAttribute("color-interpolation-filters", "sRGB");
        const img = document.createElementNS(NS, "feImage");
        img.setAttribute("result", "map");
        const disp = document.createElementNS(NS, "feDisplacementMap");
        disp.setAttribute("in", "SourceGraphic");
        disp.setAttribute("in2", "map");
        disp.setAttribute("xChannelSelector", "R");
        disp.setAttribute("yChannelSelector", "G");
        f.appendChild(img);
        f.appendChild(disp);
        defs.appendChild(f);
        rec = { img, disp, f, w: 0, h: 0 };
        filters.set(el, rec);
        // displacement first, then the iOS material: soft blur, a whisper of
        // saturation, a slight lift — real materials lighten the backdrop,
        // they never amplify its colour
        el.style.setProperty(
          "--lg",
          `url(#${id}) blur(3px) saturate(1.08) brightness(1.05)`,
        );
      }
      if (rec.w === w && rec.h === h) return;
      rec.w = w;
      rec.h = h;
      // resolve the CSS radius against the real box (handles the 50% circles)
      const raw = getComputedStyle(el).borderTopLeftRadius;
      const r = Math.min(
        raw.endsWith("%")
          ? (parseFloat(raw) / 100) * Math.min(w, h)
          : parseFloat(raw) || 0,
        w / 2,
        h / 2,
      );
      const bezel = Math.max(5, Math.min(14, Math.min(w, h) * 0.18));
      rec.img.setAttribute("href", lgMap(w, h, r, bezel));
      rec.img.setAttribute("x", "0");
      rec.img.setAttribute("y", "0");
      rec.img.setAttribute("width", String(w));
      rec.img.setAttribute("height", String(h));
      rec.disp.setAttribute("scale", String(Math.round(bezel * 2.5)));
    };

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) update(entry.target as HTMLElement);
    });
    const scan = () => {
      const live = new Set(
        Array.from(host.querySelectorAll<HTMLElement>(".glass")),
      );
      live.forEach((el) => {
        if (!filters.has(el)) {
          update(el);
          ro.observe(el);
        }
      });
      filters.forEach((rec, el) => {
        if (!live.has(el)) {
          ro.unobserve(el);
          rec.f.remove();
          filters.delete(el);
        }
      });
    };
    scan();
    // screens mount/unmount as tabs swap — pick up fresh .glass surfaces
    const mo = new MutationObserver(scan);
    mo.observe(host, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      mo.disconnect();
      ro.disconnect();
      defs.remove();
    };
  }, [hostRef]);
}

// ---- Streak celebration: count-up hero, a burst of palette confetti, a week of
// ticks popping in, then the copy settles. Deterministic golden-angle scatter so
// the burst looks organic but replays identically. ----
const STREAK_CONFETTI = Array.from({ length: 30 }, (_, i) => {
  const spread = (((i * 53) % 100) / 100) * 2 - 1; // -1..1, deterministic
  return {
    xMid: spread * 110,
    xEnd: spread * 150,
    rise: 60 + ((i * 31) % 70),
    fall: 100 + ((i * 23) % 50),
    size: 5 + ((i * 29) % 5),
    strip: i % 3 === 0,
    rot: spread * 320,
    color: [
      "oklch(0.79 0.16 66)",
      "oklch(0.78 0.17 48)",
      "oklch(0.88 0.14 85)",
      "oklch(0.72 0.16 36)",
      "oklch(0.9 0.12 92)",
      "oklch(0.82 0.15 55)",
    ][i % 6],
    delay: 0.55 + ((i * 17) % 12) * 0.02,
  };
});

// The count-up lives in its own component so its ~50 re-renders during the
// 850ms ramp touch only this span, not the flame SVG and confetti field.
function StreakCount({
  reduce,
  streak = 7,
}: {
  reduce: boolean;
  streak?: number;
}) {
  const [count, setCount] = useState(1);
  // count-up: eases out hard so the last digits land with weight
  useEffect(() => {
    if (reduce) {
      setCount(streak);
      return;
    }
    let raf = 0;
    const t0 = performance.now() + 380;
    const startVal = Math.max(1, streak - 6);
    const delta = streak - startVal;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / 850));
      setCount(startVal + Math.round(delta * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, streak]);
  // one-shot thump timed to the count-up LANDING, so the target arrives with weight
  return (
    <span className={reduce ? "st-num-value" : "st-num-value st-num-thump"}>
      {count}
    </span>
  );
}

export function StreakScreen({
  playKey,
  onNext,
  streakCount = 7,
  longestStreak = 12,
}: {
  playKey: string | number;
  onNext?: () => void;
  streakCount?: number;
  longestStreak?: number;
}) {
  const soft = SOFT_EASE;
  const reduce = useReducedMotion();
  return (
    <div key={String(playKey)} className="st">
      <motion.div
        className="st-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: soft }}
      />
      <div className="st-stage">
        {!reduce && (
          <div className="st-confetti" aria-hidden="true">
            {/* fountain physics: launch up and out (ease-out), gravity pulls back down
                (ease-in), strips tumble as they fall */}
            {STREAK_CONFETTI.map((c, i) => (
              <motion.span
                key={i}
                style={{
                  width: c.strip ? 4 : c.size,
                  height: c.strip ? 10 : c.size,
                  background: c.color,
                  borderRadius: c.strip ? 2 : "50%",
                }}
                initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.6 }}
                animate={{
                  x: [0, c.xMid, c.xEnd],
                  y: [0, -c.rise, c.fall],
                  rotate: [0, c.rot * 0.6, c.rot],
                  opacity: [1, 1, 0],
                  scale: [0.9, 1, 1],
                }}
                transition={{
                  delay: c.delay,
                  duration: 1.7,
                  times: [0, 0.42, 1],
                  ease: ["easeOut", "easeIn"],
                }}
              />
            ))}
          </div>
        )}
        <motion.div
          className="st-flame"
          initial={{ scale: 0, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.15,
            duration: 0.6,
            ease: [0.34, 1.45, 0.5, 1],
          }}
        >
          {/* liquid-glass flame mark: warm inner flame + blurred glow clone behind a
              frosted outer shell that catches light along its top edge */}
          <svg className="st-flame-svg" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              {/* a real flame body: saturated amber shell (translucent enough to stay
                  glassy) around a molten droplet core */}
              <linearGradient
                id="stf-core"
                x1="12"
                y1="9"
                x2="12"
                y2="21"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="oklch(0.875 0.105 74.4)" />
                <stop offset="1" stopColor="oklch(0.751 0.145 54.6)" />
              </linearGradient>
              <linearGradient
                id="stf-shell"
                x1="12.006"
                y1="1.17"
                x2="12.006"
                y2="22"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="rgba(255, 200, 110, 0.8)" />
                <stop offset="1" stopColor="rgba(255, 150, 66, 0.85)" />
              </linearGradient>
              <linearGradient
                id="stf-light"
                x1="12.006"
                y1="1.17"
                x2="12.006"
                y2="13.233"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="oklch(1 0 89.9)" />
                <stop offset="1" stopColor="oklch(1 0 89.9)" stopOpacity="0" />
              </linearGradient>
              <filter
                id="stf-blur"
                x="-100%"
                y="-100%"
                width="400%"
                height="400%"
                filterUnits="objectBoundingBox"
                primitiveUnits="userSpaceOnUse"
              >
                <feGaussianBlur
                  stdDeviation="2"
                  in="SourceGraphic"
                  result="blur"
                />
              </filter>
              <clipPath id="stf-clip">
                <path d="M12.3555 1.17975C12.6333 1.22007 12.8835 1.42661 13.3828 1.8399C14.5704 2.8229 15.6975 3.87361 16.7432 5.01569C17.7733 6.14079 18.827 7.46472 19.627 8.88092C20.4224 10.2894 21.0058 11.8567 21.0059 13.4503C21.0058 18.9618 16.2992 22 12.0059 22.0001C7.71247 22.0001 3.00593 18.9618 3.00586 13.4503C3.00601 11.6543 3.31206 9.81195 3.64062 7.99908C3.79551 7.14453 3.87278 6.71677 4.0918 6.49615C4.28495 6.30176 4.54241 6.19717 4.81641 6.20123C5.1273 6.20598 5.47988 6.45692 6.18457 6.95807L8.20117 8.39166L10.9971 2.40631C11.2819 1.79667 11.4252 1.49135 11.6592 1.336C11.8588 1.20356 12.1184 1.1454 12.3555 1.17975ZM12 11.0001C10.8333 11.0001 8.50023 14.7613 8.5 16.6251C8.50004 18.4372 9.98124 19.9144 11.8398 19.9952C11.8929 19.998 11.9463 20.0001 12 20.0001C12.0534 20.0001 12.1065 19.9979 12.1592 19.9952C14.0182 19.9149 15.5 18.4375 15.5 16.6251C15.4998 14.7613 13.1667 11.0001 12 11.0001Z" />
              </clipPath>
              <mask id="stf-mask">
                <rect width="100%" height="100%" fill="oklch(1 0 89.9)" />
                <path
                  d="M12.3555 1.17975C12.6333 1.22007 12.8835 1.42661 13.3828 1.8399C14.5704 2.8229 15.6975 3.87361 16.7432 5.01569C17.7733 6.14079 18.827 7.46472 19.627 8.88092C20.4224 10.2894 21.0058 11.8567 21.0059 13.4503C21.0058 18.9618 16.2992 22 12.0059 22.0001C7.71247 22.0001 3.00593 18.9618 3.00586 13.4503C3.00601 11.6543 3.31206 9.81195 3.64062 7.99908C3.79551 7.14453 3.87278 6.71677 4.0918 6.49615C4.28495 6.30176 4.54241 6.19717 4.81641 6.20123C5.1273 6.20598 5.47988 6.45692 6.18457 6.95807L8.20117 8.39166L10.9971 2.40631C11.2819 1.79667 11.4252 1.49135 11.6592 1.336C11.8588 1.20356 12.1184 1.1454 12.3555 1.17975ZM12 11.0001C10.8333 11.0001 8.50023 14.7613 8.5 16.6251C8.50004 18.4372 9.98124 19.9144 11.8398 19.9952C11.8929 19.998 11.9463 20.0001 12 20.0001C12.0534 20.0001 12.1065 19.9979 12.1592 19.9952C14.0182 19.9149 15.5 18.4375 15.5 16.6251C15.4998 14.7613 13.1667 11.0001 12 11.0001Z"
                  fill="oklch(0 0 0)"
                />
              </mask>
            </defs>
            <path
              className="stf-core-p"
              d="M7 16.5C7.00033 14.015 10.3333 9 12 9C13.6667 9 16.9997 14.015 17 16.5C17 18.9853 14.7614 21 12 21C9.23858 21 7 18.9853 7 16.5Z"
              fill="url(#stf-core)"
              mask="url(#stf-mask)"
            />
            <path
              className="stf-core-p"
              d="M7 16.5C7.00033 14.015 10.3333 9 12 9C13.6667 9 16.9997 14.015 17 16.5C17 18.9853 14.7614 21 12 21C9.23858 21 7 18.9853 7 16.5Z"
              fill="url(#stf-core)"
              filter="url(#stf-blur)"
              clipPath="url(#stf-clip)"
            />
            <path
              className="stf-shell-p"
              d="M12.3555 1.17975C12.6333 1.22007 12.8835 1.42661 13.3828 1.8399C14.5704 2.8229 15.6975 3.87361 16.7432 5.01569C17.7733 6.14079 18.827 7.46472 19.627 8.88092C20.4224 10.2894 21.0058 11.8567 21.0059 13.4503C21.0058 18.9618 16.2992 22 12.0059 22.0001C7.71247 22.0001 3.00593 18.9618 3.00586 13.4503C3.00601 11.6543 3.31206 9.81195 3.64062 7.99908C3.79551 7.14453 3.87278 6.71677 4.0918 6.49615C4.28495 6.30176 4.54241 6.19717 4.81641 6.20123C5.1273 6.20598 5.47988 6.45692 6.18457 6.95807L8.20117 8.39166L10.9971 2.40631C11.2819 1.79667 11.4252 1.49135 11.6592 1.336C11.8588 1.20356 12.1184 1.1454 12.3555 1.17975ZM12 11.0001C10.8333 11.0001 8.50023 14.7613 8.5 16.6251C8.50004 18.4372 9.98124 19.9144 11.8398 19.9952C11.8929 19.998 11.9463 20.0001 12 20.0001C12.0534 20.0001 12.1065 19.9979 12.1592 19.9952C14.0182 19.9149 15.5 18.4375 15.5 16.6251C15.4998 14.7613 13.1667 11.0001 12 11.0001Z"
              fill="url(#stf-shell)"
            />
            <path
              className="stf-shell-p"
              d="M20.2559 13.4502C20.2558 12.0346 19.7348 10.5978 18.9736 9.24998C18.2113 7.90036 17.1979 6.62288 16.1904 5.52244C15.1713 4.40939 14.0694 3.38232 12.9043 2.41795C12.6434 2.20201 12.4875 2.0739 12.3643 1.99022C12.2508 1.9132 12.2285 1.91902 12.248 1.92186C12.1936 1.91397 12.1202 1.93055 12.0742 1.96092C12.0932 1.94818 12.069 1.95276 11.9951 2.07909C11.9162 2.21411 11.8252 2.40593 11.6768 2.72362L8.5 9.5244L5.75 7.56932C5.38629 7.31066 5.15404 7.14608 4.97461 7.041C4.864 6.97625 4.80992 6.9562 4.79395 6.95116C4.73159 6.95276 4.6774 6.97574 4.63184 7.01854C4.62295 7.03562 4.59824 7.08828 4.56543 7.20799C4.51016 7.40968 4.4589 7.69146 4.37891 8.1328C4.09107 9.72091 3.83039 11.2833 3.76953 12.8017L3.75586 13.4502C3.75586 18.4345 8.00368 21.25 12.0059 21.25V22C7.71243 22 3.00586 18.9618 3.00586 13.4502C3.00601 11.6542 3.31205 9.8119 3.64062 7.99901C3.79555 7.14422 3.87362 6.71664 4.09277 6.49608C4.286 6.30177 4.54336 6.19697 4.81738 6.20116C5.12816 6.20611 5.48024 6.4571 6.18457 6.95799L8.20117 8.39159L10.998 2.40623C11.2474 1.87247 11.3872 1.57205 11.5752 1.40135L11.6592 1.33592C11.8589 1.20346 12.1183 1.14532 12.3555 1.17967C12.6334 1.21995 12.8834 1.42647 13.3828 1.83983C14.5704 2.82285 15.6974 3.87349 16.7432 5.01561C17.7733 6.14074 18.827 7.46459 19.627 8.88084C20.4224 10.2893 21.0058 11.8566 21.0059 13.4502C21.0059 18.9618 16.2993 22 12.0059 22V21.25C16.008 21.25 20.2559 18.4345 20.2559 13.4502Z"
              fill="url(#stf-light)"
            />
          </svg>
        </motion.div>
        <motion.div
          className="st-num"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.34, 1.45, 0.5, 1] }}
        >
          <StreakCount reduce={!!reduce} streak={streakCount} />
        </motion.div>
        <motion.div
          className="st-cap"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.5, ease: soft }}
        >
          day streak
        </motion.div>
        <motion.div
          className="st-week glass"
          role="group"
          aria-label={`This week: ${Math.min(streakCount, 7)} of 7 days completed`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            opacity: { delay: 0.68, duration: 0.18 },
            default: { delay: 0.68, duration: 0.55, ease: soft },
          }}
        >
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
            const now = new Date();
            const dayOfWeek = now.getDay();
            const todayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const isToday = i === todayIdx;
            const isCompleted =
              i <= todayIdx ? todayIdx - i < Math.max(1, streakCount) : false;

            return (
              <div className="st-day" key={i}>
                <span
                  className={
                    isToday ? "st-day-l font-bold text-primary" : "st-day-l"
                  }
                  aria-hidden="true"
                >
                  {d}
                </span>
                <motion.span
                  className={
                    isCompleted
                      ? isToday
                        ? "st-dot is-today"
                        : "st-dot"
                      : isToday
                        ? "st-dot is-today is-empty"
                        : "st-dot is-empty"
                  }
                  initial={{ scale: 0 }}
                  animate={{ scale: isToday ? [0, 1.3, 1] : 1 }}
                  transition={{
                    delay: 0.78 + i * 0.055,
                    duration: isToday ? 0.6 : 0.5,
                    ease: isToday ? "easeOut" : [0.34, 1.5, 0.5, 1],
                  }}
                >
                  {isCompleted ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M5 13 l4 4 L19 7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span className="st-dot-inner-empty" />
                  )}
                  {isToday && isCompleted && !reduce && (
                    <motion.span
                      className="st-dot-ripple"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 2, opacity: [0, 0.5, 0] }}
                      transition={{
                        delay: 1.78,
                        duration: 0.75,
                        times: [0, 0.3, 1],
                        ease: "easeOut",
                      }}
                      aria-hidden="true"
                    />
                  )}
                </motion.span>
              </div>
            );
          })}
        </motion.div>
        <motion.div
          className="st-stats glass"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            opacity: { delay: 1.45, duration: 0.18 },
            default: { delay: 1.45, duration: 0.55, ease: soft },
          }}
        >
          <div className="st-stat">
            <b>{longestStreak}</b>
            <span>Longest streak</span>
          </div>
          <div className="st-stat-div" aria-hidden="true" />
          <div className="st-stat">
            <b>{Math.min(streakCount, 7)}/7</b>
            <span>This week</span>
          </div>
        </motion.div>
      </div>
      <div className="st-content">
        <motion.button
          type="button"
          className="wc-btn st-btn"
          onClick={onNext}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.62, duration: 0.5, ease: soft }}
        >
          Keep it going
        </motion.button>
      </div>
    </div>
  );
}
