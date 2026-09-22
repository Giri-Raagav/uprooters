# UPROOTERS — Product Specification

**Document:** `docs/01_PRODUCT_SPEC.md`  
**Version:** 1.0  
**Status:** Product Definition / Build Contract  
**Product:** UPROOTERS  
**Primary Audience:** ECE students across colleges  
**Backend:** Supabase + PostgreSQL  
**Development Environment:** Antigravity  
**Source Control:** Git + GitHub  

---

# 1. Product Overview

## 1.1 Product Name

**UPROOTERS**

## 1.2 Product Vision

UPROOTERS is a career-readiness platform for engineering students, initially focused on **Electronics and Communication Engineering (ECE)**.

Its purpose is to track a student's college journey and translate that journey into an evidence-based understanding of:

- what the student has learned,
- what skills the student has demonstrated,
- what experience the student has accumulated,
- which career roles align with the student's current profile,
- which requirements the student already satisfies,
- which requirements are only partially satisfied,
- which requirements are missing,
- and what the student should do next.

### Core product statement

> **UPROOTERS tracks my entire college journey and tells me which career opportunities I am ready for — and exactly what I am missing for the ones I am not yet ready for.**

UPROOTERS is not intended to simply display a generic career score.

It must explain the reasoning behind every readiness result.

---

# 2. Problem Statement

Engineering students often have information about their academic performance, skills, projects, certifications, internships, and extracurricular activities scattered across different places.

At the same time, career requirements are distributed across:

- company career pages,
- official job postings,
- applicant tracking systems,
- public job boards,
- recruitment announcements,
- and other public sources.

Students therefore face several problems:

1. They do not have a unified record of their college journey.
2. They may not know which skills they actually possess.
3. They may confuse course completion with demonstrated skill.
4. They may not know which companies or roles match their current profile.
5. They may not know exactly which requirements they are missing.
6. They may spend time learning skills that are not relevant to their target roles.
7. They may rely on generic career advice rather than actual role requirements.
8. Job requirements change over time.
9. Old or inaccurate job information can lead to incorrect career decisions.

UPROOTERS addresses this by connecting:

**Student journey → Evidence → Skills → Career requirements → Readiness → Action**

---

# 3. Product Goals

## 3.1 Primary Goals

UPROOTERS must:

1. Maintain a structured record of a student's college journey.
2. Represent canonical ECE and related career skills.
3. Connect student evidence to those canonical skills.
4. Represent companies, roles, and job openings.
5. Store provenance for career requirements.
6. Track verification and freshness of external career data.
7. Compare student evidence against actual role/job requirements.
8. Produce explainable readiness results.
9. Identify missing and partially satisfied requirements.
10. Generate actionable recommendations based on those gaps.
11. Allow readiness to change as the student's profile changes.
12. Protect student data through strict authorization and ownership controls.

---

# 4. Non-Goals

UPROOTERS must not initially attempt to:

- guarantee employment,
- predict whether a company will hire a student,
- guarantee interview selection,
- guarantee placement,
- fabricate company requirements,
- fabricate job openings,
- treat an AI-generated answer as authoritative career data,
- replace official company career pages,
- automatically claim that a student is qualified when evidence is insufficient,
- create fake certificates or project evidence,
- award skill mastery merely because a student entered a skill manually,
- make unsupported claims about a company's hiring decisions.

UPROOTERS measures **documented readiness against defined requirements**, not guaranteed hiring outcomes.

---

# 5. Target Users

## 5.1 Primary User — Student

The primary user is an engineering student.

Initial specialization:

**ECE students across colleges.**

The architecture should remain extensible enough to support additional engineering branches later.

Students should be able to:

- create and maintain their profile,
- record academic information,
- record subjects and academic performance,
- add skills,
- provide evidence for skills,
- add projects,
- add certifications,
- add internships and experience,
- explore companies,
- explore roles,
- explore job openings,
- view readiness,
- understand missing requirements,
- receive recommendations,
- track progress over time.

---

## 5.2 Data Editor

A controlled administrative user responsible for maintaining career data.

Responsibilities may include:

