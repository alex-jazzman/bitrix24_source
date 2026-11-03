import { PopupManager } from 'main.popup';
import { markRaw } from 'ui.vue3';

import { StickerManager } from 'im.v2.lib.sticker';
import { StickerPackForm } from 'im.v2.component.sticker';
import { StickerService } from 'im.v2.provider.service.sticker';
import { PopupType } from 'im.v2.const';
import { Spinner, SpinnerColor, SpinnerSize } from 'im.v2.component.elements.loader';

import { GridFocusZone } from '../../helpers/grid-focus';
import { ObserverManager } from './classes/observer-manager';
import { Pack } from './pack/pack';
import { PackSkeleton } from './pack/pack-skeleton';
import { HeaderTabs } from './header/header-tabs';

import './css/tab-stickers.css';

import type { JsonObject } from 'main.core';
import type { BaseEvent } from 'main.core.events';
import type { ImModelStickerPack, ImModelStickerPackIdentifier } from 'im.v2.model';

const SCROLL_LOAD_BODY_OFFSET = 500;
// Roving focus lands on the native button inside a gridcell, so the grid tracks buttons, not wrappers.
const CELL_SELECTOR = '.bx-im-sticker-item__button';
// The add-sticker button of an editable pack and the ... actions button of a pack header are members of
// the same grid: arrows reach them, they get no Tab stop of their own.
const ADD_BUTTON_SELECTOR = '.bx-im-stickers-add-sticker-button__container';
const PACK_ACTIONS_SELECTOR = '.bx-im-sticker-pack__header-actions';
const GRID_CELL_SELECTOR = `${CELL_SELECTOR}, ${ADD_BUTTON_SELECTOR}, ${PACK_ACTIONS_SELECTOR}`;
const PACK_SELECTOR = '.bx-im-sticker-pack__container';
// The popup lays its button panel over the bottom of the grid instead of shrinking it, so the visible
// area of the scrollport is shorter than its box. The shared grid engine has to be told about it.
const BOTTOM_OVERLAY = {
	within: '.bx-im-emote-popup__container',
	selector: '.bx-im-emote-popup__buttons-container',
};

