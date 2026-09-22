# UPROOTERS — Architecture Specification

## 1. Purpose

This document defines the technical architecture of UPROOTERS.

It translates the product, frontend, and UI/UX specifications into a maintainable technical structure.

This document defines:

- System boundaries
- Application layers
- Frontend architecture
- Backend architecture
- Database architecture
- Authentication
- Authorization
- Data access
- Career intelligence flow
- Readiness architecture
- Recommendation architecture
- Data provenance
- Security
- Testing
- Deployment
- Development workflow
- Scalability rules

This document does not replace:

- `01_PRODUCT_SPEC.md`
- `02_FRONTEND_SPEC.md`
- `03_UI_UX_SPEC.md`

Those documents remain higher-level sources of truth for their respective areas.

---

## 2. Architecture Principles

UPROOTERS architecture must follow these principles:

1. **Correctness before speed**
2. **Real data before fabricated data**
3. **Evidence before assumptions**
4. **Verified information before unverified information**
5. **Backend intelligence before frontend calculations**
6. **Explainability before opaque scoring**
7. **Security by default**
8. **Historical data should not be casually destroyed**
9. **Clear separation of responsibilities**
10. **Small, testable implementation steps**
11. **Maintainability before unnecessary complexity**
12. **Every major system decision should have a clear reason**

---

## 3. Core Architectural Principle

The most important architectural rule is:

> **The frontend displays intelligence; it does not own the intelligence.**

The frontend must not independently invent or calculate:

- Company requirements
- Role requirements
- Job requirements
- Readiness percentages
- Missing skills
- Recommendation priorities
- Verification status
- Data freshness
- Career data

These should come from trusted backend/database logic.

The frontend is responsible for:

- Displaying information
- Collecting student input
- Requesting data
- Presenting explanations
- Providing interactions
- Managing UI state
- Validating basic user input

The backend/data layer is responsible for:

- Storing data
- Enforcing permissions
- Validating relationships
- Calculating readiness
- Managing provenance
- Managing verification
- Maintaining historical records
- Producing recommendations

---

## 4. High-Level System Architecture

