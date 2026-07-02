import { Loc, type JsonObject } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { Messenger } from 'im.public';
import { CreateChatManager, CreatableChatType } from 'im.v2.lib.create-chat';
import { EmptyAvatar, EmptyAvatarType, AvatarSize } from 'im.v2.component.elements.avatar';
import { Layout } from 'im.v2.const';

import './css/create-chat.css';

const DefaultTitleByChatType = {
	[CreatableChatType.chat]: Loc.getMessage('IM_LIST_RECENT_CREATE_CHAT_DEFAULT_TITLE'),
	[CreatableChatType.videoconf]: Loc.getMessage('IM_LIST_RECENT_CREATE_CONFERENCE_DEFAULT_TITLE'),
	[CreatableChatType.channel]: Loc.getMessage('IM_LIST_RECENT_CREATE_CHANNEL_DEFAULT_TITLE'),
	[CreatableChatType.collab]: Loc.getMessage('IM_LIST_RECENT_CREATE_COLLAB_DEFAULT_TITLE'),
};

const SubtitleByChatType = {
	[CreatableChatType.chat]: Loc.getMessage('IM_LIST_RECENT_CREATE_CHAT_SUBTITLE'),
	[CreatableChatType.videoconf]: Loc.getMessage('IM_LIST_RECENT_CREATE_CONFERENCE_SUBTITLE'),
	[CreatableChatType.channel]: Loc.getMessage('IM_LIST_RECENT_CREATE_CHANNEL_SUBTITLE'),
	[CreatableChatType.collab]: Loc.getMessage('IM_LIST_RECENT_CREATE_COLLAB_SUBTITLE'),
};

const DEFAULT_ALLOWED_TYPES = [
	CreatableChatType.chat,
	CreatableChatType.channel,
	CreatableChatType.collab,
	CreatableChatType.videoconf,
];

// @vue/component
export const CreateChatStatus = {
	name: 'CreateChatStatus',
	components: { EmptyAvatar, BIcon },
	props: {
		allowedTypes: {
			type: Array,
			default: () => DEFAULT_ALLOWED_TYPES,
		},
	},
	data(): JsonObject
	{
		return {
			chatTitle: '',
			chatAvatarFile: '',
			chatType: '',
		};
	},
	computed:
	{
		AvatarSize: () => AvatarSize,
		OutlineIcons: () => OutlineIcons,
		isAllowedType(): boolean
		{
			return this.allowedTypes.includes(this.chatType);
		},
		chatCreationIsOpened(): boolean
		{
			const { name: currentLayoutName } = this.$store.getters['application/getLayout'];

			return currentLayoutName === Layout.createChat;
		},
		preparedTitle(): string
		{
			if (this.chatTitle === '')
			{
				return DefaultTitleByChatType[this.chatType] ?? DefaultTitleByChatType[CreatableChatType.chat];
			}

			return this.chatTitle;
		},
		preparedSubtitle(): string
		{
			return SubtitleByChatType[this.chatType] ?? SubtitleByChatType[CreatableChatType.chat];
		},
		preparedAvatar(): string | null
		{
			if (!this.chatAvatarFile)
			{
				return null;
			}

			return URL.createObjectURL(this.chatAvatarFile);
		},
		avatarType(): $Values<typeof EmptyAvatarType>
		{
			if (this.chatType === CreatableChatType.collab)
			{
				return EmptyAvatarType.collab;
			}

			if (this.chatType === CreatableChatType.chat)
			{
				return EmptyAvatarType.default;
			}

			return EmptyAvatarType.squared;
		},
	},
	created()
	{
		const existingTitle = CreateChatManager.getInstance().getChatTitle();
		if (existingTitle)
		{
			this.chatTitle = existingTitle;
		}

		const existingAvatar = CreateChatManager.getInstance().getChatAvatar();
		if (existingAvatar)
		{
			this.chatAvatarFile = existingAvatar;
		}

		this.chatType = CreateChatManager.getInstance().getChatType();

		CreateChatManager.getInstance().subscribe(CreateChatManager.events.titleChange, this.onTitleChange);
		CreateChatManager.getInstance().subscribe(CreateChatManager.events.avatarChange, this.onAvatarChange);
		CreateChatManager.getInstance().subscribe(CreateChatManager.events.chatTypeChange, this.onChatTypeChange);
	},
	beforeUnmount()
	{
		CreateChatManager.getInstance().unsubscribe(CreateChatManager.events.titleChange, this.onTitleChange);
		CreateChatManager.getInstance().unsubscribe(CreateChatManager.events.avatarChange, this.onAvatarChange);
		CreateChatManager.getInstance().unsubscribe(CreateChatManager.events.chatTypeChange, this.onChatTypeChange);
	},
	methods:
	{
		onTitleChange(event: BaseEvent<string>)
		{
			this.chatTitle = event.getData();
		},
		onAvatarChange(event: BaseEvent<string>)
		{
			this.chatAvatarFile = event.getData();
		},
		onChatTypeChange(event: BaseEvent<string>)
		{
			this.chatType = event.getData();
		},
		onClick()
		{
			void CreateChatManager.getInstance().startChatCreation(this.chatType, {
				clearCurrentCreation: false,
			});
		},
		onCancel()
		{
			CreateChatManager.getInstance().clearPresetFields();
			CreateChatManager.getInstance().setCreationStatus(false);

			if (!this.chatCreationIsOpened)
			{
				return;
			}

			void Messenger.openChat();
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
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
	`,
};
