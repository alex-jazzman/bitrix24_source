/**
 * @module selector/widget/entity/catalog/store
 */
jn.define('selector/widget/entity/catalog/store', (require, exports, module) => {
	const { Loc } = require('loc');
	const { ErrorNotifier } = require('utils/error-notifier');
	const { BaseSelectorEntity } = require('selector/widget/entity');

	/**
	 * @class CatalogStoreSelector
	 */
	class CatalogStoreSelector extends BaseSelectorEntity
	{
		static getEntityId()
		{
			return 'store';
		}

		static getContext()
		{
			return 'catalog-store';
		}

		static getStartTypingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_START_TYPING_TO_SEARCH_STORE');
		}

		static getStartTypingWithCreationText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_START_TYPING_TO_CREATE_STORE');
		}

		static isCreationEnabled()
		{
			return true;
		}

		static getCreateText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_CREATE_STORE');
		}

		static getCreatingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_CREATING_STORE');
		}

		static getCreateEntityHandler(providerOptions)
		{
			return (text) => {
				return BX.ajax.runAction(
					'catalog.storeSelector.createStore',
					{
						json: { name: text },
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
				}).catch((response) => {
					ErrorNotifier.showErrors(response.errors);
				});
			};
		}

		static getTitle()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_PICK_STORE_2');
		}
	}

	module.exports = {
		CatalogStoreSelector,
	};
});

(() => {
	const require = (ext) => jn.require(ext);
	const { CatalogStoreSelector } = require('selector/widget/entity/catalog/store');

	this.CatalogStoreSelector = CatalogStoreSelector;
})();
