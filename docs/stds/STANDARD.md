# STANDARD: HOW TO DEFINE A SOFTWARE PROJECT STANDARD

## 1) Mission

This document defines the mandatory method to create, evaluate, approve, publish, and maintain standards in a software project.

Primary goals:

- reduce ambiguity in engineering decisions
- improve delivery consistency, quality, and security
- make technical expectations explicit, testable, and auditable

## 2) Scope / Out of Scope

Scope:

- code standards (style, architecture, quality)
- process standards (branching, CI/CD, reviews, releases)
- reliability and operations standards (monitoring, incident response, SLOs)
- security and compliance standards
- documentation standards for technical artifacts

Out of scope:

- one-off team preferences without project impact
- standards without enforcement mechanism
- standards that duplicate existing rules without added value

## 3) Normative Language

The following keywords are normative:

- `MUST`: absolute requirement
- `MUST NOT`: absolute prohibition
- `SHOULD`: strong recommendation with limited exceptions
- `SHOULD NOT`: discouraged practice, allowed only with justification
- `MAY`: optional practice

Every rule in a project standard MUST use one of these keywords.

## 4) When a Standard Is Required

A new standard MUST be created when at least one condition is true:

- repeated incidents come from inconsistent team practices
- quality defects are linked to missing shared rules
- compliance/security constraints require formal controls
- a cross-team decision needs long-term alignment
- onboarding time is increased by missing conventions

A standard SHOULD be updated when:

- toolchain or architecture changes invalidate current rules
- exception requests exceed 20% of affected work items in a quarter
- recurring review feedback reveals unclear language

## 5) Standard Lifecycle (Mandatory Workflow)

### Step 1 - Problem framing

- define the problem in one sentence
- identify impacted teams/systems
- define measurable success criteria

Deliverable:

- `Problem Statement` with baseline metrics

### Step 2 - Evidence collection

- collect internal evidence (incidents, PR review trends, defects, lead time)
- collect external references (official docs, recognized standards, vendor guidance)
- identify alternatives and tradeoffs

Minimum evidence rule:

- at least 3 relevant sources
- at least 1 primary/official source when available
- at least 2 independent references for high-impact rules
- every source used to define a rule MUST be explicitly cited in the standard document

Deliverable:

- `Evidence Pack`
- `Source Register` (citation-ready list of all references)

### Step 3 - Drafting

- write rules using normative keywords (`MUST`, `SHOULD`, `MAY`)
- define enforcement mechanisms per rule (lint, CI gate, review checklist, audit)
- include exceptions process and ownership

Deliverable:

- `Draft Standard v0.x`

### Step 4 - Technical review

- run review with at least one representative from each impacted domain
- assess feasibility, cost, migration impact, and backward compatibility
- explicitly resolve contradictions

Acceptance threshold:

- no unresolved high-severity objection

Deliverable:

- `Review Notes` + revised draft

### Step 5 - Pilot and validation

- test the draft on at least one real feature or service
- measure friction and compliance cost
- validate expected quality improvements

Pilot exit criteria:

- no critical blocker
- measurable positive signal on at least one success metric

Deliverable:

- `Pilot Report`

### Step 6 - Approval and publication

- get formal sign-off from owner + required approvers
- assign version (`MAJOR.MINOR.PATCH`)
- publish in `docs/stds`

Deliverable:

- `Approved Standard vX.Y.Z`

### Step 7 - Adoption and enforcement

- communicate scope and effective date
- integrate controls into delivery workflow
- track adoption KPIs and exception volume

Deliverable:

- `Adoption Plan`

### Step 8 - Maintenance

- review every 6 months minimum
- update or deprecate based on evidence
- archive superseded versions with rationale

Deliverable:

- `Review Decision` (keep/update/deprecate)

## 6) Required Structure for Each Standard File

Every standard file under `docs/stds/**` MUST contain:

1. `Title`
2. `Status` (`Draft`, `Active`, `Deprecated`)
3. `Version`
4. `Owner`
5. `Approvers`
6. `Effective date`
7. `Scope`
8. `Normative rules`
9. `Enforcement`
10. `Exceptions process`
11. `Metrics`
12. `Change log`

Recommended metadata block:

```md
- Status: Active
- Version: 1.0.0
- Owner: Platform Team
- Approvers: Engineering Manager, Security Lead
- Effective date: 2026-03-01
- Last review date: 2026-02-24
```

## 7) Rule Authoring Requirements

Every rule MUST be:

- unambiguous (single interpretation)
- testable (clear pass/fail criteria)
- enforceable (manual and/or automated control)
- scoped (where it applies and where it does not)

Every rule SHOULD include:

- rationale (`why this rule exists`)
- risk of non-compliance
- migration guidance for legacy systems

Rule format template:

```md
### [RULE-ID] Short name

Requirement:

- [MUST/SHOULD/MAY statement]

Rationale:

- [business/technical justification]

Enforcement:

- [CI check, lint rule, review checkpoint, audit method]

Exceptions:

- [when allowed, who approves, expiration]
```

