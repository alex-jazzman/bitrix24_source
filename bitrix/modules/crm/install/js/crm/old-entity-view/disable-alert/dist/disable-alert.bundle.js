/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_designTokens, ui_designTokens_air, ui_dialogs_messagebox, ui_notification, ui_buttons, crm_router, ui_analytics, crm_integration_analytics) {
	'use strict';

	class OldEntityDisableAlertContent {
		#alertContainer;
		#daysUntilDisable;
		#isAdmin;
		#lastTimeShownField;
		#lastTimeShownOptionName;
		#previewHref;
		constructor(alertContainer, options) {
			if (!main_core.Type.isInteger(options.daysUntilDisable)) {
				throw new TypeError('OldCardLayout.DisableAlert: \'daysUntilDisable\' must be integer');
			}
			if (!main_core.Type.isBoolean(options.isAdmin)) {
				throw new TypeError('OldCardLayout.DisableAlert: \'isAdmin\' must be boolean');
			}
			if (!main_core.Type.isString(options.lastTimeShownField)) {
				throw new TypeError('OldCardLayout.DisableAlert: \'lastTimeShownField\' must be string');
			}
			if (!main_core.Type.isString(options.lastTimeShownOptionName)) {
				throw new TypeError('OldCardLayout.DisableAlert: \'lastTimeShownOptionName\' must be string');
			}
			if (!main_core.Type.isString(options.previewHref)) {
				throw new TypeError('OldCardLayout.DisableAlert: \'previewHref\' must be string');
			}
			this.#alertContainer = alertContainer;
			this.#daysUntilDisable = options.daysUntilDisable;
			this.#isAdmin = options.isAdmin;
			this.#lastTimeShownField = options.lastTimeShownField;
			this.#lastTimeShownOptionName = options.lastTimeShownOptionName;
			this.#previewHref = options.previewHref;
		}
		createNode() {
			const previewButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_SHOW_PREVIEW_TEXT'),
				useAirDesign: true,
				style: ui_buttons.Button.AirStyle.OUTLINE,
				size: ui_buttons.Button.Size.SMALL,
				onclick: () => {
					crm_router.Router.openSlider(this.#previewHref, {
						allowChangeHistory: false
					});
				}
			});
			const {
				root,
				buttonContainer,
				closeButton
			} = main_core.Tag.render`
			<div class="crm-old-layout-disable-alert">
				<div class="crm-old-layout-left-part">
					<span class="crm-old-layout-icon"></span>
				</div>
				<div class="crm-old-layout-right-part">
					<h4 class="crm-old-layout-title ui-typography-heading-h4">
						${this.#getTitleText()}
					</h4>
					<p class="crm-old-layout-text ui-typography-text-md">
						${this.#getText()}
					</p>
					<div class="crm-old-layout-buttons" ref="buttonContainer">
						${previewButton.getContainer()}
					</div>
				</div>
				<button class="crm-old-layout-close-button" ref="closeButton">
				</button>
			</div>
		`;
			const aboutLink = root.querySelector('.crm-old-layout-helpdesk-link');
			main_core.Event.bind(aboutLink, 'click', () => {
				top.BX.Helper.show('redirect=detail&code=26179574');
			});
			if (this.#isAdmin) {
				const showConfirmationButton = new ui_buttons.Button({
					text: main_core.Loc.getMessage('CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_ENABLE_NEW_LAYOUT_TEXT'),
					useAirDesign: true,
					style: ui_buttons.Button.AirStyle.OUTLINE,
					size: ui_buttons.Button.Size.SMALL,
					onclick: () => {
						this.#showConfirmationPopup();
					}
				});
				showConfirmationButton.renderTo(buttonContainer);
			}
			main_core.Event.bind(closeButton, 'click', () => {
				const currentTimeInMs = Date.now();
				const currentTimeInS = Math.round(currentTimeInMs / 1000);
				BX.userOptions.save('crm', this.#lastTimeShownField, this.#lastTimeShownOptionName, currentTimeInS);
				this.#alertContainer.remove();
			});
			return root;
		}
		#sendEnableNewLayoutRequest() {
			BX.ajax.runAction('crm.oldentityview.sunset.enableNewCardLayout').then(() => {
				window.location.reload();
			}).catch(() => {
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_ENABLE_NEW_LAYOUT_ERROR_MESSAGE')
				});
			});
		}
		#showConfirmationPopup() {
			const confirmationPopup = ui_dialogs_messagebox.MessageBox.create({
				message: main_core.Loc.getMessage('CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_ENABLE_NEW_LAYOUT_ASSERT'),
				useAirDesign: true,
				buttons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage('CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_ENABLE_NEW_LAYOUT_ASSERT_CONFIRM'),
					useAirDesign: true,
					style: ui_buttons.Button.AirStyle.FILLED,
					onclick: button => {
						this.#sendEnableNewLayoutRequest(button);
					}
				}), new ui_buttons.Button({
					text: main_core.Loc.getMessage('CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_ENABLE_NEW_LAYOUT_ASSERT_CANCEL'),
					useAirDesign: true,
					style: ui_buttons.Button.AirStyle.OUTLINE,
					onclick: button => {
						button.context.close();
					}
				})]
			});
			confirmationPopup.show();
		}
		#getTitleText() {
			if (this.#daysUntilDisable === 0) {
				return main_core.Loc.getMessage('CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_TITLE_LESS_THAN_DAY');
			}
			return main_core.Loc.getMessagePlural('CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_TITLE', this.#daysUntilDisable, {
				'#DAYS_UNTIL_DISABLE#': this.#daysUntilDisable
			});
		}
		#getText() {
			const helpdeskLink = '<a class="crm-old-layout-helpdesk-link">';
			const localPhraseCode = this.#isAdmin ? 'CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_TEXT' : 'CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_ENABLE_NEW_LAYOUT_CONTACT_ADMIN';
			return main_core.Loc.getMessage(localPhraseCode, {
				'[helpdeskLink]': helpdeskLink,
				'[/helpdeskLink]': '</a>'
			});
		}
	}

	const SUNSET_HELPDESK_CODE = '14795982';
	function bindHelpdeskLink(root, onClick) {
		const link = root.querySelector('.crm-old-layout-helpdesk-link');
		if (!link) {
			return;
		}
		main_core.Event.bind(link, 'click', event => {
			if (top.BX.Helper) {
				top.BX.Helper.show(`redirect=detail&code=${SUNSET_HELPDESK_CODE}`);
				event.preventDefault();
			}
			if (main_core.Type.isFunction(onClick)) {
				onClick();
			}
		});
	}
	function showDisableOldInvoicesConfirmation(options) {
		const confirmationPopup = ui_dialogs_messagebox.MessageBox.create({
			message: options.message,
			useAirDesign: true,
			buttons: [new ui_buttons.Button({
				text: options.confirmText,
				useAirDesign: true,
				style: ui_buttons.Button.AirStyle.FILLED,
				onclick: () => {
					sendDisableOldInvoicesRequest(options.errorText);
				}
			}), new ui_buttons.Button({
				text: options.cancelText,
				useAirDesign: true,
				style: ui_buttons.Button.AirStyle.OUTLINE,
				onclick: button => {
					button.context.close();
				}
			})]
		});
		confirmationPopup.show();
	}
	function sendDisableOldInvoicesRequest(errorText) {
		BX.ajax.runAction('crm.oldentityview.sunset.disableOldInvoices').then(response => {
			const redirectUrl = response?.data?.redirectUrl;
			if (main_core.Type.isString(redirectUrl) && redirectUrl !== '') {
				window.location.href = redirectUrl;
			} else {
				window.location.reload();
			}
		}).catch(() => {
			ui_notification.UI.Notification.Center.notify({
				content: errorText
			});
		});
	}

	class OldInvoiceReadonlyAlertContent {
		#alertContainer;
		#isAdmin;
		constructor(alertContainer, options) {
			if (!main_core.Type.isBoolean(options.isAdmin)) {
				throw new TypeError('OldCardLayout.DisableAlert: \'isAdmin\' must be boolean');
			}
			this.#alertContainer = alertContainer;
			this.#isAdmin = options.isAdmin;
		}
		createNode() {
			const {
				root,
				buttonContainer
			} = main_core.Tag.render`
			<div class="crm-old-layout-disable-alert">
				<div class="crm-old-layout-left-part">
					<span class="crm-old-layout-icon"></span>
				</div>
				<div class="crm-old-layout-right-part">
					<h4 class="crm-old-layout-title ui-typography-heading-h4">
						${this.#getTitleText()}
					</h4>
					<p class="crm-old-layout-text ui-typography-text-md">
						${this.#getText()}
					</p>
					<div class="crm-old-layout-buttons" ref="buttonContainer"></div>
				</div>
			</div>
		`;
			bindHelpdeskLink(root, () => {
				ui_analytics.sendData(crm_integration_analytics.Builder.OldEntityView.OldInvoiceReadonly.ClickEvent.buildData());
			});
			if (this.#isAdmin) {
				const enableNewButton = new ui_buttons.Button({
					text: main_core.Loc.getMessage('CRM_OLD_INVOICE_SUNSET_BUTTON_TEXT'),
					useAirDesign: true,
					style: ui_buttons.Button.AirStyle.OUTLINE,
					size: ui_buttons.Button.Size.SMALL,
					onclick: () => {
						showDisableOldInvoicesConfirmation({
							message: main_core.Loc.getMessage('CRM_OLD_INVOICE_SUNSET_READONLY_CONFIRM_MESSAGE'),
							confirmText: main_core.Loc.getMessage('CRM_OLD_INVOICE_SUNSET_CONFIRM_OK'),
							cancelText: main_core.Loc.getMessage('CRM_OLD_INVOICE_SUNSET_CONFIRM_CANCEL'),
							errorText: main_core.Loc.getMessage('CRM_OLD_INVOICE_SUNSET_ERROR')
						});
					}
				});
				enableNewButton.renderTo(buttonContainer);
			}
			ui_analytics.sendData(crm_integration_analytics.Builder.OldEntityView.OldInvoiceReadonly.ViewEvent.buildData());
			return root;
		}
		#getTitleText() {
			return main_core.Loc.getMessage('CRM_OLD_INVOICE_SUNSET_READONLY_TITLE');
		}
		#getText() {
			return main_core.Loc.getMessage('CRM_OLD_INVOICE_SUNSET_READONLY_TEXT', {
				'[helpdeskLink]': '<a class="crm-old-layout-helpdesk-link">',
				'[/helpdeskLink]': '</a>'
			});
		}
	}

	class OldInvoiceWarningAlertContent {
		#alertContainer;
		#daysUntilDisable;
		#isAdmin;
		#lastTimeShownField;
		#lastTimeShownOptionName;
		constructor(alertContainer, options) {
			if (!main_core.Type.isInteger(options.daysUntilDisable)) {
				throw new TypeError('OldCardLayout.DisableAlert: \'daysUntilDisable\' must be integer');
			}
			if (!main_core.Type.isBoolean(options.isAdmin)) {
				throw new TypeError('OldCardLayout.DisableAlert: \'isAdmin\' must be boolean');
			}
			this.#alertContainer = alertContainer;
			this.#daysUntilDisable = options.daysUntilDisable;
			this.#isAdmin = options.isAdmin;
			this.#lastTimeShownField = main_core.Type.isString(options.lastTimeShownField) ? options.lastTimeShownField : null;
			this.#lastTimeShownOptionName = main_core.Type.isString(options.lastTimeShownOptionName) ? options.lastTimeShownOptionName : null;
		}
		createNode() {
			const closeButtonHtml = this.#isAdmin ? '' : '<button class="crm-old-layout-close-button" ref="closeButton"></button>';
			const {
				root,
				buttonContainer,
				closeButton
			} = main_core.Tag.render`
			<div class="crm-old-layout-disable-alert">
				<div class="crm-old-layout-left-part">
					<span class="crm-old-layout-icon"></span>
				</div>
				<div class="crm-old-layout-right-part">
					<h4 class="crm-old-layout-title ui-typography-heading-h4">
						${this.#getTitleText()}
					</h4>
					<p class="crm-old-layout-text ui-typography-text-md">
						${this.#getText()}
					</p>
					<div class="crm-old-layout-buttons" ref="buttonContainer"></div>
				</div>
				${closeButtonHtml}
			</div>
		`;
			bindHelpdeskLink(root);
			if (this.#isAdmin) {
				const enableNewButton = new ui_buttons.Button({
					text: main_core.Loc.getMessage('CRM_OLD_INVOICE_SUNSET_BUTTON_TEXT'),
					useAirDesign: true,
					style: ui_buttons.Button.AirStyle.OUTLINE,
					size: ui_buttons.Button.Size.SMALL,
					onclick: () => {
						showDisableOldInvoicesConfirmation({
							message: main_core.Loc.getMessage('CRM_OLD_INVOICE_SUNSET_READONLY_CONFIRM_MESSAGE'),
							confirmText: main_core.Loc.getMessage('CRM_OLD_INVOICE_SUNSET_CONFIRM_OK'),
							cancelText: main_core.Loc.getMessage('CRM_OLD_INVOICE_SUNSET_CONFIRM_CANCEL'),
							errorText: main_core.Loc.getMessage('CRM_OLD_INVOICE_SUNSET_ERROR')
						});
					}
				});
				enableNewButton.renderTo(buttonContainer);
			} else if (closeButton && this.#lastTimeShownField && this.#lastTimeShownOptionName) {
				main_core.Event.bind(closeButton, 'click', () => {
					const currentTimeInSeconds = Math.round(Date.now() / 1000);
					BX.userOptions.save('crm', this.#lastTimeShownField, this.#lastTimeShownOptionName, currentTimeInSeconds);
					this.#alertContainer.remove();
				});
			}
			return root;
		}
		#getTitleText() {
			return main_core.Loc.getMessage('CRM_OLD_INVOICE_SUNSET_WARNING_TITLE');
		}
		#getText() {
			const replacements = {
				'[helpdeskLink]': '<a class="crm-old-layout-helpdesk-link">',
				'[/helpdeskLink]': '</a>'
			};
			if (this.#daysUntilDisable === 0) {
				return main_core.Loc.getMessage('CRM_OLD_INVOICE_SUNSET_WARNING_TEXT_LESS_THAN_DAY', replacements);
			}
			return main_core.Loc.getMessagePlural('CRM_OLD_INVOICE_SUNSET_WARNING_TEXT', this.#daysUntilDisable, {
				...replacements,
				'#DAYS_UNTIL_DISABLE#': this.#daysUntilDisable
			});
		}
	}

	class DisableAlert {
		#alertContainer;
		#contentName;
		#contentOptions;
		constructor(options) {
			if (!main_core.Type.isElementNode(options.alertContainer)) {
				throw new Error('OldCardLayout.DisableAlert: \'alertContainer\' must be a DOM element.');
			}
			if (!main_core.Type.isString(options.contentName)) {
				throw new TypeError('OldCardLayout.DisableAlert: \'contentName\' must be string');
			}
			if (!main_core.Type.isObject(options.contentOptions)) {
				throw new TypeError('OldCardLayout.DisableAlert: \'contentOptions\' must be object');
			}
			this.#alertContainer = options.alertContainer;
			this.#contentName = options.contentName;
			this.#contentOptions = options.contentOptions;
		}
		render() {
			const contentNode = this.#getContentByName(this.#contentName);
			this.#alertContainer.append(contentNode);
		}
		#getContentByName(name) {
			switch (name) {
				case 'old-invoice-warning':
					return new OldInvoiceWarningAlertContent(this.#alertContainer, this.#contentOptions).createNode();
				case 'old-invoice-readonly':
					return new OldInvoiceReadonlyAlertContent(this.#alertContainer, this.#contentOptions).createNode();
				default:
					return new OldEntityDisableAlertContent(this.#alertContainer, this.#contentOptions).createNode();
			}
		}
	}

	exports.DisableAlert = DisableAlert;

})(this.BX.Crm.OldEntityView = this.BX.Crm.OldEntityView || {}, BX, BX, BX, BX.UI.Dialogs, BX.UI.Notification, BX.UI, BX.Crm, BX.UI.Analytics, BX.Crm.Integration.Analytics);
//# sourceMappingURL=disable-alert.bundle.js.map
