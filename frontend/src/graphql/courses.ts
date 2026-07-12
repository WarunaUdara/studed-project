export const COURSES_QUERY = `
  query Courses($filter: CourseFilter, $pagination: PaginationInput) {
    courses(filter: $filter, pagination: $pagination) {
      edges {
        node {
          id
          title
          description
          slug
          gradeLevel
          price
          isPublished
          createdAt
          myProgress {
            completedWaves
            totalWaves
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
` as const;

export const COURSE_QUERY = `
  query Course($id: ID!) {
    course(id: $id) {
      id
      title
      description
      slug
      gradeLevel
      price
      isPublished
      createdAt
      myProgress {
        completedWaves
        totalWaves
      }
      lessons {
        id
        title
        sequenceOrder
        isPublished
        waves {
          id
          title
          sequenceOrder
          xpReward
          difficulty
          isPublished
          myProgress {
            status
            attemptsCount
          }
        }
      }
    }
  }
` as const;

export const LESSON_QUERY = `
  query Lesson($id: ID!) {
    lesson(id: $id) {
      id
      title
      sequenceOrder
      isPublished
      waves {
        id
        title
        sequenceOrder
        xpReward
        maxReattempts
        passingThreshold
        estimatedDuration
        difficulty
        isPublished
      }
    }
  }
` as const;

export const WAVE_QUERY = `
  query Wave($id: ID!) {
    wave(id: $id) {
      id
      title
      sequenceOrder
      xpReward
      maxReattempts
      passingThreshold
      estimatedDuration
      difficulty
      isPublished
      lesson {
        title
      }
      learnBlocks {
        id
        type
        content
        metadata
      }
      evaluateBlocks {
        id
        type
        question
        options
        correctAnswer
        explanation
        metadata
      }
    }
  }
` as const;

export const CREATE_COURSE_MUTATION = `
  mutation CreateCourse($input: CreateCourseInput!) {
    createCourse(input: $input) {
      id
      title
      description
      slug
      gradeLevel
      price
      isPublished
      createdAt
    }
  }
` as const;

export const UPDATE_COURSE_MUTATION = `
  mutation UpdateCourse($id: ID!, $input: UpdateCourseInput!) {
    updateCourse(id: $id, input: $input) {
      id
      title
      description
      slug
      gradeLevel
      price
      isPublished
      createdAt
    }
  }
` as const;

export const PUBLISH_COURSE_MUTATION = `
  mutation PublishCourse($id: ID!) {
    publishCourse(id: $id) {
      id
      title
      isPublished
    }
  }
` as const;

export const CREATE_LESSON_MUTATION = `
  mutation CreateLesson($courseId: ID!, $input: CreateLessonInput!) {
    createLesson(courseId: $courseId, input: $input) {
      id
      title
      sequenceOrder
      isPublished
    }
  }
` as const;

export const CREATE_WAVE_MUTATION = `
  mutation CreateWave($lessonId: ID!, $input: CreateWaveInput!) {
    createWave(lessonId: $lessonId, input: $input) {
      id
      title
      sequenceOrder
      xpReward
      maxReattempts
      passingThreshold
      estimatedDuration
      difficulty
      isPublished
    }
  }
` as const;

export const ENROLL_MUTATION = `
  mutation EnrollInCourse($courseId: ID!) {
    enrollInCourse(courseId: $courseId) {
      id
      title
      myProgress {
        completedWaves
        totalWaves
      }
    }
  }
` as const;

export const MY_ENROLLMENTS_QUERY = `
  query MyEnrollments {
    myEnrollments {
      id
      title
      description
      slug
      gradeLevel
      price
      isPublished
      myProgress {
        completedWaves
        totalWaves
      }
      lessons {
        id
        title
        sequenceOrder
        isPublished
        waves {
          id
          myProgress {
            status
            attemptsCount
            highestScore
          }
        }
      }
    }
  }
` as const;

export const LEADERBOARD_QUERY = `
  query Leaderboard($scope: LeaderboardScope!, $courseId: ID, $grade: Grade) {
    leaderboard(scope: $scope, courseId: $courseId, grade: $grade) {
      rank
      user {
        id
        fullName
      }
      totalXp
    }
  }
` as const;

export const SUBMIT_WAVE_ANSWERS_MUTATION = `
  mutation SubmitWaveAnswers($waveId: ID!, $answers: [AnswerInput!]!) {
    submitWaveAnswers(waveId: $waveId, answers: $answers) {
      score
      xpEarned
      totalXp
      passed
      remainingAttempts
    }
  }
` as const;

export const UPDATE_WAVE_MUTATION = `
  mutation UpdateWave($id: ID!, $input: UpdateWaveInput!) {
    updateWave(id: $id, input: $input) {
      id
      title
      sequenceOrder
      xpReward
      maxReattempts
      passingThreshold
      estimatedDuration
      difficulty
      isPublished
      learnBlocks {
        id
        type
        content
        metadata
      }
      evaluateBlocks {
        id
        type
        question
        options
        correctAnswer
        explanation
        metadata
      }
    }
  }
` as const;

export const PUBLISH_WAVE_MUTATION = `
  mutation PublishWave($id: ID!) {
    publishWave(id: $id) {
      id
      title
      isPublished
    }
  }
` as const;
