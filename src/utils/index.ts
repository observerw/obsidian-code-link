export const memorize = (
	_target: unknown,
	_propertyKey: string,
	descriptor: PropertyDescriptor
): PropertyDescriptor => {
	const original = descriptor.get;
	const cache = new Map();
	descriptor.get = function () {
		if (!cache.has(this)) {
			cache.set(this, original?.call(this));
		}
		return cache.get(this);
	};
	return descriptor;
};

export async function withRetry<T>(
	fn: () => Promise<T>,
	retries = 3,
	delay = 1000,
	signal?: AbortSignal
): Promise<T> {
	try {
		if (signal?.aborted) {
			throw new Error("aborted");
		}
		return await fn();
	} catch (e) {
		if (signal?.aborted) {
			throw new Error("aborted");
		}
		if (retries <= 0) throw e;
		await new Promise((resolve) => setTimeout(resolve, delay));
		return withRetry(fn, retries - 1, delay * 2, signal);
	}
}

export function capitalizeLang(lang: string): string {
	const specialMap: Record<string, string> = {
		cpp: "C++",
		c_sharp: "C#",
		javascript: "JavaScript",
		typescript: "TypeScript",
		tsx: "TSX",
		html: "HTML",
		css: "CSS",
		scss: "SCSS",
		json: "JSON",
		xml: "XML",
		yaml: "YAML",
		php: "PHP",
		gdscript: "GDScript",
		hcl: "HCL",
		dtd: "DTD",
		r: "R",
	};

	if (specialMap[lang]) return specialMap[lang];

	return lang
		.split(/[_-]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}
