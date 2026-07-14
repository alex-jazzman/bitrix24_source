/* eslint-disable */
this.BX = this.BX || {};
this.BX.Note = this.BX.Note || {};
(function (exports, ui_designTokens_air, ui_iconSet_main, main_core, main_core_events, ui_vue3, note_sidebar, note_recyclebin, note_ui_themeContext, ui_notification, ui_buttons, ui_system_dialog, ui_vue3_router, ui_iconSet_api_vue, note_editor, note_search, note_shared, note_archive, note_workspace) {
	'use strict';

	const NoteLayout = {
		name: 'NoteLayout',
		components: {
			RouterView: ui_vue3_router.RouterView,
			BIcon: ui_iconSet_api_vue.BIcon,
			SidebarRootComponent: note_sidebar.SidebarRootComponent
		},
		props: {
			state: {
				type: Object,
				required: true
			},
			actions: {
				type: Object,
				required: true
			},
			store: {
				type: Object,
				required: true
			},
			messages: {
				type: Object,
				required: true
			},
			routeDocumentContext: {
				type: Object,
				required: true
			},
			documentActions: {
				type: Object,
				required: true
			},
			themeActions: {
				type: Object,
				default: null
			}
		},
		provide() {
			return {
				noteRouteDocumentContext: this.routeDocumentContext,
				noteDocumentActions: this.documentActions,
				noteSidebarActions: this.actions,
				noteSidebarState: this.state,
				noteSidebarStore: this.store
			};
		},
		data() {
			return {
				brandMeasureRaf: 0,
				onWindowResize: null,
				mobileSidebarOpen: false,
				headerCompact: false,
				scrollAnchorY: 0,
				scrollRaf: 0,
				onWindowScroll: null
			};
		},
		watch: {
			$route() {
				this.mobileSidebarOpen = false;
				this.headerCompact = false;
				this.scrollAnchorY = window.scrollY || document.documentElement.scrollTop || 0;
			},
			'state.isMobile': {
				immediate: false,
				handler(isMobile) {
					if (isMobile) {
						this.attachScrollTracker();
					} else {
						this.detachScrollTracker();
						this.headerCompact = false;
					}
				}
			}
		},
		mounted() {
			this.measureBrandMinWidth();
			// Re-measure after web fonts load: glyph metrics can change.
			if (document.fonts && typeof document.fonts.ready?.then === 'function') {
				document.fonts.ready.then(() => this.scheduleBrandMeasure()).catch(() => {});
			}
			// Catch zoom (browsers fire window resize on zoom).
			this.onWindowResize = () => this.scheduleBrandMeasure();
			window.addEventListener('resize', this.onWindowResize);
			if (this.state.isMobile) {
				this.attachScrollTracker();
			}
		},
		beforeUnmount() {
			if (this.onWindowResize) {
				window.removeEventListener('resize', this.onWindowResize);
				this.onWindowResize = null;
			}
			this.detachScrollTracker();
			if (this.brandMeasureRaf !== 0) {
				cancelAnimationFrame(this.brandMeasureRaf);
				this.brandMeasureRaf = 0;
			}
		},
		methods: {
			handleBrandClick() {
				window.open('/', '_blank', 'noopener');
			},
			toggleMobileSidebar() {
				this.mobileSidebarOpen = !this.mobileSidebarOpen;
			},
			closeMobileSidebar() {
				this.mobileSidebarOpen = false;
			},
			scheduleBrandMeasure() {
				if (this.brandMeasureRaf !== 0) {
					return;
				}
				this.brandMeasureRaf = requestAnimationFrame(() => {
					this.brandMeasureRaf = 0;
					this.measureBrandMinWidth();
				});
			},
			attachScrollTracker() {
				if (this.onWindowScroll) {
					return;
				}
				this.scrollAnchorY = window.scrollY || document.documentElement.scrollTop || 0;
				this.onWindowScroll = this.handleWindowScroll.bind(this);
				window.addEventListener('scroll', this.onWindowScroll, {
					passive: true
				});
			},
			detachScrollTracker() {
				if (this.onWindowScroll) {
					window.removeEventListener('scroll', this.onWindowScroll);
					this.onWindowScroll = null;
				}
				if (this.scrollRaf !== 0) {
					cancelAnimationFrame(this.scrollRaf);
					this.scrollRaf = 0;
				}
			},
			handleWindowScroll() {
				if (this.scrollRaf !== 0) {
					return;
				}
				this.scrollRaf = requestAnimationFrame(() => {
					this.scrollRaf = 0;
					const y = window.scrollY || document.documentElement.scrollTop || 0;
					const flipThreshold = 24;
					const topGuard = 48;
					if (y <= topGuard) {
						if (this.headerCompact) {
							this.headerCompact = false;
						}
						this.scrollAnchorY = y;
						return;
					}
					const delta = y - this.scrollAnchorY;
					if (delta > flipThreshold && !this.headerCompact) {
						this.headerCompact = true;
						this.scrollAnchorY = y;
					} else if (delta < -flipThreshold && this.headerCompact) {
						this.headerCompact = false;
						this.scrollAnchorY = y;
					} else if (delta > 0 && this.headerCompact || delta < 0 && !this.headerCompact) {
						this.scrollAnchorY = y;
					}
				});
			},
			measureBrandMinWidth() {
				const brand = this.$refs.brand;
				if (!brand || !main_core.Type.isFunction(this.actions.setSidebarMinWidth)) {
					return;
				}
				const previousWidth = brand.style.width;
				try {
					brand.style.width = 'max-content';
					const intrinsicWidth = Math.ceil(brand.getBoundingClientRect().width);
					// Account for the -1px divider compensation in CSS.
					this.actions.setSidebarMinWidth(intrinsicWidth + 1);
				} finally {
					brand.style.width = previousWidth;
				}
			}
		},
		template: `
		<div class="note-page" :style="{ '--note-sidebar-width': \`\${state.sidebarWidth}px\` }">
			<header
				class="note-page-header"
				:class="{ 'is-compact': state.isMobile && headerCompact }"
			>
				<button
					v-if="state.isMobile"
					type="button"
					class="note-page-mobile-burger"
					@click="toggleMobileSidebar"
				>
					<BIcon name="menu" :size="22" />
				</button>
				<button ref="brand" type="button" class="note-page-brand" @click="handleBrandClick">
					<span class="note-page-brand-logo">
						<span class="note-page-brand-logo-text">{{ messages.brandName }}</span>
						<span class="note-page-brand-logo-number">{{ messages.brandSuffix }}</span>
						<BIcon class="note-page-brand-logo-clock" name="clock-2" :size="14" />
					</span>
					<span class="note-page-brand-subtitle">{{ messages.knowledgeBase }}</span>
				</button>
				<span class="note-page-header-divider"></span>
				<div id="note-page-header-slot" class="note-page-header-slot"></div>
			</header>
			<div
				class="main-layout"
				:class="{ 'is-mobile-sidebar-open': state.isMobile && mobileSidebarOpen }"
			>
				<SidebarRootComponent
					:state="state"
					:actions="actions"
					:messages="messages"
					:theme-actions="themeActions"
				/>
				<main class="content">
					<RouterView />
				</main>
			</div>
			<button
				v-if="state.isMobile && mobileSidebarOpen"
				type="button"
				class="note-page-mobile-backdrop"
				@click="closeMobileSidebar"
			></button>
		</div>
	`
	};

	const HomePage = {
		name: 'HomePage',
		template: `
		<div class="content-body">
		</div>
	`
	};

	const ROUTE_NAME_HOME = 'home';
	const ROUTE_NAME_SEARCH = 'search';
	const ROUTE_NAME_SHARED = 'shared';
	const ROUTE_NAME_ARCHIVE = 'archive';
	const ROUTE_NAME_RECYCLE_BIN = 'recyclebin';
	const ROUTE_NAME_DOCUMENT = 'document';
	const ROUTE_NAME_WORKSPACE = 'workspace';

	const DocumentPage = {
		name: 'DocumentPage',
		components: {
			NoteDocumentPageComponent: note_editor.NoteDocumentPageComponent
		},
		inject: {
			noteRouteDocumentContext: {
				default: null
			},
			noteDocumentActions: {
				default: null
			}
		},
		props: {
			documentId: {
				type: Number,
				required: true
			}
		},
		computed: {
			routeDocumentContext() {
				return this.noteRouteDocumentContext ?? {
					status: 'idle',
					docId: 0,
					document: null,
					ancestors: [],
					errorMessage: ''
				};
			},
			children() {
				return this.routeDocumentContext?.children ?? [];
			},
			childrenLoading() {
				return Boolean(this.routeDocumentContext?.childrenLoading);
			},
			childrenHasMore() {
				return Boolean(this.routeDocumentContext?.childrenHasMore);
			},
			loadMoreChildren() {
				return this.routeDocumentContext?.loadMoreChildren ?? (() => {});
			},
			documentActions() {
				return this.noteDocumentActions ?? {};
			}
		},
		watch: {
			'routeDocumentContext.status': {
				immediate: true,
				handler(status) {
					if (status === 'not_found' || status === 'error') {
						this.onUnavailable();
					}
				}
			}
		},
		methods: {
			onUnavailable() {
				// Unified handler for inaccessible/missing documents: single toast + redirect home.
				// Sidebar route-sync stays silent; editor feature also stops surfacing local toasts for these statuses.
				const message = main_core.Loc.getMessage('NOTE_SIDEBAR_ERROR_DOCUMENT_NOT_FOUND') || '';
				if (message !== '') {
					BX.UI.Notification.Center.notify({
						content: message,
						position: 'top-right'
					});
				}
				this.$router.replace({
					name: ROUTE_NAME_HOME
				});
			}
		},
		template: `
		<NoteDocumentPageComponent
			:document-id="documentId"
			:route-document-context="routeDocumentContext"
			:children="children"
			:children-loading="childrenLoading"
			:children-has-more="childrenHasMore"
			:load-more-children="loadMoreChildren"
			:document-actions="documentActions"
		/>
	`
	};

	const SearchPage = {
		name: 'SearchPage',
		components: {
			NoteSearchPageComponent: note_search.NoteSearchPageComponent
		},
		props: {
			query: {
				type: String,
				default: ''
			}
		},
		methods: {
			onOpen(payload) {
				const documentId = Number(payload?.documentId);
				if (!Number.isFinite(documentId) || documentId <= 0) {
					return;
				}
				this.$router.push({
					name: ROUTE_NAME_DOCUMENT,
					params: {
						id: documentId
					}
				});
			},
			onUpdateQuery(query) {
				this.$router.replace({
					name: ROUTE_NAME_SEARCH,
					query: {
						q: query || undefined
					}
				});
			}
		},
		template: `
		<NoteSearchPageComponent
			:query="query"
			@open="onOpen"
			@update-query="onUpdateQuery"
		/>
	`
	};

	const SharedPage = {
		name: 'SharedPage',
		components: {
			NoteSharedPageComponent: note_shared.NoteSharedPageComponent
		},
		methods: {
			onOpen(payload) {
				const documentId = Number(payload?.documentId);
				if (!Number.isFinite(documentId) || documentId <= 0) {
					return;
				}
				this.$router.push({
					name: ROUTE_NAME_DOCUMENT,
					params: {
						id: documentId
					}
				});
			}
		},
		template: `
		<NoteSharedPageComponent @open="onOpen" />
	`
	};

	const ArchivePage = {
		name: 'ArchivePage',
		components: {
			NoteArchivePageComponent: note_archive.NoteArchivePageComponent
		},
		methods: {
			onOpen(payload) {
				const documentId = Number(payload?.documentId);
				if (!Number.isFinite(documentId) || documentId <= 0) {
					return;
				}
				this.$router.push({
					name: ROUTE_NAME_DOCUMENT,
					params: {
						id: documentId
					}
				});
			}
		},
		template: `
		<NoteArchivePageComponent @open="onOpen" />
	`
	};

	const RecycleBinPage = {
		name: 'RecycleBinPage',
		components: {
			NoteRecycleBinPageComponent: note_recyclebin.NoteRecycleBinPageComponent
		},
		methods: {
			onOpen(payload) {
				const documentId = Number(payload?.documentId);
				if (!Number.isFinite(documentId) || documentId <= 0) {
					return;
				}
				this.$router.push({
					name: ROUTE_NAME_DOCUMENT,
					params: {
						id: documentId
					}
				});
			},
			onRestoreOrphan(payload) {
			}
		},
		template: `
		<NoteRecycleBinPageComponent
			@open="onOpen"
			@restore-orphan="onRestoreOrphan"
		/>
	`
	};

	const WorkspacePage = {
		name: 'WorkspacePage',
		components: {
			NoteWorkspacePageComponent: note_workspace.NoteWorkspacePageComponent
		},
		props: {
			collectionId: {
				type: Number,
				required: true
			}
		},
		methods: {
			onOpen(payload) {
				const documentId = Number(payload?.documentId);
				if (!Number.isFinite(documentId) || documentId <= 0) {
					return;
				}
				this.$router.push({
					name: ROUTE_NAME_DOCUMENT,
					params: {
						id: documentId
					}
				});
			},
			onArchived() {
				this.$router.replace({
					name: ROUTE_NAME_HOME
				});
			},
			onDeleted() {
				this.$router.replace({
					name: ROUTE_NAME_HOME
				});
			},
			onNotFound() {
				const message = main_core.Loc.getMessage('NOTE_WORKSPACE_NOT_FOUND') || '';
				if (message !== '') {
					BX.UI.Notification.Center.notify({
						content: message,
						position: 'top-right'
					});
				}
				this.$router.replace({
					name: ROUTE_NAME_HOME
				});
			}
		},
		template: `
		<NoteWorkspacePageComponent
			:collection-id="collectionId"
			@open="onOpen"
			@archived="onArchived"
			@deleted="onDeleted"
			@not-found="onNotFound"
		/>
	`
	};

	const routes = [{
		path: '/',
		name: ROUTE_NAME_HOME,
		component: HomePage
	}, {
		path: '/search/',
		name: ROUTE_NAME_SEARCH,
		component: SearchPage,
		props: route => ({
			query: String(route.query.q ?? '')
		})
	}, {
		path: '/shared/',
		name: ROUTE_NAME_SHARED,
		component: SharedPage
	}, {
		path: '/archive/',
		name: ROUTE_NAME_ARCHIVE,
		component: ArchivePage
	}, {
		path: '/recyclebin/',
		name: ROUTE_NAME_RECYCLE_BIN,
		component: RecycleBinPage
	}, {
		path: '/document/:id(\\d+)/',
		name: ROUTE_NAME_DOCUMENT,
		component: DocumentPage,
		props: route => ({
			documentId: Number(route.params.id)
		})
	}, {
		path: '/document/:id(\\d+)',
		redirect: to => ({
			name: ROUTE_NAME_DOCUMENT,
			params: {
				id: to.params.id
			},
			hash: to.hash,
			query: to.query
		})
	}, {
		path: '/workspace/:id(\\d+)/',
		name: ROUTE_NAME_WORKSPACE,
		component: WorkspacePage,
		props: route => ({
			collectionId: Number(route.params.id)
		})
	}, {
		path: '/workspace/:id(\\d+)',
		redirect: to => ({
			name: ROUTE_NAME_WORKSPACE,
			params: {
				id: to.params.id
			},
			hash: to.hash,
			query: to.query
		})
	}, {
		path: '/:pathMatch(.*)*',
		redirect: {
			name: ROUTE_NAME_HOME
		}
	}];

	const DEFAULT_BASE = '/note/';
	function createNoteRouter() {
		return ui_vue3_router.createRouter({
			history: ui_vue3_router.createWebHistory(DEFAULT_BASE),
			routes,
			scrollBehavior(to, from, savedPosition) {
				if (savedPosition) {
					return savedPosition;
				}

				// Hash scrolling is owned by the document page: the target heading may
				// not exist yet (async load) and can live inside a collapsed section
				// that has to be expanded first. See feature.scrollToAnchor().
				if (to.hash) {
					return false;
				}
				if (!from || to.path !== from.path) {
					// The app's scrollable surface is <main class="content">, not the
					// window — Vue Router's { top: 0 } only resets window scroll, which
					// leaves a previously-scrolled .content stuck on the new page.
					const content = document.querySelector('main.content');
					if (content instanceof HTMLElement) {
						content.scrollTop = 0;
					}
					return {
						top: 0
					};
				}
				return false;
			}
		});
	}

	const ThemeApi = {
		async save(theme) {
			const normalized = theme === 'dark' ? 'dark' : 'light';
			try {
				await main_core.ajax.runAction('main.userOption.saveOptions', {
					json: {
						newValues: [{
							c: 'note',
							n: 'theme',
							v: normalized
						}]
					}
				});
			} catch (error) {
				// Persistence failure must not break the toggle UX.
				// eslint-disable-next-line no-console
				console.warn('note.app: failed to save theme', error);
			}
		}
	};

	class RouteDocumentResolver {
		#inFlightById = new Map();
		async resolve(docId, {
			fullContext = false
		} = {}) {
			const normalizedDocId = this.#toPositiveInt(docId);
			if (normalizedDocId === null) {
				return this.#emptyResult('not_found');
			}
			try {
				if (fullContext) {
					return await this.#resolveWithOpenContext(normalizedDocId);
				}
				const document = await this.#getDocument(normalizedDocId);
				if (!document) {
					return this.#emptyResult('not_found');
				}
				return {
					status: 'ready',
					document,
					ancestors: document.ancestors,
					openContext: null,
					errorMessage: ''
				};
			} catch (error) {
				const message = main_core.Type.isStringFilled(error?.message) ? error.message : '';
				return {
					...this.#emptyResult('error'),
					errorMessage: message
				};
			}
		}
		async #resolveWithOpenContext(docId) {
			const response = await main_core.ajax.runAction('note.infrastructure.DocumentController.getOpenContext', {
				data: {
					id: docId
				}
			});
			const context = response?.data ?? null;
			if (!main_core.Type.isPlainObject(context)) {
				return this.#emptyResult('not_found');
			}
			const document = this.#normalizeDocument(context.document);
			if (!document) {
				return this.#emptyResult('not_found');
			}
			return {
				status: 'ready',
				document,
				ancestors: document.ancestors,
				openContext: context,
				errorMessage: ''
			};
		}
		#emptyResult(status) {
			return {
				status,
				document: null,
				ancestors: [],
				openContext: null,
				errorMessage: ''
			};
		}
		async #getDocument(docId) {
			if (this.#inFlightById.has(docId)) {
				return this.#inFlightById.get(docId);
			}
			let request = null;
			request = (async () => {
				try {
					const response = await main_core.ajax.runAction('note.infrastructure.DocumentController.get', {
						data: {
							id: docId
						}
					});
					return this.#normalizeDocument(response?.data ?? null);
				} finally {
					if (this.#inFlightById.get(docId) === request) {
						this.#inFlightById.delete(docId);
					}
				}
			})();
			this.#inFlightById.set(docId, request);
			return request;
		}
		#normalizeDocument(row) {
			if (!main_core.Type.isPlainObject(row)) {
				return null;
			}
			const id = this.#toPositiveInt(row.id);
			if (id === null) {
				return null;
			}
			const sharedAccess = Boolean(row.sharedAccess);
			const isTrashed = Boolean(row.isTrashed);
			const collectionId = this.#toPositiveInt(row.collectionId);
			if (collectionId === null && !sharedAccess && !isTrashed) {
				return null;
			}
			const markdown = main_core.Type.isArray(row.markdown) || main_core.Type.isPlainObject(row.markdown) || main_core.Type.isString(row.markdown) ? row.markdown : null;
			return {
				...row,
				id,
				collectionId: collectionId ?? 0,
				collectionTitle: String(row.collectionTitle ?? ''),
				ancestors: this.#normalizeAncestors(row.ancestors),
				canEdit: Boolean(row.canEdit),
				canEditCollection: Boolean(row.canEditCollection),
				sharedAccess,
				parentId: this.#toNullableInt(row.parentId),
				title: String(row.title ?? ''),
				markdown,
				position: this.#toInt(row.position) ?? 0,
				isArchived: Boolean(row.isArchived),
				archivedAt: typeof row.archivedAt === 'string' && row.archivedAt !== '' ? row.archivedAt : null,
				isTrashed,
				trashedAt: typeof row.trashedAt === 'string' && row.trashedAt !== '' ? row.trashedAt : null,
				isOrphan: Boolean(row.isOrphan),
				canRestore: Boolean(row.canRestore)
			};
		}
		#normalizeAncestors(value) {
			if (!Array.isArray(value)) {
				return [];
			}
			const result = [];
			for (const item of value) {
				if (!main_core.Type.isPlainObject(item)) {
					continue;
				}
				const id = this.#toPositiveInt(item.id);
				if (id === null) {
					continue;
				}
				result.push({
					id,
					title: String(item.title ?? '')
				});
			}
			return result;
		}
		#toInt(value) {
			const parsed = Number(value);
			if (!Number.isFinite(parsed)) {
				return null;
			}
			return Math.trunc(parsed);
		}
		#toPositiveInt(value) {
			const normalized = this.#toInt(value);
			return normalized !== null && normalized > 0 ? normalized : null;
		}
		#toNullableInt(value) {
			if (value === null || value === undefined || value === '') {
				return null;
			}
			return this.#toInt(value);
		}
	}

	class NoteApp {
		#app = null;
		#router = null;
		#options = {};
		#sidebarFeature = null;
		#routeDocumentResolver = null;
		#routeDocumentContext = null;
		#removeRouteAfterEach = null;
		#routeSyncId = 0;
		#initialCollections = null;
		#hasInitialCollectionsHydration = false;
		#initialSidebarContext = null;
		#hasInitialSidebarHydration = false;
		#isInitialRouteContextConsumed = false;
		#basePageTitle = '';
		#handleDocRenamed = null;
		#handleCollectionRenamed = null;
		#handleChildrenChanged = null;
		#childrenWatchStop = null;
		#documentActions = null;
		#dialogService = new note_sidebar.DialogService();
		#lastKnownCollectionId = 0;
		#lastKnownCollectionTitle = '';
		#previousRouteName = '';
		#themeState = null;
		#themeActions = null;
		#themeRoot = null;
		mount(target, options) {
			if (!main_core.Type.isStringFilled(target)) {
				throw new Error('Target selector is required');
			}
			this.destroy();
			this.#options = main_core.Type.isPlainObject(options) ? options : {};
			this.#basePageTitle = this.#resolveCurrentPageTitle();
			this.#initialCollections = this.#extractInitialCollections(this.#options.initialCollections);
			this.#initialSidebarContext = this.#extractInitialSidebarContext(this.#options.initialSidebarContext);
			const sidebarOptions = this.#extractSidebarOptions(this.#options.sidebarOptions);
			this.#themeState = ui_vue3.reactive({
				theme: this.#extractTheme(this.#options.theme)
			});
			this.#themeActions = {
				state: this.#themeState,
				toggle: () => this.#toggleTheme(),
				set: theme => this.#setTheme(theme)
			};
			this.#router = createNoteRouter();
			this.#routeDocumentResolver = new RouteDocumentResolver();
			this.#routeDocumentContext = ui_vue3.reactive(this.#createRouteDocumentContext());
			this.#sidebarFeature = note_sidebar.createSidebarFeature({
				router: this.#router,
				emitAction: (name, payload) => this.#emitAction(name, payload),
				getRouteDocumentContext: () => this.#routeDocumentContext,
				reloadRouteDocumentContext: async () => {
					await this.#syncRouteState(false);
				},
				routeNames: {
					home: ROUTE_NAME_HOME,
					document: ROUTE_NAME_DOCUMENT,
					search: ROUTE_NAME_SEARCH,
					shared: ROUTE_NAME_SHARED,
					archive: ROUTE_NAME_ARCHIVE,
					recyclebin: ROUTE_NAME_RECYCLE_BIN,
					workspace: ROUTE_NAME_WORKSPACE
				},
				sidebarOptions,
				isMobile: Boolean(this.#options.isMobile)
			});
			this.#documentActions = this.#createDocumentActions();

			// Live-mirror the open document's sidebar branch into the editor children-block.
			// Every create/rename/move/remove the store applies reaches the block without a
			// per-event re-sync — getChildren returns the reactive docsByParent array.
			this.#childrenWatchStop = ui_vue3.watchEffect(() => {
				const ctx = this.#routeDocumentContext;
				if (!ctx || !this.#sidebarFeature) {
					return;
				}
				const docId = Number(ctx.docId);
				const collectionId = Number(ctx.document?.collectionId);
				if (!Number.isInteger(docId) || docId <= 0 || !Number.isInteger(collectionId) || collectionId <= 0) {
					ctx.children = [];
					ctx.childrenHasMore = false;
					return;
				}
				ctx.children = this.#sidebarFeature.state.getChildren(collectionId, docId);
				ctx.childrenHasMore = this.#sidebarFeature.hasNextChildren(collectionId, docId);
			});
			this.#app = ui_vue3.BitrixVue.createApp(NoteLayout, {
				state: this.#sidebarFeature.state,
				actions: this.#sidebarFeature.actions,
				store: this.#sidebarFeature.store,
				messages: this.#sidebarFeature.messages,
				routeDocumentContext: this.#routeDocumentContext,
				documentActions: this.#documentActions,
				themeActions: this.#themeActions
			});
			// @chef-ignore
			this.#app.use(this.#router);
			this.#app.mount(target);
			this.#themeRoot = document.querySelector(target);
			this.#applyThemeClass(this.#themeState.theme);
			this.#applyMobileClass(Boolean(this.#options.isMobile));
			this.#handleDocRenamed = event => {
				const {
					id,
					title
				} = event.getData();
				if (this.#routeDocumentContext?.docId === id && this.#routeDocumentContext?.document) {
					this.#routeDocumentContext.document.title = title;
					this.#syncPageTitle();
				}
			};
			this.#handleCollectionRenamed = event => {
				const {
					id,
					name
				} = event.getData();
				if (this.#routeDocumentContext?.document && Number(this.#routeDocumentContext.document.collectionId) === id) {
					this.#routeDocumentContext.document.collectionTitle = name;
				}
				if (Number(id) > 0 && Number(id) === this.#lastKnownCollectionId) {
					this.#lastKnownCollectionTitle = String(name ?? '');
				}
			};
			this.#handleChildrenChanged = event => {
				const {
					parentId,
					collectionId
				} = event.getData();
				if (this.#routeDocumentContext && this.#sidebarFeature && Number(this.#routeDocumentContext.docId) === parentId) {
					// Display is handled reactively by the children watchEffect; we only need
					// to fetch an unloaded branch (first remote child of a leaf) so it has
					// something to mirror. ensureChildrenLoaded is a no-op once hydrated.
					void this.#sidebarFeature.ensureChildrenLoaded(Number(collectionId), parentId);
				}
			};
			main_core_events.EventEmitter.subscribe(note_sidebar.NoteEvent.DOCUMENT_RENAMED, this.#handleDocRenamed);
			main_core_events.EventEmitter.subscribe(note_sidebar.NoteEvent.COLLECTION_RENAMED, this.#handleCollectionRenamed);
			main_core_events.EventEmitter.subscribe(note_sidebar.NoteEvent.DOCUMENT_CHILDREN_CHANGED, this.#handleChildrenChanged);
			void this.#bootstrap();
			return this;
		}
		destroy() {
			this.#applyMobileClass(false);
			if (main_core.Type.isFunction(this.#childrenWatchStop)) {
				this.#childrenWatchStop();
				this.#childrenWatchStop = null;
			}
			if (this.#app) {
				this.#app.unmount();
				this.#app = null;
			}
			if (this.#sidebarFeature) {
				this.#sidebarFeature.destroy();
				this.#sidebarFeature = null;
			}
			if (main_core.Type.isFunction(this.#removeRouteAfterEach)) {
				this.#removeRouteAfterEach();
				this.#removeRouteAfterEach = null;
			}
			if (this.#handleDocRenamed) {
				main_core_events.EventEmitter.unsubscribe(note_sidebar.NoteEvent.DOCUMENT_RENAMED, this.#handleDocRenamed);
				this.#handleDocRenamed = null;
			}
			if (this.#handleCollectionRenamed) {
				main_core_events.EventEmitter.unsubscribe(note_sidebar.NoteEvent.COLLECTION_RENAMED, this.#handleCollectionRenamed);
				this.#handleCollectionRenamed = null;
			}
			if (this.#handleChildrenChanged) {
				main_core_events.EventEmitter.unsubscribe(note_sidebar.NoteEvent.DOCUMENT_CHILDREN_CHANGED, this.#handleChildrenChanged);
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
		}
		#extractTheme(theme) {
			return theme === note_ui_themeContext.NoteTheme.DARK ? note_ui_themeContext.NoteTheme.DARK : note_ui_themeContext.NoteTheme.LIGHT;
		}
		#applyMobileClass(isMobile) {
			const root = document.documentElement;
			if (!root) {
				return;
			}
			root.classList.toggle('note-mobile', Boolean(isMobile));
		}
		#applyThemeClass(theme) {
			if (!this.#themeRoot) {
				return;
			}
			const lightClass = note_ui_themeContext.NoteThemeContext.resolveDesignSystemContext(note_ui_themeContext.NoteTheme.LIGHT);
			const darkClass = note_ui_themeContext.NoteThemeContext.resolveDesignSystemContext(note_ui_themeContext.NoteTheme.DARK);
			const targetClass = note_ui_themeContext.NoteThemeContext.resolveDesignSystemContext(theme);
			this.#themeRoot.classList.remove(lightClass, darkClass);
			this.#themeRoot.classList.add(targetClass);
			note_ui_themeContext.NoteThemeContext.set(theme);
		}
		#setTheme(theme) {
			const normalized = this.#extractTheme(theme);
			if (!this.#themeState || this.#themeState.theme === normalized) {
				return;
			}
			this.#themeState.theme = normalized;
			this.#applyThemeClass(normalized);
			void ThemeApi.save(normalized);
		}
		#toggleTheme() {
			if (!this.#themeState) {
				return;
			}
			this.#setTheme(this.#themeState.theme === note_ui_themeContext.NoteTheme.DARK ? note_ui_themeContext.NoteTheme.LIGHT : note_ui_themeContext.NoteTheme.DARK);
		}
		async #bootstrap() {
			try {
				await this.#router.isReady();
				await this.#applyWelcomeRedirect();
				const hasInitialCollections = this.#hydrateFromInitialCollections();
				this.#hydrateFromInitialSidebarContext();
				await this.#sidebarFeature.bootstrap({
					skipInitialCollectionsLoad: hasInitialCollections
				});
				await this.#syncRouteState(true);
				if (!main_core.Type.isFunction(this.#removeRouteAfterEach)) {
					this.#removeRouteAfterEach = this.#router.afterEach((to, from) => {
						this.#previousRouteName = String(from?.name || '');
						void this.#syncRouteState(false);
					});
				}
			} catch {
				// sidebar/app keep local error handling
			}
		}
		async #syncRouteState(withCollectionFallback = false) {
			const syncId = ++this.#routeSyncId;
			this.#applyImmediateSharedFlag();
			this.#captureLastKnownCollectionFromRoute();
			await this.#syncRouteDocumentContext(syncId);
			if (syncId !== this.#routeSyncId || !this.#sidebarFeature) {
				return;
			}
			await this.#sidebarFeature.syncFromRouteContext(withCollectionFallback, {
				previousRouteName: this.#previousRouteName ?? ''
			});
		}
		#applyImmediateSharedFlag() {
			if (!this.#sidebarFeature) {
				return;
			}
			const routeName = String(this.#router?.currentRoute?.value?.name || '');
			if (typeof this.#sidebarFeature.setSharedView === 'function') {
				this.#sidebarFeature.setSharedView(routeName === ROUTE_NAME_SHARED);
			}
			if (typeof this.#sidebarFeature.setArchiveView === 'function') {
				this.#sidebarFeature.setArchiveView(routeName === ROUTE_NAME_ARCHIVE);
			}
			if (typeof this.#sidebarFeature.setRecycleBinView === 'function') {
				this.#sidebarFeature.setRecycleBinView(routeName === ROUTE_NAME_RECYCLE_BIN);
			}
		}
		#captureLastKnownCollectionFromRoute() {
			if (!this.#sidebarFeature || !this.#router) {
				return;
			}
			const route = this.#router.currentRoute?.value ?? null;
			const routeName = String(route?.name || '');
			if (routeName !== ROUTE_NAME_WORKSPACE) {
				return;
			}
			const collectionId = Number(route?.params?.id);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return;
			}
			const collection = this.#sidebarFeature.findCollection?.(collectionId) ?? null;
			const title = collection?.name;
			this.#updateLastKnownCollection(collectionId, main_core.Type.isStringFilled(title) ? String(title) : '');
		}
		#updateLastKnownCollection(collectionId, collectionTitle) {
			const id = Number(collectionId);
			if (!Number.isInteger(id) || id <= 0) {
				return;
			}
			if (id !== this.#lastKnownCollectionId) {
				this.#lastKnownCollectionId = id;
				this.#lastKnownCollectionTitle = String(collectionTitle ?? '');
				return;
			}

			// Same collection: keep an existing non-empty title rather than overwriting it with empty
			// (e.g. when sidebar hasn't hydrated the collection name yet during a fast navigation).
			if (main_core.Type.isStringFilled(collectionTitle)) {
				this.#lastKnownCollectionTitle = String(collectionTitle);
			}
		}
		async #syncRouteDocumentContext(syncId) {
			if (!this.#router || !this.#routeDocumentResolver || !this.#routeDocumentContext) {
				return;
			}
			const routeDocId = this.#extractRouteDocumentId(this.#router.currentRoute?.value);
			if (this.#applyInitialRouteDocumentContext(routeDocId)) {
				return;
			}
			if (routeDocId <= 0) {
				this.#setRouteDocumentContext({
					status: 'idle',
					docId: 0,
					document: null,
					ancestors: [],
					errorMessage: '',
					viewMode: this.#resolveViewMode()
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
				viewMode: this.#resolveViewMode()
			});
			const fullContext = !this.#isDocumentLoadedInSidebar(routeDocId);
			const resolved = await this.#routeDocumentResolver.resolve(routeDocId, {
				fullContext
			});
			if (syncId !== this.#routeSyncId) {
				return;
			}
			this.#setRouteDocumentContext({
				status: resolved.status,
				docId: routeDocId,
				document: resolved.document,
				ancestors: resolved.ancestors,
				openContext: resolved.openContext,
				errorMessage: resolved.errorMessage,
				viewMode: this.#resolveViewModeFromDocument(resolved.document)
			});
			if (resolved.status === 'ready' && main_core.Type.isPlainObject(resolved.document)) {
				const resolvedCollectionId = Number(resolved.document.collectionId);
				const resolvedCollectionTitle = String(resolved.document.collectionTitle ?? '');
				if (Number.isInteger(resolvedCollectionId) && resolvedCollectionId > 0) {
					this.#updateLastKnownCollection(resolvedCollectionId, resolvedCollectionTitle);
				}
				void this.#loadChildDocuments(routeDocId, resolved.document);
			}
		}
		#resolveViewModeFromDocument(document) {
			if (main_core.Type.isPlainObject(document)) {
				if (document.isTrashed) {
					return 'recyclebin';
				}
				if (document.isArchived) {
					return 'archive';
				}
				if (document.sharedAccess) {
					return 'shared';
				}

				// Loaded document is the source of truth: don't fall back to route hints,
				// otherwise stale previousRouteName (e.g. 'recyclebin' after Restore) keeps
				// the breadcrumb root in trash mode via header's effectiveMode hint branch.
				return 'normal';
			}
			return this.#resolveViewMode();
		}
		#isDocumentLoadedInSidebar(docId) {
			if (!this.#sidebarFeature || typeof this.#sidebarFeature.isDocumentLoaded !== 'function') {
				return false;
			}
			return Boolean(this.#sidebarFeature.isDocumentLoaded(docId));
		}
		#extractSidebarDocumentPreview(docId) {
			const sidebarDoc = this.#sidebarFeature?.findLoadedDocumentAnywhere?.(docId) ?? null;
			const sidebarAncestors = Array.isArray(this.#sidebarFeature?.getAncestorsForDocument?.(docId)) ? this.#sidebarFeature.getAncestorsForDocument(docId) : [];
			let collectionIdRaw = Number(sidebarDoc?.collectionId ?? 0) || 0;
			if (collectionIdRaw === 0) {
				// Fallback: when navigating from /workspace/X the doc may not be in the sidebar tree yet
				// (workspace uses listByCollection, not listByParent), but the sidebar still has the
				// originating collection selected — use it for the breadcrumb.
				collectionIdRaw = Number(this.#sidebarFeature?.state?.selectedCollectionId ?? 0) || 0;
			}
			if (collectionIdRaw === 0 && this.#lastKnownCollectionId > 0) {
				collectionIdRaw = this.#lastKnownCollectionId;
			}
			if (collectionIdRaw <= 0) {
				return sidebarDoc ? {
					title: String(sidebarDoc.title ?? ''),
					collectionId: 0,
					collectionTitle: '',
					isArchived: Boolean(sidebarDoc.isArchived),
					ancestors: sidebarAncestors
				} : null;
			}
			const collection = this.#sidebarFeature?.findCollection?.(collectionIdRaw) ?? null;
			let collectionTitle = String(sidebarDoc?.collectionTitle || collection?.name || '');
			if (collectionTitle === '' && collectionIdRaw === this.#lastKnownCollectionId) {
				collectionTitle = this.#lastKnownCollectionTitle;
			}
			return {
				title: String(sidebarDoc?.title ?? ''),
				collectionId: collectionIdRaw,
				collectionTitle,
				isArchived: Boolean(sidebarDoc?.isArchived),
				ancestors: sidebarAncestors
			};
		}
		#extractRouteDocumentId(route) {
			if (!route || route.name !== ROUTE_NAME_DOCUMENT) {
				return 0;
			}
			const docId = Number(route.params?.id);
			return Number.isInteger(docId) && docId > 0 ? docId : 0;
		}
		#createRouteDocumentContext() {
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
				loadMoreChildren: () => {}
			};
		}
		#resolveViewMode() {
			const routeName = String(this.#router?.currentRoute?.value?.name || '');
			if (routeName === ROUTE_NAME_ARCHIVE) {
				return 'archive';
			}
			if (routeName === ROUTE_NAME_RECYCLE_BIN) {
				return 'recyclebin';
			}
			if (routeName === ROUTE_NAME_SHARED) {
				return 'shared';
			}
			if (routeName !== ROUTE_NAME_DOCUMENT) {
				return 'normal';
			}

			// /document/N: prefer the doc's own flags from sidebar — sidebar tree is the most reliable
			// signal during loading (e.g. user came from /archive but clicked a regular collection doc
			// from the sidebar; previousRouteName='archive' must NOT poison the breadcrumb root).
			const docId = this.#extractRouteDocumentId(this.#router?.currentRoute?.value);
			const sidebarDoc = docId > 0 ? this.#sidebarFeature?.findLoadedDocumentAnywhere?.(docId) ?? null : null;
			if (sidebarDoc) {
				if (sidebarDoc.isTrashed) {
					return 'recyclebin';
				}
				if (sidebarDoc.isArchived) {
					return 'archive';
				}
				if (sidebarDoc.sharedAccess) {
					return 'shared';
				}
				return 'normal';
			}

			// Sidebar doesn't know the doc: use the source route as a hint while the backend resolves.
			if (this.#previousRouteName === ROUTE_NAME_ARCHIVE) {
				return 'archive';
			}
			if (this.#previousRouteName === ROUTE_NAME_RECYCLE_BIN) {
				return 'recyclebin';
			}
			if (this.#previousRouteName === ROUTE_NAME_SHARED) {
				return 'shared';
			}
			const existingDoc = this.#routeDocumentContext?.document;
			if (main_core.Type.isPlainObject(existingDoc)) {
				if (existingDoc.isTrashed) {
					return 'recyclebin';
				}
				if (existingDoc.isArchived) {
					return 'archive';
				}
				if (existingDoc.sharedAccess) {
					return 'shared';
				}
			}
			return 'normal';
		}
		#getBrowserDocument() {
			const documentRef = window?.document;
			return documentRef ?? null;
		}
		#setRouteDocumentContext(nextContext) {
			const context = this.#routeDocumentContext;
			if (!context) {
				return;
			}
			context.status = String(nextContext?.status || 'idle');
			context.docId = Number(nextContext?.docId || 0);
			context.document = main_core.Type.isPlainObject(nextContext?.document) ? nextContext.document : null;
			context.preview = main_core.Type.isPlainObject(nextContext?.preview) ? nextContext.preview : null;
			context.ancestors = Array.isArray(nextContext?.ancestors) ? nextContext.ancestors : [];
			context.openContext = main_core.Type.isPlainObject(nextContext?.openContext) ? nextContext.openContext : null;
			context.errorMessage = String(nextContext?.errorMessage || '');
			context.viewMode = main_core.Type.isStringFilled(nextContext?.viewMode) ? String(nextContext.viewMode) : 'normal';
			context.children = Array.isArray(nextContext?.children) ? nextContext.children : [];
			context.childrenLoading = false;
			context.childrenHasMore = false;
			context.loadMoreChildren = () => {};
			context.autoEdit = context.status === 'ready' ? Boolean(context.autoEdit) : false;
			this.#syncPageTitle();
		}
		#syncPageTitle() {
			const documentRef = this.#getBrowserDocument();
			if (!documentRef) {
				return;
			}
			const docTitle = this.#extractRouteDocumentTitle();
			const fallbackTitle = this.#basePageTitle;
			const nextTitle = docTitle === '' ? fallbackTitle : docTitle;
			if (documentRef.title !== nextTitle) {
				documentRef.title = nextTitle;
			}
		}
		#extractRouteDocumentTitle() {
			const context = this.#routeDocumentContext;
			if (!context || String(context.status) !== 'ready' || !main_core.Type.isPlainObject(context.document)) {
				return '';
			}
			return String(context.document.title ?? '').trim();
		}
		#restoreBasePageTitle() {
			const documentRef = this.#getBrowserDocument();
			if (!documentRef) {
				return;
			}
			if (main_core.Type.isStringFilled(this.#basePageTitle)) {
				documentRef.title = this.#basePageTitle;
			}
		}
		#resolveCurrentPageTitle() {
			const documentRef = this.#getBrowserDocument();
			if (!documentRef) {
				return '';
			}
			return String(documentRef.title ?? '');
		}
		#extractInitialSidebarContext(initialSidebarContext) {
			return main_core.Type.isPlainObject(initialSidebarContext) ? initialSidebarContext : null;
		}
		#extractSidebarOptions(sidebarOptions) {
			if (!main_core.Type.isPlainObject(sidebarOptions)) {
				return null;
			}
			const width = Number(sidebarOptions.width);
			if (!Number.isFinite(width)) {
				return null;
			}
			return {
				width: Math.trunc(width),
				collapsed: Boolean(sidebarOptions.collapsed)
			};
		}
		#extractInitialCollections(initialCollections) {
			if (!main_core.Type.isPlainObject(initialCollections)) {
				return null;
			}
			if (!Array.isArray(initialCollections.items)) {
				return null;
			}
			return initialCollections;
		}
		async #applyWelcomeRedirect() {
			const welcomeDocId = Number(this.#options?.initialWelcomeDocId || 0);
			if (!Number.isInteger(welcomeDocId) || welcomeDocId <= 0) {
				return;
			}
			if (this.#router.currentRoute.value.name !== ROUTE_NAME_HOME) {
				return;
			}
			await this.#router.replace({
				name: ROUTE_NAME_DOCUMENT,
				params: {
					id: String(welcomeDocId)
				}
			});
		}
		#hydrateFromInitialCollections() {
			if (!this.#sidebarFeature || !this.#initialCollections) {
				return false;
			}
			const hydrated = this.#sidebarFeature.hydrateInitialCollections(this.#initialCollections);
			this.#hasInitialCollectionsHydration = Boolean(hydrated);
			return this.#hasInitialCollectionsHydration;
		}
		#hydrateFromInitialSidebarContext() {
			if (!this.#sidebarFeature || !this.#initialSidebarContext) {
				return false;
			}
			const hydrated = this.#sidebarFeature.hydrateFromInitialContext(this.#initialSidebarContext);
			this.#hasInitialSidebarHydration = Boolean(hydrated);
			return this.#hasInitialSidebarHydration;
		}
		#applyInitialRouteDocumentContext(routeDocId) {
			if (this.#isInitialRouteContextConsumed || !this.#hasInitialSidebarHydration || !this.#initialSidebarContext || routeDocId <= 0) {
				return false;
			}
			const initialDocument = this.#normalizeInitialDocument(this.#initialSidebarContext.document);
			if (!initialDocument) {
				return false;
			}
			if (Number(initialDocument.id) !== routeDocId) {
				return false;
			}
			this.#setRouteDocumentContext({
				status: 'ready',
				docId: routeDocId,
				document: initialDocument,
				ancestors: [],
				errorMessage: '',
				viewMode: this.#resolveViewModeFromDocument(initialDocument)
			});
			this.#isInitialRouteContextConsumed = true;
			void this.#loadChildDocuments(routeDocId, initialDocument);
			return true;
		}
		#normalizeInitialDocument(document) {
			if (!main_core.Type.isPlainObject(document)) {
				return null;
			}
			const id = Number(document.id);
			const collectionId = Number(document.collectionId);
			if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(collectionId) || collectionId <= 0) {
				return null;
			}
			const parentId = document.parentId === null || document.parentId === undefined || document.parentId === '' ? null : Number(document.parentId);
			const markdown = main_core.Type.isArray(document.markdown) || main_core.Type.isPlainObject(document.markdown) || main_core.Type.isString(document.markdown) ? document.markdown : null;
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
				canEditCollection: Boolean(document.canEditCollection)
			};
		}
		async #loadChildDocuments(docId, document) {
			if (!this.#sidebarFeature || !document) {
				return;
			}
			const collectionId = Number(document.collectionId);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return;
			}
			const sidebarDoc = this.#sidebarFeature.findLoadedDocument(collectionId, docId);
			if (sidebarDoc && !sidebarDoc.hasChildren) {
				// Nothing to fetch; the watchEffect already reflects the empty branch.
				this.#syncChildDocumentsState(docId, collectionId);
				return;
			}
			if (this.#routeDocumentContext && Number(this.#routeDocumentContext.docId) === docId) {
				this.#routeDocumentContext.childrenLoading = true;
			}
			try {
				await this.#sidebarFeature.ensureChildrenLoaded(collectionId, docId);
			} catch {
				if (this.#routeDocumentContext && Number(this.#routeDocumentContext.docId) === docId) {
					this.#routeDocumentContext.childrenLoading = false;
				}
				return;
			}
			this.#syncChildDocumentsState(docId, collectionId);
		}
		#syncChildDocumentsState(docId, collectionId) {
			if (!this.#routeDocumentContext || Number(this.#routeDocumentContext.docId) !== docId) {
				return;
			}

			// children / childrenHasMore are kept live by the children watchEffect.
			this.#routeDocumentContext.childrenLoading = false;
			this.#routeDocumentContext.loadMoreChildren = () => {
				void this.#loadMoreChildDocuments(docId, collectionId);
			};
		}
		async #loadMoreChildDocuments(docId, collectionId) {
			if (!this.#sidebarFeature || !this.#routeDocumentContext || Number(this.#routeDocumentContext.docId) !== docId || this.#routeDocumentContext.childrenLoading) {
				return;
			}
			const storeChildren = this.#sidebarFeature.state.getChildren(collectionId, docId);
			if (storeChildren.length > this.#routeDocumentContext.children.length) {
				this.#syncChildDocumentsState(docId, collectionId);
				return;
			}
			this.#routeDocumentContext.childrenLoading = true;
			try {
				await this.#sidebarFeature.loadMoreChildren(collectionId, docId);
			} catch {
				if (this.#routeDocumentContext && Number(this.#routeDocumentContext.docId) === docId) {
					this.#routeDocumentContext.childrenLoading = false;
				}
				return;
			}
			this.#syncChildDocumentsState(docId, collectionId);
		}
		#emitAction(name, payload) {
			const callback = this.#options?.actions?.[name];
			if (main_core.Type.isFunction(callback)) {
				callback(payload);
			}
		}
		#resolveLoadedDocument(documentId) {
			const id = Number(documentId);
			const doc = this.#routeDocumentContext?.document ?? null;
			if (!doc || Number(doc.id) !== id) {
				return null;
			}
			return doc;
		}
		#createDocumentActions() {
			return {
				archive: async documentId => {
					const doc = this.#resolveLoadedDocument(documentId);
					if (!doc || !this.#sidebarFeature) {
						return;
					}
					const confirmed = await this.#dialogService.confirm(main_core.Loc.getMessage('NOTE_APP_CONFIRM_ARCHIVE_DOCUMENT') || '', main_core.Loc.getMessage('NOTE_APP_CONFIRM_ARCHIVE_DOCUMENT_TITLE') || '', main_core.Loc.getMessage('NOTE_APP_ARCHIVE') || '');
					if (!confirmed) {
						return;
					}
					void this.#sidebarFeature.actions.archiveDocument(doc);
				},
				restore: documentId => {
					const doc = this.#resolveLoadedDocument(documentId);
					if (doc && this.#sidebarFeature) {
						void this.#sidebarFeature.actions.restoreDocument(doc);
					}
				},
				delete: documentId => {
					const doc = this.#resolveLoadedDocument(documentId);
					if (doc && this.#sidebarFeature) {
						void this.#sidebarFeature.actions.deleteDocument(doc);
					}
				},
				restoreFromTrash: (documentId, hints = {}) => {
					void this.#restoreDocumentFromTrash(documentId, hints);
				},
				hardDelete: (documentId, hints = {}) => {
					void this.#hardDeleteDocument(documentId, hints);
				}
			};
		}
		async #restoreDocumentFromTrash(documentId, hints = {}) {
			const doc = this.#resolveLoadedDocument(documentId);
			// Editor passes the freshest recycleBinId/isOrphan via hints — routeDocumentContext.document
			// stays at its initial-load snapshot and is stale after a push-driven trash flip.
			const recycleBinId = Number(hints?.recycleBinId) || Number(doc?.recycleBinId) || 0;
			const isOrphan = typeof hints?.isOrphan === 'boolean' ? hints.isOrphan : Boolean(doc?.isOrphan);
			if (!doc || recycleBinId <= 0) {
				return;
			}
			let targetCollectionId = null;
			if (isOrphan) {
				const result = await note_recyclebin.openOrphanRestorePopup({
					documentTitle: String(doc.title || '')
				});
				if (!result) {
					return;
				}
				targetCollectionId = Number(result.collectionId) || null;
			}
			let restoredDocumentId = 0;
			try {
				const result = await new note_recyclebin.RecycleBinService().restoreDocument(recycleBinId, targetCollectionId);
				restoredDocumentId = Number(result?.documentId) || 0;
			} catch {
				this.#notify(main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_ERROR_GENERIC') || '', 'error');
				return;
			}
			this.#notify(main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_RESTORE_SUCCESS') || '');
			const currentRoute = this.#router?.currentRoute?.value;
			const currentRouteName = String(currentRoute?.name || '');
			const currentDocId = Number(currentRoute?.params?.id) || 0;
			if (restoredDocumentId > 0 && currentRouteName === ROUTE_NAME_DOCUMENT) {
				if (currentDocId === restoredDocumentId) {
					// Already on the restored document's page; the route stays the same,
					// so refresh resolver state manually to flip the editor out of trashed mode.
					void this.#syncRouteState(false);
				} else {
					void this.#router?.push?.({
						name: ROUTE_NAME_DOCUMENT,
						params: {
							id: restoredDocumentId
						}
					});
				}
				return;
			}
			void this.#router?.push?.({
				name: ROUTE_NAME_RECYCLE_BIN
			});
		}
		async #hardDeleteDocument(documentId, hints = {}) {
			const doc = this.#resolveLoadedDocument(documentId);
			const recycleBinId = Number(hints?.recycleBinId) || Number(doc?.recycleBinId) || 0;
			if (!doc || recycleBinId <= 0) {
				return;
			}
			const confirmed = await this.#confirmHardDelete(String(doc.title || ''));
			if (!confirmed) {
				return;
			}
			try {
				await new note_recyclebin.RecycleBinService().hardDeleteDocument(recycleBinId);
			} catch {
				this.#notify(main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_ERROR_GENERIC') || '', 'error');
				return;
			}
			this.#notify(main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_HARD_DELETE_SUCCESS') || '');
			void this.#router?.push?.({
				name: ROUTE_NAME_RECYCLE_BIN
			});
		}
		#confirmHardDelete(title) {
			return new Promise(resolve => {
				let resolved = false;
				const finish = value => {
					if (resolved) {
						return;
					}
					resolved = true;
					resolve(value);
				};
				const message = main_core.Loc.getMessage('NOTE_APP_HARD_DELETE_CONFIRM_MESSAGE', {
					'#TITLE#': main_core.Text.encode(String(title || ''))
				}) || '';
				const content = main_core.Tag.render`
				<div class="note-app-hard-delete-confirm-content">
					${message}
				</div>
			`;
				const dialog = new ui_system_dialog.Dialog({
					title: main_core.Loc.getMessage('NOTE_APP_HARD_DELETE_CONFIRM_TITLE') || '',
					content,
					hasOverlay: true,
					overlay: true,
					width: 420,
					centerButtons: [new ui_buttons.Button({
						text: main_core.Loc.getMessage('NOTE_APP_HARD_DELETE_CONFIRM_CANCEL') || '',
						size: ui_buttons.ButtonSize.LARGE,
						style: ui_buttons.AirButtonStyle.FILLED,
						useAirDesign: true,
						onclick: () => {
							finish(false);
							dialog.hide();
						}
					}), new ui_buttons.Button({
						text: main_core.Loc.getMessage('NOTE_APP_HARD_DELETE_CONFIRM_OK') || '',
						size: ui_buttons.ButtonSize.LARGE,
						style: ui_buttons.AirButtonStyle.PLAIN,
						useAirDesign: true,
						onclick: () => {
							finish(true);
							dialog.hide();
						}
					})],
					events: {
						onHide: () => {
							finish(false);
						}
					}
				});
				note_ui_themeContext.NoteThemeContext.themeDialog(dialog, content);
				dialog.show();
			});
		}
		#notify(content, category = 'success') {
			if (!content) {
				return;
			}
			BX.UI.Notification.Center.notify({
				content,
				category,
				position: 'top-right'
			});
		}
	}

	exports.NoteApp = NoteApp;

})(this.BX.Note.App = this.BX.Note.App || {}, BX, window, BX, BX.Event, BX.Vue3, BX.Note.Sidebar, BX.Note, BX.Note.Ui, BX.UI.Notification, BX.UI, BX.UI.System, BX.Vue3.VueRouter, BX.UI.IconSet, BX.Note.Editor, BX.Note, BX.Note, BX.Note, BX.Note);
//# sourceMappingURL=app.bundle.js.map
