/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Ai = this.BX.Bizproc.Ai || {};
(function (exports, main_core, main_core_events, ui_a11y, ui_dialogs_messagebox, ui_infoHelper, bizproc_setupTemplate, ui_notification, ui_system_typography, main_popup, main_sidepanel, ui_entitySelector, im_public, humanresources_companyStructure_public, ui_avatar, main_date, ui_buttons) {
	'use strict';

	const AJAX_REQUEST_TYPE = {
		COMPONENT: 'component',
		CONTROLLER: 'controller'
	};
	const ACTION_TYPE = {
		DELETE: 'delete',
		GROUP_DELETE: 'group-delete',
		EDIT: 'edit',
		RESTART: 'restart',
		UPGRADE: 'upgrade'
	};
	const UPGRADE_STATUS = {
		UPDATED: 'updated',
		NEEDS_REVIEW: 'needs_review'
	};
	const TEMPLATE_SETUP_EVENT_NAME = {
		SUCCESS: 'Bizproc.AiAgentsGrid.TemplateSetup:success'
	};
	const USER_MINI_PROFILE_ATTRIBUTES = {
		USER_ID: 'bx-tooltip-user-id',
		CONTEXT: 'bx-tooltip-context'
	};
	const USER_MINI_PROFILE_CONTEXT = {
		B24: 'b24'
	};
	const GRID_API_ACTION = {
		START_TEMPLATE: 'Integration.AiAgent.Template.start',
		COPY_AND_START_TEMPLATE: 'Integration.AiAgent.Template.copyAndStart',
		FETCH_ROW: 'Integration.AiAgent.Template.fetchRow',
		DELETE: 'Integration.AiAgent.Template.delete',
		RESTART: 'Integration.AiAgent.Template.start',
		UPGRADE: 'Integration.AiAgent.Template.upgrade',
		CHECK_EXISTING_RUNS: 'Integration.AiAgent.Template.checkExistingRuns'
	};
	const EXISTING_RUNS_WARNING_OUTCOME = {
		VIEW_LAUNCHED: 'view-launched',
		LAUNCH_NEW: 'launch-new',
		CANCELLED: 'cancelled'
	};

	// The toolbar container of the grid filter: main.ui.filter builds its id from the filter id, which
	// is the grid id here. Both the focus target after a narrowing and the hint anchor resolve through it.
	const FILTER_SEARCH_CONTAINER_ID_SUFFIX = '_search_container';

	// none: never scheduled, pending: scheduled but not closed yet, shown: the hint was closed by the user.
	const FILTER_HINT_STATE = {
		NONE: 'none',
		PENDING: 'pending',
		SHOWN: 'shown'
	};

	const ErrorCode = {
		TARIFF_LIMIT: 'AI_AGENTS_UNAVAILABLE_BY_TARIFF',
		TEMPLATE_STALE: 'templateStale'
	};

	class TariffLimit {
		handle(error) {
			const tariffSliderCode = error?.customData?.tariffSliderCode;
			TariffLimit.showFeatureSlider(tariffSliderCode);
		}
		static showFeatureSlider(tariffSliderCode) {
			if (!tariffSliderCode) {
				return;
			}
			ui_infoHelper.FeaturePromotersRegistry.getPromoter({
				code: tariffSliderCode
			}).show();
		}
	}

	class TemplateStale {
		handle() {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_RESTART_ACTION_TEMPLATE_STALE_ERROR')
			});
		}
	}

	class Base {
		handle(error) {
			this.notifyUser(error);
		}
		notifyUser(error) {
			BX.UI.Notification.Center.notify({
				content: this.getErrorMessageFromResult(error)
			});
		}
		getErrorMessageFromResult(error) {
			return main_core.Text.encode(error.message ?? main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DEFAULT_AJAX_ERROR'));
		}
	}

	class UndefinedError extends Base {}

	class AjaxErrorHandler {
		/**
		* Tries to handle by code, if code empty, tries handle by message
		*/
		handle(action, response) {
			const errors = response.errors;
			if (!errors?.length || errors?.length === 0) {
				return;
			}
			errors.forEach(error => {
				const errorCode = error?.code;
				const errorMessage = error?.message;
				if (errorCode) {
					this.getHandlerByCode(errorCode).handle(error);
					return;
				}
				this.getHandlerByMessage(errorMessage).handle(error);
			});
		}
		getHandlerByCode(errorCode) {
			switch (errorCode) {
				case ErrorCode.TARIFF_LIMIT:
					{
						return new TariffLimit();
					}
				case ErrorCode.TEMPLATE_STALE:
					{
						return new TemplateStale();
					}
				default:
					{
						return new UndefinedError();
					}
			}
		}
		getHandlerByMessage(errorMessage) {
			return new Base();
		}
	}

	/**
	 * @abstract
	 */
	class BaseAction {
		#ajaxErrorHandler;
		constructor() {
			this.#ajaxErrorHandler = new AjaxErrorHandler();
		}

		/**
		 * @abstract
		 */
		static getActionId() {
			throw new Error('not implemented');
		}

		/**
		 * @returns {ActionConfig}
		 */
		getActionConfig() {
			throw new Error('not implemented');
		}
		setActionParams(params) {
			this.filter = params?.filter;
			this.showPopups = params?.showPopups ?? true;
		}
		setGrid(grid) {
			this.grid = grid;
		}
		getActionData() {
			return {};
		}
		async execute() {
			await this.onBeforeActionRequest();
			const confirmationPopup = this.showPopups ? this.getConfirmationPopup() : null;
			if (confirmationPopup) {
				confirmationPopup.setOkCallback(async () => {
					confirmationPopup.close();
					await this.run();
				});
				confirmationPopup.show();
			} else {
				await this.run();
			}
		}
		async run() {}
		async onBeforeActionRequest() {}
		onAfterActionRequest() {
			this.grid.reload(() => {
				this.grid.tableUnfade();
			});
		}
		async sendActionRequest() {
			const actionConfig = this.getActionConfig();
			try {
				this.grid.tableFade();
				const actionData = this.getActionData();
				const ajaxOptions = {
					...actionConfig.options,
					json: actionData,
					method: 'POST'
				};
				let result = null;
				switch (actionConfig.type) {
					case AJAX_REQUEST_TYPE.CONTROLLER:
						result = await BX.ajax.runAction(`bizproc.v2.${actionConfig.name}`, ajaxOptions);
						break;
					case AJAX_REQUEST_TYPE.COMPONENT:
						result = await BX.ajax.runComponentAction(actionConfig.component, actionConfig.name, ajaxOptions);
						break;
					default:
						{
							const errorMessage = `Unknown action type: ${actionConfig.type}`;
							this.handleErrorByMessage(actionConfig.name, {
								errors: [{
									message: errorMessage
								}]
							});
						}
				}
				this.handleSuccess(result);
			} catch (result) {
				this.handleError(actionConfig.name, result);
			} finally {
				await this.onAfterActionRequest();
			}
		}
		handleSuccess(result) {}
		handleError(action, response) {
			if (!response?.errors || response.errors.length === 0) {
				return;
			}
			this.#ajaxErrorHandler.handle(action, response);
		}
		handleErrorByMessage(action, message) {
			const errorMessage = message ?? main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DEFAULT_ACTION_ERROR');
			this.handleError(action, {
				errors: [{
					message: errorMessage
				}]
			});
		}
		getConfirmationPopup() {
			return null;
		}
	}

	class EditAction extends BaseAction {
		static getActionId() {
			return ACTION_TYPE.EDIT;
		}
		async run() {
			await super.run();
			this.#openDesigner();
		}
		setActionParams(params) {
			super.setActionParams(params);
			this.editUri = params.editUri;
		}
		#openDesigner() {
			if (!this.editUri) {
				return;
			}
			window.open(this.editUri, '_blank');
		}
	}

	class DeleteAction extends BaseAction {
		deleteChatbotsCheckbox = null;
		static getActionId() {
			return ACTION_TYPE.DELETE;
		}
		async run() {
			await this.sendActionRequest();
		}
		setActionParams(params) {
			super.setActionParams(params);
			this.templateId = Number.parseInt(params.templateId, 10);
		}
		getActionConfig() {
			return {
				type: AJAX_REQUEST_TYPE.CONTROLLER,
				name: GRID_API_ACTION.DELETE
			};
		}
		getActionData() {
			const data = {
				...super.getActionData(),
				deleteChatbots: this.isDeleteChatbotsChecked()
			};
			if (!this.templateId || !main_core.Type.isNumber(this.templateId)) {
				return data;
			}
			data.agentIds = [this.templateId];
			return data;
		}
		getConfirmationPopup() {
			const buttons = ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL;
			const okCaption = main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_BUTTON_OK');
			const cancelCaption = main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_BUTTON_CANCEL');
			const message = this.buildConfirmationMessage();
			return new ui_dialogs_messagebox.MessageBox({
				message,
				title: this.getConfirmationTitle(),
				buttons,
				okCaption,
				onCancel: messageBox => {
					messageBox.close();
				},
				cancelCaption
			});
		}
		getConfirmationTitle() {
			return main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_CONFIRM_TITLE');
		}
		getConfirmationMessageText() {
			return main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_CONFIRM_MESSAGE');
		}
		buildConfirmationMessage() {
			const messageText = this.getConfirmationMessageText();
			const checkboxLabel = main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DELETE_ACTION_DELETE_CHATBOTS_LABEL');
			const messageNode = main_core.Tag.render`
			<div class="bizproc-ai-agents__delete-popup">
				<div class="bizproc-ai-agents__delete-popup-text">${messageText}</div>
				<label class="ui-ctl ui-ctl-checkbox bizproc-ai-agents__delete-popup-checkbox">
					<input type="checkbox" class="ui-ctl-element">
					<div class="ui-ctl-label-text">${checkboxLabel}</div>
				</label>
			</div>
		`;
			this.deleteChatbotsCheckbox = messageNode.querySelector('input[type="checkbox"]');
			return messageNode;
		}
		isDeleteChatbotsChecked() {
			return Boolean(this.deleteChatbotsCheckbox?.checked);
		}
	}

	// Template ids whose restart request is currently in flight. A fresh action
	// instance is created per grid click, so the guard against a duplicate restart
	// of the same click must live outside the instance.
	const restartsInFlight = new Set();
	class RestartAction extends BaseAction {
		static getActionId() {
			return ACTION_TYPE.RESTART;
		}

		// Block a duplicate restart while this template's request is still in flight.
		// A legitimate restart after the previous one finished is allowed — the guard
		// is released in the finally below on every exit path, and only for the id
		// this call captured, so a concurrent in-flight restart's guard is untouched.
		async execute() {
			if (this.templateId && restartsInFlight.has(this.templateId)) {
				return;
			}
			let capturedTemplateId = null;
			if (this.templateId) {
				restartsInFlight.add(this.templateId);
				capturedTemplateId = this.templateId;
			}

			// Releasing the guard in finally is correct only because RestartAction has no
			// confirmation popup: super.execute() awaits the full ajax cycle. If a
			// getConfirmationPopup() is ever added, BaseAction.execute() resolves right after
			// the popup is shown (the ok-callback request is not awaited), so finally would
			// release the guard prematurely. In that case move the release to the request
			// boundary (as UpgradeAction does in onClose).
			try {
				await super.execute();
			} finally {
				if (capturedTemplateId !== null) {
					restartsInFlight.delete(capturedTemplateId);
				}
			}
		}
		async run() {
			await this.sendActionRequest();
		}
		setActionParams(params) {
			super.setActionParams(params);
			this.templateId = Number.parseInt(params.templateId, 10);
		}
		getActionConfig() {
			return {
				type: AJAX_REQUEST_TYPE.CONTROLLER,
				name: GRID_API_ACTION.RESTART
			};
		}
		getActionData() {
			const data = {
				...super.getActionData()
			};
			if (!this.templateId || !main_core.Type.isNumber(this.templateId)) {
				return data;
			}
			data.templateId = this.templateId;
			return data;
		}
		handleSuccess(result) {
			const setupTemplate = result?.data?.setupTemplateData;
			if (setupTemplate && main_core.Type.isObjectLike(setupTemplate)) {
				bizproc_setupTemplate.SetupTemplate.showSidePanel(setupTemplate);
				return;
			}
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_RESTART_ACTION_NOTIFICATION_TITLE')
			});
		}
	}

	class RowHelper {
		#grid;
		constructor(grid) {
			this.#grid = grid;
		}
		setGrid(grid) {
			this.#grid = grid;
		}
		static prepareNewRowParams(columns, rowActions) {
			return {
				id: columns?.ID,
				columns,
				actions: rowActions,
				prepend: true,
				animation: true
			};
		}
		getByTemplateId(templateId) {
			const rowsCollectionWrapper = this.#grid?.getRows();
			return rowsCollectionWrapper?.getById(templateId);
		}
		markAsLoading(row) {
			if (!row) {
				return;
			}
			row.stateLoad();
		}
		markAsLoaded(row) {
			if (!row) {
				return;
			}
			row.stateUnload();
		}
		addToGrid(addRowOptions) {
			this.#grid?.getRealtime()?.addRow(addRowOptions);
		}
		update(row, updateColumns) {
			if (!row) {
				return;
			}
			row.setCellsContent(updateColumns);
		}
		updateActions(row, actions) {
			if (!row || !main_core.Type.isArrayFilled(actions)) {
				return;
			}
			row.setActions(actions);
		}
		highlight(row) {
			if (!row) {
				return;
			}
			main_core.Dom.addClass(row.getNode(), 'ai-agents-grid-row-highlighted');
			setTimeout(() => {
				main_core.Dom.removeClass(row.getNode(), 'ai-agents-grid-row-highlighted');
			}, 2500);
		}
	}

	// Template ids whose review panel is currently open. A fresh action instance is
	// created per grid click, so the guard against re-triggering the upgrade while
	// the review panel is open must live outside the instance.
	const templatesInReview = new Set();
	class UpgradeAction extends BaseAction {
		isCustomized = false;
		static getActionId() {
			return ACTION_TYPE.UPGRADE;
		}
		async run() {
			await this.sendActionRequest();
		}

		// Block a second run (and its confirmation popup) while this agent's review
		// panel is already open — the row keeps the "upgrade" action until the
		// upgrade actually completes, so it can otherwise be clicked again.
		async execute() {
			if (this.templateId && templatesInReview.has(this.templateId)) {
				return;
			}
			await super.execute();
		}
		setActionParams(params) {
			super.setActionParams(params);
			this.templateId = Number.parseInt(params.templateId, 10);
			this.isCustomized = params.isCustomized === true;
		}
		getActionConfig() {
			return {
				type: AJAX_REQUEST_TYPE.CONTROLLER,
				name: GRID_API_ACTION.UPGRADE
			};
		}
		getActionData() {
			const data = {
				...super.getActionData()
			};
			if (!this.templateId || !main_core.Type.isNumber(this.templateId)) {
				return data;
			}
			data.templateId = this.templateId;
			return data;
		}
		getConfirmationPopup() {
			return new ui_dialogs_messagebox.MessageBox({
				message: this.#buildConfirmationMessage(),
				title: main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_CONFIRM_TITLE'),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				okCaption: main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_BUTTON_OK'),
				cancelCaption: main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_BUTTON_CANCEL'),
				onCancel: messageBox => {
					messageBox.close();
				}
			});
		}
		#buildConfirmationMessage() {
			const versionsText = main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_CONFIRM_VERSIONS');
			const activeRunsText = main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_CONFIRM_ACTIVE_RUNS');
			return main_core.Tag.render`
			<div class="bizproc-ai-agents__upgrade-popup">
				<div class="bizproc-ai-agents__upgrade-popup-versions">${versionsText}</div>
				<div class="bizproc-ai-agents__upgrade-popup-active-runs">${activeRunsText}</div>
				${this.#renderCustomizedWarning()}
			</div>
		`;
		}
		#renderCustomizedWarning() {
			if (!this.isCustomized) {
				return '';
			}
			const warningText = main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_CONFIRM_CUSTOMIZED_WARNING');
			return main_core.Tag.render`
			<div class="bizproc-ai-agents__upgrade-popup-customized-warning">${warningText}</div>
		`;
		}
		handleSuccess(result) {
			const status = result?.data?.status;
			if (status === UPGRADE_STATUS.NEEDS_REVIEW) {
				this.#openReviewMaster(result?.data?.blocks, result?.data?.values);
				return;
			}

			// Defensive fallback: the review contract (V2′) always returns
			// needs_review on the first call, so the master opens above. A backend
			// that has not yet adopted it may still answer `updated` directly — keep
			// refreshing the row so the upgrade degrades gracefully instead of
			// silently doing nothing.
			if (status === UPGRADE_STATUS.UPDATED) {
				this.#reloadRow(result?.data?.row);
				this.#notifyUpdated();
				return;
			}

			// Unknown/unexpected status: surface the failure through the standard
			// action error mechanism instead of a silent no-op that leaves the
			// operator without feedback.
			this.handleErrorByMessage(GRID_API_ACTION.UPGRADE);
		}
		#notifyUpdated() {
			ui_notification.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_NOTIFICATION_TITLE')
			});
		}
		#reloadRow(rowData) {
			const rowHelper = new RowHelper(this.grid);
			const row = rowHelper.getByTemplateId(this.templateId);
			if (!row || !rowData?.columns) {
				this.grid?.reload();
				return;
			}
			rowHelper.update(row, rowData.columns);
			rowHelper.updateActions(row, rowData.actions);
			rowHelper.highlight(row);
		}

		/**
		 * needs_review (V2′): the master always opens so the operator can review and
		 * edit the new version's editable constants — not only when a required
		 * constant is missing. Field defaults are overridden with the current values
		 * the backend echoes (prefill by constant code); the client never recomputes
		 * them. On submit API-01 re-runs with the collected values — no separate
		 * workflow fill session; the server stays the source of truth for atomicity
		 * and validation.
		 */
		#openReviewMaster(blocks, values) {
			this.#markReviewOpen();
			bizproc_setupTemplate.SetupTemplate.showFieldsSidePanel({
				templateId: this.templateId,
				blocks: this.#applyValues(main_core.Type.isArray(blocks) ? blocks : [], values),
				title: main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_SETUP_PANEL_TITLE'),
				submitCaption: main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_UPGRADE_ACTION_BUTTON_OK'),
				onSubmit: constantValues => this.#submitConstants(constantValues),
				// Release the guard once the panel is gone — covers both a completed
				// upgrade (which closes the panel) and a cancelled review.
				onClose: () => this.#markReviewClosed()
			});
		}
		#markReviewOpen() {
			templatesInReview.add(this.templateId);
			this.#setRowLoading(true);
		}
		#markReviewClosed() {
			templatesInReview.delete(this.templateId);
			this.#setRowLoading(false);
		}
		#setRowLoading(isLoading) {
			const rowHelper = new RowHelper(this.grid);
			const row = rowHelper.getByTemplateId(this.templateId);
			if (isLoading) {
				rowHelper.markAsLoading(row);
			} else {
				rowHelper.markAsLoaded(row);
			}
		}

		/**
		 * Prefill: project the current values the backend echoes onto the blocks by
		 * overriding each constant's default (matched by constant code = item id).
		 * The backend is the source of truth for values — the client only maps them
		 * so the master renders current values instead of template defaults. Items
		 * without a matching value keep their original default. Returns fresh block
		 * objects so the response payload is not mutated.
		 */
		#applyValues(blocks, values) {
			if (!main_core.Type.isPlainObject(values)) {
				return blocks;
			}
			return blocks.map(block => ({
				...block,
				items: (block.items ?? []).map(item => values[item.id] === undefined ? item : {
					...item,
					default: values[item.id]
				})
			}));
		}

		/**
		 * Re-run the upgrade with the collected constant values. Resolves:
		 *  - a review payload — repeated needs_review (a required value is still
		 *    missing or a value was rejected), re-render the fields prefilled with
		 *    the values the server echoed and report which constants to fix;
		 *  - `false` — keep the panel open (handled error);
		 *  - null — the upgrade completed, close the panel and refresh the row.
		 */
		async #submitConstants(constantValues) {
			try {
				const response = await main_core.ajax.runAction(`bizproc.v2.${GRID_API_ACTION.UPGRADE}`, {
					method: 'POST',
					json: {
						templateId: this.templateId,
						constantValues
					}
				});
				if (response?.data?.status === UPGRADE_STATUS.NEEDS_REVIEW) {
					return this.#buildReview(response);
				}
				this.#reloadRow(response?.data?.row);
				this.#notifyUpdated();
				return null;
			} catch (error) {
				new AjaxErrorHandler().handle(GRID_API_ACTION.UPGRADE, error);
				return false;
			}
		}

		/**
		 * Build the repeated needs_review payload: the blocks prefilled with the
		 * values the server echoed (so input is preserved) plus the constant codes
		 * the server still reports as missing or invalid. An empty blocks set stays
		 * a review (not a silent no-op) so the form can still explain the state.
		 */
		#buildReview(response) {
			const data = response.data;
			const blocks = main_core.Type.isArray(data.blocks) ? data.blocks : [];
			return {
				blocks: this.#applyValues(blocks, data.values),
				requiredConstants: main_core.Type.isArray(data.requiredConstants) ? data.requiredConstants : [],
				invalidConstants: main_core.Type.isArray(data.invalidConstants) ? data.invalidConstants : []
			};
		}
		onAfterActionRequest() {
			this.grid?.tableUnfade();
		}
	}

	class GroupDeleteAction extends DeleteAction {
		static getActionId() {
			return ACTION_TYPE.GROUP_DELETE;
		}
		getSelectedIds() {
			return this.grid.getRows().getSelectedIds();
		}
		isSingleSelection() {
			return this.getSelectedIds()?.length === 1;
		}
		getActionData() {
			const data = {
				...super.getActionData()
			};
			data.agentIds = this.getSelectedIds();
			return data;
		}
		getConfirmationTitle() {
			return this.isSingleSelection() ? super.getConfirmationTitle() : main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_GROUP_DELETE_ACTION_CONFIRM_TITLE');
		}
		getConfirmationMessageText() {
			return this.isSingleSelection() ? super.getConfirmationMessageText() : main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_GROUP_DELETE_ACTION_CONFIRM_MESSAGE');
		}
	}

	const actionMap = new Map([[EditAction.getActionId(), EditAction], [DeleteAction.getActionId(), DeleteAction], [RestartAction.getActionId(), RestartAction], [UpgradeAction.getActionId(), UpgradeAction]]);
	const groupActionMap = new Map([[GroupDeleteAction.getActionId(), GroupDeleteAction]]);

	class ActionFactory {
		static createFromMap(actionMapping, actionId) {
			const ActionClass = actionMapping.get(actionId);
			return ActionClass ? new ActionClass() : null;
		}
		static create(actionId) {
			return this.createFromMap(actionMap, actionId);
		}
		static createGroupAction(actionId) {
			return this.createFromMap(groupActionMap, actionId);
		}
	}

	const EXISTING_RUNS_CHECK_TIMEOUT = 8000;
	const NO_WARNING_DECISION = Object.freeze({
		showWarning: false,
		systemCode: null
	});
	const post = async (action, data) => {
		try {
			const response = await main_core.ajax.runAction(`bizproc.v2.${action}`, {
				method: 'POST',
				json: data || {}
			});
			return response.data;
		} catch (error) {
			const ajaxErrorHandler = new AjaxErrorHandler();
			ajaxErrorHandler.handle(action, error);
		}
		return null;
	};
	const withTimeout = async (request, timeout) => {
		let timeoutId = null;
		try {
			return await Promise.race([request, new Promise((resolve, reject) => {
				timeoutId = setTimeout(() => reject(new Error('timeout')), timeout);
			})]);
		} finally {
			clearTimeout(timeoutId);
		}
	};

	/**
	 * The only place where the raw pre-flight answer becomes a decision: "show" requires
	 * showWarning === true together with a non-empty systemCode, anything else means "do not show".
	 */
	const toExistingRunsDecision = response => {
		const data = response?.data;
		if (data?.showWarning !== true || !main_core.Type.isStringFilled(data?.systemCode)) {
			return {
				...NO_WARNING_DECISION
			};
		}
		return {
			showWarning: true,
			systemCode: data.systemCode
		};
	};
	const gridApi = {
		startTemplate: templateId => {
			return post(GRID_API_ACTION.START_TEMPLATE, {
				templateId
			});
		},
		copyAndStartTemplate: templateId => {
			return post(GRID_API_ACTION.COPY_AND_START_TEMPLATE, {
				templateId
			});
		},
		fetchRow: templateId => {
			return post(GRID_API_ACTION.FETCH_ROW, {
				templateId
			});
		},
		/**
		 * Pre-flight check before launching a system template (API-01). Deliberately bypasses post():
		 * a failed auxiliary check must not notify the user and must not block the launch, so every
		 * failure - network, contract or timeout - degrades to "do not show the warning".
		 *
		 * A positive answer spends the personal right to see the warning on the server, so the method
		 * must not be replayed "just in case".
		 */
		checkExistingRuns: async templateId => {
			try {
				const response = await withTimeout(main_core.ajax.runAction(`bizproc.v2.${GRID_API_ACTION.CHECK_EXISTING_RUNS}`, {
					method: 'POST',
					json: {
						templateId
					}
				}), EXISTING_RUNS_CHECK_TIMEOUT);
				return toExistingRunsDecision(response);
			} catch {
				return {
					...NO_WARNING_DECISION
				};
			}
		}
	};

	class TemplateSetupHandler {
		#grid;
		constructor(grid) {
			this.#grid = grid;
		}
		async handle(event) {
			const eventData = event.getData();
			const templateId = eventData?.templateId;
			if (!templateId) {
				return;
			}
			const rowHelper = new RowHelper(this.#grid);
			const row = rowHelper.getByTemplateId(templateId);
			if (!row) {
				return;
			}
			rowHelper.markAsLoading(row);
			const updatedTemplateRow = await gridApi.fetchRow(templateId);
			if (!updatedTemplateRow) {
				rowHelper.markAsLoaded(row);
				this.#grid.reload();
				return;
			}
			rowHelper.update(row, updatedTemplateRow.columns);
			rowHelper.markAsLoaded(row);
			rowHelper.highlight(row);
		}
	}

	// The hint extensions are loaded on demand: it is shown at most once per user, so a static import
	// (which would add them to the grid dependencies for everyone) is avoided. ui.auto-launch is asked
	// for explicitly - loadExtension returns the exports of the requested extensions only, and
	// BannerDispatcher cannot enable the launcher itself. ui.banner-dispatcher publishes into the
	// shared BX.UI namespace, hence it goes first: the merged exports of the narrower namespaces win.
	const HINT_EXTENSIONS = ['ui.banner-dispatcher', 'ui.auto-launch', 'ui.tour'];
	const GUIDE_ID = 'bizproc-ai-agents-filter-hint';
	const GUIDE_FINISH_EVENT = 'UI.Tour.Guide:onFinish';
	const OPTION_CATEGORY = 'bizproc';
	const OPTION_NAME = 'aiAgentsFilterHint';
	const OPTION_VALUE_NAME = 'state';
	const TEST_ID$1 = {
		HINT: 'bizproc-ai-agents-grid-filter-hint',
		DISMISS: 'bizproc-ai-agents-grid-filter-hint-dismiss'
	};

	/**
	 * One-off onboarding hint pointing at the grid filter (ALG-04).
	 *
	 * The intent to show it is persisted BEFORE the attempt and the "shown" state only after the hint
	 * has actually been closed: the banner queue delays the show by seconds, and a user who leaves the
	 * page in the meantime must not lose the single hint. The state is a personal server option rather
	 * than localStorage, so the hint does not come back on another device (AC-025).
	 */
	class FilterHint {
		#gridId;
		#state;
		#attempt = null;
		constructor(gridId, state) {
			this.#gridId = gridId;
			this.#state = Object.values(FILTER_HINT_STATE).includes(state) ? state : FILTER_HINT_STATE.NONE;
		}

		/**
		 * Entry from the confirmed "view launched" transition: the only condition that schedules the
		 * hint (AC-023).
		 */
		async request() {
			if (this.#state === FILTER_HINT_STATE.SHOWN) {
				return;
			}
			if (this.#state !== FILTER_HINT_STATE.PENDING) {
				this.#saveState(FILTER_HINT_STATE.PENDING);
			}
			await this.#tryShow();
		}

		/**
		 * Entry from the page render: finishes an intent that was scheduled earlier but never reached
		 * the screen. It does not widen the condition of the hint and loads nothing while the state is
		 * not pending.
		 */
		async retryOnLoad() {
			if (this.#state !== FILTER_HINT_STATE.PENDING) {
				return;
			}
			await this.#tryShow();
		}
		#tryShow() {
			this.#attempt ??= this.#queue();
			return this.#attempt;
		}
		async #queue() {
			try {
				const {
					Guide,
					BannerDispatcher,
					AutoLauncher
				} = await main_core.Runtime.loadExtension(HINT_EXTENSIONS);

				// Once the page has played its own banners the queue empties and the launcher turns
				// itself off - any later registration would never start.
				if (!AutoLauncher.isEnabled()) {
					AutoLauncher.enable();
				}

				// The priority queue, not the normal one: there every item after the first is marked as
				// not launchable after others and is dropped silently, without the callback being run.
				BannerDispatcher.high.toQueue(onDone => {
					this.#show(Guide, onDone);
				});
			} catch {
				// Onboarding is optional: a failure must not affect the grid and must stay silent. The
				// state remains pending, so the next page load tries again.
				this.#attempt = null;
			}
		}
		#show(Guide, onDone) {
			// The queue stays blocked until the item reports back, so every branch below ends in finish(),
			// which releases the queue exactly once, even if the hint is closed twice.
			let isFinished = false;
			const finish = isShown => {
				if (isFinished) {
					return;
				}
				isFinished = true;
				if (isShown) {
					this.#saveState(FILTER_HINT_STATE.SHOWN);
				}
				onDone();
			};
			try {
				// The target is resolved now and not when the hint was requested: the filter repaints
				// its search container between the two moments.
				if (!main_core.Dom.isShownRecursive(this.#resolveSearchContainer())) {
					// The intent stays pending, so a later visit tries again.
					finish(false);
					return;
				}
				const guide = new Guide({
					id: GUIDE_ID,
					overlay: false,
					simpleMode: true,
					// The only mode in which a guide without an overlay can be bound to a target: the
					// offset of a top/bottom step is otherwise measured against the overlay element,
					// which ui.tour creates for overlay: true only, and start() throws right after the
					// popup is on screen. This mode drops the built-in footer, so the dismiss button is
					// declared on the step - its phrase is the one the footer button uses.
					onEvents: true,
					steps: [{
						target: () => this.#resolveSearchContainer(),
						text: main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_FILTER_HINT_TEXT'),
						position: 'bottom',
						buttons: [{
							text: main_core.Loc.getMessage('JS_UI_TOUR_BUTTON_SIMPLE'),
							event: () => guide.close()
						}]
					}]
				});

				// The hint counts as shown only here: close() runs on the dismiss button, on Esc, on a
				// click outside the popup and on a click on the filter itself.
				guide.subscribe(GUIDE_FINISH_EVENT, () => finish(true));

				// Guide builds its popup options internally, so the dismissal options are set afterwards:
				// this mode keeps the popup open on an outside click, and the hint has to be closeable
				// without a mouse as well.
				const popup = guide.getPopup();
				popup.setAutoHide(true);
				popup.setClosingByEsc(true);
				this.#namePopup(popup.getPopupContainer());
				this.#markPopup(popup);
				guide.start();
			} catch {
				finish(false);
			}
		}

		/**
		 * main.popup gives every popup the dialog role, and ui.tour passes it no name - so the hint would
		 * be announced as a nameless dialog. An existing name is left alone: naming the popup belongs to
		 * ui.tour, and once it does so its own label must win.
		 */
		#namePopup(container) {
			if (!container || main_core.Type.isStringFilled(main_core.Dom.attr(container, 'aria-label'))) {
				return;
			}
			main_core.Dom.attr(container, 'aria-label', main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_FILTER_HINT_LABEL'));
		}

		/**
		 * The hint is drawn by ui.tour, so both of its nodes are marked for e2e from the outside. The
		 * dismiss button is a popup button and not a node inside the hint content: this mode renders no
		 * footer of its own, and the guide turns every step button into a popup one.
		 */
		#markPopup(popup) {
			const container = popup.getPopupContainer();
			if (container) {
				main_core.Dom.attr(container, 'data-test-id', TEST_ID$1.HINT);
			}
			const [dismissButton] = popup.getButtons();
			if (dismissButton) {
				main_core.Dom.attr(dismissButton.getContainer(), 'data-test-id', TEST_ID$1.DISMISS);
			}
		}
		#resolveSearchContainer() {
			return document.getElementById(`${this.#gridId}${FILTER_SEARCH_CONTAINER_ID_SUFFIX}`);
		}

		/**
		 * The client owns the state: save() keeps it in the BX.userOptions cookie, which the next hit
		 * replays, and send() clears that cookie before firing the request - so the immediate send trades
		 * the fallback for not waiting out the default delay.
		 */
		#saveState(state) {
			this.#state = state;
			main_core.userOptions.save(OPTION_CATEGORY, OPTION_NAME, OPTION_VALUE_NAME, state);
			main_core.userOptions.send(null);
		}
	}

	const SCENARIO_CREATE_SOURCE = 'SCENARIO';
	const GRID_UPDATED_EVENT = 'Grid::updated';
	const FILTER_APPLY_TIMEOUT = 10000;
	class GridManager {
		static instances = [];
		#settings = null;
		#grid;
		#gridId;
		#isExistingRunsWarningSpent = false;
		#filterHint = null;
		constructor(gridId) {
			this.#gridId = gridId;
			this.#grid = BX.Main.gridManager.getById(gridId)?.instance;
			this.#settings = main_core.Extension.getSettings('bizproc.ai-agents.grid');
			this.#subscribeToEvents();
			this.retryFilterHintOnLoad();
		}
		static getInstance(gridId) {
			if (!this.instances[gridId]) {
				this.instances[gridId] = new GridManager(gridId);
			}
			return this.instances[gridId];
		}
		static setSort(options) {
			const grid = BX.Main.gridManager.getById(options.gridId)?.instance;
			if (main_core.Type.isObject(grid)) {
				grid.tableFade();
				grid.getUserOptions().setSort(options.sortBy, options.order, () => {
					grid.reload();
				});
			}
		}
		static setFilter(options) {
			const grid = BX.Main.gridManager.getById(options.gridId)?.instance;
			const filter = BX.Main.filterManager.getById(options.gridId);
			if (main_core.Type.isObject(grid) && main_core.Type.isObject(filter)) {
				filter.getApi().extendFilter(options.filter);
			}
		}
		getGrid() {
			return this.#grid;
		}
		runAction(actionConfig) {
			if (!this.#isDeleteAction(actionConfig) && !this.#isRestartOnScenarioWithBasicTariff(actionConfig) && !this.validateAiAgentsAvailableByTariff()) {
				return;
			}
			const action = actionConfig.isGroupAction ?? false ? ActionFactory.createGroupAction(actionConfig.actionId) : ActionFactory.create(actionConfig.actionId);
			if (action) {
				action.setGrid(this.#grid);
				action.setActionParams(actionConfig.params);
				action.execute();
			}
		}
		#isDeleteAction(actionConfig) {
			return actionConfig.actionId === ACTION_TYPE.DELETE || actionConfig.actionId === ACTION_TYPE.GROUP_DELETE;
		}
		#isRestartOnScenarioWithBasicTariff(actionConfig) {
			return actionConfig.actionId === ACTION_TYPE.RESTART && actionConfig.params?.createSource === SCENARIO_CREATE_SOURCE && this.#settings?.tariffInfo?.isBasicOrHigher === true;
		}
		reload() {
			this.#grid?.reload();
		}
		#subscribeToEvents() {
			main_core_events.EventEmitter.subscribe(TEMPLATE_SETUP_EVENT_NAME.SUCCESS, event => new TemplateSetupHandler(this.#grid).handle(event));
		}

		/**
		 * Whether the personal right to see the existing-runs warning is already spent. The flag comes
		 * from the page render and is only an optimization that saves the pre-flight request - the
		 * server stays the source of truth.
		 */
		isExistingRunsWarningSpent() {
			return this.#isExistingRunsWarningSpent;
		}
		markExistingRunsWarningSpent() {
			this.#isExistingRunsWarningSpent = true;
		}

		/**
		 * Schedules the one-off filter hint. Called from the confirmed "view launched" transition - the
		 * only condition that starts the onboarding (AC-023).
		 */
		requestFilterHint() {
			void this.#getFilterHint().request();
		}

		/**
		 * Finishes a hint that was scheduled on an earlier visit but never appeared. Nothing is loaded
		 * unless the state says the intent is still pending.
		 */
		retryFilterHintOnLoad() {
			void this.#getFilterHint().retryOnLoad();
		}
		#getFilterHint() {
			this.#filterHint ??= new FilterHint(this.#gridId, this.#settings?.filterHintState);
			return this.#filterHint;
		}

		/**
		 * Narrows the grid to the launched agents of one system template (AC-009) and resolves only
		 * once the rows have been re-requested.
		 *
		 * setFields() is used instead of extendFilter(): it deactivates every preset, so the default
		 * "Started by me" preset stops adding both the current user's filter and the unlaunched
		 * templates it keeps in the list. The promise returned by the filter itself cannot report
		 * success (Api.apply() drops it and it never rejects), so the confirmation is the grid's own
		 * Grid::updated event with a timeout fallback - an expired timeout means "not confirmed",
		 * while the filter stays applied.
		 *
		 * The narrowing also moves the focus and announces itself: the rows are replaced silently, and the
		 * row the transition started from is among the ones that leave.
		 */
		async applyLaunchedAgentsFilter(systemCode) {
			const filter = BX.Main.filterManager.getById(this.#gridId);
			if (!main_core.Type.isObject(filter)) {
				return false;
			}
			const updated = this.#waitForGridUpdate();
			filter.getApi().setFields({
				// A multi-select value has to be an index-keyed map: main.ui.filter drops anything that
				// is not a plain object (prepareMultiSelectValue), so a plain array applies as empty.
				AGENT_TEMPLATE: {
					0: systemCode
				},
				IS_ACTIVE: 'Y'
			});
			filter.getApi().apply();
			const isConfirmed = await updated;

			// Tied to the apply and not to its confirmation: an expired wait only means the grid did not
			// report back, while the filter stays applied and the initiator row leaves the list either way.
			// Only the onboarding hint keeps waiting for a confirmed apply.
			this.#focusFilterSearchContainer();
			ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_LAUNCHED_AGENTS_FILTER_ANNOUNCEMENT'));
			return isConfirmed;
		}

		/**
		 * The dialog gives the focus back to the launch button, and the narrowing then drops that row from
		 * the grid, leaving the focus on the body. It is moved to the applied filter instead: that is both
		 * the reason the list changed and the control that widens it back, and it is the node the
		 * onboarding hint binds to - so the hint takes the focus from there and returns it on close.
		 *
		 * Resolved after the wait for the update settles and not before the apply: the filter repaints its
		 * search container while applying, and a node focused earlier would already be replaced.
		 */
		#focusFilterSearchContainer() {
			const container = document.getElementById(`${this.#gridId}${FILTER_SEARCH_CONTAINER_ID_SUFFIX}`);
			if (!container || !main_core.Dom.isShownRecursive(container)) {
				return;
			}

			// Programmatically focusable only, so the Tab order of the toolbar stays as it was.
			main_core.Dom.attr(container, 'tabindex', '-1');
			container.focus();
		}
		#waitForGridUpdate() {
			return new Promise(resolve => {
				const finish = isUpdated => {
					clearTimeout(timeoutId);
					main_core_events.EventEmitter.unsubscribe(GRID_UPDATED_EVENT, handler);
					resolve(isUpdated);
				};

				// Grid::updated is a global event: without the id check another grid on the page would
				// resolve this promise before our rows are reloaded. The grid fires it the legacy way,
				// but other modules re-emit it through EventEmitter, so both payload shapes are read.
				const handler = event => {
					const payload = event.getCompatData() ?? event.getData();
					const grid = main_core.Type.isArray(payload) ? payload[0] : payload;
					if (grid?.getId?.() === this.#gridId) {
						finish(true);
					}
				};
				const timeoutId = setTimeout(() => finish(false), FILTER_APPLY_TIMEOUT);
				main_core_events.EventEmitter.subscribe(GRID_UPDATED_EVENT, handler);
			});
		}
		validateAiAgentsAvailableByTariff() {
			const tariffInfo = this.#settings?.tariffInfo;
			if (!tariffInfo?.isAiAgentsAvailable) {
				TariffLimit.showFeatureSlider(tariffInfo?.aiAgentsTariffSliderCode);
				return false;
			}
			return true;
		}
	}

	class BaseField {
		#fieldId;
		#gridId;
		#fieldNode;
		constructor(params) {
			this.#fieldId = params?.fieldId;
			this.#gridId = params?.gridId;
			this.#fieldNode = params?.fieldNode;
		}
		setFieldNode(node) {
			this.#fieldNode = node;
		}
		getGridId() {
			return this.#gridId;
		}
		getFieldId() {
			return this.#fieldId;
		}
		getGridManager() {
			if (!this.#gridId) {
				return null;
			}
			return GridManager.getInstance(this.#gridId);
		}
		getFieldNode() {
			if (!this.#fieldNode) {
				this.#fieldNode = document.getElementById(this.getFieldId());
			}
			return this.#fieldNode;
		}
		appendToFieldNode(element) {
			main_core.Dom.append(element, this.getFieldNode());
		}
	}

	class AgentInfoField extends BaseField {
		render(params) {
			const agentName = params.name ?? '';
			const agentDescription = params.description ?? '';
			const nameNode = this.createAgentNameNode(agentName);
			main_core.Dom.attr(nameNode, 'data-test-id', 'bizproc-ai-agents-grid-agent-title');
			main_core.Dom.attr(nameNode, 'title', agentName);
			const descriptionNode = this.createAgentDescriptionNode(agentDescription);
			main_core.Dom.attr(descriptionNode, 'title', agentDescription);
			this.appendToFieldNode(nameNode);
			this.appendToFieldNode(descriptionNode);
		}
		createAgentNameNode(agentName) {
			return ui_system_typography.Text.render(agentName, {
				size: 'md',
				accent: true,
				tag: 'div',
				className: 'bizproc-ai-agents-grid-agent-name bizproc-ai-agents-one-line-height'
			});
		}
		createAgentDescriptionNode(agentDescription) {
			return ui_system_typography.Text.render(agentDescription, {
				size: 'xs',
				accent: false,
				tag: 'div',
				className: 'bizproc-ai-agents-grid-agent-description bizproc-ai-agents-two-lines-height'
			});
		}
	}

	class GridIcons {
		static LOAD = `
		<svg class="agent-grid-load-icon" width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
			<g clip-path="url(#clip0_762_45517)">
				<rect class="agent-grid-load-bar" y="16" width="4" height="5"/>
			</g>
			<g clip-path="url(#clip1_762_45517)">
				<rect class="agent-grid-load-bar" x="6" y="12" width="4" height="10"/>
			</g>
			<g clip-path="url(#clip2_762_45517)">
				<rect class="agent-grid-load-bar" x="12" y="8" width="4" height="20"/>
			</g>
			<g clip-path="url(#clip3_762_45517)">
				<rect class="agent-grid-load-bar" x="18" y="-8" width="4" height="28"/>
			</g>
			<g clip-path="url(#clip4_762_45517)">
				<rect class="agent-grid-load-bar" x="24" width="4" height="38"/>
			</g>
			<defs>
				<clipPath id="clip0_762_45517">
				<path d="M0 18C0 16.8954 0.895431 16 2 16C3.10457 16 4 16.8954 4 18V20H0V18Z" fill="white" />
				</clipPath>
				<clipPath id="clip1_762_45517">
				<path d="M6 14C6 12.8954 6.89543 12 8 12C9.10457 12 10 12.8954 10 14V20H6V14Z" fill="white" />
				</clipPath>
				<clipPath id="clip2_762_45517">
				<path d="M12 10C12 8.89543 12.8954 8 14 8C15.1046 8 16 8.89543 16 10V20H12V10Z" fill="white" />
				</clipPath>
				<clipPath id="clip3_762_45517">
				<path d="M18 6C18 4.89543 18.8954 4 20 4C21.1046 4 22 4.89543 22 6V20H18V6Z" fill="white" />
				</clipPath>
				<clipPath id="clip4_762_45517">
				<path d="M24 2C24 0.895431 24.8954 0 26 0C27.1046 0 28 0.895431 28 2V20H24V2Z" fill="white" />
				</clipPath>
			</defs>
		</svg>
	`;
		static AGENT_CHAT = `
		<svg class="agent-grid-chat-icon-img" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
			<path
			d="M10.1064 3.64648C11.349 3.64655 12.3564 4.65388 12.3564 5.89648V6.49707H13.0693C14.229 6.49707 15.1697 7.43706 15.1699 8.59668V11.3604C15.1699 12.1141 14.7723 12.7751 14.1758 13.1455V13.7129C14.1756 14.6424 13.0518 15.1075 12.3945 14.4502L11.4043 13.4609H8.83984C7.6802 13.4608 6.74023 12.52 6.74023 11.3604V8.59668C6.74045 7.43718 7.68033 6.49726 8.83984 6.49707H11.3066V5.89648C11.3066 5.23378 10.7691 4.69635 10.1064 4.69629H5.08008C4.41751 4.69649 3.88086 5.23386 3.88086 5.89648V8.82227C3.8809 9.26438 4.11903 9.65203 4.47949 9.86133L5.00293 10.165V11.6611L5.89355 10.7715V11.3203C5.89355 11.5894 5.96379 11.8422 6.08789 12.0605L5.73438 12.415C5.07702 13.0724 3.95312 12.6064 3.95312 11.6768V10.7695C3.28205 10.3802 2.83012 9.65397 2.83008 8.82227V5.89648C2.83008 4.65397 3.83761 3.64668 5.08008 3.64648H10.1064ZM8.83984 7.54688C8.26023 7.54706 7.79025 8.01707 7.79004 8.59668V11.3604C7.79004 11.9401 8.2601 12.41 8.83984 12.4102H11.8389L13.126 13.6973V12.5615L13.6221 12.2539C13.923 12.067 14.1191 11.7361 14.1191 11.3604V8.59668C14.1189 8.01696 13.6491 7.54688 13.0693 7.54688H8.83984Z"
			fill="#525C69"/>
		</svg>
	`;
		static DEPARTMENT = `
			<svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
				<path fill-rule="evenodd" clip-rule="evenodd"
						d="M1.95676 6.28648C2.77587 5.81165 3.78874 5.66414 4.70642 5.66414C5.62411 5.66414 6.63698 5.81165 7.45609 6.28648C8.29896 6.77509 8.90893 7.59628 9.0059 8.85475C9.03899 9.28426 8.68791 9.61043 8.29506 9.61043H1.11778C0.724933 9.61043 0.373856 9.28426 0.406952 8.85474C0.503923 7.59628 1.11389 6.77509 1.95676 6.28648ZM1.20349 8.82018H8.20935C8.11169 7.88548 7.66355 7.32017 7.05977 6.97016C6.41198 6.59465 5.55879 6.45438 4.70642 6.45438C3.85406 6.45438 3.00086 6.59465 2.35308 6.97016C1.7493 7.32017 1.30116 7.88548 1.20349 8.82018Z"
						fill="white" />
				<path fill-rule="evenodd" clip-rule="evenodd"
						d="M4.27024 0.867925C4.10176 0.923778 3.97998 0.989802 3.92655 1.02913C3.41436 1.40617 3.16091 2.22309 3.34019 3.03986C3.51311 3.82762 4.00839 4.31314 4.70162 4.31314C5.1431 4.31314 5.46803 4.12537 5.70647 3.81951C5.95916 3.49536 6.11633 3.02833 6.12825 2.53082C6.14018 2.03261 6.00512 1.58104 5.77044 1.2737C5.5543 0.990653 5.22474 0.786338 4.70165 0.786338C4.59177 0.786338 4.43616 0.812924 4.27024 0.867925ZM3.45807 0.392728C1.78723 1.62268 2.34174 5.10338 4.70162 5.10338C7.53484 5.10338 7.77944 -0.00390625 4.70165 -0.00390625C4.2688 -0.00390625 3.73551 0.188492 3.45807 0.392728Z"
						fill="white" />
				<path fill-rule="evenodd" clip-rule="evenodd"
						d="M7.35878 0.787574C7.84175 0.804938 8.15155 1.00343 8.35793 1.2737C8.59262 1.58104 8.72768 2.03261 8.71574 2.53082C8.70383 3.02833 8.54666 3.49536 8.29396 3.81951C8.05552 4.12537 7.73059 4.31314 7.28912 4.31314C7.25733 4.31314 7.22596 4.31212 7.19502 4.31009L6.67579 5.01706C6.86428 5.07305 7.06883 5.10338 7.28912 5.10338C10.1223 5.10338 10.3669 -0.00390625 7.28914 -0.00390625C7.10718 -0.00390625 6.90747 0.0300948 6.71648 0.084683L7.35878 0.787574ZM9.66755 9.61073H10.8825C11.2754 9.61073 11.6265 9.28456 11.5934 8.85505C11.4964 7.59658 10.8864 6.77539 10.0436 6.28678C9.43126 5.93184 8.71069 5.75979 8.00254 5.69554L9.00673 6.691C9.2353 6.76427 9.45073 6.85654 9.64725 6.97046C10.251 7.32047 10.6992 7.88578 10.7968 8.82049H9.66755V9.61073Z"
						fill="white" />
				<path fill-rule="evenodd" clip-rule="evenodd"
						d="M1.95676 6.28648C2.77587 5.81165 3.78874 5.66414 4.70642 5.66414C5.62411 5.66414 6.63698 5.81165 7.45609 6.28648C8.29896 6.77509 8.90893 7.59628 9.0059 8.85475C9.03899 9.28426 8.68791 9.61043 8.29506 9.61043H1.11778C0.724933 9.61043 0.373856 9.28426 0.406952 8.85474C0.503923 7.59628 1.11389 6.77509 1.95676 6.28648ZM1.20349 8.82018H8.20935C8.11169 7.88548 7.66355 7.32017 7.05977 6.97016C6.41198 6.59465 5.55879 6.45438 4.70642 6.45438C3.85406 6.45438 3.00086 6.59465 2.35308 6.97016C1.7493 7.32017 1.30116 7.88548 1.20349 8.82018Z"
						fill="white" />
				<path fill-rule="evenodd" clip-rule="evenodd"
						d="M4.27024 0.867925C4.10176 0.923778 3.97998 0.989802 3.92655 1.02913C3.41436 1.40617 3.16091 2.22309 3.34019 3.03986C3.51311 3.82762 4.00839 4.31314 4.70162 4.31314C5.1431 4.31314 5.46803 4.12537 5.70647 3.81951C5.95916 3.49536 6.11633 3.02833 6.12825 2.53082C6.14018 2.03261 6.00512 1.58104 5.77044 1.2737C5.5543 0.990653 5.22474 0.786338 4.70165 0.786338C4.59177 0.786338 4.43616 0.812924 4.27024 0.867925ZM3.45807 0.392728C1.78723 1.62268 2.34174 5.10338 4.70162 5.10338C7.53484 5.10338 7.77944 -0.00390625 4.70165 -0.00390625C4.2688 -0.00390625 3.73551 0.188492 3.45807 0.392728Z"
						fill="white" />
				<path fill-rule="evenodd" clip-rule="evenodd"
						d="M7.35878 0.787574C7.84175 0.804938 8.15155 1.00343 8.35793 1.2737C8.59262 1.58104 8.72768 2.03261 8.71574 2.53082C8.70383 3.02833 8.54666 3.49536 8.29396 3.81951C8.05552 4.12537 7.73059 4.31314 7.28912 4.31314C7.25733 4.31314 7.22596 4.31212 7.19502 4.31009L6.67579 5.01706C6.86428 5.07305 7.06883 5.10338 7.28912 5.10338C10.1223 5.10338 10.3669 -0.00390625 7.28914 -0.00390625C7.10718 -0.00390625 6.90747 0.0300948 6.71648 0.084683L7.35878 0.787574ZM9.66755 9.61073H10.8825C11.2754 9.61073 11.6265 9.28456 11.5934 8.85505C11.4964 7.59658 10.8864 6.77539 10.0436 6.28678C9.43126 5.93184 8.71069 5.75979 8.00254 5.69554L9.00673 6.691C9.2353 6.76427 9.45073 6.85654 9.64725 6.97046C10.251 7.32047 10.6992 7.88578 10.7968 8.82049H9.66755V9.61073Z"
						fill="white" />
		</svg>
	`;
	}

	class PhotoField extends BaseField {
		render(params) {
			const avatarOptions = {
				size: 24,
				userpicPath: params?.user?.photoUrl
			};
			const avatar = new ui_avatar.AvatarRound(avatarOptions);
			this.addMiniProfile(params);
			avatar?.renderTo(this.getFieldNode());
			main_core.Dom.addClass(this.getFieldNode(), 'agent-grid_user-photo');

			// decorative: avatar is not a real trigger (hover-only mini-profile), profile is reachable via the adjacent name link / used-by popup
			main_core.Dom.attr(this.getFieldNode(), 'aria-hidden', 'true');
			if (!params?.user?.id) {
				main_core.Dom.addClass(this.getFieldNode(), 'agent-grid_user-photo-stub');
			}
		}
		addMiniProfile(params) {
			main_core.Dom.attr(this.getFieldNode(), 'bx-tooltip-user-id', params?.user?.id);
			main_core.Dom.attr(this.getFieldNode(), 'bx-tooltip-context', 'b24');
		}
	}

	class UsedByField extends BaseField {
		static MAX_VISIBLE_AVATARS_COMBINED = 3;
		static MAX_VISIBLE_AVATARS_USERS_ONLY = 5;
		static MAX_COUNTER_VALUE = 99;
		static ENTITY_DEPARTMENT = 'department';
		static ENTITY_USER = 'user';
		#chatsPopup;
		render(params) {
			const {
				users = [],
				chats = [],
				departments = {}
			} = params;
			const container = main_core.Tag.render`
			<div class="agent-grid-used-by-container"></div>
		`;
			const hasUsers = users && users.length > 0;
			const hasDepartments = departments && Object.keys(departments).length > 0;
			if (hasUsers && hasDepartments) {
				this.#renderCombinedView(container, departments, users);
			} else if (hasDepartments) {
				this.#renderDepartmentsOnlyView(container, departments, users);
			} else {
				this.#renderUsersOnlyView(container, departments, users);
			}
			this.#createChatNode(container, chats);
			this.appendToFieldNode(container);
		}
		#renderCombinedView(container, departments, users) {
			const combinedViewWrapper = main_core.Tag.render`
			<div class="agent-grid-used-by-container-with-users-and-departments"></div>
		`;
			main_core.Dom.append(combinedViewWrapper, container);
			this.#createDepartmentsCounter(combinedViewWrapper, departments, users, UsedByField.MAX_VISIBLE_AVATARS_COMBINED);
			this.#createAvatarsContainer(combinedViewWrapper, departments, users, UsedByField.MAX_VISIBLE_AVATARS_COMBINED);
		}
		#renderUsersOnlyView(container, departments, users) {
			this.#createAvatarsContainer(container, departments, users, UsedByField.MAX_VISIBLE_AVATARS_USERS_ONLY);
		}
		#renderDepartmentsOnlyView(container, departments, users) {
			this.#createDepartmentsNode(container, departments, users);
		}
		#createAvatarsContainer(container, departments, users, maxVisibleAvatars) {
			const placeholderAvatarsCount = 3;
			const avatarsContainer = main_core.Tag.render`<div data-test-id="bizproc-ai-agents-grid-used-by-avatars-container" class="agent-grid-user-avatars"></div>`;
			if (!users || users.length === 0) {
				for (let i = 0; i < placeholderAvatarsCount; i++) {
					const avatarContainer = main_core.Tag.render`<span></span>`;
					main_core.Dom.append(avatarContainer, avatarsContainer);
					new PhotoField({
						fieldNode: avatarContainer
					}).render({});
				}
				main_core.Dom.append(avatarsContainer, container);
				return;
			}
			users.slice(0, maxVisibleAvatars).forEach(user => {
				const avatarContainer = main_core.Tag.render`<span></span>`;
				main_core.Dom.append(avatarContainer, avatarsContainer);
				new PhotoField({
					fieldNode: avatarContainer
				}).render({
					user
				});
			});
			if (users.length > maxVisibleAvatars) {
				const remainingCount = users.length - maxVisibleAvatars;
				const counterClass = 'agent-grid-avatar-counter-number';
				const counterWrapperClass = 'agent-grid-avatar-counter';
				const counter = this.#createCounterNode(remainingCount, departments, users, counterClass, counterWrapperClass);
				main_core.Dom.attr(counter, 'data-test-id', 'bizproc-ai-agents-grid-used-by-avatars-counter');
				main_core.Dom.append(counter, avatarsContainer);
			}
			main_core.Dom.append(avatarsContainer, container);
		}
		#createDepartmentsCounter(container, departments, users, maxVisibleAvatars) {
			const departmentsCount = Object.keys(departments).length;
			if (departmentsCount === 0) {
				return;
			}
			let withOpenPopupEvent = true;
			if (maxVisibleAvatars && users?.length > maxVisibleAvatars) {
				withOpenPopupEvent = false;
			}
			const counterClass = 'agent-grid-department-counter agent-grid-department-counter-with-users';
			const counterWrapperClass = 'agent-grid-department-counter-focus-wrapper';
			const withPlusPrefix = false;
			const counterNode = this.#createCounterNode(departmentsCount, departments, users, counterClass, counterWrapperClass, withPlusPrefix, withOpenPopupEvent);
			if (counterNode) {
				main_core.Dom.attr(counterNode, 'data-test-id', 'bizproc-ai-agents-grid-used-by-departments-counter');
				main_core.Dom.append(counterNode, container);
			}
		}
		#createDepartmentsNode(container, departments, users) {
			if (!departments) {
				return;
			}
			const departmentIds = Object.keys(departments);
			const departmentsCount = departmentIds.length;
			if (departmentsCount === 0) {
				return;
			}
			const firstDepartmentId = main_core.Text.toInteger(departmentIds[0]);
			const firstDepartmentName = departments[firstDepartmentId] ?? '';
			const departmentNode = this.#getDepartmentNode(firstDepartmentName, firstDepartmentId);
			if (departmentsCount > 1) {
				const remainingCount = departmentsCount - 1;
				const counterClass = 'agent-grid-department-counter-number';
				const counterWrapperClass = 'agent-grid-department-counter';
				const counterNode = this.#createCounterNode(remainingCount, departments, users, counterClass, counterWrapperClass);
				if (counterNode) {
					main_core.Dom.attr(counterNode, 'data-test-id', 'bizproc-ai-agents-grid-used-by-departments-counter');
					// keep node and counter as siblings so the two buttons are not nested
					const departmentRow = main_core.Tag.render`<div class="agent-grid-department-row"></div>`;
					main_core.Dom.append(departmentNode, departmentRow);
					main_core.Dom.append(counterNode, departmentRow);
					main_core.Dom.append(departmentRow, container);
					return;
				}
			}
			main_core.Dom.append(departmentNode, container);
		}
		#getDepartmentNode(department, nodeId, shouldAddHover = false) {
			const departmentWrapper = main_core.Tag.render`
			<div class="${shouldAddHover ? 'agent-grid-department-in-list' : 'agent-grid-department'}"></div>
		`;
			main_core.Dom.attr(departmentWrapper, 'data-test-id', 'bizproc-ai-agents-grid-used-by-department');
			const circle = main_core.Tag.render`<div class="agent-grid-department-circle">${GridIcons.DEPARTMENT}</div>`;
			const label = ui_system_typography.Text.render(department, {
				size: 'xs',
				accent: false,
				tag: 'span',
				className: 'agent-grid-department-label'
			});
			main_core.Dom.attr(label, 'title', department);
			main_core.Dom.append(circle, departmentWrapper);
			main_core.Dom.append(label, departmentWrapper);
			main_core.Event.bind(departmentWrapper, 'click', event => {
				event.stopPropagation();
				humanresources_companyStructure_public.Structure?.open({
					focusNodeId: nodeId
				});
			});
			this.#makeButtonAccessible(departmentWrapper, main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_USED_BY_DEPARTMENT', {
				'#NAME#': department
			}));
			return departmentWrapper;
		}
		#getDisplayedNumber(remainingCount) {
			return remainingCount > UsedByField.MAX_COUNTER_VALUE ? UsedByField.MAX_COUNTER_VALUE : remainingCount;
		}
		#makeButtonAccessible(element, ariaLabel) {
			main_core.Dom.attr(element, 'role', 'button');
			main_core.Dom.attr(element, 'tabindex', '0');
			if (main_core.Type.isStringFilled(ariaLabel)) {
				main_core.Dom.attr(element, 'aria-label', ariaLabel);
			}
			main_core.Event.bind(element, 'keydown', event => {
				// ignore bubbling from nested buttons so the action fires exactly once
				if (event.target !== element) {
					return;
				}
				if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
					if (event.repeat) {
						return;
					}
					event.preventDefault();
					element.click();
				}
			});
		}
		#createCounterNode(count, departments, users, counterClassName = '', counterWrapperClassName = '', withPlusPrefix = true, withOpenPopupEvent = true) {
			if (count <= 0) {
				return null;
			}
			const counterWrapper = main_core.Tag.render`<div class="${counterWrapperClassName}"></div>`;
			const displayedNumber = this.#getDisplayedNumber(count);
			let counterText = String(displayedNumber);
			if (withPlusPrefix) {
				counterText = `+${counterText}`;
			}
			const numberNode = ui_system_typography.Text.render(counterText, {
				size: '3xs',
				accent: false,
				tag: 'span',
				className: counterClassName
			});
			main_core.Dom.append(numberNode, counterWrapper);
			if (withOpenPopupEvent) {
				main_core.Event.bind(counterWrapper, 'click', event => {
					event.stopPropagation();
					this.#openCombinedPopup(departments, users, counterWrapper);
				});
				this.#makeButtonAccessible(counterWrapper, main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_USED_BY_SHOW_MORE'));
			} else {
				main_core.Dom.addClass(numberNode, 'agent-grid-counter-default-cursor');
			}
			return counterWrapper;
		}
		#createChatNode(container, chats) {
			const chatsCount = chats?.length ?? 0;
			if (chatsCount === 0) {
				return;
			}
			const firstChat = chats[0] ?? '';
			const chatNode = this.#getChatNode(firstChat);
			if (chatsCount > 1) {
				const remainingCount = chatsCount - 1;
				const counterNode = this.#getChatsCounterNode(remainingCount, chats);

				// keep node and counter as siblings so the two buttons are not nested
				const chatRow = main_core.Tag.render`<div class="agent-grid-chat-row"></div>`;
				main_core.Dom.append(chatNode, chatRow);
				main_core.Dom.append(counterNode, chatRow);
				main_core.Dom.append(chatRow, container);
				return;
			}
			main_core.Dom.append(chatNode, container);
		}
		#getChatNode(chat, shouldAddHover = false) {
			const chatName = chat.chatName ?? '';
			const chatNameNode = ui_system_typography.Text.render(chatName, {
				size: '2xs',
				accent: false,
				tag: 'span',
				className: 'agent-grid-chat-name'
			});
			const encodedChatName = main_core.Text.encode(chatName);
			const containerClass = shouldAddHover ? 'agent-grid-chats-in-list' : 'agent-grid-chat-container';
			const chatContainer = main_core.Tag.render`
			<div class="${containerClass}" title="${encodedChatName}">
				${GridIcons.AGENT_CHAT}
				<span class="agent-grid-chat-link">
					${chatNameNode}
				</span>
			</div>
		`;
			main_core.Dom.attr(chatContainer, 'data-test-id', 'bizproc-ai-agents-grid-used-by-chat');
			main_core.Event.bind(chatContainer, 'click', event => {
				event.preventDefault();
				event.stopPropagation();
				this.openChat(chat.chatId);
			});
			this.#makeButtonAccessible(chatContainer, main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_USED_BY_OPEN_CHAT', {
				'#NAME#': chatName
			}));
			return chatContainer;
		}
		#getChatsCounterNode(remainingCount, chats) {
			const counterWrapper = main_core.Tag.render`<div class="ai-agents-chats-counter-wrapper"></div>`;
			main_core.Dom.attr(counterWrapper, 'data-test-id', 'bizproc-ai-agents-grid-used-by-chats-counter');
			const counterClassName = 'ai-agents-chats-counter';
			const displayedNumber = this.#getDisplayedNumber(remainingCount);
			const counterText = `+${displayedNumber}`;
			const numberNode = ui_system_typography.Text.render(counterText, {
				size: '3xs',
				accent: true,
				tag: 'span',
				className: counterClassName
			});
			main_core.Dom.append(numberNode, counterWrapper);
			main_core.Event.bind(counterWrapper, 'click', event => {
				event.stopPropagation();
				this.#toggleChatsListPopup(chats, counterWrapper);
			});
			this.#makeButtonAccessible(counterWrapper, main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_USED_BY_SHOW_ALL_CHATS'));
			return counterWrapper;
		}
		#toggleChatsListPopup(chats, counterNode) {
			if (this.#chatsPopup && this.#chatsPopup.isShown()) {
				this.#chatsPopup.close();
			} else {
				this.#openChatsListPopup(chats, counterNode);
			}
		}
		#openChatsListPopup(chats, bindElement) {
			const contentNode = main_core.Tag.render`<div class="agent-grid-chats-list-wrapper"></div>`;
			this.#fillChatsListContent(chats, contentNode);
			this.#chatsPopup = new main_popup.Popup({
				content: contentNode,
				bindElement,
				cacheable: false,
				minHeight: 50,
				maxWidth: 400,
				maxHeight: 200,
				padding: 0,
				autoHide: true,
				closeByEsc: true,
				className: 'agents-grid-popup'
			});
			this.#chatsPopup.show();
			this.#chatsPopup.subscribe('onClose', () => {
				this.#chatsPopup = null;
			});
		}
		#fillChatsListContent(chats, contentNode) {
			if (!chats || chats.length === 0) {
				return contentNode;
			}
			chats.forEach(chat => {
				const shouldAddHover = true;
				const chatNode = this.#getChatNode(chat, shouldAddHover);
				main_core.Dom.append(chatNode, contentNode);
			});
			return contentNode;
		}
		openChat(chatId) {
			if (!chatId) {
				return;
			}
			im_public.Messenger.openChat(chatId);
		}
		#openCombinedPopup(departments, users, bindElement) {
			const items = [];
			this.#fillDepartmentsListContent(departments, items);
			this.#fillUsersListContent(users, items);
			const entities = [{
				id: UsedByField.ENTITY_USER,
				dynamicLoad: false
			}, {
				id: UsedByField.ENTITY_DEPARTMENT,
				dynamicLoad: false
			}];
			const dialog = new ui_entitySelector.Dialog({
				targetNode: bindElement,
				width: 306,
				height: 309,
				dropdownMode: true,
				showAvatars: true,
				autoHide: true,
				multiple: false,
				hideOnSelect: false,
				focusOnFirst: false,
				showDefaultFooter: false,
				searchTabOptions: {
					visible: false
				},
				recentTabOptions: {
					visible: false
				},
				events: {
					'Item:onBeforeSelect': this.#handleBeforeSelect.bind(this)
				},
				entities,
				items
			});
			dialog.show();
		}
		#fillDepartmentsListContent(departments, items) {
			if (!departments || Object.keys(departments).length === 0) {
				return items;
			}
			Object.entries(departments).forEach(([id, name]) => {
				items.push({
					id: main_core.Text.toInteger(id),
					title: name,
					entityId: UsedByField.ENTITY_DEPARTMENT,
					tabs: 'recents'
				});
			});
			return items;
		}
		#fillUsersListContent(users, items) {
			if (!users || users.length === 0) {
				return items;
			}
			users.forEach(user => {
				const itemOptions = {
					id: user.id,
					title: user.fullName,
					entityId: UsedByField.ENTITY_USER,
					tabs: 'recents',
					avatarOptions: {
						bgSize: 'cover'
					}
				};
				if (user?.photoUrl) {
					itemOptions.avatar = decodeURIComponent(user.photoUrl);
				}
				if (user?.profileLink) {
					itemOptions.link = user.profileLink;
				}
				items.push(itemOptions);
			});
			return items;
		}
		#openUserProfile(profileLink) {
			if (main_core.Type.isStringFilled(profileLink)) {
				main_sidepanel.SidePanel.Instance.open(profileLink);
			}
		}
		#handleBeforeSelect(event) {
			const item = event.getData().item;
			event.preventDefault();
			if (item.getEntityId() === UsedByField.ENTITY_DEPARTMENT) {
				this.#handleSelectDepartment(item);
				return;
			}
			if (item.getEntityId() === UsedByField.ENTITY_USER) {
				this.#handleSelectUser(item);
			}
		}
		#handleSelectDepartment(item) {
			humanresources_companyStructure_public.Structure?.open({
				focusNodeId: item.id
			});
		}
		#handleSelectUser(item) {
			this.#openUserProfile(item?.link);
		}
	}

	class FullNameField extends BaseField {
		render(params) {
			const user = params?.user ?? {};
			const fullName = user.fullName ?? main_core.Loc.getMessage('BIZPROC_AI_AGENTS_LAUNCHED_BY_PLACEHOLDER');
			const profileLink = user.profileLink ?? null;
			const userId = user.id ?? null;
			const fullNameElement = this.#createFullNameElement(fullName, userId, profileLink);
			const container = main_core.Tag.render`
			<div class="agent-grid_full-name-container">${fullNameElement}</div>
		`;
			this.appendToFieldNode(container);
		}
		#createFullNameElement(fullName, userId, profileLink) {
			const typographyOptions = {
				size: 'xs',
				accent: false,
				tag: 'span',
				className: 'agent-grid_full-name-label'
			};
			const nameNode = ui_system_typography.Text.render(fullName, typographyOptions);
			main_core.Dom.attr(nameNode, USER_MINI_PROFILE_ATTRIBUTES.USER_ID, userId);
			main_core.Dom.attr(nameNode, USER_MINI_PROFILE_ATTRIBUTES.CONTEXT, USER_MINI_PROFILE_CONTEXT.B24);
			if (!profileLink) {
				main_core.Dom.addClass(nameNode, 'agent-grid_full-name-label-placeholder');
				return nameNode;
			}
			return main_core.Tag.render`
			<a href="${profileLink}" class="agent-grid_full-name-link">
				${nameNode}
			</a>
		`;
		}
	}

	class EmployeeField extends BaseField {
		render(params) {
			const photoFieldId = main_core.Text.getRandom(6);
			const fullNameFieldId = main_core.Text.getRandom(6);
			this.appendToFieldNode(main_core.Tag.render`<span id="${photoFieldId}"></span>`);
			this.appendToFieldNode(main_core.Tag.render`<span class="agent-grid_full-name-wrapper" id="${fullNameFieldId}"></span>`);
			new PhotoField({
				fieldId: photoFieldId
			}).render(params);
			new FullNameField({
				fieldId: fullNameFieldId
			}).render(params);
			main_core.Dom.addClass(this.getFieldNode(), 'agent-grid_employee-card-container');
			main_core.Dom.attr(this.getFieldNode(), 'data-test-id', 'bizproc-ai-agents-grid-started-by-employee-card');
		}
	}

	const DIALOG_EXTENSION = 'ui.system.dialog';
	const DIALOG_WIDTH = 480;
	const DIALOG_CONTAINER_SELECTOR = '.ui-system-dialog';
	const DIALOG_CLOSE_BUTTON_SELECTOR = '.ui-system-dialog__header-close-btn';
	const TEST_ID = {
		DIALOG: 'bizproc-ai-agents-grid-existing-runs-warning-dialog',
		CONTENT: 'bizproc-ai-agents-grid-existing-runs-warning',
		CLOSE: 'bizproc-ai-agents-grid-existing-runs-warning-close',
		VIEW: 'bizproc-ai-agents-grid-existing-runs-warning-view',
		LAUNCH: 'bizproc-ai-agents-grid-existing-runs-warning-launch'
	};

	// Above the loader's own recovery budget (three retries with 1 + 3 + 5 s backoff) so a slow load
	// that would still succeed is never cut short - the single show of the warning is already paid for
	// on the server. Bounded all the same: a load that never settles would otherwise hold the
	// page-level launch guard until a reload.
	const DIALOG_LOAD_TIMEOUT = 20000;

	// ui.system.dialog is loaded on demand: the warning is shown at most once per user, so its
	// classes are described locally instead of being imported (a static import would put the
	// extension back into the grid dependencies).

	/**
	 * No promise cache around the loader: it deduplicates parallel loads by itself, while a cached
	 * rejection would make the single show of the warning unrecoverable - the right to show it is
	 * already spent on the server by the time the dialog is loaded.
	 *
	 * The wait is bounded because the loader can leave its promise unsettled forever (a failed assets
	 * batch rejects outside the promise chain), and an unsettled load never releases the caller's
	 * finally. Only the load is bounded: the shown dialog waits for the user for as long as it takes.
	 */
	const loadDialogClass = async () => {
		const {
			Dialog
		} = await withTimeout(main_core.Runtime.loadExtension(DIALOG_EXTENSION), DIALOG_LOAD_TIMEOUT);
		if (!main_core.Type.isFunction(Dialog)) {
			throw new Error(`${DIALOG_EXTENSION} is loaded but exports no Dialog`);
		}
		return Dialog;
	};
	const renderContent = () => {
		const message = ui_system_typography.Text.render(main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_EXISTING_RUNS_WARNING_TEXT'), {
			size: 'md',
			tag: 'div'
		});
		const content = main_core.Tag.render`<div class="bizproc-ai-agents__existing-runs-warning">${message}</div>`;
		main_core.Dom.attr(content, 'data-test-id', TEST_ID.CONTENT);
		return content;
	};
	const createButton = (phraseCode, style, testId, onclick) => {
		const button = new ui_buttons.Button({
			text: main_core.Loc.getMessage(phraseCode),
			size: ui_buttons.ButtonSize.LARGE,
			style,
			useAirDesign: true,
			onclick
		});
		main_core.Dom.attr(button.getContainer(), 'data-test-id', testId);
		return button;
	};

	/**
	 * ui.system.dialog renders its cross as an icon-only button without an accessible name, and the
	 * title makes that cross the first stop of the dialog's Tab order - so it is named here, with the
	 * shared close phrase of ui.buttons. An existing name is left alone: naming the cross belongs to the
	 * component, and once it does so its own label must win.
	 *
	 * The cross comes from the component too, so its test marker is set from here as well - it is the
	 * only cancel control of the layout an e2e test can click.
	 */
	const prepareCloseButton = container => {
		const closeButton = container.querySelector(DIALOG_CLOSE_BUTTON_SELECTOR);
		if (!closeButton) {
			return;
		}
		main_core.Dom.attr(closeButton, 'data-test-id', TEST_ID.CLOSE);
		if (main_core.Type.isStringFilled(main_core.Dom.attr(closeButton, 'aria-label'))) {
			return;
		}
		main_core.Dom.attr(closeButton, 'aria-label', main_core.Loc.getMessage('UI_BUTTONS_CLOSE_BTN_TEXT'));
	};

	/**
	 * ui.system.dialog builds its popup options internally and gives no way to enable focus
	 * retention from outside, and a dialog without an overlay is not modal by default - so the trap
	 * is attached to the rendered popup container instead of relying on the portal accessibility
	 * setting.
	 */
	const trapFocus = container => {
		const focusTrap = new ui_a11y.FocusTrap(container, {
			initialFocus: 'first-tabbable',
			restoreFocus: true
		});
		focusTrap.activate();
		return focusTrap;
	};

	/**
	 * One-off warning about agents already running from the same system template. Resolves with the
	 * chosen outcome; closing the dialog by the cross, Esc or a click outside cancels the launch.
	 *
	 * Rejects when the dialog cannot be loaded or rendered - the caller falls back to the standard
	 * launch, so the failure must not be swallowed here.
	 */
	const showExistingRunsWarning = async () => {
		const Dialog = await loadDialogClass();
		const content = renderContent();
		const title = main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_EXISTING_RUNS_WARNING_TITLE');
		return new Promise(resolve => {
			let outcome = EXISTING_RUNS_WARNING_OUTCOME.CANCELLED;
			let focusTrap = null;
			let dialog = null;
			const chooseOutcome = chosen => {
				outcome = chosen;
				dialog.hide();
			};
			dialog = new Dialog({
				// The header carries the cross of the layout: ui.system.dialog hides the whole header
				// while its left part is empty, so without a title the dialog has no close control at all.
				title,
				content,
				centerButtons: [createButton('BIZPROC_AI_AGENTS_GRID_EXISTING_RUNS_WARNING_BUTTON_VIEW', ui_buttons.AirButtonStyle.FILLED, TEST_ID.VIEW, () => chooseOutcome(EXISTING_RUNS_WARNING_OUTCOME.VIEW_LAUNCHED)), createButton('BIZPROC_AI_AGENTS_GRID_EXISTING_RUNS_WARNING_BUTTON_LAUNCH', ui_buttons.AirButtonStyle.OUTLINE, TEST_ID.LAUNCH, () => chooseOutcome(EXISTING_RUNS_WARNING_OUTCOME.LAUNCH_NEW))],
				width: DIALOG_WIDTH,
				events: {
					onAfterShow: () => {
						const container = content.closest(DIALOG_CONTAINER_SELECTOR);
						if (!container) {
							return;
						}

						// ui.system.dialog renders the title as a heading inside the popup but leaves the
						// role=dialog container itself unnamed, so the name is set here.
						main_core.Dom.attr(container, 'aria-label', title);
						main_core.Dom.attr(container, 'data-test-id', TEST_ID.DIALOG);
						prepareCloseButton(container);
						focusTrap = trapFocus(container);
					},
					onHide: () => {
						// The outcome is resolved first: a throw while tearing the trap down would otherwise
						// leave the promise unsettled forever, and with it the page-level launch guard.
						resolve(outcome);
						focusTrap?.destroy();
					}
				}
			});
			dialog.show();
		});
	};

	// Template ids whose launch is currently in flight. A fresh field instance is created per grid
	// render, so the guard against a duplicate launch of the same template lives outside the instance.
	const launchesInFlight = new Set();

	// One warning cycle per page, not per template: while the warning is open, a click on another
	// template would get showWarning: false (the right is already spent) and would launch an agent
	// from under the open dialog.
	//
	// The guard holds the cycle that owns it and not just a flag: a cycle may release the guard before it
	// ends, so two cycles can overlap, and then a finished one must not release a guard that is now held
	// by a cycle whose warning is still open.
	let warningCycleOwner = null;

	// A click dropped by the cycle guard reuses one balloon instead of stacking a new one per click:
	// the notification center replaces a balloon with the same id.
	const WARNING_CYCLE_NOTIFICATION_ID = 'bizproc-ai-agents-existing-runs-warning-cycle';
	const releaseWarningCycle = cycleToken => {
		if (warningCycleOwner === cycleToken) {
			warningCycleOwner = null;
		}
	};
	class LaunchControlField extends BaseField {
		render(params) {
			if (params.ragFilesStatuses && params.ragFilesStatuses.status) {
				this.#renderLaunchedRagFilesStatuses(params.ragFilesStatuses);
			} else if (main_core.Type.isNumber(params.launchedAt) && params.launchedAt > 0) {
				this.#renderLaunchedDate(params.launchedAt);
			} else if (main_core.Type.isNumber(params.agentId)) {
				this.#renderLaunchButton(params);
			}
		}
		#renderLaunchButton(params) {
			const button = new ui_buttons.Button({
				text: main_core.Loc.getMessage('BIZPROC_AI_AGENTS_BUTTON_LAUNCH'),
				size: ui_buttons.ButtonSize.SMALL,
				tag: ui_buttons.Button.Tag.DIV,
				useAirDesign: true,
				onclick: async buttonInstance => {
					await this.#handleLaunchButtonClick(params.agentId, buttonInstance);
				}
			});
			main_core.Dom.attr(button.getContainer(), 'data-test-id', 'bizproc-ai-agents-grid-action-start-button');

			// ui.buttons DIV tag gives tabindex but no role/keyboard handler: add button semantics and Enter/Space activation.
			// A DIV does not convert Enter/Space to click, so click() runs the existing onclick path exactly once.
			const container = button.getContainer();
			main_core.Dom.attr(container, 'role', 'button');
			main_core.Event.bind(container, 'keydown', event => {
				if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
					if (event.repeat || button.isWaiting()) {
						return;
					}
					event.preventDefault();
					container.click();
				}
			});
			this.appendToFieldNode(button.render());
		}

		/**
		 * Pre-flight step between the click and the launch (ALG-03). A decision of "do not show"
		 * keeps the scenario exactly as it was; a warning is shown instead of an immediate launch, and
		 * the agent is created only by the "launch new" action.
		 *
		 * Fail-open into the launch covers exactly the two steps it is meant for - the pre-flight check
		 * and getting an outcome out of the dialog. What the chosen outcome leads to stays outside it:
		 * after "view launched" a failure must not create the agent the user has just declined.
		 *
		 * Waiting and both guards are released in the finally - the warning guard only while this cycle
		 * still owns it: without the finally an exception would leave the button dead until the page is
		 * reloaded.
		 */
		async #handleLaunchButtonClick(templateId, buttonInstance) {
			// A repeated click on the same row is answered by that row's own waiting state, so it is
			// dropped in silence.
			if (launchesInFlight.has(templateId)) {
				return;
			}
			if (warningCycleOwner !== null) {
				// The cycle owns the whole page while it checks and while its warning is open, and neither
				// of those states is visible on the button of another row: a silent drop would read as a
				// broken button.
				BX.UI.Notification.Center.notify({
					id: WARNING_CYCLE_NOTIFICATION_ID,
					content: main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_LAUNCH_BUSY_NOTIFICATION')
				});
				return;
			}
			const gridManager = this.getGridManager();
			if (!gridManager?.validateAiAgentsAvailableByTariff()) {
				return;
			}
			const cycleToken = Symbol('existingRunsWarningCycle');
			launchesInFlight.add(templateId);
			buttonInstance.setWaiting(true);
			try {
				if (gridManager.isExistingRunsWarningSpent()) {
					await this.#runStandardLaunch(templateId);
					return;
				}
				warningCycleOwner = cycleToken;
				const decision = await this.#resolveExistingRunsDecision(templateId);
				if (!decision?.showWarning) {
					// Either nothing is to be shown or the check failed before anything was shown: the
					// click keeps its original meaning. No warning appears in this cycle either way, so
					// the page stops blocking the other templates for the whole launch.
					releaseWarningCycle(cycleToken);
					await this.#runStandardLaunch(templateId);
					return;
				}

				// The server has spent the right to show the warning; remember it locally so this page
				// stops asking.
				gridManager.markExistingRunsWarningSpent();
				buttonInstance.setWaiting(false);
				const outcome = await this.#resolveWarningOutcome();
				if (outcome === null) {
					// Loading or rendering the warning failed: the right to show it is already spent, but
					// the user must not be left with a dead button.
					await this.#runStandardLaunch(templateId);
					return;
				}
				if (outcome === EXISTING_RUNS_WARNING_OUTCOME.VIEW_LAUNCHED) {
					await this.#showLaunchedAgents(gridManager, decision.systemCode);
				} else if (outcome === EXISTING_RUNS_WARNING_OUTCOME.LAUNCH_NEW) {
					await this.#runStandardLaunch(templateId);
				}
			} finally {
				buttonInstance.setWaiting(false);
				launchesInFlight.delete(templateId);
				releaseWarningCycle(cycleToken);
			}
		}

		/**
		 * A failed check reports "no decision" and not an error: nothing has been shown to the user yet,
		 * so the caller treats it exactly like a decision of "do not show".
		 */
		async #resolveExistingRunsDecision(templateId) {
			try {
				return await gridApi.checkExistingRuns(templateId);
			} catch {
				return null;
			}
		}

		/**
		 * Null means the warning could not be loaded or rendered, which is the only failure the caller is
		 * allowed to answer with the launch. Every value the user can choose - including a cancel - is a
		 * decision and is returned as such.
		 */
		async #resolveWarningOutcome() {
			try {
				return await showExistingRunsWarning();
			} catch {
				return null;
			}
		}

		/**
		 * The transition the user chose instead of the launch, and therefore a step that never throws
		 * outwards: the only fallback the caller has is the launch itself, and running it here would
		 * create the very agent the user has just declined.
		 */
		async #showLaunchedAgents(gridManager, systemCode) {
			let isApplied = false;
			try {
				isApplied = await gridManager.applyLaunchedAgentsFilter(systemCode);
			} catch {
				// The transition the user asked for did not happen, and the right to show the warning is
				// spent on the server, so this transition can never be reached again: silence here would
				// leave the click without any answer. The pre-flight check stays silent for the opposite
				// reason - the user asked for nothing there.
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DEFAULT_ACTION_ERROR')
				});
				return;
			}

			// The hint is asked for only after a confirmed apply: otherwise it would bind to a container
			// the filter is repainting. Onboarding is optional, hence the guarded call.
			if (!isApplied) {
				return;
			}
			try {
				gridManager.requestFilterHint?.();
			} catch {
				// The filter is applied and the transition is done - a missing onboarding hint is nothing
				// to report to the user.
			}
		}
		async #runStandardLaunch(templateId) {
			const grid = this.getGridManager()?.getGrid();
			grid?.tableFade();
			try {
				const result = await gridApi.copyAndStartTemplate(templateId);
				if (!result) {
					return;
				}
				const newRowFields = RowHelper.prepareNewRowParams(result?.columns, result?.actions);
				new RowHelper(grid).addToGrid(newRowFields);
				const setupTemplate = result?.setupTemplateData;
				if (setupTemplate && main_core.Type.isObjectLike(setupTemplate)) {
					bizproc_setupTemplate.SetupTemplate.showSidePanel(setupTemplate);
				}
			} catch (error) {
				const message = error?.errors?.[0]?.message ?? main_core.Loc.getMessage('BIZPROC_AI_AGENTS_BUTTON_LAUNCH_ERROR');
				BX.UI.Notification.Center.notify({
					content: message
				});
			} finally {
				grid?.tableUnfade();
			}
		}
		#renderLaunchedDate(timestamp) {
			const formattedDate = main_date.DateTimeFormat.format('j F, G:i', timestamp);
			const dateNode = ui_system_typography.Text.render(formattedDate, {
				size: 'xs',
				tag: 'div',
				className: 'launch-control-field-date'
			});
			main_core.Dom.attr(dateNode, 'data-test-id', 'bizproc-ai-agents-grid-started-at');
			this.appendToFieldNode(dateNode);
		}
		#renderLaunchedRagFilesStatuses(ragFilesStatuses) {
			if (!ragFilesStatuses || !ragFilesStatuses.status) {
				return;
			}
			const statusNode = ui_system_typography.Text.render(main_core.Text.encode(ragFilesStatuses.statusMessage), {
				size: 'xs',
				tag: 'span',
				className: 'launch-control-field-rag-files-status'
			});
			const container = main_core.Tag.render`<div class="ui-icon-set__scope launch-control-field-rag-files-statuses ${main_core.Text.encode(ragFilesStatuses.iconClass)}"></div>`;
			main_core.Dom.append(main_core.Tag.render`<span class="main-grid-rag-status-icon"></span>`, container);
			main_core.Dom.append(statusNode, container);
			if (ragFilesStatuses.descriptionMessage) {
				const fileDesc = ragFilesStatuses.files.map(function (file) {
					return `<div style="display: flex; align-items: center; justify-content: space-between;">` + `<div style="text-overflow: ellipsis;overflow: hidden;white-space: nowrap;" title="${main_core.Text.encode(file.fileName)}">` + main_core.Text.encode(file.fileName) + `</div>` + `<i class="ui-icon-set ${main_core.Text.encode(file.iconClass)}" title="${main_core.Text.encode(file.statusMessage)}" style="fill:white; background-color:white"></i>` + `</div>`;
				}).join('');
				const statusHintNode = document.createElement('span');
				main_core.Dom.attr(statusHintNode, 'class', 'launch-control-field-rag-files-hint');
				statusHintNode.dataset.hintHtml = true;
				statusHintNode.dataset.hintInteractivity = true;
				statusHintNode.dataset.hint = `<div class=" --ui-context-content-light">` + `<h4>${main_core.Text.encode(ragFilesStatuses.statusMessage)}</h4>` + `<div>${fileDesc}</div>` + `<br><hr><br>` + `<div>${main_core.Text.encode(ragFilesStatuses.descriptionMessage)}</div>` + `</div>`;
				main_core.Dom.append(statusHintNode, container);
			}
			this.appendToFieldNode(container);
			BX.UI.Hint.init(this.getFieldNode());
		}
	}

	class LoadIndicatorField extends BaseField {
		render(params) {
			const percentage = Number.isFinite(params?.percentage) ? params.percentage : 0;
			const showPercentage = percentage > 0;
			let percentageNode = null;
			const percentPerBar = 20;
			const activeBarsCount = Math.ceil(percentage / percentPerBar);
			const svgNode = main_core.Tag.render`<div>${GridIcons.LOAD}</div>`;
			const bars = svgNode.querySelectorAll('.agent-grid-load-bar');
			bars.forEach((bar, index) => {
				const currentBarIndex = index + 1;
				if (currentBarIndex <= activeBarsCount && percentage > 0) {
					main_core.Dom.addClass(bar, '--active');
				}
				main_core.Dom.style(bar, '--level', currentBarIndex);
			});
			if (showPercentage) {
				const percentageNodeText = `${percentage}%`;
				percentageNode = ui_system_typography.Text.render(percentageNodeText, {
					size: 'xs',
					accent: false,
					tag: 'div',
					className: 'agent-grid-load-percentage'
				});
			}
			const container = main_core.Tag.render`
			<div class="agent-grid-load-indicator">
				${percentageNode ?? ''}
				<div
				class="agent-grid-load-container"
				>
				${svgNode}
				</div>
			</div>
		`;
			this.appendToFieldNode(container);
		}
	}

	exports.AgentInfoField = AgentInfoField;
	exports.BaseField = BaseField;
	exports.EmployeeField = EmployeeField;
	exports.GridManager = GridManager;
	exports.LaunchControlField = LaunchControlField;
	exports.LoadIndicatorField = LoadIndicatorField;
	exports.UsedByField = UsedByField;

})(this.BX.Bizproc.Ai.Agents = this.BX.Bizproc.Ai.Agents || {}, BX, BX.Event, BX.UI.Accessibility, BX.UI.Dialogs, BX.UI, BX.Bizproc, BX.UI.Notification, BX.UI.System.Typography, BX.Main, BX.SidePanel, BX.UI.EntitySelector, BX.Messenger.v2.Lib, BX.Humanresources.CompanyStructure, BX.UI, BX.Main, BX.UI);
//# sourceMappingURL=grid.bundle.js.map
