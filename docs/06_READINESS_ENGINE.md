# UPROOTERS — Readiness Engine Specification

## 1. Purpose

The Readiness Engine determines how closely a student's verified profile matches the documented requirements of a selected career role or job opening.

The engine must answer:

> "Based on the available evidence, how ready is this student for this specific opportunity, and what requirements are still missing?"

The engine is an explainable comparison system, not an autonomous career decision-maker.

It must prioritize:

- real requirements
- verified evidence
- traceability
- explainability
- freshness
- deterministic behavior
- transparent scoring
- student ownership
- security
- historical reproducibility

---

## 2. Readiness Engine Principles

The engine follows these principles:

1. Never fabricate requirements.
2. Never fabricate student evidence.
3. Never treat an unsupported assumption as evidence.
4. Never silently convert a related skill into an exact skill match.
5. Never hide blocking requirements.
6. Never present stale data as current.
7. Never provide an unexplained readiness percentage.
8. Never make a career decision for the student.
9. Preserve the inputs used for every evaluation.
10. Make every important result traceable to evidence or source data.

---

## 3. Core Readiness Question

For a target role or job opening:

```text
Target Requirements
        ↓
Effective Requirements
        ↓
Student Profile + Academic Data + Skills + Evidence
        ↓
Requirement Evaluation
        ↓
Blocking Requirement Check
        ↓
Readiness Score
        ↓
Explanation
        ↓
Missing Requirements
        ↓
Recommended Next Actions
4. Readiness Target Types

The engine supports two primary target types:

ROLE
JOB_OPENING

A role represents a general career position.

A job opening represents a specific opportunity.

Examples:

ROLE:
Embedded Systems Engineer

JOB OPENING:
Embedded Software Engineer — Company X — Job Opening Y

The engine must preserve the distinction between the two.

5. Role-Level Readiness

Role-level readiness compares the student against the canonical requirements associated with a role.

Example:

Student
   ↓
Embedded Systems Engineer
   ↓
Required Skills
   ↓
Student Evidence
   ↓
Readiness

Role readiness is useful for career exploration and long-term preparation.

It should not be presented as equivalent to readiness for a specific vacancy.

6. Job-Opening Readiness

Job-opening readiness compares the student against the requirements of a specific job opening.

The evaluation may include:

required skills
preferred skills
education
degree
branch
experience
certifications
location constraints
employment type
other explicitly documented requirements

Job-opening readiness must use the requirements attached to that opening and its effective requirement resolution rules.

7. Readiness Evaluation Identity

Every evaluation must identify:

student
target type
target
evaluation status
calculation timestamp
engine version
source data state
resulting score
requirement results

An evaluation must be reproducible from its stored inputs or snapshot.

8. Evaluation Lifecycle

Recommended lifecycle:

REQUESTED
   ↓
VALIDATING
   ↓
CALCULATING
   ↓
COMPLETED

Failure state:

CALCULATING
   ↓
FAILED

The exact database enum must remain consistent with the database specification.

The frontend must not invent lifecycle states.

9. Required Engine Inputs

The engine may use:

Student data
profile
degree
branch
college
graduation information
semester information
academic performance
Capability data
canonical skills
student skills
skill evidence
projects
project skills
certifications
certification skills
experience
experience skills
Target data
role
job opening
requirements
requirement type
requirement source
verification status
freshness
10. Input Validation

Before evaluation, the engine must validate that:

the student exists
the target exists
the target is eligible for evaluation
requirements are structurally valid
referenced skills exist
required relationships exist
relevant source information is available
target data is not invalidated

If required information is missing, the engine must return an explicit incomplete-data state rather than inventing values.

11. Student Capability Model

The student's capability state is derived from documented evidence.

Conceptually:

Student Capability
├── Academic
├── Skills
├── Projects
├── Certifications
├── Experience
└── Other verified evidence

A student capability must not be inferred solely from:

degree title
college name
branch name
unrelated project
unverified claim

unless the relevant specification explicitly defines such a relationship.

12. Academic Inputs

Academic evaluation may include:

degree
branch
semester
graduation year
subject performance
SGPA
CGPA
academic eligibility requirements

The engine must distinguish raw academic records from derived values.

For example:

Subject Marks
      ↓
Subject Grade
      ↓
Semester Summary
      ↓
SGPA
      ↓
CGPA
13. Degree Matching

Degree matching must compare documented student degree information against the documented target requirement.

Example:

Required:
B.E./B.Tech

Student:
B.E.

The engine may consider this compatible only according to a defined normalization/matching rule.

Exact string equality should not be the only long-term strategy.

14. Branch Matching

Branch requirements must be evaluated against documented student branch information.

Example:

Requirement:
ECE / EEE / EIE

Student:
ECE

The engine must use structured eligibility data where available.

It must not assume that every related engineering branch is automatically eligible.

15. Academic Thresholds

If a target explicitly requires:

CGPA >= 7.5

the engine evaluates the student's documented CGPA against that threshold.

Example:

Student CGPA = 7.8
Required CGPA = 7.5

Result = SATISFIED

If:

Student CGPA = 7.2
Required CGPA = 7.5

Result = MISSING

The result must include the relevant values.

16. Skill Requirement Types

Skill requirements must distinguish:

REQUIRED
PREFERRED

Required skills generally have greater impact on readiness than preferred skills.

The exact scoring treatment must remain configurable and versioned.

17. Canonical Skills

All readiness skill comparisons should use canonical skill records where possible.

Example:

Student:
Embedded C

Target:
Embedded C

This provides an exact canonical match.

The engine should avoid comparing arbitrary free-text strings whenever a canonical skill exists.

18. Exact Skill Match

An exact skill match occurs when the student's documented canonical skill corresponds directly to the target requirement.

Example:

Required Skill:
Verilog

Student Skill:
Verilog

Result:

EXACT_MATCH

An exact match must be distinguishable from related-skill evidence.

19. Related Skill Match

A related skill may provide supporting evidence but must not automatically satisfy an exact requirement.

Example:

Required:
SystemVerilog

Student:
Verilog

Verilog may be relevant supporting evidence.

However:

Related ≠ Exact

The engine must preserve this distinction.

20. Skill Hierarchy

The skill taxonomy may contain parent-child relationships.

Example:

Programming
   └── C
       └── Embedded C

Hierarchy can support contextual explanations.

It must not automatically convert every parent or child relationship into a satisfied requirement.

Matching behavior must be explicitly defined and versioned.

21. Skill Evidence

A student skill should be supported by evidence whenever possible.

Examples:

project
certification
internship
work experience
academic subject
verified practical activity

Conceptually:

Skill
  ↓
Evidence
  ↓
Strength
  ↓
Readiness contribution
22. Evidence Strength

Evidence may have different strengths.

Example conceptual hierarchy:

Verified experience
      ↓
Verified project
      ↓
Verified certification
      ↓
Academic evidence
      ↓
Self-declared skill
      ↓
Unsupported claim

This hierarchy is conceptual.

The production implementation must use explicitly defined weights and evidence rules rather than hidden assumptions.

23. Evidence Recency

Recent evidence may be more relevant for some requirements.

Example:

Embedded C project completed recently

may be more useful than an old unsupported claim.

Recency must only affect scoring when the product specification defines such behavior.

The engine must never silently discard older valid evidence.

24. Evidence Verification

Evidence must have a verification state where applicable.

Examples:

VERIFIED
UNVERIFIED
PENDING
REJECTED
STALE

Rejected evidence must not be treated as valid supporting evidence.

Stale evidence may require reduced confidence or explicit disclosure depending on the evidence type.

25. Project Evidence

Projects may demonstrate skills.

Example:

Project:
ESP32 Machine Health Monitoring System

Skills:
ESP32
Embedded C
IoT
Sensor Integration

The engine may use project-linked skills as evidence.

It must not infer arbitrary skills merely from the project title.

26. Certification Evidence

Certifications may support skills when the certification is explicitly linked to those skills.

Example:

Certification:
VLSI Design

Linked Skill:
VLSI

A certification must not automatically satisfy unrelated requirements.

27. Experience Evidence

Experience may include:

internships
employment
apprenticeships
relevant practical work

Relevant skills must be explicitly linked where possible.

Example:

Internship
   ↓
Embedded Software
   ↓
C
   ↓
Firmware Development

The engine should distinguish documented experience from inferred experience.

28. Experience Duration

If a target requires a minimum duration:

6 months experience

the engine must compare documented qualifying experience against the requirement.

Only experience that satisfies the target's defined relevance rules should count.

29. Requirement Categories

Requirements should be classified where appropriate.

Examples:

EDUCATION
ACADEMIC
SKILL
EXPERIENCE
CERTIFICATION
LOCATION
OTHER

Categories allow the engine and frontend to explain why a requirement is missing.

30. Requirement-Level Evaluation

Every applicable requirement should produce an individual result.

Conceptually:

Requirement
    ↓
Student Evidence
    ↓
Evaluation
    ↓
Result

Possible result states include:

SATISFIED
PARTIAL
MISSING
UNSUPPORTED
NOT_APPLICABLE

The exact enum must remain synchronized with the database specification.

31. Satisfied Requirements

A requirement is satisfied when sufficient documented evidence meets the defined requirement rule.

Example:

Required:
Python

Evidence:
Verified Python project

Result:
SATISFIED

The evaluation must preserve the evidence used.

32. Partial Requirements

A requirement may be partial when meaningful supporting evidence exists but the full requirement is not demonstrated.

Example:

Required:
SystemVerilog

Student:
Verilog + digital design project

Result:
PARTIAL

The explanation must state why the evidence is insufficient for full satisfaction.

33. Missing Requirements

A requirement is missing when the student has no sufficient qualifying evidence.

Example:

Required:
UVM

Student evidence:
None

Result:
MISSING

Missing requirements should feed the skill-gap system.

34. Unsupported Requirements

A requirement may be unsupported when the available data cannot establish whether it is satisfied.

Example:

Requirement:
Minimum relevant experience

Student experience data:
Incomplete

Result:

UNSUPPORTED

This is different from:

MISSING

The distinction prevents incomplete data from being incorrectly treated as absence.

35. Not Applicable Requirements

A requirement may be marked NOT_APPLICABLE only when the engine has an explicit rule establishing that it does not apply to the current evaluation.

The engine must not use this state simply because evaluating a requirement is inconvenient.

36. Blocking Requirements

Some requirements may prevent a student from being considered fully ready even when the overall score is high.

Examples:

mandatory degree
mandatory branch
minimum CGPA
mandatory certification
required legal eligibility
required experience

The target data must identify which requirements are blocking where applicable.

37. Blocking Requirement Logic

Conceptually:

Overall Score = 86%

Blocking Requirement:
Missing

Final Interpretation:
High capability match,
but blocking requirement remains unresolved.

The system must not hide this condition behind a high percentage.

38. Preferred Requirements

Preferred requirements are valuable but generally should not be treated identically to mandatory requirements.

Example:

Required:
C

Preferred:
FreeRTOS

A student without FreeRTOS should not automatically be treated as missing a mandatory qualification.

39. Effective Requirement Resolution

The engine must determine the final requirements applicable to a target.

For a role:

Role Requirements

For a job opening:

Role Defaults
      +
Opening-Specific Requirements
      ↓
Effective Requirements

Opening-specific rules must have explicitly defined precedence.

40. Requirement Override Principle

Where an opening-specific requirement overrides a role-level default, the opening requirement takes precedence.

Conceptually:

Role:
Python REQUIRED

Opening:
Python PREFERRED

Effective:
Python PREFERRED

The exact database representation must preserve this distinction.

41. Requirement Provenance

Every important requirement should be traceable to its source.

Possible source:

Official Company Career Page
Official Job Posting
Official ATS
Corroborated Public Source
Manually Curated Source

The engine should expose provenance to the frontend.

42. Verification Impact

Verification status affects trust in career data.

Conceptually:

Verified official requirement
        ↓
High confidence

Unverified requirement
        ↓
Lower confidence / disclosure

The engine must not silently treat every source as equally authoritative.

43. Data Freshness

Career requirements change.

Therefore each evaluation must consider the freshness of the target data.

A stale job opening must not be presented as a current opportunity.

A stale requirement may require:

warning
reduced confidence
re-verification
exclusion from current opportunity evaluation

The exact behavior must be versioned.

44. Evaluation Timestamp

Every completed evaluation must store:

calculated_at

This allows the system to answer:

"When was this readiness result calculated?"

It also supports historical comparison.

45. Engine Version

Every evaluation must store:

engine_version

Example:

1.0.0

If scoring logic changes, future evaluations can use a new version without corrupting historical results.

46. Snapshot Principle

A readiness evaluation should preserve the relevant calculation context.

Conceptually:

Student State
+
Target State
+
Requirement State
+
Engine Version
        ↓
Evaluation Snapshot

This makes historical results explainable.

47. Score Purpose

The readiness score is a summary indicator of requirement alignment.

It is not:

a probability of employment
a hiring prediction
a recruiter decision
a guarantee
a measure of personal worth
an absolute career suitability score

The score must always be accompanied by a breakdown.

48. Score Range

The readiness score uses:

0–100

The score must be bounded.

Invalid values below 0 or above 100 must be rejected.

49. Score Calculation Principle

The score should be derived from evaluated requirements rather than subjective AI judgment.

Conceptually:

Requirement Results
        ↓
Requirement Weights
        ↓
Evidence Satisfaction
        ↓
Weighted Readiness
        ↓
0–100 Score

The exact mathematical formula must be explicitly versioned.

50. Required vs Preferred Weighting

A production scoring model should assign different weights to:

REQUIRED
PREFERRED

Required requirements must have greater influence than preferred requirements.

The exact weights must be configurable and stored as part of the engine version.

Example configuration:

Required weight:
configurable

Preferred weight:
configurable

Do not hard-code unexplained weights into frontend code.

51. No False Precision

A readiness score must not imply more certainty than the underlying data supports.

For example:

87.346291%

would create unnecessary precision.

The presentation should use a sensible rounded value while retaining the underlying calculation if required for reproducibility.

52. Score Breakdown

The frontend should be able to show:

Overall Readiness
        ↓
Required Requirements
        ↓
Preferred Requirements
        ↓
Academic Eligibility
        ↓
Skills
        ↓
Experience
        ↓
Certifications

The exact categories shown depend on available target data.

53. Score Explanation

Every score must be explainable.

Example:

Readiness: 78%

Satisfied:
8 requirements

Partial:
2 requirements

Missing:
3 requirements

Blocking:
1 requirement

The student should be able to inspect the requirements behind the result.

54. Score Limitations

The system must clearly communicate that readiness is calculated from available documented evidence.

Example:

"This result reflects the requirements and evidence currently available in UPROOTERS."

This prevents users from interpreting the score as a guaranteed employment outcome.

55. Missing Skill Detection

The engine must identify missing or partially satisfied skills.

Example:

Target:
Embedded Software Engineer

Student:
C
Embedded C
ESP32

Missing:
RTOS
FreeRTOS
Firmware Testing

The missing-skill list becomes an input to recommendations.

56. Biggest Gap Analysis

UPROOTERS should support the user-requested feature:

"Find the biggest gap in my profile."

The engine should identify high-impact unresolved requirements based on documented target requirements.

It should consider:

requirement type
blocking status
current evidence
importance
target relevance

It must not invent a gap where the underlying requirement is absent.

57. Gap Prioritization

A gap can be prioritized using explicit rules.

Possible factors:

Blocking status
Required vs preferred
Current evidence level
Requirement importance
Student target
Estimated actionability

The priority must be explainable.

It must not be presented as an arbitrary AI opinion.

58. Skill-Gap Intelligence Map

The engine supplies data for:

Student Skills
      ↓
Target Career
      ↓
Requirements
      ↓
Satisfied / Partial / Missing
      ↓
Evidence
      ↓
Next Action

The visualization belongs to the frontend/UI layer.

The engine supplies the factual relationships.

59. Career Tree

The engine may provide readiness-related data for:

Student
   ↓
Career Domain
   ↓
Role
   ↓
Related Roles

The engine must not select a career for the student.

It should provide information that allows the student to explore alternatives.

60. Recommendations

Recommendations should be generated from actual unresolved requirements.

Examples:

Missing:
FreeRTOS

Recommendation:
Build a FreeRTOS-based ESP32 project.

or:

Missing:
PCB Design

Recommendation:
Complete a documented PCB design project.

Recommendations must be connected to actual gaps.

61. Recommendation Evidence

A recommendation should identify the requirement or gap that caused it.

Conceptually:

Recommendation
      ↓
Target Requirement
      ↓
Student Gap

This prevents generic recommendations with no traceable reason.

62. Recommendation Lifecycle

Recommendations may move through:

GENERATED
ACTIVE
COMPLETED
VERIFIED
DISMISSED
EXPIRED

The exact database lifecycle must remain consistent with the database specification.

63. Recommendation Completion

Completing a recommendation does not automatically satisfy a career requirement.

Example:

Recommendation:
Build a Verilog project

Student:
Marks recommendation complete

Requirement:
Verilog

Result:
Still requires valid evidence

Evidence must be established through the appropriate evidence workflow.

64. Recalculation Triggers

Readiness should be recalculated when material input data changes.

Potential triggers:

New project
New certification
New skill evidence
Academic update
Experience update
Target requirement update
Verification update
Target status change

The system should avoid unnecessary recalculation for unrelated changes.

65. Manual Recalculation

The student may request a fresh readiness evaluation.

The system should create or update an evaluation according to the configured evaluation lifecycle.

The frontend must not calculate the score locally.

66. Automatic Recalculation

Future versions may support event-driven recalculation.

Conceptually:

Database Change
      ↓
Relevant Event
      ↓
Readiness Evaluation Queue
      ↓
Engine
      ↓
New Evaluation

This is an architecture capability, not necessarily an MVP requirement.

67. Evaluation Consistency

Given identical:

student state
target state
requirement state
engine version
configuration

the engine should produce the same result.

This deterministic behavior is important for trust and debugging.

68. AI Boundary

AI may assist with:

explanations
natural-language summaries
gap descriptions
recommendation wording

AI must not silently determine:

factual requirements
verified evidence
eligibility
score values
source verification
database truth

The core readiness result must remain grounded in structured data and deterministic rules.

69. AI Explanation Safety

An AI-generated explanation must use structured engine output as its source.

Example:

Engine:
Missing = FreeRTOS

AI explanation:
"FreeRTOS is currently missing from your documented evidence..."

It must not generate:

"You probably know FreeRTOS already."

unless supporting evidence exists.

70. Requirement Text Handling

Natural-language job descriptions may contain useful information.

However, production readiness should use normalized structured requirements whenever possible.

Pipeline:

Source Text
    ↓
Extraction
    ↓
Human/System Verification
    ↓
Canonical Requirement
    ↓
Readiness Engine

Unverified extraction must not automatically become authoritative.

71. Unsupported Natural-Language Claims

If a requirement cannot be confidently normalized:

"Must be a strong problem solver"

the engine should not invent a numeric student score for it.

It may remain:

UNSUPPORTED

or be handled as informational text.

72. Requirement Evidence Mapping

The engine should map each requirement to the evidence used.

Example:

Requirement:
ESP32

Evidence:
Project #12
Skill Evidence #42

This mapping supports explainability and auditing.

73. Evidence Count

The evaluation may record:

evidence_count

This indicates how much supporting evidence was available.

Evidence count must not be confused with evidence quality.

Three weak records do not necessarily outweigh one strong verified record.

74. Academic Evidence Mapping

Academic requirements should be traceable to relevant academic records.

Example:

Requirement:
Digital Electronics

Evidence:
EC3353 — Digital Electronics
Grade:
A

Only explicitly mapped academic evidence should be used.

The engine must not infer a course from an unrelated subject name.

75. Experience Requirement Mapping

Experience requirements must map to relevant experience records.

Example:

Requirement:
1 year Embedded Software experience

Student:
8 months documented relevant experience

The result should clearly show the shortfall.

76. Certification Requirement Mapping

Certification requirements must identify:

certification
validity where relevant
verification state
relationship to requirement

An expired or rejected certification must not automatically satisfy a current mandatory certification requirement.

77. Location Requirements

If a job opening explicitly requires a location condition, the engine may evaluate it only when the required student/location data is available and the rule is explicitly defined.

If location information is unavailable:

UNSUPPORTED

rather than:

SATISFIED

or:

MISSING

by assumption.

78. Employment Type

Employment type may affect opportunity presentation.

Examples:

INTERNSHIP
FULL_TIME
CONTRACT
APPRENTICESHIP

It should not affect skill readiness unless a target requirement explicitly depends on it.

79. Job Status

Only appropriate job-opening states should be considered active opportunities.

Example:

PUBLISHED

may be eligible.

States such as:

CLOSED
RETIRED
REJECTED

should not be presented as active current opportunities.

Exact lifecycle behavior must follow the database specification.

80. Company Status

Archived or inactive companies must be handled according to lifecycle rules.

Historical evaluations may retain references to previously valid company data.

The system must not destroy historical evaluation context merely because a company is no longer active.

81. Missing Data Strategy

Missing data must be explicit.

Examples:

Student CGPA unavailable
Job requirement unavailable
Certification verification unavailable
Experience duration incomplete

The engine should report:

DATA_INCOMPLETE

where appropriate.

82. Data Quality Impact

Poor data quality should reduce confidence in the evaluation rather than create fabricated certainty.

Example:

Requirement:
Minimum CGPA 7.5

Student CGPA:
Unknown

Result:
UNSUPPORTED

Not:

MISSING
83. Stale Evidence Strategy

Stale evidence must be handled according to evidence type.

Examples:

certification may expire
job openings may close
requirements may change
old projects may remain valid evidence

The engine must not apply one universal stale rule to every data type.

84. Historical Evaluation

Historical evaluations should remain inspectable.

Example:

September:
72%

October:
81%

The student should be able to understand what changed.

Historical evaluations should not be silently overwritten when new calculations occur.

85. Evaluation Comparison

Future UI may compare:

Previous Evaluation
vs
Current Evaluation

Possible changes:

New skills
Completed projects
Academic update
Requirement change
Evidence verification
Job status change

The engine should expose enough metadata to explain changes.

86. Engine Configuration

Scoring and matching rules should be configurable through controlled configuration rather than scattered hard-coded constants.

Configuration may include:

requirement weights
evidence weights
thresholds
matching rules
freshness rules

Every configuration change affecting output must be associated with an engine version.

87. Engine Versioning Rules

Example:

Engine 1.0.0

may define the initial scoring model.

A future change:

Engine 1.1.0

may alter evidence weighting.

A major semantic change may require:

Engine 2.0.0

Historical evaluations must retain their original version.

88. Database Contract

The readiness engine must operate only on fields and relationships defined by the database specification.

Important entities include:

students
student_semesters
semester_summary
skills
student_skills
skill_evidence
projects
project_skills
certifications
certification_skills
experience
experience_skills
companies
roles
job_openings
role_skills
job_opening_skills
readiness_evaluations
readiness_requirement_results

Where a future table is not yet implemented, the engine must not pretend that it exists.

89. Student Ownership

A readiness evaluation belongs to one student.

Students must only be able to access their own readiness evaluations.

Administrative access must follow the security model.

The engine itself must respect database-level ownership and RLS boundaries.

90. Administrative Access

Administrators may access readiness information only according to their application role.

Examples:

DATA_EDITOR
VERIFIER
SUPER_ADMIN

The engine must not bypass RLS simply because an operation originates from an administrative interface.

91. RLS Interaction

Readiness tables must have appropriate RLS.

Student access should follow:

auth.uid()
   ↓
student.user_id
   ↓
student.id
   ↓
readiness.student_id

Cross-student access must be prevented.

92. Security Boundary

The frontend must never be trusted to enforce readiness permissions.

Security must exist at the database/backend layer.

The frontend may hide unavailable actions for usability, but hiding an action is not authorization.

93. Performance Requirements

The readiness engine should avoid unnecessarily expensive recalculations.

Important considerations:

indexed student IDs
indexed target IDs
indexed skill relationships
efficient requirement queries
efficient evidence lookup
limited repeated calculations

Large-scale evaluation should be designed for future asynchronous processing.

94. Caching

Readiness results may be cached when appropriate.

A cached result must identify:

student
target
engine version
calculation timestamp
relevant data state

Stale cached results must not be presented as current without disclosure.

95. Error Handling

The engine must return structured errors.

Examples:

TARGET_NOT_FOUND
STUDENT_NOT_FOUND
INVALID_TARGET
INCOMPLETE_DATA
INVALID_REQUIREMENT
CALCULATION_FAILED
UNSUPPORTED_REQUIREMENT

Errors must be useful for debugging without exposing sensitive internal information.

96. Testing Strategy

The readiness engine requires tests for:

Functional behavior
exact skill match
related skill
missing skill
partial evidence
academic thresholds
degree matching
branch matching
experience requirements
certifications
blocking requirements
preferred requirements
Security
student isolation
admin access
RLS enforcement
Data quality
stale data
missing data
invalid requirements
duplicate requirements
Reproducibility
same inputs produce same result
engine version changes are isolated
97. Required Edge Cases

The engine must explicitly test:

No student skills
No projects
No certifications
No experience
No academic summary
No target requirements
Only preferred requirements
All requirements satisfied
All requirements missing
Missing blocking requirement
High score with blocking requirement
Partial evidence
Stale job opening
Unverified requirement
Conflicting role/opening requirements
Duplicate skills
Retaken subjects
Incomplete academic data
Expired certification

Each case should have a defined expected behavior.

98. Readiness Engine Review Checklist

Before implementation approval, verify:

 target types defined
 inputs defined
 effective requirement resolution defined
 exact skill matching defined
 related skill behavior defined
 evidence model defined
 academic matching defined
 experience matching defined
 certification matching defined
 blocking requirements defined
 preferred requirements defined
 score range defined
 score formula versioned
 explanation model defined
 snapshots defined
 provenance preserved
 freshness handled
 historical evaluations preserved
 recommendations traceable
 RLS considered
 tests defined
 edge cases defined
 AI boundary defined
99. Definition of Done

The Readiness Engine specification is complete when:

Every readiness input has a defined source.
Every requirement can be evaluated or explicitly marked unsupported.
Skill matching is explainable.
Evidence is traceable.
Required and preferred requirements are distinguishable.
Blocking requirements are visible.
Scores are reproducible.
Engine versions are preserved.
Historical evaluations remain understandable.
Recommendations originate from documented gaps.
Student data remains isolated.
Career data provenance remains visible.
No fabricated requirements or evidence are introduced.
Frontend does not independently calculate readiness.
Testing covers normal and edge cases.
100. Final Readiness Engine Principle

UPROOTERS readiness must never mean:

"The system thinks you are good enough."

It must mean:

"Based on the documented requirements, the verified evidence currently available, and the specific readiness rules used by this engine version, this is how closely your profile matches the target — and these are the requirements that explain the result."

The engine exists to turn complex career requirements into a transparent, evidence-based comparison.

The final experience should always allow the student to understand:

WHERE AM I?
     ↓
WHAT DO I ALREADY HAVE?
     ↓
WHAT DOES THE TARGET REQUIRE?
     ↓
WHAT IS SATISFIED?
     ↓
WHAT IS PARTIAL?
     ↓
WHAT IS MISSING?
     ↓
WHAT IS BLOCKING?
     ↓
WHAT EVIDENCE SUPPORTS THE RESULT?
     ↓
WHAT CAN I WORK ON NEXT?

UPROOTERS should provide the information and reasoning structure.

The student remains the decision-maker.
