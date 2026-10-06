/**
 * Backing storage for a cache. Values are held as `unknown`; the value type is applied
 * by the cache methods (BaseCache) on the way in and out, not by the storage itself.
 */
export interface ICacheStorage
{
	size: number;
	get(key: string): unknown;
	set(key: string, value: unknown): void;
	has(key: string): boolean;
	delete(key: string): void;
	keys(): Array<string>;
	values(): Array<unknown>;
}
