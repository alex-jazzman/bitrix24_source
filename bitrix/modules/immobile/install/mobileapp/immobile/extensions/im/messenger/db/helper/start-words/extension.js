/**
 * @module im/messenger/db/helper/start-words
 */
jn.define('im/messenger/db/helper/start-words', (require, exports, module) => {
	const { Type } = require('type');
	const { or } = require('im/messenger/db/query-builder/condition');

	/**
	 * @param {StringField | Array<StringField>} field
	 * @param {string} searchText
	 * @return {Condition | null}
	 */
	function getStartWordsSearchCondition(field, searchText)
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

		const fieldList = Type.isArray(field) ? field : [field];
		const likeConditions = [];
		fieldList.forEach((fieldItem) => {
			patterns.forEach((pattern) => {
				likeConditions.push(fieldItem.like(pattern));
			});
		});

		return or(...likeConditions);
	}

	module.exports = {
		getStartWordsSearchCondition,
	};
});
