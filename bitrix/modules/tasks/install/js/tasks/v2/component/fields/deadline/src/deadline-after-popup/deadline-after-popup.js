import type { PopupOptions } from 'main.popup';

import { Popup } from 'ui.vue3.components.popup';

import { DeadlineAfterPopupContent } from './deadline-after-popup-content';

// @vue/component
export const DeadlineAfterPopup = {
	components: {
		Popup,
		DeadlineAfterPopupContent,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		deadlineAfter: {
			type: [Number, null],
			required: true,
		},
		bindElement: {
			type: HTMLElement,
			required: true,
		},
	},
	emits: ['update:deadlineAfter', 'close'],
	computed: {
		options(): PopupOptions
		{
			return {
				id: `tasks-field-deadline-after-popup-${this.taskId}`,
				bindElement: this.bindElement,
				width: 300,
				padding: 24,
				offsetTop: 5,
				targetContainer: document.body,
			};
		},
	},
	methods: {
		handleUpdate(dateTs: number): void
		{
			this.$emit('update:deadlineAfter', dateTs);
		},
	},
	template: `
		<Popup
			v-slot="{ freeze, unfreeze }"
			:options
			@close="$emit('close')"
		>
			<DeadlineAfterPopupContent :taskId :freeze :unfreeze @update="handleUpdate" @close="$emit('close')"/>
		</Popup>
	`,
};
