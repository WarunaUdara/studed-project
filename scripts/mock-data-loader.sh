#!/usr/bin/env bash
set -eu

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GATEWAY="${STUDED_API_URL:-http://localhost:8080}"
EDUCATOR_JAR="${REPO_ROOT}/.mock-educator-cookies"
STUDENT_JAR="${REPO_ROOT}/.mock-student-cookies"

# Resolve the Postgres host connection for role promotion. docker-compose maps
# the DB to 127.0.0.1:5433 (see docker-compose.yml); the provision script needs
# a reachable URL or it silently skips promotion, leaving educator accounts as
# STUDENT and hiding all educator-only UI.
default_db_url() {
  if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^studed-postgres$'; then
    echo "postgres://studed:studed@127.0.0.1:5433/studed?sslmode=disable"
  else
    echo "postgres://studed:studed@localhost:5432/studed?sslmode=disable"
  fi
}

wait_for_gateway() {
  echo "[mock] waiting for API gateway at ${GATEWAY}..."
  for _ in {1..60}; do
    if curl -sf "${GATEWAY}/health" >/dev/null 2>&1; then
      echo "[mock] API gateway is ready"
      return 0
    fi
    sleep 1
  done
  echo "[mock] API gateway did not become ready in time"
  exit 1
}

graphql() {
  local jar="$1"
  local query="$2"
  local variables="${3:-"{}"}"
  jq -n \
    --arg query "${query}" \
    --argjson variables "${variables}" \
    '{query: $query, variables: $variables}' \
    | curl -s -b "${jar}" -c "${jar}" \
      -H "Content-Type: application/json" \
      -d @- \
      "${GATEWAY}/graphql"
}

register_or_login() {
  local jar="$1"
  local email="$2"
  local password="$3"
  local full_name="$4"
  local role="$5"
  local grade="${6:-}"

  local grade_field=""
  if [ -n "${grade}" ]; then
    grade_field=",\"grade\":\"${grade}\""
  fi

  local response
  response=$(graphql "${jar}" \
    'mutation Register($input: RegisterInput!) { register(input: $input) { user { id email role } } }' \
    "{\"input\":{\"email\":\"${email}\",\"password\":\"${password}\",\"fullName\":\"${full_name}\"${grade_field},\"preferredLanguage\":\"en\"}}")

  if echo "${response}" | jq -e '.errors' >/dev/null 2>&1; then
    response=$(graphql "${jar}" \
      'mutation Login($input: LoginInput!) { login(input: $input) { user { id email role } } }' \
      "{\"input\":{\"email\":\"${email}\",\"password\":\"${password}\"}}")
  fi

  if echo "${response}" | jq -e '.errors' >/dev/null 2>&1; then
    echo "[mock] failed to authenticate ${email}:"
    echo "${response}" | jq .
    exit 1
  fi

  local user_id
  user_id=$(echo "${response}" | jq -r '.data.register.user.id // .data.login.user.id')
  local registered_role
  registered_role=$(echo "${response}" | jq -r '.data.register.user.role // .data.login.user.role')

  # Public registration is locked to STUDENT. If the seed requested an elevated
  # role and the account was freshly created, promote it via direct DB access
  # (operator credential). Existing accounts keep whatever role they have.
  local db_conn="${STUDED_DATABASE_URL:-${DATABASE_CONNECTION_STRING:-${DATABASE_URL:-$(default_db_url)}}}"
  if [ -n "${role}" ] && [ "${role}" != "STUDENT" ] && [ "${registered_role}" != "${role}" ] && [ -n "${db_conn}" ]; then
    echo "[mock] promoting ${email} to ${role} via provision-educator.sh"
    STUDED_DATABASE_URL="${db_conn}" "${REPO_ROOT}/scripts/provision-educator.sh" "${email}" "${role}"

    # The gateway authorizes by the role claim baked into the JWT at login time,
    # not by the DB row, so re-login after promotion to mint a token carrying the
    # elevated role (otherwise educator-only mutations fail with 403).
    response=$(graphql "${jar}" \
      'mutation Login($input: LoginInput!) { login(input: $input) { user { id email role } } }' \
      "{\"input\":{\"email\":\"${email}\",\"password\":\"${password}\"}}")
    if echo "${response}" | jq -e '.errors' >/dev/null 2>&1; then
      echo "[mock] failed to refresh ${email} session after promotion:"
      echo "${response}" | jq .
      exit 1
    fi
    user_id=$(echo "${response}" | jq -r '.data.login.user.id')
  fi

  echo "${user_id}"
}

