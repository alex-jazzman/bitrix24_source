/**
 * @module im/messenger/lib/promotion/src/entities/tasks
 */
jn.define('im/messenger/lib/promotion/src/entities/tasks', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { AhaMoment } = require('ui-system/popups/aha-moment');
	const { PromotionAsset } = require('im/messenger/assets/promotion');
	const { Promo } = require('im/messenger/const');
	const AUTO_CLOSE_AHA_MOMENT_TIMER = 5000;

	/**
	 * @class TasksPromotion
	 */
	class TasksPromotion
	{
		/**
		 * @param {() => any} actionCallback
		 */
		static showRecentAvailable(actionCallback = () => {})
		{
			AhaMoment.show({
				testId: 'tab-tasks-recent-aha',
				targetRef: 'tab-task',
				description: Loc.getMessage('IMMOBILE_MESSENGER_PROMO_TASKS_TAB_RECENT_DESCRIPTION'),
				fadeInDuration: 100,
				disableHideByOutsideClick: false,
				autoCloseDelay: AUTO_CLOSE_AHA_MOMENT_TIMER,
				delay: 300,
				shouldShowImageBackgroundColor: false,
				image: Image(
					{
						uri: PromotionAsset.recentTasksUrl,
						style: {
							width: 78,
							height: 60,
						},
						resizeMode: 'contain',
						onFailure: console.error,
						onSvgContentError: console.error,
					},
				),
				onHide: () => {
					actionCallback({ read: true, promoId: Promo.tasksRecent });
				},
			});
		}
	}

	module.exports = {
		TasksPromotion,
	};
});
