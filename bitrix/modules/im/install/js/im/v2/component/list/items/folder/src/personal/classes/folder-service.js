import { Core } from 'im.v2.application.core';
import { RestMethod, FolderType } from 'im.v2.const';
import { type ImModelFolder } from 'im.v2.model';
import {
	BaseRecentService,
	type BaseRecentFilterParams,
	type BaseRecentQueryParams,
	type RecentRestResult,
} from 'im.v2.provider.service.recent';

export class FolderRecentService extends BaseRecentService
{
	static #instances: Map<number, FolderRecentService> = new Map();

	#folderId: number;
	#tailLoaded: boolean = false;
	#firstPageRequest: ?Promise = null;
	// The composition the tail request went out with: the answer it brings back speaks for these
	// members and for nobody who joined the folder later.
	#requestedDialogIds: Set<string> = new Set();
	// Comes from onAfterRequest(), which the base service calls before it saves the response: until
	// a request says otherwise, the response being saved is the first page.
	#savingFirstPage: boolean = true;

	constructor(props: { folderId: number })
	{
		super(props);

		this.#folderId = props.folderId;
	}

	// One service per folder: the list component is recreated on every folder entry, so what the
	// service already knows about the loaded tail has to outlive it.
	static getInstance(folderId: number): FolderRecentService
	{
		if (!FolderRecentService.#hasUsableInstance(folderId))
		{
			FolderRecentService.#dropInstancesOfDeletedFolders();
			FolderRecentService.#instances.set(folderId, new FolderRecentService({ folderId }));
		}

		return FolderRecentService.#instances.get(folderId);
	}

	static dropInstance(folderId: number): void
	{
		FolderRecentService.#instances.delete(folderId);
	}

	// Usable means the folder is still in the model: a service kept from its previous life describes
	// rows of a folder that is gone.
	static #hasUsableInstance(folderId: number): boolean
	{
		if (!FolderRecentService.#instances.has(folderId))
		{
			return false;
		}

		return Boolean(Core.getStore().getters['recent/folders/getById'](folderId));
	}

	// A deleted folder never asks for its service again, so there is nothing to react to: stale
	// instances are taken out lazily, when the registry is about to take in another service.
	static #dropInstancesOfDeletedFolders(): void
	{
		[...FolderRecentService.#instances.keys()].forEach((folderId: number) => {
			const folder: ?ImModelFolder = Core.getStore().getters['recent/folders/getById'](folderId);
			if (!folder)
			{
				FolderRecentService.#instances.delete(folderId);
			}
		});
	}

	isTailLoaded(): boolean
	{
		return this.#tailLoaded;
	}

	// A loaded tail is enough while the folder is still the one it was asked for: a composition that
	// changed since then holds a member the answer never spoke about, so the next entry into the
	// folder goes for the tail again.
	isStateComplete(): boolean
	{
		if (!this.#tailLoaded)
		{
			return false;
		}

		const currentDialogIds = this.#getFolderDialogIds();

		return new Set(currentDialogIds).size === this.#requestedDialogIds.size
			&& currentDialogIds.every((dialogId: string) => this.#requestedDialogIds.has(dialogId));
	}

	// Whether to go for the tail is decided here and not in the list component: the component is
	// recreated on every entry into the folder, so a return made while the request is still in flight
	// would ask for the same page again. The second caller waits for the request of the first one, and
	// the field is cleared on any outcome - a refused request has to leave the folder loadable.
	loadFirstPage(): Promise
	{
		this.#firstPageRequest ??= this.#requestFirstPage();

		return this.#firstPageRequest;
	}

	#requestFirstPage(): Promise
	{
		// The flag and the snapshot belong to one answer, so the request in flight invalidates both:
		// there is no loaded tail until this request is saved.
		this.#tailLoaded = false;
		this.#requestedDialogIds = new Set(this.#getFolderDialogIds());

		return super.loadFirstPage().finally(() => {
			this.#firstPageRequest = null;
		});
	}

	onAfterRequest(firstPage: boolean): void
	{
		super.onAfterRequest(firstPage);

		this.#savingFirstPage = firstPage;
	}

	getRestMethodName(firstPage: boolean): string
	{
		return RestMethod.imV2FolderRecentTail;
	}

	// One page covers the whole folder only while this limit matches the server ceiling on folder
	// members (both 50): raise the ceiling and the members past the page count as left out by the tail.
	getQueryParams(firstPage: boolean = false): BaseRecentQueryParams
	{
		return {
			folderId: this.#folderId,
			limit: this.getItemsPerPage(),
			filter: this.getRequestFilter(firstPage),
		};
	}

	getRequestFilter(firstPage: boolean = false): BaseRecentFilterParams
	{
		return {
			lastMessageDate: firstPage ? null : this.getLastMessageDate(),
		};
	}

	// The tail counts as loaded only once its rows are in the recent collection: the flag decides
	// whether the folder requests the tail again, so a save that did not go through must not set it.
	async saveRecentItems(restResult: RecentRestResult): Promise
	{
		const { recentItems } = restResult;

		const returnedDialogIds = await Core.getStore().dispatch('recent/set', recentItems);

		if (this.#savingFirstPage)
		{
			this.#hideChatsMissingFromTail(returnedDialogIds);
			this.#tailLoaded = true;
		}

		return returnedDialogIds;
	}

	// Server tail is hide-aware: it returns only folder members the user can still see. A member the
	// request went out with but absent from the tail is hidden or left, so it gets the hidden status -
	// otherwise a chat another section put into the shared recent collection shows up in the folder.
	// Both bounds are needed. The snapshot keeps out a chat that joined the folder while the request was
	// out: the answer never spoke about it, and the status set here is never taken back. The composition
	// as it is now keeps out a chat that left the folder in the same window: the hidden status is a single
	// set shared by every list, so hiding it here would take its row out of the lists that still hold it.
	#hideChatsMissingFromTail(returnedDialogIds: string[]): void
	{
		const returnedIdSet = new Set(returnedDialogIds);
		const currentIdSet = new Set(this.#getFolderDialogIds());
		const missingDialogIds = [...this.#requestedDialogIds].filter((dialogId: string) => {
			return !returnedIdSet.has(dialogId) && currentIdSet.has(dialogId);
		});

		if (missingDialogIds.length === 0)
		{
			return;
		}

		void Core.getStore().dispatch('recent/setHiddenStatus', { ids: missingDialogIds, hidden: true });
	}

	// Only a personal folder has a composition of its own: a system folder gathers its members by
	// recentSection, so there is no list of dialogIds to compare anything against.
	#getFolderDialogIds(): string[]
	{
		const folder: ?ImModelFolder = Core.getStore().getters['recent/folders/getById'](this.#folderId);
		if (folder?.type !== FolderType.personal)
		{
			return [];
		}

		return folder.definition.chats.map((chat) => chat.dialogId);
	}
}
