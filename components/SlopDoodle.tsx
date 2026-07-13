/**
 * hand-drawn "slop grader" doodle — a wobbly little robot stamping FAIL on a
 * stack of model outputs. inline svg so it ships with zero asset weight and
 * inherits the site's zinc palette.
 */
export function SlopDoodle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 260"
      fill="none"
      className={className}
      aria-label="a sloppy robot grading model outputs"
      role="img"
    >
      {/* messy paper stack */}
      <g stroke="#3f3f46" strokeWidth="2" strokeLinecap="round">
        <rect x="28" y="176" width="86" height="52" rx="3" transform="rotate(-7 71 202)" fill="#09090b" />
        <rect x="36" y="170" width="86" height="52" rx="3" transform="rotate(4 79 196)" fill="#09090b" />
        <rect x="30" y="160" width="90" height="54" rx="3" transform="rotate(-2 75 187)" fill="#18181b" />
        {/* scribbled "text" lines on top sheet */}
        <path d="M44 174 q14 -3 28 0 t28 0" stroke="#52525b" strokeWidth="1.5" />
        <path d="M44 184 q18 3 34 0 t30 -1" stroke="#52525b" strokeWidth="1.5" />
        <path d="M44 194 q10 -2 22 0" stroke="#52525b" strokeWidth="1.5" />
      </g>
      {/* big scrawled FAIL stamp */}
      <g transform="rotate(-12 78 186)">
        <rect x="52" y="176" width="54" height="20" rx="2" stroke="#ef4444" strokeWidth="2" fill="none" />
        <text x="59" y="191" fill="#ef4444" fontFamily="monospace" fontSize="13" fontWeight="bold">
          FAIL
        </text>
      </g>

      {/* robot body — wobbly rectangles */}
      <g stroke="#e4e4e7" strokeWidth="2.5" strokeLinecap="round" fill="none">
        {/* head */}
        <path d="M188 62 q-3 -26 26 -27 q31 -2 29 26 q1 24 -28 24 q-28 1 -27 -23 z" fill="#09090b" />
        {/* antenna */}
        <path d="M214 34 q2 -10 -3 -16" />
        <circle cx="210" cy="15" r="4" fill="#f59e0b" stroke="none" />
        {/* eyes — one confident, one confused */}
        <circle cx="203" cy="58" r="4.5" fill="#e4e4e7" stroke="none" />
        <path d="M225 54 q6 4 0 9" strokeWidth="2" />
        {/* crooked mouth */}
        <path d="M202 74 q8 5 20 -2" strokeWidth="2" />
        {/* torso */}
        <path d="M192 96 q-4 -8 10 -9 l28 -1 q13 0 10 10 l-3 52 q0 9 -11 9 l-22 1 q-11 1 -11 -9 z" fill="#09090b" />
        {/* left arm holding red marker over the stack */}
        <path d="M192 104 q-24 6 -44 40" />
        {/* right arm scratching head */}
        <path d="M238 100 q26 -8 22 -38" />
        {/* legs */}
        <path d="M204 158 q-1 16 -2 24" />
        <path d="M226 158 q2 16 2 24" />
        <path d="M196 184 h14" />
        <path d="M222 184 h14" />
      </g>
      {/* red marker in the left hand */}
      <g transform="rotate(38 146 146)">
        <rect x="140" y="138" width="8" height="22" rx="2" fill="#ef4444" />
        <path d="M144 160 l0 8" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* chest panel — tiny scoreboard */}
      <g fontFamily="monospace" fontSize="9">
        <rect x="200" y="106" width="34" height="26" rx="2" stroke="#3f3f46" strokeWidth="1.5" fill="none" />
        <text x="205" y="117" fill="#34d399">p 41%</text>
        <text x="205" y="128" fill="#ef4444">f 59%</text>
      </g>

      {/* floating judgment scribbles */}
      <g fontFamily="monospace" stroke="none">
        <text x="262" y="70" fill="#3f3f46" fontSize="11" transform="rotate(8 262 70)">hmm.</text>
        <text x="140" y="40" fill="#3f3f46" fontSize="14" transform="rotate(-10 140 40)">?!</text>
        <text x="268" y="150" fill="#52525b" fontSize="10" transform="rotate(-6 268 150)">0/10</text>
      </g>
      {/* motion scribbles around the marker */}
      <g stroke="#52525b" strokeWidth="1.5" strokeLinecap="round">
        <path d="M128 132 q-6 -4 -10 -10" />
        <path d="M124 144 q-8 0 -14 -3" />
      </g>
    </svg>
  );
}
