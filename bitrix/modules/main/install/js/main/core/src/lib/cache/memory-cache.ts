import BaseCache from './base-cache';

/**
 * In-memory cache. BaseCache already uses MemoryStorage by default, so this is a named
 * alias kept for the public API (`BX.Cache.MemoryCache`).
 */
export default class MemoryCache<T = unknown> extends BaseCache<T>
{
}
