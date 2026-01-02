import { PluginSettingTab, Setting, Notice } from "obsidian";
import CodeLinkPlugin from "src/main";
import { FolderSuggest, LangSuggest } from "./suggester";
import { SupportedLangsArray } from "src/lang/data";
import { capitalizeLang } from "src/utils";

export interface CodeLinkPluginSettings {
	relImportDirPath: string;
	enableTagSearch: boolean;
	showPathInEmbed: boolean;
	importWithIgnore: boolean;
	preDownloadLangs: string[];
}

const DEFAULT_SETTINGS: CodeLinkPluginSettings = {
	relImportDirPath: "projects",
	enableTagSearch: true,
	showPathInEmbed: true,
	importWithIgnore: true,
	preDownloadLangs: [...SupportedLangsArray],
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

export const saveSettings = async (plugin: CodeLinkPlugin) => {
	await plugin.saveData(plugin.settings);
};

export class CodeLinkPluginSettingTab extends PluginSettingTab {
	constructor(private _plugin: CodeLinkPlugin) {
		super(_plugin.app, _plugin);
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

	private async _downloadSetting(containerEl: HTMLElement) {
		new Setting(containerEl).setHeading().setName("Parsers download");

		new Setting(containerEl)
			.setName("Add parser")
			.setDesc("Search and add a new language parser")
			.addSearch((cb) => {
				cb.setPlaceholder("Search language...");
				new LangSuggest(this.app, cb.inputEl, async (lang) => {
					if (this._plugin.settings.preDownloadLangs.includes(lang)) {
						new Notice(`Parser for ${lang} is already added`);
						return;
					}

					try {
						await this._plugin.langLoader.load(lang);
						this._plugin.settings.preDownloadLangs = [
							...this._plugin.settings.preDownloadLangs,
							lang,
						];
						this.display();
					} catch (e) {
						const message = e instanceof Error ? e.message : String(e);
						if (message.includes("aborted")) return;
						new Notice(`Failed to download parser for ${lang}: ${message}`);
					}
				});
			});

		const langsContainer = containerEl.createDiv("codelink-langs-container");
		
		this._plugin.settings.preDownloadLangs.forEach((lang) => {
			const isLoading = this._plugin.langLoader.isLoading(lang);
			const s = new Setting(langsContainer)
				.setName(capitalizeLang(lang))
				.addButton((btn) => {
					btn.setIcon("trash")
						.setTooltip("Remove parser")
						.onClick(async () => {
							this._plugin.langLoader.unload(lang);
							this._plugin.settings.preDownloadLangs = this._plugin.settings.preDownloadLangs.filter(l => l !== lang);
							this.display();
						});
				});
			
			if (isLoading) {
				s.setDesc("Downloading...");
				s.controlEl.createEl("div", { cls: "codelink-loading-spinner" });
			}
		});
	}

	async display() {
		const { containerEl } = this;

		containerEl.empty();

		await this._tagSearchSetting(containerEl);
		await this._importSetting(containerEl);
		await this._previewSetting(containerEl);
		await this._downloadSetting(containerEl);
	}
}
