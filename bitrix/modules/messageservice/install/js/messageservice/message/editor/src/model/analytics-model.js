import { BuilderModel } from 'ui.vue3.vuex';
import { type Analytics } from '../editor';
import { type Logger } from '../service/logger';

type AnalyticsState = Analytics;

export class AnalyticsModel extends BuilderModel
{
	#logger: Logger;

	getName(): string
	{
		return 'analytics';
	}

	setLogger(logger: Logger): this
	{
		this.#logger = logger;

		return this;
	}

	getState(): AnalyticsState
	{
		return {
			analytics: {
				tool: this.getVariable('analytics.tool', 'messageservice'),
				c_section: this.getVariable('analytics.c_section', null),
				c_sub_section: this.getVariable('analytics.c_sub_section', null),
				p1: this.getVariable('analytics.p1', null),
			},
		};
	}
}
