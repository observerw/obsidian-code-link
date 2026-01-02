import { TagTreeNode, TagPath } from "src/lang/tree";
import { Component } from ".";
import CodeLinkPlugin from "src/main";
import { getLang } from "src/lang/utils";
import { TFile } from "obsidian";
import path from "path";

export class CodeLinkEmbedPreview extends Component {
	private _codeEl: HTMLElement;
	private _textEl: HTMLElement;

	private _activeNode: TagTreeNode | null = null;

	constructor(plugin: CodeLinkPlugin, sourcePath: string) {
		super(plugin, sourcePath);

		this._codeEl = this._containerEl.createEl("div", {
			cls: "code-link-embed-preview-code",
		});

		this._textEl = this._containerEl.createEl("div", {
			cls: "code-link-embed-preview-text",
		});
	}

	private _highLightLines(node: TagTreeNode): { start: number; end: number } {
		const offset = this._activeNode?.startLine ?? 0;

		return {
			start: node.startLine - offset,
			end: node.endLine - offset,
		};
	}

	async setCode(file: TFile, node?: TagTreeNode | null): Promise<void> {
		this._codeEl.empty();

		const langName = getLang(file.path);
		const text = node
			? node.content
			: await this._plugin.app.vault.cachedRead(file);

		this.markdown(this._codeEl, `\`\`\`${langName}\n${text}\n\`\`\``);
	}

	setText(file: TFile, targetNode?: TagTreeNode | null) {
		this._textEl.empty();

		if (!this._plugin.settings.showPathInEmbed) {
			return;
		}

		const relFilePath = path.relative(
			this._plugin.settings.relImportDirPath,
			file.path
		);
		const fileText = `File: [[${file.path}|${relFilePath}]]`;

		if (!targetNode) {
			this.markdown(this._textEl, fileText);
			return;
		}

		const nodes = [...targetNode.ancestors, targetNode];
		const nodeLink = nodes
			.map(({ name }) => `[[${name}]]`)
			.join(` ${TagPath.DELIMITER} `);
		const nodesText = `Tags: ${nodeLink}`;

		this.markdown(this._textEl, `${fileText}, ${nodesText}`);

		const linkEls = Array.from(
			this._textEl.querySelectorAll("a.internal-link")
		).slice(1);

		for (let i = 0; i < linkEls.length; i++) {
			const node = nodes[i]!;
			const linkEl = linkEls[i] as HTMLAnchorElement;

			if (this._activeNode?.id === node.id) {
				linkEl.addClass("code-link-embed-preview-tag");
			}

			linkEl.removeAttribute("href");
			linkEl.removeAttribute("data-href");
			this._plugin.registerDomEvent(linkEl, "click", (evt) => {
				evt.preventDefault();

				if (this._activeNode?.id === node.id) {
					return;
				}

				this._activeNode = node;
				this.setCode(file, node);
				this.setText(file, targetNode);

				this._codeEl.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
				});
			});
		}
	}

	render(file: TFile, node?: TagTreeNode | null): HTMLElement {
		if (node) {
			this._activeNode = node;
		}

		this.setCode(file, node);
		this.setText(file, node);

		return this._containerEl;
	}
}
