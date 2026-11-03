import { Type } from 'main.core';

import 'ui.design-tokens.air';

import { EmptyAvatar, AvatarSize, EmptyAvatarType } from 'im.v2.component.elements.avatar';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { ChatService } from 'im.v2.provider.service.chat';

import './css/chat-avatar.css';

// @vue/component
export const ChatAvatar = {
	name: 'ChatAvatar',
	components: { EmptyAvatar },
	props:
	{
		avatarFile: {
			required: true,
			validator(value): boolean
			{
				return (value instanceof File) || Type.isNull(value);
			},
		},
		existingAvatarUrl: {
			type: String,
			default: '',
		},
		chatTitle: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			default: EmptyAvatarType.default,
		},
	},
	emits: ['avatarChange'],
	computed:
	{
		AvatarSize: () => AvatarSize,
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		// The focus ring repeats the shape of the avatar, and only the default one is a circle.
		buttonClasses(): string[]
		{
			return [`--${this.type}`];
		},
		preparedAvatar(): string | null
		{
			if (!this.avatarFile)
			{
				return null;
			}

			return URL.createObjectURL(this.avatarFile);
		},
		avatarToShow(): string | null
		{
			return this.preparedAvatar || this.existingAvatarUrl;
		},
	},
	methods:
	{
		onAvatarChangeClick()
		{
			this.$refs.avatarInput.click();
		},
		async onAvatarSelect(event: Event)
		{
			const input: HTMLInputElement = event.target;
			const file: File = input.files[0];
			if (!file)
			{
				return;
			}

			const preparedAvatar = await this.getChatService().prepareAvatar(file);
			if (!preparedAvatar)
			{
				return;
			}

			this.$emit('avatarChange', preparedAvatar);
		},
		getChatService(): ChatService
		{
			if (!this.chatService)
			{
				this.chatService = new ChatService();
			}

			return this.chatService;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	// The avatar opens a file dialog, so in air design it is a real button: a clickable image
	// alone has no name for a screen reader and cannot be reached from the keyboard.
	template: `
		<button
			v-if="isAirDesignEnabled"
			type="button"
			class="bx-im-chat-forms-chat-avatar__button"
			:class="buttonClasses"
			:aria-label="loc('IM_CREATE_CHAT_AVATAR_SELECT_ARIA')"
			data-testid="im-chat-form-avatar"
			@click="onAvatarChangeClick"
		>
			<EmptyAvatar
				:size="AvatarSize.XXL"
				:url="avatarToShow"
				:title="chatTitle"
				:type="type"
			/>
		</button>
		<EmptyAvatar
			v-else
			:size="AvatarSize.XXL"
			:url="avatarToShow"
			:title="chatTitle"
			:type="type"
			data-testid="im-chat-form-avatar"
			@click="onAvatarChangeClick"
			class="bx-im-chat-forms-chat-avatar__container"
		/>
		<input
			type="file"
			@change="onAvatarSelect"
			accept="image/*"
			class="bx-im-chat-forms-chat-avatar__input"
			data-testid="im-chat-form-avatar-input"
			ref="avatarInput"
		>
	`,
};
