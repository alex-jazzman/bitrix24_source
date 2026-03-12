import { MessengerPopup } from 'im.v2.component.elements.popup';
import { PopupType } from 'im.v2.const';

import { PackPopupContent } from './pack-popup-content';

import type { PopupOptions } from 'main.popup';

// @vue/component
export const PackPopup = {
	name: 'StickerPackPopup',
	components: { MessengerPopup, PackPopupContent },
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
	computed: {
		PopupType: () => PopupType,
		popupConfig(): PopupOptions
		{
			return {
				width: 404,
				targetContainer: document.body,
				fixed: true,
				overlay: true,
				autoHide: true,
				padding: 0,
				contentPadding: 0,
				borderRadius: '20px',
				contentBorderRadius: '20px',
				className: 'bx-im-messenger__scope',
				background: 'transparent',
			};
		},
	},
	template: `
		<MessengerPopup
			:config="popupConfig"
			:id="PopupType.stickerPack"
			@close="$emit('close')"
		>
			<PackPopupContent 
				:dialogId="dialogId"
				:packId="packId"
				:packType="packType"
				@close="$emit('close')"
			/>
		</MessengerPopup>
	`,
};
