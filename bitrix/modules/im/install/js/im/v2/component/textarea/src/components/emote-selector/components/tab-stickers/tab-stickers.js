import { PopupManager } from 'main.popup';

import { StickerManager } from 'im.v2.lib.sticker';
import { StickerPackForm } from 'im.v2.component.sticker';
import { StickerService } from 'im.v2.provider.service.sticker';
import { PopupType } from 'im.v2.const';
import { Spinner, SpinnerColor, SpinnerSize } from 'im.v2.component.elements.loader';

import { ObserverManager } from './classes/observer-manager';
import { Pack } from './pack/pack';
import { PackSkeleton } from './pack/pack-skeleton';
import { HeaderTabs } from './header/header-tabs';

import './css/tab-stickers.css';

import type { JsonObject } from 'main.core';
import type { BaseEvent } from 'main.core.events';
import type { ImModelStickerPack, ImModelStickerPackIdentifier } from 'im.v2.model';

const SCROLL_LOAD_BODY_OFFSET = 500;

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
		this.initObserverManager();
		this.stickerService = StickerService.getInstance();
		await this.stickerService.initFirstPage();
		this.isLoadingFirstPage = false;
	},
	methods: {
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
		scrollToPack({ id, type }: ImModelStickerPackIdentifier)
		{
			const packElement = this.$refs.packListContainer.querySelector(
				`[data-pack-type="${type}"][data-pack-id="${id}"]`,
			);
			if (packElement && packElement.scrollIntoView)
			{
				packElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
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
		async loadNextPage(): void
		{
			this.isLoadingNextPage = true;
			await this.stickerService.loadNextPage();
			this.isLoadingNextPage = false;
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
				:packs="packs"
				:activePack="activePack"
				@changeActivePack="scrollToPack"
				@scrollNextPage="loadNextPage"
			/>
			<div
				class="bx-im-emote-selector-tab-stickers__packs-container"
				ref="packListContainer"
				@scroll="onScrollBody"
			>
				<PackSkeleton v-if="isLoadingFirstPage" />
				<template v-else>
					<Pack
						v-for="pack in packs"
						v-pack-observer
						:dialogId="dialogId"
						:key="pack.key"
						:pack="pack"
						:data-pack-id="pack.id"
						:data-pack-type="pack.type"
						@close="$emit('close')"
					/>
				</template>
				<Spinner
					v-if="isLoadingNextPage"
					:size="SpinnerSize.XS"
					:color="SpinnerColor.mainPrimary"
					class="bx-im-emote-selector-tab-stickers__loader"
				/>
			</div>
		</div>
	`,
};
