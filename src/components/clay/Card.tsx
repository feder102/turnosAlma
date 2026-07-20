import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardVariant = "glass" | "solid";

/**
 * Superficie clay convexa.
 *
 * `className` estiliza la superficie (padding, radio, fondo).
 * `contentClassName` estiliza el layout de los hijos — usalo para grillas o
 * cualquier disposición interna: los hijos viven en un wrapper propio que
 * existe para que las decoraciones absolutas queden por debajo (z-10).
 *
 * La variante `glass` (blanco translúcido + backdrop-blur) deja ver los
 * blobs del fondo: es lo que da el híbrido "glass-clay".
 */
export function Card({
  variant = "glass",
  hoverLift = false,
  className,
  contentClassName,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  hoverLift?: boolean;
  contentClassName?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[32px] p-6 text-clay-foreground shadow-clay-card backdrop-blur-xl transition-all duration-500 sm:p-8",
        variant === "glass" ? "bg-white/70" : "bg-white",
        hoverLift && "hover:-translate-y-2 hover:shadow-clay-card-hover",
        className
      )}
      {...props}
    >
      <div className={cn("relative z-10 flex h-full flex-col", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
