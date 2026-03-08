# Title

AUDIT-APPLY-001 - Standard for Application Verification Audits

## Status

Draft

## Version

0.2.0

## Owner

Platform Governance Team

## Approvers

Engineering Lead, SRE Lead, Security Lead

## Effective date

2026-03-15

## Scope

This standard defines the mandatory audit process executed when a team applies any project standard to a concrete change.

Applies to:

- feature, task, bugfix, refactor, or migration claiming compliance with one or more standards
- standards under `docs/stds/**` (`ARCH-*`, `CODE-*`, `PERF-*`, `TEST-*`, etc.)
- pre-merge and pre-release verification gates

Does not apply to:

- periodic governance-only audits not tied to a concrete implementation
- changes that explicitly do not claim standard application

## Normative rules

### [AUDIT-APPLY-001-R01] Trigger on standard application

Requirement:

- An application audit MUST be created whenever a change claims to apply at least one standard rule.
- If no standard is claimed, the change request MUST explicitly state `No standard applied` with rationale.

Rationale:

- Ensures every standard application is verified, not only declared.

Enforcement:

- Pull request template MUST include `Applied standards` and `Application audit` sections.

Exceptions:

- None.

Sources:

- [SRC-STD-001]

### [AUDIT-APPLY-001-R02] In-scope rule selection before implementation close

Requirement:

- For each claimed standard, the audit MUST list in-scope normative rules (`MUST`, `SHOULD`, `MAY`) before merge approval.
- Rules marked `Not applicable` MUST include explicit technical justification.

Rationale:

- Prevents partial or opportunistic compliance declarations.

Enforcement:

- Review gate MUST block if in-scope rule set is missing.

Exceptions:

- None.

Sources:

- [SRC-STD-001]

### [AUDIT-APPLY-001-R03] Rule-to-evidence matrix

Requirement:

- The audit MUST provide a matrix mapping each in-scope rule to:
  - status: `Pass`, `Fail`, `Partial`, `Not applicable`
  - evidence references
  - auditor comment
- `Pass` without evidence is forbidden.

Rationale:

- Makes verification objective and reproducible.

Enforcement:

- Audit reviewer MUST reject reports with incomplete matrix rows.

Exceptions:

- None.

Sources:

- [SRC-STD-001]

### [AUDIT-APPLY-001-R04] Minimum evidence requirements

Requirement:

- Each `Fail` or `Partial` status MUST include at least one direct evidence artifact.
- High-impact rules (security, reliability, data integrity, production safety) MUST include at least two independent evidence artifacts.
- Evidence MUST include source path and observation date.

Rationale:

- Reduces false compliance and weak findings.

Enforcement:

- Approval MUST be blocked when evidence quality minimum is not met.

Exceptions:

- None.

Sources:

- [SRC-ARCH-005], [SRC-ARCH-007]

### [AUDIT-APPLY-001-R05] Auditor independence

Requirement:

- Application audit MUST be reviewed by at least one auditor/reviewer other than the change author.
- High-impact standards (`ARCH-*`, `PERF-*`, `SECU-*`) SHOULD include domain-owner review.

Rationale:

- Limits self-validation bias and increases audit credibility.

Enforcement:

- Merge policy MUST require explicit reviewer sign-off on the audit artifact.

Exceptions:

- Emergency hotfix MAY use deferred independent review within 48h.

Sources:

- [SRC-STD-001]

### [AUDIT-APPLY-001-R06] Gate decision model

Requirement:

- Audit decision MUST be one of:
  - `PASS`: all in-scope `MUST` rules pass
  - `PASS_WITH_ACTIONS`: no failing `MUST`, only approved residual `SHOULD`/`MAY` gaps
  - `FAIL`: at least one in-scope `MUST` fails
- `FAIL` MUST block merge/release for the audited scope.

Rationale:

- Prevents shipping declared compliance with broken mandatory controls.

Enforcement:

- CI/review checklist MUST enforce decision-driven merge policy.

Exceptions:

- Emergency waiver process only, with expiry and remediation plan.

Sources:

- [SRC-STD-001], [SRC-ARCH-005]

### [AUDIT-APPLY-001-R07] Corrective action obligation

Requirement:

- Every `Fail` or `Partial` item MUST have corrective action, owner, due date, and verification step.
- `MUST` failures require closure before release unless approved waiver exists.

Rationale:

- Converts audit output into enforceable remediation.

