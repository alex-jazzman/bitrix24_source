import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { BaseMessage } from 'im.v2.component.message.base';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import './css/collab-creation.css';

type MessageListItem = {
	text: string,
	iconName: $Values<typeof OutlineIcons>,
};

// @vue/component
export const CollabCreationMessage = {
	name: 'CollabCreationMessage',
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
		copilotItemText(): string
		{
			if (!this.isCopilotAvailable)
			{
				return this.loc('IM_MESSAGE_COLLAB_CREATION_LIST_INVITE_PARTICIPANTS');
			}

			return this.loc('IM_MESSAGE_COLLAB_CREATION_LIST_BITRIX_GPT');
		},
		listItems(): MessageListItem[]
		{
			return [
				{
					text: this.loc('IM_MESSAGE_COLLAB_CREATION_LIST_CHATS'),
					iconName: OutlineIcons.CHATS,
				},
				{
					text: this.loc('IM_MESSAGE_COLLAB_CREATION_LIST_GROUP'),
					iconName: OutlineIcons.GROUP,
				},
				{
					text: this.copilotItemText,
					iconName: OutlineIcons.BITRIX_GPT,
				},
			];
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
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
			<div class="bx-im-message-collab-create__container">
				<div class="bx-im-message-collab-create__image"/>
				<div class="bx-im-message-collab-create__content">
					<div class="bx-im-message-collab-create__title">
						{{ loc('IM_MESSAGE_COLLAB_CREATE_PROJECT_TITLE') }}
					</div>
					<div
						v-for="item in listItems"
						class="bx-im-message-collab-create__item"
					>
						<BIcon :name="item.iconName" />
						<span class="bx-im-message-collab-create__item-text">
							{{ item.text }}
						</span>
					</div>
				</div>
			</div>
		</BaseMessage>
	`,
};
