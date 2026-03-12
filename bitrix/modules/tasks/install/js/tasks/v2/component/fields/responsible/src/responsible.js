import { Type } from 'main.core';

import { TextXs } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { Option } from 'tasks.v2.const';
import { Participants } from 'tasks.v2.component.elements.participants';
import { Hint } from 'tasks.v2.component.elements.hint';
import { ahaMoments } from 'tasks.v2.lib.aha-moments';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { analytics } from 'tasks.v2.lib.analytics';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { responsibleMeta } from './responsible-meta';
import { ForNewUserSwitcher } from './for-new-user-switcher/for-new-user-switcher';
import { NewUserLabel } from './new-user-label/new-user-label';
import './responsible.css';

// @vue/component
export const Responsible = {
	name: 'TaskResponsible',
	components: {
		Participants,
		BIcon,
		ForNewUserSwitcher,
		NewUserLabel,
		Hint,
		TextXs,
	},
	inject: {
		analytics: {},
		cardType: {},
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		isSingle: {
			type: Boolean,
			default: false,
		},
		avatarOnly: {
			type: Boolean,
			default: false,
		},
	},
	setup(): { Outline: typeof Outline }
	{
		return {
			Outline,
			responsibleMeta,
		};
	},
	data(): Object
	{
		return {
			isManyAhaShown: false,
		};
	},
	computed: {
		forNewUser: {
			get(): boolean
			{
				return this.task.isForNewUser;
			},
			set(isForNewUser: boolean): void
			{
				void taskService.update(this.taskId, {
					isForNewUser,
					responsibleIds: isForNewUser ? [0] : [this.currentUserId],
				});
			},
		},
		currentUserId(): number
		{
			return Core.getParams().currentUser.id;
		},
		task(): TaskModel
		{
			return taskService.getStoreTask(this.taskId);
		},
		isEdit(): boolean
		{
			return idUtils.isReal(this.taskId);
		},
		isTemplate(): boolean
		{
			return idUtils.isTemplate(this.taskId);
		},
		isFlowFilledOnAdd(): boolean
		{
			return this.task.flowId > 0 && !this.isEdit;
		},
		single(): boolean
		{
			return this.isSingle || (!this.isTemplate && this.isEdit);
		},
		dataset(): Object
		{
			return {
				'data-task-id': this.taskId,
				'data-task-field-id': responsibleMeta.id,
				'data-task-field-value': this.task.responsibleIds[0],
			};
		},
		isAdmin(): boolean
		{
			return Core.getParams().rights.user.admin;
		},
	},
	methods: {
		updateTask(responsibleIds: number[]): void
		{
			if (responsibleIds.length === 0)
			{
				responsibleIds.push(this.task.responsibleIds[0]);
			}

			const currentIds = new Set(this.task.responsibleIds);

			void taskService.update(this.taskId, { responsibleIds });

			if (responsibleIds.some((id) => !currentIds.has(id)))
			{
				analytics.sendAssigneeChange(this.analytics, {
					cardType: this.cardType,
					taskId: Type.isNumber(this.taskId) ? this.taskId : 0,
					viewersCount: this.task.auditorsIds?.length ?? 0,
					coexecutorsCount: this.task.accomplicesIds?.length ?? 0,
				});
			}

			if (responsibleIds.length > 1)
			{
				this.showManyAha();
			}
		},
		handleHintClick(): void
		{
			void taskService.update(this.taskId, { creatorId: this.currentUserId });
		},
		showManyAha(): void
		{
			if (ahaMoments.shouldShow(Option.AhaResponsibleMany))
			{
				ahaMoments.setActive(Option.AhaResponsibleMany);
				this.isManyAhaShown = true;
				ahaMoments.setPopupShown(Option.AhaResponsibleMany);
				void fieldHighlighter.highlight(responsibleMeta.id);
			}
		},
		stopManyAha(): void
		{
			ahaMoments.setShown(Option.AhaResponsibleMany);
			this.closeManyAha();
		},
		closeManyAha(): void
		{
			this.isManyAhaShown = false;
			ahaMoments.setInactive(Option.AhaResponsibleMany);
		},
	},
	template: `
		<div ref="container">
			<div v-if="isFlowFilledOnAdd" class="tasks-field-responsible-auto">
				<BIcon :name="Outline.BOTTLENECK"/>
				<div v-if="!avatarOnly">{{ loc('TASKS_V2_RESPONSIBLE_AUTO') }}</div>
			</div>
			<NewUserLabel v-else-if="forNewUser"/>
			<Participants
				v-else
				:taskId
				:context="responsibleMeta.id"
				:userIds="task.responsibleIds"
				:canAdd="task.rights.delegate || task.rights.changeResponsible"
				:canRemove="task.rights.delegate || task.rights.changeResponsible"
				:forceEdit="!isEdit"
				:withHint="!isAdmin && !isEdit && task.creatorId !== currentUserId"
				:hintText="loc('TASKS_V2_RESPONSIBLE_CANT_CHANGE')"
				:single
				:multipleOnPlus="!single && task.responsibleIds.length === 1"
				:inline="avatarOnly || single"
				:avatarOnly
				:dataset
				:showMenu="false"
				@hintClick="handleHintClick"
				@update="updateTask"
			/>
			<ForNewUserSwitcher v-if="!isEdit && isTemplate && !avatarOnly && task.context !== 'flow'" v-model:isChecked="forNewUser"/>
		</div>
		<Hint v-if="isManyAhaShown" :bindElement="$refs.container" @close="isManyAhaShown = false">
			<div class="tasks-field-responsible-many-aha">
				<div>{{ loc('TASKS_V2_RESPONSIBLE_MANY_AHA') }}</div>
				<TextXs @click="stopManyAha">{{ loc('TASKS_V2_RESPONSIBLE_MANY_AHA_STOP') }}</TextXs>
			</div>
		</Hint>
	`,
};
