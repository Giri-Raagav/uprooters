# UPROOTERS — Frontend Specification

## 1. Purpose

This document defines the frontend structure and behavior of UPROOTERS.

The frontend must implement the product defined in `01_PRODUCT_SPEC.md`.

This document defines:

- pages;
- navigation;
- user flows;
- components;
- displayed data;
- frontend states;
- permissions;
- responsive behavior;
- accessibility;
- frontend data rules.

It must not redefine the product model, database architecture, readiness calculations, or security model.

Those belong to their respective specification documents.

---

## 2. Frontend Principles

The frontend must prioritize:

- clarity;
- simplicity;
- traceability;
- explainability;
- consistency;
- responsive design;
- accessibility;
- trustworthy data.

The interface must never make unsupported claims about a student's career readiness.

Every important readiness result should be understandable from the underlying requirements and evidence.

---

## 3. Technology

Planned frontend stack:

- React
- TypeScript
- Tailwind CSS

The frontend should use reusable components and strongly typed data structures.

Avoid unnecessary frontend libraries unless they provide clear value.

---

## 4. Application Structure

The main authenticated application should contain:

- Dashboard
- Profile
- Academics
- Skills
- Projects
- Certifications
- Experience
- Career Readiness
- Companies
- Roles / Job Openings
- Recommendations

Administrative users may have additional data-management and verification interfaces.

---

## 5. Global Navigation

### Primary Navigation

The authenticated student navigation should provide access to:

1. Dashboard
2. Profile
3. Academics
4. Skills
5. Projects
6. Certifications
7. Experience
8. Career Readiness
9. Companies
10. Recommendations

Navigation must clearly show the current page.

The navigation should remain usable on desktop, tablet, and mobile.

---

## 6. Authentication

The frontend must support authenticated application access.

Required states:

- signed out;
- signing in;
- authenticated;
- authentication failure;
- session expired;
- unauthorized.

Unauthenticated users must not receive authenticated student data.

Authentication implementation must follow the Security Model specification.

---

## 7. Student Dashboard

The dashboard is the student's primary overview screen.

It should provide a concise view of the student's current college and career state.

### Dashboard sections

#### Academic Overview

Display available academic information such as:

- current semester;
- SGPA;
- CGPA;
- completed credits;
- academic progress.

Do not display calculated values that do not exist in the backend.

#### Skill Overview

Display:

- total tracked skills;
- verified skills;
- developing skills;
- skill categories;
- important missing skills when supported by readiness data.

#### Portfolio Overview

Display:

- projects;
- certifications;
- internships;
- experience.

#### Career Readiness Overview

Display:

- selected career targets;
- readiness evaluations;
- required skills;
- missing requirements;
- blocking requirements;
- recommended actions.

#### Recommendations

Display a short list of current actionable recommendations.

The dashboard should provide links to detailed pages rather than attempting to display the entire student record.

---

## 8. Profile Page

The profile page allows the student to view and manage their profile information.

Possible information includes:

- name;
- college;
- department;
- degree;
- branch;
- admission year;
- expected graduation year;
- current semester;
- profile information;
- biography;
- location;
- profile completion status.

Sensitive information must only be displayed according to the Security Model.

The frontend must distinguish editable fields from system-derived fields.

---

## 9. Academics Page

The academics page represents the student's academic journey.

Display:

- semesters;
- subjects;
- grades/marks where permitted;
- credits;
- SGPA;
- CGPA;
- arrears;
- retakes;
- academic progress.

The interface should allow the student to understand how their academic history contributes to career readiness.

Raw academic records and derived academic values should be visually distinguishable where necessary.

---

## 10. Skills Page

The skills page represents the student's skill inventory.

Each skill should support information such as:

- skill name;
- category;
- proficiency/evidence state;
- evidence count;
- related projects;
- certifications;
- experience;
- verification state.

The frontend should distinguish between:

- claimed skill;
- supported skill;
- verified evidence;
- missing skill.

A skill must not automatically be treated as verified merely because the student entered it.

---

## 11. Projects Page

The projects page displays the student's projects.

Project information may include:

- project title;
- description;
- technologies/skills;
- project type;
- duration;
- role;
- evidence;
- links;
- verification state.

