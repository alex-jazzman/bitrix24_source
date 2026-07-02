/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_lib_logger, im_v2_const, im_v2_lib_rest) {
	'use strict';

	class Promo {
		constructor(id, params) {
			this.id = id;
			this.params = params;
		}
		static createFromRawPromoData(data) {
			return new Promo(data.id, data.params);
		}
		isEmptyParams() {
			return Object.keys(this.params).length === 0;
		}
		isEqual(promo) {
			return this.id === promo.id && this.#isParamsEqual(promo.params);
		}
		#isParamsEqual(params) {
			return Number(this.params.chatId ?? null) === Number(params.chatId ?? null);
		}
	}

	class PromoService {
		static markAsWatched(promo) {
			im_v2_lib_logger.Logger.warn('PromoService: markAsWatched:', promo);
			const payload = {
				data: {
					id: promo.id,
					params: promo.params
				}
			};
			im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2PromotionRead, payload).catch(([error]) => {
				console.error('PromoService: markAsWatched error:', error);
			});
		}
	}

	class PromoManager {
		static #instance;
		#promoList;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		static init() {
			PromoManager.getInstance();
		}
		constructor() {
			const {
				promoList
			} = im_v2_application_core.Core.getApplicationData();
			im_v2_lib_logger.Logger.warn('PromoManager: promoList', promoList);
			this.#init(promoList);
		}
		needToShow(promoId, promoParams = {}) {
			const promo = new Promo(promoId, promoParams);
			return Boolean(this.#get(promo));
		}
		async markAsWatched(promoId, promoParams = {}) {
			const promo = new Promo(promoId, promoParams);
			if (this.#get(promo)) {
				await PromoService.markAsWatched(promo);
				this.#remove(promo);
			}
		}
		onPromotionUpdated(params) {
			const deletedPromotions = params.deletedPromotions.map(promoData => Promo.createFromRawPromoData(promoData));
			this.#removeByPromotionList(deletedPromotions);
			const addedPromotions = params.addedPromotions.map(promoData => Promo.createFromRawPromoData(promoData));
			this.#promoList = [...this.#promoList, ...addedPromotions];
		}
		#init(promoList) {
			this.#promoList = promoList.map(promoData => Promo.createFromRawPromoData(promoData));
		}
		#get(promo) {
			return this.#promoList.find(item => item.isEqual(promo));
		}
		#remove(promo) {
			this.#promoList = this.#promoList.filter(item => !item.isEqual(promo));
		}
		#removeByPromotionList(promoList) {
			this.#promoList = this.#promoList.filter(promo => {
				const deletedPromo = promoList.find(deleted => deleted.id === promo.id);
				if (!deletedPromo) {
					return true;
				}
				if (deletedPromo.isEmptyParams()) {
					return false;
				}
				return !promo.isEqual(deletedPromo);
			});
		}
	}

	exports.PromoManager = PromoManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Lib);
//# sourceMappingURL=promo.bundle.js.map
