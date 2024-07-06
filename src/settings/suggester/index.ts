import { AbstractInputSuggest, TAbstractFile, TFolder } from "obsidian";

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
	protected getSuggestions(query: string): TFolder[] | Promise<TFolder[]> {
		const abstractFiles = this.app.vault.getAllLoadedFiles();
		const folders: TFolder[] = [];
		const lowerCaseInputStr = query.toLowerCase();

		abstractFiles.forEach((folder: TAbstractFile) => {
			if (
				folder instanceof TFolder &&
				folder.path.toLowerCase().contains(lowerCaseInputStr)
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
