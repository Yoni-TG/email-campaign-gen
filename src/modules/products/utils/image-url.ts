const PRODUCT_URL_PATTERN = /(?:^|\/\/)(?:www\.)?theograce\.com\/products\/([^/?#]+)/;
const CDN_BASE = "https://cdn.theograce.com/digital-asset/product";

export function extractSlugFromLink(link: string): string | null {
  if (!link) return null;
  const match = link.match(PRODUCT_URL_PATTERN);
  return match ? match[1] : null;
}

export function getProductImageUrl(
  productLink: string,
  imageNumber: number = 1,
): string | null {
  const slug = extractSlugFromLink(productLink);
  if (!slug) return null;
  return `${CDN_BASE}/${slug}-${imageNumber}.jpg?w=750`;
}
