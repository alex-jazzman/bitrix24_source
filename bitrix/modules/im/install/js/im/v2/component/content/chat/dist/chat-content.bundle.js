/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,im_v2_lib_layout,im_v2_lib_textarea,im_v2_component_sidebar,im_v2_component_entitySelector,im_v2_lib_localStorage,im_v2_lib_menu,im_v2_lib_rest,im_public,im_v2_lib_call,im_v2_component_animation,im_v2_lib_utils,ui_uploader_core,im_v2_lib_theme,main_core,im_v2_application_core,ui_notification,im_v2_lib_permission,im_v2_lib_logger,im_v2_model,im_v2_component_dialog_chat,im_v2_component_messageList,im_v2_component_textarea,main_core_events,im_v2_component_elements,im_v2_const,im_v2_provider_service) {
	'use strict';

	const Height = {
	  chatHeader: 64,
	  pinnedMessages: 53,
	  blockedTextarea: 50,
	  dropAreaOffset: 16
	};

	const CallTypes = {
	  video: {
	    id: 'video',
	    locCode: 'IM_CONTENT_CHAT_HEADER_VIDEOCALL',
	    start: dialogId => {
	      im_public.Messenger.startVideoCall(dialogId);
	    }
	  },
	  audio: {
	    id: 'audio',
	    locCode: 'IM_CONTENT_CHAT_HEADER_CALL_MENU_AUDIO',
	    start: dialogId => {
	      im_public.Messenger.startVideoCall(dialogId, false);
	    }
	  },
	  beta: {
	    id: 'beta',
	    locCode: 'IM_CONTENT_CHAT_HEADER_CALL_MENU_BETA_2',
	    start: dialogId => {
	      const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
	      im_v2_lib_call.CallManager.getInstance().createBetaCallRoom(dialog.chatId);
	    }
	  }
	};

	let _ = t => t,
	  _t;
	var _getDelimiter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDelimiter");
	var _getVideoCallItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getVideoCallItem");
	var _getAudioCallItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getAudioCallItem");
	var _getPersonalPhoneItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPersonalPhoneItem");
	var _getWorkPhoneItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getWorkPhoneItem");
	var _getInnerPhoneItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getInnerPhoneItem");
	var _getZoomItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getZoomItem");
	var _getUserPhoneHtml = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getUserPhoneHtml");
	var _isCallAvailable = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isCallAvailable");
	var _getUser = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getUser");
	var _isUser = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isUser");
	var _requestCreateZoomConference = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("requestCreateZoomConference");
	class CallMenu extends im_v2_lib_menu.BaseMenu {
	  constructor() {
	    super();
	    Object.defineProperty(this, _requestCreateZoomConference, {
	      value: _requestCreateZoomConference2
	    });
	    Object.defineProperty(this, _isUser, {
	      value: _isUser2
	    });
	    Object.defineProperty(this, _getUser, {
	      value: _getUser2
	    });
	    Object.defineProperty(this, _isCallAvailable, {
	      value: _isCallAvailable2
	    });
	    Object.defineProperty(this, _getUserPhoneHtml, {
	      value: _getUserPhoneHtml2
	    });
	    Object.defineProperty(this, _getZoomItem, {
	      value: _getZoomItem2
	    });
	    Object.defineProperty(this, _getInnerPhoneItem, {
	      value: _getInnerPhoneItem2
	    });
	    Object.defineProperty(this, _getWorkPhoneItem, {
	      value: _getWorkPhoneItem2
	    });
	    Object.defineProperty(this, _getPersonalPhoneItem, {
	      value: _getPersonalPhoneItem2
	    });
	    Object.defineProperty(this, _getAudioCallItem, {
	      value: _getAudioCallItem2
	    });
	    Object.defineProperty(this, _getVideoCallItem, {
	      value: _getVideoCallItem2
	    });
	    Object.defineProperty(this, _getDelimiter, {
	      value: _getDelimiter2
	    });
	    this.id = 'bx-im-chat-header-call-menu';
	  }
	  getMenuOptions() {
	    return {
	      ...super.getMenuOptions(),
	      className: this.getMenuClassName(),
	      angle: true,
	      offsetLeft: 4,
	      offsetTop: 5
	    };
	  }
	  getMenuClassName() {
	    return 'bx-im-messenger__scope bx-im-chat-header-call-button__scope';
	  }
	  getMenuItems() {
	    return [babelHelpers.classPrivateFieldLooseBase(this, _getVideoCallItem)[_getVideoCallItem](), babelHelpers.classPrivateFieldLooseBase(this, _getAudioCallItem)[_getAudioCallItem](), babelHelpers.classPrivateFieldLooseBase(this, _getZoomItem)[_getZoomItem](), babelHelpers.classPrivateFieldLooseBase(this, _getDelimiter)[_getDelimiter](), babelHelpers.classPrivateFieldLooseBase(this, _getPersonalPhoneItem)[_getPersonalPhoneItem](), babelHelpers.classPrivateFieldLooseBase(this, _getWorkPhoneItem)[_getWorkPhoneItem](), babelHelpers.classPrivateFieldLooseBase(this, _getInnerPhoneItem)[_getInnerPhoneItem]()];
	  }
	}
	function _getDelimiter2() {
	  return {
	    delimiter: true
	  };
	}
	function _getVideoCallItem2() {
	  const isAvailable = babelHelpers.classPrivateFieldLooseBase(this, _isCallAvailable)[_isCallAvailable](this.context.dialogId);
	  return {
	    text: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_VIDEOCALL'),
	    onclick: () => {
	      if (!isAvailable) {
	        return;
	      }
	      CallTypes.video.start(this.context.dialogId);
	      this.emit(CallMenu.events.onMenuItemClick, CallTypes.video);
	      this.menuInstance.close();
	    },
	    disabled: !isAvailable
	  };
	}
	function _getAudioCallItem2() {
	  const isAvailable = babelHelpers.classPrivateFieldLooseBase(this, _isCallAvailable)[_isCallAvailable](this.context.dialogId);
	  return {
	    text: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_CALL_MENU_AUDIO'),
	    onclick: () => {
	      if (!isAvailable) {
	        return;
	      }
	      CallTypes.audio.start(this.context.dialogId);
	      this.emit(CallMenu.events.onMenuItemClick, CallTypes.audio);
	      this.menuInstance.close();
	    },
	    disabled: !isAvailable
	  };
	}
	function _getPersonalPhoneItem2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _isUser)[_isUser]()) {
	    return null;
	  }
	  const {
	    phones
	  } = babelHelpers.classPrivateFieldLooseBase(this, _getUser)[_getUser]();
	  if (!phones.personalMobile) {
	    return null;
	  }
	  const title = main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_CALL_MENU_PERSONAL_PHONE');
	  return {
	    className: 'menu-popup-no-icon bx-im-chat-header-call-button-menu__item',
	    html: babelHelpers.classPrivateFieldLooseBase(this, _getUserPhoneHtml)[_getUserPhoneHtml](title, phones.personalMobile),
	    onclick: () => {
	      im_public.Messenger.startPhoneCall(phones.personalMobile);
	      this.menuInstance.close();
	    }
	  };
	}
	function _getWorkPhoneItem2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _isUser)[_isUser]()) {
	    return null;
	  }
	  const {
	    phones
	  } = babelHelpers.classPrivateFieldLooseBase(this, _getUser)[_getUser]();
	  if (!phones.workPhone) {
	    return null;
	  }
	  const title = main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_CALL_MENU_WORK_PHONE');
	  return {
	    className: 'menu-popup-no-icon bx-im-chat-header-call-button-menu__item',
	    html: babelHelpers.classPrivateFieldLooseBase(this, _getUserPhoneHtml)[_getUserPhoneHtml](title, phones.workPhone),
	    onclick: () => {
	      im_public.Messenger.startPhoneCall(phones.workPhone);
	      this.menuInstance.close();
	    }
	  };
	}
	function _getInnerPhoneItem2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _isUser)[_isUser]()) {
	    return null;
	  }
	  const {
	    phones
	  } = babelHelpers.classPrivateFieldLooseBase(this, _getUser)[_getUser]();
	  if (!phones.innerPhone) {
	    return null;
	  }
	  const title = main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_CALL_MENU_INNER_PHONE_MSGVER_1');
	  return {
	    className: 'menu-popup-no-icon bx-im-chat-header-call-button-menu__item',
	    html: babelHelpers.classPrivateFieldLooseBase(this, _getUserPhoneHtml)[_getUserPhoneHtml](title, phones.innerPhone),
	    onclick: () => {
	      im_public.Messenger.startPhoneCall(phones.innerPhone);
	      this.menuInstance.close();
	    }
	  };
	}
	function _getZoomItem2() {
	  const settings = main_core.Extension.getSettings('im.v2.component.content.chat');
	  const isActive = settings.get('isZoomActive', false);
	  if (!isActive) {
	    return null;
	  }
	  const classNames = ['bx-im-chat-header-call-button-menu__zoom', 'menu-popup-no-icon'];
	  const isFeatureAvailable = settings.get('isZoomFeatureAvailable', false);
	  if (!isFeatureAvailable) {
	    classNames.push('--disabled');
	  }
	  return {
	    className: classNames.join(' '),
	    text: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_CALL_MENU_ZOOM'),
	    onclick: () => {
	      if (!isFeatureAvailable) {
	        BX.UI.InfoHelper.show('limit_video_conference_zoom');
	        return;
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _requestCreateZoomConference)[_requestCreateZoomConference](this.context.dialogId);
	      this.menuInstance.close();
	    }
	  };
	}
	function _getUserPhoneHtml2(title, phoneNumber) {
	  return main_core.Tag.render(_t || (_t = _`
			<span class="bx-im-chat-header-call-button-menu__phone_container">
				<span class="bx-im-chat-header-call-button-menu__phone_title">${0}</span>
				<span class="bx-im-chat-header-call-button-menu__phone_number">${0}</span>
			</span>
		`), title, phoneNumber);
	}
	function _isCallAvailable2(dialogId) {
	  if (im_v2_application_core.Core.getStore().getters['recent/calls/hasActiveCall'](dialogId) && im_v2_lib_call.CallManager.getInstance().getCurrentCallDialogId() === dialogId) {
	    return true;
	  }
	  if (im_v2_application_core.Core.getStore().getters['recent/calls/hasActiveCall']()) {
	    return false;
	  }
	  const chatCanBeCalled = im_v2_lib_call.CallManager.getInstance().chatCanBeCalled(dialogId);
	  const chatIsAllowedToCall = im_v2_lib_permission.PermissionManager.getInstance().canPerformAction(im_v2_const.ChatActionType.call, dialogId);
	  return chatCanBeCalled && chatIsAllowedToCall;
	}
	function _getUser2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _isUser)[_isUser]()) {
	    return null;
	  }
	  return im_v2_application_core.Core.getStore().getters['users/get'](this.context.dialogId);
	}
	function _isUser2() {
	  return this.context.type === im_v2_const.ChatType.user;
	}
	function _requestCreateZoomConference2(dialogId) {
	  im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2CallZoomCreate, {
	    data: {
	      dialogId
	    }
	  }).catch(errors => {
	    let errorText = main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_CALL_MENU_ZOOM_CREATE_ERROR');
	    const notConnected = errors.some(error => error.code === 'ZOOM_CONNECTED_ERROR');
	    if (notConnected) {
	      const userProfileUri = `/company/personal/user/${im_v2_application_core.Core.getUserId()}/social_services/`;
	      errorText = main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_CALL_MENU_ZOOM_CONNECT_ERROR').replace('#HREF_START#', `<a href=${userProfileUri}>`).replace('#HREF_END#', '</>');
	    }
	    BX.UI.Notification.Center.notify({
	      content: errorText
	    });
	  });
	}
	CallMenu.events = {
	  onMenuItemClick: 'onMenuItemClick'
	};

	// @vue/component
	const CallButton = {
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  emits: [],
	  data() {
	    return {
	      lastCallType: ''
	    };
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    isActive() {
	      if (this.$store.getters['recent/calls/hasActiveCall'](this.dialogId) && im_v2_lib_call.CallManager.getInstance().getCurrentCallDialogId() === this.dialogId) {
	        return true;
	      }
	      if (this.$store.getters['recent/calls/hasActiveCall']()) {
	        return false;
	      }
	      const chatCanBeCalled = im_v2_lib_call.CallManager.getInstance().chatCanBeCalled(this.dialogId);
	      const chatIsAllowedToCall = im_v2_lib_permission.PermissionManager.getInstance().canPerformAction(im_v2_const.ChatActionType.call, this.dialogId);
	      return chatCanBeCalled && chatIsAllowedToCall;
	    },
	    isConference() {
	      return this.dialog.type === im_v2_const.ChatType.videoconf;
	    },
	    callButtonText() {
	      const locCode = CallTypes[this.lastCallType].locCode;
	      return this.loc(locCode);
	    }
	  },
	  created() {
	    this.lastCallType = this.getLastCallChoice();
	    this.subscribeToMenuItemClick();
	  },
	  methods: {
	    startVideoCall() {
	      if (!this.isActive) {
	        return;
	      }
	      im_public.Messenger.startVideoCall(this.dialogId);
	    },
	    subscribeToMenuItemClick() {
	      this.getCallMenu().subscribe(CallMenu.events.onMenuItemClick, event => {
	        const {
	          id: callTypeId
	        } = event.getData();
	        this.saveLastCallChoice(callTypeId);
	      });
	    },
	    getCallMenu() {
	      if (!this.callMenu) {
	        this.callMenu = new CallMenu();
	      }
	      return this.callMenu;
	    },
	    onButtonClick() {
	      if (!this.isActive) {
	        return;
	      }
	      CallTypes[this.lastCallType].start(this.dialogId);
	    },
	    onMenuClick() {
	      if (!this.shouldShowMenu()) {
	        return;
	      }
	      this.getCallMenu().openMenu(this.dialog, this.$refs.menu);
	    },
	    onStartConferenceClick() {
	      if (!this.isActive) {
	        return;
	      }
	      im_public.Messenger.openConference({
	        code: this.dialog.public.code
	      });
	    },
	    getLastCallChoice() {
	      const result = im_v2_lib_localStorage.LocalStorageManager.getInstance().get(im_v2_const.LocalStorageKey.lastCallType, CallTypes.video.id);
	      if (result === CallTypes.beta.id && !this.isBitrixCallEnabled()) {
	        return CallTypes.video.id;
	      }
	      return result;
	    },
	    saveLastCallChoice(callTypeId) {
	      this.lastCallType = callTypeId;
	      im_v2_lib_localStorage.LocalStorageManager.getInstance().set(im_v2_const.LocalStorageKey.lastCallType, callTypeId);
	    },
	    shouldShowMenu() {
	      return this.isActive || this.isBitrixCallEnabled();
	    },
	    isBitrixCallEnabled() {
	      // TODO remove this after release call beta
	      // const settings = Extension.getSettings('im.v2.component.content.chat');
	      // return settings.get('isBitrixCallEnabled');

	      return false;
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div
			v-if="isConference"
			class="bx-im-chat-header-call-button__scope bx-im-chat-header-call-button__container --conference"
			:class="{'--disabled': !isActive}"
			@click="onStartConferenceClick"
		>
			<div class="bx-im-chat-header-call-button__text">
				{{ loc('IM_CONTENT_CHAT_HEADER_START_CONFERENCE') }}
			</div>
		</div>
		<div
			v-else
			class="bx-im-chat-header-call-button__scope bx-im-chat-header-call-button__container"
			:class="{'--disabled': !isActive}"
			@click="onButtonClick"
		>
			<div class="bx-im-chat-header-call-button__text">
				{{ callButtonText }}
			</div>
			<div class="bx-im-chat-header-call-button__separator"></div>
			<div class="bx-im-chat-header-call-button__chevron_container" @click.stop="onMenuClick">
				<div class="bx-im-chat-header-call-button__chevron" ref="menu"></div>
			</div>
		</div>
	`
	};

	const ParamsByLinkType = {
	  [im_v2_const.ChatEntityLinkType.tasks]: {
	    className: '--task',
	    loc: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_TASK')
	  },
	  [im_v2_const.ChatEntityLinkType.calendar]: {
	    className: '--calendar',
	    loc: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_MEETING_MSGVER_1')
	  },
	  [im_v2_const.ChatEntityLinkType.sonetGroup]: {
	    className: '--group',
	    loc: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_GROUP_MSGVER_1')
	  },
	  [im_v2_const.ChatEntityLinkType.mail]: {
	    className: '--mail',
	    loc: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_MAIL_MSGVER_1')
	  },
	  [im_v2_const.ChatEntityLinkType.contact]: {
	    className: '--crm',
	    loc: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_CONTACT')
	  },
	  [im_v2_const.ChatEntityLinkType.deal]: {
	    className: '--crm',
	    loc: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_DEAL')
	  },
	  [im_v2_const.ChatEntityLinkType.lead]: {
	    className: '--crm',
	    loc: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_LEAD')
	  },
	  [im_v2_const.ChatEntityLinkType.dynamic]: {
	    className: '--crm',
	    loc: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_DYNAMIC_ELEMENT')
	  }
	};

	// @vue/component
	const EntityLink = {
	  name: 'EntityLink',
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  data() {
	    return {};
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    entityType() {
	      return this.dialog.entityLink.type;
	    },
	    entityUrl() {
	      return this.dialog.entityLink.url;
	    },
	    containerClassName() {
	      var _ParamsByLinkType$thi, _ParamsByLinkType$thi2;
	      return (_ParamsByLinkType$thi = (_ParamsByLinkType$thi2 = ParamsByLinkType[this.entityType]) == null ? void 0 : _ParamsByLinkType$thi2.className) != null ? _ParamsByLinkType$thi : '';
	    },
	    linkText() {
	      var _ParamsByLinkType$thi3, _ParamsByLinkType$thi4;
	      return (_ParamsByLinkType$thi3 = (_ParamsByLinkType$thi4 = ParamsByLinkType[this.entityType]) == null ? void 0 : _ParamsByLinkType$thi4.loc) != null ? _ParamsByLinkType$thi3 : 'Open entity';
	    }
	  },
	  template: `
		<a :href="entityUrl" class="bx-im-chat-header-entity-link__container" :class="containerClassName" target="_blank">
			<div class="bx-im-chat-header-entity-link__icon"></div>
			<div class="bx-im-chat-header-entity-link__text">{{ linkText }}</div>
			<div class="bx-im-chat-header-entity-link__arrow"></div>
		</a>
	`
	};

	const UserCounterPhraseCodeByChatType = {
	  [im_v2_const.ChatType.openChannel]: 'IM_CONTENT_CHAT_HEADER_CHANNEL_USER_COUNT',
	  [im_v2_const.ChatType.channel]: 'IM_CONTENT_CHAT_HEADER_CHANNEL_USER_COUNT',
	  default: 'IM_CONTENT_CHAT_HEADER_USER_COUNT'
	};

	// @vue/component
	const GroupChatTitle = {
	  name: 'GroupChatTitle',
	  components: {
	    EditableChatTitle: im_v2_component_elements.EditableChatTitle,
	    EntityLink,
	    LineLoader: im_v2_component_elements.LineLoader,
	    FadeAnimation: im_v2_component_animation.FadeAnimation
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['membersClick', 'newTitle'],
	  data() {
	    return {};
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    hasEntityLink() {
	      var _this$dialog$entityLi;
	      return Boolean((_this$dialog$entityLi = this.dialog.entityLink) == null ? void 0 : _this$dialog$entityLi.url);
	    },
	    userCounterPhraseCode() {
	      var _UserCounterPhraseCod;
	      return (_UserCounterPhraseCod = UserCounterPhraseCodeByChatType[this.dialog.type]) != null ? _UserCounterPhraseCod : UserCounterPhraseCodeByChatType.default;
	    },
	    userCounterText() {
	      return main_core.Loc.getMessagePlural(this.userCounterPhraseCode, this.dialog.userCounter, {
	        '#COUNT#': this.dialog.userCounter
	      });
	    }
	  },
	  methods: {
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-chat-header__info">
			<EditableChatTitle :dialogId="dialogId" @newTitleSubmit="$emit('newTitle', $event)" />
			<LineLoader v-if="!dialog.inited" :width="50" :height="16" />
			<FadeAnimation :duration="100">
				<div v-if="dialog.inited" class="bx-im-chat-header__subtitle_container">
					<div
						:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_MEMBERS')"
						@click="$emit('membersClick')"
						class="bx-im-chat-header__subtitle_content --click"
					>
						{{ userCounterText }}
					</div>
					<EntityLink v-if="hasEntityLink" :dialogId="dialogId" />
				</div>
			</FadeAnimation>
		</div>
	`
	};

	const ONE_MINUTE = 60 * 1000;

	// @vue/component
	const UserTitle = {
	  name: 'UserTitle',
	  components: {
	    ChatTitle: im_v2_component_elements.ChatTitle
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  data() {
	    return {
	      userLastOnlineText: ''
	    };
	  },
	  computed: {
	    userPosition() {
	      return this.$store.getters['users/getPosition'](this.dialogId);
	    },
	    userLastOnline() {
	      return this.$store.getters['users/getLastOnline'](this.dialogId);
	    },
	    userLink() {
	      return im_v2_lib_utils.Utils.user.getProfileLink(this.dialogId);
	    }
	  },
	  watch: {
	    userLastOnline(value) {
	      this.userLastOnlineText = value;
	    }
	  },
	  created() {
	    this.updateUserOnline();
	    this.userLastOnlineInterval = setInterval(this.updateUserOnline, ONE_MINUTE);
	  },
	  beforeUnmount() {
	    clearInterval(this.userLastOnlineInterval);
	  },
	  methods: {
	    updateUserOnline() {
	      this.userLastOnlineText = this.$store.getters['users/getLastOnline'](this.dialogId);
	    }
	  },
	  template: `
		<div class="bx-im-chat-header__info">
			<div class="bx-im-chat-header__title --user">
				<a :href="userLink" target="_blank" class="bx-im-chat-header__title_container">
					<ChatTitle :dialogId="dialogId" />
				</a>
				<span class="bx-im-chat-header__user-status">{{ userLastOnlineText }}</span>
			</div>
			<div class="bx-im-chat-header__subtitle_container">
				<div class="bx-im-chat-header__subtitle_content">{{ userPosition }}</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const MultidialogChatTitle = {
	  name: 'MultidialogChatTitle',
	  components: {
	    EditableChatTitle: im_v2_component_elements.EditableChatTitle,
	    ChatTitle: im_v2_component_elements.ChatTitle
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['newTitle'],
	  computed: {
	    isSupportBot() {
	      return this.$store.getters['users/bots/isSupport'](this.dialogId);
	    },
	    subtitle() {
	      return this.$Bitrix.Loc.getMessage('IM_CONTENT_CHAT_HEADER_SUPPORT_SUBTITLE');
	    }
	  },
	  template: `
		<div class="bx-im-chat-header__info">
			<ChatTitle v-if="isSupportBot" :dialogId="dialogId" />
			<EditableChatTitle v-else :dialogId="dialogId" @newTitleSubmit="$emit('newTitle', $event)" />
			<div class="bx-im-chat-header__subtitle_container">
				<div class="bx-im-chat-header__subtitle_content">{{ subtitle }}</div>
			</div>
		</div>
	`
	};

	const ChatTitle = Object.freeze({
	  group: 'group',
	  user: 'user',
	  multidialog: 'multidialog'
	});

	// @vue/component
	const ChatHeader = {
	  name: 'ChatHeader',
	  components: {
	    ChatAvatar: im_v2_component_elements.ChatAvatar,
	    AddToChat: im_v2_component_entitySelector.AddToChat,
	    CallButton,
	    GroupChatTitle,
	    UserChatTitle: UserTitle,
	    MultidialogChatTitle,
	    LineLoader: im_v2_component_elements.LineLoader,
	    FadeAnimation: im_v2_component_animation.FadeAnimation
	  },
	  props: {
	    dialogId: {
	      type: String,
	      default: ''
	    },
	    currentSidebarPanel: {
	      type: String,
	      default: ''
	    }
	  },
	  emits: ['toggleRightPanel', 'toggleSearchPanel', 'toggleMembersPanel'],
	  data() {
	    return {
	      showAddToChatPopup: false
	    };
	  },
	  computed: {
	    AvatarSize: () => im_v2_component_elements.AvatarSize,
	    user() {
	      return this.$store.getters['users/get'](this.dialogId, true);
	    },
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    isInited() {
	      return this.dialog.inited;
	    },
	    isUser() {
	      return this.dialog.type === im_v2_const.ChatType.user;
	    },
	    isBot() {
	      if (!this.isUser) {
	        return false;
	      }
	      return this.user.bot === true;
	    },
	    isChat() {
	      return !this.isUser;
	    },
	    chatId() {
	      return this.dialog.chatId;
	    },
	    userLink() {
	      return im_v2_lib_utils.Utils.user.getProfileLink(this.dialogId);
	    },
	    showCallButton() {
	      if (this.isBot || this.isSupport) {
	        return false;
	      }
	      return im_v2_lib_permission.PermissionManager.getInstance().canPerformAction(im_v2_const.ChatActionType.call, this.dialogId);
	    },
	    showInviteButton() {
	      if (this.isBot) {
	        return false;
	      }
	      return im_v2_lib_permission.PermissionManager.getInstance().canPerformAction(im_v2_const.ChatActionType.extend, this.dialogId);
	    },
	    showSidebarButton() {
	      return im_v2_lib_permission.PermissionManager.getInstance().canPerformAction(im_v2_const.ChatActionType.openSidebar, this.dialogId);
	    },
	    canChangeAvatar() {
	      return im_v2_lib_permission.PermissionManager.getInstance().canPerformAction(im_v2_const.ChatActionType.avatar, this.dialogId);
	    },
	    isSidebarOpened() {
	      return this.currentSidebarPanel.length > 0;
	    },
	    isMessageSearchActive() {
	      return this.currentSidebarPanel === im_v2_const.SidebarDetailBlock.messageSearch;
	    },
	    headerTitleComponentName() {
	      return `${this.chatTitle}ChatTitle`;
	    },
	    isSupport() {
	      return this.$store.getters['sidebar/multidialog/isSupport'](this.dialogId);
	    },
	    chatTitle() {
	      if (this.isSupport) {
	        return ChatTitle.multidialog;
	      }
	      if (this.isUser) {
	        return ChatTitle.user;
	      }
	      return ChatTitle.group;
	    },
	    hasUserLink() {
	      return this.isUser && !this.isSupport;
	    }
	  },
	  methods: {
	    toggleRightPanel() {
	      if (this.currentSidebarPanel) {
	        main_core_events.EventEmitter.emit(im_v2_const.EventType.sidebar.close, {
	          panel: ''
	        });
	        return;
	      }
	      main_core_events.EventEmitter.emit(im_v2_const.EventType.sidebar.open, {
	        panel: im_v2_const.SidebarDetailBlock.main,
	        dialogId: this.dialogId
	      });
	    },
	    toggleSearchPanel() {
	      if (this.isMessageSearchActive) {
	        main_core_events.EventEmitter.emit(im_v2_const.EventType.sidebar.close, {
	          panel: im_v2_const.SidebarDetailBlock.messageSearch
	        });
	        return;
	      }
	      main_core_events.EventEmitter.emit(im_v2_const.EventType.sidebar.open, {
	        panel: im_v2_const.SidebarDetailBlock.messageSearch,
	        dialogId: this.dialogId
	      });
	    },
	    onMembersClick() {
	      if (!this.isInited) {
	        return;
	      }
	      if (this.currentSidebarPanel === im_v2_const.SidebarDetailBlock.members) {
	        main_core_events.EventEmitter.emit(im_v2_const.EventType.sidebar.close, {
	          panel: im_v2_const.SidebarDetailBlock.members
	        });
	        return;
	      }
	      main_core_events.EventEmitter.emit(im_v2_const.EventType.sidebar.open, {
	        panel: im_v2_const.SidebarDetailBlock.members,
	        dialogId: this.dialogId
	      });
	    },
	    onNewTitleSubmit(newTitle) {
	      this.getChatService().renameChat(this.dialogId, newTitle).catch(() => {
	        BX.UI.Notification.Center.notify({
	          content: this.loc('IM_CONTENT_CHAT_HEADER_RENAME_ERROR')
	        });
	      });
	    },
	    getChatService() {
	      if (!this.chatService) {
	        this.chatService = new im_v2_provider_service.ChatService();
	      }
	      return this.chatService;
	    },
	    openInvitePopup() {
	      this.showAddToChatPopup = true;
	    },
	    onAvatarClick() {
	      if (!this.isChat || !this.canChangeAvatar) {
	        return;
	      }
	      this.$refs.avatarInput.click();
	    },
	    async onAvatarSelect(event) {
	      const input = event.target;
	      const file = input.files[0];
	      if (!file) {
	        return;
	      }
	      const preparedAvatar = await this.getChatService().prepareAvatar(file);
	      if (!preparedAvatar) {
	        return;
	      }
	      void this.getChatService().changeAvatar(this.dialog.chatId, preparedAvatar);
	    },
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    }
	  },
	  template: `
		<div class="bx-im-chat-header__scope bx-im-chat-header__container">
			<div class="bx-im-chat-header__left">
				<slot name="left">
					<div class="bx-im-chat-header__avatar" :class="{'--can-change': canChangeAvatar}" @click="onAvatarClick">
						<a v-if="hasUserLink" :href="userLink" target="_blank">
							<ChatAvatar :avatarDialogId="dialogId" :contextDialogId="dialogId" :size="AvatarSize.L" />
						</a>
						<ChatAvatar v-else :avatarDialogId="dialogId" :contextDialogId="dialogId" :size="AvatarSize.L" />
					</div>
					<input 
						type="file" 
						@change="onAvatarSelect" 
						accept="image/*" 
						class="bx-im-chat-header__avatar_input" 
						ref="avatarInput"
					>
					<component
						:is="headerTitleComponentName"
						:dialogId="dialogId"
						@membersClick="onMembersClick"
						@newTitle="onNewTitleSubmit"
					/>
				</slot>
			</div>
			<LineLoader v-if="!isInited" :width="45" :height="22" />
			<FadeAnimation :duration="100">
				<div v-if="isInited" class="bx-im-chat-header__right">
					<slot name="before-actions"></slot>
					<CallButton v-if="showCallButton" :dialogId="dialogId" />
					<div
						v-if="showInviteButton"
						:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_INVITE_POPUP_TITLE')"
						:class="{'--active': showAddToChatPopup}"
						class="bx-im-chat-header__icon --add-people"
						@click="openInvitePopup" 
						ref="add-members"
					></div>
					<div 
						:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_SEARCH')"
						:class="{'--active': isMessageSearchActive}"
						class="bx-im-chat-header__icon --search" 
						@click="toggleSearchPanel"
					></div>
					<div
						v-if="showSidebarButton"
						class="bx-im-chat-header__icon --panel"
						:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_SIDEBAR')"
						:class="{'--active': isSidebarOpened}"
						@click="toggleRightPanel" 
					></div>
				</div>
			</FadeAnimation>
			<AddToChat
				:bindElement="$refs['add-members'] || {}"
				:dialogId="dialogId"
				:showPopup="showAddToChatPopup"
				:popupConfig="{offsetTop: 15, offsetLeft: -300}"
				@close="showAddToChatPopup = false"
			/>
		</div>
	`
	};

	// @vue/component
	const DropArea = {
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    },
	    container: {
	      type: Object,
	      required: true
	    }
	  },
	  data() {
	    return {
	      showDropArea: false,
	      lastDropAreaEnterTarget: null
	    };
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    hasPinnedMessages() {
	      return this.$store.getters['messages/pin/getPinned'](this.dialog.chatId).length > 0;
	    },
	    dropAreaStyles() {
	      let offset = Height.dropAreaOffset + Height.chatHeader;
	      if (this.hasPinnedMessages) {
	        offset += Height.pinnedMessages;
	      }
	      return {
	        top: `${offset}px`
	      };
	    }
	  },
	  watch: {
	    container: {
	      immediate: true,
	      handler(newValue) {
	        if (!main_core.Type.isElementNode(newValue)) {
	          return;
	        }
	        this.bindEvents();
	      }
	    }
	  },
	  beforeUnmount() {
	    this.unbindEvents();
	  },
	  methods: {
	    bindEvents() {
	      main_core.Event.bind(this.container, 'dragenter', this.onDragEnter);
	      main_core.Event.bind(this.container, 'dragleave', this.onDragLeave);
	      main_core.Event.bind(this.container, 'dragover', this.onDragOver);
	      main_core.Event.bind(this.container, 'drop', this.onDrop);
	    },
	    unbindEvents() {
	      main_core.Event.unbind(this.container, 'dragenter', this.onDragEnter);
	      main_core.Event.unbind(this.container, 'dragleave', this.onDragLeave);
	      main_core.Event.unbind(this.container, 'dragover', this.onDragOver);
	      main_core.Event.unbind(this.container, 'drop', this.onDrop);
	    },
	    async onDragEnter(event) {
	      event.stopPropagation();
	      event.preventDefault();
	      const success = await ui_uploader_core.hasDataTransferOnlyFiles(event.dataTransfer, false);
	      if (!success) {
	        return;
	      }
	      this.lastDropAreaEnterTarget = event.target;
	      this.showDropArea = true;
	    },
	    onDragLeave(event) {
	      event.stopPropagation();
	      event.preventDefault();
	      if (this.lastDropAreaEnterTarget !== event.target) {
	        return;
	      }
	      this.showDropArea = false;
	    },
	    onDragOver(event) {
	      event.preventDefault();
	    },
	    async onDrop(event) {
	      event.preventDefault();
	      const isChannelType = [im_v2_const.ChatType.channel, im_v2_const.ChatType.openChannel].includes(this.dialog.type);
	      const uploaderId = await this.getUploadingService().uploadFromDragAndDrop({
	        event,
	        dialogId: this.dialogId,
	        sendAsFile: false,
	        autoUpload: !isChannelType
	      });
	      if (isChannelType) {
	        main_core_events.EventEmitter.emit(im_v2_const.EventType.textarea.openUploadPreview, {
	          uploaderId
	        });
	      }
	      this.showDropArea = false;
	    },
	    getUploadingService() {
	      if (!this.uploadingService) {
	        this.uploadingService = im_v2_provider_service.UploadingService.getInstance();
	      }
	      return this.uploadingService;
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<Transition name="drop-area-fade">
			<div v-if="showDropArea" :style="dropAreaStyles" class="bx-im-content-chat-drop-area__container bx-im-content-chat-drop-area__scope">
				<div class="bx-im-content-chat-drop-area__box">
					<span class="bx-im-content-chat-drop-area__icon"></span>
					<label class="bx-im-content-chat-drop-area__label-text">
						{{ loc('IM_CONTENT_DROP_AREA') }}
					</label>
				</div>
			</div>
		</Transition>
	`
	};

	const BUTTON_BACKGROUND_COLOR = 'rgba(0, 0, 0, 0.1)';
	const BUTTON_HOVER_COLOR = 'rgba(0, 0, 0, 0.2)';
	const BUTTON_TEXT_COLOR = '#fff';

	// @vue/component
	const MutePanel = {
	  components: {
	    ChatButton: im_v2_component_elements.Button
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  data() {
	    return {};
	  },
	  computed: {
	    ButtonSize: () => im_v2_component_elements.ButtonSize,
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    isMuted() {
	      return this.dialog.muteList.includes(im_v2_application_core.Core.getUserId());
	    },
	    buttonText() {
	      const mutedCode = this.loc('IM_CONTENT_BLOCKED_TEXTAREA_ENABLE_NOTIFICATIONS');
	      const unmutedCode = this.loc('IM_CONTENT_BLOCKED_TEXTAREA_DISABLE_NOTIFICATIONS');
	      return this.isMuted ? mutedCode : unmutedCode;
	    },
	    buttonColorScheme() {
	      return {
	        borderColor: im_v2_const.Color.transparent,
	        backgroundColor: BUTTON_BACKGROUND_COLOR,
	        iconColor: BUTTON_TEXT_COLOR,
	        textColor: BUTTON_TEXT_COLOR,
	        hoverColor: BUTTON_HOVER_COLOR
	      };
	    }
	  },
	  methods: {
	    onButtonClick() {
	      if (this.isMuted) {
	        this.getChatService().unmuteChat(this.dialogId);
	        return;
	      }
	      this.getChatService().muteChat(this.dialogId);
	    },
	    getChatService() {
	      if (!this.chatService) {
	        this.chatService = new im_v2_provider_service.ChatService();
	      }
	      return this.chatService;
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-content-chat__textarea_placeholder">
			<ChatButton
				:size="ButtonSize.XL"
				:customColorScheme="buttonColorScheme"
				:text="buttonText"
				:isRounded="true"
				@click="onButtonClick"
			/>
		</div>
	`
	};

	// @vue/component
	const JoinPanel = {
	  components: {
	    ChatButton: im_v2_component_elements.Button
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  data() {
	    return {};
	  },
	  computed: {
	    ButtonSize: () => im_v2_component_elements.ButtonSize,
	    ButtonColor: () => im_v2_component_elements.ButtonColor
	  },
	  methods: {
	    onButtonClick() {
	      this.getChatService().joinChat(this.dialogId);
	    },
	    getChatService() {
	      if (!this.chatService) {
	        this.chatService = new im_v2_provider_service.ChatService();
	      }
	      return this.chatService;
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-content-chat__textarea_placeholder">
			<ChatButton
				:size="ButtonSize.XL"
				:color="ButtonColor.Primary"
				:text="loc('IM_CONTENT_BLOCKED_TEXTAREA_JOIN_CHAT')"
				:isRounded="true"
				@click="onButtonClick"
			/>
		</div>
	`
	};

	// @vue/component
	const LoadingBar = {
	  name: 'LoadingBar',
	  data() {
	    return {};
	  },
	  template: `
		<div class="bx-im-content-chat__loading-bar"></div>
	`
	};

	const TextareaObserverDirective = {
	  mounted(element, binding) {
	    binding.instance.textareaResizeManager.observeTextarea(element);
	  },
	  beforeUnmount(element, binding) {
	    binding.instance.textareaResizeManager.unobserveTextarea(element);
	  }
	};

	// @vue/component
	const BaseChatContent = {
	  name: 'BaseChatContent',
	  components: {
	    ChatHeader,
	    ChatDialog: im_v2_component_dialog_chat.ChatDialog,
	    ChatTextarea: im_v2_component_textarea.ChatTextarea,
	    ChatSidebar: im_v2_component_sidebar.ChatSidebar,
	    DropArea,
	    MutePanel,
	    JoinPanel,
	    LoadingBar
	  },
	  directives: {
	    'textarea-observer': TextareaObserverDirective
	  },
	  props: {
	    dialogId: {
	      type: String,
	      default: ''
	    },
	    commentsOpened: {
	      type: Boolean,
	      default: false
	    }
	  },
	  data() {
	    return {
	      currentSidebarPanel: '',
	      textareaHeight: 0,
	      showLoadingBar: false
	    };
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    canSend() {
	      return im_v2_lib_permission.PermissionManager.getInstance().canPerformAction(im_v2_const.ChatActionType.send, this.dialog.dialogId);
	    },
	    isGuest() {
	      return this.dialog.role === im_v2_const.UserRole.guest;
	    },
	    containerClasses() {
	      const alignment = this.$store.getters['application/settings/get'](im_v2_const.Settings.appearance.alignment);
	      return [`--${alignment}-align`];
	    },
	    backgroundStyle() {
	      return im_v2_lib_theme.ThemeManager.getCurrentBackgroundStyle();
	    },
	    dialogContainerStyle() {
	      let textareaHeight = this.textareaHeight;
	      if (!this.canSend) {
	        textareaHeight = Height.blockedTextarea;
	      }
	      return {
	        height: `calc(100% - ${Height.chatHeader}px - ${textareaHeight}px)`
	      };
	    }
	  },
	  watch: {
	    textareaHeight(newValue, oldValue) {
	      if (!this.dialog.inited || oldValue === 0) {
	        return;
	      }
	      main_core_events.EventEmitter.emit(im_v2_const.EventType.dialog.scrollToBottom, {
	        chatId: this.dialog.chatId,
	        animation: false
	      });
	    }
	  },
	  created() {
	    this.initTextareaResizeManager();
	    this.bindEvents();
	  },
	  beforeUnmount() {
	    this.unbindEvents();
	  },
	  methods: {
	    initTextareaResizeManager() {
	      this.textareaResizeManager = new im_v2_lib_textarea.ResizeManager();
	      this.textareaResizeManager.subscribe(im_v2_lib_textarea.ResizeManager.events.onHeightChange, this.onTextareaHeightChange);
	    },
	    onTextareaMount() {
	      const textareaContainer = this.$refs['textarea-container'];
	      this.textareaHeight = textareaContainer.clientHeight;
	    },
	    onTextareaHeightChange(event) {
	      const {
	        newHeight
	      } = event.getData();
	      this.textareaHeight = newHeight;
	    },
	    onChangeSidebarPanel({
	      panel
	    }) {
	      this.currentSidebarPanel = panel;
	    },
	    onShowLoadingBar(event) {
	      const {
	        dialogId
	      } = event.getData();
	      if (dialogId !== this.dialogId) {
	        return;
	      }
	      this.showLoadingBar = true;
	    },
	    onHideLoadingBar(event) {
	      const {
	        dialogId
	      } = event.getData();
	      if (dialogId !== this.dialogId) {
	        return;
	      }
	      this.showLoadingBar = false;
	    },
	    bindEvents() {
	      main_core_events.EventEmitter.subscribe(im_v2_const.EventType.dialog.showLoadingBar, this.onShowLoadingBar);
	      main_core_events.EventEmitter.subscribe(im_v2_const.EventType.dialog.hideLoadingBar, this.onHideLoadingBar);
	    },
	    unbindEvents() {
	      main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.dialog.showLoadingBar, this.onShowLoadingBar);
	      main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.dialog.hideLoadingBar, this.onHideLoadingBar);
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-content-chat__scope bx-im-content-chat__container" :class="containerClasses" :style="backgroundStyle">
			<div class="bx-im-content-chat__content" ref="content">
				<slot name="header" :currentSidebarPanel="currentSidebarPanel">
					<ChatHeader :dialogId="dialogId" :key="dialogId" :currentSidebarPanel="currentSidebarPanel"/>
				</slot>
				<div :style="dialogContainerStyle" class="bx-im-content-chat__dialog_container">
					<Transition name="loading-bar-transition">
						<LoadingBar v-if="showLoadingBar" />
					</Transition>
					<div class="bx-im-content-chat__dialog_content">
						<slot name="dialog">
							<ChatDialog :dialogId="dialogId" :key="dialogId" />
						</slot>
					</div>
				</div>
				<!-- Textarea -->
				<div v-if="canSend" v-textarea-observer class="bx-im-content-chat__textarea_container" ref="textarea-container">
					<slot name="textarea" :onTextareaMount="onTextareaMount">
						<ChatTextarea :dialogId="dialogId" :key="dialogId" @mounted="onTextareaMount" />
					</slot>
				</div>
				<slot v-else-if="isGuest" name="join-panel">
					<JoinPanel :dialogId="dialogId" />
				</slot>
				<MutePanel v-else :dialogId="dialogId" />
				<!-- End textarea -->
				<DropArea :dialogId="dialogId" :container="$refs.content || {}" :key="dialogId" />
			</div>
			<ChatSidebar 
				v-if="dialogId.length > 0" 
				:originDialogId="dialogId"
				:isActive="!commentsOpened"
				@changePanel="onChangeSidebarPanel" 
			/>
		</div>
	`
	};

	// @vue/component
	const CommentsButton = {
	  name: 'CommentsButton',
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    },
	    counter: {
	      type: Number,
	      required: true
	    }
	  },
	  data() {
	    return {};
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    }
	  },
	  template: `
		<div class="bx-im-dialog-channel__comments-button">
			<div class="bx-im-dialog-channel__comments-button_counter">
				{{ counter }}
			</div>
		</div>
	`
	};

	class ChannelMessageMenu extends im_v2_component_messageList.MessageMenu {
	  getMenuItems() {
	    return [
	    // this.getReplyItem(),
	    this.getCopyItem(), this.getCopyLinkItem(), this.getCopyFileItem(), this.getPinItem(), this.getForwardItem(), this.getDelimiter(), this.getMarkItem(), this.getFavoriteItem(), this.getDelimiter(), this.getDownloadFileItem(), this.getSaveToDisk(), this.getDelimiter(), this.getEditItem(), this.getDeleteItem()];
	  }
	}

	// @vue/component
	const ChannelMessageList = {
	  name: 'ChannelMessageList',
	  components: {
	    MessageList: im_v2_component_messageList.MessageList
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  computed: {
	    ChannelMessageMenu: () => ChannelMessageMenu
	  },
	  template: `
		<MessageList :dialogId="dialogId" :messageMenuClass="ChannelMessageMenu" />
	`
	};

	// @vue/component
	const ChannelDialog = {
	  name: 'ChannelDialog',
	  components: {
	    ChatDialog: im_v2_component_dialog_chat.ChatDialog,
	    ChannelMessageList,
	    CommentsButton
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  data() {
	    return {
	      lastScrolledChatId: 0
	    };
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    layout() {
	      return this.$store.getters['application/getLayout'];
	    },
	    isGuest() {
	      return this.dialog.role === im_v2_const.UserRole.guest;
	    },
	    isChatLayout() {
	      return this.layout.name === im_v2_const.Layout.chat.name;
	    },
	    channelComments() {
	      return this.$store.getters['counters/getChannelComments'](this.dialog.chatId);
	    },
	    totalChannelCommentsCounter() {
	      let counter = 0;
	      Object.values(this.channelComments).forEach(commentCounter => {
	        counter += commentCounter;
	      });
	      return counter;
	    },
	    showCommentsButton() {
	      return this.isChatLayout && this.totalChannelCommentsCounter > 0;
	    }
	  },
	  beforeUnmount() {
	    this.readAllChannelComments();
	  },
	  methods: {
	    async onCommentsButtonClick() {
	      const chatIdToJump = this.getNextChatIdToJump();
	      this.lastScrolledChatId = chatIdToJump;
	      const messageIdToJump = this.$store.getters['messages/comments/getMessageIdByChatId'](chatIdToJump);
	      if (messageIdToJump) {
	        this.$refs.dialog.goToMessageContext(messageIdToJump, {
	          position: im_v2_component_dialog_chat.ScrollManager.scrollPosition.messageBottom
	        });
	        return;
	      }
	      await this.goToMessageContextByCommentsChatId(chatIdToJump);
	    },
	    async goToMessageContextByCommentsChatId(chatId) {
	      this.$refs.dialog.showLoadingBar();
	      const messageId = await this.$refs.dialog.getMessageService().loadContextByChatId(chatId).catch(error => {
	        // eslint-disable-next-line no-console
	        console.error('ChannelDialog: goToMessageContextByCommentsChatId error', error);
	      });
	      this.$refs.dialog.hideLoadingBar();
	      if (!messageId) {
	        // eslint-disable-next-line no-console
	        console.error('ChannelDialog: no messageId after loading context');
	      }
	      await this.$nextTick();
	      this.$refs.dialog.getScrollManager().scrollToMessage(messageId, {
	        position: im_v2_component_dialog_chat.ScrollManager.scrollPosition.messageBottom
	      });
	      await this.$nextTick();
	      this.$refs.dialog.highlightMessage(messageId);
	    },
	    getNextChatIdToJump() {
	      const commentChatIds = this.getCommentsChatIds();
	      commentChatIds.sort((a, z) => a - z);
	      if (this.lastScrolledChatId === 0) {
	        return commentChatIds[0];
	      }
	      const filteredChatIds = commentChatIds.filter(chatId => chatId > this.lastScrolledChatId);
	      if (filteredChatIds.length === 0) {
	        return commentChatIds[0];
	      }
	      return filteredChatIds[0];
	    },
	    getCommentsChatIds() {
	      return Object.keys(this.channelComments).map(chatId => {
	        return Number(chatId);
	      });
	    },
	    readAllChannelComments() {
	      im_v2_provider_service.CommentsService.readAllChannelComments(this.dialogId);
	    }
	  },
	  template: `
		<ChatDialog ref="dialog" :dialogId="dialogId" :resetOnExit="isGuest">
			<template #message-list>
				<ChannelMessageList :dialogId="dialogId" />
			</template>
			<template #additional-float-button>
				<Transition name="float-button-transition">
					<CommentsButton
						v-if="showCommentsButton"
						:dialogId="dialogId"
						:counter="totalChannelCommentsCounter"
						@click="onCommentsButtonClick"
						key="comments"
					/>
				</Transition>
			</template>
		</ChatDialog>
	`
	};

	// @vue/component
	const ChannelHeader = {
	  name: 'ChannelHeader',
	  components: {
	    ChatHeader
	  },
	  props: {
	    dialogId: {
	      type: String,
	      default: ''
	    },
	    currentSidebarPanel: {
	      type: String,
	      default: ''
	    }
	  },
	  template: `
		<ChatHeader :dialogId="dialogId" :currentSidebarPanel="currentSidebarPanel" />
	`
	};

	// @vue/component
	const JoinPanel$1 = {
	  components: {
	    ChatButton: im_v2_component_elements.Button
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  data() {
	    return {};
	  },
	  computed: {
	    ButtonSize: () => im_v2_component_elements.ButtonSize,
	    ButtonColor: () => im_v2_component_elements.ButtonColor
	  },
	  methods: {
	    onButtonClick() {
	      main_core_events.EventEmitter.emit(im_v2_const.EventType.channel.onChannelJoin, {
	        channelDialogId: this.dialogId
	      });
	      this.getChatService().joinChat(this.dialogId);
	    },
	    getChatService() {
	      if (!this.chatService) {
	        this.chatService = new im_v2_provider_service.ChatService();
	      }
	      return this.chatService;
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-content-chat__textarea_placeholder">
			<ChatButton
				:size="ButtonSize.XL"
				:color="ButtonColor.Primary"
				:text="loc('IM_CONTENT_BLOCKED_TEXTAREA_JOIN_CHANNEL')"
				:isRounded="true"
				@click="onButtonClick"
			/>
		</div>
	`
	};

	// @vue/component
	const ChannelTextarea = {
	  name: 'ChannelTextarea',
	  components: {
	    ChatTextarea: im_v2_component_textarea.ChatTextarea
	  },
	  props: {
	    dialogId: {
	      type: String,
	      default: ''
	    }
	  },
	  template: `
		<ChatTextarea
			:dialogId="dialogId"
			:withCreateMenu="false"
			:withMarket="false"
			class="bx-im-channel-send-panel__container"
		/>
	`
	};

	const ChannelContent = {
	  name: 'ChannelContent',
	  components: {
	    BaseChatContent,
	    ChannelHeader,
	    ChannelDialog,
	    ChannelTextarea,
	    JoinPanel: JoinPanel$1
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    },
	    commentsOpened: {
	      type: Boolean,
	      required: true
	    }
	  },
	  template: `
		<BaseChatContent :dialogId="dialogId" :commentsOpened="commentsOpened">
			<template #header="{ currentSidebarPanel }">
				<ChannelHeader :dialogId="dialogId" :currentSidebarPanel="currentSidebarPanel" :key="dialogId" />
			</template>
			<template #dialog>
				<ChannelDialog :dialogId="dialogId" :key="dialogId" />
			</template>
			<template #join-panel>
				<JoinPanel :dialogId="dialogId" />
			</template>
			<template #textarea="{ onTextareaMount }">
				<ChannelTextarea :dialogId="dialogId" :key="dialogId" @mounted="onTextareaMount" />
			</template>
		</BaseChatContent>
	`
	};

	// @vue/component
	const EmptyState = {
	  data() {
	    return {};
	  },
	  computed: {
	    iconClass() {
	      return this.isEmptyRecent ? '--empty' : '--default';
	    },
	    text() {
	      if (this.isEmptyRecent) {
	        return this.loc('IM_CONTENT_CHAT_NO_CHATS_START_MESSAGE');
	      }
	      if (this.isChannelLayout) {
	        return this.loc('IM_CONTENT_CHANNEL_START_MESSAGE_V2');
	      }
	      return this.loc('IM_CONTENT_CHAT_START_MESSAGE_V2');
	    },
	    subtext() {
	      return '';
	    },
	    isEmptyRecent() {
	      return im_v2_provider_service.RecentService.getInstance().getCollection().length === 0;
	    },
	    isChannelLayout() {
	      return this.layout.name === im_v2_const.Layout.channel.name;
	    },
	    layout() {
	      return this.$store.getters['application/getLayout'];
	    },
	    backgroundStyle() {
	      return im_v2_lib_theme.ThemeManager.getCurrentBackgroundStyle();
	    }
	  },
	  methods: {
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-content-chat-start__container" :style="backgroundStyle">
			<div class="bx-im-content-chat-start__content">
				<div class="bx-im-content-chat-start__icon" :class="iconClass"></div>
				<div class="bx-im-content-chat-start__title">
					{{ text }}
				</div>
				<div v-if="subtext" class="bx-im-content-chat-start__subtitle">
					{{ subtext }}
				</div>
			</div>
		</div>
	`
	};

	class UserService {
	  async updateLastActivityDate(userId) {
	    if (this.isPullServerWithUserStatusSupport()) {
	      const lastActivityDate = await this.getUserActivityFromPull(userId);
	      if (!lastActivityDate) {
	        return Promise.resolve();
	      }
	      return this.updateUserModel(userId, {
	        lastActivityDate
	      });
	    }
	    const userData = await this.requestUserData(userId);
	    return this.updateUserModel(userId, userData);
	  }
	  async getUserActivityFromPull(userId) {
	    const result = await im_v2_application_core.Core.getPullClient().getUsersLastSeen([userId]).catch(error => {
	      // eslint-disable-next-line no-console
	      console.error('UserService: error getting user activity from P&P', error);
	    });
	    if (!main_core.Type.isNumber(result[userId])) {
	      return null;
	    }
	    const activityDateAgo = result[userId] * 1000;
	    return new Date(Date.now() - activityDateAgo);
	  }
	  async requestUserData(userId) {
	    im_v2_lib_logger.Logger.warn(`UserService: get actual user data for - ${userId}`);
	    const answer = await im_v2_application_core.Core.getRestClient().callMethod(im_v2_const.RestMethod.imUserGet, {
	      ID: userId
	    }).catch(error => {
	      // eslint-disable-next-line no-console
	      console.error('UserService: error getting user data', error);
	    });
	    return answer.data();
	  }
	  async updateUserModel(userId, userFields) {
	    im_v2_lib_logger.Logger.warn('UserService: update user data', userFields);
	    return im_v2_application_core.Core.getStore().dispatch('users/update', {
	      id: userId,
	      fields: userFields
	    });
	  }
	  isPullServerWithUserStatusSupport() {
	    return im_v2_application_core.Core.getPullClient().isJsonRpc();
	  }
	}

	// @vue/component
	const ChatOpener = {
	  name: 'ChatOpener',
	  components: {
	    BaseChatContent,
	    ChannelContent,
	    EmptyState
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    },
	    commentsOpened: {
	      type: Boolean,
	      required: true
	    }
	  },
	  emits: ['close'],
	  data() {
	    return {};
	  },
	  computed: {
	    layout() {
	      return this.$store.getters['application/getLayout'];
	    },
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    isUser() {
	      return this.dialog.type === im_v2_const.ChatType.user;
	    },
	    isChannel() {
	      return [im_v2_const.ChatType.channel, im_v2_const.ChatType.openChannel].includes(this.dialog.type);
	    },
	    isGuest() {
	      return this.dialog.role === im_v2_const.UserRole.guest;
	    }
	  },
	  watch: {
	    dialogId(newValue, oldValue) {
	      im_v2_lib_logger.Logger.warn(`ChatContent: switching from ${oldValue || 'empty'} to ${newValue}`);
	      this.onChatChange();
	    }
	  },
	  created() {
	    if (!this.dialogId) {
	      return;
	    }
	    this.onChatChange();
	  },
	  methods: {
	    async onChatChange() {
	      if (this.dialogId === '') {
	        return;
	      }
	      if (im_v2_lib_utils.Utils.dialog.isExternalId(this.dialogId)) {
	        const realDialogId = await this.getChatService().prepareDialogId(this.dialogId);
	        void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
	          name: im_v2_const.Layout.chat.name,
	          entityId: realDialogId,
	          contextId: this.layout.contextId
	        });
	        return;
	      }
	      if (this.dialog.inited) {
	        im_v2_lib_logger.Logger.warn(`ChatContent: chat ${this.dialogId} is already loaded`);
	        if (this.isUser) {
	          const userId = parseInt(this.dialog.dialogId, 10);
	          void this.getUserService().updateLastActivityDate(userId);
	        } else if (this.isChannel && !this.isGuest) {
	          im_v2_lib_logger.Logger.warn(`ChatContent: channel ${this.dialogId} is loaded, loading comments metadata`);
	          void this.getChatService().loadCommentInfo(this.dialogId);
	        }
	        return;
	      }
	      if (this.dialog.loading) {
	        im_v2_lib_logger.Logger.warn(`ChatContent: chat ${this.dialogId} is loading`);
	        return;
	      }
	      if (this.layout.contextId) {
	        await this.loadChatWithContext();
	        return;
	      }
	      await this.loadChat();
	    },
	    async loadChatWithContext() {
	      im_v2_lib_logger.Logger.warn(`ChatContent: loading chat ${this.dialogId} with context - ${this.layout.contextId}`);
	      await this.getChatService().loadChatWithContext(this.dialogId, this.layout.contextId).catch(error => {
	        this.handleChatLoadError(error);
	        im_v2_lib_logger.Logger.error(error);
	        im_public.Messenger.openChat();
	      });
	      im_v2_lib_logger.Logger.warn(`ChatContent: chat ${this.dialogId} is loaded with context of ${this.layout.contextId}`);
	    },
	    async loadChat() {
	      im_v2_lib_logger.Logger.warn(`ChatContent: loading chat ${this.dialogId}`);
	      await this.getChatService().loadChatWithMessages(this.dialogId).catch(error => {
	        this.handleChatLoadError(error);
	        im_v2_lib_logger.Logger.error(error);
	        im_public.Messenger.openChat();
	      });
	      im_v2_lib_logger.Logger.warn(`ChatContent: chat ${this.dialogId} is loaded`);
	    },
	    handleChatLoadError(error) {
	      const [firstError] = error;
	      if (firstError.code === 'ACCESS_DENIED') {
	        this.showNotification(this.loc('IM_CONTENT_CHAT_ACCESS_ERROR'));
	      } else if (firstError.code === 'MESSAGE_NOT_FOUND') {
	        this.showNotification(this.loc('IM_CONTENT_CHAT_CONTEXT_MESSAGE_NOT_FOUND'));
	      }
	    },
	    showNotification(text) {
	      BX.UI.Notification.Center.notify({
	        content: text
	      });
	    },
	    getChatService() {
	      if (!this.chatService) {
	        this.chatService = new im_v2_provider_service.ChatService();
	      }
	      return this.chatService;
	    },
	    getUserService() {
	      if (!this.userService) {
	        this.userService = new UserService();
	      }
	      return this.userService;
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-content-default-chat__container">
			<EmptyState v-if="!dialogId" />
			<ChannelContent v-else-if="isChannel" :dialogId="dialogId" :commentsOpened="commentsOpened" />
			<BaseChatContent
				v-else
				:dialogId="dialogId"
				class="bx-im-content-comments__container"
			/>
		</div>
	`
	};

	// @vue/component
	const SubscribeToggle = {
	  name: 'SubscribeToggle',
	  components: {
	    Toggle: im_v2_component_elements.Toggle
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  data() {
	    return {};
	  },
	  computed: {
	    ToggleSize: () => im_v2_component_elements.ToggleSize,
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    postMessageId() {
	      return this.$store.getters['messages/comments/getMessageIdByChatId'](this.dialog.chatId);
	    },
	    isSubscribed() {
	      return this.$store.getters['messages/comments/isUserSubscribed'](this.postMessageId);
	    }
	  },
	  methods: {
	    onToggleClick() {
	      if (this.isSubscribed) {
	        im_v2_provider_service.CommentsService.unsubscribe(this.postMessageId);
	        return;
	      }
	      im_v2_provider_service.CommentsService.subscribe(this.postMessageId);
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div @click="onToggleClick" class="bx-im-comments-header-follow__container">
			<div class="bx-im-comments-header-follow__text">{{ loc('IM_CONTENT_COMMENTS_FOLLOW_TOGGLE_TEXT') }}</div>
			<Toggle :size="ToggleSize.M" :isEnabled="isSubscribed" />
		</div>
	`
	};

	// @vue/component
	const CommentsHeader = {
	  name: 'CommentsHeader',
	  components: {
	    ChatHeader,
	    ChatAvatar: im_v2_component_elements.ChatAvatar,
	    SubscribeToggle
	  },
	  props: {
	    dialogId: {
	      type: String,
	      default: ''
	    },
	    channelId: {
	      type: String,
	      required: true
	    },
	    currentSidebarPanel: {
	      type: String,
	      default: ''
	    }
	  },
	  computed: {
	    AvatarSize: () => im_v2_component_elements.AvatarSize,
	    channel() {
	      return this.$store.getters['chats/get'](this.channelId, true);
	    },
	    showSubscribeToggle() {
	      return im_v2_lib_permission.PermissionManager.getInstance().canPerformAction(im_v2_const.ChatActionType.subscribeToComments, this.dialogId);
	    }
	  },
	  methods: {
	    onBackClick() {
	      main_core_events.EventEmitter.emit(im_v2_const.EventType.dialog.closeComments);
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<ChatHeader
			:dialogId="dialogId"
			:currentSidebarPanel="currentSidebarPanel"
			class="bx-im-comment-header__container"
		>
			<template #left>
				<div @click="onBackClick" class="bx-im-comment-header__back"></div>
				<div class="bx-im-comment-header__info">
					<div class="bx-im-comment-header__title">{{ loc('IM_CONTENT_COMMENTS_HEADER_TITLE') }}</div>
					<div class="bx-im-comment-header__subtitle">
						<div class="bx-im-comment-header__subtitle_avatar">
							<ChatAvatar :avatarDialogId="channelId" :contextDialogId="channelId" :size="AvatarSize.XS" />
						</div>
						<div class="bx-im-comment-header__subtitle_text">{{ channel.name }}</div>
					</div>
				</div>
			</template>
			<template v-if="showSubscribeToggle" #before-actions>
				<SubscribeToggle :dialogId="dialogId" />
			</template>
		</ChatHeader>
	`
	};

	// @vue/component
	const CommentsDialogLoader = {
	  name: 'CommentsDialogLoader',
	  data() {
	    return {};
	  },
	  methods: {
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-comments-dialog-loader__container">
			<div class="bx-im-comments-dialog-loader__spinner"></div>
		</div>
	`
	};

	class CommentsMessageMenu extends im_v2_component_messageList.MessageMenu {
	  getMenuItems() {
	    return [this.getReplyItem(), this.getCopyItem(), this.getCopyFileItem(),
	    // this.getPinItem(),
	    // this.getForwardItem(),
	    this.getDelimiter(),
	    // this.getMarkItem(),
	    this.getFavoriteItem(), this.getDelimiter(), this.getCreateItem(), this.getDelimiter(), this.getDownloadFileItem(), this.getSaveToDisk(), this.getDelimiter(), this.getEditItem(), this.getDeleteItem()];
	  }
	  getReplyItem() {
	    if (this.isPostMessage()) {
	      return null;
	    }
	    return super.getReplyItem();
	  }
	  getEditItem() {
	    if (this.isPostMessage()) {
	      return null;
	    }
	    return super.getEditItem();
	  }
	  getDeleteItem() {
	    if (this.isPostMessage()) {
	      return null;
	    }
	    return super.getDeleteItem();
	  }
	  getCreateItem() {
	    if (this.isPostMessage()) {
	      return null;
	    }
	    return super.getCreateItem();
	  }
	  isPostMessage() {
	    const {
	      type
	    } = this.store.getters['chats/getByChatId'](this.context.chatId);
	    return [im_v2_const.ChatType.openChannel, im_v2_const.ChatType.channel].includes(type);
	  }
	}

	// @vue/component
	const CommentsMessageList = {
	  name: 'CommentsMessageList',
	  components: {
	    MessageList: im_v2_component_messageList.MessageList,
	    CommentsDialogLoader,
	    AuthorGroup: im_v2_component_messageList.AuthorGroup,
	    ...im_v2_component_messageList.MessageComponents
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  computed: {
	    CommentsMessageMenu: () => CommentsMessageMenu,
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    showPostMessage() {
	      return this.dialog.inited && !this.dialog.hasPrevPage;
	    },
	    postMessageId() {
	      return this.$store.getters['messages/comments/getMessageIdByChatId'](this.dialog.chatId);
	    },
	    postMessage() {
	      return this.$store.getters['messages/getById'](this.postMessageId);
	    },
	    postAuthorGroup() {
	      if (!this.dialog.inited) {
	        return null;
	      }
	      const collectionManager = new im_v2_component_messageList.CollectionManager(this.dialogId);
	      return collectionManager.formatAuthorGroup(this.postMessage);
	    }
	  },
	  methods: {
	    onPostMessageMouseUp(message, event) {
	      this.$refs.messageList.onMessageMouseUp(message, event);
	    },
	    getMessageComponentName(message) {
	      return new im_v2_component_messageList.MessageComponentManager(message).getName();
	    }
	  },
	  template: `
		<MessageList
			:dialogId="dialogId"
			:messageMenuClass="CommentsMessageMenu"
			ref="messageList"
		>
			<template #loader>
				<CommentsDialogLoader />
			</template>
			<template v-if="showPostMessage" #before-messages>
				<div class="bx-im-comments-message-list__channel-post">
					<AuthorGroup :item="postAuthorGroup" :contextDialogId="dialogId">
						<template #message>
							<component
								:is="getMessageComponentName(postMessage)"
								:item="postMessage"
								:dialogId="dialogId"
								:key="postMessage.id"
								@mouseup="onPostMessageMouseUp(postMessage, $event)"
							>
							</component>
						</template>
					</AuthorGroup>
				</div>
			</template>
		</MessageList>
	`
	};

	// @vue/component
	const CommentsDialog = {
	  name: 'CommentsDialog',
	  components: {
	    ChatDialog: im_v2_component_dialog_chat.ChatDialog,
	    CommentsMessageList,
	    PinnedMessages: im_v2_component_dialog_chat.PinnedMessages
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/get'](this.dialogId, true);
	    },
	    dialogInited() {
	      return this.dialog.inited;
	    },
	    postMessageId() {
	      return this.$store.getters['messages/comments/getMessageIdByChatId'](this.dialog.chatId);
	    },
	    postMessage() {
	      return this.$store.getters['messages/getById'](this.postMessageId);
	    }
	  },
	  methods: {
	    async goToPostMessageContext() {
	      const dialog = this.$refs.dialog;
	      const postMessageIsShown = this.dialogInited && !this.dialog.hasPrevPage;
	      if (postMessageIsShown) {
	        await dialog.getScrollManager().animatedScrollToMessage(this.postMessageId);
	        dialog.highlightMessage(this.postMessageId);
	        return;
	      }
	      dialog.showLoadingBar();
	      await dialog.getMessageService().loadFirstPage().catch(error => {
	        im_v2_lib_logger.Logger.error('goToMessageContext error', error);
	      });
	      await this.$nextTick();
	      dialog.hideLoadingBar();
	      dialog.getScrollManager().scrollToMessage(this.postMessageId);
	      await this.$nextTick();
	      dialog.highlightMessage(this.postMessageId);
	    },
	    onPinnedPostMessageClick() {
	      this.goToPostMessageContext();
	    }
	  },
	  template: `
		<ChatDialog ref="dialog" :dialogId="dialogId" :saveScrollOnExit="false" :resetOnExit="true">
			<template v-if="dialogInited" #pinned-panel>
				<PinnedMessages
					:dialogId="dialogId"
					:messages="[postMessage]"
					@messageClick="onPinnedPostMessageClick"
				/>
			</template>
			<template #message-list>
				<CommentsMessageList :dialogId="dialogId" />
			</template>
		</ChatDialog>
	`
	};

	// @vue/component
	const CommentsTextarea = {
	  name: 'CommentsTextarea',
	  components: {
	    ChatTextarea: im_v2_component_textarea.ChatTextarea
	  },
	  props: {
	    dialogId: {
	      type: String,
	      default: ''
	    }
	  },
	  template: `
		<ChatTextarea
			:dialogId="dialogId"
			:withMarket="false"
			class="bx-im-comments-send-panel__container"
		/>
	`
	};

	// @vue/component
	const JoinPanel$2 = {
	  components: {
	    ChatButton: im_v2_component_elements.Button
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  data() {
	    return {};
	  },
	  computed: {
	    ButtonSize: () => im_v2_component_elements.ButtonSize,
	    ButtonColor: () => im_v2_component_elements.ButtonColor
	  },
	  methods: {
	    onButtonClick() {
	      main_core_events.EventEmitter.emit(im_v2_const.EventType.channel.onChannelJoin, {
	        channelDialogId: this.dialogId
	      });
	      this.getChatService().joinChat(this.dialogId);
	    },
	    getChatService() {
	      if (!this.chatService) {
	        this.chatService = new im_v2_provider_service.ChatService();
	      }
	      return this.chatService;
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-content-chat__textarea_placeholder">
			<ChatButton
				:size="ButtonSize.XL"
				:color="ButtonColor.Primary"
				:text="loc('IM_CONTENT_BLOCKED_TEXTAREA_JOIN_CHANNEL')"
				:isRounded="true"
				@click="onButtonClick"
			/>
		</div>
	`
	};

	const CommentsContent = {
	  name: 'CommentsContent',
	  components: {
	    BaseChatContent,
	    CommentsHeader,
	    CommentsDialog,
	    CommentsTextarea,
	    JoinPanel: JoinPanel$2
	  },
	  props: {
	    dialogId: {
	      type: String,
	      required: true
	    },
	    channelId: {
	      type: String,
	      required: true
	    }
	  },
	  template: `
		<BaseChatContent :dialogId="dialogId">
			<template #header="{ currentSidebarPanel }">
				<CommentsHeader
					:dialogId="dialogId"
					:channelId="channelId"
					:currentSidebarPanel="currentSidebarPanel"
					:key="dialogId"
				/>
			</template>
			<template #dialog>
				<CommentsDialog :dialogId="dialogId" :key="dialogId" />
			</template>
			<template #join-panel>
				<JoinPanel :dialogId="dialogId" />
			</template>
			<template #textarea="{ onTextareaMount }">
				<CommentsTextarea :dialogId="dialogId" :key="dialogId" @mounted="onTextareaMount" />
			</template>
		</BaseChatContent>
	`
	};

	// @vue/component
	const CommentsOpener = {
	  name: 'CommentsOpener',
	  components: {
	    CommentsContent
	  },
	  props: {
	    postId: {
	      type: Number,
	      required: true
	    },
	    channelId: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['close'],
	  data() {
	    return {};
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/getByChatId'](this.commentsChatId);
	    },
	    commentInfo() {
	      return this.$store.getters['messages/comments/getByMessageId'](this.postId);
	    },
	    commentsChatId() {
	      return this.commentInfo.chatId;
	    },
	    commentsDialogId() {
	      if (!this.dialog) {
	        return '';
	      }
	      return this.dialog.dialogId;
	    }
	  },
	  created() {
	    this.onCreated();
	  },
	  methods: {
	    async onCreated() {
	      await this.loadChat();
	    },
	    async loadChat() {
	      im_v2_lib_logger.Logger.warn(`CommentsContent: loading comments for post ${this.postId}`);
	      await this.getChatService().loadComments(this.postId).catch(error => {
	        this.handleChatLoadError(error);
	        im_v2_lib_logger.Logger.error(error);
	        this.$emit('close');
	      });
	      im_v2_lib_logger.Logger.warn(`CommentsContent: comments for post ${this.postId} are loaded`);
	    },
	    handleChatLoadError(error) {
	      const [firstError] = error;
	      if (firstError.code === 'ACCESS_DENIED') {
	        this.showNotification(this.loc('IM_CONTENT_CHAT_ACCESS_ERROR'));
	      }
	    },
	    showNotification(text) {
	      BX.UI.Notification.Center.notify({
	        content: text
	      });
	    },
	    getChatService() {
	      if (!this.chatService) {
	        this.chatService = new im_v2_provider_service.ChatService();
	      }
	      return this.chatService;
	    }
	  },
	  template: `
		<div class="bx-im-content-comments__container">
			<CommentsContent :dialogId="commentsDialogId" :channelId="channelId" />
		</div>
	`
	};

	// @vue/component
	const ChatContent = {
	  name: 'ChatContent',
	  components: {
	    ChatOpener,
	    CommentsOpener
	  },
	  props: {
	    entityId: {
	      type: String,
	      default: ''
	    }
	  },
	  data() {
	    return {
	      commentsPostId: 0,
	      commentsAnimationFlag: false
	    };
	  },
	  computed: {
	    layout() {
	      return this.$store.getters['application/getLayout'];
	    },
	    showComments() {
	      return this.commentsPostId > 0;
	    }
	  },
	  watch: {
	    layout(newValue) {
	      this.closeComments();
	    }
	  },
	  created() {
	    main_core_events.EventEmitter.subscribe(im_v2_const.EventType.dialog.openComments, this.onOpenComments);
	    main_core_events.EventEmitter.subscribe(im_v2_const.EventType.dialog.closeComments, this.onCloseComments);
	  },
	  beforeUnmount() {
	    main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.dialog.openComments, this.onOpenComments);
	    main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.dialog.closeComments, this.onCloseComments);
	  },
	  methods: {
	    onOpenComments(event) {
	      const {
	        messageId
	      } = event.getData();
	      this.commentsPostId = messageId;
	      this.commentsAnimationFlag = true;
	    },
	    onCloseComments() {
	      this.closeComments();
	    },
	    closeComments() {
	      this.commentsPostId = 0;
	    },
	    onCommentsAnimationEnd() {
	      this.commentsAnimationFlag = false;
	    }
	  },
	  template: `
		<ChatOpener
			:commentsOpened="showComments"
			:dialogId="entityId"
			:class="{'--comments-show-animation': commentsAnimationFlag}"
		/>
		<Transition name="comments-content" @after-enter="onCommentsAnimationEnd">
			<CommentsOpener
				v-if="showComments"
				:postId="commentsPostId"
				:channelId="entityId"
			/>
		</Transition>
	`
	};

	exports.ChatContent = ChatContent;

}((this.BX.Messenger.v2.Component.Content = this.BX.Messenger.v2.Component.Content || {}),BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Component,BX.Messenger.v2.Component.EntitySelector,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Component.Animation,BX.Messenger.v2.Lib,BX.UI.Uploader,BX.Messenger.v2.Lib,BX,BX.Messenger.v2.Application,BX,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Model,BX.Messenger.v2.Component.Dialog,BX.Messenger.v2.Component,BX.Messenger.v2.Component,BX.Event,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Const,BX.Messenger.v2.Provider.Service));
//# sourceMappingURL=chat-content.bundle.js.map
