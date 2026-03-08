# STANDARD: FEATURE DOCUMENTATION

- Status: Active
- Version: 1.1.0
- Owner: Product and Engineering
- Approvers: Product Lead, Engineering Lead
- Effective date: 2026-02-24
- Last review date: 2026-02-24

## 1) Purpose
Define a single documentation standard for all delivered features under `/docs/features/`.

## 2) Scope
Applies to:
- all new features delivered in the product
- significant feature updates that change behavior, architecture, or operations

Does not apply to:
- minor typo or copy-only changes with no product behavior impact

## 3) Normative Language
- `MUST`: mandatory
- `SHOULD`: recommended unless justified
- `MAY`: optional

## 4) Mandatory Rule Set

### [FEAT-STD-R01] Feature artifact required
- Every delivered feature MUST have a dedicated document in `/docs/features/`.

### [FEAT-STD-R02] Naming convention
- Feature files MUST use a stable name: `FEATURE-<slug>.md`.
- Slug MUST be lowercase kebab-case and stable over time.

### [FEAT-STD-R03] Required sections
Each feature document MUST include the following sections:
1. `Title`
2. `Status`
3. `Owner(s)`
4. `Date` (created and last updated)
5. `Objective`
6. `Scope` (in-scope, out-of-scope)
7. `Backlog links`
8. `Acceptance criteria`
9. `Applied standards`
10. `Implementation summary`
11. `Validation and evidence`
12. `Operational impact`
13. `Risks and limitations`
14. `Release readiness status`
15. `Next steps`

### [FEAT-STD-R04] Traceability
- Feature docs MUST reference backlog item IDs.
- Feature docs MUST reference applied standards and relevant audit artifacts.
- When architecture is impacted, feature docs MUST link related ADR(s).

### [FEAT-STD-R05] Evidence quality
- Validation claims MUST include evidence (tests, checks, metrics, audit outputs).
- High-impact claims (security, reliability, compliance) SHOULD include at least two independent evidence items.

### [FEAT-STD-R06] Language policy
- Feature documents MUST be written in English.

### [FEAT-STD-R07] Release readiness traceability
- Every delivered feature MUST include a `Release readiness status` section summarizing:
  - mandatory gate results
  - final go/no-go decision
  - decision owner and timestamp
- The section MUST reference the runbook checklist used for operational validation.

## 5) Minimal Template

```md
# FEATURE - <Name>

## Status
Draft | In progress | Delivered | Deprecated

## Owner(s)
- <team/person>

## Date
- Created: YYYY-MM-DD
- Last updated: YYYY-MM-DD

## Objective
<Expected product/user outcome>

## Scope
- In scope:
- Out of scope:

## Backlog links
- <ticket/link>

## Acceptance criteria
- <criterion 1>
- <criterion 2>

## Applied standards
- <docs/stds/...>

## Implementation summary
<What was built and why>

## Validation and evidence
- Tests:
- Audit:
- Metrics:

## Operational impact
<Runtime, deployment, observability, support impact>

## Risks and limitations
<Known constraints>

## Release readiness status
- Gates: typecheck/check/test/perf/smoke
- Decision: GO | GO_WITH_CONDITIONS | NO_GO
- Owner and date:
- Runbook reference:

## Next steps
- <follow-up 1>
```

## 6) Review And Maintenance
- Feature docs MUST be updated when feature behavior materially changes.
- A delivered feature document SHOULD be reviewed at least once per major release cycle.

## 7) Exceptions
Any exception MUST include:
- explicit justification
- risk assessment
- owner
- expiry date

## 8) Change log
- 1.1.0 (2026-02-24): added mandatory `Release readiness status` section and traceability rule.
- 1.0.0 (2026-02-24): initial release.
