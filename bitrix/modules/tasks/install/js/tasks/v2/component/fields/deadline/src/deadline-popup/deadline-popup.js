import type { PopupOptions } from 'main.popup';
import { Popup } from 'ui.vue3.components.popup';

import { DeadlinePopupContent } from './deadline-popup-content';

// @vue/component
export const DeadlinePopup = {
	components: {
		Popup,
		DeadlinePopupContent,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		deadlineTs: {
			type: [Number, null],
			required: true,
		},
		bindElement: {
			type: HTMLElement,
			required: true,
		},
		coordinates: {
			type: Object,
			default: null,
		},
	},
	emits: ['update:deadlineTs', 'close'],
	computed: {
		options(): PopupOptions
		{
			const baseOptions = {
				id: `tasks-field-deadline-popup-${this.taskId}`,
				bindElement: this.bindElement,
				padding: 24,
				offsetTop: 5,
				offsetLeft: -100,
				targetContainer: document.body,
			};

			if (this.coordinates?.x)
			{
				const bindElementRect = this.bindElement.getBoundingClientRect();

				baseOptions.offsetLeft += this.coordinates.x - bindElementRect.left;
			}

			return baseOptions;
		},
	},
	methods: {
		handleUpdate(dateTs: number): void
		{
			this.$emit('update:deadlineTs', dateTs);
		},
	},
	template: `
		<Popup :options @close="$emit('close')">
			<DeadlinePopupContent :taskId @update="handleUpdate" @close="$emit('close')"/>
		</Popup>
	`,
};
