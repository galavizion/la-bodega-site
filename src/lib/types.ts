// src/lib/types.ts
export type NavItem = {
  label: string;
  type: "internal" | "external" | "anchor";
  anchorId?: string;
  externalUrl?: string;
  internalPage?: { slug?: string; title?: string };
  children?: NavItem[];
};