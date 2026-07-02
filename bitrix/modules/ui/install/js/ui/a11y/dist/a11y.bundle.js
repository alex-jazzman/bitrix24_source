/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, main_core) {
	'use strict';

	const focusableElements = ['a[href]', 'input:not([disabled]):not([type=hidden])', 'select:not([disabled])', 'textarea:not([disabled])', 'button:not([disabled])', 'area[href]', 'summary', 'iframe', 'object', 'embed', 'audio[controls]', 'video[controls]', '[contenteditable]:not([contenteditable="false"])', '[tabindex]:not([disabled]):not([hidden])'];
	const FOCUSABLE_SELECTOR = focusableElements.join(',');

	const supportsCheckVisibility = !main_core.Type.isUndefined(window.Element) && 'checkVisibility' in window.Element.prototype;
	class InteractivityChecker {
		static isDisabled(element) {
			return main_core.Type.isElementNode(element) && (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true');
		}
		static isVisible(element) {
			if (!main_core.Type.isElementNode(element) || !element.isConnected) {
				return false;
			}
			if (supportsCheckVisibility) {
				return element.checkVisibility({
					visibilityProperty: true,
					opacityProperty: true
				});
			}
			const hasGeometry = element.offsetWidth > 0 || element.offsetHeight > 0 || element.getClientRects().length > 0;
			return hasGeometry && getComputedStyle(element).visibility === 'visible';
		}
		static isTabbable(element) {
			if (!this.isFocusable(element)) {
				return false;
			}
			return !this.hasNegativeTabIndex(element);
		}
		static hasNegativeTabIndex(element) {
			const tabindex = element?.getAttribute('tabindex');
			if (tabindex === null) {
				return false;
			}
			return Number.parseInt(tabindex, 10) < 0;
		}
		static isFocusable(element) {
			if (!main_core.Type.isElementNode(element) || element.closest('[inert]') || !element.isConnected) {
				return false;
			}
			return element.matches(FOCUSABLE_SELECTOR) && this.isVisible(element);
		}
	}

	const STORAGE_KEY = 'bx:a11y:debug';
	const ALL = '*';
	const CATEGORY_LABELS = {
		'focus-monitor': 'FocusMonitor',
		'focus-trap': 'FocusTrap',
		'focus-zone': 'FocusZone',
		'input-modality': 'InputModality',
		'live-announcer': 'LiveAnnouncer'
	};
	class AccessibilityLogger {
		static #categories = new Set();
		static #all = false;
		static #initialized = false;
		static #init() {
			if (this.#initialized) {
				return;
			}
			this.#initialized = true;
			try {
				const raw = localStorage.getItem(STORAGE_KEY);
				if (raw === ALL) {
					this.#all = true;
				} else if (raw) {
					const parsed = JSON.parse(raw);
					if (Array.isArray(parsed)) {
						for (const category of parsed) {
							this.#categories.add(category);
						}
					}
				}
			} catch {
			}
		}
		static enable(category) {
			this.#init();
			if (category) {
				this.#categories.add(category);
			} else {
				this.#all = true;
			}
			this.#save();
		}
		static disable(category) {
			this.#init();
			if (category) {
				this.#categories.delete(category);
			} else {
				this.#all = false;
				this.#categories.clear();
			}
			this.#save();
		}
		static isEnabled(category) {
			this.#init();
			return this.#all || this.#categories.has(category);
		}
		static log(category, message, ...args) {
			if (!this.isEnabled(category)) {
				return;
			}
			const label = CATEGORY_LABELS[category] || category;
			console.log(`%c[${label}]%c ${message}`, 'color: #0075ff; font-weight: bold;', 'color: inherit; font-weight: normal;', ...args);
		}
		static logNode(category, message, node) {
			if (!this.isEnabled(category) || !main_core.Type.isElementNode(node)) {
				return;
			}
			const tag = node.tagName.toLowerCase();
			const classes = node.className ? `.${[...node.classList].join('.')}` : '';
			const id = node.id ? `#${node.id}` : '';
			const selector = `${tag}${classes}${id}`;
			const role = node.getAttribute('role');
			const labelledBy = node.getAttribute('aria-labelledby');
			const labelledByText = labelledBy ? labelledBy.split(/\s+/).map(labelId => document.getElementById(labelId)?.textContent?.trim()).filter(Boolean).join(' ') : '';
			const ariaLabel = (node.getAttribute('aria-label') || labelledByText || node.textContent.trim().slice(0, 30) || '—').replaceAll(/\s+/g, ' ');
			const attrs = [role && `role="${role}"`, node.getAttribute('aria-expanded') !== null && `aria-expanded="${node.getAttribute('aria-expanded')}"`, node.getAttribute('href') && `href="${node.getAttribute('href')}"`, node.getAttribute('tabindex') && `tabindex="${node.getAttribute('tabindex')}"`].filter(Boolean).join(' ');
			const label = CATEGORY_LABELS[category] || category;
			const parts = [`%c[${label}]%c ${message}`, `%c${selector}%c`, `"%c${ariaLabel}%c"`, attrs && `%c${attrs}%c`].filter(Boolean).join(' ');
			console.log(parts, 'color: #0075ff; font-weight: bold;',
			'color: inherit; font-weight: normal;',
			'color: #0075ff; font-weight: bold;',
			'color: inherit; font-weight: normal;',
			'color: #e36209; font-style: italic;',
			'color: inherit; font-style: normal;',
			...(attrs ? ['color: #9b59b6;',
			'color: inherit;'
			] : []));
		}
		static warn(category, message, ...args) {
			if (!this.isEnabled(category)) {
				return;
			}
			const label = CATEGORY_LABELS[category] || category;
			console.warn(`[${label}] ${message}`, ...args);
		}
		static #save() {
			try {
				if (this.#all) {
					localStorage.setItem(STORAGE_KEY, ALL);
				} else if (this.#categories.size > 0) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.#categories]));
				} else {
					localStorage.removeItem(STORAGE_KEY);
				}
			} catch {
			}
		}
	}

	const RESTORE_FOCUS_EVENT = 'a11y:restore-focus';
	class FocusNavigator {
		static get FOCUSABLE_SELECTOR() {
			return FOCUSABLE_SELECTOR;
		}
		static getFirst(container, options) {
			return this.#traverse(container, 'first', options);
		}
		static getLast(container, options) {
			return this.#traverse(container, 'last', options);
		}
		static getNext(container, options) {
			return this.#traverse(container, 'next', options);
		}
		static getPrevious(container, options) {
			return this.#traverse(container, 'previous', options);
		}
		static focusFirst(container, options) {
			return this.focusTarget(this.#traverse(container, 'first', options), options);
		}
		static focusLast(container, options) {
			return this.focusTarget(this.#traverse(container, 'last', options), options);
		}
		static focusNext(container, options) {
			return this.focusTarget(this.#traverse(container, 'next', options), options);
		}
		static focusPrevious(container, options) {
			return this.focusTarget(this.#traverse(container, 'previous', options), options);
		}
		static focusContainer(container, options) {
			if (!container.hasAttribute('tabindex')) {
				container.setAttribute('tabindex', '-1');
			}
			this.focusTarget(container, options);
			return container;
		}
		static getActiveElement(node) {
			const {
				activeElement
			} = this.#getDocument(node);
			if (activeElement?.tagName === 'IFRAME' && activeElement.contentDocument?.body) {
				const iframe = activeElement;
				return this.getActiveElement(iframe.contentDocument?.body);
			}
			if (main_core.Type.isElementNode(activeElement)) {
				return activeElement;
			}
			return null;
		}
		static createWalker(container, options) {
			const {
				tabbableOnly = false,
				accept
			} = options ?? {};
			const ownerDocument = container.ownerDocument ?? document;
			return ownerDocument.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
				acceptNode(node) {
					const el = node;
					if (!InteractivityChecker.isFocusable(el)) {
						return NodeFilter.FILTER_SKIP;
					}
					if (tabbableOnly && el.tabIndex < 0) {
						return NodeFilter.FILTER_SKIP;
					}
					if (accept && !accept(el) && el.tagName !== 'IFRAME') {
						return NodeFilter.FILTER_SKIP;
					}
					return NodeFilter.FILTER_ACCEPT;
				}
			});
		}
		static *#walk(container, options) {
			const walker = this.createWalker(container, options);
			for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
				const el = node;
				if (el.tagName === 'IFRAME') {
					try {
						const iframe = el;
						const body = iframe.contentDocument?.body;
						if (body) {
							yield* this.#walk(body, options);
							continue;
						}
					} catch {
					}
				}
				yield el;
			}
		}
		static #traverse(container, direction, options) {
			const walkerOptions = {
				tabbableOnly: options?.tabbableOnly ?? true,
				accept: options?.accept
			};
			switch (direction) {
				case 'first':
					{
						return this.#walk(container, walkerOptions).next().value ?? null;
					}
				case 'last':
					{
						let last = null;
						for (const el of this.#walk(container, walkerOptions)) {
							last = el;
						}
						return last;
					}
				case 'next':
					{
						const from = this.#resolveFrom(container, options);
						let found = from === null;
						for (const el of this.#walk(container, walkerOptions)) {
							if (found) {
								return el;
							}
							if (el === from) {
								found = true;
							}
						}
						if (options?.wrap) {
							return this.#walk(container, walkerOptions).next().value ?? null;
						}
						return null;
					}
				case 'previous':
					{
						const from = this.#resolveFrom(container, options);
						let prev = null;
						for (const el of this.#walk(container, walkerOptions)) {
							if (el === from) {
								break;
							}
							prev = el;
						}
						if (prev) {
							return prev;
						}
						if (options?.wrap) {
							return this.#traverse(container, 'last', options);
						}
						return null;
					}
			}
			return null;
		}
		static focusBySelector(container, selector, options) {
			const {
				accept: outerAccept,
				...rest
			} = options ?? {};
			const accept = el => {
				return el.matches(selector) && (outerAccept ? outerAccept(el) : true);
			};
			const from = this.#resolveFrom(container, options);
			let found = from === null;
			for (const el of this.#walk(container, {
				...rest,
				accept
			})) {
				if (found) {
					return this.focusTarget(el, options);
				}
				if (el === from) {
					found = true;
				}
			}
			if (options?.wrap) {
				const el = this.#walk(container, {
					...rest,
					accept
				}).next().value;
				if (el) {
					return this.focusTarget(el, options);
				}
			}
			return null;
		}
		static #resolveFrom(container, options) {
			const from = options?.from ?? this.getActiveElement(container);
			if (!from || container === from) {
				return null;
			}
			if (container.contains(from)) {
				return from;
			}
			let doc = from.ownerDocument;
			while (doc !== null) {
				const frame = doc.defaultView?.frameElement;
				if (!frame) {
					return null;
				}
				if (container.contains(frame)) {
					return from;
				}
				doc = frame.ownerDocument;
			}
			return null;
		}
		static focusTarget(target, options) {
			if (!target) {
				return null;
			}
			const {
				preventScroll,
				focusVisible
			} = options ?? {};
			target.focus({
				preventScroll,
				focusVisible
			});
			return target;
		}
		static restoreFocus(target, options) {
			if (!main_core.Type.isElementNode(target)) {
				return null;
			}
			try {
				const customEvent = new CustomEvent(RESTORE_FOCUS_EVENT, {
					bubbles: true,
					cancelable: true
				});
				const dispatchResult = target.dispatchEvent(customEvent);
				if (dispatchResult) {
					this.focusTarget(target, options);
					AccessibilityLogger.log('focus-monitor', 'restored focus to', target);
					return target;
				}
			} catch {
				AccessibilityLogger.warn('focus-monitor', 'failed to restore focus to', target);
			}
			return null;
		}
		static #getDocument(node) {
			if (!node) {
				return document;
			}
			if (node.window === node) {
				return node.document;
			}
			return node.ownerDocument ?? document;
		}
	}

	class FocusHistory {
		#limit;
		#stack = [];
		constructor(limit = 25) {
			this.#limit = limit;
		}
		record(el) {
			if (!InteractivityChecker.isFocusable(el)) {
				return;
			}
			if (this.#stack[this.#stack.length - 1]?.deref() === el) {
				return;
			}
			for (let i = this.#stack.length - 1; i >= 0; i--) {
				const current = this.#stack[i].deref();
				if (!current) {
					this.#stack.splice(i, 1);
					continue;
				}
				if (current === el) {
					this.#stack.splice(i, 1);
					break;
				}
			}
			AccessibilityLogger.logNode('focus-monitor', 'recorded', el);
			this.#stack.push(new WeakRef(el));
			this.#trimByWindow(el.ownerDocument);
		}
		getLastValid() {
			for (let i = this.#stack.length - 1; i >= 0; i--) {
				const el = this.#stack[i].deref();
				if (!el) {
					this.#stack.splice(i, 1);
					continue;
				}
				if (InteractivityChecker.isFocusable(el)) {
					this.#stack.length = i + 1;
					return el;
				}
				this.#stack.splice(i, 1);
			}
			return null;
		}
		#trimByWindow(doc) {
			const docIndexes = [];
			for (let i = this.#stack.length - 1; i >= 0; i--) {
				const current = this.#stack[i].deref();
				if (!current) {
					this.#stack.splice(i, 1);
					continue;
				}
				if (current.ownerDocument === doc) {
					docIndexes.push(i);
				}
			}
			const excess = docIndexes.length - this.#limit;
			if (excess <= 0) {
				return;
			}
			for (let j = docIndexes.length - excess; j < docIndexes.length; j++) {
				this.#stack.splice(docIndexes[j], 1);
			}
		}
	}

	const NAV_KEYS = new Set(['Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);
	const POINTER_TYPES = new Set(['mouse', 'pen', 'touch']);
	class InputModalityTracker {
		#modality = 'unknown';
		#pointerType = null;
		#lastNavKey = null;
		#lastNavShift = false;
		#attachedDocs = [];
		#detachHandlers = new WeakMap();
		attach(doc) {
			if (this.#detachHandlers.has(doc)) {
				return;
			}
			const onKeyDown = event => {
				if (NAV_KEYS.has(event.key)) {
					this.#lastNavKey = event.key;
					this.#lastNavShift = event.shiftKey;
					this.#setModality('keyboard');
				}
			};
			const onPointer = event => {
				this.#pointerType = POINTER_TYPES.has(event.pointerType) ? event.pointerType : 'mouse';
				this.#setModality('pointer');
			};
			main_core.Event.bind(doc, 'keydown', onKeyDown, true);
			main_core.Event.bind(doc, 'pointerdown', onPointer, true);
			const detach = () => {
				main_core.Event.unbind(doc, 'keydown', onKeyDown, true);
				main_core.Event.unbind(doc, 'pointerdown', onPointer, true);
			};
			this.#attachedDocs.push(new WeakRef(doc));
			this.#detachHandlers.set(doc, detach);
			doc.documentElement.dataset.inputModality = this.#modality;
		}
		detach(doc) {
			const detach = this.#detachHandlers.get(doc);
			if (detach) {
				detach();
				this.#detachHandlers.delete(doc);
				this.#cleanupWeakRefs();
			}
		}
		static enableDebug() {
			AccessibilityLogger.enable('input-modality');
		}
		static disableDebug() {
			AccessibilityLogger.disable('input-modality');
		}
		#setModality(modality) {
			if (this.#modality !== modality) {
				AccessibilityLogger.log('input-modality', `${this.#modality} -> ${modality}`);
				this.#modality = modality;
				this.#updateAllDocuments();
			}
		}
		#updateAllDocuments() {
			const aliveRefs = [];
			for (const weakRef of this.#attachedDocs) {
				const doc = weakRef.deref();
				if (doc) {
					doc.documentElement.dataset.inputModality = this.#modality;
					aliveRefs.push(weakRef);
				}
			}
			this.#attachedDocs = aliveRefs;
		}
		#cleanupWeakRefs() {
			this.#attachedDocs = this.#attachedDocs.filter(weakRef => {
				const doc = weakRef.deref();
				return doc && this.#detachHandlers.has(doc);
			});
		}
		getLastModality() {
			return this.#modality;
		}
		getLastPointerType() {
			return this.#modality === 'pointer' ? this.#pointerType : null;
		}
		getLastNavigationKey() {
			return this.#modality === 'keyboard' ? this.#lastNavKey : null;
		}
		isLastNavigationReversed() {
			return this.#modality === 'keyboard' && this.#lastNavKey === 'Tab' && this.#lastNavShift;
		}
	}

	class AccessibilitySettings {
		static useFocusTrapInDialogs() {
			const settings = main_core.Extension.getSettings('ui.a11y');
			return settings.get('useFocusTrapInDialogs') === true;
		}
		static restoreLostFocus() {
			const settings = main_core.Extension.getSettings('ui.a11y');
			return settings.get('restoreLostFocus') === true;
		}
		static suppressFocusOnRestore() {
			const settings = main_core.Extension.getSettings('ui.a11y');
			return settings.get('suppressFocusOnRestore') === true;
		}
	}

	class FocusMonitor {
		static #instance = null;
		#history;
		#modality;
		#documents = new WeakMap();
		constructor() {
			this.#history = new FocusHistory(25);
			this.#modality = new InputModalityTracker();
			this.#attachDocument(document);
		}
		static get Instance() {
			return this.initialize();
		}
		static initialize() {
			const topWindow = main_core.Page.getRootWindow();
			if (topWindow !== window) {
				const monitor = main_core.Reflection.getClass('top.BX.UI.Accessibility.FocusMonitor');
				if (monitor !== null) {
					return monitor.Instance;
				}
			}
			if (this.#instance === null) {
				this.#instance = new FocusMonitor();
			}
			return this.#instance;
		}
		static enableDebug() {
			AccessibilityLogger.enable('focus-monitor');
		}
		static disableDebug() {
			AccessibilityLogger.disable('focus-monitor');
		}
		static shouldRestoreLostFocus() {
			return AccessibilitySettings.restoreLostFocus();
		}
		#attachDocument(doc) {
			if (this.#documents.has(doc)) {
				return;
			}
			let pendingRestore = null;
			const onFocusIn = event => {
				if (pendingRestore !== null) {
					clearTimeout(pendingRestore);
					pendingRestore = null;
				}
				const target = event.target;
				if (main_core.Type.isElementNode(target)) {
					this.#history.record(target);
					if (target.tagName === 'IFRAME') {
						this.attachIframe(target);
					}
				}
			};
			const onFocusOut = () => {
				if (pendingRestore !== null) {
					return;
				}
				pendingRestore = window.setTimeout(() => {
					pendingRestore = null;
					this.#tryRestoreLostFocus(doc);
				}, 0);
			};
			doc.addEventListener('focusin', onFocusIn, true);
			doc.addEventListener('focusout', onFocusOut, true);
			const observer = this.#attachObserver(doc);
			this.#modality.attach(doc);
			this.#documents.set(doc, {
				detach: () => {
					if (pendingRestore !== null) {
						clearTimeout(pendingRestore);
					}
					doc.removeEventListener('focusin', onFocusIn, true);
					doc.removeEventListener('focusout', onFocusOut, true);
					this.#modality.detach(doc);
					observer?.disconnect();
				}
			});
		}
		attachIframe(iframe) {
			if (!main_core.Type.isElementNode(iframe) || iframe.tagName !== 'IFRAME') {
				return;
			}
			try {
				const doc = iframe.contentDocument;
				if (!doc) {
					return;
				}
				const state = this.#documents.get(doc);
				if (state) {
					return;
				}
				this.#attachDocument(doc);
			} catch {
			}
		}
		detachIframe(iframe) {
			try {
				const doc = iframe.contentDocument;
				if (!doc) {
					return;
				}
				const state = this.#documents.get(doc);
				if (state) {
					state.detach();
					this.#documents.delete(doc);
				}
			} catch {
			}
		}
		#tryRestoreLostFocus(doc) {
			if (!FocusMonitor.shouldRestoreLostFocus()) {
				return;
			}
			const active = doc.activeElement;
			if (active && active !== doc.body) {
				return;
			}
			if (this.#modality.getLastModality() !== 'keyboard') {
				return;
			}
			const target = this.#history.getLastValid();
			if (target) {
				this.#restoreElementFocus(target);
				return;
			}
			this.#restoreFocusToRoot(doc);
		}
		restoreFocus() {
			const target = this.#history.getLastValid();
			if (target) {
				this.#restoreElementFocus(target);
				return;
			}
			this.#restoreFocusToRoot(document);
		}
		#restoreFocusToRoot(doc) {
			AccessibilityLogger.log('focus-monitor', 'restoring focus to root');
			FocusNavigator.restoreFocus(this.getRoot(doc), {
				preventScroll: true
			});
		}
		getRoot(doc = document) {
			return doc.querySelector('[data-focus-root]') || doc.querySelector('main') || doc.body;
		}
		#restoreElementFocus(el) {
			if (!el.isConnected) {
				return;
			}
			const ownerWindow = el.ownerDocument.defaultView;
			if (!ownerWindow) {
				return;
			}
			const activeElement = FocusNavigator.getActiveElement(el);
			if (activeElement === el) {
				return;
			}
			if (ownerWindow === window) {
				FocusNavigator.restoreFocus(el, {
					preventScroll: true
				});
				return;
			}
			ownerWindow.requestAnimationFrame(() => {
				FocusNavigator.restoreFocus(el, {
					preventScroll: true
				});
			});
		}
		getLastInputModality() {
			return this.#modality.getLastModality();
		}
		getModalityTracker() {
			return this.#modality;
		}
		#attachObserver(doc) {
			if (!FocusMonitor.shouldRestoreLostFocus()) {
				return null;
			}
			if (main_core.Browser.isFirefox() || main_core.Browser.isSafari()) {
				const observer = new MutationObserver(mutations => {
					this.#tryRestoreLostFocus(doc);
				});
				const observe = () => observer.observe(doc.body, {
					childList: true,
					subtree: true,
					characterData: false
				});
				if (doc.readyState === 'loading') {
					doc.addEventListener('DOMContentLoaded', observe);
				} else {
					observe();
				}
				return observer;
			}
			return null;
		}
	}

	const PRECEDING = Node.DOCUMENT_POSITION_PRECEDING | Node.DOCUMENT_POSITION_CONTAINS;
	const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING | Node.DOCUMENT_POSITION_CONTAINED_BY;
	class FocusTrap {
		#id = `focus-trap-${main_core.Text.getRandom()}`;
		#container;
		#options;
		#active = false;
		#looped = true;
		#initialized = false;
		#restoreFocus = null;
		#preventScroll = true;
		#startFocusBoundary = null;
		#endFocusBoundary = null;
		#lastFocusedElement = null;
		#alreadyInert = new WeakSet();
		#startFocusHandler = this.#handleStartBoundaryFocus.bind(this);
		#endFocusHandler = this.#handleEndBoundaryFocus.bind(this);
		constructor(container, options = {}) {
			this.#container = container;
			this.#options = main_core.Type.isPlainObject(options) ? options : {};
			this.setRestoreFocus(this.#options.restoreFocus ?? null);
			if (this.#options.looped !== undefined) {
				this.setLooped(this.#options.looped);
			}
			if (this.#options.preventScroll !== undefined) {
				this.setPreventScroll(this.#options.preventScroll);
			}
		}
		static enableDebug() {
			AccessibilityLogger.enable('focus-trap');
		}
		static disableDebug() {
			AccessibilityLogger.disable('focus-trap');
		}
		activate(options = {}) {
			if (this.#active) {
				return;
			}
			if (!this.#initialized) {
				this.#init();
			}
			if (this.#lastFocusedElement === null) {
				this.captureActiveElement();
			}
			this.#active = true;
			if (this.#looped) {
				this.#setBoundariesFocusable(true);
			}
			const {
				initialFocus
			} = {
				initialFocus: true,
				...options
			};
			if (initialFocus) {
				this.applyInitialFocus();
			}
			this.#setOutsideIsolation(true);
		}
		deactivate() {
			if (!this.#active) {
				return;
			}
			this.#active = false;
			this.#setBoundariesFocusable(false);
			this.#setOutsideIsolation(false);
			this.restoreFocus();
		}
		destroy() {
			this.deactivate();
			if (!this.#initialized) {
				return;
			}
			main_core.Event.unbind(this.#startFocusBoundary, 'focus', this.#startFocusHandler);
			main_core.Event.unbind(this.#endFocusBoundary, 'focus', this.#endFocusHandler);
			main_core.Dom.remove(this.#startFocusBoundary);
			main_core.Dom.remove(this.#endFocusBoundary);
			this.#initialized = false;
		}
		setLooped(flag) {
			if (!main_core.Type.isBoolean(flag)) {
				return;
			}
			this.#looped = flag;
			if (this.#active) {
				this.#setBoundariesFocusable(flag);
			}
		}
		setPreventScroll(flag) {
			this.#preventScroll = main_core.Type.isBoolean(flag) ? flag : true;
		}
		isLooped() {
			return this.#looped;
		}
		isActive() {
			return this.#active;
		}
		setLastFocusedElement(el) {
			if (main_core.Type.isElementNode(el) && el.tagName !== 'BODY' && !this.contains(el)) {
				this.#lastFocusedElement = el;
				AccessibilityLogger.logNode('focus-trap', 'set last focus', el);
			}
		}
		captureActiveElement() {
			const activeElement = FocusNavigator.getActiveElement();
			if (activeElement !== null) {
				this.setLastFocusedElement(activeElement);
			}
			return activeElement;
		}
		contains(el) {
			return this.#container.contains(el);
		}
		focusFirst(options) {
			return FocusNavigator.focusFirst(this.#container, this.#prepareFocusOptions(options));
		}
		focusLast(options) {
			return FocusNavigator.focusLast(this.#container, this.#prepareFocusOptions(options));
		}
		focusNext(options) {
			return FocusNavigator.focusNext(this.#container, this.#prepareFocusOptions(options));
		}
		focusPrevious(options) {
			return FocusNavigator.focusPrevious(this.#container, this.#prepareFocusOptions(options));
		}
		focusContainer(options) {
			return FocusNavigator.focusContainer(this.#container, this.#prepareFocusOptions(options));
		}
		focusBySelector(selector, options) {
			return FocusNavigator.focusBySelector(this.#container, selector, this.#prepareFocusOptions(options));
		}
		#prepareFocusOptions(options) {
			const preparedOptions = main_core.Type.isPlainObject(options) ? {
				...options
			} : {};
			if (main_core.Type.isNil(preparedOptions.preventScroll)) {
				preparedOptions.preventScroll = this.#preventScroll;
			}
			return preparedOptions;
		}
		getId() {
			return this.#id;
		}
		#init() {
			this.#startFocusBoundary = this.#createFocusBoundary();
			this.#endFocusBoundary = this.#createFocusBoundary();
			main_core.Event.bind(this.#startFocusBoundary, 'focus', this.#startFocusHandler);
			main_core.Event.bind(this.#endFocusBoundary, 'focus', this.#endFocusHandler);
			this.#container.insertAdjacentElement('beforebegin', this.#startFocusBoundary);
			this.#container.insertAdjacentElement('afterend', this.#endFocusBoundary);
			this.#initialized = true;
		}
		#createFocusBoundary() {
			const el = document.createElement('div');
			el.setAttribute('aria-hidden', 'true');
			el.setAttribute('data-focus-trap', this.getId());
			main_core.Dom.style(el, {
				position: 'fixed',
				width: 0,
				height: 0,
				opacity: '0',
				pointerEvents: 'none',
				outline: 'none'
			});
			return el;
		}
		#handleStartBoundaryFocus(event) {
			if (!this.#active || !this.#startFocusBoundary) {
				return;
			}
			const position = event.relatedTarget ? this.#startFocusBoundary.compareDocumentPosition(event.relatedTarget) : 0;
			const isBackward = position & FOLLOWING;
			if (!isBackward) {
				if (!this.focusFirst()) {
					this.focusContainer();
				}
				return;
			}
			const target = this.#options.startBoundary ? this.#resolveBoundary(this.#options.startBoundary) : null;
			if (target) {
				FocusNavigator.focusTarget(target, {
					preventScroll: this.#preventScroll
				});
				return;
			}
			if (!this.focusLast()) {
				this.focusContainer();
			}
		}
		#handleEndBoundaryFocus(event) {
			if (!this.#active || !this.#endFocusBoundary) {
				return;
			}
			const position = event.relatedTarget ? this.#endFocusBoundary.compareDocumentPosition(event.relatedTarget) : 0;
			const isBackward = position & PRECEDING;
			if (!isBackward) {
				if (!this.focusLast()) {
					this.focusContainer();
				}
				return;
			}
			const target = this.#options.endBoundary ? this.#resolveBoundary(this.#options.endBoundary) : null;
			if (target) {
				FocusNavigator.focusTarget(target, {
					preventScroll: this.#preventScroll
				});
				return;
			}
			if (!this.focusFirst()) {
				this.focusContainer();
			}
		}
		#resolveBoundary(boundary) {
			if (main_core.Type.isStringFilled(boundary)) {
				const el = document.querySelector(boundary);
				return el !== null && main_core.Type.isElementNode(el) && InteractivityChecker.isFocusable(el) ? el : null;
			}
			if (main_core.Type.isElementNode(boundary) && InteractivityChecker.isFocusable(boundary)) {
				return boundary;
			}
			if (main_core.Type.isFunction(boundary)) {
				const el = boundary();
				return main_core.Type.isElementNode(el) && InteractivityChecker.isFocusable(el) ? el : null;
			}
			return null;
		}
		#setBoundariesFocusable(enabled) {
			const tabindex = enabled ? '0' : '-1';
			this.#startFocusBoundary?.setAttribute('tabindex', tabindex);
			this.#endFocusBoundary?.setAttribute('tabindex', tabindex);
		}
		applyInitialFocus() {
			const initialFocus = this.#options.initialFocus ?? true;
			if (initialFocus === false) {
				return;
			}
			if (!this.#options.forceInitialFocus) {
				const activeElement = FocusNavigator.getActiveElement(this.#container);
				if (activeElement && this.#container.contains(activeElement) && activeElement !== this.#container) {
					return;
				}
			}
			const candidates = Array.isArray(initialFocus) ? initialFocus : [initialFocus];
			for (const candidate of candidates) {
				if (this.#tryInitialFocus(candidate)) {
					return;
				}
			}
			this.focusContainer();
		}
		#tryInitialFocus(initialFocus) {
			if (initialFocus === false) {
				return false;
			}
			if (initialFocus === 'container') {
				this.focusContainer();
				return true;
			}
			if (main_core.Type.isStringFilled(initialFocus)) {
				return this.focusBySelector(initialFocus) !== null;
			}
			if (main_core.Type.isFunction(initialFocus)) {
				const el = initialFocus();
				if (InteractivityChecker.isFocusable(el)) {
					FocusNavigator.focusTarget(el, {
						preventScroll: this.#preventScroll
					});
					return true;
				}
				return false;
			}
			if (initialFocus === true || initialFocus === 'first-tabbable' || main_core.Type.isNil(initialFocus)) {
				return Boolean(this.focusFirst());
			}
			return false;
		}
		setRestoreFocus(restore) {
			if (main_core.Type.isBoolean(restore) || main_core.Type.isNull(restore) || main_core.Type.isStringFilled(restore) || main_core.Type.isFunction(restore) || main_core.Type.isElementNode(restore)) {
				this.#restoreFocus = restore;
			}
		}
		restoreFocus() {
			try {
				const restoreFocus = this.#restoreFocus ?? true;
				if (restoreFocus === false) {
					return;
				}
				if (main_core.Type.isStringFilled(restoreFocus)) {
					const doc = this.#container.ownerDocument ?? document;
					let el = null;
					try {
						el = doc.querySelector(restoreFocus);
					} catch {
						console.error('FocusTrap: invalid restoreFocus selector provided');
					}
					if (el !== null && InteractivityChecker.isFocusable(el)) {
						FocusNavigator.restoreFocus(el, {
							preventScroll: true
						});
						return;
					}
				}
				if (main_core.Type.isElementNode(restoreFocus) && InteractivityChecker.isFocusable(restoreFocus)) {
					FocusNavigator.restoreFocus(restoreFocus, {
						preventScroll: true
					});
					return;
				}
				if (main_core.Type.isFunction(restoreFocus)) {
					const el = restoreFocus();
					if (InteractivityChecker.isFocusable(el)) {
						FocusNavigator.restoreFocus(el, {
							preventScroll: true
						});
						return;
					}
				}
				if (this.#lastFocusedElement !== null && InteractivityChecker.isFocusable(this.#lastFocusedElement)) {
					let eventListeners = [];
					const suppressFocusOnRestore = main_core.Type.isBoolean(this.#options.suppressFocusOnRestore) ? this.#options.suppressFocusOnRestore : AccessibilitySettings.suppressFocusOnRestore();
					try {
						if (suppressFocusOnRestore) {
							eventListeners = main_core.Event.getEventListeners(this.#lastFocusedElement, 'focus');
							if (eventListeners.length > 0) {
								main_core.Event.unbindAll(this.#lastFocusedElement, 'focus');
							}
						}
						AccessibilityLogger.logNode('focus-trap', 'back to last focus', this.#lastFocusedElement);
						FocusNavigator.restoreFocus(this.#lastFocusedElement, {
							preventScroll: true
						});
					} finally {
						if (suppressFocusOnRestore) {
							for (const eventListener of eventListeners) {
								main_core.Event.bind(this.#lastFocusedElement, 'focus', eventListener.listener);
							}
						}
					}
					return;
				}
				FocusMonitor.Instance.restoreFocus();
			} finally {
				this.#lastFocusedElement = null;
			}
		}
		#setOutsideIsolation(enable) {
			if (this.#options.isolateOutside !== true) {
				return;
			}
			const containers = [this.#container, ...this.#getOutsideExceptionElements()];
			const topLevelContainers = containers.filter(el => {
				return !containers.some(other => other !== el && other.contains(el));
			});
			const adjacentElements = this.#getAdjacentElements(topLevelContainers);
			if (enable) {
				this.#alreadyInert = new WeakSet();
				for (const el of adjacentElements) {
					if (el === this.#container || this.#container.contains(el) || el.getAttribute('data-focus-trap') === this.getId()) {
						continue;
					}
					if (el.parentNode?.nodeName === 'BODY' && el.offsetWidth === 0 && el.offsetHeight === 0) {
						continue;
					}
					if (el.inert || el.hasAttribute('inert')) {
						this.#alreadyInert.add(el);
					}
					el.setAttribute('inert', 'true');
				}
			} else {
				for (const el of adjacentElements) {
					if (this.#alreadyInert.has(el)) {
						continue;
					}
					el.removeAttribute('inert');
				}
				this.#alreadyInert = new WeakSet();
			}
		}
		#getAdjacentElements(containers) {
			const adjacentElements = new Set();
			const containerAncestors = new Set();
			for (const container of containers) {
				let currentElement = container;
				while (currentElement && currentElement.tagName !== 'BODY') {
					containerAncestors.add(currentElement);
					const parent = currentElement.parentElement;
					const siblings = parent ? parent.children : [];
					for (const sibling of siblings) {
						if (sibling.tagName !== 'SCRIPT' && sibling.tagName !== 'STYLE' && !sibling.getAttribute('data-a11y-ignore-inert') && main_core.Type.isElementNode(sibling)) {
							adjacentElements.add(sibling);
						}
					}
					currentElement = parent;
				}
			}
			containerAncestors.forEach(el => {
				adjacentElements.delete(el);
			});
			return adjacentElements;
		}
		#getOutsideExceptionElements() {
			if (!main_core.Type.isArrayFilled(this.#options.outsideExceptionSelectors)) {
				return [];
			}
			try {
				const selectors = this.#options.outsideExceptionSelectors.join(',');
				return [...document.querySelectorAll(selectors)];
			} catch {
				console.error('FocusTrap: invalid outsideExceptionSelectors provided');
				return [];
			}
		}
	}

	const FocusTrapDirective = {
		mounted(el, binding) {
			const {
				active,
				options
			} = normalizeValue(binding.value);
			el.__focusTrap = new FocusTrap(el, options);
			if (active) {
				el.__focusTrap.activate();
			}
		},
		updated(el, binding) {
			const {
				active,
				options
			} = normalizeValue(binding.value);
			const {
				active: prevActive,
				options: prevOptions
			} = normalizeValue(binding.oldValue);
			if (options !== prevOptions && options) {
				el.__focusTrap?.destroy();
				el.__focusTrap = new FocusTrap(el, options);
			}
			const trap = el.__focusTrap;
			if (!trap) {
				return;
			}
			if (active) {
				trap.activate();
			} else {
				trap.deactivate();
			}
		},
		unmounted(el) {
			el.__focusTrap?.destroy();
			delete el.__focusTrap;
		}
	};
	function normalizeValue(value) {
		if (main_core.Type.isBoolean(value)) {
			return {
				active: value
			};
		}
		if (main_core.Type.isPlainObject(value)) {
			return {
				active: value.active !== false,
				options: value.options
			};
		}
		return {
			active: false
		};
	}

	class LiveAnnouncer {
		static #instance = null;
		#el;
		#queue = [];
		#isSpeaking = false;
		#frameId = null;
		#timerId = null;
		#ready = false;
		#readyFrameId = null;
		#baseDelay = 500;
		#charDelay = 30;
		#maxDelay = 4000;
		#maxMessageLength = 160;
		static enableDebug() {
			AccessibilityLogger.enable('live-announcer');
		}
		static disableDebug() {
			AccessibilityLogger.disable('live-announcer');
		}
		static announce(message, politeness = 'polite') {
			if (!LiveAnnouncer.#instance) {
				LiveAnnouncer.#instance = new LiveAnnouncer();
			}
			LiveAnnouncer.#instance.announce(message, politeness);
		}
		static destroy() {
			LiveAnnouncer.#instance?.destroy();
			LiveAnnouncer.#instance = null;
		}
		constructor(options) {
			const {
				politeness = 'polite',
				container = document.body || document.documentElement,
				baseDelay,
				charDelay,
				maxDelay,
				maxMessageLength
			} = options ?? {};
			if (main_core.Type.isNumber(baseDelay)) {
				this.#baseDelay = baseDelay;
			}
			if (main_core.Type.isNumber(charDelay)) {
				this.#charDelay = charDelay;
			}
			if (main_core.Type.isNumber(maxDelay)) {
				this.#maxDelay = maxDelay;
			}
			if (main_core.Type.isNumber(maxMessageLength)) {
				this.#maxMessageLength = maxMessageLength;
			}
			this.#el = this.#createLiveRegion(politeness);
			main_core.Dom.append(this.#el, container);
			this.#readyFrameId = requestAnimationFrame(() => {
				this.#readyFrameId = null;
				this.#ready = true;
				this.#process();
			});
		}
		announce(message, politeness = 'polite') {
			const normalized = this.#normalizeMessage(message);
			if (!normalized) {
				return;
			}
			AccessibilityLogger.log('live-announcer', `[${politeness}] ${normalized}`);
			const last = this.#queue[this.#queue.length - 1];
			if (last && last.message === normalized && last.politeness === politeness) {
				return;
			}
			if (politeness === 'assertive') {
				this.#clearPendingAnnouncement();
				this.#queue.unshift({
					message: normalized,
					politeness
				});
			} else {
				this.#queue.push({
					message: normalized,
					politeness
				});
			}
			this.#process();
		}
		destroy() {
			if (this.#readyFrameId !== null) {
				cancelAnimationFrame(this.#readyFrameId);
				this.#readyFrameId = null;
			}
			this.#queue.length = 0;
			this.#clearPendingAnnouncement();
			this.#el.remove();
		}
		#process() {
			if (!this.#ready || this.#isSpeaking || this.#queue.length === 0) {
				return;
			}
			const item = this.#queue.shift();
			if (!item) {
				return;
			}
			this.#isSpeaking = true;
			const {
				message,
				politeness
			} = item;
			const delay = this.#getDelay(message);
			this.#el.setAttribute('aria-live', politeness);
			this.#el.textContent = '';
			this.#frameId = requestAnimationFrame(() => {
				this.#frameId = null;
				this.#el.textContent = message;
				this.#timerId = setTimeout(() => {
					this.#timerId = null;
					this.#isSpeaking = false;
					if (this.#queue.length === 0) {
						this.#el.textContent = '';
					}
					this.#process();
				}, delay);
			});
		}
		#clearPendingAnnouncement() {
			this.#isSpeaking = false;
			if (this.#frameId !== null) {
				cancelAnimationFrame(this.#frameId);
				this.#frameId = null;
			}
			if (this.#timerId !== null) {
				clearTimeout(this.#timerId);
				this.#timerId = null;
			}
			this.#el.textContent = '';
		}
		#getDelay(message) {
			const delay = this.#baseDelay + message.length * this.#charDelay;
			return Math.min(delay, this.#maxDelay);
		}
		#normalizeMessage(message) {
			if (!main_core.Type.isStringFilled(message)) {
				return '';
			}
			const text = message.trim();
			if (!text) {
				return '';
			}
			if (text.length <= this.#maxMessageLength) {
				return text;
			}
			const truncated = text.slice(0, this.#maxMessageLength - 1);
			const trimmedToWord = truncated.replace(/\s+\S*$/, '');
			return `${trimmedToWord || truncated}\u2026`;
		}
		#createLiveRegion(politeness) {
			const el = document.createElement('div');
			el.setAttribute('aria-live', politeness);
			el.setAttribute('aria-atomic', 'true');
			el.setAttribute('data-a11y-ignore-inert', 'true');
			main_core.Dom.style(el, {
				position: 'absolute',
				width: '1px',
				height: '1px',
				margin: '-1px',
				padding: '0',
				overflow: 'hidden',
				clip: 'rect(0 0 0 0)',
				whiteSpace: 'nowrap',
				border: '0'
			});
			return el;
		}
	}

	const ARROW_HORIZONTAL = 0b0000000001;
	const ARROW_VERTICAL = 0b0000000010;
	const JK_BITS = 0b0000000100;
	const HL_BITS = 0b0000001000;
	const HOME_AND_END = 0b0000010000;
	const WS_BITS = 0b0000100000;
	const AD_BITS = 0b0001000000;
	const TAB_BIT = 0b0010000000;
	const PAGE_UP_DOWN = 0b0100000000;
	const BACKSPACE_BIT = 0b1000000000;
	const FocusKeys = {
		ArrowHorizontal: ARROW_HORIZONTAL,
		ArrowVertical: ARROW_VERTICAL,
		JK: JK_BITS,
		HL: HL_BITS,
		HomeAndEnd: HOME_AND_END,
		WS: WS_BITS,
		AD: AD_BITS,
		Tab: TAB_BIT,
		PageUpDown: PAGE_UP_DOWN,
		Backspace: BACKSPACE_BIT,
		ArrowAll: ARROW_HORIZONTAL | ARROW_VERTICAL,
		HJKL: HL_BITS | JK_BITS,
		WASD: WS_BITS | AD_BITS,
		All: ARROW_HORIZONTAL | ARROW_VERTICAL | JK_BITS | HL_BITS | HOME_AND_END | WS_BITS | AD_BITS | TAB_BIT | PAGE_UP_DOWN | BACKSPACE_BIT
	};

	const ActiveDescendant = {
		ELEMENT_ATTR: 'data-active-descendant',
		CONTAINER_ATTR: 'data-has-active-descendant',
		EXPLICIT: 'activated-by-keyboard',
		IMPLICIT: 'activated-by-other'
	};
	const KEY_TO_BIT = {
		ArrowLeft: FocusKeys.ArrowHorizontal,
		ArrowDown: FocusKeys.ArrowVertical,
		ArrowUp: FocusKeys.ArrowVertical,
		ArrowRight: FocusKeys.ArrowHorizontal,
		h: FocusKeys.HL,
		j: FocusKeys.JK,
		k: FocusKeys.JK,
		l: FocusKeys.HL,
		a: FocusKeys.AD,
		s: FocusKeys.WS,
		w: FocusKeys.WS,
		d: FocusKeys.AD,
		Tab: FocusKeys.Tab,
		Home: FocusKeys.HomeAndEnd,
		End: FocusKeys.HomeAndEnd,
		PageUp: FocusKeys.PageUpDown,
		PageDown: FocusKeys.PageUpDown,
		Backspace: FocusKeys.Backspace
	};
	const KEY_TO_DIRECTION = {
		ArrowLeft: 'previous',
		ArrowDown: 'next',
		ArrowUp: 'previous',
		ArrowRight: 'next',
		h: 'previous',
		j: 'next',
		k: 'previous',
		l: 'next',
		a: 'previous',
		s: 'next',
		w: 'previous',
		d: 'next',
		Tab: 'next',
		Home: 'start',
		End: 'end',
		PageUp: 'start',
		PageDown: 'end',
		Backspace: 'previous'
	};
	const NON_EDITABLE_INPUT_TYPES = new Set(['button', 'checkbox', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit']);
	class FocusZone {
		#container;
		#options;
		#active = false;
		#bindKeys;
		#focusOutBehavior;
		#focusInStrategy;
		#preventScroll;
		#ignoreHoverEvents;
		#tabbableOnly;
		#elementSet = new Set();
		#savedTabIndex = new WeakMap();
		#currentFocusedElement = null;
		#activeDescendantControl = null;
		#observer = null;
		#syncFrameId = null;
		#bindings = [];
		#generatedContainerId = false;
		#generatedElementIds = new WeakSet();
		#keyDownHandler = this.#handleKeyDown.bind(this);
		#focusInHandler = this.#handleFocusIn.bind(this);
		#mouseMoveHandler = this.#handleMouseMove.bind(this);
		#controlFocusInHandler = this.#handleControlFocusIn.bind(this);
		#controlFocusOutHandler = this.#handleControlFocusOut.bind(this);
		constructor(container, options = {}) {
			this.#container = container;
			this.#options = main_core.Type.isPlainObject(options) ? options : {};
			this.#activeDescendantControl = this.#options.activeDescendantControl ?? null;
			this.#focusOutBehavior = this.#options.focusOutBehavior ?? 'stop';
			this.#focusInStrategy = this.#options.focusInStrategy ?? 'previous';
			this.#preventScroll = this.#options.preventScroll ?? false;
			this.#ignoreHoverEvents = this.#options.ignoreHoverEvents ?? false;
			this.#tabbableOnly = this.#options.tabbableOnly ?? false;
			this.#bindKeys = this.#options.bindKeys ?? (this.#options.getNextFocusable ? FocusKeys.ArrowAll : FocusKeys.ArrowVertical) | FocusKeys.HomeAndEnd;
		}
		static enableDebug() {
			AccessibilityLogger.enable('focus-zone');
		}
		static disableDebug() {
			AccessibilityLogger.disable('focus-zone');
		}
		activate() {
			if (this.#active) {
				return;
			}
			this.#active = true;
			this.#elementSet = this.#collectFocusableSet();
			for (const element of this.#elementSet) {
				this.#saveAndSetTabIndex(element);
			}
			if (this.#activeDescendantControl) {
				if (!this.#container.id) {
					this.#container.setAttribute('id', `fz-${main_core.Text.getRandom()}`);
					this.#generatedContainerId = true;
				}
				this.#activeDescendantControl.setAttribute('aria-controls', this.#container.id);
			}
			const preventInitialFocus = this.#focusInStrategy === 'initial' && this.#activeDescendantControl;
			if (!preventInitialFocus) {
				this.#updateFocusedElement(this.#resolveInitialFocusedElement());
			}
			this.#attachEventListeners();
			this.#attachObserver();
			AccessibilityLogger.log('focus-zone', `activated with ${this.#elementSet.size} elements`);
		}
		deactivate() {
			if (!this.#active) {
				return;
			}
			this.#active = false;
			if (this.#observer) {
				this.#observer.disconnect();
				this.#observer = null;
			}
			if (this.#syncFrameId !== null) {
				cancelAnimationFrame(this.#syncFrameId);
				this.#syncFrameId = null;
			}
			this.#detachEventListeners();
			for (const element of this.#elementSet) {
				this.#restoreTabIndex(element);
				if (this.#generatedElementIds.has(element)) {
					element.removeAttribute('id');
					this.#generatedElementIds.delete(element);
				}
			}
			if (this.#activeDescendantControl) {
				this.#clearActiveDescendant();
				this.#activeDescendantControl.removeAttribute('aria-controls');
			}
			if (this.#generatedContainerId) {
				this.#container.removeAttribute('id');
				this.#generatedContainerId = false;
			}
			this.#elementSet.clear();
			this.#currentFocusedElement = null;
			AccessibilityLogger.log('focus-zone', 'deactivated');
		}
		isActive() {
			return this.#active;
		}
		getCurrentFocusedElement() {
			return this.#currentFocusedElement;
		}
		refreshElements() {
			if (this.#active) {
				this.#syncFocusableElements();
			}
		}
		#collectFocusableSet() {
			const elements = new Set();
			const walker = FocusNavigator.createWalker(this.#container, {
				tabbableOnly: this.#tabbableOnly,
				accept: this.#options.focusableElementFilter
			});
			for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
				elements.add(node);
			}
			return elements;
		}
		#getNavigatorOptions(from = null, wrap = false) {
			return {
				from: from ?? undefined,
				tabbableOnly: false,
				accept: el => this.#elementSet.has(el),
				wrap
			};
		}
		#findManagedAncestor(node) {
			let el = main_core.Type.isElementNode(node) ? node : node.parentElement;
			while (el && el !== this.#container) {
				if (this.#elementSet.has(el)) {
					return el;
				}
				el = el.parentElement;
			}
			return null;
		}
		#saveAndSetTabIndex(element) {
			if (!this.#savedTabIndex.has(element)) {
				this.#savedTabIndex.set(element, element.getAttribute('tabindex'));
			}
			element.setAttribute('tabindex', '-1');
		}
		#restoreTabIndex(element) {
			const savedIndex = this.#savedTabIndex.get(element);
			if (savedIndex !== undefined) {
				if (savedIndex === null) {
					element.removeAttribute('tabindex');
				} else {
					element.setAttribute('tabindex', savedIndex);
				}
				this.#savedTabIndex.delete(element);
			}
		}
		#updateFocusedElement(to = null, directlyActivated = false) {
			const from = this.#currentFocusedElement;
			this.#currentFocusedElement = to;
			if (this.#activeDescendantControl) {
				if (to && FocusNavigator.getActiveElement() === this.#activeDescendantControl) {
					this.#setActiveDescendant(from, to, directlyActivated);
				} else {
					this.#clearActiveDescendant();
				}
				return;
			}
			if (from && from !== to && this.#savedTabIndex.has(from)) {
				from.setAttribute('tabindex', '-1');
			}
			if (to) {
				to.setAttribute('tabindex', '0');
			}
		}
		#setActiveDescendant(from, to, directlyActivated = false) {
			if (!to.id) {
				to.setAttribute('id', `fz-${main_core.Text.getRandom()}`);
				this.#generatedElementIds.add(to);
			}
			if (from && from !== to) {
				from.removeAttribute(ActiveDescendant.ELEMENT_ATTR);
			}
			if (!this.#activeDescendantControl) {
				return;
			}
			const previousId = this.#activeDescendantControl.getAttribute('aria-activedescendant');
			const nextActivationMode = directlyActivated ? ActiveDescendant.EXPLICIT : ActiveDescendant.IMPLICIT;
			const currentActivationMode = to.getAttribute(ActiveDescendant.ELEMENT_ATTR);
			if (previousId === to.id && currentActivationMode === nextActivationMode) {
				return;
			}
			this.#activeDescendantControl.setAttribute('aria-activedescendant', to.id);
			this.#container.setAttribute(ActiveDescendant.CONTAINER_ATTR, to.id);
			to.setAttribute(ActiveDescendant.ELEMENT_ATTR, nextActivationMode);
			AccessibilityLogger.logNode('focus-zone', 'active descendant ->', to);
			this.#options.onActiveDescendantChanged?.(to, from, directlyActivated);
		}
		#clearActiveDescendant(previousElement = this.#currentFocusedElement) {
			if (this.#focusInStrategy === 'first') {
				this.#currentFocusedElement = null;
			}
			this.#activeDescendantControl?.removeAttribute('aria-activedescendant');
			this.#container.removeAttribute(ActiveDescendant.CONTAINER_ATTR);
			if (previousElement) {
				previousElement.removeAttribute(ActiveDescendant.ELEMENT_ATTR);
			}
			const stale = this.#container.querySelectorAll(`[${ActiveDescendant.ELEMENT_ATTR}]`);
			for (const element of stale) {
				element.removeAttribute(ActiveDescendant.ELEMENT_ATTR);
			}
			this.#options.onActiveDescendantChanged?.(null, previousElement, false);
		}
		#handleKeyDown(event) {
			const keyBit = KEY_TO_BIT[event.key];
			if (keyBit === undefined || this.#elementSet.size === 0) {
				return;
			}
			if (event.defaultPrevented || (keyBit & this.#bindKeys) === 0 || FocusZone.#isNativeInputKey(event, FocusNavigator.getActiveElement())) {
				return;
			}
			const direction = FocusZone.#getDirection(event);
			let nextElement = null;
			if (this.#options.getNextFocusable) {
				nextElement = this.#options.getNextFocusable(direction, FocusNavigator.getActiveElement() ?? null, event);
			}
			if (!nextElement) {
				const wrap = this.#focusOutBehavior === 'wrap' && event.key !== 'Tab';
				const navOptions = this.#getNavigatorOptions(this.#currentFocusedElement, wrap);
				switch (direction) {
					case 'previous':
						{
							nextElement = FocusNavigator.getPrevious(this.#container, navOptions);
							break;
						}
					case 'next':
						{
							nextElement = FocusNavigator.getNext(this.#container, navOptions);
							break;
						}
					case 'start':
						{
							nextElement = FocusNavigator.getFirst(this.#container, navOptions);
							break;
						}
					default:
						{
							nextElement = FocusNavigator.getLast(this.#container, navOptions);
						}
				}
			}
			if (this.#activeDescendantControl) {
				this.#updateFocusedElement(nextElement || this.#currentFocusedElement, true);
			} else if (nextElement) {
				nextElement.focus({
					preventScroll: this.#preventScroll
				});
			}
			if (event.key !== 'Tab' || nextElement) {
				event.preventDefault();
			}
		}
		#handleFocusIn(event) {
			if (!main_core.Type.isElementNode(event.target)) {
				return;
			}
			if (this.#activeDescendantControl) {
				this.#handleFocusInActiveDescendant(event);
			} else {
				this.#handleFocusInRovingTabindex(event);
			}
		}
		#handleFocusInActiveDescendant(event) {
			const target = event.target;
			if (this.#elementSet.has(target)) {
				this.#activeDescendantControl?.focus({
					preventScroll: this.#preventScroll
				});
				this.#updateFocusedElement(target);
			}
		}
		#handleFocusInRovingTabindex(event) {
			const target = event.target;
			const tracker = FocusMonitor.Instance.getModalityTracker();
			const isPointerFocus = tracker.getLastModality() === 'pointer';
			if (isPointerFocus) {
				if (this.#elementSet.has(target)) {
					this.#updateFocusedElement(target);
				}
				return;
			}
			if (!this.#elementSet.has(target)) {
				return;
			}
			if (this.#focusInStrategy === 'previous') {
				this.#updateFocusedElement(target);
			} else if (this.#focusInStrategy === 'closest' || this.#focusInStrategy === 'first') {
				if (this.#isFocusEnteringFromOutside(event.relatedTarget)) {
					const targetElement = this.#getEntryFocusedElement();
					if (targetElement) {
						targetElement.focus({
							preventScroll: this.#preventScroll
						});
					}
					return;
				}
				this.#updateFocusedElement(target);
			} else if (main_core.Type.isFunction(this.#focusInStrategy)) {
				if (this.#isFocusEnteringFromOutside(event.relatedTarget)) {
					const elementToFocus = this.#focusInStrategy(event.relatedTarget);
					if (elementToFocus && this.#elementSet.has(elementToFocus)) {
						elementToFocus.focus({
							preventScroll: this.#preventScroll
						});
						return;
					}
					AccessibilityLogger.warn('focus-zone', 'focusInStrategy returned an element outside the managed focus set.');
				}
				this.#updateFocusedElement(target);
			}
		}
		#resolveInitialFocusedElement() {
			if (main_core.Type.isFunction(this.#focusInStrategy)) {
				const element = this.#focusInStrategy(this.#currentFocusedElement);
				return element && this.#elementSet.has(element) ? element : null;
			}
			return FocusNavigator.getFirst(this.#container, this.#getNavigatorOptions());
		}
		#getEntryFocusedElement() {
			const navOptions = this.#getNavigatorOptions();
			return FocusMonitor.Instance.getModalityTracker().isLastNavigationReversed() ? FocusNavigator.getLast(this.#container, navOptions) : FocusNavigator.getFirst(this.#container, navOptions);
		}
		#isFocusEnteringFromOutside(relatedTarget) {
			return main_core.Type.isElementNode(relatedTarget) && !this.#container.contains(relatedTarget);
		}
		#handleMouseMove(event) {
			const {
				target
			} = event;
			if (!main_core.Type.isElementNode(target)) {
				return;
			}
			const managedElement = this.#findManagedAncestor(target);
			if (managedElement) {
				this.#updateFocusedElement(managedElement);
			}
		}
		#handleControlFocusIn() {
			const preventInitialFocus = this.#focusInStrategy === 'initial' && this.#activeDescendantControl;
			if (this.#currentFocusedElement) {
				this.#setActiveDescendant(null, this.#currentFocusedElement);
			} else if (!preventInitialFocus) {
				this.#updateFocusedElement(FocusNavigator.getFirst(this.#container, this.#getNavigatorOptions()));
			}
		}
		#handleControlFocusOut() {
			this.#clearActiveDescendant();
		}
		#listen(target, event, handler, capture = false) {
			main_core.Event.bind(target, event, handler, capture);
			this.#bindings.push([target, event, handler, capture]);
		}
		#attachEventListeners() {
			const keyboardTarget = this.#activeDescendantControl ?? this.#container;
			this.#listen(keyboardTarget, 'keydown', this.#keyDownHandler);
			this.#listen(this.#container, 'focusin', this.#focusInHandler);
			if (this.#activeDescendantControl) {
				if (!this.#ignoreHoverEvents) {
					this.#listen(this.#container, 'mousemove', this.#mouseMoveHandler, true);
				}
				this.#listen(this.#activeDescendantControl, 'focusin', this.#controlFocusInHandler);
				this.#listen(this.#activeDescendantControl, 'focusout', this.#controlFocusOutHandler);
			}
		}
		#detachEventListeners() {
			for (const [target, event, handler, capture] of this.#bindings) {
				main_core.Event.unbind(target, event, handler, capture);
			}
			this.#bindings = [];
		}
		#attachObserver() {
			this.#observer = new MutationObserver(() => {
				this.#scheduleSyncFocusableElements();
			});
			this.#observer.observe(this.#container, {
				attributes: true,
				subtree: true,
				childList: true,
				attributeFilter: ['hidden', 'disabled', 'tabindex', 'inert', 'contenteditable', 'aria-disabled']
			});
		}
		#scheduleSyncFocusableElements() {
			if (!this.#active || this.#syncFrameId !== null) {
				return;
			}
			this.#syncFrameId = requestAnimationFrame(() => {
				this.#syncFrameId = null;
				this.#syncFocusableElements();
			});
		}
		#syncFocusableElements() {
			if (!this.#active) {
				return;
			}
			const newSet = this.#collectFocusableSet();
			const oldSet = this.#elementSet;
			for (const element of oldSet) {
				if (!newSet.has(element)) {
					this.#restoreTabIndex(element);
				}
			}
			for (const element of newSet) {
				if (!oldSet.has(element)) {
					this.#saveAndSetTabIndex(element);
				}
			}
			this.#elementSet = newSet;
			if (this.#currentFocusedElement && !newSet.has(this.#currentFocusedElement)) {
				this.#updateFocusedElement(FocusNavigator.getFirst(this.#container, this.#getNavigatorOptions()));
			} else if (!this.#currentFocusedElement && newSet.size > 0) {
				const preventInitialFocus = this.#focusInStrategy === 'initial' && this.#activeDescendantControl;
				if (!preventInitialFocus) {
					this.#updateFocusedElement(FocusNavigator.getFirst(this.#container, this.#getNavigatorOptions()));
				}
			}
		}
		static #getDirection(event) {
			const direction = KEY_TO_DIRECTION[event.key];
			if (event.key === 'Tab' && event.shiftKey) {
				return 'previous';
			}
			const isMac = main_core.Browser.isMac();
			if (isMac && event.metaKey || !isMac && event.ctrlKey) {
				if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
					return 'start';
				}
				if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
					return 'end';
				}
			}
			return direction;
		}
		static #isEditableElement(element) {
			if (!main_core.Type.isElementNode(element)) {
				return false;
			}
			const el = element;
			if (el.tagName === 'INPUT') {
				return !NON_EDITABLE_INPUT_TYPES.has(element.type);
			}
			if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
				return true;
			}
			return el.isContentEditable;
		}
		static #isNativeInputKey(event, activeElement) {
			const {
				key,
				metaKey,
				altKey
			} = event;
			const codePoint = key.codePointAt(0) ?? 0;
			const isSingleChar = key.length === 1 || key.length === 2 && codePoint >= 0xD800 && codePoint <= 0xDBFF;
			const isEditable = FocusZone.#isEditableElement(activeElement);
			const isSelect = activeElement?.tagName === 'SELECT';
			if (isEditable && (isSingleChar || key === 'Home' || key === 'End')) {
				return true;
			}
			if (isSelect) {
				const isMac = main_core.Browser.isMac();
				if (key === 'ArrowDown' && isMac && !metaKey) {
					return true;
				}
				return key === 'ArrowDown' && !isMac && altKey;
			}
			if (isEditable) {
				const isInputElement = activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'INPUT';
				const inputEl = activeElement;
				const cursorAtStart = isInputElement && inputEl.selectionStart === 0 && inputEl.selectionEnd === 0;
				const cursorAtEnd = isInputElement && inputEl.selectionStart === inputEl.value.length && inputEl.selectionEnd === inputEl.value.length;
				if (key === 'ArrowLeft' && !cursorAtStart) {
					return true;
				}
				if (key === 'ArrowRight' && !cursorAtEnd) {
					return true;
				}
				const isContentEditable = main_core.Type.isElementNode(activeElement) && activeElement.isContentEditable;
				if (activeElement?.tagName === 'TEXTAREA' || isContentEditable) {
					if (key === 'PageUp' || key === 'PageDown') {
						return true;
					}
					if (key === 'ArrowUp' && !cursorAtStart) {
						return true;
					}
					if (key === 'ArrowDown' && !cursorAtEnd) {
						return true;
					}
				}
			}
			return false;
		}
	}

	class VisuallyHidden extends HTMLElement {
		connectedCallback() {
			Object.assign(this.style, {
				position: 'absolute',
				width: '1px',
				height: '1px',
				padding: '0',
				margin: '-1px',
				overflow: 'hidden',
				clip: 'rect(0, 0, 0, 0)',
				whiteSpace: 'nowrap',
				border: '0'
			});
		}
	}
	if (!customElements.get('visually-hidden'))
	{
		customElements.define('visually-hidden', VisuallyHidden);
	}

	FocusMonitor.initialize();

	exports.AccessibilityLogger = AccessibilityLogger;
	exports.AccessibilitySettings = AccessibilitySettings;
	exports.ActiveDescendant = ActiveDescendant;
	exports.FocusKeys = FocusKeys;
	exports.FocusMonitor = FocusMonitor;
	exports.FocusNavigator = FocusNavigator;
	exports.FocusTrap = FocusTrap;
	exports.FocusTrapDirective = FocusTrapDirective;
	exports.FocusZone = FocusZone;
	exports.InputModalityTracker = InputModalityTracker;
	exports.InteractivityChecker = InteractivityChecker;
	exports.LiveAnnouncer = LiveAnnouncer;
	exports.RESTORE_FOCUS_EVENT = RESTORE_FOCUS_EVENT;
	exports.VisuallyHidden = VisuallyHidden;

})(this.BX.UI.Accessibility = this.BX.UI.Accessibility || {}, BX);
//# sourceMappingURL=a11y.bundle.js.map
