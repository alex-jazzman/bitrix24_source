(function() {

	"use strict";

	BX.namespace("BX.Tasks.Kanban");

	/**
	 *
	 * @param options
	 * @extends {BX.Kanban.Column}
	 * @constructor
	 */
	BX.Tasks.Kanban.Column = function(options)
	{
		BX.Kanban.Column.apply(this, arguments);

		this.sortButton = null;
		this.namedAddItemButton = null;
		this.namedContainer = null;

		this.type = (options.type ? options.type : '');
		this.viewStateName = options.viewStateName || 'kanban';
	};

	BX.Tasks.Kanban.Column.prototype = {
		__proto__: BX.Kanban.Column.prototype,
		constructor: BX.Tasks.Kanban.Column,

		/**
		 * Customize title buttons.
		 * @returns {DOMNode}
		 */
		getCustomTitleButtons: function ()
		{
			if (this.getGridData().showSortButton)
			{
				this.sortButton = BX.create("div", {
					props: {
						className: "tasks-kanban-column-sort"
					},
					events: {
						click: this.handleSortButtonClick.bind(this)
					}
				});

				return this.sortButton;
			}
		},

		isRemovable: function()
		{
			if (this.getGrid().isScrumGrid())
			{
				return (!this.isFinishType() && !this.isNewType())
			}

			return BX.Kanban.Column.prototype.isRemovable.call(this);
		},

		/**
		 *
		 * @param {Element} itemNode
		 * @param {number} x
		 * @param {number} y
		 */
		onDragDrop: function(itemNode, x, y)
		{
			if(this.getGrid().isMultiSelect() && this.getGrid().getSelectedItems().size > 1)
			{
				return this.onDragDropMultiple();
			}

			this.hideDragTarget();

			this.acceptItem(this.getGrid().getItemByElement(itemNode));
		},

		/**
		 * Moves the item to the end of this column.
		 * @param {BX.Tasks.Kanban.Item} item
		 * @returns {void}
		 */
		acceptItem: function(item)
		{
			var event = new BX.Kanban.DragEvent();
			event.setItem(item);
			event.setTargetColumn(this);

			BX.onCustomEvent(this.getGrid(), "Kanban.Grid:onBeforeItemMoved", [event]);
			if (!event.isActionAllowed())
			{
				this.getGrid().forgetSourcePosition(item);
				this.announceRefusedMove(item);

				return;
			}

			// read before the completion chain opens its dialog and takes the focus away: by the
			// time the operation ends, the answer is already lost. A drop that held no focus
			// (every drop of the mouse) is given none back
			var heldFocus = (item ? item.holdsFocus() : false);

			var taskCompletePromise = new BX.Promise();

			if (
				item.isSprintView
				&& this.isFinishType()
				&& (!item.getColumn().isFinishType())
			)
			{
				top.BX.loadExt('tasks.scrum.dod').then(function() {
					if (typeof top.BX.Tasks.Scrum === 'undefined' || typeof top.BX.Tasks.Scrum.Dod === 'undefined')
					{
						taskCompletePromise.fulfill();
					}
					this.scrumDod = new top.BX.Tasks.Scrum.Dod({
						groupId: item.getData()['groupId'],
						taskId: item.getId()
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
				var success = this.getGrid().moveItem(item, this);
				if (success)
				{
					if (heldFocus)
					{
						item.focusCard();
					}

					BX.onCustomEvent(this.getGrid(), "Kanban.Grid:onItemMoved", [item, this, null]);
				}
				else
				{
					// the card never left its stage: the snapshot would be spent on the next rollback
					this.getGrid().forgetSourcePosition(item);
				}
			}.bind(this), function() {
				this.getGrid().forgetSourcePosition(item);
				this.getGrid().announceRejectedCompletion(item, heldFocus);
			}.bind(this));
		},

		/**
		 * A refused move into the final stage is not a refusal: the completion chain has taken the
		 * operation over - the checklist chain of acceptItem() on this template, or the
		 * FinishMoveController of the scrum template, which denies the event and performs the move
		 * itself. Every other refusal is told without a reason: the drag event carries none.
		 * A drop that resolved to no card has nothing to tell about.
		 * @param {BX.Tasks.Kanban.Item|null} item
		 * @returns {void}
		 */
		announceRefusedMove: function(item)
		{
			const sourceColumn = (item ? item.getColumn() : null);
			if (!sourceColumn || (this.isFinishType() && !sourceColumn.isFinishType()))
			{
				return;
			}

			this.getGrid().announce(
				this.getGrid().moveMessage("TASKS_KANBAN_A11Y_MOVE_DENIED", item, this),
				"assertive"
			);
		},

		isFinishType: function()
		{
			return (this.getType() === 'FINISH');
		},

		isNewType: function()
		{
			return (this.getType() === 'NEW');
		},

		/**
		 * Hook on sort column button.
		 * @param {MouseEvent} event
		 * @returns {void}
		 */
		handleSortButtonClick: function(event)
		{
			var menuItems = this.getGridData().sortMenuItems;
			BX.PopupMenu.show("tasks-kanban-column-sort-" + this.getId(), this.sortButton, menuItems, {});
		},

		setGrid: function(grid)
		{
			BX.Kanban.Column.prototype.setGrid.call(this, grid);

			BX.addCustomEvent(this.getGrid(), "Kanban.Grid:onItemDragStop", function() {
				if(this.getGrid().isRealtimeMode() || this.getGrid().isFieldSortMode())
				{
					this.hideDragTarget();
				}
			}.bind(this));
		},

		handleConfirmButtonClick: function()
		{
			var confirmDialog = this.getConfirmDialog();
			var removeButton = confirmDialog.getButton("main-kanban-confirm-remove-button");
			if (removeButton.getContainer().classList.contains("popup-window-button-wait"))
			{
				//double click protection
				return;
			}

			removeButton.addClassName("popup-window-button-wait");

			var promise = this.getGrid().getEventPromise(
				"Kanban.Grid:onColumnRemovedAsync",
				null,
				function(result) {

					if (this.getGrid().isGroupingMode())
					{
						this.getGrid().removeColumnsByIdFromNeighborGrids(this.getId());
					}

					this.getGrid().removeColumn(this);
					removeButton.removeClassName("popup-window-button-wait");
					confirmDialog.close();

				}.bind(this),
				function(error) {
					confirmDialog.setContent(error);
					removeButton.getContainer().style.display = "none";
				}.bind(this)
			);

			promise.fulfill(this);
		},

		/**
		 * Hook on add column button.
		 * @param {MouseEvent} event
		 * @returns {void}
		 */
		handleAddColumnButtonClick: function(event)
		{
			const gridData = this.getGridData();
			// if no access, show access-query popup
			if (
				gridData.rights &&
				gridData.rights.canAddColumn
			)
			{
				const newColumn = this.getGrid().addColumn({
					id: 'kanban-new-column-' + BX.util.getRandomString(5),
					type: 'BX.Tasks.Kanban.DraftColumn',
					canSort: false,
					canAddItem: false,
					droppable: false,
					targetId: this.getGrid().getNextColumnSibling(this),
					animate: 'slide-left'
				});

				newColumn.switchToEditMode();
			}
			else if (typeof BX.Intranet !== "undefined")
			{
				this.getGrid().accessNotify();
			}
		},

		/**
		 * Switch from view to edit mode (column).
		 * @returns {void}
		 */
		switchToEditMode: function()
		{
			const gridData = this.getGridData();
			// if no access, show access-query popup
			if (
				gridData.rights &&
				gridData.rights.canAddColumn
			)
			{
				BX.Kanban.Column.prototype.switchToEditMode.apply(this, arguments);
			}
			else if (typeof BX.Intranet !== "undefined")
			{
				this.getGrid().accessNotify();
			}
		},

		/**
		 * Handler on new item add button.
		 * @param {event} event
		 * @returns {void}
		 */
		handleAddItemButtonClick: function(event)
		{
			const gridData = this.getGridData();

			let section = 'tasks';
			let subSection = 'kanban';

			switch (gridData.kanbanType)
			{
				case 'TL':
					subSection = 'deadline';
					break;
				case 'P':
					subSection = 'planner';
					break;
				case 'K':
					subSection = 'kanban';
					break;
			}

			if (gridData.params.SPRINT_ID > 0)
			{
				section = 'scrum';
			}
			else if (
				parseInt(gridData.groupId, 10) > 0
				&& gridData.params.SPRINT_ID < 0
			)
			{
				section = 'project';
			}

			if (gridData.addItemInSlider === true && BX.SidePanel.Instance)
			{
				const path = BX.Uri.addParam(gridData.pathToTaskCreate.replace('#task_id#', 0), {
					ta_sec: section,
					ta_sub: subSection,
					ta_el: 'quick_button',
				});

				BX.SidePanel.Instance.open(path);
			}
			else
			{
				BX.Kanban.Column.prototype.handleAddItemButtonClick.apply(this, arguments);

				const analyticsData = {
					tool: 'tasks',
					category: 'task_operations',
					type: 'quick_task',
					event: 'click_create',
					c_section: section,
					c_sub_section: subSection,
					c_element: 'quick_button',
				};

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
			}
		},

		/**
		 * Handler on new item add button pressed from the keyboard.
		 * @param {KeyboardEvent} event
		 * @returns {void}
		 */
		handleAddItemButtonKeydown: function(event)
		{
			if (event.key !== "Enter" && event.key !== " ")
			{
				return;
			}

			event.preventDefault();
			this.handleAddItemButtonClick(event);
		},

		getContainer: function()
		{
			var container = BX.Kanban.Column.prototype.getContainer.call(this);

			if (container !== this.namedContainer)
			{
				this.namedContainer = container;

				container.setAttribute("role", "group");
				container.setAttribute("aria-labelledby", this.getTitleContainer().id);
				container.setAttribute("data-testid", "tasks-kanban-column");
			}

			return container;
		},

		getTitleContainer: function()
		{
			if (this.layout.title)
			{
				return this.layout.title;
			}

			const isTitleNamed = (this.isScrumGridHeader() || !this.isScrumGrid());

			this.layout.title = BX.create("div", {
				attrs: {
					id: "tasks-kanban-column-title-" + BX.util.getRandomString(5),
					className: (isTitleNamed ? "main-kanban-column-title" : ""),
					"data-testid": "tasks-kanban-column-title"
				}
			});

			if (isTitleNamed)
			{
				this.layout.title.setAttribute("tabindex", "-1");
			}

			return this.layout.title;
		},

		getSubTitle: function()
		{
			if (this.isScrumGridHeader())
			{
				this.layout.subTitle = document.createElement('div');

				return this.layout.subTitle;
			}
			else
			{
				return BX.Kanban.Column.prototype.getSubTitle.call(this);
			}
		},

		renderSubTitle: function()
		{
			const subTitle = BX.Kanban.Column.prototype.renderSubTitle.call(this);

			const button = subTitle.querySelector(".main-kanban-column-add-item-button");
			const name = this.getGrid().getAddItemTitleText();

			// the visible text is a width-animated wrapper, so the name is given explicitly
			if (button && name && button !== this.namedAddItemButton)
			{
				this.namedAddItemButton = button;

				button.setAttribute("role", "button");
				button.setAttribute("aria-label", name);
				button.setAttribute("tabindex", "-1");
				button.setAttribute("data-testid", "tasks-kanban-column-add-btn");
				BX.bind(button, "keydown", this.handleAddItemButtonKeydown.bind(this));
			}

			return subTitle;
		},

		renderTitle: function()
		{
			if (this.isScrumGridHeader())
			{
				this.getContainer().classList.add("main-kanban-column-scrum");
			}

			var titleBody;

			if ((this.isScrumGridHeader() || !this.isScrumGrid()))
			{
				titleBody = BX.Kanban.Column.prototype.renderTitle.call(this);
			}
			else
			{
				titleBody = document.createElement('div');
			}

			this.getTitleContainer().setAttribute(
				"aria-label",
				BX.message("TASKS_KANBAN_A11Y_COLUMN_LABEL")
				.replace("#stage#", this.getName())
				.replace("#count#", this.getTotal())
			);

			return titleBody;
		},

		getBody: function()
		{
			if (this.isScrumGridHeader())
			{
				this.layout.body = document.createElement('div');

				this.layout.items = this.getItemsContainer();

				return this.layout.body;
			}
			else
			{
				return BX.Kanban.Column.prototype.getBody.call(this);
			}
		},

		/**
		 *
		 * @returns {Element}
		 */
		getDefaultTitleLayout: function()
		{
			if (this.layout.titleBody)
			{
				return this.layout.titleBody;
			}

			var customButtons = this.getCustomTitleButtons();
			var gridData = this.getGrid().getData();

			if (BX.type.isDomNode(customButtons))
			{
				customButtons = [customButtons];
			}
			else if (!BX.type.isArray(customButtons))
			{
				customButtons = [];
			}

			this.layout.titleBody = BX.create("div", {
				attrs: {
					className: "main-kanban-column-title-wrapper"
				},
				children: [
					this.layout.color = BX.create("div", {
						attrs: {
							className: "main-kanban-column-title-bg",
							style: "background: #" + this.getColor()
						}
					}),
					this.layout.info = BX.create("div", {
						attrs: {
							className: "main-kanban-column-title-info"
						},
						children: [

							this.layout.name = BX.create("div", {
								attrs: {
									className: "main-kanban-column-title-text"
								},
								children: [
									this.getColumnTitle(),
									this.getTotalItem()
								]
							}),

							this.isEditable() ? this.getEditButton() : null
						].concat(customButtons)
					}),

					this.isEditable() ? this.getEditForm() : null,

					this.layout.titleArrow = BX.create("span", {
						attrs: {
							className: "main-kanban-column-title-right"

						}
					})
				]});

			if(gridData.kanbanType === "TL")
			{
				this.layout.titleBody.classList.add("task-kanban-column-revert")
			}

			return this.layout.titleBody;
		},

		getType: function()
		{
			return this.type;
		},

		/**
		 * @returns {BX.Tasks.Kanban.Grid}
		 */
		getGrid: function()
		{
			return this.grid;
		},

		getAddColumnButton: function ()
		{
			if (this.isScrumGrid() && !this.isScrumGridHeader())
			{
				return document.createElement('div');
			}
			else
			{
				return BX.Kanban.Column.prototype.getAddColumnButton.call(this);
			}
		},

		getItemsContainer: function()
		{
			if (this.isScrumGrid() && this.isScrumGridHeader())
			{
				return document.createElement('div');
			}
			else
			{
				var itemsContainer = BX.Kanban.Column.prototype.getItemsContainer.call(this);

				itemsContainer.setAttribute("role", "list");
				itemsContainer.setAttribute("data-testid", "tasks-kanban-column-list");

				return itemsContainer;
			}
		},

		isScrumGrid: function()
		{
			return this.getGrid().isScrumGrid();
		},

		isScrumGridHeader: function()
		{
			return this.getGrid().isScrumGridHeader();
		},

		addDraftItem: function(targetItem)
		{
			const draftItem = BX.Kanban.Column.prototype.addDraftItem.call(this, targetItem);

			if (draftItem)
			{
				draftItem.getContainer().setAttribute("role", "listitem");
			}

			return draftItem;
		},

		addItem: function(item, beforeItem)
		{
			BX.Kanban.Column.prototype.addItem.call(this, item, beforeItem);

			if (item.isCountable())
			{
				this.updateHeaderColumn();
			}
		},

		removeItem: function(itemToRemove)
		{
			BX.Kanban.Column.prototype.removeItem.call(this, itemToRemove);

			if (itemToRemove.isCountable())
			{
				this.updateHeaderColumn();
			}
		},

		updateHeaderColumn: function()
		{
			if (this.isScrumGrid())
			{
				this.getGrid().getNeighborGrids()
					.forEach(function(neighborGrid) {
						if (neighborGrid.isScrumGridHeader())
						{
							neighborGrid.updateTotals();
						}
					}.bind(this))
				;
			}
		}
	};

	BX.Tasks.Kanban.DraftColumn = function(options)
	{
		BX.Kanban.DraftColumn.apply(this, arguments);
	};

	BX.Tasks.Kanban.DraftColumn.prototype = {
		__proto__: BX.Kanban.DraftColumn.prototype,
		constructor: BX.Tasks.Kanban.DraftColumn,
		isScrumGridHeader: function()
		{
			return this.getGrid().isScrumGridHeader();
		},
		applyEditMode: function()
		{
			if (this.asyncEventStarted)
			{
				return;
			}

			var title = BX.util.trim(this.getTitleTextBox().value);
			if (!title.length)
			{
				title = this.getGrid().getMessage("COLUMN_TITLE_PLACEHOLDER");
			}

			this.setName(title);
			this.getContainer().classList.add("main-kanban-column-disabled");
			this.getTitleTextBox().disabled = true;

			this.asyncEventStarted = true;
			var promise = this.getGrid().getEventPromise(
				"Kanban.Grid:onColumnAddedAsync",
				null,
				function(result) {

					if (!BX.Kanban.Utils.isValidId(result.targetId))
					{
						var targetColumn = this.getGrid().getNextColumnSibling(this);
						if (targetColumn)
						{
							result.targetId = targetColumn.getId();
						}
					}

					if (this.getGrid().isGroupingMode())
					{
						this.getGrid().getNeighborGrids().forEach(function(neighborGrid) {
							neighborGrid.addColumn(result);
						});
					}

					this.getGrid().removeColumn(this);
					this.getGrid().addColumn(result);

				}.bind(this),
				function(error) {

					this.getGrid().removeColumn(this);

				}.bind(this)
			);

			promise.fulfill(this);
		},
		getSubTitle: function()
		{
			if (this.isScrumGridHeader())
			{
				this.layout.subTitle = document.createElement('div');

				return this.layout.subTitle;
			}
			else
			{
				return BX.Kanban.Column.prototype.getSubTitle.call(this);
			}
		},
		getBody: function()
		{
			if (this.isScrumGridHeader())
			{
				this.layout.body = document.createElement('div');

				this.layout.items = this.getItemsContainer();

				return this.layout.body;
			}
			else
			{
				return BX.Kanban.Column.prototype.getBody.call(this);
			}
		},
	};

})();
