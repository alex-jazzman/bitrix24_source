/**
 * @module more-menu/ref-registry
 */
jn.define('more-menu/ref-registry', (require, exports, module) => {
	class RefRegistry
	{
		constructor()
		{
			this.map = new Map(); // key -> ref
			this.waiters = new Map(); // key -> Set<function>
		}

		/**
		 * @param {string} key
		 * @param {object} ref
		 */
		register(key, ref)
		{
			if (!key || !ref)
			{
				return;
			}

			this.map.set(key, ref);

			const listeners = this.waiters.get(key);
			if (listeners && listeners.size > 0)
			{
				listeners.forEach((resolve) => resolve(ref));
				listeners.clear();
				this.waiters.delete(key);
			}
		}

		unregister(key)
		{
			this.map.delete(key);
		}

		/**
		 * @param {string} key
		 * @returns {object|null}
		 */
		getRef(key)
		{
			return this.map.get(key) || null;
		}

		/**
		 * Wait until a ref with given key is registered.
		 * @param {string} key
		 * @param {number} [timeoutMs=5000]
		 * @returns {Promise<object|null>}
		 */
		waitFor(key, timeoutMs = 5000)
		{
			const existing = this.getRef(key);
			if (existing)
			{
				return Promise.resolve(existing);
			}

			return new Promise((resolve) => {
				let set = this.waiters.get(key);
				if (!set)
				{
					set = new Set();
					this.waiters.set(key, set);
				}
				set.add(resolve);

				const timer = setTimeout(() => {
					this.cleanupWaiter(key, resolve);
					resolve(this.getRef(key));
				}, timeoutMs);

				const immediate = this.getRef(key);
				if (immediate)
				{
					clearTimeout(timer);
					this.cleanupWaiter(key, resolve);
					resolve(immediate);
				}
			});
		}

		cleanupWaiter(key, resolve)
		{
			const set = this.waiters.get(key);
			if (!set)
			{
				return;
			}

			if (resolve)
			{
				set.delete(resolve);
			}

			if (set.size === 0)
			{
				this.waiters.delete(key);
			}
		}
	}

	const RefRegistryInstance = new RefRegistry();

	module.exports = {
		RefRegistry: RefRegistryInstance,
	};
});
