// Brand tokens shared across atomic blocks. Mirrors wireframe-guide §4–§5.
// Email clients don't reliably load custom fonts, so display/body stacks fall
// back to Georgia / Helvetica when Big Caslon / Lato aren't available.

export const COLORS = {
  babyBlue: "#BEDFF7",
  paleBlue: "#E6F0F8",
  midBlue: "#76A4C4",
  black: "#1E1E1E",
  white: "#FFFFFF",
  // Brand-aligned button accents — match the app's plum brand and the
  // emerald + sapphire button options shown in the design brief.
  plum: "#7E3A52",
  emerald: "#4A7C59",
} as const;

export const FONTS = {
  display: '"Big Caslon", "Big Caslon Medium", Georgia, "Times New Roman", serif',
  body: '"Lato", Helvetica, Arial, sans-serif',
} as const;

export const CONTAINER_WIDTH = 640;

// Background tokens that block components accept via a `background` prop.
// Limited to the brand palette so fine-tune overrides can't silently
// introduce off-palette colours.
export const BLOCK_BACKGROUNDS = [
  "white",
  "baby_blue",
  "pale_blue",
  "mid_blue",
] as const;

export type BlockBackground = (typeof BLOCK_BACKGROUNDS)[number];

export function bgColor(background: BlockBackground): string {
  switch (background) {
    case "white":
      return COLORS.white;
    case "baby_blue":
      return COLORS.babyBlue;
    case "pale_blue":
      return COLORS.paleBlue;
    case "mid_blue":
      return COLORS.midBlue;
  }
}

// Button colour tokens for the design step's properties panel — same
// "constrained palette" idea as backgrounds. The four options match the
// brief's swatch row (ink / accent / green / blue).
export const BUTTON_COLORS = ["ink", "accent", "green", "blue"] as const;
export type ButtonColor = (typeof BUTTON_COLORS)[number];

export function buttonColorHex(color: ButtonColor): string {
  switch (color) {
    case "ink":
      return COLORS.black;
    case "accent":
      return COLORS.plum;
    case "green":
      return COLORS.emerald;
    case "blue":
      return COLORS.midBlue;
  }
}

// Text alignment for blocks that surface it (text-only blocks, CTA
// rows). Three positions, mirrors the brief's L/C/R segmented control.
export const BLOCK_ALIGNMENTS = ["left", "center", "right"] as const;
export type BlockAlignment = (typeof BLOCK_ALIGNMENTS)[number];
