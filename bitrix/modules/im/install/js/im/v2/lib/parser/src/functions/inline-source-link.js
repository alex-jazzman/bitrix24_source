type TextSegment = { type: 'text', value: string };
type SourceSegment = { type: 'source', id: string, text: string };

type RegExpMatchArray =Array<string> & {
	index: number,
	input: string,
	groups: ?{ [string]: string },
};

export type ParserInlineSourceLinkSegments = Array<TextSegment | SourceSegment>;

const SOURCE_REGEX = /\[source=(?<sourceId>\d+)](?<sourceText>.*?)\[\/source]/gi;

export const ParserInlineSourceLink = {
	purify(text: string): string
	{
		return text.replaceAll(
			SOURCE_REGEX,
			(whole, sourceId, sourceText) => sourceText,
		);
	},

	getSegments(text: string): ParserInlineSourceLinkSegments
	{
		const result = [];
		let lastIndex = 0;

		for (const match of text.matchAll(SOURCE_REGEX))
		{
			const hasTextBeforeSource = match.index > lastIndex;
			if (hasTextBeforeSource)
			{
				const textSegment = getTextSegment(text, lastIndex, match.index);
				if (textSegment)
				{
					result.push(textSegment);
				}
			}

			result.push(getSourceSegment(match));

			lastIndex = match.index + match[0].length;
		}

		const hasTrailingText = lastIndex < text.length;
		if (hasTrailingText)
		{
			const segment = getTextSegment(text, lastIndex, text.length);
			if (segment)
			{
				result.push(segment);
			}
		}

		return result;
	},
};

function getTextSegment(text: string, from: number, to: number): ?TextSegment
{
	const value = text.slice(from, to);
	if (value.trim().length > 0)
	{
		return { type: 'text', value };
	}

	return null;
}

function getSourceSegment(match: RegExpMatchArray): SourceSegment
{
	return { type: 'source', id: match.groups.sourceId, text: match.groups.sourceText };
}
