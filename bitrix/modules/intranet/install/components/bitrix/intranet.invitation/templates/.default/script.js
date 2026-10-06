/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_core, main_core_events, ui_analytics, intranet_departmentControl, ui_buttons, humanresources_departmentCreationPopup, ui_system_input, main_popup, ui_system_typography, ui_avatar, intranet_invitationInput, main_loader, ui_switcher, ui_system_chip) {
	'use strict';

	class ActiveDirectory {
		showForm() {
			BX.UI.Feedback.Form.open({
				id: 'intranet-active-directory',
				forms: [{
					zones: ['ru'],
					id: 309,
					lang: 'ru',
					sec: 'fbc0n3'
				}]
			});
		}
	}

	const InviteType = Object.freeze({
		EMAIL: 'email',
		PHONE: 'phone',
		ALL: 'all'
	});

	class Analytics {
		static TOOLS = 'Invitation';
		static TOOLS_HEADER = 'headerPopup';
		static EVENT_OPEN_SLIDER_INVITATION = 'drawer_open';
		static CATEGORY_INVITATION = 'invitation';
		static CATEGORY_SETTINGS = 'settings';
		static EVENT_COPY = 'copy_invitation_link';
		static ADMIN_ALLOW_MODE_Y = 'askAdminToAllow_Y';
		static ADMIN_ALLOW_MODE_N = 'askAdminToAllow_N';
		static IS_ADMIN_Y = 'isAdmin_Y';
		static IS_ADMIN_N = 'isAdmin_N';
		static EVENT_TAB_VIEW = 'tab_view';
		static EVENT_LOCAL_MAIL = 'invitation_local_mail';
		static EVENT_REFRESH_LINK = 'refresh_link';
		static TAB_EMAIL = 'tab_by_email';
		static TAB_MASS = 'tab_mass';
		static TAB_MASS_EMAIL = 'tab_mass_by_email';
		static TAB_MASS_EMAIL_PHONE = 'tab_mass_by_email_phone';
		static TAB_MASS_PHONE = 'tab_mass_by_phone';
		static TAB_DEPARTMENT = 'tab_department';
		static TAB_INTEGRATOR = 'tab_integrator';
		static TAB_LINK = 'by_link';
		static TAB_REGISTRATION = 'registration';
		static TAB_EXTRANET = 'extranet';
		static TAB_AD = 'AD';
		static TAB_LOCAL_EMAIL = 'tab_by_local_email';
		static TAB_PHONE = 'tab_by_phone';
		#cSection;
		#isAdmin;
		constructor(cSection, isAdmin) {
			this.#cSection = cSection;
			this.#isAdmin = isAdmin;
		}
		getDataForAction(type = null) {
			return {
				section: this.#getCSection(),
				source: this.#getCSection(),
				type
			};
		}
		#getIsAdmin() {
			return this.#isAdmin ? Analytics.IS_ADMIN_Y : Analytics.IS_ADMIN_N;
		}
		#getCSection() {
			return this.#cSection.source;
		}
		sendCopyLink(departmentControl, needConfirmRegistration) {
			ui_analytics.sendData({
				tool: Analytics.TOOLS,
				category: Analytics.CATEGORY_INVITATION,
				event: Analytics.EVENT_COPY,
				c_section: this.#getCSection(),
				c_sub_section: Analytics.TAB_LINK,
				p1: this.#getIsAdmin(),
				p2: needConfirmRegistration ? Analytics.ADMIN_ALLOW_MODE_Y : Analytics.ADMIN_ALLOW_MODE_N,
				...this.#getDepartmentControlAnalytics(departmentControl)
			});
		}
		sendTabData(section, subSection) {
			if (!section) {
				return;
			}
			ui_analytics.sendData({
				tool: Analytics.TOOLS,
				category: Analytics.CATEGORY_INVITATION,
				event: Analytics.EVENT_TAB_VIEW,
				c_section: section,
				c_sub_section: subSection
			});
		}
		sendOpenSliderData(section) {
			ui_analytics.sendData({
				tool: Analytics.TOOLS,
				category: Analytics.CATEGORY_INVITATION,
				event: Analytics.EVENT_OPEN_SLIDER_INVITATION,
				c_section: section
			});
		}
		sendOpenMassInvitePopup(inviteType) {
			ui_analytics.sendData({
				tool: Analytics.TOOLS,
				category: Analytics.CATEGORY_INVITATION,
				event: Analytics.EVENT_TAB_VIEW,
				c_section: this.#getCSection(),
				c_sub_section: inviteType === InviteType.EMAIL ? Analytics.TAB_MASS_EMAIL : inviteType === InviteType.PHONE ? Analytics.TAB_MASS_PHONE : Analytics.TAB_MASS_EMAIL_PHONE
			});
		}
		sendLocalEmailProgram(departmentControl, needConfirmRegistration) {
			ui_analytics.sendData({
				tool: Analytics.TOOLS,
				category: Analytics.CATEGORY_INVITATION,
				event: Analytics.EVENT_LOCAL_MAIL,
				c_section: this.#getCSection(),
				c_sub_section: Analytics.TAB_LOCAL_EMAIL,
				p1: this.#getIsAdmin(),
				p2: needConfirmRegistration ? Analytics.ADMIN_ALLOW_MODE_Y : Analytics.ADMIN_ALLOW_MODE_N,
				...this.#getDepartmentControlAnalytics(departmentControl)
			});
		}
		sendRegenerateLink() {
			ui_analytics.sendData({
				tool: Analytics.TOOLS,
				category: Analytics.CATEGORY_SETTINGS,
				event: Analytics.EVENT_REFRESH_LINK,
				c_section: this.#getCSection()
			});
		}
		#getDepartmentControlAnalytics(departmentControl) {
			return {
				p3: departmentControl.getValues().length > 0 ? 'department_Y' : 'department_N',
				p4: departmentControl.getGroupValues().length > 0 ? 'group_Y' : 'group_N'
			};
		}
	}

	class MessageBar {
		#errorContainer;
		#successContainer;
		constructor(options) {
			this.#errorContainer = main_core.Type.isDomNode(options.errorContainer) ? options.errorContainer : null;
			this.#successContainer = main_core.Type.isDomNode(options.successContainer) ? options.successContainer : null;
			this.hideAll();
		}
		showError(message) {
			if (!this.#errorContainer || !main_core.Type.isStringFilled(message)) {
				return;
			}
			main_core.Dom.clean(this.#errorContainer);
			main_core.Dom.style(this.#errorContainer, 'display', 'block');
			main_core.Dom.append(this.#wrapMessage(message), this.#errorContainer);
		}
		#wrapMessage(text) {
			return main_core.Tag.render`<span class="ui-alert-message">${BX.util.htmlspecialchars(text)}</span>`;
		}
		showSuccess(message) {
			if (!this.#successContainer || !main_core.Type.isStringFilled(message)) {
				return;
			}
			main_core.Dom.clean(this.#successContainer);
			main_core.Dom.style(this.#successContainer, 'display', 'block');
			main_core.Dom.append(this.#wrapMessage(message), this.#successContainer);
		}
		hideAll() {
			if (this.#errorContainer) {
				main_core.Dom.style(this.#errorContainer, 'display', 'none');
				main_core.Dom.clean(this.#errorContainer);
			}
			if (this.#successContainer) {
				main_core.Dom.style(this.#successContainer, 'display', 'none');
				main_core.Dom.clean(this.#successContainer);
			}
		}
	}

	class Page {
		constructor() {
			main_core_events.EventEmitter.subscribe(this, 'BX.Intranet.Invitation:submit', this.onSubmit.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Intranet.Invitation:onInviteRequestSuccess', this.onInviteSuccess.bind(this));
		}
		render() {
			return new HTMLElement();
		}
		onSubmit(event) {}
		onInviteSuccess(event) {}
		hasShownButtonPanel() {
			return true;
		}
	}

	class Navigation extends main_core_events.EventEmitter {
		#pages;
		#container;
		#first;
		#current;
		#history = [];
		constructor(options) {
			super();
			this.setEventNamespace('BX.Intranet.Navigation');
			this.#container = main_core.Type.isDomNode(options.container) ? options.container : null;
			if (main_core.Type.isMap(options.pages)) {
				this.#pages = new Map([...options.pages].filter(([k, page]) => page instanceof Page));
			} else {
				this.#pages = new Map();
			}
			this.#first = main_core.Type.isStringFilled(options.first) && this.has(options.first) ? options.first : this.#pages.keys().next().value;
			this.#subscribeEvents();
		}
		show(code) {
			if (!this.#container || !this.has(code)) {
				return;
			}
			const page = this.get(code);
			this.emit('onBeforeChangePage', {
				current: this.current(),
				new: page,
				newPageCode: code
			});
			main_core.Dom.clean(this.#container);
			main_core.Dom.append(page.render(), this.#container);
			if (this.#current) {
				this.#history.push(this.#current);
			}
			this.#current = code;
			this.emit('onAfterChangePage', {
				current: this.current(),
				previous: this.prev()
			});
		}
		showFirst() {
			this.show(this.#first);
		}
		get(code) {
			return this.#pages.get(code);
		}
		has(code) {
			return this.#pages.has(code);
		}
		current() {
			return this.get(this.#current);
		}
		getCurrentCode() {
			return this.#current;
		}
		prev() {
			if (this.#history.length > 0) {
				const code = this.#history[this.#history.length - 1];
				return this.get(code);
			}
			return null;
		}
		add(code, page) {
			if (page instanceof Page) {
				this.#pages.set(code, page);
			}
		}
		delete(code) {
			this.#pages.delete(code);
		}
		#subscribeEvents() {
			main_core_events.EventEmitter.subscribe('BX.Intranet.Invitation:pageUpdate', this.#onPageUpdate.bind(this));
		}
		#onPageUpdate(event) {
			if (event.data?.pages && main_core.Type.isMap(event.data?.pages)) {
				this.#pages = event.data?.pages;
				this.show(this.#current);
			}
		}
	}

	class DepartmentControlBlock {
		#container;
		#departmentControl;
		#canCreateDepartment;
		#createButton;
		#onCreateClick;
		#departmentCreationPopup = null;
		constructor(options = {}) {
			this.#departmentControl = options.departmentControl instanceof intranet_departmentControl.DepartmentControl ? options.departmentControl : null;
			this.#canCreateDepartment = options.canCreateDepartment === true;
			this.#onCreateClick = main_core.Type.isFunction(options.onCreateClick) ? options.onCreateClick : () => {};
		}
		render() {
			if (this.#container) {
				return this.#container;
			}
			this.#container = main_core.Tag.render`
			<div class="intranet-invitation-block__department-control">
				<div class="intranet-invitation-block__department-control-inner">
					${this.#departmentControl?.render()}
				</div>
				${this.#renderCreateButtonContainer()}
			</div>
		`;
			return this.#container;
		}
		#renderCreateButtonContainer() {
			if (!this.#canCreateDepartment || !this.#departmentControl?.canSelectDepartments()) {
				return '';
			}
			return main_core.Tag.render`
			<div class="intranet-invitation-block__department-control-button">
				${this.#getCreateButton().render()}
			</div>
		`;
		}
		#getCreateButton() {
			this.#createButton ??= new ui_buttons.Button({
				useAirDesign: true,
				text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_CREATE_BUTTON'),
				style: ui_buttons.AirButtonStyle.TINTED,
				size: ui_buttons.ButtonSize.LARGE,
				icon: BX.UI.IconSet.Outline.PLUS_L,
				onclick: () => {
					this.#handleCreateDepartmentClick();
					this.#onCreateClick();
				}
			});
			return this.#createButton;
		}
		#handleCreateDepartmentClick() {
			if (!this.#canCreateDepartment || !this.#departmentControl?.canSelectDepartments()) {
				return;
			}
			this.#departmentCreationPopup ??= new humanresources_departmentCreationPopup.DepartmentCreationPopup({
				onCreate: async result => {
					this.#departmentControl.handleDepartmentCreated(result?.node);
				}
			});
			this.#departmentCreationPopup.show({
				parentDepartmentId: this.#departmentControl.getSelectedDepartmentId()
			});
		}
	}

	class ContactsInput {
		#input;
		#dataTestId;
		constructor(dataTestId = 'invite-page-contact-input') {
			this.#dataTestId = dataTestId;
		}
		getInput() {
			this.#input ??= new ui_system_input.Input({
				placeholder: this.getPlaceholder(),
				design: ui_system_input.InputDesign.Grey,
				withClear: true,
				onBlur: this.#validateContactsInput.bind(this),
				onInput: this.#onInput.bind(this),
				onClear: this.#onClear.bind(this),
				dataTestId: this.#dataTestId
			});
			return this.#input;
		}
		render() {
			const wrapper = this.getInput().render();
			const container = wrapper.querySelector('.ui-system-input-container');
			const containerId = `${this.#dataTestId}-container`;
			container?.setAttribute('id', containerId);
			container?.setAttribute('data-test-id', containerId);
			return wrapper;
		}
		getValue() {
			throw new Error('Not Implemented');
		}
		getPlaceholder() {
			throw new Error('Not Implemented');
		}
		isValidValue(value) {
			throw new Error('Not Implemented');
		}
		getValidationErrorMessage() {
			throw new Error('Not Implemented');
		}
		#onInput() {
			this.getInput().setError('');
		}
		#onClear() {
			this.getInput().setError('');
		}
		#validateContactsInput() {
			const value = this.getInput().getValue();
			if (value && !this.isValidValue(value)) {
				this.getInput().setError(this.getValidationErrorMessage());
			} else {
				this.getInput().setError('');
			}
		}
	}

	class RowTextInput {
		#input;
		#placeholder;
		#dataTestId;
		#ariaLabel;
		constructor(options) {
			this.#placeholder = options.placeholder;
			this.#dataTestId = options.dataTestId;
			this.#ariaLabel = options.ariaLabel;
		}
		getInput() {
			this.#input ??= new ui_system_input.Input({
				placeholder: this.#placeholder,
				design: ui_system_input.InputDesign.Grey,
				dataTestId: this.#dataTestId
			});
			return this.#input;
		}
		render() {
			const wrapper = this.getInput().render();
			const container = wrapper.querySelector('.ui-system-input-container');
			const input = wrapper.querySelector('input');
			const containerId = `${this.#dataTestId}-container`;
			container?.setAttribute('id', containerId);
			container?.setAttribute('data-test-id', containerId);
			input?.setAttribute('aria-label', this.#ariaLabel);
			input?.setAttribute('autocomplete', 'off');
			return wrapper;
		}
		getValue() {
			return String(this.getInput().getValue() ?? '').trim();
		}
		clear() {
			this.getInput().setValue('');
		}
	}

	class NameInput extends RowTextInput {
		constructor(dataTestId = 'invite-page-name-input') {
			super({
				placeholder: main_core.Loc.getMessage('BX24_INVITE_DIALOG_ADD_NAME_PLACEHOLDER'),
				ariaLabel: main_core.Loc.getMessage('BX24_INVITE_DIALOG_ADD_NAME_ARIA_LABEL'),
				dataTestId
			});
		}
	}

	class LastNameInput extends RowTextInput {
		constructor(dataTestId = 'invite-page-last-name-input') {
			super({
				placeholder: main_core.Loc.getMessage('BX24_INVITE_DIALOG_ADD_LAST_NAME_PLACEHOLDER'),
				ariaLabel: main_core.Loc.getMessage('BX24_INVITE_DIALOG_ADD_LAST_NAME_ARIA_LABEL'),
				dataTestId
			});
		}
	}

	class InputRow {
		#container;
		#contactsInput;
		#nameInput;
		#lastNameInput;
		#id;
		constructor(options) {
			this.#id = options.id;
			this.#contactsInput = options.contactsInput;
			this.#nameInput = options.nameInput;
			this.#lastNameInput = options.lastNameInput;
		}
		render() {
			this.#container ??= main_core.Tag.render`
			<div data-test-id="invite-input-row${this.#id}" class="intranet-invite-form-row">
				${this.#contactsInput.getInput().render()}
				${this.#lastNameInput ? this.#lastNameInput.render() : ''}
				${this.#nameInput ? this.#nameInput.render() : ''}
			</div>
		`;
			return this.#container;
		}
		renderTo(target) {
			main_core.Dom.append(this.render(), target);
		}
		isEmpty() {
			return !this.#contactsInput.getInput().getValue();
		}
		isInvitationRowEmpty() {
			return !main_core.Type.isStringFilled(this.getContactsValue());
		}
		getValue() {
			const result = this.#contactsInput.getValue();
			const lastName = this.#lastNameInput?.getValue();
			const name = this.#nameInput?.getValue();
			if (main_core.Type.isStringFilled(lastName)) {
				result.LAST_NAME = lastName;
			}
			if (main_core.Type.isStringFilled(name)) {
				result.NAME = name;
			}
			return result;
		}
		getContactsValue() {
			return this.#contactsInput.getInput().getValue();
		}
		setContactsError(error) {
			this.#contactsInput.getInput().setError(error);
		}
		hasContactsError() {
			return main_core.Type.isStringFilled(this.#contactsInput.getInput().getError());
		}
		clear() {
			this.#contactsInput.getInput().setValue('');
			this.#lastNameInput?.clear();
			this.#nameInput?.clear();
		}
	}

	class EmailInput extends ContactsInput {
		getValue() {
			return {
				EMAIL: this.getInput().getValue()
			};
		}
		isValidValue(value) {
			return main_core.Validation.isEmail(value) && /^[^@]+@[^@]+\.[^@]+$/.test(value);
		}
		getPlaceholder() {
			return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_EMAIL_INPUT');
		}
		getValidationErrorMessage() {
			return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_EMAIL');
		}
	}

	const PHONE_REGEX = /^[\d+][\d ()-]{4,22}\d$/;
	class PhoneValidator {
		static isValid(phone) {
			return PHONE_REGEX.test(phone);
		}
	}

	class PhoneInput extends ContactsInput {
		getValue() {
			return {
				PHONE: this.getInput().getValue()
			};
		}
		isValidValue(value) {
			return PhoneValidator.isValid(value);
		}
		getPlaceholder() {
			return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_TITLE_PHONE');
		}
		getValidationErrorMessage() {
			return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_PHONE');
		}
	}

	class EmailOrPhoneInput extends ContactsInput {
		getValue() {
			const rawValue = this.getInput().getValue();
			return PhoneValidator.isValid(rawValue) ? {
				PHONE: rawValue
			} : {
				EMAIL: rawValue
			};
		}
		isValidValue(value) {
			return PhoneValidator.isValid(value) || main_core.Validation.isEmail(value) && /^[^@]+@[^@]+\.[^@]+$/.test(value);
		}
		getPlaceholder() {
			return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_EMAIL_OR_PHONE_INPUT');
		}
		getValidationErrorMessage() {
			return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_EMAIL_AND_PHONE');
		}
	}

	class InputRowFactory {
		#inviteType;
		#nextId = 0;
		#withProfileNameFields;
		constructor(params) {
			this.#inviteType = params.inviteType ?? InviteType.ALL;
			this.#withProfileNameFields = params.withProfileNameFields === true;
		}
		createInputsRow(id) {
			const rowId = typeof id === 'number' ? id : this.#nextId;
			this.#nextId = Math.max(this.#nextId, rowId + 1);
			const options = {
				id: rowId,
				contactsInput: this.#createContactsInput(rowId)
			};
			if (this.#withProfileNameFields) {
				options.lastNameInput = new LastNameInput(`invite-input-row${rowId}-last-name-input`);
				options.nameInput = new NameInput(`invite-input-row${rowId}-name-input`);
			}
			return new InputRow(options);
		}
		#createContactsInput(rowId) {
			switch (this.#inviteType) {
				case InviteType.EMAIL:
					return new EmailInput(`invite-input-row${rowId}-email-input`);
				case InviteType.PHONE:
					return new PhoneInput(`invite-input-row${rowId}-phone-input`);
				case InviteType.All:
				default:
					return new EmailOrPhoneInput(`invite-input-row${rowId}-contact-input`);
			}
		}
	}

	class RestoreFiredUsersPopup {
		#popup;
		#sendButton;
		#userList;
		#departmentIds;
		#workgroupIds;
		#selectedUserIds;
		#transport;
		#popupContainer;
		#isMultipleMode;
		#isRestoreUsersAccessAvailable;
		constructor(options) {
			this.#userList = options.userList;
			this.#isRestoreUsersAccessAvailable = options.isRestoreUsersAccessAvailable;
			this.#transport = options.transport;
			this.#departmentIds = options.departmentIds;
			this.#workgroupIds = options.workgroupIds;
			this.#isMultipleMode = this.#userList.length > 1;
			this.#selectedUserIds = this.#userList.map(user => user.id);
		}
		show() {
			if (main_core.Type.isArray(this.#userList) && this.#userList.length > 0) {
				this.#getPopup().show();
			}
		}
		#getPopup() {
			this.#popup ??= new main_popup.Popup({
				id: 'intranet-restore-fired-users',
				content: this.#isRestoreUsersAccessAvailable ? this.#getPopupContent() : this.#getPopupContentWithoutRestoreAccess(),
				closeByEsc: true,
				closeIcon: true,
				closeIconSize: main_popup.CloseIconSize.LARGE,
				autoHide: true,
				padding: 25,
				width: this.#isRestoreUsersAccessAvailable ? 515 : 400,
				events: {
					onPopupClose: () => {
						this.#popup.destroy();
					}
				}
			});
			return this.#popup;
		}
		#getPopupContentWithoutRestoreAccess() {
			const button = new ui_buttons.Button({
				text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_OK'),
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				onclick: () => {
					this.#getPopup().close();
				}
			}).render();
			return main_core.Tag.render`
			<div>
				<span class="ui-text --lg">
					${this.#isMultipleMode ? main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_NO_ACCESS_MULTIPLE', {
			'#LOGIN#': `<strong>${this.#userList.map(user => user.login).join(', ')}</strong>`
		}) : main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_NO_ACCESS_SINGLE', {
			'#LOGIN#': `<strong>${this.#userList[0]?.login}</strong>`
		})}
				</span>
				<div class="intranet-invitation-popup__footer">
					${button}
				</div>
			</div>
		`;
		}
		#getPopupContent() {
			this.#popupContainer = main_core.Tag.render`
			<div class="" data-role="intranet-invitation-fired-popup-container"></div>
		`;
			const headTitle = main_core.Tag.render`
			<span class="ui-text --md">
				${this.#isMultipleMode ? main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_TITLE_MULTIPLE') : main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_TITLE_SINGLE', {
			'#LOGIN#': `<strong>${this.#userList[0]?.login}</strong>`
		})}
			</span>
		`;
			main_core.Dom.append(headTitle, this.#popupContainer);
			const wrapper = main_core.Tag.render`
			<div class="intranet-invitation-fired-popup-wrapper"></div>
		`;
			this.#userList.forEach(user => {
				main_core.Dom.append(this.#getUserBlockContent(user), wrapper);
			});
			main_core.Dom.append(wrapper, this.#popupContainer);
			const buttons = main_core.Tag.render`
			<div class="intranet-invitation-popup__footer">
				${this.#getActionContent()}
			</div>
		`;
			main_core.Dom.append(buttons, this.#popupContainer);
			return this.#popupContainer;
		}
		#getUserRole(user) {
			let roleNode = main_core.Tag.render``;
			if (user.role === 'collaber') {
				roleNode = main_core.Tag.render`
				<span class="ui-text --3xs intranet-invitation-fired-popup-user__name-role --collaber">
					${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_USER_ROLE_COLLABER')}
				</span>
			`;
			}
			if (user.role === 'extranet') {
				roleNode = main_core.Tag.render`
				<span class="ui-text --3xs intranet-invitation-fired-popup-user__name-role --extranet">
					${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_USER_ROLE_EXTRANET')}
				</span>
			`;
			}
			return roleNode;
		}
		#getUserBlockContent(user) {
			let checkboxNode = main_core.Tag.render``;
			if (this.#isMultipleMode) {
				checkboxNode = main_core.Tag.render`
				<div style="margin-left: 10px;">
					<input 
						type="checkbox" 
						checked 
						class="intranet-invitation-checkbox" 
						value="${user?.id}"
					/>
				</div>
			`;
			}
			const userBlock = main_core.Tag.render`
			<div class="intranet-invitation-fired-popup-user__wrapper ${this.#isMultipleMode ? '--filled' : ''}">
				${checkboxNode}
				<div>
					${this.#renderUserAvatar(user)}
				</div>
				<div class="intranet-invitation-fired-popup-user__name-block ${this.#isMultipleMode ? '' : '--wide'}">
					<a href="${user.profileUrl}" class="ui-link ui-link-dashed" style="font-size:16px;">${user.name}</a>
					<div>${ui_system_typography.Text.render(user?.position, {
			size: '2xs',
			className: 'intranet-invitation-fired-popup-user__text'
		})}</div>
					${this.#getUserRole(user)}
				</div>
				<div>
					${user?.email ? main_core.Tag.render`<a href="mailto:${user.email}" class="ui-link ui-link-dashed">${user.email}</a>` : ''}
					<div>${ui_system_typography.Text.render(user?.phoneNumber, {
			size: '2xs',
			className: 'intranet-invitation-fired-popup-user__text'
		})}</div>
				</div>
			</div>
		`;
			this.#bindCheckboxChange(userBlock);
			return userBlock;
		}
		#bindCheckboxChange(userBlock) {
			const checkbox = userBlock.querySelector('input[type="checkbox"]');
			main_core.Event.bind(checkbox, 'change', () => {
				const userId = Number(checkbox.value);
				if (checkbox.checked) {
					main_core.Dom.addClass(userBlock, '--filled');
					if (!this.#selectedUserIds.includes(userId)) {
						this.#selectedUserIds.push(userId);
					}
				} else {
					main_core.Dom.removeClass(userBlock, '--filled');
					this.#selectedUserIds = this.#selectedUserIds.filter(id => id !== userId);
				}
				this.#checkSendButtonState();
			});
		}
		#renderUserAvatar(user) {
			const avatarWrapper = main_core.Tag.render`<div class='intranet-invitation-fired-popup-user__avatar-wrapper'></div>`;
			const avatarOptions = {
				size: 40,
				userpicPath: user?.photo ?? null
			};
			let avatar = null;
			if (user.role === 'collaber') {
				avatar = new ui_avatar.AvatarRoundGuest(avatarOptions);
			} else if (user.role === 'extranet') {
				avatar = new ui_avatar.AvatarRoundExtranet(avatarOptions);
			} else {
				avatar = new ui_avatar.AvatarRound(avatarOptions);
			}
			avatar.renderTo(avatarWrapper);
			return avatarWrapper;
		}
		#getActionContent() {
			return main_core.Tag.render`
			<div class="intranet-invitation-popup__footer-button-container">
				${this.#getSendButton().render()}
				${this.#getPassLoginButton().render()}
			</div>
		`;
		}
		#checkSendButtonState() {
			if (this.#selectedUserIds.length > 0) {
				this.#sendButton.setState(ui_buttons.ButtonState.ACTIVE);
			} else {
				this.#sendButton.setState(ui_buttons.ButtonState.DISABLED);
			}
		}
		#getSendButton() {
			this.#sendButton ??= new ui_buttons.Button({
				text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_RESTORE'),
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				onclick: () => {
					const currentButtonState = this.#sendButton.getState();
					if (currentButtonState === ui_buttons.ButtonState.WAITING || currentButtonState === ui_buttons.ButtonState.DISABLED) {
						return;
					}
					this.#sendButton.setState(ui_buttons.ButtonState.WAITING);
					this.#transport.send({
						action: 'restoreFiredUsers',
						data: {
							userIds: this.#isMultipleMode ? this.#selectedUserIds : [this.#userList[0].id],
							departmentIds: this.#departmentIds,
							workgroupIds: this.#workgroupIds
						}
					}, {
						showSuccessPopup: false
					}).then(response => {
						this.#getPopup().close();
						this.#showSuccessNotification(response.data.restoredUserIds);
					}).catch(reject => {
						console.error(reject);
					});
				}
			});
			return this.#sendButton;
		}
		#getPassLoginButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_PASS_LOGIN'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.PLAIN,
				onclick: () => {
					if (top.BX.Helper) {
						top.BX.Helper.show('redirect=detail&code=17964466');
					}
				}
			});
		}
		#showSuccessNotification(restoredUserIds) {
			const restoredUserIdsNumeric = new Set(restoredUserIds.map(id => Number(id)));
			const restoredUsers = this.#userList.filter(user => restoredUserIdsNumeric.has(user.id));
			const notificationOptions = {
				id: 'restore-notification-success',
				autoHideDelay: 4000,
				closeButton: false,
				autoHide: true,
				content: this.#getNotificationContent(restoredUsers),
				useAirDesign: true
			};
			const notify = BX.UI.Notification.Center.notify(notificationOptions);
			notify.show();
			notify.activateAutoHide();
		}
		#getNotificationContent(restoredUsers) {
			return main_core.Tag.render`
			<div class="invite-email-notification">
				<div class="invite-email-notification__content">
					<div class="invite-email-notification__description ui-text --2xs">
						${restoredUsers.length > 1 ? main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_SUCCESS_NOTIFICATION_MULTIPLE', {
			'#NAME#': `<strong>${restoredUsers[0]?.name}</strong>`,
			'#NUM#': restoredUsers.length - 1
		}) : main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_SUCCESS_NOTIFICATION_SINGLE', {
			'#NAME#': `<strong>${restoredUsers[0]?.name}</strong>`
		})}
					</div>
				</div>
			</div>
		`;
		}
	}

	class Transport {
		#componentName;
		#signedParameters;
		#onSuccess;
		#analytics;
		constructor(options) {
			this.#componentName = options.componentName;
			this.#signedParameters = options.signedParameters;
			this.#analytics = options.analytics;
			this.#onSuccess = options.onSuccess;
			this.onError = options.onError;
		}
		send(request, onError = null, analyticsData = null) {
			request.data.analyticsData = analyticsData ?? this.#analytics.getDataForAction();
			return main_core.ajax.runComponentAction(this.#componentName, request.action, {
				signedParameters: this.#signedParameters,
				mode: main_core.Type.isStringFilled(request.mode) ? request.mode : 'ajax',
				method: main_core.Type.isStringFilled(request.method) ? request.method : 'post',
				data: request.data,
				analyticsLabel: request.analyticsLabel
			}).then(response => {
				this.#onSuccess(response);
				return response;
			}).catch(reject => {
				if (onError) {
					onError(reject);
				} else {
					this.onError(reject);
				}
			});
		}
		sendAction(request, onError = null, analyticsData = null) {
			request.data.analyticsData = analyticsData ?? this.#analytics.getDataForAction();
			return main_core.ajax.runAction(request.action, {
				signedParameters: this.#signedParameters,
				mode: main_core.Type.isStringFilled(request.mode) ? request.mode : 'ajax',
				method: main_core.Type.isStringFilled(request.method) ? request.method : 'post',
				data: request.data,
				analytics: request.data.analyticsData
			}).then(response => {
				this.#onSuccess(response);
				return response;
			}).catch(reject => {
				if (onError) {
					onError(reject);
				} else {
					this.onError(reject);
				}
			});
		}
	}

	class ExtranetPage extends Page {
		#container;
		#inputsFactory;
		#inputsRows;
		#transport;
		#departmentControl;
		#departmentControlBlock;
		constructor(options) {
			super();
			this.#inputsRows = [];
			this.#transport = options.transport;
			this.#inputsFactory = options.inputsFactory instanceof InputRowFactory ? options.inputsFactory : null;
			this.#departmentControl = options.departmentControl instanceof intranet_departmentControl.DepartmentControl ? options.departmentControl : null;
			this.#departmentControlBlock = options.departmentControlBlock instanceof DepartmentControlBlock ? options.departmentControlBlock : null;
		}
		render() {
			if (this.#container) {
				return this.#container;
			}
			const rowsContainer = main_core.Tag.render`
			<div class="intranet-invite-form-rows-container"></div>
		`;
			for (let i = 0; i < 2; i++) {
				const inputsRow = this.#inputsFactory.createInputsRow(i);
				this.#inputsRows.push(inputsRow);
				inputsRow.renderTo(rowsContainer);
			}
			this.#container = main_core.Tag.render`
			<div class="intranet-invitation-block">
				${this.#departmentControlBlock?.render()}
				<div class="intranet-invitation-block__content">
					<span class="intranet-invitation-status__title ui-headline --sm">${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_SMS_INVITATION_TITLE')}</span>
					${rowsContainer}
					${this.#getAddButton(rowsContainer).render()}
					<div class="intranet-invitation-block__footer">
						${this.#getInviteButton().render()}
					</div>
				</div>
			</div>
		`;
			return this.#container;
		}
		#getInviteButton() {
			const inviteButton = new ui_buttons.Button({
				useAirDesign: true,
				text: main_core.Loc.getMessage('BX24_INVITE_DIALOG_BUTTON_INVITE'),
				style: ui_buttons.AirButtonStyle.FILLED,
				props: {
					'data-test-id': 'invite-extranet-page-submit-button'
				},
				onclick: () => {
					if (inviteButton.isWaiting()) {
						return;
					}
					inviteButton.setState(ui_buttons.ButtonState.WAITING);
					this.#transport.send({
						action: 'extranet',
						data: {
							invitations: this.#getEnteredInvitations(),
							tab: 'email',
							workgroupIds: this.#departmentControl.getAllValues()[intranet_departmentControl.EntityType.EXTRANET]
						},
						analyticsLabel: {
							INVITATION_TYPE: 'extranet',
							INVITATION_COUNT: this.#getEnteredInvitations().length
						}
					}).then(response => {
						if (response.data.invitedUserIds.length > 0) {
							main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:showSuccessPopup');
						}
						this.#inputsRows.forEach(inputRow => {
							inputRow.clear();
						});
						inviteButton.setState(null);
						if (response.data.firedUserList && response.data.firedUserList.length > 0) {
							new RestoreFiredUsersPopup({
								userList: response.data.firedUserList,
								isRestoreUsersAccessAvailable: response.data.isRestoreUsersAccessAvailable,
								transport: this.#transport
							}).show();
						}
					}).catch(reject => {
						inviteButton.setState(null);
					});
				}
			});
			return inviteButton;
		}
		#getAddButton(rowsContainer) {
			return new ui_buttons.Button({
				useAirDesign: true,
				text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_ADD_MORE'),
				style: ui_buttons.AirButtonStyle.PLAIN_ACCENT,
				icon: BX.UI.IconSet.Outline.CIRCLE_PLUS,
				props: {
					'data-test-id': 'invite-extranet-page-add-more-button'
				},
				onclick: () => {
					const inputsRow = this.#inputsFactory.createInputsRow();
					this.#inputsRows.push(inputsRow);
					inputsRow.renderTo(rowsContainer);
				}
			});
		}
		#getEnteredInvitations() {
			const result = [];
			this.#inputsRows.forEach(inputRow => {
				if (!inputRow.isEmpty()) {
					result.push(inputRow.getValue());
				}
			});
			return result;
		}
		getAnalyticTab() {
			return Analytics.TAB_EXTRANET;
		}
	}

	class IntegratorInviteConfirmPopup {
		#popup;
		#onConfirm;
		#onCancel;
		constructor(options) {
			this.#onConfirm = options.onConfirm;
			this.#onCancel = options.onCancel;
		}
		show() {
			this.#getPopup().show();
		}
		#getPopup() {
			this.#popup ??= new main_popup.Popup({
				id: 'integrator-confirm-invitation-popup',
				content: this.#getPopupContent(),
				closeByEsc: true,
				closeIcon: true,
				closeIconSize: main_popup.CloseIconSize.LARGE,
				autoHide: true,
				padding: 0,
				overlay: {
					backgroundColor: 'rgba(0, 32, 78, 0.46)'
				}
			});
			return this.#popup;
		}
		#getPopupContent() {
			return main_core.Tag.render`
			<div class="intranet-invitation-popup">
				<div class="intranet-invitation-popup__title">
					<span class="ui-headline --sm">${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_POPUP_TITLE')}</span>
				</div>
				<div class="intranet-invitation-popup__body">
					<p class="intranet-invitation-description ui-text --sm">
						${this.#getDescription()}
					</p>
				</div>
				<div class="intranet-invitation-popup__footer">
					<div class="intranet-invitation-popup__footer-button-container">
						${this.#getConfirmButton().render()}
						${this.#getCancelButton().render()}
					</div>
				</div>
			</div>
		`;
		}
		#getConfirmButton() {
			return new ui_buttons.Button({
				id: 'integrator-confirm-invitation-popup-submit-button',
				text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_BUTTON_YES'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.FILLED,
				onclick: () => {
					this.#onConfirm();
					this.#getPopup().close();
				}
			});
		}
		#getCancelButton() {
			return new ui_buttons.Button({
				id: 'integrator-confirm-invitation-popup-cancel-button',
				text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_BUTTON_NO'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				onclick: () => {
					this.#onCancel();
					this.#getPopup().close();
				}
			});
		}
		#getDescription() {
			return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_DESCRIPTION_MSGVER_1', {
				'[LINK]': '<a href="javascript:top.BX.Helper.show(\'redirect=detail&code=20682986\')" class="ui-link ui-link-secondary ui-link-dashed ui-text --sm">',
				'[/LINK]': '</a>'
			});
		}
	}

	class IntegratorPage extends Page {
		#container;
		#emailInput;
		#transport;
		#inviteButton;
		#confirmPopup;
		#analytics;
		constructor(options) {
			super();
			this.#transport = options.transport;
			this.#analytics = options.analytics;
		}
		render() {
			if (this.#container) {
				return this.#container;
			}
			this.#container = main_core.Tag.render`
			<div class="intranet-invitation-block">
				<div class="intranet-invitation-block__content">
					<div class="intranet-invitation-block__header">
						${this.#renderDescription()}
					</div>
					<div class="intranet-invitation-block__body">
						${this.#getEmailInput().render()}
					</div>
					<div class="intranet-invitation-block__footer">
						${this.#getInviteButton().render()}
					</div>
				</div>
			</div>
		`;
			return this.#container;
		}
		#renderDescription() {
			const message = main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_POPUP_DESCRIPTION', {
				'[LINK]': '<a href="javascript:top.BX.Helper.show(\'redirect=detail&code=7725333\')" class="ui-link ui-link-secondary ui-link-dashed ui-text --md">',
				'[/LINK]': '</a>'
			});
			return main_core.Tag.render`
			<p class="intranet-invitation-description ui-text --md">${message}</p>
		`;
		}
		#getEmailInput() {
			this.#emailInput ??= new ui_system_input.Input({
				label: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_INTEGRATOR_EMAIL_PLACEHOLDER'),
				design: ui_system_input.InputDesign.Grey
			});
			return this.#emailInput;
		}
		#getInviteButton() {
			this.#inviteButton ??= new ui_buttons.Button({
				useAirDesign: true,
				text: main_core.Loc.getMessage('BX24_INVITE_DIALOG_BUTTON_INVITE'),
				style: ui_buttons.AirButtonStyle.FILLED,
				props: {
					'data-test-id': 'invite-integrator-page-submit-button'
				},
				onclick: () => {
					if (this.#inviteButton?.isWaiting()) {
						return;
					}
					this.#inviteButton?.setState(ui_buttons.ButtonState.WAITING);
					this.#getConfirmPopup().show();
				}
			});
			return this.#inviteButton;
		}
		#getConfirmPopup() {
			this.#confirmPopup ??= new IntegratorInviteConfirmPopup({
				onConfirm: () => {
					this.#transport.sendAction({
						action: 'intranet.v2.Integrator.Invitation.send',
						data: {
							integratorEmail: this.#getEmailInput().getValue()
						}
					}, reject => {
						this.#inviteButton?.setState(null);
						this.#transport.onError(reject);
					}, {
						...this.#analytics.getDataForAction('default'),
						INVITATION_TYPE: 'integrator'
					}).then(() => {
						main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:showSuccessPopup');
						this.#inviteButton?.setState(null);
					}).catch(reject => {
						top.console.error(reject);
					});
				},
				onCancel: () => {
					this.#inviteButton?.setState(null);
				}
			});
			return this.#confirmPopup;
		}
		getAnalyticTab() {
			return Analytics.TAB_INTEGRATOR;
		}
	}

	class InputRowsContainer {
		#inputRows;
		#container;
		constructor(inputRows) {
			this.#inputRows = inputRows;
		}
		render() {
			if (!this.#container) {
				this.#container = main_core.Tag.render`
				<div data-test-id="invite-input-rows" class="intranet-invite-form-rows-container"></div>
			`;
				this.#inputRows.forEach(inputRow => {
					inputRow.renderTo(this.#container);
				});
			}
			return this.#container;
		}
		addRow(inputRow) {
			this.#inputRows.push(inputRow);
			if (this.#container) {
				inputRow.renderTo(this.#container);
			}
		}
		clearAll() {
			this.#inputRows.forEach(inputRow => {
				inputRow.clear();
			});
		}
		isInvitationInputRowsEmpty() {
			for (const inputRow of this.#inputRows) {
				if (!inputRow.isInvitationRowEmpty()) {
					return false;
				}
			}
			return true;
		}
		getEnteredInvitations() {
			const result = [];
			this.#inputRows.forEach(inputRow => {
				if (!inputRow.isEmpty()) {
					result.push(inputRow.getValue());
				}
			});
			return result;
		}
		hasError() {
			for (const inputRow of this.#inputRows) {
				if (inputRow.hasContactsError()) {
					return true;
				}
			}
			return false;
		}
		highlightErrorInputs(values, error) {
			this.#inputRows.forEach(inputRow => {
				const value = inputRow.getContactsValue();
				if (value && values.includes(value)) {
					inputRow.setContactsError(error);
				}
			});
		}
	}

	class InviteEmailPopup {
		#popup;
		#input;
		#sendButton;
		#departmentControl;
		#inviteType;
		#analytics;
		#transport;
		constructor(options) {
			this.#departmentControl = options.departmentControl;
			this.#inviteType = options.inviteType;
			this.#analytics = options.analytics;
			this.#transport = options.transport;
		}
		show() {
			this.#getPopup().show();
		}
		#getInput() {
			this.#input ??= new intranet_invitationInput.InvitationInput({
				id: 'invite-page-popup-invitation-input',
				inputType: this.#inviteType,
				onReadySave: this.onReadySaveInputHandler.bind(this),
				onUnreadySave: this.onUnreadySaveInputHandler.bind(this),
				placeholder: this.#getPlaceholder()
			});
			return this.#input;
		}
		#getPlaceholder() {
			switch (this.#inviteType) {
				case InviteType.EMAIL:
					return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_INVITE_POPUP_INPUT_EMAIL_PLACEHOLDER');
				case InviteType.PHONE:
					return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_INPUT_PHONE_PLACEHOLDER');
				case InviteType.ALL:
				default:
					return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_INPUT_EMAIL_OR_PHONE_PLACEHOLDER');
			}
		}
		#getPopup() {
			this.#popup ??= new main_popup.Popup({
				content: this.#getPopupContent(),
				id: 'email-invitation-email',
				className: 'email-invitation-container',
				closeIcon: true,
				autoHide: false,
				closeByEsc: true,
				width: 515,
				closeIconSize: main_popup.CloseIconSize.LARGE,
				padding: 0,
				overlay: {
					backgroundColor: 'rgba(0, 32, 78, 0.46)'
				}
			});
			return this.#popup;
		}
		#getPopupContent() {
			return main_core.Tag.render`
			<div class="intranet-invitation-popup">
				<div class="intranet-invitation-popup__title">
					<span class="ui-headline --sm">${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_EMAIL_TITLE')}</span>
				</div>
				<div class="intranet-invitation-popup__body">
					<p class="intranet-invitation-description ui-text --sm">
						${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_EMAIL_DESCRIPTION_MSGVER_1')}
					</p>
					<div class="email-popup-container__input">
						${this.#getInput().render()}
					</div>
				</div>
				<div class="intranet-invitation-popup__footer">
					${this.#getActionContent()}
				</div>
			</div>
		`;
		}
		#getActionContent() {
			return main_core.Tag.render`
			<div class="intranet-invitation-popup__footer-button-container">
				${this.#getSendButton().render()}
				${this.#getCancelButton().render()}
			</div>
		`;
		}
		#getSendButton() {
			this.#sendButton ??= new ui_buttons.Button({
				id: 'invite-popup-send-button',
				text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_EMAIL_ACTION_SEND'),
				state: ui_buttons.ButtonState.DISABLED,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				onclick: () => {
					if (this.#sendButton.getState() === ui_buttons.ButtonState.WAITING) {
						return;
					}
					const departmentIds = this.#departmentControl.getValues();
					const workgroupIds = this.#departmentControl.getGroupValues();
					this.#sendButton.setState(ui_buttons.ButtonState.WAITING);
					this.#getInput().inviteToDepartmentGroup(departmentIds, workgroupIds, this.#analytics.getDataForAction('mass')).then(response => {
						if (response.data.invitedUserIds.length > 0) {
							main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:showSuccessPopup');
						}
						this.#getPopup().close();
						this.#sendButton.setState(null);
						if (response.data?.firedUserList && response.data?.firedUserList.length > 0) {
							new RestoreFiredUsersPopup({
								userList: response.data.firedUserList,
								isRestoreUsersAccessAvailable: response.data.isRestoreUsersAccessAvailable,
								transport: this.#transport,
								departmentIds,
								workgroupIds
							}).show();
						}
					}).catch(() => {
						this.#sendButton.setState(null);
					});
				}
			});
			return this.#sendButton;
		}
		#getCancelButton() {
			return new ui_buttons.Button({
				id: 'invite-popup-cancel-button',
				text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_EMAIL_ACTION_CANCEL'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				onclick: () => this.#getPopup().close()
			});
		}
		onReadySaveInputHandler() {
			this.#getSendButton().setState(null);
		}
		onUnreadySaveInputHandler() {
			this.#getSendButton().setState(ui_buttons.ButtonState.DISABLED);
		}
	}

	class InvitePage extends Page {
		#container;
		#inputsFactory;
		#departmentControl;
		#departmentControlBlock;
		#transport;
		#inviteType;
		#inviteEmailPopup;
		#analytics;
		#inputsRowsContainer;
		#showMassInviteButton;
		constructor(options) {
			super();
			this.#inputsFactory = options.inputsFactory;
			this.#departmentControl = options.departmentControl;
			this.#departmentControlBlock = options.departmentControlBlock instanceof DepartmentControlBlock ? options.departmentControlBlock : null;
			this.#transport = options.transport;
			this.#inviteType = options.inviteType;
			this.#showMassInviteButton = options.showMassInviteButton;
			this.#analytics = options.analytics;
		}
		render() {
			if (this.#container) {
				return this.#container;
			}
			this.#container = main_core.Tag.render`
			<div class="intranet-invitation-block">
				${this.#departmentControlBlock?.render()}
				<div class="intranet-invitation-block__content">
					<span class="intranet-invitation-status__title ui-headline --sm">${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_SMS_INVITATION_TITLE')}</span>
					${this.#getInputRowsContainer().render()}
					<span class="intranet-invitation-actions">
						${this.#getAddButton().render()}
						${this.#showMassInviteButton ? main_core.Tag.render`
							<span class="ui-text --sm">
								${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_OR')}
							</span>
							${this.#renderMassInviteButton()}
						` : ''}
					</span>
					<div class="intranet-invitation-block__footer">
						${this.#getInviteButton().render()}
					</div>
				</div>
			</div>
		`;
			return this.#container;
		}
		#getInputRowsContainer() {
			if (this.#inputsRowsContainer) {
				return this.#inputsRowsContainer;
			}
			const inputsRows = [];
			for (let i = 0; i < 2; i++) {
				const inputsRow = this.#inputsFactory.createInputsRow(i);
				inputsRows.push(inputsRow);
			}
			this.#inputsRowsContainer = new InputRowsContainer(inputsRows);
			return this.#inputsRowsContainer;
		}
		#renderMassInviteButton() {
			const button = main_core.Tag.render`
			<span data-test-id="invite-invite-page-open-invite-popup-button" class="ui-link ui-link-secondary ui-link-dashed ui-text --sm">
				${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_ADD_MASSIVE')}
			</span>
		`;
			main_core.Event.bind(button, 'click', this.#openMassInvitePopup.bind(this));
			return button;
		}
		#openMassInvitePopup() {
			if (!this.#inviteEmailPopup) {
				this.#inviteEmailPopup = new InviteEmailPopup({
					departmentControl: this.#departmentControl,
					inviteType: this.#inviteType,
					analytics: this.#analytics,
					transport: this.#transport
				});
			}
			this.#analytics.sendOpenMassInvitePopup(this.#inviteType);
			this.#inviteEmailPopup.show();
		}
		#getInviteButton() {
			const inviteButton = new ui_buttons.Button({
				useAirDesign: true,
				text: main_core.Loc.getMessage('BX24_INVITE_DIALOG_BUTTON_INVITE'),
				style: ui_buttons.AirButtonStyle.FILLED,
				props: {
					'data-test-id': 'invite-invite-page-submit-button'
				},
				onclick: () => {
					if (inviteButton.isWaiting() || this.#inputsRowsContainer.hasError()) {
						return;
					}
					if (this.#inputsRowsContainer.isInvitationInputRowsEmpty()) {
						main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:onError', {
							error: this.#getEmptyError()
						});
						return;
					}
					main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:clearError');
					inviteButton.setState(ui_buttons.ButtonState.WAITING);
					const departmentIds = this.#departmentControl.getValues();
					const workgroupIds = this.#departmentControl.getGroupValues();
					this.#transport.send({
						action: 'inviteWithGroupDp',
						data: {
							invitations: this.#inputsRowsContainer.getEnteredInvitations(),
							departmentIds,
							workgroupIds,
							tab: 'email'
						}
					}, reject => {
						inviteButton.setState(null);
						let handled = false;
						if (reject.errors) {
							handled = this.#handleErrors(reject.errors);
						}
						if (!handled) {
							this.#transport.onError(reject);
						}
					}, this.#analytics.getDataForAction('default')).then(response => {
						if (response.data.invitedUserIds.length > 0) {
							main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:showSuccessPopup');
						}
						this.#inputsRowsContainer.clearAll();
						inviteButton.setState(null);
						if (response.data?.firedUserList && response.data?.firedUserList.length > 0) {
							new RestoreFiredUsersPopup({
								userList: response.data.firedUserList,
								isRestoreUsersAccessAvailable: response.data.isRestoreUsersAccessAvailable,
								transport: this.#transport,
								departmentIds,
								workgroupIds
							}).show();
						}
					}).catch(reject => {
						console.error(reject);
					});
				}
			});
			return inviteButton;
		}
		#handleErrors(errors) {
			let handled = false;
			errors.forEach(error => {
				if (error.code === 'EMAIL_EXIST_ERROR') {
					this.#inputsRowsContainer.highlightErrorInputs(error.customData.emailList, main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_INPUT_EMAIL_EXIST_ERROR'));
					handled = true;
				}
				if (error.code === 'PHONE_EXIST_ERROR') {
					this.#inputsRowsContainer.highlightErrorInputs(error.customData.phoneList, main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_INPUT_PHONE_EXIST_ERROR'));
					handled = true;
				}
				if (error.code === 'EMAIL_INVALID_ERROR') {
					this.#inputsRowsContainer.highlightErrorInputs(error.customData.emailList, main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_EMAIL'));
					handled = true;
				}
				if (error.code === 'PHONE_INVALID_ERROR') {
					this.#inputsRowsContainer.highlightErrorInputs(error.customData.phoneList, main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_PHONE'));
					handled = true;
				}
			});
			return handled;
		}
		#getAddButton() {
			return new ui_buttons.Button({
				useAirDesign: true,
				text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_ADD_MORE'),
				style: ui_buttons.AirButtonStyle.PLAIN_ACCENT,
				icon: BX.UI.IconSet.Outline.CIRCLE_PLUS,
				props: {
					'data-test-id': 'invite-invite-page-add-more-button'
				},
				onclick: () => {
					const inputsRow = this.#inputsFactory.createInputsRow();
					this.#inputsRowsContainer.addRow(inputsRow);
				}
			});
		}
		#getEmptyError() {
			switch (this.#inviteType) {
				case InviteType.EMAIL:
					return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_EMPTY_ERROR_EMAIL');
				case InviteType.PHONE:
					return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_EMPTY_ERROR_PHONE');
				case InviteType.ALL:
				default:
					return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_EMPTY_ERROR_EMAIL_AND_PHONE');
			}
		}
		getAnalyticTab() {
			return this.#inviteType === InviteType.PHONE ? Analytics.TAB_PHONE : Analytics.TAB_EMAIL;
		}
	}

	class LinkDisabledPage extends Page {
		#container;
		#isAdmin;
		#transport;
		constructor(options) {
			super();
			this.#isAdmin = options.isAdmin === true;
			this.#transport = options.transport;
		}
		render() {
			if (this.#container) {
				return this.#container;
			}
			this.#container = main_core.Tag.render`
			<div class="intranet-invitation-block" data-role="self-block"></div>
		`;
			const statusBlock = main_core.Tag.render`
			<div class="intranet-invitation-status --invite-link-disabled">
				<div class="intranet-invitation-status__content">
					<span class="intranet-invitation-status__title ui-headline --md">${main_core.Loc.getMessage('INTRANET_INVITE_ALERT_INVITATION_LINK_DISABLED')}</span>
					<p class="intranet-invitation-status__description ui-text --lg">
						${main_core.Loc.getMessage(this.#isAdmin ? 'INTRANET_INVITE_DIALOG_STATUS_INVITATION_LINK_DISABLE_DESCRIPTION' : 'INTRANET_INVITE_DIALOG_STATUS_INVITATION_LINK_DISABLE_DESCRIPTION_NOT_ADMIN')}
					</p>
				</div>
			</div>
		`;
			if (this.#isAdmin) {
				main_core.Dom.append(main_core.Tag.render`
				<div class="intranet-invitation-status__footer">${this.#getEnableButton().render()}</div>
			`, statusBlock);
			}
			main_core.Dom.append(main_core.Tag.render`
			<div class="intranet-invitation-block__content">
				${statusBlock}
			</div>
		`, this.#container);
			return this.#container;
		}
		#getEnableButton() {
			const enableButton = new ui_buttons.Button({
				useAirDesign: true,
				text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_ENABLE_BUTTON'),
				style: ui_buttons.AirButtonStyle.FILLED,
				props: {
					'data-test-id': 'invite-link-page-enable-button'
				},
				onclick: () => {
					if (enableButton.isWaiting()) {
						return;
					}
					enableButton.setState(ui_buttons.ButtonState.WAITING);
					this.#transport.send({
						action: 'self',
						data: {
							allow_register: 'Y'
						}
					}).then(() => {
						enableButton.setState(null);
						main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:selfChange', {
							selfEnabled: true
						});
					}).catch(() => {
						enableButton.setState(null);
					});
				}
			});
			return enableButton;
		}
		getAnalyticTab() {
			return Analytics.TAB_LINK;
		}
	}

	class LinkOptionsSection {
		#isAdmin;
		#isCloud;
		#needConfirmRegistration;
		#whiteList;
		#linkRegisterEnabled;
		#analytics;
		#transport;
		#allowRegisterWhiteList;
		#confirmRegistrationSwitcher;
		#allowInviteWithLinkSwitcher;
		#regenerateSecretButton;
		#section;
		#optionsExpanded = false;
		#isSaving = false;
		#isRegenerating = false;
		#needSaveAfterCurrentRequest = false;
		#isWhiteListEnterBound = false;
		#onRegenerateStart = null;
		#onRegenerate = null;
		#onRegenerateError = null;
		#onNeedConfirmRegistrationChange = null;
		#onNeedConfirmRegistrationChangeStart = null;
		#onNeedConfirmRegistrationChangeEnd = null;
		#onExpandedChange = null;
		constructor(options) {
			this.#isAdmin = options.isAdmin === true;
			this.#isCloud = options.isCloud === true;
			this.#needConfirmRegistration = options.needConfirmRegistration === true;
			this.#whiteList = main_core.Type.isStringFilled(options.whiteList) ? options.whiteList : '';
			this.#linkRegisterEnabled = options.linkRegisterEnabled === true;
			this.#analytics = options.analytics;
			this.#transport = options.transport;
			this.#onRegenerateStart = main_core.Type.isFunction(options.onRegenerateStart) ? options.onRegenerateStart : null;
			this.#onRegenerate = main_core.Type.isFunction(options.onRegenerate) ? options.onRegenerate : null;
			this.#onRegenerateError = main_core.Type.isFunction(options.onRegenerateError) ? options.onRegenerateError : null;
			this.#onNeedConfirmRegistrationChange = main_core.Type.isFunction(options.onNeedConfirmRegistrationChange) ? options.onNeedConfirmRegistrationChange : null;
			this.#onNeedConfirmRegistrationChangeStart = main_core.Type.isFunction(options.onNeedConfirmRegistrationChangeStart) ? options.onNeedConfirmRegistrationChangeStart : null;
			this.#onNeedConfirmRegistrationChangeEnd = main_core.Type.isFunction(options.onNeedConfirmRegistrationChangeEnd) ? options.onNeedConfirmRegistrationChangeEnd : null;
			this.#onExpandedChange = main_core.Type.isFunction(options.onExpandedChange) ? options.onExpandedChange : null;
		}
		renderSection() {
			if (!this.#isAdmin) {
				return '';
			}
			if (this.#section) {
				return this.#section;
			}
			const allowInviteWithLinkSwitcherContainer = main_core.Tag.render`
			<div class="intranet-invitation-link-options__switcher">
				<div class="intranet-invitation-link-options__switcher-header">
					${this.#getAllowInviteWithLinkSwitcher().getNode()}
					<span class="intranet-invitation-link-options__switcher-title">${main_core.Loc.getMessage('INTRANET_INVITE_ALLOW_INVITATION_LINK')}</span>
				</div>
				<div class="intranet-invitation-link-options__switcher-description">${main_core.Loc.getMessage('INTRANET_INVITE_ALLOW_INVITATION_LINK_HINT_MSGVER_1')}</div>
			</div>
		`;
			const confirmRegistrationSwitcherContainer = main_core.Tag.render`
			<div class="intranet-invitation-link-options__switcher">
				<div class="intranet-invitation-link-options__switcher-header">
					${this.#getConfirmRegistrationSwitcher().getNode()}
					<span class="intranet-invitation-link-options__switcher-title">${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FAST_REG_TYPE')}</span>
				</div>
			</div>
		`;
			const body = main_core.Tag.render`
			<div class="intranet-invitation-link-options__body --divided">
				<div class="intranet-invitation-link-options__item">
					${allowInviteWithLinkSwitcherContainer}
				</div>
			</div>
		`;
			if (this.#isCloud) {
				main_core.Dom.append(main_core.Tag.render`
				<div class="intranet-invitation-link-options__item">
					${confirmRegistrationSwitcherContainer}
					${this.#getAllowRegisterWhiteList().render()}
				</div>
			`, body);
			}
			this.#section = main_core.Tag.render`
			<div class="intranet-invitation-block__options-section intranet-invitation-link-options">
				${body}
				<div class="intranet-invitation-link-options__footer">
					${this.#renderRegenerateSecretButton()}
				</div>
			</div>
		`;
			main_core.Dom.addClass(this.#section, '--collapsed');
			this.#refreshSectionHeight();
			this.#bindAllowRegisterWhiteListEnterHandler();
			return this.#section;
		}
		toggleSection() {
			if (this.#optionsExpanded) {
				this.#hideSection();
				return;
			}
			this.#showSection();
		}
		#showSection() {
			if (!this.#section) {
				return;
			}
			this.#optionsExpanded = true;
			this.#onExpandedChange?.(true);
			this.#refreshSectionHeight();
			requestAnimationFrame(() => {
				main_core.Dom.removeClass(this.#section, '--collapsed');
			});
		}
		#hideSection() {
			if (!this.#section) {
				return;
			}
			this.#optionsExpanded = false;
			this.#onExpandedChange?.(false);
			this.#refreshSectionHeight();
			requestAnimationFrame(() => {
				this.#section?.classList.add('--collapsed');
			});
		}
		#refreshSectionHeight() {
			if (!this.#section) {
				return;
			}
			this.#section.style.setProperty('--link-options-section-height', `${this.#section.scrollHeight}px`);
		}
		#renderRegenerateSecretButton() {
			this.#regenerateSecretButton ??= new ui_buttons.Button({
				useAirDesign: true,
				text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_OPTIONS_BUTTON_UPDATE'),
				style: ui_buttons.AirButtonStyle.PLAIN_ACCENT,
				icon: BX.UI.IconSet.Outline.REFRESH,
				props: {
					id: 'invite-link-options-inline-regenerate-button'
				},
				onclick: this.#regenerateSecret.bind(this)
			});
			return this.#regenerateSecretButton.render();
		}
		#getAllowInviteWithLinkSwitcher() {
			this.#allowInviteWithLinkSwitcher ??= new ui_switcher.Switcher({
				id: 'allow-invite-with-link-switcher',
				checked: this.#linkRegisterEnabled,
				size: ui_switcher.SwitcherSize.medium,
				useAirDesign: true,
				handlers: {
					unchecked: () => {
						this.#getAllowRegisterWhiteList().setDesign(this.#getConfirmRegistrationSwitcher().isChecked() ? ui_system_input.InputDesign.Grey : ui_system_input.InputDesign.Disabled);
						this.#getConfirmRegistrationSwitcher().disable(false);
					},
					checked: () => {
						this.#getAllowRegisterWhiteList().setDesign(ui_system_input.InputDesign.Disabled);
						this.#getConfirmRegistrationSwitcher().disable(true);
					},
					toggled: this.#saveOptions.bind(this)
				}
			});
			return this.#allowInviteWithLinkSwitcher;
		}
		#getAllowRegisterWhiteList() {
			if (!this.#allowRegisterWhiteList) {
				this.#allowRegisterWhiteList = new ui_system_input.Input({
					label: main_core.Loc.getMessage('BX24_INVITE_DIALOG_REGISTER_TYPE_DOMAINS_MSGVER_1'),
					placeholder: 'example.com',
					design: this.#needConfirmRegistration && this.#linkRegisterEnabled ? ui_system_input.InputDesign.Grey : ui_system_input.InputDesign.Disabled,
					onInput: this.#onAllowRegisterWhiteListInput.bind(this),
					onBlur: this.#onAllowRegisterWhiteListBlur.bind(this),
					onChipClear: chip => {
						this.#allowRegisterWhiteList.removeChip(chip);
						this.#refreshSectionHeight();
						this.#allowRegisterWhiteList.focus();
						void this.#saveOptions();
					}
				});
				this.#addDefaultChips();
			}
			return this.#allowRegisterWhiteList;
		}
		#getConfirmRegistrationSwitcher() {
			this.#confirmRegistrationSwitcher ??= new ui_switcher.Switcher({
				id: 'confirm-registration-switcher',
				checked: this.#needConfirmRegistration,
				size: ui_switcher.SwitcherSize.medium,
				useAirDesign: true,
				disabled: !this.#linkRegisterEnabled,
				handlers: {
					unchecked: () => {
						this.#getAllowRegisterWhiteList().setDesign(ui_system_input.InputDesign.Grey);
					},
					checked: () => {
						this.#getAllowRegisterWhiteList().setDesign(ui_system_input.InputDesign.Disabled);
					},
					toggled: this.#saveOptions.bind(this)
				}
			});
			return this.#confirmRegistrationSwitcher;
		}
		#bindAllowRegisterWhiteListEnterHandler() {
			if (this.#isWhiteListEnterBound) {
				return;
			}
			const input = this.#getAllowRegisterWhiteList().render().querySelector('.ui-system-input-value');
			if (!input) {
				return;
			}
			main_core.Event.bind(input, 'keydown', this.#onAllowRegisterWhiteListKeydown.bind(this));
			this.#isWhiteListEnterBound = true;
		}
		async #regenerateSecret() {
			if (this.#isRegenerating) {
				return;
			}
			this.#isRegenerating = true;
			this.#setRegenerateButtonLoadingState(true);
			this.#onRegenerateStart?.();
			try {
				await this.#transport.send({
					action: 'self',
					data: {
						allow_register_secret: main_core.Text.getRandom(8)
					}
				}, reject => {
					this.#transport.onError(reject);
					throw reject;
				});
				top.BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_UPDATE_SUCCESS'),
					autoHideDelay: 2500
				});
				this.#analytics.sendRegenerateLink();
				await this.#onRegenerate?.();
			} catch {
				this.#onRegenerateError?.();
				top.BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_UPDATE_ERROR'),
					autoHideDelay: 2500
				});
			} finally {
				this.#isRegenerating = false;
				this.#setRegenerateButtonLoadingState(false);
			}
		}
		#setRegenerateButtonLoadingState(isLoading) {
			this.#regenerateSecretButton?.setState(isLoading ? ui_buttons.ButtonState.WAITING : null);
		}
		#onAllowRegisterWhiteListBlur() {
			this.#commitWhiteListInput();
		}
		#onAllowRegisterWhiteListInput(event) {
			if (![' ', ','].includes(event.data)) {
				return;
			}
			this.#collectWhiteListInputValue(false);
		}
		#onAllowRegisterWhiteListKeydown(event) {
			if (event.key !== 'Enter') {
				return;
			}
			event.preventDefault();
			this.#commitWhiteListInput();
		}
		#addDefaultChips() {
			this.#allowRegisterWhiteList?.removeChips();
			if (this.#whiteList.trim().length > 0) {
				this.#whiteList.split(';').forEach(domain => {
					if (domain.trim().length > 0) {
						this.#addChip(domain.trim());
					}
				});
			}
			this.#refreshSectionHeight();
		}
		#addChip(value) {
			if (this.#isValidDomain(value)) {
				this.#allowRegisterWhiteList?.addChip({
					text: value,
					design: ui_system_chip.ChipDesign.TintedSuccess,
					withClear: true
				});
			} else {
				this.#allowRegisterWhiteList?.addChip({
					text: value,
					design: ui_system_chip.ChipDesign.TintedAlert,
					withClear: true
				});
			}
		}
		#isValidDomain(domain) {
			if (!domain) {
				return true;
			}
			const domainPattern = /^(?:[\da-z](?:[\da-z-]{0,61}[\da-z])?\.)+[a-z]{2,}$/i;
			return domainPattern.test(domain);
		}
		#getWhiteListValue() {
			return this.#getAllowRegisterWhiteList().getChips().filter(chip => chip.getDesign() !== ui_system_chip.ChipDesign.TintedAlert).map(chip => chip.getText()).join(';');
		}
		#commitWhiteListInput() {
			this.#collectWhiteListInputValue(true);
		}
		#collectWhiteListInputValue(shouldSave) {
			const input = this.#getAllowRegisterWhiteList();
			const normalizedValue = input.getValue().replace(/[,\s]+$/g, '').trim();
			if (normalizedValue.length > 0) {
				this.#addChip(normalizedValue);
				input.setValue('');
				this.#refreshSectionHeight();
			}
			if (shouldSave) {
				void this.#saveOptions();
			}
		}
		async #saveOptions() {
			const allowRegister = this.#getAllowInviteWithLinkSwitcher().isChecked();
			const needConfirmRegistration = this.#getConfirmRegistrationSwitcher().isChecked();
			const whiteList = this.#getWhiteListValue();
			const isNeedConfirmRegistrationChanged = needConfirmRegistration === this.#needConfirmRegistration;
			if (allowRegister === this.#linkRegisterEnabled && needConfirmRegistration === this.#needConfirmRegistration && whiteList === this.#whiteList) {
				return;
			}
			if (this.#isSaving) {
				this.#needSaveAfterCurrentRequest = true;
				return;
			}
			this.#isSaving = true;
			this.#needSaveAfterCurrentRequest = false;
			this.#setSavingState(true);
			if (isNeedConfirmRegistrationChanged) {
				this.#onNeedConfirmRegistrationChangeStart?.();
				await this.#waitForNextFrame();
			}
			const savedLinkRegisterEnabled = this.#linkRegisterEnabled;
			const savedNeedConfirmRegistration = this.#needConfirmRegistration;
			const savedWhiteList = this.#whiteList;
			try {
				await this.#transport.send({
					action: 'self',
					data: {
						allow_register: allowRegister ? 'Y' : 'N',
						allow_register_confirm: needConfirmRegistration ? 'Y' : 'N',
						allow_register_whitelist: whiteList
					}
				}, reject => {
					this.#transport.onError(reject);
					throw reject;
				});
				this.#linkRegisterEnabled = allowRegister;
				this.#needConfirmRegistration = needConfirmRegistration;
				this.#whiteList = whiteList;
				this.#onNeedConfirmRegistrationChange?.(this.#needConfirmRegistration);
				if (!this.#linkRegisterEnabled) {
					main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:selfChange', {
						selfEnabled: false
					});
				}
			} catch (reject) {
				this.#linkRegisterEnabled = savedLinkRegisterEnabled;
				this.#needConfirmRegistration = savedNeedConfirmRegistration;
				this.#whiteList = savedWhiteList;
				this.#getAllowInviteWithLinkSwitcher().check(this.#linkRegisterEnabled, false);
				this.#getConfirmRegistrationSwitcher().check(this.#needConfirmRegistration, false);
				this.#getConfirmRegistrationSwitcher().disable(!this.#linkRegisterEnabled, false);
				this.#addDefaultChips();
				console.error(reject);
			} finally {
				if (isNeedConfirmRegistrationChanged) {
					this.#onNeedConfirmRegistrationChangeEnd?.();
				}
				this.#isSaving = false;
				this.#setSavingState(false);
				if (this.#needSaveAfterCurrentRequest) {
					void this.#saveOptions();
				}
			}
		}
		#waitForNextFrame() {
			return new Promise(resolve => {
				requestAnimationFrame(() => resolve());
			});
		}
		#setSavingState(isSaving) {
			this.#allowInviteWithLinkSwitcher?.setLoading(isSaving);
			this.#confirmRegistrationSwitcher?.setLoading(isSaving);
			this.#getAllowRegisterWhiteList().setDesign(isSaving ? ui_system_input.InputDesign.Disabled : this.#getConfirmRegistrationSwitcher().isChecked() && this.#getAllowInviteWithLinkSwitcher().isChecked() ? ui_system_input.InputDesign.Grey : ui_system_input.InputDesign.Disabled);
		}
	}

	class LinkPage extends Page {
		static #COPY_BUTTON_DEFAULT_TEXT = 'BX24_INVITE_DIALOG_COPY_LINK';
		static #COPY_BUTTON_SUCCESS_TEXT = 'INTRANET_INVITE_DIALOG_LINK_COPIED_BUTTON';
		#container;
		#isAdmin;
		#isCloud;
		#needConfirmRegistration;
		#departmentControl;
		#departmentControlBlock;
		#inviteLink = '';
		#isLinkLoading = true;
		#inviteLinkRequestId = 0;
		#isDepartmentControlSubscribed = false;
		#whiteList = '';
		#linkRegisterEnabled = false;
		#analytics;
		#transport;
		#linkInput;
		#copyLinkButton;
		#isCopyLinkButtonSuccess = false;
		#linkOptionsSection = null;
		#linkOptionsButton = null;
		#isLinkOptionsExpanded = false;
		#loader = null;
		#loaderOverlay = null;
		constructor(options) {
			super();
			this.#isAdmin = options.isAdmin === true;
			this.#isCloud = options.isCloud === true;
			this.#needConfirmRegistration = options.needConfirmRegistration === true;
			this.#departmentControl = options.departmentControl instanceof intranet_departmentControl.DepartmentControl ? options.departmentControl : null;
			this.#departmentControlBlock = options.departmentControlBlock instanceof DepartmentControlBlock ? options.departmentControlBlock : null;
			this.#inviteLink = main_core.Type.isString(options.invitationLink) ? options.invitationLink : '';
			this.#isLinkLoading = !main_core.Type.isStringFilled(this.#inviteLink);
			this.#whiteList = main_core.Type.isStringFilled(options.whiteList) ? options.whiteList : '';
			this.#linkRegisterEnabled = options.linkRegisterEnabled === true;
			this.#analytics = options.analytics;
			this.#transport = options.transport;
		}
		render() {
			if (this.#container) {
				return this.#container;
			}
			this.#container = main_core.Tag.render`
			<div class="intranet-invitation-block" data-role="self-block">
				${this.#departmentControlBlock?.render()}
				<div class="intranet-invitation-block__content">
					<div class="intranet-invitation-block__header">
						<span class="intranet-invitation-status__title ui-headline --sm">${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_INVITATION_TITLE')}</span>
					</div>
					<div class="intranet-invitation-block__copy-link-wrapper">
						<div class="intranet-invitation-block__copy-link-input-wrapper">
							${this.#getLinkInput().render()}
						</div>
						${this.#getCopyLinkButton().render()}
					</div>
					<div class="intranet-invitation-block__footer">
						${this.#renderLinkOptionsButton()}
					</div>
				</div>
				<div class="intranet-invitation-block__loader-overlay"></div>
			</div>
		`;
			this.#loaderOverlay = this.#container.querySelector('.intranet-invitation-block__loader-overlay');
			this.#subscribeToDepartmentChanges();
			if (this.#isLinkLoading) {
				void this.#loadInviteLink();
			}
			return this.#container;
		}
		#getLoader() {
			this.#loader ??= new main_loader.Loader({
				target: this.#loaderOverlay,
				color: 'var(--ui-color-accent-main-primary-alt-2)'
			});
			return this.#loader;
		}
		#setConfirmRegistrationLoadingState(isLoading) {
			if (!this.#container) {
				return;
			}
			main_core.Dom.toggleClass(this.#container, '--loading', isLoading);
			main_core.Dom.toggleClass(this.#loaderOverlay, '--shown', isLoading);
			if (isLoading) {
				void this.#getLoader().show();
				return;
			}
			void this.#loader?.hide();
		}
		#getLinkInput() {
			this.#linkInput ??= new ui_system_input.Input({
				design: this.#isLinkLoading ? ui_system_input.InputDesign.Disabled : ui_system_input.InputDesign.Grey,
				value: this.#inviteLink,
				readonly: true
			});
			return this.#linkInput;
		}
		#getCopyLinkButton() {
			this.#copyLinkButton ??= new ui_buttons.Button({
				useAirDesign: true,
				text: main_core.Loc.getMessage(LinkPage.#COPY_BUTTON_DEFAULT_TEXT),
				icon: BX.UI.IconSet.Outline.LINK,
				style: ui_buttons.AirButtonStyle.FILLED,
				onclick: this.#copyRegisterUrl.bind(this),
				size: BX.UI.ButtonSize.LARGE,
				props: {
					'data-test-id': 'invite-link-page-copy-link-button'
				}
			});
			return this.#copyLinkButton;
		}
		#renderLinkOptionsButton() {
			if (!this.#isAdmin) {
				return '';
			}
			this.#linkOptionsButton ??= main_core.Tag.render`
			<div
				class="intranet-invitation-link__footer-link ${this.#isLinkOptionsExpanded ? '--expanded' : ''}"
				data-test-id="invite-link-page-option-button"
				onclick="${() => this.#toggleLinkOptionsSection()}"
			>
				<span class="ui-link ui-link-secondary ui-link-dashed">${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_OPTIONS')}</span>
				<i class="ui-icon-set --chevron-down-l"></i>
			</div>
		`;
			return this.#linkOptionsButton;
		}
		#getLinkOptionsSection() {
			this.#linkOptionsSection ??= new LinkOptionsSection({
				isAdmin: this.#isAdmin,
				isCloud: this.#isCloud,
				needConfirmRegistration: this.#needConfirmRegistration,
				whiteList: this.#whiteList,
				linkRegisterEnabled: this.#linkRegisterEnabled,
				analytics: this.#analytics,
				transport: this.#transport,
				onRegenerateStart: () => {
					this.#setLinkLoadingState(true);
				},
				onRegenerate: () => {
					return this.#loadInviteLink();
				},
				onRegenerateError: () => {
					this.#setLinkLoadingState(false);
				},
				onNeedConfirmRegistrationChange: needConfirmRegistration => {
					this.#needConfirmRegistration = needConfirmRegistration === true;
				},
				onNeedConfirmRegistrationChangeStart: () => {
					this.#setConfirmRegistrationLoadingState(true);
				},
				onNeedConfirmRegistrationChangeEnd: () => {
					this.#setConfirmRegistrationLoadingState(false);
				},
				onExpandedChange: isExpanded => {
					this.#setLinkOptionsButtonExpandedState(isExpanded);
				}
			});
			return this.#linkOptionsSection;
		}
		#toggleLinkOptionsSection() {
			const linkOptionsSection = this.#getLinkOptionsSection();
			const sectionNode = linkOptionsSection.renderSection();
			if (!sectionNode.isConnected) {
				const footerNode = this.#container?.querySelector('.intranet-invitation-block__footer');
				footerNode?.after(sectionNode);
			}
			linkOptionsSection.toggleSection();
		}
		#setLinkOptionsButtonExpandedState(isExpanded) {
			this.#isLinkOptionsExpanded = isExpanded === true;
			main_core.Dom.toggleClass(this.#isLinkOptionsExpanded, '--expanded');
		}
		#copyRegisterUrl(copyLinkButton) {
			if (copyLinkButton.getState() === ui_buttons.ButtonState.WAITING || this.#isLinkLoading) {
				return;
			}
			const invitationUrl = this.#getLinkInput().getValue();
			if (!main_core.Type.isStringFilled(invitationUrl)) {
				return;
			}
			copyLinkButton.setState(ui_buttons.ButtonState.WAITING);
			this.#copyToClipboard(invitationUrl).then(() => {
				copyLinkButton.setState(null);
				this.#setCopyLinkButtonSuccessState();
				this.#analytics.sendCopyLink(this.#departmentControl, this.#needConfirmRegistration);
			}).catch(reject => {
				copyLinkButton.setState(null);
				console.error(reject);
			});
		}
		#subscribeToDepartmentChanges() {
			if (this.#isDepartmentControlSubscribed || !(this.#departmentControl instanceof intranet_departmentControl.DepartmentControl)) {
				return;
			}
			this.#departmentControl.subscribe('onChange', this.#onDepartmentChange.bind(this));
			this.#isDepartmentControlSubscribed = true;
		}
		#onDepartmentChange() {
			void this.#loadInviteLink();
		}
		async #loadInviteLink() {
			const requestId = ++this.#inviteLinkRequestId;
			this.#setLinkLoadingState(true);
			try {
				const response = await this.#transport.send({
					action: 'getInviteLink',
					data: {
						departmentsId: this.#departmentControl.getValues(),
						workgroupIds: this.#departmentControl.getGroupValues(),
						analyticsType: 'by_link'
					}
				}, reject => {
					this.#transport.onError(reject);
					throw reject;
				});
				if (requestId !== this.#inviteLinkRequestId) {
					return;
				}
				this.#setInviteLink(main_core.Type.isString(response.data?.invitationLink) ? response.data.invitationLink : '');
			} catch (reject) {
				if (requestId === this.#inviteLinkRequestId) {
					this.#setInviteLink('');
				}
				console.error(reject);
			} finally {
				if (requestId === this.#inviteLinkRequestId) {
					this.#setLinkLoadingState(false);
				}
			}
		}
		#setLinkLoadingState(isLoading) {
			this.#isLinkLoading = isLoading;
			this.#linkInput?.setDesign(isLoading ? ui_system_input.InputDesign.Disabled : ui_system_input.InputDesign.Grey);
		}
		#setInviteLink(inviteLink) {
			const normalizedInviteLink = main_core.Type.isString(inviteLink) ? inviteLink : '';
			const isInviteLinkChanged = normalizedInviteLink !== this.#inviteLink;
			this.#inviteLink = normalizedInviteLink;
			this.#linkInput?.setValue(this.#inviteLink);
			if (isInviteLinkChanged) {
				this.#resetCopyLinkButtonState();
			}
		}
		#setCopyLinkButtonSuccessState() {
			this.#isCopyLinkButtonSuccess = true;
			this.#copyLinkButton?.setStyle(ui_buttons.AirButtonStyle.FILLED_SUCCESS);
			this.#copyLinkButton?.setText(main_core.Loc.getMessage(LinkPage.#COPY_BUTTON_SUCCESS_TEXT));
			this.#copyLinkButton?.setIcon('s-check');
		}
		#resetCopyLinkButtonState() {
			if (!this.#isCopyLinkButtonSuccess) {
				return;
			}
			this.#isCopyLinkButtonSuccess = false;
			this.#copyLinkButton?.setStyle(ui_buttons.AirButtonStyle.FILLED);
			this.#copyLinkButton?.setText(main_core.Loc.getMessage(LinkPage.#COPY_BUTTON_DEFAULT_TEXT));
			this.#copyLinkButton?.setIcon(BX.UI.IconSet.Outline.LINK);
		}
		async #copyToClipboard(textToCopy) {
			if (!main_core.Type.isString(textToCopy)) {
				return Promise.reject();
			}

			// navigator.clipboard defined only if window.isSecureContext === true
			// so or https should be activated, or localhost address
			if (window.isSecureContext && navigator.clipboard) {
				// safari not allowed clipboard manipulation as result of ajax request
				// so timeout is hack for this, to prevent "not have permission"
				return new Promise((resolve, reject) => {
					setTimeout(() => navigator.clipboard.writeText(textToCopy).then(() => resolve()).catch(e => reject(e)), 0);
				});
			}
			return BX.clipboard?.copy(textToCopy) ? Promise.resolve() : Promise.reject();
		}
		getAnalyticTab() {
			return Analytics.TAB_LINK;
		}
	}

	class MassInvitationField {
		#input;
		#invitationType;
		#isPhoneEnabled;
		#isEmailEnabled;
		constructor(options) {
			this.#invitationType = options.useOnlyPhone ? intranet_invitationInput.InvitationInputType.PHONE : options.smsAvailable ? intranet_invitationInput.InvitationInputType.ALL : intranet_invitationInput.InvitationInputType.EMAIL;
			this.#isPhoneEnabled = [intranet_invitationInput.InvitationInputType.ALL, intranet_invitationInput.InvitationInputType.PHONE].includes(this.#invitationType);
			this.#isEmailEnabled = [intranet_invitationInput.InvitationInputType.ALL, intranet_invitationInput.InvitationInputType.EMAIL].includes(this.#invitationType);
			this.#input = new intranet_invitationInput.InvitationInput({
				inputType: this.#invitationType
			});
			this.#input.getTagSelector().setPlaceholder(main_core.Type.isStringFilled(options.placeholder) ? options.placeholder : this.#getDialogInputMessage());
			BX.Dom.style(this.#input.getTagSelector().getContainer(), 'height', '103px');
			BX.Dom.style(this.#input.getTagSelector().getContainer(), 'cursor', 'text');
			main_core.Event.bind(this.#input.getTagSelector().getContainer(), 'click', () => {
				this.#input.getTagSelector().focusTextBox();
			});
		}
		#getDialogInputMessage() {
			if (this.#isPhoneEnabled && this.#isEmailEnabled) {
				return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_EMAIL_OR_PHONE_INPUT');
			}
			if (this.#isPhoneEnabled) {
				return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_PHONE_INPUT');
			}
			return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_EMAIL_INPUT');
		}
		reset() {
			this.#input.getTagSelector().removeTags();
		}
		renderTo(node) {
			this.#input.renderTo(node);
		}
		render() {
			return this.#input.render();
		}
		invite(departmentIds) {
			return this.#input.inviteToDepartment(departmentIds);
		}
	}

	class MassPage extends Page {
		#container;
		#massInvitationField;
		#departmentControl;
		constructor(options) {
			super();
			this.#massInvitationField = new MassInvitationField({
				placeholder: '',
				smsAvailable: false
			});
			this.#departmentControl = options.departmentControl instanceof intranet_departmentControl.DepartmentControl ? options.departmentControl : null;
		}
		render() {
			if (this.#container) {
				return this.#container;
			}
			this.#container = main_core.Tag.render`
			<div class="intranet-invitation-block">
				<div class="intranet-invitation-block__department-control">
					<div class="intranet-invitation-block__department-control-inner">${this.#departmentControl.render()}</div>
				</div>
				<div class="intranet-invitation-block__content">
					<span class="intranet-invitation-status__title ui-headline --sm">${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_EMAIL_INVITATION_TITLE')}</span>
					${this.#massInvitationField.render()}
					<div class="intranet-invitation-block__footer">
						${this.#getInviteButton().render()}
					</div>
				</div>
			</div>
		`;
			return this.#container;
		}
		#getInviteButton() {
			const inviteButton = new ui_buttons.Button({
				useAirDesign: true,
				text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_TITLE_EMAIL_MSGVER_1'),
				style: ui_buttons.AirButtonStyle.FILLED,
				onclick: () => {
					if (inviteButton.getState() === ui_buttons.ButtonState.WAITING) {
						return;
					}
					inviteButton.setState(ui_buttons.ButtonState.WAITING);
					this.#massInvitationField.invite(this.#departmentControl.getValues()).then(() => {
						inviteButton.setState(null);
					}).catch(() => {
						inviteButton.setState(null);
					});
				}
			});
			return inviteButton;
		}
		getAnalyticTab() {
			return Analytics.TAB_MASS;
		}
	}

	class RegisterPage extends Page {
		#container;
		#departmentControl;
		#departmentControlBlock;
		#emailInput;
		#nameInput;
		#lastNameInput;
		#checkboxInput;
		#transport;
		constructor(options) {
			super();
			this.#departmentControl = options.departmentControl instanceof intranet_departmentControl.DepartmentControl ? options.departmentControl : null;
			this.#departmentControlBlock = options.departmentControlBlock instanceof DepartmentControlBlock ? options.departmentControlBlock : null;
			this.#transport = options.transport;
		}
		render() {
			if (this.#container) {
				return this.#container;
			}
			this.#container = main_core.Tag.render`
			<div class="intranet-invitation-block">
				${this.#departmentControlBlock?.render()}
				<div class="intranet-invitation-block__content">
					<div class="intranet-invitation-block__header">
						<span class="intranet-invitation-status__title ui-headline --sm">${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_TITLE_MSGVER_1')}</span>
<!--						<p class="intranet-invitation-description ui-text &#45;&#45;md">${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_DESCRIPTION_MSGVER_1')}</p>-->
					</div>
					<div class="intranet-invitation-block__body">
						${this.#getEmailInput().render()}
						<div class="intranet-invitation-block__inline-input">
							${this.#getNameInput().render()}
							${this.#getLastNameInput().render()}
						</div>
					</div>
					${this.#renderCheckbox()}
					<div class="intranet-invitation-block__footer">
						${this.#getRegisterButton().render()}
					</div>
				</div>
			</div>
		`;
			BX.UI.Hint.init(this.#container);
			return this.#container;
		}
		#getEmailInput() {
			this.#emailInput ??= new ui_system_input.Input({
				label: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_INPUT_EMAIL_LABEL'),
				placeholder: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_INPUT_EMAIL_PLACEHOLDER'),
				design: ui_system_input.InputDesign.Grey,
				stretched: true
			});
			return this.#emailInput;
		}
		#getNameInput() {
			this.#nameInput ??= new ui_system_input.Input({
				label: main_core.Loc.getMessage('BX24_INVITE_DIALOG_ADD_NAME_TITLE'),
				placeholder: main_core.Loc.getMessage('BX24_INVITE_DIALOG_ADD_NAME_PLACEHOLDER'),
				design: ui_system_input.InputDesign.Grey,
				stretched: true
			});
			return this.#nameInput;
		}
		#getLastNameInput() {
			this.#lastNameInput ??= new ui_system_input.Input({
				label: main_core.Loc.getMessage('BX24_INVITE_DIALOG_ADD_LAST_NAME_TITLE'),
				placeholder: main_core.Loc.getMessage('BX24_INVITE_DIALOG_ADD_LAST_NAME_PLACEHOLDER'),
				design: ui_system_input.InputDesign.Grey,
				stretched: true
			});
			return this.#lastNameInput;
		}
		#renderCheckbox() {
			return main_core.Tag.render`
			<div class="intranet-invitation-checkbox__container">
				${this.#getCheckboxInput()}
				<label class="intranet-invitation-checkbox__label ui-text --sm" for="ADD_SEND_PASSWORD">
					${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_CHECKBOX_LABEL')}
				</label>
				<div class="invite-invitation-helper"
					 data-hint="${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_CHECKBOX_HINT')}"
					 data-hint-no-icon
				>
				</div>
			</div>
		`;
		}
		#getCheckboxInput() {
			this.#checkboxInput ??= main_core.Tag.render`
			<input
				type="checkbox"
				name="ADD_SEND_PASSWORD"
				data-test-id="invite-register-checkbox"
				class="intranet-invitation-checkbox"
			>
		`;
			return this.#checkboxInput;
		}
		#getRegisterButton() {
			const registerButton = new ui_buttons.Button({
				useAirDesign: true,
				text: main_core.Loc.getMessage('BX24_INVITE_DIALOG_TAB_ADD_TITLE_NEW'),
				style: ui_buttons.AirButtonStyle.FILLED,
				props: {
					'data-test-id': 'invite-register-submit-button'
				},
				onclick: () => {
					if (registerButton.isWaiting()) {
						return;
					}
					registerButton.setState(ui_buttons.ButtonState.WAITING);
					const departmentIds = this.#departmentControl.getValues();
					const workgroupIds = this.#departmentControl.getGroupValues();
					const notSendInvitationChecked = this.#getCheckboxInput().checked;
					this.#transport.send({
						action: 'add',
						data: {
							ADD_EMAIL: this.#getEmailInput().getValue(),
							ADD_NAME: this.#getNameInput().getValue(),
							ADD_LAST_NAME: this.#getLastNameInput().getValue(),
							ADD_SEND_PASSWORD: notSendInvitationChecked ? 'Y' : 'N',
							SONET_GROUPS_CODE: workgroupIds,
							departmentIds
						}
					}, reject => {
						registerButton.setState(null);
						this.#transport.onError(reject);
					}).then(response => {
						registerButton.setState(null);
						this.#departmentControl.reset();
						this.#getEmailInput().setValue('');
						this.#getNameInput().setValue('');
						this.#getLastNameInput().setValue('');
						if (response.data.firedUserList) {
							new RestoreFiredUsersPopup({
								userList: response.data.firedUserList,
								isRestoreUsersAccessAvailable: response.data.isRestoreUsersAccessAvailable,
								transport: this.#transport,
								departmentIds,
								workgroupIds
							}).show();
						} else {
							main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:showSuccessPopup', notSendInvitationChecked ? {
								content: this.#getNotificationContentWithoutInvitation()
							} : {});
						}
					}).catch(reject => {
						console.error(reject);
					});
				}
			});
			return registerButton;
		}
		#getNotificationContentWithoutInvitation() {
			return main_core.Tag.render`
			<div class="invite-email-notification">
				<div class="invite-email-notification__content">
					<div class="invite-email-notification__title ui-text --sm --accent">
						${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_SUCCESS_ADDED_TITLE')}
					</div>
					<div class="invite-email-notification__description ui-text --2xs">
						${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_SUCCESS_ADDED_DESCRIPTION')}
					</div>
				</div>
			</div>
		`;
		}
		getAnalyticTab() {
			return Analytics.TAB_REGISTRATION;
		}
	}

	class PageFactory {
		#options;
		#userOptions;
		constructor(options, userOptions) {
			this.#options = options;
			this.#userOptions = userOptions;
		}
		createInvitePage(inviteType, showMassInviteButton = true) {
			const departmentControl = this.createDepartmentControl([intranet_departmentControl.EntityType.DEPARTMENT, intranet_departmentControl.EntityType.GROUP, intranet_departmentControl.EntityType.EXTRANET]);
			return new InvitePage({
				...this.#options,
				inviteType,
				departmentControl,
				departmentControlBlock: this.createDepartmentControlBlock(departmentControl),
				inputsFactory: this.createInputRowFactory(inviteType, true),
				showMassInviteButton
			});
		}
		createExtranetPage() {
			const departmentControl = this.createDepartmentControl([intranet_departmentControl.EntityType.EXTRANET]);
			return new ExtranetPage({
				...this.#options,
				inputsFactory: this.createInputRowFactory(InviteType.ALL),
				departmentControl,
				departmentControlBlock: this.createDepartmentControlBlock(departmentControl)
			});
		}
		createRegisterPage() {
			const departmentControl = this.createDepartmentControl([intranet_departmentControl.EntityType.DEPARTMENT, intranet_departmentControl.EntityType.GROUP, intranet_departmentControl.EntityType.EXTRANET]);
			return new RegisterPage({
				...this.#options,
				departmentControl,
				departmentControlBlock: this.createDepartmentControlBlock(departmentControl),
				inputsFactory: this.createInputRowFactory()
			});
		}
		createIntegratorPage() {
			return new IntegratorPage({
				...this.#options
			});
		}
		createLinkPage() {
			const departmentControl = this.createDepartmentControl([intranet_departmentControl.EntityType.DEPARTMENT, intranet_departmentControl.EntityType.GROUP]);
			return new LinkPage({
				...this.#options,
				departmentControl,
				departmentControlBlock: this.createDepartmentControlBlock(departmentControl)
			});
		}
		createLinkDisabledPage() {
			return new LinkDisabledPage({
				...this.#options
			});
		}
		createMassPage() {
			const departmentControl = this.createDepartmentControl([intranet_departmentControl.EntityType.DEPARTMENT]);
			return new MassPage({
				departmentControl,
				departmentControlBlock: this.createDepartmentControlBlock(departmentControl)
			});
		}
		createDepartmentControlBlock(departmentControl) {
			return new DepartmentControlBlock({
				departmentControl,
				canCreateDepartment: this.#options.canCurrentUserCreateDepartment === true
			});
		}
		createDepartmentControl(entitiesType) {
			const departmentsId = main_core.Type.isArray(this.#userOptions?.departmentList) ? this.#userOptions.departmentList : [];
			let groupOptions = {};
			const preselectedItems = [];
			const rootDepartment = this.#userOptions?.rootDepartment?.id === this.#userOptions?.companyRootDepartment?.id ? null : this.#userOptions?.rootDepartment;
			const withGroups = entitiesType.includes(intranet_departmentControl.EntityType.GROUP) || entitiesType.includes(intranet_departmentControl.EntityType.EXTRANET);
			if (withGroups) {
				groupOptions = {
					createProjectLink: !(!entitiesType.includes(intranet_departmentControl.EntityType.GROUP) && entitiesType.includes(intranet_departmentControl.EntityType.EXTRANET))
				};
				if (this.projectLimitExceeded && this.projectLimitFeatureId) {
					groupOptions.lockProjectLink = this.projectLimitExceeded;
					groupOptions.lockProjectLinkFeatureId = this.projectLimitFeatureId;
				}
				const projectId = this.#getProjectId();
				if (projectId) {
					preselectedItems.push(['project', projectId]);
				}
			}
			return new intranet_departmentControl.DepartmentControl({
				id: 'invite-page-department-control',
				title: '',
				description: '',
				entitiesType,
				groupOptions,
				preselectedItems,
				departmentList: departmentsId,
				showDepartmentCreationFooter: true,
				showDepartmentCreationFooterInRecentTab: true,
				showDepartmentCreationFooterInSearchTab: true,
				dialogOptions: {
					alwaysShowLabels: true
				},
				rootDepartment: main_core.Type.isObject(rootDepartment) ? rootDepartment : null,
				addButtonCaption: withGroups ? main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_CAPTION_WITH_GROUP_MSGVER_1') : main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_CAPTION_MSGVER_1')
			});
		}
		createInputRowFactory(inviteType, withProfileNameFields = false) {
			return new InputRowFactory({
				inviteType,
				withProfileNameFields
			});
		}
		#getProjectId() {
			return this.#userOptions?.groupId ? parseInt(this.#userOptions.groupId, 10) : 0;
		}
	}

	class PageProvider {
		#options;
		#pageFactory;
		#pages;
		constructor(options, userOptions) {
			this.#options = options;
			this.#pageFactory = new PageFactory(options, userOptions);
			this.#subscribeEvents();
		}
		provide() {
			this.#pages = new Map();
			if (this.#options.canCurrentUserInvite) {
				this.#pages.set('invite', this.#pageFactory.createInvitePage(this.#options.smsAvailable ? InviteType.ALL : InviteType.EMAIL));
				this.#pages.set('add', this.#pageFactory.createRegisterPage());
				this.#pages.set('self', this.#options.isSelfRegisterEnabled ? this.#pageFactory.createLinkPage() : this.#pageFactory.createLinkDisabledPage());
			}
			if (this.#options.isExtranetInstalled) {
				this.#pages.set('extranet', this.#pageFactory.createExtranetPage());
			}
			if (this.#options.isCloud && this.#options.canCurrentUserInvite) {
				this.#pages.set('integrator', this.#pageFactory.createIntegratorPage());
			}
			return this.#pages;
		}
		#subscribeEvents() {
			main_core_events.EventEmitter.subscribe('BX.Intranet.Invitation:selfChange', this.#onSelfRegisterChange.bind(this));
		}
		#onSelfRegisterChange(event) {
			if (!this.#pages) {
				return;
			}
			this.#pages.set('self', event.data?.selfEnabled ? this.#pageFactory.createLinkPage() : this.#pageFactory.createLinkDisabledPage());
			main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:pageUpdate', {
				pages: this.#pages
			});
		}
	}

	class SuccessInvitePopup {
		show(content) {
			const notificationOptions = {
				id: 'invite-notification-result',
				autoHideDelay: 4000,
				closeButton: false,
				autoHide: true,
				content: content || this.#getNotificationContent(),
				useAirDesign: true
			};
			const notify = BX.UI.Notification.Center.notify(notificationOptions);
			notify.show();
			notify.activateAutoHide();
		}
		#getNotificationContent() {
			return main_core.Tag.render`
			<div class="invite-email-notification">
				<div class="invite-email-notification__content">
					<div class="invite-email-notification__title ui-text --sm --accent">
						${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_SUCCESS_TITLE')}
					</div>
					<div class="invite-email-notification__description ui-text --2xs">
						${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_SUCCESS_DESCRIPTION_MSGVER_1')}
					</div>
				</div>
				<a href="/company/?apply_filter=Y&INVITED=Y" target="_blank" class="ui-link ui-link-secondary ui-link-dashed">
					${main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_SUCCESS_BUTTON')}
				</a>
			</div>
		`;
		}
	}

	class Form extends main_core_events.EventEmitter {
		constructor(formParams) {
			super();
			this.setEventNamespace('BX.Intranet.Invitation');
			const params = main_core.Type.isPlainObject(formParams) ? formParams : {};
			this.initParams(params);
			this.initUI();
			this.initAnalytics();
			this.initTransport(params);
			this.initNavigation();
			this.subscribeEvents();
		}
		initParams(params) {
			this.menuContainer = main_core.Type.isDomNode(params.menuContainerNode) ? params.menuContainerNode : null;
			this.subMenuContainer = main_core.Type.isDomNode(params.subMenuContainerNode) ? params.subMenuContainerNode : null;
			this.leftMenuItems = params.leftMenuItems;
			this.titleContainer = params.titleContainer;
			this.contentContainer = main_core.Type.isDomNode(params.contentContainerNode) ? params.contentContainerNode : null;
			this.pageContainer = main_core.Type.isDomNode(this.contentContainer) ? this.contentContainer.querySelector('.popup-window-tabs-content-invite') : null;
			this.userOptions = params.userOptions;
			this.isExtranetInstalled = params.isExtranetInstalled === 'Y';
			this.isCloud = params.isCloud === 'Y';
			this.isAdmin = params.isAdmin === 'Y';
			this.canCurrentUserInvite = params.canCurrentUserInvite === true;
			this.isInvitationBySmsAvailable = params.isInvitationBySmsAvailable === 'Y';
			this.isCreatorEmailConfirmed = params.isCreatorEmailConfirmed === 'Y';
			this.firstInvitationBlock = params.firstInvitationBlock;
			this.isSelfRegisterEnabled = params.isSelfRegisterEnabled;
			this.analyticsLabel = params.analyticsLabel;
			this.projectLimitExceeded = main_core.Type.isBoolean(params.projectLimitExceeded) ? params.projectLimitExceeded : true;
			this.projectLimitFeatureId = main_core.Type.isString(params.projectLimitFeatureId) ? params.projectLimitFeatureId : '';
			this.invitationLink = main_core.Type.isString(params.invitationLink) ? params.invitationLink : '';
			this.whitelistValue = main_core.Type.isStringFilled(params.whitelistValue) ? params.whitelistValue : '';
			this.isCollabEnabled = params.isCollabEnabled === 'Y';
			this.registerNeedConfirm = params.registerConfirm === true;
			this.canCurrentUserCreateDepartment = params.canCurrentUserCreateDepartment === true;
			this.useLocalEmailProgram = params.useLocalEmailProgram === true;
		}
		initTransport(params) {
			this.transport = new Transport({
				componentName: params.componentName,
				signedParameters: params.signedParameters,
				onSuccess: this.#onSuccessRequest.bind(this),
				onError: this.#onErrorRequest.bind(this),
				analytics: this.analytics
			});
		}
		initUI() {
			this.messageBar = new MessageBar({
				errorContainer: main_core.Type.isDomNode(this.contentContainer) ? this.contentContainer.querySelector('[data-role=\'error-message\']') : null,
				successContainer: main_core.Type.isDomNode(this.contentContainer) ? this.contentContainer.querySelector('[data-role=\'success-message\']') : null
			});
			if (main_core.Type.isDomNode(this.contentContainer)) {
				BX.UI.Hint.init(this.contentContainer);
			}
			if (main_core.Type.isDomNode(this.menuContainer)) {
				this.#initMenu();
			}
		}
		initAnalytics() {
			this.analytics = new Analytics(this.analyticsLabel, this.isAdmin);
			this.analytics.sendOpenSliderData(this.analyticsLabel.source);
		}
		initNavigation() {
			this.navigation = this.createNavigation();
			this.navigation?.subscribe('onBeforeChangePage', this.onBeforeChangePage.bind(this));
			this.navigation?.subscribe('onAfterChangePage', this.onAfterChangePage.bind(this));
			this.navigation.showFirst();
		}
		subscribeEvents() {
			main_core_events.EventEmitter.subscribe('BX.Intranet.Invitation:onError', event => {
				this.messageBar.showError(event?.data?.error);
			});
			main_core_events.EventEmitter.subscribe('BX.Intranet.Invitation:clearError', () => {
				this.messageBar.hideAll();
			});
			main_core_events.EventEmitter.subscribe('BX.Intranet.Invitation:showSuccessPopup', event => {
				this.#showSuccessPopup(event.getData().content);
			});
		}
		onBeforeChangePage(event) {
			this.messageBar.hideAll();
			const {
				newPageCode
			} = event.data;
			BX?.UI?.ToolbarManager?.getDefaultToolbar().setTitle(this.leftMenuItems[newPageCode]?.TOOLBAR_TITLE ?? this.leftMenuItems[newPageCode]?.NAME ?? '');
		}
		onAfterChangePage(event) {
			const section = this.getSubSection();
			const page = event.getData().current;
			let subSection = null;
			if (page) {
				subSection = page.getAnalyticTab();
			}
			if (this.analytics && section && subSection) {
				this.analytics.sendTabData(section, subSection);
			}
		}
		getSubSection() {
			const regex = /analyticsLabel\[source]=(\w*)&/gm;
			const match = regex.exec(decodeURI(window.location));
			if (match?.length > 1) {
				return match[1];
			}
			return null;
		}
		#initMenu() {
			if (!main_core.Type.isDomNode(this.menuContainer)) {
				this.menuItems = [];
				return;
			}
			this.menuItems = Array.prototype.slice.call(this.menuContainer.querySelectorAll('a'));
			if (main_core.Type.isDomNode(this.subMenuContainer)) {
				const subMenuItem = Array.prototype.slice.call(this.subMenuContainer.querySelectorAll('a'));
				this.menuItems = [...this.menuItems, ...subMenuItem];
			}
			(this.menuItems || []).forEach(item => {
				main_core.Event.bind(item, 'click', () => {
					this.changeContent(item.getAttribute('data-action'));
					this.activeMenuItem(this.navigation.getCurrentCode());
				});
				if (item.getAttribute('data-action') === this.firstInvitationBlock) {
					main_core.Dom.addClass(item.parentElement, 'ui-sidepanel-menu-active');
				} else {
					main_core.Dom.removeClass(item.parentElement, 'ui-sidepanel-menu-active');
				}
			});
		}
		activeMenuItem(itemType) {
			(this.menuItems || []).forEach(item => {
				main_core.Dom.removeClass(item.parentElement, 'ui-sidepanel-menu-active');
				if (item.getAttribute('data-action') === itemType) {
					main_core.Dom.addClass(item.parentElement, 'ui-sidepanel-menu-active');
				}
			});
		}
		changeContent(action) {
			if (!main_core.Type.isStringFilled(action)) {
				return;
			}
			if (action === 'active-directory') {
				if (!this.activeDirectory) {
					this.activeDirectory = new ActiveDirectory(this);
				}
				this.activeDirectory.showForm();
				this.analytics.sendTabData(this.getSubSection(), Analytics.TAB_AD);
				return;
			}
			this.navigation.show(action);
		}
		createNavigation() {
			return new Navigation({
				container: this.pageContainer,
				first: this.firstInvitationBlock,
				pages: new PageProvider({
					transport: this.transport,
					isSelfRegisterEnabled: this.isSelfRegisterEnabled,
					analytics: this.analytics,
					smsAvailable: this.isInvitationBySmsAvailable,
					useLocalEmailProgram: this.useLocalEmailProgram,
					isAdmin: this.isAdmin,
					needConfirmRegistration: this.registerNeedConfirm,
					invitationLink: this.invitationLink,
					whiteList: this.whitelistValue,
					isCloud: this.isCloud,
					linkRegisterEnabled: this.isSelfRegisterEnabled,
					isExtranetInstalled: this.isExtranetInstalled,
					canCurrentUserInvite: this.canCurrentUserInvite,
					canCurrentUserCreateDepartment: this.canCurrentUserCreateDepartment
				}, this.userOptions).provide()
			});
		}
		#showSuccessPopup(content) {
			new SuccessInvitePopup().show(content);
		}
		#onSuccessRequest(response) {
			this.messageBar.hideAll();
			if (response.data) {
				main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:onInviteRequestSuccess', {
					response
				});
			}
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'SidePanel.Slider:onClose', () => {
				BX.SidePanel.Instance.postMessageTop(window, 'BX.Bitrix24.EmailConfirmation:showPopup');
			});
		}
		#onErrorRequest(reject) {
			this.messageBar.showError(reject.errors[0].message);
		}
	}

	exports.Form = Form;
	exports.MassInvitationField = MassInvitationField;

})(this.BX.Intranet.Invitation = this.BX.Intranet.Invitation || {}, BX, BX.Event, BX.UI.Analytics, BX.Intranet, BX.UI, BX.HumanResources, BX.UI.System.Input, BX.Main, BX.UI.System.Typography, BX.UI, BX.Intranet, BX, BX.UI, BX.UI.System.Chip);
//# sourceMappingURL=script.js.map
