/**
 * @module im/messenger/provider/services/settings/default-reaction-policy
 */
jn.define('im/messenger/provider/services/settings/default-reaction-policy', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * @class DefaultReactionPolicy
	 * @desc Pure decision logic for the main (quick) reaction: no store, no REST, no side effects.
	 */
	class DefaultReactionPolicy
	{
		/**
		 * @desc settingsUpdate carries a partial payload shared by several settings. Returns whether
		 * this event actually changes the default reaction, so a partial payload without
		 * defaultReaction does not reset it to the "like" default.
		 * @param {{ defaultReaction?: string }} [params]
		 * @return {boolean}
		 */
		static shouldApplyPullUpdate(params)
		{
			return Type.isStringFilled(params?.defaultReaction);
		}
	}

	module.exports = {
		DefaultReactionPolicy,
	};
});
