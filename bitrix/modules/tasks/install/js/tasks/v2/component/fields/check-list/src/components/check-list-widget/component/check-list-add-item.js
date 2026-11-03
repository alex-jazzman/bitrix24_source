import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

// @vue/component
export const CheckListAddItem = {
	name: 'CheckListAddItem',
	components: {
		BIcon,
	},
	props: {
		isPreview: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['addItem'],
	setup(): Object
	{
		return {
			Outline,
		};
	},
	template: `
		<button
			type="button"
			class="check-list-widget-add-item print-ignore"
			:class="{'--preview': isPreview}"
			data-testid="tasks-check-list-add-item-btn"
			@mousedown.prevent
			@click="$emit('addItem')"
		>
			<div class="check-list-widget-add-item-icon">
				<BIcon :name="Outline.PLUS_L" aria-hidden="true"/>
			</div>
			<div class="check-list-widget-add-item-title">{{ loc('TASKS_V2_CHECK_LIST_ITEM_ADD_BTN') }}</div>
		</button>
	`,
};
