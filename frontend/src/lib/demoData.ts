/**
 * Deterministic seeded student and leaderboard mock dataset.
 * Provides authentic Sri Lankan student cohorts across schools,
 * structured for high-performance rendering with Blobatar.
 */

export interface SeededStudent {
  id: string;
  fullName: string;
  school: string;
  grade: string;
  baseXp: number;
}

export interface DemoLeaderboardEntry {
  rank: number;
  user: { id: string; fullName: string };
  totalXp: number;
  school?: string;
}

export const SRI_LANKAN_SCHOOLS = [
  "Royal College, Colombo",
  "Visakha Vidyalaya, Colombo",
  "Ananda College, Colombo",
  "Nalanda College, Colombo",
  "Musaeus College, Colombo",
  "St. Thomas' College, Mount Lavinia",
  "Ladies' College, Colombo",
  "Trinity College, Kandy",
  "Mahamaya Girls' College, Kandy",
  "Dharmaraja College, Kandy",
  "Kingswood College, Kandy",
  "Richmond College, Galle",
  "Mahinda College, Galle",
  "Southlands College, Galle",
  "Jaffna Central College, Jaffna",
  "St. John's College, Jaffna",
  "Maliyadeva College, Kurunegala",
  "Rahula College, Matara",
  "Sujatha Vidyalaya, Matara",
  "St. Anne's College, Kurunegala",
];

