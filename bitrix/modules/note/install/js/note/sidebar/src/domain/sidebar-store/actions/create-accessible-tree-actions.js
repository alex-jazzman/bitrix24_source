import { sortDocuments } from '../shared/document-utils';
import { PAGE_SIZE } from '../shared/constants';
import { parseSharedKey } from '../shared/keys';
import type { SidebarDocument } from '../../../type';
import type { SidebarApi } from '../../../services/sidebar-api';

// Safety net for a page that came back empty with a live cursor: the section renders nothing then,
// so the scroll sentinel can never come into view and paging would stop for good. The server already
// walks such pages itself; this bounds the walk on the client for whatever is left past its cap.
const EMPTY_PAGE_WALK_LIMIT = 10;

// The SECTION walk is short because it is no longer the only way forward: its sentinel is watched
// for visibility, so an empty section keeps paging by itself, one request at a time, for as long as
// it is on screen. Reaching a distant first branch is therefore a matter of time rather than of this
// limit — and each round here multiplies with the server's own page cap, so a burst is pure cost.
const SECTION_EMPTY_PAGE_WALK_LIMIT = 2;

// [P2] Accessible-tree ("Shared with me") section: lazy-loaded, pull-refreshed pruned tree of
// documents reachable via document-level grants only. Lives in its own branch namespace
// (sharedDocsByParent, keyed via sharedKey/sharedRootKey) so TreeNode.getChildren reads the
// accessible branch without ever mixing with the regular collection tree.
export class SidebarAccessibleTreeActions
{
	#api: SidebarApi;
	#state;
	#sharedKey: (collectionId: number, parentId: number | null) => string;
	#sharedRootKey: (collectionId: number) => string;
	#setError: (message: string) => void;
	#onBranchesDropped;

	constructor({ api, state, sharedKey, sharedRootKey, setError, onBranchesDropped }: {
		api: SidebarApi,
		state: Object,
		sharedKey: (collectionId: number, parentId: number | null) => string,
		sharedRootKey: (collectionId: number) => string,
		setError: (message: string) => void,
		// Told whenever branches of this namespace stop being trustworthy - dropped outright, or kept
		// on screen but marked for re-reading - so a place drawing one of them reads it again instead
		// of showing an opened row with nothing under it, or with what used to be under it.
		onBranchesDropped?: (keys: string[]) => void,
	})
	{
		this.#api = api;
		this.#state = state;
		this.#sharedKey = sharedKey;
		this.#sharedRootKey = sharedRootKey;
		this.#setError = setError;
		this.#onBranchesDropped = onBranchesDropped ?? (() => {});
	}

	getSharedChildren(collectionId: number, parentId: number | null = null): SidebarDocument[]
	{
		const key = this.#sharedKey(collectionId, parentId);

		return this.#state.sharedDocsByParent[key] || [];
	}

	// Per-container disclosure — collapsed by default, mirroring the regular collection list.
	isSharedContainerExpanded(collectionId: number): boolean
	{
		return this.#state.sharedExpandedContainers[Number(collectionId)] === true;
	}

	toggleSharedContainer(collectionId: number): void
	{
		const id = Number(collectionId);
		this.#state.sharedExpandedContainers[id] = !this.#state.sharedExpandedContainers[id];
	}

	// Nested branches load per parent, exactly like the collection tree; root branches arrive with
	// the section page and paginate globally, so they never report their own loading/next state.
	isSharedChildrenLoading(collectionId: number, parentId: number | null = null): boolean
	{
		if (parentId === null)
		{
			return false;
		}

		return this.#state.sharedDocsLoadingByParent[this.#sharedKey(collectionId, parentId)] === true;
	}

	hasNextSharedChildren(collectionId: number, parentId: number | null = null): boolean
	{
		if (parentId === null)
		{
			return false;
		}

		return this.#state.sharedDocsHasNextPageByParent[this.#sharedKey(collectionId, parentId)] === true;
	}

	// Whether the branch has actually been read. The favorites block asks it to tell an empty branch
	// (a valid answer) from a branch whose read failed.
	isSharedBranchHydrated(collectionId: number, parentId: number): boolean
	{
		return this.#state.sharedDocsHydratedByParent[this.#sharedKey(collectionId, parentId)] === true;
	}

