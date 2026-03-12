/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,main_polyfill_intersectionobserver,im_v2_provider_service_notification,im_v2_component_elements_userListPopup,im_v2_component_elements_loader,im_v2_lib_theme,im_v2_lib_rest,im_v2_provider_service_settings,im_v2_lib_notifier,im_v2_lib_analytics,im_v2_lib_utils,im_v2_component_elements_attach,im_v2_lib_dateFormatter,im_v2_component_elements_avatar,ui_reactionsSelect,im_v2_lib_parser,im_public,im_v2_component_elements_chatTitle,ui_vue3_vuex,ui_system_chip_vue,im_v2_component_elements_popup,ui_vue3_components_button,ui_iconSet_api_core,ui_entitySelector,main_core_events,main_popup,ui_system_menu,ui_datePicker,ui_system_input_vue,ui_iconSet_api_vue,im_v2_css_classes,main_core,im_v2_application_core,im_v2_lib_user,im_v2_lib_logger,im_v2_const) {
	'use strict';

	class NotificationReadService {
	  constructor() {
	    this.itemsToRead = new Set();
	    this.changeReadStatusBlockTimeout = {};
	    this.store = im_v2_application_core.Core.getStore();
	    this.restClient = im_v2_application_core.Core.getRestClient();
	    this.readOnClientWithDebounce = main_core.Runtime.debounce(this.readOnClient, 50, this);
	    this.readRequestWithDebounce = main_core.Runtime.debounce(this.readRequest, 500, this);
	  }
	  addToReadQueue(notificationIds) {
	    if (!main_core.Type.isArrayFilled(notificationIds)) {
	      return;
	    }
	    notificationIds.forEach(id => {
	      if (!main_core.Type.isNumber(id)) {
	        return;
	      }
	      const notification = this.store.getters['notifications/getById'](id);
	      if (notification.read) {
	        return;
	      }
	      this.itemsToRead.add(id);
	    });
	  }
	  read() {
	    this.readOnClientWithDebounce();
	    this.readRequestWithDebounce();
	  }
	  readRequest() {
	    if (this.itemsToRead.size === 0) {
	      return;
	    }
	    const allNotifications = this.store.getters['notifications/getSortedCollection'];
	    const confirmNotifications = allNotifications.filter(notification => {
	      return notification.sectionCode === im_v2_const.NotificationTypesCodes.confirm;
	    });
	    const confirmNotificationIds = new Set(confirmNotifications.map(notification => notification.id));
	    const allIdsToRead = [...this.itemsToRead];
	    const notificationsToReadIds = allIdsToRead.filter(id => {
	      return !confirmNotificationIds.has(id);
	    });
	    if (notificationsToReadIds.length === 0) {
	      this.itemsToRead.clear();
	      return;
	    }
	    const params = {
	      ids: notificationsToReadIds
	    };
	    im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2NotifyRead, {
	      data: params
	    }).then(response => {
	      im_v2_lib_logger.Logger.warn(`I have read all the notifications, total: ${notificationsToReadIds.length}`, response);
	    }).catch(result => {
	      console.error('NotificationReadService: readRequest error', result.error());
	    });
	    this.itemsToRead.clear();
	  }
	  readOnClient() {
	    this.store.dispatch('notifications/read', {
	      ids: [...this.itemsToRead],
	      read: true
	    });
	  }
	  readAll(excludeIds = []) {
	    this.store.dispatch('notifications/readAllSimple', {
	      excludeIds
	    });
	    const params = {
	      ids: excludeIds
	    };
	    im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2NotifyReadAll, {
	      data: params
	    }).then(response => {
	      const currentCounter = this.store.getters['notifications/getCounter'];
	      const newCounter = response.counter;
	      if (newCounter < currentCounter) {
	        void this.store.dispatch('notifications/setCounter', newCounter);
	      }
	      im_v2_lib_logger.Logger.warn(`I have read ALL the notifications, excluded: ${excludeIds.length}`, response);
	    }).catch(result => {
	      console.error('NotificationReadService: readAll error', result);
	    });
	  }
	  changeReadStatus(notificationId) {
	    let notification = this.store.getters['notifications/getById'](notificationId);
	    let fromSearchCollection = false;
	    if (!notification) {
	      notification = this.store.getters['notifications/getSearchItemById'](notificationId);
	      fromSearchCollection = true;
	    }
	    if (!notification) {
	      return;
	    }
	    if (fromSearchCollection) {
	      this.store.commit('notifications/updateSearchResult', [{
	        id: notification.id,
	        fields: {
	          read: !notification.read
	        }
	      }]);
	    } else {
	      this.store.dispatch('notifications/read', {
	        ids: [notification.id],
	        read: !notification.read
	      });
	    }
	    clearTimeout(this.changeReadStatusBlockTimeout[notification.id]);
	    this.changeReadStatusBlockTimeout[notification.id] = setTimeout(() => {
	      this.restClient.callMethod(im_v2_const.RestMethod.imNotifyRead, {
	        id: notification.id,
	        action: notification.read ? 'N' : 'Y',
	        only_current: 'Y'
	      }).then(() => {
	        im_v2_lib_logger.Logger.warn(`Notification ${notification.id} unread status set to ${!notification.read}`);
	      }).catch(result => {
	        console.error('NotificationReadService: changeReadStatus error', result.error());
	        // revert?
	      });
	    }, 1500);
	  }
	  destroy() {
	    im_v2_lib_logger.Logger.warn('Notification read service destroyed');
	  }
	}

	class NotificationHeaderMenu {
	  constructor() {
	    this.notificationReadService = new NotificationReadService();
	    this.store = im_v2_application_core.Core.getStore();
	  }
	  openMenu(isReadAllAvailable, bindElement) {
	    if (this.menu) {
	      this.menu.destroy();
	      this.menu = null;
	    }
	    this.menu = new ui_system_menu.Menu({
	      id: 'im-notifications-header-menu',
	      items: this.getHeaderMenuItems(isReadAllAvailable),
	      closeOnItemClick: true,
	      autoHide: true
	    });
	    this.menu.show(bindElement);
	  }
	  getHeaderMenuItems(isReadAllAvailable) {
	    return [this.getOptionsItem(), this.getReadAllItem(isReadAllAvailable)];
	  }
	  getReadAllItem(isReadAllAvailable) {
	    return {
	      title: main_core.Loc.getMessage('IM_NOTIFICATIONS_READ_ALL_BUTTON'),
	      design: isReadAllAvailable ? ui_system_menu.MenuItemDesign.Default : ui_system_menu.MenuItemDesign.Disabled,
	      onClick: () => {
	        this.notificationReadService.readAll();
	        this.menu.close();
	      }
	    };
	  }
	  getOptionsItem() {
	    return {
	      title: main_core.Loc.getMessage('IM_NOTIFICATIONS_OPTIONS_BUTTON'),
	      onClick: () => {
	        void im_public.Messenger.openSettings({
	          onlyPanel: im_v2_const.SettingsSection.notification
	        });
	        this.menu.close();
	      }
	    };
	  }
	  destroy() {
	    if (this.menu) {
	      this.menu.destroy();
	      this.menu = null;
	    }
	    if (this.notificationReadService) {
	      this.notificationReadService.destroy();
	    }
	  }
	}

	var _onCloseMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onCloseMenu");
	var _getMenuItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMenuItems");
	var _getMarkAsUnreadItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMarkAsUnreadItem");
	var _getUnSubscribeItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getUnSubscribeItem");
	var _getCurrentItemSettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCurrentItemSettings");
	var _getParsedSettingName = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getParsedSettingName");
	var _isAtLeastWebEnabled = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isAtLeastWebEnabled");
	var _hasNotificationButtons = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasNotificationButtons");
	var _getSubscribedTypes = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getSubscribedTypes");
	var _areSubscribedTypesExist = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("areSubscribedTypesExist");
	var _getNotificationSettingsTypeValues = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getNotificationSettingsTypeValues");
	var _shouldShowItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("shouldShowItem");
	var _getLastSubscribedTypes = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getLastSubscribedTypes");
	class NotificationMenu {
	  static closeMenuOnScroll() {
	    try {
	      var _NotificationMenu$las;
	      (_NotificationMenu$las = NotificationMenu.lastMenu) == null ? void 0 : _NotificationMenu$las.close();
	    } catch (e) {
	      console.error(e);
	    } finally {
	      NotificationMenu.lastMenu = null;
	      NotificationMenu.lastMenuId = null;
	    }
	  }
	  constructor({
	    store
	  }) {
	    Object.defineProperty(this, _getLastSubscribedTypes, {
	      value: _getLastSubscribedTypes2
	    });
	    Object.defineProperty(this, _shouldShowItem, {
	      value: _shouldShowItem2
	    });
	    Object.defineProperty(this, _getNotificationSettingsTypeValues, {
	      value: _getNotificationSettingsTypeValues2
	    });
	    Object.defineProperty(this, _areSubscribedTypesExist, {
	      value: _areSubscribedTypesExist2
	    });
	    Object.defineProperty(this, _getSubscribedTypes, {
	      value: _getSubscribedTypes2
	    });
	    Object.defineProperty(this, _hasNotificationButtons, {
	      value: _hasNotificationButtons2
	    });
	    Object.defineProperty(this, _isAtLeastWebEnabled, {
	      value: _isAtLeastWebEnabled2
	    });
	    Object.defineProperty(this, _getParsedSettingName, {
	      value: _getParsedSettingName2
	    });
	    Object.defineProperty(this, _getCurrentItemSettings, {
	      value: _getCurrentItemSettings2
	    });
	    Object.defineProperty(this, _getUnSubscribeItem, {
	      value: _getUnSubscribeItem2
	    });
	    Object.defineProperty(this, _getMarkAsUnreadItem, {
	      value: _getMarkAsUnreadItem2
	    });
	    Object.defineProperty(this, _getMenuItems, {
	      value: _getMenuItems2
	    });
	    Object.defineProperty(this, _onCloseMenu, {
	      value: _onCloseMenu2
	    });
	    this.store = store;
	  }
	  openMenu(notificationItem, bindElement) {
	    var _NotificationMenu$las2;
	    if (NotificationMenu.lastMenu && NotificationMenu.lastMenuId === notificationItem.id && (_NotificationMenu$las2 = NotificationMenu.lastMenu.getPopup()) != null && _NotificationMenu$las2.isShown()) {
	      NotificationMenu.lastMenu.close();
	      NotificationMenu.lastMenu = null;
	      NotificationMenu.lastMenuId = null;
	      return;
	    }
	    if (this.menu) {
	      this.menu.destroy();
	      this.menu = null;
	    }
	    this.notificationItem = notificationItem;
	    const items = babelHelpers.classPrivateFieldLooseBase(this, _getMenuItems)[_getMenuItems]();
	    if (items.length === 0) {
	      return;
	    }
	    this.menu = new ui_system_menu.Menu({
	      id: `im-notification-menu-${this.notificationItem.id}`,
	      items,
	      events: {
	        onClose: () => {
	          if (NotificationMenu.lastMenu === this.menu) {
	            babelHelpers.classPrivateFieldLooseBase(this, _onCloseMenu)[_onCloseMenu]();
	          }
	        },
	        onDestroy: () => {
	          if (NotificationMenu.lastMenu === this.menu) {
	            babelHelpers.classPrivateFieldLooseBase(this, _onCloseMenu)[_onCloseMenu]();
	          }
	        }
	      }
	    });
	    this.menu.show(bindElement);
	    NotificationMenu.lastMenu = this.menu;
	    NotificationMenu.lastMenuId = this.notificationItem.id;
	  }
	  async toggleSubscription() {
	    const currentSettings = babelHelpers.classPrivateFieldLooseBase(this, _getCurrentItemSettings)[_getCurrentItemSettings]();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _areSubscribedTypesExist)[_areSubscribedTypesExist]()) {
	      const typesToRestore = babelHelpers.classPrivateFieldLooseBase(this, _getLastSubscribedTypes)[_getLastSubscribedTypes]();
	      const settingsToUnsubscribe = {
	        ...babelHelpers.classPrivateFieldLooseBase(this, _getParsedSettingName)[_getParsedSettingName](),
	        lastSubscribedTypes: babelHelpers.classPrivateFieldLooseBase(this, _getLastSubscribedTypes)[_getLastSubscribedTypes](),
	        shouldSubscribe: false
	      };
	      void new im_v2_provider_service_settings.SettingsService().toggleSubscription(settingsToUnsubscribe);
	      im_v2_lib_notifier.Notifier.notification.onUnsubscribeComplete(currentSettings.label, (event, balloon) => {
	        const settingsToResubscribe = {
	          ...babelHelpers.classPrivateFieldLooseBase(this, _getParsedSettingName)[_getParsedSettingName](),
	          lastSubscribedTypes: typesToRestore,
	          shouldSubscribe: true
	        };
	        void new im_v2_provider_service_settings.SettingsService().toggleSubscription(settingsToResubscribe);
	        balloon.close();
	      });
	      im_v2_lib_analytics.Analytics.getInstance().notification.onUnsubscribeFromNotification({
	        moduleId: settingsToUnsubscribe.notifyModule,
	        optionName: settingsToUnsubscribe.notifyEvent
	      });
	    } else {
	      const settingsToSubscribe = {
	        ...babelHelpers.classPrivateFieldLooseBase(this, _getParsedSettingName)[_getParsedSettingName](),
	        lastSubscribedTypes: babelHelpers.classPrivateFieldLooseBase(this, _getLastSubscribedTypes)[_getLastSubscribedTypes](),
	        shouldSubscribe: true
	      };
	      void new im_v2_provider_service_settings.SettingsService().toggleSubscription(settingsToSubscribe);
	      im_v2_lib_notifier.Notifier.notification.onSubscribeComplete(currentSettings.label);
	    }
	  }
	  isEmpty(notificationItem) {
	    const prevItem = this.notificationItem;
	    this.notificationItem = notificationItem;
	    const items = babelHelpers.classPrivateFieldLooseBase(this, _getMenuItems)[_getMenuItems]();
	    this.notificationItem = prevItem;
	    return items.length === 0;
	  }
	}
	function _onCloseMenu2() {
	  NotificationMenu.lastMenu = null;
	  NotificationMenu.lastMenuId = null;
	}
	function _getMenuItems2() {
	  return [babelHelpers.classPrivateFieldLooseBase(this, _getUnSubscribeItem)[_getUnSubscribeItem](), babelHelpers.classPrivateFieldLooseBase(this, _getMarkAsUnreadItem)[_getMarkAsUnreadItem]()].filter(Boolean);
	}
	function _getMarkAsUnreadItem2() {
	  return {
	    title: this.notificationItem.read ? main_core.Loc.getMessage('IM_NOTIFICATIONS_ITEM_MENU_MARK_UNREAD') : main_core.Loc.getMessage('IM_NOTIFICATIONS_ITEM_MENU_MARK_READ'),
	    onClick: () => {
	      main_core.Event.EventEmitter.emit(NotificationMenu.events.markAsUnreadClick, this.notificationItem);
	    }
	  };
	}
	function _getUnSubscribeItem2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _shouldShowItem)[_shouldShowItem]()) {
	    return null;
	  }
	  return {
	    title: babelHelpers.classPrivateFieldLooseBase(this, _areSubscribedTypesExist)[_areSubscribedTypesExist]() ? main_core.Loc.getMessage('IM_NOTIFICATIONS_ITEM_MENU_UNSUBSCRIBE') : main_core.Loc.getMessage('IM_NOTIFICATIONS_ITEM_MENU_SUBSCRIBE'),
	    onClick: () => {
	      this.toggleSubscription();
	    }
	  };
	}
	function _getCurrentItemSettings2() {
	  var _notificationsSetting;
	  const notificationsSettings = this.store.getters['application/settings/get'](im_v2_const.Settings.notifications);
	  const {
	    notifyModule,
	    notifyEvent
	  } = babelHelpers.classPrivateFieldLooseBase(this, _getParsedSettingName)[_getParsedSettingName]();
	  return (_notificationsSetting = notificationsSettings[notifyModule]) == null ? void 0 : _notificationsSetting.items[notifyEvent];
	}
	function _getParsedSettingName2() {
	  const {
	    settingName
	  } = this.notificationItem;
	  const [notifyModule, notifyEvent] = settingName.split('|');
	  return {
	    notifyModule,
	    notifyEvent
	  };
	}
	function _isAtLeastWebEnabled2() {
	  return !babelHelpers.classPrivateFieldLooseBase(this, _getCurrentItemSettings)[_getCurrentItemSettings]().disabled.includes(im_v2_const.NotificationSettingsType.web);
	}
	function _hasNotificationButtons2() {
	  return this.notificationItem.notifyButtons && this.notificationItem.notifyButtons.length > 0;
	}
	function _getSubscribedTypes2() {
	  const settings = babelHelpers.classPrivateFieldLooseBase(this, _getCurrentItemSettings)[_getCurrentItemSettings]();
	  return babelHelpers.classPrivateFieldLooseBase(this, _getNotificationSettingsTypeValues)[_getNotificationSettingsTypeValues]().filter(type => {
	    return !settings.disabled.includes(type) && settings[type] === true;
	  });
	}
	function _areSubscribedTypesExist2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _getSubscribedTypes)[_getSubscribedTypes]().length > 0;
	}
	function _getNotificationSettingsTypeValues2() {
	  return Object.values(im_v2_const.NotificationSettingsType);
	}
	function _shouldShowItem2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _getCurrentItemSettings)[_getCurrentItemSettings]() && babelHelpers.classPrivateFieldLooseBase(this, _isAtLeastWebEnabled)[_isAtLeastWebEnabled]() && !babelHelpers.classPrivateFieldLooseBase(this, _hasNotificationButtons)[_hasNotificationButtons]();
	}
	function _getLastSubscribedTypes2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _areSubscribedTypesExist)[_areSubscribedTypesExist]()) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _getSubscribedTypes)[_getSubscribedTypes]();
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isAtLeastWebEnabled)[_isAtLeastWebEnabled]()) {
	    return [im_v2_const.NotificationSettingsType.web];
	  }
	  return [];
	}
	NotificationMenu.events = {
	  markAsUnreadClick: 'markAsUnreadClick'
	};
	NotificationMenu.lastMenu = null;
	NotificationMenu.lastMenuId = null;

	const NotificationType = Object.freeze({
	  changed: 'changed',
	  grid: 'grid',
	  text: 'text',
	  users: 'users',
	  title: 'title'
	});
	const DefaultNotificationIconTitleClass = Object.freeze({
	  calendar: '--o-calendar-with-slots',
	  task: '--o-task'
	});
	const CrmNotificationIconTitleClass = Object.freeze({
	  default: '--o-crm',
	  deal: '--o-handshake',
	  lead: '--o-lead',
	  contact: '--o-contact',
	  quote: '--o-file',
	  company: '--o-company',
	  order: '--o-box',
	  process: '--o-smart-process',
	  call: '--o-phone-up',
	  task: '--o-complete-task-list',
	  meeting: '--o-calendar-with-slots',
	  mail: '--o-mail',
	  invoice: '--o-invoice'
	});
	const SonetNotificationIconTitleClass = Object.freeze({
	  newsfeed: '--o-newsfeed',
	  wiki: '--wiki',
	  vote: '--o-complete-task-list',
	  group: '--o-three-persons'
	});
	const BizprocNotificationIconTitleClass = Object.freeze({
	  bizproc: '--o-business-process',
	  customSection: '--o-activity'
	});

	// @vue/component
	const DetailedAdditionalText = {
	  name: 'DetailedAdditionalText',
	  props: {
	    notificationParams: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    params() {
	      return this.notificationParams;
	    },
	    text() {
	      var _this$params$entity$c, _this$params$entity, _this$params$entity$c2;
	      const text = (_this$params$entity$c = (_this$params$entity = this.params.entity) == null ? void 0 : (_this$params$entity$c2 = _this$params$entity.content) == null ? void 0 : _this$params$entity$c2.additionalText) != null ? _this$params$entity$c : '';
	      return im_v2_lib_parser.Parser.decodeNotificationParam(text);
	    },
	    hasAdditionalText() {
	      return this.text.length > 0;
	    }
	  },
	  template: `
		<div v-if="hasAdditionalText" class="bx-im-content-notification-item-content__grid-additional-container">
			<span v-html="text" class="bx-im-content-notification-item-content__grid-additional-text"/>
		</div>
	`
	};

	const gridIconClassesMap = {
	  date: ui_iconSet_api_vue.Outline.CALENDAR_WITH_SLOTS,
	  place: ui_iconSet_api_vue.Outline.MEETING_POINT,
	  repeat: ui_iconSet_api_vue.Outline.REPEAT,
	  user: ui_iconSet_api_vue.Outline.PERSON,
	  default: ui_iconSet_api_vue.Outline.INFO_CIRCLE
	};
	const NotificationGridItemTypeIcon = Object.freeze({
	  user: 'user',
	  place: 'place',
	  date: 'date',
	  repeat: 'repeat'
	});
	// @vue/component
	const DetailedGrid = {
	  name: 'DetailedGrid',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    DetailedAdditionalText
	  },
	  props: {
	    notificationParams: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    params() {
	      return this.notificationParams;
	    },
	    notificationType() {
	      var _this$params$entity$c, _this$params$entity;
	      return (_this$params$entity$c = (_this$params$entity = this.params.entity) == null ? void 0 : _this$params$entity.contentType) != null ? _this$params$entity$c : null;
	    },
	    content() {
	      return this.params.entity.content;
	    },
	    isGridType() {
	      return this.notificationType === NotificationType.grid;
	    },
	    items() {
	      return this.content.items;
	    },
	    formattedItems() {
	      return this.items.map(item => {
	        if (item.type !== 'user') {
	          return item;
	        }
	        return {
	          ...item,
	          user: this.$store.getters['users/get'](Number(item.value))
	        };
	      });
	    }
	  },
	  methods: {
	    getIconClass(itemType) {
	      return gridIconClassesMap[itemType] || gridIconClassesMap.default;
	    },
	    getUserImage(item) {
	      return {
	        backgroundImage: `url('${item.user.avatar}')`
	      };
	    },
	    getItemValue(item) {
	      if (item.type === 'user' && item.user) {
	        return item.user.name;
	      }
	      return im_v2_lib_parser.Parser.decodeNotificationParam(item.value);
	    },
	    getItemTitle(item) {
	      if (item.type === 'user' && item.user) {
	        return item.user.name;
	      }
	      return im_v2_lib_parser.Parser.purify({
	        text: item.value
	      });
	    },
	    isUserItem(item) {
	      return item.type === 'user' && item.user;
	    },
	    isUserHasAvatar(item) {
	      return item.type === 'user' && item.user.avatar;
	    },
	    getUserLink(user) {
	      return im_v2_lib_utils.Utils.user.getProfileLink(user.id);
	    }
	  },
	  template: `
		<div v-if="isGridType" class="bx-im-content-notification-item-content__details-block">
			<template v-for="(item, index) in formattedItems" :key="index">
				<div class="bx-im-content-notification-item-content__details-name"> {{ item.title }}</div>
				<div class="bx-im-content-notification-item-content__details-value">
					<template v-if="isUserHasAvatar(item)">
						<span
							class="bx-im-content-notification-item-content__details-icon ui-icon-set --user"
							:style="getUserImage(item)"
						></span>
					</template>
					<template v-else>
						<BIcon
							v-if="getIconClass(item.type)"
							class="bx-im-content-notification-item-content__details-icon"
							:name="getIconClass(item.type)"
							:size="16"
						/>
					</template>
					<template v-if="isUserItem(item)">
						<a
							:href="getUserLink(item.user)"
							class="bx-im-content-notification-item-content__details-text"
						>
							{{ getItemValue(item) }}
						</a>
					</template>
					<template v-else>
						<span
							class="bx-im-content-notification-item-content__details-text"
							:title="getItemTitle(item)"
							v-html="getItemValue(item)"
						>
						</span>
					</template>
				</div>
			</template>
		</div>
		<DetailedAdditionalText :notificationParams="notificationParams"/>
	`
	};

	// @vue/component
	const DetailedText = {
	  name: 'DetailedText',
	  props: {
	    notificationParams: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    params() {
	      return this.notificationParams;
	    },
	    notificationType() {
	      var _this$params$entity$c;
	      return (_this$params$entity$c = this.params.entity.contentType) != null ? _this$params$entity$c : null;
	    },
	    content() {
	      return this.params.entity.content;
	    },
	    isTextType() {
	      return this.notificationType === NotificationType.text;
	    },
	    valueText() {
	      var _this$content;
	      return im_v2_lib_parser.Parser.decodeNotificationParam(((_this$content = this.content) == null ? void 0 : _this$content.value) || '');
	    }
	  },
	  template: `
		<div v-if="isTextType" class="bx-im-content-notification-item-content__details-item">
			<span v-html="valueText" class="bx-im-content-notification-item-content__details-text --line-clamp-3"/>
		</div>
	`
	};

	// @vue/component
	const DetailedTitle = {
	  name: 'DetailedTitle',
	  props: {
	    notificationParams: {
	      type: Object,
	      required: true
	    },
	    icon: {
	      type: String,
	      default: ''
	    },
	    color: {
	      type: String,
	      default: ''
	    }
	  },
	  computed: {
	    params() {
	      return this.notificationParams;
	    },
	    title() {
	      return this.params.entity.title || '';
	    },
	    href() {
	      return this.params.entity.href || '';
	    },
	    showDetailedTitle() {
	      return this.title !== '';
	    },
	    hasHref() {
	      return Boolean(this.href);
	    }
	  },
	  template: `
		<div v-if="showDetailedTitle" class="bx-im-content-notification-item-content__details-header">
			<span
				class="ui-icon-set"
				:class="icon"
				:style="color ? { '--ui-icon-set__icon-color': color } : {}"
			></span>
			<a
				v-if="hasHref"
				:href="href"
				class="bx-im-content-notification-item-content__details-title --line-clamp-2"
			>{{ title }}</a>
			<span
				v-else
				class="bx-im-content-notification-item-content__details-title --line-clamp-2"
			>{{ title }}</span>
		</div>
	`
	};

	// @vue/component
	const DetailedChangedValue = {
	  name: 'DetailedChangedValue',
	  props: {
	    notificationParams: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    params() {
	      return this.notificationParams;
	    },
	    notificationType() {
	      var _this$params$entity$c;
	      return (_this$params$entity$c = this.params.entity.contentType) != null ? _this$params$entity$c : null;
	    },
	    content() {
	      return this.params.entity.content;
	    },
	    isChangedType() {
	      return this.notificationType === NotificationType.changed;
	    },
	    prevValue() {
	      return this.content.prev;
	    },
	    nextValue() {
	      return this.content.next;
	    }
	  },
	  template: `
		<div v-if="isChangedType" class="bx-im-content-notification-item-content__details-item --changed">
			<div class="bx-im-content-notification-item-content__details-content --prev">
				<span>
					{{ prevValue }}
					<span class="bx-im-content-notification-item-content__details-arrow ui-icon-set --arrow-right-m"></span>
				</span>
			</div>
			<div class="bx-im-content-notification-item-content__details-content">{{ nextValue }}</div>
		</div>
	`
	};

	const MAX_USERS_TO_DISPLAY = 2;

	// @vue/component
	const DetailedUsers = {
	  name: 'DetailedUsers',
	  props: {
	    notificationParams: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    params() {
	      return this.notificationParams;
	    },
	    notificationType() {
	      var _this$params$entity$c;
	      return (_this$params$entity$c = this.params.entity.contentType) != null ? _this$params$entity$c : null;
	    },
	    content() {
	      return this.params.entity.content;
	    },
	    isUsersType() {
	      return this.notificationType === NotificationType.users;
	    },
	    text() {
	      return this.content.text;
	    },
	    allUserIds() {
	      return this.content.ids;
	    },
	    usersToDisplay() {
	      const users = this.allUserIds.slice(0, MAX_USERS_TO_DISPLAY);
	      return users.map(id => this.$store.getters['users/get'](id));
	    },
	    remainingCount() {
	      return this.allUserIds.length - MAX_USERS_TO_DISPLAY;
	    },
	    formattedText() {
	      let result = this.text.replace('#USER_LIST#', () => {
	        return this.usersToDisplay.map(user => this.getUserLink(user)).join(', ');
	      });
	      if (this.link) {
	        result = result.replace('[link]', `<a href="${this.link}" class="bx-im-content-notification-item-content__details-link" target="_self">`).replace('#COUNT#', this.remainingCount).replace('[/link]', '</a>');
	      } else {
	        result = result.replace('#COUNT#', this.remainingCount);
	      }
	      return result;
	    },
	    link() {
	      var _this$params$entity$h;
	      return (_this$params$entity$h = this.params.entity.href) != null ? _this$params$entity$h : null;
	    }
	  },
	  methods: {
	    getUserLink(user) {
	      const userHref = im_v2_lib_utils.Utils.user.getProfileLink(user.id);
	      const name = main_core.Text.encode(user.name);
	      return main_core.Dom.create({
	        tag: 'a',
	        props: {
	          className: 'bx-im-content-notification-item-content__details-link',
	          href: userHref,
	          target: '_self'
	        },
	        text: name
	      }).outerHTML;
	    }
	  },
	  template: `
		<div
			v-if="isUsersType"
			class="bx-im-content-notification-item-content__details-users"
			v-html="formattedText"
		>
		</div>
	`
	};

	// @vue/component
	const QuickAnswer = {
	  name: 'QuickAnswer',
	  components: {
	    UiButton: ui_vue3_components_button.Button
	  },
	  props: {
	    notification: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['sendQuickAnswer'],
	  data() {
	    return {
	      quickAnswerText: '',
	      quickAnswerResultMessage: '',
	      showQuickAnswer: false,
	      isSending: false,
	      successSentQuickAnswer: false
	    };
	  },
	  computed: {
	    ButtonSize: () => ui_vue3_components_button.ButtonSize,
	    ButtonColor: () => ui_vue3_components_button.ButtonColor,
	    AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle
	  },
	  methods: {
	    toggleQuickAnswer() {
	      if (this.successSentQuickAnswer) {
	        this.showQuickAnswer = true;
	        this.successSentQuickAnswer = false;
	        this.quickAnswerResultMessage = '';
	      } else {
	        this.showQuickAnswer = !this.showQuickAnswer;
	      }
	      if (this.showQuickAnswer) {
	        this.$nextTick(() => {
	          this.$refs['textarea'].focus();
	        });
	      }
	    },
	    sendQuickAnswer() {
	      if (this.isSending || this.quickAnswerText.trim() === '') {
	        return;
	      }
	      this.isSending = true;
	      this.$emit('sendQuickAnswer', {
	        id: this.notification.id,
	        text: this.quickAnswerText.trim(),
	        callbackSuccess: response => {
	          const {
	            result_message: resultMessage
	          } = response.data();
	          const [message] = resultMessage;
	          this.quickAnswerResultMessage = message;
	          this.successSentQuickAnswer = true;
	          this.quickAnswerText = '';
	          this.isSending = false;
	        },
	        callbackError: () => {
	          this.isSending = false;
	        }
	      });
	    }
	  },
	  template: `
		<div class="bx-im-content-notification-quick-answer__container">
			<UiButton
				v-if="!showQuickAnswer"
				:size="ButtonSize.SMALL"
				:text="$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_QUICK_ANSWER_BUTTON')"
				:loading="isSending"
				class="--air"
				:style="AirButtonStyle.OUTLINE_NO_ACCENT"
				@click="toggleQuickAnswer" 
				@dblclick.stop
			>
				{{ $Bitrix.Loc.getMessage('IM_NOTIFICATIONS_QUICK_ANSWER_BUTTON') }}
			</UiButton>
			<transition name="quick-answer-slide">
				<div 
					v-if="showQuickAnswer && !successSentQuickAnswer" 
					class="bx-im-content-notification-quick-answer__textarea-container"
				>
					<textarea
						ref="textarea"
						autofocus
						class="bx-im-content-notification-quick-answer__textarea"
						v-model="quickAnswerText"
						:disabled="isSending"
						@keydown.enter.prevent
						@keyup.enter.prevent="sendQuickAnswer"
					/>
					<div 
						v-if="!successSentQuickAnswer" 
						class="bx-im-content-notification-quick-answer__buttons-container"
					>
						<UiButton
							:size="ButtonSize.SMALL"
							:text="$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_QUICK_ANSWER_SEND')"
							:isLoading="isSending"
							class="--air"
							:style="AirButtonStyle.FILLED"
							@click="sendQuickAnswer"
						/>
						<UiButton
							:size="ButtonSize.SMALL"
							class="--air"
							:style="AirButtonStyle.OUTLINE_NO_ACCENT"
							:text="$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_QUICK_ANSWER_CANCEL')"
							:isDisabled="isSending"
							@click="toggleQuickAnswer"
						/>
					</div>
				</div>
			</transition>
			<div v-if="successSentQuickAnswer" class="bx-im-content-notification-quick-answer__result">
				<div class="bx-im-content-notification-quick-answer__success-icon"></div>
				<div class="bx-im-content-notification-quick-answer__success-text">{{ quickAnswerResultMessage }}</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const ItemConfirmButtons = {
	  name: 'ItemConfirmButtons',
	  components: {
	    UiButton: ui_vue3_components_button.Button
	  },
	  props: {
	    buttons: {
	      type: Array,
	      required: true
	    }
	  },
	  emits: ['confirmButtonsClick'],
	  computed: {
	    ButtonSize: () => ui_vue3_components_button.ButtonSize,
	    ButtonColor: () => ui_vue3_components_button.ButtonColor,
	    preparedButtons() {
	      return this.buttons.map(button => {
	        const [id, value] = button.COMMAND_PARAMS.split('|');

	        // we need to decode it, because legacy chat does htmlspecialcharsbx on the server side
	        // @see \CIMMessenger::Add
	        const text = main_core.Text.decode(button.TEXT);
	        return {
	          id,
	          value,
	          text
	        };
	      });
	    }
	  },
	  methods: {
	    click(button) {
	      this.$emit('confirmButtonsClick', button);
	    },
	    getButtonStyle(button) {
	      return button.value === 'Y' ? ui_vue3_components_button.AirButtonStyle.FILLED : ui_vue3_components_button.AirButtonStyle.OUTLINE_NO_ACCENT;
	    }
	  },
	  template: `
		<div class="bx-im-content-notification-item-confirm-buttons__container">
			<UiButton
				v-for="(button, index) in preparedButtons" :key="index"
				:text="button.text"
				class="--air"
				:style="getButtonStyle(button)"
				:size="ButtonSize.SMALL"
				@click="click(button)"
			/>
		</div>
	`
	};

	const NotificationSystemIconClasses = Object.freeze({
	  default: '--default',
	  biconector: '--bi-constructor',
	  app: '--app',
	  bizproc: '--bizproc',
	  newsfeed: '--newsfeed',
	  group: '--group',
	  flow: '--flow',
	  sign: '--sign',
	  videoConf: '--video-conf',
	  openLines: '--open-lines',
	  voximplant: '--voximplant',
	  booking: '--booking',
	  calendar: '--calendar',
	  b24: '--b24',
	  mail: '--mail',
	  tariff: '--license',
	  disk: '--disk',
	  crm: '--crm',
	  company: '--company',
	  contact: '--contact',
	  deal: '--deal',
	  lead: '--lead',
	  quote: '--quote',
	  order: '--order',
	  smartProcess: '--smart-process',
	  timeline: '--timeline',
	  invoice: '--invoice'
	});
	const NotificationIconModuleClasses = Object.freeze({
	  biconector: NotificationSystemIconClasses.biconector,
	  bizproc: NotificationSystemIconClasses.bizproc,
	  blog: NotificationSystemIconClasses.newsfeed,
	  socialnetwork: NotificationSystemIconClasses.group,
	  sign: NotificationSystemIconClasses.sign,
	  imconnector: NotificationSystemIconClasses.openLines,
	  imopenlines: NotificationSystemIconClasses.openLines,
	  voximplant: NotificationSystemIconClasses.voximplant,
	  voximplantcontroller: NotificationSystemIconClasses.voximplant,
	  booking: NotificationSystemIconClasses.booking,
	  calendar: NotificationSystemIconClasses.calendar,
	  intranet: NotificationSystemIconClasses.b24,
	  sender: NotificationSystemIconClasses.mail,
	  mail: NotificationSystemIconClasses.mail,
	  bitrix24: NotificationSystemIconClasses.tariff,
	  disk: NotificationSystemIconClasses.disk,
	  crm: NotificationSystemIconClasses.crm
	});

	// @vue/component
	const ItemAvatar = {
	  name: 'ItemAvatar',
	  components: {
	    ChatAvatar: im_v2_component_elements_avatar.ChatAvatar
	  },
	  props: {
	    notification: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
	    isSystem() {
	      return this.userId === 0;
	    },
	    userId() {
	      return this.notification.authorId;
	    },
	    userDialogId() {
	      return this.userId.toString();
	    },
	    user() {
	      // For now, we don't have a user if it is an OL user.
	      return this.$store.getters['users/get'](this.userId);
	    },
	    systemIconClass() {
	      var _this$notification$pa, _this$notification$pa2;
	      const systemIcon = (_this$notification$pa = this.notification.params) == null ? void 0 : (_this$notification$pa2 = _this$notification$pa.componentParams) == null ? void 0 : _this$notification$pa2.systemIcon;
	      if (main_core.Type.isStringFilled(systemIcon)) {
	        return NotificationSystemIconClasses[systemIcon] || NotificationSystemIconClasses.default;
	      }
	      let moduleId = this.notification.moduleId;
	      if (!moduleId)
	        // check push, because in push moduleId is empty, but settingName is filled
	        {
	          var _this$notification$se;
	          const settingName = (_this$notification$se = this.notification.settingName) != null ? _this$notification$se : '';
	          moduleId = settingName.split('|')[0].trim();
	        }
	      return NotificationIconModuleClasses[moduleId] || NotificationSystemIconClasses.default;
	    }
	  },
	  template: `
		<div class="bx-im-content-notification-item-avatar__container">
			<div 
				v-if="isSystem || !user"
				class="bx-im-content-notification-item-avatar__system-icon"
				:class="systemIconClass"
			></div>
			<ChatAvatar 
				v-else 
				:avatarDialogId="userDialogId" 
				:contextDialogId="userDialogId" 
				:size="AvatarSize.M" 
			/>
		</div>
	`
	};

	// @vue/component
	const ItemActions = {
	  name: 'ItemActions',
	  props: {
	    notification: {
	      type: Object,
	      required: true
	    },
	    canDelete: {
	      type: Boolean,
	      required: true
	    }
	  },
	  computed: {
	    notificationItem() {
	      return this.notification;
	    },
	    areActionsAvailable() {
	      return this.notificationItem.notifyButtons.length === 0;
	    },
	    isMenuEmpty() {
	      if (!this.notificationMenu) {
	        return true;
	      }
	      return this.notificationMenu.isEmpty(this.notificationItem);
	    }
	  },
	  created() {
	    this.notificationMenu = new NotificationMenu({
	      store: this.$store
	    });
	  },
	  methods: {
	    onDeleteClick() {
	      this.$emit('deleteClick');
	    },
	    onMenuButtonClick(event) {
	      this.notificationMenu.openMenu(this.notificationItem, event.currentTarget);
	    },
	    onMenuClose() {
	      this.isMenuShown = false;
	    }
	  },
	  template: `
		<div v-if="areActionsAvailable" class="bx-im-content-notification-item__actions">
			<div
				v-if="!isMenuEmpty"
				class="bx-im-content-notification-item__actions-more-button" 
				@click="onMenuButtonClick" 
			>
			</div>
			<div
				v-if="canDelete"
				class="bx-im-content-notification-item__actions-delete-button"
				@click="onDeleteClick"
			>
			</div>
		</div>
	`
	};

	// @vue/component
	const ItemReaction = {
	  name: 'ItemReaction',
	  props: {
	    notification: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    notificationItem() {
	      return this.notification;
	    },
	    type() {
	      return this.notificationItem.params.componentParams.entity.reaction;
	    },
	    reactionClass() {
	      return ui_reactionsSelect.reactionCssClass[this.type];
	    }
	  },
	  template: `
		<div class="bx-im-content-notification-item-content__reaction" :class="reactionClass"></div>
	`
	};

	const AUTHOR_PLACEHOLDER = '#AUTHOR#';

	// @vue/component
	const ItemSubject = {
	  name: 'ItemSubject',
	  components: {
	    ChatTitle: im_v2_component_elements_chatTitle.ChatTitle
	  },
	  props: {
	    notification: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['userClick'],
	  computed: {
	    author() {
	      return this.$store.getters['users/get'](this.notification.authorId, true);
	    },
	    authorDialogId() {
	      return this.notification.authorId.toString();
	    },
	    titleClasses() {
	      return {
	        'bx-im-content-notification-item-header__title-text': true,
	        'bx-im-content-notification-item-header__title-user-text': true,
	        '--extranet': this.author.type === im_v2_const.UserType.extranet
	      };
	    },
	    subjectText() {
	      var _this$notification$pa, _this$notification$pa2;
	      return im_v2_lib_parser.Parser.decodeNotificationParam((_this$notification$pa = (_this$notification$pa2 = this.notification.params.componentParams) == null ? void 0 : _this$notification$pa2.subject) != null ? _this$notification$pa : '');
	    },
	    parsedSubject() {
	      let subject = this.subjectText;
	      if (this.subjectText.includes('#USER_COUNT#')) {
	        subject = this.subjectText.replace('#USER_COUNT#', this.notification.params.users.length);
	      }
	      const parts = subject.split(AUTHOR_PLACEHOLDER);
	      return {
	        before: parts[0],
	        after: parts[1]
	      };
	    },
	    beforeText() {
	      return this.parsedSubject.before;
	    },
	    afterText() {
	      return this.parsedSubject.after;
	    }
	  },
	  template: `
		<div class="bx-im-content-notification-item-header__subject">
			<span
				v-html="beforeText"
				class="bx-im-content-notification-item-header__subject-text"
			/>
			<ChatTitle
				:dialogId="authorDialogId"
				:showItsYou="false"
				:class="titleClasses"
				@click.prevent="$emit('userClick')"
			/>
			<slot></slot>
			<span
				v-html="afterText"
				class="bx-im-content-notification-item-header__subject-text"
			/>
		</div>
	`
	};

	// @vue/component
	const BaseNotificationItemHeader = {
	  name: 'BaseNotificationItemHeader',
	  components: {
	    ChatTitle: im_v2_component_elements_chatTitle.ChatTitle,
	    ItemSubject
	  },
	  props: {
	    notification: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['moreUsersClick'],
	  computed: {
	    notificationItem() {
	      return this.notification;
	    },
	    user() {
	      return this.$store.getters['users/get'](this.notificationItem.authorId, true);
	    },
	    isSystem() {
	      return this.notification.authorId === 0;
	    },
	    userDialogId() {
	      return this.notification.authorId.toString();
	    },
	    hasMoreUsers() {
	      var _this$notificationIte;
	      if (this.isSystem) {
	        return false;
	      }
	      return Boolean((_this$notificationIte = this.notificationItem.params) == null ? void 0 : _this$notificationIte.users) && this.notificationItem.params.users.length > 0;
	    },
	    moreUsers() {
	      const phrase = this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_MORE_USERS').split('#COUNT#');
	      return {
	        start: phrase[0],
	        end: this.notificationItem.params.users.length + phrase[1]
	      };
	    }
	  },
	  methods: {
	    onUserTitleClick() {
	      if (this.isSystem) {
	        return;
	      }
	      im_public.Messenger.openChat(this.userDialogId);
	    },
	    onMoreUsersClick(event) {
	      if (event.users) {
	        this.$emit('moreUsersClick', {
	          event: event.event,
	          users: event.users
	        });
	      }
	    }
	  },
	  template: `
		<div class="bx-im-content-notification-item-header__container">
			<div class="bx-im-content-notification-item-header__title-container">
				<ItemSubject
					:notification="notification"
					@userClick="onUserTitleClick"
				>
					<span v-if="hasMoreUsers" class="bx-im-content-notification-item-header__more-users">
						<span class="bx-im-content-notification-item-header__more-users-start">{{ moreUsers.start }}</span>
						<span
							class="bx-im-content-notification-item-header__more-users-dropdown"
							@click="onMoreUsersClick({users: notificationItem.params.users, event: $event})"
						>
							{{ moreUsers.end }}
						</span>
					</span>
				</ItemSubject>
			</div>
		</div>
	`
	};

	// @vue/component
	const PlainText = {
	  name: 'PlainText',
	  props: {
	    notification: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    params() {
	      var _this$notification$pa, _this$notification, _this$notification$pa2;
	      return (_this$notification$pa = (_this$notification = this.notification) == null ? void 0 : (_this$notification$pa2 = _this$notification.params) == null ? void 0 : _this$notification$pa2.componentParams) != null ? _this$notification$pa : {};
	    },
	    hasPlainText() {
	      return this.text.length > 0;
	    },
	    text() {
	      var _this$params;
	      const text = ((_this$params = this.params) == null ? void 0 : _this$params.plainText) || '';
	      return im_v2_lib_parser.Parser.decodeNotificationParam(text);
	    }
	  },
	  template: `
		<div v-if="hasPlainText" class="bx-im-content-notification-item-content__plain">
			<span v-html="text" class="bx-im-content-notification-item-content__plain-text"/>
		</div>
	`
	};

	// @vue/component
	const BaseNotificationItem = {
	  name: 'BaseNotificationItem',
	  components: {
	    ItemAvatar,
	    QuickAnswer,
	    PlainText,
	    ItemConfirmButtons,
	    ItemActions,
	    ItemReaction,
	    Attach: im_v2_component_elements_attach.Attach,
	    BaseNotificationItemHeader
	  },
	  props: {
	    notification: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['buttonsClick', 'confirmButtonsClick', 'deleteClick', 'sendQuickAnswer', 'moreUsersClick'],
	  computed: {
	    NotificationTypesCodes: () => im_v2_const.NotificationTypesCodes,
	    notificationItem() {
	      return this.notification;
	    },
	    params() {
	      return this.notificationItem.params;
	    },
	    componentParams() {
	      var _this$notificationIte, _this$notificationIte2;
	      return (_this$notificationIte = this.notificationItem) == null ? void 0 : (_this$notificationIte2 = _this$notificationIte.params) == null ? void 0 : _this$notificationIte2.componentParams;
	    },
	    entity() {
	      var _this$componentParams;
	      return (_this$componentParams = this.componentParams) == null ? void 0 : _this$componentParams.entity;
	    },
	    type() {
	      return this.notification.sectionCode;
	    },
	    isUnread() {
	      return !this.notificationItem.read;
	    },
	    userData() {
	      return this.$store.getters['users/get'](this.notificationItem.authorId, true);
	    },
	    date() {
	      return this.notificationItem.date;
	    },
	    hasQuickAnswer() {
	      var _this$params;
	      return Boolean(((_this$params = this.params) == null ? void 0 : _this$params.canAnswer) === 'Y');
	    },
	    hasReaction() {
	      var _this$entity;
	      return main_core.Type.isStringFilled((_this$entity = this.entity) == null ? void 0 : _this$entity.reaction);
	    },
	    attachList() {
	      var _this$params2;
	      return (_this$params2 = this.params) == null ? void 0 : _this$params2.attach;
	    },
	    itemDate() {
	      return im_v2_lib_dateFormatter.DateFormatter.formatByTemplate(this.date, im_v2_lib_dateFormatter.DateTemplate.notification);
	    },
	    canDelete() {
	      return this.notificationItem.sectionCode === im_v2_const.NotificationTypesCodes.simple;
	    },
	    showDetailedBlock() {
	      var _this$entity2;
	      const type = (_this$entity2 = this.entity) == null ? void 0 : _this$entity2.contentType;
	      return Boolean(type);
	    },
	    isSubjectOnly() {
	      var _this$params3, _this$params3$compone, _this$params4, _this$params4$compone;
	      return ((_this$params3 = this.params) == null ? void 0 : (_this$params3$compone = _this$params3.componentParams) == null ? void 0 : _this$params3$compone.subject) && !((_this$params4 = this.params) != null && (_this$params4$compone = _this$params4.componentParams) != null && _this$params4$compone.plainText) && !this.entity;
	    }
	  },
	  created() {
	    this.notificationReadService = new NotificationReadService();
	    main_core_events.EventEmitter.subscribe(NotificationMenu.events.markAsUnreadClick, this.markAsUnreadClick);
	  },
	  beforeUnmount() {
	    this.notificationReadService.destroy();
	    main_core_events.EventEmitter.unsubscribe(NotificationMenu.events.markAsUnreadClick, this.markAsUnreadClick);
	  },
	  methods: {
	    markAsUnreadClick(event) {
	      const notificationFromEvent = event.getData();
	      if (this.notificationItem.id === notificationFromEvent.id) {
	        this.notificationReadService.changeReadStatus(this.notificationItem.id);
	      }
	    },
	    onConfirmButtonsClick(event) {
	      this.$emit('confirmButtonsClick', event);
	    },
	    onSendQuickAnswer(event) {
	      this.$emit('sendQuickAnswer', event);
	    },
	    onDeleteClick() {
	      this.$emit('deleteClick', this.notificationItem.id);
	    },
	    onUnsubscribeClick() {
	      this.$emit('unsubscribeClick', this.notificationItem.id);
	    },
	    onContentClick(event) {
	      im_v2_lib_parser.Parser.executeClickEvent(event, {
	        emitter: this.getEmitter()
	      });
	    },
	    onMoreUsersClick(event) {
	      this.$emit('moreUsersClick', event);
	    },
	    getEmitter() {
	      return this.$Bitrix.eventEmitter;
	    }
	  },
	  template: `
		<div
			class="bx-im-content-notification-item__container"
			:class="{'--unread': isUnread}"
			:data-test-id="'im-content-notification-item-container-' + notificationItem.id"
		>
			<ItemAvatar :notification="notificationItem"/>
			<div class="bx-im-content-notification-item__content-container" :class="{ '--subject-only': isSubjectOnly }">
				<slot name="header">
					<BaseNotificationItemHeader
						:notification="notificationItem"
						@moreUsersClick="onMoreUsersClick"
					/>
				</slot>
				<ItemActions
					:canDelete="canDelete"
					:notification="notificationItem"
					@deleteClick="onDeleteClick"
					@unsubscribeClick="onUnsubscribeClick"
					@markAsUnreadClick="markAsUnreadClick"
				/>
				<PlainText :notification="notificationItem" />
				<div 
					class="bx-im-content-notification-item-content__container"
					:class="{ '--subject-only': isSubjectOnly }"
					@click="onContentClick"
				>
					<div :class="{ 'bx-im-content-notification-item-content__details': showDetailedBlock }">
						<slot name="content"></slot>
						<ItemReaction v-if="hasReaction" :notification="notificationItem" />
					</div>
					<QuickAnswer
						v-if="hasQuickAnswer"
						:notification="notificationItem"
						@sendQuickAnswer="onSendQuickAnswer"
					/>
					<template v-if="attachList">
						<template v-for="attachItem in attachList">
							<Attach :config="attachItem"/>
						</template>
					</template>
					<ItemConfirmButtons
						v-if="notificationItem.notifyButtons.length > 0"
						@confirmButtonsClick="onConfirmButtonsClick"
						:buttons="notificationItem.notifyButtons"
					/>
					<div class="bx-im-content-notification-item-content__date-container">
						<div class="bx-im-content-notification-item-content__date">{{ itemDate }}</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const CalendarNotificationItem = {
	  name: 'CalendarNotificationItem',
	  components: {
	    DetailedTitle,
	    DetailedText,
	    DetailedGrid,
	    DetailedChangedValue,
	    DetailedUsers,
	    BaseNotificationItem
	  },
	  props: {
	    notification: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    Color: () => im_v2_const.Color,
	    notificationItem() {
	      return this.notification;
	    },
	    notificationParams() {
	      var _this$notificationIte, _this$notificationIte2;
	      return (_this$notificationIte = (_this$notificationIte2 = this.notificationItem.params) == null ? void 0 : _this$notificationIte2.componentParams) != null ? _this$notificationIte : null;
	    },
	    iconClass() {
	      return DefaultNotificationIconTitleClass.calendar;
	    }
	  },
	  template: `
		<BaseNotificationItem :notification="notificationItem">
			<template #content>
				<DetailedTitle
					:notificationParams="notificationParams"
					:icon="iconClass" 
					:color="Color.accentMainPrimaryAlt"
				/>
				<DetailedGrid :notificationParams="notificationParams" />
				<DetailedChangedValue :notificationParams="notificationParams" />
				<DetailedText :notificationParams="notificationParams" />
				<DetailedUsers :notificationParams="notificationParams" />
			</template>
		</BaseNotificationItem>
	`
	};

	// @vue/component
	const CrmNotificationItem = {
	  name: 'CrmNotificationItem',
	  components: {
	    DetailedTitle,
	    DetailedText,
	    DetailedGrid,
	    DetailedChangedValue,
	    BaseNotificationItem
	  },
	  props: {
	    notification: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    Color: () => im_v2_const.Color,
	    notificationItem() {
	      return this.notification;
	    },
	    notificationParams() {
	      var _this$notificationIte, _this$notificationIte2;
	      return (_this$notificationIte = (_this$notificationIte2 = this.notificationItem.params) == null ? void 0 : _this$notificationIte2.componentParams) != null ? _this$notificationIte : null;
	    },
	    iconClass() {
	      const entityKey = this.notificationParams.entity.entityType;
	      if (entityKey && CrmNotificationIconTitleClass[entityKey]) {
	        return CrmNotificationIconTitleClass[entityKey];
	      }
	      return CrmNotificationIconTitleClass.deal;
	    }
	  },
	  template: `
		<BaseNotificationItem :notification="notificationItem">
			<template #content>
				<DetailedTitle
					:notificationParams="notificationParams"
					:icon="iconClass"
					:color="Color.accentMainSuccessAlt"
				/>
				<DetailedGrid :notificationParams="notificationParams" />
				<DetailedChangedValue :notificationParams="notificationParams" />
				<DetailedText :notificationParams="notificationParams" />
			</template>
		</BaseNotificationItem>
	`
	};

	// @vue/component
	const TaskNotificationItem = {
	  name: 'TaskNotificationItem',
	  components: {
	    DetailedTitle,
	    DetailedText,
	    DetailedGrid,
	    DetailedChangedValue,
	    BaseNotificationItem
	  },
	  props: {
	    notification: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    Color: () => im_v2_const.Color,
	    notificationItem() {
	      return this.notification;
	    },
	    notificationParams() {
	      var _this$notificationIte, _this$notificationIte2;
	      return (_this$notificationIte = (_this$notificationIte2 = this.notificationItem.params) == null ? void 0 : _this$notificationIte2.componentParams) != null ? _this$notificationIte : null;
	    },
	    iconClass() {
	      return DefaultNotificationIconTitleClass.task;
	    }
	  },
	  template: `
		<BaseNotificationItem :notification="notification">
			<template #content>
				<DetailedTitle
					:notificationParams="notificationParams"
					:icon="iconClass"
					:color="Color.accentMainSuccess"
				/>
				<DetailedChangedValue :notificationParams="notificationParams" />
				<DetailedGrid :notificationParams="notificationParams" />
				<DetailedText :notificationParams="notificationParams" />
			</template>
		</BaseNotificationItem>
	`
	};

	// @vue/component
	const BizprocNotificationItem = {
	  name: 'BizprocNotificationItem',
	  components: {
	    DetailedTitle,
	    DetailedText,
	    DetailedChangedValue,
	    DetailedGrid,
	    BaseNotificationItem
	  },
	  props: {
	    notification: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    Color: () => im_v2_const.Color,
	    notificationItem() {
	      return this.notification;
	    },
	    notificationParams() {
	      var _this$notificationIte, _this$notificationIte2;
	      return (_this$notificationIte = (_this$notificationIte2 = this.notificationItem.params) == null ? void 0 : _this$notificationIte2.componentParams) != null ? _this$notificationIte : null;
	    },
	    iconClass() {
	      const entityKey = this.notificationParams.entity.entityType;
	      if (entityKey && BizprocNotificationIconTitleClass[entityKey]) {
	        return BizprocNotificationIconTitleClass[entityKey];
	      }
	      return BizprocNotificationIconTitleClass.bizproc;
	    }
	  },
	  template: `
		<BaseNotificationItem :notification="notificationItem">
			<template #content>
				<DetailedTitle
					:notificationParams="notificationParams"
					:icon="iconClass"
					:color="Color.orangeExtra"
				/>
				<DetailedGrid :notificationParams="notificationParams" />
				<DetailedChangedValue :notificationParams="notificationParams" />
				<DetailedText :notificationParams="notificationParams" />
			</template>
		</BaseNotificationItem>
	`
	};

	// @vue/component
	const SonetNotificationItem = {
	  name: 'SonetNotificationItem',
	  components: {
	    DetailedTitle,
	    DetailedText,
	    DetailedGrid,
	    DetailedChangedValue,
	    BaseNotificationItem
	  },
	  props: {
	    notification: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    Color: () => im_v2_const.Color,
	    notificationItem() {
	      return this.notification;
	    },
	    notificationParams() {
	      var _this$notificationIte, _this$notificationIte2;
	      return (_this$notificationIte = (_this$notificationIte2 = this.notificationItem.params) == null ? void 0 : _this$notificationIte2.componentParams) != null ? _this$notificationIte : null;
	    },
	    iconClass() {
	      const entityKey = this.notificationParams.entity.entityType;
	      if (entityKey && SonetNotificationIconTitleClass[entityKey]) {
	        return SonetNotificationIconTitleClass[entityKey];
	      }
	      return SonetNotificationIconTitleClass.newsfeed;
	    }
	  },
	  template: `
		<BaseNotificationItem :notification="notificationItem">
			<template #content>
				<DetailedTitle
					:notificationParams="notificationParams"
					:icon="iconClass"
					:color="Color.accentExtraAqua"
				/>
				<DetailedGrid :notificationParams="notificationParams" />
				<DetailedChangedValue :notificationParams="notificationParams" />
				<DetailedText :notificationParams="notificationParams" />
			</template>
		</BaseNotificationItem>
	`
	};

	// @vue/component
	const CompatibilityNotificationItemHeader = {
	  name: 'CompatibilityNotificationItemHeader',
	  components: {
	    ChatTitle: im_v2_component_elements_chatTitle.ChatTitle
	  },
	  props: {
	    notification: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['moreUsersClick'],
	  computed: {
	    notificationItem() {
	      return this.notification;
	    },
	    user() {
	      return this.$store.getters['users/get'](this.notificationItem.authorId, true);
	    },
	    hasName() {
	      return this.notificationItem.authorId > 0 && this.user.name.length > 0;
	    },
	    title() {
	      if (this.notificationItem.title.length > 0) {
	        return this.notificationItem.title;
	      }
	      return this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_ITEM_SYSTEM');
	    },
	    isSystem() {
	      return this.notification.authorId === 0;
	    },
	    userDialogId() {
	      return this.notification.authorId.toString();
	    },
	    titleClasses() {
	      return {
	        'bx-im-content-notification-item-header__title-text': true,
	        'bx-im-content-notification-item-header__title-user-text': !this.isSystem,
	        '--extranet': this.user.type === im_v2_const.UserType.extranet,
	        '--short': !this.hasMoreUsers
	      };
	    },
	    hasMoreUsers() {
	      var _this$notificationIte;
	      if (this.isSystem) {
	        return false;
	      }
	      return Boolean((_this$notificationIte = this.notificationItem.params) == null ? void 0 : _this$notificationIte.users) && this.notificationItem.params.users.length > 0;
	    },
	    moreUsers() {
	      const phrase = this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_MORE_USERS').split('#COUNT#');
	      return {
	        start: phrase[0],
	        end: this.notificationItem.params.users.length + phrase[1]
	      };
	    }
	  },
	  methods: {
	    onUserTitleClick() {
	      if (this.isSystem) {
	        return;
	      }
	      im_public.Messenger.openChat(this.userDialogId);
	    },
	    onMoreUsersClick(event) {
	      if (event.users) {
	        this.$emit('moreUsersClick', {
	          event: event.event,
	          users: event.users
	        });
	      }
	    }
	  },
	  template: `
		<div class="bx-im-content-notification-item-header__container">
			<div class="bx-im-content-notification-item-header__title-container">
				<ChatTitle
					v-if="hasName"
					:dialogId="userDialogId"
					:showItsYou="false"
					:class="titleClasses"
					@click.prevent="onUserTitleClick"
				/>
				<span v-else @click.prevent="onUserTitleClick" :class="titleClasses">{{ title }}</span>
				<span v-if="hasMoreUsers" class="bx-im-content-notification-item-header__more-users">
					<span class="bx-im-content-notification-item-header__more-users-start">{{ moreUsers.start }}</span>
					<span
						class="bx-im-content-notification-item-header__more-users-dropdown"
						@click="onMoreUsersClick({users: notificationItem.params.users, event: $event})"
					>
						{{ moreUsers.end }}
					</span>
				</span>
			</div>
		</div>
	`
	};

	// @vue/component
	const CompatibilityNotificationItem = {
	  name: 'DefaultNotificationItem',
	  components: {
	    BaseNotificationItem,
	    CompatibilityNotificationItemHeader
	  },
	  props: {
	    notification: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['moreUsersClick'],
	  computed: {
	    content() {
	      return im_v2_lib_parser.Parser.decodeNotification(this.notification);
	    }
	  },
	  methods: {
	    onMoreUsersClick(event) {
	      this.$emit('moreUsersClick', event);
	    }
	  },
	  template: `
		<BaseNotificationItem :notification="notification">
			<template #header>
				<CompatibilityNotificationItemHeader
					:notification="notification"
					@moreUsersClick="onMoreUsersClick"
				/>
			</template>
			<template #content>
				<div
					v-if="content.length > 0"
					class="bx-im-content-notification-item-content__content-text"
					v-html="content"
				></div>
			</template>
		</BaseNotificationItem>
	`
	};

	// @vue/component
	const DefaultNotificationItem = {
	  name: 'DefaultNotificationItem',
	  components: {
	    BaseNotificationItem
	  },
	  props: {
	    notification: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    Color: () => im_v2_const.Color,
	    notificationItem() {
	      return this.notification;
	    },
	    notificationParams() {
	      var _this$notificationIte, _this$notificationIte2;
	      return (_this$notificationIte = (_this$notificationIte2 = this.notificationItem.params) == null ? void 0 : _this$notificationIte2.componentParams) != null ? _this$notificationIte : null;
	    }
	  },
	  template: `
		<BaseNotificationItem :notification="notificationItem"/>
	`
	};

	const NotificationComponents = {
	  TaskEntity: TaskNotificationItem,
	  CalendarEntity: CalendarNotificationItem,
	  CompatibilityEntity: CompatibilityNotificationItem,
	  CrmEntity: CrmNotificationItem,
	  BizprocEntity: BizprocNotificationItem,
	  SonetEntity: SonetNotificationItem,
	  DefaultEntity: DefaultNotificationItem
	};

	const ItemPlaceholder = {
	  name: 'ItemPlaceholder',
	  props: {
	    itemsToShow: {
	      type: Number,
	      default: 50
	    }
	  },
	  template: `
		<div class="bx-im-content-notification-placeholder__container" v-for="index in itemsToShow">
			<div class="bx-im-content-notification-placeholder__element">
				<div class="bx-im-content-notification-placeholder__avatar-container">
					<div class="bx-im-content-notification-placeholder__avatar"></div>
				</div>
				<div class="bx-im-content-notification-placeholder__content-container">
					<div class="bx-im-content-notification-placeholder__content-inner">
						<div class="bx-im-content-notification-placeholder__content --top"></div>
						<div class="bx-im-content-notification-placeholder__content --short"></div>
					</div>
					<div class="bx-im-content-notification-placeholder__content --full"></div>
					<div class="bx-im-content-notification-placeholder__content --middle"></div>
					<div class="bx-im-content-notification-placeholder__content --bottom"></div>
				</div>
			</div>
		</div>
	`
	};

	const ScrollButton = {
	  name: 'ScrollButton',
	  props: {
	    unreadCounter: {
	      type: Number,
	      default: 0
	    },
	    notificationsOnScreen: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['scrollButtonClick'],
	  computed: {
	    notificationCollection() {
	      return this.$store.getters['notifications/getSortedCollection'];
	    },
	    hasUnreadOnScreen() {
	      return [...this.notificationsOnScreen].some(id => {
	        var _this$notificationMap;
	        return !((_this$notificationMap = this.notificationMapCollection.get(id)) != null && _this$notificationMap.read);
	      });
	    },
	    firstUnreadId() {
	      const item = this.notificationCollection.find(notification => !notification.read);
	      if (!item) {
	        return;
	      }
	      return item.id;
	    },
	    firstUnreadBelowVisible() {
	      const minIdOnScreen = Math.min(...this.notificationsOnScreen);
	      const item = this.notificationCollection.find(notification => {
	        return !notification.read && notification.sectionCode === im_v2_const.NotificationTypesCodes.simple && minIdOnScreen > notification.id;
	      });
	      if (!item) {
	        return;
	      }
	      return item.id;
	    },
	    hasUnreadBelowVisible() {
	      let unreadCounterBeforeVisible = 0;
	      for (let i = 0; i <= this.notificationCollection.length - 1; i++) {
	        if (!this.notificationCollection[i].read) {
	          ++unreadCounterBeforeVisible;
	        }

	        // In this case we decide that there is no more unread notifications below visible notifications,
	        // so we show arrow up on scroll button.
	        if (this.notificationsOnScreen.has(this.notificationCollection[i].id) && this.unreadCounter === unreadCounterBeforeVisible) {
	          return false;
	        }
	      }
	      return true;
	    },
	    showScrollButton() {
	      // todo: check BXIM.settings.notifyAutoRead
	      if (this.unreadCounter === 0 || this.hasUnreadOnScreen) {
	        return false;
	      }
	      return true;
	    },
	    arrowButtonClass() {
	      const arrowDown = this.hasUnreadBelowVisible;
	      return {
	        'bx-im-notifications-scroll-button-arrow-down': arrowDown,
	        'bx-im-notifications-scroll-button-arrow-up': !arrowDown
	      };
	    },
	    formattedCounter() {
	      if (this.unreadCounter > 99) {
	        return '99+';
	      }
	      return `${this.unreadCounter}`;
	    },
	    ...ui_vue3_vuex.mapState({
	      notificationMapCollection: state => state.notifications.collection
	    })
	  },
	  methods: {
	    onScrollButtonClick() {
	      let idToScroll = null;
	      if (this.firstUnreadBelowVisible) {
	        idToScroll = this.firstUnreadBelowVisible;
	      } else if (!this.hasUnreadBelowVisible) {
	        idToScroll = this.firstUnreadId;
	      }
	      let firstUnreadNode = null;
	      if (idToScroll !== null) {
	        const selector = `.bx-im-content-notification-item__container[data-id="${idToScroll}"]`;
	        firstUnreadNode = document.querySelector(selector);
	      }
	      if (firstUnreadNode) {
	        this.$emit('scrollButtonClick', firstUnreadNode.offsetTop);
	      } else {
	        const latestNotification = this.notificationCollection[this.notificationCollection.length - 1];
	        const selector = `.bx-im-content-notification-item__container[data-id="${latestNotification.id}"]`;
	        const latestNotificationNode = document.querySelector(selector);
	        this.$emit('scrollButtonClick', latestNotificationNode.offsetTop);
	      }
	    }
	  },
	  template: `
		<transition name="bx-im-notifications-scroll-button">
			<div 
				v-show="showScrollButton" 
				class="bx-im-content-notification-scroll-button__container" 
				@click="onScrollButtonClick"
			>
				<div class="bx-im-content-notification-scroll-button__button">
					<div class="bx-im-notifications-scroll-button-counter">
						{{ formattedCounter }}
					</div>
					<div :class="arrowButtonClass"></div>
				</div>
			</div>
		</transition>
	`
	};

	// @vue/component
	const NotificationFilterValueChip = {
	  name: 'NotificationFilterValueChip',
	  components: {
	    Chip: ui_system_chip_vue.Chip
	  },
	  props: {
	    text: {
	      type: String,
	      required: true
	    },
	    title: {
	      type: String,
	      default: ''
	    }
	  },
	  emits: ['clear'],
	  computed: {
	    ChipDesign: () => ui_system_chip_vue.ChipDesign,
	    ChipSize: () => ui_system_chip_vue.ChipSize
	  },
	  template: `
		<Chip
			class="bx-im-notification-filter_search-value__chip-container"
			:size="ChipSize.Xs"
			:design="ChipDesign.Tinted"
			:text="text"
			:withClear="true"
			:title="title"
			:compact="false"
			@clear="$emit('clear')"
		/>
	`
	};

	const ANOTHER_TYPE = 'anotherValues';

	// @vue/component
	const NotificationFilterValuesContainer = {
	  name: 'NotificationFilterValuesContainer',
	  components: {
	    NotificationFilterValueChip
	  },
	  props: {
	    nonEmptyEntries: {
	      type: Array,
	      required: true
	    }
	  },
	  emits: ['remove'],
	  computed: {
	    ANOTHER_TYPE: () => ANOTHER_TYPE,
	    firstNonEmptyField() {
	      const list = this.nonEmptyEntries;
	      return list.length > 0 ? list[0] : null;
	    },
	    secondNonEmptyField() {
	      const list = this.nonEmptyEntries;
	      return list.length > 1 ? list[1] : null;
	    },
	    remainingNonEmptyEntries() {
	      const list = this.nonEmptyEntries;
	      return list.length > 1 ? list.slice(1) : [];
	    },
	    firstTagTitle() {
	      if (!this.firstNonEmptyField) {
	        return '';
	      }
	      return this.formatEntry(this.firstNonEmptyField);
	    },
	    secondTagTitle() {
	      if (!this.secondNonEmptyField) {
	        return '';
	      }
	      return this.formatEntry(this.secondNonEmptyField);
	    },
	    remainingTagTitle() {
	      if (this.remainingNonEmptyEntries.length === 0) {
	        return '';
	      }
	      return this.remainingNonEmptyEntries.map(e => this.formatEntry(e)).join('\n');
	    },
	    hasNonEmptyEntries() {
	      return this.nonEmptyEntries.length > 0;
	    },
	    hasSingleRemainingEntry() {
	      return this.remainingNonEmptyEntries.length === 1;
	    },
	    hasMultipleRemainingEntries() {
	      return this.remainingNonEmptyEntries.length > 1;
	    }
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    getTitle(key, values) {
	      if (!values && key === this.ANOTHER_TYPE && this.remainingNonEmptyEntries.length > 0) {
	        return this.loc('IM_NOTIFICATIONS_FILTER_ANOTHER_VALUES_TAG', {
	          '#COUNT#': String(this.remainingNonEmptyEntries.length)
	        });
	      }
	      return this.formatEntry({
	        key,
	        value: values
	      });
	    },
	    getTagTitle(fieldKey) {
	      if (fieldKey === NotificationFilterFieldTypes.searchTypes) {
	        return 'IM_NOTIFICATIONS_FILTER_TYPE_FIELD_TAG_TEXT';
	      }
	      if (fieldKey === NotificationFilterFieldTypes.searchDate) {
	        return 'IM_NOTIFICATIONS_FILTER_DATE_FIELD_TAG_TEXT';
	      }
	      if (fieldKey === NotificationFilterFieldTypes.searchAuthors) {
	        return 'IM_NOTIFICATIONS_FILTER_AUTHOR_FIELD_TAG_TEXT';
	      }
	      return '';
	    },
	    formatValue(fieldKey, value) {
	      if (main_core.Type.isArray(value)) {
	        return value.join(', ');
	      }
	      return String(value);
	    },
	    formatEntry(entry) {
	      const phraseCode = this.getTagTitle(entry.key);
	      if (phraseCode === '') {
	        return '';
	      }
	      return this.loc(phraseCode, {
	        '#VALUE#': this.formatValue(entry.key, entry.value)
	      });
	    },
	    onRemoveSimpleTag(key) {
	      if (this.firstNonEmptyField) {
	        this.$emit('remove', [key]);
	      }
	    },
	    onRemoveRemainingTags() {
	      const keys = this.remainingNonEmptyEntries.map(e => e.key);
	      if (keys.length > 0) {
	        this.$emit('remove', keys);
	      }
	    }
	  },
	  template: `
		<div
			v-if="hasNonEmptyEntries"
			class="bx-im-notification-filter-value_tags-container"
		>
			<NotificationFilterValueChip
				v-if="firstNonEmptyField"
				:text="getTitle(firstNonEmptyField.key, firstNonEmptyField.value)"
				:title="firstTagTitle"
				data-test-id="im_notifications-filter__chip-first"
				@clear="onRemoveSimpleTag(firstNonEmptyField.key)"
			/>
			<NotificationFilterValueChip
				v-if="hasSingleRemainingEntry"
				:text="getTitle(secondNonEmptyField.key, secondNonEmptyField.value)"
				:title="secondTagTitle"
				data-test-id="im_notifications-filter__chip-second"
				@clear="onRemoveSimpleTag(secondNonEmptyField.key)"
			/>
			<NotificationFilterValueChip
				v-if="hasMultipleRemainingEntries"
				:text="getTitle(ANOTHER_TYPE)"
				:title="remainingTagTitle"
				data-test-id="im_notifications-filter__chip-third"
				@clear="onRemoveRemainingTags()"
			/>
			<span class="bx-im-notification-filter-plus">+</span>
		</div>
	`
	};

	// @vue/component
	const NotificationFilterSearchInput = {
	  name: 'NotificationFilterSearchInput',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    NotificationFilterValuesContainer
	  },
	  props: {
	    displayData: {
	      type: Object,
	      required: true
	    },
	    modelValue: {
	      type: String,
	      default: ''
	    }
	  },
	  emits: ['update:modelValue', 'focus', 'remove', 'clear'],
	  data() {
	    return {
	      isFocused: false
	    };
	  },
	  computed: {
	    Color: () => im_v2_const.Color,
	    OutlineIcons: () => ui_iconSet_api_vue.Outline,
	    isSearchEmpty() {
	      return this.modelValue === '';
	    },
	    withTags() {
	      return this.nonEmptyEntries.length > 0;
	    },
	    nonEmptyEntries() {
	      const result = [];
	      for (const [key, value] of Object.entries(this.displayData)) {
	        if (main_core.Type.isArrayFilled(value)) {
	          result.push({
	            key,
	            value
	          });
	          continue;
	        }
	        if (main_core.Type.isStringFilled(value)) {
	          result.push({
	            key,
	            value
	          });
	        }
	        if (key === NotificationFilterFieldTypes.searchDate) {
	          var _value$date, _value$dateFrom, _value$dateTo;
	          if (((_value$date = value.date) == null ? void 0 : _value$date.length) > 0) {
	            result.push({
	              key,
	              value: value.date
	            });
	            continue;
	          }
	          if (((_value$dateFrom = value.dateFrom) == null ? void 0 : _value$dateFrom.length) > 0 && ((_value$dateTo = value.dateTo) == null ? void 0 : _value$dateTo.length) > 0) {
	            result.push({
	              key,
	              value: `${value.dateFrom} - ${value.dateTo}`
	            });
	          }
	        }
	      }
	      return result;
	    },
	    placeholderText() {
	      if (this.nonEmptyEntries.length > 0) {
	        return this.loc('IM_NOTIFICATIONS_FILTER_SEARCH_INPUT_PLACEHOLDER_WITH_TAGS');
	      }
	      return this.loc('IM_NOTIFICATIONS_FILTER_SEARCH_INPUT_PLACEHOLDER');
	    }
	  },
	  watch: {
	    searchValue() {
	      this.$emit('updateSearch', this.searchValue);
	    }
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    onFocus(event) {
	      this.isFocused = true;
	      this.$emit('focus', event);
	    },
	    onRemove(keys) {
	      this.$emit('remove', keys);
	    },
	    onInput(event) {
	      this.$emit('update:modelValue', event.target.value);
	    }
	  },
	  template: `
		<div
			class="bx-im-content-notification-filter-search"
			:class="{ '--focused': isFocused }"
			ref="container"
			data-test-id="im_content-notification-filter__search-container"
		>
			<NotificationFilterValuesContainer
				:nonEmptyEntries="nonEmptyEntries"
				@remove="onRemove"
			/>
			<input
				class="bx-im-content-notification-filter-search__input"
				type="text"
				:value="modelValue"
				:class="{ '--with-tags': this.withTags }"
				:placeholder="placeholderText"
				data-test-id="im_notifications-filter__search-input"
				@focus="onFocus"
				@input="onInput"
				@blur="this.isFocused = false"
			/>
			<div class="bx-im-content-notification-filter-search__icons-block">
				<BIcon
					:name="OutlineIcons.SEARCH"
					:size="20"
					:color="Color.base5"
					:hoverable="true"
					class="bx-im-content-notification-filter-search__icon-search"
					:class="{ '--without-delete-icon': isSearchEmpty }"
				/>
				<BIcon
					:name="OutlineIcons.CROSS_L"
					:size="20"
					:color="Color.base5"
					:hoverable="true"
					class="bx-im-content-notification-filter-search__icon-delete"
					:class="{ '--hidden': isSearchEmpty }"
					data-test-id="im_notifications-filter__search-reset"
					@click.stop="$emit('clear')"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const NotificationFilterActionButtons = {
	  name: 'NotificationFilterPopupActionButtons',
	  components: {
	    UiButton: ui_vue3_components_button.Button
	  },
	  emits: ['search', 'reset'],
	  computed: {
	    OutlineIcons: () => ui_iconSet_api_core.Outline,
	    ButtonSize: () => ui_vue3_components_button.ButtonSize,
	    AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    }
	  },
	  template: `
		<div class="bx-im-content-notification-filter-popup__actions-container">
			<UiButton
				:text="loc('IM_NOTIFICATIONS_FILTER_SEARCH_BUTTON')"
				class="--air"
				:style="AirButtonStyle.FILLED"
				:size="ButtonSize.LARGE"
				:leftIcon="OutlineIcons.SEARCH"
				:dataset="{ testId: 'im_content-notification-filter__popup-search-button' }"
				@click="$emit('search')"
			/>
			<UiButton
				:text="loc('IM_NOTIFICATIONS_FILTER_RESET_BUTTON')"
				class="--air"
				:style="AirButtonStyle.PLAIN"
				:size="ButtonSize.LARGE"
				:dataset="{ testId: 'im_content-notification-filter__popup-reset-button' }"
				@click="$emit('reset')"
			/>
		</div>
	`
	};

	const AUTHOR_SELECTOR_KEY = 'notification_filter_author_selector';
	var _instance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("instance");
	class NotificationFilterCacheService {
	  constructor() {
	    this.cache = new main_core.Cache.MemoryCache();
	  }
	  static getInstance() {
	    if (!babelHelpers.classPrivateFieldLooseBase(NotificationFilterCacheService, _instance)[_instance]) {
	      babelHelpers.classPrivateFieldLooseBase(NotificationFilterCacheService, _instance)[_instance] = new NotificationFilterCacheService();
	    }
	    return babelHelpers.classPrivateFieldLooseBase(NotificationFilterCacheService, _instance)[_instance];
	  }
	  setAuthorSelector(selector) {
	    this.cache.set(AUTHOR_SELECTOR_KEY, selector);
	  }
	  getAuthorSelector() {
	    return this.cache.get(AUTHOR_SELECTOR_KEY, null);
	  }
	  clearCache() {
	    this.cache.delete(AUTHOR_SELECTOR_KEY);
	  }
	}
	Object.defineProperty(NotificationFilterCacheService, _instance, {
	  writable: true,
	  value: null
	});

	// @vue/component
	const NotificationFilterAuthorField = {
	  name: 'AuthorFilterField',
	  props: {
	    modelValue: {
	      type: Array,
	      default: () => []
	    }
	  },
	  emits: ['update:modelValue', 'popupStateChange'],
	  computed: {
	    labelText() {
	      return this.loc('IM_NOTIFICATIONS_FILTER_AUTHOR_FIELD_TITLE');
	    }
	  },
	  created() {
	    main_core_events.EventEmitter.subscribe(im_v2_const.EventType.notification.onFilterAuthorTagAdd, this.onAuthorTagAdd);
	    main_core_events.EventEmitter.subscribe(im_v2_const.EventType.notification.onFilterAuthorTagRemove, this.onAuthorTagRemove);
	    main_core_events.EventEmitter.subscribe(im_v2_const.EventType.notification.onFilterAuthorPopupStateChange, this.onAuthorPopupState);
	    this.notificationFilterCacheService = NotificationFilterCacheService.getInstance();
	  },
	  mounted() {
	    this.selector = this.getSelector();
	    this.selector.renderTo(this.$refs['author-selector']);
	  },
	  beforeUnmount() {
	    main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.notification.onFilterAuthorTagAdd, this.onAuthorTagAdd);
	    main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.notification.onFilterAuthorTagRemove, this.onAuthorTagRemove);
	    main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.notification.onFilterAuthorPopupStateChange, this.onAuthorPopupState);
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    getSelector() {
	      let selector = this.notificationFilterCacheService.getAuthorSelector();
	      if (!selector) {
	        var _selector$getDialog;
	        const preselectedItems = this.modelValue.map(author => ['user', author.id]);
	        selector = new ui_entitySelector.TagSelector({
	          events: {
	            onTagAdd: event => {
	              const {
	                tag
	              } = event.getData();
	              main_core_events.EventEmitter.emit(im_v2_const.EventType.notification.onFilterAuthorTagAdd, {
	                tag
	              });
	            },
	            onTagRemove: event => {
	              const {
	                tag
	              } = event.getData();
	              main_core_events.EventEmitter.emit(im_v2_const.EventType.notification.onFilterAuthorTagRemove, {
	                tag
	              });
	            }
	          },
	          multiple: true,
	          dialogOptions: {
	            items: [{
	              id: 0,
	              entityId: 'user',
	              title: this.loc('IM_NOTIFICATIONS_FILTER_AUTHOR_FIELD_SYSTEM_USER'),
	              tabs: 'recents',
	              link: ''
	            }],
	            height: 250,
	            width: 380,
	            preselectedItems,
	            entities: [{
	              id: 'user',
	              options: {
	                intranetUsersOnly: true,
	                inviteEmployeeLink: false
	              }
	            }],
	            dropdownMode: true,
	            hideOnDeselect: false,
	            events: {
	              onShow: () => {
	                main_core_events.EventEmitter.emit(im_v2_const.EventType.notification.onFilterAuthorPopupStateChange, {
	                  active: true
	                });
	              },
	              onHide: () => {
	                main_core_events.EventEmitter.emit(im_v2_const.EventType.notification.onFilterAuthorPopupStateChange, {
	                  active: false
	                });
	              }
	            }
	          }
	        });
	        const container = (_selector$getDialog = selector.getDialog()) == null ? void 0 : _selector$getDialog.getContainer();
	        if (container) {
	          main_core.Dom.attr(container, 'data-test-id', 'im_notifications-filter__author-field-selector');
	        }
	        this.notificationFilterCacheService.setAuthorSelector(selector);
	      }
	      return selector;
	    },
	    onAuthorTagAdd(event) {
	      const {
	        tag
	      } = event.getData();
	      const isNewAuthor = !this.modelValue.some(author => author.id === tag.id);
	      if (!isNewAuthor) {
	        return;
	      }
	      const searchAuthors = [...this.modelValue, {
	        id: tag.id,
	        name: tag.title.text
	      }];
	      this.$emit('update:modelValue', searchAuthors);
	    },
	    onAuthorTagRemove(event) {
	      const {
	        tag
	      } = event.getData();
	      const searchAuthors = this.modelValue.filter(author => author.id !== tag.id);
	      this.$emit('update:modelValue', searchAuthors);
	    },
	    onAuthorPopupState(event) {
	      const {
	        active
	      } = event.getData();
	      this.$emit('popupStateChange', {
	        popup: 'author',
	        active
	      });
	    }
	  },
	  template: `
		<div class="bx-im-notifications-filter_field__container">
			<div class="bx-im-notifications-filter_field__label">{{ labelText }}</div>
			<div
				ref="author-selector"
				class="bx-im-notifications-filter_field__selector-container"
				data-test-id="im_notifications-filter__author-field-container"
			/>
		</div>
	`
	};

	// @vue/component
	const NotificationFilterTypeField = {
	  name: 'TypeFilterField',
	  props: {
	    modelValue: {
	      type: Array,
	      default: () => []
	    },
	    schema: {
	      type: Object,
	      required: false,
	      default: null
	    }
	  },
	  emits: ['update:modelValue', 'popupStateChange'],
	  computed: {
	    labelText() {
	      return this.loc('IM_NOTIFICATIONS_FILTER_TYPE_FIELD_TITLE');
	    }
	  },
	  mounted() {
	    this.selector = this.getSelector();
	    this.selector.renderTo(this.$refs['type-selector']);
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    getSelector() {
	      var _selector$getDialog;
	      const entityId = 'im-notification-filter-type';
	      const targetNode = this.getTargetNode();
	      const items = this.filterTypes().map(group => ({
	        id: String(group.MODULE_ID),
	        entityId,
	        tabs: 'recents',
	        title: group.NAME,
	        selected: this.modelValue.some(item => item.id === String(group.MODULE_ID))
	      }));
	      const selector = new ui_entitySelector.TagSelector({
	        events: {
	          onTagAdd: event => {
	            const {
	              tag
	            } = event.getData();
	            if (!this.modelValue.some(type => type.id === tag.id)) {
	              var _tag$title$text, _tag$title;
	              const searchTypes = [...this.modelValue, {
	                id: tag.id,
	                name: (_tag$title$text = (_tag$title = tag.title) == null ? void 0 : _tag$title.text) != null ? _tag$title$text : String(tag.id)
	              }];
	              this.$emit('update:modelValue', searchTypes);
	            }
	          },
	          onTagRemove: event => {
	            const {
	              tag
	            } = event.getData();
	            const searchTypes = this.modelValue.filter(type => type.id !== tag.id);
	            this.$emit('update:modelValue', searchTypes);
	          }
	        },
	        multiple: true,
	        dialogOptions: {
	          height: 250,
	          width: 300,
	          multiple: true,
	          dropdownMode: true,
	          compactView: true,
	          showAvatars: false,
	          hideOnDeselect: false,
	          enableSearch: false,
	          targetNode,
	          items,
	          events: {
	            'Item:onSelect': event => {
	              const {
	                item
	              } = event.getData();
	              if (!this.modelValue.some(type => type.id === item.id)) {
	                var _item$title$text, _item$title;
	                const searchTypes = [...this.modelValue, {
	                  id: item.id,
	                  name: (_item$title$text = (_item$title = item.title) == null ? void 0 : _item$title.text) != null ? _item$title$text : String(item.id)
	                }];
	                this.$emit('update:modelValue', searchTypes);
	              }
	            },
	            onShow: () => {
	              this.$emit('popupStateChange', {
	                popup: 'type',
	                active: true
	              });
	            },
	            onHide: () => {
	              this.$emit('popupStateChange', {
	                popup: 'type',
	                active: false
	              });
	            }
	          }
	        }
	      });
	      const container = (_selector$getDialog = selector.getDialog()) == null ? void 0 : _selector$getDialog.getContainer();
	      if (container) {
	        main_core.Dom.attr(container, 'data-test-id', 'im_notifications-filter__types-field-selector');
	      }
	      return selector;
	    },
	    getTargetNode() {
	      var _this$$refs$typeSele, _this$$refs$typeSele2, _this$$refs$typeSele3;
	      return (_this$$refs$typeSele = (_this$$refs$typeSele2 = this.$refs['type-selector']) == null ? void 0 : (_this$$refs$typeSele3 = _this$$refs$typeSele2.$refs) == null ? void 0 : _this$$refs$typeSele3.inputContainer) != null ? _this$$refs$typeSele : this.$el;
	    },
	    filterTypes() {
	      const originalSchema = {
	        ...this.schema
	      };

	      // rename some groups
	      if (originalSchema.calendar) {
	        originalSchema.calendar.NAME = this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_TYPE_CALENDAR');
	      }
	      if (originalSchema.sender) {
	        originalSchema.sender.NAME = this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_TYPE_SENDER');
	      }
	      if (originalSchema.blog) {
	        originalSchema.blog.NAME = this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_TYPE_BLOG');
	      }
	      if (originalSchema.socialnetwork) {
	        originalSchema.socialnetwork.NAME = this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_TYPE_SOCIALNETWORK');
	      }
	      if (originalSchema.intranet) {
	        originalSchema.intranet.NAME = this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_TYPE_INTRANET');
	      }

	      // we need only these modules in this order!
	      const modulesToShowInFilter = ['tasks', 'calendar', 'crm', 'timeman', 'mail', 'disk', 'bizproc', 'voximplant', 'sender', 'blog', 'vote', 'socialnetwork', 'imopenlines', 'photogallery', 'intranet', 'forum'];
	      const notificationFilterTypes = [];
	      modulesToShowInFilter.forEach(moduleId => {
	        if (originalSchema[moduleId]) {
	          notificationFilterTypes.push(originalSchema[moduleId]);
	        }
	      });
	      return notificationFilterTypes;
	    }
	  },
	  template: `
		<div class="bx-im-notifications-filter_field__container">
			<div class="bx-im-notifications-filter_field__label">{{ labelText }}</div>
			<div
				ref="type-selector"
				class="bx-im-notifications-filter_field__selector-container"
				data-test-id="im_notifications-filter__type-field-container"
			/>
		</div>
	`
	};

	const DateFieldOption = {
	  NONE: 'none',
	  SINGLE: 'single',
	  RANGE: 'range'
	};
	const NotificationFilterDateField = {
	  name: 'DateFilterField',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BInput: ui_system_input_vue.BInput
	  },
	  props: {
	    modelValue: {
	      type: Object,
	      default: () => ({})
	    }
	  },
	  emits: ['update:modelValue', 'popupStateChange'],
	  data() {
	    return {
	      searchType: this.getCurrentSearchType()
	    };
	  },
	  beforeUnmount() {
	    var _this$menu;
	    (_this$menu = this.menu) == null ? void 0 : _this$menu.destroy();
	  },
	  computed: {
	    OutlineIcons: () => ui_iconSet_api_vue.Outline,
	    InputSize: () => ui_system_input_vue.InputSize,
	    isFirstDateNotEmpty() {
	      var _this$modelValue$date, _this$modelValue$date2;
	      return ((_this$modelValue$date = this.modelValue.date) == null ? void 0 : _this$modelValue$date.length) > 0 || ((_this$modelValue$date2 = this.modelValue.dateFrom) == null ? void 0 : _this$modelValue$date2.length) > 0;
	    },
	    isSecondDateNotEmpty() {
	      var _this$modelValue$date3;
	      return ((_this$modelValue$date3 = this.modelValue.dateTo) == null ? void 0 : _this$modelValue$date3.length) > 0;
	    },
	    labelText() {
	      return this.loc('IM_NOTIFICATIONS_FILTER_DATE_FIELD_TITLE');
	    },
	    dateOptionText() {
	      const currentOption = this.getDateOptions().find(option => option.id === this.searchType);
	      return currentOption ? currentOption.text : '';
	    },
	    showFirstDateInput() {
	      return this.searchType === DateFieldOption.SINGLE || this.searchType === DateFieldOption.RANGE;
	    },
	    showSecondDateInput() {
	      return this.searchType === DateFieldOption.RANGE;
	    },
	    firstDateValue() {
	      if (this.searchType === DateFieldOption.SINGLE) {
	        return this.modelValue.date || '';
	      }
	      if (this.searchType === DateFieldOption.RANGE) {
	        return this.modelValue.dateFrom || '';
	      }
	      return '';
	    },
	    secondDateValue() {
	      if (this.searchType === DateFieldOption.RANGE) {
	        return this.modelValue.dateTo || '';
	      }
	      return '';
	    }
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    getCurrentSearchType() {
	      if (this.modelValue.date) {
	        return DateFieldOption.SINGLE;
	      }
	      if (this.modelValue.dateFrom && this.modelValue.dateTo) {
	        return DateFieldOption.RANGE;
	      }
	      return DateFieldOption.NONE;
	    },
	    getDateOptions() {
	      return [{
	        id: DateFieldOption.NONE,
	        text: this.loc('IM_NOTIFICATIONS_FILTER_DATE_OPTION_NONE')
	      }, {
	        id: DateFieldOption.SINGLE,
	        text: this.loc('IM_NOTIFICATIONS_FILTER_DATE_OPTION_SINGLE')
	      }, {
	        id: DateFieldOption.RANGE,
	        text: this.loc('IM_NOTIFICATIONS_FILTER_DATE_OPTION_RANGE')
	      }];
	    },
	    getOptionsMenuItems() {
	      return this.getDateOptions().map(option => ({
	        title: option.text,
	        isSelected: option.id === this.searchType,
	        onClick: () => {
	          this.searchType = option.id;
	          this.$emit('update:modelValue', {});
	          this.menu.updateItems(this.getOptionsMenuItems());
	        }
	      }));
	    },
	    onDateOptionClick() {
	      this.$emit('popupStateChange', {
	        popup: 'dateOptions',
	        active: true
	      });
	      if (!this.menu) {
	        var _PopupManager$getPopu;
	        (_PopupManager$getPopu = main_popup.PopupManager.getPopupById('im-notification-filter-date-option')) == null ? void 0 : _PopupManager$getPopu.destroy();
	        this.menu = new ui_system_menu.Menu({
	          id: 'im-notification-filter-date-option',
	          maxHeight: 400,
	          animation: 'fading-slide',
	          items: this.getOptionsMenuItems(),
	          events: {
	            onPopupAfterClose: () => {
	              this.$emit('popupStateChange', {
	                popup: 'dateOptions',
	                active: false
	              });
	            }
	          }
	        });
	      }
	      this.menu.show(this.$refs.dateOption.$el);
	      const popupContainer = this.menu.getPopupContainer();
	      if (popupContainer) {
	        main_core.Dom.attr(popupContainer, 'data-test-id', 'im_notifications-filter__type-field-menu');
	      }
	    },
	    onDateFilterClick(event, toDate = false) {
	      this.$emit('popupStateChange', {
	        popup: 'datePicker',
	        active: true
	      });
	      if (this.ignoreNextClick) {
	        this.ignoreNextClick = false;
	        return;
	      }
	      this.datePickerInstance = new ui_datePicker.DatePicker({
	        targetNode: event.target,
	        animation: 'fading-slide',
	        events: {
	          [ui_datePicker.DatePickerEvent.SELECT]: pickerEvent => this.handleDatePickerSelect(pickerEvent, toDate),
	          onHide: () => {
	            this.datePickerInstance.destroy();
	          }
	        },
	        popupOptions: {
	          animation: 'fading-slide',
	          events: {
	            onPopupAfterClose: () => {
	              this.$emit('popupStateChange', {
	                popup: 'datePicker',
	                active: false
	              });
	            }
	          }
	        }
	      });
	      const value = toDate ? this.secondDateValue : this.firstDateValue;
	      if (value) {
	        const dateFormat = this.datePickerInstance.getDateFormat();
	        this.datePickerInstance.selectDates([ui_datePicker.createDate(value, dateFormat)]);
	      }
	      this.datePickerInstance.show();
	    },
	    onSecondDateFilterClick(event) {
	      this.onDateFilterClick(event, true);
	    },
	    handleDatePickerSelect(datePickerEvent, toDate = false) {
	      const {
	        date
	      } = datePickerEvent.getData();
	      const value = this.datePickerInstance.formatDate(date);
	      if (toDate) {
	        this.$emit('update:modelValue', {
	          date: this.modelValue.date || '',
	          dateFrom: this.modelValue.dateFrom || '',
	          dateTo: value
	        });
	        return;
	      }
	      if (this.searchType === DateFieldOption.SINGLE) {
	        this.$emit('update:modelValue', {
	          date: value,
	          dateFrom: '',
	          dateTo: ''
	        });
	        return;
	      }
	      this.$emit('update:modelValue', {
	        date: this.modelValue.date || '',
	        dateFrom: value,
	        dateTo: this.modelValue.dateTo || ''
	      });
	    },
	    onFirstDateClear() {
	      this.$emit('update:modelValue', {
	        date: '',
	        dateFrom: '',
	        dateTo: this.modelValue.dateTo || ''
	      });
	    },
	    onSecondDateClear() {
	      this.$emit('update:modelValue', {
	        date: this.modelValue.date || '',
	        dateFrom: this.modelValue.dateFrom || '',
	        dateTo: ''
	      });
	    }
	  },
	  template: `
		<div class="bx-im-notifications-filter_field__container">
			<div class="bx-im-notifications-filter_field__label">{{ labelText }}</div>
			<div class="bx-im-notifications-filter_field__selector-container bx-im-content-notification-date-field-container">
				<BInput
					v-model="dateOptionText"
					class="bx-im-content-notification-date-field"
					:class="[{ '--with-margin': showFirstDateInput }, { '--range-option': showSecondDateInput }]"
					ref="dateOption"
					:clickable="true"
					:dropdown="true"
					:size="InputSize.Lg"
					data-test-id="im_notifications-filter__date-options-container"
					@click="onDateOptionClick"
				/>
				<BInput
					v-if="showFirstDateInput"
					v-model="firstDateValue"
					class="bx-im-content-notification-date-field"
					:class="{'--with-margin': showSecondDateInput}"
					:icon="OutlineIcons.CALENDAR_WITH_SLOTS"
					:clickable="true"
					:withClear="isFirstDateNotEmpty"
					:size="InputSize.Lg"
					data-test-id="im_notifications-filter__date-from-date-container"
					@clear="onFirstDateClear"
					@click="onDateFilterClick"
				/>
				<div
					v-if="showSecondDateInput"
					class="bx-im-content-notification-date-field-line"
				>
					<span class="bx-im-content-notification-date-field-line-item"/>
				</div>
				<BInput
					v-if="showSecondDateInput"
					v-model="secondDateValue"
					class="bx-im-content-notification-date-field"
					:icon="OutlineIcons.CALENDAR_WITH_SLOTS"
					:clickable="true"
					:withClear="isSecondDateNotEmpty"
					:size="InputSize.Lg"
					data-test-id="im_notifications-filter__date-to-date-container"
					@clear="onSecondDateClear"
					@click="onSecondDateFilterClick"
				/>
			</div>
		</div>
	`
	};

	const POPUP_ID = 'im-content-notification-filter-popup';

	// @vue/component
	const NotificationFilterPopup = {
	  name: 'NotificationFilterPopup',
	  components: {
	    MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
	    NotificationFilterActionButtons,
	    NotificationFilterAuthorField,
	    NotificationFilterTypeField,
	    NotificationFilterDateField
	  },
	  props: {
	    bindElement: {
	      type: Object,
	      required: true
	    },
	    schema: {
	      type: Object,
	      required: false,
	      default: null
	    },
	    filterData: {
	      type: Object,
	      default: () => ({
	        searchTypes: [],
	        searchDate: {},
	        searchAuthors: []
	      })
	    }
	  },
	  emits: ['close', 'search', 'reset', 'mounted', 'popupStateChange'],
	  data() {
	    return {
	      searchTypes: this.filterData.searchTypes,
	      searchDate: this.filterData.searchDate,
	      searchAuthors: this.filterData.searchAuthors
	    };
	  },
	  computed: {
	    popupId: () => POPUP_ID,
	    config() {
	      return {
	        width: 560,
	        height: 350,
	        bindElement: this.bindElement,
	        offsetTop: 10,
	        autoHide: false,
	        padding: 0,
	        contentPadding: 0,
	        bindOptions: {
	          position: 'bottom'
	        },
	        className: 'bx-im-content-notification-filter-popup',
	        animation: 'fading-slide'
	      };
	    }
	  },
	  mounted() {
	    this.$emit('mounted', this.$refs.wrapper);
	  },
	  methods: {
	    buildData() {
	      return {
	        searchTypes: this.searchTypes,
	        searchDate: this.searchDate,
	        searchAuthors: this.searchAuthors
	      };
	    },
	    onSearchClick() {
	      this.$emit('search', this.buildData());
	    },
	    getContentElement() {
	      return this.$refs.wrapper;
	    }
	  },
	  template: `
		<MessengerPopup
			:config="config"
			:id="popupId"
		>
			<div
				class="bx-im-content-notification-filter-popup__wrapper"
				ref="wrapper"
			>
				<div class="bx-im-content-notification-filter-popup__fields-list bx-im-messenger__scope">
					<NotificationFilterAuthorField
						v-model="searchAuthors"
						@popupStateChange="$emit('popupStateChange', $event)"
					/>
					<NotificationFilterTypeField
						v-model="searchTypes"
						:schema="schema"
						@popupStateChange="$emit('popupStateChange', $event)"
					/>
					<NotificationFilterDateField
						v-model="searchDate"
						@popupStateChange="$emit('popupStateChange', $event)"
					/>
				</div>
				<NotificationFilterActionButtons
					@search="onSearchClick"
					@reset="this.$emit('reset')"
				/>
			</div>
		</MessengerPopup>
	`
	};

	const NotificationFilterFieldTypes = Object.freeze({
	  searchAuthors: 'searchAuthors',
	  searchTypes: 'searchTypes',
	  searchDate: 'searchDate'
	});

	// @vue/component
	const NotificationFilter = {
	  name: 'NotificationFilter',
	  components: {
	    NotificationFilterSearchInput,
	    NotificationFilterPopup
	  },
	  props: {
	    schema: {
	      type: Object,
	      required: false,
	      default: null
	    }
	  },
	  emits: ['search'],
	  data() {
	    return {
	      isInputFocused: false,
	      activePopups: {
	        author: false,
	        type: false,
	        dateOptions: false,
	        datePicker: false
	      },
	      filterData: {
	        searchQuery: '',
	        searchAuthors: [],
	        searchTypes: [],
	        searchDate: {}
	      },
	      popupElement: null
	    };
	  },
	  computed: {
	    displayData() {
	      var _this$filterData$sear, _this$filterData$sear2;
	      const searchTypeTitles = [];
	      (_this$filterData$sear = this.filterData.searchTypes) == null ? void 0 : _this$filterData$sear.forEach(type => {
	        searchTypeTitles.push(type.name);
	      });
	      const searchAuthorNames = [];
	      (_this$filterData$sear2 = this.filterData.searchAuthors) == null ? void 0 : _this$filterData$sear2.forEach(type => {
	        searchAuthorNames.push(type.name);
	      });
	      return {
	        searchTypes: searchTypeTitles,
	        searchDate: this.filterData.searchDate,
	        searchAuthors: searchAuthorNames
	      };
	    }
	  },
	  watch: {
	    'filterData.searchQuery': function (value) {
	      this.onSearchUpdate(value);
	    }
	  },
	  created() {
	    this.notificationFilterCacheService = NotificationFilterCacheService.getInstance();
	  },
	  mounted() {
	    main_core.Event.bind(document, 'click', this.handleClickOutside);
	  },
	  beforeUnmount() {
	    main_core.Event.unbind(document, 'click', this.handleClickOutside);
	    this.notificationFilterCacheService.clearCache();
	  },
	  methods: {
	    onInputFocus() {
	      this.isInputFocused = !this.isInputFocused;
	      this.clearActivePopups();
	    },
	    onPopupClose() {
	      this.isInputFocused = false;
	      this.clearActivePopups();
	    },
	    clearActivePopups() {
	      this.activePopups = {
	        author: false,
	        type: false,
	        dateOptions: false,
	        datePicker: false
	      };
	    },
	    applyData(data = {}, reset = false) {
	      var _data$searchTypes, _data$searchDate, _data$searchAuthors, _data$searchDate2, _this$filterData$sear3;
	      this.filterData = {
	        searchQuery: reset ? '' : this.filterData.searchQuery,
	        searchTypes: (_data$searchTypes = data.searchTypes) != null ? _data$searchTypes : [],
	        searchDate: (_data$searchDate = data.searchDate) != null ? _data$searchDate : {},
	        searchAuthors: (_data$searchAuthors = data.searchAuthors) != null ? _data$searchAuthors : []
	      };
	      const searchTypeIds = [];
	      if (main_core.Type.isArray(data.searchTypes)) {
	        data.searchTypes.forEach(type => {
	          searchTypeIds.push(type.id);
	        });
	      }
	      const searchAuthorIds = [];
	      if (main_core.Type.isArray(data.searchAuthors)) {
	        data.searchAuthors.forEach(author => {
	          searchAuthorIds.push(author.id);
	        });
	      }
	      let {
	        dateFrom,
	        dateTo
	      } = (_data$searchDate2 = data.searchDate) != null ? _data$searchDate2 : {};
	      if (dateFrom && dateTo) {
	        const dateFromTimestamp = new Date(dateFrom).getTime();
	        const dateToTimestamp = new Date(dateTo).getTime();
	        if (dateToTimestamp < dateFromTimestamp) {
	          [dateFrom, dateTo] = [dateTo, dateFrom];
	        }
	      } else {
	        dateFrom = '';
	        dateTo = '';
	      }
	      const valueData = {
	        searchQuery: this.filterData.searchQuery,
	        searchTypes: searchTypeIds,
	        searchDate: (_this$filterData$sear3 = this.filterData.searchDate.date) != null ? _this$filterData$sear3 : '',
	        searchDateFrom: dateFrom,
	        searchDateTo: dateTo,
	        searchAuthors: searchAuthorIds
	      };
	      this.$emit('search', valueData);
	    },
	    onPopupUpdate(data) {
	      this.applyData(data);
	      this.isInputFocused = false;
	    },
	    onFilterReset() {
	      this.applyData({}, true);
	      this.notificationFilterCacheService.clearCache();
	      this.isInputFocused = false;
	    },
	    onSearchUpdate() {
	      this.isInputFocused = false;
	      this.applyData(this.filterData);
	    },
	    onTagsRemove(keys) {
	      keys.forEach(key => {
	        switch (key) {
	          case NotificationFilterFieldTypes.searchTypes:
	            {
	              this.filterData.searchTypes = [];
	              break;
	            }
	          case NotificationFilterFieldTypes.searchDate:
	            {
	              this.filterData.searchDate = {};
	              break;
	            }
	          case NotificationFilterFieldTypes.searchAuthors:
	            {
	              this.filterData.searchAuthors = [];
	              this.notificationFilterCacheService.clearCache();
	              break;
	            }
	          default:
	            {
	              break;
	            }
	        }
	      });
	      this.isInputFocused = false;
	      this.applyData(this.filterData);
	    },
	    onPopupStateChange({
	      popup,
	      active
	    }) {
	      this.activePopups[popup] = active;
	    },
	    handleClickOutside(event) {
	      var _this$popupElement;
	      if (!this.isInputFocused) {
	        return;
	      }
	      const isAnyDialogActive = Object.values(this.activePopups).some(active => active);
	      if (isAnyDialogActive) {
	        return;
	      }
	      const inputElement = this.getInputElement();
	      const clickedInsideInput = inputElement == null ? void 0 : inputElement.contains(event.target);
	      const clickedInsidePopup = (_this$popupElement = this.popupElement) == null ? void 0 : _this$popupElement.contains(event.target);
	      if (!clickedInsideInput && !clickedInsidePopup) {
	        this.isInputFocused = false;
	      }
	    },
	    getInputElement() {
	      return this.$refs.searchInput;
	    },
	    onPopupMounted(element) {
	      this.popupElement = element;
	    }
	  },
	  template: `
		<div ref="searchInput">
			<NotificationFilterSearchInput
				:displayData="displayData"
				v-model="filterData.searchQuery"
				@clear="onFilterReset"
				@remove="onTagsRemove"
				@click="onInputFocus"
			/>
		</div>
		<NotificationFilterPopup
			v-if="isInputFocused"
			:schema="schema"
			:bindElement="getInputElement()"
			:filterData="filterData"
			@search="onPopupUpdate"
			@reset="onFilterReset"
			@close="onPopupClose"
			@mounted="onPopupMounted"
			@popupStateChange="onPopupStateChange"
			ref="filterPopup"
		/>
	`
	};

	const LIMIT_PER_PAGE = 50;
	class NotificationSearchService {
	  constructor() {
	    this.searchQuery = '';
	    this.searchTypes = [];
	    this.searchDate = null;
	    this.searchDateFrom = null;
	    this.searchDateTo = null;
	    this.searchAuthors = [];
	    this.store = null;
	    this.restClient = null;
	    this.userManager = null;
	    this.isLoading = false;
	    this.lastId = 0;
	    this.hasMoreItemsToLoad = true;
	    this.store = im_v2_application_core.Core.getStore();
	    this.restClient = im_v2_application_core.Core.getRestClient();
	    this.userManager = new im_v2_lib_user.UserManager();
	  }
	  loadFirstPage({
	    searchQuery,
	    searchAuthors,
	    searchTypes,
	    searchDate,
	    searchDateFrom,
	    searchDateTo
	  }) {
	    this.isLoading = true;
	    this.searchQuery = searchQuery;
	    this.searchAuthors = searchAuthors;
	    this.searchTypes = searchTypes;
	    this.searchDate = searchDate;
	    this.searchDateFrom = searchDateFrom;
	    this.searchDateTo = searchDateTo;
	    return this.requestItems({
	      firstPage: true
	    });
	  }
	  loadNextPage() {
	    if (this.isLoading || !this.hasMoreItemsToLoad) {
	      return Promise.resolve();
	    }
	    this.isLoading = true;
	    return this.requestItems();
	  }
	  searchInModel({
	    searchQuery,
	    searchAuthors,
	    searchTypes,
	    searchDate,
	    searchDateFrom,
	    searchDateTo
	  }) {
	    this.searchQuery = searchQuery;
	    this.searchAuthors = searchAuthors;
	    this.searchTypes = searchTypes;
	    this.searchDate = searchDate;
	    this.searchDateFrom = searchDateFrom;
	    this.searchDateTo = searchDateTo;
	    return this.store.getters['notifications/getSortedCollection'].filter(item => {
	      var _this$searchQuery, _this$searchTypes, _this$searchAuthors;
	      let result = false;
	      if (((_this$searchQuery = this.searchQuery) == null ? void 0 : _this$searchQuery.length) >= 3) {
	        result = item.text.toLowerCase().includes(this.searchQuery.toLowerCase());
	        if (!result) {
	          return result;
	        }
	      }
	      if (((_this$searchTypes = this.searchTypes) == null ? void 0 : _this$searchTypes.length) > 0) {
	        const settingPrefix = item.settingName.split('|')[0];
	        result = this.searchTypes.includes(settingPrefix);
	        if (!result) {
	          return result;
	        }
	      }
	      if (this.searchDateFrom !== '' && this.searchDateTo !== '') {
	        const fromDate = BX.parseDate(this.searchDateFrom);
	        const toDate = BX.parseDate(this.searchDateTo);
	        if (fromDate instanceof Date && toDate instanceof Date) {
	          const itemDateForCompare = new Date(item.date.getTime()).setHours(0, 0, 0, 0);
	          const fromDateForCompare = fromDate.setHours(0, 0, 0, 0);
	          const toDateForCompare = toDate.setHours(0, 0, 0, 0);
	          result = itemDateForCompare >= fromDateForCompare && itemDateForCompare <= toDateForCompare;
	          if (!result) {
	            return result;
	          }
	        }
	      } else if (this.searchDate !== '') {
	        const date = BX.parseDate(this.searchDate);
	        if (date instanceof Date) {
	          const itemDateForCompare = new Date(item.date.getTime()).setHours(0, 0, 0, 0);
	          const dateFromInput = date.setHours(0, 0, 0, 0);
	          result = itemDateForCompare === dateFromInput;
	          if (!result) {
	            return result;
	          }
	        }
	      }
	      if (((_this$searchAuthors = this.searchAuthors) == null ? void 0 : _this$searchAuthors.length) > 0) {
	        result = this.searchAuthors.includes(item.authorId);
	        if (!result) {
	          return result;
	        }
	      }
	      return result;
	    });
	  }
	  requestItems({
	    firstPage = false
	  } = {}) {
	    const queryParams = this.getSearchRequestParams(firstPage);
	    return this.restClient.callMethod(im_v2_const.RestMethod.imNotifyHistorySearch, queryParams).then(response => {
	      const responseData = response.data();
	      im_v2_lib_logger.Logger.warn('im.notify.history.search: first page results', responseData);
	      this.hasMoreItemsToLoad = !this.isLastPage(responseData.notifications);
	      if (!responseData || responseData.notifications.length === 0) {
	        im_v2_lib_logger.Logger.warn('im.notify.get: no notifications', responseData);
	        return [];
	      }
	      this.lastId = this.getLastItemId(responseData.notifications);
	      this.userManager.setUsersToModel(responseData.users);
	      this.isLoading = false;
	      return responseData.notifications;
	    }).catch(result => {
	      console.error('NotificationService: requestItems error', result.error());
	    });
	  }
	  getSearchRequestParams(firstPage) {
	    const requestParams = {
	      SEARCH_TEXT: this.searchQuery,
	      SEARCH_TYPES: this.searchTypes,
	      SEARCH_AUTHORS: this.searchAuthors,
	      LIMIT: LIMIT_PER_PAGE,
	      CONVERT_TEXT: 'Y'
	    };
	    if (BX.parseDate(this.searchDateFrom) instanceof Date && BX.parseDate(this.searchDateTo) instanceof Date) {
	      requestParams.SEARCH_DATE_FROM = BX.parseDate(this.searchDateFrom).toISOString();
	      requestParams.SEARCH_DATE_TO = BX.parseDate(this.searchDateTo).toISOString();
	    } else if (BX.parseDate(this.searchDate) instanceof Date) {
	      requestParams.SEARCH_DATE = BX.parseDate(this.searchDate).toISOString();
	    }
	    if (!firstPage) {
	      requestParams.LAST_ID = this.lastId;
	    }
	    return requestParams;
	  }
	  getLastItemId(collection) {
	    return collection[collection.length - 1].id;
	  }
	  isLastPage(notifications) {
	    return !main_core.Type.isArrayFilled(notifications) || notifications.length < LIMIT_PER_PAGE;
	  }
	  destroy() {
	    im_v2_lib_logger.Logger.warn('Notification search service destroyed');
	  }
	}

	// @vue/component
	const NotificationContent = {
	  name: 'NotificationContent',
	  components: {
	    ItemPlaceholder,
	    ScrollButton,
	    NotificationFilter,
	    UserListPopup: im_v2_component_elements_userListPopup.UserListPopup,
	    Loader: im_v2_component_elements_loader.Loader
	  },
	  directives: {
	    'notifications-item-observer': {
	      mounted(element, binding) {
	        binding.instance.observer.observe(element);
	      },
	      beforeUnmount(element, binding) {
	        binding.instance.observer.unobserve(element);
	      }
	    }
	  },
	  data() {
	    return {
	      isInitialLoading: false,
	      initialLoadComplete: false,
	      readQueue: new Set(),
	      isNextPageLoading: false,
	      notificationsOnScreen: new Set(),
	      markedAsUnreadIds: new Set(),
	      windowFocused: false,
	      showSearchResult: false,
	      popupBindElement: null,
	      showUserListPopup: false,
	      userListIds: null,
	      schema: {}
	    };
	  },
	  computed: {
	    NotificationTypesCodes: () => im_v2_const.NotificationTypesCodes,
	    notificationCollection() {
	      return this.$store.getters['notifications/getSortedCollection'];
	    },
	    confirmNotifications() {
	      return this.notifications.filter(notification => {
	        return notification.sectionCode === im_v2_const.NotificationTypesCodes.confirm;
	      });
	    },
	    hasNotifications() {
	      return this.notificationCollection.length > 0;
	    },
	    hasConfirmNotifications() {
	      return this.confirmNotifications.length > 0;
	    },
	    simpleNotifications() {
	      return this.notifications.filter(notification => {
	        return notification.sectionCode !== im_v2_const.NotificationTypesCodes.confirm;
	      });
	    },
	    confirmNotificationsCounter() {
	      return this.confirmNotifications.length;
	    },
	    formattedCounter() {
	      return this.confirmNotificationsCounter > 99 ? '99+' : String(this.confirmNotificationsCounter);
	    },
	    searchResultCollection() {
	      return this.$store.getters['notifications/getSearchResultCollection'];
	    },
	    notifications() {
	      if (this.showSearchResult) {
	        return this.searchResultCollection;
	      }
	      return this.notificationCollection;
	    },
	    isReadAllAvailable() {
	      if (this.showSearchResult) {
	        return false;
	      }
	      return this.unreadCounter > 0;
	    },
	    isEmptyState() {
	      return this.notifications.length === 0 && !this.isInitialLoading && !this.isNextPageLoading;
	    },
	    emptyStateIcon() {
	      return this.showSearchResult ? 'bx-im-content-notification__not-found-icon' : 'bx-im-content-notification__empty-state-icon';
	    },
	    emptyStateTitle() {
	      return this.showSearchResult ? this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_RESULTS_NOT_FOUND') : this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_NO_NEW_ITEMS');
	    },
	    enableAutoRead() {
	      return this.$store.getters['application/settings/get'](im_v2_const.Settings.notification.enableAutoRead);
	    },
	    ...ui_vue3_vuex.mapState({
	      unreadCounter: state => state.notifications.unreadCounter
	    })
	  },
	  created() {
	    this.notificationService = new im_v2_provider_service_notification.NotificationService();
	    this.notificationSearchService = new NotificationSearchService();
	    this.notificationReadService = new NotificationReadService();
	    this.headerMenu = new NotificationHeaderMenu();
	    this.searchOnServerDelayed = main_core.Runtime.debounce(this.searchOnServer, 1500, this);
	    main_core.Event.bind(window, 'focus', this.onWindowFocus);
	    main_core.Event.bind(window, 'blur', this.onWindowBlur);
	    this.initObserver();
	    main_core_events.EventEmitter.subscribe(NotificationMenu.events.markAsUnreadClick, this.onMarkAsUnreadClick);
	  },
	  async mounted() {
	    this.isInitialLoading = true;
	    this.windowFocused = document.hasFocus();
	    this.schema = await this.notificationService.loadFirstPage();
	    this.isInitialLoading = false;
	    this.initialLoadComplete = true;
	    this.processReadQueue();
	  },
	  beforeUnmount() {
	    if (this.initialLoadComplete && this.enableAutoRead) {
	      this.notificationReadService.readAll([...this.markedAsUnreadIds]);
	    }
	    this.notificationService.destroy();
	    this.notificationSearchService.destroy();
	    this.notificationReadService.destroy();
	    if (this.headerMenu) {
	      this.headerMenu.destroy();
	    }
	    main_core.Event.unbind(window, 'focus', this.onWindowFocus);
	    main_core.Event.unbind(window, 'blur', this.onWindowBlur);
	    main_core_events.EventEmitter.unsubscribe(NotificationMenu.events.markAsUnreadClick, this.onMarkAsUnreadClick);
	  },
	  methods: {
	    initObserver() {
	      this.observer = new IntersectionObserver(entries => {
	        entries.forEach(entry => {
	          const notificationId = Number.parseInt(entry.target.dataset.id, 10);
	          if (!entry.isIntersecting) {
	            this.notificationsOnScreen.delete(notificationId);
	            return;
	          }
	          if (entry.intersectionRatio >= 0.7 || entry.intersectionRatio > 0 && entry.intersectionRect.height > entry.rootBounds.height / 2) {
	            this.read(notificationId);
	            this.notificationsOnScreen.add(notificationId);
	          } else {
	            this.notificationsOnScreen.delete(notificationId);
	          }
	        });
	      }, {
	        root: this.$refs.listNotifications,
	        threshold: Array.from({
	          length: 101
	        }).fill(0).map((zero, index) => index * 0.01)
	      });
	    },
	    read(notificationIds) {
	      if (!this.enableAutoRead) {
	        im_v2_lib_logger.Logger.warn('Notifications: Auto read is disabled!');
	        return;
	      }
	      if (!this.windowFocused) {
	        return;
	      }
	      if (main_core.Type.isNumber(notificationIds)) {
	        notificationIds = [notificationIds];
	      }
	      if (!this.initialLoadComplete) {
	        notificationIds.forEach(id => this.readQueue.add(id));
	        return;
	      }
	      const simpleNotificationIds = notificationIds.filter(notificationId => {
	        const notification = this.$store.getters['notifications/getById'](notificationId);
	        return notification.sectionCode !== im_v2_const.NotificationTypesCodes.confirm;
	      });
	      if (simpleNotificationIds.length > 0) {
	        this.notificationReadService.addToReadQueue(simpleNotificationIds);
	        this.notificationReadService.read();
	      }
	    },
	    processReadQueue() {
	      if (this.readQueue.size === 0) {
	        return;
	      }
	      im_v2_lib_logger.Logger.warn(`Processing initial read queue with ${this.readQueue.size} items.`);
	      const idsToRead = [...this.readQueue];
	      this.readQueue.clear();
	      this.read(idsToRead);
	    },
	    async searchOnServer(event) {
	      const result = await this.notificationSearchService.loadFirstPage(event);
	      this.isNextPageLoading = false;
	      this.setSearchResult(result);
	    },
	    setSearchResult(items) {
	      this.$store.dispatch('notifications/setSearchResult', {
	        notifications: items
	      });
	    },
	    getComponentForItem(notification) {
	      var _notification$params;
	      const componentId = (_notification$params = notification.params) == null ? void 0 : _notification$params.componentId;
	      if (componentId && NotificationComponents[componentId]) {
	        return NotificationComponents[componentId];
	      }
	      return NotificationComponents.CompatibilityEntity;
	    },
	    onScrollButtonClick(offset) {
	      this.$refs.listNotifications.scroll({
	        top: offset,
	        behavior: 'smooth'
	      });
	    },
	    onScroll(event) {
	      NotificationMenu.closeMenuOnScroll();
	      this.showUserListPopup = false;
	      if (this.showSearchResult) {
	        this.onScrollSearchResult(event);
	      } else {
	        this.onScrollNotifications(event);
	      }
	    },
	    onClickHeaderMenu(event) {
	      this.headerMenu.openMenu(this.isReadAllAvailable, event.currentTarget);
	    },
	    onScrollNotifications(event) {
	      if (!im_v2_lib_utils.Utils.dom.isOneScreenRemaining(event.target) || !this.notificationService.hasMoreItemsToLoad || this.isInitialLoading || this.isNextPageLoading) {
	        return;
	      }
	      this.isNextPageLoading = true;
	      this.notificationService.loadNextPage().then(() => {
	        this.isNextPageLoading = false;
	      });
	    },
	    async onScrollSearchResult(event) {
	      if (!im_v2_lib_utils.Utils.dom.isOneScreenRemaining(event.target) || !this.notificationSearchService.hasMoreItemsToLoad || this.isInitialLoading || this.isNextPageLoading) {
	        return;
	      }
	      this.isNextPageLoading = true;
	      const result = await this.notificationSearchService.loadNextPage();
	      this.isNextPageLoading = false;
	      this.setSearchResult(result);
	    },
	    onConfirmButtonsClick(button) {
	      const {
	        id,
	        value
	      } = button;
	      const notificationId = Number.parseInt(id, 10);
	      this.notificationsOnScreen.delete(notificationId);
	      this.notificationService.sendConfirmAction(notificationId, value);
	    },
	    onDeleteClick(notificationId) {
	      this.notificationsOnScreen.delete(notificationId);
	      this.notificationService.delete(notificationId);
	    },
	    onMoreUsersClick(event) {
	      im_v2_lib_logger.Logger.warn('onMoreUsersClick', event);
	      this.popupBindElement = event.event.target;
	      this.userListIds = event.users;
	      this.showUserListPopup = true;
	    },
	    onSearch(event) {
	      var _event$searchQuery, _event$searchTypes, _event$searchAuthors;
	      if (((_event$searchQuery = event.searchQuery) == null ? void 0 : _event$searchQuery.length) < 3 && ((_event$searchTypes = event.searchTypes) == null ? void 0 : _event$searchTypes.length) === 0 && event.searchDate === '' && (event.searchDateFrom === '' || event.searchDateTo === '') && ((_event$searchAuthors = event.searchAuthors) == null ? void 0 : _event$searchAuthors.length) === 0) {
	        this.showSearchResult = false;
	        return;
	      }
	      this.showSearchResult = true;
	      const localResult = this.notificationSearchService.searchInModel(event);
	      this.$store.dispatch('notifications/clearSearchResult');
	      this.$store.dispatch('notifications/setSearchResult', {
	        notifications: localResult,
	        skipValidation: true
	      });
	      this.isNextPageLoading = true;
	      this.searchOnServerDelayed(event);
	    },
	    onSendQuickAnswer(event) {
	      this.notificationService.sendQuickAnswer(event);
	    },
	    onWindowFocus() {
	      this.windowFocused = true;
	      this.read([...this.notificationsOnScreen]);
	    },
	    onWindowBlur() {
	      this.windowFocused = false;
	    },
	    onLeave(element, done) {
	      const ANIMATION_DURATION_MS = 250;
	      const {
	        height
	      } = element.getBoundingClientRect();
	      main_core.Dom.style(element, 'height', `${height}px`);
	      requestAnimationFrame(() => {
	        main_core.Dom.addClass(element, '--leave');
	        main_core.Dom.style(element, 'height', '0px');
	      });
	      setTimeout(done, ANIMATION_DURATION_MS);
	    },
	    onDoubleClick(notificationId) {
	      const notification = this.$store.getters['notifications/getById'](notificationId) || this.$store.getters['notifications/getSearchItemById'](notificationId);
	      if (!notification) {
	        return;
	      }
	      main_core.Event.EventEmitter.emit(NotificationMenu.events.markAsUnreadClick, notification);
	    },
	    onMarkAsUnreadClick(event) {
	      const notification = event.getData();
	      if (!notification) {
	        return;
	      }
	      const notificationId = notification.id;
	      if (notification.read) {
	        this.markedAsUnreadIds.add(notificationId);
	      } else {
	        this.markedAsUnreadIds.delete(notificationId);
	      }
	    },
	    getNotificationsBackgroundStyle() {
	      return im_v2_lib_theme.ThemeManager.getBackgroundStyleById(im_v2_lib_theme.SpecialBackground.notifications);
	    }
	  },
	  template: `
		<div class="bx-im-content-notification__container --ui-context-content-light">
			<div class="bx-im-content-notification__header-container">
				<div class="bx-im-content-notification__header">
					<div class="bx-im-content-notification__header-left-container">
						<div class="bx-im-content-notification__header-panel-container">
							<div class="bx-im-content-notification__panel-title_icon"></div>
							<div class="bx-im-content-notification__panel_text">
								{{ $Bitrix.Loc.getMessage('IM_NOTIFICATIONS_HEADER') }}
							</div>
						</div>
						<NotificationFilter
							v-if="hasNotifications"
							:schema="schema"
							@search="onSearch"
						/>
					</div>
					<div v-if="hasNotifications" class="bx-im-content-notification__header-buttons-container">
						<div
							class="bx-im-content-notification__header-menu"
							@click="onClickHeaderMenu"
						></div>
					</div>
				</div>
			</div>
			<div class="bx-im-content-notification__elements-container">
				<div
					class="bx-im-content-notification__elements"
					@scroll.passive="onScroll"
					ref="listNotifications"
					:style="getNotificationsBackgroundStyle()"
				>
					<div v-if="hasConfirmNotifications" class="bx-im-content-notification__elements-group">
						 <div class="bx-im-content-notification__elements-title">
							 {{ $Bitrix.Loc.getMessage('IM_NOTIFICATIONS_GROUP_TITLE') }}
							 <div
								 class="bx-im-content-notification__elements-group-counter"
							 >
								 {{ formattedCounter }}
							 </div>
						 </div>
						<TransitionGroup 
							name="notification-confirm-item"
							tag="div" 
							@leave="onLeave"
						>
							<component
								v-for="notification in confirmNotifications"
								:is="getComponentForItem(notification)"
								:key="notification.id"
								:data-id="notification.id"
								:notification="notification"
								@confirmButtonsClick="onConfirmButtonsClick"
								@deleteClick="onDeleteClick"
								@moreUsersClick="onMoreUsersClick"
								@sendQuickAnswer="onSendQuickAnswer"
								v-notifications-item-observer
							/>
						</TransitionGroup>
					</div>
					<TransitionGroup 
						name="notification-simple-item"
						tag="div"
						@leave="onLeave"
					>
						<component
							v-for="notification in simpleNotifications"
							:is="getComponentForItem(notification)"
							:key="notification.id"
							:data-id="notification.id"
							:notification="notification"
							@confirmButtonsClick="onConfirmButtonsClick"
							@deleteClick="onDeleteClick"
							@moreUsersClick="onMoreUsersClick"
							@sendQuickAnswer="onSendQuickAnswer"
							@dblclick="onDoubleClick(notification.id)"
							v-notifications-item-observer
						/>
					</TransitionGroup>
					<div v-if="isEmptyState" class="bx-im-content-notification__empty-state-container">
						<div :class="emptyStateIcon"></div>
						<span class="bx-im-content-notification__empty-state-title">
							{{ emptyStateTitle }}
						</span>
					</div>
					<ItemPlaceholder v-if="isInitialLoading" />
					<div v-if="isNextPageLoading" class="bx-im-content-notification__loader-container">
						<Loader />
					</div>
				</div>
				<ScrollButton
					v-if="!isInitialLoading || !isNextPageLoading"
					:unreadCounter="unreadCounter"
					:notificationsOnScreen="notificationsOnScreen"
					@scrollButtonClick="onScrollButtonClick"
				/>
				<UserListPopup
					v-if="showUserListPopup"
					:userIds="userListIds"
					:bindElement="popupBindElement"
					:showPopup="showUserListPopup"
					@close="showUserListPopup = false"
				/>
			</div>
		</div>
	`
	};

	exports.NotificationContent = NotificationContent;

}((this.BX.Messenger.v2.Component.Content = this.BX.Messenger.v2.Component.Content || {}),BX,BX.Messenger.v2.Service,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Service,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Lib,BX.Messenger.v2.Component.Elements,BX.Ui,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Component.Elements,BX.Vue3.Vuex,BX.UI.System.Chip.Vue,BX.Messenger.v2.Component.Elements,BX.Vue3.Components,BX.UI.IconSet,BX.UI.EntitySelector,BX.Event,BX.Main,BX.UI.System,BX.UI.DatePicker,BX.UI.System.Input.Vue,BX.UI.IconSet,BX.Messenger.v2.Css,BX,BX.Messenger.v2.Application,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Const));
//# sourceMappingURL=notification-content.bundle.js.map
