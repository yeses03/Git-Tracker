import type { MoonPhase } from "@/lib/moon";

/** Small crescent beside the wordmark. Decorative. */
export function CrescentLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path
        d="M21 4.5a12 12 0 1 0 6.5 20.8A10 10 0 0 1 21 4.5Z"
        fill="#e7eaf4"
        opacity="0.92"
      />
      <circle cx="26" cy="8" r="0.9" fill="#c6a8ff" />
      <circle cx="29" cy="13" r="0.6" fill="#929db5" />
    </svg>
  );
}

/** Moon disc with the real lit portion drawn from the computed phase. */
export function MoonDisc({ phase, size = 64 }: { phase: MoonPhase; size?: number }) {
  const r = 30;
  const c = Math.cos(2 * Math.PI * phase.fraction); // 1 new … -1 full
  const rx = Math.abs(c) * r;
  const sweep = c > 0 ? 0 : 1; // crescent bulges toward the lit limb, gibbous away
  const lit = `M 32 ${32 - r} A ${r} ${r} 0 0 1 32 ${32 + r} A ${rx} ${r} 0 0 ${sweep} 32 ${32 - r} Z`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`${phase.name}, ${phase.illumination}% illuminated`}>
      <circle cx="32" cy="32" r={r} fill="#141f33" stroke="#202d43" />
      <g transform={phase.waxing ? undefined : "translate(64 0) scale(-1 1)"}>
        <path d={lit} fill="#dfe3ee" />
      </g>
      <circle cx="24" cy="26" r="2.2" fill="#000" opacity="0.07" />
      <circle cx="39" cy="38" r="3" fill="#000" opacity="0.06" />
    </svg>
  );
}

/** Quiet lunar landscape + sparse stars for the bottom of the sidebar. Decorative. */
export function SidebarLandscape() {
  return (
    <svg
      viewBox="0 0 248 150"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none block w-full"
      aria-hidden="true"
      focusable="false"
    >
      {[
        [30, 22, 1], [88, 10, 0.8], [140, 34, 1.1], [200, 18, 0.8], [58, 60, 0.7],
        [170, 64, 0.9], [112, 78, 0.6], [226, 52, 0.7], [14, 88, 0.7],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#c9d1e6" opacity="0.55" />
      ))}
      <circle cx="196" cy="104" r="34" fill="#141f33" />
      <circle cx="184" cy="96" r="5" fill="#101a2c" />
      <circle cx="206" cy="112" r="7" fill="#101a2c" />
      <path d="M0 150V112l34-30 22 20 30-42 36 46 26-18 40 30 20-14 40 30v46Z" fill="#0f1a2e" />
      <path d="M0 150v-26l40-20 30 22 34-26 36 30 38-16 70 24v12Z" fill="#0c1526" />
    </svg>
  );
}

type IconProps = { className?: string };
const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export const IconToday = ({ className }: IconProps) => (
  <svg {...base} className={className}><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M4 10h16M9 15l2 2 4-4" /></svg>
);
export const IconTrophy = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M9 20h6M10 17h4" /></svg>
);
export const IconChart = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M4 20V5M4 20h16M8 16v-4M12 16V8M16 16v-6" /></svg>
);
export const IconSettings = ({ className }: IconProps) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" /></svg>
);
export const IconSun = ({ className }: IconProps) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></svg>
);
export const IconMenu = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const IconClose = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconCheck = ({ className }: IconProps) => (
  <svg {...base} width={14} height={14} strokeWidth={2.4} className={className}><path d="m5 12 4.5 4.5L19 7" /></svg>
);
export const IconUser = ({ className }: IconProps) => (
  <svg {...base} className={className}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1-3.5 4-5 7-5s6 1.5 7 5" /></svg>
);
