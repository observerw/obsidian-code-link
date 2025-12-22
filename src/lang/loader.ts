import * as TreeSitter from "web-tree-sitter";
import { Notice, requestUrl } from "obsidian";
import path from "path";
import CodeLinkPlugin from "src/main";
import { LangScmMap, SupportedLang, SupportedLangs } from "./data";
import pkg from "../../package.json";

const WEB_TREE_SITTER_VERSION = pkg.dependencies["web-tree-sitter"].replace("^", "").replace("~", "");

export class TreeSitterLoader {
	private _initialized = false;

	constructor() {}

	async exists(): Promise<boolean> {
		return true;
	}

	async download(): Promise<void> {
		await this.init();
	}

	async init() {
		if (this._initialized) return;
		await TreeSitter.Parser.init({
			locateFile: (scriptName: string) => {
				if (scriptName === "tree-sitter.wasm") {
					// Use a fixed version that matches the installed package
					return `https://cdn.jsdelivr.net/npm/web-tree-sitter@${WEB_TREE_SITTER_VERSION}/web-tree-sitter.wasm`;
				}
				return scriptName;
			},
		});
		this._initialized = true;
	}

	async load(): Promise<typeof TreeSitter.Parser> {
		await this.init();
		return TreeSitter.Parser;
	}
}

export class LangLoader {
	private _cache: Map<string, TreeSitter.Language> = new Map();
	private _failedSaves: Set<string> = new Set();

	constructor(private _plugin: CodeLinkPlugin) {}

	private get _langsDir(): string {
		const configDir = this._plugin.app.vault.configDir;
		const pluginId = this._plugin.manifest.id;
		return path.join(configDir, "plugins", pluginId, "langs");
	}

	async exists(langName: string): Promise<boolean> {
		const relPath = path.join(this._langsDir, `tree-sitter-${langName}.wasm`);
		return await this._plugin.app.vault.adapter.exists(relPath);
	}

	async download(langName: string): Promise<void> {
		await this.load(langName);
	}

	async load(langName: string): Promise<Lang> {
		if (!SupportedLangs.has(langName)) {
			throw new Error(`Language ${langName} is not supported.`);
		}

		await this._plugin.treeSitterLoader.init();

		if (this._cache.has(langName)) {
			return new Lang(langName as SupportedLang, this._cache.get(langName)!);
		}

		const relPath = path.join(this._langsDir, `tree-sitter-${langName}.wasm`);
		
		let langWasm: ArrayBuffer;
		if (await this._plugin.app.vault.adapter.exists(relPath)) {
			langWasm = await this._plugin.app.vault.adapter.readBinary(relPath);
		} else {
			const url = `https://cdn.jsdelivr.net/npm/tree-sitter-wasm-prebuilt@latest/wasm/tree-sitter-${langName}.wasm`;
			const response = await requestUrl(url);
			langWasm = response.arrayBuffer;
			
			if (!this._failedSaves.has(langName)) {
				try {
					if (!await this._plugin.app.vault.adapter.exists(this._langsDir)) {
						await this._plugin.app.vault.adapter.mkdir(this._langsDir);
					}
					await this._plugin.app.vault.adapter.writeBinary(relPath, langWasm);
				} catch (e) {
					console.error(`Failed to save WASM for ${langName}:`, e);
					this._failedSaves.add(langName);
					new Notice(`Failed to cache language support for ${langName}. It will be re-downloaded next time.`);
				}
			}
		}

		const lang = await TreeSitter.Language.load(new Uint8Array(langWasm));
		this._cache.set(langName, lang);
		
		return new Lang(langName as SupportedLang, lang);
	}
}

export class Lang {
	constructor(
		private _name: SupportedLang,
		private _lang: TreeSitter.Language
	) {}

	async parser(): Promise<TreeSitter.Parser> {
		const parser = new TreeSitter.Parser();
		parser.setLanguage(this._lang);
		return parser;
	}

	async tagsQuery(): Promise<TreeSitter.Query> {
		const scm = LangScmMap[this._name];
		return new TreeSitter.Query(this._lang, scm);
	}

	get name(): string {
		return this._name;
	}
}
