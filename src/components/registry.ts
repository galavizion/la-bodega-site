import SectionHero from "./sections/SectionHero.astro";
import SectionBenefits from "./sections/SectionBenefits.astro";
import SectionProcess from "./sections/SectionProcess.astro";
import SectionFAQ from "./sections/SectionFAQ.astro";
import SectionCTA from "./sections/SectionCTA.astro";
import SectionContentSplit from "./sections/SectionContentSplit.astro";
import SectionRichText from "./sections/SectionRichText.astro";
import SectionCards from "./sections/SectionCards.astro";
import SectionForm from "./sections/SectionForm.astro";
import SectionSpace from "./sections/SectionSpace.astro";

export const sectionRegistry = {
  sectionHero: SectionHero,
  sectionBenefits: SectionBenefits,
  sectionProcess: SectionProcess,
  sectionFAQ: SectionFAQ,
  sectionCTA: SectionCTA,
  sectionContentSplit: SectionContentSplit,
  sectionRichText: SectionRichText,
  sectionCards: SectionCards,
  sectionForm: SectionForm,
  sectionSpace: SectionSpace,
} as const;

export type SectionType = keyof typeof sectionRegistry;