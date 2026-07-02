/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, biconnector_cardSelectPopup) {
	'use strict';

	const ACTION_RESTORE = 'restore';
	const ACTION_RESET = 'reset';
	class RestoreSupersetPopup {
		#popup;
		#formNode;
		#toolCode;
		constructor(options = {}) {
			this.#formNode = options.formNode ?? null;
			this.#toolCode = options.toolCode ?? null;
			this.#popup = new biconnector_cardSelectPopup.CardSelectPopup({
				title: main_core.Loc.getMessage('BICONNECTOR_RESTORE_POPUP_TITLE'),
				cards: [{
					id: ACTION_RESTORE,
					title: main_core.Loc.getMessage('BICONNECTOR_RESTORE_POPUP_RESTORE_TITLE'),
					description: main_core.Loc.getMessage('BICONNECTOR_RESTORE_POPUP_RESTORE_DESCRIPTION')
				}, {
					id: ACTION_RESET,
					title: main_core.Loc.getMessage('BICONNECTOR_RESTORE_POPUP_RESET_TITLE'),
					description: main_core.Loc.getMessage('BICONNECTOR_RESTORE_POPUP_RESET_DESCRIPTION')
				}]
			});
		}
		show() {
			// in the rare case superset was deleted while the slider was open
			return Promise.resolve(main_core.ajax.runAction('biconnector.superset.isEnableConfirmationNeeded')).catch(() => null).then(response => {
				if (response?.data?.isNeeded === false) {
					return '';
				}
				return new Promise(resolve => {
					this.#popup.show(action => {
						this.#popup.hide();
						this.#setEnableMode(action);
						resolve(action);
					}, () => {
						resolve('');
					});
				});
			});
		}
		#setEnableMode(mode) {
			if (!this.#formNode || !this.#toolCode) {
				return;
			}
			const inputName = this.#toolCode + '_enable_mode';
			let input = this.#formNode.querySelector(`input[name="${inputName}"]`);
			if (!input) {
				input = main_core.Tag.render`<input type="hidden" name="${inputName}">`;
				this.#formNode.appendChild(input);
			}
			input.value = mode;
		}
	}

	exports.RestoreSupersetPopup = RestoreSupersetPopup;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.BIConnector);
//# sourceMappingURL=restore-superset-popup.bundle.js.map
