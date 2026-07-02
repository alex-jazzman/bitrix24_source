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
		show(element, params) {
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
				setTimeout(() => {
					if (this.#popup && this.#popup.getPopupContainer() && !this.#cursorOnPopup) {
						this.#popup.close();
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
	let showTimeout = null;
	function updateEvents(element, params) {
		unbindEvents(element);
		if (params) {
			const handlers = {
				mouseenter: () => onMouseEnter(element, getParams(params)),
				mouseleave: () => hideTooltip(getParams(params).interactivity ?? false),
				click: () => hideTooltip()
			};
			handlersMap.set(element, handlers);
			Object.entries(handlers).forEach(([event, handler]) => main_core.Event.bind(element, event, handler));
		}
	}
	function unbindEvents(element) {
		clearTimeouts();
		Object.entries(handlersMap.get(element) ?? {}).forEach(([event, handler]) => main_core.Event.unbind(element, event, handler));
		handlersMap.delete(element);
	}
	function onMouseEnter(element, params) {
		clearTimeouts();
		showTimeout = setTimeout(() => showTooltip(element, params), params.timeout ?? 0);
	}
	function showTooltip(element, params) {
		clearTimeouts();
		tooltip.show(element, params);
	}
	function hideTooltip(isInteractive) {
		clearTimeouts();
		tooltip.hide(isInteractive);
	}
	function clearTimeouts() {
		clearTimeout(showTimeout);
	}
	function getParams(value) {
		return main_core.Type.isFunction(value) ? value() : value;
	}

	exports.hint = hint;

})(this.BX.Vue3.Directives = this.BX.Vue3.Directives || {}, BX, BX.UI, BX.Main);
//# sourceMappingURL=hint.bundle.js.map
