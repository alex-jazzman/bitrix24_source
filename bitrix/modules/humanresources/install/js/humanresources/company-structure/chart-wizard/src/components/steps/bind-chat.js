import { getMemberRoles } from 'humanresources.company-structure.api';
import { EntityTypes, WizardApiEntityChangedDict, type ChatOrChannelDetailed } from 'humanresources.company-structure.utils';
import { ChatSelector } from './steps-components/chat-selector';
import { ChatTypeDict } from 'humanresources.company-structure.structure-components';

// @vue/component
export const BindChat = {
	name: 'bindChat',

	components: { ChatSelector },

	props: {
		heads: {
			type: Array,
			required: false,
			default: () => [],
		},
		name: {
			type: String,
			required: true,
		},
		entityType: {
			type: String,
			required: true,
		},
		isEditMode: {
			type: Boolean,
			required: true,
		},
		/** @type ChatOrChannelDetailed[] */
		initChats: {
			type: Array,
			required: true,
		},
		/** @type ChatOrChannelDetailed[] */
		initChannels: {
			type: Array,
			required: true,
		},
	},

	emits: ['applyData'],

	computed:
	{
		chatHintText(): string
		{
			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHATS_ADD_CHECKBOX_HINT')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHATS_ADD_CHECKBOX_HINT_MSGVER_1')
			;
		},
		channelHintText(): string
		{
			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHANNELS_ADD_CHECKBOX_HINT')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHANNELS_ADD_CHECKBOX_HINT_MSGVER_1')
			;
		},
		headsCreated(): boolean
		{
			const memberRoles = getMemberRoles(this.entityType);

			return this.heads.some((item) => item.role === memberRoles.head);
		},
		isTeamEntity(): boolean
		{
			return this.entityType === EntityTypes.team;
		},
		hints(): string[]
		{
			if (this.isTeamEntity)
			{
				return [
					this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_HINT_1'),
					this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_HINT_2'),
					this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_HINT_3'),
				];
			}

			return [
				this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_HINT_1_MSGVER_1'),
				this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_HINT_2_MSGVER_1'),
				this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_HINT_3'),
			];
		},
		ChatTypeDict(): Record<string, string>
		{
			return ChatTypeDict;
		},
	},

	watch:
	{
		initChats(value: ChatOrChannelDetailed[]): void
		{
			this.chats = value.map((item) => item.id);
		},
		initChannels(value: ChatOrChannelDetailed[]): void
		{
			this.channels = value.map((item) => item.id);
		},
	},

	created(): void
	{
		this.chats = this.initChats.map((item) => item.id);
		this.channels = this.initChannels.map((item) => item.id);
		this.createDefaultChat = false;
		this.createDefaultChannel = false;
	},

	activated(): void
	{
		this.$emit('applyData', {
			isDepartmentDataChanged: false,
			isValid: true,
		});
	},

	methods:
	{
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		applyData(): void
		{
			this.$emit('applyData', {
				apiEntityChanged: WizardApiEntityChangedDict.bindChats,
				chats: this.chats,
				channels: this.channels,
				createDefaultChat: this.createDefaultChat,
				createDefaultChannel: this.createDefaultChannel,
				isDepartmentDataChanged: true,
			});
		},
		onChatSelectorChanged(data: { type: string, chats: Array, createDefault: boolean })
		{
			if (data.type === ChatTypeDict.chat)
			{
				this.chats = data.chats;
				this.createDefaultChat = data.createDefault;
			}
			else
			{
				this.channels = data.chats;
				this.createDefaultChannel = data.createDefault;
			}

			this.applyData();
		},
	},

	template: `
		<div class="chart-wizard__bind-chat">
			<div class="chart-wizard__bind-chat__item">
				<div v-if="!isEditMode" class="chart-wizard__bind-chat__item-hint" :class="{ '--team': isTeamEntity }">
					<div class="chart-wizard__bind-chat__item-hint_logo" :class="{ '--team': isTeamEntity }"></div>
					<div class="chart-wizard__bind-chat__item-hint_text">
						<div
							class="chart-wizard__bind-chat__item-hint_title"
							v-html="
								isTeamEntity 
									? loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_HINT_TITLE')
									: loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_HINT_TITLE')
							"
						>
						</div>
						<div v-for="hint in hints"
							 class="chart-wizard__bind-chat__item-hint_text-item"
						>
							<div
								class="chart-wizard__bind-chat__item-hint_text-item_icon"
								:class="{ '--team': isTeamEntity }"
							></div>
							<span>{{ hint }}</span>
						</div>
					</div>
				</div>
				<div class="chart-wizard__bind-chat__item-options">
					<div class="chart-wizard__bind-chat__item-options__item-content_title">
						<div class="chart-wizard__bind-chat__item-options__item-content_title-text">
							{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHATS_TITLE') }}
						</div>
					</div>
					<span class="chart-wizard__bind-chat__item-description">
						{{
							isTeamEntity
								? loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHATS_DESCRIPTION')
								: loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHATS_DESCRIPTION')
						}}
					</span>
					<ChatSelector
						:name="name"
						:headsCreated="headsCreated"
						:initChats="initChats"
						:type="ChatTypeDict.chat"
						:isTeamEntity="isTeamEntity"
						@applyData="onChatSelectorChanged"
					/>
				</div>
				<div class="chart-wizard__bind-chat__item-options">
					<div class="chart-wizard__bind-chat__item-options__item-content_title">
						<div class="chart-wizard__bind-chat__item-options__item-content_title-text">
							{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHANNELS_TITLE') }}
						</div>
					</div>
					<span class="chart-wizard__bind-chat__item-description">
						{{
							isTeamEntity
								? loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHANNELS_DESCRIPTION')
								: loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHANNELS_DESCRIPTION')
						}}
					</span>
					<ChatSelector
						:name="name"
						:headsCreated="headsCreated"
						:initChats="initChannels"
						:type="ChatTypeDict.channel"
						:isTeamEntity="isTeamEntity"
						@applyData="onChatSelectorChanged"
					/>
				</div>
			</div>
		</div>
	`,
};
