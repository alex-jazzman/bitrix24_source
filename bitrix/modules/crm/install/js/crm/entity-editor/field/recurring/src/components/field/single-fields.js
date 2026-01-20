import { getPeriodByValue, getPeriods } from '../../enum/period';
import { createDatePickerInstance, getFormattedDate, showPopupMenu } from '../../helper';
import { popupMenuMixin } from '../common/destroy-popup-menu';
import { FieldTitle } from '../common/field-title';
import { HiddenInput } from '../common/hidden-input';

// @vue/component
export const SingleFields = {
	components: {
		FieldTitle,
		HiddenInput,
	},

	mixins: [popupMenuMixin('crm-recurring-period-selector')],

	props: {
		interval: {
			type: Number,
			required: true,
		},
		type: {
			type: Number,
			required: true,
		},
		date: {
			type: Number,
			required: true,
		},
	},

	data(): Object
	{
		return {
			currentInterval: this.interval,
			currentType: this.type,
			currentDate: this.date,
		};
	},

	computed: {
		prefixTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_MODE_SINGLE_FIELDS_PREFIX');
		},

		datePrefixTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_MODE_SINGLE_FIELDS_DATE_PREFIX');
		},

		currentModeTitle(): string
		{
			return getPeriodByValue(this.type).titleGenitive;
		},

		formattedDate(): string
		{
			return getFormattedDate(this.currentDate);
		},
	},

	watch: {
		currentInterval(): void
		{
			this.emitChange();
		},

		currentType(): void
		{
			this.emitChange();
		},

		currentDate(): void
		{
			this.emitChange();
		},
	},

	created()
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
		emitChange(): void
		{
			void this.$nextTick(() => {
				this.$emit('onChange', {
					value: this.currentInterval,
					type: this.currentType,
					date: this.currentDate,
				});
			});
		},

		showPeriodSelector(): void
		{
			const menu = [];

			Object.values(getPeriods()).forEach(({ value, titleGenitive }) => {
				menu.push({
					value,
					text: titleGenitive,
					onclick: this.onChangePeriod.bind(this),
				});
			});

			showPopupMenu(this.popupMenuId, this.$refs.periodSelector, menu);
		},

		onChangePeriod(_, item): void
		{
			this.currentType = item.value;

			item.getMenuWindow().close();
		},

		showDatePicker(): void
		{
			this.datePicker.setTargetNode(this.$refs.date);
			this.datePicker.show();
		},
	},

	// language=Vue
	template: `
		<div class="crm-entity-widget-content-block-field-recurring-single">
			<div class="crm-entity-widget-content-block-inner crm-entity-widget-content-block-colums-input">
				<div class="crm-entity-widget-content-block-input-wrapper">
					<span>{{prefixTitle}} </span>
					<input
						class="crm-entity-widget-content-input"
						type="number"
						v-model="currentInterval"
					>
					
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown">
						<div
							ref="periodSelector"
							class="ui-ctl-element"
							@click="showPeriodSelector"
						>
							{{currentModeTitle}}
						</div>
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					</div>
					
					<span> {{datePrefixTitle}} </span>
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
			</div>
		</div>
	`,
};
