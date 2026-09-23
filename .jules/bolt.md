# Bolt Performance Journal

## 2026-07-16 - [O(N*M) Nested Loop Lookups in Grading Engines]
**Learning:** In interactive scenarios (such as Bid Elevator and STR Triage), grading engines frequently iterate over user decisions and match them against scenario properties (like keywords or search terms). Performing `array.find()` inside loop bodies or filter predicates results in costly O(N*M) lookups.
**Action:** Convert arrays to `Map` lookups before entering loops/nested scans. Mapping keys once in O(M) time enables O(1) lookups during execution, transforming the time complexity of the grading logic to O(N + M).

## 2026-07-20 - [Scoping Lesson Progress Queries to Visible Lessons]
**Learning:** When loading the user's lesson progress on general dashboard pages (e.g., Courses Catalog, Student Dashboard, or Certificate pending lists), querying `db.lessonProgress` without filtering `lessonId` causes the database to scan and return the entire student's progress history across all courses. As courses and lesson count scale, this results in bloated database payloads and high memory/CPU usage.
**Action:** Always extract the list of visible lesson IDs first and use `lessonId: { in: lessonIds }` to scope the database queries. This keeps query results lightweight and bounded.
