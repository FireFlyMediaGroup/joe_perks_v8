# Joe Perks — Marketing Site Design Document
**Version 1.1 · March 2026 · apps/web**
*v1.1 — Full dark mode spec added: Section 13 (CSS variables, section mapping, toggle implementation, Tailwind config, accessibility, testing checklist)*

---

## 1. Design Philosophy

**Concept: "Modern Craft"**
The aesthetic lives at the intersection of specialty coffee culture and modern B2B SaaS — warm and human, but structured and trustworthy. It needs to appeal to both a volunteer PTA admin and a discerning specialty roaster. The visual language borrows from editorial design: generous whitespace, strong typographic hierarchy, and restrained color use where the accent colors do real communicative work (terracotta = orgs/action, teal = roasters/trust).

**One unforgettable thing:** The hero uses two CTA *cards* instead of a traditional dual button row — giving each audience their own mini-pitch before they click. This pattern sets the tone that Joe Perks is genuinely built for two distinct people.

---

## 2. Color System

### Primary Palette
```css
:root {
  /* Core */
  --charcoal:     #1C1C1E;   /* Primary text, dark surfaces */
  --charcoal-80:  #2E2E30;   /* Elevated dark surfaces */
  --charcoal-60:  #3F3F42;   /* Hover states on dark */

  /* Base surfaces */
  --off-white:    #F8F5F0;   /* Section bg (features, benefits) */
  --cream:        #FDF9F4;   /* Default page bg, hero */
  --off-white-80: #EDE9E2;   /* Subtle chip/tag bg */

  /* Brand accent 1 — Organizations */
  --terra:        #D4603A;   /* Primary CTA, org accent */
  --terra-dark:   #B84E2A;   /* Hover state */
  --terra-light:  #E8835F;   /* On dark surfaces */

  /* Brand accent 2 — Roasters */
  --teal:         #4A8C8C;   /* Secondary CTA, roaster accent */
  --teal-dark:    #357070;   /* Hover state */
  --teal-light:   #6AACAC;   /* On dark surfaces */

  /* Text */
  --text-primary: #1C1C1E;
  --text-muted:   #6B6B70;
  --text-light:   #9B9BA0;

  /* Borders */
  --border:       rgba(28,28,30,0.10);
  --border-dark:  rgba(28,28,30,0.20);
}
```

### Color Intent Map
| Color                | Audience         | Usage                                                  |
| -------------------- | ---------------- | ------------------------------------------------------ |
| Terracotta `#D4603A` | Organizations    | Primary CTAs, org-facing highlights, fundraiser data   |
| Teal `#4A8C8C`       | Roasters         | Secondary CTAs, roaster-facing highlights, payout data |
| Charcoal `#1C1C1E`   | Platform/neutral | Dark sections (How It Works), headings, nav            |
| Cream `#FDF9F4`      | Background       | Hero, testimonials, default page bg                    |
| Off-white `#F8F5F0`  | Background       | Features section, benefits alternating bg              |

---

## 3. Typography

### Font Stack
```css
/* Display — headings, hero, section titles */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&...');
--font-display: 'Playfair Display', Georgia, serif;

/* Body — all UI text, paragraphs, labels */
@import url('...family=DM+Sans:wght@300;400;500;600&...');
--font-body: 'DM Sans', system-ui, sans-serif;

/* Mono — labels, tags, data points, order numbers */
@import url('...family=DM+Mono:wght@400;500&...');
--font-mono: 'DM Mono', 'Courier New', monospace;
```

### Type Scale
| Role         | Font             | Size                   | Weight  | Notes                           |
| ------------ | ---------------- | ---------------------- | ------- | ------------------------------- |
| Hero H1      | Playfair Display | clamp(42px, 6vw, 80px) | 900     | -0.03em tracking                |
| Section H2   | Playfair Display | clamp(32px, 4vw, 52px) | 900     | -0.025em tracking               |
| Card H3      | Playfair Display | 19–22px                | 700     |                                 |
| Body large   | DM Sans          | 17–19px                | 400     | Line-height 1.65                |
| Body default | DM Sans          | 14–15px                | 400     | Line-height 1.7                 |
| Labels/tags  | DM Mono          | 10–12px                | 500     | 0.10–0.14em tracking, uppercase |
| CTA buttons  | DM Sans          | 14–16px                | 600     | 0.01em tracking                 |
| Data/numbers | Playfair Display | varies                 | 700–900 | For impact numbers              |

