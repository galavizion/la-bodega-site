import { defineField, defineType } from "sanity";

export const siteSettingsCodes = defineType({
  name: "siteSettingsCodes",
  title: "Códigos de seguimiento",
  type: "document",
  fields: [
    defineField({ name: "analyticsId",              title: "Google Analytics ID (G-XXXXXXX)",        type: "string" }),
    defineField({ name: "tagManagerId",             title: "Google Tag Manager ID (GTM-XXXXX)",       type: "string" }),
    defineField({ name: "adsenseClient",            title: "AdSense Client ID (ca-pub-XXXXXXXXX)",    type: "string" }),
    defineField({ name: "searchConsoleVerification",title: "Search Console Verification (content=…)", type: "string" }),
  ],
  preview: { prepare: () => ({ title: "Códigos de seguimiento" }) },
});
