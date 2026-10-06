/* eslint-disable */
type ApplicationLimitDto = {
	limit: ApplicationLimit;
	transition?: ApplicationLimitTransition;
	actions: ApplicationLimitAction[];
};

type ApplicationLimit = {
	state: ApplicationLimitState;
	count: number | null;
	limit: number | null;
	configuredLimit?: number | null;
	exceeded: boolean | null;
	installationBlocked: boolean | null;
};

type ApplicationLimitState = 'finite' | 'unlimited' | 'notApplicable' | 'unknown';

type ApplicationLimitTransition = {
	active: boolean;
	endsAt: number | null;
};

type ApplicationLimitAction = {
	type: ApplicationLimitActionType;
	target: string;
};

type ApplicationLimitActionType = 'list' | 'trial' | 'buy';

declare namespace BX.Market {
	function showVibePlusApplicationLimitPopup(dto: ApplicationLimitDto | null | undefined): boolean;

	function showVibePlusApplicationLimitPopupPreview(dto: ApplicationLimitDto | null | undefined): boolean;

	function scheduleVibePlusApplicationLimitPopup(dto: ApplicationLimitDto | null | undefined): boolean;

	function isApplicationInstallationBlocked(dto: ApplicationLimitDto | null | undefined): dto is ApplicationLimitDto;

	function isApplicationLimitExceeded(dto: ApplicationLimitDto | null | undefined): dto is ApplicationLimitDto;
}
