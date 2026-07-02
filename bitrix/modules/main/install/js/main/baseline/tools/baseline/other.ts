/**
 * Baseline Other features.
 *
 * Total: 2
 * Years: 2026
 */

import { type BaselineFeature } from '../baseline.config';

/* eslint-disable quote-props */
export const features: Record<string, BaselineFeature> = {

	// ── 2026 (2 features) ──

	/**
	 * dirname
	 *
	 * The `dirname` attribute of `<textarea>` and `<input>` HTML elements includes the field's
	 * writing direction as form data on submission.
	 *
	 * @see https://webstatus.dev/features/dirname
	 */
	'dirname': {
		enabled: true,
		widelyAvailableDate: '01.02.2026',
		minVersions: {
			chrome: 17,
			edge: 79,
			firefox: 116,
			safari: 6,
		},
	},

	/**
	 * <link rel="modulepreload">
	 *
	 * The `rel="modulepreload"` attribute for the `<link>` HTML element indicates that a module
	 * script should be fetched, parsed, and compiled preemptively, and stored for later
	 * execution.
	 *
	 * @see https://webstatus.dev/features/modulepreload
	 */
	'modulepreload': {
		enabled: true,
		widelyAvailableDate: '18.03.2026',
		minVersions: {
			chrome: 66,
			edge: 79,
			firefox: 115,
			safari: 17,
		},
	},
};
