/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, main_core) {
	'use strict';

	function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
	function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), true).forEach(function (r) { babelHelpers.defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }

	// Where the bundle of ui.a11y publishes its exports; `Runtime.loadExtension` resolves to a copy
	// of this very namespace, so reading it directly gives the same thing without the wait.
	var A11Y_NAMESPACE = 'BX.UI.Accessibility';
	var extensionPromise = null;
	var loadA11y = function loadA11y() {
		if (!extensionPromise) {
			extensionPromise = main_core.Runtime.loadExtension('ui.a11y').catch(function (error) {
				extensionPromise = null;
				throw error;
			});
		}
		return extensionPromise;
	};
	var A11y = {
		load: function load() {
			return loadA11y();
		},
		/**
		 * The exports of ui.a11y when it is already on the page, for callers that cannot afford to
		 * wait for load(): what they measure - the focus above all - is gone by the time a promise
		 * resolves. Returns null while the extension is not there, and the caller falls back.
		 * @return {?Object}
		 */
		getLoaded: function getLoaded() {
			return main_core.Reflection.getClass(A11Y_NAMESPACE);
		},
		createFocusTrap: function createFocusTrap(container) {
			var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
			if (!container) {
				return Promise.resolve(null);
			}
			return loadA11y().then(function (_ref) {
				var FocusTrap = _ref.FocusTrap,
					AccessibilitySettings = _ref.AccessibilitySettings;
				var mergedOptions = _objectSpread({
					looped: AccessibilitySettings.useFocusTrapInDialogs(),
					isolateOutside: AccessibilitySettings.useFocusTrapInDialogs()
				}, options);
				return new FocusTrap(container, mergedOptions);
			});
		},
		announce: function announce(message) {
			var politeness = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'polite';
			if (!message) {
				return Promise.resolve();
			}
			return loadA11y().then(function (_ref2) {
				var LiveAnnouncer = _ref2.LiveAnnouncer;
				LiveAnnouncer.announce(message, politeness);
			}).catch(function () {});
		},
		setHidden: function setHidden(container, hidden) {
			if (!container) {
				return;
			}
			container.setAttribute('aria-hidden', hidden ? 'true' : 'false');
			if (hidden) {
				container.setAttribute('inert', '');
				return;
			}
			container.removeAttribute('inert');
		}
	};

	exports.A11y = A11y;

})(this.BX.Landing.UI = this.BX.Landing.UI || {}, BX);
//# sourceMappingURL=a11y.bundle.js.map
