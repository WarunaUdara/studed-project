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
    EN: "Interactive Learning Platform",
    SI: "අන්තර්ක්‍රියාකාරී අධ්‍යාපනික වේදිකාව",
  },
  heroTitleA: {
    EN: "School rewritten as",
    SI: "පාසල් අධ්‍යාපනය, ජයගත හැකි",
  },
  heroTitleB: {
    EN: "a game you can win",
    SI: "Game එකක් ලෙසින්",
  },
  heroSubtitle: {
    EN: "Visual, hands-on learning for Sri Lankan students. Build true intuition through interactive simulations, step-by-step guidance, and gamified progress.",
    SI: "ලංකාවේ සිසුන් සඳහාම නිර්මාණය කළ අන්තර්ක්‍රියාකාරී අධ්‍යාපනික වේදිකාව. ප්‍රායෝගික අභ්‍යාස, පියවරෙන් පියවර මඟපෙන්වීම සහ විනෝදජනක අභියෝග හරහා සැබෑ දැනුම ගොඩනගන්න.",
  },
  heroLiveChip: {
    EN: "Interactive waves live",
    SI: "අන්තර්ක්‍රියාකාරී Waves සජීවීව",
  },
  heroScrollHint: {
    EN: "Scroll to explore courses",
    SI: "Courses නැරඹීමට Scroll කරන්න",
  },
  ctaLearner: {
    EN: "I'm a learner",
    SI: "මම ශිෂ්‍යයෙක්",
  },
  ctaParentTeacher: {
    EN: "I'm a parent or teacher",
    SI: "මම දෙමව්පියෙක් / ගුරුවරයෙක්",
  },
  ctaGetStarted: {
    EN: "Get started free",
    SI: "නොමිලේ ආරම්භ කරන්න",
  },
  ctaBrowseCourses: {
    EN: "Browse courses",
    SI: "Courses නරඹන්න",
  },
  ctaPortal: {
    EN: "Go to your dashboard",
    SI: "ඔබගේ Dashboard එකට යන්න",
  },
  ctaSeePricing: {
    EN: "See full comparison",
    SI: "සම්පූර්ණ විස්තරය බලන්න",
  },
  trustRow: {
    EN: "Sri Lankan National Curriculum & Cambridge Aligned",
    SI: "ලංකාවේ ජාතික විෂය නිර්දේශයට සහ Cambridge වලට අනුකූලයි",
  },

  statsGradeLevels: { EN: "Grade levels", SI: "ශ්‍රේණි (Grades)" },
  statsSubjects: { EN: "Subjects", SI: "විෂයයන් (Subjects)" },
  statsLearners: { EN: "Active learners", SI: "සක්‍රීය සිසුන්" },
  statsXpAwarded: { EN: "XP awarded", SI: "පිරිනැමූ XP" },

  howHeading: {
    EN: "How learning works on StudEd",
    SI: "StudEd මඟින් ඉගෙනුම සිදුවන ආකාරය",
  },
  howSubhead: {
    EN: "Every subject is broken into Courses, Lessons and Waves: small, focused units with a Learn phase and an Evaluate phase.",
    SI: "සෑම විෂයයක්ම Courses, Lessons සහ Waves ලෙස බෙදා ඇත: Learn සහ Evaluate අදියර සහිත කෙටි පාඩම් ඒකක.",
  },
  howStep1: { EN: "Course", SI: "Course එක" },
  howStep1Copy: {
    EN: "A full subject mapped to your grade: Mathematics, Science, Sinhala and more.",
    SI: "ඔබේ ශ්‍රේණියට අදාළ සම්පූර්ණ විෂයය: ගණිතය, විද්‍යාව, ඉංග්‍රීසි සහ තවත් බොහෝ දේ.",
  },
  howStep2: { EN: "Lesson", SI: "Lesson එක" },
  howStep2Copy: {
    EN: "Lessons group related Waves so each topic builds on the last.",
    SI: "සෑම Lesson එකක්ම අදාළ Waves එකතු කරමින් දැනුම පියවරෙන් පියවර ගොඩනංවයි.",
  },
  howStep3: { EN: "Wave", SI: "Wave එක" },
  howStep3Copy: {
    EN: "A Learn phase teaches the concept, then an Evaluate phase tests mastery, and awards XP.",
    SI: "Learn phase එකෙන් සංකල්ප ඉගෙන ගෙන, Evaluate phase එකෙන් දැනුම මැන බලා XP උපයාගන්න.",
  },

  /* Wave map (hero visual) */
  waveMapTitle: { EN: "The Wave Map", SI: "Wave Map එක" },
  waveMapLesson: { EN: "Lesson 4 · Circle Theorems", SI: "Lesson 4 · වෘත්ත ප්‍රමේයයන්" },
  waveMapFooter: {
    EN: "Every node is a wave. Every wave pays XP.",
    SI: "සෑම Node එකක්ම Wave එකකි. සෑම Wave එකකින්ම XP හිමිවේ.",
  },
  waveStatusCompleted: { EN: "Completed", SI: "සම්පූර්ණයි" },
  waveStatusCurrent: { EN: "In progress", SI: "ක්‍රියාත්මකයි" },
  waveStatusLocked: { EN: "Locked", SI: "අගුළු ලා ඇත" },
  waveNode1: { EN: "Angles in the Same Segment", SI: "එකම ඛණ්ඩයේ කෝණ" },
  waveNode2: { EN: "Cyclic Quadrilaterals", SI: "චක්‍රීය චතුරස්‍ර" },
  waveNode3: { EN: "Tangents & Chords", SI: "ස්පර්ශක සහ ජ්‍යා" },
  waveNode4: { EN: "The Alternate Segment", SI: "විකල්ප ඛණ්ඩ ප්‍රමේයය" },
  waveNode5: { EN: "Secants from a Point", SI: "ඡේදක ප්‍රමේයයන්" },
  waveNode6: { EN: "Theorem Mastery", SI: "ප්‍රමේයයන් ප්‍රගුණ කිරීම" },
  waveNode7: { EN: "Boss Wave: Full Proof", SI: "Boss Wave: සම්පූර්ණ සාධනය" },

  /* Playable wave (live demo) */
  playHeading: {
    EN: "Don't take our word for it. Play a wave.",
    SI: "දැන්ම Wave එකක් අත්හදා බලන්න.",
  },
  playSubhead: {
    EN: "Every wave pairs a Learn phase with an Evaluate phase. Here is a real one, no account needed.",
    SI: "සෑම Wave එකකම Learn phase එකක් සහ Evaluate phase එකක් ඇත. ගිණුමක් නොමැතිවම අත්හදා බලන්න.",
  },
  playWaveTag: { EN: "Wave 4 of 6 · Circle Theorems", SI: "Wave 4 of 6 · වෘත්ත ප්‍රමේයයන්" },
  playLearnLabel: { EN: "Learn phase", SI: "Learn phase" },
  playLearnTitle: { EN: "Areas scale with the square", SI: "වර්ගඵලය අරයේ වර්ගයට අනුලෝමව සමානුපාතික වේ" },
  playLearnCopy: {
    EN: "Double a circle's radius and its area does not double, it quadruples. Area always scales with r².",
    SI: "වෘත්තයක අරය දෙගුණ කළ විට වර්ගඵලය දෙගුණ නොවේ, එය සිව්ගුණ වේ (r² අනුව).",
  },
  playEvaluateLabel: { EN: "Evaluate phase", SI: "Evaluate phase" },
  playQuestion: {
    EN: "A circle's radius is doubled. What happens to its area?",
    SI: "වෘත්තයක අරය දෙගුණ කළ විට එහි වර්ගඵලයට සිදුවන්නේ කුමක්ද?",
  },
  playOptA: { EN: "It stays the same", SI: "වෙනස් නොවේ" },
  playOptB: { EN: "It doubles", SI: "දෙගුණ වේ" },
  playOptC: { EN: "It triples", SI: "තුන්ගුණ වේ" },
  playOptD: { EN: "It quadruples", SI: "සිව්ගුණ වේ" },
  playHint: {
    EN: "Area scales with r². So what is (2r)²?",
    SI: "වර්ගඵලය r² අනුව වෙනස් වේ. එසේ නම් (2r)² යනු කුමක්ද?",
  },
  playHintLabel: { EN: "AI tutor hint", SI: "AI Tutor ඉඟිය" },
  playCorrectTitle: { EN: "Wave complete.", SI: "Wave එක සම්පූර්ණයි!" },
  playCorrectCopy: {
    EN: "That is the whole loop: learn, answer, earn. Courses hold hundreds of waves like this one.",
    SI: "මෙයයි සම්පූර්ණ ක්‍රියාවලිය: ඉගෙන ගන්න, පිළිතුරු දෙන්න, XP උපයන්න.",
  },
  playCta: { EN: "Start your real journey", SI: "ඔබගේ ඉගෙනුම් ගමන ආරම්භ කරන්න" },
  playReplay: { EN: "Replay wave", SI: "Wave එක නැවත Play කරන්න" },

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

  /* Meet Fluffy (AI tutor & companion) */
  fluffyBadge: { EN: "Meet Your AI Study Companion", SI: "ඔබේ AI අධ්‍යාපන මිතුරා හඳුනාගන්න" },
  fluffyTitle: {
    EN: "Meet Fluffy, your 24/7 AI tutor & companion",
    SI: "Fluffy හඳුනාගන්න — ඔබේ 24/7 AI ගුරුවරයා හා මිතුරා",
  },
  fluffySubhead: {
    EN: "Always by your side to explain tricky problems, provide step-by-step hints, and celebrate every breakthrough. Fluent in English and Sinhala, Fluffy adapts to your learning pace and keeps curiosity alive.",
    SI: "අපහසු ගැටලු සරලව පැහැදිලි කිරීමටත්, පියවරෙන් පියවර මඟපෙන්වීමටත්, ඔබේ ජයග්‍රහණ සැමරීමටත් Fluffy 24/7 ඔබ ළඟින්ම සිටී. සිංහලෙන් සහ ඉංග්‍රීසියෙන් ඕනෑම වේලාවක උපකාර ලබාගන්න.",
  },
  fluffyCta: { EN: "Start learning with Fluffy", SI: "Fluffy සමඟ ඉගෙනුම අරඹන්න" },
  fluffyFeature1: { EN: "Step-by-step Socratic hints", SI: "පියවරෙන් පියවර මඟපෙන්වීම්" },
  fluffyFeature2: { EN: "Fluent in English & සිංහල", SI: "සිංහල සහ ඉංග්‍රීසි භාෂා ද්විත්වයෙන්ම" },
  fluffyFeature3: { EN: "Live wave explanations", SI: "සජීවී Waves පැහැදිලි කිරීම්" },
  fluffyFeature4: { EN: "24/7 streak & motivation partner", SI: "නොනවතින ධෛර්යය හා පෙළඹවීම" },
  fluffyTip1: {
    EN: "Stuck on Gear Ratios? Let's turn the gears together!",
    SI: "Gear Ratios අපහසුද? අපි එකට කරකවලා බලමු!",
  },
  fluffyTip2: {
    EN: "Awesome 5-streak! You're crushing it!",
    SI: "සුපිරි! Streak 5ක් සම්පූර්ණයි! දිගටම යමු!",
  },
  fluffyTip3: {
    EN: "Ask me anything in English or සිංහල!",
    SI: "ඕනෑම දෙයක් සිංහලෙන් හෝ English වලින් අහන්න!",
  },

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
    EN: "Compete globally, by grade and by course. Top 0.1% earn the diamond glyph.",
    SI: "ගෝලීය වශයෙන්, ශ්‍රේණිය සහ පාඨමාලාව අනුව තරඟ කරන්න. ඉහළ 0.1% ට දියමන්ති සංකේතය හිමිවේ.",
  },
  mechanicProficiencyTitle: { EN: "Proficiency ladder", SI: "ප්‍රාඵල්‍යතා පඩිපෙළ" },
  mechanicProficiencyCopy: {
    EN: "Climb Not Started → Expert as your average score grows. Gold and purple earn badges.",
    SI: "Not Started → Expert දක්වා නඟින්න. රන් සහ දම් පටි අත්පත් කරගන්න.",
  },
  mechanicStreakTitle: { EN: "Daily streaks", SI: "දෛනික දිගට" },
  mechanicStreakCopy: {
    EN: "Practice every day to keep your flame alive. Bonus XP when you hit 7 days.",
    SI: "දිනපතා පුහුණු වීමෙන් ඔබගේ ගිනි දලවා තබාගන්න. 7 දිනක් වූ විට bonus XP.",
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
    EN: "Ready to start your\njourney?",
    SI: "ඔබගේ ගමන ආරම්භ කිරීමට\nසූදානම්ද?",
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
