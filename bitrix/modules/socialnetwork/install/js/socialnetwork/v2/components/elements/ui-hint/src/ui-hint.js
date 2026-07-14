import { Text } from 'main.core';
import type { PopupOptions } from 'main.popup';

import { Popup } from 'ui.vue3.components.popup';
import type { HintParams } from 'ui.vue3.directives.hint';

import './ui-hint.css';

// @vue/component
export const UiHint = {
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
	data(): Object
	{
		return {
			popupId: `socialnetwork-hint-${Text.getRandom(10)}`,
		};
	},
	computed: {
		popupOptions(): PopupOptions
		{
			return {
				id: this.popupId,
				bindElement: this.bindElement,
				maxWidth: 320,
				offsetLeft: 40,
				background: 'var(--ui-color-bg-content-inapp)',
				padding: 13,
				angle: true,
				targetContainer: document.body,
				className: 'socialnetwork-hint-popup',
				...this.options,
			};
		},
	},
	template: `
		<Popup :options="popupOptions" @close="$emit('close')">
			<div class="socialnetwork-hint">
				<slot/>
			</div>
		</Popup>
	`,
};

export const tooltip = (params: HintParams): HintParams => ({
	timeout: 500,
	...params,
	popupOptions: {
		className: 'socialnetwork-hint',
		darkMode: false,
		offsetTop: 2,
		background: 'var(--ui-color-bg-content-inapp)',
		padding: 6,
		angle: true,
		targetContainer: document.body,
		...params.popupOptions,
	},
});
