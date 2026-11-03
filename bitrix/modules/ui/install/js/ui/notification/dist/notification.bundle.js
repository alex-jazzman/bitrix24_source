/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, main_core, ui_a11y) {
	'use strict';

	const ALLOWED_HREF_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);
	const HREF_SCHEME = /^([a-z][\d+.a-z-]*):/;
	const DELETE_CHAR = '\u007F';
	function isLinkableHref(href) {
		const scheme = [...href].filter(char => char > ' ' && char !== DELETE_CHAR).join('').toLowerCase().match(HREF_SCHEME);
		return scheme === null || ALLOWED_HREF_SCHEMES.has(`${scheme[1]}:`);
	}
	let Action = function () {
		function Action(balloon, options = {}) {
			babelHelpers.classCallCheck(this, Action);
			babelHelpers.defineProperty(this, "balloon", void 0);
			babelHelpers.defineProperty(this, "id", void 0);
			babelHelpers.defineProperty(this, "generatedId", void 0);
			babelHelpers.defineProperty(this, "href", void 0);
			babelHelpers.defineProperty(this, "title", void 0);
			babelHelpers.defineProperty(this, "testId", void 0);
			babelHelpers.defineProperty(this, "window", void 0);
			babelHelpers.defineProperty(this, "container", null);
			babelHelpers.defineProperty(this, "events", {});
			const opts = main_core.Type.isPlainObject(options) ? options : {};
			this.balloon = balloon;
			this.generatedId = !main_core.Type.isStringFilled(opts.id);
			this.id = this.generatedId ? main_core.Text.getRandom(8).toLowerCase() : opts.id;
			this.href = main_core.Type.isStringFilled(opts.href) ? opts.href : null;
			this.title = main_core.Type.isStringFilled(opts.title) ? opts.title : null;
			this.testId = main_core.Type.isStringFilled(opts.testId) ? opts.testId : null;
			this.window = window;
			if (main_core.Type.isPlainObject(opts.events)) {
				for (const [eventName, fn] of Object.entries(opts.events)) {
					if (!main_core.Type.isFunction(fn)) {
						continue;
					}
					this.events[eventName] = event => {
						fn.call(event.target, event, this.getBalloon(), this);
					};
				}
			}
		}
		return babelHelpers.createClass(Action, [{
			key: "getBalloon",
			value: function getBalloon() {
				return this.balloon;
			}
		}, {
			key: "getId",
			value: function getId() {
				return this.id;
			}
		}, {
			key: "hasGeneratedId",
			value: function hasGeneratedId() {
				return this.generatedId;
			}
		}, {
			key: "getTitle",
			value: function getTitle() {
				return this.title;
			}
		}, {
			key: "getHref",
			value: function getHref() {
				return this.href;
			}
		}, {
			key: "getTestId",
			value: function getTestId() {
				return this.testId;
			}
		}, {
			key: "getContainer",
			value: function getContainer() {
				if (this.container === null) {
					const href = this.getHref();
					const title = main_core.Text.encode(this.getTitle() ?? '');
					const linkHref = href !== null && isLinkableHref(href) ? href : null;
					if (href !== null && linkHref === null) {
						console.error(`BX.UI.Notification.Action: blocked a potentially unsafe href: ${href}`);
					}
					this.container = linkHref === null ? main_core.Tag.render`<button type="button" class="ui-notification-balloon-action">${title}</button>` : main_core.Tag.render`<a class="ui-notification-balloon-action" href="${linkHref}">${title}</a>`;
					if (this.testId !== null) {
						main_core.Dom.attr(this.container, 'data-testid', this.testId);
					}
					for (const [eventName, handler] of Object.entries(this.events)) {
						main_core.Event.bind(this.container, eventName, handler);
					}
				}
				return this.container;
			}
		}, {
			key: "handleKeyDown",
			value: function handleKeyDown(event) {
				if (event.key !== 'Enter' && event.key !== ' ') {
					return;
				}
				event.preventDefault();
				this.container.click();
			}
		}, {
			key: "getWindow",
			value: function getWindow() {
				return this.window;
			}
		}]);
	}();

	class NotificationEvent {
		#balloon = null;
		#name = null;
		static getFullName(eventName) {
			return `UI.Notification.Balloon:${eventName}`;
		}
		getBalloon() {
			return this.#balloon;
		}
		setBalloon(balloon) {
			if (main_core.Type.isObject(balloon)) {
				this.#balloon = balloon;
			}
		}
		getName() {
			return this.#name;
		}
		setName(name) {
			if (main_core.Type.isStringFilled(name)) {
				this.#name = name;
			}
		}
		getFullName() {
			return NotificationEvent.getFullName(this.#name ?? '');
		}
	}

	let announcers = new WeakMap();
	const instances = new Set();
	let releaseBound = false;
	function bindRelease() {
		if (releaseBound) {
			return;
		}
		releaseBound = true;
		main_core.Event.bind(window, 'pagehide', () => destroyAnnouncers());
	}
	function rememberAnnouncer(announcer) {
		instances.forEach(ref => {
			if (ref.deref() === undefined) {
				instances.delete(ref);
			}
		});
		instances.add(new WeakRef(announcer));
	}
	function announce(message, options) {
		if (message.trim() === '') {
			return;
		}
		const doc = options?.document ?? document;
		let announcer = announcers.get(doc);
		if (!announcer) {
			announcer = new ui_a11y.LiveAnnouncer({
				container: doc.body
			});
			announcers.set(doc, announcer);
			rememberAnnouncer(announcer);
			bindRelease();
		}
		announcer.announce(message, options?.politeness ?? 'polite');
	}
	function getAnnouncerDocument(showOnTopWindow) {
		if (showOnTopWindow) {
			try {
				return window.top.document;
			} catch {
				return document;
			}
		}
		return document;
	}
	function destroyAnnouncers() {
		instances.forEach(ref => ref.deref()?.destroy());
		instances.clear();
		announcers = new WeakMap();
	}

	const Position = {
		TOP_LEFT: 'top-left',
		TOP_CENTER: 'top-center',
		TOP_RIGHT: 'top-right',
		BOTTOM_LEFT: 'bottom-left',
		BOTTOM_CENTER: 'bottom-center',
		BOTTOM_RIGHT: 'bottom-right'
	};
	const ACTION_MIN_AUTO_HIDE_DELAY = 20000;
	const State = {
		INIT: 0,
		OPENING: 1,
		OPEN: 2,
		CLOSING: 3,
		CLOSED: 4,
		PAUSED: 5,
		QUEUED: 6
	};

	class Stack {
		id;
		position;
		spacing = 20;
		offsetX = 25;
		offsetY = 25;
		newestOnTop = false;
		balloonType = Balloon;
		balloons = [];
		queueStack = [];
		constructor(options = {}) {
			const opts = main_core.Type.isPlainObject(options) ? options : {};
			this.id = main_core.Type.isStringFilled(opts.id) ? opts.id : main_core.Text.getRandom(8).toLowerCase();
			this.position = Stack.getPositionCode(opts.position) ? opts.position : 'top-right';
			this.setOptions(opts);
			main_core.addCustomEvent(window, NotificationEvent.getFullName('onClose'), event => this.handleBalloonClose(event));
		}
		static getPositionCode(position) {
			const entry = Object.entries(Position).find(([, value]) => value === position);
			return entry ? entry[0] : null;
		}
		adjustPosition(balloon) {
			let offset = 0;
			this.getBalloons().forEach(currentBalloon => {
				if (!balloon || balloon === currentBalloon) {
					if (currentBalloon.doNotAdjustPosition) {
						return;
					}
					const container = currentBalloon.getContainer();
					const offsetX = `${this.getOffsetX()}px`;
					const offsetY = `${offset + this.getOffsetY()}px`;
					switch (this.getPosition()) {
						case Position.TOP_LEFT:
							main_core.Dom.style(container, {
								left: offsetX,
								top: offsetY
							});
							break;
						case Position.TOP_CENTER:
							main_core.Dom.style(container, {
								left: '50%',
								transform: 'translateX(-50%)',
								top: offsetY
							});
							break;
						case Position.TOP_RIGHT:
							main_core.Dom.style(container, {
								right: offsetX,
								top: offsetY
							});
							break;
						case Position.BOTTOM_LEFT:
							main_core.Dom.style(container, {
								left: offsetX,
								bottom: offsetY
							});
							break;
						case Position.BOTTOM_CENTER:
							main_core.Dom.style(container, {
								left: '50%',
								transform: 'translateX(-50%)',
								bottom: offsetY
							});
							break;
						case Position.BOTTOM_RIGHT:
							main_core.Dom.style(container, {
								right: offsetX,
								bottom: offsetY
							});
							break;
					}
				}
				offset += this.getSpacing() + currentBalloon.getHeight();
			});
		}
		getVisualOrder() {
			const balloons = [...this.getBalloons()];
			return this.isBottomPosition() ? balloons.reverse() : balloons;
		}
		isBottomPosition() {
			return String(this.getPosition()).startsWith('bottom');
		}
		placeContainer(balloon) {
			const container = balloon.getContainer();
			const parent = container.parentNode;
			if (parent === null) {
				return;
			}
			const order = this.getVisualOrder();
			const index = order.indexOf(balloon);
			if (index === -1) {
				return;
			}
			const after = order.slice(index + 1).find(item => item.getContainer().parentNode === parent)?.getContainer() ?? null;
			const before = order.slice(0, index).reverse().find(item => item.getContainer().parentNode === parent)?.getContainer() ?? null;
			const precedes = (first, second) => {
				return (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) > 0;
			};
			if ((after === null || precedes(container, after)) && (before === null || precedes(before, container))) {
				return;
			}
			const active = container.ownerDocument.activeElement;
			const focused = main_core.Type.isElementNode(active) && container.contains(active) ? active : null;
			if (after === null) {
				main_core.Dom.insertAfter(container, before);
			} else {
				main_core.Dom.insertBefore(container, after);
			}
			focused?.focus({
				preventScroll: true
			});
		}
		add(balloon) {
			if (this.getBalloons().length > 0 && (this.getQueue().length > 0 || !this.isBalloonFitToViewport(balloon))) {
				this.queue(balloon);
			} else {
				this.push(balloon);
			}
		}
		contains(balloon) {
			return this.balloons.includes(balloon) || this.queueStack.includes(balloon);
		}
		clear() {
			const balloons = [...this.balloons, ...this.queueStack];
			this.queueStack = [];
			this.balloons = [];
			balloons.forEach(balloon => balloon.close());
		}
		push(balloon) {
			if (!(balloon instanceof Balloon)) {
				throw new TypeError("'balloon' must be an instance of BX.UI.Notification.Balloon.");
			}
			if (!this.balloons.includes(balloon)) {
				if (this.isNewestOnTop()) {
					this.balloons.splice(0, 0, balloon);
				} else {
					this.balloons.push(balloon);
				}
			}
		}
		queue(balloon) {
			if (!(balloon instanceof Balloon)) {
				throw new TypeError("'balloon' must be an instance of BX.UI.Notification.Balloon.");
			}
			if (!this.queueStack.includes(balloon)) {
				balloon.setState(State.QUEUED);
				this.queueStack.push(balloon);
			}
		}
		checkQueue() {
			const queue = [...this.queueStack];
			for (const balloon of queue) {
				if (!this.isBalloonFitToViewport(balloon) && this.getBalloons().length > 0) {
					break;
				}
				balloon.setState(State.INIT);
				this.queueStack.shift();
				this.push(balloon);
				balloon.show();
			}
		}
		getQueue() {
			return this.queueStack;
		}
		isBalloonFitToViewport(balloon) {
			const viewportHeight = document.documentElement.clientHeight;
			const balloonHeight = this.getSpacing() + balloon.getHeight();
			return this.getHeight() + balloonHeight <= viewportHeight;
		}
		handleBalloonClose(event) {
			const closingBalloon = event.getBalloon();
			if (closingBalloon === null || closingBalloon.getStack() !== this) {
				return;
			}
			this.balloons = this.balloons.filter(balloon => closingBalloon !== balloon);
			this.queueStack = this.queueStack.filter(balloon => closingBalloon !== balloon);
			this.adjustPosition();
			this.checkQueue();
		}
		setOptions(options) {
			const opts = options ?? {};
			this.setSpacing(opts.spacing);
			this.setOffsetX(opts.offsetX);
			this.setOffsetY(opts.offsetY);
			this.setNewestOnTop(opts.newestOnTop);
			this.setBalloonType(opts.balloonType);
		}
		getId() {
			return this.id;
		}
		getBalloons() {
			return this.balloons;
		}
		getPosition() {
			return this.position;
		}
		getSpacing() {
			return this.spacing;
		}
		setSpacing(spacing) {
			if (main_core.Type.isNumber(spacing)) {
				this.spacing = spacing;
			}
		}
		getOffsetX() {
			return this.offsetX;
		}
		setOffsetX(offsetX) {
			if (main_core.Type.isNumber(offsetX)) {
				this.offsetX = offsetX;
			}
		}
		getOffsetY() {
			return this.offsetY;
		}
		setOffsetY(offsetY) {
			if (main_core.Type.isNumber(offsetY)) {
				this.offsetY = offsetY;
			}
		}
		getHeight() {
			return this.getBalloons().reduce((height, balloon) => height + balloon.getHeight() + this.getSpacing(), this.getOffsetY());
		}
		getBalloonType(className) {
			if (main_core.Type.isFunction(className)) {
				return className;
			}
			if (main_core.Type.isStringFilled(className)) {
				const classFn = main_core.Reflection.getClass(className);
				if (main_core.Type.isFunction(classFn)) {
					return classFn;
				}
			}
			return this.balloonType || Balloon;
		}
		setBalloonType(balloonType) {
			if (main_core.Type.isFunction(balloonType)) {
				this.balloonType = balloonType;
			} else if (main_core.Type.isStringFilled(balloonType)) {
				const classFn = main_core.Reflection.getClass(balloonType);
				if (main_core.Type.isFunction(classFn)) {
					this.balloonType = classFn;
				}
			}
		}
		isNewestOnTop() {
			return this.newestOnTop;
		}
		setNewestOnTop(onTop) {
			if (main_core.Type.isBoolean(onTop)) {
				this.newestOnTop = onTop;
			}
		}
	}

	const AUTOFOCUS_ATTRIBUTE = 'data-a11y-autofocus';
	const ACTION_CLASS_NAME = 'ui-notification-balloon-action';
	const ANNOUNCEMENT_SEPARATOR = '. ';
	const ANNOUNCEMENT_PART_END = /[!,.:;?…]$/;
	const TRANSITION_END_GRACE_MS = 50;
	function getDocumentChain(container) {
		const documents = [container.ownerDocument];
		let frame = container.ownerDocument.defaultView?.frameElement ?? null;
		while (frame !== null) {
			const doc = frame.ownerDocument;
			documents.push(doc);
			frame = doc.defaultView?.frameElement ?? null;
		}
		return documents;
	}
	function getFocusedElement(container) {
		const documents = getDocumentChain(container);
		return ui_a11y.FocusNavigator.getActiveElement(documents[documents.length - 1].documentElement);
	}
	function resolveFocusOrigin(target) {
		if (!main_core.Type.isElementNode(target)) {
			return null;
		}
		const element = target;
		if (element.tagName !== 'IFRAME') {
			return element;
		}
		const framedDocument = element.contentDocument;
		if (framedDocument === null) {
			return element;
		}
		const framed = ui_a11y.FocusNavigator.getActiveElement(framedDocument.documentElement);
		return framed === null || framed === framedDocument.body ? element : framed;
	}
	function isLiveDocument(doc) {
		const view = doc.defaultView;
		if (view === null) {
			return false;
		}
		const frame = view.frameElement;
		return frame === null || frame.isConnected;
	}
	function canReceiveFocus(element) {
		return element.ownerDocument.defaultView !== null && ui_a11y.InteractivityChecker.isFocusable(element);
	}
	function containsFocus(container, element) {
		if (!main_core.Type.isElementNode(element)) {
			return false;
		}
		if (container.contains(element)) {
			return true;
		}
		let doc = element.ownerDocument;
		while (doc?.defaultView?.frameElement) {
			const frame = doc.defaultView.frameElement;
			if (container.contains(frame)) {
				return true;
			}
			doc = frame.ownerDocument;
		}
		return false;
	}
	function parseStyleList(value) {
		return value.split(',').map(item => item.trim()).filter(item => item !== '');
	}
	function parseStyleTime(value) {
		const time = Number.parseFloat(value ?? '');
		if (!Number.isFinite(time)) {
			return 0;
		}
		return value.endsWith('ms') ? time : time * 1000;
	}
	function getTransitionTime(element, property) {
		const view = element.ownerDocument.defaultView;
		if (view === null) {
			return 0;
		}
		const style = view.getComputedStyle(element);
		const durations = parseStyleList(style.transitionDuration);
		if (durations.length === 0) {
			return 0;
		}
		const delays = parseStyleList(style.transitionDelay);
		return parseStyleList(style.transitionProperty).reduce((time, name, index) => {
			if (name !== property && name !== 'all') {
				return time;
			}
			const duration = parseStyleTime(durations[index % durations.length]);
			const delay = delays.length === 0 ? 0 : Math.max(parseStyleTime(delays[index % delays.length]), 0);
			return Math.max(time, duration + delay);
		}, 0);
	}
	function joinAnnouncementParts(parts) {
		return parts.reduce((announcement, part) => {
			const piece = part.replaceAll(/\s+/g, ' ').trim();
			if (piece === '') {
				return announcement;
			}
			if (announcement === '') {
				return piece;
			}
			const separator = ANNOUNCEMENT_PART_END.test(announcement) ? ' ' : ANNOUNCEMENT_SEPARATOR;
			return `${announcement}${separator}${piece}`;
		}, '');
	}
	function readAnnouncementText(node, skipped) {
		if (skipped.has(node)) {
			return '';
		}
		if (node.nodeType === Node.TEXT_NODE) {
			return node.nodeValue ?? '';
		}
		let text = '';
		let previousWasElement = false;
		node.childNodes.forEach(child => {
			const childText = readAnnouncementText(child, skipped);
			if (childText === '') {
				return;
			}
			const isElement = child.nodeType === Node.ELEMENT_NODE;
			if (isElement && previousWasElement && !/\s$/.test(text) && !/^\s/.test(childText)) {
				text += ' ';
			}
			text += childText;
			previousWasElement = isElement;
		});
		return text;
	}
	let Balloon = function () {
		function Balloon(options = {}) {
			babelHelpers.classCallCheck(this, Balloon);
			babelHelpers.defineProperty(this, "id", void 0);
			babelHelpers.defineProperty(this, "stack", void 0);
			babelHelpers.defineProperty(this, "state", State.INIT);
			babelHelpers.defineProperty(this, "showOnTopWindow", void 0);
			babelHelpers.defineProperty(this, "announcement", null);
			babelHelpers.defineProperty(this, "announcementPoliteness", 'polite');
			babelHelpers.defineProperty(this, "hasAnnounced", false);
			babelHelpers.defineProperty(this, "autofocus", false);
			babelHelpers.defineProperty(this, "hasFocusedActions", false);
			babelHelpers.defineProperty(this, "lastAnnouncementText", null);
			babelHelpers.defineProperty(this, "rerendering", false);
			babelHelpers.defineProperty(this, "focusedActionId", null);
			babelHelpers.defineProperty(this, "focusedActionIndex", -1);
			babelHelpers.defineProperty(this, "a11yBoundContainer", null);
			babelHelpers.defineProperty(this, "pausedByHover", false);
			babelHelpers.defineProperty(this, "pausedByFocus", false);
			babelHelpers.defineProperty(this, "pausedByHidden", false);
			babelHelpers.defineProperty(this, "visibilityDocument", null);
			babelHelpers.defineProperty(this, "visibilityChangeHandler", null);
			babelHelpers.defineProperty(this, "focusReturnTarget", null);
			babelHelpers.defineProperty(this, "framedFocusOrigin", null);
			babelHelpers.defineProperty(this, "focusOriginDocuments", []);
			babelHelpers.defineProperty(this, "focusOriginHandlers", null);
			babelHelpers.defineProperty(this, "autofocusedElement", null);
			babelHelpers.defineProperty(this, "container", null);
			babelHelpers.defineProperty(this, "measuredHeight", 0);
			babelHelpers.defineProperty(this, "heightNeedsMeasurement", false);
			babelHelpers.defineProperty(this, "wasAppended", false);
			babelHelpers.defineProperty(this, "content", null);
			babelHelpers.defineProperty(this, "actions", []);
			babelHelpers.defineProperty(this, "animationClassName", 'ui-notification-balloon-animate');
			babelHelpers.defineProperty(this, "animationPropertyName", 'opacity');
			babelHelpers.defineProperty(this, "customRender", null);
			babelHelpers.defineProperty(this, "category", null);
			babelHelpers.defineProperty(this, "autoHide", true);
			babelHelpers.defineProperty(this, "autoHideDelay", 8000);
			babelHelpers.defineProperty(this, "autoHideTimeout", null);
			babelHelpers.defineProperty(this, "useAirDesign", void 0);
			babelHelpers.defineProperty(this, "data", {});
			babelHelpers.defineProperty(this, "testId", null);
			babelHelpers.defineProperty(this, "width", 400);
			babelHelpers.defineProperty(this, "closeButton", null);
			babelHelpers.defineProperty(this, "closeButtonVisibility", true);
			const opts = main_core.Type.isPlainObject(options) ? options : {};
			if (!(opts.stack instanceof Stack)) {
				throw new TypeError("BX.UI.Notification.Balloon: 'stack' parameter is required.");
			}
			this.id = main_core.Type.isStringFilled(opts.id) ? opts.id : main_core.Text.getRandom(8).toLowerCase();
			this.stack = opts.stack;
			this.showOnTopWindow = opts.showOnTopWindow === true;
			this.useAirDesign = opts.useAirDesign === true;
			if (this.useAirDesign) {
				this.width = 339;
			}
			if (main_core.Type.isPlainObject(opts.events)) {
				for (const [eventName, handler] of Object.entries(opts.events)) {
					this.addEvent(eventName, handler);
				}
			}
			this.setOptions(opts);
		}
		return babelHelpers.createClass(Balloon, [{
			key: "show",
			value: function show() {
				if (this.getState() === State.CLOSING || this.getState() === State.CLOSED) {
					this.resetAppearanceState();
					this.refreshContent();
				}
				this.bindContainerHandlers();
				if (this.getState() === State.OPENING) {
					return;
				}
				if (this.getState() === State.OPEN) {
					this.activateAutoHide();
					return;
				}
				let firstLaunch = false;
				if (!this.getContainer().parentNode) {
					firstLaunch = !this.wasAppended;
					this.wasAppended = true;
					const target = this.showOnTopWindow ? window.top.document.body : document.body;
					main_core.Dom.append(this.getContainer(), target);
					main_core.ZIndexManager.register(this.getContainer(), {
						alwaysOnTop: true
					});
					if (!this.getStack().contains(this)) {
						this.getStack().add(this);
					}
					if (this.getState() === State.QUEUED) {
						this.detachContainer();
						return;
					}
					this.getStack().placeContainer(this);
				}
				this.bindDocumentHandlers();
				const paused = this.getState() === State.PAUSED;
				this.setState(State.OPENING);
				this.adjustPosition();
				main_core.ZIndexManager.bringToFront(this.getContainer());
				if (!paused && !this.hasAnnounced) {
					this.hasAnnounced = true;
					this.announceBalloon();
				}
				this.animateIn(() => {
					if (this.getState() !== State.OPENING) {
						return;
					}
					this.setState(State.OPEN);
					this.focusFirstAction();
					if (firstLaunch) {
						this.fireEvent('onOpen');
					}
					if (!paused) {
						this.activateAutoHide();
					}
				});
			}
		}, {
			key: "focusFirstAction",
			value: function focusFirstAction() {
				if (this.hasFocusedActions) {
					return;
				}
				this.hasFocusedActions = true;
				if (!this.getAutofocus()) {
					return;
				}
				const container = this.getContainer();
				const activeElement = getFocusedElement(container);
				if (containsFocus(container, activeElement) || ui_a11y.InteractivityChecker.isTextInput(activeElement)) {
					return;
				}
				const action = this.getActions().find(item => {
					const element = item.getContainer();
					return container.contains(element) && !ui_a11y.InteractivityChecker.isDisabled(element) && ui_a11y.InteractivityChecker.isFocusable(element);
				});
				if (action) {
					this.rememberFramedFocusOrigin(activeElement);
					this.focusElement(action.getContainer());
				}
			}
		}, {
			key: "focusElement",
			value: function focusElement(element) {
				this.clearAutofocusRing();
				this.autofocusedElement = element;
				main_core.Dom.attr(element, AUTOFOCUS_ATTRIBUTE, 'true');
				ui_a11y.FocusNavigator.focusTarget(element, {
					preventScroll: true,
					focusVisible: true
				});
			}
		}, {
			key: "clearAutofocusRing",
			value: function clearAutofocusRing(target = null) {
				if (this.autofocusedElement === null || target !== null && target !== this.autofocusedElement) {
					return;
				}
				main_core.Dom.attr(this.autofocusedElement, AUTOFOCUS_ATTRIBUTE, null);
				this.autofocusedElement = null;
			}
		}, {
			key: "setAutofocus",
			value: function setAutofocus(autofocus) {
				if (main_core.Type.isBoolean(autofocus)) {
					this.autofocus = autofocus;
				}
			}
		}, {
			key: "getAutofocus",
			value: function getAutofocus() {
				return this.autofocus;
			}
		}, {
			key: "getAnnouncementText",
			value: function getAnnouncementText() {
				if (this.announcement === false) {
					return '';
				}
				if (this.announcement !== null) {
					return this.announcement;
				}
				const container = this.getContainer();
				const actionElements = new Set();
				const titles = [];
				this.getActions().forEach(action => {
					const element = action.container;
					if (element === null || !container.contains(element)) {
						return;
					}
					actionElements.add(element);
					titles.push(action.getTitle() ?? element.textContent ?? '');
				});
				return joinAnnouncementParts([readAnnouncementText(container, actionElements), ...titles]);
			}
		}, {
			key: "announceBalloon",
			value: function announceBalloon() {
				this.lastAnnouncementText = this.getAnnouncementText();
				announce(this.lastAnnouncementText, {
					document: getAnnouncerDocument(this.showOnTopWindow),
					politeness: this.announcementPoliteness
				});
			}
		}, {
			key: "setOptions",
			value: function setOptions(options) {
				if (!main_core.Type.isPlainObject(options)) {
					return;
				}
				const opts = options;
				if (main_core.Type.isString(opts.announce) || opts.announce === false) {
					this.announcement = opts.announce;
				}
				if (opts.announcePoliteness === 'polite' || opts.announcePoliteness === 'assertive') {
					this.announcementPoliteness = opts.announcePoliteness;
				}
				this.setAutofocus(opts.autofocus);
				this.setContent(opts.content);
				this.setWidth(opts.width);
				this.setData(opts.data);
				this.setTestId(opts.testId);
				this.setCloseButtonVisibility(opts.closeButton);
				this.setActions(opts.actions);
				this.setCategory(opts.category ?? undefined);
				this.setAutoHide(opts.autoHide);
				this.setCustomRender(opts.render);
				this.setAutoHideDelay(opts.autoHideDelay);
			}
		}, {
			key: "update",
			value: function update(options) {
				this.getContainer();
				const previousText = this.lastAnnouncementText ?? this.getAnnouncementText();
				this.setOptions(options);
				this.deactivateAutoHide();
				this.refreshContent();
				this.resumeAutoHide();
				if (this.hasAnnounced && this.getAnnouncementText() !== previousText) {
					this.announceBalloon();
				}
			}
		}, {
			key: "refreshContent",
			value: function refreshContent() {
				const container = this.container;
				if (container === null) {
					return;
				}
				const hadFocus = container.contains(container.ownerDocument.activeElement);
				const action = hadFocus ? this.findFocusedAction(this.focusedActionId, this.focusedActionIndex) : null;
				const focusTarget = hadFocus ? action?.getContainer() ?? (this.isCloseButtonVisible() ? this.getCloseButton() : null) : null;
				const rerendering = this.rerendering;
				this.rerendering = true;
				try {
					if (hadFocus && focusTarget === null) {
						this.restoreFocusOnClose();
						this.pausedByFocus = false;
					}
					main_core.Dom.clean(container);
					main_core.Dom.append(this.render(), container);
					if (focusTarget !== null) {
						this.focusElement(focusTarget);
						this.rememberFocusedAction(action);
					}
				} finally {
					this.rerendering = rerendering;
				}
				this.heightNeedsMeasurement = !container.isConnected;
			}
		}, {
			key: "findFocusedAction",
			value: function findFocusedAction(id, index) {
				if (id !== null) {
					return this.getAction(id);
				}
				return index < 0 ? null : this.getActions()[index] ?? null;
			}
		}, {
			key: "findRenderedActionIndex",
			value: function findRenderedActionIndex(target) {
				const container = this.container;
				if (container === null || !main_core.Type.isElementNode(target)) {
					return -1;
				}
				const element = target.closest(`.${ACTION_CLASS_NAME}`);
				if (element === null || !container.contains(element)) {
					return -1;
				}
				return [...container.querySelectorAll(`.${ACTION_CLASS_NAME}`)].indexOf(element);
			}
		}, {
			key: "rememberFocusedAction",
			value: function rememberFocusedAction(action) {
				this.focusedActionIndex = action === null ? -1 : this.getActions().indexOf(action);
				this.focusedActionId = action !== null && !action.hasGeneratedId() ? action.getId() : null;
			}
		}, {
			key: "close",
			value: function close() {
				const startState = this.getState();
				if (startState === State.CLOSING || startState === State.CLOSED) {
					return;
				}
				this.setState(State.CLOSING);
				this.deactivateAutoHide();
				this.unbindDocumentHandlers();
				this.restoreFocusOnClose();
				this.clearAutofocusRing();
				const finalize = () => {
					if (this.getState() !== State.CLOSING) {
						return;
					}
					this.setState(State.CLOSED);
					this.detachContainer();
					this.container = null;
					this.a11yBoundContainer = null;
					this.wasAppended = false;
					this.measuredHeight = 0;
					this.heightNeedsMeasurement = false;
					this.resetAppearanceState();
					this.fireEvent('onClose');
				};
				if (startState === State.OPENING || !this.getContainer().isConnected) {
					finalize();
				} else {
					this.animateOut(() => finalize());
				}
			}
		}, {
			key: "resetAppearanceState",
			value: function resetAppearanceState() {
				this.pausedByHover = false;
				this.pausedByFocus = false;
				this.hasAnnounced = false;
				this.lastAnnouncementText = null;
				this.hasFocusedActions = false;
				this.focusedActionId = null;
				this.focusedActionIndex = -1;
				this.focusReturnTarget = null;
				this.framedFocusOrigin = null;
				this.clearAutofocusRing();
			}
		}, {
			key: "blink",
			value: function blink() {
				this.animateOut(() => {
					setTimeout(() => {
						this.update(null);
						this.animateIn(() => {});
					}, 200);
				});
			}
		}, {
			key: "adjustPosition",
			value: function adjustPosition() {
				if (this.getStack().isNewestOnTop()) {
					this.getStack().adjustPosition();
				} else {
					this.getStack().adjustPosition(this);
				}
			}
		}, {
			key: "getId",
			value: function getId() {
				return this.id;
			}
		}, {
			key: "getCloseButton",
			value: function getCloseButton() {
				if (this.closeButton !== null) {
					return this.closeButton;
				}
				this.closeButton = main_core.Tag.render`<button type="button" class="ui-notification-balloon-close-btn" aria-label="${main_core.Loc.getMessage('UI_NOTIFICATION_BALLOON_CLOSE')}"></button>`;
				main_core.Event.bind(this.closeButton, 'click', () => this.handleCloseBtnClick());
				return this.closeButton;
			}
		}, {
			key: "setCloseButtonVisibility",
			value: function setCloseButtonVisibility(visibility) {
				this.closeButtonVisibility = visibility !== false;
			}
		}, {
			key: "isCloseButtonVisible",
			value: function isCloseButtonVisible() {
				return this.closeButtonVisibility;
			}
		}, {
			key: "getContent",
			value: function getContent() {
				return this.content;
			}
		}, {
			key: "setContent",
			value: function setContent(content) {
				if (main_core.Type.isString(content) || main_core.Type.isDomNode(content)) {
					this.content = content;
				}
			}
		}, {
			key: "getWidth",
			value: function getWidth() {
				return this.width;
			}
		}, {
			key: "setWidth",
			value: function setWidth(width) {
				if (main_core.Type.isNumber(width) || width === 'auto') {
					this.width = width;
				}
			}
		}, {
			key: "getZIndex",
			value: function getZIndex() {
				const component = main_core.ZIndexManager.getComponent(this.getContainer());
				return component ? component.getZIndex() : 0;
			}
		}, {
			key: "setZIndex",
			value: function setZIndex(_zIndex) {
			}
		}, {
			key: "getHeight",
			value: function getHeight() {
				const container = this.getContainer();
				if (container.isConnected) {
					this.measuredHeight = container.offsetHeight;
					this.heightNeedsMeasurement = false;
				} else if (this.heightNeedsMeasurement) {
					const originalStyle = container.getAttribute('style');
					const wasInert = container.inert;
					main_core.Dom.style(container, 'visibility', 'hidden');
					container.inert = true;
					try {
						main_core.Dom.append(container, container.ownerDocument.body);
						this.measuredHeight = container.offsetHeight;
						this.heightNeedsMeasurement = false;
					} finally {
						main_core.Dom.remove(container);
						main_core.Dom.attr(container, 'style', originalStyle);
						container.inert = wasInert;
					}
				}
				return this.measuredHeight;
			}
		}, {
			key: "detachContainer",
			value: function detachContainer() {
				const container = this.getContainer();
				if (container.isConnected) {
					this.getHeight();
					main_core.ZIndexManager.unregister(container);
				}
				this.unbindDocumentHandlers();
				main_core.Dom.remove(container);
			}
		}, {
			key: "getCategory",
			value: function getCategory() {
				return this.category;
			}
		}, {
			key: "setCategory",
			value: function setCategory(category) {
				if (main_core.Type.isStringFilled(category) || category === null) {
					this.category = category;
				}
			}
		}, {
			key: "setActions",
			value: function setActions(actions) {
				if (main_core.Type.isArray(actions)) {
					this.actions = [];
					actions.forEach(action => {
						this.actions.push(new Action(this, action));
					});
				} else if (actions === null) {
					this.actions = [];
				}
			}
		}, {
			key: "getActions",
			value: function getActions() {
				return this.actions;
			}
		}, {
			key: "getAction",
			value: function getAction(id) {
				for (const action of this.actions) {
					if (action.getId() === id) {
						return action;
					}
				}
				return null;
			}
		}, {
			key: "setTestId",
			value: function setTestId(testId) {
				if (!main_core.Type.isStringFilled(testId)) {
					return;
				}
				this.testId = testId;
				if (this.container !== null) {
					main_core.Dom.attr(this.container, 'data-testid', this.testId);
				}
			}
		}, {
			key: "getTestId",
			value: function getTestId() {
				return this.testId;
			}
		}, {
			key: "getContainer",
			value: function getContainer() {
				if (this.container !== null) {
					return this.container;
				}
				this.container = main_core.Tag.render`<div class="ui-notification-balloon" data-a11y-ignore-inert="true"></div>`;
				if (this.testId !== null) {
					main_core.Dom.attr(this.container, 'data-testid', this.testId);
				}
				main_core.Dom.append(this.render(), this.container);
				main_core.Event.bind(this.container, 'mouseenter', () => this.handleMouseEnter());
				main_core.Event.bind(this.container, 'mouseleave', () => this.handleMouseLeave());
				return this.container;
			}
		}, {
			key: "render",
			value: function render() {
				const customRender = this.getCustomRender();
				if (customRender !== null) {
					return customRender.call(this, this);
				}
				const content = this.getContent();
				const width = this.getWidth();
				const widthStyle = main_core.Type.isNumber(width) ? `${width}px` : width;
				const message = main_core.Type.isDomNode(content) ? main_core.Tag.render`<div class="ui-notification-balloon-message"></div>` : main_core.Tag.render`<div class="ui-notification-balloon-message">${content ?? ''}</div>`;
				if (main_core.Type.isDomNode(content)) {
					main_core.Dom.append(content, message);
				}
				const actionsContainer = main_core.Tag.render`<div class="ui-notification-balloon-actions"></div>`;
				this.getActions().forEach(action => main_core.Dom.append(action.getContainer(), actionsContainer));
				const wrapper = main_core.Tag.render`<div class="ui-notification-balloon-content"></div>`;
				main_core.Dom.style(wrapper, 'width', widthStyle);
				main_core.Dom.append(message, wrapper);
				main_core.Dom.append(actionsContainer, wrapper);
				if (this.isCloseButtonVisible()) {
					main_core.Dom.append(this.getCloseButton(), wrapper);
				}
				return wrapper;
			}
		}, {
			key: "setCustomRender",
			value: function setCustomRender(render) {
				if (main_core.Type.isFunction(render)) {
					this.customRender = render;
				}
			}
		}, {
			key: "getCustomRender",
			value: function getCustomRender() {
				return this.customRender;
			}
		}, {
			key: "getStack",
			value: function getStack() {
				return this.stack;
			}
		}, {
			key: "setState",
			value: function setState(state) {
				const code = this.getStateCode(state);
				if (code !== null) {
					this.state = state;
				}
			}
		}, {
			key: "getState",
			value: function getState() {
				return this.state;
			}
		}, {
			key: "getStateCode",
			value: function getStateCode(mode) {
				const entry = Object.entries(State).find(([, value]) => value === mode);
				return entry ? entry[0] : null;
			}
		}, {
			key: "activateAutoHide",
			value: function activateAutoHide() {
				if (!this.getAutoHide() || this.pausedByHover || this.pausedByFocus || this.pausedByHidden || this.getState() === State.QUEUED || this.getState() === State.CLOSING || this.getState() === State.CLOSED) {
					return;
				}
				this.deactivateAutoHide();
				this.autoHideTimeout = setTimeout(() => this.close(), this.getAutoHideDelay());
			}
		}, {
			key: "deactivateAutoHide",
			value: function deactivateAutoHide() {
				if (this.autoHideTimeout !== null) {
					clearTimeout(this.autoHideTimeout);
					this.autoHideTimeout = null;
				}
			}
		}, {
			key: "setAutoHide",
			value: function setAutoHide(autoHide) {
				this.autoHide = autoHide !== false;
			}
		}, {
			key: "getAutoHide",
			value: function getAutoHide() {
				return this.autoHide && main_core.Extension.getSettings('ui.notification').get('autoHide', true) !== false;
			}
		}, {
			key: "setAutoHideDelay",
			value: function setAutoHideDelay(delay) {
				if (main_core.Type.isNumber(delay) && delay > 0) {
					this.autoHideDelay = delay;
				}
			}
		}, {
			key: "getAutoHideDelay",
			value: function getAutoHideDelay() {
				const delay = Math.max(this.autoHideDelay, this.getActions().length > 0 ? ACTION_MIN_AUTO_HIDE_DELAY : 0);
				const configuredFactor = main_core.Extension.getSettings('ui.notification').get('autoHideDelayFactor', 1);
				const factor = main_core.Type.isNumber(configuredFactor) && Number.isFinite(configuredFactor) && configuredFactor > 0 ? configuredFactor : 1;
				return delay * factor;
			}
		}, {
			key: "animateIn",
			value: function animateIn(callback) {
				const container = this.getContainer();
				if (main_core.Dom.hasClass(container, this.animationClassName)) {
					callback();
					return;
				}
				this.runTransition(container, () => {
					main_core.Dom.addClass(container, this.animationClassName);
					if (this.useAirDesign === true) {
						main_core.Dom.addClass(container, ['--air', '—ui-context-content-dark']);
					}
				}, () => main_core.Dom.hasClass(container, this.animationClassName), callback);
			}
		}, {
			key: "animateOut",
			value: function animateOut(callback) {
				const container = this.getContainer();
				if (!main_core.Dom.hasClass(container, this.animationClassName)) {
					callback();
					return;
				}
				this.runTransition(container, () => main_core.Dom.removeClass(container, this.animationClassName), () => true, callback);
			}
		}, {
			key: "runTransition",
			value: function runTransition(container, startTransition, isEnd, callback) {
				let reported = false;
				let timeout = null;
				const report = () => {
					if (reported) {
						return;
					}
					reported = true;
					if (timeout !== null) {
						clearTimeout(timeout);
						timeout = null;
					}
					callback();
				};
				const handleTransitionEnd = event => {
					if (event.target !== container || event.propertyName !== this.animationPropertyName || !isEnd()) {
						return;
					}
					main_core.Event.unbind(container, 'transitionend', handleTransitionEnd);
					report();
				};
				const finishWaiting = () => {
					timeout = null;
					if (!isEnd()) {
						return;
					}
					main_core.Event.unbind(container, 'transitionend', handleTransitionEnd);
					report();
				};
				main_core.Event.bind(container, 'transitionend', handleTransitionEnd);
				startTransition();
				const time = getTransitionTime(container, this.animationPropertyName);
				if (time <= 0) {
					finishWaiting();
					return;
				}
				timeout = setTimeout(finishWaiting, time + TRANSITION_END_GRACE_MS);
			}
		}, {
			key: "handleCloseBtnClick",
			value: function handleCloseBtnClick() {
				this.close();
			}
		}, {
			key: "bindAccessibilityHandlers",
			value: function bindAccessibilityHandlers() {
				this.bindDocumentHandlers();
				this.bindContainerHandlers();
			}
		}, {
			key: "bindContainerHandlers",
			value: function bindContainerHandlers() {
				const container = this.getContainer();
				if (this.a11yBoundContainer === container) {
					return;
				}
				this.a11yBoundContainer = container;
				main_core.Event.bind(container, 'focusin', event => this.handleFocusIn(event));
				main_core.Event.bind(container, 'focusout', event => this.handleFocusOut(event));
				main_core.Event.bind(container, 'keydown', event => this.handleContainerKeyDown(event));
			}
		}, {
			key: "bindDocumentHandlers",
			value: function bindDocumentHandlers() {
				this.bindVisibilityHandler();
				this.bindFocusOriginWatcher();
			}
		}, {
			key: "unbindDocumentHandlers",
			value: function unbindDocumentHandlers() {
				this.unbindVisibilityHandler();
				this.unbindFocusOriginWatcher();
			}
		}, {
			key: "bindVisibilityHandler",
			value: function bindVisibilityHandler() {
				const doc = this.getContainer().ownerDocument;
				if (this.visibilityDocument === doc) {
					return;
				}
				this.unbindVisibilityHandler();
				this.visibilityDocument = doc;
				this.pausedByHidden = doc.hidden;
				this.visibilityChangeHandler ??= () => this.handleVisibilityChange();
				main_core.Event.bind(doc, 'visibilitychange', this.visibilityChangeHandler);
			}
		}, {
			key: "rememberFramedFocusOrigin",
			value: function rememberFramedFocusOrigin(element) {
				if (main_core.Type.isElementNode(element) && element.ownerDocument !== this.getContainer().ownerDocument) {
					this.framedFocusOrigin = element;
				}
			}
		}, {
			key: "bindFocusOriginWatcher",
			value: function bindFocusOriginWatcher() {
				const documents = getDocumentChain(this.getContainer());
				const focused = getFocusedElement(this.getContainer());
				if (focused !== null) {
					getDocumentChain(focused).forEach(doc => documents.push(doc));
				}
				documents.forEach(doc => this.watchFocusOriginDocument(doc));
			}
		}, {
			key: "watchFocusOriginDocument",
			value: function watchFocusOriginDocument(doc) {
				this.releaseDeadFocusOriginDocuments();
				if (this.focusOriginDocuments.includes(doc) || !isLiveDocument(doc)) {
					return;
				}
				this.focusOriginHandlers ??= {
					focusin: event => this.handleDocumentFocusIn(event),
					focusout: event => this.handleDocumentFocusOut(event)
				};
				this.focusOriginDocuments.push(doc);
				main_core.Event.bind(doc, 'focusin', this.focusOriginHandlers.focusin);
				main_core.Event.bind(doc, 'focusout', this.focusOriginHandlers.focusout);
			}
		}, {
			key: "releaseDeadFocusOriginDocuments",
			value: function releaseDeadFocusOriginDocuments() {
				if (this.focusOriginDocuments.every(doc => isLiveDocument(doc))) {
					return;
				}
				const handlers = this.focusOriginHandlers;
				this.focusOriginDocuments = this.focusOriginDocuments.filter(doc => {
					if (isLiveDocument(doc)) {
						return true;
					}
					if (handlers !== null) {
						main_core.Event.unbind(doc, 'focusin', handlers.focusin);
						main_core.Event.unbind(doc, 'focusout', handlers.focusout);
					}
					return false;
				});
			}
		}, {
			key: "unbindFocusOriginWatcher",
			value: function unbindFocusOriginWatcher() {
				const handlers = this.focusOriginHandlers;
				if (handlers !== null) {
					this.focusOriginDocuments.forEach(doc => {
						main_core.Event.unbind(doc, 'focusin', handlers.focusin);
						main_core.Event.unbind(doc, 'focusout', handlers.focusout);
					});
				}
				this.focusOriginDocuments = [];
			}
		}, {
			key: "handleDocumentFocusIn",
			value: function handleDocumentFocusIn(event) {
				const target = event.target;
				if (!main_core.Type.isElementNode(target) || target.tagName !== 'IFRAME') {
					return;
				}
				const framedDocument = target.contentDocument;
				if (framedDocument !== null) {
					this.watchFocusOriginDocument(framedDocument);
				}
			}
		}, {
			key: "handleDocumentFocusOut",
			value: function handleDocumentFocusOut(event) {
				this.rememberFramedFocusOrigin(resolveFocusOrigin(event.target));
			}
		}, {
			key: "unbindVisibilityHandler",
			value: function unbindVisibilityHandler() {
				if (this.visibilityDocument !== null && this.visibilityChangeHandler !== null) {
					main_core.Event.unbind(this.visibilityDocument, 'visibilitychange', this.visibilityChangeHandler);
				}
				this.visibilityDocument = null;
			}
		}, {
			key: "handleVisibilityChange",
			value: function handleVisibilityChange() {
				this.pausedByHidden = this.visibilityDocument?.hidden === true;
				if (this.pausedByHidden) {
					this.deactivateAutoHide();
				} else {
					this.resumeAutoHide();
				}
			}
		}, {
			key: "handleFocusIn",
			value: function handleFocusIn(event) {
				if (this.rerendering || this.getState() === State.CLOSING || this.getState() === State.CLOSED) {
					return;
				}
				const action = this.getActions().find(item => {
					return item.container !== null && item.container.contains(event.target);
				}) ?? null;
				if (action === null) {
					this.focusedActionId = null;
					this.focusedActionIndex = this.findRenderedActionIndex(event.target);
				} else {
					this.rememberFocusedAction(action);
				}
				if (main_core.Type.isDomNode(event.relatedTarget) && this.getContainer().contains(event.relatedTarget)) {
					return;
				}
				this.focusReturnTarget = main_core.Type.isElementNode(event.relatedTarget) ? event.relatedTarget : this.framedFocusOrigin;
				this.pausedByFocus = true;
				this.deactivateAutoHide();
			}
		}, {
			key: "handleFocusOut",
			value: function handleFocusOut(event) {
				if (this.rerendering || this.getState() === State.CLOSING || this.getState() === State.CLOSED) {
					return;
				}
				this.clearAutofocusRing(event.target);
				if (main_core.Type.isDomNode(event.relatedTarget) && this.getContainer().contains(event.relatedTarget)) {
					return;
				}
				this.pausedByFocus = false;
				this.resumeAutoHide();
			}
		}, {
			key: "resumeAutoHide",
			value: function resumeAutoHide() {
				this.activateAutoHide();
			}
		}, {
			key: "handleContainerKeyDown",
			value: function handleContainerKeyDown(event) {
				if (event.key !== 'Escape' || ui_a11y.InteractivityChecker.isTextInput(event.target) || this.getState() === State.CLOSING || this.getState() === State.CLOSED) {
					return;
				}
				this.close();
				if (this.getState() === State.CLOSING || this.getState() === State.CLOSED) {
					event.preventDefault();
					event.stopPropagation();
				}
			}
		}, {
			key: "restoreFocusOnClose",
			value: function restoreFocusOnClose() {
				const container = this.getContainer();
				if (!container.contains(container.ownerDocument.activeElement)) {
					return;
				}
				if (this.focusReturnTarget !== null && canReceiveFocus(this.focusReturnTarget)) {
					this.focusReturnTarget.focus({
						preventScroll: true
					});
					return;
				}
				const wasInert = container.inert;
				container.inert = true;
				try {
					ui_a11y.FocusMonitor.Instance.restoreFocus();
				} finally {
					container.inert = wasInert;
				}
			}
		}, {
			key: "handleMouseEnter",
			value: function handleMouseEnter() {
				this.fireEvent('onMouseEnter');
				if (this.getState() === State.QUEUED || this.getState() === State.CLOSING || this.getState() === State.CLOSED) {
					return;
				}
				this.pausedByHover = true;
				this.deactivateAutoHide();
				this.setState(State.PAUSED);
				this.show();
			}
		}, {
			key: "handleMouseLeave",
			value: function handleMouseLeave() {
				this.fireEvent('onMouseLeave');
				this.pausedByHover = false;
				this.resumeAutoHide();
			}
		}, {
			key: "fireEvent",
			value: function fireEvent(eventName) {
				const event = this.getEvent(eventName);
				main_core.onCustomEvent(this, event.getFullName(), [event]);
				return event;
			}
		}, {
			key: "addEvent",
			value: function addEvent(eventName, fn) {
				if (main_core.Type.isFunction(fn)) {
					main_core.addCustomEvent(this, NotificationEvent.getFullName(eventName), fn);
				}
			}
		}, {
			key: "removeEvent",
			value: function removeEvent(eventName, fn) {
				if (main_core.Type.isFunction(fn)) {
					main_core.removeCustomEvent(this, NotificationEvent.getFullName(eventName), fn);
				}
			}
		}, {
			key: "getEvent",
			value: function getEvent(eventName) {
				const event = new NotificationEvent();
				event.setBalloon(this);
				event.setName(eventName);
				return event;
			}
		}, {
			key: "getData",
			value: function getData() {
				return this.data;
			}
		}, {
			key: "setData",
			value: function setData(data) {
				if (main_core.Type.isPlainObject(data)) {
					this.data = data;
				}
			}
		}]);
	}();

	class Manager {
		stacks = Object.create(null);
		balloons = Object.create(null);
		balloonDefaults = {};
		stackDefaults = {};
		defaultPosition = Position.TOP_RIGHT;
		constructor() {
			main_core.addCustomEvent(window, NotificationEvent.getFullName('onClose'), event => this.handleBalloonClose(event));
		}
		notify(options) {
			const opts = main_core.Type.isPlainObject(options) ? options : {};
			const currentBalloon = (opts.id ? this.getBalloonById(opts.id) : null) ?? (opts.category ? this.getBalloonByCategory(opts.category) : null);
			if (currentBalloon) {
				currentBalloon.setOptions(opts);
				currentBalloon.show();
				if (opts.blinkOnUpdate === false) {
					currentBalloon.update(null);
				} else {
					currentBalloon.blink();
				}
				return undefined;
			}
			const stack = (() => {
				if (opts.stack instanceof Stack) {
					this.addStack(opts.stack);
					return opts.stack;
				}
				const resolved = main_core.Type.isStringFilled(opts.position) ? this.getStackByPosition(opts.position) : this.getDefaultStack();
				opts.stack = resolved;
				return resolved;
			})();
			const balloonOptions = main_core.Runtime.merge({}, this.getBalloonDefaults(), opts);
			const BalloonType = stack.getBalloonType(opts.type);
			const balloon = new BalloonType(balloonOptions);
			if (!(balloon instanceof Balloon)) {
				throw new TypeError('Balloon type must be an instance of BX.UI.Notification.Balloon');
			}
			this.balloons[balloon.getId()] = balloon;
			balloon.show();
			return balloon;
		}
		getBalloonById(balloonId) {
			return this.balloons[balloonId] ?? null;
		}
		getBalloonByCategory(category) {
			if (main_core.Type.isStringFilled(category)) {
				for (const balloon of Object.values(this.balloons)) {
					if (balloon.getCategory() === category) {
						return balloon;
					}
				}
			}
			return null;
		}
		removeBalloon(balloon) {
			delete this.balloons[balloon.getId()];
		}
		handleBalloonClose(event) {
			const balloon = event.getBalloon();
			if (balloon !== null) {
				this.removeBalloon(balloon);
			}
		}
		getStack(stackId) {
			return this.stacks[stackId] ?? null;
		}
		getDefaultStack() {
			return this.getStackByPosition(this.getDefaultPosition());
		}
		getStackByPosition(position) {
			let stack = this.getStack(position);
			if (stack === null) {
				stack = new Stack(main_core.Runtime.merge({}, this.getStackDefaults(), {
					id: position,
					position
				}));
				this.addStack(stack);
			}
			return stack;
		}
		addStack(stack) {
			if (stack instanceof Stack && this.getStack(stack.getId()) === null) {
				this.stacks[stack.getId()] = stack;
			}
		}
		setBalloonDefaults(options) {
			if (main_core.Type.isPlainObject(options)) {
				Object.assign(this.balloonDefaults, main_core.Runtime.merge(this.balloonDefaults, options));
			}
		}
		getBalloonDefaults() {
			return this.balloonDefaults;
		}
		setStackDefaults(position, options) {
			if (Stack.getPositionCode(position)) {
				const stack = this.getStackByPosition(position);
				stack.setOptions(options ?? null);
			} else if (main_core.Type.isPlainObject(position)) {
				const opts = position;
				for (const pos of Object.values(Position)) {
					this.setStackDefaults(pos, opts);
				}
			}
		}
		setDefaultPosition(position) {
			if (Stack.getPositionCode(position)) {
				this.defaultPosition = position;
			}
		}
		getDefaultPosition() {
			return this.defaultPosition;
		}
		getStackDefaults() {
			return this.stackDefaults;
		}
	}

	const UI = main_core.Reflection.getClass('BX.UI');
	const Center = new Manager();

	exports.Action = Action;
	exports.Balloon = Balloon;
	exports.Center = Center;
	exports.Event = NotificationEvent;
	exports.Manager = Manager;
	exports.Position = Position;
	exports.Stack = Stack;
	exports.State = State;
	exports.UI = UI;

})(this.BX.UI.Notification = this.BX.UI.Notification || {}, BX, BX.UI.Accessibility);
//# sourceMappingURL=notification.bundle.js.map
