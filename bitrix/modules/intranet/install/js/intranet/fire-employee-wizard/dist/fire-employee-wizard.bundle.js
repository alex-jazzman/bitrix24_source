/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, ui_buttons, ui_dialogs_tooltip) {
	'use strict';

	class FireWizardConfigProvider {
		fetch(userId) {
			return main_core.ajax.runAction('intranet.v2.User.fireWizardConfig', {
				data: {
					userId
				}
			});
		}
		static fetch(userId) {
			return new FireWizardConfigProvider().fetch(userId);
		}
	}

	class MoveWebhookRequest {
		send(userId, options = {}) {
			return main_core.ajax.runAction('intranet.v2.User.moveWebhook', {
				data: {
					userId,
					options
				}
			});
		}
		static send(userId, options = {}) {
			return new MoveWebhookRequest().send(userId, options);
		}
	}

	class FireEmployeeWizard {
		#popup = null;
		#options;
		#id;
		constructor(options = {}) {
			this.#id = 'intranet-fire-employee-wizard';
			this.#options = this.#normalizeOptions(options);
		}
		show() {
			this.#popup = this.#createPopup();
			this.#popup.show();
		}
		close() {
			this.#popup?.close();
		}
		#normalizeOptions(options) {
			return {
				showWebhookActions: main_core.Type.isBoolean(options?.integration?.hasWebhook) ? options?.integration?.hasWebhook : false,
				onConfirm: main_core.Type.isFunction(options.onConfirm) ? options.onConfirm : null,
				onCancel: main_core.Type.isFunction(options.onCancel) ? options.onCancel : null
			};
		}
		#createPopup() {
			if (main_popup.PopupManager.isPopupExists(this.#id)) {
				main_popup.PopupManager.getPopupById(this.#id).destroy();
			}
			const maxPopupWidth = this.#options.showWebhookActions ? 786 : 440;
			const popupWidth = Math.max(288, Math.min(document.documentElement.clientWidth - 32, maxPopupWidth));
			const popupOptions = {
				className: 'intranet-fire-employee-wizard__popup',
				content: this.#renderContent(),
				autoHide: false,
				overlay: true,
				closeByEsc: true,
				closeIcon: false,
				padding: 0,
				width: popupWidth,
				events: {
					onClose: () => {
						popup.destroy();
						if (this.#popup === popup) {
							this.#popup = null;
						}
					}
				}
			};
			const popup = new main_popup.Popup(this.#id, null, popupOptions);
			return popup;
		}
		#renderContent() {
			const content = main_core.Tag.render`
			<div class="intranet-fire-employee-wizard">
				<div class="intranet-fire-employee-wizard__header">
					<div class="intranet-fire-employee-wizard__question">${main_core.Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_QUESTION')}</div>
					<button
						type="button"
						class="intranet-fire-employee-wizard__close-button"
						data-role="close-button"
						aria-label="${main_core.Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_CANCEL')}"
					></button>
				</div>
				<div class="intranet-fire-employee-wizard__content">
					<div class="intranet-fire-employee-wizard__description">
						${main_core.Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_DESCRIPTION')}
					</div>
					${this.#renderWebhookNotice()}
				</div>
				${this.#renderActions()}
			</div>
		`;
			const closeNode = content.querySelector('[data-role="close-button"]');
			main_core.Event.bind(closeNode, 'click', () => {
				this.#handleCancel();
			});
			return content;
		}
		#renderWebhookNotice() {
			if (!this.#options.showWebhookActions) {
				return null;
			}
			const integrationUri = main_core.Extension.getSettings('intranet.fire-employee-wizard').get('integrationUri');
			const integrationLangParams = {
				'[integration_link]': `<a class="intranet-fire-employee-wizard__link" href="${integrationUri}">`,
				'[/integration_link]': '</a>'
			};
			const sysUserLangParams = {
				'[span]': '<span class="intranet-fire-employee-wizard__link-text">',
				'[/span]': '</span>'
			};
			const content = main_core.Tag.render`
			<div class="intranet-fire-employee-wizard__notice">
				<div class="intranet-fire-employee-wizard__notice-title">
					<span>${main_core.Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_INTEGRATION_TITLE', integrationLangParams)}</span>
				</div>
				<div class="intranet-fire-employee-wizard__notice-text">
					<p class="intranet-fire-employee-wizard__notice-paragraph">
						<span>${main_core.Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_INTEGRATION_TEXT_FIRST', sysUserLangParams)}</span>
					</p>
					<p class="intranet-fire-employee-wizard__notice-paragraph">
						<span>${main_core.Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_INTEGRATION_TEXT_THIRD')}</span>
						&nbsp;
						<a
							class="intranet-fire-employee-wizard__link"
							href="#"
							onclick="top.BX.Helper.show('redirect=detail&code=26213326#01');"
						>
							${main_core.Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_INTEGRATION_DETAILS')}
						</a>
					</p>
				</div>
			</div>
		`;
			const systemUserNode = content.querySelector('span.intranet-fire-employee-wizard__link-text');
			main_core.Event.bind(systemUserNode, 'click', () => {
				new ui_dialogs_tooltip.Tooltip({
					bindElement: systemUserNode,
					content: main_core.Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_INTEGRATION_TEXT_SYSTEM_USER_DESCRIPTION'),
					popupOptions: {
						autoHide: true,
						angle: {
							offset: 100
						}
					}
				}).show();
			});
			return content;
		}
		#renderActions() {
			const actions = main_core.Tag.render`
			<div class="intranet-fire-employee-wizard__actions"></div>
		`;
			if (this.#options.showWebhookActions) {
				actions.append(this.#createButton({
					text: main_core.Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_SAVE_AND_FIRE'),
					style: ui_buttons.AirButtonStyle.FILLED,
					className: 'intranet-fire-employee-wizard__button intranet-fire-employee-wizard__button--cancel fire-save-btn',
					onclick: () => this.#handleConfirm(true)
				}).render());
				actions.append(this.#createButton({
					text: main_core.Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_DISABLE_AND_FIRE'),
					style: ui_buttons.AirButtonStyle.OUTLINE_NO_ACCENT,
					className: 'intranet-fire-employee-wizard__button intranet-fire-employee-wizard__button--outline fire-disable-btn',
					onclick: () => this.#handleConfirm(false)
				}).render());
				actions.append(this.#createButton({
					text: main_core.Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_CANCEL'),
					style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
					className: 'intranet-fire-employee-wizard__button intranet-fire-employee-wizard__button--plain fire-cancel-btn',
					onclick: () => this.#handleCancel()
				}).render());
			} else {
				actions.append(this.#createButton({
					text: main_core.Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_CANCEL'),
					style: ui_buttons.AirButtonStyle.FILLED,
					className: 'intranet-fire-employee-wizard__button intranet-fire-employee-wizard__button--cancel fire-cancel-btn',
					onclick: () => this.#handleCancel()
				}).render());
				actions.append(this.#createButton({
					text: main_core.Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_CONFIRM'),
					style: ui_buttons.AirButtonStyle.OUTLINE_NO_ACCENT,
					className: 'intranet-fire-employee-wizard__button intranet-fire-employee-wizard__button--outline fire-confirm-btn',
					onclick: () => this.#handleConfirm(false)
				}).render());
			}
			return actions;
		}
		#createButton(options) {
			return new ui_buttons.Button({
				text: options.text,
				useAirDesign: true,
				style: options.style,
				size: ui_buttons.ButtonSize.EXTRA_LARGE,
				className: options.className,
				noCaps: true,
				onclick: options.onclick
			});
		}
		#handleCancel() {
			this.#options.onCancel?.();
			this.close();
		}
		#handleConfirm(moveWebhooksToSystemUser) {
			this.#options.onConfirm?.(this.#getConfirmData(moveWebhooksToSystemUser));
			this.close();
		}
		#getConfirmData(moveWebhooksToSystemUser) {
			return {
				moveWebhooksToSystemUser
			};
		}
	}

	exports.FireEmployeeWizard = FireEmployeeWizard;
	exports.FireWizardConfigProvider = FireWizardConfigProvider;
	exports.MoveWebhookRequest = MoveWebhookRequest;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Main, BX.UI, BX.UI.Dialogs);
//# sourceMappingURL=fire-employee-wizard.bundle.js.map
