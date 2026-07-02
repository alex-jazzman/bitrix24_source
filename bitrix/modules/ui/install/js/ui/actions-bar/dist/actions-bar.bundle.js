/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_counterpanel, ui_navigationpanel, ui_buttons) {
	'use strict';

	function pickTarget(measurements, container, panels) {
		const {
			counter,
			nav,
			buttons,
			leftButtons
		} = measurements;
		if (counter === null || nav === null || buttons === null || leftButtons === null) {
			return {
				buttons: 0,
				leftButtons: 0,
				nav: 'expanded',
				counter: 'expanded'
			};
		}
		const budget = computeBudget(container);
		const overhead = computeOverhead(container, panels);
		const rightAllCollapsed = buttons.length - 1;
		const leftAllCollapsed = leftButtons.length - 1;
		const fittingRight = buttons.findIndex(width => overhead + width + leftButtons[0] + nav.expanded + counter.expanded <= budget);
		if (fittingRight !== -1) {
			return {
				buttons: fittingRight,
				leftButtons: 0,
				nav: 'expanded',
				counter: 'expanded'
			};
		}
		for (let kLeft = 1; kLeft <= leftAllCollapsed; kLeft++) {
			if (overhead + buttons[rightAllCollapsed] + leftButtons[kLeft] + nav.expanded + counter.expanded <= budget) {
				return {
					buttons: rightAllCollapsed,
					leftButtons: kLeft,
					nav: 'expanded',
					counter: 'expanded'
				};
			}
		}
		const allButtonsWidth = buttons[rightAllCollapsed] + leftButtons[leftAllCollapsed];
		if (overhead + allButtonsWidth + nav.collapsed + counter.expanded <= budget) {
			return {
				buttons: rightAllCollapsed,
				leftButtons: leftAllCollapsed,
				nav: 'collapsed',
				counter: 'expanded'
			};
		}
		return {
			buttons: rightAllCollapsed,
			leftButtons: leftAllCollapsed,
			nav: 'collapsed',
			counter: 'collapsed'
		};
	}
	function computeBudget(container) {
		const parent = container.parentElement;
		if (!parent) {
			return Number.POSITIVE_INFINITY;
		}
		let siblingsWidth = 0;
		for (const child of parent.children) {
			if (child !== container) {
				siblingsWidth += child.offsetWidth;
			}
		}
		return parent.clientWidth - computePaddingAndGaps(parent) - siblingsWidth;
	}
	function computeOverhead(container, panels) {
		let overhead = computePaddingAndGaps(container);
		for (const slot of container.children) {
			overhead += computePaddingAndGaps(slot);
			if (!panels.isManagedSlot(slot)) {
				for (const child of slot.children) {
					overhead += child.offsetWidth;
				}
			}
		}
		return overhead;
	}
	function computePaddingAndGaps(el) {
		const cs = getComputedStyle(el);
		const padL = parseFloat(cs.paddingLeft) || 0;
		const padR = parseFloat(cs.paddingRight) || 0;
		const gap = parseFloat(cs.columnGap) || parseFloat(cs.gap) || 0;
		const gapsCount = Math.max(0, el.children.length - 1);
		return padL + padR + gap * gapsCount;
	}

	function calibrate(container, panels, previous) {
		let counter = previous.counter;
		let nav = previous.nav;
		let buttons = previous.buttons;
		let leftButtons = previous.leftButtons;
		forceIntrinsicWidth(container, () => {
			if (panels.counter && counter === null) {
				counter = measureCollapsible(panels.counter, () => panels.getCounterNode()?.offsetWidth ?? 0);
			}
			if (panels.nav && nav === null) {
				nav = measureCollapsible(panels.nav, () => panels.getNavNode()?.offsetWidth ?? 0);
			}
			if (panels.buttons && buttons === null) {
				buttons = measureButtons(panels.buttons, () => measureButtonsContentWidth(panels.getButtonsNode()));
			}
			if (leftButtons === null) {
				leftButtons = panels.leftButtons ? measureLeftButtons(panels.leftButtons) : [0];
			}
		});
		return {
			counter,
			nav,
			buttons,
			leftButtons
		};
	}
	function forceIntrinsicWidth(container, fn) {
		const previousStyle = container.getAttribute('style');
		main_core.Dom.style(container, {
			width: 'max-content',
			flex: '0 0 auto',
			minWidth: 'auto',
			maxWidth: 'none'
		});
		try {
			fn();
		} finally {
			if (previousStyle === null) {
				container.removeAttribute('style');
			} else {
				container.setAttribute('style', previousStyle);
			}
		}
	}
	function measureCollapsible(panel, measureWidth) {
		panel.expand();
		const expanded = measureWidth();
		panel.collapse();
		const collapsed = measureWidth();
		panel.expand();
		return {
			expanded,
			collapsed
		};
	}
	function measureButtons(rb, measureContentWidth) {
		const widths = [];
		const total = rb.getButtonCount();
		for (let collapsedCount = 0; collapsedCount <= total; collapsedCount++) {
			rb.setCollapsedCount(collapsedCount);
			widths.push(measureContentWidth());
		}
		rb.setCollapsedCount(0);
		return widths;
	}
	function measureLeftButtons(lb) {
		return measureButtons(lb, () => lb.getContentWidth());
	}
	function measureButtonsContentWidth(slot) {
		if (!slot) {
			return 0;
		}
		let width = 0;
		for (const child of slot.children) {
			width += child.offsetWidth;
		}
		return width;
	}

	class MutationGate {
		#observer;
		#target;
		#options;
		constructor(target, options, callback) {
			this.#target = target;
			this.#options = options;
			this.#observer = new MutationObserver(callback);
			this.#observer.observe(target, options);
		}
		pause(fn) {
			this.#observer.disconnect();
			try {
				fn();
			} finally {
				this.#observer.observe(this.#target, this.#options);
			}
		}
	}

	const instanceMap = new WeakMap();
	class RightButtons {
		static getInstanceByNode(node) {
			return instanceMap.get(node) ?? null;
		}
		#buttonsContainer;
		#buttons = [];
		#resizeObserver = null;
		#mutationObserver = null;
		#deltas = [];
		#collapsable;
		static #shift = 32;
		constructor(options) {
			this.#buttonsContainer = options.buttonsContainer;
			this.#collapsable = options.collapsable === true;
			instanceMap.set(this.#buttonsContainer, this);
		}
		getContainer() {
			return this.#buttonsContainer;
		}
		getButtonCount() {
			return this.#buttons.length;
		}
		getCollapsedCount() {
			return this.#buttons.filter(button => button.isCollapsed()).length;
		}
		setCollapsedCount(k) {
			const total = this.#buttons.length;
			const clamped = Math.max(0, Math.min(k, total));
			const firstCollapsedIdx = total - clamped;
			for (let i = 0; i < total; i++) {
				const shouldCollapse = i >= firstCollapsedIdx;
				if (this.#buttons[i].isCollapsed() !== shouldCollapse) {
					this.#buttons[i].setCollapsed(shouldCollapse);
				}
			}
		}
		collapse() {
			this.setCollapsedCount(this.#buttons.length);
		}
		expand() {
			this.setCollapsedCount(0);
		}
		isCollapsed() {
			return this.#buttons.length > 0 && this.getCollapsedCount() === this.#buttons.length;
		}
		disableAutoCollapse() {
			this.#resizeObserver?.disconnect();
			this.#resizeObserver = null;
		}
		init() {
			if (this.#useAirDesign() === false) {
				return;
			}
			this.#initButtons();
			if (this.#collapsable) {
				this.#handleContainerWidthUpdate();
				this.#initResizeObserver();
			}
			this.#initMutationObserver();
			this.#observe();
		}
		#initButtons() {
			const buttonElements = this.#buttonsContainer.querySelectorAll('.ui-btn, .ui-btn-split');
			this.#buttons = [...buttonElements].map(button => {
				const btn = ui_buttons.ButtonManager.createFromNode(button);
				this.#styleButton(btn);
				return btn;
			});
			this.#deltas = this.#buttons.map(() => 0);
		}
		#initResizeObserver() {
			this.#resizeObserver = new ResizeObserver(() => {
				this.#handleContainerWidthUpdate();
			});
		}
		#initMutationObserver() {
			this.#mutationObserver = new MutationObserver(mutationsList => {
				mutationsList.forEach(mutation => {
					if (mutation.type !== 'childList') {
						return;
					}
					mutation.addedNodes.forEach(node => {
						if (node.nodeType !== Node.ELEMENT_NODE) {
							return;
						}
						const element = node;
						if (main_core.Dom.hasClass(element, 'ui-btn') || main_core.Dom.hasClass(element, 'ui-btn-split')) {
							this.#initButtons();
						}
						const foundButtons = element.querySelectorAll('.ui-btn, .ui-btn-split');
						if (foundButtons.length > 0) {
							this.#initButtons();
						}
					});
				});
			});
		}
		#observe() {
			this.#resizeObserver?.observe(this.#buttonsContainer);
			this.#mutationObserver?.observe(this.#buttonsContainer, {
				childList: true,
				subtree: true
			});
		}
		#handleContainerWidthUpdate() {
			if (this.#isButtonsOverflowContainer()) {
				this.#collapseOneMoreButton();
			} else if (this.#isEnoughSpaceForExpandedButton()) {
				this.#expandOneMoreButton();
			}
		}
		#isButtonsOverflowContainer() {
			return this.#getButtonRelativePositionLeft() + RightButtons.#shift >= 0;
		}
		#isEnoughSpaceForExpandedButton() {
			return this.#getButtonRelativePositionLeft() + this.#getDelta() + RightButtons.#shift < 0;
		}
		#getButtonRelativePositionLeft() {
			return main_core.Dom.getRelativePosition(this.#buttonsContainer, this.#buttons[0].getContainer()).left;
		}
		#expandOneMoreButton() {
			const collapsedButtonIndex = this.#buttons.findIndex(button => button.isCollapsed());
			if (collapsedButtonIndex < 0) {
				return;
			}
			const collapsedButton = this.#buttons[collapsedButtonIndex];
			collapsedButton.setCollapsed(false);
			this.#deltas[collapsedButtonIndex] = 0;
			if (this.#isEnoughSpaceForExpandedButton()) {
				this.#expandOneMoreButton();
			}
		}
		#collapseOneMoreButton() {
			const notCollapsedButtonIndex = this.#buttons.findLastIndex(button => button.isCollapsed() === false);
			if (notCollapsedButtonIndex < 0) {
				return;
			}
			const notCollapsedButton = this.#buttons[notCollapsedButtonIndex];
			this.#deltas[notCollapsedButtonIndex] += notCollapsedButton.getContainer().offsetWidth;
			notCollapsedButton.setCollapsed(true);
			this.#deltas[notCollapsedButtonIndex] -= notCollapsedButton.getContainer().offsetWidth;
			if (this.#isButtonsOverflowContainer()) {
				this.#collapseOneMoreButton();
			}
		}
		#getDelta() {
			return this.#deltas.find(delta => delta > 0) ?? 0;
		}
		#useAirDesign() {
			return Boolean(main_core.Extension.getSettings('ui.actions-bar').get('useAirDesign'));
		}
		#styleButton(button) {
			const isButtonHasAirDesign = button.hasAirDesign();
			button.setAirDesign(true);
			button.setSize(ui_buttons.ButtonSize.SMALL);
			if (isButtonHasAirDesign === false) {
				button.setStyle(this.#buttonColorStyleMap(button.getColor()));
			}
			button.setNoCaps(true);
		}
		#buttonColorStyleMap(color) {
			if (color === ui_buttons.ButtonColor.PRIMARY) {
				return ui_buttons.AirButtonStyle.FILLED;
			}
			return ui_buttons.AirButtonStyle.OUTLINE;
		}
	}

	const ButtonSelector = '.ui-btn, .ui-btn-split';
	class LeftButtons {
		#buttons;
		#hostSlots;
		static collect(container, excludedSlots) {
			const excluded = excludedSlots.filter(Boolean);
			const nodes = container.querySelectorAll(ButtonSelector);
			const buttons = [];
			const hostSlots = new Set();
			for (const node of nodes) {
				if (excluded.some(slot => slot.contains(node))) {
					continue;
				}
				const btn = ui_buttons.ButtonManager.createFromNode(node);
				if (!btn) {
					continue;
				}
				buttons.push(btn);
				const hostSlot = LeftButtons.#findHostSlot(node, container);
				if (hostSlot) {
					hostSlots.add(hostSlot);
				}
			}
			if (buttons.length === 0) {
				return null;
			}
			return new LeftButtons(buttons, hostSlots);
		}
		constructor(buttons, hostSlots) {
			this.#buttons = buttons;
			this.#hostSlots = hostSlots;
		}
		getButtonCount() {
			return this.#buttons.length;
		}
		setCollapsedCount(k) {
			const total = this.#buttons.length;
			const clamped = Math.max(0, Math.min(k, total));
			const firstCollapsedIdx = total - clamped;
			for (let i = 0; i < total; i++) {
				const shouldCollapse = i >= firstCollapsedIdx;
				if (this.#buttons[i].isCollapsed() !== shouldCollapse) {
					this.#buttons[i].setCollapsed(shouldCollapse);
				}
			}
		}
		getContentWidth() {
			let width = 0;
			for (const button of this.#buttons) {
				width += button.getContainer().offsetWidth;
			}
			return width;
		}
		isHostSlot(slot) {
			return this.#hostSlots.has(slot);
		}
		static #findHostSlot(node, container) {
			let current = node;
			while (current && current.parentElement !== container) {
				current = current.parentElement;
			}
			return current;
		}
	}

	const Selector = {
		Counter: '.ui-counter-panel__scope',
		Nav: '.ui-nav-panel__scope',
		Buttons: '.ui-actions-bar__buttons'
	};
	class Panels {
		#container;
		counter = null;
		nav = null;
		buttons = null;
		leftButtons = null;
		constructor(container) {
			this.#container = container;
		}
		discover() {
			const counterNode = this.getCounterNode();
			this.counter = counterNode ? ui_counterpanel.CounterPanel.getInstanceByNode(counterNode) : null;
			const navNode = this.getNavNode();
			this.nav = navNode ? ui_navigationpanel.NavigationPanel.getInstanceByNode(navNode) : null;
			const buttonsNode = this.getButtonsNode();
			const newButtons = buttonsNode ? RightButtons.getInstanceByNode(buttonsNode) : null;
			if (newButtons !== this.buttons) {
				this.buttons = newButtons;
				this.buttons?.disableAutoCollapse();
			}
			this.leftButtons = LeftButtons.collect(this.#container, [counterNode, navNode, buttonsNode]);
		}
		getCounterNode() {
			return this.#container.querySelector(Selector.Counter);
		}
		getNavNode() {
			return this.#container.querySelector(Selector.Nav);
		}
		getButtonsNode() {
			return this.#container.querySelector(Selector.Buttons);
		}
		apply(target) {
			this.buttons?.setCollapsedCount(target.buttons);
			this.leftButtons?.setCollapsedCount(target.leftButtons);
			this.#applyPanelState(this.nav, target.nav);
			this.#applyPanelState(this.counter, target.counter);
		}
		isManagedSlot(slot) {
			const counter = this.getCounterNode();
			const nav = this.getNavNode();
			const buttons = this.getButtonsNode();
			return Boolean(counter && slot.contains(counter) || nav && slot.contains(nav) || buttons && slot.contains(buttons) || this.leftButtons?.isHostSlot(slot));
		}
		#applyPanelState(panel, state) {
			if (!panel) {
				return;
			}
			const isCollapsed = panel.isCollapsed();
			if (state === 'collapsed' && !isCollapsed) {
				panel.collapse();
			} else if (state === 'expanded' && isCollapsed) {
				panel.expand();
			}
		}
	}

	class RafGate {
		#pendingId = null;
		request(fn) {
			if (this.#pendingId !== null) {
				return;
			}
			this.#pendingId = requestAnimationFrame(() => {
				this.#pendingId = null;
				fn();
			});
		}
	}

	class Manager {
		#container;
		#panels;
		#measurements = {
			counter: null,
			nav: null,
			buttons: null,
			leftButtons: null
		};
		#resizeObserver = null;
		#mutationGate = null;
		#fitGate = new RafGate();
		#resyncGate = new RafGate();
		constructor(options) {
			this.#container = options.container;
			this.#panels = new Panels(this.#container);
		}
		init() {
			if (!this.#isAirDesignEnabled()) {
				return;
			}
			this.#panels.discover();
			this.#observeResize();
			this.#observeMutations();
			this.#calibrate();
			this.#fit();
		}
		#fit() {
			const target = pickTarget(this.#measurements, this.#container, this.#panels);
			this.#mutationGate?.pause(() => this.#panels.apply(target));
		}
		#resync() {
			this.#panels.discover();
			this.#measurements = {
				counter: null,
				nav: null,
				buttons: null,
				leftButtons: null
			};
			this.#calibrate();
			this.#fit();
		}
		#calibrate() {
			this.#mutationGate?.pause(() => {
				this.#measurements = calibrate(this.#container, this.#panels, this.#measurements);
			});
		}
		#observeResize() {
			const target = this.#container.parentElement ?? this.#container;
			this.#resizeObserver = new ResizeObserver(() => {
				this.#fitGate.request(() => this.#fit());
			});
			this.#resizeObserver.observe(target);
		}
		#observeMutations() {
			this.#mutationGate = new MutationGate(this.#container, {
				childList: true,
				subtree: true
			}, () => {
				this.#resyncGate.request(() => this.#resync());
			});
		}
		#isAirDesignEnabled() {
			return Boolean(main_core.Extension.getSettings('ui.actions-bar').get('useAirDesign'));
		}
	}

	const managedBars = new WeakSet();
	function initManagerForContainer(container) {
		if (managedBars.has(container)) {
			return;
		}
		managedBars.add(container);
		new Manager({
			container
		}).init();
	}
	function resolveContainer(target) {
		if (main_core.Type.isStringFilled(target)) {
			return document.getElementById(target);
		}
		if (main_core.Type.isDomNode(target) && main_core.Dom.hasClass(target, 'ui-actions-bar')) {
			return target;
		}
		return null;
	}
	function init(target) {
		const container = resolveContainer(target);
		if (container) {
			initManagerForContainer(container);
		}
	}
	function initAllBars() {
		const bars = document.querySelectorAll('.ui-actions-bar');
		bars.forEach(bar => {
			initManagerForContainer(bar);
		});
	}
	function observeNewBars() {
		const observer = new MutationObserver(mutations => {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					if (node.nodeType !== Node.ELEMENT_NODE) {
						continue;
					}
					const element = node;
					if (main_core.Dom.hasClass(element, 'ui-actions-bar')) {
						initManagerForContainer(element);
					}
					const nestedBars = element.querySelectorAll?.('.ui-actions-bar');
					nestedBars?.forEach(bar => {
						initManagerForContainer(bar);
					});
				}
			}
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});
	}
	main_core.Event.ready(() => {
		initAllBars();
		observeNewBars();
	});
	const ActionsBar = {
		RightButtons,
		init
	};

	exports.ActionsBar = ActionsBar;

})(this.BX.UI = this.BX.UI || {}, BX, BX.UI, BX.UI, BX.UI);
//# sourceMappingURL=actions-bar.bundle.js.map
