import SectionHero from "./SectionHero.astro";
import SectionBenefits from "./SectionBenefits.astro";
import SectionProcess from "./SectionProcess.astro";
import SectionFAQ from "./SectionFAQ.astro";
import SectionCTA from "./SectionCTA.astro";
import SectionRichText from "./SectionRichText.astro";
import SectionContentSplit from "./SectionContentSplit.astro";
import SectionCards from "./SectionCards.astro";
import SectionForm from "./SectionForm.astro";

export const sectionRegistry = {
  sectionHero: SectionHero,
  sectionBenefits: SectionBenefits,
  sectionProcess: SectionProcess,
  sectionFAQ: SectionFAQ,
  sectionCTA: SectionCTA,
  sectionRichText: SectionRichText,
  sectionContentSplit: SectionContentSplit,
  sectionCards: SectionCards,
  sectionForm: SectionForm,
} as const;

export type SectionType = keyof typeof sectionRegistry;