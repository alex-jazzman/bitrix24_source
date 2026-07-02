/**
 * @module whats-new
 */
jn.define('whats-new', (require, exports, module) => {
	const { isEmpty } = require('utils/object');
	const { WhatsNewUIManager } = require('whats-new/ui-manager');
	const { WhatsNewService } = require('whats-new/service');
	const { WhatsNewCounter } = require('whats-new/counter-manager');
	const { WhatsNewAnalytics } = require('layout/ui/whats-new/analytics');
	const { Tourist } = require('tourist');

	/**
	 * @class WhatsNewManager
	 */
	class WhatsNewManager
	{
		static async init()
		{
			WhatsNewCounter.initializeCounter(WhatsNewService.getNewCount());

			if (!WhatsNewUIManager.canOpenComponentInBackground())
			{
				return;
			}

			await WhatsNewService.fetchUrlParams();

			if (!WhatsNewService.isDayPassedSinceLastFetch())
			{
				return;
			}

			await WhatsNewService.fetchInitialData();

			const counter = WhatsNewService.getNewCount();

			if (WhatsNewManager.canOpenOnAppActive() && counter > 0)
			{
				if (Tourist.firstTime('skip_first_whats_new_auto_open'))
				{
					Tourist.remember('skip_first_whats_new_auto_open');

					return;
				}

				new WhatsNewAnalytics()
					.setEvent(WhatsNewAnalytics.Event.drawerOpen)
					.send();

				WhatsNewUIManager.openComponentInBackground();
			}

			await WhatsNewService.updateLocalWhatsNewsParams();
		}

		/**
		 * @return {boolean}
		 */
		static canOpenOnAppActive()
		{
			return isEmpty(Application.getLastNotification());
		}
	}

	module.exports = {
		WhatsNewManager,
	};
});
