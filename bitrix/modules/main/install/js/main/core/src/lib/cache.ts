import BaseCache from './cache/base-cache';
import MemoryCache from './cache/memory-cache';
import LocalStorageCache from './cache/local-storage-cache';

/**
 * @memberOf BX
 */
export default class Cache
{
	static BaseCache: typeof BaseCache = BaseCache;
	static MemoryCache: typeof MemoryCache = MemoryCache;
	static LocalStorageCache: typeof LocalStorageCache = LocalStorageCache;
}
