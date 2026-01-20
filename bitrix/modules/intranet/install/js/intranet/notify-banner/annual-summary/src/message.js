export type SummaryMessageOptions = {
	title: string,
	description: string,
}

export class Message
{
	title: string;
	description: string;

	constructor(options: SummaryMessageOptions)
	{
		this.title = options.title;
		this.description = options.description;
	}
}
