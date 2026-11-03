import { Type } from 'main.core';

type TitledUserField = {
	data: {
		editFormLabel?: { [language: string]: string },
	},
};

/**
 * The editor of a user field writes the title only for the language of the current user, while the
 * field is read in every language of the portal. An empty title is spread nowhere: the editor keeps
 * the title it opened with when its input is left empty, and nothing of an empty input must replace
 * it in the other languages.
 */
export const spreadTitleToLanguages = (
	userField: TitledUserField,
	languageId: string,
	languages: ?{ [language: string]: any },
): void => {
	const title = userField.data.editFormLabel?.[languageId];
	if (!Type.isStringFilled(title))
	{
		return;
	}

	Object.keys(languages ?? {}).forEach((language) => {
		userField.data.editFormLabel[language] = title;
	});
};
