<?php

use Bitrix\Intranet\Entity\User;
use Bitrix\Intranet\Internal\Integration\Main\VerifyEmailService;
use Bitrix\Intranet\Internal\Integration\Main\VerifyPhoneService;
use Bitrix\Intranet\Internal\Repository\BackupEmailConfirmationRepository;
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
		'intranet.design-tokens',
		'intranet.push-otp.connect-popup',
		'main.core',
		'main.core.cache',
		'main.core.events',
		'main.loader',
		'main.phonenumber',
		'main.popup',
		'main.qrcode',
		'main.sidepanel',
		'pull.client',
		'ui.analytics',
		'ui.buttons',
		'ui.confetti',
		'ui.design-tokens',
		'ui.icon-set.outline',
		'ui.type',
	],
	'settings' => [
		'recoveryCodes' => [
			'isAvailable' => (new \Bitrix\Intranet\Internal\Integration\Security\OtpSettings())->isRecoveredCodesEnabled(),
			'downloadLink' => UrlManager::getInstance()->create('intranet.v2.Otp.generateRecoveryCodesFile'),
		],
		'canSendSms' => (new VerifyPhoneService(new User(\Bitrix\Intranet\CurrentUser::get()->getId())))->canSendSms(),
		'canSendEmail' => (new VerifyEmailService(
			new User(\Bitrix\Intranet\CurrentUser::get()->getId()),
			new BackupEmailConfirmationRepository(),
		))->canSendEmail(),
		'userId' => $userId,
		'settingsUrl' => $userId ? SITE_DIR . 'company/personal/user/' . $userId . '/common_security/' : '',
	],
	'skip_core' => false,
];
