/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,main_polyfill_intersectionobserver,im_v2_provider_service_notification,im_v2_component_elements_userListPopup,im_v2_component_elements_loader,im_v2_lib_theme,im_v2_lib_rest,ui_system_menu,im_v2_provider_service_settings,im_v2_lib_notifier,ui_iconSet_api_vue,im_v2_lib_utils,main_core_events,im_v2_component_elements_attach,im_v2_lib_dateFormatter,ui_vue3_components_button,im_v2_component_elements_avatar,ui_reactionsSelect,im_v2_lib_parser,im_public,im_v2_component_elements_chatTitle,ui_forms,im_v2_lib_escManager,ui_vue3_vuex,main_core,im_v2_application_core,im_v2_lib_user,im_v2_lib_logger,im_v2_const) {
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
	  readAll() {
	    this.store.dispatch('notifications/readAllSimple');
	    this.restClient.callMethod(im_v2_const.RestMethod.imNotifyReadAll, {
	      id: 0
	    }).then(response => {
	      const currentCounter = this.store.getters['notifications/getCounter'];
	      const newCounter = response.answer.result.newCounter;
	      if (newCounter < currentCounter) {
	        void this.store.dispatch('notifications/setCounter', newCounter);
	      }
	      im_v2_lib_logger.Logger.warn('I have read ALL the notifications', response);
	    }).catch(result => {
	      console.error('NotificationReadService: readAll error', result.error());
	    });
	  }
	  changeReadStatus(notificationId) {
	    const notification = this.store.getters['notifications/getById'](notificationId);
	    this.store.dispatch('notifications/read', {
	      ids: [notification.id],
	      read: !notification.read
	    });
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
	    return [this.getReadAllItem(isReadAllAvailable)];
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
	var _isEnabledAutoRead = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isEnabledAutoRead");
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
	    Object.defineProperty(this, _isEnabledAutoRead, {
	      value: _isEnabledAutoRead2
	    });
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
	  const isAutoReadEnabled = babelHelpers.classPrivateFieldLooseBase(this, _isEnabledAutoRead)[_isEnabledAutoRead]();
	  if (isAutoReadEnabled) {
	    return null;
	  }
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
	function _isEnabledAutoRead2() {
	  return this.store.getters['application/settings/get'](im_v2_const.Settings.notification.enableAutoRead);
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
	      return item.value;
	    },
	    isUserHasAvatar(item) {
	      return item.type === 'user' && item.user.avatar;
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
					<span class="bx-im-content-notification-item-content__details-text">{{ getItemValue(item) }}</span>
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
		<div v-if="isChangedType" class="bx-im-content-notification-item-content__details-item">
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
	    },
	    searchMode: {
	      type: Boolean,
	      default: false
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
	      return !this.notificationItem.read && !this.searchMode;
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

	// @vue/component
	const SearchPanel = {
	  name: 'SearchPanel',
	  props: {
	    schema: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['search', 'close'],
	  data() {
	    return {
	      searchQuery: '',
	      searchType: '',
	      searchDate: ''
	    };
	  },
	  computed: {
	    filterTypes() {
	      const originalSchema = {
	        ...this.schema
	      };

	      // get rid of some subcategories
	      const modulesToRemove = ['timeman', 'mail', 'disk', 'bizproc', 'voximplant', 'sender', 'blog', 'vote', 'socialnetwork', 'imopenlines', 'photogallery', 'intranet', 'forum'];
	      modulesToRemove.forEach(moduleId => {
	        if (originalSchema[moduleId]) {
	          delete originalSchema[moduleId].LIST;
	        }
	      });

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
	    },
	    isEmptyQuery() {
	      return this.searchQuery.trim() === '';
	    },
	    hasFocus() {
	      return document.activeElement === this.$refs.searchInput;
	    }
	  },
	  watch: {
	    searchQuery() {
	      this.search();
	    },
	    searchType() {
	      this.search();
	    },
	    searchDate() {
	      this.search();
	    }
	  },
	  created() {
	    this.getEmitter().subscribe(im_v2_const.EventType.key.onBeforeEscape, this.onBeforeEscape);
	  },
	  beforeUnmount() {
	    this.getEmitter().unsubscribe(im_v2_const.EventType.key.onBeforeEscape, this.onBeforeEscape);
	  },
	  methods: {
	    search() {
	      this.$emit('search', {
	        searchQuery: this.searchQuery,
	        searchType: this.searchType,
	        searchDate: this.searchDate
	      });
	    },
	    onDateFilterClick(event) {
	      if (BX && BX.calendar && BX.calendar.get().popup) {
	        BX.calendar.get().popup.close();
	      }

	      // eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
	      BX.calendar({
	        node: event.target,
	        field: event.target,
	        bTime: false,
	        callback_after: () => {
	          this.searchDate = event.target.value;
	        }
	      });
	    },
	    onBeforeEscape() {
	      if (!this.hasFocus) {
	        return im_v2_lib_escManager.EscEventAction.ignored;
	      }
	      if (this.isEmptyQuery) {
	        this.$emit('close');
	      } else {
	        this.searchQuery = '';
	      }
	      return im_v2_lib_escManager.EscEventAction.handled;
	    },
	    getEmitter() {
	      return this.$Bitrix.eventEmitter;
	    }
	  },
	  template: `
		<div class="bx-im-notifications-header-filter-box">
			<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-sm ui-ctl-w25">
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				<select class="ui-ctl-element" v-model="searchType">
					<option value="">
						{{ $Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_TYPE_PLACEHOLDER') }}
					</option>
					<template v-for="group in filterTypes">
						<template v-if="group.LIST">
							<optgroup :label="group.NAME">
								<option v-for="option in group.LIST" :value="option.ID">
									{{ option.NAME }}
								</option>
							</optgroup>
						</template>
						<template v-else>
							<option :value="group.MODULE_ID">
								{{ group.NAME }}
							</option>
						</template>
					</template>
				</select>
			</div>
			<div class="ui-ctl ui-ctl-textbox ui-ctl-after-icon ui-ctl-sm ui-ctl-w50">
				<button class="ui-ctl-after ui-ctl-icon-clear" @click.prevent="searchQuery=''"></button>
				<input
					autofocus
					ref="searchInput"
					type="text"
					class="ui-ctl-element"
					v-model="searchQuery"
					:placeholder="$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_TEXT_PLACEHOLDER')"
				>
			</div>
			<div class="ui-ctl ui-ctl-after-icon ui-ctl-before-icon ui-ctl-sm ui-ctl-w25">
				<div class="ui-ctl-before ui-ctl-icon-calendar"></div>
				<input
					type="text"
					class="ui-ctl-element ui-ctl-textbox"
					v-model="searchDate"
					@focus.prevent.stop="onDateFilterClick"
					@click.prevent.stop="onDateFilterClick"
					:placeholder="$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_DATE_PLACEHOLDER')"
					readonly
				>
				<button class="ui-ctl-after ui-ctl-icon-clear" @click.prevent="searchDate=''"></button>
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

	const LIMIT_PER_PAGE = 50;
	class NotificationSearchService {
	  constructor() {
	    this.searchQuery = '';
	    this.searchType = '';
	    this.searchDate = null;
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
	    searchType,
	    searchDate
	  }) {
	    this.isLoading = true;
	    this.searchQuery = searchQuery;
	    this.searchType = searchType;
	    this.searchDate = searchDate;
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
	    searchType,
	    searchDate
	  }) {
	    this.searchQuery = searchQuery;
	    this.searchType = searchType;
	    this.searchDate = searchDate;
	    return this.store.getters['notifications/getSortedCollection'].filter(item => {
	      let result = false;
	      if (this.searchQuery.length >= 3) {
	        result = item.text.toLowerCase().includes(this.searchQuery.toLowerCase());
	        if (!result) {
	          return result;
	        }
	      }
	      if (this.searchType !== '') {
	        result = item.settingName === this.searchType; // todo: ???
	        if (!result) {
	          return result;
	        }
	      }
	      if (this.searchDate !== '') {
	        const date = BX.parseDate(this.searchDate);
	        if (date instanceof Date) {
	          // compare dates excluding time.
	          const itemDateForCompare = new Date(item.date.getTime()).setHours(0, 0, 0, 0);
	          const dateFromInput = date.setHours(0, 0, 0, 0);
	          result = itemDateForCompare === dateFromInput;
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
	      SEARCH_TYPE: this.searchType,
	      LIMIT: LIMIT_PER_PAGE,
	      CONVERT_TEXT: 'Y'
	    };
	    if (BX.parseDate(this.searchDate) instanceof Date) {
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
	    SearchPanel,
	    ItemPlaceholder,
	    ScrollButton,
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
	      windowFocused: false,
	      showSearchPanel: false,
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
	  watch: {
	    showSearchPanel(newValue, oldValue) {
	      if (newValue === false && oldValue === true) {
	        this.showSearchResult = false;
	        this.$store.dispatch('notifications/clearSearchResult');
	      }
	    }
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
	      this.notificationReadService.readAll();
	    }
	    this.notificationService.destroy();
	    this.notificationSearchService.destroy();
	    this.notificationReadService.destroy();
	    if (this.headerMenu) {
	      this.headerMenu.destroy();
	    }
	    main_core.Event.unbind(window, 'focus', this.onWindowFocus);
	    main_core.Event.unbind(window, 'blur', this.onWindowBlur);
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
	      if (event.searchQuery.length < 3 && event.searchType === '' && event.searchDate === '') {
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
	      if (this.enableAutoRead) {
	        return;
	      }
	      const notification = this.$store.getters['notifications/getById'](notificationId);
	      if (!notification) {
	        return;
	      }
	      main_core.Event.EventEmitter.emit(NotificationMenu.events.markAsUnreadClick, notification);
	    },
	    getNotificationsBackgroundStyle() {
	      return im_v2_lib_theme.ThemeManager.getBackgroundStyleById(im_v2_lib_theme.SpecialBackground.notifications);
	    }
	  },
	  template: `
		<div class="bx-im-content-notification__container --ui-context-content-light">
			<div class="bx-im-content-notification__header-container">
				<div class="bx-im-content-notification__header">
					<div class="bx-im-content-notification__header-panel-container">
						<div class="bx-im-content-notification__panel-title_icon"></div>
						<div class="bx-im-content-notification__panel_text">
							{{ $Bitrix.Loc.getMessage('IM_NOTIFICATIONS_HEADER') }}
						</div>
					</div>
					<div v-if="notificationCollection.length > 0" class="bx-im-content-notification__header-buttons-container">
						<div
							class="bx-im-content-notification__header_button bx-im-content-notification__header_filter-button"
							:class="[showSearchPanel ? '--active' : '']"
							@click="showSearchPanel = !showSearchPanel"
							:title="$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_OPEN_BUTTON')"
						></div>
						<div
							v-if="!enableAutoRead"
							class="bx-im-content-notification__header-menu"
							@click="onClickHeaderMenu"
						></div>
					</div>
				</div>
				<SearchPanel 
					v-if="showSearchPanel" 
					:schema="schema" 
					@search="onSearch" 
					@close="showSearchPanel = false" 
				/>
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

}((this.BX.Messenger.v2.Component.Content = this.BX.Messenger.v2.Component.Content || {}),BX,BX.Messenger.v2.Service,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.UI.System,BX.Messenger.v2.Service,BX.Messenger.v2.Lib,BX.UI.IconSet,BX.Messenger.v2.Lib,BX.Event,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Lib,BX.Vue3.Components,BX.Messenger.v2.Component.Elements,BX.Ui,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Component.Elements,BX,BX.Messenger.v2.Lib,BX.Vue3.Vuex,BX,BX.Messenger.v2.Application,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Const));
//# sourceMappingURL=notification-content.bundle.js.map
