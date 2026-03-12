import { MessengerPopup } from 'im.v2.component.elements.popup';
import { PopupType, PromoId } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { PromoManager } from 'im.v2.lib.promo';

import './css/sticker-promo-popup.css';

import type { JsonObject } from 'main.core';
import type { PopupOptions } from 'main.popup';

const POPUP_ID = 'im-sticker-promo-popup';
const POPUP_CLASSNAME = 'bx-im-sticker-promo-popup__container';
const DELAY_OPEN = 1000;

// @vue/component
export const StickersPromoPopup = {
	name: 'StickersPromoPopup',
	components: { MessengerPopup },
	props: {
		bindElement: {
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
			isVisible: false,
		};
	},
	computed: {
		PopupType: () => PopupType,
		POPUP_ID: () => POPUP_ID,
		popupConfig(): PopupOptions
		{
			return {
				bindElement: this.bindElement,
				className: POPUP_CLASSNAME,
				width: 416,
				height: 122,
				padding: 12,
				overlay: false,
				offsetLeft: -300,
				autoHide: true,
				bindOptions: { position: 'bottom' },
				closeIcon: true,
				angle: {
					offset: 335,
					position: 'bottom',
				},
				animation: 'fading',
				events: {
					onPopupClose: () => {
						void PromoManager.getInstance().markAsWatched(PromoId.stickersAvailable);
						Analytics.getInstance().stickers.onViewPromoPopup(this.dialogId);
					},
				},
			};
		},
	},
	mounted()
	{
		this.timer = setTimeout(() => {
			this.isVisible = true;
		}, DELAY_OPEN);
	},
	beforeUnmount()
	{
		clearTimeout(this.timer);
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<MessengerPopup
			v-if="isVisible"
			:config="popupConfig"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<div class="bx-im-sticker-promo-popup__cover"></div>
			<div class="bx-im-sticker-promo-popup__info">
				<div class="bx-im-sticker-promo-popup__title">
					{{ loc('IM_TEXTAREA_EMOTE_POPUP_PROMO_TITLE') }}
				</div>
				<div class="bx-im-sticker-promo-popup__description">
					{{ loc('IM_TEXTAREA_EMOTE_POPUP_PROMO_DESCRIPTION') }}
				</div>
			</div>
		</MessengerPopup>
	`,
};
