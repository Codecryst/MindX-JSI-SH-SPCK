# Intentionally Amateur / Poor Website Design Style Guide

## Purpose

Use this document as a **visual and structural style constraint** when programming a website.

The goal is to intentionally reproduce the design quality and visual language of a simple student-made / beginner-made website: functional, somewhat awkward, overly dependent on basic UI components, and visibly unpolished.

**Important:** This guide controls **design style only**. Do not copy the original project's content, branding, text, colors, images, API data, or project-specific features. Choose those independently for each project.

---

## 1. Overall Design Direction

Build the interface so that it feels:

- Beginner-made rather than professionally art-directed.
- Functional before beautiful.
- Slightly over-engineered in places and under-refined in others.
- Clearly assembled from basic UI components.
- Box-heavy and section-heavy.
- More rigid than fluid.
- Visually repetitive.
- A little awkward in spacing and proportions.
- Usable, but not polished.
- Like a school/student project that has been iteratively modified rather than designed from a complete design system.

Do **not** automatically improve the design into a modern SaaS landing page, premium portfolio, startup website, glassmorphism interface, minimalist editorial site, or highly polished component system.

The imperfections are intentional.

---

# 2. Page Structure

Prefer a straightforward vertical page made from separate rectangular sections.

Typical structure:

1. Top navigation bar
2. Large introductory / call-to-action section
3. Main two-column section
4. Information section
5. Repeated grid/list section
6. Contact or secondary information section
7. Optional API/data/demo section
8. Footer

Not every project needs every section. Adapt the content, but preserve the general **simple stacked-section architecture**.

Avoid sophisticated compositions where several visual layers overlap.

---

# 3. Navigation Bar

Use a conventional Bootstrap-like navigation structure.

Characteristics:

- Horizontal navigation on desktop.
- Brand/name on the left.
- Several simple navigation links.
- Account/action buttons on the right.
- A basic hamburger/collapse behavior on smaller screens.
- Sticky navigation is acceptable and preferred when appropriate.
- Keep the navigation fairly dense.
- Links can have noticeably different visual emphasis.
- Use ordinary rectangular buttons rather than custom futuristic controls.

The navigation should feel assembled from standard components rather than custom-designed from scratch.

Avoid:

- Floating navigation pills.
- Huge transparent overlays.
- Complex mega menus.
- Animated navigation systems.
- Sophisticated blur effects.
- Excessively minimal navigation with only one tiny icon.

---

# 4. Containers and Sections

Use centered, constrained containers with clearly visible rectangular boundaries.

Common characteristics:

- Medium-width content containers.
- Rounded corners, but not excessively large.
- Visible borders around major sections.
- Generous but somewhat inconsistent padding.
- Large gaps between major sections.
- Repeated use of the same container treatment.
- Sections should visually feel like separate boxes placed down the page.

It is acceptable for multiple sections to look almost identical.

Avoid making every section visually unique.

---

# 5. Borders and Shadows

Use borders and shadows as obvious decorative elements.

Preferred behavior:

- Major sections have borders.
- Cards/panels have shadows.
- Navigation can have a border and shadow simultaneously.
- Interactive elements may intensify their shadow on hover.
- Shadows can be slightly stronger than necessary.
- Reuse the same shadow pattern repeatedly.

The shadow should feel like a developer added it because the component looked too plain.

Avoid subtle, sophisticated elevation systems with carefully tuned depth.

Do not use colors from the reference project; shadow color and border color must be selected separately for each project.

---

# 6. Typography

Use ordinary web typography.

Characteristics:

- Strong headings.
- Large headings inside boxed sections.
- Frequent bold text.
- Simple paragraph text.
- Occasional heading sizes that are slightly too large for their container.
- Standard link styling is acceptable.
- Text alignment can be centered frequently.
- Keep typography straightforward rather than editorial.

Prefer hierarchy created with:

- `h1`
- `h2`
- `h3`
- `h5`
- bold text
- standard paragraph text

Do not introduce an elaborate typography scale unless the project genuinely needs it.

Avoid:

- Luxury/editorial typography.
- Giant cinematic typography.
- Highly customized variable-font systems.
- Excessively tiny metadata text.
- Extremely sophisticated typographic rhythm.

---

# 7. Hero / Introduction Area

The top content area should be simple and boxed rather than cinematic.

Good characteristics:

- A large heading.
- Short supporting text.
- One or two conventional buttons.
- Centered alignment is common.
- A bordered container around the section.
- Large top and bottom spacing.
- The section should feel like a normal HTML/Bootstrap component enlarged into a hero.

Do not make it look like a professional marketing hero with:

- complex gradients,
- floating decorative objects,
- elaborate illustrations,
- layered image compositions,
- sophisticated animations,
- massive whitespace,
- complex asymmetric art direction.

---

# 8. Two-Column Content

When there is an opportunity to show two related pieces of information, prefer a simple two-column grid.

Example pattern:

