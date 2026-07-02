import * as Mixins from '../base/components/mixins';
import {MixinString, FieldString} from '../string/component';
import {VueDatePick} from './vue-date-pick/vueDatePick.js';

const KEY_SPACE = ' ';

const FieldDateTime = {
	mixins: [MixinString, Mixins.MixinDropDown],
	components: {
		'date-pick': VueDatePick,
		'field-string': FieldString,
	},
	data: function () {
		return {
			format: null
		};
	},
	template: `
		<div>
			<field-string
				:field="field"
				:item="item"
				:itemIndex="itemIndex"
				:readonly="true"
				:buttonClear="field.messages.get('fieldListUnselect')"
				@input-click="toggleDropDown()"
				@input-key-down="onInputKeyDown"
				@input-blur="onInputBlur"
			></field-string>
			<field-item-dropdown 
				:marginTop="'-14px'" 
				:maxHeight="'none'" 
				:width="'auto'" 
				:visible="dropDownOpened"
				:title="field.label"
				:messages="field.messages"
				@close="closeDropDown()"
				@mousedown.native="onDropdownMousedown"
			>
				<date-pick 
					:value="item.value"
					:show="true"
					:hasInputElement="false"
					:pickTime="field.hasTime"
					:startWeekOnSunday="field.sundayFirstly"
					:format="field.dateFormat"
					:weekdays="getWeekdays()"
					:months="getMonths()"
					:setTimeCaption="field.messages.get('fieldDateTime')"
					:closeButtonCaption="field.messages.get('fieldDateClose')"
					:selectableYearRange="120"
					@input="setDate"
					@close="closeDropDown()"
				></date-pick>
			</field-item-dropdown>
		</div>
	`,
	methods: {
		onDropdownMousedown(): void
		{
			this.isInteractingWithDropdown = true;
		},
		onInputBlur(): void
		{
			if (this.isInteractingWithDropdown)
			{
				this.isInteractingWithDropdown = false;

				return;
			}

			this.closeDropDown();
		},
		onInputKeyDown(event): void
		{
			if (event.key === 'Enter' || event.key === KEY_SPACE)
			{
				event.preventDefault();
				this.toggleDropDown();
			}
			else if ((event.key === 'Escape' || event.key === 'Esc') && this.dropDownOpened)
			{
				event.preventDefault();
				this.closeDropDown();
			}
		},
		setDate(value, stopClose)
		{
			this.value = value;
			if (!stopClose)
			{
				this.closeDropDown();
			}
		},
		getWeekdays()
		{
			let list = [];
			for (let n = 1; n <= 7; n++)
			{
				list.push(this.field.messages.get('fieldDateDay' + n));
			}

			return list;
		},
		getMonths()
		{
			let list = [];
			for (let n = 1; n <= 12; n++)
			{
				list.push(this.field.messages.get('fieldDateMonth' + n));
			}

			return list;
		},
	}
};

export {
	FieldDateTime,
}
