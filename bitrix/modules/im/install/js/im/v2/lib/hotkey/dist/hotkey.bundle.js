/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_const, im_v2_lib_utils) {
	'use strict';

	const isSendMessageCombination = event => {
		return im_v2_lib_utils.Utils.key.isExactCombination(event, getSendMessageCombination());
	};
	const isNewLineCombination = event => {
		if (!isSendByEnter()) {
			return false;
		}
		return im_v2_lib_utils.Utils.key.isExactCombination(event, im_v2_const.HotkeyCombination.newLine.byCtrlEnter);
	};
	const isTextDecorationCombination = event => {
		return im_v2_lib_utils.Utils.key.isExactCombination(event, Object.values(im_v2_const.HotkeyCombination.textDecoration));
	};
	const getSendMessageCombination = () => {
		if (isSendByEnter()) {
			return im_v2_const.HotkeyCombination.sendMessage.byEnter;
		}
		return im_v2_const.HotkeyCombination.sendMessage.byCtrlEnter;
	};
	const isSendByEnter = () => {
		return im_v2_application_core.Core.getStore().getters['application/settings/get'](im_v2_const.Settings.hotkey.sendByEnter);
	};

	exports.isNewLineCombination = isNewLineCombination;
	exports.isSendMessageCombination = isSendMessageCombination;
	exports.isTextDecorationCombination = isTextDecorationCombination;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib);
//# sourceMappingURL=hotkey.bundle.js.map
