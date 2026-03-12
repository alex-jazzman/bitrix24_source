import { PopupManager } from 'main.popup';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { StickerPackForm, PackStickers } from 'im.v2.component.sticker';
import { StickerMenu, StickerPackMenu, BaseMenu } from 'im.v2.lib.menu';
import { StickerManager } from 'im.v2.lib.sticker';
import { SendingService } from 'im.v2.provider.service.sending';
import { Color, PopupType, StickerPackType } from 'im.v2.const';

import '../css/pack.css';

import type { JsonObject } from 'main.core';
import type { ImModelSticker, ImModelStickerPack } from 'im.v2.model';

const ICON_SIZE = 24;

// @vue/component
export const Pack = {
	name: 'StickerPack',
	components: { BIcon, StickerPackForm, PackStickers },
	inject: ['disableAutoHide', 'enableAutoHide'],
	props: {
		pack: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	emits: ['close'],
	data(): JsonObject
	{
		return {
			showPackForm: false,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		Color: () => Color,
		ICON_SIZE: () => ICON_SIZE,
		canShowContextMenu(): boolean
		{
			return this.packItem.type === StickerPackType.custom || this.isRecentPack;
		},
		isRecentPack(): boolean
		{
			return StickerManager.isRecentPack(this.packItem);
		},
		packItem(): ImModelStickerPack
		{
			return this.pack;
		},
	},
	methods: {
		onStickerClick({ sticker }: { sticker: ImModelSticker })
		{
			void SendingService.getInstance().sendMessageWithSticker({
				dialogId: this.dialogId,
				stickerParams: {
					id: sticker.id,
					packId: sticker.packId,
					packType: sticker.packType,
				},
			});
			this.$emit('close');
		},
		openPackMenu(event: PointerEvent)
		{
			PopupManager.getPopupById(PopupType.stickerContextMenu)?.close();
			PopupManager.getPopupById(PopupType.stickerPackContextMenu)?.close();
			if (!this.stickerPackMenu)
			{
				this.stickerPackMenu = new StickerPackMenu();
				this.stickerPackMenu.subscribe(BaseMenu.events.close, () => {
					if (!this.showPackForm)
					{
						this.enableAutoHide();
					}
				});
				this.stickerPackMenu.subscribe(StickerPackMenu.events.closeParentPopup, () => {
					this.$emit('close');
				});
				this.stickerPackMenu.subscribe(StickerPackMenu.events.showPackForm, () => {
					this.showPackForm = true;
				});
			}

			this.disableAutoHide();

			this.stickerPackMenu.openMenu({
				pack: this.packItem,
				isRecent: this.isRecentPack,
				dialogId: this.dialogId,
			}, event.target);
		},
		openStickerMenu({ event, sticker }: { event: PointerEvent, sticker: ImModelSticker })
		{
			PopupManager.getPopupById(PopupType.stickerContextMenu)?.close();
			if (!this.stickerMenu)
			{
				this.stickerMenu = new StickerMenu();
				this.stickerMenu.subscribe(StickerMenu.events.closeParentPopup, () => {
					this.$emit('close');
				});
				this.stickerMenu.subscribe(BaseMenu.events.close, () => {
					this.enableAutoHide();
				});
			}

			this.disableAutoHide();

			this.stickerMenu.openMenu({
				sticker,
				isRecent: this.isRecentPack,
				dialogId: this.dialogId,
			}, event.target);
		},
		onStickerPackFormClose()
		{
			this.enableAutoHide();
			this.showPackForm = false;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-sticker-pack__container">
			<div class="bx-im-sticker-pack__header">
				<div class="bx-im-sticker-pack__header-title --ellipsis">
					{{ packItem.name }}	
				</div>
				<BIcon
					v-if="canShowContextMenu"
					:name="OutlineIcons.MORE_M"
					:size="ICON_SIZE"
					:color="Color.gray40"
					:hoverable="true"
					class="bx-im-sticker-pack__header-actions"
					@click="openPackMenu"
				/>
			</div>
			<PackStickers 
				:pack="packItem"
				class="bx-im-sticker-pack__stickers"
				@clickSticker="onStickerClick"
				@openContextMenuSticker="openStickerMenu"
			/>
			<StickerPackForm v-if="showPackForm" :pack="packItem" @close="onStickerPackFormClose" />
		</div>
	`,
};
