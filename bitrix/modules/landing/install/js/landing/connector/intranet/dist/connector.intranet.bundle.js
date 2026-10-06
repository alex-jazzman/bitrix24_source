/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, landing_loc, ui_dialogs_messagebox) {
	'use strict';

	class Intranet {
		static unbindMenuItem(bindCode, entityId, title) {
			ui_dialogs_messagebox.MessageBox.confirm(landing_loc.Loc.getMessage('LANDING_CONNECTOR_INTRANET_HIDE_ALERT_MESSAGE'), landing_loc.Loc.getMessage('LANDING_CONNECTOR_INTRANET_HIDE_ALERT_TITLE').replaceAll('#title#', title), () => {
				BX.ajax({
					url: BX.message('SITE_DIR') + 'kb/binding/menu/',
					method: 'POST',
					data: {
						action: 'unbind',
						param: entityId,
						menuId: bindCode,
						sessid: BX.message('bitrix_sessid'),
						actionType: 'json'
					},
					dataType: 'json',
					onsuccess: data => {
						if (data) {
							top.window.location.reload();
						}
					}
				});
			}, landing_loc.Loc.getMessage('LANDING_CONNECTOR_INTRANET_HIDE_ALERT_BUTTON'), null, null, true);
		}
	}

	exports.Intranet = Intranet;

})(this.BX.Landing.Connector = this.BX.Landing.Connector || {}, BX.Landing, BX.UI.Dialogs);
//# sourceMappingURL=connector.intranet.bundle.js.map
