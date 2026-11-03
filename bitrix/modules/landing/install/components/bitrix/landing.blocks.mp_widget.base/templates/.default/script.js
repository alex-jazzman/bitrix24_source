/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, main_core) {
	'use strict';

	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var EXTEND_ANIMATION_DELAY = 300;

	/**
	 * The collapsed grid clips its content, so the first element the extended class reveals
	 * is the first child the collapsed grid cuts off. Must be called before the class is added.
	 * @return {?Element}
	 */
	var findFirstRevealedElement = function findFirstRevealedElement(grid) {
		var _find;
		var collapsedBottom = grid.getBoundingClientRect().bottom;
		return (_find = babelHelpers.toConsumableArray(grid.children).find(function (child) {
			return child.getBoundingClientRect().bottom > collapsedBottom;
		})) !== null && _find !== void 0 ? _find : null;
	};
	var focusRevealedElement = function focusRevealedElement(element) {
		if (!element) {
			return;
		}
		element.setAttribute('tabindex', '-1');
		element.focus();
	};

	/**
	 * What the reader is put on when the view all button takes over. The widgets of the feed carry the
	 * address on the button itself, but kb and bp still wrap a link into it: focus on the wrapper there
	 * is focus on a control that does nothing, with the link one stop further.
	 * @return {Element}
	 */
	var entryOf = function entryOf(button) {
		var _button$querySelector;
		return (_button$querySelector = button.querySelector('a[href]')) !== null && _button$querySelector !== void 0 ? _button$querySelector : button;
	};
	var _Base_brand = /*#__PURE__*/new WeakSet();
	var Base = /*#__PURE__*/function () {
		function Base(widgetElement) {
			babelHelpers.classCallCheck(this, Base);
			_classPrivateMethodInitSpec(this, _Base_brand);
			this.element = widgetElement;
		}
		return babelHelpers.createClass(Base, [{
			key: "deleteContextDependentContainer",
			value: function deleteContextDependentContainer(options) {
				var _options$mainContaine,
					_options$sidebarConta,
					_this = this;
				if (!options) {
					return;
				}
				this.mainContainer = (_options$mainContaine = options.mainContainer) !== null && _options$mainContaine !== void 0 ? _options$mainContaine : null;
				this.sidebarContainer = (_options$sidebarConta = options.sidebarContainer) !== null && _options$sidebarConta !== void 0 ? _options$sidebarConta : null;
				var sidebarElements = document.querySelectorAll('.landing-sidebar');
				var isInsideSidebar = false;
				sidebarElements.forEach(function (sidebarElement) {
					if (sidebarElement.contains(_this.element)) {
						isInsideSidebar = true;
					}
				});
				if (isInsideSidebar && this.mainContainer) {
					this.mainContainer.remove();
				}
				if (!isInsideSidebar && this.sidebarContainer) {
					this.sidebarContainer.remove();
				}
			}
		}, {
			key: "toggleExtendViewButtonBehavior",
			value: function toggleExtendViewButtonBehavior(options) {
				var _options$extendButton,
					_options$viewAllButto,
					_options$isShowExtend,
					_options$grid,
					_options$gridExtended,
					_options$buttonHideCl,
					_this2 = this;
				if (!options) {
					return;
				}
				this.extendButton = (_options$extendButton = options.extendButton) !== null && _options$extendButton !== void 0 ? _options$extendButton : null;
				this.viewAllButton = (_options$viewAllButto = options.viewAllButton) !== null && _options$viewAllButto !== void 0 ? _options$viewAllButto : null;
				this.isShowExtendButton = (_options$isShowExtend = options.isShowExtendButton) !== null && _options$isShowExtend !== void 0 ? _options$isShowExtend : null;
				this.grid = (_options$grid = options.grid) !== null && _options$grid !== void 0 ? _options$grid : null;
				this.gridExtendedClass = (_options$gridExtended = options.gridExtendedClass) !== null && _options$gridExtended !== void 0 ? _options$gridExtended : null;
				this.buttonHideClass = (_options$buttonHideCl = options.buttonHideClass) !== null && _options$buttonHideCl !== void 0 ? _options$buttonHideCl : null;
				if (!this.extendButton || !this.viewAllButton) {
					return;
				}
				if (!this.isShowExtendButton) {
					main_core.Dom.addClass(this.extendButton, this.buttonHideClass);
					main_core.Dom.removeClass(this.viewAllButton, this.buttonHideClass);
					return;
				}
				this.extendButton.setAttribute('aria-expanded', 'false');
				main_core.Event.bind(this.extendButton, 'click', function () {
					_assertClassBrand(_Base_brand, _this2, _extendView).call(_this2);
				});
			}
		}]);
	}();
	function _extendView() {
		var _this3 = this;
		if (!this.grid) {
			return;
		}

		// the button hides itself when the animation ends and takes the focus with it,
		// so the focus moves onto the revealed content first
		var firstRevealed = findFirstRevealedElement(this.grid);
		main_core.Dom.addClass(this.grid, this.gridExtendedClass);
		this.extendButton.setAttribute('aria-expanded', 'true');
		focusRevealedElement(firstRevealed);
		setTimeout(function () {
			// read before the class hides the button: nothing was revealed to take the focus off it,
			// and a focus left on a hidden element falls to the body
			var focusStaysOnTheButton = document.activeElement === _this3.extendButton;
			main_core.Dom.addClass(_this3.extendButton, _this3.buttonHideClass);
			main_core.Dom.removeClass(_this3.viewAllButton, _this3.buttonHideClass);
			if (focusStaysOnTheButton) {
				entryOf(_this3.viewAllButton).focus();
			}
		}, EXTEND_ANIMATION_DELAY);
	}

	exports.Base = Base;

})(this.BX.Landing.Widget = this.BX.Landing.Widget || {}, BX);
//# sourceMappingURL=script.js.map
