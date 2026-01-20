import { DateTimeFormat } from 'main.date';
import { modeItems } from '../enum/mode';
import { multipleLimits } from '../enum/multiple-limit';
import { multipleTypes } from '../enum/multiple-type';
import { offsetDateTypes } from '../enum/offset-date-type';
import { periods } from '../enum/period';
import { getFormattedDate } from '../helper';
import { FieldTitle } from './common/field-title';
import { HiddenInput } from './common/hidden-input';
import { EmailFields } from './email/email-fields';
import { CategorySelector } from './field/category-selector';
import { DateFields } from './field/date-fields';
import { ModeSelector } from './field/mode-selector';
import { MultipleLimitSelector } from './field/multiple-limit-selector';
import { MultipleRepeatSelector } from './field/multiple-repeat-selector';
import { MultipleTypeSelector } from './field/multiple-type-selector';
import { SingleFields } from './field/single-fields';

// @vue/component
export const Recurring = {
	components: {
		FieldTitle,
		HiddenInput,
		ModeSelector,
		SingleFields,
		DateFields,
		EmailFields,
		MultipleLimitSelector,
		MultipleRepeatSelector,
		MultipleTypeSelector,
		CategorySelector,
	},

	props: {
		entityId: {
			type: Number,
			required: true,
		},
		entityTypeId: {
			type: Number,
			required: true,
		},
		data: {
			type: Object,
			required: true,
		},
		params: {
			type: Object,
			required: true,
		},
		changeCallback: {
			type: Function,
			required: true,
		},
	},

	data(): Object
	{
		const dateStart = new Date();
		const defaultOffsetType = this.getDefaultOffsetType();

		const offsetBeginDateValue = Number(this.data['RECURRING[OFFSET_BEGINDATE_VALUE]'] ?? 0);
		const offsetCloseDateValue = Number(this.data['RECURRING[OFFSET_CLOSEDATE_VALUE]'] ?? 0);

		return {
			mode: this.data['RECURRING[MODE]'] ?? modeItems.none.value,

			singleInterval: Number(this.data['RECURRING[SINGLE_INTERVAL_VALUE]'] ?? 0),
			singleType: Number(this.data['RECURRING[SINGLE_TYPE]'] ?? defaultOffsetType),
			singleDateBefore: this.initDateInSeconds('RECURRING[SINGLE_DATE_BEFORE]'),

			multipleCustomIntervalValue: Number(this.data['RECURRING[MULTIPLE_CUSTOM_INTERVAL_VALUE]'] ?? 0),
			multipleCustomType: Number(this.data['RECURRING[MULTIPLE_CUSTOM_TYPE]'] ?? multipleTypes.day.value),

			multipleDateStart: this.initDateInSeconds('RECURRING[MULTIPLE_DATE_START]'),
			multipleTypeLimit: this.data['RECURRING[MULTIPLE_TYPE_LIMIT]'] ?? multipleLimits.no.value,
			multipleDateLimit: this.initDateInSeconds('RECURRING[MULTIPLE_DATE_LIMIT]'),
			multipleTimesLimit: Number(this.data['RECURRING[MULTIPLE_TIMES_LIMIT]'] ?? 1),

			dateStart,
			offsetBeginDateType: Number(this.data['RECURRING[OFFSET_BEGINDATE_TYPE]'] ?? defaultOffsetType),
			offsetBeginDateValue,
			offsetCloseDateType: Number(this.data['RECURRING[OFFSET_CLOSEDATE_TYPE]'] ?? defaultOffsetType),
			offsetCloseDateValue,
			isShowOffsetBeginDate: false,

			multipleType: Number(this.data['RECURRING[MULTIPLE_TYPE]'] ?? multipleTypes.day.value),
			multipleLimit: this.data['RECURRING[MULTIPLE_TYPE_LIMIT]'] ?? multipleLimits.no.value,

			categoryId: Number(this.data['RECURRING[CATEGORY_ID]'] ?? 0),
		};
	},

	computed: {
		isMultipleMode(): boolean
		{
			return this.mode === modeItems.multiple.value;
		},

		isSingleMode(): boolean
		{
			return this.mode === modeItems.single.value;
		},

		mustShowMultipleRepeatSelector(): boolean
		{
			return this.isMultipleMode && this.multipleType === multipleTypes.custom.value;
		},

		formattedMultipleDateLimit(): string
		{
			return getFormattedDate(this.multipleDateLimit);
		},

		formattedDateStart(): string
		{
			return getFormattedDate(this.multipleDateStart);
		},

		formattedSingleDateBefore(): string
		{
			return getFormattedDate(this.singleDateBefore);
		},

		dateForDateFieldsComponent(): number
		{
			if (this.mode === modeItems.multiple.value)
			{
				return this.multipleDateStart;
			}

			let date = new Date(this.singleDateBefore * 1000);

			switch (this.singleType)
			{
				case periods.day.value:
					date = date.setDate(date.getDate() - this.singleInterval);
					break;
				case periods.week.value:
					date = date.setDate(date.getDate() - this.singleInterval * 7);
					break;
				case periods.month.value:
					date = date.setMonth(date.getMonth() - this.singleInterval);
					break;
				default:
			}

			return date / 1000;
		},

		emailData(): Object
		{
			return {
				senderId: this.data['RECURRING[SENDER_ID]'] ?? null,
				documentId: this.data['RECURRING[EMAIL_DOCUMENT_ID]'] ?? null,
				templateId: this.data['RECURRING[EMAIL_TEMPLATE_ID]'] ?? null,
				isEnabled: this.data['RECURRING[IS_SEND_EMAIL]'] ?? false,
				emailIds: this.data['RECURRING[EMAIL_IDS]'] ?? [],
			};
		},

		isCategoriesEnabled(): boolean
		{
			return this.params.isCategoriesEnabled ?? false;
		},

		isEmailEnabled(): boolean
		{
			return this.entityTypeId === BX.CrmEntityType.enumeration.smartinvoice;
		},

		beginDateType(): number
		{
			const isCalculated = this.isShowOffsetBeginDate && this.offsetBeginDateValue > 0;

			return isCalculated ? offsetDateTypes.calculated : offsetDateTypes.set;
		},

		closeDateType(): number
		{
			return this.offsetCloseDateValue > 0 ? offsetDateTypes.calculated : offsetDateTypes.set;
		},
	},

	methods: {
		initDateInSeconds(fieldName: string): number
		{
			const fromData = this.data[fieldName];
			const dateObject = DateTimeFormat.parse(fromData);
			const value = (dateObject ?? new Date()).getTime();

			return value / 1000;
		},

		setMode(mode: string): void
		{
			this.mode = mode;
		},

		setMultipleTypeData({ type }): void
		{
			this.multipleType = type;
		},

		setMultipleRepeatData({ type, value }): void
		{
			this.multipleCustomType = type;
			this.multipleCustomIntervalValue = value;
		},

		setMultipleLimits({ type, date, times }): void
		{
			this.multipleTypeLimit = type;
			this.multipleDateLimit = date;
			this.multipleTimesLimit = times;
		},

		setSingleFields({ value, type, date }): void
		{
			this.singleInterval = value;
			this.singleType = type;
			this.singleDateBefore = date;
		},

		// eslint-disable-next-line max-len
		setDateFields({ dateStart, offsetBeginDateValue, offsetBeginDateType, offsetCloseDateValue, offsetCloseDateType, isShowOffsetBeginDate }): void
		{
			if (this.mode === modeItems.multiple.value)
			{
				this.multipleDateStart = dateStart;
			}
			else
			{
				this.dateStart = new Date(dateStart * 1000);
			}

			this.offsetBeginDateValue = offsetBeginDateValue;
			this.offsetBeginDateType = offsetBeginDateType;
			this.offsetCloseDateValue = offsetCloseDateValue;
			this.offsetCloseDateType = offsetCloseDateType;
			this.isShowOffsetBeginDate = isShowOffsetBeginDate;
		},

		setCategoryId(categoryId: number): void
		{
			this.categoryId = categoryId;
		},

		getDefaultOffsetType(): number
		{
			return periods.day.value;
		},
	},

	// language=Vue
	template: `
		<div>
			<ModeSelector 
				:entity-type-id="entityTypeId"
				:mode="mode"
				@onChange="setMode"
			/>

			<!-- region mode -->
				<HiddenInput :value="mode" name="RECURRING[MODE]" :change-callback="changeCallback" />
			<!-- endregion -->
		
			<div v-if="isMultipleMode || isSingleMode">
				<SingleFields
					v-if="isSingleMode"
					:interval="singleInterval"
					:type="singleType"
					:date="singleDateBefore"
					@onChange="setSingleFields"
				/>

				<MultipleTypeSelector
					v-if="isMultipleMode"
					:type="multipleType"
					@onChange="setMultipleTypeData"
				/>
				
				<MultipleRepeatSelector
					v-if="mustShowMultipleRepeatSelector"
					:interval="multipleCustomIntervalValue"
					:type="multipleCustomType"
					@onChange="setMultipleRepeatData"
				/>
			
				<MultipleLimitSelector
					v-if="isMultipleMode"
					:entity-type-id="entityTypeId"
					:type="multipleTypeLimit"
					:date="multipleDateLimit"
					:times="multipleTimesLimit"
					@onChange="setMultipleLimits"
				/>
			
				<DateFields
					:entity-type-id="entityTypeId"
					:isEditableDateStartField="isMultipleMode"
					:dateStart="dateForDateFieldsComponent"
					:offsetBeginDateValue="offsetBeginDateValue"
					:offsetBeginDateType="offsetBeginDateType"
					:offsetCloseDateValue="offsetCloseDateValue"
					:offsetCloseDateType="offsetCloseDateType"
					@onChange="setDateFields"
				/>
				
				<CategorySelector
					v-if="isCategoriesEnabled"
					:categories="params.categories"
					:categoryId="categoryId"
					@onChange="setCategoryId"
				/>
				
				<EmailFields
					v-if="isEmailEnabled"
					:entity-id="entityId"
					:entity-type-id="entityTypeId"
					:data="emailData"
					:change-callback="changeCallback"
				/>

				<!-- region multiple type -->
				<HiddenInput :value="multipleType" name="RECURRING[MULTIPLE_TYPE]" :change-callback="changeCallback" />
				<!-- endregion -->
				
				<!-- region MultipleRepeatSelector fields -->
				<HiddenInput :value="multipleCustomIntervalValue" name="RECURRING[MULTIPLE_CUSTOM_INTERVAL_VALUE]" :change-callback="changeCallback" />
				<HiddenInput :value="multipleCustomType" name="RECURRING[MULTIPLE_CUSTOM_TYPE]" :change-callback="changeCallback" />
				<!-- endregion -->

				<!-- region MultipleLimitSelector fields -->
				<HiddenInput :value="multipleTypeLimit" name="RECURRING[MULTIPLE_TYPE_LIMIT]" :change-callback="changeCallback" />
				<HiddenInput :value="formattedMultipleDateLimit" name="RECURRING[MULTIPLE_DATE_LIMIT]" :change-callback="changeCallback" />
				<HiddenInput :value="multipleTimesLimit" name="RECURRING[MULTIPLE_TIMES_LIMIT]" :change-callback="changeCallback" />
				<!-- endregion -->

				<!-- region Date fields -->
				<HiddenInput :value="formattedDateStart" name="RECURRING[MULTIPLE_DATE_START]" :change-callback="changeCallback" />
				<HiddenInput :value="beginDateType" name="RECURRING[BEGINDATE_TYPE]" :change-callback="changeCallback" />
				<HiddenInput :value="closeDateType" name="RECURRING[CLOSEDATE_TYPE]" />
				<HiddenInput v-if="isShowOffsetBeginDate" :value="offsetBeginDateValue" name="RECURRING[OFFSET_BEGINDATE_VALUE]" :change-callback="changeCallback" />
				<HiddenInput v-else value="" name="RECURRING[OFFSET_BEGINDATE_VALUE]" :change-callback="changeCallback" />
				<HiddenInput v-if="isShowOffsetBeginDate" :value="offsetBeginDateType" name="RECURRING[OFFSET_BEGINDATE_TYPE]" :change-callback="changeCallback" />
				<HiddenInput v-else value="" name="RECURRING[OFFSET_BEGINDATE_TYPE]" :change-callback="changeCallback" />
				<HiddenInput :value="offsetCloseDateValue" name="RECURRING[OFFSET_CLOSEDATE_VALUE]" :change-callback="changeCallback" />
				<HiddenInput :value="offsetCloseDateType" name="RECURRING[OFFSET_CLOSEDATE_TYPE]" :change-callback="changeCallback" />
				<!-- endregion -->

				<!-- region Single fields -->
				<HiddenInput :value="singleType" name="RECURRING[SINGLE_TYPE]" :change-callback="changeCallback" />
				<HiddenInput :value="singleInterval" name="RECURRING[SINGLE_INTERVAL_VALUE]" :change-callback="changeCallback" />
				<HiddenInput :value="formattedSingleDateBefore" name="RECURRING[SINGLE_DATE_BEFORE]" :change-callback="changeCallback" />
				<!-- endregion -->

				<!-- region Other fields -->
				<HiddenInput v-if="isCategoriesEnabled" :value="categoryId" name="RECURRING[CATEGORY_ID]" :change-callback="changeCallback" />
				<!-- endregion -->
			</div>
		</div>
	`,
};
