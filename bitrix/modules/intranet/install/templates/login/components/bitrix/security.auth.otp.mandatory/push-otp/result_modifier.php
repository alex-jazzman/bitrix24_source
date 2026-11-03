<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
{
	die;
}

use Bitrix\Intranet\Internal\Integration\Main\OtpSigner;
use Bitrix\Intranet\Internal\Integration\Security\OtpSettings;
use Bitrix\Intranet\Internal\Integration\Security\PersonalOtp;
use Bitrix\Intranet\Internal\Integration\Security\DeferredMandatoryLogin;
use Bitrix\Intranet\Internal\Service\Otp\MobilePush;
use Bitrix\Intranet\Repository\UserRepository;

$otp = (new OtpSettings());
$deferredParams = $otp->getDeferredParams();
$userId = (int)($deferredParams['USER_ID'] ?? 0);
$currentUser = $userId > 0 ? (new UserRepository())->getUserById($userId) : null;
if ($currentUser === null || $currentUser->getActive() === false)
{
	LocalRedirect($arParams['AUTH_LOGIN_URL'] ?? $APPLICATION->GetCurPageParam('login_form=yes', []));
}

$loginUrl = $arParams['AUTH_LOGIN_URL'] ?? $APPLICATION->GetCurPageParam('login_form=yes', []);
$successfulUrl = $arParams['SUCCESSFUL_URL'] ?? $APPLICATION->GetCurPageParam('', ['login_form']);
$redirectUrl = (new DeferredMandatoryLogin())->tryResumeLogin($loginUrl, $successfulUrl);
if ($redirectUrl !== null)
{
	LocalRedirect($redirectUrl);
}

$arResult['SIGNED_USER_ID'] = (new OtpSigner())->signUserId($currentUser->getId());
$personalOtp = new PersonalOtp($currentUser);
$pushOtp = MobilePush::createByDefault();
$arResult['END_MANDATORY_PERIOD'] = time();
$arResult['PROMOTE_MODE'] = $pushOtp->getPromoteMode()->value;
$arResult['PUSH_OTP_CONFIG'] = $personalOtp->getOtpConfig();
$arResult['DEEPLINK'] = $personalOtp->getDeeplink($arResult['PUSH_OTP_CONFIG']['intent']);
