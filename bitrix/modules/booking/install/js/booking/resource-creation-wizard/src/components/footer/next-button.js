import { Button, ButtonSize, ButtonColor } from 'booking.component.button';
import type { IStep } from '../../presenter';

export const NextButton = {
	name: 'NextButton',
	components: {
		UiButton: Button,
	},
	props: {
		step: {
			type: Number,
			required: true,
		},
		steps: {
			type: Array,
			required: true,
		},
		disabled: Boolean,
		waiting: Boolean,
	},
	computed: {
		currentStep(): IStep
		{
			return this.steps[this.step - 1];
		},
		size(): string
		{
			return ButtonSize.SMALL;
		},
		color(): string
		{
			return ButtonColor.SUCCESS;
		},
		isFinalStep(): boolean
		{
			return this.step === this.steps.length;
		},
		dataset(): Object
		{
			return this.isFinalStep
				? { id: 'brcw-resource-create-button', testid: 'booking-resource-wizard-next-btn' }
				: { testid: 'booking-resource-wizard-next-btn' };
		},
	},
	template: `
		<UiButton
			:text="currentStep.labelNext"
			:title="currentStep.labelNext"
			:size
			:color
			:dataset
			:disabled
			:waiting
			@click="currentStep.next()"
		/>
	`,
};
