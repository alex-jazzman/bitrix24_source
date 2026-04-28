/**
 * @module im/messenger/controller/dialog/lib/text-format/src/action/strikethrough
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/action/strikethrough', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { SimpleBBCodeAction } = require('im/messenger/controller/dialog/lib/text-format/src/action/abstract/simple-bbcode');

	/**
	 * @class StrikethroughAction
	 */
	class StrikethroughAction extends SimpleBBCodeAction
	{
		constructor()
		{
			super(
				'strikethrough',
				Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_TEXT_FORMAT_STRIKETHROUGH'),
				's',
			);
		}
	}

	module.exports = { StrikethroughAction };
});
