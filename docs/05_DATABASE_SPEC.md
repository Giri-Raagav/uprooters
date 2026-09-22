# UPROOTERS — Database Specification

## 1. Purpose

This document defines the complete database contract for UPROOTERS.

The database is responsible for storing, validating, protecting, and serving:

- Student profiles
- Colleges and departments
- Academic records
- Subjects and semester performance
- Skills and skill evidence
- Projects
- Certifications
- Experience
- Companies
- Career roles
- Job openings
- Career requirements
- Sources and provenance
- Verification records
- Historical changes
- Readiness evaluations
- Requirement-level readiness results
- Recommendations
- Career intelligence data

The database must support the product principles defined in:

- `01_PRODUCT_SPEC.md`
- `02_FRONTEND_SPEC.md`
- `03_UI_UX_SPEC.md`
- `04_ARCHITECTURE.md`

The database is the system of record for UPROOTERS.

---

## 2. Database Principles

The database must follow these principles:

1. Correctness before convenience.
2. Real data before fabricated data.
3. Evidence before assumptions.
4. Provenance for external career data.
5. Verification before publication.
6. Historical records must be preserved where required.
7. Student data must be isolated between students.
8. Authorization must be enforced at the database layer.
9. Readiness results must be explainable.
10. Career requirements must be time-aware.
11. Database constraints must prevent invalid states.
12. Migrations must be deterministic and reviewable.
13. Destructive operations must be minimized.
14. The frontend must not be the source of truth.
15. Derived values must remain distinguishable from raw facts.

---

## 3. PostgreSQL and Supabase Architecture

UPROOTERS uses:

- PostgreSQL as the relational database.
- Supabase as the managed backend platform.
- Supabase Auth for authentication.
- PostgreSQL Row-Level Security for authorization enforcement.
- PostgreSQL functions for trusted database operations.
- PostgreSQL triggers for integrity and lifecycle automation.
- SQL migrations for schema versioning.

The architecture must keep business-critical data inside PostgreSQL rather than relying exclusively on frontend state.

---

## 4. Schema Organization

The primary application schema is:

