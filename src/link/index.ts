import { TFile } from "obsidian";
import { TagPath } from "src/lang/tree";
import { getLang } from "src/lang/utils";
import CodeLinkPlugin from "src/main";
import { memorize } from "src/utils";

export const codeLinkInnerRe =
	/(?<fileLink>[^#|\]]+)(?:#(?<tagPath>[^#|\]]+))?(?:\|(?<alias>[^#|\]]+))?/;

export const codeLinkRe =
	/\[\[(?<fileLink>[^#|\]]+)(?:#(?<tagPath>[^#|\]]+))?(?:\|(?<alias>[^#|\]]+))?\]\](?<query>[^\s]*)?$/;

export const mdCodeLinkRe =
	/\[(?<alias>[^\]]+)?\]\((?<fileLink>[^#|)]+)(?:#(?<tagPath>[^#|)]+))?\)(?<query>[^\s]*)?$/;

type CodeLinkType = "inner" | "md" | "wiki";

export class CodeLinkItem {
	constructor(
		private _plugin: CodeLinkPlugin,
		readonly sourcePath: string,
		readonly text: string,
		readonly fileLink: string,
		readonly type: CodeLinkType,
		readonly rawTagPath: string | null,
		readonly alias: string | null,
		readonly query: string | null
	) {}

	@memorize
	get file(): TFile | null {
		return this._plugin.app.metadataCache.getFirstLinkpathDest(
			this.fileLink,
			this.sourcePath
		);
	}

	async fileContent(): Promise<string | null> {
		return this.file && this._plugin.app.vault.cachedRead(this.file);
	}

	@memorize
	get lang(): string | null {
		const targetFile = this.file;
		return targetFile ? getLang(targetFile.path) : getLang(this.fileLink);
	}

	@memorize
	get tagPath(): TagPath | null {
		return this.rawTagPath ? TagPath.from(this.rawTagPath) : null;
	}

	async tagContent(): Promise<string | null> {
		if (!this.tagPath || !this.file) {
			return null;
		}

		const tree = await this._plugin.parser.parse(this.file);
		const node = tree?.at(this.tagPath);

		return node?.content || null;
	}

	async content(): Promise<string | null> {
		return (await this.tagContent()) || (await this.fileContent());
	}

	private static _from(
		plugin: CodeLinkPlugin,
		sourcePath: string,
		type: CodeLinkType,
		match: RegExpMatchArray | null
	): CodeLinkItem | null {
		const groups = match?.groups;
		if (!groups) {
			return null;
		}

		const text = match[0];
		const fileLink = groups.fileLink;
		const rawTagPath = groups.tagPath || null;
		const alias = groups.alias || null;
		const query = groups.query || null;

		if (!fileLink) {
			return null;
		}

		return new CodeLinkItem(
			plugin,
			sourcePath,
			text,
			fileLink,
			type,
			rawTagPath,
			alias,
			query
		);
	}

	static from(
		plugin: CodeLinkPlugin,
		sourcePath: string,
		text: string
	): CodeLinkItem | null {
		for (const [type, re] of Object.entries({
			wiki: codeLinkRe,
			md: mdCodeLinkRe,
		} as const)) {
			const match = text.match(re);
			if (!match) {
				continue;
			}

			return this._from(plugin, sourcePath, type as CodeLinkType, match);
		}

		return null;
	}

	static fromInner(
		plugin: CodeLinkPlugin,
		sourcePath: string,
		text: string
	): CodeLinkItem | null {
		const match = text.match(codeLinkInnerRe);
		if (!match) {
			return null;
		}

		return this._from(plugin, sourcePath, "inner", match);
	}
}
