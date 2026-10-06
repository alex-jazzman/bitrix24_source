import { Type } from 'main.core';

import { post } from '../../../shared/api';
import type { PilotState } from '../../../shared/types';

/**
 * An element of an audience, in one shape for the whole feature: the access code is what makes an
 * element, and an element chosen in the dialog is nothing but its code. The title and the availability
 * are what the server knows about the element it keeps, so an element built from a bare code has
 * neither.
 */
export type PilotAudienceMember = {
	accessCode: string,
	title?: string,
	available?: boolean,
};

/**
 * An element of the audience as the server describes it (API-02): it names the entity behind the code
 * and always carries the title and the availability. An element that has been deleted or has become
 * unreachable comes with `available: false` instead of being dropped.
 */
export type PilotAudienceItem = PilotAudienceMember & {
	entityType: string,
	entityId: number,
};

// What an audience is made of wherever it is held: an element read from the server, or the bare code of
// an element chosen in the dialog - the dialog answers with codes alone.
export type PilotAudienceEntry = PilotAudienceMember | string;

/**
 * The operations over a live pilot, transport only. It is a thin layer over the shared post(): the
 * refusals travel on as the typed ApiError, so the reading of errors[] stays in one place.
 */
export const pilotApi = {
	getAudience: async (templateId: number): Promise<Array<PilotAudienceItem>> => {
		const data = await post('Diagram.getPilotAudience', { templateId });

		return Type.isArray(data?.audience) ? data.audience : [];
	},
	// The scheme is not published again and the canvas does not change: the answer renews the state of
	// the pilot and nothing else.
	changeAudience: async (templateId: number, pilotId: number, audience: Array<string>): Promise<?PilotState> => {
		const data = await post('Diagram.changePilotAudience', { templateId, pilotId, audience });

		return data?.pilot ?? null;
	},
	// `draftSaved` tells what became of the pilot scheme: it is kept as a draft, unless the template
	// already had one - then the scheme is deleted and the draft stays as it was.
	stop: async (templateId: number, pilotId: number, confirmations: Array<string>): Promise<{ draftSaved: boolean }> => {
		const data = await post('Diagram.stopPilot', { templateId, pilotId, confirmations });

		return { draftSaved: data?.draftSaved === true };
	},
};
