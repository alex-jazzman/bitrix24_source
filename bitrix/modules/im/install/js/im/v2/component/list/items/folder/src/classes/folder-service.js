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
	#folderId: number;

	constructor(props: { folderId: number })
	{
		super(props);

		this.#folderId = props.folderId;
	}

	getRestMethodName(firstPage: boolean): string
	{
		return RestMethod.imV2FolderRecentTail;
	}

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

	async saveRecentItems(restResult: RecentRestResult): Promise
	{
		const { recentItems } = restResult;

		const returnedDialogIds = await Core.getStore().dispatch('recent/set', recentItems);

		this.#hideChatsMissingFromTail(returnedDialogIds);

		return returnedDialogIds;
	}

	// Server tail is hide-aware: it returns only folder members the user can still see.
	// Members listed in the folder definition but absent from the tail are hidden/left,
	// so mark them hidden. Otherwise a channel that another section (e.g. the channels list)
	// loaded into the shared recent collection would reappear in the folder after reload.
	#hideChatsMissingFromTail(returnedDialogIds: string[]): void
	{
		const folder: ?ImModelFolder = Core.getStore().getters['recent/folders/getById'](this.#folderId);
		if (folder?.type !== FolderType.personal)
		{
			return;
		}

		const returnedIdSet = new Set(returnedDialogIds);
		const missingDialogIds = folder.definition.chats
			.map((chat) => chat.dialogId)
			.filter((dialogId) => !returnedIdSet.has(dialogId));

		if (missingDialogIds.length === 0)
		{
			return;
		}

		void Core.getStore().dispatch('recent/setHiddenStatus', { ids: missingDialogIds, hidden: true });
	}
}
