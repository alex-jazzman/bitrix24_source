/**
 * @module ava-menu/check-in
 */
jn.define('ava-menu/check-in', (require, exports, module) => {
	const { menu } = require('native/avamenu') || {};
	const { Color } = require('tokens');

	const ITEM_ID = 'check_in';

	class CheckIn
	{
		static open(event)
		{
			requireLazy('stafftrack:entry')
				.then(({ Entry }) => {
					if (Entry)
					{
						Entry.openCheckIn(event);
					}
				})
				.catch(console.error);
		}

		static handleItemColor()
		{
			const items = menu.getItems();

			if (!items)
			{
				return;
			}

			const item = items.find(({ id }) => ITEM_ID === id);

			if (!item)
			{
				return;
			}

			if (item.customData?.enabledBySettings)
			{
				CheckIn.updateItemColor(true);
			}
		}

		static updateItemColor(isEnabled)
		{
			const color = isEnabled ? Color.accentMainPrimary.toHex() : Color.base0.toHex();

			menu.updateItem(ITEM_ID, {
				titleColor: String(color),
				iconColor: String(color),
			});
		}
	}

	module.exports = { CheckIn };
});
