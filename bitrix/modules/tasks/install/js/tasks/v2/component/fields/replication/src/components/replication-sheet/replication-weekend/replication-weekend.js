import { RichLoc } from 'ui.vue3.components.rich-loc';
import { TextMd } from 'ui.system.typography.vue';
import { BMenu, type MenuOptions, type MenuItemOptions } from 'ui.system.menu.vue';

import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import type { TaskReplicateParams } from 'tasks.v2.model.tasks';

// @vue/component
export const ReplicationWeekend = {
	name: 'ReplicationWeekend',
	components: {
		RichLoc,
		TextMd,
		BMenu,
		HoverPill,
	},
	inject: {
		replicateParams: {},
	},
	emits: ['update'],
	data(): Object
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		workdayOnly: {
			get(): string
			{
				return this.replicateParams.workdayOnly;
			},
			set(value: string): void
			{
				this.update({ workdayOnly: value });
			},
		},
		item(): Object
		{
			return this.weekendAttitudeItems.find((item) => item.id === this.workdayOnly);
		},
		weekendAttitudeItems(): MenuItemOptions[]
		{
			const items = [
				{
					id: 'N',
					value: this.loc('TASKS_V2_REPLICATION_WEEKEND_CREATE'),
				},
				{
					id: 'Y',
					value: this.loc('TASKS_V2_REPLICATION_WEEKEND_NOT_CREATE'),
				},
			];

			return items.map((option) => ({
				id: option.id,
				title: option.value,
				isSelected: option.id === this.workdayOnly,
				onClick: (): void => {
					this.workdayOnly = option.id;
				},
			}));
		},
		options(): MenuOptions
		{
			return {
				id: 'weekend-attitude-replicant-popup',
				bindElement: this.$refs.skipWeekends.$el,
				items: this.weekendAttitudeItems,
				offsetTop: 5,
				targetContainer: document.body,
			};
		},
	},
	beforeMount(): void
	{
		if (!this.replicateParams.workdayOnly)
		{
			this.workdayOnly = 'N';
		}
	},
	methods: {
		update({ workdayOnly }: Pick<TaskReplicateParams, 'workdayOnly'>): void
		{
			this.$emit('update', { workdayOnly });
		},
	},
	template: `
		<TextMd tag="div" className="tasks-field-replication-section">
			<RichLoc
				class="tasks-field-replication-row tasks-field-replication-secondary"
				:text="loc('TASKS_V2_REPLICATION_ON_WEEKEND_DO')"
				placeholder="[do/]"
			>
				<template #do>
					<HoverPill textOnly noOffset ref="skipWeekends" @click="isMenuShown = true">
						<span class="tasks-field-replication-link">{{ item?.title || '' }}</span>
					</HoverPill>
					<BMenu v-if="isMenuShown" :options @close="isMenuShown = false"/>
				</template>
			</RichLoc>
		</TextMd>
	`,
};
