/**
 * @module im/messenger/lib/element/dialog/message/error
 */
jn.define('im/messenger/lib/element/dialog/message/error', (require, exports, module) => {
	const { Type } = require('type');

	const { MessageType } = require('im/messenger/const');
	const { TextMessage } = require('im/messenger/lib/element/dialog/message/text');

	class ErrorMessage extends TextMessage
	{
		constructor(modelMessage = {}, options = {})
		{
			super(modelMessage, options);

			this.copilot = {};

			this
				.setCopilotError()
				.setCanBeQuoted(false)
				.setCanBeChecked(false)
			;
		}

		getType()
		{
			return MessageType.copilotError;
		}

		setCopilotError()
		{
			this.copilot = {
				error: {
					text: this.username,
				},
			};

			return this;
		}

		/**
		 * @param {UsersModelState|null} user
		 * @void
		 */
		setAvatarDetail(user)
		{
			super.setAvatarDetail(user);

			// TODO: switch to ChatAvatar for CoPilot
			if (Type.isObject(this.avatar) && this.avatar.uri)
			{
				this.avatar.uri = this.avatarUrl;
			}
		}
	}

	module.exports = { ErrorMessage };
});
