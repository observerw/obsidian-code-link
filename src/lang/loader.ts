import fs from "fs/promises";
import { requestUrl } from "obsidian";
import os from "os";
import path from "path";
import CodeLinkPlugin from "src/main";
import type { Parser, Query, TreeSitter } from "src/tree-sitter-patch";
import { loadTreeSitter } from "src/tree-sitter-patch";
import * as tar from "tar";
import { LangScmMap, SupportedLang, SupportedLangs } from "./data";
import { LangPackage, NpmPackageMetadata } from "./types";

type Paths = {
	relPath: string;
	absPath: string;
};

abstract class Loader<T> {
	constructor(protected _plugin: CodeLinkPlugin) {}

	protected get _relBasePath(): string {
		const configDir = this._plugin.app.vault.configDir;
		const pluginId = this._plugin.manifest.id;
		const relPath = `${configDir}/plugins/${pluginId}`;

		return relPath;
	}

	protected get _basePath(): string {
		return this._plugin.adapter.getFullPath(this._relBasePath);
	}

	protected async _tarballUrl(pkg: string) {
		const { json } = await requestUrl(`https://registry.npmjs.org/${pkg}`);
		const {
			versions,
			"dist-tags": { latest },
		} = json as NpmPackageMetadata;
		return versions[latest]!.dist.tarball;
	}

	protected _pkgPaths(pkg: string): Paths {
		return {
			relPath: path.join(this._relBasePath, pkg),
			absPath: path.join(this._basePath, pkg),
		};
	}

	protected async _pkgExists(pkg: string): Promise<boolean> {
		const { relPath } = this._pkgPaths(pkg);
		return await this._plugin.adapter.exists(relPath);
	}

	protected async _downloadPackage(pkg: string): Promise<void> {
		const tarballUrl = await this._tarballUrl(pkg);

		const resp = await requestUrl(tarballUrl);

		const tmpPath = await fs.mkdtemp(
			path.join(os.tmpdir(), "tree-sitter-")
		);
		await fs.writeFile(
			`${tmpPath}/${pkg}.tgz`,
			new Uint8Array(resp.arrayBuffer)
		);
		await tar.extract({
			file: `${tmpPath}/${pkg}.tgz`,
			cwd: tmpPath,
		});
		await fs.cp(`${tmpPath}/package`, `${this._basePath}/${pkg}`, {
			recursive: true,
		});
		await fs.rmdir(tmpPath, { recursive: true });
	}

	abstract exists(...args: unknown[]): Promise<boolean>;

	abstract download(...args: unknown[]): Promise<void>;

	abstract load(...args: unknown[]): Promise<T | null>;
}

export class TreeSitterLoader extends Loader<TreeSitter> {
	async exists(): Promise<boolean> {
		return await this._pkgExists("tree-sitter");
	}

	async download(): Promise<void> {
		const exists = await this.exists();
		if (exists) {
			return;
		}

		await this._downloadPackage("tree-sitter");
	}

	async load(): Promise<TreeSitter> {
		const exist = await this.exists();
		if (!exist) {
			throw new Error(
				"Tree-sitter is not downloaded, please download it first"
			);
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let treeSitter = (document as any).treeSitter;

		if (!treeSitter) {
			const { absPath } = this._pkgPaths("tree-sitter");
			treeSitter = loadTreeSitter(absPath);
			// FIXME save tree-sitter instance to document, since reload node-gyp module will cause some issues
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(document as any).treeSitter = treeSitter;
		}

		return treeSitter;
	}
}

const _pkg = (langName: string): string => `tree-sitter-${langName}`;

export class LangLoader extends Loader<Lang> {
	async exists(langName: string): Promise<boolean> {
		return await this._pkgExists(_pkg(langName));
	}

	async download(langName: string): Promise<void> {
		const exists = await this._pkgExists(_pkg(langName));
		if (exists) {
			return;
		}

		await this._downloadPackage(_pkg(langName));
	}

	async load(langName: string): Promise<Lang> {
		if (!SupportedLangs.has(langName)) {
			throw new Error(`Language ${langName} is not supported.`);
		}

		const exists = await this.exists(langName);
		if (!exists) {
			throw new Error(
				`Language ${langName} is not available, please check the available languages in the settings`
			);
		}

		const paths = this._pkgPaths(_pkg(langName));
		return new Lang(this._plugin, langName as SupportedLang, paths);
	}
}

export class Lang {
	constructor(
		private _plugin: CodeLinkPlugin,
		private _name: SupportedLang,
		private _paths: Paths
	) {}

	private async _package(): Promise<LangPackage> {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return require("node-gyp-build")(this._paths.absPath);
	}

	private async _tagsScm(): Promise<string> {
		return LangScmMap[this._name];
	}

	async parser(): Promise<Parser> {
		const { Parser } = await this._plugin.treeSitterLoader.load();
		const parser = new Parser();
		const lang = await this._package();
		parser.setLanguage(lang);
		return parser;
	}

	async tagsQuery(): Promise<Query> {
		const { Query } = await this._plugin.treeSitterLoader.load();
		const lang = await this._package();
		const scm = await this._tagsScm();
		return new Query(lang, scm);
	}

	get name(): string {
		return this._name;
	}
}
