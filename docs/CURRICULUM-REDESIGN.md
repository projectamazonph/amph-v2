# Curriculum Redesign. From PPC Theory to Client-Ready Work

## Design rule

Every unit must help a learner do one of four things for a client:

1. prepare a safe account or campaign decision;
2. make the decision using evidence;
3. explain the decision in plain English;
4. leave a clean record another team member can use.

The audience is a Filipino aspiring VA. Assume a learner has a smartphone, intermittent time, no seller account, and limited confidence with US e-commerce language. Do not assume they have access to Brand Analytics, an advertising account, or paid research tools. Show the native workflow first. Present paid tools as optional accelerators.

## Course structure

**Status note (2026-07-17):** the tables below describe the structure as actually built in `content/curriculum/modules/` and `scripts/import-amph-content.ts`'s `MODULE_META`, not the original aspirational reorg this document once proposed. Modules 2 and 3, and Modules 5 through 8, are numbered and scoped differently than an earlier draft of this plan had them; content was produced against the numbering below, not the earlier draft. Treat this as the live module map going forward.

### Course 1. PPC Foundations

**Promise:** You can support a safe Sponsored Products launch and explain the numbers behind it.

**Completion evidence:** A listing-readiness checklist, a break-even calculation sheet, a keyword map, and a campaign-build rationale.

| Module | Lessons and activity | Learner can do | Required artifact |
|---|---|---|---|
| 0. Onboarding | What work a PPC VA does, account safety, client briefs, how the course works, console orientation. | Explain the role, request missing information, and work safely in a demo account. | Client-brief intake checklist. |
| 1. PPC Foundations | The Big Six metrics: CPC, CTR, ACoS, TACoS, ROAS, conversion rate, and the decision loop for reading them. | Identify the first question to ask when performance changes. | Profitability and max-CPC sheet. |
| 2. Keyword Research | Search intent, match types (broad, phrase, exact), negative keywords, keyword grouping, research workflow. | Create a mapped target list with a negative plan. | Keyword map. |
| 3. Listing Optimization | Listing and ad relevance signals, listing anatomy (title, bullets, images), A+ Content and Brand Registry. | Decide whether advertising or listing work is the first lever. | Listing-readiness audit. |
| 4. Campaign Architecture | Sponsored Products, Sponsored Brands, and Sponsored Display; campaign structure, bids, budgets, launch QA. | Build and justify a safe campaign structure in the simulator. | Campaign brief and launch QA checklist. |

**Foundation gates:**

- The learner must score at least 80% on the max-CPC calculation checkpoint.
- The learner must submit a keyword map before Campaign Builder unlocks.
- The Campaign Builder result must include a written rationale, not only a score.

### Course 2. Accelerated Mastery

**Promise:** You can perform a structured weekly optimization cycle and report the outcome.

**Completion evidence:** A search-term action log, bid-change plan, budget decision log, and one-page client report.

| Module | Lessons and activity | Learner can do | Required artifact |
|---|---|---|---|
| 5. Portfolio Strategy | Campaign portfolios, budget pacing, seasonal strategy and promo planning. | Protect winners without confusing a portfolio with targeting controls. | Budget decision log. |
| 6. Bidding Lab | Maximum CPC, bid strategy, placement adjustment math, bid changes, minimum-data rules, change logs. | Change a bid safely and explain the expected trade-off. | Bid-change plan. |
| 7. Search Term Triage | Read a search-term report, decide keep, harvest, lower bid, negate exact, negate phrase, or watch. | Take a defensible action without deleting valuable traffic. | STR action log. |
| 8. Competitive Intelligence | Brand Analytics, share of voice, competitor benchmarking. | Turn competitor data into a specific campaign adjustment. | Competitor gap-analysis worksheet. |

**Not yet built:** a Reporting and Diagnostic Framework module (weekly cadence, root-cause tree, client language, escalation rules, one-page client report) was in an earlier draft of this plan and still belongs in Course 2, but no module directory or content exists for it yet. It would need its own number (9, or a renumbering of Module 8) decided at build time, not guessed here.

**Mastery gates:**

- Pass a timed STR scenario with an explanation for each action.
- Submit a report that states the result, cause, action, risk, and next check date.
- Complete a diagnostic scenario that requires the learner to choose whether the problem is traffic, conversion, budget, or measurement.

### Course 3. Ultimate Transformation (not yet built)

**Promise:** You can present a small Amazon PPC account plan and operate like a dependable junior PPC specialist.

**Completion evidence:** A review-ready portfolio, a recorded walkthrough, a client handover, and an interview-ready story.

None of this course's modules have content or module directories yet (Release 3, per `docs/CURRICULUM-REDESIGN.md`'s production order below). Final module numbers depend on where Course 2 lands once the Reporting/Diagnostic Framework question above is resolved, so the table below intentionally omits fixed numbers.

