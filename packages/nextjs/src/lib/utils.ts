import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSui(mist: number | string, decimals = 2) {
  const num = typeof mist === "string" ? parseInt(mist, 10) : mist;
  return (num / 1e9).toFixed(decimals);
}

export function toSui(mist: number | string) {
  const num = typeof mist === "string" ? parseInt(mist, 10) : mist;
  return num * 1e9;
}