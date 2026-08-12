# Bolt Performance Journal

## 2026-07-16 - [O(N*M) Nested Loop Lookups in Grading Engines]
**Learning:** In interactive scenarios (such as Bid Elevator and STR Triage), grading engines frequently iterate over user decisions and match them against scenario properties (like keywords or search terms). Performing `array.find()` inside loop bodies or filter predicates results in costly O(N*M) lookups.
**Action:** Convert arrays to `Map` lookups before entering loops/nested scans. Mapping keys once in O(M) time enables O(1) lookups during execution, transforming the time complexity of the grading logic to O(N + M).

## 2026-07-17 - [Query Promise Caching in Badge Rule Evaluation Engine]
**Learning:** When executing multi-rule criteria check loops (such as `evaluateBadges` where multiple rules trigger matching check functions), database lookups for user details or lesson completion counts can easily duplicate database queries, growing linearly O(R) with the number of rules.
**Action:** Use a transient lifecycle-bound `EvaluationCache` that caches and shares database query *promises* (not just resolved values) across evaluation runs. This collapses DB roundtrips to O(1) while preventing race conditions and stale cache values across sessions.
