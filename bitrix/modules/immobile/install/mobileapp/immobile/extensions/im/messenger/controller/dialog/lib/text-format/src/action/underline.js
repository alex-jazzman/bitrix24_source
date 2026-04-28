/**
 * @module im/messenger/controller/dialog/lib/text-format/src/action/underline
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/action/underline', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { SimpleBBCodeAction } = require('im/messenger/controller/dialog/lib/text-format/src/action/abstract/simple-bbcode');

	/**
	 * @class UnderlineAction
	 */
	class UnderlineAction extends SimpleBBCodeAction
	{
		constructor()
		{
			super(
				'underline',
				Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_TEXT_FORMAT_UNDERLINE'),
				'u',
			);
		}
	}

	module.exports = { UnderlineAction };
});
