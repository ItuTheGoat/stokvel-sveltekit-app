# Design System Document: The Modern Stokvel Editorial

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Hearth"**
This design system moves beyond the cold, utilitarian nature of traditional fintech. It is designed to feel like a premium community gathering—warm, authoritative, and deeply intentional. We reject the "template" look of flat grids and thin gray lines. Instead, we embrace **Editorial Asymmetry** and **Tonal Depth**.

The system balances the prestige of a private bank with the warmth of a South African community. By leveraging a "High-End Editorial" layout, we use large-scale typography and overlapping surfaces to create a sense of shared growth and curated trust. We don't just display data; we narrate a collective financial journey.

---

## 2. Colors: Tonal Prestige
Our palette is rooted in the Deep Navy of stability and the Gold of prosperity, executed through a sophisticated Material 3 tonal framework.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through:
- **Background Color Shifts:** (e.g., a `surface-container-low` card sitting on a `surface` background).
- **Subtle Tonal Transitions:** Using depth and spacing rather than strokes to define edges.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper and frosted glass. 
- **The Base:** Use `surface` (#fbf8fe) for the main background.
- **The Nest:** Place `surface-container-low` elements for secondary info, and `surface-container-lowest` (#ffffff) for high-priority interactive cards. This "stacking" creates a natural, tactile depth.

### The "Glass & Gradient" Rule
To inject "soul" into the interface:
- **Signature Gradients:** For primary CTAs and Hero sections, transition from `primary` (#000666) to `primary-container` (#1a237e). This prevents the "flat" look and adds a premium shimmer.
- **Glassmorphism:** Floating action buttons or top navigation bars should use `surface` colors with a 70% opacity and a `20px` backdrop blur to allow the vibrant South African imagery to bleed through the interface.

---

## 3. Typography: Authoritative Clarity
We pair the geometric precision of **Plus Jakarta Sans** (Display/Headlines) with the functional warmth of **Inter** (Body).

*   **Display (Plus Jakarta Sans):** Used for big moments—savings milestones and welcome screens. High-contrast sizing (e.g., `display-lg` at 3.5rem) creates an editorial feel.
*   **Headline & Title:** Use `headline-md` for community names and `title-lg` for card headers to establish a clear, trustworthy hierarchy.
*   **Body (Inter):** Optimized for readability in high-density financial data. Use `body-md` (0.875rem) for most descriptions to maintain a clean, airy aesthetic.

The contrast between the bold, expressive headlines and the quiet, functional body text mimics a high-end financial broadsheet.

---

## 4. Elevation & Depth: Tonal Layering
We do not use structural lines to separate thoughts. We use light and shadow.

### The Layering Principle
Depth is achieved by stacking the `surface-container` tiers. 
- **Elevation 0:** `surface` (Base layer)
- **Elevation 1:** `surface-container-low` (Content groupings)
- **Elevation 2:** `surface-container-lowest` (Interactive cards)

### Ambient Shadows
When an element must "float" (e.g., a bottom sheet or a primary button):
- **Spec:** Use an extra-diffused shadow. `Blur: 24px`, `Spread: -4px`, `Opacity: 6%`.
- **Color:** The shadow must be a tinted version of `on-surface` (#1b1b1f), never pure black, to mimic natural ambient light.

### The "Ghost Border" Fallback
If accessibility requires a container edge, use a **Ghost Border**: `outline-variant` (#c6c5d4) at **15% opacity**. High-contrast, 100% opaque borders are strictly forbidden as they clutter the visual field.

---

## 5. Components: Intentional Interaction

### Buttons
- **Primary:** High-gloss gradient (`primary` to `primary-container`). Roundedness: `lg` (16px).
- **Secondary:** `secondary-container` (#fcd400) with `on-secondary-container` (#6e5c00) text. This Gold provides a "vibrant" community spark.
- **Tertiary:** No container. Use `on-surface` text with a `label-md` weight for subtle navigation.

### Cards & Lists
- **The Rule:** No divider lines. Separate list items using `12px` of vertical white space or a alternating subtle shift between `surface` and `surface-container-low`.
- **Corner Radius:** All cards must strictly follow the `lg` scale (16px / 1rem) to maintain the "Modern Material" identity.

### Input Fields
- **Style:** "Soft Inset." Instead of a border, use a `surface-container-high` background. On focus, transition to a `Ghost Border` using the `primary` color.

### Signature Component: The "Contribution Ring"
- A custom circular progress component for savings goals using a `primary` to `secondary` (Gold) gradient stroke, emphasizing the transition from "starting" to "wealth."

---

## 6. Do’s and Don’ts

### Do
*   **Do** use intentional white space. Let the typography breathe like a premium magazine.
*   **Do** use warm imagery. Photography should feature South African communities in natural, golden-hour light.
*   **Do** use South African-inspired iconography (e.g., subtle geometric patterns from Ndebele art used as low-opacity watermarks in `surface-variant`).

### Don't
*   **Don't** use 1px dividers. If you feel the need to separate, increase the margin.
*   **Don't** use standard Material 3 "Purple" defaults. Every token must map back to the Navy/Gold/White prestige palette.
*   **Don't** use sharp corners. Everything—from chips to containers—must live within the `16px` (lg) or `999px` (full) roundedness scale to feel inclusive and "soft."

---

## 7. Token Reference Summary
*   **Primary Action:** `#000666` (Navy)
*   **Accent/Prosperity:** `#fcd400` (Gold)
*   **Background Base:** `#fbf8fe`
*   **Radius (Standard):** `1rem` (16px)
*   **Shadow:** 4-8% Opacity, Tinted Navy.