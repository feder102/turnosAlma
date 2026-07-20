import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Asterisco de 8 puntas: motivo gráfico secundario de la marca
 * (aparece suelto en las piezas de Instagram, no forma parte del isotipo).
 */
export function Asterisk({ className }: { className?: string }) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden>
      {rays.map((deg) => (
        <rect
          key={deg}
          x="45.5"
          y="8"
          width="9"
          height="34"
          rx="4.5"
          fill="currentColor"
          transform={`rotate(${deg} 50 50)`}
        />
      ))}
    </svg>
  );
}

/**
 * Wordmark de la marca: "Alma" en script + la V-folículo + "San Juan".
 * `src` apunta al lockup real (public/brand/alma-mark.png, 657×320).
 * Sin `src`, cae a una aproximación tipográfica en Playfair.
 */
export function Logo({
  src,
  tagline = false,
  className,
}: {
  src?: string;
  tagline?: boolean;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt="Alma San Juan — Depilación definitiva láser"
        width={657}
        height={320}
        priority
        className={cn("h-11 w-auto sm:h-14", className)}
      />
    );
  }

  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <Asterisk className="h-9 w-9 shrink-0 text-clay-accent" />
      <span className="min-w-0">
        <span
          className="block truncate text-lg font-extrabold leading-tight tracking-tight text-clay-accent sm:text-xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Alma <span className="text-clay-foreground">San Juan</span>
        </span>
        {tagline && (
          <span className="block text-[10px] uppercase tracking-[0.18em] text-clay-muted">
            Depilación definitiva láser
          </span>
        )}
      </span>
    </span>
  );
}
