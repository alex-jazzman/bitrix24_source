import { Dom, Event, Text } from 'main.core';
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

const OPEN_KEYS = ['Enter', ' ', 'ArrowDown'];
const VISIBLE_LABEL_SELECTOR = '.ui-system-input-label:not(.--error)';

type Trigger = {
	ref: string,
	label: string,
	inputValue: string,
	haspopup: string,
	controls: ?string,
	isOpen: boolean,
	isExpanded: boolean,
	open: () => void,
	close: () => void,
};

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
		title: {
			type: String,
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
			typeMenuId: `tasks-reminder-type-menu-${Text.getRandom()}`,
			viaMenuId: `tasks-reminder-via-menu-${Text.getRandom()}`,
			pickerPopupId: `tasks-reminder-picker-${Text.getRandom()}`,
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
			dialogPopupId: null,
			isDialogShown: false,
			isPickerShown: false,
			isTypeMenuShown: false,
			isViaMenuShown: false,
			mountedMenuIds: [],
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
		triggers(): Trigger[]
		{
			return [
				{
					ref: 'recipient',
					label: this.loc('TASKS_V2_REMINDERS_RECIPIENT'),
					inputValue: '',
					haspopup: 'dialog',
					controls: this.dialogPopupId,
					isOpen: this.isDialogShown,
					isExpanded: this.isDialogShown,
					open: (): void => this.showDialog({ currentTarget: this.triggerEl('recipient') }),
					close: (): void => this.dialog?.hide(),
				},
				{
					ref: 'type',
					label: this.loc('TASKS_V2_REMINDERS_TYPE'),
					inputValue: remindersMeta.by[this.remindBy],
					haspopup: 'menu',
					controls: this.typeMenuId,
					isOpen: this.isTypeMenuShown,
					isExpanded: this.isMenuMounted(this.typeMenuId),
					open: (): void => {
						this.isTypeMenuShown = true;
					},
					close: (): void => {
						this.isTypeMenuShown = false;
					},
				},
				{
					ref: 'date',
					label: this.loc('TASKS_V2_REMINDERS_REMIND_BY_DATE_TITLE'),
					inputValue: this.formatDate(this.dateTs),
					haspopup: 'dialog',
					controls: this.pickerPopupId,
					isOpen: this.isPickerShown,
					isExpanded: this.isPickerShown,
					open: (): void => this.showPicker({ currentTarget: this.triggerEl('date') }),
					close: (): void => this.picker?.hide(),
				},
				{
					ref: 'via',
					label: this.loc('TASKS_V2_REMINDERS_SEND_VIA'),
					inputValue: remindersMeta.via[this.remindVia].title,
					haspopup: 'menu',
					controls: this.viaMenuId,
					isOpen: this.isViaMenuShown,
					isExpanded: this.isMenuMounted(this.viaMenuId),
					open: (): void => {
						this.isViaMenuShown = true;
					},
					close: (): void => {
						this.isViaMenuShown = false;
					},
				},
			];
		},
	},
	watch: {
		// The sheet body renders through a slot, so the component's own updated() hook
		// is not guaranteed to run; post-flush watchers sync after the DOM settles.
		triggers: {
			handler(): void
			{
				this.syncAria();
			},
			flush: 'post',
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
	mounted(): void
	{
		this.syncAria();
		this.observeTriggerAria();

		// main.popup closes the sheet from a capture-phase keyup listener on the document,
		// so an Escape that only dismisses a dropdown has to be claimed earlier: capture at
		// the window always runs before capture at the document, whatever the bind order.
		Event.bind(window, 'keyup', this.handleWindowKeyUp, true);
	},
	beforeUnmount(): void
	{
		this.triggerAriaObservers?.forEach((observer: MutationObserver) => observer.disconnect());
		Event.unbind(window, 'keyup', this.handleWindowKeyUp, true);
	},
	methods: {
		triggerEl(ref: string): ?HTMLElement
		{
			return this.$refs[ref]?.$el;
		},
		/**
		 * BMenu snapshots aria-expanded of its bind element when it mounts and puts that
		 * snapshot back when it is destroyed, so a trigger that already reads "true" while
		 * the menu is mounting gets "true" handed back onto the closed combobox and keeps
		 * it. A menu trigger may therefore report itself expanded only from the moment its
		 * menu is really mounted, never from the flag that mounts it.
		 */
		isMenuMounted(menuId: string): boolean
		{
			return this.mountedMenuIds.includes(menuId);
		},
		handleMenuMounted(menuId: string): void
		{
			this.mountedMenuIds = [...this.mountedMenuIds, menuId];
		},
		handleMenuUnmounted(menuId: string): void
		{
			this.mountedMenuIds = this.mountedMenuIds.filter((id: string) => id !== menuId);
		},
		/**
		 * A closed menu hands the aria-expanded it snapshotted on open back to the trigger
		 * once its popup is destroyed, past the closing animation. By then the trigger may
		 * already own a newer menu, so what it reports is whatever the gone menu remembered:
		 * the state is written again here, whoever overwrote it and whenever. Only a menu
		 * keeps such a snapshot, so the dialog and the picker triggers need no watching.
		 */
		observeTriggerAria(): void
		{
			this.triggerAriaObservers = [];

			const menuRefs = this.triggers
				.filter((trigger: Trigger) => trigger.haspopup === 'menu')
				.map((trigger: Trigger) => trigger.ref);

			for (const ref: string of menuRefs)
			{
				const node = this.triggerEl(ref);
				if (!node)
				{
					continue;
				}

				const observer = new MutationObserver(() => {
					const { isExpanded } = this.triggers.find((trigger: Trigger) => trigger.ref === ref);
					if (node.getAttribute('aria-expanded') !== (isExpanded ? 'true' : 'false'))
					{
						this.syncAria();
					}
				});

				observer.observe(node, { attributeFilter: ['aria-expanded'] });
				this.triggerAriaObservers.push(observer);
			}
		},
		/**
		 * The trigger is the input wrapper, not the inner input: BInput blurs the input
		 * on focus in the clickable mode, so a tab stop on it swallows the focus.
		 *
		 * A combobox reads its value off the text of its own subtree, so whatever is not
		 * the value has to leave the accessibility tree: the visible label would repeat
		 * the name in place of the value, and an input showing nothing adds its name on
		 * top of that. The recipient input is always empty - its value is the chips.
		 */
		syncAria(): void
		{
			for (const trigger: Trigger of this.triggers)
			{
				const node = this.triggerEl(trigger.ref);
				const input = node?.querySelector('input');
				if (!input)
				{
					continue;
				}

				Dom.attr(node, 'role', 'combobox');
				Dom.attr(node, 'aria-label', trigger.label);
				Dom.attr(node, 'aria-haspopup', trigger.haspopup);
				Dom.attr(node, 'aria-expanded', trigger.isExpanded ? 'true' : 'false');
				Dom.attr(node, 'aria-controls', trigger.isExpanded ? trigger.controls : null);
				Dom.attr(node, 'tabindex', '0');
				Dom.attr(node.querySelector(VISIBLE_LABEL_SELECTOR), 'aria-hidden', 'true');
				Dom.attr(input, 'tabindex', '-1');
				Dom.attr(input, 'aria-hidden', trigger.inputValue ? null : 'true');
			}
		},
		handleKeydown(event: KeyboardEvent, ref: string): void
		{
			if (!OPEN_KEYS.includes(event.key))
			{
				return;
			}

			const trigger = this.triggers.find((item: Trigger) => item.ref === ref);

			// Neither BMenu nor the open picker takes arrow navigation from here, so ArrowDown
			// has nothing to move: cancelling the page default would leave the key doing nothing.
			if (trigger.isOpen && event.key === 'ArrowDown')
			{
				return;
			}

			event.preventDefault();

			if (trigger.isOpen)
			{
				trigger.close();

				return;
			}

			trigger.open();
		},
		handleWindowKeyUp(event: KeyboardEvent): void
		{
			if (event.key !== 'Escape')
			{
				return;
			}

			const trigger = this.triggers.find((item: Trigger) => item.isOpen);
			if (!trigger)
			{
				return;
			}

			event.stopImmediatePropagation();
			trigger.close();
		},
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

			// The popupOptions whitelist of ui.entity-selector drops id, so the popup names
			// itself; getPopup() builds it here and its node carries that id from then on.
			const popup = dialog.getPopup();
			this.dialogPopupId = popup.getId();

			popup.subscribeFromOptions({
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
					id: this.pickerPopupId,
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
		<div class="tasks-field-reminder-sheet" data-testid="tasks-reminder-sheet">
			<div class="tasks-field-reminder-sheet-header">
				<HeadlineMd>{{ title }}</HeadlineMd>
				<button
					type="button"
					class="tasks-field-reminder-sheet-close"
					:aria-label="loc('TASKS_V2_REMINDERS_CLOSE_ARIA_LABEL')"
					data-testid="tasks-reminder-sheet-close-btn"
					@click="close"
				>
					<BIcon :name="Outline.CROSS_L" hoverable aria-hidden="true"/>
				</button>
			</div>
			<BInput
				:label="loc('TASKS_V2_REMINDERS_RECIPIENT')"
				:ariaLabel="loc('TASKS_V2_REMINDERS_RECIPIENT')"
				:placeholder="loc('TASKS_V2_REMINDERS_RECIPIENT_PLACEHOLDER')"
				:chips="usersChips"
				clickable
				:active="isDialogShown"
				ref="recipient"
				data-testid="tasks-reminders-recipient-input"
				@click="showDialog"
				@chipClear="handleUserClear"
				@keydown="handleKeydown($event, 'recipient')"
			/>
			<BInput
				:modelValue="remindersMeta.by[remindBy]"
				:label="loc('TASKS_V2_REMINDERS_TYPE')"
				:ariaLabel="loc('TASKS_V2_REMINDERS_TYPE')"
				dropdown
				clickable
				:active="isTypeMenuShown"
				ref="type"
				data-testid="tasks-reminders-type-select"
				@click="isTypeMenuShown = true"
				@keydown="handleKeydown($event, 'type')"
			/>
			<BInput
				v-if="remindBy === RemindBy.Date"
				:modelValue="formatDate(dateTs)"
				:label="loc('TASKS_V2_REMINDERS_REMIND_BY_DATE_TITLE')"
				:ariaLabel="loc('TASKS_V2_REMINDERS_REMIND_BY_DATE_TITLE')"
				:icon="Outline.CALENDAR_WITH_SLOTS"
				:withClear="dateTs > 0"
				clickable
				:active="isPickerShown"
				ref="date"
				data-testid="tasks-reminders-date-input"
				@clear="handleDateClear"
				@click="showPicker"
				@keydown="handleKeydown($event, 'date')"
			/>
			<Duration
				v-else
				v-model="duration"
				:label="loc('TASKS_V2_REMINDERS_REMIND_BY_DEADLINE_TITLE')"
				:unitAriaLabel="loc('TASKS_V2_REMINDERS_DURATION_UNIT_ARIA_LABEL')"
				data-testid="tasks-reminders-duration"
			/>
			<BInput
				:modelValue="remindersMeta.via[remindVia].title"
				:label="loc('TASKS_V2_REMINDERS_SEND_VIA')"
				:ariaLabel="loc('TASKS_V2_REMINDERS_SEND_VIA')"
				dropdown
				clickable
				:active="isViaMenuShown"
				ref="via"
				data-testid="tasks-reminders-via-select"
				@click="isViaMenuShown = true"
				@keydown="handleKeydown($event, 'via')"
			/>
			<div class="tasks-field-reminders-sheet-footer" data-testid="tasks-reminder-sheet-footer">
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
		<BMenu
			v-if="isTypeMenuShown"
			:id="typeMenuId"
			:options="typeMenuOptions()"
			@vue:mounted="handleMenuMounted(typeMenuId)"
			@vue:unmounted="handleMenuUnmounted(typeMenuId)"
			@close="isTypeMenuShown = false"
		/>
		<BMenu
			v-if="isViaMenuShown"
			:id="viaMenuId"
			:options="viaMenuOptions()"
			@vue:mounted="handleMenuMounted(viaMenuId)"
			@vue:unmounted="handleMenuUnmounted(viaMenuId)"
			@close="isViaMenuShown = false"
		/>
	`,
};