---

## 4. Spacing & Radius

```css
/* Border radii */
--radius-sm:  6px;   /* Tags, small elements */
--radius-md:  12px;  /* Cards, buttons */
--radius-lg:  20px;  /* Feature cards, testimonial cards */
--radius-xl:  32px;  /* Audience panels, split visual, benefits card */

/* Section padding */
section          { padding: 100px 0; }
section (mobile) { padding: 72px 0; }

/* Container */
max-width: 1200px;
padding: 0 24px;    /* mobile */
padding: 0 40px;    /* tablet */
padding: 0 64px;    /* desktop */
```

---

## 5. Shadow System

```css
--shadow-sm:  0 1px 3px rgba(28,28,30,0.08),  0 1px 2px rgba(28,28,30,0.06);
--shadow-md:  0 4px 16px rgba(28,28,30,0.10), 0 2px 6px rgba(28,28,30,0.06);
--shadow-lg:  0 12px 40px rgba(28,28,30,0.14), 0 4px 12px rgba(28,28,30,0.08);
--shadow-xl:  0 24px 64px rgba(28,28,30,0.18);
```

---

## 6. Section Inventory

### 6.1 Navigation
- **Type:** Fixed, `position: fixed; top: 0; z-index: 100`
- **BG:** `rgba(253,249,244,0.88)` with `backdrop-filter: blur(16px)` — frosted glass
- **Scroll:** Adds `box-shadow: var(--shadow-sm)` on scroll via JS
- **Content:** Logo (mark + wordmark) · links · `Get started` CTA button
- **Mobile:** Hamburger → slide-down overlay menu with both audience CTAs
- **Breakpoint collapse:** Links hidden below 768px

### 6.2 Hero
- **Layout:** Full-viewport, centered content left, decorative rings right (desktop only)
- **Background:** Radial gradient mesh (terracotta + teal, very subtle)
- **Eyebrow:** Two `<label>` chips — "Coffee Fundraising" + "Beta · Q2 2026"
- **H1:** "Coffee your community **already** wants to buy." — italic `em` on "already"
- **Subtitle:** Single sentence value prop, max-width 560px
- **CTA Block:** Two side-by-side CTA cards (not buttons):
  - **Orgs card** (terracotta): label → headline → 1-line desc → "Apply your org →"
  - **Roasters card** (teal): label → headline → 1-line desc → "Apply as roaster →"
- **Stats bar:** Three stats — `5–25%`, `48h`, `$0`
- **Animation:** Staggered `fadeUp` on load (hero-content children, delay-1 → delay-3)

### 6.3 How It Works
- **Surface:** Dark (`--charcoal`) — creates strong section contrast
- **Layout:** Header + 3-column step cards + revenue split visualization
- **Step cards:** Dark elevated cards with numbered ghost text, icon, title, desc
- **Hover:** Bottom gradient bar reveal (terra → teal)
- **Split Visual:** Full-width card showing proportional bars + legend with real dollar amounts from the 3-way split formula in the PRD

### 6.4 Platform Features
- **Surface:** Off-white `#F8F5F0`
- **Layout:** Centered header + 3-column (desktop) / 2-col (tablet) / 1-col (mobile) card grid
- **Cards:** White bg, hover lifts + reveals top gradient bar
- **Icons:** Colored icon squares (terra / teal / charcoal)
- **6 features mapped from PRD:** White-label storefronts, Stripe payouts, Magic link fulfillment, Live impact tracking, Price snapshotting, 48h SLA enforcement

### 6.5 Audience Split (For Orgs / For Roasters)
- **Surface:** Cream
- **Layout:** Two equal full-bleed cards side by side
  - **Orgs card:** Terracotta bg, white text, bullet list, white CTA button
  - **Roasters card:** Charcoal bg, white text, bullet list, teal CTA button
- **Bullets:** 5 per card, drawn directly from PRD personas and acceptance criteria
- **IDs:** `#for-orgs` and `#for-roasters` for nav deep-linking

