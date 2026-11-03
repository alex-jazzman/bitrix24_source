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
	data(): Object
	{
		return {
			popupId: `tasks-hint-${Text.getRandom(10)}`,
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
				className: 'tasks-hint-popup',
				// main.popup leaves closeByEsc off by default and picks focusTrap by
				// environment, so a hint pins both here. Esc closes only the topmost popup
				// by z-index, so an open card underneath survives. Interactive hints
				// override focusTrap through `options`, hence both keys sit above the spread.
				closeByEsc: true,
				focusTrap: false,
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
