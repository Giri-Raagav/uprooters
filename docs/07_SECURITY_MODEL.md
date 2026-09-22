# UPROOTERS — Security Model Specification

## 1. Purpose

The Security Model defines how UPROOTERS protects:

- student accounts
- student academic data
- skills and evidence
- projects
- certifications
- experience
- career-readiness evaluations
- company and job data
- administrative operations
- source and verification data
- audit history
- application infrastructure

Security must be enforced as a system property rather than treated as a frontend feature.

---

## 2. Security Principles

UPROOTERS follows these principles:

1. Deny by default.
2. Least privilege.
3. Defense in depth.
4. Database-enforced authorization.
5. Explicit role boundaries.
6. Student data isolation.
7. No client-side-only security.
8. No secrets in frontend code.
9. Audit important administrative actions.
10. Preserve historical records.
11. Validate all external input.
12. Minimize sensitive data collection.
13. Protect credentials and sessions.
14. Secure storage objects.
15. Treat AI output as untrusted.
16. Make security failures visible and actionable.

---

## 3. Security Architecture

The security architecture is layered:

```text
User
  ↓
Frontend
  ↓
Authentication
  ↓
Authorization
  ↓
API / Supabase Services
  ↓
PostgreSQL RLS
  ↓
Database Constraints
  ↓
Audit / Monitoring
4. Security Boundaries

Major security boundaries include:

Public User
      ↓
Authenticated User
      ↓
Student
      ↓
Data Editor
      ↓
Verifier
      ↓
Super Admin

Each boundary requires explicit authorization.

A user must never gain additional privileges merely by manipulating frontend state.

5. Threat Model

The system must consider:

stolen credentials
malicious users
compromised sessions
unauthorized API requests
privilege escalation
cross-student data access
malicious input
SQL injection
XSS
CSRF where applicable
insecure file uploads
data leakage
exposed secrets
abusive automation
AI prompt injection
malicious career-data submissions
insider misuse
accidental administrative changes
6. Authentication Architecture

UPROOTERS uses Supabase Auth as the primary authentication system.

Authentication is responsible for establishing:

"Who is this user?"

Authorization is responsible for establishing:

"What is this user allowed to access?"

These responsibilities must remain separate.

7. Supabase Auth

Supabase Auth manages identity and authentication mechanisms.

The application should rely on supported Supabase authentication flows rather than implementing its own password-storage system.

The application must not store raw user passwords in application tables.

8. Supported Authentication Methods

The initial authentication strategy should support the methods explicitly enabled for the product.

Potential methods include:

email/password
magic link
OAuth providers
future institutional authentication

Only configured and tested authentication methods should be exposed to users.

The frontend must not advertise disabled methods.

9. Password Security

If password authentication is enabled:

passwords must be handled by Supabase Auth
raw passwords must never be stored in application tables
password reset must use the authentication provider
authentication errors must avoid unnecessary account disclosure

The application should encourage strong passwords where applicable.

10. Email Verification

Where email verification is enabled, the application should distinguish:

Email Unverified
Email Verified

Sensitive workflows may require a verified account depending on product policy.

The application must not assume that a supplied email address is trustworthy merely because a user entered it.

11. Session Security

Authenticated sessions must be handled through supported Supabase mechanisms.

The application should:

use secure session handling
avoid exposing tokens unnecessarily
avoid logging authentication tokens
refresh sessions according to provider behavior
terminate invalid or expired sessions
12. Authentication Token Handling

Access tokens and refresh tokens are security-sensitive.

They must never be:

committed to Git
printed to logs
included in screenshots
stored in database records unnecessarily
sent to third-party services without explicit justification

The frontend must use the supported authentication client.

13. Logout

Logout must invalidate the local authenticated session appropriately.

After logout:

protected application routes must become inaccessible
cached sensitive data should not remain exposed through active UI state
authenticated operations must require a valid session
14. Account Recovery

Password recovery and account recovery must use secure provider-supported flows.

Recovery links should:

expire according to authentication settings
be single-use where supported
avoid exposing unnecessary account information
15. Application Roles

UPROOTERS defines:

STUDENT
DATA_EDITOR
VERIFIER
SUPER_ADMIN

These roles represent application permissions.

They must not be treated as cosmetic labels.

16. Student Role

Students may:

manage their own profile
manage permitted academic information
manage their own skills
submit evidence
manage their projects
manage certifications
manage experience
view their readiness
view recommendations
explore companies and roles
view appropriate public career information

Students must not access another student's private data.

17. Data Editor Role

Data Editors may manage approved career-data workflows according to the product rules.

Typical responsibilities:

company data
role data
job-opening data
source records
requirement records
taxonomy updates where authorized

Data Editors must not automatically receive access to private student data unless explicitly authorized.

18. Verifier Role

Verifiers may review:

career sources
company information
role requirements
job-opening requirements
evidence requiring verification
data-quality issues

Verification privileges must not imply unrestricted administrative access.

19. Super Admin Role

Super Admin has the highest application-level privilege.

Typical responsibilities include:

user administration
role administration
security configuration
system configuration
administrative recovery
controlled data correction
audit review

Super Admin access must still be protected by strong authentication and auditing.

20. Role Assignment

Role assignment must be controlled.

Users must not be able to assign themselves:

DATA_EDITOR
VERIFIER
SUPER_ADMIN

Role changes must be performed through authorized administrative workflows.

21. Role Storage

Application roles should be represented using the database role architecture defined in the database specification.

The application should not depend solely on a client-side role field.

Authorization must ultimately be enforceable through trusted server/database state.

22. Authorization Architecture

Authorization answers:

"Is this authenticated user allowed to perform this operation?"

Authorization should combine:

Authentication
+
Application Role
+
Resource Ownership
+
Action Permission
23. Least Privilege

Every role should receive only the permissions required to perform its responsibilities.

Example:

Student
→ Own student records

Data Editor
→ Career data workflows

Verifier
→ Verification workflows

Super Admin
→ Administrative control

A role must not inherit unnecessary permissions simply for convenience.

24. PostgreSQL Row-Level Security

PostgreSQL Row-Level Security is a core security boundary.

RLS must protect student-owned data even if an application-level bug exposes an unsafe query path.

RLS policies should be explicit and reviewed.

25. Student RLS Model

The primary ownership relationship is:

auth.uid()
      ↓
students.user_id
      ↓
students.id
      ↓
student-owned record.student_id

A student may access only rows belonging to their own student identity.

26. Student Data Isolation

Student A must never be able to query:

Student B

through:

frontend manipulation
URL modification
API request modification
direct Supabase queries
guessed UUIDs
altered filters

RLS must enforce this isolation.

27. Student SELECT Permissions

Students may SELECT their own permitted records.

Example:

students
student_semesters
student_subject_attempts
student_skills
skill_evidence
projects
certifications
experience
readiness_evaluations
recommendations

Exact access must follow the database specification.

28. Student INSERT Permissions

Students may INSERT only records that belong to themselves and are permitted by the product.

For example:

student project
student skill evidence
student certification

A student must not be able to insert a record claiming ownership of another student.

29. Student UPDATE Permissions

Students may update only fields they are authorized to manage.

Security-sensitive fields must not be freely editable.

Examples:

verification status
administrative role
audit history
source verification
system-generated readiness results

must not be directly student-editable.

30. Student DELETE Permissions

Deletion must be conservative.

Where historical or audit value exists, the system should prefer:

Archive
Deactivate
Dismiss
Retire

over destructive deletion.

Students must not be able to delete immutable audit history.

31. Administrative RLS

Administrative access must be role-based.

Example:

DATA_EDITOR
VERIFIER
SUPER_ADMIN

must receive only the database permissions associated with their responsibilities.

32. RLS and Service Roles

Privileged server-side/service-role credentials can bypass normal RLS protections.

Therefore service-role credentials must:

never be exposed to browsers
never be committed to Git
never be placed in public frontend environment variables
be used only in trusted server-side contexts
be rotated when exposure is suspected
33. Supabase Client Security

The frontend may use the public Supabase client configuration intended for browser use.

The frontend must never contain:

service-role keys
database passwords
private API keys
administrative secrets
signing secrets

Public configuration is not a substitute for RLS.

34. Environment Variables

Environment variables must separate:

Development
Test
Staging
Production

Sensitive production secrets must not be copied into local repositories.

Example sensitive values include:

SERVICE_ROLE_KEY
DATABASE_PASSWORD
PRIVATE_API_KEY
AI_PROVIDER_SECRET
WEBHOOK_SECRET
35. Git Secret Protection

The repository must not contain:

passwords
access tokens
private keys
service-role keys
production credentials
private database URLs containing credentials

.gitignore should protect local secret files.

36. Environment File Rules

Files such as:

.env
.env.local
.env.production

must be handled according to the project's secret-management policy.

Only non-sensitive public configuration should be committed when explicitly appropriate.

37. Secret Rotation

Secrets must be rotated when:

exposure is suspected
an administrator leaves
credentials are accidentally committed
a third-party integration is compromised
security policy requires rotation

Rotation procedures must be documented.

38. API Security

Every protected API operation must verify authentication and authorization.

The API must not trust:

user-supplied role
user-supplied student ID
user-supplied admin status
hidden form fields
frontend route restrictions
39. Input Validation

All external input must be validated.

Examples:

UUIDs
strings
numbers
dates
enums
URLs
file metadata
search queries
filters
pagination values

Invalid input must be rejected safely.

40. SQL Injection Protection

Database access must use parameterized queries or safe database APIs.

Application code must never construct SQL by unsafe string concatenation.

Example unsafe pattern:

"SELECT * FROM students WHERE id = '" + userInput + "'"

must not be used.

41. XSS Protection

User-controlled text must be treated as untrusted.

Potentially unsafe content includes:

project descriptions
biographies
certification names
job descriptions
source metadata
administrative notes

The frontend must escape or safely render content.

Raw HTML rendering should be avoided unless explicitly required and sanitized.

42. URL Security

External URLs stored in the system should be validated.

Examples:

company career pages
job postings
certification links
source links

The application should avoid unsafe URL schemes.

43. CSRF Considerations

The application must follow the authentication/session architecture recommended by the selected Supabase and web framework configuration.

Where cookie-based authenticated state is used, CSRF protections must be evaluated.

The implementation must not assume that a browser automatically makes authenticated state safe.

44. CORS Security

Cross-origin access should be limited to approved application origins.

Production configuration should not use unrestricted origins unless explicitly justified.

Development origins should not automatically remain enabled in production.

45. Rate Limiting

Rate limiting should protect:

authentication attempts
password recovery
search endpoints
expensive readiness evaluations
administrative operations
file uploads
AI requests
public APIs
46. Authentication Rate Limits

Repeated failed authentication attempts should be controlled through the authentication provider and/or application-level protections.

The goal is to reduce:

brute-force attempts
credential stuffing
automated abuse

Rate limiting must not unnecessarily lock out legitimate users.

47. Readiness Rate Limits

Readiness calculations can be computationally expensive.

The system may limit repeated requests from the same:

user
session
endpoint
target

A cached result may be reused where appropriate.

48. AI Rate Limits

AI-powered functionality must have explicit usage limits.

Examples:

Gap explanation
Recommendation explanation
Career summary

Limits protect both:

system resources
financial/API usage
49. Abuse Prevention

The system should detect or limit:

automated account creation
repeated expensive requests
excessive search requests
malicious uploads
repeated failed privileged actions
API scraping
unusual administrative activity
50. File Storage Security

Files may include:

certificates
project documents
resumes
evidence
supporting documents

Storage must use private buckets for sensitive student documents unless the product explicitly requires public access.

51. Storage Ownership

A student's private file should be associated with that student's identity.

Conceptually:

auth.uid()
   ↓
student
   ↓
storage object ownership

Storage policies must prevent cross-student file access.

52. Storage File Types

Allowed file types should be explicitly defined.

Examples may include:

PDF
PNG
JPG
JPEG

The exact list should be controlled by product requirements.

Unexpected file types should be rejected.

53. File Size Limits

Uploads must have reasonable maximum sizes.

Limits should protect:

storage capacity
database metadata
bandwidth
processing systems

Large files should not be accepted simply because the browser permits them.

54. File Name Security

Original file names are untrusted input.

Storage paths should use safe identifiers rather than directly trusting user-provided file names.

Example:

student/{student_id}/{generated_object_id}

rather than:

student/{user_supplied_filename}
55. File Content Validation

File extensions alone are insufficient.

Where practical, uploaded files should be checked using:

MIME type
file signature
parser validation
malware scanning where available

Uploaded content must not automatically be trusted.

56. Private Documents

Sensitive documents must not be exposed through permanent public URLs.

Use controlled access mechanisms such as authenticated retrieval or short-lived signed access where supported.

57. Audit Logging

Security-sensitive actions should be auditable.

Examples:

CREATE
UPDATE
ARCHIVE
PUBLISH
UNPUBLISH
VERIFY
REJECT
RETIRE
RESTORE
ROLE_CHANGE

Audit records should identify the relevant actor and resource.

58. Audit Actor Types

The database audit architecture may distinguish:

ADMIN
SYSTEM
IMPORT
SYNC

The exact actor model must remain synchronized with the database specification.

59. Audit Immutability

Audit history should be append-only.

Normal application users must not:

edit audit records
delete audit records
rewrite historical actions

If correction is required, a new audit event should document the correction.

60. Audit Information

Where appropriate, an audit record should capture:

actor
action
resource
resource ID
timestamp
relevant change
previous state
new state
source
reason
request context

Sensitive values should not be logged unnecessarily.

61. Security Logging

Security events may include:

repeated authentication failures
role changes
permission failures
unusual administrative activity
service failures
suspicious API activity
secret exposure events
storage access anomalies

Logs should support investigation without exposing secrets.

62. Logging Secrets

Logs must never contain:

passwords
access tokens
refresh tokens
service-role keys
private API keys
authentication cookies
secret environment variables
63. Logging Personal Data

Personal data in logs should be minimized.

Prefer:

user_id
resource_id
event_type
timestamp

over unnecessary copies of:

full name
email
address
documents
64. Privacy Principle

UPROOTERS should collect only information necessary for:

profile management
academic tracking
career readiness
recommendations
system operation
security
legally required purposes

Unnecessary personal data should not be collected.

65. Student Privacy

Student information is private by default.

Examples include:

academic performance
CGPA
projects
certifications
experience
readiness evaluations
private evidence
personal contact information

These must not become public merely because the student uses the product.

66. Public Career Data

Company and job-opening information may be public information.

However, UPROOTERS must preserve:

source
provenance
verification state
freshness
lifecycle

Public availability does not eliminate data-quality responsibilities.

67. Data Minimization

Do not store sensitive information unless it provides a clear product purpose.

Examples of information requiring strong justification include:

exact home address
government identification numbers
financial information
unnecessary personal documents
68. Data Retention

Different data categories may have different retention requirements.

For example:

Active student profile
Historical academic records
Historical readiness evaluations
Closed job openings
Audit history

Retention rules must be documented.

Historical records should not be deleted merely for convenience.

69. Data Deletion Requests

Where applicable, user data deletion workflows must distinguish between:

deletable personal data
legally required records
security audit records
historical system records
derived records

Deletion must not accidentally destroy required security history.

70. Privacy by Default

New features must default to the most privacy-preserving reasonable behavior.

Examples:

Private student data → private
New uploaded document → private
New readiness evaluation → student-visible only
Administrative notes → restricted
71. Administrative Privacy

Administrators should only access student information required for their assigned duties.

Administrative visibility must not mean:

"Every administrator can see everything."

72. Data Editor Privacy Boundary

Data Editors primarily manage career-data infrastructure.

They should not automatically gain unrestricted access to:

student academic records
student private documents
personal contact details
private readiness history
73. Verifier Privacy Boundary

Verifiers may require access to specific evidence for verification.

Access should be:

purpose-limited
role-controlled
auditable

Verification access must not become unrestricted student-data access.

74. Super Admin Privacy

Super Admin may have broad access for system administration.

Because of this privilege, Super Admin operations should receive stronger:

authentication
auditing
monitoring
operational controls
75. AI Security Boundary

AI is an untrusted processing component.

AI must not become the authoritative source for:

student identity
career requirements
verification state
readiness score
permissions
security decisions
76. AI Input Minimization

Only the minimum information needed for an AI task should be provided.

For example, generating a skill-gap explanation may require:

Target requirement
Student evidence summary
Requirement result

It may not require the student's entire profile.

77. AI Prompt Injection

External content may contain malicious instructions.

Potential sources include:

job descriptions
public web pages
uploaded documents
project descriptions
company descriptions

The system must treat retrieved content as data, not trusted instructions.

78. AI Instruction Hierarchy

The application should separate:

System instructions
Application rules
Structured data
External untrusted content

External career content must never override security rules.

79. AI Output Validation

AI output must be treated as untrusted.

Before displaying or storing important AI-generated information:

validate format
validate referenced entities
verify factual claims where necessary
prevent unauthorized actions

AI output must not directly modify privileged database state.

80. AI and Readiness Scores

AI must not independently calculate or alter the authoritative readiness score.

Correct architecture:

Structured Requirements
        ↓
Deterministic Readiness Engine
        ↓
Readiness Result
        ↓
AI Explanation

Not:

Student Profile
        ↓
AI Guess
        ↓
Readiness Score
81. AI and Recommendations

AI may help explain or phrase recommendations.

However, recommendations must originate from structured product logic.

Example:

Missing:
FreeRTOS

Engine:
Recommendation required

AI:
Explains possible learning/project action

AI must not invent the underlying gap.

82. AI Data Leakage

Sensitive student data must not be sent to external AI services unless:

the service is approved
the data flow is documented
privacy requirements are satisfied
the user experience provides appropriate disclosure
security controls are implemented
83. Third-Party Integrations

Third-party services must be reviewed before integration.

Consider:

data sent
data retained
authentication method
permissions
security controls
privacy implications
failure behavior

Only necessary integrations should be enabled.

84. Webhook Security

Incoming webhooks must be authenticated.

Possible mechanisms include:

signature verification
shared secrets
timestamp validation
replay protection

An unauthenticated webhook must never directly modify sensitive data.

85. External Career Data Security

Career-data ingestion must treat external data as untrusted.

Potential risks include:

malicious URLs
poisoned job descriptions
fake company information
misleading requirements
malicious embedded content

Imported information must pass validation and verification workflows.

86. Data Import Security

Bulk imports must:

validate schema
validate records
detect duplicates
identify source
identify import actor
support rollback/recovery
produce audit information

Imports must not bypass required verification rules.

87. Privileged Operations

High-risk operations include:

role assignment
role removal
publishing job data
verification
bulk imports
database migrations
security configuration
secret rotation

These operations should require elevated authorization and auditing.

88. Database Security

PostgreSQL security must include:

RLS
least-privilege grants
constraints
secure functions
controlled triggers
protected schemas
restricted privileged access

The database must not depend solely on application code for authorization.

89. Database Function Security

Database functions must be reviewed for:

execution privileges
search path behavior
input validation
SECURITY DEFINER usage
ownership
privilege escalation risks

SECURITY DEFINER functions should be used only when necessary and must be carefully hardened.

90. Migration Security

Database migrations must be:

version controlled
reviewed
ordered
tested
reversible where practical
executed through controlled environments

Production migrations must not be casually edited after deployment.

91. Backup Security

Backups must be protected with appropriate access controls.

Backups may contain highly sensitive student information.

Therefore:

backup access must be restricted
backup credentials must be protected
backup retention must be defined
restoration must be tested
92. Disaster Recovery

The system should define recovery procedures for:

database corruption
accidental deletion
compromised credentials
infrastructure failure
malicious changes
failed migration

Recovery procedures must be tested rather than merely documented.

93. Incident Detection

Security incidents may be indicated by:

unusual login activity
privilege escalation
unexpected data access
abnormal API traffic
secret exposure
suspicious database changes
compromised third-party integration

Monitoring should surface important anomalies.

94. Incident Response

The incident response process should follow:

DETECT
  ↓
CONTAIN
  ↓
INVESTIGATE
  ↓
ERADICATE
  ↓
RECOVER
  ↓
REVIEW

The goal is to reduce impact and restore trustworthy operation.

95. Incident Containment

Depending on the incident, containment may include:

revoke sessions
disable affected accounts
rotate secrets
disable compromised integrations
block abusive traffic
pause ingestion
restrict privileged operations

Containment actions should be logged.

96. Security Testing

Security testing should include:

Authentication
login
logout
recovery
session expiry
Authorization
role boundaries
privilege escalation
unauthorized operations
RLS
student isolation
admin access
cross-user access attempts
API
malformed input
injection
rate limiting
Storage
unauthorized downloads
invalid uploads
path traversal attempts
AI
prompt injection
data leakage
malicious external content
97. Production Security Checklist

Before production release:

 Supabase Auth configured securely
 Email/authentication settings reviewed
 RLS enabled on protected tables
 RLS policies tested
 Student isolation tested
 Administrative roles tested
 Service-role key excluded from frontend
 Secrets removed from Git
 Environment variables separated
 Production credentials protected
 API validation implemented
 Rate limits configured
 Storage buckets reviewed
 Storage policies tested
 File-size limits configured
 File-type validation configured
 Audit logging enabled
 Sensitive logs reviewed
 AI boundaries implemented
 Third-party integrations reviewed
 Backup strategy configured
 Recovery process tested
 Incident response documented
 Security tests passing
98. Security Review Checklist

Before each major release, review:

Authentication
Authorization
RLS
Roles
Secrets
API
Storage
Logging
Privacy
AI
Third-party integrations
Backups
Recovery
Monitoring
Dependencies
Migrations

Any unresolved high-impact security issue must be documented before release.

99. Definition of Done

The UPROOTERS security model is complete when:

Authentication is securely implemented.
Authorization is role-based.
Student records are isolated with RLS.
Administrative permissions are explicit.
Service-role credentials are protected.
Secrets are not committed to source control.
API inputs are validated.
Database access uses safe query mechanisms.
Storage access is protected.
Sensitive files remain private.
Audit history is protected.
Personal data collection is minimized.
AI operates within explicit security boundaries.
Rate limiting protects expensive and sensitive operations.
Third-party integrations are controlled.
Backups are protected.
Recovery procedures exist.
Security incidents have a response process.
Security testing covers important attack paths.
Production deployment passes the security checklist.
100. Final Security Principle

UPROOTERS security must never depend on:

"The user probably won't try that."

Security must be based on enforced boundaries.

The core security model is:

IDENTITY
   ↓
AUTHENTICATION
   ↓
ROLE
   ↓
AUTHORIZATION
   ↓
RESOURCE OWNERSHIP
   ↓
POSTGRESQL RLS
   ↓
VALIDATION
   ↓
AUDIT
   ↓
MONITORING

The most important rule is:

A user must only be able to access or modify the data and actions they are explicitly authorized to access or modify.

For student data:

auth.uid()
    ↓
student identity
    ↓
owned resources
    ↓
RLS
    ↓
authorized operation

For career data:

Source
   ↓
Validation
   ↓
Verification
   ↓
Publication
   ↓
Student-facing data

For readiness:

Verified Data
   ↓
Deterministic Engine
   ↓
Explainable Result
   ↓
Student

For AI:

Trusted Application Rules
        ↓
Structured Data
        ↓
AI
        ↓
Validated Explanation

AI must never become the security authority.

The frontend must never become the authorization authority.

The database must never become an unprotected data store.

The security system must protect the student's information while still allowing UPROOTERS to provide useful career intelligence.

UPROOTERS should be secure by design, private by default, auditable by construction, and restrictive wherever trust cannot be established.