### 6.6 Benefits
- **Surface:** Off-white
- **Layout:** 2-col — impact calculator visual (left) + benefit list (right)
- **Impact Calculator:** Dark card showing example math: avg order × buyers × 15% → monthly total
- **Benefits:** 3 items with icon + title + desc. Messaging: recurring vs one-time, no donation fatigue, transparent splits

### 6.7 Testimonials
- **Surface:** Cream
- **Layout:** 3-column card grid (2 on tablet, 1 on mobile)
- **Cards:** Star rating, italic quote, author avatar + name + role tag
- **3 personas:** Org admin (Meredith), Roaster (Danny), Buyer (Priya) — represents all three PRD personas
- **Avatars:** Initials-based, colored by persona type

### 6.8 CTA Banner
- **Surface:** Charcoal with radial gradient highlights
- **Layout:** Centered, max-width 700px
- **Headline:** "Ready to brew something good?" (italic "something good" in terracotta-light)
- **Buttons:** `btn-primary` (Start your fundraiser) + `btn-outline-white` (Apply as a roaster)

### 6.9 Footer
- **Surface:** Near-black `#111010`
- **Layout:** 4-column grid (1 col mobile, 4 col desktop)
  - Brand: logo + tagline + social icons (Instagram, X, Facebook, LinkedIn)
  - Platform links
  - Get started links (org apply, roaster apply, browse campaigns)
  - Company links (about, blog, contact, terms, privacy)
- **Bottom bar:** Copyright + legal links + MVP badge

---

## 7. Interaction Patterns

### Hover Effects
```css
/* Cards (feature, testimonial) */
transform: translateY(-4px);
box-shadow: var(--shadow-md);
border-color: transparent;
/* + top gradient bar reveal via ::after opacity: 0 → 1 */

/* Buttons */
transform: translateY(-1px);
box-shadow: 0 6px 20px rgba(color, 0.35);

/* CTA Cards (hero) */
transform: translateY(-3px);
box-shadow: audience-specific colored shadow;

/* Audience card CTA links */
gap: 6px → 10px on arrow (animated gap) to imply motion
```

### Scroll Reveal
- `IntersectionObserver` with `threshold: 0.12`
- `.reveal` class: `opacity: 0; transform: translateY(20px)` → `.visible` transitions to `opacity: 1; translateY(0)`
- Stagger via `.reveal-delay-1/2/3` (0.1s, 0.2s, 0.3s)

### Nav Behavior
- Transparent/frosted on load
- `box-shadow` added via `scrolled` class at `scrollY > 20`
- Mobile menu: toggle open class, close on link click or outside tap

---

## 8. Responsive Breakpoints

| Breakpoint       | Width      | Key changes                                                            |
| ---------------- | ---------- | ---------------------------------------------------------------------- |
| Mobile (default) | < 640px    | Single column everything, hero stats wrap, audience cards stack        |
| Tablet           | 640–1023px | 2-col grids appear, testimonials 2-col, footer 2-col                   |
| Desktop          | 1024px+    | 3-col features/testimonials, 2-col benefits layout, hero rings visible |
| Wide             | 1200px+    | Container max-width constrains content                                 |

---

## 9. Next.js Component Breakdown

### File Structure (apps/web)
```
app/
├── (marketing)/
│   └── page.tsx                    # joeperks.com — assembles all sections
├── components/
│   └── marketing/
│       ├── Nav.tsx                 # Fixed nav with scroll behavior
│       ├── Hero.tsx                # Hero section
│       ├── HowItWorks.tsx          # Dark section + steps + split visual
│       ├── PlatformFeatures.tsx    # Feature card grid
│       ├── AudienceSection.tsx     # Org + Roaster audience cards
│       ├── BenefitsSection.tsx     # Calculator + benefit list
│       ├── Testimonials.tsx        # Testimonial card grid
│       ├── CtaBanner.tsx           # CTA section
│       └── Footer.tsx              # Footer
├── components/
│   └── ui/                         # From packages/ui (shadcn)
│       ├── Button.tsx
│       ├── Badge.tsx               # For labels/eyebrow chips
│       └── Card.tsx
```

---

### Component Specs

