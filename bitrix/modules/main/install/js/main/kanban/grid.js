;(function() {

"use strict";

/**
 * Keyboard navigation and accessible names of the board (getBoardAriaLabel,
 * withMatrix, moveEntryPoint, normalizeTabIndex, activate and the item hooks
 * getFocusableNode, refreshAriaLabel, getItemAriaLabel) are covered by unit
 * tests that live in another module: crm/install/js/crm/kanban/tests/unit/.
 * This extension is legacy and has no bundle config of its own, so it cannot
 * host a chef test suite; crm.kanban loads it as a dependency and takes the
 * classes from the BX namespace exactly as the product does.
 *
 * Run them when changing this file:
 *   chef test unit crm.kanban --project chromium
 *
 * The same code also backs the kanban boards of tasks, rpa and
 * crm.sales.tunnels, which have no coverage of their own.
 */

BX.namespace("BX.Kanban");

/**
 *
 * @param {object} options
 * @param {Element} options.renderTo
 * @param {BX.Kanban.Column[]} [options.columns]
 * @param {BX.Kanban.Item[]} [options.items]
 * @param {BX.Kanban.DropZone[]} [options.dropzones]
 * @param {object} [options.events]
 * @param {string} [options.itemType]
 * @param {string} [options.columnType]
 * @param {boolean} [options.canAddColumn]
 * @param {boolean} [options.canEditColumn]
 * @param {boolean} [options.canSortColumn]
 * @param {boolean} [options.canRemoveColumn]
 * @param {boolean} [options.canAddItem]
 * @param {boolean} [options.canSortItem]
 * @param {string} [options.dropZoneType]
 * @param {number} [options.dropZoneTimeout]
 * @param {string} [options.bgColor]
 * @param {object} [options.data] Custom Data For Grid
 * @param {object} [options.messages] Custom Messages For Grid
 * @param {boolean} [options.multiSelect]
 * @constructor
 */
BX.Kanban.Grid = function(options)
{
	if (!BX.type.isPlainObject(options))
	{
		throw new Error("BX.Kanban.Grid: 'options' is not an object.");
	}

	this.options = options;

	if (!BX.type.isDomNode(options.renderTo))
	{
		throw new Error("BX.Kanban.Grid: 'renderTo' is not a DOMNode.");
	}

	this.renderTo = options.renderTo;
	this.rendered = false;

	this.layout = {
		outerContainer: null,
		innerContainer: null,
		gridContainer: null,
		earLeft: null,
		earRight: null,
		emptyStub: null,
		loader: null,
		leftShadow: null,
		rightShadow: null
	};

	this.emptyStubItems = options.emptyStubItems;
	this.itemType = this.getItemType(options.itemType);
	this.columnType = this.getColumnType(options.columnType);

	this.messages = BX.type.isPlainObject(options.messages) ? options.messages : Object.create(null);

	this.columns = Object.create(null);
	this.columnsOrder = [];

	/** @type {Object.<string, BX.Kanban.Item>} */
	this.items = Object.create(null);

	this.data = BX.type.isPlainObject(options.data) ? options.data : Object.create(null);
	this.bgColor =
		BX.Kanban.Utils.isValidColor(options.bgColor) || options.bgColor === "transparent" ? options.bgColor : "ffffff";

	this.earTimer = null;
	this.firstRenderComplete = null;
	this.dragMode = BX.Kanban.DragMode.NONE;

	this.keyboardNavigation = new BX.Kanban.KeyboardNavigation(this);

	this.multiSelect = options.multiSelect;
	this.ahaMode = null;
	this.selectedItems = [];
	this.addItemTitleText = options.addItemTitleText;
	this.addDraftItemInfo = options.addDraftItemInfo;
	this.columnsRevert = options.columnsRevert;

	/** @private **/
	this.canAddColumn = false;
	/** @private **/
	this.canEditColumn = false;
	/** @private **/
	this.canSortColumn = false;
	/** @private **/
	this.canRemoveColumn = false;
	/** @private **/
	this.canAddItem = false;
	/** @private **/
	this.canSortItem = false;

	this.dropZoneArea = new BX.Kanban.DropZoneArea(this, {
		dropZoneType: options.dropZoneType,
		dropZoneTimeout: options.dropZoneTimeout
	});

	this.data = Object.create(null);
	this.setData(options.data);

	this.loadData(options);

	if (options.events)
	{
		for (var eventName in options.events)
		{
			if (options.events.hasOwnProperty(eventName))
			{
				BX.addCustomEvent(this, eventName, options.events[eventName]);
			}
		}
	}

	this.bindEvents();

	BX.addCustomEvent(this, "Kanban.Grid:onItemDragStart", BX.delegate(this.onItemDragStart, this));
	BX.addCustomEvent(this, "Kanban.Grid:onItemsDragStart", BX.delegate(this.onItemDragStart, this));
	BX.addCustomEvent(this, "Kanban.Grid:onItemDragStop", BX.delegate(this.onItemDragStop, this));
	BX.addCustomEvent(this, "Kanban.Grid:onColumnDragStart", BX.delegate(this.onColumnDragStart, this));
	BX.addCustomEvent(this, "Kanban.Grid:onColumnDragStop", BX.delegate(this.onColumnDragStop, this));

	if(this.multiSelect)
	{
		BX.addCustomEvent(this, "Kanban.Item:select", this.addSelectedItem.bind(this));
		BX.addCustomEvent(this, "Kanban.Item:select", this.adjustMultiSelectMode.bind(this));
		BX.addCustomEvent(this, "Kanban.Item:unSelect", this.removeSelectedItem.bind(this));
		BX.addCustomEvent(this, "Kanban.Item:unSelect", this.adjustMultiSelectMode.bind(this));
		window.addEventListener('keydown', function(event) {
			if(BX.Kanban.Utils.getKeyDownName(event.keyCode) === "Escape" && this.getSelectedItems().length > 0)
			{
				this.cleanSelectedItems();
				this.adjustMultiSelectMode();
				BX.PreventDefault(event);
			}
		}.bind(this));
		window.addEventListener('click', function(event) {
			if(
				BX.findParent(event.target, {attr: {"data-element": "kanban-element"}})
				|| event.target.getAttribute("data-element") === "kanban-element"
			)
			{
				return;
			}

			this.cleanSelectedItems();
			this.adjustMultiSelectMode();
		}.bind(this));
	}
};

/**
 *
 * @enum {number}
 */
BX.Kanban.DragMode = {
	NONE: 0,
	ITEM: 1,
	COLUMN: 2
};

BX.Kanban.Grid.prototype =
{
	/**
	 *
	 * @param {object} options
	 * @returns {BX.Kanban.Column|null}
	 */
	addColumn: function(options)
	{
		options = options || {};

		if (this.getColumn(options.id) !== null)
		{
			return null;
		}

		var columnType = this.getColumnType(options.type);
		var column = new columnType(options);
		if (!(column instanceof BX.Kanban.Column))
		{
			throw new Error("Column type must be an instance of BX.Kanban.Column");
		}

		column.setGrid(this);
		this.columns[column.getId()] = column;

		var targetColumn = this.getColumn(options.targetId);
		var targetIndex = BX.util.array_search(targetColumn, this.columnsOrder);
		if (targetIndex >= 0)
		{
			this.columnsOrder.splice(targetIndex, 0, column);
		}
		else
		{
			this.columnsOrder.push(column);
		}

		if (this.isRendered())
		{
			if (targetColumn)
			{
				this.getGridContainer().insertBefore(column.render(), targetColumn.getContainer());
			}
			else
			{
				this.getGridContainer().appendChild(column.render());
			}
		}

		return column;
	},

	getAddItemTitleText: function()
	{
		return this.addItemTitleText;
	},

	getAddDraftItemInfo: function() 
	{
		return this.addDraftItemInfo;
	},

	isAhaMode: function()
	{
		return this.ahaMode;
	},

	onAhaMode: function()
	{
		this.getGridContainer().classList.add("main-kanban-aha");
		this.ahaMode = true;
	},

	offAhaMode: function()
	{
		this.getGridContainer().classList.remove("main-kanban-aha");
		this.ahaMode = false;
	},

	/**
	 *
	 * @param {BX.Kanban.Column|string|number} column
	 * @returns {boolean}
	 */
	removeColumn: function(column)
	{
		column = this.getColumn(column);
		if (!column)
		{
			return false;
		}

		this.removeColumnItems(column);

		this.columnsOrder = this.columnsOrder.filter(function(element) {
			return column !== element;
		});

		delete this.columns[column.getId()];

		BX.remove(column.getContainer());

		column.destroy();

		return true;
	},

	bindEvents: function() {},

	updateColumn: function(column, options)
	{
		column = this.getColumn(column);
		if (!column)
		{
			return false;
		}

		column.setOptions(options);
		column.render();

		return true;
	},

	/**
	 *
	 * @param {BX.Kanban.Column} currentColumn
	 * @returns {BX.Kanban.Column}
	 */
	getNextColumnSibling: function(currentColumn)
	{
		var columnIndex = this.getColumnIndex(currentColumn);
		var columns = this.getColumns();

		return columnIndex !== -1 && columns[columnIndex + 1] ? columns[columnIndex + 1] : null;
	},

	/**
	 *
	 * @param {BX.Kanban.Column} currentColumn
	 * @returns {BX.Kanban.Column}
	 */
	getPreviousColumnSibling: function(currentColumn)
	{
		var columnIndex = this.getColumnIndex(currentColumn);
		var columns = this.getColumns();

		return columnIndex > 0 && columns[columnIndex - 1] ? columns[columnIndex - 1] : null;
	},

	adjustMultiSelectMode: function()
	{
		if(this.selectedItems.length > 0) {
			this.onMultiSelect();
		}
		else
		{
			this.offMultiSelect();
		}
	},

	/**
	 *
	 * @param {object} item
	 */
	addSelectedItem: function(item)
	{
		if (!(item instanceof BX.Kanban.Item))
		{
			throw new Error("Item type must be an instance of BX.Kanban.Item");
		}

		this.selectedItems.push(item);

	},

	/**
	 *
	 * @param {object} item
	 */
	removeSelectedItem: function(item)
	{
		if (!(item instanceof BX.Kanban.Item))
		{
			throw new Error("Item type must be an instance of BX.Kanban.Item");
		}

		if (this.selectedItems.indexOf(item) >= 0)
		{
			this.selectedItems.splice(this.selectedItems.indexOf(item), 1);
		}

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
		options = options || {};
		var column = this.getColumn(options.columnId);
		if (!column)
		{
			return null;
		}

		var itemType = this.getItemType(options.type);
		var item = new itemType(options);
		if (!(item instanceof BX.Kanban.Item))
		{
			throw new Error("Item type must be an instance of BX.Kanban.Item");
		}

		if (this.items[item.getId()])
		{
			return null;
		}

		item.setGrid(this);
		this.items[item.getId()] = item;

		var targetItem = this.getItem(options.targetId);
		column.addItem(item, targetItem);

		options.type === 'BX.Kanban.DraftItem'
			? BX.onCustomEvent(this, "Kanban.Grid:addDraftItem", [item])
			: BX.onCustomEvent(this, "Kanban.Grid:addItem", [item]);

		return item;
	},

	/**
	 *
	 * @param {BX.Kanban.Item|string|number} itemId
	 * @returns {BX.Kanban.Item}
	 */
	removeItem: function(itemId)
	{
		var item = this.getItem(itemId);
		if (item)
		{
			var column = item.getColumn();
			delete this.items[item.getId()];
			column.removeItem(item);
			item.dispose();
		}

		return item;
	},

	removeColumnItems: function(column)
	{
		column = this.getColumn(column);

		var items = column.getItems();
		column.removeItems();

		items.forEach(function(item) {
			this.removeItem(item);
		}, this);
	},

	removeItems: function()
	{
		this.getColumns().forEach(function(column) {
			this.removeColumnItems(column);
		}, this);
	},

	updateItem: function(item, options)
	{
		item = this.getItem(item);
		if (!item)
		{
			return false;
		}

		if (BX.Kanban.Utils.isValidId(options.columnId) && options.columnId !== item.getColumn().getId())
		{
			this.moveItem(item, this.getColumn(options.columnId), this.getItem(options.targetId));
		}

		var eventArgs = ['UPDATE', { task: item, options: options }];

		BX.onCustomEvent(window, 'tasksTaskEvent', eventArgs);

		item.setOptions(options);
		item.render();
		// The redraw goes through render(), not renderLayout(), so the accessible
		// name is rewritten explicitly for the new data.
		item.refreshAriaLabel();

		return true;
	},

	/**
	 *
	 * @param {BX.Kanban.Item|string|number} item
	 * @returns {boolean}
	 */
	hideItem: function(item)
	{
		item = this.getItem(item);
		if (!item || !item.isVisible())
		{
			return false;
		}

		item.setOptions({ visible: false });

		if (item.isCountable())
		{
			item.getColumn().decrementTotal();
		}

		item.getColumn().render();

		return true;
	},

	/**
	 *
	 * @param {BX.Kanban.Item|string|number} item
	 * @returns {boolean}
	 */
	unhideItem: function(item)
	{
		item = this.getItem(item);
		if (!item || item.isVisible())
		{
			return false;
		}

		item.setOptions({ visible: true });

		if (item.isCountable())
		{
			item.getColumn().incrementTotal();
		}

		item.getColumn().render();

		return true;
	},

	getSelectedItems: function()
	{
		return this.selectedItems;
	},

	cleanSelectedItems: function()
	{
		for (var i = 0; i < this.getSelectedItems().length; i++)
		{
			this.getSelectedItems()[i].unSelect(true);
		}

		this.selectedItems = [];
	},

	isMultiSelect: function()
	{
		return this.multiSelect;
	},

	onMultiSelect: function()
	{
		this.getGridContainer().classList.add("main-kanban-multiselect-mode")
	},

	offMultiSelect: function()
	{
		this.getGridContainer().classList.remove("main-kanban-multiselect-mode")
	},

	/**
	 *
	 * @param {BX.Kanban.Column|string|number} column
	 * @returns {BX.Kanban.Column}
	 */
	getColumn: function(column)
	{
		var columnId = column instanceof BX.Kanban.Column ? column.getId() : column;

		return this.columns[columnId] ? this.columns[columnId] : null;
	},

	/**
	 *
	 * @returns {BX.Kanban.Column[]}
	 */
	getColumns: function()
	{
		return this.columnsOrder;
	},

	/**
	 * @returns {number}
	 */
	getColumnsCount: function()
	{
		return this.columnsOrder.length;
	},

	/**
	 *
	 * @param column
	 * @returns {number}
	 */
	getColumnIndex: function(column)
	{
		column = this.getColumn(column);

		return BX.util.array_search(column, this.getColumns());
	},

	/**
	 *
	 * @param {string|number} item
	 * @returns {BX.Kanban.Item}
	 */
	getItem: function(item)
	{
		var itemId = item instanceof BX.Kanban.Item ? item.getId() : item;

		return this.items[itemId] ? this.items[itemId] : null;
	},

	/**
	 *
	 * @param {Element} itemNode
	 * @returns {BX.Kanban.Item|null}
	 */
	getItemByElement: function(itemNode)
	{
		if (BX.type.isDomNode(itemNode) && itemNode.dataset.id && itemNode.dataset.type === "item")
		{
			return this.getItem(itemNode.dataset.id);
		}

		return null;
	},

	/**
	 *
	 * @returns {Object.<string, BX.Kanban.Item>}
	 */
	getItems: function()
	{
		return this.items;
	},

	/**
	 *
	 * @param {string} [className]
	 * @returns {BX.Kanban.Item}
	 */
	getItemType: function(className)
	{
		var classFn = BX.Kanban.Utils.getClass(className);
		if (BX.type.isFunction(classFn))
		{
			return classFn;
		}

		return this.itemType || BX.Kanban.Item;
	},

	/**
	 *
	 * @param {string} [className]
	 * @returns {BX.Kanban.Column}
	 */
	getColumnType: function(className)
	{
		var classFn = BX.Kanban.Utils.getClass(className);
		if (BX.type.isFunction(classFn))
		{
			return classFn;
		}

		return this.columnType || BX.Kanban.Column;
	},

	/**
	 *
	 * @returns {BX.Kanban.DropZoneArea}
	 */
	getDropZoneArea: function()
	{
		return this.dropZoneArea;
	},

	/**
	 *
	 * @returns {object}
	 */
	getData: function()
	{
		return this.data;
	},

	setData: function(data)
	{
		if (BX.type.isPlainObject(data))
		{
			this.data = data;
		}
	},

	getBgColor: function()
	{
		return this.bgColor;
	},

	getBgColorStyle: function()
	{
		return this.getBgColor() === "transparent" ? this.getBgColor() : "#" + this.getBgColor();
	},

	/**
	 *
	 * @returns {object}
	 */
	getOptions: function()
	{
		return this.options;
	},

	/**
	 *
	 * @param {object} json
	 * @param {BX.Kanban.Column[]} [json.columns]
	 * @param {BX.Kanban.Item[]} [json.items]
	 * @param {BX.Kanban.DropZone[]} [json.dropZones]
	 */
	loadData: function(json)
	{
		var needToDraw = this.isRendered();
		this.setRenderStatus(false);

		var boolOptions = [
			"canAddColumn", "canEditColumn", "canSortColumn", "canRemoveColumn", "canAddItem", "canSortItem"
		];

		boolOptions.forEach(function(boolOption) {
			if (BX.type.isBoolean(json[boolOption]))
			{
				this[boolOption] = json[boolOption];
			}
		}, this);

		if (BX.type.isArray(json.columns))
		{
			json.columns.forEach(function(column) {

				if (column && BX.Kanban.Utils.isValidId(column.id) && this.getColumn(column.id))
				{
					this.updateColumn(column.id, column);
				}
				else
				{
					this.addColumn(column);
				}

			}, this);
		}

		if (BX.type.isArray(json.items))
		{
			json.items.forEach(function(item) {

				if (item && BX.Kanban.Utils.isValidId(item.id) && this.getItem(item.id))
				{
					this.updateItem(item.id, item);
				}
				else
				{
					this.addItem(item);
				}

			}, this);
		}

		if (BX.type.isArray(json.dropZones))
		{
			json.dropZones.forEach(function(dropzone) {

				if (dropzone && BX.Kanban.Utils.isValidId(dropzone.id) && this.getDropZoneArea().getDropZone(dropzone.id))
				{
					this.getDropZoneArea().updateDropZone(dropzone.id, dropzone);
				}
				else
				{
					this.getDropZoneArea().addDropZone(dropzone);
				}

			}, this);
		}

		if (needToDraw)
		{
			this.draw();
		}
	},

	/**
	 * Draws Kanban on the page
	 *
	 */
	draw: function()
	{
		var docFragment = document.createDocumentFragment();
		var columns = this.getColumns();
		for (var i = 0; i < columns.length; i++)
		{
			var column = columns[i];
			docFragment.appendChild(column.render());
		}

		BX.cleanNode(this.getGridContainer());
		this.getGridContainer().appendChild(docFragment);

		this.getDropZoneArea().render();

		if (!this.isRendered())
		{
			this.renderLayout();
			this.adjustLayout();
			this.setRenderStatus(true);
			BX.onCustomEvent(this, "Kanban.Grid:onFirstRender", [this]);
		}
		else
		{
			this.adjustLayout();
		}

		this.adjustEmptyStub();
		this.adjustBoardAriaLabel();

		this.keyboardNavigation.ensureEntryPoint();

		BX.onCustomEvent(this, "Kanban.Grid:onRender", [this]);

		this.firstRenderComplete = true;

		if(this.isAhaMode())
		{
			this.renderTo.classList.add("main-kanban-aha-mode");
		}
	},

	renderLayout: function()
	{
		if (this.getOuterContainer().parentNode)
		{
			return;
		}

		var innerContainer = this.getInnerContainer();
		innerContainer.appendChild(this.getEmptyStub());
		innerContainer.appendChild(this.getLeftEar());
		innerContainer.appendChild(this.getDropZoneArea().getContainer());
		innerContainer.appendChild(this.getLoader());
		innerContainer.appendChild(this.getGridContainer());
		// The right scroll ear follows the lane in the DOM so the Tab order matches
		// the visual order (WCAG 2.4.3); both ears are positioned absolutely, so
		// their place in the DOM does not affect the layout.
		innerContainer.appendChild(this.getRightEar());

		var outerContainer = this.getOuterContainer();
		outerContainer.appendChild(innerContainer);

		this.renderTo.appendChild(this.getOuterContainer());

		this.keyboardNavigation.init();

		BX.bind(window, "resize", this.adjustLayout.bind(this));
		BX.bind(window, "scroll", this.adjustHeight.bind(this));
	},

	isRendered: function()
	{
		return this.rendered;
	},

	setRenderStatus: function(status)
	{
		if (BX.type.isBoolean(status))
		{
			this.rendered = status;
		}
	},

	/**
	 *
	 * @returns {Element}
	 */
	getLeftEar: function()
	{
		if (this.layout.earLeft)
		{
			return this.layout.earLeft;
		}

		this.layout.earLeft = BX.create("button", {
			attrs: {
				className: "main-kanban-ear-left",
				type: "button",
				disabled: "disabled",
				"aria-label": this.getMessage("SCROLL_LEFT"),
				"data-testid": "kanban-scroll-left-btn"
			},
			events: {
				mouseenter: this.scrollToLeft.bind(this),
				mouseleave: this.stopAutoScroll.bind(this),
				click: this.scrollPageLeft.bind(this)
			}
		});

		return this.layout.earLeft;
	},

	/**
	 *
	 * @returns {Element}
	 */
	getRightEar: function()
	{
		if (this.layout.earRight)
		{
			return this.layout.earRight;
		}

		this.layout.earRight = BX.create("button", {
			attrs: {
				className: "main-kanban-ear-right",
				type: "button",
				disabled: "disabled",
				"aria-label": this.getMessage("SCROLL_RIGHT"),
				"data-testid": "kanban-scroll-right-btn"
			},
			events: {
				mouseenter: this.scrollToRight.bind(this),
				mouseleave: this.stopAutoScroll.bind(this),
				click: this.scrollPageRight.bind(this)
			}
		});

		return this.layout.earRight;
	},

	/**
	 *
	 * @returns {Element}
	 */
	getRenderToContainer: function()
	{
		return this.renderTo;
	},

	/**
	 *
	 * @returns {Element}
	 */
	getOuterContainer: function()
	{
		if (this.layout.outerContainer)
		{
			return this.layout.outerContainer;
		}

		this.layout.outerContainer = BX.create("div", {
			props: {
				className: this.columnsRevert ? "main-kanban --columns-revert" : "main-kanban"
			},
			attrs: {
				role: "region",
				"aria-label": this.getBoardAriaLabel(),
				"data-testid": "kanban-board"
			},
			style: {
				backgroundColor: this.getBgColorStyle()
			}
		});

		return this.layout.outerContainer;
	},

	/**
	 *
	 * @returns {Element}
	 */
	getInnerContainer: function()
	{
		if (this.layout.innerContainer)
		{
			return this.layout.innerContainer;
		}

		this.layout.innerContainer = BX.create("div", {
			props: {
				className: "main-kanban-inner"
			},
			children: [
				this.getLeftShadowContainer(),
				this.getRightShadowContainer()
			],
			style: {
				backgroundColor: this.getBgColorStyle()
			}
		});

		return this.layout.innerContainer;
	},

	getRightShadowContainer: function()
	{
		if(!this.layout.rightShadow)
		{
			this.layout.rightShadow = BX.create("div", {
				props: {
					className: "main-kanban-inner-shadow main-kanban-inner-shadow-right"
				}
			});
		}

		return this.layout.rightShadow;
	},

	getLeftShadowContainer: function()
	{
		if(!this.layout.leftShadow)
		{
			this.layout.leftShadow = BX.create("div", {
				props: {
					className: "main-kanban-inner-shadow main-kanban-inner-shadow-left"
				}
			});
		}

		return this.layout.leftShadow;
	},

	/**
	 *
	 * @returns {Element}
	 */
	getGridContainer: function()
	{
		if (!this.layout.gridContainer)
		{
			// The lane carries no list role: its children are stage groups, not list
			// items, and a list without a single listitem is announced as an empty
			// one. The cards are already a list inside every column.
			// tabindex="-1" keeps the lane out of the Tab order while allowing it to
			// take focus programmatically, see handOverEarFocus().
			this.layout.gridContainer = BX.create("div", {
				props: {
					className: "main-kanban-grid"
				},
				attrs: {
					tabindex: "-1",
					"data-testid": "kanban-lane"
				},
				events: {
					scroll: this.adjustEars.bind(this)
				}
			});
		}

		return this.layout.gridContainer;
	},

	/**
	 *
	 * @returns {Element}
	 */
	getEmptyStub: function()
	{
		if(this.layout.emptyStub)
		{
			return this.layout.emptyStub;
		}

		if(this.emptyStubItems && typeof this.emptyStubItems === 'object')
		{
			this.layout.emptyStub = BX.create("div", {
				attrs: {
					className: "main-kanban-no-data"
				},
				children: [
					BX.create("div", {
						attrs: {
							className: "main-kanban-no-data-inner"
						},
						children: [
							BX.create("div", {
								attrs: {
									className: "main-kanban-no-data-title"
								},
								text: this.emptyStubItems['title']
							}),
							BX.create("div", {
								attrs: {
									className: "main-kanban-no-data-description"
								},
								text: this.emptyStubItems['description']
							})
						]
					})
				]
			});

			return this.layout.emptyStub;
		}

		// default empty layout
		this.layout.emptyStub = BX.create("div", {
			attrs: {
				className: "main-kanban-no-data"
			},
			children: [
				BX.create("div", {
					attrs: {
						className: "main-kanban-no-data-inner"
					},
					children: [
						BX.create("div", {
							attrs: {
								className: "main-kanban-no-data-image"
							}
						}),
						BX.create("div", {
							attrs: {
								className: "main-kanban-no-data-text"
							},
							text: this.getMessage("NO_DATA")
						})
					]
				})
			]
		});

		return this.layout.emptyStub;
	},

	getLoader: function()
	{
		if (this.layout.loader)
		{
			return this.layout.loader;
		}

		this.layout.loader = BX.create("div", {
			props: {
				className: "main-kanban-loader-container"
			},
			attrs: {
				"aria-hidden": "true"
			},
			html:
				'<svg class="main-kanban-loader-circular" viewBox="25 25 50 50">' +
				'<circle class="main-kanban-loader-path" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"/>' +
				'</svg>'
		});

		return this.layout.loader;
	},

	/**
	 * Refreshes the accessible name of the board. The outer container is created
	 * once and reused, while the name it carries can change with the data (for
	 * example when another funnel is opened), so it is recomputed on every draw.
	 */
	adjustBoardAriaLabel: function()
	{
		this.getOuterContainer().setAttribute("aria-label", this.getBoardAriaLabel());
	},

	adjustLayout: function()
	{
		this.adjustWidth();
		this.adjustHeight();
		this.adjustEars();
	},

	adjustEars: function()
	{
		var grid = this.getGridContainer();
		var scroll = grid.scrollLeft;

		var isLeftVisible = scroll > 0;
		var isRightVisible = grid.scrollWidth > (Math.round(scroll + grid.offsetWidth));

		this.getOuterContainer().classList[isLeftVisible ? "add" : "remove"]("main-kanban-left-ear-shown");
		this.getOuterContainer().classList[isRightVisible ? "add" : "remove"]("main-kanban-right-ear-shown");

		this.adjustEarButton(this.getLeftEar(), isLeftVisible);
		this.adjustEarButton(this.getRightEar(), isRightVisible);
	},

	/**
	 * Keeps a scroll-ear button out of the Tab order while it is not actionable
	 * (the ear is invisible and click-through in this state). The native disabled
	 * state is used instead of hiding an interactive control from assistive
	 * technology: the button stays in the accessibility tree, but is exposed as
	 * unavailable and can neither be focused nor activated.
	 *
	 * @param {Element} earButton
	 * @param {boolean} isVisible
	 */
	adjustEarButton: function(earButton, isVisible)
	{
		if (!isVisible && document.activeElement === earButton)
		{
			this.handOverEarFocus(earButton);
		}

		earButton.disabled = !isVisible;
	},

	/**
	 * Hands focus over before a scroll ear is disabled under it. A disabled control
	 * cannot keep focus, so the browser would drop it on <body>: a keyboard user who
	 * paged the lane to its end would continue from the top of the document instead
	 * of from the board (WCAG 2.4.3). Focus goes to the opposite ear while there is
	 * still something to scroll, otherwise to the lane itself, from where Tab
	 * continues into the board.
	 *
	 * @param {Element} earButton
	 */
	handOverEarFocus: function(earButton)
	{
		var oppositeEar = earButton === this.getLeftEar() ? this.getRightEar() : this.getLeftEar();
		if (!oppositeEar.disabled && typeof oppositeEar.focus === "function")
		{
			oppositeEar.focus();

			return;
		}

		this.getGridContainer().focus();
	},

	adjustWidth: function()
	{
		this.getOuterContainer().style.width = this.renderTo.offsetWidth + "px";
	},

	adjustHeight: function()
	{
		var outerContainer = this.getOuterContainer();
		var innerContainer = this.getInnerContainer();

		if (outerContainer.getBoundingClientRect().top >= 15) //@see .main-kanban-fixed:top
		{
			var height = document.documentElement.clientHeight - innerContainer.getBoundingClientRect().top;
			innerContainer.style.height = height + "px";

			if (innerContainer.classList.contains("main-kanban-fixed"))
			{
				BX.onCustomEvent(this, "Kanban.Grid:onFixedModeEnd", [this]);
			}

			outerContainer.style.minHeight = document.documentElement.clientHeight + "px";
			innerContainer.style.removeProperty("top");
			innerContainer.style.removeProperty("left");
			innerContainer.style.removeProperty("width");
			innerContainer.classList.remove("main-kanban-fixed");
		}
		else
		{
			if (!innerContainer.classList.contains("main-kanban-fixed"))
			{
				BX.onCustomEvent(this, "Kanban.Grid:onFixedModeStart", [this]);
			}

			var rectArea = this.renderTo.getBoundingClientRect();
			innerContainer.style.left = rectArea.left + "px";
			innerContainer.style.width = rectArea.width + "px";
			innerContainer.style.removeProperty("height");
			innerContainer.classList.add("main-kanban-fixed");
		}
	},

	adjustEmptyStub: function()
	{
		var isVisible = true;

		var items = this.getItems();
		for (var itemId in items)
		{
			var item = items[itemId];
			if (item.isVisible())
			{
				isVisible = false;
				break;
			}
		}

		this.getInnerContainer().classList[isVisible ? "add" : "remove"]("main-kanban-no-data-mode");
	},

	moveSelectedItems: function(targetColumn, beforeItem)
	{
		targetColumn = this.getColumn(targetColumn);
		beforeItem = this.getItem(beforeItem);

		if((this.selectedItems.length > 0) || !targetColumn || !beforeItem)
		{
			return false;
		}

		targetColumn.addSelectedItems(this.selectedItems, beforeItem)
	},

	moveItem: function(item, targetColumn, beforeItem)
	{
		item = this.getItem(item);
		targetColumn = this.getColumn(targetColumn);
		beforeItem = this.getItem(beforeItem);

		if (!item || !targetColumn || item === beforeItem)
		{
			return false;
		}

		var currentColumn = item.getColumn();
		currentColumn.removeItem(item);
		targetColumn.addItem(item, beforeItem);

		return true;
	},

	moveItems: function(items, targetColumn, startBeforeItem)
	{
		var currentColumns = [];

		for (var itemId in items)
		{
			var column = this.getColumn(items[itemId].columnId);

			if(currentColumns.indexOf(column) === -1)
			{
				currentColumns.push(column);
			}
		}

		for (var columnId in currentColumns)
		{
			var columnItems = [];
			for(var keyId in items)
			{
				if(currentColumns[columnId].getId() === items[keyId].getColumnId())
				{
					columnItems.push(items[keyId]);
				}
			}

			currentColumns[columnId].removeSelectedItems(columnItems);
		}

		targetColumn.addItems(items, startBeforeItem);

		return true;
	},

	/**
	 *
	 * @param {BX.Kanban.Column|string|number} column
	 * @param {BX.Kanban.Column|string|number} [targetColumn]
	 * @returns {boolean}
	 */
	moveColumn: function(column, targetColumn)
	{
		column = this.getColumn(column);
		targetColumn = this.getColumn(targetColumn);
		if (!column || column === targetColumn)
		{
			return false;
		}

		var columnIndex = BX.util.array_search(column, this.columnsOrder);
		this.columnsOrder.splice(columnIndex, 1);

		var targetIndex = BX.util.array_search(targetColumn, this.columnsOrder);
		if (targetIndex >= 0)
		{
			this.columnsOrder.splice(targetIndex, 0, column);
			if (this.isRendered())
			{
				column.getContainer().parentNode.insertBefore(column.getContainer(), targetColumn.getContainer());
			}
		}
		else
		{
			this.columnsOrder.push(column);
			if (this.isRendered())
			{
				column.getContainer().parentNode.appendChild(column.getContainer());
			}
		}

		return true;
	},

	/**
	 *
	 * @returns {boolean}
	 */
	canAddColumns: function()
	{
		return this.canAddColumn;
	},

	/**
	 *
	 * @returns {boolean}
	 */
	canEditColumns: function()
	{
		return this.canEditColumn;
	},

	/**
	 *
	 * @returns {boolean}
	 */
	canSortColumns: function()
	{
		return this.canSortColumn;
	},

	/**
	 *
	 * @returns {boolean}
	 */
	canRemoveColumns: function()
	{
		return this.canRemoveColumn;
	},

	/**
	 *
	 * @returns {boolean}
	 */
	canAddItems: function()
	{
		return this.canAddItem;
	},

	/**
	 *
	 * @returns {boolean}
	 */
	canSortItems: function()
	{
		return this.canSortItem;
	},

	scrollToRight: function()
	{
		this.earTimer = setInterval(function() {
			this.getGridContainer().scrollLeft += 10;
		}.bind(this), 20)
	},

	scrollToLeft: function()
	{
		this.earTimer = setInterval(function() {
			this.getGridContainer().scrollLeft -= 10;
		}.bind(this), 20)
	},

	stopAutoScroll: function()
	{
		clearInterval(this.earTimer);

		//?
		jsDD.refreshDestArea();
	},

	getScrollPageStep: function()
	{
		return Math.max(Math.round(this.getGridContainer().clientWidth * 0.8), 100);
	},

	scrollPageRight: function()
	{
		this.getGridContainer().scrollLeft += this.getScrollPageStep();
	},

	scrollPageLeft: function()
	{
		this.getGridContainer().scrollLeft -= this.getScrollPageStep();
	},

	/**
	 *
	 * @returns {BX.Kanban.DragMode}
	 */
	getDragMode: function()
	{
		return this.dragMode;
	},

	getDragModeCode: function(mode)
	{
		for (var code in BX.Kanban.DragMode)
		{
			if (BX.Kanban.DragMode[code] === mode)
			{
				return code;
			}
		}

		return null;
	},

	/**
	 *
	 * @param {BX.Kanban.DragMode} mode
	 */
	setDragMode: function(mode)
	{
		var code = this.getDragModeCode(mode);
		if (code !== null)
		{
			this.getOuterContainer().classList.add("main-kanban-drag-mode-" + code.toLowerCase());
			this.dragMode = mode;
		}
	},

	resetDragMode: function()
	{
		var code = this.getDragModeCode(this.getDragMode());
		if (code !== null)
		{
			this.getOuterContainer().classList.remove("main-kanban-drag-mode-" + code.toLowerCase());
		}

		this.dragMode = BX.Kanban.DragMode.NONE;
	},

	onItemDragStart: function(item)
	{
		if(this.multiSelect && this.selectedItems.length > 0)
		{
			for (var item in this.selectedItems)
			{
				this.selectedItems[item].disabledItem();
			}
		}

		this.setDragMode(BX.Kanban.DragMode.ITEM);

		var items = this.getItems();
		for (var itemId in items)
		{
			items[itemId].enableDropping();
		}

		this.getColumns().forEach(function(/*BX.Kanban.Column*/column) {
			column.enableDropping();
		});

		this.getDropZoneArea().emptyAll();
		this.getDropZoneArea().show();
	},

	onItemDragStop: function(item)
	{
		if(this.multiSelect && this.selectedItems.length > 0)
		{
			for (var item in this.selectedItems)
			{
				this.selectedItems[item].unDisabledItem();
			}
		}

		this.resetDragMode();
		this.getDropZoneArea().hide();

		//@see onItemDragEnd
		// var items = this.getItems();
		// for (var itemId in items)
		// {
		// 	items[itemId].disableDropping();
		// }
		//
		// this.getColumns().forEach(function(/*BX.Kanban.Column*/column) {
		// 	column.disableDropping();
		// });
	},

	onColumnDragStart: function(column)
	{
		this.setDragMode(BX.Kanban.DragMode.COLUMN);
	},

	onColumnDragStop: function(column)
	{
		this.resetDragMode();
	},

	/**
	 *
	 * @param {string} eventName
	 * @param {array} eventArgs
	 * @param {function} onFulfilled
	 * @param {function} onRejected
	 */
	getEventPromise: function(eventName, eventArgs, onFulfilled, onRejected)
	{
		var promises = [];

		eventArgs = BX.type.isArray(eventArgs) ? eventArgs : [];
		BX.onCustomEvent(this, eventName, [promises].concat(eventArgs));

		var promise = new BX.Promise();
		var firstPromise = promise;

		for (var i = 0; i < promises.length; i++)
		{
			promise = promise.then(promises[i]);
		}

		promise.then(
			BX.type.isFunction(onFulfilled) ? onFulfilled : null,
			BX.type.isFunction(onRejected) ? onRejected : null
		);

		return firstPromise;
	},

	fadeOut: function()
	{
		this.getOuterContainer().classList.add("main-kanban-faded");
		this.getOuterContainer().setAttribute("aria-busy", "true");
	},

	fadeIn: function()
	{
		this.getOuterContainer().classList.remove("main-kanban-faded");
		this.getOuterContainer().setAttribute("aria-busy", "false");
	},

	/**
	 * Accessible name of the board (aria-label). Overridable name hook.
	 * Base layer returns a neutral board name; domain wrappers provide the
	 * meaningful one (e.g. funnel name).
	 *
	 * @returns {string}
	 */
	getBoardAriaLabel: function()
	{
		return this.getMessage("BOARD_ARIA_LABEL");
	},

	getMessage: function(messageId)
	{
		return messageId in this.messages ? this.messages[messageId] : BX.message("MAIN_KANBAN_" + messageId);
	}
};

BX.Kanban.DragEvent = function(options)
{
	this.item = null;
	this.items = [];
	this.targetColumn = null;
	this.targetItem = null;
	this.action = true;
};

BX.Kanban.DragEvent.prototype =
{
	allowAction: function()
	{
		this.action = true;
	},

	denyAction: function()
	{
		this.action = false;
	},

	isActionAllowed: function()
	{
		return this.action;
	},

	/**
	 *
	 * @param {object} items
	 */
	setItems: function(items)
	{
		this.items = items;
	},

	/**
	 *
	 * @param {BX.Kanban.Item} item
	 */
	setItem: function(item)
	{
		this.item = item;
	},

	/**
	 *
	 * @returns {BX.Kanban.Item}
	 */
	getItem: function()
	{
		return this.item;
	},

	/**
	 *
	 * @param {BX.Kanban.Item} item
	 */
	setTargetItem: function(item)
	{
		this.targetItem = item;
	},

	/**
	 *
	 * @returns {BX.Kanban.Item}
	 */
	getTargetItem: function()
	{
		return this.targetItem;
	},

	/**
	 *
	 * @param {BX.Kanban.Column} targetColumn
	 */
	setTargetColumn: function(targetColumn)
	{
		this.targetColumn = targetColumn;
	},

	/**
	 *
	 * @returns {BX.Kanban.Column}
	 */
	getTargetColumn: function()
	{
		return this.targetColumn;
	}
};

/**
 * Every key handleKeydown acts on. Anything else (Tab, Esc, typing) is dropped
 * before the board is walked, so an unrelated key costs nothing.
 *
 * @type {string[]}
 */
var NAVIGATION_KEYS = [
	"Enter",
	" ",
	"Spacebar",
	"ArrowRight",
	"ArrowLeft",
	"ArrowDown",
	"ArrowUp"
];

/**
 * Keyboard navigation for the board: roving tabindex over columns (groups) and
 * cards (list items), arrow-key movement with scrollIntoView, and Enter/Space
 * activation of the focused card (reusing the card's own open handler).
 *
 * Listeners are bound to the board container (not window), so existing window
 * Esc/hotkeys and text input are left untouched.
 *
 * @param {BX.Kanban.Grid} grid
 * @constructor
 */
BX.Kanban.KeyboardNavigation = function(grid)
{
	this.grid = grid;
	this.initialized = false;
	this.matrix = null;
	this.matrixDepth = 0;
	this.activeCell = null;
	this.movingFocus = false;
	this.boundHandleKeydown = this.handleKeydown.bind(this);
	this.boundHandleFocusIn = this.handleFocusIn.bind(this);
};

BX.Kanban.KeyboardNavigation.prototype =
{
	init: function()
	{
		if (this.initialized)
		{
			return;
		}

		var container = this.grid.getGridContainer();
		container.addEventListener("keydown", this.boundHandleKeydown);
		container.addEventListener("focusin", this.boundHandleFocusIn);

		this.initialized = true;
	},

	/**
	 * Vertical list of focusable cells inside a column: the column group itself
	 * followed by the focus node of each visible card.
	 *
	 * @param {BX.Kanban.Column} column
	 * @returns {Element[]}
	 */
	getColumnCells: function(column)
	{
		var cells = [column.getContainer()];
		column.getItems().forEach(function(item) {
			if (item.isVisible())
			{
				cells.push(item.getFocusableNode());
			}
		});

		return cells;
	},

	/**
	 * 2D model of navigable cells: columns (outer) x cells (inner).
	 *
	 * @returns {Element[][]}
	 */
	getMatrix: function()
	{
		if (this.matrix !== null)
		{
			return this.matrix;
		}

		var matrix = this.grid.getColumns().map(function(column) {
			return this.getColumnCells(column);
		}, this);

		if (this.matrixDepth > 0)
		{
			this.matrix = matrix;
		}

		return matrix;
	},

	/**
	 * Runs the callback with the matrix built at most once. Normalizing the roving
	 * tabindex reads the whole board twice -- once to find the entry point and once
	 * to write every cell -- and a rebuild walks every column and every visible
	 * card. Outside such a call the matrix is never kept: the board changes on
	 * redraw, on a "show more" page, on pull, on drag and drop, on filtering and on
	 * collapsing a column, and a stale matrix would hand focus to a card that is no
	 * longer on the board. That is also why the keyboard path below does not use
	 * the matrix at all: it reads the columns it needs at the moment of the press.
	 *
	 * @param {Function} callback
	 * @returns {*}
	 */
	withMatrix: function(callback)
	{
		this.matrixDepth++;
		try
		{
			return callback.call(this);
		}
		finally
		{
			this.matrixDepth--;
			if (this.matrixDepth === 0)
			{
				this.matrix = null;
			}
		}
	},

	/**
	 * @returns {Element[]}
	 */
	getAllNavigables: function()
	{
		var result = [];
		this.getMatrix().forEach(function(cells) {
			cells.forEach(function(cell) {
				result.push(cell);
			});
		});

		return result;
	},

	/**
	 * Column of the board the node belongs to, with its position in the board.
	 * Only the columns are walked, never their cards, and there are few columns
	 * even on a wide board.
	 *
	 * @param {Element} node
	 * @returns {?{column: BX.Kanban.Column, colIndex: number}}
	 */
	locateColumn: function(node)
	{
		if (!node)
		{
			return null;
		}

		var columns = this.grid.getColumns();
		for (var colIndex = 0; colIndex < columns.length; colIndex++)
		{
			if (columns[colIndex].getContainer() === node)
			{
				return { column: columns[colIndex], colIndex: colIndex };
			}
		}

		return null;
	},

	/**
	 * Resolves the navigable cell (card or column group) that owns the event target
	 * together with the column holding it, or null when the target is outside the
	 * navigable structure.
	 *
	 * The column comes from the layout, so nothing here walks the cards: this runs
	 * on every key press the board handles, key repeat included. A card being
	 * dragged is moved out of the board container, where the listeners are, so
	 * whatever reaches this point sits inside a column of this board.
	 *
	 * @param {Element} target
	 * @returns {?{cell: Element, column: BX.Kanban.Column, colIndex: number}}
	 */
	resolveCell: function(target)
	{
		if (!target || typeof target.closest !== "function")
		{
			return null;
		}

		var place = this.locateColumn(target.closest(".main-kanban-column"));
		if (!place)
		{
			return null;
		}

		var card = target.closest(".main-kanban-item");
		if (card)
		{
			var item = this.grid.getItemByElement(card);
			if (item && item.isVisible())
			{
				place.cell = item.getFocusableNode();

				return place;
			}
		}

		// Either the target is not on a card, or the card is not a cell of its own
		// (a hidden item); the column group answers for it.
		place.cell = place.column.getContainer();

		return place;
	},

	/**
	 * @param {Element} el
	 * @param {boolean} focus
	 */
	setActive: function(el, focus)
	{
		this.moveEntryPoint(el);

		if (focus)
		{
			// preventScroll: focus() would scroll the cell into view on its own, and
			// the call below has to scroll anyway -- the focus node of a card can be a
			// small element inside it, while it is the whole card that has to be
			// brought into view. Two scroll calculations per arrow key press is what
			// the flag saves.
			this.focusCell(el, { preventScroll: true });

			var scrollTarget = el.closest(".main-kanban-item") || el;
			if (typeof scrollTarget.scrollIntoView === "function")
			{
				scrollTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
			}
		}
	},

	/**
	 * Moves the single tabindex="0" of the board onto the given cell. Only the
	 * cell that carried it and the new one are written to: every other cell keeps
	 * what the last full normalization left on it.
	 *
	 * @param {Element} el
	 */
	moveEntryPoint: function(el)
	{
		if (this.activeCell === null)
		{
			// Nothing is known yet about where the entry point sits, so the whole
			// board is normalized once.
			this.normalizeTabIndex(el);

			return;
		}

		if (this.activeCell !== el)
		{
			this.activeCell.setAttribute("tabindex", "-1");
		}

		el.setAttribute("tabindex", "0");
		this.activeCell = el;
	},

	/**
	 * Writes the roving tabindex over every cell of the board: the entry point
	 * gets "0", everything else "-1".
	 *
	 * @param {Element} active
	 */
	normalizeTabIndex: function(active)
	{
		this.getAllNavigables().forEach(function(node) {
			node.setAttribute("tabindex", node === active ? "0" : "-1");
		});

		this.activeCell = active;
	},

	/**
	 * Moves focus to a cell. focus() dispatches focusin synchronously, and the
	 * focusin handler would then redo the work this call has just done, walking
	 * the board a second time; the flag tells it the board is moving focus itself.
	 *
	 * @param {Element} el
	 * @param {?Object} options
	 */
	focusCell: function(el, options)
	{
		this.movingFocus = true;
		try
		{
			el.focus(options);
		}
		finally
		{
			this.movingFocus = false;
		}
	},

	/**
	 * Normalizes the roving tabindex: exactly one entry point (tabindex="0") so
	 * Tab reaches the lane, and every other cell out of the Tab order. This is the
	 * only pass that writes every cell, because a cell added since the last one
	 * (a "show more" page, a card pushed by pull) can carry no tabindex at all and
	 * would otherwise stay a native tab stop until focus enters the board again.
	 */
	ensureEntryPoint: function()
	{
		this.withMatrix(function() {
			var navigables = this.getAllNavigables();
			if (navigables.length === 0)
			{
				return;
			}

			// The known entry point is the usual case; the board is searched only
			// when it is gone, for example after a redraw built new cells.
			var active = this.activeCell;
			if (active === null || navigables.indexOf(active) === -1)
			{
				active = null;
				navigables.forEach(function(node) {
					if (active === null && node.getAttribute("tabindex") === "0")
					{
						active = node;
					}
				});
			}

			this.normalizeTabIndex(active || navigables[0]);
		});
	},

	handleFocusIn: function(event)
	{
		if (this.movingFocus)
		{
			return;
		}

		var place = this.resolveCell(event.target);
		if (!place)
		{
			return;
		}

		this.setActive(place.cell, false);

		// A card container can be focused from the outside (for example when focus is
		// restored after a stage move). Hand focus over to the node that carries the
		// card semantics, so what is focused is what gets announced.
		// preventScroll: whoever focused the card container has already brought it
		// into view, and a plain mouse click must not shift the board.
		if (place.cell !== event.target && event.target.classList.contains("main-kanban-item"))
		{
			this.focusCell(place.cell, { preventScroll: true });
		}
	},

	/**
	 * @param {Element} target
	 * @returns {boolean}
	 */
	isTextInput: function(target)
	{
		if (!target || !target.tagName)
		{
			return false;
		}

		var tag = target.tagName.toUpperCase();

		return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable === true;
	},

	handleKeydown: function(event)
	{
		// A key this handler does nothing with must not reach the board at all.
		if (this.isTextInput(event.target) || NAVIGATION_KEYS.indexOf(event.key) === -1)
		{
			return;
		}

		var place = this.resolveCell(event.target);
		if (!place)
		{
			return;
		}

		// Activation asks nothing about the layout of the board: the card is the one
		// the event comes from, so nothing is walked here.
		if (event.key === "Enter" || event.key === " " || event.key === "Spacebar")
		{
			this.activateCard(place.cell, event);

			return;
		}

		var target = this.getArrowTarget(place, event.key);
		if (target && target !== place.cell)
		{
			event.preventDefault();
			this.setActive(target, true);
		}
	},

	/**
	 * Cell an arrow key moves to, or null when the board ends there.
	 *
	 * Two columns at most are read: the one holding the focused cell and, for a
	 * horizontal move, the neighbouring one. The rest of the board is not touched,
	 * so the cost of a key press does not grow with the number of cards on it.
	 *
	 * @param {{cell: Element, column: BX.Kanban.Column, colIndex: number}} place
	 * @param {string} key
	 * @returns {Element|null}
	 */
	getArrowTarget: function(place, key)
	{
		var cells = this.getColumnCells(place.column);
		var rowIndex = cells.indexOf(place.cell);
		if (rowIndex === -1)
		{
			// The focused cell has left its column between the two events (a card
			// hidden by a filter, a card removed), so there is no row to move from.
			return null;
		}

		switch (key)
		{
			case "ArrowDown":
				return this.getRowCell(cells, rowIndex + 1);
			case "ArrowUp":
				return this.getRowCell(cells, rowIndex - 1);
			case "ArrowRight":
				return this.getNeighbourCell(place.colIndex + 1, rowIndex);
			case "ArrowLeft":
				return this.getNeighbourCell(place.colIndex - 1, rowIndex);
			default:
				return null;
		}
	},

	/**
	 * Cell of the neighbouring column at the same row, or null beyond the first and
	 * the last column.
	 *
	 * @param {number} colIndex
	 * @param {number} rowIndex
	 * @returns {Element|null}
	 */
	getNeighbourCell: function(colIndex, rowIndex)
	{
		var column = colIndex < 0 ? null : this.grid.getColumns()[colIndex];

		return column ? this.getRowCell(this.getColumnCells(column), rowIndex) : null;
	},

	/**
	 * Cell at the row, clamped to the column: a move into a shorter column stops on
	 * its last card instead of leaving the board.
	 *
	 * @param {Element[]} cells
	 * @param {number} rowIndex
	 * @returns {Element|null}
	 */
	getRowCell: function(cells, rowIndex)
	{
		if (cells.length === 0)
		{
			return null;
		}

		return cells[Math.max(0, Math.min(rowIndex, cells.length - 1))];
	},

	/**
	 * Opens the focused card on Enter and on Space.
	 *
	 * Space only gets here on a board without multiselect: where selection is
	 * available the card handler takes Space for the selection and stops the
	 * event, see BX.Kanban.Item.handleContainerKeydown.
	 *
	 * @param {Element} current
	 * @param {KeyboardEvent} event
	 */
	activateCard: function(current, event)
	{
		if (event.target !== current)
		{
			return;
		}

		var card = current.closest(".main-kanban-item");
		if (!card)
		{
			return;
		}

		// A native link or button is activated by the browser itself on Enter.
		if (event.key === "Enter" && this.isNativeControl(current))
		{
			return;
		}

		var item = this.grid.getItemByElement(card);
		if (item)
		{
			event.preventDefault();
			item.activate();
		}
	},

	/**
	 * @param {Element} node
	 * @returns {boolean}
	 */
	isNativeControl: function(node)
	{
		var tag = node.tagName ? node.tagName.toUpperCase() : "";

		return tag === "BUTTON" || (tag === "A" && node.hasAttribute("href"));
	}
};

})();
