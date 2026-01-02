import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { editorInfoField, MarkdownView } from "obsidian";
import CodeLinkPlugin from "src/main";
import { CodeLinkItem } from "src/link";
import { CodeLinkEmbedPreview } from "src/component/embed";
import { TagTreeNode } from "src/lang/tree";

class CodeLinkWidget extends WidgetType {
	constructor(
		private plugin: CodeLinkPlugin,
		private sourcePath: string,
		private linkText: string
	) {
		super();
	}

	eq(other: CodeLinkWidget) {
		return other.linkText === this.linkText && other.sourcePath === this.sourcePath;
	}

	toDOM() {
		const container = document.createElement("div");
		container.classList.add("code-link-lp-container");

		this.renderPreview(container);

		return container;
	}

	private async renderPreview(container: HTMLElement) {
		const item = CodeLinkItem.fromInner(this.plugin, this.sourcePath, this.linkText);
		if (!item?.lang) return;

		const file = item.file;
		const tagPath = item.tagPath;

		if (!file) return;

		let node: TagTreeNode | null = null;
		if (this.plugin.settings.enableTagSearch && tagPath) {
			const tagTree = await this.plugin.parser.parse(file);
			node = tagTree?.at(tagPath) ?? null;
		}

		const preview = new CodeLinkEmbedPreview(this.plugin, this.sourcePath);
		container.appendChild(preview.render(file, node));
	}
}

export const codeLinkLivePreviewExtension = (plugin: CodeLinkPlugin) => {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = this.buildDecorations(view);
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged) {
					this.decorations = this.buildDecorations(update.view);
				}
			}

			destroy() {}

			buildDecorations(view: EditorView): DecorationSet {
				const builder = new RangeSetBuilder<Decoration>();
				const mdView = view.state.field(editorInfoField, false) as MarkdownView | null;
				const sourcePath = mdView?.file?.path ?? "";

				if (!sourcePath) return Decoration.none;

				for (const { from, to } of view.visibleRanges) {
					const text = view.state.doc.sliceString(from, to);
					// Obsidian standard internal embed pattern: ![[...]]
					const re = /!\[\[([^\]]+)\]\]/g;
					let match;

					while ((match = re.exec(text)) !== null) {
						const start = from + match.index;
						const end = start + match[0].length;
						const linkText = match[1];

						if (!linkText) continue;

						const item = CodeLinkItem.fromInner(plugin, sourcePath, linkText);
						if (item?.lang) {
							builder.add(
								start,
								end,
								Decoration.replace({
									widget: new CodeLinkWidget(plugin, sourcePath, linkText),
									block: true,
								})
							);
						}
					}
				}

				return builder.finish();
			}
		},
		{
			decorations: (v) => v.decorations,
		}
	);
};
