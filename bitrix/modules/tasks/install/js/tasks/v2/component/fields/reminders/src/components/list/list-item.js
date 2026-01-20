import { Loc } from 'main.core';
import { DateTimeFormat } from 'main.date';

import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { TextXs, TextMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Model, RemindBy } from 'tasks.v2.const';
import { timezone } from 'tasks.v2.lib.timezone';
import { tooltip } from 'tasks.v2.component.elements.hint';
import { remindersService } from 'tasks.v2.provider.service.reminders-service';
import type { ReminderModel } from 'tasks.v2.model.reminders';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { remindersMeta } from '../../reminders-meta';
import { ReminderSheet } from '../reminder-sheet/reminder-sheet';
import './list-item.css';

// @vue/component
export const ListItem = {
	name: 'TasksRemindersListItem',
	components: {
		BIcon,
		TextXs,
		TextMd,
		ReminderSheet,
	},
	directives: { hint },
	inject: {
		task: {},
	},
	props: {
		reminderId: {
			type: [Number, String],
			required: true,
		},
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	emits: ['edit'],
	setup(): { task: TaskModel }
	{
		return {
			Outline,
			remindersMeta,
		};
	},
	data(): Object
	{
		return {
			isItemHovered: false,
			isSheetShown: false,
		};
	},
	computed: {
		reminder(): ReminderModel
		{
			return this.$store.getters[`${Model.Reminders}/getById`](this.reminderId);
		},
		reminderDate(): string
		{
			const remindByDeadline = this.reminder.remindBy === RemindBy.Deadline;
			const before = this.reminder.before ?? this.task.deadlineTs - this.reminder.nextRemindTs;
			const dateTs = remindByDeadline ? this.task.deadlineTs - before : this.reminder.nextRemindTs;

			const format = Loc.getMessage('TASKS_V2_DATE_TIME_FORMAT', {
				'#DATE#': DateTimeFormat.getFormat('FORMAT_DATE'),
				'#TIME#': DateTimeFormat.getFormat('SHORT_TIME_FORMAT'),
			});

			return DateTimeFormat.format(format, (dateTs + timezone.getOffset(dateTs)) / 1000);
		},
		recipient(): Object
		{
			return remindersMeta.to[this.reminder.recipient];
		},
		viaTooltip(): Function
		{
			return (): HintParams => tooltip({
				text: remindersMeta.via[this.reminder.remindVia].title,
				popupOptions: {
					offsetLeft: this.$refs.via.$el.offsetWidth / 2,
				},
			});
		},
		editTooltip(): Function
		{
			return (): HintParams => tooltip({
				text: this.loc('TASKS_V2_REMINDERS_LIST_ACTION_EDIT'),
				popupOptions: {
					offsetLeft: this.$refs.edit.offsetWidth / 2,
				},
			});
		},
		removeTooltip(): Function
		{
			return (): HintParams => tooltip({
				text: this.loc('TASKS_V2_REMINDERS_LIST_ACTION_REMOVE'),
				popupOptions: {
					offsetLeft: this.$refs.remove.offsetWidth / 2,
				},
			});
		},
	},
	methods: {
		removeItem(): void
		{
			void remindersService.delete(this.reminderId);
		},
	},
	template: `
		<div
			class="tasks-field-reminders-row"
			@mouseover="isItemHovered = true"
			@mouseleave="isItemHovered = false"
		>
			<div class="tasks-field-reminders-column --via">
				<BIcon v-hint="viaTooltip" :name="remindersMeta.via[reminder.remindVia].icon" ref="via"/>
			</div>
			<div class="tasks-field-reminders-column --date">
				<TextMd>{{ reminderDate }}</TextMd>
			</div>
			<div class="tasks-field-reminders-column --recipients">
				<div class="tasks-field-reminders-to">
					<BIcon :name="recipient.icon"/>
				</div>
				<TextMd>{{ recipient.title }}</TextMd>
			</div>
			<div class="tasks-field-reminders-column --action" v-if="isItemHovered">
				<div ref="edit" @click="isSheetShown = true">
					<BIcon v-hint="editTooltip" :name="Outline.EDIT_L" hoverable/>
				</div>
				<div ref="remove" @click="removeItem">
					<BIcon v-hint="removeTooltip" :name="Outline.TRASHCAN" hoverable/>
				</div>
			</div>
		</div>
		<ReminderSheet
			v-if="isSheetShown"
			:reminderId
			:sheetBindProps
			@close="isSheetShown = false"
		/>
	`,
};
