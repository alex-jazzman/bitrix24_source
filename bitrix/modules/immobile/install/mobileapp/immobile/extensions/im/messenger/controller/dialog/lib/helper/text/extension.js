/**
 * @module im/messenger/controller/dialog/lib/helper/text
 */
jn.define('im/messenger/controller/dialog/lib/helper/text', (require, exports, module) => {
	include('InAppNotifier');

	const { Loc } = require('loc');
	const { parser } = require('im/messenger/lib/parser');

	/**
	 * @class DialogTextHelper
	 */
	class DialogTextHelper
	{
		static copyToClipboard(modelMessage, textTitle = null)
		{
			Application.copyToClipboard(parser.prepareCopy(modelMessage));
			const title = textTitle || Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_HELPER_TEXT_MESSAGE_COPIED');

			InAppNotifier.showNotification({
				title,
				time: 1,
				backgroundColor: '#E6000000',
			});
		}
	}

	module.exports = { DialogTextHelper };
});
