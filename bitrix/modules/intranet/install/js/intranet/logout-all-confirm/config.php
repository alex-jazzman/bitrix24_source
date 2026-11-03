<?php

use Bitrix\Intranet\Internal\Integration\Main\OtpSigner;
use Bitrix\Intranet\Internal\Integration\Security\OtpSettings;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

Loc::loadMessages(__FILE__);

$userId = (int)CurrentUser::get()->getId();
$personalOtp = (new OtpSettings())->getPersonalSettingsByUserId($userId);
$hasConnectedPushDevice = $personalOtp?->hasConnectedPushDevice() ?? false;

return [
	'css' => 'dist/logout-all-confirm.bundle.css',
	'js' => 'dist/logout-all-confirm.bundle.js',
	'rel' => [
		'main.core',
		'main.core.cache',
		'ui.buttons',
		'ui.notification',
		'ui.system.dialog',
	],
	'skip_core' => false,
	'settings' => [
		'signedUserId' => (new OtpSigner())->signUserId($userId),
		'isCloud' => \Bitrix\Main\ModuleManager::isModuleInstalled('bitrix24'),
		'pushOtpConnected' => $hasConnectedPushDevice,
		'deviceName' => $hasConnectedPushDevice ? ($personalOtp->getInitParams()['deviceInfo']['displayModel'] ?? null) : null,
		'devicePlatform' => $hasConnectedPushDevice ? ($personalOtp->getInitParams()['deviceInfo']['platform'] ?? null) : null,
		'notificationContent' => Loc::getMessage(
			'INTRANET_LOGOUT_ALL_CONFIRM_NOTIFY_TEXT',
			[
				'#TITLE#' => sprintf(
					'<span style="font-size: 14px; font-weight: 500; line-height: 19px;">%s</span>',
					Loc::getMessage('INTRANET_LOGOUT_ALL_CONFIRM_NOTIFY_TITLE'),
				),
			],
		),
	],
];
