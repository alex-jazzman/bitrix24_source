import { BBCodeScheme, BBCodeTagScheme } from 'ui.bbcode.model';

export class ParserScheme extends BBCodeScheme
{
	getTagScheme(tagName: string): BBCodeTagScheme
	{
		return new BBCodeTagScheme({
			name: 'any',
		});
	}

	isAllowedTag(tagName: string): boolean
	{
		return true;
	}
}
