#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GATEWAY="http://localhost:8080"
COOKIE_JAR="${REPO_ROOT}/.integration-test-cookies"

pass_count=0
fail_count=0

pass() {
  echo "  ✅ $1"
  pass_count=$((pass_count + 1))
}

fail() {
  echo "  ❌ $1"
  fail_count=$((fail_count + 1))
}

call_graphql() {
  local query="$1"
  local variables="${2:-{}}"
  curl -s -b "${COOKIE_JAR}" -c "${COOKIE_JAR}" \
    -H "Content-Type: application/json" \
    -d "{\"query\":${query},\"variables\":${variables}}" \
    "${GATEWAY}/graphql"
}

wait_for_gateway() {
  echo "[test] waiting for API gateway..."
  for _ in {1..60}; do
    if curl -sf "${GATEWAY}/health" >/dev/null 2>&1; then
      pass "API gateway health endpoint returns 200"
      return 0
    fi
    sleep 1
  done
  fail "API gateway did not become ready in time"
  return 1
}

test_auth() {
  echo "[test] authentication..."
  rm -f "${COOKIE_JAR}"

  local response
  response=$(call_graphql \
    '"mutation Register($input: RegisterInput!) { register(input: $input) { user { id email role } accessToken } }"' \
    '{"input":{"email":"test-educator@studed.lk","password":"password123","fullName":"Test Educator","role":"EDUCATOR","preferredLanguage":"en"}}')

  if echo "${response}" | jq -e '.data.register.user.role == "EDUCATOR"' >/dev/null 2>&1; then
    pass "educator registration returns EDUCATOR user"
  else
    fail "educator registration failed: $(echo "${response}" | jq -c '.errors')"
  fi
}

test_course_lifecycle() {
  echo "[test] course lifecycle..."

  local slug="integration-test-course"
  local response

  response=$(call_graphql \
    '"query Courses($filter: CourseFilter) { courses(filter: $filter) { edges { node { slug isPublished } } } }"' \
    '{"filter":{"search":"'"${slug}"'"}}')

  if echo "${response}" | jq -e --arg slug "${slug}" '.data.courses.edges[] | select(.node.slug == $slug)' >/dev/null 2>&1; then
    pass "course list query returns existing test course"
    return 0
  fi

  response=$(call_graphql \
    '"mutation CreateCourse($input: CreateCourseInput!) { createCourse(input: $input) { id title slug gradeLevel isPublished } }"' \
    '{"input":{"title":"Integration Test Course","description":"Created by integration test","slug":"'"${slug}"'","gradeLevel":"G10","price":0}}')

  if echo "${response}" | jq -e '.data.createCourse.id' >/dev/null 2>&1; then
    pass "createCourse mutation returns a course id"
  else
    fail "createCourse mutation failed: $(echo "${response}" | jq -c '.errors')"
    return 1
  fi

  local course_id
  course_id=$(echo "${response}" | jq -r '.data.createCourse.id')

  response=$(call_graphql \
    '"mutation PublishCourse($id: ID!) { publishCourse(id: $id) { id isPublished } }"' \
    "{\"id\":\"${course_id}\"}")

  if echo "${response}" | jq -e '.data.publishCourse.isPublished == true' >/dev/null 2>&1; then
    pass "publishCourse mutation marks course as published"
  else
    fail "publishCourse mutation failed: $(echo "${response}" | jq -c '.errors')"
  fi
}

main() {
  wait_for_gateway
  test_auth
  test_course_lifecycle

  echo ""
  echo "[test] results: ${pass_count} passed, ${fail_count} failed"
  rm -f "${COOKIE_JAR}"

  if [ "${fail_count}" -gt 0 ]; then
    exit 1
  fi
}

main "$@"
