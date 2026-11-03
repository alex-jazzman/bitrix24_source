/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
(function (exports, main_core, ui_avatar, ui_cnt, main_date, mail_migrationState, ui_system_chip, ui_notification, ui_dialogs_messagebox, main_popup, ui_icons_b24, ui_icon, ui_analytics, ui_buttons) {
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
			const emailContent = main_core.Tag.render`
			<div class="mailbox-grid_email-content">
				<span class="mailbox-grid_email-text">${main_core.Text.encode(params.email)}</span>
				${counterNode}
			</div>
		`;
			const emailContainer = main_core.Tag.render`
			<div class="mailbox-grid_email-container">
				${iconNode}
				${emailContent}
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
				case 'mailhost':
					return 'mailhost';
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

	function showActionReport(data, phrases) {
		const applied = data.applied ?? [];
		const skipped = data.skipped ?? [];
		const failed = data.failed ?? [];
		if (skipped.length === 0 && failed.length === 0) {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage(phrases.success),
				position: 'top-right',
				autoHideDelay: 5000
			});
			return;
		}
		const lines = [];
		if (applied.length > 0) {
			lines.push(main_core.Loc.getMessagePlural(phrases.applied, applied.length, {
				'#COUNT#': applied.length
			}));
		}
		if (skipped.length > 0 && phrases.skipped) {
			lines.push(main_core.Loc.getMessagePlural(phrases.skipped, skipped.length, {
				'#COUNT#': skipped.length
			}));
		}
		if (failed.length > 0) {
			lines.push(main_core.Loc.getMessagePlural(phrases.failed, failed.length, {
				'#COUNT#': failed.length
			}));
		}
		const container = document.createElement('span');
		container.dataset.testid = 'mail-mailbox-bulk-report';
		container.innerHTML = lines.join('<br>');
		BX.UI.Notification.Center.notify({
			content: container,
			position: 'top-right',
			autoHideDelay: 5000
		});
	}

	class MassDisconnectAction extends BaseAction {
		#mailboxIds = [];
		#executing = false;
		static getActionId() {
			return 'disconnectMailbox';
		}
		getActionConfig() {
			return {
				type: 'controller',
				name: 'mail.mailboxconnecting.massDisconnectMailboxes'
			};
		}
		getActionData() {
			return {
				mailboxIds: this.#mailboxIds
			};
		}
		setActionParams(params) {
			if (!this.#executing) {
				this.#mailboxIds = [...(params.mailboxIds ?? [])];
			}
		}
		async execute() {
			if (this.#executing || this.#mailboxIds.length === 0) {
				return;
			}
			this.#executing = true;
			const unsubscribers = [];
			try {
				const states = this.#mailboxIds.map(mailboxId => {
					const state = mail_migrationState.getMigrationState(mailboxId);
					return {
						state,
						active: state.isActive()
					};
				});
				const confirmed = await this.#confirm(states, unsubscribers);
				if (!confirmed || states.some(({
					state,
					active
				}) => !state.isInitialized() || active || state.isActive())) {
					return;
				}
				this.onBeforeActionRequest();
				await this.sendActionRequest();
			} finally {
				unsubscribers.forEach(unsubscribe => unsubscribe());
				this.#executing = false;
			}
		}
		#confirm(states, unsubscribers) {
			const count = this.#mailboxIds.length;
			const confirmationMessage = main_core.Loc.getMessagePlural('MAIL_MAILBOX_PANEL_DISCONNECT_CONFIRM_TEXT', count, {
				'#COUNT#': count
			});
			return new Promise(resolve => {
				let closed = false;
				const finish = confirmed => {
					if (!closed) {
						closed = true;
						resolve(confirmed);
					}
				};
				const isAvailable = () => states.every(({
					state,
					active
				}) => state.isInitialized() && !active);
				const messageBox = ui_dialogs_messagebox.MessageBox.create({
					message: confirmationMessage,
					title: main_core.Loc.getMessage('MAIL_MAILBOX_PANEL_DISCONNECT_CONFIRM_TITLE'),
					okCaption: main_core.Loc.getMessage('MAIL_MAILBOX_PANEL_DISCONNECT_CONFIRM_OK'),
					cancelCaption: main_core.Loc.getMessage('MAIL_MAILBOX_PANEL_DISCONNECT_CONFIRM_CANCEL'),
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
					popupOptions: {
						closeByEsc: true,
						events: {
							onClose: () => finish(false),
							onDestroy: () => finish(false)
						}
					},
					onOk: () => {
						if (closed || !isAvailable() || states.some(({
							state
						}) => state.isActive())) {
							return;
						}
						finish(true);
						messageBox.close();
					},
					onCancel: () => {
						finish(false);
						messageBox.close();
					}
				});
				const updateAvailability = () => {
					if (closed) {
						return;
					}
					messageBox.getOkButton().setDisabled(!isAvailable());
					messageBox.setMessage(states.some(({
						active
					}) => active) ? main_core.Loc.getMessage('MAIL_MIGRATION_ACTION_UNAVAILABLE') : confirmationMessage);
				};
				states.forEach(entry => {
					unsubscribers.push(entry.state.subscribe(change => {
						Object.assign(entry, {
							active: change.active
						});
						updateAvailability();
					}));
					void entry.state.initialize().then(updateAvailability);
				});
				updateAvailability();
				messageBox.show();
				const popup = messageBox.getPopupWindow();
				if (popup) {
					const container = popup.getPopupContainer();
					if (container) {
						container.dataset.testid = 'mail-mailbox-bulk-confirm-dialog';
					}
				}
			});
		}
		onBeforeActionRequest() {
			this.grid.tableFade();
		}
		handleSuccess(result) {
			this.grid.reload(() => {
				this.grid.tableUnfade();
			});
			showActionReport(result?.data ?? {}, {
				success: 'MAIL_MAILBOX_PANEL_DISCONNECT_SUCCESS',
				applied: 'MAIL_MAILBOX_PANEL_DISCONNECT_REPORT_APPLIED',
				skipped: 'MAIL_MAILBOX_PANEL_ACTION_REPORT_SKIPPED',
				failed: 'MAIL_MAILBOX_PANEL_ACTION_REPORT_FAILED'
			});
		}
		handleError(result) {
			const errors = result?.errors ?? [];
			const message = errors[0]?.message ?? main_core.Loc.getMessage('MAIL_MAILBOX_PANEL_ACTION_ERROR');
			this.grid.tableUnfade();
			BX.UI.Notification.Center.notify({
				content: message,
				position: 'top-right',
				autoHideDelay: 5000
			});
		}
	}

	class MassCrmEnableAction extends BaseAction {
		#mailboxIds = [];
		static getActionId() {
			return 'enableCrm';
		}
		getActionConfig() {
			return {
				type: 'controller',
				name: 'mail.mailboxconnecting.massSetCrmIntegration'
			};
		}
		getActionData() {
			return {
				mailboxIds: this.#mailboxIds,
				enabled: 'Y'
			};
		}
		setActionParams(params) {
			this.#mailboxIds = params.mailboxIds ?? [];
		}
		onBeforeActionRequest() {
			this.grid.tableFade();
		}
		handleSuccess(result) {
			this.grid.reload(() => {
				this.grid.tableUnfade();
			});
			showActionReport(result?.data ?? {}, {
				success: 'MAIL_MAILBOX_PANEL_CRM_ENABLE_SUCCESS',
				applied: 'MAIL_MAILBOX_PANEL_CRM_ENABLE_REPORT_APPLIED',
				skipped: 'MAIL_MAILBOX_PANEL_ACTION_REPORT_SKIPPED',
				failed: 'MAIL_MAILBOX_PANEL_ACTION_REPORT_FAILED'
			});
		}
		handleError(result) {
			const errors = result?.errors ?? [];
			const message = errors[0]?.message ?? main_core.Loc.getMessage('MAIL_MAILBOX_PANEL_ACTION_ERROR');
			this.grid.tableUnfade();
			BX.UI.Notification.Center.notify({
				content: message,
				position: 'top-right',
				autoHideDelay: 5000
			});
		}
	}
	class MassCrmDisableAction extends BaseAction {
		#mailboxIds = [];
		static getActionId() {
			return 'disableCrm';
		}
		getActionConfig() {
			return {
				type: 'controller',
				name: 'mail.mailboxconnecting.massSetCrmIntegration'
			};
		}
		getActionData() {
			return {
				mailboxIds: this.#mailboxIds,
				enabled: 'N'
			};
		}
		setActionParams(params) {
			this.#mailboxIds = params.mailboxIds ?? [];
		}
		onBeforeActionRequest() {
			this.grid.tableFade();
		}
		handleSuccess(result) {
			this.grid.reload(() => {
				this.grid.tableUnfade();
			});
			showActionReport(result?.data ?? {}, {
				success: 'MAIL_MAILBOX_PANEL_CRM_DISABLE_SUCCESS',
				applied: 'MAIL_MAILBOX_PANEL_CRM_DISABLE_REPORT_APPLIED',
				skipped: 'MAIL_MAILBOX_PANEL_ACTION_REPORT_SKIPPED',
				failed: 'MAIL_MAILBOX_PANEL_ACTION_REPORT_FAILED'
			});
		}
		handleError(result) {
			const errors = result?.errors ?? [];
			const message = errors[0]?.message ?? main_core.Loc.getMessage('MAIL_MAILBOX_PANEL_ACTION_ERROR');
			this.grid.tableUnfade();
			BX.UI.Notification.Center.notify({
				content: message,
				position: 'top-right',
				autoHideDelay: 5000
			});
		}
	}

	class MassCalendarEnableAction extends BaseAction {
		#mailboxIds = [];
		static getActionId() {
			return 'enableCalendar';
		}
		getActionConfig() {
			return {
				type: 'controller',
				name: 'mail.mailboxconnecting.massSetCalendarIntegration'
			};
		}
		getActionData() {
			return {
				mailboxIds: this.#mailboxIds,
				enabled: 'Y'
			};
		}
		setActionParams(params) {
			this.#mailboxIds = params.mailboxIds ?? [];
		}
		onBeforeActionRequest() {
			this.grid.tableFade();
		}
		handleSuccess(result) {
			this.grid.reload(() => {
				this.grid.tableUnfade();
			});
			showActionReport(result?.data ?? {}, {
				success: 'MAIL_MAILBOX_PANEL_CALENDAR_ENABLE_SUCCESS',
				applied: 'MAIL_MAILBOX_PANEL_CALENDAR_ENABLE_REPORT_APPLIED',
				skipped: 'MAIL_MAILBOX_PANEL_ACTION_REPORT_SKIPPED',
				failed: 'MAIL_MAILBOX_PANEL_ACTION_REPORT_FAILED'
			});
		}
		handleError(result) {
			const errors = result?.errors ?? [];
			const message = errors[0]?.message ?? main_core.Loc.getMessage('MAIL_MAILBOX_PANEL_ACTION_ERROR');
			this.grid.tableUnfade();
			BX.UI.Notification.Center.notify({
				content: message,
				position: 'top-right',
				autoHideDelay: 5000
			});
		}
	}
	class MassCalendarDisableAction extends BaseAction {
		#mailboxIds = [];
		static getActionId() {
			return 'disableCalendar';
		}
		getActionConfig() {
			return {
				type: 'controller',
				name: 'mail.mailboxconnecting.massSetCalendarIntegration'
			};
		}
		getActionData() {
			return {
				mailboxIds: this.#mailboxIds,
				enabled: 'N'
			};
		}
		setActionParams(params) {
			this.#mailboxIds = params.mailboxIds ?? [];
		}
		onBeforeActionRequest() {
			this.grid.tableFade();
		}
		handleSuccess(result) {
			this.grid.reload(() => {
				this.grid.tableUnfade();
			});
			showActionReport(result?.data ?? {}, {
				success: 'MAIL_MAILBOX_PANEL_CALENDAR_DISABLE_SUCCESS',
				applied: 'MAIL_MAILBOX_PANEL_CALENDAR_DISABLE_REPORT_APPLIED',
				skipped: 'MAIL_MAILBOX_PANEL_ACTION_REPORT_SKIPPED',
				failed: 'MAIL_MAILBOX_PANEL_ACTION_REPORT_FAILED'
			});
		}
		handleError(result) {
			const errors = result?.errors ?? [];
			const message = errors[0]?.message ?? main_core.Loc.getMessage('MAIL_MAILBOX_PANEL_ACTION_ERROR');
			this.grid.tableUnfade();
			BX.UI.Notification.Center.notify({
				content: message,
				position: 'top-right',
				autoHideDelay: 5000
			});
		}
	}

	class MassCrmConfigureAction extends BaseAction {
		#mailboxIds = [];
		#onSliderMessage = null;
		#onSliderCloseComplete = null;
		static getActionId() {
			return 'configureCrm';
		}
		setActionParams(params) {
			this.#mailboxIds = params.mailboxIds ?? [];
		}
		#getTopBX() {
			return (window.top ?? window).BX ?? BX;
		}
		async execute() {
			if (!this.#mailboxIds || this.#mailboxIds.length === 0) {
				return;
			}
			const idsParam = this.#mailboxIds.join(',');
			const url = `/mail/config/crm-mass?ids=${encodeURIComponent(idsParam)}`;
			this.#subscribeToSliderMessage();
			BX.SidePanel.Instance.open(url, {
				width: 600,
				cacheable: false,
				allowChangeHistory: false
			});
		}
		#subscribeToSliderMessage() {
			this.#unsubscribeFromSliderMessage();
			const topBX = this.#getTopBX();
			const messageHandler = event => {
				if (!event || typeof event.getEventId !== 'function') {
					return;
				}
				if (event.getEventId() !== 'mail-mass-crm-config-apply') {
					return;
				}
				const data = event.data ?? null;
				const mailboxIds = data && Array.isArray(data.mailboxIds) ? data.mailboxIds : this.#mailboxIds;
				const crmOptions = data && data.crmOptions ? data.crmOptions : null;
				this.#unsubscribeFromSliderMessage();
				this.#sendCrmRequest(mailboxIds, crmOptions);
			};
			const closeCompleteHandler = event => {
				const slider = event?.getSlider?.();
				if (slider && slider.getUrl && slider.getUrl().includes('/mail/config/crm-mass')) {
					this.#unsubscribeFromSliderMessage();
				}
			};
			this.#onSliderMessage = messageHandler;
			this.#onSliderCloseComplete = closeCompleteHandler;
			topBX.addCustomEvent('SidePanel.Slider:onMessage', messageHandler);
			topBX.addCustomEvent('SidePanel.Slider:onCloseComplete', closeCompleteHandler);
		}
		#unsubscribeFromSliderMessage() {
			const topBX = this.#getTopBX();
			if (this.#onSliderMessage) {
				topBX.removeCustomEvent('SidePanel.Slider:onMessage', this.#onSliderMessage);
				this.#onSliderMessage = null;
			}
			if (this.#onSliderCloseComplete) {
				topBX.removeCustomEvent('SidePanel.Slider:onCloseComplete', this.#onSliderCloseComplete);
				this.#onSliderCloseComplete = null;
			}
		}
		#sendCrmRequest(mailboxIds, crmOptions) {
			this.grid.tableFade();
			BX.ajax.runAction('mail.mailboxconnecting.massSetCrmIntegration', {
				data: {
					mailboxIds,
					enabled: 'Y',
					crmOptions
				}
			}).then(result => {
				this.handleSuccess(result);
			}).catch(result => {
				this.handleError(result);
			});
		}
		handleSuccess(result) {
			this.grid.reload(() => {
				this.grid.tableUnfade();
			});
			showActionReport(result?.data ?? {}, {
				success: 'MAIL_MAILBOX_PANEL_CRM_CONFIGURE_SUCCESS',
				applied: 'MAIL_MAILBOX_PANEL_CRM_CONFIGURE_REPORT_APPLIED',
				skipped: 'MAIL_MAILBOX_PANEL_ACTION_REPORT_SKIPPED',
				failed: 'MAIL_MAILBOX_PANEL_ACTION_REPORT_FAILED'
			});
		}
		handleError(result) {
			const errors = result?.errors ?? [];
			const message = errors[0]?.message ?? main_core.Loc.getMessage('MAIL_MAILBOX_PANEL_ACTION_ERROR');
			this.grid.tableUnfade();
			BX.UI.Notification.Center.notify({
				content: message,
				position: 'top-right',
				autoHideDelay: 5000
			});
		}
	}

	const actionMap = new Map([[SyncAction.getActionId(), SyncAction], [OpenSettingsAction.getActionId(), OpenSettingsAction], [RejectMailboxConnectionRequestAction.getActionId(), RejectMailboxConnectionRequestAction], [ConnectMailboxConnectionRequestAction.getActionId(), ConnectMailboxConnectionRequestAction], [MassDisconnectAction.getActionId(), MassDisconnectAction], [MassCrmEnableAction.getActionId(), MassCrmEnableAction], [MassCrmDisableAction.getActionId(), MassCrmDisableAction], [MassCalendarEnableAction.getActionId(), MassCalendarEnableAction], [MassCalendarDisableAction.getActionId(), MassCalendarDisableAction], [MassCrmConfigureAction.getActionId(), MassCrmConfigureAction]]);
	class ActionFactory {
		static create(actionId, options) {
			const ActionClass = actionMap.get(actionId);
			if (ActionClass) {
				return new ActionClass(options);
			}
			return null;
		}
	}

	const ExtensionName = 'mail.grid.migration-progress-panel';
	const AnchorSelector = '[data-role="mailbox-migration-progress-anchor"]';
	const HoverDelay = 200;
	const defaultExtensionLoader = () => main_core.Runtime.loadExtension(ExtensionName);
	class MigrationProgressPanelLoader {
		static #instances = new Map();
		#gridId;
		#grid;
		#panel = null;
		#extensionLoader;
		#extensionPromise = null;
		#pendingAnchor = null;
		#pendingInteractive = false;
		#hoverTimer = null;
		#epoch = 0;
		#destroyed = false;
		#listeners = [];
		constructor(gridId, extensionLoader = defaultExtensionLoader) {
			this.#gridId = gridId;
			this.#extensionLoader = extensionLoader;
			this.#grid = document.getElementById(gridId);
			if (this.#grid) {
				const grid = this.#grid;
				['mouseover', 'mouseout', 'focusin', 'focusout', 'click', 'keydown'].forEach(name => {
					const listener = event => this.#handleTrigger(event);
					main_core.Event.bind(grid, name, listener);
					this.#listeners.push(() => main_core.Event.unbind(grid, name, listener));
				});
			}
		}
		static getInstance(gridId) {
			if (!this.#instances.has(gridId)) {
				this.#instances.set(gridId, new MigrationProgressPanelLoader(gridId));
			}
			return this.#instances.get(gridId);
		}
		static destroyInstance(gridId) {
			this.#instances.get(gridId)?.destroy();
		}
		bindAnchor(anchor, mailboxId) {
			main_core.Dom.attr(anchor, {
				'data-role': 'mailbox-migration-progress-anchor',
				'data-mailbox-id': String(mailboxId),
				'data-testid': 'mail-migration-progress-chip',
				role: 'button',
				tabindex: '0',
				'aria-expanded': 'false',
				'aria-controls': `mail-migration-progress-content-${this.#gridId}`
			});
		}
		unbindAnchor(anchor) {
			this.#cancelPendingOpen(anchor);
			this.#panel?.unbindAnchor(anchor);
			['data-role', 'data-mailbox-id', 'data-testid', 'role', 'tabindex', 'aria-expanded', 'aria-controls'].forEach(name => anchor.removeAttribute(name));
		}
		destroy() {
			this.#destroyed = true;
			this.#epoch++;
			this.#clearHoverTimer();
			this.#pendingAnchor = null;
			this.#listeners.splice(0).forEach(unsubscribe => unsubscribe());
			this.#panel?.destroy();
			this.#panel = null;
			this.#grid = null;
			MigrationProgressPanelLoader.#instances.delete(this.#gridId);
		}
		#handleTrigger(event) {
			const target = event.target instanceof Element ? event.target : null;
			const anchor = target?.closest(AnchorSelector);
			if (!anchor) {
				return;
			}
			switch (event.type) {
				case 'mouseover':
					if (!anchor.contains(event.relatedTarget)) {
						this.#clearHoverTimer();
						this.#hoverTimer = setTimeout(() => {
							this.#hoverTimer = null;
							this.#requestOpen(anchor, false);
						}, HoverDelay);
					}
					break;
				case 'mouseout':
					if (!anchor.contains(event.relatedTarget) && !anchor.contains(document.activeElement)) {
						this.#cancelPendingOpen(anchor);
					}
					break;
				case 'focusout':
					if (!anchor.contains(event.relatedTarget)) {
						this.#cancelPendingOpen(anchor);
					}
					break;
				case 'click':
				case 'focusin':
					this.#requestOpen(anchor, true);
					break;
				case 'keydown':
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						this.#requestOpen(anchor, true);
					}
					break;
			}
		}
		#requestOpen(anchor, interactive) {
			this.#clearHoverTimer();
			if (this.#destroyed || !anchor.isConnected) {
				return;
			}
			if (this.#pendingAnchor !== anchor) {
				this.#pendingInteractive = interactive;
			} else {
				this.#pendingInteractive ||= interactive;
			}
			this.#pendingAnchor = anchor;
			const epoch = ++this.#epoch;
			this.#extensionPromise ??= this.#extensionLoader();
			const loading = this.#extensionPromise;
			void loading.then(extension => {
				if (this.#destroyed) {
					return;
				}
				if (epoch !== this.#epoch || this.#pendingAnchor !== anchor || !anchor.isConnected) {
					return;
				}
				this.#panel ??= extension.MigrationProgressPanel.getInstance(this.#gridId);
				this.#clearHoverTimer();
				this.#listeners.splice(0).forEach(unsubscribe => unsubscribe());
				this.#panel.bindAnchor(anchor, Number(anchor.dataset.mailboxId));
				this.#panel.open(anchor, this.#pendingInteractive);
				this.#pendingAnchor = null;
				this.#pendingInteractive = false;
			}).catch(() => {
				if (this.#extensionPromise === loading) {
					this.#extensionPromise = null;
				}
				if (epoch === this.#epoch) {
					this.#pendingAnchor = null;
					this.#pendingInteractive = false;
				}
			});
		}
		#cancelPendingOpen(anchor) {
			this.#clearHoverTimer();
			if (this.#pendingAnchor === anchor) {
				this.#epoch++;
				this.#pendingAnchor = null;
				this.#pendingInteractive = false;
			}
		}
		#clearHoverTimer() {
			if (this.#hoverTimer !== null) {
				clearTimeout(this.#hoverTimer);
				this.#hoverTimer = null;
			}
		}
	}

	const createdActionPanels = new Map();
	const migrationRestrictedActions = new Set(['disconnectMailbox']);
	const migrationStatusMessages = {
		waiting: 'MAIL_MIGRATION_PROGRESS_STATUS_WAITING',
		manual_waiting: 'MAIL_MIGRATION_PROGRESS_STATUS_MANUAL_WAITING',
		blocked: 'MAIL_MIGRATION_PROGRESS_STATUS_BLOCKED',
		cancelling: 'MAIL_MIGRATION_PROGRESS_STATUS_CANCELLING',
		switching: 'MAIL_MIGRATION_PROGRESS_STATUS_SWITCHING'
	};
	function isMigrationRestrictedAction(actionId) {
		return migrationRestrictedActions.has(actionId);
	}
	BX.addCustomEvent('BX.UI.ActionPanel:created', panel => {
		const gridId = panel?.params?.gridId;
		if (gridId) {
			createdActionPanels.set(gridId, panel);
		}
	});
	class GridManager {
		static instances = [];
		#gridId;
		#migrationStateFactory;
		#migrationStateSubscriptions = new Map();
		#actionPanel = null;
		#panelObserver = null;
		#migrationDisconnectState = new WeakMap();
		#handleSelectedRows;
		#handleGridUpdated;
		#handleActionPanelCreated;
		#handlePageHide;
		constructor(gridId, migrationStateFactory = mail_migrationState.getMigrationState) {
			this.#gridId = gridId;
			this.#migrationStateFactory = migrationStateFactory;
			this.#handleSelectedRows = () => this.#syncMigrationRestrictions();
			this.#handleGridUpdated = grid => {
				if (grid && grid !== this.getGrid()) {
					return;
				}
				this.#syncMigrationStateSubscriptions();
				this.#syncMigrationRestrictions();
			};
			this.#handleActionPanelCreated = panel => {
				if (panel?.params?.gridId === this.#gridId) {
					this.#setupActionPanel(panel);
				}
			};
			this.#handlePageHide = () => this.destroy();
			BX.addCustomEvent('Grid::thereSelectedRows', this.#handleSelectedRows);
			BX.addCustomEvent('Grid::allRowsSelected', this.#handleSelectedRows);
			BX.addCustomEvent('Grid::allRowsUnselected', this.#handleSelectedRows);
			BX.addCustomEvent('Grid::updated', this.#handleGridUpdated);
			BX.addCustomEvent('BX.UI.ActionPanel:created', this.#handleActionPanelCreated);
			main_core.Event.bind(window, 'pagehide', this.#handlePageHide, {
				once: true
			});
			this.#syncMigrationStateSubscriptions();
			const existingPanel = createdActionPanels.get(gridId);
			if (existingPanel) {
				this.#setupActionPanel(existingPanel);
			}
		}
		destroy() {
			MigrationProgressPanelLoader.destroyInstance(this.#gridId);
			this.#migrationStateSubscriptions.forEach(({
				unsubscribe
			}) => unsubscribe());
			this.#migrationStateSubscriptions.clear();
			this.#panelObserver?.disconnect();
			this.#panelObserver = null;
			if (createdActionPanels.get(this.#gridId) === this.#actionPanel) {
				createdActionPanels.delete(this.#gridId);
			}
			this.#actionPanel = null;
			BX.removeCustomEvent('Grid::thereSelectedRows', this.#handleSelectedRows);
			BX.removeCustomEvent('Grid::allRowsSelected', this.#handleSelectedRows);
			BX.removeCustomEvent('Grid::allRowsUnselected', this.#handleSelectedRows);
			BX.removeCustomEvent('Grid::updated', this.#handleGridUpdated);
			BX.removeCustomEvent('BX.UI.ActionPanel:created', this.#handleActionPanelCreated);
			main_core.Event.unbind(window, 'pagehide', this.#handlePageHide);
			delete GridManager.instances[this.#gridId];
		}
		#syncMigrationStateSubscriptions() {
			const mailboxIds = new Set((this.getGrid()?.getRows().getBodyChild() ?? []).map(row => Number(row.getId())).filter(mailboxId => Number.isInteger(mailboxId) && mailboxId > 0));
			this.#migrationStateSubscriptions.forEach(({
				unsubscribe
			}, mailboxId) => {
				if (!mailboxIds.has(mailboxId)) {
					unsubscribe();
					this.#migrationStateSubscriptions.delete(mailboxId);
				}
			});
			mailboxIds.forEach(mailboxId => {
				const subscription = this.#migrationStateSubscriptions.get(mailboxId);
				if (subscription) {
					if (subscription.state.isInitialized()) {
						this.#applyMailboxMigrationState(mailboxId, subscription.state.isActive(), subscription.state.getStatus());
					}
					return;
				}
				const state = this.#migrationStateFactory(mailboxId);
				const unsubscribe = state.subscribe(({
					active,
					status
				}) => {
					if (this.#migrationStateSubscriptions.get(mailboxId)?.state === state) {
						this.#applyMailboxMigrationState(mailboxId, active, status);
					}
				});
				this.#migrationStateSubscriptions.set(mailboxId, {
					state,
					unsubscribe
				});
				void state.initialize().then(() => {
					if (this.#migrationStateSubscriptions.get(mailboxId)?.state === state && state.isInitialized()) {
						this.#applyMailboxMigrationState(mailboxId, state.isActive(), state.getStatus());
					}
				});
			});
		}
		#applyMailboxMigrationState(mailboxId, active, status) {
			const rowNode = this.getGrid()?.getRows().getById(mailboxId)?.getNode?.();
			if (rowNode) {
				rowNode.dataset.mailboxMigrationActive = active ? 'Y' : 'N';
				const migrationStatus = rowNode.querySelector('[data-role="mailbox-grid-migration-status"]');
				const regularStatus = rowNode.querySelector('[data-role="mailbox-grid-regular-sync-status"]');
				if (migrationStatus && regularStatus) {
					const showMigration = this.#updateMigrationStatus(migrationStatus, mailboxId, active, status);
					migrationStatus.hidden = !showMigration;
					regularStatus.hidden = showMigration;
				}
			}
			this.#syncMigrationRestrictions();
		}
		#updateMigrationStatus(migrationStatus, mailboxId, active, status) {
			if (status.visibility === 'terminal') {
				migrationStatus.dataset.mailboxAdminProgress = 'N';
			}
			const hasAdminProgress = migrationStatus.dataset.mailboxAdminProgress === 'Y';
			const canOpenAdminProgress = migrationStatus.dataset.mailboxAdminProgressAllowed === 'Y';
			const canShowHiddenAdminProgress = migrationStatus.dataset.mailboxAdminProgressEarlyVisible === 'Y';
			const chip = migrationStatus.querySelector('.ui-chip');
			if (chip && active) {
				const messageKey = Object.hasOwn(migrationStatusMessages, status.status) ? migrationStatusMessages[status.status] : 'MAIL_MIGRATION_STATUS';
				ui_system_chip.Chip.getByNode(chip)?.setText(main_core.Loc.getMessage(messageKey) ?? '');
				if (canOpenAdminProgress) {
					MigrationProgressPanelLoader.getInstance(this.#gridId).bindAnchor(chip, mailboxId);
				} else {
					MigrationProgressPanelLoader.getInstance(this.#gridId).unbindAnchor(chip);
				}
			} else if (chip && status.visibility === 'hidden') {
				if (hasAdminProgress && canShowHiddenAdminProgress && canOpenAdminProgress) {
					ui_system_chip.Chip.getByNode(chip)?.setText(migrationStatus.dataset.mailboxAdminProgressText ?? '');
					MigrationProgressPanelLoader.getInstance(this.#gridId).bindAnchor(chip, mailboxId);
				} else {
					migrationStatus.dataset.mailboxAdminProgress = 'N';
					MigrationProgressPanelLoader.getInstance(this.#gridId).unbindAnchor(chip);
				}
			}
			const hasOpenProgress = migrationStatus.querySelector('[aria-expanded="true"]') !== null;
			return active || hasAdminProgress && canShowHiddenAdminProgress || hasOpenProgress;
		}
		#setupActionPanel(panel) {
			if (this.#actionPanel === panel) {
				return;
			}
			this.#panelObserver?.disconnect();
			this.#actionPanel = panel;

			// On single-row selection ActionPanel rebuilds from that row's actions,
			// which are UPPERCASE (not understood by ActionPanel.Item) and carry no
			// mass actions; this grid must always show the group (mass) actions.
			panel.buildPanelByItem = () => panel.buildPanelByGroup();

			// A click outside the panel and grid must not reset the selection,
			// same as the message list panel.
			panel.handleOuterClick = () => {};
			const container = panel.getPanelContainer();
			container.dataset.testid = 'mail-mailbox-grid-bulk-panel';
			this.#panelObserver = new MutationObserver(() => {
				this.#applyPanelTestIds();
				this.#syncMigrationRestrictions();
			});
			this.#panelObserver.observe(container, {
				childList: true,
				subtree: true
			});
			this.#applyPanelTestIds();
			this.#syncMigrationRestrictions();
		}
		#syncMigrationRestrictions() {
			const item = this.#actionPanel?.getItemById?.('disconnectMailbox');
			if (!item) {
				return;
			}
			if (this.#hasSelectedActiveMigration()) {
				if (!this.#migrationDisconnectState.has(item)) {
					this.#migrationDisconnectState.set(item, {
						disabled: item.isDisabled(),
						title: item.layout?.container?.getAttribute('title') ?? null
					});
				}
				item.disable();
				item.layout?.container?.setAttribute('title', main_core.Loc.getMessage('MAIL_MIGRATION_ACTION_UNAVAILABLE') ?? '');
				return;
			}
			const previousState = this.#migrationDisconnectState.get(item);
			if (previousState) {
				if (previousState.disabled) {
					item.disable();
				} else {
					item.enable();
				}
				this.#migrationDisconnectState.delete(item);
				if (previousState.title === null) {
					item.layout?.container?.removeAttribute('title');
				} else {
					item.layout?.container?.setAttribute('title', previousState.title);
				}
			}
		}
		#hasSelectedActiveMigration() {
			const grid = this.getGrid();
			const selectedIds = grid?.getRows().getSelectedIds() ?? [];
			return selectedIds.some(id => this.#isMailboxMigrationActive(id));
		}
		#isMailboxMigrationActive(mailboxId) {
			const row = this.getGrid()?.getRows().getById(mailboxId);
			return row?.getNode?.()?.dataset?.mailboxMigrationActive === 'Y';
		}
		#applyPanelTestIds() {
			if (!this.#actionPanel) {
				return;
			}
			const items = this.#actionPanel.getPanelContainer().querySelectorAll('[data-role="action-panel-item"]');
			items.forEach(item => {
				if (item.id) {
					item.dataset.testid = `mail-mailbox-grid-bulk-action-${item.id}`;
				}
			});
		}
		static getInstance(gridId) {
			if (!this.instances[gridId]) {
				this.instances[gridId] = new GridManager(gridId);
			}
			return this.instances[gridId];
		}
		static executePanelAction(params) {
			const {
				actionId,
				gridId
			} = params;
			const manager = GridManager.getInstance(gridId);
			const grid = manager.getGrid();
			if (!grid) {
				return;
			}
			const selectedIds = grid.getRows().getSelectedIds();
			if (!selectedIds || selectedIds.length === 0) {
				return;
			}
			const mailboxIds = selectedIds.map(Number);
			if (isMigrationRestrictedAction(actionId) && mailboxIds.some(mailboxId => manager.#isMailboxMigrationActive(mailboxId))) {
				return;
			}
			const action = ActionFactory.create(actionId, {
				grid
			});
			if (action) {
				action.setActionParams({
					mailboxIds
				});
				action.execute();
			}
		}
		getGrid() {
			return BX.Main.gridManager.getById(this.#gridId)?.instance;
		}
		runAction(config) {
			const actionId = config.actionId;
			if (actionId === 'syncAction' && this.#isMailboxMigrationActive(config.params.mailboxId)) {
				return;
			}
			const options = config.options;
			options.grid = this.getGrid();
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
			const migrationStatusContainer = main_core.Tag.render`
			<div class="mailbox-grid_last-sync-status-container" data-role="mailbox-grid-migration-status"></div>
		`;
			const regularStatusContainer = main_core.Tag.render`
			<div class="mailbox-grid_last-sync-status-container" data-role="mailbox-grid-regular-sync-status"></div>
		`;
			const hasAdminProgress = params.migrationAdminProgressAvailable === true;
			main_core.Dom.attr(migrationStatusContainer, 'data-mailbox-admin-progress', hasAdminProgress ? 'Y' : 'N');
			main_core.Dom.attr(migrationStatusContainer, 'data-mailbox-admin-progress-allowed', params.migrationAdminProgressAllowed === true ? 'Y' : 'N');
			main_core.Dom.attr(migrationStatusContainer, 'data-mailbox-admin-progress-early-visible', params.migrationAdminProgressEarlyVisible === true ? 'Y' : 'N');
			const migrationStatus = this.#getMigrationStatus(params);
			if (hasAdminProgress) {
				main_core.Dom.attr(migrationStatusContainer, 'data-mailbox-admin-progress-text', migrationStatus.textContent ?? '');
			}
			main_core.Dom.append(migrationStatus, migrationStatusContainer);
			if (params.hasError) {
				main_core.Dom.append(this.#getErrorMessage(), regularStatusContainer);
			} else {
				if (params.lastSync) {
					main_core.Dom.append(this.#getLastSyncContainer(params.lastSync), regularStatusContainer);
				} else {
					main_core.Dom.append(this.#getLastSyncRightNowContainer(), regularStatusContainer);
				}
				if (params.mailboxId && params.canEdit) {
					main_core.Dom.append(this.#getLastSyncButton(params.mailboxId), regularStatusContainer);
				}
			}
			migrationStatusContainer.hidden = params.migrationActive !== true && !hasAdminProgress;
			regularStatusContainer.hidden = params.migrationActive === true || hasAdminProgress;
			main_core.Dom.append(migrationStatusContainer, lastSyncContainer);
			main_core.Dom.append(regularStatusContainer, lastSyncContainer);
			this.appendToFieldNode(lastSyncContainer);
		}
		#getMigrationStatus(params) {
			const adminStatusKeys = {
				waiting: 'MAIL_MIGRATION_PROGRESS_STATUS_WAITING',
				manual_waiting: 'MAIL_MIGRATION_PROGRESS_STATUS_MANUAL_WAITING',
				blocked: 'MAIL_MIGRATION_PROGRESS_STATUS_BLOCKED',
				cancelling: 'MAIL_MIGRATION_PROGRESS_STATUS_CANCELLING',
				switching: 'MAIL_MIGRATION_PROGRESS_STATUS_SWITCHING'
			};
			const status = params.migrationAdminProgressAvailable === true ? params.migrationAdminStatus : params.migrationStatus;
			const key = (params.migrationAdminProgressAvailable === true || params.migrationActive === true) && Object.hasOwn(adminStatusKeys, status) ? adminStatusKeys[status] : 'MAIL_MIGRATION_STATUS';
			const chip = new ui_system_chip.Chip({
				size: ui_system_chip.ChipSize.Sm,
				rounded: true,
				text: main_core.Text.encode(main_core.Loc.getMessage(key) ?? ''),
				design: ui_system_chip.ChipDesign.OutlineWarning
			}).render();
			if (params.migrationAdminProgressAllowed === true && (params.migrationAdminProgressAvailable === true || params.migrationActive === true) && params.mailboxId && this.getGridId()) {
				MigrationProgressPanelLoader.getInstance(this.getGridId()).bindAnchor(chip, Number(params.mailboxId));
			}
			return chip;
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
				<div class="mailbox-grid_last-sync-button ui-icon-set --o-refresh" data-testid="mailbox-grid_refresh-button"></div>
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
				button.setRightCounter({
					value: 1
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

})(this.BX.Mail.MailboxList = this.BX.Mail.MailboxList || {}, BX, BX.UI, BX.UI, BX.Main, BX.Mail, BX.UI.System.Chip, BX.UI.Notification, BX.UI.Dialogs, BX.Main, BX, BX, BX.UI.Analytics, BX.UI);
//# sourceMappingURL=grid.bundle.js.map
