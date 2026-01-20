import { MiniCardItem } from './mini-card-item';
import { ajax as Ajax } from 'main.core';
import { MemoryCache } from 'main.core.cache';

export type MiniCardResolverOptions = {
	entityTypeId: number,
	entityId: number,
};

export class MiniCardResolver
{
	static #cache: MemoryCache = new MemoryCache();

	#cacheId: string;

	#entityTypeId: number;
	#entityId: number;

	constructor(options: MiniCardResolverOptions)
	{
		this.#entityTypeId = options.entityTypeId;
		this.#entityId = options.entityId;

		this.#cacheId = `${this.#entityTypeId}_${this.#entityId}`;
	}

	async loadMiniCard(): Promise<?MiniCardItem>
	{
		const config = {
			data: {
				entityTypeId: this.#entityTypeId,
				entityId: this.#entityId,
			},
		};

		const response = await Ajax.runAction('crm.item.minicard.get', config);
		if (response?.data)
		{
			const item = new MiniCardItem(response.data);
			MiniCardResolver.#cache.set(this.#cacheId, item);

			return item;
		}

		return null;
	}

	getMiniCard(): MiniCardItem
	{
		return MiniCardResolver.#cache.get(this.#cacheId);
	}

	isLoaded(): boolean
	{
		return MiniCardResolver.#cache.has(this.#cacheId);
	}
}
