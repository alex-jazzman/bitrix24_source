/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, main_core, main_popup, ui_iconSet_api_core, ui_iconSet_main, ui_a11y, ui_buttons, ui_cnt) {
	'use strict';

	class Mouse {
		#needTo = new WeakSet();
		#needCount = 0;
		#delta = {
			top: 0,
			left: 0
		};
		#position = {
			top: 0,
			left: 0
		};
		need(needTo) {
			if (this.#needTo.has(needTo)) {
				return;
			}
			this.#needTo.add(needTo);
			this.#needCount++;
			main_core.Event.bind(window, 'mousemove', this.#update);
		}
		notNeed(needTo) {
			if (!this.#needTo.has(needTo)) {
				return;
			}
			this.#needTo.delete(needTo);
			this.#needCount--;
			if (this.#needCount === 0) {
				main_core.Event.unbind(window, 'mousemove', this.#update);
			}
		}
		getPosition() {
			return this.#position;
		}
		getDelta() {
			return this.#delta;
		}
		#update = event => {
			const position = {
				top: event.clientY + window.scrollY,
				left: event.clientX + window.scrollX
			};
			this.#delta = {
				top: position.top - this.#position.top,
				left: position.left - this.#position.left
			};
			this.#position = position;
		};
	}
	const mouse = new Mouse();

	const MenuItemDesign = Object.freeze({
		Default: 'default',
		Accent1: 'accent-1',
		Accent2: 'accent-2',
		Alert: 'alert',
		Copilot: 'copilot',
		Disabled: 'disabled',
		BitrixGPT: 'bitrix-gpt'
	});
	const MenuSectionDesign = Object.freeze({
		Default: 'default',
		Accent: 'accent'
	});
	const MenuRichHeaderDesign = Object.freeze({
		Default: 'default',
		Copilot: 'copilot'
	});

	const defaultItemOptions = {
		closeOnSubItemClick: true
	};
	class MenuItem {
		#options;
		#callbacks;
		#subMenu;
		#element;
		#action;
		#showTimeout;
		#closeTimeout;
		#subMenuHovered;
		#subMenuOutdated = false;
		constructor(options, callbacks) {
			this.#options = {
				...defaultItemOptions,
				...options
			};
			this.#callbacks = callbacks;
		}
		update(options) {
			this.#options = {
				...defaultItemOptions,
				...options
			};
			this.#syncSubMenu();
			if (this.#element) {
				this.#refreshElement();
			}
		}
		getOptions() {
			return this.#options;
		}
		getSubMenu() {
			return this.#subMenu;
		}
		getActionElement() {
			return this.#action;
		}
		render() {
			if (this.#element) {
				return this.#element;
			}
			const uiButtonOptions = this.#options.uiButtonOptions;
			this.#action = uiButtonOptions ? new ui_buttons.Button(uiButtonOptions).render() : main_core.Tag.render`
				<button
					class="ui-popup-menu-item-action"
					title="${main_core.Text.encode(this.#options.title ?? '')}"
					onclick="${this.#handleClick}"
					onmouseenter="${this.#onMouseEnter}"
					onmouseleave="${this.#onMouseLeave}"
				>${this.#renderHeader()}${this.#renderButtons()}</button>
			`;
			this.#element = main_core.Tag.render`
			<div class="${this.#getClassName()}" role="none">
				${this.#action}
			</div>
		`;
			this.#applyAccessibilityAttributes();
			return this.#element;
		}
		isDisabled() {
			return this.#options.disabled === true || this.#options.design === MenuItemDesign.Disabled;
		}
		#getClassName() {
			const isUiButton = this.#options.uiButtonOptions ? ' --is-ui-button' : '';
			const design = this.#options.design ? ` --${this.#options.design}` : '';
			// An item may be unavailable without carrying the visual design (an explicit
			// `disabled` option), and it still has to look and read as unavailable.
			const disabled = this.isDisabled() && this.#options.design !== MenuItemDesign.Disabled ? ` --${MenuItemDesign.Disabled}` : '';
			return `ui-popup-menu-item${isUiButton}${design}${disabled}`;
		}
		#applyAccessibilityAttributes() {
			const action = this.#action;
			const isCheckbox = main_core.Type.isBoolean(this.#options.isSelected);
			action.setAttribute('role', isCheckbox ? 'menuitemcheckbox' : 'menuitem');
			if (isCheckbox) {
				action.setAttribute('aria-checked', this.#options.isSelected ? 'true' : 'false');
			}
			if (this.#options.subMenu) {
				action.setAttribute('aria-haspopup', 'menu');
				action.setAttribute('aria-expanded', 'false');
			}
			if (this.isDisabled()) {
				// APG keeps an unavailable item reachable: it is announced as disabled but
				// stays focusable, and whatever the consumer bound to it still runs (a
				// tariff hint, a "why is this off" popup).
				action.setAttribute('aria-disabled', 'true');
			}
		}
		#handleClick = () => {
			this.#options.onClick?.();
		};
		#syncSubMenu() {
			if (!this.#options.subMenu) {
				// A pending hover timer would build a submenu out of options that the
				// update has just taken away.
				clearTimeout(this.#showTimeout);
				clearTimeout(this.#closeTimeout);
			}
			if (!this.#subMenu) {
				return;
			}
			const shown = Boolean(this.#subMenu.getPopup()?.isShown());
			if (shown && this.#options.subMenu && this.#subMenu.getOptions().closeOnItemClick === false) {
				// A submenu that survives its own item clicks survives the parent's
				// update too: its items refresh in place, it stays open (nested levels
				// and focus included). The rest of its options belongs to the instance,
				// so it is rebuilt from the new ones once it closes.
				this.#subMenu.updateItems(this.#prepareSubMenuItemsOptions());
				this.#subMenuOutdated = true;
				return;
			}

			// A closed instance carries the previous generation's options: drop it,
			// the next showSubMenu builds a fresh one.
			clearTimeout(this.#showTimeout);
			clearTimeout(this.#closeTimeout);
			this.#subMenu.destroy();
			this.#subMenu = null;
		}
		#refreshElement() {
			// The element and action nodes are kept so focus, bound handlers and an open
			// submenu's parentItem reference survive; only content and attributes refresh.
			const hovered = main_core.Dom.hasClass(this.#element, '--hovered') ? ' --hovered' : '';
			this.#element.className = `${this.#getClassName()}${hovered}`;
			this.#action.setAttribute('title', this.#options.title ?? '');
			main_core.Dom.clean(this.#action);
			main_core.Dom.append(this.#renderHeader(), this.#action);
			main_core.Dom.append(this.#renderButtons(), this.#action);

			// The previous generation's states must not leak through. tabindex is left
			// alone: it belongs to the roving FocusZone, not to the item.
			['aria-checked', 'aria-haspopup', 'aria-expanded', 'aria-disabled'].forEach(name => this.#action.removeAttribute(name));
			this.#applyAccessibilityAttributes();
			if (this.#subMenu?.getPopup()?.isShown()) {
				this.#action.setAttribute('aria-expanded', 'true');
			}
		}
		showSubMenu = (options = {}) => {
			if (this.isDisabled()) {
				// An unavailable item is perceivable but not operable: its own onClick still
				// runs (that is how a consumer explains why it is off), but the level below
				// does not open — on any path, keyboard and hover alike.
				return;
			}
			if (this.#subMenuOutdated && !this.#subMenu?.getPopup()?.isShown()) {
				// It stayed open through the parent's update carrying the options of its own
				// generation, and now that it is closed it is rebuilt from the current ones.
				this.#subMenuOutdated = false;
				this.#subMenu.destroy();
				this.#subMenu = null;
			}
			clearTimeout(this.#showTimeout);
			clearTimeout(this.#closeTimeout);
			this.#subMenuHovered = false;
			this.#subMenu ??= new Menu({
				...this.#options.subMenu,
				parentItem: this.#action,
				onCloseAll: this.#callbacks.onCloseAll,
				hasTreeFocus: this.#callbacks.hasTreeFocus,
				targetContainer: this.#callbacks.getTargetContainer(),
				autoHide: false,
				items: this.#prepareSubMenuItemsOptions(),
				offsetLeft: this.#element.offsetWidth,
				offsetTop: -this.#element.offsetHeight,
				bindOptions: {
					forceBindPosition: true,
					forceTop: true,
					forceLeft: true
				},
				events: {
					onFirstShow: this.#onFirstShow,
					onShow: this.#onShow,
					onClose: this.#onClose,
					onDestroy: this.#onSubMenuDestroy
				}
			});

			// The opening source travels down explicitly: a hover open (no arguments)
			// must not move focus, a keyboard open focuses the first submenu item.
			this.#subMenu.show(this.#element, {
				viaKeyboard: options.viaKeyboard === true
			});
		};
		#prepareSubMenuItemsOptions() {
			return this.#options.subMenu.items.map(itemOptions => {
				if (!itemOptions) {
					return null;
				}
				return {
					...itemOptions,
					onClick: () => this.#onSubMenuItemClick(itemOptions)
				};
			});
		}
		adjustSubMenu = () => {
			// A hidden popup has nothing to reposition, and a self-destroyed one has no
			// container left to measure.
			if (!this.#subMenu?.getPopup()?.isShown()) {
				return;
			}
			let offsetLeft = this.#element.offsetWidth;
			let offsetTop = -this.#element.offsetHeight;
			this.#subMenu.getPopup().setOffset({
				offsetLeft,
				offsetTop
			});
			this.#subMenu.getPopup().adjustPosition();
			const targetContainer = this.#callbacks.getTargetContainer();
			const targetIsBody = targetContainer === document.body;
			const targetRect = {
				...targetContainer.getBoundingClientRect().toJSON(),
				...(targetIsBody ? {
					top: 0
				} : null),
				...(targetIsBody ? {
					right: window.innerWidth
				} : null),
				...(targetIsBody ? {
					bottom: window.innerHeight
				} : null),
				...(targetIsBody ? {
					left: 0
				} : null)
			};
			let popupRect = this.#subMenu.getPopupContainer().getBoundingClientRect();
			if (popupRect.right >= targetRect.right) {
				offsetLeft = -popupRect.width;
			}
			if (popupRect.bottom >= targetRect.bottom) {
				offsetTop = -popupRect.height;
			}
			this.#subMenu.getPopup().setOffset({
				offsetLeft,
				offsetTop
			});
			this.#subMenu.getPopup().adjustPosition();
			popupRect = this.#subMenu.getPopupContainer().getBoundingClientRect();
			if (popupRect.left <= targetRect.left) {
				offsetLeft = this.#element.offsetWidth;
			}
			if (popupRect.top <= targetRect.top) {
				offsetTop = -this.#element.offsetHeight;
			}
			this.#subMenu.getPopup().setOffset({
				offsetLeft,
				offsetTop
			});
			this.#subMenu.getPopup().adjustPosition();
		};
		closeSubMenu = () => {
			clearTimeout(this.#showTimeout);
			this.#subMenu?.close();
		};
		closeSubMenuWithTimeout() {
			clearTimeout(this.#closeTimeout);
			this.#closeTimeout = setTimeout(this.closeSubMenu, 200);
		}
		destroy() {
			// A pending hover timer would resurrect the submenu of a destroyed item.
			clearTimeout(this.#showTimeout);
			clearTimeout(this.#closeTimeout);
			this.#subMenu?.destroy();
		}
		#onMouseEnter = () => {
			if (this.isDisabled()) {
				return;
			}
			this.#subMenuHovered = false;
			this.#callbacks.onMouseEnter?.();
			if (this.#options.subMenu) {
				clearTimeout(this.#closeTimeout);
				this.#showTimeout = setTimeout(this.showSubMenu, 200);
			}
		};
		#onMouseLeave = event => {
			clearTimeout(this.#showTimeout);
			const subMenuContainer = this.#subMenu?.getPopupContainer();
			if (!this.#subMenuHovered && subMenuContainer && !subMenuContainer.contains(event.relatedTarget)) {
				const subMenuLeft = subMenuContainer.getBoundingClientRect().left + window.scrollX;
				const distance = mouse.getPosition().left - subMenuLeft;
				const distanceDelta = Math.abs(distance) - Math.abs(distance + mouse.getDelta().left);
				if (distanceDelta <= 1) {
					this.closeSubMenu();
				} else {
					this.closeSubMenuWithTimeout();
				}
			}
		};
		#onSubMenuItemClick(item) {
			item.onClick?.();
			if (!item.subMenu && this.#options.closeOnSubItemClick) {
				this.#callbacks.onSubMenuItemClick?.();
			}
		}
		#onFirstShow = () => {
			main_core.Event.bind(this.#subMenu.getPopupContainer(), 'mouseenter', () => {
				clearTimeout(this.#closeTimeout);
				this.#subMenuHovered = true;
			});
		};
		#onShow = () => {
			this.adjustSubMenu();
			main_core.Dom.addClass(this.#element, '--hovered');
			mouse.need(this);
		};
		#onClose = () => {
			main_core.Dom.removeClass(this.#element, '--hovered');
			mouse.notNeed(this);
		};
		#onSubMenuDestroy = () => {
			this.#onClose();

			// A popup with cacheable: false destroys itself on close, so the reference
			// would keep a dead instance that showSubMenu can never reopen.
			this.#subMenu = null;
		};
		#renderHeader() {
			return main_core.Tag.render`
			<div class="ui-popup-menu-item-header">
				${this.#renderTitle()}
				${this.#renderSubtitle()}
			</div>
		`;
		}
		#renderTitle() {
			return main_core.Tag.render`
			<div class="ui-popup-menu-item-title">
				${this.#renderLock()}
				<div class="ui-popup-menu-item-title-text">${main_core.Text.encode(this.#options.title)}</div>
				${this.#renderBadgeText()}
			</div>
		`;
		}
		#renderLock() {
			if (!this.#options.isLocked) {
				return '';
			}
			return main_core.Tag.render`
			<div class="ui-popup-menu-item-lock" aria-hidden="true">
				<div class="ui-icon-set --${ui_iconSet_api_core.Outline.LOCK_L}"></div>
			</div>
		`;
		}
		#renderBadgeText() {
			if (!main_core.Type.isStringFilled(this.#options.badgeText?.title)) {
				return '';
			}
			const badge = main_core.Tag.render`
			<div class="ui-popup-menu-item-badge-text">
				${main_core.Text.encode(this.#options.badgeText.title)}
			</div>
		`;
			const {
				color
			} = this.#options.badgeText;
			if (main_core.Type.isStringFilled(color)) {
				// setProperty, not a style string: a colour coming straight from consumer data
				// must not be able to bring a second declaration along with it.
				main_core.Dom.style(badge, '--badge-color', color);
			}
			return badge;
		}
		#renderSubtitle() {
			if (!main_core.Type.isStringFilled(this.#options.subtitle)) {
				return '';
			}
			return main_core.Tag.render`
			<div class="ui-popup-menu-item-subtitle">${main_core.Text.encode(this.#options.subtitle)}</div>
		`;
		}
		#renderButtons() {
			return main_core.Tag.render`
			<div class="ui-popup-menu-item-buttons">
				${this.#renderCheck()}
				${this.#renderExtra()}
				${this.#renderCounter()}
				${this.#renderIcon()}
				${this.#renderArrow()}
			</div>
		`;
		}
		#renderCheck() {
			if (!main_core.Type.isBoolean(this.#options.isSelected)) {
				return '';
			}
			if (!this.#options.isSelected) {
				return main_core.Tag.render`
				<div class="ui-popup-menu-item-check" aria-hidden="true"></div>
			`;
			}
			return main_core.Tag.render`
			<div class="ui-popup-menu-item-check" aria-hidden="true">
				<div class="ui-icon-set --${ui_iconSet_api_core.Outline.CHECK_L}"></div>
			</div>
		`;
		}
		#renderExtra() {
			if (!this.#options.extraIcon) {
				return '';
			}
			const extra = main_core.Tag.render`
			<div class="ui-popup-menu-item-extra ${this.#options.extraIcon.isSelected ? '--selected' : ''}">
				<div class="ui-icon-set --${this.#options.extraIcon.icon}"></div>
			</div>
		`;
			main_core.Event.bind(extra, 'click', event => {
				this.#options.extraIcon.onClick();
				event.stopPropagation();
			}, true);
			return extra;
		}
		#renderCounter() {
			if (!this.#options.counter) {
				return '';
			}
			if (!this.#options.counter.value) {
				return main_core.Tag.render`
				<div class="ui-popup-menu-item-counter" aria-hidden="true"></div>
			`;
			}

			// A non-empty counter carries meaning (e.g. an unread count) and joins the
			// item's accessible name, so it is not hidden from the a11y tree.
			return main_core.Tag.render`
			<div class="ui-popup-menu-item-counter">
				${new ui_cnt.Counter({
			color: ui_cnt.CounterColor.DANGER,
			...this.#options.counter
		}).render()}
			</div>
		`;
		}
		#renderIcon() {
			if (this.#options.icon) {
				return main_core.Tag.render`
				<div class="ui-popup-menu-item-icon" aria-hidden="true">
					<div class="ui-icon-set --${this.#options.icon}"></div>
				</div>
			`;
			}
			if (this.#options.svg) {
				return main_core.Tag.render`
				<div class="ui-popup-menu-item-svg" aria-hidden="true">
					${this.#options.svg}
				</div>
			`;
			}
			return '';
		}
		#renderArrow() {
			if (!this.#options.subMenu) {
				return '';
			}
			return main_core.Tag.render`
			<div class="ui-popup-menu-item-arrow" aria-hidden="true">
				<div class="ui-icon-set --${ui_iconSet_api_core.Outline.CHEVRON_RIGHT_L}"></div>
			</div>
		`;
		}
	}

	/**
	 * Enter and Space activate a control the way a mouse click does, so a consumer
	 * handler always receives a real MouseEvent. Returns whether the key was an
	 * activation one.
	 */
	const activateByKey = (event, target) => {
		if (event.key !== 'Enter' && event.key !== ' ') {
			return false;
		}
		event.preventDefault();
		target.click();
		return true;
	};

	const ITEM_SELECTOR = '[role="menuitem"], [role="menuitemcheckbox"]';
	const NAVIGATION_KEYS = new Set(['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']);
	const POINTER_FOCUS_CLASS = '--pointer-focus';
	const TYPEAHEAD_RESET_DELAY = 500;
	const SCROLL_HOVER_MUTE_DELAY = 100;
	// Diacritics do not have to be typed: "e" matches "Éditer", as in the legacy menu.
	const collator = new Intl.Collator(undefined, {
		sensitivity: 'base'
	});

	// The single source of truth for the item set: the FocusZone, the initial focus
	// target and the typeahead all walk the same filter, so a natively disabled or
	// hidden item never falls out of one set while staying in another.
	const isMenuItem = element => element.matches(ITEM_SELECTOR);
	/**
	 * Keyboard support for one level of a `ui.system.menu` popup: arrows, Home / End
	 * and PageUp / PageDown come from the `FocusZone`, the rest is here.
	 *
	 * Escape is left to `main.popup`: its keyup queue closes only the top-most popup.
	 */
	class MenuKeyboard {
		#itemsContainer;
		#eventContainer;
		#isSubMenu;
		#richHeader;
		#onClose;
		#onCloseAll;
		#onOpenSubMenu;
		#onItemFocusMoved;
		#isFocusInsideMenu;
		#focusZone;
		#lastPointerPosition = null;
		#scrolledUntil = 0;
		#typeaheadBuffer = '';
		#typeaheadTimer = 0;
		#keyDownHandler = this.#handleKeyDown.bind(this);
		#mouseOverHandler = this.#handleMouseOver.bind(this);
		#mouseLeaveHandler = () => {
			// The pointer no longer points at anything here: the focused item must stop
			// looking hovered and get its keyboard outline back.
			this.#setPointerFocus(false);
			this.#lastPointerPosition = null;
		};
		#scrollHandler = () => {
			this.#scrolledUntil = Date.now() + SCROLL_HOVER_MUTE_DELAY;
		};
		constructor(options) {
			this.#itemsContainer = options.itemsContainer;
			this.#eventContainer = options.eventContainer;
			this.#isSubMenu = options.isSubMenu;
			this.#richHeader = options.richHeader;
			this.#onClose = options.onClose;
			this.#onCloseAll = options.onCloseAll;
			this.#onOpenSubMenu = options.onOpenSubMenu;
			this.#onItemFocusMoved = options.onItemFocusMoved;
			this.#isFocusInsideMenu = options.isFocusInsideMenu;
			this.#focusZone = new ui_a11y.FocusZone(this.#itemsContainer, {
				bindKeys: ui_a11y.FocusKeys.ArrowVertical | ui_a11y.FocusKeys.HomeAndEnd | ui_a11y.FocusKeys.PageUpDown,
				focusOutBehavior: 'wrap',
				focusableElementFilter: isMenuItem
			});
		}
		activate() {
			// The FocusZone holds the activity state for the whole controller.
			if (this.#focusZone.isActive()) {
				return;
			}
			this.#focusZone.activate();
			main_core.Event.bind(this.#eventContainer, 'keydown', this.#keyDownHandler);
			main_core.Event.bind(this.#itemsContainer, 'mouseover', this.#mouseOverHandler);
			main_core.Event.bind(this.#itemsContainer, 'mouseleave', this.#mouseLeaveHandler);
			// Scroll does not bubble, hence the capture phase.
			main_core.Event.bind(this.#eventContainer, 'scroll', this.#scrollHandler, true);
		}
		isActive() {
			return this.#focusZone.isActive();
		}
		deactivate() {
			if (!this.#focusZone.isActive()) {
				return;
			}
			this.#focusZone.deactivate();
			main_core.Event.unbind(this.#eventContainer, 'keydown', this.#keyDownHandler);
			main_core.Event.unbind(this.#itemsContainer, 'mouseover', this.#mouseOverHandler);
			main_core.Event.unbind(this.#itemsContainer, 'mouseleave', this.#mouseLeaveHandler);
			main_core.Event.unbind(this.#eventContainer, 'scroll', this.#scrollHandler, true);
			this.#setPointerFocus(false);
			this.#scrolledUntil = 0;
			this.#lastPointerPosition = null;
			this.#clearTypeahead();
		}

		/**
		 * Re-reads the item set after the menu re-rendered its items into the same
		 * container: the roving tabindex and the navigation order follow the new set.
		 */
		refresh() {
			this.#focusZone.refreshElements();
		}
		destroy() {
			this.deactivate();
		}
		getInitialFocusTarget() {
			return this.#getFirstItem();
		}

		/**
		 * Where the focus sits within the item set, so an update that drops the focused
		 * item can put the focus back at the same place instead of the top.
		 */
		getFocusedPosition() {
			return this.#getItems().indexOf(ui_a11y.FocusNavigator.getActiveElement(this.#itemsContainer));
		}
		getItemAtPosition(position) {
			if (position < 0) {
				return null;
			}
			const items = this.#getItems();
			return items[Math.min(position, items.length - 1)] ?? null;
		}
		#getItems() {
			const walker = ui_a11y.FocusNavigator.createWalker(this.#itemsContainer, {
				accept: isMenuItem
			});
			const items = [];
			for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
				items.push(node);
			}
			return items;
		}
		#getFirstItem() {
			// tabbableOnly defaults to true in FocusNavigator, but under a roving tabindex
			// every item but the current one is tabindex="-1".
			return ui_a11y.FocusNavigator.getFirst(this.#itemsContainer, {
				accept: isMenuItem,
				tabbableOnly: false
			});
		}
		#getLastItem() {
			return ui_a11y.FocusNavigator.getLast(this.#itemsContainer, {
				accept: isMenuItem,
				tabbableOnly: false
			});
		}
		#handleKeyDown(event) {
			if (!ui_a11y.InputModalityTracker.isBareModifier(event.key)) {
				// Any real key means the user is back on the keyboard: the focused item
				// must read as focused again, not as merely hovered.
				this.#setPointerFocus(false);
			}
			if (event.defaultPrevented) {
				// The FocusZone already handled this key (focus is on a menu item).
				if (NAVIGATION_KEYS.has(event.key)) {
					this.#onItemFocusMoved();
				}
				return;
			}
			const {
				key,
				target
			} = event;
			if (this.#isOutsideItems(target) && !this.#spansWholePopup(key, target)) {
				// Focus sits on a control of the popup itself (a rich header, a title bar
				// field), not on a menu item: menu keys must not hijack its input.
				return;
			}
			if (NAVIGATION_KEYS.has(key)) {
				this.#handleNavigationBootstrap(event);
				return;
			}
			switch (key) {
				case 'Enter':
				case ' ':
					this.#activateCurrent(event);
					break;
				case 'ArrowRight':
					this.#openSubMenu(event);
					break;
				case 'ArrowLeft':
					this.#closeLevel(event);
					break;
				case 'Tab':
					this.#handleTab(event);
					break;
				default:
					this.#handleTypeahead(event);
			}
		}
		#isOutsideItems(target) {
			return main_core.Type.isElementNode(target) && target !== this.#eventContainer && !this.#itemsContainer.contains(target);
		}
		#spansWholePopup(key, target) {
			// Tab spans the popup wherever focus sits, and so does menu navigation — unless
			// the focused control consumes those keys itself: a field moves its caret, a
			// <select> walks its own options.
			return key === 'Tab' || NAVIGATION_KEYS.has(key) && !ui_a11y.InteractivityChecker.isEditable(target);
		}
		#handleNavigationBootstrap(event) {
			// Reached only when the FocusZone did not act, i.e. focus is not on a
			// managed item yet (popup container after a pointer open, rich header).
			if (this.#itemsContainer.contains(ui_a11y.FocusNavigator.getActiveElement(this.#itemsContainer))) {
				return;
			}

			// The key belongs to the menu either way: an empty menu must not scroll the
			// page (and the popup along with the bind element) behind itself.
			event.preventDefault();
			const target = event.key === 'ArrowUp' || event.key === 'End' || event.key === 'PageDown' ? this.#getLastItem() : this.#getFirstItem();
			if (target) {
				target.focus({
					preventScroll: true
				});
				this.#onItemFocusMoved();
			}
		}
		#handleMouseOver(event) {
			// A scroll re-fires mouseover for whatever slid under a still cursor, so a
			// hover right after one is not the user pointing at an item: arrow navigation
			// scrolls the list itself, and the focus must stay where the keyboard put it.
			if (Date.now() < this.#scrolledUntil) {
				return;
			}
			const pointerMoved = this.#lastPointerPosition === null || this.#lastPointerPosition.left !== event.clientX || this.#lastPointerPosition.top !== event.clientY;
			this.#lastPointerPosition = {
				left: event.clientX,
				top: event.clientY
			};
			const action = this.#getEventItem(event);
			if (!pointerMoved || !action || !this.#canSyncHoverFocus()) {
				return;
			}

			// Hover is pointer input: the item under the mouse must read as hovered,
			// without the keyboard outline, even right after arrow navigation.
			this.#setPointerFocus(true);
			if (action !== ui_a11y.FocusNavigator.getActiveElement(action)) {
				action.focus({
					preventScroll: true
				});
			}
		}
		#canSyncHoverFocus() {
			// Hover must not steal focus from an interactive control of the popup, nor from
			// anything outside this menu's own tree (another open menu included). The popup
			// container itself holds no control: it is where a pointer-opened menu starts.
			return ui_a11y.FocusNavigator.getActiveElement(this.#eventContainer) === this.#eventContainer || this.#isFocusInsideMenu();
		}
		#setPointerFocus(enabled) {
			// A local marker instead of the global input modality: hover is not a document
			// -wide input event, and other widgets must not read it as one.
			if (enabled) {
				main_core.Dom.addClass(this.#itemsContainer, POINTER_FOCUS_CLASS);
			} else {
				main_core.Dom.removeClass(this.#itemsContainer, POINTER_FOCUS_CLASS);
			}
		}
		#activateCurrent(event) {
			const action = this.#getEventItem(event);
			if (!action) {
				// Space with focus on the popup container itself (a pointer-opened menu
				// before the first navigation) must not scroll the page behind the menu.
				if (event.key === ' ' && event.target === this.#eventContainer) {
					event.preventDefault();
				}
				return;
			}

			// The same reach as a mouse click, whatever the item carries: a click handler,
			// a submenu, or both (a parent item may run an action and open its submenu).
			activateByKey(event, action);
			if (action.getAttribute('aria-haspopup') === 'menu') {
				this.#onOpenSubMenu(action);
			}
		}
		#handleTab(event) {
			if (this.#richHeader) {
				// An interactive rich header turns Tab / Shift+Tab into a closed cycle
				// over the header, the current menu item and the rest of the focusable
				// other popup controls; the menu never closes.
				this.#cycleRichHeaderFocus(event);
				return;
			}
			const from = this.#getTabOrigin(event);
			if (from && this.#getTabNeighbour(from, event.shiftKey, false)) {
				// Focus moves between the items and the other focusable popup controls (a rich
				// header, title bar controls, the close icon): the trap handles it.
				return;
			}

			// Tab would cross the outer popup boundary (a looped trap would wrap it) or
			// focus sits outside any tabbable: close every menu level (APG).
			event.preventDefault();
			this.#onCloseAll();
		}
		#cycleRichHeaderFocus(event) {
			event.preventDefault();
			const from = this.#getTabOrigin(event);
			if (!from) {
				// From the popup container (a pointer-opened menu): step onto the header.
				this.#richHeader.focus({
					preventScroll: true
				});
				return;
			}
			const target = this.#getTabNeighbour(from, event.shiftKey, true);
			if (!target || target === from) {
				// Nothing but the header (an empty menu, no other controls): the header must not
				// become an endless Tab cycle, so close every menu level.
				this.#onCloseAll();
				return;
			}
			target.focus({
				preventScroll: true
			});
		}
		#getTabNeighbour(from, reversed, wrap) {
			// The same tabbable set the FocusTrap walks, so the predicted boundary cannot
			// drift apart from where the trap actually wraps focus.
			const options = {
				from,
				tabbableOnly: true,
				wrap
			};
			return reversed ? ui_a11y.FocusNavigator.getPrevious(this.#eventContainer, options) : ui_a11y.FocusNavigator.getNext(this.#eventContainer, options);
		}
		#getTabOrigin(event) {
			// The popup container is not a tabbable itself: Tab from it has no neighbour
			// to step to, it either enters the popup controls or leaves the menu.
			const {
				target
			} = event;
			const isInside = main_core.Type.isElementNode(target) && target !== this.#eventContainer && this.#eventContainer.contains(target);
			return isInside ? target : null;
		}
		#openSubMenu(event) {
			const action = this.#getEventItem(event);
			if (!action || action.getAttribute('aria-haspopup') !== 'menu') {
				return;
			}
			event.preventDefault();
			this.#onOpenSubMenu(action);
		}
		#closeLevel(event) {
			if (!this.#isSubMenu) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			this.#onClose();
		}
		#getEventItem(event) {
			const {
				target
			} = event;
			return main_core.Type.isElementNode(target) ? this.#getOwnItem(target) : null;
		}
		#getOwnItem(node) {
			const action = node.closest(ITEM_SELECTOR);
			return action && this.#itemsContainer.contains(action) ? action : null;
		}
		#handleTypeahead(event) {
			// 229 flags a composition keystroke (IME) in engines that do not set isComposing.
			if (event.isComposing || event.keyCode === 229) {
				return;
			}

			// AltGr types a third-level character and reports itself as Ctrl+Alt on Windows,
			// so such a keystroke is input, not a shortcut.
			const altGraph = event.getModifierState('AltGraph') || event.ctrlKey && event.altKey;
			if (!altGraph && (event.ctrlKey || event.metaKey || event.altKey)) {
				return;
			}
			const char = event.key;
			if (char.length !== 1 || char === ' ') {
				return;
			}
			event.preventDefault();
			this.#typeaheadBuffer += char;
			this.#restartTypeaheadTimer();
			const match = this.#findTypeaheadMatch();
			if (match) {
				// The modality tracker treats any non-modifier key as keyboard input,
				// so the matched item gets the visible keyboard outline on focus.
				match.focus({
					preventScroll: true
				});
				this.#onItemFocusMoved();
			}
		}
		#findTypeaheadMatch() {
			const items = this.#getItems();

			// A buffer of one repeated character means the user is cycling through the
			// items that start with it (APG), so it collapses to that single character.
			const buffer = this.#typeaheadBuffer;
			const query = new Set(buffer).size === 1 ? buffer[0] : buffer;

			// A single character cycles, so the search starts after the focused item and
			// wraps around onto it. A longer prefix is a refinement (APG): the focused
			// item is checked first and keeps focus while it still matches.
			const currentIndex = items.indexOf(ui_a11y.FocusNavigator.getActiveElement(this.#itemsContainer));
			const startIndex = this.#getTypeaheadStartIndex(currentIndex, query.length);
			const candidates = [...items.slice(startIndex), ...items.slice(0, startIndex)];
			return candidates.find(element => {
				const label = this.#getItemLabel(element).slice(0, query.length);
				return collator.compare(query, label) === 0;
			}) ?? null;
		}
		#getTypeaheadStartIndex(currentIndex, queryLength) {
			if (currentIndex === -1) {
				return 0;
			}
			return queryLength === 1 ? currentIndex + 1 : currentIndex;
		}
		#getItemLabel(action) {
			const titleNode = action.querySelector('.ui-popup-menu-item-title-text');
			const text = titleNode ? titleNode.textContent : action.textContent;
			return (text ?? '').trim();
		}
		#restartTypeaheadTimer() {
			clearTimeout(this.#typeaheadTimer);
			this.#typeaheadTimer = setTimeout(() => {
				this.#typeaheadBuffer = '';
			}, TYPEAHEAD_RESET_DELAY);
		}
		#clearTypeahead() {
			clearTimeout(this.#typeaheadTimer);
			this.#typeaheadBuffer = '';
		}
	}

	const BASE_SECTION_CODE = 'base';

	// Module level on purpose: a deferred restore must outlive its menu without
	// keeping the instance (items and popup included) alive through the closure.
	const restoreStampedTabIndex = (trigger, value) => {
		if (trigger.getAttribute('aria-expanded') === 'true') {
			// Another menu is open on the same trigger and owns the stamp now: dropping
			// tabindex would leave that menu unable to give the focus back.
			return;
		}
		if (main_core.Type.isString(value)) {
			trigger.setAttribute('tabindex', value);
		} else {
			trigger.removeAttribute('tabindex');
		}
	};
	class Menu {
		#options;
		#items;
		#popup;
		#container;
		#itemsContainer;
		#richHeader = null;
		#bindElement;
		#keyboard;
		#triggerWithGeneratedId = null;
		// The consumer's own attribute values, remembered on the first overwrite: a key is
		// present exactly for what the menu has stamped, so the node returns to its prior
		// state on destroy.
		#stampedTrigger = null;
		#openedViaKeyboard = false;
		#focusOrigin = null;
		#destroyed = false;
		constructor(options) {
			const defaultOptions = {
				noAllPaddings: true,
				autoHide: true,
				closeByEsc: true,
				autoHideHandler: this.#shouldHide,
				closeOnItemClick: true
			};
			this.#options = {
				...defaultOptions,
				...options
			};
		}
		getOptions() {
			return this.#options;
		}
		getPopup() {
			return this.#popup;
		}
		getPopupContainer() {
			return this.#popup.getPopupContainer();
		}
		show(bindElement, options = {}) {
			if (this.#destroyed || this.#popup?.isDestroyed()) {
				// Popup.show() would silently no-op, so the trigger must not be marked
				// expanded for a menu that can no longer appear.
				return;
			}

			// A submenu passes its opening source explicitly: a hover open would keep
			// reporting the stale modality of the last keydown / pointerdown.
			this.#openedViaKeyboard = options.viaKeyboard ?? this.#getInputModality() === 'keyboard';
			this.#items ??= this.#prepareItems(this.#options.items);
			this.#popup ??= new main_popup.Popup({
				...this.#options,
				// The popup container is the menu itself: role="menu" belongs to it, so the
				// tree has no dialog wrapper around the items and no second nested menu.
				role: this.#options.role ?? 'menu',
				content: this.#render(),
				focusTrap: this.#resolveFocusTrapOptions(),
				// Both sets go to Popup as they are, the menu's own first: a consumer handler
				// keeps the Popup contract — a string listener, the BaseEvent argument and
				// every event, the menu intercepts included.
				events: [{
					onShow: this.#onPopupShow,
					onClose: this.#onPopupClose,
					onDestroy: this.#onPopupDestroy,
					onBeforeAdjustPosition: this.#onBeforeAdjustPosition
				}, this.#options.events ?? {}]
			});
			this.#keyboard ??= this.#createKeyboard();
			const nextBindElement = Menu.#resolveTrigger(bindElement ?? this.#options.bindElement);
			if (!this.#options.parentItem && main_core.Type.isDomNode(this.#bindElement) && this.#bindElement !== nextBindElement) {
				// The ARIA attributes and the generated id stamped on the previous
				// trigger belong to this menu and must not survive a re-bind.
				this.#clearTriggerAria(this.#bindElement);
			}
			this.#bindElement = nextBindElement;
			this.#popup.setBindElement(this.#bindElement);
			this.#syncMenuName();
			// Where the focus came from, before the menu takes it (see #getRestoreTarget).
			this.#rememberFocusOrigin();
			// The expanded state and the opening focus belong to #onPopupShow: Popup.show()
			// no-ops while the popup is still shown (a closing animation, a repeated show),
			// and the trigger must not report a menu that never appeared.
			this.#popup.show();
		}
		static #resolveTrigger(bindElement) {
			// A Vue ref holds the component instance, not its root node, and the trigger
			// is expected to be a node: it carries the menu's ARIA and takes the focus back.
			return main_core.Type.isObject(bindElement) && main_core.Type.isDomNode(bindElement.$el) ? bindElement.$el : bindElement;
		}
		#resolveFocusTrapOptions() {
			const {
				focusTrap
			} = this.#options;
			if (focusTrap === false) {
				return false;
			}

			// An open menu always holds the focus, so the trap is not left to the dialog
			// default: it is always there to isolate and loop Tab. Moving focus stays the
			// menu's own job (#applyOpeningFocus / #restoreFocusOnClose), and a consumer
			// object still overrides any of it per key.
			const menuOwnedFocus = {
				initialFocus: false,
				restoreFocus: false,
				looped: true
			};
			return main_core.Type.isPlainObject(focusTrap) ? {
				...menuOwnedFocus,
				...focusTrap
			} : menuOwnedFocus;
		}
		#restoreFocusOnClose() {
			if (this.#options.focusTrap === false || this.#isTrapOptionOverridden('restoreFocus')) {
				return;
			}

			// Focus the user has moved to another control stays put; lost focus (a consumer
			// onClick opened a native dialog) counts as still inside and comes back.
			const active = ui_a11y.FocusNavigator.getActiveElement();
			if (!ui_a11y.FocusNavigator.isFocusLost() && !this.#treeContainsNode(active)) {
				return;
			}
			ui_a11y.FocusNavigator.restoreFocus(this.#options.parentItem ?? this.#getRestoreTarget(), {
				preventScroll: true
			});
		}
		#getRestoreTarget() {
			// The trigger owns the menu, so focus goes back to it — unless the menu took
			// focus from a control the trigger wraps (a field inside a BInput): then the
			// caret returns exactly where it was.
			const origin = this.#focusOrigin;
			const insideTrigger = main_core.Type.isDomNode(origin) && main_core.Type.isDomNode(this.#bindElement) && this.#bindElement.contains(origin);
			if (insideTrigger && ui_a11y.InteractivityChecker.isFocusable(origin)) {
				return origin;
			}

			// A context menu is bound to coordinates or to a MouseEvent, so there is no
			// trigger to focus: the focus goes back where the menu took it from.
			return main_core.Type.isDomNode(this.#bindElement) ? this.#bindElement : origin;
		}
		#rememberFocusOrigin() {
			const active = ui_a11y.FocusNavigator.getActiveElement();
			if (main_core.Type.isElementNode(active) && !this.#treeContainsNode(active)) {
				this.#focusOrigin = active;
			}
		}
		#applyOpeningFocus() {
			if (this.#options.focusTrap === false || this.#isTrapOptionOverridden('initialFocus')) {
				return;
			}

			// A hover-opened submenu must not move focus at all; a keyboard open — including
			// a repeated one (APG: ArrowRight on an expanded parent) — focuses the item.
			if (!this.#openedViaKeyboard) {
				if (!this.#options.parentItem) {
					this.getPopupContainer().focus({
						preventScroll: true
					});
				}
				return;
			}

			// The container is the fallback entry point: without focus inside the popup no
			// menu key ever reaches it.
			(this.#keyboard?.getInitialFocusTarget() ?? this.getPopupContainer()).focus({
				preventScroll: true
			});
		}
		#isTrapOptionOverridden(key) {
			return main_core.Type.isPlainObject(this.#options.focusTrap) && key in this.#options.focusTrap;
		}
		#createKeyboard() {
			return new MenuKeyboard({
				itemsContainer: this.#itemsContainer,
				eventContainer: this.getPopupContainer(),
				isSubMenu: Boolean(this.#options.parentItem),
				richHeader: this.#richHeader,
				onClose: () => this.close(),
				onCloseAll: () => this.#closeAllLevels(),
				onOpenSubMenu: this.#openSubMenuByKeyboard,
				onItemFocusMoved: this.#closeSubMenusExceptFocused,
				// Hover may take focus only from within this menu's own tree — never from
				// another popup that happens to be open with focus inside it.
				isFocusInsideMenu: () => this.#hasTreeFocus()
			});
		}
		#hasTreeFocus() {
			// Every level asks the root, so a level sees the focus on a sibling item of an
			// upper level too, not only on itself and below.
			return this.#options.hasTreeFocus?.() ?? this.#hasMenuOwnedFocus();
		}
		#hasMenuOwnedFocus() {
			// Focus on a part of the tree the menu itself moves focus across: an item of
			// any level, or the parent item this level hangs from. The popup's own controls
			// (a rich header, a title bar field) are deliberately left out — the menu never
			// takes focus away from them.
			const parentItem = this.#options.parentItem;
			const active = ui_a11y.FocusNavigator.getActiveElement();
			if (main_core.Type.isDomNode(parentItem) && parentItem.contains(active)) {
				return true;
			}
			if (this.#itemsContainer?.contains(active)) {
				return true;
			}
			return Boolean(this.#items?.some(item => {
				return item.getSubMenu()?.#hasMenuOwnedFocus() === true;
			}));
		}

		/**
		 * The keyboard has moved the roving focus to another item: a level opened from the
		 * item the focus just left has no owner on screen anymore, so it goes with it.
		 *
		 * Hover never reaches here — its own grace period for a diagonal trip towards the
		 * open submenu (`closeSubMenuWithTimeout`) stays as it is.
		 */
		#closeSubMenusExceptFocused = () => {
			const focused = this.#getFocusedItem();
			this.#items?.forEach(item => {
				if (item && item !== focused) {
					item.closeSubMenu();
				}
			});
		};
		#openSubMenuByKeyboard = action => {
			const item = this.#items.find(it => it.getActionElement() === action);
			if (!item) {
				return;
			}

			// A submenu opened by hover leaves the focus on its parent item, and Popup.show()
			// no-ops on a shown popup: #onPopupShow — the opening focus with it — never runs
			// again, so the level the user just asked for takes the focus here (APG). The
			// keyboard state, not the popup one, tells an open level from one in its closing
			// animation: the latter is still "shown" while no longer navigable.
			const openLevel = item.getSubMenu();
			const wasNavigable = openLevel?.#keyboard?.isActive() === true;
			item.showSubMenu({
				viaKeyboard: true
			});
			if (wasNavigable) {
				openLevel.#applyOpeningFocus();
			}
		};
		#getInputModality() {
			return ui_a11y.FocusMonitor.Instance.getModalityTracker().getLastModality();
		}
		#syncTriggerExpanded(expanded) {
			// A submenu is anchored to its parent item's action for positioning, but
			// the trigger that owns aria-expanded is that action itself, not the popup
			// bind element. A top-level menu is anchored to its own trigger.
			const trigger = this.#options.parentItem ?? this.#bindElement;
			if (!main_core.Type.isDomNode(trigger)) {
				return;
			}
			if (this.#options.parentItem) {
				// A submenu's parent item carries its permanent ARIA from MenuItem; only the
				// transient state belongs to this level.
				trigger.setAttribute('aria-haspopup', 'menu');
				trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
				return;
			}
			if (this.#stampedTrigger?.trigger !== trigger) {
				this.#stampedTrigger = {
					trigger,
					saved: new Map()
				};
			}
			this.#stampTrigger('aria-haspopup', 'menu');
			this.#stampTrigger('aria-expanded', expanded ? 'true' : 'false');
			if (!ui_a11y.InteractivityChecker.isFocusable(trigger)) {
				// The public contract accepts any HTMLElement as trigger: tabindex="-1"
				// lets the close-restore focus it without joining the tab order. Only a
				// tabindex the menu wrote is restored later — the attribute may otherwise
				// belong to a roving FocusZone that owns the trigger.
				this.#stampTrigger('tabindex', '-1');
			}
		}
		#stampTrigger(name, value) {
			const {
				trigger,
				saved
			} = this.#stampedTrigger;
			if (!saved.has(name)) {
				saved.set(name, trigger.getAttribute(name));
			}
			trigger.setAttribute(name, value);
		}
		#syncMenuName() {
			const menu = this.#popup?.getPopupContainer();
			if (!menu) {
				return;
			}
			menu.setAttribute('aria-orientation', 'vertical');

			// The name computed for the previous trigger must not survive a re-show:
			// a stale aria-labelledby may point to a removed id.
			menu.removeAttribute('aria-labelledby');
			menu.removeAttribute('aria-label');

			// An explicit consumer label wins over the trigger (Popup applies it too, but
			// only once, at creation time).
			if (main_core.Type.isStringFilled(this.#options.ariaLabel)) {
				menu.setAttribute('aria-label', this.#options.ariaLabel);
				return;
			}
			const trigger = this.#options.parentItem ?? this.#bindElement;
			if (main_core.Type.isDomNode(trigger) && this.#applyTriggerName(trigger, menu)) {
				return;
			}

			// No named trigger: fall back to the rich header title; without one the
			// menu legitimately stays unnamed.
			const {
				title
			} = this.#options.richHeader ?? {};
			if (main_core.Type.isStringFilled(title)) {
				menu.setAttribute('aria-label', title);
			}
		}
		#applyTriggerName(trigger, menu) {
			// Trigger name sources in the accessible-name precedence order.
			const labelledBy = trigger.getAttribute('aria-labelledby');
			if (main_core.Type.isStringFilled(labelledBy)) {
				menu.setAttribute('aria-labelledby', labelledBy);
				return true;
			}
			const ariaLabel = trigger.getAttribute('aria-label');
			if (main_core.Type.isStringFilled(ariaLabel)) {
				menu.setAttribute('aria-label', ariaLabel);
				return true;
			}
			if (main_core.Type.isStringFilled(trigger.textContent?.trim())) {
				menu.setAttribute('aria-labelledby', this.#ensureTriggerId(trigger));
				return true;
			}
			const title = trigger.getAttribute('title');
			if (main_core.Type.isStringFilled(title)) {
				menu.setAttribute('aria-label', title);
				return true;
			}
			return false;
		}
		#ensureTriggerId(trigger) {
			if (main_core.Type.isStringFilled(trigger.id)) {
				return trigger.id;
			}
			const id = `ui-popup-menu-trigger-${main_core.Text.getRandom(8).toLowerCase()}`;
			trigger.setAttribute('id', id);
			this.#triggerWithGeneratedId = trigger;
			return id;
		}
		#clearTriggerAria(trigger = this.#options.parentItem ?? this.#bindElement) {
			if (main_core.Type.isDomNode(trigger)) {
				if (this.#options.parentItem) {
					// A submenu's parent item structurally owns the popup, so aria-haspopup="menu"
					// is part of its permanent markup (set in MenuItem) and must stay. Only the
					// transient expanded state is reset here. A top-level trigger, whose ARIA the
					// menu added on show, gets a full cleanup below.
					trigger.setAttribute('aria-expanded', 'false');
				} else {
					this.#restoreTriggerAria(trigger);
				}
			}

			// The bind element is consumer-owned and outlives the menu, so an id the
			// menu stamped on it is removed too, returning the node to its prior state.
			if (this.#triggerWithGeneratedId === trigger) {
				this.#triggerWithGeneratedId.removeAttribute('id');
				this.#triggerWithGeneratedId = null;
			}
		}
		#restoreTriggerAria(trigger) {
			const saved = this.#stampedTrigger?.trigger === trigger ? this.#stampedTrigger.saved : new Map([['aria-haspopup', null], ['aria-expanded', null]]);
			saved.forEach((value, name) => {
				if (name === 'tabindex') {
					this.#restoreStampedTabIndex(trigger, value);
					return;
				}
				this.#restoreAttribute(trigger, name, value);
			});
			this.#stampedTrigger = null;
		}
		#restoreStampedTabIndex(trigger, value) {
			if (ui_a11y.FocusNavigator.getActiveElement(trigger) !== trigger) {
				restoreStampedTabIndex(trigger, value);
				return;
			}

			// Dropping tabindex from the focused node blurs it in Chromium — the focus the
			// menu has just restored would be lost. The node returns to its prior state as
			// soon as the focus leaves it on its own.
			main_core.Event.bindOnce(trigger, 'blur', () => restoreStampedTabIndex(trigger, value));
		}
		#restoreAttribute(element, name, value) {
			if (main_core.Type.isString(value)) {
				element.setAttribute(name, value);
			} else {
				element.removeAttribute(name);
			}
		}
		updateItems(itemsOptions) {
			if (this.#destroyed) {
				// Otherwise the update builds fresh items for a menu nothing points at any
				// more and renders them into a detached container.
				return;
			}
			const focusedItem = this.#getFocusedItem();
			const focusedPosition = this.#keyboard?.getFocusedPosition() ?? -1;
			const hadFocusInside = Boolean(this.#popup?.isShown()) && this.#treeContainsNode(ui_a11y.FocusNavigator.getActiveElement());
			const openedSubMenuIndex = this.#getOpenedSubMenuIndex();
			const openedSubMenu = this.#getSubMenuAt(openedSubMenuIndex);
			const focusedSubItemKey = this.#getFocusedSubItemKey(openedSubMenu);
			this.#reconcileItems(itemsOptions);
			this.#render();
			this.#syncMenuName();
			// The containers and the rich header survive a re-render, so the keyboard
			// controller keeps its FocusZone and only re-reads the item set.
			this.#keyboard?.refresh();
			this.#reopenSubMenuAt(openedSubMenuIndex);

			// A level rebuilt from scratch has to take the focus back itself: the item it
			// stood on is a level below, so the checks for the surviving tree never see it.
			const levelRebuilt = hadFocusInside && this.#getSubMenuAt(openedSubMenuIndex) !== openedSubMenu;
			if (levelRebuilt && this.#restoreFocusInReopenedSubMenu(openedSubMenuIndex, focusedSubItemKey)) {
				return;
			}

			// Re-appending the focused node drops focus to <body>; a preserved submenu
			// restores its own focus though, so the whole open tree is checked first.
			if (hadFocusInside && !this.#treeContainsNode(ui_a11y.FocusNavigator.getActiveElement())) {
				this.#restoreFocusAfterUpdate(focusedItem, focusedPosition);
			}
		}
		#getSubMenuAt(index) {
			return (index < 0 ? null : this.#items?.[index]?.getSubMenu()) ?? null;
		}
		#getFocusedSubItemKey(subMenu) {
			const focused = subMenu?.#getFocusedItem();
			return focused ? subMenu.#getItemKey(focused.getOptions()) : null;
		}
		#restoreFocusInReopenedSubMenu(index, itemKey) {
			const subMenu = this.#getSubMenuAt(index);
			if (main_core.Type.isNil(itemKey) || !subMenu?.getPopup()?.isShown()) {
				return false;
			}
			const target = subMenu.#items?.find(item => {
				return subMenu.#getItemKey(item.getOptions()) === itemKey;
			});
			if (!target) {
				return false;
			}
			target.getActionElement().focus({
				preventScroll: true
			});
			return true;
		}
		#getOpenedSubMenuIndex() {
			return this.#items?.findIndex(item => {
				return Boolean(item.getSubMenu()?.getPopup()?.isShown());
			}) ?? -1;
		}
		#reopenSubMenuAt(index) {
			// An item carrying an open submenu may not survive the update (a recreated
			// UiButton item, a changed key), and its submenu dies with it. The item at the
			// same place is the same one for the user, so its level opens back up.
			if (index < 0 || this.#getOpenedSubMenuIndex() === index) {
				return;
			}
			const item = this.#items[index];
			if (item?.getOptions().subMenu) {
				item.showSubMenu();
			}
		}
		#reconcileItems(itemsOptions) {
			const oldItems = this.#items ?? [];

			// A key takes part in matching only when it is unambiguous on both sides:
			// reusing the first of several equal-key items could pick the wrong one.
			const oldByKey = new Map();
			oldItems.forEach(item => {
				const key = this.#getItemKey(item.getOptions());
				if (!main_core.Type.isNil(key)) {
					oldByKey.set(key, oldByKey.has(key) ? null : item);
				}
			});
			const newKeyCounts = new Map();
			itemsOptions.forEach(itemOptions => {
				const key = this.#getItemKey(itemOptions);
				if (!main_core.Type.isNil(key)) {
					newKeyCounts.set(key, (newKeyCounts.get(key) ?? 0) + 1);
				}
			});
			const reused = new Set();
			this.#items = itemsOptions.map(itemOptions => {
				if (!itemOptions) {
					return null;
				}
				const key = this.#getItemKey(itemOptions);
				const matched = !main_core.Type.isNil(key) && newKeyCounts.get(key) === 1 ? oldByKey.get(key) : null;
				// A UiButton action cannot refresh in place (its node is owned by
				// ui.buttons), so such items are recreated.
				if (matched && !matched.getOptions().uiButtonOptions && !itemOptions.uiButtonOptions) {
					reused.add(matched);
					matched.update({
						...itemOptions,
						onClick: () => this.#onItemClick(itemOptions)
					});
					return matched;
				}
				return this.#createItem(itemOptions);
			}).filter(it => it);
			oldItems.forEach(item => {
				if (!reused.has(item)) {
					item.destroy();
				}
			});
		}
		#getFocusedItem() {
			return this.#items?.find(item => {
				const action = item.getActionElement();
				if (main_core.Type.isDomNode(action) && action.contains(ui_a11y.FocusNavigator.getActiveElement(action))) {
					return true;
				}

				// Focus deep inside the item's submenu tree maps to this item: after an
				// update the closest surviving anchor is the root-level parent.
				const subMenu = item.getSubMenu();
				return subMenu ? subMenu.#treeContainsNode(ui_a11y.FocusNavigator.getActiveElement()) : false;
			}) ?? null;
		}
		#getItemKey(options) {
			if (!options) {
				return null;
			}
			if (!main_core.Type.isNil(options.id)) {
				return `id:${options.id}`;
			}

			// An id-less item is identified by its title within the section: it survives
			// an update of the same logical item (e.g. a checkbox toggle).
			if (main_core.Type.isStringFilled(options.title)) {
				return `title:${options.sectionCode ?? ''}:${options.title}`;
			}
			return null;
		}
		#getLiveContainer() {
			// Popup.destroy() drops its container: a submenu popup is destroyed on every
			// close when cacheable is false (the BMenu default).
			return this.#popup?.getPopupContainer() ?? null;
		}
		#restoreFocusAfterUpdate(focusedItem, focusedPosition) {
			const container = this.#getLiveContainer();

			// An item that held the focus and survived the update keeps it, whatever the
			// modality reads now: a pointerdown on the item's own extra icon (the click that
			// asked for the update) must not cost the keyboard its position.
			if (focusedItem && this.#items.includes(focusedItem)) {
				focusedItem.getActionElement().focus({
					preventScroll: true
				});
				return;
			}
			if (this.#getInputModality() !== 'keyboard') {
				// Same contract as the initial focus for a pointer interaction: the popup
				// container keeps focus so no item looks spuriously active.
				container?.focus({
					preventScroll: true
				});
				return;
			}

			// The item is gone (a toggle whose title is its identity, an ambiguous key), yet
			// the place in the list still means something to the keyboard: the focus stays at
			// that position instead of jumping back to the top.
			const target = this.#keyboard?.getItemAtPosition(focusedPosition) ?? this.#keyboard?.getInitialFocusTarget();
			(target ?? container)?.focus({
				preventScroll: true
			});
		}
		close() {
			if (this.#destroyed) {
				return;
			}
			this.#popup?.close();
		}
		#closeAllLevels() {
			// A submenu delegates upward: closing the root cascades to every level.
			if (this.#options.onCloseAll) {
				this.#options.onCloseAll();
			} else {
				this.close();
			}
		}
		destroy() {
			if (this.#destroyed) {
				// Popup.destroy() emits onDestroy which re-enters this method; a second
				// pass would wipe the trigger attributes just restored from the snapshot.
				return;
			}
			this.#destroyed = true;
			// Popup.destroy() does not emit onClose, so the focus restore belongs here as
			// well — before the trigger loses the tabindex that makes it focusable. Only for
			// a menu that is still open: a plain cleanup of a long-closed menu must not pull
			// the focus back onto a trigger the user left behind.
			if (this.#popup?.isShown()) {
				this.#restoreFocusOnClose();
			}
			this.#keyboard?.destroy();
			this.#items?.forEach(item => item.destroy());
			// The trigger keeps the menu's attributes until the popup is gone: a consumer
			// trap restores focus from inside destroy() and needs a focusable target.
			this.#popup?.destroy();
			this.#clearTriggerAria();
			this.#releaseLayout();
		}
		#releaseLayout() {
			if (this.#richHeader) {
				// The click and keydown handlers of the header are the only bindings the menu
				// owns on a node of its own; the item nodes go away with the items.
				main_core.Event.unbindAll(this.#richHeader, 'click');
				main_core.Event.unbindAll(this.#richHeader, 'keydown');
			}

			// Nothing points at the detached subtree any more.
			this.#container = null;
			this.#itemsContainer = null;
			this.#richHeader = null;
			this.#items = null;
			this.#keyboard = null;
			this.#focusOrigin = null;
		}
		#shouldHide = event => {
			return !this.#treeContainsNode(event.target);
		};
		#treeContainsNode(node) {
			// Every level of the open tree is its own popup, nested submenus included, so
			// the node may sit outside this popup container and still belong to the menu.
			if (this.#getLiveContainer()?.contains(node)) {
				return true;
			}
			return Boolean(this.#items?.some(item => {
				return item.getSubMenu()?.#treeContainsNode(node) === true;
			}));
		}
		#onPopupShow = () => {
			this.#keyboard?.activate();
			this.#syncTriggerExpanded(true);
			this.#applyOpeningFocus();
		};
		#onPopupClose = () => {
			this.#restoreFocusOnClose();
			this.#keyboard?.deactivate();
			this.#items.forEach(item => item.closeSubMenu());
			this.#syncTriggerExpanded(false);
		};
		#onPopupDestroy = () => {
			this.destroy();
		};
		#onBeforeAdjustPosition = () => {
			this.#items.forEach(item => item.adjustSubMenu());
		};
		#prepareItems(itemsOptions) {
			return itemsOptions.map(itemOptions => itemOptions ? this.#createItem(itemOptions) : null).filter(it => it);
		}
		#createItem(itemOptions) {
			const item = new MenuItem({
				...itemOptions,
				onClick: () => this.#onItemClick(itemOptions)
			}, {
				getTargetContainer: () => this.getPopup().getTargetContainer(),
				// The callback reads the live #items list: an item instance outlives
				// one updateItems generation.
				onMouseEnter: () => this.#items.filter(it => it !== item).forEach(it => it.closeSubMenuWithTimeout()),
				onSubMenuItemClick: this.#onSubMenuItemClick,
				onCloseAll: () => this.#closeAllLevels(),
				hasTreeFocus: () => this.#hasTreeFocus()
			});
			return item;
		}
		#onItemClick = itemOptions => {
			itemOptions.onClick?.();
			if (!itemOptions.subMenu && this.#options.closeOnItemClick) {
				this.close();
			}
		};
		#onSubMenuItemClick = () => {
			if (this.#options.closeOnItemClick) {
				this.close();
			}
		};
		#render() {
			// Both containers and the rich header outlive a re-render: an updateItems must
			// not tear down the FocusZone, the focused header or the bound handlers.
			this.#container ??= main_core.Tag.render`
			<div class="ui-popup-menu-container"></div>
		`;
			if (!this.#itemsContainer) {
				// The rich header stays out of the items container so it never joins the
				// FocusZone roving set.
				this.#appendRichHeader();
				this.#itemsContainer = this.#renderItemsContainer();
				main_core.Dom.append(this.#itemsContainer, this.#container);
			}
			this.#syncItemNodes(this.#renderItems());
			return this.#container;
		}
		#syncItemNodes(nodes) {
			// Re-appending a node that already sits in the right place would drop the focus
			// it holds, so only the nodes that actually moved are touched.
			nodes.forEach((node, index) => {
				const current = this.#itemsContainer.children[index];
				if (current === node) {
					return;
				}
				if (current) {
					main_core.Dom.insertBefore(node, current);
				} else {
					main_core.Dom.append(node, this.#itemsContainer);
				}
			});
			while (this.#itemsContainer.children.length > nodes.length) {
				main_core.Dom.remove(this.#itemsContainer.lastElementChild);
			}
		}
		#renderItemsContainer() {
			// role="none" keeps the items owned by the role="menu" popup container instead
			// of declaring a second menu inside it.
			return main_core.Tag.render`
			<div class="ui-popup-menu-items" role="none"></div>
		`;
		}
		#appendRichHeader() {
			const richHeader = this.#renderRichHeader();
			if (richHeader) {
				main_core.Dom.append(richHeader, this.#container);
			}
		}
		#renderRichHeader() {
			if (!this.#options.richHeader) {
				return '';
			}
			const design = this.#options.richHeader.design ?? MenuRichHeaderDesign.Default;
			const richHeader = main_core.Tag.render`
			<div class="ui-popup-menu-rich-header --${design}" role="none">
				<div class="ui-popup-menu-rich-header-image">
					<div class="ui-icon-set --${this.#getRichHeaderIcon(design)}"></div>
				</div>
				<div class="ui-popup-menu-rich-header-header">
					${this.#renderRichHeaderSubtitle()}
					<div class="ui-popup-menu-rich-header-title">
						${main_core.Text.encode(this.#options.richHeader.title)}
					</div>
				</div>
				<div class="ui-popup-menu-rich-header-buttons">
					${this.#renderRichHeaderIcon()}
				</div>
			</div>
		`;
			const {
				onClick
			} = this.#options.richHeader;
			if (onClick) {
				richHeader.setAttribute('role', 'button');
				richHeader.setAttribute('tabindex', '0');
				main_core.Event.bind(richHeader, 'click', onClick);
				main_core.Event.bind(richHeader, 'keydown', event => {
					activateByKey(event, richHeader);
				});

				// Only an interactive header is a Tab target; MenuKeyboard toggles focus
				// between it and the menu items.
				this.#richHeader = richHeader;
			}
			return richHeader;
		}
		#getRichHeaderIcon(design) {
			return {
				[MenuRichHeaderDesign.Default]: ui_iconSet_api_core.Main.DIAMOND,
				[MenuRichHeaderDesign.Copilot]: ui_iconSet_api_core.Main.COPILOT_AI
			}[design] ?? ui_iconSet_api_core.Main.DIAMOND;
		}
		#renderRichHeaderSubtitle() {
			if (!this.#options.richHeader.subtitle) {
				return '';
			}
			return main_core.Tag.render`
			<div class="ui-popup-menu-rich-header-subtitle">
				${main_core.Text.encode(this.#options.richHeader.subtitle)}
			</div>
		`;
		}
		#renderRichHeaderIcon() {
			if (!this.#options.richHeader.icon) {
				return '';
			}
			return main_core.Tag.render`
			<div class="ui-popup-menu-rich-header-icon">
				<div class="ui-icon-set --${this.#options.richHeader.icon}"></div>
			</div>
		`;
		}
		#renderItems() {
			const itemsBySection = this.#groupItemsBySection();
			const sections = this.#options.sections ?? [];
			const nodes = (itemsBySection.get(BASE_SECTION_CODE) ?? []).map(item => item.render());
			sections.forEach(options => {
				const items = itemsBySection.get(options.code);
				if (!items) {
					return;
				}
				const renderedItems = items.map(item => item.render());
				if (main_core.Type.isStringFilled(options.title)) {
					nodes.push(this.#renderSectionGroup(options, renderedItems));
					return;
				}

				// A separator separates: it is rendered only between rendered items, whatever
				// the index of the section that owns it (preceding sections may be empty).
				if (nodes.length > 0) {
					nodes.push(this.#renderSectionSeparator(options));
				}
				nodes.push(...renderedItems);
			});
			return nodes;
		}
		#groupItemsBySection() {
			const knownCodes = new Set([BASE_SECTION_CODE, ...(this.#options.sections ?? []).map(section => section.code)]);
			const itemsBySection = new Map();
			this.#items.forEach(item => {
				const sectionCode = item.getOptions().sectionCode ?? BASE_SECTION_CODE;
				if (!knownCodes.has(sectionCode)) {
					// A dropped item is a consumer bug: make it visible instead of silent.
					console.error(`UI.System.Menu: item "${item.getOptions().title ?? ''}" has unknown` + ` sectionCode "${sectionCode}" and is not rendered`);
					return;
				}
				const sectionItems = itemsBySection.get(sectionCode) ?? [];
				sectionItems.push(item);
				itemsBySection.set(sectionCode, sectionItems);
			});
			return itemsBySection;
		}
		#renderSectionGroup(options, items) {
			// The labelled group wraps its items so a screen reader associates every item
			// with the section title. The header row only repeats that title visually, so
			// it is hidden from the a11y tree instead of being announced a second time.
			const header = this.#renderSectionHeader(options);
			const group = main_core.Tag.render`
			<div class="ui-popup-menu-section-group" role="group">
				${header}
				${items}
			</div>
		`;
			group.setAttribute('aria-label', options.title);
			return group;
		}
		#renderSectionHeader(options) {
			return main_core.Tag.render`
			<div
				class="ui-popup-menu-section --${options.design ?? MenuSectionDesign.Default}"
				role="none"
				aria-hidden="true"
			>
				<div class="ui-popup-menu-section-title">${main_core.Text.encode(options.title)}</div>
				<div class="ui-popup-menu-section-divider" aria-hidden="true"></div>
			</div>
		`;
		}
		#renderSectionSeparator(options) {
			// A titleless section is just a rule between groups of items.
			return main_core.Tag.render`
			<div
				class="ui-popup-menu-section --${options.design ?? MenuSectionDesign.Default}"
				role="separator"
			>
				<div class="ui-popup-menu-section-divider" aria-hidden="true"></div>
			</div>
		`;
		}
	}

	exports.Menu = Menu;
	exports.MenuItemDesign = MenuItemDesign;
	exports.MenuRichHeaderDesign = MenuRichHeaderDesign;
	exports.MenuSectionDesign = MenuSectionDesign;

})(this.BX.UI.System = this.BX.UI.System || {}, BX, BX.Main, BX.UI.IconSet, window, BX.UI.Accessibility, BX.UI, BX.UI);
//# sourceMappingURL=menu.bundle.js.map
