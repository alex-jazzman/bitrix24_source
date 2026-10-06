/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Client = this.BX.Mail.Client || {};
(function (exports, main_core, main_loader, main_popup, ui_buttons) {
	'use strict';

	exports.ActionPosition = void 0;
	(function (ActionPosition) {
		ActionPosition["center"] = "center";
		ActionPosition["left"] = "left";
	})(exports.ActionPosition || (exports.ActionPosition = {}));
	exports.ContentPosition = void 0;
	(function (ContentPosition) {
		ContentPosition["center"] = "center";
		ContentPosition["left"] = "left";
	})(exports.ContentPosition || (exports.ContentPosition = {}));
	class BaseDialog {
		#popup = null;
		#bodyElement;
		#headerElement;
		#titleElement;
		#contentContainer;
		#actionsContainer;
		#buttons = new Map();
		#options;
		#loader = null;
		constructor(options = {}) {
			this.#options = {
				id: options.id ?? 'mail-client-dialog',
				title: options.title ?? '',
				width: options.width ?? 490,
				cacheable: options.cacheable ?? false
			};
		}
		show() {
			if (this.#popup) {
				this.#popup.destroy();
				this.#popup = null;
			}
			this.#popup = this.#createPopup();
			this.#popup.show();
		}
		close() {
			this.#popup?.close();
		}
		getPopup() {
			return this.#popup;
		}
		setContent(node) {
			if (this.#contentContainer) {
				main_core.Dom.clean(this.#contentContainer);
				main_core.Dom.append(node, this.#contentContainer);
				this.#popup?.adjustPosition();
			}
		}
		setContentAlign(align) {
			if (!this.#contentContainer) {
				return;
			}
			main_core.Dom.removeClass(this.#contentContainer, 'mail__client_dialog_base-dialog_content--center');
			main_core.Dom.removeClass(this.#contentContainer, 'mail__client_dialog_base-dialog_content--left');
			main_core.Dom.addClass(this.#contentContainer, `mail__client_dialog_base-dialog_content--${align}`);
		}
		setActions(configuration) {
			main_core.Dom.clean(this.#actionsContainer);
			this.#buttons.clear();
			if (!this.#actionsContainer.parentNode) {
				main_core.Dom.append(this.#actionsContainer, this.#bodyElement);
			}
			this.setActionsAlign(configuration.position ?? exports.ActionPosition.left);
			configuration.actions.forEach(action => {
				const button = new ui_buttons.Button({
					text: action.text,
					style: action.style,
					size: ui_buttons.ButtonSize.LARGE,
					useAirDesign: true,
					onclick: action.onclick
				});
				if (action.id) {
					this.#buttons.set(action.id, button);
				}
				main_core.Dom.append(button.render(), this.#actionsContainer);
			});
		}
		setActionsAlign(align) {
			this.#actionsContainer.className = 'mail__client_dialog_base-dialog_actions';
			main_core.Dom.addClass(this.#actionsContainer, `mail__client_dialog_base-dialog_actions--${align}`);
		}
		hideActions() {
			main_core.Dom.remove(this.#actionsContainer);
			this.#buttons.clear();
		}
		setTitle(title) {
			if (title?.length > 0) {
				this.#titleElement.textContent = title;
				if (!this.#headerElement.parentNode) {
					main_core.Dom.prepend(this.#headerElement, this.#bodyElement);
				}
			} else {
				this.#titleElement.textContent = '';
				main_core.Dom.remove(this.#headerElement);
			}
		}
		setBodyPadding(padding) {
			if (this.#bodyElement) {
				main_core.Dom.style(this.#bodyElement, 'padding', padding);
			}
		}
		setWidth(width) {
			this.#popup?.setWidth(width);
		}
		showCloseIcon() {
			const container = this.#popup?.getPopupContainer();
			if (container) {
				main_core.Dom.removeClass(container, 'mail__client_dialog_base-dialog--hide-close-icon');
			}
		}
		hideCloseIcon() {
			const container = this.#popup?.getPopupContainer();
			if (container) {
				main_core.Dom.addClass(container, 'mail__client_dialog_base-dialog--hide-close-icon');
			}
		}
		getButton(id) {
			return this.#buttons.get(id) ?? null;
		}
		showLoader() {
			const loaderTarget = main_core.Tag.render`
			<div class="mail__client_dialog_base-dialog_loader"></div>
		`;
			this.setTitle('');
			this.setContent(loaderTarget);
			this.hideActions();
			this.#loader = new main_loader.Loader({
				size: 60,
				mode: 'inline'
			});
			this.#loader.show(loaderTarget);
		}
		hideLoader() {
			this.#loader?.destroy();
			this.#loader = null;
			this.setTitle(this.#options.title);
		}
		async doBeforeShowContent(options) {
			const useLoader = options.showLoader ?? false;
			if (useLoader) {
				this.showLoader();
			}
			try {
				return await options.action();
			} finally {
				if (useLoader) {
					this.hideLoader();
				}
			}
		}
		#createPopup() {
			this.#titleElement = main_core.Tag.render`
			<span class="mail__client_dialog_base-dialog_title">
				${this.#options.title}
			</span>
		`;
			this.#headerElement = main_core.Tag.render`
			<div class="mail__client_dialog_base-dialog_header">
				${this.#titleElement}
			</div>
		`;
			this.#contentContainer = main_core.Tag.render`
			<div class="mail__client_dialog_base-dialog_content"></div>
		`;
			this.#actionsContainer = main_core.Tag.render`
			<div class="mail__client_dialog_base-dialog_actions"></div>
		`;
			this.#bodyElement = main_core.Tag.render`
			<div class="mail__client_dialog_base-dialog_body">
				${this.#headerElement}
				${this.#contentContainer}
				${this.#actionsContainer}
			</div>
		`;
			const popup = main_popup.PopupManager.create({
				id: this.#options.id,
				className: 'mail__client_dialog_base-dialog --ui-context-content-light',
				content: this.#bodyElement,
				closeIcon: true,
				closeIconSize: main_popup.CloseIconSize.LARGE,
				closeByEsc: true,
				overlay: true,
				autoHide: true,
				cacheable: this.#options.cacheable,
				width: this.#options.width,
				borderRadius: '18px',
				contentPadding: 0,
				padding: 0,
				events: {
					onClose: () => {
						this.#popup?.destroy();
						this.#popup = null;
						this.hideLoader();
						this.onClose();
					}
				}
			});
			return popup;
		}
		onClose() {
		}
	}

	exports.BaseDialog = BaseDialog;

})(this.BX.Mail.Client.Dialog = this.BX.Mail.Client.Dialog || {}, BX, BX, BX.Main, BX.UI);
//# sourceMappingURL=base-dialog.bundle.js.map
