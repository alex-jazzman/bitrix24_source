import { Core } from 'im.v2.application.core';
import { ActionByUserType, StickerPackType } from 'im.v2.const';
import { PermissionManager } from 'im.v2.lib.permission';
import { StickerManager } from 'im.v2.lib.sticker';

import { AddStickerButton } from './components/add-sticker-button';
import { StickerItem } from '../sticker-item/sticker-item';
import { StickerPreview } from '../sticker-preview/sticker-preview';
import { StickerPreviewManager } from '../../classes/sticker-preview-manager';

import './css/pack-stickers.css';

import type { JsonObject } from 'main.core';
import type { ImModelSticker } from 'im.v2.model';
import type { BaseEvent } from 'main.core.events';

// @vue/component
export const PackStickers = {
	name: 'PackStickers',
	components: { StickerItem, AddStickerButton, StickerPreview },
	inject: ['disableAutoHide', 'enableAutoHide'],
	props: {
		pack: {
			type: Object,
			required: true,
		},
		withAddButton: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['clickSticker', 'openContextMenuSticker'],
	data(): JsonObject
	{
		return {
			previewSticker: null,
		};
	},
	computed: {
		isRecentPack(): boolean
		{
			return StickerManager.isRecentPack(this.pack);
		},
		recentStickers(): ImModelSticker[]
		{
			return this.$store.getters['stickers/recent/get'];
		},
		stickers(): ImModelSticker[]
		{
			if (this.isRecentPack)
			{
				return this.recentStickers;
			}

			return this.$store.getters['stickers/getByPack']({
				id: this.pack.id,
				type: this.pack.type,
			});
		},
		canAddStickers(): boolean
		{
			if (!PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.changeStickerPack))
			{
				return false;
			}

			if (!this.withAddButton)
			{
				return false;
			}

			return this.pack.type === StickerPackType.custom && this.pack.authorId === Core.getUserId();
		},
	},
	beforeUnmount()
	{
		this.unsubscribeFromPreviewManager();
	},
	methods: {
		getStickerUniqueKey(sticker: ImModelSticker): string
		{
			return `${sticker.packId}:${sticker.packType}:${sticker.id}`;
		},
		onMouseDown(event: PointerEvent, sticker: ImModelSticker)
		{
			this.subscribeToPreviewManager();
			StickerPreviewManager.getInstance().trackLongPress(event, sticker);
		},
		subscribeToPreviewManager()
		{
			this.unsubscribeFromPreviewManager();

			const previewManager = StickerPreviewManager.getInstance();
			previewManager.subscribe(StickerPreviewManager.events.showPreview, this.onPreviewShow);
			previewManager.subscribe(StickerPreviewManager.events.hidePreview, this.onPreviewHide);
		},
		unsubscribeFromPreviewManager()
		{
			const previewManager = StickerPreviewManager.getInstance();
			previewManager.unsubscribe(StickerPreviewManager.events.showPreview, this.onPreviewShow);
			previewManager.unsubscribe(StickerPreviewManager.events.hidePreview, this.onPreviewHide);
		},
		onPreviewShow(event: BaseEvent<{ sticker: ImModelSticker }>)
		{
			const { sticker } = event.getData();
			this.previewSticker = sticker;
			this.disableAutoHide();
		},
		onPreviewHide()
		{
			this.previewSticker = null;
			this.enableAutoHide();
			this.unsubscribeFromPreviewManager();
		},
		onClickSticker(event: PointerEvent, sticker: ImModelSticker)
		{
			this.$emit('clickSticker', { event, sticker });
		},
		cancelLongPressTracking()
		{
			StickerPreviewManager.getInstance().cancelLongPressTracking();
		},
	},
	template: `
		<div class="bx-im-pack-stickers__container">
			<StickerItem
				v-for="sticker in stickers"
				:key="getStickerUniqueKey(sticker)"
				:sticker="sticker"
				@click="onClickSticker($event, sticker)"
				@mousedown="onMouseDown($event, sticker)"
				@contextmenu.prevent="$emit('openContextMenuSticker', { event: $event, sticker })"
			/>
			<AddStickerButton v-if="canAddStickers" :pack="pack" />
			<StickerPreview
				v-if="previewSticker"
				:sticker="previewSticker"
				@close="cancelLongPressTracking"
			/>
		</div>
	`,
};
