/**
 * @module settings-v2/controller/base/src/setting-change-confirm-navigator
 */
jn.define('settings-v2/controller/base/src/setting-change-confirm-navigator', (require, exports, module) => {
	const { ConfirmNavigator } = require('alert');

	const DISMISS_INDEX = 0;

	class SettingChangeConfirmNavigator extends ConfirmNavigator
	{
		constructor(props)
		{
			super(props);

			this.onDismiss = props.onDismiss ?? null;
		}

		/**
		 * @param {number} index
		 */
		handlerOnPress(index)
		{
			if (index === DISMISS_INDEX)
			{
				this.onDismiss?.();

				return;
			}

			super.handlerOnPress(index);
		}
	}

	module.exports = {
		SettingChangeConfirmNavigator,
	};
});
