/**
 * @module selector/widget/entity/catalog/contractor
 */
jn.define('selector/widget/entity/catalog/contractor', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BaseSelectorEntity } = require('selector/widget/entity');

	/**
	 * @class CatalogContractorSelector
	 */
	class CatalogContractorSelector extends BaseSelectorEntity
	{
		static getEntityId()
		{
			return 'contractor';
		}

		static getContext()
		{
			return 'catalog-contractors';
		}

		static getStartTypingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_START_TYPING_TO_SEARCH_CONTRACTOR');
		}

		static getStartTypingWithCreationText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_START_TYPING_TO_CREATE_CONTRACTOR');
		}

		static isCreationEnabled()
		{
			return true;
		}

		static getCreateText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_CREATE_CONTRACTOR');
		}

		static getCreatingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_CREATING_CONTRACTOR');
		}

		static getCreateEntityHandler(providerOptions)
		{
			return (text) => {
				return BX.ajax.runAction(
					'catalog.contractor.createContractor',
					{
						data: {
							fields: {
								companyName: text,
							},
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
			return Loc.getMessage('SELECTOR_COMPONENT_PICK_CONTRACTOR_2');
		}
	}

	module.exports = {
		CatalogContractorSelector,
	};
});

(() => {
	const require = (ext) => jn.require(ext);
	const { CatalogContractorSelector } = require('selector/widget/entity/catalog/contractor');

	this.CatalogContractorSelector = CatalogContractorSelector;
})();
