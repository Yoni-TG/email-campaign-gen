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
