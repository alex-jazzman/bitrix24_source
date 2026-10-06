/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_a11y, ui_iconSet_api_core, ui_system_menu, ui_buttons, ui_iconSet_outline, main_core_events) {
	'use strict';

	function _classPrivateFieldInitSpec$4(e, t, a) { _checkPrivateRedeclaration$4(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$4(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet$4(s, a) { return s.get(_assertClassBrand$4(s, a)); }
	function _classPrivateFieldSet$4(s, a, r) { return s.set(_assertClassBrand$4(s, a), r), r; }
	function _assertClassBrand$4(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	const MENU_CLASS_NAME = 'ui-air-action-panel__menu';
	const POPUP_SHOW_EVENT = 'BX.Main.Popup:onShow';
	function applyDataset(node, dataset) {
		if (!node) {
			return;
		}
		Object.entries(dataset).forEach(([key, value]) => {
			main_core.Dom.attr(node, `data-${key}`, value);
		});
	}
	var _dataset$2 = new WeakMap();
	var _watching = new WeakMap();
	var _handlePopupShow = new WeakMap();
	let MenuPopupDataset = function () {
		function MenuPopupDataset(dataset) {
			babelHelpers.classCallCheck(this, MenuPopupDataset);
			_classPrivateFieldInitSpec$4(this, _dataset$2, void 0);
			_classPrivateFieldInitSpec$4(this, _watching, false);
			_classPrivateFieldInitSpec$4(this, _handlePopupShow, event => {
				const container = event.getTarget()?.getPopupContainer?.() ?? null;
				if (main_core.Type.isDomNode(container) && main_core.Dom.hasClass(container, MENU_CLASS_NAME)) {
					applyDataset(container, _classPrivateFieldGet$4(_dataset$2, this));
				}
			});
			_classPrivateFieldSet$4(_dataset$2, this, dataset);
		}
		return babelHelpers.createClass(MenuPopupDataset, [{
			key: "start",
			value: function start() {
				if (_classPrivateFieldGet$4(_watching, this) || Object.keys(_classPrivateFieldGet$4(_dataset$2, this)).length === 0) {
					return;
				}
				_classPrivateFieldSet$4(_watching, this, true);
				main_core_events.EventEmitter.subscribe(POPUP_SHOW_EVENT, _classPrivateFieldGet$4(_handlePopupShow, this));
			}
		}, {
			key: "stop",
			value: function stop() {
				if (!_classPrivateFieldGet$4(_watching, this)) {
					return;
				}
				_classPrivateFieldSet$4(_watching, this, false);
				main_core_events.EventEmitter.unsubscribe(POPUP_SHOW_EVENT, _classPrivateFieldGet$4(_handlePopupShow, this));
			}
		}]);
	}();

	function _classPrivateMethodInitSpec$3(e, a) { _checkPrivateRedeclaration$3(e, a), a.add(e); }
	function _classPrivateFieldInitSpec$3(e, t, a) { _checkPrivateRedeclaration$3(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$3(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet$3(s, a) { return s.get(_assertClassBrand$3(s, a)); }
	function _classPrivateFieldSet$3(s, a, r) { return s.set(_assertClassBrand$3(s, a), r), r; }
	function _assertClassBrand$3(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	const TEST_ID_PREFIX = 'ui-action-panel-item';
	var _id = new WeakMap();
	var _text = new WeakMap();
	var _title = new WeakMap();
	var _icon = new WeakMap();
	var _iconOnly = new WeakMap();
	var _href = new WeakMap();
	var _onclick = new WeakMap();
	var _menuItems = new WeakMap();
	var _closeOnItemClick = new WeakMap();
	var _disabled = new WeakMap();
	var _hidden$1 = new WeakMap();
	var _overflowHidden = new WeakMap();
	var _className$1 = new WeakMap();
	var _dataset$1 = new WeakMap();
	var _popupDataset = new WeakMap();
	var _attributes = new WeakMap();
	var _useAirDesign = new WeakMap();
	var _container$1 = new WeakMap();
	var _splitButton = new WeakMap();
	var _menu = new WeakMap();
	var _menuId = new WeakMap();
	var _ActionPanelItem_brand = new WeakSet();
	var _handleClick = new WeakMap();
	let ActionPanelItem = function () {
		function ActionPanelItem(options) {
			babelHelpers.classCallCheck(this, ActionPanelItem);
			_classPrivateMethodInitSpec$3(this, _ActionPanelItem_brand);
			_classPrivateFieldInitSpec$3(this, _id, void 0);
			_classPrivateFieldInitSpec$3(this, _text, void 0);
			_classPrivateFieldInitSpec$3(this, _title, void 0);
			_classPrivateFieldInitSpec$3(this, _icon, void 0);
			_classPrivateFieldInitSpec$3(this, _iconOnly, void 0);
			_classPrivateFieldInitSpec$3(this, _href, void 0);
			_classPrivateFieldInitSpec$3(this, _onclick, void 0);
			_classPrivateFieldInitSpec$3(this, _menuItems, void 0);
			_classPrivateFieldInitSpec$3(this, _closeOnItemClick, void 0);
			_classPrivateFieldInitSpec$3(this, _disabled, void 0);
			_classPrivateFieldInitSpec$3(this, _hidden$1, void 0);
			_classPrivateFieldInitSpec$3(this, _overflowHidden, false);
			_classPrivateFieldInitSpec$3(this, _className$1, void 0);
			_classPrivateFieldInitSpec$3(this, _dataset$1, void 0);
			_classPrivateFieldInitSpec$3(this, _popupDataset, void 0);
			_classPrivateFieldInitSpec$3(this, _attributes, void 0);
			_classPrivateFieldInitSpec$3(this, _useAirDesign, void 0);
			_classPrivateFieldInitSpec$3(this, _container$1, null);
			_classPrivateFieldInitSpec$3(this, _splitButton, null);
			_classPrivateFieldInitSpec$3(this, _menu, null);
			_classPrivateFieldInitSpec$3(this, _menuId, `ui-air-action-panel-item-menu-${main_core.Text.getRandom(12)}`);
			_classPrivateFieldInitSpec$3(this, _handleClick, event => {
				if (_classPrivateFieldGet$3(_disabled, this)) {
					event.preventDefault();
					return;
				}
				if (this.hasMenu()) {
					event.preventDefault();
					_assertClassBrand$3(_ActionPanelItem_brand, this, _toggleMenu).call(this);
					return;
				}
				_assertClassBrand$3(_ActionPanelItem_brand, this, _runClick).call(this, event);
			});
			_classPrivateFieldSet$3(_id, this, main_core.Type.isStringFilled(options.id) ? options.id : null);
			_classPrivateFieldSet$3(_text, this, main_core.Type.isStringFilled(options.text) ? options.text : null);
			_classPrivateFieldSet$3(_title, this, main_core.Type.isStringFilled(options.title) ? options.title : null);
			_classPrivateFieldSet$3(_icon, this, main_core.Type.isStringFilled(options.icon) ? options.icon : null);
			_classPrivateFieldSet$3(_iconOnly, this, options.iconOnly === true);
			_classPrivateFieldSet$3(_href, this, main_core.Type.isStringFilled(options.href) ? options.href : null);
			_classPrivateFieldSet$3(_onclick, this, main_core.Type.isFunction(options.onclick) ? options.onclick : null);
			_classPrivateFieldSet$3(_menuItems, this, main_core.Type.isArrayFilled(options.menuItems) ? options.menuItems : []);
			_classPrivateFieldSet$3(_closeOnItemClick, this, options.closeOnItemClick !== false);
			_classPrivateFieldSet$3(_disabled, this, options.disabled === true);
			_classPrivateFieldSet$3(_hidden$1, this, options.hidden === true);
			_classPrivateFieldSet$3(_className$1, this, main_core.Type.isStringFilled(options.className) ? options.className : null);
			_classPrivateFieldSet$3(_dataset$1, this, main_core.Type.isPlainObject(options.dataset) ? options.dataset : {});
			_classPrivateFieldSet$3(_popupDataset, this, main_core.Type.isPlainObject(options.popupDataset) ? options.popupDataset : {});
			_classPrivateFieldSet$3(_attributes, this, main_core.Type.isPlainObject(options.attributes) ? options.attributes : {});
			_classPrivateFieldSet$3(_useAirDesign, this, options.useAirDesign === true);
			_assertClassBrand$3(_ActionPanelItem_brand, this, _dropNamelessIconOnly).call(this);
		}
		return babelHelpers.createClass(ActionPanelItem, [{
			key: "getId",
			value: function getId() {
				return _classPrivateFieldGet$3(_id, this);
			}
		}, {
			key: "getText",
			value: function getText() {
				return _classPrivateFieldGet$3(_text, this);
			}
		}, {
			key: "hasMenu",
			value: function hasMenu() {
				return _classPrivateFieldGet$3(_menuItems, this).length > 0;
			}
		}, {
			key: "isSplit",
			value: function isSplit() {
				return _classPrivateFieldGet$3(_onclick, this) !== null && this.hasMenu();
			}
		}, {
			key: "isInteractive",
			value: function isInteractive() {
				return _classPrivateFieldGet$3(_onclick, this) !== null || this.hasMenu() || _classPrivateFieldGet$3(_href, this) !== null;
			}
		}, {
			key: "isDisabled",
			value: function isDisabled() {
				return _classPrivateFieldGet$3(_disabled, this);
			}
		}, {
			key: "isHidden",
			value: function isHidden() {
				return _classPrivateFieldGet$3(_hidden$1, this);
			}
		}, {
			key: "getContainer",
			value: function getContainer() {
				if (!_classPrivateFieldGet$3(_container$1, this)) {
					_classPrivateFieldSet$3(_container$1, this, this.isSplit() ? _assertClassBrand$3(_ActionPanelItem_brand, this, _renderSplitButton).call(this) : _assertClassBrand$3(_ActionPanelItem_brand, this, _renderSimpleItem).call(this));
					_assertClassBrand$3(_ActionPanelItem_brand, this, _applyState).call(this, _classPrivateFieldGet$3(_container$1, this));
				}
				return _classPrivateFieldGet$3(_container$1, this);
			}
		}, {
			key: "show",
			value: function show() {
				_classPrivateFieldSet$3(_hidden$1, this, false);
				_assertClassBrand$3(_ActionPanelItem_brand, this, _applyVisibility).call(this);
			}
		}, {
			key: "hide",
			value: function hide() {
				_classPrivateFieldSet$3(_hidden$1, this, true);
				_assertClassBrand$3(_ActionPanelItem_brand, this, _applyVisibility).call(this);
			}
		}, {
			key: "setOverflowHidden",
			value: function setOverflowHidden(overflowHidden) {
				if (_classPrivateFieldGet$3(_overflowHidden, this) === overflowHidden) {
					return;
				}
				_classPrivateFieldSet$3(_overflowHidden, this, overflowHidden);
				_assertClassBrand$3(_ActionPanelItem_brand, this, _applyVisibility).call(this);
			}
		}, {
			key: "disable",
			value: function disable() {
				_assertClassBrand$3(_ActionPanelItem_brand, this, _setDisabled).call(this, true);
			}
		}, {
			key: "enable",
			value: function enable() {
				_assertClassBrand$3(_ActionPanelItem_brand, this, _setDisabled).call(this, false);
			}
		}, {
			key: "openMenu",
			value: function openMenu() {
				if (!this.hasMenu() || _classPrivateFieldGet$3(_disabled, this)) {
					return;
				}
				if (this.isSplit()) {
					_classPrivateFieldGet$3(_splitButton, this)?.getMenuButton().getContainer().click();
					return;
				}
				_assertClassBrand$3(_ActionPanelItem_brand, this, _showMenu).call(this);
			}
		}, {
			key: "closeMenu",
			value: function closeMenu() {
				_classPrivateFieldGet$3(_menu, this)?.close();
				_classPrivateFieldGet$3(_splitButton, this)?.getSystemMenu()?.close();
			}
		}, {
			key: "getMenuItemOptions",
			value: function getMenuItemOptions() {
				const subMenu = this.hasMenu() ? {
					className: MENU_CLASS_NAME,
					items: _classPrivateFieldGet$3(_menuItems, this),
					closeOnItemClick: _classPrivateFieldGet$3(_closeOnItemClick, this)
				} : undefined;
				return {
					id: _classPrivateFieldGet$3(_id, this) ?? undefined,
					title: _classPrivateFieldGet$3(_text, this) ?? _classPrivateFieldGet$3(_title, this) ?? '',
					icon: _assertClassBrand$3(_ActionPanelItem_brand, this, _resolveIcon).call(this) ?? undefined,
					design: _classPrivateFieldGet$3(_disabled, this) ? ui_system_menu.MenuItemDesign.Disabled : undefined,
					subMenu,
					closeOnSubItemClick: _classPrivateFieldGet$3(_closeOnItemClick, this),
					onClick: _classPrivateFieldGet$3(_disabled, this) || this.hasMenu() ? undefined : () => _assertClassBrand$3(_ActionPanelItem_brand, this, _runClick).call(this, null)
				};
			}
		}, {
			key: "destroy",
			value: function destroy() {
				this.closeMenu();
				_classPrivateFieldGet$3(_menu, this)?.destroy();
				_classPrivateFieldSet$3(_menu, this, null);
				_classPrivateFieldGet$3(_splitButton, this)?.setSystemMenu(false);
				_classPrivateFieldSet$3(_splitButton, this, null);
				if (_classPrivateFieldGet$3(_container$1, this)) {
					main_core.Dom.remove(_classPrivateFieldGet$3(_container$1, this));
					_classPrivateFieldSet$3(_container$1, this, null);
				}
			}
		}]);
	}();
	function _dropNamelessIconOnly() {
		if (!_classPrivateFieldGet$3(_iconOnly, this) || !this.isInteractive() || _classPrivateFieldGet$3(_title, this) !== null || _classPrivateFieldGet$3(_text, this) !== null) {
			return;
		}
		_classPrivateFieldSet$3(_iconOnly, this, false);
		console.error(`UI.ActionPanel: an icon-only item needs a title or a text to be named, id: ${_classPrivateFieldGet$3(_id, this) ?? 'none'}`);
	}
	function _renderSimpleItem() {
		const content = [];
		const icon = _assertClassBrand$3(_ActionPanelItem_brand, this, _renderIcon).call(this);
		if (icon) {
			content.push(icon);
		}
		const text = _assertClassBrand$3(_ActionPanelItem_brand, this, _renderText).call(this);
		if (text) {
			content.push(text);
		}
		if (_classPrivateFieldGet$3(_href, this) !== null) {
			return main_core.Tag.render`<a class="ui-air-action-panel__item">${content}</a>`;
		}
		if (this.isInteractive()) {
			return main_core.Tag.render`<button type="button" class="ui-air-action-panel__item">${content}</button>`;
		}
		return main_core.Tag.render`<span class="ui-air-action-panel__item --static">${content}</span>`;
	}
	function _renderSplitButton() {
		_classPrivateFieldSet$3(_splitButton, this, new ui_buttons.SplitButton({
			useAirDesign: _classPrivateFieldGet$3(_useAirDesign, this),
			menuTarget: ui_buttons.SplitSubButtonType.MENU,
			mainButton: {
				text: _classPrivateFieldGet$3(_text, this) ?? '',
				onclick: (button, event) => _assertClassBrand$3(_ActionPanelItem_brand, this, _runClick).call(this, event)
			},
			menuButton: {},
			systemMenu: {
				id: _classPrivateFieldGet$3(_menuId, this),
				className: MENU_CLASS_NAME,
				items: _classPrivateFieldGet$3(_menuItems, this),
				closeOnItemClick: _classPrivateFieldGet$3(_closeOnItemClick, this),
				events: {
					onShow: () => _assertClassBrand$3(_ActionPanelItem_brand, this, _applyMenuTestId).call(this, _classPrivateFieldGet$3(_splitButton, this)?.getSystemMenu())
				}
			}
		}));
		main_core.Dom.attr(_classPrivateFieldGet$3(_splitButton, this).getMainButton().getContainer(), 'data-testid', `${_assertClassBrand$3(_ActionPanelItem_brand, this, _getTestId).call(this)}-main-btn`);
		main_core.Dom.attr(_classPrivateFieldGet$3(_splitButton, this).getMenuButton()?.getContainer(), 'data-testid', `${_assertClassBrand$3(_ActionPanelItem_brand, this, _getTestId).call(this)}-menu-btn`);
		return _classPrivateFieldGet$3(_splitButton, this).getContainer();
	}
	function _getTestId() {
		return _classPrivateFieldGet$3(_id, this) === null ? TEST_ID_PREFIX : `${TEST_ID_PREFIX}-${_classPrivateFieldGet$3(_id, this)}`;
	}
	function _resolveIcon() {
		return _classPrivateFieldGet$3(_icon, this) !== null && ui_iconSet_api_core.Icon.isValid({
			icon: _classPrivateFieldGet$3(_icon, this)
		}) ? _classPrivateFieldGet$3(_icon, this) : null;
	}
	function _renderIcon() {
		const icon = _assertClassBrand$3(_ActionPanelItem_brand, this, _resolveIcon).call(this);
		if (icon === null) {
			return null;
		}
		const wrapper = main_core.Tag.render`<span class="ui-air-action-panel__item-icon" aria-hidden="true"></span>`;
		new ui_iconSet_api_core.Icon({
			icon
		}).renderTo(wrapper);
		return wrapper;
	}
	function _renderText() {
		if (_classPrivateFieldGet$3(_text, this) === null || _classPrivateFieldGet$3(_iconOnly, this)) {
			return null;
		}
		const node = main_core.Tag.render`<span class="ui-air-action-panel__item-text"></span>`;
		node.textContent = _classPrivateFieldGet$3(_text, this);
		return node;
	}
	function _applyState(container) {
		main_core.Dom.attr(container, 'data-role', 'action-panel-item');
		main_core.Dom.attr(container, 'data-testid', _assertClassBrand$3(_ActionPanelItem_brand, this, _getTestId).call(this));
		if (_classPrivateFieldGet$3(_id, this) !== null) {
			container.id = _classPrivateFieldGet$3(_id, this);
		}
		if (_classPrivateFieldGet$3(_className$1, this) !== null) {
			main_core.Dom.addClass(container, _classPrivateFieldGet$3(_className$1, this));
		}
		main_core.Dom.attr(container, _classPrivateFieldGet$3(_attributes, this));
		if (_classPrivateFieldGet$3(_href, this) !== null) {
			main_core.Dom.attr(container, 'href', _classPrivateFieldGet$3(_href, this));
		}
		const title = _classPrivateFieldGet$3(_title, this) ?? (_classPrivateFieldGet$3(_href, this) !== null ? _classPrivateFieldGet$3(_text, this) : null);
		if (title !== null) {
			main_core.Dom.attr(container, 'title', title);
		}
		if (_classPrivateFieldGet$3(_iconOnly, this) && this.isInteractive()) {
			const label = _classPrivateFieldGet$3(_title, this) ?? _classPrivateFieldGet$3(_text, this);
			if (label !== null) {
				main_core.Dom.attr(container, 'aria-label', label);
			}
		}
		if (this.hasMenu() && !this.isSplit()) {
			main_core.Dom.attr(container, 'aria-haspopup', 'menu');
			main_core.Dom.attr(container, 'aria-expanded', 'false');
		}
		Object.entries(_classPrivateFieldGet$3(_dataset$1, this)).forEach(([key, value]) => {
			main_core.Dom.attr(container, `data-${key}`, value);
		});
		if (_classPrivateFieldGet$3(_disabled, this)) {
			_assertClassBrand$3(_ActionPanelItem_brand, this, _setDisabled).call(this, true);
		}
		if (_classPrivateFieldGet$3(_hidden$1, this)) {
			_assertClassBrand$3(_ActionPanelItem_brand, this, _applyVisibility).call(this);
		}
		if (!this.isSplit() && this.isInteractive()) {
			main_core.Event.bind(container, 'click', _classPrivateFieldGet$3(_handleClick, this));
		}
	}
	function _applyVisibility() {
		const invisible = _classPrivateFieldGet$3(_hidden$1, this) || _classPrivateFieldGet$3(_overflowHidden, this);
		main_core.Dom.style(this.getContainer(), 'display', invisible ? 'none' : null);
	}
	function _runClick(event) {
		if (_classPrivateFieldGet$3(_disabled, this)) {
			return;
		}
		_classPrivateFieldGet$3(_onclick, this)?.call(this, event, this);
	}
	function _toggleMenu() {
		if (_classPrivateFieldGet$3(_menu, this)?.getPopup()?.isShown() === true) {
			_classPrivateFieldGet$3(_menu, this).close();
			return;
		}
		_assertClassBrand$3(_ActionPanelItem_brand, this, _showMenu).call(this);
	}
	function _showMenu() {
		const menu = _assertClassBrand$3(_ActionPanelItem_brand, this, _getMenu).call(this);
		menu.show(this.getContainer());
		applyDataset(menu.getPopup()?.getPopupContainer() ?? null, _classPrivateFieldGet$3(_popupDataset, this));
		_assertClassBrand$3(_ActionPanelItem_brand, this, _applyMenuTestId).call(this, menu);
	}
	function _applyMenuTestId(menu) {
		main_core.Dom.attr(menu?.getPopup()?.getPopupContainer() ?? null, 'data-testid', `${_assertClassBrand$3(_ActionPanelItem_brand, this, _getTestId).call(this)}-menu`);
	}
	function _getMenu() {
		if (!_classPrivateFieldGet$3(_menu, this)) {
			_classPrivateFieldSet$3(_menu, this, new ui_system_menu.Menu({
				id: _classPrivateFieldGet$3(_menuId, this),
				className: MENU_CLASS_NAME,
				items: _classPrivateFieldGet$3(_menuItems, this),
				closeOnItemClick: _classPrivateFieldGet$3(_closeOnItemClick, this),
				events: {
					onShow: () => _assertClassBrand$3(_ActionPanelItem_brand, this, _setExpanded).call(this, true),
					onClose: () => _assertClassBrand$3(_ActionPanelItem_brand, this, _setExpanded).call(this, false)
				}
			}));
		}
		return _classPrivateFieldGet$3(_menu, this);
	}
	function _setExpanded(expanded) {
		main_core.Dom.attr(this.getContainer(), 'aria-expanded', expanded ? 'true' : 'false');
	}
	function _setDisabled(disabled) {
		_classPrivateFieldSet$3(_disabled, this, disabled);
		if (!_classPrivateFieldGet$3(_container$1, this)) {
			return;
		}
		if (_classPrivateFieldGet$3(_splitButton, this)) {
			_classPrivateFieldGet$3(_splitButton, this).setDisabled(disabled);
			return;
		}
		const container = _classPrivateFieldGet$3(_container$1, this);
		main_core.Dom[disabled ? 'addClass' : 'removeClass'](container, '--disabled');
		main_core.Dom.attr(container, 'data-slider-ignore-autobinding', disabled ? 'true' : null);
		if (container instanceof HTMLButtonElement) {
			container.disabled = disabled;
			return;
		}
		if (this.isInteractive()) {
			main_core.Dom.attr(container, 'aria-disabled', disabled ? 'true' : null);
			main_core.Dom.attr(container, 'tabindex', disabled ? '-1' : null);
		}
	}

	function _classPrivateMethodInitSpec$2(e, a) { _checkPrivateRedeclaration$2(e, a), a.add(e); }
	function _classPrivateFieldInitSpec$2(e, t, a) { _checkPrivateRedeclaration$2(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$2(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet$2(s, a) { return s.get(_assertClassBrand$2(s, a)); }
	function _classPrivateFieldSet$2(s, a, r) { return s.set(_assertClassBrand$2(s, a), r), r; }
	function _assertClassBrand$2(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _host = new WeakMap();
	var _hidden = new WeakMap();
	var _OverflowCalculator_brand = new WeakSet();
	let OverflowCalculator = function () {
		function OverflowCalculator(host) {
			babelHelpers.classCallCheck(this, OverflowCalculator);
			_classPrivateMethodInitSpec$2(this, _OverflowCalculator_brand);
			_classPrivateFieldInitSpec$2(this, _host, void 0);
			_classPrivateFieldInitSpec$2(this, _hidden, []);
			_classPrivateFieldSet$2(_host, this, host);
		}
		return babelHelpers.createClass(OverflowCalculator, [{
			key: "getHiddenItems",
			value: function getHiddenItems() {
				return _classPrivateFieldGet$2(_hidden, this);
			}
		}, {
			key: "recalc",
			value: function recalc() {
				_classPrivateFieldSet$2(_hidden, this, _assertClassBrand$2(_OverflowCalculator_brand, this, _collectHidden).call(this, false));
				if (_classPrivateFieldGet$2(_hidden, this).length === 0) {
					if (_classPrivateFieldGet$2(_host, this).hasMoreBlock()) {
						_classPrivateFieldGet$2(_host, this).removeMoreBlock();
					}
					return _classPrivateFieldGet$2(_hidden, this);
				}
				if (!_classPrivateFieldGet$2(_host, this).hasMoreBlock()) {
					_classPrivateFieldGet$2(_host, this).addMoreBlock();
				}
				_classPrivateFieldSet$2(_hidden, this, _assertClassBrand$2(_OverflowCalculator_brand, this, _collectHidden).call(this, true));
				return _classPrivateFieldGet$2(_hidden, this);
			}
		}, {
			key: "clear",
			value: function clear() {
				_classPrivateFieldSet$2(_hidden, this, []);
				if (_classPrivateFieldGet$2(_host, this).hasMoreBlock()) {
					_classPrivateFieldGet$2(_host, this).removeMoreBlock();
				}
			}
		}]);
	}();
	function _collectHidden(countsMoreBlock) {
		_classPrivateFieldGet$2(_host, this).beforeCollect?.(countsMoreBlock && _classPrivateFieldGet$2(_host, this).hasMoreBlock());
		return _classPrivateFieldGet$2(_host, this).getItems().filter(item => _classPrivateFieldGet$2(_host, this).isNotFit(item));
	}

	function _classPrivateMethodInitSpec$1(e, a) { _checkPrivateRedeclaration$1(e, a), a.add(e); }
	function _classPrivateFieldInitSpec$1(e, t, a) { _checkPrivateRedeclaration$1(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$1(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet$1(s, a) { return s.get(_assertClassBrand$1(s, a)); }
	function _classPrivateFieldSet$1(s, a, r) { return s.set(_assertClassBrand$1(s, a), r), r; }
	function _assertClassBrand$1(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	const SCROLL_OVERFLOW = /(auto|scroll|overlay)/;
	function isScrollable(node) {
		const style = window.getComputedStyle(node);
		return SCROLL_OVERFLOW.test(`${style.overflowY}${style.overflowX}`);
	}
	function collectScrollableAncestors(node) {
		const result = [];
		let current = node.parentElement;
		while (current && current !== document.body && current !== document.documentElement) {
			if (isScrollable(current)) {
				result.push(current);
			}
			current = current.parentElement;
		}
		return result;
	}
	var _parent = new WeakMap();
	var _maxHeight$1 = new WeakMap();
	var _onApply = new WeakMap();
	var _onModeChange = new WeakMap();
	var _onGeometryChange$1 = new WeakMap();
	var _resizeObserver = new WeakMap();
	var _observedParent = new WeakMap();
	var _observedAncestor = new WeakMap();
	var _observedNodes = new WeakMap();
	var _scrollTargets = new WeakMap();
	var _fixed = new WeakMap();
	var _started = new WeakMap();
	var _refreshing = new WeakMap();
	var _frameId = new WeakMap();
	var _handleGeometryEvent = new WeakMap();
	var _PositionTracker_brand = new WeakSet();
	let PositionTracker = function () {
		function PositionTracker(options) {
			babelHelpers.classCallCheck(this, PositionTracker);
			_classPrivateMethodInitSpec$1(this, _PositionTracker_brand);
			_classPrivateFieldInitSpec$1(this, _parent, void 0);
			_classPrivateFieldInitSpec$1(this, _maxHeight$1, void 0);
			_classPrivateFieldInitSpec$1(this, _onApply, void 0);
			_classPrivateFieldInitSpec$1(this, _onModeChange, void 0);
			_classPrivateFieldInitSpec$1(this, _onGeometryChange$1, void 0);
			_classPrivateFieldInitSpec$1(this, _resizeObserver, null);
			_classPrivateFieldInitSpec$1(this, _observedParent, null);
			_classPrivateFieldInitSpec$1(this, _observedAncestor, null);
			_classPrivateFieldInitSpec$1(this, _observedNodes, []);
			_classPrivateFieldInitSpec$1(this, _scrollTargets, []);
			_classPrivateFieldInitSpec$1(this, _fixed, false);
			_classPrivateFieldInitSpec$1(this, _started, false);
			_classPrivateFieldInitSpec$1(this, _refreshing, false);
			_classPrivateFieldInitSpec$1(this, _frameId, null);
			_classPrivateFieldInitSpec$1(this, _handleGeometryEvent, void 0);
			_classPrivateFieldSet$1(_parent, this, options.parent);
			_classPrivateFieldSet$1(_maxHeight$1, this, main_core.Type.isNumber(options.maxHeight) ? options.maxHeight : null);
			_classPrivateFieldSet$1(_onApply, this, options.onApply);
			_classPrivateFieldSet$1(_onModeChange, this, main_core.Type.isFunction(options.onModeChange) ? options.onModeChange : null);
			_classPrivateFieldSet$1(_onGeometryChange$1, this, main_core.Type.isFunction(options.onGeometryChange) ? options.onGeometryChange : null);
			_classPrivateFieldSet$1(_handleGeometryEvent, this, _assertClassBrand$1(_PositionTracker_brand, this, _scheduleRefresh).bind(this));
		}
		return babelHelpers.createClass(PositionTracker, [{
			key: "resolveParent",
			value: function resolveParent() {
				if (main_core.Type.isDomNode(_classPrivateFieldGet$1(_parent, this))) {
					return _classPrivateFieldGet$1(_parent, this);
				}
				if (main_core.Type.isFunction(_classPrivateFieldGet$1(_parent, this))) {
					const node = _classPrivateFieldGet$1(_parent, this).call(null);
					return main_core.Type.isDomNode(node) ? node : null;
				}
				return null;
			}
		}, {
			key: "isFixed",
			value: function isFixed() {
				return _classPrivateFieldGet$1(_fixed, this);
			}
		}, {
			key: "setMaxHeight",
			value: function setMaxHeight(maxHeight) {
				_classPrivateFieldSet$1(_maxHeight$1, this, main_core.Type.isNumber(maxHeight) ? maxHeight : null);
			}
		}, {
			key: "start",
			value: function start() {
				if (_classPrivateFieldGet$1(_started, this)) {
					return true;
				}
				const parent = this.resolveParent();
				if (!parent) {
					return false;
				}
				_classPrivateFieldSet$1(_started, this, true);
				_assertClassBrand$1(_PositionTracker_brand, this, _subscribe).call(this, parent);
				this.refresh();
				return true;
			}
		}, {
			key: "stop",
			value: function stop() {
				if (!_classPrivateFieldGet$1(_started, this)) {
					return;
				}
				_classPrivateFieldSet$1(_started, this, false);
				_assertClassBrand$1(_PositionTracker_brand, this, _cancelScheduledRefresh).call(this);
				_assertClassBrand$1(_PositionTracker_brand, this, _unsubscribe).call(this);
			}
		}, {
			key: "refresh",
			value: function refresh() {
				if (_classPrivateFieldGet$1(_refreshing, this)) {
					return;
				}
				const parent = this.resolveParent();
				if (!parent) {
					return;
				}
				if (_classPrivateFieldGet$1(_started, this) && (parent !== _classPrivateFieldGet$1(_observedParent, this) || parent.parentElement !== _classPrivateFieldGet$1(_observedAncestor, this))) {
					_assertClassBrand$1(_PositionTracker_brand, this, _unsubscribe).call(this);
					_assertClassBrand$1(_PositionTracker_brand, this, _subscribe).call(this, parent);
				}
				_assertClassBrand$1(_PositionTracker_brand, this, _cancelScheduledRefresh).call(this);
				_classPrivateFieldSet$1(_refreshing, this, true);
				try {
					const viewportRect = parent.getBoundingClientRect();
					let measuredRect = viewportRect;
					const fixed = viewportRect.top <= 0;
					if (fixed !== _classPrivateFieldGet$1(_fixed, this)) {
						_classPrivateFieldSet$1(_fixed, this, fixed);
						if (_classPrivateFieldGet$1(_onModeChange, this)) {
							_classPrivateFieldGet$1(_onModeChange, this).call(this, fixed);
							measuredRect = parent.getBoundingClientRect();
						}
					}
					_classPrivateFieldGet$1(_onApply, this).call(this, this.measure(parent, fixed, measuredRect));
					if (_classPrivateFieldGet$1(_onGeometryChange$1, this)) {
						_classPrivateFieldGet$1(_onGeometryChange$1, this).call(this);
					}
				} finally {
					_classPrivateFieldSet$1(_refreshing, this, false);
				}
			}
		}, {
			key: "measure",
			value: function measure(parent, fixed, rect = null) {
				const viewportRect = rect ?? parent.getBoundingClientRect();
				const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
				const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
				const documentTop = viewportRect.top + scrollTop;
				const documentLeft = viewportRect.left + scrollLeft;
				const offsetTop = _classPrivateFieldGet$1(_maxHeight$1, this) === null ? 0 : viewportRect.height - _classPrivateFieldGet$1(_maxHeight$1, this);
				return {
					width: viewportRect.width,
					top: documentTop + offsetTop,
					left: fixed ? viewportRect.left : documentLeft
				};
			}
		}]);
	}();
	function _scheduleRefresh() {
		if (_classPrivateFieldGet$1(_frameId, this) !== null) {
			return;
		}
		_classPrivateFieldSet$1(_frameId, this, requestAnimationFrame(() => {
			_classPrivateFieldSet$1(_frameId, this, null);
			this.refresh();
		}));
	}
	function _cancelScheduledRefresh() {
		if (_classPrivateFieldGet$1(_frameId, this) === null) {
			return;
		}
		cancelAnimationFrame(_classPrivateFieldGet$1(_frameId, this));
		_classPrivateFieldSet$1(_frameId, this, null);
	}
	function _subscribe(parent) {
		_classPrivateFieldSet$1(_observedParent, this, parent);
		_classPrivateFieldSet$1(_observedAncestor, this, parent.parentElement);
		const observer = new ResizeObserver(_classPrivateFieldGet$1(_handleGeometryEvent, this));
		_classPrivateFieldSet$1(_resizeObserver, this, observer);
		_classPrivateFieldSet$1(_observedNodes, this, [parent, parent.parentElement].filter(node => Boolean(node) && node !== document.body && node !== document.documentElement));
		_classPrivateFieldGet$1(_observedNodes, this).forEach(node => observer.observe(node));
		_classPrivateFieldSet$1(_scrollTargets, this, [...collectScrollableAncestors(parent), window]);
		_classPrivateFieldGet$1(_scrollTargets, this).forEach(target => {
			target.addEventListener('scroll', _classPrivateFieldGet$1(_handleGeometryEvent, this), {
				passive: true
			});
		});
		window.addEventListener('resize', _classPrivateFieldGet$1(_handleGeometryEvent, this), {
			passive: true
		});
	}
	function _unsubscribe() {
		if (_classPrivateFieldGet$1(_resizeObserver, this)) {
			_classPrivateFieldGet$1(_resizeObserver, this).disconnect();
			_classPrivateFieldSet$1(_resizeObserver, this, null);
		}
		_classPrivateFieldSet$1(_observedNodes, this, []);
		_classPrivateFieldSet$1(_observedParent, this, null);
		_classPrivateFieldSet$1(_observedAncestor, this, null);
		_classPrivateFieldGet$1(_scrollTargets, this).forEach(target => {
			target.removeEventListener('scroll', _classPrivateFieldGet$1(_handleGeometryEvent, this));
		});
		_classPrivateFieldSet$1(_scrollTargets, this, []);
		window.removeEventListener('resize', _classPrivateFieldGet$1(_handleGeometryEvent, this));
	}

	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
	function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	const instanceMap = new WeakMap();
	const FIT_TOLERANCE = 1;
	const TRACKER_START_ATTEMPTS = 60;
	var _renderTo = new WeakMap();
	var _maxHeight = new WeakMap();
	var _className = new WeakMap();
	var _ariaLabel = new WeakMap();
	var _showTotalSelected = new WeakMap();
	var _dataset = new WeakMap();
	var _onResetAll = new WeakMap();
	var _onGeometryChange = new WeakMap();
	var _airDesign = new WeakMap();
	var _container = new WeakMap();
	var _itemsContainer = new WeakMap();
	var _totalValueNode = new WeakMap();
	var _totalSelected = new WeakMap();
	var _moreButton = new WeakMap();
	var _resetButton = new WeakMap();
	var _items = new WeakMap();
	var _overflow = new WeakMap();
	var _tracker = new WeakMap();
	var _focusZone = new WeakMap();
	var _focusOrigin = new WeakMap();
	var _moreMenu = new WeakMap();
	var _moreMenuId = new WeakMap();
	var _menuPopupDataset = new WeakMap();
	var _shown = new WeakMap();
	var _destroyed = new WeakMap();
	var _lastWidth = new WeakMap();
	var _lastAppliedTop = new WeakMap();
	var _lastAppliedLeft = new WeakMap();
	var _overflowFrameId = new WeakMap();
	var _trackerStartFrameId = new WeakMap();
	var _rowRight = new WeakMap();
	var _ActionPanel_brand = new WeakSet();
	var _handleMoreClick = new WeakMap();
	var _applyPosition = new WeakMap();
	var _applyFixedMode = new WeakMap();
	let ActionPanel = function () {
		function ActionPanel(_options) {
			babelHelpers.classCallCheck(this, ActionPanel);
			_classPrivateMethodInitSpec(this, _ActionPanel_brand);
			_classPrivateFieldInitSpec(this, _renderTo, void 0);
			_classPrivateFieldInitSpec(this, _maxHeight, void 0);
			_classPrivateFieldInitSpec(this, _className, void 0);
			_classPrivateFieldInitSpec(this, _ariaLabel, void 0);
			_classPrivateFieldInitSpec(this, _showTotalSelected, void 0);
			_classPrivateFieldInitSpec(this, _dataset, void 0);
			_classPrivateFieldInitSpec(this, _onResetAll, void 0);
			_classPrivateFieldInitSpec(this, _onGeometryChange, void 0);
			_classPrivateFieldInitSpec(this, _airDesign, void 0);
			_classPrivateFieldInitSpec(this, _container, void 0);
			_classPrivateFieldInitSpec(this, _itemsContainer, void 0);
			_classPrivateFieldInitSpec(this, _totalValueNode, null);
			_classPrivateFieldInitSpec(this, _totalSelected, null);
			_classPrivateFieldInitSpec(this, _moreButton, null);
			_classPrivateFieldInitSpec(this, _resetButton, null);
			_classPrivateFieldInitSpec(this, _items, []);
			_classPrivateFieldInitSpec(this, _overflow, void 0);
			_classPrivateFieldInitSpec(this, _tracker, void 0);
			_classPrivateFieldInitSpec(this, _focusZone, null);
			_classPrivateFieldInitSpec(this, _focusOrigin, null);
			_classPrivateFieldInitSpec(this, _moreMenu, null);
			_classPrivateFieldInitSpec(this, _moreMenuId, `ui-air-action-panel-more-${main_core.Text.getRandom(12)}`);
			_classPrivateFieldInitSpec(this, _menuPopupDataset, void 0);
			_classPrivateFieldInitSpec(this, _shown, false);
			_classPrivateFieldInitSpec(this, _destroyed, false);
			_classPrivateFieldInitSpec(this, _lastWidth, null);
			_classPrivateFieldInitSpec(this, _lastAppliedTop, null);
			_classPrivateFieldInitSpec(this, _lastAppliedLeft, null);
			_classPrivateFieldInitSpec(this, _overflowFrameId, null);
			_classPrivateFieldInitSpec(this, _trackerStartFrameId, null);
			_classPrivateFieldInitSpec(this, _rowRight, null);
			_classPrivateFieldInitSpec(this, _handleMoreClick, () => {
				if (_classPrivateFieldGet(_moreMenu, this)?.getPopup()?.isShown() === true) {
					_classPrivateFieldGet(_moreMenu, this).close();
					return;
				}
				_classPrivateFieldGet(_moreMenu, this)?.destroy();
				_classPrivateFieldSet(_moreMenu, this, new ui_system_menu.Menu({
					id: _classPrivateFieldGet(_moreMenuId, this),
					className: MENU_CLASS_NAME,
					items: this.getHiddenItems().map(item => item.getMenuItemOptions()),
					events: {
						onShow: () => _assertClassBrand(_ActionPanel_brand, this, _setMoreExpanded).call(this, true),
						onClose: () => _assertClassBrand(_ActionPanel_brand, this, _setMoreExpanded).call(this, false)
					}
				}));
				_classPrivateFieldGet(_moreMenu, this).show(_assertClassBrand(_ActionPanel_brand, this, _getMoreButton).call(this));
				const popupContainer = _classPrivateFieldGet(_moreMenu, this).getPopup()?.getPopupContainer() ?? null;
				_assertClassBrand(_ActionPanel_brand, this, _applyDataset).call(this, popupContainer);
				if (popupContainer) {
					main_core.Dom.attr(popupContainer, 'data-testid', 'ui-action-panel-more-menu');
				}
			});
			_classPrivateFieldInitSpec(this, _applyPosition, metrics => {
				const top = _classPrivateFieldGet(_tracker, this).isFixed() ? 0 : metrics.top;
				const style = {};
				if (metrics.width !== _classPrivateFieldGet(_lastWidth, this)) {
					style.width = `${metrics.width}px`;
				}
				if (top !== _classPrivateFieldGet(_lastAppliedTop, this)) {
					style.top = `${top}px`;
					_classPrivateFieldSet(_lastAppliedTop, this, top);
				}
				if (metrics.left !== _classPrivateFieldGet(_lastAppliedLeft, this)) {
					style.left = `${metrics.left}px`;
					_classPrivateFieldSet(_lastAppliedLeft, this, metrics.left);
				}
				if (Object.keys(style).length > 0) {
					main_core.Dom.style(_classPrivateFieldGet(_container, this), style);
				}
				if (metrics.width !== _classPrivateFieldGet(_lastWidth, this)) {
					_classPrivateFieldSet(_lastWidth, this, metrics.width);
					_assertClassBrand(_ActionPanel_brand, this, _scheduleOverflowRefresh).call(this);
				}
			});
			_classPrivateFieldInitSpec(this, _applyFixedMode, fixed => {
				main_core.Dom[fixed ? 'addClass' : 'removeClass'](_classPrivateFieldGet(_container, this), '--fixed');
			});
			_classPrivateFieldSet(_renderTo, this, _options.renderTo);
			_classPrivateFieldSet(_maxHeight, this, main_core.Type.isNumber(_options.maxHeight) ? _options.maxHeight : null);
			_classPrivateFieldSet(_className, this, main_core.Type.isStringFilled(_options.className) ? _options.className : null);
			_classPrivateFieldSet(_ariaLabel, this, main_core.Type.isStringFilled(_options.ariaLabel) ? _options.ariaLabel : main_core.Loc.getMessage('JS_UI_ACTION_PANEL_ARIA_LABEL') ?? '');
			_classPrivateFieldSet(_showTotalSelected, this, _options.showTotalSelected !== false);
			_classPrivateFieldSet(_dataset, this, main_core.Type.isPlainObject(_options.dataset) ? _options.dataset : {});
			_classPrivateFieldSet(_onResetAll, this, main_core.Type.isFunction(_options.onResetAll) ? _options.onResetAll : null);
			_classPrivateFieldSet(_onGeometryChange, this, main_core.Type.isFunction(_options.onGeometryChange) ? _options.onGeometryChange : null);
			_classPrivateFieldSet(_airDesign, this, main_core.Extension.getSettings('ui.action-panel').get('useAirDesign') === true);
			_classPrivateFieldSet(_container, this, _assertClassBrand(_ActionPanel_brand, this, _renderContainer).call(this));
			_classPrivateFieldSet(_itemsContainer, this, main_core.Tag.render`
			<div class="ui-air-action-panel__items" data-testid="ui-action-panel-items"></div>
		`);
			if (_classPrivateFieldGet(_showTotalSelected, this)) {
				main_core.Dom.append(_assertClassBrand(_ActionPanel_brand, this, _renderTotalBlock).call(this), _classPrivateFieldGet(_container, this));
			}
			main_core.Dom.append(_classPrivateFieldGet(_itemsContainer, this), _classPrivateFieldGet(_container, this));
			if (_classPrivateFieldGet(_onResetAll, this) !== null) {
				_classPrivateFieldSet(_resetButton, this, _assertClassBrand(_ActionPanel_brand, this, _renderResetButton).call(this));
				main_core.Dom.append(_classPrivateFieldGet(_resetButton, this), _classPrivateFieldGet(_container, this));
			}
			_classPrivateFieldSet(_menuPopupDataset, this, new MenuPopupDataset(_classPrivateFieldGet(_dataset, this)));
			_classPrivateFieldSet(_overflow, this, new OverflowCalculator(_assertClassBrand(_ActionPanel_brand, this, _createOverflowHost).call(this)));
			_classPrivateFieldSet(_tracker, this, new PositionTracker({
				parent: _classPrivateFieldGet(_renderTo, this),
				maxHeight: _classPrivateFieldGet(_maxHeight, this),
				onApply: _classPrivateFieldGet(_applyPosition, this),
				onModeChange: _classPrivateFieldGet(_applyFixedMode, this),
				onGeometryChange: _classPrivateFieldGet(_onGeometryChange, this)
			}));
			instanceMap.set(_classPrivateFieldGet(_container, this), this);
			if (main_core.Type.isArrayFilled(_options.items)) {
				this.addItems(_options.items);
			}
		}
		return babelHelpers.createClass(ActionPanel, [{
			key: "hasAirDesign",
			value: function hasAirDesign() {
				return _classPrivateFieldGet(_airDesign, this);
			}
		}, {
			key: "getContainer",
			value: function getContainer() {
				return _classPrivateFieldGet(_container, this);
			}
		}, {
			key: "getItems",
			value: function getItems() {
				return _classPrivateFieldGet(_items, this);
			}
		}, {
			key: "getItemById",
			value: function getItemById(id) {
				return _classPrivateFieldGet(_items, this).find(item => item.getId() === id) ?? null;
			}
		}, {
			key: "getHiddenItems",
			value: function getHiddenItems() {
				return _classPrivateFieldGet(_overflow, this).getHiddenItems();
			}
		}, {
			key: "isShown",
			value: function isShown() {
				return _classPrivateFieldGet(_shown, this);
			}
		}, {
			key: "addItems",
			value: function addItems(items) {
				const created = items.map(options => _assertClassBrand(_ActionPanel_brand, this, _createItem).call(this, options));
				_assertClassBrand(_ActionPanel_brand, this, _afterItemsChanged).call(this);
				return created;
			}
		}, {
			key: "appendItem",
			value: function appendItem(options) {
				const item = _assertClassBrand(_ActionPanel_brand, this, _createItem).call(this, options);
				_assertClassBrand(_ActionPanel_brand, this, _afterItemsChanged).call(this);
				return item;
			}
		}, {
			key: "removeItems",
			value: function removeItems() {
				_classPrivateFieldGet(_items, this).forEach(item => item.closeMenu());
				_assertClassBrand(_ActionPanel_brand, this, _retainFocus).call(this, _classPrivateFieldGet(_items, this).map(item => item.getContainer()));
				_classPrivateFieldGet(_items, this).forEach(item => item.destroy());
				_classPrivateFieldSet(_items, this, []);
				_classPrivateFieldGet(_overflow, this).clear();
				_assertClassBrand(_ActionPanel_brand, this, _afterItemsChanged).call(this);
			}
		}, {
			key: "setTotalSelectedItems",
			value: function setTotalSelectedItems(count) {
				if (!_classPrivateFieldGet(_totalValueNode, this) || !main_core.Type.isNumber(count)) {
					return;
				}
				if (count === _classPrivateFieldGet(_totalSelected, this)) {
					return;
				}
				_classPrivateFieldSet(_totalSelected, this, count);
				_classPrivateFieldGet(_totalValueNode, this).textContent = String(count);
				ui_a11y.LiveAnnouncer.announce(`${main_core.Loc.getMessage('JS_UI_ACTION_PANEL_SELECTED') ?? ''} ${count}`.trim());
			}
		}, {
			key: "refreshOverflow",
			value: function refreshOverflow() {
				if (_classPrivateFieldGet(_destroyed, this)) {
					return;
				}
				_assertClassBrand(_ActionPanel_brand, this, _cancelScheduledOverflow).call(this);
				if (_classPrivateFieldGet(_shown, this)) {
					_classPrivateFieldGet(_tracker, this).start();
				}
				_classPrivateFieldGet(_items, this).forEach(item => item.setOverflowHidden(false));
				_classPrivateFieldGet(_itemsContainer, this).scrollLeft = 0;
				const hidden = _classPrivateFieldGet(_overflow, this).recalc();
				_assertClassBrand(_ActionPanel_brand, this, _retainFocus).call(this, hidden.map(item => item.getContainer()));
				const hiddenSet = new Set(hidden);
				_classPrivateFieldGet(_items, this).forEach(item => item.setOverflowHidden(hiddenSet.has(item)));
				_classPrivateFieldGet(_focusZone, this)?.refreshElements();
			}
		}, {
			key: "show",
			value: function show() {
				if (_classPrivateFieldGet(_destroyed, this) || _classPrivateFieldGet(_shown, this)) {
					return;
				}
				if (!_classPrivateFieldGet(_container, this).isConnected) {
					main_core.Dom.append(_classPrivateFieldGet(_container, this), document.body);
				}
				_classPrivateFieldSet(_focusOrigin, this, _assertClassBrand(_ActionPanel_brand, this, _resolveOuterActiveElement).call(this));
				_classPrivateFieldSet(_shown, this, true);
				_classPrivateFieldGet(_menuPopupDataset, this).start();
				main_core.Dom.addClass(_classPrivateFieldGet(_container, this), '--shown');
				if (!_classPrivateFieldGet(_tracker, this).start()) {
					console.error('UI.ActionPanel: renderTo resolves to no node, the panel stays unpositioned');
					_assertClassBrand(_ActionPanel_brand, this, _scheduleTrackerStart).call(this, TRACKER_START_ATTEMPTS);
				}
				_assertClassBrand(_ActionPanel_brand, this, _setupFocusZone).call(this);
				this.refreshOverflow();
			}
		}, {
			key: "hide",
			value: function hide() {
				if (!_classPrivateFieldGet(_shown, this)) {
					return;
				}
				_classPrivateFieldSet(_shown, this, false);
				_assertClassBrand(_ActionPanel_brand, this, _cancelScheduledOverflow).call(this);
				_assertClassBrand(_ActionPanel_brand, this, _cancelScheduledTrackerStart).call(this);
				_assertClassBrand(_ActionPanel_brand, this, _closeMenus).call(this);
				_classPrivateFieldGet(_menuPopupDataset, this).stop();
				_assertClassBrand(_ActionPanel_brand, this, _releaseFocus).call(this);
				main_core.Dom.removeClass(_classPrivateFieldGet(_container, this), '--shown');
				_classPrivateFieldGet(_tracker, this).stop();
				_classPrivateFieldGet(_focusZone, this)?.deactivate();
				_classPrivateFieldSet(_lastWidth, this, null);
				_classPrivateFieldSet(_lastAppliedTop, this, null);
				_classPrivateFieldSet(_lastAppliedLeft, this, null);
			}
		}, {
			key: "destroy",
			value: function destroy() {
				if (_classPrivateFieldGet(_destroyed, this)) {
					return;
				}
				_classPrivateFieldSet(_destroyed, this, true);
				_classPrivateFieldSet(_shown, this, false);
				_assertClassBrand(_ActionPanel_brand, this, _cancelScheduledOverflow).call(this);
				_assertClassBrand(_ActionPanel_brand, this, _cancelScheduledTrackerStart).call(this);
				_assertClassBrand(_ActionPanel_brand, this, _closeMenus).call(this);
				_classPrivateFieldGet(_menuPopupDataset, this).stop();
				_assertClassBrand(_ActionPanel_brand, this, _releaseFocus).call(this);
				_classPrivateFieldGet(_moreMenu, this)?.destroy();
				_classPrivateFieldSet(_moreMenu, this, null);
				_classPrivateFieldGet(_tracker, this).stop();
				_classPrivateFieldGet(_focusZone, this)?.deactivate();
				_classPrivateFieldSet(_focusZone, this, null);
				_classPrivateFieldGet(_items, this).forEach(item => item.destroy());
				_classPrivateFieldSet(_items, this, []);
				_classPrivateFieldGet(_overflow, this).clear();
				instanceMap.delete(_classPrivateFieldGet(_container, this));
				main_core.Dom.remove(_classPrivateFieldGet(_container, this));
			}
		}], [{
			key: "getInstanceByNode",
			value: function getInstanceByNode(node) {
				return instanceMap.get(node) ?? null;
			}
		}]);
	}();
	function _scheduleOverflowRefresh() {
		if (_classPrivateFieldGet(_destroyed, this) || _classPrivateFieldGet(_overflowFrameId, this) !== null) {
			return;
		}
		_classPrivateFieldSet(_overflowFrameId, this, requestAnimationFrame(() => {
			_classPrivateFieldSet(_overflowFrameId, this, null);
			this.refreshOverflow();
		}));
	}
	function _cancelScheduledOverflow() {
		if (_classPrivateFieldGet(_overflowFrameId, this) === null) {
			return;
		}
		cancelAnimationFrame(_classPrivateFieldGet(_overflowFrameId, this));
		_classPrivateFieldSet(_overflowFrameId, this, null);
	}
	function _scheduleTrackerStart(attemptsLeft) {
		if (_classPrivateFieldGet(_destroyed, this) || _classPrivateFieldGet(_trackerStartFrameId, this) !== null || attemptsLeft <= 0) {
			return;
		}
		_classPrivateFieldSet(_trackerStartFrameId, this, requestAnimationFrame(() => {
			_classPrivateFieldSet(_trackerStartFrameId, this, null);
			if (_classPrivateFieldGet(_destroyed, this) || !_classPrivateFieldGet(_shown, this)) {
				return;
			}
			if (_classPrivateFieldGet(_tracker, this).start()) {
				this.refreshOverflow();
				return;
			}
			_assertClassBrand(_ActionPanel_brand, this, _scheduleTrackerStart).call(this, attemptsLeft - 1);
		}));
	}
	function _cancelScheduledTrackerStart() {
		if (_classPrivateFieldGet(_trackerStartFrameId, this) === null) {
			return;
		}
		cancelAnimationFrame(_classPrivateFieldGet(_trackerStartFrameId, this));
		_classPrivateFieldSet(_trackerStartFrameId, this, null);
	}
	function _renderContainer() {
		const container = main_core.Tag.render`
			<div
				class="ui-air-action-panel --ui-context-content-light"
				role="toolbar"
				aria-orientation="horizontal"
				data-testid="ui-action-panel"
			></div>
		`;
		if (main_core.Type.isStringFilled(_classPrivateFieldGet(_ariaLabel, this))) {
			main_core.Dom.attr(container, 'aria-label', _classPrivateFieldGet(_ariaLabel, this));
		}
		if (_classPrivateFieldGet(_className, this) !== null) {
			main_core.Dom.addClass(container, _classPrivateFieldGet(_className, this));
		}
		if (this.hasAirDesign()) {
			main_core.Dom.addClass(container, '--air');
		}
		if (_classPrivateFieldGet(_maxHeight, this) !== null) {
			main_core.Dom.style(container, 'max-height', `${_classPrivateFieldGet(_maxHeight, this)}px`);
		}
		_assertClassBrand(_ActionPanel_brand, this, _applyDataset).call(this, container);
		return container;
	}
	function _applyDataset(node) {
		applyDataset(node, _classPrivateFieldGet(_dataset, this));
	}
	function _renderResetButton() {
		const button = main_core.Tag.render`
			<button type="button" class="ui-air-action-panel__reset" data-testid="ui-action-panel-reset-btn"></button>
		`;
		main_core.Dom.attr(button, 'aria-label', main_core.Loc.getMessage('JS_UI_ACTION_PANEL_RESET') ?? '');
		new ui_iconSet_api_core.Icon({
			icon: ui_iconSet_api_core.Outline.CROSS_M
		}).renderTo(button);
		main_core.Event.bind(button, 'click', () => _classPrivateFieldGet(_onResetAll, this)?.call(this));
		return button;
	}
	function _renderTotalBlock() {
		const label = main_core.Tag.render`<span class="ui-air-action-panel__total-label"></span>`;
		label.textContent = main_core.Loc.getMessage('JS_UI_ACTION_PANEL_SELECTED') ?? '';
		_classPrivateFieldSet(_totalValueNode, this, main_core.Tag.render`
			<span
				class="ui-air-action-panel__total-value"
				data-role="action-panel-total-param"
				data-testid="ui-action-panel-total-value"
			></span>
		`);
		return main_core.Tag.render`
			<div class="ui-air-action-panel__total" data-role="action-panel-total" data-testid="ui-action-panel-total">
				${label}
				${_classPrivateFieldGet(_totalValueNode, this)}
			</div>
		`;
	}
	function _createItem(options) {
		const item = new ActionPanelItem({
			...options,
			useAirDesign: this.hasAirDesign(),
			popupDataset: _classPrivateFieldGet(_dataset, this)
		});
		_classPrivateFieldGet(_items, this).push(item);
		main_core.Dom.append(item.getContainer(), _classPrivateFieldGet(_itemsContainer, this));
		return item;
	}
	function _afterItemsChanged() {
		_classPrivateFieldGet(_focusZone, this)?.refreshElements();
		if (_classPrivateFieldGet(_shown, this)) {
			_assertClassBrand(_ActionPanel_brand, this, _scheduleOverflowRefresh).call(this);
		}
		if (ui_a11y.FocusNavigator.getActiveElement(_classPrivateFieldGet(_container, this)) === _classPrivateFieldGet(_container, this)) {
			ui_a11y.FocusNavigator.focusFirst(_classPrivateFieldGet(_container, this), {
				tabbableOnly: false,
				preventScroll: true
			});
		}
	}
	function _createOverflowHost() {
		return {
			getItems: () => _classPrivateFieldGet(_items, this),
			beforeCollect: countsMoreBlock => {
				_classPrivateFieldSet(_rowRight, this, _assertClassBrand(_ActionPanel_brand, this, _measureRowRight).call(this, countsMoreBlock));
			},
			isNotFit: item => _assertClassBrand(_ActionPanel_brand, this, _isNotFit).call(this, item),
			hasMoreBlock: () => _classPrivateFieldGet(_moreButton, this) !== null,
			addMoreBlock: () => {
				if (_classPrivateFieldGet(_resetButton, this)) {
					main_core.Dom.insertBefore(_assertClassBrand(_ActionPanel_brand, this, _getMoreButton).call(this), _classPrivateFieldGet(_resetButton, this));
				} else {
					main_core.Dom.append(_assertClassBrand(_ActionPanel_brand, this, _getMoreButton).call(this), _classPrivateFieldGet(_container, this));
				}
			},
			removeMoreBlock: () => {
				_classPrivateFieldGet(_moreMenu, this)?.destroy();
				_classPrivateFieldSet(_moreMenu, this, null);
				if (_classPrivateFieldGet(_moreButton, this)) {
					_assertClassBrand(_ActionPanel_brand, this, _retainFocus).call(this, [_classPrivateFieldGet(_moreButton, this)]);
				}
				main_core.Dom.remove(_classPrivateFieldGet(_moreButton, this));
				_classPrivateFieldSet(_moreButton, this, null);
			}
		};
	}
	function _isNotFit(item) {
		const rect = item.getContainer().getBoundingClientRect();
		if (rect.width <= 0) {
			return false;
		}
		const rowRight = _classPrivateFieldGet(_rowRight, this) ?? _classPrivateFieldGet(_itemsContainer, this).getBoundingClientRect().right;
		return rect.right > rowRight + FIT_TOLERANCE;
	}
	function _measureRowRight(countsMoreBlock) {
		const rowRight = _classPrivateFieldGet(_itemsContainer, this).getBoundingClientRect().right;
		if (countsMoreBlock || _classPrivateFieldGet(_moreButton, this) === null) {
			return rowRight;
		}
		return rowRight + _classPrivateFieldGet(_moreButton, this).getBoundingClientRect().width;
	}
	function _getMoreButton() {
		if (!_classPrivateFieldGet(_moreButton, this)) {
			const button = main_core.Tag.render`
				<button
					type="button"
					class="ui-air-action-panel__more"
					aria-haspopup="menu"
					aria-expanded="false"
					data-testid="ui-action-panel-more-btn"
				></button>
			`;
			button.textContent = main_core.Loc.getMessage('JS_UI_ACTION_PANEL_MORE') ?? '';
			main_core.Event.bind(button, 'click', _classPrivateFieldGet(_handleMoreClick, this));
			_classPrivateFieldSet(_moreButton, this, button);
		}
		return _classPrivateFieldGet(_moreButton, this);
	}
	function _setMoreExpanded(expanded) {
		if (_classPrivateFieldGet(_moreButton, this)) {
			main_core.Dom.attr(_classPrivateFieldGet(_moreButton, this), 'aria-expanded', expanded ? 'true' : 'false');
		}
	}
	function _closeMenus() {
		_classPrivateFieldGet(_moreMenu, this)?.close();
		_classPrivateFieldGet(_items, this).forEach(item => item.closeMenu());
	}
	function _retainFocus(leaving) {
		const active = ui_a11y.FocusNavigator.getActiveElement(_classPrivateFieldGet(_container, this));
		if (active === null || !_classPrivateFieldGet(_container, this).contains(active)) {
			return;
		}
		const isLeaving = node => leaving.some(el => el === node || el.contains(node));
		if (!isLeaving(active)) {
			return;
		}
		const options = {
			from: active,
			tabbableOnly: false,
			preventScroll: true,
			accept: el => el === active || !isLeaving(el)
		};
		const target = ui_a11y.FocusNavigator.getNext(_classPrivateFieldGet(_container, this), options) ?? ui_a11y.FocusNavigator.getPrevious(_classPrivateFieldGet(_container, this), options);
		if (target === null) {
			ui_a11y.FocusNavigator.focusContainer(_classPrivateFieldGet(_container, this), options);
			return;
		}
		ui_a11y.FocusNavigator.focusTarget(target, options);
	}
	function _releaseFocus() {
		const active = ui_a11y.FocusNavigator.getActiveElement(_classPrivateFieldGet(_container, this));
		if (active === null || !_classPrivateFieldGet(_container, this).contains(active)) {
			return;
		}
		if (_classPrivateFieldGet(_focusOrigin, this) !== null && ui_a11y.InteractivityChecker.isFocusable(_classPrivateFieldGet(_focusOrigin, this))) {
			ui_a11y.FocusNavigator.focusTarget(_classPrivateFieldGet(_focusOrigin, this), {
				preventScroll: true
			});
			return;
		}
		active.blur();
	}
	function _resolveOuterActiveElement() {
		if (ui_a11y.FocusNavigator.isFocusLost(_classPrivateFieldGet(_container, this))) {
			return null;
		}
		const active = ui_a11y.FocusNavigator.getActiveElement(_classPrivateFieldGet(_container, this));
		return active !== null && !_classPrivateFieldGet(_container, this).contains(active) ? active : null;
	}
	function _setupFocusZone() {
		if (!_classPrivateFieldGet(_focusZone, this)) {
			_classPrivateFieldSet(_focusZone, this, new ui_a11y.FocusZone(_classPrivateFieldGet(_container, this), {
				bindKeys: ui_a11y.FocusKeys.ArrowHorizontal | ui_a11y.FocusKeys.HomeAndEnd,
				focusOutBehavior: 'stop',
				focusInStrategy: 'previous'
			}));
		}
		_classPrivateFieldGet(_focusZone, this).activate();
	}

	exports.ActionPanel = ActionPanel;
	exports.ActionPanelItem = ActionPanelItem;
	exports.AirActionPanel = ActionPanel;
	exports.OverflowCalculator = OverflowCalculator;
	exports.PositionTracker = PositionTracker;

})(this.BX.UI = this.BX.UI || {}, BX, BX.UI.Accessibility, BX.UI.IconSet, BX.UI.System, BX.UI, window, BX.Event);
//# sourceMappingURL=action-panel.bundle.js.map
