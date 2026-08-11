/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_v2_application_core, im_v2_const, im_v2_lib_permission, im_v2_lib_feature) {
	'use strict';

	class GuestManager {
		static #instance;
		#shouldShowGuestNamePopup = false;
		#termsOfServiceUrl = '';
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		setGuestNamePopupState(value) {
			if (!main_core.Type.isBoolean(value)) {
				return;
			}
			this.#shouldShowGuestNamePopup = value;
		}
		getGuestNamePopupState() {
			return this.#shouldShowGuestNamePopup;
		}
		isGuestLinkAvailable(dialogId) {
			if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isChatWithGuestsAvailable)) {
				return false;
			}
			const {
				parentChatId,
				type
			} = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			if (parentChatId > 0) {
				return false;
			}
			if (![im_v2_const.ChatType.chat, im_v2_const.ChatType.open, im_v2_const.ChatType.calendar].includes(type)) {
				return false;
			}
			const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
			const canPerformActionByRole = permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.manageGuestLink, dialogId);
			const canPerformActionByUserType = permissionManager.canPerformActionByUserType(im_v2_const.ActionByUserType.manageGuestLink);
			return canPerformActionByRole && canPerformActionByUserType;
		}
		setTermsOfServiceUrl(value) {
			if (!main_core.Type.isStringFilled(value)) {
				return;
			}
			this.#termsOfServiceUrl = value;
		}
		getTermsOfServiceUrl() {
			return this.#termsOfServiceUrl;
		}
	}

	exports.GuestManager = GuestManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=guest.bundle.js.map
