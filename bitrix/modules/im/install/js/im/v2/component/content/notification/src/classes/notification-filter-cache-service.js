import { Cache } from 'main.core';
import { type TagSelector } from 'ui.entity-selector';

const AUTHOR_SELECTOR_KEY = 'notification_filter_author_selector';

export class NotificationFilterCacheService
{
	static #instance = null;

	constructor()
	{
		this.cache = new Cache.MemoryCache();
	}

	static getInstance(): NotificationFilterCacheService
	{
		if (!NotificationFilterCacheService.#instance)
		{
			NotificationFilterCacheService.#instance = new NotificationFilterCacheService();
		}

		return NotificationFilterCacheService.#instance;
	}

	setAuthorSelector(selector: TagSelector): void
	{
		this.cache.set(AUTHOR_SELECTOR_KEY, selector);
	}

	getAuthorSelector(): TagSelector
	{
		return this.cache.get(AUTHOR_SELECTOR_KEY, null);
	}

	clearCache(): void
	{
		this.cache.delete(AUTHOR_SELECTOR_KEY);
	}
}
