// SMS budget math.
//
// Klaviyo's wire limit for an SMS payload is 130 characters (incl. spaces +
// emoji). Our LLM emits the literal token `{link}` where the CTA URL will
// be substituted at send time. A real Klaviyo short link is up to ~24
// chars, so the raw template length is *not* the same as the rendered
// length the recipient sees. Treat `{link}` as 24 chars when counting.

export const SMS_HARD_CAP = 130;
export const LINK_TOKEN = "{link}";
/** Reserved space for the substituted URL. Klaviyo short links are
 *  typically 22-24 chars; sized at the ceiling so we never overshoot. */
export const LINK_RESERVED_LEN = 24;

/** Per-token expansion delta — what each `{link}` adds to rendered length
 *  beyond its literal width. */
const LINK_EXPANSION = LINK_RESERVED_LEN - LINK_TOKEN.length;

/**
 * Rendered length of an SMS template — what the recipient ends up
 * receiving once `{link}` is substituted. Use this everywhere the wire
 * cap matters: UI counters, generator budget, server-side validation.
 */
export function smsRenderedLength(sms: string | null | undefined): number {
  if (!sms) return 0;
  const linkCount = sms.split(LINK_TOKEN).length - 1;
  return sms.length + linkCount * LINK_EXPANSION;
}

/** True when the rendered SMS exceeds the wire cap. */
export function smsExceedsCap(sms: string | null | undefined): boolean {
  return smsRenderedLength(sms) > SMS_HARD_CAP;
}
