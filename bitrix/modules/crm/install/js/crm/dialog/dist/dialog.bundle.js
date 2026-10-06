/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_buttons, ui_system_dialog) {
	'use strict';

	class ConfirmationDialog {
		static items = {};
		static get(id) {
			return this.items[id] ?? null;
		}
		static create(id, settings) {
			const self = new ConfirmationDialog();
			self.initialize(id, settings);
			this.items[id] = self;
			return self;
		}
		initialize(id, settings) {
			this._id = id;
			this._settings = settings ?? {};
			this._dialog = null;
			this._promise = null;
			this._isOpened = false;
		}
		getId() {
			return this._id;
		}
		isOpened() {
			return this._isOpened;
		}
		open() {
			if (this._isOpened) {
				return this._promise;
			}
			const acceptButton = new ui_buttons.Button({
				text: this._settings.acceptButtonTitle ?? main_core.Loc.getMessage('JS_CORE_WINDOW_CONTINUE'),
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				onclick: () => this.onConfirm()
			});
			const cancelButton = new ui_buttons.Button({
				text: this._settings.cancelButtonTitle ?? main_core.Loc.getMessage('JS_CORE_WINDOW_CANCEL'),
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				useAirDesign: true,
				onclick: () => this.onCancel()
			});
			this._dialog = new ui_system_dialog.Dialog({
				title: this._settings.title ?? 'untitled',
				content: this._renderContent(this._settings.content ?? '-'),
				centerButtons: [acceptButton, cancelButton],
				hasCloseButton: true,
				closeByEsc: true,
				hasOverlay: true,
				width: 480,
				background: this._settings.background,
				events: {
					onShow: () => {
						this._isOpened = true;
					},
					onHide: () => {
						this._isOpened = false;
						if (this._promise) {
							this._promise.fulfill({
								cancel: true
							});
							this._promise = null;
						}
					}
				}
			});
			this._promise = new BX.Promise();
			this._dialog.show();
			return this._promise;
		}
		close() {
			this._dialog?.hide();
		}
		onConfirm() {
			if (this._promise) {
				this._promise.fulfill({
					cancel: false
				});
				this._promise = null;
			}
			this.close();
		}
		onCancel() {
			if (this._promise) {
				this._promise.fulfill({
					cancel: true
				});
				this._promise = null;
			}
			this.close();
		}
		_renderContent(content) {
			if (main_core.Type.isDomNode(content)) {
				return content;
			}
			return main_core.Dom.create('div', {
				html: content
			});
		}
	}

	class NotificationDialog {
		static items = {};
		static get(id) {
			return this.items[id] ?? null;
		}
		static create(id, settings) {
			const self = new NotificationDialog();
			self.initialize(id, settings);
			this.items[id] = self;
			return self;
		}
		initialize(id, settings) {
			this._id = id;
			this._settings = settings ?? {};
			this._dialog = null;
			this._promise = null;
		}
		getId() {
			return this._id;
		}
		open() {
			const closeButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('JS_CORE_WINDOW_CLOSE'),
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				useAirDesign: true,
				onclick: () => this.onClose()
			});
			this._dialog = new ui_system_dialog.Dialog({
				title: this._settings.title ?? 'untitled',
				content: this._renderContent(this._settings.content ?? '-'),
				centerButtons: [closeButton],
				hasCloseButton: true,
				closeByEsc: true,
				hasOverlay: true,
				width: 480,
				// applied as min/max width by ui.system.dialog
				events: {
					onHide: () => {
						if (this._promise) {
							this._promise.fulfill({});
							this._promise = null;
						}
					}
				}
			});
			this._promise = new BX.Promise();
			this._dialog.show();
			return this._promise;
		}
		close() {
			this._dialog?.hide();
		}
		onClose() {
			if (this._promise) {
				this._promise.fulfill({});
				this._promise = null;
			}
			this.close();
		}
		_renderContent(content) {
			if (main_core.Type.isDomNode(content)) {
				return content;
			}
			return main_core.Dom.create('div', {
				html: content
			});
		}
	}

	BX.namespace('BX.Crm');
	if (typeof BX.Crm.DialogButtonType === 'undefined') {
		BX.Crm.DialogButtonType = {
			undefined: 0,
			accept: 1,
			cancel: 2,
			names: {
				accept: 'accept',
				cancel: 'cancel'
			}
		};
	}
	BX.Crm.ConfirmationDialog = ConfirmationDialog;
	BX.Crm.NotificationDialog = NotificationDialog;

	exports.ConfirmationDialog = ConfirmationDialog;
	exports.NotificationDialog = NotificationDialog;

})(this.BX.Crm = this.BX.Crm || {}, BX, BX.UI, BX.UI.System);
//# sourceMappingURL=dialog.bundle.js.map