- creating/updating companies,
- creating/updating roles,
- maintaining skills,
- adding public career sources,
- importing public data,
- correcting career data,
- maintaining requirement mappings.

Data editors must not automatically be treated as verifiers.

---

## 5.3 Verifier

A controlled administrative user responsible for verifying externally sourced career information.

Responsibilities include:

- reviewing source evidence,
- verifying requirements,
- identifying stale information,
- rejecting unsupported information,
- maintaining verification status.

---

## 5.4 Super Admin

The highest application-level administrative role.

Responsibilities include:

- managing application administration,
- managing authorized administrative roles,
- resolving exceptional data/security issues,
- managing system configuration,
- overseeing data integrity.

Administrative access must remain restricted and auditable.

---

# 6. Product Principles

## 6.1 Evidence First

UPROOTERS must prefer evidence over claims.

A student saying:

> "I know Python"

is not equivalent to having evidence such as:

- completed coursework,
- project usage,
- certification,
- internship experience,
- assessment,
- or other accepted evidence.

The product should distinguish between a declared skill and an evidenced skill.

---

## 6.2 Real Data Over Fabricated Data

UPROOTERS must not invent:

- companies,
- jobs,
- requirements,
- salaries,
- eligibility criteria,
- skills,
- certifications,
- or verification status.

If information is unavailable, the system must represent that uncertainty.

---

## 6.3 Provenance

Important external career information should have an associated source.

A career requirement should ideally answer:

> Where did this information come from?

The system should retain source information and verification metadata.

---

## 6.4 Explainability

Every readiness result must be explainable.

The user should be able to understand:

- what requirement was evaluated,
- what the requirement was,
- what evidence the student has,
- what result was produced,
- why that result was produced,
- and what is missing.

The product should never rely on an unexplained single "AI score."

---

## 6.5 Time Awareness

Career requirements are not permanent.

UPROOTERS must account for:

- first-seen dates,
- last-seen dates,
- verification dates,
- stale information,
- closed jobs,
- retired requirements,
- and updated requirements.

Historical information should not simply be deleted when it becomes outdated.

---

## 6.6 Student Ownership

A student must be able to access and manage their own student-owned information.

A student must not be able to access another student's private information.

Administrative access must be explicitly authorized.

---

## 6.7 No False Precision

If the system does not have enough evidence to determine a requirement confidently, it must represent uncertainty.

For example:

**UNKNOWN**

is preferable to falsely claiming:

**MET**

or:

**NOT MET**

---

# 7. Core Product Model

UPROOTERS is built around the following relationship:

```text
Student
   │
   ├── College
   ├── Department
   ├── Academic Journey
   ├── Skills
   ├── Evidence
   ├── Projects
   ├── Certifications
   └── Experience
          │
          ▼
     Student Profile
          │
          ▼
   Readiness Engine
          │
          ▼
 ┌──────────────────────┐
 │ Company              │
 │   ↓                  │
 │ Role                 │
 │   ↓                  │
 │ Job Opening          │
 │   ↓                  │
 │ Requirements         │
 │   ↓                  │
 │ Required Skills      │
 └──────────────────────┘
          │
          ▼
     Readiness Result
          │
          ▼
    Missing Requirements
          │
          ▼
    Recommendations
          │
          ▼
      Student Action
          │
          ▼
       New Evidence
          │
          ▼
   Recalculated Readiness
```

---

# 8. College Journey Model

UPROOTERS should represent the student's journey as a connected timeline rather than a collection of unrelated profile fields.

## Journey

```text
Admission
   ↓
Semester 1
   ↓
Subjects + Grades
   ↓
Skills
   ↓
Projects
   ↓
Certifications
   ↓
Internships / Experience
   ↓
Semester 2
   ↓
...
   ↓
Current Semester
   ↓
Career Readiness
   ↓
Target Roles
```

The system should allow the student to continuously add evidence throughout college.

---

# 9. Student Profile

A student profile should support, as applicable:

- user identity,
- name,
- college,
- department,
- degree,
- branch,
- admission year,
- expected graduation year,
- current semester,
- location,
- profile completion,
- academic information,
- skills,
- projects,
- certifications,
- internships,
- experience,
- career interests,
- readiness information.

