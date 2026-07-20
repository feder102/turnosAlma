import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// Concavidad: el campo está hundido en la superficie de arcilla y sube
// a blanco elevado al enfocarse.
const fieldBase =
  "w-full border-0 bg-[#EFEBF5] px-6 py-4 text-clay-foreground shadow-clay-pressed placeholder:text-clay-muted transition-all duration-200 focus:bg-white focus:shadow-none focus:outline-none focus:ring-4 focus:ring-clay-accent/20";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, "h-16 rounded-2xl text-lg", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "rounded-2xl text-lg", className)} {...props} />;
}
