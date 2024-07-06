import { MarkdownRenderer } from "obsidian";
import CodeLinkPlugin from "src/main";

export abstract class Component {
	protected _containerEl: HTMLElement;

	constructor(
		protected _plugin: CodeLinkPlugin,
		protected _sourcePath: string
	) {
		this._containerEl = createEl("div");
	}

	markdown(el: HTMLElement, markdownText: string): void {
		MarkdownRenderer.render(
			this._plugin.app,
			markdownText,
			el,
			this._sourcePath,
			this._plugin
		);
	}

	abstract render(...args: unknown[]): HTMLElement;
}
