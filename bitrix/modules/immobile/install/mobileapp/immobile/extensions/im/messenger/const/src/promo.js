/**
 * @module im/messenger/const/promo
 */
jn.define('im/messenger/const/promo', (require, exports, module) => {
	const Promo = {
		videoNote: 'immobile:video-note:24102025:mobile',
		copilotSidebarEngine: 'im:chat-sidebar-change-copilot-engine-and-role:20052025:all',
	};

	const PromoType = {
		widget: 'widget',
		spotlight: 'spotlight',
	};

	module.exports = { Promo, PromoType };
});
