/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, main_popup, ai_engine, ui_designTokens, ui_iconSet_api_core, ui_iconSet_actions, ui_iconSet_main, ui_iconSet_editor, ui_iconSet_crm, ui_label, main_loader, ui_lottie, ai_speechConverter, ui_hint, ai_copilot_copilotTextController, ui_feedback_form, ai_copilot, ai_ajaxErrorHandler) {
	'use strict';

	async function checkCopilotAgreement(options) {
		try {
			const copilotAgreement = await initCopilotAgreement(options);
			return copilotAgreement.checkAgreement();
		} catch (e) {
			console.error(e);
			return true;
		}
	}
	async function initCopilotAgreement(options) {
		try {
			const {
				CopilotAgreement
			} = await main_core.Runtime.loadExtension('ai.copilot-agreement');
			return new CopilotAgreement(options);
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	const Categories = Object.freeze({
		text: 'text_operations',
		image: 'image_operations',
		readonly: 'read_operations',
		promptSaving: 'prompt_saving'
	});
	const Types = Object.freeze({
		textNew: 'create_new',
		textReply: 'reply_context',
		textEdit: 'edit_context',
		imageNew: 'create_image'
	});
	const ContextSubSections = Object.freeze({
		fromText: 'from_text',
		fromAudio: 'audio_used',
		fromTextAndAudio: 'from_text+audio_used'
	});
	const ContextElements = Object.freeze({
		editorButton: 'editor_button',
		spaceButton: 'space_button',
		popupButton: 'popup_button',
		readonlyCommon: 'common',
		readonlyQuote: 'quote'
	});
	const Events = Object.freeze({
		open: 'open',
		generate: 'generate',
		success: 'success',
		error: 'error',
		saveResult: 'save',
		cancelResult: 'cancel',
		editResult: 'edit',
		copyResult: 'copy_text',
		openPromptsLibrary: 'open_list'
	});
	class CopilotAnalytics {
		#tool;
		#category;
		#event;
		#type;
		#c_section;
		#c_sub_section;
		#c_element;
		#params = [];
		constructor() {
			this.#tool = 'AI';
			this.#category = '';
		}
		getCategory() {
			return this.#category;
		}
		getType() {
			return this.#type;
		}
		getCSection() {
			return this.#c_section;
		}
		getCSubSection() {
			return this.#c_sub_section;
		}
		getCElement() {
			return this.#c_element;
		}

		// region Set category
		setCategoryText() {
			return this.#setCategory(Categories.text);
		}
		setCategoryReadonly() {
			return this.#setCategory(Categories.readonly);
		}
		setCategoryImage() {
			return this.#setCategory(Categories.image);
		}
		setCategoryPromptSaving() {
			return this.#setCategory(Categories.promptSaving);
		}
		#setCategory(category) {
			if (Object.values(Categories).includes(category)) {
				this.#category = category;
			}
			return this;
		}
		// endregion

		// region Set type
		setTypeTextNew() {
			return this.#setType(Types.textNew);
		}
		setTypeTextReply() {
			return this.#setType(Types.textReply);
		}
		setTypeTextEdit() {
			return this.#setType(Types.textEdit);
		}
		setTypeImageNew() {
			return this.#setType(Types.imageNew);
		}
		#setType(type) {
			if (Object.values(Types).includes(type)) {
				this.#type = type;
			}
			return this;
		}
		// endregion

		// region Set c_section
		setContextSection(cSection) {
			if (cSection.length > 0) {
				this.#c_section = cSection;
			}
			return this;
		}
		// endregion

		// region Set c_sub_section
		setContextTypeFromText() {
			return this.#setContextSubSection(ContextSubSections.fromText);
		}
		setContextTypeFromAudio() {
			return this.#setContextSubSection(ContextSubSections.fromAudio);
		}
		setContextTypeFromTextAndAudio() {
			return this.#setContextSubSection(ContextSubSections.fromTextAndAudio);
		}
		#setContextSubSection(subSection) {
			if (Object.values(ContextSubSections).includes(subSection)) {
				this.#c_sub_section = subSection;
			}
			return this;
		}
		// endregion

		// region Set c_element
		setContextElementEditorButton() {
			return this.#setContextElement(ContextElements.editorButton);
		}
		setContextElementSpaceButton() {
			return this.#setContextElement(ContextElements.spaceButton);
		}
		setContextElementReadonlyCommon() {
			return this.#setContextElement(ContextElements.readonlyCommon);
		}
		setContextElementReadonlyQuote() {
			return this.#setContextElement(ContextElements.readonlyQuote);
		}
		setContextElementPopupButton() {
			return this.#setContextElement(ContextElements.popupButton);
		}
		#setContextElement(cElement) {
			if (Object.values(ContextElements).includes(cElement)) {
				this.#c_element = cElement;
			}
			return this;
		}
		// endregion

		// region Set params
		setP1(name, value) {
			this.#params[0] = {
				name,
				value
			};
			return this;
		}
		setP2(name, value) {
			this.#params[1] = {
				name,
				value
			};
			return this;
		}
		setP3(name, value) {
			this.#params[2] = {
				name,
				value
			};
			return this;
		}
		setP4(name, value) {
			this.#params[3] = {
				name,
				value
			};
			return this;
		}
		setP5(name, value) {
			this.#params[4] = {
				name,
				value
			};
			return this;
		}

		// endregion

		// region Set event and Send
		sendEventOpen(status) {
			this.#event = Events.open;
			return this.#sendData(status);
		}
		sendEventGenerate() {
			this.#event = Events.generate;
			return this.#sendData();
		}
		sendEventSuccess() {
			this.#event = Events.success;
			return this.#sendData();
		}
		sendEventError() {
			this.#event = Events.error;
			return this.#sendData();
		}
		sendEventSave() {
			this.#event = Events.saveResult;
			return this.#sendData();
		}
		sendEventCancel() {
			this.#event = Events.cancelResult;
			return this.#sendData();
		}
		sendEventOpenPromptLibrary() {
			this.#event = Events.openPromptsLibrary;
			return this.#sendData();
		}
		sendEventCopyResult() {
			this.#event = Events.copyResult;
			return this.#sendData();
		}
		sendEventEditResult() {
			this.#event = Events.editResult;
			return this.#sendData();
		}
		#sendData(status) {
			let data = this.#getData();
			if (!data) {
				return;
			}
			if (status) {
				data = {
					...data,
					status
				};
			}
			main_core.Runtime.loadExtension('ui.analytics').then(({
				sendData
			}) => {
				sendData(data);
			}).catch(() => {
				console.error("AI: Copilot: can't load ui.analytics");
			});
		}
		#getData() {
			if (!this.#tool || !this.#category || !this.#event) {
				return null;
			}
			const data = {
				tool: this.#tool,
				category: this.#category,
				event: this.#event
			};
			if (this.#type) {
				data.type = this.#type;
			}

			// non required
			if (this.#c_section) {
				data.c_section = this.#c_section;
			}
			if (this.#c_sub_section) {
				data.c_sub_section = this.#c_sub_section;
			}
			if (this.#c_element) {
				data.c_element = this.#c_element;
			}

			// params
			if (this.#params && main_core.Type.isArray(this.#params)) {
				this.#params.forEach((param, index) => {
					if (!param?.value || !param?.name) {
						return;
					}
					const {
						name,
						value
					} = param;
					const key = `p${index + 1}`;
					data[key] = `${main_core.Text.toCamelCase(name)}_${main_core.Text.toCamelCase(value)}`;
				});
			}
			return data;
		}
		// endregion
	}

	const highlightedMenuItemClassname = '--highlight';
	const KeyboardMenuEvents = Object.freeze({
		highlightMenuItem: 'highlightMenuItem',
		clearHighlight: 'clearHighlight'
	});
	class KeyboardMenu extends main_core_events.EventEmitter {
		#menu;
		#openMenu;
		#highlightedMenuItem = null;
		#clearHighlightAfterType = false;
		#highlightFirstItemAfterShow = false;
		#canGoOutFromTop = false;
		#keyDownHandler;
		#menuItemMouseEnterHandler;
		#menuItemMouseLeaveHandler;
		#menuItemSubmenuOnShowHandler;
		#menuItemSubmenuOnCloseHandler;
		constructor(options) {
			super();
			this.setEventNamespace('AI:KeyboardMenu');
			this.#menu = options.menu;
			this.#clearHighlightAfterType = options.clearHighlightAfterType;
			this.#highlightFirstItemAfterShow = options.highlightFirstItemAfterShow;
			this.#canGoOutFromTop = options.canGoOutFromTop;
			this.#keyDownHandler = this.#handleKeyDown.bind(this);
			this.#menuItemMouseEnterHandler = this.#handleMenuItemMouseEnter.bind(this);
			this.#menuItemMouseLeaveHandler = this.#handleMenuItemMouseLeave.bind(this);
			this.#menuItemSubmenuOnShowHandler = this.#handleMenuItemSubmenuOnShow.bind(this);
			this.#menuItemSubmenuOnCloseHandler = this.#handleMenuItemSubmenuOnClose.bind(this);
			const handleMenuItemEvents = this.#handleMenuItemEvents.bind(this);
			this.#menu.getPopupWindow().subscribeFromOptions({
				onAfterShow: () => {
					this.#openMenu = this.#menu;
					main_core.Dom.addClass(this.#menu.getPopupWindow().getPopupContainer(), '--keyboard-control');
					if (this.#highlightFirstItemAfterShow) {
						this.highlightFirstItem();
						main_core.Event.bind(document, 'keydown', this.#keyDownHandler);
					}
				},
				onAfterClose: () => {
					main_core.Event.unbind(document, 'keydown', this.#keyDownHandler);
					this.#clearHighlight();
				},
				onPopupFirstShow: () => {
					this.#menu.getMenuItems().forEach(menuItem => {
						handleMenuItemEvents(menuItem);
					});
					this.#observeMenuChanges();
				}
			});
		}
		enableArrows() {
			main_core.Event.bind(document, 'keydown', this.#keyDownHandler);
		}
		disableArrows() {
			main_core.Event.unbind(document, 'keydown', this.#keyDownHandler);
		}
		getMenu() {
			return this.#menu;
		}
		highlightFirstItem() {
			const firstNotDelimiterItem = this.#menu.getMenuItems().find(menuItem => {
				return menuItem.delimiter !== true;
			});
			this.#highlightMenuItem(firstNotDelimiterItem);
		}
		#observeMenuChanges() {
			const observer = new MutationObserver(mutationsList => {
				mutationsList.some(mutation => {
					if (mutation.type === 'childList') {
						this.#menu.getMenuItems().forEach(menuItem => {
							this.#unsubscribeMenuItemEvents(menuItem);
							this.#handleMenuItemEvents(menuItem);
						});
						return true;
					}
					return false;
				});
			});
			const config = {
				childList: true,
				subtree: true
			};
			observer.observe(this.#menu.getMenuContainer(), config);
		}

		// eslint-disable-next-line consistent-return
		#handleKeyDown(e) {
			if (this.#menu?.getPopupWindow()?.isShown() && this.#menu.getMenuItems().length > 0) {
				switch (e.key) {
					case 'Enter':
						return this.#handleEnterKey();
					case 'ArrowUp':
						return this.#handleArrowUpKey(e);
					case 'ArrowDown':
						return this.#handleArrowDownKey(e);
					case 'ArrowRight':
						return this.#handleArrowRightKey(e);
					case 'ArrowLeft':
						return this.#handleArrowLeftKey(e);
					default:
						if (this.#clearHighlightAfterType) {
							this.#clearHighlight(true);
						}
				}
			}
		}
		#handleEnterKey() {
			if (this.#highlightedMenuItem && this.#highlightedMenuItem.href) {
				this.#highlightedMenuItem.getContainer().click();
			} else if (this.#highlightedMenuItem && main_core.Type.isFunction(this.#highlightedMenuItem.onclick)) {
				this.#highlightedMenuItem.onclick(null, this.#highlightedMenuItem);
			}
		}
		#handleArrowUpKey(event) {
			event.preventDefault();
			this.#highlightedMenuItem?.closeSubMenu();
			const prevMenuItem = this.#getMenuItemBeforeHighlighted();
			if (this.#canGoOutFromTop && prevMenuItem === null && this.#highlightedMenuItem?.getMenuWindow().getParentMenuItem() === null) {
				this.#clearHighlight();
				return;
			}
			this.#highlightMenuItem(prevMenuItem);
		}
		#handleArrowDownKey(event) {
			event.preventDefault();
			this.#highlightedMenuItem?.closeSubMenu();
			const nextMenuItem = this.#getMenuItemAfterHighlighted();
			this.#highlightMenuItem(nextMenuItem);
		}
		#handleArrowLeftKey(event) {
			event.preventDefault();
			if (!this.#highlightedMenuItem) {
				return;
			}
			const parentMenuItem = this.#highlightedMenuItem.getMenuWindow().getParentMenuItem();
			if (parentMenuItem) {
				this.#highlightMenuItem(parentMenuItem);
				parentMenuItem.closeSubMenu();
			}
		}
		#handleArrowRightKey(event) {
			event.preventDefault();
			this.#showActiveItemSubmenuIfExist();
		}
		#showActiveItemSubmenuIfExist() {
			if (this.#highlightedMenuItem?.hasSubMenu()) {
				this.#highlightedMenuItem.showSubMenu();
				const subMenu = this.#highlightedMenuItem.getSubMenu();
				this.#highlightMenuItem(subMenu.getMenuItems()[0]);
			}
		}
		#handleMenuItemEvents(menuItem) {
			menuItem.subscribe('onMouseEnter', this.#menuItemMouseEnterHandler);
			menuItem.subscribe('onMouseLeave', this.#menuItemMouseLeaveHandler);
			menuItem.subscribe('SubMenu:onShow', this.#menuItemSubmenuOnShowHandler);
			menuItem.subscribe('SubMenu:onClose', this.#menuItemSubmenuOnCloseHandler);
		}
		#unsubscribeMenuItemEvents(menuItem) {
			menuItem.unsubscribe('onMouseEnter', this.#menuItemMouseEnterHandler);
			menuItem.unsubscribe('onMouseLeave', this.#menuItemMouseLeaveHandler);
			menuItem.unsubscribe('SubMenu:onShow', this.#menuItemSubmenuOnShowHandler);
			menuItem.unsubscribe('SubMenu:onClose', this.#menuItemSubmenuOnCloseHandler);
		}
		#handleMenuItemMouseEnter(event) {
			this.#highlightMenuItem(event.getTarget());
			main_core.Event.bind(document, 'keydown', this.#keyDownHandler);
		}
		#handleMenuItemMouseLeave() {
			this.#clearHighlight();
		}
		#handleMenuItemSubmenuOnShow(event) {
			const eventMenuItem = event.getTarget();
			this.#openMenu = eventMenuItem.getSubMenu();
			main_core.Dom.addClass(this.#openMenu.getPopupWindow().getPopupContainer(), '--keyboard-control');
			eventMenuItem.getSubMenu().getMenuItems().forEach(subMenuItem => {
				this.#handleMenuItemEvents(subMenuItem);
			});
		}
		#handleMenuItemSubmenuOnClose(event) {
			const eventMenuItem = event.getTarget();
			this.#openMenu = eventMenuItem.getMenuWindow();
		}
		#highlightMenuItem(menuItem) {
			if (!menuItem) {
				return;
			}
			main_core.Dom.removeClass(this.#highlightedMenuItem?.getContainer(), highlightedMenuItemClassname);
			main_core.Dom.addClass(menuItem?.getContainer(), highlightedMenuItemClassname);
			this.#highlightedMenuItem = menuItem;
			this.#scrollToActiveElem();
			this.emit(KeyboardMenuEvents.highlightMenuItem);
		}
		#getMenuItemBeforeHighlighted() {
			if (this.#highlightedMenuItem === null) {
				return this.#openMenu.getMenuItems()[0];
			}
			const highlightedMenuItemPosition = this.#getHighlightedMenuItemPosition();
			const menuItems = this.#highlightedMenuItem.getMenuWindow().getMenuItems();
			if (menuItems[highlightedMenuItemPosition - 1]?.delimiter) {
				return menuItems[highlightedMenuItemPosition - 2] || null;
			}
			return menuItems[highlightedMenuItemPosition - 1] || null;
		}
		#getMenuItemAfterHighlighted() {
			if (this.#highlightedMenuItem === null) {
				const menuItems = this.#openMenu?.getMenuItems();
				return menuItems.find(menuItem => menuItem.delimiter === false);
			}
			const highlightedMenuItemPosition = this.#getHighlightedMenuItemPosition();
			const menuItems = this.#highlightedMenuItem?.getMenuWindow()?.getMenuItems();
			if (menuItems[highlightedMenuItemPosition + 1]?.delimiter) {
				return menuItems[highlightedMenuItemPosition + 2] || null;
			}
			return menuItems[highlightedMenuItemPosition + 1] || null;
		}
		#getHighlightedMenuItemPosition() {
			const menu = this.#highlightedMenuItem.getMenuWindow();
			return menu.getMenuItemPosition(this.#highlightedMenuItem.getId());
		}
		#clearMenuItemHighlight(menuItem) {
			main_core.Dom.removeClass(menuItem?.getContainer(), highlightedMenuItemClassname);
		}
		#clearHighlight(closeSubmenu = false) {
			if (!this.#highlightedMenuItem) {
				return;
			}
			this.#clearMenuItemHighlight(this.#highlightedMenuItem);
			if (closeSubmenu && this.#highlightedMenuItem.getMenuWindow().getParentMenuItem()) {
				this.#highlightedMenuItem.getMenuWindow().getParentMenuItem().closeSubMenu();
			}
			this.#highlightedMenuItem = null;
			this.emit(KeyboardMenuEvents.clearHighlight);
		}
		#scrollToActiveElem() {
			const menuItem = this.#highlightedMenuItem;
			const menuWrapper = this.#highlightedMenuItem.getMenuWindow().getPopupWindow().getContentContainer();
			const relativePosition = main_core.Dom.getRelativePosition(menuWrapper, menuItem.getContainer());
			if (-relativePosition.y < 0) {
				menuWrapper.scrollTop -= menuWrapper.offsetHeight;
			} else if (-relativePosition.y + 10 > relativePosition.height) {
				menuWrapper.scrollTop += menuWrapper.offsetHeight;
			}
		}
	}

	const CopilotMenuEvents = Object.freeze({
		select: 'select',
		open: 'open',
		close: 'close',
		clearHighlight: 'clearHighlight',
		highlightMenuItem: 'highlightMenuItem'
	});
	class CopilotMenu extends main_core_events.EventEmitter {
		#keyboardMenu;
		#menuItems;
		#cacheable;
		#keyboardControlOptions;
		#forceTop = true;
		#autoHide = false;
		#angle;
		#bordered = true;
		#roleInfo;
		#currentRole;
		#roleInfoContainer;
		#loader;
		constructor(options) {
			super(options);
			this.setEventNamespace('AI.Copilot.Menu');
			this.#menuItems = options.items;
			this.#cacheable = options.cacheable ?? true;
			this.#forceTop = options.forceTop === undefined ? this.#forceTop : options.forceTop === true;
			this.#autoHide = options.autoHide === true;
			this.#angle = options.angle;
			this.#bordered = options.bordered ?? this.#bordered;
			this.#initRoleInfoFromOptions(options.roleInfo);
			if (options.keyboardControlOptions) {
				this.#keyboardControlOptions = options.keyboardControlOptions;
			} else {
				this.#keyboardControlOptions = {
					canGoOutFromTop: true,
					highlightFirstItemAfterShow: false,
					clearHighlightAfterType: false
				};
			}
		}
		open() {
			this.#getMenu().show();
			this.adjustPosition();
			this.emit(CopilotMenuEvents.open);
		}
		show() {
			main_core.Dom.style(this.getPopup()?.getPopupContainer(), 'border', null);
			this.getPopup()?.setMaxWidth(null);
			this.getPopup()?.setMinWidth(258);
			this.adjustPosition();
			this.enableArrowsKey();
		}
		close() {
			this.#getMenu().close();
			this.#closeAllSubmenus();
			this.emit(CopilotMenuEvents.close);
		}
		hide() {
			main_core.Dom.style(this.getPopup()?.getPopupContainer(), 'border', 'none');
			this.getPopup()?.setMaxWidth(0);
			this.getPopup()?.setMinWidth(0);
			this.adjustPosition();
			this.#closeAllSubmenus();
			this.disableArrowsKey();
		}
		contains(target) {
			for (const menuItem of this.#getMenu().getMenuItems()) {
				const itemPopup = menuItem.getSubMenu()?.getPopupWindow();
				if (itemPopup?.getPopupContainer()?.contains(target)) {
					return true;
				}
			}
			return this.getPopup().getPopupContainer().contains(target);
		}
		isShown() {
			return this.#keyboardMenu?.getMenu()?.getPopupWindow()?.isShown();
		}
		setBindElement(bindElement, offset) {
			this.#getMenu().getPopupWindow().setBindElement(bindElement);
			this.#getMenu().getPopupWindow().setOffset({
				offsetLeft: offset?.left,
				offsetTop: offset?.top
			});
			this.#getMenu().getPopupWindow().adjustPosition();
		}
		getPopup() {
			return this.#getMenu().getPopupWindow();
		}
		adjustPosition() {
			this.#getMenu().getPopupWindow().adjustPosition({
				forceBindPosition: true,
				forceTop: this.#forceTop
			});
		}
		replaceMenuItemSubmenu(newCopilotMenuItem) {
			const menuItem = this.#getMenu().getMenuItems().find(currentMenuItem => {
				return newCopilotMenuItem.code === currentMenuItem.getId();
			});
			menuItem.destroySubMenu();
			// eslint-disable-next-line no-underscore-dangle,@bitrix24/bitrix24-rules/no-pseudo-private
			menuItem._items = this.#getMenuItems(newCopilotMenuItem.children, true);
			menuItem.addSubMenu(this.#getMenuItems(newCopilotMenuItem.children, true));
		}
		enableArrowsKey() {
			this.#keyboardMenu?.enableArrows();
		}
		disableArrowsKey() {
			this.#keyboardMenu?.disableArrows();
		}
		markMenuItemSelected(menuItemId) {
			const menuItem = this.#getMenu().getMenuItem(menuItemId);
			const menuItemInnerContainer = menuItem.getContainer().querySelector('.ai__copilot-menu_item');
			main_core.Dom.addClass(menuItemInnerContainer, '--selected');
		}
		unmarkMenuItemSelected(menuItemId) {
			const menuItem = this.#getMenu().getMenuItem(menuItemId);
			const menuItemInnerContainer = menuItem.getContainer().querySelector('.ai__copilot-menu_item');
			main_core.Dom.removeClass(menuItemInnerContainer, '--selected');
		}
		updateRoleInfo(role) {
			this.#currentRole.avatar = role.avatar;
			this.#currentRole.name = role.name;
		}
		setItemIsFavourite(itemCode, isFavourite) {
			const itemContainer = this.#getMenu().getMenuItem(itemCode)?.getContainer();
			if (!itemContainer) {
				return;
			}
			const favouriteLabelWrapper = itemContainer.querySelector('.ai__copilot-menu_item-favourite');
			if (!favouriteLabelWrapper) {
				return;
			}
			main_core.Dom.replace(favouriteLabelWrapper, this.#renderFavouriteLabel(itemCode, isFavourite));
		}
		insertItemBefore(itemCode, insertedItem) {
			const menuItem = this.#getMenuItem(insertedItem, false);
			this.#getMenu().addMenuItem(menuItem, itemCode);
		}
		insertItemAfterRole(insertedItem) {
			const roleItemPosition = this.#getMenu().getMenuItemPosition('role-item');
			const menuItemAfterRoleItem = this.#getMenu().getMenuItems()[roleItemPosition + 1];
			this.insertItemBefore(menuItemAfterRoleItem.getId(), insertedItem);
		}
		insertItemAfter(itemCode, insertedItem) {
			const menuItemAfterTarget = this.#getMenu().getMenuItems()[this.#getMenu().getMenuItemPosition(itemCode) + 1];
			this.insertItemBefore(menuItemAfterTarget.getId(), insertedItem);
		}
		removeItem(itemCode) {
			this.#getMenu().removeMenuItem(itemCode);
		}
		setLoader() {
			const popupContainer = this.#getMenu().getPopupWindow()?.getPopupContainer();
			if (!popupContainer) {
				return;
			}
			const fade = main_core.Tag.render`<div class="ai__copilot-menu-popup_fade"></div>`;
			main_core.Dom.append(fade, popupContainer);
			this.#loader = new main_loader.Loader({
				size: 55,
				target: popupContainer,
				color: getComputedStyle(document.body).getPropertyValue('--ui-color-copilot-primary') || '#8e52ec'
			});
			this.#loader.show();
		}
		removeLoader() {
			const popupContainer = this.#getMenu().getPopupWindow()?.getPopupContainer();
			if (!popupContainer) {
				return;
			}
			const fade = popupContainer.querySelector('.ai__copilot-menu-popup_fade');
			main_core.Dom.remove(fade);
			this.#loader.destroy();
			this.#loader = null;
		}
		updateMenuItemsExceptRoleItem(copilotMenuItems) {
			this.#removeMenuItemsExceptRoleItem();
			this.#addMenuItems(copilotMenuItems);
		}
		#removeMenuItemsExceptRoleItem() {
			const menuItems = this.#getMenu().getMenuItems();
			menuItems.forEach(currentMenuItem => {
				const id = currentMenuItem.getId();
				if (id === 'role-item') {
					return;
				}
				requestAnimationFrame(() => {
					this.#getMenu().removeMenuItem(id);
				});
			});
		}
		#addMenuItems(copilotMenuItems) {
			const newMenuItems = this.#getMenuItems(copilotMenuItems);
			newMenuItems.forEach(newMenuItem => {
				requestAnimationFrame(() => {
					this.#getMenu().addMenuItem(newMenuItem);
				});
			});
		}
		#closeAllSubmenus() {
			this.#getMenu().getMenuItems().forEach(menuItem => {
				menuItem.closeSubMenu();
			});
		}
		#getMenu() {
			if (!this.#keyboardMenu) {
				this.#initKeyboardMenu();
			}
			return this.#keyboardMenu.getMenu();
		}
		#initKeyboardMenu() {
			const menu = new main_popup.Menu({
				minWidth: 258,
				maxHeight: 372,
				angle: this.#angle,
				closeByEsc: false,
				closeIcon: false,
				items: this.#getMenuItems(this.#menuItems),
				toFrontOnShow: true,
				autoHide: this.#autoHide,
				className: `ai__copilot-scope ai__copilot-menu-popup ${this.#bordered ? '--bordered' : ''}`,
				cacheable: this.#cacheable,
				events: {
					onPopupClose: popup => {
						this.emit(CopilotMenuEvents.close);
						main_core.Dom.style(popup.getPopupContainer(), 'border', 'none');
					},
					onPopupAfterClose: popup => {
						main_core.Dom.style(popup.getPopupContainer(), 'border', null);
					},
					onPopupShow: () => {
						if (this.#forceTop && this.#isMenuVisible() === false) {
							this.#scrollForMenuVisibility();
						}
					}
				}
			});
			const keyBoardMenu = new KeyboardMenu({
				menu,
				...this.#keyboardControlOptions
			});
			keyBoardMenu.subscribe(KeyboardMenuEvents.clearHighlight, () => {
				this.emit(CopilotMenuEvents.clearHighlight);
			});
			keyBoardMenu.subscribe(KeyboardMenuEvents.highlightMenuItem, () => {
				this.emit(CopilotMenuEvents.highlightMenuItem);
			});
			this.#keyboardMenu = keyBoardMenu;
		}
		#isMenuVisible() {
			const popupContainer = this.#getMenu().getPopupWindow().getPopupContainer();
			const popupContainerPosition = popupContainer.getBoundingClientRect();
			return popupContainerPosition.bottom < window.innerHeight;
		}
		#scrollForMenuVisibility() {
			const popupContainer = this.#getMenu().getPopupWindow().getPopupContainer();
			const popupContainerPosition = main_core.Dom.getPosition(popupContainer);
			window.scrollTo({
				top: popupContainerPosition.bottom + 20 - window.innerHeight,
				behavior: 'smooth'
			});
			if (popupContainerPosition.bottom > document.body.scrollHeight) {
				main_core.Dom.style(document.body, 'min-height', `${popupContainerPosition.bottom}px`);
			}
		}
		#getMenuItems(items, isSubmenu = false) {
			if (!items) {
				return [];
			}
			const menuItems = items.map(item => {
				return this.#getMenuItem(item, isSubmenu);
			});
			if (this.#roleInfo && isSubmenu === false) {
				menuItems.unshift(this.#getRoleMenuItem());
			}
			return menuItems;
		}
		#getMenuItem(item, isSubmenuItem) {
			return this.#isSeparatorMenuItem(item) ? this.#getSectionSeparatorMenuItem(item) : this.#getAbilityMenuItem(item, isSubmenuItem);
		}
		#isSeparatorMenuItem(menuItem) {
			return menuItem.separator;
		}
		#getAbilityMenuItem(item, isSubmenuItem = false) {
			const iconElem = this.#renderAbilityMenuItemIcon(item);
			const checkIcon = this.#getCheckIcon();
			const menuIcon = item.icon ? main_core.Tag.render`<div class="ai__copilot-menu_item-icon">${iconElem}</div>` : null;
			const label = item.labelText ? new ui_label.Label({
				text: item.labelText,
				color: ui_label.LabelColor.PRIMARY,
				fill: true,
				size: ui_label.LabelSize.SM
			}).render() : null;
			const labelWrapper = label ? main_core.Tag.render(`<div>${label}</div>`) : null;
			const favouriteLabel = main_core.Type.isBoolean(item.isFavourite) ? this.#renderFavouriteLabel(item.code, item.isFavourite) : null;
			const html = main_core.Tag.render`
			<div class="${this.#getMenuItemClassname(item, isSubmenuItem, item.selected)}">
				<div class="ai__copilot-menu_item-left">
					${menuIcon}
					<div class="ai__copilot-menu_item-text">${main_core.Text.encode(item.text)}</div>
				</div>
				<div class="ai__copilot-menu_item-right">
					${favouriteLabel}
					<div class="ai__copilot-menu_item-check">
						${checkIcon.render()}
					</div>
					${labelWrapper}
				</div>
			</div>
		`;
			return {
				html,
				id: item.id || '',
				text: item.text,
				href: item.href,
				className: `menu-popup-no-icon ${item.arrow ? 'menu-popup-item-submenu' : ''}`,
				onclick: this.#handleMenuItemClick(item.command).bind(this),
				items: this.#getMenuItems(item.children, true),
				cacheable: false,
				disabled: item.disabled
			};
		}
		#renderFavouriteLabel(promptCode, isFavourite = false) {
			const favouriteIcon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Main.BOOKMARK_1,
				size: 24
			});
			const iconWrapperClassname = `ai__copilot-menu_item-favourite ${isFavourite ? '--is-favourite' : ''}`;
			const title = isFavourite ? main_core.Loc.getMessage('AI_COPILOT_REMOVE_PROMPT_FROM_FAVOURITE') : main_core.Loc.getMessage('AI_COPILOT_ADD_PROMPT_TO_FAVOURITE');
			const wrapper = main_core.Tag.render`
			<div title="${title}" class="${iconWrapperClassname}">
				${favouriteIcon.render()}
			</div>
		`;
			main_core.bind(wrapper, 'click', event => {
				event.preventDefault();
				event.stopImmediatePropagation();
				const newIsFavourite = !isFavourite;
				this.emit('set-favourite', {
					promptCode,
					isFavourite: newIsFavourite
				});
			});
			return wrapper;
		}
		#getRoleMenuItem() {
			return {
				id: 'role-item',
				html: this.#getRoleMenuItemHtml(),
				className: `menu-popup-no-icon ${this.#roleInfo.onclick ? 'menu-popup-item-submenu' : ''} --role-item`,
				onclick: this.#handleMenuItemClick(this.#roleInfo.onclick).bind(this)
			};
		}
		#getRoleMenuItemHtml() {
			if (this.#roleInfoContainer) {
				return this.#roleInfoContainer;
			}
			const {
				name,
				avatar
			} = this.#roleInfo.role;
			const subtitle = this.#roleInfo.subtitle;
			this.#roleInfoContainer = main_core.Tag.render`
			<div class="ai__copilot-menu_item">
				<div class="ai__copilot-menu_role">
					<div class="ai__copilot-menu_role-left">
						<img class="ai__copilot-menu_role-avatar" src="${avatar.small}" alt="">
					</div>
					<div class="ai__copilot-menu_role-right">
						<span
							class="ai__copilot-menu_role-title"
							title="${name}"
						>
							${name}
						</span>
						<span class="ai__copilot-menu_role-subtitle">${subtitle}</span>
					</div>
				</div>
			</div>
		`;
			return this.#roleInfoContainer;
		}
		#renderAbilityMenuItemIcon(item) {
			let iconElem = null;
			if (item.icon) {
				try {
					const icon = new ui_iconSet_api_core.Icon({
						size: 24,
						icon: item.icon || undefined
					});
					iconElem = icon.render();
				} catch {
					iconElem = null;
				}
			}
			return iconElem;
		}
		#getCheckIcon() {
			const checkIconColor = getComputedStyle(document.body).getPropertyValue('--ui-color-link-primary-base');
			return new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Main.CHECK,
				size: 18,
				color: checkIconColor
			});
		}
		#getMenuItemClassname(item, isSubMenuItem) {
			let classNames = ['ai__copilot-menu_item'];
			if (isSubMenuItem) {
				classNames = [...classNames, '--no-icon'];
			}
			if (item.notHighlight) {
				classNames = [...classNames, '--system'];
			}
			if (item.highlightText) {
				classNames = [...classNames, '--highlight-text'];
			}
			if (item.selected) {
				classNames = [...classNames, '--selected'];
			}
			if (item.isShowFavouriteIconOnHover) {
				classNames = [...classNames, '--favourite-icon-on-hover'];
			}
			return classNames.join(' ');
		}
		#handleMenuItemClick(command) {
			return async (event, menuItem) => {
				if (menuItem?.hasSubMenu()) {
					return;
				}
				menuItem.getMenuWindow()?.getParentMenuItem()?.closeSubMenu();
				if (menuItem.href) {
					return;
				}
				this.#showMenuItemLoader(menuItem);
				if (main_core.Type.isFunction(command)) {
					await command(event, menuItem, this);
				} else {
					await command?.execute();
				}
				this.#destroyMenuItemLoader(menuItem);
			};
		}
		#showMenuItemLoader(menuItem) {
			const loaderSize = 18;
			const loaderColor = getComputedStyle(document.body.querySelector('.ai__copilot-scope')).getPropertyValue('--ai__copilot_color-main');
			const loaderWrapper = main_core.Tag.render`<div class="ai__copilot-menu_item-loader"></div>`;
			const menuItemContent = menuItem.getContainer().querySelector('.ai__copilot-menu_item-right');
			main_core.Dom.addClass(menuItem.getContainer(), 'menu-popup-item-loading');
			main_core.Dom.append(loaderWrapper, menuItemContent);
			const loader = new main_loader.Loader({
				size: loaderSize,
				target: loaderWrapper,
				color: loaderColor
			});
			loader.show();
		}
		#destroyMenuItemLoader(menuItem) {
			const loaderWrapper = menuItem.getContainer().querySelector('.ai__copilot-menu_item-loader');
			main_core.Dom.removeClass(menuItem.getContainer(), 'menu-popup-item-loading');
			main_core.Dom.remove(loaderWrapper);
		}
		#getSectionSeparatorMenuItem(item) {
			return {
				id: item.code || item.title || '',
				text: item.title,
				title: item.title,
				delimiter: true,
				html: item.title ? `
					<span>${item.title}</span>
					${item.isNew ? this.#renderSeparatorMenuItemNewLabel().outerHTML : ''}
				` : undefined
			};
		}
		#renderSeparatorMenuItemNewLabel() {
			return this.#renderSeparatorMenuItemLabel(main_core.Loc.getMessage('AI_COPILOT_MENU_ITEM_LABEL_NEW'));
		}
		#renderSeparatorMenuItemLabel(text) {
			const newLabel = new ui_label.Label({
				text,
				color: ui_label.Label.Color.PRIMARY,
				size: ui_label.Label.Size.SM,
				fill: true
			});
			return main_core.Tag.render`<span class="ai__copilot-menu_delimiter-label">${newLabel.render().outerHTML}</span>`;
		}
		#initRoleInfoFromOptions(roleInfoOption) {
			if (roleInfoOption) {
				this.#roleInfo = roleInfoOption;
				this.#currentRole = new Proxy(roleInfoOption.role, {
					set: (target, p, newValue) => {
						if (this.#roleInfoContainer && p === 'name') {
							const nameContainer = this.#roleInfoContainer.querySelector('.ai__copilot-menu_role-title');
							main_core.Dom.attr(nameContainer, 'title', newValue);
							nameContainer.innerText = newValue;
						}
						if (this.#roleInfoContainer && p === 'avatar') {
							const avatarImg = this.#roleInfoContainer.querySelector('.ai__copilot-menu_role-avatar');
							avatarImg.src = newValue.small;
						}
						return Reflect.set(target, p, newValue);
					}
				});
			}
		}
	}

	class CopilotMenuCommand {
		execute() {
			throw new Error('You must implement this method.');
		}
	}

	class BaseMenuItem extends main_core_events.EventEmitter {
		id = '';
		constructor(options) {
			super();
			this.setEventNamespace('AI.CopilotMenuItem');
			if (options.id) {
				this.id = options.id;
			}
			this.code = options.code;
			this.text = options.text;
			this.icon = options.icon;
			this.href = options.href;
			this.children = options.children ?? [];
			this.onClick = options.onClick;
			this.disabled = options.disabled;
		}
		getOptions() {
			return {
				id: this.id,
				code: this.code,
				text: this.text,
				icon: this.icon,
				href: this.href,
				command: this.onClick,
				disabled: this.disabled,
				children: this.children.map(childrenMenuItem => {
					if (childrenMenuItem instanceof BaseMenuItem) {
						return childrenMenuItem.getOptions();
					}
					return childrenMenuItem;
				})
			};
		}
	}

	class CopilotResult {
		#container;
		#rawResult;
		render() {
			this.#container = main_core.Tag.render`<div class="ai__copilot-result"></div>`;
			this.#rawResult = '';
			return this.#container;
		}
		addResult(result, resultPreview) {
			this.#rawResult = result;
			this.#container.innerHTML += resultPreview ?? result;
		}
		clearResult() {
			this.#rawResult = '';
			this.#container.innerHTML = '';
		}
		getResult() {
			return this.#rawResult;
		}
	}

	const initPopup = options => {
		const target = options.target;
		const text = options.text;
		return new main_popup.Popup({
			content: main_core.Tag.render`<div style="padding-right: 20px;">${text}</div>`,
			darkMode: true,
			borderRadius: '4px',
			animation: 'fading-slide',
			autoHide: true,
			events: {
				onPopupShow: getPopupShowEventHandler(target)
			}
		});
	};
	const getPopupShowEventHandler = target => {
		return popup => {
			const targetPos = main_core.Dom.getPosition(target);
			const popupPos = main_core.Dom.getPosition(popup.getPopupContainer());
			const angleOffset = main_popup.Popup.getOption('angleLeftOffset');
			popup.setAngle({
				offset: popupPos.width / 2 - targetPos.width / 2 - 4
			});
			popup.setBindElement({
				left: targetPos.left - popupPos.width / 2 + targetPos.width / 2 + angleOffset,
				top: targetPos.bottom
			});
			popup.adjustPosition({
				forceBindPosition: true,
				forceLeft: true,
				forceTop: true
			});
		};
	};
	class CopilotHint {
		#popup = null;
		constructor(options) {
			this.#popup = initPopup(options);
		}
		static addHintOnTargetHover(options) {
			const popup = initPopup(options);
			const target = options.target;
			main_core.Event.bind(target, 'mouseenter', () => {
				popup.show();
			});
			main_core.Event.bind(target, 'mouseleave', () => {
				popup.close();
			});
		}
		show() {
			this.#popup?.show();
		}
		hide() {
			this.#popup?.close();
		}
		isShown() {
			return Boolean(this.#popup?.isShown());
		}
	}

	function createRangeWithPosition(node, targetPosition) {
		const range = document.createRange();
		range.selectNode(node);
		range.setStart(node, 0);
		let pos = 0;
		const stack = [node];
		while (stack.length > 0) {
			const current = stack.pop();
			if (current.nodeType === Node.TEXT_NODE) {
				const len = current.textContent.length;
				if (pos + len >= targetPosition) {
					range.setStart(current, targetPosition - pos);
					range.setEnd(current, targetPosition - pos);
					return range;
				}
				pos += len;
			} else if (current.childNodes && current.childNodes.length > 0) {
				for (let i = current.childNodes.length - 1; i >= 0; i--) {
					stack.push(current.childNodes[i]);
				}
			}
		}
		range.setStart(node, node.childNodes.length);
		range.setEnd(node, node.childNodes.length);
		return range;
	}
	function setCursorPosition(node, targetPosition) {
		const range = createRangeWithPosition(node, targetPosition);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	}
	function getCursorPosition(node) {
		const selection = window.getSelection();
		const range = selection.getRangeAt(0);
		const clonedRange = range.cloneRange();
		clonedRange.selectNodeContents(node);
		clonedRange.setEnd(range.endContainer, range.endOffset);
		return clonedRange.toString().length;
	}

	class CopilotInputFieldTextarea extends main_core_events.EventEmitter {
		#container;
		constructor(options) {
			super(options);
			this.value = '';
			this.setEventNamespace('AI.CopilotInputFieldTextarea');
		}
		getContainer() {
			return this.#container;
		}
		render() {
			this.#container = main_core.Tag.render`
			<div
				class="ai__copilot_input"
				contenteditable="true"></div>
		`;
			const observer = new MutationObserver(this.#observeRemovingStrongTagAfterDeletingBracket.bind(this));
			observer.observe(this.#container, {
				childList: true,
				subtree: true,
				characterDataOldValue: true
			});
			main_core.bind(this.#container, 'input', this.#handleInputEvent.bind(this));
			main_core.bind(this.#container, 'paste', this.#handlePasteEvent.bind(this));
			main_core.bind(this.#container, 'focus', e => {
				this.emit('focus');
			});
			return this.#container;
		}
		#observeRemovingStrongTagAfterDeletingBracket(mutations) {
			for (const mutation of mutations) {
				if (mutation.target.parentElement?.tagName !== 'STRONG') {
					continue;
				}
				const nodeText = mutation.target.nodeValue || '';
				const openBracketPosition = [...nodeText].indexOf('[');
				const closeBracketPosition = [...nodeText].indexOf(']');
				if (closeBracketPosition === -1 || openBracketPosition === -1) {
					const pos = this.getCursorPosition();
					mutation.target.parentElement.replaceWith(...mutation.target.parentElement.childNodes);
					this.setCursorPosition(pos);
				}
			}
		}
		set value(text) {
			if (this.#container) {
				this.#container.innerText = text;
			}
		}
		get value() {
			return this.#container.innerText;
		}
		get disabled() {
			return this.#container?.getAttribute('contenteditable') === 'false';
		}
		set disabled(disabled) {
			if (disabled === false) {
				main_core.Dom.attr(this.#container, 'contenteditable', true);
			} else {
				main_core.Dom.attr(this.#container, 'contenteditable', false);
			}
		}
		focus(setCursorAtStart) {
			const cursorPosition = setCursorAtStart ? 0 : 999;
			this.#container?.focus();
			this.setCursorPosition(cursorPosition);
		}
		getComputedStyle() {
			return getComputedStyle(this.#container);
		}
		addClass(className) {
			main_core.Dom.addClass(this.#container, className);
		}
		removeClass(className) {
			main_core.Dom.removeClass(this.#container, className);
		}
		setStyle(prop, value) {
			main_core.Dom.style(this.#container, prop, value);
		}
		get scrollHeight() {
			return this.#container?.scrollHeight || 0;
		}
		isCursorInTheEnd() {
			const pos = this.getCursorPosition();
			const contentLength = this.#container.innerText.length;
			return pos >= contentLength;
		}
		getCursorPosition() {
			return getCursorPosition(this.#container);
		}
		setCursorPosition(position) {
			setCursorPosition(this.#container, position);
		}
		setHtmlContent(html) {
			this.#container.innerHTML = html;
			this.focus();
			this.emit('input', this.value);
		}
		#handlePasteEvent(e) {
			e.preventDefault();
			const text = e.clipboardData.getData('text/plain');
			document.execCommand('insertText', false, text);
		}
		#handleInputEvent(e) {
			if (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteWordBackward' || e.inputType === 'deleteContentForward') {
				this.emit('input', this.value);
				return;
			}
			const selection = window.getSelection();
			const cursorPosition = this.getCursorPosition();
			if (selection.anchorNode.parentElement?.tagName === 'STRONG' && selection.focusOffset === selection.anchorNode.length && selection.anchorNode.textContent.at(0) === '[') {
				let nextNode = selection.anchorNode.parentElement.nextSibling;
				if (!nextNode || nextNode.nodeName === 'BR') {
					nextNode = document.createTextNode(' ');
					main_core.Dom.insertAfter(nextNode, selection.anchorNode.parentElement);
				}
				selection.anchorNode.textContent = selection.anchorNode.textContent.slice(0, -e.data.length);
				nextNode.textContent = e.data + nextNode.textContent;
				this.setCursorPosition(cursorPosition);
				e.preventDefault();
				e.stopPropagation();
				return;
			}
			this.emit('input', this.value);
		}
	}

	var nm = "18";
	var v = "5.9.6";
	var fr = 60;
	var ip = 0;
	var op = 539;
	var w = 210;
	var h = 210;
	var ddd = 0;
	var markers = [
	];
	var assets = [
		{
			nm: "[FRAME] 18 - Null / left-star - Null / left-star / right-star - Null / right-star / round - Null / round / Ellipse 2 - Null / Ellipse 2 - Stroke",
			fr: 60,
			id: "lo8h9rmzawnjrpxsxm9",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 4,
					hd: false,
					nm: "18 - Null",
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					st: 0,
					ip: 0,
					op: 540,
					bm: 0,
					sr: 1
				},
				{
					ty: 3,
					ddd: 0,
					ind: 5,
					hd: false,
					nm: "left-star - Null",
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								37.7244,
								37.5291
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								95.78874400000001,
								95.16759099999999
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								101,
								101
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					st: 0,
					ip: 0,
					op: 540,
					bm: 0,
					sr: 1
				},
				{
					ty: 4,
					ddd: 0,
					ind: 6,
					hd: false,
					nm: "left-star",
					parent: 5,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					st: 0,
					ip: 0,
					op: 540,
					bm: 0,
					sr: 1,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 1,
										k: [
											{
												t: 25.89,
												s: [
													{
														c: true,
														v: [
															[
																39.4485,
																0.9376
															],
															[
																36.0004,
																0.9376
															],
															[
																29.4602,
																18.5122
															],
															[
																18.5993,
																29.3117
															],
															[
																0.9248,
																35.8149
															],
															[
																0.9248,
																39.2435
															],
															[
																18.5994,
																45.7467
															],
															[
																29.4603,
																56.5462
															],
															[
																36.0005,
																74.1208
															],
															[
																39.4486,
																74.1208
															],
															[
																45.9888,
																56.5462
															],
															[
																56.8497,
																45.7467
															],
															[
																74.5243,
																39.2435
															],
															[
																74.5243,
																35.8149
															],
															[
																56.8498,
																29.3117
															],
															[
																45.9889,
																18.5122
															],
															[
																39.4485,
																0.9376
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.5922,
																-1.5914
															],
															[
																0,
																0
															],
															[
																5.0318,
																-1.8514
															],
															[
																0,
																0
															],
															[
																-1.6004,
																-0.5889
															],
															[
																0,
																0
															],
															[
																-1.8619,
																-5.0033
															],
															[
																0,
																0
															],
															[
																-0.5922,
																1.5914
															],
															[
																0,
																0
															],
															[
																-5.0318,
																1.8514
															],
															[
																0,
																0
															],
															[
																1.6004,
																0.5889
															],
															[
																0,
																0
															],
															[
																1.8619,
																5.0033
															],
															[
																0,
																0
															]
														],
														o: [
															[
																-0.5922199999999975,
																-1.5914
															],
															[
																0,
																0
															],
															[
																-1.8619200000000014,
																5.003299999999999
															],
															[
																0,
																0
															],
															[
																-1.60045,
																0.58887
															],
															[
																0,
																0
															],
															[
																5.031760000000002,
																1.851390000000002
															],
															[
																0,
																0
															],
															[
																0.5922199999999975,
																1.591399999999993
															],
															[
																0,
																0
															],
															[
																1.8619199999999978,
																-5.003300000000003
															],
															[
																0,
																0
															],
															[
																1.600449999999995,
																-0.58887
															],
															[
																0,
																0
															],
															[
																-5.031770000000002,
																-1.8513899999999985
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0.3
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 145.224,
												s: [
													{
														c: true,
														v: [
															[
																38.4952,
																21.1678
															],
															[
																36.9535,
																21.1678
															],
															[
																34.0294,
																29.026
															],
															[
																29.1734,
																33.8548
															],
															[
																21.271,
																36.7626
															],
															[
																21.271,
																38.2956
															],
															[
																29.1734,
																41.2034
															],
															[
																34.0294,
																46.0322
															],
															[
																36.9536,
																53.8904
															],
															[
																38.4953,
																53.8904
															],
															[
																41.4194,
																46.0322
															],
															[
																46.2754,
																41.2034
															],
															[
																54.1778,
																38.2956
															],
															[
																54.1778,
																36.7626
															],
															[
																46.2754,
																33.8548
															],
															[
																41.4194,
																29.026
															],
															[
																38.4952,
																21.1678
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.2648,
																-0.7116
															],
															[
																0,
																0
															],
															[
																2.2497,
																-0.8278
															],
															[
																0,
																0
															],
															[
																-0.7156,
																-0.2633
															],
															[
																0,
																0
															],
															[
																-0.8325,
																-2.2371
															],
															[
																0,
																0
															],
															[
																-0.2648,
																0.7116
															],
															[
																0,
																0
															],
															[
																-2.2497,
																0.8278
															],
															[
																0,
																0
															],
															[
																0.7156,
																0.2633
															],
															[
																0,
																0
															],
															[
																0.8325,
																2.2371
															],
															[
																0,
																0
															]
														],
														o: [
															[
																-0.26478999999999786,
																-0.7115700000000018
															],
															[
																0,
																0
															],
															[
																-0.8324799999999968,
																2.2371499999999997
															],
															[
																0,
																0
															],
															[
																-0.7155699999999996,
																0.263300000000001
															],
															[
																0,
																0
															],
															[
																2.2497299999999996,
																0.8278200000000027
															],
															[
																0,
																0
															],
															[
																0.26478999999999786,
																0.7115700000000018
															],
															[
																0,
																0
															],
															[
																0.8324799999999968,
																-2.2371499999999997
															],
															[
																0,
																0
															],
															[
																0.7155699999999996,
																-0.263300000000001
															],
															[
																0,
																0
															],
															[
																-2.2497299999999996,
																-0.8278200000000027
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0.3
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 245.88,
												s: [
													{
														c: true,
														v: [
															[
																39.3124,
																3.8283
															],
															[
																36.1365,
																3.8283
															],
															[
																30.1127,
																20.0145
															],
															[
																20.1092,
																29.9608
															],
															[
																3.83,
																35.9502
															],
															[
																3.83,
																39.1079
															],
															[
																20.1092,
																45.0973
															],
															[
																30.1127,
																55.0436
															],
															[
																36.1366,
																71.2297
															],
															[
																39.3125,
																71.2297
															],
															[
																45.3363,
																55.0435
															],
															[
																55.3398,
																45.0972
															],
															[
																71.619,
																39.1078
															],
															[
																71.619,
																35.9501
															],
															[
																55.3398,
																29.9607
															],
															[
																45.3363,
																20.0144
															],
															[
																39.3124,
																3.8283
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.5455,
																-1.4657
															],
															[
																0,
																0
															],
															[
																4.6345,
																-1.7051
															],
															[
																0,
																0
															],
															[
																-1.4741,
																-0.5423
															],
															[
																0,
																0
															],
															[
																-1.7149,
																-4.608
															],
															[
																0,
																0
															],
															[
																-0.5455,
																1.4657
															],
															[
																0,
																0
															],
															[
																-4.6345,
																1.7051
															],
															[
																0,
																0
															],
															[
																1.4741,
																0.5423
															],
															[
																0,
																0
															],
															[
																1.7149,
																4.608
															],
															[
																0,
																0
															]
														],
														o: [
															[
																-0.5454700000000017,
																-1.4656800000000003
															],
															[
																0,
																0
															],
															[
																-1.714929999999999,
																4.608029999999999
															],
															[
																0,
																0
															],
															[
																-1.4741,
																0.542349999999999
															],
															[
																0,
																0
															],
															[
																4.634520000000002,
																1.705129999999997
															],
															[
																0,
																0
															],
															[
																0.5454700000000017,
																1.465680000000006
															],
															[
																0,
																0
															],
															[
																1.7149300000000025,
																-4.608029999999999
															],
															[
																0,
																0
															],
															[
																1.4740999999999929,
																-0.542349999999999
															],
															[
																0,
																0
															],
															[
																-4.634520000000002,
																-1.7051300000000005
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0.3
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 356.178,
												s: [
													{
														c: true,
														v: [
															[
																38.4728,
																21.6471
															],
															[
																36.9761,
																21.6471
															],
															[
																34.1372,
																29.2751
															],
															[
																29.4227,
																33.9624
															],
															[
																21.7506,
																36.785
															],
															[
																21.7506,
																38.2731
															],
															[
																29.4228,
																41.0957
															],
															[
																34.1373,
																45.7831
															],
															[
																36.9763,
																53.4111
															],
															[
																38.4731,
																53.4111
															],
															[
																41.3121,
																45.7831
															],
															[
																46.0266,
																41.0958
															],
															[
																53.6988,
																38.2732
															],
															[
																53.6988,
																36.7851
															],
															[
																46.0266,
																33.9625
															],
															[
																41.3121,
																29.2751
															],
															[
																38.4728,
																21.6471
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.2571,
																-0.6907
															],
															[
																0,
																0
															],
															[
																2.1842,
																-0.8036
															],
															[
																0,
																0
															],
															[
																-0.6947,
																-0.2556
															],
															[
																0,
																0
															],
															[
																-0.8082,
																-2.1716
															],
															[
																0,
																0
															],
															[
																-0.2571,
																0.6907
															],
															[
																0,
																0
															],
															[
																-2.1842,
																0.8036
															],
															[
																0,
																0
															],
															[
																0.6947,
																0.2556
															],
															[
																0,
																0
															],
															[
																0.8082,
																2.1716
															],
															[
																0,
																0
															]
														],
														o: [
															[
																-0.2570699999999988,
																-0.6907199999999989
															],
															[
																0,
																0
															],
															[
																-0.8082199999999986,
																2.1716000000000015
															],
															[
																0,
																0
															],
															[
																-0.6947200000000002,
																0.255589999999998
															],
															[
																0,
																0
															],
															[
																2.1841800000000013,
																0.8035700000000006
															],
															[
																0,
																0
															],
															[
																0.2570699999999988,
																0.6907199999999989
															],
															[
																0,
																0
															],
															[
																0.8082199999999986,
																-2.171599999999998
															],
															[
																0,
																0
															],
															[
																0.6947199999999967,
																-0.255589999999998
															],
															[
																0,
																0
															],
															[
																-2.184179999999998,
																-0.8035700000000006
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0.3
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 474.312,
												s: [
													{
														c: true,
														v: [
															[
																39.4485,
																0.9397
															],
															[
																36.0004,
																0.9397
															],
															[
																29.4602,
																18.5132
															],
															[
																18.5993,
																29.3121
															],
															[
																0.9248,
																35.8149
															],
															[
																0.9248,
																39.2433
															],
															[
																18.5994,
																45.7461
															],
															[
																29.4603,
																56.545
															],
															[
																36.0005,
																74.1185
															],
															[
																39.4486,
																74.1185
															],
															[
																45.9888,
																56.545
															],
															[
																56.8497,
																45.7462
															],
															[
																74.5243,
																39.2434
															],
															[
																74.5243,
																35.815
															],
															[
																56.8498,
																29.3122
															],
															[
																45.9889,
																18.5133
															],
															[
																39.4485,
																0.9397
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.5922,
																-1.5913
															],
															[
																0,
																0
															],
															[
																5.0318,
																-1.8513
															],
															[
																0,
																0
															],
															[
																-1.6004,
																-0.5888
															],
															[
																0,
																0
															],
															[
																-1.8619,
																-5.003
															],
															[
																0,
																0
															],
															[
																-0.5922,
																1.5913
															],
															[
																0,
																0
															],
															[
																-5.0318,
																1.8513
															],
															[
																0,
																0
															],
															[
																1.6004,
																0.5888
															],
															[
																0,
																0
															],
															[
																1.8619,
																5.003
															],
															[
																0,
																0
															]
														],
														o: [
															[
																-0.5922199999999975,
																-1.59131
															],
															[
																0,
																0
															],
															[
																-1.8619200000000014,
																5.00301
															],
															[
																0,
																0
															],
															[
																-1.60045,
																0.5888399999999976
															],
															[
																0,
																0
															],
															[
																5.031760000000002,
																1.8512800000000027
															],
															[
																0,
																0
															],
															[
																0.5922199999999975,
																1.591310000000007
															],
															[
																0,
																0
															],
															[
																1.8619199999999978,
																-5.003
															],
															[
																0,
																0
															],
															[
																1.600449999999995,
																-0.5888399999999976
															],
															[
																0,
																0
															],
															[
																-5.031770000000002,
																-1.8512799999999991
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												]
											}
										]
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 2
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 7,
					hd: false,
					nm: "right-star - Null",
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								21.7973,
								21.6844
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								128.4094,
								121.8898
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					st: 0,
					ip: 0,
					op: 540,
					bm: 0,
					sr: 1
				},
				{
					ty: 4,
					ddd: 0,
					ind: 8,
					hd: false,
					nm: "right-star",
					parent: 7,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					st: 0,
					ip: 0,
					op: 540,
					bm: 0,
					sr: 1,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 1,
										k: [
											{
												t: 66.27,
												s: [
													{
														c: true,
														v: [
															[
																22.6367,
																3.8608
															],
															[
																20.958,
																3.8608
															],
															[
																17.774,
																12.4213
															],
															[
																12.4865,
																17.6817
															],
															[
																3.8818,
																20.8494
															],
															[
																3.8818,
																22.5195
															],
															[
																12.4865,
																25.6872
															],
															[
																17.774,
																30.9476
															],
															[
																20.958,
																39.5081
															],
															[
																22.6367,
																39.5081
															],
															[
																25.8207,
																30.9476
															],
															[
																31.1083,
																25.6872
															],
															[
																39.713,
																22.5195
															],
															[
																39.713,
																20.8495
															],
															[
																31.1083,
																17.6818
															],
															[
																25.8208,
																12.4214
															],
															[
																22.6367,
																3.8608
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.2883,
																-0.7752
															],
															[
																0,
																0
															],
															[
																2.4497,
																-0.9018
															],
															[
																0,
																0
															],
															[
																-0.7792,
																-0.2868
															],
															[
																0,
																0
															],
															[
																-0.9065,
																-2.4371
															],
															[
																0,
																0
															],
															[
																-0.2883,
																0.7752
															],
															[
																0,
																0
															],
															[
																-2.4497,
																0.9018
															],
															[
																0,
																0
															],
															[
																0.7792,
																0.2868
															],
															[
																0,
																0
															],
															[
																0.9065,
																2.4371
															],
															[
																0,
																0
															]
														],
														o: [
															[
																-0.2883199999999988,
																-0.7751600000000001
															],
															[
																0,
																0
															],
															[
																-0.9064599999999992,
																2.4370899999999995
															],
															[
																0,
																0
															],
															[
																-0.7791700000000001,
																0.28684000000000154
															],
															[
																0,
																0
															],
															[
																2.4496800000000007,
																0.9018100000000011
															],
															[
																0,
																0
															],
															[
																0.2883199999999988,
																0.7751700000000028
															],
															[
																0,
																0
															],
															[
																0.9064599999999992,
																-2.4370900000000013
															],
															[
																0,
																0
															],
															[
																0.7791599999999974,
																-0.28684000000000154
															],
															[
																0,
																0
															],
															[
																-2.4496800000000007,
																-0.9018100000000011
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														0
													],
													y: [
														1
													]
												}
											},
											{
												t: 156.072,
												s: [
													{
														c: true,
														v: [
															[
																23.2285,
																-8.7091
															],
															[
																20.3661,
																-8.7091
															],
															[
																14.9369,
																5.8887
															],
															[
																5.9209,
																14.8589
															],
															[
																-8.7513,
																20.2606
															],
															[
																-8.7513,
																23.1084
															],
															[
																5.9209,
																28.5101
															],
															[
																14.9369,
																37.4804
															],
															[
																20.3661,
																52.0782
															],
															[
																23.2285,
																52.0782
															],
															[
																28.6577,
																37.4805
															],
															[
																37.6737,
																28.5103
															],
															[
																52.3459,
																23.1086
															],
															[
																52.3459,
																20.2608
															],
															[
																37.6737,
																14.8591
															],
															[
																28.6577,
																5.8889
															],
															[
																23.2285,
																-8.7091
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.4916,
																-1.3218
															],
															[
																0,
																0
															],
															[
																4.177,
																-1.5378
															],
															[
																0,
																0
															],
															[
																-1.3286,
																-0.4891
															],
															[
																0,
																0
															],
															[
																-1.5456,
																-4.1558
															],
															[
																0,
																0
															],
															[
																-0.4916,
																1.3218
															],
															[
																0,
																0
															],
															[
																-4.177,
																1.5378
															],
															[
																0,
																0
															],
															[
																1.3286,
																0.4891
															],
															[
																0,
																0
															],
															[
																1.5456,
																4.1558
															],
															[
																0,
																0
															]
														],
														o: [
															[
																-0.49162000000000106,
																-1.32184
															],
															[
																0,
																0
															],
															[
																-1.5456400000000006,
																4.155840000000001
															],
															[
																0,
																0
															],
															[
																-1.3285900000000002,
																0.4891299999999994
															],
															[
																0,
																0
															],
															[
																4.17703,
																1.5378000000000007
															],
															[
																0,
																0
															],
															[
																0.49162000000000106,
																1.3218499999999977
															],
															[
																0,
																0
															],
															[
																1.5456399999999988,
																-4.155839999999998
															],
															[
																0,
																0
															],
															[
																1.3285699999999991,
																-0.4891299999999994
															],
															[
																0,
																0
															],
															[
																-4.177030000000002,
																-1.5378000000000007
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														0
													],
													y: [
														1
													]
												}
											},
											{
												t: 283.854,
												s: [
													{
														c: true,
														v: [
															[
																22.5686,
																5.3037
															],
															[
																21.026,
																5.3037
															],
															[
																18.1001,
																13.1712
															],
															[
																13.2413,
																18.0057
															],
															[
																5.3343,
																20.9169
															],
															[
																5.3343,
																22.4517
															],
															[
																13.2413,
																25.3629
															],
															[
																18.1001,
																30.1974
															],
															[
																21.026,
																38.0649
															],
															[
																22.5686,
																38.0649
															],
															[
																25.4945,
																30.1974
															],
															[
																30.3533,
																25.3629
															],
															[
																38.2603,
																22.4517
															],
															[
																38.2603,
																20.9169
															],
															[
																30.3533,
																18.0057
															],
															[
																25.4945,
																13.1712
															],
															[
																22.5686,
																5.3037
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.2649,
																-0.7124
															],
															[
																0,
																0
															],
															[
																2.251,
																-0.8288
															],
															[
																0,
																0
															],
															[
																-0.716,
																-0.2636
															],
															[
																0,
																0
															],
															[
																-0.833,
																-2.2398
															],
															[
																0,
																0
															],
															[
																-0.2649,
																0.7124
															],
															[
																0,
																0
															],
															[
																-2.251,
																0.8288
															],
															[
																0,
																0
															],
															[
																0.716,
																0.2636
															],
															[
																0,
																0
															],
															[
																0.833,
																2.2398
															],
															[
																0,
																0
															]
														],
														o: [
															[
																-0.2649399999999993,
																-0.7124100000000002
															],
															[
																0,
																0
															],
															[
																-0.8329599999999999,
																2.2398000000000007
															],
															[
																0,
																0
															],
															[
																-0.7159899999999997,
																0.2636199999999995
															],
															[
																0,
																0
															],
															[
																2.251050000000001,
																0.8288000000000011
															],
															[
																0,
																0
															],
															[
																0.2649399999999993,
																0.7124099999999984
															],
															[
																0,
																0
															],
															[
																0.8329599999999999,
																-2.239799999999999
															],
															[
																0,
																0
															],
															[
																0.7159800000000018,
																-0.2636199999999995
															],
															[
																0,
																0
															],
															[
																-2.2510499999999993,
																-0.8288000000000011
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														0
													],
													y: [
														1
													]
												}
											},
											{
												t: 379.08,
												s: [
													{
														c: true,
														v: [
															[
																23.233,
																-8.8011
															],
															[
																20.3615,
																-8.8011
															],
															[
																14.9151,
																5.8409
															],
															[
																5.8706,
																14.8383
															],
															[
																-8.8481,
																20.2563
															],
															[
																-8.8481,
																23.1128
															],
															[
																5.8706,
																28.5308
															],
															[
																14.9152,
																37.5282
															],
															[
																20.3616,
																52.1701
															],
															[
																23.2331,
																52.1701
															],
															[
																28.6795,
																37.5282
															],
															[
																37.7241,
																28.5308
															],
															[
																52.4428,
																23.1128
															],
															[
																52.4428,
																20.2563
															],
															[
																37.7241,
																14.8383
															],
															[
																28.6795,
																5.8409
															],
															[
																23.233,
																-8.8011
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.4932,
																-1.3258
															],
															[
																0,
																0
															],
															[
																4.1903,
																-1.5425
															],
															[
																0,
																0
															],
															[
																-1.3328,
																-0.4906
															],
															[
																0,
																0
															],
															[
																-1.5505,
																-4.1684
															],
															[
																0,
																0
															],
															[
																-0.4932,
																1.3259
															],
															[
																0,
																0
															],
															[
																-4.1903,
																1.5425
															],
															[
																0,
																0
															],
															[
																1.3328,
																0.4906
															],
															[
																0,
																0
															],
															[
																1.5505,
																4.1684
															],
															[
																0,
																0
															]
														],
														o: [
															[
																-0.49317999999999884,
																-1.3258399999999995
															],
															[
																0,
																0
															],
															[
																-1.5505399999999998,
																4.16842
															],
															[
																0,
																0
															],
															[
																-1.3328000000000007,
																0.4906100000000002
															],
															[
																0,
																0
															],
															[
																4.19027,
																1.5424499999999988
															],
															[
																0,
																0
															],
															[
																0.49317999999999884,
																1.3258500000000026
															],
															[
																0,
																0
															],
															[
																1.5505400000000016,
																-4.168419999999998
															],
															[
																0,
																0
															],
															[
																1.3327799999999996,
																-0.4906100000000002
															],
															[
																0,
																0
															],
															[
																-4.190269999999998,
																-1.5424500000000005
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														0
													],
													y: [
														1
													]
												}
											},
											{
												t: 472.04999999999995,
												s: [
													{
														c: true,
														v: [
															[
																22.6367,
																3.8608
															],
															[
																20.958,
																3.8608
															],
															[
																17.774,
																12.4213
															],
															[
																12.4865,
																17.6817
															],
															[
																3.8818,
																20.8494
															],
															[
																3.8818,
																22.5195
															],
															[
																12.4865,
																25.6872
															],
															[
																17.774,
																30.9476
															],
															[
																20.958,
																39.5081
															],
															[
																22.6367,
																39.5081
															],
															[
																25.8207,
																30.9476
															],
															[
																31.1083,
																25.6872
															],
															[
																39.713,
																22.5195
															],
															[
																39.713,
																20.8495
															],
															[
																31.1083,
																17.6818
															],
															[
																25.8208,
																12.4214
															],
															[
																22.6367,
																3.8608
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0.2883,
																-0.7752
															],
															[
																0,
																0
															],
															[
																2.4497,
																-0.9018
															],
															[
																0,
																0
															],
															[
																-0.7792,
																-0.2868
															],
															[
																0,
																0
															],
															[
																-0.9065,
																-2.4371
															],
															[
																0,
																0
															],
															[
																-0.2883,
																0.7752
															],
															[
																0,
																0
															],
															[
																-2.4497,
																0.9018
															],
															[
																0,
																0
															],
															[
																0.7792,
																0.2868
															],
															[
																0,
																0
															],
															[
																0.9065,
																2.4371
															],
															[
																0,
																0
															]
														],
														o: [
															[
																-0.2883199999999988,
																-0.7751600000000001
															],
															[
																0,
																0
															],
															[
																-0.9064599999999992,
																2.4370899999999995
															],
															[
																0,
																0
															],
															[
																-0.7791700000000001,
																0.28684000000000154
															],
															[
																0,
																0
															],
															[
																2.4496800000000007,
																0.9018100000000011
															],
															[
																0,
																0
															],
															[
																0.2883199999999988,
																0.7751700000000028
															],
															[
																0,
																0
															],
															[
																0.9064599999999992,
																-2.4370900000000013
															],
															[
																0,
																0
															],
															[
																0.7791599999999974,
																-0.28684000000000154
															],
															[
																0,
																0
															],
															[
																-2.4496800000000007,
																-0.9018100000000011
															],
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												]
											}
										]
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 2
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 9,
					hd: false,
					nm: "round - Null",
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								42.3225,
								39.1459
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					st: 0,
					ip: 0,
					op: 540,
					bm: 0,
					sr: 1
				},
				{
					ty: 4,
					ddd: 0,
					ind: 10,
					hd: false,
					nm: "round",
					parent: 9,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					st: 0,
					ip: 0,
					op: 540,
					bm: 0,
					sr: 1,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													65.2256,
													129.7757
												],
												[
													130.4512,
													64.8878
												],
												[
													65.2256,
													-1e-4
												],
												[
													0,
													64.8878
												],
												[
													65.2256,
													129.7757
												],
												[
													65.2256,
													129.7757
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													35.8366
												],
												[
													36.0231,
													0
												],
												[
													0,
													-35.8366
												],
												[
													-36.0231,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													36.023129999999995,
													0
												],
												[
													0,
													-35.83657
												],
												[
													-36.02312,
													0
												],
												[
													0,
													35.836569999999995
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.5764705882352941,
											0.3568627450980392,
											0.9254901960784314,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 2
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 11,
					hd: false,
					nm: "Ellipse 2 - Null",
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								91.5,
								91.5
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								106.27800025906815,
								104.90813283170486
							]
						},
						r: {
							a: 1,
							k: [
								{
									t: 107.532,
									s: [
										-179
									],
									o: {
										x: [
											0.5071
										],
										y: [
											0.0048
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 227.298,
									s: [
										-70
									],
									o: {
										x: [
											0.5071
										],
										y: [
											0.0048
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 360.204,
									s: [
										-104.87
									],
									o: {
										x: [
											0.5071
										],
										y: [
											0.0048
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 442.95000000000005,
									s: [
										17.67
									],
									o: {
										x: [
											0.5071
										],
										y: [
											0.0048
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 537,
									s: [
										181
									]
								}
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					st: 0,
					ip: 0,
					op: 540,
					bm: 0,
					sr: 1
				},
				{
					ddd: 0,
					ind: 12,
					hd: false,
					nm: "Ellipse 2 - Stroke",
					parent: 11,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					st: 0,
					ip: 0,
					op: 540,
					bm: 0,
					sr: 1,
					ty: 4,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													183,
													91.5
												],
												[
													91.5,
													183
												],
												[
													0,
													91.5
												],
												[
													91.5,
													0
												],
												[
													183,
													91.5
												],
												[
													183,
													91.5
												]
											],
											i: [
												[
													0,
													0
												],
												[
													50.5355,
													0
												],
												[
													0,
													50.5355
												],
												[
													-50.5355,
													0
												],
												[
													0,
													-50.5355
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													50.53550000000001
												],
												[
													-50.5355,
													0
												],
												[
													0,
													-50.5355
												],
												[
													50.53550000000001,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "st",
									o: {
										a: 0,
										k: 100
									},
									w: {
										a: 0,
										k: 22
									},
									c: {
										a: 0,
										k: [
											0.5764705882352941,
											0.3568627450980392,
											0.9254901960784314,
											1
										]
									},
									ml: 4,
									lc: 2,
									lj: 2,
									nm: "Stroke",
									hd: false,
									d: [
										{
											n: "o",
											nm: "Offset",
											v: {
												a: 0,
												k: 60
											}
										},
										{
											n: "d",
											nm: "Dash",
											v: {
												a: 1,
												k: [
													{
														t: 6.702,
														s: [
															277
														],
														o: {
															x: [
																0.5071
															],
															y: [
																0.0048
															]
														},
														i: {
															x: [
																0.15
															],
															y: [
																1
															]
														}
													},
													{
														t: 155.184,
														s: [
															133.4122
														],
														o: {
															x: [
																0.5
															],
															y: [
																0.35
															]
														},
														i: {
															x: [
																0.15
															],
															y: [
																1
															]
														}
													},
													{
														t: 226.644,
														s: [
															133.4122
														],
														o: {
															x: [
																0.5071
															],
															y: [
																0.0048
															]
														},
														i: {
															x: [
																0.15
															],
															y: [
																1
															]
														}
													},
													{
														t: 294.36600000000004,
														s: [
															133
														],
														o: {
															x: [
																0.5071
															],
															y: [
																0.0048
															]
														},
														i: {
															x: [
																0.15
															],
															y: [
																1
															]
														}
													},
													{
														t: 460.524,
														s: [
															155
														],
														o: {
															x: [
																0.42
															],
															y: [
																0
															]
														},
														i: {
															x: [
																0.58
															],
															y: [
																1
															]
														}
													},
													{
														t: 531.972,
														s: [
															277
														]
													}
												]
											}
										},
										{
											n: "g",
											nm: "Gap",
											v: {
												a: 1,
												k: [
													{
														t: 6.6,
														s: [
															90
														],
														o: {
															x: [
																0.5071
															],
															y: [
																0.0048
															]
														},
														i: {
															x: [
																0.15
															],
															y: [
																1
															]
														}
													},
													{
														t: 117.576,
														s: [
															80
														],
														o: {
															x: [
																0.5071
															],
															y: [
																0.0048
															]
														},
														i: {
															x: [
																0.15
															],
															y: [
																1
															]
														}
													},
													{
														t: 226.644,
														s: [
															86
														],
														o: {
															x: [
																0.5071
															],
															y: [
																0.0048
															]
														},
														i: {
															x: [
																0.15
															],
															y: [
																1
															]
														}
													},
													{
														t: 320.694,
														s: [
															56
														],
														o: {
															x: [
																0.5
															],
															y: [
																0.35
															]
														},
														i: {
															x: [
																0.15
															],
															y: [
																1
															]
														}
													},
													{
														t: 399.072,
														s: [
															56
														],
														o: {
															x: [
																0.5071
															],
															y: [
																0.0048
															]
														},
														i: {
															x: [
																0.15
															],
															y: [
																1
															]
														}
													},
													{
														t: 507.528,
														s: [
															90
														]
													}
												]
											}
										}
									]
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						},
						{
							ty: "tm",
							s: {
								a: 0,
								k: 0
							},
							e: {
								a: 0,
								k: 100
							},
							o: {
								a: 0,
								k: 0
							},
							m: 1
						},
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "rc",
									nm: "Rectangle",
									hd: false,
									p: {
										a: 0,
										k: [
											102.5,
											102.5
										]
									},
									s: {
										a: 0,
										k: [
											410,
											410
										]
									},
									r: {
										a: 0,
										k: 0
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 0
									},
									c: {
										a: 0,
										k: [
											0,
											1,
											0,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		}
	];
	var layers = [
		{
			ddd: 0,
			ind: 1,
			ty: 0,
			nm: "18",
			refId: "lo8h9rmzawnjrpxsxm9",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				},
				r: {
					a: 0,
					k: 0
				},
				o: {
					a: 0,
					k: 100
				}
			},
			ao: 0,
			w: 210,
			h: 210,
			ip: 0,
			op: 540,
			st: 0,
			hd: false,
			bm: 0
		}
	];
	var meta = {
		a: "",
		d: "",
		tc: "",
		g: "Aninix"
	};
	var copilotLottieIcon = {
		nm: nm,
		v: v,
		fr: fr,
		ip: ip,
		op: op,
		w: w,
		h: h,
		ddd: ddd,
		markers: markers,
		assets: assets,
		layers: layers,
		meta: meta
	};

	class CopilotVoiceInputBtn extends main_core_events.EventEmitter {
		#container;
		#stopRecordingButton;
		#startRecordingButton;
		#disabled;
		constructor(options) {
			super(options);
			this.setEventNamespace('AI:Copilot:VoiceButton');
			this.#disabled = false;
			this.#container = null;
		}
		start() {
			main_core.Dom.addClass(this.#container, '--recording');
		}
		stop() {
			main_core.Dom.removeClass(this.#container, '--recording');
		}
		enable() {
			this.#disabled = false;
			this.#enableStartRecordingButton();
			this.#enableStopRecordingButton();
		}
		disable() {
			this.#disabled = true;
			this.#disableStartRecordingButton();
			this.#disableStopRecordingButton();
		}
		isDisabled() {
			return this.#disabled;
		}
		getContainer() {
			if (!this.#container) {
				this.#initContainer();
			}
			return this.#container;
		}
		render() {
			return this.getContainer();
		}
		#initContainer() {
			this.#container = main_core.Tag.render`
			<div class="ai__copilot-voice-input-btn-container">
				${this.#renderStartRecordingButton()}
				${this.#renderStopRecordingButton()}
			</div>
		`;
		}
		#renderStartRecordingButton() {
			const microphoneIcon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Main.MICROPHONE_ON,
				size: 20
			});
			this.#startRecordingButton = main_core.Tag.render`
			<button
				class="ai__copilot-voice-input-btn --start"
			>
				${microphoneIcon.render()}
			</button>
		`;
			this.#startRecordingButton.disabled = this.#disabled;
			main_core.Event.bind(this.#startRecordingButton, 'click', () => {
				this.emit('start');
			});
			return this.#startRecordingButton;
		}
		#renderStopRecordingButton() {
			const stopIcon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Actions.STOP,
				size: 17,
				color: getComputedStyle(document.body).getPropertyValue('--ui-color-on-primary')
			});
			this.#stopRecordingButton = main_core.Tag.render`
			<button
				class="ai__copilot-voice-input-btn --stop"
			>
				${stopIcon.render()}
			</button>
		`;
			this.#stopRecordingButton.disabled = this.#disabled;
			main_core.Event.bind(this.#stopRecordingButton, 'click', () => {
				this.emit('stop');
			});
			return this.#stopRecordingButton;
		}
		#enableStartRecordingButton() {
			if (this.#startRecordingButton) {
				this.#startRecordingButton.disabled = false;
			}
		}
		#disableStartRecordingButton() {
			if (this.#startRecordingButton) {
				this.#startRecordingButton.disabled = true;
			}
		}
		#enableStopRecordingButton() {
			if (this.#stopRecordingButton) {
				this.#stopRecordingButton.disabled = false;
			}
		}
		#disableStopRecordingButton() {
			if (this.#stopRecordingButton) {
				this.#stopRecordingButton.disabled = true;
			}
		}
	}

	class CopilotInputError {
		#errors;
		#detailedErrorInfoPopup;
		constructor(options) {
			this.#errors = options.errors;
		}
		render() {
			let message = this.#errors[this.#errors.length - 1].message;
			const code = this.#errors[this.#errors.length - 1].code;
			let detailBlock = null;
			if (this.#errors[0]?.code === 'AI_ENGINE_ERROR_OTHER') {
				message = main_core.Loc.getMessage('AI_COPILOT_ERROR_OTHER');
				message = message.replace('[feedback_form]', '<span class="ai__copilot_input-field-error-detail">');
				message = message.replace('[/feedback_form]', '</span>');
				detailBlock = main_core.Tag.render`
				<div class="ai__copilot_input-field-error">
					${message}
				</div>
			`;
				main_core.Event.bind(detailBlock.getElementsByClassName('ai__copilot_input-field-error-detail')[0], 'click', this.#errors[0]?.customData?.clickHandler);
			} else if (top.BX && top.BX.Helper && code === 'AI_ENGINE_ERROR_PROVIDER') {
				message = main_core.Loc.getMessage('AI_COPILOT_ERROR_PROVIDER');
				message = message.replace('[link]', '<span class="ai__copilot_input-field-error-detail">');
				message = message.replace('[/link]', '</span>');
				detailBlock = main_core.Tag.render`
				<div class="ai__copilot_input-field-error">
					${message}
				</div>
			`;
				main_core.Event.bind(detailBlock.getElementsByClassName('ai__copilot_input-field-error-detail')[0], 'click', e => {
					top.BX.Helper.show('redirect=detail&code=20267044');
				});
			} else {
				detailBlock = main_core.Tag.render`
				<div class="ai__copilot_input-field-error">
					${message}
				</div>
			`;
			}
			return main_core.Tag.render`
			<div class="ai__copilot_input-field-error">
				<span class="ai__copilot_input-field-error-title">
					${detailBlock}
				</span>
			</div>
		`;
		}
		setErrors(errors) {
			this.#errors = errors;
		}
		getErrors() {
			return this.#errors;
		}
		#initDetailerErrorInfoPopup() {
			if (this.#detailedErrorInfoPopup) {
				return;
			}
			this.#detailedErrorInfoPopup = new main_popup.Popup({
				id: 'ai__copilot_error-popup',
				content: this.#getDetailedErrorInfoPopupContent(),
				darkMode: true,
				maxWidth: 300,
				autoHide: true,
				closeByEsc: true,
				closeIcon: true,
				cacheable: true
			});
		}
		#getDetailedErrorInfoPopupContent() {
			return main_core.Tag.render`
			<div class="ai__copilot_error-popup-content">
				${this.#errors[this.#errors.length - 1].message}
			</div>
		`;
		}
	}

	class CopilotInputPlaceholder extends main_core_events.EventEmitter {
		#container;
		#readonly = false;
		#useForImages = false;
		constructor(options) {
			super(options);
			this.setEventNamespace('AI.Copilot.InputPlaceholder');
			this.#readonly = options.readonly === true;
		}
		render() {
			this.#container = this.getContainer();
			return this.#container;
		}
		getContainer() {
			if (!this.#container) {
				const placeholderText = this.#getPlaceholderText();
				this.#container = main_core.Tag.render`
				<div class="ai_copilot_placeholder">
					<span>${placeholderText}</span>
				</div>
			`;
			}
			return this.#container;
		}
		setUseForImages(useForImages) {
			this.#useForImages = useForImages;
			this.#updatePlaceholder();
		}
		#updatePlaceholder() {
			this.#container.querySelector('span').innerText = this.#getPlaceholderText();
		}
		#getPlaceholderText() {
			if (this.#readonly) {
				return main_core.Loc.getMessage('AI_COPILOT_SELECT_COMMAND_BELOW');
			}
			if (this.#useForImages) {
				return main_core.Loc.getMessage('AI_COPILOT_IMAGE_INPUT_START_PLACEHOLDER');
			}
			return main_core.Loc.getMessage('AI_COPILOT_INPUT_START_PLACEHOLDER');
		}
	}

	const CopilotSubmitBtnEvents = Object.freeze({
		submit: 'submit'
	});
	class CopilotSubmitBtn extends main_core_events.EventEmitter {
		#submitBtn;
		#container;
		constructor(options) {
			super(options);
			this.setEventNamespace('AI:Copilot:SubmitBtn');
		}
		render() {
			this.#container = main_core.Tag.render`
			<div
				class="ai__copilot_input-submit-btn-container"
			>
				${this.#renderHotKeyTag()}
				${this.#renderSubmitBtn()}
			</div>
		`;
			return this.#container;
		}
		#renderHotKeyTag() {
			const hotKeyIcon = new ui_iconSet_api_core.Icon({
				size: 20,
				icon: ui_iconSet_api_core.Actions.ARROW_TOP_2
			});
			return main_core.Tag.render`
			<div class="ai__copilot_input-submit-hotkey">
				<div class="ai__copilot_input-submit-hotkey-icon">
					${hotKeyIcon.render()}
				</div>
				<div class="ai__copilot_input-submit-hotkey-text">Enter</div>
			</div>
		`;
		}
		#renderSubmitBtn() {
			const btnIcon = new ui_iconSet_api_core.Icon({
				size: 18,
				icon: ui_iconSet_api_core.Actions.ARROW_TOP,
				color: '#fff'
			});
			this.#submitBtn = main_core.Tag.render`
			<button class="ai__copilot_input-submit-btn">
				${btnIcon.render()}
			</button>
		`;
			main_core.Event.bind(this.#submitBtn, 'click', e => {
				this.emit(CopilotSubmitBtnEvents.submit);
				e.preventDefault();
			});
			return this.#submitBtn;
		}
		disable() {
			main_core.Dom.addClass(this.#container, '--disabled');
			this.#submitBtn.disabled = true;
		}
		enable() {
			main_core.Dom.removeClass(this.#container, '--disabled');
			this.#submitBtn.disabled = false;
		}
	}

	const CopilotInputEvents = Object.freeze({
		submit: 'submit',
		cancelLoading: 'cancelLoading',
		focus: 'focus',
		input: 'input',
		goOutFromBottom: 'goOutFromBottom',
		startRecording: 'startRecording',
		stopRecording: 'stopRecording',
		adjustHeight: 'adjustHeight',
		containerClick: 'containerClick'
	});
	class CopilotInput extends main_core_events.EventEmitter {
		#textarea;
		#container;
		#isLoading;
		#placeholder;
		#loaderTextContainer;
		#errorContainer;
		#inputError;
		#textareaOldValue = '';
		#disableEnterAndArrows = false;
		#copilotLottieAnimation = null;
		#lottieIconContainer;
		#speechConverter = null;
		#submitBtn = null;
		#voiceButton = null;
		#readonly = false;
		#useForImages = false;
		#isGoOutFromBottomEnabled = true;
		#usedVoiceRecord;
		#usedTextInput;
		constructor(options = {}) {
			super(options);
			this.#readonly = options.readonly === true;
			this.#isLoading = false;
			this.#errorContainer = null;
			this.#inputError = null;
			this.#copilotLottieAnimation = null;
			this.#lottieIconContainer = null;
			this.#usedVoiceRecord = false;
			this.#usedTextInput = false;
			this.setEventNamespace('AI.Copilot.Input');
		}
		render() {
			this.#container = main_core.Tag.render`
			<div class="ai__copilot_input-field">
				<div ref="icon" class="ai__copilot_input-field-icon">
					${this.#renderInputIcon()}
				</div>
				${this.#renderLoader()}
				<div class="ai__copilot_input-field-content">
					${this.#renderTextArea()}
					${this.#renderPlaceholder()}
					${this.#renderErrorContainer()}
				</div>
				${this.#renderSubmitButton()}
				<div class="ai__copilot_input-field-baas-point"></div>
			</div>
		`;
			main_core.Event.bind(this.#container.root, 'click', () => {
				this.emit(CopilotInputEvents.containerClick);
			});
			this.#updateContainerClassname();
			return this.#container.root;
		}
		usedTextInput() {
			return this.#usedTextInput;
		}
		usedVoiceRecord() {
			return this.#usedVoiceRecord;
		}
		setValue(value) {
			this.#setTextareaValue(value);
		}
		getValue() {
			return this.#textarea.value;
		}
		focus(setCursorAtStart) {
			if (this.#textarea) {
				this.#textarea.focus(setCursorAtStart);
				this.#disableEnterAndArrows = false;
			}
		}
		getContainer() {
			return this.#container?.root;
		}
		clear() {
			this.#setTextareaValue('', false);
			this.#voiceButton?.enable();
		}
		startGenerating() {
			this.#copilotLottieAnimation.play();
			this.clearErrors();
			this.enable();
			this.#textarea.disabled = true;
			this.#isLoading = true;
			this.#setTextareaValue('', false);
			main_core.Dom.addClass(this.getContainer(), '--loading');
			main_core.Dom.removeClass(this.getContainer(), '--error');
		}
		finishGenerating() {
			this.#textarea.disabled = false;
			this.#isLoading = false;
			this.#setTextareaValue(this.#textareaOldValue, false);
			main_core.Dom.removeClass(this.getContainer(), '--loading');
			setTimeout(() => {
				this.#copilotLottieAnimation.stop();
			}, 550);
		}
		stopRecording() {
			this.#speechConverter?.stop();
		}
		setErrors(errors) {
			main_core.Dom.clean(this.#errorContainer);
			if (this.#inputError) {
				this.#inputError.setErrors(errors);
			} else {
				this.#inputError = new CopilotInputError({
					errors
				});
			}
			this.#setErrorIcon();
			main_core.Dom.addClass(this.getContainer(), '--error');
			const content = this.#inputError.render();
			main_core.Dom.append(content, this.#errorContainer);
			this.#textarea.disabled = true;
			requestAnimationFrame(() => {
				this.#adjustTextareaHeight();
			});
		}
		adjustHeight() {
			this.#adjustTextareaHeight();
		}
		#setErrorIcon() {
			this.#setIcon(this.#renderErrorIcon());
		}
		#setInputIcon() {
			this.#setIcon(this.#renderInputIcon());
		}
		#setIcon(icon) {
			if (icon.className === this.#getIconContainer().firstElementChild.className) {
				return;
			}
			main_core.Event.bindOnce(this.#getIconContainer(), 'transitionend', () => {
				this.#getIconContainer().innerHTML = '';
				main_core.Dom.append(icon, this.#getIconContainer());
				main_core.Dom.style(this.#getIconContainer(), 'opacity', 1);
			});
			main_core.Dom.style(this.#getIconContainer(), 'opacity', 0);
		}
		clearErrors() {
			if (this.#inputError && this.#inputError.getErrors().length > 0) {
				this.#inputError.setErrors([]);
				main_core.Dom.removeClass(this.getContainer(), '--error');
				this.#textarea.disabled = false;
				this.#setInputIcon();
			}
			this.#adjustTextareaHeight();
		}
		enableEnterAndArrows() {
			this.#disableEnterAndArrows = false;
		}
		disableEnterAndArrows() {
			this.#disableEnterAndArrows = true;
		}
		disable() {
			main_core.Dom.addClass(this.getContainer(), '--disabled');
			this.#textarea.disabled = true;
			main_core.Dom.style(this.getContainer(), 'opacity', 0.7);
			this.disableEnterAndArrows();
		}
		enable() {
			main_core.Dom.removeClass(this.getContainer(), '--disabled');
			this.#textarea.disabled = false;
			main_core.Dom.style(this.getContainer(), 'opacity', 1);
			this.enableEnterAndArrows();
		}
		isDisabled() {
			return this.#textarea.disabled;
		}
		setUseForImages(useForImages) {
			this.#useForImages = useForImages;
			this.#placeholder.setUseForImages(useForImages);
			if (useForImages) {
				this.#isGoOutFromBottomEnabled = false;
				this.#loaderTextContainer.innerText = this.#getCopilotMessage('AI_COPILOT_INPUT_IMAGE_LOADER_TEXT_MSGVER_1');
			} else {
				this.#isGoOutFromBottomEnabled = true;
				this.#loaderTextContainer.innerText = this.#getCopilotMessage('AI_COPILOT_INPUT_LOADER_TEXT_MSGVER_1');
			}
		}
		#getIconContainer() {
			return this.#container.icon;
		}
		#renderLoader() {
			const cancelBtn = main_core.Tag.render`
			<button class="ai__copilot_loader-cancel-btn">
				${main_core.Loc.getMessage('AI_COPILOT_INPUT_LOADER_CANCEL')}
			</button>
		`;
			main_core.Event.bind(cancelBtn, 'click', () => {
				this.emit(CopilotInputEvents.cancelLoading);
			});
			const loader = main_core.Tag.render`
			<div class="ai__copilot_loader">
				<div class="ai__copilot_loader-left">
					<div ref="loaderText" class="ai__copilot_loader-text">${this.#getCopilotMessage('AI_COPILOT_INPUT_LOADER_TEXT_MSGVER_1')}</div>
					<div class="ai__copilot_loader-dot dot-flashing"></div>
				</div>
				${cancelBtn}
			</div>
		`;
			this.#loaderTextContainer = loader.loaderText;
			return loader.root;
		}
		#renderErrorContainer() {
			this.#errorContainer = main_core.Tag.render`
			<div class="ai__copilot_input-field-error-container"></div>
		`;
			return this.#errorContainer;
		}
		#renderTextArea() {
			this.#textarea = new CopilotInputFieldTextarea({});
			this.#textarea.subscribe('focus', () => {
				this.emit(CopilotInputEvents.focus);
			});
			this.#textarea.subscribe('input', e => {
				const value = e.getData();
				this.#setTextareaValue(value);
				if (this.#speechConverter && this.#speechConverter.isRecording() === false) {
					this.#usedTextInput = true;
					if (value) {
						this.#voiceButton.disable();
					} else {
						this.#voiceButton.enable();
					}
				}
			});
			const textAreaContainer = this.#textarea.render();
			main_core.Event.bind(textAreaContainer, 'keydown', this.#handleKeyDownEvent.bind(this));
			const observer = new MutationObserver(mutations => {
				mutations.forEach(mutation => {
					if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
						if (this.#textarea.disabled === true) {
							main_core.Dom.style(textAreaContainer, 'z-index', -1);
						} else {
							main_core.Dom.style(textAreaContainer, 'z-index', 1);
						}
					}
				});
			});
			observer.observe(textAreaContainer, {
				attributes: true
			});
			return textAreaContainer;
		}
		#handleKeyDownEvent(e) {
			if ((e.key === 'Enter' || this.#isArrowKey(e.key)) && this.#disableEnterAndArrows) {
				e.preventDefault();
				return false;
			}
			if (e.key === 'Enter') {
				return this.#handleEnterKeyDownEvent(e);
			}
			if (this.#isArrowKey(e.key)) {
				return this.#handleArrowKeyDownEvent(e);
			}
			this.#disableEnterAndArrows = false;
			return true;
		}
		#isArrowKey(key) {
			return key === 'ArrowDown' || key === 'ArrowUp' || key === 'ArrowLeft' || key === 'ArrowRight';
		}
		#handleEnterKeyDownEvent(e) {
			if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.repeat && !this.#isLoading && !this.#textarea.disabled) {
				this.emit(CopilotInputEvents.submit);
				e.preventDefault();
				return false;
			}
			return true;
		}
		#handleArrowKeyDownEvent(e) {
			if (e.key === 'ArrowDown' && this.#isCursorInTextareaEnd() && this.#isGoOutFromBottomEnabled) {
				this.#disableEnterAndArrows = true;
				this.emit(CopilotInputEvents.goOutFromBottom);
				return false;
			}
			return true;
		}
		#isCursorInTextareaEnd() {
			return this.#textarea.isCursorInTheEnd();
		}
		#renderPlaceholder() {
			this.#placeholder = new CopilotInputPlaceholder({
				readonly: this.#readonly,
				useForImages: this.#useForImages
			});
			main_core.Event.bind(this.#placeholder.getContainer(), 'click', () => {
				if (this.#readonly === false) {
					this.#textarea.focus();
				}
			});
			return this.#placeholder.render();
		}
		#updateContainerClassname() {
			if (this.#textarea.value.length === 0) {
				main_core.Dom.addClass(this.getContainer(), '--show-placeholder');
			} else {
				main_core.Dom.removeClass(this.getContainer(), '--show-placeholder');
			}
		}
		#renderInputIcon() {
			return main_core.Tag.render`
			<div class="" style="width: 24px; height: 24px; position: relative;">
				<div class="ai__copilot_static-icon-wrapper">
					<div class="ai__copilot_static-icon"></div>
				</div>
				<div class="ai__copilot_loading-icon-wrapper">
					${this.#getLottieIconContainer()}
				</div>
			</div>
		`;
		}
		#getLottieIconContainer() {
			if (!this.#lottieIconContainer) {
				const size = 21;
				this.#lottieIconContainer = main_core.Tag.render`
				<div class="" style="width: ${size}px; height: ${size}px;"></div>
			`;
				this.#copilotLottieAnimation = ui_lottie.Lottie.loadAnimation({
					container: this.#lottieIconContainer,
					renderer: 'svg',
					animationData: copilotLottieIcon,
					autoplay: false
				});
			}
			return this.#lottieIconContainer;
		}
		#renderErrorIcon() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Main.WARNING,
				size: 24
			});
			return icon.render();
		}
		#renderSubmitButton() {
			if (this.#readonly) {
				return null;
			}
			this.#initVoiceButton();
			this.#initSubmitButton();
			return main_core.Tag.render`
			<div class="ai__copilot_input-submit-block">
				${this.#submitBtn.render()}
				<div class="ai__copilot_input-submit-block-voice-btn">
					${this.#voiceButton.render()}
				</div>
			</div>
		`;
		}
		#initVoiceButton() {
			this.#voiceButton = new CopilotVoiceInputBtn();
			if (ai_speechConverter.SpeechConverter.isBrowserSupport() === false) {
				this.#initDisabledVoiceButton();
			} else {
				this.#initEnabledVoiceButton();
			}
		}
		#initDisabledVoiceButton() {
			this.#voiceButton.disable();
			CopilotHint.addHintOnTargetHover({
				target: this.#voiceButton.getContainer(),
				text: main_core.Loc.getMessage('AI_COPILOT_VOICE_INPUT_NOT_SUPPORT')
			});
		}
		#initEnabledVoiceButton() {
			this.#initSpeechConverter();
			main_core.Event.bind(this.#voiceButton.getContainer(), 'click', () => {
				if (this.#voiceButton.isDisabled() || this.#speechConverter.isRecording()) {
					return;
				}
				this.#speechConverter.start();
			});
			this.#voiceButton.subscribe('stop', () => {
				this.#speechConverter.stop();
				if (this.#textarea.value) {
					this.#voiceButton.disable();
				}
				this.#usedVoiceRecord = true;
			});
		}
		#initSubmitButton() {
			this.#submitBtn = new CopilotSubmitBtn();
			this.#submitBtn.subscribe(CopilotSubmitBtnEvents.submit, () => {
				this.emit(CopilotInputEvents.submit);
			});
		}
		#initSpeechConverter() {
			if (ai_speechConverter.SpeechConverter.isBrowserSupport() === false) {
				return;
			}
			this.#speechConverter = new ai_speechConverter.SpeechConverter();
			this.#speechConverter.subscribe(ai_speechConverter.speechConverterEvents.start, this.#handleSpeechConverterStartEvent.bind(this));
			this.#speechConverter.subscribe(ai_speechConverter.speechConverterEvents.error, this.#handleSpeechConverterErrorEvent.bind(this));
			this.#speechConverter.subscribe(ai_speechConverter.speechConverterEvents.result, this.#handleSpeechConverterResultEvent.bind(this));
			this.#speechConverter.subscribe(ai_speechConverter.speechConverterEvents.stop, this.#handleSpeechConverterStopEvent.bind(this));
		}
		#handleSpeechConverterStartEvent() {
			this.#voiceButton.start();
			this.#textarea.disabled = true;
			this.#textarea.addClass('--recording');
			this.emit(CopilotInputEvents.startRecording);
			this.#submitBtn.disable();
		}
		#handleSpeechConverterErrorEvent(e) {
			const {
				error
			} = e.getData();
			if (error === 'aborted') {
				return;
			}
			if (error === 'not-allowed') {
				this.#showErrorHintForVoiceButton(main_core.Loc.getMessage('AI_COPILOT_VOICE_INPUT_MICRO_NOT_ALLOWED'));
			} else {
				this.#showErrorHintForVoiceButton(main_core.Loc.getMessage('AI_COPILOT_VOICE_INPUT_UNKNOWN_ERROR'));
			}
		}
		#showErrorHintForVoiceButton(text) {
			const errorHint = new CopilotHint({
				text,
				target: this.#voiceButton.getContainer()
			});
			errorHint.show();
			setTimeout(() => {
				errorHint.hide();
			}, 1500);
		}
		#handleSpeechConverterResultEvent(e) {
			this.setValue(e.getData().text);
			this.#textarea.value = e.getData().text;
		}
		#handleSpeechConverterStopEvent() {
			this.#textarea.removeClass('--recording');
			this.#textarea.disabled = false;
			this.#voiceButton.stop();
			this.#textarea.focus();
			this.emit(CopilotInputEvents.stopRecording);
			this.#submitBtn.enable();
		}
		#setTextareaValue(value, emitEvent = true) {
			this.#textareaOldValue = this.#textarea.value;
			this.#adjustTextareaHeight();
			this.#updateContainerClassname();
			if (emitEvent) {
				this.emit(CopilotInputEvents.input, new main_core_events.BaseEvent({
					data: value
				}));
			}
		}
		setHtmlContent(html) {
			let htmlWithReplaced = main_core.Text.encode(html);
			htmlWithReplaced = htmlWithReplaced.replaceAll('[', '<strong>[');
			htmlWithReplaced = htmlWithReplaced.replaceAll(']', ']</strong>');
			htmlWithReplaced = htmlWithReplaced.replaceAll('\n', '<br />');
			this.#textarea.setHtmlContent(htmlWithReplaced);
		}
		#getCopilotMessage(code) {
			return main_core.Loc.getMessage(code, {
				'#COPILOT_NAME#': main_core.Extension.getSettings('ai.copilot').get('copilotName')
			});
		}
		#adjustTextareaHeight() {
			this.#textarea.setStyle('height', 'auto');
			const textAreaPaddingBottom = parseInt(this.#textarea.getComputedStyle().getPropertyValue('padding-bottom'), 10);
			const errorFieldHeight = main_core.Dom.getPosition(this.#errorContainer).height;
			const placeholderHeight = main_core.Dom.getPosition(this.#placeholder.getContainer()).height;
			const textAreaHeight = this.#textarea.scrollHeight;
			const hasTextAreaMoreThanOneRow = textAreaHeight - textAreaPaddingBottom > 40;
			if (hasTextAreaMoreThanOneRow) {
				this.#textarea.addClass('--with-padding-bottom');
			} else {
				this.#textarea.removeClass('--with-padding-bottom');
			}
			if (this.#isLoading) {
				const loaderHeight = main_core.Dom.getPosition(this.#loaderTextContainer).height;
				this.#textarea.setStyle('height', `${loaderHeight}px`);
			} else {
				let newTextAreaHeight = this.#inputError && this.#inputError.getErrors().length > 0 ? errorFieldHeight : this.#textarea.scrollHeight;
				if (placeholderHeight > newTextAreaHeight && !this.#textarea.value) {
					newTextAreaHeight = placeholderHeight;
				}
				this.#textarea.setStyle('height', `${newTextAreaHeight}px`);
			}
			this.emit(CopilotInputEvents.adjustHeight);
		}
	}

	class CopilotWarningResultField {
		#container = null;
		render(expanded = false) {
			const warningIcon = new ui_iconSet_api_core.Icon({
				color: getComputedStyle(document.body).getPropertyValue('--ui-color-base-40'),
				size: 22,
				icon: ui_iconSet_api_core.Main.WARNING
			});
			this.#container = main_core.Tag.render`
			<div class="ai__copilot_waning-field ${expanded ? '--expanded' : ''}">
				<span class="ai__copilot_waning-field-icon">
					${warningIcon.render()}
				</span>
				<span class="ai__copilot_waning-field-text">
					${main_core.Loc.getMessage('AI_COPILOT_RESULT_WARNING_MSGVER_1', {
			'#COPILOT_NAME#': main_core.Extension.getSettings('ai.copilot').get('copilotName')
		})}
				</span>
				${this.#renderReadMoreLink()}
			</div>
		`;
			return this.#container;
		}
		getInfoSliderContainer() {
			return top.BX.Helper.getSlider()?.getContainer();
		}
		#renderReadMoreLink() {
			const link = main_core.Tag.render`
			<span class="ai__copilot_waning-field-link">
				${main_core.Loc.getMessage('AI_COPILOT_RESULT_WARNING_MORE')}
			</span>
		`;
			main_core.Event.bind(link, 'click', () => {
				const articleCode = 20_412_666;
				if (top.BX && top.BX.Helper) {
					top.BX.Helper.show(`redirect=detail&code=${articleCode}`);
				}
			});
			return link;
		}
		expand() {
			main_core.Dom.addClass(this.#container, '--expanded');
		}
		collapse() {
			main_core.Dom.removeClass(this.#container, '--expanded');
		}
	}

	const CopilotMode = Object.freeze({
		TEXT: 'text',
		IMAGE: 'image',
		TEXT_AND_IMAGE: 'text-and-image'
	});
	const CopilotEvents = {
		START_INIT: 'start-init',
		FINISH_INIT: 'finish-init',
		FAILED_INIT: 'failed-init',
		HIDE: 'hide',
		IMAGE_SAVE: 'save-image',
		TEXT_SAVE: 'save',
		IMAGE_PLACE_ABOVE: 'place-image-above',
		IMAGE_PLACE_UNDER: 'place-image-under',
		IMAGE_CANCEL: 'cancel-image',
		TEXT_CANCEL: 'cancel',
		IMAGE_COMPLETION_RESULT: 'image-completion-result',
		TEXT_COMPLETION_RESULT: 'text-completion-result',
		TEXT_PLACE_BELOW: 'add_below'
	};
	const cache = new main_core.Cache.MemoryCache();
	async function loadExtensionWrapper(extensionName) {
		return cache.remember(extensionName, () => {
			return main_core.Runtime.loadExtension(extensionName);
		});
	}
	class Copilot extends main_core_events.EventEmitter {
		#copilotPopup;
		#inputField;
		#resultField;
		#engine;
		#preventAutoHide;
		#autoHide;
		#container = null;
		#warningField = null;
		#copilotAgreementWasApplied;
		#copilotImageController;
		#copilotTextController;
		#readonly;
		#category;
		#selectedText;
		#context;
		#analytics;
		#useText;
		#useImage;
		#showResultInCopilot;
		#menuForceTop = true;
		#responseFormat;
		#windowResizeHandler;
		static #staticEulaRestrictCallback = null;
		static showBanner = null;

		/**
		 * If function returns TRUE - ai using is restricted,
		 * If FALSE - ai using is available
		 * @returns {Promise<boolean>}
		 */
		static async checkEulaRestrict() {
			const Feature = await loadExtensionWrapper('bitrix24.license.feature');
			if (!Feature?.Feature) {
				return false;
			}
			const isRestrictionCheckInProgress = main_core.Type.isFunction(Copilot.#staticEulaRestrictCallback?.then);
			const isRestrictionNotChecked = Copilot.#staticEulaRestrictCallback === null;
			if (isRestrictionNotChecked || isRestrictionCheckInProgress) {
				try {
					if (isRestrictionNotChecked) {
						Copilot.#staticEulaRestrictCallback = Feature.Feature.checkEulaRestrictions('ai_available_by_version');
					}
					await Copilot.#staticEulaRestrictCallback;
					Copilot.#staticEulaRestrictCallback = false;
					return false;
				} catch (err) {
					if (err.callback) {
						Copilot.#staticEulaRestrictCallback = err.callback;
						return true;
					}
					console.error(err);
					return false;
				}
			}
			return main_core.Type.isFunction(Copilot.#staticEulaRestrictCallback);
		}
		constructor(options) {
			super(options);
			this.setEventNamespace('AI.Copilot');
			this.#category = options.category;
			this.#selectedText = options.selectedText;
			this.#readonly = options.readonly === true;
			this.#context = options.context;
			this.#useText = main_core.Type.isBoolean(options.useText) ? options.useText : true;
			this.#useImage = options.useImage === true;
			this.#showResultInCopilot = options.showResultInCopilot;
			this.#responseFormat = options.responseFormat || 'default';
			this.#initEngine({
				category: options.category,
				contextId: options.contextId,
				moduleId: options.moduleId,
				contextParameters: options.contextParameters,
				extraMarkers: options.extraMarkers
			});
			this.#inputField = new CopilotInput({
				readonly: options.readonly === true
			});
			this.#resultField = new CopilotResult();
			this.#warningField = new CopilotWarningResultField();
			this.#autoHide = options.autoHide ?? false;
			this.#preventAutoHide = main_core.Type.isFunction(options.preventAutoHide) ? options.preventAutoHide : () => false;
			this.#menuForceTop = options.menuForceTop ?? true;
		}
		render() {
			this.#container = main_core.Tag.render`
			<div class="ai__copilot ai__copilot-scope">
				${this.#resultField.render()}
				${this.#inputField.render()}
				${this.#warningField.render()}
			</div>
		`;
			return this.#container;
		}
		async init() {
			this.emit(CopilotEvents.START_INIT);
			try {
				if (main_core.Extension.getSettings('ai.copilot').isRestrictByEula) {
					await Copilot.checkEulaRestrict();
				}
				if (this.#useText) {
					await this.#initCopilotTextController({
						readonly: this.#readonly,
						category: this.#category,
						selectedText: this.#selectedText,
						context: this.#context,
						addImageMenuItem: this.#useImage,
						responseFormat: this.#responseFormat
					});
					await this.#initCopilotTextControllerMenu();
				} else {
					await this.#initCopilotImageController();
				}
				this.emit(CopilotEvents.FINISH_INIT);
			} catch (err) {
				console.error(err);
				this.emit(CopilotEvents.FAILED_INIT);
			}
		}
		show(options) {
			if (this.isInitFinished() === false) {
				console.error('AI.Copilot: The copilot cannot be opened until initialization is complete.');
				return;
			}
			if (this.#copilotTextController && this.#copilotTextController.isPromptsLoaded() === false) {
				console.error('AI.Copilot: Prompts were not loaded!');
				return;
			}
			if (main_core.Extension.getSettings('ai.copilot').get('isShowAgreementPopup') && !this.#copilotAgreementWasApplied) {
				this.#showCopilotAfterApplyAgreement(options);
				return;
			}
			if (main_core.Type.isFunction(Copilot.#staticEulaRestrictCallback)) {
				Copilot.#staticEulaRestrictCallback();
				this.#getAnalytics(true).sendEventOpen('error_agreement');
				return;
			}
			if (!this.#copilotPopup) {
				main_core.Event.bind(document, 'mousedown', this.#mouseDownHandler.bind(this));
			}
			this.#copilotPopup?.destroy();
			this.#initCopilotPopup({
				width: options.width,
				bindElement: options.bindElement
			});
			this.#copilotPopup.show();
			if (this.#useText) {
				this.#copilotTextController?.setCopilotContainer(this.#container);
				this.#copilotTextController?.start();
				this.#inputField.setUseForImages(false);
			} else {
				this.#copilotImageController.setCopilotContainer(this.#container);
				this.#copilotImageController.start();
				this.#inputField.setUseForImages(true);
			}
			this.#getAnalytics(true).sendEventOpen('success');
			this.#inputField.focus();
			this.#adjustMenus();
		}
		hide() {
			this.#copilotPopup?.close();
		}
		isShown() {
			return this.#copilotPopup?.isShown() ?? false;
		}
		isInitFinished() {
			if (this.#useText) {
				return Boolean(this.#copilotTextController?.isInitFinished());
			}
			return true;
		}
		adjustWidth(width) {
			this.#copilotPopup?.setWidth(width);
		}
		adjust(options) {
			if (!this.#copilotPopup || this.#copilotPopup?.isDestroyed()) {
				return;
			}
			if (options.hide) {
				this.#copilotPopup?.setMaxWidth(0);
				this.#copilotPopup?.setMinWidth(0);
				this.#hideMenus();
				this.adjustPosition(options.position);
				this.#getBaasPopup()?.close();
			} else {
				this.#copilotPopup?.setMaxWidth(null);
				this.#copilotPopup?.setMinWidth(null);
				this.adjustPosition(options.position);
				this.#adjustMenus();
				this.#copilotImageController?.showMenu();
				this.#copilotTextController?.showMenu();
				this.#getBaasPopup()?.adjustPosition();
			}
		}
		#getBaasPopup() {
			return main_popup.PopupManager.getPopups().find(popup => popup.getId().includes('baas'));
		}
		adjustPosition(position) {
			if (!this.#copilotPopup) {
				return;
			}
			if (position) {
				this.#copilotPopup.setBindElement(position);
			}
			this.#copilotPopup.adjustPosition({
				forceBindPosition: true
			});
			this.#getBaasPopup()?.adjustPosition({
				forceBindPosition: true,
				forceTop: true
			});
			this.#adjustMenus();
		}
		setSelectedText(text) {
			this.#copilotTextController?.setSelectedText(text);
		}
		setContext(text) {
			this.#copilotTextController?.setContext(text);
		}
		setContextParameters(contextParameters) {
			this.#engine.setContextParameters(contextParameters);
		}
		setExtraMarkers(extraMarkers) {
			const extraMarkersWithoutSystemMarkers = {
				...extraMarkers,
				original_message: undefined,
				user_message: undefined
			};
			const payload = this.#engine?.getPayload() || new ai_engine.Text();
			payload.setMarkers({
				...payload.getMarkers(),
				...extraMarkersWithoutSystemMarkers
			});
			this.#engine.setPayload(payload);
			this.#copilotTextController?.setExtraMarkers(extraMarkers);
		}
		getPosition() {
			return {
				inputField: main_core.Dom.getPosition(this.#copilotPopup.getPopupContainer()),
				menu: main_core.Dom.getPosition(this.#getOpenMenu()?.getPopupContainer())
			};
		}
		#initCopilotPopup(options) {
			this.#copilotPopup = new main_popup.Popup({
				className: 'ai__copilot_input-popup',
				bindElement: options.bindElement,
				content: this.render(),
				padding: 0,
				width: options.width,
				contentNoPaddings: true,
				borderRadius: '0px',
				autoHide: this.#autoHide,
				closeByEsc: true,
				cacheable: false,
				autoHideHandler: event => this.#autoHideHandler(event),
				events: {
					onPopupClose: () => {
						main_core.Dom.removeClass(this.#container, '--error');
						this.#copilotTextController?.finish();
						this.#copilotImageController?.finish();
						this.#inputField.stopRecording();
						this.#getBaasPopup()?.close();
						this.emit(CopilotEvents.HIDE);
						main_core.Event.unbind(window, 'resize', this.#windowResizeHandler);
					},
					onPopupShow: () => {
						this.#windowResizeHandler = () => this.#inputField.adjustHeight();
						main_core.Event.bind(window, 'resize', this.#windowResizeHandler);
						this.#inputField.clearErrors();
					}
				}
			});
		}
		#initEngine(initEngineOptions) {
			this.#engine = new ai_engine.Engine();
			this.#engine.setModuleId(initEngineOptions.moduleId).setContextId(initEngineOptions.contextId).setContextParameters(initEngineOptions.contextParameters).setParameters({
				promptCategory: initEngineOptions.category
			});
			this.setExtraMarkers(initEngineOptions.extraMarkers);
		}
		async #initCopilotImageController() {
			const {
				CopilotImageController: ImageController
			} = await loadExtensionWrapper('ai.copilot.copilot-image-controller');
			this.#copilotImageController = new ImageController({
				inputField: this.#inputField,
				engine: this.#engine,
				copilotContainer: this.#container,
				copilotInputEvents: CopilotInputEvents,
				copilotMenu: CopilotMenu,
				popupWithoutBackBtn: this.#useImage && this.#useText === false,
				useInsertAboveAndUnderMenuItems: this.#useText,
				analytics: this.#getAnalytics(true)
			});
			await this.#copilotImageController.init();
			this.#copilotImageController.subscribe('back', () => {
				this.#copilotImageController.finish();
				this.#copilotTextController.start();
				this.#inputField.setUseForImages(false);
			});
			this.#copilotImageController.subscribe('close', () => {
				this.#copilotImageController.finish();
				this.hide();
			});
			this.#copilotImageController.subscribe('save', event => {
				this.emit(CopilotEvents.IMAGE_SAVE, new main_core_events.BaseEvent({
					data: {
						imageUrl: event.getData().imageUrl
					}
				}));
			});
			this.#copilotImageController.subscribe('place-above', () => {
				this.emit(CopilotEvents.IMAGE_PLACE_ABOVE);
			});
			this.#copilotImageController.subscribe('place-under', () => {
				this.emit(CopilotEvents.IMAGE_PLACE_UNDER);
			});
			this.#copilotImageController.subscribe('cancel', () => {
				this.emit(CopilotEvents.IMAGE_CANCEL);
			});
			this.#copilotImageController.subscribe('completion-result', event => {
				this.emit(CopilotEvents.IMAGE_COMPLETION_RESULT, new main_core_events.BaseEvent({
					data: {
						imageUrl: event.getData().imageUrl
					}
				}));
			});
		}
		async #initCopilotTextController(options) {
			const {
				CopilotTextController: TextController
			} = await main_core.Runtime.loadExtension('ai.copilot.copilot-text-controller');
			this.#copilotTextController = new TextController({
				engine: this.#engine,
				inputField: this.#inputField,
				readonly: options.readonly,
				category: options.category,
				selectedText: options.selectedText,
				context: options.context,
				addImageMenuItem: options.addImageMenuItem,
				warningField: this.#warningField,
				resultField: this.#resultField,
				copilotInputEvents: CopilotInputEvents,
				copilotMenu: CopilotMenu,
				copilotMenuEvents: CopilotMenuEvents,
				analytics: this.#getAnalytics(),
				showResultInCopilot: this.#showResultInCopilot,
				menuForceTop: this.#menuForceTop,
				responseFormat: options.responseFormat
			});
			this.#copilotTextController.subscribe('aiResult', event => {
				this.emit('aiResult', {
					result: event.getData().result
				});
				this.emit(CopilotEvents.TEXT_COMPLETION_RESULT, {
					result: event.getData().result
				});
			});
			this.#copilotTextController.subscribe('prompt-master-show', () => {
				this.#copilotPopup.setClosingByEsc(false);
			});
			this.#copilotTextController.subscribe('prompt-master-destroy', () => {
				this.#copilotPopup.setClosingByEsc(true);
			});
			this.#copilotTextController.subscribe('close', () => {
				this.#copilotTextController.finish();
				this.hide();
			});
			this.#copilotTextController.subscribe('save', event => {
				this.emit(CopilotEvents.TEXT_SAVE, {
					...event.getData()
				});
			});
			this.#copilotTextController.subscribe('add_below', event => {
				this.emit(CopilotEvents.TEXT_PLACE_BELOW, {
					...event.getData()
				});
			});
			this.#copilotTextController.subscribe('show-image-configurator', async () => {
				await this.#initCopilotImageController();
				this.#copilotTextController.finish();
				this.#inputField.setUseForImages(true);
				this.#copilotImageController.start();
				this.#inputField.focus();
			});
			this.#copilotTextController.subscribe('cancel', () => {
				this.emit(CopilotEvents.TEXT_CANCEL);
			});
		}
		async #initCopilotTextControllerMenu() {
			await this.#copilotTextController.init();
		}
		#getOpenMenu() {
			return this.#copilotTextController?.getOpenMenu()?.getPopup() || this.#copilotImageController?.getOpenMenuPopup();
		}
		#mouseDownHandler(event) {
			this.wasMouseDownOnSelf = this.#copilotPopup.getPopupContainer()?.contains(event.target);
		}
		#autoHideHandler(event) {
			const copilotZIndex = this.#copilotPopup.getZindex();
			const target = event.target;
			const isSelf = this.#copilotPopup.getPopupContainer().contains(target);
			const isWarningFieldInfoSlider = this.#warningField.getInfoSliderContainer()?.contains(target);
			const preventAutoHide = this.#preventAutoHide(event);
			const isClickOnOverlaySlider = main_core.Dom.style(event.target.closest('.side-panel-overlay'), 'z-index') > copilotZIndex;
			const isClickOnRolesDialog = Boolean(event.target.closest('.ai_roles-dialog_popup'));
			const isClickOnPromptMasterPopup = Boolean(event.target.closest('.ai__prompt-master-popup'));
			const isClickOnOverlay = Boolean(event.target.closest('.popup-window-overlay'));
			const isClickOnOverlayPopup = main_core.Dom.style(event.target.closest('.popup-window'), 'z-index') > copilotZIndex;
			const isClickOnBaasPopup = Boolean(this.#getBaasPopup()?.getPopupContainer().contains(target));
			const isClickOnNotificationBalloon = Boolean(event.target.closest('.ui-notification-balloon'));
			const shouldBeHidden = !isSelf && !this.#copilotTextController?.isContainsElem(target) && !this.#copilotImageController?.isContainsTarget(target) && !preventAutoHide && !this.wasMouseDownOnSelf && !isWarningFieldInfoSlider && !isClickOnOverlaySlider && !isClickOnRolesDialog && !isClickOnPromptMasterPopup && !isClickOnOverlayPopup && !isClickOnBaasPopup && !isClickOnOverlay && !isClickOnNotificationBalloon;
			if (shouldBeHidden) {
				this.hide();
			}
			this.wasMouseDownOnSelf = false;
			return false;
		}
		#hideMenus() {
			this.#copilotTextController?.hideAllMenus();
			this.#copilotImageController?.hideAllMenus();
		}
		#adjustMenus() {
			this.#copilotTextController?.adjustMenusPosition();
			this.#copilotImageController?.adjustMenusPosition();
		}
		#getAnalytics(withReset = false) {
			if (!this.#analytics || withReset) {
				this.#analytics = new CopilotAnalytics();
				this.#analytics.setContextSection(this.#category);
				if (this.#useText) {
					if (this.#readonly) {
						this.#initAnalyticForReadOnly();
					} else {
						this.#initAnalyticForText();
					}
				} else if (this.#useImage) {
					this.#analytics.setCategoryImage();
				}
			}
			return this.#analytics;
		}
		#initAnalyticForText() {
			this.#analytics.setCategoryText();
			if (!this.#copilotTextController) {
				return;
			}
			if (!this.#copilotTextController.getSelectedText()?.trim() && !this.#copilotTextController.getContext()?.trim()) {
				this.#analytics.setTypeTextNew();
			} else if (this.#copilotTextController.getSelectedText()) {
				this.#analytics.setTypeTextEdit();
			} else {
				this.#analytics.setTypeTextReply();
			}
			if (this.#copilotTextController.getSelectedText()) {
				this.#analytics.setContextElementPopupButton();
			} else {
				this.#analytics.setContextElementSpaceButton();
			}
		}
		#initAnalyticForReadOnly() {
			this.#analytics.setCategoryReadonly();
			if (!this.#copilotTextController) {
				return;
			}
			if (this.#copilotTextController.getSelectedText()) {
				this.#analytics.setContextElementReadonlyQuote();
			} else {
				this.#analytics.setContextElementReadonlyCommon();
			}
		}
		async #showCopilotAfterApplyAgreement(showCopilotOptions) {
			this.#copilotAgreementWasApplied = await checkCopilotAgreement({
				moduleId: this.#engine.getModuleId(),
				contextId: this.#engine.getContextId(),
				events: {
					onAccept: () => {
						this.#copilotAgreementWasApplied = true;
						this.show(showCopilotOptions);
					},
					onCancel: () => {
						this.#copilotAgreementWasApplied = false;
						this.#copilotAgreementWasApplied = undefined;
					}
				}
			});
			if (this.#copilotAgreementWasApplied) {
				this.show(showCopilotOptions);
			}
		}
	}

	class BaseCommand {
		constructor(options) {
			this.copilotTextController = options?.copilotTextController;
		}
	}

	class OpenFeedbackFormCommand extends BaseCommand {
		#category;
		#isBeforeGeneration;
		constructor(options) {
			super(options);
			this.#category = options.category;
			this.#isBeforeGeneration = options.isBeforeGeneration;
		}
		async execute() {
			await this.#openFeedbackForm();
		}
		async #openFeedbackForm() {
			const senderPagePreset = `${this.#category},${this.#isBeforeGeneration ? 'before' : 'after'}`;
			let data = null;
			if (this.#isBeforeGeneration === false) {
				data = await this.copilotTextController.getDataForFeedbackForm();
			}
			const contextMessages = data?.context_messages?.length > 0 ? JSON.stringify(data?.context_messages) : undefined;
			const authorMessage = data?.author_message ?? undefined;
			const formIdNumber = Math.round(Math.random() * 1000);
			main_core.Runtime.loadExtension(['ui.feedback.form']).then(() => {
				BX.UI.Feedback.Form.open({
					id: `ai.copilot.feedback-${formIdNumber}`,
					forms: [{
						zones: ['es'],
						id: 684,
						lang: 'es',
						sec: 'svvq1x'
					}, {
						zones: ['en'],
						id: 686,
						lang: 'en',
						sec: 'tjwodz'
					}, {
						zones: ['de'],
						id: 688,
						lang: 'de',
						sec: 'nrwksg'
					}, {
						zones: ['com.br'],
						id: 690,
						lang: 'com.br',
						sec: 'kpte6m'
					}, {
						zones: ['ru', 'by', 'kz'],
						id: 692,
						lang: 'ru',
						sec: 'jbujn0'
					}],
					presets: {
						sender_page: senderPagePreset,
						prompt_code: data?.prompt?.code,
						user_message: data?.user_message,
						original_message: data?.original_message,
						author_message: authorMessage,
						context_messages: contextMessages,
						last_result0: data?.current_result?.[1],
						language: main_core.Loc.getMessage('LANGUAGE_ID'),
						cp_answer: data?.current_result?.[0]
					}
				});
			}).catch(err => {
				console.err(err);
			});
		}
	}

	const CopilotContextMenuResultPopupEvents = {
		SAVE: 'save',
		CANCEL: 'cancel',
		CHANGE_REQUEST: 'change-request',
		CLOSE: 'close'
	};
	class CopilotContextMenuResultPopup extends main_core_events.EventEmitter {
		#popup = null;
		#bindElement;
		#resultContainer;
		#resultText = '';
		#resultMenu;
		#additionalResultMenuItems = [];
		#engine;
		#analytics;
		constructor(options) {
			super();
			this.setEventNamespace('AI.CopilotReadonly:ResultPopup');
			this.#bindElement = options.bindElement;
			this.#additionalResultMenuItems = options.additionalResultMenuItems.map(menuItem => {
				return {
					...menuItem,
					command: () => {
						menuItem.command(this.#resultText);
					}
				};
			});
			this.#analytics = options.analytics;
			this.#engine = options.engine;
		}
		show() {
			if (!this.#popup) {
				this.#initPopup();
				this.#popup.setOffset({
					offsetTop: 6
				});
			}
			if (!this.#resultMenu) {
				this.#initResultMenu();
			}
			this.#popup.show();
			this.#resultMenu.setBindElement(this.#popup.getPopupContainer(), {
				top: 4
			});
			this.#resultMenu.open();
		}
		isShown() {
			return Boolean(this.#popup?.isShown());
		}
		adjustPosition() {
			this.#popup?.adjustPosition();
			this.#resultMenu?.adjustPosition();
		}
		destroy() {
			this.#popup?.destroy();
			this.#popup = null;
			this.#resultMenu?.close();
			this.#resultMenu = null;
			this.#resultContainer = null;
		}
		setBindElement(bindElement) {
			this.#popup?.setBindElement(bindElement);
			this.adjustPosition();
		}
		getResult() {
			return this.#resultText;
		}
		setResult(text) {
			this.#resultText = text;
			if (this.#resultContainer) {
				this.#resultContainer.innerText = text;
			}
		}
		#initPopup() {
			this.#popup = new main_popup.Popup({
				content: this.#renderPopupContent(),
				bindElement: this.#bindElement,
				cacheable: false,
				className: 'ai__copilot-scope ai__copilot-context-menu__result-popup',
				width: 530,
				closeIcon: true,
				closeIconSize: 'large',
				events: {
					onPopupShow: () => {
						if (this.#resultContainer.scrollHeight > this.#resultContainer.offsetHeight) {
							main_core.Dom.addClass(this.#resultContainer, '--with-scroll');
						}
					},
					onPopupClose: () => {
						this.#resultMenu.close();
						this.emit(CopilotContextMenuResultPopupEvents.CLOSE);
					},
					onPopupAfterClose: () => {
						this.destroy();
					}
				}
			});
		}
		#initResultMenu() {
			this.#resultMenu = new ai_copilot.CopilotMenu({
				bindElement: this.#resultContainer,
				cacheable: false,
				forceTop: false,
				items: [new ai_copilot_copilotTextController.ChangeRequestMenuItem({
					icon: null,
					onClick: () => {
						this.emit(CopilotContextMenuResultPopupEvents.CHANGE_REQUEST);
						this.#analytics.sendEventCancel();
					}
				}).getOptions(), {
					separator: true
				}, new ai_copilot_copilotTextController.CopyResultMenuItem({
					getText: () => {
						this.#analytics.sendEventCopyResult();
						return this.#resultText;
					}
				}).getOptions(), ...this.#additionalResultMenuItems, {
					separator: true
				}, new ai_copilot_copilotTextController.FeedbackMenuItem({
					icon: null,
					isBeforeGeneration: false,
					engine: this.#engine
				}).getOptions()]
			});
		}
		#renderPopupContent() {
			const warningField = new CopilotWarningResultField();
			return main_core.Tag.render`
			<div class="ai__copilot-context-menu__result-popup-content">
				${this.#renderResultContainer()}
				<div class="ai__copilot-context-menu_result-popup-warning">
					${warningField.render(true)}
				</div>
			</div>
		`;
		}
		#renderResultContainer() {
			this.#resultContainer = main_core.Tag.render`
			<div class="ai__copilot-context-menu__result-popup-text">${this.#resultText}</div>
		`;
			return this.#resultContainer;
		}
	}

	const CopilotContextMenuLoaderEvents = {
		CANCEL: 'cancel'
	};
	class CopilotContextMenuLoader extends main_core_events.EventEmitter {
		#popup = null;
		#bindElement;
		#lottieLoaderIcon;
		constructor(options) {
			super(options);
			this.setEventNamespace('AI.CopilotContextMenu:Loader');
			this.#bindElement = options.bindElement;
		}
		show() {
			if (!this.#popup) {
				this.#initPopup();
				this.#popup.setOffset({
					offsetTop: 6
				});
			}
			this.#popup.show();
		}
		destroy() {
			this.#popup.destroy();
			this.#popup = null;
		}
		isShown() {
			return Boolean(this.#popup?.isShown());
		}
		adjustPosition() {
			this.#popup?.adjustPosition();
		}
		setBindElement(bindElement) {
			this.#popup?.setBindElement(bindElement);
			this.adjustPosition();
		}
		#initPopup() {
			this.#popup = new main_popup.Popup({
				content: this.#getPopupContent(),
				bindElement: this.#bindElement,
				cacheable: false,
				minWidth: 282,
				minHeight: 42,
				padding: 6,
				className: 'ai__copilot-scope ai__copilot-context-menu_loader-popup',
				events: {
					onPopupShow: () => {
						this.#lottieLoaderIcon.play();
					},
					onPopupClose: () => {
						this.#lottieLoaderIcon.stop();
					}
				}
			});
		}
		#getPopupContent() {
			const size = 21.5;
			const loaderIcon = main_core.Tag.render`
			<div class="" style="width: ${size}px; height: ${size}px;"></div>
		`;
			this.#lottieLoaderIcon = ui_lottie.Lottie.loadAnimation({
				container: loaderIcon,
				renderer: 'svg',
				animationData: copilotLottieIcon,
				autoplay: false
			});
			const cancelBtn = main_core.Tag.render`
			<button style="opacity: 1;" class="ai__copilot_loader-cancel-btn">
				${main_core.Loc.getMessage('AI_COPILOT_INPUT_LOADER_CANCEL')}
			</button>
		`;
			main_core.Event.bind(cancelBtn, 'click', () => {
				this.emit(CopilotContextMenuLoaderEvents.CANCEL);
			});
			return main_core.Tag.render`
			<div class="ai__copilot-context-menu-loader-content">
				<div class="ai__copilot_loader-left">
					<div class="ai__copilot-context-menu-loader-icon">
						${loaderIcon}
					</div>
					<div class="ai__copilot-context-menu-loader-text-with-dots">
						<span class="ai__copilot_loader-text">${main_core.Loc.getMessage('AI_COPILOT_INPUT_LOADER_TEXT_MSGVER_1', {
			'#COPILOT_NAME#': main_core.Extension.getSettings('ai.copilot').get('copilotName')
		})}</span>
						<div class="ai__copilot-context-menu-loader_dots">
							<div class="dot-flashing"></div>
						</div>
					</div>
				</div>
				${cancelBtn}
			</div>
		`;
		}
	}

	const CopilotContextMenuErrorPopupEvents = {
		CANCEL: 'cancel',
		REPEAT: 'repeat',
		CHANGE_REQUEST: 'change-request'
	};
	class CopilotContextMenuErrorPopup extends main_core_events.EventEmitter {
		#error;
		#bindElement;
		#popup;
		#menu;
		#errorField;
		constructor(options) {
			super(options);
			this.setEventNamespace('AI.CopilotContextMenu:ErrorPopup');
			this.#bindElement = options.bindElement;
			this.#error = options.error;
			this.#errorField = new CopilotInputError({
				errors: [this.#error]
			});
		}
		setError(error) {
			this.#error = error;
			this.#errorField.setErrors([this.#error]);
		}
		show() {
			if (!this.#popup) {
				this.#initPopup();
			}
			this.#popup.show();
		}
		destroy() {
			this.#popup?.destroy();
			this.#popup = null;
		}
		isShown() {
			return Boolean(this.#popup?.isShown());
		}
		adjustPosition() {
			this.#popup?.adjustPosition();
			this.#menu?.adjustPosition();
		}
		setBindElement(bindElement) {
			this.#popup?.setBindElement(bindElement);
			this.adjustPosition();
		}
		#initPopup() {
			if (this.#popup) {
				return;
			}
			this.#popup = new main_popup.Popup({
				bindElement: this.#bindElement,
				content: this.#getPopupContent(),
				className: 'ai__copilot-scope ai__copilot-context-menu_error-popup',
				maxWidth: 600,
				minHeight: 42,
				padding: 6,
				events: {
					onAfterPopupShow: () => {
						this.#showMenu();
					},
					onPopupClose: () => {
						this.#hideMenu();
					},
					onPopupDestroy: () => {
						this.#hideMenu();
					}
				}
			});
			this.#popup.setOffset({
				offsetTop: 6
			});
		}
		#getPopupContent() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Main.WARNING,
				color: getComputedStyle(document.body).getPropertyValue('--ui-color-text-alert'),
				size: 24
			});
			return main_core.Tag.render`
			<div class="ai__copilot-context-menu-error-content">
				<div class="ai__copilot-context-menu-error-content-icon">
					${icon.render()}
				</div>
				<div class="ai__copilot-context-menu-error-content-text">
					${this.#errorField.render()}
				</div>
			</div>
		`;
		}
		#showMenu() {
			if (!this.#menu) {
				this.#initMenu();
			}
			this.#menu.setBindElement(this.#popup.getPopupContainer(), {
				top: 6
			});
			this.#menu.open();
			this.#menu.show();
		}
		#hideMenu() {
			this.#menu?.close();
			this.#menu = null;
		}
		#initMenu() {
			this.#menu = new ai_copilot.CopilotMenu({
				bindElement: this.#popup.getPopupContainer(),
				items: this.#getMenuItems(),
				cacheable: false,
				forceTop: false
			});
		}
		#getMenuItems() {
			return [new ai_copilot_copilotTextController.RepeatCopilotMenuItem({
				icon: null,
				onClick: () => {
					this.emit(CopilotContextMenuErrorPopupEvents.REPEAT);
				}
			}).getOptions(), new ai_copilot_copilotTextController.ChangeRequestMenuItem({
				icon: null,
				onClick: () => {
					this.emit(CopilotContextMenuErrorPopupEvents.CHANGE_REQUEST);
				}
			}).getOptions(), new ai_copilot_copilotTextController.CancelCopilotMenuItem({
				icon: null,
				onClick: () => {
					this.emit(CopilotContextMenuErrorPopupEvents.CANCEL);
				}
			}).getOptions()];
		}
	}

	class CopilotEula {
		static async init() {
			const Feature = await loadExtensionWrapper('bitrix24.license.feature');
			if (!Feature?.Feature) {
				return false;
			}
			const isRestrictionCheckInProgress = main_core.Type.isFunction(CopilotEula.#staticEulaRestrictCallback?.then);
			const isRestrictionNotChecked = CopilotEula.#staticEulaRestrictCallback === null;
			if (isRestrictionNotChecked || isRestrictionCheckInProgress) {
				try {
					if (isRestrictionNotChecked) {
						CopilotEula.#staticEulaRestrictCallback = Feature.Feature.checkEulaRestrictions('ai_available_by_version');
					}
					await CopilotEula.#staticEulaRestrictCallback;
					CopilotEula.#staticEulaRestrictCallback = false;
					return false;
				} catch (err) {
					if (err.callback) {
						CopilotEula.#staticEulaRestrictCallback = err.callback;
						return true;
					}
					console.error(err);
					return false;
				}
			}
			return main_core.Type.isFunction(CopilotEula.#staticEulaRestrictCallback);
		}
		static checkRestricted() {
			if (main_core.Type.isFunction(CopilotEula.#staticEulaRestrictCallback)) {
				CopilotEula.#staticEulaRestrictCallback();
				return true;
			}
			return false;
		}
		static #staticEulaRestrictCallback;
	}

	class CopilotContextMenu extends main_core_events.EventEmitter {
		#bindElement;
		#copilotTextControllerEngine;
		#context;
		#selectedText;
		#generalMenu;
		#resultPopup;
		#loaderPopup;
		#errorPopup;
		#extraResultMenuItems;
		#angle;
		#initEngineOptions;
		constructor(options) {
			super(options);
			this.setEventNamespace('AI.CopilotReadonly');
			this.#validateOptions(options);
			this.#bindElement = options.bindElement;
			this.#context = options.context || '';
			this.#selectedText = options.selectedText || '';
			this.#extraResultMenuItems = options.extraResultMenuItems ?? [];
			this.#angle = options.angle === true;
			this.#initEngineOptions = {
				moduleId: options.moduleId,
				contextId: options.contextId,
				category: options.category,
				contextParameters: options.contextParameters
			};
		}
		async init() {
			if (main_core.Extension.getSettings('ai.copilot').isRestrictByEula) {
				await CopilotEula.init();
			}
			try {
				await this.#initEngine(this.#initEngineOptions);
				this.#initGeneralMenu();
			} catch (e) {
				console.error('Init error', e);
				throw e;
			}
		}
		#isShowCopilotAgreementPopup() {
			return main_core.Extension.getSettings('ai.copilot').isShowAgreementPopup ?? false;
		}
		getResultText() {
			return this.#resultPopup?.getResult() || null;
		}
		show() {
			const isRestrictedByEula = CopilotEula.checkRestricted();
			if (isRestrictedByEula) {
				this.#getAnalytics().sendEventOpen('error_agreement');
				return;
			}
			if (this.#isShowCopilotAgreementPopup()) {
				const moduleId = this.#initEngineOptions.moduleId;
				const contextId = this.#initEngineOptions.contextId;

				// eslint-disable-next-line promise/catch-or-return
				checkCopilotAgreement({
					moduleId,
					contextId,
					events: {
						onAccept: () => {
							this.#showGeneralMenu();
							this.#getAnalytics().sendEventOpen('success');
						}
					}
				}).then(isAccepted => {
					if (isAccepted) {
						this.#showGeneralMenu();
						this.#getAnalytics().sendEventOpen('success');
					}
				});
				return;
			}
			this.#showGeneralMenu();
			this.#getAnalytics().sendEventOpen('success');
		}
		hide() {
			this.#destroyGeneralMenu();
			this.#resultPopup?.destroy();
			this.#destroyErrorPopup();
		}
		isShown() {
			return this.#generalMenu?.isShown() || this.#resultPopup?.isShown() || this.#loaderPopup?.isShown() || this.#errorPopup?.isShown();
		}
		adjustPosition() {
			this.#generalMenu?.adjustPosition();
			this.#errorPopup?.adjustPosition();
			this.#loaderPopup?.adjustPosition();
			this.#resultPopup?.adjustPosition();
		}
		setContext(context) {
			this.#validateContextOption(context);
			this.#context = context || '';
			this.#copilotTextControllerEngine?.setContext(this.#context);
		}
		setSelectedText(selectedText) {
			this.#validateContextOption(selectedText);
			this.#selectedText = selectedText || '';
			this.#copilotTextControllerEngine?.setContext(this.#selectedText);
		}
		setBindElement(bindElement) {
			this.#bindElement = bindElement;
			this.#generalMenu?.setBindElement(bindElement);
			this.#errorPopup?.setBindElement(bindElement);
			this.#resultPopup?.setBindElement(bindElement);
			this.#loaderPopup?.setBindElement(bindElement);
		}
		async #completions() {
			try {
				this.#destroyGeneralMenu();
				this.#showLoaderPopup();
				this.#copilotTextControllerEngine.setAnalyticParameters(this.#getAnalyticParametersForCompletions());
				const result = await this.#copilotTextControllerEngine.completions();
				if (result) {
					this.#setResultPopupText(result);
					this.#hideLoaderPopup();
					this.#showResultPopup();
				}
			} catch (e) {
				this.#handleCompletionsError(e);
			}
		}
		#handleCompletionsError(error) {
			this.#hideLoaderPopup();
			const code = error.getCode();
			switch (code) {
				case 'AI_ENGINE_ERROR_OTHER':
					{
						error.setMessage(main_core.Loc.getMessage('AI_COPILOT_ERROR_OTHER'));
						const command = new OpenFeedbackFormCommand({
							category: this.#copilotTextControllerEngine.getCategory(),
							isBeforeGeneration: false,
							copilotTextController: this.#copilotTextControllerEngine
						});
						error.setCustomData({
							clickHandler: () => command.execute(),
							clickableText: main_core.Loc.getMessage('AI_COPILOT_ERROR_CONTACT_US')
						});
						this.#showErrorPopup(error);
						break;
					}
				case 'LIMIT_IS_EXCEEDED_BAAS':
					{
						this.#showErrorPopup(error);
						break;
					}
				case 'LIMIT_IS_EXCEEDED_MONTHLY':
				case 'LIMIT_IS_EXCEEDED_DAILY':
				case 'SERVICE_IS_NOT_AVAILABLE_BY_TARIFF':
					{
						this.hide();
						break;
					}
				default:
					{
						if (main_core.Type.isStringFilled(error.getCode()) === false) {
							error.setCode('undefined');
						}
						this.#showErrorPopup(error);
					}
			}
			requestAnimationFrame(() => {
				ai_ajaxErrorHandler.AjaxErrorHandler.handleTextGenerateError({
					baasOptions: {
						bindElement: this.#bindElement,
						context: this.#copilotTextControllerEngine.getContextId(),
						useAngle: true
					},
					errorCode: error.getCode(),
					showSliderWithMsg: error?.customData?.showSliderWithMsg,
					sliderCode: error?.customData?.sliderCode,
					forceCodeRules: ['sliderCode', 'msgWithHtmlLink'],
					forceOption: error?.customData,
					bindElement: this.#bindElement
				});
			});
		}
		#getAnalyticParametersForCompletions() {
			const analytics = this.#getAnalytics();
			return {
				category: analytics.getCategory(),
				type: analytics.getType(),
				c_sub_section: analytics.getCSubSection(),
				c_element: analytics.getCElement()
			};
		}
		async #initEngine(initEngineOptions) {
			const {
				CopilotTextControllerEngine
			} = await main_core.Runtime.loadExtension('ai.copilot.copilot-text-controller');
			this.#copilotTextControllerEngine = new CopilotTextControllerEngine({
				moduleId: initEngineOptions.moduleId,
				contextParameters: initEngineOptions.contextParameters,
				contextId: initEngineOptions.contextId,
				category: initEngineOptions.category
			});
			this.#copilotTextControllerEngine.setContext(this.#selectedText || this.#context);
			await this.#copilotTextControllerEngine.init();
		}
		#getGeneralMenuItems() {
			const promptsWithoutZeroPrompt = this.#copilotTextControllerEngine.getPrompts().slice(1);
			const promptsMenuItems = promptsWithoutZeroPrompt.map(prompt => {
				return this.#getPromptMenuItemFromPrompt(prompt);
			});
			return [...promptsMenuItems, {
				separator: true
			}, new ai_copilot_copilotTextController.OpenCopilotMenuItem({
				children: this.#getProviderMenuItems()
			}).getOptions(), new ai_copilot_copilotTextController.AboutCopilotMenuItem().getOptions(), new ai_copilot_copilotTextController.FeedbackMenuItem({
				engine: this.#copilotTextControllerEngine,
				isBeforeGeneration: true
			}).getOptions()];
		}
		#getPromptMenuItemFromPrompt(prompt) {
			const promptChildren = prompt.children || [];
			const promptMenuItem = new BaseMenuItem({
				code: prompt.code,
				text: prompt.title,
				icon: prompt.icon,
				onClick: () => {
					this.#copilotTextControllerEngine.setCommandCode(prompt.code);
					this.#copilotTextControllerEngine.setContext(this.#selectedText || this.#context);
					this.#completions();
				},
				children: promptChildren.map(childPrompt => {
					return this.#getPromptMenuItemFromPrompt(childPrompt);
				})
			});
			if (prompt.separator) {
				return {
					separator: true,
					section: prompt.section,
					title: prompt.title
				};
			}
			return promptMenuItem.getOptions();
		}
		#getProviderMenuItems() {
			const providers = this.#copilotTextControllerEngine.getEngines().map(engine => {
				return new ai_copilot_copilotTextController.ProviderMenuItem({
					code: engine.code,
					text: engine.title,
					selected: this.#copilotTextControllerEngine.getSelectedEngineCode() === engine.code,
					onClick: () => {
						this.#copilotTextControllerEngine.setSelectedEngineCode(engine.code);
						this.#generalMenu.replaceMenuItemSubmenu(new ai_copilot_copilotTextController.OpenCopilotMenuItem({
							children: this.#getProviderMenuItems()
						}).getOptions());
					}
				});
			});
			const result = [...providers];
			if (this.#hasAccessToLibraries()) {
				result.push({
					separator: true
				}, new ai_copilot_copilotTextController.ConnectModelMenuItem(), new ai_copilot_copilotTextController.MarketMenuItem());
			}
			if (this.#copilotTextControllerEngine.getPermissions()?.can_edit_settings) {
				result.push(new ai_copilot_copilotTextController.SettingsMenuItem());
			}
			return result;
		}
		#hasAccessToLibraries() {
			return main_core.Extension.getSettings('ai.copilot').get('isLibraryVisible');
		}
		#showResultPopup() {
			if (!this.#resultPopup) {
				this.#initResultPopup();
			}
			this.#resultPopup.show();
		}
		#setResultPopupText(text) {
			if (!this.#resultPopup) {
				this.#initResultPopup();
			}
			this.#resultPopup.setResult(text);
		}
		#initResultPopup() {
			this.#resultPopup = new CopilotContextMenuResultPopup({
				bindElement: this.#bindElement,
				additionalResultMenuItems: this.#extraResultMenuItems,
				engine: this.#copilotTextControllerEngine,
				analytics: this.#getAnalytics()
			});
			this.#resultPopup.subscribe(CopilotContextMenuResultPopupEvents.SAVE, () => {
				this.#resultPopup.destroy();
				this.#errorPopup.destroy();
				this.#destroyGeneralMenu();
			});
			this.#resultPopup.subscribe(CopilotContextMenuResultPopupEvents.CANCEL, () => {
				this.hide();
			});
			this.#resultPopup.subscribe(CopilotContextMenuResultPopupEvents.CHANGE_REQUEST, () => {
				this.#resultPopup.destroy();
				this.#showGeneralMenu();
			});
		}
		#initLoaderPopup() {
			this.#loaderPopup = new CopilotContextMenuLoader({
				bindElement: this.#bindElement
			});
			this.#loaderPopup.subscribe(CopilotContextMenuLoaderEvents.CANCEL, () => {
				this.#copilotTextControllerEngine.cancelCompletion();
				this.#loaderPopup.destroy();
				this.#showGeneralMenu();
			});
		}
		#showLoaderPopup() {
			if (!this.#loaderPopup) {
				this.#initLoaderPopup();
			}
			this.#loaderPopup.show();
		}
		#hideLoaderPopup() {
			this.#loaderPopup?.destroy();
		}
		#showGeneralMenu() {
			if (!this.#generalMenu) {
				this.#initGeneralMenu();
			}
			this.#generalMenu.setBindElement(this.#bindElement);
			this.#generalMenu.adjustPosition();
			this.#generalMenu.open();
		}
		#destroyGeneralMenu() {
			this.#generalMenu?.close();
			this.#generalMenu = null;
		}
		#initGeneralMenu() {
			this.#generalMenu = new CopilotMenu({
				items: this.#getGeneralMenuItems(),
				bindElement: this.#bindElement,
				cacheable: false,
				autoHide: true,
				forceTop: false,
				angle: this.#getGeneralMenuAngleOptions(),
				bordered: false
			});
			this.#generalMenu.subscribe(CopilotMenuEvents.close, () => {
				this.#generalMenu = null;
			});
		}
		#getGeneralMenuAngleOptions() {
			if (!this.#angle) {
				return null;
			}
			if (main_core.Type.isElementNode(this.#bindElement)) {
				return {
					offset: main_core.Dom.getPosition(this.#bindElement).width,
					position: 'top'
				};
			}
			if (main_core.Type.isObject(this.#bindElement)) {
				return {
					position: 'top'
				};
			}
			return null;
		}
		#showErrorPopup(error) {
			if (!this.#errorPopup) {
				this.#initErrorPopup(error);
			}
			this.#errorPopup.setError(error);
			this.#errorPopup.show();
		}
		#destroyErrorPopup() {
			this.#errorPopup?.destroy();
		}
		#initErrorPopup(error) {
			this.#errorPopup = new CopilotContextMenuErrorPopup({
				error,
				bindElement: this.#bindElement
			});
			this.#errorPopup.subscribe(CopilotContextMenuErrorPopupEvents.CANCEL, () => {
				this.hide();
			});
			this.#errorPopup.subscribe(CopilotContextMenuErrorPopupEvents.CHANGE_REQUEST, () => {
				this.#errorPopup.destroy();
				this.#showGeneralMenu();
			});
			this.#errorPopup.subscribe(CopilotContextMenuErrorPopupEvents.REPEAT, () => {
				this.#errorPopup.destroy();
				this.#completions();
			});
		}
		#validateOptions(options) {
			if (main_core.Type.isObject(options) === false) {
				throw new main_core.BaseError('AI.CopilotContextMenu: options is required for constructor.');
			}
			if (main_core.Type.isStringFilled(options.moduleId) === false) {
				throw new main_core.BaseError('AI.CopilotContextMenu: moduleId is required option and must be string.');
			}
			if (main_core.Type.isStringFilled(options.category) === false) {
				throw new main_core.BaseError('AI.CopilotContextMenu: category is required option and must be string.');
			}
			if (main_core.Type.isStringFilled(options.contextId) === false) {
				throw new main_core.BaseError('AI.CopilotContextMenu: contextId is required option and must be string');
			}
			this.#validateContextOption(options.context);
			if (options.angle && main_core.Type.isBoolean(options.angle) === false) {
				throw new main_core.BaseError('AI.CopilotContextMenu: angle option must be boolean');
			}
		}
		#validateContextOption(context) {
			if (context && main_core.Type.isString(context) === false) {
				throw new main_core.BaseError('AI.CopilotContextMenu: context option must be string');
			}
		}
		#getAnalytics() {
			const analytics = new CopilotAnalytics().setCategoryReadonly().setP1('prompt', this.#copilotTextControllerEngine.getCommandCode()).setP2('provider', this.#copilotTextControllerEngine.getSelectedEngineCode());
			if (this.#context) {
				analytics.setContextElementReadonlyCommon();
			} else {
				analytics.setContextElementReadonlyQuote();
			}
			return analytics;
		}
	}

	exports.Copilot = Copilot;
	exports.CopilotContextMenu = CopilotContextMenu;
	exports.CopilotEvents = CopilotEvents;
	exports.CopilotInput = CopilotInput;
	exports.CopilotInputEvents = CopilotInputEvents;
	exports.CopilotMenu = CopilotMenu;
	exports.CopilotMenuCommand = CopilotMenuCommand;
	exports.CopilotMenuEvents = CopilotMenuEvents;
	exports.CopilotMode = CopilotMode;
	exports.CopilotResult = CopilotResult;

})(this.BX.AI = this.BX.AI || {}, BX, BX.Event, BX.Main, BX.AI, BX, BX.UI.IconSet, window, window, window, window, BX.UI, BX, BX.UI, BX.AI, BX.UI, BX.AI, BX.UI.Feedback, BX.AI, BX.AI);
//# sourceMappingURL=copilot.bundle.js.map
