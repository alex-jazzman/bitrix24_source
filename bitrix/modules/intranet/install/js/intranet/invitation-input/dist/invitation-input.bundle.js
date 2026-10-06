/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_cache, main_core_events, ui_entitySelector) {
	'use strict';

	class InvitationProvider {
		invite() {
			throw new Error('Implement the method "invite" in the child class');
		}
	}

	class InvitationToGroup extends InvitationProvider {
		#groupId;
		#users;
		constructor(groupId, users) {
			super();
			this.#groupId = groupId;
			this.#users = users;
			const settings = main_core.Extension.getSettings('intranet.invitation-input');
			this.isNewProjectsAvailable = settings?.isNewProjectsAvailable;
		}
		invite() {
			return main_core.ajax.runAction('intranet.invite.inviteUsersToCollab', {
				data: {
					collabId: this.#groupId,
					users: this.#users
				}
			}).then(response => {
				const users = response?.data || [];
				let messageKey = null;
				const newUsers = users.filter(u => u.status === 'INVITED');
				const existingUsers = users.filter(u => u.status === 'ACTIVE');
				if (users.length === 0) {
					messageKey = 'INTRANET_INVITATION_INPUT_NO_USERS';
				} else if (existingUsers.length === users.length) {
					if (this.isNewProjectsAvailable) {
						messageKey = existingUsers.length === 1 ? 'INTRANET_INVITATION_INPUT_ALREADY_IN_PROJECT_SINGLE' : 'INTRANET_INVITATION_INPUT_ALREADY_IN_PROJECT_ALL';
					} else {
						messageKey = existingUsers.length === 1 ? 'INTRANET_INVITATION_INPUT_ALREADY_IN_COLLAB_SINGLE' : 'INTRANET_INVITATION_INPUT_ALREADY_IN_COLLAB_ALL';
					}
				} else if (newUsers.length !== users.length) {
					if (this.isNewProjectsAvailable) {
						messageKey = 'INTRANET_INVITATION_INPUT_ALREADY_IN_PROJECT_PARTIAL';
					} else {
						messageKey = 'INTRANET_INVITATION_INPUT_ALREADY_IN_COLLAB_PARTIAL';
					}
				}
				if (messageKey) {
					const notificationText = main_core.Loc.getMessage(messageKey);
					if (main_core.Type.isStringFilled(notificationText)) {
						BX.UI.Notification.Center.notify({
							content: notificationText,
							autoHideDelay: 2500
						});
					}
				}
				return response;
			});
		}
	}

	class InvitationToPortal extends InvitationProvider {
		#users;
		constructor(users) {
			super();
			this.#users = users;
		}
		invite() {
			return main_core.ajax.runAction('intranet.v2.Invitation.inviteUsers', {
				data: {
					invitations: this.#users
				}
			});
		}
		inviteWithDeliveryResult(invitations) {
			return main_core.ajax.runAction('intranet.v2.Invitation.inviteUsersWithDeliveryResult', {
				data: {
					invitations
				}
			});
		}
	}

	class InvitationToDepartment extends InvitationProvider {
		#users;
		#departments;
		constructor(users, departments) {
			super();
			this.#users = users;
			this.#departments = departments;
		}
		invite() {
			return main_core.ajax.runAction('intranet.v2.Invitation.inviteUsers', {
				data: {
					invitations: this.#users,
					departmentIds: this.#departments
				}
			});
		}
	}

	class InvitationToDepartmentGroup extends InvitationProvider {
		#options;
		constructor(options) {
			super();
			this.#options = options;
		}
		invite() {
			return main_core.ajax.runComponentAction('bitrix:intranet.invitation', 'inviteWithGroupDp', {
				data: {
					invitations: this.#options.users,
					departmentIds: this.#options.departmentIds,
					workgroupIds: this.#options.groupIds,
					analyticsData: this.#options.analyticsData ?? {},
					tab: 'mass'
				}
			});
		}
	}

	const InvitationInputType = Object.freeze({
		PHONE: 'phone',
		EMAIL: 'email',
		ALL: 'all'
	});
	class InvitationInput extends main_core_events.EventEmitter {
		#cache = new main_core.Cache.MemoryCache();
		#invalidPhoneNumbersTagIds = [];
		#isReadySendInvitation = false;
		#placeholder;
		#inputType;
		#isPhoneEnabled;
		#isEmailEnabled;
		#userLang = null;
		#minHeight = null;
		#showErrorBeforeSubmit;
		#showErrorAfterSubmit;
		#onReadySave;
		#onUnreadySave;
		#id;
		constructor(options) {
			super();
			this.#inputType = options?.inputType ?? InvitationInputType.ALL;
			this.setEventNamespace('BX.Intranet.InvitationInput');
			this.#minHeight = options?.minHeight;
			this.#showErrorBeforeSubmit = main_core.Type.isBoolean(options?.showErrorBeforeSubmit) ? options.showErrorBeforeSubmit : false;
			this.#showErrorAfterSubmit = main_core.Type.isBoolean(options?.showErrorAfterSubmit) ? options.showErrorAfterSubmit : true;
			const settings = main_core.Extension.getSettings('intranet.invitation-input');
			if (this.#inputType === InvitationInputType.PHONE && !settings?.isInvitationByPhoneAvailable) {
				throw new Error('Incorrect component operation parameters.');
			}
			this.#isPhoneEnabled = [InvitationInputType.ALL, InvitationInputType.PHONE].includes(this.#inputType) && Boolean(settings?.isInvitationByPhoneAvailable);
			this.#isEmailEnabled = [InvitationInputType.ALL, InvitationInputType.EMAIL].includes(this.#inputType);
			this.#placeholder = main_core.Type.isStringFilled(options?.placeholder) ? options.placeholder : this.#getDefaultPlaceholder();
			this.#onReadySave = main_core.Type.isFunction(options?.onReadySave) ? options.onReadySave : null;
			this.#onUnreadySave = main_core.Type.isFunction(options?.onUnreadySave) ? options.onUnreadySave : null;
			this.#id = main_core.Type.isStringFilled(options?.id) ? options.id : BX.Text.getRandom(5);
		}
		changeLanguage(lang) {
			if (main_core.Type.isString(lang)) {
				this.#userLang = lang;
			}
		}
		getTagSelector() {
			return this.#cache.remember('tagSelector', () => {
				return new ui_entitySelector.TagSelector({
					id: `intranet-invitation-input-${Math.random(4)}`,
					showTextBox: true,
					showAddButton: false,
					placeholder: this.#placeholder,
					tagTextColor: '#1E8D36',
					tagBgColor: '#D4FDB0',
					tagMaxWidth: 200,
					events: {
						onAfterTagRemove: this.#onAfterTagRemove.bind(this),
						onBeforeTagAdd: this.#onBeforeTagAdd.bind(this),
						onEnter: this.#onEnter.bind(this),
						onBlur: this.#onBlur.bind(this),
						onInput: this.#onInput.bind(this),
						onContainerClick: this.#onContainerClick.bind(this)
					}
				});
			});
		}
		isReadySendInvitation() {
			return this.#isReadySendInvitation;
		}
		render() {
			return this.#cache.remember('node', () => {
				this.getTagSelector().renderTo(this.getWrapper());
				this.getTagSelector().focusTextBox();
				if (main_core.Type.isNumber(this.#minHeight)) {
					const itemsContainer = this.getTagSelector().getItemsContainer();
					main_core.Dom.style(itemsContainer, 'min-height', `${this.#minHeight}px`);
				}
				return this.getWrapper();
			});
		}
		renderTo(node) {
			main_core.Dom.append(this.render(), node);
		}
		getWrapper() {
			return this.#cache.remember('wrapper', () => {
				return main_core.Tag.render`
				<div data-test-id="${this.#id}" class="intranet-invitation-wrapper"></div>
			`;
			});
		}
		inviteToGroup(groupId) {
			const invitationProvider = new InvitationToGroup(groupId, this.#getPreparedUserList());
			return this.#invite(invitationProvider);
		}
		inviteToPortal() {
			const invitationProvider = new InvitationToPortal(this.#getPreparedUserList());
			return this.#invite(invitationProvider);
		}
		inviteToPortalWithDeliveryResult(invitations) {
			const invitationProvider = new InvitationToPortal([]);
			return invitationProvider.inviteWithDeliveryResult(invitations);
		}
		showError(message) {
			this.#removeErrorBlock();
			this.#addErrorBlockByMessage(message);
		}
		clearError() {
			this.#removeErrorBlock();
		}
		inviteToDepartment(departmentIds) {
			const invitationProvider = new InvitationToDepartment(this.#getPreparedUserList(), departmentIds);
			return this.#invite(invitationProvider);
		}
		inviteToDepartmentGroup(departmentIds, groupIds, analyticsData) {
			const invitationProvider = new InvitationToDepartmentGroup({
				users: this.#getPreparedUserList(),
				analyticsData,
				departmentIds,
				groupIds
			});
			return this.#invite(invitationProvider);
		}
		hasErrorTags() {
			return this.#getErrorTags().length > 0;
		}
		isEmptyTags() {
			return this.getTagSelector().getTags().length === 0;
		}
		#invite(invitationProvider) {
			return new Promise((resolve, reject) => {
				this.#removeErrorBlock();
				if (this.#getErrorTags().length > 0) {
					this.#addErrorBlockByMessage(this.#getDefaultValidationMessage());
					reject(this.#getDefaultValidationMessage());
				} else if (this.getTagSelector().getTags().length === 0) {
					this.#addErrorBlockByMessage(this.#getEmptyValidationMessage());
					reject(this.#getEmptyValidationMessage());
				} else {
					invitationProvider.invite().then(response => {
						this.getTagSelector().removeTags();
						this.#setUnreadySaveState();
						resolve(response);
					}).catch(response => {
						if (this.#showErrorAfterSubmit) {
							this.#addErrorBlockByMessage(response.errors[0].message);
						} else {
							this.getTagSelector().removeTags();
						}
						reject(response.errors[0].message);
					});
				}
			});
		}
		#getPreparedUserList() {
			this.#removeErrorBlock();
			const selector = this.getTagSelector();
			const tags = selector.getTags();
			const users = [];
			tags.forEach(tag => {
				if (this.#isEmailEnabled && tag.getEntityType() === 'email') {
					users.push({
						email: tag.getTitle(),
						languageId: this.#userLang
					});
				}
				if (tag.getEntityType() === 'phone' && this.#isPhoneEnabled && !this.#invalidPhoneNumbersTagIds.includes(tag.getId())) {
					users.push({
						phone: tag.getTitle()
					});
				}
			});
			return users;
		}
		#getErrorTags() {
			const selector = this.getTagSelector();
			const tags = selector.getTags();
			const errorTags = [];
			tags.forEach(tag => {
				if (tag.getEntityType() === 'error') {
					errorTags.push(tag);
				}
				if (tag.getEntityType() === 'phone' && this.#isPhoneEnabled && this.#invalidPhoneNumbersTagIds.includes(tag.getId())) {
					errorTags.push(tag);
				}
			});
			return errorTags;
		}
		#setReadySaveState() {
			this.emit('onReadySave');
			this.#isReadySendInvitation = true;
			this.#onReadySave?.();
		}
		#setUnreadySaveState() {
			this.emit('onUnreadySave');
			this.#isReadySendInvitation = false;
			this.#onUnreadySave?.();
		}
		#getPhoneParser() {
			return BX.PhoneNumberParser.getInstance();
		}
		#getDefaultPlaceholder() {
			if (this.#isPhoneEnabled && !this.#isEmailEnabled) {
				return main_core.Loc.getMessage('INTRANET_INVITATION_INPUT_PLACEHOLDER_PHONE');
			}
			if (!this.#isPhoneEnabled && this.#isEmailEnabled) {
				return main_core.Loc.getMessage('INTRANET_INVITATION_INPUT_PLACEHOLDER');
			}
			return main_core.Loc.getMessage('INTRANET_INVITATION_INPUT_PLACEHOLDER_WITH_PHONE');
		}
		#getDefaultValidationMessage() {
			if (this.#isPhoneEnabled && !this.#isEmailEnabled) {
				return main_core.Loc.getMessage('INTRANET_INVITATION_INPUT_VALIDATION_MESSAGE_PHONE');
			}
			if (!this.#isPhoneEnabled && this.#isEmailEnabled) {
				return main_core.Loc.getMessage('INTRANET_INVITATION_INPUT_VALIDATION_MESSAGE');
			}
			return main_core.Loc.getMessage('INTRANET_INVITATION_INPUT_VALIDATION_MESSAGE_WITH_PHONE_MSGVER_1');
		}
		#getEmptyValidationMessage() {
			if (this.#isPhoneEnabled && !this.#isEmailEnabled) {
				return main_core.Loc.getMessage('INTRANET_INVITATION_INPUT_VALIDATION_MESSAGE_PHONE');
			}
			if (!this.#isPhoneEnabled && this.#isEmailEnabled) {
				return main_core.Loc.getMessage('INTRANET_INVITATION_INPUT_EMPTY_MESSAGE');
			}
			return main_core.Loc.getMessage('INTRANET_INVITATION_INPUT_EMPTY_MESSAGE_WITH_PHONE');
		}
		#onAfterTagRemove(event) {
			const selector = event.getTarget();
			const tags = selector.getTags();
			const errorTags = tags.filter(item => item.getEntityType() === 'error');
			if (errorTags.length === 0) {
				this.#removeErrorBlock();
			}
			if (tags.length === 0) {
				this.#setUnreadySaveState();
			} else if (errorTags.length === 0) {
				this.#setReadySaveState();
				if (this.#showErrorBeforeSubmit) {
					this.#removeErrorBlock();
				}
			}
		}
		#onBeforeTagAdd(event) {
			const {
				tag
			} = event.getData();
			const textBox = event.target.getTextBox();
			textBox.placeholder = '';
			this.#setReadySaveState();
			if (tag.getEntityType() === 'error') {
				this.#setErrorStateForTag(tag);
				if (this.#showErrorBeforeSubmit) {
					this.#addErrorBlockByMessage(this.#getDefaultValidationMessage());
				}
			}
			if (tag.getEntityType() === 'phone') {
				this.#getPhoneParser().parse(tag.getTitle()).then(result => {
					if (result.valid) {
						tag.setTitle(result.rawNumber);
					} else {
						this.#setErrorStateForTag(tag);
						this.#invalidPhoneNumbersTagIds.push(tag.getId());
						this.#addErrorBlockByMessage(this.#getDefaultValidationMessage());
					}
					tag.render();
				}).catch(() => {});
			}
		}
		#setErrorStateForTag(tag) {
			tag.setTextColor('#E92F2A');
			tag.setBgColor('#FFDCDB');
		}
		#onEnter(event) {
			const selector = event.getTarget();
			const value = selector.getTextBoxValue();
			if (value && !/^\s*$/.test(value)) {
				this.#addTagByValue(value);
			}
		}
		#onBlur(event) {
			this.#onEnter(event);
		}
		#onInput(event) {
			this.#setReadySaveState();
			const selector = event.target;
			const inputEvent = event.getData().event;
			const specialSymbols = [' ', ','];
			let value = selector.getTextBoxValue();
			const index = specialSymbols.indexOf(inputEvent.data);
			if (index === -1) {
				return;
			}
			const symbol = specialSymbols[index];
			if (value.endsWith(symbol)) {
				value = value.slice(0, -1);
			}
			if (value) {
				this.#addTagByValue(value);
			}
		}
		#onContainerClick() {
			this.getTagSelector().getTextBox().focus();
		}
		#getEntityTypeByValue(value) {
			const isPhone = this.#isPhoneEnabled ? this.#isPhone(value) : false;
			const isEmail = this.#isEmailEnabled ? main_core.Validation.isEmail(value) && /^[^@]+@[^@]+\.[^@]+$/.test(value) : false;
			if (isEmail) {
				return 'email';
			}
			if (isPhone) {
				return 'phone';
			}
			return 'error';
		}
		#addTagByValue(value) {
			const selector = this.getTagSelector();
			const parsedValues = this.#parseValue(value);
			parsedValues.forEach(part => {
				selector.addTag({
					id: part,
					title: part,
					entityId: 'invitation-tag',
					entityType: this.#getEntityTypeByValue(part)
				});
			});
			selector.clearTextBox();
		}
		#parseValue(value) {
			const parts = value.split(/[\s,]+/);
			return parts.filter(part => part.length > 0);
		}
		#isPhone(value) {
			return BX.PhoneNumber.getValidNumberRegex().test(value);
		}
		#addErrorBlockByMessage(message) {
			if (this.getWrapper().querySelector('.intranet-invitation-input-error__wrapper')) {
				return;
			}
			const errorBlock = this.#createErrorBlockByMessage(message);
			this.getWrapper().append(errorBlock);
			this.#setUnreadySaveState();
			if (!main_core.Dom.hasClass(this.getTagSelector().getOuterContainer(), '--error')) {
				main_core.Dom.addClass(this.getTagSelector().getOuterContainer(), '--error');
			}
		}
		#removeErrorBlock() {
			const errorBlock = this.getWrapper().querySelector('.intranet-invitation-input-error__wrapper');
			if (errorBlock) {
				errorBlock.remove();
			}
			if (main_core.Dom.hasClass(this.getTagSelector().getOuterContainer(), '--error')) {
				main_core.Dom.removeClass(this.getTagSelector().getOuterContainer(), '--error');
			}
		}
		#createErrorBlockByMessage(message) {
			return main_core.Tag.render`
			<div class="intranet-invitation-input-error__wrapper">
				<span class="intranet-invitation-input-error__text">${message}</span>
			</div>
		`;
		}
	}

	exports.InvitationInput = InvitationInput;
	exports.InvitationInputType = InvitationInputType;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Cache, BX.Event, BX.UI.EntitySelector);
//# sourceMappingURL=invitation-input.bundle.js.map
