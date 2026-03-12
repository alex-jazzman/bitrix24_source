import { Type } from 'main.core';
import { DateTimeFormat } from 'main.date';

import { TextSm } from 'ui.system.typography.vue';
import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { UserLabel } from 'tasks.v2.component.elements.user-label';
import { tooltip } from 'tasks.v2.component.elements.hint';
import { timezone } from 'tasks.v2.lib.timezone';
import type { ElapsedTimeModel } from 'tasks.v2.model.elapsed-times';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { UserModel } from 'tasks.v2.model.users';

import { formatTime } from '../../lib/time-tracking-util';

import './time-tracking-list-item-view.css';

// @vue/component
export const TimeTrackingListItemView = {
	name: 'TasksTimeTrackingListItemView',
	components: {
		BIcon,
		TextSm,
		UserLabel,
	},
	directives: { hint },
	inject: {
		task: {},
	},
	props: {
		elapsedId: {
			type: [Number, String],
			required: true,
		},
	},
	emits: ['edit', 'remove'],
	setup(): { task: TaskModel }
	{
		return {
			Outline,
		};
	},
	data(): Object
	{
		return {
			isItemHovered: false,
		};
	},
	computed: {
		elapsedTime(): ElapsedTimeModel
		{
			return this.$store.getters[`${Model.ElapsedTimes}/getById`](this.elapsedId);
		},
		isEdit(): boolean
		{
			return Type.isNumber(this.elapsedTime?.id);
		},
		elapsedTimeDate(): string
		{
			const format = this.loc('TASKS_V2_DATE_TIME_FORMAT', {
				'#DATE#': DateTimeFormat.getFormat('FORMAT_DATE'),
				'#TIME#': DateTimeFormat.getFormat('SHORT_TIME_FORMAT'),
			});

			const createdAtMs = this.elapsedTime.createdAtTs * 1000;
			const createdAt = new Date(createdAtMs + timezone.getOffset(createdAtMs));

			return DateTimeFormat.format(format, createdAt);
		},
		elapsedTimeTime(): string
		{
			return formatTime(this.elapsedTime.seconds);
		},
		author(): ?UserModel
		{
			return this.$store.getters[`${Model.Users}/getById`](this.elapsedTime.userId);
		},
		editTooltip(): Function
		{
			return (): HintParams => tooltip({
				text: this.loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ACTION_EDIT'),
				popupOptions: {
					offsetLeft: this.$refs.edit.offsetWidth / 2,
				},
			});
		},
		removeTooltip(): Function
		{
			return (): HintParams => tooltip({
				text: this.loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ACTION_REMOVE'),
				popupOptions: {
					offsetLeft: this.$refs.remove.offsetWidth / 2,
				},
			});
		},
	},
	template: `
		<div
			class="tasks-time-tracking-list-row --item"
			@mouseover="isItemHovered = true"
			@mouseleave="isItemHovered = false"
		>
			<div class="tasks-time-tracking-list-item-view">
				<div class="tasks-time-tracking-list-item-view-time">
					<div class="tasks-time-tracking-list-column --date">
						<TextSm>{{ elapsedTimeDate }}</TextSm>
					</div>
					<div class="tasks-time-tracking-list-column --time">
						<TextSm>{{ elapsedTimeTime }}</TextSm>
					</div>
					<div class="tasks-time-tracking-list-column --author">
						<UserLabel :user="author"/>
					</div>
					<div
						class="tasks-time-tracking-list-column --action"
					>
						<div
							v-if="isItemHovered && elapsedTime.rights.edit && isEdit"
							ref="edit" @click="$emit('edit')"
						>
							<BIcon v-hint="editTooltip" :name="Outline.EDIT_L" hoverable/>
						</div>
						<div
							v-if="isItemHovered && elapsedTime.rights.remove && isEdit"
							ref="remove" @click="$emit('remove')"
						>
							<BIcon v-hint="removeTooltip" :name="Outline.TRASHCAN" hoverable/>
						</div>
					</div>
				</div>
				<div v-if="this.elapsedTime.text" class="tasks-time-tracking-list-item-view-text">
					<TextSm>{{ this.elapsedTime.text }}</TextSm>
				</div>
			</div>
		</div>
	`,
};
