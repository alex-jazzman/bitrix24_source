import { Dom } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { PopupManager } from 'main.popup';
import { Menu, type MenuItemOptions } from 'ui.system.menu';
import { DatePicker, DatePickerEvent, createDate } from 'ui.date-picker';
import { BInput, InputSize } from 'ui.system.input.vue';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import type { JsonObject } from 'main.core';

import './css/field.css';

const DateFieldOption = {
	NONE: 'none',
	SINGLE: 'single',
	RANGE: 'range',
};

export const NotificationFilterDateField = {
	name: 'DateFilterField',
	components: {
		BIcon,
		BInput,
	},
	props: {
		modelValue: {
			type: Object,
			default: () => ({}),
		},
	},
	emits: ['update:modelValue', 'popupStateChange'],
	data(): JsonObject
	{
		return {
			searchType: this.getCurrentSearchType(),
		};
	},
	beforeUnmount(): void
	{
		this.menu?.destroy();
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		InputSize: () => InputSize,
		isFirstDateNotEmpty(): boolean
		{
			return this.modelValue.date?.length > 0 || this.modelValue.dateFrom?.length > 0;
		},
		isSecondDateNotEmpty(): boolean
		{
			return this.modelValue.dateTo?.length > 0;
		},
		labelText(): string
		{
			return this.loc('IM_NOTIFICATIONS_FILTER_DATE_FIELD_TITLE');
		},
		dateOptionText(): string
		{
			const currentOption = this.getDateOptions().find(
				(option) => option.id === this.searchType,
			);

			return currentOption ? currentOption.text : '';
		},
		showFirstDateInput(): boolean
		{
			return this.searchType === DateFieldOption.SINGLE || this.searchType === DateFieldOption.RANGE;
		},
		showSecondDateInput(): boolean
		{
			return this.searchType === DateFieldOption.RANGE;
		},
		firstDateValue(): string
		{
			if (this.searchType === DateFieldOption.SINGLE)
			{
				return this.modelValue.date || '';
			}

			if (this.searchType === DateFieldOption.RANGE)
			{
				return this.modelValue.dateFrom || '';
			}

			return '';
		},
		secondDateValue(): string
		{
			if (this.searchType === DateFieldOption.RANGE)
			{
				return this.modelValue.dateTo || '';
			}

			return '';
		},
	},
	methods:
	{
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		getCurrentSearchType(): string
		{
			if (this.modelValue.date)
			{
				return DateFieldOption.SINGLE;
			}

			if (this.modelValue.dateFrom && this.modelValue.dateTo)
			{
				return DateFieldOption.RANGE;
			}

			return DateFieldOption.NONE;
		},
		getDateOptions(): Array
		{
			return [
				{ id: DateFieldOption.NONE, text: this.loc('IM_NOTIFICATIONS_FILTER_DATE_OPTION_NONE') },
				{ id: DateFieldOption.SINGLE, text: this.loc('IM_NOTIFICATIONS_FILTER_DATE_OPTION_SINGLE') },
				{ id: DateFieldOption.RANGE, text: this.loc('IM_NOTIFICATIONS_FILTER_DATE_OPTION_RANGE') },
			];
		},
		getOptionsMenuItems(): MenuItemOptions
		{
			return this.getDateOptions().map((option) => ({
				title: option.text,
				isSelected: option.id === this.searchType,
				onClick: (): void => {
					this.searchType = option.id;
					this.$emit('update:modelValue', {});
					this.menu.updateItems(this.getOptionsMenuItems());
				},
			}));
		},
		onDateOptionClick(): void
		{
			this.$emit('popupStateChange', { popup: 'dateOptions', active: true });

			if (!this.menu)
			{
				PopupManager.getPopupById('im-notification-filter-date-option')?.destroy();
				this.menu = new Menu({
					id: 'im-notification-filter-date-option',
					maxHeight: 400,
					animation: 'fading-slide',
					items: this.getOptionsMenuItems(),
					events: {
						onPopupAfterClose: () => {
							this.$emit('popupStateChange', { popup: 'dateOptions', active: false });
						},
					},
				});
			}

			this.menu.show(this.$refs.dateOption.$el);
			const popupContainer = this.menu.getPopupContainer();
			if (popupContainer)
			{
				Dom.attr(popupContainer, 'data-test-id', 'im_notifications-filter__type-field-menu');
			}
		},
		onDateFilterClick(event: BaseEvent, toDate: boolean = false): void
		{
			this.$emit('popupStateChange', { popup: 'datePicker', active: true });
			if (this.ignoreNextClick)
			{
				this.ignoreNextClick = false;

				return;
			}

			this.datePickerInstance = new DatePicker({
				targetNode: event.target,
				animation: 'fading-slide',
				events: {
					[DatePickerEvent.SELECT]: (pickerEvent: BaseEvent) => this.handleDatePickerSelect(pickerEvent, toDate),
					onHide: () => {
						this.datePickerInstance.destroy();
					},
				},
				popupOptions: {
					animation: 'fading-slide',
					events: {
						onPopupAfterClose: () => {
							this.$emit('popupStateChange', { popup: 'datePicker', active: false });
						},
					},
				},
			});

			const value = toDate ? this.secondDateValue : this.firstDateValue;
			if (value)
			{
				const dateFormat = this.datePickerInstance.getDateFormat();
				this.datePickerInstance.selectDates([createDate(value, dateFormat)]);
			}

			this.datePickerInstance.show();
		},
		onSecondDateFilterClick(event: BaseEvent): void
		{
			this.onDateFilterClick(event, true);
		},
		handleDatePickerSelect(datePickerEvent: BaseEvent, toDate: boolean = false): void
		{
			const { date } = datePickerEvent.getData();
			const value = this.datePickerInstance.formatDate(date);

			if (toDate)
			{
				this.$emit('update:modelValue', {
					date: this.modelValue.date || '',
					dateFrom: this.modelValue.dateFrom || '',
					dateTo: value,
				});

				return;
			}

			if (this.searchType === DateFieldOption.SINGLE)
			{
				this.$emit('update:modelValue', {
					date: value,
					dateFrom: '',
					dateTo: '',
				});

				return;
			}

			this.$emit('update:modelValue', {
				date: this.modelValue.date || '',
				dateFrom: value,
				dateTo: this.modelValue.dateTo || '',
			});
		},
		onFirstDateClear(): void
		{
			this.$emit('update:modelValue', {
				date: '',
				dateFrom: '',
				dateTo: this.modelValue.dateTo || '',
			});
		},
		onSecondDateClear(): void
		{
			this.$emit('update:modelValue', {
				date: this.modelValue.date || '',
				dateFrom: this.modelValue.dateFrom || '',
				dateTo: '',
			});
		},
	},
	template: `
		<div class="bx-im-notifications-filter_field__container">
			<div class="bx-im-notifications-filter_field__label">{{ labelText }}</div>
			<div class="bx-im-notifications-filter_field__selector-container bx-im-content-notification-date-field-container">
				<BInput
					v-model="dateOptionText"
					class="bx-im-content-notification-date-field"
					:class="[{ '--with-margin': showFirstDateInput }, { '--range-option': showSecondDateInput }]"
					ref="dateOption"
					:clickable="true"
					:dropdown="true"
					:size="InputSize.Lg"
					data-test-id="im_notifications-filter__date-options-container"
					@click="onDateOptionClick"
				/>
				<BInput
					v-if="showFirstDateInput"
					v-model="firstDateValue"
					class="bx-im-content-notification-date-field"
					:class="{'--with-margin': showSecondDateInput}"
					:icon="OutlineIcons.CALENDAR_WITH_SLOTS"
					:clickable="true"
					:withClear="isFirstDateNotEmpty"
					:size="InputSize.Lg"
					data-test-id="im_notifications-filter__date-from-date-container"
					@clear="onFirstDateClear"
					@click="onDateFilterClick"
				/>
				<div
					v-if="showSecondDateInput"
					class="bx-im-content-notification-date-field-line"
				>
					<span class="bx-im-content-notification-date-field-line-item"/>
				</div>
				<BInput
					v-if="showSecondDateInput"
					v-model="secondDateValue"
					class="bx-im-content-notification-date-field"
					:icon="OutlineIcons.CALENDAR_WITH_SLOTS"
					:clickable="true"
					:withClear="isSecondDateNotEmpty"
					:size="InputSize.Lg"
					data-test-id="im_notifications-filter__date-to-date-container"
					@clear="onSecondDateClear"
					@click="onSecondDateFilterClick"
				/>
			</div>
		</div>
	`,
};
