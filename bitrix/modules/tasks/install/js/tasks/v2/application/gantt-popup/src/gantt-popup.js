import type { PopupOptions } from 'main.popup';
import { Popup } from 'ui.vue3.components.popup';
import { GanttPopupContent } from './gantt-popup-content';

// @vue/component
export const GanttPopup = {
	name: 'TaskGanttPopup',
	components: {
		Popup,
		GanttPopupContent,
	},
	inject: {
		taskId: {},
	},
	props: {
		bindElement: {
			type: HTMLElement,
			required: true,
		},
	},
	emits: ['close'],
	computed: {
		options(): PopupOptions
		{
			return {
				className: 'tasks-field-gantt-popup-container',
				bindElement: this.bindElement,
				padding: 14,
				width: 470,
				targetContainer: document.body,
			};
		},
	},
	template: `
		<Popup
			v-slot="{ freeze, unfreeze }"
			:options
			@close="$emit('close')"
		>
			<GanttPopupContent
				:taskId
				:close="() => $emit('close')"
				:freeze
				:unfreeze
			/>
		</Popup>
	`,
};
