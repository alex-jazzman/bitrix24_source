import { reactive, ref } from 'ui.vue3';

export class SidebarStoreState
{
	constructor()
	{
		this.collections = ref([]);
		this.collectionsLoading = ref(false);
		this.collectionsCursor = ref(null);
		this.collectionsHasNextPage = ref(true);
		this.globalPermissions = reactive({
			canEditCollections: false,
			canEditGlobalPermissions: false,
			canImport: false,
			canImportWiki: false,
			hasManageableCollection: false,
		});
		this.selectedCollectionId = ref(null);
		this.selectedDocId = ref(null);
		this.selectedSharedView = ref(false);
		this.selectedArchiveView = ref(false);
		this.selectedRecycleBinView = ref(false);
		this.expandedDocs = reactive({});
		this.docsByParent = reactive({});
		this.docsLoadingByParent = reactive({});
		this.docsHasNextPageByParent = reactive({});
		this.docsOffsetByParent = reactive({});
		this.docsCursorByParent = reactive({});
		this.docsHydratedByParent = reactive({});
		this.docsStaleByParent = reactive({});
		this.docsRequestByParent = {};

		// Accessible-tree ("Shared with me") section — a branch namespace parallel to docsByParent,
		// keyed via sharedKey/sharedRootKey. The expanded flag lives here (not in feature uiState)
		// because the pull handler must read it to honour the lazy-load / mark-stale contract.
		this.sharedSectionExpanded = ref(false);
		this.sharedLoading = ref(false);
		this.sharedHydrated = ref(false);
		this.sharedStale = ref(false);
		// Bumped by every invalidation. A read that started before the bump must not report the
		// section fresh: its response predates the change that marked it stale. Plain counter —
		// nothing renders it.
		this.sharedStaleToken = 0;
		this.sharedHasNextPage = ref(false);
		this.sharedCursor = ref(null);
		this.sharedContainers = ref([]);
		this.sharedDocsByParent = reactive({});
		// Per-branch loading/cursor bookkeeping for the nested levels, mirroring docs*ByParent.
		// Root branches are excluded: they arrive with the section page and paginate globally.
		this.sharedDocsLoadingByParent = reactive({});
		this.sharedDocsHasNextPageByParent = reactive({});
		this.sharedDocsCursorByParent = reactive({});
		this.sharedDocsHydratedByParent = reactive({});
		this.sharedDocsRequestByParent = {};
		// Per-container disclosure, keyed by collectionId. Empty = every container collapsed by
		// default (mirrors the regular collection list), so the branch is revealed on demand.
		this.sharedExpandedContainers = reactive({});
		this.sharedRequest = null;

		// [P1] Favorites block. The list is server-owned and paginated by its own keyset cursor.
		this.favorites = ref([]);
		// Whether the block stands open. Here rather than inside the component drawing it, for the same
		// reason sharedSectionExpanded is here: the rail of the collapsed panel opens the block its entry
		// leads to, and the rail is drawn instead of that component, not around it.
		this.favoritesSectionExpanded = ref(true);
		this.favoritesLoading = ref(false);
		this.favoritesHydrated = ref(false);
		this.favoritesStale = ref(false);
		// The one read the block stays on screen for even with nothing to show: the page under a filter
		// just switched. Every other read leaves the visibility of the block to its contents - held up by
		// a read of its own, an empty block appeared for the length of every access push.
		this.favoritesFilterReloading = ref(false);
		// Bumped by every invalidation, same contract as sharedStaleToken: a read that started before
		// the bump must not report the list fresh.
		this.favoritesStaleToken = 0;
		this.favoritesHasNextPage = ref(false);
		this.favoritesCursor = ref(null);
		// Server-side filter of the block. Deliberately not persisted (AC-059).
		this.favoritesOnlyNotified = ref(false);
		this.favoritesError = ref(null);
		// [ERR-006] Which read failed. A failed next page is retried as a next page: re-reading the
		// first one would throw away the rows already on screen and put the user back at the top.
		this.favoritesErrorOnAppend = ref(false);
		// Stars ask this index, keyed `entityType:entityId`, because they also live on objects that are
		// on no loaded page of the block. Written per key only - never wiped as a whole, or a filtered
		// page would report everything it omits as unstarred.
		this.favoriteIndex = reactive({});
		// Toggles in flight, same keys: a second press must not put the same change on the wire twice.
		this.favoritesPending = reactive({});
		this.favoritesRequest = null;

		// [P2] Expansion space of the block, same keys. Deliberately separate from expandedDocs: the
		// same document may be open here and closed in the tree (AC-040). Only the flags are separate -
		// the branches themselves are read from docsByParent / sharedDocsByParent, so a branch already
		// loaded for the tree is not loaded again and an edit in the tree shows up here at once.
		this.favoritesExpanded = reactive({});
		// [P4] Coverage states (DTO-02) of the documents inside opened branches of the block, keyed by
		// document id. Read with API-06 once per branch: the branch responses of the tree carry no
		// notifications and must not - the tree itself draws no bells (AC-048).
		this.favoritesCoverage = reactive({});
		// Which branch each opened row reads, keyed the same way as favoritesExpanded:
		// `{ collectionId, parentId, expandVia }`. A subscription on a knowledge base (or on a subtree)
		// changes the coverage of every document under it, and re-reading that needs the branch
		// coordinates - the coverage map itself is keyed by document id and cannot give them back.
		// Not reactive: nothing renders it.
		this.favoritesBranchContext = {};
		// Notification writes in flight, keyed `entityType:entityId`: a second press must not race the
		// first, and the popover of the row disables its options while one is on the wire.
		this.favoritesNotifyPending = reactive({});
		// Branch of a block row that failed to load, same keys. Kept per row so the failure stays
		// inside the row it belongs to (ERR-005) instead of taking the whole block down.
		this.favoritesBranchError = reactive({});
	}
}
