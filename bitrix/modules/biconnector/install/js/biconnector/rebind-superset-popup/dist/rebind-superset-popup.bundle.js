/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, biconnector_cardSelectPopup) {
	'use strict';

	const ACTION_REBIND = 'rebind';
	const ACTION_DISABLE = 'disable';
	class RebindSupersetPopup {
		#popup;
		#settingsUrl;
		constructor({
			settingsUrl = ''
		} = {}) {
			this.#settingsUrl = settingsUrl;
			this.#popup = new biconnector_cardSelectPopup.CardSelectPopup({
				title: main_core.Loc.getMessage('BICONNECTOR_REBIND_POPUP_TITLE'),
				applyButtonText: main_core.Loc.getMessage('BICONNECTOR_REBIND_POPUP_APPLY_BTN'),
				cancelButtonText: main_core.Loc.getMessage('BICONNECTOR_REBIND_POPUP_CANCEL_BTN'),
				cards: [{
					id: ACTION_REBIND,
					title: main_core.Loc.getMessage('BICONNECTOR_REBIND_POPUP_REBIND_TITLE'),
					description: main_core.Loc.getMessage('BICONNECTOR_REBIND_POPUP_REBIND_DESCRIPTION')
				}, {
					id: ACTION_DISABLE,
					title: main_core.Loc.getMessage('BICONNECTOR_REBIND_POPUP_DISABLE_TITLE'),
					description: main_core.Loc.getMessage('BICONNECTOR_REBIND_POPUP_DISABLE_DESCRIPTION')
				}]
			});
		}
		show() {
			this.#popup.show(action => {
				this.#handleAction(action);
			});
		}
		hide() {
			this.#popup.hide();
		}
		#handleAction(action) {
			switch (action) {
				case ACTION_REBIND:
					this.#popup.setLoading(true);
					this.#rebindSuperset();
					break;
				case ACTION_DISABLE:
					BX.SidePanel.Instance.open(this.#settingsUrl, {
						cacheable: false,
						width: 1034
					});
					break;
			}
		}
		#rebindSuperset() {
			main_core.ajax.runAction('biconnector.superset.rebindSuperset').then(() => {
				location.reload();
			}).catch(response => {
				this.#processErrorResponse(response);
			});
		}
		#processErrorResponse(response) {
			if (response.errors && main_core.Type.isStringFilled(response.errors[0]?.message)) {
				BX.UI.Notification.Center.notify({
					content: main_core.Text.encode(response.errors[0].message)
				});
			}
			this.#popup.setLoading(false);
		}
	}

	exports.RebindSupersetPopup = RebindSupersetPopup;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.BIConnector);
//# sourceMappingURL=rebind-superset-popup.bundle.js.map
