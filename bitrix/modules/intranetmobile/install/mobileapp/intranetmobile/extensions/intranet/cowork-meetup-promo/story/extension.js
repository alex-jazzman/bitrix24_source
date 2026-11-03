/**
 * @module intranet/cowork-meetup-promo/story
 */
jn.define('intranet/cowork-meetup-promo/story', (require, exports, module) => {
	const { Tourist } = require('tourist');
	const { StorySlider, sliderInternalPosition } = require('layout/ui/story-slider');
	const { PROMO_LANDING_URL, PROMO_SHOWN_TOURIST_EVENT } = require('intranet/cowork-meetup-promo/const');
	const { CoworkMeetupPromoSlide } = require('intranet/cowork-meetup-promo/story/src/slide');
	const { getSlidesConfig } = require('intranet/cowork-meetup-promo/story/src/slides-config');

	const TEST_ID = 'cowork-meetup-promo';
	const SLIDE_DURATION = 7;
	const FOOTER_BUTTON_ZONE_HEIGHT = 96;
	const LANDING_TAP_THROTTLE = 1000;

	/**
	 * @class CoworkMeetupPromo
	 */
	class CoworkMeetupPromo
	{
		#onClose = null;
		#landingOpenedAt = 0;

		/**
		 * @param {object} [params]
		 * @param {Function} [params.onClose]
		 * @returns {Promise<void>}
		 */
		static show(params = {})
		{
			return new CoworkMeetupPromo(params.onClose).#show();
		}

		constructor(onClose)
		{
			this.#onClose = onClose;
		}

		async #show()
		{
			const storySlider = new StorySlider({
				testId: TEST_ID,
				slides: this.#buildSlides(),
				slideDuration: SLIDE_DURATION,
				clickableInsets: {
					bottom: FOOTER_BUTTON_ZONE_HEIGHT,
				},
				onClose: this.#onClose,
			});

			const layoutManager = await storySlider.show();
			if (layoutManager)
			{
				void Tourist.remember(PROMO_SHOWN_TOURIST_EVENT);
			}
		}

		#buildSlides()
		{
			return getSlidesConfig().map((config) => new CoworkMeetupPromoSlide({
				...config,
				testId: `${TEST_ID}-slide-${config.id}`,
				position: sliderInternalPosition,
				onButtonClick: this.#openLanding,
			}));
		}

		#openLanding = () => {
			const now = Date.now();
			if (now - this.#landingOpenedAt < LANDING_TAP_THROTTLE)
			{
				return;
			}

			this.#landingOpenedAt = now;
			Application.openUrl(PROMO_LANDING_URL);
		};
	}

	module.exports = {
		CoworkMeetupPromo,
	};
});
