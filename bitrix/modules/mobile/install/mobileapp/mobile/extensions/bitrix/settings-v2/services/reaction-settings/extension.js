/**
 * @module settings-v2/services/reaction-settings
 */
jn.define('settings-v2/services/reaction-settings', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { DEFAULT_REACTION } = require('layout/ui/reaction/const');
	const { Type } = require('type');

	const RestMethod = {
		list: 'im.v2.Settings.General.list',
		update: 'im.v2.Settings.General.update',
	};

	const SETTING_NAME = 'defaultReaction';

	/**
	 * @class ReactionSettingsService
	 * @desc Reads and saves the user's main (quick) reaction directly over REST, without
	 * touching the messenger core. The settings screen runs in the `menu` context, where the
	 * messenger core is not registered, so reads and writes work the same way as in
	 * SecuritySettingsService. The messenger state is synced separately via Pull.
	 */
	class ReactionSettingsService
	{
		/**
		 * @desc Returns the user's current main reaction. Falls back to the default reaction
		 * when the response is empty or invalid.
		 * @return {Promise<string>}
		 */
		static async fetch()
		{
			const response = await (new RunActionExecutor(RestMethod.list, { userId: env.userId }))
				.call();

			const reaction = response?.data?.[SETTING_NAME];

			return Type.isStringFilled(reaction) ? reaction : DEFAULT_REACTION;
		}

		/**
		 * @desc Saves the user's main reaction. Rejects the promise on error.
		 * @param {string} value
		 * @return {Promise<Object>}
		 */
		static async update(value)
		{
			const response = await (new RunActionExecutor(RestMethod.update, {
				userId: env.userId,
				name: SETTING_NAME,
				value,
			}))
				.call();

			if (response?.errors?.length > 0)
			{
				return Promise.reject(response.errors);
			}

			return response;
		}
	}

	module.exports = {
		ReactionSettingsService,
	};
});
