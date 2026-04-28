/**
 * @module im/messenger/controller/dialog/lib/text-format/src/action/code
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/action/code', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { SimpleBBCodeAction } = require('im/messenger/controller/dialog/lib/text-format/src/action/abstract/simple-bbcode');

	/**
	 * @class CodeAction
	 */
	class CodeAction extends SimpleBBCodeAction
	{
		constructor()
		{
			super(
				'code',
				Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_TEXT_FORMAT_CODE'),
				'code',
			);
		}
	}

	module.exports = { CodeAction };
});
