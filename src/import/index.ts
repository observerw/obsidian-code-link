import * as fs from "fs/promises";
import { globby } from "globby";
import { normalizePath, Platform } from "obsidian";
import path from "path";
import CodeLinkPlugin from "src/main";

export class FileImporter {
	constructor(private _plugin: CodeLinkPlugin) {}

	private get _relImportDirPath() {
		return this._plugin.settings.relImportDirPath;
	}

	private get _importDirPath() {
		return this._plugin.adapter.getFullPath(
			this._plugin.settings.relImportDirPath
		);
	}

	async import(): Promise<string | null> {
		if (Platform.isMobile) {
			throw new Error("Project import is not supported on mobile");
		}

		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { dialog } = require("@electron/remote");

		const {
			filePaths: [sourceDirPath],
		} = await dialog.showOpenDialog({
			properties: ["openDirectory"],
		});

		if (!sourceDirPath) {
			return null;
		}

		const dirName = path.basename(sourceDirPath);
		const targetDirPath = path.join(this._importDirPath, dirName);
		const relTargetDirPath = path.join(this._relImportDirPath, dirName);

		if (await this._plugin.adapter.exists(relTargetDirPath)) {
			throw new Error(`project ${dirName} already exists`);
		}

		await this._plugin.adapter.mkdir(normalizePath(relTargetDirPath));

		const sourceFilePaths = await globby(["**/*", "!.*/**/*"], {
			cwd: sourceDirPath,
			dot: true,
			onlyFiles: true,
			absolute: true,
			gitignore: this._plugin.settings.importWithIgnore,
		});
		await Promise.all(
			sourceFilePaths.map(async (sourceFilePath) => {
				const fileName = path.basename(sourceFilePath);
				const sourceFileDirPath = path.dirname(sourceFilePath);

				const relSourceFileDirPath = path.relative(
					sourceDirPath,
					sourceFileDirPath
				);
				const targetFileDirPath = path.join(
					targetDirPath,
					relSourceFileDirPath
				);
				const targetFilePath = path.join(targetFileDirPath, fileName);

				await fs.mkdir(targetFileDirPath, {
					recursive: true,
				});
				await fs.link(sourceFilePath, targetFilePath);
			})
		);

		return relTargetDirPath;
	}
}
