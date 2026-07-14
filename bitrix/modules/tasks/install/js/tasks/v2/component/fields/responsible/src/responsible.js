import { Type } from 'main.core';
import { PopupWindowManager } from 'main.popup';
import { TextXs } from 'ui.system.typography.vue';

import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { Option, Model } from 'tasks.v2.const';
import { AbsencePopup } from 'tasks.v2.component.absence-popup';
import { Participants } from 'tasks.v2.component.elements.participants';
import { Hint } from 'tasks.v2.component.elements.hint';
import { ahaMoments } from 'tasks.v2.lib.aha-moments';
import { analytics } from 'tasks.v2.lib.analytics';
import { calendar } from 'tasks.v2.lib.calendar';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { usersDialog } from 'tasks.v2.lib.user-selector-dialog';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { type TaskModel } from 'tasks.v2.model.tasks';
import { type UserAbsence } from 'tasks.v2.model.absences';

import { responsibleMeta } from './responsible-meta';
import { ForNewUserSwitcher } from './for-new-user-switcher/for-new-user-switcher';
import { NewUserLabel } from './new-user-label/new-user-label';
import './responsible.css';

// @vue/component
export const Responsible = {
	name: 'TaskResponsible',
	components: {
		AbsencePopup,
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
			fetchingAbsenceUnwatch: null,
			Outline,
			responsibleMeta,
		};
	},
	data(): Object
	{
		return {
			isManyAhaShown: false,
			activePopups: new Set(),
			activeAbsencePopups: new Set(),
			shownAbsencePopupUserIds: new Set(),
			armedAbsencePopupUserIds: new Set(),
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
		canEdit(): boolean
		{
			return Boolean(this.task.rights.delegate || this.task.rights.changeResponsible);
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
		fetchingAbsence(): boolean
		{
			return this.$store.state[Model.Absences].fetching;
		},
		userAbsences(): UserAbsence[]
		{
			return this.$store.getters[`${Model.Absences}/getByUserIds`](this.task.responsibleIds);
		},
	},
	mounted(): void
	{
		const existingAbsences = this.$store.getters[`${Model.Absences}/getByUserIds`](this.task.responsibleIds);

		existingAbsences.forEach(({ userId }) => {
			this.armedAbsencePopupUserIds.add(userId);
		});
	},
	methods: {
		armAbsenceForUsers(userIds: number[]): void
		{
			userIds.forEach((userId) => {
				this.armedAbsencePopupUserIds.add(userId);
			});
		},
		updateTask(responsibleIds: number[]): void
		{
			if (responsibleIds.length === 0)
			{
				responsibleIds.push(this.task.responsibleIds[0]);
			}

			const currentIds = new Set(this.task.responsibleIds);

			void taskService.update(this.taskId, { responsibleIds });

			this.normalizeShownAbsencePopupUserIds(responsibleIds);

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
				setTimeout(() => this.executeIfNoAbsences(this.showManyAha), 100);
			}
		},
		handleHintClick(): void
		{
			void taskService.update(this.taskId, { creatorId: this.currentUserId });
		},
		executeIfNoAbsences(fn: Function): void
		{
			if (!this.fetchingAbsence && !this.hasUsersWithAbsence())
			{
				fn();

				return;
			}

			this.fetchingAbsenceUnwatch = this.$watch('fetchingAbsence', (fetching: boolean) => {
				if (!fetching && !this.hasUsersWithAbsence())
				{
					fn();
				}

				this.fetchingAbsenceUnwatch();
			});
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
		hasUsersWithAbsence(): boolean
		{
			const userAbsences: UserAbsence[] = this.$store.getters[`${Model.Absences}/getByUserIds`](this.task.responsibleIds);
			const todayTs = calendar.todyTs;

			return userAbsences.some(({ userId, fromTs, toTs }) => {
				return this.armedAbsencePopupUserIds.has(userId)
					&& !this.shownAbsencePopupUserIds.has(userId)
					&& todayTs >= fromTs
					&& todayTs <= toTs;
			});
		},
		hasUserAbsence(userId: number | string): boolean
		{
			return this.userAbsences.some((absence) => absence.userId === userId);
		},
		addToActiveAbsencePopups(userId: number | string): void
		{
			if (this.activeAbsencePopups.size === 0)
			{
				PopupWindowManager.getPopups()
					.map((p) => p.getId())
					.forEach((popupId) => this.activePopups.add(popupId));
			}

			this.activeAbsencePopups.add(userId);
			this.shownAbsencePopupUserIds.add(userId);
		},
		normalizeShownAbsencePopupUserIds(responsibleIds: number[]): void
		{
			const responsibleIdsSet = new Set(responsibleIds);

			this.shownAbsencePopupUserIds.forEach((userId) => {
				if (!responsibleIdsSet.has(userId))
				{
					this.shownAbsencePopupUserIds.delete(userId);
				}
			});

			this.armedAbsencePopupUserIds.forEach((userId) => {
				if (!responsibleIdsSet.has(userId))
				{
					this.armedAbsencePopupUserIds.delete(userId);
				}
			});
		},
		removeFromActiveAbsencePopups(userId: number | string): void
		{
			if (!this.activeAbsencePopups.has(userId))
			{
				return;
			}

			this.activeAbsencePopups.delete(userId);

			if (
				this.activeAbsencePopups.size === 0
				&& this.task.responsibleIds.length > 1
			)
			{
				setTimeout(() => {
					if (this.isActivePopupsSame() && !usersDialog.getDialog()?.isOpen())
					{
						this.showManyAha();
					}
				}, 800);
			}
		},
		isActivePopupsSame(): boolean
		{
			const currentPopupIds = PopupWindowManager.getPopups().map((popup) => popup.getId());

			return (
				this.activePopups.size === currentPopupIds.length
				&& currentPopupIds.every((id) => this.activePopups.has(id))
			);
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
				:canAdd="canEdit"
				:canRemove="canEdit"
				:forceEdit="!isEdit"
				:withHint="!isAdmin && !isEdit && task.creatorId !== currentUserId"
				:hintText="loc('TASKS_V2_RESPONSIBLE_CANT_CHANGE')"
				:single
				:multipleOnPlus="!single && task.responsibleIds.length === 1"
				:inline="avatarOnly || single"
				:avatarOnly
				:dataset
				:showMenu="false"
				warnAboutAbsence
				@hintClick="handleHintClick"
				@update="updateTask"
				@absenceLoaded="armAbsenceForUsers"
			>
				<template #user="slotProps">
					<AbsencePopup
						v-if="slotProps?.getUserEl && armedAbsencePopupUserIds.has(slotProps.userId) && hasUserAbsence(slotProps.userId)"
						:getBindElement="slotProps?.getUserEl"
						:userId="slotProps.userId"
						:delay="task.responsibleIds.length - slotProps.index"
						@open="addToActiveAbsencePopups($event)"
						@close="removeFromActiveAbsencePopups($event)"
					/>
				</template>
			</Participants>
			<ForNewUserSwitcher
				v-if="!isEdit && isTemplate && !avatarOnly && task.context !== 'flow'"
				v-model:isChecked="forNewUser"
			/>
		</div>
		<Hint
			v-if="isManyAhaShown"
			:bindElement="$refs.container"
			@close="isManyAhaShown = false"
		>
			<div class="tasks-field-responsible-many-aha">
				<div>{{ loc('TASKS_V2_RESPONSIBLE_MANY_AHA') }}</div>
				<TextXs @click="stopManyAha">{{ loc('TASKS_V2_RESPONSIBLE_MANY_AHA_STOP') }}</TextXs>
			</div>
		</Hint>
	`,
};
