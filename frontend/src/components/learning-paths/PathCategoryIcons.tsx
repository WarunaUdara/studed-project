export function MathIsometricIcon({ className = "size-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      <defs>
        <linearGradient id="math-grad-1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="math-grad-2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      {/* 3D Geometric Isometric Math % / Slash Shape */}
      <circle cx="32" cy="30" r="14" fill="url(#math-grad-1)" />
      <circle cx="32" cy="30" r="6" fill="#ffffff" />
      <path
        d="M 68,22 L 78,28 L 32,80 L 22,74 Z"
        fill="url(#math-grad-2)"
        stroke="#93c5fd"
        strokeWidth="2"
      />
      <rect x="54" y="56" width="24" height="24" rx="6" fill="url(#math-grad-1)" />
    </svg>
  );
}

export function CodeIsometricIcon({ className = "size-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      <defs>
        <linearGradient id="code-grad-1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
        <linearGradient id="code-grad-2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7e22ce" />
        </linearGradient>
      </defs>
      {/* 3D Isometric Stacked Cubes / Algorithmic Layers */}
      <path d="M 50,15 L 82,32 L 50,48 L 18,32 Z" fill="url(#code-grad-1)" />
      <path d="M 18,32 L 50,48 L 50,62 L 18,46 Z" fill="url(#code-grad-2)" />
      <path d="M 82,32 L 50,48 L 50,62 L 82,46 Z" fill="#6b21a8" />

      {/* Layer 2 */}
      <path d="M 50,52 L 82,68 L 50,84 L 18,68 Z" fill="url(#code-grad-1)" />
      <path d="M 18,68 L 50,84 L 50,94 L 18,78 Z" fill="url(#code-grad-2)" />
      <path d="M 82,68 L 50,84 L 50,94 L 82,78 Z" fill="#6b21a8" />
    </svg>
  );
}

export function ScienceIsometricIcon({ className = "size-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      <defs>
        <linearGradient id="sci-grad-1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="sci-grad-2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      {/* 3D Flask / Atom Geometry */}
      <ellipse
        cx="50"
        cy="50"
        rx="38"
        ry="16"
        stroke="#34d399"
        strokeWidth="3"
        transform="rotate(-30 50 50)"
      />
      <ellipse
        cx="50"
        cy="50"
        rx="38"
        ry="16"
        stroke="#34d399"
        strokeWidth="3"
        transform="rotate(30 50 50)"
      />
      <circle cx="50" cy="50" r="14" fill="url(#sci-grad-1)" />
      <circle cx="50" cy="50" r="6" fill="#ffffff" />
    </svg>
  );
}

export function LanguageIsometricIcon({ className = "size-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      <defs>
        <linearGradient id="lang-grad-1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      {/* 3D Book / Scroll Geometry */}
      <rect x="20" y="24" width="28" height="52" rx="4" fill="url(#lang-grad-1)" />
      <rect x="52" y="24" width="28" height="52" rx="4" fill="#b45309" />
      <path d="M 48,20 L 52,24 L 52,76 L 48,76 Z" fill="#78350f" />
      <line
        x1="26"
        y1="36"
        x2="42"
        y2="36"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="26"
        y1="46"
        x2="42"
        y2="46"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="58"
        y1="36"
        x2="74"
        y2="36"
        stroke="#fef3c7"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="58"
        y1="46"
        x2="74"
        y2="46"
        stroke="#fef3c7"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
