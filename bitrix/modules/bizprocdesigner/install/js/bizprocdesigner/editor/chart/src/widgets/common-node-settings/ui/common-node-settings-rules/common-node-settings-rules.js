import { mapState, mapActions } from 'ui.vue3.pinia';

import { SaveSettingsButton, CancelSettingsButton } from '../../../../shared/ui';

import { useAppStore } from '../../../../entities/app';
import { CommonNodeSettingsRulesLayout, useCommonNodeSettingsStore } from '../../../../entities/common-node-settings';

// @vue/component
export const CommonNodeSettingsRules = {
	name: 'CommonNodeSettingsRules',
	components: {
		CommonNodeSettingsRulesLayout,
		SaveSettingsButton,
		CancelSettingsButton,
	},
	computed:
	{
		...mapState(useCommonNodeSettingsStore, [
			'isVisible',
			'ruleForm',
			'isRuleSaving',
		]),
	},
	methods:
	{
		...mapActions(useAppStore, ['toggleSettingsRulesPanel']),
		...mapActions(useCommonNodeSettingsStore, [
			'setRuleForm',
			'setRuleSaving',
		]),
		onSave(form: HTMLElement): Promise<void>
		{
			this.setRuleSaving(true);
		},
		onCancel(): void
		{
			this.toggleSettingsRulesPanel(false);
			this.setRuleForm(null);
		},
	},
	template: `
		<CommonNodeSettingsRulesLayout
			v-if="isVisible"
			:ruleForm="ruleForm"
			:class="{ '--loading' : !ruleForm }"
			@close="onCancel"
		>
			<template #header-right>
				<slot name="header-right" />
			</template>

			<template #actions="{ form }">
				<SaveSettingsButton
					:isSaving="isRuleSaving"
					@click="onSave(form)"
				/>
				<CancelSettingsButton
					@click="onCancel"
				/>
			</template>
		</CommonNodeSettingsRulesLayout>
	`,
};
