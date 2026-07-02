import { ajax as Ajax, Type } from 'main.core';
import { MemoryCache } from 'main.core.cache';

import { MiniCardItem } from './mini-card-item';

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
			const item = this.#deepFreeze(new MiniCardItem(response.data));
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

	#deepFreeze(target: { [key: string]: any })
	{
		if (Type.isObject(target))
		{
			Object.values(target).forEach((value) => {
				this.#deepFreeze(value);
			});

			return Object.freeze(target);
		}

		return target;
	}
}
