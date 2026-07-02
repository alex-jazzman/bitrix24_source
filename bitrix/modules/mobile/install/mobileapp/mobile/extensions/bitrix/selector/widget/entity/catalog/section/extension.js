/**
 * @module selector/widget/entity/catalog/section
 */
jn.define('selector/widget/entity/catalog/section', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BaseSelectorEntity } = require('selector/widget/entity');

	/**
	 * @class CatalogSectionSelector
	 */
	class CatalogSectionSelector extends BaseSelectorEntity
	{
		static getEntityId()
		{
			return 'section';
		}

		static getContext()
		{
			return 'catalog-sections';
		}

		static getStartTypingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_START_TYPING_TO_SEARCH_SECTION');
		}

		static getStartTypingWithCreationText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_START_TYPING_TO_CREATE_SECTION');
		}

		static isCreationEnabled()
		{
			return true;
		}

		static getCreateText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_CREATE_SECTION');
		}

		static getCreatingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_CREATING_SECTION');
		}

		static getCreateEntityHandler(providerOptions)
		{
			return (text) => {
				return BX.ajax.runComponentAction(
					'bitrix:catalog.productcard.iblocksectionfield',
					'addSection',
					{
						mode: 'ajax',
						data: {
							iblockId: providerOptions.iblockId,
							name: text,
						},
					},
				).then((response) => {
					if (response.data && response.data.id)
					{
						return {
							id: response.data.id,
							entityId: this.getEntityId(),
							title: text,
						};
					}

					return null;
				}).catch((response) => console.error(response));
			};
		}

		static getTitle()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_PICK_SECTION_2');
		}
	}

	module.exports = {
		CatalogSectionSelector,
	};
});

(() => {
	const require = (ext) => jn.require(ext);
	const { CatalogSectionSelector } = require('selector/widget/entity/catalog/section');

	this.CatalogSectionSelector = CatalogSectionSelector;
})();
