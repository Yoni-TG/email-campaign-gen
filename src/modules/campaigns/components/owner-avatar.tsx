import { cn } from "@/lib/utils";

interface Props {
  name: string;
  className?: string;
}

// Small circular avatar with initials. We don't have auth/profile photos,
// so initials on a brand-soft background give the row enough visual
// grounding without faking richer identity.
export function OwnerAvatar({ name, className }: Props) {
  const initials = getInitials(name);
  return (
    <span
      title={name}
      aria-label={name}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-full bg-brand-soft text-[10px] font-semibold uppercase tracking-tight text-brand",
        className,
      )}
    >
      {initials}
    </span>
  );
}

function getInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
