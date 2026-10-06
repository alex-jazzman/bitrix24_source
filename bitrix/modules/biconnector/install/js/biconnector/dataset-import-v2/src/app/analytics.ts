import type { AnalyticsOptions } from 'ui.analytics';
import { sendData } from 'ui.analytics';

export class Analytics
{
	private readonly sourceCode: string;

	constructor(sourceCode: string)
	{
		this.sourceCode = sourceCode;
	}

	send(params: Omit<AnalyticsOptions, 'tool' | 'category'>): void
	{
		if (!this.sourceCode)
		{
			return;
		}

		sendData({
			tool: 'BI_Builder',
			c_section: 'BI_Builder',
			category: this.sourceCode.toUpperCase(),
			...params,
		});
	}
}
