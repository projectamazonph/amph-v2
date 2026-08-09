# Bolt Performance Journal

## 2026-07-16 - [O(N*M) Nested Loop Lookups in Grading Engines]
**Learning:** In interactive scenarios (such as Bid Elevator and STR Triage), grading engines frequently iterate over user decisions and match them against scenario properties (like keywords or search terms). Performing `array.find()` inside loop bodies or filter predicates results in costly O(N*M) lookups.
**Action:** Convert arrays to `Map` lookups before entering loops/nested scans. Mapping keys once in O(M) time enables O(1) lookups during execution, transforming the time complexity of the grading logic to O(N + M).

## 2026-07-17 - [N+1 DB Queries in Sequential Rules Evaluation]
**Learning:** Sequential evaluation of rules or criteria checks (such as checking badge conditions like module completion, streak days, and XP totals inside loop blocks) can lead to an N+1 query pattern where the database is repeatedly queried for identical aggregate values or user profile fields. Sharing or caching the query promises rather than resolved values via a transient cache during the evaluation lifecycle collapses duplicate roundtrips from O(R) to O(1), where R is the number of rules.
**Action:** Utilize a transient context-bound cache containing query promises (e.g., `EvaluationCache`) for evaluations involving multi-rule DB lookups.
