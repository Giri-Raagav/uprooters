---
trigger: always_on
---

# UPROOTERS Workspace Rules

## 1. Project Identity

Project name: UPROOTERS

Core product statement:

"UPROOTERS tracks a student's entire college journey and tells the student which career paths, companies, roles, and job openings they are ready for."

Primary target:
- ECE students across colleges.

The product must be designed as a real-world career readiness platform, not as a demo with fabricated company or job data.

---

## 2. Source of Truth

The following documents are authoritative project specifications:

1. `docs/01_PRODUCT_SPEC.md`
2. `docs/02_FRONTEND_SPEC.md` when created
3. `docs/03_UI_UX_SPEC.md` when created
4. `docs/04_ARCHITECTURE.md` when created
5. `docs/05_DATABASE_SPEC.md` when created
6. `docs/06_READINESS_ENGINE.md` when created
7. `docs/07_SECURITY_MODEL.md` when created
8. `docs/08_DEVELOPMENT_RULES.md` when created

Do not invent requirements that are not defined by the specifications.

If two specifications appear to conflict:
1. Stop.
2. Identify the conflict.
3. Report it.
4. Do not silently choose an interpretation.

The product specification defines product behavior.
The frontend specification defines frontend behavior.
The UI/UX specification defines visual and interaction behavior.
The architecture specification defines system architecture.
The database specification defines database structure.
The readiness-engine specification defines readiness logic.
The security specification defines security requirements.
The development-rules specification defines engineering conventions.

---

## 3. Development Philosophy

Follow this workflow:

SPEC
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

Do not attempt to build the entire application in one step.

Work phase-by-phase.

Before implementing a major feature:
- understand the relevant specification;
- identify dependencies;
- identify files that will change;
- identify risks;
- implement the smallest coherent unit;
- test it;
- review it;
- commit it.

---

## 4. No Fabricated Career Data

UPROOTERS depends on real career information.

Never invent:
- company requirements;
- job requirements;
- salary information;
- eligibility criteria;
- required skills;
- preferred skills;
- job openings;
- company information;
- recruitment information;
- verification status;
- source URLs;
- source claims;
- employment information.

If required data does not exist, clearly report that the data is missing.

Do not create fake placeholder companies or fake job openings merely to make the UI look complete.

Mock data may only be used when explicitly requested for development/testing and must be clearly isolated from production data.

---

## 5. Data Provenance

Career data must have traceable provenance.

Where applicable, preserve:
- source;
- source URL;
- source type;
- trust tier;
- verification status;
- verification level;
- timestamps;
- lifecycle status;
- change history.

Do not remove provenance simply because it makes implementation more complicated.

Historical career data must not be silently overwritten when doing so would destroy important history.

---

## 6. Time-Aware Career Data

Career requirements and job openings can become outdated.

Respect lifecycle states and freshness rules defined by the specifications.

Do not treat old data as permanently current.

When implementing ingestion, synchronization, verification, or retirement logic:
- preserve historical records where required;
- distinguish current from historical information;
- record relevant timestamps;
- respect verification state;
- do not silently revive stale data.

---

## 7. Student Data

Student information is user-owned data.

Never expose one student's private information to another student.

Student-specific operations must respect:
- authentication;
- authorization;
- ownership;
- Row Level Security;
- application roles;
- database constraints.

Never bypass security rules merely to simplify development.

---

## 8. Security

Security is a product requirement, not a later enhancement.

Respect:
- Supabase Auth;
- PostgreSQL Row Level Security;
- application roles;
- least-privilege access;
- ownership checks;
- admin permissions;
- auditability;
- append-only history where required.

Never:
- expose service-role credentials in frontend code;
- hard-code secrets;
- commit API keys;
- commit passwords;
- disable RLS to make a feature work;
- create broad anonymous write access;
- bypass authentication for convenience.

If a security requirement is unclear, stop and report the ambiguity.

---

## 9. Database Rules

The database must remain the source of truth for persistent application data.

Use:
- PostgreSQL;
- Supabase;
- version-controlled SQL migrations.

Do not manually create production schema changes that are not represented in the migration history.

Do not modify an already-applied migration merely to change production behavior.

Create a new migration for subsequent schema changes unless the development environment explicitly permits otherwise.

Preserve referential integrity.

Use appropriate:
- primary keys;
- foreign keys;
- unique constraints;
- check constraints;
- indexes;
- timestamps;
- lifecycle fields.

Do not delete historical career records simply to simplify relationships.

---

## 10. Readiness Engine

The readiness engine must be explainable.

Never present a readiness result as an unexplained number.

A readiness result should be traceable to:
- target role or job opening;
- requirements;
- requirement type;
- student evidence;
- missing requirements;
- blocking requirements;
- relevant academic information;
- calculation/version information;
- explanation.

Do not invent readiness scores.

Do not silently change readiness logic.

Any change to readiness logic must be reflected in the readiness-engine specification and treated as a versioned product change.

---

## 11. Skill System

UPROOTERS uses a canonical skill taxonomy.

Prefer canonical skill records over arbitrary free-text skill duplication.

Respect:
- skill categories;
- canonical names;
- aliases;
- parent-child relationships;
- lifecycle status;
- normalization rules.