#### `Nav.tsx`
```tsx
'use client' // needs scroll listener + mobile toggle state

// Props: none (reads from config/nav-links)
// State: isScrolled: boolean, mobileOpen: boolean
// useEffect: window.addEventListener('scroll', ...)

// shadcn: Button for CTA
// Tailwind key classes:
// fixed top-0 inset-x-0 z-50
// bg-[#FDF9F4]/88 backdrop-blur-md
// border-b border-black/10
// Transition: shadow-sm on scroll
```

#### `Hero.tsx`
```tsx
// Server component (no interactivity)
// Props: none (static content)

// Structure:
// <section> with radial gradient bg
//   <div container>
//     <EyebrowChips />         — label chips
//     <h1> with <em> for italic
//     <p> subtitle
//     <HeroCTACards />         — the two audience cards
//     <HeroStats />            — 3 stat items

// HeroCTACards: client component if you want hover animations
// Otherwise pure Tailwind hover: utilities work fine
```

#### `HowItWorks.tsx`
```tsx
// Server component
// Props: steps: Step[] (can be data file)

// StepCard sub-component:
interface StepCard {
  num: string        // "01" | "02" | "03"
  icon: ReactNode
  iconVariant: 'terra' | 'teal' | 'white'
  title: string
  description: string
}

// SplitVisual sub-component:
// Purely static — no interactivity needed
// Proportional flex bars for the split visualization
// Data: { party, amount, pct, barClass }[]
```

#### `PlatformFeatures.tsx`
```tsx
// Server component
// Props: features: Feature[]

interface Feature {
  icon: ReactNode
  iconVariant: 'terra' | 'teal' | 'charcoal'
  title: string
  description: string
}

// 6 features from PRD — define in a data file:
// lib/marketing/features.ts
```

#### `AudienceSection.tsx`
```tsx
// Server component
// Two hardcoded audience cards (not data-driven — content is specific)

// AudienceCard sub-component:
interface AudienceCard {
  variant: 'orgs' | 'roasters'
  tag: string
  title: string
  description: string
  bullets: string[]
  ctaText: string
  ctaHref: string
}
```

#### `BenefitsSection.tsx`
```tsx
// Server component
// ImpactCalculator: static data display
// BenefitList: 3 items, data-driven

interface Benefit {
  icon: ReactNode
  iconVariant: 'terra' | 'teal'
  title: string
  description: string
}
```

#### `Testimonials.tsx`
```tsx
// Server component
// Props: testimonials: Testimonial[]

interface Testimonial {
  quote: string
  author: string
  role: string
  avatarInitial: string
  avatarVariant: 'terra' | 'teal' | 'default'
}

// Stars: static for MVP (all 5-star)
// Can wire to dynamic CMS in Phase 2
```

#### `CtaBanner.tsx`
```tsx
// Server component
// Static content — no props needed
// Two buttons: primary (orgs) + outline (roasters)
```

#### `Footer.tsx`
```tsx
// Server component
// Props: none (nav config drives link columns)

// Social links: config array
interface SocialLink {
  label: string
  href: string
  icon: ReactNode
}

// Footer columns: config array
interface FooterColumn {
  title: string
  links: { label: string; href: string }[]
}
```

---

## 10. Tailwind Config Additions (tailwind.config.ts)

> **v1.1 update:** Config now uses `darkMode: 'class'` and all semantic color tokens reference CSS variables so the dark mode swap is handled entirely in CSS — not via `dark:` utility proliferation.

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class', // pairs with data-theme="dark" + .dark on <html>
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // ── Static brand values (never change between modes) ──────────
      colors: {
        // Use these for hardcoded brand surfaces (audience cards, footer)
        'jp-terra':        '#D4603A',
        'jp-terra-dark':   '#B84E2A',
        'jp-terra-light':  '#E8835F',
        'jp-teal':         '#4A8C8C',
        'jp-teal-dark':    '#357070',
        'jp-teal-light':   '#6AACAC',
        'jp-charcoal':     '#1C1C1E',
        'jp-near-black':   '#111010',

        // ── Semantic tokens (CSS variable backed — auto dark mode) ──
        // Use these for all neutral surfaces, text, borders
        'jp-bg-page':  'var(--bg-page)',
        'jp-bg-alt':   'var(--bg-alt)',
        'jp-bg-card':  'var(--bg-card)',
        'jp-bg-dark':  'var(--bg-dark)',
        'jp-text':     'var(--text-primary)',
        'jp-muted':    'var(--text-muted)',
        'jp-light':    'var(--text-light)',
        // Accent tokens — slightly adjusted per mode (see §13.5)
        'jp-accent-terra': 'var(--terra)',
        'jp-accent-teal':  'var(--teal)',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
        mono:    ['DM Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        'jp-sm': '6px',
        'jp-md': '12px',
        'jp-lg': '20px',
        'jp-xl': '32px',
      },
      boxShadow: {
        'jp-sm': 'var(--shadow-sm)',
        'jp-md': 'var(--shadow-md)',
        'jp-lg': 'var(--shadow-lg)',
      },
    },
  },
}
export default config
```

### Usage pattern

```tsx
// ✅ Correct — uses semantic variable, auto dark mode
<div className="bg-jp-bg-card text-jp-text border border-jp-bg-alt" />

