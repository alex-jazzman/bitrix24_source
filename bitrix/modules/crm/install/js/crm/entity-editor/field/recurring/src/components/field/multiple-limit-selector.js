import { getMultipleLimitByValue, multipleLimits } from '../../enum/multiple-limit';
import { createDatePickerInstance, getFormattedDate, resolveEntityTypeName, showPopupMenu } from '../../helper';
import { popupMenuMixin } from '../common/destroy-popup-menu';
import { FieldTitle } from '../common/field-title';

// @vue/component
export const MultipleLimitSelector = {
	components: {
		FieldTitle,
	},

	mixins: [popupMenuMixin('crm-recurring-multiple-limit-selector')],

	props: {
		entityTypeId: {
			type: Number,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
		date: {
			type: Number,
			required: true,
		},
		times: {
			type: Number,
			required: true,
		},
	},

	data(): Object
	{
		return {
			currentType: this.type,
			currentDate: this.date,
			currentTimes: this.times,
		};
	},

	computed: {
		title(): string
		{
			const entityTypeName = resolveEntityTypeName(this.entityTypeId);

			return this.$Bitrix.Loc.getMessage(`CRM_EE_RECURRING_MULTIPLE_LIMIT_TITLE_${entityTypeName}`);
		},

		dateTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_LIMIT_ITEM_DATE_FIELD_TITLE');
		},

		timesTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_LIMIT_ITEM_TIMES_FIELD_TITLE');
		},

		currentMultipleLimitTitle(): string
		{
			return getMultipleLimitByValue(this.currentType).title;
		},

		formattedDate(): string
		{
			return getFormattedDate(this.currentDate);
		},

		isDateLimit(): boolean
		{
			return this.currentType === multipleLimits.date.value;
		},

		isTimesLimit(): boolean
		{
			return this.currentType === multipleLimits.times.value;
		},
	},

	watch: {
		currentType(): void
		{
			this.emitChange();
		},

		currentDate(): void
		{
			this.emitChange();
		},

		currentTimes(): void
		{
			this.emitChange();
		},
	},

	created(): void
	{
		this.datePicker = createDatePickerInstance(this.date * 1000, (event) => {
			this.currentDate = event.getTarget().getSelectedDate().getTime() / 1000;
		});
	},

	beforeUnmount(): void
	{
		this.datePicker.destroy();
	},

	methods: {
		showSelector(): void
		{
			const menu = [];

			Object.values(multipleLimits).forEach(({ value, title }) => {
				menu.push({
					value,
					text: title,
					onclick: this.onChange.bind(this),
				});
			});

			showPopupMenu(this.popupMenuId, this.$refs.selector, menu);
		},

		onChange(_, item): void
		{
			this.currentType = item.value;
			item.getMenuWindow().close();
		},

		emitChange(): void
		{
			void this.$nextTick(() => {
				this.$emit('onChange', {
					type: this.currentType,
					date: this.currentDate,
					times: this.currentTimes,
				});
			});
		},

		showDatePicker(): void
		{
			this.datePicker.setTargetNode(this.$refs.date);
			this.datePicker.show();
		},
	},

	// language=Vue
	template: `
		<div class="ui-entity-editor-content-block">
			<FieldTitle :title="title" />
			
			<div class="ui-entity-editor-content-block">
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
					<div
						ref="selector"
						class="ui-ctl-element"
						@click="showSelector"
					>
						{{currentMultipleLimitTitle}}
					</div>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				</div>
			</div>
			
			<FieldTitle
				v-if="isDateLimit"
				:title="dateTitle"
			/>
			<div
				v-if="isDateLimit"
				class="ui-entity-editor-content-block"
			>
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-datetime ui-ctl-w50">
					<div class="ui-ctl-after ui-ctl-icon-calendar"></div>
					<input
						ref="date"
						class="ui-ctl-element"
						type="text"
						:value="formattedDate"
						@click="showDatePicker"
					>
				</div>
			</div>

			<FieldTitle
				v-if="isTimesLimit"
				:title="timesTitle"
			/>
			<div
				v-if="isTimesLimit"
				class="ui-entity-editor-content-block"
			>
				<div class="ui-ctl ui-ctl-textbox">
					<input
						class="ui-ctl-element"
						type="number"
						min="1"
						v-model="currentTimes"
					>
				</div>
			</div>

		</div>
	`,
};
