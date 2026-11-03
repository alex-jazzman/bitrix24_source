/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
(function (exports, main_core, main_core_events, ui_system_popover) {
	'use strict';

	const TooltipPosition = Object.freeze({
		Top: 'top',
		Right: 'right',
		Bottom: 'bottom',
		Left: 'left'
	});
	const TooltipTrigger = Object.freeze({
		Hover: 'hover',
		Click: 'click',
		Focus: 'focus',
		Manual: 'manual'
	});
	const DEFAULT_POSITION = TooltipPosition.Top;
	const DEFAULT_TRIGGER = Object.freeze([TooltipTrigger.Hover, TooltipTrigger.Focus]);
	const DEFAULT_MAX_WIDTH = 400;

	const LABEL$1 = 'BX.UI.System.Tooltip';
	const HOVER_BRIDGE_DELAY = 150;
	const OUTSIDE_CLICK_OPTIONS = {
		capture: true,
		passive: true
	};
	const NO_REASONS = Object.freeze({
		hovered: false,
		hoveredBubble: false,
		focused: false,
		clickPinned: false
	});
	const assertTriggerCombination = modes => {
		if (modes.includes(TooltipTrigger.Manual) && modes.length > 1) {
			throw new TypeError(`${LABEL$1}: the "${TooltipTrigger.Manual}" trigger cannot be combined with any other - it means the ` + 'tooltip is shown and hidden by the place of use alone.');
		}
	};
	let raisingGesture = null;
	const buildingFrom = (gesture, build) => {
		raisingGesture = gesture;
		try {
			build();
		} finally {
			raisingGesture = null;
		}
	};
	const raisedBy = (gesture, element) => {
		const raising = raisingGesture;
		if (raising === null || raising.type !== gesture) {
			return false;
		}
		const reached = raising.target;
		return main_core.Type.isDomNode(reached) && element.contains(reached);
	};
	class TriggerBinding {
		#host;
		#target;
		#modes;
		#showDelay;
		#hideDelay;
		#bubble = null;
		#outsideClickHost = null;
		#reasons;
		#heldByLayer = false;
		#showTimer = null;
		#hideTimer = null;
		constructor(host, options) {
			assertTriggerCombination(options.trigger);
			this.#host = host;
			this.#target = options.target;
			this.#modes = options.trigger;
			this.#showDelay = options.showDelay;
			this.#hideDelay = options.hideDelay;
			this.#reasons = {
				...NO_REASONS,
				hovered: this.#has(TooltipTrigger.Hover) && (raisedBy('pointerover', this.#target) || this.#target.matches(':hover')),
				focused: this.#has(TooltipTrigger.Focus) && this.#target.matches(':focus-visible'),
				clickPinned: this.#has(TooltipTrigger.Click) && options.clickPinned === true
			};
			this.#bind();
			this.#watchOutsideClick(this.#reasons.clickPinned);
			this.#reasons.hoveredBubble = this.#bindBubble(options.bubble ?? null);
			this.#heldByLayer = options.heldByLayer === true;
		}
		start() {
			if (this.#wanted() || this.#heldByLayer) {
				this.#sync();
			}
		}
		setBubble(bubble) {
			if (bubble === this.#bubble) {
				return;
			}
			this.#unbindBubble();
			this.#set('hoveredBubble', this.#bindBubble(bubble));
		}
		setDelays(showDelay, hideDelay) {
			this.#showDelay = showDelay;
			this.#hideDelay = hideDelay;
		}
		settle(shown) {
			this.#clearTimers();
			if (shown) {
				return;
			}
			this.#reasons = {
				...NO_REASONS
			};
			this.#watchOutsideClick(false);
		}
		isClickPinned() {
			return this.#reasons.clickPinned;
		}
		isHolding() {
			return this.#wanted();
		}
		destroy() {
			this.#clearTimers();
			this.#watchOutsideClick(false);
			this.#unbind();
		}
		#has(mode) {
			return this.#modes.includes(mode);
		}
		#subscriptions() {
			const subscriptions = [];
			if (this.#has(TooltipTrigger.Hover)) {
				subscriptions.push(['pointerenter', this.#handlePointerEnter], ['pointerleave', this.#handlePointerLeave]);
			}
			if (this.#has(TooltipTrigger.Focus)) {
				subscriptions.push(['focusin', this.#handleFocusIn], ['focusout', this.#handleFocusOut]);
			}
			if (this.#has(TooltipTrigger.Click)) {
				subscriptions.push(['click', this.#handleClick]);
			}
			return subscriptions;
		}
		#bind() {
			this.#subscriptions().forEach(([eventName, handler]) => main_core.Event.bind(this.#target, eventName, handler));
		}
		#unbind() {
			this.#subscriptions().forEach(([eventName, handler]) => main_core.Event.unbind(this.#target, eventName, handler));
			this.#unbindBubble();
		}
		#watchOutsideClick(watch) {
			const host = this.#outsideClickHost;
			if (watch === (host !== null)) {
				return;
			}
			if (host === null) {
				const view = this.#outsideClickTarget();
				main_core.Event.bind(view, 'click', this.#handleOutsideClick, OUTSIDE_CLICK_OPTIONS);
				this.#outsideClickHost = view;
				return;
			}
			main_core.Event.unbind(host, 'click', this.#handleOutsideClick, OUTSIDE_CLICK_OPTIONS);
			this.#outsideClickHost = null;
		}
		#outsideClickTarget() {
			const owner = this.#target.ownerDocument;
			return owner.defaultView ?? owner;
		}
		#bindBubble(bubble) {
			if (bubble === null) {
				return false;
			}
			this.#bubble = bubble;
			if (!this.#has(TooltipTrigger.Hover)) {
				return false;
			}
			main_core.Event.bind(bubble, 'pointerenter', this.#handleBubblePointerEnter);
			main_core.Event.bind(bubble, 'pointerleave', this.#handleBubblePointerLeave);
			return bubble.matches(':hover');
		}
		#unbindBubble() {
			const bubble = this.#bubble;
			if (bubble === null) {
				return;
			}
			main_core.Event.unbind(bubble, 'pointerenter', this.#handleBubblePointerEnter);
			main_core.Event.unbind(bubble, 'pointerleave', this.#handleBubblePointerLeave);
			this.#bubble = null;
		}
		#set(reason, value) {
			if (this.#reasons[reason] === value) {
				return;
			}
			this.#reasons[reason] = value;
			if (reason === 'clickPinned') {
				this.#watchOutsideClick(value);
			}
			this.#sync(reason === 'hovered' || reason === 'hoveredBubble');
		}
		#wanted() {
			const {
				hovered,
				hoveredBubble,
				focused,
				clickPinned
			} = this.#reasons;
			return hovered || hoveredBubble || focused || clickPinned;
		}
		#sync(fromHover = false) {
			this.#clearTimers();
			const wanted = this.#wanted();
			if (wanted === this.#host.isShown()) {
				return;
			}
			const delay = wanted ? this.#showDelay : fromHover ? Math.max(this.#hideDelay, HOVER_BRIDGE_DELAY) : this.#hideDelay;
			const apply = wanted ? () => this.#host.show() : () => this.#host.hide();
			if (delay === 0) {
				apply();
				return;
			}
			const timer = setTimeout(apply, delay);
			if (wanted) {
				this.#showTimer = timer;
			} else {
				this.#hideTimer = timer;
			}
		}
		#clearTimers() {
			if (this.#showTimer !== null) {
				clearTimeout(this.#showTimer);
				this.#showTimer = null;
			}
			if (this.#hideTimer !== null) {
				clearTimeout(this.#hideTimer);
				this.#hideTimer = null;
			}
		}
		#handlePointerEnter = () => {
			this.#set('hovered', true);
		};
		#handlePointerLeave = () => {
			this.#set('hovered', false);
		};
		#handleBubblePointerEnter = () => {
			this.#set('hoveredBubble', true);
		};
		#handleBubblePointerLeave = () => {
			this.#set('hoveredBubble', false);
		};
		#handleFocusIn = () => {
			if (this.#target.matches(':focus-visible')) {
				this.#set('focused', true);
			}
		};
		#handleFocusOut = () => {
			this.#set('focused', false);
		};
		#handleClick = () => {
			this.#set('clickPinned', !this.#reasons.clickPinned);
		};
		#handleOutsideClick = event => {
			const clicked = event.target;
			if (!main_core.Type.isDomNode(clicked)) {
				return;
			}
			if (this.#target.contains(clicked) || this.#bubble?.contains(clicked) === true) {
				return;
			}
			this.#set('clickPinned', false);
		};
	}

	const EVENT_NAMESPACE = 'BX.UI.System.Tooltip';
	const BUBBLE_CLASS = 'ui-system-tooltip';
	const DEFAULT_OFFSET = 4;
	const MIN_OFFSET = 0;
	const MAX_OFFSET = 12;
	const DESCRIBED_BY = 'aria-describedby';
	let lastBubbleId = 0;
	const generateBubbleId = ownerDocument => {
		let id = '';
		do {
			lastBubbleId += 1;
			id = `ui-system-tooltip-${lastBubbleId}`;
		} while (ownerDocument.getElementById(id) !== null);
		return id;
	};
	const describedByTokens = element => {
		return (element.getAttribute(DESCRIBED_BY) ?? '').split(/\s+/).filter(token => token !== '');
	};
	const writeDescribedBy = (element, tokens) => {
		if (tokens.length === 0) {
			element.removeAttribute(DESCRIBED_BY);
			return;
		}
		element.setAttribute(DESCRIBED_BY, tokens.join(' '));
	};
	const NOTHING_CARRIED = Object.freeze({
		clickPinned: false,
		heldByLayer: false
	});
	const isPosition = value => {
		return Object.values(TooltipPosition).includes(value);
	};
	const isTrigger = value => {
		return Object.values(TooltipTrigger).includes(value);
	};
	const resolveTrigger = (raw, fallback) => {
		if (main_core.Type.isUndefined(raw)) {
			return fallback;
		}
		const values = main_core.Type.isArray(raw) ? raw : [raw];
		const modes = values.filter((mode, index) => {
			return isTrigger(mode) && values.indexOf(mode) === index;
		});
		if (modes.length === 0) {
			return fallback;
		}
		assertTriggerCombination(modes);
		return modes;
	};
	const sameTrigger = (one, other) => {
		return one.length === other.length && one.every((mode, index) => mode === other[index]);
	};
	const isFiniteNumber = value => {
		return main_core.Type.isNumber(value) && Number.isFinite(value);
	};
	const resolveDelay = (raw, fallback) => {
		return isFiniteNumber(raw) ? Math.max(0, raw) : fallback;
	};
	const resolveMaxWidth = (raw, fallback) => {
		return isFiniteNumber(raw) && raw > 0 ? raw : fallback;
	};
	const resolveOffset = (raw, fallback) => {
		if (!isFiniteNumber(raw)) {
			return fallback;
		}
		const limited = Math.min(Math.max(raw, MIN_OFFSET), MAX_OFFSET);
		if (limited !== raw) {
			console.warn(`${EVENT_NAMESPACE}: the "offset" option holds ${raw} and is brought to ${limited} - the gap to the ` + `target is limited to ${MIN_OFFSET}...${MAX_OFFSET} px, so that the cursor crosses it within the ` + 'window the tooltip stays alive for.');
		}
		return limited;
	};
	const resolveTarget = (raw, fallback) => {
		if (main_core.Type.isUndefined(raw)) {
			if (fallback === null) {
				throw new TypeError(`${EVENT_NAMESPACE}: the "target" option is required and must be an element.`);
			}
			return fallback;
		}
		if (!main_core.Type.isElementNode(raw)) {
			throw new TypeError(`${EVENT_NAMESPACE}: the "target" option is required and must be an element.`);
		}
		return raw;
	};
	const resolveContent = (raw, fallback) => {
		if (main_core.Type.isUndefined(raw)) {
			if (fallback === null) {
				throw new TypeError(`${EVENT_NAMESPACE}: the "content" option is required and must be a string or an element.`);
			}
			return fallback;
		}
		if (!main_core.Type.isString(raw) && !main_core.Type.isElementNode(raw)) {
			throw new TypeError(`${EVENT_NAMESPACE}: the "content" option is required and must be a string or an element.`);
		}
		return raw;
	};
	const parseMarkup = (markup, ownerDocument) => {
		const template = ownerDocument.createElement('template');
		template.innerHTML = markup;
		return template.content;
	};
	const mergeOptions = (current, raw) => {
		return {
			target: resolveTarget(raw.target, current?.target ?? null),
			content: resolveContent(raw.content, current?.content ?? null),
			html: main_core.Type.isBoolean(raw.html) ? raw.html : current?.html ?? false,
			maxWidth: resolveMaxWidth(raw.maxWidth, current?.maxWidth ?? DEFAULT_MAX_WIDTH),
			position: isPosition(raw.position) ? raw.position : current?.position ?? DEFAULT_POSITION,
			offset: resolveOffset(raw.offset, current?.offset ?? DEFAULT_OFFSET),
			crossOffset: isFiniteNumber(raw.crossOffset) ? raw.crossOffset : current?.crossOffset ?? 0,
			trigger: resolveTrigger(raw.trigger, current?.trigger ?? [...DEFAULT_TRIGGER]),
			showDelay: resolveDelay(raw.showDelay, current?.showDelay ?? 0),
			hideDelay: resolveDelay(raw.hideDelay, current?.hideDelay ?? 0)
		};
	};
	class Tooltip extends main_core_events.EventEmitter {
		#options;
		#popover;
		#triggers = null;
		#bubble = null;
		#bubbleId = null;
		#destroyed = false;
		#swapping = false;
		constructor(options) {
			super();
			this.setEventNamespace(EVENT_NAMESPACE);
			if (!main_core.Type.isPlainObject(options)) {
				throw new TypeError(`${EVENT_NAMESPACE}: the options object is required.`);
			}
			this.#options = mergeOptions(null, options);
			this.#popover = this.#createPopover();
			if (options.events) {
				this.subscribeFromOptions(options.events);
			}
			this.#installTriggers(this.#buildTriggers());
		}
		show() {
			if (this.#destroyed) {
				console.warn(`${EVENT_NAMESPACE}: show() called on a destroyed instance.`);
				return;
			}
			this.#triggers?.settle(true);
			this.#popover.show();
		}
		hide() {
			this.#triggers?.settle(false);
			this.#popover.hide();
		}
		isShown() {
			return this.#popover.isShown();
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#triggers?.destroy();
			this.#triggers = null;
			this.#popover.destroy();
			this.#bubble = null;
			this.emit('onDestroy', {});
			this.unsubscribeAll();
		}
		getBubble() {
			return this.#bubble;
		}
		adjustPosition() {
			if (this.#destroyed) {
				console.warn(`${EVENT_NAMESPACE}: adjustPosition() called on a destroyed instance.`);
				return;
			}
			this.#popover.adjustPosition();
		}
		setOptions(options) {
			if (this.#destroyed) {
				console.warn(`${EVENT_NAMESPACE}: setOptions() called on a destroyed instance.`);
				return;
			}
			if (!main_core.Type.isPlainObject(options)) {
				return;
			}
			const previous = this.#options;
			this.#options = mergeOptions(previous, options);
			this.#applyChanges(previous);
		}
		#applyChanges(previous) {
			const options = this.#options;
			if (options.content !== previous.content || options.html !== previous.html) {
				this.#applyContent();
			}
			if (options.maxWidth !== previous.maxWidth) {
				this.#applyMaxWidth();
			}
			if (options.showDelay !== previous.showDelay || options.hideDelay !== previous.hideDelay) {
				this.#triggers?.setDelays(options.showDelay, options.hideDelay);
			}
			if (options.position !== previous.position || options.offset !== previous.offset || options.crossOffset !== previous.crossOffset) {
				this.#popover.setPositioning(this.#buildPositioning());
			}
			if (options.target !== previous.target) {
				this.#unlinkTarget(previous.target);
				if (options.target.ownerDocument === previous.target.ownerDocument) {
					this.#popover.setTarget(options.target);
				} else {
					this.#relocate();
				}
				if (this.isShown()) {
					this.#linkTarget();
				}
			}
			if (!sameTrigger(options.trigger, previous.trigger) || options.target !== previous.target) {
				this.#rebuildTriggers();
			}
		}
		#createPopover() {
			const target = this.#options.target;
			return new ui_system_popover.Popover({
				content: () => this.#ensureBubble(),
				target,
				container: target.ownerDocument.body,
				positioning: this.#buildPositioning(),
				closeByEsc: true,
				closeByClickOutside: false,
				events: {
					onShow: this.#handlePopoverShow,
					onHide: this.#handlePopoverHide
				}
			});
		}
		#relocate() {
			const shown = this.#popover.isShown();
			this.#swapping = true;
			try {
				this.#popover.destroy();
				this.#bubbleId = null;
				this.#popover = this.#createPopover();
				if (shown) {
					this.#popover.show();
				}
			} finally {
				this.#swapping = false;
			}
		}
		#buildTriggers(carried = NOTHING_CARRIED) {
			const options = this.#options;
			return new TriggerBinding(this, {
				target: options.target,
				trigger: options.trigger,
				showDelay: options.showDelay,
				hideDelay: options.hideDelay,
				bubble: this.#bubble,
				clickPinned: carried.clickPinned,
				heldByLayer: carried.heldByLayer
			});
		}
		#installTriggers(triggers) {
			this.#triggers = triggers;
			triggers.start();
		}
		#rebuildTriggers() {
			const previous = this.#triggers;
			const carried = {
				clickPinned: previous?.isClickPinned() === true,
				heldByLayer: previous?.isHolding() === true
			};
			this.#triggers = null;
			previous?.destroy();
			this.#installTriggers(this.#buildTriggers(carried));
		}
		#ensureBubble() {
			if (this.#bubble !== null) {
				return this.#bubble;
			}
			const bubble = main_core.Tag.render`<div class="${BUBBLE_CLASS}"></div>`;
			this.#bubble = bubble;
			this.#applyContent();
			this.#applyMaxWidth();
			this.#triggers?.setBubble(bubble);
			return bubble;
		}
		#applyContent() {
			const bubble = this.#bubble;
			if (bubble === null) {
				return;
			}
			const content = this.#options.content;
			if (!main_core.Type.isString(content)) {
				bubble.textContent = '';
				main_core.Dom.append(content, bubble);
				return;
			}
			if (this.#options.html) {
				bubble.textContent = '';
				bubble.append(parseMarkup(content, bubble.ownerDocument));
				return;
			}
			bubble.textContent = content;
		}
		#applyMaxWidth() {
			const bubble = this.#bubble;
			if (bubble === null) {
				return;
			}
			const maxWidth = this.#options.maxWidth;
			main_core.Dom.style(bubble, 'maxWidth', maxWidth === DEFAULT_MAX_WIDTH ? null : `${maxWidth}px`);
		}
		#buildPositioning() {
			return {
				position: this.#options.position,
				offset: {
					main: this.#options.offset,
					cross: this.#options.crossOffset
				},
				pointer: true,
				flip: {
					fallbacks: ['flip-position']
				},
				slide: true,
				constrainSize: true,
				tracking: 'observers',
				whenAnchorHidden: 'close'
			};
		}
		#linkTarget() {
			const bubble = this.#bubble;
			if (bubble === null) {
				return;
			}
			const target = this.#options.target;
			if (this.#bubbleId === null) {
				this.#bubbleId = generateBubbleId(target.ownerDocument);
			}
			main_core.Dom.attr(bubble, 'role', 'tooltip');
			main_core.Dom.attr(bubble, 'id', this.#bubbleId);
			const tokens = describedByTokens(target);
			if (!tokens.includes(this.#bubbleId)) {
				tokens.push(this.#bubbleId);
			}
			writeDescribedBy(target, tokens);
		}
		#unlinkTarget(target) {
			const id = this.#bubbleId;
			if (id === null) {
				return;
			}
			writeDescribedBy(target, describedByTokens(target).filter(token => token !== id));
		}
		#handlePopoverShow = () => {
			if (this.#swapping) {
				return;
			}
			this.#linkTarget();
			this.emit('onShow', {});
		};
		#handlePopoverHide = () => {
			if (this.#swapping) {
				return;
			}
			this.#unlinkTarget(this.#options.target);
			this.#triggers?.settle(false);
			this.emit('onHide', {});
		};
	}

	const LABEL = 'BX.UI.System.Tooltip';
	const TEXT_ATTRIBUTE = 'data-ui-tooltip';
	const TRIGGER_ATTRIBUTE = 'data-ui-tooltip-trigger';
	const TRIGGER_SEPARATOR = ',';
	const MARKUP_TRIGGERS = [TooltipTrigger.Hover, TooltipTrigger.Click, TooltipTrigger.Focus];
	const isMarkupPosition = value => {
		return Object.values(TooltipPosition).includes(value);
	};
	const isMarkupTrigger = value => {
		return MARKUP_TRIGGERS.includes(value);
	};
	const readTrigger = raw => {
		return (raw ?? '').split(TRIGGER_SEPARATOR).map(mode => mode.trim()).filter(mode => isMarkupTrigger(mode));
	};
	const REASONS = [{
		mode: TooltipTrigger.Hover,
		state: ':hover',
		gesture: 'pointerover'
	}, {
		mode: TooltipTrigger.Focus,
		state: ':focus-visible',
		gesture: 'focusin'
	}];
	const RAISING_GESTURES = [...REASONS.map(({
		mode,
		gesture
	}) => ({
		mode,
		gesture
	})), {
		mode: TooltipTrigger.Click,
		gesture: 'click'
	}];
	const askedModes = element => {
		const trigger = readTrigger(element.dataset.uiTooltipTrigger);
		return trigger.length > 0 ? trigger : [...DEFAULT_TRIGGER];
	};
	const raisesInstance = (element, event) => {
		const asked = askedModes(element);
		return RAISING_GESTURES.some(({
			mode,
			gesture
		}) => gesture === event.type && asked.includes(mode));
	};
	const standingReasons = element => {
		const asked = askedModes(element);
		return new Set(REASONS.filter(reason => asked.includes(reason.mode) && element.matches(reason.state)));
	};
	const raisedFromOutside = (reason, event, element) => {
		if (event.type !== reason.gesture) {
			return false;
		}
		const from = event.relatedTarget;
		return !main_core.Type.isDomNode(from) || !element.contains(from);
	};
	const readOptions = element => {
		const data = element.dataset;
		const trigger = readTrigger(data.uiTooltipTrigger);
		return {
			target: element,
			content: data.uiTooltip ?? '',
			position: isMarkupPosition(data.uiTooltipPosition) ? data.uiTooltipPosition : DEFAULT_POSITION,
			trigger: trigger.length > 0 ? trigger : [...DEFAULT_TRIGGER]
		};
	};
	const readMarkup = element => {
		const data = element.dataset;
		return {
			content: data.uiTooltip,
			position: data.uiTooltipPosition,
			trigger: data.uiTooltipTrigger
		};
	};
	const sameMarkup = (one, other) => {
		return other !== undefined && one.content === other.content && one.position === other.position && one.trigger === other.trigger;
	};
	class Manager {
		#instances = new WeakMap();
		#held = new WeakMap();
		#warned = new WeakSet();
		#markup = new WeakMap();
		constructor(watched = document) {
			main_core.Event.bind(watched, 'pointerover', this.#handleGesture, {
				passive: true
			});
			main_core.Event.bind(watched, 'focusin', this.#handleGesture, {
				passive: true
			});
			main_core.Event.bind(watched, 'click', this.#handleGesture, {
				capture: true,
				passive: true
			});
		}
		#handleGesture = event => {
			const source = event.target;
			if (!main_core.Type.isElementNode(source)) {
				return;
			}
			const element = source.closest(`[${TEXT_ATTRIBUTE}]`);
			if (element === null) {
				return;
			}
			const standing = this.#instances.get(element);
			if (standing !== undefined) {
				this.#refresh(element, standing);
				if (this.#instances.has(element)) {
					return;
				}
			}
			if (!raisesInstance(element, event)) {
				return;
			}
			if (!this.#freeOfHold(element, event)) {
				return;
			}
			if (!main_core.Type.isStringFilled(element.dataset.uiTooltip)) {
				return;
			}
			this.#raise(element, event);
		};
		#refresh(element, instance) {
			const markup = readMarkup(element);
			if (sameMarkup(markup, this.#markup.get(element))) {
				return;
			}
			this.#markup.set(element, markup);
			if (!main_core.Type.isStringFilled(markup.content)) {
				this.#instances.delete(element);
				instance.destroy();
				return;
			}
			instance.setOptions(readOptions(element));
		}
		#freeOfHold(element, event) {
			const held = this.#held.get(element);
			if (held === undefined) {
				return true;
			}
			[...held].forEach(reason => {
				if (!element.matches(reason.state) || raisedFromOutside(reason, event, element)) {
					held.delete(reason);
				}
			});
			const blocked = held.size > 0 && REASONS.some(reason => reason.gesture === event.type);
			if (held.size === 0) {
				this.#held.delete(element);
			}
			return !blocked;
		}
		#raise(element, gesture) {
			this.#warnOutOfTabOrder(element);
			this.#markup.set(element, readMarkup(element));
			buildingFrom(gesture, () => {
				const instance = new Tooltip({
					...readOptions(element),
					events: {
						onHide: () => this.#drop(element)
					}
				});
				this.#instances.set(element, instance);
			});
		}
		#warnOutOfTabOrder(element) {
			if (element.tabIndex >= 0 || element.hasAttribute('tabindex') || this.#warned.has(element)) {
				return;
			}
			if (!readTrigger(element.dataset.uiTooltipTrigger).includes(TooltipTrigger.Focus)) {
				return;
			}
			this.#warned.add(element);
			console.warn(`${LABEL}: the element below asks for the "${TooltipTrigger.Focus}" trigger of ${TRIGGER_ATTRIBUTE} ` + 'and lies outside the tab order, so the tooltip never reaches a user of the keyboard. Mark the ' + 'focusable element itself, or give this one a tabindex.', element);
		}
		#drop(element) {
			const instance = this.#instances.get(element);
			if (instance === undefined) {
				return;
			}
			this.#instances.delete(element);
			const standing = standingReasons(element);
			if (standing.size > 0) {
				this.#held.set(element, standing);
			}
			instance.destroy();
		}
	}
	const TooltipManager = new Manager();

	exports.DEFAULT_MAX_WIDTH = DEFAULT_MAX_WIDTH;
	exports.Tooltip = Tooltip;
	exports.TooltipManager = TooltipManager;
	exports.TooltipPosition = TooltipPosition;
	exports.TooltipTrigger = TooltipTrigger;

})(this.BX.UI.System.Tooltip = this.BX.UI.System.Tooltip || {}, BX, BX.Event, BX.UI.System.Popover);
//# sourceMappingURL=tooltip.bundle.js.map
