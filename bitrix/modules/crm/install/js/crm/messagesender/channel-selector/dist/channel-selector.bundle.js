/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.MessageSender = this.BX.Crm.MessageSender || {};
(function (exports,main_core,main_core_events,main_popup,ui_buttons,ui_iconSet_api_core) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2,
	  _t3,
	  _t4,
	  _t5,
	  _t6,
	  _t7,
	  _t8,
	  _t9,
	  _t10,
	  _t11,
	  _t12;
	var _bindElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindElement");
	var _items = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("items");
	var _banners = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("banners");
	var _itemsSort = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("itemsSort");
	var _analytics = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("analytics");
	var _popup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _buildPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buildPopup");
	var _renderContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderContent");
	var _renderBody = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderBody");
	var _renderVisibleItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderVisibleItems");
	var _renderItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderItem");
	var _normalizeItemsSort = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("normalizeItemsSort");
	var _isHidden = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isHidden");
	var _sortItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sortItems");
	var _renderBanners = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderBanners");
	var _renderSingleBanner = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderSingleBanner");
	var _renderFooter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderFooter");
	var _openMessageSenderConnectionsSlider = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openMessageSenderConnectionsSlider");
	var _openSlider = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openSlider");
	var _enterEditMode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("enterEditMode");
	var _getMaxVisibleChannels = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMaxVisibleChannels");
	var _getMinVisibleChannels = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMinVisibleChannels");
	var _save = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("save");
	var _ensureMinVisibleChannels = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("ensureMinVisibleChannels");
	var _ensureMaxVisibleChannels = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("ensureMaxVisibleChannels");
	var _updateItemsSort = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateItemsSort");
	/**
	 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onShow
	 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onClose
	 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onDestroy
	 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onSave
	 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onConnectionsSliderClose
	 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onPromoBannerSliderClose
	 */
	class Selector extends main_core_events.EventEmitter {
	  constructor(_options = {}) {
	    var _options$events;
	    super();
	    Object.defineProperty(this, _updateItemsSort, {
	      value: _updateItemsSort2
	    });
	    Object.defineProperty(this, _ensureMaxVisibleChannels, {
	      value: _ensureMaxVisibleChannels2
	    });
	    Object.defineProperty(this, _ensureMinVisibleChannels, {
	      value: _ensureMinVisibleChannels2
	    });
	    Object.defineProperty(this, _save, {
	      value: _save2
	    });
	    Object.defineProperty(this, _getMinVisibleChannels, {
	      value: _getMinVisibleChannels2
	    });
	    Object.defineProperty(this, _getMaxVisibleChannels, {
	      value: _getMaxVisibleChannels2
	    });
	    Object.defineProperty(this, _enterEditMode, {
	      value: _enterEditMode2
	    });
	    Object.defineProperty(this, _openSlider, {
	      value: _openSlider2
	    });
	    Object.defineProperty(this, _openMessageSenderConnectionsSlider, {
	      value: _openMessageSenderConnectionsSlider2
	    });
	    Object.defineProperty(this, _renderFooter, {
	      value: _renderFooter2
	    });
	    Object.defineProperty(this, _renderSingleBanner, {
	      value: _renderSingleBanner2
	    });
	    Object.defineProperty(this, _renderBanners, {
	      value: _renderBanners2
	    });
	    Object.defineProperty(this, _sortItems, {
	      value: _sortItems2
	    });
	    Object.defineProperty(this, _isHidden, {
	      value: _isHidden2
	    });
	    Object.defineProperty(this, _normalizeItemsSort, {
	      value: _normalizeItemsSort2
	    });
	    Object.defineProperty(this, _renderItem, {
	      value: _renderItem2
	    });
	    Object.defineProperty(this, _renderVisibleItems, {
	      value: _renderVisibleItems2
	    });
	    Object.defineProperty(this, _renderBody, {
	      value: _renderBody2
	    });
	    Object.defineProperty(this, _renderContent, {
	      value: _renderContent2
	    });
	    Object.defineProperty(this, _buildPopup, {
	      value: _buildPopup2
	    });
	    Object.defineProperty(this, _bindElement, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _items, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _banners, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _itemsSort, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _analytics, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _popup, {
	      writable: true,
	      value: void 0
	    });
	    this.setEventNamespace('BX.Crm.MessageSender.ChannelSelector.Selector');
	    babelHelpers.classPrivateFieldLooseBase(this, _items)[_items] = main_core.Type.isArray(_options.items) ? _options.items : [];
	    babelHelpers.classPrivateFieldLooseBase(this, _banners)[_banners] = main_core.Type.isArray(_options.banners) ? _options.banners : [];
	    babelHelpers.classPrivateFieldLooseBase(this, _itemsSort)[_itemsSort] = main_core.Type.isArray(_options.itemsSort) ? _options.itemsSort : [];
	    babelHelpers.classPrivateFieldLooseBase(this, _normalizeItemsSort)[_normalizeItemsSort](babelHelpers.classPrivateFieldLooseBase(this, _items)[_items], babelHelpers.classPrivateFieldLooseBase(this, _itemsSort)[_itemsSort]);
	    babelHelpers.classPrivateFieldLooseBase(this, _sortItems)[_sortItems](babelHelpers.classPrivateFieldLooseBase(this, _items)[_items]);
	    babelHelpers.classPrivateFieldLooseBase(this, _bindElement)[_bindElement] = main_core.Type.isDomNode(_options.bindElement) ? _options.bindElement : null;
	    babelHelpers.classPrivateFieldLooseBase(this, _analytics)[_analytics] = main_core.Type.isPlainObject(_options.analytics) ? _options.analytics : null;
	    this.subscribeFromOptions((_options$events = _options.events) != null ? _options$events : {});
	  }
	  isShown() {
	    var _babelHelpers$classPr;
	    return Boolean((_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) == null ? void 0 : _babelHelpers$classPr.isShown());
	  }
	  show() {
	    var _babelHelpers$classPr2, _babelHelpers$classPr3;
	    (_babelHelpers$classPr3 = (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _popup))[_popup]) != null ? _babelHelpers$classPr3 : _babelHelpers$classPr2[_popup] = babelHelpers.classPrivateFieldLooseBase(this, _buildPopup)[_buildPopup]();
	    babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].show();
	  }
	  close() {
	    var _babelHelpers$classPr4;
	    (_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) == null ? void 0 : _babelHelpers$classPr4.close();
	  }
	  destroy() {
	    var _babelHelpers$classPr5;
	    (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) == null ? void 0 : _babelHelpers$classPr5.destroy();
	    this.unsubscribeAll();
	    babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] = null;
	    main_core.Runtime.destroy(this);
	  }
	}
	function _buildPopup2() {
	  return new main_popup.Popup({
	    bindElement: babelHelpers.classPrivateFieldLooseBase(this, _bindElement)[_bindElement],
	    content: babelHelpers.classPrivateFieldLooseBase(this, _renderContent)[_renderContent](),
	    autoHide: true,
	    closeByEsc: true,
	    padding: 0,
	    borderRadius: '24px',
	    minWidth: 350,
	    maxWidth: 650,
	    events: {
	      onShow: () => {
	        this.emit('onShow');
	      },
	      onClose: () => {
	        this.emit('onClose');
	      },
	      onDestroy: () => {
	        this.emit('onDestroy');
	      }
	    }
	  });
	}
	function _renderContent2() {
	  const container = main_core.Tag.render(_t || (_t = _`<div class="crm-messagesender-channel-selector"></div>`));
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _renderBody)[_renderBody](), container);
	  if (main_core.Type.isArrayFilled(babelHelpers.classPrivateFieldLooseBase(this, _banners)[_banners])) {
	    main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _renderBanners)[_renderBanners](), container);
	  }
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _renderFooter)[_renderFooter](), container);
	  return container;
	}
	function _renderBody2() {
	  return main_core.Tag.render(_t2 || (_t2 = _`
			<div class="crm-messagesender-channel-selector-body">
				<div class="crm-messagesender-channel-selector-title">${0}</div>
				<div class="crm-messagesender-channel-selector-list">${0}</div>
			</div>
		`), main_core.Loc.getMessage('CRM_MESSAGESENDER_CHANNEL_SELECTOR_ALL_CHANNELS'), babelHelpers.classPrivateFieldLooseBase(this, _renderVisibleItems)[_renderVisibleItems]());
	}
	function _renderVisibleItems2() {
	  const visible = babelHelpers.classPrivateFieldLooseBase(this, _items)[_items].filter(item => !babelHelpers.classPrivateFieldLooseBase(this, _isHidden)[_isHidden](item));
	  return visible.map(options => babelHelpers.classPrivateFieldLooseBase(this, _renderItem)[_renderItem](options));
	}
	function _renderItem2(options) {
	  const icon = new ui_iconSet_api_core.Icon({
	    icon: options.appearance.icon.title,
	    color: options.appearance.icon.color
	  });
	  const onClick = () => {
	    options.onclick == null ? void 0 : options.onclick(options);
	  };
	  const contentContainer = main_core.Tag.render(_t3 || (_t3 = _`
			<div class="crm-messagesender-channel-selector-content">
				<div
					class="
						crm-messagesender-channel-selector-item-title
						crm-messagesender-channel-selector-ellipsis
					"
					title="${0}"
				>${0}</div>
			</div>
		`), main_core.Text.encode(options.appearance.title), main_core.Text.encode(options.appearance.title));
	  if (main_core.Type.isStringFilled(options.appearance.subtitle)) {
	    main_core.Dom.append(main_core.Tag.render(_t4 || (_t4 = _`
					<div
						class="
							crm-messagesender-channel-selector-item-subtitle 
							crm-messagesender-channel-selector-ellipsis
						"
						title="${0}"
					>${0}</div>
				`), main_core.Text.encode(options.appearance.subtitle), main_core.Text.encode(options.appearance.subtitle)), contentContainer);
	  }
	  return main_core.Tag.render(_t5 || (_t5 = _`
			<div class="crm-messagesender-channel-selector-item" onclick="${0}">
				<div
					class="crm-messagesender-channel-selector-icon"
					style="background: ${0};"
				>${0}</div>
				${0}
			</div>
		`), onClick, main_core.Text.encode(options.appearance.icon.background), icon.render(), contentContainer);
	}
	function _normalizeItemsSort2(items, itemsSort) {
	  for (const item of items) {
	    if (!itemsSort.some(x => x.channelId === item.id)) {
	      itemsSort.unshift({
	        channelId: item.id,
	        isHidden: false
	      });
	    }
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _ensureMaxVisibleChannels)[_ensureMaxVisibleChannels](itemsSort);
	  babelHelpers.classPrivateFieldLooseBase(this, _ensureMinVisibleChannels)[_ensureMinVisibleChannels](itemsSort);
	}
	function _isHidden2(item) {
	  const position = babelHelpers.classPrivateFieldLooseBase(this, _itemsSort)[_itemsSort].find(x => x.channelId === item.id);
	  if (!position) {
	    throw new Error(`Position not found for item: ${item.id}`);
	  }
	  return position.isHidden;
	}
	function _sortItems2(items) {
	  items.sort((a, b) => {
	    const positionA = babelHelpers.classPrivateFieldLooseBase(this, _itemsSort)[_itemsSort].find(x => x.channelId === a.id);
	    const positionB = babelHelpers.classPrivateFieldLooseBase(this, _itemsSort)[_itemsSort].find(x => x.channelId === b.id);
	    if (positionA.isHidden && !positionB.isHidden) {
	      return 1;
	    }
	    if (!positionA.isHidden && positionB.isHidden) {
	      return -1;
	    }
	    const positionIndexA = main_core.Type.isNil(positionA) ? -1 : babelHelpers.classPrivateFieldLooseBase(this, _itemsSort)[_itemsSort].indexOf(positionA);
	    const positionIndexB = main_core.Type.isNil(positionB) ? -1 : babelHelpers.classPrivateFieldLooseBase(this, _itemsSort)[_itemsSort].indexOf(positionB);
	    return positionIndexA - positionIndexB;
	  });
	}
	function _renderBanners2() {
	  const banners = babelHelpers.classPrivateFieldLooseBase(this, _banners)[_banners].map(options => babelHelpers.classPrivateFieldLooseBase(this, _renderSingleBanner)[_renderSingleBanner](options));
	  return main_core.Tag.render(_t6 || (_t6 = _`
			<div class="crm-messagesender-channel-selector-banner-container">
				<div class="crm-messagesender-channel-selector-banner-title">${0}</div>
				<div class="crm-messagesender-channel-selector-banner-list">${0}</div>
			</div>
		`), main_core.Loc.getMessage('CRM_MESSAGESENDER_CHANNEL_SELECTOR_RECOMMENDED'), banners);
	}
	function _renderSingleBanner2(banner) {
	  let icon = null;
	  if (main_core.Type.isStringFilled(banner.customIconName) && /^[\w-]+$/.test(banner.customIconName)) {
	    const url = `/bitrix/js/crm/messagesender/channel-selector/images/custom-icons/${main_core.Text.encode(banner.customIconName)}.svg`;
	    icon = main_core.Tag.render(_t7 || (_t7 = _`
				<div class="crm-messagesender-channel-selector-icon">
					<img alt="${0}" src="${0}">
				</div>
			`), main_core.Text.encode(banner.title), url);
	  } else if (main_core.Type.isPlainObject(banner.icon)) {
	    const iconApi = new ui_iconSet_api_core.Icon({
	      icon: banner.icon.title,
	      color: banner.icon.color
	    });
	    icon = main_core.Tag.render(_t8 || (_t8 = _`
				<div
					class="crm-messagesender-channel-selector-icon"
					style="background: ${0};"
				>${0}</div>
			`), main_core.Text.encode(banner.icon.background), iconApi.render());
	  } else {
	    throw new TypeError('Banner icon is not defined');
	  }
	  const button = new ui_buttons.Button({
	    text: main_core.Loc.getMessage('CRM_MESSAGESENDER_CHANNEL_SELECTOR_CONNECT'),
	    useAirDesign: true,
	    style: ui_buttons.AirButtonStyle.OUTLINE,
	    size: ui_buttons.ButtonSize.SMALL,
	    onclick: async () => {
	      const slider = await babelHelpers.classPrivateFieldLooseBase(this, _openSlider)[_openSlider](banner.connectionUrl, {
	        width: 700
	      });
	      this.emit('onPromoBannerSliderClose', {
	        bannerId: banner.id,
	        connectStatus: slider.getData().get('status')
	      });
	    }
	  });
	  return main_core.Tag.render(_t9 || (_t9 = _`
			<div class="crm-messagesender-channel-selector-item" style="background: ${0};">
				${0}
				<div class="crm-messagesender-channel-selector-content">
					<div
						class="
							crm-messagesender-channel-selector-item-title 
							crm-messagesender-channel-selector-ellipsis
						"
						title="${0}"
					>${0}</div>
					<div 
						class="
							crm-messagesender-channel-selector-item-subtitle 
							crm-messagesender-channel-selector-ellipsis
						"
						title="${0}"
					>${0}</div>
				</div>
				<div class="crm-messagesender-channel-selector-banner-link">${0}</div>
			</div>
		`), main_core.Text.encode(banner.background), icon, main_core.Text.encode(banner.title), main_core.Text.encode(banner.title), main_core.Text.encode(banner.subtitle), main_core.Text.encode(banner.subtitle), button.render());
	}
	function _renderFooter2() {
	  const addButton = new ui_buttons.Button({
	    text: main_core.Loc.getMessage('CRM_MESSAGESENDER_CHANNEL_SELECTOR_ADD_CHANNEL'),
	    useAirDesign: true,
	    style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
	    size: ui_buttons.ButtonSize.SMALL,
	    icon: ui_iconSet_api_core.Outline.PLUS_L,
	    onclick: async () => {
	      await babelHelpers.classPrivateFieldLooseBase(this, _openMessageSenderConnectionsSlider)[_openMessageSenderConnectionsSlider]();
	      this.emit('onConnectionsSliderClose');
	    }
	  });
	  const configureButton = new ui_buttons.Button({
	    text: main_core.Loc.getMessage('CRM_MESSAGESENDER_CHANNEL_SELECTOR_CONFIGURE'),
	    useAirDesign: true,
	    style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
	    size: ui_buttons.ButtonSize.SMALL,
	    icon: ui_iconSet_api_core.Outline.SETTINGS,
	    onclick: () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _enterEditMode)[_enterEditMode]();
	    }
	  });
	  return main_core.Tag.render(_t10 || (_t10 = _`
			<div class="crm-messagesender-channel-selector-footer">
				${0}
				${0}
			</div>
		`), addButton.render(), configureButton.render());
	}
	async function _openMessageSenderConnectionsSlider2() {
	  const {
	    Router
	  } = await main_core.Runtime.loadExtension('crm.router');

	  /** @see BX.Crm.Router.openMessageSenderConnectionsSlider */
	  return Router.Instance.openMessageSenderConnectionsSlider(babelHelpers.classPrivateFieldLooseBase(this, _analytics)[_analytics]);
	}
	function _openSlider2(url, options = null) {
	  return main_core.Runtime.loadExtension('crm.router').then(({
	    Router
	  }) => {
	    /** @see BX.Crm.Router.openSlider */
	    return Router.openSlider(url, options);
	  }).catch(error => {
	    console.error('cant load crm.router', error);
	    throw error;
	  });
	}
	function _enterEditMode2() {
	  const wasShown = this.isShown();
	  main_core.Runtime.loadExtension('ui.menu-configurable').then(({
	    Menu
	  }) => {
	    const items = babelHelpers.classPrivateFieldLooseBase(this, _items)[_items].map(item => {
	      const html = main_core.Tag.render(_t11 || (_t11 = _`
						<span>
							<span
								class="crm-messagesender-channel-selector-ellipsis"
								title="${0}"
							>${0}</span>
						</span>
					`), main_core.Text.encode(item.appearance.title), main_core.Text.encode(item.appearance.title));
	      if (main_core.Type.isStringFilled(item.appearance.subtitle)) {
	        main_core.Dom.append(main_core.Tag.render(_t12 || (_t12 = _`
								<span
									class="
										crm-messagesender-channel-selector-edit-item-subtitle 
										crm-messagesender-channel-selector-ellipsis
									"
									title="${0}"
								>${0}</span>
							`), main_core.Text.encode(item.appearance.subtitle), main_core.Text.encode(item.appearance.subtitle)), html);
	      }
	      return {
	        id: item.id,
	        isHidden: babelHelpers.classPrivateFieldLooseBase(this, _isHidden)[_isHidden](item),
	        html
	      };
	    });

	    /** @see BX.UI.MenuConfigurable.Menu */
	    const menu = new Menu({
	      items,
	      bindElement: babelHelpers.classPrivateFieldLooseBase(this, _bindElement)[_bindElement],
	      maxVisibleItems: babelHelpers.classPrivateFieldLooseBase(this, _getMaxVisibleChannels)[_getMaxVisibleChannels](),
	      maxWidth: 600
	    });
	    this.close();
	    return menu.open();
	  }).then(openResult => {
	    if (!openResult.isCanceled && main_core.Type.isArray(openResult == null ? void 0 : openResult.items)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _save)[_save](openResult.items);
	    }
	    if (wasShown) {
	      this.show();
	    }
	  }).catch(error => {
	    console.error('cant load ui.menu-configurable', error);
	  });
	}
	function _getMaxVisibleChannels2() {
	  const settings = main_core.Extension.getSettings('crm.messagesender.channel-selector');
	  return main_core.Text.toInteger(settings.get('maxVisibleChannels'));
	}
	function _getMinVisibleChannels2() {
	  const settings = main_core.Extension.getSettings('crm.messagesender.channel-selector');
	  return main_core.Text.toInteger(settings.get('minVisibleChannels'));
	}
	function _save2(editItems) {
	  var _babelHelpers$classPr6;
	  babelHelpers.classPrivateFieldLooseBase(this, _ensureMinVisibleChannels)[_ensureMinVisibleChannels](editItems);
	  babelHelpers.classPrivateFieldLooseBase(this, _updateItemsSort)[_updateItemsSort](editItems);
	  (_babelHelpers$classPr6 = babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) == null ? void 0 : _babelHelpers$classPr6.setContent(babelHelpers.classPrivateFieldLooseBase(this, _renderContent)[_renderContent]());
	  this.emit('onSave', {
	    itemsSort: babelHelpers.classPrivateFieldLooseBase(this, _itemsSort)[_itemsSort]
	  });
	}
	function _ensureMinVisibleChannels2(positions) {
	  const visibleCount = positions.filter(item => !item.isHidden).length;
	  if (visibleCount >= babelHelpers.classPrivateFieldLooseBase(this, _getMinVisibleChannels)[_getMinVisibleChannels]()) {
	    return;
	  }
	  const toShow = babelHelpers.classPrivateFieldLooseBase(this, _getMinVisibleChannels)[_getMinVisibleChannels]() - visibleCount;
	  let shown = 0;
	  for (const item of positions) {
	    if (item.isHidden) {
	      item.isHidden = false;
	      shown += 1;
	    }
	    if (shown >= toShow) {
	      return;
	    }
	  }
	}
	function _ensureMaxVisibleChannels2(positions) {
	  const visible = positions.filter(item => !item.isHidden);
	  if (visible.length <= babelHelpers.classPrivateFieldLooseBase(this, _getMaxVisibleChannels)[_getMaxVisibleChannels]()) {
	    return;
	  }
	  const toHide = visible.slice(babelHelpers.classPrivateFieldLooseBase(this, _getMaxVisibleChannels)[_getMaxVisibleChannels](), visible.length);
	  for (const item of toHide) {
	    item.isHidden = true;
	  }
	}
	function _updateItemsSort2(editItems) {
	  babelHelpers.classPrivateFieldLooseBase(this, _itemsSort)[_itemsSort] = editItems.map(item => {
	    return {
	      channelId: item.id,
	      isHidden: item.isHidden
	    };
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _normalizeItemsSort)[_normalizeItemsSort](babelHelpers.classPrivateFieldLooseBase(this, _items)[_items], babelHelpers.classPrivateFieldLooseBase(this, _itemsSort)[_itemsSort]);
	  babelHelpers.classPrivateFieldLooseBase(this, _sortItems)[_sortItems](babelHelpers.classPrivateFieldLooseBase(this, _items)[_items]);
	}

	exports.Selector = Selector;

}((this.BX.Crm.MessageSender.ChannelSelector = this.BX.Crm.MessageSender.ChannelSelector || {}),BX,BX.Event,BX.Main,BX.UI,BX.UI.IconSet));
//# sourceMappingURL=channel-selector.bundle.js.map
