/**
 * @module mail/selector/entity/addressbook
 */
jn.define('mail/selector/entity/addressbook', (require, exports, module) => {
	const { BaseSelectorEntity } = require('selector/widget/entity');
	const { get } = require('utils/object');
	const AppTheme = require('apptheme');
	const DEFAULT_ICON = `/bitrix/mobileapp/mailmobile/extensions/mail/assets/icons/${AppTheme.id}/selector-item-addressbook.svg`;
	const { AddAddress } = require('mail/addressbook/add-address');
	/**
	 * @class MailAddressBookSelector
	 */
	class MailAddressBookSelector extends BaseSelectorEntity
	{
		static getEntityId()
		{
			return 'address_book';
		}

		static isCreationEnabled()
		{
			return true;
		}

		static getCreateText()
		{
			return BX.message('SELECTOR_COMPONENT_TITLE_ADDRESS_BOOK_CREATE');
		}

		static getCreatingText()
		{
			return BX.message('SELECTOR_COMPONENT_TITLE_ADDRESS_BOOK_CREATE');
		}

		static canCreateWithEmptySearch()
		{
			return true;
		}

		static getSearchPlaceholderWithCreation()
		{
			return BX.message('SELECTOR_COMPONENT_ADDRESS_BOOK_SEARCH_WITH_CREATION');
		}

		static getCreateEntityHandler(providerOptions, createOptions)
		{
			return (textFromSearch) => {
				return new Promise((resolve, reject) => {
					const { getParentLayout = null } = createOptions;

					const parentWidget = getParentLayout?.();

					if (parentWidget === null)
					{
						reject();
					}

					AddAddress.show({
						parentWidget,
						textFromSearch,
						onClose: () => {
							reject();
						},
						onSuccess: (customData) => {
							const {
								name,
								email,
							} = customData;

							resolve({
								id: email,
								title: name,
								entityId: this.getEntityId(),
								customData,
							});
						},
					});
				});
			};
		}

		static getContext()
		{
			return 'MAIL_ENTITIES';
		}

		static getTitle()
		{
			return BX.message('SELECTOR_COMPONENT_TITLE_ADDRESS_BOOK');
		}

		static prepareItemForDrawing(entity)
		{
			const customData = get(entity, ['customData'], null);

			if (!customData)
			{
				return entity;
			}

			const {
				email = '',
				name = '',
			} = customData;

			return {
				imageUrl: DEFAULT_ICON,
				title: name,
				subtitle: email,
			};
		}

		static useRawResult()
		{
			return true;
		}
	}

	module.exports = { MailAddressBookSelector };
});