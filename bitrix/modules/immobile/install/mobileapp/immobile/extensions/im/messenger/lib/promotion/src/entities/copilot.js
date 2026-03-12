/**
 * @module im/messenger/lib/promotion/src/entities/copilot
 */
jn.define('im/messenger/lib/promotion/src/entities/copilot', (require, exports, module) => {
	const { AhaMoment } = require('ui-system/popups/aha-moment');
	const { Promo } = require('im/messenger/const');
	const { Loc } = require('im/messenger/loc');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('promotion', 'CopilotPromotion');
	const AUTO_CLOSE_AHA_MOMENT_TIMER = 5000;

	/**
	 * @class CopilotPromotion
	 */
	class CopilotPromotion
	{
		/**
		 * @param {LayoutComponent} targetRef
		 * @param {() => any} actionCallback
		 */
		static showCopilotSidebarChangeEngine(targetRef, actionCallback = () => {})
		{
			try
			{
				AhaMoment.show({
					targetRef,
					testId: 'copilot-sidebar-aha',
					description: Loc.getMessage('IMMOBILE_MESSENGER_PROMO_SIDEBAR_COPILOT_CHANGE_MODEL'),
					disableHideByOutsideClick: false,
					closeButton: false,
					fadeInDuration: 100,
					autoCloseDelay: AUTO_CLOSE_AHA_MOMENT_TIMER,
					onHide: () => {
						logger.log('showCopilotSidebarChangeEngine AhaMoment.onHide');
						actionCallback({ read: true, promoId: Promo.copilotSidebarEngine });
					},
				});
			}
			catch (error)
			{
				logger.error('showCopilotSidebarChangeEngine catch:', error);
				actionCallback();
			}
		}
	}

	module.exports = {
		CopilotPromotion,
	};
});
