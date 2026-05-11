---
description: >
  Use when making any UI or UX changes in the opensense-dining app — creating components,
  styling pages, adding layouts, modifying colors, spacing, typography, accessibility,
  animations, loading states, or any visual/interactive element in apps/admin or apps/customer.
applyTo: "apps/admin/src/**/*.tsx, apps/admin/src/**/*.ts, apps/admin/src/**/*.css, apps/customer/src/**/*.tsx, apps/customer/src/**/*.ts, apps/customer/src/**/*.css"
---

# Opensense Dining — UI/UX Guidelines

## Core Philosophy

This is an open-source app. Every design decision must serve real functionality.
No decoration for its own sake. If a 10-year-old and a 65-year-old cannot both
use a feature confidently, it is not ready.

---

## 1. Simplicity First

- Build for straightforward functionality. No clever abstractions in the UI.
- Avoid fancy graphics, decorative illustrations, gradients, glassmorphism, or
  purely ornamental elements.
- Every visible element must have a clear, single purpose.
- If you cannot explain what a UI element does in one plain sentence, remove it.

---

## 2. Animated SVGs — Restricted Use

- Animated SVGs are only permitted on **landing pages** and **guest-facing pages**.
- They are **strictly forbidden** in `apps/admin` and the authenticated parts of
  `apps/customer`.
- Static SVG icons are fine everywhere (follow the icon instructions).

---

## 3. Performance — Page Load Targets

| Target | Requirement |
|--------|-------------|
| Full page interactive | ≤ 500 ms |
| First interactive element visible | ≤ 100 ms |
| Shimmer / skeleton shown if | First interactive element takes > 100 ms to render |

- Always implement a shimmer/skeleton loading state for any data-fetched content.
- Use `React.lazy` + `Suspense` for route-level code splitting where applicable.
- Keep bundle size in check; do not import entire libraries for one utility.

---

## 4. Shimmer / Skeleton Pattern

Show a skeleton placeholder that **matches the layout** of the real content
(same width, height, and position). Use a subtle animated shimmer effect.

```tsx
// Example: simple shimmer class with Tailwind
<div className="animate-pulse bg-gray-200 rounded h-6 w-3/4" aria-hidden="true" />
```

Remove the skeleton the moment real content is ready — never show both at once.

---

## 5. Accessibility (WCAG 2.2 AA minimum)

- Every interactive element must have a visible focus ring.
- All images and icons that convey meaning need descriptive `alt` or `aria-label`.
- Decorative icons must have `aria-hidden="true"`.
- Color must never be the **only** means of conveying information (add text/icon).
- Minimum contrast ratio: **4.5 : 1** for normal text, **3 : 1** for large text.
- All forms must have associated `<label>` elements (not just placeholder text).
- Tab order must follow visual reading order.
- Interactive targets must be at least **44 × 44 px** (touch/click target size).

---

## 6. Color Palette — Soothing, Elder-Friendly

- Avoid saturated or neon colors. Use muted, low-saturation tones.
- Prefer warm off-whites and soft neutrals for backgrounds.
- Use cool, muted blues or greens for primary actions.
- Red/orange only for destructive actions or errors — keep them desaturated.
- Test every color combination with a contrast checker before shipping.

**Suggested baseline palette (Tailwind classes):**

| Role | Tailwind token |
|------|----------------|
| Page background | `bg-gray-50` |
| Surface / card | `bg-white` |
| Border | `border-gray-200` |
| Primary action | `bg-blue-600 hover:bg-blue-700` |
| Destructive | `bg-red-600 hover:bg-red-700` (desaturated) |
| Body text | `text-gray-800` |
| Secondary text | `text-gray-500` |
| Disabled | `text-gray-400 bg-gray-100` |

---

## 7. Typography & Readability

- **Minimum body font size: 16 px** (`text-base` in Tailwind). Never go below this.
- Headings: use a clear hierarchy (h1 → h2 → h3); do not skip levels.
- Line height: at least `1.6` for body paragraphs (`leading-relaxed`).
- Maximum line width: `65 ch` (`max-w-prose`) for any paragraph of text.
- Font weight: use `font-medium` or `font-semibold` for labels and headings to
  ensure legibility for users with reduced contrast sensitivity.

---

## 8. Spacing & Layout

- Generous spacing is mandatory. Use Tailwind `gap-4` minimum between form fields
  and `gap-6` between sections.
- Card/section padding: minimum `p-6` (`24 px`).
- Never crowd elements. If the layout feels tight, add spacing rather than reducing it.
- Use consistent spacing scales — do not use arbitrary pixel values.

---

## 9. Admin vs. Customer Page Distinction

| Rule | Admin (`apps/admin`) | Customer (`apps/customer`) |
|------|----------------------|---------------------------|
| Animated SVGs | ❌ Forbidden | ❌ Forbidden (auth pages) / ✅ Allowed (landing/guest) |
| Dense data tables | ✅ Acceptable | ❌ Avoid |
| Complex filter panels | ✅ Acceptable | ❌ Simplify |
| Large touch targets | Required | Required |

---

## 10. Checklist Before Any UI Change

- [ ] Does every new element have a clear purpose?
- [ ] Are loading states (shimmer) implemented for all async data?
- [ ] Is the color contrast ≥ 4.5 : 1?
- [ ] Are all interactive elements keyboard-navigable with visible focus?
- [ ] Is the minimum font size 16 px?
- [ ] Are touch/click targets ≥ 44 × 44 px?
- [ ] Is spacing generous enough for a 65-year-old to read comfortably?
- [ ] Does the page load within 500 ms (or show a skeleton within 100 ms)?
- [ ] Are animated SVGs absent from admin and authenticated customer pages?