The exact visual presentation is defined separately in the frontend and UI/UX specifications.

---

# 10. Academic System

The academic system should represent:

- semesters,
- subjects,
- subject credits,
- marks,
- grades,
- grade points,
- attempts,
- arrears/retakes,
- result status,
- semester GPA,
- cumulative GPA.

## Academic principles

### Raw data

The system should store canonical academic records.

### Derived data

GPA/CGPA should be derived from appropriate academic records rather than blindly trusting manually entered summary values.

### Retakes

The system must support students who repeat subjects.

The data model should explicitly represent which attempt contributes to GPA/CGPA.

### Grading differences

The system should be extensible enough to support different academic grading structures across colleges.

---

# 11. Skill System

UPROOTERS uses a **canonical skill taxonomy**.

Skills should not be treated as arbitrary strings everywhere.

Examples include:

- C
- C++
- Python
- Embedded C
- Embedded Systems
- Microcontrollers
- ESP32
- ARM
- RTOS
- FreeRTOS
- Digital Electronics
- Verilog
- SystemVerilog
- FPGA
- VLSI
- ASIC Design
- PCB Design
- KiCad
- Communication Systems
- DSP
- RF
- Wireless Communication
- Antenna
- LoRa
- Bluetooth
- Wi-Fi
- IoT
- Sensor Integration
- Edge Computing
- Edge AI
- Git
- Linux
- SQL
- Machine Learning

The taxonomy should support:

- categories,
- aliases,
- parent-child relationships,
- descriptions,
- lifecycle status.

---

# 12. Skill Evidence

A skill should be connected to evidence whenever possible.

Potential evidence types include:

- academic subject,
- project,
- certification,
- internship,
- work/experience,
- assessment,
- other verified evidence.

The product should distinguish:

```text
Declared Skill
      ↓
Evidence Available
      ↓
Evidence Quality
      ↓
Verified Evidence
```

The exact evidence scoring model must be defined by the readiness-engine specification and must not be invented by the frontend.

---

# 13. Projects

Students should be able to maintain structured project records.

A project may include:

- title,
- description,
- project type,
- technologies,
- canonical skills,
- role/responsibility,
- duration,
- links,
- documentation,
- evidence,
- verification status where applicable.

Projects should contribute evidence to skills when the relationship is explicitly recorded.

---

# 14. Certifications

Students should be able to record certifications.

A certification may include:

- certification name,
- issuing organization,
- issue date,
- expiry date where applicable,
- credential/reference information,
- verification link where applicable,
- associated canonical skills,
- evidence.

The system must not automatically treat every certification as proof of mastery of every skill associated with it.

---

# 15. Internships and Experience

Students should be able to record:

- internships,
- work experience,
- relevant technical experience,
- responsibilities,
- technologies,
- associated skills,
- duration,
- organization,
- evidence.

Experience should become career evidence only according to defined evidence rules.

---

# 16. Company Model

UPROOTERS should represent companies as structured entities.

Company information may include:

- company name,
- normalized identity,
- website,
- careers page,
- industry,
- description,
- domains,
- headquarters information,
- lifecycle status.

Historical records should be retained appropriately.

---

# 17. Role Model

A company may have multiple career roles.

Example:

```text
Company
   ├── Embedded Engineer
   ├── Firmware Engineer
   ├── VLSI Design Engineer
   ├── Verification Engineer
   └── RF Engineer
```

A role may define:

- title,
- domain,
- description,
- eligible degrees,
- eligible branches,
- minimum CGPA,
- experience requirements,
- degree requirement,
- branch requirement,
- required skills,
- preferred skills.

---

# 18. Job Opening Model

A role describes a career position generally.

A job opening represents a specific published opportunity.

Example:

```text
Role:
Embedded Engineer

Specific Opening:
Embedded Engineer — Chennai
Posted: specific date
Application: specific URL
Status: PUBLISHED
```

Job openings may have requirements that override or refine role-level requirements.

The product must explicitly define requirement precedence.

Initial intended principle:

> **Opening-specific requirements override role defaults when explicitly provided; otherwise the applicable role requirement is inherited.**

This logic must be formalized before implementation of the readiness engine.