find_course_by_slug() {
  local jar="$1"
  local slug="$2"

  graphql "${jar}" \
    'query Courses($filter: CourseFilter, $pagination: PaginationInput) { courses(filter: $filter, pagination: $pagination) { edges { node { id slug title } } } }' \
    '{"filter":{},"pagination":{"first":100}}' \
    | jq -r --arg slug "${slug}" '.data.courses.edges[]? | select(.node.slug == $slug) | .node.id' \
    | head -n1
}

create_course() {
  local jar="$1"
  local title="$2"
  local slug="$3"
  local grade="$4"

  local existing_id
  existing_id=$(find_course_by_slug "${jar}" "${slug}")
  if [ -n "${existing_id}" ]; then
    echo "${existing_id}"
    return 0
  fi

  local response
  response=$(graphql "${jar}" \
    'mutation CreateCourse($input: CreateCourseInput!) { createCourse(input: $input) { id title slug gradeLevel isPublished } }' \
    "{\"input\":{\"title\":\"${title}\",\"description\":\"Mock course: ${title}\",\"slug\":\"${slug}\",\"gradeLevel\":\"${grade}\",\"price\":0}}")

  if echo "${response}" | jq -e '.errors' >/dev/null 2>&1; then
    echo "[mock] failed to create course ${title}:"
    echo "${response}" | jq .
    exit 1
  fi

  echo "${response}" | jq -r '.data.createCourse.id'
}

publish_course() {
  local jar="$1"
  local course_id="$2"

  graphql "${jar}" \
    'mutation PublishCourse($id: ID!) { publishCourse(id: $id) { id isPublished } }' \
    "{\"id\":\"${course_id}\"}" >/dev/null
}

publish_lesson() {
  local jar="$1"
  local lesson_id="$2"

  graphql "${jar}" \
    'mutation PublishLesson($id: ID!) { publishLesson(id: $id) { id isPublished } }' \
    "{\"id\":\"${lesson_id}\"}" >/dev/null
}

publish_wave() {
  local jar="$1"
  local wave_id="$2"

  graphql "${jar}" \
    'mutation PublishWave($id: ID!) { publishWave(id: $id) { id isPublished } }' \
    "{\"id\":\"${wave_id}\"}" >/dev/null
}

find_lesson_by_title() {
  local jar="$1"
  local course_id="$2"
  local title="$3"

  graphql "${jar}" \
    'query Course($id: ID!) { course(id: $id) { lessons { id title } } }' \
    "{\"id\":\"${course_id}\"}" \
    | jq -r --arg title "${title}" '.data.course.lessons[]? | select(.title == $title) | .id' \
    | head -n1
}

create_lesson() {
  local jar="$1"
  local course_id="$2"
  local title="$3"
  local sequence="$4"

  local existing_id
  existing_id=$(find_lesson_by_title "${jar}" "${course_id}" "${title}")
  if [ -n "${existing_id}" ]; then
    echo "${existing_id}"
    return 0
  fi

  local response
  response=$(graphql "${jar}" \
    'mutation CreateLesson($courseId: ID!, $input: CreateLessonInput!) { createLesson(courseId: $courseId, input: $input) { id title sequenceOrder } }' \
    "{\"courseId\":\"${course_id}\",\"input\":{\"title\":\"${title}\",\"sequenceOrder\":${sequence}}}")

  if echo "${response}" | jq -e '.errors' >/dev/null 2>&1; then
    echo "[mock] failed to create lesson ${title}:"
    echo "${response}" | jq .
    exit 1
  fi

  echo "${response}" | jq -r '.data.createLesson.id'
}

find_wave_by_title() {
  local jar="$1"
  local lesson_id="$2"
  local title="$3"

  graphql "${jar}" \
    'query Lesson($id: ID!) { lesson(id: $id) { waves { id title } } }' \
    "{\"id\":\"${lesson_id}\"}" \
    | jq -r --arg title "${title}" '.data.lesson.waves[]? | select(.title == $title) | .id' \
    | head -n1
}

