import actions from './actions';
import mutations from './mutations';

export type StateShape = {
	automatedSolutionOrigTypeIds: number[],
	automatedSolutionOrigIsVibeEnabled: boolean,
	automatedSolution: {
		id?: ?number,
		title?: ?string,
		typeIds?: number[],
		isVibeEnabled?: boolean,
		vibeId?: number,
	},

	isVibeAvailable?: boolean,
	isVibeFeatureEnabled: boolean,

	permissions: {
		canMoveSmartProcessFromCrm: boolean,
		canMoveSmartProcessFromAnotherAutomatedSolution: boolean,
	},

	dynamicTypesTitles: {[key: number]: string},

	errors: Error[],
	isModified: boolean,
	isVibeSettingsPending: boolean,
	shouldCloseOnSave: boolean,
	isPermissionsLayoutV2Enabled: boolean,
};

export type Error = {
	message: string,
	code: string | number,
	customData: ?Object,
};

export const store = {
	strict: true,
	state(): StateShape
	{
		return {
			automatedSolutionOrigTypeIds: [],
			automatedSolutionOrigIsVibeEnabled: false,
			automatedSolution: {
				id: null,
				title: null,
				typeIds: [],
				isVibeEnabled: false,
				vibeId: 0,
			},

			isVibeAvailable: false,
			isVibeFeatureEnabled: false,

			permissions: {
				canMoveSmartProcessFromCrm: false,
				canMoveSmartProcessFromAnotherAutomatedSolution: false,
			},

			dynamicTypesTitles: {},

			errors: [],

			isModified: false,
			isVibeSettingsPending: false,
			shouldCloseOnSave: true,
			isPermissionsLayoutV2Enabled: false,
		};
	},
	getters: {
		isNew: (state: StateShape) => {
			return state.automatedSolution.id <= 0;
		},
		isSaved: (state: StateShape, getters) => {
			return !state.isModified && !getters.isNew;
		},
	},
	actions,
	mutations,
};
