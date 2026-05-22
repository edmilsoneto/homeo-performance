/**
 * Geometric pattern SVG: White on dark background, clustered top-right.
 * Used for Registration Screen.
 */
export const GeometricPatternTopRight = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    viewBox="0 0 400 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ width: '100%', height: '100%', ...style }}
    preserveAspectRatio="xMidYMid slice"
  >
    <g fill="white" opacity="0.9">
      {/* Top-right cluster */}
      <rect x="280" y="10" width="12" height="45" rx="4" />
      <rect x="268" y="22" width="36" height="12" rx="4" />

      <rect x="320" y="40" width="12" height="50" rx="4" />
      <rect x="308" y="55" width="36" height="12" rx="4" />

      <rect x="350" y="5" width="10" height="40" rx="4" />
      <rect x="340" y="15" width="30" height="10" rx="4" />

      <rect x="360" y="60" width="12" height="45" rx="4" />
      <rect x="348" y="72" width="36" height="12" rx="4" />

      <rect x="300" y="90" width="10" height="35" rx="4" />
      <rect x="290" y="100" width="30" height="10" rx="4" />

      <rect x="340" y="110" width="12" height="40" rx="4" />
      <rect x="330" y="122" width="34" height="12" rx="4" />

      <rect x="370" y="120" width="10" height="35" rx="4" />

      <rect x="260" y="60" width="10" height="35" rx="4" />
      <rect x="250" y="70" width="30" height="10" rx="4" />
    </g>
  </svg>
);

/**
 * Geometric pattern SVG: Black on white background, clustered top-left and left edge.
 * Used for Login Screen.
 */
export const GeometricPatternTopLeft = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    viewBox="0 0 400 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ width: '100%', height: '100%', ...style }}
    preserveAspectRatio="xMidYMid slice"
  >
    <g fill="#1a1a1a" opacity="0.9">
      {/* Top-left cluster */}
      <rect x="20" y="10" width="12" height="45" rx="4" />
      <rect x="8" y="22" width="36" height="12" rx="4" />

      <rect x="60" y="40" width="12" height="50" rx="4" />
      <rect x="48" y="55" width="36" height="12" rx="4" />

      <rect x="90" y="5" width="10" height="40" rx="4" />
      <rect x="80" y="15" width="30" height="10" rx="4" />

      <rect x="100" y="60" width="12" height="45" rx="4" />
      <rect x="88" y="72" width="36" height="12" rx="4" />

      <rect x="40" y="90" width="10" height="35" rx="4" />
      <rect x="30" y="100" width="30" height="10" rx="4" />

      <rect x="80" y="110" width="12" height="40" rx="4" />
      <rect x="70" y="122" width="34" height="12" rx="4" />

      {/* Down the left edge */}
      <rect x="20" y="140" width="12" height="45" rx="4" />
      <rect x="8" y="152" width="36" height="12" rx="4" />

      <rect x="40" y="180" width="12" height="50" rx="4" />
      <rect x="28" y="195" width="36" height="12" rx="4" />

      <rect x="15" y="220" width="12" height="40" rx="4" />
      <rect x="5" y="232" width="36" height="12" rx="4" />

      <rect x="35" y="260" width="12" height="45" rx="4" />
      <rect x="25" y="272" width="36" height="12" rx="4" />
    </g>
  </svg>
);

/**
 * Curved divider between the dark top and the white bottom.
 */
export const CurvedDivider = ({ color = '#ffffff' }: { color?: string }) => (
  <svg
    viewBox="0 0 400 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', display: 'block', marginTop: -1 }}
    preserveAspectRatio="none"
  >
    <path
      d="M0 60 L0 30 Q50 0 120 10 Q200 22 280 8 Q350 -2 400 15 L400 60 Z"
      fill={color}
    />
  </svg>
);