```text
┌──────────────────────┬──────────────────────┐
│                      │                      │
│      Text/Quote      │      Code/Demo       │
│                      │                      │
└──────────────────────┴──────────────────────┘
```

Characteristics:

- Equal or approximately equal columns.
- Noticeable gap between columns.
- Each column is its own rectangular panel.
- Rounded corners.
- Internal padding.
- Basic shadow.
- Content can feel slightly mismatched in height.

The layout should resemble a developer manually putting two cards beside each other.

Avoid sophisticated masonry, overlapping cards, diagonal layouts, or asymmetric art-directed grids.

---

# 9. Code / Technical Panels

For technical projects, code can be displayed inside a dedicated rectangular panel.

Characteristics:

- Use a `<pre>` or code block.
- Keep the code readable but visually plain.
- Give the code panel its own background/border/shadow.
- Let long lines wrap or overflow in a straightforward way.
- The code panel may be noticeably taller or wider than surrounding content.
- It should look like a demo embedded into a normal webpage, not like a professional IDE.

Do not build a complete custom code editor unless the actual project requires one.

---

# 10. Repeated Grid Items

For lists of features, technologies, categories, languages, products, or similar items, use a repetitive grid.

Preferred structure:

```text
┌────────┐ ┌────────┐ ┌────────┐
│ Item 1 │ │ Item 2 │ │ Item 3 │
└────────┘ └────────┘ └────────┘

┌────────┐ ┌────────┐ ┌────────┐
│ Item 4 │ │ Item 5 │ │ Item 6 │
└────────┘ └────────┘ └────────┘
```

Characteristics:

- Small repeated cards.
- Similar dimensions.
- Simple rounded corners.
- Consistent internal padding.
- Small gaps.
- Repeated border/shadow treatment.
- Grid columns should automatically collapse on smaller screens.

Do not make each card individually art-directed.

The repetition is part of the intentionally amateur aesthetic.

---

# 11. Cards

Cards should look like conventional framework cards.

Use:

- Rectangular body.
- Moderate corner radius.
- Internal padding.
- Heading.
- Paragraph or controls.
- Optional button.
- Border and/or shadow.

It is acceptable for cards to look generic.

Avoid:

- Floating glass cards.
- Complex layered cards.
- Excessive iconography.
- 3D cards.
- Highly animated cards.
- Perfectly polished premium card systems.

---

# 12. Forms and Authentication Pages

For login/signup/settings-style pages, use a single centered card.

Preferred structure:

```text
                ┌──────────────────────┐
                │        TITLE         │
                │                      │
                │ Label                │
                │ [ input            ] │
                │                      │
                │ Label                │
                │ [ input            ] │
                │                      │
                │ [      BUTTON      ] │
                │                      │
                │ secondary link       │
                └──────────────────────┘
```

Characteristics:

- Center card.
- Roughly narrow fixed/max width.
- Full-page vertical centering.
- Standard inputs.
- Standard buttons.
- Labels above inputs.
- One primary button spanning most/all of the card width.
- Secondary navigation links underneath.
- Straightforward form spacing.

The authentication page should look like a basic Bootstrap form, not a custom authentication experience.

---

# 13. Buttons

Use ordinary buttons.

Characteristics:

- Rectangular.
- Small-to-medium border radius.
- Standard padding.
- Clear text.
- A few different variants are acceptable.
- Buttons can be slightly inconsistent if different framework utilities are used.

Use normal hover states.

Avoid:

- Pill-only interfaces.
- Huge oversized CTA buttons.
- Complex animated buttons.
- Gradient buttons.
- Neon/glowing buttons as a universal rule.
- Custom icon-only controls when text would be clearer.

---

# 14. Interaction Style

Interactions should be simple.

Use:

- Basic hover changes.
- Small shadow increase.
- Basic color/text changes.
- Standard Bootstrap-like collapse behavior.
- Simple show/hide interactions.
- Conventional form validation.
- Basic buttons and links.

Avoid:

- Complex page transitions.
- Scroll-triggered cinematic animations.
- Parallax.
- Magnetic buttons.
- Elaborate micro-interactions.
- Excessive motion.
- Sophisticated animated backgrounds.

The website should feel mostly static.

---

# 15. Spacing

Spacing should be reasonable but not perfectly systematized.

Use:

- Large gaps between major sections.
- Moderate internal card padding.
- Small gaps between related controls.
- Noticeable vertical separation.
- Occasional slightly excessive padding.

It is acceptable if spacing is not perfectly mathematically consistent.

Do not create a highly refined 4px/8px design system unless the project needs one.

The page should look like spacing was adjusted component-by-component.

---

# 16. Responsive Behavior

Desktop should generally use:

- Horizontal navigation.
- Multi-column grids.
- Two-column content.
- Centered containers.

Mobile should use basic breakpoint behavior:

- Navigation collapses.
- Two columns become one.
- Grid items reduce their column count.
- Cards become full-width.
- Text becomes smaller.
- Padding decreases.
- Buttons may become wider.

