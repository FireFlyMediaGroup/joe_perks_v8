# Sprint 6 — Marketing Site Design Implementation

**Version:** 1.0
**Started:** April 1, 2026
**Source spec:** `docs/joe_perks_design_specs.md` (v1.1)
**Scope:** `apps/web` — joeperks.com marketing homepage and shared chrome (Nav, Footer)

---

## Sprint Goal

Transform the `apps/web` marketing homepage from generic next-forge boilerplate into the Joe Perks branded "Modern Craft" design system described in the design spec. This includes custom color tokens, typography, all 9 marketing sections, dark mode, responsive layouts, and interaction patterns.

---

## Pre-Sprint State

| Area | Before Sprint 6 |
|------|-----------------|
| **Colors** | Generic oklch design-system tokens (shadcn defaults) |
| **Fonts** | Geist Sans + Geist Mono |
| **Hero** | Generic CTA with blog post link, "Sign up" button |
| **Header** | Vercel triangle logo, "next-forge" branding, generic nav |
| **Footer** | Generic "next-forge" footer with CMS legal links |
| **Sections** | 7 boilerplate components: Hero, Cases, Features, Stats, Testimonials, FAQ, CTA |
| **Dark mode** | next-themes with class attribute (working) |
| **Tailwind** | v4 CSS-first via `packages/design-system/styles/globals.css` |

---

## Implementation Plan

### Phase 1: Design Foundation

| # | Task | Files | Status |
|---|------|-------|--------|
| 1.1 | Add JP brand CSS variables (light + dark mode) to web app styles | `apps/web/app/[locale]/styles.css` | Done |
| 1.2 | Configure marketing fonts (Playfair Display, DM Sans, DM Mono) via `next/font/google` | `apps/web/lib/fonts.ts` | Done |
| 1.3 | Update layout.tsx with new font CSS variables and theme attribute | `apps/web/app/[locale]/layout.tsx` | Done |
| 1.4 | Create marketing data files for section content | `apps/web/lib/marketing/*.ts` | Done |

### Phase 2: Component Implementation

| # | Component | Design Spec Section | Files | Status |
|---|-----------|-------------------|-------|--------|
| 2.1 | **Nav** — Fixed frosted glass, JP logo, theme toggle, mobile hamburger | §6.1 | `app/[locale]/components/header/index.tsx` | Done |
| 2.2 | **Hero** — Radial gradient, eyebrow chips, italic H1, dual CTA cards, stats bar | §6.2 | `app/[locale]/(home)/components/hero.tsx` | Done |
| 2.3 | **HowItWorks** — Dark charcoal section, 3 step cards, revenue split visualization | §6.3 | `app/[locale]/(home)/components/how-it-works.tsx` | Done |
| 2.4 | **PlatformFeatures** — Off-white bg, 6 feature cards, hover lift + gradient bar | §6.4 | `app/[locale]/(home)/components/features.tsx` | Done |
| 2.5 | **AudienceSection** — Full-bleed terracotta (orgs) + charcoal (roasters) cards | §6.5 | `app/[locale]/(home)/components/audience-section.tsx` | Done |
| 2.6 | **BenefitsSection** — Impact calculator + 3 benefit items | §6.6 | `app/[locale]/(home)/components/benefits-section.tsx` | Done |
| 2.7 | **Testimonials** — 3-col card grid, star ratings, persona avatars | §6.7 | `app/[locale]/(home)/components/testimonials.tsx` | Done |
| 2.8 | **CtaBanner** — Charcoal + radial gradient, dual CTAs | §6.8 | `app/[locale]/(home)/components/cta-banner.tsx` | Done |
| 2.9 | **Footer** — Near-black, 4-col grid, social icons, copyright bar | §6.9 | `app/[locale]/components/footer.tsx` | Done |

### Phase 3: Assembly & Polish

| # | Task | Files | Status |
|---|------|-------|--------|
| 3.1 | Update home page.tsx to compose all new sections | `app/[locale]/(home)/page.tsx` | Done |
| 3.2 | Add scroll reveal via IntersectionObserver | `app/[locale]/(home)/components/scroll-reveal.tsx` | Done |
| 3.3 | Add `prefers-reduced-motion` support | `apps/web/app/[locale]/styles.css` | Done |

---

## Key Design Decisions

