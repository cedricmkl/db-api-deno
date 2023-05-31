import { parse } from "https://deno.land/std@0.125.0/datetime/mod.ts";

export const ONE_HOUR = 60 * 60 * 1000;

export function parseDateYYMMDDHHmm(timeString: string | null): Date | null {
  if (timeString == null) return null;
  return parse(timeString.toString(), "yyMMddHHmm");
}

export function isWithhin(date: Date, start: Date, end: Date): boolean {
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}
