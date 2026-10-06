/**
 * @module crm/timeline/controllers/visit
 */
jn.define('crm/timeline/controllers/visit', (require, exports, module) => {
	const { TimelineBaseController } = require('crm/controllers/base');
	const { Filesystem } = require('native/filesystem');
	const { withCurrentDomain } = require('utils/url');

	const SupportedActions = {
		SCHEDULE_CALL: 'Activity:Visit:Schedule',
		TOGGLE_PLAYER: 'Activity:Visit:ChangePlayerState',
		DOWNLOAD_RECORD: 'Activity:Visit:DownloadRecord',
	};

	class TimelineVisitController extends TimelineBaseController
	{
		static getSupportedActions()
		{
			return Object.values(SupportedActions);
		}

		onItemAction({ action, actionParams = {} })
		{
			switch (action)
			{
				case SupportedActions.SCHEDULE_CALL:
					return this.schedule(actionParams);
				case SupportedActions.TOGGLE_PLAYER:
					return this.togglePlayer(actionParams);
				case SupportedActions.DOWNLOAD_RECORD:
					return this.downloadRecord(actionParams);
				default:
			}
		}

		schedule(actionData)
		{
			this.scheduler.openActivityEditor(actionData);
		}

		downloadRecord(actionData)
		{
			const { url, name } = actionData;
			if (!url)
			{
				return;
			}

			Notify.showIndicatorLoading();

			Filesystem.downloadFile(withCurrentDomain(url), name || undefined)
				.then((uri) => {
					Notify.hideCurrentIndicator();
					dialogs.showSharingDialog({ uri });
				})
				.catch((error) => {
					Notify.hideCurrentIndicator();
					console.error('Unable to download visit record', error);
				});
		}

		togglePlayer(actionData = {})
		{
			if (!actionData.recordUri)
			{
				return;
			}

			this.itemScopeEventBus.emit('TimelineIconAudioPlayer::onChangePlay', [{
				uri: withCurrentDomain(actionData.recordUri),
			}]);
		}
	}

	module.exports = { TimelineVisitController };
});