export const SEEDED_STUDENTS: SeededStudent[] = [
  { id: "stu-001", fullName: "Senuri Wickramasinghe", school: "Visakha Vidyalaya, Colombo", grade: "G11", baseXp: 12450 },
  { id: "stu-002", fullName: "Kavindu Jayawardena", school: "Royal College, Colombo", grade: "G11", baseXp: 11820 },
  { id: "stu-003", fullName: "Dinuka Perera", school: "Ananda College, Colombo", grade: "G10", baseXp: 10950 },
  { id: "stu-004", fullName: "Thisara Bandara", school: "Trinity College, Kandy", grade: "G11", baseXp: 9800 },
  { id: "stu-005", fullName: "Rashmi Gunasekara", school: "Mahamaya Girls' College, Kandy", grade: "G10", baseXp: 9150 },
  { id: "stu-006", fullName: "Akila Weerasinghe", school: "Nalanda College, Colombo", grade: "G9", baseXp: 8640 },
  { id: "stu-007", fullName: "Sachini Fernando", school: "Musaeus College, Colombo", grade: "G10", baseXp: 8210 },
  { id: "stu-008", fullName: "Praveen Seneviratne", school: "Richmond College, Galle", grade: "G11", baseXp: 7890 },
  { id: "stu-009", fullName: "Nadeesha Alwis", school: "Ladies' College, Colombo", grade: "G9", baseXp: 7420 },
  { id: "stu-010", fullName: "Tharindu Rathnayake", school: "Mahinda College, Galle", grade: "G10", baseXp: 7100 },
  { id: "stu-011", fullName: "Sivapalan Ketheeswaran", school: "Jaffna Central College, Jaffna", grade: "G11", baseXp: 6850 },
  { id: "stu-012", fullName: "Sanduni Dissanayake", school: "Maliyadeva College, Kurunegala", grade: "G10", baseXp: 6540 },
  { id: "stu-013", fullName: "Gayan Mendis", school: "St. Thomas' College, Mount Lavinia", grade: "G9", baseXp: 6200 },
  { id: "stu-014", fullName: "Chathuni Liyanage", school: "Southlands College, Galle", grade: "G10", baseXp: 5900 },
  { id: "stu-015", fullName: "Bhanuka Rajapaksha", school: "Rahula College, Matara", grade: "G11", baseXp: 5620 },
  { id: "stu-016", fullName: "Hiruni Senanayake", school: "Sujatha Vidyalaya, Matara", grade: "G9", baseXp: 5310 },
  { id: "stu-017", fullName: "Ravindu Gamage", school: "Kingswood College, Kandy", grade: "G10", baseXp: 5020 },
  { id: "stu-018", fullName: "Yashodha Karunaratne", school: "Visakha Vidyalaya, Colombo", grade: "G11", baseXp: 4780 },
  { id: "stu-019", fullName: "Navin Pathirana", school: "Ananda College, Colombo", grade: "G9", baseXp: 4510 },
  { id: "stu-020", fullName: "Dilini Samarasinghe", school: "Mahamaya Girls' College, Kandy", grade: "G10", baseXp: 4290 },
  { id: "stu-021", fullName: "Thanushanth Selvarajah", school: "St. John's College, Jaffna", grade: "G11", baseXp: 4050 },
  { id: "stu-022", fullName: "Imasha Abeykoon", school: "Maliyadeva College, Kurunegala", grade: "G9", baseXp: 3820 },
  { id: "stu-023", fullName: "Isuru Ranasinghe", school: "Royal College, Colombo", grade: "G10", baseXp: 3600 },
  { id: "stu-024", fullName: "Minoli Hettiarachchi", school: "Ladies' College, Colombo", grade: "G11", baseXp: 3410 },
  { id: "stu-025", fullName: "Sanju Jayasuriya", school: "Richmond College, Galle", grade: "G9", baseXp: 3230 },
  { id: "stu-026", fullName: "Anuki De Silva", school: "Musaeus College, Colombo", grade: "G10", baseXp: 3040 },
  { id: "stu-027", fullName: "Hasitha Wijewardena", school: "Nalanda College, Colombo", grade: "G11", baseXp: 2890 },
  { id: "stu-028", fullName: "Kasuni Kulatunga", school: "Southlands College, Galle", grade: "G9", baseXp: 2710 },
  { id: "stu-029", fullName: "Ruwan Ekanayake", school: "Dharmaraja College, Kandy", grade: "G10", baseXp: 2550 },
  { id: "stu-030", fullName: "Pavithra Sivakumar", school: "Jaffna Central College, Jaffna", grade: "G11", baseXp: 2400 },
  { id: "stu-031", fullName: "Oshada Madushan", school: "St. Anne's College, Kurunegala", grade: "G9", baseXp: 2240 },
  { id: "stu-032", fullName: "Malsha Fonseka", school: "Visakha Vidyalaya, Colombo", grade: "G10", baseXp: 2090 },
  { id: "stu-033", fullName: "Ashen Cooray", school: "St. Thomas' College, Mount Lavinia", grade: "G11", baseXp: 1950 },
  { id: "stu-034", fullName: "Uthpala Vithanage", school: "Mahamaya Girls' College, Kandy", grade: "G9", baseXp: 1810 },
  { id: "stu-035", fullName: "Danushka Priyadarshana", school: "Rahula College, Matara", grade: "G10", baseXp: 1680 },
  { id: "stu-036", fullName: "Nilupul Senarath", school: "Ananda College, Colombo", grade: "G11", baseXp: 1540 },
  { id: "stu-037", fullName: "Methmi Attanayake", school: "Sujatha Vidyalaya, Matara", grade: "G9", baseXp: 1420 },
  { id: "stu-038", fullName: "Janidu Premachandra", school: "Trinity College, Kandy", grade: "G10", baseXp: 1300 },
  { id: "stu-039", fullName: "Shalika Manamperi", school: "Ladies' College, Colombo", grade: "G11", baseXp: 1190 },
  { id: "stu-040", fullName: "Pasan Liyanapathirana", school: "Mahinda College, Galle", grade: "G9", baseXp: 1080 },
  { id: "stu-041", fullName: "Vathsalan Arumugam", school: "St. John's College, Jaffna", grade: "G10", baseXp: 980 },
  { id: "stu-042", fullName: "Nimesh Galahitiyawa", school: "Kingswood College, Kandy", grade: "G11", baseXp: 880 },
  { id: "stu-043", fullName: "Thilini Dharmadasa", school: "Musaeus College, Colombo", grade: "G9", baseXp: 790 },
  { id: "stu-044", fullName: "Manuja Wickramatunga", school: "Royal College, Colombo", grade: "G10", baseXp: 690 },
  { id: "stu-045", fullName: "Sayuri Lokuge", school: "Southlands College, Galle", grade: "G11", baseXp: 610 },
  { id: "stu-046", fullName: "Dulantha Hewapathirana", school: "Richmond College, Galle", grade: "G9", baseXp: 520 },
  { id: "stu-047", fullName: "Lakshika Chandrasena", school: "Maliyadeva College, Kurunegala", grade: "G10", baseXp: 440 },
  { id: "stu-048", fullName: "Suraj Jayakody", school: "St. Anne's College, Kurunegala", grade: "G11", baseXp: 370 },
  { id: "stu-049", fullName: "Hansika Jayawardhana", school: "Mahamaya Girls' College, Kandy", grade: "G9", baseXp: 290 },
  { id: "stu-050", fullName: "Chamod Edirisinghe", school: "Dharmaraja College, Kandy", grade: "G10", baseXp: 210 },
];

