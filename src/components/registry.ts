import SectionHero from "./sections/SectionHero.astro";
import SectionBenefits from "./sections/SectionBenefits.astro";
import SectionProcess from "./sections/SectionProcess.astro";
import SectionFAQ from "./sections/SectionFAQ.astro";
import SectionCTA from "./sections/SectionCTA.astro";
import SectionContentSplit from "./sections/SectionContentSplit.astro";

export const sectionRegistry = {
  sectionHero: SectionHero,
  sectionBenefits: SectionBenefits,
  sectionProcess: SectionProcess,
  sectionFAQ: SectionFAQ,
  sectionCTA: SectionCTA,
  sectionContentSplit: SectionContentSplit,
} as const;

export type SectionType = keyof typeof sectionRegistry;