---

# 19. Career Data Sources

Career information may originate from sources such as:

- official company careers pages,
- official company job postings,
- official ATS pages,
- public job boards,
- public recruitment announcements,
- other public sources.

Each source should have:

- source type,
- URL,
- trust tier,
- accessibility metadata where applicable,
- timestamps,
- snapshot/provenance information where applicable.

Official sources should generally receive stronger provenance than secondary/discovery sources.

The product must preserve the distinction between:

**source discovered**

and

**requirement verified**.

---

# 20. Verification Model

External career information should support verification states such as:

- PENDING
- VERIFIED
- REJECTED
- STALE

Verification should also represent the level of evidence, such as:

- OFFICIAL_SOURCE
- OFFICIAL_ATS
- CORROBORATED_PUBLIC_SOURCE
- MANUALLY_CURATED
- UNVERIFIED

A source being present does not automatically mean its contents are verified.

---

# 21. Career Data Lifecycle

Career data should move through a lifecycle.

Example:

```text
DISCOVERED
    ↓
IN REVIEW
    ↓
VERIFIED
    ↓
PUBLISHED
    ↓
UPDATED
    ↓
STALE / CLOSED / RETIRED
```

The exact lifecycle depends on entity type.

UPROOTERS should avoid deleting historical career information merely because a job is closed.

---

# 22. Readiness Engine

The readiness engine is the core intelligence layer of UPROOTERS.

It compares:

**Student evidence**

against

**Role/job requirements**.

The engine should evaluate requirements individually.

Example:

```text
Target:
Embedded Engineer

Requirement                 Result
----------------------------------------
CGPA ≥ 7.5                  MET
ECE degree                  MET
C                           MET
Embedded C                  MET
Microcontrollers            MET
FreeRTOS                    NOT MET
Linux                       NOT MET
Git                         PARTIALLY MET
```

---

# 23. Readiness Result Types

Requirement results may include:

- MET
- PARTIALLY_MET
- NOT_MET
- NOT_APPLICABLE
- UNKNOWN

These states must have explicit definitions.

## MET

The available evidence satisfies the defined requirement.

## PARTIALLY_MET

Some but not all conditions are satisfied.

## NOT_MET

The available evidence does not satisfy the requirement.

## NOT_APPLICABLE

The requirement does not apply to this student/target context.

## UNKNOWN

There is insufficient trustworthy evidence to determine the result.

---

# 24. Readiness Score

If a numerical readiness score is presented, it must be:

- derived from defined rules,
- reproducible,
- explainable,
- versioned,
- based on actual requirement results,
- accompanied by the underlying breakdown.

The score must never be presented as:

> "Your probability of getting hired is X%."

UPROOTERS does not predict hiring outcomes.

The score represents readiness against the requirements represented in the system.

---

# 25. Blocking Requirements

Some requirements may prevent readiness even if many other requirements are satisfied.

Examples may include:

- mandatory degree,
- mandatory branch,
- minimum CGPA,
- mandatory certification,
- mandatory skill,
- required experience.

The engine should identify blocking requirements explicitly.

Example:

```text
Overall profile:
Strong evidence

Blocking requirement:
❌ Required RTOS experience

Action:
Build or obtain qualifying RTOS evidence.
```

---

# 26. Readiness Explanation

Every readiness result should be explainable.

For each requirement:

```text
Requirement
     ↓
Expected
     ↓
Student Evidence
     ↓
Evidence Quality
     ↓
Result
     ↓
Explanation
```

Example:

> **FreeRTOS — Not Met**  
> This role requires FreeRTOS. No qualifying FreeRTOS evidence is currently recorded in your profile.

The wording should remain factual and avoid unsupported claims.

---

# 27. Readiness Snapshots

Readiness evaluations should be stored as snapshots.

A snapshot should preserve enough information to understand:

- target evaluated,
- evaluation date/time,
- engine version,
- requirement results,
- overall result,
- calculation context.

This allows the system to understand how readiness changed over time.

---

# 28. Recommendations

Recommendations should be generated from actual gaps.

The recommendation pipeline should be:

