import path from "path";
import { ExtLangMap } from "./data";

export const getLang = (filePath: string): string | null => {
	const ext = path.extname(filePath);
	return ExtLangMap[ext] ?? null;
};
