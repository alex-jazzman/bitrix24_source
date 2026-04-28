/**
 * @module im/messenger/lib/element/dialog/message/ai-bizproc/message
 */
jn.define('im/messenger/lib/element/dialog/message/ai-bizproc/message', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');

	const { Color } = require('tokens');
	const { TextMessage } = require('im/messenger/lib/element/dialog/message/text');

	class AiBizprocMessage extends TextMessage
	{
		constructor(modelMessage = {}, options = {})
		{
			super(modelMessage, options);

			this
				.setFootNote()
				.setCanBeQuoted(true)
				.setCanBeChecked(true)
			;
		}

		/**
		 * @returns {AiBizprocDialogWidgetItem}
		 */
		toDialogWidgetItem()
		{
			return {
				...super.toDialogWidgetItem(),
				footnote: this.footnote,
			};
		}

		setFootNote()
		{
			this.footnote = {
				text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_AI_BIZPROC_FOOT_NOTE_TEXT'),
				textColor: Color.chatOtherBase1_2.toHex(),
				backgroundColor: Color.accentSoftBlue3.toHex(),
			};

			return this;
		}
	}

	module.exports = { AiBizprocMessage };
});
