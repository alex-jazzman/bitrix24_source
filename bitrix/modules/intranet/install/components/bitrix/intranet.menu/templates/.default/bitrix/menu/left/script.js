/* eslint-disable */
this.BX = this.BX || {};
(function (exports,im_v2_lib_confirm,main_popup,im_v2_const,main_core_events,im_v2_lib_desktopApi,main_core) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2,
	  _t3,
	  _t4;
	class Account {
	  constructor(allCounters) {
	    this.accounts = [];
	    this.currentUser = null;
	    this.contextPopup = [];
	    this.popup = null;
	    this.allCounters = {};
	    this.wrapper = null;
	    this.wrapper = document.getElementById("history-items");
	    this.checkCounters(allCounters);
	    this.reload();
	    this.viewDesktopUser();
	    this.initPopup();
	  }
	  checkCounters(allCounters) {
	    for (let counterId of Object.keys(allCounters)) {
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
	  getTabUses() {
	    return 'undefined' !== typeof BXDesktopSystem ? BXDesktopSystem.TabList() : [];
	  }
	  reload() {
	    const currentUserId = parseInt(main_core.Loc.getMessage('USER_ID'), 10);
	    this.accounts = 'undefined' !== typeof BXDesktopSystem ? im_v2_lib_desktopApi.DesktopApi.getAccountList() : [];
	    this.currentUser = this.accounts.find(account => parseInt(account.id, 10) === currentUserId && account.portal === location.hostname);
	    this.viewPopupAccounts();
	  }
	  initPopup() {
	    const userNode = document.querySelector('.intranet__desktop-menu_user-block');
	    this.popup = new main_popup.Popup({
	      content: document.querySelector('.intranet__desktop-menu_popup'),
	      bindElement: userNode,
	      width: 320,
	      background: '#282e39',
	      closeIcon: true,
	      closeByEsc: true
	    });
	    main_core.Event.bind(userNode, 'click', () => {
	      if (this.popup.isShown()) {
	        this.popup.close();
	      } else {
	        this.popup.show();
	        this.reload();
	      }
	    });
	  }
	  setCounters(counters) {
	    let newCounters = counters;
	    if (counters['data']) {
	      newCounters = counters.data;
	      if (newCounters[0] && typeof newCounters[0] === 'object') {
	        newCounters = newCounters[0];
	      }
	    }
	    for (let counterId of Object.keys(newCounters)) {
	      let cId = counterId;
	      if (counterId === '**') {
	        cId = 'live-feed';
	      }
	      this.allCounters[cId] = newCounters[counterId];
	    }
	    const sumCounters = this.getSumCounters();
	    const block = document.getElementsByClassName('intranet__desktop-menu_user-block')[0];
	    const counterNode = block.querySelector('[data-role="counter"]');
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
	  removeElements(className) {
	    const elements = document.getElementsByClassName(className);
	    [...elements].forEach(element => {
	      element.remove();
	    });
	  }
	  viewDesktopUser() {
	    const block = document.getElementsByClassName('intranet__desktop-menu_user')[0];
	    const counters = this.getSumCounters();
	    let counterBlock = null;
	    if (counters > 0) {
	      const countersView = counters > 99 ? '99+' : counters;
	      counterBlock = main_core.Tag.render(_t || (_t = _`
				<div class="intranet__desktop-menu_user-counter ui-counter ui-counter-md ui-counter-danger">
					<div class="ui-counter-inner" data-role="counter">${0}</div>
				</div>`), countersView);
	    }
	    this.removeElements('intranet__desktop-menu_user-block');
	    let userData = main_core.Tag.render(_t2 || (_t2 = _`<div class="intranet__desktop-menu_user-block ${0}">
				<span class="intranet__desktop-menu_user-avatar ui-icon ui-icon-common-user ui-icon-common-user-desktop">
					<i></i>
					${0}
				</span>
				<span class="intranet__desktop-menu_user-inner">
					<span class="intranet__desktop-menu_user-name">${0}</span>
					<span class="intranet__desktop-menu_user-post">${0}</span>
				</span>
			</div>`), counters > 0 ? 'intranet__desktop-menu_item_counters' : '', counterBlock, this.currentUser.portal, this.currentUser.work_position);
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
	      avatarUrl = account.protocol + '://' + account.portal + account.avatar;
	    }
	    return `url('${BX.util.htmlspecialchars(account.avatar === Account.defaultAvatar ? Account.defaultAvatarDesctop : BX.util.htmlspecialchars(avatarUrl))}')`;
	  }
	  viewPopupAccounts() {
	    const menuPopup = document.getElementsByClassName('intranet__desktop-menu_popup')[0];
	    let position = '';
	    if (this.currentUser.work_position !== '') {
	      position = `<span class="intranet__desktop-menu_popup-post">${this.currentUser.work_position}</span>`;
	    }
	    this.removeElements('intranet__desktop-menu_popup-header');
	    let item = main_core.Tag.render(_t3 || (_t3 = _`<div class="intranet__desktop-menu_popup-header">
			<span class="intranet__desktop-menu_user-avatar ui-icon ui-icon-common-user ui-icon-common-user-popup">
				<i></i>
			</span>
			<span class="intranet__desktop-menu_popup-label">${0}</span>
			<div class="intranet__desktop-menu_popup-header-user">
				<span class="intranet__desktop-menu_popup-name">${0}</span>
				${0}
			</div>
		</div>`), this.currentUser.portal, this.currentUser.first_name + ' ' + this.currentUser.last_name, position);
	    main_core.Dom.insertBefore(item, menuPopup.firstElementChild);
	    const avatar = document.getElementsByClassName('ui-icon-common-user-popup')[0];
	    const previewImage = this.getAvatarUrl(this.currentUser);
	    main_core.Dom.style(avatar, '--ui-icon-service-bg-image', previewImage);
	    const block = document.getElementsByClassName('intranet__desktop-menu_popup-list')[0];
	    this.removeElements('intranet__desktop-menu_popup-item-account');
	    let index = 0;
	    const users = this.getTabUses();
	    for (let account of this.accounts) {
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
	      let item = main_core.Tag.render(_t4 || (_t4 = _`<li class="intranet__desktop-menu_popup-item intranet__desktop-menu_popup-item-account ${0} ${0} ${0}">
					<span class="intranet__desktop-menu_user-avatar ui-icon ui-icon-common-user ui-icon-common-user-${0}">
						<i></i>
						<div class="intranet__desktop-menu_user-counter ui-counter ui-counter-md ui-counter-danger">
							<div class="ui-counter-inner">${0}</div>
						</div>	
					</span>
					<span class="intranet__desktop-menu_popup-user">
						<span class="intranet__desktop-menu_popup-name">${0}</span>
						<span class="intranet__desktop-menu_popup-post">${0}</span>
					</span>
					<span class="intranet__desktop-menu_popup-btn ui-icon-set --more" id="ui-icon-set-${0}"></span>
				</li>`), counters > 0 ? 'intranet__desktop-menu_item_counters' : '', currentUserClass, currentUserConnected, index, countersView, account.portal, account.login, index);
	      main_core.Dom.insertBefore(item, block.children[index]);
	      this.addContextMenu(account, index, isSelected);
	      let userAvatar = document.getElementsByClassName('ui-icon-common-user-' + index)[0];
	      let previewUserImage = this.getAvatarUrl(account);
	      main_core.Dom.style(userAvatar, '--ui-icon-service-bg-image', previewUserImage);
	      index++;
	    }
	  }
	  addContextMenu(account, index, isSelected) {
	    const button = document.getElementById(`ui-icon-set-${index}`);
	    const popup = this.popup;
	    const contextPopup = this.contextPopup;
	    if (contextPopup[index]) {
	      contextPopup[index].destroy();
	    }
	    contextPopup[index] = new main_popup.Menu({
	      bindElement: button,
	      className: 'intranet__desktop-menu_context',
	      items: [isSelected ? {
	        text: main_core.Loc.getMessage('MENU_ACCOUNT_POPUP_DISCONNECT'),
	        onclick: function (event, item) {
	          var _BXDesktopSystem;
	          const {
	            host
	          } = account;
	          (_BXDesktopSystem = BXDesktopSystem) == null ? void 0 : _BXDesktopSystem.AccountDisconnect(host);
	          if (contextPopup[index]) {
	            contextPopup[index].close();
	          }
	          popup.close();
	        }
	      } : {
	        text: main_core.Loc.getMessage('MENU_ACCOUNT_POPUP_CONNECT'),
	        onclick: function (event, item) {
	          const {
	            host,
	            login,
	            protocol
	          } = account;
	          const userLang = navigator.language;
	          im_v2_lib_desktopApi.DesktopApi.connectAccount(host, login, protocol, userLang);
	          if (contextPopup[index]) {
	            contextPopup[index].close();
	          }
	          popup.close();
	        }
	      }, {
	        text: main_core.Loc.getMessage('MENU_ACCOUNT_POPUP_REMOVE'),
	        onclick: async function (event, item) {
	          const userChoice = await im_v2_lib_confirm.showDesktopDeleteConfirm();
	          if (userChoice === true) {
	            var _PopupManager$getPopu;
	            const {
	              host,
	              login
	            } = account;
	            im_v2_lib_desktopApi.DesktopApi.deleteAccount(host, login);
	            (_PopupManager$getPopu = main_popup.PopupManager.getPopupById(im_v2_const.PopupType.userProfile)) == null ? void 0 : _PopupManager$getPopu.close();
	          }
	          if (contextPopup[index]) {
	            contextPopup[index].close();
	          }
	          popup.close();
	        }
	      }]
	    });
	    main_core.Event.bind(button, 'click', event => {
	      const index = parseInt(event.target.id.replace('ui-icon-set-', ''));
	      if (contextPopup[index]) {
	        contextPopup[index].show();
	      }
	    });
	  }
	  openLoginTab() {
	    im_v2_lib_desktopApi.DesktopApi.openAddAccountTab();
	  }
	}
	Account.defaultAvatar = '/bitrix/js/im/images/blank.gif';
	Account.defaultAvatarDesctop = '/bitrix/js/ui/icons/b24/images/ui-user.svg?v2';

	var _getThemePicker = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getThemePicker");
	var _applyTheme = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("applyTheme");
	var _applyPictureTheme = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("applyPictureTheme");
	var _applyVideoTheme = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("applyVideoTheme");
	class Theme {
	  constructor() {
	    var _babelHelpers$classPr;
	    Object.defineProperty(this, _applyVideoTheme, {
	      value: _applyVideoTheme2
	    });
	    Object.defineProperty(this, _applyPictureTheme, {
	      value: _applyPictureTheme2
	    });
	    Object.defineProperty(this, _applyTheme, {
	      value: _applyTheme2
	    });
	    Object.defineProperty(this, _getThemePicker, {
	      value: _getThemePicker2
	    });
	    this.backgroundNode = null;
	    const _theme = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _getThemePicker)[_getThemePicker]()) == null ? void 0 : _babelHelpers$classPr.getAppliedTheme();
	    this.backgroundNode = document.querySelector('body');
	    if (_theme) {
	      babelHelpers.classPrivateFieldLooseBase(this, _applyTheme)[_applyTheme](_theme);
	    }
	    main_core_events.EventEmitter.subscribe('BX.Intranet.Bitrix24:ThemePicker:onThemeApply', event => {
	      babelHelpers.classPrivateFieldLooseBase(this, _applyTheme)[_applyTheme](event.data.theme);
	    });
	  }
	}
	function _getThemePicker2() {
	  var _BX$Intranet$Bitrix, _BX$Intranet, _BX$Intranet$Bitrix2, _top$BX$Intranet, _top$BX$Intranet$Bitr;
	  return (_BX$Intranet$Bitrix = (_BX$Intranet = BX.Intranet) == null ? void 0 : (_BX$Intranet$Bitrix2 = _BX$Intranet.Bitrix24) == null ? void 0 : _BX$Intranet$Bitrix2.ThemePicker.Singleton) != null ? _BX$Intranet$Bitrix : (_top$BX$Intranet = top.BX.Intranet) == null ? void 0 : (_top$BX$Intranet$Bitr = _top$BX$Intranet.Bitrix24) == null ? void 0 : _top$BX$Intranet$Bitr.ThemePicker.Singleton;
	}
	function _applyTheme2(theme) {
	  theme.video ? babelHelpers.classPrivateFieldLooseBase(this, _applyVideoTheme)[_applyVideoTheme](theme) : babelHelpers.classPrivateFieldLooseBase(this, _applyPictureTheme)[_applyPictureTheme](theme);
	  main_core.Dom.removeClass(this.backgroundNode, 'bitrix24-theme-default bitrix24-theme-dark bitrix24-theme-light');
	  let themeClass = 'bitrix24-theme-default';
	  if (theme.id !== 'default' && String(theme.id).indexOf('default:') !== 0) {
	    themeClass = String(theme.id).indexOf('dark:') === 0 ? 'bitrix24-theme-dark' : 'bitrix24-theme-light';
	  }
	  main_core.Dom.addClass(this.backgroundNode, themeClass);
	}
	function _applyPictureTheme2(theme) {
	  let bgImage = theme.previewImage;
	  if (main_core.Type.isArrayFilled(theme.prefetchImages)) {
	    bgImage = theme.prefetchImages[theme.prefetchImages.length - 1];
	  }
	  const imageUrl = `url('${main_core.Text.encode(bgImage)}')`;
	  main_core.Dom.style(this.backgroundNode, 'backgroundImage', imageUrl);
	}
	function _applyVideoTheme2(theme) {
	  const sources = [];
	  for (let type in theme.video.sources) {
	    sources.push(BX.create('source', {
	      attrs: {
	        type: `video/${type}`,
	        src: theme.video.sources[type]
	      }
	    }));
	  }
	  const video = main_core.Dom.create('div', {
	    props: {
	      className: 'theme-video-container'
	    },
	    dataset: {
	      themeId: theme.id
	    },
	    children: [main_core.Dom.create('video', {
	      props: {
	        className: 'theme-video'
	      },
	      attrs: {
	        poster: theme.video.poster,
	        autoplay: true,
	        loop: true,
	        muted: true,
	        playsinline: true
	      },
	      dataset: {
	        themeId: theme.id
	      },
	      children: sources
	    })]
	  });
	  main_core.Dom.prepend(video, this.backgroundNode);
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

	class ItemAdminShared extends Item {}
	ItemAdminShared.code = 'admin';

	class ItemAdminShared$1 extends Item {}
	ItemAdminShared$1.code = 'custom';

	class ItemUserFavorites extends Item {}
	ItemUserFavorites.code = 'standard';

	class ItemUserSelf extends Item {}
	ItemUserSelf.code = 'self';

	class ItemSystem extends Item {}
	ItemSystem.code = 'default';

	const itemMappings = [Item, ItemAdminShared, ItemUserFavorites, ItemAdminShared$1, ItemUserSelf, ItemSystem];
	function getItem(itemData) {
	  let itemClassName = Item;
	  itemMappings.forEach(itemClass => {
	    if (itemClass.detect(itemData)) {
	      itemClassName = itemClass;
	    }
	  });
	  return itemClassName;
	}

	var _updateCountersLastValue = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateCountersLastValue");
	var _getItemsByCounterId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getItemsByCounterId");
	class ItemsController {
	  constructor(container) {
	    Object.defineProperty(this, _getItemsByCounterId, {
	      value: _getItemsByCounterId2
	    });
	    this.items = new Map();
	    Object.defineProperty(this, _updateCountersLastValue, {
	      writable: true,
	      value: null
	    });
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
	      [...babelHelpers.classPrivateFieldLooseBase(this, _getItemsByCounterId)[_getItemsByCounterId](counterId)].forEach(item => {
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
	        if (babelHelpers.classPrivateFieldLooseBase(this, _updateCountersLastValue)[_updateCountersLastValue] === null) {
	          babelHelpers.classPrivateFieldLooseBase(this, _updateCountersLastValue)[_updateCountersLastValue] = 0;
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
	                babelHelpers.classPrivateFieldLooseBase(this, _updateCountersLastValue)[_updateCountersLastValue] += res;
	              }
	            }
	          });
	        } else {
	          babelHelpers.classPrivateFieldLooseBase(this, _updateCountersLastValue)[_updateCountersLastValue] += countersDynamic !== null ? countersDynamic : 0;
	        }
	        const visibleValue = babelHelpers.classPrivateFieldLooseBase(this, _updateCountersLastValue)[_updateCountersLastValue] > 99 ? '99+' : babelHelpers.classPrivateFieldLooseBase(this, _updateCountersLastValue)[_updateCountersLastValue] < 0 ? '0' : babelHelpers.classPrivateFieldLooseBase(this, _updateCountersLastValue)[_updateCountersLastValue];
	        if (im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
	          im_v2_lib_desktopApi.DesktopApi.setBrowserIconBadge(visibleValue);
	        }
	      }
	    });
	  }
	  decrementCounter(counters) {
	    [...Object.entries(counters)].forEach(([counterId, counterValue]) => {
	      const item = babelHelpers.classPrivateFieldLooseBase(this, _getItemsByCounterId)[_getItemsByCounterId](counterId).shift();
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
	function _getItemsByCounterId2(counterId) {
	  const result = [];
	  [...this.items.values()].forEach(item => {
	    const node = item.container.querySelector('[data-role="counter"]');
	    if (node && node.id.indexOf(counterId) >= 0) {
	      result.push(item);
	    }
	  });
	  return result;
	}

	let _$1 = t => t,
	  _t$1;
	class BrowserHistory {
	  constructor(isAir) {
	    this.isAir = false;
	    this.items = [];
	    this.isAir = isAir;
	    this.wrapper = document.getElementById("history-items");
	  }
	  init() {
	    var _BXDesktopSystem;
	    if ('object' != typeof BXDesktopSystem) {
	      console.log('BXDesktopSystem is empty');
	      return;
	    }
	    this.items = (_BXDesktopSystem = BXDesktopSystem) == null ? void 0 : _BXDesktopSystem.BrowserHistory();
	    this.showHistory();
	  }
	  showHistory() {
	    let i = 0;
	    this.items.forEach(item => {
	      if (i > 15) {
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
	      if (!this.isAir && item.url.includes('/online/')) {
	        url = 'bx://v2/' + location.hostname + '/chat/';
	      }
	      let li = main_core.Tag.render(_t$1 || (_t$1 = _$1`
				<li class="intranet__desktop-menu_item">
					<a class="intranet__desktop-menu_item-link" href="${0}">
						<span class="intranet__desktop-menu_item-icon --custom">${0}</span>
						<span class="intranet__desktop-menu_item-title">${0}</span>
					</a>
				</li>
			`), url, icoName, title);
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

	var _specialLiveFeedDecrement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("specialLiveFeedDecrement");
	class DesktopMenu {
	  constructor(allCounters, isAir) {
	    this.cache = new main_core.Cache.MemoryCache();
	    this.browserHistory = null;
	    this.account = null;
	    this.theme = null;
	    Object.defineProperty(this, _specialLiveFeedDecrement, {
	      writable: true,
	      value: 0
	    });
	    this.menuContainer = document.getElementById("menu-items-block");
	    if (!this.menuContainer) {
	      return false;
	    }
	    this.initTheme();
	    this.getItemsController();
	    this.getHistoryItems(isAir);
	    this.showAccount(allCounters);
	    this.runAPICounters();
	  }
	  initTheme() {
	    this.theme = new Theme();
	  }
	  getItemsController() {
	    return this.cache.remember('itemsMenuController', () => {
	      return new ItemsController(this.menuContainer);
	    });
	  }
	  getHistoryItems(isAir) {
	    this.browserHistory = new BrowserHistory(isAir);
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
	    babelHelpers.classPrivateFieldLooseBase(this, _specialLiveFeedDecrement)[_specialLiveFeedDecrement] += parseInt(iDecrement);
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
	        babelHelpers.classPrivateFieldLooseBase(this, _specialLiveFeedDecrement)[_specialLiveFeedDecrement] = 0;
	      } else {
	        counters['live-feed'] -= babelHelpers.classPrivateFieldLooseBase(this, _specialLiveFeedDecrement)[_specialLiveFeedDecrement];
	      }
	    }
	    this.getItemsController().updateCounters(counters, send);
	    BX.Intranet.Account.setCounters(counters);
	  }
	}

	exports.DesktopMenu = DesktopMenu;

}((this.BX.Intranet = this.BX.Intranet || {}),BX.Messenger.v2.Lib,BX.Main,BX.Messenger.v2.Const,BX.Event,BX.Messenger.v2.Lib,BX));
//# sourceMappingURL=script.js.map
