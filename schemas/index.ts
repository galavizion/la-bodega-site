// Documents
import { page } from "./documents/page";
import { siteSettings } from "./documents/siteSettings";
import { post } from "./documents/post";
import { author } from "./documents/author";
import { category } from "./documents/category";
import { catalogItem } from "./documents/catalogItem";
import { productCategory } from "./documents/productCategory";
import { order } from "./documents/order";

// Objects
import { seo } from "./objects/seo";
import { navItem } from "./objects/navItem";

// Sections
import { sectionHero } from "./sections/sectionHero";
import { sectionBenefits } from "./sections/sectionBenefits";
import { sectionProcess } from "./sections/sectionProcess";
import { sectionFAQ } from "./sections/sectionFAQ";
import { sectionCTA } from "./sections/sectionCTA";
import { sectionContentSplit } from "./sections/sectionContentSplit";
import { sectionRichText } from "./sections/sectionRichText";

export const schemaTypes = [
  // Documents
  page,
  siteSettings,
  post,
  author,
  category,
  catalogItem,
  productCategory,
  order,
  // Objects
  seo,
  navItem,
  // Sections
  sectionHero,
  sectionBenefits,
  sectionProcess,
  sectionFAQ,
  sectionCTA,
  sectionContentSplit,
  sectionRichText,
];
