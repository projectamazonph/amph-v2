# Bolt Performance Journal

## 2026-07-16 - [O(N*M) Nested Loop Lookups in Grading Engines]
**Learning:** In interactive scenarios (such as Bid Elevator and STR Triage), grading engines frequently iterate over user decisions and match them against scenario properties (like keywords or search terms). Performing `array.find()` inside loop bodies or filter predicates results in costly O(N*M) lookups.
**Action:** Convert arrays to `Map` lookups before entering loops/nested scans. Mapping keys once in O(M) time enables O(1) lookups during execution, transforming the time complexity of the grading logic to O(N + M).

## 2026-07-17 - [Querying Unscoped User Lesson Progress History]
**Learning:** Querying a user's entire `lessonProgress` history without scoping to relevant courses or specific lesson IDs fetches redundant records from the database, resulting in unnecessary payloads, high memory consumption, and increased query latency as the student progresses.
**Action:** Extract the specific `lessonIds` of interest (e.g. from current courses/modules being rendered) and filter the progress lookup with `lessonId: { in: lessonIds }`. Avoid fetching the entire table by always scoping user-specific queries.