```text
Career Target
      ↓
Requirements
      ↓
Student Evidence
      ↓
Gap
      ↓
Canonical Skill / Requirement
      ↓
Recommendation
      ↓
Student Action
      ↓
New Evidence
      ↓
Recalculate Readiness
```

Recommendations should not be random AI suggestions.

---

# 29. Recommendation Priorities

Initial recommendation logic may distinguish:

### High Priority

Blocking required requirement.

### Medium Priority

Required requirement that is not currently blocking but materially affects readiness.

### Lower Priority

Preferred requirement or enhancement.

The exact scoring/prioritization algorithm must be documented in `READINESS_ENGINE.md`.

---

# 30. Recommendation Lifecycle

Recommendations should support states such as:

```text
GENERATED
   ↓
ACTIVE
   ↓
IN PROGRESS
   ↓
COMPLETED
   ↓
VERIFIED
```

Other possible states:

- DISMISSED
- EXPIRED

A completed recommendation should not automatically imply that the underlying skill is mastered.

New evidence should be evaluated before readiness changes.

---

# 31. Career Discovery

UPROOTERS should allow students to discover:

- companies,
- roles,
- job openings,
- relevant requirements,
- their readiness against those targets.

The system should eventually support filtering by factors such as:

- domain,
- company,
- location,
- work mode,
- employment type,
- role,
- required skills,
- eligibility.

---

# 32. Student Career Targeting

A student should eventually be able to identify target roles/domains.

Examples:

- Embedded Systems
- Firmware
- VLSI
- Semiconductor
- FPGA
- IoT
- RF/Wireless
- Communication Systems
- Hardware
- PCB
- Robotics
- Software/technical roles relevant to ECE

Target selection should influence recommendations and dashboard presentation but must not override factual requirement evaluation.

---

# 33. Dashboard Concept

The dashboard should provide a high-level representation of the student's current journey.

Potential areas:

```text
Profile Completion
Academic Progress
Skill Coverage
Projects
Certifications
Experience
Career Readiness
Missing Requirements
Recommendations
Career Targets
```

The dashboard must display actual data or clearly identified empty states.

No fake metrics should be presented as real student information.

---

# 34. Product Data Flow

The high-level data flow is:

```text
                ┌─────────────────┐
                │ External Sources│
                └────────┬────────┘
                         ↓
                Career Data Layer
                         ↓
               Verification Layer
                         ↓
              Company / Role / Job
                         ↓
                  Requirements
                         ↓
                   Readiness
                         ↑
                         │
Student ──→ Evidence ────┘
   │
   ├── Academics
   ├── Skills
   ├── Projects
   ├── Certifications
   └── Experience
                         ↓
                 Gap Identification
                         ↓
                  Recommendations
                         ↓
                   Student Action
                         ↓
                    New Evidence
```

---

# 35. Data Integrity Principles

UPROOTERS should enforce integrity at the database level wherever practical.

Important principles include:

- foreign keys,
- check constraints,
- unique constraints,
- indexes,
- lifecycle constraints,
- ownership constraints,
- audit history,
- validation functions,
- RLS policies.

Application validation should complement database validation rather than replace it.

---

# 36. Security Model

Student data is private by default.

The system should enforce:

```text
Student A
   ↓
Own private data ✓

Student A
   ↓
Student B private data ✗
```

Administrative access should be explicitly role-controlled.

Supabase/PostgreSQL Row Level Security is a core part of the security model. Supabase documents RLS as a database-level authorization mechanism and recommends combining RLS with appropriate table grants and testing policies.

The implementation must never place elevated database secrets in the browser. Supabase's current security guidance explicitly distinguishes frontend-safe publishable keys from secret/service-role keys that bypass RLS and must remain server-side.

---

# 37. Application Roles

Initial application roles:

```text
STUDENT
DATA_EDITOR
VERIFIER
SUPER_ADMIN
```

Application role assignment must be controlled.

A student must not be able to promote themselves to an administrative role.

---

# 38. Auditability

Important administrative/data operations should be auditable.

Audit history should support:

- entity,
- entity ID,
- action,
- actor,
- actor type,
- source,
- before state,
- after state,
- changed fields,
- reason,
- batch/run identifier,
- timestamp.

