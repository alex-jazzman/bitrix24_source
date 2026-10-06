/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, ui_designTokens, ui_fonts_opensans, main_core, landing_ui_panel_base) {
	'use strict';

	function getDeltaFromEvent(event) {
		var deltaX = event.deltaX;
		var deltaY = -1 * event.deltaY;
		if (main_core.Type.isUndefined(deltaX) || main_core.Type.isUndefined(deltaY)) {
			deltaX = -1 * event.wheelDeltaX / 6;
			deltaY = event.wheelDeltaY / 6;
		}
		if (event.deltaMode === 1) {
			deltaX *= 10;
			deltaY *= 10;
		}

		/** NaN checks */
		if (Number.isNaN(deltaX) && Number.isNaN(deltaY)) {
			deltaX = 0;
			deltaY = event.wheelDelta;
		}
		return {
			x: deltaX,
			y: deltaY
		};
	}

	function calculateDurationTransition(diff) {
		var defaultDuration = 300;
		return Math.min(400 / 500 * diff, defaultDuration);
	}

	function scrollTo(container, element) {
		return new Promise(function (resolve) {
			var elementTop = 0;
			var duration = 0;
			if (element) {
				var defaultMargin = 20;
				var elementMarginTop = Math.max(parseInt(main_core.Dom.style(element, 'margin-top')), defaultMargin);
				var containerScrollTop = container.scrollTop;
				if (!(container instanceof HTMLIFrameElement)) {
					elementTop = element.offsetTop - (container.offsetTop || 0) - elementMarginTop;
				} else {
					containerScrollTop = container.contentWindow.scrollY;
					elementTop = BX.pos(element).top - elementMarginTop - 100;
				}
				duration = calculateDurationTransition(Math.abs(elementTop - containerScrollTop));
				var start = Math.max(containerScrollTop, 0);
				var finish = Math.max(elementTop, 0);
				if (start !== finish) {
					new BX.easing({
						duration: duration,
						start: {
							scrollTop: start
						},
						finish: {
							scrollTop: finish
						},
						step: function step(state) {
							if (!(container instanceof HTMLIFrameElement)) {
								container.scrollTop = state.scrollTop;
							} else {
								container.contentWindow.scrollTo(0, Math.max(state.scrollTop, 0));
							}
						}
					}).animate();
					setTimeout(resolve, duration);
				} else {
					resolve();
				}
			} else {
				resolve();
			}
		});
	}

	var _templateObject, _templateObject2, _templateObject3, _templateObject4, _templateObject5, _templateObject6, _templateObject7, _templateObject8;
	function _callSuper(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, o.apply(t, e) || t); }
	// Patched after build: super() initialises the given `this`; legacy heirs steal these constructors via .apply().
	function _superPropGet(t, o, e, r) { var p = babelHelpers.get(babelHelpers.getPrototypeOf(t.prototype ), o, e); return "function" == typeof p ? function (t) { return p.apply(e, t); } : p; }
	// Longest panel enter animation (400ms) plus slack. Only matters when `animationend` is late.
	var SHOW_ANIMATION_TIMEOUT = 600;

	/**
	 * @memberOf BX.Landing.UI.Panel
	 */
	var Content = /*#__PURE__*/function (_BasePanel) {
		function Content(id) {
			var _this;
			var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
			babelHelpers.classCallCheck(this, Content);
			_this = _callSuper(this, Content, [id, data]);
			babelHelpers.defineProperty(_this, "adjustActionsPanels", true);
			// Real modal slide-out panel: opt in to dialog a11y (role/aria-modal/focus-trap).
			babelHelpers.defineProperty(_this, "isDialog", true);
			/**
			 * If panel must hide by press Esc
			 * @type {boolean}
			 */
			babelHelpers.defineProperty(_this, "closeByEsc", true);
			main_core.Dom.addClass(_this.layout, 'landing-ui-panel-content');
			_this.data = Object.freeze(data);
			_this.overlay = Content.createOverlay();
			_this.header = Content.createHeader();
			_this.title = Content.createTitle();
			_this.body = Content.createBody();
			_this.footer = Content.createFooter();
			_this.sidebar = Content.createSidebar();
			_this.content = Content.createContent();
			_this.closeButton = new BX.Landing.UI.Button.BaseButton('close', {
				className: 'landing-ui-panel-content-close',
				onClick: function onClick() {
					void _this.hide();
					_this.emit('onCancel');
					BX.onCustomEvent(_this, 'BX.Landing.Block:onBlockEditClose', []);
				},
				attrs: {
					title: BX.Landing.Loc.getMessage('LANDING_TITLE_OF_SLIDER_CLOSE')
				}
			});
			if (main_core.Type.isBoolean(data.closeByEsc)) {
				_this.closeByEsc = data.closeByEsc;
			}
			_this.disableScroll = main_core.Type.isBoolean(data.disableScroll) ? data.disableScroll : false;
			_this.forms = new BX.Landing.UI.Collection.FormCollection();
			_this.buttons = new BX.Landing.UI.Collection.ButtonCollection();
			_this.sidebarButtons = new BX.Landing.UI.Collection.ButtonCollection();
			_this.wheelEventName = main_core.Type.isNil(window.onwheel) ? window.onwheel : window.onmousewheel;
			_this.onMouseWheel = _this.onMouseWheel.bind(_this);
			_this.onMouseEnter = _this.onMouseEnter.bind(_this);
			_this.onMouseLeave = _this.onMouseLeave.bind(_this);
			main_core.Dom.removeClass(_this.layout, 'landing-ui-hide');
			main_core.Dom.addClass(_this.overlay, 'landing-ui-hide');
			main_core.Dom.append(_this.sidebar, _this.body);
			main_core.Dom.append(_this.content, _this.body);
			main_core.Dom.append(_this.header, _this.layout);
			main_core.Dom.append(_this.title, _this.header);
			main_core.Dom.append(_this.body, _this.layout);
			main_core.Dom.append(_this.footer, _this.layout);
			main_core.Dom.append(_this.closeButton.layout, _this.layout);
			if (main_core.Type.isString(data.className)) {
				main_core.Dom.addClass(_this.layout, [data.className, "".concat(data.className, "-overlay")]);
			}
			if (main_core.Type.isString(data.subTitle) && data.subTitle !== '') {
				_this.subTitle = main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"landing-ui-panel-content-subtitle\">", "</div>\n\t\t\t"])), data.subTitle);
				main_core.Dom.append(_this.subTitle, _this.header);
				main_core.Dom.addClass(_this.layout, 'landing-ui-panel-content-with-subtitle');
			}
			if (_this.data.showFromRight === true) {
				_this.setLayoutClass('landing-ui-panel-show-from-right');
			}
			_this.init();
			main_core.Event.bind(window.top, 'keydown', _this.onKeyDown.bind(_this));
			BX.Landing.PageObject.getEditorWindow();
			if (_this.data.scrollAnimation) {
				_this.scrollObserver = new IntersectionObserver(_this.onIntersecting.bind(_this));
			}
			_this.checkReadyToSave = _this.checkReadyToSave.bind(_this);
			return _this;
		}
		babelHelpers.inherits(Content, _BasePanel);
		return babelHelpers.createClass(Content, [{
			key: "init",
			value: function init() {
				var _this2 = this;
				main_core.Dom.append(this.overlay, window.parent.document.body);
				main_core.Event.bind(this.overlay, 'click', function () {
					_this2.emit('onCancel');
					void _this2.hide();
				});
				main_core.Event.bind(this.layout, 'mouseenter', this.onMouseEnter);
				main_core.Event.bind(this.layout, 'mouseleave', this.onMouseLeave);
				main_core.Event.bind(this.content, 'mouseenter', this.onMouseEnter);
				main_core.Event.bind(this.content, 'mouseleave', this.onMouseLeave);
				main_core.Event.bind(this.sidebar, 'mouseenter', this.onMouseEnter);
				main_core.Event.bind(this.sidebar, 'mouseleave', this.onMouseLeave);
				main_core.Event.bind(this.header, 'mouseenter', this.onMouseEnter);
				main_core.Event.bind(this.header, 'mouseleave', this.onMouseLeave);
				main_core.Event.bind(this.footer, 'mouseenter', this.onMouseEnter);
				main_core.Event.bind(this.footer, 'mouseleave', this.onMouseLeave);
				if ('title' in this.data) {
					this.setTitle(this.data.title);
				}
				if ('footer' in this.data) {
					if (main_core.Type.isArray(this.data.footer)) {
						this.data.footer.forEach(function (item) {
							if (item instanceof BX.Landing.UI.Button.BaseButton) {
								_this2.appendFooterButton(item);
							}
							if (main_core.Type.isDomNode(item)) {
								main_core.Dom.append(item, _this2.footer);
							}
						});
					}
				}
			}

			// eslint-disable-next-line class-methods-use-this
		}, {
			key: "onIntersecting",
			value: function onIntersecting(items) {
				items.forEach(function (item) {
					if (item.isIntersecting) {
						main_core.Dom.removeClass(item.target, 'landing-ui-is-not-visible');
						main_core.Dom.addClass(item.target, 'landing-ui-is-visible');
					} else {
						main_core.Dom.addClass(item.target, 'landing-ui-is-not-visible');
						main_core.Dom.removeClass(item.target, 'landing-ui-is-visible');
					}
				});
			}
		}, {
			key: "onKeyDown",
			value: function onKeyDown(event) {
				if (this.closeByEsc && event.keyCode === 27) {
					this.emit('onCancel');
					void this.hide();
				}
			}
		}, {
			key: "onMouseEnter",
			value: function onMouseEnter(event) {
				event.stopPropagation();
				main_core.Event.bind(this.layout, this.wheelEventName, this.onMouseWheel);
				main_core.Event.bind(this.layout, 'touchmove', this.onMouseWheel);
				if (this.sidebar.contains(event.target) || this.content.contains(event.target) || this.header.contains(event.target) || this.footer.contains(event.target) || this.right && this.right.contains(event.target)) {
					this.scrollTarget = event.currentTarget;
				}
			}
		}, {
			key: "onMouseLeave",
			value: function onMouseLeave(event) {
				event.stopPropagation();
				BX.unbind(this.layout, this.wheelEventName, this.onMouseWheel);
				BX.unbind(this.layout, 'touchmove', this.onMouseWheel);
			}
		}, {
			key: "onMouseWheel",
			value: function onMouseWheel(event) {
				var _this3 = this;
				event.preventDefault();
				event.stopPropagation();
				var delta = Content.getDeltaFromEvent(event);
				var scrollTop = this.scrollTarget.scrollTop;
				requestAnimationFrame(function () {
					_this3.scrollTarget.scrollTop = scrollTop - delta.y;
				});
			}
		}, {
			key: "scrollTo",
			value: function scrollTo(element) {
				void Content.scrollTo(this.content, element);
			}
		}, {
			key: "isShown",
			value: function isShown() {
				return this.state === 'shown';
			}
		}, {
			key: "shouldAdjustActionsPanels",
			value: function shouldAdjustActionsPanels() {
				return this.adjustActionsPanels;
			}

			// Outside isolation would make the editor top panel and the view inert while the panel is open.
		}, {
			key: "getFocusTrapOptions",
			value: function getFocusTrapOptions() {
				return {
					isolateOutside: false
				};
			}

			/**
			 * A dialog is named by its title and takes its role from the base panel; its focus trap comes
			 * later, see activateFocusTrapWhenShown. A non-modal panel has neither, and the focus it moves
			 * into itself on open would land on an anonymous generic container. `region` turns the
			 * container into a named landmark — and it is the role that makes an accessible name
			 * legitimate in the first place: naming a generic element is prohibited.
			 */
		}, {
			key: "activateContentA11y",
			value: function activateContentA11y() {
				this.setAriaLabelledBy(this.title);
				if (!this.isDialog) {
					// Only a named landmark is worth having: an unnamed `region` is announced as one more
					// region among the others, and a panel without a title (a preset panel of an heir that
					// never set one) would produce exactly that.
					if (this.layout.hasAttribute('aria-labelledby')) {
						this.layout.setAttribute('role', 'region');
					}
					return;
				}
				this.activateDialogA11y();
			}
		}, {
			key: "deactivateContentA11y",
			value: function deactivateContentA11y() {
				if (!this.isDialog) {
					// A hidden layout stays in the document, and a landmark of a closed panel is noise.
					this.layout.removeAttribute('role');
					this.layout.removeAttribute('aria-labelledby');
					return;
				}
				this.deactivateDialogA11y();
			}

			/**
			 * The trap is what moves the focus into the panel, so it waits for the entrance animation:
			 * while the layout is transparent nothing inside it counts as focusable and the focus would
			 * land on the bare container. The wait is capped instead of being trusted — `animationend`
			 * can be late, interrupted by a panel-to-panel transition or never fire at all in a
			 * background tab, and a dialog that never traps the focus is the worse outcome.
			 * @param {Promise} showing
			 * @return {Promise}
			 */
		}, {
			key: "activateFocusTrapWhenShown",
			value: function activateFocusTrapWhenShown(showing) {
				var _this4 = this;
				var waiting = null;
				var shown = new Promise(function (resolve) {
					waiting = setTimeout(resolve, SHOW_ANIMATION_TIMEOUT);
				});
				return Promise.race([showing, shown]).then(function () {
					clearTimeout(waiting);
					_this4.activateFocusTrap();
				});
			}

			// eslint-disable-next-line no-unused-vars
		}, {
			key: "show",
			value: function show(options) {
				var _this5 = this;
				if (!this.isShown()) {
					this.prepareFocusReturn();
					if (this.shouldAdjustActionsPanels()) {
						main_core.Dom.addClass(document.body, 'landing-ui-hide-action-panels');
					}
					if (this.disableScroll) {
						main_core.Dom.addClass(document.body, "landing-ui-action-panels-disable-scrollbar");
					}
					main_core.Event.bind(this.layout, 'click', this.onContentClick.bind(this));
					main_core.Event.bind(this.content, 'scroll', this.onContentScroll.bind(this));
					void BX.Landing.Utils.Show(this.overlay);
					var showPromise = BX.Landing.Utils.Show(this.layout);

					// Role and name go up front, decoupled from the entrance animation.
					// BX.Landing.Utils.Show resolves only on animationend, which can be delayed,
					// interrupted (panel-to-panel transitions) or never fire (background tab) —
					// leaving the panel unnamed and roleless.
					// The title is populated by subclasses before show() is called.
					this.activateContentA11y();
					void this.activateFocusTrapWhenShown(showPromise);
					return showPromise.then(function () {
						_this5.state = 'shown';
					});
				}
				return Promise.resolve(true);
			}
		}, {
			key: "onContentClick",
			value: function onContentClick(event) {
				this.emit('onClick', {
					event: event
				});
			}
		}, {
			key: "onContentScroll",
			value: function onContentScroll(event) {
				this.emit('onScroll');
			}
		}, {
			key: "hide",
			value: function hide() {
				var _this6 = this;
				this.emit('onHide');
				if (this.isShown()) {
					this.deactivateContentA11y();
					if (this.shouldAdjustActionsPanels()) {
						main_core.Dom.removeClass(document.body, 'landing-ui-hide-action-panels');
					}
					if (this.disableScroll) {
						main_core.Dom.removeClass(document.body, "landing-ui-action-panels-disable-scrollbar");
					}
					void BX.Landing.Utils.Hide(this.overlay);

					// `Utils.Hide` hides only an element carrying the mark of a finished enter animation
					// and leaves the rest on screen, so the leave is real only when the mark is there.
					var isLeaving = BX.Landing.Utils.isShown(this.layout);
					var hiding = BX.Landing.Utils.Hide(this.layout).then(function () {
						_this6.state = 'hidden';
					});
					return this.restoreFocusAfterHide(hiding, isLeaving);
				}
				return Promise.resolve(true);
			}
		}, {
			key: "appendForm",
			value: function appendForm(form) {
				this.forms.add(form);
				main_core.Dom.append(form.getNode(), this.content);
			}
		}, {
			key: "replaceForm",
			value: function replaceForm(newForm, oldForm) {
				this.forms.add(newForm);
				main_core.Dom.insertAfter(newForm.getNode(), oldForm.getNode());
				this.forms.remove(oldForm);
				main_core.Dom.remove(oldForm.getNode());
			}
		}, {
			key: "appendCard",
			value: function appendCard(card) {
				if (this.data.scrollAnimation) {
					main_core.Dom.addClass(card.layout, 'landing-ui-is-not-visible');
					this.scrollObserver.observe(card.layout);
				}
				main_core.Dom.append(card.layout, this.content);
				card.onAppend();
			}
		}, {
			key: "clear",
			value: function clear() {
				this.clearContent();
				this.clearSidebar();
				this.forms.clear();
			}
		}, {
			key: "clearContent",
			value: function clearContent() {
				main_core.Dom.clean(this.content);
			}
		}, {
			key: "clearSidebar",
			value: function clearSidebar() {
				main_core.Dom.clean(this.sidebar);
				this.sidebarButtons = new BX.Landing.UI.Collection.ButtonCollection();
			}
		}, {
			key: "setTitle",
			value: function setTitle(title) {
				this.title.innerHTML = title;
			}
		}, {
			key: "appendFooterButton",
			value: function appendFooterButton(button) {
				this.buttons.add(button);
				main_core.Dom.append(button.layout, this.footer);
			}
		}, {
			key: "appendSidebarButton",
			value: function appendSidebarButton(button) {
				this.sidebarButtons.add(button);
				main_core.Dom.append(button.layout, this.sidebar);
			}
		}, {
			key: "setOverlayClass",
			value: function setOverlayClass(className) {
				main_core.Dom.addClass(this.overlay, className);
			}
		}, {
			key: "renderTo",
			value: function renderTo(target) {
				_superPropGet(Content, "renderTo", this)([target]);
				main_core.Dom.append(this.overlay, target);
			}
		}, {
			key: "checkReadyToSave",
			value: function checkReadyToSave() {
				var _this7 = this;
				var canSave = true;
				this.forms.forEach(function (form) {
					form.fields.forEach(function (field) {
						if (field.readyToSave === false) {
							canSave = false;
						}
						if (!field.getListeners('onChangeReadyToSave').has(_this7.checkReadyToSave)) {
							field.subscribe('onChangeReadyToSave', _this7.checkReadyToSave);
						}
					});
				});
				canSave ? this.enableSave() : this.disableSave();
			}
		}, {
			key: "disableSave",
			value: function disableSave() {
				var saveButton = this.buttons.get('save_block_content');
				if (saveButton) {
					saveButton.disable();
				}
			}
		}, {
			key: "enableSave",
			value: function enableSave() {
				var saveButton = this.buttons.get('save_block_content');
				if (saveButton) {
					saveButton.enable();
				}
			}
		}], [{
			key: "createOverlay",
			value: function createOverlay() {
				return main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-panel-content-overlay landing-ui-hide\" data-is-shown=\"false\" hidden></div>\n\t\t"])));
			}
		}, {
			key: "createHeader",
			value: function createHeader() {
				return main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-panel-content-element landing-ui-panel-content-header\"></div>\n\t\t"])));
			}
		}, {
			key: "createTitle",
			value: function createTitle() {
				return main_core.Tag.render(_templateObject4 || (_templateObject4 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-panel-content-title\"></div>\n\t\t"])));
			}
		}, {
			key: "createBody",
			value: function createBody() {
				return main_core.Tag.render(_templateObject5 || (_templateObject5 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-panel-content-element landing-ui-panel-content-body\"></div>\n\t\t"])));
			}
		}, {
			key: "createSidebar",
			value: function createSidebar() {
				return main_core.Tag.render(_templateObject6 || (_templateObject6 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-panel-content-body-sidebar\"></div>\n\t\t"])));
			}
		}, {
			key: "createContent",
			value: function createContent() {
				return main_core.Tag.render(_templateObject7 || (_templateObject7 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-panel-content-body-content\"></div>\n\t\t"])));
			}
		}, {
			key: "createFooter",
			value: function createFooter() {
				return main_core.Tag.render(_templateObject8 || (_templateObject8 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-panel-content-element landing-ui-panel-content-footer\"></div>\n\t\t"])));
			}
		}, {
			key: "calculateTransitionDuration",
			value: function calculateTransitionDuration() {
				var diff = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
				return calculateDurationTransition(diff);
			}
		}, {
			key: "scrollTo",
			value: function scrollTo$1(container, element) {
				return scrollTo(container, element);
			}
		}, {
			key: "getDeltaFromEvent",
			value: function getDeltaFromEvent$1(event) {
				return getDeltaFromEvent(event);
			}
		}]);
	}(landing_ui_panel_base.BasePanel);

	exports.Content = Content;

})(this.BX.Landing.UI.Panel = this.BX.Landing.UI.Panel || {}, window, BX, BX, BX.Landing.UI.Panel);
//# sourceMappingURL=content.bundle.js.map
