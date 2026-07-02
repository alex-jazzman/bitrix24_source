/**
 * @module selector/widget/entity/iblock/section-user-field
 */
jn.define('selector/widget/entity/iblock/section-user-field', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BaseSelectorEntity } = require('selector/widget/entity');

	/**
	 * @class IblockSectionUserFieldSelector
	 */
	class IblockSectionUserFieldSelector extends BaseSelectorEntity
	{
		static getEntityId()
		{
			return 'iblock-section-user-field';
		}

		static getContext()
		{
			return 'USER_FIELD';
		}

		static getStartTypingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_START_TYPING_TO_SEARCH_IBLOCK_SECTION');
		}

		static getTitle()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_PICK_IBLOCK_SECTION');
		}

		static isCreationEnabled()
		{
			return false;
		}
	}

	module.exports = {
		IblockSectionUserFieldSelector,
	};
});

(() => {
	const require = (ext) => jn.require(ext);
	const { IblockSectionUserFieldSelector } = require('selector/widget/entity/iblock/section-user-field');

	this.IblockSectionUserFieldSelector = IblockSectionUserFieldSelector;
})();
