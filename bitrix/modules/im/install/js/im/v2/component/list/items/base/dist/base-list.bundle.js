/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,im_v2_component_elements_listLoadingState,im_v2_component_elements_chatTitle,im_v2_component_list_items_elements_inputActionIndicator,im_v2_lib_dateFormatter,im_v2_lib_layout,im_v2_lib_counter,main_core,im_v2_application_core,im_v2_const,im_v2_lib_utils,im_v2_lib_recent,im_v2_component_elements_avatar,ui_vue3_components_richLoc,im_v2_lib_parser,main_date,recentItem) {
	'use strict';

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
	const MessageDraft = {
	  name: 'MessageDraft',
	  components: {
	    RichLoc: ui_vue3_components_richLoc.RichLoc
	  },
	  props: {
	    draftText: {
	      type: String,
	      required: true
	    }
	  },
	  computed: {
	    preparedDraftText() {
	      return this.loc('IM_LIST_RECENT_MESSAGE_DRAFT_MSGVER_3', {
	        '#TEXT#': this.purifiedDraftText
	      });
	    },
	    purifiedDraftText() {
	      return im_v2_lib_parser.Parser.purify({
	        text: this.draftText,
	        showIconIfEmptyText: false
	      });
	    }
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    }
	  },
	  template: `
		<RichLoc :text="preparedDraftText" tag="span" placeholder="[highlight]">
			<template #highlight="{ text }">
				<span class="bx-im-list-recent-item__message_draft-prefix">
					{{ text }}
				</span>
			</template>
		</RichLoc>
	`
	};

	// @vue/component
	const InvitationPlaceholder = {
	  name: 'InvitationPlaceholder',
	  methods: {
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<span class="bx-im-list-recent-item__balloon_container --invitation">
			<span class="bx-im-list-recent-item__balloon">
				{{ loc('IM_LIST_RECENT_INVITATION_NOT_ACCEPTED_MSGVER_1') }}
			</span>
		</span>
	`
	};

	// @vue/component
	const BirthdayPlaceholder = {
	  name: 'BirthdayPlaceholder',
	  methods: {
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<span class="bx-im-list-recent-item__balloon_container --birthday" :title="loc('IM_LIST_RECENT_BIRTHDAY')">
			<span class="bx-im-list-recent-item__balloon">
				{{ loc('IM_LIST_RECENT_BIRTHDAY') }}
			</span>
		</span>
	`
	};

	// @vue/component
	const VacationPlaceholder = {
	  name: 'VacationPlaceholder',
	  props: {
	    vacationDate: {
	      type: Date,
	      required: true
	    }
	  },
	  computed: {
	    preparedVacationText() {
	      return this.loc('IM_LIST_RECENT_VACATION', {
	        '#VACATION_END_DATE#': this.formattedVacationEndDate
	      });
	    },
	    formattedVacationEndDate() {
	      return main_date.DateTimeFormat.format('d.m.Y', this.vacationDate);
	    }
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    }
	  },
	  template: `
		<span class="bx-im-list-recent-item__balloon_container --vacation">
			<span class="bx-im-list-recent-item__balloon">
				{{ preparedVacationText }}
			</span>
		</span>
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
	    MessageAvatar: im_v2_component_elements_avatar.MessageAvatar,
	    MessageDraft,
	    InvitationPlaceholder,
	    BirthdayPlaceholder,
	    VacationPlaceholder
	  },
	  props: {
	    item: {
	      type: Object,
	      required: true
	    },
	    withDraft: {
	      type: Boolean,
	      default: true
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
	    needsInvitationPlaceholder() {
	      return this.recentItem.invitation.isActive;
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
	    hiddenMessageText() {
	      var _HiddenTitleByChatTyp;
	      if (this.isSelfChat) {
	        return this.loc('IM_LIST_RECENT_CHAT_SELF_SUBTITLE');
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
	    showDraft() {
	      return this.withDraft && this.recentItem.draft.text;
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
				<MessageDraft v-if="showDraft" :draftText="recentItem.draft.text" />
				<InvitationPlaceholder v-else-if="needsInvitationPlaceholder" />
				<BirthdayPlaceholder v-else-if="needsBirthdayPlaceholder" />
				<VacationPlaceholder v-else-if="needsVacationPlaceholder" :vacationDate="user.absent" />
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
	    },
	    withCounters: {
	      type: Boolean,
	      default: true
	    },
	    withMessageStatus: {
	      type: Boolean,
	      default: true
	    },
	    withInputIndicator: {
	      type: Boolean,
	      default: true
	    },
	    withDraft: {
	      type: Boolean,
	      default: true
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
	    formattedDate() {
	      if (this.needsBirthdayPlaceholder) {
	        return this.loc('IM_LIST_RECENT_BIRTHDAY_DATE');
	      }
	      return this.formatDate(this.itemDate);
	    },
	    itemDate() {
	      return im_v2_lib_recent.RecentManager.getSortDate(this.recentItem.dialogId);
	    },
	    isSelfChat() {
	      return this.$store.getters['chats/isSelfChat'](this.recentItem.dialogId);
	    },
	    avatarType() {
	      return this.isSelfChat ? im_v2_component_elements_avatar.ChatAvatarType.selfChat : '';
	    },
	    chatTitleType() {
	      return this.isSelfChat ? im_v2_component_elements_chatTitle.ChatTitleType.selfChat : '';
	    },
	    isChatSelected() {
	      const isChatLayout = im_v2_lib_layout.LayoutManager.getInstance().isChatLayout(this.layout.name);
	      const isUpdateChatLayout = this.layout.name === im_v2_const.Layout.updateChat;
	      if (!isChatLayout && !isUpdateChatLayout) {
	        return false;
	      }
	      return this.layout.entityId === this.recentItem.dialogId;
	    },
	    hasActiveInputAction() {
	      return this.$store.getters['chats/inputActions/isChatActive'](this.recentItem.dialogId);
	    },
	    showActiveInputAction() {
	      return this.withInputIndicator && this.hasActiveInputAction;
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
	        '--selected': this.isChatSelected,
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
			<div class="bx-im-list-recent-item__container">
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
						<InputActionIndicator v-if="showActiveInputAction" />
					</div>
				</div>
				<div class="bx-im-list-recent-item__content_container">
					<div class="bx-im-list-recent-item__content_header">
						<slot name="title">
							<ChatTitle
								:dialogId="recentItem.dialogId"
								:withMute="true"
								:withAutoDelete="true"
								:customType="chatTitleType"
								:showItsYou="false"
							/>
						</slot>
						<div class="bx-im-list-recent-item__date">
							<MessageStatus v-if="withMessageStatus" :item="item" />
							<span>{{ formattedDate }}</span>
						</div>
					</div>
					<div class="bx-im-list-recent-item__content_bottom">
						<MessageText :item="recentItem" :withDraft="withDraft" />
						<ItemCounters
							v-if="withCounters"
							:item="recentItem"
							:isChatMuted="dialog.isMuted"
						/>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const BaseRecentList = {
	  name: 'BaseRecentList',
	  components: {
	    LoadingState: im_v2_component_elements_listLoadingState.ListLoadingState,
	    RecentItem
	  },
	  props: {
	    recentType: {
	      type: String,
	      required: true
	    },
	    withPinnedItems: {
	      type: Boolean,
	      default: true
	    },
	    showMainLoader: {
	      type: Boolean,
	      default: false
	    },
	    showBottomLoader: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['listScroll', 'loadNextPage', 'selectChat', 'itemRightClick', 'closeMenu'],
	  computed: {
	    preparedItems() {
	      const collection = this.$store.getters['recent/getSortedCollection']({
	        type: this.recentType
	      });
	      return collection.filter(item => im_v2_lib_recent.RecentManager.needToShowItem(item));
	    },
	    pinnedItems() {
	      return this.preparedItems.filter(item => item.pinned === true);
	    },
	    generalItems() {
	      if (!this.withPinnedItems) {
	        return this.preparedItems;
	      }
	      return this.preparedItems.filter(item => item.pinned === false);
	    },
	    isEmptyCollection() {
	      return this.preparedItems.length === 0;
	    },
	    showPinnedItems() {
	      return this.withPinnedItems && this.pinnedItems.length > 0;
	    }
	  },
	  methods: {
	    async onScroll(event) {
	      const listIsScrolled = event.target.scrollTop > 0;
	      this.$emit('listScroll', listIsScrolled);
	      this.$emit('closeMenu');
	      if (!im_v2_lib_utils.Utils.dom.isOneScreenRemaining(event.target)) {
	        return;
	      }
	      this.$emit('loadNextPage');
	    },
	    onClick(item) {
	      this.$emit('selectChat', item.dialogId);
	    },
	    onRightClick(item, event) {
	      this.$emit('itemRightClick', {
	        item,
	        event
	      });
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-list-base__container">
			<slot name="before-list"></slot>
			<LoadingState v-if="showMainLoader" />
			<div v-else @scroll="onScroll" class="bx-im-list-base__scroll-container">
				<slot v-if="isEmptyCollection" name="empty-state" />
				<div v-if="showPinnedItems" class="bx-im-list-base__pinned_container">
					<template v-for="item in pinnedItems" :key="item.dialogId">
						<slot name="item" :item="item" :onClick="onClick" :onRightClick="onRightClick">
							<RecentItem
								:item="item"
								@click="onClick(item)"
								@click.right="onRightClick(item, $event)"
							/>
						</slot>
					</template>
				</div>
				<div class="bx-im-list-base__general_container">
					<template v-for="item in generalItems" :key="item.dialogId">
						<slot name="item" :item="item" :onClick="onClick" :onRightClick="onRightClick">
							<RecentItem
								:item="item"
								@click="onClick(item)"
								@click.right="onRightClick(item, $event)"
							/>
						</slot>
					</template>
				</div>
				<LoadingState v-if="showBottomLoader" />
			</div>
		</div>
	`
	};

	exports.RecentItem = recentItem.RecentItem;
	exports.BaseRecentList = BaseRecentList;

}((this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}),BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Component.List,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX,BX.Messenger.v2.Application,BX.Messenger.v2.Const,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Component.Elements,BX.UI.Vue3.Components,BX.Messenger.v2.Lib,BX.Main,BX));
//# sourceMappingURL=base-list.bundle.js.map
