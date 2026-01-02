import { Parser, Language, Query } from "web-tree-sitter";
import { Notice, requestUrl, RequestUrlResponse } from "obsidian";
import CodeLinkPlugin from "src/main";
import { AvailableWasmLangs, LangScmMap } from "./data";
import pkg from "../../package.json";
import { withRetry } from "../utils";

const WEB_TREE_SITTER_VERSION = pkg.dependencies["web-tree-sitter"].replace("^", "").replace("~", "");

/**
 * Version of @cursorless/tree-sitter-wasms package used for downloading language parsers.
 * This is separate from WEB_TREE_SITTER_VERSION as they are different packages with
 * independent versioning schemes.
 */
const TREE_SITTER_WASMS_VERSION = "0.7.0";

export class TreeSitterLoader {
	private _initialized = false;

	constructor(private _plugin: CodeLinkPlugin) {}

	async init() {
		if (this._initialized) return;

		try {
			const hasVersion =
				typeof WEB_TREE_SITTER_VERSION === "string" &&
				WEB_TREE_SITTER_VERSION.trim().length > 0;

			await Parser.init({
				locateFile: (scriptName: string) => {
					return `https://cdn.jsdelivr.net/npm/web-tree-sitter@${hasVersion ? WEB_TREE_SITTER_VERSION : "latest"}/${scriptName}`;
				},
			});
			this._initialized = true;
		} catch (err) {
			console.error("Failed to initialize web-tree-sitter from CDN:", err);
			new Notice(
				"CodeLink: Failed to initialize the code parsing engine. Some features may not work."
			);
			throw err;
		}
	}

	async load(): Promise<typeof Parser> {
		await this.init();
		return Parser;
	}
}

export class LangLoader {
	private _cache: Map<string, Language> = new Map();
	private _loading: Map<string, AbortController> = new Map();

	constructor(private _plugin: CodeLinkPlugin) {}

	async load(langName: string): Promise<Lang> {
		if (!AvailableWasmLangs.includes(langName)) {
			throw new Error(`Language ${langName} is not available.`);
		}

		await this._plugin.treeSitterLoader.init();

		if (this._cache.has(langName)) {
			return new Lang(langName, this._cache.get(langName)!);
		}

		if (this._loading.has(langName)) {
			throw new Error(`Language ${langName} is already loading.`);
		}

		const controller = new AbortController();
		this._loading.set(langName, controller);

		let loadSuccessful = false;

		try {
			const url = `https://cdn.jsdelivr.net/npm/@cursorless/tree-sitter-wasms@${TREE_SITTER_WASMS_VERSION}/out/tree-sitter-${langName}.wasm`;

			const response = (await withRetry(async () => {
				return await requestUrl(url);
			}, 3, 1000, controller.signal)) as RequestUrlResponse;

			if (controller.signal.aborted) {
				throw new Error("aborted");
			}

			const langWasm = response.arrayBuffer;
			const lang = await Language.load(new Uint8Array(langWasm));
			this._cache.set(langName, lang);

			loadSuccessful = true;
			return new Lang(langName, lang);
		} finally {
			this._loading.delete(langName);
			if (!loadSuccessful && controller) {
				controller.abort();
			}
		}
	}

	unload(langName: string) {
		this.abort(langName);
		this._cache.delete(langName);
	}

	abort(langName: string) {
		const controller = this._loading.get(langName);
		if (controller) {
			controller.abort();
			this._loading.delete(langName);
		}
	}

	isLoaded(langName: string): boolean {
		return this._cache.has(langName);
	}

	isLoading(langName: string): boolean {
		return this._loading.has(langName);
	}

	async preDownload(langs: string[]) {
		const total = langs.length;
		let count = 0;

		const notice = new Notice(`CodeLink: Pre-downloading parsers (0/${total})...`, 0);

		for (const lang of langs) {
			try {
				await this.load(lang);
				count++;
				notice.setMessage(`CodeLink: Pre-downloading parsers (${count}/${total})...`);
			} catch (err) {
				console.error(`Failed to pre-download ${lang}:`, err);
			}
		}

		notice.hide();
		if (count > 0) {
			new Notice(`CodeLink: Finished pre-downloading ${count} parsers.`);
		}
	}
}

export class Lang {
	constructor(
		private _name: string,
		private _lang: Language
	) {}

	async parser(): Promise<Parser> {
		const parser = new Parser();
		parser.setLanguage(this._lang);
		return parser;
	}

	async tagsQuery(): Promise<Query | null> {
		const scm = (LangScmMap as Record<string, string>)[this._name];
		if (!scm) return null;
		return new Query(this._lang, scm);
	}

	get name(): string {
		return this._name;
	}
}
