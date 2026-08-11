# Bolt Performance Journal

## 2026-07-16 - [O(N*M) Nested Loop Lookups in Grading Engines]
**Learning:** In interactive scenarios (such as Bid Elevator and STR Triage), grading engines frequently iterate over user decisions and match them against scenario properties (like keywords or search terms). Performing `array.find()` inside loop bodies or filter predicates results in costly O(N*M) lookups.
**Action:** Convert arrays to `Map` lookups before entering loops/nested scans. Mapping keys once in O(M) time enables O(1) lookups during execution, transforming the time complexity of the grading logic to O(N + M).

## 2026-07-17 - [Redundant Database Queries in Badge Rule Evaluators]
**Learning:** Evaluators checking multiple rules (such as `checkCriteria` in the badge engine) generate redundant, separate database queries for identical user records or resource aggregates (like lesson complete count and tool session count) as they loop over each rule.
**Action:** Cache the database query promises (not just resolved values) inside a transient `EvaluationCache` class instantiated once per evaluation request. This collapses database roundtrips from O(R) to O(1) where R is the number of rules, avoiding any database bottleneck on complex rule sets.
