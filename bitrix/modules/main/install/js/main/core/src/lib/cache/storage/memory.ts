import { type ICacheStorage } from './i-cache-storage';

/**
 * In-memory cache storage backed by a Map. `keys()`/`values()` return arrays to match
 * the ICacheStorage contract (Map returns iterators).
 */
export default class MemoryStorage implements ICacheStorage
{
	#map: Map<string, unknown> = new Map();

	get(key: string): unknown
	{
		return this.#map.get(key);
	}

	set(key: string, value: unknown): void
	{
		this.#map.set(key, value);
	}

	has(key: string): boolean
	{
		return this.#map.has(key);
	}

	delete(key: string): void
	{
		this.#map.delete(key);
	}

	get size(): number
	{
		return this.#map.size;
	}

	keys(): Array<string>
	{
		return [...this.#map.keys()];
	}

	values(): Array<unknown>
	{
		return [...this.#map.values()];
	}
}
