// @vue/component
export const WizardProgressBar = {
	props: {
		totalSteps: {
			type: Number,
			required: true,
		},
		currentStepIndex: {
			type: Number,
			required: true,
		},
	},

	// language=Vue
	template: `
		<div class="mail_massconnect__wizard_progress-bar">
			<div
				v-for="(step, index) in totalSteps"
				:key="index"
				class="mail_massconnect__wizard_progress-bar__item"
				:data-test-id="'mail_massconnect__wizard_progress-bar__item' + index"
				:class="{ 'mail_massconnect__wizard_progress-bar__item--active': index <= currentStepIndex }"
			>
			</div>
		</div>
	`,
};