```text
public
5. Naming Conventions

Database naming must use:

lowercase
snake_case
singular semantic concepts for columns
plural table names

Examples:

student_id
college_id
created_at
updated_at
verification_status
job_opening_id

Tables:

students
colleges
departments
skills
companies
roles
job_openings

Avoid:

StudentData
studentData
Student_Profile
student-data

Database naming must remain consistent across all migrations.

6. UUID and Primary Keys

Application entities should use UUID primary keys.

Example:

id uuid primary key default gen_random_uuid()

UUIDs are preferred because they:

reduce predictable identifiers
support distributed workflows
avoid exposing sequential record counts
work well with Supabase
simplify future multi-environment data movement

Primary keys must not be reused.

Once an entity is deleted or archived, its identifier must not be reassigned to another entity.

7. Timestamp Standards

Timestamp columns should use timezone-aware timestamps.

Primary timestamp fields:

created_at
updated_at

Where required, additional timestamps may include:

published_at
verified_at
retired_at
archived_at
calculated_at
started_at
completed_at

Timestamps should represent actual database events.

The database should provide timestamps using trusted server-side values rather than trusting arbitrary client-provided timestamps.

8. Authentication and Users

Supabase Auth is responsible for authentication.

The authentication identity is represented by:

auth.users

UPROOTERS application tables should reference authenticated users through UUID relationships.

Student application identity is represented separately through:

public.students

The relationship is:

auth.users
      │
      │ user_id
      ▼
public.students

Authentication identity and student profile data must not be treated as the same database concept.

9. Application Roles

UPROOTERS defines these application roles:

student
data_editor
verifier
super_admin

The roles represent application authorization levels.

Role assignment must be stored in:

public.user_roles

The database must not rely only on frontend role information.

10. Colleges

The colleges table stores institutions represented in UPROOTERS.

Core fields include:

id
name
normalized_name
slug
website
city
state
country
status
created_at
updated_at

The college name must not be blank.

College identity should use normalized values to reduce accidental duplicates.

Example:

Rajalakshmi Institute of Technology
rajalakshmi institute of technology

must resolve to one canonical institution when they represent the same institution.

11. Departments

The departments table represents academic departments belonging to colleges.

Core relationship:

college
   │
   └── departments

A department must belong to exactly one college.

Important fields include:

id
college_id
name
normalized_name
short_name
status
created_at
updated_at

A department name must be unique within its college.

The same department name may exist in different colleges.

12. Students

The students table stores the primary student profile.

Core fields include:

id
user_id
college_id
department_id
first_name
last_name
display_name
degree
branch
admission_year
expected_graduation_year
current_semester
date_of_birth
profile_photo_url
bio
location
country
profile_completed
is_active
created_at
updated_at

The student must belong to a valid college.

If a department is specified, it must belong to the student's college.

The database must prevent a student from referencing a department belonging to another college.

13. Academic Structure

Academic data must be represented as structured relational data.

The database should distinguish:

Student
   ↓
Semester
   ↓
Subject
   ↓
Subject Attempt
   ↓
Grade / Marks / Credits

Raw academic records must remain distinguishable from derived values such as:

SGPA
CGPA
percentage
academic standing

Derived values must not overwrite original academic evidence.

14. Semesters

The student_semesters structure represents a student's academic progression.

Typical fields:

id
student_id
semester_number
academic_year
semester_label
start_date
end_date
status
created_at
updated_at

Semester numbers must follow valid academic ranges defined by the program.

For the current product, the database should support at least eight semesters while remaining extensible.

15. Subjects

Subjects represent academic courses.

Subject data may include:

id
code
name
credits
department_id
subject_type
created_at
updated_at

Subject identity should not depend solely on the display name.

Subject codes should be preserved where available.

The design should support:

theory
laboratory
project
elective
mandatory courses
other institution-defined categories
16. Student Subject Attempts

A student's actual academic attempt must be stored separately from the canonical subject.

Relationship:

subjects
   │
   ▼
student_subject_attempts
   ▲
   │
students

This supports:

first attempts
arrears
retakes
improved grades
repeated subjects

The database must not overwrite historical attempts when a student retakes a subject.

17. Semester Summaries

Semester summaries store derived academic results.

Typical fields:

student_id
semester_id
sgpa
attempted_credits
earned_credits
backlogs
calculation_version

The summary must be distinguishable from raw subject records.

The database should preserve the underlying subject attempts so SGPA/CGPA calculations remain explainable.

18. CGPA Architecture

CGPA is a derived academic value.

The database should calculate or validate CGPA from structured academic records where sufficient information exists.

Conceptually:

Subject Attempts
       ↓
Semester Results
       ↓
SGPA
       ↓
Credit-weighted calculation
       ↓
CGPA

A helper function such as:

calculate_student_cgpa(student_id)

may be used by the readiness engine.

The calculation method must be documented and versioned if institutional grading schemes differ.

19. Skills

The skills table stores canonical UPROOTERS skills.

Examples:

C
C++
Python
Embedded C
Microcontrollers
ESP32
Verilog
SystemVerilog
VLSI
PCB Design
LoRa
IoT
RF
DSP
Git
Linux
SQL
Machine Learning

Skills must have stable identifiers.

Skill names should not be used as the only relationship key.

20. Skill Categories

Skills should belong to controlled categories.

Initial categories include:

PROGRAMMING
EMBEDDED
RTOS
MICROCONTROLLERS
VLSI
FPGA
SEMICONDUCTOR
ELECTRONICS
HARDWARE
PCB
COMMUNICATION
RF_WIRELESS
IOT
ROBOTICS
SOFTWARE
TOOLS
OTHER

The category system may expand over time.

A category must not be used as a substitute for the canonical skill identity.

21. Skill Hierarchy

Skills may have parent-child relationships.

Example:

Embedded Systems
    ├── Embedded C
    ├── Microcontrollers
    └── RTOS
          └── FreeRTOS

A skill may reference another skill as its parent.

The database must prevent:

self-parenting
invalid parent references
circular hierarchies

Future implementations should include explicit cycle protection.

22. Skill Aliases

Skills may contain aliases for search and normalization.

Example:

ESP32
aliases:
- ESP-32
- Espressif ESP32

Aliases are discovery aids.

Aliases must not automatically create separate canonical skills.

The system should map recognized aliases to canonical skill IDs.

23. Student Skills

A student skill relationship represents a student's claimed or established skill.

Typical structure:

student_id
skill_id
proficiency_level
status
confidence
created_at
updated_at

Student skills must be distinguishable from evidence.

A student claiming:

Python

does not automatically mean the system has verified Python proficiency.

24. Skill Evidence

Skill evidence provides support for a student's skill.

Evidence may originate from:

academic coursework
project work
certification
internship
employment
assessment
portfolio
manually verified evidence

Relationship:

Student
   ↓
Skill
   ↓
Evidence

Evidence should contain enough metadata to explain why a skill is considered supported.

25. Projects

Projects represent practical work completed by students.

Core fields may include:

id
student_id
title
description
project_type
start_date
end_date
status
repository_url
demo_url
verification_status
created_at
updated_at

Projects are student-owned data.

The database must prevent one student from modifying another student's project through normal student permissions.

26. Project Skills

Projects may be linked to canonical skills.

Relationship:

projects
    │
    └── project_skills
            │
            └── skills

This relationship provides evidence for readiness.

Example:

Project:
Intelligent Machine Health System

Skills:
ESP32
Embedded C
IoT
Sensors
Motor Control

Project-skill relationships must not automatically imply high proficiency.

27. Certifications

Certifications represent formal learning or credential evidence.

Typical fields:

id
student_id
name
issuer
credential_id
credential_url
issue_date
expiry_date
verification_status
description
created_at
updated_at

Certification records should preserve the issuing organization.

Expired certifications should not necessarily be deleted.

Their lifecycle should remain visible where historically relevant.

28. Certification Skills

Certifications may be associated with canonical skills.

Example:

Certification
     ↓
Python
     ↓
Data Analysis
     ↓
Machine Learning

The relationship provides supporting evidence but should not automatically prove practical proficiency.

The readiness engine should consider the evidence type when evaluating requirements.

29. Experience

Experience represents internships, employment, apprenticeships, research, or other structured practical experience.

Possible fields:

id
student_id
organization
role_title
employment_type
start_date
end_date
description
verification_status
created_at
updated_at

Experience must support historical records.

A completed internship must not be deleted merely because it has ended.

30. Experience Skills

Experience may be associated with skills used during the experience.

Example:

Internship
    ↓
Embedded Systems
    ↓
Embedded C
    ↓
Microcontrollers

Skill associations must represent actual evidence rather than automatically generated assumptions.

31. Companies

The companies table stores canonical company identities.

Core fields may include:

id
name
normalized_name
slug
website
industry
description
status
created_at
updated_at

Company identity must be normalized.

Company records must not be duplicated merely because different public sources use slightly different formatting.

32. Roles

Roles represent career roles independent of individual job openings.

Examples:

Embedded Systems Engineer
Firmware Engineer
VLSI Design Engineer
Verification Engineer
RF Engineer
IoT Engineer
Hardware Engineer

A role may be associated with multiple companies and multiple openings.

Relationship:

Company
   ↓
Role
   ↓
Job Opening
33. Job Openings

Job openings represent specific opportunities.

Core information may include:

id
company_id
role_id
title
description
location
work_mode
employment_type
source_id
external_id
status
published_at
closing_date
created_at
updated_at

A job opening must not be confused with a generic career role.

Example:

Role:
Embedded Systems Engineer

Opening:
Embedded Systems Engineer — Bengaluru — Job ID 12345
34. Career Requirements

Requirements describe what a role or opening expects.

Requirement information may include:

requirement_type
requirement_text
skill_id
required_value
source
verification_status

Requirements may represent:

required skills
preferred skills
academic requirements
degree requirements
branch requirements
experience requirements
certification requirements
location/work-mode requirements
other documented eligibility conditions
35. Role-Skill Requirements

Generic role requirements may be represented through:

role_skills

This allows:

Role
   ↓
Required / Preferred Skill

Example:

Firmware Engineer
    ├── Embedded C — REQUIRED
    ├── Microcontrollers — REQUIRED
    ├── RTOS — PREFERRED
    └── Git — REQUIRED

The relationship itself is career data and therefore should be traceable to its source.

36. Job-Specific Requirements

Individual job openings may contain requirements that differ from the generic role.

Future or extended schema should support:

job_opening_skills

This is important because:

Role requirements
        +
Opening-specific requirements
        ↓
Effective requirements

A job opening may add, remove, or override requirements where the source explicitly supports such differences.

37. Effective Requirement Resolution

The readiness engine must not simply read role requirements and ignore opening-specific requirements.

Effective requirements should be resolved using explicit precedence.

Recommended conceptual rule:

Job Opening Override
        ↓
Role Default
        ↓
No Requirement

If an opening-specific requirement exists for a requirement dimension, it takes precedence over the generic role requirement.

If no opening-specific value exists, the role requirement is inherited.

The inheritance behavior must be deterministic.

38. Career Data Sources

Every external career-data record should have a traceable source whenever practical.

Source types include:

OFFICIAL_CAREERS_PAGE
OFFICIAL_JOB_POSTING
OFFICIAL_COMPANY_PAGE
PUBLIC_JOB_BOARD
PUBLIC_RECRUITMENT_POST
OTHER_PUBLIC_SOURCE
DISCOVERY_SOURCE

The source record should identify:

source type
publisher
URL where applicable
captured date
trust tier
source status
39. Source Links

Source links connect stored career information to external evidence.

Examples:

Company → Official Website
Role → Career Page
Job Opening → Official Job Posting
Requirement → Source Evidence

A source link should preserve the original location where the information was obtained.

External pages may change or disappear.

The database must therefore preserve capture metadata and historical records.

40. Verification Records

Verification records document whether external career information has been reviewed.

Verification statuses:

PENDING
VERIFIED
REJECTED
STALE

Verification levels include:

OFFICIAL_SOURCE
OFFICIAL_ATS
CORROBORATED_PUBLIC_SOURCE
MANUALLY_CURATED
UNVERIFIED

Verification must be distinguishable from discovery.

Finding a source does not automatically mean the information is verified.

41. Data Freshness

Career information is time-sensitive.

A job opening that was valid yesterday may be closed today.

The database should therefore support:

published_at
last_checked_at
verified_at
closing_date
retired_at

Freshness rules must be defined independently from verification.

A record may be:

Verified but old

or:

Recent but not verified

These states must not be treated as identical.

42. Change History

The change_history table stores important database changes.

Possible fields:

id
entity_type
entity_id
action
actor_type
actor_id
before_data
after_data
created_at

Change history should support auditability.

Important actions include:

CREATE
UPDATE
DELETE_REQUESTED
ARCHIVE
PUBLISH
UNPUBLISH
VERIFY
REJECT
RETIRE
RESTORE
43. Audit Architecture

Audit records must be append-oriented.

The system should avoid allowing ordinary users to rewrite historical audit records.

Audit history must answer:

What changed?
When did it change?
Who or what changed it?
What was the previous state?
What is the new state?

System-generated changes should be distinguishable from human changes.

44. Readiness Evaluations

A readiness evaluation represents one calculation of a student's readiness for a target.

Targets may be:

ROLE
JOB_OPENING

Typical fields:

id
student_id
target_type
role_id
job_opening_id
status
overall_score
requirement_count
satisfied_count
missing_count
blocking_count
calculated_at
engine_version
snapshot
created_at
updated_at

Each evaluation represents a point-in-time calculation.

45. Requirement Results

Each readiness evaluation may contain multiple requirement-level results.

Example:

Requirement:
Embedded C

Result:
SATISFIED

Evidence:
2 projects
1 certification
1 academic subject

Possible result categories:

SATISFIED
PARTIALLY_SATISFIED
MISSING
UNSUPPORTED
NOT_APPLICABLE

Requirement-level results are necessary for explainability.

46. Readiness Snapshots

A readiness evaluation should preserve the state used to calculate the result.

A snapshot may contain:

target information
effective requirements
student evidence references
engine version
calculation inputs
calculated result
timestamp

This prevents historical evaluations from becoming impossible to interpret after the underlying career data changes.

47. Recommendations

Recommendations are actions generated from identified student needs.

Examples:

Learn Embedded C
Build an ESP32 project
Complete a Verilog project
Improve CGPA
Obtain a relevant certification
Gain internship experience

Recommendations must connect to actual evidence and requirements wherever possible.

They must not become generic motivational content.

48. Recommendation Skills

A recommendation may target one or more skills.

Example:

Recommendation:
Build an RTOS-based ESP32 project

Skills:
ESP32
RTOS
FreeRTOS
Embedded Systems

The relationship allows recommendations to be connected to skill gaps.

49. Recommendation Targets

Recommendations may target:

Role
Job Opening
Skill
Academic Requirement
Career Domain
Profile Area

Example:

Missing Skill
     ↓
Recommendation
     ↓
Target Role

Target relationships should be explicit.

50. Recommendation Evidence

Recommendations should be explainable.

Example:

Why recommended?

Target role requires:
RTOS

Student evidence:
No RTOS evidence found

Recommendation:
Complete an RTOS-based embedded project

The database should preserve references to the evidence or requirement that triggered the recommendation.

51. Career Tree Data

The Career Tree is a structured representation of possible career paths.

Conceptual structure:

Student Profile
      ↓
Career Domain
      ↓
Role
      ↓
Related Roles
      ↓
Career Paths

The database should store relationships that support exploration.

The database must not encode a mandatory career decision for the student.

52. Skill-Gap Data

Skill-gap information should be derived from:

Student Skills
+
Student Evidence
+
Effective Requirements

Conceptually:

Student Evidence
       ↓
Current Skill State
       ↓
Target Requirements
       ↓
Comparison
       ↓
Skill Gap

Skill-gap records must remain explainable.

A gap must identify what requirement is missing or insufficiently supported.

53. Foreign-Key Strategy

Foreign keys should be used wherever relationships represent strong ownership or identity.

Examples:

students.college_id → colleges.id

students.department_id → departments.id

projects.student_id → students.id

role_skills.role_id → roles.id

role_skills.skill_id → skills.id

job_openings.company_id → companies.id

Foreign keys prevent orphaned relationships.

Delete behavior must be carefully chosen.

54. Delete and Archive Rules

UPROOTERS should prefer archival over destructive deletion for important career and historical records.

Do not casually delete:

historical job openings
verification history
audit records
academic attempts
completed projects
completed certifications
past experience
historical readiness evaluations

Use statuses such as:

ACTIVE
INACTIVE
ARCHIVED
RETIRED
CLOSED

where appropriate.

55. Historical Data Rules

Historical data must remain interpretable.

Examples:

Past job opening
Past readiness evaluation
Past verification
Past academic attempt
Past internship

should retain their historical meaning.

If a requirement changes later, old readiness evaluations should not silently change.

This is why readiness snapshots and engine versions are required.

56. Data Lifecycle

Typical career-data lifecycle:

DISCOVERED
    ↓
PENDING REVIEW
    ↓
VERIFIED
    ↓
PUBLISHED
    ↓
ACTIVE
    ↓
STALE / PAUSED
    ↓
RETIRED / CLOSED

Not every entity uses every state.

Student-owned data follows a different lifecycle.

The lifecycle must be explicitly defined per entity type.

57. Constraints

Database constraints should enforce basic validity.

Examples:

non-empty names
valid UUID relationships
valid semester numbers
valid score ranges
valid percentages
valid date relationships
valid status values
unique normalized identities

Readiness score:

0 <= overall_score <= 100

Semester number must remain within the supported academic range.

58. Indexing Strategy

Indexes should support common access patterns.

Important indexes include:

students.user_id
students.college_id
students.department_id

departments.college_id

student_semesters.student_id

student_subject_attempts.student_id
student_subject_attempts.subject_id

student_skills.student_id
student_skills.skill_id

projects.student_id
project_skills.project_id
project_skills.skill_id

companies.normalized_name
roles.normalized_name

job_openings.company_id
job_openings.role_id
job_openings.status

role_skills.role_id
role_skills.skill_id

readiness_evaluations.student_id
readiness_requirement_results.evaluation_id

Indexes should be added based on measured query patterns as the product grows.

59. Normalization Strategy

Canonical entities should be normalized.

Examples:

companies
skills
roles
colleges
departments
subjects

must not be duplicated unnecessarily.

A normalized identity may use:

lower(btrim(name))

through a generated column such as:

normalized_name

The database should enforce uniqueness on normalized identity where appropriate.

60. Denormalization Rules

Denormalization is allowed only when it has a clear purpose.

Valid reasons include:

performance
historical snapshots
search optimization
analytics
preserving calculation inputs

Denormalized values must have a defined source of truth.

Example:

readiness_evaluations.overall_score

is derived from the readiness calculation but becomes part of the historical evaluation record.

61. Row-Level Security Architecture

RLS is a core security boundary.

RLS must be enabled on student-owned tables.

The general ownership chain is:

auth.uid()
    ↓
students.user_id
    ↓
students.id
    ↓
student-owned row.student_id

A student must only access their own student-owned records.

62. Student Data Access

Students may access:

their profile
their academics
their skills
their evidence
their projects
their certifications
their experience
their readiness evaluations
their recommendations
their searches

Students must not access another student's private records.

Students must not bypass RLS through manipulated client requests.

63. Administrator Data Access

Administrative access depends on role.

Administrators may access broader data only when their role authorizes it.

Administrative roles include:

data_editor
verifier
super_admin

Access should follow least privilege.

A user must not receive super-admin permissions simply because the frontend displays an administrator interface.

64. Data Editor Access

Data editors are responsible for maintaining career information.

Typical permissions:

create career data
edit career data
manage source records
prepare records for verification

They should not automatically receive unrestricted verification authority.

This separates data creation from verification.

65. Verifier Access

Verifiers review career information.

They may:

review sources
verify requirements
reject unsupported information
mark records stale
approve information for publication

Verification actions must be auditable.

A verifier should not be able to silently rewrite historical verification records.

66. Super Admin Access

Super admins manage system-level operations.

Potential permissions include:

manage application roles
manage administrative configuration
manage data lifecycle
review audit information
perform controlled recovery actions

Super-admin access must remain tightly controlled.

It must not be exposed through a client-side trust mechanism.

67. Grants

Database grants should follow least privilege.

Anonymous users should not receive write access to protected application tables.

Authenticated users should receive only the database privileges required by the application.

Sensitive helper functions should use appropriate execution privileges and schema visibility.

Grants must complement RLS rather than replace it.

68. Database Functions

Database functions may be used for:

trusted calculations
authorization helpers
validation
readiness calculations
normalization
audit support
data integrity checks

Examples:

has_app_role()
is_super_admin()
is_data_editor()
is_verifier()
calculate_student_cgpa()

Functions must be reviewed for:

execution context
search path safety
privilege escalation
input validation
deterministic behavior
69. Database Triggers

Triggers may be used for:

updated_at
audit history
validation
publication checks
target integrity
data lifecycle

Triggers must remain understandable.

Business logic should not become so deeply hidden inside triggers that application behavior becomes difficult to reason about.

70. Generated Columns

Generated columns may be used for deterministic normalization.

Example:

normalized_name text
generated always as (lower(btrim(name))) stored

Generated columns should be used where the transformation is:

deterministic
repeatable
database-safe

Application code must not be trusted as the only source of normalization.

71. Validation Rules

Validation must occur at the appropriate layer.

Frontend validation:

user experience

Backend/database validation:

security
integrity
data correctness

Critical rules must be enforced by the database where possible.

Examples:

score range
required ownership
valid foreign keys
valid statuses
valid target type
72. Data Integrity

Data integrity means that stored relationships represent valid product concepts.

Examples:

A student cannot belong to a department from another college.

A project cannot belong to two students.

A job opening cannot reference a nonexistent company.

A role skill cannot reference a nonexistent role.

A readiness result cannot belong to a nonexistent evaluation.

Integrity rules must be enforced structurally whenever possible.

73. Provenance Integrity

Career requirements must remain traceable.

For important external data, the system should answer:

Where did this requirement come from?
When was it collected?
Was it verified?
Who verified it?
What source supported it?
Is it stale?

A requirement without adequate provenance must not silently appear equivalent to verified career data.

74. Verification Integrity

Verification must be a separate state from source discovery.

Example:

Source discovered
      ↓
Data extracted
      ↓
Pending review
      ↓
Verified
      ↓
Published

A public webpage may be a valid source while the extracted requirement is still awaiting verification.

75. Readiness Integrity

Readiness must be calculated from:

Student Profile
+
Academic Data
+
Skills
+
Evidence
+
Effective Career Requirements

The database must preserve enough information to explain the calculation.

The readiness engine must not fabricate:

missing skills
experience
academic qualifications
certifications
job requirements
76. Migration Architecture

All schema changes must be implemented through ordered SQL migrations.

Example:

001_initial_schema.sql
002_seed_phase1_taxonomy.sql
003_student_profile.sql
004_academic_system.sql
005_student_skills_evidence.sql
006_projects_certifications.sql
007_readiness_engine.sql
008_recommendations.sql
009_student_rls.sql
010_complete_schema.sql

Migrations must be:

ordered
reviewable
deterministic
reproducible
committed to Git
77. Migration Order

The migration dependency order is:

Authentication
      ↓
Core schema
      ↓
Taxonomy
      ↓
Student profile
      ↓
Academic system
      ↓
Skills and evidence
      ↓
Projects / certifications / experience
      ↓
Readiness engine
      ↓
Recommendations
      ↓
RLS hardening
      ↓
Validation / complete schema

A migration must not reference a table or column that has not been created earlier in the migration sequence.

78. Seed Data

Seed data is controlled reference data.

Initial skill taxonomy may include:

C
C++
Python
Java
MATLAB
Embedded C
Embedded Systems
Microcontrollers
ARM
ESP32
Arduino
RTOS
FreeRTOS
Digital Electronics
Analog Electronics
VLSI
Verilog
SystemVerilog
RTL Design
FPGA
ASIC Design
UVM
PCB Design
KiCad
Altium Designer
Communication Systems
DSP
RF
Wireless Communication
Antenna
LoRa
Bluetooth
Wi-Fi
IoT
IoT Protocols
Edge Computing
Edge AI
Robotics
ROS
Control Systems
Git
Linux
SQL
Embedded Software
Firmware Development
Hardware Design
Hardware Verification
IC Verification
SoC Design
RF Engineering
Network Engineering
Data Analysis
Machine Learning

Seed data must be idempotent where practical.

79. Future Ingestion

Future career-data ingestion may collect information from public sources.

The ingestion architecture should support:

Discovery
    ↓
Collection
    ↓
Normalization
    ↓
Deduplication
    ↓
Validation
    ↓
Verification
    ↓
Publication

Automated ingestion must not automatically make unverified data equivalent to verified data.

Future ingestion should have run/batch tracking.

80. External Identifiers

External job identifiers must be treated carefully.

A job ID from one source may collide with an ID from another source.

Therefore, external identity should be source-aware.

Conceptually:

source_id + external_id

rather than:

external_id alone

This reduces duplicate and collision risk.

81. Job Opening Identity

A job opening should have a stable internal UUID.

External identifiers may change or disappear.

The internal identifier remains the UPROOTERS identity.

A job opening may therefore contain:

internal UUID
source ID
external job ID
source URL

This separates internal identity from external identity.

82. Duplicate Prevention

Duplicate prevention should operate at multiple levels.

Examples:

Company identity
Role identity
Job opening identity
Skill identity
Source identity
External job identity

Normalization should reduce accidental duplicates.

However, normalization alone must not merge two genuinely different entities.

Human review may be required for ambiguous cases.

83. Search Optimization

Search should operate primarily on canonical data.

Search may use:

name
normalized_name
aliases
description
skill category
company
role
location

Future PostgreSQL full-text or specialized search may be introduced if needed.

Search indexes should be added based on actual usage.

84. Performance

Database performance must prioritize common operations.

Important query patterns include:

Load student dashboard
Load student profile
Load academic history
Load skills
Load projects
Calculate readiness
Load target requirements
Load company roles
Load job openings
Load recommendations

Avoid unnecessary N+1 queries.

Large career-data tables should use appropriate indexes and pagination.

85. Scalability

The architecture must support growth from:

one student

to:

multiple colleges
multiple branches
thousands of students
thousands of companies
many roles
many job openings
large requirement datasets

Scalability must not require abandoning the relational model prematurely.

PostgreSQL should remain the primary system of record.

86. Backup and Recovery

Production database operations must include backup and recovery planning.

The system should protect against:

accidental deletion
migration failure
data corruption
operational mistakes
service failure

Recovery procedures must be tested rather than assumed.

Important historical records should not depend solely on live mutable tables.

87. Environment Separation

UPROOTERS should separate environments where practical:

Development
Testing / Staging
Production

Development data must not automatically be treated as production data.

Production credentials must not be committed to Git.

Environment-specific configuration belongs outside the source-controlled application code when it contains secrets.

88. Database Security

Security requirements include:

RLS
least-privilege grants
secure authentication
protected service credentials
controlled administrative access
audit logging
validated database functions
no anonymous writes to protected tables
safe migration practices

The frontend must never be trusted as the only security boundary.

89. Privacy

Student information is private application data.

Sensitive student records must not be exposed through public career-data endpoints.

The database must separate:

student private data

from:

public career intelligence data

Student data should only be exposed according to authorized application access.

90. Database Testing

Database testing must cover:

schema creation
foreign keys
constraints
indexes
functions
triggers
RLS
grants
seed data
readiness calculations
historical behavior
migration compatibility

Tests should include both valid and invalid operations.

91. RLS Testing

RLS testing must explicitly verify isolation.

At minimum:

Student A cannot read Student B data.

Student A cannot update Student B data.

Student A cannot delete Student B data.

Student A can read their own data.

Authorized administrators can access permitted data.

Unauthorized users cannot bypass ownership.

RLS tests must be executed against actual database policies rather than only frontend behavior.

92. Migration Testing

Before applying a migration:

Review
   ↓
Validate syntax
   ↓
Apply to test database
   ↓
Run integrity checks
   ↓
Run RLS tests
   ↓
Run application tests
   ↓
Review results

Migrations must not be considered safe merely because they execute successfully.

93. Data Quality Testing

Career data quality checks should include:

duplicate companies
duplicate roles
duplicate openings
missing sources
invalid URLs
stale records
unverified requirements
missing skill mappings
orphan relationships
invalid statuses

Student data quality checks may include:

invalid semesters
invalid grades
duplicate evidence
invalid project dates
inconsistent college/department relationships
94. Production Safety

Production database changes require caution.

Never casually run:

DROP TABLE
DROP COLUMN
DELETE FROM
TRUNCATE

against production data.

Destructive operations must require explicit review.

Schema changes should normally use migrations.

Historical records should be archived rather than destroyed where appropriate.

95. Database Source of Truth

The source-of-truth hierarchy is:

PostgreSQL database
        ↓
Backend/database functions
        ↓
Frontend data access
        ↓
Frontend state
        ↓
UI presentation

The UI must not become the source of truth.

For career information:

Verified source-backed database record
        ↓
Readiness engine
        ↓
Frontend explanation

The frontend must display what the trusted data layer provides.

96. Relationship Map

The major database relationships are:

auth.users
    │
    ▼
students
    │
    ├── colleges
    │      └── departments
    │
    ├── student_semesters
    │      └── student_subject_attempts
    │              └── subjects
    │
    ├── student_skills
    │      └── skills
    │
    ├── skill_evidence
    │
    ├── projects
    │      └── project_skills
    │
    ├── certifications
    │      └── certification_skills
    │
    ├── experience
    │      └── experience_skills
    │
    ├── readiness_evaluations
    │      └── readiness_requirement_results
    │
    └── student_recommendations

Career-data side:

companies
    │
    └── roles
          │
          ├── role_skills
          │       └── skills
          │
          └── job_openings
                  │
                  └── job-specific requirements

Provenance:

career data
    ↓
sources
    ↓
source_links
    ↓
verification_records
    ↓
change_history
97. Complete Data Flow

The complete UPROOTERS data flow is:

Student Input
      ↓
Student Profile
      ↓
Academic Records
      ↓
Skills + Evidence
      ↓
Projects / Certifications / Experience
      ↓
Student Capability State
      │
      │
      ├──────────────────────────┐
      │                          │
      ▼                          ▼
Career Database            Career Requirements
      │                          │
      ├── Companies              │
      ├── Roles                 │
      └── Job Openings          │
                 │              │
                 └──────┬───────┘
                        ▼
                Effective Requirements
                        ↓
                Readiness Engine
                        ↓
              Requirement-Level Results
                        ↓
              Readiness Evaluation
                        ↓
               Skill-Gap Intelligence
                        ↓
                  Recommendations
                        ↓
                  Student Dashboard
98. Database Review Checklist

Before considering the database specification complete, verify:

Core schema
 UUID primary keys defined
 Foreign keys defined
 Required constraints defined
 Timestamp strategy defined
 Naming conventions consistent
Student system
 Colleges defined
 Departments defined
 Students defined
 Academic structure defined
 Semester data defined
 Subject attempts defined
 CGPA architecture defined
Skill system
 Canonical skills defined
 Categories defined
 Hierarchy defined
 Aliases defined
 Student skills defined
 Skill evidence defined
Career system
 Companies defined
 Roles defined
 Job openings defined
 Requirements defined
 Role-skill relationships defined
 Opening-specific requirements planned
Provenance
 Sources defined
 Source links defined
 Verification defined
 Freshness defined
 Change history defined
Readiness
 Evaluations defined
 Requirement results defined
 Snapshots defined
 Blocking requirements defined
 Explainability supported
Recommendations
 Recommendation catalog defined
 Student recommendations defined
 Skill relationships defined
 Target relationships defined
 Evidence relationships defined
Security
 RLS defined
 Student isolation defined
 Admin roles defined
 Grants defined
 Functions reviewed
 Triggers reviewed
Operations
 Migration order defined
 Seed strategy defined
 Testing defined
 Backup strategy defined
 Environment separation defined
99. Definition of Done

05_DATABASE_SPEC.md is complete when:

Every major product entity has a defined database representation.
Student data ownership is explicit.
Career-data relationships are explicit.
Provenance is explicit.
Verification is explicit.
Data freshness is explicit.
Historical data behavior is explicit.
Readiness data is explainable.
Recommendation data is traceable.
RLS architecture is explicit.
Administrative roles are explicit.
Migration order is explicit.
Database constraints are explicit.
Indexing strategy is defined.
External identifiers are defined.
Job-opening identity is defined.
Future ingestion is supported.
The design supports multiple colleges.
The design supports multiple ECE-related branches and career paths.
The database remains the system of record.
The specification is consistent with 01_PRODUCT_SPEC.md.
The specification is consistent with 02_FRONTEND_SPEC.md.
The specification is consistent with 03_UI_UX_SPEC.md.
The specification is consistent with 04_ARCHITECTURE.md.
The specification is implementable through ordered migrations.
100. Final Database Principle

UPROOTERS database architecture must preserve one central idea:

Every important conclusion shown to a student must be traceable to structured data and evidence.

The database must therefore connect:

WHO THE STUDENT IS
        ↓
WHAT THEY HAVE STUDIED
        ↓
WHAT THEY CAN DO
        ↓
WHAT EVIDENCE SUPPORTS IT
        ↓
WHAT CAREER ROLE THEY ARE EXPLORING
        ↓
WHAT THAT ROLE ACTUALLY REQUIRES
        ↓
WHAT A SPECIFIC JOB ACTUALLY REQUIRES
        ↓
WHAT IS VERIFIED
        ↓
WHAT IS MISSING
        ↓
WHAT ACTION CAN CLOSE THE GAP

The database must never silently transform:

claim → fact

or:

source → verified requirement

or:

related skill → satisfied skill

or:

historical data → current data

or:

calculated result → unquestionable truth

Instead, UPROOTERS must preserve:

DATA
+
EVIDENCE
+
SOURCE
+
VERIFICATION
+
TIME
+
CONTEXT

The final database must be:

accurate
secure
explainable
auditable
maintainable
migration-safe
multi-college capable
career-data aware
readiness-engine compatible
future-ingestion ready

The database is not merely storage.

It is the trusted foundation connecting the student's college journey with real career requirements.