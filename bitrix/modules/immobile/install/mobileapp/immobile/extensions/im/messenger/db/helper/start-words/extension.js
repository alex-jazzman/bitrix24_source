/**
 * @module 'im/messenger/db/helper/start-words'
 */
jn.define('im/messenger/db/helper/start-words', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * @param {string | Array<string>} fieldName
	 * @param searchText
	 * @returns {{sqlCondition: string, values: string[]}}
	 * @description this method are needed for improve search in Cyrillic locale with upper and lower cases
	 */
	function getStartWordsSearchVariants(fieldName, searchText)
	{
		const upperSearchCase = searchText.toLocaleUpperCase(env.languageId);
		const lowerSearchCase = searchText.toLocaleLowerCase(env.languageId);
		const withFirstLetterUpperCaseSearch = searchText.charAt(0).toLocaleUpperCase(env.languageId)
			+ searchText.slice(1).toLocaleLowerCase(env.languageId);

		const patterns = [
			`${searchText}%`,
			`% ${searchText}%`,
			`${upperSearchCase}%`,
			`% ${upperSearchCase}%`,
			`${lowerSearchCase}%`,
			`% ${lowerSearchCase}%`,
			`${withFirstLetterUpperCaseSearch}%`,
			`% ${withFirstLetterUpperCaseSearch}%`,
		];

		const fieldList = Type.isArray(fieldName) ? fieldName : [fieldName];
		const fieldConditions = fieldList.map((field) => {
			const likeConditions = patterns.map(() => `(${field}) LIKE ? COLLATE NOCASE`);

			return `(${likeConditions.join(' OR ')})`;
		});
		const sqlCondition = `(${fieldConditions.join(' OR ')})`;

		const values = [];
		fieldList.forEach(() => values.push(...patterns));

		return {
			sqlCondition,
			values,
		};
	}

	module.exports = {
		getStartWordsSearchVariants,
	};
});