create_wave() {
  local jar="$1"
  local lesson_id="$2"
  local title="$3"
  local sequence="$4"
  local question="$5"
  local correct="$6"

  local existing_id
  existing_id=$(find_wave_by_title "${jar}" "${lesson_id}" "${title}")
  if [ -n "${existing_id}" ]; then
    echo "${existing_id}"
    return 0
  fi

  local response
  response=$(graphql "${jar}" \
    'mutation CreateWave($lessonId: ID!, $input: CreateWaveInput!) { createWave(lessonId: $lessonId, input: $input) { id title sequenceOrder learnBlocks { id type content } evaluateBlocks { id type question options correctAnswer } } }' \
    "{\"lessonId\":\"${lesson_id}\",\"input\":{\"title\":\"${title}\",\"sequenceOrder\":${sequence},\"xpReward\":100,\"maxReattempts\":3,\"passingThreshold\":50,\"estimatedDuration\":10,\"difficulty\":\"MEDIUM\",\"learnBlocks\":[{\"id\":\"lb1\",\"type\":\"text\",\"content\":\"This is a mock learn block for ${title}.\"}],\"evaluateBlocks\":[{\"id\":\"eb1\",\"type\":\"multiple_choice\",\"question\":\"${question}\",\"options\":[\"${correct}\",\"Wrong A\",\"Wrong B\"],\"correctAnswer\":\"${correct}\",\"explanation\":\"Correct!\"}]}}")

  if echo "${response}" | jq -e '.errors' >/dev/null 2>&1; then
    echo "[mock] failed to create wave ${title}:"
    echo "${response}" | jq .
    exit 1
  fi

  echo "${response}" | jq -r '.data.createWave.id'
}

enroll() {
  local jar="$1"
  local course_id="$2"

  graphql "${jar}" \
    'mutation EnrollInCourse($courseId: ID!) { enrollInCourse(courseId: $courseId) { id title } }' \
    "{\"courseId\":\"${course_id}\"}" >/dev/null
}

grant_subscription() {
  local jar="$1"
  local tier="${2:-STANDARD}"

  graphql "${jar}" \
    'mutation CreateSubscription($input: CreateSubscriptionInput!) { createSubscription(input: $input) { id tier status endDate } }' \
    "{\"input\":{\"tier\":\"${tier}\"}}" >/dev/null
}

submit_answer() {
  local jar="$1"
  local wave_id="$2"
  local block_id="$3"
  local answer="$4"

  graphql "${jar}" \
    'mutation SubmitWaveAnswers($waveId: ID!, $answers: [AnswerInput!]!) { submitWaveAnswers(waveId: $waveId, answers: $answers) { score xpEarned totalXp passed } }' \
    "{\"waveId\":\"${wave_id}\",\"answers\":[{\"evaluateBlockId\":\"${block_id}\",\"answer\":\"${answer}\"}]}" >/dev/null
}

