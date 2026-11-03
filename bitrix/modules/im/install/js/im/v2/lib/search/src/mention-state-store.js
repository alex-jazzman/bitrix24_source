// The state the mention list keeps for as long as the tab lives: which people belong to which chat.
// Nothing else goes here - people and chats themselves live in the models of the tab, and a second copy
// of them would age on its own. No browser storage either: reloading the tab drops the state by itself.
export class MentionStateStore
{
	static #instance: MentionStateStore;

	#chatParticipants: Map<string, string[]> = new Map();

	static getInstance(): MentionStateStore
	{
		MentionStateStore.#instance = MentionStateStore.#instance ?? new MentionStateStore();

		return MentionStateStore.#instance;
	}

	// null means the composition has never been loaded in this tab: it has to be requested
	getChatParticipants(dialogId: string): ?string[]
	{
		return this.#chatParticipants.get(dialogId) ?? null;
	}

	setChatParticipants(dialogId: string, participants: string[]): void
	{
		this.#chatParticipants.set(dialogId, participants);
	}

	// tests only: the product code never resets the state
	clear(): void
	{
		this.#chatParticipants.clear();
	}
}
