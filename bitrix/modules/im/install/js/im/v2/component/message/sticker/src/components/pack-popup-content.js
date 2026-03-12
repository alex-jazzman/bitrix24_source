import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { Button as UiButton, ButtonSize, AirButtonStyle } from 'ui.vue3.components.button';

import { Core } from 'im.v2.application.core';
import { Shimmer, Spinner, SpinnerColor, SpinnerSize } from 'im.v2.component.elements.loader';
import { Color, PopupType, StickerPackType } from 'im.v2.const';
import { StickerPackMenu, StickerMenu } from 'im.v2.lib.menu';
import { StickerService } from 'im.v2.provider.service.sticker';
import { StickerPackForm, PackStickers } from 'im.v2.component.sticker';
import { Notifier } from 'im.v2.lib.notifier';

import '../css/components/pack-popup.css';

import type { JsonObject } from 'main.core';
import type { ImModelSticker, ImModelStickerPack } from 'im.v2.model';

const SHIMMER_WIDTH = 178;
const SHIMMER_HEIGHT = 12;

// @vue/component
export const PackPopupContent = {
	name: 'PackPopupContent',
	components: { UiButton, BIcon, Spinner, Shimmer, StickerPackForm, PackStickers },
	inject: ['disableAutoHide', 'enableAutoHide'],
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		packId: {
			type: Number,
			required: true,
		},
		packType: {
			type: String,
			required: true,
		},
	},
	emits: ['close'],
	data(): JsonObject
	{
		return {
			isLoading: false,
			isRequestSending: false,
			showPackForm: false,
		};
	},
	computed: {
		SHIMMER_WIDTH: () => SHIMMER_WIDTH,
		SHIMMER_HEIGHT: () => SHIMMER_HEIGHT,
		PopupType: () => PopupType,
		ButtonSize: () => ButtonSize,
		SpinnerColor: () => SpinnerColor,
		SpinnerSize: () => SpinnerSize,
		OutlineIcons: () => OutlineIcons,
		AirButtonStyle: () => AirButtonStyle,
		Color: () => Color,
		pack(): ?ImModelStickerPack
		{
			return this.$store.getters['stickers/packs/getByIdentifier']({ id: this.packId, type: this.packType });
		},
		buttonText(): string
		{
			if (this.pack.isAdded)
			{
				return this.loc('IM_MESSAGE_STICKER_PACK_ADDED');
			}

			return this.loc('IM_MESSAGE_STICKER_PACK_ADD');
		},
		buttonStyle(): $Values<typeof AirButtonStyle>
		{
			if (this.pack.isAdded)
			{
				return AirButtonStyle.PLAIN;
			}

			return AirButtonStyle.FILLED;
		},
		isPackOwner(): boolean
		{
			return this.pack.authorId === Core.getUserId();
		},
		canShowContextMenu(): boolean
		{
			if (this.isLoading)
			{
				return false;
			}

			if (!this.isPackOwner)
			{
				return false;
			}

			return this.pack.type === StickerPackType.custom;
		},
	},
	async created()
	{
		this.stickerService = StickerService.getInstance();
		this.isLoading = true;
		await this.stickerService.loadPack({
			id: this.packId,
			type: this.packType,
		});
		this.isLoading = false;
	},
	methods: {
		async linkStickerPack()
		{
			if (this.pack?.isAdded)
			{
				return;
			}

			this.isRequestSending = true;
			await this.stickerService.linkPack({ id: this.packId, type: this.packType });
			this.isRequestSending = false;
			Notifier.sticker.onLinkPackComplete();
			this.$emit('close');
		},
		showPackMenu(event: PointerEvent)
		{
			if (!this.packMenu)
			{
				this.packMenu = new StickerPackMenu();
				this.packMenu.subscribe('openEditor', () => {
					this.showPackForm = true;
				});
				this.packMenu.subscribe('closeParentPopup', () => {
					this.$emit('close');
				});
			}

			this.disableAutoHide();
			this.packMenu.openMenu({
				pack: this.pack,
				dialogId: this.dialogId,
				isRecent: false,
			}, event.target);
		},
		showStickerMenu({ event, sticker }: { event: PointerEvent, sticker: ImModelSticker })
		{
			if (!this.stickerMenu)
			{
				this.stickerMenu = new StickerMenu();
				this.stickerMenu.subscribe('close', () => {
					this.enableAutoHide();
				});
				this.stickerMenu.subscribe('closeParentPopup', () => {
					this.$emit('close');
				});
			}

			this.disableAutoHide();

			this.stickerMenu.openMenu({
				sticker,
				isRecent: false,
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
		<div class="bx-im-stickers-pack-popup__container">
			<div class="bx-im-stickers-pack-popup__header">
				<Shimmer v-if="isLoading" :width="SHIMMER_WIDTH" :height="SHIMMER_HEIGHT" />
				<div v-else class="bx-im-stickers-pack-popup__header-title --ellipsis">{{ pack.name }}</div>
				<div class="bx-im-stickers-pack-popup__header-controls">
					<BIcon
						v-if="canShowContextMenu"
						:name="OutlineIcons.MORE_M"
						:hoverable="true"
						class="bx-im-stickers-pack-popup__control-icon"
						@click="showPackMenu"
					/>
					<BIcon
						:name="OutlineIcons.CROSS_M"
						:hoverable="true"
						class="bx-im-stickers-pack-popup__control-icon"
						@click="$emit('close')"
					/>
				</div>
			</div>
			<PackStickers
				v-if="!isLoading"
				:pack="pack"
				:withAddButton="false"
				class="bx-im-stickers-pack-popup__sticker-list"
				@clickSticker="showStickerMenu"
				@openContextMenuSticker="showStickerMenu"
			/>
			<div v-else class="bx-im-stickers-pack-popup__loader">
				<Spinner
					:size="SpinnerSize.M"
					:color="SpinnerColor.mainPrimary"
				/>
			</div>
			<div 
				v-if="!isLoading"
				:class="{'--pack-added': pack.isAdded}"
				class="bx-im-stickers-pack-popup__footer"
			>
				<UiButton
					:size="ButtonSize.LARGE"
					:text="buttonText"
					:loading="isRequestSending"
					:style="buttonStyle"
					:left-icon="OutlineIcons.CHECK_L"
					@click="linkStickerPack"
				/>
			</div>
			<StickerPackForm v-if="showPackForm" :pack="pack" @close="onStickerPackFormClose" />
		</div>
	`,
};
