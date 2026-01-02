import { memorize } from "src/utils";
import * as TreeSitter from "web-tree-sitter";

export class TagPath {
	static readonly DELIMITER = ">";

	constructor(readonly tags: string[]) {}

	// O(k) where k = path length
	static from(path: string): TagPath {
		return new TagPath(path.split(this.DELIMITER));
	}

	// O(k)
	toString(): string {
		return this.tags.join(TagPath.DELIMITER);
	}
}

export class TagTreeNode {
	readonly children: TagTreeNode[] = [];
	parent: TagTreeNode | null = null;

	constructor(
		readonly name: string,
		readonly syntaxNode: TreeSitter.Node
	) {}

	get id(): number {
		return this.syntaxNode.id;
	}

	get root(): boolean {
		return !this.parent;
	}

	// O(d) where d = depth, memoized to O(1) after first call
	@memorize
	get ancestors(): TagTreeNode[] {
		if (!this.parent || this.parent.root) return [];
		return [...this.parent.ancestors, this.parent];
	}

	// O(m) where m = name length, memoized
	@memorize
	get tag(): string {
		return this.name.replaceAll(/[\s<>#()]/g, "");
	}

	// O(d), memoized
	@memorize
	get tagPath(): TagPath {
		return new TagPath([...this.ancestors, this].map((n) => n.tag));
	}

	// O(d)
	get display(): string {
		return [...this.ancestors, this]
			.map((n) => `\`${n.name}\``)
			.join(` <span style="color: red;">${TagPath.DELIMITER}</span> `);
	}

	// O(L) where L = content length, memoized
	@memorize
	get content(): string {
		const text = this.syntaxNode.text;
		const indent = this.syntaxNode.startPosition.column;
		if (!indent) return text;

		const lines = text.split(/\r?\n/);
		lines[0] = lines[0]!;
		for (let i = 1; i < lines.length; i++) {
			lines[i] = lines[i]!.slice(indent);
		}
		return lines.join("\n");
	}

	get startLine(): number {
		return this.syntaxNode.startPosition.row;
	}

	get endLine(): number {
		return this.syntaxNode.endPosition.row;
	}
}

export class TagTree {
	private readonly root: TagTreeNode;
	private readonly pathIndex = new Map<string, TagTreeNode>();

	// O(n * h) where n = tag nodes, h = AST height
	constructor(tree: TreeSitter.Tree, tagsQuery: TreeSitter.Query) {
		this.root = new TagTreeNode("", tree.rootNode);

		// O(n)
		const nodes = tagsQuery.matches(tree.rootNode).flatMap(({ captures }) => {
			if (!captures.length) return [];
			const name = captures.slice(1).map((c) => c.node.text).join(" ");
			return [new TagTreeNode(name, captures[0]!.node)];
		});

		// O(n)
		const idMap = new Map(nodes.map((n) => [n.id, n]));

		// O(n * h) - each node traverses up to h ancestors
		for (const node of nodes) {
			const parent = this.findParent(node.syntaxNode.parent, idMap);
			node.parent = parent;
			parent.children.push(node);
			this.pathIndex.set(node.tagPath.toString(), node);
		}
	}

	// O(h)
	private findParent(
		syntaxNode: TreeSitter.Node | null,
		idMap: Map<number, TagTreeNode>
	): TagTreeNode {
		while (syntaxNode) {
			const tagNode = idMap.get(syntaxNode.id);
			if (tagNode) return tagNode;
			syntaxNode = syntaxNode.parent;
		}
		return this.root;
	}

	// O(n)
	get dfs(): TagTreeNode[] {
		const result: TagTreeNode[] = [];
		const stack = [...this.root.children];
		while (stack.length) {
			const node = stack.pop()!;
			result.push(node);
			stack.push(...node.children);
		}
		return result;
	}

	// O(1)
	get nodes(): TagTreeNode[] {
		return this.root.children;
	}

	// O(k) where k = path length
	at(path: TagPath): TagTreeNode | null {
		return this.pathIndex.get(path.toString()) ?? null;
	}

	// O(1), delegates to memoized tagPath
	path(node: TagTreeNode): TagPath {
		return node.tagPath;
	}
}
