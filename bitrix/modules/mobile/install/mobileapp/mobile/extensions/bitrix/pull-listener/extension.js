/**
 * @module pull-listener
 */
jn.define('pull-listener', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * @class PullListener
	 * @param {PullListenerParams} params
	 */
	class PullListener
	{
		/**
		 * @typedef {Object} PullListenerParams
		 * @property {Array<Object>} [eventClients = []]
		 * @property {String} [subscriptionType = BX.PullClient.SubscriptionType.Server]
		 */
		constructor({
			eventClients = [],
			subscriptionType = BX.PullClient.SubscriptionType.Server,
		} = {})
		{
			this.eventClients = Type.isArrayFilled(eventClients) ? [...eventClients] : [];
			this.activeSubscriptions = new Map();
			this.subscriptionType = subscriptionType;
		}

		/**
		 * Subscribe all registered event clients.
		 * @returns {void}
		 */
		subscribeAll()
		{
			this.eventClients.forEach((client) => {
				if (client && Type.isFunction(client.getPullEvents))
				{
					client.getPullEvents().forEach((event) => this.subscribeEvent(event));
				}
				else
				{
					console.warn('PullListener: eventClient must implement getPullEvents()');
				}
			});
		}

		/**
		 * Subscribe to a specific PullEvent.
		 * @param {Object} pullEvent
		 * @returns {Function|null}
		 */
		subscribeEvent(pullEvent)
		{
			const key = `${pullEvent.moduleId}:${pullEvent.command}`;
			if (this.activeSubscriptions.has(key))
			{
				return this.activeSubscriptions.get(key);
			}

			const callback = (params, extra, commandName) => {
				const res = pullEvent.callback(params, extra, commandName);
				if (res?.then)
				{
					res.catch(console.error);
				}
			};

			// eslint-disable-next-line init-declarations
			let unsubCallback;

			try
			{
				unsubCallback = BX.PULL.subscribe({
					moduleId: pullEvent.moduleId,
					command: pullEvent.command,
					type: this.subscriptionType,
					callback,
				});
			}
			catch (err)
			{
				console.error(`PullListener: subscribe failed for ${pullEvent.moduleId}.${pullEvent.command}`, err);
				unsubCallback = () => {};
			}

			this.activeSubscriptions.set(key, unsubCallback);

			return unsubCallback;
		}

		/**
		 * Unsubscribe a specific event.
		 * @param {Object} pullEvent
		 * @returns {void}
		 */
		unsubscribeEvent(pullEvent)
		{
			const key = `${pullEvent.moduleId}:${pullEvent.command}`;
			const unsubCallback = this.activeSubscriptions.get(key);

			if (Type.isFunction(unsubCallback))
			{
				unsubCallback();
			}
			this.activeSubscriptions.delete(key);
		}

		/**
		 * Unsubscribe from all active subscriptions.
		 * @returns {void}
		 */
		unsubscribeAll()
		{
			for (const key of this.activeSubscriptions.keys())
			{
				const [moduleId, command] = key.split(':');
				this.unsubscribeEvent({ moduleId, command });
			}
		}
	}

	module.exports = {
		PullListener,
	};
});