Projects should be connected to canonical skills where supported.

A project may provide evidence for one or more skills.

---

## 12. Certifications Page

Display certifications such as:

- certification name;
- issuing organization;
- issue date;
- expiry date when applicable;
- associated skills;
- credential/evidence;
- verification status.

Expired or unverifiable certifications must not be presented as currently verified achievements.

---

## 13. Experience Page

The experience section represents:

- internships;
- work experience;
- apprenticeships;
- relevant practical experience.

Display:

- organization;
- role;
- duration;
- description;
- associated skills;
- evidence;
- verification state.

---

## 14. Career Readiness

Career Readiness is a core UPROOTERS feature.

The frontend must not treat readiness as a simple unexplained score.

A readiness view should explain:

1. Target company/role/job.
2. Requirements.
3. Student evidence.
4. Requirement status.
5. Missing requirements.
6. Blocking requirements.
7. Recommended actions.
8. Source/provenance where applicable.

---

## 15. Readiness Result States

Requirements may be represented using states such as:

- Met
- Partially Supported
- Missing
- Not Evaluated
- Unverified

The exact readiness result must come from the readiness engine.

The frontend must not independently calculate or modify the official readiness result.

---

## 16. Readiness Score

If a readiness score exists, display:

- score;
- evaluation date;
- engine version where appropriate;
- evaluation target;
- explanation.

The score must not be presented as a guarantee of employment.

The interface should emphasize the underlying requirements and evidence.

---

## 17. Missing Skills and Requirements

Missing requirements should be clearly identifiable.

For each missing requirement, display where supported:

- requirement;
- requirement type;
- why it is missing;
- related skill;
- current student evidence;
- recommended action;
- source.

The system must not hide missing requirements simply because the student has related skills.

---

## 18. Companies Page

The companies page provides access to career-related company information.

Display available information such as:

- company name;
- company status;
- relevant roles;
- active job openings;
- source information;
- verification state;
- last verified/updated information where supported.

Only supported database records should be displayed.

---

## 19. Roles and Job Openings

Role and job-opening pages must clearly distinguish:

- company;
- role;
- specific job opening.

A role represents a reusable career target.

A job opening represents a specific opportunity.

Where requirements differ between a general role and a specific opening, the frontend must display the effective requirements supplied by the backend.

---

## 20. Career Data Provenance

Career data must show appropriate provenance.

Where applicable, the frontend should display:

- source;
- source type;
- verification status;
- verification date;
- freshness/staleness state.

Unverified information must not visually appear equivalent to verified information.

The frontend must never invent:

- companies;
- job openings;
- requirements;
- salaries;
- skills;
- verification status;
- source information.

---

## 21. Recommendations

Recommendations should help students understand what to do next.

Each recommendation may include:

- recommendation;
- reason;
- priority;
- related skill;
- related requirement;
- related career target;
- supporting evidence;
- lifecycle state.

Recommendations should be actionable rather than generic motivational statements.

---

## 22. Data States

Every major frontend data view must handle:

### Loading

Show a clear loading state.

### Empty

Explain what is missing and provide an appropriate next action.

### Error

Show a useful error message without exposing sensitive technical information.

### Unverified

Clearly identify information that has not been verified.

### Stale

Clearly identify data that may require re-verification.

### Partial Data

Do not pretend that incomplete data represents a complete student profile.

---

## 23. Forms

Forms should:

- validate required fields;
- provide clear labels;
- show validation errors;
- preserve valid entered data where possible;
- prevent accidental duplicate submissions;
- show save/update status;
- handle server-side errors.

User input must never silently overwrite historical records where the data model requires history preservation.

---

## 24. Search and Filtering

Where search is provided, it should support the relevant canonical data.

Possible filters include:

- company;
- role;
- skill;
- skill category;
- employment type;
- work mode;
- location;
- verification state;
- opening status.

Filtering must use backend-supported data.

Do not create frontend-only career facts.

---

## 25. Responsive Design

The application must work across:

- desktop;
- tablet;
- mobile.

Desktop may use a persistent sidebar/navigation layout.

Mobile should use a compact navigation pattern.

Important information must remain accessible on smaller screens.

Tables should use responsive alternatives rather than forcing unusable horizontal layouts where practical.