// ✅ Correct — hardcoded brand surface, intentionally always terracotta
<div className="bg-jp-terra text-white" />

// ❌ Avoid — hardcoded neutral color breaks dark mode
<div className="bg-white text-gray-900" />

// ❌ Avoid where possible — proliferates dark: utilities unnecessarily
<div className="bg-white dark:bg-[#2A2724] text-gray-900 dark:text-[#F0EDE8]" />
```

---

## 11. Copy Guidelines

- **Hero H1:** Lead with what the buyer gets ("coffee they already want to buy"), not what the platform does
- **Org CTA:** "Start a campaign" or "Start your fundraiser" — active, ownership language
- **Roaster CTA:** "Apply as a roaster" — keeps it low-friction, no commitment implied
- **Impact numbers:** Always show math. "$6.30 per order" > "earn money." Specificity builds trust.
- **Tone:** Warm, confident, community-first. Never corporate. Never precious.
- **Error states / loading:** Use DM Mono for system text and status labels — keeps the personality consistent

---

## 12. Accessibility Notes

- All interactive elements: min `44×44px` touch targets (per PRD AC requirement)
- Color contrast: Terracotta on white passes AA at 14px+ (4.6:1), teal on white passes AA (4.3:1)
- `aria-label` on all icon-only buttons (social links, mobile toggle)
- Nav mobile menu: focus trap when open, `Escape` key closes
- Scroll reveal: `prefers-reduced-motion` media query — disable all transforms/transitions
  ```css
  @media (prefers-reduced-motion: reduce) {
    .reveal, .animate-up { opacity: 1 !important; transform: none !important; transition: none !important; }
  }
  ```

---

## 13. Dark Mode Spec

### 13.1 Overview

**Scope:** Full site — every section inverts. No surfaces are exempt.
**Trigger:** System preference (`prefers-color-scheme: dark`) as the default, plus a manual toggle in the nav that overrides and persists via `localStorage`.
**Approach:** CSS custom property swap on `[data-theme="dark"]` attribute set on `<html>`. Tailwind's `darkMode: 'class'` strategy is used, with `class` set to `dark` on `<html>` in parallel so Tailwind dark utilities work alongside the CSS variable system.

**The "How It Works" challenge:** This section is already dark (`--charcoal`) in light mode. In dark mode it needs to shift to a *slightly elevated* dark surface so it still reads as a distinct section — not collapse into the page background.

---

### 13.2 Dark Mode Surface Palette

The dark palette stays warm to match the coffee aesthetic. Pure blacks (`#000`) are avoided — the darkest surface is a very dark warm charcoal. Surfaces are layered: background → section alternates → elevated cards → popped cards.

```
Light mode surface stack:          Dark mode surface stack:
─────────────────────────          ──────────────────────────
cream      #FDF9F4  (page bg)  →   dark-base    #181614
off-white  #F8F5F0  (alt bg)   →   dark-raised  #211F1C
white      #FFFFFF  (cards)    →   dark-card    #2A2724
charcoal   #1C1C1E  (dark sec) →   dark-surface #1E1C19
```

Rationale: the four dark surfaces are derived by desaturating and warming the charcoal palette slightly toward brown — maintaining coffee culture warmth without feeling cold or generic.

---

### 13.3 Full CSS Variable Override

