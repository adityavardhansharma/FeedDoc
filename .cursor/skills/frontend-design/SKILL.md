---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when building web components, pages, artifacts, posters, or applications (including websites, landing pages, dashboards, React components, and HTML/CSS layouts), or when styling/beautifying any web UI.
license: Complete terms in LICENSE.txt
---

# Frontend Design

Build visually distinctive, production-grade interfaces that avoid generic AI aesthetics. Ship real, working code with a clear point of view.

## When To Use

Use this skill when the user asks to:
- Build or redesign a frontend component, page, dashboard, landing page, or app UI
- Improve visual quality, polish, or creative direction
- Style an existing UI that feels generic, flat, or template-like
- Create design-forward artifacts with web tech (interactive poster, microsite, branded experience)

## Core Objective

Deliver code that is:
- Functional and production-grade
- Memorable and aesthetically intentional
- Cohesive in visual language
- Refined in spacing, typography, motion, and detail

The goal is not "more effects." The goal is a deliberate, coherent design identity.

## Non-Negotiables

- Do not produce generic "AI slop" UI.
- Avoid default/cliched aesthetics:
  - Overused fonts like Inter, Roboto, Arial, and system UI stacks as the primary identity
  - Predictable purple-on-white startup gradients
  - Cookie-cutter component-library layouts with no custom direction
- Make context-specific visual decisions that fit the product and audience.
- Choose one clear concept and execute it fully.

## Design Thinking Workflow

Before coding, explicitly decide:

1. **Purpose**
   - What does the interface do?
   - Who is the audience?
   - What action should the user take?

2. **Tone**
   - Pick a bold direction and commit.
   - Examples: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury refined, playful toy-like, editorial magazine, brutalist raw, art deco geometric, soft pastel, industrial utilitarian.

3. **Constraints**
   - Framework/runtime requirements
   - Performance budget
   - Accessibility requirements (contrast, semantics, keyboard, reduced motion)

4. **Differentiation**
   - Define one unforgettable element (hero composition, type treatment, motion sequence, texture system, interaction motif).

Output a short design direction statement before implementation (2-5 bullets).

## Implementation Requirements

Implement real, runnable code (HTML/CSS/JS, React, Vue, etc.) with:
- Semantic structure
- Responsive behavior
- States (hover, focus, active, disabled, loading, empty/error when relevant)
- Accessibility baseline (landmarks, labels, contrast, focus visibility, reduced-motion fallback)
- Maintainable styling structure (tokens/variables, reusable primitives)

If the user asks for a framework-specific implementation, follow it exactly.

## Aesthetic System Guidelines

### Typography
- Use distinctive, characterful type choices.
- Pair a display face with a readable body face.
- Build hierarchy intentionally (scale, rhythm, line length, letter spacing).
- Do not default to generic sans stacks unless explicitly required.

### Color And Theme
- Define design tokens (CSS variables or theme object) first.
- Prefer a dominant palette with sharp accents over evenly distributed neutrals.
- Use contrast and saturation intentionally to guide attention.

### Motion
- Use motion as choreography, not decoration.
- Prioritize high-impact moments:
  - page-load reveal sequence
  - meaningful hover/focus transitions
  - scroll-triggered moments where appropriate
- Prefer CSS-first animation for plain HTML.
- In React, use Motion (Framer Motion) when available.
- Respect `prefers-reduced-motion`.

### Spatial Composition
- Use composition to create identity:
  - asymmetry
  - overlap/layering
  - grid-breaking moments
  - deliberate negative space or controlled density
- Avoid rigid template symmetry unless conceptually justified.

### Backgrounds And Detail
- Build atmosphere with contextual depth:
  - gradient meshes
  - subtle noise/grain
  - geometric motifs
  - layered transparency
  - distinctive borders/shadows/glows
- Decorative details should reinforce the concept, not distract from content.

## Complexity Matching Rule

Match implementation complexity to aesthetic direction:
- **Maximalist direction** -> richer code, layered effects, deeper animation choreography
- **Minimal/refined direction** -> restraint, precision, excellent spacing/typography, subtle interactions

Do not under-implement the chosen concept.

## Default Delivery Format

When generating a solution, structure output as:

1. **Concept**
   - 3-5 bullets: purpose, tone, differentiation, key visual decisions

2. **Build Plan**
   - Brief implementation outline
   - Tech choices and constraints handling

3. **Implementation**
   - Complete working code
   - Clear file boundaries when multi-file

4. **Polish Notes**
   - Exactly what makes it distinctive
   - Accessibility and performance considerations

5. **Optional Enhancements**
   - 3-5 concrete next upgrades

## Technical Preferences

- Use the user's requested stack first.
- If package management is needed in examples, prefer `pnpm`.
- Keep code production-oriented: clean structure, consistent naming, no placeholder nonsense.

## Quality Checklist

Before finalizing, verify:
- A clear design direction is visible in the final UI
- Typography is intentional and non-generic
- Color system is tokenized and cohesive
- Motion is deliberate and not noisy
- Layout has compositional intent, not template defaults
- UI works at relevant breakpoints
- Accessibility basics are covered
- Final result looks designed for this context, not reusable sludge

## Failure Modes To Avoid

- "Modern SaaS default" with generic cards and soft shadows
- Random aesthetic mashups with no coherent concept
- Effects-heavy UI with weak hierarchy or usability
- Beautiful static mockups that are not actually functional
- Reusing the same visual recipe across unrelated prompts

## Principle

Be bold, but intentional.  
Be expressive, but usable.  
Be creative, but shippable.
