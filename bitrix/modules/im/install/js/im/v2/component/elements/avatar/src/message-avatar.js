import { type BitrixVueComponentProps } from 'ui.vue3';

import { UserType } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { type ImModelUser } from 'im.v2.model';

import { MartaAvatar } from './components/marta-avatar';
import { LegacyAvatar } from './components/base/legacy-avatar';
import { Avatar } from './components/base/avatar';
import { CollaberAvatar } from './components/collab/collaber';
import { CopilotAvatar } from './components/copilot/copilot';
import { ExtranetUserAvatar } from './components/extranet/extranet-user-avatar';
import { AvatarSize } from './const/const';

// @vue/component
export const MessageAvatar = {
	name: 'MessageAvatar',
	props: {
		messageId: {
			type: [String, Number],
			default: 0,
		},
		contextDialogId: {
			type: [String, Number],
			default: 0,
		},
		authorId: {
			type: [String, Number],
			default: 0,
		},
		size: {
			type: String,
			default: AvatarSize.M,
		},
		withAvatarLetters: {
			type: Boolean,
			default: true,
		},
		withSpecialTypes: {
			type: Boolean,
			default: true,
		},
		withSpecialTypeIcon: {
			type: Boolean,
			default: true,
		},
		withTooltip: {
			type: Boolean,
			default: true,
		},
	},
	computed: {
		customAvatarUrl(): string
		{
			const copilotManager = new CopilotManager();
			if (!copilotManager.isCopilotMessage(this.messageId))
			{
				return '';
			}

			return copilotManager.getMessageRoleAvatar(this.messageId);
		},
		user(): ImModelUser
		{
			return this.$store.getters['users/get'](this.authorId, true);
		},
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		defaultAvatarComponent(): BitrixVueComponentProps
		{
			return this.isAirDesignEnabled ? Avatar : LegacyAvatar;
		},
		avatarComponent(): BitrixVueComponentProps
		{
			const avatarMap = {
				[UserType.extranet]: ExtranetUserAvatar,
				[UserType.collaber]: CollaberAvatar,
				[UserType.guest]: CollaberAvatar,
				[UserType.bot]: this.getBotAvatar(),
			};

			return avatarMap[this.user.type] ?? this.defaultAvatarComponent;
		},
		isAiAssistantMarta(): boolean
		{
			return this.$store.getters['users/bots/isAiAssistant'](this.authorId);
		},
	},
	methods:
	{
		getBotAvatar(): BitrixVueComponentProps
		{
			if (this.isAiAssistantMarta)
			{
				return MartaAvatar;
			}

			const copilotManager = new CopilotManager();

			return copilotManager.isCopilotChatOrBot(this.authorId) ? CopilotAvatar : this.defaultAvatarComponent;
		},
	},
	template: `
		<component
			:is="avatarComponent"
			:dialogId="authorId"
			:customSource="customAvatarUrl"
			:size="size"
			:withAvatarLetters="withAvatarLetters"
			:withSpecialTypes="withSpecialTypes"
			:withSpecialTypeIcon="withSpecialTypeIcon"
			:withTooltip="withTooltip"
		/>
	`,
};