```css
/* ─── LIGHT MODE (default) ────────────────────────────── */
:root {
  /* Surfaces */
  --bg-page:       #FDF9F4;
  --bg-alt:        #F8F5F0;
  --bg-card:       #FFFFFF;
  --bg-dark:       #1C1C1E;   /* How It Works, CTA Banner, Footer */
  --bg-dark-raised:#2E2E30;
  --bg-dark-card:  #3F3F42;

  /* Text */
  --text-primary:  #1C1C1E;
  --text-muted:    #6B6B70;
  --text-light:    #9B9BA0;

  /* Borders */
  --border:        rgba(28,28,30,0.10);
  --border-dark:   rgba(28,28,30,0.20);

  /* Nav */
  --nav-bg:        rgba(253,249,244,0.88);
  --nav-border:    rgba(28,28,30,0.10);

  /* Accents — same in both modes, adjusted slightly for dark */
  --terra:         #D4603A;
  --terra-dark:    #B84E2A;
  --terra-light:   #E8835F;
  --teal:          #4A8C8C;
  --teal-dark:     #357070;
  --teal-light:    #6AACAC;

  /* Chips / labels */
  --chip-bg:       rgba(28,28,30,0.06);
  --chip-border:   rgba(28,28,30,0.12);
  --chip-text:     #6B6B70;

  /* Shadows */
  --shadow-sm:  0 1px 3px rgba(28,28,30,0.08),  0 1px 2px rgba(28,28,30,0.06);
  --shadow-md:  0 4px 16px rgba(28,28,30,0.10), 0 2px 6px rgba(28,28,30,0.06);
  --shadow-lg:  0 12px 40px rgba(28,28,30,0.14), 0 4px 12px rgba(28,28,30,0.08);
}

/* ─── DARK MODE OVERRIDE ────────────────────────────── */
[data-theme="dark"],
.dark {
  /* Surfaces */
  --bg-page:       #181614;
  --bg-alt:        #211F1C;
  --bg-card:       #2A2724;
  --bg-dark:       #1E1C19;   /* How It Works — slightly elevated vs page */
  --bg-dark-raised:#252320;
  --bg-dark-card:  #302E2B;

  /* Text */
  --text-primary:  #F0EDE8;
  --text-muted:    #9B9690;
  --text-light:    #6B6760;

  /* Borders */
  --border:        rgba(240,237,232,0.08);
  --border-dark:   rgba(240,237,232,0.14);

  /* Nav */
  --nav-bg:        rgba(24,22,20,0.92);
  --nav-border:    rgba(240,237,232,0.08);

  /* Accents — slightly brightened for dark surface legibility */
  --terra:         #E07050;   /* +brightness for dark bg contrast */
  --terra-dark:    #C85C3C;
  --terra-light:   #F09070;
  --teal:          #5A9E9E;   /* +brightness */
  --teal-dark:     #458484;
  --teal-light:    #7ABCBC;

  /* Chips / labels */
  --chip-bg:       rgba(240,237,232,0.07);
  --chip-border:   rgba(240,237,232,0.12);
  --chip-text:     #9B9690;

  /* Shadows — more diffuse on dark, less contrast needed */
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.30), 0 1px 2px rgba(0,0,0,0.20);
  --shadow-md:  0 4px 16px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.25);
  --shadow-lg:  0 12px 40px rgba(0,0,0,0.40), 0 4px 12px rgba(0,0,0,0.30);
}

/* ─── SYSTEM PREFERENCE FALLBACK ────────────────────────────── */
/* Only applies if no data-theme is set on <html> (i.e. no manual override) */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* Paste all [data-theme="dark"] values here */
    --bg-page:       #181614;
    --bg-alt:        #211F1C;
    /* ... etc — identical to [data-theme="dark"] block */
  }
}
```

> **Implementation note:** Avoid duplicating the dark overrides. In practice, use a PostCSS plugin or Tailwind's CSS variable approach with a shared mixin/extend, and generate the `@media` block from the same source as the `[data-theme="dark"]` block.

---

### 13.4 Section-by-Section Dark Mode Mapping

