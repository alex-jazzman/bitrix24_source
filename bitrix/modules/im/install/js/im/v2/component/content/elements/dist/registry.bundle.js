/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_component_animation, im_v2_component_elements_avatar, im_v2_component_elements_loader, im_v2_const, im_v2_lib_permission, im_v2_provider_service_chat, im_v2_component_entitySelector, im_v2_lib_analytics, call_component_callButton, main_core, im_v2_lib_utils, im_v2_component_elements_chatTitle, ui_iconSet_api_vue, main_core_events, ui_vue3, im_v2_component_dialog_chat, im_v2_component_sidebar, im_v2_component_textarea, im_v2_lib_textarea, im_v2_lib_theme, ui_vue3_directives_hint, im_v2_application_core, im_v2_component_elements_button, im_v2_lib_confirm, im_v2_provider_service_message, ui_vue3_components_richLoc, im_v2_lib_copilot, im_v2_lib_feature, im_v2_lib_helpdesk, ui_uploader_core, im_v2_provider_service_uploading) {
	'use strict';

	// @vue/component
	const AddToChatButton = {
		name: 'AddToChatButton',
		components: {
			AddToChat: im_v2_component_entitySelector.AddToChat
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				showInviteButton: false,
				showAddToChatPopup: false
			};
		},
		methods: {
			openAddToChatPopup() {
				im_v2_lib_analytics.Analytics.getInstance().userAdd.onChatHeaderClick(this.dialogId);
				this.showAddToChatPopup = true;
			},
			closeAddToChatPopup() {
				this.showAddToChatPopup = false;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div
			:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_INVITE_POPUP_TITLE')"
			:class="{'--active': showAddToChatPopup}"
			class="bx-im-chat-header__icon --add-people"
			@click="openAddToChatPopup"
			ref="add-members"
		></div>
		<AddToChat
			v-if="showAddToChatPopup"
			:bindElement="$refs['add-members'] ?? {}"
			:dialogId="dialogId"
			:popupConfig="{ offsetTop: 15, offsetLeft: -300 }"
			@close="closeAddToChatPopup"
		/>
	`
	};

	const {
		callInstalled
	} = main_core.Extension.getSettings('im.v2.lib.call');

	// @vue/component
	const CallHeaderButton = {
		name: 'CallHeaderButton',
		props: {
			dialogId: {
				type: String,
				required: true
			},
			compactMode: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			componentToRender() {
				if (!callInstalled) {
					return null;
				}
				return call_component_callButton.CallButton;
			}
		},
		template: `
		<component v-if="componentToRender" :is="componentToRender" :dialog="dialog" :compactMode="compactMode" />
	`
	};

	// @vue/component
	const HeaderAvatar = {
		name: 'HeaderAvatar',
		components: {
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		emits: ['avatarClick'],
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isUser() {
				return this.dialog.type === im_v2_const.ChatType.user;
			},
			canChangeAvatar() {
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.avatar, this.dialogId);
			},
			isSelfChat() {
				return this.$store.getters['chats/isSelfChat'](this.dialogId);
			},
			userLink() {
				return im_v2_lib_utils.Utils.user.getProfileLink(this.dialogId);
			},
			avatarType() {
				return this.isSelfChat ? im_v2_component_elements_avatar.ChatAvatarType.selfChat : '';
			},
			needProfileLink() {
				return this.isUser && !this.isSelfChat;
			}
		},
		methods: {
			onAvatarClick() {
				if (this.isUser || !this.canChangeAvatar) {
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
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			}
		},
		// language=Vue
		template: `
		<div class="bx-im-chat-header__avatar" :class="{'--can-change': canChangeAvatar}" @click="onAvatarClick">
			<a v-if="needProfileLink" :href="userLink" target="_blank">
				<ChatAvatar
					:avatarDialogId="dialogId"
					:contextDialogId="dialogId"
					:size="AvatarSize.L"
				/>
			</a>
			<ChatAvatar v-else :avatarDialogId="dialogId" :contextDialogId="dialogId" :size="AvatarSize.L" :customType="avatarType" />
		</div>
		<input
			type="file"
			accept="image/*"
			class="bx-im-chat-header__avatar_input"
			ref="avatarInput"
			@change="onAvatarSelect"
		>
	`
	};

	// @vue/component
	const SearchButton = {
		name: 'SearchButton',
		inject: ['currentSidebarPanel'],
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		computed: {
			isMessageSearchActive() {
				return this.currentSidebarPanel === im_v2_const.SidebarDetailBlock.messageSearch;
			}
		},
		methods: {
			toggleSearchPanel() {
				if (this.isMessageSearchActive) {
					this.getEmitter().emit(im_v2_const.EventType.sidebar.close, {
						panel: im_v2_const.SidebarDetailBlock.messageSearch
					});
					return;
				}
				this.getEmitter().emit(im_v2_const.EventType.sidebar.open, {
					panel: im_v2_const.SidebarDetailBlock.messageSearch,
					dialogId: this.dialogId
				});
				im_v2_lib_analytics.Analytics.getInstance().messageSearch.onOpenSearchPanel(this.dialogId);
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div
			:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_SEARCH')"
			:class="{'--active': isMessageSearchActive}"
			class="bx-im-chat-header__icon --search"
			@click="toggleSearchPanel"
		></div>
	`
	};

	// @vue/component
	const SidebarButton = {
		name: 'SidebarButton',
		inject: ['currentSidebarPanel'],
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		computed: {
			isSidebarOpened() {
				return main_core.Type.isStringFilled(this.currentSidebarPanel);
			}
		},
		methods: {
			toggleRightPanel() {
				if (this.isSidebarOpened) {
					this.getEmitter().emit(im_v2_const.EventType.sidebar.close, {
						panel: ''
					});
					return;
				}
				this.getEmitter().emit(im_v2_const.EventType.sidebar.open, {
					panel: im_v2_const.SidebarDetailBlock.main,
					dialogId: this.dialogId
				});
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div
			class="bx-im-chat-header__icon --panel"
			:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_SIDEBAR')"
			:class="{'--active': isSidebarOpened}"
			@click="toggleRightPanel"
		></div>
	`
	};

	const ParamsByLinkType = {
		[im_v2_const.ChatEntityLinkType.tasks]: {
			loc: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_TASK')
		},
		[im_v2_const.ChatEntityLinkType.calendar]: {
			loc: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_MEETING_MSGVER_1')
		},
		[im_v2_const.ChatEntityLinkType.sonetGroup]: {
			loc: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_GROUP_MSGVER_1')
		},
		[im_v2_const.ChatEntityLinkType.mail]: {
			loc: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_MAIL_MSGVER_1')
		},
		[im_v2_const.ChatEntityLinkType.contact]: {
			loc: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_CONTACT')
		},
		[im_v2_const.ChatEntityLinkType.deal]: {
			loc: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_DEAL')
		},
		[im_v2_const.ChatEntityLinkType.lead]: {
			loc: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_LEAD')
		},
		[im_v2_const.ChatEntityLinkType.dynamic]: {
			loc: main_core.Loc.getMessage('IM_CONTENT_CHAT_HEADER_OPEN_DYNAMIC_ELEMENT')
		}
	};

	// @vue/component
	const EntityButton = {
		name: 'EntityButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			text: {
				type: String,
				required: true
			},
			url: {
				type: String,
				default: ''
			},
			compactMode: {
				type: Boolean,
				default: false
			}
		},
		emits: ['click'],
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline
		},
		methods: {
			onClick(event) {
				if (!this.url) {
					event.preventDefault();
				}
				this.$emit('click');
			}
		},
		template: `
		<a
			:href="url"
			class="bx-im-chat-header-entity-button__container"
			:class="{'--compact': compactMode}"
			@click="onClick"
		>
			<div class="bx-im-chat-header-entity-button__text --ellipsis">{{ text }}</div>
			<BIcon class="bx-im-chat-header-entity-button__icon" :name="OutlineIcons.CHEVRON_RIGHT_M" />
		</a>
	`
	};

	// @vue/component
	const EntityLink = {
		name: 'EntityLink',
		components: {
			EntityButton
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
			entityType() {
				return this.dialog.entityLink.type;
			},
			entityUrl() {
				return this.dialog.entityLink.url;
			},
			linkText() {
				return ParamsByLinkType[this.entityType]?.loc ?? 'Open entity';
			}
		},
		template: `
		<EntityButton :text="linkText" :url="entityUrl" />
	`
	};

	const UserCounterPhraseCodeByChatType = {
		[im_v2_const.ChatType.openChannel]: 'IM_CONTENT_CHAT_HEADER_CHANNEL_USER_COUNT',
		[im_v2_const.ChatType.channel]: 'IM_CONTENT_CHAT_HEADER_CHANNEL_USER_COUNT',
		[im_v2_const.ChatType.generalChannel]: 'IM_CONTENT_CHAT_HEADER_CHANNEL_USER_COUNT',
		default: 'IM_CONTENT_CHAT_HEADER_USER_COUNT'
	};

	// @vue/component
	const UserCounter = {
		name: 'UserCounter',
		inject: ['currentSidebarPanel', 'withSidebar'],
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
			sidebarTooltipText() {
				return this.withSidebar ? this.loc('IM_CONTENT_CHAT_HEADER_OPEN_MEMBERS') : '';
			},
			isMembersPanelActive() {
				return this.currentSidebarPanel === im_v2_const.SidebarDetailBlock.members;
			},
			needShowSubtitleCursor() {
				return this.withSidebar;
			},
			userCounterPhraseCode() {
				return UserCounterPhraseCodeByChatType[this.dialog.type] ?? UserCounterPhraseCodeByChatType.default;
			},
			userCounterText() {
				return main_core.Loc.getMessagePlural(this.userCounterPhraseCode, this.dialog.userCounter, {
					'#COUNT#': this.dialog.userCounter
				});
			},
			isShowGuestCount() {
				return this.dialog.guestCount > 0 && this.dialog.type === im_v2_const.ChatType.chat;
			},
			guestCounterText() {
				return main_core.Loc.getMessagePlural('IM_CONTENT_CHAT_HEADER_GUEST_COUNT', this.dialog.guestCount, {
					'#COUNT#': this.dialog.guestCount
				});
			}
		},
		methods: {
			onMembersClick() {
				if (this.isMembersPanelActive) {
					this.getEmitter().emit(im_v2_const.EventType.sidebar.close, {
						panel: im_v2_const.SidebarDetailBlock.members
					});
					return;
				}
				this.getEmitter().emit(im_v2_const.EventType.sidebar.open, {
					panel: im_v2_const.SidebarDetailBlock.members,
					dialogId: this.dialogId
				});
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div
			:title="sidebarTooltipText"
			@click="onMembersClick"
			class="bx-im-chat-header__subtitle_content"
			:class="{'--click': needShowSubtitleCursor}"
		>
			{{ userCounterText }}
			<span v-if="isShowGuestCount" class="bx-im-chat-header__guest-counter">
				{{ guestCounterText }}
			</span>
		</div>
	`
	};

	// @vue/component
	const GroupChatTitle = {
		name: 'GroupChatTitle',
		components: {
			EditableChatTitle: im_v2_component_elements_chatTitle.EditableChatTitle,
			EntityLink,
			LineLoader: im_v2_component_elements_loader.LineLoader,
			FadeAnimation: im_v2_component_animation.FadeAnimation,
			UserCounter
		},
		inject: ['withSidebar'],
		props: {
			dialogId: {
				type: String,
				required: true
			},
			withEntityLink: {
				type: Boolean,
				default: true
			}
		},
		emits: ['newTitle'],
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			hasEntityLink() {
				return this.withEntityLink && Boolean(this.dialog.entityLink?.url);
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
					<UserCounter :dialogId="dialogId" />
					<slot name="after-user-counter">
						<EntityLink v-if="hasEntityLink" :dialogId="dialogId" />
					</slot>
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
			ChatTitle: im_v2_component_elements_chatTitle.ChatTitle
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
					<ChatTitle :dialogId="dialogId" :withAutoDelete="true" :withMute="true" />
				</a>
				<span class="bx-im-chat-header__user-status">{{ userLastOnlineText }}</span>
			</div>
			<div class="bx-im-chat-header__subtitle_container">
				<div class="bx-im-chat-header__subtitle_content">{{ userPosition }}</div>
			</div>
		</div>
	`
	};

	const HEADER_WIDTH_BREAKPOINT = 700;

	// @vue/component
	const ChatHeader = {
		name: 'ChatHeader',
		components: {
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar,
			CallHeaderButton,
			GroupChatTitle,
			UserChatTitle: UserTitle,
			LineLoader: im_v2_component_elements_loader.LineLoader,
			FadeAnimation: im_v2_component_animation.FadeAnimation,
			HeaderAvatar,
			AddToChatButton,
			SearchButton,
			SidebarButton
		},
		inject: ['withSidebar'],
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			withCallButton: {
				type: Boolean,
				default: true
			},
			withSearchButton: {
				type: Boolean,
				default: true
			},
			withAddToChatButton: {
				type: Boolean,
				default: true
			},
			withEntityLink: {
				type: Boolean,
				default: true
			}
		},
		emits: ['buttonPanelReady', 'compactModeChange'],
		data() {
			return {
				compactMode: false
			};
		},
		computed: {
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
				return this.user.type === im_v2_const.UserType.bot;
			},
			showCallButton() {
				if (this.isBot || !this.withCallButton) {
					return false;
				}
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.call, this.dialogId);
			},
			showAddToChatButton() {
				if (this.isBot || !this.withAddToChatButton) {
					return false;
				}
				const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
				const hasCreateChatAccess = permissionManager.canPerformActionByUserType(im_v2_const.ActionByUserType.createChat);
				if (this.isUser && !hasCreateChatAccess) {
					return false;
				}
				const canPerformActionByRole = permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.extend, this.dialogId);
				const canPerformActionByUserType = permissionManager.canPerformActionByUserType(im_v2_const.ActionByUserType.extend);
				return canPerformActionByRole && canPerformActionByUserType;
			},
			showSearchButton() {
				return this.withSearchButton;
			},
			showSidebarButton() {
				if (!this.withSidebar) {
					return false;
				}
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.openSidebar, this.dialogId);
			},
			chatTitleComponent() {
				return this.isUser ? UserTitle : GroupChatTitle;
			},
			containerClasses() {
				return {
					'--compact': this.compactMode
				};
			}
		},
		created() {
			if (this.isInited) {
				this.emitButtonPanelReady();
			}
		},
		mounted() {
			this.initResizeObserver();
		},
		beforeUnmount() {
			this.getResizeObserver().disconnect();
		},
		methods: {
			initResizeObserver() {
				this.resizeObserver = new ResizeObserver(([entry]) => {
					this.onContainerResize(entry.contentRect.width);
				});
				this.resizeObserver.observe(this.$refs.container);
			},
			onContainerResize(newContainerWidth) {
				const newCompactMode = newContainerWidth <= HEADER_WIDTH_BREAKPOINT;
				if (newCompactMode !== this.compactMode) {
					this.$emit('compactModeChange', newCompactMode);
					this.compactMode = newCompactMode;
				}
			},
			onNewTitleSubmit(newTitle) {
				void this.getChatService().renameChat(this.dialogId, newTitle);
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				return this.chatService;
			},
			getResizeObserver() {
				return this.resizeObserver;
			},
			emitButtonPanelReady() {
				this.$emit('buttonPanelReady');
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-chat-header__scope bx-im-chat-header__container" :class="containerClasses" ref="container">
			<div class="bx-im-chat-header__left">
				<slot name="left">
					<HeaderAvatar :dialogId="dialogId" />
					<slot name="title" :onNewTitleHandler="onNewTitleSubmit">
						<component
							:is="chatTitleComponent"
							:dialogId="dialogId"
							:withEntityLink="withEntityLink"
							@newTitle="onNewTitleSubmit"
						/>
					</slot>
				</slot>
			</div>
			<LineLoader v-if="!isInited" :width="45" :height="22" />
			<FadeAnimation @afterEnter="emitButtonPanelReady" :duration="100">
				<div v-if="isInited" class="bx-im-chat-header__right">
					<slot name="before-actions"></slot>
					<CallHeaderButton v-if="showCallButton" :dialogId="dialogId" :compactMode="compactMode" />
					<slot v-if="showAddToChatButton" name="add-to-chat-button">
						<AddToChatButton :dialogId="dialogId" />
					</slot>
					<SearchButton v-if="showSearchButton" :dialogId="dialogId" />
					<SidebarButton v-if="showSidebarButton" :dialogId="dialogId" />
				</div>
			</FadeAnimation>
		</div>
	`
	};

	// @vue/component
	const BulkActionsPanel = {
		name: 'BulkActionsPanel',
		components: {
			ChatButton: im_v2_component_elements_button.ChatButton,
			ForwardPopup: im_v2_component_entitySelector.ForwardPopup
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				showForwardPopup: false,
				messagesIds: []
			};
		},
		computed: {
			ButtonSize: () => im_v2_component_elements_button.ButtonSize,
			ButtonIcon: () => im_v2_component_elements_button.ButtonIcon,
			ButtonColor: () => im_v2_component_elements_button.ButtonColor,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			selectedMessages() {
				return this.$store.getters['messages/select/getCollection'](this.dialogId);
			},
			messagesAuthorId() {
				return [...this.selectedMessages].map(messageId => {
					return this.$store.getters['messages/getById'](messageId).authorId;
				});
			},
			hasOthersMessages() {
				const userId = im_v2_application_core.Core.getUserId();
				return this.messagesAuthorId.some(authorId => authorId !== userId);
			},
			canDeleteMessage() {
				const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
				return permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.deleteOthersMessage, this.dialogId);
			},
			selectedMessagesSize() {
				return this.selectedMessages.size;
			},
			formattedMessagesCounter() {
				if (!this.selectedMessagesSize) {
					return '';
				}
				return `(${this.selectedMessagesSize})`;
			},
			isBlockedDeletion() {
				if (this.canDeleteMessage) {
					return false;
				}
				return this.hasOthersMessages;
			},
			messageCounterText() {
				if (!this.selectedMessagesSize) {
					return this.loc('IM_CONTENT_BULK_ACTIONS_SELECT_MESSAGES');
				}
				return this.loc('IM_CONTENT_BULK_ACTIONS_COUNT_MESSAGES');
			},
			confirmTitle() {
				return this.loc('IM_CONTENT_BULK_ACTIONS_CONFIRM_TITLE', {
					'#COUNT#': this.selectedMessagesSize
				});
			},
			tooltipSettings() {
				return {
					text: this.loc('IM_CONTENT_BULK_ACTIONS_DELETE_NOT_CAN_DELETE'),
					popupOptions: {
						angle: true,
						targetContainer: document.body,
						offsetTop: -13,
						offsetLeft: 65,
						bindOptions: {
							position: 'top'
						}
					}
				};
			}
		},
		methods: {
			onForwardButtonClick() {
				im_v2_lib_analytics.Analytics.getInstance().messageForward.onClickForward(this.dialogId);
				this.messagesIds = [...this.selectedMessages];
				this.showForwardPopup = true;
			},
			closeForwardPopup() {
				this.messagesIds = [];
				this.showForwardPopup = false;
			},
			async onDeleteButtonClick() {
				const confirmResult = await im_v2_lib_confirm.showDeleteMessagesConfirm(this.confirmTitle);
				if (!confirmResult) {
					return false;
				}
				this.getMessageService().deleteMessages([...this.selectedMessages]);
				this.closeBulkActionsMode();
				return true;
			},
			closeBulkActionsMode() {
				this.getEmitter().emit(im_v2_const.EventType.dialog.closeBulkActionsMode, {
					dialogId: this.dialogId
				});
			},
			getMessageService() {
				if (!this.messageService) {
					this.messageService = new im_v2_provider_service_message.MessageService({
						chatId: this.dialog.chatId
					});
				}
				return this.messageService;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-content-bulk-actions-panel">
			<div class="bx-im-content-bulk-actions-panel__container">
				<div class="bx-im-content-bulk-actions-panel__left-section">
					<div @click="closeBulkActionsMode" class="bx-im-content-bulk-actions-panel__cancel"></div>
					<div class="bx-im-content-bulk-actions-panel__counter-container">
						<span class="bx-im-content-bulk-actions-panel__counter-name">{{ messageCounterText }}</span>
						<span class="bx-im-content-bulk-actions-panel__counter-number">{{ formattedMessagesCounter }}</span>
					</div>
				</div>
				<div class="bx-im-content-bulk-actions-panel__right-section">
					<div class="bx-im-content-bulk-actions-panel__delete-button">
						<div
							v-if="isBlockedDeletion"
							v-hint="tooltipSettings"
							class="bx-im-content-bulk-actions-panel__tooltip"
						>
						</div>
						<ChatButton
							:size="ButtonSize.L"
							:icon="ButtonIcon.Delete"
							:color="ButtonColor.Delete"
							:isDisabled="!selectedMessagesSize || isBlockedDeletion"
							:isRounded="true"
							:isUppercase="false"
							:text="loc('IM_CONTENT_BULK_ACTIONS_PANEL_DELETE')"
							@click="onDeleteButtonClick"
						/>
					</div>
					<ChatButton
						:size="ButtonSize.L"
						:icon="ButtonIcon.Forward"
						:color="ButtonColor.Forward"
						:isRounded="true"
						:isUppercase="false"
						:isDisabled="!selectedMessagesSize"
						:text="loc('IM_CONTENT_BULK_ACTIONS_PANEL_FORWARD')"
						@click="onForwardButtonClick"
					/>
				</div>
				<ForwardPopup
					v-if="showForwardPopup"
					:messagesIds="messagesIds"
					:dialogId="dialogId"
					@close="closeForwardPopup"
				/>
			</div>
		</div>
	`
	};

	const ARTICLE_CODE = '20412666';

	// @vue/component
	const ChatContentDisclaimer = {
		name: 'ChatContentDisclaimer',
		components: {
			RichLoc: ui_vue3_components_richLoc.RichLoc
		},
		computed: {
			warningText() {
				return main_core.Loc.getMessage('IM_CONTENT_COPILOT_DISCLAIMER_MSGVER_1', {
					'#COPILOT_NAME#': this.copilotManager.getName()
				});
			},
			shouldShowDisclaimer() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available) && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotAvailable) && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotActive);
			}
		},
		created() {
			this.copilotManager = new im_v2_lib_copilot.CopilotManager();
		},
		methods: {
			onLinkClick() {
				im_v2_lib_helpdesk.openHelpdeskArticle(ARTICLE_CODE);
			}
		},
		template: `
		<div v-if="shouldShowDisclaimer" class="bx-im-chat-content-disclaimer__container --ui-context-content-dark">
			<RichLoc
				:text="warningText"
				placeholder="[link]"
				tag="span"
				class="bx-im-chat-content-disclaimer__text --ellipsis"
			>
				<template #link="{ text }">
					<span class="bx-im-chat-content-disclaimer__link" @click="onLinkClick">
						{{ text }}
					</span>
				</template>
			</RichLoc>
		</div>
	`
	};

	const Height = {
		chatHeader: 64,
		pinnedMessages: 53,
		blockedTextarea: 64,
		dropAreaOffset: 16};

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
				const multiUploadingService = this.getMultiUploadingService();
				const multiUploadingResult = await multiUploadingService.upload({
					files: await ui_uploader_core.getFilesFromDataTransfer(event.dataTransfer),
					dialogId: this.dialogId,
					sendAsFile: false,
					autoUpload: false
				});
				if (main_core.Type.isArrayFilled(multiUploadingResult.uploaderIds)) {
					this.getEmitter().emit(im_v2_const.EventType.textarea.openUploadPreview, {
						multiUploadingResult
					});
				}
				this.showDropArea = false;
			},
			getMultiUploadingService() {
				if (!this.multiUploadingService) {
					this.multiUploadingService = new im_v2_provider_service_uploading.MultiUploadingService();
				}
				return this.multiUploadingService;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
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

	// @vue/component
	const JoinPanel = {
		components: {
			ChatButton: im_v2_component_elements_button.ChatButton
		},
		props: {
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			ButtonSize: () => im_v2_component_elements_button.ButtonSize,
			ButtonColor: () => im_v2_component_elements_button.ButtonColor
		},
		methods: {
			onButtonClick() {
				this.getChatService().joinChat(this.dialogId);
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
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

	const BUTTON_BACKGROUND_COLOR = 'rgba(0, 0, 0, 0.1)';
	const BUTTON_HOVER_COLOR = 'rgba(0, 0, 0, 0.2)';
	const BUTTON_TEXT_COLOR = '#fff';

	// @vue/component
	const MutePanel = {
		components: {
			ChatButton: im_v2_component_elements_button.ChatButton
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
			ButtonSize: () => im_v2_component_elements_button.ButtonSize,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			buttonText() {
				const mutedCode = this.loc('IM_CONTENT_BLOCKED_TEXTAREA_ENABLE_NOTIFICATIONS');
				const unmutedCode = this.loc('IM_CONTENT_BLOCKED_TEXTAREA_DISABLE_NOTIFICATIONS');
				return this.dialog.isMuted ? mutedCode : unmutedCode;
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
				if (this.dialog.isMuted) {
					this.getChatService().unmuteChat(this.dialogId);
					return;
				}
				this.getChatService().muteChat(this.dialogId);
			},
			getChatService() {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
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
			ChatContentDisclaimer,
			DropArea,
			MutePanel,
			JoinPanel,
			BulkActionsPanel,
			LoadingBar
		},
		directives: {
			'textarea-observer': TextareaObserverDirective
		},
		provide() {
			return {
				currentSidebarPanel: ui_vue3.computed(() => this.currentSidebarPanel),
				withSidebar: ui_vue3.computed(() => this.withSidebar)
			};
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			withSidebar: {
				type: Boolean,
				default: true
			},
			withHeader: {
				type: Boolean,
				default: true
			},
			withDropArea: {
				type: Boolean,
				default: true
			},
			withChatContentDisclaimer: {
				type: Boolean,
				default: true
			},
			backgroundId: {
				type: String,
				default: null
			}
		},
		data() {
			return {
				textareaHeight: 0,
				headerHeight: 0,
				showLoadingBar: false,
				currentSidebarPanel: ''
			};
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			canSend() {
				if (!this.dialog.isTextareaEnabled) {
					return false;
				}
				return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.send, this.dialog.dialogId);
			},
			isGuest() {
				return this.dialog.role === im_v2_const.UserRole.guest;
			},
			isBulkActionsMode() {
				return this.$store.getters['messages/select/isBulkActionsModeActive'](this.dialogId);
			},
			hasCommentsOnTop() {
				return this.$store.getters['messages/comments/areOpenedForChannel'](this.dialogId);
			},
			containerClasses() {
				const alignment = this.$store.getters['application/settings/get'](im_v2_const.Settings.appearance.alignment);
				return [`--${alignment}-align`];
			},
			backgroundStyle() {
				if (this.backgroundId) {
					return im_v2_lib_theme.ThemeManager.getBackgroundStyleById(this.backgroundId);
				}
				return im_v2_lib_theme.ThemeManager.getCurrentBackgroundStyle(this.dialogId);
			},
			dialogContainerStyle() {
				let textareaHeight = this.textareaHeight;
				if (!this.canSend || this.isBulkActionsMode) {
					textareaHeight = Height.blockedTextarea;
				}
				return {
					height: `calc(100% - ${this.headerHeight}px - ${textareaHeight}px)`
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
		mounted() {
			this.headerHeight = this.$refs['header-container']?.clientHeight ?? 0;
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
			onChangeSidebarPanel({
				panel
			}) {
				this.currentSidebarPanel = panel;
			},
			bindEvents() {
				this.getEmitter().subscribe(im_v2_const.EventType.dialog.showLoadingBar, this.onShowLoadingBar);
				this.getEmitter().subscribe(im_v2_const.EventType.dialog.hideLoadingBar, this.onHideLoadingBar);
			},
			unbindEvents() {
				this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.showLoadingBar, this.onShowLoadingBar);
				this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.hideLoadingBar, this.onHideLoadingBar);
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-content-chat__scope bx-im-content-chat__container" :class="containerClasses" :style="backgroundStyle">
			<div class="bx-im-content-chat__content" ref="content">
				<div v-if="withHeader" ref="header-container">
					<slot name="header">
						<ChatHeader :dialogId="dialogId" :key="dialogId" />
					</slot>
				</div>
				<slot name="sub-header"></slot>
				<div :style="dialogContainerStyle" class="bx-im-content-chat__dialog_container">
					<Transition name="loading-bar-transition">
						<LoadingBar v-if="showLoadingBar" />
					</Transition>
					<div class="bx-im-content-chat__dialog_content">
						<slot name="dialog">
							<ChatDialog :dialogId="dialogId" :key="dialogId"/>
						</slot>
					</div>
				</div>
				<!-- Textarea -->
				<Transition name="bx-im-panel-transition">
					<BulkActionsPanel v-if="isBulkActionsMode" :dialogId="dialogId"/>
					<div v-else-if="canSend" v-textarea-observer class="bx-im-content-chat__textarea_container" ref="textarea-container">
						<slot name="textarea" :onTextareaMount="onTextareaMount">
							<ChatTextarea
								:dialogId="dialogId"
								:key="dialogId"
								@mounted="onTextareaMount"
							/>
						</slot>
						<div class="bx-im-content-chat__after-textarea_container">
							<slot name="after-textarea">
								<ChatContentDisclaimer v-if="withChatContentDisclaimer"/>
							</slot>
						</div>
					</div>
					<slot v-else-if="isGuest" name="join-panel">
						<JoinPanel :dialogId="dialogId" />
					</slot>
					<MutePanel v-else :dialogId="dialogId" />
				</Transition>
				<DropArea
					v-if="withDropArea"
					:key="dialogId" 
					:dialogId="dialogId" 
					:container="$refs.content || {}" 
				/>
				<!-- End textarea -->
			</div>
			<ChatSidebar
				v-if="dialogId && withSidebar" 
				:originDialogId="dialogId"
				:isActive="!hasCommentsOnTop"
				@changePanel="onChangeSidebarPanel"
			/>
			<slot name="extra-panel"></slot>
		</div>
	`
	};

	// @vue/component
	const FeatureBlock = {
		name: 'FeatureBlock',
		props: {
			name: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			subtitle: {
				type: String,
				required: true
			}
		},
		template: `
		<div class="bx-im-content-chat-start__block">
			<div class="bx-im-content-chat-start__block_icon" :class="'--' + name"></div>
			<div class="bx-im-content-chat-start__block_content">
				<div class="bx-im-content-chat-start__block_title">
					{{ title }}
				</div>
				<div class="bx-im-content-chat-start__block_subtitle">
					{{ subtitle }}
				</div>
			</div>
		</div>
	`
	};

	const IconClass = {
		group: '--group',
		chat: '--chat',
		list: '--list'
	};
	const EmptyStateListItemName = {
		audio: 'audio',
		messages: 'messages',
		chat: 'chat',
		collaboration: 'collaboration',
		business: 'business',
		result: 'result',
		copilot: 'copilot',
		list: 'list'
	};
	// @vue/component
	const BaseEmptyState = {
		components: {
			FeatureBlock
		},
		props: {
			text: {
				type: String,
				default: ''
			},
			subtext: {
				type: String,
				default: ''
			},
			backgroundId: {
				type: [String, Number],
				default: ''
			},
			listItems: {
				type: Array,
				default: () => []
			},
			iconClassName: {
				type: String,
				default: ''
			}
		},
		computed: {
			items() {
				return this.listItems;
			},
			iconClass() {
				if (this.iconClassName) {
					return this.iconClassName;
				}
				return this.isEmptyRecent ? IconClass.group : IconClass.chat;
			},
			preparedText() {
				if (this.text) {
					return this.text;
				}
				if (this.isEmptyRecent) {
					return this.loc('IM_CONTENT_CHAT_EMPTY_STATE_NO_CHATS_MESSAGE');
				}
				return this.loc('IM_CONTENT_CHAT_EMPTY_STATE_MESSAGE');
			},
			preparedSubtext() {
				if (this.subtext) {
					return this.subtext;
				}
				return '';
			},
			isEmptyRecent() {
				const recentCollection = im_v2_application_core.Core.getStore().getters['recent/getCollection']({
					type: im_v2_const.RecentType.default
				});
				return recentCollection.length === 0;
			},
			backgroundStyle() {
				if (main_core.Type.isStringFilled(this.backgroundId) || main_core.Type.isNumber(this.backgroundId)) {
					return im_v2_lib_theme.ThemeManager.getBackgroundStyleById(this.backgroundId);
				}
				return im_v2_lib_theme.ThemeManager.getCurrentBackgroundStyle();
			}
		},
		methods: {
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-content-chat-start__container" :style="backgroundStyle">
			<div class="bx-im-content-chat-start__content">
				<div class="bx-im-content-chat-start__icon" :class="iconClass"></div>
				<div class="bx-im-content-chat-start__title">
					{{ preparedText }}
				</div>
				<div v-if="preparedSubtext" class="bx-im-content-chat-start__subtitle">
					{{ preparedSubtext }}
				</div>
				<div v-if="items.length > 0" class="bx-im-content-chat-start__blocks">
					<FeatureBlock
						v-for="item in items"
						:name="item.name"
						:title="item.title"
						:subtitle="item.subtitle"
					/>
				</div>
				<slot name="bottom-content"></slot>
			</div>
		</div>
	`
	};

	exports.BaseChatContent = BaseChatContent;
	exports.BaseEmptyState = BaseEmptyState;
	exports.ChatHeader = ChatHeader;
	exports.EmptyStateListItemName = EmptyStateListItemName;
	exports.EntityButton = EntityButton;
	exports.GroupChatTitle = GroupChatTitle;
	exports.IconClass = IconClass;
	exports.UserCounter = UserCounter;

})(this.BX.Messenger.v2.Component.Content = this.BX.Messenger.v2.Component.Content || {}, BX?.Messenger?.v2?.Component?.Animation??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Const??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Service??{}, BX?.Messenger?.v2?.Component?.EntitySelector??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Call?.Component??{}, BX??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.UI?.IconSet??{}, BX?.Event??{}, BX?.Vue3??{}, BX?.Messenger?.v2?.Component?.Dialog??{}, BX?.Messenger?.v2?.Component??{}, BX?.Messenger?.v2?.Component??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Vue3?.Directives??{}, BX?.Messenger?.v2?.Application??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Service??{}, BX?.UI?.Vue3?.Components??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.UI?.Uploader??{}, BX?.Messenger?.v2?.Service??{});
//# sourceMappingURL=registry.bundle.js.map
