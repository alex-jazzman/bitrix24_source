import { type PopupOptions } from 'main.popup';

import { MessengerPopup } from 'im.v2.component.elements.popup';

import { SlashCommandPopupContent } from './slash-command-content';

import './css/slash-command-popup.css';

const POPUP_ID = 'im-slash-command-popup';

// @vue/component
export const SlashCommandPopup = {
	name: 'SlashCommandPopup',
	components: { MessengerPopup, SlashCommandPopupContent },
	props:
	{
		bindElement: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		query: {
			type: String,
			default: '',
		},
	},
	emits: ['close'],
	computed:
	{
		POPUP_ID: () => POPUP_ID,
		config(): PopupOptions
		{
			return {
				width: 426,
				padding: 0,
				bindElement: this.bindElement,
				offsetTop: 2,
				offsetLeft: 0,
				fixed: true,
				bindOptions: {
					position: 'top',
				},
				className: 'bx-im-slash-command-popup__scope',
			};
		},
	},
	template: `
		<MessengerPopup
			:config="config"
			@close="$emit('close');"
			:id="POPUP_ID"
			v-slot="{adjustPosition}"
		>
			<SlashCommandPopupContent
				data-testid="im-textarea-slash-command-popup"
				:dialogId="dialogId"
				:query="query"
				@close="$emit('close');"
				@adjustPosition="adjustPosition()"
			/>
		</MessengerPopup>
	`,
};
