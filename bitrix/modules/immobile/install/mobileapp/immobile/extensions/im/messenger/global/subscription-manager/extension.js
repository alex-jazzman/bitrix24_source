/**
 * @module im/messenger/global/subscription-manager
 */
jn.define('im/messenger/global/subscription-manager', (require, exports, module) => {
	/* global WeakRef FinalizationRegistry */
	const { Type } = require('type');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('messenger--subscription-manager', 'SubscriptionManager');

	/**
	 * @class SubscriptionManager
	 */
	class SubscriptionManager
	{
		/** @type {Set<WeakRef<Unsubscribable>>} */
		#refs = new Set();
		/** @type {WeakMap<Unsubscribable, WeakRef<Unsubscribable>>} */
		#instanceToRef = new WeakMap();
		/** @type {WeakMap<Unsubscribable, object>} */
		#instanceMetadata = new WeakMap();
		#finalizationRegistry;

		constructor()
		{
			this.#finalizationRegistry = new FinalizationRegistry((heldRef) => {
				this.#refs.delete(heldRef);
				logger.log('auto-cleaned dead reference');
			});
		}

		/**
		 * @param {Unsubscribable} instance
		 * @param {object} [metadata]
		 * @return {SubscriptionManager}
		 */
		register(instance, metadata = {})
		{
			if (!Type.isFunction(instance?.unsubscribeEvents))
			{
				console.warn(instance);
				throw new Error('Object must have an unsubscribeEvents method');
			}

			if (this.#instanceToRef.has(instance))
			{
				logger.warn('register: object already registered', metadata);

				return this;
			}

			const ref = new WeakRef(instance);
			this.#refs.add(ref);
			this.#instanceToRef.set(instance, ref);
			this.#instanceMetadata.set(instance, metadata);

			this.#finalizationRegistry.register(instance, ref, instance);

			const name = metadata.name || metadata.id || instance.constructor.name;
			logger.log(`register: registered object ${name}`);

			return this;
		}

		remove(instance)
		{
			const ref = this.#instanceToRef.get(instance);
			if (!ref)
			{
				return false;
			}

			const liveInstance = ref.deref();

			if (liveInstance)
			{
				try
				{
					liveInstance.unsubscribeEvents();
				}
				catch (error)
				{
					logger.error('remove: error in unsubscribeEvents during remove:', error);
				}
			}

			this.#refs.delete(ref);
			this.#instanceToRef.delete(instance);
			this.#finalizationRegistry.unregister(instance);

			const metadata = this.#instanceMetadata.get(instance);
			const name = metadata?.name || metadata?.id || 'unnamed';
			logger.log(`remove: removed object ${name}`);

			this.#instanceMetadata.delete(instance);

			return true;
		}

		removeAll()
		{
			const result = {
				success: 0,
				failed: [],
				total: this.#refs.size,
			};

			this.#refs.forEach((ref) => {
				const instance = ref.deref();
				if (!instance)
				{
					return;
				}

				try
				{
					instance.unsubscribeEvents();
					result.success++;

					const metadata = this.#instanceMetadata.get(instance);
					const name = metadata?.name || metadata?.id || instance.constructor.name;
					logger.log(`removeAll cleaned ${name}`);
				}
				catch (error)
				{
					const metadata = this.#instanceMetadata.get(instance);
					result.failed.push({
						metadata,
						error: error.message || String(error),
					});
				}
				finally
				{
					this.#instanceToRef.delete(instance);
					this.#finalizationRegistry.unregister(instance);
					this.#instanceMetadata.delete(instance);
				}
			});

			this.#refs.clear();

			if (result.failed.length > 0)
			{
				logger.warn(`removeAll: ${result.failed.length} errors during removeAll`, result.failed);
			}

			return result;
		}

		has(instance)
		{
			const ref = this.#instanceToRef.get(instance);

			return ref ? ref.deref() !== undefined : false;
		}

		get size()
		{
			let alive = 0;
			this.#refs.forEach((ref) => {
				if (ref.deref())
				{
					alive++;
				}
			});

			return alive;
		}

		getStats()
		{
			let alive = 0;
			let dead = 0;

			this.#refs.forEach((ref) => {
				if (ref.deref())
				{
					alive++;
				}
				else
				{
					dead++;
				}
			});

			return {
				total: this.#refs.size,
				alive,
				dead,
			};
		}

		cleanup()
		{
			const deadRefs = [];

			this.#refs.forEach((ref) => {
				if (!ref.deref())
				{
					deadRefs.push(ref);
				}
			});

			deadRefs.forEach((ref) => this.#refs.delete(ref));

			if (deadRefs.length > 0)
			{
				logger.log(`cleanup: cleaned ${deadRefs.length} dead references`);
			}

			return deadRefs.length;
		}

		inspect()
		{
			const alive = [];
			this.#refs.forEach((ref) => {
				const instance = ref.deref();
				if (instance)
				{
					alive.push({
						instance,
						metadata: this.#instanceMetadata.get(instance),
					});
				}
			});

			return alive;
		}
	}

	module.exports = { SubscriptionManager };
});
