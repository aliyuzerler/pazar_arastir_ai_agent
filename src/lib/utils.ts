import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind sınıflarını koşullu ve çakışmasız birleştirir. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
