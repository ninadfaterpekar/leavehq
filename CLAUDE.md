# LeaveHQ — Agent Instructions

Read this before making any change.

## Before any UI work
Read `DESIGN-MD-SYSTEM.md` in full before touching any page, component, or style. It governs every color, spacing value, component choice, and accessibility rule in this codebase. It is not optional guidance — it is the spec.

If a feature-level Design MD exists for the task at hand (see `/docs/feature-design-mds/`), read that too. It defines behavior and acceptance criteria for that specific feature.

Before writing new code, flag any existing code in the files you're touching that violates `DESIGN-MD-SYSTEM.md`. Fix it as part of the same change.

## Hard rules — never violate
- Every UI element comes from `@reliability-design/web`. No plain `<div>` cards, no plain `<button>` elements, no native `<select>` or `<input type="date">`.
- No hardcoded hex colors. Every color is a token from `DESIGN-MD-SYSTEM.md` Section 2.
- No green text for body copy, labels, or values. Green is brand accent only.
- No green icons. All icons come from `@reliability-design/icons` and must meet 3:1 contrast minimum.
- Exactly one `variant="primary"` button per view. Every other action is `secondary`, `text`, or `secondary tone="critical"`.
- Every interactive element needs a visible label and keyboard support.
- Dynamic content (balances, calculated values, warnings) needs `aria-live="polite"`.

## Stack
Next.js 14 App Router, TypeScript, Supabase (auth + Postgres + RLS), Resend (email).

- Pages: `app/[feature]/page.tsx`
- API routes: `app/api/[feature]/route.ts`
- Shared logic: `lib/`
- Types: `types/index.ts`

## When adding a new feature
Ask for the feature-level Design MD if one hasn't been written yet — don't generate UI from a one-line request. Build the page and API route following the existing patterns in `app/dashboard/` and `app/request/`. Check the acceptance criteria in the feature's Design MD before considering it done.

## Known gotchas
`@reliability-design/web` components are client-only custom elements. Never import them in a server component. Use `'use client'` and the dynamic import pattern in `components/DesignSystemLoader.tsx`.

Supabase server client (`lib/supabase-server.ts`) is for server components only — it uses `next/headers`. Browser/admin client (`lib/supabase.ts`) is for everything else.
