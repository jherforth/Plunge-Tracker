import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const retroBorder = "border-[2px] border-sky-950 dark:border-sky-200 rounded-md";
export const retroShadow = "shadow-[inset_-2px_-2px_0_rgba(0,0,0,0.15),inset_2px_2px_0_rgba(255,255,255,0.7),2px_2px_0_#082f49] dark:shadow-[inset_-2px_-2px_0_rgba(0,0,0,0.3),inset_2px_2px_0_rgba(255,255,255,0.1),2px_2px_0_#bae6fd]";
export const retroHover = "hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[inset_-2px_-2px_0_rgba(0,0,0,0.15),inset_2px_2px_0_rgba(255,255,255,0.7),1px_1px_0_#082f49] dark:hover:shadow-[inset_-2px_-2px_0_rgba(0,0,0,0.3),inset_2px_2px_0_rgba(255,255,255,0.1),1px_1px_0_#bae6fd] transition-none";
export const retroCard = cn(retroBorder, retroShadow, "bg-sky-50 dark:bg-sky-900");
export const retroButton = cn(
  retroBorder, 
  "shadow-[inset_-2px_-2px_0_rgba(0,0,0,0.2),inset_2px_2px_0_rgba(255,255,255,0.8),2px_2px_0_#082f49] dark:shadow-[inset_-2px_-2px_0_rgba(0,0,0,0.4),inset_2px_2px_0_rgba(255,255,255,0.2),2px_2px_0_#bae6fd]",
  retroHover, 
  "active:translate-x-[2px] active:translate-y-[2px] active:shadow-[inset_2px_2px_0_rgba(0,0,0,0.2)] dark:active:shadow-[inset_2px_2px_0_rgba(0,0,0,0.5)] active:bg-sky-100 dark:active:bg-sky-950"
);

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}
