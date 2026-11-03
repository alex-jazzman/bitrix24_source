import { IBaseRecentService } from '../base/type';

export interface ISearchService extends IBaseRecentService
{
	openSearch(): void;
}

declare type CommonSearchServiceProps = {
	/** Recent section of the tab. Absent when the tab is scoped to the composition of a folder. */
	recentTab?: string,
	/**
	 * Search the composition of the folder of the tab instead of a recent section. Declared by the
	 * tab, not derived from the folder id. Excluded by folderEligibleOnly: the two scopes are
	 * exclusive, and the eligibility rule wins.
	 */
	folderCompositionOnly?: boolean,
	/**
	 * Folder the server search is scoped to, read on every search - hence a getter in the config.
	 * Data, not intent: the scope is declared by folderCompositionOnly.
	 */
	folderId?: number,
	/** Ask the server to search by the folder eligibility rule instead of a recent section. */
	folderEligibleOnly?: boolean,
	sections?: string[],
	searchUsers?: boolean,
	parentId?: number | null,
};
