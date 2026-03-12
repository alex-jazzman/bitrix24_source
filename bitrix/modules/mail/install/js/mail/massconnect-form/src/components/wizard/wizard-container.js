import { markRaw } from 'ui.vue3';
import { mapState } from 'ui.vue3.pinia';
import { Type } from 'main.core';
import { WizardProgressBar } from './wizard-progress-bar';
import { WizardNavigation } from './wizard-navigation';
import { ConnectionData } from './steps/connection-data/connection-data';
import { SelectEmployees } from './steps/select-employees/select-employees';
import { MailboxSettings } from './steps/mailbox-settings/mailbox-settings';
import { useWizardStore } from '../../store/wizard';
import { LocalizationMixin } from '../../mixins/localization-mixin';
import { ConnectionStatus } from './connection-status/connection-status';
import { sendData as analyticsSendData } from 'ui.analytics';
import { WizardHint } from './wizard-hint';
import './wizard-style.css';

/**
 * @typedef {import('vue').Component & {title: string}} WizardStepComponent
 */

// @vue/component
export default {
	components: {
		WizardProgressBar,
		WizardNavigation,
		ConnectionStatus,
		WizardHint,
	},

	mixins: [LocalizationMixin],

	data(): Object
	{
		return {
			currentStepIndex: 0,
			successfulCount: 0,
			isSubmitting: false,
			isCurrentStepValid: false,
			validationAttempted: false,
			mailboxesToConnect: [],
			massConnectData: {},
			steps: [
				markRaw(ConnectionData),
				markRaw(SelectEmployees),
				markRaw(MailboxSettings),
			],
		};
	},

	computed: {
		...mapState(useWizardStore, ['analyticsSource']),
		isContinueButtonDisabled(): boolean
		{
			const shouldDisable = this.activeStepComponent.disableButtonOnInvalid ?? true;

			return shouldDisable && !this.isCurrentStepValid;
		},
		totalSteps(): number
		{
			return this.steps.length;
		},
		activeStepComponent(): WizardStepComponent
		{
			return this.steps[this.currentStepIndex];
		},
		isFirstStep(): boolean
		{
			return this.currentStepIndex === 0;
		},
		isLastStep(): boolean
		{
			return this.currentStepIndex === this.totalSteps - 1;
		},
		isSecondStep(): boolean
		{
			return this.currentStepIndex === 1;
		},
	},

	watch: {
		currentStepIndex()
		{
			this.validationAttempted = false;
		},
	},

	mounted(): void
	{
		analyticsSendData({
			tool: 'mail',
			event: 'mailbox_mass_open',
			category: 'mail_mass_ops',
			c_section: this.analyticsSource,
		});
	},

	methods: {
		nextStep(): void
		{
			this.validationAttempted = true;

			this.$nextTick(() => {
				if (this.isCurrentStepValid && !this.isLastStep)
				{
					this.handleStepCompletion();

					this.currentStepIndex++;
				}
			});
		},
		prevStep(): void
		{
			if (!this.isFirstStep)
			{
				this.currentStepIndex--;
			}
		},
		async submitWizard(): void
		{
			this.handleStepCompletion();

			const wizardStore = useWizardStore();
			const prepareData = wizardStore.prepareDataForBackend();
			this.mailboxesToConnect = prepareData.mailboxes;
			this.massConnectData = wizardStore.prepareDataForHistory();

			if (this.mailboxesToConnect.length === 0)
			{
				return;
			}

			this.isSubmitting = true;
		},
		handleStepCompletion(): void
		{
			if (this.$refs.activeComponent && Type.isFunction(this.$refs.activeComponent.onStepComplete))
			{
				this.$refs.activeComponent.onStepComplete();
			}
		},
		handleFixErrors(errorsFromBackend, successfulCount): void
		{
			this.successfulCount = successfulCount;

			const wizardStore = useWizardStore();

			wizardStore.enableErrorState(errorsFromBackend.length);

			const userIdsWithErrors = new Set(
				errorsFromBackend.map((error) => error.customData?.userIdToConnect),
			);

			const employeesWithErrors = wizardStore.employees
				.filter((employee) => userIdsWithErrors.has(employee.id))
				.map((employee) => ({
					...employee,
					password: '',
				}))
			;

			const addedEmployees = [...wizardStore.addedEmployees, ...wizardStore.employees
				.filter((employee) => !userIdsWithErrors.has(employee.id))
				.map((employee) => ({
					...employee,
					password: '',
				}))]
			;

			wizardStore.setAddedEmployees(addedEmployees);
			wizardStore.setEmployees(employeesWithErrors);

			this.isSubmitting = false;
			this.currentStepIndex = 1;
		},
	},

	// language=Vue
	template: `
		<div class="mail_massconnect__wizard_container">
			<template v-if="!isSubmitting">
				<WizardProgressBar
					:total-steps="totalSteps"
					:current-step-index="currentStepIndex"
				/>

				<WizardHint v-if="isFirstStep"/>

				<div class="mail_massconnect__wizard_card">
					<div class="mail_massconnect__wizard_card_content">
						<component
							ref="activeComponent"
							:is="activeStepComponent"
							:validationAttempted="validationAttempted"
							@update:validity="isCurrentStepValid = $event"
						/>
					</div>
				</div>

				<WizardNavigation
					:isFirstStep="isFirstStep"
					:isLastStep="isLastStep"
					:isSubmitting="isSubmitting"
					:prevDisabled="isSecondStep && successfulCount > 0"
					:disabledContinueButton="isContinueButtonDisabled"
					@prev-step="prevStep"
					@next-step="nextStep"
					@submit="submitWizard"
				/>
			</template>

			<template v-else>
				<div class="mail_massconnect__wizard_connection_status_container">
					<div class="mail_massconnect__wizard_connection_status_content">
						<ConnectionStatus
							:mailboxes="mailboxesToConnect"
							:massConnectData="massConnectData"
							@fixErrors="handleFixErrors"
						/>
					</div>
				</div>
			</template>
		</div>
	`,
};
