import { motion } from "framer-motion";
import { useMemo } from "react";

const COLORS = ["#f97316", "#22c55e", "#eab308", "#0ea5e9", "#ec4899", "#84cc16"];

export function ConfettiBurst({ count = 60 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 360,
        y: -(80 + Math.random() * 220),
        rotate: (Math.random() - 0.5) * 720,
        color: COLORS[i % COLORS.length],
        size: 5 + Math.random() * 6,
        delay: Math.random() * 0.25,
        duration: 0.9 + Math.random() * 0.8,
        round: Math.random() > 0.5,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{
            x: 0,
            y: "110vh",
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            x: p.x,
            y: p.y,
            rotate: p.rotate,
            opacity: [1, 1, 0.9, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2"
          style={{
            width: p.size,
            height: p.round ? p.size : p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: p.round ? "9999px" : "2px",
          }}
        />
      ))}
    </div>
  );
}
