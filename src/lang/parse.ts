import CodeLinkPlugin from "src/main";
import { LangLoader } from "./loader";
import { TagTree } from "./tree";
import { TFile } from "obsidian";
import { getLang } from "./utils";

export class CodeFileParser {
	private _langLoader: LangLoader;

	constructor(private _plugin: CodeLinkPlugin) {
		this._langLoader = new LangLoader(_plugin);
	}

	async parse(file: TFile): Promise<TagTree | null> {
		const langName = getLang(file.path);
		if (!langName) {
			return null;
		}

		const lang = await this._langLoader.load(langName);
		if (!lang) {
			return null;
		}

		const parser = await lang.parser();
		const query = await lang.tagsQuery();

		const code = await this._plugin.app.vault.cachedRead(file);

		const tree = parser?.parse(code);
		if (!tree) {
			return null;
		}

		if (!query) {
			return null;
		}
		const tagTree = new TagTree(tree, query);

		return tagTree;
	}
}
