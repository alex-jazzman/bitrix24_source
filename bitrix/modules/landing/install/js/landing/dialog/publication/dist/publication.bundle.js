/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, main_core, ui_dialogs_messagebox) {
	'use strict';

	/**
	example:
	var instance = new BX.Landing.Dialog.Publication.getInstance({
		landingId: this.id,
		siteId: this.siteId,
		url: this.url
	});
	instance.publication(
		(mode !== 'landing') ? 'site' : 'landing'
	);
	*/

	class Publication {
		static instance = null;
		dialog = null;
		constructor(options) {
			this.siteId = options.siteId;
			this.landingId = options.landingId;
			this.url = options.url;
		}
		static getInstance(options) {
			if (!Publication.instance) {
				Publication.instance = new Publication(options);
			}
			return Publication.instance;
		}
		publication(mode) {
			const action = mode === 'site' ? 'Site::publication' : 'Landing::publication';
			const data = {
				data: mode === 'site' ? {
					id: this.siteId
				} : {
					lid: this.landingId
				},
				actionType: 'rest',
				sessid: BX.message('bitrix_sessid')
			};
			this.renderPopup();
			BX.ajax({
				url: main_core.Uri.addParam(window.location.href, {
					action
				}),
				data,
				dataType: 'json',
				method: 'POST',
				onsuccess: result => {
					if (result.type === 'error') {
						console.log(result.result);
						this.renderErrorPopupContent(result.result[0].error_description);
					} else {
						this.renderSuccessPopupContent();
					}
				}
			});
		}
		renderPopup() {
			if (!this.dialog) {
				this.dialog = new ui_dialogs_messagebox.MessageBox({
					title: 'Publication',
					message: '',
					useAirDesign: true,
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK,
					onOk: () => this.dialog.close(),
					popupOptions: {
						closeByEsc: true,
						minHeight: false,
						minWidth: 260,
						maxWidth: 300,
						width: false,
						animation: 'fading-slide'
					}
				});
			}
			this.renderWaitPopupContent();
			this.dialog.show();
		}
		renderContent(status) {
			this.dialog.setMessage(main_core.Tag.render`
			<div class="ui-publication" style="padding: 0 25px;">
				<div>Publication dialog</div>
				<div>URL: <a href="${this.url}" target="_blank">${this.url}</a></div>
				${status}
			</div>
		`);
		}
		renderWaitPopupContent() {
			this.renderContent(main_core.Tag.render`
			<span class="ui-publication-name">Please wait...</span>
		`);
		}
		renderSuccessPopupContent() {
			this.renderContent(main_core.Tag.render`
			<span class="ui-publication-name">SUCCESS!</span>
		`);
		}
		renderErrorPopupContent(error) {
			this.renderContent(main_core.Tag.render`
			<span class="ui-publication-name">ERROR! ${error}</span>
		`);
		}
	}

	exports.Publication = Publication;

})(this.BX.Landing.Dialog = this.BX.Landing.Dialog || {}, BX, BX.UI.Dialogs);
//# sourceMappingURL=publication.bundle.js.map
