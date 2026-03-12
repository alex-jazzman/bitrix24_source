import { PermissionManager } from 'im.v2.lib.permission';
import { ActionByUserType } from 'im.v2.const';

import { HeaderAddButton } from './header-add-button';
import { HeaderItem } from './header-item';
import { HeaderSkeleton } from './header-skeleton';
import { HeaderHighlight } from './header-highlight';

import '../css/header/header-tabs.css';

import type { ImModelStickerPack } from 'im.v2.model';

const SCROLL_LOADING_OFFSET = 200;

// @vue/component
export const HeaderTabs = {
	name: 'HeaderTabs',
	components: { HeaderItem, HeaderSkeleton, HeaderAddButton, HeaderHighlight },
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
	methods: {
		async onScrollHeader(event: Event)
		{
			const container = event.target;
			if (this.isLoading || !this.needToLoad(container, SCROLL_LOADING_OFFSET))
			{
				return;
			}
			this.$emit('scrollNextPage');
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
		onWheel(event: WheelEvent)
		{
			const { deltaX, deltaY, shiftKey } = event;
			const absX = Math.abs(deltaX);
			const absY = Math.abs(deltaY);

			const isHorizontalScroll = absX > absY || shiftKey;
			if (isHorizontalScroll)
			{
				return;
			}

			// vertical scroll - convert to horizontal scroll
			event.preventDefault();
			this.$refs.tabs.scrollLeft += Number(deltaY);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div
			class="bx-im-sticker-header-tabs__container"
			@scroll="onScrollHeader"
			@wheel="onWheel"
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
					@click="onHeaderPick(pack)"
				/>
				<HeaderHighlight :activeIndex="activePackIndex"/>
			</template>
			<HeaderSkeleton v-if="isLoading" />
		</div>
	`,
};
