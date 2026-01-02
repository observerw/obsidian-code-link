/**
 * Remove any common leading whitespace from every line in text.
 * Mimics Python's textwrap.dedent.
 */
export function dedent(text: string): string {
	const lines = text.split('\n');
	const indents = lines
		.filter((line) => line.trim().length > 0)
		.map((line) => line.match(/^\s*/)![0]);

	if (indents.length === 0) {
		return lines.map(() => '').join('\n');
	}

	let common = indents[0] ?? '';
	for (let i = 1; i < indents.length; i++) {
		const indent = indents[i] ?? '';
		let j = 0;
		while (j < common.length && j < indent.length && common[j] === indent[j]) {
			j++;
		}
		common = common.substring(0, j);
		if (common === '') break;
	}

	const margin = common;
	return lines
		.map((line) => {
			if (line.trim().length === 0) return '';
			return line.startsWith(margin) ? line.substring(margin.length) : line;
		})
		.join('\n');
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Capitalize a language name, replacing underscores with spaces.
 */
export function capitalizeLang(lang: string): string {
	const specialMap: Record<string, string> = {
		cpp: "C++",
		c_sharp: "C#",
		tsx: "TSX",
		javascript: "JavaScript",
		typescript: "TypeScript",
		json: "JSON",
		html: "HTML",
		css: "CSS",
		scss: "SCSS",
		yaml: "YAML",
		xml: "XML",
		php: "PHP",
		lua: "Lua",
	};

	const special: string | undefined = specialMap[lang.toLowerCase()];
	if (special) {
		return special;
	}

	return lang
		.split("_")
		.map((part) => capitalize(part))
		.join(" ");
}
