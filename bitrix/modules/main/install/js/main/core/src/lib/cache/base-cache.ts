import Type from '../type';
import { type ICacheStorage } from './storage/i-cache-storage';
import MemoryStorage from './storage/memory';

/**
 * A string-keyed cache.
 *
 * The class parameter `T` is the default value type of the cache (defaults to `unknown`
 * so a plain `new MemoryCache()` accepts anything). Different keys may hold different
 * types, so each method also takes its own type parameter: `cache.get<Popup>('popup')`,
 * `cache.set('count', 1)`, inferred from the default value or factory when passed. When
 * a default (or factory) is provided, `get`/`remember` are guaranteed to return a value,
 * so the return type excludes `undefined`.
 */
export default class BaseCache<T = unknown>
{
	/**
	 * @private
	 */
	storage: ICacheStorage = new MemoryStorage();

	/**
	 * Gets a cached value, falling back to the default value (or factory result) when
	 * the key is missing. With a default the return type excludes `undefined`.
	 */
	get<V = T>(key: string): V | undefined;
	get<V = T>(key: string, defaultValue: (() => V) | V): V;
	get<V = T>(key: string, defaultValue?: (() => V) | V): V | undefined
	{
		if (!this.storage.has(key))
		{
			if (Type.isFunction(defaultValue))
			{
				return (defaultValue as () => V)();
			}

			if (!Type.isUndefined(defaultValue))
			{
				return defaultValue as V;
			}
		}

		return this.storage.get(key) as V | undefined;
	}

	/**
	 * Sets a cache entry.
	 */
	set<V = T>(key: string, value: V): void
	{
		this.storage.set(key, value);
	}

	/**
	 * Deletes a cache entry.
	 */
	delete(key: string): void
	{
		this.storage.delete(key);
	}

	/**
	 * Checks that the storage contains an entry with the specified key.
	 */
	has(key: string): boolean
	{
		return this.storage.has(key);
	}

	/**
	 * Gets a cached value; when the key is missing, stores and returns the default value
	 * (or factory result). With a default the return type excludes `undefined`.
	 */
	remember<V = T>(key: string): V | undefined;
	remember<V = T>(key: string, defaultValue: (() => V) | V): V;
	remember<V = T>(key: string, defaultValue?: (() => V) | V): V | undefined
	{
		if (!this.storage.has(key))
		{
			if (Type.isFunction(defaultValue))
			{
				this.storage.set(key, (defaultValue as () => V)());
			}
			else if (!Type.isUndefined(defaultValue))
			{
				this.storage.set(key, defaultValue as V);
			}
		}

		return this.storage.get(key) as V | undefined;
	}

	/**
	 * Gets the storage size.
	 */
	size(): number
	{
		return this.storage.size;
	}

	/**
	 * Gets the storage keys.
	 */
	keys(): Array<string>
	{
		return this.storage.keys();
	}

	/**
	 * Gets the storage values.
	 */
	values<V = T>(): Array<V>
	{
		return this.storage.values() as Array<V>;
	}
}
