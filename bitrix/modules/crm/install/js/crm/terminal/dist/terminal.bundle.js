/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_qrauthorization) {
	'use strict';

	class QrAuth {
		constructor(options = {}) {
			this.settingsCollection = main_core.Extension.getSettings('crm.terminal');
			this.intent = options.intent || this.settingsCollection.get('intent');
			this.title = options.title || main_core.Loc.getMessage('TERMINAL_QR_AUTH_TITLE');
			this.content = options.content || main_core.Loc.getMessage('TERMINAL_QR_AUTH_CONTENT_MSGVER_1');
			this.popup = null;
			this.#createQrAuthorization();
		}
		#createQrAuthorization() {
			if (!this.popup) {
				this.popup = new ui_qrauthorization.QrAuthorization({
					intent: this.intent,
					title: this.title,
					content: this.content,
					popupParam: {
						overlay: true
					}
				});
			}
		}
		show() {
			this.popup.show();
		}
	}

	exports.QrAuth = QrAuth;

})(this.BX.Crm = this.BX.Crm || {}, BX, BX.UI);
//# sourceMappingURL=terminal.bundle.js.map
