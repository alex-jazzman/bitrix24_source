/* eslint-disable */
/**
 * Checks whether the current browser meets the baseline requirements.
 *
 * Minimum browser versions are computed from the transition plan (baseline.plan.ts)
 * and injected at build time via the Rollup plugin.
 *
 * If the browser is below the baseline, a sticky banner is shown at the top of the page.
 * The user can dismiss it; the dismiss state is stored in localStorage
 * and auto-invalidates when the baseline is updated.
 */
type BaselineStatus = 'supported' | 'unsupported';

interface BrowserInfo {
	name: string;
	version: number;
}

interface CheckResult {
	status: BaselineStatus;
	browser: BrowserInfo | null;
}

declare namespace BX {
	class Baseline {
		static check(): CheckResult;
		static isSupported(): boolean;
		static detectBrowser(): BrowserInfo | null;
	}
}
