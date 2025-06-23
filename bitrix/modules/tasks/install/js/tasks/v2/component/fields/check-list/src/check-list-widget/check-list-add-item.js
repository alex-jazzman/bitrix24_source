import { BIcon } from 'ui.icon-set.api.vue';
import { Outline } from 'ui.icon-set.api.core';

import { CheckListItemMixin } from './check-list-item-mixin';

// @vue/component
export const CheckListAddItem = {
	name: 'CheckListAddItem',
	components: {
		BIcon,
	},
	mixins: [CheckListItemMixin],
	emits: ['addItem'],
	setup(): Object
	{
		return {
			Outline,
		};
	},
	template: `
		<div
			class="check-list-widget-add-item"
			@click="addItem"
		>
			<div class="check-list-widget-add-item-icon">
				<BIcon :name="Outline.PLUS_L"/>
			</div>
			<div class="check-list-widget-add-item-title">
				{{ loc('TASKS_V2_CHECK_LIST_ITEM_ADD_BTN') }}
			</div>
		</div>
	`,
};
