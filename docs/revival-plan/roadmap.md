# Obsidian Code Link Revival Roadmap

This document outlines the step-by-step plan to modernize the `obsidian-code-link` plugin, focusing on cross-platform compatibility (especially mobile), performance, and maintainability.

## Phase 1: Core Engine Modernization (High Priority)
- [ ] **Migration to `web-tree-sitter` (WASM)**
    - Replace native `node-gyp` bindings with WASM to support Obsidian Mobile.
    - Remove the 900-line `tree-sitter-patch.js` custom wrapper.
    - Implement a robust WASM loader with `locateFile` support.
- [ ] **Dependency Refresh**
    - Upgrade `esbuild`, `typescript`, and `eslint`.
    - Modernize build scripts and configuration.
- [ ] **AST Caching System**
    - Implement a `ParseCache` using file paths and `mtime` to prevent redundant parsing.
    - Add incremental parsing support for better performance during typing.

## Phase 2: Feature & Extensibility (Medium Priority)
- [ ] **Simplified Language Extension System**
    - Refactor `src/lang/data/` to use a configuration-driven registry.
    - Standardize asset naming (e.g., `[lang].wasm`, `[lang].scm`).
    - Eliminate manual imports for language-specific logic.
- [ ] **Language Support Expansion**
    - Add support for Java, C#, PHP, Go, etc., using the new system.
- [ ] **UI/UX Refinement**
    - Improve Hover Preview with navigation buttons.
    - Polish Embed styling to match Obsidian's native themes.
    - Add localized strings (i18n).

## Phase 3: Stability & Quality (Low Priority)
- [ ] **Automated Testing**
    - Setup `vitest` for parsing and link resolution logic.
- [ ] **Documentation Update**
    - Refresh `README.md` and add developer guides for contributing new languages.
