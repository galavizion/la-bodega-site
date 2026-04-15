// lib/nav.ts
export function resolveHref(item: any) {
  if (item.type === "external") return item.externalUrl || "#";
  if (item.type === "anchor") return `#${item.anchorId || ""}`;
  if (item.type === "internal") return item.internalPage?.slug ? `/${item.internalPage.slug}` : "/";
  return "#";
}