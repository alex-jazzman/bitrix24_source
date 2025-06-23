/**
 * @module tourist
 */
jn.define('tourist', (require, exports, module) => {
	const { MemoryStorage } = require('native/memorystore');
	const { TouristCacheExecutor } = require('tourist/src/cache');

	const MAX_TIMES_TO_REMEMBER = 1000;

	const RESERVED_KEYS = new Set(['_inited']);
	const isKeyAllowed = (key) => !RESERVED_KEYS.has(key);
	const assertKeyAllowed = (key) => {
		if (!isKeyAllowed(key))
		{
			throw new Error(`Tourist: unable to use reserved key ${key}`);
		}
	};

	class Tourist
	{
		constructor(userId)
		{
			this.userId = userId;
			this.storage = new MemoryStorage(`tourist${this.userId}`);
			this.onInit = this.#init();
		}

		async #init()
		{
			const inited = await this.storage.get('_inited');

			if (inited)
			{
				return Promise.resolve();
			}

			return new Promise((resolve) => {
				const onInit = () => {
					BX.removeCustomEvent('Tourist.Inited', onInit);
					resolve();
				};

				BX.addCustomEvent('Tourist.Inited', onInit);
			});
		}

		/**
		 * @public
		 * @return {Promise}
		 */
		async loadEvents()
		{
			const inited = await this.storage.get('_inited');

			if (inited)
			{
				return Promise.resolve();
			}

			try
			{
				const executor = TouristCacheExecutor.getRunActionExecutor()
					.setHandler((response) => this.#handleResponse(response))
					.setCacheHandler((cache) => this.#handleResponse(cache))
					.setSkipRequestIfCacheExists()
				;

				return await executor.call(true);
			}
			catch (error)
			{
				return this.#handleError(error);
			}
		}

		#handleResponse(response)
		{
			if (response?.status !== 'success')
			{
				return this.#handleError(response);
			}

			const operations = [];
			operations.push(this.storage.set('_inited', true));
			for (const eventId of Object.keys(response.data))
			{
				if (isKeyAllowed(eventId))
				{
					operations.push(this.storage.set(eventId, response.data[eventId]));
				}
			}

			return Promise.allSettled(operations)
				.then(() => {
					BX.postComponentEvent('Tourist.Inited');
				})
				.catch((err) => {
					console.error(err);
				})
			;
		}

		#handleError(error)
		{
			console.error('Cannot fetch tourist events from server', error);

			return this.storage.set('_inited', true)
				.then(() => {
					BX.postComponentEvent('Tourist.Inited');
				})
				.catch((err) => {
					console.error(err);
				})
			;
		}

		/**
		 * @public
		 * @return {Promise}
		 */
		ready()
		{
			return this.onInit;
		}

		/**
		 * @public
		 * @param {string} event
		 * @return {boolean}
		 */
		firstTime(event)
		{
			return !this.storage.getSync(event);
		}

		/**
		 * Alias for firstTime()
		 * @public
		 * @param {string} event
		 * @return {boolean}
		 */
		never(event)
		{
			return this.firstTime(event);
		}

		/**
		 * @public
		 * @param {string} event
		 * @return {number}
		 */
		numberOfTimes(event)
		{
			return Number(this.storage.getSync(event)?.cnt ?? 0);
		}

		/**
		 * @public
		 * @param {string} event
		 * @return {object|null}
		 */
		getContext(event)
		{
			return this.storage.getSync(event)?.context;
		}

		/**
		 * @public
		 * @param {string} event
		 * @return {Date|undefined}
		 */
		lastTime(event)
		{
			const ts = this.storage.getSync(event)?.ts;

			return ts ? new Date(ts * 1000) : undefined;
		}

		/**
		 * @public
		 * @param {string} event
		 * @param {object} [options = {}]
		 * @param {object} [options.context = null]
		 * @param {Date} [options.time = null]
		 * @param {?number} [options.count = null]
		 * @return {Promise}
		 */
		remember(event, { context = null, time = null, count = null } = {})
		{
			assertKeyAllowed(event);

			const cnt = count ?? Math.min((this.storage.getSync(event)?.cnt ?? 0) + 1, MAX_TIMES_TO_REMEMBER);
			const ts = time ? Math.round(time / 1000) : Math.round(Date.now() / 1000);
			const model = {
				ts,
				cnt,
				context,
			};

			BX.ajax.runAction('mobile.tourist.remember', {
				json: {
					event,
					context: context ? JSON.stringify(context) : null,
					timestamp: time ? ts : null,
					count: count ?? null,
				},
			})
				.then((response) => {
					const data = {
						...model,
						...this.storage.getSync(event),
						...response.data,
					};
					if (response.data.context)
					{
						data.context = JSON.parse(response.data.context);
					}

					this.#updateStorage(event, data);
				})
				.catch((err) => {
					console.error('Cannot remember tourist event on server', event, err);
				});

			return this.storage.set(event, model);
		}

		/**
		 * @public
		 * @param {string} event
		 * @return {Promise}
		 */
		forget(event)
		{
			assertKeyAllowed(event);

			void BX.ajax.runAction('mobile.tourist.forget', { json: { event } });

			return this.#updateStorage(event, null);
		}

		#updateStorage(event, eventData)
		{
			TouristCacheExecutor.updateRunActionCache(event, eventData);

			return this.storage.set(event, eventData);
		}

		/**
		 * Shorthand for firstTime() + remember()
		 * @public
		 * @param {string} event
		 * @return {boolean}
		 */
		rememberFirstTime(event)
		{
			assertKeyAllowed(event);

			if (this.firstTime(event))
			{
				void this.remember(event);

				return true;
			}

			return false;
		}
	}

	module.exports = {
		Tourist: new Tourist(env.userId),
	};
});
