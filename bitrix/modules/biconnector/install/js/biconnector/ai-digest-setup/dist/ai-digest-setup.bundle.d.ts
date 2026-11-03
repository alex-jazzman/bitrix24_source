/* eslint-disable */
type AiDigestSetupOptions = {
	dashboardId?: number;
	availability: DigestSetupAvailability;
	bridge?: ScreenStateBridge | null;
};

type DigestSetupAvailability = {
	state: DigestSetupState;
	promoterCode?: string;
};

type DigestSetupState = 'ready' | 'subscription_required' | 'hidden';

type ScreenStateBridge = {
	getDataMask: (signal?: AbortSignal) => Promise<unknown>;
};

type AiDigestOnboardingOptions = {
	version: 'v1';
	availability: DigestSetupAvailability;
};

type ScreenState = {
	[filterId: string]: ScreenStateFilter;
};

type ScreenStateFilter = {
	extraFormData?: {
		time_range?: string;
		filters?: Array<{
			[key: string]: unknown;
		}>;
		[key: string]: unknown;
	};
	filterState?: {
		[key: string]: unknown;
	};
};

declare namespace BX.BIConnector {
	class AiDigestSetup {
		static open(options: AiDigestSetupOptions): Promise<void>;
	}

	class AiDigestOnboarding {
		static enqueue(options: AiDigestOnboardingOptions): void;
	}
}
