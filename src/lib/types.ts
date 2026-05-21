// src/lib/types.ts
export type NavItem = {
  icon?: string;
  label: string;
  type: "internal" | "external" | "anchor" | "shop" | "category";
  anchorId?: string;
  externalUrl?: string;
  internalPage?: { slug?: string; title?: string };
  productCategory?: { slug?: string; title?: string };
  children?: NavItem[];
};