| Section        | Light bg                | Dark bg                 | Notes                                                                           |
| -------------- | ----------------------- | ----------------------- | ------------------------------------------------------------------------------- |
| Nav            | `rgba(#FDF9F4, 0.88)`   | `rgba(#181614, 0.92)`   | Frosted glass, same blur                                                        |
| Hero           | `--bg-page` (`#FDF9F4`) | `--bg-page` (`#181614`) | Radial gradients stay — terra/teal still visible                                |
| How It Works   | `--bg-dark` (`#1C1C1E`) | `--bg-dark` (`#1E1C19`) | Barely shifts — already dark. Step cards go `--bg-dark-raised`.                 |
| Features       | `--bg-alt` (`#F8F5F0`)  | `--bg-alt` (`#211F1C`)  | Feature cards: `--bg-card` (`#2A2724`)                                          |
| Audience Split | `--bg-page`             | `--bg-page`             | Org card stays terracotta. Roaster card stays charcoal (adjust to `--bg-dark`). |
| Benefits       | `--bg-alt`              | `--bg-alt`              | Impact calculator card: `--bg-dark` → `--bg-dark-raised`                        |
| Testimonials   | `--bg-page`             | `--bg-page`             | Testimonial cards: `--bg-card`                                                  |
| CTA Banner     | `--bg-dark`             | `--bg-dark`             | Stays dark — nearly identical, radial glows remain                              |
| Footer         | `#111010`               | `#0E0C0A`               | Barely changes — already near-black                                             |
| Mobile menu    | `--bg-page`             | `--bg-page`             |                                                                                 |

---

### 13.5 Accent Color Behavior in Dark Mode

The terracotta and teal accents shift slightly brighter in dark mode to maintain contrast against dark surfaces. The light mode values were calibrated for white/cream backgrounds; on dark they need a small brightness boost.

| Token           | Light mode | Dark mode | Δ             |
| --------------- | ---------- | --------- | ------------- |
| `--terra`       | `#D4603A`  | `#E07050` | +12 lightness |
| `--terra-light` | `#E8835F`  | `#F09070` | +8 lightness  |
| `--teal`        | `#4A8C8C`  | `#5A9E9E` | +12 lightness |
| `--teal-light`  | `#6AACAC`  | `#7ABCBC` | +10 lightness |

The `--terra-dark` and `--teal-dark` hover states also adjust proportionally — they're used for button hover shadows, so they need to remain visually distinct from the base value.

**Contrast check (WCAG AA):**
- `--terra` (`#E07050`) on `--bg-card` (`#2A2724`): ~4.8:1 ✅
- `--teal` (`#5A9E9E`) on `--bg-card` (`#2A2724`): ~4.4:1 ✅
- `--text-primary` (`#F0EDE8`) on `--bg-page` (`#181614`): ~14:1 ✅
- `--text-muted` (`#9B9690`) on `--bg-page` (`#181614`): ~5.2:1 ✅

---

### 13.6 Toggle Implementation (Nav Component)

```tsx
// components/marketing/Nav.tsx
'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    // On mount: read localStorage, fall back to system preference
    const stored = localStorage.getItem('jp-theme') as Theme | null
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light'
    const resolved = stored ?? system
    setTheme(resolved)
    applyTheme(resolved)
  }, [])

  function applyTheme(t: Theme) {
    document.documentElement.setAttribute('data-theme', t)
    // Also set Tailwind's dark class for any dark: utilities
    document.documentElement.classList.toggle('dark', t === 'dark')
  }

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
    localStorage.setItem('jp-theme', next)
  }

  return { theme, toggle }
}

// In Nav JSX:
function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="
        w-9 h-9 rounded-[var(--radius-sm)]
        flex items-center justify-center
        text-[var(--text-muted)]
        hover:text-[var(--text-primary)]
        hover:bg-[var(--bg-alt)]
        transition-colors
      "
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
```

**Placement in nav:** Between the nav links and the `Get started` CTA button.

**Flash of incorrect theme (FOIT) prevention:** Add an inline script to `<head>` in `app/layout.tsx` — runs before React hydrates, so no flash:

```tsx
// app/layout.tsx — inside <head>
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function() {
        try {
          var stored = localStorage.getItem('jp-theme');
          var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          var theme = stored || system;
          document.documentElement.setAttribute('data-theme', theme);
          if (theme === 'dark') document.documentElement.classList.add('dark');
        } catch(e) {}
      })();
    `,
  }}
