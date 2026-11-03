/**
 * @module settings-v2/controller/base
 */
jn.define('settings-v2/controller/base', (require, exports, module) => {
	const { makeButton, makeCancelButton } = require('alert');
	const {
		SettingChangeConfirmNavigator,
	} = require('settings-v2/controller/base/src/setting-change-confirm-navigator');
	const { Loc } = require('loc');

	class BaseSettingController
	{
		constructor(props)
		{
			if (!props.settingId)
			{
				throw new Error('Missing required settingId');
			}

			this.settingId = props.settingId;
			this.fallbackValue = props.fallbackValue ?? null;

			/** @type {function} */
			this.onChange = null;
			this.onCancel = null;

			this.onChangeAlertTitle = props.onChangeAlertTitle ?? Loc.getMessage('SETTINGS_V2_CONTROLLER_RELOADED_SETTING_CHANGE_TITLE');
			this.onChangeAlertDescription = props.onChangeAlertDescription ?? Loc.getMessage('SETTINGS_V2_CONTROLLER_RELOADED_SETTING_CHANGE_DESCRIPTION');
			this.onChangeAlertOkButton = props.onChangeAlertOkButton ?? null;
		}

		/**
		 * @abstract
		 * @return Promise
		 */
		async get()
		{
			throw new Error('Method "get" must be implemented in the derived class');
		}

		/**
		 * @abstract
		 * @param {*} value
		 * @return {Promise<*>}
		 */
		async set(value)
		{
			throw new Error('Method "set" must be implemented in the derived class');
		}

		/**
		 * @public
		 * @param {function} func
		 * @returns {BaseSettingController}
		 */
		setOnChange(func)
		{
			this.onChange = func;

			return this;
		}

		/**
		 * @public
		 * @param {function} func
		 * @returns {BaseSettingController}
		 */
		setOnCancel(func)
		{
			this.onCancel = func;

			return this;
		}

		/**
		 * @public
		 * @param {function} onConfirm
		 * @param {?function} [onCancel]
		 * @returns {BaseSettingController}
		 */
		showOnChangeAlert(onConfirm, onCancel = null)
		{
			const cancel = () => {
				this.onCancel?.();
				onCancel?.();
			};

			new SettingChangeConfirmNavigator({
				title: this.onChangeAlertTitle,
				description: this.onChangeAlertDescription,
				buttons: [
					makeButton(this.onChangeAlertOkButton, async () => {
						onConfirm();
					}),
					makeCancelButton(cancel),
				],
				onDismiss: cancel,
			}).open();
		}
	}

	module.exports = {
		BaseSettingController,
	};
});
