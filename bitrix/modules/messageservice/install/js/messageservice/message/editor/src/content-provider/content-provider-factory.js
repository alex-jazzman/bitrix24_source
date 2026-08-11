import { ContentProvider } from './content-provider';

export class ContentProviderFactory
{
	#resolvers = new Map();
	#instances = new Map();

	/**
	 * Register a resolver for a provider ID.
	 * @param {string} id
	 * @param {function(Object): ContentProvider} resolver
	 */
	registerResolver(id: string, resolver: (serverData: Object) => ContentProvider): void
	{
		this.#resolvers.set(id, resolver);
	}

	removeResolver(id: string): void
	{
		this.#resolvers.delete(id);
	}

	/**
	 * Diff-based reconciliation: creates new, keeps existing, destroys removed.
	 * @param {Object} serverProvidersMap - { [id]: { id, isLocked, customData } }
	 */
	reconcile(serverProvidersMap: Object): void
	{
		const newIds = new Set(Object.keys(serverProvidersMap));
		const oldIds = new Set(this.#instances.keys());

		// Remove providers that are no longer in server data
		for (const id of oldIds)
		{
			if (!newIds.has(id))
			{
				this.#instances.get(id)?.destroy?.();
				this.#instances.delete(id);
			}
		}

		for (const id of newIds)
		{
			if (oldIds.has(id))
			{
				// Update server-controlled data on existing providers
				this.#instances.get(id).updateServerData(serverProvidersMap[id]);
			}
			else
			{
				// Create new providers
				const resolver = this.#resolvers.get(id);
				if (resolver)
				{
					this.#instances.set(id, resolver(serverProvidersMap[id]));
				}
			}
		}
	}

	getProviders(): ContentProvider[]
	{
		return [...this.#instances.values()];
	}

	getProvider(id: string): ?ContentProvider
	{
		return this.#instances.get(id) ?? null;
	}

	destroy(): void
	{
		for (const provider of this.#instances.values())
		{
			provider.destroy?.();
		}
		this.#instances.clear();
		this.#resolvers.clear();
	}
}
