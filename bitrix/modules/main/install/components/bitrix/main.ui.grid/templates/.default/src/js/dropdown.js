(function() {
	'use strict';

	BX.namespace('BX.Main');

	/**
	 * BX.Main.dropdown
	 * @param dropdown
	 */
	BX.Main.dropdown = function(dropdown)
	{
		this.id = null;
		this.dropdown = null;
		this.items = null;
		this.value = null;
		this.menuId = null;
		this.menu = null;
		this.menuItems = null;
		this.multiple = null;
		this.emptyText = null;
		this.dataItems = 'items';
		this.dataValue = 'value';
		this.dataPseudo = 'pseudo';
		this.dropdownItemClass = 'main-dropdown-item';
		this.activeClass = 'main-dropdown-active';
		this.selectedClass = 'main-dropdown-item-selected';
		this.notSelectedClass = 'main-dropdown-item-not-selected';
		this.lockedClass = 'main-dropdown-item-locked';
		this.menuItemClass = 'menu-popup-item';
		this.init(dropdown);
	};

	BX.Main.dropdown.prototype = {
		init(dropdown)
		{
			this.id = dropdown.id;
			this.dropdown = dropdown;
			this.items = this.getItems();
			this.value = this.getValue();
			this.menuId = this.getMenuId();
			this.multiple = this.getMultiple();
			this.emptyText = this.getEmptyText();
			this.openedByKeyboard = false;
			this.initialFocusPosition = null;
			this.menu = this.createMenu();
			this.menu.popupWindow.show();
			this.adjustPosition();

			BX.bind(this.dropdown, 'click', BX.delegate(this._onClick, this));
			BX.bind(this.dropdown, 'keydown', BX.delegate(this._onKeyDown, this));
		},

		_onClick()
		{
			this.openedByKeyboard = false;
			this.initialFocusPosition = null;
			this.showMenu();
		},

		/**
		 * The menu itself needs no key handling: main.popup walks the items, activates them and
		 * closes on Escape on its own. Only opening is ours, and with it the fact that the menu
		 * was opened from the keyboard — that is what decides whether the focus goes inside.
		 *
		 * ArrowUp opens the menu at its last item, the way the interface buttons of main do it.
		 */
		_onKeyDown(event)
		{
			const isActivation = event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar';
			const isArrowDown = event.key === 'ArrowDown';
			const isArrowUp = event.key === 'ArrowUp';

			if (!isActivation && !isArrowDown && !isArrowUp)
			{
				return;
			}

			event.preventDefault();

			this.openWithKeyboard(event.key);
		},

		/**
		 * Opens the menu the way a keyboard user asked for it. Public because the manager builds
		 * the instance lazily, on the first event that reaches the control: the key that created
		 * the dropdown has already passed it by, so the opening is carried out from there.
		 */
		openWithKeyboard(key)
		{
			this.openedByKeyboard = true;
			this.initialFocusPosition = key === 'ArrowUp' ? 'last' : 'first';

			this.showMenu();
		},

		getMenuId()
		{
			return `${this.id}_menu`;
		},

		getItems()
		{
			let result;

			try
			{
				const str = this.dropdown.dataset[this.dataItems];
				result = JSON.parse(str);
				result = this.prepareItemsValues(result);
			}
			catch
			{
				result = [];
			}

			return result;
		},

		prepareItemsValues(items)
		{
			return items.map((item) => {
				if ('VALUE' in item)
				{
					item.VALUE = String(item.VALUE);
				}

				if ('ITEMS' in item)
				{
					item.ITEMS = this.prepareItemsValues(item.ITEMS);
				}

				return item;
			});
		},

		// single
		getValue()
		{
			return this.dropdown.dataset[this.dataValue];
		},

		getValueItem()
		{
			const value = this.getValue();

			return this.getDataItemByValue(value);
		},

		// multiple
		getValueAsArray()
		{
			let value = this.getValue();
			if (value === undefined)
			{
				value = '';
			}

			return value.toString().split(',').filter((i) => i !== '');
		},

		getValueItems()
		{
			const values = this.getValueAsArray();

			return this.getDataItemsByValues(values);
		},

		toggleValue(value)
		{
			if (this.multiple)
			{
				if (value || value === 0 || value === '0')
				{
					const values = this.getValueAsArray();
					const index = values.indexOf(value);

					if (index < 0)
					{
						values.push(value);
					}
					else
					{
						values.splice(index, 1);
					}

					this.dropdown.dataset[this.dataValue] = values.join(',');
				}
				else
				{
					this.dropdown.dataset[this.dataValue] = null;
				}
			}
			else
			{
				this.dropdown.dataset[this.dataValue] = value;
			}
		},

		getValueText()
		{
			if (this.multiple)
			{
				return this.getValueItems().map((item) => item.NAME).filter((i) => Boolean(i)).join(', ') || this.emptyText;
			}

			const item = this.getValueItem();
			if (item)
			{
				return item.NAME;
			}

			// A value outside the item list has no caption of its own: keep the rendered one
			// rather than wiping it with the empty text the dropdown was not given.
			return this.emptyText ?? this.getRenderedText();
		},

		getRenderedText()
		{
			const caption = BX.firstChild(this.dropdown);
			if (!caption)
			{
				return '';
			}

			return this.dropdown.dataset.htmlEntity === 'true' ? caption.innerHTML : caption.innerText;
		},

		getMultiple()
		{
			return this.dropdown.dataset.multiple === 'Y';
		},

		getEmptyText()
		{
			return this.dropdown.dataset.emptyText || null;
		},

		prepareMenuItems()
		{
			const self = this;
			let attrs; let
				subItem;
			const currentValue = this.multiple ? this.getValueAsArray() : this.getValue();

			function prepareItems(items)
			{
				const isHtmlEntity = self.dropdown.dataset.htmlEntity === 'true';

				return items.map((item) => {
					attrs = {};
					attrs[`data-${self.dataValue}`] = item.VALUE;
					attrs[`data-${self.dataPseudo}`] = 'PSEUDO' in item && item.PSEUDO ? 'true' : 'false';

					subItem = BX.create('div', {
						children: [
							BX.create('span', {
								props: {
									className: self.dropdownItemClass,
								},
								attrs,
								html: isHtmlEntity ? item.NAME : null,
								text: isHtmlEntity ? null : item.NAME,
							}),
						],
					});

					const selected =						self.multiple
						? currentValue.includes(item.VALUE)
						: currentValue === item.VALUE
					;

					return {
						html: subItem.innerHTML,
						className: selected ? self.selectedClass : self.notSelectedClass,
						delimiter: item.DELIMITER,
						items: 'ITEMS' in item ? prepareItems(item.ITEMS) : null,
					};
				});
			}

			const items = prepareItems(this.items);
			BX.onCustomEvent(window, 'Dropdown::onPrepareItems', [this.id, this.menuId, items]);

			return items;
		},

		createMenu()
		{
			const self = this;

			return BX.PopupMenu.create(
				this.getMenuId(),
				this.dropdown,
				this.prepareMenuItems(),
				{
					autoHide: true,
					offsetTop: -8,
					// The menu hangs under its dropdown, not to the right of it. The 40px used
					// to make room for the angle that pointed at the control; the angle was
					// dropped in bc96b69c0149 and the offset was left behind, shifting every
					// menu of the grid rightwards. Callers can still ask for one by hand.
					offsetLeft: Number(this.dropdown.dataset.menuOffsetLeft || 0),
					maxHeight: Number(this.dropdown.dataset.menuMaxHeight || 170),
					// Without the trap MenuItem.focus() only paints the item and leaves the real
					// focus outside, so the built-in arrow navigation has nothing to move. The
					// default is no help here: it hangs on the ui.a11y setting, which is on only
					// where Dev\Main\Migrator\ModuleUpdater exists.
					focusTrap: true,
					ariaLabel: this.dropdown.getAttribute('aria-label') || this.dropdown.dataset.name || null,
					navigationOptions: {
						initialFocusPosition: this.initialFocusPosition,
					},
					events: {
						onPopupClose: BX.delegate(this._onCloseMenu, this),
						onPopupShow() {
							self._onShowMenu();
						},
						// The menu ignores input until the opening animation is over, so the
						// focus is placed after it, not on show.
						onAfterPopupShow() {
							self._onAfterShowMenu();
						},
					},
				},
			);
		},

		showMenu()
		{
			this.menu = BX.PopupMenu.getMenuById(this.menuId);

			if (!this.menu)
			{
				this.menu = this.createMenu();
				this.menu.popupWindow.show();
			}

			this.adjustPosition();
		},

		/**
		 * Puts the menu of a panel dropdown over its control. The menu stays where main.popup put
		 * it — in the body — and is placed by the measured position of the dropdown instead of
		 * being moved inside it. Moving it used to break the keyboard: the focused item was taken
		 * out of the document by the rebuild that follows, and with it the focus, so the arrows
		 * walked the highlight while the focus sat on the body.
		 *
		 * The panel of group actions floats: once the grid is scrolled past it, the panel becomes
		 * `position: fixed` at the bottom of the viewport. The menu therefore follows the same
		 * kind of positioning as the panel it belongs to, and is kept on the control while the
		 * page scrolls.
		 */
		adjustPosition()
		{
			if (this.dropdown.dataset.popupPosition !== 'fixed')
			{
				return;
			}

			this.placeAbovePanel();
			this.bindPanelFollow();
		},

		placeAbovePanel()
		{
			const container = this.menu?.popupWindow?.popupContainer;

			if (!BX.type.isDomNode(container))
			{
				return;
			}

			const dropdownRect = this.dropdown.getBoundingClientRect();
			const menuHeight = container.offsetHeight;
			const gap = 5;

			// The panel is fixed to the viewport while it floats, so the menu is too: it then keeps
			// its place on the control without a scroll handler doing the work on every frame.
			//
			// The state is read off the panel itself rather than off its class: unpinning is
			// animated and the class is dropped 200ms late (pin-panel.js), so a scroll landing in
			// between would be measured against a state the panel has already left.
			const panel = this.dropdown.closest('.main-grid-action-panel');
			const isFloating = BX.type.isDomNode(panel) && getComputedStyle(panel).position === 'fixed';

			container.style.setProperty('position', isFloating ? 'fixed' : 'absolute');
			container.style.setProperty('bottom', 'auto');
			container.style.setProperty('right', 'auto');

			const top = isFloating
				? dropdownRect.top - menuHeight - gap
				: dropdownRect.top - menuHeight - gap + window.scrollY;
			const left = isFloating
				? dropdownRect.left
				: dropdownRect.left + window.scrollX;

			container.style.setProperty('top', `${Math.round(top)}px`);
			container.style.setProperty('left', `${Math.round(left)}px`);
		},

		bindPanelFollow()
		{
			if (this.panelFollowHandler)
			{
				return;
			}

			// The panel unpins with an animation, so the frame a scroll event lands on is not the
			// frame the panel settles in. The menu is therefore re-placed for as long as the
			// scrolling lasts and a little after it stops, instead of once per event.
			let until = 0;
			let running = false;

			const tick = () => {
				this.placeAbovePanel();

				if (Date.now() < until)
				{
					requestAnimationFrame(tick);

					return;
				}

				running = false;
			};

			this.panelFollowHandler = () => {
				// main.popup closes the menu on a scroll of its binding element, but the panel
				// floats and the control stays on screen, so the menu is kept with it.
				until = Date.now() + 300;

				if (!running)
				{
					running = true;
					requestAnimationFrame(tick);
				}
			};

			window.addEventListener('scroll', this.panelFollowHandler, true);
			window.addEventListener('resize', this.panelFollowHandler);
		},

		unbindPanelFollow()
		{
			if (!this.panelFollowHandler)
			{
				return;
			}

			window.removeEventListener('scroll', this.panelFollowHandler, true);
			window.removeEventListener('resize', this.panelFollowHandler);
			this.panelFollowHandler = null;
		},

		getSubItem(node)
		{
			return BX.Grid.Utils.getByClass(node, this.dropdownItemClass, true);
		},

		refresh(item)
		{
			const subItem = this.getSubItem(item);
			let value = BX.data(subItem, this.dataValue);
			if (BX.Type.isUndefined(value))
			{
				value = '';
			}

			this.toggleValue(value);
			if (this.dropdown.dataset.htmlEntity === 'true')
			{
				BX.firstChild(this.dropdown).innerHTML = this.getValueText();
			}
			else
			{
				BX.firstChild(this.dropdown).innerText = this.getValueText();
			}
		},

		selectItem(node)
		{
			const self = this;

			(this.menu.menuItems || []).forEach((current) => {
				// multiple
				if (self.multiple)
				{
					if (node === current.layout.item)
					{
						if (BX.hasClass(node, self.selectedClass))
						{
							BX.addClass(current.layout.item, self.notSelectedClass);
							BX.removeClass(current.layout.item, self.selectedClass);
						}
						else
						{
							BX.removeClass(current.layout.item, self.notSelectedClass);
							BX.addClass(current.layout.item, self.selectedClass);
						}
					}

					return;
				}

				// single
				BX.removeClass(current.layout.item, self.selectedClass);

				if (node === current.layout.item)
				{
					BX.removeClass(current.layout.item, self.notSelectedClass);
					BX.addClass(current.layout.item, self.selectedClass);
				}
				else
				{
					BX.addClass(current.layout.item, self.notSelectedClass);
				}
			});
		},

		lockedItem(node) {
			BX.addClass(node, this.lockedClass);
		},

		getDataItemIndexByValue(items, value)
		{
			let result;

			if (BX.type.isArray(items))
			{
				items.map((current, index) => {
					if (current.VALUE === value)
					{
						result = index;

						return false;
					}
				});
			}

			return false;
		},

		getDataItemByValue(value)
		{
			return this.findDataItemByValue(this.items, value);
		},

		findDataItemByValue(items, value)
		{
			for (const current of items)
			{
				if ('VALUE' in current && current.VALUE === value)
				{
					return current;
				}

				if ('ITEMS' in current)
				{
					const nestedItem = this.findDataItemByValue(current.ITEMS, value);
					if (nestedItem)
					{
						return nestedItem;
					}
				}
			}

			return null;
		},

		getDataItemsByValues(values, items = this.items)
		{
			const result = [];

			items.forEach((item) => {
				if ('VALUE' in item && values.includes(item.VALUE))
				{
					result.push(item);
				}

				if ('ITEMS' in item)
				{
					result.push(...this.getDataItemsByValues(values, item.ITEMS));
				}
			});

			return result;
		},

		_onShowMenu()
		{
			const self = this;

			BX.addClass(this.dropdown, this.activeClass);
			this.dropdown.setAttribute('aria-expanded', 'true');
			(this.menu.menuItems || []).forEach((current) => {
				BX.bind(current.layout.item, 'click', BX.delegate(self._onItemClick, self));
			});
		},

		_onAfterShowMenu()
		{
			if (!this.openedByKeyboard)
			{
				return;
			}

			const navigation = this.menu?.getNavigation?.();

			if (this.initialFocusPosition === 'last')
			{
				navigation?.focusLast?.();

				return;
			}

			navigation?.focusFirst?.();
		},

		_onCloseMenu()
		{
			// Only the panel dropdowns ever start following, so the teardown is called the way it
			// may be absent: a dropdown that never positioned itself has nothing to unbind.
			this.unbindPanelFollow?.();
			BX.removeClass(this.dropdown, this.activeClass);
			this.dropdown.setAttribute('aria-expanded', 'false');
			BX.PopupMenu.destroy(this.menuId);

			// The menu is destroyed with every close, taking the focus with it: without this the
			// next Tab would start the walk over from the top of the page.
			if (this.openedByKeyboard)
			{
				this.openedByKeyboard = false;
				this.dropdown.focus();
			}
		},

		_onItemClick(event)
		{
			const item = this.getMenuItem(event.target);
			let value; let
				dataItem;
			const subItem = this.getSubItem(item);
			const isPseudo = BX.data(subItem, 'pseudo');

			if (isPseudo === 'true')
			{
				value = BX.data(subItem, 'value');
				dataItem = this.getDataItemByValue(value);
			}
			else
			{
				this.refresh(item);
				this.selectItem(item);

				if (!this.multiple)
				{
					this.menu.popupWindow.close();
				}

				value = this.getValue();
				dataItem = this.getDataItemByValue(value);
			}

			event.stopPropagation();

			BX.onCustomEvent(window, 'Dropdown::change', [this.dropdown.id, event, item, dataItem, value]);
		},

		getMenuItem(node)
		{
			let item = node;

			if (!BX.hasClass(item, this.menuItemClass))
			{
				item = BX.findParent(item, { class: this.menuItemClass });
			}

			return item;
		},
	};
})();
