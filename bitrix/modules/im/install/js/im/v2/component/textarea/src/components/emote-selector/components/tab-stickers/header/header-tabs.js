import { markRaw } from 'ui.vue3';
import { FocusKeys } from 'ui.a11y';

import { ActionByUserType } from 'im.v2.const';
import { createListFocusZone } from 'im.v2.lib.a11y';
import { PermissionManager } from 'im.v2.lib.permission';
import { type ImModelStickerPack } from 'im.v2.model';
import { horizontalScroll } from 'im.v2.lib.directives';

import { activateWhenVisible } from '../../../helpers/deferred-activation';
import { HeaderAddButton } from './header-add-button';
import { HeaderHighlight } from './header-highlight';
import { HeaderItem } from './header-item';
import { HeaderSkeleton } from './header-skeleton';

import '../css/header/header-tabs.css';

const SCROLL_LOADING_OFFSET = 200;
const TAB_SELECTOR = '.bx-im-stickers-header__item';
// A toolbar of pack shortcuts laid out in a row: arrows along it, Home/End to its ends. The
// create-pack button shares the container but is not one of the pack buttons, so it keeps its own
// place in the tab order.
const TABS_BIND_KEYS: number = FocusKeys.ArrowHorizontal | FocusKeys.HomeAndEnd;

// The tab that follows this one in the ribbon, without listing the ribbon: the tabs are siblings, and
// what comes after the last of them is the highlight and the skeleton, never another tab.
function nextTab(tab: HTMLElement): HTMLElement | null
{
	let sibling = tab.nextElementSibling;
	while (sibling !== null && !sibling.matches(TAB_SELECTOR))
	{
		sibling = sibling.nextElementSibling;
	}

	return sibling;
}

// @vue/component
export const HeaderTabs = {
	name: 'HeaderTabs',
	components: { HeaderItem, HeaderSkeleton, HeaderAddButton, HeaderHighlight },
	directives: { horizontalScroll },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		packs: {
			type: Array,
			required: true,
		},
		activePack: {
			type: Object,
			required: true,
		},
		isLoadingFirstPage: {
			type: Boolean,
			required: true,
		},
		isLoadingNextPage: {
			type: Boolean,
			required: true,
		},
		// Asked, not mirrored: the sticker service is a singleton shared with every other surface that pages
		// it, so a copy of the answer kept here would go stale behind this component's back.
		hasMorePages: {
			type: Function,
			required: true,
		},
	},
	emits: ['changeActivePack', 'scrollNextPage'],
	computed: {
		isLoading(): boolean
		{
			return this.isLoadingFirstPage || this.isLoadingNextPage;
		},
		activePackIndex(): number
		{
			return this.packs.findIndex((pack: ImModelStickerPack) => (
				pack.id === this.activePack.id && pack.type === this.activePack.type
			));
		},
		needAddButton(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.createStickerPack);
		},
	},
	watch: {
		activePackIndex(newIndex: number)
		{
			void this.$nextTick(() => {
				this.scrollToActiveTab(newIndex);
			});
		},
	},
	created()
	{
		this.tabsFocusZone = null;
		this.cancelFocusZoneActivation = null;
	},
	mounted()
	{
		this.initTabsFocusZone();
	},
	beforeUnmount()
	{
		this.destroyTabsFocusZone();
	},
	methods: {
		initTabsFocusZone()
		{
			const container = this.$refs.tabs;
			if (!container)
			{
				return;
			}

			// The zone object holds DOM nodes and must stay out of reactive state.
			this.tabsFocusZone = markRaw(createListFocusZone(container, {
				bindKeys: TABS_BIND_KEYS,
				focusableElementFilter: (element: HTMLElement): boolean => element.matches(TAB_SELECTOR),
			}));
			// Tabs of the pack saved in local storage mount while the popup is still fading in, and the
			// packs themselves arrive later - the zone picks them up by watching the markup.
			this.cancelFocusZoneActivation = activateWhenVisible(this.tabsFocusZone, container);
		},
		destroyTabsFocusZone()
		{
			this.cancelFocusZoneActivation?.();
			this.cancelFocusZoneActivation = null;

			this.tabsFocusZone?.deactivate();
			this.tabsFocusZone = null;
		},
		async onScrollHeader(event: Event)
		{
			const container = event.target;
			if (this.isLoading || !this.needToLoad(container, SCROLL_LOADING_OFFSET))
			{
				return;
			}
			this.$emit('scrollNextPage');
		},
		onTabsFocusIn(event: FocusEvent)
		{
			const target = event.target;
			if (!(target instanceof HTMLElement) || !target.matches(TAB_SELECTOR))
			{
				return;
			}

			// A ribbon that fits without a scrollbar fires no scroll event, so the keyboard could never
			// reach the next page: landing on the last tab loads it explicitly, under the same guards as the
			// scroll path - no parallel load, and something left to load. Without the second one every
			// arrow key on the last tab would raise the loading flag and flip aria-busy for a request the
			// service short-circuits anyway.
			const isLastTab = nextTab(target) === null;
			if (isLastTab && !this.isLoading && this.hasMorePages())
			{
				this.$emit('scrollNextPage');
			}
		},
		needToLoad(container: HTMLElement, offset: number): boolean
		{
			const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;

			return remaining <= offset;
		},
		isPackActive(pack: ImModelStickerPack): boolean
		{
			return pack.id === this.activePack.id && pack.type === this.activePack.type;
		},
		onHeaderPick(pack: ImModelStickerPack)
		{
			this.$emit('changeActivePack', {
				id: pack.id,
				type: pack.type,
			});
		},
		scrollToActiveTab(index: number)
		{
			const packIndex = this.needAddButton ? index + 1 : index; // +1 to skip add button
			const pack = this.$refs.tabs.children[packIndex];
			pack.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div
			v-horizontal-scroll
			class="bx-im-sticker-header-tabs__container --hidden-scroll"
			role="toolbar"
			aria-orientation="horizontal"
			:aria-label="loc('IM_TEXTAREA_STICKER_PACKS_TABS_ARIA')"
			:aria-busy="isLoading"
			data-testid="im-textarea-sticker-packs-tabs"
			@scroll="onScrollHeader"
			@focusin="onTabsFocusIn"
			ref="tabs"
		>
			<HeaderAddButton
				v-if="needAddButton"
				:dialogId="dialogId"
				class="bx-im-sticker-header-tabs__add-button"
			/>
			<template v-if="!isLoadingFirstPage">
				<HeaderItem
					v-for="pack in packs"
					:key="pack.key"
					:pack="pack"
					:isActive="isPackActive(pack)"
					class="bx-im-sticker-header-tabs__item"
					:data-testid="'im-textarea-sticker-pack-tab-' + pack.type + '-' + pack.id"
					@click="onHeaderPick(pack)"
				/>
				<HeaderHighlight aria-hidden="true" :activeIndex="activePackIndex"/>
			</template>
			<HeaderSkeleton v-if="isLoading" aria-hidden="true" />
		</div>
	`,
};
