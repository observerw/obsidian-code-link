import {
	FileSystemAdapter,
	MarkdownView,
	Notice,
	Plugin,
} from "obsidian";
import {
	CodeLinkPluginSettingTab,
	CodeLinkPluginSettings,
	loadSettings,
} from "./settings";
import { CodeFileParser } from "./lang/parse";
import { LangLoader, TreeSitterLoader } from "./lang/loader";
import { CodeLinkEmbedPreviewPostProcessor } from "./processor/embed";
import { TagTreeSuggest } from "./modal/suggest";
import { FileImporter } from "./import";
import { CodeLinkHoverPreviewPostProcessor } from "./processor/hover";

export default class CodeLinkPlugin extends Plugin {
	settings!: CodeLinkPluginSettings;

	treeSitterLoader!: TreeSitterLoader;
	langLoader!: LangLoader;
	parser!: CodeFileParser;
	importer!: FileImporter;

	async onload() {
		this.settings = await loadSettings(this);

		this.treeSitterLoader = new TreeSitterLoader(this);
		this.langLoader = new LangLoader(this);
		this.parser = new CodeFileParser(this);
		this.importer = new FileImporter(this);

		// Pre-download configured language parsers in the background
		this.langLoader.preDownload(this.settings.preDownloadLangs);

		this.addCommand({
			id: "import-project",
			name: "Import project",
			callback: async () => {
				try {
					const importedPath = await this.importer.import();
					new Notice(
						importedPath
							? `Code Link: Project imported to ${importedPath}`
							: "Code Link: import canceled"
					);
				} catch (e: unknown) {
					new Notice(
						`Code Link: import failed: ${(e as Error).message}`
					);
				}
			},
		});

		this.registerMarkdownPostProcessor(
			new CodeLinkEmbedPreviewPostProcessor(this).process
		);
		this.registerMarkdownPostProcessor(
			new CodeLinkHoverPreviewPostProcessor(this).process
		);

		this.registerEditorExtension(codeLinkLivePreviewExtension(this));

		this.addSettingTab(new CodeLinkPluginSettingTab(this));
		this.registerEditorSuggest(new TagTreeSuggest(this));

		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		view?.previewMode.rerender(true);
	}

	onunload() {}

	get adapter(): FileSystemAdapter {
		const adapter = this.app.vault.adapter;
		if (!(adapter instanceof FileSystemAdapter)) {
			throw new Error("FileSystemAdapter is only available on desktop.");
		}
		return adapter;
	}
}
