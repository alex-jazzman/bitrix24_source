declare type HealthStatus = {
	result: 'error' | 'ok',
	info: string,
	id?: string,
	statusInfo?: string,
	statusInfoClear?: string, // without html
	statusTitle?: string,
};
