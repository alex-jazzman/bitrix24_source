/**
 * @module pull-listener/client
 */
jn.define('pull-listener/client', (require, exports, module) => {
	const { PullEvent } = require('pull-listener/event');
	const { Type } = require('type');

	class PullEventClient
	{
		constructor(ids)
		{
			this.ids = Type.isArrayFilled(ids) ? new Set(ids) : null;
			this.events = this.registerPullEvents()
				.filter((event) => event instanceof PullEvent && (!this.ids || this.ids.has(event?.getId())));
		}

		registerPullEvents()
		{
			throw new Error('PullEventClient.registerPullEvents must be implemented in subclass');
		}

		getPullEvents()
		{
			return this.events;
		}
	}

	module.exports = {
		PullEventClient,
	};
});
