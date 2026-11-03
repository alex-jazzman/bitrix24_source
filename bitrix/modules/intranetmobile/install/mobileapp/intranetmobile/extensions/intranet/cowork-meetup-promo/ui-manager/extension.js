/**
 * @module intranet/cowork-meetup-promo/ui-manager
 */
jn.define('intranet/cowork-meetup-promo/ui-manager', (require, exports, module) => {
	const { Tourist } = require('tourist');
	const { BackgroundUIManager } = require('background/ui-manager');
	const { canShowCoworkMeetupPromo } = require('intranet/cowork-meetup-promo/rest');
	const { preloadPromoAssets } = require('intranet/cowork-meetup-promo/utils');
	const {
		PROMO_COMPONENT_NAME,
		PROMO_SHOWN_TOURIST_EVENT,
	} = require('intranet/cowork-meetup-promo/const');

	// above the check-in onboarding (10005): the campaign lasts days, reach wins over onboarding
	const PROMO_PRIORITY = 10010;

	class CoworkMeetupPromoUIManager
	{
		/**
		 * @public
		 */
		static openComponent()
		{
			PageManager.openComponent('JSStackComponent', {
				componentCode: PROMO_COMPONENT_NAME,
				// eslint-disable-next-line no-undef
				scriptPath: availableComponents[PROMO_COMPONENT_NAME].publicUrl,
				canOpenInDefault: true,
				rootWidget: {
					name: 'layout',
					componentCode: PROMO_COMPONENT_NAME,
					settings: {
						objectName: 'layout',
						modal: true,
						backdrop: {
							disableTopInset: true,
							showOnTop: false,
							// a tiny medium position lets the sheet slide up unnoticed; drop the key and
							// it opens half-screen with a loader first. Keep the value an integer:
							// Android parses this height as one, and a fraction breaks the parsing of
							// the whole settings object, so the widget never opens there
							mediumPositionHeight: 1,
							forceDismissOnSwipeDown: true,
							horizontalSwipeAllowed: false,
							swipeContentAllowed: true,
							hideNavigationBar: true,
						},
					},
				},
			});
		}

		/**
		 * @public
		 * @returns {Promise<void>}
		 */
		static async openInBackgroundIfNeeded()
		{
			await Tourist.ready();

			// a server "no" is not remembered: the marker is written by the story on an actual show
			if (!Tourist.firstTime(PROMO_SHOWN_TOURIST_EVENT))
			{
				return;
			}

			const response = await canShowCoworkMeetupPromo();
			if (response?.data !== true)
			{
				return;
			}

			void preloadPromoAssets();
			BackgroundUIManager.openComponent(
				PROMO_COMPONENT_NAME,
				CoworkMeetupPromoUIManager.openComponent,
				PROMO_PRIORITY,
				undefined,
				// the priority only wins inside the three second debounce of the manager; without the
				// queue the promo is dropped whenever the server answer arrives later than that
				{ enqueueIfBusy: true },
			);
		}
	}

	module.exports = {
		CoworkMeetupPromoUIManager,
	};
});
