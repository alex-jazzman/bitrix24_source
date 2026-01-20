import type { Period } from '../../enum/period';
import { getPeriodByValue, getPeriods } from '../../enum/period';
import { createDatePickerInstance, getFormattedDate, resolveEntityTypeName, showPopupMenu } from '../../helper';
import { popupMenuMixin } from '../common/destroy-popup-menu';
import { FieldTitle } from '../common/field-title';

// @vue/component
export const DateFields = {
	components: {
		FieldTitle,
	},

	mixins: [
		popupMenuMixin([
			'crm-recurring-dates-section-selector-beginDate',
			'crm-recurring-dates-section-selector-closeDate',
		]),
	],

	props: {
		entityTypeId: {
			type: Number,
			required: true,
		},
		isEditableDateStartField: {
			type: Boolean,
			default: true,
		},
		dateStart: {
			type: Number,
			required: true,
		},
		offsetBeginDateValue: {
			type: Number,
			required: true,
		},
		offsetBeginDateType: {
			type: Number,
			required: true,
		},
		offsetCloseDateValue: {
			type: Number,
			required: true,
		},
		offsetCloseDateType: {
			type: Number,
			required: true,
		},
	},

	data(): Object
	{
		return {
			isShowOffsetBeginDate: this.offsetBeginDateValue > 0,
			formData: {
				currentDateStart: this.dateStart,
				currentOffsetBeginDateValue: this.offsetBeginDateValue,
				currentOffsetBeginDateType: this.offsetBeginDateType,
				currentOffsetCloseDateValue: this.offsetCloseDateValue,
				currentOffsetCloseDateType: this.offsetCloseDateType,
			},
			isEmitting: false,
		};
	},

	computed: {
		title(): string
		{
			const entityTypeName = this.getEntityTypeName();

			return this.$Bitrix.Loc.getMessage(`CRM_EE_RECURRING_DATE_FIELDS_TITLE_${entityTypeName}`);
		},

		startDateTitle(): string
		{
			const entityTypeName = this.getEntityTypeName();

			return this.$Bitrix.Loc.getMessage(`CRM_EE_RECURRING_DATES_SECTION_FIELD_DATE_CREATE_${entityTypeName}`);
		},

		formattedStartDate(): string
		{
			return getFormattedDate(this.formData.currentDateStart);
		},

		beginDateTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_BEGINDATE_TYPE_TITLE');
		},

		closeDateTitle(): string
		{
			const entityTypeName = this.getEntityTypeName();

			return this.$Bitrix.Loc.getMessage(`CRM_EE_RECURRING_CLOSEDATE_TYPE_TITLE_${entityTypeName}`);
		},

		offsetBeginDateTypeTitle(): string
		{
			return getPeriodByValue(this.formData.currentOffsetBeginDateType).title;
		},

		offsetCloseDateTypeTitle(): string
		{
			return getPeriodByValue(this.formData.currentOffsetCloseDateType).title;
		},

		offsetDateBeginTitle(): string
		{
			const entityTypeName = this.getEntityTypeName();

			return this.$Bitrix.Loc.getMessage(`CRM_EE_RECURRING_OFFSET_DATE_BEGIN_TITLE_${entityTypeName}`);
		},
	},

	watch: {
		formData: {
			handler() {
				if (!this.isEmitting)
				{
					void this.$nextTick(() => {
						this.emitChange();
					});
				}
			},
			deep: true,
		},

		isShowOffsetBeginDate: {
			handler() {
				if (!this.isEmitting)
				{
					void this.$nextTick(() => {
						this.emitChange();
					});
				}
			},
		},

		dateStart: {
			handler(newValue) {
				const roundedCurrent = Math.round(this.formData.currentDateStart);
				const roundedNew = Math.round(newValue);
				if (roundedCurrent !== roundedNew)
				{
					this.formData.currentDateStart = newValue;
				}
			},
		},

		offsetBeginDateValue: {
			handler(newValue) {
				this.isShowOffsetBeginDate = newValue > 0;
			},
		},
	},

	created(): void
	{
		this.datePicker = createDatePickerInstance(this.dateStart * 1000, (event) => {
			this.formData.currentDateStart = event.getTarget().getSelectedDate().getTime() / 1000;
		});
	},

	beforeUnmount(): void
	{
		this.datePicker.destroy();
	},

	methods: {
		showDateStartCalendar(): void
		{
			if (!this.isEditableDateStartField)
			{
				return;
			}

			this.datePicker.setTargetNode(this.$refs.dateStart);
			this.datePicker.show();
		},

		showPeriodSelector(target: HTMLElement, name: string): void
		{
			const menu = [];

			Object.values(getPeriods()).forEach((item: Period) => {
				menu.push({
					text: item.title,
					value: item.value,
					onclick: this.onSelectPeriodItem.bind(this, name),
				});
			});

			const id = `crm-recurring-dates-section-selector-${name}`;
			showPopupMenu(id, target, menu);
		},

		onSelectPeriodItem(name: string, _, item): void
		{
			const value = item.value;
			if (name === 'beginDate')
			{
				this.formData.currentOffsetBeginDateType = value;
			}
			else if (name === 'closeDate')
			{
				this.formData.currentOffsetCloseDateType = value;
			}

			item.getMenuWindow().close();
		},

		emitChange(): void
		{
			if (this.isEmitting)
			{
				return;
			}

			this.isEmitting = true;
			this.$emit('onChange', {
				dateStart: this.formData.currentDateStart,
				offsetBeginDateValue: this.formData.currentOffsetBeginDateValue,
				offsetBeginDateType: this.formData.currentOffsetBeginDateType,
				offsetCloseDateValue: this.formData.currentOffsetCloseDateValue,
				offsetCloseDateType: this.formData.currentOffsetCloseDateType,
				isShowOffsetBeginDate: this.isShowOffsetBeginDate,
			});

			void this.$nextTick(() => {
				this.isEmitting = false;
			});
		},

		getEntityTypeName(): string
		{
			return resolveEntityTypeName(this.entityTypeId);
		},
	},

	// language=Vue
	template: `
		<div class="ui-entity-editor-content-block">
			<FieldTitle :title="title" />
			
			<div class="crm-entity-widget-content-block-inner crm-entity-widget-content-block-colums-input crm-entity-widget-content-block-recurring-inside-section-container">
				<FieldTitle :title="startDateTitle" />
				
				<div class="crm-entity-widget-content-block-inner crm-entity-widget-content-block-colums-input">
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-datetime ui-ctl-w50">
						<div class="ui-ctl-after ui-ctl-icon-calendar"></div>
						<input
							ref="dateStart"
							:readonly="!isEditableDateStartField"
							:disabled="!isEditableDateStartField"
							class="ui-ctl-element"
							type="text"
							:value="formattedStartDate"
							@click="showDateStartCalendar"
						>
					</div>
				</div>	
				
				<label class="ui-ctl ui-ctl-w100 ui-ctl-checkbox">
					<input
						type="checkbox"
						class="ui-ctl-element"
						v-model="isShowOffsetBeginDate"
						value="Y"
					>
					<span class="ui-ctl-label-text">{{offsetDateBeginTitle}}</span>
				</label>

				<FieldTitle v-if="isShowOffsetBeginDate" :title="beginDateTitle" />
				
				<div
					v-if="isShowOffsetBeginDate"
					class="crm-entity-widget-content-block-inner crm-entity-widget-content-block-colums-input"
				>
					<div class="crm-entity-widget-content-block-input-wrapper">
						<input
							class="crm-entity-widget-content-input"
							type="number"
							v-model="formData.currentOffsetBeginDateValue"
						>
						<div class="crm-entity-widget-content-block-select">
							<div
								class="crm-entity-widget-content-select"
								@click="(event) => showPeriodSelector(event.target, 'beginDate')"
							>{{offsetBeginDateTypeTitle}}</div>
						</div>
					</div>
				</div>
				
				<FieldTitle :title="closeDateTitle" />
				
				<div class="crm-entity-widget-content-block-inner crm-entity-widget-content-block-colums-input">
					<div class="crm-entity-widget-content-block-input-wrapper">
						<input
							class="crm-entity-widget-content-input"
							type="number"
							v-model="formData.currentOffsetCloseDateValue"
						>
						<div class="crm-entity-widget-content-block-select">
							<div
								class="crm-entity-widget-content-select"
								@click="(event) => showPeriodSelector(event.target, 'closeDate')"
							>{{offsetCloseDateTypeTitle}}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
};
