import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ClayButtonVariant = "primary" | "secondary" | "soft" | "outline" | "ghost";
export type ClayButtonSize = "sm" | "default" | "lg";

// Alturas generosas: el mínimo (h-11 = 44px) respeta el tap target.
const sizeClasses: Record<ClayButtonSize, string> = {
  sm: "h-11 px-6 text-sm rounded-[20px]",
  default: "h-14 px-8 text-base rounded-[20px]",
  lg: "h-16 px-10 text-lg rounded-[20px]",
};

const variantClasses: Record<ClayButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] text-white shadow-clay-button hover:shadow-clay-button-hover",
  secondary: "bg-white text-clay-foreground shadow-clay-button hover:shadow-clay-button-hover",
  soft: "bg-clay-accent-soft text-clay-accent shadow-clay-card hover:shadow-clay-card-hover",
  outline:
    "border-2 border-clay-accent/20 bg-transparent text-clay-accent hover:border-clay-accent hover:bg-clay-accent/5",
  ghost: "text-clay-foreground hover:bg-clay-accent/10 hover:text-clay-accent",
};

export function clayButtonClasses(
  variant: ClayButtonVariant = "primary",
  size: ClayButtonSize = "default",
  className?: string
) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-bold tracking-wide transition-all duration-200",
    // Micro-física: sube al hover, se aplasta al click.
    "hover:-translate-y-1 active:translate-y-0 active:scale-[0.92] active:shadow-clay-pressed",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clay-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-clay-canvas",
    "disabled:pointer-events-none disabled:opacity-40 disabled:hover:translate-y-0",
    sizeClasses[size],
    variantClasses[variant],
    className
  );
}

type CommonProps = {
  variant?: ClayButtonVariant;
  size?: ClayButtonSize;
};

export function Button({
  variant = "primary",
  size = "default",
  className,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={clayButtonClasses(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "default",
  className,
  href,
  ...props
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const external = href.startsWith("http") || href.startsWith("mailto:");
  const classes = clayButtonClasses(variant, size, className);
  if (external) {
    return <a href={href} className={classes} {...props} />;
  }
  return (
    <Link href={href} className={classes} {...props}>
      {props.children}
    </Link>
  );
}
