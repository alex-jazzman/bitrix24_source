/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core, ui_bannerDispatcher, ui_mobilePromoter) {
	'use strict';

	class InviteToMobile {
		#appLink;
		constructor(data) {
			this.#appLink = data.appLink;
		}
		show() {
			ui_bannerDispatcher.BannerDispatcher.normal.toQueue(onDone => {
				const promoter = this.#createMobilePromoter();
				const popup = promoter.getPopup();
				popup.subscribe('onAfterClose', event => {
					onDone();
				});
				popup.show();
			});
		}
		#createMobilePromoter() {
			return new ui_mobilePromoter.MobilePromoter({
				title: main_core.Loc.getMessage('TASKS_PROMO_INVITE_TO_MOBILE_TITLE'),
				position: {
					right: 83,
					bottom: 46
				},
				qrContent: this.#appLink,
				analytics: {
					c_section: 'tasks'
				}
			});
		}
	}

	exports.InviteToMobile = InviteToMobile;

})(this.BX.Tasks.Promo = this.BX.Tasks.Promo || {}, BX, BX.UI, BX.UI);
//# sourceMappingURL=invite-to-mobile.bundle.js.map
