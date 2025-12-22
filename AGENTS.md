# Agent Guidelines

## Commands
- **Build**: `pnpm run build` (Typecheck + Bundling)
- **Dev**: `pnpm run dev` (Watch mode)
- **Lint**: `npx eslint .` (Uses `@typescript-eslint/recommended`)
- **Tests**: No test suite configured.

## Code Style
- **Indentation**: Use **Tabs** (4 spaces width) as per `.editorconfig`.
- **TypeScript**: Strict mode. Avoid `any` or `@ts-ignore`. Use proper interfaces.
- **Naming**: `PascalCase` for classes; `camelCase` for variables/methods. Use concise names.
- **Imports**: Grouped named imports. Prefer relative paths for local modules.
- **Error Handling**: Use `try-catch` for critical logic. Use Obsidian `Notice` for UI feedback.
- **Patterns**:
    - Use `@memorize` decorator for expensive calculations in classes.
    - Modularize processors, modals, and settings into their respective `src/` subdirectories.
    - Follow Obsidian plugin lifecycle (onload/onunload) in `src/main.ts`.
- **CSS**: Add styles to `styles.css`. Keep selectors specific to avoid clashing with Obsidian UI.
