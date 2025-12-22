# Technical Proposal: Migration to web-tree-sitter

## 1. Goal
Replace the current native Tree-sitter bindings with `web-tree-sitter` (WASM) to achieve cross-platform compatibility (Desktop + Mobile) and simplify the codebase.

## 2. Architecture Changes

### 2.1 Engine Replacement
- **Current**: `node-gyp-build` + `tree-sitter-patch.js` (900 lines of manual patching).
- **Proposed**: Official `web-tree-sitter` library.

### 2.2 WASM Loading Strategy
- **Distribution**: Bundle language `.wasm` files within the plugin's folder or host them on a reliable CDN.
- **Initialization**:
  ```typescript
  import Parser from 'web-tree-sitter';

  async function initParser() {
      await Parser.init();
      const parser = new Parser();
      // Load language wasm from local assets or URL
      const Lang = await Parser.Language.load('path/to/tree-sitter-lang.wasm');
      parser.setLanguage(Lang);
  }
  ```

### 2.3 Performance Optimization
- **Parse Caching**: Store parsed trees in a `Map<string, Tree>`.
- **Incremental Parsing**: Utilize `tree.edit()` when user is typing to avoid full re-parses.
- **Lazy Loading**: Only load the WASM for a language when a file of that type is first encountered.

## 3. Implementation Details

### 3.1 Build Pipeline
- Update `esbuild.config.mjs` to handle `.wasm` file assets.
- Ensure `web-tree-sitter` is bundled correctly without Node.js native dependencies.

### 3.2 Simplified Language Registration
To facilitate easy expansion, we will use a **Convention over Configuration** approach:
- **Registry**: A single file `src/lang/data/definitions.ts` defines all supported languages.
- **Assets**: 
    - WASM: `assets/langs/tree-sitter-[id].wasm`
    - SCM: `src/lang/data/scm/[id].scm`
- **Dynamic Loading**: `LangLoader` will automatically fetch the correct assets based on the language `id` when a file is opened.

## 4. Migration Steps
1. Update `package.json` dependencies.
2. Refactor `src/lang/loader.ts` to use `web-tree-sitter`.
3. Remove `src/tree-sitter-patch/`.
4. Update `src/lang/parse.ts` to handle the new `Tree` and `Node` types from `web-tree-sitter`.
5. Verify parsing logic with existing SCM (Query) files.
