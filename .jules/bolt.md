# Bolt Performance Journal

## 2026-07-16 - [O(N*M) Nested Loop Lookups in Grading Engines]
**Learning:** In interactive scenarios (such as Bid Elevator and STR Triage), grading engines frequently iterate over user decisions and match them against scenario properties (like keywords or search terms). Performing `array.find()` inside loop bodies or filter predicates results in costly O(N*M) lookups.
**Action:** Convert arrays to `Map` lookups before entering loops/nested scans. Mapping keys once in O(M) time enables O(1) lookups during execution, transforming the time complexity of the grading logic to O(N + M).

## 2026-07-25 - [Scoped Lesson Progress Queries]
**Learning:** Fetching a user's entire historical lesson progress across the whole database when rendering individual courses or the main dashboard is extremely inefficient as the database grows, causing high memory usage and large network payloads.
**Action:** Always scope user-specific lesson progress queries using `{ lessonId: { in: lessonIds } }` by first extracting the relevant lesson IDs from the loaded courses.
