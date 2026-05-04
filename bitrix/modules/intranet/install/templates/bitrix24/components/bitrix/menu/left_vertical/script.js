/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_cnt, main_core_events, main_popup, ui_buttons, ui_dialogs_messagebox, main_core_event, ui_bannerDispatcher, main_core_cache, main_sidepanel) {
	'use strict';

	class Options {
		static version = '2021.10';
		static eventNameSpace = 'BX.Intranet.LeftMenu:';
		static eventName(name) {
			return ['BX.Intranet.LeftMenu:', ...(main_core.Type.isStringFilled(name) ? [name] : name)].join(':');
		}
		static isExtranet = false;
		static isAdmin = false;
		static isCustomPresetRestricted = false;
		static settingsPath = null;
		static isMainPageEnabled = false;
		static isMessengerEmbedded = false;
		static availablePresetTools = null;
		static inviteDialogLink = null;
		static showMarta = null;
		static showSitemapMenuItem = null;
	}

	class DefaultController {
		#popup = null;
		constructor(container, {
			events
		}) {
			this.container = container;
			if (events) {
				Array.from(Object.keys(events)).forEach(key => {
					main_core_events.EventEmitter.subscribe(this, Options.eventName(key), events[key]);
				});
			}
		}
		getContainer() {
			return this.container;
		}
		createPopup() {}
		getPopup() {
			return this.#popup;
		}
		show() {
			if (this.#popup === null) {
				this.#popup = this.createPopup(...arguments);
				main_core_events.EventEmitter.subscribe(this.#popup, 'onClose', () => {
					main_core_events.EventEmitter.emit(this, Options.eventName('onClose'));
				});
				main_core_events.EventEmitter.subscribe(this.#popup, 'onShow', () => {
					main_core_events.EventEmitter.emit(this, Options.eventName('onShow'));
				});
				main_core_events.EventEmitter.subscribe(this.#popup, 'onDestroy', () => {
					this.#popup = null;
				});
			}
			this.#popup.show();
		}
		hide() {
			if (this.#popup) {
				this.#popup.close();
			}
		}
	}

	class PresetCustomController extends DefaultController {
		isReady = true;
		createPopup() {
			const form = main_core.Tag.render`
			<form id="customPresetForm" style="min-width: 350px;">
				<div style="margin: 15px 0 15px 9px;">
					<input type="radio" name="userScope" id="customPresetCurrentUser" value="currentUser">
					<label for="customPresetCurrentUser">${main_core.Loc.getMessage('MENU_CUSTOM_PRESET_CURRENT_USER')}</label>
				</div>
				<div style="margin: 0 0 38px 9px;">
					<input type="radio" name="userScope" id="customPresetNewUser" value="newUser" checked>
					<label for="customPresetNewUser">${main_core.Loc.getMessage('MENU_CUSTOM_PRESET_NEW_USER')}</label>
				</div>
				<hr style="background-color: #edeef0; border: none; color:  #edeef0; height: 1px;">
			</form>
		`;
			return main_popup.PopupManager.create('custom-preset-form-popup', null, {
				overlay: true,
				contentColor: 'white',
				contentNoPaddings: true,
				lightShadow: true,
				draggable: {
					restrict: true
				},
				closeByEsc: true,
				titleBar: main_core.Loc.getMessage('MENU_CUSTOM_PRESET_POPUP_TITLE'),
				offsetTop: 1,
				offsetLeft: 20,
				cacheable: false,
				closeIcon: true,
				content: form,
				buttons: [new ui_buttons.SaveButton({
					onclick: button => {
						if (this.isReady === false) {
							return;
						}
						button.setWaiting(true);
						this.isReady = false;
						main_core_events.EventEmitter.emit(this, Options.eventName('onPresetIsSet'), form.elements.userScope.value === 'newUser').forEach(promise => {
							promise.then(() => {
								button.setWaiting(false);
								this.hide();
								main_popup.PopupManager.create('menu-custom-preset-success-popup', null, {
									closeIcon: true,
									contentColor: 'white',
									titleBar: main_core.Loc.getMessage('MENU_CUSTOM_PRESET_POPUP_TITLE'),
									content: main_core.Loc.getMessage('MENU_CUSTOM_PRESET_SUCCESS')
								}).show();
							}).catch(() => {
								console.log('Error!!');
							});
						});
						this.isReady = true;
					}
				}), new ui_buttons.CancelButton({
					onclick: () => {
						this.hide();
					}
				})]
			});
		}
	}

	class Utils {
		static #curPage = null;
		static #curUri = null;
		static getCurPage() {
			if (this.#curPage === null) {
				this.#curPage = document.location.pathname + document.location.search;
			}
			return this.#curPage === '' ? null : this.#curPage;
		}
		static getCurUri() {
			if (this.#curUri === null) {
				this.#curUri = new main_core.Uri(document.location.href);
			}
			return this.#curUri;
		}
		static catchError(response) {
			main_core.Runtime.loadExtension('ui.notification').then(() => {
				const notificationCenter = main_core.Reflection.getClass('BX.UI.Notification.Center');
				notificationCenter.notify({
					content: [main_core.Loc.getMessage('MENU_ERROR_OCCURRED'), response.errors ? `: ${response.errors[0].message}` : ''].join(' '),
					position: 'bottom-left',
					category: 'menu-self-item-popup',
					autoHideDelay: 3000
				});
			}).catch(() => {
				console.log('LeftMenu: cannot load ui.notification.');
			});
		}
		static prefersReducedMotion() {
			return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		}
		static refineUrl(originUrl) {
			let url = String(originUrl).trim();
			if (url !== '') {
				if (!/^https?:\/\//i.test(url) && !/^\//i.test(url)) {
					// for external links like "google.com" (without a protocol)
					url = `https://${url}`;
				} else {
					const link = document.createElement('a');
					link.href = url;
					if (document.location.host === link.host) {
						// http://portal.com/path/ => /path/
						url = link.pathname + link.search + link.hash;
					}
				}
			}
			return url;
		}
	}

	class PresetDefaultController extends DefaultController {
		isReady = true;
		#unavailableToolPopup;
		#mode;
		createPopup(mode) {
			let button;
			this.#mode = mode;
			const content = document.querySelector('#left-menu-preset-popup').cloneNode(true);
			return main_popup.PopupManager.create(this.constructor.name.toString(), null, {
				overlay: true,
				contentColor: "white",
				contentNoPaddings: true,
				lightShadow: true,
				draggable: {
					restrict: true
				},
				closeByEsc: true,
				offsetTop: 1,
				offsetLeft: 20,
				cacheable: false,
				closeIcon: true,
				content: content,
				events: {
					onFirstShow: () => {
						[...content.querySelectorAll('.js-left-menu-preset-item')].forEach(node => {
							node.addEventListener('click', () => {
								const radio = node.querySelector('input[type="radio"]');
								if (radio) {
									radio.checked = true;
								}
								[...content.querySelectorAll('.js-left-menu-preset-item')].forEach(otherNode => {
									otherNode.classList[otherNode === node ? 'add' : 'remove']('left-menu-popup-selected');
								});
							});
						});
					}
				},
				buttons: [button = new ui_buttons.CreateButton({
					text: main_core.Loc.getMessage('MENU_CONFIRM_BUTTON'),
					onclick: () => {
						if (button.isWaiting()) {
							return;
						}
						button.setWaiting(true);
						const currentPreset = this.getSelectedPreset();
						if (!Options.isAdmin && Options.availablePresetTools && Options.availablePresetTools[currentPreset] === false) {
							button.setWaiting(false);
							this.showUnavailableToolPopup();
							return;
						}
						main_core_events.EventEmitter.emit(this, Options.eventName('onPresetIsSet'), {
							presetId: currentPreset,
							mode
						}).forEach(promise => {
							promise.then(response => {
								button.setWaiting(false);
								this.hide();
								if (response.data.hasOwnProperty("url")) {
									document.location.href = response.data.url;
								} else {
									document.location.reload();
								}
							}).catch(Utils.catchError);
						});
					}
				}), new ui_buttons.CancelButton({
					text: main_core.Loc.getMessage('MENU_DELAY_BUTTON'),
					onclick: () => {
						main_core_events.EventEmitter.emit(this, Options.eventName('onPresetIsPostponed'), {
							mode
						});
						this.hide();
					}
				})]
			});
		}
		getMode() {
			return this.#mode;
		}
		getSelectedPreset() {
			let currentPreset = '';
			if (document.forms['left-menu-preset-form']) {
				[...document.forms['left-menu-preset-form'].elements['presetType']].forEach(node => {
					if (node.checked) {
						currentPreset = node.value;
					}
				});
			}
			return currentPreset;
		}
		showUnavailableToolPopup() {
			if (!(this.#unavailableToolPopup instanceof ui_dialogs_messagebox.MessageBox)) {
				this.#unavailableToolPopup = ui_dialogs_messagebox.MessageBox.create({
					message: main_core.Loc.getMessage('MENU_UNAVAILABLE_TOOL_POPUP_DESCRIPTION'),
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK
				});
			}
			this.#unavailableToolPopup.show();
		}
	}

	class SettingsController extends DefaultController {
		menuId = 'leftMenuSettingsPopup';
		createPopup() {
			const menu = new main_popup.Menu({
				bindElement: this.container,
				targetContainer: document.querySelector('.js-app__left-menu'),
				items: this.getItems(),
				angle: true,
				offsetTop: 0,
				offsetLeft: 50
			});
			return menu.getPopupWindow();
		}
		getItems() {
			const notHandledMenuItems = main_core_events.EventEmitter.emit(this, Options.eventName('onGettingSettingMenuItems'));
			return this.#getMenuItems([...notHandledMenuItems][0]);
		}
		#getMenuItems(items) {
			if (main_core.Type.isArray(items) === false) {
				return [];
			}
			return items.map(item => {
				return this.#getMenuItem(item);
			});
		}
		#getMenuItem(data) {
			if (!main_core.Type.isPlainObject(data)) {
				return null;
			}
			const {
				text,
				html,
				onclick,
				className,
				items = [],
				delimiter = false
			} = data;
			return {
				html,
				text: html ? undefined : text,
				items: this.#getMenuItems(items),
				delimiter,
				className: `menu-popup-no-icon ${className}`,
				onclick: (event, item) => {
					if (!main_core.Type.isArrayFilled(items)) {
						item.getMenuWindow().close();
					}
					item.getMenuWindow().getParentMenuItem()?.getMenuWindow()?.close();
					if (onclick) {
						onclick(event, item);
					}
				}
			};
		}
	}

	class Backend {
		static toggleMenu(collapse) {
			if (main_core.Loc.getMessage('USER_ID') <= 0) {
				return;
			}
			main_core.Loc.getMessage('SITE_DIR') || '/';
			const context = Options.isMessengerEmbedded ? 'online' : '';
			return main_core.ajax.runAction(`intranet.leftmenu.${collapse ? "collapseMenu" : "expandMenu"}`, {
				data: {
					context
				},
				analyticsLabel: {
					leftmenu: {
						action: collapse ? "collapseMenu" : "expandMenu"
					}
				}
			});
		}
		static saveSelfItemMenu(itemData) {
			const action = itemData.id > 0 ? "update" : "add";
			return main_core.ajax.runAction(`intranet.leftmenu.${action}SelfItem`, {
				data: {
					itemData: itemData
				},
				analyticsLabel: {
					leftmenu: {
						action: 'selfItemAddOrUpdate'
					}
				}
			});
		}
		static deleteSelfITem(id) {
			return main_core.ajax.runAction('intranet.leftmenu.deleteSelfItem', {
				data: {
					menuItemId: id
				},
				analyticsLabel: {
					leftmenu: {
						action: 'selfItemDelete'
					}
				}
			});
		}
		static addFavoritesItemMenu(itemData) {
			return main_core.ajax.runAction('intranet.leftmenu.addStandartItem', {
				data: {
					itemData: itemData
				},
				analyticsLabel: {
					leftmenu: {
						action: 'standardItemAdd'
					}
				}
			});
		}
		static deleteFavoritesItemMenu(itemData) {
			return main_core.ajax.runAction('intranet.leftmenu.deleteStandartItem', {
				data: {
					itemData: itemData
				},
				analyticsLabel: {
					leftmenu: {
						action: 'standardItemDelete'
					}
				}
			});
		}
		static updateFavoritesItemMenu(itemData) {
			return main_core.ajax.runAction('intranet.leftmenu.updateStandartItem', {
				data: {
					itemText: itemData.text,
					itemId: itemData.id
				},
				analyticsLabel: {
					leftmenu: {
						action: 'standardItemUpdate'
					}
				}
			});
		}
		static addAdminSharedItemMenu(itemData) {
			return main_core.ajax.runAction('intranet.leftmenu.addItemToAll', {
				data: {
					itemInfo: itemData
				},
				analyticsLabel: {
					leftmenu: {
						action: 'adminItemAdd'
					}
				}
			});
		}
		static deleteAdminSharedItemMenu(id) {
			return main_core.ajax.runAction('intranet.leftmenu.deleteItemFromAll', {
				data: {
					menu_item_id: id
				},
				analyticsLabel: {
					leftmenu: {
						action: 'adminItemDelete'
					}
				}
			});
		}
		static saveItemsSort(menuItems, firstItemLink, analyticsLabel) {
			return main_core.ajax.runAction('intranet.leftmenu.saveItemsSort', {
				data: {
					items: menuItems,
					firstItemLink: firstItemLink,
					version: Options.version
				},
				analyticsLabel: {
					leftmenu: analyticsLabel
				}
			});
		}
		static setFirstPage(firstPageLink) {
			return main_core.ajax.runAction('intranet.leftmenu.setFirstPage', {
				data: {
					firstPageUrl: firstPageLink
				},
				analyticsLabel: {
					leftmenu: {
						action: 'mainPageIsSet'
					}
				}
			});
		}
		static setDefaultPreset() {
			return main_core.ajax.runAction('intranet.leftmenu.setDefaultMenu', {
				data: {},
				analyticsLabel: {
					leftmenu: {
						action: 'defaultMenuIsSet'
					}
				}
			});
		}
		static setCustomPreset(forNewUsersOnly, itemsSort, customItems, firstItemLink) {
			return main_core.ajax.runAction('intranet.leftmenu.saveCustomPreset', {
				data: {
					userApply: forNewUsersOnly === true ? 'newUser' : 'currentUser',
					itemsSort: itemsSort,
					customItems: customItems,
					firstItemLink: firstItemLink,
					version: Options.version
				},
				analyticsLabel: {
					leftmenu: {
						action: 'customPresetIsSet'
					}
				}
			});
		}
		static deleteCustomItem(id) {
			return main_core.ajax.runAction('intranet.leftmenu.deleteCustomItemFromAll', {
				data: {
					menu_item_id: id
				},
				analyticsLabel: {
					leftmenu: {
						action: 'customItemDelete'
					}
				}
			});
		}
		static setSystemPreset(mode, presetId) {
			return main_core.ajax.runAction('intranet.leftmenu.setPreset', {
				data: {
					preset: presetId,
					mode: mode === 'global' ? 'global' : 'personal'
				},
				analyticsLabel: {
					leftmenu: {
						action: 'systemPresetIsSet',
						presetId: presetId,
						mode: mode,
						analyticsFirst: mode === 'global' ? 'y' : 'n'
					}
				}
			});
		}
		static postponeSystemPreset(mode) {
			return main_core.ajax.runAction('intranet.leftmenu.delaySetPreset', {
				data: {},
				analyticsLabel: {
					leftmenu: {
						action: 'systemPresetIsPostponed',
						mode: mode,
						analyticsFirst: mode === 'global' ? 'y' : 'n'
					}
				}
			});
		}
		static clearCache() {
			return main_core.ajax.runAction('intranet.leftmenu.clearCache', {
				data: {},
				analyticsLabel: {
					leftmenu: {
						action: 'clearCache'
					}
				}
			});
		}
		static expandGroup(id) {
			if (main_core.Loc.getMessage('USER_ID') <= 0) {
				return;
			}
			return main_core.ajax.runAction('intranet.leftmenu.expandMenuGroup', {
				data: {
					id
				},
				analyticsLabel: {
					leftmenu: {
						action: 'expandMenuGroup'
					}
				}
			});
		}
		static collapseGroup(id) {
			if (main_core.Loc.getMessage('USER_ID') <= 0) {
				return;
			}
			return main_core.ajax.runAction('intranet.leftmenu.collapseMenuGroup', {
				data: {
					id
				},
				analyticsLabel: {
					leftmenu: {
						action: 'collapseMenuGroup'
					}
				}
			});
		}
	}

	class Item {
		static code = 'abstract';
		links = [];
		isDraggable = true;
		storage = [];
		constructor(parentContainer, container) {
			this.parentContainer = parentContainer;
			this.container = container;
			this.init();
			this.onDeleteAsFavorites = this.onDeleteAsFavorites.bind(this);
			setTimeout(() => {
				main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, Options.eventName('onItemDeleteAsFavorites'), this.onDeleteAsFavorites);
				main_core_events.EventEmitter.incrementMaxListeners(main_core_events.EventEmitter.GLOBAL_TARGET, Options.eventName('onItemDeleteAsFavorites'));
				main_core_events.EventEmitter.subscribe(this, Options.eventName('onItemDelete'), this.destroy.bind(this));
			}, 0);
			this.showError = this.showError.bind(this);
			this.showMessage = this.showMessage.bind(this);
		}
		getId() {
			return this.container.dataset.id;
		}
		getCode() {
			return this.constructor.code;
		}
		getName() {
			return this.container.querySelector("[data-role='item-text']").textContent;
		}
		canDelete() {
			return false;
		}
		delete() {
			// Just do it.
		}
		init() {
			this.links = [];
			if (this.container.hasAttribute('data-link') && main_core.Type.isStringFilled(this.container.getAttribute("data-link"))) {
				this.links.push(this.container.getAttribute("data-link"));
			}
			if (this.container.hasAttribute("data-all-links")) {
				this.container.getAttribute("data-all-links").split(",").forEach(link => {
					link = String(link).trim();
					if (main_core.Type.isStringFilled(link)) {
						this.links.push(link);
					}
				});
			}
			this.makeTextIcons();
			this.storage = this.container.dataset.storage.split(',');
		}
		update({
			link,
			openInNewPage,
			text
		}) {
			openInNewPage = openInNewPage === 'Y' ? 'Y' : 'N';
			if (this.container.hasAttribute('data-link')) {
				this.container.setAttribute('data-link', main_core.Text.encode(link));
				this.container.setAttribute('data-new-page', openInNewPage);
			}
			const linkNode = this.container.querySelector('a');
			if (linkNode) {
				if (main_core.Type.isString(link)) {
					linkNode.setAttribute('href', main_core.Text.encode(link));
				}
				linkNode.setAttribute('target', openInNewPage === 'Y' ? '_blank' : '_self');
			}
			this.container.querySelector("[data-role='item-text']").innerHTML = main_core.Text.encode(text);
			this.init();
		}
		destroy() {
			main_core_events.EventEmitter.unsubscribe(main_core_events.EventEmitter.GLOBAL_TARGET, Options.eventName('onItemDeleteAsFavorites'), this.onDeleteAsFavorites);
			main_core_events.EventEmitter.decrementMaxListeners(main_core_events.EventEmitter.GLOBAL_TARGET, 'onItemDeleteAsFavorites');
		}
		getSimilarToUrl(currentUri) {
			const result = [];
			this.links.forEach((link, index) => {
				if (areUrlsEqual(link, currentUri)) {
					let priority = 0;
					if (index === 0)
						// main link is in higher priority
						{
							priority = this.getCode() === 'default' ? 2 : 1;
						}
					result.push({
						priority,
						url: link
					});
				}
			});
			return result;
		}
		makeTextIcons() {
			if (!this.container.classList.contains("menu-item-no-icon-state")) {
				return;
			}
			const icon = this.container.querySelector(".menu-item-icon");
			const text = this.container.querySelector(".menu-item-link-text");
			if (icon && text) {
				icon.textContent = getShortName(text.textContent);
			}
		}
		getCounterValue() {
			const counter = ui_cnt.Counter.initFromCounterNode(this.container.querySelector(`.${ui_cnt.Counter.BaseClassname}`));
			if (!counter) {
				return null;
			}
			return counter.getRealValue();
		}
		updateCounter(counterValue) {
			const counter = ui_cnt.Counter.initFromCounterNode(this.container.querySelector(`.${ui_cnt.Counter.BaseClassname}`));
			if (!counter) {
				return;
			}
			const oldValue = counter.getRealValue() || 0;
			counter.update(parseInt(counterValue, 10));
			if (counterValue > 0) {
				main_core.Dom.addClass(this.container, 'menu-item-with-index');
			} else {
				main_core.Dom.removeClass(this.container, 'menu-item-with-index');
			}
			const linkNode = this.container.querySelector('.menu-item-link');
			if (linkNode) {
				main_core.Dom.attr(linkNode, 'aria-label', this.constructor.getItemAriaLabel(this.getName(), counterValue));
			}
			return {
				oldValue,
				newValue: counterValue
			};
		}
		markAsActive() {
			console.error('This action is only for the group');
		}
		showWarning(title, events) {
			this.removeWarning();
			const link = this.container.querySelector(".menu-item-link");
			if (!link) {
				return;
			}
			title = title ? main_core.Text.encode(title) : '';
			const node = main_core.Tag.render`<span class="menu-post-warn-icon" role="img" title="${title}" aria-label="${title}"></span>`;
			if (events) {
				Object.keys(events).forEach(key => {
					main_core.Event.bind(node, key, events[key]);
				});
			}
			this.container.classList.add("menu-item-warning-state");
			link.appendChild(node);
		}
		removeWarning() {
			if (!this.container.classList.contains('menu-item-warning-state')) {
				return;
			}
			this.container.classList.remove('menu-item-warning-state');
			let node;
			while (node = this.container.querySelector(".menu-post-warn-icon")) {
				node.parentNode.removeChild(node);
			}
		}
		showMessage(message) {
			if (this.showMessagePopup) {
				this.showMessagePopup.close();
			}
			this.showMessagePopup = main_popup.PopupManager.create("left-menu-message", this.container, {
				content: '<div class="left-menu-message-popup">' + message + '</div>',
				darkMode: true,
				offsetTop: 2,
				offsetLeft: 0,
				angle: true,
				events: {
					onClose: () => {
						this.showMessagePopup = null;
					}
				},
				autoHide: true
			});
			this.showMessagePopup.show();
			setTimeout(() => {
				if (this.showMessagePopup) {
					this.showMessagePopup.close();
				}
			}, 3000);
		}
		showError(response) {
			const errors = [];
			if (response.errors) {
				errors.push(response.errors[0].message);
			} else if (response instanceof TypeError) {
				errors.push(response.message);
			}
			const message = [main_core.Loc.getMessage("MENU_ERROR_OCCURRED"), ...errors].join(' ');
			this.showMessage(message);
		}
		getDropDownActions() {
			return [];
		}
		getEditFields() {
			return {
				id: this.getId(),
				text: this.getName()
			};
		}
		onDeleteAsFavorites({
			data
		}) {
			if (String(data.id) === String(this.getId())) {
				if (this.getCode() === 'standard' /* instanceof ItemUserFavorites*/) {
					main_core_events.EventEmitter.emit(this, Options.eventName('onItemDelete'), {
						item: this,
						animate: true
					});
				} else {
					this.storage = [...this.storage].filter(v => {
						return v !== 'standard';
					});
					this.container.dataset.storage = this.storage.join(',');
				}
				main_core_events.EventEmitter.unsubscribe(main_core_events.EventEmitter.GLOBAL_TARGET, Options.eventName('onItemDeleteAsFavorites'), this.onDeleteAsFavorites);
				main_core_events.EventEmitter.decrementMaxListeners(main_core_events.EventEmitter.GLOBAL_TARGET, Options.eventName('onItemDeleteAsFavorites'));
			}
		}
		static detect(node) {
			return node.getAttribute("data-role") !== 'group' && node.getAttribute("data-type") === this.code;
		}
		static createNode({
			id,
			text,
			link,
			openInNewPage,
			counterId,
			counterValue,
			topMenuId
		}) {
			id = main_core.Text.encode(id);
			text = main_core.Text.encode(text);
			link = main_core.Text.encode(link);
			counterId = counterId ? main_core.Text.encode(counterId) : '';
			counterValue = counterValue ? parseInt(counterValue) : 0;
			openInNewPage = openInNewPage === 'Y' ? 'Y' : 'N';
			const counter = new ui_cnt.Counter({
				size: ui_cnt.Counter.Size.SMALL,
				style: ui_cnt.Counter.Style.FILLED_ALERT,
				useAirDesign: true,
				value: counterValue,
				id: `menu-counter-${counterId}`
			});
			const ariaLabel = this.getItemAriaLabel(text, counterValue);
			return main_core.Tag.render`<li 
			id="bx_left_menu_${id}" 
			data-status="show" 
			data-id="${id}" 
			data-role="item"
			data-storage="" 
			data-counter-id="${counterId}" 
			data-link="${link}" 
			data-all-links="" 
			data-type="${this.code}" 
			data-delete-perm="Y" 
			${topMenuId ? `data-top-menu-id="${main_core.Text.encode(topMenuId)}"` : ""}
			data-new-page="${openInNewPage}" 
			class="menu-item-block menu-item-no-icon-state">
				<span class="menu-favorites-btn menu-favorites-draggable" aria-hidden="true">
					<span class="menu-fav-draggable-icon"></span>
				</span>
				<a class="menu-item-link" aria-label="${ariaLabel}" data-slider-ignore-autobinding="true" href="${link}" target="${openInNewPage === 'Y' ? '_blank' : '_self'}">
					<span class="menu-item-icon-box" aria-hidden="true">
						<span class="menu-item-icon">W</span>
					</span>
					<span class="menu-item-link-text " data-role="item-text">${text}</span>
					${counterId ? `<span class="menu-item-index-wrap">
						${counter.render()}
					</span>` : ''}
				</a>
				<span data-role="item-edit-control" class="menu-fav-editable-btn menu-favorites-btn" aria-hidden="true" tabindex="-1">
					<span class="menu-favorites-btn-icon"></span>
				</span>
			</li>`;
		}

		// region Edition for siblings
		static backendSaveItem(itemInfo) {
			throw 'Function backendSaveItem must be replaced';
		}
		static showUpdate(item) {
			return new Promise((resolve, reject) => {
				this.showForm(item.container, item.getEditFields(), resolve, reject);
			});
		}
		static getItemAriaLabel(name, counterValue) {
			if (counterValue <= 0) {
				return name;
			}
			return main_core.Loc.getMessagePlural('MENU_ITEM_ARIA', Number(counterValue), {
				'#ITEM#': name,
				'#COUNT#': String(counterValue)
			});
		}
		static #setFieldError(field) {
			main_core.Dom.addClass(field, 'menu-form-input-error');
			main_core.Dom.attr(field, 'aria-invalid', 'true');
			let errorMsg = field.parentNode.querySelector('.menu-form-error-message');
			if (!errorMsg) {
				errorMsg = main_core.Tag.render`<span class="menu-form-error-message" id="${field.id}-error" role="alert"></span>`;
				main_core.Dom.attr(field, 'aria-describedby', `${field.id}-error`);
				main_core.Dom.insertAfter(errorMsg, field);
			}
			errorMsg.textContent = main_core.Loc.getMessage('MENU_EMPTY_FORM_ERROR');
			field.focus();
		}
		static #clearFieldError(field) {
			main_core.Dom.removeClass(field, 'menu-form-input-error');
			main_core.Dom.attr(field, 'aria-invalid', null);
			const errorMsg = field.parentNode.querySelector('.menu-form-error-message');
			if (errorMsg) {
				errorMsg.textContent = '';
			}
		}
		static checkForm(form) {
			if (String(form.elements["text"].value).trim().length <= 0) {
				this.#setFieldError(form.elements["text"]);
				return false;
			}
			if (form.elements["link"]) {
				if (String(form.elements["link"].value).trim().length <= 0 || Utils.refineUrl(form.elements["link"].value).length <= 0) {
					this.#setFieldError(form.elements["link"]);
					return false;
				} else {
					form.elements["link"].value = Utils.refineUrl(form.elements["link"].value);
				}
			}
			return true;
		}
		static showForm(bindElement, itemInfo, resolve, reject) {
			if (this.popup) {
				this.popup.close();
			}
			const isEditMode = itemInfo.id !== '';
			const form = main_core.Tag.render`
<form name="menuAddToFavoriteForm">
	<input type="hidden" name="id" value="${main_core.Text.encode(itemInfo.id || '')}">
	<label for="menuPageToFavoriteName" class="menu-form-label">${main_core.Loc.getMessage("MENU_ITEM_NAME")}</label>
	<input name="text" type="text" id="menuPageToFavoriteName" class="menu-form-input" value="${main_core.Text.encode(itemInfo.text || '')}" >
	${itemInfo['link'] !== undefined ? `<br><br>
	<label for="menuPageToFavoriteLink" class="menu-form-label">${main_core.Loc.getMessage("MENU_ITEM_LINK")}</label>
	<input name="link" id="menuPageToFavoriteLink" type="text" class="menu-form-input" value="${main_core.Text.encode(itemInfo.link)}" >` : ''}
	${itemInfo['openInNewPage'] !== undefined ? `<br><br>
	<input name="openInNewPage" id="menuOpenInNewPage" type="checkbox" value="Y" ${itemInfo.openInNewPage === 'Y' ? 'checked' : ''} >
	<label for="menuOpenInNewPage" class="menu-form-label">${main_core.Loc.getMessage("MENU_OPEN_IN_NEW_PAGE")}</label>` : ''}
</form>`;
			Object.keys(itemInfo).forEach(key => {
				if (['id', 'text', 'link', 'openInNewPage'].indexOf(key) < 0) {
					const name = main_core.Text.encode(key);
					const value = main_core.Text.encode(itemInfo[key]);
					form.appendChild(main_core.Tag.render`<input type="hidden" name="${name}" value="${value}">`);
				}
			});
			main_core.Event.bind(form.elements['text'], 'input', () => {
				this.#clearFieldError(form.elements['text']);
			});
			if (form.elements['link']) {
				main_core.Event.bind(form.elements['link'], 'input', () => {
					this.#clearFieldError(form.elements['link']);
				});
			}
			this.popup = main_popup.PopupManager.create('menu-self-item-popup', bindElement, {
				className: 'menu-self-item-popup',
				titleBar: itemInfo['link'] === undefined ? main_core.Loc.getMessage("MENU_RENAME_ITEM") : isEditMode ? main_core.Loc.getMessage("MENU_EDIT_SELF_PAGE") : main_core.Loc.getMessage("MENU_ADD_SELF_PAGE"),
				offsetTop: 1,
				offsetLeft: 20,
				cacheable: false,
				closeIcon: true,
				lightShadow: true,
				draggable: {
					restrict: true
				},
				closeByEsc: true,
				content: form,
				buttons: [new ui_buttons.SaveButton({
					onclick: () => {
						if (this.checkForm(form)) {
							const itemInfoToSave = {};
							[...form.elements].forEach(node => {
								itemInfoToSave[node.name] = node.value;
							});
							if (form.elements['openInNewPage']) {
								itemInfoToSave['openInNewPage'] = form.elements["openInNewPage"].checked ? 'Y' : 'N';
							}
							this.backendSaveItem(itemInfoToSave).then(() => {
								resolve(itemInfoToSave);
								this.popup.close();
							}).catch(Utils.catchError);
						}
					}
				}), new ui_buttons.CancelButton({
					onclick: () => {
						this.popup.close();
					}
				})]
			});
			this.popup.show();
		}
		//endregion
	}
	function areUrlsEqual(url, currentUri) {
		const checkedUri = new main_core.Uri(url);
		const checkedUrlBrief = checkedUri.getPath().replace('/index.php', '').replace('/index.html', '');
		const currentUrlBrief = currentUri.getPath().replace('/index.php', '').replace('/index.html', '');
		if (checkedUri.getHost() !== '' && checkedUri.getHost() !== currentUri.getHost()) {
			return false;
		}
		if (currentUrlBrief.indexOf(checkedUrlBrief) !== 0) {
			return false;
		}
		return true;
	}
	function getShortName(name) {
		if (!main_core.Type.isStringFilled(name)) {
			return "...";
		}
		name = name.replace(/['`".,:;~|{}*^$#@&+\-=?!()[\]<>\n\r]+/g, "").trim();
		if (name.length <= 0) {
			return '...';
		}
		let shortName;
		let words = name.split(/[\s,]+/);
		if (words.length <= 1) {
			shortName = name.substring(0, 1);
		} else if (words.length === 2) {
			shortName = words[0].substring(0, 1) + words[1].substring(0, 1);
		} else {
			let firstWord = words[0];
			let secondWord = words[1];
			for (let i = 1; i < words.length; i++) {
				if (words[i].length > 3) {
					secondWord = words[i];
					break;
				}
			}
			shortName = firstWord.substring(0, 1) + secondWord.substring(0, 1);
		}
		return shortName.toUpperCase();
	}

	class ItemUserFavorites extends Item {
		static code = 'standard';
		static #currentPageInTopMenu = null;
		canDelete() {
			return true;
		}
		delete() {
			Backend.deleteFavoritesItemMenu({
				id: this.getId(),
				storage: this.storage
			}).then(() => {
				this.destroy();
				main_core_events.EventEmitter.emit(this, Options.eventName('onItemDelete'), {
					animate: true
				});
				const context = this.getSimilarToUrl(Utils.getCurUri()).length > 0 ? window : {
					'doesnotmatter': ''
				};
				BX.onCustomEvent("BX.Bitrix24.LeftMenuClass:onMenuItemDeleted", [{
					id: this.getId()
				}, this]);
				BX.onCustomEvent('BX.Bitrix24.LeftMenuClass:onStandardItemChangedSuccess', [{
					isActive: false,
					context: context
				}]);
			});
		}
		getDropDownActions() {
			const contextMenuItems = [];
			contextMenuItems.push({
				text: main_core.Loc.getMessage("MENU_RENAME_ITEM"),
				onclick: () => {
					this.constructor.showUpdate(this).then(this.update.bind(this)).catch(this.showError);
				}
			});
			contextMenuItems.push({
				text: main_core.Loc.getMessage("MENU_REMOVE_STANDARD_ITEM"),
				onclick: () => {
					this.delete();
				}
			});
			if (Options.isAdmin) {
				contextMenuItems.push({
					text: main_core.Loc.getMessage("MENU_ADD_ITEM_TO_ALL"),
					onclick: () => {
						const itemLinkNode = this.container.querySelector('a');
						Backend.addAdminSharedItemMenu({
							id: this.getId(),
							link: this.links[0],
							text: this.getName(),
							counterId: this.container.dataset.counterId,
							openInNewPage: itemLinkNode && itemLinkNode.getAttribute("target") === "_blank" ? "Y" : "N"
						}).then(() => {
							this.showMessage(main_core.Loc.getMessage('MENU_ITEM_WAS_ADDED_TO_ALL'));
							this.container.dataset.type = ItemAdminShared.code;
							this.storage.push(ItemUserFavorites.code);
							this.container.dataset.storage = this.storage.join(',');
							main_core_events.EventEmitter.emit(this, Options.eventName('onItemConvert'), this);
						}).catch(this.showError);
					}
				});
			}
			return contextMenuItems;
		}
		static backendSaveItem(itemInfoToSave) {
			return Backend.updateFavoritesItemMenu(itemInfoToSave);
		}
		static getActiveTopMenuItem() {
			if (this.#currentPageInTopMenu) {
				return this.#currentPageInTopMenu;
			}
			if (!BX.Main || !BX.Main.interfaceButtonsManager) {
				return null;
			}
			const firstTopMenuInstance = Array.from(Object.values(BX.Main.interfaceButtonsManager.getObjects())).shift();
			if (firstTopMenuInstance) {
				const topMenuItem = firstTopMenuInstance.getActive();
				if (topMenuItem && typeof topMenuItem === "object") {
					const link = document.createElement("a");
					link.href = topMenuItem['URL'];
					//IE11 omits slash in the pathname
					const path = link.pathname[0] !== "/" ? "/" + link.pathname : link.pathname;
					this.#currentPageInTopMenu = {
						ID: topMenuItem['ID'] || null,
						NODE: topMenuItem['NODE'] || null,
						URL: path + link.search,
						TEXT: topMenuItem['TEXT'],
						DATA_ID: topMenuItem['DATA_ID'],
						COUNTER_ID: topMenuItem['COUNTER_ID'],
						COUNTER: topMenuItem['COUNTER'],
						SUB_LINK: topMenuItem['SUB_LINK']
					};
				}
			}
			return this.#currentPageInTopMenu;
		}
		static isCurrentPageStandard(topMenuPoint) {
			if (topMenuPoint && topMenuPoint['URL']) {
				const currentFullPath = document.location.pathname + document.location.search;
				return topMenuPoint.URL === currentFullPath && topMenuPoint.URL.indexOf('workgroups') < 0;
			}
			return false;
		}
		static saveCurrentPage({
			pageTitle,
			pageLink
		}) {
			const topMenuPoint = this.getActiveTopMenuItem();
			let itemInfo, startX, startY;
			if (topMenuPoint && topMenuPoint.NODE && this.isCurrentPageStandard(topMenuPoint) && (pageLink === Utils.getCurPage() || pageLink === topMenuPoint.URL || !pageLink)) {
				const menuNodeCoord = topMenuPoint.NODE.getBoundingClientRect();
				startX = menuNodeCoord.left;
				startY = menuNodeCoord.top;
				itemInfo = {
					id: topMenuPoint.DATA_ID,
					text: pageTitle || topMenuPoint.TEXT,
					link: Utils.getCurPage() || topMenuPoint.URL,
					counterId: topMenuPoint.COUNTER_ID,
					counterValue: topMenuPoint.COUNTER,
					isStandardItem: true,
					subLink: topMenuPoint.SUB_LINK
				};
			} else {
				itemInfo = {
					text: pageTitle || document.getElementById('pagetitle').innerText,
					link: pageLink || Utils.getCurPage(),
					isStandardItem: pageLink === Utils.getCurPage()
				};
				const titleCoord = BX("pagetitle").getBoundingClientRect();
				startX = titleCoord.left;
				startY = titleCoord.top;
			}
			return Backend.addFavoritesItemMenu(itemInfo).then(({
				data: {
					itemId
				}
			}) => {
				itemInfo.id = itemId;
				itemInfo.topMenuId = itemInfo.id;
				return {
					node: this.createNode(itemInfo),
					animateFromPoint: {
						startX,
						startY
					},
					itemInfo: itemInfo
				};
			});
		}
		static deleteCurrentPage({
			pageLink
		}) {
			const topPoint = this.getActiveTopMenuItem();
			var itemInfo = {},
				startX,
				startY;
			if (topPoint && this.isCurrentPageStandard(topPoint)) {
				itemInfo['id'] = topPoint.DATA_ID;
				const menuNodeCoord = topPoint.NODE.getBoundingClientRect();
				startX = menuNodeCoord.left;
				startY = menuNodeCoord.top;
			} else {
				itemInfo['link'] = pageLink || Utils.getCurPage();
				const titleCoord = BX("pagetitle").getBoundingClientRect();
				startX = titleCoord.left;
				startY = titleCoord.top;
			}
			return Backend.deleteFavoritesItemMenu(itemInfo).then(({
				data
			}) => {
				if (!itemInfo.id && data && data['itemId']) {
					itemInfo.id = data['itemId'];
				}
				main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, Options.eventName('onItemDeleteAsFavorites'), {
					id: itemInfo.id
				});
				return {
					itemInfo: itemInfo,
					animateToPoint: {
						startX,
						startY
					}
				};
			});
		}
		static saveStandardPage({
			DATA_ID,
			TEXT,
			SUB_LINK,
			COUNTER_ID,
			COUNTER,
			NODE,
			URL
		}) {
			const itemInfo = {
				id: DATA_ID,
				text: TEXT,
				link: URL,
				subLink: SUB_LINK,
				counterId: COUNTER_ID,
				counterValue: COUNTER
			};
			const pos = NODE.getBoundingClientRect();
			const startX = pos.left;
			const startY = pos.top;
			return Backend.addFavoritesItemMenu(itemInfo).then(({
				data: {
					itemId
				}
			}) => {
				itemInfo.id = itemId;
				itemInfo.topMenuId = itemInfo.id;
				const topPoint = this.getActiveTopMenuItem();
				BX.onCustomEvent("BX.Bitrix24.LeftMenuClass:onMenuItemAdded", [itemInfo, this]);
				BX.onCustomEvent('BX.Bitrix24.LeftMenuClass:onStandardItemChangedSuccess', [{
					isActive: true,
					context: topPoint && topPoint.DATA_ID === DATA_ID ? window : null
				}]);
				return {
					node: this.createNode(itemInfo),
					animateFromPoint: {
						startX,
						startY
					}
				};
			});
		}
		static deleteStandardPage({
			DATA_ID
		}) {
			const itemInfo = {
				id: DATA_ID
			};
			return Backend.deleteFavoritesItemMenu(itemInfo).then(() => {
				main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, Options.eventName('onItemDeleteAsFavorites'), {
					id: itemInfo.id
				});
				BX.onCustomEvent("BX.Bitrix24.LeftMenuClass:onMenuItemDeleted", [itemInfo, this]);
				BX.onCustomEvent('BX.Bitrix24.LeftMenuClass:onStandardItemChangedSuccess', [{
					isActive: false
				}]);
				return {
					itemInfo: itemInfo
				};
			});
		}
	}

	class ItemUserSelf extends Item {
		static code = 'self';
		canDelete() {
			return true;
		}
		delete() {
			return Backend.deleteSelfITem(this.getId()).then(() => {
				if (this.storage.indexOf(ItemUserFavorites.code) >= 0) {
					Backend.deleteFavoritesItemMenu({
						id: this.getId()
					});
				}
				main_core_events.EventEmitter.emit(this, Options.eventName('onItemDelete'), {
					animate: true
				});
			}).catch(this.showError);
		}
		getDropDownActions() {
			const contextMenuItems = [];
			contextMenuItems.push({
				text: main_core.Loc.getMessage("MENU_EDIT_ITEM"),
				onclick: () => {
					this.constructor.showUpdate(this).then(this.update.bind(this)).catch(this.showError);
				}
			});
			contextMenuItems.push({
				text: main_core.Loc.getMessage('MENU_DELETE_SELF_ITEM'),
				onclick: () => {
					ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('MENU_DELETE_SELF_ITEM_CONFIRM'), main_core.Loc.getMessage('MENU_DELETE_SELF_ITEM'), messageBox => {
						this.delete();
						messageBox.close();
					}, main_core.Loc.getMessage('MENU_DELETE'));
				}
			});
			if (Options.isAdmin) {
				contextMenuItems.push({
					text: main_core.Loc.getMessage("MENU_ADD_ITEM_TO_ALL"),
					onclick: () => {
						const itemLinkNode = this.container.querySelector('a');
						Backend.addAdminSharedItemMenu({
							id: this.getId(),
							link: this.links[0],
							text: this.getName(),
							counterId: this.container.dataset.counterId,
							openInNewPage: itemLinkNode && itemLinkNode.getAttribute("target") === "_blank" ? "Y" : "N"
						}).then(() => {
							this.showMessage(main_core.Loc.getMessage('MENU_ITEM_WAS_ADDED_TO_ALL'));
							this.container.dataset.type = ItemAdminShared.code;
							this.storage.push(ItemUserSelf.code);
							this.container.dataset.storage = this.storage.join(',');
							main_core_events.EventEmitter.emit(this, Options.eventName('onItemConvert'), this);
						}).catch(this.showError);
					}
				});
			}
			return contextMenuItems;
		}
		getEditFields() {
			return {
				id: this.getId(),
				text: this.getName(),
				link: this.links[0],
				openInNewPage: this.container.getAttribute('data-new-page')
			};
		}
		static backendSaveItem(itemInfo) {
			return Backend.saveSelfItemMenu(itemInfo).then(({
				data
			}) => {
				if (data && data['itemId']) {
					itemInfo.id = data['itemId'];
				}
				return itemInfo;
			});
		}
		static showAdd(bindElement) {
			return new Promise((resolve1, reject2) => {
				this.showForm(bindElement, {
					id: 0,
					name: '',
					link: '',
					openInNewPage: 'Y'
				}, resolve1, reject2);
			}).then(itemInfo => {
				return {
					node: this.createNode(itemInfo)
				};
			});
		}
	}

	class ItemAdminShared extends Item {
		static code = 'admin';
		canDelete() {
			return this.container.dataset.deletePerm === 'Y';
		}
		delete() {
			Backend.deleteAdminSharedItemMenu(this.getId()).then(() => {
				if (this.storage.indexOf(ItemUserFavorites.code) >= 0) {
					Backend.deleteFavoritesItemMenu({
						id: this.getId()
					});
				}
				if (this.storage.indexOf(ItemUserSelf.code) >= 0) {
					Backend.deleteSelfITem(this.getId());
				}
				main_core_events.EventEmitter.emit(this, Options.eventName('onItemDelete'), {
					animate: true
				});
			}).catch(this.showError);
		}
		getDropDownActions() {
			if (!this.canDelete()) {
				return [];
			}
			const contextMenuItems = [];
			/*		contextMenuItems.push({
						text: Loc.getMessage("MENU_RENAME_ITEM"),
						onclick: () => {
							this.constructor
								.showUpdate(this)
								.then(this.update.bind(this))
								.catch(this.showError.bind(this));
						}
					});
			*/

			if (this.storage.filter(value => {
				return value === ItemUserFavorites.code || value === ItemUserSelf.code;
			}).length > 0) {
				contextMenuItems.push({
					text: main_core.Loc.getMessage('MENU_REMOVE_STANDARD_ITEM'),
					onclick: this.delete.bind(this)
				});
				contextMenuItems.push({
					text: main_core.Loc.getMessage('MENU_DELETE_CUSTOM_ITEM_FROM_ALL'),
					onclick: () => {
						Backend.deleteAdminSharedItemMenu(this.getId()).then(() => {
							this.showMessage(main_core.Loc.getMessage('MENU_ITEM_WAS_DELETED_FROM_ALL'));
							const codeToConvert = this.storage.indexOf(ItemUserSelf.code) >= 0 ? ItemUserSelf.code : ItemUserFavorites.code;
							this.container.dataset.type = codeToConvert;
							this.container.dataset.storage = this.storage.filter(v => {
								return v !== codeToConvert;
							}).join(',');
							main_core_events.EventEmitter.emit(this, Options.eventName('onItemConvert'), this);
						}).catch(this.showError);
					}
				});
			} else {
				contextMenuItems.push({
					text: main_core.Loc.getMessage("MENU_DELETE_CUSTOM_ITEM_FROM_ALL"),
					onclick: this.delete.bind(this)
				});
			}
			return contextMenuItems;
		}
	}

	class ItemAdminCustom extends Item {
		static code = 'custom';
		canDelete() {
			return this.container.dataset.deletePerm === 'Y';
		}
		delete() {
			if (this.canDelete()) {
				Backend.deleteCustomItem(this.getId()).then(() => {
					if (this.storage.indexOf(ItemUserFavorites.code) >= 0) {
						Backend.deleteFavoritesItemMenu({
							id: this.getId()
						});
					}
					main_core_events.EventEmitter.emit(this, Options.eventName('onItemDelete'), {
						animate: true
					});
				}).catch(this.showError);
			}
		}
		getDropDownActions() {
			const actions = [];
			if (this.canDelete()) {
				actions.push({
					text: main_core.Loc.getMessage("MENU_DELETE_ITEM_FROM_ALL"),
					onclick: this.delete.bind(this)
				});
			}
			return actions;
		}
	}

	class ItemMainPage extends Item {
		static code = 'main';
		canDelete() {
			return false;
		}
		openSettings() {
			const url = `${main_core.Loc.getMessage('mainpage_settings_path')}&analyticContext=left_menu`;
			BX.SidePanel.Instance.open(url);
		}
	}

	class ItemSystem extends Item {
		static code = 'default';
		canDelete() {
			return false;
		}
	}

	class ItemGroup extends Item {
		static code = 'group';
		constructor() {
			super(...arguments);
			this.container.addEventListener('click', this.toggleAndSave.bind(this), true);
			this.container.addEventListener('mouseleave', () => {
				main_core.Dom.removeClass(this.container, 'menu-item-group-actioned');
			});
			this.groupContainer = this.container.parentNode.querySelector(`[data-group-id="${this.getId()}"]`);
			if (this.container.getAttribute('data-collapse-mode') === 'collapsed') {
				this.groupContainer.style.display = 'none';
			}
			setTimeout(() => {
				this.updateCounter();
			}, 0);
		}
		toggleAndSave(event) {
			event.preventDefault();
			event.stopPropagation();
			const toggleButton = this.container.querySelector('.menu-item-link');
			const containsActive = this.container.getAttribute('data-contains-active-item') === 'Y';
			if (this.container.getAttribute('data-collapse-mode') === 'collapsed') {
				Backend.expandGroup(this.getId());
				this.expand().then(() => {
					this.container.setAttribute('data-collapse-mode', 'expanded');
					main_core.Dom.attr(toggleButton, 'aria-expanded', 'true');
					main_core.Dom.attr(toggleButton, 'aria-label', this.constructor.getItemAriaLabel(this.getName(), 0));
					if (containsActive) {
						this.#transferAriaCurrentToChild(toggleButton);
					}
				});
			} else {
				Backend.collapseGroup(this.getId());
				this.collapse().then(() => {
					this.container.setAttribute('data-collapse-mode', 'collapsed');
					main_core.Dom.attr(toggleButton, 'aria-expanded', 'false');
					main_core.Dom.attr(toggleButton, 'aria-label', this.constructor.getItemAriaLabel(this.getName(), this.getCounterValue()));
					if (containsActive) {
						this.#transferAriaCurrentToGroup(toggleButton);
					}
				});
			}
			return false;
		}
		#transferAriaCurrentToChild(groupButton) {
			groupButton.removeAttribute('aria-current');
			const activeChild = this.groupContainer.querySelector('.menu-item-active .menu-item-link');
			if (activeChild) {
				main_core.Dom.attr(activeChild, 'aria-current', 'page');
			}
		}
		#transferAriaCurrentToGroup(groupButton) {
			const activeChild = this.groupContainer.querySelector('.menu-item-active .menu-item-link');
			if (activeChild) {
				activeChild.removeAttribute('aria-current');
			}
			main_core.Dom.attr(groupButton, 'aria-current', 'page');
		}
		checkAndCorrect() {
			const groupContainer = this.groupContainer;
			if (groupContainer.parentNode === this.container) {
				main_core.Dom.insertAfter(groupContainer, this.container);
			}
			[...groupContainer.querySelectorAll(`.menu-item-block`)].forEach(node => {
				node.setAttribute('data-status', this.container.getAttribute("data-status"));
			});
			return this;
		}
		#collapsingAnimation;
		collapse(hideGroupContainer) {
			return new Promise(resolve => {
				const groupContainer = this.groupContainer;
				if (this.#collapsingAnimation) {
					this.#collapsingAnimation.stop();
				}
				const onComplete = () => {
					main_core.Dom.style(groupContainer, {
						display: 'none',
						opacity: 'auto',
						height: 'auto'
					});
					main_core.Dom.style(groupContainer, 'overflow', null);
					if (this.container.getAttribute('data-contains-active-item') === 'Y') {
						main_core.Dom.addClass(this.container, 'menu-item-active');
					}
					main_core.Dom.removeClass(this.container, 'menu-item-group-collapsing');
					main_core.Dom.removeClass(groupContainer, 'menu-item-group-collapsing');
					this.#collapsingAnimation = null;
					if (hideGroupContainer === true) {
						main_core.Dom.append(groupContainer, this.container);
					}
					resolve();
				};
				if (Utils.prefersReducedMotion()) {
					onComplete();
					return;
				}
				groupContainer.style.overflow = 'hidden';
				main_core.Dom.addClass(this.container, 'menu-item-group-collapsing');
				main_core.Dom.addClass(this.container, 'menu-item-group-actioned');
				main_core.Dom.addClass(groupContainer, 'menu-item-group-collapsing');
				const slideParams = {
					height: groupContainer.offsetHeight,
					display: groupContainer.style.display
				};
				this.#collapsingAnimation = new BX.easing({
					duration: 500,
					start: {
						height: slideParams.height,
						opacity: 100
					},
					finish: {
						height: 0,
						opacity: 0
					},
					transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
					step: function (state) {
						groupContainer.style.height = state.height + 'px';
						groupContainer.style.opacity = state.opacity / 100;
					},
					complete: onComplete
				});
				this.#collapsingAnimation.animate();
			});
		}
		expand(checkAttribute) {
			return new Promise(resolve => {
				const container = this.container;
				const groupContainer = this.groupContainer;
				if (checkAttribute === true && container.getAttribute('data-collapse-mode') === 'collapsed') {
					return resolve();
				}
				if (groupContainer.parentNode === this.container) {
					main_core.Dom.insertAfter(groupContainer, this.container);
				}
				main_core.Dom.style(groupContainer, {
					display: 'block'
				});
				if (Utils.prefersReducedMotion()) {
					main_core.Dom.style(groupContainer, {
						height: 'auto',
						opacity: 'auto'
					});
					resolve();
					return;
				}
				const contentHeight = groupContainer.querySelectorAll('li').length * (container.offsetHeight + 4);
				main_core.Dom.addClass(container, 'menu-item-group-expanding');
				main_core.Dom.addClass(container, 'menu-item-group-actioned');
				main_core.Dom.addClass(groupContainer, 'menu-item-group-expanding');
				this.#collapsingAnimation = new BX.easing({
					duration: 500,
					start: {
						height: 0,
						opacity: 0
					},
					finish: {
						height: contentHeight,
						opacity: 100
					},
					transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
					step: function (state) {
						groupContainer.style.height = state.height + 'px';
						groupContainer.style.opacity = state.opacity / 100;
					},
					complete: function () {
						main_core.Dom.removeClass(container, 'menu-item-group-expanding menu-item-active');
						main_core.Dom.removeClass(groupContainer, 'menu-item-group-expanding');
						groupContainer.style.height = 'auto';
						groupContainer.style.opacity = 'auto';
						resolve();
					}
				});
				this.#collapsingAnimation.animate();
			});
		}
		canDelete() {
			return false;
		}
		updateCounter() {
			let counterValue = 0;
			[...this.container.parentNode.querySelector(`[data-group-id="${this.getId()}"]`).querySelectorAll(`.${ui_cnt.Counter.BaseClassname}`)].forEach(node => {
				const counter = ui_cnt.Counter.initFromCounterNode(node);
				counterValue += counter.getRealValue();
			});
			ui_cnt.Counter.updateCounterNodeValue(this.container.querySelector(`.${ui_cnt.Counter.BaseClassname}`), counterValue);
			if (counterValue > 0) {
				main_core.Dom.addClass(this.container, 'menu-item-with-index');
			} else {
				main_core.Dom.removeClass(this.container, 'menu-item-with-index');
			}
			const isCollapsed = this.container.getAttribute('data-collapse-mode') === 'collapsed';
			const linkNode = this.container.querySelector('.menu-item-link');
			main_core.Dom.attr(linkNode, 'aria-label', this.constructor.getItemAriaLabel(this.getName(), isCollapsed ? counterValue : 0));
		}
		markAsActive() {
			this.container.setAttribute('data-contains-active-item', 'Y');
			if (this.container.getAttribute('data-collapse-mode') === 'collapsed') main_core.Dom.addClass(this.container, 'menu-item-active');
		}
		markAsInactive() {
			this.container.removeAttribute('data-contains-active-item');
			main_core.Dom.removeClass(this.container, 'menu-item-active');
		}
		isActive() {
			return this.container.getAttribute('data-contains-active-item') === 'Y';
		}
		static detect(node) {
			return node.getAttribute("data-role") === 'group' && node.getAttribute("data-type") === this.code;
		}
	}

	class ItemGroupSystem extends ItemGroup {
		constructor() {
			super(...arguments);
			this.container.querySelector('[data-role="item-edit-control"]').style.display = 'none';
		}
		static code = 'system_group';
	}

	const itemMappings = [Item, ItemAdminShared, ItemUserFavorites, ItemAdminCustom, ItemUserSelf, ItemSystem, ItemGroup, ItemGroupSystem, ItemMainPage];
	function getItem(itemData) {
		let itemClassName = Item;
		itemMappings.forEach(itemClass => {
			if (itemClass.detect(itemData)) {
				itemClassName = itemClass;
			}
		});
		return itemClassName;
	}

	class ItemActive {
		#link;
		#actualLink;
		constructor() {
			this.#actualLink = new main_core.Uri(window.location.href);
		}
		checkAndSet(item, links) {
			/*
			Custom items have more priority than standard items.
			Example:
				Calendar (standard item)
					data-link="/company/personal/user/1/calendar/"
					data-all-links="/company/personal/user/1/calendar/,/calendar/
					Company Calendar (custom item)
					 data-link="/calendar/"
				We've got two items with the identical link /calendar/'.
			*/
			if (item === this.item) {
				return false;
			}
			let theMostOfTheLinks = this.#link;
			links.forEach(link => {
				const linkUri = new main_core.Uri(link.url);
				let changeActiveItem = false;
				if (!theMostOfTheLinks || theMostOfTheLinks.uri.getPath().length < linkUri.getPath().length) {
					changeActiveItem = true;
				} else if (theMostOfTheLinks.uri.getPath().length === linkUri.getPath().length) {
					const actualParams = this.#actualLink.getQueryParams();
					const theMostOfTheLinkServiceData = {
						params: theMostOfTheLinks.uri.getQueryParams(),
						matches: 0
					};
					const comparedLinkParams = {
						params: linkUri.getQueryParams(),
						matches: 0
					};
					for (const key of Object.keys(actualParams)) {
						if (key in actualParams && key in theMostOfTheLinkServiceData.params && String(actualParams[key]) === String(theMostOfTheLinkServiceData.params[key])) {
							theMostOfTheLinkServiceData.matches++;
						}
						if (key in actualParams && key in comparedLinkParams.params && String(actualParams[key]) === String(comparedLinkParams.params[key])) {
							comparedLinkParams.matches++;
						}
					}
					if (comparedLinkParams.matches > theMostOfTheLinkServiceData.matches || comparedLinkParams.matches === theMostOfTheLinkServiceData.matches && Object.keys(comparedLinkParams.params).length < Object.keys(theMostOfTheLinkServiceData.params).length || theMostOfTheLinks.priority < link.priority) {
						changeActiveItem = true;
					}
				}
				if (changeActiveItem) {
					theMostOfTheLinks = {
						priority: link.priority,
						url: link.url,
						uri: linkUri
					};
				}
			});
			if (theMostOfTheLinks !== this.#link) {
				if (this.item) {
					this.unhighlight(this.item);
				}
				this.#link = theMostOfTheLinks;
				this.item = item;
				this.highlight();
				return true;
			}
			return false;
		}
		checkAndUnset(item) {
			if (item instanceof Item && item === this.item) {
				this.unhighlight(this.item);
				this.item = null;
				this.#link = null;
			}
		}
		highlight() {
			if (this.item) {
				this.item.container.classList.add('menu-item-active');
				const linkNode = this.item.container.querySelector('.menu-item-link');
				const isInsideCollapsedGroup = this.#highlightParentGroups();
				if (isInsideCollapsedGroup) {
					main_core.Dom.attr(linkNode, 'aria-current', null);
				} else {
					main_core.Dom.attr(linkNode, 'aria-current', 'page');
				}
			}
		}
		#highlightParentGroups() {
			let insideCollapsed = false;
			let parent = this.item.container.closest('[data-role="group-content"]');
			while (parent) {
				const parentContainer = parent.parentNode.querySelector(`[data-id="${parent.getAttribute('data-group-id')}"]`);
				if (parentContainer) {
					parentContainer.setAttribute('data-contains-active-item', 'Y');
					if (parentContainer.getAttribute('data-collapse-mode') === 'collapsed') {
						parentContainer.classList.add('menu-item-active');
						const groupLink = parentContainer.querySelector('.menu-item-link');
						main_core.Dom.attr(groupLink, 'aria-current', 'page');
						insideCollapsed = true;
					}
				}
				parent = parent.closest('[data-relo="group-content"]');
			}
			return insideCollapsed;
		}
		unhighlight(item) {
			if (!(item instanceof Item)) {
				item = this.item;
			}
			if (item instanceof Item) {
				item.container.classList.remove('menu-item-active');
				const linkNode = item.container.querySelector('.menu-item-link');
				main_core.Dom.attr(linkNode, 'aria-current', null);
				let parent = item.container.closest('[data-role="group-content"]');
				while (parent) {
					const parentContainer = parent.parentNode.querySelector(`[data-id="${parent.getAttribute('data-group-id')}"]`);
					if (parentContainer) {
						parentContainer.removeAttribute('data-contains-active-item');
						parentContainer.classList.remove('menu-item-active');
						const groupLink = parentContainer.querySelector('.menu-item-link');
						main_core.Dom.attr(groupLink, 'aria-current', null);
					}
					parent = parent.closest('[data-relo="group-content"]');
				}
				return item;
			}
			return null;
		}
	}

	class ItemsController extends DefaultController {
		items = new Map();
		#activeItem = new ItemActive();
		#isEditMode = false;
		constructor(container, {
			events
		}) {
			super(container, {
				events
			});
			this.parentContainer = container;
			this.container = container.querySelector(".menu-items");
			this.hiddenContainer = container.querySelector('#left-menu-hidden-items-block');
			container.querySelectorAll('li.menu-item-block').forEach(this.registerItem.bind(this));
			container.querySelector('#left-menu-hidden-separator').addEventListener('click', this.toggleHiddenContainer.bind(this));
			if (this.getActiveItem() && this.getActiveItem().container.getAttribute('data-status') === 'hide') {
				this.#showHiddenContainer(false);
			}
		}
		registerItem(node) {
			const itemClass = getItem(node);
			const item = new itemClass(this.container, node);
			this.items.set(item.getId(), item);
			if (!(item instanceof ItemMainPage)) {
				this.#registerDND(item);
			}
			if (this.#activeItem.checkAndSet(item, item.getSimilarToUrl(Utils.getCurUri())) === true) {
				let parentItem = this.#getParentItemFor(item);
				while (parentItem) {
					parentItem.markAsActive();
					parentItem = this.#getParentItemFor(parentItem);
				}
			}
			main_core_events.EventEmitter.subscribe(item, Options.eventName('onItemDelete'), ({
				data
			}) => {
				this.deleteItem(item, data);
			});
			main_core_events.EventEmitter.subscribe(item, Options.eventName('onItemConvert'), ({
				data
			}) => {
				this.convertItem(item, data);
			});
			[...item.container.querySelectorAll('a')].forEach(node => {
				node.addEventListener('click', event => {
					if (this.#isEditMode === true) {
						event.preventDefault();
						event.stopPropagation();
						return false;
					}
				}, true);
			});
			item.container.querySelector('[data-role="item-edit-control"]')?.addEventListener('click', event => {
				this.openItemMenu(item, event.target, event.currentTarget);
			});
			return item;
		}
		unregisterItem(item) {
			if (!this.items.has(item.getId())) {
				return;
			}
			this.items.delete(item.getId());
			this.#activeItem.checkAndUnset(item, item.getSimilarToUrl(Utils.getCurUri()));
			main_core_events.EventEmitter.unsubscribeAll(item, Options.eventName('onItemDelete'));
			main_core_events.EventEmitter.unsubscribeAll(item, Options.eventName('onItemConvert'));
			item.container.parentNode.replaceChild(item.container.cloneNode(true), item.container);
		}
		get isEditMode() {
			return this.#isEditMode;
		}
		switchToEditMode() {
			if (this.#isEditMode) {
				return;
			}
			this.#isEditMode = true;
			main_core_events.EventEmitter.emit(this, Options.eventName('EditMode'));
		}
		switchToViewMode() {
			if (!this.#isEditMode) {
				return;
			}
			this.#isEditMode = false;
			main_core_events.EventEmitter.emit(this, Options.eventName('ViewMode'));
		}
		isHiddenContainerVisible() {
			return this.hiddenContainer.classList.contains('menu-item-favorites-more-open');
		}
		toggleHiddenContainer(animate) {
			if (this.hiddenContainer.classList.contains('menu-item-favorites-more-open')) {
				this.#hideHiddenContainer(animate);
			} else {
				this.#showHiddenContainer(animate);
			}
		}
		#showHiddenContainer(animate) {
			this.hiddenContainer.inert = false;
			main_core_events.EventEmitter.emit(this, Options.eventName('onHiddenBlockIsVisible'));
			if (animate === false) {
				return this.hiddenContainer.classList.add('menu-item-favorites-more-open');
			}
			this.hiddenContainer.style.height = "0px";
			this.hiddenContainer.style.opacity = 0;
			this.#animation(true, this.hiddenContainer, this.hiddenContainer.scrollHeight);
		}
		#hideHiddenContainer(animate) {
			this.hiddenContainer.inert = true;
			main_core_events.EventEmitter.emit(this, Options.eventName('onHiddenBlockIsHidden'));
			if (animate === false) {
				return this.hiddenContainer.classList.remove('menu-item-favorites-more-open');
			}
			this.#animation(false, this.hiddenContainer, this.hiddenContainer.offsetHeight);
		}
		#animation(opening, hiddenBlock, maxHeight) {
			const onComplete = () => {
				if (opening) {
					hiddenBlock.classList.add('menu-item-favorites-more-open');
				} else {
					hiddenBlock.classList.remove('menu-item-favorites-more-open');
				}
				main_core.Dom.style(hiddenBlock, {
					opacity: null,
					overflow: null,
					height: null
				});
			};
			if (Utils.prefersReducedMotion()) {
				onComplete();
				return;
			}
			hiddenBlock.style.overflow = "hidden";
			new BX.easing({
				duration: 200,
				start: {
					opacity: opening ? 0 : 100,
					height: opening ? 0 : maxHeight
				},
				finish: {
					opacity: opening ? 100 : 0,
					height: opening ? maxHeight : 0
				},
				transition: BX.easing.transitions.linear,
				step: function (state) {
					hiddenBlock.style.opacity = state.opacity / 100;
					hiddenBlock.style.height = state.height + "px";
				},
				complete: onComplete
			}).animate();
		}
		setItemAsAMainPage(item) {
			const node = item.container;
			node.setAttribute("data-status", "show");
			const startTop = node.offsetTop;
			const dragElement = main_core.Dom.create("div", {
				attrs: {
					className: "menu-draggable-wrap"
				},
				style: {
					top: startTop
				}
			});
			const insertBeforeElement = node.nextElementSibling;
			if (insertBeforeElement) {
				node.parentNode.insertBefore(dragElement, insertBeforeElement);
			} else {
				node.parentNode.appendChild(dragElement);
			}
			dragElement.appendChild(node);
			main_core.Dom.addClass(node, "menu-item-draggable");
			const onMainPageComplete = () => {
				this.container.insertBefore(node, BX('left-menu-empty-item').nextSibling);
				main_core.Dom.removeClass(node, 'menu-item-draggable');
				main_core.Dom.remove(dragElement);
				this.#saveItemsSort({
					action: 'mainPageIsSet',
					itemId: item.getId()
				});
			};
			if (Utils.prefersReducedMotion()) {
				onMainPageComplete();
				return;
			}
			new BX.easing({
				duration: 500,
				start: {
					top: startTop
				},
				finish: {
					top: 0
				},
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: function (state) {
					dragElement.style.top = state.top + "px";
				},
				complete: onMainPageComplete
			}).animate();
		}
		showItem(item) {
			const oldParent = this.#getParentItemFor(item);
			const container = this.container;
			item.container.setAttribute('data-status', 'show');
			if (this.#canChangePaternity(item)) {
				container.appendChild(item.container);
				this.#refreshActivity(item, oldParent);
			} else if (oldParent) {
				container.appendChild(oldParent.container);
				oldParent.container.setAttribute('data-status', 'show');
				container.appendChild(oldParent.groupContainer);
			}
			if (this.hiddenContainer.querySelector('.menu-item-block') === null) {
				main_core_events.EventEmitter.emit(this, Options.eventName('onHiddenBlockIsEmpty'));
				this.#hideHiddenContainer(false);
			}
			this.#recalculateCounters(item);
			this.#saveItemsSort({
				action: 'showItem',
				itemId: item.getId()
			});
		}
		hideItem(item) {
			const oldParent = this.#getParentItemFor(item);
			const container = this.hiddenContainer.querySelector('#left-menu-hidden-items-list');
			const emitEvent = container.querySelector('.menu-item-block') === null;
			item.container.setAttribute('data-status', 'hide');
			if (this.#canChangePaternity(item)) {
				container.appendChild(item.container);
				this.#refreshActivity(item, oldParent);
			} else if (oldParent) {
				container.appendChild(oldParent.container);
				oldParent.container.setAttribute('data-status', 'hide');
				container.appendChild(oldParent.groupContainer);
			}
			if (emitEvent) {
				main_core_events.EventEmitter.emit(this, Options.eventName('onHiddenBlockIsNotEmpty'));
			}
			this.#recalculateCounters(item);
			this.#saveItemsSort({
				action: 'hideItem',
				itemId: item.getId()
			});
		}
		#recalculateCounters(item) {
			let counterValue = 0;
			const counter = ui_cnt.Counter.initFromCounterNode(item.container.querySelector(`.${ui_cnt.Counter.BaseClassname}`));
			if (counter) {
				counterValue = counter.getRealValue();
			}
			if (counterValue <= 0) {
				return;
			}
			[...this.items.entries()].forEach(([id, itemGroup]) => {
				if (itemGroup instanceof ItemGroup) {
					itemGroup.updateCounter();
				}
			});
			let hiddenCounterValue = 0;
			[...this.parentContainer.querySelectorAll(`.menu-item-block[data-status="hide"][data-role='item']`)].forEach(node => {
				const hiddenMenuItemCounter = ui_cnt.Counter.initFromCounterNode(node.querySelector(`.${ui_cnt.Counter.BaseClassname}`));
				if (hiddenMenuItemCounter) {
					hiddenCounterValue += hiddenMenuItemCounter.getRealValue();
				}
			});
			ui_cnt.Counter.updateCounterNodeValue(ui_cnt.Counter.initFromCounterNode(this.parentContainer.querySelector('#menu-hidden-counter')), hiddenCounterValue);
			main_core_events.EventEmitter.emit(this, Options.eventName('onHiddenCounterUpdated'));
		}
		#refreshActivity(item, oldParent) {
			if (this.getActiveItem() !== item) {
				return;
			}
			const newParent = this.#getParentItemFor(item);
			if (oldParent !== newParent) {
				if (oldParent instanceof ItemGroup) {
					oldParent.markAsInactive();
				}
				if (newParent instanceof ItemGroup) {
					newParent.markAsActive();
				}
			}
		}
		#updateCountersLastValue = null;
		updateCounters(counters, send) {
			const countersDynamic = {};
			send = send !== false;
			[...Object.entries(counters)].forEach(([counterId, counterValue]) => {
				[...this.#getItemsByCounterId(counterId)].forEach(item => {
					const {
						oldValue,
						newValue
					} = item.updateCounter(counterValue);
					const state = item.container.getAttribute('data-status');
					if ((counterId.indexOf('crm_') < 0 || counterId.indexOf('crm_all') >= 0) && (counterId.indexOf('tasks_') < 0 || counterId.indexOf('tasks_total') >= 0)) {
						countersDynamic[state] = countersDynamic[state] || 0;
						countersDynamic[state] += newValue - oldValue;
					}
					let parentItem = this.#getParentItemFor(item);
					while (parentItem) {
						parentItem.updateCounter();
						parentItem = this.#getParentItemFor(parentItem);
					}
				});
				if (send) {
					BX.localStorage.set('lmc-' + counterId, counterValue, 5);
				}
			});
			if (countersDynamic['hide'] !== undefined && countersDynamic['hide'] !== 0) {
				const hiddenCounterNode = this.parentContainer.querySelector('#menu-hidden-counter');
				hiddenCounterNode.dataset.counterValue = Math.max(0, Number(hiddenCounterNode.dataset.counterValue) + Number(countersDynamic['hide']));
				if (hiddenCounterNode.dataset.counterValue > 0) {
					hiddenCounterNode.classList.remove('menu-hidden-counter');
					hiddenCounterNode.innerHTML = hiddenCounterNode.dataset.counterValue > 99 ? '99+' : hiddenCounterNode.dataset.counterValue;
				} else {
					hiddenCounterNode.classList.add('menu-hidden-counter');
					hiddenCounterNode.innerHTML = '';
				}
				main_core_events.EventEmitter.emit(this, Options.eventName('onHiddenCounterUpdated'));
			}
			if (typeof BXIM !== 'undefined') {
				if (this.#updateCountersLastValue === null) {
					this.#updateCountersLastValue = 0;
					[...this.items.entries()].forEach(([id, item]) => {
						if (item instanceof ItemGroup) {
							return;
						}
						const res = item.getCounterValue();
						if (res > 0) {
							let counterId = 'doesNotMatter';
							if (id.indexOf('menu_crm') >= 0 || id.indexOf('menu_tasks') >= 0) {
								const counterNode = item.container.querySelector(`.${ui_cnt.Counter.BaseClassname}`);
								if (counterNode) {
									counterId = counterNode.id;
								}
							}
							if (counterId === 'doesNotMatter' || counterId.indexOf('crm_all') >= 0 || counterId.indexOf('tasks_total') >= 0) {
								this.#updateCountersLastValue += res;
							}
						}
					});
				} else {
					this.#updateCountersLastValue += countersDynamic['show'] !== undefined ? countersDynamic['show'] : 0;
					this.#updateCountersLastValue += countersDynamic['hide'] !== undefined ? countersDynamic['hide'] : 0;
				}
				const visibleValue = this.#updateCountersLastValue > 99 ? '99+' : this.#updateCountersLastValue < 0 ? '0' : this.#updateCountersLastValue;
				const DesktopApi = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopApi');
				if (DesktopApi && DesktopApi.isDesktop()) {
					DesktopApi.setBrowserIconBadge(visibleValue);
				}
			}
			[...this.items.entries()].forEach(([id, itemGroup]) => {
				if (itemGroup instanceof ItemGroup) {
					itemGroup.updateCounter();
				}
			});
		}
		decrementCounter(counters) {
			[...Object.entries(counters)].forEach(([counterId, counterValue]) => {
				const item = this.#getItemsByCounterId(counterId).shift();
				if (item) {
					const value = item.getCounterValue();
					counters[counterId] = value > counterValue ? value - counterValue : 0;
				} else {
					delete counters[counterId];
				}
			});
			this.updateCounters(counters, false);
		}
		#getItemsByCounterId(counterId) {
			const result = [];
			[...this.items.values()].forEach(item => {
				const counter = ui_cnt.Counter.initFromCounterNode(item.container.querySelector(`.${ui_cnt.Counter.BaseClassname}`));
				if (counter && counter.getId().includes(counterId)) {
					result.push(item);
				}
			});
			return result;
		}
		#getItemsToSave() {
			const saveSortItems = {
				show: [],
				hide: []
			};
			const customItems = [];
			let firstItemLink = null;
			['show', 'hide'].forEach(state => {
				let items = saveSortItems[state];
				let currentGroupId = null;
				const chain = [];
				Array.from(this.parentContainer.querySelectorAll(`.menu-item-block[data-status="${state}"]`)).forEach(node => {
					if (node.dataset.role === 'group') {
						const groupId = node.parentNode.hasAttribute('data-group-id') ? node.parentNode.getAttribute('data-group-id') : null;
						items = saveSortItems[state];
						let groupItem;
						while (groupItem = chain.pop()) {
							if (groupItem['group_id'] === groupId) {
								chain.push(groupItem);
								items = groupItem.items;
								break;
							}
						}
						const item = {
							group_id: node.dataset.id,
							items: []
						};
						items.push(item);
						chain.push(item);
						items = item.items;
						currentGroupId = node.dataset.id;
					} else {
						if ([ItemAdminCustom.code, ItemUserSelf.code, ItemUserFavorites.code].indexOf(node.getAttribute('data-type')) >= 0) {
							const item = {
								ID: node.getAttribute('data-id'),
								LINK: node.getAttribute('data-link'),
								TEXT: main_core.Text.decode(node.querySelector("[data-role='item-text']").innerHTML)
							};
							if (node.getAttribute("data-new-page") === "Y") {
								item.NEW_PAGE = "Y";
							}
							customItems.push(item);
						}
						if (firstItemLink === null && main_core.Type.isStringFilled(node.getAttribute("data-link"))) {
							firstItemLink = node.getAttribute("data-link");
						}
						if (node.closest(`[data-group-id="${currentGroupId}"][data-role="group-content"]`)) {
							items.push(node.dataset.id);
						} else {
							const groupId = node.parentNode.hasAttribute('data-group-id') ? node.parentNode.getAttribute('data-group-id') : null;
							items = saveSortItems[state];
							let groupItem;
							while (groupItem = chain.pop()) {
								if (groupItem['group_id'] === groupId) {
									chain.push(groupItem);
									items = groupItem.items;
									break;
								}
							}
							items.push(node.dataset.id);
						}
					}
				});
			});
			return {
				saveSortItems,
				firstItemLink,
				customItems
			};
		}
		#saveItemsSort(analyticsLabel) {
			const {
				saveSortItems,
				firstItemLink
			} = this.#getItemsToSave();
			Backend.saveItemsSort(saveSortItems, firstItemLink, analyticsLabel || {
				action: 'sortItem'
			});
		}
		addItem({
			node,
			animateFromPoint
		}) {
			if (!(node instanceof Element)) {
				return;
			}
			node.style.display;
			if (animateFromPoint) {
				node.dataset.styleDisplay = node.style.display;
				node.style.display = 'none';
			}
			if (this.items.has(node.dataset.id) && node.dataset.type === ItemUserFavorites.code) {
				const item = this.items.get(node.dataset.id);
				item.storage.push(ItemUserFavorites.code);
				item.container.dataset.storage = item.storage.join(',');
				node = item.container;
			} else {
				this.container.appendChild(node);
				this.registerItem(node);
				this.#saveItemsSort();
			}
			if (animateFromPoint) {
				this.#animateTopItemToLeft(node, animateFromPoint).then(() => {
					node.style.display = node.dataset.styleDisplay;
				});
			}
		}
		updateItem(data) {
			let {
				id
			} = data;
			if (this.items.has(id)) {
				this.items.get(id).update(data);
			}
		}
		deleteItem(item, {
			animate
		}) {
			this.items.delete(item.getId());
			this.#activeItem.checkAndUnset(item);
			if (item instanceof ItemUserFavorites || animate) {
				this.#animateTopItemFromLeft(item.container).then(() => {
					item.container.parentNode.removeChild(item.container);
					this.#saveItemsSort();
				});
			} else if (item.container) {
				item.container.parentNode.removeChild(item.container);
				this.#saveItemsSort();
			}
		}
		convertItem(item) {
			this.unregisterItem(item);
			this.registerItem(this.parentContainer.querySelector(`li.menu-item-block[data-id="${item.getId()}"]`));
		}
		getActiveItem() {
			return this.#activeItem.item;
		}
		#getParentItemFor(item) {
			if (!(item instanceof Item)) {
				return null;
			}
			const parentContainer = item.container.closest('[data-role="group-content"]');
			if (parentContainer && this.items.has(parentContainer.getAttribute('data-group-id'))) {
				return this.items.get(parentContainer.getAttribute('data-group-id'));
			}
			return null;
		}
		#canChangePaternity(item) {
			if (item instanceof ItemGroup) {
				return false;
			}
			const oldParent = this.#getParentItemFor(item);
			if (oldParent instanceof ItemGroup && item.container.parentNode.querySelectorAll('li.menu-item-block').length <= 1) {
				return false;
			}
			return true;
		}
		export() {
			return this.#getItemsToSave();
		}

		//region DropdownActions
		#openItemMenuPopup;
		openItemMenu(item, target, currentTarget) {
			if (currentTarget) {
				main_core.Dom.addClass(currentTarget, '--open');
			} else {
				main_core.Dom.addClass(target, '--open');
			}
			if (this.#openItemMenuPopup) {
				this.#openItemMenuPopup.close();
			}
			const contextMenuItems = [];
			// region hide/show item

			if (item instanceof ItemMainPage) {
				contextMenuItems.push({
					text: main_core.Loc.getMessage('MENU_OPEN_SETTINGS_MAIN_PAGE'),
					onclick: () => {
						item.openSettings();
					}
				});
			} else if (item.container.getAttribute("data-status") === "show") {
				contextMenuItems.push({
					text: main_core.Loc.getMessage("hide_item"),
					onclick: () => {
						this.hideItem(item);
					}
				});
			} else {
				contextMenuItems.push({
					text: main_core.Loc.getMessage("show_item"),
					onclick: (target, contextMenuItem) => {
						this.showItem(item);
					}
				});
			}
			//endregion

			//region set as main page
			if (!Options.isExtranet && !Options.isMainPageEnabled && !(item instanceof ItemUserSelf) && !(item instanceof ItemGroup) && this.container.querySelector('li.menu-item-block[data-role="item"]') !== item.container) {
				contextMenuItems.push({
					text: main_core.Loc.getMessage("MENU_SET_MAIN_PAGE"),
					onclick: () => {
						this.setItemAsAMainPage(item);
					}
				});
			}
			//endregion

			item.getDropDownActions().forEach(actionItem => {
				contextMenuItems.push(actionItem);
			});
			if (!(item instanceof ItemMainPage)) {
				contextMenuItems.push({
					text: this.#isEditMode ? main_core.Loc.getMessage("MENU_EDIT_READY_FULL") : main_core.Loc.getMessage("MENU_SETTINGS_MODE"),
					onclick: () => {
						this.#isEditMode ? this.switchToViewMode() : this.switchToEditMode();
					}
				});
			}
			contextMenuItems.forEach(item => {
				item['className'] = ["menu-popup-no-icon", item['className'] ?? ''].join(' ');
				const {
					onclick
				} = item;
				item['onclick'] = (event, item) => {
					item.getMenuWindow().close();
					onclick.call(event, item);
				};
			});
			const targetPosition = main_core.Dom.getPosition(target);
			this.#openItemMenuPopup = new main_popup.Menu({
				bindElement: {
					top: targetPosition.top - targetPosition.height,
					left: targetPosition.right
				},
				items: contextMenuItems,
				offsetTop: 0,
				offsetLeft: main_core.Dom.getPosition(target).width / 2,
				events: {
					onClose: () => {
						main_core_events.EventEmitter.emit(this, Options.eventName('onClose'));
						item.container.classList.remove('menu-item-block-hover');
						this.#openItemMenuPopup = null;
						if (currentTarget) {
							main_core.Dom.removeClass(currentTarget, '--open');
						} else {
							main_core.Dom.removeClass(target, '--open');
						}
					},
					onShow: () => {
						item.container.classList.add('menu-item-block-hover');
						main_core_events.EventEmitter.emit(this, Options.eventName('onShow'));
					}
				}
			});
			this.#openItemMenuPopup.show();
		}
		//endregion

		//region Visible sliding
		#animateTopItemToLeft(node, animateFromPoint) {
			return new Promise(resolve => {
				if (Utils.prefersReducedMotion()) {
					resolve();
					return;
				}
				let {
					startX,
					startY
				} = animateFromPoint;
				const topMenuNode = document.createElement('DIV');
				topMenuNode.style = `position: absolute; z-index: 1000; top: ${startY + 25}px;`;
				const cloneNode = node.cloneNode(true);
				cloneNode.style.display = node.dataset.styleDisplay;
				document.body.appendChild(topMenuNode);
				topMenuNode.appendChild(cloneNode);
				let finishY = this.hiddenContainer.getBoundingClientRect().top;
				new BX.easing({
					duration: 500,
					start: {
						left: startX
					},
					finish: {
						left: 30
					},
					transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
					step: function (state) {
						topMenuNode.style.left = state.left + "px";
					},
					complete: () => {
						new BX.easing({
							duration: 500,
							start: {
								top: startY + 25
							},
							finish: {
								top: finishY
							},
							transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
							step: function (state) {
								topMenuNode.style.top = state.top + "px";
							},
							complete: () => {
								main_core.Dom.remove(topMenuNode);
								resolve();
							}
						}).animate();
					}
				}).animate();
			});
		}
		#animateTopItemFromLeft(node) {
			return new Promise(resolve => {
				if (Utils.prefersReducedMotion()) {
					resolve();
					return;
				}
				new BX.easing({
					duration: 700,
					start: {
						left: node.offsetLeft,
						opacity: 1
					},
					finish: {
						left: 400,
						opacity: 0
					},
					transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
					step: function (state) {
						node.style.paddingLeft = state.left + "px";
						node.style.opacity = state.opacity;
					},
					complete: function () {
						resolve();
					}
				}).animate();
			});
		}
		//endregion

		/* region D&D */
		#registerDND(item) {
			//drag&drop
			jsDD.Enable();
			item.container.onbxdragstart = this.#menuItemDragStart.bind(this, item);
			item.container.onbxdrag = (x, y) => {
				this.#menuItemDragMove(/*item,*/x, y);
			};
			item.container.onbxdraghover = (dest, x, y) => {
				this.#menuItemDragHover(/*item, */dest, x, y);
			};
			item.container.onbxdragstop = this.#menuItemDragStop.bind(this, item);
			jsDD.registerObject(item.container);
		}
		#menuItemDragStart(item) {
			main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Bitrix24.LeftMenuClass:onDragStart');
			if (!(item instanceof ItemGroup) && item.container.parentNode.querySelectorAll('li.menu-item-block').length <= 1 && this.#getParentItemFor(item) !== null) {
				item = this.#getParentItemFor(item);
			}
			main_core_events.EventEmitter.emit(this, Options.eventName('onDragModeOn'));
			this.dnd = {
				container: this.container.parentNode,
				itemDomBlank: main_core.Dom.create('div', {
					style: {
						display: 'none'
						// border: '2px solid navy'
					}
				}),
				itemMoveBlank: main_core.Dom.create('div', {
					style: {
						height: item.container.offsetHeight + 'px'
						// border: '2px solid red',
					}
				}),
				draggableBlock: main_core.Dom.create('div', {
					//div to move
					attrs: {
						className: "menu-draggable-wrap"
					},
					style: {
						top: [item.container.offsetTop - item.container.offsetHeight, 'px'].join('')
						// border: '2px solid black'
					}
				}),
				item: item,
				oldParent: this.#getParentItemFor(item),
				isHiddenContainerVisible: this.isHiddenContainerVisible()
			};
			this.#showHiddenContainer(false);
			const registerItems = () => {
				[...this.parentContainer.querySelectorAll('li.menu-item-block')].forEach(node => {
					if (item instanceof ItemGroup && this.#getParentItemFor(this.items.get(node.getAttribute('data-id'))) !== null) {
						return;
					}
					jsDD.registerDest(node, 100);
				});
				const firstNode = this.parentContainer.querySelector("#left-menu-empty-item");
				if (item instanceof ItemUserSelf) {
					jsDD.unregisterDest(firstNode);
				} else {
					jsDD.registerDest(firstNode, 100);
				}
				jsDD.registerDest(this.parentContainer.querySelector("#left-menu-hidden-empty-item"), 100);
				jsDD.registerDest(this.parentContainer.querySelector("#left-menu-hidden-separator"), 100);
			};
			if (item instanceof ItemGroup) {
				item.collapse(true).then(() => {
					if (this.dnd) {
						this.dnd.pos = BX.pos(this.container.parentNode);
						registerItems();
					}
				});
			} else {
				registerItems();
			}
			const dragElement = item.container;
			main_core.Dom.addClass(this.dnd.container, "menu-drag-mode");
			main_core.Dom.addClass(dragElement, "menu-item-draggable");
			dragElement.parentNode.insertBefore(this.dnd.itemDomBlank, dragElement); //remember original item place
			dragElement.parentNode.insertBefore(this.dnd.itemMoveBlank, dragElement); //empty div
			this.dnd.draggableBlock.appendChild(item.container);
			this.dnd.container.style.position = 'relative';
			this.dnd.container.appendChild(this.dnd.draggableBlock);
			this.dnd.pos = BX.pos(this.container.parentNode);
		}
		#menuItemDragMove(/*item,*/x, y) {
			const item = this.dnd.item;
			var menuItemsBlockHeight = this.dnd.pos.height;
			y = Math.max(0, y - this.dnd.pos.top);
			this.dnd.draggableBlock.style.top = [Math.min(menuItemsBlockHeight - item.container.offsetHeight, y) - 5, 'px'].join('');
		}
		#menuItemDragHover(/*item, */dest, x, y) {
			const item = this.dnd.item;
			const dragElement = item.container;
			if (dest === dragElement) {
				this.dnd.itemDomBlank.parentNode.insertBefore(this.dnd.itemMoveBlank, this.dnd.itemDomBlank);
				return;
			}
			if (dest.id === "left-menu-empty-item" && (dragElement.getAttribute("data-type") === "self" || dragElement.getAttribute("data-disable-first-item") === "Y")) {
				return; // self-item cannot be moved on the first place
			}
			if (dest.getAttribute('data-role') === 'group') {
				const groupHolder = dest.parentNode.querySelector(`[data-group-id="${dest.getAttribute('data-id')}"]`);
				if (dest.getAttribute('data-collapse-mode') === 'collapsed') {
					main_core.Dom.insertAfter(this.dnd.itemMoveBlank, groupHolder);
				} else if (item instanceof ItemGroup) {
					main_core.Dom.insertBefore(this.dnd.itemMoveBlank, dest);
				} else {
					main_core.Dom.prepend(this.dnd.itemMoveBlank, groupHolder.querySelector('ul'));
				}
			} else if (this.dnd.container.contains(dest)) {
				let itemPlaceHolder = dest;
				if (item instanceof ItemGroup && dest.closest('[data-role="group-content"]')) {
					itemPlaceHolder = dest.closest('[data-role="group-content"]');
				}
				main_core.Dom.insertAfter(this.dnd.itemMoveBlank, itemPlaceHolder);
			}
		}
		#menuItemDragStop(/*item*/
		) {
			const item = this.dnd.item;
			const oldParent = this.dnd.oldParent;
			const dragElement = item.container;
			main_core.Dom.removeClass(this.dnd.container, "menu-drag-mode");
			main_core.Dom.removeClass(dragElement, "menu-item-draggable");
			this.dnd.container.style.position = '';
			let error = null;
			let onHiddenBlockIsEmptyEmitted = false;
			if (this.parentContainer.querySelector('.menu-item-block') === item.container) {
				if (item instanceof ItemUserSelf) {
					error = main_core.Loc.getMessage('MENU_SELF_ITEM_FIRST_ERROR');
				} else if (item.container.getAttribute("data-disable-first-item") === "Y") {
					error = main_core.Loc.getMessage("MENU_FIRST_ITEM_ERROR");
				}
			}
			if (error !== null) {
				this.dnd.itemDomBlank.parentNode.replaceChild(dragElement, this.dnd.itemDomBlank);
				item.showMessage(error);
			} else if (!this.dnd.container.contains(this.dnd.itemMoveBlank)) {
				this.dnd.itemDomBlank.parentNode.replaceChild(dragElement, this.dnd.itemDomBlank);
			} else {
				try {
					this.dnd.itemMoveBlank.parentNode.replaceChild(dragElement, this.dnd.itemMoveBlank);
					if (this.hiddenContainer.contains(dragElement)) {
						item.container.setAttribute("data-status", "hide");
						if (this.dnd.itemDomBlank.closest('#left-menu-hidden-items-block') === null && this.hiddenContainer.querySelectorAll('.menu-item-block').length === 1) {
							main_core_events.EventEmitter.emit(this, Options.eventName('onHiddenBlockIsNotEmpty'));
						}
					} else {
						item.container.setAttribute("data-status", "show");
						if (this.hiddenContainer.querySelectorAll('.menu-item-block').length <= 0) {
							onHiddenBlockIsEmptyEmitted = true;
							main_core_events.EventEmitter.emit(this, Options.eventName('onHiddenBlockIsEmpty'));
						}
					}
					if (item instanceof ItemGroup) {
						item.checkAndCorrect().expand(true);
					}
					this.#refreshActivity(item, oldParent);
					this.#recalculateCounters(item);
					const analyticsLabel = {
						action: 'sortItem'
					};
					if (this.parentContainer.querySelector('.menu-item-block') === item.container && !this.isExtranet) {
						item.showMessage(main_core.Loc.getMessage("MENU_ITEM_MAIN_PAGE"));
						analyticsLabel.action = 'mainPage';
						analyticsLabel.itemId = item.getId();
					}
					this.#saveItemsSort(analyticsLabel);
				} catch (e) {
					this.dnd.itemDomBlank.parentNode.replaceChild(dragElement, this.dnd.itemDomBlank);
				}
			}
			main_core.Dom.remove(this.dnd.draggableBlock);
			main_core.Dom.remove(this.dnd.itemDomBlank);
			main_core.Dom.remove(this.dnd.itemMoveBlank);
			jsDD.enableDest(dragElement);
			this.container.style.position = 'static';
			if (!this.dnd.isHiddenContainerVisible || onHiddenBlockIsEmptyEmitted === true) {
				this.#hideHiddenContainer(false);
			}
			delete this.dnd;
			[...this.parentContainer.querySelectorAll('li.menu-item-block')].forEach(node => {
				jsDD.registerDest(node);
			});
			const firstNode = this.parentContainer.querySelector("#left-menu-empty-item");
			jsDD.unregisterDest(firstNode);
			jsDD.unregisterDest(this.parentContainer.querySelector("#left-menu-hidden-empty-item"));
			jsDD.unregisterDest(this.parentContainer.querySelector("#left-menu-hidden-separator"));
			jsDD.refreshDestArea();
			main_core_events.EventEmitter.emit(this, Options.eventName('onDragModeOff'));
		}
		/*endregion*/
	}

	class ItemDirector extends DefaultController {
		constructor(container, params) {
			super(container, params);
		}
		saveCurrentPage(page) {
			return ItemUserFavorites.saveCurrentPage(page).then(data => {
				main_core_events.EventEmitter.emit(this, Options.eventName('onItemHasBeenAdded'), data);
				return data;
			}).catch(Utils.catchError);
		}
		saveStandardPage(topItem) {
			return ItemUserFavorites.saveStandardPage(topItem).then(data => {
				main_core_events.EventEmitter.emit(this, Options.eventName('onItemHasBeenAdded'), data);
				return data;
			}).catch(Utils.catchError);
		}
		deleteCurrentPage({
			pageLink
		}) {
			return ItemUserFavorites.deleteCurrentPage({
				pageLink
			}).then(data => {
				main_core_events.EventEmitter.emit(this, Options.eventName('onItemHasBeenDeleted'), data);
				return data;
			}).catch(Utils.catchError);
		}
		deleteStandardPage(topItem) {
			return ItemUserFavorites.deleteStandardPage(topItem).then(data => {
				main_core_events.EventEmitter.emit(this, Options.eventName('onItemHasBeenDeleted'), data);
				return data;
			}).catch(Utils.catchError);
		}
		showAddToSelf(bindElement) {
			ItemUserSelf.showAdd(bindElement).then(data => {
				main_core_events.EventEmitter.emit(this, Options.eventName('onItemHasBeenAdded'), data);
			}).catch(Utils.catchError);
		}
	}

	class Analytics {
		#isAdmin;
		constructor(isAdmin) {
			this.#isAdmin = isAdmin ? AnalyticUserRole.ADMIN : AnalyticUserRole.NOT_ADMIN;
		}
		sendSetCustomPreset() {
			this.#sendData({
				tool: AnalyticTool,
				category: AnalyticCategory.MENU,
				event: AnalyticEvent.SET,
				type: 'custom',
				c_section: AnalyticSection.MENU,
				p1: this.#isAdmin
			});
		}
		sendSetPreset(presetId, isPersonal, action) {
			this.#sendData({
				type: presetId,
				event: isPersonal ? AnalyticEvent.CHANGE : AnalyticEvent.SELECT,
				tool: AnalyticTool,
				category: isPersonal ? AnalyticCategory.MENU : AnalyticCategory.TOOL,
				c_section: isPersonal ? AnalyticSection.MENU : AnalyticSection.POPUP,
				c_element: action,
				p1: this.#isAdmin
			});
		}
		sendClose() {
			this.#sendData({
				event: AnalyticEvent.SHOW,
				tool: AnalyticTool,
				category: AnalyticCategory.TOOL,
				c_section: AnalyticSection.POPUP
			});
		}
		#sendData(data) {
			main_core.Runtime.loadExtension('ui.analytics').then(exports$1 => {
				exports$1.sendData(data);
			}).catch(err => {
				console.error(err);
			});
		}
	}
	const AnalyticCategory = {
		TOOL: 'main_tool',
		MENU: 'main_menu'
	};
	const AnalyticEvent = {
		SHOW: 'window_show',
		SELECT: 'select',
		CHANGE: 'change',
		SET: 'menu_set'
	};
	const AnalyticUserRole = {
		ADMIN: 'isAdmin_Y',
		NOT_ADMIN: 'isAdmin_N'
	};
	const AnalyticSection = {
		POPUP: 'menu_popup',
		MENU: 'main_menu'
	};
	const AnalyticActions = {
		CONFIRM: 'confirm',
		LATER: 'later',
		CLOSE: 'close'};
	const AnalyticTool = 'intranet';

	class GroupPanel {
		#refs = new main_core_cache.MemoryCache();
		#status = 'initial';
		#xhr = null;
		#isExtranetInstalled = true;
		constructor(options) {
			const groupsLink = document.getElementById('menu-all-groups-link');
			main_core.Event.bind(groupsLink, 'click', this.#handleGroupsLinkClick.bind(this));
			this.#isExtranetInstalled = main_core.Type.isBoolean(options.isExtranetInstalled) ? options.isExtranetInstalled : this.#isExtranetInstalled;
		}
		getContainer() {
			return this.#refs.remember('container', () => {
				return main_core.Tag.render`
				<div class="group-panel-content">
					<div class="group-panel-header">
						${this.getFilterContainer()}
					</div>
					${this.getItemsContainer()}
				</div>
			`;
			});
		}
		getItemsContainer() {
			return this.#refs.remember('items-container', () => {
				return main_core.Tag.render`
				<div class="group-panel-items"
					role="tabpanel"
					onclick="${this.#handleItemsClick.bind(this)}"
				></div>
			`;
			});
		}
		getFilterContainer() {
			return this.#refs.remember('filter-container', () => {
				const container = main_core.Tag.render`
				<span class="group-panel-header-filters" role="tablist"
					aria-label="${main_core.Loc.getMessagePlural('MENU_MY_WORKGROUPS')}"
				></span>
			`;
				const filters = [{
					filter: 'all',
					label: main_core.Loc.getMessage('MENU_MY_WORKGROUPS'),
					selected: true
				}, ...(this.#isExtranetInstalled ? [{
					filter: 'extranet',
					label: main_core.Loc.getMessage('MENU_MY_WORKGROUPS_EXTRANET')
				}] : []), {
					filter: 'favorites',
					label: main_core.Loc.getMessage('MENU_MY_WORKGROUPS_FAVORITES'),
					hasCounter: true
				}];
				filters.forEach(f => {
					const tab = main_core.Tag.render`
					<button type="button"
						class="group-panel-header-filter group-panel-header-filter-${f.filter}"
						role="tab"
						tabindex="${f.selected ? '0' : '-1'}"
						aria-selected="${f.selected ? 'true' : 'false'}"
						data-filter="${f.filter}"
					>${f.label}${f.hasCounter ? this.getCounterContainer() : ''}</button>
				`;
					main_core.Event.bind(tab, 'click', this.#handleFilterClick.bind(this));
					main_core.Event.bind(tab, 'keydown', this.#handleFilterKeydown.bind(this));
					main_core.Dom.append(tab, container);
				});
				return container;
			});
		}
		getCounterContainer() {
			return this.#refs.remember('counter-container', () => {
				return main_core.Tag.render`<span class="group-panel-header-filter-counter"></span>`;
			});
		}
		#handleGroupsLinkClick(event) {
			main_sidepanel.SidePanel.Instance.open('my-groups', {
				cacheable: false,
				contentCallback: () => {
					return main_core.Runtime.loadExtension('ui.sidepanel.layout').then(exports$1 => {
						const {
							Layout
						} = exports$1;
						return Layout.createContent({
							title: main_core.Loc.getMessage('MENU_MY_WORKGROUPS'),
							design: {
								section: true,
								margin: true
							},
							buttons: () => [],
							content: () => {
								if (this.#status === 'loaded') {
									return this.getContainer();
								}
								return this.#loadContent();
							}
						});
					});
				},
				events: {
					onClose: () => {
						if (this.#xhr && this.#status !== 'loaded') {
							this.#status = 'initial';
							this.#xhr.abort();
						}
					}
				}
			});
		}
		async #loadContent() {
			this.#status = 'loading';
			const response = await main_core.ajax.runAction('intranet.leftmenu.getGroups', {
				onrequeststart: xhr => {
					this.#xhr = xhr;
				}
			});
			const {
				groups,
				filter
			} = response.data;
			for (const group of groups) {
				const classes = ['group-panel-item'];
				classes.push(group.extranet ? 'group-panel-item-extranet' : 'group-panel-item-intranet');
				if (group.favorite) {
					classes.push('group-panel-item-favorite');
				}
				const dom = main_core.Tag.render`
				<a href="${encodeURI(group.url)}" 
					class="${classes.join(' ')}" 
					data-id="${group.id}" 
					data-slider-ignore-autobinding="true"
				>
					<span class="group-panel-item-text" title="${main_core.Text.encode(group.title)}">${main_core.Text.encode(group.title)}</span>
					<button type="button"
						class="group-panel-item-star"
						aria-label="${main_core.Loc.getMessage('MENU_TOGGLE_FAVORITE_ARIA')}"
						aria-pressed="${group.favorite ? 'true' : 'false'}"
					></button>
				</a>
			`;
				main_core.Dom.append(dom, this.getItemsContainer());
			}
			main_core.Dom.addClass(this.getContainer(), `group-panel-content-${filter}`);
			main_core.Dom.attr(this.getContainer(), {
				'data-filter': filter
			});
			this.#status = 'loaded';
			return this.getContainer();
		}
		#handleFilterClick(event) {
			const filterElement = event.target.closest('[role="tab"]') || event.target;
			const currentFilter = this.getContainer().dataset.filter || 'all';
			const newFilter = filterElement.dataset.filter || 'all';
			if (currentFilter !== newFilter) {
				this.getContainer().dataset.filter = newFilter;
				this.saveFilter(newFilter);
				const tabs = this.getFilterContainer().querySelectorAll('[role="tab"]');
				tabs.forEach(tab => {
					const isSelected = tab.dataset.filter === newFilter;
					main_core.Dom.attr(tab, 'aria-selected', String(isSelected));
					main_core.Dom.attr(tab, 'tabindex', isSelected ? '0' : '-1');
				});
				if (Utils.prefersReducedMotion()) {
					main_core.Dom.removeClass(this.getContainer(), `group-panel-content-${currentFilter}`);
					main_core.Dom.addClass(this.getContainer(), `group-panel-content-${newFilter}`);
				} else {
					new BX.easing({
						duration: 50,
						start: {
							opacity: 1
						},
						finish: {
							opacity: 0
						},
						transition: BX.easing.transitions.linear,
						step: state => {
							main_core.Dom.style(this.getItemsContainer(), 'opacity', state.opacity / 100);
						},
						complete: () => {
							main_core.Dom.removeClass(this.getContainer(), `group-panel-content-${currentFilter}`);
							main_core.Dom.addClass(this.getContainer(), `group-panel-content-${newFilter}`);
							new BX.easing({
								duration: 50,
								start: {
									opacity: 0
								},
								finish: {
									opacity: 1
								},
								transition: BX.easing.transitions.linear,
								step: state => {
									main_core.Dom.style(this.getItemsContainer(), 'opacity', state.opacity / 100);
								},
								complete: () => {
									main_core.Dom.style(this.getItemsContainer(), 'opacity', null);
								}
							}).animate();
						}
					}).animate();
				}
			}
			event.stopPropagation();
		}
		#handleFilterKeydown(event) {
			const tabs = [...this.getFilterContainer().querySelectorAll('[role="tab"]')];
			const currentIndex = tabs.indexOf(event.target);
			let newIndex = currentIndex;
			switch (event.key) {
				case 'ArrowRight':
				case 'ArrowDown':
					{
						event.preventDefault();
						newIndex = (currentIndex + 1) % tabs.length;
						break;
					}
				case 'ArrowLeft':
				case 'ArrowUp':
					{
						event.preventDefault();
						newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
						break;
					}
				case 'Home':
					{
						event.preventDefault();
						newIndex = 0;
						break;
					}
				case 'End':
					{
						event.preventDefault();
						newIndex = tabs.length - 1;
						break;
					}
				default:
					{
						return;
					}
			}
			tabs.forEach((tab, i) => {
				main_core.Dom.attr(tab, 'tabindex', i === newIndex ? '0' : '-1');
				main_core.Dom.attr(tab, 'aria-selected', i === newIndex ? 'true' : 'false');
			});
			tabs[newIndex].focus();
			tabs[newIndex].click();
		}
		#handleItemsClick(event) {
			if (!main_core.Dom.hasClass(event.target, 'group-panel-item-star')) {
				return;
			}
			const star = event.target;
			const item = star.parentNode;
			const groupId = item.dataset.id;
			const action = main_core.Dom.hasClass(item, 'group-panel-item-favorite') ? 'removeFromFavorites' : 'addToFavorites';
			main_core.Dom.toggleClass(item, 'group-panel-item-favorite');
			const isFav = main_core.Dom.hasClass(item, 'group-panel-item-favorite');
			main_core.Dom.attr(star, 'aria-pressed', String(isFav));
			this.#animateStart(star);
			this.#animateCounter(action === 'addToFavorites');
			void main_core.ajax.runAction(`intranet.leftmenu.${action}`, {
				data: {
					groupId
				}
			});
			event.preventDefault();
		}
		#animateStart(star) {
			if (Utils.prefersReducedMotion()) {
				return;
			}
			const flyingStar = star.cloneNode();
			main_core.Dom.style(flyingStar, 'margin-left', `-${star.offsetWidth}px`);
			main_core.Dom.append(flyingStar, star.parentNode);
			new BX.easing({
				duration: 200,
				start: {
					opacity: 100,
					scale: 100
				},
				finish: {
					opacity: 0,
					scale: 300
				},
				step: state => {
					main_core.Dom.style(flyingStar, 'transform', `scale(${state.scale / 100})`);
					main_core.Dom.style(flyingStar, 'opacity', state.opacity / 100);
				},
				complete: () => {
					flyingStar.parentNode.removeChild(flyingStar);
				}
			}).animate();
		}
		#animateCounter(positive) {
			if (Utils.prefersReducedMotion()) {
				return;
			}
			this.getCounterContainer().innerHTML = positive === false ? '-1' : '+1';
			new BX.easing({
				duration: 400,
				start: {
					opacity: 100,
					top: 0
				},
				finish: {
					opacity: 0,
					top: -20
				},
				transition: BX.easing.transitions.linear,
				step: state => {
					main_core.Dom.style(this.getCounterContainer(), 'top', `${state.top}px`);
					main_core.Dom.style(this.getCounterContainer(), 'opacity', state.opacity / 100);
				},
				complete: () => {
					main_core.Dom.style(this.getCounterContainer(), 'top', null);
					main_core.Dom.style(this.getCounterContainer(), 'opacity', null);
				}
			}).animate();
		}
		saveFilter(filter) {
			void main_core.ajax.runAction('intranet.leftmenu.setGroupFilter', {
				data: {
					filter
				}
			});
		}
	}

	class Menu {
		cache = new main_core.Cache.MemoryCache();
		scrollModeThreshold = 20; //
		lastScrollOffset = 0;
		slidingModeTimeoutId = 0;
		isMenuMouseEnterBlocked = false;
		isMenuMouseLeaveBlocked = [];
		isCollapsedMode = false;

		// Responsive auto-collapse: forced by narrow viewport
		isResponsiveCollapsed = false;
		wasExpandedBeforeResponsive = false;
		narrowViewportQuery = null;
		constructor(params) {
			this.menuContainer = document.getElementById("menu-items-block");
			if (!this.menuContainer) {
				return;
			}
			params = typeof params === "object" ? params : {};
			Options.isExtranet = params.isExtranet === 'Y';
			Options.isMainPageEnabled = params.isMainPageEnabled === 'Y';
			Options.isAdmin = params.isAdmin;
			Options.isCustomPresetRestricted = params.isCustomPresetAvailable !== 'Y';
			Options.availablePresetTools = params.availablePresetTools;
			Options.settingsPath = params.settingsPath;
			Options.inviteDialogLink = params.inviteDialogLink;
			Options.showMarta = params.showMarta;
			Options.showSitemapMenuItem = params.showSitemapMenuItem;
			Options.showLicenseButton = params.showLicenseButton;
			Options.licenseButtonPath = params.licenseButtonPath;
			Options.isMessengerEmbedded = params.isMessengerEmbedded === 'Y';
			this.isCollapsedMode = params.isCollapsedMode;
			this.analytics = new Analytics(params.isAdmin);
			this.initAndBindNodes();
			this.bindEvents();
			this.getItemsController();
			this.#addLicenseButton();
			this.groupPanel = new GroupPanel({
				isExtranetInstalled: params.isExtranetInstalled !== 'N'
			});
			this.initResponsiveCollapse();

			// Emulate document scroll because init() can be invoked after page load scroll
			// (a hard reload with script at the bottom).
			// this.handleDocumentScroll();
		}
		initAndBindNodes() {
			this.menuContainer.addEventListener("dblclick", this.handleMenuDoubleClick.bind(this));
			this.menuContainer.addEventListener("mouseenter", this.handleMenuMouseEnter.bind(this));
			this.menuContainer.addEventListener("mouseleave", this.handleMenuMouseLeave.bind(this));
			this.menuContainer.addEventListener("transitionend", this.handleSlidingTransitionEnd.bind(this));
			this.menuHeader = this.menuContainer.querySelector(".menu-items-header");
			this.menuBody = this.menuContainer.querySelector(".menu-items-body");
			this.menuItemsBlock = this.menuContainer.querySelector(".menu-items");

			// document.addEventListener("scroll", this.handleDocumentScroll.bind(this));

			this.mainTable = document.querySelector(".js-app");
			this.menuHeaderBurger = this.menuHeader.querySelector(".menu-switcher");
			this.menuHeaderBurger.addEventListener('click', this.handleBurgerClick.bind(this));
			this.menuHeader.querySelector(".menu-items-header-title").addEventListener('click', this.handleBurgerClick.bind(this, true));

			// this.upButton = this.menuContainer.querySelector(".menu-btn-arrow-up");
			// this.upButton.addEventListener("click", this.handleUpButtonClick.bind(this));
			this.menuMoreButton = this.menuContainer.querySelector(".menu-item-block.menu-expand");
			this.menuMoreButton = this.menuContainer.querySelector('[data-role="expand-menu-item"]');
			this.menuMoreButton.addEventListener("click", this.handleShowHiddenClick.bind(this));
			const siteMapItem = this.menuContainer.querySelector(".menu-sitemap-btn");
			if (siteMapItem) {
				siteMapItem.addEventListener('click', this.handleSiteMapClick.bind(this));
			}
			const settingsSaveBtn = this.menuContainer.querySelector(".menu-settings-save-btn");
			if (settingsSaveBtn) {
				settingsSaveBtn.addEventListener('click', this.handleViewMode.bind(this));
			}

			// this.menuContainer.querySelector(".menu-settings-btn")?.addEventListener('click', () => {
			// 	this.getSettingsController().show();
			// });
			this.menuContainer.querySelector('[data-role="menu-settings-item"]')?.addEventListener('click', () => {
				this.getSettingsController().show();
			});
		}

		// region Controllers
		getItemsController() {
			return this.cache.remember('itemsController', () => {
				return new ItemsController(this.menuContainer, {
					events: {
						EditMode: () => {
							this.toggle(true);
							this.menuContainer.classList.add('menu-items-edit-mode');
							this.menuContainer.classList.remove('menu-items-view-mode');
						},
						ViewMode: () => {
							this.toggle(true);
							this.menuContainer.classList.add('menu-items-view-mode');
							this.menuContainer.classList.remove('menu-items-edit-mode');
						},
						onDragModeOn: ({
							target
						}) => {
							this.switchToSlidingMode(true);
							this.isMenuMouseLeaveBlocked.push('drag');
						},
						onDragModeOff: ({
							target
						}) => {
							this.isMenuMouseLeaveBlocked.pop();
						},
						onHiddenBlockIsVisible: this.onHiddenBlockIsVisible.bind(this),
						onHiddenBlockIsHidden: this.onHiddenBlockIsHidden.bind(this),
						onHiddenBlockIsEmpty: this.onHiddenBlockIsEmpty.bind(this),
						onHiddenBlockIsNotEmpty: this.onHiddenBlockIsNotEmpty.bind(this),
						onHiddenCounterUpdated: this.onHiddenCounterUpdated.bind(this),
						onShow: () => {
							this.isMenuMouseLeaveBlocked.push('items');
						},
						onClose: () => {
							this.isMenuMouseLeaveBlocked.pop();
						}
					}
				});
			});
		}
		getItemDirector() {
			return this.cache.remember('itemsCreator', () => {
				return new ItemDirector(this.menuContainer, {
					events: {
						onItemHasBeenAdded: ({
							data
						}) => {
							this.getItemsController().addItem(data);
						}
					}
				});
			});
		}
		getSettingsController() {
			return this.cache.remember('presetController', () => {
				const node = this.menuContainer.querySelector('[data-role="menu-settings-item"]');
				if (!node) {
					return null;
				}
				return new SettingsController(node, {
					events: {
						onGettingSettingMenuItems: this.onGettingSettingMenuItems.bind(this),
						onShow: () => {
							this.isMenuMouseLeaveBlocked.push('settings');
						},
						onClose: () => {
							this.isMenuMouseLeaveBlocked.pop();
						}
					}
				});
			});
		}
		getCustomPresetController() {
			return this.cache.remember('customPresetController', () => {
				return new PresetCustomController(this.menuContainer, {
					events: {
						onPresetIsSet: ({
							data
						}) => {
							const {
								saveSortItems,
								firstItemLink,
								customItems
							} = this.getItemsController().export();
							if (!data) {
								this.analytics.sendSetCustomPreset();
							}
							return Backend.setCustomPreset(data, saveSortItems, customItems, firstItemLink);
						},
						onShow: () => {
							this.isMenuMouseLeaveBlocked.push('presets');
						},
						onClose: () => {
							this.isMenuMouseLeaveBlocked.pop();
						}
					}
				});
			});
		}
		getDefaultPresetController() {
			let closeEventWasProcessed = false;
			const postponeHandler = mode => {
				const result = Backend.postponeSystemPreset(mode);
				main_core_events.EventEmitter.emit(this, Options.eventName('onPresetIsPostponed'));
				return result;
			};
			return this.cache.remember('defaultPresetController', () => {
				const presetController = new PresetDefaultController(this.menuContainer, {
					events: {
						onPresetIsSet: ({
							data: {
								mode,
								presetId
							}
						}) => {
							this.analytics.sendSetPreset(presetId, mode === 'personal', AnalyticActions.CONFIRM);
							closeEventWasProcessed = true;
							return Backend.setSystemPreset(mode, presetId);
						},
						onPresetIsPostponed: ({
							data: {
								mode
							}
						}) => {
							this.analytics.sendSetPreset(presetController.getSelectedPreset(), mode === 'personal', AnalyticActions.LATER);
							closeEventWasProcessed = true;
							return postponeHandler(mode);
						},
						onShow: () => {
							this.analytics.sendClose();
						},
						onClose: () => {
							if (closeEventWasProcessed !== true) {
								this.analytics.sendSetPreset(presetController.getSelectedPreset(), presetController.getMode() === 'personal', AnalyticActions.CLOSE);
								postponeHandler(presetController.getMode());
							}
							closeEventWasProcessed = false;
						}
					}
				});
				return presetController;
			});
		}
		// endregion

		bindEvents() {
			// All Counters from IM
			main_core_events.EventEmitter.subscribe('onImUpdateCounter', event => {
				const [counters] = event.getCompatData();
				this.updateCounters(counters, false);
			});

			// Messenger counter
			main_core_events.EventEmitter.subscribe('onImUpdateCounterMessage', event => {
				const [counter] = event.getCompatData();
				this.updateCounters({
					'im-message': counter
				}, false);
			});

			// Live Feed Counter
			main_core_events.EventEmitter.subscribe('onCounterDecrement', event => {
				const [decrement] = event.getCompatData();
				this.decrementCounter(document.getElementById('menu-counter-live-feed'), decrement);
			});

			// All Counters
			main_core_events.EventEmitter.subscribe('onPullEvent-main', event => {
				const [command, params] = event.getCompatData();
				if (command === 'user_counter' && params[main_core.Loc.getMessage('SITE_ID')]) {
					const counters = {
						...params[main_core.Loc.getMessage('SITE_ID')]
					};
					this.updateCounters(counters, false);
				}
			});

			// just to hold opened menu in collapsing mode when groups are shown
			BX.addCustomEvent("BX.Bitrix24.GroupPanel:onOpen", this.handleGroupPanelOpen.bind(this));
			BX.addCustomEvent("BX.Bitrix24.GroupPanel:onClose", this.handleGroupPanelClose.bind(this));

			// region Top menu integration
			BX.addCustomEvent('BX.Main.InterfaceButtons:onFirstItemChange', (firstPageLink, firstNode) => {
				if (!firstPageLink || !main_core.Type.isDomNode(firstNode)) {
					return;
				}
				const topMenuId = firstNode.getAttribute('data-top-menu-id');
				const leftMenuNode = this.menuBody.querySelector(`[data-top-menu-id="${topMenuId}"]`);
				if (leftMenuNode) {
					leftMenuNode.setAttribute('data-link', firstPageLink);
					const leftMenuLink = leftMenuNode.querySelector('a.menu-item-link');
					if (leftMenuLink) {
						leftMenuLink.setAttribute('href', firstPageLink);
					}
					if (leftMenuNode.previousElementSibling === this.menuContainer.querySelector('#left-menu-empty-item')) {
						Backend.setFirstPage(firstPageLink);
					} else {
						Backend.clearCache();
					}
				}
				this.showMessage(firstNode, main_core.Loc.getMessage('MENU_ITEM_MAIN_SECTION_PAGE'));
			});
			BX.addCustomEvent('BX.Main.InterfaceButtons:onHideLastVisibleItem', bindElement => {
				this.showMessage(bindElement, main_core.Loc.getMessage('MENU_TOP_ITEM_LAST_HIDDEN'));
			});

			// when we edit top menu item
			BX.addCustomEvent('BX.Main.InterfaceButtons:onBeforeCreateEditMenu', (contextMenu, dataItem, topMenu) => {
				let item = this.#getLeftMenuItemByTopMenuItem(dataItem);
				if (!item && dataItem && main_core.Type.isStringFilled(dataItem.URL) && !dataItem.URL.match(/javascript:/)) {
					contextMenu.addMenuItem({
						text: main_core.Loc.getMessage('MENU_ADD_TO_LEFT_MENU'),
						onclick: (event, item) => {
							this.getItemDirector().saveStandardPage(dataItem);
							item.getMenuWindow().close();
						}
					});
				} else if (item instanceof ItemUserFavorites) {
					contextMenu.addMenuItem({
						text: main_core.Loc.getMessage('MENU_DELETE_FROM_LEFT_MENU'),
						onclick: (event, item) => {
							this.getItemDirector().deleteStandardPage(dataItem);
							item.getMenuWindow().close();
						}
					});
				}
			});
			// endregion

			// service event for UI.Toolbar
			top.BX.addCustomEvent('UI.Toolbar:onRequestMenuItemData', ({
				currentFullPath,
				context
			}) => {
				if (main_core.Type.isStringFilled(currentFullPath)) {
					BX.onCustomEvent('BX.Bitrix24.LeftMenuClass:onSendMenuItemData', [{
						currentPageInMenu: this.menuContainer.querySelector(`.menu-item-block[data-link="${currentFullPath}"]`),
						context
					}]);
				}
			});

			// When clicked on a start Favorites like
			main_core_events.EventEmitter.subscribe('UI.Toolbar:onStarClick', ({
				compatData: [params]
			}) => {
				if (params.isActive) {
					this.getItemDirector().deleteCurrentPage({
						context: params.context,
						pageLink: params.pageLink
					}).then(({
						itemInfo
					}) => {
						BX.onCustomEvent('BX.Bitrix24.LeftMenuClass:onMenuItemDeleted', [itemInfo, this]);
						BX.onCustomEvent('BX.Bitrix24.LeftMenuClass:onStandardItemChangedSuccess', [{
							isActive: false,
							context: params.context
						}]);
					});
				} else {
					this.getItemDirector().saveCurrentPage({
						pageTitle: params.pageTitle,
						pageLink: params.pageLink
					}).then(({
						itemInfo
					}) => {
						BX.onCustomEvent('BX.Bitrix24.LeftMenuClass:onMenuItemAdded', [itemInfo, this]);
						BX.onCustomEvent('BX.Bitrix24.LeftMenuClass:onStandardItemChangedSuccess', [{
							isActive: true,
							context: params.context
						}]);
					});
				}
			});
			main_core_events.EventEmitter.subscribe('BX.Main.InterfaceButtons:onBeforeResetMenu', ({
				compatData: [promises]
			}) => {
				promises.push(() => {
					const p = new BX.Promise();
					Backend.clearCache().then(() => {
						p.fulfill();
					}, response => {
						p.reject(`Error: ${response.errors[0].message}`);
					});
					return p;
				});
			});
		}
		isEditMode() {
			return this.getItemsController().isEditMode;
		}
		isCollapsed() {
			return this.isCollapsedMode;
		}
		showMessage(bindElement, message, position) {
			var popup = main_popup.PopupManager.create("left-menu-message", bindElement, {
				content: '<div class="left-menu-message-popup">' + message + '</div>',
				darkMode: true,
				offsetTop: position === "right" ? -45 : 2,
				offsetLeft: position === "right" ? 215 : 0,
				angle: position === "right" ? {
					position: "left"
				} : true,
				cacheable: false,
				autoHide: true,
				events: {
					onDestroy: function () {
						popup = null;
					}
				}
			});
			popup.show();
			setTimeout(function () {
				if (popup) {
					popup.close();
					popup = null;
				}
			}, 3000);
		}
		showError(bindElement) {
			this.showMessage(bindElement, main_core.Loc.getMessage('edit_error'));
		}
		showGlobalPreset() {
			const BannerDispatcher = main_core.Reflection.getClass('BX.UI.BannerDispatcher');
			if (BannerDispatcher) {
				this.addGlobalPresetToBannerDispatcher(BannerDispatcher);
			} else {
				main_core.Runtime.loadExtension('ui.banner-dispatcher').then(exports$1 => {
					this.addGlobalPresetToBannerDispatcher(exports$1.BannerDispatcher);
				}).catch(() => {});
			}
		}
		addGlobalPresetToBannerDispatcher(BannerDispatcher) {
			BannerDispatcher.high.toQueue(onDone => {
				const presetController = this.getDefaultPresetController();
				presetController.show('global');
				presetController.getPopup().subscribe('onAfterClose', event => {
					onDone();
				});
			});
		}
		handleShowHiddenClick() {
			this.getItemsController().toggleHiddenContainer(true);
		}
		onHiddenBlockIsVisible() {
			main_core.Dom.addClass(this.menuMoreButton, 'menu-favorites-more-btn-open');
			main_core.Dom.attr(this.menuMoreButton, 'aria-expanded', 'true');
			this.menuMoreButton.querySelector("#menu-more-btn-text").innerText = main_core.Loc.getMessage('more_items_hide');
			main_core.Dom.attr(this.menuMoreButton, 'aria-label', main_core.Loc.getMessage('more_items_hide'));
			this.#transferAriaCurrentFromMoreButton();
		}
		onHiddenBlockIsHidden() {
			main_core.Dom.removeClass(this.menuMoreButton, 'menu-favorites-more-btn-open');
			main_core.Dom.attr(this.menuMoreButton, 'aria-expanded', 'false');
			this.menuMoreButton.querySelector("#menu-more-btn-text").innerText = main_core.Loc.getMessage("more_items_show");
			this.#syncMoreButtonAriaLabel();
			this.#transferAriaCurrentToMoreButton();
		}
		#transferAriaCurrentFromMoreButton() {
			if (!this.menuMoreButton.hasAttribute('aria-current')) {
				return;
			}
			this.menuMoreButton.removeAttribute('aria-current');
			const hiddenBlock = this.menuContainer.querySelector('#left-menu-hidden-items-block');
			if (hiddenBlock) {
				const activeLink = hiddenBlock.querySelector('.menu-item-active .menu-item-link');
				main_core.Dom.attr(activeLink, 'aria-current', 'page');
			}
		}
		#transferAriaCurrentToMoreButton() {
			const hiddenBlock = this.menuContainer.querySelector('#left-menu-hidden-items-block');
			if (!hiddenBlock) {
				return;
			}
			const activeLink = hiddenBlock.querySelector('.menu-item-active .menu-item-link');
			if (activeLink) {
				main_core.Dom.attr(activeLink, 'aria-current', null);
				main_core.Dom.attr(this.menuMoreButton, 'aria-current', 'page');
			}
		}
		onHiddenCounterUpdated() {
			if (!main_core.Dom.hasClass(this.menuMoreButton, 'menu-favorites-more-btn-open')) {
				this.#syncMoreButtonAriaLabel();
			}
		}
		#syncMoreButtonAriaLabel() {
			const buttonText = main_core.Loc.getMessage('more_items_show');
			const counterNode = this.menuContainer.querySelector('#menu-hidden-counter');
			const counter = ui_cnt.Counter.initFromCounterNode(counterNode);
			const counterValue = counter ? counter.getRealValue() : 0;
			main_core.Dom.attr(this.menuMoreButton, 'aria-label', Item.getItemAriaLabel(buttonText, counterValue));
		}
		onHiddenBlockIsEmpty() {
			main_core.Dom.addClass(this.menuMoreButton, 'menu-favorites-more-btn-hidden');
		}
		onHiddenBlockIsNotEmpty() {
			main_core.Dom.removeClass(this.menuMoreButton, 'menu-favorites-more-btn-hidden');
		}
		setDefaultMenu() {
			ui_dialogs_messagebox.MessageBox.show({
				message: main_core.Loc.getMessage('MENU_SET_DEFAULT_CONFIRM'),
				onYes: (messageBox, button) => {
					button.setWaiting();
					Backend.setDefaultPreset().then(() => {
						button.setWaiting(false);
						messageBox.close();
						document.location.reload();
					});
				},
				buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_CANCEL
			});
		}
		clearCompositeCache() {
			main_core.ajax.runAction('intranet.leftmenu.clearCache', {
				data: {}
			});
		}
		#getLeftMenuItemByTopMenuItem({
			DATA_ID,
			NODE
		}) {
			let item = this.getItemsController().items.get(DATA_ID);
			if (!item) {
				const topMenuId = NODE.getAttribute('data-top-menu-id');
				if (NODE === NODE.parentNode.querySelector('[data-top-menu-id]')) {
					const leftMenuNode = this.menuItemsBlock.querySelector(`[data-top-menu-id="${topMenuId}"]`);
					if (leftMenuNode) {
						item = this.getItemsController().items.get(leftMenuNode.getAttribute('data-id'));
					}
				}
			}
			return item ?? null;
		}
		// region Events servicing functions
		onGettingSettingMenuItems() {
			const topPoint = ItemUserFavorites.getActiveTopMenuItem();
			let menuItemWithAddingToFavorites = null;
			if (topPoint) {
				const node = this.menuContainer.querySelector(`.menu-item-block[data-link="${topPoint['URL']}"]`);
				if (!node) {
					menuItemWithAddingToFavorites = {
						text: main_core.Loc.getMessage("MENU_ADD_TO_LEFT_MENU"),
						onclick: (event, item) => {
							this.getItemDirector().saveStandardPage(topPoint);
							item.getMenuWindow().destroy();
						}
					};
				} else if (node.getAttribute('data-type') === ItemUserFavorites.code) {
					menuItemWithAddingToFavorites = {
						text: main_core.Loc.getMessage("MENU_DELETE_FROM_LEFT_MENU"),
						onclick: (event, item) => {
							this.getItemDirector().deleteStandardPage(topPoint);
							item.getMenuWindow().destroy();
						}
					};
				} else {
					menuItemWithAddingToFavorites = {
						text: main_core.Loc.getMessage('MENU_DELETE_PAGE_FROM_LEFT_MENU'),
						className: 'menu-popup-disable-text',
						onclick: () => {}
					};
				}
			}
			const leftMenuSettingItems = [{
				text: main_core.Loc.getMessage('SORT_ITEMS'),
				onclick: () => {
					this.getItemsController().switchToEditMode();
				}
			}, {
				text: this.isCollapsed() ? main_core.Loc.getMessage('MENU_EXPAND') : main_core.Loc.getMessage('MENU_COLLAPSE'),
				onclick: (event, item) => {
					this.toggle();
					item.getMenuWindow().destroy();
				}
			}, menuItemWithAddingToFavorites, {
				text: main_core.Loc.getMessage('MENU_ADD_SELF_PAGE'),
				onclick: (event, item) => {
					this.getItemDirector().showAddToSelf(this.getSettingsController().getContainer());
				}
			}];

			//custom preset
			if (Options.isAdmin) {
				let itemText = main_core.Loc.getMessage('MENU_SAVE_CUSTOM_PRESET');
				if (Options.isCustomPresetRestricted) {
					itemText += "<span class='menu-lock-icon'></span>";
				}
				leftMenuSettingItems.push({
					html: itemText,
					className: Options.isCustomPresetRestricted ? ' menu-popup-disable-text' : '',
					onclick: (event, item) => {
						if (Options.isCustomPresetRestricted) {
							BX.UI.InfoHelper.show('limit_office_menu_to_all');
						} else {
							this.getCustomPresetController().show();
						}
					}
				});
			}
			if (!Options.isExtranet) {
				leftMenuSettingItems.push({
					text: main_core.Loc.getMessage('MENU_SET_DEFAULT'),
					onclick: this.setDefaultMenu.bind(this)
				});
			}
			const Messenger = main_core.Reflection.getClass('BX.Messenger.v2.Lib.Messenger');
			const menuItems = [!Options.isAdmin ? null : {
				text: main_core.Loc.getMessage('LEFT_MENU_SETTINGS_ITEM_B24_SETTINGS'),
				onclick: () => {
					BX.SidePanel.Instance.open(`${Options.settingsPath}?analyticContext=left_menu`, {
						allowChangeHistory: false,
						width: 1034
					});
				}
			}, Messenger ? {
				text: main_core.Loc.getMessage('LEFT_MENU_SETTINGS_ITEM_MESSENGER_SETTINGS'),
				onclick: () => {
					Messenger.openSettings();
				}
			} : null, Options.isExtranet ? null : {
				text: main_core.Loc.getMessage('MENU_SET_DEFAULT2'),
				onclick: () => {
					this.getDefaultPresetController().show('personal');
				}
			}, !Options.inviteDialogLink ? null : {
				text: main_core.Loc.getMessage('MENU_INVITE_USERS'),
				onclick: () => {
					BX.SidePanel.Instance.open(Options.inviteDialogLink, {
						cacheable: false,
						allowChangeHistory: false,
						width: 1100
					});
				}
			}, !Options.isAdmin && Options.isExtranet ? null : {
				delimiter: true
			}, {
				text: main_core.Loc.getMessage('LEFT_MENU_SETTINGS_ITEM_MENU_SETTINGS'),
				items: leftMenuSettingItems
			}, {
				delimiter: true
			}, !Options.showSitemapMenuItem ? null : {
				text: main_core.Loc.getMessage('MENU_SITE_MAP'),
				onclick: () => {
					this.handleSiteMapClick();
				}
			}, {
				text: main_core.Loc.getMessage('MENU_HELP'),
				onclick: () => {
					this.handleHelperClick();
				}
			}];
			return menuItems.filter(value => {
				return value !== null;
			});
		}

		// endregion

		handleSiteMapClick() {
			this.switchToSlidingMode(false);
			BX.SidePanel.Instance.open((main_core.Loc.getMessage('SITE_DIR') || '/') + 'sitemap/', {
				allowChangeHistory: false,
				customLeftBoundary: 0
			});
		}
		handleHelperClick() {
			this.switchToSlidingMode(false);
			BX.Helper.show();
		}

		// region Sliding functions
		blockSliding() {
			this.stopSliding();
			this.isMenuMouseEnterBlocked = true;
		}
		releaseSliding() {
			this.isMenuMouseEnterBlocked = false;
		}
		stopSliding() {
			clearTimeout(this.slidingModeTimeoutId);
			this.slidingModeTimeoutId = 0;
		}
		startSliding() {
			this.stopSliding();
			if (this.isMenuMouseEnterBlocked === true) {
				return;
			}
			if (Utils.prefersReducedMotion()) {
				this.switchToSlidingMode(true, true);
				return;
			}
			this.slidingModeTimeoutId = setTimeout(function () {
				this.slidingModeTimeoutId = 0;
				this.switchToSlidingMode(true);
			}.bind(this), 400);
		}
		handleBurgerClick(open) {
			this.getItemsController().switchToViewMode();
			if (this.isResponsiveCollapsed) {
				// Narrow viewport: toggle sliding mode instead of expand/collapse
				const isSliding = BX.hasClass(this.mainTable, 'menu-sliding-mode');
				this.switchToSlidingMode(!isSliding);
				return;
			}
			this.menuHeaderBurger.classList.add("menu-switcher-hover");
			this.toggle(open, function () {
				this.blockSliding();
				setTimeout(function () {
					this.menuHeaderBurger.classList.remove("menu-switcher-hover");
					this.releaseSliding();
				}.bind(this), 100);
			}.bind(this));
		}
		handleMenuMouseEnter(event) {
			if (!this.isCollapsed()) {
				return;
			}
			this.startSliding();
		}
		handleMenuMouseLeave(event) {
			this.stopSliding();
			if (this.isMenuMouseLeaveBlocked.length <= 0) {
				this.switchToSlidingMode(false, Utils.prefersReducedMotion());
			}
		}
		handleMenuDoubleClick(event) {
			if (event.target === this.menuBody) {
				this.toggle();
			}
		}
		handleUpButtonClick() {
			this.blockSliding();
			if (this.isUpButtonReversed()) {
				window.scrollTo(0, this.lastScrollOffset);
				this.lastScrollOffset = 0;
				this.unreverseUpButton();
			} else {
				this.lastScrollOffset = window.pageYOffset;
				window.scrollTo(0, 0);
				this.reverseUpButton();
			}
			setTimeout(this.releaseSliding.bind(this), 100);
		}
		handleUpButtonMouseLeave() {
			this.releaseSliding();
		}
		handleDocumentScroll() {
			if (window.pageYOffset > document.documentElement.clientHeight) {
				this.showUpButton();
				if (this.isUpButtonReversed()) {
					this.unreverseUpButton();
					this.lastScrollOffset = 0;
				}
			} else if (!this.isUpButtonReversed()) {
				this.hideUpButton();
			}
			if (window.pageXOffset > 0) {
				this.menuContainer.style.left = -window.pageXOffset + "px";
				this.upButton.style.left = -window.pageXOffset + (this.isCollapsed() ? 0 : 172) + "px";
			} else {
				this.menuContainer.style.removeProperty("left");
				this.upButton.style.removeProperty("left");
			}
		}
		switchToSlidingMode(enable, immediately) {
			if (enable === false) {
				this.stopSliding();
				if (BX.hasClass(this.mainTable, "menu-sliding-mode")) {
					if (immediately !== true) {
						BX.addClass(this.mainTable, "menu-sliding-closing-mode");
					}
					if (Options.showLicenseButton) {
						this.#getLicenseButton().setCollapsed(true);
					}
					BX.removeClass(this.mainTable, "menu-sliding-mode menu-sliding-opening-mode");
					main_core.Dom.removeClass(this.menuContainer, '--ui-context-edge-dark');
				}
			} else if (this.isCollapsedMode && !BX.hasClass(this.mainTable, "menu-sliding-mode")) {
				BX.removeClass(this.mainTable, "menu-sliding-closing-mode");
				main_core.Dom.removeClass(this.menuContainer, '--ui-context-edge-dark');
				if (immediately !== true) {
					BX.addClass(this.mainTable, "menu-sliding-opening-mode");
				}
				if (Options.showLicenseButton) {
					this.#getLicenseButton().setCollapsed(false);
				}
				BX.addClass(this.mainTable, "menu-sliding-mode");
				main_core.Dom.addClass(this.menuContainer, '--ui-context-edge-dark');
			}
		}
		handleSlidingTransitionEnd(event) {
			if (event.target === this.menuContainer) {
				BX.removeClass(this.mainTable, "menu-sliding-opening-mode menu-sliding-closing-mode");
			}
		}

		// region Responsive auto-collapse
		initResponsiveCollapse() {
			this.narrowViewportQuery = window.matchMedia('(max-width: 1024px)');
			this.handleResponsiveChange(this.narrowViewportQuery);
			this.narrowViewportQuery.addEventListener('change', this.handleResponsiveChange.bind(this));
		}
		handleResponsiveChange(event) {
			const isNarrow = event.matches;
			if (isNarrow && !this.isResponsiveCollapsed) {
				// Viewport became narrow: force collapse without persisting to server
				this.wasExpandedBeforeResponsive = !this.isCollapsedMode;
				if (!this.isCollapsedMode) {
					this.isCollapsedMode = true;
					main_core.Dom.addClass(this.mainTable, 'menu-collapsed-mode');
					window.dispatchEvent(new Event('resize'));
				}
				this.isResponsiveCollapsed = true;
			} else if (!isNarrow && this.isResponsiveCollapsed) {
				// Viewport became wide: restore previous state
				this.isResponsiveCollapsed = false;
				this.switchToSlidingMode(false, true);
				if (this.wasExpandedBeforeResponsive) {
					this.isCollapsedMode = false;
					main_core.Dom.removeClass(this.mainTable, 'menu-collapsed-mode');
					window.dispatchEvent(new Event('resize'));
				}
				this.wasExpandedBeforeResponsive = false;
			}
		}
		// endregion

		switchToScrollMode(enable) {
			if (enable === false) {
				main_core.Dom.removeClass(this.mainTable, 'menu-scroll-mode');
			} else if (!main_core.Dom.hasClass(this.mainTable, 'menu-scroll-mode')) {
				main_core.Dom.addClass(this.mainTable, 'menu-scroll-mode');
			}
		}
		toggle(flag, fn) {
			let leftColumn = document.querySelector(".js-app");
			if (!leftColumn) {
				return;
			}
			const isOpen = !this.mainTable.classList.contains('menu-collapsed-mode');

			// Block expanding when viewport forces collapsed mode
			if (this.isResponsiveCollapsed && !isOpen) {
				return;
			}
			if (flag === isOpen || this.mainTable.classList.contains('menu-animation-mode')) {
				return;
			}
			BX.onCustomEvent("BX.Bitrix24.LeftMenuClass:onMenuToggle", [flag, this]);
			this.blockSliding();
			this.switchToSlidingMode(false, true);

			// leftColumn.style.overflow = "hidden";
			this.mainTable.classList.add("menu-animation-mode", isOpen ? "menu-animation-closing-mode" : "menu-animation-opening-mode");
			var menuLinks = [].slice.call(leftColumn.querySelectorAll('.menu-item-link'));
			var menuMoreBtn = leftColumn.querySelector('.menu-collapsed-more-btn');
			var menuMoreBtnDefault = leftColumn.querySelector('.menu-default-more-btn');
			var menuSitemapIcon = leftColumn.querySelector('.menu-sitemap-icon-box');
			var menuSitemapText = leftColumn.querySelector('.menu-sitemap-btn-text');
			var menuEmployeesText = leftColumn.querySelector('.menu-invite-employees-text');
			var menuEmployeesIcon = leftColumn.querySelector('.menu-invite-icon-box');
			const settingsIconBox = this.menuContainer.querySelector(".menu-settings-icon-box");
			const settingsBtnText = this.menuContainer.querySelector(".menu-settings-btn-text");
			const helpIconBox = this.menuContainer.querySelector(".menu-help-icon-box");
			const helpBtnText = this.menuContainer.querySelector(".menu-help-btn-text");
			var menuTextDivider = leftColumn.querySelector('.menu-item-separator');
			var menuMoreCounter = leftColumn.querySelector('.menu-item-index-more');
			var pageHeader = this.mainTable.querySelector(".air-header");
			var imBar = document.getElementById("bx-im-bar");
			var imBarWidth = imBar ? imBar.offsetWidth : 0;
			const expandedMenuWidth = parseInt(getComputedStyle(this.menuContainer).getPropertyValue('--menu-width-expanded'), 10);
			const collapsedMenuWidth = parseInt(getComputedStyle(this.menuContainer).getPropertyValue('--menu-width-collapsed'), 10);
			if (Utils.prefersReducedMotion()) {
				if (isOpen) {
					this.isCollapsedMode = true;
					main_core.Dom.addClass(this.mainTable, 'menu-collapsed-mode');
				} else {
					this.isCollapsedMode = false;
					main_core.Dom.removeClass(this.mainTable, 'menu-collapsed-mode');
				}
				if (Options.showLicenseButton) {
					this.#getLicenseButton().setCollapsed(isOpen);
				}
				main_core.Dom.attr(this.menuHeaderBurger, 'aria-expanded', isOpen ? 'false' : 'true');
				main_core.Dom.attr(this.menuHeaderBurger, 'aria-label', main_core.Loc.getMessage(isOpen ? 'MENU_EXPAND' : 'MENU_COLLAPSE'));
				main_core.Dom.removeClass(this.mainTable, 'menu-animation-mode menu-animation-opening-mode menu-animation-closing-mode');
				this.releaseSliding();
				if (BX.type.isFunction(fn)) {
					fn();
				}
				Backend.toggleMenu(isOpen);
				var event = document.createEvent("Event");
				event.initEvent("resize", true, true);
				window.dispatchEvent(event);
				return;
			}
			new BX.easing({
				duration: 300,
				start: {
					sidebarWidth: isOpen ? expandedMenuWidth : collapsedMenuWidth /* these values are duplicated in style.css as well */
					// opacity: isOpen ? 100 : 0,
					// opacityRevert: isOpen ? 0 : 100
				},
				finish: {
					sidebarWidth: isOpen ? collapsedMenuWidth : expandedMenuWidth
					// opacity: isOpen ? 0 : 100,
					// opacityRevert: isOpen ? 100 : 0
				},
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: function (state) {
					// leftColumn.style.width = state.sidebarWidth + "px";
					this.menuContainer.style.width = state.sidebarWidth + "px";
					this.menuHeaderBurger.style.width = state.burgerMenuWidth + "px";
					// this.headerBurger.style.width = state.burgerMenuWidth + "px";

					//Change this formula in template_style.css as well
					if (pageHeader) {
						pageHeader.style.maxWidth = "calc(100vw - " + state.sidebarWidth + "px - " + imBarWidth + "px)";
					}
					if (Options.showLicenseButton && state.sidebarWidth > 160) {
						this.#getLicenseButton().setCollapsed(isOpen);
					}
					if (isOpen) {
						//Closing Mode
						if (menuSitemapIcon) {
							menuSitemapIcon.style.transform = "translateX(" + state.translateIcon + "px)";
							menuSitemapIcon.style.opacity = state.opacityRevert / 100;
						}
						if (menuSitemapText) {
							menuSitemapText.style.transform = "translateX(" + state.translateText + "px)";
							menuSitemapText.style.opacity = state.opacity / 100;
						}
						if (menuEmployeesIcon) {
							menuEmployeesIcon.style.transform = "translateX(" + state.translateIcon + "px)";
							menuEmployeesIcon.style.opacity = state.opacityRevert / 100;
						}
						if (menuEmployeesText) {
							menuEmployeesText.style.transform = "translateX(" + state.translateText + "px)";
							menuEmployeesText.style.opacity = state.opacity / 100;
						}
						if (settingsIconBox) {
							settingsIconBox.style.transform = "translateX(" + state.translateIcon + "px)";
							settingsIconBox.style.opacity = state.opacityRevert / 100;
						}
						if (settingsBtnText) {
							settingsBtnText.style.transform = "translateX(" + state.translateText + "px)";
							settingsBtnText.style.opacity = state.opacity / 100;
						}
						if (helpIconBox) {
							helpIconBox.style.transform = "translateX(" + state.translateIcon + "px)";
							helpIconBox.style.opacity = state.opacityRevert / 100;
						}
						if (helpBtnText) {
							helpBtnText.style.transform = "translateX(" + state.translateText + "px)";
							helpBtnText.style.opacity = state.opacity / 100;
						}
						if (menuMoreBtn) {
							menuMoreBtn.style.transform = "translateX(" + state.translateIcon + "px)";
							menuMoreBtn.style.opacity = state.opacityRevert / 100;
						}
						if (menuMoreBtnDefault) {
							menuMoreBtnDefault.style.transform = "translateX(" + state.translateMoreBtn + "px)";
							menuMoreBtnDefault.style.opacity = state.opacity / 100;
						}
						if (menuMoreCounter) {
							menuMoreCounter.style.transform = "translateX(" + state.translateIcon + "px)";
							menuMoreCounter.style.opacity = state.opacityRevert / 100;
						}
						menuLinks.forEach(function (item) {
							var menuIcon = item.querySelector(".menu-item-icon-box");
							var menuLinkText = item.querySelector(".menu-item-link-text");
							var menuCounter = item.querySelector(".menu-item-index");
							var menuArrow = item.querySelector('.menu-item-link-arrow');
							menuLinkText.style.transform = "translateX(" + state.translateText + "px)";
							menuLinkText.style.opacity = state.opacity / 100;
							menuIcon.style.transform = "translateX(" + state.translateIcon + "px)";
							menuIcon.style.opacity = state.opacityRevert / 100;
							if (menuArrow) {
								menuArrow.style.transform = "translateX(" + state.translateText + "px)";
								menuArrow.style.opacity = state.opacity / 100;
							}
							if (menuCounter) {
								menuCounter.style.transform = "translateX(" + state.translateIcon + "px)";
								menuCounter.style.opacity = state.opacityRevert / 100;
							}
						});
					} else {
						//Opening Mode
						menuTextDivider.style.opacity = 0;
						if (menuSitemapIcon) {
							menuSitemapIcon.style.transform = "translateX(" + state.translateIcon + "px)";
							menuSitemapIcon.style.opacity = state.opacityRevert / 100;
						}
						if (menuSitemapText) {
							menuSitemapText.style.transform = "translateX(" + state.translateText + "px)";
							menuSitemapText.style.opacity = state.opacity / 100;
						}
						if (menuEmployeesIcon) {
							menuEmployeesIcon.style.transform = "translateX(" + state.translateIcon + "px)";
							menuEmployeesIcon.style.opacity = state.opacityRevert / 100;
						}
						if (menuEmployeesText) {
							menuEmployeesText.style.transform = "translateX(" + state.translateText + "px)";
							menuEmployeesText.style.opacity = state.opacity / 100;
						}
						if (settingsIconBox) {
							settingsIconBox.style.transform = "translateX(" + state.translateIcon + "px)";
							settingsIconBox.style.opacity = state.opacityRevert / 100;
						}
						if (settingsBtnText) {
							settingsBtnText.style.transform = "translateX(" + state.translateText + "px)";
							settingsBtnText.style.opacity = state.opacity / 100;
						}
						if (helpIconBox) {
							helpIconBox.style.transform = "translateX(" + state.translateIcon + "px)";
							helpIconBox.style.opacity = state.opacityRevert / 100;
						}
						if (helpBtnText) {
							helpBtnText.style.transform = "translateX(" + state.translateText + "px)";
							helpBtnText.style.opacity = state.opacity / 100;
						}
						if (menuMoreBtn) {
							menuMoreBtn.style.transform = "translateX(" + state.translateIcon + "px)";
							menuMoreBtn.style.opacity = state.opacityRevert / 100;
						}
						if (menuMoreBtnDefault) {
							menuMoreBtnDefault.style.transform = "translateX(" + state.translateMoreBtn + "px)";
							menuMoreBtnDefault.style.opacity = state.opacity / 100;
						}
						if (menuMoreCounter) {
							menuMoreCounter.style.transform = "translateX(" + state.translateText + "px)";
						}
						menuLinks.forEach(function (item) {
							var menuIcon = item.querySelector(".menu-item-icon-box");
							var menuLinkText = item.querySelector(".menu-item-link-text");
							var menuCounter = item.querySelector(".menu-item-index");
							var menuArrow = item.querySelector('.menu-item-link-arrow');
							menuLinkText.style.transform = "translateX(" + state.translateText + "px)";
							menuLinkText.style.opacity = state.opacity / 100;
							menuLinkText.style.display = "inline-block";
							menuIcon.style.transform = "translateX(" + state.translateIcon + "px)";
							menuIcon.style.opacity = state.opacityRevert / 100;
							if (menuArrow) {
								menuArrow.style.transform = "translateX(" + state.translateText + "px)";
								// menuArrow.style.opacity = state.opacityRevert / 100;
							}
							if (menuCounter) {
								menuCounter.style.transform = "translateX(" + state.translateText + "px)";
							}
						});
					}
					var event = document.createEvent("Event");
					event.initEvent("resize", true, true);
					window.dispatchEvent(event);
				}.bind(this),
				complete: function () {
					if (isOpen) {
						this.isCollapsedMode = true;
						BX.addClass(this.mainTable, "menu-collapsed-mode");
					} else {
						this.isCollapsedMode = false;
						BX.removeClass(this.mainTable, "menu-collapsed-mode");
					}
					main_core.Dom.attr(this.menuHeaderBurger, 'aria-expanded', isOpen ? 'false' : 'true');
					main_core.Dom.attr(this.menuHeaderBurger, 'aria-label', main_core.Loc.getMessage(isOpen ? 'MENU_EXPAND' : 'MENU_COLLAPSE'));
					BX.removeClass(this.mainTable, "menu-animation-mode menu-animation-opening-mode menu-animation-closing-mode");
					var containers = [leftColumn, menuTextDivider, this.menuHeaderBurger, this.headerBurger, settingsIconBox, settingsBtnText, helpIconBox, helpBtnText, menuMoreBtnDefault, menuMoreBtn, menuSitemapIcon, menuSitemapText, menuEmployeesIcon, menuEmployeesText, menuMoreCounter, this.menuContainer, pageHeader];
					containers.forEach(function (container) {
						if (container) {
							container.style.cssText = "";
						}
					});
					menuLinks.forEach(function (item) {
						var menuIcon = item.querySelector(".menu-item-icon-box");
						var menuLinkText = item.querySelector(".menu-item-link-text");
						var menuCounter = item.querySelector(".menu-item-index");
						var menuArrow = item.querySelector('.menu-item-link-arrow');
						item.style.cssText = "";
						menuLinkText.style.cssText = "";
						menuIcon.style.cssText = "";
						if (menuArrow) {
							menuArrow.style.cssText = "";
						}
						if (menuCounter) {
							menuCounter.style.cssText = "";
						}
					});
					this.releaseSliding();
					if (BX.type.isFunction(fn)) {
						fn();
					}
					Backend.toggleMenu(isOpen);
					var event = document.createEvent("Event");
					event.initEvent("resize", true, true);
					window.dispatchEvent(event);
				}.bind(this)
			}).animate();
		}
		//endregion

		handleViewMode() {
			this.getItemsController().switchToViewMode();
		}
		handleGroupPanelOpen() {
			this.isMenuMouseLeaveBlocked.push('group');
		}
		handleGroupPanelClose() {
			this.isMenuMouseLeaveBlocked.pop();
		}
		showUpButton() {
			this.menuContainer.classList.add("menu-up-button-active");
		}
		hideUpButton() {
			this.menuContainer.classList.remove("menu-up-button-active");
		}
		reverseUpButton() {
			this.menuContainer.classList.add("menu-up-button-reverse");
		}
		unreverseUpButton() {
			this.menuContainer.classList.remove("menu-up-button-reverse");
		}
		isUpButtonReversed() {
			return this.menuContainer.classList.contains("menu-up-button-reverse");
		}
		isDefaultTheme() {
			return document.body.classList.contains("bitrix24-default-theme");
		}
		getTopPadding() {
			return this.isDefaultTheme() ? 0 : 9;
		}
		getStructureForHelper() {
			const items = {
				menu: {}
			};
			["show", "hide"].forEach(state => {
				Array.from(this.menuContainer.querySelectorAll(`[data-status="${state}"][data-type="${ItemSystem.code}"]`)).forEach(node => {
					items[state] = items[state] || [];
					items[state].push(node.getAttribute("data-id"));
				});
			});
			return items;
		}
		showItemWarning({
			itemId,
			title,
			events
		}) {
			if (this.getItemsController().items.has(itemId)) {
				this.getItemsController().items.get(itemId).showWarning(title, events);
			}
		}
		removeItemWarning(itemId) {
			if (this.getItemsController().items.has(itemId)) {
				this.getItemsController().items.get(itemId).removeWarning();
			}
		}
		#specialLiveFeedDecrement = 0;
		decrementCounter(node, iDecrement) {
			if (!node || node.id !== 'menu-counter-live-feed') {
				return;
			}
			this.#specialLiveFeedDecrement += parseInt(iDecrement);
			this.getItemsController().decrementCounter({
				'live-feed': parseInt(iDecrement)
			});
		}
		updateCounters(counters, send) {
			if (!counters) {
				return;
			}
			if (counters['**'] !== undefined) {
				counters['live-feed'] = counters['**'];
				delete counters['**'];
			}
			if (counters['live-feed']) {
				if (counters['live-feed'] <= 0) {
					this.#specialLiveFeedDecrement = 0;
				} else {
					counters['live-feed'] -= this.#specialLiveFeedDecrement;
				}
			}
			this.getItemsController().updateCounters(counters, send);
			this.#emitTotalCounter();
		}
		#emitTotalCounter() {
			let total = 0;
			const items = this.menuContainer.querySelectorAll('.menu-item-block[data-role="item"] .ui-counter[id^="menu-counter-"]');
			items.forEach(node => {
				total += Math.max(0, parseInt(node.dataset.value, 10) || 0);
			});
			BX.onCustomEvent('BX.Intranet.LeftMenu:onTotalCounterUpdate', [total]);
		}
		//endregion

		#addLicenseButton() {
			if (Options.showLicenseButton) {
				const licenseButtonWrapper = this.menuContainer.querySelector('.menu-license-all-wrapper');
				if (licenseButtonWrapper) {
					this.#getLicenseButton().renderTo(licenseButtonWrapper);
				}
			}
		}
		#getLicenseButton() {
			if (this.licenseButton) {
				return this.licenseButton;
			}
			this.licenseButton = this.#createLicenseButton();
			this.licenseButton.setCollapsed(this.isCollapsed());
			return this.licenseButton;
		}
		#createLicenseButton() {
			return new ui_buttons.Button({
				size: ui_buttons.Button.Size.SMALL,
				text: main_core.Loc.getMessage('MENU_LICENSE_ALL'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.FILLED_BOOST,
				noCaps: true,
				wide: true,
				icon: 'o-rocket',
				className: 'menu-license-all-button',
				onclick: () => {
					BX.SidePanel.Instance.open(Options.licenseButtonPath, {
						width: 1250,
						cacheable: false
					});
				}
			});
		}
	}

	exports.Menu = Menu;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.UI, BX.Event, BX.Main, BX.UI, BX.UI.Dialogs, BX, BX.UI, BX.Cache, BX.SidePanel);
//# sourceMappingURL=script.js.map
