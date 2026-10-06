/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_buttons, ui_system_dialog) {
	'use strict';

	const ButtonRole = Object.freeze({
		PRIMARY: 'primary',
		DESTRUCTIVE: 'destructive'
	});
	const ConfirmPreset = Object.freeze({
		YES_NO: 'YES_NO',
		OK_CANCEL: 'OK_CANCEL'
	});
	function getPresetDefaults(preset) {
		if (preset === ConfirmPreset.YES_NO) {
			return {
				confirmText: main_core.Loc.getMessage('CRM_TIMELINE_DIALOG_YES'),
				cancelText: main_core.Loc.getMessage('CRM_TIMELINE_DIALOG_NO')
			};
		}
		return {
			confirmText: main_core.Loc.getMessage('CRM_TIMELINE_DIALOG_OK'),
			cancelText: main_core.Loc.getMessage('CRM_TIMELINE_DIALOG_CANCEL')
		};
	}

	let activeInstance = null;
	function createPrimaryButton(text, role, onclick) {
		return new ui_buttons.Button({
			text,
			size: ui_buttons.ButtonSize.LARGE,
			useAirDesign: true,
			style: role === ButtonRole.DESTRUCTIVE ? ui_buttons.AirButtonStyle.FILLED_ALERT : ui_buttons.AirButtonStyle.FILLED,
			dataset: {
				testid: 'crm-timeline-dialog-confirm-btn'
			},
			onclick
		});
	}
	function createCancelButton(text, onclick) {
		return new ui_buttons.CancelButton({
			text,
			size: ui_buttons.ButtonSize.LARGE,
			useAirDesign: true,
			style: ui_buttons.AirButtonStyle.OUTLINE,
			dataset: {
				testid: 'crm-timeline-dialog-cancel-btn'
			},
			onclick
		});
	}
	function open(options, buildCenterButtons) {
		if (activeInstance) {
			activeInstance.forceDismiss();
		}
		return new Promise(resolve => {
			let settled = false;
			const finish = result => {
				if (settled) {
					return;
				}
				settled = true;
				if (activeInstance === instance) {
					activeInstance = null;
				}
				instance.hide();
				resolve(result);
			};
			const instance = new ui_system_dialog.Dialog({
				title: options.title,
				content: options.content,
				width: options.width,
				hasOverlay: true,
				background: ui_system_dialog.DialogBackground.vibrant,
				closeByEsc: true,
				closeByClickOutside: true,
				centerButtons: buildCenterButtons(finish),
				events: {
					onHide: () => {
						if (!settled) {
							options.onDismiss?.();
							finish('dismiss');
						}
					}
				}
			});
			instance.forceDismiss = () => {
				options.onDismiss?.();
				finish('dismiss');
			};
			activeInstance = instance;
			instance.show();
		});
	}
	function confirm(options) {
		const defaults = getPresetDefaults(options.preset ?? ConfirmPreset.OK_CANCEL);
		const confirmText = options.confirmText ?? defaults.confirmText;
		const cancelText = options.cancelText ?? defaults.cancelText;
		const primaryRole = options.destructive === true ? ButtonRole.DESTRUCTIVE : ButtonRole.PRIMARY;
		return open(options, finish => {
			const primaryButton = createPrimaryButton(confirmText, primaryRole, button => {
				if (main_core.Type.isFunction(options.onConfirm)) {
					button.setWaiting(true);
					Promise.resolve().then(() => options.onConfirm()).then(() => {
						button.setWaiting(false);
						finish('confirm');
					}).catch(() => {
						// диалог остаётся открытым, promise не резолвится (ALG-01)
						button.setWaiting(false);
					});
					return;
				}
				finish('confirm');
			});
			const cancelButton = createCancelButton(cancelText, () => finish('cancel'));
			return [primaryButton, cancelButton];
		});
	}
	function alert(options) {
		const confirmText = options.confirmText ?? main_core.Loc.getMessage('CRM_TIMELINE_DIALOG_OK');
		return open(options, finish => [createPrimaryButton(confirmText, ButtonRole.PRIMARY, () => finish('confirm'))]).then(() => {});
	}

	exports.alert = alert;
	exports.confirm = confirm;

})(this.BX.Crm.Timeline = this.BX.Crm.Timeline || {}, BX, BX.UI, BX.UI.System);
//# sourceMappingURL=dialog.bundle.js.map
