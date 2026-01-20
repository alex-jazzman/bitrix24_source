import { Runtime } from 'main.core';
import { RichLoc } from 'ui.vue3.components.rich-loc';
import { TextMd } from 'ui.system.typography.vue';
import { BMenu, type MenuItemOptions, type MenuOptions } from 'ui.system.menu.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
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
		BMenu,
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
	emits: ['edit', 'clear'],
	setup(): { task: TaskModel } {},
	data(): Object
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		isLocked(): boolean
		{
			return !Core.getParams().restrictions.crmIntegration.available;
		},
		readonly(): boolean
		{
			return !this.task.rights.edit;
		},
		menuOptions(): MenuOptions
		{
			return {
				id: `tasks-crm-menu-${this.item.id}`,
				bindElement: this.$refs.pill.$el,
				offsetTop: 8,
				items: this.menuItems,
				targetContainer: document.body,
			};
		},
		menuItems(): MenuItemOptions[]
		{
			return [
				{
					title: this.loc('TASKS_V2_CRM_OPEN'),
					icon: Outline.GO_TO_L,
					dataset: {
						id: 'tasks-crm-menu-open',
					},
					onClick: () => BX.SidePanel.Instance.emulateAnchorClick(this.item.link),
				},
				{
					title: this.loc('TASKS_V2_CRM_EDIT'),
					icon: Outline.EDIT_L,
					dataset: {
						id: 'tasks-crm-menu-edit',
					},
					isLocked: this.isLocked,
					onClick: () => this.$emit('edit'),
				},
				{
					title: this.loc('TASKS_V2_CRM_UNLINK'),
					icon: Outline.CROSS_L,
					dataset: {
						id: 'tasks-crm-menu-unlink',
					},
					onClick: this.clear,
				},
			];
		},
	},
	async mounted(): Promise<void>
	{
		const { EntityMiniCard } = await Runtime.loadExtension('crm.mini-card');

		const card = new EntityMiniCard({
			bindElement: this.$refs.pill.$el,
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
			if (!this.isEdit)
			{
				BX.SidePanel.Instance.emulateAnchorClick(this.item.link);

				return;
			}

			if (this.readonly)
			{
				return;
			}

			this.isMenuShown = true;
		},
		clear(): void
		{
			this.$emit('clear', this.item.id);
		},
	},
	template: `
		<div class="tasks-field-crm-item-container">
			<HoverPill
				class="tasks-field-crm-item"
				:withClear="!isEdit"
				textOnly
				:readonly
				:active="isMenuShown"
				ref="pill"
				@click.stop="handleClick"
				@clear="clear"
			>
				<TextMd class="tasks-field-crm-item-text">
					<RichLoc tag="span" :text="prepareTitle(item)" placeholder="[a]">
						<template #a="{ text }">
							<a @click.prevent>{{ text }}</a>
						</template>
					</RichLoc>
				</TextMd>
			</HoverPill>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
	`,
};
