import { memorize } from "src/utils";
import type {
	Tree,
	Query,
	SyntaxNode,
	QueryMatch,
} from "src/tree-sitter-patch";

export class TagTreeNode {
	private _children: TagTreeNode[] | null = null;
	private _parent: TagTreeNode | null = null;

	constructor(readonly name: string, readonly syntaxNode: SyntaxNode) {}

	get children(): TagTreeNode[] | null {
		return this._children;
	}

	set children(children: TagTreeNode[]) {
		if (this._children) {
			throw new Error("children already set");
		}
		this._children = children;
	}

	get parent(): TagTreeNode | null {
		return this._parent;
	}

	set parent(parent: TagTreeNode | null) {
		if (this._parent) {
			throw new Error("parent already set");
		}
		this._parent = parent;
	}

	get parents(): TagTreeNode[] {
		const parents: TagTreeNode[] = [];
		let current = this.parent;
		while (current && !current.root) {
			parents.push(current);
			current = current.parent;
		}
		return parents.reverse();
	}

	get root(): boolean {
		return this.parent === null;
	}

	get id(): number {
		return this.syntaxNode.id;
	}

	@memorize
	get tag(): string {
		return this.name.replaceAll(/[\s<>#()]/g, "");
	}

	get tags(): string[] {
		return [...this.parents, this].map((n) => n.tag);
	}

	get tagPath(): TagPath {
		return TagPath.fromTags(this.tags);
	}

	get display(): string {
		return [...this.parents, this]
			.map((n) => `\`${n.name}\``)
			.join(` <span style="color: red;">${TagPath.DELIMITER}</span> `);
	}

	@memorize
	get content(): string {
		const offset = this.syntaxNode.startPosition.column;
		const rawContent = this.syntaxNode.text;

		const [firstLine, ...restLines] = rawContent.split(/\r?\n/);

		const dedentedLines = restLines.map((line) => `${line.slice(offset)}`);

		return [firstLine, ...dedentedLines].join("\n");
	}

	get startLine(): number {
		return this.syntaxNode.startPosition.row;
	}

	get endLine(): number {
		return this.syntaxNode.endPosition.row;
	}
}

export class TagPath {
	static DELIMITER = ">";

	private constructor(public tags: string[]) {}

	static from(path: string): TagPath {
		return new TagPath(path.split(TagPath.DELIMITER));
	}

	static fromTags(tags: string[]): TagPath {
		return new TagPath(tags);
	}

	toString(): string {
		return this.tags.join(TagPath.DELIMITER);
	}
}

export class TagMatch {
	constructor(public name: string, public node: SyntaxNode) {}

	get id(): number {
		return this.node.id;
	}

	static fromMatch(match: QueryMatch): TagMatch | null {
		const captures = match.captures;
		if (!captures.length) {
			return null;
		}

		const itemMatch = captures[0]!;
		const nameMatches = captures.slice(1);

		const name = nameMatches.map(({ node: { text } }) => text).join(" ");
		const node = itemMatch.node;

		return new TagMatch(name, node);
	}

	static fromMatches(matches: QueryMatch[]): TagMatch[] {
		return matches.flatMap((m) => TagMatch.fromMatch(m) ?? []);
	}
}

/**
 * filtered version of the AST, only containing tag nodes
 */
export class TagTree {
	private _root: TagTreeNode;

	constructor(tree: Tree, tagsQuery: Query) {
		const root = tree.rootNode;
		this._root = new TagTreeNode("", root);

		const tagTreeNodes = TagMatch.fromMatches(tagsQuery.matches(root)).map(
			({ name, node }) => new TagTreeNode(name, node)
		);
		const tagTreeNodesLookup = new Map(
			tagTreeNodes.map((n) => [n.syntaxNode.id, n])
		);

		const tagTreeNodeChildren = (node: TagTreeNode): TagTreeNode[] => {
			const children: TagTreeNode[] = [];

			const nodeList = [...node.syntaxNode.children];
			while (nodeList.length) {
				const childNode = nodeList.shift();
				if (!childNode) {
					continue;
				}

				const tagNode = tagTreeNodesLookup.get(childNode.id);
				if (tagNode) {
					children.push(tagNode);
				} else {
					nodeList.push(...childNode.children);
				}
			}

			return children;
		};

		for (const tagTreeNode of [...tagTreeNodes, this._root]) {
			const children = tagTreeNodeChildren(tagTreeNode);
			tagTreeNode.children = children;
			for (const child of children) {
				child.parent = tagTreeNode;
			}
		}
	}

	get dfs(): TagTreeNode[] {
		const stack = [...(this._root.children ?? [])];
		const nodes: TagTreeNode[] = [];

		while (stack.length) {
			const node = stack.pop()!;
			nodes.push(node);
			stack.push(...(node.children ?? []));
		}

		return nodes;
	}

	get bfs(): TagTreeNode[] {
		const queue = [...(this._root.children ?? [])];
		const nodes: TagTreeNode[] = [];

		while (queue.length) {
			const node = queue.shift()!;
			nodes.push(node);
			queue.push(...(node.children ?? []));
		}

		return nodes;
	}

	get nodes(): TagTreeNode[] {
		return this._root.children ?? [];
	}

	at(path: TagPath): TagTreeNode | null {
		let current = this._root;
		for (const tag of path.tags) {
			const child = current.children?.find((c) => c.tag == tag);
			if (!child) {
				return null;
			}
			current = child;
		}
		return current;
	}

	path(node: TagTreeNode): TagPath {
		const tags = [node.tag];
		let current = node;
		while (current.parent && !current.parent.root) {
			tags.unshift(current.parent.tag);
			current = current.parent;
		}
		return TagPath.fromTags(tags);
	}
}
