/**
 * @module settings-v2/structure/helpers/security-logout-other-devices-helper
 */
jn.define('settings-v2/structure/helpers/security-logout-other-devices-helper', (require, exports, module) => {
	const { Loc } = require('loc');
	const { confirmDestructiveAction } = require('alert');
	const { Notify } = require('notify');
	const { showErrorToast } = require('toast/error');
	const { SecuritySettingsService } = require('settings-v2/services/security-settings');

	const showLogoutOtherDevicesConfirm = () => {
		confirmDestructiveAction({
			title: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_LOGOUT_TITLE'),
			description: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_LOGOUT_DESCRIPTION'),
			destructionText: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_LOGOUT_ACTION'),
			cancelText: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_LOGOUT_CANCEL'),
			onDestruct: logoutOtherDevices,
		});
	};

	const logoutOtherDevices = async () => {
		try
		{
			void Notify.showIndicatorLoading();
			await SecuritySettingsService.logoutOtherDevices();
			Notify.showIndicatorSuccess({
				hideAfter: 2000,
			});
		}
		catch
		{
			Notify.hideCurrentIndicator();
			showErrorToast({
				message: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_LOGOUT_ERROR'),
			});
		}
	};

	module.exports = {
		showLogoutOtherDevicesConfirm,
	};
});
