/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
(function (exports, main_core, main_core_events, ui_buttons, ui_iconSet_api_core, ui_system_popover, ui_system_typography) {
	'use strict';

	const DEFAULT_WIDTH = 400;
	const POPOVER_CLASS = 'ui-system-callout-popover';
	const MIN_WIDTH = 260;
	const DEFAULT_POSITIONING = Object.freeze({
		position: ui_system_popover.PopoverPosition.Bottom,
		alignment: ui_system_popover.PopoverAlignment.Center,
		pointer: true,
		slide: true,
		constrainSize: true,
		boundaryPadding: 8,
		whenAnchorHidden: 'close'
	});
	const DEFAULT_DESIGN_CONTEXT = ui_system_popover.PopoverDesignContext.ContentDark;

	const NAMESPACE = 'BX.UI.System.Callout';
	const FOCUSABLE_SELECTOR = ['button', 'a[href]', 'area[href]', 'input:not([type="hidden" i])', 'select', 'textarea', 'summary', 'iframe', 'object', 'embed', 'audio[controls]', 'video[controls]', '[tabindex]', '[contenteditable]:not([contenteditable="false" i])'].join(',');
	const UNREACHABLE_SELECTOR = '[hidden], [hidden] *, [inert], [inert] *';
	const POSITIONING_KEYS = ['position', 'alignment', 'offset', 'flip', 'slide', 'stretch', 'constrainSize', 'pointer', 'onAxisFlip', 'boundary', 'boundaryPadding', 'whenAnchorHidden', 'strategy', 'tracking'];
	const ANCHOR_ONLY_KEYS = new Set(['flip', 'slide', 'stretch', 'pointer', 'onAxisFlip', 'whenAnchorHidden', 'tracking']);
	const CAPTURE_PASSIVE = {
		capture: true,
		passive: true
	};
	const FOOTER_REGIONS = ['buttons', 'footer', 'footerLeft'];
	const SUPPRESSED_CLASS = '--suppressed';
	const sameRegions = (left, right) => {
		return left.size === right.size && [...left].every(region => right.has(region));
	};
	const nothingTouched = () => ({
		closeByClickOutside: false,
		closeByEsc: false,
		designContext: false,
		positioning: false,
		target: false
	});
	let instanceCounter = 0;
	const roleKeyOf = element => {
		const explicit = element.getAttribute('role');
		if (explicit !== null) {
			return explicit;
		}
		const {
			localName
		} = element;
		return localName === 'input' ? `${localName}:${element.type}` : localName;
	};
	const focusableOf = container => [...container.querySelectorAll(FOCUSABLE_SELECTOR)];
	const isRendered = element => {
		return main_core.Type.isFunction(element.checkVisibility) ? element.checkVisibility() : element.getClientRects().length > 0;
	};
	const cssAppliesTo = card => card.isConnected && isRendered(card);
	const holdsFocusableContent = (container, cssApplies) => {
		return focusableOf(container).some(element => {
			return !element.matches(UNREACHABLE_SELECTOR) && (!cssApplies || isRendered(element));
		});
	};
	const holdsFocus = (element, visibilityApplies = true) => {
		if (element === null || !element.isConnected) {
			return false;
		}
		if (element.matches(':disabled') || element.matches(UNREACHABLE_SELECTOR) || !isRendered(element)) {
			return false;
		}
		if (visibilityApplies && !isVisibleForFocus(element, false)) {
			return false;
		}
		return element.matches(FOCUSABLE_SELECTOR) || element.hasAttribute('tabindex');
	};
	const canRestoreFocus = element => {
		if (element === null || !main_core.Type.isFunction(element.focus)) {
			return false;
		}
		return holdsFocus(element) && isVisibleForFocus(element);
	};
	const isVisibleForFocus = (element, withOpacity = true) => {
		if (main_core.Type.isFunction(element.checkVisibility)) {
			return element.checkVisibility({
				visibilityProperty: true,
				opacityProperty: withOpacity
			});
		}
		const view = element.ownerDocument.defaultView;
		const visibility = view === null ? 'visible' : view.getComputedStyle(element).visibility;
		return isRendered(element) && visibility === 'visible';
	};
	const describedByTokens = element => {
		return (element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(token => token !== '');
	};
	const addDescribedBy = (element, token) => {
		const tokens = describedByTokens(element);
		if (tokens.includes(token)) {
			return;
		}
		tokens.push(token);
		main_core.Dom.attr(element, 'aria-describedby', tokens.join(' '));
	};
	const removeDescribedBy = (element, token) => {
		if (!element.hasAttribute('aria-describedby')) {
			return;
		}
		const tokens = describedByTokens(element).filter(value => value !== token);
		main_core.Dom.attr(element, 'aria-describedby', tokens.length === 0 ? null : tokens.join(' '));
	};
	const isValidTarget = target => {
		if (target === 'area') {
			return true;
		}
		if (main_core.Type.isElementNode(target)) {
			return true;
		}
		if (!main_core.Type.isObjectLike(target)) {
			return false;
		}
		return main_core.Type.isFunction(target.getBoundingClientRect) || main_core.Type.isNumber(target.x) && main_core.Type.isNumber(target.y);
	};
	const contextElementOf = target => {
		const context = target.contextElement;
		return main_core.Type.isElementNode(context) ? context : null;
	};
	const resolveNode = value => {
		if (value === null) {
			return null;
		}
		const node = main_core.Type.isFunction(value) ? value() : value;
		if (!main_core.Type.isElementNode(node)) {
			console.warn(`${NAMESPACE}: the content of a region must be an element or a factory returning one.`);
			return null;
		}
		return node;
	};
	const appendContent = node => {
		if (node === null) {
			return null;
		}
		return owned => {
			main_core.Dom.append(node, owned);
		};
	};
	const filledText = value => {
		return main_core.Type.isString(value) && value.trim() !== '' ? value : null;
	};
	const holdsForeignContent = (container, owned) => {
		for (let child = container.firstChild; child !== null; child = child.nextSibling) {
			if (main_core.Type.isElementNode(child)) {
				if (child !== owned) {
					return true;
				}
			} else if (main_core.Type.isTextNode(child) && (child.textContent ?? '').trim() !== '') {
				return true;
			}
		}
		return false;
	};
	const AIR_STYLES = new Set(Object.values(ui_buttons.AirButtonStyle));
	const DESIGN_PREFIX = 'design-';
	const airStyleOf = design => {
		if (design === null || !design.startsWith(DESIGN_PREFIX)) {
			return ui_buttons.AirButtonStyle.PLAIN;
		}
		const style = `--style-${design.slice(DESIGN_PREFIX.length)}`;
		return AIR_STYLES.has(style) ? style : ui_buttons.AirButtonStyle.PLAIN;
	};
	const sameButtonMarkup = (left, right) => {
		return left.text === right.text && left.ariaLabel === right.ariaLabel && left.design === right.design && left.iconLeft === right.iconLeft && left.iconRight === right.iconRight && left.events?.click === right.events?.click;
	};
	const applyButtonState = (button, item) => {
		const waiting = item.loading === true;
		if (button.isWaiting() !== waiting) {
			button.setWaiting(waiting);
		}
		const disabled = !waiting && item.disabled === true;
		if (button.isDisabled() !== disabled) {
			button.setDisabled(disabled);
		}
	};
	class Callout {
		#state = 'idle';
		#target;
		#requestedPositioning;
		#title;
		#description;
		#leftSlot;
		#buttons;
		#footer;
		#footerLeft;
		#requestedShowClose;
		#width;
		#ariaLabel;
		#requestedMode;
		#effectiveMode;
		#container;
		#designContext;
		#closeByClickOutside;
		#closeByEsc;
		#autoFocus;
		#cardId;
		#card = null;
		#body = null;
		#titleNode = null;
		#closeButton = null;
		#regions = new Map();
		#renderedButtons = [];
		#pending = new Set();
		#foreignFooter = new Set();
		#popover = null;
		#substrateArea = false;
		#pendingSubstrate = nothingTouched();
		#listeners = new Map();
		#autoFocusPending = false;
		#modeDecidedUnrendered = false;
		#focusInside = false;
		#outsideGesture = false;
		#resetTimer = null;
		#generation = 0;
		#lastFocus = null;
		#focusedElement = null;
		#boundDocument = null;
		#hideReason = null;
		#anchorCloseArmed = false;
		#deferredHide = false;
		#deferredDestroy = false;
		#tearingDown = false;
		#forcedModeReason = null;
		#namelessWarned = false;
		#clampedWidth = null;
		constructor(options = {}) {
			const source = main_core.Type.isPlainObject(options) ? options : {};
			instanceCounter += 1;
			this.#cardId = `ui-system-callout-${instanceCounter}`;
			this.#target = this.#resolveTarget(source.target);
			this.#requestedPositioning = this.#normalizePositioning(source.positioning);
			this.#title = filledText(source.title);
			this.#description = source.description ?? null;
			this.#leftSlot = source.leftSlot ?? null;
			this.#buttons = main_core.Type.isArray(source.buttons) ? [...source.buttons] : [];
			this.#footer = source.footer ?? null;
			this.#footerLeft = source.footerLeft ?? null;
			this.#requestedShowClose = main_core.Type.isBoolean(source.showClose) ? source.showClose : null;
			this.#width = this.#normalizeWidth(source.width ?? DEFAULT_WIDTH);
			this.#ariaLabel = filledText(source.ariaLabel);
			this.#requestedMode = source.mode === 'passive' ? 'passive' : 'interactive';
			this.#effectiveMode = this.#requestedMode;
			this.#container = main_core.Type.isElementNode(source.container) ? source.container : null;
			this.#designContext = source.designContext ?? DEFAULT_DESIGN_CONTEXT;
			this.#closeByClickOutside = source.closeByClickOutside !== false;
			this.#closeByEsc = source.closeByEsc !== false;
			this.#autoFocus = source.autoFocus === true;
			this.#subscribeFromOptions(source);
		}
		show() {
			if (this.#state === 'destroyed' || this.#state === 'destroying') {
				console.warn(`${NAMESPACE}: show() called on a destroyed instance.`);
				return;
			}
			if (this.#state === 'hiding') {
				console.warn(`${NAMESPACE}: show() called while the card is hiding - the command is ignored.`);
				return;
			}
			if (this.#state !== 'idle' || this.#target === null) {
				return;
			}
			this.#state = 'showing';
			this.#hideReason = null;
			this.#anchorCloseArmed = false;
			this.#autoFocusPending = this.#autoFocus;
			try {
				const card = this.#ensureCard();
				this.#modeDecidedUnrendered = !cssAppliesTo(card);
				this.#commit({});
				this.#ensurePopover().show();
				this.#state = 'shown';
				this.#emit('onShow');
			} finally {
				if (this.#state === 'showing') {
					this.#state = 'idle';
				}
				this.#modeDecidedUnrendered = false;
				this.#runDeferred();
			}
		}
		hide() {
			if (this.#state === 'destroyed') {
				console.warn(`${NAMESPACE}: hide() called on a destroyed instance.`);
				return;
			}
			if (this.#state === 'showing') {
				this.#deferredHide = true;
				return;
			}
			if (this.#state !== 'shown') {
				return;
			}
			this.#hideProgrammatically();
		}
		destroy() {
			if (this.#state === 'destroyed') {
				console.warn(`${NAMESPACE}: destroy() called on a destroyed instance.`);
				return;
			}
			if (this.#state === 'destroying') {
				return;
			}
			if (this.#state === 'showing' || this.#state === 'hiding') {
				this.#deferredDestroy = true;
				return;
			}
			this.#teardown();
		}
		isShown() {
			return this.#state === 'shown';
		}
		adjustPosition() {
			if (this.#state === 'destroyed') {
				console.warn(`${NAMESPACE}: adjustPosition() called on a destroyed instance.`);
				return;
			}
			if (this.#state !== 'shown') {
				return;
			}
			this.#popover?.adjustPosition();
		}
		getCard() {
			if (this.#state === 'destroyed' || this.#state === 'destroying') {
				console.warn(`${NAMESPACE}: getCard() called on a destroyed instance.`);
				return null;
			}
			return this.#ensureCard();
		}
		refreshAccessibilityMode() {
			if (this.#state === 'destroyed' || this.#state === 'destroying') {
				console.warn(`${NAMESPACE}: refreshAccessibilityMode() called on a destroyed instance.`);
				return;
			}
			if (this.#state === 'hiding') {
				return;
			}
			this.#commit({});
		}
		applyOptions(partial) {
			if (this.#state === 'destroyed' || this.#state === 'destroying') {
				console.warn(`${NAMESPACE}: applyOptions() called on a destroyed instance.`);
				return;
			}
			if (!main_core.Type.isPlainObject(partial)) {
				return;
			}
			this.#commit(partial);
		}
		setTitle(title) {
			this.applyOptions({
				title
			});
		}
		setDescription(description) {
			this.applyOptions({
				description
			});
		}
		setLeftSlot(leftSlot) {
			this.applyOptions({
				leftSlot
			});
		}
		setFooter(footer) {
			this.applyOptions({
				footer
			});
		}
		setFooterLeft(footerLeft) {
			this.applyOptions({
				footerLeft
			});
		}
		setButtons(buttons) {
			this.applyOptions({
				buttons
			});
		}
		setShowClose(showClose) {
			this.applyOptions({
				showClose
			});
		}
		setWidth(width) {
			this.applyOptions({
				width
			});
		}
		setTarget(target) {
			this.applyOptions({
				target
			});
		}
		setPositioning(positioning) {
			this.applyOptions({
				positioning
			});
		}
		setDesignContext(designContext) {
			this.applyOptions({
				designContext
			});
		}
		setCloseByClickOutside(closeByClickOutside) {
			this.applyOptions({
				closeByClickOutside
			});
		}
		setCloseByEsc(closeByEsc) {
			this.applyOptions({
				closeByEsc
			});
		}
		setAriaLabel(ariaLabel) {
			this.applyOptions({
				ariaLabel
			});
		}
		setMode(mode) {
			this.applyOptions({
				mode
			});
		}
		#commit(partial) {
			const previousAnchor = this.#accessibleAnchor();
			const previousMode = this.#effectiveMode;
			this.#writeOptions(partial);
			if (this.#state === 'hiding') {
				return;
			}
			const focusReplaced = this.#renderPending();
			this.#recomputeEffectiveMode();
			this.#commitAccessibility(previousAnchor, focusReplaced);
			const touched = this.#pendingSubstrate;
			this.#pendingSubstrate = nothingTouched();
			this.#commitSubstrate(touched, previousMode !== this.#effectiveMode);
		}
		#writeOptions(partial) {
			this.#writeContent(partial);
			this.#writeState(partial);
		}
		#writeContent(partial) {
			const has = key => Object.hasOwn(partial, key);
			if (has('title')) {
				this.#title = filledText(partial.title);
				this.#pending.add('title');
			}
			if (has('description')) {
				this.#description = partial.description ?? null;
				this.#pending.add('description');
			}
			if (has('leftSlot')) {
				this.#leftSlot = partial.leftSlot ?? null;
				this.#pending.add('leftSlot');
			}
			if (has('footer')) {
				this.#footer = partial.footer ?? null;
				this.#pending.add('footer');
			}
			if (has('footerLeft')) {
				this.#footerLeft = partial.footerLeft ?? null;
				this.#pending.add('footerLeft');
			}
			if (has('buttons')) {
				this.#buttons = main_core.Type.isArray(partial.buttons) ? [...partial.buttons] : [];
				this.#pending.add('buttons');
			}
			if (has('width')) {
				this.#width = this.#normalizeWidth(partial.width);
				this.#pending.add('width');
			}
		}
		#writeState(partial) {
			const touched = this.#pendingSubstrate;
			const has = key => Object.hasOwn(partial, key);
			if (has('showClose')) {
				this.#requestedShowClose = main_core.Type.isBoolean(partial.showClose) ? partial.showClose : null;
			}
			if (has('ariaLabel')) {
				this.#ariaLabel = filledText(partial.ariaLabel);
			}
			if (has('mode')) {
				this.#requestedMode = partial.mode === 'passive' ? 'passive' : 'interactive';
			}
			if (has('positioning')) {
				this.#requestedPositioning = this.#normalizePositioning(partial.positioning);
				touched.positioning = true;
			}
			if (has('designContext')) {
				this.#designContext = partial.designContext ?? DEFAULT_DESIGN_CONTEXT;
				touched.designContext = true;
			}
			if (has('closeByClickOutside')) {
				this.#closeByClickOutside = partial.closeByClickOutside !== false;
				touched.closeByClickOutside = true;
			}
			if (has('closeByEsc')) {
				this.#closeByEsc = partial.closeByEsc !== false;
				touched.closeByEsc = true;
			}
			if (has('target')) {
				this.#target = this.#resolveTarget(partial.target);
				touched.target = true;
			}
		}
		#renderPending() {
			const card = this.#card;
			if (card === null) {
				return false;
			}
			let focusReplaced = false;
			if (this.#pending.has('title')) {
				this.#renderTitle();
			}
			if (this.#pending.has('width')) {
				main_core.Dom.style(card, 'width', `${this.#width}px`);
			}
			if (this.#pending.has('description')) {
				focusReplaced = this.#renderRegion('description', appendContent(this.#descriptionContent())) || focusReplaced;
			}
			if (this.#pending.has('leftSlot')) {
				focusReplaced = this.#renderRegion('leftSlot', appendContent(resolveNode(this.#leftSlot))) || focusReplaced;
			}
			const foreign = this.#readForeignFooter();
			if (FOOTER_REGIONS.some(region => this.#pending.has(region)) || !sameRegions(foreign, this.#foreignFooter)) {
				focusReplaced = this.#renderFooter(foreign) || focusReplaced;
			}
			this.#pending.clear();
			return focusReplaced;
		}
		#renderTitle() {
			if (this.#titleNode !== null) {
				main_core.Dom.remove(this.#titleNode);
				this.#titleNode = null;
			}
			if (this.#title === null) {
				return;
			}
			const node = ui_system_typography.Headline.render(this.#title, {
				size: 'sm',
				className: 'ui-system-callout__title'
			});
			main_core.Dom.attr(node, 'id', this.#titleId());
			this.#titleNode = node;
			main_core.Dom.prepend(node, this.#body);
		}
		#renderRegion(region, fill) {
			const nodes = this.#regions.get(region);
			if (nodes === undefined) {
				return false;
			}
			const focusReplaced = nodes.owned !== null && this.#containsFocus(nodes.owned);
			if (nodes.owned !== null) {
				main_core.Dom.remove(nodes.owned);
				nodes.owned = null;
			}
			if (fill !== null) {
				const owned = main_core.Tag.render`<div class="ui-system-callout__owned"></div>`;
				fill(owned);
				nodes.owned = owned;
				main_core.Dom.append(owned, nodes.container);
			}
			return focusReplaced;
		}
		#renderFooter(foreign) {
			this.#foreignFooter = foreign;
			const withButtons = this.#buttons.length > 0;
			const withFooter = !withButtons && (this.#footer !== null || foreign.has('footer'));
			const replaced = [this.#renderButtonsRegion(withButtons), this.#renderRegion('footer', withFooter ? appendContent(resolveNode(this.#footer)) : null), this.#renderRegion('footerLeft', withFooter ? null : appendContent(resolveNode(this.#footerLeft))),
			this.#suppressRegion('footer', withButtons), this.#suppressRegion('footerLeft', withFooter)];
			return replaced.includes(true);
		}
		#readForeignFooter() {
			const filled = FOOTER_REGIONS.filter(region => {
				const nodes = this.#regions.get(region);
				return nodes !== undefined && holdsForeignContent(nodes.container, nodes.owned);
			});
			return new Set(filled);
		}
		#suppressRegion(region, suppressed) {
			const nodes = this.#regions.get(region);
			if (nodes === undefined || main_core.Dom.hasClass(nodes.container, SUPPRESSED_CLASS) === suppressed) {
				return false;
			}
			const focusLost = suppressed && this.#containsFocus(nodes.container);
			if (suppressed) {
				main_core.Dom.addClass(nodes.container, SUPPRESSED_CLASS);
			} else {
				main_core.Dom.removeClass(nodes.container, SUPPRESSED_CLASS);
			}
			return focusLost;
		}
		#renderButtonsRegion(withButtons) {
			if (withButtons && this.#applyButtonStates()) {
				return false;
			}
			this.#renderedButtons = [];
			return this.#renderRegion('buttons', withButtons ? owned => this.#renderButtons(owned) : null);
		}
		#applyButtonStates() {
			const rendered = this.#renderedButtons;
			const nodes = this.#regions.get('buttons');
			if (nodes === undefined || nodes.owned === null || rendered.length !== this.#buttons.length) {
				return false;
			}
			if (!this.#buttons.every((item, index) => sameButtonMarkup(item, rendered[index].item))) {
				return false;
			}
			this.#buttons.forEach((item, index) => {
				applyButtonState(rendered[index].instance, item);
				rendered[index].item = {
					...item
				};
			});
			return true;
		}
		#renderButtons(owned) {
			this.#renderedButtons = this.#buttons.map(item => {
				const instance = this.#createButton(item);
				instance.renderTo(owned);
				return {
					instance,
					item: {
						...item
					}
				};
			});
		}
		#createButton(item) {
			const {
				ariaLabel,
				design,
				events,
				iconLeft,
				iconRight,
				text
			} = item;
			const left = filledText(iconLeft);
			const icon = left ?? filledText(iconRight);
			const label = filledText(text);
			const name = filledText(ariaLabel);
			const options = {
				text: label ?? '',
				useAirDesign: true,
				size: ui_buttons.ButtonSize.MEDIUM,
				style: airStyleOf(filledText(design)),
				collapsedIcon: ''
			};
			if (icon !== null) {
				options.icon = icon;
				options.iconPosition = left === null ? 'right' : 'left';
			}
			const button = new ui_buttons.Button(options);
			if (name !== null) {
				main_core.Dom.attr(button.getContainer(), 'aria-label', name);
			} else if (label === null) {
				console.warn(`${NAMESPACE}: a button carrying neither text nor an ariaLabel reaches assistive technology ` + 'unnamed - its icon is decorative. Give it one of the two.');
			}
			const onClick = events?.click;
			if (main_core.Type.isFunction(onClick)) {
				main_core.Event.bind(button.getContainer(), 'click', event => onClick(button, event));
			}
			applyButtonState(button, item);
			return button;
		}
		#descriptionContent() {
			return main_core.Type.isString(this.#description) ? ui_system_typography.Text.render(this.#description, {
				size: 'sm',
				className: 'ui-system-callout__text'
			}) : resolveNode(this.#description);
		}
		#containsFocus(node) {
			const active = this.#card?.ownerDocument.activeElement ?? null;
			return active !== null && node.contains(active);
		}
		#recomputeEffectiveMode() {
			const reason = this.#requestedMode === 'passive' ? this.#interactiveFactor() : null;
			this.#reportForcedMode(reason);
			this.#effectiveMode = this.#requestedMode === 'interactive' || reason !== null ? 'interactive' : 'passive';
		}
		#reportForcedMode(reason) {
			if (this.#modeDecidedUnrendered) {
				return;
			}
			if (reason !== null && reason !== this.#forcedModeReason) {
				console.warn(`${NAMESPACE}: the passive mode was requested, but ${reason} - the card stays interactive ` + '(role="dialog"). Remove the factor or request the interactive mode explicitly.');
			}
			this.#forcedModeReason = reason;
		}
		#recomputeMountedMode() {
			if (!this.#modeDecidedUnrendered) {
				return;
			}
			this.#modeDecidedUnrendered = false;
			this.#commit({});
		}
		#interactiveFactor() {
			if (this.#buttons.length > 0) {
				return 'the card carries buttons';
			}
			if (this.#requestedShowClose === true) {
				return 'the close button is switched on explicitly';
			}
			const target = this.#target;
			if (target === 'area') {
				return 'the card stands against an area, where there is no anchor to carry the description at all';
			}
			if (target !== null && !main_core.Type.isElementNode(target) && contextElementOf(target) === null) {
				return 'the target is a point or a rect without contextElement, which nothing can be described by';
			}
			const anchor = this.#accessibleAnchor();
			if (anchor !== null && anchor.ownerDocument !== this.#ownerDocument()) {
				return 'the anchor belongs to another document, where an aria-describedby reference does not reach';
			}
			if (this.#hasFocusableContent()) {
				return 'the content carries focusable elements';
			}
			return null;
		}
		#hasFocusableContent() {
			const card = this.#card;
			if (card === null) {
				return false;
			}
			const cssApplies = cssAppliesTo(card);
			const scanned = ['description', 'leftSlot', 'footer', 'footerLeft'];
			return scanned.some(region => {
				const nodes = this.#regions.get(region);
				return nodes !== undefined && !main_core.Dom.hasClass(nodes.container, SUPPRESSED_CLASS) && holdsFocusableContent(nodes.container, cssApplies);
			});
		}
		#commitAccessibility(previousAnchor, focusReplaced) {
			if (this.#card === null) {
				return;
			}
			this.#applyCardAria();
			this.#applyCloseButton();
			const visible = this.#state === 'shown' || this.#state === 'showing';
			const hides = visible && this.#target === null;
			this.#syncDescribedBy(previousAnchor, visible && !hides && this.#effectiveMode === 'passive');
			if (this.#state !== 'shown') {
				return;
			}
			if (hides || this.#effectiveMode === 'passive') {
				this.#autoFocusPending = false;
				this.#resolveCloseFocus(previousAnchor);
				return;
			}
			this.#enterShownInteractive();
			if (focusReplaced || this.#focusDropped()) {
				this.#restoreRegionFocus();
			}
		}
		#focusDropped() {
			const boundDocument = this.#boundDocument;
			const element = this.#focusedElement;
			if (!this.#focusInside || boundDocument === null || element === null) {
				return false;
			}
			const visibilityApplies = this.#card !== null && isVisibleForFocus(this.#card, false);
			if (holdsFocus(element, visibilityApplies)) {
				return false;
			}
			const active = boundDocument.activeElement;
			return !this.#isInsideCard(active) || !holdsFocus(active, visibilityApplies);
		}
		#enterShownInteractive() {
			if (this.#effectiveMode !== 'interactive' || this.#card === null) {
				return;
			}
			this.#bind();
		}
		#bind() {
			const card = this.#card;
			if (card === null || this.#boundDocument !== null) {
				return;
			}
			const boundDocument = card.ownerDocument;
			this.#boundDocument = boundDocument;
			this.#focusInside = card.contains(boundDocument.activeElement);
			this.#lastFocus = this.#focusInside ? this.#snapshotFocus(boundDocument.activeElement) : null;
			this.#focusedElement = this.#focusInside ? boundDocument.activeElement : null;
			main_core.Event.bind(card, 'focusin', this.#handleFocusIn);
			main_core.Event.bind(card, 'focusout', this.#handleFocusOut);
			main_core.Event.bind(boundDocument, 'pointerdown', this.#handlePointerDown, CAPTURE_PASSIVE);
			main_core.Event.bind(boundDocument, 'pointerup', this.#handleGestureEnd, CAPTURE_PASSIVE);
			main_core.Event.bind(boundDocument, 'pointercancel', this.#handleGestureEnd, CAPTURE_PASSIVE);
		}
		#unbind() {
			const card = this.#card;
			const boundDocument = this.#boundDocument;
			if (card !== null && boundDocument !== null) {
				main_core.Event.unbind(card, 'focusin', this.#handleFocusIn);
				main_core.Event.unbind(card, 'focusout', this.#handleFocusOut);
				main_core.Event.unbind(boundDocument, 'pointerdown', this.#handlePointerDown, CAPTURE_PASSIVE);
				main_core.Event.unbind(boundDocument, 'pointerup', this.#handleGestureEnd, CAPTURE_PASSIVE);
				main_core.Event.unbind(boundDocument, 'pointercancel', this.#handleGestureEnd, CAPTURE_PASSIVE);
			}
			if (this.#resetTimer !== null) {
				clearTimeout(this.#resetTimer);
				this.#resetTimer = null;
			}
			this.#generation += 1;
			this.#focusInside = false;
			this.#outsideGesture = false;
			this.#lastFocus = null;
			this.#focusedElement = null;
			this.#boundDocument = null;
		}
		#snapshotFocus(element) {
			if (element === null) {
				return null;
			}
			const entry = this.#regionEntries().find(([, container]) => container.contains(element));
			if (entry === undefined) {
				return null;
			}
			return {
				region: entry[0],
				index: focusableOf(entry[1]).indexOf(element),
				roleKey: roleKeyOf(element)
			};
		}
		#resolveCloseFocus(anchor, forceDiscard = false) {
			const boundDocument = this.#boundDocument;
			if (boundDocument === null) {
				return;
			}
			const restored = !forceDiscard && this.#focusInside && !this.#outsideGesture && canRestoreFocus(anchor);
			if (restored && anchor !== null) {
				anchor.focus();
			} else {
				const active = boundDocument.activeElement;
				if (this.#isInsideCard(active) && main_core.Type.isFunction(active.blur)) {
					active.blur();
				}
			}
			this.#unbind();
		}
		#restoreRegionFocus() {
			const card = this.#card;
			const lastFocus = this.#lastFocus;
			if (card === null) {
				return;
			}
			if (!this.#focusInside || lastFocus === null) {
				card.focus();
				return;
			}
			const entry = this.#regionEntries().find(([region]) => region === lastFocus.region);
			const candidate = entry === undefined ? null : focusableOf(entry[1])[lastFocus.index] ?? null;
			if (candidate !== null && roleKeyOf(candidate) === lastFocus.roleKey && canRestoreFocus(candidate)) {
				candidate.focus();
			} else {
				card.focus();
			}
			this.#focusInside = true;
		}
		#isInsideCard(node) {
			return this.#card !== null && main_core.Type.isDomNode(node) && this.#card.contains(node);
		}
		#handleFocusIn = event => {
			const target = main_core.Type.isElementNode(event.target) ? event.target : null;
			this.#focusInside = true;
			this.#lastFocus = this.#snapshotFocus(target);
			this.#focusedElement = target;
		};
		#handleFocusOut = event => {
			if (main_core.Type.isDomNode(event.relatedTarget) && !this.#isInsideCard(event.relatedTarget)) {
				this.#focusInside = false;
			}
		};
		#handlePointerDown = event => {
			this.#outsideGesture = !this.#isInsideCard(event.target);
		};
		#handleGestureEnd = () => {
			const cycle = this.#generation;
			this.#resetTimer = setTimeout(() => {
				this.#resetTimer = null;
				if (cycle === this.#generation) {
					this.#outsideGesture = false;
				}
			}, 0);
		};
		#applyCardAria() {
			const card = this.#card;
			if (card === null) {
				return;
			}
			if (this.#effectiveMode === 'passive') {
				main_core.Dom.attr(card, 'role', 'tooltip');
				main_core.Dom.attr(card, 'tabindex', null);
				main_core.Dom.attr(card, 'aria-label', null);
				main_core.Dom.attr(card, 'aria-labelledby', null);
				return;
			}
			main_core.Dom.attr(card, 'role', 'dialog');
			main_core.Dom.attr(card, 'tabindex', '-1');
			if (this.#titleNode !== null) {
				main_core.Dom.attr(card, 'aria-labelledby', this.#titleId());
				main_core.Dom.attr(card, 'aria-label', null);
				this.#namelessWarned = false;
				return;
			}
			main_core.Dom.attr(card, 'aria-labelledby', null);
			if (this.#ariaLabel !== null) {
				main_core.Dom.attr(card, 'aria-label', this.#ariaLabel);
				this.#namelessWarned = false;
				return;
			}
			if (!this.#namelessWarned) {
				this.#namelessWarned = true;
				console.warn(`${NAMESPACE}: an interactive card is a dialog and needs a name - give it a title or an ` + 'ariaLabel. The dialog stays nameless meanwhile.');
			}
			main_core.Dom.attr(card, 'aria-label', null);
		}
		#applyCloseButton() {
			const card = this.#card;
			if (card === null) {
				return;
			}
			const wanted = this.#requestedShowClose ?? this.#effectiveMode === 'interactive';
			if (wanted) {
				this.#closeButton = this.#closeButton ?? this.#renderCloseButton();
				if (this.#closeButton.parentElement !== card) {
					main_core.Dom.append(this.#closeButton, card);
				}
			} else if (this.#closeButton !== null) {
				main_core.Dom.remove(this.#closeButton);
			}
			main_core.Dom.toggleClass(card, '--with-close', wanted);
		}
		#renderCloseButton() {
			const label = main_core.Text.encode(main_core.Loc.getMessage('UI_SYSTEM_CALLOUT_CLOSE_BUTTON_LABEL_ARIA') ?? '');
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.CROSS_M,
				size: 24
			});
			const button = main_core.Tag.render`
			<button
				class="ui-system-callout__close-button --ui-hoverable"
				type="button"
				aria-label="${label}"
				title="${label}"
			>
				${icon.render()}
			</button>
		`;
			main_core.Event.bind(button, 'click', this.#handleCloseClick);
			return button;
		}
		#syncDescribedBy(previousAnchor, wanted) {
			const anchor = this.#accessibleAnchor();
			if (previousAnchor !== null && previousAnchor !== anchor) {
				removeDescribedBy(previousAnchor, this.#cardId);
			}
			if (anchor === null) {
				return;
			}
			if (wanted) {
				addDescribedBy(anchor, this.#cardId);
			} else {
				removeDescribedBy(anchor, this.#cardId);
			}
		}
		#commitSubstrate(touched, modeChanged) {
			const popover = this.#popover;
			if (popover === null) {
				return;
			}
			if (touched.closeByClickOutside) {
				popover.setCloseByClickOutside(this.#closeByClickOutside);
			}
			if (touched.closeByEsc) {
				popover.setCloseByEsc(this.#closeByEsc);
			}
			if (touched.designContext) {
				popover.setDesignContext(this.#designContext);
			}
			const wasArea = this.#substrateArea;
			const area = this.#target === 'area';
			const targetFirst = wasArea && !area;
			if (touched.target && targetFirst) {
				this.#commitTarget();
			}
			if (touched.positioning || modeChanged || area !== wasArea) {
				popover.setPositioning(this.#effectivePositioning());
			}
			if (touched.target && !targetFirst) {
				this.#commitTarget();
			}
		}
		#commitTarget() {
			const target = this.#target;
			if (target !== null) {
				this.#substrateArea = target === 'area';
				this.#popover?.setTarget(target === 'area' ? null : target);
				return;
			}
			if (this.#state === 'shown') {
				this.#hideProgrammatically();
			}
		}
		#hideProgrammatically() {
			this.#hideReason = 'programmatic';
			this.#state = 'hiding';
			this.#popover?.hide();
		}
		#completeHide(reason) {
			const anchor = this.#accessibleAnchor();
			this.#state = 'hiding';
			this.#autoFocusPending = false;
			try {
				if (this.#card !== null) {
					main_core.Dom.removeClass(this.#card, '--visible');
				}
				this.#syncDescribedBy(anchor, false);
				this.#resolveCloseFocus(anchor, reason === 'anchor');
				if (reason === 'user') {
					this.#emit('onClose');
				}
				this.#emit('onHide');
			} finally {
				this.#state = 'idle';
				this.#anchorCloseArmed = false;
				this.#runDeferred();
			}
		}
		#teardown() {
			if (this.#tearingDown) {
				return;
			}
			this.#tearingDown = true;
			try {
				if (this.#state === 'shown') {
					this.#hideProgrammatically();
				}
			} finally {
				this.#state = 'destroying';
				try {
					this.#unbind();
					const anchor = this.#accessibleAnchor();
					if (anchor !== null) {
						removeDescribedBy(anchor, this.#cardId);
					}
					if (this.#closeButton !== null) {
						main_core.Event.unbind(this.#closeButton, 'click', this.#handleCloseClick);
					}
					this.#popover?.destroy();
					this.#popover = null;
					if (this.#card !== null) {
						main_core.Dom.remove(this.#card);
					}
					this.#card = null;
					this.#body = null;
					this.#titleNode = null;
					this.#closeButton = null;
					this.#regions.clear();
					this.#renderedButtons = [];
					this.#pending.clear();
					this.#pendingSubstrate = nothingTouched();
				} finally {
					this.#state = 'destroyed';
					this.#emit('onDestroy');
					this.#listeners.clear();
				}
			}
		}
		#runDeferred() {
			if (this.#deferredDestroy) {
				this.#deferredDestroy = false;
				this.#deferredHide = false;
				this.#teardown();
				return;
			}
			if (this.#deferredHide) {
				this.#deferredHide = false;
				this.hide();
			}
		}
		#ensureCard() {
			if (this.#card !== null) {
				return this.#card;
			}
			const left = main_core.Tag.render`<div class="ui-system-callout__left"></div>`;
			const description = main_core.Tag.render`<div class="ui-system-callout__description"></div>`;
			const footer = main_core.Tag.render`<div class="ui-system-callout__footer"></div>`;
			const footerLeft = main_core.Tag.render`<div class="ui-system-callout__footer-left"></div>`;
			const buttons = main_core.Tag.render`<div class="ui-system-callout__buttons"></div>`;
			const body = main_core.Tag.render`<div class="ui-system-callout__body">${description}${footerLeft}${footer}${buttons}</div>`;
			const card = main_core.Tag.render`<div class="ui-system-callout" id="${this.#cardId}">${left}${body}</div>`;
			this.#card = card;
			this.#body = body;
			this.#regions.set('leftSlot', {
				container: left,
				owned: null
			});
			this.#regions.set('description', {
				container: description,
				owned: null
			});
			this.#regions.set('footer', {
				container: footer,
				owned: null
			});
			this.#regions.set('footerLeft', {
				container: footerLeft,
				owned: null
			});
			this.#regions.set('buttons', {
				container: buttons,
				owned: null
			});
			this.#pending = new Set(['title', 'width', 'description', 'leftSlot', 'footer', 'footerLeft', 'buttons']);
			this.#renderPending();
			this.#recomputeEffectiveMode();
			this.#applyCardAria();
			this.#applyCloseButton();
			return card;
		}
		#ensurePopover() {
			if (this.#popover !== null) {
				return this.#popover;
			}
			const options = {
				content: this.#ensureCard(),
				className: POPOVER_CLASS,
				positioning: this.#effectivePositioning(),
				designContext: this.#designContext,
				closeByClickOutside: this.#closeByClickOutside,
				closeByEsc: this.#closeByEsc,
				events: {
					onShow: this.#handlePopoverShow,
					onHide: this.#handlePopoverHide,
					onStateChange: this.#handlePopoverStateChange
				}
			};
			const target = this.#target;
			if (target !== null && target !== 'area') {
				options.target = target;
			}
			if (this.#container !== null) {
				options.container = this.#container;
			}
			this.#popover = new ui_system_popover.Popover(options);
			this.#substrateArea = target === 'area';
			return this.#popover;
		}
		#effectivePositioning() {
			const area = this.#target === 'area';
			const defaults = {
				...DEFAULT_POSITIONING,
				whenAnchorHidden: this.#effectiveMode === 'passive' ? 'hide' : 'close'
			};
			const requested = this.#requestedPositioning;
			const effective = {};
			POSITIONING_KEYS.forEach(key => {
				if (area && ANCHOR_ONLY_KEYS.has(key)) {
					effective[key] = undefined;
					return;
				}
				effective[key] = requested[key] === undefined ? defaults[key] : requested[key];
			});
			if (!area && this.#effectiveMode === 'interactive' && effective.whenAnchorHidden !== 'close') {
				console.warn(`${NAMESPACE}: an interactive card takes whenAnchorHidden: 'close' only - a dialog holding the ` + 'focus may not be hidden silently. The requested value is kept for the passive mode.');
				effective.whenAnchorHidden = 'close';
			}
			return effective;
		}
		#closesOnHiddenAnchor() {
			return this.#effectiveMode === 'interactive' || this.#requestedPositioning.whenAnchorHidden === 'close';
		}
		#normalizePositioning(positioning) {
			return main_core.Type.isPlainObject(positioning) ? {
				...positioning
			} : {};
		}
		#normalizeWidth(value) {
			if (!main_core.Type.isNumber(value) || !Number.isFinite(value) || value <= 0) {
				this.#clampedWidth = null;
				return DEFAULT_WIDTH;
			}
			if (value >= MIN_WIDTH) {
				this.#clampedWidth = null;
				return value;
			}
			if (this.#clampedWidth !== value) {
				this.#clampedWidth = value;
				console.warn(`${NAMESPACE}: a width of ${value}px is below the minimum of ${MIN_WIDTH}px the card is laid ` + 'out for - the minimum is applied instead.');
			}
			return MIN_WIDTH;
		}
		#resolveTarget(target) {
			if (target === null || target === undefined) {
				return null;
			}
			if (isValidTarget(target)) {
				return target;
			}
			console.warn(`${NAMESPACE}: the target must be an element, a rect target, a point or 'area' - the value given ` + 'is treated as no anchor at all.');
			return null;
		}
		#accessibleAnchor() {
			const target = this.#target;
			if (target === null || target === 'area') {
				return null;
			}
			return main_core.Type.isElementNode(target) ? target : contextElementOf(target);
		}
		#ownerDocument() {
			if (this.#container !== null) {
				return this.#container.ownerDocument;
			}
			return this.#card?.ownerDocument ?? document;
		}
		#titleId() {
			return `${this.#cardId}-title`;
		}
		#regionEntries() {
			return [...this.#regions].map(([region, nodes]) => [region, nodes.container]);
		}
		#handlePopoverShow = () => {
			if (this.#state !== 'showing') {
				return;
			}
			this.#recomputeMountedMode();
			this.#enterShownInteractive();
		};
		#handlePopoverHide = () => {
			const reason = this.#hideReason ?? (this.#anchorCloseArmed ? 'anchor' : 'user');
			this.#hideReason = null;
			this.#completeHide(reason);
		};
		#handlePopoverStateChange = event => {
			const payload = event.getData();
			if (payload === null) {
				return;
			}
			const {
				state
			} = payload;
			this.#anchorCloseArmed = state.anchorHidden && this.#closesOnHiddenAnchor();
			if (this.#state !== 'shown' || !state.positioned || state.anchorHidden || this.#card === null) {
				return;
			}
			main_core.Dom.addClass(this.#card, '--visible');
			if (this.#autoFocusPending && this.#effectiveMode === 'interactive') {
				this.#autoFocusPending = false;
				this.#card.focus();
			}
		};
		#handleCloseClick = () => {
			if (this.#state !== 'shown') {
				return;
			}
			this.#hideReason = 'user';
			this.#state = 'hiding';
			this.#popover?.hide();
		};
		#subscribeFromOptions(options) {
			const events = main_core.Type.isPlainObject(options.events) ? options.events : {};
			const names = ['onShow', 'onHide', 'onClose', 'onDestroy'];
			names.forEach(name => {
				const listener = events[name];
				if (main_core.Type.isFunction(listener)) {
					this.#addListener(name, listener);
				}
			});
		}
		#addListener(name, listener) {
			const listeners = this.#listeners.get(name) ?? [];
			listeners.push(listener);
			this.#listeners.set(name, listeners);
		}
		#emit(name) {
			const listeners = this.#listeners.get(name);
			if (listeners === undefined || listeners.length === 0) {
				return;
			}
			const event = new main_core_events.BaseEvent({
				data: {}
			});
			const errors = [];
			[...listeners].forEach(listener => {
				try {
					listener(event);
				} catch (error) {
					errors.push(error);
				}
			});
			errors.forEach(error => console.error(`${NAMESPACE}: a subscriber of ${name} threw.`, error));
		}
	}

	exports.Callout = Callout;
	exports.DEFAULT_DESIGN_CONTEXT = DEFAULT_DESIGN_CONTEXT;
	exports.DEFAULT_POSITIONING = DEFAULT_POSITIONING;
	exports.DEFAULT_WIDTH = DEFAULT_WIDTH;
	exports.MIN_WIDTH = MIN_WIDTH;

})(this.BX.UI.System.Callout = this.BX.UI.System.Callout || {}, BX, BX.Event, BX.UI, BX.UI.IconSet, BX.UI.System.Popover, BX.UI.System.Typography);
//# sourceMappingURL=callout.bundle.js.map
