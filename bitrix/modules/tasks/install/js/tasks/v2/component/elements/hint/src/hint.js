import type { PopupOptions } from 'main.popup';
import { Text } from 'main.core';

import { Popup } from 'ui.vue3.components.popup';
import 'ui.icon-set.outline';

import './hint.css';

// @vue/component
export const Hint = {
	components: {
		Popup,
	},
	props: {
		bindElement: {
			type: HTMLElement,
			required: true,
		},
		options: {
			/** @type PopupOptions */
			type: Object,
			default: () => ({}),
		},
	},
	emits: ['close'],
	computed: {
		popupId(): string
		{
			return `tasks-hint-${Text.getRandom(10)}`;
		},
		popupOptions(): PopupOptions
		{
			return {
				bindElement: this.bindElement,
				maxWidth: 320,
				offsetLeft: 40,
				background: 'var(--ui-color-bg-content-inapp)',
				padding: 13,
				angle: true,
				targetContainer: document.body,
				...this.options,
			};
		},
	},
	template: `
		<Popup
			:id="popupId"
			:options="popupOptions"
			@close="$emit('close')"
		>
			<div class="tasks-hint">
				<slot></slot>
			</div>
		</Popup>
	`,
};
