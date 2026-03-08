# STANDARD: WRITING A THEME-SPECIFIC AGENT PROFILE

## 1) Objective

This standard defines how to write a robust, verifiable, and actionable agent profile adapted to a specific theme.

Primary objectives:

- make the agent role explicit
- enforce a reproducible method
- define a controllable output contract

## 2) Mandatory Profile Structure

Every profile must include these sections in this exact order:

1. `Mission`
2. `Scope / Out of Scope`
3. `Operational Workflow`
4. `Tooling Rules`
5. `Credibility / Validation Rules`
6. `Output Contract`
7. `Quality Rubric`
8. `Failure Modes & Recovery`
9. `Recommended Artifacts`
10. `Examples (few-shot)`

## 3) Writing Rules (Mandatory)

- use short, operational sentences
- describe testable steps, not vague intentions
- define numeric thresholds (minimum sources, score, coverage, etc.)
- separate facts, interpretation, and hypotheses
- make stop conditions and iteration triggers explicit
- the full agent profile must be written in English
- the agent's outputs must be written in English unless a user explicitly requests another language

## 4) Theme Adaptation

For each theme, systematically adapt the following:

- `Mission`: expected deliverable type (analysis, plan, audit, proposal)
- `Allowed sources`: official docs, standards, articles, internal data
- `Evidence criteria`: what counts as strong vs weak evidence
- `Method`: required work sequence (research, verification, synthesis, review)
- `Quality`: validation metrics and thresholds

Minimum matrix to fill:

- `Theme`: [name]
- `Typical questions`: [3 to 7 recurring questions]
- `Priority sources`: [ranked list]
- `Major risks`: [3 to 5 risks]
- `Quality threshold`: [minimum score]

## 5) Standard Workflow (Shared Baseline)

### Step 1 - Frame the request

- clarify intent, context, and constraints
- break down into verifiable sub-questions

Intermediate deliverable:

- work plan with 3 to 7 sub-questions

### Step 2 - Plan execution

- define collection strategy (query, exploration, validation)
- rank sources by reliability

Intermediate deliverable:

- source list and verification method

### Step 3 - Produce and verify

- execute actions in batches
- trace evidence and limitations
- verify each critical point with independent sources

Minimum rule:

- no critical claim without explicit evidence

### Step 4 - Synthesize and decide

- structure output around sub-questions
- highlight contradictions, uncertainty, and impact

### Step 5 - Improvement loop

Iterate if:

- coverage is insufficient
- conflicts remain unresolved
- confidence is too low

Stop condition:

- quality threshold is reached
- all critical claims are justified

## 6) Output Contract (Required Format)

Each agent response must include:

1. `Executive summary` (short and decision-oriented)
2. `Key points` (verified facts)
3. `Evidence` (sources/justifications linked to key points)
4. `Limitations` (unknowns and hypotheses)
5. `Confidence` (low/medium/high + rationale)
6. `Next steps` (concrete actions)

## 7) Quality Rubric (100 points)

- fit to request: 25
- evidence quality: 25
- methodological rigor: 20
- clarity and structure: 15
- transparency of limitations: 15

Recommended threshold:

- `>= 80`: strong deliverable
- `70-79`: usable deliverable with reservations
- `< 70`: run another iteration

## 8) Copy-Ready Template

```md
# AGENT PROFILE: [AGENT_NAME]

## 1) Mission

- [primary objective]
- [expected result]

## 2) Scope / Out of Scope

Scope:

- [allowed task types]
  Out of scope:
- [prohibited actions and limits]

## 3) Operational Workflow

### Step 1 - [name]

- [action]
  Deliverable:
- [output]

### Step 2 - [name]

- [action]
  Deliverable:
- [output]

### Step 3 - [name]

- [action]
  Minimum rules:
- [thresholds]

### Step 4 - [name]

- [action]

### Step 5 - Iteration

Iterate if:

- [condition]
  Stop condition:
- [condition]

## 4) Tooling Rules

- [allowed tools]
- [usage priorities]

## 5) Credibility / Validation Rules

- [strong evidence criteria]
- [weak evidence criteria]

## 6) Output Contract

1. Executive summary
2. Key points
3. Evidence
4. Limitations
5. Confidence
6. Next steps

## 7) Quality Rubric

- [criterion]: [points]

## 8) Failure Modes & Recovery

- [common failure] -> [corrective action]

## 9) Recommended Artifacts

- docs/profiles/examples/[AGENT_NAME].examples.md
- docs/profiles/rubrics/[AGENT_NAME].rubric.md
- docs/profiles/sources/[AGENT_NAME].sources.md
- docs/profiles/evals/[AGENT_NAME].evals.md

## 10) Examples (few-shot)

### Example A

Input:

- [question type]
  Expected output:
- [structure + requirements]
```

## 9) Pre-Publish Validation Checklist

- the profile includes all 10 mandatory sections
- each workflow step has a clear deliverable
- quality thresholds are explicit and measurable
- the output contract is complete and stable
- at least 2 few-shot examples are provided
- profile language is fully English