Historical audit records should be append-only.

---

# 39. No Destructive History

UPROOTERS should prefer lifecycle changes over destructive deletion for important career information.

Examples:

```text
ACTIVE
   ↓
INACTIVE
   ↓
ARCHIVED
```

or:

```text
PUBLISHED
   ↓
CLOSED
   ↓
RETIRED
```

Historical records may be retained for:

- auditability,
- analytics,
- readiness history,
- source history,
- data-quality review.

---

# 40. Data Quality

UPROOTERS should treat data quality as a product feature.

The system should detect or prevent:

- duplicate normalized companies,
- duplicate normalized skills,
- invalid foreign keys,
- orphaned records,
- invalid lifecycle combinations,
- invalid requirement ranges,
- missing provenance,
- stale career data,
- unsupported readiness claims.

---

# 41. Real-World Career Data Strategy

The first version should not depend on private company APIs or unavailable institutional data.

Initial data strategy:

```text
Public Sources
      ↓
Discovery
      ↓
Normalization
      ↓
Verification
      ↓
Canonical Database
      ↓
Readiness Engine
```

Official college data is not required for the initial product.

The architecture should allow colleges or institutions to be integrated later.

---

# 42. Data Freshness

Career information should contain enough metadata to determine whether it remains current.

Relevant timestamps include:

- posted_at,
- closing_at,
- first_seen_at,
- last_seen_at,
- verified_at,
- retired_at,
- updated_at.

The system should distinguish:

**not recently checked**

from

**confirmed stale**.

---

# 43. Future Data Ingestion

Future ingestion systems may support:

- manual entry,
- CSV import,
- structured imports,
- scheduled jobs,
- source monitoring,
- controlled automation.

Any automated ingestion must pass through validation and provenance rules before becoming trusted career data.

Automated discovery must not automatically equal verified truth.

---

# 44. AI Usage Principles

AI may be used to assist with:

- summarization,
- classification,
- extraction,
- normalization,
- recommendation explanations,
- UI assistance,
- data-quality workflows.

However:

> **AI output must not silently become authoritative career data.**

Important career facts should be grounded in stored sources and verification state.

AI should not invent missing requirements.

---

# 45. Product Transparency

The user should be able to understand why UPROOTERS produced an important result.

Where appropriate, the product should show:

- requirement,
- source,
- verification status,
- date checked,
- student evidence,
- result,
- missing evidence,
- recommendation.

---

# 46. Frontend Boundary

The product specification defines product behavior, not detailed visual implementation.

The following belong in:

`docs/02_FRONTEND_SPEC.md`

- route structure,
- page structure,
- component architecture,
- frontend state management,
- API/data access patterns,
- loading/error/empty states,
- responsive behavior.

The following belong in:

`docs/03_UI_UX_SPEC.md`

- visual design,
- typography,
- color system,
- spacing,
- component appearance,
- interaction patterns,
- responsive visual behavior,
- accessibility presentation.

---

# 47. Technical Architecture Boundary

The product specification defines what the system must achieve.

Detailed technical decisions belong in:

`docs/04_ARCHITECTURE.md`

This should cover:

- frontend architecture,
- Supabase integration,
- service boundaries,
- server-side logic,
- database access,
- background jobs,
- external integrations,
- testing architecture,
- deployment architecture.

---

# 48. Database Boundary

Detailed database implementation belongs in:

`docs/05_DATABASE_SPEC.md`

The current database roadmap is:

```text
001_initial_schema.sql
        ↓
002_seed_phase1_taxonomy.sql
        ↓
003_student_profile.sql
        ↓
004_academic_system.sql
        ↓
005_student_skills_evidence.sql
        ↓
006_projects_certifications.sql
        ↓
007_readiness_engine.sql
        ↓
008_recommendations.sql
        ↓
009_student_rls.sql
        ↓
010_complete_schema.sql
```

These migrations must be treated as version-controlled database changes.

Before production execution, all migrations must be tested against the actual Supabase project and reconciled for compatibility.

---

# 49. Readiness Engine Boundary

Detailed readiness rules belong in:

`docs/06_READINESS_ENGINE.md`

