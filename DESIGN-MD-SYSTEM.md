# DESIGN MD — LeaveHQ System Standards
**Type:** System-level (applies to every page and component)
**Version:** 1.0 — June 2026
**Design System:** Reliability Design System v1.3.0
**Packages:** @reliability-design/web, @reliability-design/icons
**Docs:** https://www-ecru-eight.vercel.app/docs
**Repo:** https://github.com/ninadfaterpekar/leavehq

---

## Purpose

This document governs how every page in LeaveHQ is built.
Any AI tool, developer, or designer working on this codebase reads this file first.
No component, color, spacing value, or typographic decision should be made that contradicts this document.

---

## Section 1 — Component rules

### Cards
- Use `<rel-card>` for every content container — balance summaries, form wrappers, approval cards, table containers, empty states.
- Never use a plain `<div>` with a manual border and border-radius as a card substitute.
- Cards do not have drop shadows by default. Do not add `box-shadow` to cards unless the component explicitly supports an elevation prop.
- Card padding is provided by the component. Do not add inner padding via wrapper divs unless laying out content inside.

### Buttons
- Use `<rel-button>` for every interactive action. Never use a plain `<button>` or `<a>` styled to look like a button.
- **Primary actions** — one per view, always `variant="primary"`. Examples: Submit request, Approve, Save changes, Sign in.
- **Secondary actions** — supporting actions on the same view, `variant="secondary"`. Examples: Cancel, Back, Edit.
- **Destructive actions** — actions that cannot be undone, `variant="secondary" tone="critical"`. Examples: Reject, Delete.
- **Text actions** — low-emphasis, inline actions, `variant="text"`. Examples: Clear all, View details, Dismiss.
- **Never** use `variant="primary"` for two actions side by side. One primary per action group maximum.
- Button labels are sentence case, verb-first. "Submit request" not "Request Submission". "Approve" not "Mark as approved".
- Disabled state: use the `disabled` attribute, never fake it with reduced opacity on a plain button.

### Date picker
- Use `<rel-date-picker>` for all single date inputs.
- For date ranges, use two `<rel-range-picker>` components side by side — start date and end date — labelled clearly.
- Always set `min` to today's date on future-only fields. Always block weekends via the component's disabled-dates mechanism.
- Labels are always visible. Never use placeholder text as a label substitute.

### Form fields
- Use `<rel-textfield>` for all text and textarea inputs.
- Use `<rel-select>` for all dropdowns.
- Use `<rel-checkbox>` for all checkboxes.
- Every field must have a visible `label` prop. No unlabelled fields.
- Error states use the `state="error"` prop and a `supporting-text` message that explains what went wrong in plain language. Not "Invalid input" — "Please select a start date."
- Optional fields are marked with "(optional)" in the label, not with an asterisk on required fields.

### Alerts
- Use `<rel-alert>` for all feedback messages — success, error, warning, info.
- `type="success"` — confirmation after an action completes. Always dismissible.
- `type="error"` — something failed. Never auto-dismiss. Keep the form data intact.
- `type="warning"` — user needs to acknowledge a consequence before proceeding. Pair with a `<rel-checkbox>` when acknowledgement is required.
- `type="info"` — neutral contextual information. Use sparingly.
- Never show alerts pre-emptively. Only show on user action or system event.

### Dividers
- Use `<rel-divider>` to separate logical sections within a card. Not between cards.

