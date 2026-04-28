/**
 * @module im/messenger/controller/dialog/lib/text-format/src/menu/format
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/menu/format', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');

	/**
	 * @class FormatMenu
	 */
	class FormatMenu
	{
		/**
		 * @param {Array} items
		 */
		constructor(items = [])
		{
			this.id = 'format';
			this.title = Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_TEXT_FORMAT_BUTTON');
			this.items = items;
		}

		/**
		 * @returns {{id: string, title: string, items: Array}}
		 */
		getConfig()
		{
			return {
				id: this.id,
				title: this.title,
				items: this.items,
			};
		}
	}

	module.exports = { FormatMenu };
});
