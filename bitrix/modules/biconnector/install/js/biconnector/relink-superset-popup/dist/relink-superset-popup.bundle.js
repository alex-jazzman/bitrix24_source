/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, biconnector_cardSelectPopup) {
	'use strict';

	const ACTION_TRANSFER = 'transfer';
	const ACTION_CREATE_NEW = 'create_new';
	const ACTION_DISABLE = 'disable';
	class RelinkSupersetPopup {
		#popup;
		constructor() {
			this.#popup = new biconnector_cardSelectPopup.CardSelectPopup({
				title: main_core.Loc.getMessage('BICONNECTOR_RELINK_POPUP_TITLE'),
				applyButtonText: main_core.Loc.getMessage('BICONNECTOR_RELINK_POPUP_APPLY_BTN'),
				cancelButtonText: main_core.Loc.getMessage('BICONNECTOR_RELINK_POPUP_CANCEL_BTN'),
				cards: [{
					id: ACTION_TRANSFER,
					title: main_core.Loc.getMessage('BICONNECTOR_RELINK_POPUP_TRANSFER_TITLE'),
					description: main_core.Loc.getMessage('BICONNECTOR_RELINK_POPUP_TRANSFER_DESCRIPTION')
				}, {
					id: ACTION_CREATE_NEW,
					title: main_core.Loc.getMessage('BICONNECTOR_RELINK_POPUP_CREATE_NEW_TITLE'),
					description: main_core.Loc.getMessage('BICONNECTOR_RELINK_POPUP_CREATE_NEW_DESCRIPTION')
				}, {
					id: ACTION_DISABLE,
					title: main_core.Loc.getMessage('BICONNECTOR_RELINK_POPUP_DISABLE_TITLE'),
					description: main_core.Loc.getMessage('BICONNECTOR_RELINK_POPUP_DISABLE_DESCRIPTION')
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
			this.#popup.setLoading(true);
			switch (action) {
				case ACTION_TRANSFER:
					this.#transferSuperset();
					break;
				case ACTION_CREATE_NEW:
					this.#createNewSuperset();
					break;
				case ACTION_DISABLE:
					this.#disableSuperset();
					break;
			}
		}
		#transferSuperset() {
			main_core.ajax.runAction('biconnector.superset.linkAddress').then(() => {
				location.reload();
			}).catch(response => {
				this.#processErrorResponse(response);
			});
		}
		#createNewSuperset() {
			main_core.ajax.runAction('biconnector.superset.deleteLocal').then(() => {
				location.reload();
			}).catch(response => {
				this.#processErrorResponse(response);
			});
		}
		#disableSuperset() {
			main_core.ajax.runAction('biconnector.superset.deleteLocal', {
				data: {
					disableTool: true
				}
			}).then(() => {
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

	exports.RelinkSupersetPopup = RelinkSupersetPopup;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.BIConnector);
//# sourceMappingURL=relink-superset-popup.bundle.js.map
