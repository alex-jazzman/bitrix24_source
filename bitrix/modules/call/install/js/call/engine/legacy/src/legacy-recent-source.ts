import type { CallInstantiator, CallLifecycleEventNames, RecentCallsSource } from 'call.engine.registry';

type CoreUtilInstantiate = {
	isLegacyCall(provider: string | undefined, scheme: unknown): boolean,
};

type CoreEngine = {
	instantiateCall(call: Object | undefined, callToken: unknown, logToken: unknown, userData: Object | undefined): Object,
	// Calls finished on this tab, keyed by UUID.
	finishedCalls: Set<string>,
};

type CoreEngineLegacy = {
	instantiateCall(
		call: Object | undefined,
		users: unknown,
		logToken: unknown,
		connectionData: unknown,
		userData: unknown,
	): Object,
	// Calls finished on this tab, keyed by numeric call id.
	finishedCalls: Set<number>,
};

type CoreEvent = {
	onJoin: string,
	onLeave: string,
	onDestroy: string,
};

type LegacyRecentDeps = {
	util: CoreUtilInstantiate,
	engine: CoreEngine,
	engineLegacy: CoreEngineLegacy,
	event: CoreEvent,
};

// Legacy RecentCallsSource backed by call.core.
// The listener functions are stateless (no `this`), so they may be passed detached.
export function createLegacyRecentCallsSource(deps: LegacyRecentDeps): RecentCallsSource
{
	const instantiator: CallInstantiator = {
		isLegacyCall: (provider, scheme) => deps.util.isLegacyCall(provider, scheme),
		isFinished: (call) => {
			if (deps.util.isLegacyCall(call.PROVIDER, call.SCHEME))
			{
				return deps.engineLegacy.finishedCalls.has(Number.parseInt(String(call.ID), 10));
			}

			return call.UUID !== undefined && deps.engine.finishedCalls.has(call.UUID);
		},
		instantiate: (call, callToken, logToken, userData) => deps.engine.instantiateCall(call, callToken, logToken, userData),
		instantiateLegacy: (call, users, logToken, connectionData, userData) =>
			deps.engineLegacy.instantiateCall(call, users, logToken, connectionData, userData),
	};

	const callEvent: CallLifecycleEventNames = {
		onJoin: deps.event.onJoin,
		onLeave: deps.event.onLeave,
		onDestroy: deps.event.onDestroy,
	};

	return {
		callEvent,
		instantiator,
		addCallListener: (call: Object, event: string, handler: Function): void => {
			// @ts-ignore [call-ts] wait call.core to ts
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
			call.addEventListener(event, handler);
		},
		removeCallListener: (call: Object, event: string, handler: Function): void => {
			// @ts-ignore [call-ts] wait call.core to ts
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
			call.removeEventListener(event, handler);
		},
	};
}
