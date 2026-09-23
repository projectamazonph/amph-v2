# Bolt Performance Journal

## 2026-07-16 - [O(N*M) Nested Loop Lookups in Grading Engines]
**Learning:** In interactive scenarios (such as Bid Elevator and STR Triage), grading engines frequently iterate over user decisions and match them against scenario properties (like keywords or search terms). Performing `array.find()` inside loop bodies or filter predicates results in costly O(N*M) lookups.
**Action:** Convert arrays to `Map` lookups before entering loops/nested scans. Mapping keys once in O(M) time enables O(1) lookups during execution, transforming the time complexity of the grading logic to O(N + M).

## 2026-07-17 - [Redundant Database Hits in Badge Rules Loops]
**Learning:** Evaluators checking multiple rules (such as `checkCriteria` in the badge engine) can generate redundant database queries for identical user records or resource aggregates when looping over each rule. Caching query promises rather than resolved values in a transient cache avoids multiple database roundtrips and safely collapses them from O(R) to O(1) where R is the number of rules.
**Action:** Utilize an `EvaluationCache` to cache and share database query promises across criteria checks during the lifecycle of an evaluation call.
