/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, ui_bannerDispatcher) {
	'use strict';

	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
	function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	const queuedMenuIds = new Set();
	var _menuId = /*#__PURE__*/new WeakMap();
	var _decision = /*#__PURE__*/new WeakMap();
	var _popup = /*#__PURE__*/new WeakMap();
	var _menuElement = /*#__PURE__*/new WeakMap();
	var _highlight = /*#__PURE__*/new WeakMap();
	var _frameId = /*#__PURE__*/new WeakMap();
	var _resizeObserver = /*#__PURE__*/new WeakMap();
	var _mutationObserver = /*#__PURE__*/new WeakMap();
	var _lastPosition = /*#__PURE__*/new WeakMap();
	var _lastPopupWidth = /*#__PURE__*/new WeakMap();
	var _lastAngleOffset = /*#__PURE__*/new WeakMap();
	var _scheduleFollowMenu = /*#__PURE__*/new WeakMap();
	var _CollaborationMenuBalloon_brand = /*#__PURE__*/new WeakSet();
	let CollaborationMenuBalloon = /*#__PURE__*/function () {
		function CollaborationMenuBalloon({
			menuId,
			decision
		} = {}) {
			babelHelpers.classCallCheck(this, CollaborationMenuBalloon);
			_classPrivateMethodInitSpec(this, _CollaborationMenuBalloon_brand);
			_classPrivateFieldInitSpec(this, _menuId, void 0);
			_classPrivateFieldInitSpec(this, _decision, void 0);
			_classPrivateFieldInitSpec(this, _popup, null);
			_classPrivateFieldInitSpec(this, _menuElement, null);
			_classPrivateFieldInitSpec(this, _highlight, null);
			_classPrivateFieldInitSpec(this, _frameId, null);
			_classPrivateFieldInitSpec(this, _resizeObserver, null);
			_classPrivateFieldInitSpec(this, _mutationObserver, null);
			_classPrivateFieldInitSpec(this, _lastPosition, '');
			_classPrivateFieldInitSpec(this, _lastPopupWidth, null);
			_classPrivateFieldInitSpec(this, _lastAngleOffset, null);
			_classPrivateFieldInitSpec(this, _scheduleFollowMenu, () => {
				if (_classPrivateFieldGet(_frameId, this) === null) {
					_classPrivateFieldSet(_frameId, this, requestAnimationFrame(() => {
						_classPrivateFieldSet(_frameId, this, null);
						_assertClassBrand(_CollaborationMenuBalloon_brand, this, _followMenu).call(this);
					}));
				}
			});
			_classPrivateFieldSet(_menuId, this, main_core.Type.isStringFilled(menuId) ? menuId : null);
			_classPrivateFieldSet(_decision, this, decision ?? null);
		}
		return babelHelpers.createClass(CollaborationMenuBalloon, [{
			key: "show",
			value: function show() {
				if (!_classPrivateFieldGet(_menuId, this) || !['show', 'mark'].includes(_classPrivateFieldGet(_decision, this)) || queuedMenuIds.has(_classPrivateFieldGet(_menuId, this)) || !_assertClassBrand(_CollaborationMenuBalloon_brand, this, _getAnchor).call(this)) {
					return;
				}
				if (_classPrivateFieldGet(_decision, this) === 'mark') {
					BX.userOptions.save('intranet', 'collaboration_menu_balloon_processed', null, 'Y');
					queuedMenuIds.add(_classPrivateFieldGet(_menuId, this));
					return;
				}
				_assertClassBrand(_CollaborationMenuBalloon_brand, this, _queue).call(this);
			}
		}]);
	}();
	function _queue() {
		if (queuedMenuIds.has(_classPrivateFieldGet(_menuId, this))) {
			return;
		}
		queuedMenuIds.add(_classPrivateFieldGet(_menuId, this));
		ui_bannerDispatcher.BannerDispatcher.normal.toQueue(onDone => {
			let finished = false;
			let shown = false;
			const finish = () => {
				if (finished) {
					return;
				}
				finished = true;
				main_core.Event.unbind(window, 'pagehide', leavePage);
				_assertClassBrand(_CollaborationMenuBalloon_brand, this, _stopHighlight).call(this);
				onDone();
			};
			const leavePage = () => {
				finish();
				_classPrivateFieldGet(_popup, this)?.destroy();
				_classPrivateFieldSet(_popup, this, null);
			};
			const anchor = _assertClassBrand(_CollaborationMenuBalloon_brand, this, _getAnchor).call(this);
			if (!anchor || _assertClassBrand(_CollaborationMenuBalloon_brand, this, _isMessengerPage).call(this) && main_popup.PopupManager.getPopupById('im-folder-panel-onboarding-tour')?.isShown()) {
				queuedMenuIds.delete(_classPrivateFieldGet(_menuId, this));
				finish();
				return;
			}
			try {
				_classPrivateFieldSet(_menuElement, this, document.getElementById(_classPrivateFieldGet(_menuId, this)) ?? anchor);
				const popupWidth = _assertClassBrand(_CollaborationMenuBalloon_brand, this, _getPopupWidth).call(this);
				const angleOffset = _assertClassBrand(_CollaborationMenuBalloon_brand, this, _getAngleOffset).call(this, _classPrivateFieldGet(_menuElement, this).getBoundingClientRect().width, popupWidth);
				_classPrivateFieldSet(_popup, this, new main_popup.Popup({
					bindElement: _classPrivateFieldGet(_menuElement, this),
					targetContainer: document.body,
					content: _assertClassBrand(_CollaborationMenuBalloon_brand, this, _createContent).call(this),
					width: popupWidth,
					padding: 0,
					background: 'var(--ui-color-accent-soft-element-blue)',
					borderRadius: '16px',
					contentBorderRadius: '16px',
					autoHide: false,
					closeByEsc: true,
					closeIcon: false,
					offsetTop: 8,
					offsetLeft: 40,
					bindOptions: {
						position: 'bottom',
						forceBindPosition: true
					},
					angle: {
						position: 'top',
						offset: angleOffset
					},
					role: 'dialog',
					ariaLabelledBy: 'intranet-collaboration-menu-balloon-title',
					ariaDescribedBy: 'intranet-collaboration-menu-balloon-text',
					events: {
						onClose: () => {
							if (finished) {
								return;
							}
							try {
								if (shown) {
									BX.userOptions.save('intranet', 'collaboration_menu_balloon_processed', null, 'Y');
								}
							} finally {
								finish();
							}
						}
					}
				}));
				_classPrivateFieldSet(_lastPopupWidth, this, popupWidth);
				_classPrivateFieldSet(_lastAngleOffset, this, angleOffset);
				main_core.Event.bind(window, 'pagehide', leavePage);
				_classPrivateFieldGet(_popup, this).show();
				shown = true;
				_assertClassBrand(_CollaborationMenuBalloon_brand, this, _startHighlight).call(this);
			} catch {
				queuedMenuIds.delete(_classPrivateFieldGet(_menuId, this));
				finish();
				_classPrivateFieldGet(_popup, this)?.destroy();
				_classPrivateFieldSet(_popup, this, null);
			}
		}, {
			id: `intranet.collaboration-menu-balloon.${_classPrivateFieldGet(_menuId, this)}`
		});
	}
	function _createContent() {
		const content = main_core.Tag.render`
			<div class="intranet-collaboration-menu-balloon --ui-context-content-dark" data-testid="intranet-collaboration-menu-balloon">
				<button type="button" class="intranet-collaboration-menu-balloon__close" aria-label="${main_core.Loc.getMessage('INTRANET_COLLABORATION_MENU_BALLOON_CLOSE_ARIA')}"><span class="ui-icon-set --cross-l" aria-hidden="true"></span></button>
				<div class="intranet-collaboration-menu-balloon__image"></div>
				<div class="intranet-collaboration-menu-balloon__body">
					<div id="intranet-collaboration-menu-balloon-title" class="intranet-collaboration-menu-balloon__title ui-headline --md">${main_core.Loc.getMessage('INTRANET_COLLABORATION_MENU_BALLOON_TITLE')}</div>
					<div id="intranet-collaboration-menu-balloon-text" class="intranet-collaboration-menu-balloon__text ui-text --sm">${main_core.Loc.getMessage('INTRANET_COLLABORATION_MENU_BALLOON_TEXT')}</div>
					<div class="intranet-collaboration-menu-balloon__footer">
						<button type="button" class="intranet-collaboration-menu-balloon__button ui-btn --air --style-filled ui-btn-md ui-btn-no-caps">${main_core.Loc.getMessage('INTRANET_COLLABORATION_MENU_BALLOON_BUTTON')}</button>
					</div>
				</div>
			</div>
		`;
		main_core.Event.bind(content.querySelector('.intranet-collaboration-menu-balloon__close'), 'click', () => _classPrivateFieldGet(_popup, this)?.close());
		main_core.Event.bind(content.querySelector('.intranet-collaboration-menu-balloon__button'), 'click', () => _classPrivateFieldGet(_popup, this)?.close());
		return content;
	}
	function _startHighlight() {
		_classPrivateFieldSet(_highlight, this, document.createElement('div'));
		_classPrivateFieldGet(_highlight, this).className = 'intranet-collaboration-menu-balloon__highlight ui-highlighter';
		_classPrivateFieldGet(_highlight, this).dataset.testid = 'intranet-collaboration-menu-balloon-highlight';
		document.body.append(_classPrivateFieldGet(_highlight, this));
		const strip = _classPrivateFieldGet(_menuElement, this)?.closest('.main-buttons') ?? _classPrivateFieldGet(_menuElement, this);
		if (strip) {
			_classPrivateFieldSet(_resizeObserver, this, new ResizeObserver(_classPrivateFieldGet(_scheduleFollowMenu, this)));
			_classPrivateFieldGet(_resizeObserver, this).observe(strip);
			_classPrivateFieldSet(_mutationObserver, this, new MutationObserver(_classPrivateFieldGet(_scheduleFollowMenu, this)));
			_classPrivateFieldGet(_mutationObserver, this).observe(strip, {
				attributes: true,
				attributeFilter: ['class', 'style', 'hidden'],
				childList: true,
				subtree: true
			});
		}
		main_core.Event.bind(window, 'resize', _classPrivateFieldGet(_scheduleFollowMenu, this));
		main_core.Event.bind(window, 'scroll', _classPrivateFieldGet(_scheduleFollowMenu, this), true);
		_classPrivateFieldGet(_scheduleFollowMenu, this).call(this);
	}
	function _followMenu() {
		const menuRect = _classPrivateFieldGet(_menuElement, this)?.getBoundingClientRect();
		const frameRect = _assertClassBrand(_CollaborationMenuBalloon_brand, this, _getFrameRect).call(this);
		const popupWidth = _assertClassBrand(_CollaborationMenuBalloon_brand, this, _getPopupWidth).call(this);
		const angleOffset = menuRect ? _assertClassBrand(_CollaborationMenuBalloon_brand, this, _getAngleOffset).call(this, menuRect.width, popupWidth) : null;
		const key = menuRect && frameRect ? `${menuRect.left}:${menuRect.top}:${menuRect.width}:${menuRect.height}:${frameRect.left}:${frameRect.top}:${frameRect.width}:${frameRect.height}:${popupWidth}` : '';
		if (key !== _classPrivateFieldGet(_lastPosition, this)) {
			_classPrivateFieldSet(_lastPosition, this, key);
			_assertClassBrand(_CollaborationMenuBalloon_brand, this, _placePopup).call(this, popupWidth, angleOffset);
			_assertClassBrand(_CollaborationMenuBalloon_brand, this, _placeHighlight).call(this, frameRect);
		}
	}
	function _getFrameRect() {
		const strip = _classPrivateFieldGet(_menuElement, this)?.closest('.main-buttons') ?? _classPrivateFieldGet(_menuElement, this);
		const items = [...(strip?.querySelectorAll(`[data-top-menu-id="${CSS.escape(_classPrivateFieldGet(_menuId, this))}"][data-item]`) ?? []), ...(strip?.querySelectorAll('.main-buttons-item-more') ?? [])].filter(item => item.getClientRects().length > 0);
		if (items.length === 0) {
			return null;
		}
		const rects = items.map(item => item.getBoundingClientRect());
		const left = Math.min(...rects.map(rect => rect.left)) - 14;
		const right = Math.max(...rects.map(rect => rect.right)) + 14;
		const top = Math.min(...rects.map(rect => rect.top)) + 9;
		return {
			left,
			top,
			width: right - left,
			height: 38
		};
	}
	function _placeHighlight(rect) {
		if (!_classPrivateFieldGet(_highlight, this)) {
			return;
		}
		main_core.Dom.style(_classPrivateFieldGet(_highlight, this), 'display', rect ? '' : 'none');
		if (!rect) {
			return;
		}
		Object.assign(_classPrivateFieldGet(_highlight, this).style, {
			left: `${rect.left}px`,
			top: `${rect.top}px`,
			width: `${rect.width}px`,
			height: `${rect.height}px`,
			zIndex: String((_classPrivateFieldGet(_popup, this)?.getZindex() ?? 1001) - 1)
		});
	}
	function _placePopup(popupWidth, angleOffset) {
		if (popupWidth !== _classPrivateFieldGet(_lastPopupWidth, this)) {
			_classPrivateFieldGet(_popup, this)?.setWidth(popupWidth);
			_classPrivateFieldSet(_lastPopupWidth, this, popupWidth);
		}
		if (angleOffset !== null && angleOffset !== _classPrivateFieldGet(_lastAngleOffset, this)) {
			_classPrivateFieldGet(_popup, this)?.setAngle({
				position: 'top',
				offset: angleOffset
			});
			_classPrivateFieldSet(_lastAngleOffset, this, angleOffset);
		}
		_classPrivateFieldGet(_popup, this)?.adjustPosition({
			position: 'bottom',
			forceBindPosition: true
		});
	}
	function _stopHighlight() {
		if (_classPrivateFieldGet(_frameId, this) !== null) {
			cancelAnimationFrame(_classPrivateFieldGet(_frameId, this));
			_classPrivateFieldSet(_frameId, this, null);
		}
		_classPrivateFieldGet(_resizeObserver, this)?.disconnect();
		_classPrivateFieldSet(_resizeObserver, this, null);
		_classPrivateFieldGet(_mutationObserver, this)?.disconnect();
		_classPrivateFieldSet(_mutationObserver, this, null);
		main_core.Event.unbind(window, 'resize', _classPrivateFieldGet(_scheduleFollowMenu, this));
		main_core.Event.unbind(window, 'scroll', _classPrivateFieldGet(_scheduleFollowMenu, this), true);
		_classPrivateFieldSet(_lastPosition, this, '');
		_classPrivateFieldSet(_lastPopupWidth, this, null);
		_classPrivateFieldSet(_lastAngleOffset, this, null);
		_classPrivateFieldGet(_highlight, this)?.remove();
		_classPrivateFieldSet(_highlight, this, null);
	}
	function _getPopupWidth() {
		return Math.min(448, Math.max(0, document.documentElement.clientWidth - 32));
	}
	function _getAngleOffset(menuWidth, popupWidth) {
		const offset = Math.round(menuWidth / 2) - 16;
		return Math.max(0, Math.min(Math.max(offset, 24), popupWidth - 56));
	}
	function _isMessengerPage() {
		return /(?:^|\/)online(?:\/|$)/.test(window.location.pathname);
	}
	function _getAnchor() {
		const selector = `[data-top-menu-id="${CSS.escape(_classPrivateFieldGet(_menuId, this))}"][data-item]`;
		return [...document.querySelectorAll(selector)].find(item => item.getClientRects().length > 0) ?? null;
	}

	exports.CollaborationMenuBalloon = CollaborationMenuBalloon;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Main, BX.UI);
//# sourceMappingURL=collaboration-menu-balloon.bundle.js.map
