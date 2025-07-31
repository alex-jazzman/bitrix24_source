import { RouteActionMenu } from 'humanresources.company-structure.structure-components';
import './styles/empty-tab-add-buttons.css';
import { ChatsMenuOption } from './consts';
import 'ui.icon-set.main';

export const EmptyTabAddButtons = {
	name: 'emptyStateButtons',
	emits: ['emptyStateAddAction'],
	components: { RouteActionMenu },

	data(): Object
	{
		return {
			chatMenuVisible: false,
			channelMenuVisible: false,
			chatButtonId: 'hr-empty-tab-chat-add-button',
			channelButtonId: 'hr-empty-tab-chat-add-button',
		};
	},

	methods: {
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		onChatButtonClick(): void
		{
			this.$emit('emptyStateAddAction', ChatsMenuOption.linkChat);
		},
		onChannelButtonClick(): void
		{
			this.$emit('emptyStateAddAction', ChatsMenuOption.linkChannel);
		},
	},

	template: `
		<div class="hr-department-detail-content__chat-empty-tab-add_buttons-container">
			<button
				:ref="chatButtonId"
				class="ui-btn ui-btn-light-border ui-btn-no-caps ui-btn-round ui-btn-sm hr-department-detail-content__chat-empty-tab-add_chat-button"
				@click.stop="this.onChatButtonClick()"
				data-test-id="hr-department-detail-content_chats-tab__empty-tab-add_chat-button"
			>
				<div class="ui-icon-set --chat-message hr-department-detail-content__chat-empty-tab-add_chat-button-icon"/>
				<span>
					{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_CHAT_BUTTON') }}
				</span>
			</button>
			<button
				:ref="channelButtonId"
				class="ui-btn ui-btn-light-border ui-btn-no-caps ui-btn-round ui-btn-sm hr-department-detail-content__chat-empty-tab-add_channel-button"
				@click.stop="onChannelButtonClick()"
				data-test-id="hr-department-detail-content_chats-tab__empty-tab-add_channel-button"
			>
				<div class="ui-icon-set --speaker-mouthpiece hr-department-detail-content__chat-empty-tab-add_chat-button-icon"/>
				<span>
					{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_CHANNEL_BUTTON') }}
				</span>
			</button>
		</div>
	`,
};
