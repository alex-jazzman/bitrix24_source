const MENTION_REGEX = /^([+@])(\p{L}+)?$/u;

export class MentionMatcher
{
	static match(text: string, startMatchPosition: number, currentPosition: number): string
	{
		const afterPositionText = text.slice(startMatchPosition, currentPosition);
		const match = MENTION_REGEX.exec(afterPositionText);

		return match ? match[0] : '';
	}
}
