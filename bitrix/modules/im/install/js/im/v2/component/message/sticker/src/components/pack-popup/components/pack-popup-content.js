import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { Button as UiButton, ButtonSize, AirButtonStyle } from 'ui.vue3.components.button';

import { Spinner, SpinnerColor, SpinnerSize } from 'im.v2.component.elements.loader';
import { StickerPackMenu, StickerMenu, BaseMenu } from 'im.v2.lib.menu';
import { StickerService } from 'im.v2.provider.service.sticker';
import { StickerPackForm, PackStickers } from 'im.v2.component.sticker';
import { Notifier } from 'im.v2.lib.notifier';
import { Analytics } from 'im.v2.lib.analytics';

import { PackPopupHeader } from './pack-popup-header';

import type { JsonObject } from 'main.core';
import type { ImModelSticker, ImModelStickerPack } from 'im.v2.model';

// @vue/component
export const PackPopupContent = {
	name: 'PackPopupContent',
	components: { UiButton, BIcon, Spinner, StickerPackForm, PackStickers, PackPopupHeader },
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
		ButtonSize: () => ButtonSize,
		SpinnerColor: () => SpinnerColor,
		SpinnerSize: () => SpinnerSize,
		OutlineIcons: () => OutlineIcons,
		AirButtonStyle: () => AirButtonStyle,
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
			Analytics.getInstance().stickers.onLinkPackFromPopup(this.dialogId);
			this.$emit('close');
		},
		showPackMenu(event: PointerEvent)
		{
			if (!this.packMenu)
			{
				this.packMenu = new StickerPackMenu();
				this.packMenu.subscribe(StickerPackMenu.events.showPackForm, () => {
					this.showPackForm = true;
				});
				this.packMenu.subscribe(StickerPackMenu.events.closeParentPopup, () => {
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
				this.stickerMenu.subscribe(BaseMenu.events.close, () => {
					this.enableAutoHide();
				});
				this.stickerMenu.subscribe(StickerMenu.events.closeParentPopup, () => {
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
			<PackPopupHeader 
				:isLoading="isLoading" 
				:packId="packId" 
				:packType="packType" 
				@showPackMenu="showPackMenu" 
				@close="$emit('close')"
			/>
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
