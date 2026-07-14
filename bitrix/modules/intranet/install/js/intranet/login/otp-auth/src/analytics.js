import { type AnalyticsOptions, sendData } from 'ui.analytics';

type OtpAnalyticsEventOptions = {
	event: string,
	c_section?: string,
	c_sub_section?: string,
	c_element?: string,
	type?: string,
	p1?: string,
	p2?: string,
	p3?: string,
	p4?: string,
	p5?: string,
	status?: 'success' | 'error' | 'attempt' | 'cancel',
};

let userId: ?number = null;

export function configureOtpAnalytics(options: { userId?: number } = {}): void
{
	const normalizedUserId = Number(options.userId);
	userId = Number.isFinite(normalizedUserId) && normalizedUserId > 0 ? normalizedUserId : null;
}

export function prepareOtpAnalyticsData(data: OtpAnalyticsEventOptions): AnalyticsOptions
{
	const preparedData = {
		tool: 'security',
		category: 'fa_auth_form',
		...data,
	};

	if (userId !== null)
	{
		preparedData.p5 = String(userId);
	}

	return preparedData;
}

export function sendOtpAnalytics(data: OtpAnalyticsEventOptions): void
{
	sendData(prepareOtpAnalyticsData(data));
}
