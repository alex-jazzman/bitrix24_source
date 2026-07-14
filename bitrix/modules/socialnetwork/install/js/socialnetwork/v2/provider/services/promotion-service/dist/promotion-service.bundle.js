/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Provider = this.BX.Socialnetwork.V2.Provider || {};
(function (exports, main_core) {
	'use strict';

	class PromotionService {
		async setNewProjectsPopupViewed() {
			try {
				await main_core.ajax.runAction('socialnetwork.promotion.setViewed', {
					data: {
						promotion: 'project_ai'
					}
				});
			} catch (error) {
				console.error(error);
			}
		}
	}
	const promotionService = new PromotionService();

	exports.PromotionService = PromotionService;
	exports.promotionService = promotionService;

})(this.BX.Socialnetwork.V2.Provider.Services = this.BX.Socialnetwork.V2.Provider.Services || {}, BX);
//# sourceMappingURL=promotion-service.bundle.js.map
