/** Values also identify rendered states in tests. */
export const LaunchState = Object.freeze({
	CardPending: 'ai-agents-card-pending',
	RefusalTariff: 'ai-agents-refusal-tariff',
	RefusalUnavailable: 'ai-agents-refusal-unavailable',
	RefusalPreparing: 'ai-agents-refusal-preparing',
	LaunchStarting: 'ai-agents-launch-starting',
	LaunchStarted: 'ai-agents-launch-started',
	LaunchNoSurface: 'ai-agents-launch-no-surface',
	LaunchFailed: 'ai-agents-launch-failed',
	LaunchTimeout: 'ai-agents-launch-timeout',
	LaunchPanelFailed: 'ai-agents-launch-panel-failed',
});

export const Availability = Object.freeze({
	Ready: 'ready',
	Tariff: 'tariff',
	Unavailable: 'unavailable',
	Preparing: 'preparing',
});

export const Severity = Object.freeze({
	Notice: 'notice',
	Error: 'error',
});

export const StatusAction = Object.freeze({
	None: 'none',
	Retry: 'ai-agents-launch-retry',
	ChatLink: 'ai-agents-launch-chat-link',
});

export type AvailabilityParams = {
	state: string,
	limitCode?: string,
};

export type StatusPresentation = {
	phraseId: string,
	action: string,
	severity: string,
};

const REFUSAL_STATE: { [code: string]: string } = Object.freeze({
	[Availability.Tariff]: LaunchState.RefusalTariff,
	[Availability.Unavailable]: LaunchState.RefusalUnavailable,
	[Availability.Preparing]: LaunchState.RefusalPreparing,
});

const PRESENTATION: { [state: string]: StatusPresentation } = Object.freeze({
	[LaunchState.RefusalTariff]: {
		phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_REFUSAL_TARIFF',
		action: StatusAction.None,
		severity: Severity.Error,
	},
	[LaunchState.RefusalUnavailable]: {
		phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_REFUSAL_UNAVAILABLE',
		action: StatusAction.None,
		severity: Severity.Error,
	},
	[LaunchState.RefusalPreparing]: {
		phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_REFUSAL_PREPARING',
		action: StatusAction.None,
		severity: Severity.Error,
	},
	[LaunchState.LaunchStarting]: {
		phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_LAUNCH_STARTING',
		action: StatusAction.None,
		severity: Severity.Notice,
	},
	[LaunchState.LaunchStarted]: {
		phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_LAUNCH_STARTED',
		action: StatusAction.None,
		severity: Severity.Notice,
	},
	[LaunchState.LaunchNoSurface]: {
		phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_LAUNCH_NO_SURFACE',
		action: StatusAction.None,
		severity: Severity.Error,
	},
	[LaunchState.LaunchFailed]: {
		phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_LAUNCH_FAILED',
		action: StatusAction.Retry,
		severity: Severity.Error,
	},
	[LaunchState.LaunchTimeout]: {
		phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_LAUNCH_TIMEOUT',
		action: StatusAction.Retry,
		severity: Severity.Error,
	},
	[LaunchState.LaunchPanelFailed]: {
		phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_LAUNCH_PANEL_FAILED',
		action: StatusAction.ChatLink,
		severity: Severity.Error,
	},
});

export const resolveRefusalState = (code: string): string | null => {
	return REFUSAL_STATE[code] ?? null;
};

export const resolveErrorState = (code: string): string => {
	return resolveRefusalState(code) ?? LaunchState.LaunchFailed;
};

export const getStatusPresentation = (state: string): StatusPresentation | null => {
	return PRESENTATION[state] ?? null;
};
