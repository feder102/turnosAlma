import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Orbe de ícono clay: convexo, con degradé saturado y sombra de botón.
 * Si recibe `src` muestra la foto; si no, cae al emoji sobre el degradé.
 */
export function IconOrb({
  emoji,
  src,
  gradient,
  className,
}: {
  emoji: string;
  src?: string;
  gradient: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-2xl shadow-clay-button transition-transform duration-300",
        !src && `bg-gradient-to-br ${gradient}`,
        className
      )}
    >
      {src ? (
        <Image src={src} alt="" fill sizes="64px" className="object-cover" />
      ) : (
        <span aria-hidden>{emoji}</span>
      )}
    </span>
  );
}

/**
 * Panel visual grande (hero, sede). Radio de contenedor grande (48px).
 * Con `src` muestra la foto a sangre; sin `src`, la composición de respaldo.
 */
export function Figure({
  src,
  alt,
  className,
  children,
}: {
  src?: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-[48px] shadow-clay-deep",
        !src && "bg-gradient-to-br from-violet-100 via-fuchsia-50 to-sky-100",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      ) : (
        children
      )}
    </div>
  );
}

/**
 * Card de reel (9:16). El video anidado usa un radio 8px menor que la
 * card para mantener la jerarquía de radios del sistema.
 */
export function ReelCard({ src, caption }: { src: string; caption: string }) {
  return (
    <div className="group rounded-[32px] bg-white/70 p-3 shadow-clay-card backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:shadow-clay-card-hover">
      <div className="relative aspect-[9/16] overflow-hidden rounded-[24px] bg-clay-foreground">
        <video
          src={src}
          className="h-full w-full object-cover"
          controls
          muted
          loop
          playsInline
          preload="metadata"
        />
      </div>
      <p className="px-3 pb-2 pt-4 text-sm font-medium leading-relaxed text-clay-muted">
        {caption}
      </p>
    </div>
  );
}
