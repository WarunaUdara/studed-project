import type { Page } from "@playwright/test";

/**
 * Sets up Playwright GraphQL route interception to allow offline/standalone UX crawling
 * without requiring the full Docker backend stack to be running.
 */
export async function setupMockGraphQL(page: Page) {
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

      // 4. Leaderboard Query
      if (query.includes("query Leaderboard") || query.includes("leaderboard(")) {
        const scope = vars?.scope || "GLOBAL";
        const youId = "demo-student-id";
        const youXp = 425;
        const youName = "Demo Student";

        // Generate full 50-student realistic cohort
        const SEEDED_STUDENTS_LIST = [
          { id: "stu-001", fullName: "Senuri Wickramasinghe", totalXp: 12450 },
          { id: "stu-002", fullName: "Kavindu Jayawardena", totalXp: 11820 },
          { id: "stu-003", fullName: "Dinuka Perera", totalXp: 10950 },
          { id: "stu-004", fullName: "Thisara Bandara", totalXp: 9800 },
          { id: "stu-005", fullName: "Rashmi Gunasekara", totalXp: 9150 },
          { id: "stu-006", fullName: "Akila Weerasinghe", totalXp: 8640 },
          { id: "stu-007", fullName: "Sachini Fernando", totalXp: 8210 },
          { id: "stu-008", fullName: "Praveen Seneviratne", totalXp: 7890 },
          { id: "stu-009", fullName: "Nadeesha Alwis", totalXp: 7420 },
          { id: "stu-010", fullName: "Tharindu Rathnayake", totalXp: 7100 },
          { id: "stu-011", fullName: "Sivapalan Ketheeswaran", totalXp: 6850 },
          { id: "stu-012", fullName: "Sanduni Dissanayake", totalXp: 6540 },
          { id: "stu-013", fullName: "Gayan Mendis", totalXp: 6200 },
          { id: "stu-014", fullName: "Chathuni Liyanage", totalXp: 5900 },
          { id: "stu-015", fullName: "Bhanuka Rajapaksha", totalXp: 5620 },
          { id: "stu-016", fullName: "Hiruni Senanayake", totalXp: 5310 },
          { id: "stu-017", fullName: "Ravindu Gamage", totalXp: 5020 },
          { id: "stu-018", fullName: "Yashodha Karunaratne", totalXp: 4780 },
          { id: "stu-019", fullName: "Navin Pathirana", totalXp: 4510 },
          { id: "stu-020", fullName: "Dilini Samarasinghe", totalXp: 4290 },
          { id: "stu-021", fullName: "Thanushanth Selvarajah", totalXp: 4050 },
          { id: "stu-022", fullName: "Imasha Abeykoon", totalXp: 3820 },
          { id: "stu-023", fullName: "Isuru Ranasinghe", totalXp: 3600 },
          { id: "stu-024", fullName: "Minoli Hettiarachchi", totalXp: 3410 },
          { id: "stu-025", fullName: "Sanju Jayasuriya", totalXp: 3230 },
          { id: "stu-026", fullName: "Anuki De Silva", totalXp: 3040 },
          { id: "stu-027", fullName: "Hasitha Wijewardena", totalXp: 2890 },
          { id: "stu-028", fullName: "Kasuni Kulatunga", totalXp: 2710 },
          { id: "stu-029", fullName: "Ruwan Ekanayake", totalXp: 2550 },
          { id: "stu-030", fullName: "Pavithra Sivakumar", totalXp: 2400 },
          { id: "stu-031", fullName: "Oshada Madushan", totalXp: 2240 },
          { id: "stu-032", fullName: "Malsha Fonseka", totalXp: 2090 },
          { id: "stu-033", fullName: "Ashen Cooray", totalXp: 1950 },
          { id: "stu-034", fullName: "Uthpala Vithanage", totalXp: 1810 },
          { id: "stu-035", fullName: "Danushka Priyadarshana", totalXp: 1680 },
          { id: "stu-036", fullName: "Nilupul Senarath", totalXp: 1540 },
          { id: "stu-037", fullName: "Methmi Attanayake", totalXp: 1420 },
          { id: "stu-038", fullName: "Janidu Premachandra", totalXp: 1300 },
          { id: "stu-039", fullName: "Shalika Manamperi", totalXp: 1190 },
          { id: "stu-040", fullName: "Pasan Liyanapathirana", totalXp: 1080 },
          { id: "stu-041", fullName: "Vathsalan Arumugam", totalXp: 980 },
          { id: "stu-042", fullName: "Nimesh Galahitiyawa", totalXp: 880 },
          { id: "stu-043", fullName: "Thilini Dharmadasa", totalXp: 790 },
          { id: "stu-044", fullName: "Manuja Wickramatunga", totalXp: 690 },
          { id: "stu-045", fullName: "Sayuri Lokuge", totalXp: 610 },
          { id: "stu-046", fullName: "Dulantha Hewapathirana", totalXp: 520 },
          { id: "stu-047", fullName: "Lakshika Chandrasena", totalXp: 440 },
          { id: "stu-048", fullName: "Suraj Jayakody", totalXp: 370 },
          { id: "stu-049", fullName: "Hansika Jayawardhana", totalXp: 290 },
          { id: "stu-050", fullName: "Chamod Edirisinghe", totalXp: 210 },
        ];

        const mult = scope === "WEEKLY" ? 0.35 : scope === "GRADE" ? 0.8 : 1.0;
        const mapped = SEEDED_STUDENTS_LIST.map((s) => ({
          user: { id: s.id, fullName: s.fullName },
          totalXp: Math.round(s.totalXp * mult),
        }));

        mapped.push({
          user: { id: youId, fullName: youName },
          totalXp: youXp,
        });

        mapped.sort((a, b) => b.totalXp - a.totalXp);
        const entries = mapped.map((m, idx) => ({
          rank: idx + 1,
          user: m.user,
          totalXp: m.totalXp,
        }));

        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              leaderboard: entries,
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
