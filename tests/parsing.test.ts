import { describe, it, expect, beforeEach } from 'vitest';
import { TagTree } from '../src/lang/tree';
import * as TreeSitter from 'web-tree-sitter';
import fs from 'fs';
import path from 'path';

describe('TagTree Parsing Tests', () => {
    let parser: TreeSitter.Parser;
    let pythonLang: TreeSitter.Language;

    beforeEach(async () => {
        await TreeSitter.Parser.init();
        parser = new TreeSitter.Parser();
        // Load python wasm for testing.
        // Prefer an explicit path via environment variable, otherwise use a local fixture.
        const wasmPath = process.env.TREE_SITTER_PYTHON_WASM
            ? path.resolve(process.cwd(), process.env.TREE_SITTER_PYTHON_WASM)
            : path.resolve(__dirname, 'fixtures', 'tree-sitter-python.wasm');
        if (fs.existsSync(wasmPath)) {
            pythonLang = await TreeSitter.Language.load(wasmPath);
            parser.setLanguage(pythonLang);
        } else {
            throw new Error(
                `Python WASM not found at ${wasmPath}. ` +
                `Set TREE_SITTER_PYTHON_WASM or add a fixture at tests/fixtures/tree-sitter-python.wasm.`
            );
        }
    });

    it('should correctly parse python code and find tags', async () => {
        const code = `
def hello_world():
    print("hello")

class MyClass:
    def method(self):
        pass
`;
        const scm = `
(function_definition
  name: (identifier) @name) @function

(class_definition
  name: (identifier) @name) @class
`;
        const query = new TreeSitter.Query(pythonLang, scm);
        const tree = parser.parse(code);
        if (!tree) throw new Error('Failed to parse');
        const tagTree = new TagTree(tree, query);

        const nodes = tagTree.dfs;
        expect(nodes.length).toBe(3);
        expect(nodes.map(n => n.name)).toContain('hello_world');
        expect(nodes.map(n => n.name)).toContain('MyClass');
        expect(nodes.map(n => n.name)).toContain('method');
    });
});
