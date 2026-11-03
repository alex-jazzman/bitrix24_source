/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, main_core) {
	'use strict';

	const SEPARATOR_CLASS = 'ui-sidepanel-left-panel-resizer';
	const DRAGGING_CLASS = '--dragging';
	class LeftPanelResizer {
		static #instances = new WeakMap();
		#panel;
		#separator;
		#container;
		#storageOptions;
		#initialWidth;
		#minWidth;
		#maxWidth;
		#minContentWidth;
		#keyboardStep;
		#preferredWidth;
		#appliedWidth;
		#gesture = null;
		#resizeAnimationFrameId = null;
		#resizeObserver;
		#isDestroyed = false;
		#originalPanelWidth;
		#originalSeparatorAttributes;
		#hadSeparatorClass;
		#originalBodyCursor = null;
		#originalBodyUserSelect = null;
		#originalBodyWebkitUserSelect = null;
		constructor(options) {
			LeftPanelResizer.#instances.get(options.separator)?.destroy();
			LeftPanelResizer.#instances.set(options.separator, this);
			this.#panel = options.panel;
			this.#separator = options.separator;
			this.#container = options.container;
			this.#storageOptions = options.STORAGE ?? null;
			this.#initialWidth = options.INITIAL_WIDTH;
			this.#minWidth = options.MIN_WIDTH;
			this.#maxWidth = options.MAX_WIDTH;
			this.#minContentWidth = options.MIN_CONTENT_WIDTH;
			this.#keyboardStep = options.KEYBOARD_STEP;
			this.#appliedWidth = this.#initialWidth;
			this.#originalPanelWidth = this.#getInlineStyleSnapshot(this.#panel, 'width');
			this.#originalSeparatorAttributes = this.#getSeparatorAttributeSnapshot();
			this.#hadSeparatorClass = main_core.Dom.hasClass(this.#separator, SEPARATOR_CLASS);
			this.#preferredWidth = this.#readPreferredWidth();
			this.#prepareSeparator(options.ACCESSIBLE_NAME);
			this.#bindEvents();
			this.#resizeObserver = new ResizeObserver(this.#handleContainerResize);
			this.#resizeObserver.observe(this.#container);
			this.#applyWidth(this.#preferredWidth);
		}
		destroy() {
			if (this.#isDestroyed) {
				return;
			}
			this.#isDestroyed = true;
			this.#cancelGesture();
			this.#unbindEvents();
			this.#resizeObserver.disconnect();
			this.#restoreInlineStyle(this.#panel, 'width', this.#originalPanelWidth);
			this.#restoreSeparator();
			if (LeftPanelResizer.#instances.get(this.#separator) === this) {
				LeftPanelResizer.#instances.delete(this.#separator);
			}
		}
		#prepareSeparator(accessibleName) {
			main_core.Dom.addClass(this.#separator, SEPARATOR_CLASS);
			main_core.Dom.attr(this.#separator, {
				role: 'separator',
				'aria-orientation': 'vertical',
				tabindex: '0'
			});
			if (main_core.Type.isStringFilled(accessibleName)) {
				main_core.Dom.attr(this.#separator, 'aria-label', accessibleName);
			}
			if (main_core.Type.isStringFilled(this.#panel.id)) {
				main_core.Dom.attr(this.#separator, 'aria-controls', this.#panel.id);
			}
		}
		#bindEvents() {
			main_core.Event.bind(this.#separator, 'pointerdown', this.#handlePointerDown);
			main_core.Event.bind(this.#separator, 'pointermove', this.#handlePointerMove);
			main_core.Event.bind(this.#separator, 'pointerup', this.#handlePointerUp);
			main_core.Event.bind(this.#separator, 'pointercancel', this.#handlePointerCancel);
			main_core.Event.bind(this.#separator, 'lostpointercapture', this.#handleLostPointerCapture);
			main_core.Event.bind(this.#separator, 'keydown', this.#handleKeyDown);
		}
		#unbindEvents() {
			main_core.Event.unbind(this.#separator, 'pointerdown', this.#handlePointerDown);
			main_core.Event.unbind(this.#separator, 'pointermove', this.#handlePointerMove);
			main_core.Event.unbind(this.#separator, 'pointerup', this.#handlePointerUp);
			main_core.Event.unbind(this.#separator, 'pointercancel', this.#handlePointerCancel);
			main_core.Event.unbind(this.#separator, 'lostpointercapture', this.#handleLostPointerCapture);
			main_core.Event.unbind(this.#separator, 'keydown', this.#handleKeyDown);
		}
		#handlePointerDown = event => {
			if (this.#gesture !== null || event.button !== 0 || !event.isPrimary) {
				return;
			}
			try {
				this.#separator.setPointerCapture(event.pointerId);
			} catch {
				return;
			}
			this.#gesture = {
				pointerId: event.pointerId,
				startClientX: event.clientX,
				startPreferredWidth: this.#preferredWidth,
				startAppliedWidth: this.#appliedWidth,
				pendingPreferredWidth: this.#preferredWidth
			};
			main_core.Dom.addClass(this.#separator, DRAGGING_CLASS);
			this.#applyDraggingStyles();
			event.preventDefault();
		};
		#handlePointerMove = event => {
			if (event.pointerId !== this.#gesture?.pointerId) {
				return;
			}
			this.#gesture.pendingPreferredWidth = this.#getGestureWidth(event.clientX);
			this.#scheduleGestureWidthUpdate();
		};
		#handlePointerUp = event => {
			if (event.pointerId !== this.#gesture?.pointerId) {
				return;
			}
			const preferredWidth = this.#getGestureWidth(event.clientX);
			const pointerId = this.#gesture.pointerId;
			this.#cancelScheduledWidthUpdate();
			this.#gesture = null;
			this.#releasePointerCapture(pointerId);
			this.#restoreDraggingStyles();
			this.#commit(preferredWidth);
		};
		#handlePointerCancel = event => {
			if (event.pointerId === this.#gesture?.pointerId) {
				this.#cancelGesture();
			}
		};
		#handleLostPointerCapture = event => {
			if (event.pointerId === this.#gesture?.pointerId) {
				this.#cancelGesture();
			}
		};
		#handleKeyDown = event => {
			if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
				return;
			}
			const direction = event.key === 'ArrowLeft' ? -1 : 1;
			this.#commit(this.#appliedWidth + direction * this.#keyboardStep);
			event.preventDefault();
		};
		#handleContainerResize = () => {
			this.#applyWidth(this.#gesture?.pendingPreferredWidth ?? this.#preferredWidth);
		};
		#scheduleGestureWidthUpdate() {
			if (this.#resizeAnimationFrameId !== null) {
				return;
			}
			this.#resizeAnimationFrameId = window.requestAnimationFrame(() => {
				this.#resizeAnimationFrameId = null;
				if (this.#gesture !== null && !this.#isDestroyed) {
					this.#applyWidth(this.#gesture.pendingPreferredWidth);
				}
			});
		}
		#cancelScheduledWidthUpdate() {
			if (this.#resizeAnimationFrameId === null) {
				return;
			}
			window.cancelAnimationFrame(this.#resizeAnimationFrameId);
			this.#resizeAnimationFrameId = null;
		}
		#getGestureWidth(clientX) {
			if (this.#gesture === null) {
				return this.#preferredWidth;
			}
			const delta = clientX - this.#gesture.startClientX;
			if (delta === 0) {
				return this.#gesture.startPreferredWidth;
			}
			return this.#normalizePreferredWidth(this.#gesture.startAppliedWidth + delta);
		}
		#commit(width) {
			this.#preferredWidth = this.#normalizePreferredWidth(width);
			this.#applyWidth(this.#preferredWidth);
			this.#savePreferredWidth();
		}
		#cancelGesture() {
			this.#cancelScheduledWidthUpdate();
			if (this.#gesture === null) {
				main_core.Dom.removeClass(this.#separator, DRAGGING_CLASS);
				return;
			}
			const pointerId = this.#gesture.pointerId;
			this.#gesture = null;
			this.#releasePointerCapture(pointerId);
			this.#restoreDraggingStyles();
			this.#applyWidth(this.#preferredWidth);
		}
		#releasePointerCapture(pointerId) {
			if (this.#separator.hasPointerCapture(pointerId)) {
				this.#separator.releasePointerCapture(pointerId);
			}
		}
		#applyDraggingStyles() {
			this.#originalBodyCursor = this.#getInlineStyleSnapshot(document.body, 'cursor');
			this.#originalBodyUserSelect = this.#getInlineStyleSnapshot(document.body, 'user-select');
			this.#originalBodyWebkitUserSelect = this.#getInlineStyleSnapshot(document.body, '-webkit-user-select');
			main_core.Dom.style(document.body, {
				cursor: 'col-resize',
				'user-select': 'none',
				'-webkit-user-select': 'none'
			});
		}
		#restoreDraggingStyles() {
			main_core.Dom.removeClass(this.#separator, DRAGGING_CLASS);
			const bodyCursor = this.#originalBodyCursor;
			const bodyUserSelect = this.#originalBodyUserSelect;
			const bodyWebkitUserSelect = this.#originalBodyWebkitUserSelect;
			if (bodyCursor === null || bodyUserSelect === null || bodyWebkitUserSelect === null) {
				return;
			}
			this.#restoreInlineStyles(document.body, new Map([['cursor', bodyCursor], ['user-select', bodyUserSelect], ['-webkit-user-select', bodyWebkitUserSelect]]));
			this.#originalBodyCursor = null;
			this.#originalBodyUserSelect = null;
			this.#originalBodyWebkitUserSelect = null;
		}
		#applyWidth(preferredWidth) {
			const effectiveMax = Math.max(this.#minWidth, Math.min(this.#maxWidth, this.#container.getBoundingClientRect().width - this.#minContentWidth));
			this.#appliedWidth = this.#clamp(preferredWidth, this.#minWidth, effectiveMax);
			main_core.Dom.style(this.#panel, 'width', `${this.#appliedWidth}px`);
			main_core.Dom.attr(this.#separator, {
				'aria-valuemin': String(this.#minWidth),
				'aria-valuemax': String(Math.round(effectiveMax)),
				'aria-valuenow': String(Math.round(this.#appliedWidth))
			});
		}
		#readPreferredWidth() {
			if (this.#storageOptions === null) {
				return this.#initialWidth;
			}
			try {
				const serializedValue = window.localStorage.getItem(this.#storageOptions.KEY);
				if (serializedValue === null) {
					return this.#initialWidth;
				}
				const payload = JSON.parse(serializedValue);
				if (!main_core.Type.isPlainObject(payload)) {
					return this.#initialWidth;
				}
				const storedWidth = payload;
				if (storedWidth.version !== this.#storageOptions.VERSION || !main_core.Type.isInteger(storedWidth.width)) {
					return this.#initialWidth;
				}
				return this.#normalizePreferredWidth(storedWidth.width);
			} catch {
				return this.#initialWidth;
			}
		}
		#savePreferredWidth() {
			if (this.#storageOptions === null) {
				return;
			}
			try {
				window.localStorage.setItem(this.#storageOptions.KEY, JSON.stringify({
					version: this.#storageOptions.VERSION,
					width: this.#preferredWidth
				}));
			} catch {
			}
		}
		#normalizePreferredWidth(width) {
			return this.#clamp(Math.round(width), this.#minWidth, this.#maxWidth);
		}
		#clamp(value, min, max) {
			return Math.max(min, Math.min(max, value));
		}
		#getInlineStyleSnapshot(element, property) {
			const {
				style
			} = element;
			let isSet = false;
			for (let index = 0; index < style.length; index++) {
				if (style.item(index) === property) {
					isSet = true;
					break;
				}
			}
			return {
				isSet,
				value: style.getPropertyValue(property),
				priority: style.getPropertyPriority(property)
			};
		}
		#restoreInlineStyle(element, property, snapshot) {
			this.#restoreInlineStyles(element, new Map([[property, snapshot]]));
		}
		#restoreInlineStyles(element, snapshots) {
			const draft = document.createElement('div');
			const currentStyle = main_core.Dom.attr(element, 'style');
			if (main_core.Type.isStringFilled(currentStyle)) {
				main_core.Dom.attr(draft, 'style', currentStyle);
			}
			const {
				style
			} = draft;
			[...snapshots.keys()].forEach(property => style.removeProperty(property));
			snapshots.forEach((snapshot, property) => {
				if (snapshot.isSet) {
					style.setProperty(property, snapshot.value, snapshot.priority);
				}
			});
			const restoredStyle = main_core.Dom.attr(draft, 'style');
			main_core.Dom.attr(element, 'style', main_core.Type.isStringFilled(restoredStyle) ? restoredStyle : null);
		}
		#getSeparatorAttributeSnapshot() {
			return new Map([['role', this.#separator.getAttribute('role')], ['aria-orientation', this.#separator.getAttribute('aria-orientation')], ['aria-label', this.#separator.getAttribute('aria-label')], ['aria-controls', this.#separator.getAttribute('aria-controls')], ['aria-valuemin', this.#separator.getAttribute('aria-valuemin')], ['aria-valuemax', this.#separator.getAttribute('aria-valuemax')], ['aria-valuenow', this.#separator.getAttribute('aria-valuenow')], ['tabindex', this.#separator.getAttribute('tabindex')]]);
		}
		#restoreSeparator() {
			this.#originalSeparatorAttributes.forEach((value, name) => {
				if (value === null) {
					this.#separator.removeAttribute(name);
				} else {
					this.#separator.setAttribute(name, value);
				}
			});
			if (!this.#hadSeparatorClass) {
				main_core.Dom.removeClass(this.#separator, SEPARATOR_CLASS);
			}
		}
	}

	exports.LeftPanelResizer = LeftPanelResizer;

})(this.BX.UI.SidePanel = this.BX.UI.SidePanel || {}, BX);
//# sourceMappingURL=left-panel-resizer.bundle.js.map
