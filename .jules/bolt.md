# Bolt Performance Journal

## 2026-07-16 - [O(N*M) Nested Loop Lookups in Grading Engines]
**Learning:** In interactive scenarios (such as Bid Elevator and STR Triage), grading engines frequently iterate over user decisions and match them against scenario properties (like keywords or search terms). Performing `array.find()` inside loop bodies or filter predicates results in costly O(N*M) lookups.
**Action:** Convert arrays to `Map` lookups before entering loops/nested scans. Mapping keys once in O(M) time enables O(1) lookups during execution, transforming the time complexity of the grading logic to O(N + M).

## 2026-07-17 - [O(N*M) Nested Loop Lookups in Listing Audit grading]
**Learning:** In the Listing Audit grading engine, both findingsAccuracy and severityCalibration iterated over student findings and performed an `array.find()` lookup against reference findings, leading to O(N*M) operations.
**Action:** Convert the reference findings array into a Map, matching keys once in O(M) time, to enable O(1) lookups inside the loop, achieving O(N+M) time complexity.
