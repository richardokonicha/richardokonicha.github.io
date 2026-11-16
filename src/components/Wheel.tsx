"use client";

/**
 * Wheel — a headless Detent, dressed in this project's tokens.
 *
 * Detent owns the physics, the keyboard model and the ARIA; this component
 * only supplies the square, 1px-rule look. Rows read the live `--offset` and
 * `--abs-offset` variables Detent writes every frame, so the falloff is CSS
 * and React never renders during a throw.
 */

import { useDetent } from "@hayderkg/detent";
import * as React from "react";

import { cx } from "@/lib/classes";

const TONE = {
  paper: {
    row: "text-muted data-[selected]:text-ink",
    band: "border-ink",
    focus: "focus-visible:outline-accent",
  },
} as const;

export interface WheelProps {
  items: readonly string[];
  value: string;
  onChange: (value: string, index: number) => void;
  /** Accessible name for the listbox. */
  label: string;
  orientation?: "vertical" | "horizontal";
  /** Row size along the scroll axis, px. Also the cross size. */
  itemSize?: number;
  /** Rows visible at once; keep it odd so the selection sits in the middle. */
  visibleCount?: number;
  loop?: boolean;
  /** Palette hook, so a drum can sit on paper or in a recess. */
  tone?: keyof typeof TONE;
  className?: string;
  renderItem?: (
    item: string,
    state: { selected: boolean; index: number },
  ) => React.ReactNode;
  onSettle?: (item: string, index: number) => void;
}

export default function Wheel({
  items,
  value,
  onChange,
  label,
  orientation = "horizontal",
  itemSize = 44,
  visibleCount = 5,
  loop = false,
  tone = "paper",
  className,
  renderItem,
  onSettle,
}: WheelProps) {
  const vertical = orientation === "vertical";
  const d = useDetent({
    items,
    value,
    onChange,
    onSettle,
    itemSize,
    visibleCount,
    loop,
    orientation,
    label,
  });

  const palette = TONE[tone];

  /* A fixed band of hairlines at the centre: the rows slide through it, so the
     marker never travels and never crosses the selected word. */
  const band: React.CSSProperties = vertical
    ? {
        height: itemSize,
        top: "50%",
        left: 0,
        right: 0,
        transform: "translateY(-50%)",
        borderStyle: "solid",
        borderLeftWidth: 1,
        borderRightWidth: 1,
      }
    : {
        width: itemSize,
        left: "50%",
        top: 0,
        bottom: 0,
        transform: "translateX(-50%)",
        borderStyle: "solid",
        borderTopWidth: 1,
        borderBottomWidth: 1,
      };

  return (
    <>
      <div
        {...d.getRootProps({
          style: vertical ? { width: "100%" } : { height: itemSize },
        })}
        className={cx(
          "relative overflow-hidden outline-none",
          "focus-visible:outline focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-4",
          palette.focus,
          className,
        )}
      >
        <div
          aria-hidden="true"
          className={cx("pointer-events-none absolute z-[1]", palette.band)}
          style={band}
        />
        <div {...d.getTrackProps()}>
          {d.rows.map((row) => (
            <div
              key={row.key}
              {...row.getProps()}
              className={cx(
                "wheel-row flex items-center justify-center whitespace-nowrap transition-colors duration-200",
                palette.row,
              )}
            >
              {renderItem
                ? renderItem(row.item, {
                    selected: row.selected,
                    index: row.index,
                  })
                : row.item}
            </div>
          ))}
        </div>
      </div>
      <div {...d.getLiveRegionProps()} />
    </>
  );
}