/**
 * @module im/messenger/controller/dialog/lib/helper/text
 */
jn.define('im/messenger/controller/dialog/lib/helper/text', (require, exports, module) => {
	const { Loc } = require('loc');
	const { parser } = require('im/messenger/lib/parser');
	const { Notification } = require('im/messenger/lib/ui/notification');

	/**
	 * @class DialogTextHelper
	 */
	class DialogTextHelper
	{
		static copyToClipboard({ clipboardText = '', notificationText = null }, widget = null)
		{
			Application.copyToClipboard(parser.prepareCopy({ text: clipboardText }));
			const title = notificationText
				?? Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_HELPER_TEXT_MESSAGE_COPIED')
			;

			return Notification.showToastWithParams({ message: title, svgType: 'copy' }, widget);
		}
	}

	module.exports = { DialogTextHelper };
});
