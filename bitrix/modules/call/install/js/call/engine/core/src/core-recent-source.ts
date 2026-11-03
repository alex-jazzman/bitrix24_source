import type { RecentCallsSource } from 'call.engine.registry';

// Stub: no-op recent-calls source. Recent sync is not wired to the new call core
// yet, so listeners do nothing and instantiation returns empty objects.
export const coreRecentCallsSource: RecentCallsSource = {
	callEvent: { onJoin: 'onJoin', onLeave: 'onLeave', onDestroy: 'onDestroy' },
	instantiator: {
		isLegacyCall: () => false,
		// Nothing is instantiated here, so nothing can be a resurrected finished call.
		isFinished: () => false,
		instantiate: () => ({}),
		instantiateLegacy: () => ({}),
	},
	addCallListener: () => {},
	removeCallListener: () => {},
};
