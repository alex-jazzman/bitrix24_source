import { Runtime } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { TextMd, TextXs } from 'ui.system.typography.vue';

import { PlacementType } from 'tasks.v2.const';

import './placements-list-item.css';

// @vue/component
export const PlacementsListItem = {
	name: 'PlacementsListItem',
	components: {
		BIcon,
		TextMd,
		TextXs,
	},
	inject: {
		taskId: {},
	},
	props: {
		/** @type PlacementModel */
		placement: {
			type: Object,
			required: true,
		},
	},
	setup(): void
	{
		return {
			Outline,
		};
	},
	computed: {
		isDrawerPlacement(): boolean
		{
			return this.placement.type === PlacementType.taskViewDrawer;
		},
	},
	methods: {
		async onPlacementClick(): Promise<void>
		{
			if (this.isDrawerPlacement)
			{
				// TODO: Open application drawer
				return;
			}

			await this.openApplicationSlider();
		},
		async openApplicationSlider(): void
		{
			await Runtime.loadExtension('applayout');

			BX.rest.AppLayout.openApplication(
				this.placement.appId,
				{
					taskId: this.taskId,
				},
				{
					PLACEMENT: this.placement.type,
					PLACEMENT_ID: this.placement.id,
				},
			);
		},
	},
	template: `
		<div class="tasks-field-placement-item" @click="onPlacementClick">
			<div class="tasks-field-placement-item-header">
				<div class="tasks-field-placement-item-title-container">
					<BIcon :name="Outline.PRODUCT" class="tasks-field-placement-item-icon"/>
					<TextMd accent>{{ placement.title }}</TextMd>
				</div>
			</div>
			<TextXs
				v-if="placement.description"
				class="tasks-field-placement-item-description"
			>
				{{ placement.description }}
			</TextXs>
		</div>
	`,
};
