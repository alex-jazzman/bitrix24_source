/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, main_core) {
	'use strict';

	let Action = function () {
		function Action(balloon, options = {}) {
			babelHelpers.classCallCheck(this, Action);
			babelHelpers.defineProperty(this, "balloon", void 0);
			babelHelpers.defineProperty(this, "id", void 0);
			babelHelpers.defineProperty(this, "href", void 0);
			babelHelpers.defineProperty(this, "title", void 0);
			babelHelpers.defineProperty(this, "window", void 0);
			babelHelpers.defineProperty(this, "container", null);
			babelHelpers.defineProperty(this, "events", {});
			const opts = main_core.Type.isPlainObject(options) ? options : {};
			this.balloon = balloon;
			this.id = main_core.Type.isStringFilled(opts.id) ? opts.id : main_core.Text.getRandom(8).toLowerCase();
			this.href = main_core.Type.isStringFilled(opts.href) ? opts.href : null;
			this.title = main_core.Type.isStringFilled(opts.title) ? opts.title : null;
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
			key: "getContainer",
			value: function getContainer() {
				if (this.container === null) {
					const href = this.getHref();
					const title = this.getTitle() ?? '';
					this.container = href === null ? main_core.Tag.render`<span class="ui-notification-balloon-action">${title}</span>` : main_core.Tag.render`<a class="ui-notification-balloon-action" href="${href}">${title}</a>`;
					for (const [eventName, handler] of Object.entries(this.events)) {
						main_core.Event.bind(this.container, eventName, handler);
					}
				}
				return this.container;
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

	const Position = {
		TOP_LEFT: 'top-left',
		TOP_CENTER: 'top-center',
		TOP_RIGHT: 'top-right',
		BOTTOM_LEFT: 'bottom-left',
		BOTTOM_CENTER: 'bottom-center',
		BOTTOM_RIGHT: 'bottom-right'
	};
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
		add(balloon) {
			if (this.getBalloons().length > 0 && (this.getQueue().length > 0 || !this.isBalloonFitToViewport(balloon))) {
				this.queue(balloon);
			} else {
				this.push(balloon);
			}
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

	let Balloon = function () {
		function Balloon(options = {}) {
			babelHelpers.classCallCheck(this, Balloon);
			babelHelpers.defineProperty(this, "id", void 0);
			babelHelpers.defineProperty(this, "stack", void 0);
			babelHelpers.defineProperty(this, "state", State.INIT);
			babelHelpers.defineProperty(this, "showOnTopWindow", void 0);
			babelHelpers.defineProperty(this, "container", null);
			babelHelpers.defineProperty(this, "content", null);
			babelHelpers.defineProperty(this, "actions", []);
			babelHelpers.defineProperty(this, "animationClassName", 'ui-notification-balloon-animate');
			babelHelpers.defineProperty(this, "customRender", null);
			babelHelpers.defineProperty(this, "category", null);
			babelHelpers.defineProperty(this, "autoHide", true);
			babelHelpers.defineProperty(this, "autoHideDelay", 8000);
			babelHelpers.defineProperty(this, "autoHideTimeout", null);
			babelHelpers.defineProperty(this, "useAirDesign", void 0);
			babelHelpers.defineProperty(this, "data", {});
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
				if (this.getState() === State.OPENING) {
					return;
				}
				if (this.getState() === State.OPEN) {
					this.activateAutoHide();
					return;
				}
				let firstLaunch = false;
				if (!this.getContainer().parentNode) {
					firstLaunch = true;
					const target = this.showOnTopWindow ? window.top.document.body : document.body;
					main_core.Dom.append(this.getContainer(), target);
					main_core.ZIndexManager.register(this.getContainer(), {
						alwaysOnTop: true
					});
					this.getStack().add(this);
					if (this.getState() === State.QUEUED) {
						return;
					}
				}
				const paused = this.getState() === State.PAUSED;
				this.setState(State.OPENING);
				this.adjustPosition();
				main_core.ZIndexManager.bringToFront(this.getContainer());
				this.animateIn(() => {
					if (this.getState() !== State.OPENING) {
						return;
					}
					this.setState(State.OPEN);
					if (firstLaunch) {
						this.fireEvent('onOpen');
					}
					if (!paused) {
						this.activateAutoHide();
					}
				});
			}
		}, {
			key: "setOptions",
			value: function setOptions(options) {
				if (!main_core.Type.isPlainObject(options)) {
					return;
				}
				const opts = options;
				this.setContent(opts.content);
				this.setWidth(opts.width);
				this.setData(opts.data);
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
				this.setOptions(options);
				main_core.Dom.clean(this.getContainer());
				main_core.Dom.append(this.render(), this.getContainer());
				this.deactivateAutoHide();
				this.activateAutoHide();
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
				const finalize = () => {
					if (this.getState() !== State.CLOSING) {
						return;
					}
					this.setState(State.CLOSED);
					main_core.ZIndexManager.unregister(this.getContainer());
					main_core.Dom.remove(this.getContainer());
					this.container = null;
					this.fireEvent('onClose');
				};
				if (startState === State.OPENING) {
					finalize();
				} else {
					this.animateOut(() => finalize());
				}
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
				this.closeButton = main_core.Tag.render`<div class="ui-notification-balloon-close-btn"></div>`;
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
				return this.getContainer().offsetHeight;
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
			key: "getContainer",
			value: function getContainer() {
				if (this.container !== null) {
					return this.container;
				}
				this.container = main_core.Tag.render`<div class="ui-notification-balloon" data-a11y-ignore-inert="true"></div>`;
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
				if (!this.getAutoHide()) {
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
				return this.autoHide;
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
				return this.autoHideDelay;
			}
		}, {
			key: "animateIn",
			value: function animateIn(callback) {
				const container = this.getContainer();
				if (main_core.Dom.hasClass(container, this.animationClassName)) {
					callback();
					return;
				}
				const handleTransitionEnd = () => {
					main_core.Event.unbind(container, 'transitionend', handleTransitionEnd);
					callback();
				};
				main_core.Event.bind(container, 'transitionend', handleTransitionEnd);
				main_core.Dom.addClass(container, this.animationClassName);
				if (this.useAirDesign === true) {
					main_core.Dom.addClass(container, ['--air', '—ui-context-content-dark']);
				}
			}
		}, {
			key: "animateOut",
			value: function animateOut(callback) {
				const container = this.getContainer();
				if (!main_core.Dom.hasClass(container, this.animationClassName)) {
					callback();
					return;
				}
				const handleTransitionEnd = () => {
					main_core.Event.unbind(container, 'transitionend', handleTransitionEnd);
					callback();
				};
				main_core.Event.bind(container, 'transitionend', handleTransitionEnd);
				main_core.Dom.removeClass(container, this.animationClassName);
			}
		}, {
			key: "handleCloseBtnClick",
			value: function handleCloseBtnClick() {
				this.close();
			}
		}, {
			key: "handleMouseEnter",
			value: function handleMouseEnter() {
				this.fireEvent('onMouseEnter');
				this.deactivateAutoHide();
				this.setState(State.PAUSED);
				this.show();
			}
		}, {
			key: "handleMouseLeave",
			value: function handleMouseLeave() {
				this.fireEvent('onMouseLeave');
				this.activateAutoHide();
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

})(this.BX.UI.Notification = this.BX.UI.Notification || {}, BX);
//# sourceMappingURL=notification.bundle.js.map
