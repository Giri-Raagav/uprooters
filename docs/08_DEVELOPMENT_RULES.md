# UPROOTERS — DEVELOPMENT RULES

## 1. Purpose

This document defines the development rules for UPROOTERS.

It governs how the product is planned, implemented, tested, reviewed, committed, and maintained.

This document applies to:

- Human developers
- Antigravity agents
- Future contributors
- Frontend implementation
- Backend implementation
- Database changes
- Readiness engine changes
- Administrative tools
- AI-assisted functionality
- Testing and deployment

Development must follow the approved product, frontend, UI/UX, architecture, database, readiness, and security specifications.

---

## 2. Development Philosophy

UPROOTERS must be developed as a real production-oriented product rather than a demonstration-only prototype.

Development priorities are:

1. Correctness
2. Data integrity
3. Security
4. Explainability
5. Maintainability
6. Testability
7. Performance
8. Visual quality
9. Development speed

Speed must never justify fabricated data, insecure access, broken logic, or undocumented architectural shortcuts.

---

## 3. Source of Truth

The following documents form the primary product specification hierarchy:

1. `docs/01_PRODUCT_SPEC.md`
2. `docs/02_FRONTEND_SPEC.md`
3. `docs/03_UI_UX_SPEC.md`
4. `docs/04_ARCHITECTURE.md`
5. `docs/05_DATABASE_SPEC.md`
6. `docs/06_READINESS_ENGINE.md`
7. `docs/07_SECURITY_MODEL.md`
8. `docs/08_DEVELOPMENT_RULES.md`

Workspace-specific rules in:

```text
.agents/rules/

4. Specification-First Development

Development must follow:

SPECIFICATION
↓
PLAN
↓
IMPLEMENT
↓
TEST
↓
REVIEW
↓
COMMIT
↓
NEXT PHASE

Do not begin large implementation work without understanding the relevant specification.

5. Scope Control

Every development task must have a defined scope.

The implementation must:

Solve the requested problem
Avoid unrelated changes
Avoid unnecessary refactoring
Avoid speculative features
Avoid introducing unapproved architecture
Avoid modifying unrelated specifications

If additional work becomes necessary, document it before expanding scope.

6. Requirement Interpretation

Requirements must be interpreted literally and in context.

Do not assume:

Missing business rules
Missing database relationships
Missing permissions
Missing UI behavior
Missing company requirements
Missing readiness rules

When a requirement is genuinely ambiguous, inspect the relevant specifications first.

If ambiguity remains and materially affects implementation, stop and clarify rather than guessing.

7. Development Phases

UPROOTERS development should progress through controlled phases:

Foundation
↓
Database
↓
Authentication
↓
Student Profile
↓
Academics
↓
Skills & Evidence
↓
Projects / Certifications / Experience
↓
Career Data
↓
Readiness Engine
↓
Recommendations
↓
Student UI
↓
Administrator UI
↓
Integration
↓
Testing
↓
Production Hardening

Do not skip dependencies merely to make the interface appear complete.

8. Antigravity Agent Role

Antigravity agents are implementation assistants.

They must:

Read relevant specifications
Inspect existing code
Understand existing architecture
Plan before major changes
Implement only approved scope
Test changes
Report results
Preserve existing functionality
Avoid destructive actions

Agents must not independently redefine the product.

9. Agent Planning Rule

For non-trivial tasks, the agent should first determine:

What files are involved?
What specification governs the change?
What dependencies exist?
What database changes are required?
What security implications exist?
What tests are required?
What could break?

The implementation should then follow the plan.

10. Agent Workspace Rules

Agents must respect:

.agents/rules/

including:

.agents/rules/uprooters.md

Workspace rules are part of the development contract.

They must not be bypassed because a faster implementation appears possible.

11. Existing Code First

Before creating a new implementation, inspect the existing project.

Check:

Existing components
Existing routes
Existing utilities
Existing hooks
Existing database clients
Existing types
Existing migrations
Existing tests
Existing configuration

Avoid duplicating functionality that already exists.

12. No Blind Overwriting

Agents must not overwrite working files blindly.

Before replacing a file or large section:

Inspect the existing content
Understand dependencies
Preserve required behavior
Make the smallest safe change

Large replacement operations must be intentional.

13. React Development

The frontend must follow the approved React + TypeScript architecture.

React components should be:

Focused
Reusable where appropriate
Predictable
Accessible
Testable
Consistent with the UI/UX specification

Avoid unnecessarily large components.

14. TypeScript Rules

TypeScript must be used consistently.

Avoid:

any

unless there is a documented technical reason.

Prefer:

Explicit types
Interfaces
Type aliases
Discriminated unions
Typed API responses
Typed database models

Type errors must not be hidden merely to make builds pass.

15. Type Safety

Data crossing boundaries must be typed.

Important boundaries include:

Forms
Supabase queries
API functions
Database results
Readiness results
Recommendations
Administrator operations

Unsafe type assertions must be minimized.

16. Component Architecture

Components should follow clear responsibilities.

Prefer:

Page
↓
Feature Component
↓
Reusable UI Component
↓
Data / Utility Layer

Avoid putting:

Database queries
Complex business logic
Large calculations
Authentication decisions

directly inside visual components when those responsibilities belong elsewhere.

17. Frontend Business Logic Boundary

The frontend must not become the authoritative business engine.

In particular, the frontend must not independently calculate:

Official readiness scores
Requirement satisfaction
Career eligibility
Company requirements
Verification status

The backend/database/readiness engine remains authoritative.

18. UI and UX Consistency

Implementation must follow:

03_UI_UX_SPEC.md

Maintain consistency in:

Typography
Spacing
Cards
Buttons
Forms
Navigation
Icons
Motion
Themes
Empty states
Error states
Loading states

Do not invent unrelated visual patterns.

19. Brand Consistency

The product must preserve the approved brand direction.

The opening experience may use:

Ace&place

as defined by the UI/UX specification.

The authenticated product experience must remain consistent with the approved UPROOTERS product identity.

Do not introduce unrelated branding.

20. Theme Implementation

The product must support:

Light mode
Dark mode

Theme behavior must be consistent across the application.

Student and Administrator experiences may use distinct approved palettes while maintaining the same design system.

21. Animation Rules

Animations must be:

Purposeful
Smooth
Subtle
Performance-conscious

Avoid:

Excessive animation
Distracting motion
Gaming-style effects
Long blocking transitions
Animation that prevents efficient navigation

Respect reduced-motion preferences.

22. Responsive Development

The application must support:

Desktop
Tablet
Mobile

Mobile must not be treated as an afterthought.

Layouts must adapt rather than simply shrink desktop content.

23. Accessibility

All major interfaces must consider:

Keyboard navigation
Focus states
Semantic HTML
Labels
Contrast
Screen-reader compatibility
Error identification
Reduced motion
Touch target size

Accessibility must be considered during implementation rather than added only at the end.

24. Forms

Forms must provide:

Clear labels
Appropriate input types
Validation
Error messages
Loading states
Success states
Accessible feedback

Never silently discard user input.

25. Form Validation

Validation should occur at appropriate layers.

Client-side validation improves user experience.

Server/database validation provides authoritative protection.

Never rely solely on client-side validation for security or data integrity.

26. Data Access Layer

Frontend components should access application data through a controlled data-access layer.

Avoid scattering raw database queries throughout the UI.

Prefer:

UI
↓
Feature/Data Hook
↓
Data Access Function
↓
Supabase
↓
PostgreSQL
27. Supabase Client Rules

Supabase client configuration must use environment variables.

Do not hardcode:

Project URLs
Secret keys
Service-role keys
Passwords
Tokens

Public client configuration must never expose privileged credentials.

28. Service-Role Security

Supabase service-role credentials are privileged.

They must never be:

Stored in frontend code
Exposed to browsers
Committed to Git
Included in public bundles
Sent to users

Privileged operations must execute in trusted server-side environments.

29. Database-First Integrity

Important business integrity belongs in the database where appropriate.

Database constraints should protect:

Required values
Foreign keys
Uniqueness
Valid ranges
Status transitions
Ownership relationships

Application code must not be the only protection against invalid data.

30. Migration-Only Schema Changes

Database schema changes must be performed through versioned migrations.

Do not make undocumented production schema changes manually.

Each migration must be:

Ordered
Reviewable
Reproducible
Tested
Compatible with previous migrations
31. Migration Order

The approved migration sequence is:

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

Do not arbitrarily reorder migrations.

If the migration architecture changes, update the relevant specifications.

32. Migration Safety

Before applying a migration:

Inspect dependencies
Check existing schema
Check foreign keys
Check indexes
Check RLS
Check triggers
Check grants
Test migration
Review rollback/recovery implications

Never assume a migration is safe because it executes successfully.

33. Destructive Database Changes

Destructive changes require explicit review.

Avoid unnecessary:

DROP TABLE
DROP COLUMN
DELETE
TRUNCATE

Historical UPROOTERS data should generally be preserved through lifecycle states or archival mechanisms.

34. Database Naming

Use consistent naming conventions.

Prefer:

snake_case

for database objects.

Names must communicate purpose clearly.

Avoid cryptic abbreviations.

35. Foreign Keys

Foreign keys must be used where relationships are authoritative.

Examples:

student → college
student → department
student → semester
project → student
skill evidence → student
role → company
job opening → role

Foreign-key behavior must match the historical data policy.

36. Indexing

Indexes should support real query patterns.

Important query patterns include:

Student ownership
Company lookup
Role lookup
Job opening filtering
Skill lookup
Readiness evaluation retrieval
Recommendation retrieval
Verification workflows

Do not create large numbers of unnecessary indexes.

37. Normalization

Canonical entities should be normalized.

Examples:

Skills
Companies
Roles
Colleges
Departments
Sources

Avoid storing duplicate representations of the same canonical entity.

38. Denormalization

Denormalization is allowed only when it provides a documented benefit such as:

Performance
Snapshot preservation
Historical representation
Search optimization

Every denormalized value must have a clear ownership/source rule.

39. RLS Is Mandatory

Row-Level Security is a core security boundary.

Student-owned data must not be accessible across students.

The basic ownership path is:

auth.uid()
↓
students.user_id
↓
students.id
↓
student-owned records
40. Student Isolation

A student must only access their own private records unless an explicitly authorized administrative rule permits access.

Test for:

Student A accessing Student B
Student B accessing Student A
Direct query attempts
Update attempts
Delete attempts

All must follow the security specification.

41. Administrator Access

Administrator access must be role-based.

Do not use frontend route visibility as the actual security mechanism.

Database policies and trusted backend operations must enforce authorization.

42. Role-Based Access

The approved application roles are:

student
data_editor
verifier
super_admin

Permissions must follow the security model.

Do not grant broader privileges simply because they make implementation easier.

43. Authentication

Authentication must be handled through the approved authentication architecture.

Do not create custom password storage.

Do not store raw passwords.

Do not implement insecure authentication workarounds.

44. Authorization

Authentication answers:

Who are you?

Authorization answers:

What are you allowed to do?

Both must be implemented separately and correctly.

45. Security by Default

New features must start from:

deny by default

and explicitly grant required access.

Do not assume new data is safe to expose.

46. Input Security

All external input must be treated as untrusted.

Validate:

Strings
Numbers
Dates
URLs
File uploads
IDs
Query parameters
Form submissions
47. SQL Injection

Never construct SQL using unsafe string concatenation.

Use:

Parameterized queries
Supabase query APIs
Safe database functions
Validated inputs

Never insert raw user input into executable SQL.

48. XSS Prevention

User-generated content must be treated as untrusted.

Avoid rendering raw HTML unless absolutely necessary and safely sanitized.

Do not allow user content to become executable JavaScript.

49. URL Safety

External URLs must be validated appropriately.

Career-source links should preserve provenance.

Do not automatically trust arbitrary URLs supplied by users or imported data.

50. Secrets and Environment Variables

Secrets must remain outside source control.

Typical sensitive values include:

SUPABASE_SERVICE_ROLE_KEY
API_SECRET
PRIVATE_TOKEN
WEBHOOK_SECRET

Use environment configuration appropriate to the deployment environment.

51. Git Ignore Rules

Sensitive files must be excluded through .gitignore.

At minimum, review protection for:

.env
.env.local
.env.*.local

Do not commit real credentials.

52. Git Repository Discipline

Git is the source-control history for the project.

Every meaningful milestone should have a clear commit.

Commits should describe what changed.

Avoid meaningless messages such as:

update
changes
final
test
53. Commit Rules

Preferred commit style:

docs: add UPROOTERS security model
feat: add student profile flow
fix: correct readiness requirement mapping
refactor: separate career data access layer
test: add readiness engine tests
chore: update dependencies

Commit messages should be concise and descriptive.

54. Small Stable Checkpoints

After completing a meaningful specification or implementation phase:

git status
git add
git commit
git push
git status

A clean checkpoint should be established before starting major unrelated work.

55. Git Status Rule

Before and after major work, inspect:

git status

Do not assume the working tree is clean.

Unexpected changes must be investigated.

56. Git Diff Review

Before committing substantial code, review:

git diff

or:

git diff --cached

Check for:

Accidental files
Secrets
Debug code
Unrelated changes
Incorrect formatting
Temporary code
57. No Secret Commits

Never commit:

Passwords
API keys
Service-role keys
Private tokens
Personal credentials
Production secrets

If a secret is accidentally committed, treat it as compromised and rotate it.

58. Branch Discipline

The main branch must remain stable.

Large or risky changes should be developed in an appropriate branch when the project workflow requires it.

Do not push known-broken work to a protected production branch.

59. Code Review

Before considering a feature complete, review:

Requirement compliance
Architecture
Security
Database impact
UI/UX compliance
Error handling
Testing
Performance
Accessibility
60. Testing Philosophy

Testing is part of implementation.

A feature is not complete merely because:

the page renders

It must also behave correctly under expected and unexpected conditions.

61. Test Levels

UPROOTERS should use appropriate levels of testing:

Unit Tests
↓
Component Tests
↓
Integration Tests
↓
Database/RLS Tests
↓
End-to-End Tests

Not every function requires every level, but important business behavior must be covered appropriately.

62. Unit Testing

Unit tests should cover deterministic logic such as:

Utility functions
Requirement evaluation
Score calculations
Validation
Formatting
Data transformations
63. Component Testing

Important UI components should be tested for:

Rendering
User interaction
Loading
Empty state
Error state
Accessibility
Data display
64. Integration Testing

Integration tests should verify boundaries such as:

Frontend
↓
Data Access
↓
Supabase
↓
PostgreSQL

and:

Student Data
↓
Readiness Engine
↓
Recommendations
65. RLS Testing

RLS must be explicitly tested.

At minimum verify:

Student can access own data
Student cannot access another student's data
Authorized administrators can perform permitted operations
Unauthorized users cannot bypass policies
66. Readiness Engine Testing

Readiness testing must include:

Required skill satisfied
Required skill missing
Preferred skill missing
Related skill present
Unsupported requirement
Blocking requirement
Academic threshold
Branch mismatch
Degree mismatch
Missing student data
Stale evidence
Job-specific override
Role-level default requirement
67. Determinism

For identical:

student state
+
career target
+
requirements
+
engine version
+
configuration

the readiness engine should produce the same result.

Unexpected randomness is not acceptable in authoritative scoring.

68. Edge Cases

Test important edge cases including:

No skills
No projects
No academic data
No verified evidence
Duplicate evidence
Retaken subjects
Arrears
Missing company data
Closed job openings
Retired requirements
Stale sources
Incomplete profile
69. Error Handling

Errors must be handled intentionally.

Users should receive useful messages such as:

We couldn't load your readiness data.
Please try again.

rather than raw technical errors.

70. Error Logging

Internal logs should contain enough information to diagnose failures without exposing sensitive information.

Do not log:

Passwords
Authentication tokens
Service-role keys
Unnecessary personal information
71. Loading States

Every asynchronous interface should have an appropriate loading state.

Examples:

Skeleton
Spinner
Progress indicator
Disabled submit state

Avoid blank screens while data is loading.

72. Empty States

Empty states must explain what happened and what the user can do next.

Example:

No projects added yet.

Add your first project to start building your skill evidence.
73. Error States

Error states should communicate:

What failed
Whether data was saved
What the user can do next

Avoid technical jargon where possible.

74. Data Freshness

Career information is time-sensitive.

The system must distinguish:

Current
Verified
Stale
Retired
Archived

Do not present stale information as current without appropriate indication.

75. Real-Data Rule

Career data must be based on real sources.

Never fabricate:

Companies
Roles
Job openings
Requirements
Salaries
Hiring criteria
Verification status

If data is unavailable, display that it is unavailable.

76. Provenance Rule

Career information must preserve its source where applicable.

Important information should be traceable through:

Company
↓
Role
↓
Requirement
↓
Source
↓
Verification
↓
Timestamp
77. Source Trust

Sources must follow the approved trust model.

Higher-trust sources include:

Official company career pages
Official job postings
Official ATS listings

Public secondary sources may be useful but must not automatically be treated as equivalent to official sources.

78. Verification

Verification status must not be fabricated.

A record may be:

PENDING
VERIFIED
REJECTED
STALE

according to the data model.

Only authorized verification workflows may change verification state.

79. Career Data Lifecycle

Career data should move through controlled states.

Examples:

DISCOVERED
↓
REVIEWED
↓
VERIFIED
↓
PUBLISHED
↓
STALE
↓
REVERIFIED / RETIRED

Exact lifecycle implementation must follow the database specification.

80. No-Fabrication Rule

When information is unknown:

UNKNOWN

is better than an invented answer.

This rule applies to:

Career requirements
Student evidence
Company data
Job information
Readiness explanations
Recommendations
81. Readiness Score Integrity

The readiness score must represent the approved engine output.

The frontend must not invent or alter the score.

The system must be able to explain:

Overall score
Requirement results
Missing requirements
Blocking requirements
Evidence
Limitations
82. Missing vs Unsupported

The product must distinguish:

Missing

The requirement is understood and the student lacks sufficient evidence.

Unsupported

The system does not have enough structured information to determine whether the student satisfies the requirement.

These states must not be silently merged.

83. Related Skills

A related skill must not automatically equal an exact skill.

For example:

Python

does not automatically mean:

C

A related skill may provide contextual evidence, but requirement satisfaction must follow the readiness engine rules.

84. Recommendations

Recommendations must originate from identifiable needs.

A recommendation should ideally connect:

Student Gap
↓
Required Skill
↓
Evidence Needed
↓
Suggested Action

Do not generate arbitrary recommendations simply to fill a dashboard.

85. Recommendation Completion

Recommendations must be trackable.

Where appropriate:

GENERATED
↓
ACTIVE
↓
COMPLETED
↓
VERIFIED

The exact lifecycle must follow the database and readiness specifications.

86. AI Usage

AI may assist with:

Explanations
Summaries
Natural-language interaction
Gap interpretation
Search assistance
User-friendly descriptions

AI must not become the authoritative source of:

Career requirements
Verification
Readiness score
Academic truth
Student evidence
87. AI Output Validation

AI-generated output must be treated as untrusted.

Validate it before displaying or storing important information.

AI must not be allowed to silently modify authoritative records.

88. AI Prompt Injection Protection

External career text may contain malicious or misleading instructions.

Imported text must be treated as data, not as executable instructions.

The instruction hierarchy remains:

System / Security Rules
↓
Product Specifications
↓
Application Rules
↓
Trusted Data
↓
External Text
89. AI Data Minimization

Only the minimum necessary student information should be sent to AI systems.

Avoid sending unnecessary:

Personal information
Authentication information
Private documents
Credentials
Sensitive records
90. Performance

Performance must be considered during implementation.

Avoid:

Unnecessary database requests
Repeated expensive calculations
Huge client-side datasets
Unnecessary re-renders
Blocking UI operations
91. Data Fetching

Fetch only what the interface needs.

Prefer:

specific query

over retrieving an entire dataset unnecessarily.

Pagination should be used for potentially large datasets.

92. Caching

Caching may be used for suitable data.

However, cached career information must not bypass freshness requirements.

Readiness results must respect evaluation version and underlying data changes.

93. Dependency Management

Do not add a dependency simply because it makes a small task easier.

Before adding one, consider:

Existing project capability
Bundle size
Security
Maintenance
License
Compatibility
Long-term necessity
94. Dependency Updates

Dependency updates should be deliberate.

Before updating major dependencies:

Review breaking changes
Update carefully
Run tests
Check build
Check UI
Check database integration
Commit separately where practical
95. Build Quality

Before declaring a major frontend change complete, verify:

Type checking
↓
Linting
↓
Tests
↓
Production build

where those tools are configured.

Do not declare success solely because the development server starts.

96. Debugging Workflow

When something fails:

Reproduce
↓
Read the error
↓
Identify the layer
↓
Inspect relevant code
↓
Form a hypothesis
↓
Make the smallest fix
↓
Test
↓
Verify no regression

Do not randomly modify multiple unrelated files.

97. Change Management

Every significant change should answer:

Why is this change needed?
Which specification requires it?
What files are affected?
Does the database change?
Does security change?
Does RLS change?
Does readiness behavior change?
What tests are required?
98. Definition of Done

A development task is complete only when applicable items are satisfied:

Requirement implemented
Relevant specification followed
Types valid
UI/UX consistent
Security considered
Database integrity preserved
RLS verified where applicable
Tests completed
Errors handled
Loading/empty states handled
No fabricated data
No secrets exposed
Changes reviewed
Git status understood
Documentation updated where necessary
99. Production Readiness

Before production release, verify:

Product
Core workflows function
Career data is traceable
Readiness is explainable
Student journey is preserved
Security
Authentication works
Authorization works
RLS works
Secrets are protected
Administrative boundaries are enforced
Database
Migrations are reproducible
Constraints are valid
Indexes are appropriate
Backups exist
Historical data is protected
Frontend
Responsive
Accessible
Consistent
Performant
Error states handled
Operations
Logging exists
Monitoring exists
Recovery procedures exist
Deployment process is documented
100. Final Development Principle

UPROOTERS must be developed as a trustworthy career intelligence platform, not merely as a visually impressive student portal.

Every implementation decision must preserve:

REAL DATA
+
SECURITY
+
TRACEABILITY
+
EXPLAINABILITY
+
STUDENT OWNERSHIP
+
DATA INTEGRITY
+
MAINTAINABILITY

The development rule is:

Build only what is specified, verify what is built, preserve what is correct, and never replace missing knowledge with assumptions.

The final quality bar is:

SPEC
↓
CORRECT IMPLEMENTATION
↓
SECURE DATA
↓
REAL EVIDENCE
↓
EXPLAINABLE RESULTS
↓
TESTED PRODUCT

That is the development standard for UPROOTERS.