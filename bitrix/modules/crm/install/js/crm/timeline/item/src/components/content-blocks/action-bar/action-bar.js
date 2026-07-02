import { Type } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';
import { Chip, ChipDesign } from 'ui.system.chip.vue';

import { Action } from '../../../action';

// @vue/component
export default {
	components: {
		Chip,
	},
	props: {
		title: {
			type: String,
			default: '',
		},
		items: {
			type: Object,
			required: true,
		},
	},

	computed: {
		titleClassName(): Array
		{
			return [
				'crm-timeline__action-bar-title',
				{
					'--hidden': !Type.isStringFilled(this.title),
				},
			];
		},
	},

	methods: {
		getContainer(): HTMLElement
		{
			return this.$refs.actionBarContainer;
		},

		getIconByDesign(design: string): ?string
		{
			if (design === ChipDesign.OutlineCopilot)
			{
				return Outline.COPILOT;
			}

			return null;
		},

		executeAction(actionData: Object | null): void
		{
			if (Type.isObject(actionData))
			{
				void (new Action(actionData)).execute(this);
			}
		},
	},

	// language=Vue
	template: `
		<div 
			class="crm-timeline__action-bar-container"
			ref="actionBarContainer"
		>
			<div :class="titleClassName">{{ title }}</div>
			<div 
				class="crm-timeline__action-bar-item"
				v-for="(item, index) in items"
				:key="index"
			>
				<Chip
					:size="item.size"
					:design="item.design"
					:text="item.text"
					:rounded="item.rounded"
					:dropdown="item.dropdown"
					:lock="item.lock"
					:icon="getIconByDesign(item.design)"
					@click="executeAction(item.action)"
				/>
			</div>
		</div>
	`,
};
