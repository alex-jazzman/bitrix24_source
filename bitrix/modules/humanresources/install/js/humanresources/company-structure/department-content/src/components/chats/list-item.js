import { useChartStore } from 'humanresources.company-structure.chart-store';
import { events } from 'humanresources.company-structure.org-chart';
import { EventEmitter } from 'main.core.events';
import { AvatarRound, AvatarSquare } from 'ui.avatar';
import { Messenger } from 'im.public.iframe';
import { EntityTypes, getColorCode, ChatTypes } from 'humanresources.company-structure.utils';
import { mapState } from 'ui.vue3.pinia';
import { ChatListItemActionButton } from './action-button';
import { Hint, ResponsiveHint } from 'humanresources.company-structure.structure-components';

// @vue/component
export const ChatListItem = {
	name: 'chatListItem',

	components: { ChatListItemActionButton, ResponsiveHint },

	directives: { hint: Hint },

	props: {
		/** @type ChatOrChannelDetailed */
		chat: {
			type: Object,
			required: true,
		},
		nodeId: {
			type: Number,
			required: true,
		},
	},

	data(): Object
	{
		return {
			avatar: null,
		};
	},

	computed: {
		isChat(): boolean
		{
			return this.chat.type !== ChatTypes.channel;
		},
		originalNodeName(): string
		{
			return this.departments.get(this.chat.originalNodeId)?.name;
		},
		hiddenNodeName(): string
		{
			return this.structureMap.get(this.chat.originalNodeId)?.entityType === EntityTypes.team
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_HIDDEN_TEAM')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_HIDDEN_DEPARTMENT')
			;
		},
		indirectChatSubtitle(): string
		{
			if (this.structureMap.get(this.chat.originalNodeId)?.entityType === EntityTypes.team)
			{
				return this.isChat
					? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_OF_TEAM')
					: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_OF_TEAM')
				;
			}

			return this.isChat
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_OF_DEPARTMENT')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_OF_DEPARTMENT')
			;
		},
		lockHint(): string
		{
			if (!this.chat.hasAccess)
			{
				return this.isChat
					? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_USER_HAS_NO_ACCESS_TO_CHAT_HINT')
					: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_USER_HAS_NO_ACCESS_TO_CHANNEL_HINT')
				;
			}

			// parent node is a team so child node must be a team too
			if (this.structureMap.get(this.chat.originalNodeId)?.entityType === EntityTypes.team)
			{
				return this.isChat
					? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_PARENT_TEAM_CHAT_HINT')
					: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_PARENT_TEAM_CHANNEL_HINT')
				;
			}

			// parent node is a department so we check if child node is a department too
			if (this.structureMap.get(this.nodeId)?.entityType === EntityTypes.department)
			{
				return this.isChat
					? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_PARENT_DEPARTMENT_CHAT_OF_DEPARTMENT_HINT')
					: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_PARENT_DEPARTMENT_CHANNEL_OF_DEPARTMENT_HINT')
				;
			}

			// parent node is a department but child node is a team
			return this.isChat
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_PARENT_DEPARTMENT_CHAT_OF_TEAM_HINT')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_PARENT_DEPARTMENT_CHANNEL_OF_TEAM_HINT')
			;
		},
		...mapState(useChartStore, ['structureMap', 'departments']),
	},

	watch: {
		chat(): void
		{
			this.prepareAvatar();
		},
	},

	created(): void
	{
		this.prepareAvatar();
	},

	methods: {
		prepareAvatar(): void
		{
			if (this.chat.avatar)
			{
				this.chat.color = getColorCode('whiteBase');
			}

			const avatarOptions = {
				size: 32,
				userName: this.chat.title,
				baseColor: this.isExtranet() && !this.chat.avatar ? getColorCode('extranetColor') : this.chat.color,
				events: {
					click: () => {
						this.onChatItemClick();
					},
				},
			};

			if (this.chat.avatar)
			{
				avatarOptions.userpicPath = this.chat.avatar;
			}

			this.avatar = this.isChat ? new AvatarRound(avatarOptions) : new AvatarSquare(avatarOptions);
		},
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		onChatItemClick(): void
		{
			if (this.chat.hasAccess)
			{
				Messenger.openChat(this.chat.dialogId);
			}
		},
		isExtranet(): boolean
		{
			return this.chat.isExtranet;
		},
		locateToOriginalDepartment(): void
		{
			EventEmitter.emit(events.HR_ORG_CHART_LOCATE_TO_DEPARTMENT, { nodeId: this.chat.originalNodeId });
		},
	},

	template: `
		<div
			:key="chat.id"
			class="hr-department-detail-content__tab-list_item-wrapper --chat"
			:class="{ '--isExtranet': isExtranet() }"
			:data-test-id="'hr-department-content_chats-tab__list_chat-item-' + chat.id"
		>
			<div
				class="hr-department-detail-content__tab-list_item-avatar-container"
				:class="{ '--not-clickable': !chat.hasAccess }"
				v-html="this.avatar.getContainer().outerHTML"
				@click="onChatItemClick"
			/>
			<div class="hr-department-detail-content__tab-list_item-text-container">
				<div class="hr-department-detail-content__tab-list_item-title-container --chat-item">
					<span
						class="hr-department-detail-content__tab-list_item-title"
						:class="{ '--not-clickable': !chat.hasAccess }"
						:data-test-id="'hr-department-content_chats-tab__list_chat-item-' + chat.id + '-title'"
						@click="onChatItemClick"
					>{{ chat.title }}</span>
					<ResponsiveHint 
						v-if="!chat.hasAccess || chat.originalNodeId" 
						:content="lockHint" 
						:extraClasses="{ 'hr-department-detail-content__tab-list_hint-container': true }"
					>
						<span class="ui-icon-set --lock hr-department-detail-content__tab-list_lock-icon"></span>
					</ResponsiveHint>
				</div>
				<div v-if="chat.originalNodeId && originalNodeName" class="hr-department-detail-content__tab-list_item-subtitle --chat-item">
					{{ indirectChatSubtitle }}
					<ResponsiveHint 
						:content="originalNodeName" 
						defaultClass="hr-department-detail-content__tab-list_orig-node-name"
						:checkScrollWidth="true"
						:width="null"
						@click="locateToOriginalDepartment"
					>
						{{ originalNodeName }}
					</ResponsiveHint>
				</div>
				<div v-else-if="chat.originalNodeId" class="hr-department-detail-content__tab-list_item-subtitle --chat-item">
					{{ indirectChatSubtitle }}
					<span class="hr-department-detail-content__tab-list_orig-node-hidden-name">
						{{ hiddenNodeName }}
					</span>
				</div>
				<div v-else class="hr-department-detail-content__tab-list_item-subtitle">
					{{ chat.subtitle }}
				</div>
			</div>
			<ChatListItemActionButton
				:chat="chat"
				:nodeId="nodeId"
			/>
		</div>
	`,
};
