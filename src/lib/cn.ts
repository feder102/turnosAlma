import { twMerge } from "tailwind-merge";

// Une clases resolviendo conflictos de Tailwind: la última gana.
// Necesario porque los componentes clay aceptan `className` desde afuera
// (p. ej. una Card que quiere `p-10` sobre el `p-6 sm:p-8` por defecto).
export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(" "));
}
