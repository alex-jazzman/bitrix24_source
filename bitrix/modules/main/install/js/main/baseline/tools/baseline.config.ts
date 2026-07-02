/**
 * Baseline feature configuration.
 *
 * Features added in new "baseline widely available" vs previous baseline.
 * Only features NOT supported in the previous baseline are listed here.
 * Set enabled to false to exclude a feature from minimum version calculation.
 * This can lower the required browser versions if the feature is a bottleneck.
 *
 * Total features: 23
 * - CSS: 18
 * - JavaScript: 1
 * - Web API: 2
 * - Other: 2
 *
 * Source: web-features (https://github.com/web-platform-dx/web-features)
 * Update: npm run update
 * Compute: npm run compute
 */

export interface BaselineFeature
{
	enabled: boolean;
	widelyAvailableDate: string;
	minVersions: Record<string, number>;
}

import { features as css } from './baseline/css';
import { features as js } from './baseline/js';
import { features as webApi } from './baseline/web-api';
import { features as other } from './baseline/other';

export const features: Record<string, BaselineFeature> = {
	...css,
	...js,
	...webApi,
	...other,
};
