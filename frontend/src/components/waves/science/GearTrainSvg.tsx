import { motion } from "framer-motion";

export interface GearProps {
  teeth?: number;
  radius?: number;
  color?: string;
  shadowColor?: string;
  isRotating?: boolean;
  /** 1 for clockwise, -1 for counter-clockwise */
  direction?: 1 | -1;
  speed?: number; // duration in seconds per full rotation
  showRadiusLine?: boolean;
  showRotationArrow?: boolean;
  className?: string;
}

/** Generates SVG path for a gear with trapezoidal involute-like teeth */
export function generateGearPath(teeth = 16, radius = 50): string {
  const addendum = radius * 0.18; // tooth height outward
  const dedendum = radius * 0.14; // tooth depth inward
  const rOuter = radius + addendum;
  const rInner = radius - dedendum;

  const points: string[] = [];
  const step = (Math.PI * 2) / teeth;

  for (let i = 0; i < teeth; i++) {
    const angle = i * step;
    const a0 = angle - step * 0.28;
    const a1 = angle - step * 0.16;
    const a2 = angle + step * 0.16;
    const a3 = angle + step * 0.28;

    // Inner bottom left
    const x0 = radius + rInner * Math.cos(a0);
    const y0 = radius + rInner * Math.sin(a0);
    // Outer top left
    const x1 = radius + rOuter * Math.cos(a1);
    const y1 = radius + rOuter * Math.sin(a1);
    // Outer top right
    const x2 = radius + rOuter * Math.cos(a2);
    const y2 = radius + rOuter * Math.sin(a2);
    // Inner bottom right
    const x3 = radius + rInner * Math.cos(a3);
    const y3 = radius + rInner * Math.sin(a3);

    if (i === 0) {
      points.push(`M ${x0.toFixed(2)} ${y0.toFixed(2)}`);
    } else {
      points.push(`L ${x0.toFixed(2)} ${y0.toFixed(2)}`);
    }
    points.push(`L ${x1.toFixed(2)} ${y1.toFixed(2)}`);
    points.push(`L ${x2.toFixed(2)} ${y2.toFixed(2)}`);
    points.push(`L ${x3.toFixed(2)} ${y3.toFixed(2)}`);
  }

  points.push("Z");
  return points.join(" ");
}

