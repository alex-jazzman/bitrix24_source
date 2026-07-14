import { AutoDeleteMessageDelay } from 'socialnetwork.v2.const';
import { UiPopup, type UiPopupOptions } from 'socialnetwork.v2.components.elements.ui-popup';

import { RadioGroupFieldset } from '../radio-group-fieldset/radio-group-fieldset';
import { getAutoDeleteStatusText } from '../../lib';

import './auto-delete-message-popup.css';

// @vue/component
export const AutoDeleteMessagePopup = {
	name: 'AutoDeletePopup',
	components: {
		RadioGroupFieldset,
		UiPopup,
	},
	props: {
		delay: {
			type: Number,
			default: AutoDeleteMessageDelay.Off,
		},
	},
	emits: ['close', 'change'],
	computed: {
		popupId(): string
		{
			return 'socialnetwork--auto-delete-message-popup';
		},
		options(): UiPopupOptions
		{
			return {
				titleBar: this.loc('SONET_AUTO_DELETE_MESSAGE_POPUP_TITLE'),
				height: 350,
				width: 400,
				closeIcon: true,
				targetContainer: document.body,
				fixed: true,
				padding: 0,
				autoHide: true,
				overlay: true,
				contentPadding: 0,
				contentBackground: '#fff',
				className: 'socialnetwork--auto-delete-message-popup',
			};
		},
		items(): Array
		{
			return Object.values(AutoDeleteMessageDelay).map((value) => ({
				value,
				text: this.loc(getAutoDeleteStatusText(value)),
				selected: value === this.delay,
			}));
		},
	},
	methods: {
		onDelayChange(value: number): void
		{
			this.$emit('change', value);
			this.$emit('close');
		},
	},
	template: `
		<UiPopup :id="popupId" :options @close="$emit('close')">
			<div class="socialnetwork--auto-delete-message-popup__container">
				<div class="socialnetwork--auto-delete-message-popup__info">
					{{ this.loc('SONET_AUTO_DELETE_MESSAGE_POPUP_INFO_MSGVER_1') }}
				</div>
				<RadioGroupFieldset :items="items" @change="onDelayChange"/>
			</div>
		</UiPopup>
	`,
};
