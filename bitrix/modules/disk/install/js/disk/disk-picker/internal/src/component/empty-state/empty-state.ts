import { BIcon } from 'ui.icon-set.api.vue';
import { TextSm } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';

import './empty-state.css';

// A centered icon, a message and an optional action. Shared by the four content
// states of the browser (empty folder, nothing found, no items, load error). It
// carries no domain knowledge: the browser picks the icon, text and action.
export const EmptyState = defineComponent({
	name: 'DiskPickerEmptyState',
	components: {
		BIcon,
		TextSm,
	},
	props: {
		icon: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		actionLabel: {
			type: String,
			default: '',
		},
		testId: {
			type: String,
			default: 'universal-disk-picker-empty-state',
		},
		actionTestId: {
			type: String,
			default: 'universal-disk-picker-empty-action',
		},
	},
	emits: ['action'],
	template: `
		<div class="disk-picker-empty-state" :data-testid="testId">
			<BIcon :name="icon" :size="48" class="disk-picker-empty-state__icon"/>
			<TextSm class="disk-picker-empty-state__title">{{ title }}</TextSm>
			<button
				v-if="actionLabel"
				type="button"
				class="disk-picker-empty-state__action"
				:data-testid="actionTestId"
				@click="$emit('action')"
			>
				{{ actionLabel }}
			</button>
		</div>
	`,
});
