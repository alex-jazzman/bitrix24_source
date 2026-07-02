/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, ui_iconSet_api_vue, im_public, im_v2_lib_createChat, im_v2_component_elements_avatar, im_v2_const) {
	'use strict';

	const DefaultTitleByChatType = {
		[im_v2_lib_createChat.CreatableChatType.chat]: main_core.Loc.getMessage('IM_LIST_RECENT_CREATE_CHAT_DEFAULT_TITLE'),
		[im_v2_lib_createChat.CreatableChatType.videoconf]: main_core.Loc.getMessage('IM_LIST_RECENT_CREATE_CONFERENCE_DEFAULT_TITLE'),
		[im_v2_lib_createChat.CreatableChatType.channel]: main_core.Loc.getMessage('IM_LIST_RECENT_CREATE_CHANNEL_DEFAULT_TITLE'),
		[im_v2_lib_createChat.CreatableChatType.collab]: main_core.Loc.getMessage('IM_LIST_RECENT_CREATE_COLLAB_DEFAULT_TITLE')
	};
	const SubtitleByChatType = {
		[im_v2_lib_createChat.CreatableChatType.chat]: main_core.Loc.getMessage('IM_LIST_RECENT_CREATE_CHAT_SUBTITLE'),
		[im_v2_lib_createChat.CreatableChatType.videoconf]: main_core.Loc.getMessage('IM_LIST_RECENT_CREATE_CONFERENCE_SUBTITLE'),
		[im_v2_lib_createChat.CreatableChatType.channel]: main_core.Loc.getMessage('IM_LIST_RECENT_CREATE_CHANNEL_SUBTITLE'),
		[im_v2_lib_createChat.CreatableChatType.collab]: main_core.Loc.getMessage('IM_LIST_RECENT_CREATE_COLLAB_SUBTITLE')
	};
	const DEFAULT_ALLOWED_TYPES = [im_v2_lib_createChat.CreatableChatType.chat, im_v2_lib_createChat.CreatableChatType.channel, im_v2_lib_createChat.CreatableChatType.collab, im_v2_lib_createChat.CreatableChatType.videoconf];

	// @vue/component
	const CreateChatStatus = {
		name: 'CreateChatStatus',
		components: {
			EmptyAvatar: im_v2_component_elements_avatar.EmptyAvatar,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			allowedTypes: {
				type: Array,
				default: () => DEFAULT_ALLOWED_TYPES
			}
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
			isAllowedType() {
				return this.allowedTypes.includes(this.chatType);
			},
			chatCreationIsOpened() {
				const {
					name: currentLayoutName
				} = this.$store.getters['application/getLayout'];
				return currentLayoutName === im_v2_const.Layout.createChat;
			},
			preparedTitle() {
				if (this.chatTitle === '') {
					return DefaultTitleByChatType[this.chatType] ?? DefaultTitleByChatType[im_v2_lib_createChat.CreatableChatType.chat];
				}
				return this.chatTitle;
			},
			preparedSubtitle() {
				return SubtitleByChatType[this.chatType] ?? SubtitleByChatType[im_v2_lib_createChat.CreatableChatType.chat];
			},
			preparedAvatar() {
				if (!this.chatAvatarFile) {
					return null;
				}
				return URL.createObjectURL(this.chatAvatarFile);
			},
			avatarType() {
				if (this.chatType === im_v2_lib_createChat.CreatableChatType.collab) {
					return im_v2_component_elements_avatar.EmptyAvatarType.collab;
				}
				if (this.chatType === im_v2_lib_createChat.CreatableChatType.chat) {
					return im_v2_component_elements_avatar.EmptyAvatarType.default;
				}
				return im_v2_component_elements_avatar.EmptyAvatarType.squared;
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
				void im_v2_lib_createChat.CreateChatManager.getInstance().startChatCreation(this.chatType, {
					clearCurrentCreation: false
				});
			},
			onCancel() {
				im_v2_lib_createChat.CreateChatManager.getInstance().clearPresetFields();
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
		<div v-if="isAllowedType" class="bx-im-list-recent-create-chat__container">
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
						:hoverable="true"
						class="bx-im-list-recent-create-chat__icon-close"
						@click.stop="onCancel"
					/>
				</div>
			</div>
		</div>
	`
	};

	exports.CreateChatStatus = CreateChatStatus;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX, BX.UI.IconSet, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Const);
//# sourceMappingURL=create-chat-status.bundle.js.map
