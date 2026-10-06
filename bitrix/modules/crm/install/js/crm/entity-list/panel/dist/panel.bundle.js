/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.EntityList = this.BX.Crm.EntityList || {};
(function (exports, crm_autorun, main_core, ui_notification, ui_dialogs_messagebox, crm_activity_planner, main_core_events, main_core_collections, crm_merger_batchmergemanager, ui_entitySelector) {
	'use strict';

	const NOTIFICATION_AUTO_HIDE_DELAY = 5000;
	function showAnotherProcessRunningNotification() {
		ui_notification.UI.Notification.Center.notify({
			content: main_core.Loc.getMessage('CRM_ENTITY_LIST_PANEL_ANOTHER_PROCESS_IN_PROGRESS'),
			autoHide: true,
			autoHideDelay: NOTIFICATION_AUTO_HIDE_DELAY
		});
	}

	/**
	 * @abstract
	 */
	class BaseHandler {
		/**
		 * @abstract
		 */
		static getEventName() {
			throw new Error('not implemented');
		}
		injectDependencies(progressBarRepo, extensionSettings) {}

		/**
		 * @abstract
		 */
		execute(grid, selectedIds, forAll) {
			throw new Error('not implemented');
		}
		executeForKanban(grid, selectedIds) {
			throw new Error('not implemented');
		}
	}

	class ExecuteRestartAutomation extends BaseHandler {
		#entityTypeId;
		#progressBarRepo;
		constructor({
			entityTypeId
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
		}
		static getEventName() {
			return 'BatchManager:restartAutomation';
		}
		injectDependencies(progressBarRepo, extensionSettings) {
			this.#progressBarRepo = progressBarRepo;
		}
		execute(grid, selectedIds, forAll) {
			const restartAutomationManager = this.#getRestartAutomationManager(grid.getId());
			if (restartAutomationManager === null) {
				return;
			}
			if (forAll) {
				restartAutomationManager.resetEntityIds();
			} else {
				restartAutomationManager.setEntityIds(selectedIds);
			}
			restartAutomationManager.execute();
		}
		executeForKanban(grid, selectedIds) {
			const restartAutomationManager = this.#getRestartAutomationManager(grid.getData().gridId);
			if (restartAutomationManager === null) {
				return;
			}
			restartAutomationManager.setEntityIds(selectedIds);
			restartAutomationManager.execute();
		}
		#getRestartAutomationManager(gridId) {
			let restartAutomationManager = crm_autorun.BatchRestartAutomationManager.getItem(gridId);
			if (restartAutomationManager?.isRunning()) {
				return null;
			}
			if (crm_autorun.ProcessRegistry.isProcessRunning(gridId)) {
				showAnotherProcessRunningNotification();
				return null;
			}
			if (!restartAutomationManager) {
				restartAutomationManager = crm_autorun.BatchRestartAutomationManager.create(gridId, {
					gridId,
					entityTypeId: this.#entityTypeId,
					container: this.#progressBarRepo.getOrCreateProgressBarContainer('restartAutomation').id
				});
			}
			return restartAutomationManager;
		}
	}

	/**
	 * @memberof BX.Crm.EntityList.Panel
	 */
	function createCallListAndShowAlertOnErrors(entityTypeId, selectedIds, createActivity, gridId = null, forAll = false) {
		void createCallList(entityTypeId, selectedIds, createActivity, gridId, forAll).then(({
			errorMessages
		}) => {
			if (main_core.Type.isArrayFilled(errorMessages)) {
				const error = errorMessages.join('. \n');
				ui_dialogs_messagebox.MessageBox.alert(main_core.Text.encode(error));
			}
		});
	}

	/**
	 * @memberof BX.Crm.EntityList.Panel
	 */
	function createCallList(entityTypeId, selectedIds, createActivity, gridId = null, forAll = false) {
		return new Promise(resolve => {
			BX.CrmCallListHelper.createCallList({
				entityType: BX.CrmEntityType.resolveName(entityTypeId),
				entityIds: forAll ? [] : selectedIds,
				gridId: main_core.Type.isNil(gridId) ? undefined : gridId,
				createActivity
			}, response => {
				if (!main_core.Type.isPlainObject(response)) {
					resolve({});
					return;
				}
				if (!response.SUCCESS && response.ERRORS) {
					resolve({
						errorMessages: response.ERRORS
					});
					return;
				}
				if (!response.SUCCESS || !response.DATA) {
					resolve({});
					return;
				}
				const data = response.DATA;
				if (data.RESTRICTION) {
					showRestriction(data.RESTRICTION);
					resolve({});
					return;
				}
				const callListId = data.ID;
				if (createActivity && top.BXIM) {
					top.BXIM.startCallList(callListId, {});
				} else {
					new BX.Crm.Activity.Planner().showEdit({
						PROVIDER_ID: 'CALL_LIST',
						PROVIDER_TYPE_ID: 'CALL_LIST',
						ASSOCIATED_ENTITY_ID: callListId
					});
				}
				resolve({});
			});
		});
	}
	function showRestriction(restriction) {
		if (main_core.Type.isPlainObject(restriction) && main_core.Reflection.getClass('B24.licenseInfoPopup')) {
			// eslint-disable-next-line no-undef
			B24.licenseInfoPopup.show('ivr-limit-popup', restriction.HEADER, restriction.CONTENT);
		} else if (main_core.Type.isStringFilled(restriction)) {
			// eslint-disable-next-line no-eval
			eval(restriction);
		}
	}
	function addItemsToCallList(entityTypeId, selectedIds, callListId, context, gridId, forAll) {
		BX.CrmCallListHelper.addToCallList({
			callListId,
			context,
			entityType: BX.CrmEntityType.resolveName(entityTypeId),
			entityIds: forAll ? [] : selectedIds,
			gridId
		});
	}

	class LoadEnumsAndEditSelected extends BaseHandler {
		#entityTypeId;
		#categoryId = null;
		static #loadedFieldsCache = new Map();
		constructor({
			entityTypeId,
			categoryId
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
			if (!main_core.Type.isNil(categoryId)) {
				this.#categoryId = main_core.Text.toInteger(categoryId);
			}
		}
		static getEventName() {
			return 'loadEnumsAndEditSelected';
		}
		execute(grid, selectedIds, forAll) {
			void LoadEnumsAndEditSelected.loadEnums(grid, this.#entityTypeId, this.#categoryId).finally(() => grid.editSelected());
		}
		static loadEnums(grid, entityTypeId, categoryId) {
			const fieldNames = this.#getEmptyItemsFieldNames(grid);
			if (fieldNames.length === 0) {
				return Promise.resolve();
			}
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('crm.controller.list.userField.getData', {
					data: {
						entityTypeId,
						fieldNames,
						categoryId
					}
				}).then(({
					data: {
						fields
					}
				}) => {
					const alreadyLoaded = this.#getAlreadyLoadedFieldNames(grid.getId());
					for (const cell of this.#getCells(grid)) {
						const {
							name
						} = cell.dataset;
						if (!fields[name]) {
							continue;
						}
						cell.dataset.edit = `(${fields[name]})`;
						alreadyLoaded.add(name);
					}
					resolve();
				}).catch(response => {
					console.error('Could not load UF enum values for edit', {
						response,
						grid,
						entityTypeId,
						categoryId,
						fieldNames
					});
					reject();
				});
			});
		}
		static #getEmptyItemsFieldNames(grid) {
			const columnsAll = grid.getParam('COLUMNS_ALL');
			const alreadyLoaded = this.#getAlreadyLoadedFieldNames(grid.getId());
			const fields = [];
			for (const cell of this.#getCells(grid)) {
				const name = cell.dataset.name ?? null;
				const columnData = columnsAll[name];
				const isListColumnWithEmptyData = main_core.Type.isObjectLike(columnData?.editable) && !columnData.editable.DATA && columnData.type === 'list';
				if (isListColumnWithEmptyData && !alreadyLoaded.has(name)) {
					fields.push(name);
				}
			}
			return fields;
		}
		static #getAlreadyLoadedFieldNames(gridId) {
			if (!this.#loadedFieldsCache.has(gridId)) {
				this.#loadedFieldsCache.set(gridId, new Set());
			}
			return this.#loadedFieldsCache.get(gridId);
		}
		static #getCells(grid) {
			const {
				cells
			} = grid.getRows().getHeadFirstChild().getNode();
			return [...cells];
		}

		/**
		 * @internal
		 */
		static onAfterGridUpdate(grid) {
			this.#loadedFieldsCache.delete(grid.getId());
		}
	}
	main_core_events.EventEmitter.subscribe('Grid::updated', event => {
		const [grid] = event.getData();
		LoadEnumsAndEditSelected.onAfterGridUpdate(grid);
	});

	class Router {
		static #handlers = new Set([]);
		#grid;
		#progressBarRepo;
		#extensionSettings;
		#subscriptions = new Map();
		constructor(grid, progressBarRepo, extensionSettings) {
			if (!(grid instanceof BX.Main.grid)) {
				throw new TypeError('expected grid to be instance of BX.Main.grid');
			}
			this.#grid = grid;
			if (!(progressBarRepo instanceof crm_autorun.ProgressBarRepository)) {
				throw new TypeError('expected progressBarRepo to be instance of ProgressBarRepository');
			}
			this.#progressBarRepo = progressBarRepo;
			if (!(extensionSettings instanceof main_core_collections.SettingsCollection)) {
				throw new TypeError('expected extensionSettings to be instance of SettingsCollection');
			}
			this.#extensionSettings = extensionSettings;
		}
		static registerHandler(handler) {
			this.#handlers.add(handler);
		}
		startListening() {
			for (const HandlerClass of this.constructor.#handlers) {
				const eventName = `BX.Crm.EntityList.Panel:${HandlerClass.getEventName()}`;
				const subscriptionHandler = this.#createSubscriptionHandler(HandlerClass);
				this.#subscriptions.set(eventName, subscriptionHandler);
				main_core_events.EventEmitter.subscribe(eventName, subscriptionHandler);
			}
		}
		#createSubscriptionHandler(HandlerClass) {
			return event => {
				const eventHandler = new HandlerClass(event.getData());
				eventHandler.injectDependencies(this.#progressBarRepo, this.#extensionSettings);
				eventHandler.execute(this.#grid, this.#grid.getRows().getSelectedIds(), this.#grid.getActionsPanel()?.getForAllCheckbox()?.checked ?? false);
			};
		}
		stopListening() {
			for (const [eventName, subscriptionHandler] of this.#subscriptions.entries()) {
				main_core_events.EventEmitter.unsubscribe(eventName, subscriptionHandler);
			}
		}
	}

	class ExecuteAssigment extends BaseHandler {
		#entityTypeId;
		#valueElement;
		#progressBarRepo;
		constructor({
			entityTypeId,
			valueElementId
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
			this.#valueElement = document.getElementById(valueElementId);
			if (!main_core.Type.isElementNode(this.#valueElement)) {
				throw new Error('value element not found');
			}
		}
		static getEventName() {
			return 'BatchManager:executeAssigment';
		}
		injectDependencies(progressBarRepo, extensionSettings) {
			this.#progressBarRepo = progressBarRepo;
		}
		execute(grid, selectedIds, forAll) {
			let assignManager = crm_autorun.BatchAssignmentManager.getItem(grid.getId());
			if (!assignManager) {
				assignManager = crm_autorun.BatchAssignmentManager.create(grid.getId(), {
					gridId: grid.getId(),
					entityTypeId: this.#entityTypeId,
					container: this.#progressBarRepo.getOrCreateProgressBarContainer('assign').id
				});
			}
			if (assignManager.isRunning()) {
				return;
			}
			if (crm_autorun.ProcessRegistry.isProcessRunning(grid.getId())) {
				showAnotherProcessRunningNotification();
				return;
			}
			const userId = main_core.Text.toInteger(this.#valueElement.dataset.value);
			if (userId <= 0) {
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('CRM_ENTITY_LIST_PANEL_SELECT_ASSIGNED_BY_ID'),
					autoHide: true,
					autoHideDelay: NOTIFICATION_AUTO_HIDE_DELAY
				});
				return;
			}
			assignManager.setAssignedById(userId);
			if (forAll) {
				assignManager.resetEntityIds();
			} else {
				assignManager.setEntityIds(selectedIds);
			}
			assignManager.execute();
		}
	}

	class ExecuteConversion extends BaseHandler {
		#valueElement;
		constructor({
			valueElementId
		}) {
			super();
			this.#valueElement = document.getElementById(valueElementId);
			if (!main_core.Type.isElementNode(this.#valueElement)) {
				throw new Error('value element not found');
			}
		}
		static getEventName() {
			return 'BatchManager:executeConversion';
		}
		execute(grid, selectedIds, forAll) {
			const manager = crm_autorun.BatchConversionManager.getItem(grid.getId());
			if (!manager) {
				console.error(`BatchConversionManager with id ${grid.getId()} not found`);
				return;
			}
			if (manager.isRunning()) {
				return;
			}
			if (crm_autorun.ProcessRegistry.isProcessRunning(grid.getId())) {
				showAnotherProcessRunningNotification();
				return;
			}
			const schemeName = this.#valueElement.dataset.value || BX.CrmLeadConversionScheme.dealcontactcompany;
			manager.setConfig(BX.CrmLeadConversionScheme.createConfig(schemeName));
			if (forAll) {
				manager.resetEntityIds();
			} else {
				manager.setEntityIds(selectedIds);
			}
			manager.execute();
		}
	}

	class ExecuteDeletion extends BaseHandler {
		#entityTypeId;
		#progressBarRepo;
		constructor({
			entityTypeId
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
		}
		static getEventName() {
			return 'BatchManager:executeDeletion';
		}
		injectDependencies(progressBarRepo, extensionSettings) {
			this.#progressBarRepo = progressBarRepo;
		}
		execute(grid, selectedIds, forAll) {
			let deletionManager = crm_autorun.BatchDeletionManager.getItem(grid.getId());
			if (deletionManager && deletionManager.isRunning()) {
				return;
			}
			if (crm_autorun.ProcessRegistry.isProcessRunning(grid.getId())) {
				showAnotherProcessRunningNotification();
				return;
			}
			if (!deletionManager) {
				deletionManager = crm_autorun.BatchDeletionManager.create(grid.getId(), {
					gridId: grid.getId(),
					entityTypeId: this.#entityTypeId,
					container: this.#progressBarRepo.getOrCreateProgressBarContainer('delete').id
				});
			}
			if (forAll) {
				deletionManager.resetEntityIds();
			} else {
				deletionManager.setEntityIds(selectedIds);
			}
			deletionManager.execute();
			main_core_events.EventEmitter.subscribeOnce('BX.Crm.BatchDeletionManager:onProcessComplete', this.#notifyOnComplete.bind(this));
		}
		#notifyOnComplete() {
			ui_notification.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('CRM_ENTITY_LIST_PANEL_DELETION_ANALYTICS_WARNING'),
				actions: [{
					title: main_core.Loc.getMessage('CRM_ENTITY_LIST_PANEL_SHOW_DETAILS'),
					events: {
						click: (event, balloon) => {
							balloon.close();
							if (window.top.BX.Helper) {
								window.top.BX.Helper.show('redirect=detail&code=8969825');
							}
						}
					}
				}],
				autoHideDelay: NOTIFICATION_AUTO_HIDE_DELAY
			});
		}
	}

	class ExecuteExclusion extends BaseHandler {
		#entityTypeId;
		#progressBarRepo;
		constructor({
			entityTypeId
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
		}
		static getEventName() {
			return 'BatchManager:executeExclusion';
		}
		injectDependencies(progressBarRepo, extensionSettings) {
			this.#progressBarRepo = progressBarRepo;
		}
		execute(grid, selectedIds, forAll) {
			let exclusionManager = crm_autorun.BatchExclusionManager.getItem(grid.getId());
			if (exclusionManager && exclusionManager.isRunning()) {
				return;
			}
			if (crm_autorun.ProcessRegistry.isProcessRunning(grid.getId())) {
				showAnotherProcessRunningNotification();
				return;
			}
			if (!exclusionManager) {
				exclusionManager = crm_autorun.BatchExclusionManager.create(grid.getId(), {
					gridId: grid.getId(),
					entityTypeId: this.#entityTypeId,
					container: this.#progressBarRepo.getOrCreateProgressBarContainer('exclude').id
				});
			}
			if (forAll) {
				exclusionManager.resetEntityIds();
			} else {
				exclusionManager.setEntityIds(selectedIds);
			}
			exclusionManager.execute();
		}
	}

	class ExecuteMerge extends BaseHandler {
		#entityTypeId;
		#mergerUrl;
		constructor({
			entityTypeId,
			mergerUrl
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			this.#mergerUrl = main_core.Type.isStringFilled(mergerUrl) ? mergerUrl : null;
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
		}
		static getEventName() {
			return 'BatchManager:executeMerge';
		}
		execute(grid, selectedIds, forAll) {
			let mergeManager = crm_merger_batchmergemanager.BatchMergeManager.getItem(grid.getId());
			if (!mergeManager) {
				mergeManager = crm_merger_batchmergemanager.BatchMergeManager.create(grid.getId(), {
					gridId: grid.getId(),
					entityTypeId: this.#entityTypeId,
					mergerUrl: this.#mergerUrl
				});
			}
			if (!mergeManager.isRunning() && selectedIds.length > 1) {
				mergeManager.setEntityIds(selectedIds);
				mergeManager.execute();
			}
		}
	}

	class ExecuteObservers extends BaseHandler {
		#entityTypeId;
		#valueElement;
		#progressBarRepo;
		constructor({
			entityTypeId,
			valueElementId
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
			this.#valueElement = document.getElementById(valueElementId);
			if (!main_core.Type.isElementNode(this.#valueElement)) {
				throw new Error('value element not found');
			}
		}
		static getEventName() {
			return 'BatchManager:executeObservers';
		}
		injectDependencies(progressBarRepo, extensionSettings) {
			this.#progressBarRepo = progressBarRepo;
		}
		execute(grid, selectedIds, forAll) {
			let observersManager = crm_autorun.BatchObserversManager.getItem(grid.getId());
			if (!observersManager) {
				observersManager = crm_autorun.BatchObserversManager.create(grid.getId(), {
					gridId: grid.getId(),
					entityTypeId: this.#entityTypeId,
					container: this.#progressBarRepo.getOrCreateProgressBarContainer('observers').id
				});
			}
			if (observersManager.isRunning()) {
				return;
			}
			if (crm_autorun.ProcessRegistry.isProcessRunning(grid.getId())) {
				showAnotherProcessRunningNotification();
				return;
			}
			let userIdList = main_core.Dom.attr(this.#valueElement, 'data-observers');
			if (main_core.Type.isNull(userIdList)) {
				userIdList = '';
			}
			userIdList = userIdList.toString().split(',').map(Number).filter(Boolean);
			if (!main_core.Type.isArrayFilled(userIdList)) {
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('CRM_ENTITY_LIST_PANEL_SELECT_OBSERVERS_BY_ID'),
					autoHide: true,
					autoHideDelay: NOTIFICATION_AUTO_HIDE_DELAY
				});
				return;
			}
			observersManager.setObserverIdList(userIdList);
			if (forAll) {
				observersManager.resetEntityIds();
			} else {
				observersManager.setEntityIds(selectedIds);
			}
			observersManager.execute();
		}
	}

	class ExecuteRefreshAccountingData extends BaseHandler {
		#entityTypeId;
		#progressBarRepo;
		constructor({
			entityTypeId
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
		}
		static getEventName() {
			return 'BatchManager:executeRefreshAccountingData';
		}
		injectDependencies(progressBarRepo, extensionSettings) {
			this.#progressBarRepo = progressBarRepo;
		}
		execute(grid, selectedIds, forAll) {
			let accountingManager = crm_autorun.BatchRefreshAccountingDataManager.getItem(grid.getId());
			if (accountingManager && accountingManager.isRunning()) {
				return;
			}
			if (crm_autorun.ProcessRegistry.isProcessRunning(grid.getId())) {
				showAnotherProcessRunningNotification();
				return;
			}
			if (!accountingManager) {
				accountingManager = crm_autorun.BatchRefreshAccountingDataManager.create(grid.getId(), {
					gridId: grid.getId(),
					entityTypeId: this.#entityTypeId,
					container: this.#progressBarRepo.getOrCreateProgressBarContainer('refresh-accounting-data').id
				});
			}
			if (forAll) {
				accountingManager.resetEntityIds();
			} else {
				accountingManager.setEntityIds(selectedIds);
			}
			accountingManager.execute();
		}
	}

	class ExecuteSetCategory extends BaseHandler {
		#entityTypeId;
		#valueElement;
		#progressBarRepo;
		constructor({
			entityTypeId,
			valueElementId
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
			this.#valueElement = document.getElementById(valueElementId);
			if (!main_core.Type.isElementNode(this.#valueElement)) {
				throw new Error('value element not found');
			}
		}
		static getEventName() {
			return 'BatchManager:executeSetCategory';
		}
		injectDependencies(progressBarRepo, extensionSettings) {
			this.#progressBarRepo = progressBarRepo;
		}
		execute(grid, selectedIds, forAll) {
			let categoryManager = crm_autorun.BatchSetCategoryManager.getItem(grid.getId());
			if (!categoryManager) {
				categoryManager = crm_autorun.BatchSetCategoryManager.create(grid.getId(), {
					gridId: grid.getId(),
					entityTypeId: this.#entityTypeId,
					container: this.#progressBarRepo.getOrCreateProgressBarContainer('set-category').id
				});
			}
			if (categoryManager.isRunning()) {
				return;
			}
			if (crm_autorun.ProcessRegistry.isProcessRunning(grid.getId())) {
				showAnotherProcessRunningNotification();
				return;
			}
			categoryManager.setCategoryId(main_core.Text.toInteger(this.#valueElement.dataset.value));
			if (forAll) {
				categoryManager.resetEntityIds();
			} else {
				categoryManager.setEntityIds(selectedIds);
			}
			categoryManager.execute();
		}
	}

	class ExecuteSetExport extends BaseHandler {
		#entityTypeId;
		#valueElement;
		#progressBarRepo;
		constructor({
			entityTypeId,
			valueElementId
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
			this.#valueElement = document.getElementById(valueElementId);
			if (!main_core.Type.isElementNode(this.#valueElement)) {
				throw new Error('value element not found');
			}
		}
		static getEventName() {
			return 'BatchManager:executeSetExport';
		}
		injectDependencies(progressBarRepo, extensionSettings) {
			this.#progressBarRepo = progressBarRepo;
		}
		execute(grid, selectedIds, forAll) {
			let setExportManager = crm_autorun.BatchSetExportManager.getItem(grid.getId());
			if (!setExportManager) {
				setExportManager = crm_autorun.BatchSetExportManager.create(grid.getId(), {
					gridId: grid.getId(),
					entityTypeId: this.#entityTypeId,
					container: this.#progressBarRepo.getOrCreateProgressBarContainer('set-export').id
				});
			}
			if (setExportManager.isRunning()) {
				return;
			}
			if (crm_autorun.ProcessRegistry.isProcessRunning(grid.getId())) {
				showAnotherProcessRunningNotification();
				return;
			}
			const isExport = this.#valueElement.dataset.value;
			if (isExport !== 'Y' && isExport !== 'N') {
				console.error('Invalid isExport in value element', isExport, this);
				return;
			}
			setExportManager.setExport(isExport);
			if (forAll) {
				setExportManager.resetEntityIds();
			} else {
				setExportManager.setEntityIds(selectedIds);
			}
			setExportManager.execute();
		}
	}

	class ExecuteSetOpened extends BaseHandler {
		#entityTypeId;
		#valueElement;
		#progressBarRepo;
		constructor({
			entityTypeId,
			valueElementId
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
			this.#valueElement = document.getElementById(valueElementId);
			if (!main_core.Type.isElementNode(this.#valueElement)) {
				throw new Error('value element not found');
			}
		}
		static getEventName() {
			return 'BatchManager:executeSetOpened';
		}
		injectDependencies(progressBarRepo, extensionSettings) {
			this.#progressBarRepo = progressBarRepo;
		}
		execute(grid, selectedIds, forAll) {
			let openedManager = crm_autorun.BatchSetOpenedManager.getItem(grid.getId());
			if (!openedManager) {
				openedManager = crm_autorun.BatchSetOpenedManager.create(grid.getId(), {
					gridId: grid.getId(),
					entityTypeId: this.#entityTypeId,
					container: this.#progressBarRepo.getOrCreateProgressBarContainer('set-opened').id
				});
			}
			if (openedManager.isRunning()) {
				return;
			}
			if (crm_autorun.ProcessRegistry.isProcessRunning(grid.getId())) {
				showAnotherProcessRunningNotification();
				return;
			}
			const isOpened = this.#valueElement.dataset.value;
			if (isOpened !== 'Y' && isOpened !== 'N') {
				console.error('Invalid isOpened in value element', isOpened, this);
				return;
			}
			openedManager.setIsOpened(isOpened);
			if (forAll) {
				openedManager.resetEntityIds();
			} else {
				openedManager.setEntityIds(selectedIds);
			}
			openedManager.execute();
		}
	}

	class ExecuteSetStage extends BaseHandler {
		#entityTypeId;
		#valueElement;
		#progressBarRepo;
		constructor({
			entityTypeId,
			valueElementId
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
			this.#valueElement = document.getElementById(valueElementId);
			if (!main_core.Type.isElementNode(this.#valueElement)) {
				throw new Error('value element not found');
			}
		}
		static getEventName() {
			return 'BatchManager:executeSetStage';
		}
		injectDependencies(progressBarRepo, extensionSettings) {
			this.#progressBarRepo = progressBarRepo;
		}
		execute(grid, selectedIds, forAll) {
			let stageManager = crm_autorun.BatchSetStageManager.getItem(grid.getId());
			if (!stageManager) {
				stageManager = crm_autorun.BatchSetStageManager.create(grid.getId(), {
					gridId: grid.getId(),
					entityTypeId: this.#entityTypeId,
					container: this.#progressBarRepo.getOrCreateProgressBarContainer('set-stage').id
				});
			}
			if (stageManager.isRunning()) {
				return;
			}
			if (crm_autorun.ProcessRegistry.isProcessRunning(grid.getId())) {
				showAnotherProcessRunningNotification();
				return;
			}
			const stageId = this.#valueElement.dataset.value;
			if (!main_core.Type.isStringFilled(stageId)) {
				console.error('Empty stage id in value element', stageId, this);
				return;
			}
			stageManager.setStageId(stageId);
			if (forAll) {
				stageManager.resetEntityIds();
			} else {
				stageManager.setEntityIds(selectedIds);
			}
			stageManager.execute();
		}
	}

	class ExecuteWhatsappMessage extends BaseHandler {
		#entityTypeId;
		#categoryId;
		#isWhatsAppEdnaEnabled;
		#ednaManageUrl;
		#progressBarRepo;
		constructor({
			entityTypeId,
			categoryId,
			isWhatsAppEdnaEnabled,
			ednaManageUrl
		}) {
			super();
			this.#entityTypeId = entityTypeId;
			this.#categoryId = categoryId;
			this.#isWhatsAppEdnaEnabled = isWhatsAppEdnaEnabled;
			this.#ednaManageUrl = ednaManageUrl;
		}
		injectDependencies(progressBarRepo, extensionSettings) {
			this.#progressBarRepo = progressBarRepo;
		}
		static getEventName() {
			return 'BatchManager:whatsappMessage';
		}
		async execute(grid, selectedIds, forAll) {
			if (!this.#isWhatsAppEdnaEnabled) {
				this.#showConnectEdnaSlider();
				return;
			}
			if (!this.#isEntityTypeSupported(this.#entityTypeId)) {
				console.error(`entityTypeId ${this.#entityTypeId} is not supported for whatsapp message`);
				return;
			}
			try {
				const exports = await main_core.Runtime.loadExtension('crm.group-actions.messages');
				const {
					Messages
				} = exports;
				const options = {
					gridId: grid.getId(),
					entityTypeId: this.#entityTypeId,
					categoryId: this.#categoryId,
					selectedIds,
					forAll
				};
				const whatsAppMessage = Messages.getInstance(this.#progressBarRepo, options);
				await whatsAppMessage.execute();
			} catch (e) {
				console.error(e);
			}
		}
		#isEntityTypeSupported(entityTypeId) {
			const supportTypes = [BX.CrmEntityType.enumeration.contact, BX.CrmEntityType.enumeration.company];
			return supportTypes.includes(entityTypeId);
		}
		#showConnectEdnaSlider() {
			BX.SidePanel.Instance.open(this.#ednaManageUrl, {
				width: 700,
				events: {
					onClose(e) {
						BX.SidePanel.Instance.postMessage(e.getSlider(), 'ContactCenter:reloadItem', {
							moduleId: 'imopenlines',
							itemCode: 'whatsappbyedna'
						});
					}
				}
			});
		}
	}

	class AddItemsToCallList extends BaseHandler {
		#entityTypeId;
		#callListId;
		#context;
		constructor({
			entityTypeId,
			callListId,
			context
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
			this.#callListId = main_core.Text.toInteger(callListId);
			if (this.#callListId <= 0) {
				throw new Error('callListId is required');
			}
			this.#context = String(context);
			if (!main_core.Type.isStringFilled(this.#context)) {
				throw new Error('context is required');
			}
		}
		static getEventName() {
			return 'CallList:addItemsToCallList';
		}
		execute(grid, selectedIds, forAll) {
			if (selectedIds.length === 0 && !forAll) {
				return;
			}
			addItemsToCallList(this.#entityTypeId, selectedIds, this.#callListId, this.#context, grid.getId(), forAll);
		}
	}

	class CreateAndStartCallList extends BaseHandler {
		#entityTypeId;
		constructor({
			entityTypeId
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
		}
		static getEventName() {
			return 'CallList:createAndStartCallList';
		}
		execute(grid, selectedIds, forAll) {
			createCallListAndShowAlertOnErrors(this.#entityTypeId, selectedIds, true, grid.getId(), forAll);
		}
	}

	class CreateCallList extends BaseHandler {
		#entityTypeId;
		constructor({
			entityTypeId
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
		}
		static getEventName() {
			return 'CallList:createCallList';
		}
		execute(grid, selectedIds, forAll) {
			createCallListAndShowAlertOnErrors(this.#entityTypeId, selectedIds, false, grid.getId(), forAll);
		}
	}

	class OpenTaskCreationForm extends BaseHandler {
		#entityTypeId;
		#extensionSettings;
		constructor({
			entityTypeId
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
		}
		static getEventName() {
			return 'openTaskCreationForm';
		}
		injectDependencies(progressBarRepo, extensionSettings) {
			this.#extensionSettings = extensionSettings;
		}
		execute(grid, selectedIds, forAll) {
			const urlTemplate = String(this.#extensionSettings.get('taskCreateUrl'));
			if (urlTemplate === '') {
				return;
			}
			const maxBindingsCount = Number(this.#extensionSettings.get('maxBindingsCount'));
			if (maxBindingsCount !== 0 && selectedIds.length > maxBindingsCount) {
				const alertText = main_core.Loc.getMessage('CRM_ENTITY_LIST_PANEL_CREATE_TASK_MAX_BINDINGS_ERROR', {
					'#MAX_BINDINGS_COUNT#': maxBindingsCount
				});
				ui_dialogs_messagebox.MessageBox.alert(alertText);
				return;
			}
			const entityTypeName = BX.CrmEntityType.resolveName(this.#entityTypeId);
			const entityKeys = selectedIds.map(id => BX.CrmEntityType.prepareEntityKey(entityTypeName, id));
			const url = urlTemplate.replace(encodeURIComponent('#USER_ID#'), main_core.Loc.getMessage('USER_ID')).replace(encodeURIComponent('#ENTITY_KEYS#'), entityKeys.join(';'));
			if (main_core.Reflection.getClass('BX.SidePanel.Instance.open')) {
				BX.SidePanel.Instance.open(url);
			} else {
				window.open(url);
			}
		}
	}

	class RenderUserTagSelector extends BaseHandler {
		#targetElement;
		constructor({
			targetElementId
		}) {
			super();
			this.#targetElement = document.getElementById(targetElementId);
			if (!main_core.Type.isElementNode(this.#targetElement)) {
				throw new Error('target element not found');
			}
		}
		static getEventName() {
			return 'renderUserTagSelector';
		}
		execute(grid, selectedIds, forAll) {
			const tagSelector = new ui_entitySelector.TagSelector({
				multiple: false,
				dialogOptions: {
					context: `crm.entity-list.${RenderUserTagSelector.getEventName()}.${grid.getId()}`,
					entities: [{
						id: 'user'
					}]
				},
				events: {
					onTagAdd: event => {
						const {
							tag
						} = event.getData();
						this.#targetElement.dataset.value = String(tag.getId());
					},
					onTagRemove: event => {
						const {
							tag
						} = event.getData();
						if (String(this.#targetElement.dataset.value) === String(tag.getId())) {
							delete this.#targetElement.dataset.value;
						}
					}
				}
			});
			tagSelector.renderTo(this.#targetElement);
		}
	}

	class RenderUserTagMultipleSelector extends BaseHandler {
		#targetElement;
		#tagSelector;
		constructor({
			targetElementId
		}) {
			super();
			this.#targetElement = document.getElementById(targetElementId);
			if (!main_core.Type.isElementNode(this.#targetElement)) {
				throw new Error('target element not found');
			}
		}
		static getEventName() {
			return 'renderUserTagMultipleSelector';
		}
		execute(grid, selectedIds, forAll) {
			this.#tagSelector = new ui_entitySelector.TagSelector({
				multiple: true,
				dialogOptions: {
					context: `crm.entity-list.${RenderUserTagMultipleSelector.getEventName()}.${grid.getId()}`,
					entities: [{
						id: 'user'
					}]
				},
				events: {
					onTagAdd: () => {
						this.updateDatasetValue();
					},
					onTagRemove: () => {
						this.updateDatasetValue();
					}
				}
			});
			this.#tagSelector.renderTo(this.#targetElement);
		}
		updateDatasetValue() {
			const tags = this.#tagSelector.getTags();
			main_core.Dom.attr(this.#targetElement, 'data-observers', tags.map(tag => tag.id).toString());
		}
	}

	function saveEntitiesToSegment(segmentId, entityTypeId, entityIds, gridId) {
		return new Promise((resolve, reject) => {
			main_core.ajax.runAction('crm.integration.sender.segment.upload', {
				data: {
					segmentId,
					entityTypeName: BX.CrmEntityType.resolveName(entityTypeId),
					entities: entityIds,
					gridId
				}
			}).then(({
				data
			}) => {
				if ('errors' in data) {
					ui_dialogs_messagebox.MessageBox.alert(main_core.Text.encode(data.errors.join('\n')));
					reject();
					return;
				}
				resolve({
					segment: data
				});
			}).catch(reject);
		});
	}

	class AddItemsToSegment extends BaseHandler {
		#entityTypeId;
		#valueElement;
		constructor({
			entityTypeId,
			valueElementId
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
			this.#valueElement = document.getElementById(valueElementId);
			if (!main_core.Type.isElementNode(this.#valueElement)) {
				throw new Error('value element not found');
			}
		}
		static getEventName() {
			return 'Sender:addItemsToSegment';
		}
		execute(grid, selectedIds, forAll) {
			const segmentId = main_core.Text.toInteger(this.#valueElement.dataset.value);
			grid.disableActionsPanel();
			void saveEntitiesToSegment(segmentId <= 0 ? null : segmentId, this.#entityTypeId, selectedIds, forAll ? grid.getId() : null).then(({
				segment
			}) => {
				if (segment.textSuccess) {
					ui_notification.UI.Notification.Center.notify({
						content: segment.textSuccess,
						autoHide: true,
						autoHideDelay: NOTIFICATION_AUTO_HIDE_DELAY
					});
				}
			}).finally(() => grid.enableActionsPanel());
		}
	}

	class AddLetter extends BaseHandler {
		#settings;
		#entityTypeId;
		#valueElement;
		constructor({
			entityTypeId,
			valueElementId
		}) {
			super();
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('entityTypeId is required');
			}
			this.#valueElement = document.getElementById(valueElementId);
			if (!main_core.Type.isElementNode(this.#valueElement)) {
				throw new Error('value element not found');
			}
		}
		static getEventName() {
			return 'Sender:addLetter';
		}
		injectDependencies(progressBarRepo, extensionSettings) {
			this.#settings = extensionSettings;
		}
		execute(grid, selectedIds, forAll) {
			const letterCode = this.#valueElement.dataset.value;
			if (!main_core.Type.isStringFilled(letterCode)) {
				return;
			}
			if (!this.#getAvailableLetterCodes().includes(letterCode) && main_core.Reflection.getClass('BX.Sender.B24License')) {
				BX.Sender.B24License.showMailingPopup();
				return;
			}
			void saveEntitiesToSegment(null, this.#entityTypeId, selectedIds, forAll ? grid.getId() : null).then(({
				segment
			}) => {
				const url = this.#settings.get('sender.letterAddUrl').replace('#code#', letterCode).replace('#segment_id#', segment.id);
				BX.SidePanel.Instance.open(url, {
					cacheable: false
				});
			});
		}
		#getAvailableLetterCodes() {
			return this.#settings.get('sender.availableLetterCodes') || [];
		}
	}

	// region batch processing
	Router.registerHandler(ExecuteDeletion);
	Router.registerHandler(ExecuteSetStage);
	Router.registerHandler(ExecuteSetCategory);
	Router.registerHandler(ExecuteSetOpened);
	Router.registerHandler(ExecuteSetExport);
	Router.registerHandler(ExecuteMerge);
	Router.registerHandler(ExecuteExclusion);
	Router.registerHandler(ExecuteAssigment);
	Router.registerHandler(ExecuteConversion);
	Router.registerHandler(ExecuteWhatsappMessage);
	Router.registerHandler(ExecuteRefreshAccountingData);
	Router.registerHandler(ExecuteRestartAutomation);
	Router.registerHandler(ExecuteObservers);
	// endregion

	// region call list
	Router.registerHandler(CreateCallList);
	Router.registerHandler(CreateAndStartCallList);
	Router.registerHandler(AddItemsToCallList);
	// endregion

	// region sender
	Router.registerHandler(AddLetter);
	Router.registerHandler(AddItemsToSegment);
	// endregion

	Router.registerHandler(RenderUserTagSelector);
	Router.registerHandler(RenderUserTagMultipleSelector);
	Router.registerHandler(OpenTaskCreationForm);
	Router.registerHandler(LoadEnumsAndEditSelected);

	const routers = new Map();

	/**
	 * @memberOf BX.Crm.EntityList.Panel
	 */
	function init({
		gridId,
		progressBarContainerId
	}) {
		if (!main_core.Reflection.getClass('BX.Main.gridManager.getInstanceById')) {
			console.error('BX.Main.gridManager is not found on page');
			return;
		}
		const grid = BX.Main.gridManager.getInstanceById(gridId);
		if (!grid) {
			console.error('grid not found', gridId);
			return;
		}
		const progressBarContainer = document.getElementById(progressBarContainerId);
		if (!main_core.Type.isElementNode(progressBarContainer)) {
			console.error('progressBarContainer not found', progressBarContainerId);
			return;
		}
		const existingRouter = routers.get(gridId);
		if (existingRouter) {
			existingRouter.stopListening();
			routers.delete(gridId);
		}
		const progressBarRepo = new crm_autorun.ProgressBarRepository(progressBarContainer);
		const settings = main_core.Extension.getSettings('crm.entity-list.panel');
		const eventRouter = new Router(grid, progressBarRepo, settings);
		eventRouter.startListening();
		routers.set(gridId, eventRouter);
	}

	/**
	 * @memberof BX.Crm.EntityList.Panel
	 */
	function loadEnumsGridEditData(grid, entityTypeId, categoryId) {
		return LoadEnumsAndEditSelected.loadEnums(grid, entityTypeId, categoryId);
	}

	exports.ExecuteRestartAutomation = ExecuteRestartAutomation;
	exports.createCallList = createCallList;
	exports.createCallListAndShowAlertOnErrors = createCallListAndShowAlertOnErrors;
	exports.init = init;
	exports.loadEnumsGridEditData = loadEnumsGridEditData;

})(this.BX.Crm.EntityList.Panel = this.BX.Crm.EntityList.Panel || {}, BX.Crm.Autorun, BX, BX.UI.Notification, BX.UI.Dialogs, BX, BX.Event, BX.Collections, BX.Crm, BX.UI.EntitySelector);
//# sourceMappingURL=panel.bundle.js.map
