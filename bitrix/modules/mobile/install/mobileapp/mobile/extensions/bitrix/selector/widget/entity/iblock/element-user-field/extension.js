/**
 * @module selector/widget/entity/iblock/element-user-field
 */
jn.define('selector/widget/entity/iblock/element-user-field', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BaseSelectorEntity } = require('selector/widget/entity');

	/**
	 * @class IblockElementUserFieldSelector
	 */
	class IblockElementUserFieldSelector extends BaseSelectorEntity
	{
		static getEntityId()
		{
			return 'iblock-element-user-field';
		}

		static getContext()
		{
			return 'USER_FIELD';
		}

		static getStartTypingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_START_TYPING_TO_SEARCH_IBLOCK_ELEMENT');
		}

		static getTitle()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_PICK_IBLOCK_ELEMENT');
		}

		static isCreationEnabled()
		{
			return false;
		}
	}

	module.exports = {
		IblockElementUserFieldSelector,
	};
});

(() => {
	const require = (ext) => jn.require(ext);
	const { IblockElementUserFieldSelector } = require('selector/widget/entity/iblock/element-user-field');

	this.IblockElementUserFieldSelector = IblockElementUserFieldSelector;
})();
