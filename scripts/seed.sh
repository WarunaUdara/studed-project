#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GATEWAY="http://localhost:8080"
COOKIE_JAR="${REPO_ROOT}/.seed-cookies"

wait_for_gateway() {
  echo "[seed] waiting for API gateway at ${GATEWAY}..."
  for _ in {1..60}; do
    if curl -sf "${GATEWAY}/health" >/dev/null 2>&1; then
      echo "[seed] API gateway is ready"
      return 0
    fi
    sleep 1
  done
  echo "[seed] API gateway did not become ready in time"
  return 1
}

call_graphql() {
  local query="$1"
  local variables="${2:-{}}"
  curl -s -b "${COOKIE_JAR}" -c "${COOKIE_JAR}" \
    -H "Content-Type: application/json" \
    -d "{\"query\":${query},\"variables\":${variables}}" \
    "${GATEWAY}/graphql"
}

register_or_login() {
  local email="$1"
  local password="$2"
  local full_name="$3"
  local role="$4"

  echo "[seed] registering ${email} as ${role}..."
  local response
  response=$(call_graphql \
    '"mutation Register($input: RegisterInput!) { register(input: $input) { user { id email role } } }"' \
    "{\"input\":{\"email\":\"${email}\",\"password\":\"${password}\",\"fullName\":\"${full_name}\",\"role\":\"${role}\",\"preferredLanguage\":\"en\"}}")

  if echo "${response}" | jq -e '.errors' >/dev/null 2>&1; then
    echo "[seed] registration failed (may already exist), trying login..."
    response=$(call_graphql \
      '"mutation Login($input: LoginInput!) { login(input: $input) { user { id email role } } }"' \
      "{\"input\":{\"email\":\"${email}\",\"password\":\"${password}\"}}")
  fi

  if echo "${response}" | jq -e '.errors' >/dev/null 2>&1; then
    echo "[seed] failed to authenticate ${email}:"
    echo "${response}" | jq .
    return 1
  fi

  echo "[seed] authenticated ${email}"
  echo "${response}" | jq -r '.data.register.user.id // .data.login.user.id'
}

course_exists() {
  local slug="$1"
  local response
  response=$(call_graphql \
    '"query Courses($filter: CourseFilter) { courses(filter: $filter) { edges { node { slug } } } }"' \
    "{\"filter\":{\"search\":\"${slug}\"}}")

  echo "${response}" | jq -e --arg slug "${slug}" '.data.courses.edges[] | select(.node.slug == $slug)' >/dev/null 2>&1
}

create_course() {
  local title="$1"
  local slug="$2"
  local grade="$3"

  if course_exists "${slug}"; then
    echo "[seed] course '${title}' already exists, skipping"
    return 0
  fi

  echo "[seed] creating course '${title}'..."
  local response
  response=$(call_graphql \
    '"mutation CreateCourse($input: CreateCourseInput!) { createCourse(input: $input) { id title slug gradeLevel isPublished } }"' \
    "{\"input\":{\"title\":\"${title}\",\"description\":\"Demo course created by seed script\",\"slug\":\"${slug}\",\"gradeLevel\":\"${grade}\",\"price\":0}}")

  if echo "${response}" | jq -e '.errors' >/dev/null 2>&1; then
    echo "[seed] failed to create course:"
    echo "${response}" | jq .
    return 1
  fi

  echo "[seed] created course:"
  echo "${response}" | jq '.data.createCourse'
}

main() {
  rm -f "${COOKIE_JAR}"
  wait_for_gateway

  register_or_login "educator@studed.lk" "password123" "Demo Educator" "EDUCATOR"
  create_course "Demo Science" "demo-science" "G10"

  echo "[seed] done"
}

main "$@"
