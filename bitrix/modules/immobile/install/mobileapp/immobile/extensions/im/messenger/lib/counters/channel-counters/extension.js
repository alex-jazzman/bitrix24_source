/**
 * @module im/messenger/lib/counters/channel-counters
 */
jn.define('im/messenger/lib/counters/channel-counters', (require, exports, module) => {
	const { BaseCounters } = require('im/messenger/lib/counters/lib/base-counters');

	/**
	 * @class ChannelCounters
	 */
	class ChannelCounters extends BaseCounters
	{

		handleCountersGet(response)
		{
			const data = response.data();

			this.store.dispatch('commentModel/setCounters', data.channelComment);
		}
	}

	module.exports = { ChannelCounters };
});
