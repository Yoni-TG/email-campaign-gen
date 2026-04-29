// URL-safe form of a skeleton id (which contains a `/` for the
// campaign-type folder). Used by the /campaigns/<id>/preview/<slug>
// route and any UI that links to it.
export function variantSlug(skeletonId: string): string {
  return skeletonId.replace(/\//g, "__");
}
