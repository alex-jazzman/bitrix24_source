/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
(function (exports, main_core, ui_avatar, ui_cnt, main_date, ui_notification, ui_system_chip, main_popup, ui_icons_b24, ui_icon, ui_buttons, ui_analytics) {
	'use strict';

	class BaseField {
		#fieldId;
		#gridId;
		constructor(params) {
			this.#fieldId = params.fieldId;
			this.#gridId = params.gridId ?? null;
		}
		getGridId() {
			return this.#gridId;
		}
		getFieldId() {
			return this.#fieldId;
		}
		getGrid() {
			let grid = null;
			if (this.#gridId) {
				grid = BX.Main.gridManager.getById(this.#gridId);
			}
			return grid?.instance;
		}
		getFieldNode() {
			return document.getElementById(this.getFieldId());
		}
		appendToFieldNode(element) {
			main_core.Dom.append(element, this.getFieldNode());
		}
	}

	class EmployeeField extends BaseField {
		render(params) {
			const employeeFieldContainer = main_core.Tag.render`
			<div class="mailbox-grid_employee-card-container"></div>
		`;
			const avatar = this.#renderAvatar(params.avatar?.src);
			main_core.Dom.append(avatar, employeeFieldContainer);
			const fullName = this.#renderFullName(params);
			main_core.Dom.append(fullName, employeeFieldContainer);
			this.appendToFieldNode(employeeFieldContainer);
		}
		#renderAvatar(avatarPath) {
			const avatarOptions = {
				size: 28
			};
			if (avatarPath) {
				avatarOptions.userpicPath = encodeURI(avatarPath);
			}
			const avatar = new ui_avatar.AvatarRound(avatarOptions);
			const avatarNode = avatar.getContainer();
			main_core.Dom.addClass(avatarNode, 'mailbox-grid_owner-photo');
			return avatarNode;
		}
		#renderFullName(params) {
			const fullNameContainer = main_core.Tag.render`
			<div class="mailbox-grid_full-name-container">${this.#getFullNameLink(params.name, params.pathToProfile)}</div>
		`;
			if (params.position !== '') {
				main_core.Dom.append(this.#getPositionLabelContainer(main_core.Text.encode(params.position)), fullNameContainer);
			}
			return fullNameContainer;
		}
		#getFullNameLink(fullName, profileLink) {
			return main_core.Tag.render`
			<a class="mailbox-grid_full-name-label" href="${profileLink}">
				${main_core.Text.encode(fullName)}
			</a>
		`;
		}
		#getPositionLabelContainer(position) {
			return main_core.Tag.render`
			<div class="mailbox-grid_position-label">
				${main_core.Text.encode(position)}
			</div>
		`;
		}
	}

	class SenderNameField extends BaseField {
		#senderName;
		render(params) {
			this.#senderName = params.senderName;
			if (this.#senderName === '') {
				this.#renderEmpty();
			}
			this.#renderSenderName();
		}
		#renderEmpty() {
			const emptyContainer = main_core.Tag.render`
			<div class="mailbox-grid_sender-name --empty">
			</div>
		`;
			this.appendToFieldNode(emptyContainer);
		}
		#renderSenderName() {
			const senderNameContainer = main_core.Tag.render`
			<div class="mailbox-grid_sender-name-container mailbox-grid_single-line_field">
				${main_core.Text.encode(this.#senderName)}
			</div>
		`;
			this.appendToFieldNode(senderNameContainer);
		}
	}

	class EmailWithCounterField extends BaseField {
		render(params) {
			const counterNode = this.renderCounter(params.count, params.isOverLimit, params.counterHintText);
			const iconNode = this.#renderProviderIcon(params.serviceName);
			const emailContainer = main_core.Tag.render`
			<div class="mailbox-grid_email-container">
				${iconNode}
				<span class="mailbox-grid_email-text">${main_core.Text.encode(params.email)}</span>
				${counterNode}
			</div>
		`;
			this.appendToFieldNode(emailContainer);
			BX.UI.Hint.init(this.getFieldNode());
		}
		renderCounter(count, isOverLimit, hintText) {
			if (!(main_core.Type.isNumber(count) && count > 0)) {
				return null;
			}
			const maxValue = count;
			const value = isOverLimit ? count + 1 : count;
			const counter = new ui_cnt.Counter({
				value,
				maxValue,
				useAirDesign: true,
				style: ui_cnt.CounterStyle.FILLED_NO_ACCENT
			});
			const counterNode = main_core.Tag.render`
			<div class="mailbox-grid_counter-container">
				${counter.getContainer()}
			</div>
		`;
			if (main_core.Type.isStringFilled(hintText)) {
				main_core.Dom.attr(counterNode, {
					'data-hint': hintText,
					'data-hint-no-icon': 'true'
				});
			}
			return counterNode;
		}
		#renderProviderIcon(serviceName) {
			if (!main_core.Type.isStringFilled(serviceName)) {
				return null;
			}
			const iconKey = this.#getProviderKey(serviceName);
			const iconClass = this.#getProviderImgSrcClass(iconKey);
			return main_core.Tag.render`
			<div class="mail-provider-img-container --grid-view">
				<div class="mailbox-grid_email-icon">
					<div class="mail-provider-img ${iconClass}"></div>
				</div>
			</div>
		`;
		}
		#getProviderKey(name) {
			switch (name) {
				case 'aol':
					return 'aol';
				case 'gmail':
					return 'gmail';
				case 'yahoo':
					return 'yahoo';
				case 'mail.ru':
				case 'mailru':
					return 'mailru';
				case 'icloud':
					return 'icloud';
				case 'outlook.com':
				case 'outlook':
					return 'outlook';
				case 'office365':
					return 'office365';
				case 'exchangeOnline':
				case 'exchange':
					return 'exchange';
				case 'yandex':
					return 'yandex';
				case 'ukr.net':
					return 'ukrnet';
				case 'other':
				case 'imap':
					return 'other';
				default:
					return '';
			}
		}
		#getProviderImgSrcClass(name) {
			return `mail-provider-${name}-img`;
		}
	}

	/**
	 * @abstract
	 */
	class BaseAction {
		/**
		 * @abstract
		 */
		static getActionId() {
			throw new Error('not implemented');
		}

		/**
		 * @abstract
		 * @returns {ActionConfig}
		 */
		getActionConfig() {
			throw new Error('not implemented');
		}
		constructor(params) {
			this.grid = params.grid;
		}
		setActionParams(params) {}
		getActionData() {
			return {};
		}
		async execute() {
			this.onBeforeActionRequest();
			await this.sendActionRequest();
			this.onAfterActionRequest();
		}
		onBeforeActionRequest() {}
		async sendActionRequest() {
			try {
				const result = await new Promise((resolve, reject) => {
					const actionConfig = this.getActionConfig();
					const actionData = this.getActionData();
					const ajaxOptions = {
						...actionConfig.options,
						data: actionData
					};
					let ajaxPromise = null;
					switch (actionConfig.type) {
						case 'controller':
							ajaxPromise = BX.ajax.runAction(actionConfig.name, ajaxOptions);
							break;
						case 'component':
							ajaxPromise = BX.ajax.runComponentAction(actionConfig.component, actionConfig.name, ajaxOptions);
							break;
						default:
							{
								const errorMessage = `Unknown action type: ${actionConfig.type}`;
								const error = new Error(errorMessage);
								error.errors = [{
									message: errorMessage
								}];
								reject(error);
								return;
							}
					}
					ajaxPromise.then(resolve, reject);
				});
				this.handleSuccess(result);
			} catch (result) {
				this.handleError(result);
			}
		}
		onAfterActionRequest() {}
		handleSuccess(result) {}
		handleError(result) {}
	}

	class SyncAction extends BaseAction {
		static getActionId() {
			return 'syncAction';
		}
		getActionConfig() {
			return {
				type: 'controller',
				name: 'mail.mailboxconnecting.syncMailbox'
			};
		}
		getActionData() {
			return {
				id: this.mailboxId,
				onlySyncCurrent: 1
			};
		}
		setActionParams(params) {
			this.mailboxId = params.mailboxId;
		}
		onBeforeActionRequest() {
			this.grid.tableFade();
			const toastMessage = String(main_core.Loc.getMessage('MAIL_MAILBOX_LIST_ACTION_SYNC_START'));
			BX.UI.Notification.Center.notify({
				content: toastMessage,
				position: 'top-right',
				autoHideDelay: 3000
			});
		}
		onAfterActionRequest() {
			this.grid.reload(() => {
				this.grid.tableUnfade();
			});
		}
	}

	class OpenSettingsAction extends BaseAction {
		static getActionId() {
			return 'openSettingsAction';
		}
		setActionParams(params) {
			this.mailboxId = params.mailboxId;
			this.url = params.url ?? null;
		}
		async execute() {
			this.sendAnalytics();
			const url = this.url ?? `/mail/config/edit?id=${this.mailboxId}`;
			BX.SidePanel.Instance.open(url);
		}
		sendAnalytics() {
			BX.UI.Analytics.sendData({
				tool: 'mail',
				event: 'mailbox_grid_edit',
				category: 'mail_mass_ops',
				c_element: 'context_menu'
			});
		}
	}

	class RejectMailboxConnectionRequestAction extends BaseAction {
		static getActionId() {
			return 'rejectMailboxConnectionRequestAction';
		}
		getActionConfig() {
			return {
				type: 'controller',
				name: 'mail.api.mailboxconnectionrequest.rejectRequest'
			};
		}
		getActionData() {
			return {
				requestId: this.requestId
			};
		}
		setActionParams(params) {
			this.requestId = params.requestId;
		}
		onBeforeActionRequest() {
			this.grid.tableFade();
		}
		handleSuccess(result) {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('MAIL_MAILBOX_LIST_CONNECTION_REQUEST_REJECTED'),
				position: 'top-right',
				autoHideDelay: 3000
			});
		}
		handleError(result) {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('MAIL_MAILBOX_LIST_CONNECTION_REQUEST_REJECT_ERROR'),
				position: 'top-right',
				autoHideDelay: 3000
			});
		}
		onAfterActionRequest() {
			this.grid.tableUnfade();
		}
	}

	class ConnectMailboxConnectionRequestAction extends BaseAction {
		static getActionId() {
			return 'connectMailboxConnectionRequestAction';
		}
		setActionParams(params) {
			this.requestId = params.requestId;
			this.requesterId = params.requesterId;
		}
		async execute() {
			BX.SidePanel.Instance.open('/mail/config/', {
				cacheable: false,
				requestParams: {
					connectionRequest: {
						requestId: this.requestId,
						requesterId: this.requesterId
					}
				}
			});
		}
	}

	const actionMap = new Map([[SyncAction.getActionId(), SyncAction], [OpenSettingsAction.getActionId(), OpenSettingsAction], [RejectMailboxConnectionRequestAction.getActionId(), RejectMailboxConnectionRequestAction], [ConnectMailboxConnectionRequestAction.getActionId(), ConnectMailboxConnectionRequestAction]]);
	class ActionFactory {
		static create(actionId, options) {
			const ActionClass = actionMap.get(actionId);
			if (ActionClass) {
				return new ActionClass(options);
			}
			return null;
		}
	}

	class GridManager {
		static instances = [];
		#grid;
		constructor(gridId) {
			this.#grid = BX.Main.gridManager.getById(gridId)?.instance;
		}
		static getInstance(gridId) {
			if (!this.instances[gridId]) {
				this.instances[gridId] = new GridManager(gridId);
			}
			return this.instances[gridId];
		}
		getGrid() {
			return this.#grid;
		}
		runAction(config) {
			const actionId = config.actionId;
			const options = config.options;
			options.grid = this.#grid;
			const action = ActionFactory.create(actionId, options);
			if (action) {
				const params = config.params;
				action.setActionParams(params);
				action.execute();
			}
		}
	}

	class LastSyncField extends BaseField {
		render(params) {
			const lastSyncContainer = main_core.Tag.render`
			<div class="mailbox-grid_last-sync-container mailbox-grid_single-line_field"></div>
		`;
			if (params.hasError) {
				main_core.Dom.append(this.#getErrorMessage(), lastSyncContainer);
			} else {
				if (params.lastSync) {
					main_core.Dom.append(this.#getLastSyncContainer(params.lastSync), lastSyncContainer);
				} else {
					main_core.Dom.append(this.#getLastSyncRightNowContainer(), lastSyncContainer);
				}
				if (params.mailboxId && params.canEdit) {
					main_core.Dom.append(this.#getLastSyncButton(params.mailboxId), lastSyncContainer);
				}
			}
			this.appendToFieldNode(lastSyncContainer);
		}
		#getLastSyncContainer(lastSync) {
			let formattedTime = lastSync;
			if (/^\d+$/.test(lastSync)) {
				const timestamp = parseInt(lastSync, 10);
				formattedTime = main_date.DateTimeFormat.formatLastActivityDate(timestamp);
			}
			return main_core.Tag.render`
			<span class="mailbox-grid_last-sync-text">${main_core.Text.encode(formattedTime)}</span>
		`;
		}
		#getLastSyncRightNowContainer() {
			return main_core.Tag.render`
			<span class="mailbox-grid_last-sync-text">${main_core.Loc.getMessage('MAIL_MAILBOX_LIST_LAST_SYNC_NEW_CONNECT')}</span>
		`;
		}
		#getLastSyncButton(mailboxId) {
			const button = main_core.Tag.render`
			<div class="mailbox-grid_last-sync-button ui-icon-set --o-refresh" data-test-id="mailbox-grid_refresh-button"></div>
		`;
			main_core.Event.bind(button, 'click', () => {
				GridManager.getInstance(this.getGrid().containerId).runAction({
					actionId: 'syncAction',
					options: {},
					params: {
						mailboxId
					}
				});
			});
			return button;
		}
		#getErrorMessage() {
			return main_core.Tag.render`
			<span class="mailbox-grid_last-sync-error-message">
				${main_core.Loc.getMessage('MAIL_MAILBOX_LIST_LAST_SYNC_ERROR_MESSAGE')}
			</span>
		`;
		}
	}

	class CRMStatusField extends BaseField {
		render(params) {
			const crmStatusContainer = main_core.Tag.render`
			<div class="mailbox-grid_active-status-container">
				${this.#getStatusLabel(params.enabled)}
			</div>
		`;
			this.appendToFieldNode(crmStatusContainer);
		}
		#getStatusLabel(active) {
			const text = active ? main_core.Loc.getMessage('MAIL_MAILBOX_LIST_FIELD_CRM_STATUS_ENABLED') : main_core.Loc.getMessage('MAIL_MAILBOX_LIST_FIELD_CRM_STATUS_DISABLED');
			const design = active ? ui_system_chip.ChipDesign.OutlineSuccess : ui_system_chip.ChipDesign.Outline;
			return new ui_system_chip.Chip({
				size: ui_system_chip.ChipSize.Sm,
				rounded: true,
				text,
				design
			}).render();
		}
	}

	const EntityTypes = Object.freeze({
		USER: 'USER',
		DEPARTMENT: 'DEPARTMENT'
	});

	class EntityListPopup {
		#entities;
		#popup;
		#targetNode;
		constructor(params) {
			this.#entities = params.entities;
			this.#targetNode = params.targetNode;
		}
		#renderEntity(entity) {
			if (entity.type === EntityTypes.USER) {
				const userpicSize = 20;
				let avatarNode = null;
				if (main_core.Type.isStringFilled(entity.avatar?.src)) {
					const avatar = new BX.UI.AvatarRound({
						size: userpicSize,
						userName: entity.name,
						userpicPath: encodeURI(entity.avatar.src)
					});
					avatarNode = avatar.getContainer();
				} else {
					const avatar = new BX.UI.AvatarRound({
						size: userpicSize
					});
					avatarNode = avatar.getContainer();
				}
				if (main_core.Type.isStringFilled(entity.pathToProfile)) {
					return main_core.Tag.render`
					<a
						href="${entity.pathToProfile}"
						target="_blank"
						title="${main_core.Text.encode(entity.name)}"
						class="mailbox-grid_user-list-popup-popup-img"
					>
						<span class="mailbox-grid_user-list-popup-popup-avatar-new">${avatarNode}</span>
						<span class="mailbox-grid_user-list-popup-popup-name-link">${main_core.Text.encode(entity.name)}</span>
					</a>
				`;
				}
				return main_core.Tag.render`
				<div
					class="mailbox-grid_user-list-popup-popup-img"
					title="${main_core.Text.encode(entity.name)}"
				>
					<span class="mailbox-grid_user-list-popup-popup-avatar-new">${avatarNode}</span>
					<span class="mailbox-grid_user-list-popup-popup-name">${main_core.Text.encode(entity.name)}</span>
				</div>
			`;
			}
			if (entity.type === EntityTypes.DEPARTMENT) {
				const iconNode = main_core.Tag.render`<div class="ui-icon ui-icon-common-company"><i></i></div>`;
				if (main_core.Type.isStringFilled(entity.pathToStructure)) {
					return main_core.Tag.render`
					<a
						href="${entity.pathToStructure}"
						target="_blank"
						title="${main_core.Text.encode(entity.name)}"
						class="mailbox-grid_user-list-popup-popup-img --icon"
					>
						<span class="mailbox-grid_user-list-popup-popup-avatar-new --icon">${iconNode}</span>
						<span class="mailbox-grid_user-list-popup-popup-name-link">${main_core.Text.encode(entity.name)}</span>
					</a>
				`;
				}
				return main_core.Tag.render`
				<div
					class="mailbox-grid_user-list-popup-popup-img --icon"
					title="${main_core.Text.encode(entity.name)}"
				>
					<span class="mailbox-grid_user-list-popup-popup-avatar-new --icon">${iconNode}</span>
					<span class="mailbox-grid_user-list-popup-popup-name">${main_core.Text.encode(entity.name)}</span>
				</div>
			`;
			}
			return null;
		}
		#getContent() {
			const entityNodes = document.createDocumentFragment();
			this.#entities.forEach(entity => {
				const entityNode = this.#renderEntity(entity);
				if (entityNode) {
					main_core.Dom.append(entityNode, entityNodes);
				}
			});
			return main_core.Tag.render`
			<div class="mailbox-grid_user-list-popup-wrap-block">
				<div class="mailbox-grid_user-list-popup-popup-outer">
					<div class="mailbox-grid_user-list-popup-popup">
						${entityNodes}
					</div>
				</div>
			</div>
		`;
		}
		show() {
			if (this.#popup) {
				this.#popup.show();
				return;
			}
			this.#popup = new main_popup.Popup({
				id: `entities-with-avatars-popup-${main_core.Text.getRandom()}`,
				bindElement: this.#targetNode,
				content: this.#getContent(),
				lightShadow: true,
				autoHide: true,
				closeByEsc: true,
				className: 'popup-window-mailbox-entity-list',
				bindOptions: {
					position: 'top'
				},
				animationOptions: {
					show: {
						type: 'opacity-transform'
					},
					close: {
						type: 'opacity'
					}
				}
			});
			this.#popup.show();
		}
	}

	class EntitiesWithAvatarsField extends BaseField {
		#entities;
		#popup;
		render(params) {
			this.#entities = main_core.Type.isArray(params.entities) ? params.entities : [];
			if (this.#entities.length === 0) {
				this.#renderEmpty();
				return;
			}
			this.#renderEntities();
		}
		#renderEmpty() {
			const emptyContainer = main_core.Tag.render`
			<div class="mailbox-grid_list-members --empty"></div>
		`;
			this.appendToFieldNode(emptyContainer);
		}
		#renderEntities() {
			if (this.#entities.length === 1) {
				const entityNode = this.#renderSingleEntityLayout();
				this.appendToFieldNode(entityNode);
			} else {
				const entitiesNode = this.#renderMultipleEntitiesLayout();
				main_core.Event.bind(entitiesNode, 'click', () => this.#showPopup(entitiesNode));
				this.appendToFieldNode(entitiesNode);
			}
		}
		#renderSingleEntityLayout() {
			const entity = this.#entities[0];
			const name = main_core.Text.encode(entity.name) || '';
			const nameNode = main_core.Tag.render`<span class="mailbox-grid_list-members-name">${name}</span>`;
			if (entity.type === EntityTypes.USER) {
				const container = main_core.Tag.render`
				<a href="${entity.pathToProfile}" class="mailbox-grid_list-members --single-member --link"></a>
			`;
				const avatar = this.#renderUserAvatar(entity);
				main_core.Dom.append(avatar, container);
				main_core.Dom.append(nameNode, container);
				return container;
			}
			const icon = this.#renderDepartmentIcon();
			let container = main_core.Tag.render`
			<div class="mailbox-grid_list-members --single-member"></div>
		`;
			if (main_core.Type.isStringFilled(entity.pathToStructure)) {
				container = main_core.Tag.render`
				<a href="${entity.pathToStructure}" class="mailbox-grid_list-members --single-member --link"></a>
			`;
			}
			main_core.Dom.append(icon, container);
			main_core.Dom.append(nameNode, container);
			return container;
		}
		#renderMultipleEntitiesLayout() {
			const maxVisibleIcons = 3;
			const visibleEntities = this.#entities.slice(0, maxVisibleIcons);
			const remainingCount = this.#entities.length - visibleEntities.length;
			const iconsContainer = main_core.Tag.render`<div class="mailbox-grid_list-members"></div>`;
			visibleEntities.forEach(entity => {
				const icon = this.#renderEntityIcon(entity);
				if (icon) {
					main_core.Dom.append(icon, iconsContainer);
				}
			});
			if (remainingCount > 0) {
				main_core.Dom.append(this.#renderCounter(remainingCount), iconsContainer);
			}
			return iconsContainer;
		}
		#renderEntityIcon(entity) {
			switch (entity.type) {
				case EntityTypes.USER:
					return this.#renderUserAvatar(entity);
				case EntityTypes.DEPARTMENT:
					return this.#renderDepartmentIcon();
				default:
					return null;
			}
		}
		#showPopup(targetElement) {
			if (!this.#popup) {
				this.#popup = new EntityListPopup({
					entities: this.#entities,
					targetNode: targetElement
				});
			}
			this.#popup.show();
		}
		#renderUserAvatar(user) {
			const avatarSrc = encodeURI(user.avatar?.src) || '';
			const userName = main_core.Text.encode(user.name) || '';
			const userpicSize = 28;
			let avatar = null;
			if (main_core.Type.isStringFilled(user.avatar?.src)) {
				avatar = new ui_avatar.AvatarRound({
					size: userpicSize,
					userName,
					userpicPath: avatarSrc
				});
			} else {
				avatar = new ui_avatar.AvatarRound({
					size: userpicSize
				});
			}
			const avatarNode = avatar.getContainer();
			main_core.Dom.addClass(avatarNode, 'mailbox-grid_list-members-icon_element');
			return avatarNode;
		}
		#renderDepartmentIcon() {
			return main_core.Tag.render`
			<div class="mailbox-grid_list-members-icon_element">
				<div class="ui-icon ui-icon-common-company"><i></i></div> 
			</div>
		`;
		}
		#renderCounter(count) {
			return main_core.Tag.render`
			<div class="mailbox-grid_list-members-icon_element --count">
				<span class="mailbox-grid_warning-icon_element-plus">+</span>
				<span class="mailbox-grid_warning-icon_element-number">${count}</span>
			</div>
		`;
		}
	}

	class DailySentCountField extends BaseField {
		render(params) {
			if (main_core.Type.isNull(params.dailySentLimit)) {
				this.#renderCount(params.dailySentCount);
				return;
			}
			this.#renderCountWithLimit(params.dailySentCount, params.dailySentLimit);
		}
		#renderCountWithLimit(dailySentCount, dailySentLimit) {
			const dailySentContainer = main_core.Tag.render`
			<div class="mailbox-grid_daily-sent-count-container">
				${dailySentCount}/${dailySentLimit}
			</div>
		`;
			this.appendToFieldNode(dailySentContainer);
		}
		#renderCount(dailySentCount) {
			const dailySentContainer = main_core.Tag.render`
			<div class="mailbox-grid_daily-sent-count-container">
				${dailySentCount}
			</div>
		`;
			this.appendToFieldNode(dailySentContainer);
		}
	}

	class MonthlySentCountField extends BaseField {
		render(params) {
			if (main_core.Type.isNull(params.monthlySentLimit) || !params.monthlySentLimit > 0) {
				this.#renderCount(params.monthlySentCount);
				return;
			}
			this.#renderCountWithLimit(params.monthlySentCount, params.monthlySentLimit);
		}
		#renderCountWithLimit(monthlySentCount, monthlySentLimit) {
			const percentagePrecision = 2;
			const percentageMultiplier = 100;
			const percent = (monthlySentCount / monthlySentLimit * percentageMultiplier).toFixed(percentagePrecision);
			const dailySentContainer = main_core.Tag.render`
			<div class="mailbox-grid_daily-sent-count-container">
				${monthlySentCount}/${monthlySentLimit} (${percent}%)
			</div>
		`;
			this.appendToFieldNode(dailySentContainer);
		}
		#renderCount(monthlySentCount) {
			const monthlySentContainer = main_core.Tag.render`
			<div class="mailbox-grid_monthly-sent-count-container">
				${monthlySentCount}
			</div>
		`;
			this.appendToFieldNode(monthlySentContainer);
		}
	}

	class ActionField extends BaseField {
		render(params) {
			if (params.isConnectionRequest) {
				this.#renderConnectionRequest(params);
				return;
			}
			this.#renderMailboxAction(params);
		}
		#renderConnectionRequest(params) {
			const actionContainer = main_core.Tag.render`
			<div class="mailbox-grid_action-field-container"></div>
		`;
			const connectButton = new ui_buttons.Button({
				size: ui_buttons.Button.Size.MEDIUM,
				text: main_core.Loc.getMessage('MAIL_MAILBOX_LIST_CONNECTION_REQUEST_CONNECT'),
				useAirDesign: true,
				noCaps: true,
				wide: false,
				onclick: () => {
					BX.SidePanel.Instance.open('/mail/config/', {
						cacheable: false,
						requestParams: {
							connectionRequest: {
								requestId: params.requestId,
								requesterId: params.requesterId
							}
						}
					});
				},
				className: 'mailbox-grid_mailbox-connection-request_action-button',
				dataset: {
					id: 'mailbox-grid_action-button-connection-request-connect'
				}
			});
			connectButton.setRightCounter({
				value: 1
			});
			main_core.Dom.append(connectButton.render(), actionContainer);
			const rejectButton = new ui_buttons.Button({
				size: ui_buttons.Button.Size.MEDIUM,
				text: main_core.Loc.getMessage('MAIL_MAILBOX_LIST_CONNECTION_REQUEST_REJECT'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				noCaps: true,
				wide: false,
				onclick: () => {
					this.#rejectConnectionRequest(params.requestId);
				},
				className: 'mailbox-grid_mailbox-connection-request_action-button',
				dataset: {
					id: 'mailbox-grid_action-button-connection-request-reject'
				}
			});
			main_core.Dom.append(rejectButton.render(), actionContainer);
			this.appendToFieldNode(actionContainer);
		}
		#rejectConnectionRequest(requestId) {
			const gridId = this.getGridId();
			if (!gridId) {
				return;
			}
			GridManager.getInstance(gridId).runAction({
				actionId: 'rejectMailboxConnectionRequestAction',
				options: {},
				params: {
					requestId
				}
			});
		}
		#renderMailboxAction(params) {
			const actionContainer = main_core.Tag.render`
			<div class="mailbox-grid_action-field-container"></div>
		`;
			let button = null;
			let buttonNode = null;
			const state = this.#getState(params.canEdit ?? false);
			if (params.hasError) {
				button = new ui_buttons.Button({
					size: ui_buttons.Button.Size.MEDIUM,
					text: main_core.Loc.getMessage('MAIL_MAILBOX_LIST_ACTION_BUTTON_ERROR_ACTION'),
					useAirDesign: true,
					noCaps: true,
					wide: false,
					state,
					onclick: () => {
						if (params.canEdit) {
							const source = 'error_button';
							this.#sendAnalytics(source);
							this.#handleClick(params.url);
						}
					},
					className: 'mailbox-grid_action-button',
					dataset: {
						id: 'mailbox-grid_action-button-error-action'
					}
				});
				buttonNode = button.render();
				main_core.Dom.append(buttonNode, actionContainer);
			} else {
				button = new ui_buttons.Button({
					size: ui_buttons.Button.Size.MEDIUM,
					text: main_core.Loc.getMessage('MAIL_MAILBOX_LIST_ACTION_BUTTON_TITLE'),
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.OUTLINE_NO_ACCENT,
					noCaps: true,
					wide: false,
					state,
					onclick: () => {
						if (params.canEdit) {
							const source = 'edit_button';
							this.#sendAnalytics(source);
							this.#handleClick(params.url);
						}
					},
					className: 'mailbox-grid_action-button',
					dataset: {
						id: 'mailbox-grid_action-button-default-action'
					}
				});
				buttonNode = button.render();
				main_core.Dom.append(buttonNode, actionContainer);
			}
			this.appendToFieldNode(actionContainer);
			if (!params.canEdit) {
				main_core.Dom.attr(buttonNode, {
					'data-hint': main_core.Loc.getMessage('MAIL_MAILBOX_LIST_ACTION_BUTTON_ACCESS_LOCK'),
					'data-hint-no-icon': 'true'
				});
				BX.UI.Hint.init(this.getFieldNode());
			}
		}
		#sendAnalytics(source) {
			ui_analytics.sendData({
				tool: 'mail',
				event: 'mailbox_grid_edit',
				category: 'mail_mass_ops',
				c_element: source
			});
		}
		#handleClick(url) {
			BX.SidePanel.Instance.open(url);
		}
		#getState(canEdit) {
			return canEdit ? null : ui_buttons.Button.State.DISABLED;
		}
	}

	class MailboxNameField extends BaseField {
		#mailboxName;
		render(params) {
			this.#mailboxName = params.mailboxName;
			if (this.#mailboxName === '') {
				this.#renderEmpty();
			}
			this.#renderMailboxName();
		}
		#renderEmpty() {
			const emptyContainer = main_core.Tag.render`
			<div class="mailbox-grid_mailbox-name --empty">
			</div>
		`;
			this.appendToFieldNode(emptyContainer);
		}
		#renderMailboxName() {
			const mailboxNameContainer = main_core.Tag.render`
			<div class="mailbox-grid_mailbox-name-container mailbox-grid_single-line_field">
				${main_core.Text.encode(this.#mailboxName)}
			</div>
		`;
			this.appendToFieldNode(mailboxNameContainer);
		}
	}

	class DiskAmountField extends BaseField {
		#diskAmount;
		render(params) {
			this.#diskAmount = params.diskAmount;
			if (this.#diskAmount === '') {
				this.#renderEmpty();
			}
			this.#renderMailboxName();
		}
		#renderEmpty() {
			const emptyContainer = main_core.Tag.render`
			<div class="mailbox-grid_disk-amount --empty">
			</div>
		`;
			this.appendToFieldNode(emptyContainer);
		}
		#renderMailboxName() {
			const diskAmountContainer = main_core.Tag.render`
			<div class="mailbox-grid_disk-amount-container mailbox-grid_single-line_field">
				${main_core.Text.encode(this.#diskAmount)}
			</div>
		`;
			this.appendToFieldNode(diskAmountContainer);
		}
	}

	exports.ActionField = ActionField;
	exports.BaseField = BaseField;
	exports.CRMStatusField = CRMStatusField;
	exports.DailySentCountField = DailySentCountField;
	exports.DiskAmountField = DiskAmountField;
	exports.EmailWithCounterField = EmailWithCounterField;
	exports.EmployeeField = EmployeeField;
	exports.EntitiesWithAvatarsField = EntitiesWithAvatarsField;
	exports.GridManager = GridManager;
	exports.LastSyncField = LastSyncField;
	exports.MailboxNameField = MailboxNameField;
	exports.MonthlySentCountField = MonthlySentCountField;
	exports.SenderNameField = SenderNameField;

})(this.BX.Mail.MailboxList = this.BX.Mail.MailboxList || {}, BX, BX.UI, BX.UI, BX.Main, BX, BX.UI.System.Chip, BX.Main, BX, BX, BX.UI, BX.UI.Analytics);
//# sourceMappingURL=grid.bundle.js.map
