<?php

use Bitrix\Intranet\Entity\User;
use Bitrix\Intranet\Internal\Integration\Main\VerifyPhoneService;
use Bitrix\Main\Engine\UrlManager;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$userId = \Bitrix\Intranet\CurrentUser::get()->getId();

return [
	'css' => 'dist/connect-popup.bundle.css',
	'js' => 'dist/connect-popup.bundle.js',
	'rel' => [
		'main.popup',
		'ui.design-tokens',
		'intranet.design-tokens',
		'ui.analytics',
		'ui.type',
		'main.phonenumber',
		'main.core.events',
		'main.sidepanel',
		'main.core.cache',
		'intranet.push-otp.connect-popup',
		'ui.confetti',
		'main.loader',
		'main.qrcode',
		'pull.client',
		'ui.buttons',
		'ui.icon-set.outline',
		'main.core',
	],
	'settings' => [
		'recoveryCodes' => [
			'isAvailable' => (new \Bitrix\Intranet\Internal\Integration\Security\OtpSettings())->isRecoveredCodesEnabled(),
			'downloadLink' => UrlManager::getInstance()->create('intranet.v2.Otp.generateRecoveryCodesFile'),
		],
		'canSendSms' => (new VerifyPhoneService(new User(\Bitrix\Intranet\CurrentUser::get()->getId())))->canSendSms(),
		'userId' => $userId,
		'settingsUrl' => $userId ? SITE_DIR . 'company/personal/user/' . $userId . '/common_security/' : '',
	],
	'skip_core' => false,
];
