/* eslint-disable */
this.BX = this.BX || {};
this.BX.CRM = this.BX.CRM || {};
(function (exports, crm_kanban_restriction, crm_toolbarComponent, main_core, main_kanban, main_popup, ui_designTokens, ui_fonts_opensans, ls, ui_entitySelector, ui_tour, ui_notification, crm_integration_analytics, pull_queuemanager, crm_autorun, ui_analytics, main_date, crm_activity_addingPopup, crm_badge, main_loader, main_sidepanel, ui_system_label, ui_hint, crm_activity_planner, currency_currencyCore, ui_buttons, crm_kanban_sort) {
	'use strict';

	const NAMESPACE$3 = main_core.Reflection.namespace('BX.CRM.Kanban.Actions');
	class SimpleAction {
		#grid;
		#params;
		#isShowNotify = true;
		#isApplyFilterAfterAction = false;
		#useIgnorePostfixForCode = false;
		#analyticsData = null;
		constructor(grid, params) {
			this.#grid = grid;
			this.#params = params;
		}
		showNotify(value = true) {
			this.#isShowNotify = value;
			return this;
		}
		applyFilterAfterAction(value = false) {
			this.#isApplyFilterAfterAction = value;
			return this;
		}
		setIgnorePostfixForCode(value = true) {
			this.#useIgnorePostfixForCode = value;
			return this;
		}
		execute() {
			this.#prepareExecute();
			if (this.#params.action === 'status') {
				this.#prepareAnalyticsChangeStageEventData();
			}
			return new Promise((resolve, reject) => {
				this.#grid.ajax(this.#params, data => this.#onSuccess(data, resolve), error => this.#onFailure(error, reject));
			});
		}
		#prepareExecute() {
			if (this.#grid.isMultiSelectMode()) {
				this.#grid.resetMultiSelectMode();
			}
			if (!main_core.Type.isStringFilled(this.#params.eventId) && pull_queuemanager.QueueManager) {
				// eslint-disable-next-line no-param-reassign
				this.#params.eventId = pull_queuemanager.QueueManager.registerRandomEventId();
			}
		}
		#onSuccess(data, resolve) {
			if (!data || data.error) {
				this.#sendAnalyticsData(crm_integration_analytics.Dictionary.STATUS_ERROR);
				this.#handleErrorOnSimpleAction(data, resolve);
			} else {
				this.#sendAnalyticsData(crm_integration_analytics.Dictionary.STATUS_SUCCESS);
				this.#handleSuccessOnSimpleAction(data, resolve);
			}
			this.#analyticsData = null;
		}
		#handleErrorOnSimpleAction(data, callback) {
			const grid = this.#grid;
			const gridData = grid.getData();
			const params = this.#params;
			if (params.action === 'status') {
				grid.stopActionPanel();
				grid.onApplyFilter();
				if (grid.getTypeInfoParam('showPersonalSetStatusNotCompletedText')) {
					let messageCode = gridData.isDynamicEntity ? 'CRM_KANBAN_SET_STATUS_NOT_COMPLETED_TEXT_DYNAMIC_MSGVER_1' : null;
					if (!messageCode) {
						const codeVer = `CRM_KANBAN_SET_STATUS_NOT_COMPLETED_TEXT_${gridData.entityType}`;
						const codeVer1 = `${codeVer}_MSGVER_1`;
						const codeVer2 = `${codeVer}_MSGVER_2`;
						messageCode = BX.Loc.hasMessage(codeVer2) ? codeVer2 : codeVer1;
					}
					BX.Kanban.Utils.showErrorDialog(main_core.Loc.getMessage(messageCode));
					callback(new Error(main_core.Loc.getMessage(messageCode)));
				} else {
					BX.Kanban.Utils.showErrorDialog(data.error, data.fatal);
					callback(new Error(data.error));
				}
			} else {
				BX.Kanban.Utils.showErrorDialog(data.error, data.fatal);
				callback(new Error(data.error));
			}
		}
		#handleSuccessOnSimpleAction(data, callback) {
			const grid = this.#grid;
			const params = this.#params;
			if (this.#isApplyFilterAfterAction) {
				grid.onApplyFilter();
			}
			grid.stopActionPanel();
			if (this.#isShowNotify) {
				let code = grid.getData().entityType;
				if (code.startsWith('DYNAMIC')) {
					code = 'DYNAMIC';
				}

				// @todo replace to useIgnorePostfixForCode check later
				if (params.action === 'delete' && params.ignore === 'Y') {
					code = `${code}_IGNORE`;
				} else {
					code = `${code}_${params.action.toUpperCase()}`;
				}
				this.#notify(code);
			}
			callback(data);
		}
		#notify(code) {
			// eslint-disable-next-line no-param-reassign
			code = this.#getPreparedNotifyCode(code);
			const content = this.#getPreparedNotifyContent(code);
			if (main_core.Type.isStringFilled(content)) {
				ui_notification.UI.Notification.Center.notify({
					content
				});
			}
		}
		#getPreparedNotifyCode(code) {
			if (code === 'DEAL_CHANGECATEGORY') {
				// eslint-disable-next-line no-param-reassign
				code = 'DEAL_CHANGECATEGORY_LINK2';
			} else if (code === 'DYNAMIC_CHANGECATEGORY') {
				// eslint-disable-next-line no-param-reassign
				code = 'DYNAMIC_CHANGECATEGORY_LINK2';
			}

			// eslint-disable-next-line no-param-reassign
			code = `CRM_KANBAN_NOTIFY_${code}`;
			const msgVer1Codes = ['CRM_KANBAN_NOTIFY_LEAD_STATUS', 'CRM_KANBAN_NOTIFY_DYNAMIC_STATUS', 'CRM_KANBAN_NOTIFY_INVOICE_STATUS', 'CRM_KANBAN_NOTIFY_QUOTE_DELETE', 'CRM_KANBAN_NOTIFY_QUOTE_SETASSIGNED'];
			if (msgVer1Codes.includes(code)) {
				// eslint-disable-next-line no-param-reassign
				code = `${code}_MSGVER_1`;
			}
			const msgVer2Codes = ['CRM_KANBAN_NOTIFY_QUOTE_STATUS'];
			if (msgVer2Codes.includes(code)) {
				// eslint-disable-next-line no-param-reassign
				code = `${code}_MSGVER_2`;
			}
			return code;
		}
		#getPreparedNotifyContent(code) {
			let content = main_core.Loc.getMessage(code);
			if (!main_core.Type.isStringFilled(content)) {
				return null;
			}
			const params = this.#params;
			if (main_core.Type.isPlainObject(params)) {
				Object.entries(params).forEach(entryData => {
					content = content.replace(`#${entryData[0]}#`, entryData[1]);
				});
			}
			return content;
		}
		#onFailure(error, callback) {
			this.#sendAnalyticsData(crm_integration_analytics.Dictionary.STATUS_ERROR);
			this.#analyticsData = null;
			BX.Kanban.Utils.showErrorDialog(`Error: ${error}`, true);
			callback(new Error(error));
		}
		#prepareAnalyticsChangeStageEventData() {
			const targetColumn = this.#grid.getColumn(this.#params.status) ?? this.#grid.getDropZoneArea().getDropZone(this.#params.status);
			const columnType = targetColumn ? targetColumn.getData().type : this.#params.type;
			if (columnType === 'PROGRESS') {
				this.#analyticsData = crm_integration_analytics.Builder.Entity.ChangeStageEvent.createDefault(this.#params.entity_type, this.#params.entity_id.length).setSubSection(crm_integration_analytics.Dictionary.SUB_SECTION_KANBAN).setElement(crm_integration_analytics.Dictionary.ELEMENT_GRID_ROW_CONTEXT_MENU).buildData();
			} else {
				this.#prepareAnalyticsCloseEventData();
			}
		}
		#prepareAnalyticsCloseEventData() {
			const [entityId] = this.#params.entity_id;
			const item = this.#grid.getItem(entityId);
			const targetColumn = this.#grid.getColumn(this.#params.status) ?? this.#grid.getDropZoneArea().getDropZone(this.#params.status);
			const type = targetColumn ? targetColumn.getData().type : this.#params.type;
			this.#analyticsData = this.#grid.getDefaultAnalyticsCloseEvent(item, type, this.#params.entity_id.toString());
			this.#analyticsData.c_element = crm_integration_analytics.Dictionary.ELEMENT_WON_TOP_ACTIONS;
			if (type === 'LOOSE') {
				this.#analyticsData.c_element = crm_integration_analytics.Dictionary.ELEMENT_LOSE_TOP_ACTIONS;
			}
		}
		#sendAnalyticsData(status) {
			if (!this.#analyticsData) {
				return;
			}
			BX.UI.Analytics.sendData({
				...this.#analyticsData,
				status
			});
		}
	}
	NAMESPACE$3.SimpleAction = SimpleAction;

	const NAMESPACE$2 = main_core.Reflection.namespace('BX.CRM.Kanban.Actions');
	class DeleteAction {
		#grid;
		#dropZone;
		#deletedItems = null;
		#ids = [];
		#showNotify;
		#applyFilterAfterAction;
		#action = SimpleAction;
		constructor(grid, params) {
			this.#grid = grid;
			if (!main_core.Type.isArrayFilled(params.ids)) {
				throw new Error('Param ids must be filled array');
			}
			this.#ids = params.ids;
			this.#showNotify = main_core.Type.isBoolean(params.showNotify) ? params.showNotify : true;
			this.#applyFilterAfterAction = main_core.Type.isBoolean(params.applyFilterAfterAction) ? params.applyFilterAfterAction : false;
		}
		setDropZone(dropZone) {
			this.#dropZone = dropZone;
			return this;
		}
		execute() {
			const actionParams = {
				action: 'delete',
				id: this.#ids
			};
			new this.#action(this.#grid, actionParams).showNotify(this.#showNotify).applyFilterAfterAction(this.#applyFilterAfterAction).execute().then(response => this.#onResolve(response), response => this.#onReject(response)).catch(() => {
				this.#showActionError();
			});
		}
		#onResolve(response) {
			const dropZone = this.#dropZone;
			if (dropZone) {
				this.#prepareDropZone();
			}
			this.#prepareGrid();
			this.#unHideUndeletedItems(response);
			this.#showResult(response);
		}
		#getDeletedItems() {
			if (this.#deletedItems === null) {
				const grid = this.#grid;
				const ids = this.#ids;
				ids.forEach(id => {
					const item = grid.getItem(id);
					if (item) {
						if (this.#deletedItems === null) {
							this.#deletedItems = [];
						}
						this.#deletedItems.push(item);
					}
				});
			}
			return this.#deletedItems;
		}
		#prepareDropZone() {
			const dropZone = this.#dropZone;
			dropZone.empty();
			dropZone.getDropZoneArea().hide();
			dropZone.droppedItems = [];
		}
		#prepareGrid() {
			const grid = this.#grid;
			grid.dropZonesShow = false;
			grid.resetMultiSelectMode();
			grid.resetActionPanel();
			grid.resetDragMode();
		}
		#unHideUndeletedItems(data) {
			const deletedItems = this.#getDeletedItems();
			const {
				deletedIds,
				errors
			} = data;
			const undeletedItems = deletedItems.filter(item => !deletedIds.includes(Number(item.getId())));
			if (main_core.Type.isArrayFilled(undeletedItems)) {
				undeletedItems.forEach(item => this.#restoreItemInColumn(item));
				errors.forEach(({
					message: content,
					data: {
						id
					}
				}) => {
					ui_notification.UI.Notification.Center.notify({
						content,
						actions: [{
							title: main_core.Loc.getMessage('CRM_KANBAN_OPEN_ITEM'),
							events: {
								click: () => {
									BX.fireEvent(this.#grid.getItem(id).link, 'click');
								}
							}
						}]
					});
				});
			}
		}
		#showResult(data) {
			const deletedItems = this.#getDeletedItems();
			const {
				deletedIds
			} = data;
			const removedItems = deletedItems.filter(item => deletedIds.includes(Number(item.getId())));
			if (!main_core.Type.isArrayFilled(removedItems)) {
				return;
			}
			const balloonOptions = {
				content: this.#getDeleteTitle(removedItems)
			};
			const grid = this.#grid;
			if (grid.getTypeInfoParam('isRecyclebinEnabled')) {
				balloonOptions.actions = [{
					title: main_core.Loc.getMessage('CRM_KANBAN_DELETE_CANCEL'),
					events: {
						click: () => this.#onDeletionCancelClick(balloon, removedItems)
					}
				}];
			}
			const balloon = ui_notification.UI.Notification.Center.notify(balloonOptions);
		}
		#getDeleteTitle(removedItems) {
			const ids = this.#ids;
			if (ids.length === 1) {
				return main_core.Loc.getMessage('CRM_KANBAN_DELETE_SUCCESS', {
					'#ELEMENT_NAME#': removedItems[0].getData().name
				});
			}
			const difference = ids.length - removedItems.length;
			if (difference === 0) {
				return main_core.Loc.getMessage('CRM_KANBAN_DELETE_SUCCESS_MULTIPLE');
			}
			return main_core.Loc.getMessage('CRM_KANBAN_DELETE_SUCCESS_MULTIPLE_WITH_ERRORS', {
				'#COUNT#': difference
			});
		}
		#onDeletionCancelClick(balloon, removedItems) {
			balloon.close();
			const grid = this.#grid;
			const entityIds = this.#ids;
			const {
				entityTypeInt: entityTypeId
			} = grid.getData();
			main_core.ajax.runComponentAction('bitrix:crm.kanban', 'restore', {
				mode: 'ajax',
				data: {
					entityIds,
					entityTypeId
				}
			}).then(({
				data
			}) => {
				if (!main_core.Type.isPlainObject(data)) {
					return;
				}
				const ids = Object.values(data).filter(id => main_core.Type.isNumber(id));
				if (main_core.Type.isArrayFilled(ids)) {
					this.#grid.loadNew(ids, false, true, true, true).then(response => {
						const autoHideDelay = 6000;
						ui_notification.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('CRM_KANBAN_DELETE_RESTORE_SUCCESS'),
							autoHideDelay
						});
					}, () => {
						this.#showActionError();
					}).catch(() => {
						this.#showActionError();
					});
				}
			}, response => this.#onReject(response)).catch(() => {
				this.#showActionError();
			});
		}
		#showActionError() {
			ui_notification.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('CRM_KANBAN_ACTION_ERROR')
			});
		}
		#restoreItemInColumn(item) {
			const lastPosition = item.getLastPosition();
			if (!lastPosition.columnId) {
				return;
			}
			const data = item.getData();
			data.columnId = lastPosition.columnId;
			data.targetId = lastPosition.targetId;
			const grid = this.#grid;
			const price = parseFloat(data.price);
			grid.getColumn(item.columnId).incPrice(price);
			grid.updateItem(item.getId(), data);
			grid.unhideItem(item);
		}
		#onReject(response) {
			const {
				message: content
			} = response.errors[0];
			ui_notification.UI.Notification.Center.notify({
				content
			});
		}
	}
	NAMESPACE$2.DeleteAction = DeleteAction;

	const NAMESPACE$1 = main_core.Reflection.namespace('BX.CRM.Kanban.Actions');
	const CONTAINER_ID = 'crm-kanban-progress-bar-container';
	class RestartAutomationAction {
		#ids;
		#grid;
		#progressBarContainer;
		#clearLayoutHandler;
		#resizeHandler;
		#stateChangeHandler;
		#processor = null;
		constructor(grid, params) {
			this.#grid = grid;
			this.#ids = params.ids;
			if (!main_core.Type.isArrayFilled(params.ids)) {
				throw new Error('Param ids must be filled array');
			}
			this.#clearLayoutHandler = this.#onClearLayout.bind(this);
			this.#resizeHandler = this.#onResize.bind(this);
			this.#stateChangeHandler = this.#onProcessStateChange.bind(this);
		}
		execute() {
			this.#progressBarContainer = document.getElementById(CONTAINER_ID);
			const container = this.#grid.actionPanel.layout.container;
			if (this.#progressBarContainer === null) {
				this.#progressBarContainer = main_core.Tag.render`<div id="${CONTAINER_ID}"></div>`;
				main_core.Dom.insertAfter(this.#progressBarContainer, this.#grid.actionPanel.layout.container);
				main_core.Event.EventEmitter.subscribe('BX.Crm.ProcessSummaryPanel:onClearLayout', this.#clearLayoutHandler, {
					compatMode: true
				});
				main_core.Event.bind(window, 'resize', this.#resizeHandler);
			}
			main_core.Dom.addClass(container, '--crm-kanban-with-stepper');
			main_core.Dom.addClass(this.#progressBarContainer, '--active');
			this.#adjustStepperContainer();
			main_core.Runtime.loadExtension('crm.entity-list.panel').then(({
				ExecuteRestartAutomation
			}) => {
				const progressBarRepo = new crm_autorun.ProgressBarRepository(this.#progressBarContainer);
				const operation = new ExecuteRestartAutomation({
					entityTypeId: this.#getEntityTypeId()
				});
				operation.injectDependencies(progressBarRepo);
				operation.executeForKanban(this.#grid, this.#ids);
				this.#subscribeToProcessStateChange();
			}).catch(() => {
				throw new Error('Cant load crm.entity-list.panel extension');
			});
		}
		#subscribeToProcessStateChange() {
			const manager = crm_autorun.BatchRestartAutomationManager.getItem(this.#grid.getData().gridId);
			const processor = manager?.getProgress();
			if (!processor || processor === this.#processor) {
				return;
			}
			this.#processor = processor;
			main_core.Event.EventEmitter.subscribe(processor, 'ON_AUTORUN_PROCESS_STATE_CHANGE', this.#stateChangeHandler, {
				compatMode: true
			});
		}
		#onProcessStateChange(processor) {
			if (!processor || processor.getState() !== crm_autorun.ProcessState.stopped) {
				return;
			}
			this.#onClearLayout();
		}
		#getEntityTypeId() {
			const entityTypeId = this.#grid.data.entityTypeInt ?? 0;
			return BX.CrmEntityType.isDefined(entityTypeId) ? entityTypeId : 0;
		}
		#adjustStepperContainer() {
			const container = this.#grid.actionPanel.layout.container;
			const offsetTop = container.offsetTop + container.offsetHeight;
			main_core.Dom.style(this.#progressBarContainer, {
				top: `${offsetTop}px`,
				left: `${container.offsetLeft}px`,
				width: `${container.offsetWidth}px`
			});
		}
		destroy() {
			main_core.Event.EventEmitter.unsubscribe('BX.Crm.ProcessSummaryPanel:onClearLayout', this.#clearLayoutHandler);
			if (this.#processor) {
				main_core.Event.EventEmitter.unsubscribe(this.#processor, 'ON_AUTORUN_PROCESS_STATE_CHANGE', this.#stateChangeHandler);
				this.#processor = null;
			}
			main_core.Event.unbind(window, 'resize', this.#resizeHandler);
		}
		#onClearLayout() {
			const container = this.#grid.actionPanel.layout.container;
			main_core.Dom.removeClass(container, '--crm-kanban-with-stepper');
			main_core.Dom.removeClass(this.#progressBarContainer, '--active');
			this.#grid.resetMultiSelectMode();
			this.#grid.actionPanel.hidePanel();
		}
		#onResize() {
			main_core.Runtime.throttle(this.#adjustStepperContainer.bind(this), 20);
		}
	}
	NAMESPACE$1.RestartAutomationAction = RestartAutomationAction;

	const NAMESPACE = main_core.Reflection.namespace('BX.CRM.Kanban.Analytics');
	class StageLabels {
		#createStageLabel;
		#renameStageLabel;
		#deleteStageLabel;
		#updateStageLabel;
		constructor(options) {
			this.#createStageLabel = options.createStageLabel;
			this.#renameStageLabel = options.renameStageLabel;
			this.#deleteStageLabel = options.deleteStageLabel;
			this.#updateStageLabel = options.updateStageLabel;
		}
		sendCreateSuccess() {
			this.#createStageLabel.status = crm_integration_analytics.Dictionary.STATUS_SUCCESS;
			ui_analytics.sendData(this.#createStageLabel);
		}
		sendCreateFailure() {
			this.#createStageLabel.status = crm_integration_analytics.Dictionary.STATUS_ERROR;
			ui_analytics.sendData(this.#createStageLabel);
		}
		sendRenameSuccess() {
			this.#renameStageLabel.status = crm_integration_analytics.Dictionary.STATUS_SUCCESS;
			ui_analytics.sendData(this.#renameStageLabel);
		}
		sendRenameFailure() {
			this.#renameStageLabel.status = crm_integration_analytics.Dictionary.STATUS_ERROR;
			ui_analytics.sendData(this.#renameStageLabel);
		}
		sendDeleteSuccess() {
			this.#deleteStageLabel.status = crm_integration_analytics.Dictionary.STATUS_SUCCESS;
			ui_analytics.sendData(this.#deleteStageLabel);
		}
		sendDeleteFailure() {
			this.#deleteStageLabel.status = crm_integration_analytics.Dictionary.STATUS_ERROR;
			ui_analytics.sendData(this.#deleteStageLabel);
		}
		sendUpdateSuccess() {
			this.#updateStageLabel.status = crm_integration_analytics.Dictionary.STATUS_SUCCESS;
			ui_analytics.sendData(this.#updateStageLabel);
		}
		sendUpdateFailure() {
			this.#updateStageLabel.status = crm_integration_analytics.Dictionary.STATUS_ERROR;
			ui_analytics.sendData(this.#updateStageLabel);
		}
	}
	NAMESPACE.StageLabels = StageLabels;

	const ViewMode = {
		MODE_STAGES: 'STAGES',
		MODE_ACTIVITIES: 'ACTIVITIES',
		MODE_DEADLINES: 'DEADLINES',
		getDefault() {
			return this.MODE_STAGES;
		},
		getAll() {
			return [this.MODE_STAGES, this.MODE_ACTIVITIES, this.MODE_DEADLINES];
		},
		normalize(mode) {
			return this.getAll().includes(mode) ? mode : this.getDefault();
		}
	};
	Object.freeze(ViewMode);

	/**
	 * @param options
	 * @extends {BX.Kanban.Grid}
	 */
	class Grid extends BX.Kanban.Grid {
		static Instance = null;
		static getInstance() {
			return Grid.Instance;
		}
		accessNotifyDialog = null;
		loadNewInterval = 25;
		ajaxParams = {};
		customFieldsPopup = null;
		customFieldsContainer = null;
		actionPanel = null;
		customActionPanel = null;
		currentNode = null;
		itemMoving = null;
		actionItems = [];
		checkedItems = [];
		progressBarEditor = null;
		ccItem = null;
		restItem = null;
		popupCancel = null;
		handleScrollWithOpenPopupInKanbanColumn = null;
		dropZonesShow = false;
		fieldsSelectors = {};
		animationDuration = 800;
		hintForNotVisibleItems = null;
		handleHideHintForNotVisibleItems = null;
		canUpdateItemAtItsPosition = false;
		stageAnalyticsLabels = null;
		constructor(options) {
			BX.Event.EventEmitter.setMaxListeners('Kanban.Grid:onFirstRender', 50);
			super(options);
			this._analyticsDictionary = BX.Crm.Integration.Analytics.Dictionary;
			this._analyticsBuilder = BX.Crm.Integration.Analytics.Builder;
			BX.addCustomEvent(this, "Kanban.DropZone:onBeforeItemCaptured", this.onBeforeItemCaptured.bind(this));
			BX.addCustomEvent(this, "Kanban.DropZone:onBeforeItemRestored", this.onBeforeItemRestored.bind(this));
			BX.addCustomEvent(this, "Kanban.DropZone:onItemCaptured", this.onItemCaptured.bind(this));
			BX.addCustomEvent(this, "Kanban.Grid:onBeforeItemMoved", this.onBeforeItemMoved.bind(this));
			//BX.addCustomEvent(this, "Kanban.Grid:onItemMoved", this.onItemMoved.bind(this));
			BX.addCustomEvent(this, "Kanban.Grid:onColumnAddedAsync", this.onColumnAddedAsync.bind(this));
			BX.addCustomEvent(this, "Kanban.Grid:onColumnUpdated", this.onColumnUpdated.bind(this));
			BX.addCustomEvent(this, "Kanban.Grid:onColumnMoved", this.onColumnMoved.bind(this));
			BX.addCustomEvent(this, "Kanban.Grid:onColumnRemovedAsync", this.onColumnRemovedAsync.bind(this));
			BX.addCustomEvent(this, "Kanban.Grid:onColumnLoadAsync", this.onColumnLoadAsync.bind(this));
			BX.addCustomEvent(this, "Kanban.Grid:onItemDragStart", this.onItemDragStartHandler.bind(this));
			BX.addCustomEvent(this, "Kanban.Grid:onItemDragStart", this.setKanbanDragMode.bind(this));
			BX.addCustomEvent(this, "Kanban.Grid:onItemDragStop", this.unSetKanbanDragMode.bind(this));
			BX.addCustomEvent("BX.Main.Filter:apply", this.onApplyFilter.bind(this));
			BX.addCustomEvent("Crm.PartialEditorDialog.Close", this.onPartialEditorClose.bind(this));
			BX.addCustomEvent("onPullEvent-crm", this.onPullEventHandlerCrm.bind(this));
			BX.addCustomEvent("onPullEvent-im", this.onPullEventHandlerCrm.bind(this));
			BX.addCustomEvent("onCrmActivityTodoChecked", this.onCrmActivityTodoChecked.bind(this));
			BX.addCustomEvent("SidePanel.Slider:onClose", this.onSliderClose.bind(this));
			BX.addCustomEvent("BX.CRM.Kanban.Item.select", this.startActionPanel.bind(this));
			BX.addCustomEvent("BX.CRM.Kanban.Item.unSelect", this.onItemUnselect.bind(this));
			BX.addCustomEvent("BX.UI.ActionPanel:clickResetAllBlock", this.resetMultiSelectMode.bind(this));
			BX.addCustomEvent('BX.UI.ActionPanel:hidePanel', this.showUiToolbarContainer.bind(this));
			BX.addCustomEvent('BX.UI.ActionPanel:showPanel', this.hideUiToolbarContainer.bind(this));
			BX.addCustomEvent("BX.Crm.EntityEditorSection:onOpenChildMenu", this.onOpenEditorMenu.bind(this));
			BX.addCustomEvent("BX.Crm.EntityEditor:onConfigScopeChange", this.onConfigEditorScopeChange.bind(this));
			BX.addCustomEvent("BX.Crm.EntityEditor:onConfigReset", this.onConfigEditorReset.bind(this));
			BX.addCustomEvent("BX.Crm.EntityEditor:onForceCommonConfigScopeForAll", this.onForceCommonEditorConfigScopeForAll.bind(this));
			// BX.addCustomEvent("BX.CRM.Kanban.Item.select", this.onMultiSelectMode.bind(this));
			BX.addCustomEvent("onPopupShow", this.onPopupShow.bind(this));
			BX.addCustomEvent("onPopupClose", this.onPopupClose.bind(this));
			BX.addCustomEvent("CrmDragItemDragRelease", this.onEditorDragItemRelease.bind(this));
			BX.addCustomEvent(window, "onCrmEntityCreate", this.onCrmEntityCreateDeadlinesView.bind(this));
			BX.addCustomEvent(this, "Kanban.Grid:onRender", main_core.Runtime.debounce(this.handleHintForNotVisibleColumns, 400, this));

			//setInterval(this.loadNew.bind(this), this.loadNewInterval * 1000);

			this.stageAnalyticsLabels = new StageLabels(options.stageAnalyticsLabels);
			Grid.Instance = this;
		}

		/**
		 * @returns {Array}
		 */
		getChecked() {
			return this.checkedItems;
		}

		/**
		 * @returns {number[]}
		 */
		getCheckedId() {
			return this.getChecked().map(item => item.id);
		}
		checkItem(item) {
			const itemToArray = this.getItem(item);
			if (!BX.util.in_array(itemToArray, this.checkedItems)) {
				itemToArray.checked = true;
				if (!this.isCheckedItem(itemToArray)) {
					this.checkedItems.push(itemToArray);
				}
				main_core.Dom.addClass(itemToArray.checkedButton, 'crm-kanban-item-checkbox-checked');
				main_core.Dom.addClass(itemToArray.container, 'crm-kanban-item-selected');
				BX.onCustomEvent('BX.CRM.Kanban.Item.select', [itemToArray]);
			}
		}
		isCheckedItem(item) {
			const checkedItems = this.checkedItems;
			for (let i = 0, c = checkedItems.length; i < c; i++) {
				if (checkedItems[i]['id'] === item['id']) {
					return true;
				}
			}
			return false;
		}
		onCrmEntityCreateDeadlinesView(entityData) {
			const context = entityData.sender.getContext();
			if (context['VIEW_MODE'] === ViewMode.MODE_DEADLINES) {
				void this.loadNew(entityData.entityId, true);
			}
		}
		onEditorDragItemRelease() {
			this.getColumns().forEach(column => {
				if (!column.isEditorOpen()) {
					column.cleanEditorNode();
					column.editor = null;
				}
			});
		}
		unCheckItem(item) {
			const itemInArray = this.getItem(item);
			if (BX.util.in_array(itemInArray, this.checkedItems)) {
				this.checkedItems.splice(this.checkedItems.indexOf(itemInArray), 1);
				itemInArray.checked = false;
				main_core.Dom.removeClass(itemInArray.checkedButton, 'crm-kanban-item-checkbox-checked');
				main_core.Dom.removeClass(itemInArray.container, 'crm-kanban-item-selected');
				BX.onCustomEvent('BX.CRM.Kanban.Item.unSelect', [itemInArray]);
			}
		}
		getPopupCancel(content) {
			if (!this.popupCancel) {
				this.popupCancel = new main_popup.Popup('crm-kanban-popup-cancel', window, {
					className: 'crm-kanban-popup-cancel',
					autoHide: false,
					overlay: true,
					maxWidth: 350,
					buttons: [new main_popup.PopupWindowButton({
						text: 'OK',
						className: 'ui-btn ui-btn-primary',
						events: {
							click: () => {
								this.popupCancel.close();
							}
						}
					})],
					closeByEsc: true,
					closeIcon: true
				});
			}
			this.popupCancel.setContent(content);
			return this.popupCancel;
		}
		getItemsForAction(removeItem) {
			const items = this.getChecked();
			if (removeItem) {
				items.splice(this.actionItems.indexOf(removeItem), 1);
			}
			this.actionItems = [];
			items.forEach(item => {
				this.actionItems.push(parseInt(item.id, 10));
			});
			return this.actionItems;
		}
		bindEvents() {
			if (this.isBindEvents) {
				return;
			}
			main_core.Event.bind(window, 'click', el => {
				if (this.dropZonesShow) {
					return;
				}
				this.isItKanban(el.target) ? this.currentNode = el.target : this.currentNode = null;
				const availableParentTags = ['main-kanban-item', 'ui-action-panel', 'ui-action-panel-item-popup-menu', 'bx-finder-popup', 'responsible-user-selector-dialog'];
				const hasAvailableParent = availableParentTags.find(className => BX.findParent(el.target, {
					className
				}));
				if (!hasAvailableParent && (top.BX.SidePanel?.Instance?.getTopSlider()?.url ?? '').indexOf('/company/personal/user/') !== 0) {
					const popup = main_popup.PopupManager.getCurrentPopup();
					if (!popup?.isShown()) {
						this.unSetKanbanDragMode();
						this.resetMultiSelectMode();
					}
				}
			});
			main_core.Event.bind(window, 'keydown', el => {
				if (this.dropZonesShow) {
					return;
				}
				if (el.code === "Escape") {
					this.resetMultiSelectMode();
					this.unSetKanbanDragMode();
				}
			});
			BX.addCustomEvent(window, 'Crm.PartialEditorDialog.Close', (editor, params) => {
				if (params.isCancelled && this.itemMoving.item) {
					this.moveItem(this.itemMoving.item, this.itemMoving.oldColumn, this.itemMoving.oldNextSiblingId);
				}
			});
			BX.Event.EventEmitter.subscribe('Crm.Kanban.Column:onItemAdded', event => {
				if (this.itemMoving?.item.id === event.data.item.id && this.items[this.itemMoving.item.id] !== undefined && this.itemMoving.item.columnId === this.items[this.itemMoving.item.id].columnId) {
					const column = this.getColumn(event.data.item.columnId);
					const {
						data
					} = event;
					if (data.item.columnId === data.oldColumn.id && column.data.type === 'PROGRESS') {
						return;
					}

					// @todo check this for ticket 0143009
					//this.itemMoving.oldColumn = event.data.oldColumn;
					this.onItemMoved(data.item, data.targetColumn, data.beforeItem);
				}
			});
			BX.Event.EventEmitter.subscribe('crm-kanban-settings-fields-view', () => {
				this.showFieldsSelectPopup('view');
			});
			BX.Event.EventEmitter.subscribe('crm-kanban-settings-fields-edit', () => {
				this.loadHiddenQuickEditorForFirstColumn();
				this.showFieldsSelectPopup('edit');
			});
			BX.Event.EventEmitter.subscribe('BX.Crm.Kanban:toggleTooltipsVisibility', () => {
				this.onToggleTooltipsVisibility();
			});
			const toolbarComponent = crm_toolbarComponent.ToolbarComponent.Instance ?? null;
			if (this.getData().isDynamicEntity && toolbarComponent) {
				toolbarComponent.subscribeTypeUpdatedEvent(() => {
					if (BX.Reflection.getClass('BX.Crm.Router.Instance.getKanbanUrl')) {
						const entityTypeId = this.getData().hasOwnProperty('entityTypeInt') ? main_core.Text.toInteger(this.getData().entityTypeInt) : 0;
						const categoryId = this.getData().params.hasOwnProperty('CATEGORY_ID') ? main_core.Text.toInteger(this.getData().params.CATEGORY_ID) : 0;
						const newUrl = BX.Crm.Router.Instance.getKanbanUrl(entityTypeId, categoryId);
						if (newUrl) {
							window.location.href = newUrl;
							return;
						}
					}
					window.location.reload();
				});
				toolbarComponent.subscribeCategoriesUpdatedEvent(() => {
					this.reload();
				});
			}
			this.isBindEvents = true;
		}
		isItKanban(target) {
			return Boolean(BX.findParent(target, {
				className: 'main-kanban'
			}));
		}
		setKanbanDragMode() {
			main_core.Dom.addClass(document.body, 'crm-kanban-drag-mode');
		}
		unSetKanbanDragMode() {
			this.stopActionPanel(true);
			main_core.Dom.removeClass(document.body, 'crm-kanban-drag-mode');
		}

		/**
		 * Render Kanban (override for add multiple actions).
		 * @returns {void}
		 */
		renderLayout() {
			const gridData = this.getData();
			super.renderLayout(...arguments);
			this.setDropAreaFirstItemWidth();
			if (this.ccItem && !gridData.contactCenterShow) {
				this.hideItem(this.ccItem);
			}
			if (this.restItem && !gridData.restDemoBlockShow) {
				this.hideItem(this.restItem);
			}
		}

		/**
		 * Set width for first item.
		 */
		setDropAreaFirstItemWidth() {
			if (this.layout.gridContainer.firstChild === null) {
				return;
			}
			const styleNode = BX.create('style', {
				attrs: {
					type: 'text/css'
				}
			});
			const classNames = '.main-kanban-dropzone:first-child, main-kanban-dropzone:last-child';
			const width = this.layout.gridContainer.firstChild.offsetWidth + 3;
			const text = `${classNames}(max-width: ${width}px, min-width: ${width}px)`;
			const styles = document.createTextNode(text);
			styleNode.appendChild(styles);
			document.head.appendChild(styleNode);
		}

		/**
		 * @returns {string}
		 */
		getAjaxHandlerPath() {
			const data = this.getData();
			return main_core.Type.isStringFilled(data.ajaxHandlerPath) ? data.ajaxHandlerPath : '/bitrix/components/bitrix/crm.kanban/ajax.old.php';
		}

		/**
		 * @param {Object} data
		 * @returns {void}
		 */
		setAjaxParams(data) {
			this.ajaxParams = data;
		}

		/**
		 * Perform ajax query.
		 * @param {Object} data
		 * @param {Function} onsuccess
		 * @param {Function} onfailure
		 * @param {String} dataType html/json/script
		 * @returns {void}
		 */
		ajax(data, onsuccess, onfailure, dataType) {
			const gridData = this.getData();
			if (main_core.Type.isUndefined(dataType)) {
				dataType = 'json';
			}
			data.sessid = BX.bitrix_sessid();
			data.extra = gridData.params;
			data.entity_type = gridData.entityType;
			data.viewMode = gridData.viewMode;
			data.version = 2;
			data.ajaxParams = this.ajaxParams;
			data.entityPath = gridData.entityPath;
			this.setAjaxParams({});
			let url = this.getAjaxHandlerPath();
			if (!main_core.Type.isUndefined(data.action)) {
				url += url.indexOf('?') === -1 ? '?' : '&';
				url += 'action=' + data.action;
			}
			if (this.isMultiSelectMode()) {
				url += '&group=yes';
			}
			if (this.isCycleRequest(data)) {
				this.reload();
			} else {
				BX.ajax({
					method: 'POST',
					dataType,
					url,
					data,
					onsuccess,
					onfailure
				});
			}
		}

		/**
		 * This is a crutch that will serve as the final frontier against kanban loops
		 * until we find all the scenarios where customers have kanban loops.
		 * @param {Object} data
		 * @returns {boolean}
		 */
		isCycleRequest(data) {
			if (data.action !== 'page') {
				return false;
			}
			const cyclePeriod = 8 * 1000; // 8 seconds
			const maxRequestsInPeriod = 5;
			const setCycleRequestParams = cycleRequestParams => {
				BX.localStorage.set('crm-kanban-cycle-request-params', cycleRequestParams, cyclePeriod);
			};
			let params = BX.localStorage.get('crm-kanban-cycle-request-params');
			if (!params) {
				params = this.getEmptyCycleRequestParams();
				params.total += 1;
				setCycleRequestParams(params);
				return false;
			}
			const offset = Date.now() - params.startTime;
			if (offset < cyclePeriod && params.total >= maxRequestsInPeriod) {
				setCycleRequestParams(this.getEmptyCycleRequestParams());
				return true;
			}
			if (offset > cyclePeriod) {
				params = this.getEmptyCycleRequestParams();
			}
			params.total += 1;
			setCycleRequestParams(params);
			return false;
		}
		getEmptyCycleRequestParams() {
			return {
				total: 0,
				startTime: Date.now()
			};
		}
		showLockedEntitySlider() {
			main_core.Runtime.loadExtension('ui.info-helper').then(({
				FeaturePromotersRegistry
			}) => {
				FeaturePromotersRegistry.getPromoter({
					code: this.getData().lockedEntitySliderCode
				}).show();
			});
		}

		/**
		 * Show popup for request access.
		 * @returns {void}
		 */
		accessNotify() {
			if (typeof BX.Intranet !== "undefined" && typeof BX.Intranet.NotifyDialog !== "undefined") {
				if (this.accessNotifyDialog === null) {
					var gridData = this.getData();
					this.accessNotifyDialog = new BX.Intranet.NotifyDialog({
						listUserData: this.getData().admins,
						notificationHandlerUrl: this.getAjaxHandlerPath() + "?action=notifyAdmin&version=2&entity_type=" + gridData.entityType,
						popupTexts: {
							sendButton: main_core.Loc.getMessage("CRM_KANBAN_NOTIFY_BUTTON"),
							title: main_core.Loc.getMessage("CRM_KANBAN_NOTIFY_TITLE"),
							header: main_core.Loc.getMessage("CRM_KANBAN_NOTIFY_HEADER"),
							description: main_core.Loc.getMessage("CRM_KANBAN_NOTIFY_TEXT2")
						}
					});
				}
				this.accessNotifyDialog.show();
			}
		}

		/**
		 * Add new stage.
		 * @param {BX.Kanban.Column} column
		 * @returns {BX.Promise}
		 */
		addStage(column) {
			var promise = new BX.Promise();
			var targetColumn = this.getPreviousColumnSibling(column);
			var targetColumnId = targetColumn ? targetColumn.getId() : 0;
			this.ajax({
				action: "modifyStage",
				columnName: column.getName(),
				columnColor: column.getColor(),
				afterColumnId: targetColumnId
			}, function (data) {
				if (data && !data.error) {
					this?.stageAnalyticsLabels.sendCreateSuccess();
					this.resetActionPanel();
					promise.fulfill(data);
				} else if (data) {
					this?.stageAnalyticsLabels.sendCreateFailure();
					BX.Kanban.Utils.showErrorDialog(data.error, data.fatal);
					promise.reject(data.error);
				}
			}.bind(this), function (error) {
				this?.stageAnalyticsLabels.sendCreateFailure();
				BX.Kanban.Utils.showErrorDialog("Error: " + error, true);
				promise.reject("Error: " + error);
			}.bind(this));
			return promise;
		}

		/**
		 * Remove one column (stage).
		 * @param {BX.Kanban.Column} column
		 * @returns {BX.Promise}
		 */
		removeStage(column) {
			var promise = new BX.Promise();
			this.ajax({
				action: "modifyStage",
				columnId: column.getId(),
				delete: 1
			}, function (data) {
				if (data && !data.error) {
					this?.stageAnalyticsLabels.sendDeleteSuccess();
					this.resetActionPanel();
					promise.fulfill();
				} else if (data) {
					this?.stageAnalyticsLabels.sendDeleteFailure();
					promise.reject(data.error);
				}
			}.bind(this), function (error) {
				this?.stageAnalyticsLabels.sendDeleteFailure();
				BX.Kanban.Utils.showErrorDialog("Error: " + error, true);
				promise.reject("Error: " + error);
			}.bind(this));
			return promise;
		}

		/**
		 * Get items from one column.
		 * @param {BX.CRM.Kanban.Column} column
		 * @returns {BX.Promise}
		 */
		getColumnItems(column) {
			const promise = new BX.Promise();
			const total = column.getTotal();
			this.data.params.total = total;
			const itemsCount = column.getItemsCount();
			this.data.params.itemsCount = itemsCount;
			const pagination = column.getPagination();

			/**
			 *  if there is a large number of changes in elements in real time, then the value of the total number
			 *  of elements in the column may become irrelevant and an erroneous request will be sent with a page number
			 *  that is outside the range of acceptable values, because of this, the request will return a selection
			 *  for the first page (see "$this->NavPageNomer = ..." in DBNavStart() function)
			 *  To eliminate this error, we check in advance if it is possible to get the items on the next page.
			 */
			const {
				skipColumnCountCheck
			} = this.getData();
			const {
				blockSize,
				canLoadMoreItems
			} = column;
			if (!skipColumnCountCheck && total < pagination.getPage() * blockSize || skipColumnCountCheck && !canLoadMoreItems) {
				column.setTotal(itemsCount);
				promise.fulfill([]);
				return promise;
			}
			column.setLoadingInProgress();
			const page = pagination.getPage() + 1;
			this.ajax({
				action: 'page',
				page,
				column: column.getId(),
				onlyItems: page > 1 ? 'Y' : 'N'
			}, data => {
				this.updateConfig(data);
				if (data && !data.error && (Array.isArray(data) || Array.isArray(data.items))) {
					const items = Array.isArray(data) ? data : data.items;
					if (items.length === 0) {
						column.setLoadingMoreItem(false);
						if (skipColumnCountCheck) {
							column.setTotal(itemsCount + items.length);
							column.showTotalCount();
						}
					}
					promise.fulfill(items);
					return;
				}
				if (data) {
					BX.Kanban.Utils.showErrorDialog(data.error, data.fatal);
					promise.reject(data.error);
					return;
				}
				if (this.ccItem) {
					const gridData = this.getData();
					if (!gridData.contactCenterShow) {
						this.hideItem(this.ccItem);
					}
				}
			}, error => {
				BX.Kanban.Utils.showErrorDialog(`Error: ${error}`, true);
				promise.reject(`Error: ${error}`);
			});
			return promise;
		}

		/**
		 * Add item to the column in top.
		 * @param {Object} data
		 * @param {bool} incColumnPrice
		 * @returns {void}
		 */
		addItemTop(data, incColumnPrice) {
			var column = this.getColumn(data.columnId);
			var columnItems = column ? column.getItems() : [];
			incColumnPrice = typeof incColumnPrice !== 'undefined' ? incColumnPrice : true;

			// get first item in column
			if (columnItems.length > 0) {
				data.targetId = columnItems[0].getId();
			}

			// inc column price and add item
			column && incColumnPrice ? column.incPrice(data.data.price) : null;
			this.addItem(data);
		}

		/**
		 *
		 * @param {BX.CRM.Kanban.Item} item
		 */
		updateItemAtItsPosition(item) {
			this.canUpdateItemAtItsPosition = true;
			this.moveItem(item, item.getColumn(), item, true).finally(() => {
				this.canUpdateItemAtItsPosition = true;
			});
		}

		/**
		 *
		 * @param {BX.CRM.Kanban.Item} item
		 * @param {BX.CRM.Kanban.Column} targetColumn
		 * @param {BX.CRM.Kanban.Item} beforeItem
		 * @param {bool} usePromise
		 * @returns {Promise<{status: boolean}>|boolean|Promise<void>|Promise<unknown>}
		 */
		moveItem(item, targetColumn, beforeItem, usePromise) {
			usePromise = usePromise || false;
			return this.movePromisedItem(item, targetColumn, beforeItem, usePromise);
		}

		/**
		 *
		 * @param {BX.CRM.Kanban.Item} item
		 * @param {BX.CRM.Kanban.Column} targetColumn
		 * @param {BX.CRM.Kanban.Item} beforeItem
		 * @param {bool} usePromise
		 * @returns {Promise<unknown[]>|boolean|Promise<void>|Promise<{status: boolean}>}
		 */
		movePromisedItem(item, targetColumn, beforeItem, usePromise) {
			var notChangeTotal = item.notChangeTotal || false;
			item = this.getItem(item);
			item.notChangeTotal = notChangeTotal;
			targetColumn = this.getColumn(targetColumn);
			if (!item || !targetColumn || item === beforeItem && !this.canUpdateItemAtItsPosition) {
				if (usePromise) {
					return Promise.resolve({
						status: false
					});
				}
				return false;
			}
			beforeItem = beforeItem ? this.getItem(beforeItem) : targetColumn.items[0] || null;
			var currentColumn = item.getColumn();
			if (this.getChecked().length > 1) {
				return this.moveManyItems(item, targetColumn, beforeItem, usePromise);
			}
			item.beforeItem = beforeItem;
			currentColumn.removeItem(item).then(() => {
				targetColumn.addItem(item, item.beforeItem);
			});
			this.stopActionPanel();
			if (usePromise) {
				return Promise.resolve({
					status: true
				});
			}
			return true;
		}
		moveManyItems(primaryItem, targetColumn, beforeItem, usePromise) {
			// check required fields
			let error = false;
			const targetColumnId = targetColumn.getId();
			const targetColumnData = targetColumn.getData();
			const items = this.getChecked();
			for (let i = 0, itemsCount = items.length; i < itemsCount; i++) {
				const itemData = items[i].getData();
				const currentColumnId = items[i].getColumn().getId();

				// some final columns
				if (this.getTypeInfoParam('hasRestictionToMoveToWinColumn') && targetColumnData.type === 'WIN') {
					error = true;
					if (itemsCount === i + 1) {
						this.resetMultiSelectMode();
					}
				}
				// first checking if targetColumn require some fields
				else if (main_core.Type.isArrayFilled(this.getRequiredFieldsForColumnId(targetColumnId, itemData)) && targetColumnId !== currentColumnId) {
					// check required fm fields
					if (itemData.required_fm) {
						const newRequired = [];
						const requiredFieldNames = this.getRequiredFieldsForColumnId(targetColumnId, itemData);
						for (let j = 0, cc = requiredFieldNames.length; j < cc; j++) {
							const requiredName = requiredFieldNames[j];
							if (items[i].isRequiredFmField(requiredName) || !items[i].isValidFmFieldName(requiredName)) {
								newRequired.push(requiredName);
							}
						}
						itemData.required[targetColumnId] = newRequired;
					}
					if (main_core.Type.isArrayFilled(this.getRequiredFieldsForColumnId(targetColumnId, itemData))) {
						error = true;
						if (itemsCount === i + 1) {
							this.resetMultiSelectMode();
						}
					}
				} else if (itemData['updateRestrictionCallback']) {
					try {
						// eslint-disable-next-line no-eval -- intentional: executes jsCode action type from server-side
						eval(itemData['updateRestrictionCallback']);
					} catch (e) {
						console.log('update action restricted');
					}
					this.resetMultiSelectMode();
					if (usePromise) {
						return Promise.resolve();
					}
					return;
				}
			}
			if (error) {
				const gridData = this.getData();
				this.showNotCompletedPopup(gridData);
			}
			const removePromises = [];
			const currentColumns = new Map();
			for (let i = 0; i < items.length; i++) {
				const currentColumn = items[i].getColumn();
				if (items[i] !== primaryItem && currentColumn !== targetColumn) {
					currentColumn.layout.total.textContent = +currentColumn.layout.total.innerHTML - 1;
				}
				items[i].useAnimation = false;
				removePromises.push(currentColumn.removeItem(items[i]));
				currentColumns.set(items[i].getId(), currentColumn);
			}
			if (usePromise) {
				return Promise.all(removePromises).then(() => {
					items.forEach(item => {
						item.useAnimation = false;
						item.layout.container.style.opacity = 1;
					});
					targetColumn.addItems(items, beforeItem);
					this.resetMultiSelectMode();
					this.stopActionPanel();
				});
			}
			targetColumn.addItems(items, beforeItem);
			this.resetMultiSelectMode();
			this.stopActionPanel();
		}

		/**
		 * Load new items by interval.
		 * @param {int|int[]} id Entity id or array of entity ids (optional).
		 * @param {boolean} force Force load without filter.
		 * @param {boolean} forceUpdate Force update entity.
		 * @param {boolean} onlyItems
		 * @param {boolean} useAnimation
		 * @returns {Promise}
		 */
		loadNew(id, force, forceUpdate, onlyItems, useAnimation) {
			var gridData = this.getData();
			var entityIds = typeof id !== 'undefined' ? Array.isArray(id) ? id : [id] : 0;
			if (document.hidden) {
				return Promise.reject(new Error('Tab is not active'));
			}
			var loadItemsCount = 0;
			loadItemsCount = entityIds.reduce(function (count, current, index, arr) {
				var item = this.getItem(current);
				if (item && item.getData().updateRestrictionCallback) {
					delete arr[index];
					return count;
				}
				return ++count;
			}.bind(this), 0);
			if (!loadItemsCount) {
				return Promise.resolve();
			}
			useAnimation = main_core.Type.isBoolean(useAnimation) ? useAnimation : false;
			return new Promise(function (resolve, reject) {
				this.ajax(entityIds[0] ? {
					action: "get",
					entity_id: entityIds,
					force: force === true ? "Y" : "N",
					onlyItems: onlyItems === true ? 'Y' : 'N'
				} : {
					action: "get",
					min_entity_id: gridData.lastId,
					force: force === true ? "Y" : "N",
					onlyItems: onlyItems === true ? 'Y' : 'N'
				}, function (data) {
					if (!data) {
						resolve(data);
					}
					this.updateConfig(data);
					if (data.items) {
						var worked = false;
						if (data.items.length) {
							var titlesForRender = {};
							for (var i = data.items.length - 1; i >= 0; i--) {
								var item = data.items[i];
								item.useAnimation = useAnimation;
								var existItem = this.getItem(item.id);
								if (item.id <= 0) {
									continue;
								}
								worked = true;
								if (existItem) {
									var existData = existItem.getData();
									var existColumn = existItem.getColumn();
									var newColumn = this.getColumn(item.columnId);
									existColumn.decPrice(parseFloat(existData.price));
									titlesForRender[existColumn.getId()] = existColumn;
									if (newColumn) {
										newColumn.incPrice(parseFloat(item.data.price));
										existItem.data.price = item.data.price;
										const sorter = BX.CRM.Kanban.Sort.Sorter.createWithCurrentSortType(newColumn.getItems());
										const beforeItem = sorter.calcBeforeItemByParams(item.data.sort);
										if (newColumn !== existColumn || forceUpdate === true) {
											item.notChangeTotal = true;
											if (beforeItem) {
												item.targetId = beforeItem.getId();
											}
											this.updateItem(item.id, item);
											titlesForRender[newColumn.getId()] = newColumn;
										} else if (newColumn.getPreviousItemSibling(existItem) !== beforeItem) {
											this.moveItem(existItem, newColumn, beforeItem);
										}
									} else {
										this.removeItem(existItem);
									}
								} else if (item.id && this.getColumn(item.columnId) === null) {
									BX.onCustomEvent(this, "Kanban.Column:render");
								} else if (item.id) {
									this.addItemTop(item);
								}
								if (!entityIds[0]) {
									gridData.lastId = item.id;
									this.setData(gridData);
								}
							}
							for (var key in titlesForRender) {
								titlesForRender[key].renderSubTitle();
							}
						}
						if (!worked && entityIds[0]) {
							var item = this.getItem(entityIds[0]);
							if (item) {
								var itemData = item.getData();
								var column = item.getColumn();
								column.decPrice(itemData.price);
								this.removeItem(entityIds[0]);
							}
						}
					}
					resolve(data);
				}.bind(this), function (error) {
					reject();
				}.bind(this));
			}.bind(this));
		}
		updateConfig(data) {
			if (!main_core.Type.isObject(data.config) || Object.keys(data.config).length === 0) {
				return;
			}
			const gridData = this.getData();
			if (main_core.Type.isArrayFilled(data.config.users)) {
				data.config.users.forEach(item => {
					const userExist = gridData.itemsConfig?.users.some(user => {
						return Number(user.id) === Number(item.id);
					});
					if (!userExist) {
						gridData.itemsConfig.users.push(item);
					}
				});
			}
			if (main_core.Type.isArrayFilled(data.config.fields)) {
				data.config.fields.forEach(item => {
					const fieldConfigExist = gridData.itemsConfig?.fields.some(field => {
						return field.code === item.code;
					});
					if (!fieldConfigExist) {
						gridData.itemsConfig?.fields.push(item);
					}
				});
			}
		}

		/**
		 *
		 * @param {Number} item
		 * @param {BX.CRM.Kanban.Item} options
		 * @returns {boolean}
		 */
		updateItem(item, options) {
			item = this.getItem(item);
			if (!item) {
				return false;
			}
			if (BX.Kanban.Utils.isValidId(options.columnId) && options.columnId !== item.getColumn().getId()) {
				if (options.notChangeTotal) {
					item.notChangeTotal = options.notChangeTotal;
				}
				if (options.useAnimation) {
					item.useAnimation = options.useAnimation;
				}
				this.moveItem(item, this.getColumn(options.columnId), this.getItem(options.targetId));
			}
			var eventArgs = ['UPDATE', {
				task: item,
				options: options
			}];
			BX.onCustomEvent(window, 'tasksTaskEvent', eventArgs);
			item.setOptions(options);
			item.render();
			return true;
		}

		/**
		 * Hook on item drag start.
		 * @param {BX.CRM.Kanban.Item} item
		 * @returns {void}
		 */
		onItemDragStart(item) {
			this.setDragMode(BX.Kanban.DragMode.ITEM);
			if (parseInt(item.getId()) < 0) {
				return;
			}
			var items = this.getItems();
			var itemColumnId = item.getColumnId();

			// disable move for win lead
			if (item.isItemMoveDisabled()) {
				for (var itemId in items) {
					var columnId = items[itemId].getColumnId();
					if (columnId === itemColumnId) {
						items[itemId].enableDropping();
					}
				}
				return;
			}
			super.onItemDragStart(...arguments);
			if (this.progressBarEditor) {
				this.progressBarEditor.close();
			}
		}

		/**
		 * @param {BX.CRM.Kanban.Item} item
		 */
		onItemDragStartHandler(item) {
			item.setLastPosition();
		}

		/**
		 * Event Handler must add a promise to the 'promises' collection.
		 * @param {Array} promises
		 * @returns {void}
		 */
		onColumnLoadAsync(promises) {
			promises.push(this.getColumnItems.bind(this));
		}

		/**
		 * Event Handler must add a promise to the 'promises' collection.
		 * @param {Array} promises
		 * @returns {void}
		 */
		onColumnRemovedAsync(promises) {
			promises.push(this.removeStage.bind(this));
		}

		/**
		 * Event Handler must add a promise to the 'promises' collection.
		 * @param {Array} promises
		 * @returns {void}
		 */
		onColumnAddedAsync(promises) {
			promises.push(this.addStage.bind(this));
		}

		/**
		 * Hook on item drop to junk's.
		 * @param {BX.CRM.Kanban.DropZoneEvent} dropEvent
		 * @returns {void}
		 */
		onBeforeItemCaptured(dropEvent) {
			BX.onCustomEvent("Crm.Kanban.Grid:onBeforeItemCapturedStart", [this, dropEvent]);
			// move item and decprice in column
			if (dropEvent.isActionAllowed()) {
				var item = dropEvent.getItem();
				var column = item.getColumn();
				var drop = dropEvent.getDropZone();
				const groupIds = this.getItemsForAction();
				this.itemMoving = {
					item,
					price: parseFloat(item.getData().price),
					oldColumn: column,
					oldNextSiblingId: column.getNextItemSibling(item),
					newColumn: null,
					newNextSibling: null,
					dropEvent,
					groupIds
				};
				dropEvent.groupIds = groupIds;
				this.onItemMoved(item, drop, null, true);
			}
		}
		onItemCaptured(item, dropZone, ids) {
			if (dropZone.getId() === 'DELETED') {
				if (main_core.Type.isArray(ids) && ids.length === 0) {
					ids = parseInt(item.getId(), 10);
				}
				ids = ids ?? this.getCheckedId();
				if (!main_core.Type.isArray(ids)) {
					ids = [ids];
				}
				const params = {
					ids,
					showNotify: false
				};
				new DeleteAction(this, params).setDropZone(dropZone).execute();
			}
		}

		/**
		 * Hook on item return from junk's.
		 * @param {BX.Kanban.DropZoneEvent} event
		 * @returns {void}
		 */
		onBeforeItemRestored(event) {
			const item = event.getItem();
			const column = item.getColumn();
			const price = parseFloat(item.getData().price);
			column.incPrice(price);
			const ids = this.itemMoving.groupIds ? this.itemMoving.groupIds.toString() : item.getId();
			const analyticsData = this.getDefaultAnalyticsCloseEvent(item, column.getData().type, ids);
			analyticsData.c_sub_section = this._analyticsDictionary.SUB_SECTION_KANBAN_DROPZONE;
			analyticsData.c_element = this._analyticsDictionary.ELEMENT_CANCEL_BUTTON;
			this.registerAnalyticsCloseEvent(analyticsData, this._analyticsDictionary.STATUS_CANCEL);
			this.onItemMoved(item, column);
		}

		/**
		 * Hook on item moved start.
		 * @param {BX.Kanban.DragEvent} event
		 * @returns {void}
		 */
		onBeforeItemMoved(event) {
			if (this.isBlockedIncomingMoving(event.targetColumn)) {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('CRM_KANBAN_MOVE_ITEM_TO_COLUMN_BLOCKED_2'),
					autoHideDelay: 5000
				});
				event.denyAction();
				return;
			}
			var item = event.getItem();
			var column = item.getColumn();
			this.itemMoving = {
				item: item,
				price: parseFloat(item.getData().price),
				oldColumn: column,
				oldNextSiblingId: column.getNextItemSibling(item),
				newColumn: null,
				newNextSibling: null
			};
		}

		/**
		 * Hook on item moved.
		 * @param {BX.CRM.Kanban.Item} item
		 * @param {BX.Kanban.Column|BX.Kanban.DropZone} targetColumn
		 * @param {BX.CRM.Kanban.Item} [beforeItem]
		 * @param {Boolean} [skipHandler]
		 * @returns {void}
		 */
		onItemMoved(item, targetColumn, beforeItem, skipHandler) {
			const itemData = item.getData();
			var columnId = targetColumn.getId();
			var gridData = this.getData();
			var isDropZone = targetColumn instanceof BX.Kanban.DropZone;
			if (targetColumn.getId() !== "DELETED" && itemData['updateRestrictionCallback'] && main_core.Type.isString(itemData['updateRestrictionCallback']) && columnId !== this.itemMoving.oldColumn.getId()) {
				try {
					// eslint-disable-next-line no-eval -- intentional: executes jsCode action type from server-side
					eval(itemData['updateRestrictionCallback']);
				} catch (e) {
					console.log('update action restricted');
				}
				if (isDropZone) {
					this.itemMoving.dropEvent.denyAction();
				} else {
					this.moveItem(item, this.itemMoving.oldColumn, this.itemMoving.oldNextSiblingId);
				}
				return;
			}

			// first checking if targetColumn require some fields
			if (main_core.Type.isArrayFilled(this.getRequiredFieldsForColumnId(columnId, itemData)) && this.itemMoving.oldColumn.getId() !== targetColumn.getId() && !item.isChangedInPullRequest()) {
				// check required fm fields
				if (itemData.required_fm) {
					const newRequired = [];
					const requiredFieldNames = this.getRequiredFieldsForColumnId(columnId, itemData);
					for (let i = 0, c = requiredFieldNames.length; i < c; i++) {
						const key = requiredFieldNames[i];
						if (item.isRequiredFmField(key) || !item.isValidFmFieldName(key)) {
							newRequired.push(requiredFieldNames[i]);
						}
					}
					itemData.required[columnId] = newRequired;
				}

				// if the item was loaded from a pull request, remove the required fields already set there
				if (item.rawData && typeof item.rawData === 'object') {
					const requiredFields = this.getRequiredFieldsForColumnId(columnId, itemData);
					for (var i = 0, c = requiredFields.length; i < c; i++) {
						var key = requiredFields[i];
						if (!(typeof item.rawData[key] === 'undefined' || item.rawData[key] === null || item.rawData[key] === '' || Array.isArray(item.rawData[key]) && !item.rawData[key].length)) {
							requiredFields.splice(i, 1);
						}
					}
					itemData.required[columnId] = requiredFields;
				}
				if ((main_core.Type.isArrayFilled(itemData.required?.[columnId]) || main_core.Type.isArrayFilled(itemData.required.ALL)) && this.getTypeInfoParam('isQuickEditorEnabled')) {
					this.itemMoving.newColumn = targetColumn;
					this.itemMoving.newNextSibling = beforeItem;
					// back to the prev place
					if (isDropZone) {
						this.itemMoving.dropEvent.denyAction();
					}
					if (this.getChecked().length > 1) {
						this.showNotCompletedPopup(gridData);
						this.resetMultiSelectMode();
					} else {
						// show editor
						const requiredFields = this.getRequiredFieldsForColumnId(columnId, itemData);
						this.openPartialEditor(item.getId(), columnId, requiredFields);
						main_core.Dom.addClass(item.layout.container, "main-kanban-item-waiting");
					}
					return;
				}
			}
			if (!item.isChangedInPullRequest()) {
				// show popup for lead convert
				if (this.getTypeInfoParam('canShowPopupForLeadConvert') && targetColumn.getId() === 'CONVERTED' && this.itemMoving.dropEvent) {
					BX.Crm.KanbanComponent.dropPopup(this, this.itemMoving.dropEvent);
				}

				// change price in old/new columns
				if (!item.notChangeTotal) {
					if (this.itemMoving.item.getData().runtimePrice !== true) {
						this.itemMoving.oldColumn.decPrice(this.itemMoving.price);
					}
					if (!isDropZone) {
						targetColumn.incPrice(this.itemMoving.price);
						targetColumn.renderSubTitle();
						this.itemMoving.oldColumn.renderSubTitle();
					}
				}
				item.notChangeTotal = false;
			}
			this.itemMoving.item.setDataKey("runtimePrice", false);

			// call handler
			if (skipHandler !== true && !item.isChangedInPullRequest()) {
				var handlerData = {
					grid: this,
					item: item,
					targetColumn: targetColumn,
					beforeItem: beforeItem,
					skip: false
				};
				BX.onCustomEvent("Crm.Kanban.Grid:onItemMovedFinal", [handlerData]);
				if (handlerData.skip === true) {
					return;
				}
			}
			var afterItemId = 0;
			var itemId = item.getId();

			// set sort
			if (targetColumn instanceof BX.Kanban.DropZone) {
				afterItemId = 0;
			} else {
				var afterItem = targetColumn.getPreviousItemSibling(item);
				if (afterItem) {
					afterItemId = afterItem.getId();
				}
			}
			main_core.Dom.removeClass(item.layout.container, "main-kanban-item-waiting");
			if (item.isChangedInPullRequest()) {
				this.clearItemMoving();
				item.dropChangedInPullRequest();
			} else {
				const {
					groupIds
				} = this.itemMoving;
				if (main_core.Type.isArray(groupIds) && !main_core.Type.isArrayFilled(groupIds)) {
					groupIds.push(itemId);
				}
				this.checkItemStatusAfterMoved(item, afterItemId, targetColumn);
			}
		}

		/**
		 * @param {BX.CRM.Kanban.Item} item
		 * @param {number} afterItemId
		 * @param {BX.Kanban.Column|BX.Kanban.DropZone} targetColumn
		 */
		checkItemStatusAfterMoved(item, afterItemId, targetColumn) {
			const itemId = item.getId();
			const targetColumnId = targetColumn ? targetColumn.getId() : 0;
			const params = {
				action: 'status',
				entity_id: this.itemMoving?.groupIds ?? itemId,
				prev_entity_id: afterItemId,
				status: targetColumnId,
				eventId: BX.Pull.QueueManager.registerRandomEventId()
			};
			const ids = this.itemMoving?.groupIds ?? [itemId];
			const columnType = targetColumn.getData().type;
			const isColumnChanged = this.itemMoving?.oldColumn && this.itemMoving.oldColumn.id !== targetColumn.id;
			this.getDefaultAnalyticsCloseEvent(item, targetColumn.getData().type, ids);
			this.ajax(params, data => {
				if (!data) {
					if (isColumnChanged) {
						this.registerAnalyticsChangeStageEvent(item, columnType, ids, this._analyticsDictionary.STATUS_ERROR);
					}
					return;
				}
				if (this.hasResponseError(data)) {
					this.rollbackItemsMovement([item.id], targetColumnId);
					this.showResponseError(data);
					if (isColumnChanged) {
						this.registerAnalyticsChangeStageEvent(item, columnType, ids, this._analyticsDictionary.STATUS_ERROR);
					}
					return;
				}
				if (isColumnChanged) {
					this.registerAnalyticsChangeStageEvent(item, columnType, ids, this._analyticsDictionary.STATUS_SUCCESS);
				} else {
					this.registerAnalyticsChangeStageEvent(item, columnType, ids, this._analyticsDictionary.STATUS_ERROR_FILLING_FIELDS);
				}
				if (this.getData().useItemPlanner && !this.itemMoving?.groupIds && crm_kanban_restriction.Restriction.Instance.isTodoActivityCreateAvailable()) {
					setTimeout(() => this.showItemPlannerMenu(item), 500);
				}
				const {
					items
				} = data;
				let {
					isShouldUpdateCard
				} = data;
				if (main_core.Type.isArrayFilled(items)) {
					this.updateItem(itemId, items[0]);
					return;
				}
				const prevColumnId = item.getLastPosition()?.columnId;
				if (prevColumnId) {
					const prevColumn = this.getColumn(prevColumnId);
					const currentColumn = item.getColumn();
					if (prevColumn?.isHiddenTotalSum() !== currentColumn?.isHiddenTotalSum()) {
						isShouldUpdateCard = true;
					}
				} else {
					isShouldUpdateCard = true;
				}
				item.setDataKey('columnId', targetColumnId);
				if (isShouldUpdateCard) {
					void this.loadNew(itemId, false, true, true, true);
				}
			}, error => {
				this.registerAnalyticsChangeStageEvent(item, columnType, ids, this._analyticsDictionary.STATUS_ERROR);
				BX.Kanban.Utils.showErrorDialog(`Error: ${error}`, true);
			});
		}

		/**
		 * @param {BX.CRM.Kanban.Item} item
		 * @param {string} type
		 * @param {string} ids
		 */
		getDefaultAnalyticsCloseEvent(item, type, ids) {
			let element = type;
			if (element === 'WIN') {
				element = 'won';
			} else if (element === 'LOOSE') {
				element = 'lose';
			} else {
				element = 'progress';
			}
			let subSection = this._analyticsDictionary.SUB_SECTION_KANBAN;
			if (this.dropZonesShow) {
				subSection = this._analyticsDictionary.SUB_SECTION_KANBAN_DROPZONE;
			}
			return this._analyticsBuilder.Entity.CloseEvent.createDefault(item.getGridData().entityType, ids).setSubSection(subSection).setElement(element).buildData();
		}
		registerAnalyticsCloseEvent(analyticsData, status) {
			if (!analyticsData || analyticsData.c_element === 'progress' && status !== this._analyticsDictionary.STATUS_CANCEL) {
				return;
			}
			analyticsData.status = status;
			BX.UI.Analytics.sendData(analyticsData);
		}
		registerAnalyticsChangeStageEvent(item, columnType, ids, status) {
			if (columnType === 'PROGRESS') {
				const analyticsData = this._analyticsBuilder.Entity.ChangeStageEvent.createDefault(item.getGridData().entityType, ids.length).setSubSection(this._analyticsDictionary.SUB_SECTION_KANBAN).setStatus(status).buildData();
				BX.UI.Analytics.sendData(analyticsData);
			} else {
				this.registerAnalyticsCloseEvent(this.getDefaultAnalyticsCloseEvent(item, columnType, ids.toString()), status);
			}
		}
		registerAnalyticsSpecialItemLinkClick(item, linkPath) {
			const pathParts = {
				REST_DEMO: 'rest_demo',
				CONTACT_CENTER: 'contact_center',
				MARKETPLACE: 'marketplace'
			};
			if (!(linkPath.toUpperCase() in pathParts)) {
				return;
			}
			let element = this._analyticsDictionary.ELEMENT_ITEM_CONTACT_CENTER;
			if (linkPath === pathParts.REST_DEMO) {
				element = this._analyticsDictionary.ELEMENT_ITEM_INDUSTRY_BUTTON;
			}
			if (linkPath === pathParts.MARKETPLACE) {
				element = this._analyticsDictionary.ELEMENT_CONTACT_CENTER_MARKETPLACE;
			}
			const analyticsEvent = this._analyticsBuilder.Block.LinkEvent.createDefault(item.getGridData().entityType).setElement(element);
			if (linkPath === pathParts.REST_DEMO) {
				analyticsEvent.setType(this._analyticsDictionary.TYPE_ITEM_INDUSTRY);
			}
			this.sendAnalyticsEvent(analyticsEvent);
		}
		registerAnalyticsSpecialItemCloseEvent(item, subSection, element, type = null) {
			const analyticsEvent = this._analyticsBuilder.Block.CloseEvent.createDefault(item.getGridData().entityType).setSubSection(subSection).setElement(element);
			if (type === this._analyticsDictionary.TYPE_ITEM_INDUSTRY) {
				analyticsEvent.setType(type);
			}
			this.sendAnalyticsEvent(analyticsEvent);
		}
		registerAnalyticsSpecialItemEnableEvent(item, subSection, element, type = null) {
			const analyticsEvent = this._analyticsBuilder.Block.EnableEvent.createDefault(item.getGridData().entityType).setSubSection(subSection).setElement(element);
			if (type === 'industry_block') {
				analyticsEvent.setType(this._analyticsDictionary.TYPE_ITEM_INDUSTRY);
			}
			this.sendAnalyticsEvent(analyticsEvent);
		}
		sendAnalyticsEvent(analyticsEvent) {
			BX.UI.Analytics.sendData(analyticsEvent.buildData());
		}

		/**
		 * @param {number[]} itemIds
		 * @param {string} targetColumnId
		 */
		rollbackItemsMovement(itemIds, targetColumnId) {
			this.clearItemMoving();
			itemIds.forEach(itemId => {
				const item = this.getItem(itemId);
				if (item === null) {
					return;
				}
				const currentColumn = this.getColumn(targetColumnId);
				if (currentColumn === null) {
					return;
				}
				const targetColumn = this.getColumn(item.options.columnId);
				if (targetColumn === null) {
					return;
				}
				const beforeItem = this.getItem(item.lastPosition.targetId);
				currentColumn.removeItem(item).then(() => {
					const {
						price
					} = item.data;
					this.moveItemPriceBetweenColumns(currentColumn, targetColumn, price);
					targetColumn.addItem(item, beforeItem);
				});
			});
		}

		/**
		 * @param {BX.CRM.Kanban.Column} donor
		 * @param {BX.CRM.Kanban.Column} acceptor
		 * @param {Number} price
		 */
		moveItemPriceBetweenColumns(donor, acceptor, price) {
			if (main_core.Type.isNumber(price)) {
				donor.decPrice(price);
				donor.renderSubTitle();
				acceptor.incPrice(price);
				acceptor.renderSubTitle();
			}
		}
		hasResponseError(response) {
			return main_core.Type.isString(response.error);
		}
		showResponseError(response) {
			const errorText = response.error;
			if (response.fatal) {
				BX.Kanban.Utils.showErrorDialog(errorText, true);
			} else {
				BX.UI.Notification.Center.notify({
					content: errorText,
					autoHideDelay: 5000
				});
			}
		}
		showItemPlannerMenu(item) {
			item.showPlannerMenu(item.getContainer(), BX.Crm.Activity.TodoEditorMode.UPDATE, true);
		}
		showNotCompletedPopup(gridData) {
			var message;
			if (gridData.isDynamicEntity) {
				message = main_core.Loc.getMessage("CRM_KANBAN_SET_STATUS_NOT_COMPLETED_TEXT_DYNAMIC_MSGVER_1");
			} else {
				message = main_core.Loc.getMessage("CRM_KANBAN_SET_STATUS_NOT_COMPLETED_TEXT_" + gridData.entityType + '_MSGVER_1');
			}
			this.getPopupCancel(message).show();
		}

		/**
		 * Hook on column update.
		 * @param {BX.Kanban.Column} column
		 * @returns {void}
		 */
		onColumnUpdated(column) {
			var columnId = column.getId();
			var title = column.getName();
			var color = column.getColor();
			this.ajax({
				action: "modifyStage",
				columnId: columnId,
				columnName: title,
				columnColor: color
			}, function (data) {
				if (data && data.error) {
					this?.stageAnalyticsLabels.sendRenameFailure();
					BX.Kanban.Utils.showErrorDialog(data.error, data.fatal);
				} else {
					this?.stageAnalyticsLabels.sendRenameSuccess();
					this.resetActionPanel();
				}
			}.bind(this), function (error) {
				this?.stageAnalyticsLabels.sendRenameFailure();
				BX.Kanban.Utils.showErrorDialog("Error: " + error, true);
			}.bind(this));
		}

		/**
		 * Hook on column move.
		 * @param {BX.Kanban.Column} column
		 * @param {BX.Kanban.Column} [targetColumn]
		 * @returns {void}
		 */
		onColumnMoved(column, targetColumn) {
			var columnId = column.getId();
			var afterColumn = this.getPreviousColumnSibling(column);
			var afterColumnId = afterColumn ? afterColumn.getId() : 0;
			this.ajax({
				action: "modifyStage",
				columnId: columnId,
				afterColumnId: afterColumnId
			}, function (data) {
				if (data && data.error) {
					this?.stageAnalyticsLabels.sendUpdateFailure();
					BX.Kanban.Utils.showErrorDialog(data.error, true);
				} else {
					this?.stageAnalyticsLabels.sendUpdateSuccess();
					this.resetActionPanel();
				}
			}.bind(this), function (error) {
				this?.stageAnalyticsLabels.sendUpdateFailure();
				BX.Kanban.Utils.showErrorDialog("Error: " + error, true);
			}.bind(this));
		}

		/**
		 * Hook on main filter applied.
		 * @param {String} filterId
		 * @param {Object} values
		 * @param {Object} filterInstance
		 * @param {BX.Promise} promise
		 * @param {Object} params
		 * @returns {void}
		 */
		onApplyFilter(filterId, values, filterInstance, promise, params) {
			this.clearItemMoving();
			this.fadeOut();
			if (main_core.Type.isObject(params)) {
				params.autoResolve = false;
			}
			this.ajax({
				action: 'get'
			}, data => {
				const gridData = this.getData();
				if (!main_core.Type.isUndefined(data.customFields)) {
					gridData.customFields = data.customFields;
				}
				if (main_core.Type.isArray(data.customEditFields)) {
					gridData.customEditFields = data.customEditFields;
				}
				if (main_core.Type.isBoolean(data.shouldShowTooltips)) {
					gridData.itemsConfig.shouldShowTooltips = data.shouldShowTooltips;
				}
				if (main_core.Type.isObject(data.config) && Object.keys(data.config).length > 0) {
					Object.keys(data.config).forEach(key => {
						const configRow = data.config[key];
						if (main_core.Type.isArrayFilled(configRow) || main_core.Type.isObject(configRow) && Object.keys(configRow).length > 0 || main_core.Type.isBoolean(configRow)) {
							gridData.itemsConfig[key] = configRow;
						}
					});
				}
				this.setData(gridData);
				this.destroyFieldsSelectPopup();
				this.destroyHideColumnSumPopups();
				const exist = [];
				let id = null;
				let columns = this.getColumns();
				for (let i = 0, c = columns.length; i < c; i++) {
					id = columns[i].getId();
					exist.push(id);
					this.removeColumn(id);
				}
				this.removeItems();
				this.loadData(data);
				const dropZone = this.getDropZoneArea();
				const dropZones = this.getDropZoneArea().getDropZones();
				for (let i = 0, c = dropZones.length; i < c; i++) {
					dropZone.removeDropZone(dropZones[i]);
				}
				if (data.dropzones) {
					for (let i = 0, c = data.dropzones.length; i < c; i++) {
						dropZone.addDropZone(data.dropzones[i]);
					}
				}

				// check for new columns and scroll to it
				let newColumn = null;
				columns = this.getColumns();
				for (let i = 0, c = columns.length; i < c; i++) {
					id = columns[i].getId();
					if (!BX.util.in_array(id, exist)) {
						newColumn = columns[i];
					}
				}
				if (newColumn !== null) {
					this.addClassEar();
				}
				this.fadeIn();
				this.resetMultiSelectMode();
				setTimeout(() => {
					if (this.hasOnlyNotVisibleColumnsWithItems()) {
						this.showHintForNotVisibleItems();
					}
				}, 20);
				if (typeof promise !== "undefined") {
					promise.fulfill();
				}
			}, error => {
				if (typeof promise !== "undefined") {
					promise.reject();
				}
				this.fadeIn();
			});
		}
		handleHintForNotVisibleColumns() {
			if (this.hintForNotVisibleItems || !this.hasOnlyNotVisibleColumnsWithItems()) {
				return;
			}
			this.showHintForNotVisibleItems();
		}
		hasOnlyNotVisibleColumnsWithItems() {
			const columns = this.getColumns();
			let result = false;
			for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
				const column = columns[columnIndex];
				const isColumnHaveItems = column.items.filter(item => item.id > -1).length > 0;
				if (!isColumnHaveItems) {
					continue;
				}
				if (this.isVisibleColumn(column)) {
					result = false;
					break;
				} else {
					result = true;
				}
			}
			return result;
		}
		isVisibleColumn(column) {
			if (!column || !this.layout.gridContainer) {
				return false;
			}
			const gridContainerPos = main_core.Dom.getPosition(this.layout.gridContainer);
			const columnPos = main_core.Dom.getPosition(column.layout.container);
			return columnPos.left < gridContainerPos.right;
		}
		showHintForNotVisibleItems() {
			if (this.hintForNotVisibleItems) {
				return;
			}
			const entityType = this.getData().entityType;
			const hintTitle = main_core.Loc.getMessage(`CRM_GRID_HINT_FOR_NOT_VISIBLE_${entityType}_TITLE`) || main_core.Loc.getMessage(`CRM_GRID_HINT_FOR_NOT_VISIBLE_${entityType}_TITLE_MSGVER_1`) || main_core.Loc.getMessage('CRM_GRID_HINT_FOR_NOT_VISIBLE_ELEMENT_TITLE');
			const hintText = main_core.Loc.getMessage(`CRM_GRID_HINT_FOR_NOT_VISIBLE_${entityType}_TEXT`) || main_core.Loc.getMessage(`CRM_GRID_HINT_FOR_NOT_VISIBLE_${entityType}_TEXT_MSGVER_1`) || main_core.Loc.getMessage('CRM_GRID_HINT_FOR_NOT_VISIBLE_ELEMENT_TEXT');
			this.hintForNotVisibleItems = new ui_tour.Guide({
				onEvents: true,
				simpleMode: true,
				steps: [{
					target: '.main-kanban-ear-right',
					title: hintTitle,
					text: hintText,
					position: 'left'
				}]
			});
			this.hintForNotVisibleItems.showNextStep();
			this.adjustHintForNotVisibleItems();
			this.handleHideHintForNotVisibleItems = this.hideHintForNotVisibleItems.bind(this);
			main_core.Event.bind(window, 'scroll', this.handleHideHintForNotVisibleItems);
			main_core.Event.bind(this.layout.gridContainer, 'scroll', this.handleHideHintForNotVisibleItems);
			BX.addCustomEvent('BX.Main.Filter:apply', this.handleHideHintForNotVisibleItems);
			this.addClassEar();
		}
		hideHintForNotVisibleItems() {
			if (this.hintForNotVisibleItems) {
				main_core.Event.unbind(this.layout.gridContainer, 'scroll', this.handleHideHintForNotVisibleItems);
				main_core.Event.unbind(window, 'scroll', this.handleHideHintForNotVisibleItems);
				this.hintForNotVisibleItems.close();
				this.hintForNotVisibleItems = null;
			}
		}
		adjustHintForNotVisibleItems() {
			if (!this.hintForNotVisibleItems) {
				return;
			}
			const popup = this.hintForNotVisibleItems.getPopup();
			const bindElementPos = main_core.Dom.getPosition(popup.bindElement);
			const {
				width: popupWidth
			} = main_core.Dom.getPosition(popup.getPopupContainer());
			const angleHeight = 18;
			const angleWidth = 13;
			const angleOffset = 16;
			const newTopPos = bindElementPos.top + bindElementPos.height / 2 - angleHeight / 2 - angleOffset + 'px';
			const newLeftPos = bindElementPos.left - popupWidth - angleWidth + 'px';
			main_core.Dom.style(popup.getPopupContainer(), 'top', newTopPos);
			main_core.Dom.style(popup.getPopupContainer(), 'left', newLeftPos);
		}
		adjustLayout() {
			super.adjustLayout(...arguments);
			this.adjustHintForNotVisibleItems();
		}
		clearItemMoving() {
			this.itemMoving = null;
		}

		/**
		 * Add ears.
		 * @returns {void}
		 */
		addClassEar() {
			var ear = document.querySelector(".main-kanban-ear-right");
			ear.classList.contains("crm-kanban-ear-animate") ? main_core.Dom.removeClass("crm-kanban-ear-animate") : null;
			main_core.Dom.addClass(ear, "crm-kanban-ear-animate");
		}

		/**
		 * Show or hide contact center.
		 *
		 * @param {BX.Main.Menu} menu
		 *
		 * @return {void}
		 */
		toggleCC(menu) {
			let subSection = this._analyticsDictionary.SUB_SECTION_GRID_ROW_MENU;
			let element = this._analyticsDictionary.ELEMENT_HIDE_CONTACT_CENTER;
			if (menu === undefined) {
				menu = main_popup.MenuManager.getCurrentMenu();
				subSection = this._analyticsDictionary.SUB_SECTION_KANBAN;
				element = this._analyticsDictionary.ELEMENT_CLOSE_BUTTON;
			}
			if (menu) {
				menu.close();
			}
			if (this.ccItem) {
				var gridData = this.getData();
				if (gridData.contactCenterShow) {
					this.hideItem(this.ccItem);
					this.registerAnalyticsSpecialItemCloseEvent(this.ccItem, subSection, element);
				} else {
					this.unhideItem(this.ccItem);
					this.registerAnalyticsSpecialItemEnableEvent(this.ccItem, this._analyticsDictionary.SUB_SECTION_GRID_ROW_MENU, this._analyticsDictionary.ELEMENT_ENABLE_CONTACT_CENTER);
				}
				gridData.contactCenterShow = !gridData.contactCenterShow;
				if (menu) {
					menu.removeMenuItem('crm_kanban_cc_delimiter');
					menu.removeMenuItem('crm_kanban_cc');
				}
			}
			this.ajax({
				action: "toggleCC"
			}, function () {}.bind(this), function (error) {}.bind(this));
		}

		/**
		 * Hide REST demo block.
		 * @return {void}
		 */
		toggleRest() {
			if (this.restItem) {
				this.hideItem(this.restItem);
			}
			this.ajax({
				action: "toggleRest"
			}, function () {}.bind(this), function (error) {}.bind(this));
		}

		/**
		 *
		 * @param {BX.Kanban.Item|string|number} item
		 * @returns {boolean}
		 */
		unhideItem(item) {
			const result = this.unhideItemWithoutColumnRender(item);
			if (result) {
				item.getColumn().render();
			}
			return result;
		}

		/**
		 *
		 * @param {BX.Kanban.Item|string|number} item
		 * @returns {boolean}
		 */
		unhideItemWithoutColumnRender(item) {
			item = this.getItem(item);
			if (!item || item.isVisible()) {
				return false;
			}
			item.setOptions({
				visible: true
			});
			if (item.layout.container && main_core.Dom.hasClass(item.layout.container, 'main-kanban-item-disabled')) {
				main_core.Dom.removeClass(item.layout.container, 'main-kanban-item-disabled');
			}
			if (item.isCountable()) {
				item.getColumn().incrementTotal();
			}
			return true;
		}

		/**
		 * Add menu item for show popup for select additional fields.
		 * @param {Strings} menuId
		 * @return {void}
		 */
		addMenuAdditionalFields(menuId) {
			var menu = main_popup.MenuManager.getCurrentMenu(menuId);
			var menuItems = menu.getMenuItems();
			if (menu && menuItems && menu.bindElement && BX(menu.bindElement) && BX.hasClass(BX(menu.bindElement), "ui-btn-icon-setting")) {
				var itemId = menuItems.length > 0 ? menuItems[0].getId() : 0;
				const newMenuItems = [{
					text: main_core.Loc.getMessage('CRM_KANBAN_SETTINGS_FIELDS_VIEW'),
					onclick: () => this.showFieldsSelectPopup('view')
				}];
				if (this.getData().entityType !== 'ORDER') {
					newMenuItems.push({
						text: main_core.Loc.getMessage("CRM_KANBAN_SETTINGS_FIELDS_EDIT"),
						onclick: () => {
							this.loadHiddenQuickEditorForFirstColumn();
							this.showFieldsSelectPopup('edit');
						}
					});
				}
				menu.addMenuItem({
					text: main_core.Loc.getMessage("CRM_KANBAN_SETTINGS_TITLE"),
					items: newMenuItems
				}, itemId);
			}
		}
		loadHiddenQuickEditorForFirstColumn() {
			const firstColumnId = this.columnsOrder[0]?.id;
			if (firstColumnId) {
				this.columns[firstColumnId].showQuickEditor(true);
			}
		}

		/**
		 * Add menu item for show or hide contact center block.
		 * @param {Strings} menuId
		 * @return {void}
		 */
		addMenuToggleCS(menuId) {
			var gridData = this.getData();
			var menu = main_popup.MenuManager.getCurrentMenu(menuId);
			if (menu && menu.bindElement && BX(menu.bindElement) && BX.hasClass(BX(menu.bindElement), "ui-btn-icon-setting")) {
				menu.addMenuItem({
					text: "",
					delimiter: true
				}, null);
				menu.addMenuItem({
					text: gridData.contactCenterShow ? main_core.Loc.getMessage("CRM_KANBAN_HIDE_CC") : main_core.Loc.getMessage("CRM_KANBAN_SHOW_CC"),
					onclick: function (e, /*BX.PopupMenuItem*/item) {
						//item.layout.text.textContent for change text if need
						this.toggleCC();
					}.bind(this)
				}, null);
			}
		}
		getQuickEditor() {
			var columns = this.getColumns();
			for (var i = 0, c = columns.length; i < c; i++) {
				var columnEditor = columns[i].getQuickEditor();
				if (columnEditor) {
					return columnEditor;
				}
			}
			return null;
		}
		getColumnWithOpenEditor(excludeColumn) {
			const columns = this.getColumns();
			for (let i = 0; i < columns.length; i++) {
				if (columns[i] !== excludeColumn && columns[i].editorOpen) {
					return columns[i];
				}
			}
			return null;
		}

		/**
		 * Show popup for selecting fields which must show in view / edit.
		 * @param {string} viewType
		 */
		showFieldsSelectPopup(viewType) {
			if (this.fieldsSelectors[viewType]) {
				this.fieldsSelectors[viewType].show();
				return;
			}
			main_core.Runtime.loadExtension('ui.dialogs.checkbox-list').then(() => {
				const gridData = this.getData();
				const columnEditor = this.getQuickEditor();
				let selectedFields = viewType === 'view' ? gridData.customFields : gridData.customEditFields;
				if (columnEditor && viewType === 'edit') {
					const section = columnEditor.getControlById('main');
					const sectionFields = section.getChildren();
					if (BX.Type.isArray(sectionFields)) {
						selectedFields = sectionFields.map(field => field.getId());
						gridData.customEditFields = selectedFields;
						this.setData(gridData);
					}
				}
				this.fetchFields(viewType, gridData.entityType, selectedFields, {
					categoryId: gridData.params?.CATEGORY_ID ?? 0
				}).then(data => {
					this.fieldsSelectors[viewType] = this.createFieldsSelector(viewType, data);
					this.fieldsSelectors[viewType].show();
				});
			});
		}
		fetchFields(viewType, entityType, selectedFields, params = {}) {
			return new Promise(resolve => {
				main_core.ajax.runComponentAction('bitrix:crm.kanban', 'getPreparedFields', {
					mode: 'ajax',
					data: {
						entityType,
						viewType,
						selectedFields,
						params
					}
				}).then(({
					status,
					data
				}) => {
					if (status === 'success') {
						resolve(data);
						return;
					}
					console.error(`Fields for ${entityType} not fetched`);
				}, () => {
					console.error(`Fields for ${entityType} not fetched`);
				});
			});
		}

		/**
		 * @param {string} viewType
		 * @param {{sections: Object, categories: Object, options: Object}} data
		 * @returns {CheckboxList}
		 */
		createFieldsSelector(viewType, data) {
			const columnCount = 3;
			const title = main_core.Loc.getMessage(`CRM_KANBAN_CUSTOM_FIELDS_${viewType.toUpperCase()}`);
			const placeholder = main_core.Loc.getMessage('CRM_EDITOR_FIELD_SEARCH_PLACEHOLDER');
			const emptyStateTitle = main_core.Loc.getMessage('CRM_EDITOR_FIELD_EMPTY_STATE_TITLE');
			const emptyStateDescription = main_core.Loc.getMessage('CRM_EDITOR_FIELD_EMPTY_STATE_DESCRIPTION');
			const allSectionsDisabledTitle = main_core.Loc.getMessage('CRM_EDITOR_FIELD_ALL_SECTIONS_DISABLED');
			const {
				sections,
				categories,
				options
			} = data;
			return new BX.UI.CheckboxList({
				columnCount,
				lang: {
					title,
					placeholder,
					emptyStateTitle,
					emptyStateDescription,
					allSectionsDisabledTitle
				},
				sections,
				categories,
				options,
				params: {
					destroyPopupAfterClose: false
				},
				events: {
					onApply: event => this.onApplyCheckboxList(viewType, event.data.fields, options)
				}
			});
		}

		/**
		 * @param {string} viewType
		 * @param {string[]} fields
		 * @param {Object[]} options
		 */
		onApplyCheckboxList(viewType, fields, options) {
			const preparedFields = {};
			fields.forEach(field => {
				const optionField = options.find(option => option.id === field);
				preparedFields[field] = optionField?.title;
			});
			let oldValues;
			const gridData = this.getData();
			if (viewType === 'view') {
				oldValues = gridData.customFields;
				gridData.customFields = Object.keys(preparedFields);
			} else {
				oldValues = gridData.customEditFields;
				gridData.customEditFields = Object.keys(preparedFields);
			}
			this.ajax({
				action: 'saveFields',
				fields: preparedFields,
				type: viewType
			}, () => this.onSuccessFieldsSave(viewType, oldValues));
		}

		/**
		 * @param {string} viewType
		 * @param {string[]} oldValues
		 */
		onSuccessFieldsSave(viewType, oldValues) {
			if (viewType === 'view') {
				this.onApplyFilter();
				return;
			}
			const gridData = this.getData();
			this.applyCustomEditFields(gridData.customEditFields, oldValues);
		}
		applyCustomEditFields(newFields, oldFields) {
			var sectionEditor = this.getQuickEditor().getControlById("main");
			var fieldsToAdd = newFields.filter(function (fieldName) {
				return oldFields.indexOf(fieldName) < 0 && sectionEditor.getChildById(fieldName) === null;
			});
			var fieldsToRemove = oldFields.filter(function (fieldName) {
				return newFields.indexOf(fieldName) < 0 && sectionEditor.getChildById(fieldName) !== null;
			});
			// gets editor from each column and add new fields
			var columns = this.getColumns();
			for (var i = 0; i < columns.length; i++) {
				var columnEditor = columns[i].getQuickEditor();
				if (!columnEditor) {
					continue;
				}
				var element;
				// add new fields
				for (var j = 0; j < fieldsToAdd.length; j++) {
					element = columnEditor.getAvailableSchemeElementByName(fieldsToAdd[j]);
					if (element) {
						var field = columnEditor.createControl(element.getType(), element.getName(), {
							schemeElement: element,
							model: columnEditor._model,
							mode: columnEditor._mode
						});
						if (field) {
							columnEditor.getControlById("main").addChild(field, {
								layout: {
									forceDisplay: true
								},
								enableSaving: false
							});
						}
					}
				}
				// remove old fields
				for (var k = 0; k < fieldsToRemove.length; k++) {
					element = columnEditor.getSchemeElementByName(fieldsToRemove[k]);
					if (element) {
						var section = columnEditor.getControlById("main");
						var control = section.getChildById(fieldsToRemove[k]);
						if (control) {
							section.removeChild(control, {
								enableSaving: false
							});
						}
					}
				}
				columnEditor.commitSchemeChanges();
			}
			this.getQuickEditor().saveSchemeChanges().then(function () {
				for (var i = 0; i < columns.length; i++) {
					var columnEditor = columns[i].getQuickEditor();
					if (columnEditor) {
						columnEditor.refreshLayout();
					}
				}
			});
		}
		destroyFieldsSelectPopup() {
			var customFieldsPopup = BX.Main.PopupManager.getPopupById("kanban_custom_fields");
			if (customFieldsPopup) {
				customFieldsPopup.destroy();
			}
		}
		destroyHideColumnSumPopups() {
			this.getColumns().forEach(column => {
				main_popup.PopupManager.getPopupById(column.getHideColumnSumPopupId())?.destroy();
			});
		}

		/**
		 * Handler partial editor close.
		 * @param {BX.Crm.PartialEditorDialog} sender
		 * @param {Object} eventParams
		 * @return void
		 */
		onPartialEditorClose(sender, eventParams) {
			main_core.Dom.removeClass(this.itemMoving.item.layout.container, "main-kanban-item-waiting");
			if (eventParams.isCancelled) {
				return;
			}
			var stilError = false;
			// update required fields
			if (eventParams.entityData) {
				var itemData = this.itemMoving.item.getData();
				var newColumnId = this.itemMoving.newColumn.getId();
				const requiredKeys = this.getRequiredFieldsForColumnId(newColumnId, itemData);
				if (main_core.Type.isArrayFilled(requiredKeys)) {
					let itrError = false;
					const deletedFM = {};
					const requiredFmFields = ['PHONE', 'EMAIL', 'IM', 'WEB'];
					requiredFmFields.forEach(fieldName => {
						if (eventParams.entityData[fieldName]) {
							itemData.required_fm[fieldName] = false;
							deletedFM[fieldName] = true;
						}
					});
					for (var i = 0, c = requiredKeys.length; i < c; i++) {
						var key = requiredKeys[i];
						if (deletedFM[key]) {
							itrError = false;
						} else if (eventParams.entityData[key] && (typeof eventParams.entityData[key] === "object" && eventParams.entityData[key].IS_EMPTY === false || typeof eventParams.entityData[key] !== "object" && eventParams.entityData[key] !== "")) {
							itrError = false;
						} else if (key === "OPPORTUNITY_WITH_CURRENCY" && parseFloat(eventParams.entityData["OPPORTUNITY"]) > 0) {
							this.itemMoving.item.setDataKey("runtimePrice", true);
							itrError = false;
						} else if (key === "CLIENT" && (parseInt(eventParams.entityData["CONTACT_ID"]) > 0 || parseInt(eventParams.entityData["COMPANY_ID"]) > 0)) {
							itrError = false;
						} else if (key === "FILES" && main_core.Type.isArray(eventParams.entityData['STORAGE_ELEMENT_IDS']) && eventParams.entityData['STORAGE_ELEMENT_IDS'].reduce(function (a, b) {
							return a + b;
						}, 0) > 0) {
							itrError = false;
						} else if (key === "OBSERVER" && eventParams.entityData["OBSERVER_IDS"].length) {
							itrError = false;
						} else {
							itrError = true;
						}
						if (!itrError) {
							// @todo
							for (var kStatus in itemData.required) {
								var stRequired = itemData.required[kStatus];
								for (var ii = 0, cc = stRequired.length; ii < cc; ii++) {
									if (stRequired[ii] === key) {
										stRequired = BX.util.deleteFromArray(stRequired, ii);
										break;
									}
								}
								itemData.required[kStatus] = stRequired;
							}
						} else {
							stilError = true;
						}
					}
					// save new data
					this.itemMoving.item.setDataKey('required', itemData.required);
					this.itemMoving.item.setDataKey('required_fm', this.itemMoving.item.getRequiredFm());

					// @todo #015661 it may be necessary to rollback commit after merging with mobile/crm
					if (eventParams.entityData["OPPORTUNITY_ACCOUNT"]) {
						this.itemMoving.price = parseFloat(eventParams.entityData["OPPORTUNITY_ACCOUNT"]);
						this.itemMoving.item.setDataKey("price", this.itemMoving.price);
						this.itemMoving.item.setDataKey("price_formatted", eventParams.entityData["FORMATTED_OPPORTUNITY_ACCOUNT_WITH_CURRENCY"]);
					}
				}
			}
			// if drop area
			if (this.itemMoving.newColumn instanceof BX.Kanban.DropZone) {
				this.itemMoving.newColumn.captureItem(this.itemMoving.item);
			} else {
				// // move visual and save
				// this.onItemMoved(
				// 	this.itemMoving.item,
				// 	this.itemMoving.newColumn,
				// 	this.itemMoving.newNextSibling
				// );
				if (!stilError) {
					if (this.itemMoving?.oldColumn?.id) {
						this.itemMoving.item.columnId = this.itemMoving.oldColumn.id;
					}
					this.moveItem(this.itemMoving.item, this.itemMoving.newColumn, this.itemMoving.newNextSibling);
				}
			}
		}

		/**
		 * @param {string} columnId
		 * @param {Object} itemData
		 * @returns {string[]}
		 */
		getRequiredFieldsForColumnId(columnId, itemData) {
			return [...(itemData.required?.[columnId] ?? []), ...(itemData.required?.ALL ?? [])];
		}

		/**
		 * Hook on pull event.
		 * @param {String} command
		 * @param {Object} params
		 * @returns {void}
		 */
		onPullEventHandlerCrm(command, params) {
			var gridData = this.getData();

			// new activity
			// if (command === "activity_add" && /*params.COMPLETED !== "Y" &&*/
			// 	params.OWNER_TYPE_NAME === gridData.entityType
			// )
			// {
			// 	var item = this.getItem(params.OWNER_ID);
			// 	if (item)
			// 	{
			// 		this.loadNew(item.getId());
			// 	}
			// 	else
			// 	{
			// 		this.loadNew();
			// 	}
			// }

			// new element by delegate
			if (command === "notify") {
				// lead / deal
				// var matches = params.originalTag.match(
				// 	new RegExp("CRM\\|" + gridData.entityType + "_RESPONSIBLE\\|([\\d]+)")
				// );
				// if (matches && matches[1])
				// {
				// 	this.loadNew(matches[1]);
				// }
				// invoice
				if (gridData.entityType === "INVOICE" && params.settingName === "crm|invoice_responsible_changed") {
					var matches = params.originalTag.match(new RegExp("CRM\\|" + gridData.entityType + "\\|([\\d]+)"));
					if (matches && matches[1]) {
						this.loadNew(matches[1]);
					}
				}
			}
		}

		/**
		 * Check on one activity.
		 * @param {Integer} activityId
		 * @param {Integer} ownerId
		 * @param {Integer} ownerTypeId
		 * @param {Boolean} deadlined
		 * @returns {void}
		 */
		onCrmActivityTodoChecked(activityId, ownerId, ownerTypeId, deadlined) {
			const item = this.getItem(ownerId);
			if (!item) {
				return;
			}

			// deadlined counters
			if (deadlined) {
				let activityErrorTotal = item.getActivityErrorTotal();
				activityErrorTotal--;
				item.setDataKey('activityErrorTotal', activityErrorTotal);
			}

			// common counters
			let activityProgress = item.getActivityProgress();
			activityProgress--;
			item.setDataKey('activityProgress', activityProgress);
			item.switchPlanner();
		}

		/**
		 * On slider close.
		 * @param {BX.SidePanel.Event} SliderEvent
		 * @returns {void}
		 */
		onSliderClose(SliderEvent) {
			var gridData = this.getData();
			var maskUrl = gridData.entityPath;
			var sliderUrl = SliderEvent.slider.getUrl();
			maskUrl = maskUrl.replace(/\#([^\#]+)\#/, '([\\d]+)');
			var match = sliderUrl.match(new RegExp(maskUrl));
			if (match && match[1]) {
				this.loadNew(match[1], false, true, true, true);
			}
		}

		/**
		 * On popup show.
		 * @param {BX.PopupWindow} popupWindow
		 * @returns {void}
		 */
		onPopupShow(popupWindow) {
			if (this.isPopupInKanbanColumn(popupWindow)) {
				if (this.handleScrollWithOpenPopupInKanbanColumn) {
					this.onPopupClose();
				}
				this.handleScrollWithOpenPopupInKanbanColumn = e => {
					popupWindow.close();
				};
				BX.Event.EventEmitter.subscribe(this, 'Kanban.Column:onScroll', this.handleScrollWithOpenPopupInKanbanColumn);
				main_core.Event.bind(window, 'scroll', this.handleScrollWithOpenPopupInKanbanColumn);
				main_core.Event.bind(this.layout.gridContainer, 'scroll', this.handleScrollWithOpenPopupInKanbanColumn);
			}
			var kanbanSettingsClasses = ['menu-popup-toolbar_lead_list_menu', 'menu-popup-toolbar_deal_list_menu', 'menu-popup-toolbar_order_kanban_menu', 'menu-popup-toolbar_quote_list_menu'];
			var notCsClasses = ['menu-popup-toolbar_order_kanban_menu', 'menu-popup-toolbar_quote_list_menu'];
			var newKanbanSettingsClasses = ['toolbar_lead_list_settings_menu', 'toolbar_deal_list_settings_menu'];

			// add some menu item
			if (kanbanSettingsClasses.indexOf(popupWindow.uniquePopupId) !== -1) {
				var popupId = popupWindow.uniquePopupId.substr(11);
				this.addMenuAdditionalFields(popupId);
				if (notCsClasses.indexOf(popupWindow.uniquePopupId) === -1) {
					this.addMenuToggleCS(popupId);
				}
			} else if (newKanbanSettingsClasses.indexOf(popupWindow.uniquePopupId) !== -1) {
				var settingsButtonMenu = this.getSettingsButtonMenu();
				if (settingsButtonMenu !== null) {
					var gridData = this.getData();
					settingsButtonMenu.addMenuItem({
						id: 'crm_kanban_cc_delimiter',
						delimiter: true
					}, null);
					settingsButtonMenu.addMenuItem({
						id: 'crm_kanban_cc',
						text: gridData.contactCenterShow ? main_core.Loc.getMessage("CRM_KANBAN_HIDE_CC") : main_core.Loc.getMessage("CRM_KANBAN_SHOW_CC"),
						onclick: function (event) {
							this.toggleCC(settingsButtonMenu);
						}.bind(this)
					}, null);
				}
			}
		}

		/**
		 * On popup close.
		 * @returns {void}
		 */
		onPopupClose() {
			if (this.handleScrollWithOpenPopupInKanbanColumn) {
				BX.Event.EventEmitter.unsubscribe(this, 'Kanban.Column:onScroll', this.handleScrollWithOpenPopupInKanbanColumn);
				main_core.Event.unbind(window, 'scroll', this.handleScrollWithOpenPopupInKanbanColumn);
				main_core.Event.unbind(this.layout.gridContainer, 'scroll', this.handleScrollWithOpenPopupInKanbanColumn);
				this.handleScrollWithOpenPopupInKanbanColumn = null;
			}
		}

		/**
		 * Is popup kanban column.
		 * @param {BX.PopupWindow} popupWindow
		 * @returns {boolean}
		 */
		isPopupInKanbanColumn(popupWindow) {
			const kanbanColumnClassname = 'main-kanban-column';
			let kanbanColumnElem = popupWindow.bindElement;
			const isTourPopup = BX.hasClass(popupWindow.popupContainer, 'popup-window-ui-tour');
			if (isTourPopup) {
				return false;
			}
			while (kanbanColumnElem && !main_core.Dom.hasClass(kanbanColumnElem, kanbanColumnClassname)) {
				kanbanColumnElem = kanbanColumnElem.parentNode;
			}
			return !!kanbanColumnElem;
		}

		/**
		 * Set multi select mode.
		 * @returns {void}
		 */
		setMultiSelectMode() {
			this.multiSelectMode = true;
			this.setKanbanDragMode();
		}

		/**
		 * Build the action panel.
		 */
		initActionPanel() {
			var gridData = this.getData();
			var renderToNode = document.querySelector(".page-navigation");
			const isAirTemplate = BX.Reflection.getClass('BX.Intranet.Bitrix24.Template') !== null;
			if (!renderToNode) {
				renderToNode = isAirTemplate ? document.querySelector('.crm-kanban-action-panel') : document.getElementById('uiToolbarContainer');
			}
			if (this.customActionPanel) {
				this.customActionPanel.renderTo = renderToNode;
				this.actionPanel = this.customActionPanel;
				this.actionPanel.draw();
				return;
			}
			this.actionPanel = new BX.UI.ActionPanel({
				renderTo: renderToNode,
				removeLeftPosition: true,
				maxHeight: 58,
				parentPosition: "bottom",
				autoHide: false
			});
			this.actionPanel.draw();

			// delete
			this.actionPanel.appendItem({
				id: "kanban_delete",
				text: main_core.Loc.getMessage("CRM_KANBAN_PANEL_DELETE"),
				icon: "/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-delete.svg",
				onclick: () => {
					BX.CRM.Kanban.Actions.deleteAll(this);
				}
			});

			// ignore
			if (this.getTypeInfoParam('canUseIgnoreItemInPanel')) {
				this.actionPanel.appendItem({
					id: "kanban_ignore",
					text: main_core.Loc.getMessage("CRM_KANBAN_PANEL_IGNORE"),
					icon: "/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-ignore.svg",
					onclick: () => {
						BX.CRM.Kanban.Actions.ignore(this);
					}
				});
			}

			/*region Change category*/
			var items = [],
				categories = [],
				columns = this.getColumns(),
				drops = this.getDropZoneArea().getDropZones();
			for (var i = 0, c = columns.length; i < c; i++) {
				categories.push({
					id: columns[i].id,
					name: columns[i].name,
					blockedIncomingMoving: this.isBlockedIncomingMoving(columns[i]),
					type: columns[i].data.type
				});
			}
			for (var i = 0, c = drops.length; i < c; i++) {
				var dropData = drops[i].getData();
				if (gridData.entityType === "LEAD" && dropData.type === "LOOSE" || gridData.entityType !== "LEAD" && dropData.type) {
					categories.push({
						id: drops[i].id,
						name: drops[i].name,
						blockedIncomingMoving: this.isBlockedIncomingMoving(columns[i]),
						type: drops[i].data.type
					});
				}
			}
			for (var i = 0, c = categories.length; i < c; i++) {
				if (categories[i].blockedIncomingMoving) {
					continue;
				}
				items.push({
					id: "kanban_column_" + categories[i].id,
					column: categories[i],
					text: BX.util.htmlspecialchars(categories[i].name),
					onclick: function (i, item) {
						item.menuWindow.close();
						BX.CRM.Kanban.Actions.changeColumn(this, item.column);
					}.bind(this)
				});
			}
			this.actionPanel.appendItem({
				id: "kanban_column",
				text: main_core.Loc.getMessage("CRM_KANBAN_PANEL_STAGE"),
				items: items,
				icon: gridData.entityType === "DEAL" || gridData.isDynamicEntity ? "/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-stage.svg" : "/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-status.svg"
			});
			/* endregion */

			this.appendChangeCategoryItem();
			this.appendAssignedItem();

			// create task
			if (this.getTypeInfoParam('canUseCreateTaskInPanel')) {
				this.actionPanel.appendItem({
					id: "kanban_task",
					text: main_core.Loc.getMessage("CRM_KANBAN_PANEL_TASK"),
					icon: "/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-create.svg",
					onclick: function () {
						BX.CRM.Kanban.Actions.task(this);
					}.bind(this)
				});
			}
			if (this.getTypeInfoParam('canUseCallListInPanel')) {
				// call list
				this.actionPanel.appendItem({
					id: "kanban_calllist",
					text: main_core.Loc.getMessage("CRM_KANBAN_PANEL_CALLLIST"),
					icon: "/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-call.svg",
					onclick: function () {
						BX.CRM.Kanban.Actions.startCallList(this, false);
					}.bind(this)
				});
			}

			// merge
			if (this.getTypeInfoParam('canUseMergeInPanel')) {
				this.actionPanel.appendItem({
					id: "kanban_merge",
					text: main_core.Loc.getMessage("CRM_KANBAN_PANEL_MERGE"),
					icon: "/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-merge.svg",
					onclick: function () {
						BX.CRM.Kanban.Actions.merge(this);
					}.bind(this)
				});
			}
			if (this.getTypeInfoParam('canUseRestartAutomationInPanel')) {
				this.appendRestartAutomationAction();
			}
		}
		appendChangeCategoryItem() {
			const gridData = this.getData();
			if (!main_core.Type.isArrayFilled(gridData?.categories)) {
				return;
			}
			const items = [];
			gridData.categories.forEach(category => {
				items.push({
					id: `kanban_category_${category.ID}`,
					category,
					text: main_core.Text.encode(category.NAME),
					onclick: (i, item) => {
						item.menuWindow.close();
						BX.CRM.Kanban.Actions.changeCategory(this, item.category);
					}
				});
			});
			this.actionPanel.appendItem({
				id: 'kanban_category',
				text: main_core.Loc.getMessage('CRM_KANBAN_PANEL_CATEGORY2'),
				icon: '/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-fulling.svg',
				items
			});
		}
		appendRestartAutomationAction() {
			this.actionPanel.appendItem({
				id: 'kanban_restart_automation',
				text: main_core.Loc.getMessage('CRM_KANBAN_PANEL_RESTART_AUTOMATION'),
				icon: '/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-restartautomation.svg',
				onclick: () => {
					const ids = this.getCheckedId();
					if (!main_core.Type.isArrayFilled(ids)) {
						return;
					}
					new RestartAutomationAction(this, {
						ids
					}).execute();
				}
			});
		}
		appendAssignedItem() {
			if (main_core.Type.isUndefined(BX.UI.EntityEditorUserSelector)) {
				return;
			}
			this.actionPanel.appendItem({
				id: 'kanban_assigned',
				text: main_core.Loc.getMessage('CRM_KANBAN_PANEL_ASSIGNED'),
				icon: '/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-responsible.svg',
				onclick: (event, item) => {
					setTimeout(() => {
						const targetNode = main_core.Type.isUndefined(item.layout.container) ? item.actionPanel.layout.more : item.layout.container;
						this.getResponsibleUserSelectorDialog(targetNode).show();
					}, 100);
				}
			});
		}
		getResponsibleUserSelectorDialog(targetNode) {
			return new ui_entitySelector.Dialog({
				id: 'crm-kanban-responsible-user-selector-dialog',
				targetNode,
				context: 'CRM_KANBAN_RESPONSIBLE_USER',
				multiple: false,
				enableSearch: true,
				width: 450,
				entities: [{
					id: 'user',
					options: {
						inviteEmployeeLink: false,
						emailUsers: false,
						inviteGuestLink: false,
						intranetUsersOnly: true
					}
				}, {
					id: 'structure-node',
					options: {
						selectMode: 'usersOnly'
					}
				}],
				events: {
					'Item:onSelect': event => {
						this.onResponsibleUserSelect(event);
					}
				},
				popupOptions: {
					className: 'responsible-user-selector-dialog'
				}
			});
		}
		onResponsibleUserSelect(event) {
			const {
				item: selectedItem
			} = event.getData();
			if (selectedItem) {
				BX.CRM.Kanban.Actions.setAssigned(this, {
					entityId: selectedItem.getId(),
					name: main_core.Text.encode(selectedItem.getTitle())
				});
			}
		}
		isBlockedIncomingMoving(column) {
			return column && column.data && column.data.blockedIncomingMoving || false;
		}
		hideUiToolbarContainer() {
			var uiToolbarContainer = document.getElementById('uiToolbarContainer');
			main_core.Dom.addClass(uiToolbarContainer, '--transparent');
		}
		showUiToolbarContainer() {
			var uiToolbarContainer = document.getElementById('uiToolbarContainer');
			main_core.Dom.removeClass(uiToolbarContainer, '--transparent');
		}

		/**
		 * Show action panel.
		 * @returns {void}
		 */
		startActionPanel() {
			if (!this.actionPanel) {
				this.initActionPanel();
			}
			this.actionPanel.showPanel();
		}

		/**
		 * Hide action panel.
		 * @returns {void}
		 */
		stopActionPanel(force = false, resetMultiSelectMode = false) {
			if (!this.actionPanel) {
				return;
			}
			if (force || !this.getChecked().length) {
				this.actionPanel.hidePanel();
			}
		}

		/**
		 * Reset action panel.
		 * @returns {void}
		 */
		resetActionPanel() {
			if (this.actionPanel) {
				this.actionPanel.removeItems();
				this.actionPanel = null;
			}
			if (this.customActionPanel) {
				this.customActionPanel.removeItems();
				this.customActionPanel = null;
			}
		}
		onItemUnselect(itemInArray) {
			this.stopActionPanel();
		}

		/**
		 * @param {BX.UI.ActionPanel} actionPanel
		 */
		setCustomActionPanel(actionPanel) {
			this.customActionPanel = actionPanel;
		}
		reload() {
			this.resetMultiSelectMode();
			this.unSetKanbanDragMode();
			this.onApplyFilter();
		}
		calculateTotalCheckItems() {
			if (!this.actionPanel) {
				this.initActionPanel();
			}
			this.actionPanel.setTotalSelectedItems(this.getChecked().length);
		}
		isMultiSelectMode() {
			return this.multiSelectMode;
		}
		onMultiSelectMode() {
			if (this.multiSelectMode) return;
			this.multiSelectMode = true;
			main_core.Dom.addClass(this.layout.gridContainer, "crm-kanban-multi-select-mode");
		}
		resetMultiSelectMode() {
			for (var i = 0; i < this.getChecked().length; i++) {
				this.getChecked()[i].unSelectItem();
				if (this.getChecked()[i].layout.container && this.getChecked()[i].layout.container.classList.contains("main-kanban-item-disabled")) {
					main_core.Dom.removeClass(this.getChecked()[i].layout.container, "main-kanban-item-disabled");
				}
			}
			this.checkedItems = [];
			this.actionItems = [];
			this.multiSelectMode = false;
			main_core.Dom.removeClass(this.layout.gridContainer, "crm-kanban-multi-select-mode");
		}
		onOpenEditorMenu(editor, eventArgs) {
			// build new items for editor menu
			var menuItems = [],
				editorMenuPopup = null;
			menuItems.push({
				id: menuItems.length + 1,
				text: main_core.Loc.getMessage("CRM_KANBAN_CUSTOM_FIELDS_VIEW"),
				onclick: function () {
					this.showFieldsSelectPopup("view", editor);
				}.bind(this)
			});
			menuItems.push({
				id: menuItems.length + 1,
				text: main_core.Loc.getMessage("CRM_KANBAN_CUSTOM_FIELDS_EDIT"),
				onclick: function () {
					this.showFieldsSelectPopup("edit", editor);
				}.bind(this)
			});
			editorMenuPopup = new main_popup.Menu("crm-kanban-qiuck-form-add-fields-popup", editor._addChildButton, menuItems, {
				autohide: true,
				bindOptions: {
					forceBindPosition: true
				},
				autoHide: true,
				cacheable: false,
				closeByEsc: true
			});
			editorMenuPopup.show();

			// cancel system menu
			eventArgs["cancel"] = true;
		}
		onConfigEditorScopeChange() {
			this.onApplyFilter();
		}
		onConfigEditorReset() {
			this.setAjaxParams({
				editorReset: "Y"
			});
			this.onApplyFilter();
		}
		onForceCommonEditorConfigScopeForAll() {
			this.setAjaxParams({
				editorSetCommon: "Y"
			});
			this.onApplyFilter();
		}
		insertItem(item, params = {}) {
			const columnId = params.hasOwnProperty('newColumnId') ? params.newColumnId : item.columnId;
			const newColumn = this.getColumn(columnId);
			if (newColumn) {
				const sorter = BX.CRM.Kanban.Sort.Sorter.createWithCurrentSortType(newColumn.getItems());
				const beforeItem = sorter.calcBeforeItem(item);
				if (sorter.getSortType() === BX.CRM.Kanban.Sort.Type.BY_LAST_ACTIVITY_TIME && params.canShowLastActivitySortTour) {
					BX.Event.EventEmitter.emit('Kanban.Grid::onShowSortByLastActivityTour', {
						target: ".main-kanban-item[data-id='" + item.id + "']",
						stepId: 'step-sort-by-last-activity-time',
						delay: 1000
					});
				}
				if (item.columnId === newColumn.getId() && beforeItem === null) {
					this.updateItemAtItsPosition(item);
				} else {
					this.moveItem(item, newColumn.getId(), beforeItem);
				}
			} else {
				this.removeItem(item);
			}
		}
		removeItem(itemId) {
			var item = this.getItem(itemId);
			if (item) {
				item.useAnimation = true;
				var column = item.getColumn();
				delete this.items[item.getId()];
				column.removeItem(item);
				item.dispose();
			}
			return item;
		}
		openPartialEditor(itemId, columnId, fieldNames) {
			var gridData = this.getData();
			var context = {};
			var settings = {
				entityTypeId: gridData.entityTypeInt,
				entityId: itemId,
				fieldNames: fieldNames,
				context: context
			};
			context[this.getTypeInfoParam('stageIdKey')] = columnId;
			context['NOT_CHANGE_STATUS'] = 'Y';
			if (this.getTypeInfoParam('useFactoryBasedApproach')) {
				settings.title = main_core.Loc.getMessage('CRM_TYPE_ITEM_PARTIAL_EDITOR_TITLE');
				settings.isController = true;
				settings.entityTypeName = gridData.entityType;
				settings.stageId = columnId;
			} else {
				settings.title = main_core.Loc.getMessage('CRM_TYPE_ITEM_PARTIAL_EDITOR_TITLE');
			}
			this.progressBarEditor = BX.Crm.PartialEditorDialog.create("progressbar-entity-editor", settings);
			window.setTimeout(function () {
				this.progressBarEditor.open();
			}.bind(this), 150);
		}

		/**
		 * @param {string} param
		 */
		getTypeInfoParam(param) {
			var typeInfo = this.getTypeInfo();
			return typeInfo[param] ? typeInfo[param] : false;
		}
		getTypeInfo() {
			return this.getData().typeInfo;
		}

		/**
		 * @returns {BX.Main.Menu|null}
		 */
		getSettingsButtonMenu() {
			const button = crm_toolbarComponent.ToolbarComponent.Instance.getSettingsButton();
			return button ? button.getMenuWindow() : null;
		}
		setCurrentSortType(sortType) {
			return new Promise((resolve, reject) => {
				this.ajax({
					action: 'setCurrentSortType',
					sortType
				}, resolve, reject);
			});
		}
		onToggleTooltipsVisibility() {
			const newVisibilitySetting = !this.shouldShowTooltips();
			this.data.itemsConfig.shouldShowTooltips = newVisibilitySetting;
			BX.userOptions.save('crm', 'should_show_tooltips_kanban', null, newVisibilitySetting ? 1 : 0);
			this.fadeOut();
			location.reload();
		}
		shouldShowTooltips() {
			return this?.data?.itemsConfig?.shouldShowTooltips ?? true;
		}
	}

	/**
	 *
	 * @param options
	 * @extends {BX.Kanban.Item}
	 */
	class Item extends BX.Kanban.Item {
		static messages = {};

		/** @var {BX.CRM.Kanban.Grid} */
		grid = null;
		container = null;
		timer = null;
		popupTooltip = null;
		plannerCurrent = null;
		fieldsWrapper = null;
		badgesWrapper = null;
		footerWrapper = null;
		clientName = null;
		clientNameItems = [];
		useAnimation = false;
		isAnimationInProgress = false;
		changedInPullRequest = false;
		columnChangedInPullRequest = false;
		notChangeTotal = false;
		activityAddingPopup = null;
		ufTooltipNodes = [];
		lastPosition = {
			columnId: null,
			targetId: null
		};
		checked = false;
		constructor(options) {
			super(options);
		}
		setOptions(options) {
			if (!options) {
				return;
			}
			super.setOptions(options);
			this.useAnimation = main_core.Type.isBoolean(options.useAnimation) ? options.useAnimation : false;
		}
		setDataKey(key, val) {
			const data = this.getData();
			data[key] = val;
			this.setData(data);
		}
		getDataKey(key) {
			const data = this.getData();
			return data[key];
		}
		switchClass(el, className, mode) {
			if (mode) {
				main_core.Dom.addClass(el, className);
			} else {
				main_core.Dom.removeClass(el, className);
			}
		}
		switchVisible(element, mode) {
			if (mode) {
				main_core.Dom.style(element, {
					display: ''
				});
			} else {
				main_core.Dom.style(element, {
					display: 'none'
				});
			}
		}
		getLastPosition() {
			return this.lastPosition;
		}
		setLastPosition() {
			const column = this.getColumn();
			const sibling = column.getNextItemSibling(this);
			this.lastPosition = {
				columnId: column.getId(),
				targetId: sibling ? sibling.getId() : 0
			};
		}
		getBodyContainer() {
			if (!this.layout.bodyContainer) {
				this.layout.bodyContainer = main_core.Tag.render`<div class="main-kanban-item-wrapper"></div>`;
			}
			return this.layout.bodyContainer;
		}

		/**
		 * @returns {HTMLElement}
		 */
		render() {
			const data = this.getData();
			const specialType = data.special_type ?? null;
			if (specialType === 'import') {
				return this.getPreparedStartLayout();
			}
			if (specialType === 'rest') {
				return this.getPreparedIndustrySolutionsLayout();
			}
			if (!this.container) {
				this.createLayout();
			}
			if (this.isLayoutFooterEveryRender()) {
				this.layoutFooter();
			}
			this.setBorderColor();
			this.setLink();
			this.setPriceFormattedHtml();
			this.date.textContent = data.date;
			this.setClientName();
			if (this.planner) {
				this.switchPlanner();
			}
			this.prepareContactTypeElements();
			this.appendLastActivity(data);
			if (this.needRenderFields()) {
				this.fieldsWrapper.innerHTML = null;
				this.layoutFields();
			}
			this.layoutBadges();
			return this.container;
		}
		getPreparedStartLayout() {
			const layout = this.getStartLayout();
			this.emitOnSpecialItemDraw(layout);
			this.grid.ccItem = this;
			main_core.Dom.style(this.getBodyContainer(), {
				background: 'none'
			});
			return layout;
		}

		/**
		 * Gets demo block for contact center.
		 * @returns {HTMLElement}
		 */
		getStartLayout() {
			this.getCloseStartLayout();
			const gridData = this.getGridData();
			const mainTitle = main_core.Loc.getMessage('CRM_KANBAN_EMPTY_CARD_CT_TITLE');
			const secondTitle = main_core.Loc.getMessage(`CRM_KANBAN_EMPTY_CARD_CT_TEXT${gridData.entityType}`);
			const cardImportNode = gridData.rights.canImport ? main_core.Tag.render`
					<div>
						<div class="crm-kanban-item-contact-center-title crm-kanban-item-contact-center-title-import">
							${main_core.Loc.getMessage('CRM_KANBAN_EMPTY_CARD_IMPORT_MSGVER_1')}
						</div>
					</div>
				` : null;
			return main_core.Tag.render`
			<div class="crm-kanban-item-contact-center">
				<div class="crm-kanban-sidepanel" data-url="contact_center">
					${this.getCloseStartLayout()}
					<div class="crm-kanban-item-contact-center-title">
						<div class="crm-kanban-item-contact-center-title-item">${mainTitle}</div>
						<div class="crm-kanban-item-contact-center-title-item">${secondTitle}</div>
					</div>
					<div class="crm-kanban-item-contact-center-action">
						<div class="crm-kanban-item-contact-center-action-section">
							<a
								href="#"
								data-url="ol_chat"
								class="crm-kanban-sidepanel crm-kanban-item-contact-center-action-item crm-kanban-item-contact-center-action-item-chat"
							>
								${main_core.Loc.getMessage('CRM_KANBAN_EMPTY_CARD_CT_CHAT')}
							</a>
							<a
								href="#"
								data-url="ol_forms"
								class="crm-kanban-sidepanel crm-kanban-item-contact-center-action-item crm-kanban-item-contact-center-action-item-crm-forms"
							>
								${main_core.Loc.getMessage('CRM_KANBAN_EMPTY_CARD_CT_FORMS')}
							</a>
							<a
								href="#"
								data-url="ol_viber"
								class="crm-kanban-sidepanel crm-kanban-item-contact-center-action-item crm-kanban-item-contact-center-action-item-viber"
							>
								Viber
							</a>
						</div>
						<div class="crm-kanban-item-contact-center-action-section">
							<a
								href="#"
								data-url="telephony"
								class="crm-kanban-sidepanel crm-kanban-item-contact-center-action-item crm-kanban-item-contact-center-action-item-call"
							>
								${main_core.Loc.getMessage('CRM_KANBAN_EMPTY_CARD_CT_PHONES')}
							</a>
							<a
								href="#"
								data-url="email"
								class="crm-kanban-sidepanel crm-kanban-item-contact-center-action-item crm-kanban-item-contact-center-action-item-mail"
							>
								${main_core.Loc.getMessage('CRM_KANBAN_EMPTY_CARD_CT_EMAIL')}
							</a>
							<a
								href="#"
								data-url="ol_telegram"
								class="crm-kanban-sidepanel crm-kanban-item-contact-center-action-item crm-kanban-item-contact-center-action-item-telegram"
							>
								Telegram
							</a>
						</div>
					</div>
				</div>
				${cardImportNode}
			</div>
		`;
		}
		getPreparedIndustrySolutionsLayout() {
			const layout = this.getIndustrySolutionsLayout();
			this.emitOnSpecialItemDraw(layout);
			this.grid.restItem = this;
			return layout;
		}

		/**
		 * Gets REST block.
		 * @returns {Element}
		 */
		getIndustrySolutionsLayout() {
			const importList = ['CRM_KANBAN_REST_DEMO_FILE_IMPORT', 'CRM_KANBAN_REST_DEMO_FILE_EXPORT', 'CRM_KANBAN_REST_DEMO_CRM_MIGRATION', 'CRM_KANBAN_REST_DEMO_MARKET_2_MSGVER_1', 'CRM_KANBAN_REST_DEMO_PUBLICATION_2_MSGVER_1'];
			const importListNode = document.createDocumentFragment();
			importList.forEach((code, index) => {
				const className = `crm-kanban-item-industry-list-item crm-kanban-item-industry-list-item-${index + 1}`;
				const text = main_core.Loc.getMessage(code);
				const element = main_core.Tag.render`
				<div class="${className}">
					<div class="crm-kanban-item-industry-list-item-img"></div>
					<div class="crm-kanban-item-industry-list-item-text">${text}</div>
				</div>
			`;
				main_core.Dom.append(element, importListNode);
			});
			return main_core.Tag.render`
			<div class="crm-kanban-item-industry">
				<div class="crm-kanban-item-industry-title">
					${main_core.Loc.getMessage('CRM_KANBAN_REST_DEMO_MARKET_SECTOR')}
				</div>
				<div class="crm-kanban-item-industry-list">
					${importListNode}
				</div>
				<span class="ui-btn ui-btn-sm ui-btn-primary ui-btn-round crm-kanban-sidepanel" data-url="rest_demo">
					${main_core.Loc.getMessage('CRM_KANBAN_REST_DEMO_SETUP')}
				</span>
				<div class="crm-kanban-item-industry-close" onclick="${this.onIndustryCloseButtonClick.bind(this)}"></div>
			</div>
		`;
		}
		onIndustryCloseButtonClick(event) {
			event.stopPropagation(event);
			this.getGrid().toggleRest();
			this.getGrid().registerAnalyticsSpecialItemCloseEvent(this, BX.Crm.Integration.Analytics.Dictionary.SUB_SECTION_KANBAN, BX.Crm.Integration.Analytics.Dictionary.ELEMENT_CLOSE_BUTTON, BX.Crm.Integration.Analytics.Dictionary.TYPE_ITEM_INDUSTRY);
		}
		emitOnSpecialItemDraw(layout) {
			BX.onCustomEvent('Crm.Kanban.Grid:onSpecialItemDraw', [this, layout]);
		}
		setBorderColor() {
			const color = this.getColumn().getColor();
			const rgb = BX.util.hex2rgb(color);
			const rgba = `rgba(${rgb.r},${rgb.g},${rgb.b},.7)`;
			main_core.Dom.style(this.container, {
				'--crm-kanban-item-color': rgba
			});
		}
		setLink() {
			const data = this.getData();
			let linkHtml = this.clipTitle(data.name);
			if (data.isAutomationDebugItem) {
				const debugTitle = main_core.Loc.getMessage('CRM_KANBAN_ITEM_DEBUG_TITLE_MSGVER_1');
				linkHtml = `<span class="crm-kanban-debug-item-label">${debugTitle}</span> ${linkHtml}`;
			}
			this.link.innerHTML = linkHtml;
			main_core.Dom.attr(this.link, {
				href: data.link
			});
		}
		setPriceFormattedHtml() {
			const data = this.getData();
			if (this.totalPrice) {
				this.totalPrice.innerHTML = data.price_formatted;
			}
		}

		/**
		 * Add <span> for last word in title.
		 * @param {String} fullTitle
		 * @returns {String}
		 */
		clipTitle(fullTitle) {
			const separator = ' ';
			const arrTitle = fullTitle.split(separator);
			const lastWordIndex = arrTitle.length - 1;
			const lastWord = `<span>${arrTitle[lastWordIndex]}</span>`;
			arrTitle.splice(lastWordIndex);
			return `${arrTitle.join(separator)}${separator}${lastWord}`;
		}
		setClientName() {
			const data = this.getData();
			const gridData = this.getGridData();
			this.clientNameItems = [];
			if (this.getContactId() && data.contactName && gridData.customFields.includes('CLIENT')) {
				this.clientNameItems.push(data.contactTooltip);
			}
			if (this.getCompanyId() && data.companyName && gridData.customFields.includes('CLIENT')) {
				this.clientNameItems.push(data.companyTooltip);
			}
			if (main_core.Type.isArrayFilled(this.clientNameItems)) {
				this.clientName.innerHTML = '';
				this.clientNameItems.forEach(clientNameItem => {
					if (!clientNameItem.includes('data-mini-card="true"')) {
						return;
					}
					const element = main_core.Tag.render`${clientNameItem}`;
					const entityTypeId = Number(element.dataset.entityTypeId);
					const entityId = Number(element.dataset.entityId);
					main_core.Runtime.loadExtension('crm.mini-card').then(({
						EntityMiniCard
					}) => {
						new BX.Crm.EntityMiniCard({
							bindElement: element,
							entityTypeId,
							entityId
						});
					});
					main_core.Dom.append(element, this.clientName);
				});
				this.switchVisible(this.clientName, true);
			} else {
				this.switchVisible(this.clientName, false);
			}
		}
		prepareContactTypeElements() {
			const data = this.getData();
			const contactTypes = ['Phone', 'Email', 'Im'];
			contactTypes.forEach(type => {
				const contactType = `contact${type}`;
				main_core.Event.unbindAll(this[contactType]);
				const disabledClass = `crm-kanban-item-contact-${type.toLowerCase()}-disabled`;
				if (data[type.toLowerCase()]) {
					main_core.Event.bind(this[contactType], 'click', event => {
						this.clickContact(type.toLowerCase(), event.target);
					});
					this.switchClass(this[contactType], disabledClass, false);
					return;
				}
				main_core.Event.bind(this[contactType], 'mouseover', ({
					target
				}) => {
					const dataType = main_core.Dom.attr(target, 'data-type');
					this.showTooltip(main_core.Loc.getMessage(`CRM_KANBAN_NO_${dataType.toUpperCase()}`), target);
				});
				main_core.Event.bind(this[contactType], 'mouseout', this.hideTooltip.bind(this));
				this.switchClass(this[contactType], disabledClass, true);
			});
		}
		appendLastActivity(data) {
			if (!this.isShowLastActivityTime() && !this.isShowLastActivityUser()) {
				return;
			}
			if (this.isShowLastActivityTime()) {
				main_core.Dom.clean(this.lastActivityTime);
			} else {
				main_core.Dom.remove(this.lastActivityTime);
			}
			if (this.isShowLastActivityUser()) {
				main_core.Dom.clean(this.lastActivityBy);
			} else {
				main_core.Dom.remove(this.lastActivityBy);
			}
			const lastActivity = data.lastActivity;
			if (!main_core.Type.isPlainObject(lastActivity) || !crm_kanban_restriction.Restriction.Instance.isLastActivityInfoInKanbanItemAvailable()) {
				return;
			}
			if (this.isShowLastActivityTime()) {
				this.appendLastActivityTime(lastActivity);
			}
			if (this.isShowLastActivityUser()) {
				this.appendLastActivityUser(lastActivity);
			}
		}
		appendLastActivityTime(lastActivity) {
			// server converts timezone to user before send
			const timestampInUserTimezone = main_core.Text.toInteger(lastActivity.timestamp);
			if (timestampInUserTimezone <= 0) {
				return;
			}
			const utcTimestamp = timestampInUserTimezone - BX.Main.Timezone.Offset.USER_TO_SERVER;
			const timeInUserTimezone = BX.Main.Timezone.UserTime.getDate(utcTimestamp);
			const userNow = BX.Main.Timezone.UserTime.getDate();
			const secondsAgo = (userNow.getTime() - timeInUserTimezone.getTime()) / 1000;
			const ago = secondsAgo <= 60 ? main_core.Text.encode(main_core.Loc.getMessage('CRM_KANBAN_JUST_NOW')) : this.getFormattedLastActiveDateTime(timeInUserTimezone, userNow);
			const timeAgo = main_core.Tag.render`
			<span class="crm-kanban-item-last-activity-time-ago">${ago}</span>
		`;
			main_core.Dom.append(timeAgo, this.lastActivityTime);
		}
		appendLastActivityUser(lastActivity) {
			const lastActivityBy = this.getUserConfigById(lastActivity?.user?.id) ?? lastActivity.user;
			if (!main_core.Type.isPlainObject(lastActivityBy)) {
				return;
			}
			let pictureStyle = '';
			if (main_core.Type.isStringFilled(lastActivityBy.picture)) {
				const pictureUrl = new BX.Uri(lastActivityBy.picture);
				const backgroundUrl = encodeURI(main_core.Text.encode(pictureUrl.toString()));
				pictureStyle = `style="background-image: url('${backgroundUrl}')"`;
			}
			const hasLink = main_core.Type.isStringFilled(lastActivityBy.link) && lastActivityBy.link.startsWith('/');
			const href = hasLink ? lastActivityBy.link : '#';
			const userPic = main_core.Tag.render`
			<a
				class="crm-kanban-item-last-activity-by-userpic"
				href="${main_core.Text.encode(href)}"
			 	bx-tooltip-user-id="${main_core.Text.toInteger(lastActivityBy.id)}"
			 	bx-tooltip-context="b24"
				${pictureStyle}
			></a>
		`;
			main_core.Dom.append(userPic, this.lastActivityBy);
		}
		isShowLastActivityTime() {
			return Boolean(this.grid.data.itemsConfig?.showLastActivityTime ?? true);
		}
		isShowLastActivityUser() {
			return Boolean(this.grid.data.itemsConfig?.showLastActivityUserAvatar ?? true);
		}
		getUserConfigById(id) {
			const gridData = this.getGridData();
			if (!main_core.Type.isArrayFilled(gridData.itemsConfig?.users)) {
				return null;
			}
			return gridData.itemsConfig?.users.find(user => {
				return Number(user.id) === Number(id);
			}) ?? null;
		}
		getFormattedLastActiveDateTime(lastActivityTimeInUserTimezone, userNow) {
			const isCurrentYear = lastActivityTimeInUserTimezone.getFullYear() === new Date().getFullYear();
			const defaultFormat = isCurrentYear ? main_date.DateTimeFormat.getFormat('DAY_SHORT_MONTH_FORMAT') : main_date.DateTimeFormat.getFormat('MEDIUM_DATE_FORMAT');
			let shortTimeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
			shortTimeFormat = shortTimeFormat.replace(/\b(a)\b/, 'A'); // for uppercase AM/PM markers: h:i a => h:i A

			const formattedDateTime = main_date.DateTimeFormat.format([['i', 'idiff'], ['yesterday', `yesterday, ${shortTimeFormat}`], ['today', `today ${shortTimeFormat}`], ['-', defaultFormat]], lastActivityTimeInUserTimezone, userNow);
			return formattedDateTime.replaceAll('\\', '').replaceAll(/(^|\s)(.)/g, firstLetter => firstLetter.toLocaleUpperCase());
		}
		needRenderFields() {
			const wrapperCreated = Boolean(this.fieldsWrapper);
			const itemHasFields = Boolean(this.getData().fields);
			return Boolean(wrapperCreated && itemHasFields);
		}
		getItemFields() {
			if (!this.fieldsWrapper) {
				this.fieldsWrapper = BX.create('div', {
					props: {
						className: 'crm-kanban-item-fields'
					}
				});
				if (this.getGrid().getTypeInfoParam('useRequiredVisibleFields')) {
					this.switchVisible(this.link, true);
					this.switchVisible(this.date, true);
					this.switchVisible(this.clientName, true);
					if (this.total) {
						this.switchVisible(this.total, true);
					}
					return this.fieldsWrapper;
				}
				this.layoutFields();
			}
			return this.fieldsWrapper;
		}
		layoutFields() {
			if (!this.fieldsWrapper) {
				return;
			}
			this.data.fields.forEach(field => {
				this.layoutField(field);
			});
		}
		layoutField(field) {
			const code = field.code;
			if (code === 'TITLE') {
				this.switchVisible(this.link, true);
				return;
			}
			if (code === 'DATE_CREATE') {
				this.switchVisible(this.date, true);
				return;
			}
			if (code === 'CLIENT') {
				this.switchVisible(this.clientName, true);
				return;
			}
			if (code === 'OPPORTUNITY' || code === 'PRICE') {
				if (this.total) {
					this.switchVisible(this.total, true);
				}
				return;
			}
			const fieldConfig = this.getFieldConfig(field);
			if (!fieldConfig) {
				return;
			}
			let titleIcon = null;
			if (main_core.Type.isObject(fieldConfig.icon) && main_core.Type.isStringFilled(fieldConfig.icon.url)) {
				titleIcon = main_core.Tag.render`
				<div class="crm-kanban-item-fields-item-title-icon">
					<img 
						src="${encodeURI(fieldConfig.icon.url)}"
						title="${main_core.Text.encode(fieldConfig.icon.title ?? '')}"
						alt=""
					>
				</div>
			`;
			}
			const titleText = main_core.Tag.render`<div class="crm-kanban-item-fields-item-title-text"></div>`;
			titleText.innerHTML = fieldConfig.title;
			let titleTooltip = null;
			const tooltipText = fieldConfig?.helpMessage ?? '';
			if (tooltipText && this.getGrid().shouldShowTooltips()) {
				titleTooltip = main_core.Tag.render`
				<span
					class="crm-kanban-item-fields-item-title-tooltip --hidden">
				</span>
			`;
				titleTooltip.dataset.hint = tooltipText;
				this.ufTooltipNodes.push(titleTooltip);
			}
			const titleTextWrapper = main_core.Tag.render`
			<div class="crm-kanban-item-fields-item-title-wrapper">
				${titleIcon}
				${titleText}
				${titleTooltip}
			</div>
		`;
			const fieldParamsData = {
				...field,
				...fieldConfig
			};
			if (main_core.Type.isBoolean(field.html)) {
				fieldParamsData.html = field.html;
			}
			const fieldsElement = main_core.Dom.create('div', this.getFieldParams(fieldParamsData));
			if (fieldConfig.type === 'text' || fieldConfig.type === 'string') {
				this.addTextExpander(fieldsElement);
			}
			if (code === 'COMMENTS' && BX.Type.isStringFilled(this.getGrid().getData().copilotName)) {
				const copilot = `${this.getGrid().getData().copilotName}`;
				const escapedCopilot = BX.Type.isFunction(RegExp.escape) ? RegExp.escape(copilot) : copilot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				const regex = new RegExp(`(^|<br>)${escapedCopilot}`, 'gim');
				const valueElements = fieldsElement.querySelectorAll('p');
				valueElements.forEach(valueElement => {
					valueElement.innerHTML = valueElement.innerHTML.replaceAll(regex, match => match.replace(copilot, `<span class="crm-kanban-bitrix-gpt-gradient">${copilot}</span>`));
				});
			}
			const fieldsItem = main_core.Tag.render`
			<div class="crm-kanban-item-fields-item">
				<div class="crm-kanban-item-fields-item-title">
					${titleTextWrapper}
				</div>
				${fieldsElement}
			</div>
		`;
			main_core.Dom.append(fieldsItem, this.fieldsWrapper);
			BX.UI.Hint.init(BX(this.fieldsWrapper));
		}
		addTextExpander(fieldElement) {
			if (!BX.Type.isDomNode(fieldElement)) {
				return;
			}
			BX.Dom.addClass(fieldElement, '--text');
			const toggleHandler = event => {
				if (event) {
					event.stopPropagation();
				}
				BX.Dom.toggleClass(fieldElement, '--text-expanded');
				const isExpanded = BX.Dom.hasClass(fieldElement, '--text-expanded');
				fieldElement.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
			};
			BX.Event.bind(fieldElement, 'click', toggleHandler);
		}

		/**
		 * for kanban api v2
		 * @param {Object} field
		 * @returns {Object}
		 */
		getFieldConfig(field) {
			const config = this.getFieldsConfig().find(item => {
				return field.code === item.code;
			}) ?? field;
			if (config.type === 'user') {
				config.value = this.getUserConfigById(field.value) ?? field.value;
			}
			return config;
		}

		/**
		 * for kanban api v2
		 * @returns {Array<Object>}
		 */
		getFieldsConfig() {
			return this.getItemsConfigData().fields ?? [];
		}

		/**
		 * for kanban api v2
		 * @returns {Object}
		 */
		getItemsConfigData() {
			return this.getGridData().itemsConfig ?? {};
		}

		/**
		 * @param field
		 * @property {string} code
		 * @property {boolean} html
		 * @property {string} icon
		 * @property {boolean} isMultiple
		 * @property {string} title
		 * @property {string} type
		 * @property {Object} value
		 * @property {string | null} valueDelimiter
		 * @returns {Object}
		 */
		getFieldParams(field) {
			const type = field.type ?? 'string';
			let params = {
				props: {
					className: 'crm-kanban-item-fields-item-value'
				}
			};
			if (type === 'user') {
				params = {
					...params,
					...this.getUserTypeFieldParams(field)
				};
			} else if (field.value.includes('data-mini-card="true"') || main_core.Type.isArray(field.value) && field.value.every(fieldValue => fieldValue.includes('data-mini-card="true"'))) {
				const fieldValues = main_core.Type.isArray(field.value) ? field.value : [field.value];
				const miniCardListContainer = main_core.Tag.render`<div class="crm-mini-card-list-container"></div>`;
				fieldValues.forEach(fieldValue => {
					const element = main_core.Tag.render`${fieldValue}`;
					const entityTypeId = Number(element.dataset.entityTypeId);
					const entityId = Number(element.dataset.entityId);
					void main_core.Runtime.loadExtension('crm.mini-card').then(({
						EntityMiniCard
					}) => {
						new EntityMiniCard({
							bindElement: element,
							entityTypeId,
							entityId
						});
					});
					main_core.Dom.append(element, miniCardListContainer);
				});
				params.children = [miniCardListContainer];
			} else if (field.type === 'money' || field.html === true) {
				const delimiter = field.valueDelimiter ?? '<br>';
				params.html = main_core.Type.isArray(field.value) ? field.value.join(delimiter) : field.value;
				if (params.html.includes('<b>')) {
					params.props.className = `${params.props.className} --normal-weight`;
				}
			} else {
				params.text = main_core.Type.isArray(field.value) ? field.value.join(', ') : field.value;
			}
			return params;
		}
		getUserTypeFieldParams(field) {
			const params = {};

			// for api v2
			if (!main_core.Type.isPlainObject(field.value) || main_core.Type.isArray(field.value)) {
				if (main_core.Type.isArray(field.value)) {
					const results = [];
					field.value.forEach(userId => {
						const userTypeFieldConfigData = this.getItemsConfigData().users?.find(user => user.id === Number(userId)) ?? null;
						if (main_core.Type.isPlainObject(userTypeFieldConfigData)) {
							const info = this.getInfoFromUserTypeFieldValue(userTypeFieldConfigData);
							results.push(info.balloon);
						}
					});
					params.html = results.join(', ');
					return params;
				}
				const userTypeFieldConfigData = this.getItemsConfigData().users?.find(user => user.id === Number(field.value)) ?? null;
				const info = this.getInfoFromUserTypeFieldValue(userTypeFieldConfigData);
				params.html = info.balloon;
			}
			if (field.html !== true) {
				params.text = this.getMessage('noname');
				return params;
			}
			if (main_core.Type.isPlainObject(field.value)) {
				const info = this.getInfoFromUserTypeFieldValue(field.value);
				if (field.code === 'ASSIGNED_BY_ID') {
					params.html = `
					<div class="crm-kanban-item-fields-item-value-user">
						${info.picture}
						${info.name}
					</div>
				`;
				} else {
					const html = info.balloon ?? `${info.picture}\n${info.name}`;
					params.html = `
					<div class="crm-kanban-item-fields-item-value-user">
						${html}
					</div>
				`;
				}
			} else {
				params.html = main_core.Type.isArray(field.value) ? field.value.join(', ') : field.value;
			}
			return params;
		}
		getInfoFromUserTypeFieldValue(value) {
			if (!main_core.Type.isPlainObject(value)) {
				return {};
			}
			let itemUserPic = '';
			let itemUserName = '';
			if (value.link === '') {
				itemUserPic = '<span class="crm-kanban-item-fields-item-value-userpic"></span>';
				itemUserName = `<span class="crm-kanban-item-fields-item-value-name">${value.title}</span>`;
			} else {
				let userPic = '';
				if (value.picture) {
					userPic = ` style="background-image: url('${encodeURI(main_core.Text.encode(value.picture))}')"`;
				}
				const tooltip = value.id ? `bx-tooltip-user-id="${main_core.Text.toInteger(value.id)}" bx-tooltip-context="b24"` : null;
				itemUserPic = `<a class="crm-kanban-item-fields-item-value-userpic" ${tooltip} href="${value.link}"${userPic}></a>`;
				itemUserName = `<a class="crm-kanban-item-fields-item-value-name" ${tooltip} href="${value.link}">${value.title}</a>`;
			}
			return {
				picture: itemUserPic,
				name: itemUserName,
				balloon: value.balloon
			};
		}
		layoutBadges() {
			main_core.Dom.clean(this.badgesWrapper);
			const badges = this.getBadges();
			for (let i = 0; i < badges.length; i++) {
				const badgeData = badges[i];
				const badgeValueClass = 'crm-kanban-item-badges-item-value crm-kanban-item-badges-status';
				const badgeValueStyle = `
				background-color: ${badgeData.backgroundColor};
				border-color: ${badgeData.backgroundColor};
				color: ${badgeData.textColor};
			`;
				const badgeTextItem = main_core.Tag.render`
				<div class="${badgeValueClass}" style="${badgeValueStyle}">${badgeData.textValue}</div>
			`;
				const item = main_core.Tag.render`
				<div class="crm-kanban-item-badges-item">
					<div class="crm-kanban-item-badges-item-title">
						<div class="crm-kanban-item-badges-item-title-text">${badgeData.fieldName}</div>
					</div>
					${badgeTextItem}
				</div>
			`;
				main_core.Dom.append(item, this.badgesWrapper);
				if (main_core.Type.isStringFilled(badgeData?.hint)) {
					const badge = new crm_badge.Badge(badgeTextItem);
					badge.init({
						hint: badgeData.hint
					});
				}
			}
		}
		layoutFooter() {
			main_core.Dom.clean(this.footerWrapper);
			const elements = [{
				id: 'planner',
				node: this.createPlanner()
			}];
			if (this.isShowLastActivityTime() || this.isShowLastActivityUser()) {
				elements.push({
					id: 'activityBlock',
					node: this.createLastActivityBlock()
				});
			}
			const data = {
				elements,
				item: this
			};
			BX.Event.EventEmitter.emit('BX.Crm.Kanban.Item::onBeforeFooterCreate', data);
			data.elements.forEach(element => {
				main_core.Dom.append(element.node, this.footerWrapper);
			});
		}

		/**
		 * Get close icon for demo-block.
		 * @return {Element}
		 */
		getCloseStartLayout() {
			return BX.create('div', {
				props: {
					className: 'crm-kanban-item-contact-center-close'
				},
				events: {
					click: function (e) {
						this.grid.toggleCC();
						e.stopPropagation(e);
					}.bind(this)
				}
			});
		}
		selectItem() {
			this.checked = true;
			// BX.onCustomEvent("BX.CRM.Kanban.Item.select", [this]);
			main_core.Dom.addClass(this.checkedButton, 'crm-kanban-item-checkbox-checked');
			main_core.Dom.addClass(this.container, 'crm-kanban-item-selected');
		}
		unSelectItem() {
			this.checked = false;
			// BX.onCustomEvent("BX.CRM.Kanban.Item.unSelect", [this]);
			main_core.Dom.removeClass(this.checkedButton, 'crm-kanban-item-checkbox-checked');
			main_core.Dom.removeClass(this.container, 'crm-kanban-item-selected');
		}
		createLayout() {
			const container = this.createContainer();
			const elements = [this.createTitleLink(), this.createLine(), this.createRepeated(), this.createTotalPrice(), this.createClientName(), this.createDate(), this.createCheckedButton(), this.hasFields() ? this.getItemFields() : null, this.createBadgesWrapper(), this.createAside(), this.createFooterWrapper(), this.createShadow()];
			if (!this.isLayoutFooterEveryRender()) {
				this.layoutFooter();
			}
			elements.forEach(element => {
				main_core.Dom.append(element, container);
			});
		}
		isLayoutFooterEveryRender() {
			return Boolean(this.getPerformanceSettings().layoutFooterEveryItemRender === 'Y');
		}
		getPerformanceSettings() {
			return this.getGrid().getData().performance;
		}
		createContainer() {
			let containerClassname = this.getGrid().getTypeInfoParam('kanbanItemClassName');
			if (this.useAnimation) {
				containerClassname += ` ${containerClassname}-new`;
			}
			this.container = main_core.Tag.render`
			<div
				class="${containerClassname} --ui-context-content-light"
				onclick="${this.onContainerClick.bind(this)}"
				ondblclick="${this.onContainerDblClick.bind(this)}"
				onmouseenter="${this.onContainerMouseEnter.bind(this)}"
				onmouseleave="${this.onContainerMouseLeave.bind(this)}"
			></div>
		`;
			main_core.Event.bind(this.container, 'animationend', () => {
				main_core.Dom.removeClass(this.layout.container, 'main-kanban-item-new');
			});
			return this.container;
		}
		onContainerClick(event) {
			const target = event.target;
			const classNames = this.container.className.replaceAll(' ', '.');
			const parent = target.closest(`.${classNames}`);
			if (target !== this.container && !parent || parent && target.tagName === 'A' || parent && target.tagName === 'SPAN' && !main_core.Dom.hasClass(target, 'crm-kanban-item-contact') || parent && target.closest('.crm-kanban-item-activity')) {
				return;
			}
			const grid = this.getGrid();
			if (this.checked) {
				grid.unCheckItem(this);
				if (!main_core.Type.isArrayFilled(grid.getChecked())) {
					grid.resetMultiSelectMode();
					grid.stopActionPanel();
				}
			} else {
				const openColumn = grid.getColumnWithOpenEditor();
				const editorClosePromise = openColumn ? openColumn.closeQuickFormEditor() : Promise.resolve(true);
				editorClosePromise.then(closed => {
					if (!closed) {
						return;
					}

					// Defer to next tick: confirmation dialog's click event bubbles and resets selected items
					setTimeout(() => {
						grid.checkItem(this);
						grid.onMultiSelectMode();
						grid.startActionPanel();
						grid.calculateTotalCheckItems();
					}, 0);
				});
				return;
			}
			grid.calculateTotalCheckItems();
		}
		onContainerDblClick() {
			this.link.click();
		}
		onContainerMouseLeave() {
			this.hideUfTooltips();
			this.removeHoverClass(this.container);
		}
		onContainerMouseEnter() {
			this.showUfTooltips();
		}
		hideUfTooltips() {
			this.ufTooltipNodes.forEach((node, idx) => {
				this.ufTooltipNodes[idx].classList.add('--hidden');
			});
		}
		showUfTooltips() {
			this.ufTooltipNodes.forEach((node, idx) => {
				this.ufTooltipNodes[idx].classList.remove('--hidden');
			});
		}
		createTitleLink() {
			this.link = main_core.Tag.render`<a class="crm-kanban-item-title" style="${this.getBlockStyleBasedOnFields()}"></a>`;
			return this.link;
		}
		createLine() {
			return main_core.Tag.render`<div class="crm-kanban-item-line"></div>`;
		}
		createRepeated() {
			const optionsData = this.options.data;
			if (!optionsData.return && !optionsData.returnApproach) {
				return null;
			}
			const entityType = this.getGridData().entityType;
			const text = optionsData.returnApproach ? main_core.Loc.getMessage(`CRM_KANBAN_REPEATED_APPROACH_${entityType}`) : main_core.Loc.getMessage(`CRM_KANBAN_REPEATED_${entityType}`);
			return main_core.Tag.render`<div class="crm-kanban-item-repeated">${text}</div>`;
		}
		createTotalPrice() {
			this.totalPrice = main_core.Tag.render`<div class="crm-kanban-item-total-price"></div>`;
			this.total = main_core.Tag.render`
			<div class="crm-kanban-item-total" style="${this.getBlockStyleBasedOnFields()}">${this.totalPrice}</div>
		`;
			return this.total;
		}
		createClientName() {
			this.clientName = main_core.Tag.render`<span class="crm-kanban-item-contact"></span>`;
			return this.clientName;
		}
		createDate() {
			this.date = main_core.Tag.render`
			<div class="crm-kanban-item-date" style="${this.getBlockStyleBasedOnFields()}"></div>
		`;
			return this.date;
		}
		getBlockStyleBasedOnFields() {
			return this.hasFields() ? 'display: none' : '';
		}
		hasFields() {
			return main_core.Type.isArrayFilled(this.data.fields);
		}
		createCheckedButton() {
			this.checkedButton = main_core.Tag.render`
			<div class="crm-kanban-item-checkbox" onclick="${this.onCheckedButtonClick.bind(this)}"></div>
		`;
			return this.checkedButton;
		}
		onCheckedButtonClick() {
			this.checked = !this.checked;
			const className = 'crm-kanban-item-checkbox-checked';
			if (this.checked) {
				main_core.Dom.addClass(this.checkedButton, className);
			} else {
				main_core.Dom.removeClass(this.checkedButton, className);
			}
		}
		createBadgesWrapper() {
			this.badgesWrapper = main_core.Tag.render`<div class="crm-kanban-item-badges"></div>`;
			return this.badgesWrapper;
		}

		// runs only once and is not subsequently redrawn
		// BX.Crm.Kanban.Item::onBeforeAsideCreate is sent only once when the item is created
		createAside() {
			const limitExceededIcon = this.isActivityLimitIsExceeded() ? main_core.Tag.render`<span class="crm-kanban-item-activity">${this.getActivityCounterHtml()}</span>` : null;
			const elements = [{
				id: 'limitExceededIcon',
				node: limitExceededIcon
			}];
			if (this.isShowActivity()) {
				this.activityExist = main_core.Tag.render`
				<span class="crm-kanban-item-activity" onclick="${this.showCurrentPlan.bind(this)}"></span>
			`;
				elements.push({
					id: 'activityExist',
					node: this.activityExist
				});
				this.activityEmpty = main_core.Tag.render`
				<span class="crm-kanban-item-activity" onclick="${this.onActivityEmptyClick.bind(this)}"></span>
			`;
				elements.push({
					id: 'activityEmpty',
					node: this.activityEmpty
				});
			}
			this.contactPhone = this.createContactItemNode('phone');
			elements.push({
				id: 'contactPhone',
				node: this.contactPhone
			});
			this.contactEmail = this.createContactItemNode('email');
			elements.push({
				id: 'contactEmail',
				node: this.contactEmail
			});
			this.contactIm = this.createContactItemNode('im');
			elements.push({
				id: 'contactIm',
				node: this.contactIm
			});
			const data = {
				elements,
				item: this
			};
			BX.Event.EventEmitter.emit('BX.Crm.Kanban.Item::onBeforeAsideCreate', data);
			const aside = main_core.Tag.render`<div class="crm-kanban-item-aside"></div>`;
			data.elements.forEach(element => {
				main_core.Dom.append(element.node, aside);
			});
			return aside;
		}
		createContactItemNode(type) {
			return main_core.Tag.render`
			<span
				class="crm-kanban-item-contact-${type} crm-kanban-item-contact-${type}-disabled"
				data-type="${type}"
			></span>
		`;
		}
		onActivityEmptyClick(event) {
			const activityMessage = this.getActivityMessage(this.getGridData().entityType);
			this.showTooltip(activityMessage, event.target, true);
		}
		createFooterWrapper() {
			this.footerWrapper = main_core.Tag.render`<div class="crm-kanban-item-footer"></div>`;
			return this.footerWrapper;
		}
		createPlanner() {
			if (!this.isShowActivity()) {
				return null;
			}
			this.activityPlan = main_core.Tag.render`
			<span class="crm-kanban-item-plan" onclick="${this.showPlannerMenu.bind(this)}">
				+ ${main_core.Loc.getMessage('CRM_KANBAN_ACTIVITY_TO_PLAN2')}
			</span>
		`;
			this.planner = main_core.Tag.render`<div class="crm-kanban-item-planner">${this.activityPlan}</div>`;
			return this.planner;
		}
		isShowActivity() {
			return this.getGridData().showActivity;
		}
		createLastActivityBlock() {
			this.lastActivityTime = main_core.Tag.render`<div class="crm-kanban-item-last-activity-time"></div>`;
			this.lastActivityBy = main_core.Tag.render`<div class="crm-kanban-item-last-activity-by"></div>`;
			this.lastActivityBlock = main_core.Tag.render`
			<div class="crm-kanban-item-last-activity">${this.lastActivityTime}${this.lastActivityBy}</div>
		`;
			return this.lastActivityBlock;
		}

		/**
		 * @returns {Boolean}
		 */
		isChecked() {
			return this.checked;
		}
		isHiddenPrice() {
			return this.getColumn()?.isHiddenTotalSum();
		}

		/**
		 * Get message for activity popup.
		 * @param {String} type of entity.
		 * @returns {String}
		 */
		getActivityMessage(type) {
			const content = BX.create('span');
			const typeTranslateCode = /DYNAMIC_(\d+)/.test(type) ? 'DYNAMIC' : type;
			content.innerHTML = main_core.Loc.getMessage(`CRM_KANBAN_ACTIVITY_CHANGE_${typeTranslateCode}_MSGVER_1`) || main_core.Loc.getMessage(`CRM_KANBAN_ACTIVITY_CHANGE_${typeTranslateCode}_MSGVER_2`);
			const eventLink = content.querySelector('.crm-kanban-item-activity-link');
			BX.bind(eventLink, 'click', () => {
				this.showPlannerMenu(this.activityPlan);
				this.popupTooltip.destroy();
			});
			return content;
		}

		/**
		 * Get preloader for popup.
		 * @returns {String}
		 */
		getPreloader() {
			// eslint-disable-next-line no-multi-str
			return '\
			<div class="crm-kanban-preloader-wrapper">\n\
				<div class="crm-kanban-preloader">\n\
					<svg class="crm-kanban-circular" viewBox="25 25 50 50">\n\
						<circle class="crm-kanban-path" cx="50" cy="50" r="20" fill="none" stroke-width="1" stroke-miterlimit="10"/>\n\
					</svg>\n\
				</div>\n\
			</div>\
		';
		}
		loadCurrentPlan() {
			this.getGrid().ajax({
				action: 'activities',
				entity_id: this.getId()
			}, data => {
				this.plannerCurrent.setContent(data);
				this.plannerCurrent.adjustPosition();
			}, error => {
				BX.Kanban.Utils.showErrorDialog(`Error: ${error}`, true);
			}, 'html');
		}
		showCurrentPlan(event) {
			this.plannerCurrent = main_popup.PopupManager.create('kanban_planner_current', event.target, {
				closeIcon: false,
				autoHide: true,
				className: 'crm-kanban-popup-plan',
				closeByEsc: true,
				contentColor: 'white',
				angle: true,
				offsetLeft: 15,
				overlay: {
					backgroundColor: 'transparent',
					opacity: '0'
				},
				events: {
					onAfterPopupShow: this.loadCurrentPlan.bind(this),
					onPopupClose: () => {
						this.plannerCurrent.destroy();
						main_core.Dom.removeClass(this.container, 'crm-kanban-item-hover');
						main_core.Event.unbind(window, 'scroll', this.adjustPopup);
					}
				}
			});
			this.plannerCurrent.setContent(this.getPreloader());
			this.plannerCurrent.show();
			main_core.Event.bind(window, 'scroll', this.adjustPopup.bind(this));
		}
		clickContact(type, bindElement) {
			const contactInfo = this.getContactInfo(type);
			let totalContactsCount = 0;
			if (main_core.Type.isObject(contactInfo)) {
				if (main_core.Type.isArray(contactInfo)) {
					totalContactsCount = contactInfo.length;
				} else {
					totalContactsCount = Object.values(contactInfo).reduce((count, item) => {
						return count + (main_core.Type.isArray(item) ? item.length : 0);
					}, 0);
				}
			}
			if (totalContactsCount > 1) {
				this.showManyContacts(contactInfo, type, bindElement);
			} else {
				this.showSingleContact(contactInfo, type);
			}
		}
		clickContactItem(item) {
			const data = this.getData();

			// eslint-disable-next-line no-undef
			if (item.type === 'phone' && !main_core.Type.isUndefined(BXIM)) {
				// eslint-disable-next-line no-undef
				BXIM.phoneTo(item.value, {
					ENTITY_TYPE: item.clientType === undefined ? this.getContactType() : item.clientType,
					ENTITY_ID: item.clientId === undefined ? this.getContactId() : item.clientId
				});
			}
			// eslint-disable-next-line no-undef
			else if (item.type === 'im' && !main_core.Type.isUndefined(BXIM)) {
				// eslint-disable-next-line no-undef
				BXIM.openMessengerSlider(item.value, {
					RECENT: 'N',
					MENU: 'N'
				});
			} else if (item.type === 'email') {
				const hasActivityEditor = BX.CrmActivityEditor && BX.CrmActivityEditor.items.kanban_activity_editor;
				const hasSlider = top.BX.SidePanel && top.BX.SidePanel.Instance;
				if (hasActivityEditor && BX.CrmActivityProvider && hasSlider) {
					const gridData = this.getGridData();

					// @TODO: fix communication entity
					BX.CrmActivityEditor.items.kanban_activity_editor.addEmail({
						ownerType: gridData.entityType,
						ownerID: data.id,
						communications: [{
							type: 'EMAIL',
							value: item.value,
							entityId: data.id,
							entityType: gridData.entityType,
							entityTitle: data.name
						}],
						communicationsLoaded: true
					});
				} else {
					// @tmp
					top.location.href = `mailto:${item.value}`;
				}
			}
		}
		showManyContacts(contactCategories, type, bindElement) {
			const menuItems = [];

			// converting the entity's own contact data into an object for correct use
			if (Array.isArray(contactCategories)) {
				// eslint-disable-next-line no-param-reassign
				contactCategories = {
					0: contactCategories
				};
			}
			Object.keys(contactCategories).forEach(category => {
				if (category === 'company' || category === 'contact') {
					menuItems.push({
						delimiter: true,
						text: this.getMessage(category)
					});
				}
				const fields = contactCategories[category];
				fields.forEach(field => {
					let clientType = '';
					let clientId = '';
					if (category === 'company') {
						clientType = 'CRM_COMPANY';
						clientId = this.getCompanyId();
					} else if (category === 'contact') {
						clientType = 'CRM_CONTACT';
						clientId = this.getContactId();
					}
					menuItems.push({
						value: field.value,
						type,
						clientType,
						clientId,
						text: `${field.value} (${field.title})`,
						onclick: this.clickContactItem.bind(this, {
							value: field.value,
							type
						})
					});
				});
			});
			const menu = new main_popup.Menu(`kanban_contact_menu_${type}${this.getId()}`, bindElement, menuItems, {
				autoHide: true,
				zIndex: 1200,
				offsetLeft: 20,
				angle: true,
				closeByEsc: true,
				events: {
					onPopupClose: () => {
						main_core.Dom.removeClass(this.container, 'crm-kanban-item-hover');
						BX.unbind(window, 'scroll', BX.proxy(this.adjustPopup, this));
					}
				}
			});
			menu.show();
			BX.bind(window, 'scroll', BX.proxy(this.adjustPopup, this));
		}
		showSingleContact(contactInfo, type) {
			let fields = this.getSingleContactCategory(contactInfo);
			if (!Array.isArray(fields)) {
				fields = [fields];
			}
			this.clickContactItem({
				value: main_core.Type.isUndefined(fields[0].value) ? fields[0] : fields[0].value,
				type
			});
		}
		getSingleContactCategory(contactInfo) {
			return main_core.Type.isObjectLike(contactInfo) ? contactInfo[Object.keys(contactInfo)[0]] : contactInfo;
		}

		/**
		 * @param {string} title
		 * @returns {string}
		 */
		getMessage(title) {
			return Item.messages[title] || '';
		}

		/**
		 * Click one the item of plan menu
		 * @param {Integer} i
		 * @param {Object} item
		 * @returns {void}
		 */
		selectPlannerMenu(i, item) {
			BX.onCustomEvent('Crm.Kanban:selectPlannerMenu');
			const gridData = this.getGridData();
			switch (item.type) {
				case 'meeting':
				case 'call':
					{
						new BX.Crm.Activity.Planner().showEdit({
							TYPE_ID: BX.CrmActivityType[item.type],
							OWNER_TYPE: gridData.entityType,
							OWNER_ID: this.getId()
						});
						break;
					}
				case 'task':
					{
						const taskData = {
							UF_CRM_TASK: [`${BX.CrmOwnerTypeAbbr.resolve(gridData.entityType)}_${this.getId()}`],
							TITLE: 'CRM: ',
							TAGS: 'crm'
						};
						let taskCreatePath = main_core.Loc.getMessage('CRM_TASK_CREATION_PATH');
						taskCreatePath = taskCreatePath.replace('#user_id#', main_core.Loc.getMessage('USER_ID'));
						taskCreatePath = BX.util.add_url_param(taskCreatePath, taskData);
						if (main_sidepanel.SidePanel) {
							main_sidepanel.SidePanel.Instance.open(taskCreatePath);
						} else {
							window.top.location.href = taskCreatePath;
						}
						break;
					}
				case 'visit':
					{
						const visitParams = gridData.visitParams;
						visitParams.OWNER_TYPE = gridData.entityType;
						visitParams.OWNER_ID = this.getId();
						BX.CrmActivityVisit.create(visitParams).showEdit();
						break;
					}
			}
			const menu = main_popup.MenuManager.getCurrentMenu();
			if (menu) {
				menu.close();
			}
		}

		/**
		 * Get menu for planner.
		 * @returns {Object}
		 */
		getPlannerMenu() {
			const gridData = this.getGrid().getData();
			return [{
				type: 'call',
				text: main_core.Loc.getMessage('CRM_KANBAN_ACTIVITY_PLAN_CALL'),
				onclick: this.selectPlannerMenu.bind(this)
			}, {
				type: 'meeting',
				text: main_core.Loc.getMessage('CRM_KANBAN_ACTIVITY_PLAN_MEETING'),
				onclick: this.selectPlannerMenu.bind(this)
			}, gridData.rights.canUseVisit ? BX.getClass('BX.Crm.Restriction.Bitrix24') && BX.Crm.Restriction.Bitrix24.isRestricted('visit') ? {
				type: 'visit',
				text: main_core.Loc.getMessage('CRM_KANBAN_ACTIVITY_PLAN_VISIT'),
				className: 'crm-tariff-lock-behind',
				onclick: BX.Crm.Restriction.Bitrix24.getHandler('visit')
			} : {
				type: 'visit',
				text: main_core.Loc.getMessage('CRM_KANBAN_ACTIVITY_PLAN_VISIT'),
				onclick: this.selectPlannerMenu.bind(this)
			} : null, {
				type: 'task',
				text: main_core.Loc.getMessage('CRM_KANBAN_ACTIVITY_PLAN_TASK'),
				onclick: this.selectPlannerMenu.bind(this)
			}];
		}
		showPlannerMenu(node, mode = BX.Crm.Activity.TodoEditorMode.ADD, disableItem = false) {
			if (crm_kanban_restriction.Restriction.Instance.isTodoActivityCreateAvailable()) {
				this.prepareAndShowActivityAddingPopup(node, mode, disableItem);
			} else if (mode === BX.Crm.Activity.TodoEditorMode.ADD) {
				this.prepareAndShowPlannerPopup(node);
			}
		}
		prepareAndShowActivityAddingPopup(node, mode, disableItem) {
			const id = this.getId();
			if (disableItem) {
				this.disabledItem();
			}
			const data = this.getData();
			const gridData = this.getGridData();
			const pingSettings = data.pingSettings || gridData.itemsConfig?.pingSettings;
			const colorSettings = data.colorSettings || gridData.itemsConfig?.colorSettings;
			const calendarSettings = data.calendarSettings || gridData.itemsConfig?.calendarSettings;
			const settings = {
				pingSettings,
				colorSettings,
				calendarSettings
			};
			const params = {
				context: this.getToDoEditorContext(),
				events: {
					onSave: () => {
						void this.animate({
							duration: this.grid.animationDuration,
							draw: progress => {
								main_core.Dom.style(this.layout.container, 'opacity', `${100 - progress * 50}%`);
							},
							useAnimation: main_core.Dom.style(this.layout.container, 'opacity') === '1'
						}).then(() => {
							void this.animate({
								duration: this.grid.animationDuration,
								draw: progress => {
									main_core.Dom.style(this.layout.container, 'opacity', `${progress * 100}%`);
								},
								useAnimation: true
							});
						});
					}
				}
			};
			if (!this.activityAddingPopup) {
				this.activityAddingPopup = new crm_activity_addingPopup.AddingPopup(this.getGridData().entityTypeInt, id, this.getCurrentUser(), settings, params);
			}
			this.activityAddingPopup.show(mode);
			if (disableItem) {
				this.unDisabledItem();
			}
		}
		getToDoEditorContext() {
			return {
				analytics: this.grid.getData().analytics
			};
		}
		prepareAndShowPlannerPopup(node) {
			const id = this.getId();
			const popupId = `kanban_planner_menu_${id}`;
			const bindElement = node.isNode ? node : this.activityPlan;
			const popupMenu = new main_popup.Menu(popupId, bindElement, this.getPlannerMenu(), {
				className: 'crm-kanban-planner-popup-window',
				autoHide: true,
				offsetLeft: 50,
				angle: true,
				overlay: {
					backgroundColor: 'transparent',
					opacity: '0'
				},
				events: {
					onPopupClose: () => {
						main_core.Dom.removeClass(this.container, 'crm-kanban-item-hover');
						main_core.Event.unbind(window, 'scroll', this.adjustPopup);
						popupMenu.destroy();
					}
				}
			});
			BX.addCustomEvent(window, 'Crm.Kanban:selectPlannerMenu', () => {
				popupMenu.destroy();
			});
			popupMenu.show();
			main_core.Event.bind(window, 'scroll', this.adjustPopup.bind(this));
		}
		switchPlanner() {
			const data = this.getData();
			const column = this.getColumn();
			const columnData = column.getData();
			if (this.getActivityProgress() > 0) {
				this.switchVisible(this.activityExist, true);
				this.switchVisible(this.activityEmpty, false);
				this.setActivityExistInnerHtml();
			} else {
				const gridData = this.getGrid().getData();
				this.switchVisible(this.activityExist, false);
				this.switchVisible(this.activityPlan, true);
				this.switchVisible(this.activityEmpty, true);
				let activityEmptyHtml = '';
				if (gridData.reckonActivitylessItems && gridData.userId === parseInt(data.assignedBy, 10)) {
					activityEmptyHtml = columnData.type === 'PROGRESS' ? this.getActivityCounterHtml(1, BX.UI.CounterStyle.FILLED_ALERT) : '';
				} else {
					activityEmptyHtml = this.getActivityCounterHtml();
				}
				this.activityEmpty.innerHTML = activityEmptyHtml;
			}
		}

		/**
		 * Description what the counter fields mean you can see
		 * at crm/lib/kanban/entityactivitycounter.php::appendToEntityItems
		 */
		setActivityExistInnerHtml() {
			if (main_core.Type.isUndefined(this.activityExist)) {
				return;
			}
			main_core.Dom.removeClass(this.activityExist, ...this.activityExist.classList);
			main_core.Dom.addClass(this.activityExist, 'crm-kanban-item-activity');
			const gridData = this.getGrid().getData();
			const errorCounterByActivityResponsible = gridData.showErrorCounterByActivityResponsible || false;
			const userId = gridData.userId;
			const html = errorCounterByActivityResponsible ? this.makeCounterHtmlByActivityResponsible(userId) : this.makeCounterHtmlByEntityResponsible(userId);
			if (main_core.Type.isStringFilled(html)) {
				this.activityExist.innerHTML = html;
			}
		}
		makeCounterHtmlByActivityResponsible(userId) {
			const userActStat = this.getActivitiesByUser()[userId] || {};
			const userActivityError = userActStat.activityError || 0;
			const userActivityIncoming = userActStat.incoming || 0;
			const userActivityProgress = userActStat.activityProgress || 0;
			const userActivityCounterTotal = userActStat.activityCounterTotal || 0;
			let html = '';
			if (userActivityIncoming > 0 && userActivityError > 0) {
				html = this.getActivityCounterHtml(userActivityCounterTotal, BX.UI.CounterStyle.FILLED_ALERT, true);
			} else if (userActivityError > 0) {
				html = this.getActivityCounterHtml(userActivityError, BX.UI.CounterStyle.FILLED_ALERT);
			} else if (userActivityIncoming > 0) {
				html = this.getActivityCounterHtml(userActivityIncoming, BX.UI.CounterStyle.FILLED_SUCCESS);
			} else if (userActivityProgress > 0) {
				html = this.getActivityCounterHtml(0);
				html += '<span class="crm-kanban-item-activity-indicator"></span>';
			} else {
				if (this.getActivityCounterTotal() > 0) {
					html = this.getActivityCounterHtml(this.getActivityCounterTotal());
				} else {
					html = this.getActivityCounterHtml(0);
					html += '<span class="crm-kanban-item-activity-indicator crm-kanban-item-activity-indicator--grey"></span>';
				}
			}
			return html;
		}
		makeCounterHtmlByEntityResponsible(userId) {
			const isCurrentUserResponsibleToElement = userId === BX.prop.getNumber(this.data, 'assignedBy', 0);
			const activityProgress = this.getActivityProgress();
			const activityError = this.getActivityError();
			const activityIncomingTotal = this.getActivityIncomingTotal();
			const activityCounterTotal = this.getActivityCounterTotal();
			let html = '';
			if (isCurrentUserResponsibleToElement) {
				if (activityIncomingTotal > 0 && activityError > 0) {
					html = this.getActivityCounterHtml(activityCounterTotal, BX.UI.CounterStyle.FILLED_ALERT, true);
				} else if (activityError > 0) {
					html = this.getActivityCounterHtml(activityError, BX.UI.CounterStyle.FILLED_ALERT);
				} else if (activityIncomingTotal > 0) {
					html = this.getActivityCounterHtml(activityIncomingTotal, BX.UI.CounterStyle.FILLED_SUCCESS);
				} else if (activityProgress > 0) {
					html = this.getActivityCounterHtml(0);
					html += '<span class="crm-kanban-item-activity-indicator"></span>';
				} else {
					html = this.getActivityCounterHtml(0);
				}
				return html;
			}
			if (activityCounterTotal > 0) {
				html = this.getActivityCounterHtml(this.getActivityCounterTotal());
			} else if (activityProgress > 0) {
				html = this.getActivityCounterHtml(0);
				html += '<span class="crm-kanban-item-activity-indicator crm-kanban-item-activity-indicator--grey"></span>';
			} else {
				html = this.getActivityCounterHtml(0);
			}
			return html;
		}
		getActivityCounterHtml(value = 0, style = BX.UI.CounterStyle.FILLED_NO_ACCENT, isDouble = false) {
			if (this.isActivityLimitIsExceeded()) {
				const label = new ui_system_label.Label({
					value: `?`,
					style: ui_system_label.LabelStyle.FILLED_NO_ACCENT
				}).render();
				label.setAttribute('title', main_core.Loc.getMessage('CRM_KANBAN_ITEM_COUNTER_LIMIT_IS_EXCEEDED'));
				return label.outerHTML;
			}
			if (value === 0) {
				style = BX.UI.CounterStyle.FILLED_NO_ACCENT;
			}
			return new BX.UI.Counter({
				value: value,
				maxValue: 99,
				useAirDesign: true,
				style,
				isDouble
			}).render().outerHTML;
		}
		isActivityLimitIsExceeded() {
			return this.getGridData().isActivityLimitIsExceeded;
		}
		showTooltip(content, target, white) {
			this.hideTooltip();
			const blackOverlay = {
				background: 'black',
				opacity: 0
			};
			const overlay = white ? blackOverlay : null;
			const className = `crm-kanban-without-tooltip ${white ? 'crm-kanban-without-tooltip-white' : 'crm-kanban-tooltip-animate'}`;
			this.popupTooltip = new main_popup.Popup(`kanban_tooltip_${this.id}`, target, {
				className,
				content,
				overlay,
				focusTrap: false,
				offsetLeft: 14,
				darkMode: !white,
				closeByEsc: true,
				angle: true,
				autoHide: true,
				events: {
					onPopupClose: () => {
						main_core.Event.unbind(window, 'scroll', this.adjustPopup.bind(this));
					}
				}
			});
			this.popupTooltip.show();
			main_core.Event.bind(window, 'scroll', this.adjustPopup.bind(this));
		}
		hideTooltip() {
			this.popupTooltip?.destroy();
		}
		createShadow() {
			return main_core.Tag.render`<div class="crm-kanban-item-shadow"></div>`;
		}
		removeHoverClass(itemBlock) {
			main_core.Dom.removeClass(itemBlock, 'crm-kanban-item-event');
			main_core.Dom.removeClass(itemBlock, 'crm-kanban-item-hover');
		}
		adjustPopup() {
			const popup = main_popup.PopupManager.getCurrentPopup();
			if (popup && popup.isShown()) {
				popup.adjustPosition();
			}
		}
		onDragDrop(itemNode) {
			this.dropChangedInPullRequest();
			this.dropColumnChangedInPullRequest();
			this.hideDragTarget();
			const draggableItem = this.getGrid().getItemByElement(itemNode);
			draggableItem.dropChangedInPullRequest();
			draggableItem.dropColumnChangedInPullRequest();
			const event = new BX.Kanban.DragEvent();
			event.setItem(draggableItem);
			event.setTargetColumn(this.getColumn());
			event.setTargetItem(this);
			BX.onCustomEvent(this.getGrid(), 'Kanban.Grid:onBeforeItemMoved', [event]);
			if (!event.isActionAllowed()) {
				return;
			}
			void this.getGrid().moveItem(draggableItem, this.getColumn(), this, true).then(result => {
				if (draggableItem.getColumn().getId() === this.getColumn().getId()) {
					this.getGrid().resetMultiSelectMode();
					this.getGrid().cleanSelectedItems();
				}
			});
		}
		onDragStart() {
			// this.grid.resetMultiSelectMode();

			if (this.dragElement) {
				return;
			}
			const openColumn = this.getGrid().getColumnWithOpenEditor();
			if (openColumn && openColumn.editor && openColumn.editor.hasChangedControls()) {
				openColumn.closeQuickFormEditor();
				return;
			}
			if (!this.checked || this.grid.getChecked().length === 1) {
				this.grid.resetMultiSelectMode();
			}
			if (this.grid.getChecked().length > 1) {
				const moveItems = this.grid.getChecked().reverse();
				this.dragElement = BX.create('div', {
					props: {
						className: 'main-kanban-item-drag-multi'
					}
				});
				for (let i = 0; i < moveItems.length; i++) {
					BX.onCustomEvent(this.getGrid(), 'Kanban.Grid:onItemDragStart', [moveItems[i]]);
					const itemNode = moveItems[i].getContainer().cloneNode(true);
					main_core.Dom.style(itemNode, 'width', `${moveItems[i].getContainer().offsetWidth}px`);
					this.getContainer().maxHeight = `${moveItems[0].getContainer().offsetHeight}px`;
					main_core.Dom.append(itemNode, this.dragElement);
				}
				for (const moveItem of moveItems) {
					main_core.Dom.addClass(moveItem.getContainer(), 'main-kanban-item-disabled');
				}
				main_core.Dom.append(this.dragElement, document.body);
				return;
			}
			BX.onCustomEvent(this.getGrid(), 'Kanban.Grid:onItemDragStart', [this]);
			const container = this.getContainer();
			main_core.Dom.addClass(container, 'main-kanban-item-disabled');
			this.dragElement = container.cloneNode(true);
			main_core.Dom.style(this.dragElement, {
				position: 'absolute',
				width: `${this.getBodyContainer().offsetWidth}px`
			});
			main_core.Dom.addClass(this.dragElement, 'main-kanban-item main-kanban-item-drag');
			main_core.Dom.append(this.dragElement, document.body);
		}
		makeDroppable() {
			if (!this.isDroppable()) {
				return;
			}
			const itemContainer = this.getContainer();
			itemContainer.onbxdestdraghover = this.onDragEnter.bind(this);
			itemContainer.onbxdestdraghout = this.onDragLeave.bind(this);
			itemContainer.onbxdestdragfinish = this.onDragDrop.bind(this);
			itemContainer.onbxdestdragstop = this.onItemDragEnd.bind(this);
			jsDD.registerDest(itemContainer, 5);
			if (this.getGrid().getDragMode() !== BX.Kanban.DragMode.ITEM) {
				// when we load new items in drag mode
				this.disableDropping();
			}
		}
		getContactInfo(type) {
			const data = this.getData();
			return data[type];
		}
		getStageId() {
			return this.getData().stageId;
		}
		animate(params) {
			const duration = params.duration;
			const draw = params.draw;

			// linear function by default, you can set non-linear animation function in timing key
			const timing = params.timing || function (timeFraction) {
				return timeFraction;
			};
			const useAnimation = params.useAnimation && !this.isAnimationInProgress || false;
			const start = performance.now();
			return new Promise(resolve => {
				if (!useAnimation) {
					this.isAnimationInProgress = false;
					resolve();
					return;
				}

				// eslint-disable-next-line unicorn/no-this-assignment
				const item = this;
				item.isAnimationInProgress = true;
				requestAnimationFrame(function animate(time) {
					let timeFraction = (time - start) / duration;
					if (timeFraction > 1) {
						timeFraction = 1;
					}
					const progress = timing(timeFraction);
					draw(progress);
					if (timeFraction < 1) {
						requestAnimationFrame(animate);
					}
					if (progress === 1) {
						item.isAnimationInProgress = false;
						resolve();
					}
				});
			});
		}
		setChangedInPullRequest() {
			this.changedInPullRequest = true;
		}
		dropChangedInPullRequest() {
			this.changedInPullRequest = false;
		}
		isChangedInPullRequest() {
			return this.changedInPullRequest === true;
		}
		setColumnChangedInPullRequest() {
			this.columnChangedInPullRequest = true;
		}
		dropColumnChangedInPullRequest() {
			this.columnChangedInPullRequest = false;
		}
		isColumnChangedInPullRequest() {
			return this.columnChangedInPullRequest === true;
		}

		/**
		 * @returns {boolean}
		 */
		isItemMoveDisabled() {
			const grid = this.getGrid();
			if (!grid.options.canChangeItemStage) {
				return true;
			}
			if (grid.getData().viewMode === ViewMode.MODE_ACTIVITIES && this.getActivityIncomingTotal() > 0) {
				return true;
			}
			const itemColumnData = this.getColumn().getData();
			return grid.getTypeInfoParam('disableMoveToWin') && itemColumnData.type === 'WIN';
		}

		/**
		 * @returns {boolean}
		 */
		isCountable() {
			return this.countable ?? true;
		}

		/**
		 * @returns {boolean}
		 */
		isDraggable() {
			return (this.draggable ?? true) && this.getGrid().canSortItems();
		}

		/**
		 * @returns {boolean}
		 */
		isDroppable() {
			return this.droppable ?? true;
		}

		/**
		 * @returns {{PHONE: (boolean), EMAIL: (boolean), IM: (boolean), WEB: (boolean)}}
		 */
		getRequiredFm() {
			return {
				PHONE: this.isRequiredFmField('PHONE'),
				EMAIL: this.isRequiredFmField('EMAIL'),
				IM: this.isRequiredFmField('IM'),
				WEB: this.isRequiredFmField('WEB')
			};
		}

		/**
		 * @param {string} fieldName
		 * @returns {boolean}
		 */
		isRequiredFmField(fieldName) {
			const data = this.getData();
			if (fieldName === 'PHONE') {
				return data.required_fm?.PHONE ?? true;
			}
			if (fieldName === 'EMAIL') {
				return data.required_fm?.EMAIL ?? true;
			}
			if (fieldName === 'IM') {
				return data.required_fm?.IM ?? true;
			}
			if (fieldName === 'WEB') {
				return data.required_fm?.WEB ?? true;
			}
			return false;
		}
		isValidFmFieldName(fieldName) {
			const fieldNames = ['PHONE', 'EMAIL', 'IM', 'WEB'];
			return fieldNames.includes(fieldName);
		}
		getCurrentUser() {
			const userId = this.getGrid().getData().userId;
			const currentUser = this.getGridData().currentUser;
			if (main_core.Type.isObject(currentUser) && userId > 0) {
				currentUser.userId = userId;
			}
			return currentUser;
		}

		/**
		 * @returns {number}
		 */
		getActivityIncomingTotal() {
			return this.getData().activityIncomingTotal ?? 0;
		}

		/**
		 * @returns {number}
		 */
		getActivityCounterTotal() {
			return this.getData().activityCounterTotal ?? 0;
		}

		/**
		 * @returns {number}
		 */
		getActivityErrorTotal() {
			return this.getData().activityErrorTotal ?? 0;
		}

		/**
		 * @returns {number}
		 */
		getActivityProgress() {
			return this.getData().activityProgress ?? 0;
		}

		/**
		 * @returns {number}
		 */
		getActivityError() {
			return this.getData().activityError ?? 0;
		}

		/**
		 * @returns {Object}
		 */
		getActivitiesByUser() {
			return this.getData().activitiesByUser ?? {};
		}

		/**
		 * @returns {Object[]}
		 */
		getBadges() {
			return this.getData().badges ?? [];
		}

		/**
		 * @returns {string}
		 */
		getContactId() {
			return this.getData().contactId ?? '';
		}

		/**
		 * @returns {string}
		 */
		getCompanyId() {
			return this.getData().companyId ?? '';
		}

		/**
		 * @returns {string}
		 */
		getContactType() {
			return this.getData().contactType ?? '';
		}

		/**
		 * @returns {BX.CRM.Kanban.Grid}
		 */
		getGrid() {
			return super.getGrid();
		}

		/**
		 * @returns {Object}
		 * @property {Object[]} activitiesByUser
		 * @property {number} activityCounterTotal
		 * @property {number} activityError
		 * @property {number} activityIncomingTotal
		 * @property {number} activityProgress
		 * @property {number} activityErrorTotal
		 * @property {string} activityStageId
		 * @property {string} assignedBy
		 * @property {Object[]} badges
		 * @property {Object} calendarSettings
		 * @property {Object} colorSettings
		 * @property {string} columnId
		 * @property {string} companyId
		 * @property {string} contactId
		 * @property {string} contactType
		 * @property {string} currency
		 * @property {string} date
		 * @property {string} dateCreate
		 * @property {boolean} draggable
		 * @property {string} entity_currency
		 * @property {string} entity_price
		 * @property {Object[]} fields
		 * @property {string} id
		 * @property {boolean} isAutomationDebugItem
		 * @property {Object} lastActivity
		 * @property {string} link
		 * @property {string} modifyById
		 * @property {string} name
		 * @property {number} page
		 * @property {string} pingSettings
		 * @property {number} price
		 * @property {string} price_formatted
		 * @property {Object[]} required
		 * @property {Object[]} required_fm
		 * @property {boolean} return
		 * @property {boolean} returnApproach
		 * @property {Object} sort
		 * @property {string | null} special_type
		 * @property {string | null} contactTooltip
		 * @property {string | null} companyTooltip
		 */
		getData() {
			return super.getData();
		}
	}

	/**
	 *
	 * @param options
	 * @extends {BX.Kanban.Column}
	 */
	class Column extends BX.Kanban.Column {
		renderSubtitleTime = 6;
		subtitleNode = null;
		pathToAdd = null;
		editorNodeWaiting = null;
		editorNodeIsBlock = null;
		editorNodeIsVisible = false;
		editorNode = null;
		editorNodeContainer = null;
		editorNodeCreate = null;
		editorNodeSelectFields = null;
		editorNodeSelectPopup = null;
		editorLoaded = false;
		editorOpen = false;
		quickFormSaveButtonInstance = null;
		quickFormCancelButtonInstance = null;
		editorId = null;
		editor = null;
		loader = null;
		isKeyMetaPressed = false;
		clickStatus = null;
		cancelEditHandler = null;
		blockSize = 20;
		canLoadMoreItems = true;
		constructor(options) {
			super(options);
		}
		getSubTitle() {
			const subTitle = super.getSubTitle();
			if (!this.getGrid().getTypeInfoParam('isQuickEditorEnabled') && !this.getGrid().getTypeInfoParam('showTotalPrice')) {
				main_core.Dom.addClass(subTitle, '--hidden');
			}
			return subTitle;
		}

		/**
		 * Custom format method from BX.crm-kanban-quick-form-show .2s cubic-bezier(0.88, -0.08, 0.46, 0.91) forwards.Currency.
		 * @param {float} price Price.
		 * @param {string} currency Currency.
		 * @param {boolean} useTemplate Use or not template.
		 * @returns {string}
		 */
		currencyFormat(price, currency, useTemplate) {
			var result = "",
				format;
			useTemplate = !!useTemplate;
			format = currency_currencyCore.CurrencyCore.getCurrencyFormat(currency);
			if (!!format && typeof format === "object") {
				format.CURRENT_DECIMALS = format.DECIMALS;
				format.HIDE_ZERO = "Y"; //always
				if (format.HIDE_ZERO === "Y" && price == parseInt(price, 10)) {
					format.CURRENT_DECIMALS = 0;
				}
				result = BX.util.number_format(price, format.CURRENT_DECIMALS, format.DEC_POINT, format.THOUSANDS_SEP);
				result = `<span class="crm-kanban-total-price-total__amount">${result}</span>`;
				if (useTemplate) {
					result = format.FORMAT_STRING.replace(/(^|[^&])#/, "$1" + result);
				}
			}
			return result;
		}

		/**
		 * Decrement total price of column.
		 * @param {Number} val Value to decrement.
		 * @returns {void}
		 */
		decPrice(val) {
			if (this.isHiddenTotalSum() || !main_core.Type.isNumber(val)) {
				return;
			}
			const data = this.getData();
			data.sum = parseFloat(data.sum) - val;
			this.setData(data);
		}

		/**
		 * Increment total price of column.
		 * @param {Integer} val Value to increment.
		 * @returns {void}
		 */
		incPrice(val) {
			if (this.isHiddenTotalSum() || !main_core.Type.isNumber(val)) {
				return;
			}
			const data = this.getData();
			data.sum = parseFloat(data.sum) + val;
			this.setData(data);
		}

		/**
		 * Return add-button for new column.
		 * @returns {DOM|null}
		 */
		getAddColumnButton() {
			var columnData = this.getData();
			if (columnData.type === "WIN") {
				this.layout.info.style.marginRight = "0";
				return main_core.Dom.create("div");
			} else {
				return super.getAddColumnButton();
			}
		}

		/**
		 * Get path for add mew element.
		 * @returns {string}
		 */
		getAddPath() {
			if (this.pathToAdd !== null) {
				return this.pathToAdd;
			}
			var gridData = this.getGridData();
			var type = gridData.entityType.toLowerCase();
			var wrapperId, button;
			if (type === "invoice") {
				wrapperId = "crm_invoice_toolbar";
			} else if (type === "order") {
				wrapperId = "toolbar_order_kanban";
			} else {
				wrapperId = "toolbar_" + type + "_list";
			}
			if (BX(wrapperId)) {
				button = BX(wrapperId).querySelector("a");
				if (main_core.Type.isDomNode(button)) {
					this.pathToAdd = button.getAttribute("href");
					this.pathToAdd += this.pathToAdd.indexOf("?") === -1 ? "?" : "&";
				}
			}
			return this.pathToAdd;
		}

		/**
		 *
		 * @param {BX.CRM.Kanban.Item} item
		 * @param {BX.CRM.Kanban.Item} beforeItem
		 */
		addItem(item, beforeItem) {
			if (!(item instanceof BX.Kanban.Item)) {
				throw new Error("item must be an instance of BX.Kanban.Item");
			}
			if (item.layout.container && item.layout.container.classList.contains("main-kanban-item-disabled")) {
				main_core.Dom.removeClass(item.layout.container, "main-kanban-item-disabled");
			}
			var oldColumnId = item.getColumnId();
			item.setColumnId(this.getId());
			//? setGrid

			if (item.checked) {
				item.unSelectItem();
			}
			var index = BX.util.array_search(beforeItem, this.items);
			var items = this.getItems();
			var alreadySet = false;
			for (const itemId in items) {
				if (items[itemId].id === item.getId()) {
					items[itemId] = item;
					alreadySet = true;
				}
			}
			if (!alreadySet) {
				if (index >= 0) {
					this.items.splice(index, 0, item);
				} else {
					this.items.push(item);
				}
				if (item.isVisible()) {
					if (item.isCountable()) {
						this.incrementTotal();
					}
				} else {
					this.getGrid().unhideItem(item);
				}
			}
			this.setPullItemBackground(item);
			if (!item.layout.container) {
				item.useAnimation = false;
			}
			item.animate({
				duration: this.getGrid().animationDuration / 4,
				draw: function (progress) {
					const currentHeight = item.layout.container.scrollHeight * progress;
					item.layout.container.style.height = `${currentHeight}px`;
					item.layout.container.style.zIndex = -1;
				},
				useAnimation: item.useAnimation
			}).then(() => {
				this.setPullItemBackground(item, '#fff');
				item.useAnimation = false;
				const style = {
					height: 'auto',
					opacity: '100%',
					zIndex: null
				};
				main_core.Dom.style(item.layout.container, style);
				const params = {
					item,
					targetColumn: this,
					beforeItem,
					oldColumn: this.grid.getColumn(oldColumnId)
				};
				BX.Event.EventEmitter.emit('Crm.Kanban.Column:onItemAdded', params);
			});
			if (this.getGrid().isRendered()) {
				this.render();
			}
		}
		addItems(items, beforeItem) {
			if (!items) {
				items = this.getGrid().getChecked();
			}
			var forSend = [];
			var index = BX.util.array_search(beforeItem, this.items);
			var afterItemId = 0;
			var afterItem = this.getPreviousItemSibling(beforeItem);
			if (afterItem) {
				afterItemId = afterItem.getId();
			}
			for (var i = 0; i < items.length; i++) {
				items[i].visible = true;
				if (items[i].getColumn() !== this) {
					items[i].getColumn().decPrice(items[i].data.price);
					items[i].getColumn().renderSubTitle();
					this.incPrice(items[i].data.price);
				}
				if (items[i].layout.container && items[i].layout.container.classList.contains("main-kanban-item-disabled")) {
					main_core.Dom.removeClass(items[i].layout.container, "main-kanban-item-disabled");
				}
				items[i].setColumnId(this.getId());

				//? setGrid

				if (items[i].checked) {
					items[i].unSelectItem();
				}
				var itemIndex = BX.util.array_search(items[i], this.items);
				if (beforeItem) {
					if (itemIndex >= 0) {
						this.items.splice(itemIndex, 0, items[i]);
					} else {
						this.items.splice(index, 0, items[i]);
					}
				} else {
					this.items.splice(this.items.length, 0, items[i]);
				}
				if (items[i].isCountable()) {
					this.incrementTotal();
				}
				items[i].parentColumn = null;
				forSend.push(items[i].getId());
			}
			const columnId = this.getId();
			const params = {
				action: 'status',
				entity_id: forSend,
				prev_entity_id: afterItemId,
				status: columnId
			};
			const grid = this.getGrid();
			grid.ajax(params, data => {
				this.prepareGridAfterItemsAdded(items, data);
				this.registerAnalyticsChangeStageEvent(items, data);
			}, error => {
				grid.registerAnalyticsChangeStageEvent(items[0], this.getData().type, forSend, BX.Crm.Integration.Analytics.Dictionary.STATUS_ERROR);
				BX.Kanban.Utils.showErrorDialog(`Error: ${error}`, true);
			});
			if (grid.isRendered()) {
				// crutches for real total items
				const arr = [];
				for (const prop in this.items) {
					if (!BX.util.in_array(this.items[prop].id, arr)) {
						arr.push(this.items[prop].id);
					}
				}
				this.render();
			}
		}
		registerAnalyticsChangeStageEvent(items, data) {
			if (!main_core.Type.isObjectLike(data)) {
				return;
			}
			const grid = this.getGrid();
			const itemsIds = [];
			for (var i = 0; i < items.length; i++) {
				itemsIds.push(items[i].getId());
			}
			let status = '';
			if (data.errorCode && data.errorCode === 'CRM_FIELD_ERROR_REQUIRED') {
				status = BX.Crm.Integration.Analytics.Dictionary.STATUS_ERROR_FILLING_FIELDS;
			} else {
				status = grid.hasResponseError(data) ? BX.Crm.Integration.Analytics.Dictionary.STATUS_ERROR : BX.Crm.Integration.Analytics.Dictionary.STATUS_SUCCESS;
			}
			grid.registerAnalyticsChangeStageEvent(items[0], this.getData().type, itemsIds, status);
		}
		prepareGridAfterItemsAdded(itemIds, data) {
			if (!main_core.Type.isObjectLike(data)) {
				return;
			}
			const {
				grid
			} = this;
			if (grid.hasResponseError(data)) {
				grid.clearItemMoving();
				grid.rollbackItemsMovement(itemIds, this.getId());
				grid.showResponseError(data);
				return;
			}
			if (data.isShouldUpdateCard) {
				const useAnimation = !Array.isArray(itemIds) || itemIds.length <= 1;
				void this.getGrid().loadNew(itemIds, false, true, true, useAnimation);
			}
		}
		hasLoading() {
			if (!this.getGrid().getData().skipColumnCountCheck) {
				return super.hasLoading();
			}
			if (!this.canLoadMoreItems) {
				this.showTotalCount();
				return false;
			}
			return super.getItemsCount() > 0;
		}
		onDragDrop(itemNode, x, y) {
			this.hideDragTarget();
			var event, success;
			var draggableItem = this.getGrid().getItemByElement(itemNode);
			event = new BX.Kanban.DragEvent();
			event.setItem(draggableItem);
			event.setTargetColumn(this);
			BX.onCustomEvent(this.getGrid(), "Kanban.Grid:onBeforeItemMoved", [event]);
			if (!event.isActionAllowed()) {
				return;
			}
			success = this.getGrid().moveItem(draggableItem, this);
			if (success) {
				BX.onCustomEvent(this.getGrid(), "Kanban.Grid:onItemMoved", [draggableItem, this, null]);
			}
		}

		/**
		 * Saving quick editor form.
		 * @return void
		 */
		processQuickEditor() {
			this.editor.save();
		}

		/**
		 * Reset loaded editor form.
		 * @returns {void}
		 */
		resetQuickEditor() {
			this.editorNodeContainer.style.height = this.editorNodeContainer.offsetHeight + "px";
			this.editorNodeContainer.innerHTML = "";
		}

		/**
		 * Gets quick editor instance.
		 * @return {BX.Crm.EntityEditor}
		 */
		getQuickEditor() {
			return this.editor;
		}

		/**
		 * Show quick editor form.
		 * @param {boolean} hidden
		 * @returns {void}
		 */
		showQuickEditor(hidden) {
			if (!hidden) {
				this.editorOpen = true;
			}
			this.getBody().scrollTop = 0;
			var gridData = this.getGridData();
			var entityType = gridData.entityType;
			var categoryId = gridData.params.CATEGORY_ID ? parseInt(gridData.params.CATEGORY_ID) : 0;
			this.editorId = "quick_editor_v6_" + this.getId() + "_" + entityType.toLowerCase() + "_" + categoryId;
			if (!this.getGrid().getTypeInfoParam('isQuickEditorEnabled')) {
				return;
			}
			var isFactoryBasedApproach = this.getGrid().getTypeInfoParam('useFactoryBasedApproach');
			if (typeof gridData.quickEditorPath[entityType.toLowerCase()] === "undefined" && !isFactoryBasedApproach) {
				return;
			}
			var params = gridData.params;
			params['VIEW_MODE'] = gridData.viewMode;
			var context = {
				PARAMS: params
			};
			context[this.getGrid().getTypeInfoParam('stageIdKey')] = this.getId();

			// fields for form
			var formFields = this.getGrid().getTypeInfoParam('defaultQuickFormFields');
			if (!this.editorNodeContainer.innerHTML) {
				if (!hidden) {
					this.layout.subTitleAddButton.classList.add("crm-kanban-column-add-item-button-wait");
					this.disabledAddButton();
				}
				const analyticsConfig = {
					data: BX.Crm.Integration.Analytics.Builder.Entity.AddEvent.createDefault(entityType).setSubSection(BX.Crm.Integration.Analytics.Dictionary.SUB_SECTION_KANBAN).setElement(BX.Crm.Integration.Analytics.Dictionary.ELEMENT_QUICK_BUTTON).buildData()
				};
				if (isFactoryBasedApproach) {
					BX.ajax.runAction('crm.api.item.getEditor', {
						data: {
							entityTypeId: gridData.entityTypeInt,
							id: 0,
							stageId: this.getId(),
							categoryId: gridData.params.CATEGORY_ID ? gridData.params.CATEGORY_ID : 0,
							guid: this.editorId,
							configId: gridData.editorConfigId,
							viewMode: gridData.viewMode,
							params: {
								'ENABLE_PERSONAL_CONFIGURATION_UPDATE': true,
								'ENABLE_COMMON_CONFIGURATION_UPDATE': true,
								'ENABLE_CONFIG_SCOPE_TOGGLE': true,
								'ENABLE_SETTINGS_FOR_ALL': true,
								'POST_FORM_ANALYTICS_DATA': analyticsConfig,
								'HOST_COLUMN_FOR_QUICK_EDITOR_ID': this.getId().toString()
							}
						}
					}).then(response => {
						var result = BX.processHTML(response.data.html);
						this.editorNodeContainer.innerHTML = response.data.html;
						this.editorNodeContainer.appendChild(this.editorNodeCreate);
						this.editorNode.style.height = "0px";
						BX.ajax.processScripts(result.SCRIPT, undefined, () => {
							var interval = setInterval(() => {
								if (this.editorNodeContainer.offsetHeight < 150) {
									return;
								}
								if (!this.editorOpen) {
									this.layout.subTitleAddButton.classList.remove("crm-kanban-column-add-item-button-wait");
									return;
								}
								if (hidden) {
									return;
								}
								this.editorNode.style.height = this.editorNodeContainer.offsetHeight + "px";
								this.layout.subTitleAddButton.classList.remove("crm-kanban-column-add-item-button-wait");
								var autoHideEditor = () => {
									this.editorNode.style.height = null;
									main_core.Event.unbind(this.editorNode, 'transitionend', autoHideEditor);
								};
								main_core.Event.bind(this.editorNode, 'transitionend', autoHideEditor);
								clearInterval(interval);
							}, 100);
						});
					});
				} else {
					BX.ajax.post(gridData.quickEditorPath[entityType.toLowerCase()], {
						ACTION: "PREPARE_EDITOR_HTML",
						ACTION_ENTITY_TYPE_NAME: entityType,
						ACTION_ENTITY_ID: 0,
						GUID: this.editorId,
						CONFIG_ID: gridData.editorConfigId,
						FORCE_DEFAULT_CONFIG: "N",
						FORCE_DEFAULT_OPTIONS: "Y",
						IS_EMBEDDED: "Y",
						ENABLE_CONFIG_SCOPE_TOGGLE: "Y",
						ENABLE_CONFIGURATION_UPDATE: "Y",
						ENABLE_REQUIRED_USER_FIELD_CHECK: "Y",
						ENABLE_FIELDS_CONTEXT_MENU: "N",
						FIELDS: formFields,
						CONTEXT: context,
						POST_FORM_ANALYTICS_DATA: analyticsConfig,
						HOST_COLUMN_FOR_QUICK_EDITOR_ID: this.getId().toString()
					}, result => {
						this.editorNodeContainer.innerHTML = result;
						this.editorNodeContainer.appendChild(this.editorNodeCreate);
						if (!this.editorOpen) {
							this.layout.subTitleAddButton.classList.remove("crm-kanban-column-add-item-button-wait");
							return;
						}
						if (hidden) {
							return;
						}
						this.editorNode.style.height = "0px";
						var interval = setInterval(() => {
							if (this.editorNodeContainer.offsetHeight < 150) {
								return;
							}
							this.editorNode.style.height = this.editorNodeContainer.offsetHeight + "px";
							this.layout.subTitleAddButton.classList.remove("crm-kanban-column-add-item-button-wait");
							var autoHideEditor = () => {
								this.editorNode.style.height = null;
								main_core.Event.unbind(this.editorNode, 'transitionend', autoHideEditor);
							};
							main_core.Event.bind(this.editorNode, 'transitionend', autoHideEditor);
							clearInterval(interval);
						}, 100);
					});
				}
			} else {
				this.getLoader().hide();
				this.hideQuickEditorLoader();
			}

			// catch editor instance after load
			if (!this.editorLoaded) {
				BX.addCustomEvent(window, "BX.Crm.EntityEditor:onInit", (sender, eventArgs) => {
					if (sender.getId() === this.editorId) {
						this.editor = sender;
					}
				});
				BX.addCustomEvent(window, 'onCrmEntityCreateError', ({
					error,
					checkErrors
				}) => {
					this.hideQuickEditorLoader();
					if (main_core.Type.isUndefined(error)) {
						return;
					}
					if (main_core.Type.isObject(checkErrors)) {
						this.openQuickFormPartialEditor(Object.keys(checkErrors));
					} else if (main_core.Type.isStringFilled(error)) {
						BX.UI.Notification.Center.notify({
							content: main_core.Text.encode(error.replaceAll('<br />', '\n')),
							autoHideDelay: 5000
						});
					}
				});
				if (!this.cancelEditHandler) {
					this.cancelEditHandler = params => {
						this.hideQuickEditorLoader();
					};
					BX.addCustomEvent(window, "BX.Crm.EntityEditor:onFailedValidation", this.cancelEditHandler);
					BX.addCustomEvent(window, "BX.Crm.EntityEditor:onRestrictionAction", this.cancelEditHandler);
				}
				BX.addCustomEvent(window, 'BX.Crm.EntityEditorAjax:onSubmitFailure', errors => {
					if (this.editorOpen) {
						this.quickFormSaveButtonInstance.setWaiting(false);
						this.editorNode.classList.remove("crm-kanban-quick-form-wait");
						var message = '';
						var requiredFields = [];
						for (var i in errors) {
							if (errors.hasOwnProperty(i) && errors[i].message) {
								if (errors[i].code === 'CRM_FIELD_ERROR_REQUIRED' && errors[i].customData && errors[i].customData.fieldName) {
									requiredFields.push(errors[i].customData.fieldName);
								}
								message += errors[i].message + ', ';
							}
						}
						if (requiredFields.length > 0) {
							this.openQuickFormPartialEditor(requiredFields);
						} else {
							BX.Kanban.Utils.showErrorDialog(main_core.Text.encode(message), true);
						}
					}
				});
				BX.addCustomEvent(window, "onCrmEntityCreate", entityData => {
					var context = entityData.sender.getContext();
					var statusKey = this.getGrid().getTypeInfoParam('stageIdKey');
					if (context[statusKey] === this.getId()) {
						this.getGrid().loadNew(entityData.entityId, true, false, false, true);
					}
					if (this.editorOpen) {
						this.hideQuickEditorLoader();
						entityData.isCancelled = true;
					}
				});
				var currentColumn = this;
				BX.addCustomEvent("CRM.Kanban.Column:clickAddButton", function () {
					if (currentColumn !== this) {
						currentColumn.closeQuickFormEditor();
					}
				});
				main_core.Event.bind(window, "keydown", ev => {
					if (ev.code === "MetaRight" || ev.code === "MetaLeft" || ev.code === "ControlRight" || ev.code === "ControlLeft") {
						this.isKeyMetaPressed = true;
					}
				});
				main_core.Event.bind(window, "keyup", ev => {
					const codes = ['MetaRight', 'MetaLeft', 'ControlRight', 'ControlLeft'];
					if (codes.includes(ev.code)) {
						this.isKeyMetaPressed = false;
					}
				});
				main_core.Event.bind(window, "keydown", ev => {
					if ((ev.code === "Enter" || ev.code === "NumpadEnter") && this.isKeyMetaPressed && this.editorOpen) {
						this.processQuickEditor();
						if (this.editor.isRequestRunning()) {
							this.showQuickEditorLoader();
						}
						BX.PreventDefault(ev);
					}
				});
				BX.addCustomEvent(window, "BX.CRM.Kanban.Item.select", this.closeQuickFormEditor.bind(this));
				//BX.addCustomEvent(window, "Kanban.Column:render", this.hideQuickFormEditor.bind(this));
				BX.addCustomEvent(window, "onCrmEntityCreate", this.hideQuickFormEditor.bind(this));
				BX.addCustomEvent(window, "Kanban.Column:render", this.enabledAddButton.bind(this));
				BX.addCustomEvent(window, "Kanban.Grid:onItemDragStart", this.enabledAddButton.bind(this));
				BX.addCustomEvent(window, "Kanban.Grid:onItemDragStart", () => {
					if (this.editorOpen) {
						main_core.Event.bind(this.editorNode, "transitionend", () => {
							for (var i = 0; i < this.items.length; i++) {
								this.items[i].makeDroppable();
							}
						});
					}
					this.hideQuickFormEditor();
					this.enabledAddButton();
					this.cleanEditor();
				});
			}
			this.editorLoaded = true;
			this.layout.items.insertBefore(this.editorNode, this.layout.items.firstChild);
		}
		openQuickFormPartialEditor(fieldNames) {
			if (!this.editorOpen || this.quickFormPartialEditor && this.quickFormPartialEditor._isLocked) {
				return;
			}
			var formData = new FormData(this.editor._ajaxForm._elementNode),
				presetValues = {};
			var formDataEntries = formData.entries(),
				formDataEntry = formDataEntries.next(),
				pair;
			while (!formDataEntry.done) {
				pair = formDataEntry.value;
				if (presetValues[pair[0]] === undefined) {
					presetValues[pair[0]] = [];
				}
				presetValues[pair[0]].push(pair[1]);
				formDataEntry = formDataEntries.next();
			}
			var gridData = this.grid.getData();
			var context = {};
			context[this.getGrid().getTypeInfoParam('stageIdKey')] = this.id;
			context['NOT_CHANGE_STATUS'] = 'Y';
			var settings = {
				entityTypeId: gridData.entityTypeInt,
				entityId: 0,
				fieldNames: fieldNames,
				context: context,
				values: [],
				presetValues: presetValues,
				analyticsConfig: {
					data: BX.Crm.Integration.Analytics.Builder.Entity.AddEvent.createDefault(gridData.entityType).setSubSection(BX.Crm.Integration.Analytics.Dictionary.SUB_SECTION_KANBAN).setElement(BX.Crm.Integration.Analytics.Dictionary.ELEMENT_FILL_REQUIRED_FIELDS_POPUP).buildData()
				}
			};
			if (this.getGrid().getTypeInfoParam('useFactoryBasedApproach')) {
				settings.title = main_core.Loc.getMessage('CRM_TYPE_ITEM_PARTIAL_EDITOR_TITLE');
				settings.isController = true;
				settings.entityTypeName = gridData.entityType;
				settings.stageId = this.getId();
				if (gridData.params.CATEGORY_ID) {
					settings.categoryId = gridData.params.CATEGORY_ID;
				}
			} else {
				settings.title = main_core.Loc.getMessage("CRM_KANBAN_REQUIRED_FIELDS_TITLE_" + gridData.entityType);
			}
			this.quickFormPartialEditor = BX.Crm.QuickFormPartialEditorDialog.create("quickform-partial-entity-editor", settings);
			this.quickFormPartialEditor.open();
		}
		isEditorOpen() {
			return this.editorOpen;
		}
		showQuickEditorLoader() {
			this.quickFormSaveButtonInstance.setWaiting(true);
			this.editorNode.classList.add("crm-kanban-quick-form-wait");
		}
		hideQuickEditorLoader() {
			this.quickFormSaveButtonInstance.setWaiting(false);
			this.editorNode.classList.remove("crm-kanban-quick-form-wait");
		}
		closeQuickFormEditor() {
			if (!this.editorOpen) {
				return Promise.resolve(true);
			}
			if (!this.editor || !this.editor.hasChangedControls()) {
				this.enabledAddButton();
				this.hideQuickFormEditor();
				this.cleanEditor();
				return Promise.resolve(true);
			}
			const confirmDialogId = 'kanban_close_quick_editor_confirm';
			const confirmDialog = BX.Crm.ConfirmationDialog.get(confirmDialogId) ?? BX.Crm.ConfirmationDialog.create(confirmDialogId, {
				title: main_core.Loc.getMessage('CRM_KANBAN_CLOSE_QUICK_EDITOR_TITLE'),
				content: main_core.Loc.getMessage('CRM_KANBAN_CLOSE_QUICK_EDITOR_CONTENT'),
				cancelButtonTitle: main_core.Loc.getMessage('CRM_KANBAN_CLOSE_QUICK_EDITOR_CANCEL_BUTTON'),
				acceptButtonTitle: main_core.Loc.getMessage('CRM_KANBAN_CLOSE_QUICK_EDITOR_ACCEPT_BUTTON')
			});
			return confirmDialog.open().then(result => {
				if (BX.prop.getBoolean(result, 'cancel', true)) {
					return false;
				}
				this.enabledAddButton();
				this.hideQuickFormEditor();
				this.cleanEditor();
				return true;
			});
		}

		/**
		 * Hide quick form editor.
		 * @return {void}
		 */
		hideQuickFormEditor() {
			if (!this.editorOpen) {
				return;
			}
			this.editorOpen = false;
			this.editorNode.style.height = this.editorNode.offsetHeight + "px";
			setTimeout(() => {
				this.editorNode.style.height = "0px";
			}, 10);
		}
		disabledAddButton() {
			main_core.Dom.addClass(this.layout.subTitleAddButton, "crm-kanban-column-add-item-button-event");
		}
		enabledAddButton() {
			main_core.Dom.removeClass(this.layout.subTitleAddButton, "crm-kanban-column-add-item-button-event");
		}

		/**
		 * Is quick form popup?
		 * @param {Element} target
		 * @return {boolean}
		 */
		isQuickFormPopup(target) {
			return BX.findParent(target, {
				className: "popup-window"
			});
		}

		/**
		 * Is target bound to document or was removed in another callback of this onclick event?
		 * @param {Element} target
		 * @return {boolean}
		 */
		isBoundToDocument(target) {
			return !!target.closest('body');
		}

		/**
		 * Is quick form editor?
		 * @param {Element} target
		 * @return {boolean}
		 */
		isQuickFormEditor(target) {
			return BX.findParent(target, {
				className: "ui-entity-editor-column-content"
			});
		}

		/**
		 * @returns {HTMLElement}
		 */
		renderSubTitle() {
			if (this.canAddItem === null) {
				this.canAddItem = true;
			}
			this.createSubTitlePrice();
			if (this.subtitleNode) {
				return this.subtitleNode;
			}

			// create sum and button if no exists
			let plusTitle = '';
			const data = this.getData();
			const gridData = this.getGridData();
			if (data.sort === 100 && this.getGrid().getTypeInfoParam('hasPlusButtonTitle')) {
				plusTitle = gridData.isDynamicEntity ? main_core.Loc.getMessage('CRM_KANBAN_PLUS_TITLE_DYNAMIC') : main_core.Loc.getMessage(`CRM_KANBAN_PLUS_TITLE_${gridData.entityType}`) || main_core.Loc.getMessage(`CRM_KANBAN_PLUS_TITLE_${gridData.entityType}_MSGVER_1`);
			}
			{
				this.editorNode = main_core.Dom.create("div", {
					props: {
						className: "crm-kanban-quick-form --ui-context-content-light"
					},
					style: {
						height: "0px"
					},
					children: [this.editorNodeContainer = main_core.Dom.create("div", {
						props: {
							className: "crm-kanban-quick-form-container"
						}
					})]
				});
				this.quickFormSaveButtonInstance = new ui_buttons.Button({
					text: main_core.Loc.getMessage("CRM_KANBAN_POPUP_SAVE"),
					size: ui_buttons.ButtonSize.SMALL,
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.FILLED,
					onclick: () => {
						this.processQuickEditor();
						this.showQuickEditorLoader();
					}
				});
				this.quickFormCancelButtonInstance = new ui_buttons.Button({
					text: main_core.Loc.getMessage("CRM_KANBAN_CONFIRM_N"),
					size: ui_buttons.ButtonSize.SMALL,
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.OUTLINE,
					onclick: () => {
						this.enabledAddButton();
						this.hideQuickFormEditor();
						this.cleanEditor();
					}
				});
				this.editorNodeCreate = main_core.Dom.create("div", {
					props: {
						className: "crm-kanban-quick-form-buttons"
					},
					children: [this.quickFormSaveButtonInstance.render(), this.quickFormCancelButtonInstance.render()]
				});
			}
			var stageIdKey = this.getGrid().getTypeInfoParam('stageIdKey');
			stageIdKey = stageIdKey.toLowerCase();
			if (this.canAddItem && this.getGrid().getTypeInfoParam('isQuickEditorEnabled')) {
				this.layout.subTitleAddButton = main_core.Dom.create("div", {
					text: plusTitle,
					attrs: {
						className: "crm-kanban-column-add-item-button"
					},
					events: {
						click: ev => {
							const tariffRestrictions = gridData.tariffRestrictions || {};
							if (tariffRestrictions.addItemNotPermittedByTariff === true) {
								BX.Crm.Router.Instance.showFeatureSlider();
								return;
							}
							// @todo Checking bx-ie is still actually?
							if (document.getElementsByTagName("html")[0].classList.contains("bx-ie")) {
								if (gridData.entityType === "LEAD") {
									main_sidepanel.SidePanel.Instance.open("/crm/lead/details/0/?category_id=" + gridData.params.CATEGORY_ID);
								} else if (gridData.entityType === "DEAL") {
									main_sidepanel.SidePanel.Instance.open("/crm/deal/details/0/");
								}
								return;
							}
							if (BX.hasClass(this.layout.subTitleAddButton, "crm-kanban-column-add-item-button-event")) {
								return;
							}
							this.disabledAddButton();
							if (!this.editorNodeContainer.innerHTML) {
								const openColumn = this.getGrid().getColumnWithOpenEditor(this);
								const releaseAllOtherColumns = () => {
									const columns = this.getGrid().getColumns();
									for (let i = 0; i < columns.length; i++) {
										if (columns[i] !== this) {
											if (columns[i].editor) {
												columns[i].editor.release();
												columns[i].editor = null;
												columns[i].editorOpen = false;
												columns[i].editorLoaded = false;
												BX.cleanNode(columns[i].editorNodeContainer);
											}
											columns[i].hideQuickFormEditor();
											columns[i].enabledAddButton();
											columns[i].cleanEditor();
										}
									}
								};
								if (openColumn) {
									openColumn.closeQuickFormEditor().then(closed => {
										if (!closed) {
											this.enabledAddButton();
											return;
										}
										releaseAllOtherColumns();
										this.showQuickEditor();
									});
									return;
								}
								releaseAllOtherColumns();
								this.showQuickEditor();
								return;
							}
							const openEditor = () => {
								BX.onCustomEvent(this, "CRM.Kanban.Column:clickAddButton", this);
								if (!this.editorNode.parentNode) {
									this.layout.items.insertBefore(this.editorNode, this.layout.items.firstElementChild);
								}
								this.getBody().scrollTop = 0;
								this.editorNode.style.height = "0px";
								this.editorOpen = true;
								setTimeout(() => {
									this.editorNode.style.height = this.editorNodeContainer.offsetHeight + "px";
									const autoHideEditor = () => {
										this.editorNode.style.height = null;
										main_core.Event.unbind(this.editorNode, 'transitionend', autoHideEditor);
									};
									main_core.Event.bind(this.editorNode, 'transitionend', autoHideEditor);
									if (this.editor) {
										this.editor.refreshLayout({
											reset: true
										});
									}
								}, 10);
							};
							const openColumn = this.getGrid().getColumnWithOpenEditor(this);
							if (openColumn) {
								openColumn.closeQuickFormEditor().then(closed => {
									if (!closed) {
										this.enabledAddButton();
										return;
									}
									openEditor();
								});
							} else {
								openEditor();
							}
						} 
					}
				});
			} else if (this.canAddItem) {
				this.layout.subTitleAddButton = this.getAddPath() ? main_core.Dom.create("a", {
					text: plusTitle,
					attrs: {
						className: "crm-kanban-column-add-item-button",
						href: this.getAddPath() + stageIdKey + '=' + this.getId()
					}
				}) : null;
			} else if (this.isShowHiddenAddItemButton()) {
				this.layout.subTitleAddButton = main_core.Tag.render`
				<div class="crm-kanban-column-add-item-button--dummy"</div>
			`;
			}
			this.subtitleNode = main_core.Dom.create("div", {
				children: [this.layout.subTitlePrice, this.layout.subTitleAddButton
				// just a button for new window
				, this.editorNode]
			});
			return this.subtitleNode;
		}
		createSubTitlePrice() {
			this.createSubTitlePriceLayout();
			this.renderSubTitlePrice();
		}
		createSubTitlePriceLayout() {
			const isShowTotalPrice = this.getGrid().getTypeInfoParam('showTotalPrice');
			if (isShowTotalPrice && !this.layout.subTitlePrice) {
				this.layout.subTitlePriceText = main_core.Tag.render`<span class="crm-kanban-total-price-total"></span>`;
				this.layout.subTitlePrice = main_core.Tag.render`<div class="crm-kanban-total-price">`;
				main_core.Dom.append(this.layout.subTitlePriceText, this.layout.subTitlePrice);
			} else if (!isShowTotalPrice) {
				this.layout.subTitlePrice = null;
			}
			if (this.isHiddenTotalSum()) {
				const {
					subTitlePriceText
				} = this.layout;
				main_core.Event.unbindAll(subTitlePriceText, 'mouseenter');
				main_core.Event.unbindAll(subTitlePriceText, 'mouseleave');
				main_core.Event.bind(subTitlePriceText, 'mouseenter', this.onSubTitlePriceMouseEnter.bind(this));
				main_core.Event.bind(subTitlePriceText, 'mouseleave', this.onSubTitlePriceMouseLeave.bind(this));
			}
		}
		onSubTitlePriceMouseEnter() {
			this.columnSumPopup = main_popup.PopupManager.create(this.getHideColumnSumPopupId(), this.layout.subTitlePriceText, {
				autoHide: true,
				angle: true,
				animation: 'fading',
				darkMode: true,
				offsetTop: -10,
				offsetLeft: this.layout.subTitlePriceText.offsetWidth / 2,
				content: main_core.Loc.getMessage('CRM_KANBAN_COLUMN_HIDDEN_SUM'),
				bindOptions: {
					position: 'top'
				},
				params: {
					angleLeftOffset: 200
				}
			});
			this.columnSumPopup.show();
		}
		getHideColumnSumPopupId() {
			return `kanban-column-${this.getId()}-hidden-sum-popup`;
		}
		onSubTitlePriceMouseLeave() {
			this.columnSumPopup.close();
		}
		renderSubTitlePrice() {
			if (!this.layout.subTitlePriceText) {
				return;
			}
			if (this.isHiddenTotalSum()) {
				this.renderHiddenTotalSum();
			} else {
				this.animateChangeSubTitlePrice();
			}
		}
		renderHiddenTotalSum() {
			if (!this.layout.subTitlePriceText || !this.isHiddenTotalSum()) {
				return;
			}
			const {
				currencyFormat
			} = this.getData();
			this.layout.subTitlePriceText.innerHTML = `***** ${currencyFormat}`;
		}
		animateChangeSubTitlePrice() {
			const data = this.getData();
			data.sum = parseFloat(data.sum);
			data.sum_init = data.sum;
			data.sum_old = data.sum_old ? data.sum_old : data.sum_init;
			if (this.subTitleAnimationInterval) {
				clearInterval(this.subTitleAnimationInterval);
			}
			const currency = this.getGridData().currency;
			this.subTitleAnimationInterval = this.renderSubTitleAnimation(data.sum_old, data.sum, Math.abs(data.sum_old - data.sum) / 20, this.layout.subTitlePriceText, (element, value) => {
				element.innerHTML = this.currencyFormat(Math.round(value), currency, true);
				data.sum_old = data.sum;
			});
			this.setData(data);
		}
		isHiddenTotalSum() {
			const {
				hiddenTotalSum
			} = this.getData();
			return Boolean(hiddenTotalSum);
		}
		isShowHiddenAddItemButton() {
			const columns = this.getGrid().getColumns();
			return columns.some(column => column.canAddItem);
		}
		cleanEditorNode() {
			BX.cleanNode(this.editorNodeContainer);
		}
		cleanEditor() {
			if (this.editor) {
				this.editor.rollback();
				this.editor.refreshLayout();
			}
		}

		/**
		 * Gets system loader.
		 * @return {Element}
		 */
		getLoader() {
			if (!this.loader) {
				this.loader = new main_loader.Loader({
					target: this.editorNode
				});
			}
			return this.loader;
		}

		/**
		 * Animate change from start to val with step in element.
		 * @param {Number} start
		 * @param {Number} value
		 * @param {Number} step
		 * @param {DOM} element
		 * @param {Function} finalCall Call finally for element with val.
		 * @returns {number | null}
		 */
		renderSubTitleAnimation(start, value, step, element, finalCall) {
			var i = start;
			var val = parseFloat(value);
			var timeout = this.renderSubtitleTime;
			if (i === val) {
				if (typeof finalCall === 'function') {
					finalCall(element, value);
				}
				return null;
			}
			var sign = start > value ? 'minus' : 'plus';
			var condition = function (currentValue) {
				return sign === 'plus' ? value < currentValue : value > currentValue;
			};
			if (start > val) {
				step = -1 * step;
			}
			var timer = setInterval(function () {
				element.textContent = BX.util.number_format(i, 0, ",", " ");
				i += step;
				if (condition(i)) {
					clearInterval(timer);
					this.subTitleAnimationInterval = null;
					finalCall(element, value);
				}
			}.bind(this), timeout);
			return timer;
		}
		handleAddColumnButtonClick(event) {
			const gridData = this.getGridData();
			if (gridData.rights?.canAddColumn) {
				const newColumn = this.getGrid().addColumn({
					id: "kanban-new-column-" + BX.util.getRandomString(5),
					type: "BX.CRM.Kanban.DraftColumn",
					canSort: false,
					canAddItem: false,
					droppable: false,
					targetId: this.getGrid().getNextColumnSibling(this)
				});
				newColumn.switchToEditMode();
			} else if (gridData.isLockedEntity) {
				this.getGrid().showLockedEntitySlider();
			} else if (!main_core.Type.isUndefined(BX.Intranet)) {
				this.getGrid().accessNotify();
			}
		}
		switchToEditMode() {
			const gridData = this.getGridData();
			if (gridData.rights?.canEditColumn) {
				super.switchToEditMode();
			} else if (gridData.isLockedEntity) {
				this.getGrid().showLockedEntitySlider();
			} else if (!main_core.Type.isUndefined(BX.Intranet)) {
				this.getGrid().accessNotify();
			}
		}
		focusTextBox() {
			setTimeout(() => {
				this.getTitleTextBox().focus();
			});
		}
		makeDroppable() {
			if (!this.isDroppable()) {
				return;
			}
			var columnBody = this.getBody();
			columnBody.onbxdestdraghover = this.onDragEnter.bind(this);
			columnBody.onbxdestdraghout = this.onDragLeave.bind(this);
			columnBody.onbxdestdragfinish = this.onDragDrop.bind(this);
			columnBody.onbxdestdragstop = this.onItemDragEnd.bind(this);
			jsDD.registerDest(columnBody, 10);
			this.disableDropping();
		}

		/**
		 *
		 * @param {BX.CRM.Kanban.Item} itemToRemove
		 */
		removeItem(itemToRemove) {
			return new Promise((resolve, reject) => {
				var found = false;
				this.items = this.items.filter(function (item) {
					if (item === itemToRemove) {
						found = true;
						return false;
					}
					return true;
				});
				if (found) {
					const currentOpacityPercent = itemToRemove.layout.container.style.opacity * 100;
					const useAnimation = currentOpacityPercent === 100 ? itemToRemove.useAnimation : false;
					this.setPullItemBackground(itemToRemove);
					itemToRemove.animate({
						useAnimation,
						duration: this.getGrid().animationDuration,
						draw: function (progress) {
							const opacity = currentOpacityPercent - progress * currentOpacityPercent + '%';
							itemToRemove.layout.container.style.opacity = opacity;
						}
					}).then(value => {
						if (itemToRemove.isCountable() && itemToRemove.isVisible()) {
							this.decrementTotal();
							this.getGrid().resetMultiSelectMode();
						}
						if (this.getGrid().isRendered()) {
							this.render();
						}
						resolve();
					});
				} else {
					resolve();
				}
			});
		}

		/**
		 *
		 * @param {BX.CRM.Kanban.Item} item
		 * @param {string} backgroundColor
		 */
		setPullItemBackground(item, backgroundColor = '#fffabf') {
			if (item.changedInPullRequest && item.layout.bodyContainer.children[0]) {
				item.layout.bodyContainer.children[0].style.backgroundColor = backgroundColor;
			}
		}
		setLoadingInProgress(value = true) {
			this.loadingInProgress = value;
		}
		setLoadingMoreItem(value = true) {
			this.canLoadMoreItems = value;
		}
		showTotalCount() {
			if (main_core.Dom.hasClass(this.layout.total, '--hidden')) {
				this.renderTitle();
				main_core.Dom.removeClass(this.layout.total, '--hidden');
			}
		}
		getTotalItem() {
			const totalItem = super.getTotalItem();
			if (this.getGrid().getData().skipColumnCountCheck) {
				totalItem.classList.add('--hidden');
			}
			return totalItem;
		}
		cleanLayoutItems() {
			var childNodes = Array.from(this.layout.items.childNodes);
			childNodes.map((item, index) => {
				if (item.classList.contains('main-kanban-item')) {
					this.layout.items.removeChild(item);
				}
			});
		}
		hasItem(id) {
			return this.items.some(item => item.id === id);
		}
	}
	class DraftColumn extends BX.Kanban.DraftColumn {
		constructor(options) {
			super(options);
		}
		handleRemoveButtonClick(event) {
			this.getGrid().getColumns().forEach(function (column) {
				column.getAddColumnButton().style.visibility = null;
			});
			super.handleRemoveButtonClick(event);
		}
	}

	/**
	 * @param options
	 * @extends {BX.Kanban.DropZone}
	 */
	class DropZone extends BX.Kanban.DropZone {
		droppedItems = [];
		constructor(options) {
			super(options);
			this.droppedItems = [];
		}

		/**
		 *
		 * @param {Element} itemNode
		 * @param {number} x
		 * @param {number} y
		 */
		onDragDrop(itemNode, x, y) {
			var draggableItem;
			var gridData = this.getGrid().getData();
			var data = this.getData();
			this.getGrid().dropZonesShow = true;
			if (this.getGrid().getChecked().length > 1 && (gridData.entityType === "LEAD" && data.type === "WIN" || gridData.entityType === "INVOICE")) {
				this.getGrid().getPopupCancel(main_core.Loc.getMessage("CRM_KANBAN_MASS_CONVERT_DISABLE_MSGVER_1")).show();
				if (this.getGrid().getChecked().length > 0) {
					for (var i = 0; i < this.getGrid().getChecked().length; i++) {
						main_core.Dom.removeClass(this.getGrid().getChecked()[i].layout.container, "main-kanban-item-disabled");
					}
					this.getGrid().resetMultiSelectMode();
				}
				return;
			}
			var checkedElements = this.getGrid().getChecked();
			draggableItem = this.getGrid().getItemByElement(itemNode);
			this.captureItem(draggableItem);
			this.getDropZoneArea().unsetActive();
			if (checkedElements.length > 1 && this.droppedItem) {
				this.droppedItems = checkedElements;
				for (var i = 0; i < this.droppedItems.length; i++) {
					this.getGrid().hideItem(this.droppedItems[i]);
					if (draggableItem !== this.droppedItems[i]) {
						this.droppedItems[i].getColumn().decPrice(this.droppedItems[i].data.price);
						this.droppedItems[i].getColumn().renderSubTitle();
					}
				}
				this.getGrid().resetMultiSelectMode();
			}
		}

		/**
		 *
		 * @param {BX.Kanban.Item} item
		 */
		captureItem(item) {
			const event = new DropZoneEvent();
			event.setItem(item);
			event.setDropZone(this);
			BX.onCustomEvent(this.getGrid(), "Kanban.DropZone:onBeforeItemCaptured", [event]);
			if (!event.isActionAllowed()) {
				return;
			}
			this.empty();
			this.droppedItem = item;
			this.getDropZoneArea().show();
			this.setCaptured();
			this.unsetActive();
			this.animateRemove(item.layout.container);
			this.getGrid().hideItem(item);
			BX.onCustomEvent(this.getGrid(), 'Kanban.DropZone:onItemCaptured', [item, this, event.groupIds]);
			this.captureTimeout = setTimeout(() => {
				this.empty();
				this.getDropZoneArea().hide();
				this.droppedItems = [];
				this.getGrid().dropZonesShow = false;
			}, this.getDropZoneArea().getDropZoneTimeout());
		}
		restore() {
			this.getGrid().dropZonesShow = false;
			if (this.captureTimeout) {
				clearTimeout(this.captureTimeout);
			}
			if (this.droppedItem === null) {
				return;
			}
			var event = new BX.Kanban.DropZoneEvent();
			if (!event.isActionAllowed()) {
				return;
			}
			this.unsetActive();
			this.unsetCaptured();
			if (this.droppedItems.length > 0) {
				this.droppedItems = this.getGrid().getChecked();
				for (var i = 0; i < this.droppedItems.length; i++) {
					event.setItem(this.droppedItems[i]);
					event.setDropZone(this);
					BX.onCustomEvent(this.getGrid(), "Kanban.DropZone:onBeforeItemRestored", [event]);
					this.getGrid().unhideItem(this.droppedItems[i]);
					if (this.droppedItem !== this.droppedItems[i]) {
						this.droppedItems[i].getColumn().incPrice(this.droppedItems[i].data.price);
						this.droppedItems[i].getColumn().renderSubTitle();
					}
					BX.onCustomEvent(this.getGrid(), "Kanban.DropZone:onItemRestored", [this.droppedItems[i], this]);
				}
				this.droppedItem = null;
				return;
			}
			event.setItem(this.droppedItem);
			event.setDropZone(this);
			BX.onCustomEvent(this.getGrid(), "Kanban.DropZone:onBeforeItemRestored", [event]);
			this.getGrid().unhideItem(this.droppedItem);
			BX.onCustomEvent(this.getGrid(), "Kanban.DropZone:onItemRestored", [this.droppedItem, this]);
			this.droppedItem = null;
		}

		/**
		 *
		 * @returns {Element}
		 */
		getContainer() {
			if (this.layout.container !== null) {
				return this.layout.container;
			}
			var childrens = [];
			childrens.push(this.getNameContainer());
			if (this.getId() !== 'DELETED') {
				childrens.push(this.getCancelLink());
			}
			childrens.push(this.getBgContainer());
			this.layout.container = main_core.Dom.create("div", {
				attrs: {
					className: "main-kanban-dropzone",
					"data-id": this.getId()
				},
				children: childrens
			});
			this.makeDroppable();
			var dropZonesArray = [];
			for (var prop in this.dropZoneArea.dropZones) {
				dropZonesArray.push(this.dropZoneArea.dropZones[prop]);
			}
			if (dropZonesArray.length === 1) {
				this.layout.container.style.minWidth = "auto";
				this.layout.container.style.maxWidth = "none";
			}
			return this.layout.container;
		}
		makeDroppable() {
			var container = this.getContainer();
			container.onbxdestdraghover = this.onDragEnter.bind(this);
			container.onbxdestdraghout = this.onDragLeave.bind(this);
			container.onbxdestdragfinish = this.onDragDrop.bind(this);
			jsDD.registerDest(container, 4);
		}

		/**
		 * @param {Element} itemNode
		 * @param {number} x
		 * @param {number} y
		 */
		onDragEnter(itemNode, x, y) {
			var item = this.getGrid().getItemByElement(itemNode);
			if (item.isItemMoveDisabled()) {
				return;
			}
			this.setActive();
			this.getDropZoneArea().setActive();
		}
		empty() {
			if (this.captureTimeout) {
				clearTimeout(this.captureTimeout);
			}
			if (this.droppedItem === null) {
				return;
			}
			this.unsetActive();
			this.unsetCaptured();
			BX.onCustomEvent(this.getGrid(), 'Kanban.DropZone:onItemEmptied', [this.droppedItem, this]);
			this.droppedItem = null;
		}
	}
	class DropZoneEvent extends BX.Kanban.DropZoneEvent {
		groupIds = [];
		constructor(options) {
			super(options);
			this.groupIds = [];
		}
	}

	/**
	 * Multiple actions for CRM Kanban.
	 */
	const Actions = {
		/**
		 * Start calling list.
		 * @param {BX.CRM.Kanban.Grid} grid
		 * @param {Boolean} createActivity
		 * @returns {void}
		 */
		startCallList(grid, createActivity) {
			main_core.Runtime.loadExtension('crm.entity-list.panel').then(({
				createCallList
			}) => {
				if (main_core.Type.isUndefined(createActivity)) {
					createActivity = true;
				}
				const gridData = grid.getData();

				/** @see BX.Crm.EntityList.Panel.createCallList */
				return createCallList(gridData.entityTypeInt, grid.getCheckedId(), createActivity);
			}).then(({
				errorMessages
			}) => {
				if (main_core.Type.isArrayFilled(errorMessages)) {
					const error = errorMessages.join('. \n');
					BX.Kanban.Utils.showErrorDialog(error);
				}
			});
		},
		/**
		 * Some simple action.
		 * @param {BX.CRM.Kanban.Grid} grid
		 * @param {Object} params
		 * @param {boolean} disableNotify
		 * @returns {Promise}
		 */
		simpleAction(grid, params, disableNotify) {
			return new SimpleAction(grid, params).showNotify(!disableNotify).applyFilterAfterAction(!disableNotify).execute();
		},
		setAssigned(grid, assigned) {
			const params = {
				action: 'setAssigned',
				ids: grid.getCheckedId(),
				assignedId: assigned.entityId,
				assignedName: assigned.name
			};
			void this.simpleAction(grid, params, false);
		},
		/**
		 * Merge selected items.
		 * @param {BX.CRM.Kanban.Grid} grid
		 * @returns {void}
		 */
		merge(grid) {
			var selectedIds = grid.getCheckedId();
			var mergeManager = BX.Crm.BatchMergeManager.getItem(grid.getData().gridId);
			if (mergeManager && !mergeManager.isRunning() && selectedIds.length > 1) {
				mergeManager.setEntityIds(selectedIds);
				mergeManager.execute();
			}
		},
		/**
		 * Change category id for deals.
		 * @param {BX.CRM.Kanban.Grid} grid
		 * @param category
		 * @package {int} category
		 * @returns {void}
		 */
		changeCategory(grid, category) {
			var categoryLink = "";
			if (category.url) {
				categoryLink = category.url;
			}
			this.simpleAction(grid, {
				action: "changeCategory",
				id: grid.getCheckedId(),
				category: category.ID,
				categoryName: BX.util.htmlspecialchars(category.NAME),
				categoryLink: categoryLink
			}, false);
		},
		/**
		 * Change column.
		 * @param {BX.CRM.Kanban.Grid} grid
		 * @package {Object} column
		 * @returns {void}
		 */
		changeColumn(grid, column) {
			var gridData = grid.getData();
			grid.firstRenderComplete = false;
			this.simpleAction(grid, {
				action: "status",
				entity_id: grid.getCheckedId(),
				status: column.id,
				statusName: BX.util.htmlspecialchars(column.name),
				entity_type: gridData.entityType
			}, false);
		},
		/**
		 * @deprecated since crm 24.0.0. Use DeleteAction
		 *
		 * Delete one item.
		 * @param {BX.CRM.Kanban.Grid} grid
		 * @param {Number[] | Number | null} ids
		 * @param {BX.Crm.Kanban.DropZone} drop
		 */
		delete(grid, ids, drop) {
			// eslint-disable-next-line no-param-reassign
			ids = ids ?? grid.getCheckedId();
			const params = {
				ids,
				showNotify: false
			};
			new DeleteAction(grid, params).setDropZone(drop).execute();
		},
		/**
		 * Delete.
		 * @param {BX.CRM.Kanban.Grid} grid
		 * @returns {void}
		 */
		deleteAll(grid) {
			this.confirm(main_core.Loc.getMessage('CRM_KANBAN_PANEL_ACTION_CONFIRM'), () => {
				const params = {
					ids: grid.getCheckedId(),
					applyFilterAfterAction: true,
					showNotify: false
				};
				new DeleteAction(grid, params).execute();
			}, {
				grid
			});
		},
		/**
		 * Open / close.
		 * @param {BX.CRM.Kanban.Grid} grid
		 * @param {Boolean} open Open or close.
		 * @returns {void}
		 */
		open(grid, open) {
			if (typeof open === "undefined") {
				open = false;
			}
			this.simpleAction(grid, {
				action: "open",
				id: grid.getCheckedId(),
				flag: open ? "Y" : "N"
			}, false);
		},
		/**
		 * Ignore.
		 * @param {BX.CRM.Kanban.Grid} grid
		 * @param {Boolean} open Open or close.
		 * @returns {void}
		 */
		ignore(grid, open) {
			this.confirm(main_core.Loc.getMessage("CRM_KANBAN_PANEL_ACTION_CONFIRM"), () => {
				grid.fadeOut();
				BX.ajax.runComponentAction('bitrix:crm.kanban', 'excludeEntity', {
					mode: 'ajax',
					data: {
						entityType: grid.getData().entityType,
						ids: grid.getCheckedId()
					}
				}).then(response => {
					this.simpleAction(grid, {
						action: "delete",
						ignore: "Y",
						id: grid.getCheckedId()
					}, false);
				}, response => {
					grid.stopActionPanel();
					grid.onApplyFilter();
					BX.UI.Notification.Center.notify({
						content: response.errors[0].message
					});
				});
			}, {
				grid
			});
		},
		/**
		 * Refresh deals accounts.
		 * @param {BX.CRM.Kanban.Grid} grid
		 * @returns {void}
		 */
		refreshaccount(grid) {
			this.simpleAction(grid, {
				action: "refreshAccount",
				id: grid.getCheckedId()
			}, false);
		},
		/**
		 * Send email.
		 * @param {BX.CRM.Kanban.Grid} grid
		 * @returns {void}
		 */
		email(grid) {
			if (BX.CrmActivityEditor && BX.CrmActivityProvider && BX.CrmActivityEditor.items["kanban_activity_editor"]) {
				var gridData = grid.getData();
				var communications = [];
				var ids = grid.getCheckedId();
				for (var i = 0, c = ids.length; i < c; i++) {
					communications.push({
						type: "EMAIL",
						entityId: ids[i],
						entityType: gridData.entityType
					});
				}
				BX.CrmActivityEditor.items["kanban_activity_editor"].addEmail({
					communications: communications,
					communicationsLoaded: true
				});
			}
		},
		/**
		 * Add task.
		 * @param {BX.CRM.Kanban.Grid} grid
		 * @returns {void}
		 */
		task(grid) {
			const gridData = grid.getData();
			let communications = '';
			const ids = grid.getCheckedId();
			const entityType = gridData.entityType;
			for (let i = 0, c = ids.length; i < c; i++) {
				communications += BX.CrmOwnerTypeAbbr.resolve(entityType) + "_" + ids[i] + ";";
			}
			const taskData = {
				UF_CRM_TASK: communications,
				TITLE: "CRM: ",
				TAGS: "crm",
				ta_sec: 'crm',
				ta_sub: entityType.toLowerCase(),
				ta_el: 'context_menu'
			};
			let taskCreatePath = main_core.Loc.getMessage("CRM_TASK_CREATION_PATH");
			taskCreatePath = taskCreatePath.replace("#user_id#", main_core.Loc.getMessage("USER_ID"));
			taskCreatePath = BX.util.add_url_param(taskCreatePath, taskData);
			if (main_sidepanel.SidePanel) {
				main_sidepanel.SidePanel.Instance.open(taskCreatePath);
			} else {
				window.top.location.href = taskCreatePath;
			}
		},
		/**
		 * Confirm for some actions.
		 * @param {String} message
		 * @param {Function} acceptFunc
		 * @param {Object} params
		 * @return {BX.PopupWindowManager}
		 */
		confirm(message, acceptFunc, params = {}) {
			var dialog = main_popup.PopupManager.create("crm-kanban-confirm-dialog", null, {
				titleBar: main_core.Loc.getMessage("CRM_KANBAN_CONFIRM_TITLE"),
				content: "",
				width: 400,
				autoHide: false,
				overlay: true,
				closeByEsc: true,
				closeIcon: true,
				draggable: {
					restrict: true
				}
			});
			dialog.setContent(message);
			dialog.setButtons([, new main_popup.PopupWindowButton({
				text: main_core.Loc.getMessage("CRM_KANBAN_CONFIRM_Y"),
				className: "popup-window-button-accept",
				events: {
					click: function () {
						acceptFunc();
						this.popupWindow.close();
					}
				}
			}), new main_popup.PopupWindowButton({
				text: main_core.Loc.getMessage("CRM_KANBAN_CONFIRM_N"),
				className: "popup-window-button-cancel",
				events: {
					click: function () {
						if (params.grid instanceof BX.CRM.Kanban.Grid) {
							params.grid.resetMultiSelectMode();
						}
						this.popupWindow.close();
					}
				}
			})]);
			dialog.show();
			return dialog;
		}
	};

	class Stage {
		renderTo = null;
		items = null;
		layout = {
			container: null,
			items: null,
			more: null
		};
		constructor(options) {
			this.renderTo = options.renderTo;
			this.bindEvents();
		}
		bindEvents() {
			BX.addCustomEvent('kanban.grid:onitemdragstart', this.hideParentBlock.bind(this));
			BX.addCustomEvent('kanban.grid:onitemdragstop', this.unhideParentBlock.bind(this));
		}
		hideParentBlock() {
			this.renderTo.style.opacity = '0';
			this.renderTo.style.transition = '.2s';
			this.renderTo.style.pointerEvents = 'none';
		}
		unhideParentBlock() {
			this.renderTo.style.opacity = '';
			this.renderTo.style.transition = '';
			this.renderTo.style.pointerEvents = '';
		}
		render() {}
		getStageContainer() {
			if (this.layout.container) {
				return this.layout.container;
			}
			this.layout.container = BX.create('div', {
				props: {
					className: 'crm-kanban-stahe'
				}
			});
			return this.layout.container;
		}
	}

	const TYPE_VIEW = 'view';
	const TYPE_EDIT = 'edit';
	class FieldsSelector {
		constructor(options) {
			this.popup = null;
			this.fields = null;
			this.fieldsPopupItems = null;
			this.options = options;
			this.type = this.options.hasOwnProperty('type') ? this.options.type : TYPE_VIEW;
			this.selectedFields = this.options.hasOwnProperty('selectedFields') ? this.options.selectedFields.slice(0) : [];
			this.enableHeadersSections = Boolean(this.options.headersSections);
			this.headersSections = this.options.headersSections ?? {};
			this.defaultHeaderSectionId = this.options.defaultHeaderSectionId ?? null;
			this.fieldVisibleClass = 'crm-kanban-popup-field-search-list-item-visible';
			this.fieldHiddenClass = 'crm-kanban-popup-field-search-list-item-hidden';
		}
		show() {
			if (!this.popup) {
				this.popup = this.createPopup();
			}
			if (this.fields) {
				this.popup.setContent(this.getFieldsLayout());
			} else {
				this.loadPopupContent(this.popup);
			}
			this.popup.show();
		}
		createPopup() {
			return main_popup.PopupManager.create({
				id: 'kanban_custom_fields_' + this.type,
				className: 'crm-kanban-popup-field',
				titleBar: main_core.Loc.getMessage('CRM_KANBAN_CUSTOM_FIELDS_' + this.type.toUpperCase()),
				cacheable: false,
				closeIcon: true,
				lightShadow: true,
				overlay: true,
				draggable: true,
				closeByEsc: true,
				contentColor: 'white',
				maxHeight: window.innerHeight - 50,
				events: {
					onClose: () => {
						this.fieldsPopupItems = null;
						this.popup = null;
					}
				},
				buttons: [new ui_buttons.SaveButton({
					color: ui_buttons.Button.Color.PRIMARY,
					state: this.fields ? '' : ui_buttons.Button.State.DISABLED,
					onclick: () => {
						const selectedFields = this.fields ? this.fields.filter(field => this.selectedFields.indexOf(field.NAME) >= 0) : [];
						if (selectedFields.length) {
							this.popup.close();
							this.executeCallback(selectedFields);
						} else {
							ui_notification.UI.Notification.Center.notify({
								content: main_core.Loc.getMessage('CRM_KANBAN_POPUP_AT_LEAST_ONE_FIELD'),
								autoHide: true,
								autoHideDelay: 2000
							});
						}
					}
				}), new ui_buttons.CancelButton({
					onclick: () => {
						this.popup.close();
					}
				})]
			});
		}
		loadPopupContent(popup) {
			const loaderContainer = main_core.Tag.render`<div class="crm-kanban-popup-field-loader"></div>`;
			const loader = new main_loader.Loader({
				target: loaderContainer,
				size: 80
			});
			loader.show();
			popup.setContent(loaderContainer);
			BX.ajax.runComponentAction('bitrix:crm.kanban', 'getFields', {
				mode: 'ajax',
				data: {
					entityType: this.options.entityTypeName,
					viewType: this.type
				}
			}).then(response => {
				loader.destroy();
				this.fields = response.data;
				popup.setContent(this.getFieldsLayout());
				popup.getButtons().forEach(button => button.setDisabled(false));
				popup.adjustPosition();
			}).catch(response => {
				BX.Kanban.Utils.showErrorDialog(response.errors.pop().message);
			});
			return popup;
		}
		getFieldsLayout() {
			const sectionsWithFields = this.distributeFieldsBySections(this.fields);
			const container = main_core.Tag.render`<div class="crm-kanban-popup-field"></div>`;
			const headerWrapper = main_core.Tag.render`
			<div class="crm-kanban-popup-field-search-header-wrapper">
				<div class="ui-form-row-inline"></div>
			</div>
		`;
			container.prepend(headerWrapper);
			this.preparePopupContentHeaderSections(headerWrapper);
			this.preparePopupContentHeaderSearch(headerWrapper);
			this.getSections().map(section => {
				const sectionWrapperId = this.getSectionWrapperNameBySectionName(section.name);
				const sectionWrapper = main_core.Tag.render`
				<div 
					class="crm-kanban-popup-field-search-section" 
					data-crm-kanban-popup-field-search-section="${sectionWrapperId}">
				</div>
			`;
				main_core.Dom.append(sectionWrapper, container);
				const sectionName = section.name;
				if (sectionsWithFields.hasOwnProperty(sectionName) && sectionsWithFields[sectionName].length) {
					main_core.Dom.append(main_core.Tag.render`<div class="crm-kanban-popup-field-title">${main_core.Text.encode(section.title)}</div>`, sectionWrapper);
					main_core.Dom.append(main_core.Tag.render`<div class="crm-kanban-popup-field-wrapper">
						${sectionsWithFields[sectionName].map(field => {
					let label = field.LABEL;
					if (!label.length && section['elements'] && section['elements'][field.NAME] && section['elements'][field.NAME]['title'] && section['elements'][field.NAME]['title'].length) {
						label = section['elements'][field.NAME]['title'];
					}
					const encodedLabel = main_core.Text.encode(label);
					return main_core.Tag.render`
								<div class="crm-kanban-popup-field-item" title="${encodedLabel}">
									<input 
										id="cf_${main_core.Text.encode(field.ID)}" 
										type="checkbox" 
										name="${main_core.Text.encode(field.NAME)}"
										class="crm-kanban-popup-field-item-input"
										data-label="${encodedLabel}"
										${this.selectedFields.indexOf(field.NAME) >= 0 ? 'checked' : ''}
										onclick="${this.onFieldClick.bind(this)}"
									/>
									<label for="cf_${main_core.Text.encode(field.ID)}" class="crm-kanban-popup-field-item-label">
										${encodedLabel}
									</label>
								</div>`;
				})}
					</div>`, sectionWrapper);
				}
			});
			return container;
		}
		preparePopupContentHeaderSections(headerWrapper) {
			if (!this.enableHeadersSections) {
				return;
			}
			const headerSectionsWrapper = main_core.Tag.render`
			<div class="ui-form-row">
				<div class="ui-form-content crm-kanban-popup-field-search-section-wrapper"></div>
			</div>
		`;
			headerWrapper.firstElementChild.appendChild(headerSectionsWrapper);
			const headersSections = this.getHeadersSections();
			for (let key in headersSections) {
				const itemClass = 'crm-kanban-popup-field-search-section-item-icon' + (headersSections[key].selected ? ` crm-kanban-popup-field-search-section-item-icon-active` : '');
				const headerSectionItem = main_core.Tag.render`
				<div class="crm-kanban-popup-field-search-section-item" data-kanban-popup-filter-section-button="${key}">
					<div class="${itemClass}">
						${main_core.Text.encode(headersSections[key].name)}
					</div>
				</div>
			`;
				headerSectionsWrapper.firstElementChild.appendChild(headerSectionItem);
				if (this.type !== TYPE_VIEW) {
					break;
				}
				main_core.Event.bind(headerSectionItem, 'click', this.onFilterSectionClick.bind(this, headerSectionItem));
			}
		}
		onFilterSectionClick(item) {
			const activeClass = 'crm-kanban-popup-field-search-section-item-icon-active';
			const sectionId = item.dataset.kanbanPopupFilterSectionButton;
			const sections = document.querySelectorAll(`[data-crm-kanban-popup-field-search-section="${sectionId}"]`);
			if (main_core.Dom.hasClass(item.firstElementChild, activeClass)) {
				main_core.Dom.removeClass(item.firstElementChild, activeClass);
				this.filterSectionsToggle(sections, 'hide');
			} else {
				main_core.Dom.addClass(item.firstElementChild, activeClass);
				this.filterSectionsToggle(sections, 'show');
			}
		}
		filterSectionsToggle(sections, action) {
			Array.from(sections).map(section => {
				action === 'show' ? main_core.Dom.show(section) : main_core.Dom.hide(section);
			});
		}
		preparePopupContentHeaderSearch(headerWrapper) {
			const searchForm = main_core.Tag.render`
			<div class="ui-form-row">
				<div class="ui-form-content crm-kanban-popup-field-search-input-wrapper">
					<div class="ui-ctl ui-ctl-textbox ui-ctl-before-icon ui-ctl-after-icon">
						<div class="ui-ctl-before ui-ctl-icon-search"></div>
						<button class="ui-ctl-after ui-ctl-icon-clear"></button>
						<input type="text" class="ui-ctl-element crm-kanban-popup-field-search-section-input">
					</div>
				</div>
			</div>
		`;
			headerWrapper.firstElementChild.appendChild(searchForm);
			const inputs = searchForm.getElementsByClassName('crm-kanban-popup-field-search-section-input');
			if (inputs.length) {
				const input = inputs[0];
				main_core.Event.bind(input, 'input', this.onFilterSectionSearchInput.bind(this, input));
				main_core.Event.bind(input.previousElementSibling, 'click', this.onFilterSectionSearchInputClear.bind(this, input));
			}
		}
		onFilterSectionSearchInput(input) {
			let search = input.value;
			if (search.length) {
				search = search.toLowerCase();
			}
			this.getFieldsPopupItems().map(item => {
				const title = item.innerText.toLowerCase();
				if (search.length && title.indexOf(search) === -1) {
					main_core.Dom.removeClass(item, this.fieldVisibleClass);
					main_core.Dom.addClass(item, this.fieldHiddenClass);
				} else {
					main_core.Dom.removeClass(item, this.fieldHiddenClass);
					main_core.Dom.addClass(item, this.fieldVisibleClass);
					item.style.display = 'block';
				}
			});
		}
		getFieldsPopupItems() {
			if (!main_core.Type.isArray(this.fieldsPopupItems)) {
				this.fieldsPopupItems = Array.from(this.popup.getPopupContainer().querySelectorAll('.crm-kanban-popup-field-item'));
				this.prepareAnimation();
			}
			return this.fieldsPopupItems;
		}
		prepareAnimation() {
			this.fieldsPopupItems.map(item => {
				main_core.Event.bind(item, 'animationend', this.onAnimationEnd.bind(this, item));
			});
		}
		onAnimationEnd(item) {
			item.style.display = main_core.Dom.hasClass(item, this.fieldHiddenClass) ? 'none' : 'block';
		}
		onFilterSectionSearchInputClear(input) {
			if (input.value.length) {
				input.value = '';
				this.onFilterSectionSearchInput(input);
			}
		}
		getSectionWrapperNameBySectionName(name) {
			const headerSections = this.getHeadersSections();
			for (let id in headerSections) {
				if (this.headersSections[id].sections && this.headersSections[id].sections.includes(name)) {
					return this.headersSections[id].id;
				}
			}
			return this.headersSections[this.defaultHeaderSectionId] && this.defaultHeaderSectionId ? this.headersSections[this.defaultHeaderSectionId].id : null;
		}
		getHeadersSections() {
			return this.headersSections ?? {};
		}
		distributeFieldsBySections(fields) {
			// remove ignored fields from result:
			const ignoredFields = this.getIgnoredFields();
			fields = fields.filter(item => !(ignoredFields.hasOwnProperty(item.NAME) && ignoredFields[item.NAME]));
			let fieldsBySections = {};
			let defaultSectionName = '';
			const sections = this.options.hasOwnProperty('sections') ? this.options.sections : [];
			for (let i = 0; i < sections.length; i++) {
				const section = sections[i];
				const sectionName = section.name;
				fieldsBySections[sectionName] = [];
				if (main_core.Type.isPlainObject(section.elements)) {
					fieldsBySections[sectionName] = this.filterFieldsByList(fields, section.elements);
				} else if (section.hasOwnProperty('elementsRule')) {
					fieldsBySections[sectionName] = this.filterFieldsByRule(fields, new RegExp(section.elementsRule));
				} else if (section.elements === '*') {
					defaultSectionName = sectionName;
				}
			}
			if (defaultSectionName !== '') {
				fieldsBySections[defaultSectionName] = this.filterNotUsedFields(fields, fieldsBySections);
			}
			return fieldsBySections;
		}
		filterFieldsByList(fields, whiteList) {
			return fields.filter(item => whiteList.hasOwnProperty(item.NAME));
		}
		filterFieldsByRule(fields, rule) {
			return fields.filter(item => item.NAME.match(rule));
		}
		filterNotUsedFields(fields, alreadyUsedFieldsBySection) {
			let alreadyUsedFieldsNames = Object.values(alreadyUsedFieldsBySection).reduce((prevFields, sectionFields) => {
				return prevFields.concat(sectionFields.map(item => item.NAME));
			}, []);
			return fields.filter(item => alreadyUsedFieldsNames.indexOf(item.NAME) < 0);
		}
		getSections() {
			return this.options.hasOwnProperty('sections') ? this.options.sections : [];
		}
		getIgnoredFields() {
			let fields = Object.assign({}, this.options.ignoredFields);
			let extraFields = [];
			if (this.type === TYPE_EDIT) {
				extraFields = ['ID', 'CLOSED', 'DATE_CREATE', 'DATE_MODIFY', 'COMMENTS', 'OPPORTUNITY'];
			} else {
				extraFields = ['PHONE', 'EMAIL', 'WEB', 'IM'];
			}
			extraFields.forEach(fieldName => fields[fieldName] = true);
			return fields;
		}
		executeCallback(selectedFields) {
			if (!this.options.hasOwnProperty('onSelect') || !main_core.Type.isFunction(this.options.onSelect)) {
				return;
			}
			let callbackPayload = {};
			selectedFields.forEach(field => {
				callbackPayload[field.NAME] = field.LABEL ? field.LABEL : '';
			});
			this.options.onSelect(callbackPayload);
		}
		onFieldClick(event) {
			const fieldName = event.target.name;
			if (event.target.checked && this.selectedFields.indexOf(fieldName) < 0) {
				this.selectedFields.push(fieldName);
			}
			if (!event.target.checked && this.selectedFields.indexOf(fieldName) >= 0) {
				this.selectedFields.splice(this.selectedFields.indexOf(fieldName), 1);
			}
		}
	}

	class PullOperation {
		static createInstance(data) {
			return new PullOperation(data.grid).setItemId(data.itemId).setAction(data.action).setActionParams(data.actionParams);
		}
		constructor(grid) {
			this.grid = grid;
		}
		setItemId(itemId) {
			this.itemId = itemId;
			return this;
		}
		getItemId() {
			return this.itemId;
		}
		setAction(action) {
			this.action = action;
			return this;
		}
		getAction() {
			return this.action;
		}
		setActionParams(actionParams) {
			this.actionParams = actionParams;
			return this;
		}
		getActionParams() {
			return this.actionParams;
		}
		execute() {
			const action = this.getAction();
			if (action === 'updateItem') {
				this.updateItem();
				return;
			}
			if (action === 'addItem') {
				this.addItem();
			}
		}
		updateItem() {
			const params = this.getActionParams();
			const item = this.grid.getItem(params.item.id);
			const paramsItem = params.item;
			if (!item) {
				return;
			}
			const {
				viewMode
			} = this.grid.getData();
			if ([ViewMode.MODE_ACTIVITIES, ViewMode.MODE_DEADLINES].includes(viewMode)) {
				item.useAnimation = false;
				this.grid.insertItem(item);
				return;
			}
			const insertItemParams = {};
			const {
				lastActivity,
				columnId: newColumnId,
				price
			} = paramsItem.data;
			if (main_core.Type.isObjectLike(lastActivity) && lastActivity.timestamp !== item.data.lastActivity.timestamp) {
				insertItemParams.canShowLastActivitySortTour = true;
			}
			const oldPrice = parseFloat(item.data.price);
			const oldColumnId = item.columnId;
			for (const key in paramsItem.data) {
				if (key in item.data) {
					item.data[key] = paramsItem.data[key];
				}
			}
			item.rawData = paramsItem.rawData;
			item.setActivityExistInnerHtml();
			item.useAnimation = true;
			item.setChangedInPullRequest();
			if (oldColumnId !== newColumnId) {
				item.setColumnChangedInPullRequest();
			}
			this.grid.resetMultiSelectMode();
			const newColumn = this.grid.getColumn(newColumnId);
			const newPrice = parseFloat(price);
			insertItemParams.newColumnId = newColumnId;
			this.grid.insertItem(item, insertItemParams);
			item.columnId = newColumnId;
			if (!this.grid.getTypeInfoParam('showTotalPrice')) {
				return;
			}
			if (oldColumnId === newColumnId) {
				if (oldPrice < newPrice) {
					newColumn.incPrice(newPrice - oldPrice);
					newColumn.renderSubTitle();
				} else if (oldPrice > newPrice) {
					newColumn.decPrice(oldPrice - newPrice);
					newColumn.renderSubTitle();
				}
				return;
			}
			const groupIds = this.grid.itemMoving?.dropEvent?.groupIds ?? [];
			if (!groupIds.includes(item.id)) {
				const oldColumn = this.grid.getColumn(oldColumnId);
				oldColumn.decPrice(oldPrice);
				oldColumn.renderSubTitle();
			}
			if (newColumn) {
				newColumn.incPrice(newPrice);
				newColumn.renderSubTitle();
			}
		}
		addItem() {
			const params = this.getActionParams();
			const oldItem = this.grid.getItem(params.item.id);
			if (oldItem) {
				return;
			}
			const column = this.grid.getColumn(params.item.data.columnId);
			if (!column) {
				return;
			}
			const sorter = crm_kanban_sort.Sorter.createWithCurrentSortType(column.getItems());
			const beforeItem = sorter.calcBeforeItemByParams(params.item.data.sort);
			if (beforeItem) {
				params.item.targetId = beforeItem.getId();
			}
			this.grid.addItem(params.item);
		}
	}

	const EventName = {
		itemUpdated: 'ITEMUPDATED',
		itemAdded: 'ITEMADDED',
		itemDeleted: 'ITEMDELETED',
		stageAdded: 'STAGEADDED',
		stageUpdated: 'STAGEUPDATED',
		stageDeleted: 'STAGEDELETED'
	};
	class PullManager {
		constructor(grid) {
			if (!BX.PULL) {
				console.info('BX.PULL is not initialized');
				return;
			}
			this.grid = grid;
			const data = grid.getData();
			const options = {
				moduleId: data.moduleId,
				pullTag: data.pullTag,
				additionalPullTags: data.additionalPullTags ?? [],
				userId: data.userId,
				additionalData: {
					viewMode: data.viewMode
				},
				events: {
					onBeforePull: event => {
						this.#onBeforePull(event);
					},
					onPull: event => {
						this.#onPull(event);
					}
				},
				callbacks: {
					onBeforeQueueExecute: items => {
						return this.#onBeforeQueueExecute(items);
					},
					onQueueExecute: items => {
						return this.#onQueueExecute(items);
					},
					onReload: () => {
						this.#onReload();
					}
				}
			};
			this.queueManager = new pull_queuemanager.QueueManager(options);
		}
		#onBeforeQueueExecute(items) {
			items.forEach(item => {
				const {
					data
				} = item;
				const operation = PullOperation.createInstance({
					grid: this.grid,
					itemId: data.id,
					action: data.action,
					actionParams: data.actionParams
				});
				operation.execute(); // change to async and use Promise.all in return
			});
			return Promise.resolve();
		}
		#onQueueExecute(items) {
			const ids = [];
			items.forEach(({
				id,
				data: {
					action
				}
			}) => {
				if (action === 'addItem' || action === 'updateItem') {
					ids.push(parseInt(id, 10));
				}
			});
			if (ids.length === 0) {
				return Promise.resolve();
			}
			return this.grid.loadNew(ids, false, true, true, true);
		}
		#onReload() {
			this.grid.reload();
		}
		#onBeforePull(event) {
			const {
				data: {
					options,
					pullData
				}
			} = event;
			if (!pullData.command.startsWith(options.pullTag) && options.additionalData.viewMode !== ViewMode.MODE_ACTIVITIES) {
				event.preventDefault();
			}
		}
		#onPull(event) {
			const {
				pullData: {
					params
				}
			} = event.data;
			if (params.eventName === EventName.itemUpdated) {
				this.#onPullItemUpdated(event);
				return;
			}
			if (params.eventName === EventName.itemAdded) {
				this.#onPullItemAdded(event);
				return;
			}
			if (params.eventName === EventName.itemDeleted) {
				this.#onPullItemDeleted(event);
				return;
			}
			if (params.eventName === EventName.stageAdded) {
				this.#onPullStageChanged(event);
				return;
			}
			if (params.eventName === EventName.stageUpdated) {
				this.#onPullStageChanged(event);
				return;
			}
			if (params.eventName === EventName.stageDeleted) {
				this.#onPullStageDeleted(event);
			}
		}
		#onPullItemUpdated(event) {
			const {
				pullData: {
					params
				},
				promises
			} = event.data;
			const item = this.grid.getItem(params.item.id);
			if (item) {
				promises.push(Promise.resolve({
					data: this.#getPullData('updateItem', params)
				}));
				return;
			}

			// eslint-disable-next-line no-param-reassign
			params.eventName = EventName.itemAdded;
			this.#onPullItemAdded(event);
		}
		#onPullItemAdded(event) {
			const {
				pullData: {
					params
				},
				promises
			} = event.data;
			const itemId = params.item.id;
			const oldItem = this.grid.getItem(itemId);
			if (oldItem) {
				event.preventDefault();
				return;
			}
			promises.push(Promise.resolve({
				data: this.#getPullData('addItem', params)
			}));
		}
		#getPullData(action, actionParams) {
			const {
				id
			} = actionParams.item;
			return {
				id,
				action,
				actionParams
			};
		}
		#onPullItemDeleted(event) {
			const {
				pullData: {
					params
				}
			} = event.data;
			if (!main_core.Type.isPlainObject(params.item)) {
				return;
			}
			const {
				id,
				data: {
					columnId
				}
			} = params.item;

			/**
			 * Delay so that the element has time to be rendered before deletion,
			 * if an event for changing the element came before. Ticket #141983
			 */
			const delay = this.queueManager.hasInQueue(id) ? this.queueManager.getLoadItemsDelay() : 0;
			setTimeout(() => {
				this.queueManager.deleteFromQueue(id);
				const {
					grid
				} = this;
				const item = grid.getItem(id);
				if (!item) {
					return;
				}
				grid.removeItem(id);
				if (grid.getTypeInfoParam('showTotalPrice')) {
					const column = grid.getColumn(columnId);
					column.decPrice(item.data.price);
					column.renderSubTitle();
				}
			}, delay);
			event.preventDefault();
		}
		#onPullStageChanged(event) {
			event.preventDefault();
			this.grid.onApplyFilter();
		}
		#onPullStageDeleted(event) {
			event.preventDefault();
			const {
				pullData: {
					params
				}
			} = event.data;
			this.grid.removeColumn(params.stage.id);
		}
	}

	exports.Actions = Actions;
	exports.Column = Column;
	exports.DeleteAction = DeleteAction;
	exports.DraftColumn = DraftColumn;
	exports.DropZone = DropZone;
	exports.DropZoneEvent = DropZoneEvent;
	exports.FieldsSelector = FieldsSelector;
	exports.Grid = Grid;
	exports.Item = Item;
	exports.PullManager = PullManager;
	exports.RestartAutomationAction = RestartAutomationAction;
	exports.SimpleAction = SimpleAction;
	exports.Stage = Stage;
	exports.StageLabels = StageLabels;
	exports.ViewMode = ViewMode;

})(this.BX.CRM.Kanban = this.BX.CRM.Kanban || {}, BX.CRM.Kanban, BX.Crm, BX, BX, BX.Main, BX, BX, BX, BX.UI.EntitySelector, BX.UI.Tour, BX.UI.Notification, BX.Crm.Integration.Analytics, BX.Pull, BX.Crm.Autorun, BX.UI.Analytics, BX.Main, BX.Crm.Activity, BX.Crm, BX, BX.SidePanel, BX.UI.System.Label, BX.UI, BX, BX.Currency, BX.UI, BX.CRM.Kanban);
//# sourceMappingURL=kanban.js.map
