import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		rules: {
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": ["error", { "args": "none" }],
			"@typescript-eslint/ban-ts-comment": "off",
			"no-prototype-builtins": "off",
			"@typescript-eslint/no-empty-function": "off",
		},
	},
	{
		ignores: [
			"main.js",
			"esbuild.config.mjs",
			"version-bump.mjs",
			"pnpm-lock.yaml",
			"node_modules/",
			".github/",
			"src/tree-sitter-patch/"
		],
	}
);
