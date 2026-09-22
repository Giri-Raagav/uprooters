# UPROOTERS — UI/UX Specification

## 1. Purpose

This document defines the visual identity, interaction style, layout language, and user experience of UPROOTERS.

It must remain consistent with:

- `01_PRODUCT_SPEC.md`
- `02_FRONTEND_SPEC.md`

The UI should communicate a professional academic and career-focused product, not a generic college portal.

---

## 2. Brand Structure

The opening experience displays:

**Ace&place**

This branding is primarily used on the opening/entry experience.

After entering the application, the interface focuses on the UPROOTERS product experience.

---

## 3. Opening Experience

The opening page should contain:

- Ace&place branding;
- a study/growth-oriented quote;
- a short explanation of the application;
- an academic atmosphere;
- imagery inspired by books, notes, studying, late-night work, and learning.

The visual should feel premium, calm, motivating, and sophisticated.

It must not feel like a generic educational advertisement.

---

## 4. Entry and Role Selection

After the opening experience, users enter the authentication flow.

The user can enter as:

- Student
- Administrator

The selected role determines the appropriate application experience and visual theme.

Authorization must still be enforced by the backend.

---

## 5. Overall Design Direction

The primary visual direction is:

- professional;
- academic;
- clean;
- minimal;
- corporate;
- sophisticated;
- modern.

Design inspiration includes the visual discipline of high-end products such as Apple, Google, and Vercel.

Avoid:

- boring college-portal styling;
- excessive neon;
- childish visual language;
- excessive AI branding;
- orange as a dominant brand color;
- visual congestion;
- unnecessary decorative elements.

---

## 6. Theme System

Support:

- light mode;
- dark mode.

The interface should maintain the same design language across both modes.

Student and Administrator experiences should use different visual palettes while retaining a shared design system.

---

## 7. Brand Color Direction

The preferred color palette includes:

- red wine;
- emerald blue;
- cloudy blue;
- `#F2B94F`;
- `#013328`.

Exact color assignments will be finalized during implementation/design-system refinement.

Orange should not be used as the dominant visual identity.

---

## 8. Student Theme

The Student interface should feel:

- motivating;
- academic;
- focused;
- modern;
- career-oriented.

It should combine the student's college journey with career development.

The student dashboard is the primary application home.

---

## 9. Administrator Theme

The Administrator interface should retain the same structural design language while using a distinct professional color palette.

Administrator screens should emphasize:

- data management;
- verification;
- monitoring;
- accuracy;
- system information.

The visual distinction must not make the application feel like two unrelated products.

---

## 10. Global Navigation

Desktop navigation should use a left sidebar.

The sidebar provides access to the major application sections.

Student navigation includes:

- Dashboard
- Profile
- Academics
- Skills
- Projects
- Certifications
- Experience
- Career Readiness
- Companies
- Recommendations

The navigation should support subtle cursor-based interaction and smooth spatial transitions.

---

## 11. Motion and Transitions

The application should use smooth, subtle transitions.

3D/spatial transitions may be used to create a premium sense of movement between sections.

Motion must remain:

- purposeful;
- smooth;
- restrained;
- readable;
- performant.

Avoid excessive animation or effects that distract from information.

Reduced-motion preferences must be respected.

---

## 12. Student Dashboard

The dashboard should provide an immediate overview of the student's current status.

The top area should include a short study/career motivation quote.

The dashboard should provide:

- academic status;
- skill status;
- project/experience status;
- career readiness;
- recommendations;
- recent searches.

The dashboard should combine overview cards with information-dense sections.

The student should understand their current situation without navigating through multiple pages.

---

## 13. Career Readiness Experience

Career readiness is one of the main visual experiences.

A readiness view should show:

- target company/role/job;
- readiness percentage;
- requirements;
- satisfied requirements;
- missing requirements;
- supporting evidence;
- recommended actions.

Use a combination of:

- progress bars;
- skill matrix;
- requirement checklist.

The percentage must always be supported by an understandable breakdown.

---

## 14. Skill-Gap Intelligence Map

The Skill-Gap Intelligence Map is a signature UPROOTERS experience.

It connects:

**Student Skills → Target Career → Requirements → Gaps → Evidence → Next Action**

The map should allow users to explore gaps interactively.

Selecting a missing requirement should reveal available information such as:

- required skill;
- requirement type;
- current student evidence;
- reason for the gap;
- related career target;
- recommended next action.

The visualization must provide useful information rather than serving only as decoration.

---

## 15. Career Tree

