/* eslint-disable */
this.BX = this.BX || {};
this.BX.Note = this.BX.Note || {};
(function (exports, ui_designTokens_air, ui_iconSet_main, main_core, main_core_events, ui_vue3, note_sidebar, note_recyclebin, note_ui_themeContext, note_analytics, ui_notification, ui_buttons, ui_system_dialog, ui_vue3_router, ui_iconSet_api_vue, note_ui_assets, note_ui_loader, note_ui_railGeometry, note_editor, note_search, note_shared, note_archive, note_workspace) {
	'use strict';

	const NoteLayout = {
		name: 'NoteLayout',
		components: {
			RouterView: ui_vue3_router.RouterView,
			BIcon: ui_iconSet_api_vue.BIcon,
			Loader: note_ui_loader.Loader,
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
		inject: {
			// DTO-01, provided by the app shell. Defaults keep the header renderable in isolation.
			aiChatEnabled: {
				default: false
			},
			aiChatName: {
				default: ''
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
				viewportMeasureRaf: 0,
				brandWidth: 0,
				onWindowResize: null,
				mobileSidebarOpen: false,
				lockedScrollY: 0,
				headerCompact: false,
				scrollAnchorY: 0,
				scrollRaf: 0,
				onWindowScroll: null,
				// [ALG-01] Panel component, resolved after the lazy load of note.ai-chat. Null until the
				// first intent to open, which is what keeps the extension (and the whole widget stack)
				// off an untouched page.
				aiChatPanelComponent: null,
				// The wrapper is mounted — the shell drops its own placeholder indicator.
				aiChatMounted: false,
				// Last owner seen on EVENT-02, including our own emissions.
				aiChatRailOwner: null,
				// [ALG-02] Mode and applied width as reported by the panel. Until it exists the shell
				// answers the same question itself (`railGeometry`), because the rail has to be reserved in
				// flow from the first frame of opening, long before the panel extension is loaded.
				aiChatGeometry: null,
				// [ALG-02] Live input of that own computation. clientWidth, not innerWidth: the latter
				// counts the scrollbar and would move the overlay threshold by its width.
				viewportWidth: document.documentElement.clientWidth,
				onAiChatToggleRequested: null,
				onRailOccupancyChanged: null
			};
		},
		watch: {
			$route() {
				this.mobileSidebarOpen = false;
				this.headerCompact = false;
				this.scrollAnchorY = window.scrollY || document.documentElement.scrollTop || 0;
			},
			mobileSidebarOpen(isOpen) {
				this.applyScrollLock(isOpen && this.state.isMobile);
			},
			'state.isMobile': {
				immediate: false,
				handler(isMobile) {
					if (isMobile) {
						this.attachScrollTracker();
					} else {
						this.detachScrollTracker();
						this.applyScrollLock(false);
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
			this.onWindowResize = () => {
				this.scheduleBrandMeasure();
				this.scheduleViewportMeasure();
			};
			window.addEventListener('resize', this.onWindowResize);
			if (this.state.isMobile) {
				this.attachScrollTracker();
			}

			// Once per page load, matching the BI dashboard. The header is never remounted on route
			// changes, so mounted() firing once is the whole guard — nothing is persisted.
			this.playAiChatIntroGlow();
			this.onAiChatToggleRequested = event => this.handleAiChatToggleRequested(event);
			this.onRailOccupancyChanged = event => this.handleRailOccupancyChanged(event);
			main_core_events.EventEmitter.subscribe(note_sidebar.NoteEvent.AI_CHAT_TOGGLE_REQUESTED, this.onAiChatToggleRequested);
			main_core_events.EventEmitter.subscribe(note_sidebar.NoteEvent.RAIL_OCCUPANCY_CHANGED, this.onRailOccupancyChanged);
		},
		beforeUnmount() {
			if (this.onWindowResize) {
				window.removeEventListener('resize', this.onWindowResize);
				this.onWindowResize = null;
			}
			this.detachScrollTracker();
			this.applyScrollLock(false);
			if (this.brandMeasureRaf !== 0) {
				cancelAnimationFrame(this.brandMeasureRaf);
				this.brandMeasureRaf = 0;
			}
			if (this.viewportMeasureRaf !== 0) {
				cancelAnimationFrame(this.viewportMeasureRaf);
				this.viewportMeasureRaf = 0;
			}
			if (this.onAiChatToggleRequested) {
				main_core_events.EventEmitter.unsubscribe(note_sidebar.NoteEvent.AI_CHAT_TOGGLE_REQUESTED, this.onAiChatToggleRequested);
				this.onAiChatToggleRequested = null;
			}
			if (this.onRailOccupancyChanged) {
				main_core_events.EventEmitter.unsubscribe(note_sidebar.NoteEvent.RAIL_OCCUPANCY_CHANGED, this.onRailOccupancyChanged);
				this.onRailOccupancyChanged = null;
			}
		},
		computed: {
			// The short version of the logo is the first letter of the wordmark with the 24 and the clock -
			// "Б24" here, "B24" wherever the wordmark is written in Latin. Taken from the wordmark itself, so
			// the letter follows the language rather than being spelled out a second time.
			brandShortLetter() {
				return main_core.Type.isStringFilled(this.messages.brandName) ? this.messages.brandName.slice(0, 1) : '';
			},
			aiChatVisible() {
				// No panel on mobile, so a button there would lead nowhere.
				return this.aiChatEnabled === true && this.state.isMobile !== true;
			},
			aiChatLabel() {
				return String(main_core.Loc.getMessage('NOTE_APP_AI_CHAT_OPEN') ?? '').replace('#NAME#', String(this.aiChatName ?? ''));
			},
			aiChatOpen() {
				return this.state.aiChatOpen === true;
			},
			// Placeholder indicator: open, but the wrapper has not landed yet. It belongs to the shell
			// because the first frame of opening happens before the panel extension even exists.
			aiChatPending() {
				return this.aiChatOpen && !this.aiChatMounted;
			},
			/**
			 * [EVENT-02] Width the current rail resident takes up **in flow** — what a neighbour has to
			 * step around, not the panel's width as such.
			 *
			 * `null` on purpose when the rail belongs to someone else: consumers read the variable with a
			 * `340px` fallback, so leaving it unset is how a timeline or hotkeys panel is described,
			 * without this shell keeping a third copy of that number. An overlay chat is `0` — it is out
			 * of flow, and the floating button on layer 90 is under the panel on layer 140 anyway.
			 */
			railWidth() {
				if (this.aiChatRailOwner !== note_sidebar.NoteRailOwner.AI_CHAT) {
					return null;
				}
				return this.railGeometry.mode === 'inline' ? `${this.railGeometry.width}px` : '0px';
			},
			/**
			 * [EVENT-02] The rail width is being dragged right now. Published next to the width itself,
			 * because a neighbour that animates towards `--note-rail-width` — the right thing while the
			 * panel slides open — visibly lags behind the pointer during a gesture.
			 */
			railResizing() {
				return this.aiChatRailOwner === note_sidebar.NoteRailOwner.AI_CHAT && this.aiChatGeometry?.dragging === true;
			},
			/**
			 * [ALG-02] Effective geometry of the rail: the panel's answer when there is one, the shell's
			 * own otherwise. Same function and same inputs on both sides, so the handover from the
			 * placeholder to the panel does not change the width.
			 */
			railGeometry() {
				return this.aiChatGeometry ?? note_ui_railGeometry.resolveRailGeometry({
					viewportWidth: this.viewportWidth,
					sidebarWidth: this.state.sidebarEffectiveWidth
				});
			},
			// The width the placeholder reserves — the clamped one, so the panel takes over exactly the
			// same number and the handover is invisible.
			aiChatPendingStyle() {
				return {
					'--note-ai-chat-width': `${this.railGeometry.width}px`
				};
			}
		},
		methods: {
			handleBrandClick() {
				window.open('/', '_blank', 'noopener');
			},
			// EVENT-01. The button never touches the panel state itself: a single public entry point
			// keeps every consumer (button, hotkey, rail neighbour) on the same path.
			requestAiChatToggle() {
				main_core_events.EventEmitter.emit(note_sidebar.NoteEvent.AI_CHAT_TOGGLE_REQUESTED, new main_core_events.BaseEvent({
					data: {}
				}));
			},
			playAiChatIntroGlow() {
				const wrapper = this.$refs.aiChatAvatar;
				if (!this.aiChatVisible || !wrapper) {
					return;
				}
				const glow = main_core.Dom.create('img', {
					attrs: {
						className: 'aiassistant-marta__glow-svg',
						src: note_ui_assets.AssetUrl.aiChatGlow,
						alt: '',
						role: 'presentation',
						'aria-hidden': 'true'
					}
				});

				// Removed on animationend rather than left in the DOM: the layer is decorative and its
				// 9s animation is `forwards`, so it would otherwise sit above the icon forever.
				glow.addEventListener('animationend', () => main_core.Dom.remove(glow), {
					once: true
				});
				main_core.Dom.prepend(glow, wrapper);
			},
			// [ALG-01] EVENT-01 listener. The shell owns isOpen, the indicator and the rail signal;
			// idempotent in both directions, because "close the closed" really does arrive — the panel
			// itself asks to close through this same public entry point.
			async handleAiChatToggleRequested(event) {
				const desired = event?.getData()?.desired ?? null;
				const wantsClose = desired === 'close' || desired === null && this.aiChatOpen;
				if (wantsClose) {
					if (this.aiChatOpen) {
						this.collapseAiChat(true);
					}
					return;
				}

				// aiChatVisible, not aiChatEnabled: on mobile the panel must not rise at all, and the rail
				// there is a full-screen overlay owned by the timeline.
				if (this.aiChatOpen || !this.aiChatVisible) {
					return;
				}
				this.emitRailOccupancy(note_sidebar.NoteRailOwner.AI_CHAT);
				this.actions.setAiChatOpen(true);
				try {
					if (this.aiChatPanelComponent === null) {
						const exports = await main_core.Runtime.loadExtension('note.ai-chat');
						// markRaw: a component definition is a plain options object, and letting Vue make it
						// reactive would proxy it and track its keys on every `<component :is>` render.
						const component = exports?.NoteAiChatPanelComponent ?? null;
						this.aiChatPanelComponent = component ? ui_vue3.markRaw(component) : null;
						if (!this.aiChatPanelComponent) {
							throw new Error('note.app: note.ai-chat exposes no panel component');
						}
						await this.$nextTick();
					}

					// The panel swallows its own failures — it notifies and asks to close itself.
					await this.$refs.aiChatPanel?.ensureMounted();
				} catch (error) {
					this.notifyAiChatFailure();
					this.collapseAiChat(true);
					console.error('note.app: ai chat panel extension failed to load', error);
				}
			},
			collapseAiChat(announce) {
				this.actions.setAiChatOpen(false);
				// The owner check matters: a rail neighbour may already have taken over, and announcing
				// a free rail here would overwrite the occupancy that is actually current.
				if (announce && this.aiChatRailOwner === note_sidebar.NoteRailOwner.AI_CHAT) {
					this.emitRailOccupancy(null);
				}
			},
			handleRailOccupancyChanged(event) {
				const owner = event?.getData()?.owner ?? null;
				this.aiChatRailOwner = owner;
				if (owner !== null && owner !== note_sidebar.NoteRailOwner.AI_CHAT && this.aiChatOpen) {
					// Someone else took the rail — yield silently: they have already announced
					// themselves, so a second announcement from us would clobber it.
					this.collapseAiChat(false);
				}
			},
			emitRailOccupancy(owner) {
				main_core_events.EventEmitter.emit(note_sidebar.NoteEvent.RAIL_OCCUPANCY_CHANGED, new main_core_events.BaseEvent({
					data: {
						owner
					}
				}));
			},
			notifyAiChatFailure() {
				const content = String(main_core.Loc.getMessage('NOTE_APP_AI_CHAT_MOUNT_ERROR') ?? '').replace('#NAME#', String(this.aiChatName ?? '')).trim();
				if (!content) {
					return;
				}
				BX.UI.Notification.Center.notify({
					content,
					position: 'top-right',
					autoHideDelay: 4000
				});
			},
			toggleMobileSidebar() {
				this.mobileSidebarOpen = !this.mobileSidebarOpen;
			},
			closeMobileSidebar() {
				this.mobileSidebarOpen = false;
			},
			// The drawer is a layer over the page, and the page has to stand still under it. Nothing in the
			// panel scrolls the document, but the window is what scrolls it here - so a drag anywhere the
			// panel does not scroll itself (the backdrop, the panel chrome, a list already at its end) was
			// handed on to the window and the document ran past behind the open panel.
			// The body is taken out of the flow at the offset it was read at, rather than the document
			// scroller simply being told not to scroll: a scroller with nothing left to scroll clamps its
			// offset to zero, so the page jumped to its top as the panel opened and stayed there after it
			// closed. Pinned at `-scrollY` it stands exactly where the reader left it, and the offset is
			// handed back to the window when the lock comes off.
			applyScrollLock(locked) {
				const root = document.documentElement;
				if (locked === root.classList.contains('note-mobile-scroll-locked')) {
					return;
				}
				if (locked) {
					this.lockedScrollY = window.scrollY || root.scrollTop || 0;
					document.body.style.top = `-${this.lockedScrollY}px`;
					root.classList.add('note-mobile-scroll-locked');
					return;
				}
				root.classList.remove('note-mobile-scroll-locked');
				document.body.style.top = '';
				window.scrollTo(0, this.lockedScrollY);
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
			// Coalesced like the brand measurement next to it: a resize arrives as a burst, and reading
			// clientWidth per event would put several layout reads and reactive writes in one frame.
			scheduleViewportMeasure() {
				if (this.viewportMeasureRaf !== 0) {
					return;
				}
				this.viewportMeasureRaf = requestAnimationFrame(() => {
					this.viewportMeasureRaf = 0;
					this.viewportWidth = document.documentElement.clientWidth;
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
					// Collapsed brand shrinks to exactly the logo width (px, so it animates).
					this.brandWidth = intrinsicWidth;
				} finally {
					brand.style.width = previousWidth;
				}
			}
		},
		template: `
		<div
				class="note-page"
				:class="{ 'is-rail-resizing': railResizing }"
				:style="{ '--note-sidebar-width': \`\${state.sidebarWidth}px\`, '--note-brand-width': brandWidth ? \`\${brandWidth}px\` : null, '--note-rail-width': railWidth }"
			>
			<!-- Everything the rail squeezes: the header shrinks with the working area rather than
					 running above the panel, so the chat column reads as full window height. -->
			<div class="note-page-main">
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
					<button
						ref="brand"
						type="button"
						class="note-page-brand"
						:class="{ 'is-collapsed': state.sidebarCollapsed }"
						:aria-label="\`\${messages.brandName}\${messages.brandSuffix} \${messages.knowledgeBase}\`"
						@click="handleBrandClick"
					>
						<span class="note-page-brand-logo">
							<span class="note-page-brand-logo-text">{{ messages.brandName }}</span>
							<!-- The collapsed panel is the one case that gets the short version of the logo, and the
									 short version is a logo of its own: the first letter, the 24 and the clock. The
									 wordmark alone dropped left "24" with a clock, which is no logo at all. -->
							<span class="note-page-brand-logo-short">{{ brandShortLetter }}</span>
							<span class="note-page-brand-logo-number">{{ messages.brandSuffix }}</span>
							<span class="note-page-brand-logo-clock" aria-hidden="true"></span>
						</span>
						<span class="note-page-brand-subtitle">{{ messages.knowledgeBase }}</span>
					</button>
					<div id="note-page-header-slot" class="note-page-header-slot"></div>
					<button
						v-if="aiChatVisible"
						type="button"
						class="note-page-ai-chat-button"
						:title="aiChatLabel"
						:aria-label="aiChatLabel"
						:aria-pressed="aiChatOpen ? 'true' : 'false'"
						:aria-busy="aiChatPending ? 'true' : 'false'"
						data-testid="note-ai-chat-toggle"
						@click="requestAiChatToggle"
					>
						<span ref="aiChatAvatar" class="aiassistant-marta__avatar-wrapper --bitrixgpt" aria-hidden="true">
							<span class="aiassistant-marta__avatar"></span>
						</span>
					</button>
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
					<!-- Right rail slot: the document history timeline teleports here so it sits as a
							 true sibling of \`.content\` (like \`.sidebar\` on the left), not inside the
							 scrolling content. \`display: contents\` keeps the teleported panel itself the
							 flex child. -->
					<div id="note-page-history-slot" class="note-page-history-slot"></div>
				</div>
			</div>
			<!-- Rail placeholder: visible from the very first frame of opening, i.e. before the panel
					 extension is even loaded, and dropped on the panel's \`mounted\` signal so the
					 wrapper's own loader is the only one the user sees at the end. -->
			<!-- No context class of its own: the placeholder renders inside \`.note-page\` and inherits
					 the page's, so it is light or dark together with the knowledge base. -->
			<div
				v-if="aiChatPending"
				class="note-page-ai-chat-pending"
				:class="{ 'is-overlay': railGeometry.mode === 'overlay' }"
				:style="aiChatPendingStyle"
			>
				<Loader />
			</div>
			<component
				v-if="aiChatPanelComponent"
				:is="aiChatPanelComponent"
				ref="aiChatPanel"
				:open="aiChatOpen"
				:sidebar-width="state.sidebarEffectiveWidth"
				:product-name="aiChatName"
				@mounted="aiChatMounted = true"
				@geometry="aiChatGeometry = $event"
			/>
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

				// Opening a document from the full search-results page.
				note_analytics.NoteAnalytics.documentViewed('search_page');
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
				note_analytics.NoteAnalytics.documentViewed('docs_list');
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
				note_analytics.NoteAnalytics.documentViewed('docs_list');
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
				note_analytics.NoteAnalytics.documentViewed('docs_list');
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
				// Container id of a shared document: keys its branch in the accessible-tree namespace.
				// Reported apart from collectionId, which stays absent so the breadcrumb container is
				// rendered as plain text.
				sharedCollectionId: this.#toPositiveInt(row.sharedCollectionId) ?? 0,
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
				canRestore: Boolean(row.canRestore),
				views: this.#normalizeViews(row.views),
				lastChange: this.#normalizeLastChange(row.lastChange),
				subscription: this.#normalizeSubscription(row.subscription)
			};
		}

		// Bell state bundled with the bootstrap payload (see DocumentSubscriptionStateResolver) — the
		// subscription bell adopts this instead of its own getState request on mount.
		#normalizeSubscription(value) {
			if (!main_core.Type.isPlainObject(value)) {
				return null;
			}
			return {
				subscribed: Boolean(value.subscribed),
				mode: typeof value.mode === 'string' ? value.mode : null,
				muted: Boolean(value.muted),
				inherited: Boolean(value.inherited),
				inheritedSource: typeof value.inheritedSource === 'string' ? value.inheritedSource : null,
				inheritedTitle: typeof value.inheritedTitle === 'string' ? value.inheritedTitle : ''
			};
		}

		// [#2] `{ authors: [{id,name,avatar}], time: <ISO 8601 string> } | null` — feeds
		// note.ui.document-history's ActivityLineComponent chip (see note.editor's `lastChange`
		// state/prop). Missing authors or an unparsable time both collapse to null: the chip's own
		// `hasChipInfo` check treats a partial snapshot the same as "nothing to show yet".
		#normalizeLastChange(value) {
			if (!main_core.Type.isPlainObject(value)) {
				return null;
			}
			const rawAuthors = Array.isArray(value.authors) ? value.authors : [];
			const authors = [];
			for (const author of rawAuthors) {
				if (!main_core.Type.isPlainObject(author)) {
					continue;
				}
				const id = this.#toPositiveInt(author.id);
				if (id === null) {
					continue;
				}
				authors.push({
					id,
					name: String(author.name ?? ''),
					avatar: author.avatar || null,
					// Server identity color (matches the caret / timeline) — keep it so the bootstrap chip
					// avatar isn't the palette fallback.
					color: author.color || null
				});
			}
			const time = typeof value.time === 'string' ? value.time : '';
			if (authors.length === 0 || time === '') {
				return null;
			}
			return {
				authors,
				time
			};
		}
		#normalizeViews(value) {
			if (!main_core.Type.isPlainObject(value)) {
				return null;
			}
			const viewers = Array.isArray(value.viewers) ? value.viewers : [];
			const normalizedViewers = [];
			for (const viewer of viewers) {
				if (!main_core.Type.isPlainObject(viewer)) {
					continue;
				}
				const userId = this.#toPositiveInt(viewer.userId);
				if (userId === null) {
					continue;
				}
				normalizedViewers.push({
					userId,
					name: String(viewer.name ?? ''),
					avatar: viewer.avatar || null,
					// Server identity color (matches the caret / avatar stack) — keep it so bootstrap
					// viewers aren't palette-colored while live/paginated rows use the real color.
					color: viewer.color || null,
					viewedAt: typeof viewer.viewedAt === 'string' ? viewer.viewedAt : ''
				});
			}
			return {
				uniqueCount: Number.isInteger(value.uniqueCount) ? value.uniqueCount : normalizedViewers.length,
				viewers: normalizedViewers
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
		// Bootstrap-level UI feature flags (server-fed, one per mount, not per-document). Default off.
		#features = {
			historyEnabled: false,
			notificationsEnabled: false,
			sharedTreeEnabled: false
		};
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
		#tariffBlocked = false;
		mount(target, options) {
			if (!main_core.Type.isStringFilled(target)) {
				throw new Error('Target selector is required');
			}
			this.destroy();
			this.#options = main_core.Type.isPlainObject(options) ? options : {};
			this.#tariffBlocked = Boolean(this.#options.tariffBlocked);
			this.#basePageTitle = this.#resolveCurrentPageTitle();
			this.#initialCollections = this.#extractInitialCollections(this.#options.initialCollections);
			this.#initialSidebarContext = this.#extractInitialSidebarContext(this.#options.initialSidebarContext);
			this.#features = {
				historyEnabled: Boolean(this.#options.historyEnabled),
				notificationsEnabled: Boolean(this.#options.notificationsEnabled),
				sharedTreeEnabled: Boolean(this.#options.sharedTreeEnabled)
			};
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
					await this.#syncRouteState(false, true);
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
				// [TPL-02] First page of the favorites block, server-rendered with the collections. Handed to
				// the feature rather than hydrated afterwards: the feature reads the first page itself the
				// moment it is created, and a payload arriving later would come after that request.
				initialFavorites: this.#extractInitialFavorites(this.#options.initialFavorites),
				isMobile: Boolean(this.#options.isMobile),
				historyEnabled: this.#features.historyEnabled,
				notificationsEnabled: this.#features.notificationsEnabled,
				sharedTreeEnabled: this.#features.sharedTreeEnabled
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
				const shared = ctx.document?.sharedAccess === true;
				const collectionId = this.#branchCollectionId(ctx.document);
				if (!Number.isInteger(docId) || docId <= 0 || !Number.isInteger(collectionId) || collectionId <= 0) {
					ctx.children = [];
					ctx.childrenHasMore = false;
					return;
				}

				// A shared document keeps its children in the accessible-tree namespace: the collection
				// branch is empty for this user by definition (no collection access).
				ctx.children = shared ? this.#sidebarFeature.state.getSharedChildren(collectionId, docId) : this.#sidebarFeature.state.getChildren(collectionId, docId);
				ctx.childrenHasMore = shared ? this.#sidebarFeature.state.hasNextSharedChildren(collectionId, docId) : this.#sidebarFeature.hasNextChildren(collectionId, docId);
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
			this.#trackWelcomeEntry();
			void this.#bootstrap();
			return this;
		}

		// welcome_points: one event per KB entry (mount runs once per entry, not per SPA re-render).
		// The ?source scrub is deferred to #bootstrap (post router.isReady) — see #scrubWelcomeSourceFromUrl.
		#trackWelcomeEntry() {
			note_analytics.NoteAnalytics.welcomePoint(this.#resolveWelcomeSource());
		}
		#resolveWelcomeSource() {
			const optionSource = this.#options?.welcomeSource;
			if (main_core.Type.isStringFilled(optionSource)) {
				return optionSource;
			}
			try {
				const querySource = new URLSearchParams(window.location.search).get('source');
				if (main_core.Type.isStringFilled(querySource)) {
					return querySource;
				}
			} catch {
				// ignore malformed location
			}
			return 'left_menu';
		}

		// Drop ?source= from the address bar once it has been read for analytics. It is a one-shot entry
		// marker (e.g. the wiki post-import redirect), so leaving it would litter the URL and re-fire
		// welcome_points on reload. Called after router.isReady() so vue-router has already written its
		// initial history state; replaceState only rewrites the bar and triggers no navigation.
		#scrubWelcomeSourceFromUrl() {
			try {
				const url = new URL(window.location.href);
				if (!url.searchParams.has('source')) {
					return;
				}
				url.searchParams.delete('source');
				const query = url.searchParams.toString();
				const cleaned = url.pathname + (query ? `?${query}` : '') + url.hash;
				window.history.replaceState(window.history.state, '', cleaned);
			} catch {
				// ignore malformed location
			}
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
			this.#tariffBlocked = false;
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

				// Tariff/tool block: the interface stays mounted behind the tariff slider
				// (template opens it and redirects away on close). Hydrate the sidebar from
				// server data (no AJAX) so it renders, but skip the welcome redirect, sidebar
				// bootstrap and route auto-select — otherwise the HOME->WORKSPACE fallback fires
				// a listByCollection bootstrap AJAX that the server tariff gate rejects, surfacing
				// an error toast on top of the slider. The slider is the only UX under a block.
				if (this.#tariffBlocked) {
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
					skipInitialCollectionsLoad: hasInitialCollections
				});
				await this.#syncRouteState(true);
				if (!main_core.Type.isFunction(this.#removeRouteAfterEach)) {
					this.#removeRouteAfterEach = this.#router.afterEach((to, from) => {
						this.#previousRouteName = String(from?.name || '');

						// Hash-only navigation within the same document: skip resync so an anchor click
						// doesn't refetch/remount the document. The editor scrolls via its own $route.hash watcher.
						const sameRoute = to?.name === from?.name && String(to?.params?.id ?? '') === String(from?.params?.id ?? '');
						if (sameRoute && to?.hash !== from?.hash) {
							return;
						}
						void this.#syncRouteState(false);
					});
				}
			} catch {
				// sidebar/app keep local error handling
			}
		}
		async #syncRouteState(withCollectionFallback = false, force = false) {
			const syncId = ++this.#routeSyncId;
			this.#applyImmediateSharedFlag();
			this.#captureLastKnownCollectionFromRoute();
			await this.#syncRouteDocumentContext(syncId, force);
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
		async #syncRouteDocumentContext(syncId, force = false) {
			if (!this.#router || !this.#routeDocumentResolver || !this.#routeDocumentContext) {
				return;
			}
			const routeDocId = this.#extractRouteDocumentId(this.#router.currentRoute?.value);
			if (this.#applyInitialRouteDocumentContext(routeDocId)) {
				return;
			}

			// Idempotent guard: the same document is already loaded. A hash-only anchor click (or any
			// spurious route resync where the afterEach hash guard didn't fire due to transient from/to
			// state) must not refetch and remount an already-open document. `force` lets deliberate
			// same-route reloads (restore-from-trash, sidebar reload) bypass this.
			const current = this.#routeDocumentContext;
			if (!force && routeDocId > 0 && Number(current.docId) === routeDocId && current.status === 'ready' && main_core.Type.isPlainObject(current.document)) {
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
				collapsed: Boolean(sidebarOptions.collapsed),
				// Which blocks of the panel stand open. Passed through as they came: absent means "never set",
				// which the sidebar answers with an open block - so a missing key must not become `false` here.
				favoritesOpen: sidebarOptions.favoritesOpen,
				collectionsOpen: sidebarOptions.collectionsOpen
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
		#extractInitialFavorites(initialFavorites) {
			if (!main_core.Type.isPlainObject(initialFavorites) || !Array.isArray(initialFavorites.items)) {
				return null;
			}
			return initialFavorites;
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

		// Branch namespace key: a shared document is keyed by its container id, which the read payload
		// reports separately from collectionId (that one stays absent so the breadcrumb container is
		// not clickable).
		#branchCollectionId(document) {
			const raw = document?.sharedAccess === true ? document?.sharedCollectionId : document?.collectionId;
			return Number(raw);
		}
		async #loadChildDocuments(docId, document) {
			if (!this.#sidebarFeature || !document) {
				return;
			}
			const shared = document.sharedAccess === true;
			const collectionId = this.#branchCollectionId(document);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return;
			}

			// Shared documents are usually opened by URL, without the section ever being expanded, so
			// there is no loaded node to read hasChildren from — the fetch itself decides.
			const sidebarDoc = shared ? null : this.#sidebarFeature.findLoadedDocument(collectionId, docId);
			if (sidebarDoc && !sidebarDoc.hasChildren) {
				// Nothing to fetch; the watchEffect already reflects the empty branch.
				this.#syncChildDocumentsState(docId, collectionId);
				return;
			}
			if (this.#routeDocumentContext && Number(this.#routeDocumentContext.docId) === docId) {
				this.#routeDocumentContext.childrenLoading = true;
			}
			try {
				await (shared ? this.#sidebarFeature.ensureSharedChildrenLoaded(collectionId, docId) : this.#sidebarFeature.ensureChildrenLoaded(collectionId, docId));
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
			const shared = this.#routeDocumentContext.document?.sharedAccess === true;
			const storeChildren = shared ? this.#sidebarFeature.state.getSharedChildren(collectionId, docId) : this.#sidebarFeature.state.getChildren(collectionId, docId);
			if (storeChildren.length > this.#routeDocumentContext.children.length) {
				this.#syncChildDocumentsState(docId, collectionId);
				return;
			}
			this.#routeDocumentContext.childrenLoading = true;
			try {
				await (shared ? this.#sidebarFeature.loadMoreSharedChildren(collectionId, docId) : this.#sidebarFeature.loadMoreChildren(collectionId, docId));
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
				archive: documentId => {
					// Confirm (with the optional "with nested" checkbox) lives in the sidebar
					// archiveDocument use-case, mirroring the delete action below.
					const doc = this.#resolveLoadedDocument(documentId);
					if (doc && this.#sidebarFeature) {
						void this.#sidebarFeature.actions.archiveDocument(doc);
					}
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
					void this.#syncRouteState(false, true);
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
						dataset: {
							testid: 'note-dialog-cancel'
						},
						onclick: () => {
							finish(false);
							dialog.hide();
						}
					}), new ui_buttons.Button({
						text: main_core.Loc.getMessage('NOTE_APP_HARD_DELETE_CONFIRM_OK') || '',
						size: ui_buttons.ButtonSize.LARGE,
						style: ui_buttons.AirButtonStyle.PLAIN,
						useAirDesign: true,
						dataset: {
							testid: 'note-dialog-confirm'
						},
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

})(this.BX.Note.App = this.BX.Note.App || {}, window, window, BX, BX.Event, BX.Vue3, BX.Note.Sidebar, BX.Note, BX.Note.Ui, BX.Note, BX.UI.Notification, BX.UI, BX.UI.System, BX.Vue3.VueRouter, BX.UI.IconSet, BX.Note.Ui, BX.Note.Ui, BX.Note.Ui, BX.Note.Editor, BX.Note, BX.Note, BX.Note, BX.Note);
//# sourceMappingURL=app.bundle.js.map
