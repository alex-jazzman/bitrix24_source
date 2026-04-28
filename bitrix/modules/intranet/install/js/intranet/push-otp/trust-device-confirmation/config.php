<?php

use Bitrix\Intranet\Internal\Integration\Security\OtpSettings;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$otpSettings = new OtpSettings();
$personalOtp = $otpSettings->getPersonalSettingsByUserId((int)\Bitrix\Intranet\CurrentUser::get()->getId());

return [
	'css' => 'dist/trust-device-confirmation.bundle.css',
	'js' => 'dist/trust-device-confirmation.bundle.js',
	'rel' => [
		'main.core.cache',
		'main.core.events',
		'main.popup',
		'main.core',
		'ui.buttons',
		'ui.icon-set.social',
		'intranet.push-otp.connect-popup',
		'main.sidepanel',
		'ui.analytics',
	],
	'settings' => $personalOtp ? (new \Bitrix\Intranet\Internal\Service\Otp\TrustDeviceConfirmation($personalOtp))->getConfirmationData() : null,
	'skip_core' => false,
];
