import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import type { AppChip } from 'tasks.v2.application.task-card';

import './chips.css';

const maxVisible = 50;

// @vue/component
export const Chips = {
	components: {
		Chip,
	},
	props: {
		/** @type AppChip[] */
		chips: {
			type: Array,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			Outline,
			ChipDesign,
		};
	},
	data(): Object
	{
		return {
			chipsCollapsed: true,
		};
	},
	computed: {
		preparedChips(): AppChip[]
		{
			return this.chips.filter(({ isEnabled }) => isEnabled ?? true).map((chip, index) => ({
				...chip,
				collapsed: index >= maxVisible,
			}));
		},
		hasCollapsedChips(): boolean
		{
			return this.preparedChips.some(({ collapsed }) => collapsed);
		},
	},
	template: `
		<div class="tasks-full-card-chips">
			<template v-for="(chip, key) of preparedChips" :key>
				<component
					v-if="!chip.collapsed || !chipsCollapsed"
					:is="chip.component"
					v-bind="chip.props ?? {}"
					v-on="chip.events ?? {}"
				/>
			</template>
			<Chip
				v-if="hasCollapsedChips"
				:design="ChipDesign.ShadowNoAccent"
				:icon="chipsCollapsed ? Outline.APPS : Outline.CHEVRON_TOP_L"
				:text="chipsCollapsed ? loc('TASKS_V2_TASK_FULL_CARD_MORE') : ''"
				@click="chipsCollapsed = !chipsCollapsed"
			/>
		</div>
	`,
};
