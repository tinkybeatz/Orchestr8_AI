# STANDARD: AGILE BACKLOG MANAGEMENT

- Status: Active
- Version: 1.1.0
- Owner: Product Management
- Approvers: Engineering Manager, Tech Lead, QA Lead
- Effective date: 2026-02-24
- Last review date: 2026-02-24

## 1) Purpose

Define a single, evidence-based standard for creating, structuring, prioritizing, and maintaining a product backlog in an Agile software project.

Primary outcomes:

- maximize delivered value
- keep backlog transparent and actionable
- reduce planning noise and delivery churn

This standard aligns with Agile values and Scrum guidance on value, empiricism, and Product Backlog management. [SRC-001] [SRC-002]

## 2) Scope

Applies to:

- all product and engineering teams maintaining a shared backlog
- all backlog item types: epics, features, user stories, bugs, enablers, spikes
- all planning horizons: now, next, later

Does not replace:

- team-level engineering implementation conventions
- security or compliance standards

## 3) Normative Language

- `MUST`: mandatory requirement
- `MUST NOT`: forbidden practice
- `SHOULD`: recommended unless justified exception
- `MAY`: optional practice

## 4) Agile Backlog Principles

1. The backlog MUST remain an ordered, evolving list of work needed to improve the product. [SRC-002]
2. Backlog decisions MUST prioritize value and outcomes over output volume. [SRC-001] [SRC-007]
3. Refinement MUST be continuous and collaborative, not a one-time phase. [SRC-002] [SRC-003]
4. Backlog items SHOULD meet quality heuristics (INVEST for stories, DEEP for backlog health). [SRC-004] [SRC-005]

## 5) Roles and Accountability

### Product Owner

- MUST be accountable for maximizing product value.
- MUST own Product Backlog ordering.
- MUST ensure backlog is transparent and understood.

These accountabilities are non-delegable in ownership, even when execution support exists. [SRC-002]

### Developers / Engineering Team

- MUST contribute to refinement, sizing, and feasibility assessment.
- MUST flag dependency, risk, and technical ambiguity before sprint commitment.

### Stakeholders

- SHOULD provide evidence and context for requests.
- MUST NOT bypass backlog governance with direct untracked commitments.

## 6) Backlog Structure Standard

The backlog MUST be organized across three horizons:

1. `Now` (ready for next 1-2 sprints)
2. `Next` (candidate work, partially refined)
3. `Later` (opportunities requiring discovery)

The backlog MUST keep one explicit `Product Goal` reference to guide ordering decisions. [SRC-002]

Each item MUST belong to one of these types:

- `Feature`
- `User Story`
- `Bug`
- `Enabler`
- `Spike`

`Epic` MAY be used as a grouping container, but MUST NOT be committed directly to a sprint.

## 7) Mandatory Item Template

Every sprint-candidate item MUST include:

- unique ID
- concise title
- problem statement / user value
- acceptance criteria
- links to evidence (qualitative/quantitative)
- estimate (relative size or effort band)
- dependencies / constraints
- risk notes
- owner
- target horizon (`Now`/`Next`/`Later`)
- release-readiness gate definition (required checks/commands)
- release evidence expectations and go/no-go decision owner [SRC-008]

For user stories, teams SHOULD use INVEST as a quality check before commitment. [SRC-004]

## 8) Definition of Ready for Sprint Candidates

An item is `Ready` only if all conditions are met:

1. value and objective are explicit
2. acceptance criteria are testable
3. dependencies are identified
4. scope is small enough for one sprint
5. estimate is agreed by the team
6. no critical ambiguity remains
7. release-readiness gates and expected evidence are explicitly defined [SRC-008]

Rule:

- items failing any `Ready` criterion MUST stay out of sprint commitment.

## 9) Prioritization Standard

### 9.1 Ordering policy

Backlog ordering MUST be explicit and explainable.

Minimum factors:

- business/user value
- time criticality
- risk reduction or opportunity enablement
- implementation effort

### 9.2 Recommended method

Teams SHOULD use a WSJF-like decision model for larger backlogs:

`Priority Score = (Business Value + Time Criticality + Risk Reduction/Opportunity Enablement) / Effort` [SRC-006]

If another method is used, teams MUST document:

- formula or decision criteria
- tie-breaker rule
- review cadence

### 9.3 Reprioritization triggers

Backlog order MUST be reviewed when at least one occurs:

- new high-impact customer evidence
- production incident with product impact
- major dependency or capacity change
- strategic objective change

## 10) Refinement Cadence and WIP Controls

1. Refinement MUST happen continuously during each sprint. [SRC-002] [SRC-003]
2. Teams MUST maintain at least one sprint of `Ready` work.
3. Teams SHOULD cap `In Refinement` WIP to avoid analysis queue overload.