### 1. CSS Variable Strategy (Tailwind v4)
The design spec references `tailwind.config.ts`, but the repo uses **Tailwind v4 CSS-first** configuration via `packages/design-system/styles/globals.css`. All Joe Perks brand tokens are added as CSS custom properties in `apps/web/app/[locale]/styles.css`, scoped to `:root` and `.dark` selectors. This works with the existing `next-themes` setup (which uses `attribute="class"`).

### 2. Font Loading
Fonts are loaded via `next/font/google` in `apps/web/lib/fonts.ts` and applied as CSS variables on `<html>`. The design-system's Geist fonts remain available for non-marketing pages (storefronts, apply forms). Marketing components reference the JP font families via `font-display`, `font-body`, and `font-jp-mono` Tailwind classes.

### 3. Component Location
Marketing section components stay in `app/[locale]/(home)/components/` (existing pattern). Nav and Footer are in `app/[locale]/components/` (shared chrome). No new `components/marketing/` directory — we follow the established file convention.

### 4. Dark Mode
The existing `next-themes` ThemeProvider with `attribute="class"` is retained. CSS variables swap via `.dark` selectors (already configured in the design system). The JP brand tokens follow the same pattern. No custom FOIT prevention script is needed — `next-themes` handles flash prevention.

### 5. Dictionary Removal for Marketing Content
The existing components use `@repo/internationalization` dictionary props for all text. Since i18n for the marketing site is not a current priority, and the design spec defines specific English copy, the new marketing components use hardcoded English copy. The dictionary pattern can be re-applied when i18n is prioritized.

---

## Color Token Reference

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--jp-bg-page` | `#FDF9F4` (cream) | `#181614` | Default page background |
| `--jp-bg-alt` | `#F8F5F0` (off-white) | `#211F1C` | Alternating section bg |
| `--jp-bg-card` | `#FFFFFF` | `#2A2724` | Card surfaces |
| `--jp-bg-dark` | `#1C1C1E` (charcoal) | `#1E1C19` | Dark sections |
| `--jp-terra` | `#D4603A` | `#E07050` | Org accent / primary CTA |
| `--jp-teal` | `#4A8C8C` | `#5A9E9E` | Roaster accent / secondary CTA |
| `--jp-text` | `#1C1C1E` | `#F0EDE8` | Primary text |
| `--jp-muted` | `#6B6B70` | `#9B9690` | Muted text |

---

## Removed / Replaced Components

| Old Component | Replaced By | Notes |
|--------------|-------------|-------|
| `cases.tsx` (logo carousel) | `audience-section.tsx` | Placeholder logos removed |
| `stats.tsx` (metric cards) | `benefits-section.tsx` | New impact calculator pattern |
| `faq.tsx` (accordion) | *Removed from homepage* | Can be added back later |
| Boilerplate hero | New hero with dual CTA cards | Complete rewrite |
| Boilerplate CTA | New `cta-banner.tsx` | Dark section design |

---

## Files Changed

### New Files
- `docs/sprint-6/README.md` (this file)
- `apps/web/lib/fonts.ts`
- `apps/web/lib/marketing/features.ts`
- `apps/web/lib/marketing/testimonials.ts`
- `apps/web/lib/marketing/steps.ts`
- `apps/web/lib/marketing/benefits.ts`
- `apps/web/app/[locale]/(home)/components/how-it-works.tsx`
- `apps/web/app/[locale]/(home)/components/audience-section.tsx`
- `apps/web/app/[locale]/(home)/components/benefits-section.tsx`
- `apps/web/app/[locale]/(home)/components/cta-banner.tsx`
- `apps/web/app/[locale]/(home)/components/scroll-reveal.tsx`

### Modified Files
- `apps/web/app/[locale]/styles.css` — JP brand CSS variables added
- `apps/web/app/[locale]/layout.tsx` — Font variables, theme attribute
- `apps/web/app/[locale]/(home)/page.tsx` — New section composition
- `apps/web/app/[locale]/(home)/components/hero.tsx` — Complete rewrite
- `apps/web/app/[locale]/(home)/components/features.tsx` — Complete rewrite
- `apps/web/app/[locale]/(home)/components/testimonials.tsx` — Complete rewrite
- `apps/web/app/[locale]/components/header/index.tsx` — Complete rewrite
- `apps/web/app/[locale]/components/footer.tsx` — Complete rewrite
