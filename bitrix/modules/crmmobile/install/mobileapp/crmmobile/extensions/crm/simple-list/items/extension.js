/**
 * @module crm/simple-list/items
 */
jn.define('crm/simple-list/items', (require, exports, module) => {
	const { CrmEntity } = require('crm/simple-list/items/crm-entity');
	const { CrmEntityCompact } = require('crm/simple-list/items/crm-entity-compact');
	const { TerminalPayment } = require('crm/simple-list/items/terminal-payment');
	const { ListItemsFactory: BaseListItemsFactory, ListItemType: BaseListItemType } = require('layout/ui/simple-list/items');
	const { Color } = require('tokens');

	const ListItemType = {
		CRM_ENTITY: 'CrmEntity',
		TERMINAL_PAYMENT: 'TerminalPayment',
	};

	/**
	 * @class ListItemsFactory
	 */
	class ListItemsFactory extends BaseListItemsFactory
	{
		static create(type, data)
		{
			if (type === ListItemType.CRM_ENTITY)
			{
				// the list captures its item type on mount, so the card is picked by the current view instead
				return (data.params?.isCompactView ? new CrmEntityCompact(data) : new CrmEntity(data));
			}

			if (type === ListItemType.TERMINAL_PAYMENT)
			{
				return new TerminalPayment(data);
			}

			if (type === BaseListItemType.EMPTY_SPACE && data.params?.isCompactView)
			{
				// spacer items of the list are grey by default, the compact view keeps the background white
				return BaseListItemsFactory.create(type, {
					...data,
					item: {
						...data.item,
						color: Color.bgContentPrimary.toHex(),
					},
				});
			}

			return BaseListItemsFactory.create(type, data);
		}
	}

	module.exports = { ListItemsFactory, ListItemType };
});
