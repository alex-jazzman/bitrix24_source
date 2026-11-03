import { defineStore } from 'ui.vue3.pinia';

/**
 * Lifecycle + conference state.
 *
 * Per-user / media / UI / recording state lives in their respective entity stores:
 * - {@link useUsersStore} — participants (incl. self), pin state via `usersStore`
 * - {@link useMediaStore} — local hardware (stream, devices, flip)
 * - {@link useUiStore} — layout, panels, notifications, buttons, copilot
 * - {@link useRecordingStore} — recording state
 *
 * This store is reserved for call lifecycle (callId/callState) and conference-specific
 * facts that don't fit elsewhere yet. As conference UI migrates, these may move into
 * a dedicated `useConferenceStore`.
 */

export type CallState = 'Idle' | 'Proceeding' | 'Connected' | 'Held' | 'Disconnected';
export type CallMode = 'direct' | 'group' | 'conference';
export type ConferenceState = 'preparation' | 'call';
export type ConferenceRightPanelMode = 'hidden' | 'chat' | 'users';

type InitCallParams = {
	callId?: number | null;
	callUuid?: string | null;
	callProvider?: string | null;
	callScheme?: string | null;
	callType?: string | null;
	associatedEntityId?: number | null;
	associatedEntityType?: string | null;
	isIncoming?: boolean;
};

type ConferenceCommonFields = {
	inited?: boolean;
	passChecked?: boolean;
	userCount?: number;
	messageCount?: number;
	userInCallCount?: number;
	isBroadcast?: boolean;
	hasErrorInCall?: boolean;
	showSmiles?: boolean;
	error?: string;
	componentError?: string;
	alias?: string;
};

type CallStoreState = {
	// region Call lifecycle
	callState: CallState;
	callId: number | null;
	callUuid: string | null;
	callProvider: string | null;
	callScheme: string | null;
	callType: string | null;
	associatedEntityId: number | null;
	associatedEntityType: string | null;
	isIncoming: boolean;
	callMode: CallMode;
	// endregion

	// region Conference
	conferenceTitle: string;
	conferenceState: ConferenceState;
	conferenceCallEnded: boolean;
	conferenceStarted: boolean | null;
	conferenceStartDate: string | null;
	conferenceInited: boolean;
	conferenceAlias: string;
	conferenceError: string;
	conferenceComponentError: string;

	conferenceUsers: number[];
	conferenceUsersInCall: number[];
	conferencePresenters: number[];
	conferenceUserCount: number;
	conferenceMessageCount: number;
	conferenceUserInCallCount: number;
	currentUserHash: string;

	conferencePassChecked: boolean;
	conferenceShowChat: boolean;
	conferenceShowSmiles: boolean;
	conferencePermissionsRequested: boolean;
	conferenceJoinWithVideo: boolean | null;
	conferenceUserReadyToJoin: boolean;
	conferenceIsBroadcast: boolean;
	conferenceRightPanelMode: ConferenceRightPanelMode;
	conferenceHasErrorInCall: boolean;
	// endregion
};

