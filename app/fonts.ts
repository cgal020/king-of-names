import { DM_Sans, DM_Serif_Display, Noto_Naskh_Arabic, Noto_Sans_Arabic, Noto_Sans_Thai, Noto_Serif_Thai } from "next/font/google";

// DM Sans for the interface, DM Serif Display for headings and people's names
// (both SIL Open Font License, self-hosted by next/font). Names often mix in
// Arabic and Thai, which have no italics: the Noto faces cover them upright
// and only download when those scripts appear on the page.
const dmSans = DM_Sans({ subsets: ["latin", "latin-ext"], axes: ["opsz"], variable: "--font-dm-sans" });
const dmSerif = DM_Serif_Display({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
});
const naskhArabic = Noto_Naskh_Arabic({ subsets: ["arabic"], preload: false, variable: "--font-naskh-arabic" });
const sansArabic = Noto_Sans_Arabic({ subsets: ["arabic"], preload: false, variable: "--font-sans-arabic" });
const sansThai = Noto_Sans_Thai({ subsets: ["thai"], preload: false, variable: "--font-sans-thai" });
const serifThai = Noto_Serif_Thai({ subsets: ["thai"], preload: false, variable: "--font-serif-thai" });

export const fontVariables = [dmSans, dmSerif, naskhArabic, sansArabic, sansThai, serifThai].map((font) => font.variable).join(" ");
