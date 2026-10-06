/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.Reaction = this.BX.UI.Reaction || {};
(function (exports, main_core, main_core_events, main_core_zIndexManager, main_popup, ui_a11y, ui_iconSet_api_core, ui_designTokens, ui_designTokens_air, ui_iconSet_outline, ui_reaction_item) {
	'use strict';

	class ReactionPickerRanking {
		static #STORAGE_KEY = 'ui-reaction-picker-ranking';
		static #INITIAL_COUNTER_VALUE = 2;
		#counters;
		constructor() {
			this.#counters = this.#loadCounters();
			this.#initializeDefaultCounters();
		}
		getRankedReactionsNames() {
			const allReactions = Object.values(ui_reaction_item.ReactionName);
			const sortedReactions = this.#sortReactionsByRank(allReactions);
			const likeIndex = sortedReactions.indexOf(ui_reaction_item.ReactionName.like);
			if (likeIndex > 0) {
				sortedReactions.splice(likeIndex, 1);
				sortedReactions.unshift(ui_reaction_item.ReactionName.like);
			}
			return sortedReactions;
		}
		incrementReactionCounter(reactionName) {
			if (!this.#isValidReaction(reactionName)) {
				return;
			}
			const currentCount = this.#counters.get(reactionName) || 0;
			this.#counters.set(reactionName, currentCount + 1);
			this.#saveCounters();
		}
		getReactionCounter(reactionName) {
			if (!this.#isValidReaction(reactionName)) {
				return 0;
			}
			return this.#counters.get(reactionName) || 0;
		}
		resetCounters() {
			this.#counters.clear();
			this.#initializeDefaultCounters();
			this.#saveCounters();
		}
		#loadCounters() {
			try {
				const stored = localStorage.getItem(ReactionPickerRanking.#STORAGE_KEY);
				if (!stored) {
					return new Map();
				}
				const parsed = JSON.parse(stored);
				if (!main_core.Type.isObject(parsed) || parsed === null) {
					return new Map();
				}
				return new Map(Object.entries(parsed));
			} catch (error) {
				// eslint-disable-next-line no-console
				console.warn('Failed to load reaction counters from localStorage:', error);
				return new Map();
			}
		}
		#saveCounters() {
			try {
				const countersObject = Object.fromEntries(this.#counters);
				localStorage.setItem(ReactionPickerRanking.#STORAGE_KEY, JSON.stringify(countersObject));
			} catch (error) {
				// eslint-disable-next-line no-console
				console.warn('Failed to save reaction counters to localStorage:', error);
			}
		}
		#initializeDefaultCounters() {
			const allReactions = Object.values(ui_reaction_item.ReactionName);
			const topReactions = [ui_reaction_item.ReactionName.like, ui_reaction_item.ReactionName.faceWithTearsOfJoy, ui_reaction_item.ReactionName.redHeart, ui_reaction_item.ReactionName.neutralFace, ui_reaction_item.ReactionName.fire, ui_reaction_item.ReactionName.cry];
			for (const reaction of topReactions) {
				if (!this.#counters.has(reaction)) {
					this.#counters.set(reaction, ReactionPickerRanking.#INITIAL_COUNTER_VALUE);
				}
			}
			for (const reaction of allReactions) {
				if (!this.#counters.has(reaction)) {
					this.#counters.set(reaction, 0);
				}
			}
		}
		#sortReactionsByRank(reactions) {
			return reactions.toSorted((a, b) => {
				const countA = this.#counters.get(a) || 0;
				const countB = this.#counters.get(b) || 0;
				if (countA !== countB) {
					return countB - countA;
				}
				return 0;
			});
		}
		#isValidReaction(reactionName) {
			return Object.values(ui_reaction_item.ReactionName).includes(reactionName);
		}
	}

	const ReactionPickerEvents = {
		show: 'show',
		hide: 'hide',
		expand: 'expand',
		select: 'select',
		mouseenter: 'mouseenter',
		mouseleave: 'mouseleave'
	};
	class ReactionPicker extends main_core_events.EventEmitter {
		#target;
		#popover = null;
		#isShown;
		#menuContainer;
		#listContainer;
		#expandedListContainer;
		#reactions;
		#priority;
		#contextAction;
		#contextMenu = null;
		#allowedReactions;
		#ranking;
		#focusZone = null;
		#focusTrap = null;
		#restoreFocusTarget;
		#mouseenterHandler = null;
		#mouseleaveHandler = null;
		#keydownHandler = null;
		#mousedownHandler = null;
		#focusinHandler = null;
		#stampedTargetAttributes = null;
		#destroyTimeoutId = null;
		#showToken = 0;
		static #rowSize = 7;
		static #minHeight = 56;
		static #offsetBetweenTargetElement = 8;

		/**
		 * `aria-expanded` is only honoured on an element whose role supports it, and an element no
		 * keyboard can reach is not a control to report a state of. The public contract takes any
		 * element - an owner may hang the picker on a plain div - and on one of those the states are
		 * left unwritten rather than written where nothing reads them.
		 */
		static #menuStateTargetSelector = ['button', 'a[href]', 'summary', '[tabindex]', '[role="button"]', '[role="link"]', '[role="combobox"]', '[role="menuitem"]', '[role="tab"]', '[role="treeitem"]'].join(', ');
		constructor(options) {
			super();
			this.setEventNamespace('UI.ReactionPicker.V2');
			this.#target = options.target;
			this.#allowedReactions = main_core.Type.isArrayFilled(options.reactions) ? options.reactions : null;
			this.#priority = main_core.Type.isStringFilled(options.priorityReaction) ? options.priorityReaction : null;
			this.#contextAction = main_core.Type.isPlainObject(options.contextAction) && main_core.Type.isStringFilled(options.contextAction.title) && main_core.Type.isFunction(options.contextAction.onClick) ? options.contextAction : null;
			this.#menuContainer = null;
			this.#listContainer = null;
			this.#expandedListContainer = null;
			this.#isShown = false;
			this.#reactions = [];
			this.#ranking = new ReactionPickerRanking();
			this.#restoreFocusTarget = () => this.#target instanceof HTMLElement ? this.#target : null;
		}
		show(options = {}) {
			// A picker shown again inside the teardown window of hide() keeps the popover it
			// already has, and the pending timer would destroy the one just put on the screen.
			this.#clearDestroyTimeout();
			if (!this.#popover) {
				this.#initPopover();
			}

			// Dom.append() is an appendChild(): moving a popover that is already in the body would send
			// it past the guards of its focus trap, which are put around it once and never moved again.
			if (this.#popover.parentElement !== document.body) {
				main_core.Dom.append(this.#popover, document.body);
			}
			main_core.Dom.removeClass(this.#popover, '--hiding');
			main_core.Dom.attr(this.#popover, 'inert', null);
			this.adjustPosition();
			if (!main_core_zIndexManager.ZIndexManager.getComponent(this.#popover)) {
				main_core_zIndexManager.ZIndexManager.register(this.#popover);
			}
			main_core_zIndexManager.ZIndexManager.bringToFront(this.#popover);
			this.#isShown = true;
			const takesFocus = options.focus === true || this.#isOpenedFromFocusedTarget();
			if (takesFocus) {
				this.#skipFadeIn();
			}

			// The keydown handler of the menu belongs to the zone, so the zone goes on before the focus
			// does - a key pressed in the first frames of a keyboard opening used to reach nothing.
			this.#focusZone?.activate();
			if (takesFocus) {
				this.focus();
			}
			const showToken = ++this.#showToken;
			requestAnimationFrame(async () => {
				if (!this.#popover) {
					return;
				}
				main_core.Dom.addClass(this.#popover, '--visible');

				// A fully transparent element is not focusable, so the set collected by a zone activated
				// over a popover that is still fading in is empty. getAnimations() flushes the pending
				// style change, so the transition it returns is the one the class has just started, and
				// the end of it is the only boundary that is not a guess at when transparency is over.
				const fadeIn = this.#popover.getAnimations().map(animation => animation.finished);
				await Promise.allSettled(fadeIn);

				// A fade-in outlives the picker being hidden - or hidden and shown again - while it
				// runs, and a set collected for a superseded show would belong to a popover that is
				// transparent again.
				if (this.#isShown && showToken === this.#showToken) {
					this.#focusZone?.refreshElements();
				}
			});
			this.#syncTargetMenuState(true);
			this.emit(ReactionPickerEvents.show);
		}
		focus() {
			this.#menuContainer?.querySelector('[role="menuitem"]')?.focus();
		}
		hide() {
			// Hiding a picker that is already hidden would lose the teardown timer of the first hide():
			// the lost timer goes on to tear down whatever show() puts on the screen in the meantime,
			// and the consumer subscribed to `hide` is told to close a picker that is already closing.
			if (!this.#isShown || !this.#popover) {
				return;
			}
			this.#contextMenu?.destroy();
			this.#contextMenu = null;
			this.#focusZone?.deactivate();
			this.#deactivateFocusTrap();

			// Only after the focus has been handed back: inert on an ancestor of the focused element
			// drops the focus on <body>, and there would be nothing left to hand back from.
			main_core.Dom.attr(this.#popover, 'inert', true);
			main_core.Dom.addClass(this.#popover, '--hiding');
			main_core.Dom.removeClass(this.#popover, '--visible');
			this.#destroyTimeoutId = setTimeout(() => {
				this.#destroyTimeoutId = null;
				this.#destroyReactions();
				this.#destroyPopover();
			}, 150);
			this.#isShown = false;
			this.#syncTargetMenuState(false);
			this.emit(ReactionPickerEvents.hide);
		}

		/**
		 * Tears the picker down at once, for an owner that goes away without hiding it first: the
		 * popover of an orphaned picker keeps its focus trap, and a trap left behind takes over the
		 * Tab navigation of the whole page.
		 */
		destroy() {
			this.#clearDestroyTimeout();
			this.#contextMenu?.destroy();
			this.#contextMenu = null;
			this.#deactivateFocusTrap();
			this.#destroyReactions();
			this.#destroyPopover();
			this.#isShown = false;
			this.#clearTargetMenuState();
		}
		isShown() {
			return this.#isShown;
		}
		adjustPosition() {
			if (!this.#popover) {
				return;
			}
			if (main_core.Type.isNumber(this.#target.top) && main_core.Type.isNumber(this.#target.left)) {
				this.#adjustPositionToCoordinates(this.#target);
			} else if (this.#target instanceof HTMLElement) {
				this.#adjustPositionToElement(this.#target);
			}
		}
		getPopoverRect() {
			return this.#popover ? main_core.Dom.getPosition(this.#popover) : undefined;
		}
		#adjustPositionToElement(target) {
			const elementRect = main_core.Dom.getPosition(target);
			const popoverRect = main_core.Dom.getPosition(this.#popover);
			let top = 0;
			const isEnoughSpaceBelowTargetElement = this.#isEnoughSpaceBelowTargetElement();
			if (isEnoughSpaceBelowTargetElement === false) {
				top = elementRect.top - popoverRect.height - ReactionPicker.#offsetBetweenTargetElement;
			} else if (this.#isEnoughSpaceAboveTargetElement()) {
				top = elementRect.top - ReactionPicker.#minHeight - ReactionPicker.#offsetBetweenTargetElement;
			} else if (isEnoughSpaceBelowTargetElement) {
				top = elementRect.top + elementRect.height + ReactionPicker.#offsetBetweenTargetElement;
			}
			let left = elementRect.left - 53;
			const rightEdge = left + popoverRect.width;
			const windowWidth = window.innerWidth;
			const rightPadding = 40;
			if (rightEdge + rightPadding > windowWidth) {
				left = windowWidth - popoverRect.width - rightPadding;
			}
			main_core.Dom.style(this.#popover, {
				top: `${top}px`,
				left: `${left}px`
			});
		}
		#adjustPositionToCoordinates(position) {
			main_core.Dom.style(this.#popover, {
				top: `${position.top}px`,
				left: `${position.left}px`
			});
		}
		#initPopover() {
			if (!this.#popover) {
				this.#listContainer = this.#renderReactionsList(this.#getReactionsNames().slice(0, ReactionPicker.#rowSize - 1));
				this.#expandedListContainer = main_core.Tag.render`
				<div class="reactions-select-popover__expanded-list" role="none"></div>
			`;
				const showExpandButton = this.#getReactionsNames().length > ReactionPicker.#rowSize;
				this.#menuContainer = main_core.Tag.render`
				<div class="reactions-select-popover__inner" role="menu">
					${this.#listContainer}
					${showExpandButton ? this.#renderExpandButton() : null}
					${this.#expandedListContainer}
				</div>
			`;
				this.#popover = main_core.Tag.render`
				<div
					class="reactions-select-popover --ui-context-content-light"
					data-testid="ui-reaction-picker"
				>
					${this.#menuContainer}
				</div>
			`;
				this.#mouseenterHandler = () => {
					this.emit(ReactionPickerEvents.mouseenter);
				};
				this.#mouseleaveHandler = () => {
					this.emit(ReactionPickerEvents.mouseleave);
				};
				this.#keydownHandler = event => {
					if (event.key === 'Escape') {
						event.preventDefault();
						event.stopPropagation();
						this.hide();
					}
				};

				// A menu item is a button, and pressing a button with the mouse hands it the focus -
				// out of the message the user was in the middle of writing. Dropping the default of
				// that press is the whole of what is needed: the click still arrives, so the reaction
				// is still picked and the list still expands, and the caret never leaves the input.
				// Only the items are covered, so a control that does need the focus can still be put
				// in the popover later.
				this.#mousedownHandler = event => {
					if (main_core.Type.isElementNode(event.target) && event.target.closest('[role="menuitem"]')) {
						event.preventDefault();
					}
				};

				// The picker is opened by hover as well, and a trap activated then would stand two tab
				// stops of its own around a popover the user never asked for and catch them on the way
				// past it. What the trap is for is keeping a focus that is already inside, so it is
				// started by the focus arriving - be it the one show() hands over or a Tab from the page.
				this.#focusinHandler = () => {
					if (this.#isShown) {
						this.#focusTrap?.activate({
							initialFocus: false
						});
					}
				};
				main_core.bind(this.#popover, 'mouseenter', this.#mouseenterHandler);
				main_core.bind(this.#popover, 'mouseleave', this.#mouseleaveHandler);
				main_core.bind(this.#popover, 'keydown', this.#keydownHandler);
				main_core.bind(this.#popover, 'mousedown', this.#mousedownHandler);
				main_core.bind(this.#popover, 'focusin', this.#focusinHandler);
				this.#focusTrap = new ui_a11y.FocusTrap(this.#popover, {
					looped: true,
					preventScroll: true,
					restoreFocus: this.#restoreFocusTarget
				});
				this.#focusZone = new ui_a11y.FocusZone(this.#menuContainer, {
					bindKeys: ui_a11y.FocusKeys.ArrowAll | ui_a11y.FocusKeys.HomeAndEnd,
					focusOutBehavior: 'wrap',
					focusInStrategy: 'previous',
					focusableElementFilter: element => element.matches('[role="menuitem"]'),
					getNextFocusable: (direction, from, event) => {
						return this.#getNextFocusableInRow(from, event);
					}
				});
			}
		}
		#renderReactionsList(reactionsIds, isExpanded = false) {
			const list = main_core.Tag.render`
			<div class="reactions-select__list" role="none"></div>
		`;
			if (isExpanded) {
				main_core.Dom.addClass(list, '--expanded');
			}
			reactionsIds.forEach(reactionId => {
				main_core.Dom.append(this.#renderReactionElement(reactionId), list);
			});
			return list;
		}
		#renderReactionElement(reactionName) {
			const reactionTitle = ui_reaction_item.ReactionTitle[reactionName];
			const reaction = new ui_reaction_item.Reaction({
				name: reactionName,
				size: 32,
				animation: {
					animate: true,
					infinite: true
				}
			});
			this.#reactions.push(reaction);

			// A menu is entered once and walked with the arrows, and the zone that writes the roving
			// tabindex is only activated once the popover has faded in - and gives this value back when
			// it is deactivated. A menu item nobody manages must not be a tab stop of its own.
			const element = main_core.Tag.render`
			<button
				type="button"
				class="reactions-select__list-elem"
				role="menuitem"
				tabindex="-1"
				aria-label="${reactionTitle}"
				title="${reactionTitle}"
				data-testid="ui-reaction-picker-item-${reactionName}"
			>
				<div ref="inner" class="reactions-select__list-elem-inner" aria-hidden="true">
					${reaction.render()}
				</div>
			</button>
		`;
			main_core.bind(element.inner, 'mouseenter', () => {
				// reaction.playAnimation(true);
			});
			main_core.bind(element.inner, 'mouseleave', () => {
				// reaction.pauseAnimation(false);
			});
			main_core.bind(element.root, 'click', () => {
				this.emit(ReactionPickerEvents.select, {
					reaction: reactionName
				});
				this.#ranking.incrementReactionCounter(reactionName);
			});
			if (this.#contextAction) {
				main_core.bind(element.root, 'contextmenu', event => {
					this.#showContextMenu(event, element.root, reactionName);
				});
			}
			return element.root;
		}
		#showContextMenu(event, bindElement, reactionName) {
			event.preventDefault();
			event.stopPropagation();
			this.#contextMenu?.destroy();
			const menu = new main_popup.Menu({
				bindElement,
				bindOptions: {
					position: 'top'
				},
				autoHide: true,
				cacheable: false,
				events: {
					onShow: () => {
						const popupContainer = menu.getPopupWindow().getPopupContainer();
						main_core.bind(popupContainer, 'mouseenter', () => {
							this.emit(ReactionPickerEvents.mouseenter);
						});
						main_core.bind(popupContainer, 'mouseleave', () => {
							this.emit(ReactionPickerEvents.mouseleave);
						});
					}
				},
				items: [{
					text: this.#contextAction.title,
					onclick: () => {
						this.#contextAction?.onClick(reactionName);
						this.hide();
					}
				}]
			});
			menu.getPopupWindow().subscribe('onDestroy', () => {
				if (this.#contextMenu === menu) {
					this.#contextMenu = null;
				}
			});
			this.#contextMenu = menu;
			menu.show();
		}
		#renderExpandButton() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.CHEVRON_DOWN_M,
				size: 24
			});
			const iconElement = icon.render();
			main_core.Dom.attr(iconElement, 'aria-hidden', 'true');
			const expandTitle = main_core.Loc.getMessage('UI_REACTIONS_LIST_EXPAND_BUTTON_TITLE');
			const button = main_core.Tag.render`
			<button
				type="button"
				class="reactions-select__expand-button --ui-hoverable"
				role="menuitem"
				tabindex="-1"
				aria-label="${expandTitle}"
				title="${expandTitle}"
				data-testid="ui-reaction-picker-expand-btn"
			>
				${iconElement}
			</button>
		`;
			const wrapper = main_core.Tag.render`
			<div class="reactions-select__expand-button-wrapper" role="none">
				${button}
			</div>
		`;
			main_core.bind(button, 'click', () => {
				// Read before the button leaves the DOM: removing the focused element drops the
				// focus onto <body>, and then there is no telling where it came from.
				const shouldMoveFocus = this.#hasFocusInside();
				const lastRowReaction = this.#renderReactionElement(this.#getReactionsNames()[ReactionPicker.#rowSize - 1]);
				main_core.Dom.append(lastRowReaction, this.#listContainer);
				main_core.Dom.remove(wrapper);
				this.#expand();
				this.#focusZone?.refreshElements();
				if (shouldMoveFocus) {
					lastRowReaction.focus();
				}
			});
			return wrapper;
		}
		#destroyPopover() {
			if (!this.#popover) {
				return;
			}
			if (this.#mouseenterHandler) {
				main_core.unbind(this.#popover, 'mouseenter', this.#mouseenterHandler);
				this.#mouseenterHandler = null;
			}
			if (this.#mouseleaveHandler) {
				main_core.unbind(this.#popover, 'mouseleave', this.#mouseleaveHandler);
				this.#mouseleaveHandler = null;
			}
			if (this.#keydownHandler) {
				main_core.unbind(this.#popover, 'keydown', this.#keydownHandler);
				this.#keydownHandler = null;
			}
			if (this.#mousedownHandler) {
				main_core.unbind(this.#popover, 'mousedown', this.#mousedownHandler);
				this.#mousedownHandler = null;
			}

			// hide() leaves the listener in place: the popover it is bound to is inert by then, so no
			// focus reaches it, and a picker shown again inside the teardown window needs it back.
			if (this.#focusinHandler) {
				main_core.unbind(this.#popover, 'focusin', this.#focusinHandler);
				this.#focusinHandler = null;
			}
			this.#focusZone?.deactivate();
			this.#focusZone = null;
			this.#focusTrap?.destroy();
			this.#focusTrap = null;
			main_core_zIndexManager.ZIndexManager.unregister(this.#popover);
			this.#popover.remove();
			this.#popover = null;
			this.#menuContainer = null;
			this.#listContainer = null;
			this.#expandedListContainer = null;
		}
		#clearDestroyTimeout() {
			clearTimeout(this.#destroyTimeoutId);
			this.#destroyTimeoutId = null;
		}

		/**
		 * A menu about to be handed to the keyboard has to be navigable at once, and a transparent
		 * popover has nothing to navigate: opacity 0 counts as invisible, and a transition reports the
		 * value it starts from until it ends. The fade-in is jumped to its end rather than waited out,
		 * which costs the keyboard path its 0.1s of animation and buys the arrows working from the
		 * first key press. A picker opened with the mouse fades in as before.
		 */
		#skipFadeIn() {
			main_core.Dom.addClass(this.#popover, '--visible');
			this.#popover.getAnimations().forEach(animation => {
				animation.finish();
			});
		}
		#deactivateFocusTrap() {
			if (!this.#focusTrap) {
				return;
			}

			// A picker opened and closed with the mouse never held the focus, and handing it
			// to the target would move the focus the user did not touch.
			this.#focusTrap.setRestoreFocus(this.#hasFocusInside() ? this.#restoreFocusTarget : false);
			this.#focusTrap.deactivate();
		}
		#destroyReactions() {
			this.#reactions.forEach(reaction => {
				reaction.destroy();
			});
			this.#reactions = [];
		}
		#expand() {
			main_core.Dom.addClass(this.#popover, '--expanded');
			main_core.Dom.append(this.#renderReactionsList(this.#getReactionsNames().slice(ReactionPicker.#rowSize), true), this.#expandedListContainer);
			if (this.#isEnoughSpaceBelowTargetElement() === false) {
				this.adjustPosition();
			}
			this.emit(ReactionPickerEvents.expand, {
				expandedListContainer: this.#expandedListContainer
			});
		}

		/**
		 * A target given as coordinates has no element to speak for it, and an element that is not a
		 * control of any kind has no state to be in: the picker is then a menu nothing announces.
		 */
		#syncTargetMenuState(isExpanded) {
			if (!this.#isMenuStateTarget()) {
				return;
			}
			this.#stampTargetAttribute('aria-haspopup', 'menu');
			this.#stampTargetAttribute('aria-expanded', isExpanded ? 'true' : 'false');
		}
		#isMenuStateTarget() {
			return this.#target instanceof HTMLElement && this.#target.matches(ReactionPicker.#menuStateTargetSelector);
		}

		/**
		 * The target is the owner's, and it may already speak for a widget of its own - one that opens
		 * a dialog, say. The value it had before the picker wrote over it is the one it goes back to.
		 */
		#stampTargetAttribute(name, value) {
			if (!this.#stampedTargetAttributes) {
				this.#stampedTargetAttributes = new Map();
			}
			if (!this.#stampedTargetAttributes.has(name)) {
				this.#stampedTargetAttributes.set(name, this.#target.getAttribute(name));
			}
			main_core.Dom.attr(this.#target, name, value);
		}

		/**
		 * A target outlives the picker it opened - it is the picker that belongs to a message, not the
		 * other way round. Left with the attributes, it would go on announcing a menu it no longer has.
		 */
		#clearTargetMenuState() {
			this.#stampedTargetAttributes?.forEach((value, name) => {
				main_core.Dom.attr(this.#target, name, value);
			});
			this.#stampedTargetAttributes = null;
		}
		#hasFocusInside() {
			return this.#popover !== null && this.#popover.contains(document.activeElement);
		}

		/**
		 * The picker also opens on hover, and the input modality alone does not tell hover apart
		 * from a key press: hovering fires no pointerdown, so a user who typed and then moved the
		 * mouse still counts as keyboard. Taking the focus is only right when the element the
		 * picker is anchored to holds it - that is what a keyboard-driven opening looks like.
		 */
		#isOpenedFromFocusedTarget() {
			return ui_a11y.FocusMonitor.Instance.getModalityTracker().getLastModality() === 'keyboard' && this.#target instanceof HTMLElement && this.#target.contains(document.activeElement);
		}

		/**
		 * Expanded, the reactions are laid out as a grid of `#rowSize` columns, so the vertical
		 * arrows move a whole row at a time. Returning null hands the key back to the linear
		 * navigation of the zone, which is what the horizontal arrows need.
		 */
		#getNextFocusableInRow(from, event) {
			if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
				return null;
			}

			// Collapsed, the menu is the single row a `role="menu"` is read as anyway, and a step of a
			// whole row has nowhere to land: answering with the item the user started from moves
			// nothing and tells a screen reader nothing. The linear navigation of the zone does both.
			if (!main_core.Dom.hasClass(this.#popover, '--expanded')) {
				return null;
			}
			const items = [...this.#menuContainer.querySelectorAll('[role="menuitem"]')];
			const currentIndex = items.indexOf(from);
			if (currentIndex === -1) {
				return null;
			}
			const offset = event.key === 'ArrowDown' ? ReactionPicker.#rowSize : -ReactionPicker.#rowSize;

			// No reaction in that row - the focus stays where it is instead of leaving the set.
			return items[currentIndex + offset] ?? items[currentIndex];
		}
		#isEnoughSpaceBelowTargetElement() {
			const popoverRect = main_core.Dom.getPosition(this.#popover);
			const targetRect = main_core.Dom.getPosition(this.#target);
			return targetRect.bottom + popoverRect.height + ReactionPicker.#offsetBetweenTargetElement < window.innerHeight;
		}
		#isEnoughSpaceAboveTargetElement() {
			const elementRect = main_core.Dom.getPosition(this.#target);
			return elementRect.top - ReactionPicker.#minHeight - window.scrollY - ReactionPicker.#offsetBetweenTargetElement > 0;
		}
		#getReactionsNames() {
			const rankedReactions = this.#ranking.getRankedReactionsNames();
			const excludedReactions = new Set([ui_reaction_item.ReactionName.signHorns, ui_reaction_item.ReactionName.faceWithStuckOutTongue]);
			const reactions = this.#allowedReactions ? rankedReactions.filter(reaction => this.#allowedReactions.includes(reaction)) : rankedReactions.filter(reaction => !excludedReactions.has(reaction));
			if (!this.#priority || !reactions.includes(this.#priority)) {
				return reactions;
			}
			return [this.#priority, ...reactions.filter(reaction => reaction !== this.#priority)];
		}
	}

	exports.ReactionPicker = ReactionPicker;
	exports.ReactionPickerEvents = ReactionPickerEvents;

})(this.BX.UI.Reaction.Picker = this.BX.UI.Reaction.Picker || {}, BX, BX.Event, BX, BX.Main, BX.UI.Accessibility, BX.UI.IconSet, window, window, window, BX.UI.Reaction.Item);
//# sourceMappingURL=reaction-picker.bundle.js.map
