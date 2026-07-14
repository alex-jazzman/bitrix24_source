import { mapState, mapActions } from 'ui.vue3.pinia';

import { AutoDeleteMessageDelay } from 'socialnetwork.v2.const';
import { UiSwitcherField, type HintOptions } from 'socialnetwork.v2.components.elements.ui-switcher-field';
import { AutoDeleteMessagePopup, AutoDeleteMessageDropdown } from 'socialnetwork.v2.components.popup.auto-delete-popup';
import { useProjectStore } from 'socialnetwork.v2.model.project';

import { InjectionKey } from '../../../../../const/index.js';

// @vue/component
export const AutoRemoveField = {
	name: 'AutoRemoveField',
	components: {
		AutoDeleteMessagePopup,
		AutoDeleteMessageDropdown,
		UiSwitcherField,
	},
	inject: {
		getWizardBodyContainer: {
			from: InjectionKey.GetWizardBodyContainer,
		},
	},
	data(): { shownPopup: boolean }
	{
		return {
			shownPopup: false,
		};
	},
	computed: {
		...mapState(useProjectStore, ['messagesAutoDeleteDelay']),
		value(): boolean
		{
			return this.messagesAutoDeleteDelay > AutoDeleteMessageDelay.Off;
		},
		targetContainer(): HTMLElement
		{
			return this.getWizardBodyContainer() ?? document.body;
		},
		hintOptions(): HintOptions
		{
			return {
				maxWidth: 300,
			};
		},
	},
	methods: {
		...mapActions(useProjectStore, ['updateMessagesAutoDeleteDelay']),
		clickInSwitcher(): void
		{
			if (this.value)
			{
				this.updateMessagesAutoDeleteDelay(AutoDeleteMessageDelay.Off);

				return;
			}

			this.showAutoDeleteMessageDelayPopup();
		},
		showAutoDeleteMessageDelayPopup(): void
		{
			this.shownPopup = true;
		},
		closeAutoDeleteMessageDelayPopup(): void
		{
			this.shownPopup = false;
		},
		onAutoDeleteDelayChange(delay: number = AutoDeleteMessageDelay.Off): void
		{
			this.updateMessagesAutoDeleteDelay(delay);
		},
	},
	template: `
		<div>
			<UiSwitcherField
				:modelValue="value"
				:label="loc('SONET_EXT_PROJECT_WIZARD_AUTO_REMOVE_LABEL')"
				:hint="loc('SONET_EXT_PROJECT_WIZARD_AUTO_REMOVE_HINT')"
				:hintOptions
				@click="clickInSwitcher"
			>
				<template v-if="value" #underline="{ status }">
					<AutoDeleteMessageDropdown
						:delay="messagesAutoDeleteDelay"
						:targetContainer
						@change="onAutoDeleteDelayChange"
					/>
				</template>
			</UiSwitcherField>
			<AutoDeleteMessagePopup
				v-if="shownPopup"
				:delay="messagesAutoDeleteDelay"
				@change="onAutoDeleteDelayChange"
				@close="closeAutoDeleteMessageDelayPopup"
			/>
		</div>
	`,
};
