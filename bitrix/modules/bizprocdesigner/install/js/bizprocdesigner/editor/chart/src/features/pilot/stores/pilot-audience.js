import { Type } from 'main.core';
import { defineStore } from 'ui.vue3.pinia';

import { pilotApi, type PilotAudienceEntry } from '../api/pilot-api';

export type PilotAudienceState = {
	audience: Array<PilotAudienceEntry>,
};

/**
 * Who the pilot is running for, in one place: the composition kept by the server and the composition
 * chosen in the dialog are the same read-model, so no surface of the editor holds a copy of its own.
 * Nothing of it travels back with the scheme - the publication and the change of the audience send the
 * chosen codes themselves.
 */
export const usePilotAudienceStore = defineStore('bizprocdesigner-editor-pilot-audience', {
	state: (): PilotAudienceState => ({
		audience: [],
	}),
	getters: {
		// The audience travels to the server as access codes alone: the composition read from it also
		// carries titles and availability, and an element without a code is not part of an audience.
		accessCodes: (state: PilotAudienceState): Array<string> => state.audience
			.map((entry: PilotAudienceEntry) => (Type.isStringFilled(entry) ? entry : entry?.accessCode))
			.filter((accessCode: ?string) => Type.isStringFilled(accessCode))
		,
	},
	actions: {
		setAudience(audience: Array<PilotAudienceEntry>): void
		{
			this.audience = Type.isArray(audience) ? [...audience] : [];
		},
		// The composition belongs to the pilot it was chosen for. Once that pilot is over, the next
		// publication is a new one and starts from an empty list instead of the composition of a pilot
		// that is not running any more. A refused operation is not the end of a pilot: the composition
		// chosen for it stays, so a refusal never costs the publisher the choice again.
		clearAudience(): void
		{
			this.setAudience([]);
		},
		// The composition of a live pilot is read anew every time it is about to be shown: the answer of
		// the diagram carries the size of the audience and not the audience itself, and a change made in
		// another tab must not be edited over a stale list.
		async loadAudience(templateId: number): Promise<void>
		{
			this.setAudience(await pilotApi.getAudience(templateId));
		},
	},
});
