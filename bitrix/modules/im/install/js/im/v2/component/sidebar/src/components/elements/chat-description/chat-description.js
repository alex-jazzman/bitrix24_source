import { Loc, type JsonObject } from 'main.core';

import { ChatType, UserType } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Parser } from 'im.v2.lib.parser';
import { SidebarManager } from 'im.v2.lib.sidebar';
import { CollabManager } from 'im.v2.lib.collab';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { type ImModelChat, type ImModelUser } from 'im.v2.model';

import './chat-description.css';

const MAX_DESCRIPTION_SYMBOLS = 50;
const VISIBLE_DESCRIPTION_LINES = 2;
const NEW_LINE_SYMBOL = '\n';

// @vue/component
export const ChatDescription = {
	name: 'ChatDescription',
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			expanded: false,
		};
	},
	computed:
	{
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isUser(): boolean
		{
			return this.dialog.type === ChatType.user;
		},
		isBot(): boolean
		{
			const user: ImModelUser = this.$store.getters['users/get'](this.dialogId, true);

			return user.type === UserType.bot;
		},
		customDescription(): string
		{
			const sidebarConfig = SidebarManager.getInstance().getConfig(this.dialogId);

			return sidebarConfig.getCustomDescription();
		},
		purifiedDescription(): string
		{
			return Parser.purify({ text: this.dialog.description, removeNewLines: false });
		},
		isLongDescription(): boolean
		{
			const lineBreakCount = this.purifiedDescription.split(NEW_LINE_SYMBOL).length - 1;
			const hasSeveralLines = lineBreakCount > VISIBLE_DESCRIPTION_LINES;

			return (this.purifiedDescription.length > MAX_DESCRIPTION_SYMBOLS) || hasSeveralLines;
		},
		previewDescription(): string
		{
			if (this.purifiedDescription.length === 0)
			{
				return this.chatTypeText;
			}

			if (this.isLongDescription)
			{
				return `${this.purifiedDescription.slice(0, MAX_DESCRIPTION_SYMBOLS)}...`;
			}

			return this.purifiedDescription;
		},
		descriptionToShow(): string
		{
			return this.expanded ? this.purifiedDescription : this.previewDescription;
		},
		copilotDescription(): string
		{
			if (FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available))
			{
				return this.$store.getters['copilot/getAgentName'];
			}

			return (new CopilotManager()).getAIModelName(this.dialogId);
		},
		descriptionByChatType(): Record<string, () => string>
		{
			return {
				[ChatType.user]: () => Loc.getMessage('IM_SIDEBAR_CHAT_TYPE_USER'),
				[ChatType.channel]: () => Loc.getMessage('IM_SIDEBAR_CHAT_TYPE_CHANNEL'),
				[ChatType.openChannel]: () => Loc.getMessage('IM_SIDEBAR_CHAT_TYPE_CHANNEL'),
				[ChatType.generalChannel]: () => Loc.getMessage('IM_SIDEBAR_CHAT_TYPE_CHANNEL'),
				[ChatType.comment]: () => Loc.getMessage('IM_SIDEBAR_CHAT_TYPE_COMMENTS'),
				[ChatType.taskComments]: () => Loc.getMessage('IM_SIDEBAR_CHAT_TYPE_TASK_COMMENTS'),
				[ChatType.copilot]: () => this.copilotDescription,
				[ChatType.collab]: () => CollabManager.getSidebarChatTypeText(),
				default: () => Loc.getMessage('IM_SIDEBAR_CHAT_TYPE_GROUP_V2'),
			};
		},
		chatTypeText(): string
		{
			if (this.customDescription.length > 0)
			{
				return this.customDescription;
			}

			if (this.isBot)
			{
				return this.loc('IM_SIDEBAR_CHAT_TYPE_BOT');
			}

			const handler = this.descriptionByChatType[this.dialog.type] ?? this.descriptionByChatType.default;

			return handler();
		},
		showExpandButton(): boolean
		{
			if (this.expanded)
			{
				return false;
			}

			return this.isLongDescription;
		},
	},
	methods:
	{
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-sidebar-chat-description__container">
			<div class="bx-im-sidebar-chat-description__text-container" :class="[expanded ? '--expanded' : '']">
				<div class="bx-im-sidebar-chat-description__icon"></div>
				<div
					class="bx-im-sidebar-chat-description__text"
					:class="{ '--long-description': isLongDescription }"
				>
					{{ descriptionToShow }}
				</div>
			</div>
			<button
				v-if="showExpandButton"
				class="bx-im-sidebar-chat-description__show-more-button"
				@click="expanded = !expanded"
			>
				{{ loc('IM_SIDEBAR_CHAT_DESCRIPTION_SHOW') }}
			</button>
		</div>
	`,
};
