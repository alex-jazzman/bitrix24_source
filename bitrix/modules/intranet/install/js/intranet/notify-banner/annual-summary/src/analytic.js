import { AnalyticsOptions, sendData } from 'ui.analytics';

export class Analytic
{
	#section: string;

	constructor(options: {})
	{
		this.#section = options.section ?? '';
	}

	send(options: AnalyticsOptions): void
	{
		sendData({
			...options,
			category: 'year_summary',
			tool: 'intranet',
			c_section: this.#section,
		});
	}

	next(stepId: string, type: string): void
	{
		this.send({
			event: 'next_click',
			p1: stepId,
			type,
		});
	}

	prev(stepId: string, type: string): void
	{
		this.send({
			event: 'prev_click',
			p1: stepId,
			type,
		});
	}

	share(stepId: string, type: string): void
	{
		this.send({
			event: 'share_click',
			p1: stepId,
			type,
		});
	}

	save(stepId: string, type: string): void
	{
		this.send({
			event: 'save_click',
			p1: stepId,
			type,
		});
	}

	close(stepId: string, type: string): void
	{
		this.send({
			event: 'close_click',
			p1: stepId,
			type,
		});
	}

	show(stepId: string, type: string): void
	{
		this.send({
			event: 'popup_show',
			p1: stepId,
			type,
		});
	}
}
