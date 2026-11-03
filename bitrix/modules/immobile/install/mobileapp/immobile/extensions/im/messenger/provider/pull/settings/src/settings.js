/**
 * @module im/messenger/provider/pull/settings/settings
 */
jn.define('im/messenger/provider/pull/settings/settings', (require, exports, module) => {
	const { BasePullHandler } = require('im/messenger/provider/pull/base');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DefaultReactionPolicy } = require('im/messenger/provider/services/settings');

	/**
	 * @class SettingsPullHandler
	 */
	class SettingsPullHandler extends BasePullHandler
	{
		/**
		 * @param {SettingsUpdateParams} params
		 * @return {Promise<void>}
		 */
		async handleSettingsUpdate(params, extra)
		{
			// settingsUpdate carries a partial payload: bail out when this event is not about
			// the default reaction, otherwise updateCache would reset it to the "like" default. Bail
			// before the staleness probe so an unrelated stale settings change triggers no re-read.
			if (!DefaultReactionPolicy.shouldApplyPullUpdate(params))
			{
				return;
			}

			// settingsUpdate is the only live channel for the default reaction: the messenger sync
			// never loads or overwrites it, so the event must survive a sync/reconnect: bypass the
			// sync interception. Keep the staleness guard though: with only ignoreSyncInterception set,
			// interceptEvent returns true exactly when server_time_ago > 30 (see BasePullHandler) and
			// has no side effects, so it doubles as a "stale Pull" probe.
			if (this.interceptEvent(extra, { ignoreSyncInterception: true }))
			{
				// A Pull delayed past the guard (long background/reconnect) may carry an older value
				// than a fresher local write or REST result, so do not apply its payload blindly.
				// Re-read the current server value instead: fetchFromServer has an operationId guard,
				// so this re-read cannot overwrite a fresher local write that is still in flight.
				await this.getDefaultReactionService().fetchFromServer();

				return;
			}

			await this.getDefaultReactionService().updateCache(params.defaultReaction);
		}

		/**
		 * @return {DefaultReactionService}
		 */
		getDefaultReactionService()
		{
			return serviceLocator.get('default-reaction-service');
		}
	}

	module.exports = {
		SettingsPullHandler,
	};
});
