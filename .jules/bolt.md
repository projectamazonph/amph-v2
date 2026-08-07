# Bolt Performance Journal

## 2026-07-16 - [O(N*M) Nested Loop Lookups in Grading Engines]
**Learning:** In interactive scenarios (such as Bid Elevator and STR Triage), grading engines frequently iterate over user decisions and match them against scenario properties (like keywords or search terms). Performing `array.find()` inside loop bodies or filter predicates results in costly O(N*M) lookups.
**Action:** Convert arrays to `Map` lookups before entering loops/nested scans. Mapping keys once in O(M) time enables O(1) lookups during execution, transforming the time complexity of the grading logic to O(N + M).

## 2026-08-07 - [Collapsing Duplicate DB Queries in Sequential Loops]
**Learning:** Evaluators checking multiple rules (such as `checkCriteria` in the badge engine) can generate redundant database queries for identical user records or resource aggregates when looping over each rule. These can be optimized with a transient local cache (caching query promises rather than resolved values) during the evaluation lifecycle.
**Action:** Use a transient, local `EvaluationCache` to cache query promises, safely collapsing database roundtrips from O(R) to O(1) where R is the number of rules checked.
