<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
{
	die();
}

use Bitrix\Intranet\Entity\Type\Email;
use Bitrix\Intranet\Entity\Type\Phone;
use Bitrix\Intranet\Internal\Integration\Main\OtpSigner;
use Bitrix\Intranet\Internal\Integration\Main\VerifyEmailService;
use Bitrix\Intranet\Internal\Integration\Security\PersonalOtp;
use Bitrix\Intranet\Internal\Service\Otp\MobilePush;
use Bitrix\Intranet\Repository\UserRepository;
use Bitrix\Intranet\Component\UserProfile;
use Bitrix\Intranet\User\Widget\Content\Tool\AccountChanger;
use Bitrix\Main\Loader;
use Bitrix\Intranet\Internal\Integration\Main\VerifyPhoneService;
use Bitrix\Intranet\Internal\Integration\Security\OtpSettings;
use Bitrix\Intranet\Internal\Service\Otp\PersonalMobilePush;
use Bitrix\Intranet\Internal\Repository\BackupEmailConfirmationRepository;

$arResult['AUTH_OTP_HELP_LINK'] = $APPLICATION->GetCurPageParam('help=Y');
$arResult['AUTH_OTP_LINK'] = $APPLICATION->GetCurPageParam('', ['help']);
$arResult['CAN_LOGIN_BY_SMS'] = false;
$arResult['CAN_LOGIN_BY_EMAIL'] = false;
$arResult['IS_RECOVERY_CODES_ENABLED'] = false;
$arResult['USER_MASKED_AUTH_PHONE_NUMBER'] = null;
$arResult['USER_MASKED_AUTH_EMAIL'] = null;
$arResult['HELP_BUTTON_CONFIG_BY_STEP'] = [
	'sms' => [
		'articleId' => 27901964,
		'anchor' => 'sms',
	],
	'email' => [
		'articleId' => 27901964,
		'anchor' => 'email',
	],
	'recoveryCodes' => [
		'articleId' => 27901964,
		'anchor' => 'rezerv',
	],
	'applicationOfflineCode' => [
		'articleId' => 27901964,
		'anchor' => 'application',
	],
];
$mobilePush = MobilePush::createByDefault();
$arResult['IS_DEFAULT_PUSH_OTP'] = false;
if ($mobilePush->isDefault())
{
	$arResult['IS_DEFAULT_PUSH_OTP'] = !$mobilePush->isLegacyOtpAllowedByUserId((int)$arResult['USER_ID']);
}
$arResult['RECOVERY_CODES_HELP_LINK'] = '';
$arResult['USER_DEVICE'] = [];
$arResult['ERROR_MESSAGE'] = (
	!empty($arParams['~AUTH_RESULT']['MESSAGE'])
	&& $arParams['~AUTH_RESULT']['TYPE'] === 'ERROR'
)
	? $arParams['~AUTH_RESULT']['MESSAGE']
	: ''
;

if (Loader::includeModule('intranet'))
{
	$user = (new UserRepository())->getUserById($arResult['USER_ID']);

	if ($arResult['USE_PUSH_OTP'])
	{
		if ($user)
		{
			$personalOtp = new PersonalOtp($user);
			$arResult['CAN_LOGIN_BY_SMS'] = (new VerifyPhoneService($user))->canLoginBySms();
			$arResult['CAN_LOGIN_BY_EMAIL'] = (new VerifyEmailService($user))->canLoginByEmail();
			$userAuthPhoneNumber = $user->getAuthPhoneNumber();
			$userBackupEmail = $personalOtp->getBackupEmail();

			if ($arResult['CAN_LOGIN_BY_SMS'] && $userAuthPhoneNumber)
			{
				$arResult['USER_MASKED_AUTH_PHONE_NUMBER'] = (new Phone($userAuthPhoneNumber))->getMaskedNumber();
			}

			if ($arResult['CAN_LOGIN_BY_EMAIL'] && $userBackupEmail)
			{
				$arResult['USER_MASKED_AUTH_EMAIL'] = (new Email($userBackupEmail))->getMaskedEmail();
			}

			$mobilePush = PersonalMobilePush::createByUser($user);
			$deviceInfo = $mobilePush->getDeviceInfo();
			$arResult['USER_DEVICE'] = [
				'icon' => in_array(strtolower($deviceInfo['platform']), ['android', 'ios']) ? strtolower($deviceInfo['platform']) : 'unknown',
				'model' => $deviceInfo['displayModel'] ?? '',
			];
			$arResult['SIGNED_USER_ID'] = (new OtpSigner())->signUserId($user->getId());
			$arResult['CAN_SEND_REQUEST_RECOVER_ACCESS'] = $personalOtp->canSendRequestRecoverAccess();
		}

		$arResult['IS_RECOVERY_CODES_ENABLED'] = (new OtpSettings())->isRecoveredCodesEnabled();

		$arResult['CURRENT_STEP'] = 'push';
		$request = \Bitrix\Main\Context::getCurrent()->getRequest();
		$currentStep = $request->getPost('CURRENT_STEP');

		if (in_array($currentStep, ['push', 'sms', 'email', 'recoveryCodes', 'applicationOfflineCode']))
		{
			$arResult['CURRENT_STEP'] = $currentStep;
		}

		if (Loader::includeModule('ui'))
		{
			$arResult['RECOVERY_CODES_HELP_LINK'] = \Bitrix\UI\Util::getArticleUrlByCode('26676294');
		}
	}
	else
	{
		if ($user)
		{
			$arResult['USER_DATA'] = [
				'login' => $user->getLogin(),
				'fullName' => $user->getFormattedName(),
				'photoUrl' => UserProfile::getUserPhoto($user->getPersonalPhoto(), 32),
			];
		}

		$arResult['ACCOUNT_CHANGE_URL'] = null;
		$intranetUser = new \Bitrix\Intranet\User($arResult['USER_ID']);

		if (AccountChanger::isAvailable($intranetUser))
		{
			$accountChangeConfiguration = (new AccountChanger($intranetUser))->getConfiguration();
			$arResult['ACCOUNT_CHANGE_URL'] = $accountChangeConfiguration['loginPath'];
		}
	}
}
