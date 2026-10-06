/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, main_core, main_core_events, landing_loc, landing_ui_a11y) {
	'use strict';

	var _templateObject;
	function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
	function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), true).forEach(function (r) { babelHelpers.defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
	function _callSuper(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, o.apply(t, e) || t); }
	// Patched after build: super() initialises the given `this`; legacy heirs steal these constructors via .apply().

	// Longest panel leave animation (400ms) plus slack. Only matters when `animationend` is late.
	var HIDE_ANIMATION_TIMEOUT = 600;

	/**
	 * @memberOf BX.Landing.UI.Panel
	 */
	var BasePanel = /*#__PURE__*/function (_EventEmitter) {
		function BasePanel() {
			var _this;
			var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
			babelHelpers.classCallCheck(this, BasePanel);
			_this = _callSuper(this, BasePanel);
			_this.setEventNamespace('BX.Landing.UI.Panel.BasePanel');
			_this.id = main_core.Type.isString(id) ? id : BasePanel.makeId();
			_this.layout = BasePanel.createLayout(_this.id);
			_this.classShow = 'landing-ui-show';
			_this.classHide = 'landing-ui-hide';
			_this.forms = new BX.Landing.UI.Collection.FormCollection();
			_this.contextDocument = document;
			_this.contextWindow = _this.contextDocument.defaultView;
			_this.isDialog = false;
			_this._focusOpener = null;
			_this._focusTrapPromise = null;
			_this._onDialogEscape = _this.onDialogEscape.bind(_this);
			return _this;
		}

		// eslint-disable-next-line no-unused-vars
		babelHelpers.inherits(BasePanel, _EventEmitter);
		return babelHelpers.createClass(BasePanel, [{
			key: "show",
			value: function show(options) {
				if (!this.isShown()) {
					this.prepareFocusReturn();

					// The semantics follow the show: `Utils.Show` unmarks the layout as hidden right away,
					// and the focus trap takes no layout that still carries the mark.
					var showing = BX.Landing.Utils.Show(this.layout);
					this.applyDialogSemanticsOnShow();
					return showing;
				}
				return Promise.resolve();
			}
		}, {
			key: "hide",
			value: function hide() {
				if (this.isShown()) {
					this.applyDialogSemanticsOnHide();

					// `Utils.Hide` hides only an element carrying the mark of a finished enter animation
					// and leaves the rest on screen, so the leave is real only when the mark is there.
					var isLeaving = BX.Landing.Utils.isShown(this.layout);
					return this.restoreFocusAfterHide(BX.Landing.Utils.Hide(this.layout), isLeaving);
				}
				return Promise.resolve();
			}
		}, {
			key: "hasFocusInside",
			value: function hasFocusInside() {
				var activeElement = this.layout.ownerDocument.activeElement;
				return activeElement !== null && this.layout.contains(activeElement);
			}

			// Nothing holds the focus any more: it is gone or fell back onto <body>.
		}, {
			key: "isFocusLost",
			value: function isFocusLost() {
				var ownerDocument = this.layout.ownerDocument;
				var activeElement = ownerDocument.activeElement;
				return activeElement === null || activeElement === ownerDocument.body;
			}

			/**
			 * The initial focus a dialog gets from its trap on activation. A panel opened without a trap
			 * has to move the focus itself, otherwise its content is only reachable by tabbing from the
			 * element that opened the panel. The focus goes to the container, not to the first control
			 * inside it: the next Tab then walks the panel from the start of its markup instead of from
			 * the close button, which is the last child of the layout, and the result does not depend on
			 * whether the content of the panel is on screen yet. Panels that want it call this once they
			 * are being opened, so the opener is already remembered by prepareFocusReturn() and a repeated
			 * show() moves nothing. The caller has to wait for the panel to be on screen: a hidden layout
			 * takes no focus.
			 */
		}, {
			key: "moveFocusInside",
			value: function moveFocusInside() {
				var _this2 = this;
				void landing_ui_a11y.A11y.load().then(function (_ref) {
					var FocusNavigator = _ref.FocusNavigator;
					if (!_this2.layout.isConnected || _this2.hasFocusInside()) {
						return;
					}
					FocusNavigator.focusContainer(_this2.layout, {
						preventScroll: true
					});
				}).catch(function () {});
			}

			/**
			 * The element that holds the focus, as seen from the panel. Panels of the editor are opened
			 * from buttons living inside `iframe.landing-ui-view`, and for the document of the panel the
			 * active element is then the iframe itself: only FocusNavigator descends into the frame and
			 * reaches the button. The answer is needed synchronously, before the focus moves on, so a
			 * ui.a11y that is not on the page yet leaves nothing but the own document to look at.
			 * @return {?HTMLElement}
			 */
		}, {
			key: "getActiveElement",
			value: function getActiveElement() {
				var _ref2 = landing_ui_a11y.A11y.getLoaded() || {},
					FocusNavigator = _ref2.FocusNavigator;
				if (FocusNavigator && main_core.Type.isFunction(FocusNavigator.getActiveElement)) {
					return FocusNavigator.getActiveElement(this.layout);
				}
				return this.layout.ownerDocument.activeElement;
			}

			/**
			 * A non-dialog panel returns focus on its own (see restoreFocusAfterHide), and both halves of
			 * that have to be in place before it closes: the element that opened the panel, taken while
			 * focus is still outside, and a running input modality tracker, which only knows about the
			 * interactions that happened after it attached to the document. Dialogs use the trap instead.
			 */
		}, {
			key: "prepareFocusReturn",
			value: function prepareFocusReturn() {
				if (this.isDialog) {
					return;
				}
				var activeElement = this.getActiveElement();
				// The <body> that is no anchor is the one of the active element: an opener from the editor
				// iframe belongs to another document, and the body of that document is as empty an anchor.
				var isOpener = activeElement !== null && activeElement !== activeElement.ownerDocument.body && !this.layout.contains(activeElement);
				this._focusOpener = isOpener ? activeElement : null;
				void landing_ui_a11y.A11y.load().catch(function () {});
			}

			/**
			 * A non-dialog panel has no focus trap, so nothing brings focus back when the layout gets
			 * hidden and focus falls to <body>. Dialogs keep doing this through the trap.
			 * @param {Promise} hiding
			 * @param {boolean} [isLeaving] whether the panel really goes away, see hide()
			 * @return {Promise}
			 */
		}, {
			key: "restoreFocusAfterHide",
			value: function restoreFocusAfterHide(hiding) {
				var _this3 = this;
				var isLeaving = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
				// A panel that stays on screen keeps both its focus and its opener: the opener is still
				// needed by the next attempt to close it.
				if (!isLeaving) {
					return hiding;
				}
				var opener = this._focusOpener;
				this._focusOpener = null;
				if (this.isDialog || !this.hasFocusInside()) {
					return hiding;
				}

				// Restoring must not delay the hide chain, hence no waiting for the extension here.
				void landing_ui_a11y.A11y.load().then(function (a11y) {
					return _this3.returnFocusOutside(opener, a11y, hiding);
				}).catch(function () {});
				return hiding;
			}

			/**
			 * @param {HTMLElement} opener
			 * @param {?Object} focusNavigator
			 * @return {boolean} whether the return of focus is settled and needs no fallback
			 */
		}, {
			key: "focusOpener",
			value: function focusOpener(opener, focusNavigator) {
				// The platform restore announces itself with a cancelable event, so a menu item or a
				// slider can take the return over; a ui.a11y without it gets the bare focus() below.
				if (focusNavigator && main_core.Type.isFunction(focusNavigator.restoreFocus)) {
					if (focusNavigator.restoreFocus(opener, {
						preventScroll: true
					}) === null) {
						return true;
					}
				} else {
					opener.focus({
						preventScroll: true
					});
				}
				if (this.getActiveElement() === opener) {
					return true;
				}

				// An opener that lives in the editor iframe takes two calls in Firefox while the layout
				// being hidden still holds the focus: the first one stops at the <iframe> element.
				opener.focus({
					preventScroll: true
				});
				return this.getActiveElement() === opener;
			}

			/**
			 * @param {?HTMLElement} opener
			 * @param {Object} a11y exports of the ui.a11y extension
			 * @param {Promise} hiding
			 * @return {?Promise}
			 */
		}, {
			key: "returnFocusOutside",
			value: function returnFocusOutside(opener, a11y, hiding) {
				var _this4 = this;
				// Focus may have landed somewhere meaningful on its own while the extension was loading.
				if (!this.hasFocusInside() && !this.isFocusLost()) {
					return null;
				}

				// A known anchor is returned to unconditionally, the way a focus trap does it.
				if (opener !== null && opener.isConnected && this.focusOpener(opener, a11y.FocusNavigator)) {
					return null;
				}
				var focusMonitor = a11y.FocusMonitor.Instance;

				// What is left is the focus history, and that is a guess about where the user came from.
				// A pointer user did not ask for a focus ring on a control the history picked for them.
				if (focusMonitor.getLastInputModality() !== 'keyboard') {
					return null;
				}

				// The focus history skips the nodes of the panel only once the layout is really hidden. The
				// hide chain resolves on `animationend`, which can bubble from a descendant animation while
				// the panel is still visible or never fire at all in a background tab, so the wait is capped
				// instead of being trusted.
				var waiting = null;
				var hidden = new Promise(function (resolve) {
					waiting = setTimeout(resolve, HIDE_ANIMATION_TIMEOUT);
				});
				return Promise.race([hiding, hidden]).then(function () {
					clearTimeout(waiting);

					// The wait is long enough for focus to land somewhere on its own: the next panel, a
					// neighbouring widget, a Tab of the user. Only a still lost focus is worth restoring.
					if (_this4.hasFocusInside() || _this4.isFocusLost()) {
						focusMonitor.restoreFocus();
					}
				});
			}
		}, {
			key: "setAriaLabel",
			value: function setAriaLabel(text) {
				if (!main_core.Type.isString(text)) {
					return;
				}
				this.layout.setAttribute('aria-label', text);
				this.layout.removeAttribute('aria-labelledby');
			}
		}, {
			key: "setAriaLabelledBy",
			value: function setAriaLabelledBy(source) {
				var id = null;
				if (main_core.Type.isDomNode(source)) {
					// No meaningful text: drop labelledby so the aria-label fallback applies.
					if ((source.textContent || '').trim() === '') {
						this.layout.removeAttribute('aria-labelledby');
						return;
					}
					id = source.id;
					if (!id) {
						id = BasePanel.makeId();
						source.setAttribute('id', id);
					}
				} else if (main_core.Type.isStringFilled(source)) {
					id = source;
				}
				if (id === null) {
					return;
				}
				this.layout.setAttribute('aria-labelledby', id);
				this.layout.removeAttribute('aria-label');
			}

			// Subclasses override this to tune the trap (isolation, looping) without owning its promise cache.
		}, {
			key: "getFocusTrapOptions",
			value: function getFocusTrapOptions() {
				return {};
			}
		}, {
			key: "getFocusTrap",
			value: function getFocusTrap() {
				if (this._focusTrapPromise === null) {
					var options = _objectSpread({
						restoreFocus: true
					}, this.getFocusTrapOptions());
					this._focusTrapPromise = landing_ui_a11y.A11y.createFocusTrap(this.layout, options);
				}
				return this._focusTrapPromise;
			}
		}, {
			key: "onDialogEscape",
			value: function onDialogEscape(event) {
				if (event.key === 'Escape') {
					this.hide();
				}
			}

			/**
			 * The role and the name of a dialog, without the base Escape listener: subclasses own their
			 * own Escape. The focus trap is not part of it — it is activated separately, so that a panel
			 * playing an enter animation can name itself right away and trap the focus once it is really
			 * on screen.
			 */
		}, {
			key: "activateDialogA11y",
			value: function activateDialogA11y() {
				if (!this.isDialog) {
					return;
				}

				// No aria-modal here: the trap does not isolate the outside anymore, so the editor top
				// panel stays operable. Claiming modality would keep hiding it from screen readers.
				this.layout.setAttribute('role', 'dialog');
				if (!this.layout.hasAttribute('aria-label') && !this.layout.hasAttribute('aria-labelledby')) {
					this.layout.setAttribute('aria-label', landing_loc.Loc.getMessage('LANDING_UI_PANEL_BASE_DIALOG_LABEL'));
				}
			}

			/**
			 * The trap moves the focus into the dialog on activation, and it has something to move it to
			 * only once the panel is on screen: nothing inside a layout that is still hidden counts as
			 * focusable, and the focus lands on the bare container instead of the first control. A panel
			 * that waits for its enter animation can be closed or destroyed before it ends, and a trap of
			 * a panel that is no longer there would steal the focus from whatever took its place.
			 * `FocusTrap.activate()` is idempotent, so calling this more than once costs nothing.
			 */
		}, {
			key: "activateFocusTrap",
			value: function activateFocusTrap() {
				if (!this.isDialog || !this.layout.isConnected || main_core.Dom.hasClass(this.layout, this.classHide)) {
					return;
				}
				this.getFocusTrap().then(function (trap) {
					return trap && trap.activate();
				}).catch(function () {});
			}
		}, {
			key: "deactivateDialogA11y",
			value: function deactivateDialogA11y() {
				if (!this.isDialog) {
					return;
				}
				this.getFocusTrap().then(function (trap) {
					return trap && trap.deactivate();
				}).catch(function () {});
			}
		}, {
			key: "applyDialogSemanticsOnShow",
			value: function applyDialogSemanticsOnShow() {
				if (!this.isDialog) {
					return;
				}
				this.activateDialogA11y();
				main_core.Event.bind(this.contextDocument, 'keydown', this._onDialogEscape);
				this.activateFocusTrap();
			}
		}, {
			key: "applyDialogSemanticsOnHide",
			value: function applyDialogSemanticsOnHide() {
				if (!this.isDialog) {
					return;
				}
				main_core.Event.unbind(this.contextDocument, 'keydown', this._onDialogEscape);
				this.deactivateDialogA11y();
			}
		}, {
			key: "isShown",
			value: function isShown() {
				return !main_core.Dom.hasClass(this.layout, this.classHide);
			}
		}, {
			key: "setContent",
			value: function setContent(content) {
				this.clear();
				if (main_core.Type.isString(content)) {
					this.layout.innerHTML = content;
				} else if (main_core.Type.isDomNode(content)) {
					this.appendContent(content);
				} else if (main_core.Type.isArray(content)) {
					content.forEach(this.appendContent, this);
				}
			}
		}, {
			key: "appendContent",
			value: function appendContent(content) {
				if (main_core.Type.isDomNode(content)) {
					this.layout.appendChild(content);
				}
			}
		}, {
			key: "prependContent",
			value: function prependContent(content) {
				if (main_core.Type.isDomNode(content)) {
					main_core.Dom.prepend(content, this.layout);
				}
			}
		}, {
			key: "renderTo",
			value: function renderTo(target) {
				if (main_core.Type.isDomNode(target)) {
					main_core.Dom.append(this.layout, target);
				}
			}
		}, {
			key: "remove",
			value: function remove() {
				// release dialog semantics (Escape listener, focus trap) even when destroyed without hide(),
				// but only if the focus trap was ever created: an unshown panel has nothing to release
				if (this._focusTrapPromise !== null) {
					this.applyDialogSemanticsOnHide();
				}

				// A layout taken out of the document drops focus to <body> the same way a hidden one does.
				this.restoreFocusAfterHide(Promise.resolve(), this.isShown());
				this._focusOpener = null;
				main_core.Dom.remove(this.layout);
			}
		}, {
			key: "appendForm",
			value: function appendForm(form) {
				this.layout.appendChild(form.getNode());
			}
		}, {
			key: "clear",
			value: function clear() {
				main_core.Dom.clean(this.layout);
			}
		}, {
			key: "setLayoutClass",
			value: function setLayoutClass(className) {
				main_core.Dom.addClass(this.layout, className);
			}
		}, {
			key: "setContextDocument",
			value: function setContextDocument(contextDocument) {
				this.contextDocument = contextDocument;
				this.contextWindow = this.contextDocument.defaultView;
			}
		}], [{
			key: "makeId",
			value: function makeId() {
				return "landing_ui_panel_".concat(main_core.Text.getRandom());
			}
		}, {
			key: "createLayout",
			value: function createLayout(id) {
				return main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-panel landing-ui-hide\" data-id=\"", "\"></div>\n\t\t"])), id);
			}
		}]);
	}(main_core_events.EventEmitter);

	exports.BasePanel = BasePanel;

})(this.BX.Landing.UI.Panel = this.BX.Landing.UI.Panel || {}, BX, BX.Event, BX.Landing, BX.Landing.UI);
//# sourceMappingURL=base.bundle.js.map
