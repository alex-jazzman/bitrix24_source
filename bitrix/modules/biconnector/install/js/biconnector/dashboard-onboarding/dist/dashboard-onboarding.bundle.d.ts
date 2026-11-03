/* eslint-disable */
type DashboardOnboardingOptions = {
	config: DashboardOnboardingConfig;
	frameNode: HTMLElement;
	isEmbedReady: () => boolean;
	onEditRequested: () => void;
};

type DashboardOnboardingConfig = {
	mode: string;
	steps: string[];
	canRestart: boolean;
};

declare namespace BX.BIConnector {
	/**
	 * Walks a first time visitor of a BI report through its abilities. The steps of the report
	 * header are portal nodes; the steps living inside the embedded report are covered by a band
	 * of the frame, and a step with no band described drops out of the queue.
	 */
	class DashboardOnboarding {
		constructor(options: DashboardOnboardingOptions);
		canRestart(): boolean;
		/**
		 * The report page reinitializes the embed when another report is picked in the header
		 * selector; the onboarding is decided per page load and does not start a second time.
		 */
		start(): Promise<void>;
		/**
		 * A manual run records nothing, so an automatic one it replaces has to be closed off first -
		 * otherwise the tour would greet the visitor again on the next visit.
		 */
		restart(): Promise<void>;
		destroy(): void;
	}

	const OnboardingMode: Readonly<{
		Tour: "tour";
		EmptyDashboardCta: "emptyDashboard";
		None: "none";
	}>;

	const StepId: Readonly<{
		Filters: "filters";
		Presets: "presets";
		Info: "info";
		Share: "share";
		BitrixGpt: "bitrixgpt";
		Edit: "edit";
	}>;
}
