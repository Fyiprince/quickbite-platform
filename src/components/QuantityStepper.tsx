import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  quantity,
  onChange,
  size = "sm",
}: {
  quantity: number;
  onChange: (q: number) => void;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground shadow-sm",
        size === "sm" ? "px-1 py-0.5" : "px-1.5 py-1",
      )}
    >
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => onChange(quantity - 1)}
        className={cn(
          "flex items-center justify-center rounded-full transition-colors hover:bg-primary-foreground/15",
          size === "sm" ? "size-6" : "size-8",
        )}
        aria-label="Decrease quantity"
      >
        <Minus className={size === "sm" ? "size-3" : "size-4"} />
      </motion.button>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={quantity}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ duration: 0.12 }}
          className={cn(
            "min-w-4 text-center font-semibold tabular-nums",
            size === "sm" ? "text-xs" : "text-sm",
          )}
        >
          {quantity}
        </motion.span>
      </AnimatePresence>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => onChange(quantity + 1)}
        className={cn(
          "flex items-center justify-center rounded-full transition-colors hover:bg-primary-foreground/15",
          size === "sm" ? "size-6" : "size-8",
        )}
        aria-label="Increase quantity"
      >
        <Plus className={size === "sm" ? "size-3" : "size-4"} />
      </motion.button>
    </div>
  );
}