/>
```

---

### 13.7 Tailwind Dark Mode Config

```ts
// tailwind.config.ts
const config: Config = {
  darkMode: 'class',  // uses .dark class on <html>
  theme: {
    extend: {
      // All colors should reference CSS variables so dark mode
      // is handled by the variable swap, not by Tailwind dark: utilities.
      // Use dark: utilities only for one-off overrides not covered by variables.
      backgroundColor: {
        'jp-page':  'var(--bg-page)',
        'jp-alt':   'var(--bg-alt)',
        'jp-card':  'var(--bg-card)',
        'jp-dark':  'var(--bg-dark)',
      },
      textColor: {
        'jp-primary': 'var(--text-primary)',
        'jp-muted':   'var(--text-muted)',
        'jp-light':   'var(--text-light)',
      },
      borderColor: {
        'jp':      'var(--border)',
        'jp-dark': 'var(--border-dark)',
      },
    },
  },
}
```

**Rule of thumb:** Prefer CSS variable swaps over `dark:` Tailwind utilities for anything that uses a design token. Use `dark:` utilities only for structural differences that aren't captured by the token system (e.g. `dark:shadow-none`, `dark:divide-white/5`).

---

### 13.8 Component-Level Dark Mode Notes

**Feature cards / Testimonial cards:**
```css
/* Light: white bg, light border */
background: var(--bg-card);    /* #FFF → #2A2724 */
border-color: var(--border);   /* rgba dark/10 → rgba light/8 */
```
No additional class needed — the CSS variable swap handles it automatically.

**Hero gradient mesh:**
The radial gradients use `rgba(terra, 0.07)` and `rgba(teal, 0.07)`. These remain visible on dark backgrounds and may need a slight opacity bump:
```css
/* Dark mode hero bg override */
[data-theme="dark"] .hero-bg {
  background:
    radial-gradient(ellipse 80% 60% at 70% 20%, rgba(224,112,80,0.10) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 20% 80%, rgba(90,158,158,0.10) 0%, transparent 60%),
    var(--bg-page);
}
```

**Audience cards (Orgs / Roasters):**
- Org card (terracotta): stays terracotta in both modes — it's a brand-colored surface, not a neutral one. No change needed.
- Roaster card (charcoal in light): switch to `--bg-dark` in dark mode so it doesn't read as identical to the page background.
```css
[data-theme="dark"] .audience-card.roasters {
  background: var(--bg-dark-raised); /* #252320 — slightly elevated */
  border: 1px solid var(--border);
}
```

**Split visualization bars (How It Works):**
The roaster bar uses `rgba(255,255,255,0.25)` — works on both charcoal and dark-surface backgrounds. No change needed.

**Nav:**
The frosted glass blur requires an adjusted background alpha in dark mode:
```css
[data-theme="dark"] .nav {
  background: var(--nav-bg);  /* rgba(24,22,20,0.92) */
}
```

**Footer:**
Nearly identical in both modes. In dark mode, shift the base from `#111010` to `#0E0C0A` (slightly deeper) to maintain the visual step-down from the page background.

---

### 13.9 Image & Asset Considerations

- **Org logos / product images:** No treatment needed — images render on card backgrounds that shift with the theme.
- **The Joe Perks logomark:** Currently white-on-charcoal in the nav and white-on-terra in the footer. Both work in dark mode without changes.
- **OG / social share images:** Generate separate light and dark variants, or use a light-mode-safe design that works on both. Specify in `generateMetadata()`:
  ```ts
  // No automatic dark OG support in Next.js — use a single neutral image.
  ```

---

### 13.10 Testing Checklist

Before shipping dark mode:

- [ ] No pure white (`#FFFFFF`) surfaces remain hardcoded — all use `var(--bg-card)` or `var(--bg-page)`
- [ ] No `text-gray-*` Tailwind utilities hardcoded — all use `var(--text-primary/muted/light)`
- [ ] FOIT prevention script fires before first paint (verify in Chrome DevTools → Performance)
- [ ] `localStorage` override persists across page reloads
- [ ] System preference change (without stored override) updates theme live via `matchMedia` listener
- [ ] Org audience card (terracotta) unchanged in both modes
- [ ] "How It Works" section visually distinct from page background in dark mode
- [ ] All WCAG AA contrast ratios pass (see §13.5)
- [ ] Toggle button has correct `aria-label` in both states
- [ ] `prefers-reduced-motion` still suppresses animations in dark mode