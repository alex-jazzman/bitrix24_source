import { type AnalyticsOptions } from 'ui.analytics';

import { AnalyticsTool, AnalyticsCategory } from 'booking.const';

type AiCallBannerAnalyticsOptions = AnalyticsOptions & {
	tool: $Values<typeof AnalyticsTool>,
	category: $Values<typeof AnalyticsCategory>,
}

export type BannerViewAiCallAnalyticsOptions =
	& Omit<AiCallBannerAnalyticsOptions, 'c_section' | 'c_sub_section' | 'c_element' | 'status' | 'p1' | 'p2' | 'p3' | 'p4' | 'p5'>
	& {
	event: 'banner_view',
	type: 'ai_inform',
};

export type BannerClickAiCallAnalyticsOptions =
	& Omit<AiCallBannerAnalyticsOptions, 'c_section' | 'c_sub_section' | 'status' | 'p1' | 'p2' | 'p3' | 'p4' | 'p5'>
	& {
	event: 'banner_click',
	type: 'ai_inform',
	c_element: 'start_flow',
};

export type BannerCloseAiCallAnalyticsOptions =
	& Omit<AiCallBannerAnalyticsOptions, 'c_section' | 'c_sub_section' | 'status' | 'p1' | 'p2' | 'p3' | 'p4' | 'p5'>
	& {
	event: 'banner_close',
	type: 'ai_inform',
	c_element: 'skip_button' | 'close_button',
};
