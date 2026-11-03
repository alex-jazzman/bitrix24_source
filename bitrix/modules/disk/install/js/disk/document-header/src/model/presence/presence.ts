import { defineStore } from 'ui.vue3.pinia';

import { type PresenceParticipant, type PresenceState } from './types';

export const usePresenceStore = defineStore('diskDocumentHeaderPresence', {
	state: (): PresenceState => ({
		participants: [],
		revision: 0,
		isAvailable: false,
		scope: '',
	}),
	getters: {
		guest: (state: PresenceState): PresenceParticipant | null => {
			return state.participants.find((participant: PresenceParticipant) => participant.isGuest) ?? null;
		},
	},
	actions: {
		setParticipants(participants: PresenceParticipant[]): void
		{
			this.participants = participants;
		},
		setRevision(revision: number): void
		{
			this.revision = revision;
		},
		setAvailable(isAvailable: boolean): void
		{
			this.isAvailable = isAvailable;
		},
		setScope(scope: string): void
		{
			this.scope = scope;
		},
	},
});
