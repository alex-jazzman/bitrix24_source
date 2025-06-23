import type { PopupOptions } from 'main.popup';
import { Popup } from 'ui.vue3.components.popup';

import { StatusPopupContent } from './status-popup-content';
import './status-popup.css';

// @vue/component
export const StatusPopup = {
	components: {
		Popup,
		StatusPopupContent,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		bindElement: {
			type: HTMLElement,
			required: true,
		},
	},
	computed: {
		popupId(): string
		{
			return 'tasks-field-status-popup';
		},
		popupOptions(): PopupOptions
		{
			return {
				bindElement: this.bindElement,
				minWidth: 200,
				offsetTop: 10,
				offsetLeft: this.bindElement.offsetWidth / 2,
				background: 'var(--ui-color-bg-content-inapp)',
				padding: 13,
				angle: true,
				targetContainer: document.body,
			};
		},
	},
	template: `
		<Popup
			:id="popupId"
			:options="popupOptions"
		>
			<StatusPopupContent :taskId="taskId"/>
		</Popup>
	`,
};
