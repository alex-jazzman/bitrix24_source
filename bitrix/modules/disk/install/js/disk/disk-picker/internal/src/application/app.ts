import { Dom, Event as DomEvent } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { ObjectTypeFilter } from '../const/picker';
import { LoadingSkeleton } from '../component/loading-skeleton/loading-skeleton';
import { PickerLayout } from '../component/picker-layout/picker-layout';
import { SourceSidebar } from '../component/source-sidebar/source-sidebar';
import { PickerToolbar } from '../component/picker-toolbar/picker-toolbar';
import { ItemBrowser } from '../component/item-browser/item-browser';
import { PreviewPanel } from '../component/preview-panel/preview-panel';
import { SelectionFooter } from '../component/selection-footer/selection-footer';
import { preventWheelScrollChaining } from '../lib/scroll-boundary/scroll-boundary';
import { useSessionStore } from '../model/session/session';

import './app.css';

const FOCUSABLE_SELECTOR = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])',
].join(',');

// A related filter dropdown mounts outside the popup DOM and manages its own
// focus; while one is open the trap steps aside so it stays reachable. This
// covers the filter fields popup, menu popups and the `list` field select
// dropdown (the object-type field), each rendered on the body.
const RELATED_POPUP_SELECTOR = '.main-ui-filter-popup, .menu-popup.popup-window-show, .main-ui-select-inner.--open';
const FILTER_PRESET_SELECTOR = '.main-ui-filter-sidebar-item';
const OPEN_POPUP_SELECTOR = '.popup-window.--open';

// Focus target inside the relocated standard filter: its FIND text input.
const FILTER_FIND_SELECTOR = [
	'.main-ui-filter-field-search input',
	'input.main-ui-filter-search-filter',
	'input[name="FIND"]',
].join(',');

