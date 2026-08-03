// Documents
import { page } from "./documents/page";
import { siteSettings } from "./documents/siteSettings"; // legacy — mantener para no perder datos
import { siteSettingsGeneral } from "./documents/siteSettingsGeneral";
import { siteSettingsMenu } from "./documents/siteSettingsMenu";
import { siteSettingsHeader } from "./documents/siteSettingsHeader";
import { siteSettingsFooter } from "./documents/siteSettingsFooter";
import { siteSettingsSeo } from "./documents/siteSettingsSeo";
import { siteSettingsCodes } from "./documents/siteSettingsCodes";
import { siteSettingsShop } from "./documents/siteSettingsShop";
import { siteSettingsPayment } from "./documents/siteSettingsPayment";
import { sharedSection } from "./documents/sharedSection";
import { post } from "./documents/post";
import { author } from "./documents/author";
import { category } from "./documents/category";
import { catalogItem } from "./documents/catalogItem";
import { productCategory } from "./documents/productCategory";
import { order } from "./documents/order";
import { formSubmission } from "./documents/formSubmission";
import { authCode } from "./documents/authCode";
import { customerProfile } from "./documents/customerProfile";
import { chatbotProfile } from "./documents/chatbotProfile";
import { branch } from "./documents/branch";
import { cashbackSettings } from "./documents/cashbackSettings";
import { walletTransaction } from "./documents/walletTransaction";
import { coupon } from "./documents/coupon";

// Objects
import { seo } from "./objects/seo";
import { navItem } from "./objects/navItem";
import { sectionSharedRef } from "./objects/sectionSharedRef";

// Sections
import { sectionHero } from "./sections/sectionHero";
import { sectionBenefits } from "./sections/sectionBenefits";
import { sectionProcess } from "./sections/sectionProcess";
import { sectionFAQ } from "./sections/sectionFAQ";
import { sectionCTA } from "./sections/sectionCTA";
import { sectionContentSplit } from "./sections/sectionContentSplit";
import { sectionRichText } from "./sections/sectionRichText";
import { sectionCards } from "./sections/sectionCards";
import { sectionForm } from "./sections/sectionForm";
import { sectionSpace } from "./sections/sectionSpace";
import { sectionProductsCarousel } from "./sections/sectionProductsCarousel";

export const schemaTypes = [
  // Documents
  page,
  siteSettings,
  siteSettingsGeneral,
  siteSettingsMenu,
  siteSettingsHeader,
  siteSettingsFooter,
  siteSettingsSeo,
  siteSettingsCodes,
  siteSettingsShop,
  siteSettingsPayment,
  sharedSection,
  post,
  author,
  category,
  catalogItem,
  productCategory,
  order,
  formSubmission,
  authCode,
  customerProfile,
  chatbotProfile,
  branch,
  cashbackSettings,
  walletTransaction,
  coupon,
  // Objects
  seo,
  navItem,
  sectionSharedRef,
  // Sections
  sectionHero,
  sectionBenefits,
  sectionProcess,
  sectionFAQ,
  sectionCTA,
  sectionContentSplit,
  sectionRichText,
  sectionCards,
  sectionForm,
  sectionSpace,
  sectionProductsCarousel,
];
