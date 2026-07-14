import { Loc } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { BaseMessage } from 'im.v2.component.message.base';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import './css/convert.css';

type ConvertMessageItem = {
	icon: string,
	text: string,
};

// @vue/component
export const ConvertToCollabMessage = {
	name: 'ConvertToCollabMessage',
	components: { BaseMessage, BIcon },
	props: {
		item: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		isCopilotAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.copilotAvailable);
		},
		listItems(): ConvertMessageItem[]
		{
			return [
				{
					icon: Outline.TASK_LIST,
					text: this.loc('IM_MESSAGE_COLLAB_CONVERT_ITEM_WORKFLOW_UNITY'),
				},
				{
					icon: Outline.CHATS,
					text: this.loc('IM_MESSAGE_COLLAB_CONVERT_ITEM_CHAT_BENEFIT'),
				},
				{
					icon: Outline.BITRIX_GPT,
					text: this.copilotItemText,
				},
			];
		},
		copilotItemText(): string
		{
			if (!this.isCopilotAvailable)
			{
				return this.loc('IM_MESSAGE_COLLAB_CONVERT_ITEM_INVITE_PARTICIPANTS');
			}

			return this.loc('IM_MESSAGE_COLLAB_CONVERT_ITEM_BITRIX_GPT', {
				'#COPILOT_NAME#': this.copilotManager.getName(),
			});
		},
		preparedTitle(): string
		{
			return this.loc('IM_MESSAGE_PROJECT_CONVERT_TITLE', {
				'[br/]': '\n',
			});
		},
	},
	created(): void
	{
		this.copilotManager = new CopilotManager();
	},
	methods: {
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<BaseMessage
			:dialogId="dialogId"
			:item="item"
			:withContextMenu="false"
			:withReactions="false"
			:withBackground="false"
		>
			<div class="bx-im-message-collab-convert">
				<div class="bx-im-message-collab-convert__image"/>
				<div class="bx-im-message-collab-convert__content">
					<div class="bx-im-message-collab-convert__title">
						{{ preparedTitle }}
					</div>
					<div class="bx-im-message-collab-convert__description">
						<template v-for="listItem in listItems">
							<div class="bx-im-message-collab-convert__item">
								<BIcon
									class="bx-im-message-collab-convert__item-icon"
									:name="listItem.icon"
								/>
								<div class="bx-im-message-collab-convert__item-text">{{ listItem.text }}</div>
							</div>
						</template>
					</div>
				</div>
			</div>
		</BaseMessage>
	`,
};
