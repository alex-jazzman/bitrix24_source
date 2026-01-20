import { StickerService } from 'im.v2.provider.service.sticker';

import { PackItem } from './pack/pack-item';
import { PackShimmer } from './pack/pack-shimmer';
import { HeaderItem } from './header/header-item';
import { HeaderShimmer } from './header/header-shimmer';

import './css/tab-stickers.css';

import type { JsonObject } from 'main.core';

export const RECENT_PACK_KEY = '0:recent';
const SCROLL_LOAD_HEADER_OFFSET = 200;
const SCROLL_LOAD_BODY_OFFSET = 500;

// @vue/component
export const TabStickers = {
	name: 'TabStickers',
	components: { PackItem, PackShimmer, HeaderItem, HeaderShimmer },
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
			activePackKey: RECENT_PACK_KEY,
			isLoading: false,
		};
	},
	computed: {
		packKeys(): string[]
		{
			const packs = this.$store.getters['messages/stickers/getPackKeys'];

			return [RECENT_PACK_KEY, ...packs];
		},
	},
	async created()
	{
		this.stickerService = StickerService.getInstance();
		this.isLoading = true;
		await this.stickerService.initFirstPage();
		this.isLoading = false;
	},
	methods: {
		onHeaderPick(packKey: string): void
		{
			this.activePackKey = packKey;
			this.scrollToPack(packKey);
		},
		scrollToPack(packKey: string): void
		{
			const packElem = this.$refs.packListContainer.querySelector(`[data-pack-key="${packKey}"]`);
			if (packElem && packElem.scrollIntoView)
			{
				packElem.scrollIntoView({ block: 'start', behavior: 'smooth' });
			}
		},
		onActivePackChange(packKey: string): void
		{
			this.activePackKey = packKey;
		},
		needToLoad(container: HTMLElement, offset: number): boolean
		{
			const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;

			return remaining <= offset;
		},
		async loadNextPage(): void
		{
			this.isLoading = true;
			await this.stickerService.loadNextPage();
			this.isLoading = false;
		},
		async onScrollHeader(event: Event): void
		{
			const container = event.target;
			if (this.isLoading || !this.needToLoad(container, SCROLL_LOAD_HEADER_OFFSET))
			{
				return;
			}
			void this.loadNextPage();
		},
		async onScrollBody(event: Event): void
		{
			const container = event.target;
			if (this.isLoading || !this.needToLoad(container, SCROLL_LOAD_BODY_OFFSET))
			{
				return;
			}
			void this.loadNextPage();
		},
		onClose(): void
		{
			this.$emit('close');
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-stickers-tab__container">
			<div
				class="bx-im-stickers-header__container"
				ref="headerListContainer"
				@scroll="onScrollHeader"
			>
				<HeaderItem
					v-for="key in packKeys"
					:key="key"
					:packKey="key"
					:active="key === activePackKey"
					@click="onHeaderPick(key)"
				/>
				<HeaderShimmer v-if="isLoading" />
			</div>
			<div
				class="bx-im-stickers-pack-list__container"
				ref="packListContainer"
				@scroll="onScrollBody"
			>
				<PackItem
					v-for="key in packKeys"
					:dialogId="dialogId"
					:key="key"
					:packKey="key"
					:data-pack-key="key"
					@activePackChange="onActivePackChange"
					@close="onClose"
				/>
				<PackShimmer v-if="isLoading" />
			</div>
		</div>
	`,
};
