import { describe, it, expect, beforeEach } from 'vitest';
import { TagTree } from '../src/lang/tree';
import * as TreeSitter from 'web-tree-sitter';
import fs from 'fs';
import path from 'path';

describe('TagTree Parsing Tests', async () => {
    let parser: TreeSitter.Parser;
    let pythonLang: TreeSitter.Language;

    beforeEach(async () => {
        await TreeSitter.Parser.init();
        parser = new TreeSitter.Parser();
        // Load python wasm for testing. 
        // In a real test environment, we'd need the actual .wasm files.
        // For now, let's mock the basic behavior or try to load it if available.
        const wasmPath = path.resolve(__dirname, '../node_modules/tree-sitter-python/tree-sitter-python.wasm');
        if (fs.existsSync(wasmPath)) {
            pythonLang = await TreeSitter.Language.load(wasmPath);
            parser.setLanguage(pythonLang);
        }
    });

    it('should correctly parse python code and find tags', async () => {
        if (!pythonLang) {
            console.warn('Python WASM not found, skipping test');
            return;
        }

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