Do not create duplicate skills merely because two names are slightly different.

If a new skill is genuinely required, identify it as a taxonomy change rather than silently creating inconsistent data.

---

## 12. Frontend Rules

The frontend must follow the frontend and UI/UX specifications.

Do not invent major screens, navigation structures, workflows, or visual systems when they have not yet been specified.

Do not build backend behavior inside frontend components when it belongs in the appropriate application/service/database layer.

Keep components:
- understandable;
- reusable where appropriate;
- maintainable;
- consistent with the design system.

Do not add unnecessary libraries.

Do not install packages without a clear project requirement.

---

## 13. Architecture Rules

Use the approved architecture defined in the project specifications.

Current intended stack:

- React
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Git
- GitHub

Do not replace core technologies without an explicit architecture decision.

Do not introduce unnecessary frameworks or services.

Before adding a new dependency, explain:
- why it is required;
- what problem it solves;
- whether the existing stack can solve the problem.

---

## 14. AI Usage

AI may assist with:
- explanations;
- summarization;
- recommendations;
- classification;
- developer assistance;
- natural-language interaction.

AI must not become an unexplained source of truth for factual career requirements.

Real career data must remain grounded in verified/provenanced data sources.

AI-generated content must not be presented as verified company requirements unless supported by the underlying source data.

---

## 15. No Silent Scope Expansion

Do not add features simply because they seem useful.

Examples:
- social networking;
- messaging;
- unrelated job portals;
- unnecessary analytics;
- unrelated AI features;
- unrelated college administration systems.

If a feature is outside the current specification:
- identify it as a possible future feature;
- do not implement it without approval.

---

## 16. File Discipline

Keep the repository organized.

Use the intended structure:

```text
uprooters/
├── .agents/
│   └── rules/
│       └── uprooters.md
├── docs/
│   ├── 01_PRODUCT_SPEC.md
│   ├── 02_FRONTEND_SPEC.md
│   ├── 03_UI_UX_SPEC.md
│   ├── 04_ARCHITECTURE.md
│   ├── 05_DATABASE_SPEC.md
│   ├── 06_READINESS_ENGINE.md
│   ├── 07_SECURITY_MODEL.md
│   └── 08_DEVELOPMENT_RULES.md
├── src/
└── ...
Git Rules

Use Git checkpoints throughout development.

Before major changes:

git status

After a stable implementation:

git status
git add <specific-files>
git commit -m "<clear message>"
git push

Prefer focused commits.

Commit messages should describe the actual change.

Examples:

docs: add frontend specification
feat: add student profile foundation
feat: add academic tracking
feat: add skill evidence
feat: add readiness evaluation
fix: enforce student ownership
refactor: simplify readiness service

Do not commit:

secrets;
credentials;
private keys;
unnecessary generated files;
temporary debugging artifacts.
18. Testing

Every implemented feature must be tested before being considered complete.

Testing should cover the relevant level:

UI behavior;
component behavior;
application logic;
database constraints;
RLS/security;
readiness calculations;
edge cases.

Do not claim that a feature works without testing it.

If testing cannot be performed, state that clearly.

19. Error Handling

Errors must be understandable to developers and users.

Do not silently swallow errors.

Do not replace real errors with fake success messages.

For user-facing errors:

explain what happened;
avoid exposing sensitive internal information;
provide a useful next action when possible.

For developer errors:

preserve enough information to diagnose the issue.
20. Code Quality

Prefer:

simple code;
clear naming;
small coherent functions;
reusable components;
explicit data flow;
strong typing;
maintainable structure.

Avoid:

unnecessary abstraction;
duplicated business logic;
magic numbers;
unexplained constants;
giant components;
giant functions;
hidden side effects.

Do not optimize prematurely.

Correctness and clarity come before cleverness.

21. Change Discipline

Before changing an existing file:

Read the relevant code.
Understand its purpose.
Identify dependencies.
Make the smallest necessary change.
Test the affected behavior.
Review for regressions.

Do not rewrite large sections unnecessarily.

Do not overwrite working functionality without understanding it.

22. Ambiguity Rule

When a requirement is ambiguous:

DO NOT GUESS.

Instead report:

what is known;
what is ambiguous;
what decision is required;
what options exist if relevant.

Wait for the product/architecture decision before implementing behavior that could affect the system design.

23. Completion Rule

A task is not considered complete merely because code was written.

A task is complete only when the relevant implementation:

follows the specifications;
is tested;
has no known critical errors;
preserves security requirements;
preserves data integrity;
is reviewed;
is committed when appropriate.
24. Current Phase & Agent Rules

Current phase:
- Git/GitHub setup completed.
- `docs/01_PRODUCT_SPEC.md` created, committed, and pushed.
- Next: create and review `docs/02_FRONTEND_SPEC.md`.
- Do not begin full implementation until the required specifications are defined.

Agent must:
- Follow the relevant specs and rules.
- Implement only the requested scope.
- Do not guess when requirements are ambiguous.
- Test changes before declaring completion.
- Report changes, tests, and unresolved issues.
- Do not modify unrelated files or expand scope without approval.

UPROOTERS must prioritize correctness, real data, traceability, security, explainability