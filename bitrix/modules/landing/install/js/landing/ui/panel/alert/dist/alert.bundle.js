/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, main_core, landing_loc, landing_ui_panel_base) {
	'use strict';

	var _templateObject, _templateObject2, _templateObject3, _templateObject4;
	function _callSuper(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, o.apply(t, e) || t); }
	// Patched after build: super() initialises the given `this`; legacy heirs steal these constructors via .apply().
	function _superPropGet(t, o, e, r) { var p = babelHelpers.get(babelHelpers.getPrototypeOf(t.prototype ), o, e); return "function" == typeof p ? function (t) { return p.apply(e, t); } : p; }

	// Backs the animation frame up: a frame is about 16ms, so it wins whenever the tab is visible.
	var FRAME_FALLBACK_TIMEOUT = 100;

	/**
	 * Implements interface for works with alert panel
	 * use this panel for show error and info messages
	 *
	 * Implements singleton design pattern. Don't use it as constructor
	 * use BX.Landing.UI.Panel.Alert.getInstance() for get instance of module
	 * @memberOf BX.Landing.UI.Panel
	 */
	var Alert = /*#__PURE__*/function (_BasePanel) {
		function Alert() {
			var _this;
			var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
			babelHelpers.classCallCheck(this, Alert);
			_this = _callSuper(this, Alert, [options]);
			// A snackbar, not a dialog: the message takes no answer and must not steal focus.
			babelHelpers.defineProperty(_this, "isDialog", false);
			_this.cache = new main_core.Cache.MemoryCache();
			_this.onCloseClick = _this.onCloseClick.bind(_this);
			_this.text = _this.getText();
			_this.closeButton = _this.getCloseButton();
			_this.action = _this.getAction();
			_this.leaving = Promise.resolve();

			// Live region set once on the message itself: an atomic region spanning the layout would
			// read the support link and the close button along with every message.
			_this.text.setAttribute('role', 'alert');
			main_core.Dom.addClass(_this.layout, 'landing-ui-panel-alert');
			// The layout joins the document closed and stays out of the tab order until the first
			// show(), which is what drops the attribute. Only the class is set by createLayout, and
			// a snackbar moved off screen by a transform alone keeps its close button focusable.
			_this.layout.hidden = true;
			main_core.Dom.append(_this.text, _this.layout);
			main_core.Dom.append(_this.action, _this.layout);
			main_core.Dom.append(_this.layout, document.body);
			return _this;
		}
		babelHelpers.inherits(Alert, _BasePanel);
		return babelHelpers.createClass(Alert, [{
			key: "getText",
			value: function getText() {
				return this.cache.remember('text', function () {
					return main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-panel-alert-text\"></div>"])));
				});
			}
		}, {
			key: "getCloseButton",
			value: function getCloseButton() {
				var _this2 = this;
				return this.cache.remember('closeButton', function () {
					var text = landing_loc.Loc.getMessage('LANDING_ALERT_ACTION_CLOSE');
					return main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<button class=\"ui-btn ui-btn-link\" onclick=\"", "\">", "</button>\n\t\t\t"])), _this2.onCloseClick, text);
				});
			}
		}, {
			key: "getAction",
			value: function getAction() {
				var _this3 = this;
				return this.cache.remember('action', function () {
					return main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-panel-alert-action\">", "</div>"])), _this3.getCloseButton());
				});
			}
		}, {
			key: "show",
			value: function show(type, text) {
				var _this4 = this;
				var hideSupportLink = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
				// A leave animation ends with `Utils.Hide` taking the layout down, and it would take a message
				// written in the meantime with it. Interrupting the leave is not an option: the `animationend`
				// `Utils.Hide` waits for is the one of whatever animation comes next. So the leave is let
				// finish and the snackbar carries the message shown anew.
				if (this.isLeaving()) {
					return this.leaving.then(function () {
						return _this4.showMessage(type, text, hideSupportLink);
					});
				}
				return this.showMessage(type, text, hideSupportLink);
			}
		}, {
			key: "showMessage",
			value: function showMessage(type, text, hideSupportLink) {
				// A live region is announced by a change of its content, so a message that replaces a visible
				// one is only written. Hiding the singleton layout to show it again would blink the snackbar,
				// add a mutation of its own to the region and hand focus back to the page while it stays up.
				if (!this.isShown()) {
					void _superPropGet(Alert, "show", this)([this]);
				}
				return this.writeMessage(type, text || type, hideSupportLink);
			}
		}, {
			key: "hide",
			value: function hide() {
				this.leaving = _superPropGet(Alert, "hide", this)([]);
				return this.leaving;
			}

			// The leave class lands on the layout when the animation starts, the mark of the enter animation
			// goes away only once `Utils.Hide` gets its `animationend`: in between the two disagree.
		}, {
			key: "isLeaving",
			value: function isLeaving() {
				return !this.isShown() && BX.Landing.Utils.isShown(this.layout);
			}
		}, {
			key: "applyType",
			value: function applyType(type) {
				if (type === 'error') {
					main_core.Dom.removeClass(this.layout, 'landing-ui-alert');
					main_core.Dom.addClass(this.layout, 'landing-ui-error');
					return;
				}
				main_core.Dom.removeClass(this.layout, 'landing-ui-error');
				main_core.Dom.addClass(this.layout, 'landing-ui-alert');
			}

			/**
			 * Screen readers need a rendered frame between the live region entering the accessibility
			 * tree and its first content change, otherwise the message is silently dropped. The same
			 * guard the LiveAnnouncer of ui.a11y uses for its own region. Colours belong to the message,
			 * so they are switched in that very frame: applying them earlier would both show the previous
			 * message in the look of the next one and add a mutation of its own to an assertive region.
			 * A message replacing a visible one needs no such frame, but keeps the very same path: it costs
			 * one frame and keeps the colours paired with the text they belong to.
			 * @param {string} type
			 * @param {string} message trusted markup, written as innerHTML: never pass user input as is
			 * @param {boolean} hideSupportLink
			 * @return {Promise<Alert>}
			 */
		}, {
			key: "writeMessage",
			value: function writeMessage(type, message, hideSupportLink) {
				var _this5 = this;
				return new Promise(function (resolve) {
					var written = false;
					var fallbackTimeout = null;
					var write = function write() {
						if (written) {
							return;
						}
						written = true;
						clearTimeout(fallbackTimeout);
						_this5.applyType(type);
						_this5.text.innerHTML = "".concat(message, " ");
						if (!hideSupportLink) {
							main_core.Dom.append(_this5.getSupportLink(), _this5.text);
						}
						resolve(_this5);
					};
					requestAnimationFrame(write);
					// A background tab paints no frames, and an error message must not wait for the user
					// to come back to be written, let alone keep the show() promise pending until then.
					fallbackTimeout = setTimeout(write, FRAME_FALLBACK_TIMEOUT);
				});
			}
		}, {
			key: "getSupportLink",
			value: function getSupportLink() {
				var _this6 = this;
				return this.cache.remember('supportLink', function () {
					var url = 'https://helpdesk.bitrix24.com/ticket.php';
					switch (landing_loc.Loc.getMessage('LANGUAGE_ID')) {
						case 'ru':
						case 'by':
						case 'kz':
							url = 'https://helpdesk.bitrix24.ru/ticket.php';
							break;
						case 'de':
							url = 'https://helpdesk.bitrix24.de/ticket.php';
							break;
						case 'br':
							url = 'https://helpdesk.bitrix24.com.br/ticket.php';
							break;
						case 'es':
							url = 'https://helpdesk.bitrix24.es/ticket.php';
							break;
					}
					_this6.supportLink = BX.create('a', {
						props: {
							className: 'landing-ui-panel-alert-support-link'
						},
						html: BX.Landing.Loc.getMessage('LANDING_ALERT_ACTION_SUPPORT_LINK'),
						attrs: {
							href: url,
							target: '_blank'
						}
					});
					var text = landing_loc.Loc.getMessage('LANDING_ALERT_ACTION_SUPPORT_LINK');
					return main_core.Tag.render(_templateObject4 || (_templateObject4 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<a href=\"", "\" target=\"_blank\" class=\"landing-ui-panel-alert-support-link\">", "</a>\n\t\t\t"])), url, text);
				});
			}
		}, {
			key: "onCloseClick",
			value: function onCloseClick() {
				void this.hide();
			}
		}], [{
			key: "getInstance",
			value: function getInstance() {
				return this.staticCache.remember('instance', function () {
					return new Alert();
				});
			}
		}]);
	}(landing_ui_panel_base.BasePanel);
	babelHelpers.defineProperty(Alert, "staticCache", new main_core.Cache.MemoryCache());

	exports.Alert = Alert;

})(this.BX.Landing.UI.Panel = this.BX.Landing.UI.Panel || {}, BX, BX.Landing, BX.Landing.UI.Panel);
//# sourceMappingURL=alert.bundle.js.map
