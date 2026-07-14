/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, im_v2_lib_desktopApi, im_v2_lib_confirm, main_popup, im_v2_const, main_loader, main_core_events) {
	'use strict';

	class Account {
		static defaultAvatar = '/bitrix/js/im/images/blank.gif';
		static defaultAvatarDesktop = '/bitrix/js/ui/icons/b24/images/ui-user.svg?v2';
		accounts = [];
		currentUser = null;
		contextPopup = [];
		popup = null;
		allCounters = {};
		wrapper = null;
		loader = null;
		constructor(allCounters) {
			this.wrapper = document.getElementById('history-items');
			this.loader = null;
			this.checkCounters(allCounters);
			this.reload();
			this.viewDesktopUser();
			this.initPopup();
		}
		#getLoader() {
			if (this.loader) {
				return this.loader;
			}
			this.loader = new main_loader.Loader({
				target: document.querySelector('.intranet__desktop-menu_popup'),
				size: 80,
				mode: 'absolute',
				strokeWidth: 4
			});
			return this.loader;
		}
		hideLoader() {
			this.#getLoader().hide();
		}
		checkCounters(allCounters) {
			for (const counterId of Object.keys(allCounters)) {
				let key = counterId;
				if (counterId === '**') {
					key = 'live-feed';
				}
				this.allCounters[key] = allCounters[counterId];
			}
		}
		getSumCounters() {
			let sum = 0;
			for (const counterId of Object.keys(this.allCounters)) {
				if (counterId === 'tasks_effective' || counterId === 'invited_users') {
					continue;
				}
				const val = this.allCounters[counterId] ? parseInt(this.allCounters[counterId], 10) : 0;
				sum += val;
			}
			return sum;
		}
		getTabUsers() {
			// eslint-disable-next-line no-undef
			return main_core.Type.isUndefined(BXDesktopSystem) ? [] : BXDesktopSystem?.TabList();
		}
		reload() {
			this.reloadAccounts();
			this.viewPopupAccounts();
		}
		reloadAccounts() {
			const currentUserId = parseInt(main_core.Loc.getMessage('USER_ID'), 10);
			// eslint-disable-next-line no-undef
			this.accounts = main_core.Type.isUndefined(BXDesktopSystem) ? [] : im_v2_lib_desktopApi.DesktopApi.getAccountList();
			this.currentUser = this.accounts.find(account => parseInt(account.id, 10) === currentUserId && account.portal === location.hostname);
		}
		getAccountBy(account) {
			return this.accounts.find(x => parseInt(x.id, 10) === parseInt(account.id, 10) && x.portal === account.portal);
		}
		initPopup() {
			const menuContent = document.querySelector('.intranet__desktop-menu_popup');
			const userNode = document.querySelector('.intranet__desktop-menu_user-block');
			this.popup = new main_popup.Popup({
				content: menuContent,
				bindElement: userNode,
				width: 320,
				background: '#282e39',
				closeIcon: true,
				closeByEsc: true
			});
			main_core.Event.bind(userNode, 'click', event => {
				if (this.popup.isShown()) {
					this.popup.close();
				} else {
					event.stopPropagation();
					this.popup.show();
					this.#getLoader().hide();
					this.reload();
				}
			});
			main_core.Event.bind(document, 'click', event => {
				const withinBoundaries = event.composedPath().includes(menuContent);
				if (!withinBoundaries) {
					this.popup.close();
				}
			});
		}
		setCounters(counters) {
			let newCounters = counters;
			if (counters.data) {
				newCounters = counters.data;
				if (newCounters[0] && main_core.Type.isObject(newCounters[0])) {
					newCounters = newCounters[0];
				}
			}
			for (const counterId of Object.keys(newCounters)) {
				let cId = counterId;
				if (counterId === '**') {
					cId = 'live-feed';
				}
				this.allCounters[cId] = newCounters[counterId];
			}
			const sumCounters = this.getSumCounters();
			const block = document.getElementsByClassName('intranet__desktop-menu_user-block')[0];
			const counterNode = block?.querySelector('[data-role="counter"]');
			if (counterNode) {
				if (sumCounters > 0) {
					counterNode.innerHTML = sumCounters > 99 ? '99+' : sumCounters;
					if (!main_core.Dom.hasClass(block, 'intranet__desktop-menu_item_counters')) {
						main_core.Dom.addClass(block, 'intranet__desktop-menu_item_counters');
					}
				} else {
					counterNode.innerHTML = '';
					main_core.Dom.addClass(block, 'intranet__desktop-menu_item_counters');
				}
			}
		}
		removeElements(className) {
			const elements = document.getElementsByClassName(className);
			[...elements].forEach(element => {
				element.remove();
			});
		}
		viewDesktopUser() {
			if (main_core.Type.isNil(this.currentUser)) {
				return;
			}
			const block = document.getElementsByClassName('intranet__desktop-menu_user')[0];
			const counters = this.getSumCounters();
			let counterBlock = null;
			if (counters > 0) {
				const countersView = counters > 99 ? '99+' : counters;
				counterBlock = main_core.Tag.render`
				<div class="intranet__desktop-menu_user-counter ui-counter ui-counter-md ui-counter-danger">
					<div class="ui-counter-inner" data-role="counter">${countersView}</div>
				</div>
			`;
			}
			this.removeElements('intranet__desktop-menu_user-block');
			const userData = main_core.Tag.render`
			<div class="intranet__desktop-menu_user-block ${counters > 0 ? 'intranet__desktop-menu_item_counters' : ''}">
							<span class="intranet__desktop-menu_user-avatar ui-icon ui-icon-common-user ui-icon-common-user-desktop">
								<i></i>
								${counterBlock}
							</span>
							<span class="intranet__desktop-menu_user-inner">
								<span class="intranet__desktop-menu_user-name">${this.currentUser.portal}</span>
								<span class="intranet__desktop-menu_user-post">${this.currentUser.work_position}</span>
							</span>
							<span class="intranet__desktop-menu_user-inner-after"></span>
						</div>
		`;
			main_core.Dom.append(userData, block);
			const avatar = document.getElementsByClassName('ui-icon-common-user-desktop')[0];
			const previewImage = this.getAvatarUrl(this.currentUser);
			main_core.Dom.style(avatar, '--ui-icon-service-bg-image', previewImage);
		}
		getAvatarUrl(account) {
			let avatarUrl = '';
			if (account.avatar.includes('http://') || account.avatar.includes('https://')) {
				avatarUrl = account.avatar;
			} else {
				avatarUrl = `${account.protocol}://${account.portal}${account.avatar}`;
			}
			return `url('${BX.util.htmlspecialchars(account.avatar === Account.defaultAvatar ? Account.defaultAvatarDesktop : BX.util.htmlspecialchars(avatarUrl))}')`;
		}
		viewPopupAccounts() {
			if (main_core.Type.isNil(this.currentUser)) {
				return;
			}
			const menuPopup = document.getElementsByClassName('intranet__desktop-menu_popup')[0];
			let position = '';
			if (main_core.Type.isStringFilled(this.currentUser.work_position)) {
				position = `<span class="intranet__desktop-menu_popup-post">${this.currentUser.work_position}</span>`;
			}
			this.removeElements('intranet__desktop-menu_popup-header');
			const profileUrl = this.currentUser.profile || '';
			const item = main_core.Tag.render`
			<div class="intranet__desktop-menu_popup-header">
				<span class="intranet__desktop-menu_user-avatar ui-icon ui-icon-common-user ui-icon-common-user-popup">
					<i></i>
				</span>
				<span class="intranet__desktop-menu_popup-label">${this.currentUser.portal}</span>
				<div
					class="intranet__desktop-menu_popup-header-user ${profileUrl ? 'intranet__desktop-menu_popup-header-user--chevron' : ''}"
					>
					<span class="intranet__desktop-menu_popup-name">
						${`${this.currentUser.first_name} ${this.currentUser.last_name}`}
					</span>
					${position}
				</div>
			</div>
		`;
			if (profileUrl) {
				const headerUser = item.querySelector('.intranet__desktop-menu_popup-header-user');
				main_core.Event.bind(headerUser, 'click', () => {
					BX.SidePanel.Instance.open(profileUrl);
				});
			}
			main_core.Dom.insertBefore(item, menuPopup.firstElementChild);
			const avatar = document.getElementsByClassName('ui-icon-common-user-popup')[0];
			const previewImage = this.getAvatarUrl(this.currentUser);
			main_core.Dom.style(avatar, '--ui-icon-service-bg-image', previewImage);
			const block = document.getElementsByClassName('intranet__desktop-menu_popup-list')[0];
			this.removeElements('intranet__desktop-menu_popup-item-account');
			let index = 0;
			const users = this.getTabUsers();
			for (const account of this.accounts) {
				let currentUserClass = '';
				let currentUserConnected = '';
				let counters = 0;
				const isSelected = users.some(x => parseInt(x.id, 10) === parseInt(account.id, 10) && x.portal === account.portal);
				if (isSelected) {
					if (parseInt(account.id, 10) === parseInt(this.currentUser.id, 10) && account.portal === this.currentUser.portal) {
						counters = this.getSumCounters();
						currentUserConnected = '--selected';
					}
					currentUserClass = '--connected';
				}
				const countersView = counters > 99 ? '99+' : counters;
				const item = main_core.Tag.render`
				<li class="intranet__desktop-menu_popup-item intranet__desktop-menu_popup-item-account ${counters > 0 ? 'intranet__desktop-menu_item_counters' : ''} ${currentUserClass} ${currentUserConnected}">
					<span class="intranet__desktop-menu_user-avatar ui-icon ui-icon-common-user ui-icon-common-user-${index}">
						<i></i>
						<div class="intranet__desktop-menu_user-counter ui-counter ui-counter-md ui-counter-danger">
							<div class="ui-counter-inner">${countersView}</div>
						</div>	
					</span>
					<span class="intranet__desktop-menu_popup-user">
						<span class="intranet__desktop-menu_popup-name">${account.portal}</span>
						<span class="intranet__desktop-menu_popup-post">${account.login}</span>
					</span>
					<span class="intranet__desktop-menu_popup-btn ui-icon-set --more" id="ui-icon-set-${index}"></span>
				</li>
			`;
				main_core.Dom.insertBefore(item, block.children[index]);
				this.openTabOrConnectAccount(account, item);
				this.addContextMenu(account, index, isSelected);
				const userAvatar = document.getElementsByClassName(`ui-icon-common-user-${index}`)[0];
				const previewUserImage = this.getAvatarUrl(account);
				main_core.Dom.style(userAvatar, '--ui-icon-service-bg-image', previewUserImage);
				index++;
			}
		}
		openTabOrConnectAccount(account, item) {
			const block = item.querySelector('.intranet__desktop-menu_popup-user');
			main_core.Event.bind(block, 'click', () => {
				const siteUrl = `${account.protocol}://${account.portal}`;
				if (this.isAccountConnected(account)) {
					window.open(siteUrl, '_blank');
					return;
				}
				this.#getLoader().show();
				this.connectAccount(account, () => {
					this.checkConnectedAccountAndStopLoader(account, 0, this.hideLoader);
				});
			});
		}
		connectAccount(account, callback) {
			const {
				host,
				login,
				protocol
			} = account;
			const userLang = navigator.language;
			im_v2_lib_desktopApi.DesktopApi.connectAccount(host, login, protocol, userLang);
			callback();
		}
		isAccountConnected(account) {
			const users = this.getTabUsers();
			return users.some(user => parseInt(user.id, 10) === parseInt(account.id, 10) && user.portal === account.portal);
		}
		checkConnectedAccountAndStopLoader(account, counter, callback) {
			if (counter >= 5) {
				this.reload();
				callback();
				return;
			}
			setTimeout(() => {
				this.reloadAccounts();
				const upAccount = this.getAccountBy(account);
				if (upAccount.connected) {
					callback();
				} else {
					this.checkConnectedAccountAndStopLoader(account, counter + 1, callback);
				}
			}, 1000);
		}
		addContextMenu(account, index, isSelected) {
			const button = document.getElementById(`ui-icon-set-${index}`);
			if (this.contextPopup[index]) {
				this.contextPopup[index].destroy();
			}
			this.contextPopup[index] = new main_popup.Menu({
				bindElement: button,
				className: 'intranet__desktop-menu_context',
				items: [isSelected ? {
					text: main_core.Loc.getMessage('MENU_ACCOUNT_POPUP_DISCONNECT'),
					onclick: () => this.disconnectAccount(account, index)
				} : {
					text: main_core.Loc.getMessage('MENU_ACCOUNT_POPUP_CONNECT'),
					onclick: event => this.connectAccountFromMenu(account, event, index)
				}, {
					text: main_core.Loc.getMessage('MENU_ACCOUNT_POPUP_REMOVE'),
					onclick: async () => this.removeAccount(account, index)
				}]
			});
			main_core.Event.bind(button, 'click', event => this.handleContextMenu(event));
		}
		removeAccount(account, index) {
			im_v2_lib_confirm.showDesktopDeleteConfirm().then(userChoice => {
				if (userChoice) {
					const {
						host,
						login
					} = account;
					im_v2_lib_desktopApi.DesktopApi.deleteAccount(host, login);
					main_popup.PopupManager.getPopupById(im_v2_const.PopupType.userProfile)?.close();
					this.reload();
				}
				this.closeContextMenu(index);
			});
		}
		disconnectAccount(account, index) {
			const {
				host
			} = account;
			// eslint-disable-next-line no-undef
			BXDesktopSystem?.AccountDisconnect(host);
			this.closeContextMenu(index);
		}
		connectAccountFromMenu(account, event, index) {
			const {
				host,
				login,
				protocol
			} = account;
			const userLang = navigator.language;
			this.#getLoader().show();
			im_v2_lib_desktopApi.DesktopApi.connectAccount(host, login, protocol, userLang);
			event.stopPropagation();
			this.checkConnectedAccountAndStopLoader(account, 0, () => {
				this.#getLoader().hide();
				this.closeContextMenu(index);
			});
		}
		handleContextMenu(event) {
			const index = parseInt(event.target.id.replace('ui-icon-set-', ''), 10);
			if (this.contextPopup[index]) {
				this.contextPopup[index].show();
			}
		}
		closeContextMenu(index) {
			if (this.contextPopup[index]) {
				this.contextPopup[index].close();
			}
			this.popup.close();
		}
		openLoginTab() {
			im_v2_lib_desktopApi.DesktopApi.openAddAccountTab();
		}
	}

	class Counters {
		init() {
			// All Counters
			main_core_events.EventEmitter.subscribe('onPullEvent-main', event => {
				const [command, params] = event.getCompatData();
				if (command === 'user_counter' && params[Loc.getMessage('SITE_ID')]) {
					const counters = {
						...params[Loc.getMessage('SITE_ID')]
					};
					this.updateCounters(counters, false);
				}
			});
			BX.addCustomEvent("onPullEvent-tasks", (command, params) => {
				if (command === "user_counter" && Number(params.userId) === Number(BX.Loc.getMessage('USER_ID'))) {
					let counters = {};
					if (!BX.Type.isUndefined(params.projects_major)) {
						counters.projects_major = params.projects_major;
					}
					if (!BX.Type.isUndefined(params.scrum_total_comments)) {
						counters.scrum_total_comments = params.scrum_total_comments;
					}
					this.updateCounters(counters, false);
				}
			});

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
			if (BX.browser.SupportLocalStorage()) {
				BX.addCustomEvent(window, 'onLocalStorageSet', params => {
					if (params.key.substring(0, 4) === 'lmc-') {
						let counters = {};
						counters[params.key.substring(4)] = params.value;
						this.updateCounters(counters, false);
					}
				});
			}

			// Live Feed Counter
			main_core_events.EventEmitter.subscribe('onCounterDecrement', event => {
				const [decrement] = event.getCompatData();
				this.decrementCounter(document.getElementById('menu-counter-live-feed'), decrement);
			});
		}
		updateCounters(counters, send) {
			BX.ready(function () {
				if (BX.getClass("BX.Intranet.DescktopLeftMenu")) {
					BX.Intranet.DescktopLeftMenu.updateCounters(counters, send);
				}
			});
		}
		decrementCounter(node, iDecrement) {
			BX.ready(function () {
				if (BX.getClass("BX.Intranet.DescktopLeftMenu")) {
					BX.Intranet.DescktopLeftMenu.decrementCounter(node, iDecrement);
				}
			});
		}
	}

	class Item {
		constructor(parentContainer, container) {
			this.parentContainer = parentContainer;
			this.container = container;
			this.init();
		}
		init() {
			this.makeTextIcons();
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
		static detect(node) {
			return node.getAttribute("data-role") !== 'group' && node.getAttribute("data-type") === this.code;
		}
		makeTextIcons() {
			if (!this.container.classList.contains("menu-item-no-icon-state")) {
				return;
			}
			const icon = this.container.querySelector(".menu-item-icon");
			const text = this.container.querySelector(".menu-item-link-text");
			if (icon && text) {
				icon.textContent = this.getShortName(text.textContent);
			}
		}
		getCounterValue() {
			const node = this.container.querySelector('[data-role="counter"]');
			if (!node) {
				return null;
			}
			return parseInt(node.dataset.counterValue);
		}
		updateCounter(counterValue) {
			const node = this.container.querySelector('[data-role="counter"]');
			if (!node) {
				return;
			}
			const oldValue = parseInt(node.dataset.counterValue) || 0;
			node.dataset.counterValue = counterValue;
			if (counterValue > 0) {
				node.innerHTML = counterValue > 99 ? '99+' : counterValue;
				this.container.classList.add('intranet__desktop-menu_item_counters');
			} else {
				node.innerHTML = '';
				this.container.classList.remove('menu-item-with-index');
			}
			return {
				oldValue,
				newValue: counterValue
			};
		}
		getShortName(name) {
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
	}

	let ItemAdminShared$1 = class ItemAdminShared extends Item {
		static code = 'admin';
	};

	class ItemAdminShared extends Item {
		static code = 'custom';
	}

	class ItemUserFavorites extends Item {
		static code = 'standard';
	}

	class ItemUserSelf extends Item {
		static code = 'self';
	}

	class ItemSystem extends Item {
		static code = 'default';
	}

	const itemMappings = [Item, ItemAdminShared$1, ItemUserFavorites, ItemAdminShared, ItemUserSelf, ItemSystem];
	function getItem(itemData) {
		let itemClassName = Item;
		itemMappings.forEach(itemClass => {
			if (itemClass.detect(itemData)) {
				itemClassName = itemClass;
			}
		});
		return itemClassName;
	}

	class ItemsController {
		items = new Map();
		#updateCountersLastValue = null;
		constructor(container) {
			this.parentContainer = container;
			this.container = container.querySelector(".menu-items");
			container.querySelectorAll('li.menu-item-block').forEach(this.registerItem.bind(this));
		}
		registerItem(node) {
			const itemClass = getItem(node);
			const item = new itemClass(this.container, node);
			this.items.set(item.getId(), item);
			return item;
		}
		updateCounters(counters, send) {
			let countersDynamic = null;
			send = send !== false;
			[...Object.entries(counters)].forEach(([counterId, counterValue]) => {
				[...this.#getItemsByCounterId(counterId)].forEach(item => {
					const {
						oldValue,
						newValue
					} = item.updateCounter(counterValue);
					if ((counterId.indexOf('crm_') < 0 || counterId.indexOf('crm_all') >= 0) && (counterId.indexOf('tasks_') < 0 || counterId.indexOf('tasks_total') >= 0)) {
						countersDynamic = countersDynamic || 0;
						countersDynamic += newValue - oldValue;
					}
				});
				if (send) {
					BX.localStorage.set('lmc-' + counterId, counterValue, 5);
				}
				if (typeof BXIM !== 'undefined') {
					if (this.#updateCountersLastValue === null) {
						this.#updateCountersLastValue = 0;
						[...this.items.entries()].forEach(([id, item]) => {
							const res = item.getCounterValue();
							if (res > 0) {
								let counterId = 'doesNotMatter';
								if (id.indexOf('menu_crm') >= 0 || id.indexOf('menu_tasks') >= 0) {
									const counterNode = item.container.querySelector('[data-role="counter"]');
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
						this.#updateCountersLastValue += countersDynamic !== null ? countersDynamic : 0;
					}
					const visibleValue = this.#updateCountersLastValue > 99 ? '99+' : this.#updateCountersLastValue < 0 ? '0' : this.#updateCountersLastValue;
					if (im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
						im_v2_lib_desktopApi.DesktopApi.setBrowserIconBadge(visibleValue);
					}
				}
			});
		}
		#getItemsByCounterId(counterId) {
			const result = [];
			[...this.items.values()].forEach(item => {
				const node = item.container.querySelector('[data-role="counter"]');
				if (node && node.id.indexOf(counterId) >= 0) {
					result.push(item);
				}
			});
			return result;
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
	}

	class BrowserHistory {
		items = [];
		constructor() {
			this.wrapper = document.getElementById("history-items");
		}
		init() {
			if ('object' != typeof BXDesktopSystem) {
				console.log('BXDesktopSystem is empty');
				return;
			}
			this.items = BXDesktopSystem?.BrowserHistory();
			this.showHistory();
		}
		showHistory() {
			let i = 0;
			this.items.forEach(item => {
				if (i > 15 || !item.url.startsWith(location.origin)) {
					return true;
				}
				let icoName = '';
				let title = '';
				if (main_core.Type.isStringFilled(item.title)) {
					icoName = this.getShortName(main_core.Text.encode(item.title));
					title = main_core.Text.encode(item.title);
				} else {
					if (item.url.includes('/desktop_app/')) {
						icoName = Loc.getMessage('MENU_HISTORY_ITEM_ICON');
						title = Loc.getMessage('MENU_HISTORY_ITEM_NAME');
					} else {
						return;
					}
				}
				if (item.url.includes('/desktop/menu')) {
					return;
				}
				let url = main_core.Text.encode(item.url);
				let li = main_core.Tag.render`
				<li class="intranet__desktop-menu_item">
					<a class="intranet__desktop-menu_item-link" href="${url}">
						<span class="intranet__desktop-menu_item-icon --custom">${icoName}</span>
						<span class="intranet__desktop-menu_item-title">${title}</span>
					</a>
				</li>
			`;
				this.wrapper.appendChild(li);
				i++;
			});
		}
		getShortName(name) {
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
	}

	class DesktopMenu {
		cache = new main_core.Cache.MemoryCache();
		browserHistory = null;
		account = null;
		theme = null;
		#specialLiveFeedDecrement = 0;
		constructor(allCounters) {
			this.menuContainer = document.getElementById("menu-items-block");
			if (!this.menuContainer) {
				return;
			}
			this.getItemsController();
			this.getHistoryItems();
			this.showAccount(allCounters);
			this.runAPICounters();
		}
		getItemsController() {
			return this.cache.remember('itemsMenuController', () => {
				return new ItemsController(this.menuContainer);
			});
		}
		getHistoryItems() {
			this.browserHistory = new BrowserHistory();
			this.browserHistory.init();
		}
		showAccount(allCounters) {
			this.account = new Account(allCounters);
			BX.Intranet.Account = this.account;
		}
		runAPICounters() {
			BX.Intranet.Counters = new Counters();
			BX.Intranet.Counters.init();
		}
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
			BX.Intranet.Account.setCounters(counters);
		}
	}

	exports.DesktopMenu = DesktopMenu;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Main, BX.Messenger.v2.Const, BX, BX.Event);
//# sourceMappingURL=script.js.map
