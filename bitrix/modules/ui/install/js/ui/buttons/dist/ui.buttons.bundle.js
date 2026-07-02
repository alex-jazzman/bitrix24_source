/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_designTokens_air, ui_cnt, ui_buttons, main_popup, ui_iconSet_api_core, ui_switcher, main_core_events) {
	'use strict';

	function _classPrivateFieldInitSpec$2(e, t, a) { _checkPrivateRedeclaration$3(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$3(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet$2(s, a) { return s.get(_assertClassBrand$4(s, a)); }
	function _classPrivateFieldSet$2(s, a, r) { return s.set(_assertClassBrand$4(s, a), r), r; }
	function _assertClassBrand$4(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _counter = /*#__PURE__*/new WeakMap();
	let ButtonCounter = /*#__PURE__*/function () {
		function ButtonCounter(options) {
			babelHelpers.classCallCheck(this, ButtonCounter);
			_classPrivateFieldInitSpec$2(this, _counter, void 0);
			this.validateOptions(options);
			_classPrivateFieldSet$2(_counter, this, new ui_cnt.Counter({
				color: options.color ?? ui_cnt.CounterColor.DANGER,
				style: options.style ?? ui_cnt.CounterStyle.FILLED_ALERT,
				size: options.size ?? ui_cnt.CounterSize.MEDIUM,
				value: options.value,
				maxValue: options.maxValue,
				usePercentSymbol: options.useSymbolPercent,
				useAirDesign: true
			}));
		}
		return babelHelpers.createClass(ButtonCounter, [{
			key: "render",
			value: function render() {
				return _classPrivateFieldGet$2(_counter, this).render();
			}
		}, {
			key: "getValue",
			value: function getValue() {
				return _classPrivateFieldGet$2(_counter, this).getValue();
			}
		}, {
			key: "setValue",
			value: function setValue(value) {
				_classPrivateFieldGet$2(_counter, this).update(value);
			}

			/*
			@deprecated use setStyle instead
			 */
		}, {
			key: "setColor",
			value: function setColor(color) {
				_classPrivateFieldGet$2(_counter, this).setColor(color);
			}
		}, {
			key: "setStyle",
			value: function setStyle(style) {
				_classPrivateFieldGet$2(_counter, this).setStyle(style);
			}
		}, {
			key: "validateOptions",
			value: function validateOptions(options) {
				// todo add implementation
			}
		}]);
	}();

	/**
	 * @namespace {BX.UI}
	 */
	let ButtonSize = /*#__PURE__*/babelHelpers.createClass(function ButtonSize() {
		babelHelpers.classCallCheck(this, ButtonSize);
	});
	babelHelpers.defineProperty(ButtonSize, "EXTRA_LARGE", 'ui-btn-xl');
	babelHelpers.defineProperty(ButtonSize, "LARGE", 'ui-btn-lg');
	babelHelpers.defineProperty(ButtonSize, "MEDIUM", 'ui-btn-md');
	babelHelpers.defineProperty(ButtonSize, "SMALL", 'ui-btn-sm');
	babelHelpers.defineProperty(ButtonSize, "EXTRA_SMALL", 'ui-btn-xs');
	babelHelpers.defineProperty(ButtonSize, "EXTRA_EXTRA_SMALL", 'ui-btn-xss');

	const getCounterSize = buttonSize => ({
		[ButtonSize.EXTRA_EXTRA_SMALL]: ui_buttons.ButtonCounterSize.SMALL,
		[ButtonSize.EXTRA_SMALL]: ui_buttons.ButtonCounterSize.SMALL,
		[ButtonSize.SMALL]: ui_buttons.ButtonCounterSize.SMALL,
		[ButtonSize.MEDIUM]: ui_buttons.ButtonCounterSize.MEDIUM,
		[ButtonSize.LARGE]: ui_buttons.ButtonCounterSize.LARGE,
		[ButtonSize.EXTRA_LARGE]: ui_buttons.ButtonCounterSize.LARGE
	})[buttonSize] ?? ui_buttons.ButtonCounterSize.MEDIUM;

	/**
	 * @namespace {BX.UI}
	 */
	let ButtonTag = /*#__PURE__*/babelHelpers.createClass(function ButtonTag() {
		babelHelpers.classCallCheck(this, ButtonTag);
	});
	babelHelpers.defineProperty(ButtonTag, "BUTTON", 0);
	babelHelpers.defineProperty(ButtonTag, "LINK", 1);
	babelHelpers.defineProperty(ButtonTag, "SUBMIT", 2);
	babelHelpers.defineProperty(ButtonTag, "INPUT", 3);
	babelHelpers.defineProperty(ButtonTag, "DIV", 4);
	babelHelpers.defineProperty(ButtonTag, "SPAN", 5);

	function _classPrivateMethodInitSpec$1(e, a) { _checkPrivateRedeclaration$2(e, a), a.add(e); }
	function _classPrivateFieldInitSpec$1(e, t, a) { _checkPrivateRedeclaration$2(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$2(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet$1(s, a) { return s.get(_assertClassBrand$3(s, a)); }
	function _classPrivateFieldSet$1(s, a, r) { return s.set(_assertClassBrand$3(s, a), r), r; }
	function _assertClassBrand$3(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _useAirDesign = /*#__PURE__*/new WeakMap();
	var _leftCounter = /*#__PURE__*/new WeakMap();
	var _rightCounter = /*#__PURE__*/new WeakMap();
	var _leftCounterContainer = /*#__PURE__*/new WeakMap();
	var _rightCounterContainer = /*#__PURE__*/new WeakMap();
	var _BaseButton_brand = /*#__PURE__*/new WeakSet();
	var _handleEvent = /*#__PURE__*/new WeakMap();
	let BaseButton = /*#__PURE__*/function () {
		function BaseButton(options) {
			babelHelpers.classCallCheck(this, BaseButton);
			_classPrivateMethodInitSpec$1(this, _BaseButton_brand);
			_classPrivateFieldInitSpec$1(this, _useAirDesign, false);
			_classPrivateFieldInitSpec$1(this, _leftCounter, void 0);
			_classPrivateFieldInitSpec$1(this, _rightCounter, void 0);
			_classPrivateFieldInitSpec$1(this, _leftCounterContainer, void 0);
			_classPrivateFieldInitSpec$1(this, _rightCounterContainer, void 0);
			_classPrivateFieldInitSpec$1(this, _handleEvent, event => {
				this.events[event.type]?.call(this, this, event);
			});
			this.options = Object.assign(this.getDefaultOptions(), main_core.Type.isPlainObject(options) ? options : {});

			/**
			 * 'buttonNode', 'textNode' and counterNode options use only in ButtonManager.createFromNode
			 */
			this.button = main_core.Type.isDomNode(this.options.buttonNode) ? this.options.buttonNode : null;
			this.textNode = main_core.Type.isDomNode(this.options.textNode) ? this.options.textNode : null;
			this.counterNode = main_core.Type.isDomNode(this.options.counterNode) ? this.options.counterNode : null;
			this.text = '';
			this.counter = null;
			this.events = {};
			this.link = '';
			this.maxWidth = null;
			this.tag = this.isEnumValue(this.options.tag, ButtonTag) ? this.options.tag : ButtonTag.BUTTON;
			if (main_core.Type.isStringFilled(this.options.link)) {
				this.tag = ButtonTag.LINK;
			}
			this.baseClass = main_core.Type.isStringFilled(this.options.baseClass) ? this.options.baseClass : '';
			this.disabled = false;
			this.init(); // needs to initialize private properties in derived classes.

			if (this.options.disabled === true) {
				this.setDisabled();
			}
			this.setAirDesign(this.options.useAirDesign === true);
			this.setText(this.options.text);
			this.setCounter(this.options.counter);
			this.setProps(this.options.props);
			this.setDataSet(this.options.dataset);
			this.addClass(this.options.className);
			this.setLink(this.options.link);
			this.setMaxWidth(this.options.maxWidth);
			if (this.hasAirDesign()) {
				if (this.options.leftCounter) {
					this.setLeftCounter({
						...this.options.leftCounter,
						size: getCounterSize(this.options.size)
					});
				}
				if (this.options.rightCounter) {
					this.setRightCounter({
						...this.options.rightCounter,
						size: getCounterSize(this.options.size)
					});
				}
			}
			this.bindEvent('click', this.options.onclick);
			this.bindEvents(this.options.events);
		}

		/**
		 * @protected
		 */
		return babelHelpers.createClass(BaseButton, [{
			key: "init",
			value: function init() {
				// needs to initialize private properties in derived classes.
			}
		}, {
			key: "setAirDesign",
			value: function setAirDesign(use) {
				_classPrivateFieldSet$1(_useAirDesign, this, use === true);
				main_core.Dom.toggleClass(this.getContainer(), '--air', _classPrivateFieldGet$1(_useAirDesign, this));
			}
		}, {
			key: "hasAirDesign",
			value: function hasAirDesign() {
				return _classPrivateFieldGet$1(_useAirDesign, this);
			}

			/**
			 * @protected
			 */
		}, {
			key: "getDefaultOptions",
			value: function getDefaultOptions() {
				return {};
			}
		}, {
			key: "render",
			value: function render() {
				return this.getContainer();
			}
		}, {
			key: "renderTo",
			value: function renderTo(node) {
				main_core.Dom.append(this.getContainer(), node);
				return this.getContainer();
			}
		}, {
			key: "getContainer",
			value: function getContainer() {
				this.button ??= {
					[ButtonTag.LINK]: () => main_core.Tag.render`<a class="${this.getBaseClass()}" href=""></a>`,
					[ButtonTag.INPUT]: () => main_core.Tag.render`<input class="${this.getBaseClass()}" type="button">`,
					[ButtonTag.SUBMIT]: () => main_core.Tag.render`<input class="${this.getBaseClass()}" type="submit">`,
					[ButtonTag.DIV]: () => main_core.Tag.render`<div class="${this.getBaseClass()}"></div>`
				}[this.getTag()]?.() ?? main_core.Tag.render`<button class="${this.getBaseClass()}"></button>`;
				if (this.isDisabled() === false) {
					main_core.Dom.attr(this.button, 'tabindex', '0');
				}
				return this.button;
			}

			/**
			 * @protected
			 */
		}, {
			key: "getBaseClass",
			value: function getBaseClass() {
				return this.baseClass;
			}
		}, {
			key: "setText",
			value: function setText(text) {
				if (!main_core.Type.isString(text) && !this.hasAirDesign()) {
					return this;
				}
				this.text = text || '';
				if (this.isInputType()) {
					this.getContainer().value = this.text;
				} else if (this.text.length > 0 || this.hasAirDesign()) {
					if (this.textNode === null) {
						this.textNode = main_core.Tag.render`<span class="ui-btn-text"><span class="ui-btn-text-inner"></span></span>`;
					}
					if (!this.textNode.parentNode) {
						main_core.Dom.prepend(this.textNode, this.getContainer());
					}
					const textContentNode = this.textNode.querySelector('.ui-btn-text-inner') ?? this.textNode;
					textContentNode.textContent = text;
				} else if (this.textNode !== null) {
					main_core.Dom.remove(this.textNode);
				}
				return this;
			}
		}, {
			key: "getTextContainer",
			value: function getTextContainer() {
				return this.textNode;
			}
		}, {
			key: "getText",
			value: function getText() {
				return this.text;
			}

			/**
			 * Use for buttons with air option
			 * Use only to create or delete a counter. Update counter value via getLeftCounter() method.
			 *
			 * @param options Object | null Object for creating. null for deleting.
			 */
		}, {
			key: "setLeftCounter",
			value: function setLeftCounter(options) {
				if (this.hasAirDesign() === false) {
					console.warn('Left counter works only with air buttons. Use setLeftCounter or useAirDesign option in constructor.');
					return this;
				}
				if (!options) {
					_assertClassBrand$3(_BaseButton_brand, this, _removeLeftCounter).call(this);
					return this;
				}
				if (_classPrivateFieldGet$1(_leftCounter, this)) {
					return this;
				}
				_assertClassBrand$3(_BaseButton_brand, this, _removeLeftCounter).call(this);
				_classPrivateFieldSet$1(_leftCounter, this, new ButtonCounter({
					...options,
					size: main_core.Type.isString(options.size) ? options.size : ui_cnt.CounterSize.MEDIUM
				}));
				if (this.textNode) {
					_classPrivateFieldSet$1(_leftCounterContainer, this, main_core.Tag.render`
				<div class="ui-btn-left-counter">
					${_classPrivateFieldGet$1(_leftCounter, this).render()}
				</div>
			`);
					main_core.Dom.prepend(_classPrivateFieldGet$1(_leftCounterContainer, this), this.textNode);
					main_core.Dom.addClass(this.getContainer(), '--with-left-counter');
				}
				return this;
			}

			/**
			 * Use for buttons with air option
			 * Use only to create or delete a counter. Update counter value via getRightCounter() method.
			 *
			 * @param options Object | null Object for creating. null for deleting.
			 */
		}, {
			key: "setRightCounter",
			value: function setRightCounter(options) {
				if (this.hasAirDesign() === false) {
					console.warn('Right counter works only with air buttons. Use setRightCounter or useAirDesign option in constructor.');
					return this;
				}
				if (!options) {
					_assertClassBrand$3(_BaseButton_brand, this, _removeRightCounter).call(this);
					return this;
				}
				_assertClassBrand$3(_BaseButton_brand, this, _removeRightCounter).call(this);
				_classPrivateFieldSet$1(_rightCounter, this, new ButtonCounter({
					...options,
					size: main_core.Type.isString(options.size) ? options.size : ui_cnt.CounterSize.MEDIUM
				}));
				if (this.textNode) {
					_classPrivateFieldSet$1(_rightCounterContainer, this, main_core.Tag.render`
				<div class="ui-btn-right-counter">${_classPrivateFieldGet$1(_rightCounter, this).render()}</div>
			`);
					main_core.Dom.append(_classPrivateFieldGet$1(_rightCounterContainer, this), this.textNode);
					main_core.Dom.addClass(this.getContainer(), '--with-right-counter');
				}
				return this;
			}
		}, {
			key: "getLeftCounter",
			value: function getLeftCounter() {
				return _classPrivateFieldGet$1(_leftCounter, this);
			}
		}, {
			key: "getRightCounter",
			value: function getRightCounter() {
				return _classPrivateFieldGet$1(_rightCounter, this);
			}
		}, {
			key: "setCounter",
			value:
			/**
			 * use for old buttons (without useAirTheme option)
			 */
			function setCounter(counter) {
				if ([0, '0', '', null, false].includes(counter)) {
					main_core.Dom.remove(this.counterNode);
					this.counterNode = null;
					this.counter = null;
				} else if (main_core.Type.isNumber(counter) && counter > 0 || main_core.Type.isStringFilled(counter)) {
					if (this.hasAirDesign()) {
						console.warn('Use setCounter or counter option only for not air buttons. For fir buttons use setLeftCounter or setRightCounter methods or leftCounter or rightCounter options.');
						return this;
					}
					if (this.isInputType()) {
						throw new Error('BX.UI.Button: an input button cannot have a counter.');
					}
					if (this.counterNode === null) {
						this.counterNode = main_core.Tag.render`<span class="ui-btn-counter"></span>`;
						main_core.Dom.append(this.counterNode, this.getContainer());
					}
					this.counter = counter;
					this.counterNode.textContent = counter;
				}
				return this;
			}
		}, {
			key: "getCounter",
			value: function getCounter() {
				return this.counter;
			}
		}, {
			key: "setLink",
			value: function setLink(link) {
				if (main_core.Type.isStringFilled(link)) {
					if (this.getTag() !== ButtonTag.LINK) {
						throw new Error('BX.UI.Button: only an anchor button tag supports a link.');
					}
					this.getContainer().href = link;
				}
				return this;
			}
		}, {
			key: "getLink",
			value: function getLink() {
				return this.getContainer().href;
			}
		}, {
			key: "setMaxWidth",
			value: function setMaxWidth(maxWidth) {
				this.maxWidth = maxWidth > 0 ? maxWidth : null;
				main_core.Dom.style(this.getContainer(), 'max-width', maxWidth > 0 ? `${maxWidth}px` : null);
				return this;
			}
		}, {
			key: "getMaxWidth",
			value: function getMaxWidth() {
				return this.maxWidth;
			}
		}, {
			key: "getTag",
			value: function getTag() {
				return this.tag;
			}
		}, {
			key: "setProps",
			value: function setProps(props) {
				if (main_core.Type.isPlainObject(props)) {
					main_core.Dom.attr(this.getContainer(), props);
				}
				return this;
			}
		}, {
			key: "getProps",
			value: function getProps() {
				const reserved = this.isInputType() ? ['class', 'type'] : ['class'];
				return [...this.getContainer().attributes].filter(({
					name
				}) => !reserved.includes(name) && !name.startsWith('data-')).reduce((props, {
					name,
					value
				}) => ({
					...props,
					[name]: value
				}), {});
			}
		}, {
			key: "setDataSet",
			value: function setDataSet(props) {
				if (!main_core.Type.isPlainObject(props)) {
					return this;
				}
				Object.entries(props).forEach(([property, value]) => {
					this.getDataSet()[property] = value;
					if (value === null) {
						delete this.getDataSet()[property];
					}
				});
				return this;
			}
		}, {
			key: "getDataSet",
			value: function getDataSet() {
				return this.getContainer().dataset;
			}
		}, {
			key: "addClass",
			value: function addClass(className) {
				main_core.Dom.addClass(this.getContainer(), className);
				return this;
			}
		}, {
			key: "removeClass",
			value: function removeClass(className) {
				main_core.Dom.removeClass(this.getContainer(), className);
				return this;
			}
		}, {
			key: "setDisabled",
			value: function setDisabled(disabled = true) {
				this.disabled = disabled;
				this.setProps({
					disabled: disabled ? true : null,
					tabindex: disabled ? null : '0'
				});
				return this;
			}
		}, {
			key: "isDisabled",
			value: function isDisabled() {
				return this.disabled;
			}
		}, {
			key: "isInputType",
			value: function isInputType() {
				return [ButtonTag.SUBMIT, ButtonTag.INPUT].includes(this.getTag());
			}
		}, {
			key: "bindEvents",
			value: function bindEvents(events) {
				if (main_core.Type.isPlainObject(events)) {
					Object.entries(events).forEach(([name, handler]) => this.bindEvent(name, handler));
				}
				return this;
			}
		}, {
			key: "unbindEvents",
			value: function unbindEvents(events) {
				if (main_core.Type.isArray(events)) {
					events.forEach(eventName => this.unbindEvent(eventName));
				}
				return this;
			}
		}, {
			key: "bindEvent",
			value: function bindEvent(eventName, fn) {
				if (main_core.Type.isStringFilled(eventName) && main_core.Type.isFunction(fn)) {
					this.unbindEvent(eventName);
					this.events[eventName] = fn;
					main_core.Event.bind(this.getContainer(), eventName, _classPrivateFieldGet$1(_handleEvent, this));
				}
				return this;
			}
		}, {
			key: "unbindEvent",
			value: function unbindEvent(eventName) {
				main_core.Event.unbindAll(this.getContainer(), eventName);
				if (this.events[eventName]) {
					delete this.events[eventName];
				}
				return this;
			}
		}, {
			key: "isEnumValue",
			value:
			/**
			 * @protected
			 */
			function isEnumValue(value, enumeration) {
				return Object.values(enumeration).includes(value);
			}
		}]);
	}();
	function _removeLeftCounter() {
		main_core.Dom.remove(_classPrivateFieldGet$1(_leftCounterContainer, this));
		main_core.Dom.removeClass(this.getContainer(), '--with-left-counter');
		_classPrivateFieldSet$1(_leftCounterContainer, this, null);
		_classPrivateFieldSet$1(_leftCounter, this, null);
	}
	function _removeRightCounter() {
		main_core.Dom.remove(_classPrivateFieldGet$1(_rightCounterContainer, this));
		main_core.Dom.removeClass(this.getContainer(), '--with-right-counter');
		_classPrivateFieldSet$1(_rightCounterContainer, this, null);
		_classPrivateFieldSet$1(_rightCounter, this, null);
	}

	/**
	 * @namespace {BX.UI}
	 */
	let ButtonColor = /*#__PURE__*/babelHelpers.createClass(function ButtonColor() {
		babelHelpers.classCallCheck(this, ButtonColor);
	});
	babelHelpers.defineProperty(ButtonColor, "DANGER", 'ui-btn-danger');
	babelHelpers.defineProperty(ButtonColor, "DANGER_DARK", 'ui-btn-danger-dark');
	babelHelpers.defineProperty(ButtonColor, "DANGER_LIGHT", 'ui-btn-danger-light');
	babelHelpers.defineProperty(ButtonColor, "SUCCESS", 'ui-btn-success');
	babelHelpers.defineProperty(ButtonColor, "SUCCESS_DARK", 'ui-btn-success-dark');
	babelHelpers.defineProperty(ButtonColor, "SUCCESS_LIGHT", 'ui-btn-success-light');
	babelHelpers.defineProperty(ButtonColor, "PRIMARY_DARK", 'ui-btn-primary-dark');
	babelHelpers.defineProperty(ButtonColor, "PRIMARY", 'ui-btn-primary');
	babelHelpers.defineProperty(ButtonColor, "SECONDARY", 'ui-btn-secondary');
	babelHelpers.defineProperty(ButtonColor, "SECONDARY_LIGHT", 'ui-btn-secondary-light');
	babelHelpers.defineProperty(ButtonColor, "WARNING_LIGHT", 'ui-btn-warning-light');
	babelHelpers.defineProperty(ButtonColor, "LINK", 'ui-btn-link');
	babelHelpers.defineProperty(ButtonColor, "LIGHT", 'ui-btn-light');
	babelHelpers.defineProperty(ButtonColor, "LIGHT_BORDER", 'ui-btn-light-border');
	babelHelpers.defineProperty(ButtonColor, "AI", 'ui-btn-color-ai');
	babelHelpers.defineProperty(ButtonColor, "BASE_LIGHT", 'ui-btn-base-light');
	babelHelpers.defineProperty(ButtonColor, "COLLAB", 'ui-btn-collab');
	babelHelpers.defineProperty(ButtonColor, "PRIMARY_BORDER", 'ui-btn-primary-border');
	babelHelpers.defineProperty(ButtonColor, "CURTAIN_PRIMARY", 'ui-btn-primary-curtain');
	babelHelpers.defineProperty(ButtonColor, "CURTAIN_WARNING", 'ui-btn-primary-warning');

	/**
	 * @namespace {BX.UI}
	 */
	let ButtonIcon = /*#__PURE__*/babelHelpers.createClass(function ButtonIcon() {
		babelHelpers.classCallCheck(this, ButtonIcon);
	});
	babelHelpers.defineProperty(ButtonIcon, "UNFOLLOW", 'ui-btn-icon-unfollow');
	babelHelpers.defineProperty(ButtonIcon, "FOLLOW", 'ui-btn-icon-follow');
	babelHelpers.defineProperty(ButtonIcon, "ADD", 'ui-btn-icon-add');
	babelHelpers.defineProperty(ButtonIcon, "ADD_M", 'ui-btn-icon-add-m');
	babelHelpers.defineProperty(ButtonIcon, "STOP", 'ui-btn-icon-stop');
	babelHelpers.defineProperty(ButtonIcon, "START", 'ui-btn-icon-start');
	babelHelpers.defineProperty(ButtonIcon, "PAUSE", 'ui-btn-icon-pause');
	babelHelpers.defineProperty(ButtonIcon, "ADD_FOLDER", 'ui-btn-icon-add-folder');
	babelHelpers.defineProperty(ButtonIcon, "SETTING", 'ui-btn-icon-setting');
	babelHelpers.defineProperty(ButtonIcon, "TASK", 'ui-btn-icon-task');
	babelHelpers.defineProperty(ButtonIcon, "INFO", 'ui-btn-icon-info');
	babelHelpers.defineProperty(ButtonIcon, "SEARCH", 'ui-btn-icon-search');
	babelHelpers.defineProperty(ButtonIcon, "PRINT", 'ui-btn-icon-print');
	babelHelpers.defineProperty(ButtonIcon, "LIST", 'ui-btn-icon-list');
	babelHelpers.defineProperty(ButtonIcon, "BUSINESS", 'ui-btn-icon-business');
	babelHelpers.defineProperty(ButtonIcon, "BUSINESS_CONFIRM", 'ui-btn-icon-business-confirm');
	babelHelpers.defineProperty(ButtonIcon, "BUSINESS_WARNING", 'ui-btn-icon-business-warning');
	babelHelpers.defineProperty(ButtonIcon, "CAMERA", 'ui-btn-icon-camera');
	babelHelpers.defineProperty(ButtonIcon, "PHONE_UP", 'ui-btn-icon-phone-up');
	babelHelpers.defineProperty(ButtonIcon, "PHONE_DOWN", 'ui-btn-icon-phone-down');
	babelHelpers.defineProperty(ButtonIcon, "PHONE_CALL", 'ui-btn-icon-phone-call');
	babelHelpers.defineProperty(ButtonIcon, "BACK", 'ui-btn-icon-back');
	babelHelpers.defineProperty(ButtonIcon, "REMOVE", 'ui-btn-icon-remove');
	babelHelpers.defineProperty(ButtonIcon, "DOWNLOAD", 'ui-btn-icon-download');
	babelHelpers.defineProperty(ButtonIcon, "DOTS", 'ui-btn-icon-dots');
	babelHelpers.defineProperty(ButtonIcon, "DONE", 'ui-btn-icon-done');
	babelHelpers.defineProperty(ButtonIcon, "CANCEL", 'ui-btn-icon-cancel');
	babelHelpers.defineProperty(ButtonIcon, "DISK", 'ui-btn-icon-disk');
	babelHelpers.defineProperty(ButtonIcon, "LOCK", 'ui-btn-icon-lock');
	babelHelpers.defineProperty(ButtonIcon, "MAIL", 'ui-btn-icon-mail');
	babelHelpers.defineProperty(ButtonIcon, "CHAT", 'ui-btn-icon-chat');
	babelHelpers.defineProperty(ButtonIcon, "PAGE", 'ui-btn-icon-page');
	babelHelpers.defineProperty(ButtonIcon, "CLOUD", 'ui-btn-icon-cloud');
	babelHelpers.defineProperty(ButtonIcon, "EDIT", 'ui-btn-icon-edit');
	babelHelpers.defineProperty(ButtonIcon, "SHARE", 'ui-btn-icon-share');
	babelHelpers.defineProperty(ButtonIcon, "ANGLE_UP", 'ui-btn-icon-angle-up');
	babelHelpers.defineProperty(ButtonIcon, "ANGLE_DOWN", 'ui-btn-icon-angle-down');
	babelHelpers.defineProperty(ButtonIcon, "EYE_OPENED", 'ui-btn-icon-eye-opened');
	babelHelpers.defineProperty(ButtonIcon, "EYE_CLOSED", 'ui-btn-icon-eye-closed');
	babelHelpers.defineProperty(ButtonIcon, "ALERT", 'ui-btn-icon-alert');
	babelHelpers.defineProperty(ButtonIcon, "FAIL", 'ui-btn-icon-fail');
	babelHelpers.defineProperty(ButtonIcon, "SUCCESS", 'ui-btn-icon-success');
	babelHelpers.defineProperty(ButtonIcon, "PLAN", 'ui-btn-icon-plan');
	babelHelpers.defineProperty(ButtonIcon, "TARIFF", 'ui-btn-icon-tariff');
	babelHelpers.defineProperty(ButtonIcon, "BATTERY", 'ui-btn-icon-battery');
	babelHelpers.defineProperty(ButtonIcon, "NO_BATTERY", 'ui-btn-icon-no-battery');
	babelHelpers.defineProperty(ButtonIcon, "HALF_BATTERY", 'ui-btn-icon-half-battery');
	babelHelpers.defineProperty(ButtonIcon, "LOW_BATTERY", 'ui-btn-icon-low-battery');
	babelHelpers.defineProperty(ButtonIcon, "CRIT_BATTERY", 'ui-btn-icon-crit-battery');
	babelHelpers.defineProperty(ButtonIcon, "DEMO", 'ui-btn-icon-demo');
	babelHelpers.defineProperty(ButtonIcon, "ROBOTS", 'ui-btn-icon-robots');
	babelHelpers.defineProperty(ButtonIcon, "NOTE", 'ui-btn-icon-note');
	babelHelpers.defineProperty(ButtonIcon, "SCRIPT", 'ui-btn-icon-script');
	babelHelpers.defineProperty(ButtonIcon, "PRINT2", 'ui-btn-icon-print-2');
	babelHelpers.defineProperty(ButtonIcon, "FUNNEL", 'ui-btn-icon-funnel');
	babelHelpers.defineProperty(ButtonIcon, "FORWARD", 'ui-btn-icon-forward');
	babelHelpers.defineProperty(ButtonIcon, "COPY", 'ui-btn-icon-copy');
	babelHelpers.defineProperty(ButtonIcon, "AI", 'ui-btn-icon-ai ui-icon-set__scope');
	babelHelpers.defineProperty(ButtonIcon, "BUSINESS_NEW", 'ui-btn-icon-business-new');
	babelHelpers.defineProperty(ButtonIcon, "OUTLINE_ADD", 'ui-btn-icon-outline-add');
	babelHelpers.defineProperty(ButtonIcon, "HELP", 'ui-btn-icon-help');
	babelHelpers.defineProperty(ButtonIcon, "CHECK", 'ui-btn-icon-check');
	babelHelpers.defineProperty(ButtonIcon, "CHEVRON_LEFT_S", 'ui-btn-icon-chevron-left-s');
	babelHelpers.defineProperty(ButtonIcon, "CHEVRON_RIGHT_S", 'ui-btn-icon-chevron-right-s');
	babelHelpers.defineProperty(ButtonIcon, "REFRESH", 'ui-btn-icon-refresh');
	babelHelpers.defineProperty(ButtonIcon, "APPS", 'ui-btn-icon-apps');
	babelHelpers.defineProperty(ButtonIcon, "IMAGE", 'ui-btn-icon-image');
	babelHelpers.defineProperty(ButtonIcon, "CITY", 'ui-btn-icon-city');
	babelHelpers.defineProperty(ButtonIcon, "TWO_PERSONS", 'ui-btn-icon-two-persons');
	babelHelpers.defineProperty(ButtonIcon, "COPILOT", 'ui-btn-icon-copilot');
	babelHelpers.defineProperty(ButtonIcon, "RELOAD", 'ui-btn-icon-reload');
	babelHelpers.defineProperty(ButtonIcon, "WORKFLOW", 'ui-btn-icon-workflow');
	babelHelpers.defineProperty(ButtonIcon, "PERSON", 'ui-btn-icon-person');
	babelHelpers.defineProperty(ButtonIcon, "WORKFLOW_STOP", 'ui-btn-icon-workflow-stop');
	babelHelpers.defineProperty(ButtonIcon, "MARKET", 'ui-btn-icon-market');
	babelHelpers.defineProperty(ButtonIcon, "KEY", 'ui-btn-icon-key');
	babelHelpers.defineProperty(ButtonIcon, "MAIL_PLUS", 'ui-btn-icon-mail-plus');
	babelHelpers.defineProperty(ButtonIcon, "FUNNEL_FILTER", 'ui-btn-icon-funnel-filter');
	babelHelpers.defineProperty(ButtonIcon, "CALENDAR_WITH_SLOTS", 'ui-btn-icon-calendar-with-slots');
	babelHelpers.defineProperty(ButtonIcon, "CHATS", 'ui-btn-icon-chats');
	babelHelpers.defineProperty(ButtonIcon, "CALENDAR_WITH_CHECKS", 'ui-btn-icon-calendar-with-checks');
	babelHelpers.defineProperty(ButtonIcon, "EXCLAMATION", 'ui-btn-icon-exclamation');

	/**
	 * @namespace {BX.UI}
	 */
	let ButtonState = /*#__PURE__*/babelHelpers.createClass(function ButtonState() {
		babelHelpers.classCallCheck(this, ButtonState);
	});
	babelHelpers.defineProperty(ButtonState, "HOVER", 'ui-btn-hover');
	babelHelpers.defineProperty(ButtonState, "ACTIVE", 'ui-btn-active');
	babelHelpers.defineProperty(ButtonState, "DISABLED", 'ui-btn-disabled');
	babelHelpers.defineProperty(ButtonState, "CLOCKING", 'ui-btn-clock');
	babelHelpers.defineProperty(ButtonState, "WAITING", 'ui-btn-wait');
	babelHelpers.defineProperty(ButtonState, "AI_WAITING", 'ui-btn-ai-waiting');

	/**
	 * @namespace {BX.UI}
	 */
	let ButtonStyle = /*#__PURE__*/babelHelpers.createClass(function ButtonStyle() {
		babelHelpers.classCallCheck(this, ButtonStyle);
	});
	babelHelpers.defineProperty(ButtonStyle, "NO_CAPS", 'ui-btn-no-caps');
	babelHelpers.defineProperty(ButtonStyle, "ROUND", 'ui-btn-round');
	babelHelpers.defineProperty(ButtonStyle, "DROPDOWN", 'ui-btn-dropdown');
	babelHelpers.defineProperty(ButtonStyle, "COLLAPSED", 'ui-btn-collapsed');
	babelHelpers.defineProperty(ButtonStyle, "DEPEND_ON_THEME", 'ui-btn-themes');

	/**
	 * @namespace {BX.UI}
	 */
	let AirButtonStyle = /*#__PURE__*/babelHelpers.createClass(function AirButtonStyle() {
		babelHelpers.classCallCheck(this, AirButtonStyle);
	});
	babelHelpers.defineProperty(AirButtonStyle, "FILLED", '--style-filled');
	babelHelpers.defineProperty(AirButtonStyle, "FILLED_BITRIX_GPT", '--style-filled-bitrix-gpt');
	babelHelpers.defineProperty(AirButtonStyle, "TINTED", '--style-tinted');
	babelHelpers.defineProperty(AirButtonStyle, "TINTED_ALERT", '--style-tinted-alert');
	babelHelpers.defineProperty(AirButtonStyle, "TINTED_BITRIX_GPT", '--style-tinted-bitrix-gpt');
	babelHelpers.defineProperty(AirButtonStyle, "OUTLINE_ACCENT_1", '--style-outline-accent-1');
	babelHelpers.defineProperty(AirButtonStyle, "OUTLINE_ACCENT_2", '--style-outline-accent-2');
	babelHelpers.defineProperty(AirButtonStyle, "OUTLINE", '--style-outline');
	babelHelpers.defineProperty(AirButtonStyle, "OUTLINE_NO_ACCENT", '--style-outline-no-accent');
	babelHelpers.defineProperty(AirButtonStyle, "OUTLINE_BITRIX_GPT", '--style-outline-bitrix-gpt');
	babelHelpers.defineProperty(AirButtonStyle, "PLAIN_ACCENT", '--style-plain-accent');
	babelHelpers.defineProperty(AirButtonStyle, "PLAIN", '--style-plain');
	babelHelpers.defineProperty(AirButtonStyle, "PLAIN_NO_ACCENT", '--style-plain-no-accent');
	babelHelpers.defineProperty(AirButtonStyle, "SELECTION", '--style-selection');
	babelHelpers.defineProperty(AirButtonStyle, "FILLED_COPILOT", '--style-filled-copilot');
	babelHelpers.defineProperty(AirButtonStyle, "FILLED_SUCCESS", '--style-filled-success');
	babelHelpers.defineProperty(AirButtonStyle, "FILLED_ALERT", '--style-filled-alert');
	babelHelpers.defineProperty(AirButtonStyle, "FILLED_BOOST", '--style-filled-boost');

	function _callSuper$h(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$h() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$h() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$h = function () { return !!t; })(); }
	function _superPropGet$2(t, o, e, r) { var p = babelHelpers.get(babelHelpers.getPrototypeOf(t.prototype ), o, e); return "function" == typeof p ? function (t) { return p.apply(e, t); } : p; }
	function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration$1(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$1(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand$2(s, a), r), r; }
	function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand$2(s, a)); }
	function _assertClassBrand$2(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _style = /*#__PURE__*/new WeakMap();
	var _isWide = /*#__PURE__*/new WeakMap();
	var _layout = /*#__PURE__*/new WeakMap();
	/**
	 * @namespace {BX.UI}
	 */
	let Button = /*#__PURE__*/function (_BaseButton) {
		function Button(options) {
			var _this;
			babelHelpers.classCallCheck(this, Button);
			_this = _callSuper$h(this, Button, [{
				dependOnTheme: options.className?.includes(ButtonStyle.DEPEND_ON_THEME),
				...(main_core.Type.isPlainObject(options) ? options : {}),
				baseClass: main_core.Type.isStringFilled(options?.baseClass) ? options.baseClass : Button.BASE_CLASS
			}]);
			_classPrivateFieldInitSpec(_this, _style, void 0);
			_classPrivateFieldInitSpec(_this, _isWide, false);
			_classPrivateFieldInitSpec(_this, _layout, {});
			_this.isDependOnTheme = null;
			_this.size = null;
			_this.color = null;
			_this.icon = null;
			_this.state = null;
			_this.id = null;
			_this.context = null;
			_this.menuWindow = null;
			_this.handleMenuClick = _this.handleMenuClick.bind(_this);
			_this.handleMenuClose = _this.handleMenuClose.bind(_this);
			_this.setDependOnTheme(_this.options.dependOnTheme ?? false);
			_this.setSize(_this.options.size);
			_this.setColor(_this.options.color);
			_this.setIcon(_this.options.icon, _this.options.iconPosition || 'left');
			_this.setState(_this.options.state);
			_this.setId(_this.options.id);
			_this.setMenu(_this.options.menu);
			_this.setContext(_this.options.context);
			_this.setWide(_this.options.wide === true);
			_this.setLeftCorners(_this.options.removeLeftCorners !== true);
			_this.setRightCorners(_this.options.removeRightCorners !== true);
			if (_this.options.collapsedIcon) {
				_this.setCollapsedIcon(_this.options.collapsedIcon);
			}
			if (_this.hasAirDesign()) {
				_this.setStyle(_this.options.style || AirButtonStyle.FILLED);
				_this.setNoCaps(true);
				if (!_this.text && !(_this instanceof ui_buttons.SplitButton)) {
					_this.setCollapsed(true);
				}
			}
			if (_this.options.noCaps) {
				_this.setNoCaps();
			}
			if (_this.options.round) {
				_this.setRound();
			}
			if (_this.options.dropdown || _this.getMenuWindow() && _this.options.dropdown !== false) {
				_this.setDropdown();
			}
			return _this;
		}
		babelHelpers.inherits(Button, _BaseButton);
		return babelHelpers.createClass(Button, [{
			key: "setText",
			value: function setText(text) {
				_superPropGet$2(Button, "setText", this)([text]);
				if (this.hasAirDesign()) {
					main_core.Dom.toggleClass(this.getContainer(), ButtonStyle.COLLAPSED, !this.text);
				}
				return this;
			}
		}, {
			key: "setSize",
			value: function setSize(size) {
				return this.setProperty('size', size, ButtonSize);
			}
		}, {
			key: "getSize",
			value: function getSize() {
				return this.size;
			}
		}, {
			key: "setColor",
			value: function setColor(color) {
				return this.setProperty('color', color, ButtonColor);
			}
		}, {
			key: "getColor",
			value: function getColor() {
				return this.color;
			}
		}, {
			key: "setIcon",
			value: function setIcon(icon, iconPosition = 'left') {
				if (icon && !icon.startsWith('ui-btn-icon') && !icon.startsWith('ui-icon-set')) {
					_classPrivateFieldGet(_layout, this).icon?.remove();
					_classPrivateFieldGet(_layout, this).icon = new ui_iconSet_api_core.Icon({
						icon
					}).render();
					main_core.Dom.addClass(this.getContainer(), '--with-icon');
					main_core.Dom.prepend(_classPrivateFieldGet(_layout, this).icon, this.getContainer());
					return this;
				}
				this.setProperty('icon', icon, ButtonIcon);
				const iconClass = {
					left: '--with-left-icon',
					right: '--with-right-icon'
				}[iconPosition] ?? '';
				main_core.Dom.removeClass(this.getContainer(), '--with-icon');
				main_core.Dom.toggleClass(this.getContainer(), ['ui-icon-set__scope', iconClass], Boolean(icon));
				if (this.isInputType() && this.getIcon() !== null) {
					throw new Error('BX.UI.Button: Input type button cannot have an icon.');
				}
				return this;
			}
		}, {
			key: "setCollapsedIcon",
			value: function setCollapsedIcon(icon) {
				this.setProperty('icon', icon, ButtonIcon);
				main_core.Dom.toggleClass(this.getContainer(), ['ui-icon-set__scope', '--with-collapsed-icon'], Boolean(icon));
			}
		}, {
			key: "getIcon",
			value: function getIcon() {
				return this.icon;
			}
		}, {
			key: "setState",
			value: function setState(state) {
				return this.setProperty('state', state, ButtonState);
			}
		}, {
			key: "getState",
			value: function getState() {
				return this.state;
			}
		}, {
			key: "setNoCaps",
			value: function setNoCaps(noCaps = true) {
				main_core.Dom.toggleClass(this.getContainer(), ButtonStyle.NO_CAPS, noCaps);
				return this;
			}
		}, {
			key: "isNoCaps",
			value: function isNoCaps() {
				return main_core.Dom.hasClass(this.getContainer(), ButtonStyle.NO_CAPS);
			}
		}, {
			key: "setRound",
			value: function setRound(round = true) {
				main_core.Dom.toggleClass(this.getContainer(), ButtonStyle.ROUND, round);
				return this;
			}
		}, {
			key: "isRound",
			value: function isRound() {
				return main_core.Dom.hasClass(this.getContainer(), ButtonStyle.ROUND);
			}
		}, {
			key: "setDependOnTheme",
			value: function setDependOnTheme(dependOnTheme = true) {
				main_core.Dom.toggleClass(this.getContainer(), ButtonStyle.DEPEND_ON_THEME, dependOnTheme);
				return this;
			}
		}, {
			key: "setDropdown",
			value: function setDropdown(dropdown = true) {
				main_core.Dom.toggleClass(this.getContainer(), ButtonStyle.DROPDOWN, dropdown);
				return this;
			}
		}, {
			key: "isDropdown",
			value: function isDropdown() {
				return main_core.Dom.hasClass(this.getContainer(), ButtonStyle.DROPDOWN);
			}
		}, {
			key: "setCollapsed",
			value: function setCollapsed(collapsed = true) {
				const isAirWithoutText = this.hasAirDesign() && !this.getText();
				main_core.Dom.toggleClass(this.getContainer(), ButtonStyle.COLLAPSED, collapsed || isAirWithoutText);
				return this;
			}
		}, {
			key: "isCollapsed",
			value: function isCollapsed() {
				return main_core.Dom.hasClass(this.getContainer(), ButtonStyle.COLLAPSED);
			}

			// works only with air buttons
		}, {
			key: "setLeftCorners",
			value: function setLeftCorners(withLeftCorners = true) {
				main_core.Dom.toggleClass(this.getContainer(), '--remove-left-corners', !withLeftCorners);
				return this;
			}

			// works only with air buttons
		}, {
			key: "setRightCorners",
			value: function setRightCorners(withRightCorners = true) {
				main_core.Dom.toggleClass(this.getContainer(), '--remove-right-corners', !withRightCorners);
				return this;
			}

			/**
			 * @protected
			 */
		}, {
			key: "setMenu",
			value: function setMenu(options) {
				if (main_core.Type.isPlainObject(options) && main_core.Type.isArray(options.items) && options.items.length > 0) {
					this.setMenu(false);
					this.menuWindow = new main_popup.Menu({
						id: `ui-btn-menu-${main_core.Text.getRandom().toLowerCase()}`,
						bindElement: this.getMenuBindElement(),
						...options
					});
					this.menuWindow.getPopupWindow().subscribe('onClose', this.handleMenuClose);
					main_core.Event.bind(this.getMenuClickElement(), 'click', this.handleMenuClick);
				} else if (options === false && this.menuWindow !== null) {
					this.menuWindow.close();
					this.menuWindow.getPopupWindow().unsubscribe('onClose', this.handleMenuClose);
					main_core.Event.unbind(this.getMenuClickElement(), 'click', this.handleMenuClick);
					this.menuWindow.destroy();
					this.menuWindow = null;
				}
				return this;
			}
		}, {
			key: "getMenuBindElement",
			value: function getMenuBindElement() {
				return this.getContainer();
			}
		}, {
			key: "getMenuClickElement",
			value: function getMenuClickElement() {
				return this.getContainer();
			}

			/**
			 * @protected
			 */
		}, {
			key: "handleMenuClick",
			value: function handleMenuClick(event) {
				this.getMenuWindow().show();
				this.setActive(this.getMenuWindow().getPopupWindow().isShown());
			}
		}, {
			key: "setAirDesign",
			value: function setAirDesign(use) {
				_superPropGet$2(Button, "setAirDesign", this)([use]);
				const isButtonInOldFormat = !this.getContainer()?.querySelector('.ui-btn-text-inner');
				if (this.hasAirDesign() && isButtonInOldFormat) {
					main_core.Dom.remove(this.textNode);
					this.textNode = null;
					this.setText(this.getText());
				}
			}

			/**
			 * @protected
			 */
		}, {
			key: "handleMenuClose",
			value: function handleMenuClose() {
				this.setActive(false);
			}
		}, {
			key: "getMenuWindow",
			value: function getMenuWindow() {
				return this.menuWindow;
			}
		}, {
			key: "setId",
			value: function setId(id) {
				if (main_core.Type.isStringFilled(id) || main_core.Type.isNull(id)) {
					this.id = id;
				}
				return this;
			}
		}, {
			key: "getId",
			value: function getId() {
				return this.id;
			}
		}, {
			key: "setActive",
			value: function setActive(active = true) {
				return this.setState(active ? ButtonState.ACTIVE : null);
			}
		}, {
			key: "isActive",
			value: function isActive() {
				return this.getState() === ButtonState.ACTIVE;
			}
		}, {
			key: "setHovered",
			value: function setHovered(hovered = true) {
				return this.setState(hovered ? ButtonState.HOVER : null);
			}
		}, {
			key: "isHover",
			value: function isHover() {
				return this.getState() === ButtonState.HOVER;
			}
		}, {
			key: "setDisabled",
			value: function setDisabled(disabled = true) {
				this.setState(disabled ? ButtonState.DISABLED : null);
				_superPropGet$2(Button, "setDisabled", this)([disabled]);
				return this;
			}
		}, {
			key: "isDisabled",
			value: function isDisabled() {
				return this.getState() === ButtonState.DISABLED;
			}
		}, {
			key: "setWaiting",
			value: function setWaiting(waiting = true) {
				this.setState(waiting ? ButtonState.WAITING : null);
				this.setProps({
					disabled: waiting ? true : null
				});
				return this;
			}
		}, {
			key: "isWaiting",
			value: function isWaiting() {
				return this.getState() === ButtonState.WAITING;
			}
		}, {
			key: "setClocking",
			value: function setClocking(clocking = true) {
				this.setState(clocking ? ButtonState.CLOCKING : null);
				this.setProps({
					disabled: clocking ? true : null
				});
				return this;
			}
		}, {
			key: "isClocking",
			value: function isClocking() {
				return this.getState() === ButtonState.CLOCKING;
			}

			/**
			 * @protected
			 */
		}, {
			key: "setProperty",
			value: function setProperty(property, value, enumeration) {
				if (this.isEnumValue(value, enumeration)) {
					main_core.Dom.removeClass(this.getContainer(), this[property]);
					main_core.Dom.addClass(this.getContainer(), value);
					this[property] = value;
				} else if (value === null) {
					main_core.Dom.removeClass(this.getContainer(), this[property]);
					this[property] = null;
				}
				return this;
			}
		}, {
			key: "setContext",
			value: function setContext(context) {
				if (!main_core.Type.isUndefined(context)) {
					this.context = context;
				}
				return this;
			}
		}, {
			key: "getContext",
			value: function getContext() {
				return this.context;
			}
		}, {
			key: "setWide",
			value: function setWide(isWide) {
				_classPrivateFieldSet(_isWide, this, isWide === true);
				main_core.Dom.toggleClass(this.getContainer(), '--wide', _classPrivateFieldGet(_isWide, this));
				return this;
			}
		}, {
			key: "isWide",
			value: function isWide() {
				return _classPrivateFieldGet(_isWide, this);
			}

			// This method works only with useAirDesign: true option
		}, {
			key: "setStyle",
			value: function setStyle(style) {
				if (this.hasAirDesign() === false) {
					console.warn('Style option works only with air buttons.');
					return;
				}
				if (Object.values(AirButtonStyle).includes(style) === false) {
					console.warn('Undefined style option. Use value from AirButtonStyle');
					return;
				}
				main_core.Dom.removeClass(this.getContainer(), _classPrivateFieldGet(_style, this));
				main_core.Dom.addClass(this.getContainer(), style);
				_classPrivateFieldSet(_style, this, style);
			}
		}, {
			key: "getStyle",
			value: function getStyle() {
				return _classPrivateFieldGet(_style, this);
			}
		}, {
			key: "setLeftCounter",
			value: function setLeftCounter(options) {
				_superPropGet$2(Button, "setLeftCounter", this)([this.prepareCounterOptions(options)]);
				return this;
			}
		}, {
			key: "setRightCounter",
			value: function setRightCounter(options) {
				_superPropGet$2(Button, "setRightCounter", this)([this.prepareCounterOptions(options)]);
				return this;
			}

			/**
			 * @protected
			 */
		}, {
			key: "prepareCounterOptions",
			value: function prepareCounterOptions(options) {
				if (!options) {
					return null;
				}
				return {
					...options,
					...(this.getSize() ? {
						size: this.getSize()
					} : {})
				};
			}
		}, {
			key: "startShimmer",
			value: function startShimmer() {
				const highlighter = main_core.Tag.render`<span class="ui-button__shimmer"></span>`;
				main_core.Dom.append(highlighter, this.getContainer());
			}
		}, {
			key: "stopShimmer",
			value: function stopShimmer() {
				const highlighter = this.getContainer().querySelector('.ui-button__shimmer');
				main_core.Dom.remove(highlighter);
			}
		}]);
	}(BaseButton);
	babelHelpers.defineProperty(Button, "BASE_CLASS", 'ui-btn');
	babelHelpers.defineProperty(Button, "Size", ButtonSize);
	babelHelpers.defineProperty(Button, "Color", ButtonColor);
	babelHelpers.defineProperty(Button, "State", ButtonState);
	babelHelpers.defineProperty(Button, "Icon", ButtonIcon);
	babelHelpers.defineProperty(Button, "Tag", ButtonTag);
	babelHelpers.defineProperty(Button, "Style", ButtonStyle);
	babelHelpers.defineProperty(Button, "AirStyle", AirButtonStyle);

	/**
	 * @namespace {BX.UI}
	 */
	let SplitButtonState = /*#__PURE__*/babelHelpers.createClass(function SplitButtonState() {
		babelHelpers.classCallCheck(this, SplitButtonState);
	});
	babelHelpers.defineProperty(SplitButtonState, "HOVER", 'ui-btn-hover');
	babelHelpers.defineProperty(SplitButtonState, "MAIN_HOVER", 'ui-btn-main-hover');
	babelHelpers.defineProperty(SplitButtonState, "MENU_HOVER", 'ui-btn-menu-hover');
	babelHelpers.defineProperty(SplitButtonState, "ACTIVE", 'ui-btn-active');
	babelHelpers.defineProperty(SplitButtonState, "MAIN_ACTIVE", 'ui-btn-main-active');
	babelHelpers.defineProperty(SplitButtonState, "MENU_ACTIVE", 'ui-btn-menu-active');
	babelHelpers.defineProperty(SplitButtonState, "DISABLED", 'ui-btn-disabled');
	babelHelpers.defineProperty(SplitButtonState, "MAIN_DISABLED", 'ui-btn-main-disabled');
	babelHelpers.defineProperty(SplitButtonState, "MENU_DISABLED", 'ui-btn-menu-disabled');
	babelHelpers.defineProperty(SplitButtonState, "CLOCKING", 'ui-btn-clock');
	babelHelpers.defineProperty(SplitButtonState, "WAITING", 'ui-btn-wait');
	babelHelpers.defineProperty(SplitButtonState, "AI_WAITING", 'ui-btn-ai-waiting');

	/**
	 * @namespace {BX.UI}
	 */
	let SplitSubButtonType = /*#__PURE__*/babelHelpers.createClass(function SplitSubButtonType() {
		babelHelpers.classCallCheck(this, SplitSubButtonType);
	});
	babelHelpers.defineProperty(SplitSubButtonType, "MAIN", 'ui-btn-main');
	babelHelpers.defineProperty(SplitSubButtonType, "MENU", 'ui-btn-menu');
	babelHelpers.defineProperty(SplitSubButtonType, "SWITCHER", 'ui-btn-switcher');

	function _callSuper$g(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$g() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$g() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$g = function () { return !!t; })(); }
	function _superPropGet$1(t, o, e, r) { var p = babelHelpers.get(babelHelpers.getPrototypeOf(t.prototype ), o, e); return 2 & r && "function" == typeof p ? function (t) { return p.apply(e, t); } : p; }
	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _assertClassBrand$1(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _SplitSubButton_brand = /*#__PURE__*/new WeakSet();
	/**
	 * @namespace {BX.UI}
	 */
	let SplitSubButton = /*#__PURE__*/function (_BaseButton) {
		function SplitSubButton(options) {
			var _this;
			babelHelpers.classCallCheck(this, SplitSubButton);
			options = main_core.Type.isPlainObject(options) ? options : {};
			options.baseClass = options.buttonType === SplitSubButtonType.MAIN ? SplitSubButtonType.MAIN : SplitSubButtonType.MENU;
			if (options.buttonType === SplitSubButtonType.SWITCHER) {
				options.baseClass += ' --switcher';
			}
			_this = _callSuper$g(this, SplitSubButton, [options]);
			_classPrivateMethodInitSpec(_this, _SplitSubButton_brand);
			if (_this.isSwitcherButton()) {
				const additionalSwitcherOptions = main_core.Type.isPlainObject(_this.options.switcherOptions) ? _this.options.switcherOptions : {};
				_assertClassBrand$1(_SplitSubButton_brand, _this, _initSwitcher).call(_this, {
					...additionalSwitcherOptions,
					size: _this.options.switcherOptions.size,
					useAirDesign: _this.options.switcherOptions.useAirDesign === true
				});
			}
			if (_this.isInputType()) {
				throw new Error('BX.UI.SplitSubButton: Split button cannot be an input tag.');
			}
			return _this;
		}
		babelHelpers.inherits(SplitSubButton, _BaseButton);
		return babelHelpers.createClass(SplitSubButton, [{
			key: "init",
			value: function init() {
				this.buttonType = this.options.buttonType;
				this.splitButton = this.options.splitButton;
				_superPropGet$1(SplitSubButton, "init", this, 3)([]);
			}

			/**
			 * @public
			 * @return {SplitButton}
			 */
		}, {
			key: "getSplitButton",
			value: function getSplitButton() {
				return this.splitButton;
			}

			/**
			 * @public
			 * @return {boolean}
			 */
		}, {
			key: "isMainButton",
			value: function isMainButton() {
				return this.buttonType === SplitSubButtonType.MAIN;
			}

			/**
			 * @public
			 * @return {boolean}
			 */
		}, {
			key: "isMenuButton",
			value: function isMenuButton() {
				return this.buttonType === SplitSubButtonType.MENU;
			}
		}, {
			key: "isSwitcherButton",
			value: function isSwitcherButton() {
				return this.buttonType === SplitSubButtonType.SWITCHER;
			}
		}, {
			key: "setText",
			value: function setText(text) {
				if (main_core.Type.isString(text) && this.isMenuButton()) {
					throw new Error('BX.UI.SplitButton: a menu button doesn\'t support a text caption.');
				}
				return _superPropGet$1(SplitSubButton, "setText", this, 3)([text]);
			}
		}, {
			key: "getContainer",
			value: function getContainer() {
				const container = _superPropGet$1(SplitSubButton, "getContainer", this, 3)([]);
				if (this.isSwitcherButton()) {
					main_core.Dom.attr(this.button, 'tabindex', -1);
				}
				return container;
			}
		}, {
			key: "setDisabled",
			value:
			/**
			 * @public
			 * @param {boolean} [flag=true]
			 * @return {this}
			 */
			function setDisabled(flag) {
				this.toggleState(flag, SplitButtonState.DISABLED, SplitButtonState.MAIN_DISABLED, SplitButtonState.MENU_DISABLED);
				if (flag) {
					this.getSwitcher()?.disable();
				}
				_superPropGet$1(SplitSubButton, "setDisabled", this, 3)([flag]);
				return this;
			}

			/**
			 * @public
			 * @param {boolean} flag
			 * @return {this}
			 */
		}, {
			key: "getSwitcher",
			value: function getSwitcher() {
				return this.switcher;
			}

			/**
			 * @public
			 * @param {boolean} [flag=true]
			 * @return {this}
			 */
		}, {
			key: "setActive",
			value: function setActive(flag) {
				this.toggleState(flag, SplitButtonState.ACTIVE, SplitButtonState.MAIN_ACTIVE, SplitButtonState.MENU_ACTIVE);
				return this;
			}

			/**
			 * @public
			 * @return {boolean}
			 */
		}, {
			key: "isActive",
			value: function isActive() {
				const state = this.getSplitButton().getState();
				if (state === SplitButtonState.ACTIVE) {
					return true;
				}
				if (this.isMainButton()) {
					return state === SplitButtonState.MAIN_ACTIVE;
				}
				return state === SplitButtonState.MENU_ACTIVE;
			}
		}, {
			key: "setHovered",
			value: function setHovered(flag) {
				this.toggleState(flag, SplitButtonState.HOVER, SplitButtonState.MAIN_HOVER, SplitButtonState.MENU_HOVER);
				return this;
			}

			/**
			 * @public
			 * @return {boolean}
			 */
		}, {
			key: "isHovered",
			value: function isHovered() {
				const state = this.getSplitButton().getState();
				if (state === SplitButtonState.HOVER) {
					return true;
				}
				if (this.isMainButton()) {
					return state === SplitButtonState.MAIN_HOVER;
				}
				return state === SplitButtonState.MENU_HOVER;
			}

			/**
			 * @private
			 * @param flag
			 * @param globalState
			 * @param mainState
			 * @param menuState
			 */
		}, {
			key: "toggleState",
			value: function toggleState(flag, globalState, mainState, menuState) {
				const state = this.getSplitButton().getState();
				if (flag === false) {
					if (state === globalState) {
						this.getSplitButton().setState(this.isMainButton() ? menuState : mainState);
					} else {
						this.getSplitButton().setState(null);
					}
				} else {
					if (state === mainState && this.isMenuButton()) {
						this.getSplitButton().setState(globalState);
					} else if (state === menuState && this.isMainButton()) {
						this.getSplitButton().setState(globalState);
					} else if (state !== globalState) {
						this.getSplitButton().setState(this.isMainButton() ? mainState : menuState);
					}
				}
			}
		}]);
	}(BaseButton);
	function _renderSwitcher(container) {
		main_core.Dom.clean(container);
		return this.switcher?.renderTo(container);
	}
	function _initSwitcher(switcherOptions = {}) {
		if (switcherOptions.node) {
			this.switcher = new ui_switcher.Switcher({
				node: switcherOptions.node,
				checked: main_core.Dom.hasClass(switcherOptions.node, ui_switcher.Switcher.classNameOff) === false
			});
			return;
		}
		this.switcher = new ui_switcher.Switcher({
			size: ui_switcher.SwitcherSize.medium,
			color: ui_switcher.SwitcherColor.green,
			style: ui_switcher.AirSwitcherStyle.FILLED,
			...switcherOptions
		});
		_assertClassBrand$1(_SplitSubButton_brand, this, _renderSwitcher).call(this, this.getContainer(), switcherOptions);
		main_core.Dom.attr(this.getContainer(), 'tabindex', -1);
	}
	babelHelpers.defineProperty(SplitSubButton, "Type", SplitSubButtonType);

	const switcherSizeByButton = Object.freeze({
		[ButtonSize.EXTRA_LARGE]: ui_switcher.SwitcherSize.large,
		[ButtonSize.LARGE]: ui_switcher.SwitcherSize.medium,
		[ButtonSize.MEDIUM]: ui_switcher.SwitcherSize.small,
		[ButtonSize.SMALL]: ui_switcher.SwitcherSize.extraSmall,
		[ButtonSize.EXTRA_SMALL]: ui_switcher.SwitcherSize.extraSmall,
		[ButtonSize.EXTRA_EXTRA_SMALL]: ui_switcher.SwitcherSize.extraExtraSmall
	});
	const getSwitcherSizeByButtonSize = buttonSize => {
		return switcherSizeByButton[buttonSize];
	};

	function _callSuper$f(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$f() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$f() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$f = function () { return !!t; })(); }
	function _superPropGet(t, o, e, r) { var p = babelHelpers.get(babelHelpers.getPrototypeOf(t.prototype ), o, e); return "function" == typeof p ? function (t) { return p.apply(e, t); } : p; }
	/**
	 * @namespace {BX.UI}
	 */
	let SplitButton = /*#__PURE__*/function (_Button) {
		function SplitButton(options) {
			babelHelpers.classCallCheck(this, SplitButton);
			options = main_core.Type.isPlainObject(options) ? options : {};
			if (main_core.Type.isStringFilled(options.link)) {
				options.mainButton = main_core.Type.isPlainObject(options.mainButton) ? options.mainButton : {};
				options.mainButton.link = options.link;
				delete options.link;
			}
			options.tag = ButtonTag.DIV;
			options.baseClass = SplitButton.BASE_CLASS;
			return _callSuper$f(this, SplitButton, [options]);
		}
		babelHelpers.inherits(SplitButton, _Button);
		return babelHelpers.createClass(SplitButton, [{
			key: "init",
			value: function init() {
				const mainOptions = main_core.Type.isPlainObject(this.options.mainButton) ? this.options.mainButton : {};
				const menuOptions = main_core.Type.isPlainObject(this.options.menuButton) ? this.options.menuButton : {};
				mainOptions.buttonType = SplitSubButtonType.MAIN;
				mainOptions.splitButton = this;
				menuOptions.buttonType = SplitSubButtonType.MENU;
				menuOptions.splitButton = this;
				this.mainButton = new SplitSubButton({
					...mainOptions,
					useAirDesign: this.options.useAirDesign,
					style: this.options.style
				});
				this.menuButton = new SplitSubButton(menuOptions);
				this.menuTarget = SplitSubButtonType.MAIN;
				if (this.options.menuTarget === SplitSubButtonType.MENU) {
					this.menuTarget = SplitSubButtonType.MENU;
				}
				if (main_core.Type.isPlainObject(this.options.switcher) || this.options.switcher === true) {
					const addSwitcherOptions = main_core.Type.isPlainObject(this.options.switcher) ? this.options.switcher : {};
					const buttonSize = main_core.Type.isStringFilled(this.options.size) ? this.options.size : ButtonSize.MEDIUM;
					this.switcherButton = new SplitSubButton({
						buttonType: SplitSubButtonType.SWITCHER,
						splitButton: this,
						switcherOptions: {
							...addSwitcherOptions,
							disabled: this.options.disabled,
							size: getSwitcherSizeByButtonSize(buttonSize),
							useAirDesign: this.options.useAirDesign === true
						}
					});
				}
				_superPropGet(SplitButton, "init", this)([]);
			}
		}, {
			key: "getContainer",
			value: function getContainer() {
				this.button ??= main_core.Tag.render`
			<div class="${this.getBaseClass()}">
				${this.getMainButton().getContainer()}
				${(this.getSwitcherButton() ?? this.getMenuButton()).getContainer()}
			</div>
		`;
				return this.button;
			}
		}, {
			key: "getMainButton",
			value: function getMainButton() {
				return this.mainButton;
			}
		}, {
			key: "getMenuButton",
			value: function getMenuButton() {
				return this.menuButton;
			}
		}, {
			key: "getSwitcherButton",
			value: function getSwitcherButton() {
				return this.switcherButton;
			}
		}, {
			key: "getSwitcher",
			value: function getSwitcher() {
				return this.getSwitcherButton()?.getSwitcher();
			}
		}, {
			key: "setAirDesign",
			value: function setAirDesign(use) {
				_superPropGet(SplitButton, "setAirDesign", this)([use]);
				this.getSwitcher()?.setAirDesign(use);
			}
		}, {
			key: "setText",
			value: function setText(text) {
				if (main_core.Type.isString(text)) {
					this.getMainButton().setText(text);
				}
				return this;
			}
		}, {
			key: "getText",
			value: function getText() {
				return this.getMainButton().getText();
			}
		}, {
			key: "setCounter",
			value: function setCounter(counter) {
				return this.getMainButton().setCounter(counter);
			}

			// use only with air buttons
		}, {
			key: "setLeftCounter",
			value: function setLeftCounter(options) {
				this.getMainButton().setLeftCounter(this.prepareCounterOptions(options));
				return this;
			}

			// use only with air buttons
		}, {
			key: "setRightCounter",
			value: function setRightCounter(options) {
				this.getMainButton().setRightCounter(this.prepareCounterOptions(options));
				return this;
			}
		}, {
			key: "getCounter",
			value: function getCounter() {
				return this.getMainButton().getCounter();
			}
		}, {
			key: "setLink",
			value: function setLink(link) {
				return this.getMainButton().setLink(link);
			}
		}, {
			key: "getLink",
			value: function getLink() {
				return this.getMainButton().getLink();
			}
		}, {
			key: "setState",
			value: function setState(state) {
				return this.setProperty('state', state, SplitButtonState);
			}
		}, {
			key: "setDisabled",
			value: function setDisabled(disabled = true) {
				this.setState(disabled ? ButtonState.DISABLED : null);
				this.getMainButton().setDisabled(disabled);
				this.getMenuButton()?.setDisabled(disabled);
				this.getSwitcherButton()?.setDisabled(disabled);
				return this;
			}

			/**
			 * @protected
			 */
		}, {
			key: "getMenuBindElement",
			value: function getMenuBindElement() {
				if (this.getMenuTarget() === SplitSubButtonType.MENU) {
					return this.getMenuButton().getContainer();
				}
				return this.getContainer();
			}

			/**
			 * @protected
			 */
		}, {
			key: "handleMenuClick",
			value: function handleMenuClick(event) {
				this.getMenuWindow().show();
				const isActive = this.getMenuWindow().getPopupWindow().isShown();
				this.getMenuButton().setActive(isActive);
			}

			/**
			 * @protected
			 */
		}, {
			key: "handleMenuClose",
			value: function handleMenuClose() {
				this.getMenuButton().setActive(false);
			}

			/**
			 * @protected
			 */
		}, {
			key: "getMenuClickElement",
			value: function getMenuClickElement() {
				return this.getMenuButton().getContainer();
			}
		}, {
			key: "getMenuTarget",
			value: function getMenuTarget() {
				return this.menuTarget;
			}
		}, {
			key: "setDropdown",
			value: function setDropdown(dropdown = true) {
				return this;
			}
		}, {
			key: "isDropdown",
			value: function isDropdown() {
				return true;
			}
		}]);
	}(Button);
	babelHelpers.defineProperty(SplitButton, "BASE_CLASS", 'ui-btn-split');
	babelHelpers.defineProperty(SplitButton, "State", SplitButtonState);

	var _ButtonManager;
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	let ButtonManager = /*#__PURE__*/function () {
		function ButtonManager() {
			babelHelpers.classCallCheck(this, ButtonManager);
		}
		return babelHelpers.createClass(ButtonManager, null, [{
			key: "createFromNode",
			value:
			/**
			 * @public
			 * @param {HTMLButtonElement | HTMLAnchorElement | HTMLInputElement} node
			 * @return {Button | SplitButton}
			 */
			function createFromNode(node) {
				if (!main_core.Type.isDomNode(node)) {
					throw new Error('BX.UI.ButtonManager.createFromNode: "node" must be a DOM node.');
				}
				if (!main_core.Dom.hasClass(node, Button.BASE_CLASS) && !main_core.Dom.hasClass(node, SplitButton.BASE_CLASS)) {
					throw new Error('BX.UI.ButtonManager.createFromNode: "node" is not a button.');
				}
				const isSplitButton = main_core.Dom.hasClass(node, SplitButton.BASE_CLASS);
				let tag = null;
				let text = null;
				let textNode = null;
				let counterNode = null;
				let switcherNode = null;
				let disabled = false;
				let mainButtonOptions = {};
				let menuButtonOptions = {};
				if (isSplitButton) {
					const mainButton = node.querySelector(`.${SplitSubButtonType.MAIN}`);
					const menuButton = node.querySelector(`.${SplitSubButtonType.MENU}`);
					if (!mainButton) {
						throw new Error('BX.UI.ButtonManager.createFromNode: a split button doesn\'t have a main button.');
					}
					if (!menuButton) {
						throw new Error('BX.UI.ButtonManager.createFromNode: a split button doesn\'t have a menu button.');
					}
					const mainButtonTag = _assertClassBrand(ButtonManager, this, _getTag).call(this, mainButton);
					if (mainButtonTag === ButtonTag.INPUT || mainButtonTag === ButtonTag.SUBMIT) {
						text = mainButton.value;
					} else {
						[textNode, counterNode] = _assertClassBrand(ButtonManager, this, _getTextNode).call(this, mainButton);
						text = textNode.textContent;
					}
					disabled = main_core.Dom.hasClass(node, SplitButtonState.DISABLED);
					mainButtonOptions = {
						tag: mainButtonTag,
						textNode,
						counterNode,
						buttonNode: mainButton,
						disabled: main_core.Dom.hasClass(node, SplitButtonState.MAIN_DISABLED)
					};
					menuButtonOptions = {
						tag: _assertClassBrand(ButtonManager, this, _getTag).call(this, menuButton),
						buttonNode: menuButton,
						textNode: null,
						counterNode: null,
						disabled: main_core.Dom.hasClass(node, SplitButtonState.MENU_DISABLED)
					};
					switcherNode = menuButton.querySelector(`.${ui_switcher.Switcher.className}`) || null;
				} else {
					tag = _assertClassBrand(ButtonManager, this, _getTag).call(this, node);
					if (tag === null) {
						throw new Error('BX.UI.ButtonManager.createFromNode: "node" must be a button, link or input.');
					}
					disabled = main_core.Dom.hasClass(node, ButtonState.DISABLED);
					if (tag === ButtonTag.INPUT || tag === ButtonTag.SUBMIT) {
						text = node.value;
					} else {
						[textNode, counterNode] = _assertClassBrand(ButtonManager, this, _getTextNode).call(this, node);
						text = _assertClassBrand(ButtonManager, this, _getTextNodeValue).call(this, textNode);
					}
				}
				const useAirDesign = main_core.Dom.hasClass(node, '--air');
				const options = {
					useAirDesign,
					id: node.dataset.btnUniqid,
					buttonNode: node,
					textNode: isSplitButton ? null : textNode,
					counterNode: isSplitButton ? null : counterNode,
					counter: _assertClassBrand(ButtonManager, this, _getCounter).call(this, counterNode),
					tag,
					text,
					disabled,
					mainButton: mainButtonOptions,
					menuButton: menuButtonOptions,
					size: _assertClassBrand(ButtonManager, this, _getEnumProp).call(this, node, ButtonSize),
					color: _assertClassBrand(ButtonManager, this, _getEnumProp).call(this, node, ButtonColor),
					state: _assertClassBrand(ButtonManager, this, _getEnumProp).call(this, node, isSplitButton ? SplitButtonState : ButtonState),
					noCaps: main_core.Dom.hasClass(node, ButtonStyle.NO_CAPS),
					round: main_core.Dom.hasClass(node, ButtonStyle.ROUND),
					dependOnTheme: main_core.Dom.hasClass(node, ButtonStyle.DEPEND_ON_THEME),
					style: _assertClassBrand(ButtonManager, this, _getEnumProp).call(this, node, AirButtonStyle),
					switcher: isSplitButton ? {
						node: switcherNode
					} : null
				};
				if (main_core.Dom.hasClass(node, '--with-collapsed-icon') && _assertClassBrand(ButtonManager, this, _getEnumProp).call(this, node, ButtonIcon)) {
					options.collapsedIcon = _assertClassBrand(ButtonManager, this, _getEnumProp).call(this, node, ButtonIcon);
				} else if (_assertClassBrand(ButtonManager, this, _getEnumProp).call(this, node, ButtonIcon)) {
					options.icon = _assertClassBrand(ButtonManager, this, _getEnumProp).call(this, node, ButtonIcon);
				}
				if (useAirDesign) {
					options.counterNode = undefined;
					if (_assertClassBrand(ButtonManager, this, _getCounter).call(this, counterNode)) {
						options.rightCounter = {
							value: _assertClassBrand(ButtonManager, this, _getCounter).call(this, counterNode),
							style: _assertClassBrand(ButtonManager, this, _getCounterStyle).call(this, counterNode)
						};
						options.counterNode = undefined;
						options.counter = undefined;
						if (main_core.Dom.hasClass(counterNode?.parentElement, 'ui-btn-right-counter')) {
							main_core.Dom.remove(counterNode?.parentElement);
						}
						main_core.Dom.remove(counterNode);
					}
				}
				const nodeOptions = main_core.Dom.attr(node, 'data-json-options') || {};
				if (main_core.Dom.hasClass(node, ButtonStyle.DROPDOWN)) {
					options.dropdown = true;
				} else if (nodeOptions.dropdown === false) {
					options.dropdown = false;
				}
				if (nodeOptions.onclick) {
					options.onclick = _assertClassBrand(ButtonManager, this, _convertEventHandler).call(this, nodeOptions.onclick);
				}
				if (main_core.Type.isPlainObject(nodeOptions.events)) {
					options.events = nodeOptions.events;
					_assertClassBrand(ButtonManager, this, _convertEvents).call(this, options.events);
				}
				if (main_core.Type.isPlainObject(nodeOptions.menu)) {
					options.menu = nodeOptions.menu;
					_assertClassBrand(ButtonManager, this, _convertMenuEvents).call(this, options.menu.items);
				}
				['mainButton', 'menuButton'].forEach(button => {
					if (!main_core.Type.isPlainObject(nodeOptions[button])) {
						return;
					}
					options[button] = main_core.Runtime.merge(options[button], nodeOptions[button]);
					if (options[button].onclick) {
						options[button].onclick = _assertClassBrand(ButtonManager, this, _convertEventHandler).call(this, options[button].onclick);
					}
					_assertClassBrand(ButtonManager, this, _convertEvents).call(this, options[button].events);
				});
				if (main_core.Type.isStringFilled(nodeOptions.menuTarget)) {
					options.menuTarget = nodeOptions.menuTarget;
				}
				return isSplitButton ? new SplitButton(options) : new Button(options);
			}
		}, {
			key: "createByUniqId",
			value: function createByUniqId(id) {
				if (!main_core.Type.isStringFilled(id)) {
					return null;
				}
				const node = document.querySelector(`[data-btn-uniqid="${id}"]`);
				return node ? this.createFromNode(node) : null;
			}

			/**
			 * @private
			 * @param {HTMLElement} node
			 * @return {null|number}
			 */
		}, {
			key: "getByUniqid",
			value:
			/**
			 * @deprecated
			 * @param uniqId
			 * @return {null|*}
			 */
			function getByUniqid(uniqId) {
				const ToolbarManager = main_core.Reflection.getClass('BX.UI.ToolbarManager');
				const toolbar = ToolbarManager?.getDefaultToolbar();
				return toolbar ? toolbar.getButton(uniqId) : null;
			}
		}]);
	}();
	_ButtonManager = ButtonManager;
	function _getTag(node) {
		if (node.nodeName === 'A') {
			return ButtonTag.LINK;
		} else if (node.nodeName === 'BUTTON') {
			return ButtonTag.BUTTON;
		} else if (node.nodeName === 'INPUT' && node.type === 'button') {
			return ButtonTag.INPUT;
		} else if (node.nodeName === 'INPUT' && node.type === 'submit') {
			return ButtonTag.SUBMIT;
		}
		return null;
	}
	/**
	 * @private
	 * @param {HTMLElement} node
	 */
	function _getTextNode(node) {
		let textNode = node.querySelector('.ui-btn-text');
		const counterNode = node.querySelector('.ui-btn-counter') || node.querySelector('.ui-counter');
		const isAirButton = main_core.Dom.hasClass(node, '--air');
		if (!textNode) {
			if (counterNode) {
				main_core.Dom.remove(counterNode);
			}
			if (isAirButton) {
				textNode = main_core.Tag.render`<span class="ui-btn-text">${_assertClassBrand(_ButtonManager, this, _getTextNodeValue).call(this, textNode)}</span>`;
			} else {
				textNode = main_core.Tag.render`<span class="ui-btn-text">${node.innerHTML.trim()}</span>`;
			}
			main_core.Dom.clean(node);
			main_core.Dom.append(textNode, node);
			if (counterNode) {
				main_core.Dom.append(counterNode, node);
			}
		}
		return [textNode, counterNode];
	}
	/**
	 * @private
	 * @param counterNode
	 * @return {null|any}
	 */
	function _getCounter(counterNode) {
		if (main_core.Type.isDomNode(counterNode) && main_core.Dom.hasClass(counterNode, ui_cnt.Counter.BaseClassname)) {
			const textContent = counterNode.querySelector('.ui-counter__value')?.innerText;
			const dataAttributeValue = main_core.Dom.attr(counterNode, 'data-value');
			const counter = Number(dataAttributeValue || textContent);
			return main_core.Type.isNumber(counter) ? counter : textContent;
		}
		if (main_core.Type.isDomNode(counterNode)) {
			const textContent = counterNode.textContent;
			const counter = Number(textContent);
			return main_core.Type.isNumber(counter) ? counter : textContent;
		}
		return null;
	}
	/**
	 * @private
	 * @param {HTMLElement} counterNode
	 * @return {string | null}
	 */
	function _getCounterStyle(counterNode) {
		if (!main_core.Type.isDomNode(counterNode)) {
			return null;
		}
		return _assertClassBrand(_ButtonManager, this, _getEnumProp).call(this, counterNode, ui_cnt.CounterStyle);
	}
	/**
	 * @private
	 * @param {HTMLElement} node
	 * @param {object} enumeration
	 * @return {null|*}
	 */
	function _getEnumProp(node, enumeration) {
		for (let key in enumeration) {
			if (!enumeration.hasOwnProperty(key)) {
				continue;
			}
			if (main_core.Dom.hasClass(node, enumeration[key])) {
				return enumeration[key];
			}
		}
		return null;
	}
	/**
	 * @private
	 * @param handler
	 * @return {Function}
	 */
	function _convertEventHandler(handler) {
		if (main_core.Type.isFunction(handler)) {
			return handler;
		}
		if (!main_core.Type.isObject(handler)) {
			throw new Error('BX.UI.ButtonManager.createFromNode: Event handler must be described as object or function.');
		}
		if (main_core.Type.isStringFilled(handler.code)) {
			return function () {
				// handle code can use callback arguments
				eval(handler.code);
			};
		} else if (main_core.Type.isStringFilled(handler.event)) {
			return function (...args) {
				let event;
				if (args[0] instanceof main_core_events.BaseEvent) {
					event = args[0];
				} else {
					if (args[0] instanceof BaseButton) {
						event = new main_core_events.BaseEvent({
							data: {
								button: args[0],
								event: args[1]
							}
						});
					} else if (args[1] instanceof main_popup.MenuItem) {
						event = new main_core_events.BaseEvent({
							data: {
								item: args[1],
								event: args[0]
							}
						});
					} else {
						event = new main_core_events.BaseEvent({
							data: args
						});
					}
				}
				main_core_events.EventEmitter.emit(handler.event, event);
			};
		} else if (main_core.Type.isStringFilled(handler.handler)) {
			return function (...args) {
				const fn = main_core.Reflection.getClass(handler.handler);
				if (main_core.Type.isFunction(fn)) {
					let context = this;
					if (main_core.Type.isStringFilled(handler.context)) {
						context = main_core.Reflection.getClass(handler.context);
					}
					return fn.apply(context, args);
				} else {
					console.warn(`BX.UI.ButtonManager.createFromNode: be aware, the handler ${handler.handler} is not a function.`);
				}
				return null;
			};
		}
		return null;
	}
	/**
	 * @private
	 * @param events
	 */
	function _convertEvents(events) {
		if (main_core.Type.isPlainObject(events)) {
			for (let [eventName, eventFn] of Object.entries(events)) {
				events[eventName] = _assertClassBrand(_ButtonManager, this, _convertEventHandler).call(this, eventFn);
			}
		}
	}
	/**
	 * @private
	 * @param items
	 */
	function _convertMenuEvents(items) {
		if (!main_core.Type.isArray(items)) {
			return;
		}
		items.forEach(item => {
			if (item.onclick) {
				item.onclick = _assertClassBrand(_ButtonManager, this, _convertEventHandler).call(this, item.onclick);
			}
			if (item.events) {
				_assertClassBrand(_ButtonManager, this, _convertEvents).call(this, item.events);
			}
			if (main_core.Type.isArray(item.items)) {
				_assertClassBrand(_ButtonManager, this, _convertMenuEvents).call(this, item.items);
			}
		});
	}
	function _getTextNodeValue(target) {
		if (!target) {
			return '';
		}
		if (target.querySelector('.ui-btn-text-inner')) {
			return target.querySelector('.ui-btn-text-inner')?.textContent || '';
		}
		const childNodes = target.childNodes;
		for (const node of childNodes) {
			if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
				return node.textContent.trim();
			}
		}
		return '';
	}

	/**
	 * @namespace {BX.UI}
	 */
	let IButton = /*#__PURE__*/function () {
		function IButton() {
			babelHelpers.classCallCheck(this, IButton);
		}
		return babelHelpers.createClass(IButton, [{
			key: "render",
			value: function render() {
				throw new Error('BX.UI.IButton: Must be implemented by a subclass');
			}
		}]);
	}();

	function _callSuper$e(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$e() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$e() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$e = function () { return !!t; })(); }

	/**
	 * @namespace {BX.UI}
	 */
	let AddButton = /*#__PURE__*/function (_Button) {
		function AddButton() {
			babelHelpers.classCallCheck(this, AddButton);
			return _callSuper$e(this, AddButton, arguments);
		}
		babelHelpers.inherits(AddButton, _Button);
		return babelHelpers.createClass(AddButton, [{
			key: "getDefaultOptions",
			value: function getDefaultOptions() {
				return {
					text: main_core.Loc.getMessage('UI_BUTTONS_ADD_BTN_TEXT'),
					color: ButtonColor.SUCCESS
				};
			}
		}]);
	}(Button);

	function _callSuper$d(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$d() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$d() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$d = function () { return !!t; })(); }

	/**
	 * @namespace {BX.UI}
	 */
	let ApplyButton = /*#__PURE__*/function (_Button) {
		function ApplyButton() {
			babelHelpers.classCallCheck(this, ApplyButton);
			return _callSuper$d(this, ApplyButton, arguments);
		}
		babelHelpers.inherits(ApplyButton, _Button);
		return babelHelpers.createClass(ApplyButton, [{
			key: "getDefaultOptions",
			value: function getDefaultOptions() {
				return {
					text: main_core.Loc.getMessage('UI_BUTTONS_APPLY_BTN_TEXT'),
					color: ButtonColor.LIGHT_BORDER
				};
			}
		}]);
	}(Button);

	function _callSuper$c(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$c() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$c() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$c = function () { return !!t; })(); }

	/**
	 * @namespace {BX.UI}
	 */
	let CancelButton = /*#__PURE__*/function (_Button) {
		function CancelButton() {
			babelHelpers.classCallCheck(this, CancelButton);
			return _callSuper$c(this, CancelButton, arguments);
		}
		babelHelpers.inherits(CancelButton, _Button);
		return babelHelpers.createClass(CancelButton, [{
			key: "getDefaultOptions",
			value: function getDefaultOptions() {
				return {
					text: main_core.Loc.getMessage('UI_BUTTONS_CANCEL_BTN_TEXT'),
					color: ButtonColor.LINK
				};
			}
		}]);
	}(Button);

	function _callSuper$b(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$b() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$b() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$b = function () { return !!t; })(); }

	/**
	 * @namespace {BX.UI}
	 */
	let CloseButton = /*#__PURE__*/function (_Button) {
		function CloseButton() {
			babelHelpers.classCallCheck(this, CloseButton);
			return _callSuper$b(this, CloseButton, arguments);
		}
		babelHelpers.inherits(CloseButton, _Button);
		return babelHelpers.createClass(CloseButton, [{
			key: "getDefaultOptions",
			value: function getDefaultOptions() {
				return {
					text: main_core.Loc.getMessage('UI_BUTTONS_CLOSE_BTN_TEXT'),
					color: ButtonColor.LINK
				};
			}
		}]);
	}(Button);

	function _callSuper$a(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$a() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$a() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$a = function () { return !!t; })(); }

	/**
	 * @namespace {BX.UI}
	 */
	let CreateButton = /*#__PURE__*/function (_Button) {
		function CreateButton() {
			babelHelpers.classCallCheck(this, CreateButton);
			return _callSuper$a(this, CreateButton, arguments);
		}
		babelHelpers.inherits(CreateButton, _Button);
		return babelHelpers.createClass(CreateButton, [{
			key: "getDefaultOptions",
			value: function getDefaultOptions() {
				return {
					text: main_core.Loc.getMessage('UI_BUTTONS_CREATE_BTN_TEXT'),
					color: ButtonColor.SUCCESS
				};
			}
		}]);
	}(Button);

	function _callSuper$9(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$9() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$9() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$9 = function () { return !!t; })(); }

	/**
	 * @namespace {BX.UI}
	 */
	let SaveButton = /*#__PURE__*/function (_Button) {
		function SaveButton() {
			babelHelpers.classCallCheck(this, SaveButton);
			return _callSuper$9(this, SaveButton, arguments);
		}
		babelHelpers.inherits(SaveButton, _Button);
		return babelHelpers.createClass(SaveButton, [{
			key: "getDefaultOptions",
			value: function getDefaultOptions() {
				return {
					text: main_core.Loc.getMessage('UI_BUTTONS_SAVE_BTN_TEXT'),
					color: ButtonColor.SUCCESS
				};
			}
		}]);
	}(Button);

	function _callSuper$8(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$8() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$8() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$8 = function () { return !!t; })(); }

	/**
	 * @namespace {BX.UI}
	 */
	let SendButton = /*#__PURE__*/function (_Button) {
		function SendButton() {
			babelHelpers.classCallCheck(this, SendButton);
			return _callSuper$8(this, SendButton, arguments);
		}
		babelHelpers.inherits(SendButton, _Button);
		return babelHelpers.createClass(SendButton, [{
			key: "getDefaultOptions",
			value: function getDefaultOptions() {
				return {
					text: main_core.Loc.getMessage('UI_BUTTONS_SEND_BTN_TEXT'),
					color: ButtonColor.SUCCESS
				};
			}
		}]);
	}(Button);

	function _callSuper$7(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$7() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$7() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$7 = function () { return !!t; })(); }

	/**
	 * @namespace {BX.UI}
	 */
	let SettingsButton = /*#__PURE__*/function (_Button) {
		function SettingsButton() {
			babelHelpers.classCallCheck(this, SettingsButton);
			return _callSuper$7(this, SettingsButton, arguments);
		}
		babelHelpers.inherits(SettingsButton, _Button);
		return babelHelpers.createClass(SettingsButton, [{
			key: "getDefaultOptions",
			value: function getDefaultOptions() {
				return {
					icon: ButtonIcon.SETTING,
					color: ButtonColor.LIGHT_BORDER,
					dropdown: false
				};
			}
		}]);
	}(Button);

	function _callSuper$6(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$6() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$6() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$6 = function () { return !!t; })(); }

	/**
	 * @namespace {BX.UI}
	 */
	let AddSplitButton = /*#__PURE__*/function (_SplitButton) {
		function AddSplitButton() {
			babelHelpers.classCallCheck(this, AddSplitButton);
			return _callSuper$6(this, AddSplitButton, arguments);
		}
		babelHelpers.inherits(AddSplitButton, _SplitButton);
		return babelHelpers.createClass(AddSplitButton, [{
			key: "getDefaultOptions",
			value: function getDefaultOptions() {
				return {
					text: main_core.Loc.getMessage('UI_BUTTONS_ADD_BTN_TEXT'),
					color: ButtonColor.SUCCESS
				};
			}
		}]);
	}(SplitButton);

	function _callSuper$5(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$5() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$5() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$5 = function () { return !!t; })(); }

	/**
	 * @namespace {BX.UI}
	 */
	let ApplySplitButton = /*#__PURE__*/function (_SplitButton) {
		function ApplySplitButton() {
			babelHelpers.classCallCheck(this, ApplySplitButton);
			return _callSuper$5(this, ApplySplitButton, arguments);
		}
		babelHelpers.inherits(ApplySplitButton, _SplitButton);
		return babelHelpers.createClass(ApplySplitButton, [{
			key: "getDefaultOptions",
			value: function getDefaultOptions() {
				return {
					text: main_core.Loc.getMessage('UI_BUTTONS_APPLY_BTN_TEXT'),
					color: ButtonColor.LIGHT_BORDER
				};
			}
		}]);
	}(SplitButton);

	function _callSuper$4(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$4() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$4() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$4 = function () { return !!t; })(); }

	/**
	 * @namespace {BX.UI}
	 */
	let CancelSplitButton = /*#__PURE__*/function (_SplitButton) {
		function CancelSplitButton() {
			babelHelpers.classCallCheck(this, CancelSplitButton);
			return _callSuper$4(this, CancelSplitButton, arguments);
		}
		babelHelpers.inherits(CancelSplitButton, _SplitButton);
		return babelHelpers.createClass(CancelSplitButton, [{
			key: "getDefaultOptions",
			value: function getDefaultOptions() {
				return {
					text: main_core.Loc.getMessage('UI_BUTTONS_CANCEL_BTN_TEXT'),
					color: ButtonColor.LINK
				};
			}
		}]);
	}(SplitButton);

	function _callSuper$3(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$3() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$3() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$3 = function () { return !!t; })(); }

	/**
	 * @namespace {BX.UI}
	 */
	let CloseSplitButton = /*#__PURE__*/function (_SplitButton) {
		function CloseSplitButton() {
			babelHelpers.classCallCheck(this, CloseSplitButton);
			return _callSuper$3(this, CloseSplitButton, arguments);
		}
		babelHelpers.inherits(CloseSplitButton, _SplitButton);
		return babelHelpers.createClass(CloseSplitButton, [{
			key: "getDefaultOptions",
			value: function getDefaultOptions() {
				return {
					text: main_core.Loc.getMessage('UI_BUTTONS_CLOSE_BTN_TEXT'),
					color: ButtonColor.LINK
				};
			}
		}]);
	}(SplitButton);

	function _callSuper$2(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$2() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$2() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$2 = function () { return !!t; })(); }

	/**
	 * @namespace {BX.UI}
	 */
	let CreateSplitButton = /*#__PURE__*/function (_SplitButton) {
		function CreateSplitButton() {
			babelHelpers.classCallCheck(this, CreateSplitButton);
			return _callSuper$2(this, CreateSplitButton, arguments);
		}
		babelHelpers.inherits(CreateSplitButton, _SplitButton);
		return babelHelpers.createClass(CreateSplitButton, [{
			key: "getDefaultOptions",
			value: function getDefaultOptions() {
				return {
					text: main_core.Loc.getMessage('UI_BUTTONS_CREATE_BTN_TEXT'),
					color: ButtonColor.SUCCESS
				};
			}
		}]);
	}(SplitButton);

	function _callSuper$1(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$1() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$1() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$1 = function () { return !!t; })(); }

	/**
	 * @namespace {BX.UI}
	 */
	let SaveSplitButton = /*#__PURE__*/function (_SplitButton) {
		function SaveSplitButton() {
			babelHelpers.classCallCheck(this, SaveSplitButton);
			return _callSuper$1(this, SaveSplitButton, arguments);
		}
		babelHelpers.inherits(SaveSplitButton, _SplitButton);
		return babelHelpers.createClass(SaveSplitButton, [{
			key: "getDefaultOptions",
			value: function getDefaultOptions() {
				return {
					text: main_core.Loc.getMessage('UI_BUTTONS_SAVE_BTN_TEXT'),
					color: ButtonColor.SUCCESS
				};
			}
		}]);
	}(SplitButton);

	function _callSuper(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function () { return !!t; })(); }

	/**
	 * @namespace {BX.UI}
	 */
	let SendSplitButton = /*#__PURE__*/function (_SplitButton) {
		function SendSplitButton() {
			babelHelpers.classCallCheck(this, SendSplitButton);
			return _callSuper(this, SendSplitButton, arguments);
		}
		babelHelpers.inherits(SendSplitButton, _SplitButton);
		return babelHelpers.createClass(SendSplitButton, [{
			key: "getDefaultOptions",
			value: function getDefaultOptions() {
				return {
					text: main_core.Loc.getMessage('UI_BUTTONS_SEND_BTN_TEXT'),
					color: ButtonColor.SUCCESS
				};
			}
		}]);
	}(SplitButton);

	exports.ButtonCounterColor = ui_cnt.CounterColor;
	exports.ButtonCounterSize = ui_cnt.CounterSize;
	exports.ButtonCounterStyle = ui_cnt.CounterStyle;
	exports.AddButton = AddButton;
	exports.AddSplitButton = AddSplitButton;
	exports.AirButtonStyle = AirButtonStyle;
	exports.ApplyButton = ApplyButton;
	exports.ApplySplitButton = ApplySplitButton;
	exports.BaseButton = BaseButton;
	exports.Button = Button;
	exports.ButtonColor = ButtonColor;
	exports.ButtonCounter = ButtonCounter;
	exports.ButtonIcon = ButtonIcon;
	exports.ButtonManager = ButtonManager;
	exports.ButtonSize = ButtonSize;
	exports.ButtonState = ButtonState;
	exports.ButtonStyle = ButtonStyle;
	exports.ButtonTag = ButtonTag;
	exports.CancelButton = CancelButton;
	exports.CancelSplitButton = CancelSplitButton;
	exports.CloseButton = CloseButton;
	exports.CloseSplitButton = CloseSplitButton;
	exports.CreateButton = CreateButton;
	exports.CreateSplitButton = CreateSplitButton;
	exports.IButton = IButton;
	exports.SaveButton = SaveButton;
	exports.SaveSplitButton = SaveSplitButton;
	exports.SendButton = SendButton;
	exports.SendSplitButton = SendSplitButton;
	exports.SettingsButton = SettingsButton;
	exports.SplitButton = SplitButton;
	exports.SplitButtonState = SplitButtonState;
	exports.SplitSubButton = SplitSubButton;
	exports.SplitSubButtonType = SplitSubButtonType;

})(this.BX.UI = this.BX.UI || {}, BX, BX, BX.UI, BX.UI, BX.Main, BX.UI.IconSet, BX.UI, BX.Event);
//# sourceMappingURL=ui.buttons.bundle.js.map
