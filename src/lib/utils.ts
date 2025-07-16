import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatAmount(amount: string, decimals: number = 18): string {
  const value = parseFloat(amount) / Math.pow(10, decimals);
  return value.toFixed(4);
}

export function parseAmount(amount: string, decimals: number = 18): string {
  const value = parseFloat(amount) * Math.pow(10, decimals);
  return value.toString();
}
