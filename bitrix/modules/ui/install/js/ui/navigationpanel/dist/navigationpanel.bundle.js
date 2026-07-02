/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_actionsBar, main_core, main_core_events, ui_iconSet_api_core, ui_system_menu) {
	'use strict';

	function _classPrivateMethodInitSpec$1(e, a) { _checkPrivateRedeclaration$1(e, a), a.add(e); }
	function _classPrivateFieldInitSpec$1(e, t, a) { _checkPrivateRedeclaration$1(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$1(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet$1(s, a) { return s.get(_assertClassBrand$1(s, a)); }
	function _classPrivateFieldSet$1(s, a, r) { return s.set(_assertClassBrand$1(s, a), r), r; }
	function _assertClassBrand$1(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _isDropdown = /*#__PURE__*/new WeakMap();
	var _menuItems = /*#__PURE__*/new WeakMap();
	var _onActivate = /*#__PURE__*/new WeakMap();
	var _menu = /*#__PURE__*/new WeakMap();
	var _NavigationItem_brand = /*#__PURE__*/new WeakSet();
	let NavigationItem = /*#__PURE__*/function () {
		function NavigationItem({
			id,
			title,
			active,
			events,
			link,
			locked,
			dropdown = false,
			menuItems = [],
			onActivate
		}) {
			babelHelpers.classCallCheck(this, NavigationItem);
			_classPrivateMethodInitSpec$1(this, _NavigationItem_brand);
			_classPrivateFieldInitSpec$1(this, _isDropdown, false);
			_classPrivateFieldInitSpec$1(this, _menuItems, []);
			_classPrivateFieldInitSpec$1(this, _onActivate, null);
			_classPrivateFieldInitSpec$1(this, _menu, null);
			this.id = id ?? null;
			this.title = main_core.Type.isString(title) ? title : null;
			this.active = main_core.Type.isBoolean(active) ? active : false;
			this.events = events ?? null;
			this.link = link ?? null;
			this.locked = main_core.Type.isBoolean(locked) ? locked : false;
			_classPrivateFieldSet$1(_isDropdown, this, dropdown === true);
			_classPrivateFieldSet$1(_menuItems, this, menuItems ?? []);
			_classPrivateFieldSet$1(_onActivate, this, main_core.Type.isFunction(onActivate) ? onActivate : null);
			this.linkContainer = null;
		}
		return babelHelpers.createClass(NavigationItem, [{
			key: "getTitle",
			value: function getTitle() {
				if (!this.title) {
					this.title = main_core.Tag.render`
				<div class="ui-nav-panel__item-title">${this.title}</div>	
			`;
				}
				return this.title;
			}
		}, {
			key: "getContainer",
			value: function getContainer() {
				if (this.active === false && _classPrivateFieldGet$1(_isDropdown, this)) {
					return null;
				}
				if (!this.linkContainer) {
					const id = this.id ? `id="ui-nav-panel-item-${this.id}"` : '';
					this.linkContainer = main_core.Tag.render`
				<div ${id} class="ui-nav-panel__item">
					<span>${this.title ? this.getTitle() : ''}</span>
					${_classPrivateFieldGet$1(_isDropdown, this) ? _assertClassBrand$1(_NavigationItem_brand, this, _renderDropdownIcon).call(this) : ''}
				</div>
			`;
					if (_classPrivateFieldGet$1(_isDropdown, this)) {
						main_core.Dom.addClass(this.linkContainer, '--dropdown');
					}
					this.setEvents();
					if (this.active) {
						this.activate();
					} else {
						this.inactivate();
					}
					if (this.locked) {
						this.lock();
					} else {
						this.unLock();
					}
				}
				return this.linkContainer;
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
			key: "setEvents",
			value: function setEvents() {
				if (_classPrivateFieldGet$1(_isDropdown, this)) {
					main_core.Event.bind(this.linkContainer, 'click', () => {
						_assertClassBrand$1(_NavigationItem_brand, this, _showMenu).call(this);
					});
					return;
				}
				if (this.link) {
					this.linkContainer = main_core.Tag.render`
				<a class="ui-nav-panel__item">
					<span>${this.title ? this.getTitle() : ''}</span>
				</a>
			`;
					Object.entries(this.link).forEach(([linkKey, linkValue]) => {
						this.linkContainer.setAttribute(linkKey, linkValue);
					});
				}
				if (this.events) {
					Object.entries(this.events).forEach(([eventKey, eventHandler]) => {
						main_core.Event.bind(this.getContainer(), eventKey, () => {
							eventHandler();
						});
					});
				}
			}
		}, {
			key: "activate",
			value: function activate() {
				this.active = true;
				if (_classPrivateFieldGet$1(_isDropdown, this) === false) {
					main_core.Dom.addClass(this.getContainer(), '--active');
				}
				_classPrivateFieldGet$1(_onActivate, this)?.call(this, this);
				main_core_events.EventEmitter.emit('BX.UI.NavigationPanel.Item:active', this);
			}
		}, {
			key: "inactivate",
			value: function inactivate() {
				this.active = false;
				if (_classPrivateFieldGet$1(_isDropdown, this) === false) {
					main_core.Dom.removeClass(this.getContainer(), '--active');
				}
				main_core_events.EventEmitter.emit('BX.UI.NavigationPanel.Item:inactive', this);
			}
		}, {
			key: "closeMenu",
			value: function closeMenu() {
				if (_classPrivateFieldGet$1(_menu, this) && _classPrivateFieldGet$1(_menu, this).getPopup()?.isShown()) {
					_classPrivateFieldGet$1(_menu, this).close();
				}
			}
		}]);
	}();
	function _renderDropdownIcon() {
		const icon = new ui_iconSet_api_core.Icon({
			size: 16,
			icon: ui_iconSet_api_core.Outline.CHEVRON_DOWN_L
		}).render();
		return main_core.Tag.render`
			<span class="ui-nav-panel__item-dropdown-icon ui-icon-set__scope">${icon}</span>
		`;
	}
	function _showMenu() {
		_assertClassBrand$1(_NavigationItem_brand, this, _getMenu).call(this).show(this.getContainer());
	}
	function _getMenu() {
		if (_classPrivateFieldGet$1(_menu, this)) {
			return _classPrivateFieldGet$1(_menu, this);
		}
		_classPrivateFieldSet$1(_menu, this, new ui_system_menu.Menu({
			items: _classPrivateFieldGet$1(_menuItems, this),
			bindOptions: {
				forceBindPosition: true,
				forceTop: true
			},
			offsetTop: 8,
			offsetLeft: 0,
			events: {
				onShow: () => {
					main_core.Dom.addClass(this.linkContainer, '--active');
				},
				onClose: () => {
					main_core.Dom.removeClass(this.linkContainer, '--active');
				}
			}
		}));
		return _classPrivateFieldGet$1(_menu, this);
	}

	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
	function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	const instanceMap = new WeakMap();
	var _isCollapsed = /*#__PURE__*/new WeakMap();
	var _rawItems = /*#__PURE__*/new WeakMap();
	var _deactivateOthers = /*#__PURE__*/new WeakMap();
	var _NavigationPanel_brand = /*#__PURE__*/new WeakSet();
	let NavigationPanel = /*#__PURE__*/function () {
		function NavigationPanel(options) {
			babelHelpers.classCallCheck(this, NavigationPanel);
			_classPrivateMethodInitSpec(this, _NavigationPanel_brand);
			_classPrivateFieldInitSpec(this, _isCollapsed, false);
			_classPrivateFieldInitSpec(this, _rawItems, []);
			_classPrivateFieldInitSpec(this, _deactivateOthers, activatedItem => {
				this.items.forEach(item => {
					if (item !== activatedItem && item.active) {
						item.inactivate();
					}
				});
			});
			this.target = main_core.Type.isDomNode(options.target) ? options.target : null;
			const rawItems = main_core.Type.isArray(options.items) ? options.items : [];
			_classPrivateFieldSet(_rawItems, this, rawItems.map(item => ({
				...item,
				id: item.id ?? `nav-${main_core.Text.getRandom(8)}`
			})));
			this.items = _classPrivateFieldGet(_rawItems, this);
			this.container = null;
			this.keys = [];
			_classPrivateFieldSet(_isCollapsed, this, options.collapsed === true);
		}
		return babelHelpers.createClass(NavigationPanel, [{
			key: "adjustItem",
			value: function adjustItem() {
				this.items = this.items.map(item => {
					this.keys.push(item.id);
					return new NavigationItem({
						id: item.id ?? null,
						title: item.title ?? null,
						active: item.active === true,
						events: item.events ?? null,
						link: item.link ?? null,
						locked: item.locked === true,
						dropdown: item.active === true && _classPrivateFieldGet(_isCollapsed, this),
						menuItems: item.active === true && _classPrivateFieldGet(_isCollapsed, this) ? _assertClassBrand(_NavigationPanel_brand, this, _getMenuItems).call(this) : [],
						onActivate: _classPrivateFieldGet(_deactivateOthers, this)
					});
				});
			}
		}, {
			key: "getItemById",
			value: function getItemById(value) {
				if (value) {
					const id = this.keys.indexOf(value);
					return this.items[id];
				}
				return null;
			}
		}, {
			key: "getContainer",
			value: function getContainer() {
				if (!this.container) {
					this.container = main_core.Tag.render`
				<div class="ui-nav-panel ui-nav-panel__scope"></div>
			`;
					instanceMap.set(this.container, this);
					if (this.hasAirDesign()) {
						main_core.Dom.addClass(this.container, '--air');
					}
					if (_classPrivateFieldGet(_isCollapsed, this)) {
						main_core.Dom.addClass(this.container, '--collapsed');
					}
				}
				return this.container;
			}
		}, {
			key: "render",
			value: function render() {
				this.items.forEach(item => {
					if (_classPrivateFieldGet(_isCollapsed, this) && item.active === false) {
						return;
					}
					if (item instanceof NavigationItem) {
						main_core.Dom.append(item.getContainer(), this.getContainer());
					}
				});
				main_core.Dom.clean(this.target);
				main_core.Dom.append(this.getContainer(), this.target);
			}
		}, {
			key: "init",
			value: function init() {
				this.adjustItem();
				this.render();
			}
		}, {
			key: "isCollapsed",
			value: function isCollapsed() {
				return _classPrivateFieldGet(_isCollapsed, this);
			}
		}, {
			key: "collapse",
			value: function collapse() {
				if (_classPrivateFieldGet(_isCollapsed, this)) {
					return;
				}
				_classPrivateFieldSet(_isCollapsed, this, true);
				_assertClassBrand(_NavigationPanel_brand, this, _rebuild).call(this);
			}
		}, {
			key: "expand",
			value: function expand() {
				if (!_classPrivateFieldGet(_isCollapsed, this)) {
					return;
				}
				_classPrivateFieldSet(_isCollapsed, this, false);
				_assertClassBrand(_NavigationPanel_brand, this, _rebuild).call(this);
			}
		}, {
			key: "hasAirDesign",
			value: function hasAirDesign() {
				return main_core.Extension.getSettings('ui.navigationpanel').get('useAirDesign');
			}
		}], [{
			key: "getInstanceByNode",
			value: function getInstanceByNode(node) {
				return instanceMap.get(node) ?? null;
			}
		}]);
	}();
	function _rebuild() {
		this.items.forEach(item => {
			if (item instanceof NavigationItem) {
				item.closeMenu();
			}
		});
		const currentActiveId = this.items.find(item => item.active === true)?.id ?? null;
		_classPrivateFieldSet(_rawItems, this, _classPrivateFieldGet(_rawItems, this).map(item => ({
			...item,
			active: item.id === currentActiveId
		})));
		this.keys = [];
		this.items = _classPrivateFieldGet(_rawItems, this);
		this.adjustItem();
		_assertClassBrand(_NavigationPanel_brand, this, _rerenderContent).call(this);
	}
	function _rerenderContent() {
		const container = this.getContainer();
		main_core.Dom.clean(container);
		if (_classPrivateFieldGet(_isCollapsed, this)) {
			main_core.Dom.addClass(container, '--collapsed');
		} else {
			main_core.Dom.removeClass(container, '--collapsed');
		}
		this.items.forEach(item => {
			if (_classPrivateFieldGet(_isCollapsed, this) && item.active === false) {
				return;
			}
			if (item instanceof NavigationItem) {
				main_core.Dom.append(item.getContainer(), container);
			}
		});
	}
	function _getMenuItems() {
		return this.items.map(item => {
			return {
				id: item.id ?? Math.random(),
				title: item.title,
				isSelected: item.active === true,
				isLocked: item.locked === true,
				onClick: () => {
					if (main_core.Type.isFunction(item.events?.click)) {
						item.events.click();
						return;
					}
					const href = item.link?.href;
					if (main_core.Type.isStringFilled(href)) {
						window.location.href = href;
					}
				}
			};
		});
	}

	exports.NavigationPanel = NavigationPanel;

})(this.BX.UI = this.BX.UI || {}, BX.UI, BX, BX.Event, BX.UI.IconSet, BX.UI.System);
//# sourceMappingURL=navigationpanel.bundle.js.map
