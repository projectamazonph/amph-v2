# Bolt Performance Journal

## 2026-07-16 - [O(N*M) Nested Loop Lookups in Grading Engines]
**Learning:** In interactive scenarios (such as Bid Elevator and STR Triage), grading engines frequently iterate over user decisions and match them against scenario properties (like keywords or search terms). Performing `array.find()` inside loop bodies or filter predicates results in costly O(N*M) lookups.
**Action:** Convert arrays to `Map` lookups before entering loops/nested scans. Mapping keys once in O(M) time enables O(1) lookups during execution, transforming the time complexity of the grading logic to O(N + M).

## 2026-07-17 - [Scoping User-Specific Lesson Progress Queries]
**Learning:** Querying all of a user's lesson progress records (which grows continually as they complete lessons across courses) on high-traffic index and dashboard pages causes high memory consumption and large database payloads.
**Action:** Always scope database queries for lesson progress using the specific lesson IDs required for the current view (e.g., `lessonId: { in: lessonIds }`). Short-circuit to an empty array when no lesson IDs are loaded to completely avoid redundant database operations.
