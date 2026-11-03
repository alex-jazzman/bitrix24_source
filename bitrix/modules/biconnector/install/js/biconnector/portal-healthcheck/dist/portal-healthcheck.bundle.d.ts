/* eslint-disable */
type MountOptions = {
	rootElement: HTMLElement;
	client?: BX.BIConnector.HealthcheckClient;
};

type HealthcheckSnapshot = {
	status: HealthcheckStatus;
	proxy?: HealthcheckCheck;
	nodes: HealthcheckCheck[];
	nodesCheck?: {
		status: string;
		code?: string;
	};
	nextAllowedAt?: string;
	resultDeadline?: string;
	errorCode?: string;
	retryAfter?: number;
	checkedAt?: string;
};

type HealthcheckStatus = 'IDLE' | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'PORTAL_UNAVAILABLE' | 'NODES_CHECK_REJECTED' | 'RESULT_MISSING' | 'FAILED';

type HealthcheckCheck = {
	status: 'SUCCESS' | 'FAILED';
	httpCode?: number;
	address?: string;
	egressAddresses?: string[];
	node?: string;
	publicHost?: string;
	remoteIp?: string;
	latencyMs?: number;
	errors?: Array<{
		code: string;
		message?: string;
	}>;
};

declare namespace BX.BIConnector {
	class PortalHealthcheck {
		static mount(options: MountOptions): PortalHealthcheck;
		constructor({ rootElement, client }: MountOptions);
		renderSnapshot(snapshot: HealthcheckSnapshot): void;
		destroy(): void;
	}

	class HealthcheckClient {
		get(): Promise<HealthcheckSnapshot>;
		start(): Promise<HealthcheckSnapshot>;
	}

	function mountPortalHealthcheck(rootElement: HTMLElement): PortalHealthcheck;
}
