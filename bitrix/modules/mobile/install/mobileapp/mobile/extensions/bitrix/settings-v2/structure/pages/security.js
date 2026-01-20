/**
 * @module settings-v2/structure/pages/security
 */
jn.define('settings-v2/structure/pages/security', (require, exports, module) => {
	const {
		createToggle,
		createSection,
		createUserSelector,
	} = require('settings-v2/structure/helpers/item-create-helper');
	const {
		createSecurityInfo,
		createSecurityBanner,
		createSecurityAlertBanner,
	} = require('settings-v2/structure/helpers/security-item-create-helper');
	const { Loc } = require('loc');
	const { NativeSettingController } = require('settings-v2/controller/native');
	const { SettingsPageId, EventType, SecurityOption } = require('settings-v2/const');
	const { SecuritySettingsController } = require('settings-v2/controller/security');
	const { SettingEmitter } = require('settings-v2/emitter');
	const { qrauth } = require('qrauth/utils');
	const { SecuritySettingsService } = require('settings-v2/services/security-settings');
	const { Type } = require('type');

	const userSelectorSafeScreenshotsId = 'security-safe-screenshots-users';
	const userSelectorSafeCopyTextId = 'security-safe-copy-text-users';

	const isIOS = Application.getPlatform() === 'ios';

	const createSecurityController = (securityOption, fallbackValue = false) => {
		return new SecuritySettingsController({
			settingId: securityOption,
			securityOption,
			fallbackValue,
		});
	};

	const createFaceIdController = () => {
		return new NativeSettingController({
			settingId: SecurityOption.IS_BIOMETRIC_AUTH_ENABLED,
			fallbackValue: false,
		}).setOnChange((newValue) => {
			SettingEmitter.emit(EventType.changeSecurityState, {
				settingId: SecurityOption.IS_BIOMETRIC_AUTH_ENABLED,
				value: newValue,
			});
		});
	};

	const requestSettingsData = async () => {
		const securityResponse = await SecuritySettingsService.fetch();
		const securityData = securityResponse.data;
		const isBiometricAuthEnabled = await createFaceIdController().get();

		return {
			isCopyTextDisabled: securityData.isCopyTextDisabled ?? false,
			isTakeScreenshotDisabled: securityData.isTakeScreenshotDisabled ?? false,
			isOtpMandatory: securityData.isOtpMandatory ?? false,
			isBiometricAuthEnabled,
		};
	};

	const prepareSafeInformationSectionItems = (settingsData) => {
		return [
			createToggle({
				id: 'security-safe-screenshots',
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_SCREENSHOT_BAN'),
				subtitle: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_SCREENSHOT_BAN_SUBTITLE'),
				divider: false,
				controller: createSecurityController(SecurityOption.IS_TAKE_SCREENSHOT_DISABLED, false)
					.setOnChange((newValue) => {
						SettingEmitter.emit(`${EventType.changeUserSelectorIsVisible}:${userSelectorSafeScreenshotsId}`, newValue);
						SettingEmitter.emit(EventType.changeSecurityState, {
							settingId: SecurityOption.IS_TAKE_SCREENSHOT_DISABLED,
							value: newValue,
						});
					}),
			}),
			createUserSelector({
				id: userSelectorSafeScreenshotsId,
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_USER_SELECTOR'),
				isVisible: settingsData.isTakeScreenshotDisabled,
				controller: createSecurityController(SecurityOption.TAKE_SCREENSHOT_RIGHTS, {}),
				unselectLastMessage: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_USER_SELECTOR_UNSELECT_LAST_WARNING'),
			}),
			createToggle({
				id: 'security-safe-copy-text',
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_COPY_TEXT_BAN'),
				subtitle: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_COPY_TEXT_BAN_SUBTITLE'),
				divider: false,
				controller: createSecurityController(SecurityOption.IS_COPY_TEXT_DISABLED, false)
					.setOnChange((newValue) => {
						SettingEmitter.emit(`${EventType.changeUserSelectorIsVisible}:${userSelectorSafeCopyTextId}`, newValue);
						SettingEmitter.emit(EventType.changeSecurityState, {
							settingId: SecurityOption.IS_COPY_TEXT_DISABLED,
							value: newValue,
						});
					}),
			}),
			createUserSelector({
				id: userSelectorSafeCopyTextId,
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_USER_SELECTOR'),
				isVisible: settingsData.isCopyTextDisabled,
				controller: createSecurityController(SecurityOption.COPY_TEXT_RIGHTS, {}),
				unselectLastMessage: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_USER_SELECTOR_UNSELECT_LAST_WARNING'),
			}),
		];
	};

	const prepareSecurityBanner = (settingsData) => {
		const controllers = [
			createSecurityController(SecurityOption.IS_OTP_ENABLED_FOR_USER),
			createFaceIdController(),
		];
		if (env.isAdmin)
		{
			controllers.push(
				createSecurityController(SecurityOption.IS_COPY_TEXT_DISABLED),
				createSecurityController(SecurityOption.IS_TAKE_SCREENSHOT_DISABLED),
				createSecurityController(SecurityOption.IS_OTP_MANDATORY),
			);
		}

		return [
			createSecurityBanner({
				id: 'security-banner',
				progress: env.isAdmin,
				controllers,
			}),
		];
	};

	const prepare2FASection = (settingsData) => {
		return [
			createSecurityInfo({
				id: 'security-account',
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_SAFE_ACCOUNT'),
				subtitle: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_SAFE_ACCOUNT_SUBTITLE'),
				controller: createSecurityController(SecurityOption.IS_OTP_ENABLED_FOR_USER, false),
				isOtpMandatory: settingsData.isOtpMandatory,
				divider: false,
				onClick: () => {
					qrauth.open({
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_QR_AUTH_2FA'),
						redirectUrl: `${currentDomain}/company/personal/user/${env.userId}/common_security/?page=otpConnected`,
						showHint: true,
					});
				},
			}),
			createSecurityAlertBanner({
				id: 'security-alert-banner',
				controller: createSecurityController(SecurityOption.IS_OTP_ENABLED_FOR_USER, false),
				prefilter: () => settingsData.isOtpMandatory,
			}),
			createSecurityInfo({
				id: 'security-company',
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_SAFE_COMPANY'),
				subtitle: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_SAFE_COMPANY_SUBTITLE'),
				controller: createSecurityController(SecurityOption.IS_OTP_MANDATORY, false),
				onClick: () => {
					qrauth.open({
						title: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_QR_AUTH_2FA'),
						redirectUrl: env.installedModules.bitrix24
							? `${currentDomain}/settings/configs/?page=security`
							: `${currentDomain}/bitrix/admin/security_otp.php`,
						showHint: true,
					});
				},
				prefilter: () => env.isAdmin,
			}),
		];
	};

	const SecurityPage = {
		id: SettingsPageId.SECURITY,
		title: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_TITLE'),
		requestSettingsData,
		items: [
			createSection({
				id: 'security-banner-section',
				divider: false,
				prepareItems: prepareSecurityBanner,
				items: [],
			}),
			createSection({
				id: 'security-2fa-section',
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_QR_AUTH_2FA'),
				prepareItems: prepare2FASection,
				items: [],
			}),
			createSection({
				id: 'security-login-section',
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_LOGIN_TITLE'),
				items: [
					createToggle({
						id: 'security-login-biometric-auth',
						title: isIOS
							? Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_FACE_ID')
							: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_BIOMETRY'),
						controller: createFaceIdController(),
					}),
				],
				prefilter: (settingsData) => {
					return !Type.isNil(settingsData.isBiometricAuthEnabled);
				},
			}),
			createSection({
				id: 'security-safe-information-section',
				title: Loc.getMessage('SETTINGS_V2_STRUCTURE_SECURITY_SAFE_INFORMATION_SECTION_TITLE'),
				prefilter: () => env.isAdmin,
				prepareItems: prepareSafeInformationSectionItems,
				items: [],
			}),
		],
	};

	module.exports = {
		SecurityPage,
	};
});
