import { mapGetters } from 'ui.vue3.vuex';
import { ScenarioStepView } from 'crm.copilot.call-assessment-v2';
import { EmptyState } from './empty-state';

export const CriteriaList = {
	name: 'CriteriaList',

	components: {
		EmptyState,
		ScenarioStepView,
	},

	computed: {
		...mapGetters(['criteria', 'isScriptSelected']),

		sortedCriteria(): Array<Object>
		{
			return [...this.criteria].sort((a, b) => a.sort - b.sort);
		},
	},

	template: `
		<div class="crm-copilot__call-card-replacement-main">
			<div class="crm-copilot__call-card-replacement-criteria-wrapper">
				<div
					v-if="isScriptSelected"
					class="crm-call-assessment-v2-scenario-card__list crm-copilot__call-card-replacement-criteria-list"
				>
					<ScenarioStepView
						v-for="(criterion, index) in sortedCriteria"
						:key="criterion.id"
						:index="index + 1"
						:title="criterion.title"
						:description="criterion.description"
					/>
				</div>
				<EmptyState
					v-else
					icon="DocumentIcon"
					:title="$Bitrix.Loc.getMessage('CRM_COPILOT_CALL_CARD_REPLACEMENT_NOT_RESOLVED_SCRIPT_TITLE')"
					:description="$Bitrix.Loc.getMessage('CRM_COPILOT_CALL_CARD_REPLACEMENT_NOT_RESOLVED_SCRIPT_DESCRIPTION')"
				/>
			</div>
		</div>
	`,
};
