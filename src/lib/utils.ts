import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import logger from './logger';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function logToServer(message: string) {
  logger.info(message);
}

