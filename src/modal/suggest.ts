import {
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	MarkdownRenderer,
	TFile,
} from "obsidian";
import { TagTree, TagTreeNode, TagPath } from "src/lang/tree";
import CodeLinkPlugin from "src/main";
import { distance } from "fastest-levenshtein";
import { CodeLinkItem } from "src/link";

interface TagTreeSuggestItem {
	context: EditorSuggestContext;
	item: CodeLinkItem;
	tree: TagTree;
	node: TagTreeNode;
}

export class TagTreeSuggest extends EditorSuggest<TagTreeSuggestItem> {
	constructor(private _plugin: CodeLinkPlugin) {
		super(_plugin.app);
	}

	private _markdown(
		el: HTMLElement,
		markdownText: string,
		{ context: { file } }: TagTreeSuggestItem
	) {
		MarkdownRenderer.render(
			this._plugin.app,
			markdownText,
			el,
			file.path,
			this._plugin
		);
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		file: TFile | null
	): EditorSuggestTriggerInfo | null {
		if (!this._plugin.settings.enableTagSearch) {
			return null;
		}

		if (!file) {
			return null;
		}

		const content = editor.getRange({ line: cursor.line, ch: 0 }, cursor);

		const item = CodeLinkItem.from(this._plugin, file.path, content);

		if (!item || !item.lang) {
			return null;
		}

		const start = cursor.ch - item.text.length;
		const end = cursor.ch;

		return {
			start: { line: cursor.line, ch: start },
			end: { line: cursor.line, ch: end },
			query: item.text,
		};
	}

	async getSuggestions(
		context: EditorSuggestContext
	): Promise<TagTreeSuggestItem[]> {
		const item = CodeLinkItem.from(
			this._plugin,
			context.file.path,
			context.query
		);
		const file = item?.file;
		const query = item?.query;

		if (!file) {
			return [];
		}

		const tree = await this._plugin.parser.parse(file);
		if (!tree) {
			return [];
		}

		const dfs = [...tree.dfs];
		if (query) {
			dfs.sort((a, b) => {
				const scoreA = score(query, tree.path(a));
				const scoreB = score(query, tree.path(b));
				return scoreA - scoreB;
			});
		}

		return dfs.map((node) => ({
			context,
			item,
			tree,
			node,
		}));
	}

	renderSuggestion(value: TagTreeSuggestItem, el: HTMLElement): void {
		this._markdown(el, `${value.node.display}`, value);
	}

	selectSuggestion(
		{
			context: { editor, start, end },
			item,
			tree,
			node,
		}: TagTreeSuggestItem,
		_evt: MouseEvent | KeyboardEvent
	): void {
		const nodePath = tree.path(node);
		const replace = (text: string) => {
			editor.replaceRange(text, start, end);
		};

		if (item.type === "wiki") {
			const alias = item.alias ? `|${item.alias}` : "";
			replace(`[[${item.fileLink}#${nodePath}${alias}]] `);
		} else if (item.type === "md") {
			replace(`[${item.alias ?? ""}](${item.fileLink}#${nodePath}) `);
		} else if (item.type === "inner") {
			replace(`${item.fileLink}#${nodePath}`);
		}
	}
}

const score = (query: string, path: TagPath): number => {
	const pathStr = path.tags.join();
	return (
		(distance(query, pathStr) * 100) /
		Math.max(query.length, pathStr.length)
	);
};
