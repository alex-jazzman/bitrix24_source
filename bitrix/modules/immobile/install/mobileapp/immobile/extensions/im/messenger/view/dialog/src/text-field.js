/**
 * @module im/messenger/view/dialog/text-field
 */
jn.define('im/messenger/view/dialog/text-field', (require, exports, module) => {
	const { EventFilterType } = require('im/messenger/const');

	const { ProxyView } = require('im/messenger/view/lib/proxy-view');

	/**
	 * @class DialogTextField
	 */
	class DialogTextField extends ProxyView
	{
		/**
		 * @return {AvailableEventCollection}
		 */
		getAvailableEvents()
		{
			return {
				[EventFilterType.selectMessagesMode]: [],
			};
		}

		/**
		 * @param {string} text
		 */
		setText(text)
		{
			if (this.isUiAvailable())
			{
				this.ui.setText(text);
			}
		}

		/**
		 * @param {number} fromIndex
		 * @param {number} toIndex
		 * @param {string} bbCodeText
		 */
		replaceText(fromIndex, toIndex, bbCodeText)
		{
			if (this.isUiAvailable())
			{
				this.ui.replaceText(fromIndex, toIndex, bbCodeText);
			}
		}

		/**
		 * @return {string} text
		 */
		getText()
		{
			if (this.isUiAvailable())
			{
				return this.ui.getText();
			}

			return '';
		}

		/**
		 * @param {string} text
		 */
		setPlaceholder(text)
		{
			if (this.isUiAvailable())
			{
				this.ui.setPlaceholder(text);
			}
		}

		/**
		 * @return {number}
		 */
		getCursorIndex()
		{
			if (this.isUiAvailable())
			{
				return this.ui.getCursorIndex();
			}

			return 0;
		}

		/**
		 * @param {boolean} [isAnimated=false]
		 */
		show(isAnimated = false)
		{
			if (this.isUiAvailable())
			{
				this.ui.show({ animated: isAnimated });
			}
		}

		/**
		 * @param {boolean} [isAnimated=false]
		 */
		hide(isAnimated = false)
		{
			if (this.isUiAvailable())
			{
				this.ui.hide({ animated: isAnimated });
			}
		}

		/**
		 * @void
		 */
		clear()
		{
			if (this.isUiAvailable())
			{
				this.ui.clear();
			}
		}

		/**
		 * @param {object} message
		 * @param {string} type
		 * @param {boolean} [openKeyboard=true]
		 * @param {string?} [title=null] (56+ API)
		 * @param {string?} [text=null] (56+ API)
		 */
		setQuote(message, type, openKeyboard, title, text)
		{
			if (this.isUiAvailable())
			{
				this.ui.setQuote(message, type, openKeyboard, title, text);
			}
		}

		/**
		 * @void
		 */
		removeQuote()
		{
			if (this.isUiAvailable())
			{
				this.ui.removeQuote();
			}
		}

		/**
		 * @return {boolean} enable
		 */
		enableAlwaysSendButtonMode(enable)
		{
			if (this.isUiAvailable())
			{
				this.ui.enableAlwaysSendButtonMode(enable);
			}
		}

		/**
		 * @void
		 */
		showKeyboard()
		{
			if (this.isUiAvailable())
			{
				this.ui.showKeyboard?.();
			}
		}

		/**
		 * @void
		 */
		hideKeyboard()
		{
			if (this.isUiAvailable())
			{
				this.ui.hideKeyboard?.();
			}
		}

		/**
		 * @param {string} enabled
		 * @param {string} disabled
		 */
		setSendButtonColors({ enabled, disabled })
		{
			if (this.isUiAvailable())
			{
				this.ui.setSendButtonColors?.({ enabled, disabled });
			}
		}
	}

	module.exports = {
		DialogTextField,
	};
});
