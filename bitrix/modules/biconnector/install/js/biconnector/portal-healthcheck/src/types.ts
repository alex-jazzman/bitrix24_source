export type HealthcheckStatus =
	| 'IDLE'
	| 'PENDING'
	| 'RUNNING'
	| 'COMPLETED'
	| 'PORTAL_UNAVAILABLE'
	| 'NODES_CHECK_REJECTED'
	| 'RESULT_MISSING'
	| 'FAILED';

export type HealthcheckCheck = {
	status: 'SUCCESS' | 'FAILED';
	httpCode?: number;
	address?: string;
	egressAddresses?: string[];
	node?: string;
	publicHost?: string;
	remoteIp?: string;
	latencyMs?: number;
	errors?: Array<{ code: string; message?: string }>;
};

export type HealthcheckSnapshot = {
	status: HealthcheckStatus;
	proxy?: HealthcheckCheck;
	nodes: HealthcheckCheck[];
	nodesCheck?: { status: string; code?: string };
	nextAllowedAt?: string;
	resultDeadline?: string;
	errorCode?: string;
	retryAfter?: number;
	checkedAt?: string;
};

export type StatusTone = 'neutral' | 'progress' | 'success' | 'warning' | 'error';
