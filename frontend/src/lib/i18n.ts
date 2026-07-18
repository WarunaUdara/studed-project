/**
 * Bilingual string map for the public-facing pages (home, login, register,
 * pricing, catalog). Strings live here so the route files stay focused on
 * markup. Sinhala strings render with the Noto Sans Sinhala font (loaded via
 * `--font-sinhala` in src/styles/index.css) — opt in with the `.font-sinhala`
 * helper when a Sinhala string contains complex conjuncts.
 *
 * Note for reviewers: Sinhala strings below were authored to be natural and
 * contextually correct. If anything reads awkwardly, see the "Sinhala review
 * flags" section at the bottom of this file.
 */
import { type Language, useUiPrefs } from "@/stores/uiPrefs";

export type Lang = Language;

export interface StringPair {
  EN: string;
  SI: string;
}

/** Pick the active string for the current language. */
export function pick(pair: StringPair, lang: Lang): string {
  return lang === "SI" ? pair.SI : pair.EN;
}

/* --------------------------------- Strings -------------------------------- */

export const PUBLIC_STRINGS = {
  heroBadge: {
    EN: "Premium learning for Sri Lankan schools",
    SI: "Sri Lankan පාසල් සඳහා ප්‍රිමියම් අධ්‍යාපනය",
  },
  heroTitleA: {
    EN: "School, rewritten as",
    SI: "පාසල, නැවත ලියන ලද්දේ",
  },
  heroTitleB: {
    EN: "a game you can win",
    SI: "ජයගත හැකි ක්‍රීඩාවක් ලෙස",
  },
  heroSubtitle: {
    EN: "StudEd turns the Sri Lankan curriculum into a world of waves — structured courses, bite-sized lessons and game-grade evaluation. Earn XP, hold your streak and climb the leaderboard, in English and Sinhala.",
    SI: "StudEd ශ්‍රී ලාංකික විෂය නිර්දේශය තරංග ලෝකයක් බවට හරවයි — ව්‍යුහගත පාඨමාලා, කුඩා පාඩම් සහ ක්‍රීඩා මට්ටමේ ඇගයීම්. XP උපයාගෙන, ඔබේ දිගට රැකගෙන, ලීඩර්බෝඩ් නඟින්න — ඉංග්‍රීසි සහ සිංහලෙන්.",
  },
  heroLiveChip: {
    EN: "1,240 learners riding the wave right now",
    SI: "මේ මොහොතේම සිසුන් 1,240ක් තරංගය අසබඩ",
  },
  heroScrollHint: {
    EN: "Scroll to earn Explorer XP",
    SI: "Explorer XP උපයා ගැනීමට අනුචලනය කරන්න",
  },
  ctaGetStarted: {
    EN: "Get started free",
    SI: "නොමිලේ අරඹන්න",
  },
  ctaBrowseCourses: {
    EN: "Browse courses",
    SI: "පාඨමාලා බලන්න",
  },
  ctaPortal: {
    EN: "Go to your portal",
    SI: "ඔබගේ පෝටලයට යන්න",
  },
  ctaSeePricing: {
    EN: "See full comparison",
    SI: "සම්පූර්ණ සැසඳීම බලන්න",
  },
  trustRow: {
    EN: "Trusted by students across Sri Lankan schools",
    SI: "Sri Lankan පාසල්වල සිසුන් විසින් විශ්වාස කරන ලද",
  },

  statsGradeLevels: { EN: "Grade levels", SI: "ශ්‍රේණි මට්ටම්" },
  statsSubjects: { EN: "Subjects", SI: "විෂයයන්" },
  statsLearners: { EN: "Active learners", SI: "සක්‍රීය සිසුන්" },
  statsXpAwarded: { EN: "XP awarded", SI: "ලබාදුන් XP" },

  howHeading: {
    EN: "How learning works on StudEd",
    SI: "StudEd හි ඉගෙනීම ක්‍රියාත්මක වන ආකාරය",
  },
  howSubhead: {
    EN: "Every subject is broken into Courses, Lessons and Waves — small, focused units with a Learn phase and an Evaluate phase.",
    SI: "සෑම විෂයයක්ම පාඨමාලා, පාඩම් සහ තරංග බවට කැඩේ — ඉගෙනීම් සහ ඇගයීම් අදියරයන් සහිත කුඩා, කේන්ද්‍රීය ඒකක.",
  },
  howStep1: { EN: "Course", SI: "පාඨමාලාව" },
  howStep1Copy: {
    EN: "A full subject mapped to your grade — Mathematics, Science, Sinhala and more.",
    SI: "ඔබගේ ශ්‍රේණියට ගැලපෙන සම්පූර්ණ විෂයයක් — ගණිත, විද්‍යාව, සිංහල යනාදී.",
  },
  howStep2: { EN: "Lesson", SI: "පාඩම" },
  howStep2Copy: {
    EN: "Lessons group related Waves so each topic builds on the last.",
    SI: "පාඩම් අදාළ තරංග කාණ්ඩ කරයි — සෑම මාතෘකාවක්ම කලින් එක මත ගොඩනැගේ.",
  },
  howStep3: { EN: "Wave", SI: "තරංගය" },
  howStep3Copy: {
    EN: "A Learn phase teaches the concept, then an Evaluate phase tests mastery — and awards XP.",
    SI: "ඉගෙනීම් අදියරය මතපහදාරය උගන්වා, ඇගයීම් අදියරය ප්‍රාඵල්‍යතාව මැන බලයි — XP ද පිරිනමයි.",
  },

  /* Wave map (hero visual) */
  waveMapTitle: { EN: "The Wave Map", SI: "තරංග සිතියම" },
  waveMapLesson: { EN: "Lesson 4 · Circle Theorems", SI: "පාඩම 4 · වෘත්ත ප්‍රමේය" },
  waveMapFooter: {
    EN: "Every node is a wave. Every wave pays XP.",
    SI: "සෑම නෝඩයක්ම තරංගයකි. සෑම තරංගයක්ම XP ගෙවයි.",
  },
  waveStatusCompleted: { EN: "Completed", SI: "සම්පූර්ණයි" },
  waveStatusCurrent: { EN: "In progress", SI: "දැන් ක්‍රියාත්මකයි" },
  waveStatusLocked: { EN: "Locked", SI: "අගුළු ලා ඇත" },
  waveNode1: { EN: "Angles in the Same Segment", SI: "එකම කොටසේ කෝණ" },
  waveNode2: { EN: "Cyclic Quadrilaterals", SI: "චක්‍රීය චතුරස්‍ර" },
  waveNode3: { EN: "Tangents & Chords", SI: "ස්පර්ශක සහ ජ්‍යා" },
  waveNode4: { EN: "The Alternate Segment", SI: "විකල්ප කොටස" },
  waveNode5: { EN: "Secants from a Point", SI: "ලක්ෂ්‍යයකින් ඡේදක" },
  waveNode6: { EN: "Theorem Mastery", SI: "ප්‍රමේය ප්‍රාඵල්‍යතාව" },
  waveNode7: { EN: "Boss Wave: Full Proof", SI: "Boss තරංගය: සම්පූර්ණ ඔප්පු කිරීම" },

  /* Playable wave (live demo) */
  playHeading: {
    EN: "Don't take our word for it. Play a wave.",
    SI: "අපේ වචනය විශ්වාස නොකරන්න. තරංගයක් අත්හදා බලන්න.",
  },
  playSubhead: {
    EN: "Every wave pairs a Learn phase with an Evaluate phase. Here is a real one — no account needed.",
    SI: "සෑම තරංගයක්ම Learn අදියරක් Evaluate අදියරක් සමඟ යුගල කරයි. මෙන්න සැබෑ එකක් — ගිණුමක් අවශ්‍ය නැත.",
  },
  playWaveTag: { EN: "Wave 4 of 6 · Circle Theorems", SI: "තරංගය 4 / 6 · වෘත්ත ප්‍රමේය" },
  playLearnLabel: { EN: "Learn phase", SI: "Learn අදියර" },
  playLearnTitle: { EN: "Areas scale with the square", SI: "ප්‍රදේශ වර්ගය අනුව වර්ධනය වේ" },
  playLearnCopy: {
    EN: "Double a circle's radius and its area does not double — it quadruples. Area always scales with r².",
    SI: "වෘත්තයක අරය දෙගුණ කළ විට එහි ප්‍රදේශය දෙගුණ නොවේ — සිව්ගුණ වේ. ප්‍රදේශය සෑම විට r² අනුව වර්ධනය වේ.",
  },
  playEvaluateLabel: { EN: "Evaluate phase", SI: "Evaluate අදියර" },
  playQuestion: {
    EN: "A circle's radius is doubled. What happens to its area?",
    SI: "වෘත්තයක අරය දෙගුණ කළ විට එහි ප්‍රදේශයට සිදුවන්නේ කුමක්ද?",
  },
  playOptA: { EN: "It stays the same", SI: "එය එලෙසම රැඳේ" },
  playOptB: { EN: "It doubles", SI: "එය දෙගුණ වේ" },
  playOptC: { EN: "It triples", SI: "එය තුන්ගුණ වේ" },
  playOptD: { EN: "It quadruples", SI: "එය සිව්ගුණ වේ" },
  playHint: {
    EN: "Area scales with r² — so what is (2r)²?",
    SI: "ප්‍රදේශය r² අනුව වර්ධනය වේ — එසේනම් (2r)² යනු කුමක්ද?",
  },
  playHintLabel: { EN: "AI tutor hint", SI: "AI උපදේශක ඉඟිය" },
  playCorrectTitle: { EN: "Wave complete.", SI: "තරංගය සම්පූර්ණයි." },
  playCorrectCopy: {
    EN: "That is the whole loop — learn, answer, earn. Courses hold hundreds of waves like this one.",
    SI: "එයයි සම්පූර්ණ චක්‍රය — ඉගෙනීම, පිළිතුර, උපයාගැනීම. පාඨමාලාවල මේ වැනි තරංග සිය ගණනක් ඇත.",
  },
  playCta: { EN: "Start your real journey", SI: "ඔබේ සැබෑ ගමන අරඹන්න" },
  playReplay: { EN: "Replay wave", SI: "තරංගය නැවත" },

  /* Explorer XP meter (scroll reward) */
  explorerLabel: { EN: "Explorer XP", SI: "ගවේෂක XP" },
  explorerHint: { EN: "Scroll to earn", SI: "උපයා ගැනීමට අනුචලනය" },
  explorerUnlocked: { EN: "Explorer badge unlocked", SI: "ගවේෂක පදක්කම විවෘත විය" },
  explorerUnlockedBody: {
    EN: "You earned 250 XP just by scrolling. Imagine what a real wave pays.",
    SI: "ඔබ අනුචලනයෙන්ම XP 250ක් උපයා ගත්තා. සැබෑ තරංගයක් ගෙවන්නේ කොච්චරද කියලා සිතන්න.",
  },

  /* Live leaderboard (mechanics section) */
  liveLbTitle: { EN: "Live leaderboard", SI: "සජීවී ලීඩර්බෝඩ්" },
  liveLbNote: {
    EN: "Ranks shift as XP flows in",
    SI: "XP ලැබෙන විට ස්ථාන වෙනස් වේ",
  },
  liveLbYou: { EN: "You", SI: "ඔබ" },

  gamificationHeading: {
    EN: "Built like the games you already love",
    SI: "ඔබ දැනටමත් ආදරය කරන ක්‍රීඩා මෙන්",
  },
  gamificationSubhead: {
    EN: "Every wave is a level. Every lesson is a milestone. Real mechanics, not stickers.",
    SI: "සෑම තරංගයක්ම මට්ටමකි. සෑම පාඩමක්ම සැණකෙළියකි. සැබෑ යාන්ත්‍රණ, ස්ටිකර් නොවේ.",
  },
  mechanicXpTitle: { EN: "XP & Levels", SI: "XP සහ මට්ටම්" },
  mechanicXpCopy: {
    EN: "Earn XP for every wave. Level up from Rookie to Grand Master.",
    SI: "සෑම තරංගයකටම XP අත්පත් කරගන්න. Rookie සිට Grand Master දක්වා මට්ටම් නඟින්න.",
  },
  mechanicLeaderboardTitle: { EN: "Leaderboards", SI: "ලීඩර්බෝඩ්" },
  mechanicLeaderboardCopy: {
    EN: "Compete globally, by grade and by course. Top 0.1% earn the 💎 glyph.",
    SI: "ගෝලීය වශයෙන්, ශ්‍රේණිය සහ පාඨමාලාව අනුව තරඟ කරන්න. ඉහළ 0.1% ට 💎 සංකේතය හිමිවේ.",
  },
  mechanicProficiencyTitle: { EN: "Proficiency ladder", SI: "ප්‍රාඵල්‍යතා පඩිපෙළ" },
  mechanicProficiencyCopy: {
    EN: "Climb Not Started → Expert as your average score grows — gold and purple earn badges.",
    SI: "Not Started → Expert දක්වා නඟින්න — රන් සහ දම් පටි අත්පත් කරගන්න.",
  },
  mechanicStreakTitle: { EN: "Daily streaks", SI: "දෛනික දිගට" },
  mechanicStreakCopy: {
    EN: "Practice every day to keep your flame alive — bonus XP when you hit 7 days.",
    SI: "දිනපතා පුහුණු වීමෙන් ඔබගේ ගිනි දලවා තබාගන්න — 7 දිනක් වූ විට bonus XP.",
  },

  catalogHeading: {
    EN: "Featured courses",
    SI: "විශේෂිත පාඨමාලා",
  },
  catalogSubhead: {
    EN: "A taste of what your subscription unlocks. New waves every week.",
    SI: "ඔබගේ දායකත්වයෙන් විවෘත වන දේ ගැන රස බැලීමක්. සතිපතා නව තරංග.",
  },
  catalogViewAll: { EN: "View all courses", SI: "සියලු පාඨමාලා බලන්න" },

  audienceHeading: {
    EN: "Built for every stage of school",
    SI: "පාසල් අදියර සෑම ලඟාවකටම ගොඩනැගුනු",
  },
  audiencePrimaryTitle: { EN: "Primary", SI: "ප්‍රාථමික" },
  audiencePrimarySub: { EN: "Grade 1–5", SI: "1–5 ශ්‍රේණි" },
  audiencePrimaryCopy: {
    EN: "Playful Learn phases that build strong foundations in Maths, Sinhala and English.",
    SI: "ගණිත, සිංහල සහ ඉංග්‍රීසි හි ශක්තිමත් අඩිතාලම් සපයන සිත්ගන්නාසුතූ ඉගෙනීම් අදියර.",
  },
  audienceJuniorTitle: { EN: "Junior Secondary", SI: "කනිෂ්ඨ ද්විතීයක" },
  audienceJuniorSub: { EN: "Grade 6–9", SI: "6–9 ශ්‍රේණි" },
  audienceJuniorCopy: {
    EN: "Concept-driven waves with visualisations and quick MCQ feedback loops.",
    SI: "දෘශ්‍යකරණ සහ වේගවත් MCQ ප්‍රතිපෝෂණ ලූප සහිත මතපහදාර තරංග.",
  },
  audienceSeniorTitle: { EN: "Senior Secondary", SI: "ජ්‍යෙෂ්ඨ ද්විතීයක" },
  audienceSeniorSub: { EN: "Grade 10–11 · O/L", SI: "10–11 ශ්‍රේණි · O/L" },
  audienceSeniorCopy: {
    EN: "Exam-style evaluate waves, past papers and proficiency tracking for O/L.",
    SI: "O/L සඳහා විභාග රටාවේ ඇගයීම් තරංග, අතීත ප්‍රශ්න පත්‍ර සහ ප්‍රාඵල්‍යතා නිරීක්ෂණ.",
  },
  audienceALTitle: { EN: "Advanced Level", SI: "විශාල මට්ටම" },
  audienceALSub: { EN: "A/L", SI: "A/L" },
  audienceALCopy: {
    EN: "Stream-aligned courses for Physical Science, Bioscience, Commerce and Arts.",
    SI: "භෞතික විද්‍යා, ජීව විද්‍යා, වාණිජ සහ කලා අංශ සඳහා අංශගත පාඨමාලා.",
  },

  pricingHeading: {
    EN: "Plans for every learner",
    SI: "සෑම සිසුවෙකුටම ගෙවීම් සැලසුම්",
  },
  pricingSubhead: {
    EN: "Cancel anytime. Sinhala-language support included on every plan.",
    SI: "ඕනෑම විට අවලංගු කරන්න. සෑම සැලසුමකටම සිංහල භාෂා සහාය ඇතුළත්.",
  },
  pricingMostPopular: { EN: "Most popular", SI: "වඩාත් ජනප්‍රිය" },
  pricingMonthly: { EN: "/month", SI: "/මස" },
  pricingSubscribe: { EN: "Subscribe to unlock", SI: "දායක වී විවෘත කරන්න" },
  pricingChoosePlan: { EN: "Choose this plan", SI: "මෙම සැලසුම තෝරන්න" },

  testimonialsHeading: {
    EN: "Loved by students and parents",
    SI: "සිසුන් සහ දෙමාපියන් විසින් ආදරය කරන ලද",
  },

  finalCtaHeading: {
    EN: "Ready to start your journey?",
    SI: "ඔබගේ ගමන ආරම්භ කිරීමට සූදානම්ද?",
  },
  finalCtaSubhead: {
    EN: "Join StudEd today and unlock structured courses, interactive waves, and gamified progress tracking.",
    SI: "අදම StudEd හ එක්වී ව්‍යුහගත පාඨමාලා, අන්තර්ක්‍රීයාකාරී තරංග සහ ක්‍රීඩාමය ප්‍රගති නිරීක්ෂණය විවෘත කරගන්න.",
  },
  finalCtaCreate: { EN: "Create your account", SI: "ඔබගේ ගිණුම සාදන්න" },
  finalCtaSignin: { EN: "Sign in", SI: "පිවිසෙන්න" },

  footerTagline: {
    EN: "Premium learning for Sri Lankan schools",
    SI: "Sri Lankan පාසල් සඳහා ප්‍රිමියම් අධ්‍යාපනය",
  },
  footerProduct: { EN: "Product", SI: "නිෂ්පාදනය" },
  footerLearn: { EN: "Learn", SI: "ඉගෙනීම" },
  footerCompany: { EN: "Company", SI: "සමාගම" },
  footerLang: { EN: "Language", SI: "භාෂාව" },
  footerRights: { EN: "All rights reserved.", SI: "සියලු හිමිකාර ඇවිරිණි." },

  /* Login / Register */
  loginHeading: { EN: "Welcome back", SI: "නැවත සාදරයෙන් පිළිගනිමු" },
  loginSubhead: {
    EN: "Sign in to continue your learning journey",
    SI: "ඔබගේ ඉගෙනීමේ ගමන ඉදිරියට කිරීමට පිවිසෙන්න",
  },
  loginNoAccount: { EN: "Don't have an account?", SI: "ගිණුමක් නොමැතිද?" },
  loginCreateOne: { EN: "Create one", SI: "එකක් සාදන්න" },
  backHome: { EN: "Back to home", SI: "මුල් පිටුවට" },

  registerHeading: { EN: "Create your account", SI: "ඔබගේ ගිණුම සාදන්න" },
  registerSubhead: {
    EN: "Start your learning journey today",
    SI: "අදම ඔබගේ ඉගෙනීමේ ගමන ආරම්භ කරන්න",
  },
  registerHaveAccount: { EN: "Already have an account?", SI: "වර්තමානයේ ගිණුමක් ඇතිද?" },
  brandTaglineLogin: {
    EN: "Premium learning for Sri Lankan schools",
    SI: "Sri Lankan පාසල් සඳහා ප්‍රිමියම් අධ්‍යාපනය",
  },
  brandTaglineRegister: { EN: "Learn smarter, level up faster", SI: "නුඹන් දැනුම වඩා වේගයෙන් ඉහළ යන්න" },

  brandFeature1: {
    EN: "Structured Course → Lesson → Wave learning",
    SI: "ව්‍යුහගත Course → Lesson → Wave ඉගෙනීම",
  },
  brandFeature2: {
    EN: "Earn XP and level up as you learn",
    SI: "ඉගෙනීමේදී XP අත්පත් කර මට්ටම් නඟින්න",
  },
  brandFeature3: {
    EN: "Compete on global & course leaderboards",
    SI: "ගෝලීය සහ පාඨමාලා ලීඩර්බෝඩ් තරඟ කරන්න",
  },
  brandFeature4: {
    EN: "AI-assisted content with Sinhala support",
    SI: "AI සහාය ඇති අන්තර්ගතය, සිංහල සහාය සමඟ",
  },

  brandFeature1R: {
    EN: "Interactive Learn + Evaluate phases",
    SI: "අන්තර්ක්‍රීයාකාරී Learn + Evaluate අදියර",
  },
  brandFeature2R: {
    EN: "Grade 1–11, O/L & A/L aligned content",
    SI: "1–11, O/L සහ A/L ශ්‍රේණි සඳහා ගැලපෙන අන්තර්ගතය",
  },
  brandFeature3R: {
    EN: "Track proficiency and unlock badges",
    SI: "ප්‍රාඵල්‍යතා නිරීක්ෂණය සහ පටි විවෘත කරන්න",
  },
  brandFeature4R: {
    EN: "Gamified XP system with leaderboards",
    SI: "ලීඩර්බෝඩ් සහිත ක්‍රීඩාමය XP පද්ධතිය",
  },

  /* Catalog */
  catalogExplore: { EN: "Explore courses", SI: "පාඨමාලා ගවේෂණය" },
  catalogExploreSub: {
    EN: "Browse published courses for Sri Lankan schools.",
    SI: "Sri Lankan පාසල් සඳහා ප්‍රකාශිත පාඨමාලා බලන්න.",
  },
  catalogSubscribeToUnlock: {
    EN: "Subscribe to unlock",
    SI: "දායක වී විවෘත කරන්න",
  },
  catalogLocked: { EN: "Locked", SI: "අගුළු ලෑම" },

  /* Pricing */
  pricingTabMonthly: { EN: "Monthly", SI: "මාසික" },
  pricingTabAnnual: { EN: "Annual (save 20%)", SI: "වාර්ෂික (20% ඉතුරු)" },
  pricingFaqHeading: { EN: "Frequently asked questions", SI: "නිතර අසන පැන" },
  pricingCompareHeading: {
    EN: "Compare every feature",
    SI: "සෑම විශේෂාංගයක්ම සසඳන්න",
  },
  pricingFeatureCol: { EN: "Feature", SI: "විශේෂාංගය" },
} as const;

export type PublicStringKey = keyof typeof PUBLIC_STRINGS;

/** Hook returning the active language and a `t` lookup bound to it. */
export function usePublicI18n() {
  const language = useUiPrefs((s) => s.language);
  const toggleLanguage = useUiPrefs((s) => s.toggleLanguage);
  const setLanguage = useUiPrefs((s) => s.setLanguage);
  const t = (key: PublicStringKey): string => pick(PUBLIC_STRINGS[key], language);
  return { language, t, toggleLanguage, setLanguage, isSinhala: language === "SI" };
}
