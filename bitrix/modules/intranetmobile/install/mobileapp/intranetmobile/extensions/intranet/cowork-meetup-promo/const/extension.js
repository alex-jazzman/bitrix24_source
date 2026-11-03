/**
 * @module intranet/cowork-meetup-promo/const
 */
jn.define('intranet/cowork-meetup-promo/const', (require, exports, module) => {
	const PROMO_COMPONENT_NAME = 'intranet:cowork-meetup-promo';
	const PROMO_SHOWN_TOURIST_EVENT = 'intranet_cowork_meetup_promo_relaunch_shown';
	const PROMO_LANDING_URL = 'https://meetup.bitrix24.events/cowork/?utm_source=mobapp&utm_medium=referral&utm_campaign=ru_webinar_onbordingmeetup-cowork&utm_content=slider';

	module.exports = {
		PROMO_COMPONENT_NAME,
		PROMO_SHOWN_TOURIST_EVENT,
		PROMO_LANDING_URL,
	};
});
