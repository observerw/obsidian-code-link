import { describe, it, expect, vi } from 'vitest';
import { TagPath, TagTreeNode, TagTree } from '../src/lang/tree';
import * as TreeSitter from 'web-tree-sitter';

function createMockNode(properties: Partial<TreeSitter.Node> & { id: number }): TreeSitter.Node {
	return {
		parent: null,
		...properties
	} as TreeSitter.Node;
}

describe('TagPath', () => {
	it('should create from string and join back', () => {
		const path = "A>B>C";
		const tagPath = TagPath.from(path);
		expect(tagPath.tags).toEqual(["A", "B", "C"]);
		expect(tagPath.toString()).toBe(path);
	});

	it('should handle empty string', () => {
		const tagPath = TagPath.from("");
		expect(tagPath.tags).toEqual([]);
		expect(tagPath.toString()).toBe("");
	});
});

describe('TagTreeNode', () => {
	it('should sanitize tags', () => {
		const node = new TagTreeNode("func(arg)", createMockNode({ id: 1 }));
		expect(node.tag).toBe("funcarg");

		const node2 = new TagTreeNode("class <T>", createMockNode({ id: 2 }));
		expect(node2.tag).toBe("classT");
	});

	it('should compute ancestors and tagPath', () => {
		const rootNode = createMockNode({ id: 0 });
		const parentNode = createMockNode({ id: 1 });
		const childNode = createMockNode({ id: 2 });

		const root = new TagTreeNode("root", rootNode);
		const parent = new TagTreeNode("parent", parentNode);
		const child = new TagTreeNode("child", childNode);

		child.parent = parent;
		parent.parent = root;

		expect(child.ancestors).toEqual([parent]);
		expect(child.tagPath.toString()).toBe("parent>child");
		
		expect(parent.ancestors).toEqual([]);
		expect(parent.tagPath.toString()).toBe("parent");
	});

	it('should handle content indentation', () => {
		const node = createMockNode({
			id: 1,
			text: "def hello():\n    print('hi')",
			startPosition: { row: 0, column: 4 } as TreeSitter.Point,
			endPosition: { row: 1, column: 18 } as TreeSitter.Point
		});

		const tagNode = new TagTreeNode("hello", node);
		// First line is preserved, subsequent lines have indentation removed based on start column
		expect(tagNode.content).toBe("def hello():\nprint('hi')");
	});

	it('should handle content with no indentation', () => {
		const node = createMockNode({
			id: 1,
			text: "def hello():\n    print('hi')",
			startPosition: { row: 0, column: 0 } as TreeSitter.Point,
			endPosition: { row: 1, column: 18 } as TreeSitter.Point
		});

		const tagNode = new TagTreeNode("hello", node);
		// When column is 0, content should be returned as-is
		expect(tagNode.content).toBe("def hello():\n    print('hi')");
	});
});

describe('TagTree', () => {
	it('should build hierarchy correctly', () => {
		const rootSyntaxNode = createMockNode({ id: 0 });
		const parentSyntaxNode = createMockNode({ id: 1, parent: rootSyntaxNode });
		const childSyntaxNode = createMockNode({ id: 2, parent: parentSyntaxNode });

		const mockTree = { rootNode: rootSyntaxNode } as TreeSitter.Tree;
		const mockQuery = {
			matches: vi.fn().mockReturnValue([
				{ captures: [{ node: parentSyntaxNode }, { node: { text: "Parent" } }] },
				{ captures: [{ node: childSyntaxNode }, { node: { text: "Child" } }] }
			])
		} as unknown as TreeSitter.Query;

		const tagTree = new TagTree(mockTree, mockQuery);
		const nodes = tagTree.dfs;

		expect(nodes.length).toBe(2);
		
		const parent = tagTree.nodes[0];
		const child = parent?.children[0];

		expect(parent?.name).toBe("Parent");
		expect(child?.name).toBe("Child");
		expect(child?.parent).toBe(parent);
		
		expect(tagTree.at(TagPath.from("Parent>Child"))).toBe(child);
	});

	it('should handle empty results', () => {
		const rootSyntaxNode = createMockNode({ id: 0 });
		const mockTree = { rootNode: rootSyntaxNode } as TreeSitter.Tree;
		const mockQuery = {
			matches: vi.fn().mockReturnValue([])
		} as unknown as TreeSitter.Query;

		const tagTree = new TagTree(mockTree, mockQuery);
		expect(tagTree.nodes.length).toBe(0);
		expect(tagTree.dfs.length).toBe(0);
	});

	it('should handle deeply nested structures', () => {
		const n0 = createMockNode({ id: 0 });
		const n1 = createMockNode({ id: 1, parent: n0 });
		const n2 = createMockNode({ id: 2, parent: n1 });
		const n3 = createMockNode({ id: 3, parent: n2 });

		const mockTree = { rootNode: n0 } as TreeSitter.Tree;
		const mockQuery = {
			matches: vi.fn().mockReturnValue([
				{ captures: [{ node: n1 }, { node: { text: "Level1" } }] },
				{ captures: [{ node: n2 }, { node: { text: "Level2" } }] },
				{ captures: [{ node: n3 }, { node: { text: "Level3" } }] }
			])
		} as unknown as TreeSitter.Query;

		const tagTree = new TagTree(mockTree, mockQuery);
		expect(tagTree.at(TagPath.from("Level1>Level2>Level3"))?.name).toBe("Level3");
	});

	it('should return correct path for nodes', () => {
		const rootSyntaxNode = createMockNode({ id: 0 });
		const parentSyntaxNode = createMockNode({ id: 1, parent: rootSyntaxNode });
		const childSyntaxNode = createMockNode({ id: 2, parent: parentSyntaxNode });

		const mockTree = { rootNode: rootSyntaxNode } as TreeSitter.Tree;
		const mockQuery = {
			matches: vi.fn().mockReturnValue([
				{ captures: [{ node: parentSyntaxNode }, { node: { text: "Parent" } }] },
				{ captures: [{ node: childSyntaxNode }, { node: { text: "Child" } }] }
			])
		} as unknown as TreeSitter.Query;

		const tagTree = new TagTree(mockTree, mockQuery);
		const parent = tagTree.nodes[0]!;
		const child = parent.children[0]!;

		expect(tagTree.path(parent).toString()).toBe("Parent");
		expect(tagTree.path(child).toString()).toBe("Parent>Child");
	});
});
