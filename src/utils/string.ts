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
