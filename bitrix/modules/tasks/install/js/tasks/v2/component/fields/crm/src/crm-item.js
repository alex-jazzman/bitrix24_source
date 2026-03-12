import { Runtime } from 'main.core';
import { RichLoc } from 'ui.vue3.components.rich-loc';
import { TextMd } from 'ui.system.typography.vue';

import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { CrmMappers } from 'tasks.v2.provider.service.crm-service';
import type { CrmItemModel } from 'tasks.v2.model.crm-items';
import type { TaskModel } from 'tasks.v2.model.tasks';

import './crm.css';

// @vue/component
export const CrmItem = {
	components: {
		HoverPill,
		TextMd,
		RichLoc,
	},
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
	},
	props: {
		/** @type CrmItemModel */
		item: {
			type: Object,
			required: true,
		},
	},
	emits: ['clear'],
	setup(): { task: TaskModel } {},
	async mounted(): Promise<void>
	{
		const { EntityMiniCard } = await Runtime.loadExtension('crm.mini-card');

		const card = new EntityMiniCard({
			bindElement: this.$el,
			entityTypeId: CrmMappers.getEntityTypeId(this.item.id),
			entityId: this.item.entityId,
		});

		const scrollContainer = document.querySelector(`[data-task-card-scroll="${this.taskId}"]`);
		card.getMiniCard().popup().setTargetContainer(scrollContainer);
	},
	methods: {
		prepareTitle(item: CrmItemModel): string
		{
			return this.loc('TASKS_V2_CRM_ENTITY_TITLE', {
				'#TYPE_NAME#': item.typeName,
				'#TITLE#': item.title,
			});
		},
		handleClick(): void
		{
			BX.SidePanel.Instance.emulateAnchorClick(this.item.link);
		},
	},
	template: `
		<HoverPill
			class="tasks-field-crm-item"
			:withClear="!isEdit || task.rights.edit"
			textOnly
			@click.stop="handleClick"
			@clear="$emit('clear', item.id)"
		>
			<TextMd class="tasks-field-crm-item-text print-font-color-base-1-recursive">
				<RichLoc tag="span" :text="prepareTitle(item)" placeholder="[a]">
					<template #a="{ text }">
						<a @click.prevent>{{ text }}</a>
					</template>
				</RichLoc>
			</TextMd>
		</HoverPill>
	`,
};
