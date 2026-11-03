import { UpdateScript as UpdateScriptButton } from './button/update-script';
import { AllScripts as AllScriptsButton, ALL_SCRIPTS_URL } from './button/all-scripts';
import { Prompt } from './prompt';
import { CriteriaList } from './criteria-list';
import { ScriptSelector } from './script-selector';
import { Runtime } from 'main.core';
import { defineAsyncComponent } from 'ui.vue3';
import { mapGetters } from 'ui.vue3.vuex';
import { EmptyState } from './empty-state';

import '../styles/main.css';

let callHintPreference = null;
const HintView = defineAsyncComponent(async () => {
	const {
		HintView: LoadedHintView,
		Preference,
		PreferenceOptionName,
	} = await Runtime.loadExtension('crm.copilot.call-hint');

	callHintPreference = new Preference(PreferenceOptionName.Call);

	return LoadedHintView;
});

export const Main = {
	name: 'Main',

	components: {
		ScriptSelector,
		Prompt,
		CriteriaList,
		UpdateScriptButton,
		AllScriptsButton,
		EmptyState,
		HintView,
	},

	computed: mapGetters([
		'hasAvailableSelectorItems',
		'isCallScoringV2Enabled',
		'callAssessmentPrompt',
		'callAssessmentIsHintEnabled',
		'callAssessmentHasHint',
		'hintViewMode',
	]),

	methods: {
		emptyStateTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_COPILOT_CALL_CARD_REPLACEMENT_NO_AVAILABLE_SCRIPTS_TITLE');
		},

		emptyStateDescription(): string
		{
			let message = this.$Bitrix.Loc.getMessage('CRM_COPILOT_CALL_CARD_REPLACEMENT_NO_AVAILABLE_SCRIPTS_DESCRIPTION');
			message = message.replace('[link]', `<a href="${ALL_SCRIPTS_URL}" target="_blank" class="crm-copilot__call-card-replacement-empty-state-link">`);
			message = message.replace('[/link]', '</a>');

			return message;
		},

		handleHintViewSelect(mode: string): void
		{
			this.$store.commit('setHintViewMode', mode);
			callHintPreference?.save(mode);
		},
	},

	template: `
		<div
			class="crm-copilot__call-card-replacement"
			data-testid="crm-copilot-call-card-replacement"
		>
			<div
				v-if="hasAvailableSelectorItems"
				class="crm-copilot__call-card-replacement-content"
				data-testid="crm-copilot-call-card-replacement-content"
			>
				<ScriptSelector />
				<HintView
					v-if="isCallScoringV2Enabled && callAssessmentHasHint"
					:prompt="callAssessmentPrompt"
					:isHintEnabled="callAssessmentIsHintEnabled"
					:hasHint="callAssessmentHasHint"
					:mode="hintViewMode"
					@select="handleHintViewSelect"
				>
					<template #rules>
						<CriteriaList />
					</template>
				</HintView>
				<CriteriaList v-else-if="isCallScoringV2Enabled" />
				<Prompt v-else />
			</div>
			<EmptyState
				v-else
				icon="SearchIcon"
				:title="emptyStateTitle()"
				:description="emptyStateDescription()"
			/>
			<div class="crm-copilot__call-card-replacement-footer">
				<UpdateScriptButton />
				<AllScriptsButton />
			</div>
		</div>
	`,
};
