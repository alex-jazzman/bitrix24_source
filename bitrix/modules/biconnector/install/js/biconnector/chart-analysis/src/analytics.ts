import { type AnalyticsOptions, sendData as uiSendData } from 'ui.analytics';

import { type BxPreviousStatus } from './types';

const TOOL = 'BI_Builder';
const CATEGORY = 'ai_agents';
const SECTION = 'chart_analysis';
const MAX_CODE_LENGTH = 50;
const OTHER_CODE = 'other';

export type AnalyticsEvent =
	| 'click'
	| 'subscription_open'
	| 'no_data'
	| 'too_large'
	| 'analyze_error'
	| 'launch_error'
	| `previous_${NonNullable<BxPreviousStatus>}`
;

export type AnalyticsEventOptions = {
	vizType?: string;
	status?: string;
};

export type ChartAnalysisAnalytics = {
	send: (event: AnalyticsEvent, options: AnalyticsEventOptions) => void;
	sendPreviousStatus: (previousStatus: BxPreviousStatus, vizType?: string) => void;
};

type SendData = (data: AnalyticsOptions) => void;

// Only codes go to analytics: chart names, filters and data never leave the card.
function normalizeCode(value: string | undefined): string
{
	const code = String(value ?? '').toLowerCase();

	return /^[\d_a-z]+$/.test(code) && code.length <= MAX_CODE_LENGTH ? code : OTHER_CODE;
}

export function createAnalytics(sendData: SendData = uiSendData): ChartAnalysisAnalytics
{
	const send = (event: AnalyticsEvent, options: AnalyticsEventOptions): void => {
		const data: AnalyticsOptions = {
			tool: TOOL,
			category: CATEGORY,
			event,
			c_section: SECTION,
			c_element: normalizeCode(options.vizType),
		};

		if (options.status !== undefined)
		{
			data.type = normalizeCode(options.status);
		}

		sendData(data);
	};

	return {
		send,
		sendPreviousStatus: (previousStatus, vizType) => {
			if (previousStatus !== null)
			{
				send(`previous_${previousStatus}`, { vizType });
			}
		},
	};
}

export const analytics = createAnalytics();
