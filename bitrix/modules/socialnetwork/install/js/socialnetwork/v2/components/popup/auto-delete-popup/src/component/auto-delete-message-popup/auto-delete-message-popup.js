import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

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
		UiButton,
		UiPopup,
	},
	props: {
		delay: {
			type: Number,
			default: AutoDeleteMessageDelay.Off,
		},
	},
	emits: ['close', 'change'],
	setup(): Object
	{
		return { AirButtonStyle, ButtonSize };
	},
	data(): { selectedDelay: number }
	{
		return {
			selectedDelay: this.delay,
		};
	},
	computed: {
		popupId(): string
		{
			return 'socialnetwork--auto-delete-message-popup';
		},
		options(): UiPopupOptions
		{
			return {
				titleBar: this.loc('SONET_AUTO_DELETE_MESSAGE_POPUP_TITLE'),
				height: 390,
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
				selected: value === this.selectedDelay,
			}));
		},
	},
	methods: {
		handleSelect(value: number): void
		{
			this.selectedDelay = value;
		},
		handleApply(): void
		{
			this.$emit('change', this.selectedDelay);
			this.$emit('close');
		},
	},
	template: `
		<UiPopup :id="popupId" :options @close="$emit('close')">
			<div class="socialnetwork--auto-delete-message-popup__container">
				<div class="socialnetwork--auto-delete-message-popup__info">
					{{ this.loc('SONET_AUTO_DELETE_MESSAGE_POPUP_INFO_MSGVER_1') }}
				</div>
				<RadioGroupFieldset :items="items" :ariaLabel="loc('SONET_AUTO_DELETE_MESSAGE_POPUP_TITLE')" @change="handleSelect"/>
				<div class="socialnetwork--auto-delete-message-popup__footer">
					<UiButton
						:text="loc('SONET_AUTO_DELETE_MESSAGE_POPUP_APPLY')"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.FILLED"
						data-testid="auto-delete-popup-apply"
						@click="handleApply"
					/>
				</div>
			</div>
		</UiPopup>
	`,
};
