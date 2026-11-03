import { type SetupTemplateData } from 'bizproc.setup-template';

export type DigestSetupState = 'ready' | 'subscription_required' | 'hidden';

export type DigestSetupAvailability = {
	state: DigestSetupState,
	promoterCode?: string,
};

export type DigestSetupResult = DigestSetupAvailability & {
	setupTemplateData?: SetupTemplateData,
};

export type AiDigestSetupOptions = {
	dashboardId?: number,
	availability: DigestSetupAvailability,
	bridge?: ScreenStateBridge | null,
};

export type ScreenStateFilter = {
	extraFormData?: {
		time_range?: string,
		filters?: Array<{ [key: string]: unknown }>,
		[key: string]: unknown,
	},
	filterState?: { [key: string]: unknown },
};

// DTO-SCREEN-STATE-01: native filter id => the parts of its data mask the backend interprets.
export type ScreenState = { [filterId: string]: ScreenStateFilter };

export type ScreenStateBridge = {
	getDataMask: (signal?: AbortSignal) => Promise<unknown>,
};
