/**
 * @module im/messenger/controller/dialog/lib/text-format/src/action/italic
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/action/italic', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { SimpleBBCodeAction } = require('im/messenger/controller/dialog/lib/text-format/src/action/abstract/simple-bbcode');

	/**
	 * @class ItalicAction
	 */
	class ItalicAction extends SimpleBBCodeAction
	{
		constructor()
		{
			super(
				'italic',
				Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_TEXT_FORMAT_ITALIC'),
				'i',
			);
		}
	}

	module.exports = { ItalicAction };
});
