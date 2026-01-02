import LangExtMap from "./lang_ext.json";

import CScm from "inline:./scm/c.scm";
import CppScm from "inline:./scm/cpp.scm";
import GoScm from "inline:./scm/go.scm";
import JavaScriptScm from "inline:./scm/javascript.scm";
import PythonScm from "inline:./scm/python.scm";
import RustScm from "inline:./scm/rust.scm";
import TypeScriptScm from "inline:./scm/typescript.scm";

export const ExtLangMap = Object.fromEntries(
	Object.entries(LangExtMap).flatMap(([lang, exts]) =>
		exts.map((ext) => [ext, lang])
	)
);

export const LangScmMap = {
	c: CScm,
	cpp: CppScm,
	go: GoScm,
	javascript: JavaScriptScm,
	python: PythonScm,
	rust: RustScm,
	typescript: TypeScriptScm,
};
export type SupportedLang = keyof typeof LangScmMap;

export const SupportedLangs = new Set(Object.keys(LangScmMap));
export const SupportedLangsArray = Array.from(SupportedLangs);

export const AvailableWasmLangs = [
	"agda",
	"bash",
	"c_sharp",
	"c",
	"clojure",
	"cpp",
	"css",
	"dart",
	"dtd",
	"elixir",
	"elm",
	"gdscript",
	"gleam",
	"go",
	"haskell",
	"hcl",
	"html",
	"java",
	"javascript",
	"json",
	"kotlin",
	"latex",
	"lua",
	"markdown_inline",
	"markdown",
	"nix",
	"perl",
	"php",
	"properties",
	"python",
	"query",
	"r",
	"ruby",
	"rust",
	"scala",
	"scss",
	"sparql",
	"swift",
	"talon",
	"tsx",
	"typescript",
	"xml",
	"yaml",
	"zig",
];

/**
 * Languages from AvailableWasmLangs that have corresponding SCM query definitions
 * in LangScmMap, and thus support full functionality including tag searching.
 */
export const WasmLangsWithScmSupport = AvailableWasmLangs.filter(
	(lang) => lang in LangScmMap
);

/**
 * Languages from AvailableWasmLangs that currently do not have SCM query
 * definitions in LangScmMap. These languages have parser support only
 * (no tag searching functionality).
 */
export const WasmLangsWithoutScmSupport = AvailableWasmLangs.filter(
	(lang) => !(lang in LangScmMap)
);
