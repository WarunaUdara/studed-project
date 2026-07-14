import { argv } from "process";

const GATEWAY = "http://localhost:8080/graphql";

class Session {
  cookies: string[] = [];

  constructor(public email: string) {}

  async graphql(query: string, variables: any = {}) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.cookies.length > 0) {
      headers["Cookie"] = this.cookies.join("; ");
    }

    const res = await fetch(GATEWAY, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      // Parse cookies
      const cookiesToSet = setCookie.split(",").map((c) => c.split(";")[0].trim());
      for (const cookie of cookiesToSet) {
        const name = cookie.split("=")[0];
        this.cookies = this.cookies.filter((c) => !c.startsWith(`${name}=`));
        this.cookies.push(cookie);
      }
    }

    const body = await res.json();
    return body;
  }
}

async function waitForGateway() {
  console.log(`[mock] waiting for API gateway healthcheck...`);
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch("http://localhost:8080/health");
      if (res.ok) {
        console.log(`[mock] API gateway is ready`);
        return;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  console.error(`[mock] API gateway did not become ready in time`);
  process.exit(1);
}

async function registerOrLogin(email: string, role: string, fullName: string, grade: string = ""): Promise<Session> {
  const session = new Session(email);
  const registerInput: any = {
    email,
    password: "password123",
    fullName,
    role,
    preferredLanguage: "en",
  };
  if (grade) {
    registerInput.grade = grade;
  }

  console.log(`[mock] registering or logging in ${email}...`);
  let res = await session.graphql(
    `mutation Register($input: RegisterInput!) {
      register(input: $input) {
        user {
          id
          email
          role
        }
      }
    }`,
    { input: registerInput }
  );

  if (res.errors) {
    res = await session.graphql(
      `mutation Login($input: LoginInput!) {
        login(input: $input) {
          user {
            id
            email
            role
          }
        }
      }`,
      {
        input: {
          email,
          password: "password123",
        },
      }
    );
  }

  if (res.errors) {
    console.error(`[mock] failed to authenticate ${email}:`, JSON.stringify(res.errors, null, 2));
    process.exit(1);
  }

  return session;
}

async function findCourseBySlug(session: Session, slug: string): Promise<string | null> {
  const res = await session.graphql(
    `query Courses($filter: CourseFilter, $pagination: PaginationInput) {
      courses(filter: $filter, pagination: $pagination) {
        edges {
          node {
            id
            slug
            title
          }
        }
      }
    }`,
    {
      filter: {},
      pagination: { first: 100 },
    }
  );

  const edges = res.data?.courses?.edges || [];
  for (const edge of edges) {
    if (edge.node.slug === slug) {
      return edge.node.id;
    }
  }
  return null;
}

async function createCourse(session: Session, title: string, slug: string, grade: string): Promise<string> {
  const existingId = await findCourseBySlug(session, slug);
  if (existingId) {
    console.log(`[mock] course '${title}' (${slug}) already exists: ${existingId}`);
    return existingId;
  }

  const res = await session.graphql(
    `mutation CreateCourse($input: CreateCourseInput!) {
      createCourse(input: $input) {
        id
        title
        slug
      }
    }`,
    {
      input: {
        title,
        description: `Mock course: ${title}`,
        slug,
        gradeLevel: grade,
        price: 0,
      },
    }
  );

  if (res.errors) {
    console.error(`[mock] failed to create course ${title}:`, JSON.stringify(res.errors, null, 2));
    process.exit(1);
  }

  const id = res.data.createCourse.id;
  console.log(`[mock] created course '${title}': ${id}`);
  return id;
}

async function publishCourse(session: Session, id: string) {
  await session.graphql(
    `mutation PublishCourse($id: ID!) {
      publishCourse(id: $id) {
        id
        isPublished
      }
    }`,
    { id }
  );
}

async function findLessonByTitle(session: Session, courseId: string, title: string): Promise<string | null> {
  const res = await session.graphql(
    `query Course($id: ID!) {
      course(id: $id) {
        lessons {
          id
          title
        }
      }
    }`,
    { id: courseId }
  );

  const lessons = res.data?.course?.lessons || [];
  for (const lesson of lessons) {
    if (lesson.title === title) {
      return lesson.id;
    }
  }
  return null;
}

async function createLesson(session: Session, courseId: string, title: string, sequence: number): Promise<string> {
  const existingId = await findLessonByTitle(session, courseId, title);
  if (existingId) {
    console.log(`[mock] lesson '${title}' already exists: ${existingId}`);
    return existingId;
  }

  const res = await session.graphql(
    `mutation CreateLesson($courseId: ID!, $input: CreateLessonInput!) {
      createLesson(courseId: $courseId, input: $input) {
        id
        title
      }
    }`,
    {
      courseId,
      input: {
        title,
        sequenceOrder: sequence,
      },
    }
  );

  if (res.errors) {
    console.error(`[mock] failed to create lesson ${title}:`, JSON.stringify(res.errors, null, 2));
    process.exit(1);
  }

  return res.data.createLesson.id;
}

async function publishLesson(session: Session, id: string) {
  await session.graphql(
    `mutation PublishLesson($id: ID!) {
      publishLesson(id: $id) {
        id
        isPublished
      }
    }`,
    { id }
  );
}

async function findWaveByTitle(session: Session, courseId: string, lessonId: string, title: string): Promise<string | null> {
  const res = await session.graphql(
    `query Course($id: ID!) {
      course(id: $id) {
        lessons {
          id
          waves {
            id
            title
          }
        }
      }
    }`,
    { id: courseId }
  );

  const lessons = res.data?.course?.lessons || [];
  const lesson = lessons.find((l: any) => l.id === lessonId);
  const waves = lesson?.waves || [];
  for (const wave of waves) {
    if (wave.title === title) {
      return wave.id;
    }
  }
  return null;
}

async function createWave(session: Session, courseId: string, lessonId: string, title: string, sequence: number, question: string, correct: string): Promise<string> {
  const existingId = await findWaveByTitle(session, courseId, lessonId, title);
  if (existingId) {
    console.log(`[mock] wave '${title}' already exists: ${existingId}`);
    return existingId;
  }

  const res = await session.graphql(
    `mutation CreateWave($lessonId: ID!, $input: CreateWaveInput!) {
      createWave(lessonId: $lessonId, input: $input) {
        id
        title
      }
    }`,
    {
      lessonId,
      input: {
        title,
        sequenceOrder: sequence,
        xpReward: 100,
        maxReattempts: 3,
        passingThreshold: 50,
        estimatedDuration: 10,
        difficulty: "MEDIUM",
        learnBlocks: [
          {
            id: "lb1",
            type: "text",
            content: `This is a mock learn block for ${title}.`,
          },
        ],
        evaluateBlocks: [
          {
            id: "eb1",
            type: "multiple_choice",
            question,
            options: [correct, "Wrong A", "Wrong B"],
            correctAnswer: correct,
            explanation: "Correct!",
          },
        ],
      },
    }
  );

  if (res.errors) {
    console.error(`[mock] failed to create wave ${title}:`, JSON.stringify(res.errors, null, 2));
    process.exit(1);
  }

  return res.data.createWave.id;
}

async function publishWave(session: Session, id: string) {
  await session.graphql(
    `mutation PublishWave($id: ID!) {
      publishWave(id: $id) {
        id
        isPublished
      }
    }`,
    { id }
  );
}

async function enroll(session: Session, courseId: string) {
  await session.graphql(
    `mutation EnrollInCourse($courseId: ID!) {
      enrollInCourse(courseId: $courseId) {
        id
      }
    }`,
    { courseId }
  );
}

async function submitAnswer(session: Session, waveId: string, blockId: string, answer: string) {
  const res = await session.graphql(
    `mutation SubmitWaveAnswers($waveId: ID!, $answers: [AnswerInput!]!) {
      submitWaveAnswers(waveId: $waveId, answers: $answers) {
        score
        xpEarned
        totalXp
        passed
      }
    }`,
    {
      waveId,
      answers: [{ evaluateBlockId: blockId, answer }],
    }
  );
  return res.data?.submitWaveAnswers;
}

async function main() {
  await waitForGateway();

  const educator = await registerOrLogin("demo.educator@studed.lk", "EDUCATOR", "Demo Educator");
  const student = await registerOrLogin("demo.student@studed.lk", "STUDENT", "Demo Student", "G10");

  console.log(`[mock] creating courses, lessons, and waves...`);

  // Science Course
  const scienceId = await createCourse(educator, "Grade 10 Science", "g10-science", "G10");
  const bioLessonId = await createLesson(educator, scienceId, "Introduction to Biology", 1);
  await publishLesson(educator, bioLessonId);
  const cellWaveId = await createWave(
    educator,
    scienceId,
    bioLessonId,
    "Cell Structure",
    1,
    "What is the powerhouse of the cell?",
    "Mitochondria"
  );
  await publishWave(educator, cellWaveId);
  await publishCourse(educator, scienceId);
  console.log(`[mock] published G10 Science`);

  // Mathematics Course
  const mathId = await createCourse(educator, "Grade 10 Mathematics", "g10-mathematics", "G10");
  const algebraLessonId = await createLesson(educator, mathId, "Algebra Basics", 1);
  await publishLesson(educator, algebraLessonId);
  const linearWaveId = await createWave(
    educator,
    mathId,
    algebraLessonId,
    "Linear Equations",
    1,
    "What is the value of x in 2x = 4?",
    "2"
  );
  await publishWave(educator, linearWaveId);
  await publishCourse(educator, mathId);
  console.log(`[mock] published G10 Mathematics`);

  // English Course
  const englishId = await createCourse(educator, "O/L English", "ol-english", "OL");
  const grammarLessonId = await createLesson(educator, englishId, "Grammar Fundamentals", 1);
  await publishLesson(educator, grammarLessonId);
  const tensesWaveId = await createWave(
    educator,
    englishId,
    grammarLessonId,
    "Tenses",
    1,
    "Which tense describes an action happening now?",
    "Present continuous"
  );
  await publishWave(educator, tensesWaveId);
  await publishCourse(educator, englishId);
  console.log(`[mock] published O/L English`);

  // AL Physics Course
  const physicsId = await createCourse(educator, "A/L Physics", "al-physics", "AL");
  const mechanicsLessonId = await createLesson(educator, physicsId, "Mechanics", 1);
  await publishLesson(educator, mechanicsLessonId);
  const lawsWaveId = await createWave(
    educator,
    physicsId,
    mechanicsLessonId,
    "Newton's Laws",
    1,
    "What is Newton's first law also known as?",
    "Law of inertia"
  );
  await publishWave(educator, lawsWaveId);
  await publishCourse(educator, physicsId);
  console.log(`[mock] published A/L Physics`);

  console.log(`[mock] enrolling student and completing a wave...`);
  await enroll(student, scienceId);
  await enroll(student, mathId);

  // Get wave details for science course to submit answer
  const waveInfo = await student.graphql(
    `query Course($id: ID!) {
      course(id: $id) {
        lessons {
          waves {
            id
            evaluateBlocks {
              id
              correctAnswer
            }
          }
        }
      }
    }`,
    { id: scienceId }
  );

  const wave = waveInfo.data?.course?.lessons?.[0]?.waves?.[0];
  if (wave) {
    const waveId = wave.id;
    const blockId = wave.evaluateBlocks?.[0]?.id;
    const correctAnswer = wave.evaluateBlocks?.[0]?.correctAnswer;

    if (waveId && blockId && correctAnswer) {
      const result = await submitAnswer(student, waveId, blockId, correctAnswer);
      console.log(`[mock] wave completed result:`, JSON.stringify(result, null, 2));
    }
  }

  console.log(`[mock] done`);
  console.log(`
Demo accounts:
  educator: demo.educator@studed.lk / password123
  student:  demo.student@studed.lk / password123
  `);
}

main().catch((err) => {
  console.error("Fatal error during mock seeding:", err);
  process.exit(1);
});
