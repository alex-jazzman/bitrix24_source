/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Ai = this.BX.Bizproc.Ai || {};
(function (exports, main_core, main_core_events, ui_dialogs_messagebox, ui_infoHelper, bizproc_setupTemplate, ui_system_typography, main_popup, main_sidepanel, ui_entitySelector, im_public, humanresources_companyStructure_public, ui_avatar, main_date, ui_buttons) {
	'use strict';

	const AJAX_REQUEST_TYPE = {
		COMPONENT: 'component',
		CONTROLLER: 'controller'
	};
	const ACTION_TYPE = {
		DELETE: 'delete',
		GROUP_DELETE: 'group-delete',
		EDIT: 'edit',
		RESTART: 'restart'
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
		RESTART: 'Integration.AiAgent.Template.start'
	};

	const ErrorCode = {
		TARIFF_LIMIT: 'AI_AGENTS_UNAVAILABLE_BY_TARIFF'
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

	class RestartAction extends BaseAction {
		static getActionId() {
			return ACTION_TYPE.RESTART;
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

	const actionMap = new Map([[EditAction.getActionId(), EditAction], [DeleteAction.getActionId(), DeleteAction], [RestartAction.getActionId(), RestartAction]]);
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
		}
	};

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
		highlight(row) {
			if (!row) {
				return;
			}
			main_core.Dom.addClass(row.getNode(), 'ai-agents-grid-row-highlighted');
			setTimeout(() => {
				main_core.Dom.removeClass(row, 'ai-agents-grid-row-highlighted');
			}, 2500);
		}
	}

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

	const SCENARIO_CREATE_SOURCE = 'SCENARIO';
	class GridManager {
		static instances = [];
		#settings = null;
		#grid;
		constructor(gridId) {
			this.#grid = BX.Main.gridManager.getById(gridId)?.instance;
			this.#settings = main_core.Extension.getSettings('bizproc.ai-agents.grid');
			this.#subscribeToEvents();
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
		<svg class="agent-grid-load-icon" width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
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
		<svg class="agent-grid-chat-icon-img" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
			d="M10.1064 3.64648C11.349 3.64655 12.3564 4.65388 12.3564 5.89648V6.49707H13.0693C14.229 6.49707 15.1697 7.43706 15.1699 8.59668V11.3604C15.1699 12.1141 14.7723 12.7751 14.1758 13.1455V13.7129C14.1756 14.6424 13.0518 15.1075 12.3945 14.4502L11.4043 13.4609H8.83984C7.6802 13.4608 6.74023 12.52 6.74023 11.3604V8.59668C6.74045 7.43718 7.68033 6.49726 8.83984 6.49707H11.3066V5.89648C11.3066 5.23378 10.7691 4.69635 10.1064 4.69629H5.08008C4.41751 4.69649 3.88086 5.23386 3.88086 5.89648V8.82227C3.8809 9.26438 4.11903 9.65203 4.47949 9.86133L5.00293 10.165V11.6611L5.89355 10.7715V11.3203C5.89355 11.5894 5.96379 11.8422 6.08789 12.0605L5.73438 12.415C5.07702 13.0724 3.95312 12.6064 3.95312 11.6768V10.7695C3.28205 10.3802 2.83012 9.65397 2.83008 8.82227V5.89648C2.83008 4.65397 3.83761 3.64668 5.08008 3.64648H10.1064ZM8.83984 7.54688C8.26023 7.54706 7.79025 8.01707 7.79004 8.59668V11.3604C7.79004 11.9401 8.2601 12.41 8.83984 12.4102H11.8389L13.126 13.6973V12.5615L13.6221 12.2539C13.923 12.067 14.1191 11.7361 14.1191 11.3604V8.59668C14.1189 8.01696 13.6491 7.54688 13.0693 7.54688H8.83984Z"
			fill="#525C69"/>
		</svg>
	`;
		static DEPARTMENT = `
			<svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
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
			const counterWrapperClass = '';
			const withPlusPrefix = false;
			const counterNode = this.#createCounterNode(departmentsCount, departments, users, counterClass, counterWrapperClass, withPlusPrefix, withOpenPopupEvent);
			if (counterNode) {
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
					main_core.Dom.append(counterNode, departmentNode);
				}
			}
			main_core.Dom.append(departmentNode, container);
		}
		#getDepartmentNode(department, nodeId, shouldAddHover = false) {
			const departmentWrapper = main_core.Tag.render`
			<div class="${shouldAddHover ? 'agent-grid-department-in-list' : 'agent-grid-department'}"></div>
		`;
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
			return departmentWrapper;
		}
		#getDisplayedNumber(remainingCount) {
			return remainingCount > UsedByField.MAX_COUNTER_VALUE ? UsedByField.MAX_COUNTER_VALUE : remainingCount;
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
				main_core.Dom.append(counterNode, chatNode);
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
				<a href="#" class="agent-grid-chat-link">
					${chatNameNode}
				</a>
			</div>
		`;
			main_core.Event.bind(chatContainer, 'click', event => {
				event.preventDefault();
				this.openChat(chat.chatId);
			});
			return chatContainer;
		}
		#getChatsCounterNode(remainingCount, chats) {
			const counterWrapper = main_core.Tag.render`<div class="ai-agents-chats-counter-wrapper"></div>`;
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
				onclick: async (buttonInstance, event) => {
					await this.#handleLaunchButtonClick(params.agentId, buttonInstance, event);
				}
			});
			main_core.Dom.attr(button.getContainer(), 'data-test-id', 'bizproc-ai-agents-grid-action-start-button');
			this.appendToFieldNode(button.render());
		}
		async #handleLaunchButtonClick(agentId, buttonInstance, event) {
			buttonInstance.setWaiting(true);
			const gridManager = this.getGridManager();
			if (!gridManager?.validateAiAgentsAvailableByTariff()) {
				buttonInstance.setWaiting(false);
				return;
			}
			const grid = gridManager.getGrid();
			grid?.tableFade();
			try {
				const result = await gridApi.copyAndStartTemplate(agentId);
				if (!result) {
					buttonInstance.setWaiting(false);
					grid?.tableUnfade();
					return;
				}
				buttonInstance.setWaiting(false);
				const columns = result?.columns;
				const actions = result?.actions;
				const newRowFields = RowHelper.prepareNewRowParams(columns, actions);
				grid?.tableUnfade();
				new RowHelper(grid).addToGrid(newRowFields);
				const setupTemplate = result?.setupTemplateData;
				if (setupTemplate && main_core.Type.isObjectLike(setupTemplate)) {
					bizproc_setupTemplate.SetupTemplate.showSidePanel(setupTemplate);
				}
			} catch (error) {
				buttonInstance.setWaiting(false);
				let message = error?.errors?.[0]?.message;
				if (!message) {
					message = main_core.Loc.getMessage('BIZPROC_AI_AGENTS_BUTTON_LAUNCH_ERROR');
				}
				grid?.tableUnfade();
				BX.UI.Notification.Center.notify({
					content: message
				});
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

})(this.BX.Bizproc.Ai.Agents = this.BX.Bizproc.Ai.Agents || {}, BX, BX.Event, BX.UI.Dialogs, BX.UI, BX.Bizproc, BX.UI.System.Typography, BX.Main, BX.SidePanel, BX.UI.EntitySelector, BX.Messenger.v2.Lib, BX.Humanresources.CompanyStructure, BX.UI, BX.Main, BX.UI);
//# sourceMappingURL=grid.bundle.js.map
