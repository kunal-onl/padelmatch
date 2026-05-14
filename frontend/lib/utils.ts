// Small helpers shared across screens.
export function formatTimeAgo(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  return `${days}d`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function dayOfWeek(iso: string): string {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return days[new Date(iso).getDay()];
}

export function initial(name: string): string {
  return (name || "?").trim().charAt(0).toUpperCase();
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

export function rangeLabel(min: number, max: number): string {
  if (max < 5) return "Beginner";
  if (max < 7.5) return "Intermediate";
  return "Advanced";
}

export const DAYS = [
  { key: "monday", label: "MON" },
  { key: "tuesday", label: "TUE" },
  { key: "wednesday", label: "WED" },
  { key: "thursday", label: "THU" },
  { key: "friday", label: "FRI" },
  { key: "saturday", label: "SAT" },
  { key: "sunday", label: "SUN" },
];
