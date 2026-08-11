import { Type } from 'main.core';

type StateLike = {
	template?: ?{
		FILLED_PLACEHOLDERS?: ?Array<{ FIELD_NAME?: ?string }>,
	},
};

export class PlaceholderService
{
	/**
	 * Codes of placeholders that reached the body through the field selector — a filled placeholder
	 * carrying a FIELD_NAME. Only these `{code}` tokens are legitimate placeholders that must survive
	 * brace escaping; hand-typed braces and manual FIELD_VALUE fills are escaped. Derived purely from
	 * front-end editor state, so no placeholder list is loaded from the backend.
	 */
	getKnownCodes(state: ?StateLike): Array<string>
	{
		const filledPlaceholders = state?.template?.FILLED_PLACEHOLDERS;
		if (!Type.isArrayFilled(filledPlaceholders))
		{
			return [];
		}

		return filledPlaceholders
			.map((filledPlaceholder) => filledPlaceholder.FIELD_NAME)
			.filter((fieldName) => Type.isStringFilled(fieldName));
	}
}
