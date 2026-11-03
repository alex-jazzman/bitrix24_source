import { Dom, Event as DomEvent, Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';

import { ObjectTypeFilter } from '../const/picker';
import { LoadingSkeleton } from '../component/loading-skeleton/loading-skeleton';
import { PickerLayout } from '../component/picker-layout/picker-layout';
import { SourceSidebar } from '../component/source-sidebar/source-sidebar';
import { PickerToolbar } from '../component/picker-toolbar/picker-toolbar';
import { ItemBrowser } from '../component/item-browser/item-browser';
import { PreviewPanel } from '../component/preview-panel/preview-panel';
import { SelectionFooter } from '../component/selection-footer/selection-footer';
import { listFocusableControls } from '../lib/composite-navigation/composite-navigation';
import { releasePreviewLayer } from '../feature/open-preview/open-preview';
import { preventWheelScrollChaining } from '../lib/scroll-boundary/scroll-boundary';
import { useSessionStore } from '../model/session/session';
import { useViewerStore } from '../model/viewer/viewer';

import './app.css';

// NAV-01: the keyboard groups in the order Tab walks them, whatever the DOM order.
const GROUP_ATTRIBUTE = 'data-disk-picker-group';
const GROUP_ORDER = ['storage', 'files', 'header', 'actions'];

type GroupId = 'storage' | 'files' | 'header' | 'actions';
type GroupOwner = { focusEntry?: () => boolean };

// Related filter dropdowns mount outside the picker and manage their own focus.
const RELATED_POPUP_SELECTOR = '.menu-popup.popup-window-show, .main-ui-select-inner.--open';
const FILTER_PRESET_SELECTOR = '.main-ui-filter-sidebar-item';
const OPEN_POPUP_SELECTOR = '.popup-window.--open';
const FILTER_SEARCH_CONTAINER_SUFFIX = '_search_container';

// Focus target inside the relocated standard filter: its FIND text input.
const FILTER_FIND_SELECTOR = [
	'.main-ui-filter-field-search input',
	'input.main-ui-filter-search-filter',
	'input[name="FIND"]',
].join(',');

// The standard component's own FIND-clear icon: a plain `<span>` with a click
// handler delegated at the search container, no native semantics of its own.
const FILTER_CLEAR_SELECTOR = '.main-ui-item-icon-block .main-ui-delete';
// The icon's own container: the standard component toggles `main-ui-show` on
// it (typed query, active preset squares, reset) to move the icon on/off
// screen via opacity/right, never `display:none`, so its focusability has to
// track this class, not just exist unconditionally once enhanced.
const FILTER_CLEAR_CONTAINER_SELECTOR = '.main-ui-item-icon-block';
const FILTER_CLEAR_VISIBLE_CLASS = 'main-ui-show';

function getFilterSettingsPopup(filterHost: HTMLElement | null): HTMLElement | null
{
	if (!filterHost)
	{
		return null;
	}

	const searchContainer = filterHost.querySelector<HTMLElement>(`[id$="${FILTER_SEARCH_CONTAINER_SUFFIX}"]`);
	if (!searchContainer?.id)
	{
		return null;
	}

	return [...document.querySelectorAll<HTMLElement>(OPEN_POPUP_SELECTOR)]
		.find((popup) => popup.id === searchContainer.id && !filterHost.contains(popup))
		?? null;
}

function isRelatedFilterTarget(target: Element, filterHost: HTMLElement | null): boolean
{
	const settingsPopup = getFilterSettingsPopup(filterHost);
	const preset = target.closest(FILTER_PRESET_SELECTOR);

	return settingsPopup?.contains(target) === true
		|| target.closest(RELATED_POPUP_SELECTOR) !== null
		|| (preset !== null && preset.closest(OPEN_POPUP_SELECTOR) !== null);
}

// The filter host stays in the DOM regardless of the loading state, so the
// facade can relocate the standard filter into it right after mount. The full
// skeleton shows until the first main request settles; later requests use a
// lighter state inside the list without repainting the whole window. The root
// also owns Tab: it steps between the four keyboard groups and wraps at the ends,
// so focus stays inside the open window.
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
		viewerKeydownHandler: ((event: KeyboardEvent) => void) | null,
		viewerEscapeArmed: boolean,
		filterPointerdownHandler: ((event: PointerEvent) => void) | null,
		filterPointerdownActive: boolean,
		filterFocusoutHandler: ((event: FocusEvent) => void) | null,
		filterInputHandler: ((event: Event) => void) | null,
		filterKeydownHandler: ((event: KeyboardEvent) => void) | null,
		filterClickHandler: ((event: MouseEvent) => void) | null,
		resizeObserver: ResizeObserver | null,
		observedBreadcrumbs: HTMLElement | null,
		initialFocusHandled: boolean,
		}
	{
		return {
			trapHandler: null,
			escapeHandler: null,
			viewerKeydownHandler: null,
			viewerEscapeArmed: false,
			filterPointerdownHandler: null,
			filterPointerdownActive: false,
			filterFocusoutHandler: null,
			filterInputHandler: null,
			filterKeydownHandler: null,
			filterClickHandler: null,
			resizeObserver: null,
			observedBreadcrumbs: null,
			initialFocusHandled: false,
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
		// NAV-01 initial focus: once the picker becomes interactive, hand keyboard
		// focus to the files group instead of leaving it on the outer popup container.
		initialized(): void
		{
			this.$nextTick(() => {
				this.syncFilterHost();
				this.focusInitialGroup();
			});
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

		// The viewer closes itself on the keydown of an Escape press; this listener only
		// records that the press was its own, so the matching keyup can be swallowed.
		this.viewerKeydownHandler = (event: KeyboardEvent): void => this.handleDocumentKeydown(event);
		DomEvent.bind(document, 'keydown', this.viewerKeydownHandler, true);

		this.filterPointerdownHandler = (event: PointerEvent): void => {
			this.handleDocumentPointerdown(event);
		};
		DomEvent.bind(document, 'pointerdown', this.filterPointerdownHandler, true);

		const host = this.getFilterHost();
		if (host)
		{
			this.filterFocusoutHandler = (event: FocusEvent): void => this.handleFilterFocusout(event);
			DomEvent.bind(host, 'focusout', this.filterFocusoutHandler);
			this.filterInputHandler = (event: Event): void => this.handleFilterInput(event);
			DomEvent.bind(host, 'input', this.filterInputHandler);
			this.filterKeydownHandler = (event: KeyboardEvent): void => this.handleFilterKeydown(event);
			DomEvent.bind(host, 'keydown', this.filterKeydownHandler);
			// Reset (click on the clear icon) and preset-square removal both toggle
			// `main-ui-show` without emitting an `input`: a click listener at the host
			// catches those too, since `enhanceFilterClearButton` is idempotent.
			this.filterClickHandler = (): void => this.enhanceFilterClearButton(host);
			DomEvent.bind(host, 'click', this.filterClickHandler);
			this.enhanceFilterClearButton(host);
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

		if (this.viewerKeydownHandler)
		{
			DomEvent.unbind(document, 'keydown', this.viewerKeydownHandler, true);
			this.viewerKeydownHandler = null;
		}

		if (this.filterPointerdownHandler)
		{
			DomEvent.unbind(document, 'pointerdown', this.filterPointerdownHandler, true);
			this.filterPointerdownHandler = null;
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
		if (host && this.filterKeydownHandler)
		{
			DomEvent.unbind(host, 'keydown', this.filterKeydownHandler);
		}
		this.filterKeydownHandler = null;
		if (host && this.filterClickHandler)
		{
			DomEvent.unbind(host, 'click', this.filterClickHandler);
		}
		this.filterClickHandler = null;

		if (this.resizeObserver)
		{
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}
		this.observedBreadcrumbs = null;

		// The window can close while the viewer is still shown: drop the subscription to
		// its close event, so that event never reaches a store this window has disposed.
		releasePreviewLayer();
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

			this.enhanceFilterClearButton(host);

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
		focusFilterFind(): boolean
		{
			const host = this.getFilterHost();
			const input = host?.querySelector<HTMLElement>(FILTER_FIND_SELECTOR) ?? null;
			try
			{
				input?.focus();
			}
			catch
			{
				// A non-focusable or missing FIND input is not fatal.
			}

			return input !== null;
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

			// Typing is what most often flips `main-ui-show` on the icon's container;
			// resync right away instead of waiting for the next relocation/resize.
			const host = this.getFilterHost();
			if (host)
			{
				this.enhanceFilterClearButton(host);
			}
		},
		// The standard component only wires this icon for click: no role, no name.
		// Enhancing it here (rather than in `main.ui.filter` itself) keeps the fix
		// scoped to the picker's own relocated copy. Idempotent: safe to call again
		// after every relocation/resize sync, input or reset. Tabindex is recomputed
		// every call, unlike role/aria-label: it must track the icon's real
		// visibility (`main-ui-show` on its container), not just be set once.
		enhanceFilterClearButton(host: HTMLElement): void
		{
			const button = host.querySelector<HTMLElement>(FILTER_CLEAR_SELECTOR);
			if (!button)
			{
				return;
			}

			if (button.getAttribute('role') !== 'button')
			{
				button.setAttribute('role', 'button');
				button.setAttribute('aria-label', this.loc('DISK_PICKER_SEARCH_CLEAR'));
			}

			const container = button.closest(FILTER_CLEAR_CONTAINER_SELECTOR);
			const visible = container !== null && Dom.hasClass(container, FILTER_CLEAR_VISIBLE_CLASS);
			if (visible)
			{
				button.setAttribute('tabindex', '0');
			}
			else
			{
				button.removeAttribute('tabindex');
			}
		},
		// Enter/Space on the clear icon: it is a `<span>`, so the browser generates no
		// click of its own. A single programmatic `click()` reaches the standard
		// component's own container-level click handler exactly once.
		handleFilterKeydown(event: KeyboardEvent): void
		{
			if (event.key !== 'Enter' && event.key !== ' ')
			{
				return;
			}

			const target = event.target;
			if (!(target instanceof HTMLElement) || !target.matches(FILTER_CLEAR_SELECTOR))
			{
				return;
			}

			event.preventDefault();
			target.click();
		},
		loc(messageCode: string): string
		{
			return Loc.getMessage(messageCode) ?? '';
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
		// ALG-02. The viewer closes itself on the keydown of an Escape press, so the record
		// that the press was its own lives here and not in the preview session, which is
		// already reset by the keyup. Every press rewrites the record rather than only
		// arming it, so a keyup the window never saw leaves none behind.
		handleDocumentKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Escape' && !event.repeat)
			{
				this.viewerEscapeArmed = useViewerStore().open;
			}
		},
		// Escape while the search is open and focused inside the filter must not reach
		// the popup's own close-by-esc handler. `stopImmediatePropagation` on this
		// first-registered document capture listener keeps the picker open; an empty,
		// unfiltered search additionally collapses back to the button. The filter
		// popup mounts outside the host, closes itself on the Escape keydown and on
		// desktop usually moves the focus into FIND before this keyup runs. A target
		// still inside it (mobile, or a FIND above the viewport top, where the standard
		// filter skips the refocus) counts as inside the search and gets the FIND focus.
		handleDocumentEscape(event: KeyboardEvent): void
		{
			if (event.key !== 'Escape')
			{
				return;
			}

			// The viewer closed itself on the keydown of this very press: swallowing the
			// keyup keeps the same press from closing the picker window behind it.
			const armed = this.viewerEscapeArmed;
			this.viewerEscapeArmed = false;
			if (armed || useViewerStore().open)
			{
				event.stopImmediatePropagation();

				return;
			}

			if (!useSessionStore().searchOpen)
			{
				return;
			}

			const host = this.getFilterHost();
			const target = event.target as Element | null;
			if (host === null || target === null)
			{
				return;
			}

			const insideHost = host.contains(target);
			if (!insideHost && !isRelatedFilterTarget(target, host))
			{
				return;
			}

			event.stopImmediatePropagation();
			if (this.isSearchMeaningless())
			{
				this.collapseSearch();
			}
			else if (!insideHost)
			{
				this.focusFilterFind();
			}
		},
		handleDocumentPointerdown(event: PointerEvent): void
		{
			const target = event.target;
			this.filterPointerdownActive = target instanceof Element
				&& isRelatedFilterTarget(target, this.getFilterHost());

			setTimeout(() => {
				this.filterPointerdownActive = false;
			}, 0);
		},
		handleFilterFocusout(event: FocusEvent): void
		{
			const host = this.getFilterHost();
			const relatedTarget = event.relatedTarget;
			const movedToRelatedPopup = relatedTarget instanceof Element
				&& isRelatedFilterTarget(relatedTarget, host);
			const filterPointerdownActive = this.filterPointerdownActive;
			this.filterPointerdownActive = false;

			// Defer so the incoming focus target is settled; a filter dropdown or menu
			// rendered outside the host must not be read as leaving the search.
			setTimeout(() => {
				if (!useSessionStore().searchOpen)
				{
					return;
				}

				const active = document.activeElement;
				const activeInRelatedPopup = active instanceof Element
					&& isRelatedFilterTarget(active, host);
				const stillInside = filterPointerdownActive
					|| movedToRelatedPopup
					|| (
						host !== null
						&& active !== null
						&& (host.contains(active) || activeInRelatedPopup)
					);
				if (!stillInside && this.isSearchMeaningless())
				{
					useSessionStore().setSearchOpen(false);
				}
			}, 0);
		},
		// Tab steps between the groups; the open search keeps native Tab until its edge.
		handleTrap(event: KeyboardEvent): void
		{
			if (event.key !== 'Tab')
			{
				return;
			}

			// While the viewer is shown it owns the focus: the window must not pull it back.
			if (useViewerStore().open)
			{
				return;
			}

			// An open related filter popup owns its focus; let native focus flow.
			if (getFilterSettingsPopup(this.getFilterHost()) || document.querySelector(RELATED_POPUP_SELECTOR))
			{
				return;
			}

			const active = document.activeElement;
			if (
				this.isInsideSearchAwayFromEdge(active, event.shiftKey)
				|| this.isInsideActionsAwayFromEdge(active, event.shiftKey)
			)
			{
				return;
			}

			event.preventDefault();
			this.focusAdjacentGroup(this.groupOf(active), event.shiftKey ? -1 : 1);
		},
		groupOf(element: Element | null): GroupId | null
		{
			const container = element?.closest<HTMLElement>(`[${GROUP_ATTRIBUTE}]`) ?? null;
			const id = container?.getAttribute(GROUP_ATTRIBUTE) ?? '';

			return GROUP_ORDER.includes(id) ? id as GroupId : null;
		},
		isInsideSearchAwayFromEdge(active: Element | null, backwards: boolean): boolean
		{
			const host = this.getFilterHost();
			if (!host || !this.searchOpen || !(active instanceof HTMLElement) || !host.contains(active))
			{
				return false;
			}

			const controls = listFocusableControls(host);
			const edge = backwards ? controls[0] : controls[controls.length - 1];

			return active !== edge;
		},
		// Confirm and Cancel are both real native Tab stops (unlike the roving
		// tabindex groups): native Tab/Shift+Tab must move between them, so App only
		// intercepts Tab at the true edge of the group, same as the open search.
		isInsideActionsAwayFromEdge(active: Element | null, backwards: boolean): boolean
		{
			const root = (this.$refs.actions as { $el?: HTMLElement } | undefined)?.$el ?? null;
			if (!root || !(active instanceof HTMLElement) || !root.contains(active))
			{
				return false;
			}

			const controls = listFocusableControls(root);
			const edge = backwards ? controls[0] : controls[controls.length - 1];

			return active !== edge;
		},
		// Wraps at both ends and skips a group with nothing to focus.
		focusAdjacentGroup(from: GroupId | null, direction: 1 | -1): void
		{
			const count = GROUP_ORDER.length;
			let index = from === null ? (direction > 0 ? -1 : count) : GROUP_ORDER.indexOf(from);
			for (let step = 0; step < count; step++)
			{
				index = (index + direction + count) % count;
				if (this.focusGroup(GROUP_ORDER[index] as GroupId, direction))
				{
					return;
				}
			}
		},
		// Most groups have one stable point regardless of entry direction (roving
		// tabindex leaves only one native stop). The open search and the actions
		// group do not: forward entry (Tab) lands on the first native control like
		// before, but backward entry (Shift+Tab wrapping in) must land on whatever
		// native Tab would reach last -- or Shift+Tab would silently skip a
		// reachable control (the clear button, or Cancel).
		focusGroup(id: GroupId, direction: 1 | -1): boolean
		{
			if (id === 'header' && this.searchOpen)
			{
				return direction > 0 ? this.focusFilterFind() : this.focusFilterLastControl();
			}

			if (id === 'actions' && direction < 0)
			{
				return this.focusActionsLastControl();
			}

			const owners = this.$refs as { [key: string]: GroupOwner | undefined };

			return owners[id]?.focusEntry?.() === true;
		},
		// The last native Tab stop inside the open search: the visible clear button
		// when it is focusable, FIND otherwise. Used for backward entry into the
		// header group so Shift+Tab from `actions` does not skip past it.
		focusFilterLastControl(): boolean
		{
			const host = this.getFilterHost();
			const controls = host ? listFocusableControls(host) : [];
			const last = controls[controls.length - 1] ?? null;
			try
			{
				last?.focus();
			}
			catch
			{
				// A non-focusable or missing control is not fatal.
			}

			return last !== null;
		},
		// The last native Tab stop in actions: Cancel, unless Confirm is disabled and
		// Cancel is the only reachable control (then it is both first and last). Used
		// for backward entry (Shift+Tab wrapping in from storage) so it does not skip
		// past Cancel onto Confirm.
		focusActionsLastControl(): boolean
		{
			const root = (this.$refs.actions as { $el?: HTMLElement } | undefined)?.$el ?? null;
			const controls = root ? listFocusableControls(root) : [];
			const last = controls[controls.length - 1] ?? null;
			last?.focus();

			return last !== null;
		},
		// NAV-01: on open, hand focus to the files group rather than leaving it on
		// the outer popup container the public facade focused. Only steals it once,
		// and only if the user or onOpen has not already moved focus elsewhere; the
		// four-group Tab route and arrow behavior are unaffected.
		focusInitialGroup(): void
		{
			if (this.initialFocusHandled)
			{
				return;
			}

			this.initialFocusHandled = true;
			const container = (this.$el as HTMLElement).closest('.disk-picker');
			const active = document.activeElement;
			const focusOnContainer = active === null || active === document.body || active === container;
			if (!focusOnContainer)
			{
				return;
			}

			const owners = this.$refs as { [key: string]: GroupOwner | undefined };
			owners.files?.focusEntry?.();
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
				data-disk-picker-group="header"
				data-testid="universal-disk-picker-search-filter"
				class="disk-picker__filter-host --ui-context-edge-dark"
				:class="{ '--open': searchOpen }"
			></div>
			<LoadingSkeleton v-if="!initialized"/>
			<PickerLayout v-else>
				<template #sidebar>
					<SourceSidebar ref="storage"/>
				</template>
				<template #header>
					<PickerToolbar ref="header"/>
				</template>
				<template #list>
					<ItemBrowser ref="files"/>
				</template>
				<template #preview>
					<PreviewPanel/>
				</template>
				<template #footer>
					<SelectionFooter ref="actions"/>
				</template>
			</PickerLayout>
		</div>
	`,
});
