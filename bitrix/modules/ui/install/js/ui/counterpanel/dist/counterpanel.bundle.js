/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_actionsBar, ui_designTokens, ui_designTokens_air, main_core, main_core_events, ui_cnt, ui_a11y, ui_system_menu) {
	'use strict';

	function _classPrivateMethodInitSpec$1(e, a) { _checkPrivateRedeclaration$1(e, a), a.add(e); }
	function _classPrivateFieldInitSpec$1(e, t, a) { _checkPrivateRedeclaration$1(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$1(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet$1(s, a) { return s.get(_assertClassBrand$1(s, a)); }
	function _classPrivateFieldSet$1(s, a, r) { return s.set(_assertClassBrand$1(s, a), r), r; }
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
			_classPrivateFieldSet$1(_collapsedIcon, this, args.collapsedIcon ?? null);
			_classPrivateFieldSet$1(_collapsed, this, args.collapsed === true);
			_classPrivateFieldSet$1(_dataAttributes, this, main_core.Type.isPlainObject(args.dataAttributes) ? args.dataAttributes : {});
			_classPrivateFieldSet$1(_useAirDesign, this, args.useAirDesign === true);
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
					_assertClassBrand$1(_CounterItem_brand, this, _refreshAccessibleName).call(this);
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
					_assertClassBrand$1(_CounterItem_brand, this, _refreshAccessibleName).call(this);
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
					_assertClassBrand$1(_CounterItem_brand, this, _refreshPressedState).call(this);
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
					_assertClassBrand$1(_CounterItem_brand, this, _refreshPressedState).call(this);
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
				const target = container ?? this.getContainer();
				if (this.eventsForActive) {
					const eventKeys = Object.keys(this.eventsForActive);
					for (const event of eventKeys) {
						main_core.Event.bind(target, event, () => {
							if (this.isActive) {
								this.eventsForActive[event]();
							}
						});
					}
				}
				if (this.eventsForUnActive) {
					const eventKeys = Object.keys(this.eventsForUnActive);
					for (const event of eventKeys) {
						main_core.Event.bind(target, event, () => {
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
				_assertClassBrand$1(_CounterItem_brand, this, _refreshDisabledState).call(this);
				_assertClassBrand$1(_CounterItem_brand, this, _refreshAccessibleName).call(this);
			}
		}, {
			key: "unLock",
			value: function unLock() {
				this.locked = false;
				main_core.Dom.removeClass(this.getContainer(), '--locked');
				_assertClassBrand$1(_CounterItem_brand, this, _refreshDisabledState).call(this);
				_assertClassBrand$1(_CounterItem_brand, this, _refreshAccessibleName).call(this);
			}

			// Air renders an interactive item as a native button, so unavailability is exposed via the disabled
			// state. The panel's FocusZone observes the attribute and rebuilds the roving set on its own; the
			// panel itself is told about the transition by the event, as only it may move real focus.
		}, {
			key: "isInteractive",
			value:
			// Only an item that reacts to a click deserves the button role: a filter with a counter, a menu
			// trigger or an item with consumer events. The rest are plain labels inside the toolbar.
			function isInteractive() {
				return this.parent === true || main_core.Type.isNumber(this.value) || Object.keys(this.eventsForActive).length > 0 || Object.keys(this.eventsForUnActive).length > 0;
			}

			// Mirrors the --active class, but only on truly toggleable filters. The gate matches the toggle-click
			// binding (numeric value, no children, not a parent) so non-interactive titles stay unpressed. A parent
			// item is a menu trigger: its state is aria-expanded, not aria-pressed.
		}, {
			key: "getArrowDropdown",
			value: function getArrowDropdown() {
				if (!this.layout.dropdownArrow) {
					this.layout.dropdownArrow = _classPrivateFieldGet$1(_useAirDesign, this) ? main_core.Tag.render`<span class="ui-counter-panel__item-dropdown" aria-hidden="true"><i></i></span>` : main_core.Tag.render`
					<div class="ui-counter-panel__item-dropdown">
						<i></i>
					</div>
				`;
				}
				return this.layout.dropdownArrow;
			}

			// A non-interactive item stays a plain span: a native button without an action is announced as a
			// button, joins the roving set and adds an empty step to the arrow navigation.
		}, {
			key: "getContainer",
			value: function getContainer() {
				if (!this.layout.container) {
					const isValue = main_core.Type.isNumber(this.value);
					this.layout.container = _assertClassBrand$1(_CounterItem_brand, this, _buildContainerNode).call(this, isValue);
					_assertClassBrand$1(_CounterItem_brand, this, _applyContainerState).call(this, isValue);
					_assertClassBrand$1(_CounterItem_brand, this, _bindContainerEvents).call(this, isValue);
				}
				return this.layout.container;
			}
		}, {
			key: "setDataAttributes",
			value: function setDataAttributes(attributes) {
				_classPrivateFieldSet$1(_dataAttributes, this, main_core.Type.isPlainObject(attributes) || {});
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
			const counterValue = this.isRestricted ? _assertClassBrand$1(_CounterItem_brand, this, _getLockIcon).call(this) : _assertClassBrand$1(_CounterItem_brand, this, _getCounter).call(this).getContainer();
			this.layout.value = _classPrivateFieldGet$1(_useAirDesign, this) ? main_core.Tag.render`<span class="ui-counter-panel__item-value">${counterValue}</span>` : main_core.Tag.render`
					<div class="ui-counter-panel__item-value">
						${counterValue}
					</div>
				`;
			main_core.Dom.style(this.layout.value, 'order', this.valueOrder);
		}
		return this.layout.value;
	}
	// The lock replaces the counter value, so it carries meaning and needs a text alternative
	function _getLockIcon() {
		if (!_classPrivateFieldGet$1(_useAirDesign, this)) {
			return main_core.Tag.render`<div class="ui-counter-panel__item-lock"></div>`;
		}
		const label = main_core.Loc.getMessage('UI_COUNTER_PANEL_ITEM_RESTRICTED');
		return main_core.Tag.render`<span class="ui-counter-panel__item-lock" role="img" aria-label="${label}"></span>`;
	}
	function _getTitle() {
		if (!this.layout.title) {
			this.layout.title = _classPrivateFieldGet$1(_useAirDesign, this) ? main_core.Tag.render`<span class="ui-counter-panel__item-title">${this.title}</span>` : main_core.Tag.render`
					<div class="ui-counter-panel__item-title">${this.title}</div>
				`;
			main_core.Dom.style(this.layout.title, 'order', this.titleOrder);
		}
		return this.layout.title;
	}
	function _getCollapsedIcon() {
		const className = `ui-counter-panel__item-collapsed-icon ui-icon-set__scope --icon-${_classPrivateFieldGet$1(_collapsedIcon, this)}`;
		return _classPrivateFieldGet$1(_useAirDesign, this) ? main_core.Tag.render`<span class="${className}" aria-hidden="true"></span>` : main_core.Tag.render`<div class="${className}"></div>`;
	}
	function _getCross() {
		if (!this.layout.cross) {
			this.layout.cross = _classPrivateFieldGet$1(_useAirDesign, this) ? main_core.Tag.render`<span class="ui-counter-panel__item-cross" aria-hidden="true"><i></i></span>` : main_core.Tag.render`
					<div class="ui-counter-panel__item-cross">
						<i></i>
					</div>
				`;
		}
		return this.layout.cross;
	}
	function _refreshDisabledState() {
		if (!_classPrivateFieldGet$1(_useAirDesign, this) || !this.isInteractive()) {
			return;
		}
		const button = this.getContainer();
		const isDisabled = this.locked || this.isRestricted;
		if (button.disabled === isDisabled) {
			return;
		}

		// Read the focus holder BEFORE the flag: afterwards Chrome has already dropped focus to <body>,
		// while Firefox keeps document.activeElement on the unusable button and fires no focusout.
		const hadFocus = document.activeElement === button;
		button.disabled = isDisabled;
		if (isDisabled) {
			main_core_events.EventEmitter.emit('BX.UI.CounterPanel.Item:disable', {
				item: this,
				hadFocus
			});
		}
	}
	function _refreshPressedState() {
		if (_assertClassBrand$1(_CounterItem_brand, this, _isToggleFilter).call(this)) {
			main_core.Dom.attr(this.getContainer(), 'aria-pressed', this.isActive ? 'true' : 'false');
		}
	}
	function _isToggleFilter() {
		return _classPrivateFieldGet$1(_useAirDesign, this) && !this.parentId && !this.parent && main_core.Type.isNumber(this.value) && this.items.length === 0;
	}
	// The button name is composed as "title, value" so a screen reader reads the label before the count,
	// regardless of the DOM order of the badge and title nodes. An explicit aria-label overrides the child
	// nodes, so it must carry both the number and, when unavailable, the lock phrase itself.
	function _refreshAccessibleName() {
		if (!_classPrivateFieldGet$1(_useAirDesign, this) || this.parent || !this.layout.container || !this.isInteractive()) {
			return;
		}
		main_core.Dom.attr(this.layout.container, 'aria-label', _assertClassBrand$1(_CounterItem_brand, this, _composeAccessibleName).call(this));
	}
	function _composeAccessibleName() {
		const parts = [];
		if (this.title) {
			parts.push(String(this.title));
		}
		const valueLabel = _assertClassBrand$1(_CounterItem_brand, this, _getAccessibleValueLabel).call(this);
		if (valueLabel) {
			parts.push(valueLabel);
		}
		return parts.join(', ');
	}
	function _getAccessibleValueLabel() {
		if (!main_core.Type.isNumber(this.value) || this.hideValue) {
			return null;
		}
		if (this.locked || this.isRestricted) {
			return main_core.Loc.getMessage('UI_COUNTER_PANEL_ITEM_RESTRICTED');
		}
		return String(this.value);
	}
	function _renderAirContainer(className, isValue) {
		const content = [_classPrivateFieldGet$1(_collapsedIcon, this) ? _assertClassBrand$1(_CounterItem_brand, this, _getCollapsedIcon).call(this) : '', isValue && !this.hideValue ? _assertClassBrand$1(_CounterItem_brand, this, _getValue).call(this) : '', this.title ? _assertClassBrand$1(_CounterItem_brand, this, _getTitle).call(this) : '', isValue ? _assertClassBrand$1(_CounterItem_brand, this, _getCross).call(this) : ''];
		return this.isInteractive() ? main_core.Tag.render`<button type="button" class="${className}">${content}</button>` : main_core.Tag.render`<span class="${className}">${content}</span>`;
	}
	function _buildContainerNode(isValue) {
		const type = this.type ? `id="ui-counter-panel-item-${this.type}"` : '';
		const className = `ui-counter-panel__item ${_assertClassBrand$1(_CounterItem_brand, this, _getItemClassModifierByValue).call(this, this.value)}`;
		let container = _classPrivateFieldGet$1(_useAirDesign, this) ? _assertClassBrand$1(_CounterItem_brand, this, _renderAirContainer).call(this, className, isValue) : main_core.Tag.render`
				<div ${type} class="${className}">
					${_classPrivateFieldGet$1(_collapsedIcon, this) ? _assertClassBrand$1(_CounterItem_brand, this, _getCollapsedIcon).call(this) : ''}
					${isValue && !this.hideValue ? _assertClassBrand$1(_CounterItem_brand, this, _getValue).call(this) : ''}
					${this.title ? _assertClassBrand$1(_CounterItem_brand, this, _getTitle).call(this) : ''}
					${isValue ? _assertClassBrand$1(_CounterItem_brand, this, _getCross).call(this) : ''}
				</div>
			`;

		// Air replaces the non-unique id: several panels may render the same item type on a page
		if (_classPrivateFieldGet$1(_useAirDesign, this) && this.type) {
			main_core.Dom.attr(container, 'data-type', this.type);
		}
		if (this.parent) {
			container = _classPrivateFieldGet$1(_useAirDesign, this) ? main_core.Tag.render`
					<button type="button" class="ui-counter-panel__item">
						${this.title ? _assertClassBrand$1(_CounterItem_brand, this, _getTitle).call(this) : ''}
						${isValue ? _assertClassBrand$1(_CounterItem_brand, this, _getValue).call(this) : ''}
						${_assertClassBrand$1(_CounterItem_brand, this, _getCross).call(this)}
					</button>
				` : main_core.Tag.render`
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
			main_core.Dom.addClass(container, '--dropdown');
		}
		return container;
	}
	function _applyContainerState(isValue) {
		const container = this.layout.container;
		if (!isValue) {
			main_core.Dom.addClass(container, '--string');
		}
		if (!isValue && !this.eventsForActive && !this.eventsForUnActive) {
			main_core.Dom.addClass(container, '--title');
		}
		if (!this.separator) {
			main_core.Dom.addClass(container, '--without-separator');
		}
		if (this.locked) {
			main_core.Dom.addClass(container, '--locked');
		}
		if (this.isActive) {
			this.activate();
		}
		if (this.isRestricted) {
			main_core.Dom.addClass(container, '--restricted');
		}
		if (_classPrivateFieldGet$1(_collapsed, this)) {
			this.collapse();
		}
		if (this.locked) {
			this.lock();
		}
		_assertClassBrand$1(_CounterItem_brand, this, _refreshDisabledState).call(this);
		_assertClassBrand$1(_CounterItem_brand, this, _refreshPressedState).call(this);
		_assertClassBrand$1(_CounterItem_brand, this, _refreshAccessibleName).call(this);
		this.setEvents(container);
		_assertClassBrand$1(_CounterItem_brand, this, _setElementDataAttributes).call(this, container);
	}
	function _bindContainerEvents(isValue) {
		const container = this.layout.container;
		main_core.Event.bind(container, 'click', () => {
			main_core_events.EventEmitter.emit('BX.UI.CounterPanel.Item:click', {
				item: this
			});
		});
		if (isValue && this.items.length === 0 && !this.parent) {
			main_core.Event.bind(container, 'mouseenter', () => {
				if (!this.isActive) {
					main_core.Dom.addClass(container, '--hover');
				}
			});
			main_core.Event.bind(container, 'mouseleave', () => {
				if (!this.isActive) {
					main_core.Dom.removeClass(container, '--hover');
				}
			});
			main_core.Event.bind(container, 'click', () => {
				if (this.isActive) {
					this.deactivate();
				} else {
					this.activate();
				}
			});
		}
		if (this.parent) {
			main_core.Dom.append(this.getArrowDropdown(), container);
		}
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

	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
	function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	const instanceMap = new WeakMap();
	var _focusZone = /*#__PURE__*/new WeakMap();
	var _focusIntentKey = /*#__PURE__*/new WeakMap();
	var _suppressFocusIntent = /*#__PURE__*/new WeakMap();
	var _CounterPanel_brand = /*#__PURE__*/new WeakSet();
	var _onChildActivityChange = /*#__PURE__*/new WeakMap();
	var _onFocusIn = /*#__PURE__*/new WeakMap();
	var _onChildDisable = /*#__PURE__*/new WeakMap();
	let CounterPanel = /*#__PURE__*/function () {
		function CounterPanel(options) {
			babelHelpers.classCallCheck(this, CounterPanel);
			_classPrivateMethodInitSpec(this, _CounterPanel_brand);
			_classPrivateFieldInitSpec(this, _focusZone, null);
			// The user's intended entry point: a stable item id (or '__more__'), so it survives the
			// frequent full DOM rebuilds that leave FocusZone with dead element references.
			_classPrivateFieldInitSpec(this, _focusIntentKey, null);
			_classPrivateFieldInitSpec(this, _suppressFocusIntent, false);
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
			_classPrivateFieldInitSpec(this, _onFocusIn, event => {
				const button = event.target?.closest?.(_rovingButtonSelector._);
				if (!button) {
					return;
				}
				if (!_classPrivateFieldGet(_suppressFocusIntent, this)) {
					_classPrivateFieldSet(_focusIntentKey, this, _assertClassBrand(_CounterPanel_brand, this, _rovingKeyOf).call(this, button));
				}
			});
			// Locking an item disables its button, and the browsers disagree on what happens to the focus:
			// Chrome drops it to <body>, Firefox leaves it on the unusable button. FocusZone rebuilds the
			// roving set on the same change but never moves real focus, so the keyboard user is handed to
			// the neighbouring button here. The item reports who held the focus before the disable, which is
			// the only moment when the answer is the same in both browsers.
			_classPrivateFieldInitSpec(this, _onChildDisable, event => {
				const {
					item,
					hadFocus
				} = event.data;
				if (hadFocus !== true || item?.panel !== this) {
					return;
				}
				const target = _assertClassBrand(_CounterPanel_brand, this, _nextRovingButton).call(this, item.getContainer()) ?? this.container;
				if (target === this.container) {
					// The container is not in the Tab order; -1 only makes it programmatically focusable.
					main_core.Dom.attr(this.container, 'tabindex', '-1');
				}
				target?.focus();
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
				main_core_events.EventEmitter.subscribe('BX.UI.CounterPanel.Item:disable', _classPrivateFieldGet(_onChildDisable, this));
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
				main_core.Dom.attr(this.container, 'role', 'toolbar');
				const accessibleName = _assertClassBrand(_CounterPanel_brand, this, _getAccessibleName).call(this);
				if (accessibleName) {
					main_core.Dom.attr(this.container, 'aria-label', accessibleName);
				}
				main_core.Event.bind(this.container, 'focusin', _classPrivateFieldGet(_onFocusIn, this));

				// FocusZone owns the roving tabindex: arrow/Home/End navigation and, through its
				// mutation observer, resynchronisation of the set on lock/unlock and on rebuilds.
				_classPrivateFieldSet(_focusZone, this, new ui_a11y.FocusZone(this.container, {
					bindKeys: ui_a11y.FocusKeys.ArrowHorizontal | ui_a11y.FocusKeys.HomeAndEnd,
					focusOutBehavior: 'stop',
					focusInStrategy: 'previous'
				}));
				_classPrivateFieldGet(_focusZone, this).activate();
			}
		}
		return this.container;
	}
	function _getAccessibleName() {
		return this.title ?? null;
	}
	function _initMenuTrigger(trigger) {
		if (!this.hasAirDesign()) {
			return;
		}
		main_core.Dom.attr(trigger, 'aria-haspopup', 'menu');
		_assertClassBrand(_CounterPanel_brand, this, _setExpanded).call(this, trigger, false);
	}
	function _setExpanded(trigger, isExpanded) {
		if (this.hasAirDesign()) {
			main_core.Dom.attr(trigger, 'aria-expanded', isExpanded ? 'true' : 'false');
		}
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
			_assertClassBrand(_CounterPanel_brand, this, _tagRovingKey).call(this, item.getContainer(), item.getId());
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
			const moreButton = _assertClassBrand(_CounterPanel_brand, this, _getMoreButton).call(this);
			main_core.Dom.append(moreButton, _assertClassBrand(_CounterPanel_brand, this, _getContainer).call(this));
			_assertClassBrand(_CounterPanel_brand, this, _tagRovingKey).call(this, moreButton, _rovingMoreKey._);
			_assertClassBrand(_CounterPanel_brand, this, _refreshMoreHighlight).call(this);
		}
	}
	function _tagRovingKey(button, key) {
		// Skip empty keys: a blank data-roving-key would collide across id-less items and mislead
		// focus restore (#findRovingButton). Without a key such a button falls back cleanly.
		if (this.hasAirDesign() && main_core.Type.isStringFilled(key)) {
			main_core.Dom.attr(button, 'data-roving-key', key);
		}
	}
	function _bindParentDropdown(item) {
		if (this.boundParents.has(item)) {
			return;
		}
		this.boundParents.add(item);
		_assertClassBrand(_CounterPanel_brand, this, _initMenuTrigger).call(this, item.getContainer());
		main_core.Event.bind(item.getContainer(), 'click', () => {
			if (_assertClassBrand(_CounterPanel_brand, this, _toggleActiveMenu).call(this, item.getContainer())) {
				return;
			}
			const childItems = item.getItems().map(childId => this.getItemById(childId)).filter(Boolean);
			_assertClassBrand(_CounterPanel_brand, this, _showItemsPopup).call(this, childItems, item.getContainer(), item.getContainer(), {
				onShow: () => {
					main_core.Dom.addClass(item.getContainer(), '--hover');
					main_core.Dom.addClass(item.getContainer(), '--pointer-events-none');
					_assertClassBrand(_CounterPanel_brand, this, _setExpanded).call(this, item.getContainer(), true);
				},
				onClose: () => {
					main_core.Dom.removeClass(item.getContainer(), '--hover');
					main_core.Dom.removeClass(item.getContainer(), '--pointer-events-none');
					_assertClassBrand(_CounterPanel_brand, this, _setExpanded).call(this, item.getContainer(), false);
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
		const isDisabled = item.isLocked() || item.isRestricted;
		const isSelectable = item.isInteractive() && !isDisabled;

		// Unavailable and non-interactive entries are non-clickable disabled items: the panel and its
		// collapsed menu share one interactivity model.
		return {
			id: item.getId() ?? undefined,
			title: main_core.Type.isString(item.title) ? item.title : '',
			design: isSelectable ? undefined : ui_system_menu.MenuItemDesign.Disabled,
			isLocked: item.isRestricted,
			isSelected: isSelectable ? item.isActive : undefined,
			counter: _assertClassBrand(_CounterPanel_brand, this, _getMenuItemCounterOptions).call(this, item),
			icon: item.getCollapsedIcon() ?? undefined,
			sectionCode: item.hasCollapsedIcon() ? _collapsedIconSection._ : undefined,
			onClick: isSelectable ? () => {
				main_core_events.EventEmitter.emit('BX.UI.CounterPanel.Item:click', {
					item
				});
				if (item.isActive) {
					item.deactivate();
				} else {
					item.activate();
				}
			} : undefined
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
			// Attach before filling: FocusZone only manages elements that are already in the
			// document, so the buttons must be connected by the time they are rendered.
			main_core.Dom.clean(this.target);
			main_core.Dom.append(_assertClassBrand(_CounterPanel_brand, this, _getContainer).call(this), this.target);
			_assertClassBrand(_CounterPanel_brand, this, _rerender).call(this);
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
		// Capture focus BEFORE Dom.clean wipes the buttons - a rebuild triggered by updateValue()
		// or ui.actions-bar must not steal focus from a user working elsewhere on the page.
		const hadFocusInside = _assertClassBrand(_CounterPanel_brand, this, _hasFocusInside).call(this) || _assertClassBrand(_CounterPanel_brand, this, _captureMenuFocusIntent).call(this);
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

		// The observer inside FocusZone is debounced by a frame, and a rebuild must leave the
		// toolbar with a valid entry point right away.
		_classPrivateFieldGet(_focusZone, this)?.refreshElements();
		_assertClassBrand(_CounterPanel_brand, this, _restoreFocusIntent).call(this, hadFocusInside);
	}
	function _hasFocusInside() {
		if (!this.hasAirDesign() || !this.container) {
			return false;
		}
		const active = document.activeElement;
		return Boolean(active) && active !== this.container && this.container.contains(active);
	}
	function _hasFocusInMenu() {
		if (!this.hasAirDesign() || !this.activeMenu) {
			return false;
		}
		const popupContainer = this.activeMenu?.getPopupContainer?.();
		const active = document.activeElement;
		return Boolean(popupContainer) && Boolean(active) && popupContainer.contains(active);
	}
	// Focus inside an open menu (a popup in <body>) - the imminent close() would drop it to <body>;
	// remember the trigger's key so the rebuild returns focus to the initiator or the nearest button.
	function _captureMenuFocusIntent() {
		if (!this.hasAirDesign() || !_assertClassBrand(_CounterPanel_brand, this, _hasFocusInMenu).call(this)) {
			return false;
		}
		if (this.activeClickElement) {
			const key = _assertClassBrand(_CounterPanel_brand, this, _rovingKeyOf).call(this, this.activeClickElement);
			if (key !== null) {
				_classPrivateFieldSet(_focusIntentKey, this, key);
			}
		}
		return true;
	}
	// A rebuild replaces every node, so FocusZone can only fall back to the first button. Only if
	// focus was inside before the rebuild, move it back to the intended element (by key, not index).
	function _restoreFocusIntent(hadFocusInside) {
		if (!hadFocusInside) {
			return;
		}
		const buttons = _assertClassBrand(_CounterPanel_brand, this, _getRovingButtons).call(this);
		const target = _assertClassBrand(_CounterPanel_brand, this, _findRovingButton).call(this, _classPrivateFieldGet(_focusIntentKey, this), buttons) ?? _assertClassBrand(_CounterPanel_brand, this, _fallbackRovingButton).call(this, buttons);
		if (target) {
			// Programmatic restore preserves the user's intended key, so after an
			// expand/collapse/expand burst focus returns to the original item.
			_classPrivateFieldSet(_suppressFocusIntent, this, true);
			target.focus();
			_classPrivateFieldSet(_suppressFocusIntent, this, false);
		}
	}
	function _getRovingButtons() {
		if (!this.hasAirDesign() || !this.container) {
			return [];
		}
		return [...this.container.querySelectorAll(_rovingButtonSelector._)].filter(button => !button.disabled);
	}
	function _rovingKeyOf(button) {
		return button.getAttribute('data-roving-key');
	}
	function _findRovingButton(key, buttons = _assertClassBrand(_CounterPanel_brand, this, _getRovingButtons).call(this)) {
		if (key === null) {
			return null;
		}
		return buttons.find(button => _assertClassBrand(_CounterPanel_brand, this, _rovingKeyOf).call(this, button) === key) ?? null;
	}
	function _fallbackRovingButton(buttons = _assertClassBrand(_CounterPanel_brand, this, _getRovingButtons).call(this)) {
		return buttons.find(button => _assertClassBrand(_CounterPanel_brand, this, _rovingKeyOf).call(this, button) === _rovingMoreKey._) ?? buttons[0] ?? null;
	}
	function _nextRovingButton(fromButton) {
		const buttons = _assertClassBrand(_CounterPanel_brand, this, _getRovingButtons).call(this);
		if (buttons.length === 0) {
			return null;
		}
		const following = buttons.find(button => (fromButton.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0);
		return following ?? buttons[buttons.length - 1];
	}
	function _getMoreButton() {
		if (!this.moreButton) {
			const hiddenItems = _assertClassBrand(_CounterPanel_brand, this, _getHiddenRootItems).call(this);
			const totalValue = _assertClassBrand(_CounterPanel_brand, this, _getTotalValue).call(this, hiddenItems);
			const counterContainer = totalValue > 0 ? _assertClassBrand(_CounterPanel_brand, this, _getMoreCounterContainer).call(this, hiddenItems) : '';
			this.moreButton = this.hasAirDesign() ? main_core.Tag.render`
					<button type="button" class="ui-counter-panel__item ui-counter-panel__item--more-trigger">
						<span class="ui-counter-panel__visually-hidden">${main_core.Loc.getMessage('UI_COUNTER_PANEL_MORE_BUTTON')}</span>
						${counterContainer}
						<span class="ui-counter-panel__item-dropdown" aria-hidden="true"><i></i></span>
					</button>
				` : main_core.Tag.render`
					<div class="ui-counter-panel__item ui-counter-panel__item--more-trigger">
						${counterContainer}
						<div class="ui-counter-panel__item-dropdown"><i></i></div>
					</div>
				`;
			_assertClassBrand(_CounterPanel_brand, this, _initMenuTrigger).call(this, this.moreButton);
			main_core.Event.bind(this.moreButton, 'click', () => {
				if (_assertClassBrand(_CounterPanel_brand, this, _toggleActiveMenu).call(this, this.moreButton)) {
					return;
				}
				_assertClassBrand(_CounterPanel_brand, this, _showMorePopup).call(this);
			});
		}
		return this.moreButton;
	}
	function _getMoreCounterContainer(items) {
		const counterNode = _assertClassBrand(_CounterPanel_brand, this, _getMoreCounter).call(this, items).getContainer();
		return this.hasAirDesign() ? main_core.Tag.render`<span class="ui-counter-panel__item-value">${counterNode}</span>` : main_core.Tag.render`
				<div class="ui-counter-panel__item-value">
					${counterNode}
				</div>
			`;
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
			onShow: () => {
				main_core.Dom.addClass(this.moreButton, '--hover');
				_assertClassBrand(_CounterPanel_brand, this, _setExpanded).call(this, this.moreButton, true);
			},
			onClose: () => {
				main_core.Dom.removeClass(this.moreButton, '--hover');
				_assertClassBrand(_CounterPanel_brand, this, _setExpanded).call(this, this.moreButton, false);
			}
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
	var _rovingMoreKey = {
		_: '__more__'
	};
	// Native buttons only: non-interactive items are rendered as spans and stay out of the roving set.
	var _rovingButtonSelector = {
		_: 'button.ui-counter-panel__item'
	};

	const CounterItemCollapsedIcon = Object.freeze({
		CHAT_CHECK: 'chat-chek'
	});

	exports.CounterItem = CounterItem;
	exports.CounterItemCollapsedIcon = CounterItemCollapsedIcon;
	exports.CounterPanel = CounterPanel;

})(this.BX.UI = this.BX.UI || {}, BX.UI, window, window, BX, BX.Event, BX.UI, BX.UI.Accessibility, BX.UI.System);
//# sourceMappingURL=counterpanel.bundle.js.map