Enforcement:

- Audit cannot be closed while mandatory corrective actions are open.

Exceptions:

- None.

Sources:

- [SRC-STD-001]

### [AUDIT-APPLY-001-R08] Waiver validation in application audits

Requirement:

- If a rule is bypassed by waiver, the audit MUST reference waiver ID, expiry, and compensating controls.
- Expired waiver usage MUST be treated as `FAIL`.

Rationale:

- Controls exception drift and expired-risk carryover.

Enforcement:

- Reviewer MUST validate waiver metadata before sign-off.

Exceptions:

- None.

Sources:

- [SRC-STD-001]

### [AUDIT-APPLY-001-R09] Post-merge verification for runtime-impacting standards

Requirement:

- For runtime-impacting standards (`ARCH-*`, `PERF-*`, `SECU-*`), a post-merge verification checkpoint MUST confirm that declared controls are effective in target environment.
- Post-merge verification results MUST be appended to the same audit artifact.

Rationale:

- Confirms real effectiveness beyond code-level intent.

Enforcement:

- Release checklist MUST include post-merge verification status where applicable.

Exceptions:

- Non-runtime documentation-only changes are exempt.

Sources:

- [SRC-ARCH-004], [SRC-ARCH-008]

### [AUDIT-APPLY-001-R10] Mandatory audit report structure

Requirement:

- Each application audit report MUST include:
  1. metadata (`change_id`, `audited_standard_ids`, `auditor`, `date`)
  2. scope and in-scope rule list
  3. rule-to-evidence matrix
  4. gate decision (`PASS`/`PASS_WITH_ACTIONS`/`FAIL`)
  5. corrective actions
  6. waiver references
  7. post-merge verification (if required)

Rationale:

- Standardizes execution quality and simplifies review.

Enforcement:

- Reports missing mandatory sections MUST be rejected.

Exceptions:

- None.

Sources:

- [SRC-STD-001]

## Enforcement

Controls:

- PR template with mandatory application audit fields
- reviewer checklist for rule-to-evidence completeness
- merge gate linked to audit decision
- post-merge verification check for runtime-impacting standards

Release gates:

- no `FAIL` decision on in-scope application audits
- no unresolved in-scope `MUST` failure without valid waiver

## Exceptions process

Waiver request MUST include:

- standard rule ID
- reason and risk
- compensating controls
- expiration date (max 90 days)
- remediation plan

Approvals:

- Owner + domain lead
- Security Lead for security-impacting waivers

## Metrics

Audit execution KPIs:

- changes claiming standard application with completed audit: target 100%
- audits with full rule-to-evidence matrix coverage: target 100%
- failed audits merged without waiver: target 0
- expired waivers used in application audits: target 0
- post-merge verification completed when required: target 100%

## Change log

- 0.2.0 (2026-02-24): Refocused to application-time verification audits with merge/release gate decisions.

## Evidence pack

Evidence summary:

- Existing standards require enforceability and auditable verification.
- Reliability and security controls require evidence-based validation and escalation.
- Exception lifecycle must be verified at application time, not only periodically.

## Source register

- [SRC-STD-001] STANDARD - How to Define a Software Project Standard. `/Users/leodelpon/Projects/Personals/kratos-ma-vie/docs/stds/STANDARD.md` (accessed 2026-02-24)
- [SRC-ARCH-004] ARCH-004 - Observability and Probe Instrumentation Standard. `/Users/leodelpon/Projects/Personals/kratos-ma-vie/docs/stds/architecture/ARCH-004-observability-and-probes-standard.md` (accessed 2026-02-24)
- [SRC-ARCH-005] ARCH-005 - Runtime Reliability Standard. `/Users/leodelpon/Projects/Personals/kratos-ma-vie/docs/stds/architecture/ARCH-005-runtime-reliability-standard.md` (accessed 2026-02-24)
- [SRC-ARCH-007] ARCH-007 - Security and Compliance Architecture Standard. `/Users/leodelpon/Projects/Personals/kratos-ma-vie/docs/stds/architecture/ARCH-007-security-and-compliance-standard.md` (accessed 2026-02-24)
- [SRC-ARCH-008] ARCH-008 - Deployment Topology and Production Operations Standard. `/Users/leodelpon/Projects/Personals/kratos-ma-vie/docs/stds/architecture/ARCH-008-deployment-topology-standard.md` (accessed 2026-02-24)
