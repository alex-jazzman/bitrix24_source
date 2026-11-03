import type { CallEngine, EngineContext } from './call-engine';
import type { CallCapabilities } from './call-capabilities';
import type { RecentCallsSource } from './recent-calls-source';

// A provider set is registered by exactly one engine extension (legacy or core).
// Every provider is a factory: an engine bundle registers while it is being evaluated, when the
// namespace it builds upon (call.core) may still be empty, so nothing is dereferenced until used.
export type EngineProviders = {
	engine: (context: EngineContext) => CallEngine,
	capabilities: () => CallCapabilities,
	recentSource: () => RecentCallsSource,
};

let providers: EngineProviders | null = null;

function getProviders(): EngineProviders
{
	if (providers === null)
	{
		throw new Error(
			'engineRegistry: no engine provider set registered. Check config.php rel / feature flag wiring.',
		);
	}

	return providers;
}

// Resolves on first use and keeps the result: consumers hold on to the members of what they get
// (RecentCallsSync unsubscribes with the very function it subscribed with).
function memoize<T extends Object>(factory: () => T): () => T
{
	let value: T | null = null;

	return (): T => {
		if (value === null)
		{
			value = factory();
		}

		return value;
	};
}

export const engineRegistry = {
	register(engineProviders: EngineProviders): void
	{
		if (providers !== null)
		{
			throw new Error(
				'engineRegistry: an engine provider set is already registered. Exactly one engine extension must be loaded.',
			);
		}

		// The memo lives inside the provider set, so reset() drops the resolved values with it.
		providers = {
			engine: engineProviders.engine,
			capabilities: memoize(engineProviders.capabilities),
			recentSource: memoize(engineProviders.recentSource),
		};
	},

	create(context: EngineContext): CallEngine
	{
		return getProviders().engine(context);
	},

	getCapabilities(): CallCapabilities
	{
		return getProviders().capabilities();
	},

	getRecentCallsSource(): RecentCallsSource
	{
		return getProviders().recentSource();
	},

	reset(): void
	{
		providers = null;
	},
};
