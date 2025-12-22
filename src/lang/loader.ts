import * as TreeSitter from "web-tree-sitter";
import { Notice, normalizePath, requestUrl } from "obsidian";
import CodeLinkPlugin from "src/main";
import { LangScmMap, SupportedLang, SupportedLangs } from "./data";
import pkg from "../../package.json";
import { withRetry } from "../utils";

const WEB_TREE_SITTER_VERSION = pkg.dependencies["web-tree-sitter"].replace("^", "").replace("~", "");

export class TreeSitterLoader {
	private _initialized = false;

	constructor(private _plugin: CodeLinkPlugin) {}

	private get _langsDir(): string {
		const configDir = this._plugin.app.vault.configDir;
		const pluginId = this._plugin.manifest.id;
		return normalizePath(`${configDir}/plugins/${pluginId}/langs`);
	}

	private get _wasmPath(): string {
		return normalizePath(`${this._langsDir}/tree-sitter.wasm`);
	}

	async exists(): Promise<boolean> {
		return await this._plugin.app.vault.adapter.exists(this._wasmPath);
	}

	async download(): Promise<void> {
		const hasVersion =
			typeof WEB_TREE_SITTER_VERSION === "string" &&
			WEB_TREE_SITTER_VERSION.trim().length > 0;
		
		if (!hasVersion) return;

		const url = `https://cdn.jsdelivr.net/npm/web-tree-sitter@${WEB_TREE_SITTER_VERSION}/web-tree-sitter.wasm`;
		const response = await withRetry(() => requestUrl(url));
		const wasm = response.arrayBuffer;

		if (!(await this._plugin.app.vault.adapter.exists(this._langsDir))) {
			await this._plugin.app.vault.adapter.mkdir(this._langsDir);
		}
		await this._plugin.app.vault.adapter.writeBinary(this._wasmPath, wasm);
	}

	async init() {
		if (this._initialized) return;

		try {
			if (await this.exists()) {
				const wasmUrl = this._plugin.app.vault.adapter.getResourcePath(this._wasmPath);
				await TreeSitter.Parser.init({
					locateFile: (scriptName: string) => {
						if (scriptName === "tree-sitter.wasm") {
							return wasmUrl;
						}
						return scriptName;
					},
				});
				this._initialized = true;
				return;
			}

			// Fallback to CDN if not cached
			const hasVersion =
				typeof WEB_TREE_SITTER_VERSION === "string" &&
				WEB_TREE_SITTER_VERSION.trim().length > 0;

			if (hasVersion) {
				await TreeSitter.Parser.init({
					locateFile: (scriptName: string) => {
						if (scriptName === "tree-sitter.wasm") {
							// Use a fixed version that matches the installed package
							return `https://cdn.jsdelivr.net/npm/web-tree-sitter@${WEB_TREE_SITTER_VERSION}/web-tree-sitter.wasm`;
						}
						return scriptName;
					},
				});
			} else {
				// If we don't have a usable version, fall back to default initialization
				await TreeSitter.Parser.init();
			}
			this._initialized = true;
		} catch (err) {
			console.error("Failed to initialize web-tree-sitter from CDN:", err);
			new Notice(
				"CodeLink: Unable to load web-tree-sitter from CDN. Falling back to default initialization."
			);

			try {
				// Fallback: let web-tree-sitter resolve the WASM using its default behavior
				await TreeSitter.Parser.init();
				this._initialized = true;
			} catch (fallbackErr) {
				console.error("Failed to initialize web-tree-sitter (fallback):", fallbackErr);
				new Notice(
					"CodeLink: Failed to initialize the code parsing engine. Some features may not work."
				);
				throw fallbackErr;
			}
		}
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
		return normalizePath(`${configDir}/plugins/${pluginId}/langs`);
	}

	async exists(langName: string): Promise<boolean> {
		const relPath = normalizePath(`${this._langsDir}/tree-sitter-${langName}.wasm`);
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

		const relPath = normalizePath(`${this._langsDir}/tree-sitter-${langName}.wasm`);
		
		let langWasm: ArrayBuffer;
		if (await this._plugin.app.vault.adapter.exists(relPath)) {
			langWasm = await this._plugin.app.vault.adapter.readBinary(relPath);
		} else {
			const url = `https://cdn.jsdelivr.net/npm/tree-sitter-wasm-prebuilt@${WEB_TREE_SITTER_VERSION}/wasm/tree-sitter-${langName}.wasm`;
			const response = await withRetry(() => requestUrl(url));
			langWasm = response.arrayBuffer;
			
			if (!this._failedSaves.has(langName)) {
				try {
					await withRetry(async () => {
						if (!await this._plugin.app.vault.adapter.exists(this._langsDir)) {
							await this._plugin.app.vault.adapter.mkdir(this._langsDir);
						}
						await this._plugin.app.vault.adapter.writeBinary(relPath, langWasm);
					});
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
