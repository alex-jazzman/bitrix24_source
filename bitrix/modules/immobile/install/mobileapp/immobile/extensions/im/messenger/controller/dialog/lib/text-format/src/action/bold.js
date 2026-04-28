/**
 * @module im/messenger/controller/dialog/lib/text-format/src/action/bold
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/action/bold', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { SimpleBBCodeAction } = require('im/messenger/controller/dialog/lib/text-format/src/action/abstract/simple-bbcode');

	/**
	 * @class BoldAction
	 */
	class BoldAction extends SimpleBBCodeAction
	{
		constructor()
		{
			super(
				'bold',
				Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_TEXT_FORMAT_BOLD'),
				'b',
			);
		}
	}

	module.exports = { BoldAction };
});
