/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_notification, biconnector_errorMessage, main_loader, ui_buttons, ui_system_dialog) {
	'use strict';

	function phrase(code, replacements) {
		return main_core.Loc.getMessage(code, replacements) ?? '';
	}

	class BanConfirmation {
		#dialog;
		#confirmButton;
		#result;
		#isConfirmed = false;
		#isClosed = false;
		#isClosedByCaller = false;
		constructor() {
			const confirmText = phrase('BICONNECTOR_SHARE_BAN_DIALOG_BAN_BUTTON');
			this.#confirmButton = createButton(confirmText, ui_buttons.AirButtonStyle.FILLED, () => {
				this.#isConfirmed = true;
				this.#dialog.hide();
			});
			this.#confirmButton.setDisabled(true);
			const loaderNode = main_core.Tag.render`<div class="biconnector-share-ban-dialog-popup-loader"></div>`;
			void new main_loader.Loader({
				target: loaderNode,
				size: 40
			}).show();
			const cancelText = phrase('BICONNECTOR_SHARE_BAN_DIALOG_CANCEL');
			this.#dialog = new ui_system_dialog.Dialog({
				content: loaderNode,
				centerButtons: [this.#confirmButton, createButton(cancelText, ui_buttons.AirButtonStyle.PLAIN, () => this.#dialog.hide())],
				hasOverlay: true,
				width: 480
			});
			this.#result = new Promise(resolve => {
				this.#dialog.subscribe('onHide', () => {
					this.#isClosed = true;
					resolve(this.#isConfirmed);
				});
			});
		}
		show() {
			this.#dialog.show();
		}
		setSummary(summary) {
			this.#dialog.setTitle(phrase('BICONNECTOR_SHARE_BAN_DIALOG_BAN_TITLE', {
				'#TITLE#': summary.title
			}));
			this.#dialog.setContent(main_core.Tag.render`<div class="biconnector-share-ban-dialog-popup-content">${buildBanContent(summary)}</div>`);
			this.#confirmButton.setDisabled(false);
		}
		getResult() {
			return this.#result;
		}
		close() {
			if (!this.#isClosed) {
				this.#isClosedByCaller = true;
				this.#dialog.hide();
			}
		}
		isClosed() {
			return this.#isClosed;
		}
		isCancelled() {
			return this.#isClosed && !this.#isClosedByCaller;
		}
	}
	function buildBanContent(summary) {
		if (summary.activeCount <= 0) {
			return phrase('BICONNECTOR_SHARE_BAN_DIALOG_BAN_TEXT_EMPTY');
		}
		const countLine = main_core.Loc.getMessagePlural('BICONNECTOR_SHARE_BAN_DIALOG_BAN_TEXT_COUNT', summary.activeCount, {
			'#COUNT#': String(summary.activeCount)
		}) ?? '';
		return `${countLine} ${phrase('BICONNECTOR_SHARE_BAN_DIALOG_BAN_TEXT_ACTIVE')}`;
	}
	function createButton(text, style, onClick) {
		const options = {
			text,
			size: ui_buttons.ButtonSize.LARGE,
			style,
			useAirDesign: true,
			onclick: () => {
				onClick();
				return {};
			}
		};
		return new ui_buttons.Button(options);
	}

	class ShareBanDialog {
		static async ban(dashboardId) {
			let confirmation = new BanConfirmation();
			confirmation.show();
			const summary = await runWithRetry('getDashboardShareSummary', dashboardId, phrase('BICONNECTOR_SHARE_BAN_DIALOG_ERROR_SUMMARY'), () => confirmation.close());
			if (summary === null || confirmation.isCancelled()) {
				return null;
			}
			if (summary.isBanned) {
				confirmation.close();
				return true;
			}
			if (confirmation.isClosed()) {
				confirmation = new BanConfirmation();
				confirmation.show();
			}
			confirmation.setSummary(summary);
			if (!(await confirmation.getResult())) {
				return null;
			}
			const result = await runWithRetry('banDashboard', dashboardId, phrase('BICONNECTOR_SHARE_BAN_DIALOG_ERROR_BAN'));
			return result?.isBanned ?? null;
		}
		static async unban(dashboardId) {
			const result = await runWithRetry('unbanDashboard', dashboardId, phrase('BICONNECTOR_SHARE_BAN_DIALOG_ERROR_UNBAN'));
			return result?.isBanned ?? null;
		}
	}
	function runWithRetry(action, dashboardId, fallbackPhrase, onError = () => {}) {
		return main_core.ajax.runAction(`biconnector.sharecontrol.${action}`, {
			data: {
				dashboardId
			}
		}).then(response => response.data).catch(response => new Promise(resolve => {
			let isRetrying = false;
			onError();
			ui_notification.Center.notify({
				content: biconnector_errorMessage.resolveErrorHtml(response, fallbackPhrase),
				actions: [{
					title: phrase('BICONNECTOR_SHARE_BAN_DIALOG_RETRY'),
					events: {
						click: (event, balloon) => {
							isRetrying = true;
							balloon?.close();
							resolve(runWithRetry(action, dashboardId, fallbackPhrase, onError));
						}
					}
				}],
				events: {
					onClose: () => {
						if (!isRetrying) {
							resolve(null);
						}
					}
				}
			});
		}));
	}

	exports.ShareBanDialog = ShareBanDialog;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.UI.Notification, BX.BIConnector, BX, BX.UI, BX.UI.System);
//# sourceMappingURL=share-ban-dialog.bundle.js.map