	toggleSharedDocExpanded(doc: SidebarDocument): void
	{
		const docId = Number(doc?.id);
		if (!Number.isFinite(docId) || docId <= 0)
		{
			return;
		}

		const isNextExpanded = !this.#state.expandedDocs[docId];
		this.#state.expandedDocs[docId] = isNextExpanded;
		if (isNextExpanded)
		{
			void this.prefetchSharedChildren(doc);

			return;
		}

		this.#clearExpandedBranch(Number(doc?.collectionId), docId);
	}

	// Hover/expand entry point — one request per branch, then served from the namespace.
	async prefetchSharedChildren(doc: SidebarDocument): Promise<void>
	{
		const collectionId = Number(doc?.collectionId);
		const parentId = Number(doc?.id);
		if (
			!Number.isFinite(collectionId) || collectionId <= 0
			|| !Number.isFinite(parentId) || parentId <= 0
		)
		{
			return;
		}

		if (this.#state.sharedDocsHydratedByParent[this.#sharedKey(collectionId, parentId)] === true)
		{
			return;
		}

		await this.loadSharedChildren(collectionId, parentId, false);
	}

	async loadMoreSharedChildren(doc: SidebarDocument): Promise<void>
	{
		const collectionId = Number(doc?.collectionId);
		const parentId = Number(doc?.id);
		if (
			!Number.isFinite(collectionId) || collectionId <= 0
			|| !Number.isFinite(parentId) || parentId <= 0
		)
		{
			return;
		}

		const key = this.#sharedKey(collectionId, parentId);
		if (
			this.#state.sharedDocsLoadingByParent[key] === true
			|| this.#state.sharedDocsHasNextPageByParent[key] !== true
		)
		{
			return;
		}

		await this.loadSharedChildren(collectionId, parentId, true);
	}

	async loadSharedChildren(collectionId: number, parentId: number, append: boolean = false): Promise<void>
	{
		const key = this.#sharedKey(collectionId, parentId);
		// Coalesce concurrent first loads (hover + expand fire together on a click).
		if (!append && this.#state.sharedDocsRequestByParent[key])
		{
			await this.#state.sharedDocsRequestByParent[key];

			return;
		}

		const request = this.#loadSharedChildrenRequest(collectionId, parentId, append, key);
		if (append)
		{
			await request;

			return;
		}

		this.#state.sharedDocsRequestByParent[key] = request;
		try
		{
			await request;
		}
		finally
		{
			if (this.#state.sharedDocsRequestByParent[key] === request)
			{
				delete this.#state.sharedDocsRequestByParent[key];
			}
		}
	}

	async #loadSharedChildrenRequest(
		collectionId: number,
		parentId: number,
		append: boolean,
		key: string,
	): Promise<void>
	{
		this.#state.sharedDocsLoadingByParent[key] = true;
		try
		{
			let cursor = append ? (this.#state.sharedDocsCursorByParent[key] || null) : null;
			let appendPage = append;
			let walked = 0;

			// Same trap as the section page: a child window emptied by the access filter comes back
			// with a live cursor, and an expanded branch showing nothing produces no scroll, so the
			// sentinel would never fire. Walk it here instead of leaving the branch look childless.
			do
			{
				const response = await this.#api.listAccessibleChildren(collectionId, parentId, { limit: PAGE_SIZE, cursor });
				const merged = appendPage
					? this.#mergeSharedDocs(this.#state.sharedDocsByParent[key] || [], response.items)
					: response.items
				;
				this.#state.sharedDocsByParent[key] = sortDocuments(merged);
				cursor = response.nextCursor || null;
				this.#state.sharedDocsCursorByParent[key] = cursor;
				this.#state.sharedDocsHasNextPageByParent[key] = response.hasNextPage;
				this.#state.sharedDocsHydratedByParent[key] = true;
				appendPage = true;
				walked++;
			}
			while (
				cursor !== null
				&& (this.#state.sharedDocsByParent[key] || []).length === 0
				&& walked < EMPTY_PAGE_WALK_LIMIT
			);

			// Detached on purpose: the branch is filled and must stop showing a spinner, its expanded
			// descendants refill behind it.
			void this.#refetchExpandedBranches(this.#state.sharedDocsByParent[key]);
		}
		catch (error)
		{
			this.#setError(error?.message || 'Accessible children loading failed');
		}
		finally
		{
			this.#state.sharedDocsLoadingByParent[key] = false;
		}
	}

	// A branch that stays expanded across a section reload (pull cascade) must fill itself again:
	// the reload drops every nested branch, and without this the user would stare at an empty
	// disclosure until hovering it. Recursion happens naturally — each restored level restores its
	// own expanded children.
	//
	// One branch at a time: a wide expanded tree would otherwise put every branch on the wire at
	// once on every cascade, and each of those requests can itself walk several server pages.
	async #refetchExpandedBranches(docs: SidebarDocument[]): Promise<void>
	{
		for (const doc of docs)
		{
			if (this.#state.expandedDocs[Number(doc?.id)] === true)
			{
				// eslint-disable-next-line no-await-in-loop
				await this.prefetchSharedChildren(doc);
			}
		}
	}

	#mergeSharedDocs(current: SidebarDocument[], incoming: SidebarDocument[]): SidebarDocument[]
	{
		const merged = [...current];
		for (const doc of incoming)
		{
			const index = merged.findIndex((item) => Number(item.id) === Number(doc.id));
			if (index >= 0)
			{
				merged[index] = { ...merged[index], ...doc };

				continue;
			}

			merged.push(doc);
		}

		return merged;
	}

	#clearExpandedBranch(collectionId: number, parentDocId: number): void
	{
		const children = this.getSharedChildren(collectionId, parentDocId);
		for (const child of children)
		{
			const childId = Number(child.id);
			delete this.#state.expandedDocs[childId];
			this.#clearExpandedBranch(collectionId, childId);
		}
	}

	async toggleSharedSection(): Promise<void>
	{
		const nextExpanded = !this.#state.sharedSectionExpanded.value;
		this.#state.sharedSectionExpanded.value = nextExpanded;
		if (nextExpanded)
		{
			await this.ensureSharedLoaded();
		}
	}

	// Lazy entry point: the first expand (or the next expand after a pull marked the set stale)
	// triggers the API-03 request; a collapsed section never touches the network.
	async ensureSharedLoaded(): Promise<void>
	{
		if (this.#state.sharedHydrated.value && !this.#state.sharedStale.value)
		{
			return;
		}

		await this.loadSharedTree(false);
	}

	async loadMoreSharedTree(): Promise<void>
	{
		if (
			this.#state.sharedLoading.value
			|| !this.#state.sharedHasNextPage.value
			|| this.#state.sharedCursor.value === null
		)
		{
			return;
		}

		await this.loadSharedTree(true);
	}

	async loadSharedTree(append: boolean = false): Promise<void>
	{
		// Coalesce concurrent (re)loads — this is what keeps a double-delivered documentAccessCascade
		// (personal channel path 1 + path 2) from firing two overlapping refetches.
		while (!append && this.#state.sharedRequest)
		{
			await this.#state.sharedRequest;
			if (!this.#state.sharedStale.value)
			{
				return;
			}

			// Still stale: the read we waited on had already started when the invalidation landed, so
			// its result is out of date. Loop instead of falling through — with several callers parked
			// here they would otherwise each start a read of their own; this way the first one to wake
			// issues it and the rest park on that one.
		}

		const request = this.#loadSharedTreeRequest(append);
		if (append)
		{
			await request;

			return;
		}

		this.#state.sharedRequest = request;
		try
		{
			await request;
		}
		finally
		{
			if (this.#state.sharedRequest === request)
			{
				this.#state.sharedRequest = null;
			}
		}
	}

	async #loadSharedTreeRequest(append: boolean): Promise<void>
	{
		this.#state.sharedLoading.value = true;
		// Snapshotted before the first request goes out: an invalidation that lands while it is in
		// flight makes the response obsolete on arrival, and clearing the flag then would swallow the
		// cascade for good.
		const staleToken = this.#state.sharedStaleToken;
		try
		{
			let afterCursor = append ? this.#state.sharedCursor.value : null;
			let appendPage = append;
			let walked = 0;

			do
			{
				const response = await this.#api.listAccessibleTree({ limit: PAGE_SIZE, afterCursor });
				this.#hydrateAccessibleTree(response, appendPage);
				afterCursor = response.nextCursor || null;
				this.#state.sharedCursor.value = afterCursor;
				this.#state.sharedHasNextPage.value = afterCursor !== null;
				if (walked === 0)
				{
					// Cleared by the first response only, and only when nothing invalidated the section
					// meanwhile: a pull cascade that lands during the walk must keep the set stale, so
					// the next expand refetches it.
					this.#state.sharedHydrated.value = true;
					if (this.#state.sharedStaleToken === staleToken)
					{
						this.#state.sharedStale.value = false;
					}
				}
				// Pages after the first one extend the section instead of replacing it, otherwise the
				// walk would wipe the rows it just found.
				appendPage = true;
				walked++;
			}
			while (
				afterCursor !== null
				&& this.#state.sharedContainers.value.length === 0
				&& walked < SECTION_EMPTY_PAGE_WALK_LIMIT
			);
		}
		catch (error)
		{
			this.#setError(error?.message || 'Accessible tree loading failed');
		}
		finally
		{
			this.#state.sharedLoading.value = false;
		}
	}

	// Branches a section page carries, in the coordinates of this namespace.
	#pageBranches(containers: Object[]): Object[]
	{
		const seen = new Set();
		const branches = [];
		for (const container of containers)
		{
			const collectionId = Number(container?.collectionId);
			if (!Number.isFinite(collectionId) || collectionId <= 0)
			{
				continue;
			}

			const nodes = Array.isArray(container?.nodes) ? container.nodes : [];
			for (const node of nodes)
			{
				const raw = node?.parentId ?? null;
				const parentId = raw === null ? null : Number(raw);
				const key = parentId === null
					? this.#sharedRootKey(collectionId)
					: this.#sharedKey(collectionId, parentId);
				if (seen.has(key))
				{
					continue;
				}

				seen.add(key);
				branches.push({ collectionId, parentId, key });
			}
		}

		return branches;
	}

	// A branch and everything that says how much of it has been read. Whoever else is drawing one of
	// them is told in coordinates, not in the keys of this namespace, so an opened row elsewhere
	// refills instead of standing empty.
	#dropBranches(branches: Object[]): void
	{
		if (branches.length === 0)
		{
			return;
		}

		for (const { key } of branches)
		{
			delete this.#state.sharedDocsByParent[key];
			delete this.#state.sharedDocsHydratedByParent[key];
			delete this.#state.sharedDocsHasNextPageByParent[key];
			delete this.#state.sharedDocsCursorByParent[key];
		}

		this.#onBranchesDropped(branches.map(({ collectionId, parentId }) => ({ collectionId, parentId })));
	}

	// ALG-F1 (NORMATIVE): lay the API-03 response into the branch namespace. The endpoint returns
	// branch roots (parentId===null -> sharedRootKey); the sharedKey path stays as a safety net for
	// a node that still arrives with a parent.
	#hydrateAccessibleTree(response: Object, append: boolean): void
	{
		const containers = Array.isArray(response?.containers) ? response.containers : [];

		if (!append)
		{
			// Only the branches this page re-reads are dropped. This namespace is not the section's
			// private copy: the favorites block opens branches of shared documents straight out of it,
			// and a branch is the same branch wherever it is drawn. Dropping all of it took the rows
			// out from under a block that was showing them and left an opened row empty.
			this.#dropBranches(this.#pageBranches(containers));
			this.#state.sharedContainers.value = [];
		}

		const seenContainers = new Set(
			this.#state.sharedContainers.value.map((container) => Number(container.collectionId)),
		);
		const nextContainers = [...this.#state.sharedContainers.value];
		const touchedKeys = new Set();

		for (const container of containers)
		{
			const collectionId = Number(container?.collectionId);
			if (!Number.isFinite(collectionId) || collectionId <= 0)
			{
				continue;
			}

			if (!seenContainers.has(collectionId))
			{
				seenContainers.add(collectionId);
				nextContainers.push({ collectionId, title: String(container?.title ?? '') });
			}

			const nodes = Array.isArray(container?.nodes) ? container.nodes : [];
			for (const node of nodes)
			{
				const parentId = node?.parentId ?? null;
				const parentKey = parentId === null
					? this.#sharedRootKey(collectionId)
					: this.#sharedKey(collectionId, Number(parentId));

				if (!touchedKeys.has(parentKey))
				{
					touchedKeys.add(parentKey);
					if (!append || !Array.isArray(this.#state.sharedDocsByParent[parentKey]))
					{
						this.#state.sharedDocsByParent[parentKey] = [];
					}
				}

				const bucket = this.#state.sharedDocsByParent[parentKey];
				if (!bucket.some((item) => Number(item.id) === Number(node.id)))
				{
					bucket.push(node);
				}
			}
		}

		const expandedCandidates = [];
		for (const key of touchedKeys)
		{
			this.#state.sharedDocsByParent[key] = sortDocuments(this.#state.sharedDocsByParent[key]);
			expandedCandidates.push(...(this.#state.sharedDocsByParent[key] || []));
		}
		this.#state.sharedContainers.value = nextContainers;

		// One serial chain over every touched branch, not one per branch: a cascade on a wide tree
		// would otherwise put the whole section on the wire at once.
		void this.#refetchExpandedBranches(expandedCandidates);
	}

	// [P2.T3 / EVENT-01] Pull cascade of a document-level ACL change. Arrives on the personal
	// channel (the receiver has no collection VIEW, so no NOTE_COLLECTION_* watch). A collapsed
	// section only marks itself stale — the refetch is deferred to the next expand (lazy). Both
	// the documentIds and requestRefetch shapes reload just the section, never the whole sidebar:
	// API-03 is a single flat-paginated endpoint, so a surgical per-branch refetch is not possible.
	applyDocumentAccessCascade(params: Object): void
	{
		if (!params || typeof params !== 'object')
		{
			return;
		}

		const collectionId = Number(params.collectionId);
		if (!Number.isFinite(collectionId) || collectionId <= 0)
		{
			return;
		}

		// A grant narrowed on an ancestor takes its descendants out of the tree while the ancestor
		// itself stays a branch root, so the nested branches must be re-read, not just the page.
		this.#invalidateSection(true);
	}

	// Tree events that arrive on the personal channel carry sharedScope and are applied in place,
	// exactly like the collection tree applies its own pull events — a rename or a new child must
	// not cost a section reload. Only changes that can move a branch ROOT in or out of the
	// accessible set fall back to a refetch: roots are derived server-side (a granted node whose
	// parent is outside the set), so no local patch can place them correctly.
	applySharedDocumentUpdate(params: Object): boolean
	{
		const documentId = Number(params?.documentId);
		const title = typeof params?.title === 'string' ? params.title : '';
		if (!Number.isFinite(documentId) || documentId <= 0 || title === '')
		{
			return false;
		}

		let patched = false;
		for (const docs of Object.values(this.#state.sharedDocsByParent))
		{
			const index = docs.findIndex((doc) => Number(doc.id) === documentId);
			if (index < 0)
			{
				continue;
			}

			// Title never affects ordering (position does), so the branch keeps its sort.
			docs[index] = { ...docs[index], title };
			patched = true;
		}

		return patched;
	}

	// documentCreate / documentRestore: a node appears inside an already granted subtree.
	applySharedDocumentUpsert(params: Object): boolean
	{
		const documentId = Number(params?.documentId);
		const collectionId = Number(params?.collectionId);
		if (
			!Number.isFinite(documentId) || documentId <= 0
			|| !Number.isFinite(collectionId) || collectionId <= 0
		)
		{
			return false;
		}

		const parentId = params?.parentId == null ? null : Number(params.parentId);
		if (parentId === null || !Number.isFinite(parentId) || parentId <= 0)
		{
			this.#invalidateSection();

			return true;
		}

		// The parent's disclosure must appear even when its branch has never been opened.
		this.#patchSharedDocument(parentId, { hasChildren: true });

		const key = this.#sharedKey(collectionId, parentId);
		if (this.#state.sharedDocsHydratedByParent[key] !== true)
		{
			// Branch not opened yet — the fetch happens on expand, the disclosure above is enough.
			return true;
		}

		const bucket = this.#state.sharedDocsByParent[key] || [];
		const node = {
			id: documentId,
			collectionId,
			parentId,
			position: Number.isFinite(Number(params?.position)) ? Number(params.position) : 0,
			title: typeof params?.title === 'string' ? params.title : '',
			hasChildren: params?.hasChildren === true,
		};
		const index = bucket.findIndex((item) => Number(item.id) === documentId);
		const merged = [...bucket];
		if (index >= 0)
		{
			merged[index] = { ...merged[index], ...node };
		}
		else
		{
			merged.push(node);
		}
		this.#state.sharedDocsByParent[key] = sortDocuments(merged);

		return true;
	}

	// documentArchive / documentDelete / collectionArchive / collectionDelete: the ids leave the
	// accessible tree. The payload carries whole subtrees, so descendants arrive with their root.
	applySharedDocumentRemoval(params: Object): boolean
	{
		const collectionId = Number(params?.collectionId);
		if (!Number.isFinite(collectionId) || collectionId <= 0)
		{
			return false;
		}

		if (params?.requestRefetch === true)
		{
			// Too many ids to name, so what left the tree is unknown: the nested branches are as
			// suspect as the page.
			this.#invalidateSection(true);

			return true;
		}

		const documentIds = Array.isArray(params?.documentIds) ? params.documentIds : [];
		if (documentIds.length === 0)
		{
			return false;
		}

		const orphanedParents = new Set();
		let removed = false;
		let rootRemoved = false;
		const rootKey = this.#sharedRootKey(collectionId);

		for (const rawId of documentIds)
		{
			const documentId = Number(rawId);
			if (!Number.isFinite(documentId) || documentId <= 0)
			{
				continue;
			}

			for (const [key, docs] of Object.entries(this.#state.sharedDocsByParent))
			{
				const index = docs.findIndex((doc) => Number(doc.id) === documentId);
				if (index < 0)
				{
					continue;
				}

				const parentId = docs[index].parentId == null ? null : Number(docs[index].parentId);
				this.#state.sharedDocsByParent[key] = docs.filter((doc) => Number(doc.id) !== documentId);
				removed = true;
				if (key === rootKey)
				{
					rootRemoved = true;
				}
				else if (parentId !== null && parentId > 0)
				{
					orphanedParents.add(parentId);
				}
			}

			// The removed node may have parented a hydrated branch — drop it so a later expand of a
			// restored node does not render children swept together with it.
			this.#dropSharedBranch(collectionId, documentId);
			delete this.#state.expandedDocs[documentId];
		}

		// A parent that just lost its last visible child must lose its disclosure too.
		for (const parentId of orphanedParents)
		{
			const key = this.#sharedKey(collectionId, parentId);
			if ((this.#state.sharedDocsByParent[key] || []).length === 0)
			{
				this.#patchSharedDocument(parentId, { hasChildren: false });
			}
		}

		if (rootRemoved && (this.#state.sharedDocsByParent[rootKey] || []).length === 0)
		{
			// Container with no accessible roots left is no longer a container.
			this.#state.sharedContainers.value = this.#state.sharedContainers.value.filter(
				(container) => Number(container.collectionId) !== collectionId,
			);
			delete this.#state.sharedDocsByParent[rootKey];
		}

		return removed;
	}

	#patchSharedDocument(documentId: number, patch: Object): void
	{
		for (const docs of Object.values(this.#state.sharedDocsByParent))
		{
			const index = docs.findIndex((doc) => Number(doc.id) === documentId);
			if (index >= 0)
			{
				docs[index] = { ...docs[index], ...patch };
			}
		}
	}

	#dropSharedBranch(collectionId: number, parentId: number): void
	{
		const key = this.#sharedKey(collectionId, parentId);
		delete this.#state.sharedDocsByParent[key];
		delete this.#state.sharedDocsHydratedByParent[key];
		delete this.#state.sharedDocsHasNextPageByParent[key];
		delete this.#state.sharedDocsCursorByParent[key];
	}

	// `staleNested` is for the events that can change what a branch HOLDS rather than merely add a
	// root: those have to reach the nested branches too, and the page alone never does.
	#invalidateSection(staleNested: boolean = false): void
	{
		this.markSharedStale();
		// Before the page, and regardless of whether this section is on screen: the marks are what make
		// the nested branches re-read at all (see #staleNestedBranches), and they are drawn elsewhere too.
		if (staleNested)
		{
			this.#staleNestedBranches();
		}

		if (!this.#state.sharedSectionExpanded.value || !this.#state.sharedHydrated.value)
		{
			// Collapsed or never hydrated — the refetch is deferred to the next expand (lazy).
			return;
		}

		void this.loadSharedTree(false);
	}

	// [EVENT-01] An access change lands on a subtree, not on a page: a descendant can lose the grant
	// it was held by while its parent keeps one of its own. The page re-reads branch ROOTS and drops
	// only the branches it re-reads, so every nested branch stayed hydrated and kept showing a child
	// whose access had just been taken away - here, and in the favorites block, which draws its
	// branches out of this very namespace.
	//
	// Rows are deliberately left in place: what is on screen holds until its replacement arrives, so
	// a branch that is still granted does not blink. Only the hydration marks go - and they are what
	// makes the readers actually go back to the server, because the branch loader is a prefetch and
	// returns at once on a branch it believes it already holds.
	#staleNestedBranches(): void
	{
		const branches = [];
		for (const key of Object.keys(this.#state.sharedDocsHydratedByParent))
		{
			const coordinates = parseSharedKey(key);
			// Root branches belong to the page and are re-read by it.
			if (coordinates === null || coordinates.parentId === null)
			{
				continue;
			}

			delete this.#state.sharedDocsHydratedByParent[key];
			branches.push(coordinates);
		}

		if (branches.length > 0)
		{
			this.#onBranchesDropped(branches);
		}
	}

	markSharedStale(): void
	{
		this.#state.sharedStale.value = true;
		this.#state.sharedStaleToken++;
	}
}
