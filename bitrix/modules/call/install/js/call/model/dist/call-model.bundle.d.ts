/* eslint-disable */
interface CallState {
	users: Record<number, CallUserState>;
}

interface CallUserState {
	id: number;
	state: string;
	talking: boolean;
	pinned: boolean;
	cameraState: boolean;
	microphoneState: boolean;
	screenState: boolean;
	floorRequestState: boolean;
}

interface ConferenceState {
	common: ConferenceCommonState;
	user: ConferenceUserData;
}

interface ConferenceCommonState {
	inited: boolean;
	passChecked: boolean;
	showChat: boolean;
	userCount: number;
	messageCount: number;
	userInCallCount: number;
	state: string;
	callEnded: boolean;
	showSmiles: boolean;
	error: string;
	conferenceTitle: string;
	alias: string;
	permissionsRequested: boolean;
	conferenceStarted: boolean | null;
	conferenceStartDate: Date | null;
	joinWithVideo: boolean | null;
	userReadyToJoin: boolean;
	isBroadcast: boolean;
	users: number[];
	usersInCall: number[];
	presenters: number[];
	rightPanelMode: string;
	hasErrorInCall: boolean;
}

interface ConferenceUserData {
	id: number;
	hash: string;
}

declare namespace BX.Call.Model {
	class CallModel extends BX.VuexBuilderModel {
		getName(): string;
		getState(): {
			users: {};
		};
		getElementState(params?: {
			id?: number;
		}): {
			id: number;
			state: "Idle";
			talking: boolean;
			pinned: boolean;
			cameraState: boolean;
			microphoneState: boolean;
			screenState: boolean;
			floorRequestState: boolean;
		};
		getGetters(): {
			getUser: (state: CallState) => (userId: number) => CallUserState;
			getBlankUser: () => (userId: number) => {
				id: number;
				state: "Idle";
				talking: boolean;
				pinned: boolean;
				cameraState: boolean;
				microphoneState: boolean;
				screenState: boolean;
				floorRequestState: boolean;
			};
		};
		getActions(): {
			updateUser: (store: any, payload: any) => void;
			unpinUser: (store: any) => void;
		};
		getMutations(): {
			updateUser: (state: any, payload: any) => void;
			unpinUser: (state: CallState) => void;
		};
		validate(payload: Record<string, unknown>): Partial<CallUserState>;
		getStateSaveException(): {
			users: boolean;
		};
	}

	class ConferenceModel extends BX.VuexBuilderModel {
		getName(): string;
		getState(): {
			common: {
				inited: boolean;
				passChecked: boolean;
				showChat: boolean;
				userCount: number;
				messageCount: number;
				userInCallCount: number;
				state: "preparation";
				callEnded: boolean;
				showSmiles: boolean;
				error: string;
				conferenceTitle: string;
				alias: string;
				permissionsRequested: boolean;
				conferenceStarted: null;
				conferenceStartDate: null;
				joinWithVideo: null;
				userReadyToJoin: boolean;
				isBroadcast: boolean;
				users: never[];
				usersInCall: never[];
				presenters: never[];
				rightPanelMode: "hidden";
				hasErrorInCall: boolean;
			};
			user: {
				id: number;
				hash: string;
			};
		};
		getActions(): {
			showChat: (store: any, payload: any) => void;
			changeRightPanelMode: (store: any, payload: any) => void;
			setPermissionsRequested: (store: any, payload: any) => void;
			setPresenters: (store: any, payload: any) => void;
			setUsers: (store: any, payload: any) => void;
			removeUsers: (store: any, payload: any) => void;
			setUsersInCall: (store: any, payload: any) => void;
			removeUsersInCall: (store: any, payload: any) => void;
			setConferenceTitle: (store: any, payload: any) => void;
			setBroadcastMode: (store: any, payload: any) => void;
		};
		getMutations(): {
			common: (state: any, payload: any) => void;
			user: (state: any, payload: any) => void;
			showChat: (state: any, { newState }: {
				newState: any;
			}) => void;
			changeRightPanelMode: (state: any, { mode }: {
				mode: any;
			}) => void;
			setPermissionsRequested: (state: any, payload: any) => void;
			startCall: (state: ConferenceState) => void;
			endCall: (state: ConferenceState) => void;
			returnToPreparation: (state: ConferenceState) => void;
			toggleSmiles: (state: ConferenceState) => void;
			setError: (state: any, payload: any) => void;
			setConferenceTitle: (state: any, payload: any) => void;
			setBroadcastMode: (state: any, payload: any) => void;
			setAlias: (state: any, payload: any) => void;
			setJoinType: (state: any, payload: any) => void;
			setConferenceStatus: (state: any, payload: any) => void;
			setConferenceHasErrorInCall: (state: any, payload: any) => void;
			setConferenceStartDate: (state: any, payload: any) => void;
			setUserReadyToJoin: (state: ConferenceState) => void;
			setPresenters: (state: any, payload: any) => void;
			setUsers: (state: any, payload: any) => void;
			removeUsers: (state: any, payload: any) => void;
			setUsersInCall: (state: any, payload: any) => void;
			removeUsersInCall: (state: any, payload: any) => void;
		};
		getStateSaveException(): {
			common: {
				inited: null;
				state: null;
				showSmiles: null;
				userCount: null;
				messageCount: null;
				userInCallCount: null;
				error: null;
				conferenceTitle: null;
				alias: null;
				conferenceStarted: null;
				conferenceStartDate: null;
				joinWithVideo: null;
				userReadyToJoin: null;
				rightPanelMode: null;
				presenters: null;
				users: null;
				hasErrorInCall: null;
			};
		};
	}
}
