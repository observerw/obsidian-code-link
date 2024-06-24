import { MarkdownPostProcessor } from "obsidian";
import { CodeLinkEmbedPreview } from "src/component/embed";
import { PostProcessor } from ".";
import { CodeLinkItem } from "src/link";
import { TagTreeNode } from "src/lang/tree";

export class CodeLinkEmbedPreviewPostProcessor extends PostProcessor {
	process: MarkdownPostProcessor = (el, { sourcePath }) => {
		const embeds = el.querySelectorAll<HTMLSpanElement>(".internal-embed");

		embeds.forEach(async (embed) => {
			const src = embed.getAttribute("src");
			if (!src) {
				return;
			}

			const item = CodeLinkItem.fromInner(this._plugin, sourcePath, src);
			if (!item?.lang) {
				return;
			}

			const file = item?.file;
			const tagPath = item?.tagPath;

			if (!file) {
				return;
			}

			let node: TagTreeNode | null = null;
			if (this._plugin.settings.enableTagSearch && tagPath) {
				const tagTree = await this._plugin.parser.parse(file);
				node = tagTree?.at(tagPath) ?? null;
			}

			embed.replaceWith(
				...new CodeLinkEmbedPreview(this._plugin, sourcePath).render(
					file,
					node
				)
			);
		});
	};
}
