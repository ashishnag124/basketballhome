export function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remaining = inches % 12;
  return `${feet}'${remaining}"`;
}

const TZ = "America/Los_Angeles";

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: TZ,
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: TZ,
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const dateDayStr = date.toLocaleDateString("en-US", { timeZone: TZ });
  const nowDayStr = now.toLocaleDateString("en-US", { timeZone: TZ });
  const isToday = dateDayStr === nowDayStr;
  if (isToday) {
    return `Today, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ })}`;
  }
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export function isToday(dateStr: string): boolean {
  const tz = TZ;
  return (
    new Date(dateStr).toLocaleDateString("en-US", { timeZone: tz }) ===
    new Date().toLocaleDateString("en-US", { timeZone: tz })
  );
}

export function isPast(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

export function formatStatValue(value: string | number, decimals = 1): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return value.toString();
  return num.toFixed(decimals);
}
