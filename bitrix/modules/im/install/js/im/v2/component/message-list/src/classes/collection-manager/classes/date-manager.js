import { DateFormatter, DateTemplate } from 'im.v2.lib.date-formatter';

export type DateGroup = { id: number, title: string };

export class DateManager
{
	cachedDateGroups: { [shortDate: string]: string } = {};

	getDateTitle(date: Date): string
	{
		const INDEX_BETWEEN_DATE_AND_TIME = 10;
		// 2022-10-25T14:58:44.000Z => 2022-10-25
		const shortDate = date.toJSON().slice(0, INDEX_BETWEEN_DATE_AND_TIME);
		if (this.cachedDateGroups[shortDate])
		{
			return this.cachedDateGroups[shortDate];
		}

		this.cachedDateGroups[shortDate] = DateFormatter.formatByTemplate(date, DateTemplate.dateGroup);

		return this.cachedDateGroups[shortDate];
	}
}