### Icons
- Use icons only from `@reliability-design/icons`. Never use emoji, inline SVG, or icons from another library as a substitute.
- Install: `npm install @reliability-design/icons`
- Icons are decorative or functional signifiers, never the sole carrier of meaning. Every icon-only button must have an `aria-label`. Every status icon must be paired with text somewhere in the same row or component.
- Default icon color is `--rel-colors-gray-primary` (#333333) at rest. On hover or active state, `--rel-colors-black` (#000000).
- **Never use green icons.** Green is brand accent only — logo and active nav indicator. An icon colored green anywhere else (status, action, decorative) is a violation regardless of context.
- Icon color must always meet a minimum 3:1 contrast ratio against its background, the WCAG AA minimum for non-text graphical elements. In practice this means:
  - `--rel-colors-gray-primary` (#333333) on white = 12.6:1 — safe.
  - `--rel-colors-gray-placeholder` (#A9A9A9) on white = 2.85:1 — **fails**. Never use this token for an icon that conveys meaning (status, error, action). Acceptable only for fully decorative icons with no functional role.
  - `--rel-colors-green-primary` (#00F49C) on white = 1.36:1 — **fails badly**. This is the other reason green icons are banned: they fail accessibility on light backgrounds even before the brand rule applies.
  - `--rel-colors-warning-yellow` (#FFBF43) on white = 1.83:1 — **fails**. Use `--rel-colors-error-red` or a darker semantic tone for warning icons instead, never the raw yellow token.
  - `--rel-colors-error-red` (#C62828) on white = 5.9:1 — safe for error icons.
  - `--rel-colors-info-blue` (#0059F4) on white = 5.1:1 — safe for info icons.
- Semantic status icons follow the same pairing as alert backgrounds: success icon uses `--rel-colors-green-tertiary` only on a white or `--rel-colors-green-bg-light` background, never standalone on gray. Error icon uses `--rel-colors-error-red`. Warning icon uses `--rel-colors-error-red` or `--rel-colors-gray-primary`, not the raw yellow. Info icon uses `--rel-colors-info-blue`.
- Icon sizing follows a fixed scale: 16px for inline text-adjacent icons, 20px for button and form field icons, 24px for standalone navigational icons. Never use an arbitrary size.
- Icons inside `<rel-button>` use the size and color the component provides by default. Do not override icon color independently from button variant — if a button needs a different visual weight, change the button variant, not the icon color.

---

## Section 2 — Color rules

### What to use
All colors must come from Reliability Design System tokens. No hardcoded hex values anywhere in the codebase.

| Token | Value | Use |
|---|---|---|
| `--rel-colors-black` | #000000 | Primary text, headings, high-emphasis labels |
| `--rel-colors-gray-primary` | #333333 | Body text, secondary labels |
| `--rel-colors-gray-placeholder` | #A9A9A9 | Placeholder text, tertiary labels, timestamps |
| `--rel-colors-gray-border` | #DDDDDD | Borders, dividers, card outlines |
| `--rel-colors-gray-surface` | #F5F5F5 | Page background, table header fills, subtle containers |
| `--rel-colors-gray-light` | #FAFAFA | Empty states, secondary card fills |
| `--rel-colors-white` | #FFFFFF | Card backgrounds, input backgrounds, topbar |
| `--rel-colors-green-primary` | #00F49C | Brand accent only — logo, active nav indicator. Nothing else. |
| `--rel-colors-green-tertiary` | #00A86B | Success state background text. Only on `--rel-colors-white` background. |
| `--rel-colors-error-red` | #C62828 | Error text, destructive action labels |
| `--rel-colors-red-bg-alert` | #FFE8EB | Error alert backgrounds |
| `--rel-colors-warning-yellow` | #FFBF43 | Warning state accent |
| `--rel-colors-orange-bg-light` | #FFE0D9 | Warning alert backgrounds |
| `--rel-colors-info-blue` | #0059F4 | Info state accent, links |
| `--rel-colors-blue-bg` | #E1F2FF | Info alert backgrounds |

### What NOT to do
- **Never use green text for body copy, labels, values, or counts.** Green is a brand accent, not a text color. The only exception is success confirmation text on a white background using `--rel-colors-green-tertiary`, and only when the component provides this as a built-in state.
- **Never use green icons** as status indicators, navigation icons, or decorative elements. Use gray icons at rest, black icons on hover or active.
- **Never use the primary green `#00F49C` as a button background.** The primary button uses the component's built-in primary styling. Do not override it.
- **Never hardcode** `#4f46e5`, `#10b981`, `#ef4444`, `#f59e0b` or any other hex value. These are the old values. Replace with system tokens.
- Status badges use semantic colors: pending = `--rel-colors-yellow-pending` background with `--rel-colors-gray-primary` text. Approved = `--rel-colors-green-bg-light` background with `--rel-colors-green-tertiary` text. Rejected = `--rel-colors-red-bg-alert` background with `--rel-colors-error-red` text.

---

## Section 3 — Typography rules

### Hierarchy
Use a consistent 4-level hierarchy. Never skip levels.

| Level | Use | Size | Weight | Color token |
|---|---|---|---|---|
| Page title | One per page, top of content | 22px | 600 | `--rel-colors-black` |
| Section heading | Card title, panel label | 14px | 600 | `--rel-colors-black` |
| Body | All regular content, labels, table cells | 13px | 400 | `--rel-colors-gray-primary` |
| Supporting | Timestamps, helper text, character counts, metadata | 12px | 400 | `--rel-colors-gray-placeholder` |

### Rules
- One page title per page. Never two `h1` elements.
- Section headings inside cards use `font-size: 14px; font-weight: 600`. Not `h2` or `h3` unless semantically correct.
- All text is left-aligned. No centered body copy.
- No italic text in UI. Use weight to create emphasis — `font-weight: 500` or `600`, not `<em>`.
- No uppercase body copy. Only uppercase for data table column headers and metadata labels at 11px.
- Line height for body text: `1.5`. For headings: `1.2`.
- Font family: inherit from the system — `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`.

---

## Section 4 — Spacing rules

### Scale
Use an 4px base grid. All spacing values must be multiples of 4.

| Token | Value | Use |
|---|---|---|
| 4px | `0.25rem` | Icon padding, tight inline gaps |
| 8px | `0.5rem` | Gap between label and input, between inline elements |
| 12px | `0.75rem` | Inner padding of compact components, gap between cards in a grid |
| 16px | `1rem` | Standard field margin-bottom, card inner padding vertical |
| 20px | `1.25rem` | Card inner padding horizontal |
| 24px | `1.5rem` | Page section gaps, topbar padding |
| 32px | `2rem` | Page top margin, major section breaks |
| 48px | `3rem` | Page bottom padding |

### Rules
- Card inner padding: `20px 24px` — use this consistently. Never vary per card.
- Gap between stacked form fields: `16px`.
- Gap between cards in a grid: `12px`.
- Page content max-width: `900px` for dashboard and wide views, `680px` for single-column forms.
- Page content side padding: `24px`.
- Never use `margin: auto` on inline elements. Use flexbox gap for spacing between siblings.

---

## Section 5 — Accessibility rules

These are non-negotiable. Every component, every page.

### Colour contrast
- All body text on white backgrounds must meet WCAG AA: minimum 4.5:1 contrast ratio.
- `--rel-colors-gray-placeholder` (#A9A9A9) on white = 2.85:1. **Only use for non-essential supporting text** — timestamps, character counts. Never for labels, values, or interactive elements.
- `--rel-colors-green-primary` (#00F49C) on white = 1.36:1. **Never use as text color.** Brand accent only on dark backgrounds.
- `--rel-colors-warning-yellow` (#FFBF43) on white = 1.83:1. **Never use as text color.** Use as background or accent only.
- Status badge text must always be the darker semantic color on the lighter background — never the reverse.

### Interactive elements
- Every interactive element must have a visible focus ring. Never `outline: none` without a custom focus style replacement.
- All buttons must have descriptive labels. No icon-only buttons without `aria-label`.
- All form fields must have an associated `<label>` — use the component's `label` prop, not a separate element.
- Error messages must be associated with their field via `aria-describedby` or the component's `supporting-text` prop.

### Screen readers
- Dynamic content that updates without a page reload — balance summaries, days calculated, deduction warnings — must use `aria-live="polite"` so screen readers announce changes.
- Loading states must be announced. Use `aria-busy="true"` on the container while loading.
- Status badges are decorative text. Ensure the surrounding table cell or list item also has the status in plain text for screen reader context.

### Keyboard navigation
- Full keyboard navigation required on every page — Tab, Shift+Tab, Enter, Space, Escape.
- Modal sheets and drawers must trap focus while open. Focus returns to the trigger element on close.
- Date pickers must be keyboard operable — arrow keys to navigate dates, Enter to select, Escape to close.

### Motion
- Respect `prefers-reduced-motion`. Any transition or animation must be wrapped:
```css
@media (prefers-reduced-motion: no-preference) {
  .animated-element { transition: all 0.2s ease; }
}
```

---

## Section 6 — What this document replaces

Any hardcoded value in the existing codebase that contradicts this document must be updated when that file is next touched. Priority order for cleanup:

1. Hardcoded hex colors → replace with token variables
2. Plain `<button>` elements → replace with `<rel-button>`
3. Plain `<div>` cards → replace with `<rel-card>`
4. Green text or green status numbers → replace with `--rel-colors-gray-primary` or appropriate semantic color
5. Emoji or inline SVG used as icons → replace with `@reliability-design/icons`
6. Green icons or icons using a token that fails 3:1 contrast → replace with an accessible semantic token
7. Missing aria-labels on interactive elements → add them

---

## How to use this document with Claude Code

Paste this file at the start of any Claude Code session working on LeaveHQ:

> "Read DESIGN-MD-SYSTEM.md before making any changes. All components, colors, spacing, and accessibility rules in that file are non-negotiable. Do not introduce any value that is not in the system token list. Flag any existing code that violates these rules before writing new code."

Every new feature also gets its own feature-level Design MD (see `/docs/feature-design-mds/`) that references this system document.
