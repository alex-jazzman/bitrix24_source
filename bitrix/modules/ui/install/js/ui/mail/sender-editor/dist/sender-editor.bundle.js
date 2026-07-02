/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, ui_sidepanel_layout, main_core, ui_layoutForm, ui_buttons) {
	'use strict';

	const SidePanel = BX.SidePanel;
	const emailRegularEx = /\S+@\S+\.\S+/;
	const deleteMessage$1 = 'mail-mailbox-config-delete';
	const senderType$1 = 'sender';
	class SmtpEditor {
		constructor(options) {
			if (options) {
				if (options.senderId && main_core.Type.isInteger(options.senderId) && options.senderId > 0) {
					this.title = main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_EDIT_TITLE');
					this.senderId = options.senderId;
				} else {
					this.title = main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_ADD_TITLE');
				}
				this.setSender = options.setSenderCallback ?? null;
				this.addSender = options.addSenderCallback ?? null;
			}
			this.#createContentContainer();
			this.#prepareNecessaryFields();
		}
		static openSlider(options) {
			const instance = new SmtpEditor(options);
			SidePanel.Instance.open('smtpSender', {
				width: 760,
				cacheable: false,
				contentCallback: () => {
					return instance.getContentCallback();
				},
				events: {
					onLoad: () => {
						main_core.ready(() => {
							new ui_layoutForm.LayoutForm({
								container: instance.limitSection
							});
							new ui_layoutForm.LayoutForm({
								container: instance.senderSection
							});
						});
					}
				}
			});
		}
		getContentCallback() {
			return ui_sidepanel_layout.Layout.createContent({
				extensions: ['ui.mail.sender-editor'],
				title: this.title,
				design: {
					section: false,
					margin: false
				},
				content: () => {
					if (this.senderId > 0) {
						return this.loadSender(this.senderId);
					}
					return main_core.ajax.runAction('main.api.mail.sender.getDefaultSenderName').then(response => {
						this.#setUserName(response.data);
						return this.getContentContainer();
					}).catch(() => {
						return this.getContentContainer();
					});
				},
				buttons: ({
					cancelButton,
					Button
				}) => {
					const buttonArray = [];
					const saveButton = new ui_buttons.SaveButton({
						onclick: () => {
							this.#save(saveButton);
						}
					});
					buttonArray.push(saveButton);
					if (this.senderId > 0) {
						this.disconnectButton = new Button({
							text: main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_DISCONNECT_BUTTON'),
							color: BX.UI.Button.Color.DANGER,
							onclick: () => {
								this.#showDisconnectDialog();
							}
						});
						buttonArray.push(this.disconnectButton);
					}
					buttonArray.push(cancelButton);
					return buttonArray;
				}
			});
		}
		loadSender(senderId) {
			return main_core.ajax.runAction('main.api.mail.sender.getSenderData', {
				data: {
					senderId
				}
			}).then(response => {
				this.#setFieldData(response.data);
				return this.getContentContainer();
			}).catch(() => {
				return this.getContentContainer();
			});
		}
		#setFieldData(senderData) {
			this.useName.checked = senderData.useName;
			this.nameField.value = senderData.name;
			this.accessField.checked = senderData.isPublic;
			this.emailField.value = senderData.email;
			this.serverField.value = senderData.server;
			this.portField.value = senderData.port;
			this.loginField.value = senderData.login;
			if (senderData.protocol === 'smtps') {
				this.sslField.checked = true;
			}
			if (main_core.Type.isNumber(senderData.limit) && senderData.limit > 0) {
				this.senderLimitCheckbox.checked = true;
				this.senderLimitField.value = senderData.limit;
			}
		}
		#showDisconnectDialog() {
			top.BX.UI.Dialogs.MessageBox.show({
				message: main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_DISCONNECT_MESSAGE'),
				modal: true,
				buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
				onOk: messageBox => {
					this.#disconnect();
					messageBox.close();
				},
				onCancel: messageBox => {
					messageBox.close();
				}
			});
		}
		#save(button) {
			this.#clearInvalidFields();
			if (this.#hasInvalidFields()) {
				return;
			}
			this.#hideAlertNode();
			button.setClocking();
			this.#saveSender().then(response => {
				const data = response.data;
				if (this.setSender) {
					this.setSender(data.senderId, data.name, this.email);
				}
				if (this.addSender) {
					const mailbox = [];
					mailbox.name = data.name;
					mailbox.email = this.email;
					this.addSender(mailbox);
				}
				BX.SidePanel.Instance.getTopSlider().close();
			}).catch(response => {
				this.#showAlertNode(response.errors[0].message);
				button.setClocking(false);
			});
		}
		#disconnect() {
			main_core.Dom.addClass(this.disconnectButton, 'ui-btn-wait');
			main_core.ajax.runAction('main.api.mail.sender.deleteSender', {
				data: {
					senderId: this.senderId
				}
			}).then(() => {
				main_core.Dom.removeClass(this.disconnectButton, 'ui-btn-wait');
				SidePanel.Instance.getTopSlider().close();
				top.BX.SidePanel.Instance.postMessage(window, deleteMessage$1, {
					id: this.senderId,
					type: senderType$1
				});
			}).catch(() => {
				main_core.Dom.removeClass(this.disconnectButton, 'ui-btn-wait');
			});
		}
		#saveSender() {
			this.email = this.emailField.value;
			const data = {
				id: this.senderId ?? null,
				useName: this.useName.checked ? 'Y' : 'N',
				name: this.nameField.value,
				email: this.email,
				smtp: {},
				public: this.accessField.checked ? 'Y' : 'N'
			};
			data.smtp = {
				server: this.serverField.value,
				port: this.portField.value,
				ssl: this.sslField.checked ? this.sslField.value : '',
				login: this.loginField.value,
				password: this.passwordField.value,
				limit: this.senderLimitCheckbox.checked ? this.senderLimitField.value : null
			};
			return main_core.ajax.runAction('main.api.mail.sender.submitSender', {
				data: {
					data
				}
			}).then(response => {
				return response;
			});
		}
		#createContentContainer() {
			this.#createAlertNode();
			this.#createSenderSection();
			this.#createSmtpServerSection();
			this.#createLimitSection();
			this.contentContainer = main_core.Tag.render`
			<div class="ui-form">
				${this.alertNode}
				${this.senderSection}
				${this.smtpServerSection}
				${this.limitSection}
			</div>
		`;
		}
		getContentContainer() {
			return this.contentContainer;
		}
		#createAlertNode() {
			this.alertNode = main_core.Tag.render`
			<div class="ui-alert ui-alert-danger ui-alert-icon-warning" style="display: none">
				<span class="ui-alert-message"></span>
			</div>
		`;
		}
		#createSenderSection() {
			const {
				root,
				senderUseNameCheckbox,
				nameField,
				accessField
			} = main_core.Tag.render`
			<div class="ui-slider-section">
				<div class="ui-slider-content-box">
					<div class="ui-slider-heading-4">${main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_SENDER_MAIN_SECTION_TITLE')}</div>
					<div class="ui-form-row">
						<div class="ui-form-label" data-form-row-hidden="">
							<label class="ui-ctl ui-ctl-checkbox smtp-editor-limit-checkbox">
								<input type="checkbox" class="ui-ctl-element" data-name="hasSenderName" ref="senderUseNameCheckbox">
								<div class="ui-ctl-label-text">${main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_SENDER_USE_SENDER_NAME')}</div>
							</label>
						</div>
						<div class="ui-form-row-hidden">
							<div class="ui-form-row">
								<div class="ui-ctl-top">
									<div class="ui-form-label">${main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_SENDER_NAME')}</div>
									<span data-hint="${main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_NAME_HINT')}"></span>
								</div>
								<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
									<input type="text" data-name="name" value="" class="ui-ctl-element" ref="nameField">
								</div>
							</div>
						</div>
					</div>
					<div class="ui-form-row">
						<label class="ui-ctl ui-ctl-checkbox">
							<input type="checkbox" class="ui-ctl-element" data-name="access" ref="accessField">
							<div class="ui-ctl-label-text">${main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_SENDER_AVAILABLE_TOGGLE')}</div>
							<span data-hint="${main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_SENDER_AVAILABLE_TOGGLE_HINT')}"></span>
						</label>
					</div>
				</div>
			</div>
		`;
			this.senderSection = root;
			this.useName = senderUseNameCheckbox;
			this.nameField = nameField;
			this.accessField = accessField;
			this.hintInstence = top.BX.UI.Hint?.createInstance();
			this.hintInstence.init(this.senderSection);
		}
		#createSmtpServerSection() {
			this.#createSmtpEmailRow();
			this.#createSmtpServerRow();
			this.#createSmtpPortAndSafeConnectionRow();
			this.#createSmtpLoginRow();
			this.#createSmtpPasswordRow();
			this.smtpServerSection = main_core.Tag.render`
			<div class="ui-slider-section">
				<div class="ui-slider-content-box">
					<div class="ui-slider-heading-4">${main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_SMTP_SECTION_TITLE')}</div>
					${this.smtpEmailRow}
					${this.smtpServerRow}
					${this.smtpPortAndSafeConnectionRow}
					${this.smtpLoginRow}
					${this.smtpPasswordRow}
				</div>
			</div>
		`;
		}
		#createSmtpEmailRow() {
			const {
				root,
				emailField
			} = main_core.Tag.render`
			<div class="ui-form-row">
				<div class="ui-ctl-top">
					<div class="ui-form-label">${main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_EMAIL')}</div>
				</div>
				<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
					<input type="email" name="email" class="ui-ctl-element" data-name="email" placeholder="info@example.com" ref="emailField">
				</div>
			</div>
		`;
			this.smtpEmailRow = root;
			this.emailField = emailField;
		}
		#createSmtpServerRow() {
			const {
				root,
				serverField
			} = main_core.Tag.render`
			<div class="ui-form-row">
				<div class="ui-ctl-top">
					<div class="ui-form-label">${main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_SERVER')}</div>
				</div>
				<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
					<input type="text" name="server" class="ui-ctl-element" data-name="server" placeholder="smtp.example.com" ref="serverField">
				</div>
			</div>
		`;
			this.smtpServerRow = root;
			this.serverField = serverField;
		}
		#createSmtpPortAndSafeConnectionRow() {
			const {
				root,
				portField,
				sslField
			} = main_core.Tag.render`
			<div class="ui-form-row">
				<div class="ui-ctl-top">
					<div class="ui-form-label">${main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_PORT')}</div>
				</div>
				<div class="ui-form-row-inline" style="margin-bottom: 0">
					<div class="ui-form-row">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
						<input type="text" 
							class="ui-ctl-element" 
							data-name="port" 
							placeholder="555"
							ref="portField"
						>
						</div>
					</div>
					<div class="ui-form-row">
						<label class="ui-ctl ui-ctl-checkbox">
							<input type="checkbox" class="ui-ctl-element" value="Y" data-name="ssl" ref="sslField">
							<div class="ui-ctl-label-text">${main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_SSL')}</div>
						</label>
					</div>
				</div>
			</div>
		`;
			this.smtpPortAndSafeConnectionRow = root;
			this.portField = portField;
			this.sslField = sslField;
		}
		#createSmtpLoginRow() {
			const {
				root,
				loginField
			} = main_core.Tag.render`
			<div class="ui-form-row">
				<div class="ui-ctl-top">
					<div class="ui-form-label">${main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_LOGIN')}</div>
				</div>
				<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
					<input type="text" class="ui-ctl-element" data-name="login" ref="loginField">
				</div>
			</div>
		`;
			this.smtpLoginRow = root;
			this.loginField = loginField;
			main_core.Event.bind(this.emailField, 'input', () => {
				this.loginField.value = this.emailField.value;
			});
		}
		#createSmtpPasswordRow() {
			const {
				root,
				passwordField
			} = main_core.Tag.render`
			<div class="ui-form-row">
				<div class="ui-ctl-top">
					<div class="ui-form-label">${main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_PASSWORD')}</div>
				</div>
				<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
					<input type="password" class="ui-ctl-element" data-name="password" ref="passwordField">
				</div>
			</div>
		`;
			this.smtpPasswordRow = root;
			this.passwordField = passwordField;
		}
		#createLimitSection() {
			const {
				root,
				senderLimitCheckbox,
				senderLimitField
			} = main_core.Tag.render`
			<div class="ui-slider-section">
				<div class="ui-slider-content-box">
					<div class="ui-slider-heading-4">${main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_SENDER_LIMIT_SECTION_TITLE')}</div>
					<div class="ui-form-row">
						<div class="ui-form-label" data-form-row-hidden="">
							<label class="ui-ctl ui-ctl-checkbox smtp-editor-limit-checkbox">
								<input type="checkbox" class="ui-ctl-element" data-name="hasLimit" ref="senderLimitCheckbox">
								<div class="ui-ctl-label-text">${main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_SENDER_LIMIT_SETTINGS')}</div>
							</label>
						</div>
						<div class="ui-form-row-hidden">
							<div class="ui-form-row">
								<div class="ui-ctl-top">
									<div class="ui-form-label">${main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_SENDER_LIMIT_TITLE')}</div>
								</div>
								<div class="ui-ctl ui-ctl-textbox ui-ctl-w25">
									<input type="number" class="ui-ctl-element" data-name="limit" value="250" min="0" ref="senderLimitField">
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
			this.limitSection = root;
			this.senderLimitCheckbox = senderLimitCheckbox;
			this.senderLimitField = senderLimitField;
		}
		#showAlertNode(message = null) {
			if (message) {
				const spanNode = this.alertNode.querySelector('span');
				spanNode.textContent = message;
			}
			main_core.Dom.style(this.alertNode, 'display', 'block');
		}
		#hideAlertNode() {
			main_core.Dom.style(this.alertNode, 'display', 'none');
		}
		#prepareNecessaryFields() {
			this.requiredFields = [{
				row: this.smtpEmailRow,
				input: this.emailField,
				type: 'email'
			}, {
				row: this.smtpServerRow,
				input: this.serverField,
				type: 'server'
			}, {
				row: this.smtpPortAndSafeConnectionRow,
				input: this.portField,
				type: 'port'
			}, {
				row: this.smtpLoginRow,
				input: this.loginField,
				type: 'login'
			}];
			if (!this.senderId) {
				this.requiredFields.push({
					row: this.smtpPasswordRow,
					input: this.passwordField,
					type: 'pass'
				});
			}
		}
		#hasInvalidFields() {
			let count = 0;
			this.requiredFields.forEach(field => {
				if (!this.#isInvalidField(field.type, field.input.value)) {
					return;
				}
				count++;
				main_core.Dom.addClass(field.row, 'ui-ctl-warning');
				const errorMessage = this.#getErrorMessage(field.type, field.input.value);
				const invalidField = main_core.Tag.render`
				<div class="ui-mail-field-error-message ui-ctl-bottom">${errorMessage}</div>
			`;
				main_core.Dom.append(invalidField, field.row);
				if (this.topEmptyNode) {
					return;
				}
				this.topEmptyNode = field.row;
				this.topEmptyNode.scrollIntoView();
			});
			return count > 0;
		}
		#clearInvalidFields() {
			if (!this.requiredFields) {
				return;
			}
			this.requiredFields.forEach(field => {
				main_core.Dom.removeClass(field.row, 'ui-ctl-warning');
				const errorMessageFiled = field.row.querySelector('.ui-mail-field-error-message');
				if (main_core.Type.isDomNode(errorMessageFiled)) {
					main_core.Dom.remove(errorMessageFiled);
				}
			});
			this.topEmptyNode = null;
			this.invalidFieldNode?.remove();
		}
		#isInvalidField(type, input) {
			if (input.length === 0) {
				return true;
			}
			if (type === 'port' && (!Number.isInteger(Number(input)) || input < 0 || input > 65535)) {
				return true;
			}
			return type === 'email' && !emailRegularEx.test(input);
		}
		#getErrorMessage(type, input) {
			switch (type) {
				case 'email':
					if (main_core.Type.isString(input) && input.length > 0) {
						return main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_INVALID_EMAIL');
					}
					return main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_EMPTY_EMAIL');
				case 'server':
					return main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_EMPTY_SERVER');
				case 'port':
					return main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_INVALID_PORT');
				case 'login':
					return main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_EMPTY_LOGIN');
				default:
					return main_core.Loc.getMessage('UI_MAIL_SMTP_SLIDER_EMPTY_PASSWORD');
			}
		}
		#setUserName(name) {
			this.nameField.value = name;
		}
	}

	const mailboxType = 'mailbox';
	const senderType = 'sender';
	const mailboxSenderType = 'mailboxSender';
	const aliasType = 'alias';
	const successSubmitMessage = 'mail-mailbox-config-success';
	const deleteMessage = 'mail-mailbox-config-delete';
	const aliasSliderUrl = 'mailAliasSlider';
	class AliasEditor {
		wasSenderUpdated = false;
		aliasCounter = 0;
		#senderNameNodes = new Map();
		constructor(options) {
			this.senderId = Number(options.senderId);
			this.email = options.email;
			this.setSender = options.setSenderCallback;
			this.updateSenderList = options.updateSenderList;
			this.#createContentContainer();
			this.#createToolbarButtons();
		}
		static openSlider(options) {
			const instance = new AliasEditor(options);
			const onSliderMessage = function (event) {
				const [sliderEvent] = event.getData();
				if (!sliderEvent) {
					return;
				}
				const eventMessage = sliderEvent.getEventId();
				const data = sliderEvent.getData();
				const mailboxId = Number(sliderEvent.data.id);
				const slider = BX.SidePanel.Instance.getSlider(aliasSliderUrl);
				if (eventMessage === successSubmitMessage) {
					instance.wasSenderUpdated = true;
					instance.updateMainSenderName(mailboxId);
					if (slider) {
						slider.close();
					}
					return;
				}
				if (eventMessage === deleteMessage) {
					instance.wasSenderUpdated = true;
					if (instance.id === Number(mailboxId)) {
						instance.setSender();
					}
					if (slider) {
						slider.close();
					}
					if (data && data.type !== senderType) {
						BX.SidePanel.Instance.postMessage(window, sliderEvent.getEventId(), sliderEvent.getData);
					}
				}
			};
			BX.SidePanel.Instance.open(aliasSliderUrl, {
				width: 800,
				cacheable: false,
				contentCallback: () => {
					return ui_sidepanel_layout.Layout.createContent({
						extensions: ['ui.mail.sender-editor'],
						title: options.email,
						design: {
							section: false,
							margin: false
						},
						content() {
							return instance.loadSliderContent();
						},
						toolbar() {
							return instance.getToolbarButtons();
						},
						buttons: () => {}
					});
				},
				events: {
					onClose: () => {
						top.BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onMessage', onSliderMessage);
						if (instance.updateSenderList && instance.wasSenderUpdated) {
							instance.updateSenderList();
						}
					}
				}
			});
			top.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onMessage', onSliderMessage);
		}
		getContentContainer() {
			return this.contentContainer;
		}
		getToolbarButtons() {
			const buttons = [];
			if (this.settingsButton) {
				buttons.push(this.settingsButton);
			}
			return buttons;
		}
		loadSliderContent() {
			return BX.ajax.runAction('main.api.mail.sender.getSenderTransitionalData', {
				data: {
					senderId: this.senderId
				}
			}).then(response => {
				const data = response.data;
				const senders = data.senders ?? null;
				this.id = Number(data.id);
				this.email = data.email;
				this.#addSenders(senders);
				const type = data.type || null;
				switch (type) {
					case mailboxType:
						this.settingsButton.bindEvent('click', () => {
							this.#openMailboxSettings(data.href);
						});
						break;
					case senderType:
						this.settingsButton.bindEvent('click', () => {
							this.#openSmtpSettings(data.id);
						});
						break;
					default:
						this.settingsButton.setDisabled();
						break;
				}
				return this.getContentContainer();
			}).catch(() => {
				this.settingsButton.setDisabled();
				return this.getContentContainer();
			});
		}
		#createContentContainer() {
			this.senderList = main_core.Tag.render`
			<div class="mail-sender-list"></div>
		`;
			this.#createAddSenderContainer();
			this.contentContainer = main_core.Tag.render`
			<div class="ui-form">
				<div class="ui-slider-section">
					<div class="ui-slider-content-box" style="margin-bottom: 0">
						<div class="ui-slider-heading-4 sender-list-header">${main_core.Text.encode(main_core.Loc.getMessage('UI_MAIL_ALIAS_SLIDER_EMAIL_TITLE'))}</div>
						${this.senderList}
						${this.addSenderContainer}
					</div>
				</div>
			</div>
		`;
		}
		#createAddSenderContainer() {
			this.senderInput = main_core.Tag.render`
			<input type="text" class="ui-ctl-element" data-name="aliasName" placeholder="${main_core.Text.encode(main_core.Loc.getMessage('UI_MAIL_ALIAS_SLIDER_ADD_INPUT_PLACEHOLDER'))}">
		`;
			this.senderInputContainer = main_core.Tag.render`
			<div class="add-sender-input-container" hidden>
				<div class="ui-ctl ui-ctl-textbox ui-ctl-default-light ui-ctl-sm ui-ctl-w100">
					${this.senderInput}
				</div>
			</div>
		`;
			main_core.Dom.append(this.#renderSubmitButton(() => {
				return this.#addAliasPromise();
			}, this.senderInput), this.senderInputContainer);
			main_core.Dom.append(this.#renderCancelButton(() => {
				main_core.Dom.hide(this.senderInputContainer);
				main_core.Dom.show(this.senderAddButton);
				this.senderInput.value = null;
			}), this.senderInputContainer);
			this.senderAddButton = main_core.Tag.render`
			<div class="add-sender-button">${main_core.Text.encode(main_core.Loc.getMessage('UI_MAIL_ALIAS_SLIDER_ADD_BUTTON'))}</div>
		`;
			main_core.Event.bind(this.senderAddButton, 'click', () => {
				main_core.Dom.hide(this.senderAddButton);
				main_core.Dom.show(this.senderInputContainer);
				this.senderInput.focus();
			});
			this.addSenderContainer = main_core.Tag.render`
			<div class="add-sender-container">
				${this.senderInputContainer}
				${this.senderAddButton}
			</div>
		`;
		}
		#addAliasPromise() {
			return new Promise(resolve => {
				const hideInputContainer = () => {
					main_core.Dom.hide(this.senderInputContainer);
					main_core.Dom.show(this.senderAddButton);
					this.senderInput.value = null;
					resolve();
				};
				if (this.senderInput.value.trim().length === 0) {
					hideInputContainer();
					return;
				}
				if (this.#hasNameInvalidCharacters(this.senderInput.value.trim())) {
					resolve();
					return;
				}
				const name = this.senderInput.value;
				main_core.ajax.runAction('main.api.mail.sender.addAlias', {
					data: {
						name,
						email: this.email
					}
				}).then(response => {
					const data = response.data;
					const newSenderId = data.senderId;
					if (this.setSender && data.senderId) {
						this.setSender(data.senderId, name, this.email);
					}
					this.wasSenderUpdated = true;
					this.senderId = newSenderId;
					const senderNode = this.#renderSenderItem({
						id: newSenderId,
						name,
						isOwner: true,
						type: aliasType,
						canEdit: true,
						userUrl: data.userUrl ?? null,
						avatar: data.avatar ?? null
					});
					main_core.Dom.append(senderNode, this.senderList);
					this.aliasCounter++;
					hideInputContainer();
				}).catch(() => {
					hideInputContainer();
				});
			});
		}
		#createToolbarButtons() {
			this.settingsButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('UI_MAIL_ALIAS_SLIDER_MAIL_SETTINGS_BUTTON'),
				icon: ui_buttons.Button.Icon.SETTING,
				color: ui_buttons.Button.Color.LIGHT_BORDER
			});
		}
		#renderSenderItem(sender) {
			const itemContainer = main_core.Tag.render`<div class="sender-list-item"></div>`;
			const {
				root: nameContainer,
				textNode: nameTextContainer
			} = this.#renderSenderNameContainer(sender.name);
			let handleShowEditInput = null;
			if (sender.canEdit && sender.type === aliasType) {
				const {
					nameEditContainer,
					editInput: nameEditInput
				} = this.#renderSenderEditNode(sender, nameTextContainer);
				main_core.Dom.append(nameEditContainer, nameContainer);
				handleShowEditInput = () => {
					nameEditInput.value = nameContainer.innerText;
					main_core.Dom.hide(nameTextContainer);
					main_core.Dom.show(nameEditContainer);
					nameEditInput.focus();
				};
				main_core.Event.bind(nameTextContainer, 'click', handleShowEditInput);
			}
			main_core.Dom.append(nameContainer, itemContainer);
			main_core.Dom.append(this.#renderSenderExtraInfoContainer(sender), itemContainer);
			main_core.Dom.append(this.#renderSenderAuthorContainer(sender, itemContainer), itemContainer);
			main_core.Dom.append(this.#renderSenderEditContainer(sender, itemContainer, handleShowEditInput), itemContainer);
			if (this.#isMainSender(sender)) {
				this.mainSenderNameNode = nameContainer.querySelector('.sender-item-name-text-container');
			}
			this.#senderNameNodes.set(sender.id, nameTextContainer);
			return itemContainer;
		}
		#renderSenderNameContainer(senderName) {
			const {
				root,
				textNode
			} = main_core.Tag.render`
			<div class="sender-item-name-container">
				<div class="sender-item-name-text-container" ref="textNode">
					${main_core.Text.encode(senderName)}
				</div>
			</div>
		`;
			return {
				root,
				textNode
			};
		}
		#renderSenderEditNode(sender, nameTextContainer) {
			const textContainer = nameTextContainer;
			const {
				root,
				editInput
			} = main_core.Tag.render`
			<div class="edit-sender-container-content" ref="editContent">
				<div class="ui-ctl ui-ctl-textbox ui-ctl-default-light ui-ctl-sm ui-ctl-w100">
					<input type="text" class="ui-ctl-element" ref="editInput" placeholder="${main_core.Loc.getMessage('UI_MAIL_ALIAS_SLIDER_ADD_INPUT_PLACEHOLDER')}">
				</div>
			</div>
		`;
			const nameEditContainer = root;
			const submitPromise = () => {
				return new Promise(resolve => {
					const hideEditContainer = () => {
						editInput.value = nameTextContainer.innerText;
						main_core.Dom.hide(nameEditContainer);
						main_core.Dom.show(textContainer);
						resolve();
					};
					if (editInput.value.length === 0 || editInput.value === nameTextContainer.innerText) {
						hideEditContainer();
						return;
					}
					if (this.#hasNameInvalidCharacters(editInput.value)) {
						resolve();
						return;
					}
					const senderNewName = editInput.value;
					main_core.ajax.runAction('main.api.mail.sender.updateSenderName', {
						data: {
							senderId: sender.id,
							name: senderNewName
						}
					}).then(() => {
						textContainer.innerText = senderNewName;
						if (this.setSender) {
							this.setSender(sender.id, senderNewName, this.email);
						}
						this.wasSenderUpdated = true;
						hideEditContainer();
					}).catch(() => {
						hideEditContainer();
					});
				});
			};
			main_core.Dom.append(this.#renderSubmitButton(submitPromise, editInput), root);
			const cancelHandler = () => {
				main_core.Dom.hide(nameEditContainer);
				main_core.Dom.show(textContainer);
				editInput.value = null;
			};
			main_core.Dom.append(this.#renderCancelButton(cancelHandler), root);
			main_core.Dom.hide(root);
			return {
				nameEditContainer,
				editInput
			};
		}
		#renderSenderExtraInfoContainer(sender) {
			return main_core.Tag.render`
			<div class="sender-item-type-container">${main_core.Text.encode(this.#getExtraInfoText(sender))}</div>
		`;
		}
		#getExtraInfoText(sender) {
			if (this.#isMainSender(sender)) {
				return main_core.Loc.getMessage('UI_MAIL_ALIAS_EDITOR_CURRENT_SENDER_NAME');
			}
			if ([senderType, mailboxSenderType].includes(sender.type)) {
				return main_core.Loc.getMessage('UI_MAIL_ALIAS_EDITOR_ANOTHER_SENDER_NAME');
			}
			if (sender.type === aliasType && sender.isOwner) {
				return main_core.Loc.getMessage('UI_MAIL_ALIAS_EDITOR_ADDITIONAL_SENDER_NAME');
			}
			return '';
		}
		#renderSenderEditContainer(sender, senderNode, handleShowInput) {
			const senderEditContainer = main_core.Tag.render`
			<div class="sender-item-edit-container"></div>
		`;
			if (!sender.canEdit && !sender.isOwner) {
				return senderEditContainer;
			}
			if (sender.type === aliasType) {
				const senderNameEditButton = main_core.Tag.render`
				<div class="sender-item-btn ui-btn ui-btn-xs ui-icon-set --pencil-50"></div>
			`;
				main_core.Dom.append(senderNameEditButton, senderEditContainer);
				if (handleShowInput) {
					main_core.Event.bind(senderNameEditButton, 'click', handleShowInput);
				}
				main_core.Dom.append(this.#renderDeleteButton(sender.id, senderNode), senderEditContainer);
				return senderEditContainer;
			}
			const senderNameEditButton = main_core.Tag.render`
			<div class="sender-item-btn"></div>
		`;
			main_core.Dom.append(senderNameEditButton, senderEditContainer);
			main_core.Dom.append(this.#renderSettingsButton(sender.type, sender.id, sender.editHref), senderEditContainer);
			return senderEditContainer;
		}
		#renderSenderAuthorContainer(sender, senderNode) {
			const authorEditContainer = main_core.Tag.render`
			<div class="sender-item-author-container"></div>
		`;
			if (sender.userUrl) {
				main_core.Dom.append(this.#renderUserInfoNode(sender.userUrl, sender.avatar ?? null), authorEditContainer);
			}
			return authorEditContainer;
		}
		#renderUserInfoNode(userUrl, avatar) {
			const {
				root,
				userAvatarContainer
			} = main_core.Tag.render`
			<div class="sender-item-owner-info">
				${main_core.Loc.getMessage('UI_MAIL_ALIAS_EDITOR_ANOTHER_USER_SENDER_NAME')}
				<a href="${main_core.Text.encode(userUrl)}" class="ui-icon ui-icon-common-user sender-item-owner-avatar" ref="userAvatarContainer"></a> 
			</div>
		`;
			let avatarIcon = '';
			if (avatar) {
				avatarIcon = main_core.Tag.render`<i style="background-image: url('${main_core.Text.encode(avatar)}')"></i>`;
			} else {
				avatarIcon = main_core.Tag.render`<div class="sender-item-owner-avatar-icon ui-icon-set --person"></div>`;
			}
			main_core.Dom.append(avatarIcon, userAvatarContainer);
			return root;
		}
		#renderDeleteButton(senderId, senderNode) {
			const deleteButton = main_core.Tag.render`
			<div class="sender-item-btn ui-btn ui-btn-xs ui-icon-set --trash-bin" style="margin: 0"></div>
		`;
			main_core.Event.bind(deleteButton, 'click', () => {
				main_core.Dom.removeClass(deleteButton, ['ui-icon-set', '--trash-bin']);
				main_core.Dom.addClass(deleteButton, ['ui-btn-light', 'ui ui-btn-wait']);
				main_core.ajax.runAction('main.api.mail.sender.deleteSender', {
					data: {
						senderId
					}
				}).then(() => {
					senderNode.remove();
					this.wasSenderUpdated = true;
					if (Number(senderId) === this.senderId) {
						this.setSender();
					}
					this.#senderNameNodes.delete(senderId);
					this.aliasCounter--;
					this.#checkAliasCounter();
				}).catch(() => {
					main_core.Dom.removeClass(deleteButton, 'ui-btn-wait');
				});
			});
			return deleteButton;
		}
		#renderSettingsButton(type, senderId, editHref) {
			const editButton = main_core.Tag.render`
			<div class="sender-item-btn ui-btn ui-btn-xs ui-icon-set --settings-1" style="margin: 0"></div>
		`;
			if (type === mailboxSenderType) {
				main_core.Event.bind(editButton, 'click', () => {
					this.#openMailboxSettings(editHref);
				});
				return editButton;
			}
			main_core.Event.bind(editButton, 'click', () => {
				this.#openSmtpSettings(senderId);
			});
			return editButton;
		}
		#renderSubmitButton(submitPromise, targetElement) {
			const submitButton = main_core.Tag.render`
			<div class="ui-btn ui-btn-xs ui-btn-primary ui-btn-icon-done" style="margin: 0"></div>
		`;
			main_core.Event.bind(submitButton, 'click', () => {
				main_core.Dom.addClass(submitButton, 'ui ui-btn-wait');
				submitPromise().then(() => {
					main_core.Dom.removeClass(submitButton, 'ui-btn-wait');
				}).catch(() => {});
			});
			main_core.Event.bind(targetElement, 'keypress', event => {
				if (event.key === 'Enter') {
					submitButton.click();
				}
			});
			return submitButton;
		}
		#renderCancelButton(cancelHandler) {
			const cancelButton = main_core.Tag.render`
			<div class="sender-item-btn ui-btn ui-btn-xs ui-icon-set --cross-45" style="margin: 0"></div>
		`;
			main_core.Event.bind(cancelButton, 'click', cancelHandler);
			return cancelButton;
		}
		#addSenders(senders) {
			if (!senders) {
				return;
			}
			senders.sort((a, b) => a.id - b.id);
			senders.forEach(sender => {
				if (!this.id) {
					if (sender.type === senderType) {
						this.id = sender.id;
					}
					if (sender.type === mailboxSenderType) {
						this.id = sender.mailboxId;
					}
				}
				const senderNode = this.#renderSenderItem(sender);
				if (this.#isMainSender(sender)) {
					main_core.Dom.prepend(senderNode, this.senderList);
				} else {
					main_core.Dom.append(senderNode, this.senderList);
				}
				this.aliasCounter++;
			});
		}
		#openSmtpSettings(senderId) {
			SmtpEditor.openSlider({
				senderId: Number(senderId),
				setSenderCallback: (id, name, email) => {
					if (this.#senderNameNodes.has(id)) {
						this.#senderNameNodes.get(id).innerText = name;
					}
					this.setSender(id, name, email);
					this.wasSenderUpdated = true;
				}
			});
		}
		#openMailboxSettings(href) {
			BX.SidePanel.Instance.open(href);
		}
		#hasNameInvalidCharacters(name) {
			// regex checks for characters other than letters of the alphabet, numbers, spaces
			// and special characters ("-", ".", "'", "(", ")", ",")
			const regexForInvalidCharacters = /[^\p{L}\p{N}\p{Zs}\-.'(),]+/ug;
			if (regexForInvalidCharacters.test(name)) {
				top.BX.UI.Notification.Center.notify({
					content: main_core.Text.encode(main_core.Loc.getMessage('UI_MAIL_ALIAS_EDITOR_INVALID_SYMBOLS_NOTIFICATION'))
				});
				return true;
			}
			return false;
		}
		updateMainSenderName(mailboxId) {
			return BX.ajax.runAction('main.api.mail.sender.getSenderByMailboxId', {
				data: {
					mailboxId
				}
			}).then(response => {
				const name = response.data?.name;
				if (!name || !this.mainSenderNameNode) {
					return;
				}
				this.mainSenderNameNode.innerText = name;
			}).catch(() => {});
		}
		#checkAliasCounter() {
			if (this.aliasCounter === 0) {
				const slider = BX.SidePanel.Instance.getSlider(aliasSliderUrl);
				if (slider) {
					slider.close();
				}
			}
		}
		#isMainSender(sender) {
			return sender.type === senderType && this.id === Number(sender.id) || sender.type === mailboxSenderType && this.id === Number(sender.mailboxId);
		}
	}

	exports.AliasEditor = AliasEditor;
	exports.SmtpEditor = SmtpEditor;

})(this.BX.UI.Mail = this.BX.UI.Mail || {}, BX.UI.SidePanel, BX, BX.UI, BX.UI);
//# sourceMappingURL=sender-editor.bundle.js.map
