/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_date, im_v2_component_elements_avatar, im_v2_component_elements_chatTitle, im_v2_component_elements_entityLink, im_v2_component_list_items_elements_inputActionIndicator, im_v2_const, im_v2_css_classes, im_v2_lib_dateFormatter, im_v2_lib_feature, im_v2_lib_recent, im_v2_lib_layout, im_v2_lib_permission, ui_cnt, ui_vue3_components_counter, im_v2_lib_counter, im_v2_application_core, ui_iconSet_api_vue, ui_iconSet_outline, main_core, im_v2_lib_utils, im_v2_lib_parser, ui_vue3_components_richLoc, im_v2_component_elements_listLoadingState, im_v2_component_animation, ui_vue3, im_v2_lib_a11y) {
	'use strict';

	// @vue/component
	const AvatarCounter = {
		name: 'AvatarCounter',
		components: {
			BCounter: ui_vue3_components_counter.Counter
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			isChatMuted: {
				type: Boolean,
				default: false
			},
			isSelected: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				CounterSize: ui_cnt.CounterSize
			};
		},
		computed: {
			recentItem() {
				return this.item;
			},
			dialog() {
				return this.$store.getters['chats/get'](this.recentItem.dialogId, true);
			},
			chatCounter() {
				return this.$store.getters['counters/getCounterByChatId'](this.dialog.chatId);
			},
			childrenCounter() {
				return this.$store.getters['counters/getChildrenTotalCounter'](this.dialog.chatId);
			},
			totalCounter() {
				return this.chatCounter + this.childrenCounter;
			},
			formattedCounter() {
				return im_v2_lib_counter.CounterManager.formatCounter(this.totalCounter);
			},
			maxCounterValue() {
				return im_v2_lib_counter.CounterManager.getCounterDisplayLimit() - 1;
			},
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			counterStyle() {
				if (this.isSelected) {
					return ui_cnt.CounterStyle.FILLED_INVERTED;
				}
				if (this.isChatMuted) {
					return ui_cnt.CounterStyle.FILLED_NO_ACCENT;
				}
				if (this.chatCounter === 0 && this.childrenCounter > 0) {
					return ui_cnt.CounterStyle.FILLED_SUCCESS;
				}
				return ui_cnt.CounterStyle.FILLED;
			},
			isChatMarkedUnread() {
				return this.$store.getters['counters/getUnreadStatus'](this.dialog.chatId);
			},
			showBadge() {
				return this.totalCounter > 0 || this.isChatMarkedUnread;
			},
			showUnreadWithoutCounter() {
				return this.isChatMarkedUnread && this.totalCounter === 0;
			},
			showUnreadWithCounter() {
				return this.isChatMarkedUnread && this.totalCounter > 0;
			},
			counterClasses() {
				return {
					'--muted': this.isChatMuted,
					'--no-counter': this.showUnreadWithoutCounter,
					'--with-unread': this.showUnreadWithCounter,
					'--air-counter': this.isAirDesignEnabled && this.totalCounter > 0
				};
			}
		},
		template: `
		<div
			v-if="showBadge"
			:class="counterClasses"
			class="bx-im-list-recent-item__avatar_counter"
		>
			<BCounter
				v-if="isAirDesignEnabled && totalCounter > 0"
				:value="totalCounter"
				:maxValue="maxCounterValue"
				:style="counterStyle"
				:size="CounterSize.LARGE"
			/>
			<span v-else-if="totalCounter > 0">{{ formattedCounter }}</span>
		</div>
	`
	};

	// @vue/component
	const ItemCounters = {
		name: 'ItemCounters',
		components: {
			BCounter: ui_vue3_components_counter.Counter
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			isChatMuted: {
				type: Boolean,
				required: true
			},
			isSelected: {
				type: Boolean,
				default: false
			},
			withPinStatus: {
				type: Boolean,
				default: true
			},
			withChildrenCounter: {
				type: Boolean,
				default: true
			},
			withCounter: {
				type: Boolean,
				default: true
			},
			compactMode: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				CounterSize: ui_cnt.CounterSize
			};
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
				if (!this.withChildrenCounter) {
					return 0;
				}
				return this.$store.getters['counters/getChildrenTotalCounter'](this.dialog.chatId);
			},
			formattedCounter() {
				return this.formatCounter(this.totalCounter);
			},
			maxCounterValue() {
				return im_v2_lib_counter.CounterManager.getCounterDisplayLimit() - 1;
			},
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			isChildrenOnly() {
				return this.chatCounter === 0 && this.childrenCounter > 0;
			},
			hasChildrenLayer() {
				return this.chatCounter > 0 && this.childrenCounter > 0;
			},
			counterStyle() {
				if (this.isSelected) {
					return ui_cnt.CounterStyle.FILLED_INVERTED;
				}
				if (this.isChatMuted) {
					return ui_cnt.CounterStyle.FILLED_NO_ACCENT;
				}
				if (this.isChildrenOnly) {
					return ui_cnt.CounterStyle.FILLED_SUCCESS;
				}
				return ui_cnt.CounterStyle.FILLED;
			},
			canShowCounters() {
				return this.withCounter && !this.invitation.isActive;
			},
			showCounterContainer() {
				const hasVisibleCounter = this.showMention || this.isChatMarkedUnread || this.showCounter;
				return this.canShowCounters && (!this.compactMode || hasVisibleCounter);
			},
			showPinnedIcon() {
				if (!this.withPinStatus) {
					return false;
				}
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
				// eslint-disable-next-line sonarjs/prefer-single-boolean-return
				if (isSingleMessageWithMention) {
					return false;
				}
				return true;
			},
			containerClasses() {
				const withMentionAndCounter = this.chatCounter > 0 && this.showMention;
				return {
					'--muted': this.isChatMuted,
					'--children-only': this.isChildrenOnly,
					'--with-children': this.hasChildrenLayer,
					'--with-mention-and-counter': withMentionAndCounter,
					'--compact': this.compactMode
				};
			}
		},
		methods: {
			formatCounter(counter) {
				return im_v2_lib_counter.CounterManager.formatCounter(counter);
			}
		},
		template: `
		<div
			v-if="showCounterContainer || compactMode"
			:class="containerClasses"
			class="bx-im-list-recent-item__counters_wrap"
		>
			<div v-if="showCounterContainer" class="bx-im-list-recent-item__counters_container">
				<div v-if="showPinnedIcon" class="bx-im-list-recent-item__pinned-icon"></div>
				<div v-else class="bx-im-list-recent-item__counters">
					<div v-if="showMention" class="bx-im-list-recent-item__mention">
						<div class="bx-im-list-recent-item__mention-icon"></div>
					</div>
					<div v-if="showUnreadWithoutCounter" class="bx-im-list-recent-item__counter_number --no-counter"></div>
					<div
						v-else-if="showUnreadWithCounter || showCounter"
						class="bx-im-list-recent-item__counter_number"
						:class="{ '--with-unread': showUnreadWithCounter, '--air-counter': isAirDesignEnabled }"
					>
						<BCounter
							v-if="isAirDesignEnabled"
							:value="totalCounter"
							:maxValue="maxCounterValue"
							:style="counterStyle"
							:size="CounterSize.LARGE"
						/>
						<template v-else>{{ formattedCounter }}</template>
					</div>
				</div>
			</div>
			<slot/>
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
	const AirIconName = {
		[StatusIcon.sending]: ui_iconSet_api_vue.Outline.CLOCK,
		[StatusIcon.sent]: ui_iconSet_api_vue.Outline.CHECK_M,
		[StatusIcon.viewed]: ui_iconSet_api_vue.Outline.DOUBLE_CHECK
	};

	// @vue/component
	const MessageStatus = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			isSelected: {
				type: Boolean,
				default: false
			},
			isDraftActive: {
				type: Boolean,
				default: false
			}
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
				if (!this.isLastMessageAuthor || this.needsBirthdayPlaceholder || this.isDraftActive) {
					return StatusIcon.none;
				}
				return this.messageStatus;
			},
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			showAirIcon() {
				return this.isAirDesignEnabled && AirIconName[this.statusIcon] !== undefined;
			},
			airIconName() {
				return AirIconName[this.statusIcon] ?? '';
			},
			isLastMessageAuthor() {
				return this.message?.authorId === im_v2_application_core.Core.getUserId();
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
			needsBirthdayPlaceholder() {
				if (!this.isUser) {
					return false;
				}
				return im_v2_lib_recent.RecentManager.needsBirthdayPlaceholder(this.recentItem.dialogId);
			}
		},
		template: `
		<BIcon
			v-if="showAirIcon"
			:name="airIconName"
			class="bx-im-list-recent-item__status-icon --air"
			:class="{ '--accent': statusIcon === 'viewed', '--selected': isSelected }"
		/>
		<div v-else class="bx-im-list-recent-item__status-icon" :class="'--' + statusIcon"></div>
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
				return this.loc('IM_LIST_ITEMS_MESSAGE_DRAFT_MSGVER_3', {
					'#TEXT#': this.purifiedDraftText
				});
			},
			purifiedDraftText() {
				return im_v2_lib_parser.Parser.purify({
					text: this.draftText
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
		<span class="bx-im-list-recent-item__balloon_container --invitation" data-testid="im-recent-item-invitation-balloon">
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
		<span
			class="bx-im-list-recent-item__balloon_container --birthday"
			:title="loc('IM_LIST_RECENT_BIRTHDAY')"
			data-testid="im-recent-item-birthday-balloon"
		>
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
		[im_v2_const.ChatType.openChannel]: main_core.Loc.getMessage('IM_LIST_ITEMS_CHAT_TYPE_OPEN_CHANNEL'),
		[im_v2_const.ChatType.channel]: main_core.Loc.getMessage('IM_LIST_ITEMS_CHAT_TYPE_PRIVATE_CHANNEL'),
		[im_v2_const.ChatType.generalChannel]: main_core.Loc.getMessage('IM_LIST_ITEMS_CHAT_TYPE_OPEN_CHANNEL'),
		[im_v2_const.ChatType.taskComments]: main_core.Loc.getMessage('IM_LIST_ITEMS_CHAT_TYPE_TASK_COMMENTS'),
		default: main_core.Loc.getMessage('IM_LIST_ITEMS_CHAT_TYPE_GROUP_V2')
	};

	// @vue/component
	const MessageText = {
		name: 'MessageText',
		components: {
			MessageAvatar: im_v2_component_elements_avatar.MessageAvatar,
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar,
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
			isDraftActive: {
				type: Boolean,
				default: false
			},
			forceOwnMessage: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			recentItem() {
				return this.item;
			},
			recentItemForPreview() {
				if (this.message?.id && this.message.id !== this.recentItem.messageId) {
					return {
						...this.recentItem,
						messageId: this.message.id
					};
				}
				return this.recentItem;
			},
			dialog() {
				return this.$store.getters['chats/get'](this.recentItem.dialogId, true);
			},
			user() {
				return this.$store.getters['users/get'](this.recentItem.dialogId, true);
			},
			message() {
				if (this.forceOwnMessage && this.recentItem.ownMessageId > 0) {
					const ownMessage = this.$store.getters['recent/getOwnMessage'](this.recentItem.dialogId);
					if (ownMessage) {
						return ownMessage;
					}
				}
				return this.$store.getters['recent/getMessage'](this.recentItem.dialogId);
			},
			shownChatId() {
				return this.$store.getters['recent/getShownChatId'](this.recentItem.dialogId);
			},
			isNestedPreviewSource() {
				if (this.forceOwnMessage || !this.isNestedPreviewAvailable) {
					return false;
				}
				if (!this.shownChatId || !this.dialog.chatId) {
					return false;
				}
				return this.shownChatId !== this.dialog.chatId;
			},
			previewSourceChat() {
				if (!this.isNestedPreviewSource) {
					return null;
				}
				return this.$store.getters['chats/getByChatId'](this.shownChatId) ?? null;
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
				if (this.isSelfChat) {
					return this.loc('IM_LIST_RECENT_CHAT_SELF_SUBTITLE');
				}
				if (this.isUser) {
					return this.$store.getters['users/getPosition'](this.recentItem.dialogId);
				}
				return HiddenTitleByChatType[this.dialog.type] ?? HiddenTitleByChatType.default;
			},
			isNestedPreviewAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCollabPreviewSourceEnabled);
			},
			isLastMessageAuthor() {
				return this.showLastMessage && this.message.authorId === im_v2_application_core.Core.getUserId();
			},
			canShowAuthorAvatar() {
				return Boolean(this.message);
			},
			messageText() {
				if (!this.message) {
					return this.hiddenMessageText;
				}
				if (this.message?.isDeleted) {
					return this.loc('IM_LIST_RECENT_DELETED_MESSAGE');
				}
				const isContactMessage = this.message.componentId === im_v2_const.MessageComponent.contactMessage;
				const formattedText = isContactMessage ? `${this.loc('IM_LIST_RECENT_CONTACT')} ${im_v2_lib_parser.Parser.purifyText(this.message.text)}`.trim() : im_v2_lib_parser.Parser.purifyRecent(this.recentItemForPreview);
				if (!this.showLastMessage || !formattedText) {
					return this.hiddenMessageText;
				}
				return formattedText;
			},
			formattedMessageText() {
				const SPLIT_INDEX = 27;
				return im_v2_lib_utils.Utils.text.insertUnseenWhitespace(this.messageText, SPLIT_INDEX);
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
				<MessageDraft v-if="isDraftActive" :draftText="recentItem.draft.text" />
				<InvitationPlaceholder v-else-if="needsInvitationPlaceholder" />
				<BirthdayPlaceholder v-else-if="needsBirthdayPlaceholder" />
				<VacationPlaceholder v-else-if="needsVacationPlaceholder" :vacationDate="user.absent" />
				<template v-else>
					<template v-if="isNestedPreviewSource && previewSourceChat">
						<ChatAvatar
							:avatarDialogId="previewSourceChat.dialogId"
							:contextDialogId="previewSourceChat.dialogId"
							:size="AvatarSize.XXS"
							:withTooltip="false"
							class="bx-im-list-recent-item__author-avatar"
							data-testid="recent-item-preview-source-avatar"
						/>
						<span
							class="bx-im-list-recent-item__preview-source-name"
							data-testid="recent-item-preview-source-name"
						>
							{{ previewSourceChat.name }}:
						</span>
					</template>
					<template v-else-if="canShowAuthorAvatar">
						<span v-if="isLastMessageAuthor" class="bx-im-list-recent-item__self_author-icon"></span>
						<MessageAvatar
							v-else-if="isChat && message.authorId"
							:messageId="message.id"
							:authorId="message.authorId"
							:size="AvatarSize.XXS"
							class="bx-im-list-recent-item__author-avatar"
						/>
					</template>
					<span>{{ formattedMessageText }}</span>
				</template>
			</span>
		</div>
	`
	};

	// @vue/component
	const BaseRecentItem = {
		name: 'BaseRecentItem',
		components: {
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar,
			ChatTitle: im_v2_component_elements_chatTitle.ChatTitle,
			MessageText,
			MessageStatus,
			AvatarCounter,
			ItemCounters,
			InputActionIndicator: im_v2_component_list_items_elements_inputActionIndicator.InputActionIndicator,
			EntityLink: im_v2_component_elements_entityLink.EntityLink
		},
		inject: {
			avatarsOnly: {
				default: false
			}
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			withCounter: {
				type: Boolean,
				default: true
			},
			withChildrenCounter: {
				type: Boolean,
				default: true
			},
			withMessageStatus: {
				type: Boolean,
				default: true
			},
			withPinStatus: {
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
			},
			forceOwnMessage: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			EntityLinkAppearance: () => im_v2_component_elements_entityLink.EntityLinkAppearance,
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
			accessibleName() {
				// Explicit accessible name = chat title only, so the screen reader announces the
				// chat instead of reading the whole row (unread counter, indicators, preview).
				if (this.isSelfChat) {
					return this.loc('IM_CHAT_TITLE_MY_NOTES');
				}
				if (this.dialog.type === im_v2_const.ChatType.user) {
					return this.$store.getters['users/get'](this.recentItem.dialogId, true).name;
				}
				return this.dialog.name;
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
			canSend() {
				if (this.dialog.isTextareaEnabled === false) {
					return false;
				}
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.send, this.dialog.dialogId);
			},
			isDraftActive() {
				return this.withDraft && this.canSend && Boolean(this.recentItem.draft.text);
			},
			invitation() {
				return this.recentItem.invitation;
			},
			showEntityLink() {
				const isAvailable = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isVibecodeAppOpenButtonAvailable);
				const isApplicationChat = this.dialog.entityLink?.type === im_v2_const.ChatEntityLinkType.vibecodeApp;
				return isAvailable && !this.avatarsOnly && isApplicationChat && im_v2_component_elements_entityLink.hasEntityLink(this.dialog);
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
				// у элемента может не быть даты вовсе (например, канал без сообщений и активности)
				if (!date) {
					return '';
				}
				return im_v2_lib_dateFormatter.DateFormatter.formatByTemplate(date, im_v2_lib_dateFormatter.DateTemplate.recent);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div
			:data-id="recentItem.dialogId"
			:data-testid="'im-recent-item-' + recentItem.dialogId"
			:class="wrapClasses"
			class="bx-im-list-recent-item__wrap --focus-visible"
			role="button"
			tabindex="-1"
			:aria-current="isChatSelected"
			:aria-label="accessibleName"
		>
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
					<AvatarCounter
						v-if="avatarsOnly"
						:item="recentItem"
						:isChatMuted="dialog.isMuted"
						:isSelected="isChatSelected"
					/>
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
							<MessageStatus 
								v-if="withMessageStatus" 
								:item="item" 
								:isDraftActive="isDraftActive" 
								:isSelected="isChatSelected" 
							/>
							<span>{{ formattedDate }}</span>
						</div>
					</div>
					<div class="bx-im-list-recent-item__content_bottom">
						<MessageText
							:item="recentItem"
							:isDraftActive="isDraftActive"
							:forceOwnMessage="forceOwnMessage"
						/>
						<ItemCounters
							v-if="withCounter || showEntityLink"
							:withCounter="withCounter"
							:compactMode="showEntityLink"
							:withPinStatus="withPinStatus && !showEntityLink"
							:withChildrenCounter="withChildrenCounter"
							:item="recentItem"
							:isChatMuted="dialog.isMuted"
							:isSelected="isChatSelected"
						>
							<template #default>
								<EntityLink
									v-if="showEntityLink"
									:dialogId="recentItem.dialogId"
									:appearance="EntityLinkAppearance.button"
									:withEntityName="false"
								/>
							</template>
						</ItemCounters>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const FixedItemContainer = {
		name: 'FixedItemContainer',
		template: `
		<div class="bx-im-list-base__fixed_container">
			<slot></slot>
		</div>
	`
	};

	const CREATE_CHAT_DRAFT_SELECTOR = '.bx-im-list-recent-create-chat__container';

	// Only the rows rove: the create-chat draft keeps its own Tab stops
	const isListRow = element => {
		return element.matches('[data-id]') && !element.closest(CREATE_CHAT_DRAFT_SELECTOR);
	};

	// @vue/component
	// The scroll area of a list and the roving focus over its rows: one Tab stop, arrows and Home/End walk
	// the rows. The zone binds to the root node for life, so it lives and dies with this component.
	// In the compact collab peek (avatarsOnly) the list is a mouse-only avatar strip beside the nested
	// drawer: the zone is off and the container itself leaves the tab order and the accessibility tree.
	const KeyboardNavigation = {
		name: 'KeyboardNavigation',
		inject: {
			avatarsOnly: {
				default: false
			}
		},
		watch: {
			avatarsOnly: 'syncFocusZone'
		},
		created() {
			this.focusZone = null;
		},
		mounted() {
			this.focusZone = ui_vue3.markRaw(im_v2_lib_a11y.createListFocusZone(this.$el, {
				focusableElementFilter: isListRow
			}));
			this.syncFocusZone();
		},
		activated() {
			this.syncFocusZone();
		},
		deactivated() {
			this.focusZone.deactivate();
		},
		beforeUnmount() {
			this.focusZone.deactivate();
		},
		methods: {
			syncFocusZone() {
				if (this.avatarsOnly) {
					this.focusZone.deactivate();
					return;
				}
				this.focusZone.activate();
			},
			// The fade around the container holds the rows at opacity 0 while activate() collects them
			refreshFocusZone() {
				this.focusZone.refreshElements();
			}
		},
		template: `
		<div :tabindex="avatarsOnly ? -1 : null" :aria-hidden="avatarsOnly ? 'true' : null" class="bx-im-list-base__scroll-container">
			<slot></slot>
		</div>
	`
	};

	// @vue/component
	const BaseRecentList = {
		name: 'BaseRecentList',
		components: {
			LoadingState: im_v2_component_elements_listLoadingState.ListLoadingState,
			BaseRecentItem,
			FixedItemContainer,
			KeyboardNavigation,
			FadeAnimation: im_v2_component_animation.FadeAnimation
		},
		props: {
			collection: {
				type: Array,
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
			},
			// Owner of the row context menu; Shift+F10 / ContextMenu open it right from here, anchored
			// to the focused row with focus returned on close. Hosts pass a markRaw-ed instance
			// (a class must not become reactive).
			contextMenuManager: {
				/** @type ?BaseMenu */
				type: Object,
				default: null
			}
		},
		emits: ['listScroll', 'loadNextPage', 'selectChat', 'itemRightClick', 'closeMenu'],
		computed: {
			preparedItems() {
				return this.collection.filter(item => im_v2_lib_recent.RecentManager.needToShowItem(item));
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
			onRowKeydown(event) {
				const isOpenKey = event.key === 'Enter' || event.key === ' ';
				const isContextMenuKey = im_v2_lib_utils.Utils.key.isCombination(event, im_v2_const.HotkeyCombination.list.contextMenu);
				if (!isOpenKey && !isContextMenuKey) {
					return;
				}
				const row = event.target?.closest?.('[data-id]');
				const item = this.preparedItems.find(current => {
					return String(current.dialogId) === row?.dataset.id;
				});
				if (!item) {
					return;
				}
				event.preventDefault();
				if (isContextMenuKey) {
					// Open the menu anchored to the focused row (keyboard path); the manager returns
					// focus to the row on close.
					this.contextMenuManager?.openMenuFromKeyboard({
						dialogId: item.dialogId,
						recentItem: item
					}, row);
					return;
				}
				this.onClick(item);
			},
			onListShown() {
				this.$refs.keyboardNavigation?.refreshFocusZone();
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-list-base__container">
			<slot name="before-scroll"></slot>
			<LoadingState v-if="showMainLoader" />
			<FadeAnimation :duration="200" @afterEnter="onListShown">
				<KeyboardNavigation v-if="!showMainLoader" ref="keyboardNavigation" @scroll="onScroll" @keydown="onRowKeydown">
					<slot name="before-list"></slot>
					<slot v-if="isEmptyCollection" name="empty-state" />
					<FixedItemContainer v-if="showPinnedItems" class="bx-im-list-base__pinned_container">
						<template v-for="item in pinnedItems" :key="item.dialogId">
							<slot name="item" :item="item" :onClick="onClick" :onRightClick="onRightClick">
								<BaseRecentItem
									:item="item"
									@click="onClick(item)"
									@click.right="onRightClick(item, $event)"
								/>
							</slot>
						</template>
					</FixedItemContainer>
					<div class="bx-im-list-base__general_container">
						<template v-for="item in generalItems" :key="item.dialogId">
							<slot name="item" :item="item" :onClick="onClick" :onRightClick="onRightClick">
								<BaseRecentItem
									:item="item"
									@click="onClick(item)"
									@click.right="onRightClick(item, $event)"
								/>
							</slot>
						</template>
					</div>
					<LoadingState v-if="showBottomLoader" />
				</KeyboardNavigation>
			</FadeAnimation>
		</div>
	`
	};

	exports.BaseRecentItem = BaseRecentItem;
	exports.BaseRecentList = BaseRecentList;
	exports.FixedItemContainer = FixedItemContainer;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.Main, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.List, BX.Messenger.v2.Const, BX.Messenger.v2.Css, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.UI, BX.UI.Vue3.Components, BX.Messenger.v2.Lib, BX.Messenger.v2.Application, BX.UI.IconSet, window, BX, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.UI.Vue3.Components, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Animation, BX.Vue3, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
