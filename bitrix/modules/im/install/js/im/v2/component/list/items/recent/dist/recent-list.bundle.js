/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,call_component_activeCallList,main_core_events,ui_iconSet_api_vue,im_public,im_v2_lib_createChat,im_v2_component_elements_button,im_v2_lib_feature,im_v2_lib_invite,im_v2_component_list_items_elements_inputActionIndicator,im_v2_component_elements_chatTitle,im_v2_lib_dateFormatter,im_v2_lib_channel,main_core,main_date,im_v2_lib_parser,im_v2_component_elements_avatar,im_v2_lib_counter,im_v2_application_core,im_v2_lib_recent,im_v2_component_elements_listLoadingState,im_v2_component_list_items_elements_emptyState,im_v2_const,im_v2_lib_draft,im_v2_lib_menu,im_v2_lib_utils,im_v2_model,im_v2_provider_service_recent) {
	'use strict';

	class BroadcastManager extends main_core_events.EventEmitter {
	  static getInstance() {
	    if (!this.instance) {
	      this.instance = new this();
	    }
	    return this.instance;
	  }
	  constructor() {
	    super();
	    this.setEventNamespace(BroadcastManager.eventNamespace);
	    this.init();
	  }
	  isSupported() {
	    return !main_core.Type.isUndefined(window.BroadcastChannel) && !im_v2_lib_utils.Utils.platform.isBitrixDesktop();
	  }
	  init() {
	    if (!this.isSupported()) {
	      return;
	    }
	    this.channel = new BroadcastChannel(BroadcastManager.channelName);
	    this.channel.addEventListener('message', ({
	      data: {
	        type,
	        data
	      }
	    }) => {
	      this.emit(type, data);
	    });
	  }
	  sendRecentList(recentData) {
	    if (!this.isSupported()) {
	      return;
	    }
	    this.channel.postMessage({
	      type: BroadcastManager.events.recentListUpdate,
	      data: recentData
	    });
	  }
	}
	BroadcastManager.instance = null;
	BroadcastManager.channelName = 'im-recent';
	BroadcastManager.eventNamespace = 'BX.Messenger.v2.Recent.BroadcastManager';
	BroadcastManager.events = {
	  recentListUpdate: 'recentListUpdate'
	};

	class LikeManager {
	  constructor() {
	    this.store = im_v2_application_core.Core.getStore();
	  }
	  init() {
	    this.onDialogInitedHandler = this.onDialogInited.bind(this);
	    main_core_events.EventEmitter.subscribe(im_v2_const.EventType.dialog.onDialogInited, this.onDialogInitedHandler);
	  }
	  destroy() {
	    main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.dialog.onDialogInited, this.onDialogInitedHandler);
	  }
	  onDialogInited(event) {
	    const {
	      dialogId
	    } = event.getData();
	    const recentItem = this.store.getters['recent/get'](dialogId);
	    if (!recentItem || !recentItem.liked) {
	      return;
	    }
	    this.store.dispatch('recent/like', {
	      dialogId,
	      liked: false
	    });
	  }
	}

	// @vue/component
	const ActiveCallList = {
	  name: 'ActiveCallList',
	  props: {
	    listIsScrolled: {
	      type: Boolean,
	      required: true
	    }
	  },
	  emits: ['onCallClick'],
	  computed: {
	    componentToRender() {
	      return call_component_activeCallList.ActiveCallList;
	    }
	  },
	  template: `
		<component v-if="componentToRender" :is="componentToRender" :listIsScrolled="listIsScrolled" @onCallClick="$emit('onCallClick', $event)" />
	`
	};

	const DefaultTitleByChatType = {
	  [im_v2_const.ChatType.chat]: main_core.Loc.getMessage('IM_LIST_RECENT_CREATE_CHAT_DEFAULT_TITLE'),
	  [im_v2_const.ChatType.videoconf]: main_core.Loc.getMessage('IM_LIST_RECENT_CREATE_CONFERENCE_DEFAULT_TITLE'),
	  [im_v2_const.ChatType.channel]: main_core.Loc.getMessage('IM_LIST_RECENT_CREATE_CHANNEL_DEFAULT_TITLE'),
	  [im_v2_const.ChatType.collab]: main_core.Loc.getMessage('IM_LIST_RECENT_CREATE_COLLAB_DEFAULT_TITLE')
	};
	const SubtitleByChatType = {
	  [im_v2_const.ChatType.chat]: main_core.Loc.getMessage('IM_LIST_RECENT_CREATE_CHAT_SUBTITLE'),
	  [im_v2_const.ChatType.videoconf]: main_core.Loc.getMessage('IM_LIST_RECENT_CREATE_CONFERENCE_SUBTITLE'),
	  [im_v2_const.ChatType.channel]: main_core.Loc.getMessage('IM_LIST_RECENT_CREATE_CHANNEL_SUBTITLE'),
	  [im_v2_const.ChatType.collab]: main_core.Loc.getMessage('IM_LIST_RECENT_CREATE_COLLAB_SUBTITLE')
	};
	const CLOSE_ICON_SIZE = 20;

	// @vue/component
	const CreateChat = {
	  name: 'CreateChat',
	  components: {
	    EmptyAvatar: im_v2_component_elements_avatar.EmptyAvatar,
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  data() {
	    return {
	      chatTitle: '',
	      chatAvatarFile: '',
	      chatType: ''
	    };
	  },
	  computed: {
	    AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
	    OutlineIcons: () => ui_iconSet_api_vue.Outline,
	    Color: () => im_v2_const.Color,
	    CLOSE_ICON_SIZE: () => CLOSE_ICON_SIZE,
	    chatCreationIsOpened() {
	      const {
	        name: currentLayoutName
	      } = this.$store.getters['application/getLayout'];
	      return currentLayoutName === im_v2_const.Layout.createChat;
	    },
	    preparedTitle() {
	      if (this.chatTitle === '') {
	        return DefaultTitleByChatType[this.chatType];
	      }
	      return this.chatTitle;
	    },
	    preparedSubtitle() {
	      return SubtitleByChatType[this.chatType];
	    },
	    preparedAvatar() {
	      if (!this.chatAvatarFile) {
	        return null;
	      }
	      return URL.createObjectURL(this.chatAvatarFile);
	    },
	    avatarType() {
	      if (this.chatType === im_v2_const.ChatType.collab) {
	        return im_v2_component_elements_avatar.EmptyAvatarType.collab;
	      }
	      if (this.chatType === im_v2_const.ChatType.chat) {
	        return im_v2_component_elements_avatar.EmptyAvatarType.default;
	      }
	      return im_v2_component_elements_avatar.EmptyAvatarType.squared;
	    },
	    closeIconColor() {
	      return this.chatCreationIsOpened ? im_v2_const.Color.white : im_v2_const.Color.black;
	    }
	  },
	  created() {
	    const existingTitle = im_v2_lib_createChat.CreateChatManager.getInstance().getChatTitle();
	    if (existingTitle) {
	      this.chatTitle = existingTitle;
	    }
	    const existingAvatar = im_v2_lib_createChat.CreateChatManager.getInstance().getChatAvatar();
	    if (existingAvatar) {
	      this.chatAvatarFile = existingAvatar;
	    }
	    this.chatType = im_v2_lib_createChat.CreateChatManager.getInstance().getChatType();
	    im_v2_lib_createChat.CreateChatManager.getInstance().subscribe(im_v2_lib_createChat.CreateChatManager.events.titleChange, this.onTitleChange);
	    im_v2_lib_createChat.CreateChatManager.getInstance().subscribe(im_v2_lib_createChat.CreateChatManager.events.avatarChange, this.onAvatarChange);
	    im_v2_lib_createChat.CreateChatManager.getInstance().subscribe(im_v2_lib_createChat.CreateChatManager.events.chatTypeChange, this.onChatTypeChange);
	  },
	  beforeUnmount() {
	    im_v2_lib_createChat.CreateChatManager.getInstance().unsubscribe(im_v2_lib_createChat.CreateChatManager.events.titleChange, this.onTitleChange);
	    im_v2_lib_createChat.CreateChatManager.getInstance().unsubscribe(im_v2_lib_createChat.CreateChatManager.events.avatarChange, this.onAvatarChange);
	    im_v2_lib_createChat.CreateChatManager.getInstance().unsubscribe(im_v2_lib_createChat.CreateChatManager.events.chatTypeChange, this.onChatTypeChange);
	  },
	  methods: {
	    onTitleChange(event) {
	      this.chatTitle = event.getData();
	    },
	    onAvatarChange(event) {
	      this.chatAvatarFile = event.getData();
	    },
	    onChatTypeChange(event) {
	      this.chatType = event.getData();
	    },
	    onClick() {
	      im_v2_lib_createChat.CreateChatManager.getInstance().startChatCreation(this.chatType, {
	        clearCurrentCreation: false
	      });
	    },
	    onCancel() {
	      im_v2_lib_createChat.CreateChatManager.getInstance().clearExternalFields();
	      im_v2_lib_createChat.CreateChatManager.getInstance().setCreationStatus(false);
	      if (!this.chatCreationIsOpened) {
	        return;
	      }
	      void im_public.Messenger.openChat();
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-list-recent-create-chat__container">
			<div class="bx-im-list-recent-item__wrap" :class="{'--selected': chatCreationIsOpened}" @click="onClick">
				<div class="bx-im-list-recent-item__container">
					<div class="bx-im-list-recent-create-chat__avatar-container">
						<EmptyAvatar 
							:url="preparedAvatar" 
							:size="AvatarSize.XL"
							:title="chatTitle"
							:type="avatarType"
						/>
					</div>
					<div class="bx-im-list-recent-item__content_container">
						<div class="bx-im-list-recent-item__content_header">
							<div class="bx-im-list-recent-create-chat__header --ellipsis">
								{{ preparedTitle }}
							</div>
						</div>
						<div class="bx-im-list-recent-item__content_bottom">
							<div class="bx-im-list-recent-item__message_container">
								{{ preparedSubtitle }}
							</div>
						</div>
					</div>
					<BIcon
						:name="OutlineIcons.CROSS_M"
						:size="CLOSE_ICON_SIZE"
						:color="closeIconColor"
						class="bx-im-list-recent-create-chat__icon-close"
						@click.stop="onCancel"
					/>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const EmptyState = {
	  name: 'EmptyState',
	  components: {
	    ChatButton: im_v2_component_elements_button.ChatButton,
	    RecentEmptyState: im_v2_component_list_items_elements_emptyState.RecentEmptyState
	  },
	  computed: {
	    ButtonSize: () => im_v2_component_elements_button.ButtonSize,
	    ButtonColor: () => im_v2_component_elements_button.ButtonColor,
	    canInviteUsers() {
	      return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.intranetInviteAvailable);
	    }
	  },
	  methods: {
	    onInviteUsersClick() {
	      im_v2_lib_invite.InviteManager.openInviteSlider();
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<RecentEmptyState
			:title="loc('IM_LIST_RECENT_EMPTY_STATE_TITLE')"
			:subtitle="loc('IM_LIST_RECENT_EMPTY_STATE_SUBTITLE')"
		>
			<ChatButton
				v-if="canInviteUsers"
				:size="ButtonSize.L"
				:isRounded="true"
				:text="loc('IM_LIST_RECENT_EMPTY_STATE_INVITE_USERS')"
				@click="onInviteUsersClick"
			/>
		</RecentEmptyState>
	`
	};

	const HiddenTitleByChatType = {
	  [im_v2_const.ChatType.openChannel]: main_core.Loc.getMessage('IM_LIST_RECENT_CHAT_TYPE_OPEN_CHANNEL'),
	  [im_v2_const.ChatType.channel]: main_core.Loc.getMessage('IM_LIST_RECENT_CHAT_TYPE_PRIVATE_CHANNEL'),
	  [im_v2_const.ChatType.generalChannel]: main_core.Loc.getMessage('IM_LIST_RECENT_CHAT_TYPE_OPEN_CHANNEL'),
	  default: main_core.Loc.getMessage('IM_LIST_RECENT_CHAT_TYPE_GROUP_V2')
	};

	// @vue/component
	const MessageText = {
	  name: 'MessageText',
	  components: {
	    MessageAvatar: im_v2_component_elements_avatar.MessageAvatar
	  },
	  props: {
	    item: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
	    recentItem() {
	      return this.item;
	    },
	    dialog() {
	      return this.$store.getters['chats/get'](this.recentItem.dialogId, true);
	    },
	    user() {
	      return this.$store.getters['users/get'](this.recentItem.dialogId, true);
	    },
	    message() {
	      return this.$store.getters['recent/getMessage'](this.recentItem.dialogId);
	    },
	    needsBirthdayPlaceholder() {
	      return im_v2_lib_recent.RecentManager.needsBirthdayPlaceholder(this.recentItem.dialogId);
	    },
	    needsVacationPlaceholder() {
	      return im_v2_lib_recent.RecentManager.needsVacationPlaceholder(this.recentItem.dialogId);
	    },
	    showLastMessage() {
	      return this.$store.getters['application/settings/get'](im_v2_const.Settings.recent.showLastMessage);
	    },
	    selfChatText() {
	      return this.loc('IM_LIST_RECENT_CHAT_SELF_SUBTITLE');
	    },
	    hiddenMessageText() {
	      var _HiddenTitleByChatTyp;
	      if (this.isSelfChat) {
	        return this.selfChatText;
	      }
	      if (this.isUser) {
	        return this.$store.getters['users/getPosition'](this.recentItem.dialogId);
	      }
	      return (_HiddenTitleByChatTyp = HiddenTitleByChatType[this.dialog.type]) != null ? _HiddenTitleByChatTyp : HiddenTitleByChatType.default;
	    },
	    isLastMessageAuthor() {
	      return this.showLastMessage && this.message.authorId === im_v2_application_core.Core.getUserId();
	    },
	    messageText() {
	      if (this.message.isDeleted) {
	        return this.loc('IM_LIST_RECENT_DELETED_MESSAGE');
	      }
	      const formattedText = im_v2_lib_parser.Parser.purifyRecent(this.recentItem);
	      if (!this.showLastMessage || !formattedText) {
	        return this.hiddenMessageText;
	      }
	      return formattedText;
	    },
	    formattedMessageText() {
	      const SPLIT_INDEX = 27;
	      return im_v2_lib_utils.Utils.text.insertUnseenWhitespace(this.messageText, SPLIT_INDEX);
	    },
	    preparedDraftContent() {
	      const phrase = this.loc('IM_LIST_RECENT_MESSAGE_DRAFT_2');
	      const PLACEHOLDER_LENGTH = '#TEXT#'.length;
	      const prefix = phrase.slice(0, -PLACEHOLDER_LENGTH);
	      const text = main_core.Text.encode(this.formattedDraftText);
	      return `
				<span class="bx-im-list-recent-item__message_draft-prefix">${prefix}</span>
				<span class="bx-im-list-recent-item__message_text_content">${text}</span>
			`;
	    },
	    formattedDraftText() {
	      return im_v2_lib_parser.Parser.purify({
	        text: this.recentItem.draft.text,
	        showIconIfEmptyText: false
	      });
	    },
	    formattedVacationEndDate() {
	      return main_date.DateTimeFormat.format('d.m.Y', this.user.absent);
	    },
	    isUser() {
	      return this.dialog.type === im_v2_const.ChatType.user;
	    },
	    isChat() {
	      return !this.isUser;
	    },
	    isSelfChat() {
	      return this.$store.getters['chats/isSelfChat'](this.recentItem.dialogId);
	    }
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    }
	  },
	  template: `
		<div class="bx-im-list-recent-item__message_container">
			<span class="bx-im-list-recent-item__message_text">
				<span v-if="recentItem.draft.text" v-html="preparedDraftContent"></span>
				<span v-else-if="recentItem.invitation.isActive" class="bx-im-list-recent-item__balloon_container --invitation">
					<span class="bx-im-list-recent-item__balloon">{{ loc('IM_LIST_RECENT_INVITATION_NOT_ACCEPTED_MSGVER_1') }}</span>
				</span>
				<span v-else-if="needsBirthdayPlaceholder" class="bx-im-list-recent-item__balloon_container --birthday" :title="loc('IM_LIST_RECENT_BIRTHDAY')">
					<span class="bx-im-list-recent-item__balloon">{{ loc('IM_LIST_RECENT_BIRTHDAY') }}</span>
				</span>
				<span v-else-if="needsVacationPlaceholder" class="bx-im-list-recent-item__balloon_container --vacation">
					<span class="bx-im-list-recent-item__balloon">
						{{ loc('IM_LIST_RECENT_VACATION', {'#VACATION_END_DATE#': formattedVacationEndDate}) }}
					</span>
				</span>
				<template v-else>
					<span v-if="isLastMessageAuthor" class="bx-im-list-recent-item__self_author-icon"></span>
					<MessageAvatar
						v-else-if="isChat && message.authorId"
						:messageId="message.id"
						:authorId="message.authorId"
						:size="AvatarSize.XXS"
						class="bx-im-list-recent-item__author-avatar"
					/>
					<span>{{ formattedMessageText }}</span>
				</template>
			</span>
		</div>
	`
	};

	// @vue/component
	const ItemCounters = {
	  name: 'ItemCounters',
	  props: {
	    item: {
	      type: Object,
	      required: true
	    },
	    isChatMuted: {
	      type: Boolean,
	      required: true
	    }
	  },
	  computed: {
	    recentItem() {
	      return this.item;
	    },
	    dialog() {
	      return this.$store.getters['chats/get'](this.recentItem.dialogId, true);
	    },
	    user() {
	      return this.$store.getters['users/get'](this.recentItem.dialogId, true);
	    },
	    isUser() {
	      return this.dialog.type === im_v2_const.ChatType.user;
	    },
	    isSelfChat() {
	      return this.isUser && this.user.id === im_v2_application_core.Core.getUserId();
	    },
	    isChatMarkedUnread() {
	      return this.$store.getters['counters/getUnreadStatus'](this.dialog.chatId);
	    },
	    invitation() {
	      return this.recentItem.invitation;
	    },
	    totalCounter() {
	      return this.chatCounter + this.childrenCounter;
	    },
	    chatCounter() {
	      return this.$store.getters['counters/getCounterByChatId'](this.dialog.chatId);
	    },
	    childrenCounter() {
	      return this.$store.getters['counters/getChildrenTotalCounter'](this.dialog.chatId);
	    },
	    formattedCounter() {
	      return this.formatCounter(this.totalCounter);
	    },
	    showCounterContainer() {
	      return !this.invitation.isActive;
	    },
	    showPinnedIcon() {
	      const noCounters = this.totalCounter === 0;
	      return this.recentItem.pinned && noCounters && !this.isChatMarkedUnread;
	    },
	    showUnreadWithoutCounter() {
	      return this.isChatMarkedUnread && this.totalCounter === 0;
	    },
	    showUnreadWithCounter() {
	      return this.isChatMarkedUnread && this.totalCounter > 0;
	    },
	    showMention() {
	      return this.$store.getters['messages/anchors/isChatHasAnchorsWithType'](this.dialog.chatId, im_v2_const.AnchorType.mention) && !this.isSelfChat;
	    },
	    showCounter() {
	      if (this.totalCounter === 0 || this.isSelfChat || this.isChatMarkedUnread) {
	        return false;
	      }
	      const isSingleMessageWithMention = this.showMention && this.totalCounter === 1;
	      if (isSingleMessageWithMention) {
	        return false;
	      }
	      return true;
	    },
	    containerClasses() {
	      const commentsOnly = this.chatCounter === 0 && this.childrenCounter > 0;
	      const withComments = this.chatCounter > 0 && this.childrenCounter > 0;
	      const withMentionAndCounter = this.chatCounter > 0 && this.showMention;
	      return {
	        '--muted': this.isChatMuted,
	        '--comments-only': commentsOnly,
	        '--with-comments': withComments,
	        '--with-mention-and-counter': withMentionAndCounter
	      };
	    }
	  },
	  methods: {
	    formatCounter(counter) {
	      return im_v2_lib_counter.CounterManager.formatCounter(counter);
	    }
	  },
	  template: `
		<div v-if="showCounterContainer" :class="containerClasses" class="bx-im-list-recent-item__counters_wrap">
			<div class="bx-im-list-recent-item__counters_container">
				<div v-if="showPinnedIcon" class="bx-im-list-recent-item__pinned-icon"></div>
				<div v-else class="bx-im-list-recent-item__counters">
					<div v-if="showMention" class="bx-im-list-recent-item__mention">
						<div class="bx-im-list-recent-item__mention-icon"></div>
					</div>
					<div v-if="showUnreadWithoutCounter" class="bx-im-list-recent-item__counter_number --no-counter"></div>
					<div v-else-if="showUnreadWithCounter" class="bx-im-list-recent-item__counter_number --with-unread">
						{{ formattedCounter }}
					</div>
					<div v-else-if="showCounter" class="bx-im-list-recent-item__counter_number">
						{{ formattedCounter }}
					</div>
				</div>
			</div>
		</div>
	`
	};

	const StatusIcon = {
	  none: '',
	  like: 'like',
	  sending: 'sending',
	  sent: 'sent',
	  viewed: 'viewed'
	};

	// @vue/component
	const MessageStatus = {
	  props: {
	    item: {
	      type: Object,
	      required: true
	    }
	  },
	  data() {
	    return {};
	  },
	  computed: {
	    recentItem() {
	      return this.item;
	    },
	    user() {
	      return this.$store.getters['users/get'](this.recentItem.dialogId, true);
	    },
	    dialog() {
	      return this.$store.getters['chats/get'](this.recentItem.dialogId, true);
	    },
	    message() {
	      return this.$store.getters['recent/getMessage'](this.recentItem.dialogId);
	    },
	    isChatWithReactions() {
	      return this.$store.getters['messages/anchors/isChatHasAnchorsWithType'](this.dialog.chatId, im_v2_const.AnchorType.reaction);
	    },
	    showLike() {
	      /*
	      * 'this.recent Item.liked' is left to allow work without anchors
	      * */
	      return this.isChatWithReactions || this.recentItem.liked;
	    },
	    messageStatus() {
	      if (this.message.sending) {
	        return im_v2_const.OwnMessageStatus.sending;
	      }
	      if (this.message.viewedByOthers) {
	        return im_v2_const.OwnMessageStatus.viewed;
	      }
	      return im_v2_const.OwnMessageStatus.sent;
	    },
	    statusIcon() {
	      if (this.isSelfChat || this.isBot) {
	        return StatusIcon.none;
	      }
	      if (this.showLike) {
	        return StatusIcon.like;
	      }
	      if (!this.isLastMessageAuthor || this.needsBirthdayPlaceholder || this.hasDraft) {
	        return StatusIcon.none;
	      }
	      return this.messageStatus;
	    },
	    isLastMessageAuthor() {
	      var _this$message;
	      return ((_this$message = this.message) == null ? void 0 : _this$message.authorId) === im_v2_application_core.Core.getUserId();
	    },
	    isSelfChat() {
	      return this.isUser && this.user.id === im_v2_application_core.Core.getUserId();
	    },
	    isUser() {
	      return this.dialog.type === im_v2_const.ChatType.user;
	    },
	    isBot() {
	      if (this.isUser) {
	        return this.user.type === im_v2_const.UserType.bot;
	      }
	      return false;
	    },
	    hasDraft() {
	      return Boolean(this.recentItem.draft.text);
	    },
	    needsBirthdayPlaceholder() {
	      if (!this.isUser) {
	        return false;
	      }
	      return im_v2_lib_recent.RecentManager.needsBirthdayPlaceholder(this.recentItem.dialogId);
	    }
	  },
	  template: `
		<div class="bx-im-list-recent-item__status-icon" :class="'--' + statusIcon"></div>
	`
	};

	// @vue/component
	const RecentItem = {
	  name: 'RecentItem',
	  components: {
	    ChatAvatar: im_v2_component_elements_avatar.ChatAvatar,
	    ChatTitle: im_v2_component_elements_chatTitle.ChatTitle,
	    MessageText,
	    MessageStatus,
	    ItemCounters,
	    InputActionIndicator: im_v2_component_list_items_elements_inputActionIndicator.InputActionIndicator
	  },
	  props: {
	    item: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
	    recentItem() {
	      return this.item;
	    },
	    dialog() {
	      return this.$store.getters['chats/get'](this.recentItem.dialogId, true);
	    },
	    layout() {
	      return this.$store.getters['application/getLayout'];
	    },
	    message() {
	      return this.$store.getters['recent/getMessage'](this.recentItem.dialogId);
	    },
	    chatCounter() {
	      return this.$store.getters['counters/getCounterByChatId'](this.dialog.chatId);
	    },
	    formattedDate() {
	      if (this.needsBirthdayPlaceholder) {
	        return this.loc('IM_LIST_RECENT_BIRTHDAY_DATE');
	      }
	      return this.formatDate(this.itemDate);
	    },
	    formattedCounter() {
	      return im_v2_lib_counter.CounterManager.formatCounter(this.chatCounter);
	    },
	    itemDate() {
	      return im_v2_lib_recent.RecentManager.getSortDate(this.recentItem.dialogId);
	    },
	    isUser() {
	      return this.dialog.type === im_v2_const.ChatType.user;
	    },
	    isChat() {
	      return !this.isUser;
	    },
	    isChannel() {
	      return im_v2_lib_channel.ChannelManager.isChannel(this.recentItem.dialogId);
	    },
	    isSelfChat() {
	      return this.$store.getters['chats/isSelfChat'](this.recentItem.dialogId);
	    },
	    avatarType() {
	      return this.isSelfChat ? im_v2_component_elements_avatar.ChatAvatarType.selfChat : '';
	    },
	    chatType() {
	      return this.isSelfChat ? im_v2_component_elements_chatTitle.ChatTitleType.selfChat : '';
	    },
	    isChatSelected() {
	      const canBeSelected = [im_v2_const.Layout.chat, im_v2_const.Layout.updateChat, im_v2_const.Layout.collab, im_v2_const.Layout.copilot, im_v2_const.Layout.taskComments];
	      if (!canBeSelected.includes(this.layout.name)) {
	        return false;
	      }
	      return this.layout.entityId === this.recentItem.dialogId;
	    },
	    hasActiveInputAction() {
	      return this.$store.getters['chats/inputActions/isChatActive'](this.recentItem.dialogId);
	    },
	    needsBirthdayPlaceholder() {
	      return im_v2_lib_recent.RecentManager.needsBirthdayPlaceholder(this.recentItem.dialogId);
	    },
	    showLastMessage() {
	      return this.$store.getters['application/settings/get'](im_v2_const.Settings.recent.showLastMessage);
	    },
	    invitation() {
	      return this.recentItem.invitation;
	    },
	    wrapClasses() {
	      return {
	        '--pinned': this.recentItem.pinned,
	        '--selected': this.isChatSelected
	      };
	    },
	    itemClasses() {
	      return {
	        '--no-text': !this.showLastMessage
	      };
	    }
	  },
	  methods: {
	    formatDate(date) {
	      return im_v2_lib_dateFormatter.DateFormatter.formatByTemplate(date, im_v2_lib_dateFormatter.DateTemplate.recent);
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div :data-id="recentItem.dialogId" :class="wrapClasses" class="bx-im-list-recent-item__wrap">
			<div :class="itemClasses" class="bx-im-list-recent-item__container">
				<div class="bx-im-list-recent-item__avatar_container">
					<div v-if="invitation.isActive" class="bx-im-list-recent-item__avatar_invitation"></div>
					<div v-else class="bx-im-list-recent-item__avatar_content">
						<ChatAvatar 
							:avatarDialogId="recentItem.dialogId" 
							:contextDialogId="recentItem.dialogId" 
							:size="AvatarSize.XL" 
							:withSpecialTypeIcon="!hasActiveInputAction"
							:customType="avatarType"
						/>
						<InputActionIndicator v-if="hasActiveInputAction" />
					</div>
				</div>
				<div class="bx-im-list-recent-item__content_container">
					<div class="bx-im-list-recent-item__content_header">
						<ChatTitle 
							:dialogId="recentItem.dialogId" 
							:withMute="true" 
							:withAutoDelete="true"
							:customType="chatType"
							:showItsYou="false"
						/>
						<div class="bx-im-list-recent-item__date">
							<MessageStatus :item="item" />
							<span>{{ formattedDate }}</span>
						</div>
					</div>
					<div class="bx-im-list-recent-item__content_bottom">
						<MessageText :item="recentItem" />
						<ItemCounters :item="recentItem" :isChatMuted="dialog.isMuted" />
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const RecentUnreadList = {
	  name: 'RecentUnreadList',
	  components: {
	    LoadingState: im_v2_component_elements_listLoadingState.ListLoadingState,
	    RecentItem,
	    RecentEmptyState: im_v2_component_list_items_elements_emptyState.RecentEmptyState
	  },
	  emits: ['chatClick'],
	  data() {
	    return {
	      isLoading: false,
	      isLoadingNextPage: false
	    };
	  },
	  computed: {
	    isEmptyCollection() {
	      return this.preparedItems.length === 0;
	    },
	    preparedItems() {
	      return this.$store.getters['recent/getSortedUnreadCollection']({
	        type: im_v2_const.RecentType.default
	      });
	    },
	    activeCalls() {
	      return this.$store.getters['recent/calls/get'];
	    },
	    pinnedItems() {
	      return this.preparedItems.filter(item => item.pinned === true);
	    },
	    generalItems() {
	      return this.preparedItems.filter(item => item.pinned === false);
	    }
	  },
	  async created() {
	    this.contextMenuManager = new im_v2_lib_menu.RecentMenu({
	      emitter: this.getEmitter()
	    });
	    this.initLikeManager();
	    this.isLoading = true;
	    await this.getUnreadRecentService().loadFirstPage({
	      ignorePreloadedItems: true
	    });
	    this.isLoading = false;
	    void im_v2_lib_draft.DraftManager.getInstance().initDraftHistory();
	  },
	  beforeUnmount() {
	    this.contextMenuManager.destroy();
	    this.destroyLikeManager();
	  },
	  methods: {
	    async onScroll(event) {
	      this.contextMenuManager.close();
	      if (!im_v2_lib_utils.Utils.dom.isOneScreenRemaining(event.target) || !this.getUnreadRecentService().hasMoreItemsToLoad) {
	        return;
	      }
	      this.isLoadingNextPage = true;
	      await this.getUnreadRecentService().loadNextPage();
	      this.isLoadingNextPage = false;
	    },
	    onClick(item) {
	      this.$emit('chatClick', item.dialogId);
	    },
	    onRightClick(item, event) {
	      if (im_v2_lib_utils.Utils.key.isCombination(event, 'Alt+Shift')) {
	        return;
	      }
	      const context = {
	        dialogId: item.dialogId,
	        recentItem: item,
	        compactMode: false
	      };
	      const positionTarget = {
	        left: event.pageX,
	        top: event.pageY
	      };
	      this.contextMenuManager.openMenu(context, positionTarget);
	      event.preventDefault();
	    },
	    initLikeManager() {
	      this.likeManager = new LikeManager();
	      this.likeManager.init();
	    },
	    destroyLikeManager() {
	      this.likeManager.destroy();
	    },
	    getUnreadRecentService() {
	      if (!this.service) {
	        this.service = im_v2_provider_service_recent.UnreadRecentService.getInstance();
	      }
	      return this.service;
	    },
	    getEmitter() {
	      return this.$Bitrix.eventEmitter;
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-list-recent__container">
			<LoadingState v-if="isLoading" />
			<div v-else @scroll="onScroll" class="bx-im-list-recent__scroll-container">
				<RecentEmptyState
					v-if="isEmptyCollection" 
					:title="loc('IM_LIST_UNREAD_RECENT_EMPTY_STATE_TITLE')"
				/>
				<div v-if="pinnedItems.length > 0" class="bx-im-list-recent__pinned_container">
					<RecentItem
						v-for="item in pinnedItems"
						:key="item.dialogId"
						:item="item"
						@click="onClick(item, $event)"
						@click.right="onRightClick(item, $event)"
					/>
				</div>
				<div class="bx-im-list-recent__general_container">
					<RecentItem
						v-for="item in generalItems"
						:key="item.dialogId"
						:item="item"
						@click="onClick(item, $event)"
						@click.right="onRightClick(item, $event)"
					/>
				</div>
				<LoadingState v-if="isLoadingNextPage" />
			</div>
		</div>
	`
	};

	// @vue/component
	const RecentList = {
	  name: 'RecentList',
	  components: {
	    LoadingState: im_v2_component_elements_listLoadingState.ListLoadingState,
	    RecentItem,
	    ActiveCallList,
	    CreateChat,
	    EmptyState
	  },
	  emits: ['chatClick'],
	  data() {
	    return {
	      isLoading: false,
	      isLoadingNextPage: false,
	      listIsScrolled: false,
	      isCreatingChat: false
	    };
	  },
	  computed: {
	    preparedItems() {
	      const collection = this.$store.getters['recent/getSortedCollection']({
	        type: im_v2_const.RecentType.default
	      });
	      return collection.filter(item => im_v2_lib_recent.RecentManager.needToShowItem(item));
	    },
	    activeCalls() {
	      return this.$store.getters['recent/calls/get'];
	    },
	    pinnedItems() {
	      return this.preparedItems.filter(item => item.pinned === true);
	    },
	    generalItems() {
	      return this.preparedItems.filter(item => item.pinned === false);
	    },
	    isEmptyCollection() {
	      return this.preparedItems.length === 0;
	    },
	    firstPageLoaded() {
	      return this.getRecentService().firstPageIsLoaded;
	    }
	  },
	  async created() {
	    this.contextMenuManager = new im_v2_lib_menu.RecentMenu({
	      emitter: this.getEmitter()
	    });
	    this.initBroadcastManager();
	    this.initLikeManager();
	    this.initCreateChatManager();
	    this.isLoading = true;
	    await this.getRecentService().loadFirstPage({
	      ignorePreloadedItems: true
	    });
	    this.isLoading = false;
	    void im_v2_lib_draft.DraftManager.getInstance().initDraftHistory();
	  },
	  beforeUnmount() {
	    this.contextMenuManager.destroy();
	    this.destroyBroadcastManager();
	    this.destroyLikeManager();
	    this.destroyCreateChatManager();
	  },
	  methods: {
	    async onScroll(event) {
	      this.listIsScrolled = event.target.scrollTop > 0;
	      this.contextMenuManager.close();
	      if (!im_v2_lib_utils.Utils.dom.isOneScreenRemaining(event.target) || !this.getRecentService().hasMoreItemsToLoad) {
	        return;
	      }
	      this.isLoadingNextPage = true;
	      await this.getRecentService().loadNextPage();
	      this.isLoadingNextPage = false;
	    },
	    onClick(item) {
	      this.$emit('chatClick', item.dialogId);
	    },
	    onRightClick(item, event) {
	      if (im_v2_lib_utils.Utils.key.isCombination(event, 'Alt+Shift')) {
	        return;
	      }
	      const context = {
	        dialogId: item.dialogId,
	        recentItem: item,
	        compactMode: false
	      };
	      const positionTarget = {
	        left: event.pageX,
	        top: event.pageY
	      };
	      this.contextMenuManager.openMenu(context, positionTarget);
	      event.preventDefault();
	    },
	    onCallClick({
	      item,
	      $event
	    }) {
	      this.onClick(item, $event);
	    },
	    initBroadcastManager() {
	      this.onRecentListUpdate = event => {
	        this.getRecentService().setPreloadedData(event.data);
	      };
	      this.broadcastManager = BroadcastManager.getInstance();
	      this.broadcastManager.subscribe(BroadcastManager.events.recentListUpdate, this.onRecentListUpdate);
	    },
	    destroyBroadcastManager() {
	      this.broadcastManager = BroadcastManager.getInstance();
	      this.broadcastManager.unsubscribe(BroadcastManager.events.recentListUpdate, this.onRecentListUpdate);
	    },
	    initLikeManager() {
	      this.likeManager = new LikeManager();
	      this.likeManager.init();
	    },
	    destroyLikeManager() {
	      this.likeManager.destroy();
	    },
	    initCreateChatManager() {
	      if (im_v2_lib_createChat.CreateChatManager.getInstance().isCreating()) {
	        this.isCreatingChat = true;
	      }
	      this.onCreationStatusChange = event => {
	        this.isCreatingChat = event.getData();
	      };
	      im_v2_lib_createChat.CreateChatManager.getInstance().subscribe(im_v2_lib_createChat.CreateChatManager.events.creationStatusChange, this.onCreationStatusChange);
	    },
	    destroyCreateChatManager() {
	      im_v2_lib_createChat.CreateChatManager.getInstance().unsubscribe(im_v2_lib_createChat.CreateChatManager.events.creationStatusChange, this.onCreationStatusChange);
	    },
	    getRecentService() {
	      if (!this.service) {
	        this.service = im_v2_provider_service_recent.LegacyRecentService.getInstance();
	      }
	      return this.service;
	    },
	    getEmitter() {
	      return this.$Bitrix.eventEmitter;
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-list-recent__container">
			<ActiveCallList :listIsScrolled="listIsScrolled" @onCallClick="onCallClick"/>
			<CreateChat v-if="isCreatingChat" />
			<LoadingState v-if="isLoading && !firstPageLoaded" />
			<div v-else @scroll="onScroll" class="bx-im-list-recent__scroll-container">
				<EmptyState 
					v-if="isEmptyCollection"
				/>
				<div v-if="pinnedItems.length > 0" class="bx-im-list-recent__pinned_container">
					<RecentItem
						v-for="item in pinnedItems"
						:key="item.dialogId"
						:item="item"
						@click="onClick(item, $event)"
						@click.right="onRightClick(item, $event)"
					/>
				</div>
				<div class="bx-im-list-recent__general_container">
					<RecentItem
						v-for="item in generalItems"
						:key="item.dialogId"
						:item="item"
						@click="onClick(item, $event)"
						@click.right="onRightClick(item, $event)"
					/>
				</div>	
				<LoadingState v-if="isLoadingNextPage" />
			</div>
		</div>
	`
	};

	exports.RecentList = RecentList;
	exports.RecentItem = RecentItem;
	exports.RecentUnreadList = RecentUnreadList;

}((this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}),BX?.Call?.Component??{},BX?.Event??{},BX?.UI?.IconSet??{},BX?.Messenger?.v2?.Lib??{},BX?.Messenger?.v2?.Lib??{},BX?.Messenger?.v2?.Component?.Elements??{},BX?.Messenger?.v2?.Lib??{},BX?.Messenger?.v2?.Lib??{},BX?.Messenger?.v2?.Component?.List??{},BX?.Messenger?.v2?.Component?.Elements??{},BX?.Messenger?.v2?.Lib??{},BX?.Messenger?.v2?.Lib??{},BX??{},BX?.Main??{},BX?.Messenger?.v2?.Lib??{},BX?.Messenger?.v2?.Component?.Elements??{},BX?.Messenger?.v2?.Lib??{},BX?.Messenger?.v2?.Application??{},BX?.Messenger?.v2?.Lib??{},BX?.Messenger?.v2?.Component?.Elements??{},BX?.Messenger?.v2?.Component?.List??{},BX?.Messenger?.v2?.Const??{},BX?.Messenger?.v2?.Lib??{},BX?.Messenger?.v2?.Lib??{},BX?.Messenger?.v2?.Lib??{},BX?.Messenger?.v2?.Model??{},BX?.Messenger?.v2?.Service??{}));
//# sourceMappingURL=recent-list.bundle.js.map
