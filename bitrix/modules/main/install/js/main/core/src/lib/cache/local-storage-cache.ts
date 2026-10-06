import BaseCache from './base-cache';
import { type ICacheStorage } from './storage/i-cache-storage';
import LsCacheStorage from './storage/ls-storage';

/**
 * Cache backed by localStorage, so entries survive page reloads.
 */
export default class LocalStorageCache<T = unknown> extends BaseCache<T>
{
	/**
	 * @private
	 */
	storage: ICacheStorage = new LsCacheStorage();
}
