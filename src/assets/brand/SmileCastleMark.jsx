// src/components/brand/SmileCastleMark.jsx
// Inline SVG "happy tooth" mark. No external assets.
// Props:
//  - variant: 'color' | 'mono'  (mono follows currentColor)
//  - theme  : 'violet' | 'mint' | 'blue' | 'coral' (for color variant)
//  - className: sizing classes (e.g. "h-8 w-8")

export default function SmileCastleMark({
  variant = 'color',
  theme = 'violet',
  className = 'h-8 w-8',
}) {
  const isMono = variant === 'mono';

  // Cape gradient per theme (used only in color)
  const themes = {
    violet: ['#A78BFA', '#60A5FA'],
    mint:   ['#34D399', '#22D3EE'],
    blue:   ['#60A5FA', '#3B82F6'],
    coral:  ['#F472B6', '#FB7185'],
  };
  const [g1, g2] = themes[theme] || themes.violet;

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Smile Castle mark"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {!isMono && (
        <defs>
          <linearGradient id="scCapeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={g1} />
            <stop offset="1" stopColor={g2} />
          </linearGradient>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.12" />
          </filter>
        </defs>
      )}

      {/* Cape / shadow sweep */}
      <path
        d="M8 36c10-6 20-6 32-2 8 2 12 2 16-1v8c-6 3-12 3-18 2-12-2-20 1-30 6z"
        fill={isMono ? 'currentColor' : 'url(#scCapeGrad)'}
        opacity={isMono ? 0.18 : 1}
      />

      {/* Tooth body */}
      <path
        d="M18 10c6-6 22-6 28 0 4 4 5 12 1 19-3 5-3 14-8 18-2 2-4 0-5-2-1-2-4-2-5 0-1 2-3 4-5 2-5-4-5-13-8-18-4-7-3-15 2-19z"
        fill={isMono ? 'currentColor' : '#FFFDF9'}
        stroke={isMono ? 'currentColor' : '#E5E7EB'}
        strokeWidth="1.2"
        filter={isMono ? undefined : 'url(#soft)'}
      />

      {/* Eyes */}
      <circle cx="26" cy="26" r="2.2" fill={isMono ? '#fff' : '#0F172A'} opacity={isMono ? 0.9 : 1} />
      <circle cx="38" cy="26" r="2.2" fill={isMono ? '#fff' : '#0F172A'} opacity={isMono ? 0.9 : 1} />

      {/* Smile */}
      <path
        d="M30 33c2 2 6 2 8 0"
        fill="none"
        stroke={isMono ? 'currentColor' : '#0F172A'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Cheeks (color only) */}
      {!isMono && (
        <>
          <circle cx="22.5" cy="30" r="2.3" fill="#FF98AE" />
          <circle cx="41.5" cy="30" r="2.3" fill="#FF98AE" />
        </>
      )}

      {/* Tiny sparkle for friendliness (color only) */}
      {!isMono && (
        <path
          d="M16 18l1.6 0.5L18 20l0.4-1.5L20 18l-1.6-0.5L18 16l-0.4 1.5z"
          fill={g1}
          opacity="0.7"
        />
      )}
    </svg>
  );
}
