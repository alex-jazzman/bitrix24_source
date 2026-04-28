import { Extension, Runtime } from 'main.core';

import { Core } from 'im.v2.application.core';
import { ScrollWithGradient } from 'im.v2.component.elements.scroll-with-gradient';
import { EntitySearch, getUsersFromRecentItems } from 'im.v2.lib.search';
import { ChatType, SpecialMentionDialogId, EventType } from 'im.v2.const';
import { ChannelManager } from 'im.v2.lib.channel';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { MentionSearchService } from './classes/search-service';
import { ContentFooter } from './components/content-footer';
import { LoadingState } from './components/loading-state';
import { MentionItemsContainer } from './components/mention-items-container';
import { MentionItemFormatter } from './classes/item-formatter';
import { SearchEmptyState } from './components/search-empty-state';
import { ParticipantsService } from './classes/participants-service';

import './css/mention-popup-content.css';

import type { SettingsCollection } from 'main.core.collections';
import type { ImModelChat } from 'im.v2.model';
import type { BaseEvent, EventEmitter } from 'main.core.events';
import type { JsonObject } from 'main.core';

export type MentionItemType = {
	id: string,
	title: string,
	subtitle: string,
}

// @vue/component
export const MentionPopupContent = {
	name: 'MentionPopupContent',
	components: {
		ContentFooter,
		SearchEmptyState,
		ScrollWithGradient,
		LoadingState,
		MentionItemsContainer,
	},
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		query: {
			type: String,
			default: '',
		},
		searchChats: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['close', 'adjustPosition'],
	data(): JsonObject
	{
		return {
			isLoading: false,
			searchResult: [],
			chatParticipants: [],
			chatParticipantsLoaded: false,
			currentServerQueries: 0,
			needTopShadow: false,
			needBottomShadow: true,
			participantsIds: new Set(),
		};
	},
	computed:
	{
		dialog(): ImModelChat
		{
			return Core.getStore().getters['chats/get'](this.dialogId, true);
		},
		items(): MentionItemType[]
		{
			if (!this.isEmptyQuery)
			{
				return this.formattedDynamicItems(this.searchResult);
			}

			return [...this.fixedItemsToShow, ...this.dynamicItemsToShow];
		},
		fixedItemsToShow(): MentionItemType[]
		{
			const items = [
				{
					id: this.copilotBotDialogId,
					title: (new MentionItemFormatter(this.copilotBotDialogId).getTitle()),
					subtitle: this.loc('IM_TEXTAREA_MENTION_COPILOT_SUBTITLE'),
					showCondition: this.needToShowFixedCopilot,
				},
				{
					id: SpecialMentionDialogId.allParticipants,
					title: this.loc('IM_TEXTAREA_MENTION_ALL_PARTICIPANTS_TITLE'),
					subtitle: this.loc('IM_TEXTAREA_MENTION_ALL_PARTICIPANTS_SUBTITLE'),
					showCondition: this.needToShowAllParticipants,
				},
			];

			return items
				.filter((item) => item.showCondition)
				.map(({ id, title, subtitle }) => ({ id, title, subtitle }));
		},
		dynamicItemsToShow(): MentionItemType[]
		{
			return this.formattedDynamicItems(this.dynamicItems);
		},
		dynamicItems(): string[]
		{
			if (this.needToShowRecentUsersOnStartScreen)
			{
				return this.usersFromRecent;
			}

			return this.chatParticipants;
		},
		needToShowRecentUsersOnStartScreen(): boolean
		{
			return this.chatParticipantsLoaded && this.chatParticipants.length <= 1;
		},
		usersFromRecent(): string[]
		{
			return getUsersFromRecentItems({ withFakeUsers: false }).map(({ dialogId }) => dialogId);
		},
		preparedQuery(): string
		{
			return this.query.trim().toLowerCase();
		},
		isEmptyQuery(): boolean
		{
			return this.preparedQuery.length === 0;
		},
		isSearchEmptyState(): boolean
		{
			if (this.isLoading || this.isEmptyQuery)
			{
				return false;
			}

			return this.items.length === 0;
		},
		searchConfig(): { exclude: $Values<typeof EntitySearch>[], contextChatId: string }
		{
			const exclude = [];

			if (!this.searchChats)
			{
				exclude.push(EntitySearch.chats);
			}

			return { exclude, contextChatId: this.dialog.chatId };
		},
		copilotBotDialogId(): ?string
		{
			return this.$store.getters['users/bots/getCopilotBotDialogId'];
		},
		needToShowFixedCopilot(): boolean
		{
			const isChannel = ChannelManager.isChannel(this.dialogId);
			const isCopilotChat = (new CopilotManager()).isCopilotChat(this.dialogId);

			if (isChannel || isCopilotChat)
			{
				return false;
			}

			return FeatureManager.isFeatureAvailable(Feature.isCopilotMentionAvailable);
		},
		needToShowAllParticipants(): boolean
		{
			return this.dialog.type !== ChatType.user;
		},
	},
	watch:
	{
		async isLoading()
		{
			await this.adjustPosition();
		},
		async searchResult()
		{
			await this.adjustPosition();
		},
		preparedQuery(newQuery: string, previousQuery: string)
		{
			if (newQuery === previousQuery)
			{
				return;
			}

			void this.startSearch(newQuery);
		},
	},
	async created()
	{
		this.initSettings();
		this.searchService = new MentionSearchService(this.searchConfig);
		this.searchOnServerDelayed = Runtime.debounce(this.searchOnServer, 400, this);

		this.getEmitter().subscribe(EventType.mention.onAddUserToChat, this.onAddUserToChat);

		void this.initChatParticipants();
	},
	beforeUnmount()
	{
		this.getEmitter().unsubscribe(EventType.mention.onAddUserToChat, this.onAddUserToChat);
	},
	methods:
	{
		async initChatParticipants()
		{
			this.isLoading = true;

			await this.loadChatParticipants();

			const participantsIdsFromRecent = await this.getRecentParticipantsIds();
			this.addParticipants(participantsIdsFromRecent);

			this.isLoading = false;
		},
		getRecentParticipantsIds(): Promise<string[]>
		{
			const participantsService = new ParticipantsService();

			return participantsService.getRecentIds(this.dialogId);
		},
		onAddUserToChat(event: BaseEvent<{ userId: string }>)
		{
			const { userId } = event.getData();

			this.participantsIds.add(userId);
		},
		initSettings()
		{
			const settings: SettingsCollection = Extension.getSettings('im.v2.component.textarea');
			const defaultMinTokenSize = 3;
			this.minTokenSize = settings.get('minSearchTokenSize', defaultMinTokenSize);
		},
		async loadChatParticipants()
		{
			this.chatParticipants = await this.searchService.loadChatParticipants(this.dialogId);
			this.addParticipants(this.chatParticipants);
			this.searchResult = this.chatParticipants;
			this.chatParticipantsLoaded = true;
		},
		async searchOnServer(query: string)
		{
			this.currentServerQueries++;
			try
			{
				const { dialogIds, participantDialogIds } = await this.searchService.search(query);
				if (query !== this.preparedQuery)
				{
					return;
				}

				this.addParticipants(participantDialogIds);

				this.searchResult = [...new Set([...this.searchResult, ...dialogIds])];
			}
			finally
			{
				this.currentServerQueries--;
				this.stopLoader();
			}
		},
		async startSearch(query: string)
		{
			if (query.length > 0)
			{
				const dialogIds = this.searchService.searchLocal(query);
				if (query !== this.preparedQuery)
				{
					return;
				}

				this.searchResult = this.appendResult(dialogIds);
			}

			if (query.length >= this.minTokenSize)
			{
				this.isLoading = true;
				await this.searchOnServerDelayed(query);
			}

			if (query.length === 0)
			{
				this.cleanSearchResult();
			}
		},
		stopLoader()
		{
			if (this.currentServerQueries > 0)
			{
				return;
			}

			this.isLoading = false;
		},
		cleanSearchResult()
		{
			this.searchResult = this.chatParticipants;
		},
		async adjustPosition()
		{
			await this.$nextTick();
			this.$emit('adjustPosition');
		},
		appendResult(newItems: string[]): string[]
		{
			const filtered = this.searchResult.filter((dialogId) => newItems.includes(dialogId));

			return [...new Set([...filtered, ...newItems])];
		},
		isChat(dialogId: string): boolean
		{
			return dialogId.startsWith('chat');
		},
		formattedDynamicItems(items: string[]): MentionItemType[]
		{
			return items.map((dialogId) => {
				return (new MentionItemFormatter(dialogId)).format();
			});
		},
		addParticipants(items: string[])
		{
			items.forEach((userId) => this.participantsIds.add(userId));
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-mention-popup-content__container">
			<LoadingState v-if="isLoading" />
			<MentionItemsContainer
				v-else
				:dialogId="dialogId"
				:query="query"
				:items="items"
				:participantsIds="participantsIds"
				@close="$emit('close')"
			/>
			<SearchEmptyState v-if="isSearchEmptyState" />
			<ContentFooter :isLoading="isLoading" />
		</div>
	`,
};
