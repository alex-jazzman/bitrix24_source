import { markRaw } from 'ui.vue3';
import { RouterView } from 'ui.vue3.router';
import { Dom, Loc, Runtime, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { BIcon } from 'ui.icon-set.api.vue';
import { NoteEvent, NoteRailOwner, SidebarRootComponent } from 'note.sidebar';
import { AssetUrl } from 'note.ui.assets';
import { Loader } from 'note.ui.loader';
import { resolveRailGeometry } from 'note.ui.rail-geometry';

export const NoteLayout = {
	name: 'NoteLayout',
	components: {
		RouterView,
		BIcon,
		Loader,
		SidebarRootComponent,
	},
	props: {
		state: { type: Object, required: true },
		actions: { type: Object, required: true },
		store: { type: Object, required: true },
		messages: { type: Object, required: true },
		routeDocumentContext: { type: Object, required: true },
		documentActions: { type: Object, required: true },
		themeActions: { type: Object, default: null },
	},
	inject: {
		// DTO-01, provided by the app shell. Defaults keep the header renderable in isolation.
		aiChatEnabled: { default: false },
		aiChatName: { default: '' },
	},
	provide()
	{
		return {
			noteRouteDocumentContext: this.routeDocumentContext,
			noteDocumentActions: this.documentActions,
			noteSidebarActions: this.actions,
			noteSidebarState: this.state,
			noteSidebarStore: this.store,
		};
	},
	data()
	{
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
			onRailOccupancyChanged: null,
		};
	},
	watch: {
		$route()
		{
			this.mobileSidebarOpen = false;
			this.headerCompact = false;
			this.scrollAnchorY = (window.scrollY || document.documentElement.scrollTop || 0);
		},
		mobileSidebarOpen(isOpen)
		{
			this.applyScrollLock(isOpen && this.state.isMobile);
		},
		'state.isMobile': {
			immediate: false,
			handler(isMobile)
			{
				if (isMobile)
				{
					this.attachScrollTracker();
				}
				else
				{
					this.detachScrollTracker();
					this.applyScrollLock(false);
					this.headerCompact = false;
				}
			},
		},
	},
	mounted()
	{
		this.measureBrandMinWidth();
		// Re-measure after web fonts load: glyph metrics can change.
		if (document.fonts && typeof document.fonts.ready?.then === 'function')
		{
			document.fonts.ready.then(() => this.scheduleBrandMeasure()).catch(() => {});
		}
		// Catch zoom (browsers fire window resize on zoom).
		this.onWindowResize = () => {
			this.scheduleBrandMeasure();
			this.scheduleViewportMeasure();
		};
		window.addEventListener('resize', this.onWindowResize);

		if (this.state.isMobile)
		{
			this.attachScrollTracker();
		}

		// Once per page load, matching the BI dashboard. The header is never remounted on route
		// changes, so mounted() firing once is the whole guard — nothing is persisted.
		this.playAiChatIntroGlow();

		this.onAiChatToggleRequested = (event) => this.handleAiChatToggleRequested(event);
		this.onRailOccupancyChanged = (event) => this.handleRailOccupancyChanged(event);
		EventEmitter.subscribe(NoteEvent.AI_CHAT_TOGGLE_REQUESTED, this.onAiChatToggleRequested);
		EventEmitter.subscribe(NoteEvent.RAIL_OCCUPANCY_CHANGED, this.onRailOccupancyChanged);
	},
	beforeUnmount()
	{
		if (this.onWindowResize)
		{
			window.removeEventListener('resize', this.onWindowResize);
			this.onWindowResize = null;
		}
		this.detachScrollTracker();
		this.applyScrollLock(false);
		if (this.brandMeasureRaf !== 0)
		{
			cancelAnimationFrame(this.brandMeasureRaf);
			this.brandMeasureRaf = 0;
		}
		if (this.viewportMeasureRaf !== 0)
		{
			cancelAnimationFrame(this.viewportMeasureRaf);
			this.viewportMeasureRaf = 0;
		}
		if (this.onAiChatToggleRequested)
		{
			EventEmitter.unsubscribe(NoteEvent.AI_CHAT_TOGGLE_REQUESTED, this.onAiChatToggleRequested);
			this.onAiChatToggleRequested = null;
		}
		if (this.onRailOccupancyChanged)
		{
			EventEmitter.unsubscribe(NoteEvent.RAIL_OCCUPANCY_CHANGED, this.onRailOccupancyChanged);
			this.onRailOccupancyChanged = null;
		}
	},
	computed: {
		// The short version of the logo is the first letter of the wordmark with the 24 and the clock -
		// "Б24" here, "B24" wherever the wordmark is written in Latin. Taken from the wordmark itself, so
		// the letter follows the language rather than being spelled out a second time.
		brandShortLetter(): string
		{
			return Type.isStringFilled(this.messages.brandName) ? this.messages.brandName.slice(0, 1) : '';
		},
		aiChatVisible()
		{
			// No panel on mobile, so a button there would lead nowhere.
			return this.aiChatEnabled === true && this.state.isMobile !== true;
		},
		aiChatLabel()
		{
			return String(Loc.getMessage('NOTE_APP_AI_CHAT_OPEN') ?? '')
				.replace('#NAME#', String(this.aiChatName ?? ''));
		},
		aiChatOpen()
		{
			return this.state.aiChatOpen === true;
		},
		// Placeholder indicator: open, but the wrapper has not landed yet. It belongs to the shell
		// because the first frame of opening happens before the panel extension even exists.
		aiChatPending()
		{
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
		railWidth()
		{
			if (this.aiChatRailOwner !== NoteRailOwner.AI_CHAT)
			{
				return null;
			}

			return this.railGeometry.mode === 'inline' ? `${this.railGeometry.width}px` : '0px';
		},
		/**
		 * [EVENT-02] The rail width is being dragged right now. Published next to the width itself,
		 * because a neighbour that animates towards `--note-rail-width` — the right thing while the
		 * panel slides open — visibly lags behind the pointer during a gesture.
		 */
		railResizing()
		{
			return this.aiChatRailOwner === NoteRailOwner.AI_CHAT && this.aiChatGeometry?.dragging === true;
		},
		/**
		 * [ALG-02] Effective geometry of the rail: the panel's answer when there is one, the shell's
		 * own otherwise. Same function and same inputs on both sides, so the handover from the
		 * placeholder to the panel does not change the width.
		 */
		railGeometry()
		{
			return this.aiChatGeometry ?? resolveRailGeometry({
				viewportWidth: this.viewportWidth,
				sidebarWidth: this.state.sidebarEffectiveWidth,
			});
		},
		// The width the placeholder reserves — the clamped one, so the panel takes over exactly the
		// same number and the handover is invisible.
		aiChatPendingStyle()
		{
			return { '--note-ai-chat-width': `${this.railGeometry.width}px` };
		},
	},
	methods: {
		handleBrandClick()
		{
			window.open('/', '_blank', 'noopener');
		},
		// EVENT-01. The button never touches the panel state itself: a single public entry point
		// keeps every consumer (button, hotkey, rail neighbour) on the same path.
		requestAiChatToggle()
		{
			EventEmitter.emit(NoteEvent.AI_CHAT_TOGGLE_REQUESTED, new BaseEvent({ data: {} }));
		},
		playAiChatIntroGlow()
		{
			const wrapper = this.$refs.aiChatAvatar;
			if (!this.aiChatVisible || !wrapper)
			{
				return;
			}

			const glow = Dom.create('img', {
				attrs: {
					className: 'aiassistant-marta__glow-svg',
					src: AssetUrl.aiChatGlow,
					alt: '',
					role: 'presentation',
					'aria-hidden': 'true',
				},
			});

			// Removed on animationend rather than left in the DOM: the layer is decorative and its
			// 9s animation is `forwards`, so it would otherwise sit above the icon forever.
			glow.addEventListener('animationend', () => Dom.remove(glow), { once: true });
			Dom.prepend(glow, wrapper);
		},
		// [ALG-01] EVENT-01 listener. The shell owns isOpen, the indicator and the rail signal;
		// idempotent in both directions, because "close the closed" really does arrive — the panel
		// itself asks to close through this same public entry point.
		async handleAiChatToggleRequested(event)
		{
			const desired = event?.getData()?.desired ?? null;
			const wantsClose = desired === 'close' || (desired === null && this.aiChatOpen);

			if (wantsClose)
			{
				if (this.aiChatOpen)
				{
					this.collapseAiChat(true);
				}

				return;
			}

			// aiChatVisible, not aiChatEnabled: on mobile the panel must not rise at all, and the rail
			// there is a full-screen overlay owned by the timeline.
			if (this.aiChatOpen || !this.aiChatVisible)
			{
				return;
			}

			this.emitRailOccupancy(NoteRailOwner.AI_CHAT);
			this.actions.setAiChatOpen(true);

			try
			{
				if (this.aiChatPanelComponent === null)
				{
					const exports = await Runtime.loadExtension('note.ai-chat');
					// markRaw: a component definition is a plain options object, and letting Vue make it
					// reactive would proxy it and track its keys on every `<component :is>` render.
					const component = exports?.NoteAiChatPanelComponent ?? null;
					this.aiChatPanelComponent = component ? markRaw(component) : null;
					if (!this.aiChatPanelComponent)
					{
						throw new Error('note.app: note.ai-chat exposes no panel component');
					}
					await this.$nextTick();
				}

				// The panel swallows its own failures — it notifies and asks to close itself.
				await this.$refs.aiChatPanel?.ensureMounted();
			}
			catch (error)
			{
				this.notifyAiChatFailure();
				this.collapseAiChat(true);
				console.error('note.app: ai chat panel extension failed to load', error);
			}
		},
		collapseAiChat(announce)
		{
			this.actions.setAiChatOpen(false);
			// The owner check matters: a rail neighbour may already have taken over, and announcing
			// a free rail here would overwrite the occupancy that is actually current.
			if (announce && this.aiChatRailOwner === NoteRailOwner.AI_CHAT)
			{
				this.emitRailOccupancy(null);
			}
		},
		handleRailOccupancyChanged(event)
		{
			const owner = event?.getData()?.owner ?? null;
			this.aiChatRailOwner = owner;
			if (owner !== null && owner !== NoteRailOwner.AI_CHAT && this.aiChatOpen)
			{
				// Someone else took the rail — yield silently: they have already announced
				// themselves, so a second announcement from us would clobber it.
				this.collapseAiChat(false);
			}
		},
		emitRailOccupancy(owner)
		{
			EventEmitter.emit(NoteEvent.RAIL_OCCUPANCY_CHANGED, new BaseEvent({ data: { owner } }));
		},
		notifyAiChatFailure()
		{
			const content = String(Loc.getMessage('NOTE_APP_AI_CHAT_MOUNT_ERROR') ?? '')
				.replace('#NAME#', String(this.aiChatName ?? ''))
				.trim();
			if (!content)
			{
				return;
			}

			BX.UI.Notification.Center.notify({ content, position: 'top-right', autoHideDelay: 4000 });
		},
		toggleMobileSidebar()
		{
			this.mobileSidebarOpen = !this.mobileSidebarOpen;
		},
		closeMobileSidebar()
		{
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
		applyScrollLock(locked: boolean)
		{
			const root = document.documentElement;
			if (locked === root.classList.contains('note-mobile-scroll-locked'))
			{
				return;
			}

			if (locked)
			{
				this.lockedScrollY = window.scrollY || root.scrollTop || 0;
				document.body.style.top = `-${this.lockedScrollY}px`;
				root.classList.add('note-mobile-scroll-locked');

				return;
			}

			root.classList.remove('note-mobile-scroll-locked');
			document.body.style.top = '';
			window.scrollTo(0, this.lockedScrollY);
		},
		scheduleBrandMeasure()
		{
			if (this.brandMeasureRaf !== 0)
			{
				return;
			}
			this.brandMeasureRaf = requestAnimationFrame(() => {
				this.brandMeasureRaf = 0;
				this.measureBrandMinWidth();
			});
		},
		// Coalesced like the brand measurement next to it: a resize arrives as a burst, and reading
		// clientWidth per event would put several layout reads and reactive writes in one frame.
		scheduleViewportMeasure()
		{
			if (this.viewportMeasureRaf !== 0)
			{
				return;
			}
			this.viewportMeasureRaf = requestAnimationFrame(() => {
				this.viewportMeasureRaf = 0;
				this.viewportWidth = document.documentElement.clientWidth;
			});
		},
		attachScrollTracker()
		{
			if (this.onWindowScroll)
			{
				return;
			}
			this.scrollAnchorY = (window.scrollY || document.documentElement.scrollTop || 0);
			this.onWindowScroll = this.handleWindowScroll.bind(this);
			window.addEventListener('scroll', this.onWindowScroll, { passive: true });
		},
		detachScrollTracker()
		{
			if (this.onWindowScroll)
			{
				window.removeEventListener('scroll', this.onWindowScroll);
				this.onWindowScroll = null;
			}
			if (this.scrollRaf !== 0)
			{
				cancelAnimationFrame(this.scrollRaf);
				this.scrollRaf = 0;
			}
		},
		handleWindowScroll()
		{
			if (this.scrollRaf !== 0)
			{
				return;
			}
			this.scrollRaf = requestAnimationFrame(() => {
				this.scrollRaf = 0;

				const y = window.scrollY || document.documentElement.scrollTop || 0;
				const flipThreshold = 24;
				const topGuard = 48;

				if (y <= topGuard)
				{
					if (this.headerCompact)
					{
						this.headerCompact = false;
					}
					this.scrollAnchorY = y;

					return;
				}

				const delta = y - this.scrollAnchorY;
				if (delta > flipThreshold && !this.headerCompact)
				{
					this.headerCompact = true;
					this.scrollAnchorY = y;
				}
				else if (delta < -flipThreshold && this.headerCompact)
				{
					this.headerCompact = false;
					this.scrollAnchorY = y;
				}
				else if (
					(delta > 0 && this.headerCompact)
					|| (delta < 0 && !this.headerCompact)
				)
				{
					this.scrollAnchorY = y;
				}
			});
		},
		measureBrandMinWidth()
		{
			const brand = this.$refs.brand;
			if (!brand || !Type.isFunction(this.actions.setSidebarMinWidth))
			{
				return;
			}

			const previousWidth = brand.style.width;
			try
			{
				brand.style.width = 'max-content';
				const intrinsicWidth = Math.ceil(brand.getBoundingClientRect().width);
				// Account for the -1px divider compensation in CSS.
				this.actions.setSidebarMinWidth(intrinsicWidth + 1);
				// Collapsed brand shrinks to exactly the logo width (px, so it animates).
				this.brandWidth = intrinsicWidth;
			}
			finally
			{
				brand.style.width = previousWidth;
			}
		},
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
	`,
};
