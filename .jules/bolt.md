# Bolt Performance Journal

## 2026-07-16 - [O(N*M) Nested Loop Lookups in Grading Engines]
**Learning:** In interactive scenarios (such as Bid Elevator and STR Triage), grading engines frequently iterate over user decisions and match them against scenario properties (like keywords or search terms). Performing `array.find()` inside loop bodies or filter predicates results in costly O(N*M) lookups.
**Action:** Convert arrays to `Map` lookups before entering loops/nested scans. Mapping keys once in O(M) time enables O(1) lookups during execution, transforming the time complexity of the grading logic to O(N + M).

## 2026-07-30 - [Scoping User Lesson Progress Queries]
**Learning:** Querying user-specific lesson progress history without a courses or lessons filter fetches the user's entire completion history. As the student completes more lessons, this payload grows unboundedly, increasing database round-trip latency, payload size, and server-side memory consumption.
**Action:** Always extract the relevant lesson IDs first from the courses currently being queried or rendered, and explicitly scope the progress lookup with `lessonId: { in: allLessonIds }`.