// @vue/component
export const TabStickers = {
	name: 'TabStickers',
	components: { Pack, PackSkeleton, HeaderTabs, Spinner, StickerPackForm },
	directives: {
		'pack-observer': {
			mounted(element, binding)
			{
				binding.instance.observer.observe(element);
			},
			beforeUnmount(element, binding)
			{
				binding.instance.observer.unobserve(element);
			},
		},
	},
	inject: ['disableAutoHide', 'enableAutoHide'],
	provide()
	{
		return {
			// Only this tab lays the shared sticker grid out as a real grid, so only here does a cell need a
			// name. Replacer functions, not strings: a pack named with `$&` would otherwise rewrite the label
			// instead of being put into it.
			buildStickerLabel: (packName: string, position: number): string => {
				return this.loc('IM_TEXTAREA_STICKER_ITEM_ARIA')
					.replace('#PACK_NAME#', () => packName)
					.replace('#NUMBER#', () => position)
				;
			},
		};
	},
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	emits: ['close'],
	data(): JsonObject
	{
		return {
			activePack: {
				id: null,
				type: null,
			},
			isLoadingFirstPage: true,
			isLoadingNextPage: false,
			showSlider: false,
		};
	},
	computed: {
		SpinnerColor: () => SpinnerColor,
		SpinnerSize: () => SpinnerSize,
		isLoading(): boolean
		{
			return this.isLoadingFirstPage || this.isLoadingNextPage;
		},
		recentPack(): ImModelStickerPack
		{
			return StickerManager.getRecentPack();
		},
		packs(): ImModelStickerPack[]
		{
			const packs = this.$store.getters['stickers/packs/get'];
			if (this.hasRecentStickers)
			{
				return [this.recentPack, ...packs];
			}

			return packs;
		},
		hasRecentStickers(): boolean
		{
			return this.$store.getters['stickers/recent/get'].length > 0;
		},
	},
	async created()
	{
		this.gridFocusZone = null;
		this.initObserverManager();
		this.stickerService = StickerService.getInstance();
		await this.stickerService.initFirstPage();
		this.isLoadingFirstPage = false;
		await this.$nextTick();
		this.setInitialEntryPoint();
	},
	mounted()
	{
		this.initGridFocusZone();
	},
	beforeUnmount()
	{
		this.destroyGridFocusZone();
	},
	methods: {
		initGridFocusZone(): void
		{
			const container = this.$refs.packListContainer;
			if (!container)
			{
				return;
			}

			// The zone holds DOM nodes and must stay out of reactive state. Packs arriving after the mount
			// are picked up by the zone and its geometry cache on their own.
			this.gridFocusZone = markRaw(new GridFocusZone(container, GRID_CELL_SELECTOR, {
				sectionSelector: PACK_SELECTOR,
				bottomOverlay: BOTTOM_OVERLAY,
				withEntryPointControl: true,
				onLastRowFocus: () => this.loadNextPageOnEdge(),
			}));
			this.gridFocusZone.activate();
		},
		destroyGridFocusZone(): void
		{
			this.gridFocusZone?.deactivate();
			this.gridFocusZone = null;
		},
		initObserverManager()
		{
			this.observer = new ObserverManager();

			this.observer.subscribe(
				ObserverManager.events.onChangeActivePack,
				(event: BaseEvent<ImModelStickerPackIdentifier>) => {
					const { id, type } = event.getData();
					this.activePack = { id, type };
				},
			);
		},
		// The grid must be entered on a sticker, not on the ... of a pack header or the "+ sticker" cell
		// that also belong to it: CELL_SELECTOR matches sticker buttons alone, and the recent pack leads
		// the list, so the first match is the first recent sticker whenever there is one.
		setInitialEntryPoint()
		{
			const firstSticker = this.$refs.packListContainer?.querySelector(CELL_SELECTOR);
			if (firstSticker)
			{
				this.gridFocusZone?.setEntryPoint(firstSticker);
			}
		},
		// Picking a tab of the header is the only explicit move to a pack: the active pack of the header
		// itself is also written back by the scroll observer, and that must leave the grid alone.
		scrollToPack({ id, type }: ImModelStickerPackIdentifier)
		{
			const packElement = this.$refs.packListContainer.querySelector(
				`[data-pack-type="${type}"][data-pack-id="${id}"]`,
			);
			if (!packElement)
			{
				return;
			}

			if (packElement.scrollIntoView)
			{
				packElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
			}

			// An empty pack has no cell to enter, so the grid keeps the one it remembers.
			const firstCell = packElement.querySelector(CELL_SELECTOR);
			if (firstCell)
			{
				this.gridFocusZone?.setEntryPoint(firstCell);
			}
		},
		needToLoad(container: HTMLElement, offset: number): boolean
		{
			const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;

			return remaining <= offset;
		},
		closeContextMenus()
		{
			PopupManager.getPopupById(PopupType.stickerContextMenu)?.close();
			PopupManager.getPopupById(PopupType.stickerPackContextMenu)?.close();
		},
		// The flag is lowered in finally: a rejected page request must not leave the grid aria-busy and
		// both keyboard edges dead until the popup is reopened.
		async loadNextPage(): void
		{
			this.isLoadingNextPage = true;
			try
			{
				await this.stickerService.loadNextPage();
			}
			finally
			{
				this.isLoadingNextPage = false;
			}
		},
		// The service short-circuits a page request once the last page is in, but the wrapper does not: it
		// would still raise the loading flag and flip aria-busy for a request that never happens, and that
		// markup change drops the row cache of the grid right at the bottom edge. So the edge asks first.
		hasMorePages(): boolean
		{
			return this.stickerService.hasMorePages();
		},
		// The keyboard can reach the last row while the grid still fits without a scrollbar, so no scroll
		// event ever asks for more: the grid signals the edge on focus and the next page is loaded here,
		// under the same guards as the scroll path minus its distance-to-the-end check.
		loadNextPageOnEdge(): void
		{
			if (this.isLoading || !this.hasMorePages())
			{
				return;
			}

			void this.loadNextPage();
		},
		async onScrollBody(event: Event): void
		{
			this.closeContextMenus();
			const container = event.target;
			if (this.isLoading || !this.needToLoad(container, SCROLL_LOAD_BODY_OFFSET))
			{
				return;
			}
			void this.loadNextPage();
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-emote-selector-tab-stickers__container">
			<HeaderTabs
				:dialogId="dialogId"
				:isLoadingFirstPage="isLoadingFirstPage"
				:isLoadingNextPage="isLoadingNextPage"
				:hasMorePages="hasMorePages"
				:packs="packs"
				:activePack="activePack"
				@changeActivePack="scrollToPack"
				@scrollNextPage="loadNextPage"
			/>
			<div
				class="bx-im-emote-selector-tab-stickers__packs-container"
				ref="packListContainer"
				role="grid"
				:aria-label="loc('IM_TEXTAREA_STICKER_LIST_ARIA')"
				:aria-busy="isLoading"
				data-testid="im-textarea-sticker-grid"
				@scroll="onScrollBody"
			>
				<div v-if="isLoadingFirstPage" aria-hidden="true">
					<PackSkeleton />
				</div>
				<template v-else>
					<Pack
						v-for="pack in packs"
						v-pack-observer
						:dialogId="dialogId"
						:key="pack.key"
						:pack="pack"
						:data-pack-id="pack.id"
						:data-pack-type="pack.type"
						:data-testid="'im-textarea-sticker-pack-' + pack.type + '-' + pack.id"
						@close="$emit('close')"
					/>
				</template>
				<Spinner
					v-if="isLoadingNextPage"
					:size="SpinnerSize.XS"
					:color="SpinnerColor.mainPrimary"
					class="bx-im-emote-selector-tab-stickers__loader"
					aria-hidden="true"
				/>
			</div>
		</div>
	`,
};
