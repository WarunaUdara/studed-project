export const ENROLL_IN_COURSE_MUTATION = `
  mutation EnrollInCourse($courseId: ID!) {
    enrollInCourse(courseId: $courseId) {
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

export const SUBMIT_WAVE_ANSWERS_MUTATION = `
  mutation SubmitWaveAnswers($waveId: ID!, $answers: [AnswerInput!]!) {
    submitWaveAnswers(waveId: $waveId, answers: $answers) {
      score
      xpEarned
      totalXp
      passed
      remainingAttempts
      feedback {
        evaluateBlockId
        correct
        correctAnswer
        explanation
      }
    }
  }
` as const;

export const COURSE_PLAYER_QUERY = `
  query CoursePlayer($id: ID!) {
    course(id: $id) {
      id
      title
      description
      slug
      gradeLevel
      price
      isPublished
      createdAt
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
          maxReattempts
          passingThreshold
          estimatedDuration
          difficulty
          isPublished
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

export const WAVE_PLAYER_QUERY = `
  query WavePlayer($id: ID!) {
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
      myProgress {
        status
        attemptsCount
        highestScore
        completedAt
        lastAttemptedAt
      }
      lesson {
        id
        title
        course {
          id
          title
        }
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

export const PROGRESS_QUERY = `
  query Progress($courseId: ID!) {
    progress(courseId: $courseId) {
      lesson {
        id
        title
        sequenceOrder
      }
      completedWaves
      totalWaves
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
