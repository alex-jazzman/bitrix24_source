import actions from './actions';
import mutations from './mutations';

// A TypeScript copy of templates/.default/src/store. chef could not pull the
// Flow-typed .default/src/store/index.js into the TS hub bundle (CF1002: the TS build pipeline does not
// enable @babel/preset-flow). Keep this in sync with .default, except for the description: .default does not know
// the DESCRIPTION field and does not store it on purpose.

export type StateShape = {
	automatedSolutionOrigTypeIds: number[],
	automatedSolutionOrigIsVibeEnabled: boolean,
	automatedSolution: {
		id: number | null,
		title: string | null,
		typeIds: number[],
		intranetCustomSectionId: number | null,
		description: string,
		isVibeEnabled: boolean,
		vibeId: number,
	},

	isVibeFeatureEnabled: boolean,
	isVibeAvailable: boolean,

	permissions: {
		canMoveSmartProcessFromCrm: boolean,
		canMoveSmartProcessFromAnotherAutomatedSolution: boolean,
	},

	dynamicTypesTitles: { [key: string]: string },
	intranetCustomSectionUrl: string | null,

	errors: Error[],
	isModified: boolean,
	isPermissionsLayoutV2Enabled: boolean,

	// Monotonic per-field edit counters: a field whose revision moved after a request was sent was edited during it.
	revisions: EditRevisions,
	recovery: RecoveryState,
};

export type EditableField = 'title' | 'description' | 'typeIds' | 'isVibeEnabled';
export type EditRevisions = Record<EditableField, number>;

export type SolutionBaseline = {
	id: number | null,
	title: string | null,
	description: string,
	typeIds: number[],
	isVibeEnabled: boolean,
	vibeId: number,
	intranetCustomSectionId: number | null,
};

export type SolutionDraft = {
	title: string | null,
	description: string,
	typeIds: number[],
	isVibeEnabled: boolean,
};

export type VerifiedState = {
	baseline: SolutionBaseline,
	draft: SolutionDraft,
	isModified: boolean,
};

export type RecoveryStatus = 'idle' | 'loading' | 'failed' | 'ready';

export type RecoveryState = {
	token: number,
	solutionId: number | null,
	status: RecoveryStatus,
	baseline: SolutionBaseline | null,
	draft: SolutionDraft | null,
};

export type Error = {
	message: string,
	code: string | number,
	customData: Object | null,
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
				intranetCustomSectionId: null,
				description: '',
				isVibeEnabled: false,
				vibeId: 0,
			},

			isVibeFeatureEnabled: false,
			isVibeAvailable: false,

			permissions: {
				canMoveSmartProcessFromCrm: false,
				canMoveSmartProcessFromAnotherAutomatedSolution: false,
			},

			dynamicTypesTitles: {},
			intranetCustomSectionUrl: null,

			errors: [],

			isModified: false,
			isPermissionsLayoutV2Enabled: false,

			revisions: {
				title: 0,
				description: 0,
				typeIds: 0,
				isVibeEnabled: 0,
			},
			recovery: {
				token: 0,
				solutionId: null,
				status: 'idle',
				baseline: null,
				draft: null,
			},
		};
	},
	getters: {
		isNew: (state: StateShape) => {
			return (state.automatedSolution.id ?? 0) <= 0;
		},
		isSaved: (state: StateShape, getters: any) => {
			return !state.isModified && !getters.isNew;
		},
	},
	actions,
	mutations,
};
