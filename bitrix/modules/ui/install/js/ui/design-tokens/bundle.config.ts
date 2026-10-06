export default {
	// CSS is produced by a custom StyleDictionary pipeline (from JSON sources), not
	// by chef — `protected` keeps this extension out of bulk `chef build` runs.
	// `input` points at the generated stylesheet only so `chef aliases` resolves
	// the side-effect import (`import 'ui.design-tokens'`) to it; the sibling
	// `dist/ui.design-tokens.d.css.ts` (allowArbitraryExtensions) prevents TS2882.
	protected: true,
	input: './dist/ui.design-tokens.css',
};
