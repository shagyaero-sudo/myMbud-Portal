import React, { useId } from "react";

const PATHS = {
  e: "M1500 0H1920V1080H1500Z",
  a: "M653 0C786 360 883 720 904 1080H1500V0Z",
  b: "M1133 0C1112 360 1049 720 970 1080H1500V0Z",
  d: "M1330 0H1624C1591 360 1569 720 1568 1080H1330Z",
  c: "M1296 0H1618C1467 360 1402 720 1403 1080H1174C1155 720 1177 360 1296 0Z",
};

export default function LayeredWave({
  preserveAspectRatio = "xMidYMid slice",
  className = "",
  children,
}: {
  preserveAspectRatio?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const uid = useId().replace(/:/g, "");
  const id = (n: string) => `${uid}-${n}`;

  // Mengambil CSS variable tema myMbud
  const vBg = "var(--color-slate-950, #0e0f12)";
  const vSecondary = "var(--glow-1, #0284c7)";
  const vAccent = "var(--glow-2, #3b82f6)";

  const grad = (name: string, stops: [number, string][]) => (
    <linearGradient
      id={id(name)}
      gradientUnits="userSpaceOnUse"
      x1="0"
      y1="0"
      x2="0"
      y2="1080"
    >
      {stops.map(([offset, color]) => (
        <stop key={offset} offset={offset} style={{ stopColor: color }} />
      ))}
    </linearGradient>
  );

  return (
    <div className={`relative isolate overflow-hidden bg-slate-100 dark:bg-[#0e0f12] ${className}`}>
      {/* Background Glow Ambient (Statis, Hardware-Accelerated, Bebas Efek Pernafasan) */}
      <div 
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-30 dark:opacity-40 blur-[90px] transform-gpuWillChange-transform"
        style={{ transform: "translateZ(0)" }}
      >
        <svg
          aria-hidden="true"
          focusable="false"
          className="block h-full w-full scale-105"
          viewBox="0 0 1920 1080"
          preserveAspectRatio={preserveAspectRatio}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {grad("a", [[0.125, vSecondary], [1, vBg]])}
            {grad("b", [[0.05, vSecondary], [0.82, vAccent]])}
            {grad("d", [[0.05, vAccent], [0.84, vSecondary]])}
            {grad("e", [[0.15, vBg], [0.95, vSecondary]])}
          </defs>

          <rect width="1920" height="1080" fill={vBg} />
          <path d={PATHS.e} fill={`url(#${id("e")})`} />
          <path d={PATHS.a} fill={`url(#${id("a")})`} />
          <path d={PATHS.b} fill={`url(#${id("b")})`} />
          <path d={PATHS.d} fill={`url(#${id("d")})`} />
          <path d={PATHS.c} fill={vAccent} />
        </svg>
      </div>

      {children}
    </div>
  );
}