main() {
  rm -f "${EDUCATOR_JAR}" "${STUDENT_JAR}"
  wait_for_gateway

  echo "[mock] creating educator..."
  register_or_login "${EDUCATOR_JAR}" "demo.educator@studed.lk" "password1234" "Demo Educator" "EDUCATOR" ""

  echo "[mock] creating student..."
  register_or_login "${STUDENT_JAR}" "demo.student@studed.lk" "password1234" "Demo Student" "STUDENT" "G10"

  echo "[mock] creating courses, lessons and waves..."

  local course_id lesson_id wave_id
  local science_id math_id python_id coord_geom_id

  course_id=$(create_course "${EDUCATOR_JAR}" "Grade 10 Science" "g10-science" "G10")
  science_id="${course_id}"
  lesson_id=$(create_lesson "${EDUCATOR_JAR}" "${course_id}" "Introduction to Biology" 1)
  publish_lesson "${EDUCATOR_JAR}" "${lesson_id}"
  wave_id=$(create_wave "${EDUCATOR_JAR}" "${lesson_id}" "Cell Structure" 1 "What is the powerhouse of the cell?" "Mitochondria")
  publish_wave "${EDUCATOR_JAR}" "${wave_id}"
  publish_course "${EDUCATOR_JAR}" "${course_id}"
  echo "[mock] published G10 Science"

  course_id=$(create_course "${EDUCATOR_JAR}" "Grade 10 Mathematics" "g10-mathematics" "G10")
  math_id="${course_id}"
  lesson_id=$(create_lesson "${EDUCATOR_JAR}" "${course_id}" "Algebra Basics" 1)
  publish_lesson "${EDUCATOR_JAR}" "${lesson_id}"
  wave_id=$(create_wave "${EDUCATOR_JAR}" "${lesson_id}" "Linear Equations" 1 "What is the value of x in 2x = 4?" "2")
  publish_wave "${EDUCATOR_JAR}" "${wave_id}"
  publish_course "${EDUCATOR_JAR}" "${course_id}"
  echo "[mock] published G10 Mathematics"

  course_id=$(create_course "${EDUCATOR_JAR}" "O/L English" "ol-english" "OL")
  lesson_id=$(create_lesson "${EDUCATOR_JAR}" "${course_id}" "Grammar Fundamentals" 1)
  publish_lesson "${EDUCATOR_JAR}" "${lesson_id}"
  wave_id=$(create_wave "${EDUCATOR_JAR}" "${lesson_id}" "Tenses" 1 "Which tense describes an action happening now?" "Present continuous")
  publish_wave "${EDUCATOR_JAR}" "${wave_id}"
  publish_course "${EDUCATOR_JAR}" "${course_id}"
  echo "[mock] published O/L English"

  course_id=$(create_course "${EDUCATOR_JAR}" "A/L Physics" "al-physics" "AL")
  lesson_id=$(create_lesson "${EDUCATOR_JAR}" "${course_id}" "Mechanics" 1)
  publish_lesson "${EDUCATOR_JAR}" "${lesson_id}"
  wave_id=$(create_wave "${EDUCATOR_JAR}" "${lesson_id}" "Newton's Laws" 1 "What is Newton's first law also known as?" "Law of inertia")
  publish_wave "${EDUCATOR_JAR}" "${wave_id}"
  publish_course "${EDUCATOR_JAR}" "${course_id}"
  echo "[mock] published A/L Physics"

  # Thinking in Python and Coordinate Geometry are defined declaratively in
  # content/courses/ and synced by the content-sync CLI (see content/README.md).
  echo "[mock] syncing declarative course manifests..."
  STUDED_API_URL="${GATEWAY}" bun run scripts/content-sync/src/index.ts --cookie-jar "${EDUCATOR_JAR}"
  python_id=$(find_course_by_slug "${EDUCATOR_JAR}" "thinking-in-python")
  coord_geom_id=$(find_course_by_slug "${EDUCATOR_JAR}" "coordinate-geometry")
  echo "[mock] synced Thinking in Python + Coordinate Geometry"

  echo "[mock] enrolling student and completing a wave..."
  grant_subscription "${STUDENT_JAR}" "STANDARD"
  enroll "${STUDENT_JAR}" "${science_id}"
  enroll "${STUDENT_JAR}" "${math_id}"
  if [ -n "${python_id}" ]; then enroll "${STUDENT_JAR}" "${python_id}"; fi
  if [ -n "${coord_geom_id}" ]; then enroll "${STUDENT_JAR}" "${coord_geom_id}"; fi

  local wave_info wave_id_to_submit block_id_to_submit
  wave_info=$(graphql "${STUDENT_JAR}" \
    'query Course($id: ID!) { course(id: $id) { lessons { waves { id evaluateBlocks { id correctAnswer } } } } }' \
    "{\"id\":\"${science_id}\"}")
  wave_id_to_submit=$(echo "${wave_info}" | jq -r '.data.course.lessons[0].waves[0].id')
  block_id_to_submit=$(echo "${wave_info}" | jq -r '.data.course.lessons[0].waves[0].evaluateBlocks[0].id')
  local correct_answer
  correct_answer=$(echo "${wave_info}" | jq -r '.data.course.lessons[0].waves[0].evaluateBlocks[0].correctAnswer')

  submit_answer "${STUDENT_JAR}" "${wave_id_to_submit}" "${block_id_to_submit}" "${correct_answer}"

  echo "[mock] done"
  echo ""
  echo "Demo accounts:"
  echo "  educator: demo.educator@studed.lk / password1234"
  echo "  student:  demo.student@studed.lk / password1234"
}

main "$@"
