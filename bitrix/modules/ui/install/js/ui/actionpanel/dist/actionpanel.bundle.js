/* eslint-disable */
(function (main_core, ui_actionPanel) {
	'use strict';

	(function () {

		/**
		 * The keyboard entry point of the panel (getFirstFocusableNode, focusFirstItem) and
		 * what a hidden panel exposes to the keyboard (setPanelInteractive) are covered by
		 * unit tests that live in another module:
		 * crm/install/js/crm/kanban/tests/unit/action-panel-accessibility.test.js.
		 * This extension is legacy and has no bundle config of its own, so it cannot host
		 * a chef test suite; crm.kanban loads it and takes the classes from the BX
		 * namespace exactly as the product does.
		 *
		 * Run them when changing this file:
		 *   chef test unit crm.kanban --project chromium
		 *
		 * The panel sits under every list of Bitrix24, so a change here reaches far
		 * beyond the kanban the tests are named after.
		 */
		BX.namespace('BX.UI');

		// a parent container holds one live panel: the previous one is destroyed when a new panel is drawn
		var panelsByParent = new WeakMap();

		// A group action covers the grid with a popup, a slider or a legacy window, and all of them
		// live in the body. A click inside such a layer is not a click past the grid, so it must not
		// drop the selection the action is about to work on.
		const LAYERS_OVER_THE_GRID = ['.popup-window', '.popup-window-overlay', '.side-panel-overlay', '.bx-core-window', '.bx-core-dialog-overlay'].join(', ');

		// the body class belongs to the page, not to a panel: it stays until the last shown panel is gone
		function hasShownPanels() {
			return document.querySelector('.ui-action-panel.ui-action-panel-show') !== null;
		}
		BX.UI.ActionPanel = function (options) {
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
			this.panelInteractive = false;
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
			this.showResetAllBlock = typeof options.showResetAllBlock === 'undefined' ? this.pinnedMode ? false : true : options.showResetAllBlock;
			this.buildPanelContainer();
			if (this.pinnedMode) {
				this.buildPanelByGroup();
			}
			BX.onCustomEvent('BX.UI.ActionPanel:created', [this]);
		};
		BX.UI.ActionPanel.prototype = {
			bindEvents: function () {
				if (this.params.tileGridId) {
					this.subscribeGlobalEvent('BX.TileGrid.Grid::ready', this.handleTileGridReady.bind(this));
					this.subscribeCustomEvent(window, 'BX.TileGrid.Grid:selectItem', this.handleTileSelectItem.bind(this));
					this.subscribeCustomEvent(window, 'BX.TileGrid.Grid:checkItem', this.handleTileSelectItem.bind(this));
					this.subscribeCustomEvent(window, 'BX.TileGrid.Grid:unSelectItem', this.handleTileUnSelectItem.bind(this));
					this.subscribeCustomEvent(window, 'BX.TileGrid.Grid:redraw', this.hidePanel.bind(this));
					this.subscribeCustomEvent(window, 'BX.TileGrid.Grid:defineEscapeKey', this.hidePanel.bind(this));
					this.subscribeCustomEvent(window, 'BX.TileGrid.Grid:lastSelectedItem', this.hidePanel.bind(this));
					this.subscribeCustomEvent(window, 'BX.TileGrid.Grid:multiSelectModeOff', this.hidePanel.bind(this));
				}
				if (this.params.gridId) {
					this.subscribeGlobalEvent('Grid::ready', this.handleGridReady.bind(this));
					this.subscribeGlobalEvent('Grid::thereSelectedRows', this.handleGridSelectItem.bind(this));
					this.subscribeGlobalEvent('Grid::allRowsSelected', this.handleGridSelectItem.bind(this));
					this.subscribeGlobalEvent('Grid::updated', this.hidePanel.bind(this));
					this.subscribeGlobalEvent('Grid::noSelectedRows', this.hidePanel.bind(this));
					this.subscribeGlobalEvent('Grid::allRowsUnselected', this.hidePanel.bind(this));
				}
				if (this.autoHide) {
					// resolved on every call: consumers replace handleOuterClick on the instance
					this.bindWindowEvent('click', function (event) {
						this.handleOuterClick(event);
					}.bind(this));
				}
				this.subscribeCustomEvent(this, 'BX.UI.ActionPanel:clickResetAllBlock', this.hidePanel.bind(this));

				// the tracker owns the only scroll and resize subscription: it recalculates the position
				// itself and calls back for the overflow, so no second window listener reads the same layout
				this.getPositionTracker().start();
			},
			bindWindowEvent: function (eventName, handler) {
				this.boundEvents.push({
					eventName: eventName,
					handler: handler
				});
				BX.bind(window, eventName, handler);
			},
			subscribeGlobalEvent: function (eventName, handler) {
				this.boundCustomEvents.push({
					target: null,
					eventName: eventName,
					handler: handler
				});
				BX.addCustomEvent(eventName, handler);
			},
			subscribeCustomEvent: function (target, eventName, handler) {
				this.boundCustomEvents.push({
					target: target,
					eventName: eventName,
					handler: handler
				});
				BX.addCustomEvent(target, eventName, handler);
			},
			unbindEvents: function () {
				this.boundEvents.forEach(function (binding) {
					BX.unbind(window, binding.eventName, binding.handler);
				});
				this.boundEvents = [];
				this.boundCustomEvents.forEach(function (subscription) {
					subscription.target ? BX.removeCustomEvent(subscription.target, subscription.eventName, subscription.handler) : BX.removeCustomEvent(subscription.eventName, subscription.handler);
				});
				this.boundCustomEvents = [];
			},
			getPositionTracker: function () {
				if (!this.positionTracker) {
					this.positionTracker = new ui_actionPanel.PositionTracker({
						parent: this.resolveRenderContainer.bind(this),
						maxHeight: this.maxHeight ? Number(this.maxHeight) : null,
						onApply: this.handlePositionChange.bind(this),
						onModeChange: this.floatMode ? this.handleScroll.bind(this) : null,
						onGeometryChange: this.handleGeometryChange.bind(this)
					});
				}
				return this.positionTracker;
			},
			getOverflowCalculator: function () {
				if (!this.overflowCalculator) {
					this.overflowCalculator = new ui_actionPanel.OverflowCalculator({
						getItems: function () {
							return this.items;
						}.bind(this),
						isNotFit: function (item) {
							return item.isNotFit();
						},
						hasMoreBlock: function () {
							return Boolean(this.layout.more);
						}.bind(this),
						addMoreBlock: function () {
							this.appendMoreBlock();
						}.bind(this),
						removeMoreBlock: function () {
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
			getItemById: function (id) {
				return this.items.find(function (item) {
					return item.id === id;
				});
			},
			/**
			 * Returns the node of the first panel item that can take keyboard focus: enabled,
			 * shown and reachable from the keyboard. Items that are disabled, hidden or have no
			 * accessible name are skipped -- focus on them is either a dead end or a no-op.
			 * A panel that is not shown returns null for the same reason.
			 *
			 * This is the supported way for a consumer to reach into the panel: the markup of
			 * the panel (class names, data attributes, the node that actually holds focus for
			 * an item) is internal and changes without notice.
			 *
			 * @returns {HTMLElement|null}
			 */
			getFirstFocusableNode: function () {
				// A hidden panel has nothing to offer: its actions are invisible, and the
				// browser refuses focus inside an inert subtree anyway.
				if (!this.panelInteractive) {
					return null;
				}
				for (var i = 0; i < this.items.length; i++) {
					var node = this.items[i].getFocusableNode();
					if (node) {
						return node;
					}
				}
				return null;
			},
			/**
			 * Moves keyboard focus to the first focusable panel item, see getFirstFocusableNode().
			 * Part of the panel contract.
			 *
			 * @returns {boolean} whether focus has been moved
			 */
			focusFirstItem: function () {
				var node = this.getFirstFocusableNode();
				if (!node) {
					return false;
				}
				node.focus();
				return document.activeElement === node;
			},
			addItems: function (items) {
				items.forEach(function (item) {
					this.appendItem(item);
				}.bind(this));
				this.fillHiddenItems();
			},
			buildItem: function (options) {
				options.actionPanel = this;
				return new BX.UI.ActionPanel.Item(options);
			},
			appendItem: function (options) {
				if (options.hiddenInPanel !== true) {
					var item = this.buildItem(options);
					this.items.push(item);
					this.layout.itemContainer.appendChild(item.render());

					// The panel is filled and refilled while it is hidden, so an item has to
					// arrive in the state the panel is in, see setPanelInteractive().
					if (!this.panelInteractive) {
						item.setTabbable(false);
					}
				}
			},
			fillHiddenItems: function () {
				this.overflowWidth = this.appliedWidth;
				this.hiddenItems = this.getOverflowCalculator().recalc();
			},
			removeItems: function () {
				this.items.forEach(function (item) {
					item.destroy();
				});
				this.items = [];
				this.getOverflowCalculator().clear();
				this.hiddenItems = [];
			},
			getMoreBlock: function () {
				if (!this.layout.more) {
					this.layout.more = BX.create("div", {
						props: {
							className: "ui-action-panel-more"
						},
						attrs: {
							role: 'button',
							// The block is built on demand, and a window resize builds it while
							// the panel is hidden, see setPanelInteractive().
							tabindex: this.panelInteractive ? '0' : '-1',
							'aria-haspopup': 'menu',
							'aria-expanded': 'false',
							'data-testid': 'ui-action-panel-more-btn'
						},
						text: BX.message('JS_UI_ACTIONPANEL_MORE_BLOCK'),
						events: {
							click: this.handleClickMoreBlock.bind(this),
							keydown: function (event) {
								if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
									event.preventDefault();
									this.handleClickMoreBlock(event);
								}
							}.bind(this)
						}
					});
				}
				return this.layout.more;
			},
			appendMoreBlock: function () {
				this.layout.container.appendChild(this.getMoreBlock());
			},
			getResetAllBlock: function () {
				this.layout.reset = BX.create("div", {
					props: {
						className: "ui-action-panel-reset"
					}
				});
				this.removeLeftPosition ? BX.addClass(this.layout.reset, "ui-action-panel-reset-ordert-first") : null;
				BX.bind(this.layout.reset, "click", function () {
					BX.onCustomEvent(this, 'BX.UI.ActionPanel:clickResetAllBlock');
					this.resetAllSection();
				}.bind(this));
				return this.layout.reset;
			},
			resetAllSection: function () {
				if (this.grid) {
					this.grid.getRows().unselectAll();
					this.grid.adjustCheckAllCheckboxes();
				} else if (this.tileGrid) {
					this.tileGrid.resetSetMultiSelectMode();
					this.tileGrid.resetSelectAllItems();
					this.tileGrid.resetFromToItems();
				}
			},
			handleScroll: function () {
				if (this.getDistanceFromTop() > 0) {
					if (this.panelIsFixed) this.unfixPanel();
				} else {
					if (!this.panelIsFixed) this.fixPanel();
				}
				this.adjustMoreMenuPosition();
			},
			adjustMoreMenuPosition: function () {
				if (this.isMoreMenuShown()) {
					this.moreMenuWindow.popupWindow.adjustPosition();
				}
			},
			isMoreMenuShown: function () {
				return Boolean(this.moreMenuWindow) && this.moreMenuWindow.popupWindow.isShown();
			},
			handleOuterClick: function (event) {
				var target = BX.getEventTarget(event);
				if (BX.hasClass(target, "ui-action-panel")) {
					return;
				}
				if (BX.findParent(target, {
					className: "ui-action-panel"
				})) {
					return;
				}
				if (BX.findParent(target, {
					className: "main-grid-container"
				})) {
					return;
				}
				if (BX.findParent(target, {
					className: "ui-grid-tile-item"
				})) {
					return;
				}
				if (BX.findParent(target, {
					className: "main-kanban-item"
				})) {
					return;
				}
				if (target && target.closest && target.closest(LAYERS_OVER_THE_GRID)) {
					return;
				}
				this.hidePanel();
				if (this.grid) {
					this.resetAllSection();
				}
			},
			handleClickMoreBlock: function (event) {
				for (var i = 0; i < this.hiddenItems.length; i++) {
					if (this.hiddenItems[i].buttonIconClass && this.hiddenItems[i].text.length === 0) {
						this.hiddenItems[i].className = "menu-popup-no-icon ui-btn ui-btn-link " + this.hiddenItems[i].buttonIconClass;
						this.hiddenItems[i].html = '<span></span>';
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
						onPopupShow: function () {
							BX.bind(popupMenu.popupWindow.popupContainer, 'click', function (event) {
								var target = BX.getEventTarget(event);
								var item = BX.findParent(target, {
									className: 'menu-popup-item'
								}, 10);
								if (!item || !item.dataset.preventCloseContextMenu) {
									popupMenu.close();
								}
							});
						},
						onPopupClose: function () {
							this.moreMenuWindow = null;
							popupMenu.destroy();

							// getMoreBlock() recreates the node: a destroyed panel must not get its markup back
							if (!this.destroyed) {
								BX.removeClass(this.getMoreBlock(), "ui-action-panel-item-active");
								this.getMoreBlock().setAttribute('aria-expanded', 'false');
							}
						}.bind(this)
					}
				});
				popupMenu.layout.menuContainer.setAttribute("data-tile-grid", "tile-grid-stop-close");
				// kept on the instance: the position is re-applied per frame of scrolling, and looking the
				// menu up on every one of them costs more than the adjustment itself
				this.moreMenuWindow = popupMenu;
				popupMenu.show();
				this.getMoreBlock().setAttribute('aria-expanded', 'true');
			},
			removeMoreBlock: function () {
				if (!this.layout.more) return;
				BX.remove(this.layout.more);
				this.layout.more = null;
			},
			getDistanceFromTop: function () {
				return this.resolveRenderContainer().getBoundingClientRect().top;
			},
			fixPanel: function () {
				BX.addClass(this.layout.container, "ui-action-panel-fixed");
				this.panelIsFixed = true;
				// consumers move the container before calling the original, so the recalculation belongs here
				this.adjustPanelStyle();
			},
			unfixPanel: function () {
				BX.removeClass(this.layout.container, "ui-action-panel-fixed");
				this.panelIsFixed = null;
				this.adjustPanelStyle();
			},
			buildPanelContainer: function () {
				this.layout.container = BX.create("div", {
					attrs: {
						className: ['ui-action-panel', this.darkMode ? 'ui-action-panel-darkmode' : '', this.className].join(' ')
					},
					dataset: {
						tileGrid: "tile-grid-stop-close"
					},
					children: [this.showTotalSelectedBlock ? this.getTotalSelectedBlock() : null, this.getItemContainer(), this.showResetAllBlock ? this.getResetAllBlock() : null]
				});
				this.maxHeight ? this.layout.container.style.maxHeight = this.maxHeight + "px" : null;

				// The panel is built hidden and is shown only once something is selected.
				this.setPanelInteractive(false);
			},
			/**
			 * Follows the visibility of the panel with its operability.
			 *
			 * A hidden panel is only faded out (.ui-action-panel has opacity: 0 and
			 * pointer-events: none), so without this its actions and its "more" block keep
			 * their place in the Tab order and in the accessibility tree: once the selection
			 * is dropped, Tab would walk through actions nobody can see (WCAG 2.4.3, 4.1.2).
			 *
			 * Both mechanisms are used on purpose. 'inert' is the one that answers for the
			 * whole subtree, whatever appears inside it later and however the panel is
			 * filled, and it takes the panel out of the accessibility tree as well; the
			 * tabindex switch keeps a browser that does not support the attribute out of the
			 * same trap. Nothing else about an item is touched, so a panel shown again is
			 * exactly the panel that was hidden.
			 *
			 * @param {boolean} interactive
			 */
			setPanelInteractive: function (interactive) {
				this.panelInteractive = interactive;
				if (this.layout.container) {
					interactive ? this.layout.container.removeAttribute('inert') : this.layout.container.setAttribute('inert', '');
				}
				this.items.forEach(function (item) {
					item.setTabbable(interactive);
				});
				if (this.layout.more) {
					this.layout.more.setAttribute('tabindex', interactive ? '0' : '-1');
				}
			},
			getItemContainer: function () {
				return this.layout.itemContainer = BX.create('div', {
					props: {
						className: 'ui-action-panel-wrapper'
					},
					style: {
						textAlign: this.alignItems ? this.alignItems : null
					}
				});
			},
			getTotalSelectedBlock: function () {
				return this.layout.totalSelected = BX.create('div', {
					props: {
						className: this.removeLeftPosition ? 'ui-action-panel-total ui-action-panel-total-without-border' : 'ui-action-panel-total'
					},
					dataset: {
						role: 'action-panel-total'
					},
					children: [BX.create('span', {
						props: {
							className: 'ui-action-panel-total-label'
						},
						text: BX.message('JS_UI_ACTIONPANEL_IS_SELECTED')
					}), this.layout.totalSelectedItem = BX.create('span', {
						props: {
							className: 'ui-action-panel-total-param'
						},
						dataset: {
							role: 'action-panel-total-param'
						}
					})]
				});
			},
			getPanelContainer: function () {
				return this.layout.container;
			},
			adjustPanelStyle: function () {
				var tracker = this.getPositionTracker();
				tracker.setMaxHeight(this.maxHeight ? Number(this.maxHeight) : null);
				tracker.refresh();
			},
			handlePositionChange: function (metrics) {
				this.appliedWidth = metrics.width;
				this.applyPositionMetrics(metrics);
				if (this.isMoreMenuShown()) {
					this.adjustMoreMenuPosition();
				}
			},
			/**
			 * The tracker has already applied the new position by now, so only the overflow is left. A pass
			 * reads the geometry of every item and may add or drop the more block, while the tracker reports
			 * a change once per frame of scrolling: a row that kept its width folds exactly as it did before.
			 */
			handleGeometryChange: function () {
				if (this.appliedWidth === this.overflowWidth) {
					return;
				}
				this.fillHiddenItems();
			},
			applyPositionMetrics: function (metrics) {
				this.layout.container.style.width = metrics.width + "px";
				this.layout.container.style.top = metrics.top + "px";
				this.layout.container.style.left = metrics.left + "px";
			},
			handleResize: function () {
				this.adjustPanelStyle();
				this.fillHiddenItems();
			},
			/**
			 * @param {BX.Main.grid} grid
			 */
			handleGridReady: function (grid) {
				if (!this.grid && grid.getContainerId() === this.params.gridId) {
					this.grid = grid;
				}
			},
			/**
			 * @param {BX.TileGrid.Grid} tileGrid
			 */
			handleTileGridReady: function (tileGrid) {
				if (!this.tileGrid && tileGrid.getId() === this.params.tileGridId) {
					this.tileGrid = tileGrid;
				}
			},
			/**
			 * @param {BX.Disk.TileGrid.Item} item
			 * @param {BX.TileGrid.Grid} tileGrid
			 */
			handleTileUnSelectItem: function (item, tileGrid) {
				if (this.showTotalSelectedBlock) {
					this.setTotalSelectedItems(tileGrid.getSelectedItems().length);
				}
				if (tileGrid.getSelectedItems().length === 1) {
					this.buildPanelByItem(tileGrid.getSelectedItems().pop());
				}
			},
			handleGridSelectItem: function () {
				if (this.showTotalSelectedBlock) {
					this.setTotalSelectedItems(this.grid.getRows().getSelectedIds().length);
				}
				if (this.grid.getRows().getSelectedIds().length > 1) {
					this.buildPanelByGroup();
				} else {
					this.buildPanelByItem(this.grid.getRows().getSelected().pop());
				}
			},
			/**
			 * @param {BX.Disk.TileGrid.Item} item
			 * @param {BX.TileGrid.Grid} tileGrid
			 */
			handleTileSelectItem: function (item, tileGrid) {
				if (this.showTotalSelectedBlock) {
					this.setTotalSelectedItems(tileGrid.getSelectedItems().length);
				}
				if (tileGrid.isMultiSelectMode() && tileGrid.getSelectedItems().length > 1) {
					this.buildPanelByGroup();
				} else {
					this.buildPanelByItem(item);
				}
			},
			/**
			 * @param {BX.Disk.TileGrid.Item|BX.Grid.Row} item
			 */
			buildPanelByItem: function (item) {
				var actions = item.getActions();
				var buttons = [];
				actions.forEach(function (action) {
					if (!action.hideInActionPanel) {
						buttons.push(action);
					}
				}.bind(this));
				this.removeItems();
				this.addItems(buttons);
				this.showPanel();
			},
			buildPanelByGroup: function () {
				if (!this.groupActions) {
					return;
				}
				var buttons = this.extractButtonsFromGroupActions(this.groupActions);
				this.removeItems();
				this.addItems(buttons);
				this.showPanel();
			},
			setTotalSelectedItems: function (totalSelectedItems) {
				if (this.layout.totalSelectedItem) {
					this.layout.totalSelectedItem.innerHTML = totalSelectedItems;
				}
			},
			extractButtonsFromGroupActions: function (groupActions) {
				var clonedGroupActions = BX.clone(groupActions);
				if (!clonedGroupActions['GROUPS'] || !clonedGroupActions['GROUPS'][0] || !clonedGroupActions['GROUPS'][0]['ITEMS']) {
					return [];
				}
				var buttons = [];
				var items = clonedGroupActions['GROUPS'][0]['ITEMS'];
				items.forEach(function (item) {
					if (item.TYPE === 'BUTTON') {
						var onclick = item.ONCHANGE.pop();
						if (onclick && onclick.ACTION === 'CALLBACK') {
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
					} else if (item.TYPE === 'DROPDOWN') {
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
			showPanel: function () {
				BX.onCustomEvent(this, 'BX.UI.ActionPanel:showPanel', [this]);
				if (this.pinnedMode) {
					this.activatePanelItems();
				}

				// Before the early return below, so a panel that is already shown cannot be
				// left inert by a state the caller did not expect.
				this.setPanelInteractive(true);
				if (BX.hasClass(this.layout.container, "ui-action-panel-show")) return;
				BX.addClass(this.layout.container, "ui-action-panel-show");
				BX.addClass(this.layout.container, "ui-action-panel-show-animate");
				var parentContainerParam = BX.pos(this.resolveRenderContainer());
				this.layout.container.style.setProperty('height', parentContainerParam.height + 'px');
				BX.addClass(document.body, 'ui-action-panel-shown');
				setTimeout(function () {
					BX.removeClass(this.layout.container, "ui-action-panel-show-animate");
				}.bind(this), 300);
			},
			disableActionItems: function () {
				this.items.forEach(function (item) {
					this.disableItem(item);
				}, this);
			},
			hidePanel: function () {
				BX.onCustomEvent(this, 'BX.UI.ActionPanel:hidePanel', [this]);

				// A pinned panel stays on the screen and only disables its items, so it keeps
				// answering to the keyboard the same way it answers to the mouse.
				if (this.pinnedMode) {
					this.disablePanelItems();
					return;
				}
				this.setPanelInteractive(false);
				BX.removeClass(this.layout.container, "ui-action-panel-show");
				BX.removeClass(this.layout.container, "ui-action-panel-show-animate");
				BX.addClass(this.layout.container, "ui-action-panel-hide-animate");

				// this panel already lost the class the check looks for, so only the others are counted
				if (!hasShownPanels()) {
					BX.removeClass(document.body, 'ui-action-panel-shown');
				}
				setTimeout(function () {
					BX.removeClass(this.layout.container, "ui-action-panel-hide-animate");
				}.bind(this), 300);
			},
			activatePanelItems: function () {
				if (this.layout.totalSelected) {
					this.layout.totalSelected.classList.remove('ui-action-panel-item-is-disabled');
				}
			},
			disablePanelItems: function () {
				this.disableActionItems();
				if (this.layout.totalSelected) {
					this.layout.totalSelected.classList.add('ui-action-panel-item-is-disabled');
				}
				var totalSelectedCounter = document.querySelector('[data-role="action-panel-total-param"]');
				if (totalSelectedCounter) {
					totalSelectedCounter.textContent = '0';
				}
			},
			resolveRenderContainer: function () {
				if (BX.type.isDomNode(this.renderTo)) {
					return this.renderTo;
				}
				if (BX.type.isFunction(this.renderTo)) {
					var node = this.renderTo.call();
					if (BX.type.isDomNode(node)) {
						return node;
					}
				}
				throw new Error("BX.UI.ActionPanel: 'this.renderTo' has to be DomNode or function which returns DomNode");
			},
			draw: function () {
				this.destroyed = false;
				this.trackPanelContainer();
				this.bindEvents();
				document.body.appendChild(this.getPanelContainer());
				this.adjustPanelStyle();
				if (this.pinnedMode) {
					this.disablePanelItems();
				}
				setTimeout(function () {
					if (!this.destroyed) {
						this.handleResize();
					}
				}.bind(this));
			},
			/**
			 * Deferred until draw(): the parent container may be assigned after the constructor.
			 */
			trackPanelContainer: function () {
				var parent = this.resolveRenderContainer();
				var previous = panelsByParent.get(parent);
				if (previous && previous !== this) {
					previous.destroy();
				}
				this.trackedParent = parent;
				panelsByParent.set(parent, this);
			},
			destroy: function () {
				if (this.destroyed) {
					return;
				}
				this.destroyed = true;
				if (this.isMoreMenuShown()) {
					// the close handler destroys the popup and drops the reference
					this.moreMenuWindow.close();
				}
				this.moreMenuWindow = null;
				this.unbindEvents();
				if (this.positionTracker) {
					this.positionTracker.stop();
					this.positionTracker = null;
				}
				if (this.trackedParent && panelsByParent.get(this.trackedParent) === this) {
					panelsByParent.delete(this.trackedParent);
				}
				this.trackedParent = null;
				this.removeItems();
				BX.remove(this.layout.container);
				if (!hasShownPanels()) {
					BX.removeClass(document.body, 'ui-action-panel-shown');
				}
			},
			disableItem: function (item) {
				if (item) {
					item.disable();
				}
			}
		};
	})();

	var item = {};

	var hasRequiredItem;

	function requireItem () {
		if (hasRequiredItem) return item;
		hasRequiredItem = 1;
		(function () {

			/**
			 * Accessibility of the panel items (button semantics, Tab order, Enter/Space
			 * activation, getFocusableNode) is covered by unit tests that live in another
			 * module: crm/install/js/crm/kanban/tests/unit/action-panel-accessibility.test.js.
			 * This extension is legacy and has no bundle config of its own, so it cannot host
			 * a chef test suite; crm.kanban loads it and takes the classes from the BX
			 * namespace exactly as the product does.
			 *
			 * Run them when changing this file:
			 *   chef test unit crm.kanban --project chromium
			 *
			 * The panel sits under every list of Bitrix24, so a change here reaches far
			 * beyond the kanban the tests are named after.
			 */
			BX.namespace('BX.UI');

			// Nodes that take keyboard focus on their own.
			//
			// One list answers both questions an item asks -- "can this node be focused" and
			// "does the item already contain something interactive" -- because the two must
			// not disagree. Content that cannot be focused (a disabled control, tabindex="-1")
			// would otherwise stop the item from becoming a button while offering nothing to
			// focus in its place, leaving the whole item unreachable from the keyboard.
			//
			// Such content may then end up inside a role="button", and that is allowed: what
			// ARIA forbids there is a focusable descendant. It does lose its own place in the
			// accessibility tree, which is the correct reading anyway -- it is not operable,
			// while the item as a whole is.
			var focusableSelector = ['a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])', 'select:not([disabled])', 'textarea:not([disabled])', 'summary', '[contenteditable]:not([contenteditable="false"])', '[tabindex]:not([tabindex="-1"])'].join(', ');
			function isFocusableNode(node) {
				return node.matches(focusableSelector);
			}

			/**
			 * Tells whether the node is laid out. Focus silently stays where it was when it
			 * is moved to a node with 'display: none', which is how the panel hides items.
			 *
			 * @param {HTMLElement} node
			 * @returns {boolean}
			 */
			function isDisplayed(node) {
				for (var current = node; current && current.nodeType === 1; current = current.parentElement) {
					if (current.hidden || current.style && current.style.display === 'none') {
						return false;
					}
				}

				// A node outside the document has no boxes to measure, so the inline check above
				// is all there is; inside the document an empty rect list means it is not rendered.
				return !node.isConnected || node.getClientRects().length > 0;
			}
			BX.UI.ActionPanel.Item = function (options) {
				this.id = options.id;
				this.type = options.type;
				this.text = options.text;
				this.html = options.text;
				this.icon = options.icon;
				this.title = options.title;
				this.iconOnly = options.iconOnly;
				this.additionalClassForPanel = options.additionalClassForPanel;
				this.submenuOptions = {};
				if (options.submenuOptions && BX.type.isString(options.submenuOptions)) {
					try {
						this.submenuOptions = JSON.parse(options.submenuOptions);
					} catch (e) {}
				}
				this.buttonIconClass = options.buttonIconClass;
				this.onclick = options.onclick;
				this.href = options.href;
				this.items = options.items;
				this.actionPanel = options.actionPanel;
				this.options = options;
				this.attributes = BX.prop.getObject(options, 'attributes');
				this.dataset = options.dataset;
				this.disabled = options.disabled;
				this.submenuTrigger = null;
				this.layout = {
					container: null,
					icon: null,
					text: null
				};
			};
			BX.UI.ActionPanel.Item.prototype = {
				changeIconClass: function (iconClass) {
					BX.removeClass(this.layout.container, this.buttonIconClass);
					BX.addClass(this.layout.container, iconClass);
					this.buttonIconClass = iconClass;
				},
				/**
				 * Test id of the item. The panel renders many items at once, so the shared
				 * prefix alone selects all of them; the item id is mixed in to tell them
				 * apart. Items without an id keep the bare prefix, hence the "starts with"
				 * form in selectors: '[data-testid^="ui-action-panel-item"]'.
				 *
				 * @returns {string}
				 */
				getTestId: function () {
					var base = 'ui-action-panel-item';
					return BX.type.isNotEmptyString(this.id) || BX.type.isNumber(this.id) ? base + '-' + this.id : base;
				},
				render: function () {
					var selectorType;
					this.href ? selectorType = "a" : selectorType = "div";
					var className = "ui-action-panel-item " + (this.additionalClassForPanel ? this.additionalClassForPanel + ' ' : '') + (this.disabled ? 'ui-action-panel-item-is-disabled' : '');
					if (this.buttonIconClass) {
						className = 'ui-btn ui-btn-lg ui-btn-link ' + this.buttonIconClass;
					}
					if (this.onclick && BX.type.isArray(this.items) && this.items.length > 0) {
						// Native <button> submenu trigger: mark it as a menu opener for AT.
						// It is icon-only, so the name comes from aria-label built on the main button text.
						var submenuTriggerAttrs = {
							'aria-haspopup': 'menu',
							'aria-expanded': 'false',
							'data-testid': this.getTestId() + '-submenu-trigger'
						};
						var submenuTriggerLabel = this.getSubmenuTriggerLabel();
						if (submenuTriggerLabel) {
							submenuTriggerAttrs['aria-label'] = submenuTriggerLabel;
						}
						this.submenuTrigger = BX.create('button', {
							props: {
								className: 'ui-btn-menu'
							},
							attrs: submenuTriggerAttrs,
							events: {
								click: this.handleMenuClick.bind(this)
							}
						});
						this.layout.container = BX.create('div', {
							props: {
								className: 'ui-btn-split ui-btn-link' + (this.buttonIconClass ? ' ' + this.buttonIconClass : '')
							},
							children: [BX.create('button', {
								props: {
									className: 'ui-btn-main'
								},
								events: {
									click: this.handleMainClick.bind(this)
								},
								text: this.text
							}), this.submenuTrigger],
							attrs: this.attributes,
							dataset: {
								role: 'action-panel-item',
								testid: this.getTestId()
							}
						});
					} else {
						this.layout.container = BX.create(selectorType, {
							props: {
								className: className
							},
							children: [this.icon ? '<span class="ui-action-panel-item-icon"><img src="' + this.icon + '"></span>' : null, this.text && !this.buttonIconClass && this.iconOnly !== true ? '<span class="ui-action-panel-item-title">' + this.text + '</span>' : this.iconOnly !== true ? this.text : null],
							attrs: this.attributes,
							dataset: {
								role: 'action-panel-item',
								testid: this.getTestId()
							},
							events: {
								click: this.handleClick.bind(this)
							}
						});
						this.makeItemAccessible();
					}
					this.href ? this.layout.container.setAttribute('href', this.href) : null;
					this.href || this.title ? this.layout.container.setAttribute('title', this.title ? this.title : this.text) : null;
					if (BX.type.isString(this.onclick)) {
						this.layout.container.setAttribute('onclick', this.onclick);
					}
					if (this.dataset) {
						BX.adjust(this.layout.container, {
							'dataset': this.dataset
						});
					}
					if (this.options.hide) {
						this.hide();
					}
					if (this.id) {
						this.layout.container.id = this.id;
					}
					return this.layout.container;
				},
				/**
				 * Tells whether the item will expose a name to assistive technology: own text,
				 * a title attribute (set right after render) or an explicitly passed aria-label.
				 *
				 * @param {HTMLElement} container
				 * @returns {boolean}
				 */
				hasAccessibleName: function (container) {
					if (BX.util.trim(container.textContent || '') !== '') {
						return true;
					}
					if (BX.type.isNotEmptyString(this.title)) {
						return true;
					}
					return BX.type.isNotEmptyString(container.getAttribute('aria-label')) || BX.type.isNotEmptyString(container.getAttribute('aria-labelledby'));
				},
				/**
				 * Tells whether the rendered item contains a control the keyboard can reach on its
				 * own. The check runs over the parsed markup, not over the source string, so it also
				 * covers content added to the item after render, and it uses the same definition of
				 * a focusable node as getFocusableNode(): whatever stops the item from becoming a
				 * button has to be something getFocusableNode() can then offer instead.
				 *
				 * @param {HTMLElement} container
				 * @returns {boolean}
				 */
				hasInteractiveContent: function (container) {
					return container.querySelector(focusableSelector) !== null;
				},
				/**
				 * Returns the node that takes keyboard focus for this item, or null when the item
				 * cannot be focused: disabled, hidden or not keyboard reachable at all. Part of the
				 * panel contract, see BX.UI.ActionPanel.getFirstFocusableNode().
				 *
				 * @returns {HTMLElement|null}
				 */
				getFocusableNode: function () {
					var container = this.layout.container;
					if (!container || this.isDisabled() || !this.isVisible() || !isDisplayed(container)) {
						return null;
					}
					if (isFocusableNode(container)) {
						return container;
					}

					// A split button keeps the item semantics on its native child buttons, and an
					// item with interactive content is reachable through that content.
					var child = container.querySelector(focusableSelector);
					return child && isDisplayed(child) ? child : null;
				},
				/**
				 * Builds an accessible name for the icon-only submenu trigger of a split button.
				 * A main button without text leaves nothing to build the name from, so the
				 * trigger takes the name the panel already gives its own menu opener.
				 *
				 * @returns {string}
				 */
				getSubmenuTriggerLabel: function () {
					var text = BX.type.isNotEmptyString(this.text) ? BX.util.trim(this.text) : '';
					if (text === '') {
						return BX.message('JS_UI_ACTIONPANEL_MORE_BLOCK') || '';
					}
					var template = BX.message('JS_UI_ACTIONPANEL_SUBMENU_TRIGGER_FOR');
					return template ? template.replace('#TEXT#', text) : text;
				},
				/**
				 * Makes a non-native panel item (rendered as a <div>) keyboard-reachable and
				 * semantically a button: role, tabindex and Enter/Space activation. Links
				 * (<a href>) are natively focusable and left untouched. Submenu triggers get
				 * menu semantics.
				 */
				makeItemAccessible: function () {
					var container = this.layout.container;
					if (!container || this.href) {
						return;
					}

					// An icon-only item without a title has no text at all: making it focusable
					// would put a nameless control into the accessibility tree, so leave it as is.
					if (!this.hasAccessibleName(container)) {
						return;
					}

					// 'text' is rendered as markup, so a consumer may put a link or a form control
					// inside the item. Content the keyboard can reach on its own must not be wrapped
					// in a button; the item keeps its plain semantics and stays reachable through the
					// control it contains. Content that cannot be reached does not count -- see
					// focusableSelector.
					if (this.hasInteractiveContent(container)) {
						return;
					}
					container.setAttribute('role', 'button');
					container.setAttribute('tabindex', this.disabled ? '-1' : '0');
					if (this.disabled) {
						container.setAttribute('aria-disabled', 'true');
					}
					if (BX.type.isArray(this.items) && this.items.length > 0) {
						container.setAttribute('aria-haspopup', 'menu');
						container.setAttribute('aria-expanded', 'false');
						this.submenuTrigger = container;
					}
					BX.bind(container, 'keydown', this.handleKeyDown.bind(this));
				},
				/**
				 * Activates the item on Enter/Space, matching a native button.
				 *
				 * Activation goes through a click dispatched on the item node, not through a direct
				 * call of the click handler. An item carries its action either as a function, which
				 * consumers write against a MouseEvent, or as a string, which lands in the inline
				 * onclick attribute and only ever runs on a real click event. Dispatching makes the
				 * keyboard do exactly what the mouse does for both kinds.
				 *
				 * @param {KeyboardEvent} event
				 */
				handleKeyDown: function (event) {
					if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') {
						return;
					}
					event.preventDefault();
					if (this.isDisabled()) {
						return;
					}
					this.layout.container.click();
				},
				show: function () {
					BX.show(this.layout.container, 'block');
				},
				showAsInlineBlock: function () {
					BX.style(this.layout.container, 'display', 'inline-block');
				},
				hide: function () {
					BX.hide(this.layout.container, 'none');
				},
				destroy: function () {
					BX.remove(this.layout.container);
				},
				isVisible: function () {
					if (this.layout.container.offsetTop > 8) {
						return false;
					}
					return true;
				},
				isNotFit: function () {
					return this.layout.container.offsetHeight > 0 && !this.isVisible();
				},
				handleMenuClick: function (event) {
					if (this.isDisabled()) {
						event.preventDefault();
						return;
					}
					return this.openSubMenu();
				},
				handleMainClick: function (event) {
					if (this.isDisabled()) {
						event.preventDefault();
						return;
					}
					if (BX.type.isFunction(this.onclick)) {
						this.onclick.call(this, event, this);
					}
				},
				handleClick: function (event) {
					if (this.isDisabled()) {
						event.preventDefault();
						return;
					}
					if (BX.type.isArray(this.items) && this.items.length > 0) {
						this.openSubMenu();
					} else {
						if (BX.type.isFunction(this.onclick)) {
							this.onclick.call(this, event, this);
						}
					}
				},
				isDisabled: function () {
					return this.disabled;
				},
				/**
				 * Puts the item in or out of the Tab order. Only an item that carries the button
				 * semantics itself is written to: a link is natively focusable and content a
				 * consumer put inside the item is not this extension's to touch.
				 *
				 * Called both when the item is enabled or disabled and when the whole panel is
				 * shown or hidden, see BX.UI.ActionPanel.setPanelInteractive(). A disabled item
				 * stays out of the Tab order in any case.
				 *
				 * @param {boolean} tabbable
				 */
				setTabbable: function (tabbable) {
					var container = this.layout ? this.layout.container : null;
					if (!container || container.getAttribute('role') !== 'button') {
						return;
					}
					container.setAttribute('tabindex', tabbable && !this.isDisabled() ? '0' : '-1');
				},
				disable: function () {
					this.disabled = true;
					if (this.layout && this.layout.container) {
						BX.data(this.layout.container, 'slider-ignore-autobinding', true);
						this.layout.container.classList.add('ui-action-panel-item-is-disabled');
						if (this.layout.container.getAttribute('role') === 'button') {
							this.layout.container.setAttribute('aria-disabled', 'true');
						}
						this.setTabbable(false);
					}
				},
				enable: function () {
					this.disabled = false;
					if (this.layout && this.layout.container) {
						BX.data(this.layout.container, 'slider-ignore-autobinding', false);
						this.layout.container.classList.remove('ui-action-panel-item-is-disabled');
						if (this.layout.container.getAttribute('role') === 'button') {
							this.layout.container.setAttribute('aria-disabled', 'false');
						}
						this.setTabbable(true);
					}
				},
				openSubMenu: function () {
					if (!BX.type.isArray(this.items) || this.items.length === 0) {
						return;
					}
					var bindElement = this.layout.container;
					var submenuTrigger = this.submenuTrigger;
					var popupMenuOptions = {
						className: "ui-action-panel-item-popup-menu",
						angle: true,
						zIndex: this.actionPanel.zIndex ? this.actionPanel.zIndex + 1 : null,
						offsetLeft: bindElement.offsetWidth / 2,
						closeByEsc: true,
						events: {
							onPopupClose: function () {
								popupMenu.destroy();
								BX.removeClass(bindElement, "ui-action-panel-item-active");
								if (submenuTrigger) {
									submenuTrigger.setAttribute('aria-expanded', 'false');
								}
							}
						}
					};
					popupMenuOptions = BX.mergeEx(popupMenuOptions, this.submenuOptions);
					var popupMenu = BX.PopupMenu.create("ui-action-panel-item-popup-menu", bindElement, this.items, popupMenuOptions);
					popupMenu.layout.menuContainer.setAttribute("data-tile-grid", "tile-grid-stop-close");
					popupMenu.show();
					BX.addClass(this.layout.container, "ui-action-panel-item-active");
					if (submenuTrigger) {
						submenuTrigger.setAttribute('aria-expanded', 'true');
					}
				}
			};
		})();
		return item;
	}

	requireItem();

})(BX, BX.UI);
//# sourceMappingURL=actionpanel.bundle.js.map
