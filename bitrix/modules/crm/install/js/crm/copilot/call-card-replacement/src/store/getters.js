import { type ApplicationState, type CallAssessment, type Criterion } from '../store';

export default {
	callId(state: ApplicationState): string
	{
		return state.callId;
	},

	callAssessment(state: ApplicationState): CallAssessment
	{
		return state.assessment;
	},

	callAssessmentPrompt(state: ApplicationState): string
	{
		return state.assessment.prompt;
	},

	callAssessmentIsHintEnabled(state: ApplicationState): boolean
	{
		return state.assessment.isHintEnabled;
	},

	callAssessmentHasHint(state: ApplicationState): boolean
	{
		return state.assessment.hasHint;
	},

	hintViewMode(state: ApplicationState): ?string
	{
		return state.hintViewMode;
	},

	isScriptSelected(state: ApplicationState): boolean
	{
		return state.assessment.id !== null;
	},

	hasAvailableSelectorItems(state: ApplicationState): boolean
	{
		return state.hasAvailableSelectorItems;
	},

	isCallScoringV2Enabled(state: ApplicationState): boolean
	{
		return state.isCallScoringV2Enabled;
	},

	criteria(state: ApplicationState): Criterion[]
	{
		return state.criteria;
	},

	guid(state: ApplicationState): string
	{
		return state.guid;
	},
};
