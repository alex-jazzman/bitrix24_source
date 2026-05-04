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
		presetId: {
			type: [String, null],
			default: null,
		},
		bindElement: {
			type: HTMLElement,
			required: true,
		},
	},
	emits: ['update:deadlineAfter', 'update:presetId', 'close'],
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
		handleUpdate(preset: { id: string, duration: number }): void
		{
			this.$emit('update:deadlineAfter', preset.duration);
			this.$emit('update:presetId', preset.id);
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
