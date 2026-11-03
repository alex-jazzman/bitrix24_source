/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, ui_buttons, ui_system_alert) {
	'use strict';

	const HELP_ARTICLE_CODE = 'redirect=detail&code=26213326#01';
	const POPUP_ID = 'intranet-fire-system-user-wizard';
	const TITLE_ID = `${POPUP_ID}-title`;
	const DESCRIPTION_ID = `${POPUP_ID}-description`;
	const NOTICE_ID = `${POPUP_ID}-notice`;
	const getMessage = code => main_core.Loc.getMessage(code) ?? '';
	const getOwnHelper = () => {
		return window.BX?.Helper ?? null;
	};
	const showHelpArticle = () => {
		let helper = null;
		try {
			helper = top?.BX?.Helper ?? getOwnHelper();
		} catch {
			helper = getOwnHelper();
		}
		helper?.show(HELP_ARTICLE_CODE);
	};
	class FireSystemUserWizard {
		#popup = null;
		#container = null;
		#integrationList = null;
		#integrations;
		#onConfirm;
		#onCancel;
		constructor(options = {}) {
			this.#integrations = FireSystemUserWizard.#normalizeIntegrations(options.integrations);
			this.#onConfirm = main_core.Type.isFunction(options.onConfirm) ? options.onConfirm : null;
			this.#onCancel = main_core.Type.isFunction(options.onCancel) ? options.onCancel : null;
		}
		static hasSystemUser(config) {
			return config?.systemUser?.isSystemUser === true;
		}
		static hasSystemUsers(config) {
			const userIds = config?.systemUser?.userIds;
			return Array.isArray(userIds) && userIds.length > 0;
		}
		static showForConfig(config, handlers) {
			return FireSystemUserWizard.#show(FireSystemUserWizard.hasSystemUser(config), config?.systemUser?.integrations, handlers);
		}
		static showForListConfig(config, handlers) {
			return FireSystemUserWizard.#show(FireSystemUserWizard.hasSystemUsers(config), config?.systemUser?.integrations, handlers);
		}
		static #show(hasSystemUsers, integrations, handlers) {
			if (!hasSystemUsers) {
				handlers.onFallback?.();
				return false;
			}
			new FireSystemUserWizard({
				integrations: integrations ?? [],
				onConfirm: handlers.onConfirm
			}).show();
			return true;
		}
		show() {
			this.#popup = this.#createPopup();
			this.#popup.show();
		}
		close() {
			this.#popup?.close();
		}
		static #normalizeIntegrations(integrations) {
			if (!Array.isArray(integrations)) {
				return [];
			}
			return integrations.filter(integration => main_core.Type.isPlainObject(integration));
		}
		#createPopup() {
			if (main_popup.PopupManager.isPopupExists(POPUP_ID)) {
				main_popup.PopupManager.getPopupById(POPUP_ID)?.destroy();
			}
			const popupWidth = Math.max(288, Math.min(document.documentElement.clientWidth - 32, 786));
			const popup = new main_popup.Popup({
				id: POPUP_ID,
				className: 'intranet-fire-system-user-wizard__popup',
				content: this.#renderContent(),
				autoHide: false,
				overlay: true,
				closeByEsc: true,
				closeIcon: false,
				padding: 0,
				width: popupWidth,
				ariaLabelledBy: TITLE_ID,
				focusTrap: {
					initialFocus: ['[data-autofocus]', 'container']
				},
				events: {
					onAfterShow: () => {
						this.#syncScrollableRegions();
					},
					onClose: () => {
						popup.destroy();
						this.#container = null;
						this.#integrationList = null;
						if (this.#popup === popup) {
							this.#popup = null;
						}
					}
				}
			});
			main_core.Dom.attr(popup.getPopupContainer(), {
				'aria-modal': 'true',
				'aria-describedby': `${DESCRIPTION_ID} ${NOTICE_ID}`
			});
			return popup;
		}
		#syncScrollableRegions() {
			FireSystemUserWizard.#syncScrollableRegion(this.#container);
			FireSystemUserWizard.#syncScrollableRegion(this.#integrationList);
		}
		static #syncScrollableRegion(element) {
			if (element === null) {
				return;
			}
			const isScrollable = element.scrollHeight - element.clientHeight > 1;
			main_core.Dom.attr(element, 'tabindex', isScrollable ? '0' : null);
		}
		#renderContent() {
			const content = main_core.Tag.render`
			<div
				class="intranet-fire-system-user-wizard"
				data-testid="intranet-fire-system-user-wizard"
			>
				<div class="intranet-fire-system-user-wizard__header">
					<div class="intranet-fire-system-user-wizard__title" id="${TITLE_ID}">
						${main_core.Text.encode(getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_TITLE'))}
					</div>
					<button
						type="button"
						class="intranet-fire-system-user-wizard__close-button"
						data-role="close-button"
						aria-label="${main_core.Text.encode(getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_CLOSE'))}"
					></button>
				</div>
				<div class="intranet-fire-system-user-wizard__content">
					<div class="intranet-fire-system-user-wizard__description" id="${DESCRIPTION_ID}">
						${main_core.Text.encode(getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_SUBTITLE'))}
					</div>
					${this.#renderAlert()}
					${this.#renderIntegrationList()}
				</div>
				${this.#renderActions()}
			</div>
		`;
			const closeButton = content.querySelector('[data-role="close-button"]');
			if (closeButton) {
				main_core.Event.bind(closeButton, 'click', () => {
					this.#handleCancel();
				});
			}
			this.#container = content;
			return content;
		}
		#renderAlert() {
			const alertContent = main_core.Tag.render`
			<div class="intranet-fire-system-user-wizard__notice" id="${NOTICE_ID}" role="alert">
				<span>${main_core.Text.encode(getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_NOTICE'))}</span>
				&nbsp;
				<button
					type="button"
					class="intranet-fire-system-user-wizard__link"
					data-role="help-link"
					aria-label="${main_core.Text.encode(getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_DETAILS_ARIA'))}"
				>
					${main_core.Text.encode(getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_DETAILS'))}
				</button>
			</div>
		`;
			const helpLink = alertContent.querySelector('[data-role="help-link"]');
			if (helpLink) {
				main_core.Event.bind(helpLink, 'click', () => {
					showHelpArticle();
				});
			}
			return new ui_system_alert.Alert({
				design: ui_system_alert.AlertDesign.tintedAlert,
				content: alertContent
			}).render();
		}
		#renderIntegrationList() {
			if (this.#integrations.length === 0) {
				return null;
			}
			const list = main_core.Tag.render`
			<ul
				class="intranet-fire-system-user-wizard__integrations"
				data-testid="intranet-fire-system-user-wizard-integrations"
				aria-label="${main_core.Text.encode(getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_INTEGRATIONS_LIST'))}"
			></ul>
		`;
			this.#integrations.forEach(integration => {
				list.append(main_core.Tag.render`
				<li
					class="intranet-fire-system-user-wizard__integration --${main_core.Text.encode(integration.type)}"
					data-testid="intranet-fire-system-user-wizard-integration"
				>
					${main_core.Text.encode(FireSystemUserWizard.#getIntegrationTitle(integration))}
				</li>
			`);
			});
			this.#integrationList = list;
			return list;
		}
		static #getIntegrationTitle(integration) {
			if (main_core.Type.isStringFilled(integration.title)) {
				return integration.title;
			}
			return integration.type === 'webhook' ? getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_UNTITLED_WEBHOOK') : getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_UNTITLED_APP');
		}
		#renderActions() {
			const actions = main_core.Tag.render`
			<div class="intranet-fire-system-user-wizard__actions"></div>
		`;
			actions.append(this.#createButton(getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_CONFIRM'), ui_buttons.AirButtonStyle.FILLED, 'intranet-fire-system-user-wizard__button--confirm', 'intranet-fire-system-user-wizard-confirm-btn', () => this.#handleConfirm()));
			const cancelButton = this.#createButton(getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_CANCEL'), ui_buttons.AirButtonStyle.OUTLINE_NO_ACCENT, 'intranet-fire-system-user-wizard__button--cancel', 'intranet-fire-system-user-wizard-cancel-btn', () => this.#handleCancel());
			main_core.Dom.attr(cancelButton, 'data-autofocus', '');
			actions.append(cancelButton);
			return actions;
		}
		#createButton(text, style, className, testId, handler) {
			const options = {
				text,
				useAirDesign: true,
				style,
				size: ui_buttons.ButtonSize.EXTRA_LARGE,
				className: `intranet-fire-system-user-wizard__button ${className}`,
				noCaps: true,
				dataset: {
					testid: testId
				},
				onclick: () => {
					handler();
					return {};
				}
			};
			return new ui_buttons.Button(options).render();
		}
		#handleCancel() {
			this.#onCancel?.();
			this.close();
		}
		#handleConfirm() {
			this.#onConfirm?.();
			this.close();
		}
	}

	class SystemUserConfigProvider {
		static fetchForList(fields) {
			return main_core.ajax.runAction('intranet.v2.UserList.fireWizardConfig', {
				data: {
					fields
				}
			});
		}
	}

	exports.FireSystemUserWizard = FireSystemUserWizard;
	exports.SystemUserConfigProvider = SystemUserConfigProvider;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Main, BX.UI, BX.UI.System.Alert);
//# sourceMappingURL=fire-system-user-wizard.bundle.js.map
