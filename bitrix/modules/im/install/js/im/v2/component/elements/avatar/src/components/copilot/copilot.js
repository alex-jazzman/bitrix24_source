import { AvatarBase, AvatarRound, AvatarRoundBitrixGpt, AvatarRoundCopilot } from 'ui.avatar';
import { type ImModelChat } from 'im.v2.model';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { AvatarSize } from '../../const/const';
import { BaseUiAvatar, AvatarType } from '../base/base-ui-avatar';

// @vue/component
export const CopilotAvatar = {
	name: 'CopilotAvatar',
	components: { BaseUiAvatar },
	props: {
		/**
		 * Identifier used to resolve the fallback avatar source. May be either:
		 * - a ai-assistant chat id (when used from chat-avatar.js)
		 * - a bot user id (when used from message-avatar.js, equals authorId)
		 */
		dialogId: {
			type: [String, Number],
			default: 0,
		},
		/**
		 * Parent ai-assistant chat id where the role is configured.
		 * When set, the role-based avatar and chat name are resolved from this chat
		 * instead of `dialogId`. Falls back to `dialogId` when empty.
		 */
		contextDialogId: {
			type: String,
			default: '',
		},
		size: {
			type: String,
			default: AvatarSize.M,
		},
		customSource: {
			type: String,
			default: '',
		},

	},
	computed:
	{
		AvatarType: () => AvatarType,
		copilotChatDialogId(): string
		{
			return this.contextDialogId || this.dialogId;
		},
		// Fallback source: bot's own chat record. Used when no role-based avatar is provided.
		fallbackAvatarSource(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true)?.avatar;
		},
		copilotChatDialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.copilotChatDialogId, true);
		},
		dialogName(): string
		{
			return this.copilotChatDialog.name;
		},
		isTitleBasedAvatar(): boolean
		{
			return this.$store.getters['copilot/chats/titleIsCustom'](this.copilotChatDialogId);
		},
		isCopilot2026Styles(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);
		},
		isDefaultRole(): boolean
		{
			if (!this.contextDialogId)
			{
				return true;
			}

			const role = this.$store.getters['copilot/chats/getRole'](this.contextDialogId);

			return Boolean(role?.default);
		},
		avatarClass(): Class<AvatarBase>
		{
			if (!this.isCopilot2026Styles)
			{
				return AvatarRoundCopilot;
			}

			if (this.isTitleBasedAvatar || !this.isDefaultRole)
			{
				return AvatarRoundBitrixGpt;
			}

			return AvatarRound;
		},
		dialogAvatarUrl(): string
		{
			if (this.isCopilot2026Styles && this.isTitleBasedAvatar)
			{
				return '';
			}

			return this.customSource.length > 0 ? this.customSource : this.fallbackAvatarSource;
		},
	},
	template: `
		<BaseUiAvatar
			:type="AvatarType.copilot"
			:avatarClass="avatarClass"
			:title="dialogName"
			:size="size"
			:url="dialogAvatarUrl"
		/>
	`,
};
