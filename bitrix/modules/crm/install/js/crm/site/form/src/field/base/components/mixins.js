import * as Common from '../components/common';
import { Aria } from '../../../util/aria';

const MixinField = {
	props: {
		field: {},
		itemIndex: { default: null },
	},
	components: Object.assign(
		{},
		Common.Definition
	),
	computed: {
		fieldId(): string
		{
			return Aria.getFieldId(this.field, this.itemIndex);
		},
		labelId(): string
		{
			return Aria.getLabelId(this.field, this.itemIndex);
		},
		hintId(): string
		{
			return Aria.getHintId(this.field, this.itemIndex);
		},
		errorId(): string
		{
			return Aria.getErrorId(this.field, this.itemIndex);
		},
		ariaRequired(): ?string
		{
			return Aria.getAriaRequired(this.field);
		},
		ariaInvalid(): ?string
		{
			return Aria.getAriaInvalid(this.field);
		},
		ariaDescribedby(): ?string
		{
			return Aria.getAriaDescribedBy(this.field, this.itemIndex);
		},
		hasErrors(): boolean
		{
			return Aria.hasErrors(this.field);
		},
		selected: {
			get: function () {
				return this.field.multiple
					? this.field.values()
					: this.field.values()[0];
			},
			set: function (newValue) {
				this.field.items.forEach(item => {
					item.selected = Array.isArray(newValue)
						? newValue.includes(item.value)
						: newValue === item.value
				});
			}
		},
	},
	methods: {
		controlClasses()
		{
			//b24-form-control-checked
		}
	},
};


let MixinDropDown = {
	components: {
		'field-item-dropdown': Common.Dropdown,
	},
	data: function () {
		return {
			dropDownOpened: false,
		};
	},
	methods: {
		toggleDropDown()
		{
			if (this.dropDownOpened)
			{
				this.closeDropDown();
			}
			else
			{
				this.dropDownOpened = true;
			}
		},
		closeDropDown()
		{
			setTimeout(() => {
				this.dropDownOpened = false;
			}, 0);
		},
	},
};

export {
	MixinField,
	MixinDropDown,
};

