import { BIcon } from 'ui.icon-set.api.vue';
import { TextSm } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import './empty-state.css';

// A centered mark, a message and an optional action. Shared by the four content
// states of the browser (empty folder, nothing found, no items, load error). It
// carries no domain knowledge: the browser picks the mark, text and action.
//
// The mark is either a glyph from the icon set or, where the design asks for one, a
// module asset named by `graphic`; the artwork itself lives in empty-state.css.
export const EmptyState = defineComponent({
	name: 'DiskPickerEmptyState',
	components: {
		BIcon,
		TextSm,
		UiButton,
	},
	setup(): Object
	{
		return { AirButtonStyle, ButtonSize };
	},
	props: {
		icon: {
			type: String,
			required: true,
		},
		graphic: {
			type: String,
			default: '',
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
			<span
				v-if="graphic"
				class="disk-picker-empty-state__graphic"
				:class="'--' + graphic"
				aria-hidden="true"
			></span>
			<BIcon v-else :name="icon" :size="48" class="disk-picker-empty-state__icon"/>
			<TextSm class="disk-picker-empty-state__title">{{ title }}</TextSm>
			<UiButton
				v-if="actionLabel"
				class="disk-picker-empty-state__action"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.OUTLINE_ACCENT_2"
				:text="actionLabel"
				:dataset="{ testid: actionTestId }"
				@click="$emit('action')"
			/>
		</div>
	`,
});
