import type { CSSProperties } from "react";

import { cx } from "@/lib/classes";

type DitherSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

/** Literal class names so Tailwind can see every branch. */
const sizeClass: Record<DitherSize, string> = {
  xs: "dither-xs",
  sm: "dither-sm",
  md: "dither-md",
  lg: "dither-lg",
  xl: "dither-xl",
  "2xl": "dither-2xl",
};

interface DitherProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** ordered-dither cell size */
  size?: DitherSize;
  grayscale?: number;
  contrast?: number;
  brightness?: number;
  blur?: number;
  /** dot-screen opacity */
  opacity?: number;
  /** dot-screen opacity on hover */
  hover?: number;
  eager?: boolean;
  className?: string;
}

export default function Dither({
  src,
  alt,
  width,
  height,
  size = "md",
  grayscale = 1,
  contrast = 120,
  brightness = 1,
  blur = 0,
  opacity = 1,
  hover = 0.34,
  eager = false,
  className,
}: DitherProps) {
  const style = {
    "--dither-gray": String(grayscale),
    /* percentage, not a bare multiplier: `contrast(132)` would mean 13,200%
       and hard-threshold the image to pure black/white */
    "--dither-contrast": `${contrast}%`,
    "--dither-bright": String(brightness),
    "--dither-blur": `${blur}px`,
    "--dither-opacity": String(opacity),
    "--dither-hover": String(hover),
  } as CSSProperties;

  return (
    <div
      data-dither=""
      className={cx(
        "relative isolate aspect-square overflow-hidden bg-black",
        "after:pointer-events-none after:absolute after:inset-0 after:z-[1] after:transition-opacity after:duration-[550ms]",
        "hover:after:opacity-(--dither-hover)",
        sizeClass[size],
        className,
      )}
      style={style}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="h-full w-full object-cover"
      />
    </div>
  );
}