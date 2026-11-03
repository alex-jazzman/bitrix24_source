import { BBCodeScheme, BBCodeTagScheme } from 'ui.bbcode.model';

export const ChecklistFormattingAction = Object.freeze({
	Bold: 'bold',
	Italic: 'italic',
	Underline: 'underline',
	Strikethrough: 'strikethrough',
	Link: 'link',
});

export const FormattingTags = Object.freeze({
	[ChecklistFormattingAction.Bold]: {
		open: '[b]',
		close: '[/b]',
		type: 'bold',
	},
	[ChecklistFormattingAction.Italic]: {
		open: '[i]',
		close: '[/i]',
		type: 'italic',
	},
	[ChecklistFormattingAction.Underline]: {
		open: '[u]',
		close: '[/u]',
		type: 'underline',
	},
	[ChecklistFormattingAction.Strikethrough]: {
		open: '[s]',
		close: '[/s]',
		type: 'strikethrough',
	},
});

export const TagToFormattingAction = Object.freeze({
	b: ChecklistFormattingAction.Bold,
	i: ChecklistFormattingAction.Italic,
	u: ChecklistFormattingAction.Underline,
	s: ChecklistFormattingAction.Strikethrough,
	URL: ChecklistFormattingAction.Link,
});

export const UrlOpenPrefix = '[URL=';
export const UrlClose = '[/URL]';

export const FormattingTagRegExp = /\[(\/?)(b|i|u|s|url)(?:=[^\]]*)?]/gi;

export const createCheckListBbCodeTagSchemes = (options: { paragraph?: boolean } = {}): BBCodeTagScheme[] => {
	const paragraph = options.paragraph === true;

	return [
		new BBCodeTagScheme({
			name: ['b', 'u', 'i', 's'],
			group: ['#inline', '#format'],
			allowedChildren: ['#text', '#linebreak', '#inline'],
			canBeEmpty: false,
		}),
		new BBCodeTagScheme({
			name: ['url'],
			group: ['#inline'],
			allowedChildren: ['#text', '#linebreak', '#format'],
			canBeEmpty: false,
		}),
		...(paragraph ? [
			new BBCodeTagScheme({
				name: 'p',
				group: ['#block'],
				allowedChildren: ['#text', '#linebreak', '#inline'],
				allowedIn: ['#root'],
				onParse: BBCodeTagScheme.defaultOnBlockParseHandler,
			}),
		] : []),
		new BBCodeTagScheme({
			name: ['#root'],
			allowedChildren: ['#text', '#linebreak', '#inline', ...(paragraph ? ['p'] : [])],
		}),
		new BBCodeTagScheme({
			name: ['#text'],
		}),
		new BBCodeTagScheme({
			name: ['#linebreak'],
		}),
	];
};

export const CheckListBbCodeScheme = new BBCodeScheme({
	tagSchemes: createCheckListBbCodeTagSchemes(),
	outputTagCase: BBCodeScheme.Case.LOWER,
});
