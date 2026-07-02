/**
 * @module selector/widget/entity/iblock/section
 */
jn.define('selector/widget/entity/iblock/section', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BaseSelectorEntity } = require('selector/widget/entity');

	/**
	 * @class IblockSectionSelector
	 */
	class IblockSectionSelector extends BaseSelectorEntity
	{
		static getEntityId()
		{
			return 'iblock-property-section';
		}

		static getContext()
		{
			return 'IBLOCK_SECTION';
		}

		static getStartTypingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_IBLOCK_SECTION_START_TYPING_TEXT');
		}

		static getTitle()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_IBLOCK_SECTION_TITLE');
		}

		static isCreationEnabled()
		{
			return false;
		}
	}

	module.exports = {
		IblockSectionSelector,
	};
});

(() => {
	const require = (ext) => jn.require(ext);
	const { IblockSectionSelector } = require('selector/widget/entity/iblock/section');

	this.IblockSectionSelector = IblockSectionSelector;
})();
