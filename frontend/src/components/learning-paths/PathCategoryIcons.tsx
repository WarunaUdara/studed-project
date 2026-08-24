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
          <stop offset="0%" stopColor="#d8b4fe" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6b21a8" />
        </linearGradient>
        <linearGradient id="code-grad-2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#581c87" />
        </linearGradient>
      </defs>
      {/* 3D Isometric Violet Code Brackets { [ ] } */}
      <g>
        {/* Left curly brace { */}
        <path
          d="M 32,18 C 20,18 16,28 16,38 C 16,46 10,49 4,49 C 10,51 16,54 16,62 C 16,72 20,82 32,82 L 32,70 C 26,70 24,65 24,59 C 24,51 18,49 14,49 C 18,49 24,47 24,39 C 24,33 26,30 32,30 Z"
          fill="url(#code-grad-1)"
        />
        {/* Center [ ] */}
        <path
          d="M 40,24 L 54,24 L 54,34 L 48,34 L 48,66 L 54,66 L 54,76 L 40,76 Z"
          fill="url(#code-grad-2)"
        />
        <path
          d="M 60,24 L 46,24 L 46,34 L 52,34 L 52,66 L 46,66 L 46,76 L 60,76 Z"
          fill="url(#code-grad-2)"
          transform="translate(106, 0) scale(-1, 1)"
        />
        {/* Right curly brace } */}
        <path
          d="M 68,18 C 80,18 84,28 84,38 C 84,46 90,49 96,49 C 90,51 84,54 84,62 C 84,72 80,82 68,82 L 68,70 C 74,70 76,65 76,59 C 76,51 82,49 86,49 C 82,49 76,47 76,39 C 76,33 74,30 68,30 Z"
          fill="url(#code-grad-1)"
        />
      </g>
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
