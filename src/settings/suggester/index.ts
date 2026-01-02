import { AbstractInputSuggest, App, TAbstractFile, TFolder } from "obsidian";
import { AvailableWasmLangs } from "src/lang/data";
import { capitalizeLang } from "src/utils";

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
	protected getSuggestions(query: string): TFolder[] | Promise<TFolder[]> {
		const abstractFiles = this.app.vault.getAllLoadedFiles();
		const folders: TFolder[] = [];
		const lowerCaseInputStr = query.toLowerCase();

		abstractFiles.forEach((folder: TAbstractFile) => {
			if (
				folder instanceof TFolder &&
				folder.path.toLowerCase().includes(lowerCaseInputStr)
			) {
				folders.push(folder);
			}
		});

		return folders;
	}
	renderSuggestion(value: TFolder, el: HTMLElement): void {
		el.setText(value.path);
	}
	selectSuggestion(value: TFolder, evt: MouseEvent | KeyboardEvent): void {
		this.setValue(value.path);
		this.close();
	}
}

export class LangSuggest extends AbstractInputSuggest<string> {
	constructor(app: App, inputEl: HTMLInputElement, private _onSelect: (lang: string) => void) {
		super(app, inputEl);
	}

	protected getSuggestions(query: string): string[] {
		const lowerCaseInputStr = query.toLowerCase();
		return AvailableWasmLangs.filter((lang) =>
			lang.toLowerCase().includes(lowerCaseInputStr) || 
			capitalizeLang(lang).toLowerCase().includes(lowerCaseInputStr)
		);
	}

	renderSuggestion(value: string, el: HTMLElement): void {
		el.setText(capitalizeLang(value));
	}

	selectSuggestion(value: string, evt: MouseEvent | KeyboardEvent): void {
		this._onSelect(value);
		this.setValue("");
		this.close();
	}
}
