import type { ApplicationState, Criterion } from '../store';

export default {
	callId(state: ApplicationState): string
	{
		return state.callId;
	},

	callAssessment(state: ApplicationState): { id: ?number, title: ?string, prompt: ?string }
	{
		return state.assessment;
	},

	callAssessmentPrompt(state: ApplicationState): ?string
	{
		return state.assessment.prompt;
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
