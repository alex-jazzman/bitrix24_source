/**
 * Baseline Web API features.
 *
 * Total: 2
 * Years: 2026
 */

import { type BaselineFeature } from '../baseline.config';

/* eslint-disable quote-props */
export const features: Record<string, BaselineFeature> = {

	// ── 2026 (2 features) ──

	/**
	 * Storage manager
	 *
	 * The `navigator.storage` API provides information about the availability and persistence of
	 * the data that a site stores on the device, by using APIs such as the Cache API or the
	 * IndexedDB API.
	 *
	 * @see https://webstatus.dev/features/storage-manager
	 */
	'storage-manager': {
		enabled: true,
		widelyAvailableDate: '18.03.2026',
		minVersions: {
			chrome: 61,
			edge: 79,
			firefox: 57,
			safari: 17,
		},
	},

	/**
	 * Device orientation events
	 *
	 * The `DeviceMotion` and `DeviceOrientation` events report the movement and orientation of
	 * the browser's device in physical space. Note that coordinates can differ noticeably between
	 * platforms and devices.
	 *
	 * @see https://webstatus.dev/features/device-orientation-events
	 */
	'device-orientation-events': {
		enabled: true,
		widelyAvailableDate: '18.03.2026',
		minVersions: {
			chrome: 31,
			edge: 12,
			firefox: 6,
			safari: 17,
		},
	},
};
