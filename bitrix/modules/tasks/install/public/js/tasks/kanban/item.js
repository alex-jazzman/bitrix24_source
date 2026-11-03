/*eslint-disable*/

(function() {

"use strict";

BX.namespace("BX.Tasks.Kanban");

/**
 *
 * @param options
 * @extends {BX.Kanban.Item}
 * @constructor
 */
/**
 * SC-005: shared registry — at most one deadlineless hint popup is open at a time.
 * Stored in the module closure (not on the prototype) to avoid prototype pollution.
 * @type {BX.Tasks.Kanban.Item|null}
 */
var activeDeadlinelessHintItem = null;

BX.Tasks.Kanban.Item = function(options)
{
	BX.Kanban.Item.apply(this, arguments);

	/** @var {Element} **/
	this.container = null;
	this.timer = null;

	this.isSprintView = (options.isSprintView === 'Y');
	this.networkEnabled = options.networkEnabled || false;
	this.storyPoints = (this.data.storyPoints ? this.data.storyPoints : '');
	this.epic = (BX.type.isPlainObject(this.data.epic) ? this.data.epic : null);
	this.calendarSettings = (options.calendarSettings ? options.calendarSettings : {});
};

BX.Tasks.Kanban.Item.prototype = {
	__proto__: BX.Kanban.Item.prototype,
	constructor: BX.Tasks.Kanban.Item,
	dateFormats: {
		short: {
			en: "F j",
			de: "j. F",
			ru: "j F"
		},
		full: {
			en: "F j, Y",
			de: "j. F Y",
			ru: "j F Y"
		}
	},

	setOptions: function(options)
	{
		if (!BX.type.isPlainObject(options))
		{
			return;
		}

		BX.Kanban.Item.prototype.setOptions.apply(this, arguments);

		this.storyPoints = (options.data.storyPoints ? options.data.storyPoints : '');
		this.epic = (BX.type.isPlainObject(options.data.epic) ? options.data.epic : null);
	},

	/**
	 * Return formatted time.
	 * @param {String} string
	 * @param {Boolean} showSeconds
	 * @returns {String}
	 */
	renderTime: function (string, showSeconds)
	{
		var sec_num = parseInt(string, 10);
		var hours   = Math.floor(sec_num / 3600);
		var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
		var seconds = sec_num - (hours * 3600) - (minutes * 60);
		showSeconds = typeof(showSeconds) === "undefined" ? true : showSeconds;

		if (hours < 10)
		{
			hours   = "0" + hours;
		}
		if (minutes < 10)
		{
			minutes = "0" + minutes;
		}
		if (seconds < 10)
		{
			seconds = "0" + seconds;
		}

		return hours + ":" + minutes + (showSeconds ? (":" + seconds) : "");
	},

	/**
	 * Add <span> for last word in title.
	 * @param {String} fullTitle
	 * @returns {String}
	 */
	clipTitle: function (fullTitle)
	{
		let title = fullTitle;
		const arrTitle = title.split(' ');
		const lastWord = '<span>' + arrTitle[arrTitle.length - 1] + '</span>';

		arrTitle.splice(arrTitle.length - 1);

		title = arrTitle.join(" ") + " " + lastWord;

		return title;
	},

	/**
	 * Store key in current data.
	 * @param {String} key
	 * @param {String} val
	 * @returns {void}
	 */
	setDataKey: function(key, val)
	{
		var data = this.getData();
		data[key] = val;
	},

	/**
	 * Get key value from current data.
	 * @param {String} key
	 * @returns {String}
	 */
	getDataKey: function(key)
	{
		var data = this.getData();
		return data[key];
	},

	/**
	 * Gets deadline of item.
	 * @return {String}
	 */
	getDeadline: function()
	{
		return this.deadlineNotificationDate;
	},

	/**
	 * Set the accessible name of a card control.
	 * @param {HTMLElement} control
	 * @param {String} phrase
	 * @param {Object} [replacements] value by #placeholder# key
	 * @returns {void}
	 */
	setControlLabel: function(control, phrase, replacements)
	{
		let name = BX.message(phrase);

		Object.keys(replacements || {}).forEach((placeholder) => {
			name = name.replace(placeholder, replacements[placeholder]);
		});

		control.setAttribute("aria-label", name);
	},

	/**
	 * Set both the mouse hint and the accessible name of a card control.
	 * @param {HTMLElement} control
	 * @param {String} phrase
	 * @returns {void}
	 */
	setControlName: function(control, phrase)
	{
		control.setAttribute("title", BX.message(phrase));
		this.setControlLabel(control, phrase);
	},

	/**
	 * Set status for current item.
	 * @param {String} code
	 * @returns {undefined}
	 */
	setStatus: function(code)
	{
		const data = this.getData();

		if (this.task_complete)
		{
			BX.show(this.task_complete);
		}

		this.setDataKey("status", code);

		if (code === "completed")
		{
			if (this.task_complete)
			{
				BX.hide(this.task_complete);
			}
		}

		if (this.task_start && data.in_progress && !BX.hasClass(this.task_start, "tasks-kanban-task-pause"))
		{
			BX.addClass(this.task_start, "tasks-kanban-task-pause");
			this.setControlName(this.task_start, "TASKS_KANBAN_TITLE_PAUSE");
		}
		else if (this.task_start && !data.in_progress)
		{
			BX.removeClass(this.task_start, "tasks-kanban-task-pause");
			this.setControlName(this.task_start, "TASKS_KANBAN_TITLE_START");
		}

		if (this.task_mute && data.muted && !BX.hasClass(this.task_mute, "tasks-kanban-task-muted"))
		{
			BX.addClass(this.container, "tasks-kanban-task-muted");
			this.setControlName(this.task_mute, "TASKS_KANBAN_TITLE_UNMUTE");
			this.task_counter.setColor(BX.UI.Counter.Color.GRAY);
		}
		else if (this.task_mute && !data.muted)
		{
			var isExpiredCounts = data.is_expired && !data.completed && !data.completed_supposedly;
			BX.removeClass(this.container, "tasks-kanban-task-muted");
			this.setControlName(this.task_mute, "TASKS_KANBAN_TITLE_MUTE");
			this.task_counter.setColor(isExpiredCounts ? BX.UI.Counter.Color.DANGER : BX.UI.Counter.Color.SUCCESS);
		}
	},

	/**
	 * Action for mute/unmute the task.
	 * @returns {void}
	 */
	muteTask: function()
	{
		var taskId = this.getId();
		var data = this.getData();
		var action = data.muted ? "unmuteTask" : "muteTask";

		this.getGrid().ajax(action, {
			taskId: taskId
		}).then(
			(response) => {
				const data = response.data;
				const error = response.errors.pop();

				if (data && !error)
				{
					this.getGrid().updateItem(this.getId(), data);
				}
				else if (error)
				{
					BX.Kanban.Utils.showErrorDialog(error.message, true);
				}
			},
			(response) => {
				const error = response.errors.pop();
				BX.Kanban.Utils.showErrorDialog("Error: " + error.message, true);
			},
		);
	},

	/**
	 * Action for start the task.
	 * @returns {void}
	 */
	startTask: function()
	{
		var taskId = this.getId();
		var data = this.getData();
		var action = data.in_progress ? "pauseTask" : "startTask";

		if (data.allow_time_tracking && data.time_tracking)
		{
			if (action === "startTask")
			{
				BX.TasksTimerManager.start(taskId);
			}
			else
			{
				BX.TasksTimerManager.stop(taskId);
			}
		}

		if (
			!data.allow_time_tracking ||
			!data.time_tracking ||
			action === "pauseTask"
		)
		{
			this.getGrid().ajax(action, {
				taskId: taskId
			}).then(
				(response) => {
					const data = response.data;
					const error = response.errors.pop();

					if (data && !error)
					{
						this.getGrid().updateItem(this.getId(), data);
					}
					else if (error)
					{
						BX.Kanban.Utils.showErrorDialog(error.message, true);
					}
				},
				(response) => {
					const error = response.errors.pop();
					BX.Kanban.Utils.showErrorDialog("Error: " + error.message, true);
				},
			);
		}
	},

	/**
	 * Action for complete the task.
	 * @returns {void}
	 */
	completeTask: function()
	{
		if (this.getGrid().getData().kanbanType === 'P')
		{
			const intent = this.getDataKey('completed_supposedly') ? 'approve' : 'complete';

			return this.getGrid().completeMyPlanTask(this.getId(), this.getColumnId(), intent);
		}

		var currentStatus = this.getDataKey("status");

		this.setStatus("completed");

		this.getGrid().ajax('completeTask', {
			taskId: this.getId(),
			columnId: this.getColumnId()
		}).then(
			(response) => {
				const data = response.data;
				const error = response.errors.pop();

				if (data && !error)
				{
					this.getGrid().updateItem(this.getId(), data);
				}
				else if (error)
				{
					this.setStatus(currentStatus);
					BX.Kanban.Utils.showErrorDialog(error.message, true);
				}
			},
			(response) => {
				const error = response.errors.pop();
				this.setStatus(currentStatus);
				BX.Kanban.Utils.showErrorDialog("Error: " + error.message, true);
			},
		);
	},

	/**
	 * Action for set deadline for the task.
	 * @returns {void}
	 */
	deadlineTask: function(node)
	{
		var data = this.getData();
		var format = BX.date.convertBitrixFormat(BX.message("FORMAT_DATETIME"));
		var value = BX.date.format(format, data.date_deadline || data.date_day_end);

		var calendar = BX.calendar({
			node: node || this.date_deadline_container,
			value: value,
			currentTime: value,
			bTime: true,
			bCompatibility: true,
			bCategoryTimeVisibilityOption: 'tasks.bx.calendar.deadline',
			bTimeVisibility: (
				this.calendarSettings ? (this.calendarSettings.deadlineTimeVisibility === 'Y') : false
			),
			callback: function(data)
			{
				this.getGrid().ajax('deadlineTask', {
						taskId: this.getId(),
						deadline: BX.date.format(format, data),
						columnId: this.getColumnId()
					},
				).then(
					(response) => {
						const data = response.data;
						const error = response.errors.pop();

						if (data && !error)
						{
							this.getGrid().updateItem(data.id, data);
						}
						else if (error)
						{
							BX.Kanban.Utils.showErrorDialog(error.message, true);
						}
					},
					(response) => {
						const error = response.errors.pop();
						BX.Kanban.Utils.showErrorDialog("Error: " + error.message, true);
					},
				);
			}.bind(this),
			callback_after: function(value) {
				BX.onCustomEvent(this.getGrid(), 'Tasks.Kanban.Item:deadlineChanged', {value: value});
			}.bind(this)
		});

		BX.onCustomEvent(this.getGrid(), 'Tasks.Kanban.Item:deadlineChangeClick', {
			calendar: calendar,
			itemId: data.id
		});
	},

	/**
	 * SC-005 events 1-2: the deadlineless hint is a notification, not a card banner —
	 * type=notification, no c_element, c_sub_section=deadline. The kanban surface reports the
	 * deadline context rather than its own: analytics dropped `kanban`, which only occurs in
	 * legacy projects. Values are literals kept in sync with the tasks.v2.const dictionary
	 * (no ES import in this public plain-JS bundle).
	 * ui.analytics is loaded lazily via the loadExtension fallback below. The CTA opens the
	 * local BX.calendar without unloading the page, so the promise resolves and the event is
	 * delivered.
	 * @param {string} event
	 * @returns {void}
	 */
	sendDeadlinelessHintAnalytics: function(event)
	{
		var analyticsData = {
			tool: 'tasks',
			category: 'task_operations',
			event: event,
			type: 'notification',
			c_section: this.getGrid().getSectionTypeForAnalytics(),
			c_sub_section: 'deadline'
		};

		if (BX.UI.Analytics)
		{
			BX.UI.Analytics.sendData(analyticsData);

			return;
		}

		BX.Runtime.loadExtension('ui.analytics').then(function() {
			BX.UI.Analytics.sendData(analyticsData);
		});
	},

	/**
	 * Handler of the deadline chip: click on the chip or on its container, Enter on the chip.
	 * @param {Event} event
	 * @returns {void}
	 */
	handleDeadlineClick: function(event)
	{
		if (!this.canChangeDeadline)
		{
			return;
		}

		event.stopPropagation();
		this.deadlineTask();
	},

	/**
	 * The move command is offered where dragging is allowed and there is a stage to move into.
	 * The check reads the same target list openMoveMenu() builds the menu from, so a reachable
	 * button always has a menu behind it.
	 * @returns {Boolean}
	 */
	isMoveAllowed: function()
	{
		return (
			this.isDraggable()
			&& this.getGridData().kanbanType !== "TL"
			&& this.getMoveTargetColumns().length > 0
		);
	},

	/**
	 * @returns {void}
	 */
	updateMoveCommand: function()
	{
		const allowed = this.isMoveAllowed();

		this.switchVisible(this.moveButton, allowed);
		if (!allowed)
		{
			this.moveButton.setAttribute("tabindex", "-1");
			this.closeMoveMenu();
		}
	},

	/**
	 * Stages of the current grid the card may be moved to: every stage but the
	 * current one that allows sorting its items.
	 * @returns {Array}
	 */
	getMoveTargetColumns: function()
	{
		const currentColumnId = this.getColumn().getId();

		return this.getGrid().getColumns().filter(function(column) {
			return (column.getId() !== currentColumnId && column.canSortColumnItems());
		});
	},

	/**
	 * @returns {void}
	 */
	toggleMoveMenu: function()
	{
		if (this.moveMenu && this.moveMenu.isShown())
		{
			this.closeMoveMenu();

			return;
		}

		this.openMoveMenu();
	},

	/**
	 * @returns {void}
	 */
	openMoveMenu: function()
	{
		const columns = this.getMoveTargetColumns();
		if (columns.length === 0)
		{
			return;
		}

		this.destroyMoveMenu();

		// focusTrap is set explicitly: left to the environment gate, the menu takes no
		// focus at all on a customer portal
		this.moveMenu = new BX.Main.Menu({
			id: "tasks-kanban-move-menu-" + this.getId(),
			bindElement: this.moveButton,
			ariaLabel: BX.message("TASKS_KANBAN_A11Y_MOVE_MENU_LABEL"),
			focusTrap: true,
			items: columns.map(function(column) {
				return {
					text: column.getName(),
					attrs: {
						"data-testid": "tasks-kanban-stage-menu-item"
					},
					onclick: function() {
						this.moveToColumn(column);
					}.bind(this)
				};
			}, this),
			events: {
				onClose: this.handleMoveMenuClose.bind(this)
			}
		});
		this.moveMenu.getPopupWindow().getPopupContainer().setAttribute("data-testid", "tasks-kanban-stage-menu");

		this.moveButton.setAttribute("aria-expanded", "true");
		this.moveMenu.show();
	},

	/**
	 * @returns {void}
	 */
	closeMoveMenu: function()
	{
		if (this.moveMenu)
		{
			this.moveMenu.close();
		}
	},

	/**
	 * @returns {void}
	 */
	destroyMoveMenu: function()
	{
		if (this.moveMenu)
		{
			this.moveMenu.destroy();
			this.moveMenu = null;
		}
	},

	/**
	 * The stage menu keeps a popup of its own, and a popup is cacheable by default: closing
	 * it leaves both its markup and its record in the popup registry behind the removed card.
	 * @returns {void}
	 */
	dispose: function()
	{
		this.destroyMoveMenu();

		BX.Kanban.Item.prototype.dispose.apply(this, arguments);
	},

	/**
	 * @returns {void}
	 */
	handleMoveMenuClose: function()
	{
		this.moveButton.setAttribute("aria-expanded", "false");
		this.restoreFocusFromMoveMenu();
	},

	/**
	 * The focus goes back to the trigger by our own hand: neither the focus trap nor
	 * restoreLostFocus is guaranteed outside the developer stand, and the hidden
	 * button does not pass a visibility check while the menu holds the focus.
	 * @returns {void}
	 */
	restoreFocusFromMoveMenu: function()
	{
		const active = document.activeElement;
		const menuContainer = (this.moveMenu ? this.moveMenu.getPopupWindow().getPopupContainer() : null);
		const focusLeftBehind = (!active || active === document.body);

		if (!focusLeftBehind && !(menuContainer && menuContainer.contains(active)))
		{
			return;
		}

		const attached = (node) => Boolean(node && node.isConnected && node.offsetParent !== null);

		(attached(this.moveButton) ? this.moveButton : this.getContainer()).focus();
	},

	/**
	 * @returns {Boolean}
	 */
	holdsFocus: function()
	{
		return this.getContainer().contains(document.activeElement);
	},

	/**
	 * @returns {void}
	 */
	focusCard: function()
	{
		this.getContainer().focus();
	},

	/**
	 * Keyboard entrance into the move operation the mouse drop enters as well.
	 * @param {BX.Tasks.Kanban.Column} column
	 * @returns {void}
	 */
	moveToColumn: function(column)
	{
		this.closeMoveMenu();
		column.acceptItem(this);
	},

	/**
	 * Action for change author for the task.
	 * @returns {void}
	 */
	changeAuthorTask: function()
	{
		this.changeMemberTask("changeAuthorTask");
	},

	/**
	 * Action for delegate the task.
	 * @returns {void}
	 */
	delegateTask: function()
	{
		this.changeMemberTask("delegateTask");
	},

	/**
	 * Summary action for change member in the task.
	 * @param {String} action
	 * @returns {void}
	 */
	changeMemberTask: function(action)
	{
		var data = this.getData();

		var targetNode = this.responsible;
		var userId = data.responsible.id;
		var userRole = 'R';

		if (action === 'changeAuthorTask')
		{
			targetNode = this.author;
			userId = data.author.id;
			userRole = 'O';
		}

		var entities;
		if (this.isSprintView)
		{
			entities = [
				{
					id: 'scrum-user',
					options: {
						groupId: this.getGrid().getGroupId()
					},
					dynamicLoad: true
				},
				{
					id: 'department'
				}
			];
		}
		else
		{
			entities = [
				{
					id: 'user',
					options: {
						emailUsers: true,
						networkUsers: this.networkEnabled,
						extranetUsers: true,
						inviteGuestLink: true,
						myEmailUsers: true,
						analyticsSource: 'tasks',
					}
				},
				{
					id: 'department',
				}
			];
		}

		BX.loadExt('ui.entity-selector').then(function() {
			var userDialog = new BX.UI.EntitySelector.Dialog({
				targetNode: targetNode,
				enableSearch: true,
				multiple: false,
				dropdownMode: this.isSprintView,
				context: 'KANBAN_RESPONSIBLE_SELECTOR_' + action + data.id,
				preselectedItems: [
					['user', userId]
				],
				undeselectedItems: [
					['user', userId]
				],
				entities: entities,
				events: {
					'Item:onSelect': function(event) {
						const item = event.getData().item;
						const data = this.prepareUserData(item, userRole);

						this.getGrid().ajax(action, {
							taskId: this.getId(),
							columnId: this.getColumnId(),
							userId: data.id
						}).then(
							(response) => {
								const data = response.data;
								const error = response.errors.pop();

								if (data && !error)
								{
									this.getGrid().updateItem(data.id, data);
								}
								else if (error)
								{
									BX.Kanban.Utils.showErrorDialog(error.message, true);
								}
							},
							(response) => {
								const error = response.errors.pop();
								BX.Kanban.Utils.showErrorDialog("Error: " + error.message, true);
							},
						);
					}.bind(this)
				}
			});

			userDialog.show();
		}.bind(this));
	},

	prepareUserData: function(user, userRole)
	{
		const customData = user.getCustomData();
		const entityType = user.getEntityType();

		return {
			avatar: user.avatar,
			description: '',
			entityType: userRole,
			id: user.getId(),
			name: customData.get('name'),
			lastName: customData.get('lastName'),
			email: customData.get('email'),
			nameFormatted: BX.Text.encode(user.getTitle()),
			networkId: '',
			type: {
				crmemail: false,
				extranet: (entityType === 'extranet'),
				email: (entityType === 'email'),
				network: (entityType === 'network')
			}
		};
	},

	/**
	 * Get URL to task.
	 * @param {Integer} id Task id.
	 * @returns {String}
	 */
	getTaskUrl: function(id)
	{
		let link = '';
		if (parseInt(this.getGridData().groupId, 10) > 0)
		{
			link = this.getGridData().pathToGroupTask.replace("#task_id#", id);
		}
		else
		{
			link = this.getGridData().pathToTask.replace("#task_id#", id);
		}

		return BX.Uri.addParam(link, {
			ta_sec: this.getGrid().getSectionTypeForAnalytics(),
			ta_sub: this.getGrid().getKanbanTypeForAnalytics(),
			ta_el: 'title_click',
		});
	},

	isCompleted: function()
	{
		var data = this.getData();

		return data.completed;
	},

	/**
	 * Get scrum item storyPoints.
	 * @return {String}
	 */
	getStoryPoints: function()
	{
		return this.storyPoints;
	},

	/**
	 * Add or remove class for element.
	 * @param {HTMLElement} el
	 * @param {String} className
	 * @param {Boolean} mode
	 * @returns {void}
	 */
	switchClass: function(el, className, mode)
	{
		if (mode)
		{
			BX.addClass(el, className);
		}
		else
		{
			BX.removeClass(el, className);
		}
	},

	/**
	 * Show or hide element.
	 * @param {HTMLElement} el
	 * @param {Boolean} mode
	 * @returns {void}
	 */
	switchVisible: function(el, mode)
	{
		if (mode)
		{
			el.style.display = "";
		}
		else
		{
			BX.hide(el);
		}
	},

	/**
	 *
	 * @param {Element} itemNode
	 * @param {number} x
	 * @param {number} y
	 */
	onDragDrop: function(itemNode, x, y)
	{
		if(this.selectable && this.getGrid().getSelectedItems().size > 1)
		{
			return this.onDragDropMultiple();
		}

		this.hideDragTarget();
		var draggableItem = this.getGrid().getItemByElement(itemNode);

		var event = new BX.Kanban.DragEvent();
		event.setItem(draggableItem);
		event.setTargetColumn(this.getColumn());
		event.setTargetItem(this);

		BX.onCustomEvent(this.getGrid(), "Kanban.Grid:onBeforeItemMoved", [event]);
		if (!event.isActionAllowed())
		{
			this.getGrid().forgetSourcePosition(draggableItem);
			this.getColumn().announceRefusedMove(draggableItem);

			return;
		}

		// read before the completion chain opens its dialog and takes the focus away: by the
		// time the operation ends, the answer is already lost. A drop that held no focus
		// (every drop of the mouse) is given none back
		var heldFocus = (draggableItem ? draggableItem.holdsFocus() : false);

		var taskCompletePromise = new BX.Promise();

		if (
			this.isSprintView
			&& (this.getColumn().isFinishType())
			&& (!draggableItem.getColumn().isFinishType())
		)
		{
			top.BX.loadExt('tasks.scrum.dod').then(function() {
				if (typeof top.BX.Tasks.Scrum === 'undefined' || typeof top.BX.Tasks.Scrum.Dod === 'undefined')
				{
					taskCompletePromise.fulfill();
				}
				this.scrumDod = new top.BX.Tasks.Scrum.Dod({
					groupId: this.getData()['groupId'],
					taskId: draggableItem.getId()
				});
				this.scrumDod.subscribe('resolve', function() { taskCompletePromise.fulfill() });
				this.scrumDod.subscribe('reject', function() { taskCompletePromise.reject() });
				this.scrumDod.isNecessary()
					.then(function(isNecessary) {
						if (isNecessary)
						{
							this.scrumDod.showList();
						}
						else
						{
							taskCompletePromise.fulfill();
						}
					}.bind(this))
				;
			}.bind(this));
		}
		else
		{
			taskCompletePromise.fulfill();
		}

		// the rejection handler must be registered in the same then() call: BX.Promise replays
		// every fulfilment handler on each subscription made after the promise is settled
		taskCompletePromise.then(function() {
			// the first half of the focus return: moveItem re-attaches the cards of both
			// columns, and the node under focus inside the moved card drops to the body
			var success = this.getGrid().moveItem(draggableItem, this.getColumn(), this);
			if (success)
			{
				if (heldFocus)
				{
					draggableItem.focusCard();
				}

				BX.onCustomEvent(this.getGrid(), "Kanban.Grid:onItemMoved", [draggableItem, this.getColumn(), this]);
			}
			else
			{
				// the card never left its stage: the snapshot would be spent on the next rollback
				this.getGrid().forgetSourcePosition(draggableItem);
			}
		}.bind(this), function() {
			this.getGrid().forgetSourcePosition(draggableItem);
			this.getGrid().announceRejectedCompletion(draggableItem, heldFocus);
		}.bind(this));
	},

	/**
	 * Set tag to the filter.
	 * @returns {void}
	 */
	setFilterTag: function()
	{
		var tagName = BX.proxy_context.textContent.substring(1);
		var gridData = this.getGridData();
		var filterManager = BX.Main.filterManager.getById(gridData.gridId);

		filterManager.getApi().extendFilter({
			TAG: tagName,
			TAG_label: tagName
		});
	},

	/**
	 * Set epic to the filter.
	 * @returns {void}
	 */
	setFilterEpic: function(epicId)
	{
		var gridData = this.getGridData();
		var filterManager = BX.Main.filterManager.getById(gridData.gridId);

		filterManager.getApi().extendFilter({ EPIC: String(epicId) });
	},

	/**
	 * Return full node for item.
	 * @returns {HTMLElement}
	 */
	render: function()
	{
		if (!this.container)
		{
			this.createLayout();
		}

		var data = this.getData();
		var color = this.getColumn().getColor();
		var rgb = BX.util.hex2rgb(color);
		var rgba = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + ".7)";
		var formatLang = BX.message("LANGUAGE_ID");

		if (formatLang !== "en" && formatLang !== "de")
		{
			formatLang = "ru";
		}

		// border color
		//BX.style(this.container, "border-left", "3px solid " + rgba);
		this.container.style.setProperty("--tasks-kanban-item-color", rgba);
		// background
		if (data.background)
		{
			BX.style(this.containerImg, "background-image", "url(\'" + data.background + "\')");
			this.containerImg.setAttribute("href", this.getTaskUrl(this.getId()));
		}
		this.switchVisible(this.containerImg, data.background);
		// border color / item link / hot
		this.link.innerHTML = this.clipTitle(data.name);
		this.link.setAttribute(
			"href",
			this.getTaskUrl(this.getId())
		);
		this.switchClass(
			this.link,
			"tasks-kanban-item-title-hot",
			data.high
		);
		this.switchVisible(this.link, data.name !== '');
		this.getContainer().setAttribute("aria-label", data.name);

		this.updateEpic();
		this.updateTags(data.tags);

		// deadline
		this.canChangeDeadline = Boolean(data.deadline?.clickable && data.allow_change_deadline);

		this.switchClass(
			this.date_deadline_container,
			"tasks-kanban-item-pointer",
			this.canChangeDeadline,
		);
		if (!this.canChangeDeadline && this.deadlineChipNode)
		{
			this.deadlineChipNode.setAttribute("tabindex", "-1");
		}

		if (!this.isSprintView && data?.deadline_visibility !== 'hidden')
		{
			if (data.date_deadline || data.deferred || data.completed_supposedly || data.completed)
			{
				this.deadlineNotificationDate = data.deadline.value;
				this.date_deadline.setText(this.deadlineNotificationDate);
				this.date_deadline.setDesign(data.deadline.design);
			}
			else
			{
				this.deadlineNotificationDate = '';
				this.date_deadline.setText(BX.message("TASKS_KANBAN_NO_DATE"));
				this.date_deadline.setDesign(BX.UI.System.Chip.ChipDesign.Outline);
			}
		}

		// set status
		if (data.deferred)
		{
			this.setStatus("deferred");
		}
		else if (data.completed)
		{
			this.setStatus("completed");
		}
		else if (data.completed_supposedly)
		{
			this.setStatus("completed_supposedly");
		}
		else if (data.overdue)
		{
			this.setStatus("overdue");
		}
		else if (data.in_progress)
		{
			this.setStatus("in_progress");
		}
		else if (data.date_start)
		{
			this.setStatus("pause");
		}
		else if (data.new)
		{
			this.setStatus("new");
		}
		else
		{
			this.setStatus("");
		}

		// info block
		this.switchVisible(
			this.task_content,
			data.count_files > 0 || data.check_list.complete !== 0 || data.check_list.work !== 0
		);

		// new comments
		if (data.counter.value > 0)
		{
			this.task_counter.setColor(data.counter.color);
			if (Number(this.task_counter.getValue()) !== Number(data.counter.value))
			{
				this.task_counter.update(data.counter.value);
			}
		}
		this.task_counter_container.setAttribute(
			"aria-label",
			BX.message("TASKS_KANBAN_A11Y_COMMENTS_COUNTER").replace("#count#", data.counter.value)
		);
		this.switchVisible(this.task_counter_container, (data.counter.value > 0));

		//region checklist
		this.switchVisible(
			this.check_list,
			data.check_list.complete !== 0 || data.check_list.work !== 0
		);
		this.switchClass(
			this.check_list,
			"tasks-kanban-item-super-blue",
			data.log.checklist > 0
		);
		const checkListTitle = BX.message("TASKS_KANBAN_TITLE_CHECKLIST")
			.replace("#complete#", data.check_list.complete)
			.replace("#all#", (parseInt(data.check_list.complete) + parseInt(data.check_list.work)));

		this.check_list.setAttribute("title", checkListTitle);
		this.check_list.setAttribute("aria-label", checkListTitle);
		this.checkListValue.nodeValue = data.log.checklist > 0
										? "+" + data.log.checklist
										: data.check_list.complete + "/" +
										 (+data.check_list.complete + +data.check_list.work);

		// endregion

		// files
		this.switchVisible(
			this.count_files,
			data.count_files > 0
		);
		this.switchClass(
			this.count_files,
			"tasks-kanban-item-super-blue",
			data.log.file > 0
		);
		const countFilesTitle = BX.message("TASKS_KANBAN_TITLE_FILES").replace("#count#", data.count_files);

		this.count_files.setAttribute("title", countFilesTitle);
		this.count_files.setAttribute("aria-label", countFilesTitle);
		this.countFilesValue.nodeValue = data.log.file > 0
										? "+" + data.log.file
										: data.count_files;

		this.updateAuthor(data.author, data.allow_edit);
		this.updateResponsible(data.responsible, data.allow_delegate);
		this.updateMoveCommand();

		// time
		if (this.time_logs)
		{
			this.switchVisible(
				this.time_logs,
				data.time_tracking
			);
			if (data.time_tracking)
			{
				this.time_logs.textContent = parseInt(data.time_estimate) > 0
					? this.renderTime(data.time_logs) + " / " + this.renderTime(data.time_estimate, false)
					: this.renderTime(data.time_logs);
			}
			else
			{
				this.time_logs.textContent = "";
			}
		}

		// controls block
		if (!this.getGrid().isScrumGrid())
		{
			this.switchClass(
				this.container,
				'tasks-kanban-item-without-control',
				(data.completed || (!data.allow_complete && !data.allow_start))
			);
			if (this.task_start)
			{
				this.switchVisible(this.task_start, data.allow_start);
			}
			if (this.task_complete)
			{
				this.switchVisible(this.task_complete, data.allow_complete);
				if (this.getGrid().getData().kanbanType === 'P')
				{
					this.task_complete.disabled = this.getGrid().isMyPlanCompletionPending(this.getId());
				}
			}
		}

		// item fields
		BX.cleanNode(this.itemFieldsNode);
		if (data?.item_fields?.length > 0)
		{
			data.item_fields.forEach((item, index) =>
			{
				if (item?.value || item?.collection?.length > 0)
				{
					this.itemFieldsNode.appendChild(this.getItemFieldDiv(item, index));
				}
			});
		}

		// SC-005: mark item (badge after the "No deadline" date chip, see kanban.css) with the
		// ALG-02 predicate (isNewUser && no deadline && I am creator)
		this.switchClass(
			this.container,
			'tasks-kanban-item--deadlineless-hint',
			this.isDeadlinelessOwnedHint()
		);

		return this.container;
	},

	/**
	 * ALG-02 (NORMATIVE): returns true when the current user is a new user,
	 * is the task creator, and the task has no deadline.
	 * Derived from data only — no closed state is stored (AC-023).
	 * @returns {boolean}
	 */
	isDeadlinelessOwnedHint: function()
	{
		var grid = this.getGrid();
		var data = this.getData();

		// Boolean(): without author (scrum-view) the chain yields undefined, not false
		return Boolean(
			grid.isNewUser
			&& !data.date_deadline // "No deadline"
			&& data.author // guard: scrum-view may not pass the author (render():907)
			&& Number(data.author.id) === grid.currentUserId // I am the creator
			// the deadline must actually be settable on this card — the same gate that arms
			// the deadline chip click handler (deadlineTask, see render():785); otherwise the
			// badge/CTA would target a read-only chip (completed/deferred/no-permission).
			&& data.deadline && data.deadline.clickable && data.allow_change_deadline
		);
	},

	/**
	 * Show SC-005 hover popup for a deadlineless item.
	 * Suppressed under an open slider (AC-024). No closed state is persisted (AC-023).
	 * @returns {void}
	 */
	showDeadlinelessHint: function()
	{
		if (this.deadlinelessHintPopup)
		{
			return;
		}

		// AC-024: suppress under an open slider / panel
		if (
			typeof BX.SidePanel !== 'undefined'
			&& BX.SidePanel.Instance
			&& BX.SidePanel.Instance.getTopSlider
			&& BX.SidePanel.Instance.getTopSlider()
		)
		{
			return;
		}

		var item = this;

		var ctaButton = BX.create('button', {
			attrs: {
				type: 'button',
				// Q-UX-003: focusable CTA reachable by keyboard
				className: 'tasks-kanban-deadlineless-hint__cta',
				'data-testid': 'task-kanban-deadlineless-hint-cta'
			},
			text: BX.message('TASKS_KANBAN_DEADLINELESS_HINT_CTA'),
			events: {
				click: function()
				{
					// RF-10: in sprint-view/hidden date_deadline_container is absent — fall back to the row container
					var deadlineNode = item.date_deadline_container || item.container;
					// Event 2: sent before opening the calendar (ALG-02) so it survives the navigation
					item.sendDeadlinelessHintAnalytics('click_suggest_banner');
					if (item.deadlinelessHintPopup)
					{
						item.deadlinelessHintPopup.close();
					}
					item.deadlineTask(deadlineNode);
				}
			}
		});

		var closeButton = BX.create('button', {
			attrs: {
				type: 'button',
				className: 'tasks-kanban-deadlineless-hint__close',
				'data-testid': 'task-kanban-deadlineless-hint-close',
				'aria-label': BX.message('TASKS_KANBAN_DEADLINELESS_HINT_CLOSE')
			},
			html: '&times;',
			events: {
				click: function()
				{
					// Event 1: explicit dismissal via the × button
					item.sendDeadlinelessHintAnalytics('close_suggest_banner');
					if (item.deadlinelessHintPopup)
					{
						item.deadlinelessHintPopup.close();
					}
				}
			}
		});

		// RF-11: no role/aria-label here — the accessible name and role are set on the BX.Main.Popup itself
		var content = BX.create('div', {
			attrs: {
				className: 'tasks-kanban-deadlineless-hint'
			},
			children: [
				BX.create('div', { attrs: { className: 'tasks-kanban-deadlineless-hint__avatar' } }),
				BX.create('div', {
					attrs: { className: 'tasks-kanban-deadlineless-hint__body' },
					children: [
						BX.create('div', {
							attrs: { className: 'tasks-kanban-deadlineless-hint__title' },
							text: BX.message('TASKS_KANBAN_DEADLINELESS_HINT_TITLE')
						}),
						BX.create('div', {
							attrs: { className: 'tasks-kanban-deadlineless-hint__text' },
							text: BX.message('TASKS_KANBAN_DEADLINELESS_HINT_TEXT')
						}),
						ctaButton
					]
				}),
				closeButton
			]
		});

		// SC-005 Bug 2: close any previously open hint before opening a new one
		if (activeDeadlinelessHintItem && activeDeadlinelessHintItem !== this)
		{
			clearTimeout(activeDeadlinelessHintItem.deadlinelessHintCloseTimer);
			if (activeDeadlinelessHintItem.deadlinelessHintPopup)
			{
				activeDeadlinelessHintItem.deadlinelessHintPopup.close();
			}
		}

		this.deadlinelessHintPopup = new BX.Main.Popup({
			bindElement: this.date_deadline_container || this.container,
			content: content,
			// RF-11: hover hint — expose as a named live region instead of a nameless dialog
			role: 'status',
			ariaLabel: BX.message('TASKS_KANBAN_DEADLINELESS_HINT_TITLE'),
			width: 390,
			padding: 0,
			angle: true,
			background: 'var(--ui-color-bg-content-inapp, #0056bf)',
			borderRadius: 16,
			closeByEsc: true,
			autoHide: true,
			// onClose drops the reference, so a cacheable (default) popup would leak
			// a hidden container into document.body on every hover
			cacheable: false,
			offsetLeft: 40,
			className: 'tasks-kanban-deadlineless-hint-popup',
			events: {
				onClose: function()
				{
					clearTimeout(item.deadlinelessHintCloseTimer);
					item.deadlinelessHintPopup = null;
					if (activeDeadlinelessHintItem === item)
					{
						activeDeadlinelessHintItem = null;
					}
				},
				onDestroy: function()
				{
					clearTimeout(item.deadlinelessHintCloseTimer);
					item.deadlinelessHintPopup = null;
					if (activeDeadlinelessHintItem === item)
					{
						activeDeadlinelessHintItem = null;
					}
				}
			}
		});

		// SC-005 Bug 1: hover-intent — keep popup open while cursor is inside it
		var popupContainer = this.deadlinelessHintPopup.getPopupContainer();
		if (popupContainer)
		{
			popupContainer.addEventListener('mouseenter', function()
			{
				clearTimeout(item.deadlinelessHintCloseTimer);
			});
			popupContainer.addEventListener('mouseleave', function()
			{
				item.deadlinelessHintCloseTimer = setTimeout(function()
				{
					if (item.deadlinelessHintPopup)
					{
						item.deadlinelessHintPopup.close();
					}
				}, 300);
			});
		}

		// SC-005 Bug 2: register this item as the active hint
		activeDeadlinelessHintItem = this;

		this.deadlinelessHintPopup.show();
	},

	/**
	 * The column is redrawn as a whole on any card added or removed, so render() rebuilds the
	 * controls of the active card even when a neighbour card is the one that moved. The raise
	 * belongs here and not at the end of render(): the base renderLayout detaches the body,
	 * renders it and only then puts it back into the card node the grid holds as the active one.
	 * @returns {HTMLElement}
	 */
	renderLayout: function()
	{
		const container = BX.Kanban.Item.prototype.renderLayout.apply(this, arguments);

		this.getGrid().restoreCardControlsTabIndex(this);

		return container;
	},

	updateEpic: function()
	{
		if (!this.epicNode)
		{
			return;
		}

		this.switchVisible(this.epicNode, this.epic);
		if (!this.epic)
		{
			return;
		}

		this.epicNode.textContent = this.epic.name;
		this.setControlLabel(this.epicNode, "TASKS_KANBAN_A11Y_EPIC_FILTER", { "#epic#": this.epic.name });
		this.epicNode.style.background = this.convertHexToRGBA(this.epic.color, 0.3);
		this.epicNode.style.borderColor = this.convertHexToRGBA(this.epic.color, 0.7);
	},

	updateTags: function(tags)
	{
		if (!BX.type.isArray(tags))
		{
			return;
		}

		this.tagNodes.forEach((node, name) => {
			if (!tags.includes(name))
			{
				BX.remove(node);
				this.tagNodes.delete(name);
			}
		});

		let previous = null;

		tags.forEach((name) => {
			let node = this.tagNodes.get(name);
			if (!node)
			{
				node = this.createTagLayout(name);
				this.tagNodes.set(name, node);
			}

			const expected = (previous ? previous.nextSibling : this.tags.firstChild);
			if (node !== expected)
			{
				this.tags.insertBefore(node, expected);
			}

			previous = node;
		});
	},

	updateAuthor: function(user, allowEdit)
	{
		if (!this.author)
		{
			return;
		}

		this.switchVisible(this.author, user);
		if (!user)
		{
			return;
		}

		this.authorAvatar = this.syncUserAvatar(this.authorAvatar, this.authorControl, allowEdit);
		this.authorAvatar.className = this.getUserAvatarClassName(user)
			+ (user.photo ? "" : " tasks-kanban-item-author-avatar-empty");
		this.updateUserAvatar(this.authorAvatar, this.authorControl, user, allowEdit);
	},

	updateResponsible: function(user, allowDelegate)
	{
		this.switchVisible(this.responsible, user);
		if (!user)
		{
			return;
		}

		this.responsibleAvatar = this.syncUserAvatar(this.responsibleAvatar, this.responsibleControl, allowDelegate);
		this.responsibleAvatar.className = this.getUserAvatarClassName(user);
		this.updateUserAvatar(this.responsibleAvatar, this.responsibleControl, user, allowDelegate);
	},

	/**
	 * An avatar is operable only while its action is allowed: the allowed one is
	 * a button, the denied one is a picture, so a changed permission replaces
	 * the node.
	 * @param {HTMLElement} avatar
	 * @param {Object} control
	 * @param {Boolean} allowChange
	 * @returns {HTMLElement}
	 */
	syncUserAvatar: function(avatar, control, allowChange)
	{
		const operable = (avatar.tagName.toLowerCase() === "button");
		if (operable === Boolean(allowChange))
		{
			return avatar;
		}

		const node = this.createUserAvatar(control);
		avatar.parentNode.replaceChild(node, avatar);

		return node;
	},

	updateUserAvatar: function(avatar, control, user, allowChange)
	{
		avatar.title = user.name;
		avatar.style.backgroundImage = user.photo
			? "url(\'" + encodeURI(user.photo.src) + "\')"
			: "";
		avatar.style.cursor = allowChange ? "pointer" : "default";
		this.setControlLabel(
			avatar,
			allowChange ? control.phrase : control.deniedPhrase,
			{ "#name#": user.name }
		);
	},

	getUserAvatarClassName: function(user)
	{
		if (user.extranet)
		{
			return "tasks-kanban-item-author-avatar tasks-kanban-item-author-avatar-extranet";
		}

		if (user.crm)
		{
			return "tasks-kanban-item-author-avatar tasks-kanban-item-author-avatar-crm";
		}

		if (user.mail)
		{
			return "tasks-kanban-item-author-avatar tasks-kanban-item-author-avatar-mail";
		}

		if (user.collaber)
		{
			return "tasks-kanban-item-author-avatar tasks-kanban-item-author-avatar-collaber";
		}

		return "tasks-kanban-item-author-avatar";
	},

	getItemFieldDiv(item, index)
	{
		const labelId = "tasks-kanban-item-field-label-" + this.getId() + "-" + index;

		return BX.create("div", {
			props: {
				className: "tasks-kanban-item-fields-item"
			},
			children: [
				BX.create("div", {
					props: {
						className: "tasks-kanban-item-fields-item-title"
					},
					children:[
						BX.create("div", {
							attrs: {
								id: labelId
							},
							props: {
								className: "tasks-kanban-item-fields-item-title-text"
							},
							text: item?.label,
						})
					],
				}),
				BX.create("div", {
					attrs: {
						role: "group",
						"aria-labelledby": labelId,
						"data-testid": "tasks-kanban-card-field-value"
					},
					props: {
						className: "tasks-kanban-item-fields-item-value"
					},
					text: item?.value,
					html: (item?.collection?.length > 0)
						? this.getItemFieldLinks(item.collection)
						: ''
				}),
			]
		});
	},

	// the markup is rebuilt on every render, so the links carry tabindex from the
	// start: only the active card raises its controls into the tab order
	getItemFieldLinks(collection)
	{
		return collection.map((item) => {
			const url = BX.util.htmlspecialchars(item.url);
			const name = BX.util.htmlspecialchars(item.name);

			return `<a href="${url}" tabindex="-1" data-testid="tasks-kanban-card-field-link">${name}</a>`;
		}).join(' ');
	},

	animate: function(params)
	{
		var duration = params.duration;
		var draw = params.draw;

		// linear function by default, you can set non-linear animation function in timing key
		var timing = (params.timing || function(timeFraction){
			return timeFraction;
		});

		var useAnimation = ((params.useAnimation && !this.isAnimationInProgress) || false);

		var start = performance.now();

		return new Promise(
			function(resolve, reject)
			{
				if (!useAnimation)
				{
					this.isAnimationInProgress = false;
					return resolve();
				}

				var self = this;
				self.isAnimationInProgress = true;

				requestAnimationFrame(function animate(time)
				{
					var timeFraction = (time - start) / duration;
					if (timeFraction > 1)
					{
						timeFraction = 1;
					}

					var progress = timing(timeFraction);
					draw(progress);

					if (timeFraction < 1)
					{
						requestAnimationFrame(animate);
					}

					if (progress === 1)
					{
						self.isAnimationInProgress = false;
						resolve();
					}
				}.bind(this));
			}.bind(this)
		);
	},

	/**
	 * Create layout for one item.
	 * @returns {void}
	 */
	createLayout: function()
	{
		const data = this.getData();

		//region common container
		this.container = BX.create("div", {
			props: {
				className: "tasks-kanban-item"
			}
		});

		//endregion

		//region title link
		this.link = BX.create("a", {
			attrs: {
				tabindex: "-1",
				"data-testid": "tasks-kanban-card-title-link"
			},
			props: {
				className: data.counter.value > 0 ? "tasks-kanban-item-title" : "tasks-kanban-item-title tasks-kanban-item-title--with-counter"
			}
		});
		this.container.appendChild(this.link);
		this.container.appendChild(BX.Tag.render`<div class="tasks-kanban-item-line"></div>`);

		//endregion

		// region item fields
		this.itemFieldsNode = BX.create("div", {
			props: { className: "tasks-kanban-item-fields" }
		});
		this.container.appendChild(this.itemFieldsNode);

		if (this.getGrid().isScrumGrid())
		{
			//region epic
			this.epicLayout = BX.create("span", {
				props: {
					className: "tasks-kanban-item-epic-container"
				}
			});
			this.epicNode = this.createEpicLayout();
			this.epicLayout.appendChild(this.epicNode);
			this.container.appendChild(this.epicLayout);
		}

		//region tags
		this.tagNodes = new Map();
		this.tags = BX.create("span", {
			props: {
				className: "tasks-kanban-item-tags"
			}
		});
		this.container.appendChild(this.tags);

		//endregion

		//region background
		this.containerImg = BX.create("a", {
			attrs: {
				"aria-hidden": "true",
				tabindex: "-1"
			},
			props: {
				className: "tasks-kanban-item-image"
			}
		});
		this.container.appendChild(this.containerImg);

		//endregion

		//region info block
		this.task_content = BX.create("div", {
			props: { className: "tasks-kanban-item-info" }
		});
		this.container.appendChild(this.task_content);

		//endregion

		//region deadline
		if (!this.isSprintView && data.deadline_visibility !== 'hidden')
		{
			this.date_deadline = new BX.UI.System.Chip.Chip({
				text: data.deadline.value,
				design: data.deadline.design,
				rounded: true,
				size: BX.UI.System.Chip.ChipSize.Xs,
				onClick: this.handleDeadlineClick.bind(this),
			});

			// the chip has no option for tabindex, and its own value is always "0"
			this.deadlineChipNode = this.date_deadline.render();
			this.deadlineChipNode.setAttribute("tabindex", "-1");
			this.deadlineChipNode.setAttribute("data-testid", "tasks-kanban-card-deadline-chip");

			this.date_deadline_container = BX.create("div", {
				props: { className: "tasks-kanban-item-date-deadline" },
				children: [
					this.deadlineChipNode
				],
				events: {
					click: this.handleDeadlineClick.bind(this)
				}
			});
			this.container.appendChild(this.date_deadline_container);
		}

		this.checkListValue = document.createTextNode("");
		this.check_list = BX.create("div", {
			attrs: {
				// the counters of the card are read by their name alone: the role keeps the digit
				// inside out of the name, which every reading of it would otherwise repeat
				role: "img",
				"data-testid": "tasks-kanban-card-checklist"
			},
			props: {
				className: "tasks-kanban-item-checklist"
			},
			children: [
				this.checkListValue
			]
		});
		this.task_content.appendChild(this.check_list);
		this.countFilesValue = document.createTextNode("");
		this.count_files = BX.create("div", {
			attrs: {
				role: "img",
				"data-testid": "tasks-kanban-card-files"
			},
			props: {
				className: "tasks-kanban-item-files"
			},
			children: [
				this.countFilesValue
			]
		});
		this.task_content.appendChild(this.count_files);

		this.actions_container = BX.create("div", {
			props: {
				className: "tasks-kanban-actions-container"
			}
		});
		this.container.appendChild(this.actions_container);

		//endregion

		//region user block
		this.user_container = BX.create("div", {
			props: {
				className: "tasks-kanban-item-users"
			}
		});
		this.actions_container.appendChild(this.user_container);

		if (!this.isSprintView)
		{
			this.authorControl = {
				permission: "allow_edit",
				action: this.changeAuthorTask,
				phrase: "TASKS_KANBAN_A11Y_AUTHOR_CHANGE",
				deniedPhrase: "TASKS_KANBAN_A11Y_AUTHOR",
				testId: "tasks-kanban-card-author"
			};
			this.authorAvatar = this.createUserAvatar(this.authorControl);
			this.author = this.createUserContainer("tasks-kanban-item-author", this.authorAvatar);
			this.user_container.appendChild(this.author);
		}

		this.responsibleControl = {
			permission: "allow_delegate",
			action: this.delegateTask,
			phrase: "TASKS_KANBAN_A11Y_RESPONSIBLE_CHANGE",
			deniedPhrase: "TASKS_KANBAN_A11Y_RESPONSIBLE",
			testId: "tasks-kanban-card-responsible"
		};
		this.responsibleAvatar = this.createUserAvatar(this.responsibleControl);
		this.responsible = this.createUserContainer(
			this.isSprintView ? "tasks-kanban-item-responsible-sprint" : "tasks-kanban-item-responsible",
			this.responsibleAvatar
		);
		this.user_container.appendChild(this.responsible);

		// the move command lives outside the quick actions block: that block is not
		// created for a scrum card, where story points take its place
		this.moveButton = BX.create("button", {
			attrs: {
				type: "button",
				tabindex: "-1",
				"aria-haspopup": "menu",
				"aria-expanded": "false",
				"data-testid": "tasks-kanban-card-move-btn"
			},
			props: {
				className: "tasks-kanban-item-move"
			},
			events: {
				click: BX.delegate(function(e) {
					this.toggleMoveMenu();
					e.stopPropagation();
				}, this)
			}
		});
		this.setControlName(this.moveButton, "TASKS_KANBAN_A11Y_MOVE_BUTTON");
		this.user_container.appendChild(this.moveButton);

		//endregion

		if (!this.getGrid().isScrumGrid())
		{
			//region  time
			this.time_logs = BX.create("div", {
				props: {
					className: "tasks-kanban-item-timelogs"
				}
			});
			this.actions_container.appendChild(this.time_logs);

			//endregion

			this.track_control = BX.create("div", {
				props: {
					className: "tasks-kanban-item-control"
				}
			});
			this.container.appendChild(this.track_control);

			this.task_mute = BX.create("button", {
				attrs: {
					type: "button",
					tabindex: "-1",
					"data-testid": "tasks-kanban-card-mute-btn"
				},
				props: {
					className: "tasks-kanban-task-mute"
				},
				events: {
					click: function (e)
					{
						this.muteTask();
						e.stopPropagation();
					}.bind(this)
				}
			});
			// BX.hide(this.task_mute);
			this.track_control.appendChild(this.task_mute);

			this.task_start = BX.create("button", {
				attrs: {
					type: "button",
					tabindex: "-1",
					"data-testid": "tasks-kanban-card-start-btn"
				},
				props: {
					className: "tasks-kanban-task-start"
				},
				events: {
					click: function (e)
					{
						this.startTask();
						e.stopPropagation();
					}.bind(this)
				}
			});
			this.track_control.appendChild(this.task_start);

			this.task_complete = BX.create("button", {
				attrs: {
					type: "button",
					tabindex: "-1",
					"data-testid": "tasks-kanban-card-complete-btn"
				},
				props: {
					className: "tasks-kanban-task-complete"
				},
				events: {
					click: function (e)
					{
						this.completeTask();
						e.stopPropagation();
					}.bind(this)
				}
			});
			this.setControlName(this.task_complete, "TASKS_KANBAN_TITLE_COMPLETE");
			this.track_control.appendChild(this.task_complete);
		}
		else
		{
			this.storyPointsNode = BX.create('div', {
				attrs: {
					role: 'img',
					'data-testid': 'tasks-kanban-card-story-points'
				},
				props: {
					className: 'tasks-kanban-item-story-points',
					title: BX.message('TASKS_KANBAN_ITEM_STORY_POINTS_TITLE')
				},
				text: this.getDataKey('storyPoints'),
			});
			this.setControlLabel(
				this.storyPointsNode,
				"TASKS_KANBAN_A11Y_STORY_POINTS",
				{ "#points#": this.getDataKey('storyPoints') }
			);

			this.container.appendChild(this.storyPointsNode);
		}

		//endregion

		//region Counters
		this.task_counter = new BX.UI.Counter({
			value: data.counter.value,
			color: data.counter.color,
			animate: true
		});
		this.task_counter_container = BX.create("div", {
			attrs: {
				role: "img",
				"data-testid": "tasks-kanban-card-comments"
			},
			props: {
				className: "tasks-kanban-task-counter",
			},
			children: [
				this.task_counter.getContainer()
			]
		});
		this.container.appendChild(this.task_counter_container);

		//endregion

		//region hover / shadow
		this.container.appendChild(this.createShadow());
		this.container.addEventListener("mouseenter", function()
		{
			this.addHoverClass(this.container);
			// SC-005 Bug 1: cancel any pending close when re-entering the card
			clearTimeout(this.deadlinelessHintCloseTimer);
			// SC-005: show deadlineless hint popup on highlighted item (AC-024)
			if (this.isDeadlinelessOwnedHint())
			{
				this.showDeadlinelessHint();
			}
		}.bind(this));
		this.container.addEventListener("mouseleave", function ()
		{
			this.removeHoverClass(this.container);
			// SC-005 Bug 1: schedule close with hover-intent delay so user can reach popup
			if (this.deadlinelessHintPopup)
			{
				this.deadlinelessHintCloseTimer = setTimeout(function()
				{
					if (this.deadlinelessHintPopup)
					{
						this.deadlinelessHintPopup.close();
					}
				}.bind(this), 300);
			}
		}.bind(this), false);

		//endregion

		// SC-005: track popup reference and close-timer for this item
		this.deadlinelessHintPopup = null;
		this.deadlinelessHintCloseTimer = null;
	},

	dispose: function()
	{
		clearTimeout(this.deadlinelessHintCloseTimer);

		if (this.deadlinelessHintPopup)
		{
			this.deadlinelessHintPopup.destroy();
			this.deadlinelessHintPopup = null;
		}

		if (activeDeadlinelessHintItem === this)
		{
			activeDeadlinelessHintItem = null;
		}

		BX.Kanban.Item.prototype.dispose.apply(this, arguments);
	},

	createUserAvatar: function(control)
	{
		if (!this.getData()[control.permission])
		{
			return BX.create("div", {
				attrs: {
					role: "img",
					"data-testid": control.testId
				}
			});
		}

		return BX.create("button", {
			attrs: {
				type: "button",
				tabindex: "-1",
				"data-testid": control.testId
			},
			events: {
				click: BX.delegate(function(e) {
					if (!this.getData()[control.permission])
					{
						return;
					}

					control.action.call(this);
					e.stopPropagation();
				}, this)
			}
		});
	},

	createUserContainer: function(className, avatar)
	{
		return BX.create("div", {
			props: {
				className: className,
				style: "cursor: pointer"
			},
			children: [
				avatar
			]
		});
	},

	createTagLayout: function(name)
	{
		const inner = BX.create("button", {
			attrs: {
				type: "button",
				tabindex: "-1",
				"data-testid": "tasks-kanban-card-tag-btn"
			},
			props: {
				className: "ui-label-inner"
			},
			text: "#" + name,
			events: {
				click: BX.delegate(function(e) {
					this.setFilterTag();
					e.stopPropagation();
				}, this)
			}
		});
		this.setControlLabel(inner, "TASKS_KANBAN_A11Y_TAG_FILTER", { "#tag#": name });

		return BX.create("span", {
			props: {
				className: "ui-label ui-label-tag-light ui-label-fill ui-label-md ui-label-link"
			},
			children: [
				inner
			]
		});
	},

	/**
	 * Add shadow to item.
	 * @returns {HTMLElement}
	 */
	createShadow: function ()
	{
		return BX.create("div", {
			props: { className: "tasks-kanban-item-shadow" }
		});
	},

	/**
	 * @returns {HTMLElement}
	 */
	getContainer: function()
	{
		if (this.layout.container !== null)
		{
			return this.layout.container;
		}

		this.layout.container = BX.create("div", {
			attrs: {
				className: "main-kanban-item",
				role: "listitem",
				tabindex: "-1",
				"data-id": this.getId(),
				"data-type": "item",
				"data-testid": "tasks-kanban-card"
			},
			children: [
				this.getDragTarget(),
				this.getBodyContainer()
			]
		});

		this.makeDraggable();
		this.makeDroppable();

		if(this.grid.firstRenderComplete && !this.draftContainer)
		{
			this.layout.container.classList.add("main-kanban-item-new");
			const cleanAnimate = () => {
				this.layout.container.classList.remove('main-kanban-item-new');
				this.getBodyContainer().removeEventListener('animationend', cleanAnimate);
			};
			this.getBodyContainer().addEventListener("animationend", cleanAnimate);
		}

		return this.layout.container;
	},

	/**
	 * Add hover to item.
	 * @param {HTMLElement} itemBlock
	 * @returns {void}
	 */
	addHoverClass: function (itemBlock)
	{
		this.timer = setTimeout(function ()
		{
			itemBlock.classList.add("tasks-kanban-item-hover");
		}, 150);
	},

	/**
	 * Remove hover from item.
	 * @param {HTMLElement} itemBlock
	 * @returns {void}
	 */
	removeHoverClass: function (itemBlock)
	{
		clearTimeout(this.timer);
		itemBlock.classList.remove("tasks-kanban-item-hover");
	},

	createEpicLayout: function ()
	{
		return BX.create("button", {
			attrs: {
				type: "button",
				tabindex: "-1",
				"data-testid": "tasks-kanban-card-epic-btn"
			},
			props: {
				className: "tasks-kanban-item-epic"
			},
			events: {
				click: BX.delegate(function(e) {
					if (!this.epic)
					{
						return;
					}

					this.setFilterEpic(this.epic.id);
					e.stopPropagation();
				}, this)
			}
		});
	},

	convertHexToRGBA: function (hexCode, opacity)
	{
		let hex = hexCode.replace('#', '');

		if (hex.length === 3)
		{
			hex = String(hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]);
		}

		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);

		return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
	}
};

})();
