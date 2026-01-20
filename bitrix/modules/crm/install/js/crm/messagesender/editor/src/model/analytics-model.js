import { BuilderModel } from 'ui.vue3.vuex';
import { type Logger } from '../service/logger';

type AnalyticsState = {
	analytics: {
		c_section: ?string,
		c_sub_section: ?string,
	},
};

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
				c_section: this.getVariable('analytics.c_section', null),
				c_sub_section: this.getVariable('analytics.c_sub_section', null),
			},
		};
	}
}
