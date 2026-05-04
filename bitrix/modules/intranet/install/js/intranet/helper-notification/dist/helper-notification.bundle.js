/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_bannerDispatcher, ui_dialogs_tooltip) {
	'use strict';

	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
	function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _bindElement = /*#__PURE__*/new WeakMap();
	var _tooltip = /*#__PURE__*/new WeakMap();
	var _isShown = /*#__PURE__*/new WeakMap();
	var _bindElementClickHandler = /*#__PURE__*/new WeakMap();
	var _HelperNotification_brand = /*#__PURE__*/new WeakSet();
	let HelperNotification = /*#__PURE__*/function () {
		function HelperNotification(options = {}) {
			babelHelpers.classCallCheck(this, HelperNotification);
			_classPrivateMethodInitSpec(this, _HelperNotification_brand);
			_classPrivateFieldInitSpec(this, _bindElement, null);
			_classPrivateFieldInitSpec(this, _tooltip, null);
			_classPrivateFieldInitSpec(this, _isShown, false);
			_classPrivateFieldInitSpec(this, _bindElementClickHandler, this.handleBindElementClick.bind(this));
			if (main_core.Type.isPlainObject(options) && main_core.Type.isDomNode(options.bindElement)) {
				_classPrivateFieldSet(_bindElement, this, options.bindElement);
			}
		}
		return babelHelpers.createClass(HelperNotification, [{
			key: "show",
			value: function show() {
				if (!_classPrivateFieldGet(_bindElement, this) || _classPrivateFieldGet(_isShown, this)) {
					return;
				}
				ui_bannerDispatcher.BannerDispatcher.normal.toQueue(onDone => {
					if (!main_core.Type.isDomNode(_classPrivateFieldGet(_bindElement, this)) || _classPrivateFieldGet(_isShown, this)) {
						onDone();
						return;
					}
					_classPrivateFieldSet(_tooltip, this, _assertClassBrand(_HelperNotification_brand, this, _createTooltip).call(this, onDone));
					_classPrivateFieldSet(_isShown, this, true);
					main_core.Event.bind(_classPrivateFieldGet(_bindElement, this), 'click', _classPrivateFieldGet(_bindElementClickHandler, this));
					_classPrivateFieldGet(_tooltip, this).show();
				});
			}
		}, {
			key: "handleBindElementClick",
			value: function handleBindElementClick() {
				if (_classPrivateFieldGet(_tooltip, this)) {
					_classPrivateFieldGet(_tooltip, this).close();
				}
			}
		}]);
	}();
	function _createTooltip(onClose) {
		return new ui_dialogs_tooltip.Tooltip({
			bindElement: _classPrivateFieldGet(_bindElement, this),
			content: _assertClassBrand(_HelperNotification_brand, this, _getContent).call(this),
			popupOptions: {
				autoHide: true,
				closeByEsc: true,
				closeIcon: false,
				angle: true,
				offsetTop: 14,
				offsetLeft: 24,
				maxHeight: 140,
				minWidth: 360,
				className: 'ui-dialog-tooltip intranet-helper-notification-popup',
				events: {
					onAfterPopupShow: () => {
						_assertClassBrand(_HelperNotification_brand, this, _markAsShown).call(this);
					},
					onClose: () => {
						_assertClassBrand(_HelperNotification_brand, this, _cleanup).call(this);
						onClose();
					}
				}
			}
		});
	}
	function _getContent() {
		return main_core.Tag.render`
			<div class="intranet-helper-notification --ui-context-edge-dark">
				<div class="ui-text --xl --accent intranet-helper-notification__title">
					${main_core.Loc.getMessage('INTRANET_HELPER_NOTIFICATION_TITLE')}
				</div>
				<div class="ui-text --md intranet-helper-notification__description">
					${main_core.Loc.getMessage('INTRANET_HELPER_NOTIFICATION_DESCRIPTION')}
				</div>
				${_assertClassBrand(_HelperNotification_brand, this, _renderCloseIcon).call(this)}
			</div>
		`;
	}
	function _renderCloseIcon() {
		const onClick = () => {
			_classPrivateFieldGet(_tooltip, this)?.close();
		};
		return main_core.Tag.render`
			<div class="intranet-helper-notification__close-icon ui-icon-set --cross-m" onclick="${onClick}"></div>
		`;
	}
	function _markAsShown() {
		BX.userOptions.save('intranet', 'new_helper_notification_shown', null, 'Y');
	}
	function _cleanup() {
		if (_classPrivateFieldGet(_bindElement, this)) {
			main_core.Event.unbind(_classPrivateFieldGet(_bindElement, this), 'click', _classPrivateFieldGet(_bindElementClickHandler, this));
		}
		_classPrivateFieldSet(_tooltip, this, null);
	}

	exports.HelperNotification = HelperNotification;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.UI, BX.UI.Dialogs);
//# sourceMappingURL=helper-notification.bundle.js.map
