/**
 * @module settings-v2/controller/reaction
 */
jn.define('settings-v2/controller/reaction', (require, exports, module) => {
	const { BaseSettingController } = require('settings-v2/controller/base');
	const { ReactionSettingsService } = require('settings-v2/services/reaction-settings');
	const { showToast, showErrorToast } = require('toast');
	const { Icon } = require('assets/icons');
	const { Loc } = require('loc');

	/**
	 * @class ReactionSettingController
	 * @desc Controller for the user's main (quick) reaction setting. Reads and saves the value
	 * directly over REST through ReactionSettingsService, without touching the messenger core:
	 * the settings screen runs in the `menu` context, where the core is unavailable. The
	 * messenger syncs its own state separately via Pull. Mirrors the SecuritySettingsController
	 * -> SecuritySettingsService pair.
	 * @extends BaseSettingController
	 */
	class ReactionSettingController extends BaseSettingController
	{
		constructor(props)
		{
			super(props);

			/**
			 * @desc Last known reaction value. Used to roll the preview back when a save fails.
			 * @type {?string}
			 */
			this.currentReaction = null;
		}

		/**
		 * @return {Promise<string>}
		 */
		async get()
		{
			this.currentReaction = await ReactionSettingsService.fetch();

			return this.currentReaction ?? this.fallbackValue;
		}

		/**
		 * @param {string} value
		 * @return {Promise<string>} the actually saved (or rolled-back) reaction value
		 */
		async set(value)
		{
			try
			{
				await ReactionSettingsService.update(value);
			}
			catch (error)
			{
				console.error('ReactionSettingController.set error:', error);
				showErrorToast();

				return this.currentReaction ?? this.fallbackValue;
			}

			this.currentReaction = value;

			showToast({
				message: Loc.getMessage('SETTINGS_V2_CONTROLLER_REACTION_DEFAULT_CHANGED'),
				icon: Icon.CIRCLE_CHECK,
			});

			return value;
		}
	}

	module.exports = {
		ReactionSettingController,
	};
});
