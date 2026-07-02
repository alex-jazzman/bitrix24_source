/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
(function (exports, im_v2_const, imopenlines_v2_const) {
	'use strict';

	const OpenLinesComponentList = new Set([imopenlines_v2_const.OpenLinesMessageComponent.StartDialogMessage, imopenlines_v2_const.OpenLinesMessageComponent.HiddenMessage, imopenlines_v2_const.OpenLinesMessageComponent.FeedbackFormMessage, imopenlines_v2_const.OpenLinesMessageComponent.ImOpenLinesForm, imopenlines_v2_const.OpenLinesMessageComponent.ImOpenLinesMessage]);
	const componentForReplace = new Set([imopenlines_v2_const.OpenLinesMessageComponent.ImOpenLinesForm, imopenlines_v2_const.OpenLinesMessageComponent.ImOpenLinesMessage]);
	class OpenLinesMessageManager {
		#message;
		constructor(message) {
			this.#message = message;
		}
		checkComponentInOpenLinesList() {
			return OpenLinesComponentList.has(this.#message.componentId);
		}
		getMessageComponent() {
			if (this.#message.isDeleted) {
				return im_v2_const.MessageComponent.deleted;
			}
			if (componentForReplace.has(this.#message.componentId)) {
				return this.#getUpdatedComponentId();
			}
			return this.#message.componentId;
		}
		#getUpdatedComponentId() {
			if (this.#message.componentParams.imolForm === imopenlines_v2_const.FormType.like) {
				return imopenlines_v2_const.OpenLinesMessageComponent.FeedbackFormMessage;
			}
			return im_v2_const.MessageComponent.default;
		}
	}

	exports.OpenLinesMessageManager = OpenLinesMessageManager;

})(this.BX.OpenLines.v2.Lib = this.BX.OpenLines.v2.Lib || {}, BX.Messenger.v2.Const, BX.OpenLines.v2.Const);
//# sourceMappingURL=message-manager.bundle.js.map