```text
                         UPROOTERS
                             │
              ┌──────────────┴──────────────┐
              │                             │
        Student Experience           Administrator
              │                             │
              └──────────────┬──────────────┘
                             │
                      React Frontend
                             │
                    TypeScript Application
                             │
                       Data Access Layer
                             │
                     Supabase Client/API
                             │
              ┌──────────────┴──────────────┐
              │                             │
        Supabase Auth                 PostgreSQL
              │                             │
              │              ┌──────────────┼──────────────┐
              │              │              │              │
              │          Student Data   Career Data   Intelligence
              │              │              │              │
              │              │              │              │
              │              └──────────────┼──────────────┘
              │                             │
              │                    Readiness Engine
              │                             │
              │                    Recommendation Logic
              │                             │
              └─────────────────────────────┘
                             │
                       Audit / Security
                             │
                      Git / GitHub / CI
                      5. Technology Stack
5.1 Frontend

Primary technologies:

React
TypeScript
Tailwind CSS

The frontend should be component-based and modular.

5.2 Backend Platform

Primary backend platform:

Supabase

Supabase provides the backend infrastructure around:

PostgreSQL
Authentication
Row-Level Security
Database functions
Database triggers
Storage where required
Backend data access
5.3 Database

Primary database:

PostgreSQL

PostgreSQL is the system of record for structured UPROOTERS data.

5.4 Version Control

Primary version control:

Git
GitHub

All meaningful development work must be committed to Git.

5.5 Development Environment

Primary development environment:

Antigravity

Antigravity is the development workspace used to plan, implement, test, and review the application.

6. Application Layers

┌────────────────────────────────────┐
│           Presentation             │
│        React + TypeScript          │
└────────────────┬───────────────────┘
                 │
┌────────────────▼───────────────────┐
│          Application Layer         │
│   Page logic / state / workflows   │
└────────────────┬───────────────────┘
                 │
┌────────────────▼───────────────────┐
│          Data Access Layer         │
│       Supabase queries/actions     │
└────────────────┬───────────────────┘
                 │
┌────────────────▼───────────────────┐
│          Backend / Database        │
│ PostgreSQL + Functions + RLS       │
└────────────────┬───────────────────┘
                 │
┌────────────────▼───────────────────┐
│       Trusted Career Data          │
│ Companies / Roles / Openings       │
│ Sources / Verification / History   │
└────────────────────────────────────┘
7. Frontend Architecture

The frontend should be organized around product domains rather than one large collection of unrelated components.

Recommended conceptual structure:
src/
├── app/
├── components/
├── features/
│   ├── dashboard/
│   ├── profile/
│   ├── academics/
│   ├── skills/
│   ├── projects/
│   ├── certifications/
│   ├── experience/
│   ├── readiness/
│   ├── companies/
│   ├── roles/
│   ├── recommendations/
│   └── career-tree/
├── layouts/
├── hooks/
├── services/
├── lib/
├── types/
├── utils/
└── styles/
8. Frontend Responsibilities

The frontend is responsible for:

Routing
Page rendering
UI state
Loading states
Error states
Forms
Interaction
Visualization
Responsive behavior
Accessibility
Displaying backend results

The frontend must not become the primary source of business rules.

9. Backend Responsibilities

The backend/database layer is responsible for:

Persistence
Relationships
Authorization
Data validation
Data integrity
Career data
Source tracking
Verification
Readiness calculations
Recommendations
Audit history
Lifecycle management

Business-critical rules must not exist only in client-side JavaScript.

10. Supabase Architecture

Supabase acts as the main backend platform.

Conceptually:
React Application
       │
       ▼
Supabase Client
       │
       ├── Authentication
       │
       ├── PostgreSQL
       │
       ├── Row-Level Security
       │
       ├── Database Functions
       │
       └── Database Triggers
       1. PostgreSQL as the System of Record

PostgreSQL is the authoritative storage layer for UPROOTERS structured data.

The database must maintain:

Student information
Academic information
Skills
Evidence
Projects
Certifications
Experience
Companies
Roles
Job openings
Requirements
Sources
Verification
Readiness evaluations
Recommendations
Audit history

The database should enforce important integrity rules wherever practical.

12. Authentication Architecture

Authentication identifies the user.

The conceptual flow is:
User
  ↓
Supabase Auth
  ↓
Authenticated User
  ↓
Application User Identity
  ↓
Role Resolution
  ↓
Authorized Application Experience
3. Application Roles

UPROOTERS defines these primary application roles:
STUDENT
DATA_EDITOR
VERIFIER
SUPER_ADMIN
Student

Can:

Manage permitted personal information
View personal academic data
Manage personal skills/evidence
Manage projects
Manage certifications
Manage experience
View readiness
View recommendations
Explore career information
Data Editor

Can manage permitted career data and data preparation workflows.

Verifier

Can verify and review career data and associated evidence.

Super Admin

Has system-level administrative responsibilities.

Exact permissions must be enforced through backend authorization and RLS.

14. Authorization Architecture

Authorization must not depend only on frontend navigation.

For example:

Student hides Admin page

is not security.

Actual security must be:

User
 ↓
Authentication
 ↓
Application Role
 ↓
Database Policy
 ↓
Allowed / Denied

Even if a user manually calls a database operation, unauthorized access must be rejected.

15. Row-Level Security

PostgreSQL Row-Level Security is a major security boundary.

Student-owned information should follow this conceptual relationship:

auth.uid()
     ↓
students.user_id
     ↓
students.id
     ↓
student-owned records

A student should only be able to access records belonging to that student.

Administrative access must be explicitly controlled through application roles.

RLS must not be treated as optional.

16. Student Data Architecture

Student information is divided into logical domains.

Student
│
├── Profile
│
├── College
│
├── Department
│
├── Academic Journey
│   ├── Semesters
│   ├── Subjects
│   ├── Attempts
│   └── Semester Results
│
├── Skills
│   └── Evidence
│
├── Projects
│
├── Certifications
│
├── Experience
│
└── Career Targets

This separation allows each area to evolve independently.

17. Academic Data Architecture

Academic data should preserve raw information separately from derived values.

Conceptually:

Student
   ↓
Semester
   ↓
Subject
   ↓
Attempt
   ↓
Marks / Grade / Credits
   ↓
Semester Summary
   ↓
CGPA

Derived values such as SGPA and CGPA should be calculated from underlying academic records rather than treated as unexplained manually entered values where possible.

Academic history should support:

Multiple semesters
Subject attempts
Arrears
Retakes
Credits
Grading schemes
Semester summaries
18. Skill Architecture

UPROOTERS uses a canonical skill taxonomy.

Example:

Embedded Systems
├── Microcontrollers
│   ├── ARM
│   ├── ESP32
│   └── Arduino
│
├── Embedded Programming
│   ├── C
│   ├── C++
│   └── Embedded C
│
└── RTOS
    └── FreeRTOS

Skills should have stable identities.

Student evidence should reference canonical skills rather than creating arbitrary skill names for every student.

19. Skill Evidence Architecture

A skill claim should be supported by evidence where possible.

Conceptually:

Canonical Skill
      ↓
Student Skill
      ↓
Evidence
      ├── Project
      ├── Certification
      ├── Internship
      ├── Experience
      ├── Academic Work
      └── Other Supported Evidence

The system should distinguish:

Claimed skill
Supported skill
Verified evidence
Unsupported claim

This distinction is important for readiness accuracy.

20. Project Architecture

Projects belong to students.

A project may contain:

Title
Description
Technologies
Skills used
Project type
Duration
Outcome
Evidence
Links where applicable

Projects can contribute evidence toward readiness requirements.

Example:

Project
   ↓
ESP32 Motor Protection System
   ↓
Skills
   ├── ESP32
   ├── Embedded C
   ├── Sensors
   ├── IoT
   └── Motor Control
21. Certification Architecture

Certifications are student-owned records.

A certification may include:

Certification name
Issuing organization
Issue date
Expiry date where applicable
Credential identifier
Verification information
Associated skills

Certifications may provide evidence for relevant requirements.

The system should not assume that every certification automatically proves proficiency.

22. Experience Architecture

Experience may include:

Internships
Work experience
Relevant practical experience
Other supported professional experience

Experience should be linked to relevant skills when evidence exists.

23. Career Data Architecture

Career intelligence is based on a structured hierarchy:

Company
   ↓
Role
   ↓
Job Opening
   ↓
Requirements
   ↓
Skills

Example:

Company
  └── Embedded Systems Engineer
          ├── C
          ├── Embedded Systems
          ├── Microcontrollers
          └── Debugging

A specific job opening may add, modify, or override requirements according to the defined requirement semantics.

24. Company Architecture

A company record should represent a stable company identity.

It may contain:

Company name
Normalized identity
Website
Status
Location information
Timestamps
Related sources

Historical information should not be casually deleted.

25. Role Architecture

A role represents a career position independent of a particular opening.

Examples:

Embedded Systems Engineer
Firmware Engineer
VLSI Design Engineer
Verification Engineer
RF Engineer

Roles may have default requirements.

A specific job opening may contain additional requirements.

26. Job Opening Architecture

A job opening represents a specific opportunity.

It may contain:

Company
Role
Title
Description
Location
Work mode
Employment type
Opening status
Source
Dates
Requirements
Verification information

Job openings have lifecycle states such as:

DRAFT
   ↓
IN_REVIEW
   ↓
PUBLISHED
   ↓
PAUSED
   ↓
CLOSED / RETIRED

The exact transition rules must be enforced according to the database specification.

27. Requirement Architecture

Requirements must distinguish at least:

REQUIRED
PREFERRED

Requirements may represent:

Skills
Degree
Branch
Academic threshold
Experience
Certification
Location
Other documented criteria

Requirements must have provenance.

The readiness engine must know where a requirement came from.

28. Effective Requirement Resolution

When both role-level and opening-level requirements exist, the system must use explicit precedence rules.

Conceptually:

Role Default Requirement
          │
          ▼
Opening Requirement Override
          │
          ▼
Effective Requirement
          │
          ▼
Readiness Engine

The system must not silently combine conflicting requirements.

Requirement inheritance and override semantics must be explicitly defined in the database/readiness implementation.

29. Career Data Provenance

Every important career-data record should have a traceable source.

Conceptually:

Career Record
     ↓
Source
     ↓
Source Link
     ↓
Verification Record
     ↓
Trust / Freshness

Possible source categories include:

Official careers page
Official job posting
Official company page
Public job board
Public recruitment post
Other public source
Discovery source

The system must distinguish source quality.

30. Verification Architecture

Career information must move through a controlled lifecycle.

Conceptually:

Discovered
   ↓
Collected
   ↓
In Review
   ↓
Verified
   ↓
Published
   ↓
Monitored
   ↓
Stale / Reverify
   ↓
Updated / Retired

Verification should be traceable.

The system must avoid presenting unverified information as equivalent to verified information.

31. Data Freshness Architecture

Career data changes over time.

Therefore the architecture must support:

Timestamps
Source records
Verification timestamps
Stale status
Lifecycle status
Historical changes
Re-verification

Example:

Published Job
      ↓
Time passes
      ↓
Source becomes stale
      ↓
Reverification
      ├── Still valid → Update verification
      └── No longer valid → Retire
32. Audit Architecture

Important changes must be traceable.

The audit system should preserve:

Actor
Action
Entity
Previous state where appropriate
New state where appropriate
Timestamp
Reason/context where appropriate

The audit history should be append-oriented.

Historical career information should not disappear simply because a current record changed.

33. Readiness Engine Architecture

The readiness engine is a backend intelligence component.

Conceptual flow:

Student Profile
      │
      ├── Academics
      ├── Skills
      ├── Evidence
      ├── Projects
      ├── Certifications
      └── Experience
              │
              ▼
       Target Requirement Set
              │
              ▼
      Requirement Evaluation
              │
              ▼
       Evidence Matching
              │
              ▼
      Blocking / Missing Analysis
              │
              ▼
        Score Calculation
              │
              ▼
      Explanation Generation
              │
              ▼
       Readiness Evaluation
34. Readiness Target Types

A readiness evaluation may target:

A role
A specific job opening

The architecture must retain which target was evaluated.

Conceptually:

Student
   │
   ├── Role Readiness
   │
   └── Job Opening Readiness
35. Readiness Evaluation

A readiness evaluation should preserve:

Student
Target
Evaluation status
Overall score
Requirement counts
Blocking requirement count
Missing requirement count
Calculation timestamp
Engine version
Evaluation snapshot

The result should be reproducible and explainable.

36. Requirement-Level Readiness

The overall score must not be the only output.

The engine should produce requirement-level results.

Example:

Embedded C
    → SATISFIED

Microcontrollers
    → SATISFIED

RTOS
    → MISSING

Linux
    → PARTIAL / INSUFFICIENT EVIDENCE

Degree
    → SATISFIED

Each result should explain the basis of the evaluation.

37. Readiness Score Architecture

The readiness percentage must be generated from documented rules.

The frontend must not invent the formula.

The backend should retain:

Score
Engine version
Evaluated requirements
Evidence considered
Blocking conditions
Explanation

This allows future changes to the scoring system without losing historical context.

38. Blocking Requirements

Some requirements may prevent a student from being considered ready even when the overall skill coverage is high.

Examples may include:

Mandatory degree
Mandatory branch
Mandatory skill
Mandatory certification
Mandatory experience

Blocking rules must be explicit and explainable.

The system must never hide a blocking requirement behind a single percentage.

39. Readiness Explanation Architecture

A readiness result should answer:

What target was evaluated?
What requirements were checked?
Which requirements are satisfied?
Which are missing?
What evidence was considered?
Which requirements are blocking?
Why did the score result?
What can the student do next?

This is essential for trust.

40. Recommendation Architecture

Recommendations should be generated from actual gaps and relevant student context.

Conceptual flow:

Readiness Evaluation
        ↓
Missing / Weak Requirements
        ↓
Priority Analysis
        ↓
Relevant Recommendation
        ↓
Student Action
        ↓
New Evidence
        ↓
Readiness Re-evaluation

Recommendations may relate to:

Skills
Projects
Certifications
Experience
Academic improvement
Career requirements

Recommendations must not be generic motivational messages disguised as intelligence.

41. Skill-Gap Intelligence Architecture

The Skill-Gap Intelligence Map is a major product feature.

Architecture:

Student Profile
      ↓
Current Evidence
      ↓
Target Role / Job
      ↓
Required Skills
      ↓
Skill Matching
      ↓
Satisfied Skills
      ↓
Missing / Weak Skills
      ↓
Evidence Gap
      ↓
Next Action

Each missing skill should be traceable to the requirement that created the gap.

42. Career Tree Architecture

The Career Tree is an exploration layer.

Conceptually:

Student Profile
      ↓
Career Domain
      ↓
Role
      ↓
Related Roles
      ↓
Requirements
      ↓
Current Evidence
      ↓
Gaps

The career tree provides information for exploration.

It must not silently choose a career for the student.

43. Career Discovery Architecture

Career discovery should use structured career data.

A student may explore:

Companies
Domains
Roles
Job openings
Requirements
Related roles
Readiness

The system should clearly distinguish:

Exploration
vs.
Readiness

Exploring a role does not mean the system is recommending that role as the student's career choice.

44. Data Access Architecture

Frontend components should not scatter raw database queries throughout the application.

Prefer:

UI Component
     ↓
Feature Logic
     ↓
Data Access Function
     ↓
Supabase

This makes the application easier to:

Test
Maintain
Refactor
Secure
Debug
45. Domain Boundaries

Major domains should remain conceptually separate.

Student Domain
Academic Domain
Skill Domain
Project Domain
Certification Domain
Experience Domain
Career Domain
Readiness Domain
Recommendation Domain
Administration Domain

Cross-domain relationships should be explicit.

46. Frontend and Backend Boundary

The frontend may request:

"Give me this student's readiness for this role."

The backend should determine:

Applicable requirements
Student evidence
Matching logic
Score
Missing requirements
Explanations

The frontend should receive a structured result.

The frontend should not reproduce the readiness engine locally.

47. Error Handling Architecture

The system should distinguish:

Validation errors
Authentication errors
Authorization errors
Missing data
Stale data
Unavailable data
Backend failures
Network failures
Unexpected system errors

The UI should present appropriate messages without exposing sensitive implementation details.

48. Loading and Empty States

Every major data-driven page must define:

Loading state
Empty state
Error state
Success state
Stale/incomplete state where applicable

Example:

Loading
   ↓
Data Available ──→ Normal UI
   │
   ├── Empty ──→ Empty State
   │
   ├── Stale ──→ Stale Data State
   │
   └── Error ──→ Error State
49. Security Architecture

Security must exist at multiple layers.

Authentication
      ↓
Authorization
      ↓
RLS
      ↓
Database Constraints
      ↓
Validated Data Access
      ↓
Audit

Security responsibilities include:

Authentication
Role enforcement
RLS
Least privilege
Safe database access
Protected administrative actions
Input validation
Secure secrets management
Auditability
50. Student Privacy

Student data must be treated as private application data.

A student should not be able to access another student's private records.

Public career data and private student data must remain conceptually separated.

PRIVATE
Student Profile
Academic Records
Skill Evidence
Projects
Certifications
Experience

PUBLIC / CONTROLLED CAREER DATA
Companies
Roles
Public Job Openings
Public Requirements
Public Sources
51. Administrative Security

Administrative interfaces must never be protected only by hiding UI elements.

Administrative operations require backend authorization.

Examples:

Editing career records
Verification
Publication
Retirement
Data correction
Audit access

must be controlled by role.

52. Database Migration Architecture

Database changes must be migration-based.

Current planned migration sequence:

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

Migration numbering must remain ordered.

Each migration should have one clear responsibility.

53. Migration Rules

Before applying a migration:

Understand the existing schema.
Check dependencies.
Check foreign keys.
Check indexes.
Check RLS.
Check triggers/functions.
Check compatibility with previous migrations.
Test the migration.
Review the resulting schema.

Do not blindly execute generated SQL.

54. Schema Compatibility

Every migration must be compatible with the existing database state.

When adding:

Columns
Tables
Indexes
Constraints
Triggers
Functions
Policies

the implementation must first verify whether equivalent objects already exist.

Avoid accidental duplication.

55. Data Integrity Architecture

Important relationships should be enforced through database constraints where practical.

Examples:

Student → College
Student → Department
Student → Semester
Semester → Subject Attempt
Student → Project
Student → Skill Evidence
Company → Role
Role → Requirement
Job Opening → Company
Job Opening → Role
Readiness → Student
Readiness → Target

Invalid relationships should be rejected.

56. Historical Data Principle

UPROOTERS should prefer lifecycle transitions over destructive deletion when historical information matters.

For example:

ACTIVE
  ↓
INACTIVE
  ↓
ARCHIVED

rather than immediately deleting the record.

This is especially important for:

Companies
Roles
Job openings
Requirements
Verification records
Audit history
57. Data Lifecycle Architecture

Important data should have lifecycle states.

Example:

Created
   ↓
Draft
   ↓
Reviewed
   ↓
Published
   ↓
Updated
   ↓
Stale
   ↓
Reverified
   │
   └────→ Retired

Lifecycle rules should be explicit.

58. External Career Data Architecture

UPROOTERS may eventually ingest career information from public sources.

The architecture should support:

Source Discovery
      ↓
Source Record
      ↓
Data Collection
      ↓
Normalization
      ↓
Validation
      ↓
Verification
      ↓
Publication
      ↓
Monitoring

Automated ingestion must not bypass verification rules.

59. Future Ingestion Architecture

Future data ingestion may require:

Ingestion jobs
Ingestion batches
Source identifiers
External IDs
Synchronization timestamps
Change detection
Duplicate detection
Error records

These should be introduced when automated ingestion becomes part of the implementation scope.

Do not add unnecessary ingestion infrastructure to the MVP before it is required.

60. External Identifier Principle

External job identifiers must be interpreted in the context of their source.

Conceptually:

Source
   +
External Job ID
   ↓
External Identity

The same identifier from two different sources must not automatically be treated as the same job.

61. AI Architecture

AI may support UPROOTERS, but AI must not become the authoritative source of career facts.

AI may assist with:

Natural-language explanations
Summarization
Profile insight generation
Gap explanations
Conversational exploration
Extracting structured information from approved sources

AI must not independently fabricate:

Company requirements
Job openings
Qualifications
Verification status
Student achievements

The database remains the source of truth.

62. AI Data Boundary

A safe conceptual flow is:

Verified Data
     ↓
Structured Backend Data
     ↓
AI Context
     ↓
AI Explanation
     ↓
Student

Not:

AI Guess
   ↓
Database Fact

AI output should be treated as generated interpretation unless explicitly backed by structured data.

63. Recommendation Safety

Recommendations must be explainable.

Example:

Missing Skill:
FreeRTOS

Why:
Required by target role.

Evidence:
No qualifying evidence found.

Suggested Action:
Complete a relevant RTOS project or obtain documented practical evidence.

Expected Effect:
May improve coverage of the RTOS requirement.

The system should not promise employment or guarantee selection.

64. Performance Architecture

Performance should be considered from the beginning.

Important principles:

Avoid unnecessary database queries
Avoid duplicate fetching
Paginate large datasets
Use indexes appropriately
Cache where justified
Avoid rendering unnecessarily large datasets
Lazy-load heavy visualizations
Optimize images
Keep animations performant

Performance optimization should not compromise correctness.

65. Responsive Architecture

The application must support:

Desktop
Tablet
Mobile

The same backend and business logic should serve all device sizes.

Responsive behavior belongs primarily to the frontend/UI layer, not the database.

66. Accessibility Architecture

Accessibility is part of the architecture, not a final cosmetic step.

The frontend should support:

Keyboard navigation
Semantic HTML
Accessible labels
Visible focus
Readable typography
Sufficient contrast
Non-color-only status indicators
Reduced-motion support
Accessible interactive visualizations where practical
67. Visualization Architecture

UPROOTERS will use visual intelligence such as:

Progress bars
Skill matrices
Requirement checklists
Timelines
Career trees
Skill-gap maps
Analytics

Visualizations must represent actual backend data.

Decorative charts without meaningful information should not be added.

68. 3D and Animation Architecture

3D interactions are a visual enhancement, not a core business dependency.

They must be:

Subtle
Purposeful
Performant
Responsive
Accessible
Optional where appropriate

The application must remain usable if motion is reduced or unavailable.

69. Image Architecture

Atmospheric imagery may be used throughout the experience.

Images should support the product's academic/career identity.

Preferred themes:

Books
Studying
Notes
Projects
Preparation
Late-night academic work
Learning
Focused work

Images must not interfere with data readability or performance.

70. State Management Architecture

State should be separated conceptually into:

UI State
    ↓
Form State
    ↓
Server/Data State
    ↓
Derived Display State

Avoid storing the same authoritative data in multiple unrelated frontend states.

Backend data remains authoritative.

71. Form Architecture

Forms should:

Validate user input
Provide clear errors
Prevent invalid submissions
Show loading states
Confirm successful saves
Handle backend validation errors
Respect authorization

Client validation improves user experience.

Backend validation remains authoritative.

72. Search Architecture

Search should distinguish between:

Student-owned search/history
Public career search
Administrative data search

Search results should respect authorization and data visibility.

Career search should use structured data rather than only client-side text filtering when the dataset becomes large.

73. Recent Search Architecture

Recent searches may be stored for the student's experience.

They should be:

User-specific
Privacy-aware
Bounded in size
Removable where appropriate

Recent searches must not become a source of career truth.

74. Dashboard Architecture

The student dashboard aggregates information from multiple domains.

Conceptually:

Student Dashboard
│
├── Motivation
├── Academic Status
├── Skill Status
├── Project / Experience Status
├── Career Readiness
├── Recommendations
└── Recent Searches

The dashboard should consume backend-derived data rather than recalculating major business logic.

75. Admin Architecture

Administrator experience shares the same technical foundation but has different permissions and workflows.

Conceptually:

Admin
 │
 ├── Career Data
 ├── Sources
 ├── Verification
 ├── Publishing
 ├── Data Quality
 ├── Audit
 └── System Monitoring

Student and administrator interfaces may have different visual palettes while remaining part of one design system.

76. Logging Architecture

The application should distinguish between:

User-visible errors
Application logs
Audit records
Database errors
Security events

Sensitive information must not be unnecessarily written to logs.

Audit records are not a replacement for operational logging.

77. Testing Architecture

Testing should exist at multiple levels.

Unit Tests
    ↓
Component Tests
    ↓
Integration Tests
    ↓
Database / RLS Tests
    ↓
Feature Tests
    ↓
End-to-End Tests

Testing priority should follow product risk.

High-risk areas include:

Authentication
Authorization
RLS
Readiness calculations
Requirement matching
Career data provenance
Recommendation logic
Data integrity
78. Readiness Engine Testing

Readiness testing must include known scenarios.

Example:

Student A
- Meets all required skills
- Meets degree requirement
- Meets academic requirement

Expected:
Requirements correctly marked satisfied.

Another:

Student B
- Missing mandatory skill

Expected:
Skill identified as missing.
Blocking status handled according to rule.
Explanation identifies requirement.

Another:

Student C
- Has related skill but not required skill

Expected:
System does not automatically claim the exact requirement is satisfied
unless the defined matching rule supports it.

This prevents false readiness.

79. RLS Testing

RLS tests should verify:

Student A → can access Student A
Student A → cannot access Student B
Student → cannot perform admin-only operation
Admin role → permitted according to policy
Unauthenticated user → denied protected access

Security tests must be performed against the database, not only the frontend.

80. Career Data Testing

Career data testing should verify:

Source exists
Source type is valid
Verification status is valid
Lifecycle status is valid
Company relationship is valid
Role relationship is valid
Requirements are traceable
Stale data is distinguishable
Historical records remain consistent
81. Environment Architecture

Environment-specific configuration should be separated.

Conceptually:

Development
     ↓
Testing / Validation
     ↓
Production

Secrets must not be committed to Git.

Environment variables should be used for environment-specific configuration.

82. Git Architecture

Git is the source-control layer.

Development should follow:

Plan
 ↓
Implement
 ↓
Test
 ↓
Review
 ↓
Commit
 ↓
Push
 ↓
Next Phase

Each major specification or implementation phase should produce a stable commit.

83. Commit Discipline

Commits should be:

Meaningful
Scoped
Descriptive
Related to one logical change

Examples:

docs: add UPROOTERS product specification
docs: add UPROOTERS frontend specification
docs: add UPROOTERS UI UX specification
docs: add UPROOTERS workspace rules
feat: add student profile foundation
fix: correct readiness requirement matching

Avoid giant commits containing unrelated changes.

84. Antigravity Development Architecture

Antigravity should be used as the controlled implementation workspace.

The agent should follow:

Specification
      ↓
Implementation Plan
      ↓
Small Change
      ↓
Test
      ↓
Review
      ↓
Commit

The agent must not interpret "build UPROOTERS" as permission to modify the entire repository without scope.

85. Agent Boundary

The development agent must:

Read relevant specifications
Inspect existing code
Inspect database state
Plan before major implementation
Make focused changes
Test changes
Report failures
Avoid unrelated modifications
Preserve existing working functionality

When requirements are ambiguous, the agent should not silently invent product behavior.

86. Architecture Decision Rules

When choosing between technical approaches:

Prefer the simpler solution when requirements are equivalent.
Prefer PostgreSQL constraints for critical data integrity.
Prefer backend enforcement over frontend assumptions.
Prefer explicit relationships over implicit conventions.
Prefer traceable data over convenient but opaque data.
Prefer reversible lifecycle transitions over destructive deletion.
Prefer canonical entities over duplicated strings.
Prefer explainable logic over opaque scoring.
Prefer modularity over premature abstraction.
Prefer measured optimization over speculative optimization.
87. What Must Not Happen

The architecture must prevent the following.

Fake career data
AI invents company requirement
        ↓
Displayed as fact

Not allowed.

Frontend-only readiness
React calculates readiness
        ↓
Database has no authoritative result

Not allowed.

Security by hiding UI
Admin button hidden
        ↓
Database still accessible

Not allowed.

Untraceable career data
Company requirement
        ↓
No source
        ↓
No verification

Not acceptable for trusted career intelligence.

Destructive history
Old career record
        ↓
DELETE

Avoid where historical context matters.

88. Core Data Flow

The complete product flow is:

                 STUDENT
                    │
                    ▼
              Profile Data
                    │
                    ▼
             Academic Data
                    │
                    ▼
              Skill Evidence
                    │
          ┌─────────┴─────────┐
          │                   │
       Projects          Experience
          │                   │
          └─────────┬─────────┘
                    │
                    ▼
             Student Profile
                    │
                    ▼
          ┌─────────────────────┐
          │  Career Data Layer  │
          │                     │
          │ Companies           │
          │ Roles               │
          │ Job Openings        │
          │ Requirements        │
          │ Skills              │
          └──────────┬──────────┘
                     │
                     ▼
             Readiness Engine
                     │
          ┌──────────┼──────────┐
          │          │          │
       Score       Gaps      Evidence
          │          │          │
          └──────────┼──────────┘
                     │
                     ▼
             Recommendations
                     │
                     ▼
                 Student
                     │
                     ▼
             New Evidence
                     │
                     ▼
              Re-evaluation

This creates a continuous college-to-career loop.

89. Complete System Relationship

The architecture can be summarized as:

             ┌───────────────────┐
             │      STUDENT      │
             └─────────┬─────────┘
                       │
                       ▼
             ┌───────────────────┐
             │  COLLEGE JOURNEY  │
             │                   │
             │ Academics         │
             │ Skills            │
             │ Projects          │
             │ Certifications    │
             │ Experience        │
             └─────────┬─────────┘
                       │
                       ▼
             ┌───────────────────┐
             │ CAREER INTELLIGENCE│
             │                   │
             │ Companies         │
             │ Roles             │
             │ Job Openings      │
             │ Requirements      │
             └─────────┬─────────┘
                       │
                       ▼
             ┌───────────────────┐
             │ READINESS ENGINE  │
             └─────────┬─────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Score          Gaps       Evidence
          │            │            │
          └────────────┼────────────┘
                       ▼
             ┌───────────────────┐
             │ RECOMMENDATIONS   │
             └─────────┬─────────┘
                       │
                       ▼
                 NEXT ACTION
                       │
                       ▼
               NEW EXPERIENCE
                       │
                       ▼
                NEW EVIDENCE
                       │
                       ▼
                 RE-EVALUATE
90. Scalability Architecture

The MVP should remain simple enough to build and maintain.

However, the architecture must allow future expansion into:

More colleges
More branches
More career domains
More companies
More job openings
Automated data ingestion
Advanced recommendation systems
Richer analytics
AI-assisted career exploration
Additional user roles
Institution-level dashboards
Employer integrations

Scalability should be achieved through clear data boundaries rather than unnecessary infrastructure.

91. Multi-College Architecture

UPROOTERS is designed for students across colleges.

The student model therefore includes:

College
   ↓
Department
   ↓
Student

Student-specific academic information must remain associated with the correct institution.

Career data should remain independent of any one college.

This allows:

College A
   └── Students

College B
   └── Students

College C
   └── Students

        ↓

Shared Career Intelligence
92. Multi-Branch ECE Architecture

The system should support multiple ECE-related academic structures without assuming one exact naming convention.

Examples may include:

ECE
Electronics and Communication Engineering
Electronics Engineering
Related electronics branches

Normalization and future taxonomy rules should prevent unnecessary duplication.

The readiness engine should use explicit matching rules rather than naïve string equality wherever broader equivalence is required.

93. Observability and Health

As the system grows, operational monitoring should cover:

Application errors
Database errors
Failed operations
Authentication failures
Performance issues
Ingestion failures
Stale career data
Readiness calculation failures

Monitoring infrastructure should be introduced according to actual deployment needs.

94. Deployment Architecture

Deployment details may evolve.

The architecture should separate:

Source Code
    ↓
Build
    ↓
Validation
    ↓
Deployment
    ↓
Production

Database migrations must be version-controlled alongside application changes.

Production database changes must not depend on undocumented manual edits.
95. Backup and Recovery

Production data should have an appropriate backup and recovery strategy.

Critical data includes:

Student records
Academic records
Career records
Verification records
Readiness evaluations
Recommendations
Audit history

Recovery planning must be considered before production launch.

96. Architecture and Product Boundaries

This document defines technical structure.

The following remain governed by their respective specifications:

01_PRODUCT_SPEC.md
→ What UPROOTERS is

02_FRONTEND_SPEC.md
→ What the frontend contains

03_UI_UX_SPEC.md
→ How the product should look and feel

04_ARCHITECTURE.md
→ How the system is technically structured

05_DATABASE_SPEC.md
→ Exact database design

06_READINESS_ENGINE.md
→ Exact readiness logic

07_SECURITY_MODEL.md
→ Detailed security rules

08_DEVELOPMENT_RULES.md
→ Detailed implementation rules

No document should silently override another.

If a conflict is discovered, it must be identified and resolved explicitly.

97. Source of Truth Hierarchy

For technical implementation:

01_PRODUCT_SPEC.md
        ↓
02_FRONTEND_SPEC.md
        ↓
03_UI_UX_SPEC.md
        ↓
04_ARCHITECTURE.md
        ↓
05_DATABASE_SPEC.md
        ↓
06_READINESS_ENGINE.md
        ↓
07_SECURITY_MODEL.md
        ↓
08_DEVELOPMENT_RULES.md
        ↓
Implementation

More specific implementation specifications may define implementation details within their scope.

The product contract remains the ultimate product-level source of truth.

98. Architecture Review Checklist

Before major implementation, verify:

Product
 Product requirements are understood.
 Scope is defined.
 Non-goals are respected.
Frontend
 Frontend responsibilities are clear.
 Business logic is not unnecessarily duplicated.
 UI follows the frontend specification.
Backend
 Backend responsibilities are clear.
 Critical business logic is protected.
Database
 Relationships are valid.
 Constraints are present.
 RLS is considered.
 Historical data is protected.
Career Data
 Sources are traceable.
 Verification exists.
 Freshness is represented.
 Lifecycle is defined.
Readiness
 Requirements are explicit.
 Evidence is traceable.
 Blocking conditions are explicit.
 Score is explainable.
Security
 Authentication is enforced.
 Authorization is enforced.
 RLS is tested.
 Secrets are protected.
Development
 Migration is versioned.
 Tests exist.
 Git checkpoint exists.
 No unrelated files were changed.
99. Definition of Done

An architecture implementation is not considered complete merely because the application runs.

The implementation must:

Follow the approved specifications
Maintain clear layer boundaries
Use the defined database architecture
Enforce authorization
Protect student data
Preserve career-data provenance
Produce explainable readiness results
Support testing
Maintain migration history
Avoid fabricated career information
Avoid unnecessary duplication
Remain maintainable
Pass relevant tests
Have a clean Git checkpoint
100. Final Architecture Principle

UPROOTERS is not simply a student dashboard.

It is an evidence-driven academic-to-career intelligence system.

The architecture therefore follows:

COLLEGE JOURNEY
      ↓
STUDENT EVIDENCE
      ↓
TRUSTED CAREER DATA
      ↓
REQUIREMENT MATCHING
      ↓
READINESS INTELLIGENCE
      ↓
SKILL GAPS
      ↓
RECOMMENDATIONS
      ↓
NEXT ACTION
      ↓
NEW EVIDENCE
      ↓
UPDATED READINESS

The system should always answer these questions using traceable data:

Where am I now?

What have I achieved?

What skills do I actually have evidence for?

What career paths and opportunities exist?

What do those opportunities require?

Which requirements do I satisfy?

Which requirements are missing?

Why is something considered missing?

What evidence could close the gap?

What should I work on next?

The architecture exists to make those answers accurate, explainable, secure, maintainable, and grounded in real data.