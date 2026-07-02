/**
 * @module selector/widget/entity/iblock/element
 */
jn.define('selector/widget/entity/iblock/element', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BaseSelectorEntity } = require('selector/widget/entity');

	/**
	 * @class IblockElementSelector
	 */
	class IblockElementSelector extends BaseSelectorEntity
	{
		static getEntityId()
		{
			return 'iblock-property-element';
		}

		static getContext()
		{
			return 'IBLOCK_ELEMENT';
		}

		static getStartTypingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_IBLOCK_ELEMENT_START_TYPING_TEXT');
		}

		static getTitle()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_IBLOCK_ELEMENT_TITLE');
		}

		static isCreationEnabled()
		{
			return false;
		}
	}

	module.exports = {
		IblockElementSelector,
	};
});

(() => {
	const require = (ext) => jn.require(ext);
	const { IblockElementSelector } = require('selector/widget/entity/iblock/element');

	this.IblockElementSelector = IblockElementSelector;
})();