/**
 * Generates a realistic, complete 50-student leaderboard with deterministic positioning.
 * Automatically slots the active user into their mathematically exact position according to their XP.
 */
export function buildDemoLeaderboard(
  youId = "demo-student-id",
  youXp = 425,
  youName = "Demo Student",
  scope = "GLOBAL"
): DemoLeaderboardEntry[] {
  // Scale multiplier according to scope for natural variety
  const multiplier = scope === "WEEKLY" ? 0.35 : scope === "GRADE" ? 0.8 : 1.0;

  const rawEntries = SEEDED_STUDENTS.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    school: s.school,
    totalXp: Math.round(s.baseXp * multiplier),
  }));

  // Check if you are already in the list; if so replace, else add
  const existingIdx = rawEntries.findIndex((e) => e.id === youId);
  if (existingIdx !== -1) {
    rawEntries[existingIdx].totalXp = youXp;
    rawEntries[existingIdx].fullName = youName;
  } else {
    rawEntries.push({
      id: youId,
      fullName: youName,
      school: "Royal College, Colombo",
      totalXp: youXp,
    });
  }

  // Sort by descending XP
  rawEntries.sort((a, b) => b.totalXp - a.totalXp);

  // Assign deterministic 1-based ranks
  return rawEntries.map((e, index) => ({
    rank: index + 1,
    user: {
      id: e.id,
      fullName: e.fullName,
    },
    school: e.school,
    totalXp: e.totalXp,
  }));
}

/**
 * Convenience snapshot helper for landing page preview.
 */
export function demoLeaderboardSnapshot(youId = "you", youXp = 3120): DemoLeaderboardEntry[] {
  return buildDemoLeaderboard(youId, youXp, "You", "GLOBAL");
}

/**
 * Featured course preview used on the public home page catalog section.
 * These mirror the structure of the GraphQL `Course` type so the existing
 * ProgressRing / ProficiencyBadge components accept them unmodified.
 */
export interface FeaturedCourse {
  id: string;
  title: string;
  description: string;
  gradeLevel: string;
  subjectIcon: "math" | "science" | "english" | "sinhala";
  totalWaves: number;
  completedWaves: number;
  proficiency: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "PROFICIENT" | "EXPERT";
}

export const FEATURED_COURSES: FeaturedCourse[] = [
  {
    id: "demo-math-g7",
    title: "Mathematics",
    description: "Algebra, geometry and problem-solving with interactive worked examples.",
    gradeLevel: "G7",
    subjectIcon: "math",
    totalWaves: 24,
    completedWaves: 18,
    proficiency: "PROFICIENT",
  },
  {
    id: "demo-sci-g9",
    title: "Science",
    description: "Biology, chemistry and physics units with visual experiments.",
    gradeLevel: "G9",
    subjectIcon: "science",
    totalWaves: 30,
    completedWaves: 9,
    proficiency: "IN_PROGRESS",
  },
  {
    id: "demo-eng-ol",
    title: "English",
    description: "Grammar, comprehension and exam-style practice for O/L success.",
    gradeLevel: "OL",
    subjectIcon: "english",
    totalWaves: 18,
    completedWaves: 0,
    proficiency: "NOT_STARTED",
  },
  {
    id: "demo-sin-al",
    title: "Sinhala",
    description: "සාහිත්‍යය, ව්‍යාකරණ සහ රචනා අත්පොත: A/L සඳහා සම්පූර්ණ අධ්‍යයන ඒකක.",
    gradeLevel: "AL",
    subjectIcon: "sinhala",
    totalWaves: 22,
    completedWaves: 22,
    proficiency: "EXPERT",
  },
];