---

## 26. Accessibility

The frontend should provide:

- semantic HTML;
- keyboard navigation;
- visible focus states;
- accessible labels;
- sufficient text readability;
- meaningful error messages;
- accessible interactive controls;
- appropriate ARIA usage when necessary.

Color must not be the only method used to communicate status.

---

## 27. Component Architecture

Components should be reusable and focused.

Expected component categories include:

- layout components;
- navigation;
- cards;
- tables;
- badges;
- status indicators;
- forms;
- dialogs;
- charts;
- requirement displays;
- readiness components;
- loading states;
- empty states;
- error states.

Avoid giant page components containing unrelated logic.

Business rules should not be hidden inside presentation components.

---

## 28. Data Access

Frontend data access must use the application's approved backend/data-access architecture.

Components should not directly duplicate database business logic.

The frontend should consume typed data structures.

Loading, error, empty, and permission states must be handled explicitly.

---

## 29. Permissions

The frontend must respect application roles:

- Student
- Data Editor
- Verifier
- Super Admin

The frontend may hide controls that the user cannot use, but authorization must also be enforced by the backend.

Frontend visibility is not a security boundary.

---

## 30. Security Rules

Never place secrets or private credentials in frontend code.

Do not expose:

- service-role keys;
- private credentials;
- internal security information;
- unauthorized student data.

Do not trust client-side role checks for authorization.

All sensitive operations must be protected by backend/database security.

---

## 31. Performance

The frontend should:

- avoid unnecessary requests;
- avoid unnecessary re-renders;
- paginate large datasets;
- lazy-load large sections when appropriate;
- avoid loading unnecessary career data;
- provide responsive feedback during longer operations.

Performance optimization must not compromise correctness or explainability.

---

## 32. Visual Consistency

The application should maintain consistent:

- spacing;
- typography;
- buttons;
- forms;
- cards;
- tables;
- status indicators;
- navigation;
- page layouts.

Exact visual styling will be defined in `03_UI_UX_SPEC.md`.

---

## 33. Frontend Testing

Frontend testing should cover:

- navigation;
- authentication states;
- form validation;
- loading states;
- empty states;
- error states;
- permission-based UI;
- readiness display;
- missing requirements;
- responsive layouts;
- important user flows.

Critical career-readiness information must be tested against known expected data.

---

## 34. Frontend Boundaries

This specification does not define:

- database schema;
- SQL migrations;
- detailed RLS policies;
- readiness calculation formulas;
- exact visual design system;
- backend architecture;
- deployment infrastructure.

Those belong to the corresponding specifications.

---

## 35. Implementation Rules

Before implementing a frontend feature:

1. Read the relevant product requirements.
2. Identify required backend data.
3. Identify permissions.
4. Define loading/error/empty states.
5. Implement the smallest complete change.
6. Test the feature.
7. Review for regressions.
8. Commit the change when the checkpoint is stable.

Do not build placeholder functionality that could be mistaken for real production data.

---

## 36. Definition of Done

A frontend feature is complete only when:

- it follows the Product Specification;
- required data is available and correctly represented;
- permissions are respected;
- loading/empty/error states are handled;
- responsive behavior is acceptable;
- accessibility is considered;
- tests pass where applicable;
- no unsupported career information is fabricated;
- no unrelated functionality is changed.

---

## 37. Source of Truth

Frontend decisions must follow this priority:

1. `01_PRODUCT_SPEC.md`
2. `02_FRONTEND_SPEC.md`
3. `03_UI_UX_SPEC.md`
4. `04_ARCHITECTURE.md`
5. `05_DATABASE_SPEC.md`
6. `06_READINESS_ENGINE.md`
7. `07_SECURITY_MODEL.md`
8. `08_DEVELOPMENT_RULES.md`

If two specifications conflict, do not silently choose one.

Identify the conflict before implementation.

---

## 38. Final Frontend Principle

UPROOTERS should feel like a clear career-readiness system, not a generic student dashboard.

The frontend must make it easy for a student to understand:

- where they are now;
- what evidence they have;
- what career targets they are exploring;
- what requirements those targets have;
- what they are missing;
- what they can do next.

Every displayed conclusion must be traceable to real data and supported product logic.