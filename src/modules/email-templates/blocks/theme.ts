// Brand tokens shared across atomic blocks. Mirrors wireframe-guide §4–§5.
// Email clients don't reliably load custom fonts, so display/body stacks fall
// back to Georgia / Helvetica when Big Caslon / Lato aren't available.

export const COLORS = {
  babyBlue: "#BEDFF7",
  paleBlue: "#E6F0F8",
  midBlue: "#76A4C4",
  black: "#1E1E1E",
  white: "#FFFFFF",
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
