/**
 * @module im/messenger/lib/element/dialog/message/element/keyboard/keyboard
 */
jn.define('im/messenger/lib/element/dialog/message/element/keyboard/keyboard', (require, exports, module) => {
	const { Type } = require('type');
	const { clone } = require('utils/object');
	const { Color } = require('tokens');

	const {
		KeyboardButtonContext,
		KeyboardButtonType,
		KeyboardButtonNewLineSeparator,
		KeyboardButtonColorToken,
	} = require('im/messenger/const');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('element--message-keyboard');

	const SYSTEM_BUTTON_STYLES_MAP = {
		[KeyboardButtonColorToken.primary]: {
			bgColor: Color.accentMainPrimary.toHex(),
			textColor: Color.baseWhiteFixed.toHex(),
		},
		[KeyboardButtonColorToken.secondary]: {
			bgColor: Color.chatOtherMessage2.toHex(),
			textColor: Color.accentMainPrimary.toHex(),
		},
		[KeyboardButtonColorToken.alert]: {
			bgColor: Color.accentMainAlert.toHex(),
			textColor: Color.baseWhiteFixed.toHex(),
		},
		[KeyboardButtonColorToken.base]: {
			bgColor: Color.chatOtherMessage3.toHex(),
			textColor: Color.base1.toHex(),
		},
	};

	const DISABLED_BUTTON_STYLE = {
		bgColor: Color.chatOtherMessage3.toHex(),
		textColor: Color.chatOtherBase1_1.toHex(),
	};

	class Keyboard
	{
		/**
		 * @param {KeyboardButtonConfig[]} modelKeyboard
		 * @param {object} options
		 * @param {boolean} [options.isSystemStyled]
		 */
		static createByMessagesModelKeyboard(modelKeyboard, options = {})
		{
			return new this(modelKeyboard, options);
		}

		/**
		 * @param {KeyboardButtonConfig[]} modelKeyboard
		 * @param {object} options
		 * @param {boolean} [options.isSystemStyled]
		 */
		constructor(modelKeyboard, options = {})
		{
			/**
			 * @type {KeyboardButtonConfig[]}
			 */
			this.modelKeyboard = [];
			if (Type.isArrayFilled(modelKeyboard))
			{
				this.modelKeyboard = modelKeyboard;
			}

			this.isSystemStyled = options.isSystemStyled ?? false;
		}

		/**
		 * @return {KeyboardButtonConfig[]}
		 */
		toMessageFormat()
		{
			/**
			 * @type {KeyboardButtonConfig[]}
			 */
			const messageKeyboard = clone(this.modelKeyboard)
				.filter((button) => {
					const isMobileContextButton = [
						KeyboardButtonContext.all,
						KeyboardButtonContext.mobile,
					].includes(button.context);

					return isMobileContextButton || button.type === KeyboardButtonType.newLine;
				})
				.map((buttonConfig) => {
					const button = buttonConfig;
					if (button.type === KeyboardButtonType.newLine)
					{
						return KeyboardButtonNewLineSeparator;
					}

					if (!Type.isStringFilled(button.bgColorToken))
					{
						button.bgColorToken = KeyboardButtonColorToken.base;
					}

					if (this.isSystemStyled)
					{
						button.style = this.#getButtonSystemStyle(button);
					}

					return button;
				})
			;

			const isOnlyNewLineLeft = messageKeyboard.length === 1 && messageKeyboard[0].type === KeyboardButtonType.newLine;
			if (isOnlyNewLineLeft)
			{
				messageKeyboard.pop();
			}

			logger.log(`${this.constructor.name}.toMessageFormat: `, this.modelKeyboard, messageKeyboard);

			return messageKeyboard;
		}

		/**
		 * @param {KeyboardButtonConfig} button
		 * @return {KeyboardButtonStyle}
		 */
		#getButtonSystemStyle(button)
		{
			if (button.disabled)
			{
				return DISABLED_BUTTON_STYLE;
			}

			return SYSTEM_BUTTON_STYLES_MAP[button.bgColorToken] ?? SYSTEM_BUTTON_STYLES_MAP[KeyboardButtonColorToken.base];
		}
	}

	module.exports = { Keyboard };
});