Recommended baseline:

- weekly refinement session (60-90 min)
- max 10 items actively refined per team at once

## 11) Sprint Planning Integration

1. Sprint Planning MUST start from ordered and sufficiently ready backlog items. [SRC-002]
2. Sprint Goal MUST drive final item selection. [SRC-002]
3. Teams MUST NOT pull large ambiguous items into a sprint.
4. Mid-sprint scope change SHOULD be exceptional and explicitly logged.
5. Release-candidate items MUST maintain traceability to the release-readiness standard and required go/no-go evidence. [SRC-008]

## 12) Backlog Quality and Health Metrics

Teams MUST track backlog health monthly.

Minimum metrics:

- `Readiness Ratio`: ready items / top 20 items
- `Backlog Churn`: % priority changes in top 10 per sprint
- `Aging`: average days items remain in `Now`
- `Completion Predictability`: planned vs completed items per sprint
- `Outcome Linkage`: % completed items linked to measurable outcome hypothesis
- `Release Gate Coverage`: % `Now` items with explicit release-readiness gates and evidence plan [SRC-008]

Outcome metrics SHOULD map to Evidence-Based Management value areas (Current Value, Unrealized Value, Time-to-Market, Ability to Innovate). [SRC-007]

Default thresholds:

- Readiness Ratio >= 70%
- Backlog Churn (top 10) <= 30% per sprint
- 100% of sprint items linked to acceptance criteria
- Release Gate Coverage = 100% for `Now` items

## 13) Governance and Decision Traceability

1. Major backlog decisions MUST be recorded (what changed, why, expected impact).
2. High-impact prioritization changes MUST include at least 2 evidence references.
3. Conflicting stakeholder requests MUST be resolved through documented tradeoff decisions.
4. Exception decisions MUST include owner and expiry date.

## 14) Anti-Patterns (Prohibited or Discouraged)

Teams MUST NOT:

- treat backlog as a static requirement document
- commit unrefined work based only on urgency pressure
- optimize for story count instead of outcomes
- keep zombie items with no owner, no evidence, and no decision

Teams SHOULD NOT:

- rewrite priority every day without new evidence
- overload top backlog with loosely scoped initiatives

## 15) Source Citation Rules for Backlog Decisions

For high-impact backlog decisions, evidence entries MUST include:

- source title
- path/URL
- publication/update date when available
- one-line relevance rationale

Critical claims without citations are non-compliant.

## 16) Review and Change Management

- this standard MUST be reviewed every 6 months
- version increments:
  - `MAJOR`: structural method change
  - `MINOR`: new rules or thresholds
  - `PATCH`: clarifications without policy impact

## 17) Change Log

- 1.1.0 (2026-02-24): added mandatory release-readiness planning fields, DoR criterion, and coverage metric.
- 1.0.0 (2026-02-24): initial release

## 18) Sources

- [SRC-001] Agile Manifesto, https://agilemanifesto.org/, 2001, Defines foundational Agile values and principles.
- [SRC-002] The Scrum Guide (Ken Schwaber & Jeff Sutherland), https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-US.pdf, November 2020, Primary source for Product Backlog, Product Goal, refinement, and Sprint Planning guidance.
- [SRC-003] Scrum.org Glossary - Backlog Refinement, https://www.scrum.org/resources/scrum-glossary#backlog-refinement, publication date not specified (accessed 2026-02-24), Clarifies refinement as an ongoing activity.
- [SRC-004] Agile Alliance - INVEST in Good Stories, and SMART Tasks, https://www.agilealliance.org/glossary/invest/, publication date not specified (accessed 2026-02-24), Provides story quality criteria for backlog item quality checks.
- [SRC-005] Roman Pichler - DEEP Product Backlog, https://www.romanpichler.com/blog/10-tips-writing-good-user-stories/, publication date not specified (accessed 2026-02-24), Practical framework for backlog health (Detailed appropriately, Estimated, Emergent, Prioritized).
- [SRC-006] Scaled Agile Framework - Weighted Shortest Job First, https://scaledagileframework.com/wsjf/, publication date not specified (accessed 2026-02-24), Prioritization model reference combining value and effort.
- [SRC-007] Evidence-Based Management Guide, https://scrumguides.org/docs/guides/Evidence-Based-Management-Guide-2024.pdf, July 2024, Defines value areas for outcome-oriented product measurement.
- [SRC-008] CICD-001 Release Readiness Standard, `/Users/leodelpon/Projects/Personals/kratos-ma-vie/docs/stds/ci-cd/CICD-001-release-readiness-standard.md`, 2026-02-24, Defines mandatory release-readiness gates and evidence model for backlog-driven delivery.
