/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, ui_buttons, ui_forms, ui_alerts, ui_layoutForm, ui_dialogs_messagebox) {
	'use strict';

	const DEFAULT_LANGUAGE_ID$1 = 'en';
	class ClientRegistration {
		popupContainerId = 'content-register-modal';
		constructor(options) {
			this.options = options;
			this.bindEvents();
		}
		bindEvents() {}
		start() {
			const allowedServerPromise = main_core.ajax.runAction('ai.integration.b24cloudai.listAllowedServers').then(response => {
				return response.data.servers;
			});
			const warning = main_core.Loc.getMessage('AI_COPILOT_CLOUD_CLIENT_REGISTRATION_WARNING', {
				'#NAME#': this.#getServiceName()
			});
			const popupContent = main_core.Tag.render`
			<div class="ui-form ai__cloud-client-registration-form" id="${this.popupContainerId}">
				<div class="ui-form-row" style="display: none">
					<div class="ui-alert ui-alert-icon-danger ui-alert-xs ui-alert-danger">
						<span class="ui-alert-message"></span>
					</div>
				</div>
				<div class="ui-form-row">
					<div class="ui-form-label">
						<div class="ui-ctl-label-text">${main_core.Loc.getMessage('AI_COPILOT_CLOUD_CLIENT_REGISTRATION_SELECT_SERVER_LABEL')}</div>
					</div>
					<div class="ui-form-content">
						<div
							ref="selectWrapper"
							class="ui-ctl ui-ctl-w100 --loading ui-ctl-after-icon ui-ctl-dropdown ai__cloud-client-registration-form_servers-select-wrapper"
						>
							<div class="ui-ctl-after ui-ctl-icon-loader"></div>
							<div class="ui-ctl-after ui-ctl-icon-angle"></div>
							<select ref="select" class="ui-ctl-element"></select>
						</div>
					</div>
				</div>
				<div class="ui-form-row">
					<div class="ui-form-label">
					<div class="ui-alert ui-alert-icon-info ui-alert-xs">
						<span class="ui-alert-message">
							${warning}
						</span>
				</div>
			</div>
		`;
			const popup = new main_popup.Popup({
				overlay: true,
				minHeight: 280,
				width: 400,
				content: popupContent.root,
				closeIcon: true,
				cacheable: false,
				buttons: [new ui_buttons.SaveButton({
					id: 'save-button',
					text: main_core.Loc.getMessage('AI_COPILOT_CLOUD_CLIENT_REGISTRATION_BUTTON'),
					onclick: this.handleClickRegister.bind(this),
					state: ui_buttons.SaveButton.State.DISABLED
				})]
			});
			popup.show();
			allowedServerPromise.then(servers => {
				const select = popupContent.select;
				servers.forEach(server => {
					const regionSuffix = server.region ? ` (${server.region})` : '';
					select.add(main_core.Tag.render`<option value="${server.proxy}">${server.proxy}${regionSuffix}</option>`);
				});
				const btn = popup.getButton('save-button');
				btn.setState(null);
				main_core.Dom.removeClass(popupContent.selectWrapper, '--loading');
			}).catch(response => {
				console.error('Error fetching allowed servers', response);
				this.#showOnlyErrorRowInPopup(main_core.Loc.getMessage('AI_COPILOT_CLOUD_CLIENT_REGISTRATION_ERROR_ALLOWED_SERVERS'));
				main_core.Dom.removeClass(popupContent.selectWrapper, '--loading');
				const btn = popup.getButton('save-button');
				btn.setState(ui_buttons.SaveButton.State.DISABLED);
			});
		}
		#getSelectedServer() {
			const selectNode = document.querySelector(`#${this.popupContainerId} select`);
			if (!selectNode) {
				return '';
			}
			return selectNode.value;
		}
		#getLanguageId() {
			return main_core.Loc.hasMessage('LANGUAGE_ID') ? main_core.Loc.getMessage('LANGUAGE_ID') : DEFAULT_LANGUAGE_ID$1;
		}
		#getServiceName() {
			return 'AiProxy';
		}
		#showOnlyErrorRowInPopup(message) {
			const rows = document.querySelectorAll(`#${this.popupContainerId} .ui-form-row`);
			rows.forEach(row => {
				main_core.Dom.style(row, 'display', 'none');
			});
			main_core.Dom.style(rows[0], 'display', '');
			rows[0].querySelector('.ui-alert-message').textContent = message;
		}
		handleClickRegister(button) {
			button.setDisabled();
			button.setState(ui_buttons.SaveButton.State.WAITING);
			main_core.ajax.runAction('ai.integration.b24cloudai.register', {
				data: {
					serviceUrl: this.#getSelectedServer(),
					languageId: this.#getLanguageId()
				}
			}).then(() => {
				document.location.reload();
			}).catch(response => {
				console.error('Registration error', response);
				button.setState(ui_buttons.SaveButton.State.DISABLED);
				this.#showOnlyErrorRowInPopup(this.#buildUsefulErrorText(response.errors || []));
			});
		}
		#buildUsefulErrorText(errors) {
			for (const error of errors) {
				if (error.code === 'tariff_restriction') {
					return main_core.Loc.getMessage('AI_COPILOT_CLOUD_CLIENT_REGISTRATION_ERROR_AFTER_REG', {
						'#NAME#': this.#getServiceName()
					});
				}
				if (error.code === 'should_show_in_ui') {
					return error.message;
				}
				if (error.code === 'domain_verification') {
					return main_core.Loc.getMessage('AI_COPILOT_CLOUD_CLIENT_REGISTRATION_ERROR_DOMAIN_VERIFICATION', {
						'#NAME#': this.#getServiceName(),
						'#DOMAIN#': error.customData.domain
					});
				}
			}
			return main_core.Loc.getMessage('AI_COPILOT_CLOUD_CLIENT_REGISTRATION_ERROR_COMMON');
		}
	}

	const DEFAULT_LANGUAGE_ID = 'en';
	class ClientUnRegistration {
		popupContainerId = 'content-register-modal';
		constructor(options) {
			this.options = options;
			this.bindEvents();
		}
		bindEvents() {}
		start() {
			this.messageBox = ui_dialogs_messagebox.MessageBox.create({
				title: main_core.Loc.getMessage('AI_COPILOT_CLOUD_CLIENT_UNREGISTRATION_TITLE', {
					'#NAME#': this.#getServiceName()
				}),
				message: main_core.Loc.getMessage('AI_COPILOT_CLOUD_CLIENT_UNREGISTRATION_MSG', {
					'#NAME#': this.#getServiceName()
				}),
				buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
				okCaption: main_core.Loc.getMessage('AI_COPILOT_CLOUD_CLIENT_UNREGISTRATION_UNREGISTER_BTN'),
				onOk: () => {
					this.handleClickUnregister();
				}
			});
			this.messageBox.show();
		}
		#getLanguageId() {
			return main_core.Loc.hasMessage('LANGUAGE_ID') ? main_core.Loc.getMessage('LANGUAGE_ID') : DEFAULT_LANGUAGE_ID;
		}
		#getServiceName() {
			return main_core.Extension.getSettings('disk.b24-documents-client-registration').get('serviceName');
		}
		handleClickUnregister() {
			main_core.ajax.runAction('ai.integration.b24cloudai.unregister', {
				data: {
					languageId: this.#getLanguageId()
				}
			}).then(() => {
				document.location.reload();
			}).catch(response => {
				// eslint-disable-next-line no-console
				console.warn('Unregistration error', response);
				this.messageBox.setMessage(this.#buildUsefulErrorText(response.errors || []));
			});
		}
		#buildUsefulErrorText(errors) {
			for (const error of errors) {
				if (error.code === 'should_show_in_ui') {
					return error.message;
				}
			}
			return main_core.Loc.getMessage('AI_COPILOT_CLOUD_CLIENT_UNREGISTRATION_ERROR_COMMON');
		}
	}

	exports.ClientRegistration = ClientRegistration;
	exports.ClientUnRegistration = ClientUnRegistration;

})(this.BX.AI = this.BX.AI || {}, BX, BX.Main, BX.UI, BX, BX.UI, BX.UI, BX.UI.Dialogs);
//# sourceMappingURL=cloud-client-registration.bundle.js.map