| Module (unnumbered) | Lessons and activity | Learner can do | Required artifact |
|---|---|---|---|
| Client Operations and Communication | Client intake, naming rules, task ownership, change logs, escalation, meeting notes, concise business English. | Communicate clearly and protect the account. | Client update, escalation, and change-log samples. |
| Audit to 30-Day Plan | Account audit, prioritization, opportunity sizing, launch versus mature account strategy, risks. | Produce a plan instead of a list of random optimizations. | Audit summary and 30-day plan. |
| Portfolio Capstone | Diagnose a simulated account, build a recommendation, execute tool tasks, report results, record a walkthrough. | Defend a recommendation to a reviewer. | Final portfolio bundle and five-minute walkthrough. |
| Getting Hired and Handover | Resume proof, case-study formatting, interview answers, discovery call, first-week checklist. | Show evidence of skill without exaggeration. | Portfolio page and interview answer bank. |

## The diagnostic framework

Make this the backbone of all advanced content. Learners should never begin with "increase bids" because that is what they remember.

| Signal | First question | Likely levers | Do not do first |
|---|---|---|---|
| Low impressions | Is the campaign eligible, in stock, funded, and relevant to enough targets? | Eligibility, targeting coverage, bid, budget, listing retail readiness. | Raise every bid. |
| High impressions, low CTR | Does the search intent match the product and does the listing win the click? | Target refinement, negatives, image, price, title, featured offer. | Declare the campaign broken from one day of data. |
| Clicks, low conversion | Is the listing ready and is traffic qualified? | Listing, price, reviews, target specificity, product fit. | Lower bids without checking conversion. |
| Sales, high ACoS | Is CPC too high, CVR too low, or is the goal intentionally aggressive? | Max CPC, bid, placement, listing, objective, search-term action. | Negate a term that converts without checking its role. |
| Campaign stops early | Is the budget the constraint, and are missed hours valuable? | Reallocation, budget, budget rules, low-value spend removal. | Increase budget before checking waste. |
| Reporting changed after the fact | Is this attribution lag or restatement? | Confirm window, wait for maturity, annotate report. | Treat incomplete attribution as a performance crash. |

## Assessment model

### Use an evidence ladder

| Level | What is checked | Example |
|---|---|---|
| Recall | The learner recognizes a term. | Multiple-choice ACoS formula. |
| Calculation | The learner computes a number correctly. | Calculate max CPC. |
| Decision | The learner chooses an action from data. | Reduce, hold, harvest, or negate a search term. |
| Explanation | The learner explains why in client language. | "We lowered this bid becauseâ€¦" |
| Delivery | The learner creates reusable professional work. | Weekly report plus change log. |

Keep multiple-choice quizzes for recall. Certification must require the last three levels.

### Rubric for every practical artifact

- **Accuracy, 40%:** correct formulas, sound assumptions, current product rules.
- **Judgment, 30%:** action matches objective, evidence, and risk.
- **Clarity, 20%:** another person can understand the decision in under one minute.
- **Operational hygiene, 10%:** naming, dates, owner, and next review are present.

## Lesson production standard

Every production lesson must include the following blocks in this order.

1. **Client outcome.** "After this lesson, you canâ€¦"
2. **Decision card.** One sentence about when to use the skill.
3. **Video or annotated visual.** Four to seven minutes maximum.
4. **Core method.** One formula, framework, or workflow.
5. **Worked case.** Use a product, objective, and numbers.
6. **Your turn.** The learner makes a decision before seeing feedback.
7. **Tool or worksheet.** The learner produces something.
8. **Client language.** Two sentences they can adapt for a client update.
9. **Check.** Five to eight questions or a scored scenario.
10. **Fact card.** Required for Amazon Ads product behaviour and changing policies.

## Content templates

### Fact card

```text
Product or feature:
What the learner can do:
Who can access it:
Retailer or marketplace scope:
Official source URL:
Last verified:
Next review due:
Owner:
```

### Client decision note

```text
Signal:
What we found:
Decision:
Why this is the safest next step:
Risk or condition:
Next review date:
Owner:
```

### Weekly report, one page

```text
This week in one sentence:
What moved:
Why it moved:
What we changed:
What we will watch next:
What we need from the client:
```

## Production order

Status as of 2026-07-17: steps 1-3 below are complete (see `docs/CONTENT-AUDIT-2026-07-16.md` and `docs/CONTENT-AUDIT-MODULES-2-8.md` for what was fixed and PRs #31-#32 for the work itself). Steps 4-5 are Release 3 and haven't started.

1. ~~Fix and rebuild Module 0 so it matches v2 and sets realistic expectations.~~ Done.
2. ~~Rewrite Module 1 using the new standard. Use the Big Six lesson as the model.~~ Done.
3. ~~Retire or rewrite the legacy portfolio, attribution, auction, quality-score, and dayparting claims across Modules 2-8, and bring every lesson up to the voice guide and lesson-production standard.~~ Done.
4. Build the Reporting and Diagnostic Framework module referenced under Course 2 above, deciding its final module number at that point.
5. Add the Course 3 (Ultimate Transformation) modules and the human-review capstone, numbering them once step 4 has landed.
