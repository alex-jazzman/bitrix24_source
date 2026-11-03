/* eslint-disable */
type DemoConfig = {
	containerId: string;
	reportCode: string;
	title: string;
	dashboardId: number;
};

type DemoCredentials = {
	uuid: string;
	guestToken: string;
	supersetDomain: string;
};

type DemoCredentialsData = {
	state: string;
	credentials: DemoCredentials | null;
};

declare namespace BX.BIConnector.ApacheSuperset.Dashboard {
	class DemoInstance {
		constructor(config: DemoConfig);
	}

	function initDemoLabelHint(containerId: string): void;
}
