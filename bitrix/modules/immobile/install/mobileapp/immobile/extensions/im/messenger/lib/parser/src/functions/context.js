/**
 * @module im/messenger/lib/parser/functions/context
 */
jn.define('im/messenger/lib/parser/functions/context', (require, exports, module) => {
	const { Type } = require('type');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { MessengerParams } = require('im/messenger/lib/params');

	function getDialogId(dialogId)
	{
		if (DialogHelper.isDialogId(dialogId))
		{
			return dialogId;
		}

		const [user1, user2] = dialogId
			.split(':')
			.map((userId) => Number.parseInt(userId, 10));
		const currentUserId = MessengerParams.getUserId();

		if (currentUserId === user1)
		{
			return user2;
		}

		if (currentUserId === user2)
		{
			return user1;
		}

		return null;
	}

	const parserContext = {
		decode(text)
		{
			return text.replace(
				/\[context=(chat\d+|\d+:\d+)\/(\d+)](.*?)\[\/context]/gis,
				(whole, dialogId, messageId, message) => {
					if (!message)
					{
						return '';
					}

					const finalDialogId = getDialogId(dialogId);
					if (finalDialogId === null)
					{
						return message;
					}

					return `[url=/online/?IM_DIALOG=${finalDialogId}&IM_MESSAGE=${messageId}]${message}[/url]`;
				},
			);
		},

		simplify(text)
		{
			text = text.replace(/\[context=(chat\d+|\d+:\d+)\/(\d+)](.*?)\[\/context]/gims, (whole, dialogId, messageId, message) => {
				if (Type.isStringFilled(dialogId))
				{
					return message;
				}
			});

			return text;
		},
	};

	module.exports = { parserContext };
});
