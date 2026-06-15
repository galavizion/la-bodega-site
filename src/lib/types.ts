// src/lib/types.ts
export type NavItem = {
  iconUrl?: string;
  label: string;
  type: "internal" | "external" | "pdf" | "anchor" | "shop" | "category";
  anchorId?: string;
  externalUrl?: string;
  pdfUrl?: string;
  internalPage?: { slug?: string; title?: string };
  productCategory?: { slug?: string; title?: string };
  children?: NavItem[];
};