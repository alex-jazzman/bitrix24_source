export class BBCodeEncoder
{
	encodeText(source: string): string
	{
		return String(source)
			.replaceAll('[', '&#91;')
			.replaceAll(']', '&#93;');

		// return String(source)
		// 	.replaceAll('&', '&amp;')
		// 	.replaceAll('[', '&#91;')
		// 	.replaceAll(']', '&#93;')
		// 	.replaceAll('\'', '&#39;')
		// 	.replaceAll('"', '&quot;')
		// 	.replaceAll('<', '&lt;')
		// 	.replaceAll('>', '&gt;');
	}

	decodeText(source: string): string
	{
		return String(source)
			.replaceAll('&#91;', '[')
			.replaceAll('&#93;', ']');

		// return String(source)
		// 	.replaceAll('&#91;', '[')
		// 	.replaceAll('&#93;', ']')
		// 	.replaceAll('&#39;', '\'')
		// 	.replaceAll('&quot;', '"')
		// 	.replaceAll('&lt;', '<')
		// 	.replaceAll('&gt;', '>')
		// 	.replaceAll('&amp;', '&');
	}

	encodeAttribute(source: string): string
	{
		return this.encodeText(source);
	}

	decodeAttribute(source: string): string
	{
		return this.decodeText(source);
	}
}