The Career Tree is another signature UPROOTERS experience.

It visually represents possible career paths connected to the student's current profile.

Example structure:

**Student Profile → Career Domain → Role → Related Career Paths**

The tree should show relevant skills, requirements, and readiness information where supported.

It should help students explore possibilities without deciding their career choice for them.

The student remains responsible for choosing their target.

---

## 16. College Journey

The student's college journey should use a visual progress journey.

It may represent:

- academic years;
- semesters;
- projects;
- certifications;
- internships;
- experience;
- important milestones.

The journey should communicate progression from entry into college toward graduation and career preparation.

---

## 17. Company Experience

Company pages should use an analytical UPROOTERS-style experience rather than a conventional job-board layout.

A company view may show:

- company information;
- relevant roles;
- job openings;
- required skills;
- student readiness;
- verification information;
- source information.

The interface should emphasize the relationship between the company requirements and the student's profile.

---

## 18. Job Opening Experience

A job opening should be presented as an analytical career opportunity.

The page should connect:

**Job Requirements → Student Evidence → Missing Requirements → Readiness**

The user should be able to understand why a requirement is satisfied, missing, or unsupported.

---

## 19. Recommendations

Recommendations should be visually actionable.

They should connect directly to:

- missing skills;
- career requirements;
- academic development;
- projects;
- certifications;
- experience.

Avoid generic motivational recommendation cards.

---

## 20. Imagery

Major sections should use imagery related to:

- studying;
- books;
- multiple textbooks;
- handwritten notes;
- late-night academic work;
- focused learning;
- projects;
- preparation;
- motivation.

Images should support the atmosphere without overwhelming the actual product information.

Imagery should feel sophisticated and cohesive rather than like unrelated stock photography.

---

## 21. Content Density

The interface should use a combination of:

- clean cards;
- structured information panels;
- tables where appropriate;
- visualizations;
- checklists;
- timelines;
- analytical sections.

Avoid both extremes:

- excessive empty space that hides useful information;
- excessive content that creates congestion.

Important information should receive stronger visual hierarchy.

---

## 22. Responsive Experience

Desktop and mobile have equal importance.

The same product experience must remain usable on:

- desktop;
- tablet;
- mobile.

The sidebar should transform into an appropriate mobile navigation pattern.

Visualizations such as the Skill-Gap Map and Career Tree must have usable mobile representations.

---

## 23. Accessibility

The UI should support:

- keyboard navigation;
- visible focus states;
- readable typography;
- semantic structure;
- accessible labels;
- meaningful status indicators;
- reduced-motion preferences.

Color must not be the only method used to communicate status.

---

## 24. Trust and Data Presentation

Career information must clearly distinguish:

- verified;
- unverified;
- stale;
- current;
- incomplete.

Where applicable, source and verification information should be accessible without overwhelming the primary interface.

The visual design must never make unverified information appear equivalent to verified information.

---

## 25. Interaction Principles

Interactions should be:

- predictable;
- smooth;
- purposeful;
- responsive;
- easy to understand.

Hover, focus, click, transition, and selection states should be visually consistent.

3D interaction should enhance navigation and understanding, not become a visual gimmick.

---

## 26. UX Anti-Patterns

Do not create:

- generic college-portal dashboards;
- excessive neon gradients;
- unnecessary glassmorphism;
- childish illustrations;
- excessive AI chatbot branding;
- overloaded dashboards;
- decorative charts without useful information;
- unexplained readiness scores;
- fake career data;
- repeated branding that distracts from the product.

---

## 27. Design System Consistency

Shared components should maintain consistent:

- typography;
- spacing;
- borders;
- radius;
- buttons;
- cards;
- navigation;
- status indicators;
- forms;
- transitions.

Student and Administrator themes may change colors and visual emphasis but must remain part of one design system.

---

## 28. Definition of Done

A UI/UX feature is complete when:

- it follows the Product Specification;
- it follows the Frontend Specification;
- it follows this visual direction;
- the information hierarchy is clear;
- responsive behavior is handled;
- accessibility is considered;
- motion is purposeful;
- no unsupported information is introduced;
- the design remains professional and uncluttered.

---

## 29. Final UI/UX Principle

UPROOTERS should feel like a high-end academic and career intelligence product.

The interface should visually communicate:

**Where am I?**

**What have I achieved?**

**What skills do I have?**

**Where can I go?**

**What am I missing?**

**What can I do next?**

The design should make these answers clear without sacrificing professionalism, simplicity, or trust.