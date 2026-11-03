/* eslint-disable */
this.BX = this.BX || {};
this.BX.Vue3 = this.BX.Vue3 || {};
(function (exports, main_core, ui_hint, main_popup) {
	'use strict';

	const POPUP_ANGLE_HALF_WIDTH = 17;
	const SCROLLABLE_OVERFLOW_VALUES = new Set(['auto', 'scroll', 'overlay']);
	const isScrollableY = element => {
		const {
			overflowY
		} = getComputedStyle(element);
		return SCROLLABLE_OVERFLOW_VALUES.has(overflowY) && element.scrollHeight > element.clientHeight;
	};
	class Tooltip {
		#popup;
		#cursorOnPopup;
		constructor() {
			this.#popup = null;
			this.#cursorOnPopup = false;
		}
		#getCenteredAngleOffset(element) {
			const elementRect = element.getBoundingClientRect();
			const elementWidth = elementRect.width || element.offsetWidth;
			return elementWidth ? main_popup.Popup.getOption('angleLeftOffset') - POPUP_ANGLE_HALF_WIDTH + elementWidth / 2 : false;
		}
		#fixPopupAngle(element) {
			if (!this.#popup?.angle) {
				return;
			}
			const popupContainer = this.#popup.getPopupContainer();
			if (!popupContainer) {
				return;
			}
			setTimeout(() => {
				const elementRect = element.getBoundingClientRect();
				const popupRect = popupContainer.getBoundingClientRect();
				const offset = elementRect.width ? elementRect.left + elementRect.width / 2 - popupRect.left - POPUP_ANGLE_HALF_WIDTH : false;
				this.#popup.angle.offset = offset;
				if (this.#popup.angle.position === 'bottom') {
					this.#popup.angle.element.style.left = '0';
					this.#popup.angle.element.style.marginLeft = offset === false ? '' : `${offset}px`;
				} else {
					this.#popup.angle.element.style.marginLeft = '0';
					this.#popup.angle.element.style.left = offset === false ? '' : `${offset}px`;
				}
			}, 0);
		}
		#getBindElement(element, params) {
			if (main_core.Type.isDomNode(params.popupOptions?.bindElement)) {
				return params.popupOptions.bindElement;
			}
			return element;
		}
		#getTargetContainer(element) {
			let parent = element.parentElement;
			const ownerDocument = element.ownerDocument;
			while (parent && parent !== ownerDocument.body) {
				if (isScrollableY(parent)) {
					const style = getComputedStyle(parent);
					if (style.position === 'static') {
						parent.style.position = 'relative';
					}
					return parent;
				}
				parent = parent.parentElement;
			}
			return ownerDocument.body;
		}
		show(element, params, onClose = null) {
			this.hide(false);
			const bindElement = this.#getBindElement(element, params);
			const popupClassName = ['ui-hint-popup', params.interactivity ? 'ui-hint-popup-interactivity' : '', params.popupOptions?.className ?? ''].filter(Boolean).join(' ');
			const popupOptions = {
				id: `bx-vue-hint-${Date.now()}`,
				bindOptions: {
					position: params.position === 'top' ? 'top' : 'bottom'
				},
				content: main_core.Tag.render`
				<span class='ui-hint-content'>${this.#getText(element, params)}</span>
			`,
				darkMode: true,
				autoHide: true,
				closeByEsc: true,
				cacheable: false,
				focusTrap: false,
				animation: 'fading',
				angle: true,
				...(params.popupOptions ?? null),
				className: popupClassName
			};
			popupOptions.bindElement = bindElement;
			popupOptions.targetContainer ??= this.#getTargetContainer(bindElement);
			popupOptions.angle = {
				offset: this.#getCenteredAngleOffset(bindElement)
			};
			this.#popup = new main_popup.Popup(popupOptions);
			if (onClose) {
				this.#popup.subscribe('onClose', onClose);
			}
			this.#popup.show();
			this.#fixPopupAngle(bindElement);
			const popupContainer = this.#popup?.getPopupContainer();
			if (params.interactivity && popupContainer) {
				main_core.Event.bind(popupContainer, 'mouseenter', () => {
					this.#cursorOnPopup = true;
				});
				main_core.Event.bind(popupContainer, 'mouseleave', () => {
					this.#cursorOnPopup = false;
					this.hide(true);
				});
			}
		}
		hide(isInteractive) {
			if (isInteractive) {
				const popup = this.#popup;
				setTimeout(() => {
					if (popup && popup.getPopupContainer() && !this.#cursorOnPopup) {
						popup.close();
					}
				}, 100);
			} else {
				this.#popup?.close();
			}
		}
		#getText(element, params) {
			if (main_core.Type.isStringFilled(params) && main_core.Type.isUndefined(element.dataset.hintHtml)) {
				return main_core.Text.encode(params);
			}
			return params.html || main_core.Text.encode(params.text) || params;
		}
	}
	const tooltip = new Tooltip();

	/**
	 * Hint Vue directive
	 *
	 * @package bitrix
	 * @subpackage ui
	 * @copyright 2001-2025 Bitrix
	 */

	const handlersMap = new WeakMap();
	let activeElement = null;
	let showTimeout = null;
	let pendingElement = null;
	const hint = {
		mounted(element, {
			value
		}) {
			updateEvents(element, value);
		},
		updated(element, {
			value
		}) {
			updateEvents(element, value);
		},
		beforeUnmount(element) {
			unbindEvents(element);
		}
	};
	function updateEvents(element, params) {
		const binding = handlersMap.get(element);
		if (binding?.params === params) {
			return;
		}
		if (binding && params) {
			binding.params = params;
			binding.state.params = params;
			return;
		}
		if (binding) {
			unbindEvents(element);
		}
		if (params) {
			const state = {
				params,
				hovered: false,
				focused: false
			};
			const handlers = {
				mouseenter: () => {
					state.hovered = true;
					scheduleTooltip(element, getParams(state.params));
				},
				mouseleave: () => {
					state.hovered = false;
					if (!state.focused) {
						hideTooltip(element, getParams(state.params).interactivity ?? false);
					}
				},
				focus: () => {
					state.focused = true;
					scheduleTooltip(element, getParams(state.params));
				},
				blur: () => {
					state.focused = false;
					if (!state.hovered) {
						hideTooltip(element);
					}
				},
				click: () => hideTooltip(element)
			};
			handlersMap.set(element, {
				params,
				handlers,
				state
			});
			Object.entries(handlers).forEach(([event, handler]) => main_core.Event.bind(element, event, handler));
		}
	}
	function unbindEvents(element) {
		if (pendingElement === element) {
			clearTimeouts();
		}
		if (activeElement === element) {
			hideTooltip(element);
		}
		Object.entries(handlersMap.get(element)?.handlers ?? {}).forEach(([event, handler]) => main_core.Event.unbind(element, event, handler));
		handlersMap.delete(element);
	}
	function scheduleTooltip(element, params) {
		if (activeElement === element || pendingElement === element) {
			return;
		}
		clearTimeouts();
		pendingElement = element;
		showTimeout = setTimeout(() => {
			if (pendingElement === element && handlersMap.has(element)) {
				showTooltip(element, params);
			}
		}, params.timeout ?? 0);
	}
	function showTooltip(element, params) {
		clearTimeouts();
		activeElement = element;
		tooltip.show(element, params, () => {
			if (activeElement === element) {
				activeElement = null;
			}
		});
	}
	function hideTooltip(element, isInteractive = false) {
		if (pendingElement === element) {
			clearTimeouts();
		}
		if (activeElement !== element) {
			return;
		}
		activeElement = null;
		tooltip.hide(isInteractive);
	}
	function clearTimeouts() {
		clearTimeout(showTimeout);
		showTimeout = null;
		pendingElement = null;
	}
	function getParams(value) {
		return main_core.Type.isFunction(value) ? value() : value;
	}

	exports.hint = hint;

})(this.BX.Vue3.Directives = this.BX.Vue3.Directives || {}, BX, BX.UI, BX.Main);
//# sourceMappingURL=hint.bundle.js.map
