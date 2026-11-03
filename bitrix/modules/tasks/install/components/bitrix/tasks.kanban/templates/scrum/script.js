/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core_events, main_core, pull_client) {
	'use strict';

	const eventEmitter = main_core_events.EventEmitter ?? BX.Event.EventEmitter;
	if (!main_core_events.EventEmitter) {
		BX.EventEmitter = eventEmitter;
	}
	class PullItem extends eventEmitter {
		constructor() {
			super();
			this.setEventNamespace('BX.Tasks.Scrum.KanbanManager.PullItem');
		}
		getModuleId() {
			return 'tasks';
		}
		getMap() {
			return {
				itemAdded: this.onStructureChanged.bind(this),
				itemRemoved: this.onStructureChanged.bind(this),
				itemMoved: this.onStructureChanged.bind(this),
				itemPlacementChanged: this.onStructureChanged.bind(this),
				itemUpdated: this.onItemUpdated.bind(this)
			};
		}
		onStructureChanged(params) {
			this.emit('structureChanged', params);
		}
		onItemUpdated(params) {
			this.emit('itemUpdated', params);
		}
	}

	class KanbanComponent {
		constructor(params) {
			this.filterId = params.filterId;
			this.defaultPresetId = params.defaultPresetId;
			this.ajaxComponentPath = params.ajaxComponentPath;
			this.ajaxComponentParams = params.ajaxComponentParams;
		}
		onClickSort(item, order) {
			if (!main_core.Dom.hasClass(item, 'menu-popup-item-accept')) {
				this.refreshIcons(item);
				this.saveSelection(order);
			}
		}
		refreshIcons(item) {
			item.parentElement.childNodes.forEach(element => {
				main_core.Dom.removeClass(element, 'menu-popup-item-accept');
			});
			main_core.Dom.addClass(item, 'menu-popup-item-accept');
		}
		saveSelection(order) {
			BX.ajax.runComponentAction('bitrix:tasks.kanban', 'setNewTaskOrder', {
				mode: 'class',
				data: {
					order: order ? order : 'desc',
					params: this.ajaxComponentParams
				}
			}).then(response => {
				const data = response.data;
				BX.onCustomEvent(this, 'onTaskSortChanged', [data]);
			});
		}
	}

	/**
	 * Intercepts a drag into the FINISH column: asks for checklist completion first and
	 * rolls the item back to its original place when the move or the completion fails.
	 */
	class FinishMoveController {
		constructor(params = {}) {
			this.groupId = Number(params.groupId ?? 0);
			this.loadExtension = params.loadExtension ?? (extension => main_core.Runtime.loadExtension(extension));
			this.moveContexts = new Map();
			this.pendingMoves = new Map();
			this.confirmedFinishMoves = new Set();
		}
		rememberMove(event) {
			const item = event.getItem();
			if (!item) {
				return;
			}
			const taskId = Number(item.getId());
			if (this.pendingMoves.has(taskId)) {
				return;
			}
			const sourceColumn = item.getColumn();
			this.moveContexts.set(taskId, {
				sourceColumn,
				sourceNextItem: sourceColumn.getNextItemSibling(item)
			});
		}
		consumeConfirmedFinishMove(item) {
			const taskId = Number(item.getId());
			if (!this.confirmedFinishMoves.delete(taskId)) {
				return false;
			}
			this.moveContexts.delete(taskId);
			return true;
		}
		async handleItemMoved(grid, item, moveAction) {
			const taskId = Number(item.getId());
			const context = this.moveContexts.get(taskId);
			this.moveContexts.delete(taskId);
			const error = await moveAction();
			if (error) {
				if (context) {
					grid.moveItem(item, context.sourceColumn, context.sourceNextItem);
				}
				await this.resyncBoard(grid);
			}
		}
		handleBeforeItemMoved(grid, event, onItemMoved) {
			const item = event.getItem();
			const targetColumn = event.getTargetColumn();
			if (!item || !targetColumn) {
				return null;
			}
			const sourceColumn = item.getColumn();
			const taskId = Number(item.getId());
			if (this.pendingMoves.has(taskId)) {
				event.denyAction();
				return this.pendingMoves.get(taskId);
			}
			const isFinishMove = targetColumn.getType() === 'FINISH' && sourceColumn.getType() !== 'FINISH';
			if (!isFinishMove) {
				return null;
			}
			event.denyAction();
			const context = {
				item,
				sourceColumn,
				sourceNextItem: sourceColumn.getNextItemSibling(item),
				targetColumn,
				beforeItem: event.getTargetItem()
			};
			const movePromise = this.handleFinishMove(grid, context, onItemMoved).finally(() => {
				this.pendingMoves.delete(taskId);
				this.moveContexts.delete(taskId);
			});
			this.pendingMoves.set(taskId, movePromise);
			return movePromise;
		}
		async handleFinishMove(grid, context, onItemMoved) {
			const taskId = Number(context.item.getId());
			try {
				const {
					checkListCompletionPromptRunner,
					CompletionStates
				} = await this.loadExtension('tasks.v2.lib.check-list-completion-prompt');
				const result = await checkListCompletionPromptRunner.runForTask(taskId, {
					complete: () => this.moveItem(grid, context, onItemMoved, true),
					completeWithChecklist: () => this.moveItem(grid, context, onItemMoved, true)
				}, {
					presentation: {
						returnButtonText: main_core.Loc.getMessage('KANBAN_CHECKLIST_COMPLETE_RETURN_BUTTON')
					},
					beforeComplete: () => this.showDod(grid, context.item)
				});
				if (result.state === CompletionStates.Returned) {
					const {
						TaskCard
					} = await this.loadExtension('tasks.v2.application.task-card');
					TaskCard.showFullCard({
						taskId
					});
				} else if (result.state === CompletionStates.Failed) {
					throw result.error;
				}
			} catch (error) {
				BX.UI.Notification.Center.notify({
					content: normalizeError(error).message
				});
			}
		}
		async showDod(grid, item) {
			const taskId = Number(item.getId());
			const itemData = item.getData() ?? {};
			const parentTaskId = Number(itemData.parentId || grid.getParentTaskId?.() || 0);
			const groupId = Number(itemData.groupId || grid.groupId || this.groupId || 0);
			const {
				TaskStatus
			} = await this.loadExtension('tasks.scrum.task-status');
			const taskStatus = new TaskStatus({
				taskId,
				parentTaskId,
				groupId,
				action: 'complete'
			});
			if (parentTaskId > 0 && (await taskStatus.isParentScrumTask())) {
				return true;
			}
			return taskStatus.showDodConfirmation(taskId);
		}
		async moveItem(grid, context, onItemMoved, completeWithChecklist) {
			const moved = grid.moveItem(context.item, context.targetColumn, context.beforeItem);
			if (!moved) {
				return new Error('The Scrum item was not moved');
			}
			const taskId = Number(context.item.getId());
			this.confirmedFinishMoves.add(taskId);
			let error = null;
			try {
				error = await this.runExistingMove(grid, onItemMoved, completeWithChecklist);
			} finally {
				this.confirmedFinishMoves.delete(taskId);
			}
			if (error) {
				grid.moveItem(context.item, context.sourceColumn, context.sourceNextItem);
				await this.resyncBoard(grid);
			}
			return error;
		}
		async resyncBoard(grid) {
			const promises = [];
			main_core_events.EventEmitter.emit('tasks:kanban:resyncRequest', {
				grid,
				groupId: this.groupId,
				allowStaleChild: true,
				promises
			});
			await Promise.all(promises);
		}

		// Invariant: patching grid.ajax only works while the base onItemMoved
		// calls this.ajax('moveTask') synchronously inside the callback.
		async runExistingMove(grid, callback, completeWithChecklist = false) {
			const originalAjax = grid.ajax;
			let resolveRequest = () => {};
			let requestStarted = false;
			const result = new Promise(resolve => {
				resolveRequest = resolve;
			});

			// eslint-disable-next-line no-param-reassign
			grid.ajax = function (action, data) {
				const requestData = action === 'moveTask' && completeWithChecklist ? {
					...data,
					completeWithChecklist: true
				} : data;
				const request = originalAjax.call(this, action, requestData);
				if (action === 'moveTask') {
					requestStarted = true;
					Promise.resolve(request).then(response => {
						const hasErrors = (response?.errors ?? []).length > 0;
						resolveRequest(hasErrors ? normalizeError(response) : null);
					}).catch(error => resolveRequest(normalizeError(error)));
				}
				return request;
			};
			let callbackError = null;
			try {
				callbackError = callback();
			} catch (error) {
				callbackError = normalizeError(error);
			} finally {
				// eslint-disable-next-line no-param-reassign
				grid.ajax = originalAjax;
			}
			if (callbackError instanceof Error) {
				return callbackError;
			}
			if (!requestStarted) {
				return new Error('The existing Scrum move did not start');
			}
			return result;
		}
	}
	function createScrumKanbanGrid(finishMoveController, options) {
		const ParentGrid = BX.Tasks.Kanban.Grid;
		const ScrumKanbanGrid = function (gridOptions) {
			ParentGrid.call(this, gridOptions);
			main_core_events.EventEmitter.subscribe(this, 'Kanban.Grid:onBeforeItemMoved', event => {
				const [dragEvent] = event.getCompatData();
				finishMoveController.rememberMove(dragEvent);
				void finishMoveController.handleBeforeItemMoved(this, dragEvent, () => BX.onCustomEvent(this, 'Kanban.Grid:onItemMoved', [dragEvent.getItem(), dragEvent.getTargetColumn(), dragEvent.getTargetItem()]));
			});
		};
		ScrumKanbanGrid.prototype = Object.create(ParentGrid.prototype);
		ScrumKanbanGrid.prototype.constructor = ScrumKanbanGrid;
		ScrumKanbanGrid.prototype.hasExternalMoveRollback = function () {
			return true;
		};
		ScrumKanbanGrid.prototype.onItemMoved = function (item, targetColumn, beforeItem) {
			if (finishMoveController.consumeConfirmedFinishMove(item)) {
				ParentGrid.prototype.onItemMoved.call(this, item, targetColumn, beforeItem);
				return;
			}
			void finishMoveController.handleItemMoved(this, item, () => finishMoveController.runExistingMove(this, () => ParentGrid.prototype.onItemMoved.call(this, item, targetColumn, beforeItem)));
		};
		return new ScrumKanbanGrid(options);
	}
	function normalizeError(error) {
		if (error instanceof Error) {
			return error;
		}
		return new Error(error?.errors?.[0]?.message ?? String(error));
	}

	const STRUCTURAL_RESYNC_DELAY = 250;
	class KanbanManager {
		constructor(params) {
			this.groupId = parseInt(params.groupId, 10);
			this.filterId = params.filterId;
			this.siteTemplateId = params.siteTemplateId;
			this.ajaxComponentPath = params.ajaxComponentPath;
			this.ajaxComponentParams = params.ajaxComponentParams;
			this.sprintSelected = params.sprintSelected;
			this.isActiveSprint = params.isActiveSprint;
			this.kanbanHeader = null;
			this.kanban = null;
			this.kanbanGroupedByParentTasks = new Map();
			this.parentHeaderRequestIds = new Map();
			this.boardGeneration = 0;
			this.resyncPromise = null;
			this.resyncRequested = false;
			this.structuralResyncTimer = null;
			this.parentTasks = params.parentTasks;
			this.kanbanComponent = new KanbanComponent({
				filterId: params.filterId,
				defaultPresetId: params.defaultPresetId,
				ajaxComponentPath: params.ajaxComponentPath,
				ajaxComponentParams: params.ajaxComponentParams
			});
			this.finishMoveController = new FinishMoveController({
				groupId: params.ajaxComponentParams?.GROUP_ID
			});
			this.pullItem = new PullItem({
				groupId: this.groupId
			});
			this.pullItem.subscribe('itemUpdated', this.onItemUpdated.bind(this));
			this.pullItem.subscribe('structureChanged', this.onStructuralItemChanged.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', () => this.requestResync());
			main_core_events.EventEmitter.subscribe('tasks:kanban:resyncRequest', this.onResyncRequest.bind(this));
			main_core_events.EventEmitter.subscribe('onTasksGroupSelectorChange', this.onChangeSprint.bind(this));
			main_core_events.EventEmitter.subscribe('tasks-kanban-settings-fields-view', () => this.kanban.showFieldsSelectPopup());
			pull_client.PULL.subscribe(this.pullItem);
		}
		drawKanban(renderTo, params) {
			if (!this.sprintSelected) {
				this.showNotSprintMessage(renderTo);
				return;
			}
			this.inputRenderTo = renderTo;
			this.inputKanbanParams = params;
			this.drawKanbanHeader(renderTo, params);
			this.drawKanbanWithoutGrouping(renderTo, params);
			this.drawKanbanInGroupingMode(renderTo, params);
			this.fillNeighborKanbans();
			this.adjustGroupHeadersWidth();
			main_core_events.EventEmitter.subscribe(this.kanbanHeader, 'Kanban.Grid:onColumnAddedAsync', () => {
				this.adjustGroupHeadersWidth();
			});
			main_core_events.EventEmitter.subscribe(this.kanbanHeader, 'Kanban.Grid:onColumnRemovedAsync', () => {
				setTimeout(() => {
					this.adjustGroupHeadersWidth();
				}, 200);
			});
		}
		getKanbanHeader() {
			return this.kanbanHeader;
		}
		getKanban() {
			return this.kanban;
		}
		getKanbansGroupedByParentTasks() {
			return this.kanbanGroupedByParentTasks;
		}
		drawKanbanInGroupingMode(renderTo, params) {
			main_core.Dom.addClass(renderTo, 'tasks-scrum-kanban');
			if (this.isParentTaskGrouping()) {
				for (const parentTaskId in this.parentTasks) {
					if (this.parentTasks[parentTaskId]['isVisibilitySubtasks'] === 'N') {
						delete this.parentTasks[parentTaskId];
						if (!this.kanban.getItem(parentTaskId)) {
							this.kanban.refreshTask(parentTaskId);
						}
						continue;
					}
					const kanbanNode = this.createParentTaskKanbanNode(this.parentTasks[parentTaskId]);
					const parentTaskCompleted = this.parentTasks[parentTaskId]['completed'] === 'Y';
					if (parentTaskCompleted) {
						this.setTextDecorationToParentTaskName(kanbanNode);
					}
					main_core.Dom.append(kanbanNode, renderTo);
					const tickButtonNode = kanbanNode.querySelector('.tasks-scrum-kanban-group-header-tick');
					main_core.Event.bind(tickButtonNode, 'click', () => {
						this.toggleGroupingVisibility(kanbanNode);
					});
					const container = kanbanNode.querySelector('.tasks-scrum-kanban-container');
					this.drawKanbanGroupedByParentTasks(this.parentTasks[parentTaskId], container, params);
				}
			}
		}
		drawKanbanHeader(renderTo, params) {
			const headerParams = main_core.Runtime.clone(params);
			headerParams.kanbanHeader = true;
			headerParams.items = [];
			this.kanbanHeader = createScrumKanbanGrid(this.finishMoveController, this.getKanbanParams(renderTo, headerParams));
			this.kanbanHeader.draw();
		}
		drawKanbanWithoutGrouping(renderTo, params) {
			this.kanban = createScrumKanbanGrid(this.finishMoveController, this.getKanbanParams(renderTo, params));
			main_core_events.EventEmitter.subscribe(this.kanban, 'Kanban.Grid:onAddParentTask', baseEvent => {
				const parentTask = baseEvent.getData();
				this.createParentTaskKanban(parentTask);
				this.fillNeighborKanbans();
				this.adjustGroupHeadersWidth();
				this.kanban.addItemsFromQueue();
			});
			this.kanban.draw();
		}
		drawKanbanGroupedByParentTasks(parentTask, renderTo, params) {
			const parentTaskId = parseInt(parentTask.id, 10);
			const headerParams = main_core.Runtime.clone(params);
			headerParams.columns = parentTask.columns;
			headerParams.items = parentTask.items;
			headerParams.parentTaskId = parentTaskId;
			headerParams.parentTaskName = parentTask.name;
			headerParams.parentTaskCompleted = parentTask.completed === 'Y';
			const kanban = createScrumKanbanGrid(this.finishMoveController, this.getKanbanParams(renderTo, headerParams));
			kanban.draw();
			if (headerParams.parentTaskCompleted && !kanban.hasItemInProgress()) {
				const container = kanban.getRenderToContainer().closest('.tasks-scrum-parent-task-kanban');
				this.downGroupingVisibility(container);
			}
			main_core_events.EventEmitter.subscribe(kanban, 'Kanban.Grid:onCompleteParentTask', () => {
				this.onCompleteParentTask(kanban);
			});
			main_core_events.EventEmitter.subscribe(kanban, 'Kanban.Grid:onRenewParentTask', () => {
				this.onRenewParentTask(kanban);
			});
			main_core_events.EventEmitter.subscribe(kanban, 'Kanban.Grid:onProceedParentTask', () => {
				this.onProceedParentTask(kanban);
			});
			main_core_events.EventEmitter.subscribe(kanban, 'Kanban.Grid:onAddItemInProgress', baseEvent => {
				const container = kanban.getRenderToContainer().closest('.tasks-scrum-parent-task-kanban');
				this.upGroupingVisibility(container);
			});
			this.kanbanGroupedByParentTasks.set(parentTaskId, kanban);
		}
		fillNeighborKanbans() {
			this.addNeighborKanban(this.kanbanHeader);
			this.addNeighborKanban(this.kanban);
			this.kanbanGroupedByParentTasks.forEach(parentTaskKanban => {
				this.addNeighborKanban(parentTaskKanban);
			});
			this.updateHeaderColumns();
		}
		cleanNeighborKanbans() {
			this.kanbanHeader.cleanNeighborGrids();
			this.kanban.cleanNeighborGrids();
			this.kanbanGroupedByParentTasks.forEach(parentTaskKanban => {
				this.removeParentTaskKanban(parentTaskKanban);
				parentTaskKanban.cleanNeighborGrids();
			});
			this.kanbanGroupedByParentTasks.clear();
		}
		updateHeaderColumns() {
			this.kanbanHeader.updateTotals();
		}
		addNeighborKanban(kanban) {
			this.kanbanHeader.addNeighborGrid(kanban);
			this.kanban.addNeighborGrid(kanban);
			this.kanbanGroupedByParentTasks.forEach(parentTaskKanban => {
				parentTaskKanban.addNeighborGrid(kanban);
			});
		}
		getKanbanParams(renderTo, params) {
			return {
				isGroupingMode: true,
				gridHeader: params.kanbanHeader,
				parentTaskId: params.parentTaskId ? params.parentTaskId : 0,
				parentTaskName: params.parentTaskName ? params.parentTaskName : '',
				parentTaskCompleted: params.parentTaskCompleted ? params.parentTaskCompleted : false,
				renderTo: renderTo,
				itemType: 'BX.Tasks.Kanban.Item',
				columnType: 'BX.Tasks.Kanban.Column',
				canAddColumn: this.isActiveSprint,
				canEditColumn: this.isActiveSprint,
				canRemoveColumn: this.isActiveSprint,
				canSortColumn: this.isActiveSprint,
				canAddItem: !params.addItemInSlider && this.isActiveSprint,
				canSortItem: this.isActiveSprint,
				bgColor: this.siteTemplateId,
				columns: params.columns,
				items: params.items,
				addItemTitleText: main_core.Loc.getMessage('KANBAN_QUICK_TASK'),
				addDraftItemInfo: main_core.Loc.getMessage('KANBAN_QUICK_TASK_ITEM_INFO'),
				data: {
					kanbanType: 'K',
					ajaxHandlerPath: this.ajaxComponentPath,
					pathToTask: params.pathToTask,
					pathToTaskCreate: params.pathToTaskCreate,
					pathToUser: params.pathToUser,
					addItemInSlider: params.addItemInSlider,
					params: this.ajaxComponentParams,
					gridId: this.filterId,
					newTaskOrder: params.newTaskOrder,
					setClientDate: params.setClientDate,
					clientDate: BX.date.format(BX.date.convertBitrixFormat(main_core.Loc.getMessage('FORMAT_DATE'))),
					clientTime: BX.date.format(BX.date.convertBitrixFormat(main_core.Loc.getMessage('FORMAT_DATETIME'))),
					rights: {
						canAddColumn: this.isActiveSprint,
						canEditColumn: this.isActiveSprint,
						canRemoveColumn: this.isActiveSprint,
						canSortColumn: this.isActiveSprint,
						canAddItem: this.isActiveSprint,
						canSortItem: this.isActiveSprint
					},
					admins: params.admins,
					customSectionsFields: params.customSectionsFields ? params.customSectionsFields : {}
				},
				messages: {
					ITEM_TITLE_PLACEHOLDER: main_core.Loc.getMessage('KANBAN_ITEM_TITLE_PLACEHOLDER'),
					COLUMN_TITLE_PLACEHOLDER: main_core.Loc.getMessage('KANBAN_COLUMN_TITLE_PLACEHOLDER')
				},
				ownerId: params.ownerId,
				groupId: params.groupId,
				isSprintView: 'Y'
			};
		}
		onClickSort(item, order) {
			this.kanbanComponent.onClickSort(item, order);
		}
		onResyncRequest(event) {
			const {
				grid,
				promises,
				allowStaleChild,
				groupId,
				onlyAfterCurrent
			} = event.getData();
			const isCurrentGrid = grid === this.kanban || grid === this.kanbanHeader || this.kanban?.getNeighborGrids().includes(grid);
			const isStaleChildGrid = allowStaleChild === true && typeof grid?.isChildScrumGrid === 'function' && grid.isChildScrumGrid() && Number(groupId) === this.groupId;
			if (!isCurrentGrid && !isStaleChildGrid) {
				return Promise.resolve();
			}
			if (onlyAfterCurrent === true && !this.resyncPromise) {
				return Promise.resolve(false);
			}
			const resyncPromise = this.requestResync();
			if (Array.isArray(promises)) {
				promises.push(resyncPromise);
			}
			return resyncPromise;
		}
		requestResync() {
			if (!this.resyncPromise) {
				this.boardGeneration += 1;
				const runResync = () => {
					this.resyncRequested = false;
					return Promise.resolve(this.onApplyFilter()).catch(() => false).then(result => this.resyncRequested ? runResync() : result);
				};
				const resyncPromise = runResync().finally(() => {
					if (this.resyncPromise === resyncPromise) {
						this.resyncPromise = null;
						this.resyncRequested = false;
					}
				});
				this.resyncPromise = resyncPromise;
			} else {
				this.resyncRequested = true;
			}
			return this.resyncPromise;
		}
		onApplyFilter(filterId, values, filterInstance, promise, params) {
			const kanban = this.kanban;
			const kanbanHeader = this.kanbanHeader;
			const groupId = this.groupId;
			const sprintId = kanban.getData().params.SPRINT_ID;
			const generation = ++this.boardGeneration;
			return kanban.ajax('applyFilter', {}).then(response => {
				if (this.boardGeneration !== generation || this.groupId !== groupId || this.kanban !== kanban || this.kanbanHeader !== kanbanHeader || kanban.getData().params.SPRINT_ID !== sprintId) {
					return false;
				}
				const data = response.data;
				this.fadeOutKanbans();
				if (this.kanban.differentColumnCount(data)) {
					this.kanbanHeader.getColumns().forEach(column => this.kanbanHeader.removeColumn(column));
					this.kanban.getColumns().forEach(column => this.kanban.removeColumn(column));
					this.refreshKanban(this.kanbanHeader, data);
				}
				this.refreshKanban(this.kanban, data);
				this.cleanNeighborKanbans();
				if (this.existsTasksGroupedBySubTasks(data)) {
					Object.entries(data.parentTasks).forEach(parentTask => {
						const [, parentTaskData] = parentTask;
						this.createParentTaskKanban(parentTaskData);
					});
				}
				this.fillNeighborKanbans();
				this.adjustGroupHeadersWidth();
				this.fadeInKanbans();
				return true;
			}, () => false);
		}
		onChangeSprint(baseEvent) {
			const generation = ++this.boardGeneration;
			const [currentGroup] = baseEvent.getCompatData();
			const kanban = this.kanban;
			const kanbanHeader = this.kanbanHeader;
			const groupId = this.groupId;
			const sprintId = currentGroup.sprintId;
			const gridData = kanban.getData();
			gridData.params.SPRINT_ID = sprintId;
			kanban.setData(gridData);
			kanban.ajax('changeSprint', {}).then(response => {
				if (this.boardGeneration !== generation || this.groupId !== groupId || this.kanban !== kanban || this.kanbanHeader !== kanbanHeader || kanban.getData().params.SPRINT_ID !== sprintId) {
					return;
				}
				const data = response.data;
				this.cleanNeighborKanbans();
				this.kanbanHeader.getColumns().forEach(column => this.kanbanHeader.removeColumn(column));
				this.kanban.getColumns().forEach(column => this.kanban.removeColumn(column));
				this.refreshKanban(this.kanbanHeader, data);
				this.refreshKanban(this.kanban, data);
				if (this.existsTasksGroupedBySubTasks(data)) {
					Object.entries(data.parentTasks).forEach(parentTask => {
						const [, parentTaskData] = parentTask;
						this.createParentTaskKanban(parentTaskData);
					});
				}
				this.fillNeighborKanbans();
				this.adjustGroupHeadersWidth();
			}, error => {});
		}
		onStructuralItemChanged(baseEvent) {
			const data = baseEvent.getData();
			if (Number(data.groupId) !== this.groupId || !this.sprintSelected || !this.kanban) {
				return;
			}
			const kanban = this.kanban;
			const sprintId = kanban.getData().params.SPRINT_ID;
			if (Array.isArray(data.entityIds) && !data.entityIds.includes(Number(sprintId))) {
				return;
			}
			if (Number.isInteger(data.sprintId) && data.sprintId >= 0 && data.sprintId !== Number(sprintId)) {
				return;
			}
			this.scheduleStructuralResync();
		}
		scheduleStructuralResync() {
			const kanban = this.kanban;
			const groupId = this.groupId;
			const sprintId = kanban.getData().params.SPRINT_ID;
			const pending = this.structuralResyncTimer;
			if (pending) {
				if (pending.kanban === kanban && pending.groupId === groupId && pending.sprintId === sprintId) {
					return;
				}
				clearTimeout(pending.id);
			}
			const timer = {
				kanban,
				groupId,
				sprintId,
				id: null
			};
			timer.id = setTimeout(() => {
				if (this.structuralResyncTimer !== timer) {
					return;
				}
				this.structuralResyncTimer = null;
				if (this.groupId !== groupId || this.kanban !== kanban || kanban.getData().params.SPRINT_ID !== sprintId) {
					return;
				}
				void this.requestResync();
			}, STRUCTURAL_RESYNC_DELAY);
			this.structuralResyncTimer = timer;
		}
		onItemUpdated(baseEvent) {
			const data = baseEvent.getData();
			if (this.groupId !== data.groupId) {
				return;
			}
			const taskId = data.sourceId;
			const isParentTask = this.kanbanGroupedByParentTasks.has(Number(taskId));
			const isTopLevelTask = this.kanban.hasItem(taskId);
			const childKanbans = [];
			if (!isParentTask && !isTopLevelTask) {
				this.kanbanGroupedByParentTasks.forEach(parentTaskKanban => {
					if (parentTaskKanban.hasItem(taskId)) {
						childKanbans.push(parentTaskKanban);
					}
				});
			}
			const isVisible = isParentTask || isTopLevelTask || childKanbans.length > 0;
			if (Number.isInteger(data.sprintId) && data.sprintId >= 0) {
				const isInSelectedSprint = data.sprintId === Number(this.kanban.getData().params.SPRINT_ID);
				if (isVisible !== isInSelectedSprint) {
					this.scheduleStructuralResync();
					return;
				}
				if (!isVisible) {
					return;
				}
			}
			if (isParentTask) {
				return this.refreshParentTaskHeader(Number(taskId));
			}
			if (isTopLevelTask) {
				this.kanban.refreshTask(taskId).then(response => {
					if (response && main_core.Type.isArray(response.data) && response.data.length === 0 && response.errors.length === 0) {
						this.requestResync();
					}
				});
			} else {
				childKanbans.forEach(parentTaskKanban => parentTaskKanban.refreshTask(taskId));
			}
		}
		async refreshParentTaskHeader(parentTaskId) {
			if (this.resyncPromise) {
				return this.requestResync();
			}
			const kanban = this.kanban;
			const parentTaskKanban = this.kanbanGroupedByParentTasks.get(parentTaskId);
			const boardGeneration = this.boardGeneration;
			const groupId = this.groupId;
			const sprintId = kanban.getData().params.SPRINT_ID;
			const requestId = (this.parentHeaderRequestIds.get(parentTaskId) ?? 0) + 1;
			this.parentHeaderRequestIds.set(parentTaskId, requestId);
			let response;
			try {
				response = await kanban.ajax('newTask', {
					taskId: parentTaskId
				});
			} catch (error) {
				return false;
			}
			if (this.boardGeneration !== boardGeneration || this.groupId !== groupId || this.kanban !== kanban || this.kanbanGroupedByParentTasks.get(parentTaskId) !== parentTaskKanban || kanban.getData().params.SPRINT_ID !== sprintId || this.parentHeaderRequestIds.get(parentTaskId) !== requestId || this.resyncPromise || response?.errors?.length > 0) {
				return false;
			}
			const parentTask = response?.data;
			const taskData = parentTask?.data;
			const cachedParentTask = this.parentTasks[parentTaskId];
			const container = parentTaskKanban.getInnerContainer()?.closest('.tasks-scrum-parent-task-kanban');
			const nameNode = container?.querySelector('.tasks-scrum-kanban-group-header-name a');
			const storyPointsNode = container?.querySelector('.tasks-scrum-kanban-group-header-story-points');
			if (Array.isArray(parentTask) || Number(parentTask?.id) !== parentTaskId || Number(taskData?.id) !== parentTaskId || Number(taskData?.groupId) !== groupId || Number(taskData?.parentId ?? 0) !== 0 || parentTask?.isVisibilitySubtasks !== 'Y' || typeof taskData?.name !== 'string' || !cachedParentTask || !nameNode || !storyPointsNode) {
				return this.requestResync();
			}
			const completed = taskData.completed === true || taskData.completed === 'Y';
			const storyPoints = taskData.storyPoints ?? '';
			nameNode.textContent = taskData.name;
			storyPointsNode.textContent = storyPoints;
			if (completed) {
				this.setTextDecorationToParentTaskName(container);
			} else {
				this.unsetTextDecorationToParentTaskName(container);
			}
			cachedParentTask.name = taskData.name;
			cachedParentTask.storyPoints = storyPoints;
			cachedParentTask.completed = completed ? 'Y' : 'N';
			parentTaskKanban.parentTaskName = taskData.name;
			parentTaskKanban.parentTaskCompleted = completed;
			return true;
		}
		refreshKanban(kanban, data) {
			kanban.resetPaginationPage();
			kanban.removeItems();
			kanban.loadData(data);
		}
		refreshParentTasksKanbans(data) {
			const parentTasksToRefresh = [];
			const parentTasksToCreate = [];
			Object.entries(data.parentTasks).forEach(parentTask => {
				const [parentTaskId, parentTaskData] = parentTask;
				if (this.kanbanGroupedByParentTasks.has(parseInt(parentTaskId, 10))) {
					parentTasksToRefresh.push(parentTaskData);
				} else {
					parentTasksToCreate.push(parentTaskData);
				}
			});
			this.kanbanGroupedByParentTasks.forEach((parentTaskKanban, parentTaskId) => {
				if (!data.parentTasks[parentTaskId]) {
					this.hideParentTaskKanban(parentTaskKanban);
				}
			});
			parentTasksToRefresh.forEach(parentTaskData => {
				const parentTaskKanban = this.kanbanGroupedByParentTasks.get(parseInt(parentTaskData.id, 10));
				this.refreshParentTaskKanban(parentTaskKanban, parentTaskData);
			});
			parentTasksToCreate.forEach(parentTaskData => {
				this.createParentTaskKanban(parentTaskData);
			});
		}
		refreshParentTaskKanban(kanban, data) {
			kanban.resetPaginationPage();
			kanban.removeItems();
			const container = kanban.getInnerContainer().closest('.tasks-scrum-parent-task-kanban');
			this.showElement(container);
			this.upGroupingVisibility(container);
			kanban.loadData(data);
			if (data['completed'] === 'Y') {
				this.downGroupingVisibility(container);
			}
		}
		createParentTaskKanban(parentTaskData) {
			if (parentTaskData.isVisibilitySubtasks === 'N') {
				if (!this.kanban.getItem(parentTaskData.id)) {
					this.kanban.refreshTask(parentTaskData.id);
				}
				return;
			}
			this.parentTasks[parentTaskData.id] = parentTaskData;
			const kanbanNode = this.createParentTaskKanbanNode(parentTaskData);
			const parentTaskCompleted = parentTaskData['completed'] === 'Y';
			if (parentTaskCompleted) {
				this.setTextDecorationToParentTaskName(kanbanNode);
			}
			main_core.Dom.append(kanbanNode, this.inputRenderTo);
			const tickButtonNode = kanbanNode.querySelector('.tasks-scrum-kanban-group-header-tick');
			main_core.Event.bind(tickButtonNode, 'click', () => {
				this.toggleGroupingVisibility(kanbanNode);
			});
			const container = kanbanNode.querySelector('.tasks-scrum-kanban-container');
			this.drawKanbanGroupedByParentTasks(parentTaskData, container, this.inputKanbanParams);
		}
		hideParentTaskKanban(kanban) {
			kanban.removeItems();
			const container = kanban.getInnerContainer().closest('.tasks-scrum-parent-task-kanban');
			this.hideElement(container);
		}
		removeParentTaskKanban(kanban) {
			kanban.deactivateFocusZone();
			main_core.Dom.remove(kanban.getInnerContainer().closest('.tasks-scrum-parent-task-kanban'));
		}
		fadeOutKanbans() {
			this.kanban.fadeOut();
			this.kanbanGroupedByParentTasks.forEach(parentTaskKanban => {
				parentTaskKanban.fadeOut();
			});
		}
		fadeInKanbans() {
			this.kanban.fadeIn();
			this.kanbanGroupedByParentTasks.forEach(parentTaskKanban => {
				parentTaskKanban.fadeIn();
			});
		}
		showNotSprintMessage(renderTo) {
			const message = this.isActiveSprint ? main_core.Loc.getMessage('KANBAN_NO_ACTIVE_SPRINT') : main_core.Loc.getMessage('KANBAN_NO_COMPLETED_SPRINT');
			main_core.Dom.append(main_core.Tag.render`
			<div class="tasks-kanban__start">
					${message}
			</div>
		`, renderTo);
		}
		isParentTaskGrouping() {
			return !main_core.Type.isArray(this.parentTasks);
		}
		existsTasksGroupedBySubTasks(response) {
			return !main_core.Type.isArray(response.parentTasks);
		}
		showElement(element) {
			main_core.Dom.style(element, 'display', 'block');
		}
		hideElement(element) {
			main_core.Dom.style(element, 'display', 'none');
		}
		createParentTaskKanbanNode(parentTaskData) {
			return main_core.Tag.render`
			<div class="tasks-scrum-parent-task-kanban">
				<div class="tasks-scrum-kanban-group-header" style="background-color: #eaeaea;">
					<div class="tasks-scrum-kanban-group-header-tick">
						<div class="ui-btn ui-btn-sm ui-btn-light ui-btn-icon-angle-up"></div>
					</div>
					<div class="tasks-scrum-kanban-group-header-name">
						<a href="${this.getTaskUrl(parentTaskData.id)}">${main_core.Text.encode(parentTaskData.name)}</a>
					</div>
					<div class="tasks-scrum-kanban-group-header-story-points" title="Story Points">
						${main_core.Text.encode(parentTaskData.storyPoints)}
					</div>
				</div>
				<div class="tasks-scrum-kanban-container"></div>
			</div>
		`;
		}
		adjustGroupHeadersWidth() {
			const groupHeaders = this.inputRenderTo.querySelectorAll('.tasks-scrum-kanban-group-header');
			groupHeaders.forEach(groupHeader => {
				main_core.Dom.style(groupHeader, 'width', this.kanbanHeader.getColumnsWidth());
			});
		}
		upGroupingVisibility(baseContainer) {
			const tickButtonNode = baseContainer.querySelector('.tasks-scrum-kanban-group-header-tick');
			const container = baseContainer.querySelector('.tasks-scrum-kanban-container');
			main_core.Dom.removeClass(tickButtonNode.firstElementChild, 'ui-btn-icon-angle-down');
			main_core.Dom.addClass(tickButtonNode.firstElementChild, 'ui-btn-icon-angle-up');
			this.showElement(container);
		}
		downGroupingVisibility(baseContainer) {
			const tickButtonNode = baseContainer.querySelector('.tasks-scrum-kanban-group-header-tick');
			const container = baseContainer.querySelector('.tasks-scrum-kanban-container');
			main_core.Dom.removeClass(tickButtonNode.firstElementChild, 'ui-btn-icon-angle-up');
			main_core.Dom.addClass(tickButtonNode.firstElementChild, 'ui-btn-icon-angle-down');
			this.hideElement(container);
		}
		toggleGroupingVisibility(baseContainer) {
			const tickButtonNode = baseContainer.querySelector('.tasks-scrum-kanban-group-header-tick');
			const container = baseContainer.querySelector('.tasks-scrum-kanban-container');
			main_core.Dom.toggleClass(tickButtonNode.firstElementChild, 'ui-btn-icon-angle-up');
			main_core.Dom.toggleClass(tickButtonNode.firstElementChild, 'ui-btn-icon-angle-down');
			if (main_core.Dom.style(container, 'display') !== 'none') {
				this.hideElement(container);
			} else {
				this.showElement(container);
			}
			const gridContainer = baseContainer.querySelector('.main-kanban-grid');
			gridContainer.scrollLeft = this.kanban.getGridContainer().scrollLeft;
		}
		onCompleteParentTask(kanban) {
			const container = kanban.getRenderToContainer().closest('.tasks-scrum-parent-task-kanban');
			this.setTextDecorationToParentTaskName(container);
		}
		onRenewParentTask(kanban) {
			const container = kanban.getRenderToContainer().closest('.tasks-scrum-parent-task-kanban');
			this.unsetTextDecorationToParentTaskName(container);
		}
		onProceedParentTask(kanban) {
			if (this.kanbanGroupedByParentTasks.has(kanban.getParentTaskId())) {
				this.removeParentTaskKanban(kanban);
				this.kanbanGroupedByParentTasks.delete(kanban.getParentTaskId());
			}
		}
		setTextDecorationToParentTaskName(kanbanNode) {
			const parentTaskNameNode = kanbanNode.querySelector('.tasks-scrum-kanban-group-header-name');
			main_core.Dom.style(parentTaskNameNode, 'text-decoration', 'line-through');
		}
		unsetTextDecorationToParentTaskName(kanbanNode) {
			const parentTaskNameNode = kanbanNode.querySelector('.tasks-scrum-kanban-group-header-name');
			main_core.Dom.style(parentTaskNameNode, 'text-decoration', null);
		}
		getTaskUrl(taskId) {
			return this.inputKanbanParams.pathToTask.replace('#task_id#', taskId);
		}
	}

	exports.KanbanManager = KanbanManager;

})(this.BX.Tasks.Scrum = this.BX.Tasks.Scrum || {}, BX.Event, BX, BX);
//# sourceMappingURL=script.js.map
