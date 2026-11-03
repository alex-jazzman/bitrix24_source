import { markRaw } from 'ui.vue3';
import { defineStore } from 'ui.vue3.pinia';

import { ObjectTypeFilter, SelectionMode, StageType, ViewMode } from '../../const/picker';
import {
	type EmptyReasonValue,
	type FileTypeFilterValue,
	type ObjectTypeFilterValue,
	type StageTypeValue,
	type ViewModeValue,
} from '../../const/types';
import { RequestGuard } from '../../lib/request-guard/request-guard';

import {
	type CurrentFolder,
	type DisplayBreadcrumb,
	type NavigationContext,
	type PickerConstraints,
	type PickerFeed,
	type SessionCallbacks,
	type SessionFilters,
} from './types';

const NOOP_CALLBACKS: SessionCallbacks = {
	suppressFilterFind: () => {},
	resetFilters: () => {},
	onContextInvalid: () => {},
	notify: () => {},
	emitSelection: () => {},
	requestCancel: () => {},
	setPreviewShown: () => {},
};

const DEFAULT_CONSTRAINTS: PickerConstraints = Object.freeze({
	signedConfig: null,
	allowedFileTypes: [],
	initialStage: null,
	selectionMode: SelectionMode.Single,
	maxItems: 1,
});

// Display breadcrumbs = server ancestors + the current folder appended, or an
// empty list outside a folder stage. The backend never puts the current folder
// into `breadcrumbs`; the client merges only for display.
function buildDisplayBreadcrumbs(context: NavigationContext | null): DisplayBreadcrumb[]
{
	const currentFolder: CurrentFolder | null = context?.currentFolder ?? null;
	if (context === null || currentFolder === null)
	{
		return [];
	}

	return [
		...context.breadcrumbs,
		{ objectId: currentFolder.folderId, name: currentFolder.name },
	];
}

function isSameFilters(current: SessionFilters, next: SessionFilters): boolean
{
	return current.objectTypeFilter === next.objectTypeFilter
		&& current.fileTypeFilters.length === next.fileTypeFilters.length
		&& current.fileTypeFilters.every((value, index) => value === next.fileTypeFilters[index]);
}

type SessionState = {
	stageType: StageTypeValue,
	storageId: number | null,
	folderId: number | null,
	breadcrumbs: DisplayBreadcrumb[],
	searchQuery: string,
	filterFind: string,
	searchOpen: boolean,
	objectTypeFilter: ObjectTypeFilterValue,
	fileTypeFilters: FileTypeFilterValue[],
	viewMode: ViewModeValue,
	initialized: boolean,
	contentLoading: boolean,
	preserveContentOnLoading: boolean,
	navigationPending: boolean,
	contentError: string | null,
	emptyReason: EmptyReasonValue,
	hasMore: boolean,
	page: number,
	loadingMore: boolean,
	emptyStreak: number,
	paginationStalled: boolean,
	confirming: boolean,
	confirmationEpoch: number,
	// ALG-01: armed by a control outside `files` about to vanish from its own
	// navigation (e.g. a breadcrumb link becoming the current folder).
	focusHandoffToFiles: boolean,
	// Counts every replacement of the list shown: the feed, the search query and the filters
	// each do that. A scenario that outlives its own list - loading the preview of a set is
	// the long one - reads the number before and after and gives up when it moved.
	feedRevision: number,
	constraints: PickerConstraints,
	callbacks: SessionCallbacks,
	guard: RequestGuard,
};

