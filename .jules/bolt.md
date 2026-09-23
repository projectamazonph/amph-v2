# Bolt Performance Journal

## 2026-07-16 - [O(N*M) Nested Loop Lookups in Grading Engines]
**Learning:** In interactive scenarios (such as Bid Elevator and STR Triage), grading engines frequently iterate over user decisions and match them against scenario properties (like keywords or search terms). Performing `array.find()` inside loop bodies or filter predicates results in costly O(N*M) lookups.
**Action:** Convert arrays to `Map` lookups before entering loops/nested scans. Mapping keys once in O(M) time enables O(1) lookups during execution, transforming the time complexity of the grading logic to O(N + M).

## 2026-07-17 - [Redundant DB Roundtrips during Badge Evaluation]
**Learning:** Badge evaluation loops through all published badges to verify criteria (completed modules, streak days, XP thresholds, etc.). Evaluating each badge's criteria independently triggers $O(R)$ database roundtrips for identical records (such as fetching user details or lesson counts multiple times), creating a query bottleneck during evaluation.
**Action:** Use a short-lived request-scoped `EvaluationCache` to cache and share database query promises across criteria checks during a single run, safely collapsing database queries from $O(R)$ to $O(1)$.
