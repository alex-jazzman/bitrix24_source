import { Text } from 'main.core';
import type { PopupOptions } from 'main.popup';

import { Popup } from 'ui.vue3.components.popup';
import type { HintParams } from 'ui.vue3.directives.hint';

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
		popupOptions(): PopupOptions
		{
			return {
				id: `tasks-hint-${Text.getRandom(10)}`,
				bindElement: this.bindElement,
				maxWidth: 320,
				offsetLeft: 40,
				background: 'var(--ui-color-bg-content-inapp)',
				padding: 13,
				angle: true,
				targetContainer: document.body,
				className: 'tasks-hint-popup',
				...this.options,
			};
		},
	},
	template: `
		<Popup :options="popupOptions" @close="$emit('close')">
			<div class="tasks-hint">
				<slot/>
			</div>
		</Popup>
	`,
};

export const tooltip = (params: HintParams): HintParams => ({
	timeout: 500,
	...params,
	popupOptions: {
		className: 'tasks-hint',
		darkMode: false,
		offsetTop: 2,
		background: 'var(--ui-color-bg-content-inapp)',
		padding: 6,
		angle: true,
		targetContainer: document.body,
		...params.popupOptions,
	},
});