This document must define:

- requirement precedence,
- evidence hierarchy,
- requirement matching,
- skill matching,
- degree matching,
- branch matching,
- CGPA matching,
- experience matching,
- partial matching,
- unknown states,
- blocking requirements,
- score calculation,
- recommendation generation,
- engine versioning,
- recalculation triggers.

No frontend component should independently recreate readiness logic.

The frontend should consume the canonical readiness result.

---

# 50. Security Boundary

Detailed security rules belong in:

`docs/07_SECURITY_MODEL.md`

This should define:

- authentication,
- authorization,
- RLS,
- grants,
- role management,
- ownership,
- admin access,
- secrets,
- storage security,
- API security,
- audit requirements,
- security testing.

Supabase's security model requires attention to both grants and RLS; policies alone are not sufficient if inappropriate database privileges remain exposed.

---

# 51. Development Rules

Detailed development rules belong in:

`docs/08_DEVELOPMENT_RULES.md`

The project should follow these principles:

1. Do not bypass the product specification.
2. Do not invent requirements.
3. Do not introduce fake production data.
4. Do not silently change database semantics.
5. Do not bypass RLS for convenience.
6. Do not place secrets in frontend code.
7. Do not duplicate business logic across frontend components.
8. Do not create arbitrary skill strings when a canonical skill exists.
9. Do not delete historical career data without an explicit reason.
10. Add tests for important business logic.
11. Run validation after significant changes.
12. Keep Git history clean and meaningful.
13. Commit stable checkpoints.
14. Document architectural changes.
15. Prefer small, verifiable implementation steps.

Antigravity is intended to support agentic development across editor, terminal, and browser, with plans/artifacts and verification workflows; the development process should therefore require the agent to show its plan and validate its work rather than simply generating code without verification.

---

# 52. Development Workflow

The standard development loop is:

```text
Requirement
    ↓
Specification
    ↓
Agent Plan
    ↓
Implementation
    ↓
Tests
    ↓
Browser / Integration Verification
    ↓
Review
    ↓
Git Commit
    ↓
Next Change
```

No large uncontrolled "build everything" operation should be the default workflow.

---

# 53. Git Checkpoint Strategy

Major milestones should have Git checkpoints.

Example:

```text
checkpoint/product-spec
checkpoint/frontend-foundation
checkpoint/auth
checkpoint/student-profile
checkpoint/academics
checkpoint/skills
checkpoint/projects
checkpoint/readiness
checkpoint/recommendations
checkpoint/career-data
checkpoint/testing
```

Actual branch/tag naming may be finalized in the development rules.

---

# 54. MVP Definition

The first usable UPROOTERS MVP should establish this complete loop:

```text
Student Signup
      ↓
Student Profile
      ↓
Academic Data
      ↓
Skills + Evidence
      ↓
Projects / Certifications / Experience
      ↓
Career Target
      ↓
Real Role Requirements
      ↓
Readiness Evaluation
      ↓
Missing Requirements
      ↓
Recommendations
```

The MVP does not need every future feature.

It must, however, preserve the core product principle:

> **The student should be able to understand where they currently stand and what they need to do next.**

---

# 55. MVP Priorities

## Must Have

- authentication,
- student profile,
- college/department,
- academic records,
- canonical skills,
- skill evidence,
- projects,
- certifications,
- experience,
- company records,
- role records,
- job openings,
- career requirements,
- provenance,
- readiness evaluation,
- missing requirements,
- recommendations,
- RLS,
- auditability,
- responsive application foundation.

## Should Have

- career search,
- filtering,
- readiness history,
- target roles,
- progress tracking,
- data-quality dashboard,
- verification workflows.

## Later

- automated source monitoring,
- advanced ingestion,
- institution integrations,
- broader engineering branches,
- advanced analytics,
- additional career domains,
- richer recommendation intelligence,
- external learning integrations.

---

# 56. Product Success Criteria

UPROOTERS is successful when a student can answer:

### "Where am I now?"

through:

- academic progress,
- skills,
- evidence,
- projects,
- certifications,
- experience.

### "What can I target?"

through:

- companies,
- roles,
- job openings,
- requirements.