export const useCallStore = defineStore('call-core', {
	state: (): CallStoreState => ({
		callState: 'Idle',
		callId: null,
		callUuid: null,
		callProvider: null,
		callScheme: null,
		callType: null,
		associatedEntityId: null,
		associatedEntityType: null,
		isIncoming: false,
		callMode: 'direct',

		conferenceTitle: '',
		conferenceState: 'preparation',
		conferenceCallEnded: false,
		conferenceStarted: null,
		conferenceStartDate: null,
		conferenceInited: false,
		conferenceAlias: '',
		conferenceError: '',
		conferenceComponentError: '',

		conferenceUsers: [],
		conferenceUsersInCall: [],
		conferencePresenters: [],
		conferenceUserCount: 0,
		conferenceMessageCount: 0,
		conferenceUserInCallCount: 0,
		currentUserHash: '',

		conferencePassChecked: true,
		conferenceShowChat: false,
		conferenceShowSmiles: false,
		conferencePermissionsRequested: false,
		conferenceJoinWithVideo: null,
		conferenceUserReadyToJoin: false,
		conferenceIsBroadcast: false,
		conferenceRightPanelMode: 'hidden',
		conferenceHasErrorInCall: false,
	}),

	getters: {
		isConferenceCallActive: (state): boolean =>
			state.conferenceState === 'call' && !state.conferenceCallEnded,
	},

	actions: {
		initCall(params: InitCallParams = {}): void
		{
			const nullableFields: (keyof InitCallParams)[] = [
				'callId', 'callUuid', 'callProvider', 'callScheme', 'callType',
				'associatedEntityId', 'associatedEntityType',
			];

			nullableFields.forEach((key) => {
				(this as unknown as Record<string, unknown>)[key] = params[key] === undefined ? null : params[key];
			});

			this.isIncoming = params.isIncoming === true;
			this.callState = 'Proceeding';
		},

		resetCall(): void
		{
			this.$reset();
		},

		setCallMode(mode: CallMode): void
		{
			this.callMode = mode;
		},

		// region Conference

		setConferenceTitle(title: string): void
		{
			this.conferenceTitle = title;
		},

		setConferenceCommon(fields: ConferenceCommonFields): void
		{
			const fieldMap: Record<string, keyof CallStoreState> = {
				inited: 'conferenceInited',
				passChecked: 'conferencePassChecked',
				userCount: 'conferenceUserCount',
				messageCount: 'conferenceMessageCount',
				userInCallCount: 'conferenceUserInCallCount',
				isBroadcast: 'conferenceIsBroadcast',
				hasErrorInCall: 'conferenceHasErrorInCall',
				showSmiles: 'conferenceShowSmiles',
				error: 'conferenceError',
				componentError: 'conferenceComponentError',
				alias: 'conferenceAlias',
			};

			Object.entries(fields).forEach(([key, value]) => {
				const stateKey = fieldMap[key];

				if (stateKey !== undefined && value !== undefined)
				{
					(this as unknown as Record<string, unknown>)[stateKey] = value;
				}
			});
		},

		setCurrentUserHash(hash: string): void
		{
			this.currentUserHash = hash;
		},

		startConferenceCall(): void
		{
			this.conferenceState = 'call';
			this.conferenceCallEnded = false;
		},

		endConferenceCall(): void
		{
			this.conferenceState = 'preparation';
			this.conferenceCallEnded = true;
		},

		returnToPreparation(): void
		{
			this.conferenceState = 'preparation';
		},

		addConferenceUsers(userIds: number | number[]): void
		{
			const ids = Array.isArray(userIds) ? userIds : [userIds];

			ids.forEach((id) => {
				const parsed = parseInt(String(id), 10);

				if (!this.conferenceUsers.includes(parsed))
				{
					this.conferenceUsers.push(parsed);
				}
			});
		},

		removeConferenceUsers(userIds: number | number[]): void
		{
			const ids = Array.isArray(userIds) ? userIds : [userIds];
			const idsToRemove = new Set(ids.map((id) => parseInt(String(id), 10)));

			this.conferenceUsers = this.conferenceUsers.filter((id: number) => !idsToRemove.has(id));
		},

		addConferenceUsersInCall(userIds: number | number[]): void
		{
			const ids = Array.isArray(userIds) ? userIds : [userIds];

			ids.forEach((id) => {
				const parsed = parseInt(String(id), 10);

				if (!this.conferenceUsersInCall.includes(parsed))
				{
					this.conferenceUsersInCall.push(parsed);
				}
			});
		},

		removeConferenceUsersInCall(userIds: number | number[]): void
		{
			const ids = Array.isArray(userIds) ? userIds : [userIds];
			const idsToRemove = new Set(ids.map((id) => parseInt(String(id), 10)));

			this.conferenceUsersInCall = this.conferenceUsersInCall.filter((id: number) => !idsToRemove.has(id));
		},

		setConferencePresenters(presenters: number | number[], replace: boolean = false): void
		{
			const ids = Array.isArray(presenters) ? presenters : [presenters];

			if (replace)
			{
				this.conferencePresenters = ids.map((id) => parseInt(String(id), 10));
			}
			else
			{
				ids.forEach((id) => {
					const parsed = parseInt(String(id), 10);

					if (!this.conferencePresenters.includes(parsed))
					{
						this.conferencePresenters.push(parsed);
					}
				});
			}
		},

		setConferenceShowChat(newState: boolean): void { this.conferenceShowChat = newState; },
		setConferenceRightPanelMode(mode: ConferenceRightPanelMode): void { this.conferenceRightPanelMode = mode; },
		setConferencePermissionsRequested(status: boolean): void { this.conferencePermissionsRequested = status; },
		setConferenceJoinWithVideo(value: boolean | null): void { this.conferenceJoinWithVideo = value; },
		setConferenceUserReadyToJoin(): void { this.conferenceUserReadyToJoin = true; },
		setConferenceStatus(started: boolean | null): void { this.conferenceStarted = started; },
		setConferenceStartDate(date: string | null): void { this.conferenceStartDate = date; },
		setConferenceAlias(alias: string): void { this.conferenceAlias = alias; },
		setConferenceBroadcastMode(mode: boolean): void { this.conferenceIsBroadcast = mode; },
		setConferenceError(errorCode: string): void { this.conferenceError = errorCode; },
		toggleConferenceSmiles(): void { this.conferenceShowSmiles = !this.conferenceShowSmiles; },
		setConferenceHasErrorInCall(value: boolean): void { this.conferenceHasErrorInCall = value; },

		resetConference(): void
		{
			this.conferenceTitle = '';
			this.conferenceState = 'preparation';
			this.conferenceCallEnded = false;
			this.conferenceStarted = null;
			this.conferenceStartDate = null;
			this.conferenceInited = false;
			this.conferenceAlias = '';
			this.conferenceError = '';
			this.conferenceComponentError = '';
			this.conferenceUsers = [];
			this.conferenceUsersInCall = [];
			this.conferencePresenters = [];
			this.conferenceUserCount = 0;
			this.conferenceMessageCount = 0;
			this.conferenceUserInCallCount = 0;
			this.currentUserHash = '';
			this.conferencePassChecked = true;
			this.conferenceShowChat = false;
			this.conferenceShowSmiles = false;
			this.conferencePermissionsRequested = false;
			this.conferenceJoinWithVideo = null;
			this.conferenceUserReadyToJoin = false;
			this.conferenceIsBroadcast = false;
			this.conferenceRightPanelMode = 'hidden';
			this.conferenceHasErrorInCall = false;
		},

		// endregion
	},
});

export type CallStoreInstance = ReturnType<typeof useCallStore>;
