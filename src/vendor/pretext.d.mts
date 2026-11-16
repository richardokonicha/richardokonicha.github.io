export interface PreparedText {
  readonly text: string;
  readonly font: string;
  readonly segments: readonly string[];
}

export interface LaidOutLine {
  readonly text: string;
  readonly width: number;
  readonly startIndex: number;
  readonly endIndex: number;
}

export interface LineLayout {
  readonly lines: readonly LaidOutLine[];
  readonly lineCount: number;
  readonly height: number;
}

export interface LineRange {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

export function prepare(text: string, font: string): PreparedText;
export function prepareWithSegments(text: string, font: string): PreparedText;
export function layout(
  prepared: PreparedText,
  maxWidth: number,
): LineLayout;
export function layoutWithLines(
  prepared: PreparedText,
  maxWidth: number,
  lineHeight: number,
): LineLayout;
export function layoutNextLine(
  prepared: PreparedText,
  fromIndex: number,
  maxWidth: number,
): LineRange | null;
export function layoutNextLineRange(
  prepared: PreparedText,
  fromIndex: number,
  maxWidth: number,
): LineRange | null;
export function materializeLineRange(
  prepared: PreparedText,
  range: LineRange,
): string;
export function measureNaturalWidth(prepared: PreparedText): number;
export function measureLineStats(prepared: PreparedText): unknown;
export function walkLineRanges(
  prepared: PreparedText,
  maxWidth: number,
): Iterable<LineRange>;
export function clearCache(): void;
export function setLocale(locale: string): void;