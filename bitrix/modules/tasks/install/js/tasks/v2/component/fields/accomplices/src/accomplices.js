import { Type } from 'main.core';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { Participants } from 'tasks.v2.component.elements.participants';
import { AbsencePopup } from 'tasks.v2.component.absence-popup';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { analytics } from 'tasks.v2.lib.analytics';
import type { TaskModel } from 'tasks.v2.model.tasks';
import { type UserAbsence } from 'tasks.v2.model.absences';

import { accomplicesMeta } from './accomplices-meta';
import { consumePendingAbsenceArm } from './pending-absence-arm';

// @vue/component
export const Accomplices = {
	name: 'TaskAccomplices',
	components: {
		AbsencePopup,
		Participants,
	},
	inject: {
		task: {},
		taskId: {},
		analytics: {},
		cardType: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			accomplicesMeta,
		};
	},
	data(): Object
	{
		return {
			armedAbsencePopupUserIds: new Set(),
		};
	},
	mounted(): void
	{
		const existingAbsences = this.$store.getters[`${Model.Absences}/getByUserIds`](this.task.accomplicesIds);

		existingAbsences.forEach(({ userId }) => {
			this.armedAbsencePopupUserIds.add(userId);
		});

		// Absences added through the chip flow are loaded before this field
		// mounts, so arm them off the chip's own load promise rather than the
		// store-wide `fetching` flag (shared across all task windows).
		const pendingArm = consumePendingAbsenceArm(this.taskId);
		if (pendingArm)
		{
			void pendingArm.then((userIds) => {
				this.armAbsenceForUsers(userIds);
			});
		}
	},
	computed: {
		dataset(): Object
		{
			return {
				'data-task-id': this.taskId,
				'data-task-field-id': accomplicesMeta.id,
				'data-task-field-value': this.task.accomplicesIds.join(','),
			};
		},
		isEdit(): boolean
		{
			return idUtils.isReal(this.taskId);
		},
		isLocked(): boolean
		{
			return !Core.getParams().restrictions.stakeholder.available;
		},
		featureId(): string
		{
			return Core.getParams().restrictions.stakeholder.featureId;
		},
		accomplicesCount(): number
		{
			return this.task.accomplicesIds?.length ?? 0;
		},
		userAbsences(): UserAbsence[]
		{
			return this.$store.getters[`${Model.Absences}/getByUserIds`](this.task.accomplicesIds);
		},
	},
	methods: {
		armAbsenceForUsers(userIds: number[]): void
		{
			userIds.forEach((userId) => {
				this.armedAbsencePopupUserIds.add(userId);
			});
		},
		normalizeArmedAbsencePopupUserIds(accomplicesIds: number[]): void
		{
			const accomplicesIdsSet = new Set(accomplicesIds);

			this.armedAbsencePopupUserIds.forEach((userId) => {
				if (!accomplicesIdsSet.has(userId))
				{
					this.armedAbsencePopupUserIds.delete(userId);
				}
			});
		},
		update(accomplicesIds: number[]): void
		{
			const hasChanges = taskService.hasChanges(this.task, { accomplicesIds })
				&& accomplicesIds.length > 0
				&& accomplicesIds.length >= this.accomplicesCount
			;

			void taskService.update(this.taskId, { accomplicesIds });

			this.normalizeArmedAbsencePopupUserIds(accomplicesIds);

			if (hasChanges)
			{
				analytics.sendAddCoexecutor(this.analytics, {
					cardType: this.cardType,
					taskId: Type.isNumber(this.taskId) ? this.taskId : 0,
					viewersCount: this.task.auditorsIds?.length ?? 0,
					coexecutorsCount: accomplicesIds.length,
				});
			}
		},
		hasUserAbsence(userId: number | string): boolean
		{
			return this.userAbsences.some((absence) => absence.userId === userId);
		},
	},
	template: `
		<Participants
			:taskId
			:context="accomplicesMeta.id"
			:userIds="task.accomplicesIds"
			:canAdd="task.rights.changeAccomplices"
			:canRemove="task.rights.changeAccomplices"
			:forceEdit="!isEdit"
			:dataset
			:isLocked
			:featureId
			warnAboutAbsence
			@update="update"
			@absenceLoaded="armAbsenceForUsers"
		>
			<template #user="slotProps">
				<AbsencePopup
					v-if="slotProps?.getUserEl && armedAbsencePopupUserIds.has(slotProps.userId) && hasUserAbsence(slotProps.userId)"
					:getBindElement="slotProps?.getUserEl"
					:userId="slotProps.userId"
					:delay="task.accomplicesIds.length - slotProps.index"
				/>
			</template>
		</Participants>
	`,
};
