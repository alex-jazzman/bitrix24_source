/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_const, im_v2_lib_rest, main_core, main_popup, im_v2_lib_feature) {
	'use strict';

	const ACCESS_ERROR_CODES = new Set([im_v2_const.ErrorCode.chat.accessDenied, im_v2_const.ErrorCode.chat.notFound, im_v2_const.ErrorCode.message.notFound, im_v2_const.ErrorCode.message.accessDenied, im_v2_const.ErrorCode.message.accessDeniedByTariff]);
	const AccessService = {
		async checkMessageAccess(messageId) {
			const payload = {
				data: {
					messageId
				}
			};
			try {
				await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2AccessCheck, payload);
			} catch (errors) {
				return handleAccessError(errors);
			}
			return Promise.resolve({
				hasAccess: true
			});
		}
	};
	const handleAccessError = errors => {
		const [error] = errors;
		if (ACCESS_ERROR_CODES.has(error.code)) {
			return {
				hasAccess: false,
				errorCode: error.code
			};
		}
		console.error('AccessService: error checking access', error.code);

		// we need to handle all types of errors on this stage
		// but for now we let user through in case of unknown error
		return {
			hasAccess: true
		};
	};

	class HistoryLimitPopup {
		#popupInstance;
		#cache = new main_core.Cache.MemoryCache();
		constructor() {
			this.#popupInstance = new main_popup.Popup(this.#getPopupConfig());
			this.#bindEvents();
		}
		show() {
			this.#popupInstance.show();
		}
		close() {
			this.#popupInstance.destroy();
		}
		#getPopupConfig() {
			return {
				id: im_v2_const.PopupType.messageHistoryLimit,
				className: 'bx-im-messenger__scope',
				closeIcon: false,
				autoHide: false,
				closeByEsc: false,
				animation: 'fading',
				overlay: true,
				padding: 0,
				content: this.#getContainer(),
				events: {
					onPopupDestroy: () => {
						this.#unbindEvents();
					}
				}
			};
		}
		#getContainer() {
			return this.#cache.remember('', () => {
				const container = main_core.Tag.render`
				<div class="bx-im-history-limit-popup__container">
					<div class="bx-im-history-limit-popup__image"></div>
					<div class="bx-im-history-limit-popup__title">
						${im_v2_lib_feature.FeatureManager.chatHistory.getLimitTitle()}
					</div>
					<div class="bx-im-history-limit-popup__subtitle">
						${im_v2_lib_feature.FeatureManager.chatHistory.getLimitSubtitle()}
					</div>
				</div>
			`;
				main_core.Dom.append(this.#getButtonContainer(), container);
				return container;
			});
		}
		#getButtonContainer() {
			return this.#cache.remember('', () => {
				return main_core.Tag.render`
				<div class="bx-im-history-limit-popup__button">
					${im_v2_lib_feature.FeatureManager.chatHistory.getLearnMoreText()}
				</div>
			`;
			});
		}
		#bindEvents() {
			main_core.Event.bind(this.#getButtonContainer(), 'click', () => {
				im_v2_lib_feature.FeatureManager.chatHistory.openFeatureSlider();
				this.close();
			});
		}
		#unbindEvents() {
			main_core.Event.unbindAll(this.#getButtonContainer(), 'click');
		}
	}

	const AccessManager = {
		checkMessageAccess(messageId) {
			return AccessService.checkMessageAccess(messageId);
		},
		// save it for later
		showHistoryLimitPopup() {
			const limitPopup = new HistoryLimitPopup();
			limitPopup.show();
		}
	};

	exports.AccessManager = AccessManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX, BX.Main, BX.Messenger.v2.Lib);
//# sourceMappingURL=access.bundle.js.map
