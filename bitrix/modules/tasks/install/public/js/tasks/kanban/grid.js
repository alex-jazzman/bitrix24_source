(function() {

"use strict";

BX.namespace("BX.Tasks.Kanban");

const KANBAN_ITEM_SELECTOR = ".main-kanban-item";
const KANBAN_COLUMN_SELECTOR = ".main-kanban-column";
const KANBAN_COLUMN_TITLE_SELECTOR = ".main-kanban-column-title";
const KANBAN_ADD_ITEM_BUTTON_SELECTOR = ".main-kanban-column-add-item-button";
const FOCUS_ZONE_MEMBER_SELECTOR = [
	KANBAN_ITEM_SELECTOR,
	KANBAN_COLUMN_TITLE_SELECTOR,
	KANBAN_ADD_ITEM_BUTTON_SELECTOR,
].join(", ");
const CARD_CONTROL_SELECTOR = [
	".tasks-kanban-item-title",
	".tasks-kanban-task-mute",
	".tasks-kanban-task-start",
	".tasks-kanban-task-complete",
	".tasks-kanban-item-tags button",
	".tasks-kanban-item-epic",
	"button.tasks-kanban-item-author-avatar",
	".tasks-kanban-item-pointer .ui-chip",
	".tasks-kanban-item-fields-item-value a",
	".tasks-kanban-item-move",
].join(", ");

function normalizedText(node)
{
	return (node.textContent || "").replace(/\s+/g, " ").trim();
}

/**
 * MAP-01: the closed list of controls a logical focus snapshot is able to name. Every entry of it
 * belongs to CARD_CONTROL_SELECTOR; a control outside the list lowers the accuracy of the snapshot
 * to the card container and is never matched approximately.
 * @type {Array<{kind: String, selector: String, stableKey: (Function|undefined)}>}
 */
const CARD_CONTROL_MAP = [
	{ kind: "title", selector: ".tasks-kanban-item-title" },
	{ kind: "mute", selector: ".tasks-kanban-task-mute" },
	{ kind: "start", selector: ".tasks-kanban-task-start" },
	{ kind: "complete", selector: ".tasks-kanban-task-complete" },
	{
		kind: "tag",
		selector: ".tasks-kanban-item-tags button",
		stableKey: (node) => normalizedText(node).replace(/^#/, ""),
	},
	{ kind: "epic", selector: ".tasks-kanban-item-epic" },
	{ kind: "author", selector: ".tasks-kanban-item-author button.tasks-kanban-item-author-avatar" },
	{
		kind: "responsible",
		selector: [
			".tasks-kanban-item-responsible button.tasks-kanban-item-author-avatar",
			".tasks-kanban-item-responsible-sprint button.tasks-kanban-item-author-avatar",
		].join(", "),
	},
	{ kind: "deadline", selector: ".tasks-kanban-item-pointer .ui-chip" },
	{
		kind: "fieldLink",
		selector: ".tasks-kanban-item-fields-item-value a",
		stableKey: (node) => (node.getAttribute("href") || "") + "\n" + normalizedText(node),
	},
	{ kind: "move", selector: ".tasks-kanban-item-move" },
];

const CARD_CONTROL_KIND = "card";
const MY_PLAN_COMPLETION_INTENT_APPROVE = "approve";
const MY_PLAN_COMPLETION_ACTION_APPROVE = "approveMyPlanTask";
const MY_PLAN_COMPLETION_ACTION_COMPLETE = "completeTask";

function setControlsTabIndex(card, value)
{
	card.querySelectorAll(CARD_CONTROL_SELECTOR).forEach((control) => {
		control.setAttribute("tabindex", value);
	});
}

function namedTitleContainer(column)
{
	const title = column.getTitleContainer();

	return (title.matches(KANBAN_COLUMN_TITLE_SELECTOR) ? title : null);
}

function setMembers(root)
{
	const nodes = Array.from(root.querySelectorAll(FOCUS_ZONE_MEMBER_SELECTOR));

	return nodes.filter((node) => BX.UI.Accessibility.InteractivityChecker.isFocusable(node));
}

function currentMember(zone, from)
{
	const member = (from ? from.closest(FOCUS_ZONE_MEMBER_SELECTOR) : null);

	return member || zone.getCurrentFocusedElement();
}

function orderedColumns(grid)
{
	return grid.getColumns().map((column) => column.getContainer());
}

function siblingColumnMember(grid, column, index, direction)
{
	const columns = orderedColumns(grid);
	const start = columns.indexOf(column);
	if (start === -1)
	{
		return null;
	}

	const step = (direction === "next" ? 1 : -1);

	for (let target = start + step; target >= 0 && target < columns.length; target += step)
	{
		const members = setMembers(columns[target]);
		if (members.length > 0)
		{
			return members[Math.min(index, members.length - 1)];
		}
	}

	return null;
}

/**
 * @param options
 * @extends {BX.Kanban.Grid}
 * @constructor
 */
BX.Tasks.Kanban.Grid = function(options)
{
	this.ownerId = Number(options.ownerId);
	this.groupId = Number(options.groupId);
	this.groupingMode = Boolean(options.isGroupingMode);
	this.isSprintView = (options.isSprintView === 'Y');
	this.isCollab = (options.isCollab === 'Y');
	this.networkEnabled = options.networkEnabled || false;
	this.currentUserId = Number(options.currentUserId) || 0;
	this.isNewUser = (options.isNewUser === true);

	this.gridHeader = Boolean(options.gridHeader);
	this.parentTaskId = parseInt(options.parentTaskId, 10);
	this.parentTaskName = options.parentTaskName;
	this.parentTaskCompleted = Boolean(options.parentTaskCompleted);

	this.neighborGrids = [];
	this.delayedQueueForChildGrid = {};
	this.isBindEvents = false;
	this.sortGeneration = 0;
	this.myPlanCompletions = new Map();
	this.filterGeneration = 0;
	this.focusZone = null;
	this.focusInHandler = null;
	this.activeCard = null;
	this.sourcePositions = new Map();
	this.boardHintAnnounced = false;
	this.pullBatch = null;

	BX.Kanban.Grid.apply(this, arguments);

	BX.addCustomEvent(this, "Kanban.Grid:onBeforeItemMoved", BX.delegate(this.onBeforeItemMoved, this));
	BX.addCustomEvent(this, "Kanban.Grid:onItemMoved", BX.delegate(this.onItemMoved, this));
	BX.addCustomEvent(this, "Kanban.Grid:onItemAddedAsync", BX.delegate(this.onItemAddedAsync, this));
	BX.addCustomEvent(this, "Kanban.Grid:onColumnMoved", BX.delegate(this.onColumnMoved, this));
	BX.addCustomEvent(this, "Kanban.Grid:onColumnUpdated", BX.delegate(this.onColumnUpdated, this));
	BX.addCustomEvent(this, "Kanban.Grid:onColumnLoadAsync", BX.delegate(this.onColumnLoadAsync, this));
	BX.addCustomEvent(this, "Kanban.Grid:onColumnRemovedAsync", BX.delegate(this.onColumnRemovedAsync, this));
	BX.addCustomEvent(this, "Kanban.Grid:onColumnAddedAsync", BX.delegate(this.onColumnAddedAsync, this));
	BX.addCustomEvent(this, "Kanban.Grid:onRender", BX.delegate(this.onRender, this));

	BX.addCustomEvent(this, "Kanban.Grid:onRender", BX.delegate(this.onGridRender, this));

	BX.addCustomEvent("BX.Main.Filter:apply", BX.delegate(this.onApplyFilter, this));
	BX.addCustomEvent("onTaskTimerChange", BX.delegate(this.onTaskTimerChange, this));
	BX.addCustomEvent("onTaskSortChanged", BX.delegate(this.onTaskSortChanged, this));

	BX.addCustomEvent(this, "Kanban.Grid:multiSelectModeOn", BX.delegate(this.startActionPanel, this));
	BX.addCustomEvent(this, "Kanban.Grid:multiSelectModeOff", BX.delegate(this.stopActionPanel, this));
	BX.addCustomEvent(this, "Kanban.Grid:selectItem", BX.delegate(this.setTotalSelectedItems, this));
	BX.addCustomEvent(this, "Kanban.Grid:unSelectItem", BX.delegate(this.setTotalSelectedItems, this));
	BX.addCustomEvent(this, "Kanban.Grid:onItemDragStart", BX.delegate(this.setKanbanDragMode, this));
	BX.addCustomEvent(this, "Kanban.Grid:onItemDragStop", BX.delegate(this.unSetKanbanDragMode, this));
	BX.addCustomEvent(this, "Kanban.Grid:onItemDragStart", BX.delegate(this.setKanbanRealtimeMode, this));
	BX.addCustomEvent(this, "Kanban.Grid:onItemDragStop", BX.delegate(this.unSetKanbanRealtimeMode, this));

	if (this.isScrumGrid())
	{
		BX.bind(this.getGridContainer(), 'scroll', BX.delegate(this.onGridScroll, this));
	}

	this.bindEvents();

	const isCompletedSprint = (
		this.isScrumGrid()
			? this.getData().params.IS_COMPLETED_SPRINT === 'Y'
			: false
	);
	if (!isCompletedSprint)
	{
		this.subscribeToPull();
	}
};

BX.Tasks.Kanban.Grid.prototype = {
	__proto__: BX.Kanban.Grid.prototype,
	constructor: BX.Tasks.Kanban.Grid,
	accessNotifyDialog: null,
	accessNotifyDialogCollab: null,

	/**
	 * Perform ajax query.
	 * @param {String} action
	 * @param {Object} data
	 * @returns {Promise}
	 */
	ajax: function(action, data)
	{
		const gridData = this.getData();

		data.params = gridData.params;

		if (gridData.kanbanType === "TL")
		{
			data.timeline = 'Y';
		}
		else
		{
			data.personal = data.params.PERSONAL;
		}
		if (data.groupAction === "Y")
		{
			data.groupMode = 'Y';
		}

		return BX.ajax.runComponentAction('bitrix:tasks.kanban', action, {
			mode: 'class',
			data: data,
		});
	},

	isMyPlanCompletionPending(taskId)
	{
		return this.myPlanCompletions.has(String(taskId));
	},

	setMyPlanCompletion(taskId, attempt)
	{
		if (attempt === null)
		{
			this.myPlanCompletions.delete(String(taskId));
		}
		else
		{
			this.myPlanCompletions.set(String(taskId), attempt);
		}

		const item = this.getItem(taskId);
		if (item && item.task_complete)
		{
			item.task_complete.disabled = attempt !== null;
		}
	},

	async completeMyPlanTask(taskId, columnId, intent)
	{
		if (this.isMyPlanCompletionPending(taskId))
		{
			return;
		}

		const attempt = { accepted: false, recoveryStarted: false };
		this.setMyPlanCompletion(taskId, attempt);
		const filterGeneration = this.filterGeneration;
		const sortGeneration = this.sortGeneration;
		try
		{
			const snapshot = await this.prepareMyPlanCompletion(taskId, intent);
			const hasDialog = snapshot.groups.length > 0;
			const { result, acceptedData } = await this.runMyPlanCompletion(
				taskId,
				columnId,
				intent,
				snapshot,
				attempt,
			);
			if (!attempt.accepted)
			{
				if (result.state === BX.Tasks.V2.Lib.CompletionStates.Returned)
				{
					const { TaskCard } = await BX.Runtime.loadExtension('tasks.v2.application.task-card');
					TaskCard.showFullCard({ taskId: Number(taskId) });
				}
				if (result.state === BX.Tasks.V2.Lib.CompletionStates.Failed)
				{
					throw result.error;
				}

				return;
			}

			if (!this.applyMyPlanCompletion(taskId, acceptedData, filterGeneration, sortGeneration))
			{
				await this.recoverMyPlanCompletion(taskId);

				return;
			}

			this.setMyPlanCompletion(taskId, null);
			if (hasDialog)
			{
				const itemData = acceptedData.item.data;
				const message = itemData.completed_supposedly
					? 'TASKS_KANBAN_COMPLETION_REVIEW'
					: (itemData.completed ? 'TASKS_KANBAN_COMPLETION_DONE' : 'TASKS_KANBAN_COMPLETION_SAVED')
				;
				BX.UI.Notification.Center.notify({ content: BX.message(message) });
			}
		}
		catch (error)
		{
			if (attempt.accepted)
			{
				await this.recoverMyPlanCompletion(taskId);
			}
			else
			{
				const message = error?.errors?.[0]?.message || error?.message;
				BX.Kanban.Utils.showErrorDialog(message || BX.message('TASKS_KANBAN_COMPLETION_FAILED'), true);
			}
		}
		finally
		{
			if (!attempt.accepted)
			{
				this.setMyPlanCompletion(taskId, null);
			}
		}
	},

	async prepareMyPlanCompletion(taskId, intent)
	{
		const emptySnapshot = { groups: [], incompleteIds: [], firstIncompleteId: null };
		if (intent === MY_PLAN_COMPLETION_INTENT_APPROVE)
		{
			return emptySnapshot;
		}

		const preparation = await this.ajax('prepareMyPlanTaskCompletion', { taskId });
		const data = this.getMyPlanCompletionData(preparation);

		return data.snapshot || emptySnapshot;
	},

	async runMyPlanCompletion(taskId, columnId, intent, snapshot, attempt)
	{
		let acceptedData = null;
		const complete = async () => {
			const action = intent === MY_PLAN_COMPLETION_INTENT_APPROVE
				? MY_PLAN_COMPLETION_ACTION_APPROVE
				: MY_PLAN_COMPLETION_ACTION_COMPLETE;
			const payload = { taskId, columnId };
			if (intent !== MY_PLAN_COMPLETION_INTENT_APPROVE)
			{
				payload.completeChecklist = true;
			}

			const response = await this.ajax(action, payload);
			const result = this.getMyPlanCompletionData(response);
			if (result.operationAccepted !== true)
			{
				throw new Error(BX.message('TASKS_KANBAN_COMPLETION_FAILED'));
			}

			acceptedData = result;
			attempt.accepted = true;

			return null;
		};

		const result = await BX.Tasks.V2.Lib.checkListCompletionPromptRunner.run(snapshot, {
			complete,
			completeWithChecklist: complete,
		});

		return { result, acceptedData };
	},

	applyMyPlanCompletion(taskId, acceptedData, filterGeneration, sortGeneration)
	{
		try
		{
			return acceptedData.item !== null
				&& filterGeneration === this.filterGeneration
				&& sortGeneration === this.sortGeneration
				&& Boolean(this.getItem(taskId))
				&& Boolean(this.getColumn(acceptedData.item.columnId))
				&& this.updateItem(taskId, acceptedData.item) !== false
			;
		}
		catch (error)
		{
			return false;
		}
	},

	getMyPlanCompletionData(response)
	{
		if (response?.errors?.length > 0)
		{
			throw response.errors[0];
		}
		if (response?.status !== 'success' || !BX.Type.isPlainObject(response.data))
		{
			throw new Error(BX.message('TASKS_KANBAN_COMPLETION_FAILED'));
		}

		return response.data;
	},

	async recoverMyPlanCompletion(taskId)
	{
		const attempt = this.myPlanCompletions.get(String(taskId));
		if (!attempt || attempt.recoveryStarted)
		{
			return;
		}

		attempt.recoveryStarted = true;
		const notification = BX.UI.Notification.Center.notify({
			content: BX.message('TASKS_KANBAN_COMPLETION_REFRESHING'),
			autoHide: false,
			closeButton: false,
		});
		try
		{
			await this.refreshMyPlanCompletionBoard();
			this.setMyPlanCompletion(taskId, null);
		}
		catch (error)
		{
			BX.UI.Notification.Center.notify({
				content: BX.message('TASKS_KANBAN_COMPLETION_REFRESH_FAILED'),
				autoHide: false,
				closeButton: false,
				actions: [{
					title: BX.message('TASKS_KANBAN_COMPLETION_RELOAD'),
					events: { click: () => window.location.reload() },
				}],
			});
		}
		finally
		{
			notification.close();
		}
	},

	async refreshMyPlanCompletionBoard()
	{
		const reloaded = new BX.Promise();
		this.onApplyFilter(null, null, null, reloaded);
		await reloaded;
	},

	/**
	 * Bind some events.
	 * @returns {void}
	 */
	bindEvents: function() {
		if (!this.isBindEvents && !this.isScrumGrid()) {
			BX.Event.EventEmitter.subscribe('tasks-kanban-settings-fields-view', function ()
			{
				this.showFieldsSelectPopup();
			}.bind(this));
			this.isBindEvents = true;
		}
	},

	subscribeToPull()
	{
		new BX.Pull.QueueManager({
			moduleId: 'tasks',
			userId: this.ownerId,
			config: {
				loadItemsDelay: 500,
			},
			additionalData: {},
			events: {
				onBeforePull: (event) => {
					if (this.isScrumGridHeader())
					{
						event.preventDefault();
					}

					const { pullData: { command, params } } = event.data;

					const pullHandlers = {
						comment_read_all: this.onPullCommentReadAll,
						tag_changed: this.onPullTagChanged,
					};
					if (pullHandlers[command])
					{
						pullHandlers[command].apply(this, [params]);
					}
				},
				onPull: (event) => {
					const { pullData: { command, params }, promises } = event.data;

					const taskId = this.resolveIdByEventParams(command, params);
					if (taskId > 0)
					{
						promises.push(
							Promise.resolve({
								data: {
									id: taskId,
									action: command,
									actionParams: params,
								},
							}),
						);
					}
				},
			},
			callbacks: {
				onBeforeQueueExecute: (items) => {
					return Promise.resolve();
				},
				onQueueExecute: (items) => {
					return new Promise((resolve, reject) => {
						this.getPullTasksData(this.getPullTaskIds(items))
							.then((tasksData) => {
								this.executePullQueue(this.getPullItems(items, tasksData))
									.then(() => {
										resolve();
									})
									.catch((error) => {
										reject(error);
									})
								;
							})
							.catch((error) => {
								reject(error);
							})
						;
					});
				},
				onReload: () => {},
			},
		});
	},

	resolveIdByEventParams(command, params)
	{
		const actions = [
			'comment_add',
			'stage_change',
			'task_add',
			'task_update',
			'task_view',
			'task_remove',
			'task_timer_start',
			'task_timer_stop',
		];

		if (actions.includes(command))
		{
			const taskId = this.recognizeTaskId(params);
			if (taskId > 0)
			{
				return taskId;
			}

			throw new Error(`taskId is not resolved for command: ${command}`);

		}

		return 0;
	},

	getPullTaskIds(items)
	{
		const taskIds = [];

		items.forEach((item) => {
			taskIds.push(item.id);
		});

		return taskIds;
	},

	getPullTasksData(taskIds)
	{
		return new Promise((resolve, reject) => {
			// eslint-disable-next-line promise/catch-or-return
			BX.ajax.runAction('tasks.task.list', {
				data: {
					filter: { ID: taskIds },
					params: {
						RETURN_ACCESS: 'Y',
						SIFT_THROUGH_FILTER: {
							sprintKanban: (this.isScrumGrid() ? 'Y' : 'N'),
							isCompletedSprint: (this.isScrumGrid()
								? (this.getData().params.IS_COMPLETED_SPRINT)
								: 'N'
							),
							userId: this.ownerId,
							groupId: this.groupId,
						},
					},
					start: -1,
				},
			})
				.then((response) => {
					const taskIdsToRequest = [];
					if (response.data.tasks.length > 0)
					{
						response.data.tasks.forEach((taskData) => {
							taskIdsToRequest.push(parseInt(taskData.id, 10));
						});
					}

					// eslint-disable-next-line promise/catch-or-return
					this.ajax('refreshListTasks', {
						taskIds: taskIdsToRequest,
						isScrum: this.isScrumGrid() ? 'Y' : 'N',
						parentId: this.getParentTaskId(),
					}).then(
						(response) => {
							const data = response.data;

							const tasksData = new Map();

							if (BX.type.isArray(data))
							{
								data.forEach((taskData) => {
									tasksData.set(parseInt(taskData.id, 10), taskData);
								});
							}

							taskIds.forEach((taskId) => {
								if (!tasksData.has(taskId))
								{
									tasksData.set(taskId, null);
								}
							});

							resolve(tasksData);
						},
						(error) => {
							reject(error);
						},
					);
				})
				.catch((error) => {
					reject(error);
				})
			;
		});
	},

	/**
	 * Applies a batch of realtime updates to the board. The batch is also the unit of the
	 * announcement policy, see announcePullUpdate.
	 * @param {Array} pullItems
	 * @returns {Promise}
	 */
	executePullQueue(pullItems)
	{
		const pullHandlers = {
			comment_add: this.onPullCommentAdd,
			stage_change: this.onPullStageChange,
			task_add: this.onPullTaskAdd,
			task_update: this.onPullTaskUpdate,
			task_view: this.onPullTaskView,
			task_remove: this.onPullTaskRemove,
			task_timer_start: this.onPullTimerStart,
			task_timer_stop: this.onPullTimerStop,
		};

		return new Promise((resolve, reject) => {
			this.pullBatch = { updateAnnounced: false };

			try
			{
				pullItems.forEach((pullItem) => {
					const { data: { action, actionParams, id }, taskData } = pullItem;

					if (pullHandlers[action])
					{
						pullHandlers[action].apply(
							this,
							[actionParams, id, taskData],
						);
					}
				});
			}
			finally
			{
				this.pullBatch = null;
			}

			resolve();
		});
	},

	getPullItems(items, tasksData)
	{
		const pullItems = [];

		items.forEach((item) => {
			pullItems.push({
				...item,
				...{
					taskData: tasksData.get(item.data.id),
				},
			});
		});

		return pullItems;
	},

	/**
	 * Show popup for selecting fields which must show in view.
	 */
	showFieldsSelectPopup: function()
	{
		const gridData = this.getData();
		const checkboxListPopup = new BX.UI.CheckboxList({
			columnCount: 3,
			lang: {
				title: gridData.customSectionsFields.title,
			},
			sections: gridData.customSectionsFields.sections,
			categories: gridData.customSectionsFields.categories,
			options: gridData.customSectionsFields.options,
			events: {
				onApply: (event) => {
					this.ajax('saveUserSelectedFields', {
						fields: event.data.fields,
					})
						.then(() => {
							if (this.isScrumGrid())
							{
								BX.Tasks.Scrum.Kanban.onApplyFilter();
							}
							else
							{
								this.onApplyFilter();
							}
						});
				},
			},
		});
		checkboxListPopup.show();
	},

	/**
	 * Returns true, if Kanban in realtime work mode.
	 * @return {boolean}
	 */
	isRealtimeMode: function()
	{
		return this.data.newTaskOrder === "actual";
	},

	/**
	 * Returns true, if Kanban is sorted by a task field.
	 * @return {boolean}
	 */
	isFieldSortMode: function()
	{
		return this.data.newTaskOrder === "field";
	},

	getGroupId: function()
	{
		return this.groupId;
	},

	/**
	 * Show popup for request access.
	 * @returns {void}
	 */
	accessNotify: function()
	{
		if (
			typeof BX.Intranet !== "undefined" &&
			typeof BX.Intranet.NotifyDialog !== "undefined"
		)
		{
			if (this.isCollab)
			{
				if (this.accessNotifyDialogCollab === null)
				{
					this.accessNotifyDialogCollab = new BX.Main.Popup({
						closeIcon: true,
						titleBar: BX.message("TASKS_KANBAN_COLLAB_NOTIFY_HEADER"),
						content: BX.message("TASKS_KANBAN_COLLAB_NOTIFY_TEXT"),
						cacheable: true,
						buttons: [
							new BX.UI.Button({
								text: BX.message("TASKS_KANBAN_COLLAB_NOTIFY_BUTTON"),
								color: BX.UI.Button.Color.LIGHT_BORDER,
								onclick: () => {
									this.accessNotifyDialogCollab.close();
								},
							}),
						],
					});
				}
				this.accessNotifyDialogCollab.show();
			}
			else
			{
				if (this.accessNotifyDialog === null)
				{
					this.accessNotifyDialog = new BX.Intranet.NotifyDialog({
						listUserData: this.getData().admins,
						notificationHandlerUrl: BX.Uri.addParam(this.getAjaxHandlerPath(), {
							action: 'notifyAdmin',
						}),
						popupTexts: {
							sendButton: BX.message("TASKS_KANBAN_NOTIFY_BUTTON"),
							title: BX.message("TASKS_KANBAN_NOTIFY_TITLE"),
							header: BX.message("TASKS_KANBAN_NOTIFY_HEADER"),
							description: BX.message("TASKS_KANBAN_NOTIFY_TEXT")
						}
					});
				}
				this.accessNotifyDialog.show();
			}
		}
	},

	renderLayout: function()
	{
		BX.Kanban.Grid.prototype.renderLayout.apply(this, arguments);

		var outerContainer = this.getOuterContainer();

		outerContainer.setAttribute("role", "group");
		outerContainer.setAttribute("aria-label", BX.message("TASKS_KANBAN_A11Y_BOARD_LABEL"));
		outerContainer.setAttribute("tabindex", "-1");
		outerContainer.setAttribute("data-testid", "tasks-kanban-board");

		this.activateFocusZone();

		if (this.isScrumGridHeader())
		{
			this.observeScrumGridHeader();
		}
	},

	activateFocusZone: function()
	{
		if (this.focusZone === null)
		{
			const outerContainer = this.getOuterContainer();

			this.focusZone = new BX.UI.Accessibility.FocusZone(outerContainer, {
				focusOutBehavior: "stop",
				focusInStrategy: "previous",
				focusableElementFilter: (element) => element.matches(FOCUS_ZONE_MEMBER_SELECTOR),
				getNextFocusable: this.getNextFocusable.bind(this),
			});

			this.focusInHandler = this.onFocusIn.bind(this);
			BX.bind(outerContainer, "focusin", this.focusInHandler);
		}

		this.focusZone.activate();
	},

	deactivateFocusZone: function()
	{
		if (this.focusZone === null)
		{
			return;
		}

		this.focusZone.deactivate();
		BX.unbind(this.getOuterContainer(), "focusin", this.focusInHandler);

		this.focusZone = null;
		this.focusInHandler = null;
		this.activeCard = null;
	},

	getNextFocusable: function(direction, from, event)
	{
		const current = currentMember(this.focusZone, from);
		if (!current)
		{
			return null;
		}

		const column = current.closest(KANBAN_COLUMN_SELECTOR);
		if (!column)
		{
			return current;
		}

		const members = setMembers(column);
		const index = members.indexOf(current);
		if (index === -1)
		{
			return current;
		}

		if (direction === "start" || direction === "end")
		{
			return direction === "start" ? members[0] : members[members.length - 1];
		}

		if (event.key === "ArrowUp" || event.key === "ArrowDown")
		{
			return members[index + (direction === "next" ? 1 : -1)] || current;
		}

		return siblingColumnMember(this, column, index, direction) || current;
	},

	onFocusIn: function(event)
	{
		const card = event.target.closest(KANBAN_ITEM_SELECTOR);
		if (card !== this.activeCard)
		{
			if (this.activeCard)
			{
				setControlsTabIndex(this.activeCard, "-1");
			}

			this.activeCard = card;

			if (card)
			{
				setControlsTabIndex(card, "0");
			}
		}

		// the hint is told on any first entrance, including the one that lands on a column title
		// and leaves the active card as it was
		this.announceBoardHint();
	},

	/**
	 * Tells the way around the board once per grid, on the first entrance of the focus: the move
	 * command lives behind Tab inside a card and stays invisible until the focus reaches it. The
	 * hint is deliberately kept out of the accessible name of a card, where it would be read on
	 * each of the hundreds of cards of the board.
	 * @returns {void}
	 */
	announceBoardHint: function()
	{
		if (this.boardHintAnnounced)
		{
			return;
		}

		this.boardHintAnnounced = true;

		this.announce(BX.message("TASKS_KANBAN_A11Y_BOARD_HINT"), "polite");
	},

	restoreCardControlsTabIndex: function(item)
	{
		if (this.activeCard !== null && item.getContainer() === this.activeCard)
		{
			setControlsTabIndex(this.activeCard, "0");
		}
	},

	isFocusInsideBoard: function()
	{
		const active = document.activeElement;

		return (active !== null && this.getOuterContainer().contains(active));
	},

	/**
	 * Tells whether the card is the one the user is standing on. Must be read before the change is
	 * applied: re-attaching a card drops the focus to the body. The draft card of the quick task is
	 * not a task and never speaks, hence the type check.
	 * @param {BX.Kanban.Item|null} item
	 * @returns {Boolean}
	 */
	isCardUnderFocus: function(item)
	{
		return (item instanceof BX.Tasks.Kanban.Item && item.holdsFocus());
	},

	/**
	 * Where focus goes when a card is removed. Must be called before the node leaves the DOM: the
	 * column re-renders as a whole, so every card of it is detached and re-attached, which drops
	 * focus to the body even when the removed card is not the focused one.
	 * @param {BX.Kanban.Item|null} item
	 * @returns {HTMLElement|null}
	 */
	getFocusTargetForRemovedItem: function(item)
	{
		if (!item || !this.isFocusInsideBoard())
		{
			return null;
		}

		const focusedNode = document.activeElement;
		const focusedCard = focusedNode.closest(KANBAN_ITEM_SELECTOR);
		if (focusedCard === null || this.getItemByElement(focusedCard) !== item)
		{
			return focusedNode;
		}

		const column = item.getColumn();
		const sibling = column.getNextItemSibling(item) || column.getPreviousItemSibling(item);

		if (sibling)
		{
			return sibling.getContainer();
		}

		return namedTitleContainer(column) || this.getOuterContainer();
	},

	/**
	 * Hook on item drag start.
	 * @param {Object} item
	 * @returns {void}
	 */
	onItemDragStart: function(item)
	{
		this.setDragMode(BX.Kanban.DragMode.ITEM);

		var gridData = this.getData();
		var itemData = item.getData();

		if (gridData.kanbanType === "TL")
		{
			BX.Kanban.Grid.prototype.onItemDragStart.apply(this, arguments);
			// disable another columns
			this.getColumns().forEach(function(/*BX.Kanban.Column*/column) {
				if (!column.canAddItems())
				{
					column.disableDropping();
				}
				else if (
					!itemData.allow_change_deadline &&
					column.getId() !== item.getColumn().getId()
				)
				{
					column.disableDropping();
				}
			});
			// disable another items
			var items = this.getItems();
			for (var itemId in items)
			{
				if (items[itemId].getColumn().getId() !== item.getColumn().getId())
				{
					if (
						!itemData.allow_change_deadline ||
						!items[itemId].getColumn().canAddItems()
					)
					{
						items[itemId].disableDropping();
					}
				}
			}
			if (!itemData.allow_change_deadline)
			{
				item.getDragElement().appendChild(this.createAlertBlock(
					BX.message("TASKS_KANBAN_ME_DISABLE_DEADLINE_PART2")
				));
			}
			return;
		}

		if (!gridData.rights.canSortItem)
		{
			return;
		}

		BX.Kanban.Grid.prototype.onItemDragStart.apply(this, arguments);
	},

	createAlertBlock: function (message)
	{

		return BX.create("div", {
			props: {
				className: "tasks-kanban-item-alert"
			},
			text: message
		});

	},

	/**
	 * Add item to the column in order.
	 * @param {Object} data
	 * @returns {void}
	 */
	addItemOrder: function(data)
	{
		var gridData = this.getData();
		var columnOne = null;
		var columnItems = [];

		// get columnId
		if (!data.columnId && data.columns)
		{
			for (var i = 0, c = data.columns.length; i < c; i++)
			{
				columnOne = this.getColumn(data.columns[i]);
				if (columnOne)
				{
					data.columnId = columnOne.getId();
				}
			}
		}
		if (!data.columnId)
		{
			columnOne = this.getColumns()[0];
			data.columnId = columnOne.getId();
		}
		if (data.columnId && !columnOne)
		{
			columnOne = this.getColumn(data.columnId);
			if (!columnOne)
			{
				columnOne = this.getColumns()[0];
				data.columnId = columnOne.getId();
			}
		}
		if (columnOne)
		{
			columnItems = columnOne.getItems();
		}

		if (this.isFieldSortMode())
		{
			this.addItemInSortOrder(data, columnOne, columnItems);
		}
		else if (
			gridData.newTaskOrder === "desc" || // new task - in top
			this.isRealtimeMode()// realtime kanban
		)
		{
			// for realtime mode we try to find place by actual date
			if (this.isRealtimeMode() && columnItems.length > 0)
			{
				if (typeof data.data["date_activity_ts"] !== "undefined")
				{
					var activityTS = data.data["date_activity_ts"];
					if (activityTS > 0)
					{
						for (var i = 0, c = columnItems.length; i < c; i++)
						{
							if (
								data.id !== columnItems[i].getId() &&
								columnItems[i].data["date_activity_ts"] < activityTS
							)
							{
								data.targetId = columnItems[i].getId();
								break;
							}
						}
					}
				}
			}
			// get first item in column
			else if (columnItems.length > 0)
			{
				data.targetId = columnItems[0].getId();
				if (data.targetId === data.id && columnItems[1])
				{
					data.targetId = columnItems[1].getId();
				}
			}

			if (
				this.isRealtimeMode()
				&& this.getItem(data.id)
				&& columnOne
				&& !columnOne.getDraftItem()
			)
			{
				this.updateItem(data.id, data, true);
				if (data.targetId)
				{
					this.moveItem(data.id, data.columnId, data.targetId);
				}
			}
			else
			{
				this.addItem(data);
			}
		}
		// new task - in bottom (only if not exist next page)
		else if (columnOne && columnItems.length >= columnOne.total)
		{
			this.addItem(data);
		}
	},

	/**
	 * Put the item to its place among the loaded items of the column by the value of the sort axis.
	 * @param {Object} data
	 * @param {BX.Kanban.Column} column
	 * @param {BX.Kanban.Item[]} columnItems
	 * @returns {void}
	 */
	addItemInSortOrder: function(data, column, columnItems)
	{
		if (!column)
		{
			return;
		}

		var draftItem = column.getDraftItem();
		// the draft of the inline creation is not a card: it has no value of the axis and is out of the total
		var sortableItems = columnItems.filter(function(columnItem) {
			return (columnItem !== draftItem);
		});

		var isItemUpdate = Boolean(this.getItem(data.id));
		// unknown task joins the column only when there is no next page to keep it out of order
		// getTotal() is not used: with no total set it answers the loaded count, hiding the unloaded tail
		if (!isItemUpdate && sortableItems.length < column.total)
		{
			return;
		}

		var gridData = this.getData();
		// the value is comparable only while it is calculated for the axis the kanban is sorted by
		var isSortValueActual = (
			Boolean(BX.Tasks.KanbanSortComparator)
			&& data.data["sort_field"] === gridData.sortField
		);
		if (isSortValueActual)
		{
			data.targetId = BX.Tasks.KanbanSortComparator.findTargetId(
				sortableItems,
				data,
				gridData.sortDirection
			);
		}

		if (!isItemUpdate)
		{
			this.addItem(data);

			return;
		}

		this.updateItem(data.id, data, true);
		// null target means the end of the loaded part
		if (isSortValueActual && !this.isItemPlacedBefore(data.id, column, data.targetId))
		{
			this.moveItem(data.id, data.columnId, data.targetId);
		}
	},

	/**
	 * Checks the item already stands right before the target one, or last in the column when there is no target.
	 * @param {number|string} itemId
	 * @param {BX.Kanban.Column} column
	 * @param {number|string|null} targetId
	 * @returns {boolean}
	 */
	isItemPlacedBefore: function(itemId, column, targetId)
	{
		var item = this.getItem(itemId);
		if (!item || item.getColumn() !== column)
		{
			return false;
		}

		var items = column.getItems();
		var nextItem = items[items.indexOf(item) + 1] || null;

		return (nextItem === this.getItem(targetId));
	},

	/**
	 * Move the just created task from the place of the draft to its place by the value of the sort axis.
	 * Unlike a task coming with a pull event, the created one stays in the column even when the next page is not loaded.
	 * @param {Object} data
	 * @returns {void}
	 */
	placeAddedTaskInSortOrder: function(data)
	{
		var column = this.getColumn(data.columnId);
		var gridData = this.getData();
		// the value is comparable only while it is calculated for the axis the kanban is sorted by
		if (
			!column
			|| !BX.Tasks.KanbanSortComparator
			|| data.data["sort_field"] !== gridData.sortField
		)
		{
			return;
		}

		var draftItem = column.getDraftItem();
		var columnItems = column.getItems().filter(function(columnItem) {
			return (columnItem !== draftItem);
		});

		// null target means the end of the loaded part
		var targetId = BX.Tasks.KanbanSortComparator.findTargetId(columnItems, data, gridData.sortDirection);
		if (!this.isItemPlacedBefore(data.id, column, targetId))
		{
			this.moveItem(data.id, data.columnId, targetId);
		}
	},

	updateItemState(taskId, taskData)
	{
		if (taskData)
		{
			this.addItemOrder(taskData);
		}
		else
		{
			if (this.hasItem(taskId))
			{
				this.removeItem(taskId);
			}
		}
	},

	/**
	 * System update item.
	 * @param {Object} item
	 * @param {Object} options
	 * @param {Boolean} notDestroy
	 * @returns {void}
	 */
	updateItem: function(item, options, notDestroy)
	{
		if (
			notDestroy !== true
			&& BX.SidePanel
			&& BX.SidePanel.Instance
			&& BX.SidePanel.Instance.destroy
			&& this.getItem(item)
		)
		{
			var url = this.getItem(item).getTaskUrl(item);
			BX.SidePanel.Instance.destroy(url);
		}

		const updatedItem = this.getItem(item);
		const focusedBeforeUpdate = this.isCardUnderFocus(updatedItem);

		BX.Kanban.Grid.prototype.updateItem.apply(this, arguments);

		if (updatedItem)
		{
			this.restoreCardControlsTabIndex(updatedItem);
		}

		if (focusedBeforeUpdate)
		{
			this.announcePullUpdate(updatedItem);
		}
	},

	removeItem: function(itemId)
	{
		const removedItem = this.getItem(itemId);
		const focusedBeforeRemoval = this.isCardUnderFocus(removedItem);
		const pendingFocus = this.getFocusTargetForRemovedItem(removedItem);

		var item = BX.Kanban.Grid.prototype.removeItem.apply(this, arguments);

		if (pendingFocus)
		{
			pendingFocus.focus();
		}

		if (pendingFocus && focusedBeforeRemoval)
		{
			this.announceItemRemoval(removedItem, pendingFocus);
		}

		BX.onCustomEvent(this, 'Kanban.Grid:onItemRemoved', {itemId: itemId});

		return item;
	},

	/**
	 * Event Handler must add a promise to the 'promises' collection.
	 * @param {Array} promises
	 * @returns {void}
	 */
	onItemAddedAsync: function(promises)
	{
		promises.push(BX.delegate(this.addTask, this));
	},

	/**
	 * Event Handler must add a promise to the 'promises' collection.
	 * @param {Array} promises
	 * @returns {void}
	 */
	onColumnLoadAsync: function(promises)
	{
		promises.push(BX.delegate(this.getColumnItems, this));
	},

	/**
	 * Event Handler must add a promise to the 'promises' collection.
	 * @param {Array} promises
	 * @returns {void}
	 */
	onColumnRemovedAsync: function(promises)
	{
		promises.push(BX.delegate(this.removeStage, this));
	},

	/**
	 * Event Handler must add a promise to the 'promises' collection.
	 * @param {Array} promises
	 * @returns {void}
	 */
	onColumnAddedAsync: function(promises)
	{
		promises.push(BX.delegate(this.addStage, this));
	},

	/**
	 * Event handler on first render.
	 * @param {BX.Kanban.Grid} grid Current grid.
	 * @returns {void}
	 */
	onRender: function(grid)
	{
		var gridData = grid.getData();

		if (
			grid.firstRenderComplete ||
			gridData["kanbanType"] !== "TL"
		)
		{
			return;
		}

		if (gridData["setClientDate"] === true)
		{
			var promise = new BX.Promise();
			this.fadeOut();

			this.ajax('setClientDate', {
				clientDate: gridData["clientDate"],
				clientTime: gridData["clientTime"]
			}).then(
				(response) => {
					this.removeItems();
					this.loadData(response.data);
					promise.fulfill();
					this.fadeIn();
				}
			);
		}
	},

	/**
	 * Get items from one column.
	 * @param {BX.Kanban.Column} column
	 * @returns {BX.Promise}
	 */
	getColumnItems: function(column)
	{
		const promise = new BX.Promise();

		if (this.isChildScrumGrid())
		{
			promise.fulfill([]);

			return promise;
		}

		const sortGeneration = this.sortGeneration;

		this.ajax('getColumnItems', {
			pageId: column.getPagination().getPage() + 1,
			columnId: column.getId()
		}).then(
			(response) => {
				// the page was requested for the order left behind, its items would break the current one
				if (sortGeneration !== this.sortGeneration)
				{
					promise.fulfill([]);

					return;
				}

				const data = response.data;
				const error = response.errors.pop();

				if (data && (BX.type.isArray(data) || BX.type.isArray(data.items)) && !error)
				{
					promise.fulfill(BX.type.isArray(data) ? data : data.items);
				}
				else if (data)
				{
					BX.Kanban.Utils.showErrorDialog(error.message, true);
					promise.reject(error);
				}
			},
			(response) => {
				// the page was requested for the order left behind, its failure concerns nobody now
				if (sortGeneration !== this.sortGeneration)
				{
					promise.fulfill([]);

					return;
				}

				const error = response.errors.pop().message;
				BX.Kanban.Utils.showErrorDialog(error, true);
				promise.reject("Error: " + error);
			},
		);

		return promise;
	},

	/**
	 * Remove one column (stage).
	 * @param {BX.Kanban.Column} column
	 * @returns {BX.Promise}
	 */
	removeStage: function(column)
	{
		const promise = new BX.Promise();

		this.ajax('modifyColumn', {
			fields: {
				id: column.getId(),
				delete: 1
			}
		}).then(
			(response) => {
				const data = response.data;
				const error = response.errors.pop();
				if (!error)
				{
					this.actionPanel = null;
					promise.fulfill(data);
				}
				else
				{
					promise.reject(error);
				}
			},
			(response) => {
				const error = response.errors.pop().message;
				BX.Kanban.Utils.showErrorDialog(error, true);
				promise.reject("Error: " + error);
			},
		);

		return promise;
	},

	/**
	 * Add new column (stage).
	 * @param {BX.Kanban.Column} column
	 * @returns {BX.Promise}
	 */
	addStage: function(column)
	{
		var promise = new BX.Promise();
		var targetColumn = this.getPreviousColumnSibling(column);
		var targetColumnId = targetColumn ? targetColumn.getId() : 0;

		this.ajax('modifyColumn', {
			fields: {
				columnName: column.getName(),
				columnColor: column.getColor(),
				afterColumnId: targetColumnId
			}
		}).then(
			(response) => {
				const data = response.data;
				const error = response.errors.pop();
				if (!error)
				{
					this.actionPanel = null;
					promise.fulfill(data);
				}
				else
				{
					BX.Kanban.Utils.showErrorDialog(error.message, true);
					promise.reject(error);
				}
			},
			(response) => {
				const error = response.errors.pop().message;
				BX.Kanban.Utils.showErrorDialog(error, true);
				promise.reject("Error: " + error);
			},
		);

		return promise;
	},

	/**
	 *
	 * @param {object} options
	 * @param {string|number} options.id
	 * @param {string|number} options.columnId
	 * @param {string} [options.type]
	 * @param {string|number} [options.targetId]
	 * @returns {BX.Kanban.Item|null}
	 */
	addItem: function(options)
	{
		if (this.isScrumGrid())
		{
			var itemType = this.getItemType(options.type);
			var item = new itemType(options);
			if (!(item instanceof BX.Kanban.Item))
			{
				throw new Error("Item type must be an instance of BX.Kanban.Item");
			}

			if (this.isChildScrumGrid())
			{
				if ((item instanceof BX.Tasks.Kanban.Item) && item.isCompleted() === false)
				{
					BX.onCustomEvent(this, 'Kanban.Grid:onAddItemInProgress');
				}

				return BX.Kanban.Grid.prototype.addItem.apply(this, arguments);
			}

			options = options || {};
			var column = this.getColumn(options.columnId), existGrid;
			if (!column)
			{
				return null;
			}

			if (options.hasOwnProperty('isSubTask') && options.isSubTask)
			{
				existGrid = false;
				this.getNeighborGrids()
					.forEach(function(neighborGrid) {
						if (!neighborGrid.isScrumGridHeader())
						{
							if (neighborGrid.isChildTask(options['parentId']))
							{
								neighborGrid.addItem(options);
								delete this.delayedQueueForChildGrid[options['id']];
								existGrid = true;
							}
						}
					}.bind(this))
				;
				if (!existGrid)
				{
					this.delayedQueueForChildGrid[options['id']] = options;
				}
			}
			else if (options.hasOwnProperty('isParentTask') && options.isParentTask)
			{
				if (options.hasOwnProperty('isVisibilitySubtasks') && options.isVisibilitySubtasks === 'N')
				{
					return BX.Kanban.Grid.prototype.addItem.apply(this, arguments);
				}

				existGrid = false;
				this.getNeighborGrids()
					.forEach(function(neighborGrid) {
						if (!neighborGrid.isScrumGridHeader())
						{
							if (neighborGrid.isParentTask(options['id']))
							{
								existGrid = true;
							}
						}
					}.bind(this))
				;
				if (!existGrid)
				{
					var columns = [];
					this.getColumns()
						.forEach(function(column) {
							columns.push({
								id: column.getId(),
								name: column.getName(),
								color: column.getColor(),
								total: column.getTotal()
							});
						}.bind(this))
					;

					BX.onCustomEvent(this, 'Kanban.Grid:onAddParentTask', {
						id: options.id,
						name: options.data.name,
						completed: options.data.completed ? 'Y' : 'N',
						storyPoints: options.data.storyPoints,
						columnId: options.columnId,
						columns: columns,
						items: []
					});
				}
			}
			else
			{
				return BX.Kanban.Grid.prototype.addItem.apply(this, arguments);
			}
		}
		else
		{
			return BX.Kanban.Grid.prototype.addItem.apply(this, arguments);
		}
	},

	addItemsFromQueue: function()
	{
		Object.values(this.delayedQueueForChildGrid)
			.forEach(function (options) {
				this.addItem(options);
			}.bind(this))
		;
	},

	/**
	 * Add new task.
	 * @param {BX.Kanban.Item} item
	 * @returns {BX.Promise}
	 */
	addTask: function(item)
	{
		const promise = new BX.Promise();
		const nextItem = item.getColumn().getNextItemSibling(item);
		const gridData = this.getData();

		this.ajax('addTask', {
			taskName: item.getData().title,
			columnId: item.getColumn().getId(),
			parentTaskId: this.parentTaskId,
			beforeItemId: (gridData.newTaskOrder === "desc" && nextItem) ? nextItem.getId() : 0
		}).then(
			(response) => {
				const data = response.data;
				const error = response.errors.pop();
				if (data && !error)
				{
					this.analytics('task_create', 'quick_button', 'success');
					// fulfill renders the card in place of the draft, the sort axis owns that place instead
					promise.fulfill(data);
					if (this.isGroupingMode())
					{
						this.resyncBoard({
							queueAfterCurrent: true,
							allowStaleChild: this.isChildScrumGrid(),
							onlyAfterCurrent: !this.isChildScrumGrid(),
						});
					}
					if (this.isFieldSortMode())
					{
						this.placeAddedTaskInSortOrder(data);
					}
				}
				else if (error)
				{
					BX.Kanban.Utils.showErrorDialog(error.message, true);
					this.analytics('task_create', 'quick_button', 'error');
					promise.reject(error.message);
				}
			},
			(response) => {
				const error = response.errors.pop().message;

				BX.Kanban.Utils.showErrorDialog(error, true);
				this.analytics('task_create', 'quick_button', 'error');
				promise.reject("Error: " + error);
			},
		);

		return promise;
	},

	/**
	 * Hook before item moved: the drop is cancelled while the action is denied.
	 *
	 * A drop that goes through takes the snapshot every rollback is built from. The event is
	 * published by each drop path before the move, so the column the card is leaving is still
	 * reachable here and not after it. Multi item drops carry no single item and are skipped.
	 * @param {BX.Kanban.DragEvent} event
	 * @returns {void}
	 */
	onBeforeItemMoved: function(event)
	{
		// the axis owns the place inside a column, so moving there must not write the manual order
		if (this.isFieldSortMode() && this.isDropInsideOwnColumn(event))
		{
			event.denyAction();

			// the move is refused here and never happens, so it has nothing to be rolled back from
			return;
		}

		const item = event.getItem();
		const column = (item ? item.getColumn() : null);
		if (!column)
		{
			return;
		}

		// a second move of the same card, started before the server answered the first one, keeps
		// the snapshot of the first: the rollback owes the user the position the card started from,
		// not the one it reached in between
		if (this.sourcePositions.has(item.getId()))
		{
			return;
		}

		const nextSibling = column.getNextItemSibling(item);

		this.sourcePositions.set(item.getId(), {
			itemId: item.getId(),
			columnId: column.getId(),
			nextSiblingId: (nextSibling ? nextSibling.getId() : null),
			columnName: column.getName(),
		});
	},

	/**
	 * Drops the snapshot of an operation that ends without a move: the event is published before the
	 * drop, which can still be refused, and a snapshot left behind would be spent on the next rollback.
	 * @param {BX.Kanban.Item|null} item
	 * @returns {void}
	 */
	forgetSourcePosition: function(item)
	{
		if (item)
		{
			this.sourcePositions.delete(item.getId());
		}
	},

	/**
	 * Checks the drop leaves the item in the column it already belongs to.
	 * @param {BX.Kanban.DragEvent} event
	 * @returns {boolean}
	 */
	isDropInsideOwnColumn: function(event)
	{
		var item = event.getItem();

		// the item joins the target column later, in moveItem, so it still knows the column it is dragged from
		return (Boolean(item) && item.getColumn() === event.getTargetColumn());
	},

	/**
	 * Puts the card back where it was before the refused move and drops the snapshot.
	 * @param {BX.Kanban.Item|null} item
	 * @returns {void}
	 */
	restoreSourcePosition: function(item)
	{
		if (!item)
		{
			return;
		}

		const position = this.sourcePositions.get(item.getId());
		this.forgetSourcePosition(item);
		if (!position)
		{
			return;
		}

		const column = this.getColumn(position.columnId);
		if (column)
		{
			this.moveItem(item, column, position.nextSiblingId);
		}
	},

	/**
	 * @param {String} message
	 * @param {String} politeness
	 * @returns {void}
	 */
	announce: function(message, politeness)
	{
		BX.UI.Accessibility.LiveAnnouncer.announce(message, politeness);
	},

	/**
	 * @param {String} phraseId
	 * @param {BX.Kanban.Item} item
	 * @param {BX.Kanban.Column} column
	 * @returns {String}
	 */
	moveMessage: function(phraseId, item, column)
	{
		return BX.message(phraseId)
			.replace("#task#", item.getData().name)
			.replace("#stage#", column.getName())
		;
	},

	/**
	 * Realtime updates reach the DOM silently by policy: the announcer holds every message for
	 * seconds, so speaking a batch of pull updates would turn an active board into a stream of
	 * speech. The single exception is the card the user is standing on, and even it speaks once
	 * per batch, because the queue of the announcer drops a repeat only while the previous copy
	 * is still queued. Everything else stays silent by decision: the other cards of the batch, the
	 * count of what has changed, and the updates our own operations make, which those operations
	 * announce themselves.
	 * @param {BX.Tasks.Kanban.Item} item
	 * @returns {void}
	 */
	announcePullUpdate: function(item)
	{
		// the move of this card has not ended yet: its outcome is announced by the operation, and
		// two polite messages about one event are heard as two events
		const movePending = this.sourcePositions.has(item.getId());

		if (this.pullBatch === null || this.pullBatch.updateAnnounced || movePending)
		{
			return;
		}

		this.pullBatch.updateAnnounced = true;

		this.announce(
			BX.message("TASKS_KANBAN_A11Y_ITEM_UPDATED").replace("#task#", item.getData().name),
			"polite"
		);
	},

	/**
	 * The card the user was standing on has left the board: removed by pull, dropped out of the
	 * selection or hidden by the filter after its own move. The focus has already been carried to
	 * another node by then, so the message names where it went; announcing it earlier would name a
	 * place the focus has not reached yet.
	 * @param {BX.Tasks.Kanban.Item} item
	 * @param {HTMLElement} focusTarget
	 * @returns {void}
	 */
	announceItemRemoval: function(item, focusTarget)
	{
		this.announce(
			BX.message("TASKS_KANBAN_A11Y_ITEM_REMOVED")
				.replace("#task#", item.getData().name)
				// every focus target of the board (card, column title, board) is named by aria-label
				.replace("#focus#", focusTarget.getAttribute("aria-label") || ""),
			"polite"
		);
	},

	/**
	 * The server refused the move: the card goes back, the focus follows it and the outcome
	 * is told in its own phrase, not by the error dialog the caller shows next.
	 * @param {BX.Tasks.Kanban.Item} item
	 * @param {BX.Kanban.Column} targetColumn
	 * @returns {void}
	 */
	rollbackMove: function(item, targetColumn)
	{
		const heldFocus = item.holdsFocus();
		const restoredOutside = this.hasExternalMoveRollback();
		if (restoredOutside)
		{
			this.forgetSourcePosition(item);
		}
		else
		{
			this.restoreSourcePosition(item);
		}

		if (heldFocus)
		{
			if (restoredOutside)
			{
				// the outside rollback runs right after this call and re-attaches the card once
				// more, dropping the node under focus to the body: the focus is given back after it
				requestAnimationFrame(() => item.focusCard());
			}
			else
			{
				item.focusCard();
			}
		}

		this.announce(this.moveMessage("TASKS_KANBAN_A11Y_MOVE_FAILED", item, targetColumn), "assertive");
	},

	/**
	 * Tells whether the card of a refused move is put back outside of the board. The scrum template
	 * keeps a snapshot of its own and moves the card back itself
	 * (tasks.kanban/templates/scrum/src/finish.move.controller.js, handleItemMoved), so restoring
	 * the position here as well would move one card twice.
	 * @returns {Boolean}
	 */
	hasExternalMoveRollback: function()
	{
		return false;
	},

	/**
	 * The completion chain refused the move: the card never left its stage, so there is nothing
	 * to roll back - only the outcome to tell and the focus to give back from the closing dialog.
	 * The outcome is told to everyone; the focus goes back only to the operation that owned it
	 * before the dialog opened, so a drop of the mouse is left where the user left it.
	 * @param {BX.Tasks.Kanban.Item} item
	 * @param {Boolean} heldFocus
	 * @returns {void}
	 */
	announceRejectedCompletion: function(item, heldFocus)
	{
		this.announce(BX.message("TASKS_KANBAN_A11Y_DOD_REJECTED"), "assertive");

		if (heldFocus)
		{
			item.focusCard();
		}
	},

	/**
	 * Hook on item moved.
	 * @param {BX.Kanban.Item} item
	 * @param {BX.Kanban.Column} targetColumn
	 * @param {BX.Kanban.Item} [beforeItem]
	 * @returns {void}
	 */
	onItemMoved: function(item, targetColumn, beforeItem)
	{
		const itemId = item.getId();
		let afterItemId = 0;
		const beforeItemId = beforeItem ? beforeItem.getId() : 0;
		const targetColumnId = targetColumn ? targetColumn.getId() : 0;
		const gridData = this.getData();

		if (beforeItemId === 0)
		{
			afterItemId = targetColumn.getPreviousItemSibling(item);
			if (afterItemId)
			{
				afterItemId = afterItemId.getId();
			}
		}

		this.ajax('moveTask',{
			itemId: itemId,
			columnId: targetColumnId,
			beforeItemId: beforeItemId,
			afterItemId: afterItemId
		}).then(
			(response) => {
				const data = response.data;
				const error = response.errors.pop();
				if (data && !error)
				{
					this.forgetSourcePosition(item);

					// the second half of the focus return: updateItem re-renders the card and
					// the column, and the node under focus is re-attached once more
					const heldFocus = item.holdsFocus();
					this.updateItem(itemId, data);
					if (heldFocus)
					{
						item.focusCard();
					}

					this.announce(
						beforeItem
							? this.moveMessage("TASKS_KANBAN_A11Y_MOVE_DONE_BEFORE", item, targetColumn)
								.replace("#neighbour#", beforeItem.getData().name)
							: this.moveMessage("TASKS_KANBAN_A11Y_MOVE_DONE", item, targetColumn),
						"polite"
					);

					if (gridData.kanbanType === "TL")
					{
						const deadlineText = data.data.deadline.rawValue ?? item.getDeadline();
						BX.UI.Notification.Center.notify({
							content: deadlineText
								? BX.message("MAIN_KANBAN_NOTIFY_CHANGE_DEADLINE").replace("#date#", deadlineText)
								: BX.message("MAIN_KANBAN_NOTIFY_REMOVE_DEADLINE")
						});
					}
					if (
						typeof data.data !== "undefined"
						&& data.data.hiddenByFilter === true
					)
					{
						this.removeItem(item);
					}

					if (this.isChildScrumGrid())
					{
						top.BX.loadExt('tasks.scrum.task-status').then(() => {
							if (
								!BX.type.isUndefined(top.BX.Tasks.Scrum)
								&& !BX.type.isUndefined(top.BX.Tasks.Scrum.TaskStatus)
							)
							{
								this.taskStatus = new top.BX.Tasks.Scrum.TaskStatus({
									groupId: this.groupId,
									parentTaskId: this.parentTaskId,
									taskId: itemId,
									action: (
										this.getFinishColumn().getId() === targetColumnId
											? 'complete'
											: 'renew'
									)
								});
								return this.taskStatus.update()
									.then((action) => {
										const actions = top.BX.Tasks.Scrum.TaskStatus.actions;
										switch (action)
										{
											case actions.complete:
											case actions.renew:
											case actions.proceed:
												return this.updateParentTaskStatus(action);
											case actions.skip:
												return null;
										}
									})
								;
							}
						}).finally(() => {
							this.resyncBoard({
								queueAfterCurrent: true,
								allowStaleChild: true,
							});
						});
					}
					else if (this.isGroupingMode())
					{
						this.resyncBoard({
							queueAfterCurrent: true,
							onlyAfterCurrent: true,
						});
					}
				}
				else if (error)
				{
					this.rollbackMove(item, targetColumn);
					BX.Kanban.Utils.showErrorDialog(error.message, true);
				}
			},
			(response) => {
				this.rollbackMove(item, targetColumn);
				BX.Kanban.Utils.showErrorDialog(BX.message('TASKS_KANBAN_MODAL_ERROR_PREFIX').concat(response.errors[0].message), true);
			},
		);
	},

	updateParentTaskStatus: function(inputAction)
	{
		if (inputAction === 'proceed')
		{
			return this.ajax('proceedParentTask',{
				taskId: this.parentTaskId,
			}).then(
				(response) => {
					const data = response.data;
					this.addItemToParentGrid(data);
					const parentItem = this.getItemFromParentGrid(this.parentTaskId);
					if (parentItem)
					{
						this.scrollToItem(parentItem);
					}
					return new Promise((resolve) => {
						setTimeout(() => {
							BX.onCustomEvent(this, 'Kanban.Grid:onProceedParentTask', [this]);
							resolve();
						}, 300);
					});
				},
				(response) => {
					BX.Kanban.Utils.showErrorDialog(response.errors[0].message, true);
				},
			);
		}
		else
		{
			const isCompleteAction = inputAction === 'complete';
			const action = isCompleteAction ? 'completeParentTask' : 'renewParentTask';
			return this.ajax(action, {
				taskId: this.parentTaskId,
				finishColumnId: this.getFinishColumn().getId(),
				newColumnId: this.getNewColumn().getId()
			}).then(
				(response) => {
					const error = response.errors.pop();
					this.actionPanel = null;
					if (!error)
					{
						if (isCompleteAction)
						{
							this.parentTaskCompleted = true;
							BX.onCustomEvent(this, 'Kanban.Grid:onCompleteParentTask', [this]);
						}
						else
						{
							this.parentTaskCompleted = false;
							BX.onCustomEvent(this, 'Kanban.Grid:onRenewParentTask', [this]);
						}					}
					else
					{
						BX.Kanban.Utils.showErrorDialog(error.message, true);
					}
				},
				(response) => {
					BX.Kanban.Utils.showErrorDialog(response.errors[0].message, true);
				},
			);
		}
	},

	/**
	 *
	 * @returns {BX.Tasks.Kanban.Column[]}
	 */
	getColumns: function()
	{
		return BX.Kanban.Grid.prototype.getColumns.call(this);
	},

	getFinishColumn: function()
	{
		return this.getColumns().find(function(column) {
			return column.isFinishType();
		});
	},

	getNewColumn: function()
	{
		return this.getColumns().find(function(column) {
			return column.isNewType();
		});
	},

	getColumnCount: function()
	{
		return Object.keys(this.getColumns()).length;
	},

	isParentTaskCompleted: function()
	{
		return this.parentTaskCompleted;
	},

	/**
	 * Hook on column move.
	 * @param {BX.Kanban.Column} column
	 * @param {BX.Kanban.Column} [targetColumn]
	 * @returns {void}
	 */
	onColumnMoved: function(column, targetColumn)
	{
		var columnId = column.getId();
		var afterColumn = this.getPreviousColumnSibling(column);
		var afterColumnId = afterColumn ? afterColumn.getId() : 0;

		if (this.isScrumGridHeader())
		{
			this.moveColumnsInNeighborGrids(column, targetColumn);
		}

		this.ajax('moveColumn', {
			columnId: columnId,
			afterColumnId: afterColumnId
		}).then(
			(response) => {
				const error = response.errors.pop();
				if (error)
				{
					BX.Kanban.Utils.showErrorDialog(error.message, true);
				}
			},
			(response) => {
				BX.Kanban.Utils.showErrorDialog(response.errors[0].message, true);
			},
		);
	},

	/**
	 * Hook on column update.
	 * @param {BX.Kanban.Column} column
	 * @returns {void}
	 */
	onColumnUpdated: function(column)
	{
		var columnId = column.getId();
		var title = column.getName();
		var color = column.getColor();

		this.ajax('modifyColumn', {
			fields: {
				id: columnId,
				columnName: title,
				columnColor: color
			}
		}).then(
			(response) => {
				const error = response.errors.pop();
				this.actionPanel = null;
				if (error)
				{
					BX.Kanban.Utils.showErrorDialog(error.message, true);
				}
			},
			(response) => {
				BX.Kanban.Utils.showErrorDialog(response.errors[0].message, true);
			},
		);
	},

	/**
	 * Get path for ajax query.
	 * @returns {string}
	 */
	getAjaxHandlerPath: function()
	{
		return `/bitrix/services/main/ajax.php?mode=class&c=${encodeURIComponent('bitrix:tasks.kanban')}`;
	},

	resyncBoard: function(options = {})
	{
		if (!this.isGroupingMode())
		{
			return Promise.resolve(false);
		}

		const promises = [];
		BX.Event.EventEmitter.emit('tasks:kanban:resyncRequest', {
			grid: this,
			promises,
			groupId: this.groupId,
			allowStaleChild: options.allowStaleChild === true,
			onlyAfterCurrent: options.onlyAfterCurrent === true,
		});

		return Promise.all(promises).then((results) => {
			return results.length > 0 && results.every((result) => result !== false);
		});
	},

	/**
	 * Hook on main filter applied.
	 * @param {String} filterId
	 * @param {Object} values
	 * @param {Object} filterInstance
	 * @param {Object} params
	 * @returns {void}
	 */
	onApplyFilter: function(filterId, values, filterInstance, promise, params)
	{
		if (this.isGroupingMode())
		{
			return;
		}

		this.fadeOut();
		if (params)
		{
			params.autoResolve = false;
		}

		const data = {};
		data.params = this.getData().params;
		if (this.getData().kanbanType === "TL")
		{
			data.timeline = 'Y';
		}

		const sortGeneration = this.sortGeneration;
		const filterGeneration = ++this.filterGeneration;

		this.ajax('applyFilter', {}).then(
			(response) => {
				// the board was requested for the order left behind, a newer request is on its way and will fade it in
				if (
					sortGeneration !== this.sortGeneration
					|| (this.getData().kanbanType === 'P' && filterGeneration !== this.filterGeneration)
				)
				{
					if (promise)
					{
						promise.fulfill();
					}

					return;
				}

				// re-set some data
				const data = response.data;
				const gridData = this.getData();
				const focusWasInsideBoard = this.isFocusInsideBoard();
				if (typeof data.customFields !== "undefined")
				{
					gridData.customFields = data.customFields;
				}
				if (this.differentColumnCount(data))
				{
					this.getColumns().forEach((column) => this.removeColumn(column));
				}
				this.removeItems();
				this.loadData(data);
				if (focusWasInsideBoard)
				{
					this.getOuterContainer().focus();
				}
				if (promise)
				{
					promise.fulfill();
				}
				this.fadeIn();
			},
			(response) => {
				if (promise)
				{
					promise.reject();
				}

				if (
					sortGeneration !== this.sortGeneration
					|| (this.getData().kanbanType === 'P' && filterGeneration !== this.filterGeneration)
				)
				{
					return;
				}

				this.fadeIn();
			}
		);
	},

	differentColumnCount: function(data)
	{
		if (BX.Type.isArray(data.columns))
		{
			const columnCount = data.columns.length;
			const kanbanColumnCount = this.getColumnCount();

			return columnCount !== kanbanColumnCount;
		}

		return false;
	},

	/**
	 * Hook on timer changed.
	 * @param {Object} data
	 * @returns {void}
	 */
	onTaskTimerChange: function(data)
	{
		if (
			data.taskId && data.action === "refresh_daemon_event" &&
			data.data && data.data.TIMER && data.data.TIMER.TIMER_STARTED_AT
		)
		{
			var task = this.getItem(data.taskId);
			var timestamp = Math.floor(Date.now() / 1000);
			var delta = parseInt(timestamp - data.data.TIMER.TIMER_STARTED_AT);
			if (task)
			{
				task.setDataKey("time_logs", task.getData().time_logs_start + delta);
				task.setDataKey("in_progress", true);
				task.render();
				this.restoreCardControlsTabIndex(task);
			}
		}
	},

	/**
	 * Hook on sort selector.
	 * @param {Object} data
	 * @param {Object} [sourceParams] Parameters of the view the order was changed for.
	 * @returns {void}
	 */
	onTaskSortChanged: function(data, sourceParams)
	{
		if (!data || !data.newTaskOrder)
		{
			return;
		}

		// the event is global, and the senders telling no view keep the old behaviour of reacting everywhere
		if (sourceParams && !this.isViewOfParams(sourceParams))
		{
			return;
		}

		var gridData = this.getData();
		// only the field order changes the content of the columns, the other modes affect new tasks only
		var needReload = (gridData.newTaskOrder === "field" || data.newTaskOrder === "field");

		gridData.newTaskOrder = data.newTaskOrder;
		gridData.sortField = data.sortField;
		gridData.sortDirection = data.sortDirection;
		this.setData(gridData);

		if (needReload)
		{
			this.sortGeneration++;
			this.resetPaginationPage();
			this.onApplyFilter();
		}
	},

	/**
	 * Checks the parameters describe the view this grid shows.
	 * @param {Object} params
	 * @returns {boolean}
	 */
	isViewOfParams: function(params)
	{
		var ownParams = this.getData().params || {};

		// a template builds the parameters of the grid and of the sort menu as separate objects and types the values
		// differently, so the view is recognized by the content of the fields defining it
		return [
			'USER_ID',
			'GROUP_ID',
			'GROUP_ID_FORCED',
			'PERSONAL',
			'TIMELINE_MODE',
			'SPRINT_ID',
			'IS_COMPLETED_SPRINT',
		].every(function(field) {
			return (String(ownParams[field] ?? '') === String(params[field] ?? ''));
		});
	},

	/**
	 * @param {Object} data
	 * @return {int}
	 */
	recognizeTaskId: function(data)
	{
		var taskId = 0;

		if (data.TASK_ID)
		{
			taskId = parseInt(data.TASK_ID);
		}
		else if (data.taskId)
		{
			taskId = parseInt(data.taskId);
		}
		else if (data["entityXmlId"])
		{
			if (data["entityXmlId"].indexOf("TASK_") === 0)
			{
				taskId = parseInt(data["entityXmlId"].substr(5));
			}
		}

		return taskId;
	},

	onPullCommentReadAll(eventParams)
	{
		Object.values(this.getItems()).forEach((item) => {
			const data = item.data;
			const isExpiredCounts = (
				data.is_expired
				&& !data.completed
				&& !data.completed_supposedly
			);
			const counter = item.task_counter;
			const counterValue = counter.getValue();
			if (
				counterValue > 0
				&& (!isExpiredCounts || counterValue > 1)
			)
			{
				data.counter.value = (isExpiredCounts ? 1 : 0);
				counter.update(data.counter.value);
				item.render();
				this.restoreCardControlsTabIndex(item);
			}
		});
	},

	onPullTagChanged(eventParams)
	{
		if (this.isScrumGrid())
		{
			BX.Tasks.Scrum.Kanban.onApplyFilter();
		}
		else
		{
			this.onApplyFilter();
		}
	},

	onPullCommentAdd(eventParams, taskId, taskData)
	{
		this.updateItemState(taskId, taskData);
	},

	onPullStageChange(eventParams, taskId, taskData)
	{
		this.updateItemState(taskId, taskData);
	},

	onPullTaskAdd(eventParams, taskId, taskData)
	{
		this.updateItemState(taskId, taskData);
	},

	onPullTaskUpdate(eventParams, taskId, taskData)
	{
		this.updateItemState(taskId, taskData);
	},

	onPullTaskView(eventParams, taskId, taskData)
	{
		this.updateItemState(taskId, taskData);
	},

	onPullTaskRemove(eventParams, taskId)
	{
		this.removeItem(taskId);
	},

	onPullTimerStart(eventParams, taskId)
	{
		if (!this.hasItem(taskId))
		{
			return;
		}

		BX.TasksTimerManager.startTimer(taskId, {
			timerStartedAtTs: eventParams.timerStartedAtTs,
			timeElapsed: eventParams.timeElapsed,
			timeSpentInLogs: eventParams.timeSpentInLogs,
			timeEstimate: eventParams.timeEstimate,
			userId: this.ownerId,
		});
	},

	onPullTimerStop(eventParams, taskId)
	{
		if (!this.hasItem(taskId))
		{
			return;
		}

		BX.TasksTimerManager.stopTimer(taskId);
	},

	refreshTask: function(taskId)
	{
		return this.ajax('refreshTask',{
			taskId: taskId,
			isScrum: this.isScrumGrid() ? 'Y' : 'N',
			parentId: this.getParentTaskId()
		}).then(
			(response) => {
				const data = response.data;

				if (data && !BX.type.isArray(data) && response.errors.length === 0)
				{
					this.addItemOrder(data);
				}

				return response;
			},
			() => null,
		);
	},

	/**
	 * Handler on grid render.
	 * @returns {void}
	 */
	onGridRender: function()
	{
		var grid = this.getGridContainer();

		var columnsWidth = this.getColumns().reduce(function(width, /*BX.Kanban.Column*/column) {
			return width + column.getContainer().offsetWidth;
		}, 0);

		var showBorder = (columnsWidth + 80) < grid.offsetWidth;

		this.getRenderToContainer().classList[showBorder ? "add" : "remove"]("tasks-kanban-border");
	},

	/**
	 * Change view demo.
	 * @param {Int} viewId
	 * @returns {void}
	 */
	changeDemoView: function(viewId)
	{
		// remove all columns
		var columns = this.getColumns();
		for (var i = 0, c = columns.length; i < c; i++)
		{
			this.removeColumn(columns[i]);
		}
		this.ajax('changeDemoView',{
			viewId: viewId
		}).then(
			(response) => {
				const data = response.data;
				this.loadData(data);
			},
			(response) => {
				const error = response.errors[0].message;
				BX.Kanban.Utils.showErrorDialog(error, true);
			}
		);
	},

	/**
	 * Build the action panel.
	 */
	initActionPanel: function()
	{
		this.actionPanel = new BX.UI.ActionPanel({
			renderTo: document.querySelector(".pagetitle-wrap"),
			removeLeftPosition: true,
			maxHeight: 56,
			parentPosition: "bottom"
		});

		this.actionPanel.draw();

		var grid = this;
		var stages = [];
		var gridData = this.getData();

		// move to stage item
		if (
			gridData.kanbanType !== "TL" &&
			gridData.rights.canSortItem
		)
		{
			var changeStageHandler = function(columnId, columnName)
			{
				return function()
				{
					BX.Tasks.Kanban.Actions.simpleAction(grid, {
							action: "moveTask",
							columnId: columnId,
							columnName: BX.util.htmlspecialchars(columnName)
						}
					);
				};
			};
			// gets stages
			this.getColumns().forEach(function(/*BX.Kanban.Column*/column) {
				stages.push({
					text: column.getName(),
					onclick: changeStageHandler(column.getId(), column.getName())
				});
			});
			this.actionPanel.appendItem({
				id: "stage",
				text: BX.message("TASKS_KANBAN_PANEL_STAGE"),
				items: stages
			});
		}

		// building panel below

		this.actionPanel.appendItem({
			id: "complete",
			text: BX.message("TASKS_KANBAN_PANEL_COMPLETE"),
			onclick: function()
			{
				BX.UI.Dialogs.MessageBox.confirm(
					BX.message("TASKS_KANBAN_PANEL_CONFIRM_MESS_COMPLETE"),
					BX.message("TASKS_KANBAN_PANEL_CONFIRM_TITLE"),
					function (messageBox)
					{
						BX.Tasks.Kanban.Actions.simpleAction(grid, {
								action: "completeTask"
							}
						);
						messageBox.close();
					}
				);
			}
		});

		this.actionPanel.appendItem({
			id: "deadline",
			text: BX.message("TASKS_KANBAN_PANEL_DEADLINE"),
			onclick: function()
			{
				BX.Tasks.Kanban.Actions.deadline(
					grid,
					this.layout.container
				);
				BX.PreventDefault();
			}
		});

		this.actionPanel.appendItem({
			id: "members",
			text: BX.message("TASKS_KANBAN_PANEL_MEMBERS"),
			items: [
				{
					text: BX.message("TASKS_KANBAN_PANEL_MEMBERS_RESPONSE_MSGVER_1"),
					onclick: function()
					{
						BX.Tasks.Kanban.Actions.member(
							grid,
							this.layout.container,
							"delegateTask"
						);
						BX.PreventDefault();
					}
				},
				{
					text: BX.message("TASKS_KANBAN_PANEL_MEMBERS_CREATED"),
					onclick: function()
					{
						BX.Tasks.Kanban.Actions.member(
							grid,
							this.layout.container,
							"changeAuthorTask"
						);
						BX.PreventDefault();
					}
				},
				{
					text: BX.message("TASKS_KANBAN_PANEL_MEMBERS_CORESPONSE"),
					onclick: function()
					{
						BX.Tasks.Kanban.Actions.member(
							grid,
							this.layout.container,
							"addAccompliceTask"
						);
						BX.PreventDefault();
					}
				},
				{
					text: BX.message("TASKS_KANBAN_PANEL_MEMBERS_AUDITOR"),
					onclick: function()
					{
						BX.Tasks.Kanban.Actions.member(
							grid,
							this.layout.container,
							"addAuditorTask"
						);
						BX.PreventDefault();
					}
				}
			]
		});

		this.actionPanel.appendItem({
			id: "group",
			text: BX.message("TASKS_KANBAN_PANEL_GROUP"),
			onclick: function()
			{
				BX.Tasks.Kanban.Actions.member(
					grid,
					this.layout.container,
					"changeGroupTask",
					"group"
				);
				BX.PreventDefault();
			}
		});

		this.actionPanel.appendItem({
			id: "favorite",
			text: BX.message("TASKS_KANBAN_PANEL_FAVORITE"),
			items: [
				{
					text: BX.message("TASKS_KANBAN_PANEL_FAVORITE_ADD"),
					onclick: function()
					{
						BX.Tasks.Kanban.Actions.simpleAction(grid, {
								action: "addFavoriteTask"
							}
						);
					}
				},
				{
					text: BX.message("TASKS_KANBAN_PANEL_FAVORITE_REMOVE"),
					onclick: function()
					{
						BX.Tasks.Kanban.Actions.simpleAction(grid, {
								action: "deleteFavoriteTask"
							}
						);
					}
				}
			]
		});

		this.actionPanel.appendItem({
			id: "delete",
			text: BX.message("TASKS_KANBAN_PANEL_DELETE"),
			onclick: function()
			{
				BX.UI.Dialogs.MessageBox.confirm(
					BX.message("TASKS_KANBAN_PANEL_CONFIRM_MESS_DELETE"),
					BX.message("TASKS_KANBAN_PANEL_CONFIRM_TITLE"),
					function (messageBox)
					{
						BX.Tasks.Kanban.Actions.simpleAction(grid, {
								action: "deleteTask"
							}
						);
						messageBox.close();
					}
				);
			}
		});
	},

	/**
	 * Show action panel.
	 * @returns {void}
	 */
	startActionPanel: function()
	{
		if (!this.actionPanel)
		{
			this.initActionPanel();
		}

		this.actionPanel.showPanel();
	},

	/**
	 * Hide action panel.
	 * @returns {void}
	 */
	stopActionPanel: function()
	{
		if (!this.actionPanel)
		{
			return;
		}

		this.actionPanel.hidePanel();
	},

	setTotalSelectedItems: function()
	{
		if(!this.actionPanel)
		{
			this.initActionPanel();
		}

		this.actionPanel.setTotalSelectedItems(this.getSelectedItems().size);
	},

	/**
	 * Set Kanban drag mode on.
	 * @returns {void}
	 */
	setKanbanDragMode: function()
	{
		BX.addClass(document.body, "task-kanban-drag-mode");
	},

	/**
	 * Set Kanban drag mode off.
	 * @returns {void}
	 */
	unSetKanbanDragMode: function()
	{
		BX.removeClass(document.body, "task-kanban-drag-mode");
	},

	setKanbanRealtimeMode: function()
	{
		// the field order owns the places inside a column just like the realtime one does
		if(this.isRealtimeMode() || this.isFieldSortMode())
		{
			this.getOuterContainer().classList.add("tasks-kanban-realtime-mode")
		}
	},

	unSetKanbanRealtimeMode: function()
	{
		if(this.isRealtimeMode() || this.isFieldSortMode())
		{
			this.getOuterContainer().classList.remove("tasks-kanban-realtime-mode")
		}
	},

	getGridContainer: function()
	{
		var gridContainer = BX.Kanban.Grid.prototype.getGridContainer.call(this);

		if (this.isScrumGridHeader())
		{
			gridContainer.style.overflow = 'hidden';
		}

		return gridContainer;
	},

	adjustHeight: function()
	{
		if (!this.isGroupingMode())
		{
			BX.Kanban.Grid.prototype.adjustHeight.call(this);
		}
	},

	observeScrumGridHeader: function()
	{
		if (typeof IntersectionObserver === 'undefined')
		{
			return;
		}

		var outerContainer = this.getOuterContainer();
		var scrumKanbanContainer = outerContainer.parentElement;
		var targetObserver = scrumKanbanContainer.querySelector('.tasks-scrum-kanban-header-target-observer');

		if (!targetObserver)
		{
			return;
		}

		var scrumGridHeaderObserver = new IntersectionObserver(function(entries) {
				if (entries[0].isIntersecting === true)
				{
					if (outerContainer.classList.contains('tasks-scrum-kanban-header'))
					{
						outerContainer.classList.remove('tasks-scrum-kanban-header');
					}
					targetObserver.classList.remove('--with-margin');
				}
				else
				{
					if (!outerContainer.classList.contains('tasks-scrum-kanban-header'))
					{
						outerContainer.classList.add('tasks-scrum-kanban-header');
					}
					targetObserver.classList.add('--with-margin');
				}
			}.bind(this),
			{
				threshold: [0]
			}
		);

		scrumGridHeaderObserver.observe(targetObserver);
	},

	onGridScroll: function(event)
	{
		this.neighborGrids.forEach(function(neighborGrid) {
			neighborGrid.getGridContainer().scrollLeft = event.target.scrollLeft;
		});
	},

	getEmptyStub: function()
	{
		if (this.isScrumGrid())
		{
			this.layout.emptyStub = document.createElement('div');

			return this.layout.emptyStub;
		}
		else
		{
			return BX.Kanban.Grid.prototype.getEmptyStub.call(this);
		}
	},

	getLeftEar: function()
	{
		if (this.isScrumGridHeader())
		{
			this.layout.earLeft = document.createElement('div');

			return this.layout.earLeft;
		}
		else
		{
			return BX.Kanban.Grid.prototype.getLeftEar.call(this);
		}
	},

	getRightEar: function()
	{
		if (this.isScrumGridHeader())
		{
			this.layout.earRight = document.createElement('div');

			return this.layout.earRight;
		}
		else
		{
			return BX.Kanban.Grid.prototype.getRightEar.call(this);
		}
	},

	/**
	 * @neighborGrid {BX.Tasks.Kanban.Grid}
	 */
	addNeighborGrid: function(inputNeighborGrid)
	{
		if (this !== inputNeighborGrid)
		{
			var existGrid = false;
			this.neighborGrids.forEach(
				function(neighborGrid) {
					if (neighborGrid === inputNeighborGrid)
					{
						existGrid = true;
					}
				})
			;
			if (!existGrid)
			{
				this.neighborGrids.push(inputNeighborGrid);
			}
		}
	},

	cleanNeighborGrids: function()
	{
		this.neighborGrids = [];
	},

	getNeighborGrids: function()
	{
		return this.neighborGrids;
	},

	addItemToParentGrid: function(data)
	{
		this.neighborGrids.forEach(
			function(neighborGrid) {
				if (!neighborGrid.isScrumGridHeader() && !neighborGrid.isChildScrumGrid())
				{
					neighborGrid.addItemOrder(data);
				}
			})
		;
	},

	getItemFromParentGrid: function(itemId)
	{
		var item = null;

		this.neighborGrids.forEach(
			function(neighborGrid) {
				if (!neighborGrid.isScrumGridHeader() && !neighborGrid.isChildScrumGrid())
				{
					item = neighborGrid.getItem(itemId);
				}
			})
		;

		return item;
	},

	removeColumnsByIdFromNeighborGrids: function(columnId)
	{
		this.neighborGrids.forEach(function(neighborGrid) {
			neighborGrid.removeColumn(neighborGrid.getColumn(columnId));
		});
	},

	moveColumnsInNeighborGrids: function(column, targetColumn)
	{
		this.neighborGrids.forEach(function(neighborGrid) {
			var neighborColumn = neighborGrid.getColumn(column.getId());
			var neighborTargetColumn = neighborGrid.getColumn(targetColumn.getId());
			if (neighborColumn && neighborTargetColumn)
			{
				neighborGrid.moveColumn(neighborColumn, neighborTargetColumn);
			}
		}.bind(this));
	},

	isScrumGridHeader: function()
	{
		return this.gridHeader;
	},

	isScrumGrid: function()
	{
		return this.isSprintView;
	},

	isCollabMode: function()
	{
		return this.isCollab;
	},

	isGroupingMode: function()
	{
		return this.groupingMode;
	},

	isChildScrumGrid: function()
	{
		return (this.parentTaskId > 0);
	},

	isParentTask: function(id)
	{
		return (parseInt(id, 10) === this.parentTaskId);
	},

	getParentTaskId: function()
	{
		return this.parentTaskId;
	},

	resetPaginationPage: function()
	{
		this.getColumns()
			.forEach(function(column) {
				column.getPagination().loadingInProgress = false;
				column.getPagination().page = 1;
			})
		;
	},

	isChildTask: function(parentId)
	{
		return (parseInt(parentId, 10) === this.parentTaskId);
	},

	updateTotals: function()
	{
		this.getColumns().forEach(function(column) {
			let total = 0;
			this.getNeighborGrids()
				.forEach(function(neighborGrid) {
					const currentColumn = neighborGrid.getColumn(column.getId());
					if (currentColumn)
					{
						total += currentColumn.getItemsCount();
					}
				})
			;
			column.setTotal(total);
			column.render();
		}.bind(this));
	},

	getColumnsWidth: function()
	{
		let columnsWidth = 0;

		this.getColumns().forEach(function(column) {
			columnsWidth += column.getContainer().offsetWidth;
		});

		return columnsWidth + 'px';
	},

	hasItem: function(itemId)
	{
		itemId = parseInt(itemId, 10);

		var hasItem = false;
		Object.values(this.getItems())
			.forEach(function(item) {
				if (parseInt(item.getId(), 10) === itemId)
				{
					hasItem = true;
				}
			})
		;

		return hasItem;
	},

	hasItemInProgress: function()
	{
		var hasItemInProgress = false;

		Object.values(this.getItems())
			.forEach(function(item) {
				if (!item.isCompleted())
				{
					hasItemInProgress = true;
				}
			})
		;

		return hasItemInProgress;
	},

	scrollToItem: function(item)
	{
		var scrollTimeout;
		var scrollHandler = function () {
			clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(function() {
				item.animate({
					duration: 1000,
					draw: function(progress) {
						item.layout.container.style.opacity = progress * 100 + '%';
					},
					useAnimation: true
				}).then(function(){
					item.layout.container.style.opacity = '100%';
				}.bind(this));
			}, 100);
			BX.unbind(window, 'scroll', scrollHandler);
		};
		BX.bind(window, 'scroll', scrollHandler);

		item.getContainer().scrollIntoView({
			behavior: 'smooth',
			block: 'center',
			inline: 'nearest'
		});
	},

	analytics: function (event, element, status = null)
	{
		const analyticsData = {
			event,
			tool: 'tasks',
			category: 'task_operations',
			type: 'quick_task',
			c_section: this.getSectionTypeForAnalytics(),
			c_element: element,
			c_sub_section: this.getKanbanTypeForAnalytics(),
		};
		if (status)
		{
			analyticsData.status = status;
		}

		if (BX.UI.Analytics)
		{
			BX.UI.Analytics.sendData(analyticsData);
		}
		else
		{
			BX.Runtime.loadExtension('ui.analytics').then(() => {
				BX.UI.Analytics.sendData(analyticsData);
			});
		}
	},

	getSectionTypeForAnalytics: function ()
	{
		if (this.isScrumGrid())
		{
			return 'scrum';
		}

		if (this.getGroupId())
		{
			if (this.isCollabMode())
			{
				return 'collab';
			}

			return 'project';
		}

		return 'tasks';
	},

	getKanbanTypeForAnalytics: function ()
	{
		const type = this.getData().kanbanType;

		switch (type)
		{
			case 'TL':
				return 'deadline';
			case 'P':
				return 'planner';
			default:
				return 'kanban';
		}
	},
};


})();