## 8) Governance and Responsibilities

Minimum roles:

- `Standard Owner`: accountable for content, lifecycle, and metrics
- `Maintainers`: implement updates and enforcement controls
- `Approvers`: validate technical, security, and organizational impact
- `Consumers`: teams applying the standard

RACI baseline:

- drafting: Owner (A), Maintainers (R), Approvers (C), Consumers (I)
- approval: Approvers (A/R), Owner (R), Consumers (I)
- enforcement: Maintainers (R), Owner (A), Consumers (R)
- periodic review: Owner (A/R), Approvers (C), Consumers (C)

## 9) Exceptions and Waivers

An exception request MUST include:

- rule identifier
- business/technical justification
- risk assessment
- mitigation controls
- expiration date
- rollback/remediation plan

Exception policy:

- temporary by default (max 90 days)
- renewable only with new evidence
- logged in a centralized exception registry

## 10) Quality Rubric (100 points)

- clarity and precision: 25
- enforceability and testability: 25
- evidence quality and traceability: 20
- adoption feasibility: 15
- governance completeness: 15

Delivery threshold:

- `>= 80`: publishable
- `70-79`: usable with required revisions
- `< 70`: not publishable

## 11) Failure Modes & Recovery

Common failure modes:

- rules too vague to enforce
- standard too strict for real delivery constraints
- no owner or no review cadence
- exceptions unmanaged and permanently open

Corrective actions:

- rewrite rules with explicit pass/fail criteria
- run pilot and adjust constraints based on measured impact
- assign owner and review schedule before activation
- enforce exception expiration and quarterly cleanup

## 12) Operational Checklists

### A) Pre-draft checklist

- problem is explicit and measurable
- impacted scope is identified
- baseline metrics are available

### B) Pre-approval checklist

- all rules use normative keywords
- each rule has enforcement definition
- exception workflow is defined
- versioning and ownership are complete

### C) Post-release checklist

- communication is sent to impacted teams
- controls are integrated into CI/review workflows
- adoption and exception metrics are monitored

## 13) Deliverable Contract for a New Standard Proposal

Any new standard proposal SHOULD include:

1. `Executive summary` (decision-oriented)
2. `Key rules` (normative statements)
3. `Evidence` (internal and external references with explicit citations)
4. `Risks and limitations`
5. `Confidence` (low/medium/high + rationale)
6. `Rollout plan` (owner, timeline, controls)

## 14) Source Citation Requirements (Mandatory)

Every published standard MUST include a `Sources` section.

Citation rules:

- each normative rule SHOULD reference one or more source IDs when applicable
- each high-impact rule MUST reference at least one primary or official source
- sources MUST be traceable to the `Evidence Pack` and remain accessible at review time
- uncited high-impact claims MUST be treated as non-compliant

Required citation format for each source:

- `ID`: short stable identifier (example: `SRC-001`)
- `Title`
- `URL` or internal reference location
- `Publisher/Institution`
- `Publication or last update date` (if available)
- `Why it is relevant` (one line)

Example:

```md
## Sources

- SRC-001 | OWASP ASVS | https://owasp.org/www-project-application-security-verification-standard/ | OWASP | 2023-xx-xx | Baseline security verification controls.
- SRC-002 | Internal incident review Q1 | docs/incidents/2026-Q1.md | Internal | 2026-04-02 | Shows recurring failure mode addressed by rule R-SEC-04.
```

## 15) Minimal Example

```md
# Standard: Pull Request Review

- Status: Active
- Version: 1.1.0
- Owner: Engineering Enablement
- Approvers: Backend Lead, Frontend Lead
- Effective date: 2026-03-10

## Scope

Applies to all repositories in this project.

## Normative rules

- PRs MUST include a test impact note. `[SRC-001]`
- PRs MUST be approved by at least 1 code owner. `[SRC-002]`
- PRs SHOULD stay below 400 changed lines excluding generated files. `[SRC-003]`

## Enforcement

- CI check for code owner approval
- PR template with mandatory fields

## Exceptions

- emergency production fixes MAY bypass one rule with incident ticket and 48h retroactive review.

## Sources

- SRC-001 | Internal defect review | docs/quality/pr-defects-2026-q1.md | Internal | 2026-04-10 | Shows missing test impact notes in failed changes.
- SRC-002 | Code ownership policy | docs/governance/code-owners-policy.md | Internal | 2026-02-18 | Defines mandatory owner-based review model.
- SRC-003 | Engineering productivity benchmark | https://example.com/pr-size-study | External | 2025-11-05 | Supports a recommended PR size threshold for review quality.
```

## 16) Storage Convention in This Repository

- cross-cutting baseline standards: `docs/stds/*.md`
- domain standards: `docs/stds/<domain>/*.md`
- domain examples: `docs/stds/<domain>/examples/*.md` (optional)

Naming rules:

- file names MUST be uppercase snake case for global standards (example: `CODE_REVIEW_STANDARD.md`)
- file names SHOULD be stable over time; versioning belongs inside the file, not in the file name
