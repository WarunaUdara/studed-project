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
