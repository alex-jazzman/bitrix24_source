import { Type } from 'main.core';

export function getPlainText(templateBody: string, placeholders: Array, filledPlaceholders: Array): string
{
	let result = templateBody;

	if (Type.isArrayFilled(filledPlaceholders))
	{
		filledPlaceholders.forEach((filledPlaceholder) => {
			if (Type.isStringFilled(filledPlaceholder.FIELD_NAME))
			{
				result = result.replace(filledPlaceholder.PLACEHOLDER_ID, `{${filledPlaceholder.FIELD_NAME}}`);
			}
			else if (Type.isStringFilled(filledPlaceholder.FIELD_VALUE))
			{
				const fieldValue = filledPlaceholder.FIELD_VALUE
					.replaceAll('{', '&#123;')
					.replaceAll('}', '&#125;')
				;
				result = result.replace(filledPlaceholder.PLACEHOLDER_ID, fieldValue);
			}
		});
	}

	if (Type.isArrayFilled(placeholders))
	{
		placeholders.forEach((placeholder) => {
			result = result.replace(placeholder, ' ');
		});
	}

	return result;
}