// The filter host stays in the DOM regardless of the loading state, so the
// facade can relocate the standard filter into it right after mount. The full
// skeleton shows until the first main request settles; later requests use a
// lighter state inside the list without repainting the whole window. The root
// also keeps Tab focus inside the open window.
export const App = defineComponent({
	name: 'DiskPickerApp',
	components: {
		LoadingSkeleton,
		PickerLayout,
		SourceSidebar,
		PickerToolbar,
		ItemBrowser,
		PreviewPanel,
		SelectionFooter,
	},
	data(): {
		trapHandler: ((event: KeyboardEvent) => void) | null,
		escapeHandler: ((event: KeyboardEvent) => void) | null,
		filterPresetPointerdownHandler: ((event: PointerEvent) => void) | null,
		filterPresetPointerdownActive: boolean,
		filterFocusoutHandler: ((event: FocusEvent) => void) | null,
		filterInputHandler: ((event: Event) => void) | null,
		resizeObserver: ResizeObserver | null,
		observedBreadcrumbs: HTMLElement | null,
		}
	{
		return {
			trapHandler: null,
			escapeHandler: null,
			filterPresetPointerdownHandler: null,
			filterPresetPointerdownActive: false,
			filterFocusoutHandler: null,
			filterInputHandler: null,
			resizeObserver: null,
			observedBreadcrumbs: null,
		};
	},
	computed: {
		initialized(): boolean
		{
			return useSessionStore().initialized;
		},
		searchOpen(): boolean
		{
			return useSessionStore().searchOpen;
		},
		filtersActive(): boolean
		{
			const session = useSessionStore();

			return session.objectTypeFilter !== ObjectTypeFilter.All || session.fileTypeFilters.length > 0;
		},
	},
	watch: {
		searchOpen(open: boolean): void
		{
			if (open)
			{
				this.$nextTick(() => {
					this.focusFilterFind();
					this.syncFilterHost();
				});
			}
		},
		filtersActive(active: boolean): void
		{
			if (active)
			{
				useSessionStore().setSearchOpen(true);
			}
		},
		// The toolbar (and its search slot) only exists once the first stage settles;
		// reposition the host when it appears so a restored-open search lands correctly.
		initialized(): void
		{
			this.$nextTick(() => this.syncFilterHost());
		},
	},
	mounted(): void
	{
		this.trapHandler = (event: KeyboardEvent): void => this.handleTrap(event);
		DomEvent.bind(this.$el as HTMLElement, 'keydown', this.trapHandler);

		// The popup closes itself on an Escape keyup captured at the document. This
		// listener is bound before the popup is shown, so it runs first in the capture
		// phase and can keep an Escape inside the open search from closing the picker.
		this.escapeHandler = (event: KeyboardEvent): void => this.handleDocumentEscape(event);
		DomEvent.bind(document, 'keyup', this.escapeHandler, true);
		this.filterPresetPointerdownHandler = (event: PointerEvent): void => {
			this.handleDocumentPointerdown(event);
		};
		DomEvent.bind(document, 'pointerdown', this.filterPresetPointerdownHandler, true);

		const host = this.getFilterHost();
		if (host)
		{
			this.filterFocusoutHandler = (event: FocusEvent): void => this.handleFilterFocusout(event);
			DomEvent.bind(host, 'focusout', this.filterFocusoutHandler);
			this.filterInputHandler = (event: Event): void => this.handleFilterInput(event);
			DomEvent.bind(host, 'input', this.filterInputHandler);
		}

		// Keep the absolutely-positioned filter-host aligned with the toolbar search
		// slot as the breadcrumbs change width (deeper path, longer names, collapse).
		this.resizeObserver = new ResizeObserver(() => this.syncFilterHost());
		this.resizeObserver.observe(this.$el as HTMLElement);
		this.$nextTick(() => this.syncFilterHost());
	},
	beforeUnmount(): void
	{
		const root = this.$el as HTMLElement;
		if (this.trapHandler)
		{
			DomEvent.unbind(root, 'keydown', this.trapHandler);
			this.trapHandler = null;
		}

		if (this.escapeHandler)
		{
			DomEvent.unbind(document, 'keyup', this.escapeHandler, true);
			this.escapeHandler = null;
		}

		if (this.filterPresetPointerdownHandler)
		{
			DomEvent.unbind(document, 'pointerdown', this.filterPresetPointerdownHandler, true);
			this.filterPresetPointerdownHandler = null;
		}

		const host = this.getFilterHost();
		if (host && this.filterFocusoutHandler)
		{
			DomEvent.unbind(host, 'focusout', this.filterFocusoutHandler);
		}
		this.filterFocusoutHandler = null;
		if (host && this.filterInputHandler)
		{
			DomEvent.unbind(host, 'input', this.filterInputHandler);
		}
		this.filterInputHandler = null;

		if (this.resizeObserver)
		{
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}
		this.observedBreadcrumbs = null;
	},
	methods: {
		getFilterHost(): HTMLElement | null
		{
			return (this.$el as HTMLElement).querySelector<HTMLElement>('[data-disk-picker-filter-host]');
		},
		// The filter-host is a static node at the App root (relocated into before the
		// toolbar exists), so it cannot be a flex child of the header. Instead it is
		// positioned to exactly mirror the toolbar's search slot, which the flex layout
		// places right of the breadcrumbs and up to the view toggle. Mirroring the slot
		// rect removes any dependency on fixed sidebar/toggle metrics.
		syncFilterHost(): void
		{
			const host = this.getFilterHost();
			if (!host)
			{
				return;
			}

			const root = this.$el as HTMLElement;
			const slot = root.querySelector<HTMLElement>('[data-disk-picker-search-slot]');
			if (!useSessionStore().searchOpen || !slot)
			{
				return;
			}

			this.observeHeader(slot);

			const rootRect = root.getBoundingClientRect();
			const slotRect = slot.getBoundingClientRect();
			Dom.style(host, 'left', `${slotRect.left - rootRect.left}px`);
			Dom.style(host, 'top', `${slotRect.top - rootRect.top}px`);
			Dom.style(host, 'width', `${slotRect.width}px`);
			Dom.style(host, 'height', `${slotRect.height}px`);
		},
		observeHeader(slot: HTMLElement): void
		{
			if (!this.resizeObserver)
			{
				return;
			}

			// The slot is stable while the search is open; observe it idempotently. The
			// breadcrumbs node is replaced on navigation, so drop the previous one before
			// observing the new one to avoid piling up detached nodes on the observer.
			this.resizeObserver.observe(slot);
			const breadcrumbs = (this.$el as HTMLElement)
				.querySelector<HTMLElement>('[data-testid="universal-disk-picker-breadcrumbs"]');
			if (breadcrumbs !== this.observedBreadcrumbs)
			{
				if (this.observedBreadcrumbs)
				{
					this.resizeObserver.unobserve(this.observedBreadcrumbs);
				}

				if (breadcrumbs)
				{
					this.resizeObserver.observe(breadcrumbs);
				}

				this.observedBreadcrumbs = breadcrumbs;
			}
		},
		focusFilterFind(): void
		{
			const host = this.getFilterHost();
			const input = host?.querySelector<HTMLElement>(FILTER_FIND_SELECTOR);
			try
			{
				input?.focus();
			}
			catch
			{
				// A non-focusable or missing FIND input is not fatal.
			}
		},
		// The search collapses only when it carries no meaning: an empty FIND and
		// both type filters at their defaults. Active filters or a typed query keep
		// the panel open so the state stays visible and resettable.
		isSearchMeaningless(): boolean
		{
			const session = useSessionStore();

			return session.filterFind === ''
				&& session.objectTypeFilter === ObjectTypeFilter.All
				&& session.fileTypeFilters.length === 0;
		},
		handleFilterInput(event: Event): void
		{
			const target = event.target;
			if (target instanceof HTMLInputElement && target.matches(FILTER_FIND_SELECTOR))
			{
				useSessionStore().setFilterFind(target.value);
			}
		},
		collapseSearch(): void
		{
			useSessionStore().setSearchOpen(false);
			this.$nextTick(() => {
				const button = (this.$el as HTMLElement)
					.querySelector<HTMLElement>('[data-testid="universal-disk-picker-search-btn"]');
				button?.focus();
			});
		},
		// Escape while the search is open and focused inside the filter must not reach
		// the popup's own close-by-esc handler. `stopImmediatePropagation` on this
		// first-registered document capture listener keeps the picker open; an empty,
		// unfiltered search additionally collapses back to the button.
		handleDocumentEscape(event: KeyboardEvent): void
		{
			if (event.key !== 'Escape' || !useSessionStore().searchOpen)
			{
				return;
			}

			const host = this.getFilterHost();
			const target = event.target as Element | null;
			const insideSearch = host !== null
				&& target !== null
				&& host.contains(target);
			if (!insideSearch)
			{
				return;
			}

			event.stopImmediatePropagation();
			if (this.isSearchMeaningless())
			{
				this.collapseSearch();
			}
		},
		handleDocumentPointerdown(event: PointerEvent): void
		{
			const target = event.target;
			const preset = target instanceof Element ? target.closest(FILTER_PRESET_SELECTOR) : null;
			this.filterPresetPointerdownActive = preset !== null
				&& preset.closest(OPEN_POPUP_SELECTOR) !== null;

			setTimeout(() => {
				this.filterPresetPointerdownActive = false;
			}, 0);
		},
		handleFilterFocusout(event: FocusEvent): void
		{
			const relatedTarget = event.relatedTarget;
			const movedToRelatedPopup = relatedTarget instanceof Element
				&& relatedTarget.closest(RELATED_POPUP_SELECTOR) !== null;
			const presetPointerdownActive = this.filterPresetPointerdownActive;
			this.filterPresetPointerdownActive = false;

			// Defer so the incoming focus target is settled; a filter dropdown or menu
			// rendered outside the host must not be read as leaving the search.
			setTimeout(() => {
				if (!useSessionStore().searchOpen)
				{
					return;
				}

				const host = this.getFilterHost();
				const active = document.activeElement;
				const stillInside = presetPointerdownActive
					|| movedToRelatedPopup
					|| (
						host !== null
						&& active !== null
						&& (host.contains(active) || active.closest(RELATED_POPUP_SELECTOR) !== null)
					);
				if (!stillInside && this.isSearchMeaningless())
				{
					useSessionStore().setSearchOpen(false);
				}
			}, 0);
		},
		handleTrap(event: KeyboardEvent): void
		{
			if (event.key !== 'Tab')
			{
				return;
			}

			// An open related filter popup owns its focus; let native focus flow.
			if (document.querySelector(RELATED_POPUP_SELECTOR))
			{
				return;
			}

			const root = this.$el as HTMLElement;
			const focusable = [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]
				.filter((element) => element.offsetParent !== null || element === document.activeElement);
			if (focusable.length === 0)
			{
				return;
			}

			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			const active = document.activeElement;

			if (event.shiftKey && active === first)
			{
				event.preventDefault();
				last.focus();
			}
			else if ((!event.shiftKey && active === last) || !root.contains(active))
			{
				event.preventDefault();
				first.focus();
			}
		},
		handleBoundaryWheel(event: WheelEvent): void
		{
			preventWheelScrollChaining(event);
		},
	},
	template: `
		<div class="disk-picker__root" @wheel="handleBoundaryWheel">
			<div
				data-disk-picker-filter-host
				data-testid="universal-disk-picker-search-filter"
				class="disk-picker__filter-host"
				:class="{ '--open': searchOpen }"
			></div>
			<LoadingSkeleton v-if="!initialized"/>
			<PickerLayout v-else>
				<template #sidebar>
					<SourceSidebar/>
				</template>
				<template #header>
					<PickerToolbar/>
				</template>
				<template #list>
					<ItemBrowser/>
				</template>
				<template #preview>
					<PreviewPanel/>
				</template>
				<template #footer>
					<SelectionFooter/>
				</template>
			</PickerLayout>
		</div>
	`,
});
