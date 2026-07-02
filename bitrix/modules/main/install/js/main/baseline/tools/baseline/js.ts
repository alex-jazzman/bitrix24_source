/**
 * Baseline JavaScript features.
 *
 * Total: 1
 * Years: 2026
 */

import { type BaselineFeature } from '../baseline.config';

/* eslint-disable quote-props */
export const features: Record<string, BaselineFeature> = {

	// ── 2026 (1 features) ──

	/**
	 * Array by copy
	 *
	 * The `toReversed()`, `toSorted()`, `toSpliced()`, and `with()` methods of arrays and typed
	 * arrays return changed copies of arrays. They stand in contrast to methods such as `sort()`
	 * or `reverse()` that change arrays in place.
	 *
	 * @see https://webstatus.dev/features/array-by-copy
	 */
	'array-by-copy': {
		enabled: true,
		widelyAvailableDate: '04.01.2026',
		minVersions: {
			chrome: 110,
			edge: 110,
			firefox: 115,
			safari: 16,
		},
	},
};
