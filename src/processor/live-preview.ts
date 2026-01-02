import {
	Decoration,
	DecorationSet,
	EditorView,
	WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder, StateField, EditorState } from "@codemirror/state";
import { editorInfoField, MarkdownView } from "obsidian";
import CodeLinkPlugin from "src/main";
import { CodeLinkItem } from "src/link";
import { CodeLinkEmbedPreview } from "src/component/embed";

class CodeLinkWidget extends WidgetType {
	constructor(
		private plugin: CodeLinkPlugin,
		private sourcePath: string,
		private linkText: string
	) {
		super();
	}

	eq(other: CodeLinkWidget) {
		return (
			other.linkText === this.linkText && other.sourcePath === this.sourcePath
		);
	}

	toDOM() {
		const container = document.createElement("div");
		container.classList.add("code-link-lp-container");
		const loading = container.createDiv({
			cls: "code-link-loading",
			text: "Loading code link...",
		});

		this.renderPreview(container, loading);

		return container;
	}

	private async renderPreview(container: HTMLElement, loading: HTMLElement) {
		const item = CodeLinkItem.fromInner(
			this.plugin,
			this.sourcePath,
			this.linkText
		);
		if (!item?.lang) {
			loading.setText("Invalid code link");
			return;
		}

		const file = item.file;
		const tagPath = item.tagPath;

		if (!file) {
			loading.setText(`File not found: ${item.fileLink}`);
			return;
		}

		try {
			let node = null;
			if (this.plugin.settings.enableTagSearch && tagPath) {
				const tagTree = await this.plugin.parser.parse(file);
				node = tagTree?.at(tagPath) ?? null;
			}

			const preview = new CodeLinkEmbedPreview(this.plugin, this.sourcePath);
			const previewEl = preview.render(file, node);

			loading.detach();
			container.appendChild(previewEl);
		} catch (e) {
			loading.setText("Error loading code link");
			console.error("Code Link: failed to render preview", e);
		}
	}
}

function buildDecorations(
	state: EditorState,
	plugin: CodeLinkPlugin
): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();
	const mdView = state.field(editorInfoField, false) as MarkdownView | null;
	const sourcePath = mdView?.file?.path ?? "";

	if (!sourcePath) return Decoration.none;

	const text = state.doc.toString();
	const re = /!\[\[([^\]]+)\]\]/g;
	let match;

	while ((match = re.exec(text)) !== null) {
		const start = match.index;
		const end = start + match[0].length;
		const linkText = (match[1] || "").trim();
		if (!linkText) continue;

		const isCursorInside = state.selection.ranges.some(
			(r) => r.from <= end && r.to >= start
		);

		if (isCursorInside) continue;

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

	return builder.finish();
}

export const codeLinkLivePreviewExtension = (plugin: CodeLinkPlugin) => {
	return StateField.define<DecorationSet>({
		create(state) {
			return buildDecorations(state, plugin);
		},
		update(decorations, tr) {
			if (tr.docChanged || !tr.state.selection.eq(tr.startState.selection)) {
				return buildDecorations(tr.state, plugin);
			}
			return decorations.map(tr.changes);
		},
		provide: (f) => EditorView.decorations.from(f),
	});
};

