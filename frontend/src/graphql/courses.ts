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

export const PUBLISH_COURSE_MUTATION = `
  mutation PublishCourse($id: ID!) {
    publishCourse(id: $id) {
      id
      title
      isPublished
    }
  }
` as const;
