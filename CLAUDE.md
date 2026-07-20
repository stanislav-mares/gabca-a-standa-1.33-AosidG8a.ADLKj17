# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

You are an expert developer specializing in the **Astro** framework. When writing or modifying code, strictly adhere to the following rules to maintain a clean, scalable, and high-performing codebase.

## Commands

```bash
npm run dev       # start dev server (localhost:4321)
npm run build     # production build to dist/
npm run preview   # preview production build
```

No test runner or linter is configured.

## Stack

- **Astro 6** — static site generator, all pages are `.astro` files
- **Tailwind CSS 4** — integrated via `@tailwindcss/vite` Vite plugin (no `tailwind.config.*` file)
- **DaisyUI 5** — loaded as a CSS `@plugin` in `src/styles/global.css`

## Architecture

This is a Czech wedding website ("S & G").

*   **Astro-First:** Prefer native `.astro` components for all static UI. Use interactive frameworks (React, Svelte, Vue) only when state management (`useState`, `useEffect`, etc.) is absolutely necessary.
*   **Islands Architecture:** Always apply the correct `client:*` directives (`client:load`, `client:visible`, `client:idle`) to interactive framework components. By default, pages must be shipped as pure HTML/CSS with zero client-side JavaScript.
*   **Content Collections:** Use `src/content/` for managing all content (blogs, documentation, structured data). Always define strict schemas using `zod` for data validation.

### Page navigation model

The site uses Astro's **View Transitions** (`ClientRouter` in `Layout.astro`) to animate between pages. Every page's `<main>` element carries:
- `transition:animate={slideTransition}` — custom directional slide (left/right) depending on browser history direction
- `transition:name="main-content"` — shared element transition across all pages

The `slideTransition` object is defined in `src/utils/transitions.ts` and references keyframe names (`slide-out-right`, `slide-in-left`, etc.) that are declared in `src/styles/global.css`.

### Page layout pattern

- `src/pages/index.astro` — landing page: full-screen layout with a fixed left panel (Logo + Menu + Countdown) over a background photo
- All sub-pages (`nas-pribeh`, `svatebni-den`, `fotogalerie`, `dotaznik`) render within `Layout.astro` and use `BackButton` (calls `history.back()`) for navigation

### CSS notes

- Tailwind is configured purely in `src/styles/global.css` (no config file) — to add custom components or base styles, use `@layer base` / `@layer components` there

## 💻 Coding Standards
*   **Type Safety:** 
    *   Always define an `interface Props` for every Astro component.
    *   Strictly adhere to `"strict": true` in `tsconfig.json`. 
    *   **Never** use the `any` type.
*   **Structure:**
    *   **Frontmatter (`---`):** Limit this area to data fetching, imports, and props transformation.
    *   **Logic:** Extract complex business logic or data manipulation into isolated files within `src/utils/`.
    *   **Styles:** Primarily use tailwind utility classes. Global styles (resets, fonts, global variables) belong exclusively in `src/styles/`.
*   **Assets:** Exclusively use the built-in `<Image/>` component from `astro:assets` for all images to ensure automatic optimization.
*  **Priority:** Always prefer the "Astro way" (build-time server-side rendering) over client-side rendering solutions.
*  **Comments:** Do not over-comment. Add comments only to explain non-trivial or complex business logic.
*  **Optimization:** When proposing or creating a component, always consider the most efficient loading strategy (e.g., defaulting to `client:visible` for below-the-fold interactive elements).

## ⚙️ Quality & Formatting
*   **Naming Conventions:**
    *   `PascalCase` for components (e.g., `HeroSection.astro`, `Button.tsx`).
    *   `kebab-case` for all other files and directories (e.g., `format-date.ts`).
*   **Linting & Formatting:** Code must be compatible with `eslint-plugin-astro` and formatted using `prettier-plugin-astro`.
*   **Scripts:** When adding standard `<script>` tags in `.astro` files:
    *   Avoid external dependencies unless absolutely necessary; prefer native Web APIs.
    *   Keep in mind that Astro automatically processes and hoists standard `<script>` tags.

## Communication & Collaboration
1) When i'll ask you to modify code, give me a brief plan of your approach before and i must to approve it.
2) When i approve the approach, don't give me all code at once, break it into smaller parts and wait for my approval before continuing to the next step.
   - Exception: if I've already given a blanket approval to proceed through all steps of a multi-step plan, don't stop to ask "should I continue?" before each step. Instead, just present the planned changes for that step (no need to phrase it as a question). Don't add any "waiting for your confirmation" remark either — that's just the permission question in prose form. Once I approve a step's plan, implement it, then immediately present the next step's plan in that same reply — no separate check-in in between.
3) If you encounter a problem or bug, describe it clearly and provide steps to reproduce it.
4) Don't ask after every step whether to start the dev server. Assume I'll run it myself; only mention it if it's genuinely relevant.
---
