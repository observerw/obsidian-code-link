import { Notice, PluginSettingTab, Setting } from "obsidian";
import CodeLinkPlugin from "src/main";
import { FolderSuggest } from "./suggester/folder";
import { SupportedLangsArray } from "src/lang/data";

export interface CodeLinkPluginSettings {
	relImportDirPath: string;
	enableTagSearch: boolean;
	showPathInEmbed: boolean;
	importWithIgnore: boolean;
}

const DEFAULT_SETTINGS: CodeLinkPluginSettings = {
	relImportDirPath: "projects",
	enableTagSearch: true,
	showPathInEmbed: true,
	importWithIgnore: true,
};

export const loadSettings = async (plugin: CodeLinkPlugin) => {
	const saved_settings = await plugin.loadData();
	return new Proxy(
		{ ...DEFAULT_SETTINGS, ...saved_settings },
		{
			set: (target, prop, value) => {
				if (!target || !(prop in target)) {
					return false;
				}
				Object.assign(target, { [prop]: value });
				plugin.saveData(target);
				return true;
			},
		}
	);
};

export class CodeLinkPluginSettingTab extends PluginSettingTab {
	constructor(private _plugin: CodeLinkPlugin) {
		super(_plugin.app, _plugin);
	}

	private async _downloadBtnSetting(containerEl: HTMLElement) {
		const downloadBtnSetting = new Setting(containerEl).setName(
			"Download necessary components"
		);

		const pkgExists = await this._plugin.pkgExists();
		if (!pkgExists) {
			downloadBtnSetting.setDesc(
				createFragment((el) => {
					const p = el.createEl("p", {
						cls: "code-link-settings-prompt",
						attr: {
							status: "warning",
						},
						text: "⚠️ATTENTION: Please download the necessary components first to use the plugin",
					});

					el.append(p);
				})
			);
		} else {
			const supportedLangs = SupportedLangsArray.join(", ");
			downloadBtnSetting.setDesc(
				createFragment((el) => {
					const p = el.createEl("p", {
						cls: "code-link-settings-prompt",
						attr: {
							status: "success",
						},
						text: `✅You have downloaded the necessary components, current supported languages are: ${supportedLangs}`,
					});

					el.append(p);
				})
			);
		}

		downloadBtnSetting.addButton((btn) => {
			const icon = pkgExists ? "check" : "download";

			btn.setDisabled(pkgExists)
				.setIcon(icon)
				.onClick(async () => {
					new Notice(
						"Code Link: Downloading necessary components..."
					);
					btn.setIcon("loader").setDisabled(true);

					try {
						await Promise.all([
							this._plugin.treeSitterLoader.download(),
							...SupportedLangsArray.map((lang) =>
								this._plugin.langLoader.download(lang)
							),
						]);
					} catch (e: unknown) {
						const message = (e as Error).message;
						new Notice(`Code Link: Download failed: ${message}`);
						btn.setIcon("download-triangle").setDisabled(false);
						return;
					}

					btn.setIcon("check").setDisabled(true);
					new Notice(
						"Code Link: Download complete, you are ready to use the plugin!"
					);

					this.display();
				});
		});
	}

	private async _tagSearchSetting(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName("Enable tag search")
			.setDesc(
				"Enable tag search to reference specific symbols (e.g. functions, classes) in the code files"
			)
			.addToggle((cb) => {
				cb.setValue(this._plugin.settings.enableTagSearch);
				cb.onChange(async (value) => {
					this._plugin.settings.enableTagSearch = value;
					this.display();
				});
			});
	}

	private async _importSetting(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName("Import projects path")
			.setDesc("Directory path to store imported projects")
			.addSearch((cb) => {
				new FolderSuggest(this.app, cb.inputEl);
				cb.setValue(this._plugin.settings.relImportDirPath).onChange(
					(value) => {
						this._plugin.settings.relImportDirPath = value;
					}
				);
			});

		new Setting(containerEl)
			.setName("Import with .gitignore")
			.setDesc(
				"With this option enabled, the plugin will ignore files and directories listed in .gitignore when importing projects"
			)
			.addToggle((cb) => {
				cb.setValue(this._plugin.settings.importWithIgnore);
				cb.onChange((value) => {
					this._plugin.settings.importWithIgnore = value;
				});
			});
	}

	private async _previewSetting(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName("Show path under embed preview")
			.setDesc(
				"With this option enabled, the plugin will display the file path and tags under the code embed preview"
			)
			.addToggle((cb) => {
				cb.setValue(this._plugin.settings.showPathInEmbed);
				cb.onChange((value) => {
					this._plugin.settings.showPathInEmbed = value;
				});
			});
	}

	async display() {
		const { containerEl } = this;

		containerEl.empty();

		await this._tagSearchSetting(containerEl);
		if (this._plugin.settings.enableTagSearch) {
			await this._downloadBtnSetting(containerEl);
		}
		await this._importSetting(containerEl);
		await this._previewSetting(containerEl);
	}
}
