import { Loc, Tag, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { BitrixVue, reactive, watchEffect } from 'ui.vue3';
import { createSidebarFeature, DialogService, NoteEvent } from 'note.sidebar';
import { openOrphanRestorePopup, RecycleBinService } from 'note.recyclebin';
import { NoteTheme, NoteThemeContext } from 'note.ui.theme-context';
import { NoteAnalytics } from 'note.analytics';
import 'ui.notification';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';

import { NoteLayout } from '../layouts/note-layout';
import { createNoteRouter } from '../router/router';
import { ThemeApi } from '../services/theme-api';
import {
	ROUTE_NAME_ARCHIVE,
	ROUTE_NAME_DOCUMENT,
	ROUTE_NAME_HOME,
	ROUTE_NAME_RECYCLE_BIN,
	ROUTE_NAME_SEARCH,
	ROUTE_NAME_SHARED,
	ROUTE_NAME_WORKSPACE,
} from '../router/routes';
import { RouteDocumentResolver } from './route-document-resolver';

export class NoteApp
{
	#app: Object | null = null;
	#router: Object | null = null;
	#options: Object = {};
	#sidebarFeature: Object | null = null;
	#routeDocumentResolver: RouteDocumentResolver | null = null;
	#routeDocumentContext: Object | null = null;
	#removeRouteAfterEach: (() => void) | null = null;
	#routeSyncId: number = 0;
	#initialCollections: Object | null = null;
	#hasInitialCollectionsHydration: boolean = false;
	#initialSidebarContext: Object | null = null;
	#hasInitialSidebarHydration: boolean = false;
	// Bootstrap-level UI feature flags (server-fed, one per mount, not per-document). Default off.
	#features: Object = { historyEnabled: false, notificationsEnabled: false, sharedTreeEnabled: false };
	#isInitialRouteContextConsumed: boolean = false;
	#basePageTitle: string = '';
	#handleDocRenamed: Function | null = null;
	#handleCollectionRenamed: Function | null = null;
	#handleChildrenChanged: Function | null = null;
	#childrenWatchStop: Function | null = null;
	#documentActions: Object | null = null;
	#dialogService: DialogService = new DialogService();
	#lastKnownCollectionId: number = 0;
	#lastKnownCollectionTitle: string = '';
	#previousRouteName: string = '';
	#themeState: Object | null = null;
	#themeActions: Object | null = null;
	#themeRoot: Element | null = null;
	#tariffBlocked: boolean = false;

	mount(target: string, options?: Object): NoteApp
	{
		if (!Type.isStringFilled(target))
		{
			throw new Error('Target selector is required');
		}

		this.destroy();
		this.#options = Type.isPlainObject(options) ? options : {};
		this.#tariffBlocked = Boolean(this.#options.tariffBlocked);
		this.#basePageTitle = this.#resolveCurrentPageTitle();
		this.#initialCollections = this.#extractInitialCollections(this.#options.initialCollections);
		this.#initialSidebarContext = this.#extractInitialSidebarContext(this.#options.initialSidebarContext);
		this.#features = {
			historyEnabled: Boolean(this.#options.historyEnabled),
			notificationsEnabled: Boolean(this.#options.notificationsEnabled),
			sharedTreeEnabled: Boolean(this.#options.sharedTreeEnabled),
		};
		const sidebarOptions = this.#extractSidebarOptions(this.#options.sidebarOptions);
		this.#themeState = reactive({ theme: this.#extractTheme(this.#options.theme) });
		this.#themeActions = {
			state: this.#themeState,
			toggle: () => this.#toggleTheme(),
			set: (theme: string) => this.#setTheme(theme),
		};
		this.#router = createNoteRouter();
		this.#routeDocumentResolver = new RouteDocumentResolver();
		this.#routeDocumentContext = reactive(this.#createRouteDocumentContext());
		this.#sidebarFeature = createSidebarFeature({
			router: this.#router,
			emitAction: (name, payload) => this.#emitAction(name, payload),
			getRouteDocumentContext: () => this.#routeDocumentContext,
			reloadRouteDocumentContext: async () => {
				await this.#syncRouteState(false, true);
			},
			routeNames: {
				home: ROUTE_NAME_HOME,
				document: ROUTE_NAME_DOCUMENT,
				search: ROUTE_NAME_SEARCH,
				shared: ROUTE_NAME_SHARED,
				archive: ROUTE_NAME_ARCHIVE,
				recyclebin: ROUTE_NAME_RECYCLE_BIN,
				workspace: ROUTE_NAME_WORKSPACE,
			},
			sidebarOptions,
			// [TPL-02] First page of the favorites block, server-rendered with the collections. Handed to
			// the feature rather than hydrated afterwards: the feature reads the first page itself the
			// moment it is created, and a payload arriving later would come after that request.
			initialFavorites: this.#extractInitialFavorites(this.#options.initialFavorites),
			isMobile: Boolean(this.#options.isMobile),
			historyEnabled: this.#features.historyEnabled,
			notificationsEnabled: this.#features.notificationsEnabled,
			sharedTreeEnabled: this.#features.sharedTreeEnabled,
		});

		this.#documentActions = this.#createDocumentActions();

		// Live-mirror the open document's sidebar branch into the editor children-block.
		// Every create/rename/move/remove the store applies reaches the block without a
		// per-event re-sync — getChildren returns the reactive docsByParent array.
		this.#childrenWatchStop = watchEffect(() => {
			const ctx = this.#routeDocumentContext;
			if (!ctx || !this.#sidebarFeature)
			{
				return;
			}

			const docId = Number(ctx.docId);
			const shared = ctx.document?.sharedAccess === true;
			const collectionId = this.#branchCollectionId(ctx.document);
			if (!Number.isInteger(docId) || docId <= 0 || !Number.isInteger(collectionId) || collectionId <= 0)
			{
				ctx.children = [];
				ctx.childrenHasMore = false;

				return;
			}

			// A shared document keeps its children in the accessible-tree namespace: the collection
			// branch is empty for this user by definition (no collection access).
			ctx.children = shared
				? this.#sidebarFeature.state.getSharedChildren(collectionId, docId)
				: this.#sidebarFeature.state.getChildren(collectionId, docId)
			;
			ctx.childrenHasMore = shared
				? this.#sidebarFeature.state.hasNextSharedChildren(collectionId, docId)
				: this.#sidebarFeature.hasNextChildren(collectionId, docId)
			;
		});

		this.#app = BitrixVue.createApp(NoteLayout, {
			state: this.#sidebarFeature.state,
			actions: this.#sidebarFeature.actions,
			store: this.#sidebarFeature.store,
			messages: this.#sidebarFeature.messages,
			routeDocumentContext: this.#routeDocumentContext,
			documentActions: this.#documentActions,
			themeActions: this.#themeActions,
		});
		// Feature flag reaches the deep editor menu via provide/inject instead of threading a prop
		// through every router level; the document page reads it to gate the download/upload .md items.
		this.#app.provide('markdownIoEnabled', Boolean(this.#options.markdownIoEnabled));
		// Same reason: the document page gates the shortcuts-help surfaces (button, `?`/`Cmd+/`
		// listener, panel) on this flag. The editor keymap itself stays on regardless.
		this.#app.provide('hotkeysEnabled', Boolean(this.#options.hotkeysEnabled));
		// DTO-01. Static server values, so they go the short way like the flags above instead of
		// into reactive state: the verdict and the region-aware product name for the phrases.
		this.#app.provide('aiChatEnabled', Boolean(this.#options.aiChatEnabled));
		this.#app.provide('aiChatName', String(this.#options.aiChatName ?? ''));
		// @chef-ignore
		this.#app.use(this.#router);
		this.#app.mount(target);
		this.#themeRoot = document.querySelector(target);
		this.#applyThemeClass(this.#themeState.theme);
		this.#applyMobileClass(Boolean(this.#options.isMobile));

		this.#handleDocRenamed = (event) => {
			const { id, title } = event.getData();
			if (this.#routeDocumentContext?.docId === id && this.#routeDocumentContext?.document)
			{
				this.#routeDocumentContext.document.title = title;
				this.#syncPageTitle();
			}
		};

		this.#handleCollectionRenamed = (event) => {
			const { id, name } = event.getData();
			if (
				this.#routeDocumentContext?.document
				&& Number(this.#routeDocumentContext.document.collectionId) === id
			)
			{
				this.#routeDocumentContext.document.collectionTitle = name;
			}

			if (Number(id) > 0 && Number(id) === this.#lastKnownCollectionId)
			{
				this.#lastKnownCollectionTitle = String(name ?? '');
			}
		};

		this.#handleChildrenChanged = (event) => {
			const { parentId, collectionId } = event.getData();
			if (
				this.#routeDocumentContext
				&& this.#sidebarFeature
				&& Number(this.#routeDocumentContext.docId) === parentId
			)
			{
				// Display is handled reactively by the children watchEffect; we only need
				// to fetch an unloaded branch (first remote child of a leaf) so it has
				// something to mirror. ensureChildrenLoaded is a no-op once hydrated.
				void this.#sidebarFeature.ensureChildrenLoaded(Number(collectionId), parentId);
			}
		};
		EventEmitter.subscribe(NoteEvent.DOCUMENT_RENAMED, this.#handleDocRenamed);
		EventEmitter.subscribe(NoteEvent.COLLECTION_RENAMED, this.#handleCollectionRenamed);
		EventEmitter.subscribe(NoteEvent.DOCUMENT_CHILDREN_CHANGED, this.#handleChildrenChanged);

		this.#trackWelcomeEntry();

		void this.#bootstrap();

		return this;
	}

	// welcome_points: one event per KB entry (mount runs once per entry, not per SPA re-render).
	// The ?source scrub is deferred to #bootstrap (post router.isReady) — see #scrubWelcomeSourceFromUrl.
	#trackWelcomeEntry(): void
	{
		NoteAnalytics.welcomePoint(this.#resolveWelcomeSource());
	}

	#resolveWelcomeSource(): string
	{
		const optionSource = this.#options?.welcomeSource;
		if (Type.isStringFilled(optionSource))
		{
			return optionSource;
		}

		try
		{
			const querySource = new URLSearchParams(window.location.search).get('source');
			if (Type.isStringFilled(querySource))
			{
				return querySource;
			}
		}
		catch
		{
			// ignore malformed location
		}

		return 'left_menu';
	}

	// Drop ?source= from the address bar once it has been read for analytics. It is a one-shot entry
	// marker (e.g. the wiki post-import redirect), so leaving it would litter the URL and re-fire
	// welcome_points on reload. Called after router.isReady() so vue-router has already written its
	// initial history state; replaceState only rewrites the bar and triggers no navigation.
	#scrubWelcomeSourceFromUrl(): void
	{
		try
		{
			const url = new URL(window.location.href);
			if (!url.searchParams.has('source'))
			{
				return;
			}

			url.searchParams.delete('source');
			const query = url.searchParams.toString();
			const cleaned = url.pathname + (query ? `?${query}` : '') + url.hash;
			window.history.replaceState(window.history.state, '', cleaned);
		}
		catch
		{
			// ignore malformed location
		}
	}

	destroy(): void
	{
		this.#applyMobileClass(false);

		if (Type.isFunction(this.#childrenWatchStop))
		{
			this.#childrenWatchStop();
			this.#childrenWatchStop = null;
		}

		if (this.#app)
		{
			this.#app.unmount();
			this.#app = null;
		}

		if (this.#sidebarFeature)
		{
			this.#sidebarFeature.destroy();
			this.#sidebarFeature = null;
		}

		if (Type.isFunction(this.#removeRouteAfterEach))
		{
			this.#removeRouteAfterEach();
			this.#removeRouteAfterEach = null;
		}

		if (this.#handleDocRenamed)
		{
			EventEmitter.unsubscribe(NoteEvent.DOCUMENT_RENAMED, this.#handleDocRenamed);
			this.#handleDocRenamed = null;
		}

		if (this.#handleCollectionRenamed)
		{
			EventEmitter.unsubscribe(NoteEvent.COLLECTION_RENAMED, this.#handleCollectionRenamed);
			this.#handleCollectionRenamed = null;
		}

		if (this.#handleChildrenChanged)
		{
			EventEmitter.unsubscribe(NoteEvent.DOCUMENT_CHILDREN_CHANGED, this.#handleChildrenChanged);
			this.#handleChildrenChanged = null;
		}

		this.#documentActions = null;
		this.#routeDocumentResolver = null;
		this.#routeDocumentContext = null;
		this.#routeSyncId = 0;
		this.#restoreBasePageTitle();
		this.#initialCollections = null;
		this.#hasInitialCollectionsHydration = false;
		this.#initialSidebarContext = null;
		this.#hasInitialSidebarHydration = false;
		this.#isInitialRouteContextConsumed = false;
		this.#basePageTitle = '';
		this.#lastKnownCollectionId = 0;
		this.#lastKnownCollectionTitle = '';
		this.#previousRouteName = '';
		this.#router = null;
		this.#themeState = null;
		this.#themeActions = null;
		this.#themeRoot = null;
		this.#tariffBlocked = false;
	}

	#extractTheme(theme: mixed): string
	{
		return theme === NoteTheme.DARK ? NoteTheme.DARK : NoteTheme.LIGHT;
	}

	#applyMobileClass(isMobile: boolean): void
	{
		const root = document.documentElement;
		if (!root)
		{
			return;
		}

		root.classList.toggle('note-mobile', Boolean(isMobile));
	}

	#applyThemeClass(theme: string): void
	{
		if (!this.#themeRoot)
		{
			return;
		}

		const lightClass = NoteThemeContext.resolveDesignSystemContext(NoteTheme.LIGHT);
		const darkClass = NoteThemeContext.resolveDesignSystemContext(NoteTheme.DARK);
		const targetClass = NoteThemeContext.resolveDesignSystemContext(theme);

		this.#themeRoot.classList.remove(lightClass, darkClass);
		this.#themeRoot.classList.add(targetClass);

		NoteThemeContext.set(theme);
	}

	#setTheme(theme: string): void
	{
		const normalized = this.#extractTheme(theme);
		if (!this.#themeState || this.#themeState.theme === normalized)
		{
			return;
		}

		this.#themeState.theme = normalized;
		this.#applyThemeClass(normalized);
		void ThemeApi.save(normalized);
	}

	#toggleTheme(): void
	{
		if (!this.#themeState)
		{
			return;
		}

		this.#setTheme(this.#themeState.theme === NoteTheme.DARK ? NoteTheme.LIGHT : NoteTheme.DARK);
	}

	async #bootstrap(): Promise<void>
	{
		try
		{
			await this.#router.isReady();

			// Tariff/tool block: the interface stays mounted behind the tariff slider
			// (template opens it and redirects away on close). Hydrate the sidebar from
			// server data (no AJAX) so it renders, but skip the welcome redirect, sidebar
			// bootstrap and route auto-select — otherwise the HOME->WORKSPACE fallback fires
			// a listByCollection bootstrap AJAX that the server tariff gate rejects, surfacing
			// an error toast on top of the slider. The slider is the only UX under a block.
			if (this.#tariffBlocked)
			{
				this.#hydrateFromInitialCollections();
				this.#hydrateFromInitialSidebarContext();

				return;
			}

			// After the router settled its initial navigation: scrubbing earlier races with
			// vue-router rewriting history state from the URL it captured at boot (?source would return).
			this.#scrubWelcomeSourceFromUrl();
			await this.#applyWelcomeRedirect();
			const hasInitialCollections = this.#hydrateFromInitialCollections();
			this.#hydrateFromInitialSidebarContext();
			await this.#sidebarFeature.bootstrap({
				skipInitialCollectionsLoad: hasInitialCollections,
			});
			await this.#syncRouteState(true);
			if (!Type.isFunction(this.#removeRouteAfterEach))
			{
				this.#removeRouteAfterEach = this.#router.afterEach((to, from) => {
					this.#previousRouteName = String(from?.name || '');

					// Hash-only navigation within the same document: skip resync so an anchor click
					// doesn't refetch/remount the document. The editor scrolls via its own $route.hash watcher.
					const sameRoute = to?.name === from?.name
						&& String(to?.params?.id ?? '') === String(from?.params?.id ?? '');
					if (sameRoute && to?.hash !== from?.hash)
					{
						return;
					}

					void this.#syncRouteState(false);
				});
			}
		}
		catch
		{
			// sidebar/app keep local error handling
		}
	}

	async #syncRouteState(withCollectionFallback: boolean = false, force: boolean = false): Promise<void>
	{
		const syncId = ++this.#routeSyncId;
		this.#applyImmediateSharedFlag();
		this.#captureLastKnownCollectionFromRoute();
		await this.#syncRouteDocumentContext(syncId, force);
		if (syncId !== this.#routeSyncId || !this.#sidebarFeature)
		{
			return;
		}

		await this.#sidebarFeature.syncFromRouteContext(withCollectionFallback, {
			previousRouteName: this.#previousRouteName ?? '',
		});
	}

	#applyImmediateSharedFlag(): void
	{
		if (!this.#sidebarFeature)
		{
			return;
		}

		const routeName = String(this.#router?.currentRoute?.value?.name || '');
		if (typeof this.#sidebarFeature.setSharedView === 'function')
		{
			this.#sidebarFeature.setSharedView(routeName === ROUTE_NAME_SHARED);
		}

		if (typeof this.#sidebarFeature.setArchiveView === 'function')
		{
			this.#sidebarFeature.setArchiveView(routeName === ROUTE_NAME_ARCHIVE);
		}

		if (typeof this.#sidebarFeature.setRecycleBinView === 'function')
		{
			this.#sidebarFeature.setRecycleBinView(routeName === ROUTE_NAME_RECYCLE_BIN);
		}
	}

	#captureLastKnownCollectionFromRoute(): void
	{
		if (!this.#sidebarFeature || !this.#router)
		{
			return;
		}

		const route = this.#router.currentRoute?.value ?? null;
		const routeName = String(route?.name || '');
		if (routeName !== ROUTE_NAME_WORKSPACE)
		{
			return;
		}

		const collectionId = Number(route?.params?.id);
		if (!Number.isInteger(collectionId) || collectionId <= 0)
		{
			return;
		}

		const collection = this.#sidebarFeature.findCollection?.(collectionId) ?? null;
		const title = collection?.name;
		this.#updateLastKnownCollection(collectionId, Type.isStringFilled(title) ? String(title) : '');
	}

	#updateLastKnownCollection(collectionId: number, collectionTitle: string): void
	{
		const id = Number(collectionId);
		if (!Number.isInteger(id) || id <= 0)
		{
			return;
		}

		if (id !== this.#lastKnownCollectionId)
		{
			this.#lastKnownCollectionId = id;
			this.#lastKnownCollectionTitle = String(collectionTitle ?? '');

			return;
		}

		// Same collection: keep an existing non-empty title rather than overwriting it with empty
		// (e.g. when sidebar hasn't hydrated the collection name yet during a fast navigation).
		if (Type.isStringFilled(collectionTitle))
		{
			this.#lastKnownCollectionTitle = String(collectionTitle);
		}
	}

	async #syncRouteDocumentContext(syncId: number, force: boolean = false): Promise<void>
	{
		if (!this.#router || !this.#routeDocumentResolver || !this.#routeDocumentContext)
		{
			return;
		}

		const routeDocId = this.#extractRouteDocumentId(this.#router.currentRoute?.value);
		if (this.#applyInitialRouteDocumentContext(routeDocId))
		{
			return;
		}

		// Idempotent guard: the same document is already loaded. A hash-only anchor click (or any
		// spurious route resync where the afterEach hash guard didn't fire due to transient from/to
		// state) must not refetch and remount an already-open document. `force` lets deliberate
		// same-route reloads (restore-from-trash, sidebar reload) bypass this.
		const current = this.#routeDocumentContext;
		if (
			!force
			&& routeDocId > 0
			&& Number(current.docId) === routeDocId
			&& current.status === 'ready'
			&& Type.isPlainObject(current.document)
		)
		{
			return;
		}

		if (routeDocId <= 0)
		{
			this.#setRouteDocumentContext({
				status: 'idle',
				docId: 0,
				document: null,
				ancestors: [],
				errorMessage: '',
				viewMode: this.#resolveViewMode(),
			});

			return;
		}

		this.#setRouteDocumentContext({
			status: 'loading',
			docId: routeDocId,
			document: null,
			preview: this.#extractSidebarDocumentPreview(routeDocId),
			ancestors: [],
			openContext: null,
			errorMessage: '',
			viewMode: this.#resolveViewMode(),
		});

		const fullContext = !this.#isDocumentLoadedInSidebar(routeDocId);
		const resolved = await this.#routeDocumentResolver.resolve(routeDocId, { fullContext });
		if (syncId !== this.#routeSyncId)
		{
			return;
		}

		this.#setRouteDocumentContext({
			status: resolved.status,
			docId: routeDocId,
			document: resolved.document,
			ancestors: resolved.ancestors,
			openContext: resolved.openContext,
			errorMessage: resolved.errorMessage,
			viewMode: this.#resolveViewModeFromDocument(resolved.document),
		});

		if (resolved.status === 'ready' && Type.isPlainObject(resolved.document))
		{
			const resolvedCollectionId = Number(resolved.document.collectionId);
			const resolvedCollectionTitle = String(resolved.document.collectionTitle ?? '');
			if (Number.isInteger(resolvedCollectionId) && resolvedCollectionId > 0)
			{
				this.#updateLastKnownCollection(resolvedCollectionId, resolvedCollectionTitle);
			}

			void this.#loadChildDocuments(routeDocId, resolved.document);
		}
	}

	#resolveViewModeFromDocument(document: mixed): string
	{
		if (Type.isPlainObject(document))
		{
			if (document.isTrashed)
			{
				return 'recyclebin';
			}

			if (document.isArchived)
			{
				return 'archive';
			}

			if (document.sharedAccess)
			{
				return 'shared';
			}

			// Loaded document is the source of truth: don't fall back to route hints,
			// otherwise stale previousRouteName (e.g. 'recyclebin' after Restore) keeps
			// the breadcrumb root in trash mode via header's effectiveMode hint branch.
			return 'normal';
		}

		return this.#resolveViewMode();
	}

	#isDocumentLoadedInSidebar(docId: number): boolean
	{
		if (!this.#sidebarFeature || typeof this.#sidebarFeature.isDocumentLoaded !== 'function')
		{
			return false;
		}

		return Boolean(this.#sidebarFeature.isDocumentLoaded(docId));
	}

	#extractSidebarDocumentPreview(docId: number): Object | null
	{
		const sidebarDoc = this.#sidebarFeature?.findLoadedDocumentAnywhere?.(docId) ?? null;
		const sidebarAncestors = Array.isArray(this.#sidebarFeature?.getAncestorsForDocument?.(docId))
			? this.#sidebarFeature.getAncestorsForDocument(docId)
			: []
		;
		let collectionIdRaw = Number(sidebarDoc?.collectionId ?? 0) || 0;
		if (collectionIdRaw === 0)
		{
			// Fallback: when navigating from /workspace/X the doc may not be in the sidebar tree yet
			// (workspace uses listByCollection, not listByParent), but the sidebar still has the
			// originating collection selected — use it for the breadcrumb.
			collectionIdRaw = Number(this.#sidebarFeature?.state?.selectedCollectionId ?? 0) || 0;
		}

		if (collectionIdRaw === 0 && this.#lastKnownCollectionId > 0)
		{
			collectionIdRaw = this.#lastKnownCollectionId;
		}

		if (collectionIdRaw <= 0)
		{
			return sidebarDoc ? {
				title: String(sidebarDoc.title ?? ''),
				collectionId: 0,
				collectionTitle: '',
				isArchived: Boolean(sidebarDoc.isArchived),
				ancestors: sidebarAncestors,
			} : null;
		}

		const collection = this.#sidebarFeature?.findCollection?.(collectionIdRaw) ?? null;
		let collectionTitle = String(sidebarDoc?.collectionTitle || collection?.name || '');
		if (collectionTitle === '' && collectionIdRaw === this.#lastKnownCollectionId)
		{
			collectionTitle = this.#lastKnownCollectionTitle;
		}

		return {
			title: String(sidebarDoc?.title ?? ''),
			collectionId: collectionIdRaw,
			collectionTitle,
			isArchived: Boolean(sidebarDoc?.isArchived),
			ancestors: sidebarAncestors,
		};
	}

	#extractRouteDocumentId(route: Object | null): number
	{
		if (!route || route.name !== ROUTE_NAME_DOCUMENT)
		{
			return 0;
		}

		const docId = Number(route.params?.id);

		return Number.isInteger(docId) && docId > 0 ? docId : 0;
	}

	#createRouteDocumentContext(): Object
	{
		return {
			status: 'idle',
			docId: 0,
			document: null,
			preview: null,
			ancestors: [],
			openContext: null,
			errorMessage: '',
			viewMode: 'normal',
			children: [],
			childrenLoading: false,
			childrenHasMore: false,
			loadMoreChildren: () => {},
		};
	}

	#resolveViewMode(): string
	{
		const routeName = String(this.#router?.currentRoute?.value?.name || '');

		if (routeName === ROUTE_NAME_ARCHIVE)
		{
			return 'archive';
		}

		if (routeName === ROUTE_NAME_RECYCLE_BIN)
		{
			return 'recyclebin';
		}

		if (routeName === ROUTE_NAME_SHARED)
		{
			return 'shared';
		}

		if (routeName !== ROUTE_NAME_DOCUMENT)
		{
			return 'normal';
		}

		// /document/N: prefer the doc's own flags from sidebar — sidebar tree is the most reliable
		// signal during loading (e.g. user came from /archive but clicked a regular collection doc
		// from the sidebar; previousRouteName='archive' must NOT poison the breadcrumb root).
		const docId = this.#extractRouteDocumentId(this.#router?.currentRoute?.value);
		const sidebarDoc = docId > 0
			? (this.#sidebarFeature?.findLoadedDocumentAnywhere?.(docId) ?? null)
			: null
		;
		if (sidebarDoc)
		{
			if (sidebarDoc.isTrashed)
			{
				return 'recyclebin';
			}

			if (sidebarDoc.isArchived)
			{
				return 'archive';
			}

			if (sidebarDoc.sharedAccess)
			{
				return 'shared';
			}

			return 'normal';
		}

		// Sidebar doesn't know the doc: use the source route as a hint while the backend resolves.
		if (this.#previousRouteName === ROUTE_NAME_ARCHIVE)
		{
			return 'archive';
		}

		if (this.#previousRouteName === ROUTE_NAME_RECYCLE_BIN)
		{
			return 'recyclebin';
		}

		if (this.#previousRouteName === ROUTE_NAME_SHARED)
		{
			return 'shared';
		}

		const existingDoc = this.#routeDocumentContext?.document;
		if (Type.isPlainObject(existingDoc))
		{
			if (existingDoc.isTrashed)
			{
				return 'recyclebin';
			}

			if (existingDoc.isArchived)
			{
				return 'archive';
			}

			if (existingDoc.sharedAccess)
			{
				return 'shared';
			}
		}

		return 'normal';
	}

	#getBrowserDocument(): Document | null
	{
		const documentRef = window?.document;

		return documentRef ?? null;
	}

	#setRouteDocumentContext(nextContext: Object): void
	{
		const context = this.#routeDocumentContext;
		if (!context)
		{
			return;
		}

		context.status = String(nextContext?.status || 'idle');
		context.docId = Number(nextContext?.docId || 0);
		context.document = Type.isPlainObject(nextContext?.document) ? nextContext.document : null;
		context.preview = Type.isPlainObject(nextContext?.preview) ? nextContext.preview : null;
		context.ancestors = Array.isArray(nextContext?.ancestors) ? nextContext.ancestors : [];
		context.openContext = Type.isPlainObject(nextContext?.openContext) ? nextContext.openContext : null;
		context.errorMessage = String(nextContext?.errorMessage || '');
		context.viewMode = Type.isStringFilled(nextContext?.viewMode) ? String(nextContext.viewMode) : 'normal';
		context.children = Array.isArray(nextContext?.children) ? nextContext.children : [];
		context.childrenLoading = false;
		context.childrenHasMore = false;
		context.loadMoreChildren = () => {};
		context.autoEdit = context.status === 'ready' ? Boolean(context.autoEdit) : false;
		this.#syncPageTitle();
	}

	#syncPageTitle(): void
	{
		const documentRef = this.#getBrowserDocument();
		if (!documentRef)
		{
			return;
		}

		const docTitle = this.#extractRouteDocumentTitle();
		const fallbackTitle = this.#basePageTitle;
		const nextTitle = docTitle === '' ? fallbackTitle : docTitle;
		if (documentRef.title !== nextTitle)
		{
			documentRef.title = nextTitle;
		}
	}

	#extractRouteDocumentTitle(): string
	{
		const context = this.#routeDocumentContext;
		if (!context || String(context.status) !== 'ready' || !Type.isPlainObject(context.document))
		{
			return '';
		}

		return String(context.document.title ?? '').trim();
	}

	#restoreBasePageTitle(): void
	{
		const documentRef = this.#getBrowserDocument();
		if (!documentRef)
		{
			return;
		}

		if (Type.isStringFilled(this.#basePageTitle))
		{
			documentRef.title = this.#basePageTitle;
		}
	}

	#resolveCurrentPageTitle(): string
	{
		const documentRef = this.#getBrowserDocument();
		if (!documentRef)
		{
			return '';
		}

		return String(documentRef.title ?? '');
	}

	#extractInitialSidebarContext(initialSidebarContext: Object | null): Object | null
	{
		return Type.isPlainObject(initialSidebarContext) ? initialSidebarContext : null;
	}

	#extractSidebarOptions(sidebarOptions: Object | null): Object | null
	{
		if (!Type.isPlainObject(sidebarOptions))
		{
			return null;
		}

		const width = Number(sidebarOptions.width);
		if (!Number.isFinite(width))
		{
			return null;
		}

		return {
			width: Math.trunc(width),
			collapsed: Boolean(sidebarOptions.collapsed),
			// Which blocks of the panel stand open. Passed through as they came: absent means "never set",
			// which the sidebar answers with an open block - so a missing key must not become `false` here.
			favoritesOpen: sidebarOptions.favoritesOpen,
			collectionsOpen: sidebarOptions.collectionsOpen,
		};
	}

	#extractInitialCollections(initialCollections: Object | null): Object | null
	{
		if (!Type.isPlainObject(initialCollections))
		{
			return null;
		}

		if (!Array.isArray(initialCollections.items))
		{
			return null;
		}

		return initialCollections;
	}

	#extractInitialFavorites(initialFavorites: Object | null): Object | null
	{
		if (!Type.isPlainObject(initialFavorites) || !Array.isArray(initialFavorites.items))
		{
			return null;
		}

		return initialFavorites;
	}

	async #applyWelcomeRedirect(): Promise<void>
	{
		const welcomeDocId = Number(this.#options?.initialWelcomeDocId || 0);
		if (!Number.isInteger(welcomeDocId) || welcomeDocId <= 0)
		{
			return;
		}

		if (this.#router.currentRoute.value.name !== ROUTE_NAME_HOME)
		{
			return;
		}

		await this.#router.replace({
			name: ROUTE_NAME_DOCUMENT,
			params: { id: String(welcomeDocId) },
		});
	}

	#hydrateFromInitialCollections(): boolean
	{
		if (!this.#sidebarFeature || !this.#initialCollections)
		{
			return false;
		}

		const hydrated = this.#sidebarFeature.hydrateInitialCollections(this.#initialCollections);
		this.#hasInitialCollectionsHydration = Boolean(hydrated);

		return this.#hasInitialCollectionsHydration;
	}

	#hydrateFromInitialSidebarContext(): boolean
	{
		if (!this.#sidebarFeature || !this.#initialSidebarContext)
		{
			return false;
		}

		const hydrated = this.#sidebarFeature.hydrateFromInitialContext(this.#initialSidebarContext);
		this.#hasInitialSidebarHydration = Boolean(hydrated);

		return this.#hasInitialSidebarHydration;
	}

	#applyInitialRouteDocumentContext(routeDocId: number): boolean
	{
		if (
			this.#isInitialRouteContextConsumed
			|| !this.#hasInitialSidebarHydration
			|| !this.#initialSidebarContext
			|| routeDocId <= 0
		)
		{
			return false;
		}

		const initialDocument = this.#normalizeInitialDocument(this.#initialSidebarContext.document);
		if (!initialDocument)
		{
			return false;
		}

		if (Number(initialDocument.id) !== routeDocId)
		{
			return false;
		}

		this.#setRouteDocumentContext({
			status: 'ready',
			docId: routeDocId,
			document: initialDocument,
			ancestors: [],
			errorMessage: '',
			viewMode: this.#resolveViewModeFromDocument(initialDocument),
		});
		this.#isInitialRouteContextConsumed = true;

		void this.#loadChildDocuments(routeDocId, initialDocument);

		return true;
	}

	#normalizeInitialDocument(document: Object | null): Object | null
	{
		if (!Type.isPlainObject(document))
		{
			return null;
		}

		const id = Number(document.id);
		const collectionId = Number(document.collectionId);
		if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(collectionId) || collectionId <= 0)
		{
			return null;
		}

		const parentId = (
			document.parentId === null
			|| document.parentId === undefined
			|| document.parentId === ''
		)
			? null
			: Number(document.parentId)
		;

		const markdown = Type.isArray(document.markdown)
			|| Type.isPlainObject(document.markdown)
			|| Type.isString(document.markdown)
			? document.markdown
			: null
		;

		return {
			...document,
			id,
			collectionId,
			parentId,
			title: String(document.title ?? ''),
			collectionTitle: String(document.collectionTitle ?? ''),
			markdown,
			position: Number.isInteger(Number(document.position)) ? Number(document.position) : 0,
			isArchived: Boolean(document.isArchived),
			archivedAt: typeof document.archivedAt === 'string' && document.archivedAt !== '' ? document.archivedAt : null,
			isTrashed: Boolean(document.isTrashed),
			trashedAt: typeof document.trashedAt === 'string' && document.trashedAt !== '' ? document.trashedAt : null,
			recycleBinId: document.recycleBinId == null ? null : Number(document.recycleBinId),
			isOrphan: Boolean(document.isOrphan),
			canRestore: Boolean(document.canRestore),
			canEdit: Boolean(document.canEdit),
			canEditCollection: Boolean(document.canEditCollection),
		};
	}

	// Branch namespace key: a shared document is keyed by its container id, which the read payload
	// reports separately from collectionId (that one stays absent so the breadcrumb container is
	// not clickable).
	#branchCollectionId(document: Object | null): number
	{
		const raw = document?.sharedAccess === true
			? document?.sharedCollectionId
			: document?.collectionId
		;

		return Number(raw);
	}

	async #loadChildDocuments(docId: number, document: Object): Promise<void>
	{
		if (!this.#sidebarFeature || !document)
		{
			return;
		}

		const shared = document.sharedAccess === true;
		const collectionId = this.#branchCollectionId(document);
		if (!Number.isInteger(collectionId) || collectionId <= 0)
		{
			return;
		}

		// Shared documents are usually opened by URL, without the section ever being expanded, so
		// there is no loaded node to read hasChildren from — the fetch itself decides.
		const sidebarDoc = shared ? null : this.#sidebarFeature.findLoadedDocument(collectionId, docId);
		if (sidebarDoc && !sidebarDoc.hasChildren)
		{
			// Nothing to fetch; the watchEffect already reflects the empty branch.
			this.#syncChildDocumentsState(docId, collectionId);

			return;
		}

		if (this.#routeDocumentContext && Number(this.#routeDocumentContext.docId) === docId)
		{
			this.#routeDocumentContext.childrenLoading = true;
		}

		try
		{
			await (shared
				? this.#sidebarFeature.ensureSharedChildrenLoaded(collectionId, docId)
				: this.#sidebarFeature.ensureChildrenLoaded(collectionId, docId));
		}
		catch
		{
			if (this.#routeDocumentContext && Number(this.#routeDocumentContext.docId) === docId)
			{
				this.#routeDocumentContext.childrenLoading = false;
			}

			return;
		}

		this.#syncChildDocumentsState(docId, collectionId);
	}

	#syncChildDocumentsState(docId: number, collectionId: number): void
	{
		if (!this.#routeDocumentContext || Number(this.#routeDocumentContext.docId) !== docId)
		{
			return;
		}

		// children / childrenHasMore are kept live by the children watchEffect.
		this.#routeDocumentContext.childrenLoading = false;
		this.#routeDocumentContext.loadMoreChildren = () => {
			void this.#loadMoreChildDocuments(docId, collectionId);
		};
	}

	async #loadMoreChildDocuments(docId: number, collectionId: number): Promise<void>
	{
		if (
			!this.#sidebarFeature
			|| !this.#routeDocumentContext
			|| Number(this.#routeDocumentContext.docId) !== docId
			|| this.#routeDocumentContext.childrenLoading
		)
		{
			return;
		}

		const shared = this.#routeDocumentContext.document?.sharedAccess === true;
		const storeChildren = shared
			? this.#sidebarFeature.state.getSharedChildren(collectionId, docId)
			: this.#sidebarFeature.state.getChildren(collectionId, docId)
		;
		if (storeChildren.length > this.#routeDocumentContext.children.length)
		{
			this.#syncChildDocumentsState(docId, collectionId);

			return;
		}

		this.#routeDocumentContext.childrenLoading = true;

		try
		{
			await (shared
				? this.#sidebarFeature.loadMoreSharedChildren(collectionId, docId)
				: this.#sidebarFeature.loadMoreChildren(collectionId, docId));
		}
		catch
		{
			if (this.#routeDocumentContext && Number(this.#routeDocumentContext.docId) === docId)
			{
				this.#routeDocumentContext.childrenLoading = false;
			}

			return;
		}

		this.#syncChildDocumentsState(docId, collectionId);
	}

	#emitAction(name: string, payload: mixed): void
	{
		const callback = this.#options?.actions?.[name];
		if (Type.isFunction(callback))
		{
			callback(payload);
		}
	}

	#resolveLoadedDocument(documentId: number): Object | null
	{
		const id = Number(documentId);
		const doc = this.#routeDocumentContext?.document ?? null;
		if (!doc || Number(doc.id) !== id)
		{
			return null;
		}

		return doc;
	}

	#createDocumentActions(): Object
	{
		return {
			archive: (documentId) => {
				// Confirm (with the optional "with nested" checkbox) lives in the sidebar
				// archiveDocument use-case, mirroring the delete action below.
				const doc = this.#resolveLoadedDocument(documentId);
				if (doc && this.#sidebarFeature)
				{
					void this.#sidebarFeature.actions.archiveDocument(doc);
				}
			},
			restore: (documentId) => {
				const doc = this.#resolveLoadedDocument(documentId);
				if (doc && this.#sidebarFeature)
				{
					void this.#sidebarFeature.actions.restoreDocument(doc);
				}
			},
			delete: (documentId) => {
				const doc = this.#resolveLoadedDocument(documentId);
				if (doc && this.#sidebarFeature)
				{
					void this.#sidebarFeature.actions.deleteDocument(doc);
				}
			},
			restoreFromTrash: (documentId, hints = {}) => {
				void this.#restoreDocumentFromTrash(documentId, hints);
			},
			hardDelete: (documentId, hints = {}) => {
				void this.#hardDeleteDocument(documentId, hints);
			},
		};
	}

	async #restoreDocumentFromTrash(documentId: number, hints: Object = {}): Promise<void>
	{
		const doc = this.#resolveLoadedDocument(documentId);
		// Editor passes the freshest recycleBinId/isOrphan via hints — routeDocumentContext.document
		// stays at its initial-load snapshot and is stale after a push-driven trash flip.
		const recycleBinId = Number(hints?.recycleBinId) || Number(doc?.recycleBinId) || 0;
		const isOrphan = typeof hints?.isOrphan === 'boolean' ? hints.isOrphan : Boolean(doc?.isOrphan);
		if (!doc || recycleBinId <= 0)
		{
			return;
		}

		let targetCollectionId = null;
		if (isOrphan)
		{
			const result = await openOrphanRestorePopup({ documentTitle: String(doc.title || '') });
			if (!result)
			{
				return;
			}

			targetCollectionId = Number(result.collectionId) || null;
		}

		let restoredDocumentId = 0;
		try
		{
			const result = await new RecycleBinService().restoreDocument(recycleBinId, targetCollectionId);
			restoredDocumentId = Number(result?.documentId) || 0;
		}
		catch
		{
			this.#notify(Loc.getMessage('NOTE_RECYCLEBIN_PAGE_ERROR_GENERIC') || '', 'error');

			return;
		}

		this.#notify(Loc.getMessage('NOTE_RECYCLEBIN_PAGE_RESTORE_SUCCESS') || '');

		const currentRoute = this.#router?.currentRoute?.value;
		const currentRouteName = String(currentRoute?.name || '');
		const currentDocId = Number(currentRoute?.params?.id) || 0;

		if (restoredDocumentId > 0 && currentRouteName === ROUTE_NAME_DOCUMENT)
		{
			if (currentDocId === restoredDocumentId)
			{
				// Already on the restored document's page; the route stays the same,
				// so refresh resolver state manually to flip the editor out of trashed mode.
				void this.#syncRouteState(false, true);
			}
			else
			{
				void this.#router?.push?.({ name: ROUTE_NAME_DOCUMENT, params: { id: restoredDocumentId } });
			}

			return;
		}

		void this.#router?.push?.({ name: ROUTE_NAME_RECYCLE_BIN });
	}

	async #hardDeleteDocument(documentId: number, hints: Object = {}): Promise<void>
	{
		const doc = this.#resolveLoadedDocument(documentId);
		const recycleBinId = Number(hints?.recycleBinId) || Number(doc?.recycleBinId) || 0;
		if (!doc || recycleBinId <= 0)
		{
			return;
		}

		const confirmed = await this.#confirmHardDelete(String(doc.title || ''));
		if (!confirmed)
		{
			return;
		}

		try
		{
			await new RecycleBinService().hardDeleteDocument(recycleBinId);
		}
		catch
		{
			this.#notify(Loc.getMessage('NOTE_RECYCLEBIN_PAGE_ERROR_GENERIC') || '', 'error');

			return;
		}

		this.#notify(Loc.getMessage('NOTE_RECYCLEBIN_PAGE_HARD_DELETE_SUCCESS') || '');
		void this.#router?.push?.({ name: ROUTE_NAME_RECYCLE_BIN });
	}

	#confirmHardDelete(title: string): Promise<boolean>
	{
		return new Promise((resolve) => {
			let resolved = false;
			const finish = (value: boolean): void => {
				if (resolved)
				{
					return;
				}

				resolved = true;
				resolve(value);
			};

			const message = Loc.getMessage('NOTE_APP_HARD_DELETE_CONFIRM_MESSAGE', {
				'#TITLE#': Text.encode(String(title || '')),
			}) || '';

			const content = Tag.render`
				<div class="note-app-hard-delete-confirm-content">
					${message}
				</div>
			`;

			const dialog = new Dialog({
				title: Loc.getMessage('NOTE_APP_HARD_DELETE_CONFIRM_TITLE') || '',
				content,
				hasOverlay: true,
				overlay: true,
				width: 420,
				centerButtons: [
					new Button({
						text: Loc.getMessage('NOTE_APP_HARD_DELETE_CONFIRM_CANCEL') || '',
						size: ButtonSize.LARGE,
						style: AirButtonStyle.FILLED,
						useAirDesign: true,
						dataset: { testid: 'note-dialog-cancel' },
						onclick: () => {
							finish(false);
							dialog.hide();
						},
					}),
					new Button({
						text: Loc.getMessage('NOTE_APP_HARD_DELETE_CONFIRM_OK') || '',
						size: ButtonSize.LARGE,
						style: AirButtonStyle.PLAIN,
						useAirDesign: true,
						dataset: { testid: 'note-dialog-confirm' },
						onclick: () => {
							finish(true);
							dialog.hide();
						},
					}),
				],
				events: {
					onHide: () => {
						finish(false);
					},
				},
			});

			NoteThemeContext.themeDialog(dialog, content);

			dialog.show();
		});
	}

	#notify(content: string, category: string = 'success'): void
	{
		if (!content)
		{
			return;
		}

		BX.UI.Notification.Center.notify({ content, category, position: 'top-right' });
	}
}