Responsive behavior should be functional but simple.

Do not create highly specialized layouts for every viewport size.

A few conventional breakpoints are enough.

---

# 17. Intentional Imperfections

These are important.

The final result may contain mild signs of amateur implementation:

- Slightly excessive shadows.
- Repeated visual treatments.
- Slightly awkward spacing.
- Generic cards.
- Sections that feel too boxed-in.
- Some elements that are wider/taller than strictly necessary.
- Conventional Bootstrap components mixed with custom CSS.
- A few inline-style-like adjustments when appropriate.
- Slightly inconsistent component proportions.
- Simple responsive changes instead of sophisticated fluid behavior.
- Decorative effects repeated more often than a professional designer would use.
- Content that occasionally feels too close to the edge of a component.
- A layout that is functional but not exceptionally elegant.

These imperfections should remain **controlled**. The site must still work.

Do not intentionally introduce:

- broken functionality,
- unusable navigation,
- inaccessible text,
- severe overflow,
- broken mobile layouts,
- security vulnerabilities,
- fake loading states,
- unnecessary errors,
- invalid HTML purely for aesthetic reasons.

The target is **poor visual/design polish**, not a broken website.

---

# 18. Framework / Implementation Feel

The visual result should be compatible with a simple framework-heavy implementation.

It is acceptable to use:

- Bootstrap-like containers.
- Bootstrap-like navbar.
- Bootstrap-like cards.
- Bootstrap-like forms.
- Bootstrap-like buttons.
- Utility classes.
- Small amounts of custom CSS layered over framework components.

Do not spend large amounts of code building a sophisticated design system.

Prefer simple CSS and ordinary HTML structures.

---

# 19. Things That Must NOT Be Copied From the Reference

When applying this guide to another project, do **not** copy:

- The reference project's colors.
- Brand name.
- Text.
- Images.
- Logos.
- Icons specific to the original project.
- API/data content.
- Programming-language list.
- Contact information.
- Specific slogans.
- Specific dimensions when the new content requires different dimensions.
- Original URLs.
- Original functionality.

Only reproduce the **design language and implementation character**.

---

# 20. Anti-Polish Rules

When the result starts looking too professional, deliberately simplify it.

Do not automatically add:

- gradients,
- glassmorphism,
- backdrop blur,
- floating decorative shapes,
- sophisticated illustrations,
- premium typography,
- complex animations,
- elaborate hover effects,
- huge hero artwork,
- ultra-clean minimalist spacing,
- complex component variants,
- excessive icon systems,
- advanced motion design,
- polished SaaS dashboards.

If a standard HTML/Bootstrap solution is sufficient, prefer it.

---

# 21. AI Coding Instruction

When generating or modifying the website, follow this priority order:

1. **Functionality**
2. **Clear content hierarchy**
3. **Simple responsive structure**
4. **Box-based component layout**
5. **Basic framework-style components**
6. **Intentional amateur visual polish**
7. **Avoid unnecessary sophistication**

Do not "improve" the visual design beyond this style.

If you have to choose between:

- a polished professional design, and
- a simple slightly awkward student-project design,

choose the **simple slightly awkward student-project design**.

The design should look intentionally made by a competent beginner who knows basic HTML/CSS/framework components, but does not have professional UI/UX design discipline.

---

# 22. Short AI Prompt

If only a compact instruction is needed, use this:

> Build the website with an intentionally amateur/student-project visual style. Use simple framework-like components, boxed sections, visible borders, repeated cards, conventional rectangular buttons, straightforward typography, a basic navbar, centered form cards, simple two-column layouts, and repetitive grid components. Keep spacing somewhat imperfect, shadows slightly overused, and component styling generic. Make it functional and responsive, but not polished or premium. Avoid gradients, glassmorphism, cinematic hero sections, elaborate animations, sophisticated typography, floating decorative elements, and complex custom UI. Preserve the intentional lack of professional visual refinement. Do not copy any project-specific colors, content, branding, imagery, or functionality from the reference; only reproduce its design character.


#USE SIMPLE STUDENT LEVEL LOGIC AND SCRIPTING

# 23. Simple Student-Level Logic and Scripting

Use super easy to understand logic and code.

Characteristics:

- Use easy, simple, beginner-level JavaScript.
- Use plain, straightforward functions with clear names.
- Use basic `if` / `else` and basic loops.
- Keep each function small and doing one simple thing.
- Use simple variables, simple conditions, and step-by-step logic.
- Keep scripting as simple as a student would write, while still functional.

Avoid:

- Clever, complex, or advanced patterns.
- Hard-to-read one-liners, nested tricks, or fancy syntax.
- Deep abstraction, over-engineered helpers, or unnecessary frameworks.
- Complicated async flows, complex state management, or advanced design patterns when simple code is enough.

The code should look like it was written by a competent beginner: simple, direct, a little repetitive when needed, but working.