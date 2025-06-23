import { getMemberRoles } from 'humanresources.company-structure.api';
import { TagSelector } from 'ui.entity-selector';
import { BIcon, Set } from 'ui.icon-set.api.vue';
import { EntityTypes } from 'humanresources.company-structure.utils';
import { DefaultHint } from '../responsive-hint/default-hint';
import {
	getChatDialogEntity,
	getChannelDialogEntity,
	getChatRecentTabOptions,
	ChatTypeDict,
} from 'humanresources.company-structure.structure-components';

export const BindChat = {
	name: 'bindChat',

	emits: ['applyData'],

	components: {
		DefaultHint,
		BIcon,
	},

	props: {
		heads: {
			type: Array,
			required: false,
		},
		name: {
			type: String,
			required: true,
		},
		entityType: {
			type: String,
			required: true,
		},
	},

	data(): Object
	{
		// this boolean values are true by default but false if no heads specified
		return {
			createDefaultChat: true,
			createDefaultChannel: true,
		};
	},

	created(): void
	{
		this.chatSelector = this.getChatSelector();
		this.channelSelector = this.getChannelSelector();
		this.chats = [];
		this.channels = [];

		if (!this.headsCreated)
		{
			this.createDefaultChat = false;
			this.createDefaultChannel = false;
		}
	},

	mounted(): void
	{
		this.chatSelector.renderTo(this.$refs['chat-selector']);
		this.channelSelector.renderTo(this.$refs['channel-selector']);
	},

	methods: {
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		getChatSelector(): TagSelector
		{
			const options = {
				multiple: true,
				events: {
					onTagAdd: (event: BaseEvent) => {
						const { tag } = event.getData();
						this.chats.push(Number(tag.id.replace('chat', '')));
						this.applyData();
					},
					onTagRemove: (event: BaseEvent) => {
						const { tag } = event.getData();
						const intId = Number(tag.id.replace('chat', ''));
						this.chats = this.chats.filter((chat) => chat !== intId);
						this.applyData();
					},
				},
				dialogOptions: {
					enableSearch: true,
					height: 250,
					width: 380,
					dropdownMode: true,
					recentTabOptions: getChatRecentTabOptions(this.entityType, ChatTypeDict.chat),
					entities: [
						getChatDialogEntity(),
					],
				},
			};

			return new TagSelector(options);
		},
		getChannelSelector(): TagSelector
		{
			const options = {
				multiple: true,
				events: {
					onTagAdd: (event: BaseEvent) => {
						const { tag } = event.getData();
						this.channels.push(Number(tag.id.replace('chat', '')));
						this.applyData();
					},
					onTagRemove: (event: BaseEvent) => {
						const { tag } = event.getData();
						const intId = Number(tag.id.replace('chat', ''));
						this.channels = this.channels.filter((chat) => chat !== intId);
						this.applyData();
					},
				},
				dialogOptions: {
					enableSearch: true,
					height: 250,
					width: 380,
					dropdownMode: true,
					recentTabOptions: getChatRecentTabOptions(this.entityType, ChatTypeDict.channel),
					entities: [
						getChannelDialogEntity(),
					],
				},
			};

			return new TagSelector(options);
		},
		applyData(): void
		{
			this.$emit('applyData', {
				chats: this.chats,
				channels: this.channels,
				createDefaultChat: this.createDefaultChat,
				createDefaultChannel: this.createDefaultChannel,
				isDepartmentDataChanged: true,
			});
		},
	},

	watch: {
		headsCreated(value): void
		{
			this.createDefaultChat = value;
			this.createDefaultChannel = value;
		},
	},

	computed: {
		chatHintText(): string
		{
			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHATS_ADD_CHECKBOX_HINT')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHATS_ADD_CHECKBOX_HINT_MSGVER_1');
		},
		channelHintText(): string
		{
			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHANNELS_ADD_CHECKBOX_HINT')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHANNELS_ADD_CHECKBOX_HINT_MSGVER_1');
		},
		headsCreated(): boolean
		{
			const memberRoles = getMemberRoles(this.entityType);

			return this.heads.some((item) => item.role === memberRoles.head);
		},
		set(): Set {
			return Set;
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
	},

	template: `
		<div class="chart-wizard__bind-chat">
			<div class="chart-wizard__bind-chat__item">
				<div class="chart-wizard__bind-chat__item-hint" :class="{ '--team': isTeamEntity }">
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
					<div
						class="chart-wizard__chat_selector"
						ref="chat-selector"
						data-test-id="hr-company-structure_chart-wizard__chat-selector"
					/>
					<div class="chart-wizard__bind-chat__item-checkbox_container">
						<input
							id="addChatCheckbox"
							type="checkbox"
							class="form-control"
							:disabled="!headsCreated"
							v-model="createDefaultChat"
							@change="applyData()"
							data-test-id="hr-company-structure_chart-wizard__make-default-chat-checkbox"
						/>
						<label for="addChatCheckbox">
							{{
								isTeamEntity
									? loc(
										'HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHATS_ADD_CHECKBOX_LABEL')
									: loc(
										'HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHATS_ADD_CHECKBOX_LABEL_MSGVER_1')
							}}
						</label>
						<DefaultHint :content="chatHintText"/>
					</div>
					<div v-if="!headsCreated" class="chart-wizard__bind-chat__item-checkbox_warning">
						<BIcon
							:name="set.WARNING"
							color="#FFA900"
							:size="16"
						></BIcon>
						<span>
							{{
								isTeamEntity
									? loc(
										'HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHATS_ADD_CHECKBOX_WARNING')
									: loc(
										'HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHATS_ADD_CHECKBOX_WARNING')
							}}
						</span>
					</div>
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
								? loc(
									'HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHANNELS_DESCRIPTION')
								: loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHANNELS_DESCRIPTION')
						}}
					</span>
					<div
						class="chart-wizard__channel_selector"
						ref="channel-selector"
						data-test-id="hr-company-structure_chart-wizard__channel-selector"
					/>
					<div class="chart-wizard__bind-chat__item-checkbox_container">
						<input
							id="addChannelCheckbox"
							type="checkbox"
							class="form-control"
							:disabled="!headsCreated"
							v-model="createDefaultChannel"
							@change="applyData()"
							data-test-id="hr-company-structure_chart-wizard__make-default-channel-checkbox"
						/>
						<label for="addChannelCheckbox">
							{{
								isTeamEntity
									? loc(
										'HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHANNELS_ADD_CHECKBOX_LABEL')
									: loc(
										'HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHANNELS_ADD_CHECKBOX_LABEL_MSGVER_1')
							}}
						</label>
						<DefaultHint :content="channelHintText"/>
					</div>
					<div v-if="!headsCreated" class="chart-wizard__bind-chat__item-checkbox_warning --bottom-space">
						<BIcon
							:name="set.WARNING"
							color="#FFA900"
							:size="16"
						></BIcon>
						<span>
							{{
								isTeamEntity
									? loc(
										'HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHANNELS_ADD_CHECKBOX_WARNING')
									: loc(
										'HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHANNELS_ADD_CHECKBOX_WARNING')
							}}
						</span>
					</div>
				</div>
			</div>
		</div>
	`,
};
