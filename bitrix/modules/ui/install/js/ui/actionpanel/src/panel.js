import { OverflowCalculator, PositionTracker } from 'ui.action-panel';

;(function() {

'use strict';

BX.namespace('BX.UI');

// a parent container holds one live panel: the previous one is destroyed when a new panel is drawn
var panelsByParent = new WeakMap();

// A group action covers the grid with a popup, a slider or a legacy window, and all of them
// live in the body. A click inside such a layer is not a click past the grid, so it must not
// drop the selection the action is about to work on.
const LAYERS_OVER_THE_GRID = [
	'.popup-window',
	'.popup-window-overlay',
	'.side-panel-overlay',
	'.bx-core-window',
	'.bx-core-dialog-overlay',
].join(', ');

// the body class belongs to the page, not to a panel: it stays until the last shown panel is gone
function hasShownPanels()
{
	return document.querySelector('.ui-action-panel.ui-action-panel-show') !== null;
}

BX.UI.ActionPanel = function(options)
{
	this.groupActions = options.groupActions;
	this.layout = {
		container: null,
		itemContainer: null,
		more: null,
		reset: null,
		totalSelected: null,
		totalSelectedItem: null
	};

	this.itemContainer = null;
	this.className = options.className;
	this.renderTo = options.renderTo;
	this.darkMode = options.darkMode;
	this.floatMode = typeof options.floatMode === 'undefined' ? true : options.floatMode;
	this.alignItems = options.alignItems;
	this.items = [];
	this.hiddenItems = [];
	this.grid = null;
	this.tileGrid = null;
	this.maxHeight = options.maxHeight;
	this.zIndex = options.zIndex;
	this.params = options.params || {};
	this.parentPosition = options.parentPosition;
	this.panelIsFixed = null;
	this.removeLeftPosition = options.removeLeftPosition;

	this.positionTracker = null;
	this.overflowCalculator = null;
	// the row width is the only input of the overflow: both widths tell a pass from a repeat of it
	this.appliedWidth = null;
	this.overflowWidth = null;
	this.moreMenuWindow = null;
	this.boundEvents = [];
	this.boundCustomEvents = [];
	this.trackedParent = null;
	this.destroyed = false;

	this.pinnedMode = typeof options.pinnedMode === 'undefined' ? false : options.pinnedMode;
	this.autoHide = typeof options.autoHide === 'undefined' ? true : options.autoHide;
	this.showTotalSelectedBlock = typeof options.showTotalSelectedBlock === 'undefined' ? true : options.showTotalSelectedBlock;
	this.showResetAllBlock = typeof options.showResetAllBlock === 'undefined' ? (this.pinnedMode ? false : true) : options.showResetAllBlock;

	this.buildPanelContainer();
	if (this.pinnedMode)
	{
		this.buildPanelByGroup();
	}

	BX.onCustomEvent('BX.UI.ActionPanel:created', [this]);
};

BX.UI.ActionPanel.prototype =
{
	bindEvents: function()
	{
		if (this.params.tileGridId)
		{
			this.subscribeGlobalEvent('BX.TileGrid.Grid::ready', this.handleTileGridReady.bind(this));

			this.subscribeCustomEvent(window, 'BX.TileGrid.Grid:selectItem', this.handleTileSelectItem.bind(this));
			this.subscribeCustomEvent(window, 'BX.TileGrid.Grid:checkItem', this.handleTileSelectItem.bind(this));
			this.subscribeCustomEvent(window, 'BX.TileGrid.Grid:unSelectItem', this.handleTileUnSelectItem.bind(this));
			this.subscribeCustomEvent(window, 'BX.TileGrid.Grid:redraw', this.hidePanel.bind(this));
			this.subscribeCustomEvent(window, 'BX.TileGrid.Grid:defineEscapeKey', this.hidePanel.bind(this));
			this.subscribeCustomEvent(window, 'BX.TileGrid.Grid:lastSelectedItem', this.hidePanel.bind(this));
			this.subscribeCustomEvent(window, 'BX.TileGrid.Grid:multiSelectModeOff', this.hidePanel.bind(this));
		}

		if (this.params.gridId)
		{
			this.subscribeGlobalEvent('Grid::ready', this.handleGridReady.bind(this));

			this.subscribeGlobalEvent('Grid::thereSelectedRows', this.handleGridSelectItem.bind(this));
			this.subscribeGlobalEvent('Grid::allRowsSelected', this.handleGridSelectItem.bind(this));
			this.subscribeGlobalEvent('Grid::updated', this.hidePanel.bind(this));
			this.subscribeGlobalEvent('Grid::noSelectedRows', this.hidePanel.bind(this));
			this.subscribeGlobalEvent('Grid::allRowsUnselected', this.hidePanel.bind(this));
		}

		if (this.autoHide)
		{
			// resolved on every call: consumers replace handleOuterClick on the instance
			this.bindWindowEvent('click', function(event) {
				this.handleOuterClick(event);
			}.bind(this));
		}

		this.subscribeCustomEvent(this, 'BX.UI.ActionPanel:clickResetAllBlock', this.hidePanel.bind(this));

		// the tracker owns the only scroll and resize subscription: it recalculates the position
		// itself and calls back for the overflow, so no second window listener reads the same layout
		this.getPositionTracker().start();
	},

	bindWindowEvent: function(eventName, handler)
	{
		this.boundEvents.push({ eventName: eventName, handler: handler });
		BX.bind(window, eventName, handler);
	},

	subscribeGlobalEvent: function(eventName, handler)
	{
		this.boundCustomEvents.push({ target: null, eventName: eventName, handler: handler });
		BX.addCustomEvent(eventName, handler);
	},

	subscribeCustomEvent: function(target, eventName, handler)
	{
		this.boundCustomEvents.push({ target: target, eventName: eventName, handler: handler });
		BX.addCustomEvent(target, eventName, handler);
	},

	unbindEvents: function()
	{
		this.boundEvents.forEach(function(binding) {
			BX.unbind(window, binding.eventName, binding.handler);
		});
		this.boundEvents = [];

		this.boundCustomEvents.forEach(function(subscription) {
			subscription.target
				? BX.removeCustomEvent(subscription.target, subscription.eventName, subscription.handler)
				: BX.removeCustomEvent(subscription.eventName, subscription.handler);
		});
		this.boundCustomEvents = [];
	},

	getPositionTracker: function()
	{
		if (!this.positionTracker)
		{
			this.positionTracker = new PositionTracker({
				parent: this.resolveRenderContainer.bind(this),
				maxHeight: this.maxHeight ? Number(this.maxHeight) : null,
				onApply: this.handlePositionChange.bind(this),
				onModeChange: this.floatMode ? this.handleScroll.bind(this) : null,
				onGeometryChange: this.handleGeometryChange.bind(this)
			});
		}

		return this.positionTracker;
	},

	getOverflowCalculator: function()
	{
		if (!this.overflowCalculator)
		{
			this.overflowCalculator = new OverflowCalculator({
				getItems: function() {
					return this.items;
				}.bind(this),
				isNotFit: function(item) {
					return item.isNotFit();
				},
				hasMoreBlock: function() {
					return Boolean(this.layout.more);
				}.bind(this),
				addMoreBlock: function() {
					this.appendMoreBlock();
				}.bind(this),
				removeMoreBlock: function() {
					this.removeMoreBlock();
				}.bind(this)
			});
		}

		return this.overflowCalculator;
	},

	/**
	 * @param {String }id
	 * @return {BX.UI.ActionPanel.Item}
	 */
	getItemById: function(id)
	{
		return this.items.find(function (item) {
			return item.id === id;
		});
	},

	addItems: function(items)
	{
		items.forEach(function (item) {
			this.appendItem(item);
		}.bind(this));

		this.fillHiddenItems();
	},

	buildItem: function(options)
	{
		options.actionPanel = this;

		return new BX.UI.ActionPanel.Item(options);
	},

	appendItem: function(options)
	{
		if(options.hiddenInPanel !== true)
		{
			var item = this.buildItem(options);

			this.items.push(item);
			this.layout.itemContainer.appendChild(item.render());
		}
	},

	fillHiddenItems: function()
	{
		this.overflowWidth = this.appliedWidth;
		this.hiddenItems = this.getOverflowCalculator().recalc();
	},

	removeItems: function ()
	{
		this.items.forEach(function (item) {
			item.destroy();
		});

		this.items = [];
		this.getOverflowCalculator().clear();
		this.hiddenItems = [];
	},

	getMoreBlock: function()
	{
		if (!this.layout.more)
		{
			this.layout.more = BX.create("div", {
				props: {
					className: "ui-action-panel-more"
				},
				text: BX.message('JS_UI_ACTIONPANEL_MORE_BLOCK'),
				events: {
					click: this.handleClickMoreBlock.bind(this)
				}
			});
		}

		return this.layout.more;
	},

	appendMoreBlock: function()
	{
		this.layout.container.appendChild(this.getMoreBlock());
	},

	getResetAllBlock: function()
	{
		this.layout.reset = BX.create("div", {
			props: {
				className: "ui-action-panel-reset"
			}
		});

		this.removeLeftPosition ? BX.addClass(this.layout.reset, "ui-action-panel-reset-ordert-first") : null;

		BX.bind(this.layout.reset, "click", function()
		{
			BX.onCustomEvent(this, 'BX.UI.ActionPanel:clickResetAllBlock');
			this.resetAllSection();
		}.bind(this));

		return this.layout.reset
	},

	resetAllSection: function()
	{
		if (this.grid)
		{
			this.grid.getRows().unselectAll();
			this.grid.adjustCheckAllCheckboxes();
		}
		else if (this.tileGrid)
		{
			this.tileGrid.resetSetMultiSelectMode();
			this.tileGrid.resetSelectAllItems();
			this.tileGrid.resetFromToItems();
		}
	},

	handleScroll: function ()
	{
		if (this.getDistanceFromTop() > 0)
		{
			if(this.panelIsFixed)
				this.unfixPanel();
		}
		else
		{
			if(!this.panelIsFixed)
				this.fixPanel();
		}

		this.adjustMoreMenuPosition();
	},

	adjustMoreMenuPosition: function()
	{
		if (this.isMoreMenuShown())
		{
			this.moreMenuWindow.popupWindow.adjustPosition();
		}
	},

	isMoreMenuShown: function()
	{
		return Boolean(this.moreMenuWindow) && this.moreMenuWindow.popupWindow.isShown();
	},

	handleOuterClick: function (event)
	{
		var target = BX.getEventTarget(event);

		if (BX.hasClass(target, "ui-action-panel"))
		{
			return;
		}

		if (BX.findParent(target, {className: "ui-action-panel"}))
		{
			return;
		}

		if (BX.findParent(target, {className: "main-grid-container"}))
		{
			return;
		}

		if (BX.findParent(target, {className: "ui-grid-tile-item"}))
		{
			return;
		}

		if (BX.findParent(target, {className: "main-kanban-item"}))
		{
			return;
		}

		if (target && target.closest && target.closest(LAYERS_OVER_THE_GRID))
		{
			return;
		}

		this.hidePanel();
		if (this.grid)
		{
			this.resetAllSection();
		}
	},

	handleClickMoreBlock: function (event)
	{
		for (var i = 0; i < this.hiddenItems.length; i++)
		{
			if (this.hiddenItems[i].buttonIconClass && this.hiddenItems[i].text.length === 0)
			{
				this.hiddenItems[i].className = "menu-popup-no-icon ui-btn ui-btn-link " + this.hiddenItems[i].buttonIconClass;
				this.hiddenItems[i].html = '<span></span>'
			}
		}

		var popupMenu = new BX.PopupMenuWindow({
			bindElement: this.getMoreBlock(),
			className: "ui-action-panel-item-popup-menu",
			angle: true,
			offsetLeft: this.getMoreBlock().offsetWidth / 2,
			closeByEsc: true,
			items: this.hiddenItems,
			events: {
				onPopupShow: function() {
					BX.bind(popupMenu.popupWindow.popupContainer, 'click', function(event) {
						var target = BX.getEventTarget(event);
						var item = BX.findParent(target, {
							className: 'menu-popup-item'
						}, 10);

						if (!item || !item.dataset.preventCloseContextMenu)
						{
							popupMenu.close();
						}
					});
				},
				onPopupClose: function() {
					this.moreMenuWindow = null;
					popupMenu.destroy();

					// getMoreBlock() recreates the node: a destroyed panel must not get its markup back
					if (!this.destroyed)
					{
						BX.removeClass(this.getMoreBlock(), "ui-action-panel-item-active");
					}
				}.bind(this)
			}
		});

		popupMenu.layout.menuContainer.setAttribute("data-tile-grid", "tile-grid-stop-close");
		// kept on the instance: the position is re-applied per frame of scrolling, and looking the
		// menu up on every one of them costs more than the adjustment itself
		this.moreMenuWindow = popupMenu;
		popupMenu.show();
	},

	removeMoreBlock: function()
	{
		if(!this.layout.more)
			return;

		BX.remove(this.layout.more);
		this.layout.more = null;
	},

	getDistanceFromTop: function()
	{
		return this.resolveRenderContainer().getBoundingClientRect().top;
	},

	fixPanel: function()
	{
		BX.addClass(this.layout.container, "ui-action-panel-fixed");
		this.panelIsFixed = true;
		// consumers move the container before calling the original, so the recalculation belongs here
		this.adjustPanelStyle();
	},

	unfixPanel: function()
	{
		BX.removeClass(this.layout.container, "ui-action-panel-fixed");
		this.panelIsFixed = null;
		this.adjustPanelStyle();
	},

	buildPanelContainer: function()
	{
		this.layout.container = BX.create("div", {
			attrs: {
				className: ['ui-action-panel', this.darkMode ? 'ui-action-panel-darkmode' : '', this.className].join(' ')
			},
			dataset: {
				tileGrid: "tile-grid-stop-close"
			},
			children: [
				this.showTotalSelectedBlock? this.getTotalSelectedBlock() : null,
				this.getItemContainer(),
				this.showResetAllBlock? this.getResetAllBlock() : null
			]
		});

		this.maxHeight ? this.layout.container.style.maxHeight = this.maxHeight + "px" : null;
	},

	getItemContainer: function()
	{
		return this.layout.itemContainer = BX.create('div', {
			props: {
				className: 'ui-action-panel-wrapper'
			},
			style: {
				textAlign: this.alignItems ? this.alignItems : null
			}
		})
	},

	getTotalSelectedBlock: function()
	{
		return this.layout.totalSelected = BX.create('div', {
			props: {
				className: this.removeLeftPosition ? 'ui-action-panel-total ui-action-panel-total-without-border' : 'ui-action-panel-total'
			},
			dataset: {
				role: 'action-panel-total'
			},
			children: [
				BX.create('span', {
					props: {
						className: 'ui-action-panel-total-label'
					},
					text: BX.message('JS_UI_ACTIONPANEL_IS_SELECTED')
				}),
				this.layout.totalSelectedItem = BX.create('span', {
					props: {
						className: 'ui-action-panel-total-param'
					},
					dataset: {
						role: 'action-panel-total-param'
					}
				})
			]
		})
	},

	getPanelContainer: function()
	{
		return this.layout.container
	},

	adjustPanelStyle: function()
	{
		var tracker = this.getPositionTracker();

		tracker.setMaxHeight(this.maxHeight ? Number(this.maxHeight) : null);
		tracker.refresh();
	},

	handlePositionChange: function(metrics)
	{
		this.appliedWidth = metrics.width;
		this.applyPositionMetrics(metrics);

		if (this.isMoreMenuShown())
		{
			this.adjustMoreMenuPosition();
		}
	},

	/**
	 * The tracker has already applied the new position by now, so only the overflow is left. A pass
	 * reads the geometry of every item and may add or drop the more block, while the tracker reports
	 * a change once per frame of scrolling: a row that kept its width folds exactly as it did before.
	 */
	handleGeometryChange: function()
	{
		if (this.appliedWidth === this.overflowWidth)
		{
			return;
		}

		this.fillHiddenItems();
	},

	applyPositionMetrics: function(metrics)
	{
		this.layout.container.style.width = metrics.width + "px";
		this.layout.container.style.top = metrics.top + "px";
		this.layout.container.style.left = metrics.left + "px";
	},

	handleResize: function()
	{
		this.adjustPanelStyle();

		this.fillHiddenItems();
	},

	/**
	 * @param {BX.Main.grid} grid
	 */
	handleGridReady: function(grid)
	{
		if (!this.grid && grid.getContainerId() === this.params.gridId)
		{
			this.grid = grid;
		}
	},

	/**
	 * @param {BX.TileGrid.Grid} tileGrid
	 */
	handleTileGridReady: function(tileGrid)
	{
		if (!this.tileGrid && tileGrid.getId() === this.params.tileGridId)
		{
			this.tileGrid = tileGrid;
		}
	},

	/**
	 * @param {BX.Disk.TileGrid.Item} item
	 * @param {BX.TileGrid.Grid} tileGrid
	 */
	handleTileUnSelectItem: function(item, tileGrid)
	{
		if (this.showTotalSelectedBlock)
		{
			this.setTotalSelectedItems(tileGrid.getSelectedItems().length);
		}
		if (tileGrid.getSelectedItems().length === 1)
		{
			this.buildPanelByItem(tileGrid.getSelectedItems().pop());
		}
	},

	handleGridSelectItem: function()
	{
		if (this.showTotalSelectedBlock)
		{
			this.setTotalSelectedItems(this.grid.getRows().getSelectedIds().length);
		}
		if (this.grid.getRows().getSelectedIds().length > 1)
		{
			this.buildPanelByGroup();
		}
		else
		{
			this.buildPanelByItem(this.grid.getRows().getSelected().pop());
		}
	},

	/**
	 * @param {BX.Disk.TileGrid.Item} item
	 * @param {BX.TileGrid.Grid} tileGrid
	 */
	handleTileSelectItem: function(item, tileGrid)
	{
		if (this.showTotalSelectedBlock)
		{
			this.setTotalSelectedItems(tileGrid.getSelectedItems().length);
		}
		if (tileGrid.isMultiSelectMode() && tileGrid.getSelectedItems().length > 1)
		{
			this.buildPanelByGroup();
		}
		else
		{
			this.buildPanelByItem(item);
		}
	},

	/**
	 * @param {BX.Disk.TileGrid.Item|BX.Grid.Row} item
	 */
	buildPanelByItem: function(item)
	{
		var actions = item.getActions();
		var buttons = [];
		actions.forEach(function (action) {
			if (!action.hideInActionPanel)
			{
				buttons.push(action);
			}
		}.bind(this));

		this.removeItems();
		this.addItems(buttons);

		this.showPanel();
	},

	buildPanelByGroup: function()
	{
		if (!this.groupActions)
		{
			return;
		}

		var buttons = this.extractButtonsFromGroupActions(this.groupActions);
		this.removeItems();
		this.addItems(buttons);

		this.showPanel();
	},

	setTotalSelectedItems: function(totalSelectedItems)
	{
		if (this.layout.totalSelectedItem)
		{
			this.layout.totalSelectedItem.innerHTML = totalSelectedItems;
		}
	},

	extractButtonsFromGroupActions: function (groupActions)
	{
		var clonedGroupActions = BX.clone(groupActions);
		if (!clonedGroupActions['GROUPS'] || !clonedGroupActions['GROUPS'][0] ||  !clonedGroupActions['GROUPS'][0]['ITEMS'])
		{
			return [];
		}

		var buttons = [];
		var items = clonedGroupActions['GROUPS'][0]['ITEMS'];
		items.forEach(function (item) {
			if (item.TYPE === 'BUTTON')
			{
				var onclick = item.ONCHANGE.pop();
				if (onclick && onclick.ACTION === 'CALLBACK')
				{
					var firstHandler = onclick.DATA.pop();
					buttons.push({
						id: item.ID || item.VALUE,
						text: item.TEXT || item.NAME,
						title: item.TITLE,
						iconOnly: item.ICON_ONLY,
						additionalClassForPanel: item.ADDITIONAL_CLASS_FOR_PANEL,
						hiddenInPanel: item.HIDDEN_IN_PANEL,
						icon: item.ICON,
						disabled: item.DISABLED,
						onclick: firstHandler.JS
					});
				}
			}
			else if (item.TYPE === 'DROPDOWN')
			{
				buttons.push({
					id: item.ID || item.VALUE,
					text: item.TEXT || item.NAME,
					title: item.TITLE,
					iconOnly: item.ICON_ONLY,
					additionalClassForPanel: item.ADDITIONAL_CLASS_FOR_PANEL,
					hiddenInPanel: item.HIDDEN_IN_PANEL,
					icon: item.ICON,
					submenuOptions: item.SUBMENU_OPTIONS || {},
					disabled: item.DISABLED,
					items: item.ITEMS
				});
			}
		});

		return buttons;
	},

	showPanel: function()
	{
		BX.onCustomEvent(this, 'BX.UI.ActionPanel:showPanel', [this]);

		if (this.pinnedMode)
		{
			this.activatePanelItems();
		}

		if (BX.hasClass(this.layout.container, "ui-action-panel-show"))
			return;

		BX.addClass(this.layout.container, "ui-action-panel-show");
		BX.addClass(this.layout.container, "ui-action-panel-show-animate");

		var parentContainerParam = BX.pos(this.resolveRenderContainer());

		this.layout.container.style.setProperty('height', parentContainerParam.height + 'px');

		BX.addClass(document.body, 'ui-action-panel-shown');

		setTimeout(function() {
			BX.removeClass(this.layout.container, "ui-action-panel-show-animate");
		}.bind(this), 300)
	},

	disableActionItems: function ()
	{
		this.items.forEach(function (item) {
			this.disableItem(item);
		}, this);
	},

	hidePanel: function()
	{
		BX.onCustomEvent(this, 'BX.UI.ActionPanel:hidePanel', [this]);

		if (this.pinnedMode)
		{
			this.disablePanelItems();
			return;
		}

		BX.removeClass(this.layout.container, "ui-action-panel-show");
		BX.removeClass(this.layout.container, "ui-action-panel-show-animate");
		BX.addClass(this.layout.container, "ui-action-panel-hide-animate");

		// this panel already lost the class the check looks for, so only the others are counted
		if (!hasShownPanels())
		{
			BX.removeClass(document.body, 'ui-action-panel-shown');
		}

		setTimeout(function() {
			BX.removeClass(this.layout.container, "ui-action-panel-hide-animate");
		}.bind(this), 300)
	},

	activatePanelItems: function ()
	{
		if (this.layout.totalSelected)
		{
			this.layout.totalSelected.classList.remove('ui-action-panel-item-is-disabled');
		}
	},

	disablePanelItems: function ()
	{
		this.disableActionItems();
		if (this.layout.totalSelected)
		{
			this.layout.totalSelected.classList.add('ui-action-panel-item-is-disabled');
		}
		var totalSelectedCounter = document.querySelector('[data-role="action-panel-total-param"]');
		if (totalSelectedCounter)
		{
			totalSelectedCounter.textContent = '0';
		}
	},

	resolveRenderContainer: function ()
	{
		if (BX.type.isDomNode(this.renderTo))
		{
			return this.renderTo;
		}
		if (BX.type.isFunction(this.renderTo))
		{
			var node = this.renderTo.call();
			if (BX.type.isDomNode(node))
			{
				return node;
			}
		}

		throw new Error("BX.UI.ActionPanel: 'this.renderTo' has to be DomNode or function which returns DomNode");
	},

	draw: function()
	{
		this.destroyed = false;
		this.trackPanelContainer();
		this.bindEvents();
		document.body.appendChild(this.getPanelContainer());
		this.adjustPanelStyle();
		if (this.pinnedMode)
		{
			this.disablePanelItems();
		}

		setTimeout(function()
		{
			if (!this.destroyed)
			{
				this.handleResize();
			}
		}.bind(this))
	},

	/**
	 * Deferred until draw(): the parent container may be assigned after the constructor.
	 */
	trackPanelContainer: function()
	{
		var parent = this.resolveRenderContainer();
		var previous = panelsByParent.get(parent);

		if (previous && previous !== this)
		{
			previous.destroy();
		}

		this.trackedParent = parent;
		panelsByParent.set(parent, this);
	},

	destroy: function()
	{
		if (this.destroyed)
		{
			return;
		}

		this.destroyed = true;

		if (this.isMoreMenuShown())
		{
			// the close handler destroys the popup and drops the reference
			this.moreMenuWindow.close();
		}
		this.moreMenuWindow = null;

		this.unbindEvents();

		if (this.positionTracker)
		{
			this.positionTracker.stop();
			this.positionTracker = null;
		}

		if (this.trackedParent && panelsByParent.get(this.trackedParent) === this)
		{
			panelsByParent.delete(this.trackedParent);
		}
		this.trackedParent = null;

		this.removeItems();
		BX.remove(this.layout.container);

		if (!hasShownPanels())
		{
			BX.removeClass(document.body, 'ui-action-panel-shown');
		}
	},

	disableItem: function (item)
	{
		if (item)
		{
			item.disable();
		}
	}
}
})();