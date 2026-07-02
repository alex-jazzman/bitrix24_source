/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_actionsBar, ui_designTokens, ui_designTokens_air, main_core, main_core_events, ui_cnt, ui_system_menu) {
	'use strict';

	function _classPrivateMethodInitSpec$1(e, a) { _checkPrivateRedeclaration$1(e, a), a.add(e); }
	function _classPrivateFieldInitSpec$1(e, t, a) { _checkPrivateRedeclaration$1(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$1(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet$1(s, a) { return s.get(_assertClassBrand$1(s, a)); }
	function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand$1(s, a), r), r; }
	function _assertClassBrand$1(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _collapsedIcon = /*#__PURE__*/new WeakMap();
	var _collapsed = /*#__PURE__*/new WeakMap();
	var _dataAttributes = /*#__PURE__*/new WeakMap();
	var _useAirDesign = /*#__PURE__*/new WeakMap();
	var _CounterItem_brand = /*#__PURE__*/new WeakSet();
	let CounterItem = /*#__PURE__*/function () {
		function CounterItem(args) {
			babelHelpers.classCallCheck(this, CounterItem);
			_classPrivateMethodInitSpec$1(this, _CounterItem_brand);
			_classPrivateFieldInitSpec$1(this, _collapsedIcon, void 0);
			_classPrivateFieldInitSpec$1(this, _collapsed, void 0);
			_classPrivateFieldInitSpec$1(this, _dataAttributes, void 0);
			_classPrivateFieldInitSpec$1(this, _useAirDesign, false);
			this.id = args.id ?? null;
			this.separator = main_core.Type.isBoolean(args.separator) ? args.separator : true;
			this.items = main_core.Type.isArray(args.items) ? args.items : [];
			this.popupMenu = null;
			this.isActive = main_core.Type.isBoolean(args.isActive) ? args.isActive : false;
			this.isRestricted = main_core.Type.isBoolean(args.isRestricted) ? args.isRestricted : false;
			this.panel = args.panel ?? null;
			this.title = args.title ?? null;
			this.value = main_core.Type.isNumber(args.value) && args.value !== undefined ? args.value : null;
			this.titleOrder = null;
			this.valueOrder = null;
			this.color = args.color ?? null;
			this.parent = main_core.Type.isBoolean(args.parent) ? args.parent : null;
			this.parentId = args.parentId ?? null;
			this.locked = args.locked === true;
			this.type = main_core.Type.isString(args.type) ? args.type.toLowerCase() : null;
			this.eventsForActive = main_core.Type.isObject(args.eventsForActive) ? args.eventsForActive : {};
			this.eventsForUnActive = main_core.Type.isObject(args.eventsForUnActive) ? args.eventsForUnActive : {};
			this.hideValue = main_core.Type.isBoolean(args.hideValue) ? args.hideValue : false;
			_classPrivateFieldSet(_collapsedIcon, this, args.collapsedIcon ?? null);
			_classPrivateFieldSet(_collapsed, this, args.collapsed === true);
			_classPrivateFieldSet(_dataAttributes, this, main_core.Type.isPlainObject(args.dataAttributes) ? args.dataAttributes : {});
			_classPrivateFieldSet(_useAirDesign, this, args.useAirDesign === true);
			if (main_core.Type.isObject(args.title)) {
				this.title = args.title.value ?? null;
				this.titleOrder = main_core.Type.isNumber(args.title.order) ? args.title.order : null;
			}
			if (main_core.Type.isObject(args.value)) {
				this.value = main_core.Type.isNumber(args.value.value) ? args.value.value : null;
				this.valueOrder = main_core.Type.isNumber(args.value.order) ? args.value.order : null;
			}
			this.layout = {
				container: null,
				value: null,
				title: null,
				cross: null,
				dropdownArrow: null
			};
			this.counter = _assertClassBrand$1(_CounterItem_brand, this, _getCounter).call(this);
			if (!_assertClassBrand$1(_CounterItem_brand, this, _getPanel).call(this).isMultiselect()) {
				_assertClassBrand$1(_CounterItem_brand, this, _bindEvents).call(this);
			}
		}
		return babelHelpers.createClass(CounterItem, [{
			key: "getItems",
			value: function getItems() {
				return this.items;
			}
		}, {
			key: "getId",
			value: function getId() {
				return this.id;
			}
		}, {
			key: "hasParentId",
			value: function hasParentId() {
				return this.parentId;
			}
		}, {
			key: "hasCollapsedIcon",
			value: function hasCollapsedIcon() {
				return _classPrivateFieldGet$1(_collapsedIcon, this) !== null;
			}
		}, {
			key: "getCollapsedIcon",
			value: function getCollapsedIcon() {
				return _classPrivateFieldGet$1(_collapsedIcon, this);
			}
		}, {
			key: "updateValue",
			value: function updateValue(param) {
				if (main_core.Type.isNumber(param)) {
					this.value = param;
					_assertClassBrand$1(_CounterItem_brand, this, _getCounter).call(this).update(param);
					if (param === 0) {
						this.updateColor(this.parentId ? 'GRAY' : 'THEME');
						main_core.Dom.addClass(this.layout.container, _assertClassBrand$1(_CounterItem_brand, this, _getZeroItemClassModifier).call(this));
					} else {
						main_core.Dom.removeClass(this.layout.container, _assertClassBrand$1(_CounterItem_brand, this, _getZeroItemClassModifier).call(this));
					}
				}
			}
		}, {
			key: "updateValueAnimate",
			value: function updateValueAnimate(param) {
				if (main_core.Type.isNumber(param)) {
					this.value = param;
					_assertClassBrand$1(_CounterItem_brand, this, _getCounter).call(this).update(param);
					_assertClassBrand$1(_CounterItem_brand, this, _getCounter).call(this).show();
					if (param === 0) {
						const color = this.parentId ? 'GRAY' : 'THEME';
						this.updateColor(color);
						_assertClassBrand$1(_CounterItem_brand, this, _getCounter).call(this).setStyle(_assertClassBrand$1(_CounterItem_brand, this, _getCounterStyleByColor).call(this, ui_cnt.Counter.Color[color]));
					}
				}
			}
		}, {
			key: "updateColor",
			value: function updateColor(param) {
				if (main_core.Type.isString(param)) {
					this.color = param;
					_assertClassBrand$1(_CounterItem_brand, this, _getCounter).call(this).setColor(ui_cnt.Counter.Color[param]);
					_assertClassBrand$1(_CounterItem_brand, this, _getCounter).call(this).setStyle(_assertClassBrand$1(_CounterItem_brand, this, _getCounterStyleByColor).call(this, ui_cnt.Counter.Color[param]));
				}
			}
		}, {
			key: "activate",
			value: function activate(isEmitEvent = true) {
				this.isActive = true;
				if (!this.parentId) {
					main_core.Dom.addClass(this.getContainer(), '--active');
				}
				if (isEmitEvent) {
					main_core_events.EventEmitter.emit('BX.UI.CounterPanel.Item:activate', this);
				}
			}
		}, {
			key: "deactivate",
			value: function deactivate(isEmitEvent = true) {
				this.isActive = false;
				if (!this.parentId) {
					main_core.Dom.removeClass(this.getContainer(), '--active');
					main_core.Dom.removeClass(this.getContainer(), '--hover');
				}
				if (isEmitEvent) {
					main_core_events.EventEmitter.emit('BX.UI.CounterPanel.Item:deactivate', this);
				}
			}
		}, {
			key: "collapse",
			value: function collapse() {
				main_core.Dom.addClass(this.getContainer(), '--collapsed');
			}
		}, {
			key: "expand",
			value: function expand() {
				main_core.Dom.removeClass(this.getContainer(), '--collapsed');
			}
		}, {
			key: "getSeparator",
			value: function getSeparator() {
				return this.separator;
			}
		}, {
			key: "getCounterOptions",
			value: function getCounterOptions() {
				const counterColor = this.color ? ui_cnt.Counter.Color[this.color.toUpperCase()] : this.parentId ? ui_cnt.Counter.Color.GRAY : ui_cnt.Counter.Color.THEME;
				return {
					color: counterColor,
					value: this.value,
					animation: false,
					useAirDesign: _classPrivateFieldGet$1(_useAirDesign, this),
					style: _assertClassBrand$1(_CounterItem_brand, this, _getCounterStyleByColor).call(this, counterColor)
				};
			}
		}, {
			key: "getCounterContainer",
			value: function getCounterContainer() {
				return this.layout.value;
			}
		}, {
			key: "setEvents",
			value: function setEvents(container) {
				if (!container) {
					container = this.getContainer();
				}
				if (this.eventsForActive) {
					const eventKeys = Object.keys(this.eventsForActive);
					for (const event of eventKeys) {
						main_core.Event.bind(container, event, () => {
							if (this.isActive) {
								this.eventsForActive[event]();
							}
						});
					}
				}
				if (this.eventsForUnActive) {
					const eventKeys = Object.keys(this.eventsForUnActive);
					for (const event of eventKeys) {
						main_core.Event.bind(container, event, () => {
							if (!this.isActive) {
								this.eventsForUnActive[event]();
							}
						});
					}
				}
			}
		}, {
			key: "isLocked",
			value: function isLocked() {
				return this.locked;
			}
		}, {
			key: "lock",
			value: function lock() {
				this.locked = true;
				main_core.Dom.addClass(this.getContainer(), '--locked');
			}
		}, {
			key: "unLock",
			value: function unLock() {
				this.locked = false;
				main_core.Dom.removeClass(this.getContainer(), '--locked');
			}
		}, {
			key: "getArrowDropdown",
			value: function getArrowDropdown() {
				if (!this.layout.dropdownArrow) {
					this.layout.dropdownArrow = main_core.Tag.render`
				<div class="ui-counter-panel__item-dropdown">
					<i></i>
				</div>
			`;
				}
				return this.layout.dropdownArrow;
			}
		}, {
			key: "getContainer",
			value: function getContainer() {
				if (!this.layout.container) {
					const type = this.type ? `id="ui-counter-panel-item-${this.type}"` : '';
					const isValue = main_core.Type.isNumber(this.value);
					this.layout.container = main_core.Tag.render`
				<div ${type} class="ui-counter-panel__item ${_assertClassBrand$1(_CounterItem_brand, this, _getItemClassModifierByValue).call(this, this.value)}">
					${_classPrivateFieldGet$1(_collapsedIcon, this) ? _assertClassBrand$1(_CounterItem_brand, this, _getCollapsedIcon).call(this) : ''}
					${isValue && !this.hideValue ? _assertClassBrand$1(_CounterItem_brand, this, _getValue).call(this) : ''}
					${this.title ? _assertClassBrand$1(_CounterItem_brand, this, _getTitle).call(this) : ''}
					${isValue ? _assertClassBrand$1(_CounterItem_brand, this, _getCross).call(this) : ''}
				</div>
			`;
					if (this.parent) {
						this.layout.container = main_core.Tag.render`
					<div class="ui-counter-panel__item">
						${this.title ? _assertClassBrand$1(_CounterItem_brand, this, _getTitle).call(this) : ''}
						${isValue ? _assertClassBrand$1(_CounterItem_brand, this, _getValue).call(this) : ''}
						${_assertClassBrand$1(_CounterItem_brand, this, _getCross).call(this)}
					</div>
				`;
						main_core.Event.bind(_assertClassBrand$1(_CounterItem_brand, this, _getCross).call(this), 'click', ev => {
							this.deactivate();
							ev.stopPropagation();
						});
						main_core.Dom.addClass(this.layout.container, '--dropdown');
					}
					if (!isValue) {
						main_core.Dom.addClass(this.layout.container, '--string');
					}
					if (!isValue && !this.eventsForActive && !this.eventsForUnActive) {
						main_core.Dom.addClass(this.layout.container, '--title');
					}
					if (!this.separator) {
						main_core.Dom.addClass(this.layout.container, '--without-separator');
					}
					if (this.locked) {
						main_core.Dom.addClass(this.layout.container, '--locked');
					}
					if (this.isActive) {
						this.activate();
					}
					if (this.isRestricted) {
						main_core.Dom.addClass(this.layout.container, '--restricted');
					}
					if (_classPrivateFieldGet$1(_collapsed, this)) {
						this.collapse();
					}
					if (this.locked) {
						this.lock();
					}
					this.setEvents(this.layout.container);
					_assertClassBrand$1(_CounterItem_brand, this, _setElementDataAttributes).call(this, this.layout.container);
					main_core.Event.bind(this.layout.container, 'click', () => {
						main_core_events.EventEmitter.emit('BX.UI.CounterPanel.Item:click', {
							item: this
						});
					});
					if (isValue && this.items.length === 0 && !this.parent) {
						main_core.Event.bind(this.layout.container, 'mouseenter', () => {
							if (!this.isActive) {
								main_core.Dom.addClass(this.layout.container, '--hover');
							}
						});
						main_core.Event.bind(this.layout.container, 'mouseleave', () => {
							if (!this.isActive) {
								main_core.Dom.removeClass(this.layout.container, '--hover');
							}
						});
						main_core.Event.bind(this.layout.container, 'click', () => {
							if (this.isActive) {
								this.deactivate();
							} else {
								this.activate();
							}
						});
					}
					if (this.parent) {
						main_core.Dom.append(this.getArrowDropdown(), this.layout.container);
					}
				}
				return this.layout.container;
			}
		}, {
			key: "setDataAttributes",
			value: function setDataAttributes(attributes) {
				_classPrivateFieldSet(_dataAttributes, this, main_core.Type.isPlainObject(attributes) || {});
				_assertClassBrand$1(_CounterItem_brand, this, _setElementDataAttributes).call(this, this.getContainer());
			}
		}]);
	}();
	function _bindEvents() {
		main_core_events.EventEmitter.subscribe('BX.UI.CounterPanel.Item:activate', item => {
			const isLinkedItems = item.data.parentId === this.id;
			if (item.data !== this && !isLinkedItems) {
				this.deactivate();
			}
		});
	}
	function _getPanel() {
		return this.panel;
	}
	function _getCounter() {
		if (!this.counter) {
			this.counter = new ui_cnt.Counter(this.getCounterOptions());
		}
		return this.counter;
	}
	function _getValue() {
		if (!this.layout.value) {
			const counterValue = this.isRestricted ? main_core.Tag.render`<div class="ui-counter-panel__item-lock"></div>` : _assertClassBrand$1(_CounterItem_brand, this, _getCounter).call(this).getContainer();
			this.layout.value = main_core.Tag.render`
				<div class="ui-counter-panel__item-value">
					${counterValue}
				</div>
			`;
			main_core.Dom.style(this.layout.value, 'order', this.valueOrder);
		}
		return this.layout.value;
	}
	function _getTitle() {
		if (!this.layout.title) {
			this.layout.title = main_core.Tag.render`
				<div class="ui-counter-panel__item-title">${this.title}</div>
			`;
			main_core.Dom.style(this.layout.title, 'order', this.titleOrder);
		}
		return this.layout.title;
	}
	function _getCollapsedIcon() {
		return main_core.Tag.render`
			<div class="ui-counter-panel__item-collapsed-icon ui-icon-set__scope --icon-${_classPrivateFieldGet$1(_collapsedIcon, this)}"></div>
		`;
	}
	function _getCross() {
		if (!this.layout.cross) {
			this.layout.cross = main_core.Tag.render`
				<div class="ui-counter-panel__item-cross">
					<i></i>
				</div>
			`;
		}
		return this.layout.cross;
	}
	function _setElementDataAttributes(element) {
		if (!element) {
			return;
		}
		Object.entries(_classPrivateFieldGet$1(_dataAttributes, this)).forEach(([key, value]) => {
			main_core.Dom.attr(element, `data-${key}`, value);
		});
	}
	function _getCounterStyleByColor(color) {
		if (color === ui_cnt.CounterColor.DANGER) {
			return ui_cnt.CounterStyle.FILLED_ALERT;
		}
		if (color === ui_cnt.CounterColor.SUCCESS) {
			return ui_cnt.CounterStyle.FILLED_SUCCESS;
		}
		return ui_cnt.CounterStyle.OUTLINE_NO_ACCENT;
	}
	function _getItemClassModifierByValue(value) {
		return value === 0 ? _assertClassBrand$1(_CounterItem_brand, this, _getZeroItemClassModifier).call(this) : '';
	}
	function _getZeroItemClassModifier() {
		return '--zero';
	}

	function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	const instanceMap = new WeakMap();
	var _CounterPanel_brand = /*#__PURE__*/new WeakSet();
	var _onChildActivityChange = /*#__PURE__*/new WeakMap();
	let CounterPanel = /*#__PURE__*/function () {
		function CounterPanel(options) {
			babelHelpers.classCallCheck(this, CounterPanel);
			_classPrivateMethodInitSpec(this, _CounterPanel_brand);
			_classPrivateFieldInitSpec(this, _onChildActivityChange, event => {
				const item = event.data;
				if (!item || item.panel !== this) {
					return;
				}
				const parent = item.parentId ? this.getItemById(item.parentId) : null;
				if (parent) {
					_assertClassBrand(_CounterPanel_brand, this, _refreshParentHighlight).call(this, parent);
				}
				_assertClassBrand(_CounterPanel_brand, this, _refreshMoreHighlight).call(this);
			});
			this.target = main_core.Type.isDomNode(options.target) ? options.target : null;
			this.items = main_core.Type.isArray(options.items) ? options.items : [];
			this.multiselect = main_core.Type.isBoolean(options.multiselect) ? options.multiselect : null;
			this.title = main_core.Type.isStringFilled(options.title) ? options.title : null;
			this.container = null;
			this.keys = [];
			this.hasParent = [];
			this.collapsedState = false;
			this.moreButton = null;
			this.moreCounter = null;
			this.boundParents = new WeakSet();
			this.activeMenu = null;
			this.activeClickElement = null;
		}
		return babelHelpers.createClass(CounterPanel, [{
			key: "isMultiselect",
			value: function isMultiselect() {
				return this.multiselect;
			}
		}, {
			key: "getItems",
			value: function getItems() {
				return this.items;
			}
		}, {
			key: "getItemById",
			value: function getItemById(param) {
				if (param) {
					const index = this.keys.indexOf(param);
					return this.items[index];
				}
				return undefined;
			}
		}, {
			key: "init",
			value: function init() {
				_assertClassBrand(_CounterPanel_brand, this, _adjustData).call(this);
				_assertClassBrand(_CounterPanel_brand, this, _render).call(this);
				_assertClassBrand(_CounterPanel_brand, this, _refreshParentHighlights).call(this);
				main_core_events.EventEmitter.subscribe('BX.UI.CounterPanel.Item:activate', _classPrivateFieldGet(_onChildActivityChange, this));
				main_core_events.EventEmitter.subscribe('BX.UI.CounterPanel.Item:deactivate', _classPrivateFieldGet(_onChildActivityChange, this));
			}
		}, {
			key: "setItems",
			value: function setItems(items) {
				this.items = items;
			}
		}, {
			key: "isCollapsed",
			value: function isCollapsed() {
				return this.collapsedState;
			}
		}, {
			key: "collapse",
			value: function collapse() {
				if (this.collapsedState) {
					return;
				}
				this.collapsedState = true;
				_assertClassBrand(_CounterPanel_brand, this, _rerender).call(this);
			}
		}, {
			key: "expand",
			value: function expand() {
				if (!this.collapsedState) {
					return;
				}
				this.collapsedState = false;
				_assertClassBrand(_CounterPanel_brand, this, _rerender).call(this);
			}
		}, {
			key: "hasAirDesign",
			value: function hasAirDesign() {
				return main_core.Extension.getSettings('ui.counterpanel').get('useAirDesign') === true;
			}
		}], [{
			key: "getInstanceByNode",
			value: function getInstanceByNode(node) {
				return instanceMap.get(node) ?? null;
			}
		}]);
	}();
	function _adjustData() {
		this.items = this.items.map(item => {
			this.keys.push(item.id);
			if (item.parentId) {
				this.hasParent.push(item.parentId);
			}
			return new CounterItem({
				...item,
				useAirDesign: this.hasAirDesign(),
				panel: this
			});
		});
		this.hasParent.forEach(item => {
			const index = this.keys.indexOf(item);
			this.items[index].parent = true;
		});
		this.items.forEach(item => {
			if (item.parentId) {
				const index = this.keys.indexOf(item.parentId);
				this.items[index].items.push(item.id);
			}
		});
	}
	function _getRootItems() {
		return this.items.filter(item => item instanceof CounterItem && !item.hasParentId());
	}
	function _getVisibleRootItems() {
		const rootItems = _assertClassBrand(_CounterPanel_brand, this, _getRootItems).call(this);
		return this.collapsedState ? rootItems.slice(0, 1) : rootItems;
	}
	function _getHiddenRootItems() {
		return this.collapsedState ? _assertClassBrand(_CounterPanel_brand, this, _getRootItems).call(this).slice(1) : [];
	}
	function _flattenParents(items) {
		// Replace each parent item with its children so a hidden user "More"
		// surfaces its contents directly in the popup, not as a nested entry.
		return items.flatMap(item => {
			if (item.parent !== true) {
				return [item];
			}
			return item.getItems().map(childId => this.getItemById(childId)).filter(Boolean);
		});
	}
	function _getContainer() {
		if (!this.container) {
			this.container = main_core.Tag.render`
				<div class="ui-counter-panel ui-counter-panel__scope"></div>
			`;
			instanceMap.set(this.container, this);
			if (this.hasAirDesign() === true) {
				main_core.Dom.addClass(this.container, '--air');
			}
		}
		return this.container;
	}
	function _getTitleNode() {
		return main_core.Tag.render`
			<div class="ui-counter-panel__item-head">${this.title}</div>
		`;
	}
	function _renderItems() {
		const visibleRootItems = _assertClassBrand(_CounterPanel_brand, this, _getVisibleRootItems).call(this);
		const showMoreButton = this.collapsedState && _assertClassBrand(_CounterPanel_brand, this, _getHiddenRootItems).call(this).length > 0;
		visibleRootItems.forEach((item, index) => {
			main_core.Dom.append(item.getContainer(), _assertClassBrand(_CounterPanel_brand, this, _getContainer).call(this));
			const isLastVisible = index === visibleRootItems.length - 1;
			const needsSeparator = !isLastVisible || showMoreButton;
			if (needsSeparator) {
				main_core.Dom.append(main_core.Tag.render`
					<div class="ui-counter-panel__item-separator ${item.getSeparator() ? '' : '--invisible'}"></div>
				`, _assertClassBrand(_CounterPanel_brand, this, _getContainer).call(this));
			}
			if (item.parent) {
				_assertClassBrand(_CounterPanel_brand, this, _bindParentDropdown).call(this, item);
			}
		});
		if (showMoreButton) {
			main_core.Dom.append(_assertClassBrand(_CounterPanel_brand, this, _getMoreButton).call(this), _assertClassBrand(_CounterPanel_brand, this, _getContainer).call(this));
			_assertClassBrand(_CounterPanel_brand, this, _refreshMoreHighlight).call(this);
		}
	}
	function _bindParentDropdown(item) {
		if (this.boundParents.has(item)) {
			return;
		}
		this.boundParents.add(item);
		main_core.Event.bind(item.getContainer(), 'click', () => {
			if (_assertClassBrand(_CounterPanel_brand, this, _toggleActiveMenu).call(this, item.getContainer())) {
				return;
			}
			const childItems = item.getItems().map(childId => this.getItemById(childId)).filter(Boolean);
			_assertClassBrand(_CounterPanel_brand, this, _showItemsPopup).call(this, childItems, item.getContainer(), item.getContainer(), {
				onShow: () => {
					main_core.Dom.addClass(item.getContainer(), '--hover');
					main_core.Dom.addClass(item.getContainer(), '--pointer-events-none');
				},
				onClose: () => {
					main_core.Dom.removeClass(item.getContainer(), '--hover');
					main_core.Dom.removeClass(item.getContainer(), '--pointer-events-none');
				}
			});
		});
	}
	function _toggleActiveMenu(clickElement) {
		if (this.activeClickElement === clickElement) {
			this.activeMenu?.close();
			return true;
		}
		return false;
	}
	function _buildPopupItem(item) {
		return {
			id: item.getId() ?? undefined,
			title: main_core.Type.isString(item.title) ? item.title : '',
			isSelected: item.isActive,
			counter: _assertClassBrand(_CounterPanel_brand, this, _getMenuItemCounterOptions).call(this, item),
			icon: item.getCollapsedIcon() ?? undefined,
			sectionCode: item.hasCollapsedIcon() ? _collapsedIconSection._ : undefined,
			onClick: () => {
				main_core_events.EventEmitter.emit('BX.UI.CounterPanel.Item:click', {
					item
				});
				if (item.isActive) {
					item.deactivate();
				} else {
					item.activate();
				}
			}
		};
	}
	function _getMenuItemCounterOptions(item) {
		if (!main_core.Type.isNumber(item.value) || item.hideValue) {
			return null;
		}
		return item.getCounterOptions();
	}
	function _render() {
		if (this.target && this.items.length > 0) {
			_assertClassBrand(_CounterPanel_brand, this, _rerender).call(this);
			main_core.Dom.clean(this.target);
			main_core.Dom.append(_assertClassBrand(_CounterPanel_brand, this, _getContainer).call(this), this.target);
		}
	}
	function _refreshParentHighlights() {
		_assertClassBrand(_CounterPanel_brand, this, _getRootItems).call(this).filter(item => item.parent === true).forEach(parent => _assertClassBrand(_CounterPanel_brand, this, _refreshParentHighlight).call(this, parent));
	}
	function _refreshParentHighlight(parent) {
		const hasActiveChild = parent.getItems().map(childId => this.getItemById(childId)).some(child => child?.isActive === true);
		main_core.Dom[hasActiveChild ? 'addClass' : 'removeClass'](parent.getContainer(), '--active');
	}
	function _refreshMoreHighlight() {
		if (!this.moreButton) {
			return;
		}
		const hiddenLeaves = _assertClassBrand(_CounterPanel_brand, this, _flattenParents).call(this, _assertClassBrand(_CounterPanel_brand, this, _getHiddenRootItems).call(this));
		const hasActive = hiddenLeaves.some(item => item?.isActive === true);
		main_core.Dom[hasActive ? 'addClass' : 'removeClass'](this.moreButton, '--active');
	}
	function _rerender() {
		this.activeMenu?.close();
		const container = _assertClassBrand(_CounterPanel_brand, this, _getContainer).call(this);
		main_core.Dom.clean(container);
		this.moreButton = null;
		this.moreCounter = null;
		if (this.collapsedState) {
			main_core.Dom.addClass(container, '--panel-collapsed');
		} else {
			main_core.Dom.removeClass(container, '--panel-collapsed');
			if (this.title) {
				main_core.Dom.append(_assertClassBrand(_CounterPanel_brand, this, _getTitleNode).call(this), container);
			}
		}
		_assertClassBrand(_CounterPanel_brand, this, _renderItems).call(this);
	}
	function _getMoreButton() {
		if (!this.moreButton) {
			const hiddenItems = _assertClassBrand(_CounterPanel_brand, this, _getHiddenRootItems).call(this);
			const totalValue = _assertClassBrand(_CounterPanel_brand, this, _getTotalValue).call(this, hiddenItems);
			const counterContainer = totalValue > 0 ? main_core.Tag.render`
					<div class="ui-counter-panel__item-value">
						${_assertClassBrand(_CounterPanel_brand, this, _getMoreCounter).call(this, hiddenItems).getContainer()}
					</div>
				` : '';
			this.moreButton = main_core.Tag.render`
				<div class="ui-counter-panel__item ui-counter-panel__item--more-trigger">
					${counterContainer}
					<div class="ui-counter-panel__item-dropdown"><i></i></div>
				</div>
			`;
			main_core.Event.bind(this.moreButton, 'click', () => {
				if (_assertClassBrand(_CounterPanel_brand, this, _toggleActiveMenu).call(this, this.moreButton)) {
					return;
				}
				_assertClassBrand(_CounterPanel_brand, this, _showMorePopup).call(this);
			});
		}
		return this.moreButton;
	}
	function _getTotalValue(items) {
		let total = 0;
		for (const item of items) {
			if (main_core.Type.isNumber(item.value)) {
				total += item.value;
			}
		}
		return total;
	}
	function _getMoreCounter(items) {
		if (!this.moreCounter) {
			this.moreCounter = _assertClassBrand(_CounterPanel_brand, this, _createAggregateCounter).call(this, items);
		}
		return this.moreCounter;
	}
	function _createAggregateCounter(items) {
		const hasDanger = items.some(item => item.color && item.color.toUpperCase() === 'DANGER');
		const color = hasDanger ? ui_cnt.Counter.Color.DANGER : ui_cnt.Counter.Color.THEME;
		return new ui_cnt.Counter({
			color,
			value: _assertClassBrand(_CounterPanel_brand, this, _getTotalValue).call(this, items),
			animation: false,
			useAirDesign: this.hasAirDesign(),
			style: _assertClassBrand(_CounterPanel_brand, this, _getAggregateCounterStyle).call(this, color)
		});
	}
	function _getAggregateCounterStyle(color) {
		if (color === ui_cnt.CounterColor.DANGER) {
			return ui_cnt.CounterStyle.FILLED_ALERT;
		}
		return ui_cnt.CounterStyle.OUTLINE_NO_ACCENT;
	}
	function _showMorePopup() {
		_assertClassBrand(_CounterPanel_brand, this, _showItemsPopup).call(this, _assertClassBrand(_CounterPanel_brand, this, _getHiddenRootItems).call(this), this.moreButton, this.moreButton, {
			onShow: () => main_core.Dom.addClass(this.moreButton, '--hover'),
			onClose: () => main_core.Dom.removeClass(this.moreButton, '--hover')
		});
	}
	function _showItemsPopup(items, bindElement, clickElement, hooks = {}) {
		this.activeMenu?.close();
		const menu = new ui_system_menu.Menu({
			className: 'ui-counter-panel__popup ui-counter-panel__scope',
			animation: 'fading-slide',
			items: _assertClassBrand(_CounterPanel_brand, this, _flattenParents).call(this, items).map(item => _assertClassBrand(_CounterPanel_brand, this, _buildPopupItem).call(this, item)),
			sections: [{
				code: _collapsedIconSection._
			}],
			autoHideHandler: event => {
				if (clickElement.contains(event.target)) {
					return false;
				}
				const popupContainer = menu?.getPopupContainer();
				return !popupContainer?.contains(event.target);
			},
			offsetTop: 8,
			events: {
				onShow: () => {
					this.activeMenu = menu;
					this.activeClickElement = clickElement;
					hooks.onShow?.();
				},
				onClose: () => {
					if (this.activeMenu === menu) {
						this.activeMenu = null;
						this.activeClickElement = null;
					}
					hooks.onClose?.();
				}
			}
		});
		menu.show(bindElement);
	}
	var _collapsedIconSection = {
		_: 'collapsed-icon'
	};

	const CounterItemCollapsedIcon = Object.freeze({
		CHAT_CHECK: 'chat-chek'
	});

	exports.CounterItem = CounterItem;
	exports.CounterItemCollapsedIcon = CounterItemCollapsedIcon;
	exports.CounterPanel = CounterPanel;

})(this.BX.UI = this.BX.UI || {}, BX.UI, BX, BX, BX, BX.Event, BX.UI, BX.UI.System);
//# sourceMappingURL=counterpanel.bundle.js.map
