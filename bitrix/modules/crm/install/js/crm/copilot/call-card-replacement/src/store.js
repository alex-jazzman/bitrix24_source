import mutations from './store/mutations';
import getters from './store/getters';
import actions from './store/actions';
import { Text } from 'main.core';

export type Criterion = {
	id: number,
	title: string,
	description: string,
	sort: number,
};

export type CallAssessment = {
	id: ?number,
	title: ?string,
	prompt: string,
	isHintEnabled: boolean,
	hasHint: boolean,
};

export type ApplicationState = {
	guid: string,
	callId: string,
	assessment: CallAssessment,
	hintViewMode: ?string,
	hasAvailableSelectorItems: boolean,
	isCallScoringV2Enabled: boolean,
	criteria: Criterion[],
};

export default () => {
	return {
		state: {
			guid: Text.getRandom(16),
			callId: null,
			assessment: {
				id: null,
				title: null,
				prompt: '',
				isHintEnabled: false,
				hasHint: false,
			},
			hintViewMode: null,
			hasAvailableSelectorItems: false,
			isCallScoringV2Enabled: false,
			criteria: [],
		},
		mutations,
		getters,
		actions,
	};
};
