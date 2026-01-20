import { TextSm } from 'ui.system.typography.vue';
import { BLine } from 'ui.system.skeleton.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { AddButton } from 'tasks.v2.component.elements.add-button';
import { FieldAdd } from 'tasks.v2.component.elements.field-add';
import { crmService, CrmMappers } from 'tasks.v2.provider.service.crm-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { showLimit } from 'tasks.v2.lib.show-limit';
import type { CrmItemModel } from 'tasks.v2.model.crm-items';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { CrmItem } from './crm-item';
import { crmMeta } from './crm-meta';
import { crmDialog } from './crm-dialog';
import './crm.css';

const maxCount = 7;

// @vue/component
export const Crm = {
	components: {
		AddButton,
		TextSm,
		BLine,
		FieldAdd,
		CrmItem,
	},
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			Outline,
			crmMeta,
			maxCount,
		};
	},
	data(): Object
	{
		return {
			isDialogShown: false,
			isExpanded: false,
			isHovered: false,
		};
	},
	computed: {
		crmItems(): CrmItemModel[]
		{
			const items: CrmItemModel[] = this.$store.getters[`${Model.CrmItems}/getByIds`](this.task.crmItemIds);

			return items.sort((a, b) => CrmMappers.compareIds(a.id, b.id));
		},
		visibleItems(): CrmItemModel[]
		{
			return this.crmItems.slice(0, maxCount);
		},
		collapsedItems(): CrmItemModel[]
		{
			return this.crmItems.slice(maxCount);
		},
		isLoading(): boolean
		{
			return !this.isEmpty && !this.crmItems?.length;
		},
		isEmpty(): boolean
		{
			return !this.task.crmItemIds?.length;
		},
		readonly(): boolean
		{
			return !this.task.rights.edit;
		},
		expandButtonText(): string
		{
			if (this.isExpanded)
			{
				return this.loc('TASKS_V2_CRM_COLLAPSE');
			}

			return this.loc('TASKS_V2_CRM_AND_COUNT', {
				'#COUNT#': this.collapsedItems.length,
			});
		},
		isAddActive(): boolean
		{
			return !this.readonly && !this.isEmpty;
		},
		isAddVisible(): boolean
		{
			return this.isDialogShown || this.isHovered;
		},
		isLocked(): boolean
		{
			return !Core.getParams().restrictions.crmIntegration.available;
		},
	},
	mounted(): void
	{
		if (this.isEdit)
		{
			void crmService.list(this.taskId, this.task.crmItemIds);
		}
		else
		{
			crmDialog.init(this.taskId);
		}
	},
	methods: {
		handleClick(): void
		{
			if (!this.readonly)
			{
				this.showDialog();
			}
		},
		showDialog(): void
		{
			if (this.isLocked)
			{
				void showLimit({
					featureId: Core.getParams().restrictions.crmIntegration.featureId,
				});

				return;
			}

			crmDialog.show({
				targetNode: this.$refs.anchor,
				taskId: this.taskId,
				onClose: this.handleClose,
			});

			this.isDialogShown = true;
		},
		handleClose(): void
		{
			this.isDialogShown = false;
		},
		handleClear(crmItemId: string): void
		{
			const crmItemIds = this.task.crmItemIds.filter((id) => id !== crmItemId);

			void taskService.update(this.taskId, { crmItemIds });
		},
	},
	template: `
		<div
			@mouseenter="isHovered = true"
			@mouseleave="isHovered = false"
		>
			<AddButton 
				v-if="isAddActive"
				:isVisible="isAddVisible"
				:isLocked
				@click="handleClick"
			/>
			<div
				class="tasks-field-crm"
				:data-task-id="taskId"
				:data-task-field-id="crmMeta.id"
				:data-task-crm-item-ids="task.crmItemIds?.join(',')"
			>
				<FieldAdd 
					v-if="isEmpty"
					:icon="Outline.CRM"
					:isLocked
					@click="showDialog"
				/>
				<div v-if="isLoading" class="tasks-field-crm-skeleton">
					<template v-for="key in task.crmItemIds.slice(0, maxCount)" :key>
						<BLine :height="20"/>
					</template>
				</div>
				<template v-for="item in visibleItems" :key="item.id">
					<CrmItem :item @edit="showDialog" @clear="handleClear(item.id)"/>
				</template>
				<template v-if="isExpanded" v-for="item in collapsedItems" :key="item.id">
					<CrmItem :item @edit="showDialog" @clear="handleClear(item.id)"/>
				</template>
				<TextSm
					v-if="collapsedItems.length > 0"
					class="tasks-field-crm-expand"
					@click.capture.stop="isExpanded = !isExpanded"
				>
					{{ expandButtonText }}
				</TextSm>
			</div>
			<div class="tasks-field-crm-anchor" ref="anchor"/>
		</div>
	`,
};
