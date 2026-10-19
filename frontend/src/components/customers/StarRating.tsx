"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  /** Current selected rating, from 0 (no selection) through 5. */
  value: number;
  /** Called when the customer selects a star. */
  onChange?: (rating: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  showValue?: boolean;
}

const SIZE_CLASSES = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
} as const;

/**
 * Reusable star rating control. Pass onChange for an interactive control;
 * omit it to render a read-only rating display.
 */
export default function StarRating({
  value,
  onChange,
  disabled = false,
  size = "md",
  label,
  showValue = false,
}: StarRatingProps) {
  const rating = Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;
  const interactive = Boolean(onChange) && !disabled;

  return (
    <div
      className="flex flex-wrap items-center gap-1"
      role={interactive ? "group" : "img"}
      aria-label={
        label ??
        (interactive
          ? "Choose a rating from 1 to 5 stars"
          : `${rating} out of 5 stars`)
      }
    >
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const selected = starValue <= rating;
        const className = `${SIZE_CLASSES[size]} ${
          selected
            ? "fill-amber-400 text-amber-400"
            : "text-muted-foreground/40"
        }`;

        if (!interactive) {
          return (
            <Star key={starValue} aria-hidden="true" className={className} />
          );
        }

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange?.(starValue)}
            disabled={disabled}
            aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
            aria-pressed={rating === starValue}
            className="rounded-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Star aria-hidden="true" className={className} />
          </button>
        );
      })}

      {showValue && (
        <span className="ml-1 text-sm font-medium tabular-nums">
          {rating > 0 ? rating.toFixed(1) : "Not rated"}
        </span>
      )}
    </div>
  );
}