export const useSessionStore = defineStore('diskPickerSession', {
	state: (): SessionState => ({
		stageType: StageType.Recent,
		storageId: null,
		folderId: null,
		breadcrumbs: [],
		searchQuery: '',
		filterFind: '',
		searchOpen: false,
		objectTypeFilter: ObjectTypeFilter.All,
		fileTypeFilters: [],
		viewMode: ViewMode.List,
		initialized: false,
		contentLoading: false,
		preserveContentOnLoading: false,
		navigationPending: false,
		contentError: null,
		emptyReason: null,
		hasMore: false,
		page: 1,
		loadingMore: false,
		emptyStreak: 0,
		paginationStalled: false,
		confirming: false,
		confirmationEpoch: 0,
		focusHandoffToFiles: false,
		feedRevision: 0,
		constraints: DEFAULT_CONSTRAINTS,
		callbacks: markRaw({ ...NOOP_CALLBACKS }),
		// A per-session guard, non-reactive so its private token stays intact.
		guard: markRaw(new RequestGuard()),
	}),
	getters: {
		feed(): PickerFeed
		{
			return {
				stageType: this.stageType,
				storageId: this.storageId,
				folderId: this.folderId,
			};
		},
		filters(): SessionFilters
		{
			return {
				objectTypeFilter: this.objectTypeFilter,
				fileTypeFilters: this.fileTypeFilters,
			};
		},
		isFolderStage(): boolean
		{
			return this.stageType === StageType.Folder;
		},
	},
	actions: {
		nextRequestToken(): number
		{
			return this.guard.next();
		},
		isCurrentRequest(token: number): boolean
		{
			return this.guard.isCurrent(token);
		},
		isSessionActive(): boolean
		{
			return this.guard.isActive();
		},
		invalidateRequests(): void
		{
			this.guard.invalidate();
			this.invalidateConfirmation();
		},
		setConstraints(constraints: PickerConstraints): void
		{
			this.constraints = constraints;
		},
		setCallbacks(callbacks: SessionCallbacks): void
		{
			this.callbacks = markRaw(callbacks);
		},
		isSameFeed(feed: PickerFeed): boolean
		{
			return this.stageType === feed.stageType
				&& this.storageId === feed.storageId
				&& this.folderId === feed.folderId;
		},
		// Changing the feed resets pagination only; the picked set lives in its own
		// store and survives the feed change (ALG-03).
		setFeed(feed: PickerFeed): void
		{
			if (!this.isSameFeed(feed))
			{
				this.invalidateConfirmation();
				this.feedRevision += 1;
			}
			this.stageType = feed.stageType;
			this.storageId = feed.storageId;
			this.folderId = feed.folderId;
			this.resetPagination();
		},
		resetPagination(): void
		{
			this.page = 1;
			this.loadingMore = false;
			this.emptyStreak = 0;
			this.paginationStalled = false;
		},
		setPage(page: number): void
		{
			this.page = page;
		},
		setLoadingMore(loading: boolean): void
		{
			this.loadingMore = loading;
		},
		setEmptyStreak(streak: number): void
		{
			this.emptyStreak = streak;
		},
		setPaginationStalled(stalled: boolean): void
		{
			this.paginationStalled = stalled;
		},
		setFilters(filters: SessionFilters): void
		{
			if (!isSameFilters(this.filters, filters))
			{
				this.feedRevision += 1;
			}
			this.objectTypeFilter = filters.objectTypeFilter;
			this.fileTypeFilters = [...filters.fileTypeFilters];
		},
		setSearchQuery(query: string): void
		{
			if (this.searchQuery !== query)
			{
				this.feedRevision += 1;
			}
			this.searchQuery = query;
		},
		setFilterFind(find: string): void
		{
			this.filterFind = find.trim();
		},
		setSearchOpen(open: boolean): void
		{
			this.searchOpen = open;
		},
		resetSearchQuery(): void
		{
			this.setSearchQuery('');
		},
		setViewMode(mode: ViewModeValue): void
		{
			this.viewMode = mode;
		},
		setBreadcrumbs(breadcrumbs: DisplayBreadcrumb[]): void
		{
			this.breadcrumbs = [...breadcrumbs];
		},
		setBreadcrumbsFromContext(context: NavigationContext | null): void
		{
			this.breadcrumbs = buildDisplayBreadcrumbs(context);
		},
		setHasMore(hasMore: boolean): void
		{
			this.hasMore = hasMore;
		},
		setLoading(loading: boolean): void
		{
			this.contentLoading = loading;
			if (!loading)
			{
				this.preserveContentOnLoading = false;
			}
		},
		setPreserveContentOnLoading(preserve: boolean): void
		{
			this.preserveContentOnLoading = preserve;
		},
		setNavigationPending(pending: boolean): void
		{
			this.navigationPending = pending;
		},
		requestFocusHandoffToFiles(): void
		{
			this.focusHandoffToFiles = true;
		},
		consumeFocusHandoffToFiles(): boolean
		{
			const requested = this.focusHandoffToFiles;
			this.focusHandoffToFiles = false;

			return requested;
		},
		markInitialized(): void
		{
			this.initialized = true;
		},
		setContentError(code: string | null): void
		{
			this.contentError = code;
		},
		clearContentError(): void
		{
			this.contentError = null;
		},
		setEmptyReason(reason: EmptyReasonValue): void
		{
			this.emptyReason = reason;
		},
		setConfirming(confirming: boolean): void
		{
			this.confirming = confirming;
		},
		nextConfirmationToken(): number
		{
			this.confirmationEpoch += 1;

			return this.confirmationEpoch;
		},
		isCurrentConfirmation(token: number): boolean
		{
			return this.isSessionActive() && token === this.confirmationEpoch;
		},
		invalidateConfirmation(): void
		{
			this.confirmationEpoch += 1;
			this.confirming = false;
		},
	},
});
