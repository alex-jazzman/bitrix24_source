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

// Fixed grid width: exactly four cells per row, whatever the popup width. The add-sticker cell counts
// as a member too, so it flows into the last row of stickers instead of starting a row of its own.
const COLUMNS = 4;

type GridCellItem = {
	type: string,
	key: string,
	sticker?: ImModelSticker,
	label?: string,
};

// @vue/component
export const PackStickers = {
	name: 'PackStickers',
	components: { StickerItem, AddStickerButton, StickerPreview },
	inject: {
		disableAutoHide: 'disableAutoHide',
		enableAutoHide: 'enableAutoHide',
		// Provided by a surface that lays the stickers out as a grid: only there does a cell need a name
		// of its own. The pack popup of a sticker message provides nothing.
		buildStickerLabel: { default: null },
	},
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
	emits: ['clickSticker', 'openContextMenuSticker', 'stickerKeydown'],
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
		// The label provider doubles as the grid gate: with it the stickers are laid out as real rows, and
		// StickerItem reads the same label to become a gridcell.
		isGridContext(): boolean
		{
			return this.buildStickerLabel !== null;
		},
		rows(): GridCellItem[][]
		{
			const cells: GridCellItem[] = this.stickers.map((sticker: ImModelSticker, index: number) => {
				return {
					type: 'sticker',
					key: this.getStickerUniqueKey(sticker),
					sticker,
					label: this.getStickerLabel(index),
				};
			});

			if (this.canAddStickers)
			{
				cells.push({ type: 'add', key: 'add-sticker-button' });
			}

			const rows: GridCellItem[][] = [];
			for (let index = 0; index < cells.length; index += COLUMNS)
			{
				rows.push(cells.slice(index, index + COLUMNS));
			}

			return rows;
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
		getStickerLabel(index: number): string
		{
			if (this.buildStickerLabel === null)
			{
				return '';
			}

			return this.buildStickerLabel(this.pack.name, index + 1);
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
		// Keyboard activation goes through the very same event: the surface around the grid decides what
		// picking a sticker means - sending it from the emote popup, opening its menu from a message.
		onClickSticker(event: PointerEvent | KeyboardEvent, sticker: ImModelSticker)
		{
			this.$emit('clickSticker', { event, sticker });
		},
		// The raw key press, for the same reason: which combination opens the menu of a sticker is known to
		// the surface that owns that menu, not to the grid.
		onStickerKeydown(event: KeyboardEvent, sticker: ImModelSticker)
		{
			this.$emit('stickerKeydown', { event, sticker });
		},
		cancelLongPressTracking()
		{
			StickerPreviewManager.getInstance().cancelLongPressTracking();
		},
	},
	template: `
		<div class="bx-im-pack-stickers__container" data-testid="im-sticker-pack-stickers">
			<template v-if="isGridContext">
				<div
					v-for="(row, rowIndex) in rows"
					:key="rowIndex"
					class="bx-im-pack-stickers__row"
					role="row"
				>
					<template v-for="cell in row" :key="cell.key">
						<StickerItem
							v-if="cell.type === 'sticker'"
							:sticker="cell.sticker"
							:label="cell.label"
							@click="onClickSticker($event, cell.sticker)"
							@mousedown="onMouseDown($event, cell.sticker)"
							@keydown="onStickerKeydown($event, cell.sticker)"
							@contextmenu.prevent="$emit('openContextMenuSticker', { event: $event, sticker: cell.sticker })"
						/>
						<AddStickerButton v-else :pack="pack" />
					</template>
				</div>
			</template>
			<template v-else>
				<StickerItem
					v-for="sticker in stickers"
					:key="getStickerUniqueKey(sticker)"
					:sticker="sticker"
					@click="onClickSticker($event, sticker)"
					@mousedown="onMouseDown($event, sticker)"
					@contextmenu.prevent="$emit('openContextMenuSticker', { event: $event, sticker })"
				/>
				<AddStickerButton v-if="canAddStickers" :pack="pack" />
			</template>
			<StickerPreview
				v-if="previewSticker"
				:sticker="previewSticker"
				@close="cancelLongPressTracking"
			/>
		</div>
	`,
};