export function SingleGear({
  teeth = 16,
  radius = 50,
  color = "#facc15",
  shadowColor = "#ca8a04",
  isRotating = false,
  direction = 1,
  speed = 4,
  showRadiusLine = false,
  showRotationArrow = false,
  className = "",
}: GearProps) {
  const size = (radius + radius * 0.22) * 2;
  const center = size / 2;
  const gearPath = generateGearPath(teeth, radius);

  return (
    <div
      className={`relative flex items-center justify-center ${className}`.trim()}
      style={{ width: size, height: size }}
    >
      {/* Rotation Arrow Indicator if enabled */}
      {showRotationArrow && (
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="pointer-events-none absolute inset-0 size-full z-20"
        >
          {direction === -1 ? (
            // Counter-Clockwise Arrow
            <g className="text-white drop-shadow-md">
              <path
                d={`M ${center - radius * 0.6} ${center - radius * 0.9} A ${radius * 1.1} ${radius * 1.1} 0 0 1 ${center + radius * 0.6} ${center - radius * 0.9}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <polygon
                points={`${center - radius * 0.8},${center - radius * 0.9} ${center - radius * 0.5},${center - radius * 1.1} ${center - radius * 0.5},${center - radius * 0.7}`}
                fill="currentColor"
              />
            </g>
          ) : (
            // Clockwise Arrow
            <g className="text-white drop-shadow-md">
              <path
                d={`M ${center - radius * 0.6} ${center - radius * 0.9} A ${radius * 1.1} ${radius * 1.1} 0 0 1 ${center + radius * 0.6} ${center - radius * 0.9}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <polygon
                points={`${center + radius * 0.8},${center - radius * 0.9} ${center + radius * 0.5},${center - radius * 0.7} ${center + radius * 0.5},${center - radius * 1.1}`}
                fill="currentColor"
              />
            </g>
          )}
        </svg>
      )}

      {/* Rotating Gear Body */}
      <motion.svg
        viewBox={`0 0 ${size} ${size}`}
        className="size-full overflow-visible drop-shadow-xl"
        animate={isRotating ? { rotate: direction === 1 ? [0, 360] : [0, -360] } : { rotate: 0 }}
        transition={
          isRotating ? { repeat: Infinity, duration: speed, ease: "linear" } : { duration: 0.3 }
        }
      >
        <g transform={`translate(${center - radius}, ${center - radius})`}>
          {/* Outer Gear Teeth Silhouette with 3D Bevel */}
          <path d={gearPath} fill={shadowColor} transform="translate(0, 4)" />
          <path d={gearPath} fill={color} />

          {/* Inner Axle Hub Rim */}
          <circle cx={radius} cy={radius} r={radius * 0.38} fill={shadowColor} opacity="0.3" />
          <circle cx={radius} cy={radius} r={radius * 0.32} fill={color} />
          <circle cx={radius} cy={radius} r={radius * 0.22} fill="#334155" />
          <circle cx={radius} cy={radius} r={radius * 0.14} fill="#64748b" />
          <circle cx={radius} cy={radius} r={radius * 0.08} fill="#0f172a" />

          {/* Radius Reference Line (for Learn step teaching) */}
          {showRadiusLine && (
            <line
              x1={radius}
              y1={radius}
              x2={radius}
              y2={radius - radius * 0.95}
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeDasharray="3 3"
              strokeLinecap="round"
            />
          )}
        </g>
      </motion.svg>
    </div>
  );
}

export interface GearTrainProps {
  mode: "intro_3gears" | "teaching_2gears" | "evaluate_3gears";
  isRotating?: boolean;
  className?: string;
}

export function GearTrainSvg({
  mode = "intro_3gears",
  isRotating = true,
  className = "",
}: GearTrainProps) {
  if (mode === "teaching_2gears") {
    // 2 Connected Adjacent Gears
    return (
      <div className={`relative flex items-center justify-center gap-0 ${className}`.trim()}>
        {/* Yellow Gear (Left: Direction 1) */}
        <div className="relative -mr-6 z-10">
          <SingleGear
            teeth={16}
            radius={56}
            color="#eab308"
            shadowColor="#ca8a04"
            isRotating={isRotating}
            direction={1}
            speed={4}
            showRadiusLine={true}
          />
        </div>

        {/* Teal Gear (Right: Direction -1) */}
        <div className="relative -ml-6 z-10">
          <SingleGear
            teeth={16}
            radius={56}
            color="#14b8a6"
            shadowColor="#0f766e"
            isRotating={isRotating}
            direction={-1}
            speed={4}
            showRadiusLine={true}
          />
        </div>
      </div>
    );
  }

  if (mode === "evaluate_3gears") {
    // 3 Connected Gears (Yellow -> Grey -> Blue)
    return (
      <div className={`relative flex items-center justify-center ${className}`.trim()}>
        {/* Yellow Gear (Driver, Left: Counter-Clockwise -1) */}
        <div className="relative -mr-6 z-10">
          <SingleGear
            teeth={16}
            radius={54}
            color="#f59e0b"
            shadowColor="#d97706"
            isRotating={isRotating}
            direction={-1}
            speed={4}
            showRotationArrow={true}
          />
        </div>

        {/* Grey Gear (Idler, Center: Clockwise 1) */}
        <div className="relative -mx-6 z-0">
          <SingleGear
            teeth={16}
            radius={54}
            color="#94a3b8"
            shadowColor="#64748b"
            isRotating={isRotating}
            direction={1}
            speed={4}
            showRadiusLine={false}
          />
        </div>

        {/* Blue Gear (Driven, Right: Counter-Clockwise -1) */}
        <div className="relative -ml-6 z-10">
          <SingleGear
            teeth={16}
            radius={54}
            color="#3b82f6"
            shadowColor="#1d4ed8"
            isRotating={isRotating}
            direction={-1}
            speed={4}
            showRadiusLine={false}
          />
        </div>
      </div>
    );
  }

  // Default: Intro 3 Gears (Yellow, Teal, Grey) with Hand Driver Artwork
  return (
    <div className={`relative flex items-center justify-center ${className}`.trim()}>
      {/* Hand Driver Indicator on Left */}
      <div className="relative -mr-7 z-20 flex items-center">
        {/* Hand touching gear */}
        <svg
          viewBox="0 0 100 100"
          className="absolute -left-12 -bottom-4 size-20 z-30 drop-shadow-lg"
        >
          <rect x="15" y="45" width="45" height="35" rx="10" fill="#eab308" />
          <path d="M 50,45 C 55,30 75,32 75,48 C 75,60 55,68 50,75 Z" fill="#b45309" />
        </svg>
        <SingleGear
          teeth={16}
          radius={56}
          color="#84cc16"
          shadowColor="#65a30d"
          isRotating={isRotating}
          direction={1}
          speed={4}
        />
      </div>

      {/* Teal Gear (Center) */}
      <div className="relative -mx-7 z-10">
        <SingleGear
          teeth={16}
          radius={56}
          color="#06b6d4"
          shadowColor="#0891b2"
          isRotating={isRotating}
          direction={-1}
          speed={4}
        />
      </div>

      {/* Grey Gear (Right) */}
      <div className="relative -ml-7 z-0">
        <SingleGear
          teeth={16}
          radius={56}
          color="#94a3b8"
          shadowColor="#64748b"
          isRotating={isRotating}
          direction={1}
          speed={4}
        />
      </div>
    </div>
  );
}