### "Am I ready?"

through:

- requirement-by-requirement evaluation,
- readiness state,
- explainable results.

### "What am I missing?"

through:

- missing skills,
- missing eligibility,
- missing evidence,
- blocking requirements.

### "What should I do next?"

through:

- prioritized recommendations,
- actionable next steps,
- new evidence,
- updated readiness.

---

# 57. Product Quality Bar

UPROOTERS should feel like a real product rather than a college-project dashboard.

Quality expectations:

- coherent information architecture,
- reliable data,
- explainable results,
- strong security,
- responsive UI,
- meaningful empty states,
- robust validation,
- traceable career data,
- reproducible readiness calculations,
- clean Git history,
- testable architecture,
- maintainable code.

---

# 58. Future Expansion

The initial focus is ECE.

The architecture should eventually support:

```text
ECE
 │
 ├── Embedded
 ├── VLSI
 ├── Semiconductor
 ├── IoT
 ├── RF / Wireless
 ├── Communication
 ├── Hardware
 ├── PCB
 └── Robotics

Future:
CSE
EEE
MECH
CIVIL
etc.
```

The product should expand through taxonomy and data-model extensions rather than rewriting the core platform.

---

# 59. Product North Star

UPROOTERS should ultimately become a continuously updated representation of a student's career readiness.

```text
COLLEGE JOURNEY
       ↓
      DATA
       ↓
    EVIDENCE
       ↓
     SKILLS
       ↓
    CAREER GAP
       ↓
    ACTION PLAN
       ↓
     NEW SKILL
       ↓
     NEW EVIDENCE
       ↓
 UPDATED READINESS
```

The product is therefore not simply:

> **"Find me a job."**

It is:

> **"Understand my journey, compare my evidence with real career requirements, show me where I stand, and tell me what I can do next."**

---

# 60. Final Product Contract

The following principles are mandatory for the UPROOTERS product:

1. **Real data over fabricated data.**
2. **Evidence over unsupported claims.**
3. **Explainability over unexplained scores.**
4. **Source provenance over anonymous requirements.**
5. **Current information over silently stale information.**
6. **Student ownership over unrestricted access.**
7. **Database-enforced security over frontend-only security.**
8. **Canonical skills over uncontrolled strings.**
9. **Requirement-level evaluation over vague career scoring.**
10. **Actionable gaps over generic advice.**
11. **Historical traceability over destructive deletion.**
12. **Versioned logic over hidden changes.**
13. **Tested implementation over generated code without verification.**
14. **Small verified steps over uncontrolled full-product generation.**

---

# 61. Source of Truth Hierarchy

When documents or implementation decisions conflict, use this hierarchy:

```text
1. Product Requirements
        ↓
2. Readiness / Security Rules
        ↓
3. Database Contract
        ↓
4. Architecture
        ↓
5. Frontend Specification
        ↓
6. UI/UX Specification
        ↓
7. Implementation
```

If implementation conflicts with a higher-level specification, the implementation should be reviewed rather than silently changing the requirement.

---

# 62. Current Build Status

At the beginning of this specification:

```text
Antigravity       ✅
Git               ✅
GitHub            ✅
UPROOTERS repo    ✅
Supabase choice   ✅
PostgreSQL        ✅
Product Spec      🚧
Frontend Spec     ⏳
UI/UX Spec        ⏳
Architecture      ⏳
Database Spec     ⏳
Readiness Spec    ⏳
Security Spec     ⏳
Development Rules ⏳
Implementation    ⏳
```

The project must proceed from specification to implementation in controlled stages.

---

# 63. Immediate Next Step

After approving this document:

**Create `docs/02_FRONTEND_SPEC.md`.**

The frontend specification should translate this product definition into:

- application routes,
- screens,
- page responsibilities,
- navigation,
- component architecture,
- data states,
- user flows,
- frontend/backend boundaries,
- responsive behavior,
- and implementation requirements.

After that:

**`03_UI_UX_SPEC.md` → `04_ARCHITECTURE.md` → `05_DATABASE_SPEC.md` → remaining technical specifications → implementation in Antigravity.**

---

**End of `01_PRODUCT_SPEC.md`**