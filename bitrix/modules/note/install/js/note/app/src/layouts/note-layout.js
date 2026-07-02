import { RouterView } from 'ui.vue3.router';
import { Type } from 'main.core';
import { BIcon } from 'ui.icon-set.api.vue';
import { SidebarRootComponent } from 'note.sidebar';

export const NoteLayout = {
	name: 'NoteLayout',
	components: {
		RouterView,
		BIcon,
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
			onWindowResize: null,
			mobileSidebarOpen: false,
			headerCompact: false,
			scrollAnchorY: 0,
			scrollRaf: 0,
			onWindowScroll: null,
		};
	},
	watch: {
		$route()
		{
			this.mobileSidebarOpen = false;
			this.headerCompact = false;
			this.scrollAnchorY = (window.scrollY || document.documentElement.scrollTop || 0);
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
		this.onWindowResize = () => this.scheduleBrandMeasure();
		window.addEventListener('resize', this.onWindowResize);

		if (this.state.isMobile)
		{
			this.attachScrollTracker();
		}
	},
	beforeUnmount()
	{
		if (this.onWindowResize)
		{
			window.removeEventListener('resize', this.onWindowResize);
			this.onWindowResize = null;
		}
		this.detachScrollTracker();
		if (this.brandMeasureRaf !== 0)
		{
			cancelAnimationFrame(this.brandMeasureRaf);
			this.brandMeasureRaf = 0;
		}
	},
	methods: {
		handleBrandClick()
		{
			window.open('/', '_blank', 'noopener');
		},
		toggleMobileSidebar()
		{
			this.mobileSidebarOpen = !this.mobileSidebarOpen;
		},
		closeMobileSidebar()
		{
			this.mobileSidebarOpen = false;
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
			}
			finally
			{
				brand.style.width = previousWidth;
			}
		},
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
	`,
};
