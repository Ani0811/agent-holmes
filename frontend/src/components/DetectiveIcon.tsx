import React from "react";

interface DetectiveIconProps {
  className?: string;
  size?: number | string;
  variant?: "badge" | "minimal" | "glow";
}

/**
 * Custom Detective Icon for Agent Holmes.
 * Depicts the classic Sherlock Holmes Deerstalker silhouette with
 * a cyber-forensic neon magnifying lens inspecting code evidence.
 */
export function DetectiveIcon({
  className = "",
  size = 32,
  variant = "badge",
}: DetectiveIconProps) {
  const pixelSize = typeof size === "number" ? `${size}px` : size;

  if (variant === "minimal") {
    return (
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block transition-transform duration-300 hover:scale-105 ${className}`}
      >
        <defs>
          <linearGradient id="minHat" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="100%" stop-color="#0284c7" />
          </linearGradient>
          <linearGradient id="minLens" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="100%" stop-color="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Deerstalker Crown */}
        <path d="M 20 25 C 20 14, 44 14, 44 25 Z" fill="url(#minHat)" />
        <path d="M 32 14 C 30 11, 34 11, 32 14" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />

        {/* Visors */}
        <path
          d="M 12 28 C 17 26, 21 25, 23 25 C 23 23, 41 23, 41 25 C 43 25, 47 26, 52 28 C 47 30, 42 28, 38 27 C 26 27, 22 28, 12 28 Z"
          fill="#38bdf8"
        />

        {/* Coat Collar */}
        <path d="M 23 44 L 27 34 L 37 34 L 41 44 Z" fill="#1e293b" />
        <path d="M 27 34 L 32 41 L 37 34" stroke="#0ea5e9" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Magnifying Glass */}
        <line x1="39" y1="41" x2="52" y2="54" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
        <circle cx="33" cy="35" r="11" fill="#090d16" stroke="url(#minLens)" strokeWidth="2.5" />
        <circle cx="33" cy="35" r="2.5" fill="#f59e0b" />
      </svg>
    );
  }

  return (
    <div
      style={{ width: pixelSize, height: pixelSize }}
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-all duration-300 filter drop-shadow-[0_0_8px_rgba(56,189,248,0.3)] hover:drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]"
      >
        <defs>
          <radialGradient id="badgeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#080c16" stopOpacity="0.9" />
          </radialGradient>
          <linearGradient id="hatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="60%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id="lensRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="amberCore" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Badge Background */}
        <rect width="64" height="64" rx="14" fill="#090d16" />
        <circle cx="32" cy="32" r="28" fill="url(#badgeGlow)" />
        <rect
          width="62"
          height="62"
          x="1"
          y="1"
          rx="13"
          stroke="#0ea5e9"
          strokeWidth="1.2"
          strokeOpacity="0.4"
        />

        {/* Detective Deerstalker Hat */}
        <path d="M 20 25 C 20 14, 44 14, 44 25 Z" fill="url(#hatGradient)" />
        <path
          d="M 21 24 C 28 22, 36 22, 43 24 L 43 26 C 36 24, 28 24, 21 26 Z"
          fill="#0c4a6e"
        />
        <path
          d="M 32 14 C 30 11, 34 11, 32 14"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Front & Back Visors */}
        <path
          d="M 12 28 C 17 26, 21 25, 23 25 C 23 23, 41 23, 41 25 C 43 25, 47 26, 52 28 C 47 30, 42 28, 38 27 C 26 27, 22 28, 12 28 Z"
          fill="#38bdf8"
          filter="url(#neonGlow)"
        />

        {/* Ear Flaps tied up */}
        <path
          d="M 24 23 C 24 18, 28 16, 32 15 C 36 16, 40 18, 40 23 C 37 20, 27 20, 24 23 Z"
          fill="#0284c7"
          opacity="0.9"
        />

        {/* Detective Coat Collar */}
        <path d="M 22 46 L 27 34 L 37 34 L 42 46 Z" fill="#1e293b" />
        <path
          d="M 27 34 L 32 41 L 37 34"
          stroke="#0ea5e9"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Foreground Magnifying Glass */}
        <line
          x1="39"
          y1="41"
          x2="52"
          y2="54"
          stroke="url(#hatGradient)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <line
          x1="39"
          y1="41"
          x2="52"
          y2="54"
          stroke="#38bdf8"
          strokeWidth="1.8"
          strokeLinecap="round"
          filter="url(#neonGlow)"
        />

        <circle
          cx="33"
          cy="35"
          r="12"
          fill="#050811"
          stroke="url(#lensRing)"
          strokeWidth="2.8"
          filter="url(#neonGlow)"
        />
        <circle cx="33" cy="35" r="9.5" fill="#0c1f38" opacity="0.85" />

        {/* Lens Glare */}
        <path
          d="M 27 29 A 7 7 0 0 1 37 29"
          stroke="#e0f2fe"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Target Reticle / Bug Evidence inside Lens */}
        <circle
          cx="33"
          cy="35"
          r="2.5"
          fill="url(#amberCore)"
          filter="url(#neonGlow)"
        />
        <path
          d="M 33 30 L 33 32 M 33 38 L 33 40 M 28 35 L 30 35 M 36 35 L 38 35"
          stroke="#f59e0b"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
