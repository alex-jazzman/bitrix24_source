import { Outline } from 'ui.icon-set.api.core';

/** Keys match the server scenario catalog. */
export const CardIcon: { readonly [cardId: string]: string } = Object.freeze({
	prepare_report: Outline.RESUME,
	configure_dashboard: Outline.GRAPHS_DIAGRAM,
	work_with_datasets: Outline.DATABASE,
	describe_metrics: Outline.SPEED_METER,
	find_anomalies: Outline.SEARCH,
	explain_trends: Outline.TREND_UP,
	prepare_insights: Outline.IDEA_LAMP,
	test_hypotheses: Outline.QUESTION,
});
