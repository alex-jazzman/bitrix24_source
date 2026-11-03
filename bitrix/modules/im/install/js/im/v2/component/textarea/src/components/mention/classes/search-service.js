import { Core } from 'im.v2.application.core';
import { UserType } from 'im.v2.const';
import { FeatureManager, Feature } from 'im.v2.lib.feature';
import { LocalSearch, MentionStateStore, SearchItemOrigin, sortByDate } from 'im.v2.lib.search';

import { BaseServerSearch } from './search/base-search';

import type { ImModelUser } from 'im.v2.model';
import type { LocalSearchItemOrigin, MentionSearchConfigType, SearchResultItem } from 'im.v2.lib.search';
import type { SearchOutcomeType } from './search/base-search';

export { SearchOutcome } from './search/base-search';
export type { SearchOutcomeType } from './search/base-search';

// The server scope of such a viewer is not 'everyone internal' but a personal one - common chats for a
// guest, shared workgroups for an extranet user and a collaber, down to an empty result - and the client
// has no data to reproduce it, so the extended pool stays off and the search goes to the server.
const ViewerTypesWithoutTabMemoryPool = new Set([UserType.guest, UserType.extranet, UserType.collaber]);

export type MentionSearchResult = {
	dialogIds: string[],
	participantDialogIds: string[],
	outcome: SearchOutcomeType,
};

export class MentionSearchService
{
	#localSearch: LocalSearch;
	#localSearchConfig: MentionSearchConfigType;
	#baseServerSearch: BaseServerSearch;
	// the pool the local search runs over, marked by the part of it every item came from
	#localCollection: Map<string, SearchResultItem> = new Map();

	constructor(searchConfig: MentionSearchConfigType)
	{
		this.#localSearchConfig = this.#getLocalSearchConfig(searchConfig);
		this.#localSearch = new LocalSearch(this.#localSearchConfig);
		this.#baseServerSearch = new BaseServerSearch(searchConfig);
	}

	#getLocalSearchConfig(searchConfig: MentionSearchConfigType): MentionSearchConfigType
	{
		if (!FeatureManager.isFeatureAvailable(Feature.isMentionInstantSearchAvailable))
		{
			return searchConfig;
		}

		if (!this.#canViewerUseTabMemoryPool())
		{
			return searchConfig;
		}

		return { ...searchConfig, withTabMemoryPool: true };
	}

	#canViewerUseTabMemoryPool(): boolean
	{
		const viewer: ?ImModelUser = Core.getStore().getters['users/get'](Core.getUserId());

		return Boolean(viewer) && !ViewerTypesWithoutTabMemoryPool.has(viewer.type);
	}

	async loadChatParticipants(dialogId: string): Promise<string[]>
	{
		const items = await this.#baseServerSearch.loadChatParticipants(dialogId);

		this.#forgetParticipantsOutside(items);
		this.#rememberItems(items, SearchItemOrigin.chatParticipants);

		const participants = this.#getDialogIds(items);
		this.#getStateStore()?.setChatParticipants(dialogId, participants);

		return participants;
	}

	// The composition replaces the previous one as a whole, and the mark of a participant is the strongest
	// one there is: whoever has left the chat keeps their place in the pool but goes back to the memory of
	// the tab, so the filter asks them for the verdicts of the server as it does for anybody from there.
	#forgetParticipantsOutside(items: SearchResultItem[])
	{
		const participants = new Set(this.#getDialogIds(items));

		this.#localCollection.forEach((item, dialogId) => {
			if (item.origin === SearchItemOrigin.chatParticipants && !participants.has(dialogId))
			{
				this.#localCollection.set(dialogId, { ...item, origin: SearchItemOrigin.tabMemory });
			}
		});
	}

	// The composition loaded in a previous open of the list, if the tab has one. It goes back into the
	// pool as well: a participant of the chat whom no answer of this open has brought yet would otherwise
	// reach the local search as the memory of the tab, and the filter asks that part for the verdicts of
	// the server - the external participant of the current chat would be shown and not found.
	restoreChatParticipants(dialogId: string): ?string[]
	{
		const participants = this.#getStateStore()?.getChatParticipants(dialogId) ?? null;
		if (participants === null)
		{
			return null;
		}

		this.#rememberItems(this.#toPoolItems(participants), SearchItemOrigin.chatParticipants);

		return participants;
	}

	#toPoolItems(dialogIds: string[]): SearchResultItem[]
	{
		return dialogIds.map((dialogId) => {
			return { dialogId };
		});
	}

	// the store of the tab is a part of the risky branch, so it is reached only through the same
	// configuration flag as the extended pool
	#getStateStore(): ?MentionStateStore
	{
		return this.#localSearchConfig.withTabMemoryPool ? MentionStateStore.getInstance() : null;
	}

	// with the tab memory pool the library sorts its own result, and sorting it again is not free:
	// people from the tab memory have no date, and the comparator pays with getters on every pair
	searchLocal(query: string): string[]
	{
		const localCollection = [...this.#localCollection.values()];
		const result = this.#localSearch.search(query, localCollection);
		const sortedResult = this.#localSearchConfig.withTabMemoryPool ? result : sortByDate(result);

		return this.#getDialogIds(sortedResult);
	}

	async search(query: string): Promise<MentionSearchResult>
	{
		const { items, outcome } = await this.#baseServerSearch.search(query);
		// whoever an answer of the search brought belongs to the memory of the tab and not to the
		// composition of the chat: the visibility filter asks such a person for the verdicts of the server
		this.#rememberItems(items, SearchItemOrigin.tabMemory);

		return {
			dialogIds: this.#getDialogIds(items),
			participantDialogIds: this.#getParticipantDialogIds(items),
			outcome,
		};
	}

	// The part of the pool an item came from is known here and nowhere else, so the item reaches the
	// library already marked. The mark of the strongest part wins, as it does when the library merges the
	// parts: a participant of the chat stays one even when an answer of the search brings them again.
	#rememberItems(items: SearchResultItem[], origin: LocalSearchItemOrigin)
	{
		items.forEach((searchItem) => {
			const knownOrigin = this.#localCollection.get(searchItem.dialogId)?.origin;
			const isKnownAsParticipant = knownOrigin === SearchItemOrigin.chatParticipants;

			this.#localCollection.set(searchItem.dialogId, {
				...searchItem,
				origin: isKnownAsParticipant ? knownOrigin : origin,
			});
		});
	}

	#getDialogIds(items: SearchResultItem[]): string[]
	{
		return items.map((item) => item.dialogId);
	}

	#getParticipantDialogIds(items: SearchResultItem[]): string[]
	{
		const chatParticipants = items.filter((item) => item.isChatParticipant);

		return chatParticipants.map((item) => item.dialogId);
	}
}
