import {ButtonState} from "../../enums/button-state";
import {Action} from "../../../action";

export const AdditionalButtonIcon = Object.freeze({
	NOTE: 'note',
	SCRIPT: 'script',
	PRINT: 'print',
	DOTS: 'dots',
});

export const AdditionalButtonColor = Object.freeze({
	DEFAULT: 'default',
	PRIMARY: 'primary',
});

export const AdditionalButton = {
	props: {
		iconName: {
			type: String,
			required: false,
			default: '',
			validator(value: string) {
				return Object.values(AdditionalButtonIcon).indexOf(value) > -1;
			},
		},

		color: {
			type: String,
			required: false,
			default: AdditionalButtonColor.DEFAULT,
			validator(value: string)
			{
				return Object.values(AdditionalButtonColor).indexOf(value) > -1;
			},
		},

		title: {
			type: String,
			required: false,
			default: '',
		},

		state: {
			type: String,
			required: false,
			default: ButtonState.DEFAULT,
		},

		action: Object,
	},

	computed: {
		className() {
			return [
				'crm-timeline__card_add-button', {
				[`--icon-${this.iconName}`]: this.iconName,
				[`--color-${this.color}`]: this.color,
				},
			]
		},
	},
	methods: {
		executeAction(): void
		{
			if (this.action && this.currentState !== ButtonState.DISABLED && this.currentState !== ButtonState.LOADING)
			{
				const action = new Action(this.action);
				action.execute(this);
			}
		},
	},
	template: `
		<div :title="title" :class="className" @click="executeAction"></div>
	`
}