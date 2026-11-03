/* eslint-disable */
type AiAgentsSectionParams = {
	containerId: string;
	cardIds: string[];
	availability: AvailabilityParams;
};

type AvailabilityParams = {
	state: string;
	limitCode?: string;
};

type RightPanelSurface = {
	isExpanded: () => boolean;
	preload: () => Promise<unknown>;
	expand: (params: {
		chatId: number;
	}) => void;
	subscribeOnce: (eventName: string, listener: () => void) => unknown;
	unsubscribe: (eventName: string, listener: () => void) => unknown;
};

declare namespace BX.BIConnector {
	class AiAgentsSection {
		constructor(container: HTMLElement, params: AiAgentsSectionParams, rightPanel: RightPanel);
		static init(params: AiAgentsSectionParams, rightPanel?: RightPanel): AiAgentsSection | null;
		destroy(): void;
	}

	class RightPanel {
		constructor(surface?: RightPanelSurface | null);
		hasSurface(): boolean;
		preload(): void;
		show(chatId: number): Promise<string>;
	}

	const PanelOutcome: Readonly<{
		NoSurface: "no_surface";
		Shown: "shown";
		PanelFailed: "panel_failed";
	}>;

	const Availability: Readonly<{
		Ready: "ready";
		Tariff: "tariff";
		Unavailable: "unavailable";
		Preparing: "preparing";
	}>;

	/** Values also identify rendered states in tests. */
	const LaunchState: Readonly<{
		CardPending: "ai-agents-card-pending";
		RefusalTariff: "ai-agents-refusal-tariff";
		RefusalUnavailable: "ai-agents-refusal-unavailable";
		RefusalPreparing: "ai-agents-refusal-preparing";
		LaunchStarting: "ai-agents-launch-starting";
		LaunchStarted: "ai-agents-launch-started";
		LaunchNoSurface: "ai-agents-launch-no-surface";
		LaunchFailed: "ai-agents-launch-failed";
		LaunchTimeout: "ai-agents-launch-timeout";
		LaunchPanelFailed: "ai-agents-launch-panel-failed";
	}>;

	const StatusAction: Readonly<{
		None: "none";
		Retry: "ai-agents-launch-retry";
		ChatLink: "ai-agents-launch-chat-link";
	}>;

	/** Keys match the server scenario catalog. */
	const CardIcon: {
		readonly [cardId: string]: string;
	};
}
