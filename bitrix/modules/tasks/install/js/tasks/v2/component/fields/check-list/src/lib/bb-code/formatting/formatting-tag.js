import { FormattingTagRegExp } from '../const';

export class CheckListFormattingTag
{
	static createRegExp(): RegExp
	{
		return new RegExp(FormattingTagRegExp);
	}
}
