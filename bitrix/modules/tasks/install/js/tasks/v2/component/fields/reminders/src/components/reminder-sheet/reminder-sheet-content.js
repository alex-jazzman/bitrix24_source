import type { BaseEvent } from 'main.core.events';

import { DatePicker, DatePickerEvent } from 'ui.date-picker';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { ChipDesign, type ChipProps } from 'ui.system.chip.vue';
import { BInput } from 'ui.system.input.vue';
import { BMenu, MenuItemDesign, type MenuOptions } from 'ui.system.menu.vue';
import { HeadlineMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { EntitySelectorEntity, Model, RemindTo, RemindBy, RemindVia } from 'tasks.v2.const';
import { Duration } from 'tasks.v2.component.elements.duration';
import { EntitySelectorDialog, type Item } from 'tasks.v2.lib.entity-selector-dialog';
import { calendar } from 'tasks.v2.lib.calendar';
import { timezone } from 'tasks.v2.lib.timezone';
import { remindersService } from 'tasks.v2.provider.service.reminders-service';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { ReminderModel } from 'tasks.v2.model.reminders';

import { remindersMeta } from '../../reminders-meta';
import './reminder-sheet.css';

// @vue/component
export const ReminderSheetContent = {
	components: {
		UiButton,
		BMenu,
		BIcon,
		BInput,
		HeadlineMd,
		Duration,
	},
	inject: {
		task: {},
		taskId: {},
	},
	props: {
		reminderId: {
			type: [Number, String],
			required: true,
		},
		close: {
			type: Function,
			required: true,
		},
	},
	setup(): { task: TaskModel }
	{
		return {
			AirButtonStyle,
			ButtonSize,
			Outline,
			ChipDesign,
			RemindBy,
			remindersMeta,
		};
	},
	data(): Object
	{
		return {
			recipients: [RemindTo.Responsible],
			remindBy: RemindBy.Date,
			dateTs: null,
			duration: 0,
			remindVia: RemindVia.Notification,
			isDialogShown: false,
			isPickerShown: false,
			isTypeMenuShown: false,
			isViaMenuShown: false,
		};
	},
	computed: {
		reminder(): ReminderModel
		{
			return this.$store.getters[`${Model.Reminders}/getById`](this.reminderId);
		},
		before(): number
		{
			return this.remindBy === RemindBy.Deadline ? this.duration : null;
		},
		nextRemindTs(): number
		{
			return this.remindBy === RemindBy.Date ? this.dateTs : this.task.deadlineTs - this.before;
		},
		typeMenuOptions(): Function
		{
			return (): MenuOptions => ({
				bindElement: this.$refs.type.$el,
				closeOnItemClick: false,
				items: Object.entries(remindersMeta.by).map(([remindBy, title]) => {
					const isDisabled = remindBy === RemindBy.Deadline && !(this.task.deadlineTs > 0);

					return {
						title,
						isSelected: remindBy === this.remindBy,
						design: isDisabled ? MenuItemDesign.Disabled : MenuItemDesign.Default,
						onClick: (): void => {
							if (!isDisabled)
							{
								this.remindBy = remindBy;
								this.isTypeMenuShown = false;
							}
						},
					};
				}),
				targetContainer: document.body,
			});
		},
		viaMenuOptions(): Function
		{
			return (): MenuOptions => ({
				bindElement: this.$refs.via.$el,
				items: Object.entries(remindersMeta.via).map(([remindVia, { title, icon }]) => {
					return {
						title,
						icon,
						isSelected: remindVia === this.remindVia,
						onClick: (): void => {
							this.remindVia = remindVia;
						},
					};
				}),
				targetContainer: document.body,
			});
		},
		usersChips(): ChipProps[]
		{
			return this.recipients.map((id: number | string) => ({
				id,
				design: ChipDesign.Tinted,
				text: remindersMeta.to[id].title,
				withClear: true,
			}));
		},
		title(): string
		{
			if (this.reminderId)
			{
				return this.loc('TASKS_V2_REMINDERS_UPDATE_SHEET');
			}

			return this.loc('TASKS_V2_REMINDERS_ADD_SHEET');
		},
	},
	created(): void
	{
		if (!this.reminder)
		{
			return;
		}

		this.recipients = [this.reminder.recipient];
		this.remindBy = this.reminder.remindBy;
		this.dateTs = this.reminder.nextRemindTs;
		this.remindVia = this.reminder.remindVia;
		if (this.reminder.remindBy === RemindBy.Deadline)
		{
			this.duration = this.reminder.before ?? this.task.deadlineTs - this.reminder.nextRemindTs;
		}
	},
	methods: {
		save(): void
		{
			const reminder: ReminderModel = {
				id: this.reminderId || `tmp${Date.now()}`,
				taskId: this.taskId,
				userId: Core.getParams().currentUser.id,
				nextRemindTs: this.nextRemindTs,
				remindBy: this.remindBy,
				remindVia: this.remindVia,
				recipient: this.recipients[0],
				before: this.before,
			};

			if (this.reminderId)
			{
				void remindersService.update(reminder);
			}
			else
			{
				void remindersService.add(reminder);
			}

			this.close();
		},
		showDialog({ currentTarget }: { currentTarget: HTMLElement }): void
		{
			this.isDialogShown = true;

			this.dialog ??= this.createDialog();
			const ids = this.recipients.map((id: number | string) => [EntitySelectorEntity.ReminderRecipient, id]);
			this.dialog.selectItemsByIds(ids);
			this.dialog.showTo(currentTarget);
		},
		createDialog(): EntitySelectorDialog
		{
			const entityId = EntitySelectorEntity.ReminderRecipient;
			const dialog = new EntitySelectorDialog({
				width: 400,
				height: 200,
				dropdownMode: true,
				multiple: false,
				entities: [
					{
						id: entityId,
					},
				],
				items: Object.entries(remindersMeta.to).map(([id, { icon, title }]) => ({
					id,
					entityId,
					title,
					avatarOptions: {
						icon,
						iconColor: 'var(--ui-color-accent-main-primary)',
						bgColor: 'var(--ui-color-accent-soft-blue-2)',
					},
					tabs: ['recents'],
				})),
			});

			dialog.getPopup().subscribeFromOptions({
				onClose: (): void => {
					this.recipients = dialog.getSelectedItems().map((item: Item) => item.getId());
					this.isDialogShown = false;
				},
			});

			return dialog;
		},
		handleUserClear(chip: ChipProps): void
		{
			this.recipients = this.recipients.filter((id: number | string) => id !== chip.id);
		},
		showPicker({ currentTarget }: { currentTarget: HTMLElement }): void
		{
			this.picker ??= this.createPicker();
			this.picker.setTargetNode(currentTarget);
			this.picker.show();
		},
		createPicker(): DatePicker
		{
			const picker = new DatePicker({
				selectedDates: this.dateTs ? [this.dateTs + timezone.getOffset(this.dateTs)] : null,
				enableTime: true,
				defaultTime: calendar.dayStartTime,
				events: {
					[DatePickerEvent.SELECT]: (event: BaseEvent) => {
						const { date } = event.getData();
						const dateTs = calendar.createDateFromUtc(date).getTime();
						this.dateTs = dateTs - timezone.getOffset(dateTs);
					},
					onShow: (): void => {
						this.isPickerShown = true;
					},
					onHide: (): void => {
						this.isPickerShown = false;
					},
				},
				popupOptions: {
					animation: 'fading',
					targetContainer: document.body,
				},
			});

			picker.getPicker('day').subscribe('onSelect', () => picker.hide());

			let selectedHour = null;
			picker.getPicker('time').subscribe('onSelect', (event: BaseEvent) => {
				const { hour, minute } = event.getData();
				if (Number.isInteger(minute) || hour === selectedHour)
				{
					picker.hide();
				}

				selectedHour = hour;
			});

			return picker;
		},
		handleDateClear(): void
		{
			this.picker?.deselectDate(this.dateTs + timezone.getOffset(this.dateTs));
			this.dateTs = null;
		},
		formatDate(timestamp: number): string
		{
			return calendar.formatDateTime(timestamp);
		},
	},
	template: `
		<div class="tasks-field-reminder-sheet">
			<div class="tasks-field-reminder-sheet-header">
				<HeadlineMd>{{ title }}</HeadlineMd>
				<BIcon :name="Outline.CROSS_L" hoverable @click="close"/>
			</div>
			<BInput
				:label="loc('TASKS_V2_REMINDERS_RECIPIENT')"
				:placeholder="loc('TASKS_V2_REMINDERS_RECIPIENT_PLACEHOLDER')"
				:chips="usersChips"
				clickable
				:active="isDialogShown"
				@click="showDialog"
				@chipClear="handleUserClear"
			/>
			<BInput
				:modelValue="remindersMeta.by[remindBy]"
				:label="loc('TASKS_V2_REMINDERS_TYPE')"
				dropdown
				clickable
				:active="isTypeMenuShown"
				ref="type"
				@click="isTypeMenuShown = true"
			/>
			<BInput
				v-if="remindBy === RemindBy.Date"
				:modelValue="formatDate(dateTs)"
				:label="loc('TASKS_V2_REMINDERS_REMIND_BY_DATE_TITLE')"
				:icon="Outline.CALENDAR_WITH_SLOTS"
				:withClear="dateTs > 0"
				clickable
				:active="isPickerShown"
				@clear="handleDateClear"
				@click="showPicker"
			/>
			<Duration
				v-else
				v-model="duration"
				:label="loc('TASKS_V2_REMINDERS_REMIND_BY_DEADLINE_TITLE')"
			/>
			<BInput
				:modelValue="remindersMeta.via[remindVia].title"
				:label="loc('TASKS_V2_REMINDERS_SEND_VIA')"
				dropdown
				clickable
				:active="isViaMenuShown"
				ref="via"
				@click="isViaMenuShown = true"
			/>
			<div class="tasks-field-reminders-sheet-footer">
				<UiButton
					:text="loc('TASKS_V2_REMINDERS_SAVE')"
					:style="AirButtonStyle.PRIMARY"
					:size="ButtonSize.LARGE"
					:disabled="!nextRemindTs || !recipients.length"
					@click="save"
				/>
				<UiButton
					:text="loc('TASKS_V2_REMINDERS_CANCEL')"
					:style="AirButtonStyle.OUTLINE"
					:size="ButtonSize.LARGE"
					@click="close"
				/>
			</div>
		</div>
		<BMenu v-if="isTypeMenuShown" :options="typeMenuOptions()" @close="isTypeMenuShown = false"/>
		<BMenu v-if="isViaMenuShown" :options="viaMenuOptions()" @close="isViaMenuShown = false"/>
	`,
};
