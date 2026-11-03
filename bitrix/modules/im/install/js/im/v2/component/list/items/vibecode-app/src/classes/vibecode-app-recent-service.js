import { RecentType, RestMethod, type RecentTypeItem } from 'im.v2.const';
import { BaseRecentService, type BaseRecentQueryParams } from 'im.v2.provider.service.recent';

// Tail loader for the system "Applications" folder.
// The folder holds exactly one recent section (RecentType.vibecodeApp), so the sectioned path of the
// base class fits as is: saveRecentItems() and getCollection() are deliberately NOT overridden.
export class VibecodeAppRecentService extends BaseRecentService
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

	getRecentType(): RecentTypeItem
	{
		return RecentType.vibecodeApp;
	}
}
