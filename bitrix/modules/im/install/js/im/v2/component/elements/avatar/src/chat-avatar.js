import { type BitrixVueComponentProps } from 'ui.vue3';

import { ChatType, UserType } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { type ImModelChat, type ImModelUser } from 'im.v2.model';

import { AiAssistantAvatar } from './components/ai-assistant-avatar';
import { Avatar } from './components/base/avatar';
import { CollabChatAvatar } from './components/collab/collab-chat';
import { CollaberAvatar } from './components/collab/collaber';
import { CopilotAvatar } from './components/copilot/copilot';
import { ExtranetChatAvatar } from './components/extranet/extranet-chat-avatar';
import { ExtranetUserAvatar } from './components/extranet/extranet-user-avatar';
import { SelfChatAvatar } from './components/self-chat-avatar';
import { AvatarSize, ChatAvatarType } from './const/const';

type AvatarComponentConfigItem = {
	condition: () => boolean,
	component: BitrixVueComponentProps
};

// @vue/component
export const ChatAvatar = {
	name: 'ChatAvatar',
	props: {
		avatarDialogId: {
			type: [String, Number],
			default: '0',
		},
		contextDialogId: {
			type: [String, null],
			default: null,
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
		customType: {
			type: String,
			default: '',
		},
	},
	computed:
	{
		isUser(): boolean
		{
			return this.avatarDialog.type === ChatType.user;
		},
		user(): ImModelUser
		{
			return this.$store.getters['users/get'](this.avatarDialogId, true);
		},
		customAvatarUrl(): string
		{
			if (!this.isCopilot)
			{
				return '';
			}

			return this.copilotRoleAvatarUrl;
		},
		avatarDialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.avatarDialogId, true);
		},
		isCollabChat(): boolean
		{
			return this.avatarDialog.type === ChatType.collab;
		},
		isCollaber(): boolean
		{
			return this.user?.type === UserType.collaber;
		},
		isExtranetChat(): boolean
		{
			return this.avatarDialog.extranet;
		},
		isExtranet(): boolean
		{
			return this.user?.type === UserType.extranet;
		},
		isAiAssistant(): boolean
		{
			return this.$store.getters['users/bots/isAiAssistant'](this.avatarDialogId);
		},
		isCopilot(): boolean
		{
			return this.copilotManager.isCopilotChatOrBot(this.avatarDialogId);
		},
		isSelfChat(): boolean
		{
			return this.customType === ChatAvatarType.selfChat;
		},
		copilotRoleAvatarUrl(): string
		{
			if (!this.contextDialogId)
			{
				return this.copilotManager.getDefaultAvatarUrl();
			}

			return this.copilotManager.getRoleAvatarUrl({
				avatarDialogId: this.avatarDialogId,
				contextDialogId: this.contextDialogId,
			});
		},
		avatarComponentConfig(): AvatarComponentConfigItem[]
		{
			return [
				{ condition: () => this.isSelfChat, component: SelfChatAvatar },
				{ condition: () => this.isExtranet, component: ExtranetUserAvatar },
				{ condition: () => this.isCollaber, component: CollaberAvatar },
				{ condition: () => this.isCollabChat, component: CollabChatAvatar },
				{ condition: () => this.isCopilot, component: CopilotAvatar },
				{ condition: () => this.isAiAssistant, component: AiAssistantAvatar },
				{ condition: () => this.isExtranetChat, component: ExtranetChatAvatar },
			];
		},
		avatarComponent(): BitrixVueComponentProps
		{
			const matchingItem: ?AvatarComponentConfigItem = this.avatarComponentConfig.find((item) => item.condition());

			return matchingItem ? matchingItem.component : Avatar;
		},
	},
	created()
	{
		this.copilotManager = new CopilotManager();
	},
	template: `
		<component
			:is="avatarComponent"
			:dialogId="avatarDialogId"
			:customSource="customAvatarUrl"
			:size="size"
			:withAvatarLetters="withAvatarLetters"
			:withSpecialTypes="withSpecialTypes"
			:withSpecialTypeIcon="withSpecialTypeIcon"
			:withTooltip="withTooltip"
		/>
	`,
};
