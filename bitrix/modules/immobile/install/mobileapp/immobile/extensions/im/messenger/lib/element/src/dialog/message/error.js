/**
 * @module im/messenger/lib/element/dialog/message/error
 */
jn.define('im/messenger/lib/element/dialog/message/error', (require, exports, module) => {
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
	}

	module.exports = { ErrorMessage };
});
