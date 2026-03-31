# Design System Strategy: The Stoic Monolith

## 1. Overview & Creative North Star
**Creative North Star: The Stoic Monolith**
This design system is not a mere utility; it is a digital sanctuary for discipline. It rejects the "bubbly" and "friendly" tropes of modern SaaS in favor of a high-performance, editorial aesthetic. We achieve this through **Architectural Brutalism**—using heavy typographic scales, intentional asymmetry, and deep tonal layering. 

The goal is to make the user feel like they are interacting with a precision instrument. We break the "template" look by utilizing wide gutters, extreme contrast between massive display type and micro-labels, and a complete absence of decorative lines. The UI does not guide the user with "helpfulness"; it commands focus through clarity.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the `surface` (#0b1326), a deep, obsidian blue-black that provides a void-like backdrop for high-performance data.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. Layout boundaries must be established exclusively through background color shifts. 
- Use `surface-container-low` (#131b2e) for secondary content areas.
- Use `surface-container-high` (#222a3d) for interactive elements.
- Transitions must feel like tectonic plates shifting, not boxes drawn on a page.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical, machined layers. 
- **Base Layer:** `surface` (#0b1326).
- **Secondary Tier:** `surface-container-lowest` (#060e20) to create "sunken" wells for data input.
- **Top Tier:** `surface-container-highest` (#2d3449) for active, elevated components.
- **Nesting:** Always nest a `surface-container-high` element inside a `surface-container-low` section to create natural, logical depth without visual noise.

### The "Glass & Gradient" Rule
To prevent the dark mode from feeling "flat," use **Atmospheric Gradients**. 
- **Action Gradients:** Apply a linear gradient from `primary` (#ffb77d) to `primary-container` (#d97707) at a 135-degree angle for primary CTA buttons.
- **Glassmorphism:** For floating modals or navigation bars, use `surface-bright` (#31394d) at 60% opacity with a `20px` backdrop-blur. This ensures the "Monolith" feels sophisticated and multi-dimensional.

---

## 3. Typography: The Editorial Edge
We use a dual-font approach to balance raw power with technical precision.

- **Headings (Inter):** Utilized in Bold and Extra Bold weights. Use `display-lg` (3.5rem) for habit streaks and daily goals to create a sense of monumental achievement. The tight letter-spacing (-0.02em) is mandatory for headlines.
- **Functional Text (Inter):** Use `body-md` for descriptions. It is clean, invisible, and stays out of the way of the data.
- **Technical Labels (Space Grotesk):** All `label-md` and `label-sm` elements must use **Space Grotesk**. This monospaced-leaning sans-serif introduces a "flight instrument" feel to timestamps, meta-data, and progress percentages.

---

## 4. Elevation & Depth
Depth is a function of light and material, not "shadows."

- **The Layering Principle:** Avoid the "card on gray" cliché. Instead, use "Tonal Carving." To highlight a habit card, don't give it a shadow; give it a `surface-container-highest` background against a `surface-dim` page.
- **Ambient Shadows:** If a floating element (like a FAB) requires a shadow, use a 32px blur with 8% opacity using the `on-surface` color. It should look like a soft glow of light being blocked, not a black smudge.
- **The "Ghost Border" Fallback:** In high-density data visualizations where separation is critical, use a `1px` stroke of `outline-variant` (#554336) at **15% opacity**. It should be barely felt, only sensed.

---

## 5. Components

### Buttons: The Kinetic Trigger
- **Primary:** Sharp corners (`rounded-none` or `sm`). Gradient fill (Primary to Primary-Container). Text is `on-primary` (#4d2600), Uppercase, Bold.
- **Secondary:** `surface-container-highest` fill. No border. 
- **States:** On hover, the primary button should "glow"—apply a subtle outer shadow using the `primary` color at 20% opacity.

### Habit Progress Chips
- **Selection:** Use `primary-container` (#d97707) for active states.
- **Unselected:** `surface-container-highest` with `on-surface-variant` text.
- **Shape:** Use the `sm` (0.125rem) rounding scale. It looks sharp, disciplined, and modern.

### Lists & Activity Feeds
- **Rule:** **Total prohibition of dividers.** 
- **Implementation:** Use `spacing-8` (1.75rem) to separate list items. Use a `surface-container-low` background on hover to indicate interactivity.

### Data Inputs
- **Field Style:** "Sunken" fields. Use `surface-container-lowest` background with a `2px` bottom-only border using `outline-variant`. 
- **Focus State:** Bottom border transitions to `primary` (#ffb77d).

### The "Monolith" Streak Card (Custom Component)
A large-scale component using `display-lg` typography for the number of days. Use a subtle `primary` to `transparent` vertical gradient background to draw the eye toward the most important metric: the user's discipline.

---

## 6. Do's and Don'ts

### Do:
- **Embrace White Space:** High-performance users need room to think. Use `spacing-12` and `spacing-16` for page margins.
- **Use High Contrast:** Ensure `on-surface` text on `surface` backgrounds maintains maximum legibility.
- **Align to a Rigid Grid:** Everything must feel intentional. If an element is off-center, it must be *drastically* off-center for an editorial look.

### Don't:
- **No Softness:** Never use `rounded-lg` or `rounded-xl` for primary containers. Keep it to `none` or `sm`.
- **No Pastels:** If a status is "Success," do not use mint green. Use the `primary` accent or `secondary` slate. 
- **No Default Shadows:** Never use standard CSS/Figma drop shadows. If it looks "web-ish," delete it.
- **No Clutter:** If a piece of information doesn't help the user complete their habit, remove it. Discipline is the removal of the unnecessary.