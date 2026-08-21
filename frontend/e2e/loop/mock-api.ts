import type { Page } from "@playwright/test";

/**
 * Pages that already have the GraphQL route installed. The snapshot engine
 * calls setup once per screen, and every extra call stacked another handler on
 * the same page: by the tenth screen a single request was walking ten
 * identical interceptors, and unmatched queries were each continuing to a
 * backend that is not running during an offline crawl.
 */
const routedPages = new WeakSet<Page>();

/**
 * Sets up Playwright GraphQL route interception to allow offline/standalone UX crawling
 * without requiring the full Docker backend stack to be running.
 */
export async function setupMockGraphQL(page: Page) {
  if (routedPages.has(page)) return;
  routedPages.add(page);

  await page.route("**/graphql", async (route) => {
    try {
      const req = route.request();
      if (req.method() !== "POST") return route.continue();

      const postData = req.postDataJSON();
      const query = postData?.query || "";
      const vars = postData?.variables || {};

      // 1. Login Mutation
      if (query.includes("login(") || query.includes("Login(") || query.includes("login")) {
        const email = vars?.input?.email || "demo.student@studed.lk";
        const isEducator = email.includes("educator");

        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              login: {
                token: "mock-jwt-token-for-ux-loop",
                user: {
                  id: isEducator ? "demo-educator-id" : "demo-student-id",
                  email,
                  fullName: isEducator ? "Demo Educator" : "Demo Student",
                  role: isEducator ? "EDUCATOR" : "STUDENT",
                  grade: isEducator ? null : "G9",
                  preferredLanguage: "en",
                  totalXp: isEducator ? 1200 : 425,
                  streak: isEducator ? 5 : 3,
                },
              },
            },
          }),
        });
      }

      // 2. Me Query
      if (query.includes("me {") || query.includes("query Me")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              me: {
                id: "demo-student-id",
                email: "demo.student@studed.lk",
                fullName: "Demo Student",
                role: "STUDENT",
                grade: "G9",
                preferredLanguage: "en",
                totalXp: 425,
                streak: 3,
              },
            },
          }),
        });
      }

      // 3. Courses Query
      if (query.includes("query Courses") || query.includes("courses(")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              courses: {
                edges: [
                  {
                    node: {
                      id: "science-thinking",
                      title: "Scientific Thinking",
                      slug: "science-thinking",
                      description: "Learn mechanical physics, gear train parity, and kinematics with interactive simulations.",
                      gradeLevel: "G9",
                      price: 0,
                      isPublished: true,
                      myProgress: { completedWaves: 1, totalWaves: 5 },
                    },
                  },
                  {
                    node: {
                      id: "math-coordinate-geometry",
                      title: "Coordinate Geometry",
                      slug: "coordinate-geometry",
                      description: "Master Cartesian coordinates, slope formulas, and distance equations.",
                      gradeLevel: "G10",
                      price: 0,
                      isPublished: true,
                      myProgress: { completedWaves: 2, totalWaves: 6 },
                    },
                  },
                ],
              },
            },
          }),
        });
      }

      // 4. Achievements Query
      if (query.includes("achievements") || query.includes("GetAchievements")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              achievements: [
                {
                  id: "first_wave",
                  name: "First Wave Complete",
                  description: "Complete your first wave in any course.",
                  iconUrl: null,
                  unlocked: true,
                  unlockedAt: "2026-08-01T12:00:00Z",
                },
                {
                  id: "lesson_complete",
                  name: "Lesson Pioneer",
                  description: "Finish all waves in a single lesson.",
                  iconUrl: null,
                  unlocked: true,
                  unlockedAt: "2026-08-05T15:30:00Z",
                },
                {
                  id: "first_course",
                  name: "Course Conqueror",
                  description: "Complete an entire curriculum course.",
                  iconUrl: null,
                  unlocked: false,
                  unlockedAt: null,
                },
                {
                  id: "perfect_score",
                  name: "Flawless Execution",
                  description: "Achieve 100% on any evaluate section.",
                  iconUrl: null,
                  unlocked: true,
                  unlockedAt: "2026-08-08T09:00:00Z",
                },
                {
                  id: "lesson_proficient",
                  name: "Mastery Badge",
                  description: "Reach proficient level across 3 lessons.",
                  iconUrl: null,
                  unlocked: false,
                  unlockedAt: null,
                },
                {
                  id: "rising_star",
                  name: "Rising Star",
                  description: "Cross 500 XP in learning milestones.",
                  iconUrl: null,
                  unlocked: true,
                  unlockedAt: "2026-08-10T18:00:00Z",
                },
                {
                  id: "scholar",
                  name: "Scholar",
                  description: "Cross 2,500 XP in learning milestones.",
                  iconUrl: null,
                  unlocked: false,
                  unlockedAt: null,
                },
                {
                  id: "master",
                  name: "Grand Master",
                  description: "Cross 10,000 XP in learning milestones.",
                  iconUrl: null,
                  unlocked: false,
                  unlockedAt: null,
                },
              ],
            },
          }),
        });
      }

      // 5. Leaderboard Query
      if (query.includes("query Leaderboard") || query.includes("leaderboard(")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              leaderboard: {
                totalRanked: 15,
                entries: [
                  { rank: 1, userId: "u-1", displayName: "Senuri W.", totalXp: 12450, isMe: false },
                  { rank: 2, userId: "u-2", displayName: "Kavindu J.", totalXp: 11820, isMe: false },
                  { rank: 3, userId: "u-3", displayName: "Dinuka P.", totalXp: 10950, isMe: false },
                  { rank: 4, userId: "u-4", displayName: "Thisara B.", totalXp: 9800, isMe: false },
                  { rank: 5, userId: "u-5", displayName: "Rashmi G.", totalXp: 9150, isMe: false },
                  { rank: 6, userId: "demo-student-id", displayName: "Demo S.", totalXp: 425, isMe: true },
                ],
                me: {
                  rank: 6,
                  userId: "demo-student-id",
                  displayName: "Demo S.",
                  totalXp: 425,
                  isMe: true,
                },
              },
            },
          }),
        });
      }

      // 6. My Enrollments Query
      if (query.includes("myEnrollments") || query.includes("MyEnrollments")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              myEnrollments: [
                {
                  id: "science-thinking",
                  title: "Scientific Thinking",
                  description: "Learn mechanical physics and kinematics.",
                  slug: "science-thinking",
                  gradeLevel: "G9",
                  price: 0,
                  isPublished: true,
                  myProgress: { completedWaves: 1, totalWaves: 5 },
                  lessons: [],
                },
              ],
            },
          }),
        });
      }

      // 7. My Subscription Query
      if (query.includes("mySubscription") || query.includes("MySubscription")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              mySubscription: {
                id: "sub-123",
                planTier: "PREMIUM",
                status: "ACTIVE",
                currentPeriodEnd: "2027-01-01T00:00:00Z",
                cancelAtPeriodEnd: false,
              },
            },
          }),
        });
      }

      // Default continue to real server
      return route.continue();
    } catch {
      return route.continue();
    }
  });
}

/**
 * Directly seeds the student session in the browser localStorage before navigation.
 */
export async function seedStudentSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("studed_has_session", "true");
  });
}
