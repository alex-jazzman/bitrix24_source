import {
	getChatDialogEntity,
	getChannelDialogEntity,
	getChatRecentTabOptions,
	ChatTypeDict,
	DefaultHint,
} from 'humanresources.company-structure.structure-components';
import type { ChatOrChannelDetailed } from 'humanresources.company-structure.utils';
import { Item, TagSelector } from 'ui.entity-selector';
import { Set as IconSet } from 'ui.icon-set.api.core';
import { BIcon } from 'ui.icon-set.api.vue';

const DEFAULT_TAG_ID = 'default';

// Component for selecting chats or channels in the wizard. Consists of selector, default button, hint and warning
// @vue/component
export const ChatSelector = {
	name: 'chatSelector',

	components: {
		DefaultHint,
		BIcon,
	},

	props: {
		name: {
			type: String,
			required: true,
		},
		headsCreated: {
			type: Boolean,
			required: true,
		},
		isTeamEntity: {
			type: Boolean,
			required: true,
		},
		/** @type ChatOrChannelDetailed[] */
		initChats: {
			type: Array,
			required: true,
		},
		/** @type ChatTypeDict.chat | ChatTypeDict.channel */
		type: {
			type: String,
			required: true,
		},
	},

	emits: ['applyData'],

	data(): Object
	{
		return {
			createDefault: false,
		};
	},

	computed:
	{
		isChannel(): boolean
		{
			return this.type === ChatTypeDict.channel;
		},
		set(): IconSet
		{
			return IconSet;
		},
		hintText(): string
		{
			if (this.isChannel)
			{
				return this.isTeamEntity
					? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHANNELS_ADD_CHECKBOX_HINT')
					: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHANNELS_ADD_CHECKBOX_HINT_MSGVER_1')
				;
			}

			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHATS_ADD_CHECKBOX_HINT')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHATS_ADD_CHECKBOX_HINT_MSGVER_1');
		},
		createText(): string
		{
			if (this.isChannel)
			{
				return this.isTeamEntity
					? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHANNELS_ADD_CHECKBOX_LABEL_MSGVER_1')
					: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHANNELS_ADD_CHECKBOX_LABEL_MSGVER_2')
				;
			}

			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHATS_ADD_CHECKBOX_LABEL_MSGVER_1')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHATS_ADD_CHECKBOX_LABEL_MSGVER_2')
			;
		},
		removeText(): string
		{
			if (this.isChannel)
			{
				return this.isTeamEntity
					? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHANNELS_REMOVE_CHECKBOX_LABEL')
					: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHANNELS_REMOVE_CHECKBOX_LABEL')
				;
			}

			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHATS_REMOVE_CHECKBOX_LABEL')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHATS_REMOVE_CHECKBOX_LABEL')
			;
		},
		warningText(): string
		{
			if (this.isChannel)
			{
				return this.isTeamEntity
					? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHANNELS_ADD_CHECKBOX_WARNING')
					: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHANNELS_ADD_CHECKBOX_WARNING')
				;
			}

			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_SELECT_CHATS_ADD_CHECKBOX_WARNING')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_SELECT_CHATS_ADD_CHECKBOX_WARNING')
			;
		},
	},

	watch:
	{
		createDefault(value): void
		{
			if (value)
			{
				this.selector.getDialog().getItem({ id: DEFAULT_TAG_ID, entityId: DEFAULT_TAG_ID }).select();
			}
			else
			{
				this.selector.getDialog().getItem({ id: DEFAULT_TAG_ID, entityId: DEFAULT_TAG_ID }).deselect();
			}
		},
		name(value): void
		{
			const chatItem = this.selector.getDialog().getItem({ id: DEFAULT_TAG_ID, entityId: DEFAULT_TAG_ID });
			chatItem.setTitle(value);

			if (this.createDefault)
			{
				chatItem.deselect();
				chatItem.select();
			}
		},
		headsCreated(value): void
		{
			if (!value)
			{
				this.createDefault = false;
			}
		},
		initChats:
		{
			handler(payload: ChatOrChannelDetailed[]): void
			{
				payload.forEach((chat) => this.initialChatsSet.add(`chat${chat.id}`));
				const preselectedChats = payload.map((chat) => ['im-chat-only', `chat${chat.id}`]);
				const { dialog } = this.selector;
				dialog.setPreselectedItems(preselectedChats);
				dialog.load();
			},
		},
	},

	created(): void
	{
		this.chats = [];
		// store initial values to control applyData method in tagSelector
		this.initialChatsSet = this.initChats.reduce((set, chat) => set.add(`chat${chat.id}`), new Set());
		this.selector = this.getSelector();
	},

	mounted(): void
	{
		this.selector.renderTo(this.$refs['chat-selector']);
	},

	methods:
	{
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		addChatTag(tag): void
		{
			if (!tag.searchable)
			{
				const existingChat = this.initChats.find((chat) => chat.dialogId === tag.id);

				if (existingChat?.title)
				{
					tag.setTitle(existingChat.title);
					if (existingChat.hasAccess)
					{
						tag.setDeselectable(true);
					}
				}
			}

			this.chats.push(Number(tag.id.replace('chat', '')));
		},
		getSelector(): TagSelector
		{
			const entity = this.isChannel ? getChannelDialogEntity() : getChatDialogEntity();

			const options = {
				multiple: true,
				events: {
					onTagAdd: (event: BaseEvent) => {
						const { tag } = event.getData();
						if (tag.id === DEFAULT_TAG_ID)
						{
							this.createDefault = true;
						}
						else
						{
							this.addChatTag(tag);
						}

						if (this.initialChatsSet.has(tag.id))
						{
							this.initialChatsSet.delete(tag.id);
						}
						else
						{
							this.applyData();
						}
					},
					onTagRemove: (event: BaseEvent) => {
						const { tag } = event.getData();
						const intId = Number(tag.id.replace('chat', ''));
						if (tag.id === DEFAULT_TAG_ID)
						{
							this.createDefault = false;
						}
						else
						{
							this.chats = this.chats.filter((chat) => chat !== intId);
						}
						this.applyData();
					},
				},
				dialogOptions: {
					enableSearch: true,
					height: 250,
					width: 380,
					dropdownMode: true,
					recentTabOptions: getChatRecentTabOptions(this.entityType, this.type),
					items: [this.getDefaultItem(entity.tagOptions?.default, entity.itemOptions?.default)],
					preselectedItems: this.initChats.map((chat) => ['im-chat-only', `chat${chat.id}`]),
					entities: [entity],
				},
			};

			return new TagSelector(options);
		},
		getDefaultItem(tagOptions: Object = {}, itemOptions: Object = {}): Item
		{
			return {
				id: DEFAULT_TAG_ID,
				entityId: DEFAULT_TAG_ID,
				title: this.name,
				searchable: false,
				tagOptions,
				...itemOptions,
			};
		},
		applyData(): void
		{
			this.$emit('applyData', {
				type: this.type,
				chats: this.chats,
				createDefault: this.createDefault,
			});
		},
		getTestId(blueprint: string): string
		{
			if (this.isChannel)
			{
				return blueprint.replace('chat', 'channel');
			}

			return blueprint;
		},
	},

	template: `
		<div
			class="chart-wizard__chat_selector"
			ref="chat-selector"
			:data-test-id="getTestId('hr-company-structure_chart-wizard__chat-selector')"
		/>
		<div
			v-if="!createDefault"
			class="chart-wizard__bind-chat__item-checkbox_container"
		>
			<div
				@click="createDefault = headsCreated"
				class="chart-wizard__bind-chat__item-create"
				:class="{ '--disabled': !headsCreated }"
				:data-test-id="getTestId('hr-company-structure_chart-wizard__make-default-chat-create')"
				v-html="createText"
			>
			</div>
			<DefaultHint :content="hintText" />
		</div>
		<div v-else class="chart-wizard__bind-chat__item-checkbox_container">
			<div class="ui-icon-set --o-circle-check"></div>
			<div
				class="chart-wizard__bind-chat__item-remove"
				:class="{ '--disabled': !headsCreated }"
				:data-test-id="getTestId('hr-company-structure_chart-wizard__make-default-chat-remove')"
			>
				{{ removeText }}
			</div>
		</div>
		<div v-if="!headsCreated" class="chart-wizard__bind-chat__item-checkbox_warning">
			<BIcon
				:name="set.WARNING"
				color="#FFA900"
				:size="16"
			></BIcon>
			<span>
				{{ warningText }}
			</span>
		</div>
	`,
};
