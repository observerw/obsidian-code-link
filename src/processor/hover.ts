import CodeLinkPlugin from "src/main";
import { PostProcessor } from ".";
import { MarkdownPostProcessor, MarkdownRenderer } from "obsidian";
import { CodeLinkItem } from "src/link";

export class CodeLinkHoverPreviewObserver {
	hovering: CodeLinkItem | null = null;
	sourcePath: string | null = null;

	constructor(private _plugin: CodeLinkPlugin) {
		const mutationObserver = new MutationObserver(this._onHover);
		mutationObserver.observe(document.body, {
			childList: true,
			subtree: false,
		});
	}

	private _onHover: MutationCallback = async ([mutation]) => {
		if (!this.hovering || !this.sourcePath) {
			return;
		}

		const node = mutation?.addedNodes[0];

		if (!node || node.nodeType !== Node.ELEMENT_NODE) {
			return;
		}

		const el = node as HTMLElement;

		if (!el.hasClass("hover-popover")) {
			return;
		}

		el.replaceChildren();
		el.addClass("code-link-hover-preview-popover");

		const code = await this.hovering.content();

		await MarkdownRenderer.render(
			this._plugin.app,
			`\`\`\`${this.hovering.lang}\n${code}\n\`\`\``,
			node as HTMLElement,
			this.sourcePath,
			this._plugin
		);

		const btnEl = el.querySelector(".copy-code-button");
		btnEl?.remove();
	};
}

export class CodeLinkHoverPreviewPostProcessor extends PostProcessor {
	private _observer: CodeLinkHoverPreviewObserver;

	constructor(plugin: CodeLinkPlugin) {
		super(plugin);
		this._observer = new CodeLinkHoverPreviewObserver(plugin);
	}

	process: MarkdownPostProcessor = (el, { sourcePath }) => {
		// FIXME post processor won't be called again if plugin is disabled after file is opened
		this._observer.sourcePath = sourcePath;

		const internalLinkEls = Array.from(
			el.querySelectorAll(".internal-link")
		) as HTMLAnchorElement[];

		for (const linkEl of internalLinkEls) {
			this._plugin.registerDomEvent(
				linkEl,
				"mouseenter",
				({ target }) => {
					const link = (target as HTMLAnchorElement).getAttribute(
						"data-href"
					);

					const item =
						link &&
						CodeLinkItem.fromInner(this._plugin, sourcePath, link);

					if (item && item.lang) {
						this._observer.hovering = item;
					}
				}
			);
			this._plugin.registerDomEvent(linkEl, "mouseleave", () => {
				this._observer.hovering = null;
			});
		}
	};
}
