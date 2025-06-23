/**
 * @module im/messenger/lib/helper/counter
 */
jn.define('im/messenger/lib/helper/counter', (require, exports, module) => {
	const { DialogType, CounterType } = require('im/messenger/const');

	/**
	 * @class CounterHelper
	 */
	class CounterHelper
	{
		static getCounterTypeByDialogType(dialogType)
		{
			switch (dialogType)
			{
				case DialogType.copilot:
				{
					return CounterType.copilot;
				}

				case DialogType.collab:
				{
					return CounterType.collab;
				}

				case DialogType.lines:
				{
					return CounterType.openline;
				}

				case DialogType.comment:
				{
					return CounterType.comment;
				}

				default:
				{
					return CounterType.chat;
				}
			}
		}
	}

	module.exports = { CounterHelper };
});
