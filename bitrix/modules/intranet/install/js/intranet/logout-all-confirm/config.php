<?php

use Bitrix\Intranet\Internal\Integration\Main\OtpSigner;
use Bitrix\Intranet\Internal\Integration\Security\OtpSettings;
use Bitrix\Main\Engine\CurrentUser;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$userId = (int)CurrentUser::get()->getId();
$personalOtp = (new OtpSettings())->getPersonalSettingsByUserId($userId);
$isPushType = $personalOtp?->isPushType() ?? false;

return [
	'css' => 'dist/logout-all-confirm.bundle.css',
	'js' => 'dist/logout-all-confirm.bundle.js',
	'rel' => [
		'ui.system.dialog',
		'main.core.cache',
		'ui.buttons',
		'main.core',
		'ui.notification',
	],
	'skip_core' => false,
	'settings' => [
		'signedUserId' => (new OtpSigner())->signUserId($userId),
		'pushOtpConnected' => $isPushType,
		'deviceName' => $isPushType ? ($personalOtp->getInitParams()['deviceInfo']['displayModel'] ?? null) : null,
		'devicePlatform' => $isPushType ? ($personalOtp->getInitParams()['deviceInfo']['platform'] ?? null) : null,
	],
];
